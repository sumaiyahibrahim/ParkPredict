"""Map demo tag UIDs to allowlisted, non-sensitive display labels."""

from __future__ import annotations

import json
import os


def _load_tag_map() -> dict[str, str]:
    raw = os.getenv("RFID_TAG_MAP", "{}")
    try:
        values = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError("RFID_TAG_MAP must be a JSON object of UID-to-label pairs") from exc
    if not isinstance(values, dict):
        raise RuntimeError("RFID_TAG_MAP must be a JSON object")
    return {str(uid).replace(" ", "").upper(): str(label)[:40] for uid, label in values.items() if uid and label}


def identify_tag(uid: object) -> str | None:
    if not isinstance(uid, str):
        return None
    return _load_tag_map().get(uid.replace(" ", "").upper())
