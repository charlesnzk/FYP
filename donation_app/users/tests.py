from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from users.model_factories import UserFactory, ProfileFactory, PostFactory, FriendRequestFactory

# Tests user registration view
class UserRegistrationTests(APITestCase):
    def test_registration(self):
        url = reverse('user-register')
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "first_name": "New",
            "last_name": "User",
            "password": "strongpassword",
            "password2": "strongpassword",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(username="newuser").count(), 1)

# Tests current user profile view
class UserProfileDetailTests(APITestCase):
    def setUp(self):
        self.user = UserFactory(username="profileuser")
        self.client.force_authenticate(user=self.user)
        self.url = reverse('profile-detail')

    def test_get_profile(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("username"), self.user.username)

    def test_update_profile(self):
        data = {"phone": "123456789"}
        response = self.client.patch(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("phone"), "123456789")

# Tests public profile view
class PublicProfileDetailTests(APITestCase):
    def setUp(self):
        self.other_user = UserFactory(username="otheruser")
        try:
            self.profile = self.other_user.profile
        except Exception:
            self.profile = ProfileFactory(user=self.other_user)
        self.url = reverse('public-profile-detail', args=[self.profile.id])

    def test_get_public_profile(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("username"), self.other_user.username)

# Tests friend request
class FriendRequestTests(APITestCase):
    def setUp(self):
        self.from_user = UserFactory(username="sender")
        self.to_user = UserFactory(username="receiver")
        self.client.force_authenticate(user=self.from_user)
        self.send_url = reverse('send-friend-request')

    def test_send_friend_request_missing_to_profile_id(self):
        response = self.client.post(self.send_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_send_friend_request(self):
        data = {"to_profile_id": self.to_user.profile.id}
        response = self.client.post(self.send_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_friend_request(self):
        fr = FriendRequestFactory(from_user=self.from_user.profile, to_user=self.to_user.profile)
        update_url = reverse('update-friend-request', args=[fr.id])
        self.client.force_authenticate(user=self.to_user)
        data = {"status": "accepted"}
        response = self.client.patch(update_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("status"), "accepted")

# Tests post creation and reactions
class PostTests(APITestCase):
    def setUp(self):
        self.user = UserFactory(username="poster")
        self.profile = self.user.profile
        self.client.force_authenticate(user=self.user)
        self.url = reverse('post-list-create')

    def test_create_post(self):
        data = {
            "profile_id": self.profile.id,
            "text": "This is a test post",
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data.get("text"), "This is a test post")

    def test_like_post(self):
        post = PostFactory(profile=self.profile, commenter=self.user)
        like_url = reverse('like-post', args=[post.id])
        response = self.client.post(like_url, {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data.get("likes_count"), 1)

    def test_dislike_post(self):
        post = PostFactory(profile=self.profile, commenter=self.user)
        dislike_url = reverse('dislike-post', args=[post.id])
        response = self.client.post(dislike_url, {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data.get("dislikes_count"), 1)

# Tests user search view
class UserSearchTests(APITestCase):
    def setUp(self):
        self.user = UserFactory(username="searcher")
        UserFactory(username="anotheruser")
        self.client.force_authenticate(user=self.user)
        self.url = reverse('user-search')

    def test_search_users(self):
        response = self.client.get(self.url, {"search": "another"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)