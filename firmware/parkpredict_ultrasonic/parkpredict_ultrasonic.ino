#include <Arduino.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include "secrets.h"

struct BayDefinition {
  const char *bayId; const char *sensorId; uint8_t triggerPin; uint8_t echoPin;
  uint8_t greenLedPin; uint8_t redLedPin;
  float minimumValidCm; float maximumValidCm; float occupiedThresholdCm; float clearThresholdCm;
};
BayDefinition bays[] = {
  {"A1", "ultrasonic-a1", 13, 34, 18, 19, 2, 60, 12, 15},
  {"A2", "ultrasonic-a2", 14, 35, 21, 22, 2, 60, 12, 15},
  {"A3", "ultrasonic-a3", 16, 32, 23, 25, 2, 60, 12, 15},
  {"A4", "ultrasonic-a4", 17, 33, 26, 27, 2, 60, 12, 15},
};
constexpr size_t BAY_COUNT = sizeof(bays) / sizeof(bays[0]);
constexpr size_t FILTER_SIZE = 5;
constexpr unsigned long ECHO_TIMEOUT_US = 30000;
constexpr unsigned long SENSOR_INTERVAL_MS = 75;
constexpr unsigned long REPORT_INTERVAL_MS = 1500;

struct BayRuntime {
  float samples[FILTER_SIZE] = {}; size_t sampleCount = 0; size_t sampleIndex = 0;
  float filteredDistance = NAN; bool occupied = false; bool stateKnown = false; bool sensorReady = false;
  uint8_t occupiedCount = 0; uint8_t availableCount = 0; uint8_t invalidCount = 0;
  unsigned long lastReportMs = 0; bool lastReportedOccupied = false; bool lastReportedReady = false;
};
BayRuntime runtime[BAY_COUNT];
WebSocketsClient webSocket;
bool socketStarted = false, authenticated = false;
size_t nextBay = 0;
unsigned long lastSensorMs = 0, lastHeartbeatMs = 0, lastWifiAttemptMs = 0;

void updateBayIndicator(size_t index) {
  const BayDefinition &bay = bays[index];
  const BayRuntime &state = runtime[index];
  const bool confirmed = state.sensorReady && state.stateKnown;
  digitalWrite(bay.greenLedPin, confirmed && !state.occupied ? HIGH : LOW);
  digitalWrite(bay.redLedPin, confirmed && state.occupied ? HIGH : LOW);
}

float median(float *values, size_t count) {
  float sorted[FILTER_SIZE];
  for (size_t i = 0; i < count; i++) sorted[i] = values[i];
  for (size_t i = 1; i < count; i++) {
    float value = sorted[i]; int j = (int)i - 1;
    while (j >= 0 && sorted[j] > value) { sorted[j + 1] = sorted[j]; j--; }
    sorted[j + 1] = value;
  }
  return sorted[count / 2];
}

float readDistanceCm(const BayDefinition &bay) {
  digitalWrite(bay.triggerPin, LOW); delayMicroseconds(3);
  digitalWrite(bay.triggerPin, HIGH); delayMicroseconds(10); digitalWrite(bay.triggerPin, LOW);
  unsigned long duration = pulseIn(bay.echoPin, HIGH, ECHO_TIMEOUT_US);
  if (!duration) return NAN;
  float distance = duration * 0.0343f / 2.0f;
  return isfinite(distance) && distance >= bay.minimumValidCm && distance <= bay.maximumValidCm ? distance : NAN;
}

void sendReading(size_t index, bool force = false) {
  if (!authenticated) return;
  BayRuntime &state = runtime[index];
  bool changed = state.sensorReady != state.lastReportedReady || (state.stateKnown && state.occupied != state.lastReportedOccupied);
  if (!force && !changed && millis() - state.lastReportMs < REPORT_INTERVAL_MS) return;
  StaticJsonDocument<320> doc;
  doc["type"] = "bay_reading"; doc["facilityId"] = "demo:white-town"; doc["deviceId"] = DEVICE_ID;
  doc["sensorId"] = bays[index].sensorId; doc["bayId"] = bays[index].bayId; doc["sensorReady"] = state.sensorReady;
  if (state.sensorReady && isfinite(state.filteredDistance)) doc["distanceCm"] = roundf(state.filteredDistance * 10) / 10;
  else doc["distanceCm"] = nullptr;
  doc["occupied"] = state.stateKnown && state.occupied;
  String payload; serializeJson(doc, payload); webSocket.sendTXT(payload);
  state.lastReportMs = millis(); state.lastReportedReady = state.sensorReady; state.lastReportedOccupied = state.occupied;
}

void applyFilteredState(size_t index, float distance) {
  BayRuntime &state = runtime[index]; BayDefinition &bay = bays[index];
  state.filteredDistance = distance; state.sensorReady = true; state.invalidCount = 0;
  bool occupiedCandidate = state.stateKnown && state.occupied ? distance < bay.clearThresholdCm : distance <= bay.occupiedThresholdCm;
  bool availableCandidate = state.stateKnown && state.occupied ? distance >= bay.clearThresholdCm : distance > bay.occupiedThresholdCm;
  state.occupiedCount = occupiedCandidate ? state.occupiedCount + 1 : 0;
  state.availableCount = availableCandidate ? state.availableCount + 1 : 0;
  if (state.occupiedCount >= 3) {
    state.occupied = true; state.stateKnown = true; state.occupiedCount = state.availableCount = 0;
  } else if (state.availableCount >= 4) {
    state.occupied = false; state.stateKnown = true; state.occupiedCount = state.availableCount = 0;
  }
  updateBayIndicator(index);
  sendReading(index);
}

