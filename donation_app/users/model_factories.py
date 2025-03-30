import factory
from django.utils import timezone
from django.contrib.auth.models import User
from users.models import Profile, Post, FriendRequest

# Factory for creating test user
class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ('username',)
    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")
    first_name = "First"
    last_name = "Last"
    password = factory.PostGenerationMethodCall('set_password', 'pass')

# Factory for creating test profile
class ProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Profile
    user = factory.SubFactory(UserFactory)
    phone = "123456789"
    address = "123 Main St"
    bio = "Bio"
    role = "donor"

# Factory for creating test post
class PostFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Post
    commenter = factory.SubFactory(UserFactory)
    profile = factory.LazyAttribute(lambda o: o.commenter.profile)
    text = "Test post"
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)

# Factory for creating test friend request
class FriendRequestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FriendRequest
    from_user = factory.SubFactory(ProfileFactory)
    to_user = factory.SubFactory(ProfileFactory)
    status = "pending"