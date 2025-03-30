from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from chat.model_factories import UserFactory, ChatRoomFactory, ChatMessageFactory, ChatTicketFactory, ResolvedChatTicketFactory

# Tests chat room list view
class ChatRoomListViewTests(APITestCase):
    def setUp(self):
        self.user = UserFactory(username="chatuser")
        self.client.force_authenticate(user=self.user)
        self.room = ChatRoomFactory(is_resolved=False)
        self.room.participants.add(self.user)
        self.url = reverse('chat-room-list')

    def test_list_chat_rooms(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

# Tests group chat room creation view
class CreateGroupChatRoomViewTests(APITestCase):
    def setUp(self):
        self.user = UserFactory(username="volunteer")
        self.user.profile.role = "volunteer"
        self.user.profile.save()
        self.client.force_authenticate(user=self.user)
        self.url = reverse('create-chat-room')

    def test_create_group_chat_room(self):
        data = {
            "name": "Test Group",
            "description": "Group chat",
            "members": "user1, user2"
        }
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data.get("name"), "Test Group")

# Tests retrieving chat room using slug
class ChatRoomDetailBySlugViewTests(APITestCase):
    def setUp(self):
        self.user = UserFactory(username="detailuser")
        self.client.force_authenticate(user=self.user)
        self.room = ChatRoomFactory(slug="test-room-slug", is_resolved=False)
        self.room.participants.add(self.user)
        self.url = reverse('chat-room-detail-by-slug', args=[self.room.slug])

    def test_get_room_by_slug(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("slug"), self.room.slug)

# Tests adding and removing members from group chat
class AddRemoveMemberViewTests(APITestCase):
    def setUp(self):
        self.user = UserFactory(username="moderator")
        self.user.profile.role = "moderator"
        self.user.profile.save()
        self.new_member = UserFactory(username="newmember")
        self.client.force_authenticate(user=self.user)
        self.room = ChatRoomFactory(is_group=True)
        self.room.participants.add(self.user)
        self.add_url = reverse('add-member', args=[self.room.id])
        self.remove_url = reverse('remove-member', args=[self.room.id])

    def test_add_member(self):
        data = {"username": self.new_member.username}
        response = self.client.patch(self.add_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.new_member.username, response.data.get("participants", []))

    def test_remove_member(self):
        self.room.participants.add(self.new_member)
        data = {"username": self.new_member.username}
        response = self.client.patch(self.remove_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(self.new_member.username, response.data.get("participants", []))

# Tests leaving a chat room
class LeaveChatRoomViewTests(APITestCase):
    def setUp(self):
        self.user = UserFactory(username="leaver")
        self.client.force_authenticate(user=self.user)
        self.room = ChatRoomFactory(is_group=True)
        self.room.participants.add(self.user)
        self.url = reverse('leave-chat-room', args=[self.room.id])

    def test_leave_chat_room(self):
        response = self.client.delete(self.url)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])

# Tests message listing and creation
class ChatMessageListCreateViewTests(APITestCase):
    def setUp(self):
        self.user = UserFactory(username="messenger")
        self.client.force_authenticate(user=self.user)
        self.room = ChatRoomFactory(is_resolved=False)
        self.room.participants.add(self.user)
        self.url = reverse('chat-message-list-create')
        self.get_url = f"{self.url}?room={self.room.id}"

    def test_list_messages(self):
        ChatMessageFactory(room=self.room, sender=self.user)
        response = self.client.get(self.get_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_message(self):
        data = {"room": str(self.room.id), "message": "Hello, world!"}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data.get("message"), "Hello, world!")

# Tests one-to-one chat creation
class OneToOneChatViewTests(APITestCase):
    def setUp(self):
        self.user = UserFactory(username="userA")
        self.other = UserFactory(username="userB")
        self.client.force_authenticate(user=self.user)
        self.url = reverse('one-to-one-chat')

    def test_create_private_chat(self):
        data = {"username": self.other.username}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("room_slug", response.data)

# Tests chat ticket creation and listing
class ChatTicketTests(APITestCase):
    def setUp(self):
        self.sender = UserFactory(username="ticket_sender")
        self.client.force_authenticate(user=self.sender)
        self.create_url = reverse('create-chat-ticket')

    def test_create_chat_ticket(self):
        data = {"subject": "Help", "reason": "Need assistance"}
        response = self.client.post(self.create_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data.get("subject"), "Help")

    def test_list_chat_tickets(self):
        ChatTicketFactory(sender=self.sender, status="pending")
        list_url = reverse('chat-ticket-list')
        response = self.client.get(list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

# Tests updating ticket status
class UpdateChatTicketViewTests(APITestCase):
    def setUp(self):
        self.volunteer = UserFactory(username="volunteer")
        self.volunteer.profile.role = "volunteer"
        self.volunteer.profile.save()
        self.sender = UserFactory(username="ticket_sender2")
        self.client.force_authenticate(user=self.volunteer)
        self.ticket = ChatTicketFactory(sender=self.sender, status="pending")
        self.url = reverse('update-chat-ticket', args=[self.ticket.id])

    def test_update_chat_ticket(self):
        data = {"status": "accepted"}
        response = self.client.patch(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

# Tests listing resolved chat tickets
class ResolvedChatTicketListViewTests(APITestCase):
    def setUp(self):
        self.sender = UserFactory(username="ticket_sender3")
        self.client.force_authenticate(user=self.sender)
        self.ticket = ResolvedChatTicketFactory(sender=self.sender)
        self.url = reverse('resolved-chat-ticket-list')

    def test_list_resolved_tickets(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)