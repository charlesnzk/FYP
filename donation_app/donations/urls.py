from django.urls import path
from .api import (
    DonationListCreateView,
    DonorDonationListView,
    DonationVerificationDetailView,
    DonationCompleteView,
    DonationCancelView,
    DonationApproveCancellationView,
)

urlpatterns = [
    path('', DonationListCreateView.as_view(), name='donation-list-create'),
    path('mine/', DonorDonationListView.as_view(), name='donor-donations'),
    path('verify/<int:pk>/', DonationVerificationDetailView.as_view(), name='donation-verification-detail'),
    path('complete/<int:pk>/', DonationCompleteView.as_view(), name='donation-complete'),
    path('cancel/<int:pk>/', DonationCancelView.as_view(), name='donation-cancel'),
    path('approve-cancellation/<int:pk>/', DonationApproveCancellationView.as_view(), name='donation-approve-cancellation'),
]