# FastAPI IoT gateway

This folder receives authenticated ESP32 readings and broadcasts normalized bay states to the browser.

## Start

From the repository root after running `scripts/setup-demo.ps1`:

```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

Configuration belongs in `backend/.env`; copy `backend/.env.example` first. Runtime calibration is written to `backend/data/sensor_config.json` and is ignored by Git.

Endpoints:

- `GET /api/iot/health` — gateway/device/configuration status
- `GET /api/iot/bays` — current public bay snapshot
- `WS /ws/device` — authenticated ESP32 connection
- `WS /ws/live` — read-only browser updates
- `/api/admin/*` — authenticated technician operations

See the root `DEMO-MAKER-START-HERE.md` for the complete procedure.
