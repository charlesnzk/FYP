from urllib.parse import unquote
from rest_framework import mixins, generics, permissions, status, filters, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import ChatRoom, ChatMessage, ChatTicket, ResolvedChatTicket
from .serializers import (
    ChatRoomSerializer, 
    ChatMessageSerializer, 
    ChatTicketSerializer, 
    ChatTicketUpdateSerializer,
    ResolvedChatTicketSerializer,
)
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .consumers import clean_room_name

# List chat rooms for current user
class ChatRoomListView(mixins.ListModelMixin, generics.GenericAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Exclude resolved chat rooms
    def get_queryset(self):
        return ChatRoom.objects.filter(participants=self.request.user, is_resolved=False)

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

# Create chat room
class CreateGroupChatRoomView(mixins.CreateModelMixin, generics.GenericAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if user.profile.role not in ['volunteer', 'moderator', 'superuser']:
            raise serializers.ValidationError("You are not allowed to create group chatrooms.")
        room = serializer.save(created_by=user, is_group=True)
        room.slug = clean_room_name(room.name)
        room.save()
        room.participants.add(user)
        members = self.request.data.get('members', '')
        if isinstance(members, str):
            members = [username.strip() for username in members.split(',') if username.strip()]
        if isinstance(members, list):
            for username in members:
                try:
                    member = User.objects.get(username=username)
                    room.participants.add(member)
                except User.DoesNotExist:
                    continue

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

# Retrieve, update, or delete chat room
class ChatRoomDetailView(mixins.RetrieveModelMixin,
                         mixins.UpdateModelMixin,
                         mixins.DestroyModelMixin,
                         generics.GenericAPIView):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        room = self.get_object()
        if request.user not in room.participants.all() and request.user.profile.role not in ['volunteer', 'moderator', 'superuser']:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        return self.retrieve(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        room = self.get_object()
        if room.is_group and request.user.profile.role not in ['volunteer', 'moderator', 'superuser']:
            return Response({"detail": "Not authorized to edit group chatrooms."}, status=status.HTTP_403_FORBIDDEN)
        if not room.is_group and request.user not in room.participants.all():
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        return self.partial_update(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        room = self.get_object()
        if room.is_group:
            if room.created_by == request.user:
                room.delete()
                return Response({"detail": "Group chat deleted."}, status=status.HTTP_200_OK)
            else:
                return Response({"detail": "Not authorized to delete group chatrooms."}, status=status.HTTP_403_FORBIDDEN)
        else:
            if (request.user not in room.participants.all()):
                return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
            room.delete()
            return Response({"detail": "Private chat deleted."}, status=status.HTTP_200_OK)

# Retrieve chat room by slug
class ChatRoomDetailBySlugView(generics.RetrieveAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'
    queryset = ChatRoom.objects.all()

# Add user to chat room
class AddMemberView(mixins.UpdateModelMixin, generics.GenericAPIView):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        room = self.get_object()
        if not room.is_group:
            return Response({"detail": "Cannot add members to a private chat."}, status=status.HTTP_400_BAD_REQUEST)
        if request.user.profile.role not in ['volunteer', 'moderator', 'superuser']:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        username = request.data.get('username')
        if not username:
            return Response({"detail": "username is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            new_member = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        room.participants.add(new_member)
        serializer = self.get_serializer(room)
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

# Remove user from chat room
class RemoveMemberView(mixins.UpdateModelMixin, generics.GenericAPIView):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        room = self.get_object()
        if not room.is_group:
            return Response({"detail": "Cannot remove members from a private chat."}, status=status.HTTP_400_BAD_REQUEST)
        if request.user.profile.role not in ['volunteer', 'moderator', 'superuser']:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        username = request.data.get('username')
        if not username:
            return Response({"detail": "username is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            member = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        room.participants.remove(member)
        serializer = self.get_serializer(room)
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

# Leave chat room
class LeaveChatRoomView(mixins.DestroyModelMixin, generics.GenericAPIView):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return ChatRoom.objects.get(id=self.kwargs['pk'])

    def delete(self, request, *args, **kwargs):
        room = self.get_object()
        room.participants.remove(request.user)
        if room.participants.count() == 0:
            room.delete()
            return Response({"detail": "Left and room deleted."}, status=status.HTTP_204_NO_CONTENT)
        return Response({"detail": "Left chat room."}, status=status.HTTP_200_OK)

# List and create chat messages
class ChatMessageListCreateView(mixins.ListModelMixin, mixins.CreateModelMixin, generics.GenericAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_param = self.request.query_params.get('room')
        if room_param:
            room_param = unquote(room_param)
            if room_param.isdigit():
                return ChatMessage.objects.filter(room__id=int(room_param)).order_by('timestamp')
            else:
                return ChatMessage.objects.filter(room__slug=room_param).order_by('timestamp')
        return ChatMessage.objects.none()

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    def perform_create(self, serializer):
        room_param = self.request.data.get('room')
        if not room_param:
            raise serializers.ValidationError("room is required.")
        room_param = unquote(room_param)
        if room_param.isdigit():
            try:
                room = ChatRoom.objects.get(id=int(room_param))
            except ChatRoom.DoesNotExist:
                raise serializers.ValidationError("Chat room not found.")
        else:
            try:
                room = ChatRoom.objects.get(slug=room_param)
            except ChatRoom.DoesNotExist:
                raise serializers.ValidationError("Chat room not found.")
        serializer.save(sender=self.request.user, room=room)

# Retrieve, update, or delete chat message
class ChatMessageDetailView(mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, generics.GenericAPIView):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        message_obj = self.get_object()
        if message_obj.sender != request.user:
            return Response({"detail": "Not authorized to edit this message."}, status=status.HTTP_403_FORBIDDEN)
        if request.data.get('delete'):
            message_obj.message = "Message was deleted."
            message_obj.is_deleted = True
            message_obj.save()
        else:
            new_message = request.data.get('message')
            if new_message is not None:
                message_obj.message = new_message
                message_obj.save()
        serializer = self.get_serializer(message_obj)
        channel_layer = get_channel_layer()
        group_name = f'chat_{message_obj.room.slug}'
        payload = {
            'type': 'chat_message_update',
            'id': message_obj.id,
            'message': message_obj.message,
            'username': message_obj.sender.username,
            'timestamp': message_obj.timestamp.isoformat(),
            'updated_at': message_obj.updated_at.isoformat(),
            'is_deleted': message_obj.is_deleted,
        }
        async_to_sync(channel_layer.group_send)(group_name, payload)
        return Response(serializer.data)

    def delete(self, request, *args, **kwargs):
        message_obj = self.get_object()
        if message_obj.sender != request.user and message_obj.room.created_by != request.user:
            return Response({"detail": "Not authorized to delete this message."}, status=status.HTTP_403_FORBIDDEN)
        return self.destroy(request, *args, **kwargs)

# Create new chat ticket
class CreateChatTicketView(mixins.CreateModelMixin, generics.GenericAPIView):
    serializer_class = ChatTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

# List chat tickets
class ChatTicketListView(mixins.ListModelMixin, generics.GenericAPIView):
    serializer_class = ChatTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.profile.role in ['volunteer', 'moderator', 'superuser']:
            return ChatTicket.objects.filter(status='pending')
        return ChatTicket.objects.filter(sender=user)

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

# Update chat ticket status
class UpdateChatTicketView(mixins.UpdateModelMixin, generics.GenericAPIView):
    queryset = ChatTicket.objects.all()
    serializer_class = ChatTicketUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        ticket = self.get_object()
        if request.user.profile.role not in ['volunteer', 'moderator', 'superuser']:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        ticket = serializer.save()
        new_status = serializer.validated_data.get('status')
        if new_status == 'accepted' and not ticket.chat_room:
            room_name = f"Ticket Chat: {ticket.subject} ({ticket.sender.username})"
            chat_room = ChatRoom.objects.create(
                name=room_name,
                is_group=False,
                created_by=self.request.user,
                description=f"Sender: {ticket.sender.username}\nSubject: {ticket.subject}\nReason: {ticket.reason}"
            )
            chat_room.slug = clean_room_name(chat_room.name)
            chat_room.save()
            chat_room.participants.add(ticket.sender)
            chat_room.participants.add(self.request.user)
            ticket.chat_room = chat_room
            ticket.save()
        elif new_status == 'resolved':
            if ticket.chat_room:
                ticket.chat_room.is_resolved = True
                ticket.chat_room.save()
            
            ResolvedChatTicket.objects.create(
                sender=ticket.sender,
                subject=ticket.subject,
                reason=ticket.reason,
                chat_room=ticket.chat_room
            )
            ticket.delete()

# List resolved chat tickets
class ResolvedChatTicketListView(mixins.ListModelMixin, generics.GenericAPIView):
    serializer_class = ResolvedChatTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.profile.role in ['volunteer', 'moderator', 'superuser']:
            return ResolvedChatTicket.objects.all()
        return ResolvedChatTicket.objects.filter(sender=user)

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

# One-to-one private chat view
class OneToOneChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        other_username = request.data.get('username')
        if not other_username:
            return Response({"detail": "username is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            other_user = User.objects.get(username=other_username)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        usernames = sorted([request.user.username, other_user.username])
        room_name = f"Private Chat: {usernames[0]} & {usernames[1]}"
        room, created = ChatRoom.objects.get_or_create(
            name=room_name,
            defaults={
                "is_group": False,
                "created_by": request.user,
            }
        )
        if not room.slug:
            room.slug = clean_room_name(room.name)
            room.save()
        room.participants.add(request.user)
        room.participants.add(other_user)
        return Response({
            "room_slug": room.slug,
            "created": created
        }, status=status.HTTP_200_OK)