from __future__ import annotations

import asyncio
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.devices: dict[str, WebSocket] = {}
        self.browsers: set[WebSocket] = set()
        self.lock = asyncio.Lock()

    async def add_browser(self, socket: WebSocket) -> None:
        await socket.accept()
        async with self.lock:
            self.browsers.add(socket)

    async def remove_browser(self, socket: WebSocket) -> None:
        async with self.lock:
            self.browsers.discard(socket)

    async def add_device(self, device_id: str, socket: WebSocket) -> WebSocket | None:
        async with self.lock:
            previous = self.devices.get(device_id)
            self.devices[device_id] = socket
            return previous if previous is not socket else None

    async def remove_device(self, device_id: str, socket: WebSocket) -> bool:
        async with self.lock:
            if self.devices.get(device_id) is not socket:
                return False
            del self.devices[device_id]
            return True

    async def is_device_connected(self, device_id: str) -> bool:
        async with self.lock:
            return device_id in self.devices

    async def broadcast(self, payload: dict) -> None:
        async with self.lock:
            clients = tuple(self.browsers)
        stale: list[WebSocket] = []
        for client in clients:
            try:
                await client.send_json(payload)
            except Exception:
                stale.append(client)
        if stale:
            async with self.lock:
                for client in stale:
                    self.browsers.discard(client)
