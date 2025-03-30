from django.urls import re_path
from . import consumers

# WebSocket route for chat room (slug)
websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<slug>[\w-]+)/$', consumers.ChatConsumer.as_asgi()),
]