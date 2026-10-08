# ParkPredict four-bay ultrasonic firmware

The sketch reads four HC-SR04 sensors sequentially, median-filters five samples, applies separate occupied and clear thresholds, debounces state changes, and sends authenticated WebSocket updates.

The physical model also uses four green LEDs, four red LEDs, and eight 220–330 Ω resistors so every bay has a local driver-facing indicator.

## GPIO map

| Bay | Sensor ID     | Trigger |    Echo | Green LED | Red LED |
| --- | ------------- | ------: | ------: | --------: | ------: |
| A1  | ultrasonic-a1 | GPIO 13 | GPIO 34 |   GPIO 18 | GPIO 19 |
| A2  | ultrasonic-a2 | GPIO 14 | GPIO 35 |   GPIO 21 | GPIO 22 |
| A3  | ultrasonic-a3 | GPIO 16 | GPIO 32 |   GPIO 23 | GPIO 25 |
| A4  | ultrasonic-a4 | GPIO 17 | GPIO 33 |   GPIO 26 | GPIO 27 |

GPIO 34 and 35 are input-only, which is appropriate for Echo.

## Bay indicator LEDs

Use one green LED and one red LED for every bay. Connect each assigned GPIO to the LED anode through its own 220–330 Ω current-limiting resistor. Connect each LED cathode to the common GND.

- Green on, red off: the sensor has confirmed that the bay is Available.
- Red on, green off: the sensor has confirmed that the bay is Occupied.
- Both off: the ESP32 is starting, the reading is still stabilizing, or the sensor reading is invalid. Treat the bay as unavailable until one LED turns on.

The indicators use the same filtered and debounced state sent to ParkPredict. They continue to show locally measured occupancy if Wi-Fi is interrupted. Never connect an LED directly without a resistor, and never allow green and red to mean different states in the physical model and website.

## Safe wiring

For each sensor, connect VCC to 5 V/VIN and GND to ESP32 GND. All components need a common ground. Connect Trigger directly to its assigned GPIO. Do not connect the approximately 5 V Echo output directly to an ESP32 input. For every Echo, place 1 kΩ between sensor Echo and the assigned GPIO, then 2 kΩ from that GPIO to GND. This divides the pulse to about 3.3 V.

## Setup

1. Install the ESP32 Arduino core, ArduinoJson 6, and WebSockets by Markus Sattler.
2. Copy secrets.example.h to secrets.h and enter the 2.4 GHz Wi-Fi details, gateway computer LAN IP, and matching device token.
3. Upload parkpredict_ultrasonic.ino and open Serial Monitor at 115200 baud.
4. Begin with every bay empty. Verify stable distances before placing toy cars.

The FastAPI gateway validates the bay mapping and distance, adds its timestamp, saves calibration, and publishes the authoritative state.

The gateway sends the current valid-range, occupied, and clear thresholds after authentication and whenever an administrator saves calibration. The ESP32 applies those values to its local LED logic, while the backend remains authoritative for the website state.