void sampleBay(size_t index) {
  BayRuntime &state = runtime[index]; float distance = readDistanceCm(bays[index]);
  if (!isfinite(distance)) {
    if (++state.invalidCount >= 3) {
      state.sensorReady = false; state.filteredDistance = NAN; state.occupiedCount = state.availableCount = 0;
      updateBayIndicator(index);
      sendReading(index); Serial.printf("%s Echo invalid or timed out\n", bays[index].bayId);
    }
    return;
  }
  state.samples[state.sampleIndex] = distance; state.sampleIndex = (state.sampleIndex + 1) % FILTER_SIZE;
  if (state.sampleCount < FILTER_SIZE) state.sampleCount++;
  if (state.sampleCount == FILTER_SIZE) {
    applyFilteredState(index, median(state.samples, FILTER_SIZE));
    Serial.printf("%s %.1f cm %s\n", bays[index].bayId, state.filteredDistance, state.stateKnown ? (state.occupied ? "Occupied" : "Available") : "Stabilizing");
  }
}

void sendHeartbeat() {
  if (!authenticated) return;
  StaticJsonDocument<192> doc; doc["type"] = "heartbeat"; doc["deviceId"] = DEVICE_ID;
  doc.createNestedArray("facilityIds").add("demo:white-town");
  String payload; serializeJson(doc, payload); webSocket.sendTXT(payload);
}

void applyRemoteConfig(JsonArrayConst rows) {
  for (JsonObjectConst row : rows) {
    const char *bayId = row["bayId"] | "";
    const char *sensorId = row["sensorId"] | "";
    for (size_t i = 0; i < BAY_COUNT; i++) {
      if (strcmp(bays[i].bayId, bayId) != 0 || strcmp(bays[i].sensorId, sensorId) != 0) continue;
      bays[i].minimumValidCm = row["minimumValidCm"] | bays[i].minimumValidCm;
      bays[i].maximumValidCm = row["maximumValidCm"] | bays[i].maximumValidCm;
      bays[i].occupiedThresholdCm = row["occupiedThresholdCm"] | bays[i].occupiedThresholdCm;
      bays[i].clearThresholdCm = row["clearThresholdCm"] | bays[i].clearThresholdCm;
      runtime[i].occupiedCount = runtime[i].availableCount = 0;
      Serial.printf("%s calibration synced: occupied <= %.1f cm, clear >= %.1f cm\n", bays[i].bayId, bays[i].occupiedThresholdCm, bays[i].clearThresholdCm);
      break;
    }
  }
}
void socketEvent(WStype_t type, uint8_t *payload, size_t length) {
  if (type == WStype_CONNECTED) {
    StaticJsonDocument<256> doc; doc["type"] = "authenticate"; doc["deviceId"] = DEVICE_ID; doc["token"] = DEVICE_TOKEN;
    String message; serializeJson(doc, message); webSocket.sendTXT(message);
  } else if (type == WStype_TEXT) {
    StaticJsonDocument<1536> reply;
    if (deserializeJson(reply, payload, length)) return;
    const char *messageType = reply["type"] | "";
    if (strcmp(messageType, "auth_ok") == 0) {
      authenticated = true; Serial.println("Gateway authenticated.");
      for (size_t i = 0; i < BAY_COUNT; i++) sendReading(i, true);
    } else if (strcmp(messageType, "sensor_config") == 0 && reply["bays"].is<JsonArrayConst>()) {
      applyRemoteConfig(reply["bays"].as<JsonArrayConst>());
    }
  } else if (type == WStype_DISCONNECTED) {
    authenticated = false; Serial.println("Gateway disconnected; retrying.");
  }
}

void maintainNetwork() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!socketStarted) {
      webSocket.begin(GATEWAY_HOST, GATEWAY_PORT, "/ws/device"); webSocket.onEvent(socketEvent);
      webSocket.setReconnectInterval(3000); webSocket.enableHeartbeat(15000, 3000, 2); socketStarted = true;
    }
    webSocket.loop(); return;
  }
  authenticated = false;
  if (millis() - lastWifiAttemptMs >= 5000) {
    lastWifiAttemptMs = millis(); WiFi.disconnect(); WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.println("Connecting to 2.4 GHz Wi-Fi...");
  }
}

void setup() {
  Serial.begin(115200);
  for (size_t i = 0; i < BAY_COUNT; i++) {
    pinMode(bays[i].triggerPin, OUTPUT); digitalWrite(bays[i].triggerPin, LOW); pinMode(bays[i].echoPin, INPUT);
    pinMode(bays[i].greenLedPin, OUTPUT); pinMode(bays[i].redLedPin, OUTPUT);
    digitalWrite(bays[i].greenLedPin, LOW); digitalWrite(bays[i].redLedPin, LOW);
  }
  WiFi.mode(WIFI_STA); WiFi.begin(WIFI_SSID, WIFI_PASSWORD); lastWifiAttemptMs = millis();
  Serial.printf("ParkPredict ultrasonic gateway: %u bays\n", BAY_COUNT);
}

void loop() {
  maintainNetwork(); unsigned long now = millis();
  if (now - lastSensorMs >= SENSOR_INTERVAL_MS) {
    lastSensorMs = now; sampleBay(nextBay); nextBay = (nextBay + 1) % BAY_COUNT;
  }
  if (now - lastHeartbeatMs >= 10000) { lastHeartbeatMs = now; sendHeartbeat(); }
}
