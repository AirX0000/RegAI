from app.core.config import settings
import json

print(f"Raw CORS_ORIGINS type: {type(settings.CORS_ORIGINS)}")
print(f"Raw CORS_ORIGINS value: {settings.CORS_ORIGINS}")

if isinstance(settings.CORS_ORIGINS, list):
    print("Parsed as list: Yes")
    for origin in settings.CORS_ORIGINS:
        print(f" - {origin} (type: {type(origin)})")
else:
    print("Parsed as list: No")
