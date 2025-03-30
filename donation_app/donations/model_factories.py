import factory
from django.utils import timezone
from django.contrib.auth import get_user_model
from donations.models import Donation, DonationImage

User = get_user_model()

# Factory for creating test user
class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ('username',)
    username = factory.Sequence(lambda n: f'user{n}')
    password = factory.PostGenerationMethodCall('set_password', 'pass')

# Factory for creating test donation
class DonationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Donation
    donor = factory.SubFactory(UserFactory)
    donation_date = factory.LazyFunction(timezone.now)
    submitted_at = factory.LazyFunction(timezone.now)
    verification_status = 'pending'
    intended_action = 'default_action'
    verification_comment = 'default comment'

# Factory for creating test image
class DonationImageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = DonationImage
    donation = factory.SubFactory(DonationFactory)
    image = factory.django.ImageField(filename='test.jpg')