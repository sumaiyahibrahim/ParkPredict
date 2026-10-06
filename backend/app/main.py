from __future__ import annotations

import asyncio
import base64
import hmac
import json
import os
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, Header, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .connection_manager import ConnectionManager
from .occupancy_store import OccupancyStore
from .sensor_data_handler import parse_device_message

app = FastAPI(title="ParkPredict IoT Gateway", version="0.1.0")
origins = [item.strip() for item in os.getenv("IOT_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174").split(",") if item.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"], allow_headers=["*"])
manager = ConnectionManager()
device_tokens: dict[str, str] = {}
try:
    configured = json.loads(os.getenv("IOT_DEVICE_TOKENS", "{}"))
    if isinstance(configured, dict):
        device_tokens = {str(key): str(value) for key, value in configured.items() if value}
except json.JSONDecodeError as exc:
    raise RuntimeError("IOT_DEVICE_TOKENS must be a JSON object") from exc

stale_after = max(5, min(120, int(os.getenv("IOT_STALE_AFTER_SECONDS", "12"))))
occupancy = OccupancyStore()
device_last_seen: dict[str, str] = {}
facility_devices: dict[str, set[str]] = {}
admin_username = os.getenv("PARKING_ADMIN_USERNAME", "")
admin_password = os.getenv("PARKING_ADMIN_PASSWORD", "")
admin_signing_key = os.getenv("PARKING_ADMIN_SIGNING_KEY", "")


class AdminLogin(BaseModel):
    username: str
    password: str


def _b64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def _issue_admin_token(username: str) -> str:
    expires = int(utc_now().timestamp()) + 8 * 60 * 60
    payload = _b64url(json.dumps({"sub": username, "role": "parking-admin", "exp": expires}, separators=(",", ":")).encode())
    signature = _b64url(hmac.digest(admin_signing_key.encode(), payload.encode(), "sha256"))
    return f"{payload}.{signature}"


def _is_admin_token(token: str) -> bool:
    if not admin_signing_key:
        return False
    try:
        payload, signature = token.split(".", 1)
        expected = _b64url(hmac.digest(admin_signing_key.encode(), payload.encode(), "sha256"))
        if not hmac.compare_digest(signature, expected):
            return False
        decoded = base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4))
        claims = json.loads(decoded)
        if not isinstance(claims, dict):
            return False
        return claims.get("role") == "parking-admin" and claims.get("sub") == admin_username and int(claims.get("exp", 0)) > int(utc_now().timestamp())
    except (ValueError, TypeError, json.JSONDecodeError):
        return False


@app.post("/api/admin/login")
async def admin_login(credentials: AdminLogin) -> dict[str, Any]:
    if not (admin_username and admin_password and admin_signing_key):
        raise HTTPException(status_code=503, detail="Technician sign-in is not configured on the gateway.")
    valid_user = hmac.compare_digest(credentials.username.encode(), admin_username.encode())
    valid_password = hmac.compare_digest(credentials.password.encode(), admin_password.encode())
    if not (valid_user and valid_password):
        raise HTTPException(status_code=401, detail="Technician username or password is incorrect.")
    return {"access_token": _issue_admin_token(admin_username), "token_type": "bearer", "expires_in": 8 * 60 * 60}


