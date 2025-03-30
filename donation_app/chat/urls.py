from django.urls import path
from .api import (
    ChatRoomListView,
    CreateGroupChatRoomView,
    ChatRoomDetailView,
    ChatRoomDetailBySlugView,
    AddMemberView,
    RemoveMemberView,
    LeaveChatRoomView,
    ChatMessageListCreateView,
    ChatMessageDetailView,
    CreateChatTicketView,
    ChatTicketListView,
    UpdateChatTicketView,
    ResolvedChatTicketListView,
    OneToOneChatView,
)

urlpatterns = [
    path('rooms/', ChatRoomListView.as_view(), name='chat-room-list'),
    path('rooms/create/', CreateGroupChatRoomView.as_view(), name='create-chat-room'),
    path('rooms/<int:pk>/', ChatRoomDetailView.as_view(), name='chat-room-detail'),
    path('rooms/detail/<slug:slug>/', ChatRoomDetailBySlugView.as_view(), name='chat-room-detail-by-slug'),
    path('rooms/<int:pk>/add-member/', AddMemberView.as_view(), name='add-member'),
    path('rooms/<int:pk>/remove-member/', RemoveMemberView.as_view(), name='remove-member'),
    path('rooms/<int:pk>/leave/', LeaveChatRoomView.as_view(), name='leave-chat-room'),
    path('messages/', ChatMessageListCreateView.as_view(), name='chat-message-list-create'),
    path('messages/<int:pk>/', ChatMessageDetailView.as_view(), name='chat-message-detail'),
    path('tickets/', ChatTicketListView.as_view(), name='chat-ticket-list'),
    path('tickets/create/', CreateChatTicketView.as_view(), name='create-chat-ticket'),
    path('tickets/<int:pk>/', UpdateChatTicketView.as_view(), name='update-chat-ticket'),
    path('tickets/resolved/', ResolvedChatTicketListView.as_view(), name='resolved-chat-ticket-list'),
    path('rooms/one-to-one/', OneToOneChatView.as_view(), name='one-to-one-chat'),
]