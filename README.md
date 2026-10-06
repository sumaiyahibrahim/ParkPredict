# ParkPredict

Responsive React, TypeScript, and Vite driver experience for searching mapped parking. Leaflet provides the interactive raster map; the map, geocoder, and parking search use replaceable OpenStreetMap based providers. Search requests are user initiated; the public Nominatim service is not used for autocomplete. Mapped listings never imply live occupancy.

## Run locally

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open the local Vite URL printed in the terminal. For a production bundle, run `npm run build`, then `npm run preview`.

## What works in this build

- Interactive Leaflet map with visible OpenStreetMap attribution, a 1–20 km search radius, location search, and map-point search. Opening Find Parking searches mapped parking near Puducherry; “Use my location” searches around the browser-provided location.
- Eight separate Puducherry sample locations rendered immediately while mapped data is still loading, with fictional capacity and changing sample bay statuses. Each site has its own distinct illustrated parking-bay layout. Sample lots provide vehicle preferences, sample prices, pass previews with QR tokens, a demo confirmation notification, a timer, and illustrative bay layouts. These are grouped separately from OpenStreetMap results and never claim actual occupancy or detection accuracy. The QR token is for the project preview and cannot be used for facility entry.
- User-triggered place lookup via Nominatim and nearby `amenity=parking` queries via Overpass. Results are community-mapped OpenStreetMap facilities within the selected radius, cached for 5 minutes. OpenStreetMap coverage is not a guaranteed complete inventory of every Puducherry parking facility; missing listings are not invented.
- Synchronized facility markers, result list, facility details, sourced amenities, distances, empty states, retry states, and honest provider failures. Directions open a Google Maps route to the selected facility. The sample lot destination is illustrative; verify the place before traveling.
- Filters for tagged EV charging, covered facilities, and known hourly prices. Street tiles are configured by default; satellite imagery can be enabled with a licensed provider URL and the required provider attribution in `VITE_SATELLITE_TILE_URL`.
- Prediction dashboard with 24 hourly points, selectable Puducherry sample or mapped lot, arrival date/time, lot-type diurnal curves, weekday/weekend adjustments, current-count blending, heuristic confidence, advice bands, and a recommendation rank weighted across distance, availability, forecast, price, and preferences. Occasion calendars and live operator feeds are not connected. Unknown mapped values stay unknown; sample occupancy/rates are illustrative and curves have not been validated against historical Puducherry measurements.
- Mobile map/results switching and separate facility administration screens.
- `ParkingCopilotService.ts` implements deterministic keyword rules for find-my-car, session extension, cheap parking, EV charging, airport search, bookings, and history. It does not call an LLM.
- The Find Parking screen has an IoT Bay Sensors panel with Demo/Live mode. Demo mode simulates five bay states. Live mode connects to the optional FastAPI WebSocket gateway and shows timestamped RFID bay states and mapped toy-car labels. The map marker for a facility ID linked to those sensors shows the sensor-reported empty-bay count. This gateway is an in-memory classroom prototype; its readings reset when it restarts.
- Driver accounts can view bay status, gateway IDs, and reading times. Technician access to Sensor Setup is checked by the FastAPI gateway; the eight-hour admin token is held in app memory. Reader mappings and Wi-Fi/token fields are temporary previews only: they are cleared when leaving the page and are not sent to the ESP32 or saved by the app.
- “My parking” lets a driver start/end/extend a self-reported timer, shows its planned end, and reviews sessions saved only in the current browser; it also shows separately labeled sample history. Opt-in browser reminders run while the app is open. It does not track GPS in the background or reserve a space. Demo pass notifications are in-app and optional browser notifications; no SMS is sent by this build.
- Email/phone one-time-code authentication is available through Supabase when configured with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Without those values, the app offers a clearly labeled device-only demo profile, not a secure or verified account.
- Bookings includes a browser-local sample flow: each sample lot card and its map detail have a direct Book this sample space action. The scrollable form collects vehicle, contact number, and duration, stores a pass reference/QR and sample bay, and starts a timer. A browser reminder is triggered about ten minutes before the timer ends (with a 15-minute option for demonstrations). It only assigns illustrative bays within this browser; it does not contact a parking operator, hold a real space, take payment, or deliver SMS. Phone SMS needs a configured provider. Real bookings remain unavailable without operator inventory.

