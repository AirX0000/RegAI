from app.rag import retriever

# Mock a tenant ID (assuming user is using a specific tenant or global)
# In the code, search uses str(current_user.tenant_id)
# Let's try searching with a common query for ESG
try:
    # Try searching for "ESG"
    results = retriever.search_regulations("default", "ESG", limit=10)
    print(f"Search 'ESG' results: {len(results)}")
    for r in results:
        print(f"- {r['metadata'].get('title')} (Category: {r['metadata'].get('category')})")
        
    # Also try searching for *everything* to see if categories are populated
    print("\nChecking metadata of first 5 results:")
    all_results = retriever.search_regulations("default", "", limit=5)
    for r in all_results:
        print(f"- {r['metadata'].get('title')} (Category: {r['metadata'].get('category')})")

except Exception as e:
    print(f"Error: {e}")
