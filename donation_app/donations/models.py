from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

DONATION_METHOD_CHOICES = [
    ('delivery', 'Delivery'),
    ('dropoff', 'Dropoff'),
]

WEIGHT_RANGE_CHOICES = [
    ('<5', 'Less than 5kg'),
    ('5-10', '5 to 10kg'),
    ('10-20', '10 to 20kg'),
    ('20+', 'More than 20kg'),
]

DROPOFF_LOCATION_CHOICES = [
    ('location1', 'Location 1'),
    ('location2', 'Location 2'),
]

CATEGORY_CHOICES = [
    ('household', 'Household'),
    ('clothing', 'Clothing'),
    ('footwear', 'Footwear'),
    ('toys', 'Toys'),
    ('stationery', 'Stationery'),
]

INTENDED_ACTION_CHOICES = [
    ('donation', 'Donation'),
    ('recycling', 'Recycling'),
]

VERIFICATION_STATUS_CHOICES = [
    ('pending', 'Pending Verification'),
    ('verified', 'Verified'),
    ('rejected', 'Rejected'),
    ('pending_cancellation', 'Pending Cancellation'),
    ('completed', 'Completed'),
    ('cancelled', 'Cancelled'),
]

# Donation model to store donation information
class Donation(models.Model):
    donor = models.ForeignKey(User, on_delete=models.CASCADE)
    donation_method = models.CharField(max_length=20, choices=DONATION_METHOD_CHOICES, default='delivery')
    donation_date = models.DateField()
    donation_time = models.TimeField(default=timezone.now)
    postal_code = models.CharField(max_length=10, blank=True, null=True)
    weight_range = models.CharField(max_length=10, choices=WEIGHT_RANGE_CHOICES, blank=True, null=True)
    dropoff_location = models.CharField(max_length=50, choices=DROPOFF_LOCATION_CHOICES, blank=True, null=True)
    item_name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='household')
    description = models.TextField(blank=True)
    intended_action = models.CharField(max_length=20, choices=INTENDED_ACTION_CHOICES, default='donation')
    submitted_at = models.DateTimeField(default=timezone.now)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='pending')
    verification_comment = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.item_name

# DonationImage Model to store donation images
class DonationImage(models.Model):
    donation = models.ForeignKey(Donation, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='donation_images/')

    def __str__(self):
        return f"Image for {self.donation.item_name}"