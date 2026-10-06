/*
 * ParkPredict five-bay RFID classroom demo for ESP32.
 * Use one MFRC522 reader per bay so each tag detection maps to a known bay.
 * Install Arduino libraries MFRC522, ArduinoJson 6, and WebSockets (Links2004).
 * Copy secrets.example.h to secrets.h and set Wi-Fi, gateway LAN IP, and token.
 */
#include <WiFi.h>
#include <SPI.h>
#include <MFRC522.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include "secrets.h"

static const char *FACILITY_ID = "demo:white-town";
static const char *DEVICE_ID = "esp32-demo-01";
static const uint8_t READER_COUNT = 5;
static const char *BAY_IDS[READER_COUNT] = {"A1", "A2", "A3", "A4", "A5"};
// ESP32 VSPI: SCK 18, MISO 19, MOSI 23. Each module needs a unique SS and RST.
static const uint8_t SS_PINS[READER_COUNT]  = {13, 14, 16, 17, 25};
static const uint8_t RST_PINS[READER_COUNT] = {26, 27, 32, 33, 4};
static const uint32_t POLL_INTERVAL_MS = 200;
static const uint32_t OCCUPIED_HOLD_MS = 8000;
static const uint32_t REPORT_INTERVAL_MS = 1500;
static const uint32_t HEARTBEAT_INTERVAL_MS = 5000;

MFRC522 reader0(SS_PINS[0], RST_PINS[0]);
MFRC522 reader1(SS_PINS[1], RST_PINS[1]);
MFRC522 reader2(SS_PINS[2], RST_PINS[2]);
MFRC522 reader3(SS_PINS[3], RST_PINS[3]);
MFRC522 reader4(SS_PINS[4], RST_PINS[4]);
MFRC522 *readers[READER_COUNT] = {&reader0, &reader1, &reader2, &reader3, &reader4};

WebSocketsClient webSocket;
bool readerReady[READER_COUNT] = {false, false, false, false, false};
bool tagSeen[READER_COUNT] = {false, false, false, false, false};
String lastUid[READER_COUNT];
uint32_t lastSeenAt[READER_COUNT] = {0, 0, 0, 0, 0};
uint32_t lastPolledAt = 0;
uint32_t lastReportedAt = 0;
uint32_t lastHeartbeatAt = 0;
bool authenticated = false;

String uidToString(const MFRC522::Uid &uid) {
  String value;
  for (byte i = 0; i < uid.size; i++) {
    if (uid.uidByte[i] < 0x10) value += '0';
    value += String(uid.uidByte[i], HEX);
  }
  value.toUpperCase();
  return value;
}

String readTagUid(MFRC522 &reader) {
  byte atqa[2];
  byte atqaSize = sizeof(atqa);
  const MFRC522::StatusCode wake = reader.PICC_WakeupA(atqa, &atqaSize);
  if (wake != MFRC522::STATUS_OK && wake != MFRC522::STATUS_COLLISION) return "";
  if (!reader.PICC_ReadCardSerial()) return "";
  const String uid = uidToString(reader.uid);
  reader.PICC_HaltA();
  reader.PCD_StopCrypto1();
  return uid;
}

void sendBayReading(uint8_t index, uint32_t now) {
  if (!authenticated || !webSocket.isConnected()) return;
  const bool occupied = readerReady[index] && tagSeen[index] && (now - lastSeenAt[index] <= OCCUPIED_HOLD_MS);
  StaticJsonDocument<256> doc;
  doc["type"] = "bay_reading";
  doc["facilityId"] = FACILITY_ID;
  doc["deviceId"] = DEVICE_ID;
  doc["bayId"] = BAY_IDS[index];
  doc["sensorReady"] = readerReady[index];
  doc["occupied"] = occupied;
  if (occupied && lastUid[index].length()) doc["rfidUid"] = lastUid[index];
  String payload;
  serializeJson(doc, payload);
  webSocket.sendTXT(payload);
}

void sendHeartbeat() {
  if (!authenticated || !webSocket.isConnected()) return;
  StaticJsonDocument<128> doc;
  doc["type"] = "heartbeat";
  doc["facilityIds"][0] = FACILITY_ID;
  String payload;
  serializeJson(doc, payload);
  webSocket.sendTXT(payload);
}

void onWebSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED: {
      authenticated = false;
      StaticJsonDocument<192> auth;
      auth["type"] = "authenticate";
      auth["deviceId"] = DEVICE_ID;
      auth["token"] = IOT_DEVICE_TOKEN;
      String body;
      serializeJson(auth, body);
      webSocket.sendTXT(body);
      Serial.println("Gateway connected; authenticating ESP32.");
      break;
    }
    case WStype_TEXT: {
      StaticJsonDocument<192> response;
      if (deserializeJson(response, payload, length)) break;
      const char *messageType = response["type"] | "";
      if (strcmp(messageType, "auth_ok") == 0) {
        authenticated = true;
        Serial.println("ESP32 authenticated with ParkPredict gateway.");
      }
      break;
    }
    case WStype_DISCONNECTED:
      authenticated = false;
      Serial.println("Gateway disconnected; reconnecting.");
      break;
    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  SPI.begin(18, 19, 23);
  for (uint8_t i = 0; i < READER_COUNT; i++) {
    pinMode(SS_PINS[i], OUTPUT);
    digitalWrite(SS_PINS[i], HIGH);
  }
  for (uint8_t i = 0; i < READER_COUNT; i++) {
    readers[i]->PCD_Init();
    const byte version = readers[i]->PCD_ReadRegister(MFRC522::VersionReg);
    readerReady[i] = version != 0x00 && version != 0xFF;
    Serial.printf("Bay %s RFID reader %s (version 0x%02X)\n",
                  BAY_IDS[i], readerReady[i] ? "ready" : "not detected", version);
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) { delay(350); Serial.print('.'); }
  Serial.printf("\nWi-Fi connected: %s\n", WiFi.localIP().toString().c_str());

  webSocket.begin(IOT_GATEWAY_HOST, IOT_GATEWAY_PORT, "/ws/device");
  webSocket.onEvent(onWebSocketEvent);
  webSocket.setReconnectInterval(3000);
  webSocket.enableHeartbeat(15000, 3000, 2);
}

void loop() {
  webSocket.loop();
  const uint32_t now = millis();
  if (now - lastPolledAt >= POLL_INTERVAL_MS) {
    lastPolledAt = now;
    for (uint8_t i = 0; i < READER_COUNT; i++) {
      if (!readerReady[i]) continue;
      const String uid = readTagUid(*readers[i]);
      if (uid.length()) {
        const bool newlySeen = !tagSeen[i] || lastUid[i] != uid || (now - lastSeenAt[i] > OCCUPIED_HOLD_MS);
        lastUid[i] = uid;
        lastSeenAt[i] = now;
        tagSeen[i] = true;
        if (newlySeen) Serial.printf("Bay %s detected RFID UID %s\n", BAY_IDS[i], uid.c_str());
      }
    }
  }
  if (now - lastReportedAt >= REPORT_INTERVAL_MS) {
    lastReportedAt = now;
    for (uint8_t i = 0; i < READER_COUNT; i++) sendBayReading(i, now);
  }
  if (now - lastHeartbeatAt >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatAt = now;
    sendHeartbeat();
  }
  delay(2);
}
