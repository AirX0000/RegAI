import logging
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import SessionLocal
from app.db.models.regulation import Regulation
from app.db.seeds.full_regulations_catalog import FULL_REGULATIONS_CATALOG

logger = logging.getLogger(__name__)

class RegulationAutoSeeder:
    def __init__(self, db: Session = None):
        self._external_db = db is not None
        self.db = db if db is not None else SessionLocal()

    def _compute_hash(self, content: str) -> str:
        return hashlib.sha256((content or "").strip().encode("utf-8")).hexdigest()

    def _parse_date(self, date_str: str):
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except Exception:
            try:
                return datetime.fromisoformat(date_str)
            except Exception:
                return None

    def seed_if_missing(self) -> Dict[str, Any]:
        """
        Check database against FULL_REGULATIONS_CATALOG and seed missing or update modified items.
        Safe to call multiple times (idempotent, deduplicated by code).
        """
        logger.info("RegulationAutoSeeder: Starting verification of regulations...")
        added_count = 0
        updated_count = 0
        skipped_count = 0
        errors = []

        try:
            # Query existing regulations indexed by code
            existing_regs = self.db.query(Regulation).all()
            existing_map: Dict[str, Regulation] = {
                (r.code.strip().upper() if r.code else ""): r 
                for r in existing_regs
            }

            for item in FULL_REGULATIONS_CATALOG:
                code_norm = (item.get("code") or "").strip().upper()
                if not code_norm:
                    continue

                content = item.get("content", "")
                content_hash = self._compute_hash(content)
                effective_date = self._parse_date(item.get("effective_date"))

                if code_norm in existing_map:
                    reg = existing_map[code_norm]
                    # Check if update is needed (content hash changed or empty fields filled)
                    needs_update = False
                    if not reg.content or reg.content_hash != content_hash:
                        reg.content = content
                        reg.content_hash = content_hash
                        needs_update = True
                    if item.get("category") and reg.category != item.get("category"):
                        reg.category = item.get("category")
                        needs_update = True
                    if item.get("title") and reg.title != item.get("title"):
                        reg.title = item.get("title")
                        needs_update = True
                    if item.get("jurisdiction") and not reg.jurisdiction:
                        reg.jurisdiction = item.get("jurisdiction")
                        needs_update = True
                    if item.get("workflow_steps") and not reg.workflow_steps:
                        reg.workflow_steps = item.get("workflow_steps")
                        needs_update = True
                    if item.get("source_url") and not reg.source_url:
                        reg.source_url = item.get("source_url")
                        needs_update = True
                    if effective_date and not reg.effective_date:
                        reg.effective_date = effective_date
                        needs_update = True

                    if needs_update:
                        reg.updated_at = datetime.now(timezone.utc)
                        updated_count += 1
                    else:
                        skipped_count += 1
                else:
                    # Create new global regulation
                    new_reg = Regulation(
                        code=item.get("code", "").strip(),
                        title=item.get("title", ""),
                        jurisdiction=item.get("jurisdiction", "Global"),
                        category=item.get("category", "General"),
                        content=content,
                        workflow_steps=item.get("workflow_steps", []),
                        content_hash=content_hash,
                        source_url=item.get("source_url", ""),
                        effective_date=effective_date,
                        tenant_id=None # Global regulation available to all companies
                    )
                    self.db.add(new_reg)
                    existing_map[code_norm] = new_reg
                    added_count += 1

            self.db.commit()
            total_active = self.db.query(Regulation).count()
            logger.info(f"RegulationAutoSeeder complete: added={added_count}, updated={updated_count}, skipped={skipped_count}, total={total_active}")
            return {
                "status": "success",
                "added": added_count,
                "updated": updated_count,
                "skipped": skipped_count,
                "total_regulations": total_active
            }
        except Exception as e:
            logger.error(f"RegulationAutoSeeder failed: {e}", exc_info=True)
            self.db.rollback()
            return {
                "status": "error",
                "message": str(e),
                "added": added_count,
                "updated": updated_count,
                "skipped": skipped_count
            }
        finally:
            if not self._external_db:
                self.db.close()

regulation_auto_seeder = RegulationAutoSeeder()
