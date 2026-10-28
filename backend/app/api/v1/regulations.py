from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc
import io
import uuid
from datetime import datetime

from app.core.deps import get_db, get_current_active_user
from app.db.models.regulation import Regulation
from app.db.schemas import regulation as regulation_schemas
from app.rag import ingest, retriever

router = APIRouter()

@router.post("/ingest", response_model=regulation_schemas.Regulation)
def ingest_regulation(
    *,
    db: Session = Depends(get_db),
    regulation_in: regulation_schemas.RegulationCreate,
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Ingest a new regulation.
    """
    # Check for duplicates by code
    existing = db.query(Regulation).filter(Regulation.code == regulation_in.code).first()
    if existing:
        # Check content hash
        new_hash = ingest.compute_content_hash(regulation_in.content)
        if existing.content_hash == new_hash:
            raise HTTPException(status_code=400, detail="Regulation already exists and content is unchanged")
        # Update existing
        existing.content_hash = new_hash
        existing.title = regulation_in.title
        # Re-ingest to RAG
        ingest.ingest_regulation(
            str(current_user.tenant_id), 
            regulation_in.code, 
            regulation_in.content,
            {"title": regulation_in.title, "jurisdiction": regulation_in.jurisdiction}
        )
        db.commit()
        db.refresh(existing)
        return existing

    # Create new
    content_hash = ingest.ingest_regulation(
        str(current_user.tenant_id), 
        regulation_in.code, 
        regulation_in.content,
        {"title": regulation_in.title, "jurisdiction": regulation_in.jurisdiction}
    )
    
    regulation = Regulation(
        code=regulation_in.code,
        title=regulation_in.title,
        jurisdiction=regulation_in.jurisdiction,
        source_url=regulation_in.source_url,
        effective_date=regulation_in.effective_date,
        content_hash=content_hash,
        tenant_id=current_user.tenant_id # or None if global admin
    )
    db.add(regulation)
    db.commit()
    db.refresh(regulation)
    return regulation

@router.get("/search", response_model=List[dict])
@router.get("/search/", response_model=List[dict])
def search_regulations(
    query: str,
    limit: int = 200,  # Increased from 50 to show all regulations
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Search regulations using RAG.
    """
    try:
        results = []
        is_empty_query = not query or not query.strip()

        if not is_empty_query:
            try:
                results = retriever.search_regulations(str(current_user.tenant_id), query, limit)
            except Exception as rag_err:
                print(f"RAG search notice: {rag_err}, falling back to SQL regulations search")
                results = []

        # If query is empty, or RAG returned no results, query SQL regulations table directly
        if not results:
            sql_query = db.query(Regulation)
            if current_user.tenant_id:
                sql_query = sql_query.filter(
                    or_(
                        Regulation.tenant_id == current_user.tenant_id,
                        Regulation.tenant_id == None
                    )
                )

            query_clean = query.strip() if query else ""
            words = [w for w in query_clean.split() if len(w) >= 2]
            q_lower = query_clean.lower()
            is_ifrs_query = any(k in q_lower for k in ["ifrs", "ias", "мсфо", "mhxs"])

            if not is_empty_query:
                # 1. If searching generically for IFRS / IAS / МСФО, match all IFRS and IAS standards
                if is_ifrs_query and len(words) <= 1:
                    regs = sql_query.filter(
                        or_(
                            Regulation.code.ilike("%IFRS%"),
                            Regulation.code.ilike("%IAS%"),
                            Regulation.category.ilike("%IFRS%"),
                            Regulation.title.ilike("%МСФО%"),
                            Regulation.title.ilike("%IFRS%"),
                            Regulation.title.ilike("%IAS%")
                        )
                    ).all()
                # 2. Try multi-word AND match first if multiple terms are present
                elif len(words) > 1:
                    term_filters = []
                    for w in words:
                        w_like = f"%{w}%"
                        term_filters.append(
                            or_(
                                Regulation.title.ilike(w_like),
                                Regulation.code.ilike(w_like),
                                Regulation.category.ilike(w_like),
                                Regulation.jurisdiction.ilike(w_like),
                                Regulation.content.ilike(w_like)
                            )
                        )
                    matched_regs = sql_query.filter(and_(*term_filters)).all()
                    if matched_regs:
                        regs = matched_regs
                    else:
                        regs = sql_query.filter(or_(*term_filters)).all()
                else:
                    q_like = f"%{query_clean}%"
                    regs = sql_query.filter(
                        or_(
                            Regulation.title.ilike(q_like),
                            Regulation.code.ilike(q_like),
                            Regulation.category.ilike(q_like),
                            Regulation.jurisdiction.ilike(q_like),
                            Regulation.content.ilike(q_like)
                        )
                    ).all()
            else:
                regs = sql_query.order_by(Regulation.code.asc()).limit(limit).all()

            # Rank and enrich with snippets and matched_fields
            scored_items = []
            for r in regs:
                content = r.content or r.title or ""
                content_lower = content.lower()
                title_lower = (r.title or "").lower()
                code_lower = (r.code or "").lower()
                cat_lower = (r.category or "").lower()
                jur_lower = (r.jurisdiction or "").lower()

                score = 0
                matched_fields = []
                check_terms = words if words else ([query_clean.lower()] if query_clean else [])

                # Boost exact IFRS/IAS standard match
                if is_ifrs_query and (code_lower.startswith("ifrs") or code_lower.startswith("ias") or "ifrs" in cat_lower or "мсфо" in title_lower or "ias" in title_lower):
                    score += 40
                    if "category" not in matched_fields:
                        matched_fields.append("category")

                if query_clean.lower() in code_lower:
                    score += 35
                if query_clean.lower() in title_lower:
                    score += 30

                for t in check_terms:
                    tl = t.lower()
                    if tl in code_lower:
                        score += 15
                        if "code" not in matched_fields:
                            matched_fields.append("code")
                    if tl in title_lower:
                        score += 10
                        if "title" not in matched_fields:
                            matched_fields.append("title")
                    if tl in cat_lower:
                        score += 8
                        if "category" not in matched_fields:
                            matched_fields.append("category")
                    if tl in jur_lower:
                        score += 7
                        if "jurisdiction" not in matched_fields:
                            matched_fields.append("jurisdiction")
                    if tl in content_lower:
                        score += min(content_lower.count(tl), 5) * 3
                        if "content" not in matched_fields:
                            matched_fields.append("content")

                # Extract context snippet around match
                snippet = ""
                best_pos = -1
                for t in check_terms:
                    pos = content_lower.find(t.lower())
                    if pos != -1:
                        best_pos = pos
                        break

                if best_pos != -1:
                    start = max(0, best_pos - 60)
                    end = min(len(content), best_pos + 180)
                    snippet = ("..." if start > 0 else "") + content[start:end].strip() + ("..." if end < len(content) else "")
                else:
                    snippet = content[:250].strip() + ("..." if len(content) > 250 else "")

                scored_items.append({
                    "score": score,
                    "item": {
                        "id": str(r.id),
                        "content": content,
                        "snippet": snippet,
                        "matched_fields": matched_fields,
                        "metadata": {
                            "id": str(r.id),
                            "code": r.code or "",
                            "title": r.title or "",
                            "category": r.category or "General",
                            "jurisdiction": r.jurisdiction or "Global",
                            "effective_date": r.effective_date.strftime("%Y-%m-%d") if r.effective_date else "",
                            "source_url": r.source_url or "",
                            "snippet": snippet,
                            "matched_fields": matched_fields,
                            "summary": snippet or (r.content[:300] if r.content else (r.title or "")),
                            "description": r.content or r.title or "",
                            "workflow_steps": r.workflow_steps or []
                        }
                    }
                })

            if not is_empty_query:
                scored_items.sort(key=lambda x: x["score"], reverse=True)
            results = [s["item"] for s in scored_items[:limit]]

        # Enrich with subscription status if user has a company
        if current_user.company_id and results:
            from app.db.models.link_company_regulation import LinkCompanyRegulation
            import uuid
            
            # Use metadata ID which is the real UUID, not the ChromaDB ID (e.g. "GDPR_0")
            reg_ids = []
            for r in results:
                try:
                    reg_id_str = r.get("metadata", {}).get("id") or r.get("id")
                    if reg_id_str:
                        reg_ids.append(uuid.UUID(reg_id_str))
                except (ValueError, TypeError):
                    continue

            subscriptions = db.query(LinkCompanyRegulation).filter(
                LinkCompanyRegulation.company_id == current_user.company_id,
                LinkCompanyRegulation.regulation_id.in_(reg_ids)
            ).all()
            
            subscribed_ids = {str(s.regulation_id) for s in subscriptions}
            
            for r in results:
                r_id = r.get("metadata", {}).get("id") or r.get("id")
                r["is_subscribed"] = r_id in subscribed_ids
        else:
            for r in results:
                r["is_subscribed"] = False
                
        return results
    except Exception as e:
        import traceback
        print(f"Error searching regulations: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/{regulation_id}/subscribe")
def subscribe_regulation(
    regulation_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Subscribe to a regulation (link it to the user's company).
    """
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company to subscribe")
        
    try:
        reg_uuid = uuid.UUID(regulation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid regulation ID")
        
    # Check if regulation exists (optional, but good practice. For now assuming ID from RAG is valid or checking DB)
    # strictly speaking we should check if it exists in 'regulations' table, but RAG IDs should match DB IDs.
    from app.db.models.regulation import Regulation
    from app.db.models.link_company_regulation import LinkCompanyRegulation
    
    reg = db.query(Regulation).filter(Regulation.id == reg_uuid).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Regulation not found")
        
    # Check if already subscribed
    existing = db.query(LinkCompanyRegulation).filter(
        LinkCompanyRegulation.company_id == current_user.company_id,
        LinkCompanyRegulation.regulation_id == reg_uuid
    ).first()
    
    if existing:
        return {"message": "Already subscribed"}
        
    # Create link
    link = LinkCompanyRegulation(
        company_id=current_user.company_id,
        regulation_id=reg_uuid,
        tenant_id=current_user.tenant_id
    )
    db.add(link)
    db.commit()
    
    return {"message": "Subscribed successfully"}


@router.delete("/{regulation_id}/subscribe")
def unsubscribe_regulation(
    regulation_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Unsubscribe from a regulation.
    """
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must belong to a company to unsubscribe")

    try:
        reg_uuid = uuid.UUID(regulation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid regulation ID")
        
    from app.db.models.link_company_regulation import LinkCompanyRegulation
    
    # Delete link
    result = db.query(LinkCompanyRegulation).filter(
        LinkCompanyRegulation.company_id == current_user.company_id,
        LinkCompanyRegulation.regulation_id == reg_uuid
    ).delete()
    
    db.commit()
    
    if result == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    return {"message": "Unsubscribed successfully"}

@router.api_route("/auto-seed", methods=["POST"])
@router.api_route("/auto-seed/", methods=["POST"])
def auto_seed_regulations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Manually trigger automatic seeding of all official regulations and normatives.
    """
    from app.services.regulation_auto_seeder import RegulationAutoSeeder
    seeder = RegulationAutoSeeder(db)
    result = seeder.seed_if_missing()
    return result

@router.api_route("/refresh", methods=["GET", "POST"])
@router.api_route("/refresh/", methods=["GET", "POST"])
def refresh_regulations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Manually trigger regulation update check and auto-sync missing normatives.
    """
    from app.services.regulation_auto_seeder import RegulationAutoSeeder
    from app.services.regulation_updater import RegulationUpdaterService
    
    # 1. First ensure all base/new catalog regulations are seeded
    seeder = RegulationAutoSeeder(db)
    seed_result = seeder.seed_if_missing()

    # 2. Check for content revisions / updates
    updater = RegulationUpdaterService(db)
    update_result = updater.check_for_updates()
    
    return {
        "status": "success",
        "added": seed_result.get("added", 0),
        "updated": seed_result.get("updated", 0) + update_result.get("updated_count", 0),
        "skipped": seed_result.get("skipped", 0),
        "total_regulations": seed_result.get("total_regulations", 0)
    }

@router.get("/crawler/status")
@router.get("/crawler/status/")
def get_crawler_status(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Get current crawler engine status, monitored sources, and last crawl stats.
    """
    from app.services.regulation_crawler import RegulationCrawlerService
    crawler = RegulationCrawlerService(db)
    return crawler.get_crawler_status()

@router.get("/crawler/sources")
@router.get("/crawler/sources/")
def get_crawler_sources(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Get list of all official regulatory web sources and portals monitored by the crawler.
    """
    from app.services.regulation_crawler import RegulationCrawlerService
    crawler = RegulationCrawlerService(db)
    return crawler.get_sources()

@router.get("/crawler/sections")
@router.get("/crawler/sections/")
def get_crawler_sections(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Get all regulatory sections / sectors (standard predefined + custom user sections).
    """
    from app.services.regulation_crawler import RegulationCrawlerService
    crawler = RegulationCrawlerService(db)
    return crawler.get_sections()

@router.post("/crawler/sections")
@router.post("/crawler/sections/")
def add_custom_crawler_section(
    section_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Add a new user-defined custom section / legal domain for monitoring.
    """
    from app.services.regulation_crawler import RegulationCrawlerService
    crawler = RegulationCrawlerService(db)
    return crawler.add_custom_section(section_data)

@router.delete("/crawler/sections/{section_id}")
def delete_custom_crawler_section(
    section_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Remove a custom regulatory section.
    """
    from app.services.regulation_crawler import RegulationCrawlerService
    crawler = RegulationCrawlerService(db)
    deleted = crawler.delete_custom_section(section_id)
    return {"status": "success", "deleted": deleted}

@router.get("/crawler/discovered")
@router.get("/crawler/discovered/")
def get_discovered_regulations(
    jurisdiction: Optional[str] = None,
    section_id: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Get list of newly discovered regulations from the web.
    """
    from app.services.regulation_crawler import RegulationCrawlerService
    crawler = RegulationCrawlerService(db)
    return crawler.get_discovered_regulations(
        jurisdiction=jurisdiction, 
        section_id=section_id, 
        category=category
    )

@router.post("/crawler/start")
@router.post("/crawler/start/")
@router.post("/crawl")
@router.post("/crawl/")
def start_crawler_scan(
    jurisdiction: Optional[str] = None,
    section_id: Optional[str] = None,
    category: Optional[str] = None,
    source_id: Optional[str] = None,
    custom_query: Optional[str] = None,
    auto_import: bool = False,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Launch active crawler scan across the internet (official portals, gazettes, standard setters).
    """
    from app.services.regulation_crawler import RegulationCrawlerService
    crawler = RegulationCrawlerService(db)
    result = crawler.crawl_web(
        jurisdiction=jurisdiction, 
        section_id=section_id,
        category=category,
        source_id=source_id, 
        custom_query=custom_query,
        auto_import=auto_import
    )
    return result

@router.post("/crawler/import")
@router.post("/crawler/import/")
def import_crawled_regulations(
    data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Import selected discovered regulations into the database registry.
    """
    codes = data.get("codes", [])
    from app.services.regulation_crawler import RegulationCrawlerService
    crawler = RegulationCrawlerService(db)
    result = crawler.import_regulations(codes)
    return result

@router.post("/{regulation_id}/analyze-impact")
def analyze_regulation_impact(
    regulation_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Analyze the impact of a regulation on the current user's company using AI.
    """
    from app.services.impact_service import ImpactService
    
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must be associated with a company")
    
    service = ImpactService(db)
    try:
        analysis = service.analyze_impact(regulation_id, str(current_user.company_id))
        return analysis
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/{regulation_id}/impact")
def get_regulation_impact(
    regulation_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Get existing impact analysis for a regulation (if available).
    """
    from app.db.models.impact_analysis import RegulationImpact
    import json
    
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User must be associated with a company")
    
    impact = db.query(RegulationImpact).filter(
        RegulationImpact.regulation_id == regulation_id,
        RegulationImpact.company_id == current_user.company_id
    ).first()
    
    if not impact:
        return {"exists": False}
    
    return {
        "exists": True,
        "impact_score": impact.impact_score,
        "summary": impact.summary,
        "action_items": json.loads(impact.action_items) if impact.action_items else [],
        "created_at": impact.created_at
    }

@router.get("/list", response_model=List[regulation_schemas.Regulation])
def list_regulations(
    jurisdiction: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    List all regulations with filtering and sorting options.
    """
    query = db.query(Regulation)
    
    # Apply tenant filtering
    if current_user.tenant_id:
        query = query.filter(
            or_(
                Regulation.tenant_id == current_user.tenant_id,
                Regulation.tenant_id == None  # Global regulations
            )
        )
    
    # Apply filters
    if jurisdiction:
        query = query.filter(Regulation.jurisdiction == jurisdiction)
    
    if category:
        # Assuming category is stored in metadata or as a field
        # For now, we'll skip this as the model doesn't have category field
        pass
    
    if search:
        query = query.filter(
            or_(
                Regulation.title.ilike(f"%{search}%"),
                Regulation.code.ilike(f"%{search}%")
            )
        )
    
    # Apply sorting
    if sort_by == "title":
        query = query.order_by(asc(Regulation.title) if sort_order == "asc" else desc(Regulation.title))
    elif sort_by == "code":
        query = query.order_by(asc(Regulation.code) if sort_order == "asc" else desc(Regulation.code))
    elif sort_by == "jurisdiction":
        query = query.order_by(asc(Regulation.jurisdiction) if sort_order == "asc" else desc(Regulation.jurisdiction))
    elif sort_by == "effective_date":
        query = query.order_by(asc(Regulation.effective_date) if sort_order == "asc" else desc(Regulation.effective_date))
    else:  # default to created_at
        query = query.order_by(asc(Regulation.created_at) if sort_order == "asc" else desc(Regulation.created_at))
    
    # Apply pagination
    regulations = query.offset(skip).limit(limit).all()
    
    return regulations

@router.get("/jurisdictions")
@router.get("/jurisdictions/")
def get_jurisdictions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Get list of unique jurisdictions.
    """
    query = db.query(Regulation.jurisdiction).distinct()
    
    if current_user.tenant_id:
        query = query.filter(
            or_(
                Regulation.tenant_id == current_user.tenant_id,
                Regulation.tenant_id == None
            )
        )
    
    jurisdictions = [j[0] for j in query.all() if j[0]]
    return {"jurisdictions": sorted(jurisdictions)}

@router.get("/export/excel")
def export_regulations_excel(
    jurisdiction: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Export regulations to Excel file.
    """
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Font, PatternFill, Alignment
    except ImportError:
        raise HTTPException(status_code=500, detail="openpyxl not installed")
    
    # Get regulations with filters
    query = db.query(Regulation)
    
    if current_user.tenant_id:
        query = query.filter(
            or_(
                Regulation.tenant_id == current_user.tenant_id,
                Regulation.tenant_id == None
            )
        )
    
    if jurisdiction:
        query = query.filter(Regulation.jurisdiction == jurisdiction)
    
    if search:
        query = query.filter(
            or_(
                Regulation.title.ilike(f"%{search}%"),
                Regulation.code.ilike(f"%{search}%")
            )
        )
    
    regulations = query.all()
    
    # Create workbook
    wb = Workbook()
    ws = wb.active
    if ws is None:
        ws = wb.create_sheet()
    ws.title = "Regulations"
    
    # Header style
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF")
    
    # Headers
    headers = ["Code", "Title", "Jurisdiction", "Effective Date", "Source URL", "Created At"]
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
    
    # Data
    for row_idx, reg in enumerate(regulations, 2):
        ws.cell(row=row_idx, column=1, value=reg.code)
        ws.cell(row=row_idx, column=2, value=reg.title)
        ws.cell(row=row_idx, column=3, value=reg.jurisdiction or "")
        ws.cell(row=row_idx, column=4, value=reg.effective_date.strftime("%Y-%m-%d") if reg.effective_date else "")
        ws.cell(row=row_idx, column=5, value=reg.source_url or "")
        ws.cell(row=row_idx, column=6, value=reg.created_at.strftime("%Y-%m-%d %H:%M") if reg.created_at else "")
    
    # Adjust column widths
    ws.column_dimensions['A'].width = 15
    ws.column_dimensions['B'].width = 50
    ws.column_dimensions['C'].width = 20
    ws.column_dimensions['D'].width = 15
    ws.column_dimensions['E'].width = 40
    ws.column_dimensions['F'].width = 20
    
    # Save to BytesIO
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    # Return as downloadable file
    filename = f"regulations_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/pdf")
def export_regulations_pdf(
    jurisdiction: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Export regulations to PDF file.
    """
    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
        from reportlab.lib.units import inch
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        import os
    except ImportError:
        raise HTTPException(status_code=500, detail="reportlab not installed")

    # Register Unicode font for Cyrillic / Uzbek support
    pdf_font = "Helvetica"
    pdf_font_bold = "Helvetica-Bold"
    candidate_fonts = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf"
    ]
    candidate_fonts_bold = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf"
    ]
    for font_path in candidate_fonts:
        if os.path.exists(font_path):
            try:
                pdfmetrics.registerFont(TTFont("RegAIUnicodeFont", font_path))
                pdf_font = "RegAIUnicodeFont"
                break
            except Exception:
                pass

    for font_path_b in candidate_fonts_bold:
        if os.path.exists(font_path_b):
            try:
                pdfmetrics.registerFont(TTFont("RegAIUnicodeFontBold", font_path_b))
                pdf_font_bold = "RegAIUnicodeFontBold"
                break
            except Exception:
                pass

    if pdf_font_bold == "Helvetica-Bold" and pdf_font != "Helvetica":
        pdf_font_bold = pdf_font
    
    # Get regulations with filters
    query = db.query(Regulation)
    
    if current_user.tenant_id:
        query = query.filter(
            or_(
                Regulation.tenant_id == current_user.tenant_id,
                Regulation.tenant_id == None
            )
        )
    
    if jurisdiction:
        query = query.filter(Regulation.jurisdiction == jurisdiction)
    
    if search:
        query = query.filter(
            or_(
                Regulation.title.ilike(f"%{search}%"),
                Regulation.code.ilike(f"%{search}%")
            )
        )
    
    regulations = query.all()
    
    # Create PDF
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=A4)
    elements = []
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontName=pdf_font_bold,
        fontSize=20,
        textColor=colors.HexColor('#4472C4'),
        spaceAfter=20,
    )
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName=pdf_font,
        fontSize=10,
        textColor=colors.HexColor('#666666')
    )
    
    # Title
    elements.append(Paragraph("Regulations & Compliance Export (RegAI)", title_style))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", meta_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Table data
    data = [["Code", "Title", "Jurisdiction", "Effective Date"]]
    for reg in regulations:
        title_str = reg.title or ""
        if pdf_font == "Helvetica":
            # Fallback if no TTF installed: encode safely without crashing
            title_str = title_str.encode("latin-1", "replace").decode("latin-1")
        short_title = title_str[:70] + "..." if len(title_str) > 70 else title_str
        data.append([
            reg.code or "REG",
            short_title,
            reg.jurisdiction or "",
            reg.effective_date.strftime("%Y-%m-%d") if reg.effective_date else ""
        ])
    
    # Create table
    table = Table(data, colWidths=[1.3*inch, 3.7*inch, 1.2*inch, 1.1*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4472C4')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), pdf_font_bold),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8FAFC')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('FONTNAME', (0, 1), (-1, -1), pdf_font),
        ('FONTSIZE', (0, 1), (-1, -1), 8.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F1F5F9')]),
    ]))
    
    elements.append(table)
    
    # Build PDF
    doc.build(elements)
    output.seek(0)
    
    # Return as downloadable file
    filename = f"regulations_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
