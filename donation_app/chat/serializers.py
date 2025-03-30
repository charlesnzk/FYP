from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ChatRoom, ChatMessage, ChatTicket, ResolvedChatTicket

# Serializer for chat rooms
class ChatRoomSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    ticket_id = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'slug', 'description', 'is_group', 'created_by', 'created_by_username', 'participants', 'created_at', 'is_resolved', 'ticket_id']
        read_only_fields = ['id', 'created_by', 'participants', 'created_at', 'slug']
    
    def get_participants(self, obj):
        return [user.username for user in obj.participants.all()]

    def get_ticket_id(self, obj):
        if obj.tickets.exists():
            return obj.tickets.first().id
        return None

# Serializer for chat messages
class ChatMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    room_owner_id = serializers.IntegerField(source="room.created_by.id", read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'room', 'sender', 'sender_username', 'message', 'timestamp', 'updated_at', 'is_deleted', 'room_owner_id']
        read_only_fields = ['id', 'sender', 'timestamp', 'updated_at', 'is_deleted', 'room_owner_id']

# Serializer for creating and viewing chat tickets
class ChatTicketSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    chat_room = ChatRoomSerializer(read_only=True)
    
    class Meta:
        model = ChatTicket
        fields = ['id', 'sender', 'sender_username', 'subject', 'reason', 'status', 'created_at', 'updated_at', 'chat_room']
        read_only_fields = ['id', 'sender', 'created_at', 'updated_at', 'chat_room']

# Serializer for updating ticket status
class ChatTicketUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatTicket
        fields = ['status']

# Serializer for resolved chat tickets
class ResolvedChatTicketSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    chat_room = ChatRoomSerializer(read_only=True)

    class Meta:
        model = ResolvedChatTicket
        fields = ['id', 'sender', 'sender_username', 'subject', 'reason', 'chat_room', 'resolved_at']
        read_only_fields = ['id', 'sender', 'sender_username', 'chat_room', 'resolved_at']