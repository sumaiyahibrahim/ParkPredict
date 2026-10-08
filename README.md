# ParkPredict

> **Building the physical demo? Start with [DEMO-MAKER-START-HERE.md](DEMO-MAKER-START-HERE.md).** It contains the wiring, configuration, startup, calibration, presentation, and troubleshooting procedure.

ParkPredict is a React and FastAPI smart parking demonstration. It combines OpenStreetMap parking discovery with live physical occupancy from four HC-SR04 ultrasonic sensors connected to one ESP32.

The connected demonstration facility has four bays: A1, A2, A3, and A4. One ultrasonic sensor measures each bay. The software derives capacity from the shared configured bay list rather than a fixed UI number.

## What the prototype proves

- Destination search and nearby mapped parking through OpenStreetMap.
- Four independent physical bay readings.
- Sequential ESP32 measurement to reduce ultrasonic cross-talk.
- Median filtering, range validation, hysteresis, and state debounce.
- Authenticated ESP32 to FastAPI WebSocket messages.
- Trusted gateway timestamps, stale detection, and live browser updates.
- Driver read-only status and protected Admin calibration controls.
- Booking preview restricted to fresh, online, sensor-ready Available bays.
- Honest separation between physical occupancy, reservations, and future estimates.

OpenStreetMap supplies locations and facility metadata. It does not supply live occupancy. Only a connected ParkPredict sensor facility has sensor-reported bay status.

## Architecture

1. Each HC-SR04 measures the distance from its mounting point to the bay surface or a toy car.
2. The ESP32 triggers only one sensor at a time, applies a five-sample median, hysteresis, and consecutive-reading confirmation.
3. The ESP32 authenticates to FastAPI at /ws/device and sends a reading for A1 through A4.
4. FastAPI validates the device, message size, facility, bay, sensor ID, distance range, and booleans.
5. FastAPI applies the saved per-bay calibration, adds a server timestamp, stores the latest state, and broadcasts it through /ws/live.
6. React updates the connected lot, map marker, driver dashboard, booking choices, assistant, forecast input, and Admin console.

See [docs/system-architecture.svg](docs/system-architecture.svg) for the visual flow and [docs/SYSTEM_FLOW.md](docs/SYSTEM_FLOW.md) for data ownership and state rules.

## Hardware

- One ESP32 development board with 2.4 GHz Wi-Fi.
- Four HC-SR04 ultrasonic sensors.
- Eight resistors for four Echo voltage dividers: four 1 kΩ and four 2 kΩ.
- Four green LEDs, four red LEDs, and eight 220–330 Ω LED resistors.
- Breadboard, jumper wires, USB cable, and a stable 5 V source suitable for the sensors.
- Cardboard parking model with bays A1 through A4.
- Four Hot Wheels or similar toy cars.
- A phone or computer on the same network for the local demonstration.

Ultrasonic sensors detect the presence of a suitable object. The toy cars need no electronic tag.

## GPIO mapping

| Bay | Sensor ID     | Trigger |    Echo | Green LED | Red LED |
| --- | ------------- | ------: | ------: | --------: | ------: |
| A1  | ultrasonic-a1 | GPIO 13 | GPIO 34 |   GPIO 18 | GPIO 19 |
| A2  | ultrasonic-a2 | GPIO 14 | GPIO 35 |   GPIO 21 | GPIO 22 |
| A3  | ultrasonic-a3 | GPIO 16 | GPIO 32 |   GPIO 23 | GPIO 25 |
| A4  | ultrasonic-a4 | GPIO 17 | GPIO 33 |   GPIO 26 | GPIO 27 |

GPIO 34 and 35 are input-only pins and are used only for Echo.

Each bay also has a physical green and red LED. Connect every LED through its own 220–330 Ω resistor. Green means the bay has been confirmed Available, red means it has been confirmed Occupied, and both off means the reading is not yet trustworthy. The LEDs deliberately remain off during startup, stabilization, or sensor failure rather than showing a false free space. Green indicates physical vacancy only; drivers must still follow reserved, accessible, EV, permit, and closed-bay signs.

## Safe sensor wiring

Repeat these connections for every HC-SR04:

