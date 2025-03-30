from rest_framework import mixins, generics, permissions, status, serializers
from rest_framework.response import Response
from .models import Donation, DonationImage
from .serializers import DonationSerializer
from django.utils import timezone

# List and create donations
class DonationListCreateView(mixins.ListModelMixin,
                             mixins.CreateModelMixin,
                             generics.GenericAPIView):
    queryset = Donation.objects.all().order_by('-submitted_at')
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        donation = serializer.save()
        images = request.FILES.getlist('images')
        if not images:
            return Response({"detail": "At least one image is required."},
                            status=status.HTTP_400_BAD_REQUEST)
        for img in images:
            DonationImage.objects.create(donation=donation, image=img)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

# List donations for current donor
class DonorDonationListView(mixins.ListModelMixin,
                            generics.GenericAPIView):
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Donation.objects.filter(donor=self.request.user).order_by('-submitted_at')
    
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

# Retrieve and update donation for verification
class DonationVerificationDetailView(mixins.RetrieveModelMixin,
                                     mixins.UpdateModelMixin,
                                     generics.GenericAPIView):
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Donation.objects.all()

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)
    
    def put(self, request, *args, **kwargs):
        donation = self.get_object()
        data = request.data
        if 'verification_status' in data:
            donation.verification_status = data['verification_status']
        if 'intended_action' in data:
            donation.intended_action = data['intended_action']
        if 'verification_comment' in data:
            donation.verification_comment = data['verification_comment']
        donation.save()
        serializer = self.get_serializer(donation)
        return Response(serializer.data)
    
    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

# Complete donation ticket
class DonationCompleteView(mixins.UpdateModelMixin,
                           generics.GenericAPIView):
    queryset = Donation.objects.all()
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

# Allow donor to request cancellation
class DonationCancelView(mixins.UpdateModelMixin,
                         generics.GenericAPIView):
    queryset = Donation.objects.all()
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        donation = self.get_object()
        if donation.donor != request.user:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        donation.verification_status = 'pending_cancellation'
        donation.save()
        serializer = self.get_serializer(donation)
        return Response(serializer.data, status=status.HTTP_200_OK)

# Allow admin to approve cancellation request
class DonationApproveCancellationView(mixins.UpdateModelMixin,
                                      generics.GenericAPIView):
    queryset = Donation.objects.all()
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        donation = self.get_object()
        if donation.verification_status != 'pending_cancellation':
            return Response({"detail": "Donation is not pending cancellation."}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({"detail": "Not authorized to approve cancellations."}, status=status.HTTP_403_FORBIDDEN)
        donation.verification_status = 'cancelled'
        donation.save()
        serializer = self.get_serializer(donation)
        return Response(serializer.data, status=status.HTTP_200_OK)