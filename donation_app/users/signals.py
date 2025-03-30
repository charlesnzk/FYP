from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Profile

# Automatically create profile when new user is created
@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        role = 'superuser' if instance.is_superuser else 'donor'
        Profile.objects.create(user=instance, role=role)

# Automatically save profile when user saves
@receiver(post_save, sender=User)
def save_profile(sender, instance, **kwargs):
    instance.profile.save()