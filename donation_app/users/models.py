from django.db import models
from django.contrib.auth.models import User

ROLE_CHOICES = [
    ('donor', 'Donor'),
    ('volunteer', 'Volunteer'),
    ('moderator', 'Moderator'),
    ('superuser', 'Superuser'),
]

# File upload path for profile pictures
def user_profile_picture_upload_path(instance, filename):
    return f'profile_pictures/user_{instance.user.id}/{filename}'

# Profile model to store profile information
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='donor')
    profile_picture = models.ImageField(upload_to=user_profile_picture_upload_path, blank=True, null=True)
    friends = models.ManyToManyField('self', blank=True, symmetrical=True)

    def __str__(self):
        return self.user.username

# Post model to store profile posts
class Post(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='posts')
    commenter = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    liked_by = models.ManyToManyField(User, related_name='liked_posts', blank=True)
    disliked_by = models.ManyToManyField(User, related_name='disliked_posts', blank=True)

    def __str__(self):
        return f"Post by {self.commenter.username} on {self.profile.user.username}'s profile"

# FriendRequest model between profiles
class FriendRequest(models.Model):
    from_user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='sent_friend_requests')
    to_user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='received_friend_requests')
    status = models.CharField(
        max_length=20, 
        choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f"Friend request from {self.from_user.user.username} to {self.to_user.user.username}"