import time
from fastapi import Request, HTTPException, status
from app.core.config import settings

# Simple in-memory rate limiting for demonstration. 
# In production, use Redis.
_rate_limit_store = {}

def check_rate_limit(request: Request):
    client_ip = request.client.host
    now = time.time()
    
    # Cleanup old entries
    to_remove = []
    for ip, (timestamp, count) in _rate_limit_store.items():
        if now - timestamp > 60:
            to_remove.append(ip)
    for ip in to_remove:
        del _rate_limit_store[ip]
        
    if client_ip not in _rate_limit_store:
        _rate_limit_store[client_ip] = (now, 1)
    else:
        timestamp, count = _rate_limit_store[client_ip]
        if now - timestamp > 60:
            _rate_limit_store[client_ip] = (now, 1)
        else:
            if count >= settings.RATE_LIMIT_PER_MINUTE:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded"
                )
            _rate_limit_store[client_ip] = (timestamp, count + 1)
