from rest_framework import mixins, generics, permissions, status, filters, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .serializers import (
    UserRegistrationSerializer, 
    UserProfileSerializer, 
    UserProfileFullUpdateSerializer,
    UserSerializer,
    PromoteUserSerializer,
    PostSerializer,
    FriendRequestSerializer,
)
from .models import Profile, Post, FriendRequest
from .permissions import IsModeratorOrSuperUser
from django.shortcuts import get_object_or_404

# Register new user
class UserRegistrationView(mixins.CreateModelMixin, generics.GenericAPIView):
    serializer_class = UserRegistrationSerializer

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

# Retrieve or update current user profile
class UserProfileDetailView(mixins.RetrieveModelMixin, mixins.UpdateModelMixin, generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileFullUpdateSerializer
        return UserProfileSerializer

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)
    
    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

# Retrieve public profile
class PublicProfileDetailView(mixins.RetrieveModelMixin, generics.GenericAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'

    def get_queryset(self):
        return Profile.objects.all()

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

# List all profiles (moderators/superusers)
class UserListView(mixins.ListModelMixin, generics.GenericAPIView):
    queryset = Profile.objects.all().order_by('user__username')
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsModeratorOrSuperUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['user__username', 'user__first_name', 'user__last_name']

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

# Promote user
class PromoteUserView(mixins.UpdateModelMixin, generics.GenericAPIView):
    queryset = User.objects.all()
    serializer_class = PromoteUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsModeratorOrSuperUser]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

# Send friend request
class SendFriendRequestView(mixins.CreateModelMixin, generics.GenericAPIView):
    serializer_class = FriendRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        from_profile = get_object_or_404(Profile, user=request.user)
        to_profile_id = request.data.get('to_profile_id')
        if not to_profile_id:
            return Response({"detail": "to_profile_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            to_profile = Profile.objects.get(id=to_profile_id)
        except Profile.DoesNotExist:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
        if FriendRequest.objects.filter(from_user=from_profile, to_user=to_profile).exists():
            return Response({"detail": "Friend request already sent."}, status=status.HTTP_400_BAD_REQUEST)
        friend_request = FriendRequest.objects.create(from_user=from_profile, to_user=to_profile)
        serializer = self.get_serializer(friend_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# Accept or reject friend request
class UpdateFriendRequestView(mixins.UpdateModelMixin, generics.GenericAPIView):
    queryset = FriendRequest.objects.all()
    serializer_class = FriendRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, *args, **kwargs):
        friend_request = self.get_object()
        if friend_request.to_user.user != request.user:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        status_value = request.data.get('status')
        if status_value not in ['accepted', 'rejected']:
            return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
        friend_request.status = status_value
        friend_request.save()
        if status_value == 'accepted':
            friend_request.from_user.friends.add(friend_request.to_user)
            friend_request.to_user.friends.add(friend_request.from_user)
        serializer = self.get_serializer(friend_request)
        return Response(serializer.data)

# List friend requests
class FriendRequestListView(mixins.ListModelMixin, generics.GenericAPIView):
    serializer_class = FriendRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        profile = get_object_or_404(Profile, user=self.request.user)
        return FriendRequest.objects.filter(to_user=profile, status='pending')
    
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

# List sent friend requests
class FriendRequestSentListView(mixins.ListModelMixin, generics.GenericAPIView):
    serializer_class = FriendRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        from_profile = get_object_or_404(Profile, user=self.request.user)
        return FriendRequest.objects.filter(from_user=from_profile, status='pending')
    
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

# Search users (exclude self)
class UserSearchView(mixins.ListModelMixin, generics.GenericAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'first_name', 'last_name']
    
    def get_queryset(self):
        return User.objects.exclude(id=self.request.user.id)
    
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
    
# Search chat
class ChatUserSearchView(mixins.ListModelMixin, generics.GenericAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'first_name', 'last_name']
    
    def get_queryset(self):
        qs = User.objects.exclude(id=self.request.user.id)
        if self.request.user.profile.role == 'donor':
            friend_ids = self.request.user.profile.friends.values_list('id', flat=True)
            qs = qs.filter(id__in=friend_ids)
        return qs
    
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

# List and create posts
class PostListCreateView(mixins.ListModelMixin, mixins.CreateModelMixin, generics.GenericAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        profile_id = self.request.query_params.get('profile_id')
        if profile_id:
            return Post.objects.filter(profile__id=profile_id).order_by('-created_at')
        return Post.objects.none()
    
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
    
    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        profile_id = self.request.data.get('profile_id')
        if not profile_id:
            raise serializers.ValidationError("profile_id is required.")
        try:
            profile = Profile.objects.get(id=profile_id)
        except Profile.DoesNotExist:
            raise serializers.ValidationError("Profile not found.")
        serializer.save(commenter=self.request.user, profile=profile)

# Retrieve, update, or delete post
class PostDetailView(mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, generics.GenericAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)
    
    def patch(self, request, *args, **kwargs):
        post = self.get_object()
        if post.commenter != request.user:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        return self.partial_update(request, *args, **kwargs)
    
    def delete(self, request, *args, **kwargs):
        post = self.get_object()
        if post.commenter != request.user and post.profile.user != request.user:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        return self.destroy(request, *args, **kwargs)

# Like post
class LikePostView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        user = request.user
        if user in post.liked_by.all():
            post.liked_by.remove(user)
        else:
            post.disliked_by.remove(user)
            post.liked_by.add(user)
        serializer = PostSerializer(post)
        return Response(serializer.data, status=200)

# Dislike post
class DislikePostView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        user = request.user
        if user in post.disliked_by.all():
            post.disliked_by.remove(user)
        else:
            post.liked_by.remove(user)
            post.disliked_by.add(user)
        serializer = PostSerializer(post)
        return Response(serializer.data, status=200)