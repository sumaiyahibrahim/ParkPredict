from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any


def parse_device_message(
    device_id: str,
    message: object,
    calibration: dict[str, Any] | None,
    previous_state: str | None = None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """Validate an ultrasonic payload and derive an authoritative bay state."""
    if not isinstance(message, dict):
        return None, {"type": "error", "message": "Message must be a JSON object."}
    if message.get("type") != "bay_reading":
        return None, {"type": "error", "message": "Unsupported message type."}
    facility_id = str(message.get("facilityId", ""))[:80]
    bay_id = str(message.get("bayId", ""))[:40]
    sensor_id = str(message.get("sensorId", ""))[:80]
    if not facility_id or not bay_id or not sensor_id:
        return None, {"type": "error", "message": "facilityId, bayId and sensorId are required."}
    if not calibration:
        return None, {"type": "error", "message": "Bay is not configured."}
    if sensor_id != calibration["sensorId"]:
        return None, {"type": "error", "message": "sensorId does not match the configured bay."}
    if not isinstance(message.get("sensorReady"), bool) or not isinstance(message.get("occupied"), bool):
        return None, {"type": "error", "message": "sensorReady and occupied must be boolean values."}

    distance_value = message.get("distanceCm")
    distance: float | None = None
    if isinstance(distance_value, (int, float)) and not isinstance(distance_value, bool):
        candidate = float(distance_value)
        if math.isfinite(candidate):
            distance = round(candidate, 2)

    minimum = float(calibration["minimumValidCm"])
    maximum = float(calibration["maximumValidCm"])
    valid = distance is not None and minimum <= distance <= maximum
    ready = message["sensorReady"] is True and valid
    occupied_threshold = float(calibration["occupiedThresholdCm"])
    clear_threshold = float(calibration["clearThresholdCm"])

    if not ready:
        state = "Uncertain"
    elif previous_state == "Occupied":
        state = "Available" if distance >= clear_threshold else "Occupied"
    elif previous_state == "Available":
        state = "Occupied" if distance <= occupied_threshold else "Available"
    elif distance <= occupied_threshold:
        state = "Occupied"
    elif distance >= clear_threshold:
        state = "Available"
    else:
        state = "Uncertain"

    now = datetime.now(timezone.utc).isoformat()
    observation = {
        "facilityId": facility_id,
        "deviceId": device_id,
        "sensorId": sensor_id,
        "bayId": bay_id,
        "state": state,
        "observedAt": now,
        "sensorReady": ready,
        "distanceCm": distance if valid else None,
    }
    return observation, {"type": "reading_ack", "bayId": bay_id, "state": state, "observedAt": now}
