# ParkPredict demo maker: start here

This is the only document the hardware/demo maker needs to begin. ParkPredict has three connected parts:

1. **ESP32 firmware** reads four HC-SR04 ultrasonic sensors and controls the bay LEDs.
2. **FastAPI gateway** authenticates the ESP32, validates readings, decides each bay state, and broadcasts updates.
3. **React website** shows the four live bay states and the rest of the parking product demonstration.

The live path is:

`Toy car -> ultrasonic sensor -> ESP32 -> Wi-Fi WebSocket -> FastAPI gateway -> browser WebSocket -> ParkPredict UI`

No RFID reader and no CCTV are used.

## 1. Hardware checklist

- 1 ESP32 development board
- 4 HC-SR04 ultrasonic sensors
- 4 green LEDs and 4 red LEDs
- 8 LED resistors, 220–330 ohm
- 4 x 1 kohm resistors and 4 x 2 kohm resistors for Echo voltage dividers
- Breadboard and jumper wires
- Data-capable USB cable
- Cardboard base and frame
- 4 toy cars
- A computer and a 2.4 GHz Wi-Fi network shared by the ESP32 and phone

## 2. Build the model

Use a base around 55 cm wide and 35 cm deep. Draw four equal bays, A1 to A4. A practical bay is about 11 cm wide and 22 cm deep, with a 7–8 cm driving lane in front. Build a rigid overhead bar and place each sensor over the center of its bay, pointing straight down.

Start with about 20 cm from each sensor face to the empty bay floor. A toy car should reduce the measured distance to roughly 5–10 cm. Keep sensors parallel and separated by the bay width. The firmware triggers only one sensor at a time to reduce cross-talk.

## 3. Wire the ESP32

| Bay |    TRIG | ECHO input | Green LED | Red LED |
| --- | ------: | ---------: | --------: | ------: |
| A1  | GPIO 13 |    GPIO 34 |   GPIO 18 | GPIO 19 |
| A2  | GPIO 14 |    GPIO 35 |   GPIO 21 | GPIO 22 |
| A3  | GPIO 16 |    GPIO 32 |   GPIO 23 | GPIO 25 |
| A4  | GPIO 17 |    GPIO 33 |   GPIO 26 | GPIO 27 |

For every HC-SR04:

- VCC -> ESP32 VIN/5V
- GND -> ESP32 GND
- TRIG -> the listed GPIO
- ECHO -> 1 kohm resistor -> listed ECHO GPIO
- From that ECHO GPIO junction -> 2 kohm resistor -> GND

The divider is mandatory because HC-SR04 Echo is about 5 V and ESP32 inputs are 3.3 V. All sensors, LEDs, and the ESP32 must share GND.

For every LED:

- listed GPIO -> 220–330 ohm resistor -> LED anode (long leg)
- LED cathode (short leg) -> GND

Green means available. Red means occupied. Both off means starting, invalid, or uncertain, so the bay must not be presented as available.

## Fastest Windows start

Double-click `START-DEMO.cmd`. On the first run it automatically installs the website and gateway dependencies and creates local configuration files. Later runs start the gateway and website directly.

For Live sensor mode, edit `.env`, `backend/.env`, and firmware `secrets.h` as described below.

## 4. Install the software once

Open PowerShell in the project folder and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-demo.ps1
```

This installs the web dependencies, creates `backend/.venv`, and installs the Python gateway dependencies.

## 5. Configure the gateway

Copy `backend/.env.example` to `backend/.env`. Set one long device token and administrator credentials. Example format:

```env
IOT_DEVICE_TOKENS={"esp32-demo-01":"use-a-long-random-token-here"}
PARKING_ADMIN_USERNAME=parking-admin
PARKING_ADMIN_PASSWORD=use-a-strong-password
PARKING_ADMIN_SIGNING_KEY=use-a-different-long-random-value
IOT_ALLOWED_ORIGINS=http://localhost:5173,http://YOUR_PC_IP:5173
```

Find the computer IPv4 address with `ipconfig`. Use the Wi-Fi adapter IPv4 value, such as `192.168.1.10`. Do not use the example address unless it is really the computer address.

Copy `.env.example` to `.env`, then use the same computer IP:

```env
VITE_IOT_WS_URL=ws://YOUR_PC_IP:8000/ws/live
VITE_IOT_API_URL=http://YOUR_PC_IP:8000
VITE_IOT_FACILITY_ID=demo:white-town
```

## 6. Configure and upload the ESP32

1. Install Arduino IDE and the ESP32 board package.
2. Install **ArduinoJson 6** and **WebSockets by Markus Sattler** from Library Manager.
3. Open `firmware/parkpredict_ultrasonic/parkpredict_ultrasonic.ino`.
4. Copy `secrets.example.h` to `secrets.h` in the same sketch folder.
5. Enter the 2.4 GHz Wi-Fi name/password, computer IPv4 address, and exactly the same token used in `backend/.env`.
6. Select the correct ESP32 board and COM port, then upload.
7. Open Serial Monitor at 115200 baud.

Expected messages include Wi-Fi connection attempts, `Gateway authenticated`, and readings such as `A2 7.0 cm Occupied`.

## 7. Run the complete demo

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-demo.ps1
```

