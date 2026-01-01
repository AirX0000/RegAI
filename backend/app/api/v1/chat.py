from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core import deps
from app.db.models.user import User
from app.rag.retriever import search_regulations

router = APIRouter()

class Message(BaseModel):
    role: str # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []

class ChatResponse(BaseModel):
    response: str
    sources: List[Dict[str, Any]] = []

@router.post("/", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Chat with the AI assistant about regulations.
    """
    # 1. Retrieve relevant context
    # In a real app, we might rephrase the query based on history
    context_docs = search_regulations(
        tenant_id=str(current_user.tenant_id),
        query=request.message,
        limit=3
    )
    
    # 2. Construct prompt (Mocked LLM)
    # In production, send this to OpenAI/Anthropic
    
    # 2. Construct prompt
    context_text = "\n\n".join([f"Document {i+1}:\n{doc['content']}" for i, doc in enumerate(context_docs)])
    
    from app.core.config import settings
    import openai

    if settings.OPENAI_API_KEY:
        try:
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            
            system_prompt = """You are an expert regulatory compliance assistant. 
            Answer the user's question based ONLY on the provided context documents. 
            If the answer is not in the context, say you don't know.
            Cite the document numbers (e.g. [1]) when referencing information."""
            
            user_prompt = f"""Context:
            {context_text}
            
            Question: {request.message}
            """
            
            completion = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3
            )
            
            response_text = completion.choices[0].message.content
        except Exception as e:
            print(f"OpenAI Error: {e}")
            # Fallback to mock
            response_text = _generate_mock_response(request.message, context_docs)
    else:
        # Mock response generation
        response_text = _generate_mock_response(request.message, context_docs)

    return ChatResponse(
        response=response_text,
        sources=context_docs
    )

def _generate_mock_response(query: str, context_docs: List[Dict]) -> str:
    if not context_docs:
        return "I couldn't find any specific regulations related to your query in the database. Please try searching for a specific regulation code or topic (e.g., 'IFRS 9', 'GDPR')."
    
    response_text = f"Based on the regulations found for **'{query}'**, here is the relevant information:\n\n"
    
    for i, doc in enumerate(context_docs):
        code = doc["metadata"].get("code", "Unknown")
        title = doc["metadata"].get("title", "")
        content_preview = doc["content"][:200] + "..." if len(doc["content"]) > 200 else doc["content"]
        
        response_text += f"### {i+1}. {code} - {title}\n"
        response_text += f"> {content_preview}\n\n"
        
    response_text += "\n**Summary:**\n"
    response_text += "The regulations above outline the specific compliance requirements. You should ensure your organization's policies align with these standards."
    return response_text

    return ChatResponse(
        response=response_text,
        sources=context_docs
    )