1. Connect VCC to 5 V/VIN.
2. Connect GND to ESP32 GND. The ESP32, sensors, and power supply must share ground.
3. Connect Trigger directly to the assigned Trigger GPIO.
4. Put a 1 kΩ resistor between sensor Echo and the assigned ESP32 Echo GPIO.
5. Put a 2 kΩ resistor between that ESP32 Echo GPIO and GND.

The divider reduces the approximately 5 V HC-SR04 Echo signal to about 3.3 V. Never connect HC-SR04 Echo directly to an ESP32 input. Use one separate divider for every sensor and confirm the pin labels for the exact board before applying power.

## Sensor placement

- Mount one sensor above or facing the centre of each bay.
- Keep its beam aimed at a flat part of the toy car.
- Avoid bay dividers or walls inside the beam.
- Leave physical spacing between sensors.
- Trigger sensors sequentially, as the firmware does.
- Test each bay alone, then test adjacent bays together.

HC-SR04 modules suit an indoor tabletop prototype. A real garage needs industrial, protected sensors and a mounting survey.

## Calibration

Every bay stores independent values:

- emptyBaselineCm
- occupiedThresholdCm
- clearThresholdCm
- minimumValidCm
- maximumValidCm

Calibration procedure:

1. Empty the selected bay.
2. Confirm the sensor is aligned and producing stable valid distances.
3. In the protected Admin console, use Capture empty.
4. The gateway uses the fresh distance as the baseline and calculates conservative occupied and clear thresholds.
5. Review the values, then Save if adjusted.
6. Place a toy car in the bay and confirm only that bay becomes Occupied.
7. Remove the car and confirm the bay returns to Available after the clear debounce.
8. Repeat for all four bays and test neighbouring sensors.

The configuration is persisted by the backend in backend/data/sensor_config.json by default. This runtime file is ignored by Git. The public GitHub Pages Admin screen is a preview and cannot save to a local gateway.

## State safety

- Available: fresh, connected, sensor ready, valid distance, and beyond the clear threshold.
- Occupied: fresh valid distance inside the occupied condition.
- Uncertain: invalid or missing distance, sensor not ready, or a value between thresholds without a stable state.
- Stale: the device is offline or the reading is older than the configured limit.

A missing, invalid, uncertain, disconnected, or stale reading is never counted as available.

The sensor reports physical presence only. Reservation state is stored separately. A sensor cannot identify the vehicle or prove that a reservation exists.

## ESP32 message

Example bay reading:

    {
      "type": "bay_reading",
      "facilityId": "demo:white-town",
      "deviceId": "esp32-demo-01",
      "sensorId": "ultrasonic-a1",
      "bayId": "A1",
      "sensorReady": true,
      "distanceCm": 7.4,
      "occupied": true
    }

Heartbeat:

    {
      "type": "heartbeat",
      "deviceId": "esp32-demo-01",
      "facilityIds": ["demo:white-town"]
    }

The gateway does not trust a device timestamp. It adds the server receipt time and derives the published state from the distance and saved calibration.

## Environment configuration

Copy backend/.env.example to backend/.env and replace all placeholders:

    IOT_DEVICE_TOKENS={"esp32-demo-01":"replace-with-a-long-random-token"}
    IOT_STALE_AFTER_SECONDS=12
    IOT_MAX_MESSAGE_BYTES=2048
    PARKING_ADMIN_USERNAME=replace-with-admin-username
    PARKING_ADMIN_PASSWORD=replace-with-long-password
    PARKING_ADMIN_SIGNING_KEY=replace-with-separate-signing-key
    IOT_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174

Optional frontend .env.local values:

    VITE_IOT_FACILITY_ID=demo:white-town
    VITE_IOT_WS_URL=ws://192.168.1.10:8000/ws/live
    VITE_IOT_API_URL=http://192.168.1.10:8000

Use the gateway computer LAN IP when opening Vite from a phone. Add the exact phone-facing Vite origin to IOT_ALLOWED_ORIGINS.

Never commit backend/.env, frontend .env.local files, firmware secrets.h, Wi-Fi passwords, device tokens, Admin passwords, or signing keys.

## Local startup

Frontend:

    npm install
    npm run dev

Backend in a second terminal:

    cd backend
    python -m venv .venv
    .venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

Check the gateway at http://localhost:8000/api/iot/health.

## Firmware setup