This opens the gateway and web app in separate terminals. Confirm:

- Gateway health: `http://localhost:8000/api/iot/health`
- Website on computer: `http://localhost:5173`
- Website on phone: `http://YOUR_PC_IP:5173`

On the website, sign in, open **Find**, and switch **Live bay status** from Demo to Live.

## 8. Calibrate before presentation

1. Remove every toy car.
2. Confirm each sensor has a stable empty distance near its actual mounting height.
3. Sign in as the parking admin and open sensor management.
4. Capture the empty reading for A1–A4, or save suitable thresholds.
5. Put one car in one bay at a time and confirm its distance falls below the occupied threshold.
6. Remove it and confirm the reading rises above the clear threshold.

Default logic uses occupied at 12 cm or less and available at 15 cm or more. The gap prevents rapid red/green flickering. Calibration saved by the gateway overrides defaults and is immediately pushed to the connected ESP32, keeping the physical LEDs and website on the same thresholds.

## 9. Presentation sequence

1. Show four empty bays; all four green LEDs should be on.
2. Open ParkPredict in Live mode; all four bays should be available.
3. Place a car in A2; after filtering, A2 changes to red and the website shows Occupied.
4. Place another car in A4; the website shows 2 available and 2 occupied.
5. Remove the A2 car; its LED and website return to Available.
6. Disconnect one sensor only if demonstrating failure handling; both LEDs turn off and ParkPredict marks it Uncertain/Stale rather than available.

## 10. Troubleshooting

| Symptom                    | Check                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| ESP32 never connects       | Use 2.4 GHz Wi-Fi; verify SSID/password and PC IPv4 in `secrets.h`.                                     |
| Authentication rejected    | `DEVICE_ID` and token must exactly match `IOT_DEVICE_TOKENS`. Restart the gateway after editing `.env`. |
| Website stays disconnected | Start FastAPI, use the PC IP in `VITE_IOT_WS_URL`, and allow port 8000 through Windows Firewall.        |
| Phone cannot open the site | Phone and computer must share Wi-Fi; use `http://PC_IP:5173`; allow port 5173 through Firewall.         |
| All readings are invalid   | Check 5 V, common GND, Echo dividers, sensor direction, and the 2–60 cm valid range.                    |
| Wrong bay changes          | Check the GPIO table and labels; each sensor ID and bay ID is fixed in firmware.                        |
| State flickers             | Make the frame rigid, point sensors straight down, separate sensors, then recalibrate.                  |
| UI says Stale              | ESP32 stopped reporting for more than 12 seconds; check Wi-Fi, gateway, and Serial Monitor.             |

## 11. Final handoff checklist

- [ ] No direct 5 V Echo connection reaches the ESP32.
- [ ] Every LED has its own resistor.
- [ ] All grounds are common.
- [ ] `secrets.h`, `.env`, and `backend/.env` remain unshared/private.
- [ ] Gateway health reports four configured bays.
- [ ] A1–A4 each control the matching LED and website bay.
- [ ] Live mode works from the presentation phone.
- [ ] Demo mode still works if hardware is unavailable.
- [ ] The complete sequence has been rehearsed on the presentation Wi-Fi.

For code ownership and data rules, read `docs/SYSTEM_FLOW.md`. For the visual architecture, open `docs/system-architecture.svg`.
