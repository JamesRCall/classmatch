from typing import Callable, Dict, List, Type


class DomainEvent:
    pass


class EventBus:
    def __init__(self):
        self._handlers: Dict[Type[DomainEvent], List[Callable[[DomainEvent], None]]] = {}

    def subscribe(self, event_type: Type[DomainEvent], handler: Callable[[DomainEvent], None]):
        self._handlers.setdefault(event_type, []).append(handler)

    def publish(self, event: DomainEvent):
        for handler in self._handlers.get(type(event), []):
            handler(event)


event_bus = EventBus()
