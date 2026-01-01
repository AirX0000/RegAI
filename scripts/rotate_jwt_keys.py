import secrets

def generate_key():
    return secrets.token_urlsafe(32)

if __name__ == "__main__":
    print("Generating new SECRET_KEY...")
    print(f"SECRET_KEY={generate_key()}")
    print("\nUpdate this in your .env or Secrets Manager.")
