import factory
from django.utils import timezone
from django.contrib.auth.models import User
from chat.models import ChatRoom, ChatMessage, ChatTicket, ResolvedChatTicket

# Factory for creating test user
class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ('username',)
    username = factory.Sequence(lambda n: f'chatuser{n}')
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")
    first_name = "First"
    last_name = "Last"
    password = factory.PostGenerationMethodCall('set_password', 'pass')

# Factory for creating test chat room
class ChatRoomFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ChatRoom
    name = factory.Sequence(lambda n: f"ChatRoom {n}")
    slug = factory.LazyAttribute(lambda o: f"chatroom-{o.name.replace(' ', '-').lower()}")
    description = "Test room"
    is_group = False
    is_resolved = False
    created_by = factory.SubFactory(UserFactory)

# Factory for creating test chat message
class ChatMessageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ChatMessage
    room = factory.SubFactory(ChatRoomFactory)
    sender = factory.SubFactory(UserFactory)
    message = "Test message"
    timestamp = factory.LazyFunction(timezone.now)

# Factory for creating test chat ticket
class ChatTicketFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ChatTicket
    sender = factory.SubFactory(UserFactory)
    subject = "Ticket subject"
    reason = "Ticket reason"
    status = "pending"

# Factory for creating resolved chat ticket
class ResolvedChatTicketFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ResolvedChatTicket
    sender = factory.SubFactory(UserFactory)
    subject = "Resolved subject"
    reason = "Resolved reason"
    chat_room = factory.SubFactory(ChatRoomFactory)
    resolved_at = factory.LazyFunction(timezone.now)