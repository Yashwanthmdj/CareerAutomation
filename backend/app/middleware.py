from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from .security import decode_access_token


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.user_id = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "", 1).strip()
            payload = decode_access_token(token)
            if payload and payload.get("sub"):
                request.state.user_id = str(payload["sub"])
        return await call_next(request)

