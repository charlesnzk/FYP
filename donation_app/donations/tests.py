from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from donations.model_factories import DonationFactory

User = get_user_model()

# Tests donation list and create view
class DonationListCreateViewTests(APITestCase):
    def setUp(self):
        self.donor = User.objects.create_user(username="donor", password="pass")
        self.client.force_authenticate(user=self.donor)
        self.url = reverse('donation-list-create')
        self.valid_donation_date = timezone.now().strftime("%Y-%m-%dT%H:%M:%SZ")

    def test_create_donation_without_images(self):
        data = {
            'donation_date': self.valid_donation_date,
            'intended_action': 'default_action',
            'verification_comment': 'Test comment',
        }
        response = self.client.post(self.url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIsNone(response.data.get("detail"))

    def test_create_donation_with_images(self):
        image_file = SimpleUploadedFile("test.jpg", b"file_content", content_type="image/jpeg")
        data = {
            'donation_date': self.valid_donation_date,
            'intended_action': 'default_action',
            'verification_comment': 'Test comment',
            'images': [image_file],
        }
        response = self.client.post(self.url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_donations_list(self):
        DonationFactory.create_batch(3, donor=self.donor)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 3)

# Tests donor donation list view
class DonorDonationListViewTests(APITestCase):
    def setUp(self):
        self.donor = User.objects.create_user(username="donor", password="pass")
        self.other_user = User.objects.create_user(username="other", password="pass")
        self.client.force_authenticate(user=self.donor)
        self.url = reverse('donor-donations')
        DonationFactory(donor=self.donor)
        DonationFactory(donor=self.other_user)

    def test_donor_donations_list(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for donation in response.data:
            self.assertEqual(donation['donor_username'], self.donor.username)

# Tests donation verification detail view
class DonationVerificationDetailViewTests(APITestCase):
    def setUp(self):
        self.donor = User.objects.create_user(username="donor", password="pass")
        self.client.force_authenticate(user=self.donor)
        self.donation = DonationFactory(donor=self.donor)
        self.url = reverse('donation-verification-detail', args=[self.donation.id])

    def test_get_donation_detail(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.donation.id)

    def test_update_donation_verification(self):
        data = {
            'verification_status': 'verified',
            'intended_action': 'action_taken',
            'verification_comment': 'Looks good'
        }
        response = self.client.put(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.donation.refresh_from_db()
        self.assertEqual(self.donation.verification_status, 'verified')

# Tests donation complete view
class DonationCompleteViewTests(APITestCase):
    def setUp(self):
        self.donor = User.objects.create_user(username="donor", password="pass")
        self.client.force_authenticate(user=self.donor)
        self.donation = DonationFactory(donor=self.donor)
        self.url = reverse('donation-complete', args=[self.donation.id])

    def test_complete_donation(self):
        data = {'verification_status': 'completed'}
        response = self.client.patch(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.donation.refresh_from_db()
        self.assertEqual(self.donation.verification_status, 'completed')

# Tests donation cancel view
class DonationCancelViewTests(APITestCase):
    def setUp(self):
        self.donor = User.objects.create_user(username="donor", password="pass")
        self.other_user = User.objects.create_user(username="other", password="pass")
        self.donation = DonationFactory(donor=self.donor)
        self.url = reverse('donation-cancel', args=[self.donation.id])

    def test_cancel_donation_by_donor(self):
        self.client.force_authenticate(user=self.donor)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.donation.refresh_from_db()
        self.assertEqual(self.donation.verification_status, 'pending_cancellation')

    def test_cancel_donation_not_by_donor(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

# Tests donation approve cancellation view
class DonationApproveCancellationViewTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username="admin", password="pass", is_staff=True)
        self.donor = User.objects.create_user(username="donor", password="pass")
        self.donation = DonationFactory(donor=self.donor, verification_status='pending_cancellation')
        self.url = reverse('donation-approve-cancellation', args=[self.donation.id])

    def test_approve_cancellation_by_admin(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.donation.refresh_from_db()
        self.assertEqual(self.donation.verification_status, 'cancelled')

    def test_approve_cancellation_invalid_status(self):
        self.donation.verification_status = 'verified'
        self.donation.save()
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_approve_cancellation_not_admin(self):
        non_admin = User.objects.create_user(username="nonadmin", password="pass")
        self.client.force_authenticate(user=non_admin)
        response = self.client.patch(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)