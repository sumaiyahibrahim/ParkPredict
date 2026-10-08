# ParkPredict system flow and ownership

## Runtime flow

1. Each HC-SR04 measures the distance from its overhead position to the nearest surface.
2. Firmware collects five readings, uses the median, debounces changes, updates the local LED, and sends a `bay_reading` message.
3. The ESP32 authenticates to `/ws/device` with its device ID and secret token. The gateway returns the saved thresholds so the firmware LEDs and backend classification use the same calibration.
4. FastAPI checks the facility, bay, sensor mapping, valid distance range, and saved thresholds. Server time is authoritative.
5. The gateway stores the latest observation in memory and broadcasts a normalized `bay_update` to `/ws/live`.
6. React parses only valid messages, marks old readings Stale after 12 seconds, and never counts Uncertain or Stale bays as available.

## Source of truth

| Information                              | Owner                                 |
| ---------------------------------------- | ------------------------------------- |
| Sensor pins, local filtering, LED output | ESP32 firmware                        |
| Bay-to-sensor mapping and thresholds     | FastAPI calibration store             |
| Current live observation                 | FastAPI in-memory occupancy store     |
| Connection/stale state                   | FastAPI plus frontend freshness check |
| Demo reservations and timers             | Browser local storage                 |
| Mapped parking locations                 | OpenStreetMap/Overpass                |
| Forecast examples                        | Frontend prediction engine            |

The browser booking flow is a product demonstration. It does not lock a physical gate or process payment. Live sensor occupancy is real when Live mode is selected and the gateway is connected.

## Stable identifiers

These values must match across the system:

- Facility: `demo:white-town`
- Device: `esp32-demo-01`
- Bays: `A1`, `A2`, `A3`, `A4`
- Sensors: `ultrasonic-a1`, `ultrasonic-a2`, `ultrasonic-a3`, `ultrasonic-a4`

## State rules

- **Occupied:** valid distance is at or below the occupied threshold.
- **Available:** valid distance is at or above the clear threshold.
- **Uncertain:** invalid distance, startup, or a value in the threshold gap without a previous stable state.
- **Stale:** the device disconnected or the observation is older than the freshness limit.

Only Available is offered as free. Occupied, Uncertain, and Stale remain unavailable.

## Folder ownership

- `src/` — React application and browser services.
- `backend/` — FastAPI IoT gateway and calibration persistence.
- `firmware/` — Arduino sketch and hardware documentation.
- `public/` — browser icons and static assets.
- `docs/` — architecture and technical explanations.
- `scripts/` — Windows setup and startup helpers.
- `.github/workflows/` — GitHub Pages deployment.

## Secrets

Never commit or share real values from:

- `.env`
- `backend/.env`
- `firmware/parkpredict_ultrasonic/secrets.h`

Only the matching `.example` files belong in Git.
