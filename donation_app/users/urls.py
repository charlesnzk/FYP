from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .api import (
    UserRegistrationView, 
    UserProfileDetailView, 
    PublicProfileDetailView,
    UserListView, 
    PromoteUserView,
    SendFriendRequestView,
    UpdateFriendRequestView,
    FriendRequestListView,
    FriendRequestSentListView,
    UserSearchView,
    ChatUserSearchView,
    PostListCreateView,
    PostDetailView,
    LikePostView,
    DislikePostView,
)


urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileDetailView.as_view(), name='profile-detail'),
    path('public-profile/<int:id>/', PublicProfileDetailView.as_view(), name='public-profile-detail'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('promote/<int:pk>/', PromoteUserView.as_view(), name='promote-user'),
    path('friend-request/', SendFriendRequestView.as_view(), name='send-friend-request'),
    path('friend-request/<int:pk>/', UpdateFriendRequestView.as_view(), name='update-friend-request'),
    path('friend-requests/', FriendRequestListView.as_view(), name='friend-request-list'),
    path('friend-request-sent/', FriendRequestSentListView.as_view(), name='friend-request-sent'),
    path('search/', UserSearchView.as_view(), name='user-search'),
    path('chat-search/', ChatUserSearchView.as_view(), name='chat-search'),
    path('posts/', PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:pk>/like/', LikePostView.as_view(), name='like-post'),
    path('posts/<int:pk>/dislike/', DislikePostView.as_view(), name='dislike-post'),
]