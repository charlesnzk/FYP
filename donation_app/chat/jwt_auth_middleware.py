import jwt
from django.conf import settings
from django.contrib.auth.models import AnonymousUser, User
from channels.db import database_sync_to_async
from urllib.parse import parse_qs

# Get user instance
@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

# JWT authentication middleware
class JwtAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        headers = dict(scope.get("headers") or [])
        token = None
        if b"authorization" in headers:
            auth_header = headers[b"authorization"].decode("utf8")
            if auth_header.startswith("Bearer "):
                token = auth_header.split("Bearer ")[1]
        if not token:
            query_string = scope.get("query_string", b"").decode("utf8")
            qs = parse_qs(query_string)
            token = qs.get("token", [None])[0]
        if token:
            try:
                decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                user_id = decoded_data.get("user_id")
                scope["user"] = await get_user(user_id)
            except Exception:
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()
        return await self.inner(scope, receive, send)

# Wrap middleware in the Channels stack
def JwtAuthMiddlewareStack(inner):
    return JwtAuthMiddleware(inner)