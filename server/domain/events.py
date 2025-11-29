from dataclasses import dataclass
from .event_bus import DomainEvent


@dataclass
class GroupCreated(DomainEvent):
    group_id: int
    owner_user_id: int


@dataclass
class GroupJoined(DomainEvent):
    group_id: int
    user_id: int
    owner_user_id: int


@dataclass
class GroupMessagePosted(DomainEvent):
    group_id: int
    user_id: int
    message_id: int