## External setup before enabling integrations

### Maps and mapped parking

The development defaults use OSM standard raster tiles and the public Nominatim and Overpass services. OSM standard tiles are best effort and require visible attribution, normal browser caching, and no bulk/offline prefetch. Nominatim is user initiated, rate-limited to at most one request per second per application, must be cached and attributable, and forbids autocomplete. This client delays sequential geocoding requests and caches results, but a production multi-user service must enforce an aggregate limit and cache at the server. For sustained or commercial use, select a contracted tile/geocoding/Overpass provider or host the services; set `VITE_TILE_URL` and `VITE_OVERPASS_URL` to provider endpoints and follow their terms. The standard OSM tile policy may change.

### Account and notification setup

Copy the optional Supabase URL and anon key into `.env.local`, then restart Vite to enable verified email or phone one-time-code sign-in. Configure Supabase Auth email/SMS providers and templates in the Supabase project. The demo profile fallback stores contact details in this browser and is explicitly not secure authentication. The app's current session reminder is a browser notification while the page is open; sending actual phone SMS for expiry or nearby occupancy requires an authenticated backend, a verified messaging provider, consent, delivery callbacks, and durable scheduled jobs. No SMS is sent by this build.

Satellite tiles require a licensed provider URL and its correct attribution. The app intentionally does not ship an unkeyed third-party imagery endpoint.

### ESP32 + RFID bay demo

The gateway runs separately from Vite. It accepts authenticated ESP32 WebSocket messages at `/ws/device`; the browser subscribes to `/ws/live`. Use **one RC522 reader at each bay** to identify both the bay and tag. The latest readings are held in memory and reset when the gateway restarts.

Hardware for the 4–5 bay model: one ESP32, 4–5 RC522 modules, 4–5 RFID tags/cards, 4–5 toy cars, a breadboard, jumper wires, USB cable, and cardboard marked A1–A5. Attach a different tag to each car. A single reader can identify a tag near the reader, but cannot tell which of several bays it is in; individual bay mapping requires a reader per bay.

1. Install Python 3.10+ and create `backend/.env` from `backend/.env.example`. Set a long random device token, tag UID labels, a unique technician username/password, and a separate random signing key. Keep this file private; these technician credentials stay on the gateway and are never placed in Vite variables.
2. Install the backend dependencies: `python -m pip install -r backend/requirements.txt`.
3. Start the gateway from the repository root: `python -m uvicorn app.main:app --app-dir backend --env-file backend/.env --host 0.0.0.0 --port 8000`.
4. Copy `firmware/parkpredict_rfid/secrets.example.h` to `firmware/parkpredict_rfid/secrets.h`. Set Wi-Fi, the computer's LAN IP, and the same device token. Install Arduino libraries MFRC522, ArduinoJson 6, and WebSockets (Links2004), then flash `parkpredict_rfid.ino` to an ESP32.
5. In ParkPredict, choose **Sensor Setup** and sign in with the technician username/password from `backend/.env`. This screen is hidden behind gateway authentication; regular drivers can still view readings in Find Parking. Setup changes are temporary previews and do not modify backend or device configuration.
6. In Find Parking, switch RFID Bay Readers from Demo to Live. The default facility ID is `demo:white-town`. If Vite is opened on another device, set `VITE_IOT_WS_URL` and `VITE_IOT_API_URL` in `.env.local` to the gateway computer's LAN addresses, allow that origin in `IOT_ALLOWED_ORIGINS`, and restart Vite.

#### Wiring for five RC522 readers

