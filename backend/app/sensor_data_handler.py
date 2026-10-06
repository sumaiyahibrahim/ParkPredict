from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from .rfid_registry import identify_tag


def parse_device_message(device_id: str, message: object) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """Validate one device payload and return (bay observation, response)."""
    if not isinstance(message, dict):
        return None, None
    kind = message.get("type")
    now = datetime.now(timezone.utc).isoformat()
    if kind == "heartbeat":
        return None, {"type": "heartbeat_ack", "observedAt": now}
    if kind != "bay_reading":
        return None, None
    facility_id = str(message.get("facilityId", ""))[:80]
    bay_id = str(message.get("bayId", ""))[:40]
    if not facility_id or not bay_id:
        return None, {"type": "error", "message": "facilityId and bayId are required"}
    sensor_ready = message.get("sensorReady") is True
    occupied = message.get("occupied") is True
    tag_uid = message.get("rfidUid") if occupied else None
    distance = message.get("distanceCm")
    try:
        distance = float(distance) if distance is not None else None
        if distance is not None and not 0 <= distance <= 1000:
            distance = None
    except (ValueError, TypeError):
        distance = None
    state = "Uncertain" if not sensor_ready else ("Occupied" if occupied else "Available")
    observation = {
        "facilityId": facility_id,
        "deviceId": device_id,
        "bayId": bay_id,
        "state": state,
        "observedAt": now,  # Use server receipt time; ESP32 toy demo need not have NTP.
        "vehicleLabel": identify_tag(tag_uid) if tag_uid else None,
        "sensorReady": sensor_ready,
        "distanceCm": distance,
    }
    return observation, {"type": "reading_ack", "bayId": bay_id, "observedAt": now}
