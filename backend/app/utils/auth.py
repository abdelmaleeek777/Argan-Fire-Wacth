"""JWT authentication middleware."""

import os
import hashlib
import hmac
import json
import time
from functools import wraps

from flask import request, jsonify


JWT_SECRET = os.getenv("JWT_SECRET_KEY", "jwt-default-secret")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))


def _base64url_encode(data: bytes) -> str:
    import base64
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(s: str) -> bytes:
    import base64
    padding = 4 - len(s) % 4
    s += "=" * padding
    return base64.urlsafe_b64decode(s)


def generate_token(user_id, role="user"):
    """Generate a simple HMAC-SHA256 JWT."""
    header = _base64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _base64url_encode(json.dumps({
        "user_id": user_id,
        "role": role,
        "exp": int(time.time()) + JWT_EXPIRATION_HOURS * 3600,
    }).encode())
    signature = _base64url_encode(
        hmac.new(JWT_SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
    )
    return f"{header}.{payload}.{signature}"


def decode_token(token):
    """Decode and verify a JWT. Returns payload dict or None."""
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
        expected_sig = _base64url_encode(
            hmac.new(JWT_SECRET.encode(), f"{header_b64}.{payload_b64}".encode(), hashlib.sha256).digest()
        )
        if not hmac.compare_digest(expected_sig, signature_b64):
            return None
        payload = json.loads(_base64url_decode(payload_b64))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


def token_required(f):
    """Decorator — protect a route with JWT authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)
        if payload is None:
            return jsonify({"error": "Invalid or expired token"}), 401

        request.current_user = payload
        return f(*args, **kwargs)
    return decorated
