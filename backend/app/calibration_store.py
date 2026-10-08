from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

DEFAULT_FACILITY = "demo:white-town"
DEFAULTS = [
    {"facilityId": DEFAULT_FACILITY, "bayId": "A1", "sensorId": "ultrasonic-a1", "emptyBaselineCm": 20.0, "occupiedThresholdCm": 12.0, "clearThresholdCm": 15.0, "minimumValidCm": 2.0, "maximumValidCm": 60.0},
    {"facilityId": DEFAULT_FACILITY, "bayId": "A2", "sensorId": "ultrasonic-a2", "emptyBaselineCm": 20.0, "occupiedThresholdCm": 12.0, "clearThresholdCm": 15.0, "minimumValidCm": 2.0, "maximumValidCm": 60.0},
    {"facilityId": DEFAULT_FACILITY, "bayId": "A3", "sensorId": "ultrasonic-a3", "emptyBaselineCm": 21.0, "occupiedThresholdCm": 12.0, "clearThresholdCm": 15.0, "minimumValidCm": 2.0, "maximumValidCm": 60.0},
    {"facilityId": DEFAULT_FACILITY, "bayId": "A4", "sensorId": "ultrasonic-a4", "emptyBaselineCm": 20.0, "occupiedThresholdCm": 12.0, "clearThresholdCm": 15.0, "minimumValidCm": 2.0, "maximumValidCm": 60.0},
]


class CalibrationStore:
    """Small persistent per-bay configuration store for the classroom gateway."""

    def __init__(self) -> None:
        default_path = Path(__file__).resolve().parents[1] / "data" / "sensor_config.json"
        self.path = Path(os.getenv("IOT_CALIBRATION_FILE", str(default_path))).expanduser()
        self._rows: dict[tuple[str, str], dict[str, Any]] = {
            (row["facilityId"], row["bayId"]): dict(row) for row in DEFAULTS
        }
        self._load()

    def _load(self) -> None:
        if not self.path.exists():
            return
        try:
            data = json.loads(self.path.read_text(encoding="utf-8"))
            if isinstance(data, list):
                for row in data:
                    if isinstance(row, dict) and row.get("facilityId") and row.get("bayId") and row.get("sensorId"):
                        self._rows[(str(row["facilityId"]), str(row["bayId"]))] = dict(row)
        except (OSError, json.JSONDecodeError):
            pass

    def _save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.path.with_suffix(".tmp")
        temporary.write_text(json.dumps(self.rows(), indent=2), encoding="utf-8")
        temporary.replace(self.path)

    def rows(self, facility_id: str | None = None) -> list[dict[str, Any]]:
        rows = [dict(row) for row in self._rows.values() if not facility_id or row["facilityId"] == facility_id]
        return sorted(rows, key=lambda row: (row["facilityId"], row["bayId"]))

    def get(self, facility_id: str, bay_id: str) -> dict[str, Any] | None:
        row = self._rows.get((facility_id, bay_id))
        return dict(row) if row else None

    def update(self, row: dict[str, Any]) -> dict[str, Any]:
        stored = dict(row)
        self._rows[(stored["facilityId"], stored["bayId"])] = stored
        self._save()
        return dict(stored)
