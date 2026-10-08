from __future__ import annotations

import asyncio
import base64
import hmac
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Header, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from .calibration_store import CalibrationStore
from .connection_manager import ConnectionManager
from .occupancy_store import OccupancyStore
from .sensor_data_handler import parse_device_message

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = FastAPI(title="ParkPredict Ultrasonic IoT Gateway", version="1.0.0")
origins = [item.strip() for item in os.getenv("IOT_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174").split(",") if item.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST", "PUT"], allow_headers=["*"])
manager = ConnectionManager()
occupancy = OccupancyStore()
calibrations = CalibrationStore()
device_tokens: dict[str, str] = {}
try:
    configured = json.loads(os.getenv("IOT_DEVICE_TOKENS", "{}"))
    if isinstance(configured, dict):
        device_tokens = {str(key): str(value) for key, value in configured.items() if value}
except json.JSONDecodeError as exc:
    raise RuntimeError("IOT_DEVICE_TOKENS must be a JSON object") from exc

stale_after = max(5, min(120, int(os.getenv("IOT_STALE_AFTER_SECONDS", "12"))))
max_message_bytes = max(512, min(16_384, int(os.getenv("IOT_MAX_MESSAGE_BYTES", "2048"))))
device_last_seen: dict[str, str] = {}
facility_devices: dict[str, set[str]] = {}
admin_username = os.getenv("PARKING_ADMIN_USERNAME", "")
admin_password = os.getenv("PARKING_ADMIN_PASSWORD", "")
admin_signing_key = os.getenv("PARKING_ADMIN_SIGNING_KEY", "")


class AdminLogin(BaseModel):
    username: str
    password: str


class CalibrationUpdate(BaseModel):
    facilityId: str
    bayId: str
    sensorId: str
    emptyBaselineCm: float
    occupiedThresholdCm: float
    clearThresholdCm: float
    minimumValidCm: float
    maximumValidCm: float


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


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
        claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        return isinstance(claims, dict) and claims.get("role") == "parking-admin" and claims.get("sub") == admin_username and int(claims.get("exp", 0)) > int(utc_now().timestamp())
    except (ValueError, TypeError, json.JSONDecodeError):
        return False


def _require_admin(authorization: str | None) -> None:
    token = authorization.removeprefix("Bearer ") if authorization else ""
    if not _is_admin_token(token):
        raise HTTPException(status_code=401, detail="Technician session expired or invalid.")


def _validate_calibration(row: dict[str, Any]) -> dict[str, Any]:
    facility_id = str(row.get("facilityId", "")).strip()[:80]
    bay_id = str(row.get("bayId", "")).strip()[:40]
    sensor_id = str(row.get("sensorId", "")).strip()[:80]
    if not facility_id or not bay_id or not sensor_id:
        raise HTTPException(status_code=422, detail="Facility, bay and sensor IDs are required.")
    values = {key: float(row[key]) for key in ("emptyBaselineCm", "occupiedThresholdCm", "clearThresholdCm", "minimumValidCm", "maximumValidCm")}
    if not 0 < values["minimumValidCm"] < values["occupiedThresholdCm"] < values["clearThresholdCm"] < values["emptyBaselineCm"] <= values["maximumValidCm"] <= 500:
        raise HTTPException(status_code=422, detail="Calibration must follow minimum < occupied < clear < empty baseline <= maximum.")
    return {"facilityId": facility_id, "bayId": bay_id, "sensorId": sensor_id, **values}


def device_config_payload(facility_id: str | None = None) -> dict[str, Any]:
    keys = (
        "facilityId",
        "bayId",
        "sensorId",
        "minimumValidCm",
        "maximumValidCm",
        "occupiedThresholdCm",
        "clearThresholdCm",
    )
    return {
        "type": "sensor_config",
        "bays": [{key: row[key] for key in keys} for row in calibrations.rows(facility_id)],
    }

@app.post("/api/admin/login")
async def admin_login(credentials: AdminLogin) -> dict[str, Any]:
    if not (admin_username and admin_password and admin_signing_key):
        raise HTTPException(status_code=503, detail="Technician sign-in is not configured on the gateway.")
    if not (hmac.compare_digest(credentials.username.encode(), admin_username.encode()) and hmac.compare_digest(credentials.password.encode(), admin_password.encode())):
        raise HTTPException(status_code=401, detail="Technician username or password is incorrect.")
    return {"access_token": _issue_admin_token(admin_username), "token_type": "bearer", "expires_in": 8 * 60 * 60}


@app.get("/api/admin/verify")
async def verify_admin(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    _require_admin(authorization)
    return {"ok": True, "role": "parking-admin"}


@app.get("/api/admin/calibration")
async def get_calibration(facilityId: str | None = None, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    _require_admin(authorization)
    return {"calibrations": calibrations.rows(facilityId)}


@app.put("/api/admin/calibration/{facility_id}/{bay_id}")
async def save_calibration(facility_id: str, bay_id: str, payload: CalibrationUpdate, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    _require_admin(authorization)
    row = payload.model_dump()
    if row["facilityId"] != facility_id or row["bayId"] != bay_id:
        raise HTTPException(status_code=422, detail="Route and payload bay identifiers must match.")
    stored = calibrations.update(_validate_calibration(row))
    await manager.broadcast_devices(device_config_payload(facility_id))
    return {"calibration": stored}


@app.post("/api/admin/calibration/{facility_id}/{bay_id}/capture-empty")
async def capture_empty(facility_id: str, bay_id: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    _require_admin(authorization)
    reading = occupancy.get(facility_id, bay_id)
    current = calibrations.get(facility_id, bay_id)
    if not current:
        raise HTTPException(status_code=404, detail="Bay calibration was not found.")
    if not reading or not occupancy.is_fresh(reading, stale_after) or not reading.get("sensorReady") or reading.get("distanceCm") is None:
        raise HTTPException(status_code=409, detail="A fresh valid sensor reading is required while the bay is empty.")
    baseline = round(float(reading["distanceCm"]), 2)
    row = dict(current)
    row.update({
        "emptyBaselineCm": baseline,
        "occupiedThresholdCm": round(max(float(row["minimumValidCm"]) + 0.5, baseline * 0.60), 2),
        "clearThresholdCm": round(max(float(row["minimumValidCm"]) + 1.0, baseline * 0.75), 2),
        "maximumValidCm": round(max(float(row["maximumValidCm"]), baseline + 10), 2),
    })
    stored = calibrations.update(_validate_calibration(row))
    await manager.broadcast_devices(device_config_payload(facility_id))
    return {"calibration": stored}


async def public_bay(reading: dict[str, Any]) -> dict[str, Any]:
    connected = await manager.is_device_connected(reading["deviceId"])
    state = reading["state"] if occupancy.is_fresh(reading, stale_after) and connected else "Stale"
    return {key: reading.get(key) for key in ("facilityId", "deviceId", "sensorId", "bayId", "state", "observedAt", "sensorReady", "distanceCm")} | {"state": state, "deviceOnline": connected}


async def snapshot(facility_id: str | None = None) -> list[dict[str, Any]]:
    results = [await public_bay(row) for row in occupancy.rows(facility_id)]
    return sorted(results, key=lambda item: (item["facilityId"], item["bayId"]))


async def publish_device_status(device_id: str, connected: bool) -> None:
    await manager.broadcast({"type": "device_status", "deviceId": device_id, "connected": connected, "observedAt": utc_now().isoformat()})
    for reading in occupancy.rows():
        if reading["deviceId"] == device_id:
            await manager.broadcast({"type": "bay_update", "bay": await public_bay(reading)})


@app.get("/api/iot/health")
async def health() -> dict[str, Any]:
    return {
        "ok": True, "service": "ParkPredict Ultrasonic IoT Gateway",
        "deviceAuthConfigured": bool(device_tokens), "connectedDevices": sorted(manager.devices),
        "configuredBays": calibrations.rows(), "bayCount": len(calibrations.rows()),
    }


@app.get("/api/iot/bays")
async def get_bays(facilityId: str | None = None) -> dict[str, Any]:
    return {"type": "snapshot", "bays": await snapshot(facilityId)}


async def handle_device_message(device_id: str, message: object) -> dict[str, Any] | None:
    if not isinstance(message, dict):
        return {"type": "error", "message": "Message must be a JSON object."}
    if len(json.dumps(message, separators=(",", ":")).encode()) > max_message_bytes:
        return {"type": "error", "message": "Message exceeds the configured size limit."}
    if message.get("type") == "heartbeat":
        facilities = message.get("facilityIds", [])
        if not isinstance(facilities, list):
            return {"type": "error", "message": "facilityIds must be a list."}
        now = utc_now().isoformat()
        device_last_seen[device_id] = now
        for facility in facilities[:10]:
            facility_devices.setdefault(str(facility)[:80], set()).add(device_id)
        await manager.broadcast({"type": "device_status", "deviceId": device_id, "connected": True, "observedAt": now})
        return {"type": "heartbeat_ack", "observedAt": now}
    facility_id = str(message.get("facilityId", ""))[:80]
    bay_id = str(message.get("bayId", ""))[:40]
    config = calibrations.get(facility_id, bay_id)
    previous = occupancy.get(facility_id, bay_id)
    reading, response = parse_device_message(device_id, message, config, previous.get("state") if previous else None)
    if reading is None:
        return response
    occupancy.update(reading)
    facility_devices.setdefault(facility_id, set()).add(device_id)
    device_last_seen[device_id] = utc_now().isoformat()
    await manager.broadcast({"type": "bay_update", "bay": await public_bay(reading)})
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
        candidate = str(auth.get("deviceId", ""))[:80]
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
        await socket.send_json(device_config_payload())
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
            await socket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await manager.remove_browser(socket)
