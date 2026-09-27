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
- Eight separate Puducherry walkthrough locations rendered immediately while mapped data is still loading, with fictional capacity and changing sample bay statuses. Each site has its own distinct illustrated parking scene; these are not CCTV frames. Sample lots provide vehicle preferences, sample prices, pass previews with QR tokens, a demo confirmation notification, a timer, and illustrative bay layouts. These are grouped separately from OpenStreetMap results and never claim actual occupancy or detection accuracy. The QR token is for the project preview and cannot be used for facility entry.
- User-triggered place lookup via Nominatim and nearby `amenity=parking` queries via Overpass. Results are community-mapped OpenStreetMap facilities within the selected radius, cached for 5 minutes. OpenStreetMap coverage is not a guaranteed complete inventory of every Puducherry parking facility; missing listings are not invented.
- Synchronized facility markers, result list, facility details, sourced amenities, distances, empty states, retry states, and honest provider failures. Directions open a Google Maps route to the selected facility. The sample lot destination is illustrative; verify the place before traveling.
- Filters for tagged EV charging, covered facilities, and known hourly prices. Street tiles are configured by default; satellite imagery can be enabled with a licensed provider URL and the required provider attribution in `VITE_SATELLITE_TILE_URL`.
- Prediction dashboard with 24 hourly points, selectable Puducherry sample or mapped lot, arrival date/time, lot-type diurnal curves, weekday/weekend adjustments, current-count blending, heuristic confidence, advice bands, and a recommendation rank weighted across distance, availability, forecast, price, and preferences. Occasion calendars and live operator feeds are not connected. Unknown mapped values stay unknown; sample occupancy/rates are illustrative and curves have not been validated against historical Puducherry measurements.
- Mobile map/results switching and separate facility administration screens.
- Project guide walkthrough explains mapped sources, illustrative bay layout/occupancy, vehicle, booking, assistant, and SMS setup. `ParkingCopilotService.ts` implements deterministic keyword rules for find-my-car, session extension, cheap parking, EV charging, airport search, bookings, and history. It does not call an LLM.
- Admin bay names can be edited in the setup view. A selected clip stays local; it is not uploaded or analyzed. Camera connection, video review, mapped bay geometry, CV status, and live detections are disabled until a secured processing service is integrated.
- “My parking” lets a driver start/end/extend a self-reported timer, shows its planned end, and reviews sessions saved only in the current browser; it also shows separately labeled sample history. Opt-in browser reminders run while the app is open. It does not track GPS in the background or reserve a space. Demo pass notifications are in-app and optional browser notifications; no SMS is sent by this build.
- Email/phone one-time-code authentication is available through Supabase when configured with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Without those values, the app offers a clearly labeled device-only demo profile, not a secure or verified account.
- Bookings includes a browser-local walkthrough flow: each sample lot card and its map detail have a direct Book this sample space action. The scrollable form collects vehicle, contact number, and duration, stores a pass reference/QR and sample bay, and starts a timer. A browser reminder is triggered about ten minutes before the timer ends (with a 15-minute option for demonstrations). It only assigns illustrative bays within this browser; it does not contact a parking operator, hold a real space, take payment, or deliver SMS. Phone SMS needs a configured provider. Real bookings remain unavailable without operator inventory.

## External setup before enabling integrations

### Maps and mapped parking

The development defaults use OSM standard raster tiles and the public Nominatim and Overpass services. OSM standard tiles are best effort and require visible attribution, normal browser caching, and no bulk/offline prefetch. Nominatim is user initiated, rate-limited to at most one request per second per application, must be cached and attributable, and forbids autocomplete. This client delays sequential geocoding requests and caches results, but a production multi-user service must enforce an aggregate limit and cache at the server. For sustained or commercial use, select a contracted tile/geocoding/Overpass provider or host the services; set `VITE_TILE_URL` and `VITE_OVERPASS_URL` to provider endpoints and follow their terms. The standard OSM tile policy may change.

### Account and notification setup

Copy the optional Supabase URL and anon key into `.env.local`, then restart Vite to enable verified email or phone one-time-code sign-in. Configure Supabase Auth email/SMS providers and templates in the Supabase project. The demo profile fallback stores contact details in this browser and is explicitly not secure authentication. The app's current session reminder is a browser notification while the page is open; sending actual phone SMS for expiry or nearby occupancy requires an authenticated backend, a verified messaging provider, consent, delivery callbacks, and durable scheduled jobs. No SMS is sent by this build.

Satellite tiles require a licensed provider URL and its correct attribution. The app intentionally does not ship an unkeyed third-party imagery endpoint.

### CCTV and computer vision

Before connecting cameras, obtain the campus/operator's authorization, use a secured server-side RTSP credential store, check institutional policy and current applicable Indian privacy requirements, and complete a privacy review. The current India DPDP Rules and Act materials should be checked at deployment time. A practical tracking baseline could use Ultralytics YOLO tracking, but it is licensed AGPL-3.0 by default; a proprietary/commercial deployment needs an appropriate commercial license. Tracking documentation: https://docs.ultralytics.com/modes/track/ and license: https://www.ultralytics.com/license. Select a detector and tracker with a reviewed license, then validate against labeled footage from each actual camera and report measured performance before enabling statuses. Keep raw video retention off by default. Do not add face, plate, or person recognition. A configured bay is Available only from recent clear evidence; otherwise emit Uncertain or Stale. Deduplicate shared bays across camera views by a stable facility bay ID. No CV processing service or camera connection is included yet.

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
