from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


class OccupancyStore:
    """In-memory latest-state store for a single-machine classroom demo."""
    def __init__(self) -> None:
        self.latest: dict[tuple[str, str], dict[str, Any]] = {}

    def update(self, observation: dict[str, Any]) -> None:
        self.latest[(observation["facilityId"], observation["bayId"])] = observation

    def rows(self, facility_id: str | None = None) -> list[dict[str, Any]]:
        rows = [row for row in self.latest.values() if not facility_id or row["facilityId"] == facility_id]
        return sorted(rows, key=lambda row: (row["facilityId"], row["bayId"]))

    @staticmethod
    def is_fresh(observation: dict[str, Any], max_age_seconds: int) -> bool:
        try:
            timestamp = datetime.fromisoformat(observation["observedAt"].replace("Z", "+00:00"))
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
            return (datetime.now(timezone.utc) - timestamp.astimezone(timezone.utc)).total_seconds() <= max_age_seconds
        except (ValueError, TypeError, KeyError):
            return False
