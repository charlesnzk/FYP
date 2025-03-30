import json
import re
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import ChatRoom, ChatMessage
from django.contrib.auth.models import User

# Clean up room name by replacing invalid characters
def clean_room_name(room_name):
    return re.sub(r'[^A-Za-z0-9_.-]', '_', room_name)[:90]

# WebSocket consumer for chat messaging
class ChatConsumer(AsyncWebsocketConsumer):
    # Handle WebSocket connection
    async def connect(self):
        self.room_slug = self.scope.get('url_route', {}).get('kwargs', {}).get('slug')
        if not self.room_slug or self.room_slug.lower() == "undefined":
            await self.close()
            return
        if not self.scope.get("user") or not self.scope["user"].is_authenticated:
            await self.close()
            return
        self.room_group_name = f'chat_{self.room_slug}'
        print(f"Attempting connection to room: {self.room_group_name}")
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    # Handle disconnection from WebSocket
    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            print(f"Disconnecting from room: {self.room_group_name}")
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    # Handle message receive from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message', '')
        username = self.scope["user"].username if self.scope["user"].is_authenticated else "Anonymous"
        chat_message = await self.create_chat_message(username, message)
        if chat_message:
            timestamp = chat_message.timestamp.isoformat()
            updated_at = chat_message.updated_at.isoformat()
            message_id = chat_message.id
        else:
            from datetime import datetime
            now = datetime.utcnow().isoformat() + "Z"
            timestamp = now
            updated_at = now
            message_id = None
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'id': message_id,
                'message': message,
                'username': username,
                'timestamp': timestamp,
                'updated_at': updated_at,
            }
        )

    # Handle sending chat message to WebSocket clients
    async def chat_message(self, event):
        payload = {
            'type': 'chat_message',
            'id': event.get('id'),
            'message': event.get('message'),
            'username': event.get('username'),
            'timestamp': event.get('timestamp', ''),
            'updated_at': event.get('updated_at', ''),
            'is_deleted': event.get('is_deleted', False),
        }
        await self.send(text_data=json.dumps(payload))

    # Handle broadcasting message updates
    async def chat_message_update(self, event):
        payload = {
            'type': 'chat_message_update',
            'id': event.get('id'),
            'message': event.get('message'),
            'username': event.get('username'),
            'timestamp': event.get('timestamp', ''),
            'updated_at': event.get('updated_at', ''),
            'is_deleted': event.get('is_deleted', False),
        }
        await self.send(text_data=json.dumps(payload))

    # Create chat message and save to database
    @sync_to_async
    def create_chat_message(self, username, message):
        clean_slug = clean_room_name(self.room_slug)
        try:
            room = ChatRoom.objects.get(slug=clean_slug)
        except ChatRoom.DoesNotExist:
            return None
        sender = self.scope["user"]
        if not sender or not sender.is_authenticated or not sender.id:
            return None
        try:
            sender = User.objects.get(pk=sender.id)
        except User.DoesNotExist:
            return None
        return ChatMessage.objects.create(room=room, sender=sender, message=message)