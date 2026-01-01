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
    if results["ids"]:
        for i in range(len(results["ids"][0])):
            formatted_results.append({
                "id": results["ids"][0][i],
                "content": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "distance": results["distances"][0][i] if results["distances"] else None
            })
            
    # Keyword-based Re-ranking (Simple fallback for mock embeddings)
    # If the query terms appear in the content or code, boost the score
    query_terms = query.lower().split()
    
    def calculate_score(doc):
        score = 0
        content_lower = doc["content"].lower()
        code_lower = doc["metadata"].get("code", "").lower()
        title_lower = doc["metadata"].get("title", "").lower()
        
        for term in query_terms:
            if term in code_lower:
                score += 10 # High boost for code match (e.g. "IFRS")
            if term in title_lower:
                score += 5
            if term in content_lower:
                score += 1
        return score

    # Sort by score descending
    formatted_results.sort(key=calculate_score, reverse=True)
    
    # Return top N
    return formatted_results[:limit]

def query_rag(query: str, tenant_id: str, limit: int = 3) -> str:
    """Query RAG system and return text response"""
    results = search_regulations(tenant_id, query, limit)
    if results:
        return "\n".join([r["content"] for r in results])
    return "No relevant information found."