Use 3.3 V for every RC522 module and a suitable regulated 3.3 V supply for the group. Share SPI and ground; each reader must have its own SS/SDA and RST line. Sketch pins: SCK→18, MISO→19, MOSI→23; SS for A1–A5→13, 14, 16, 17, 25; RST for A1–A5→26, 27, 32, 33, 4. Connect every module's 3.3V→3V3, GND→GND, SCK→18, MISO→19, MOSI→23, and its assigned SS and RST. Leave IRQ unconnected. Never connect RC522 VCC to 5 V. Confirm labels for your exact ESP32 board before wiring.

Place the tag close to its bay reader; RC522 range is short. The firmware holds a bay occupied for up to 8 seconds after the last read so the status does not flicker. Space readers and test tags so adjacent bays do not cross-read. The tag identifies a demo car label only; it does not verify the driver or reserve a real space. This tabletop demo shows sensor-to-app flow and does not prove full-size vehicle detection or outdoor reliability.

#### Message format

```json
{"type":"bay_reading","facilityId":"demo:white-town","deviceId":"esp32-demo-01","bayId":"A1","sensorReady":true,"occupied":true,"rfidUid":"A1B2C3D4"}
```

The gateway authenticates the device, timestamps readings, maps registered UIDs to labels, and broadcasts bay updates. Unknown tags can still mark a bay occupied but have no displayed label. Failed readers report `Uncertain`; missing or stale readings do not appear available. The prediction page can use fresh sensor counts, but the future curve remains a heuristic and is not trained on this gateway's history.

#### Integration check

1. Start the gateway and check `http://localhost:8000/api/iot/health` reports healthy.
2. Keep the app in Demo mode and confirm five sample bay states and toy-car labels appear.
3. Switch to Live without an ESP32; confirm the app reports the gateway unavailable, not fake live values.
4. Power the ESP32 and confirm all intended readers are detected in Serial Monitor; the ESP32 should connect and authenticate with the gateway.
5. Place the A1 car/tag over reader A1; confirm A1 changes to Occupied and shows the mapped label. Repeat for other bays. Remove the tag and wait for A1 to clear.
6. Try an unregistered tag; confirm occupancy appears without a vehicle label. Check that one bay's tag does not trigger a neighbouring reader.
7. Disconnect Wi-Fi or stop the gateway; confirm the feed reconnects or shows Stale, not Available.
8. Check that the map count and assistant occupancy answer respond to updates. Switch to Demo mode to present sample data if hardware is unavailable.

Use this as a low-voltage classroom prototype. Do not connect the ESP32 directly to mains or expose an unauthenticated gateway to the public internet.

### Operator bookings, payments, and user accounts

Connect a real operator or reservation API that exposes bookable inventory and atomic reserve/hold semantics. Implement server-side overlap protection, authentication or phone verification, facility-local time display with UTC storage, operator cancellation/extension rules, and confirmed tickets only after an operator confirmation. Collect only vehicle type and relevant accessibility/EV/height needs; collect a plate only when required by the operator. Add payment only if that operator requires it, through a real payment provider. Without those services, the app intentionally cannot create a confirmed booking or ticket.

### SMS reminders

Use a verified phone number and explicit opt-in. Complete applicable Twilio sender registration and TRAI template/registration requirements before sending in India. Store Twilio credentials on the server; configure delivery callbacks, retryable durable jobs, duplicate prevention, UTC booking times, and scheduled reminders/expiry. Show `SMS setup required` while unconfigured, and report provider acceptance or delivery failure accurately. SMS credentials belong only in the backend environment, never browser `VITE_` variables.

## Provider policies and references

- OSM tile policy: https://operations.osmfoundation.org/policies/tiles/
- Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
- Leaflet: https://leafletjs.com/reference.html
- Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API
- Indian data-protection materials: https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa
- Twilio Messages API and status callbacks: https://www.twilio.com/docs/messaging/api/message-resource and https://www.twilio.com/docs/usage/webhooks/messaging-webhooks
- TRAI sender guidance: https://www.trai.gov.in/advice-to-senders
