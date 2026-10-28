from typing import List, Dict
from app.rag.vectorstore import get_collection
from app.rag.embeddings import get_embeddings_model

def search_regulations(tenant_id: str, query: str, limit: int = 5) -> List[Dict]:
    collection = get_collection(tenant_id)
    embeddings_model = get_embeddings_model()
    
    query_embedding = embeddings_model.embed_query(query)
    
    # Fetch more results to allow for keyword filtering since embeddings might be weak/mocked
    # Use max of limit and 50 to ensure we get enough results for filtering
    initial_limit = max(limit, 50)
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=initial_limit
    )
    
    # Format results
    formatted_results = []
    if results.get("ids") and len(results["ids"]) > 0:
        docs = results.get("documents", [[]])[0] if results.get("documents") else []
        metas = results.get("metadatas", [[]])[0] if results.get("metadatas") else []
        dists = results.get("distances", [[]])[0] if results.get("distances") else []
        for i in range(len(results["ids"][0])):
            formatted_results.append({
                "id": results["ids"][0][i],
                "content": docs[i] if i < len(docs) and docs[i] is not None else "",
                "metadata": metas[i] if (i < len(metas) and metas[i] is not None) else {},
                "distance": dists[i] if i < len(dists) else None
            })
            
    # Keyword-based Re-ranking and Snippet Extraction
    query_terms = [t.lower() for t in query.lower().split() if len(t) >= 2]
    q_clean = query.lower().strip()
    
    def calculate_score(doc):
        score = 0
        content_lower = (doc.get("content") or "").lower()
        meta = doc.get("metadata") or {}
        code_lower = str(meta.get("code") or "").lower()
        title_lower = str(meta.get("title") or "").lower()
        cat_lower = str(meta.get("category") or "").lower()
        jur_lower = str(meta.get("jurisdiction") or "").lower()
        
        # Exact phrase boosts
        if q_clean and q_clean in code_lower:
            score += 30
        if q_clean and q_clean in title_lower:
            score += 25

        # Full IFRS & IAS framework coverage
        is_ifrs_query = any(k in q_clean for k in ["ifrs", "ias", "мсфо", "mhxs"])
        is_ifrs_doc = code_lower.startswith("ifrs") or code_lower.startswith("ias") or "ifrs" in cat_lower or "мсфо" in title_lower or "ias" in title_lower
        if is_ifrs_query and is_ifrs_doc:
            score += 35

        matched_terms = 0
        for term in query_terms:
            term_matched = False
            if term in code_lower:
                score += 12
                term_matched = True
            if term in title_lower:
                score += 8
                term_matched = True
            if term in cat_lower:
                score += 6
                term_matched = True
            if term in jur_lower:
                score += 5
                term_matched = True
            if term in content_lower:
                # Add score based on term occurrences
                occurrences = min(content_lower.count(term), 5)
                score += occurrences * 2
                term_matched = True
            if term_matched:
                matched_terms += 1

        # Bonus if all terms match
        if query_terms and matched_terms == len(query_terms):
            score += 20

        return score

    # Sort by score descending
    formatted_results.sort(key=calculate_score, reverse=True)

    # Attach context snippet and matched fields
    for doc in formatted_results:
        content = doc.get("content") or ""
        content_lower = content.lower()
        meta = doc.setdefault("metadata", {})
        matched_fields = []
        
        for term in (query_terms or [q_clean]):
            if not term:
                continue
            if term in str(meta.get("title") or "").lower() and "title" not in matched_fields:
                matched_fields.append("title")
            if term in str(meta.get("code") or "").lower() and "code" not in matched_fields:
                matched_fields.append("code")
            if term in str(meta.get("category") or "").lower() and "category" not in matched_fields:
                matched_fields.append("category")
            if term in str(meta.get("jurisdiction") or "").lower() and "jurisdiction" not in matched_fields:
                matched_fields.append("jurisdiction")
            if term in content_lower and "content" not in matched_fields:
                matched_fields.append("content")

        snippet = ""
        # Find best snippet location in content
        best_pos = -1
        for term in query_terms:
            pos = content_lower.find(term)
            if pos != -1:
                best_pos = pos
                break

        if best_pos != -1:
            start = max(0, best_pos - 60)
            end = min(len(content), best_pos + 180)
            snippet = ("..." if start > 0 else "") + content[start:end].strip() + ("..." if end < len(content) else "")
        elif content:
            snippet = content[:220].strip() + ("..." if len(content) > 220 else "")

        doc["snippet"] = snippet
        doc["matched_fields"] = matched_fields
        meta["snippet"] = snippet
        meta["matched_fields"] = matched_fields
    
    # Return top N
    return formatted_results[:limit]

def query_rag(query: str, tenant_id: str, limit: int = 3) -> str:
    """Query RAG system and return text response"""
    results = search_regulations(tenant_id, query, limit)
    if results:
        return "\n".join([r["content"] for r in results])
    return "No relevant information found."
