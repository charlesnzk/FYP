from rest_framework import serializers
from .models import Donation, DonationImage

# Serializer for donation images
class DonationImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationImage
        fields = ['id', 'image']

# Serializer for donation information
class DonationSerializer(serializers.ModelSerializer):
    images = DonationImageSerializer(many=True, read_only=True)
    donor_username = serializers.CharField(source='donor.username', read_only=True)
    
    class Meta:
        model = Donation
        fields = '__all__'