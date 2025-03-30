import re
from django.db import models
from django.contrib.auth.models import User

# Clean room name for use as slug
def clean_room_name(room_name):
    return re.sub(r'[^A-Za-z0-9_.-]', '_', room_name)[:90]

# ChatRoom model to store chat room information
class ChatRoom(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True, null=True)
    description = models.TextField(blank=True)
    is_group = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_chatrooms')
    participants = models.ManyToManyField(User, related_name='chatrooms', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.name and not self.slug:
            self.slug = clean_room_name(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        if self.is_group and self.name:
            return self.name
        participant_usernames = sorted([user.username for user in self.participants.all()])
        return "Chat between " + " & ".join(participant_usernames)

# ChatMessage model to store chat message
class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender.username}: {self.message[:20]}"

# ChatTicket model to store chat ticket
class ChatTicket(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('resolved', 'Resolved'),
    ]
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_tickets')
    subject = models.CharField(max_length=255)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')

    def __str__(self):
        return f"Ticket from {self.sender.username}: {self.subject}"

# ResolvedChatTicket to store resolved chat ticket
class ResolvedChatTicket(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resolved_chat_tickets')
    subject = models.CharField(max_length=255)
    reason = models.TextField()
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_tickets')
    resolved_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Resolved Ticket from {self.sender.username}: {self.subject}"