1. Install the ESP32 Arduino core, ArduinoJson 6, and WebSockets by Markus Sattler.
2. Copy firmware/parkpredict_ultrasonic/secrets.example.h to secrets.h in the same folder.
3. Set the 2.4 GHz Wi-Fi details, gateway computer LAN IP, port 8000, device ID, and the matching device token.
4. Upload parkpredict_ultrasonic.ino.
5. Open Serial Monitor at 115200 baud.
6. Keep the gateway and browser running, then change the sensor dashboard from Demo to Live.

The firmware never waits forever for Wi-Fi or Echo. It uses a 30 ms Echo timeout, reconnects automatically, sends heartbeats, and reports invalid sensors as not ready.

## Demo mode

Demo mode always provides exactly:

| Bay | Initial state | Distance |
| --- | ------------- | -------: |
| A1  | Available     |    20 cm |
| A2  | Occupied      |     7 cm |
| A3  | Available     |    21 cm |
| A4  | Occupied      |     6 cm |

It is labelled Simulated ultrasonic feed, Demo data, and Not connected hardware. It contains no vehicle identities.

## Admin access

- Drivers can view bay state, sensor ID, distance, reporting status, and freshness.
- Drivers cannot open calibration controls.
- Admin credentials are checked only by FastAPI.
- A valid Admin receives an eight-hour signed session token.
- Calibration endpoints require that token.
- The website does not collect or store the ESP32 Wi-Fi password or device token.

## Failure handling

- Echo timeout, zero, negative, impossible, or out-of-range distance becomes Uncertain.
- Three invalid firmware readings mark the sensor not ready.
- The five-sample median reduces isolated noise.
- Consecutive occupied and clear confirmations prevent one-reading state changes.
- Separate occupied and clear thresholds prevent rapid threshold flicker.
- Sequential pings and spacing reduce cross-talk.
- Browser and ESP32 WebSockets reconnect automatically.
- A disconnected ESP32 makes its readings Stale.
- Duplicate device connections replace the earlier socket.
- Unauthorized devices are rejected.
- Malformed and oversized messages receive clear errors.
- Gateway restart clears the latest occupancy snapshot; saved calibration remains.

## Presentation procedure

1. Start FastAPI and React.
2. Sign in as a demo driver and open Find Parking.
3. Show Demo mode with A1 and A3 Available and A2 and A4 Occupied.
4. Start the ESP32 and change the dashboard to Live.
5. Confirm 4/4 sensors report.
6. Place a toy car in A1 and show only A1 change to Occupied after debounce.
7. Remove it and show A1 return to Available after the clear delay.
8. Interrupt one sensor or stop the ESP32 and show Uncertain or Stale rather than Available.
9. Sign in as Admin.
10. Show gateway status, sensor-to-bay mapping, live distances, and saved per-bay calibration.
11. Explain that drivers have read-only sensor access and that reservations remain separate.

## Evaluator explanation

ParkPredict combines mapped parking discovery with live occupancy readings from ultrasonic sensors installed at individual parking bays. The demonstration has four bays, A1 through A4, with one ultrasonic sensor assigned to each bay. Every sensor measures the distance to the bay surface. When a toy car is placed in a bay, the measured distance becomes shorter. The ESP32 filters the measurements and sends them through an authenticated WebSocket connection to the FastAPI gateway. The gateway validates, timestamps, stores, and broadcasts the readings. The React application then updates the bay status and map without refreshing.

The tabletop model uses toy cars because ultrasonic sensors detect distance to a suitable object and do not require tags or large metal vehicles. In a real covered garage, similar industrial sensors can be mounted overhead. The configurable bay definitions allow the same software structure to expand beyond four bays.

## Limitations

- Placement and angled surfaces affect ultrasonic reflection.
- Adjacent sensors can interfere if triggered together.
- Temperature changes the speed of sound.
- Wind and weather can reduce outdoor reliability.
- HC-SR04 is not a weatherproof production sensor.
- Presence sensing does not identify a vehicle.
- Latest occupancy is in memory; only calibration is persisted.
- GitHub Pages cannot securely reach a gateway running only on a private local network.
- Real booking needs operator inventory integration.
- Real SMS needs a messaging provider.
- Future availability is a transparent heuristic unless a trained and validated model is added.

## Production build

    npm run build

The project should be reviewed locally before any push or publication.
