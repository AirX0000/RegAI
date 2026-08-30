import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from app.core.config import settings

# Sliding window rate limiter with IP & route granularity
# Supports general API limits and strict login brute-force protection
_ip_request_history = defaultdict(list)
_login_attempt_history = defaultdict(list)

def cleanup_old_requests(history: list, window_seconds: int, now: float) -> list:
    """Removes timestamps older than window_seconds."""
    cutoff = now - window_seconds
    return [ts for ts in history if ts > cutoff]

def check_rate_limit(request: Request):
    """
    General API rate limiting (default: 120 requests/minute per client IP)
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    # Respect X-Forwarded-For if behind reverse proxy / Nginx
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()

    now = time.time()
    window_seconds = 60
    max_requests = getattr(settings, "RATE_LIMIT_PER_MINUTE", 120)

    # Clean old requests
    _ip_request_history[client_ip] = cleanup_old_requests(_ip_request_history[client_ip], window_seconds, now)

    if len(_ip_request_history[client_ip]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a minute before making more requests."
        )

    _ip_request_history[client_ip].append(now)

def check_login_rate_limit(request: Request):
    """
    Strict brute-force protection for /auth/login endpoints.
    Allows maximum 10 attempts per minute per IP to prevent dictionary / credential stuffing attacks.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()

    now = time.time()
    window_seconds = 60
    max_login_attempts = 10

    _login_attempt_history[client_ip] = cleanup_old_requests(_login_attempt_history[client_ip], window_seconds, now)

    if len(_login_attempt_history[client_ip]) >= max_login_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please try again after 60 seconds."
        )

    _login_attempt_history[client_ip].append(now)
