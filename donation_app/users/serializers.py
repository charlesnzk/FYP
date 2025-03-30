from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile, Post, FriendRequest, ROLE_CHOICES

# Serializer for user registration
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm Password")
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password', 'password2')
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords must match.")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

# Serializer for posts
class PostSerializer(serializers.ModelSerializer):
    commenter_username = serializers.CharField(source='commenter.username', read_only=True)
    profile_user_id = serializers.IntegerField(source="profile.id", read_only=True)
    likes_count = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'commenter', 'commenter_username', 'profile_user_id',
            'text', 'created_at', 'updated_at', 'likes_count', 'dislikes_count'
        ]
        read_only_fields = [
            'id', 'commenter', 'profile', 'created_at', 'updated_at', 'likes_count', 'dislikes_count'
        ]

    def get_likes_count(self, obj):
        return obj.liked_by.count()

    def get_dislikes_count(self, obj):
        return obj.disliked_by.count()

# Serializer for friend requests
class FriendRequestSerializer(serializers.ModelSerializer):
    from_username = serializers.CharField(source='from_user.user.username', read_only=True)
    to_username = serializers.CharField(source='to_user.user.username', read_only=True)
    
    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'from_username', 'to_user', 'to_username', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

# Serializer for retrieving or updating user profile
class UserProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    friends = serializers.SerializerMethodField()
    posts = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = [
            'id', 'user_id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'address', 'bio', 'role', 'profile_picture', 'friends', 'posts'
        ]
    
    def get_friends(self, obj):
        default_picture = "http://127.0.0.1:8000/media/profile_pictures/Profile.jpg"
        return [
            {
                'id': friend.id,
                'username': friend.user.username,
                'profile_picture': friend.profile_picture.url if friend.profile_picture else default_picture,
            }
            for friend in obj.friends.all()
        ]
    
    def get_posts(self, obj):
        return obj.posts.count()

# Serializer for update of profile
class UserProfileFullUpdateSerializer(serializers.ModelSerializer):
    new_username = serializers.CharField(write_only=True, required=False)
    new_email = serializers.EmailField(write_only=True, required=False)
    new_first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password = serializers.CharField(write_only=True, required=False, min_length=8, allow_blank=True)
    
    class Meta:
        model = Profile
        fields = [
            'new_username', 'new_email', 'new_first_name', 'new_last_name',
            'phone', 'address', 'bio', 'profile_picture', 'new_password'
        ]
    
    def update(self, instance, validated_data):
        user = instance.user
        if 'new_username' in validated_data:
            user.username = validated_data.pop('new_username')
        if 'new_email' in validated_data:
            user.email = validated_data.pop('new_email')
        user.first_name = validated_data.pop('new_first_name', '')
        user.last_name = validated_data.pop('new_last_name', '')
        new_password = validated_data.pop('new_password', None)
        if new_password and new_password.strip():
            user.set_password(new_password)
        user.save()
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

# Serializer for user information
class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(source='profile.profile_picture', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_picture']

# Serializer to promote user
class PromoteUserSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=ROLE_CHOICES, source='profile.role')
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']
    
    def validate_role(self, value):
        request_user = self.context['request'].user
        instance = self.instance
        current_role = instance.profile.role
        
        if current_role == 'superuser':
            raise serializers.ValidationError("Cannot change the role of a superuser.")
        
        if request_user.profile.role == 'superuser':
            return value
        
        if request_user.profile.role == 'moderator':
            if value not in ['donor', 'volunteer']:
                raise serializers.ValidationError("As a moderator, you can only set a user's role to donor or volunteer.")
            if instance.profile.role in ['moderator', 'superuser']:
                raise serializers.ValidationError("You cannot change the role of a moderator or superuser.")
            return value
        
        raise serializers.ValidationError("You don't have permission to change user roles.")
    
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        new_role = profile_data.get('role')
        if new_role is not None:
            instance.profile.role = new_role
            instance.profile.save()
        return instance