@app.get("/api/admin/verify")
async def verify_admin(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    token = authorization.removeprefix("Bearer ") if authorization else ""
    if not _is_admin_token(token):
        raise HTTPException(status_code=401, detail="Technician session expired or invalid.")
    return {"ok": True, "role": "parking-admin"}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_time(value: object) -> datetime:
    if not isinstance(value, str):
        return utc_now()
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed.astimezone(timezone.utc)
    except ValueError:
        return utc_now()


async def public_bay(reading: dict[str, Any]) -> dict[str, Any]:
    device_id = reading["deviceId"]
    fresh = occupancy.is_fresh(reading, stale_after)
    connected = await manager.is_device_connected(device_id)
    state = reading["state"] if fresh and connected else "Stale"
    return {key: reading.get(key) for key in (
        "facilityId", "deviceId", "bayId", "state", "observedAt", "vehicleLabel", "sensorReady", "distanceCm"
    )} | {"state": state, "deviceOnline": connected}


async def snapshot(facility_id: str | None = None) -> list[dict[str, Any]]:
    results = []
    for reading in occupancy.rows():
        if facility_id and reading["facilityId"] != facility_id:
            continue
        results.append(await public_bay(reading))
    return sorted(results, key=lambda item: (item["facilityId"], item["bayId"]))


async def publish_device_status(device_id: str, connected: bool) -> None:
    await manager.broadcast({"type": "device_status", "deviceId": device_id, "connected": connected, "observedAt": utc_now().isoformat()})
    for reading in occupancy.rows():
        if reading["deviceId"] == device_id:
            await manager.broadcast({"type": "bay_update", "bay": await public_bay(reading)})


@app.get("/api/iot/health")
async def health() -> dict[str, Any]:
    connected = list(manager.devices)
    return {"ok": True, "service": "ParkPredict IoT Gateway", "deviceAuthConfigured": bool(device_tokens), "connectedDevices": connected, "bayCount": len(occupancy.latest)}


@app.get("/api/iot/bays")
async def get_bays(facilityId: str | None = None) -> dict[str, Any]:
    return {"type": "snapshot", "bays": await snapshot(facilityId)}


async def handle_device_message(device_id: str, message: object) -> dict[str, Any] | None:
    if not isinstance(message, dict):
        return None
    kind = message.get("type")
    if kind == "heartbeat":
        now = utc_now().isoformat()
        device_last_seen[device_id] = now
        facilities = message.get("facilityIds", [])
        if isinstance(facilities, list):
            for facility in facilities[:10]:
                facility_devices.setdefault(str(facility)[:80], set()).add(device_id)
        await manager.broadcast({"type": "device_status", "deviceId": device_id, "connected": True, "observedAt": now})
        return {"type": "heartbeat_ack", "observedAt": now}
    reading, response = parse_device_message(device_id, message)
    if response and response.get("type") in {"error", "heartbeat_ack"}:
        return response
    if reading is None:
        return response
    occupancy.update(reading)
    facility_id = reading["facilityId"]
    bay_id = reading["bayId"]
    facility_devices.setdefault(facility_id, set()).add(device_id)
    device_last_seen[device_id] = utc_now().isoformat()
    public = await public_bay(reading)
    await manager.broadcast({"type": "bay_update", "bay": public})
    return response


@app.websocket("/ws/device")
async def device_socket(socket: WebSocket) -> None:
    await socket.accept()
    device_id: str | None = None
    try:
        auth = await asyncio.wait_for(socket.receive_json(), timeout=8)
        if not isinstance(auth, dict) or auth.get("type") != "authenticate":
            await socket.close(code=4401, reason="Authentication required")
            return
        candidate = str(auth.get("deviceId", ""))
        token = str(auth.get("token", ""))
        expected = device_tokens.get(candidate)
        if not expected or not hmac.compare_digest(expected.encode(), token.encode()):
            await socket.close(code=4403, reason="Invalid device credentials")
            return
        device_id = candidate
        previous = await manager.add_device(device_id, socket)
        if previous:
            try:
                await previous.close(code=4001, reason="Device reconnected")
            except Exception:
                pass
        await socket.send_json({"type": "auth_ok", "deviceId": device_id})
        await publish_device_status(device_id, True)
        while True:
            try:
                message = await asyncio.wait_for(socket.receive_json(), timeout=35)
            except asyncio.TimeoutError:
                await socket.close(code=4000, reason="Heartbeat timeout")
                break
            response = await handle_device_message(device_id, message)
            if response:
                await socket.send_json(response)
    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await socket.close(code=1011, reason="Sensor gateway error")
        except Exception:
            pass
    finally:
        if device_id and await manager.remove_device(device_id, socket):
            await publish_device_status(device_id, False)


@app.websocket("/ws/live")
async def browser_socket(socket: WebSocket) -> None:
    await manager.add_browser(socket)
    try:
        await socket.send_json({"type": "snapshot", "bays": await snapshot()})
        while True:
            await socket.receive_text()  # Browser ping; keep the connection alive.
    except WebSocketDisconnect:
        pass
    finally:
        await manager.remove_browser(socket)
