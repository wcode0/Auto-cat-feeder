#include <WiFi.h>
#include <ESP32Servo.h>

const char* ssid = "*******";
const char* password = "******";

Servo blocker;
Servo CatA;
Servo CatB;

WiFiServer server(80);

unsigned long lastProcess = 0;
unsigned long openTime = 5000;

String urlDecode(String s) {
  s.replace("%7B", "{");
  s.replace("%7D", "}");
  s.replace("%22", "\"");
  s.replace("%3A", ":");
  s.replace("%2C", ",");
  s.replace("%20", " ");
  return s;
}

void extractProbs(String json, float &a, float &b) {
  int n1s = json.indexOf(":\"") + 2;
  int n1e = json.indexOf("\"", n1s);
  a = json.substring(n1s, n1e).toFloat();
  int n2s = json.indexOf(":\"", n1e) + 2;
  int n2e = json.indexOf("\"", n2s);
  b = json.substring(n2s, n2e).toFloat();
}

void setup() {
  Serial.begin(115200);
  configTime(0, 0, "pool.ntp.org");

  blocker.attach(12);
  CatA.attach(14);
  CatB.attach(27);

  blocker.write(90);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(300);
  server.begin();

  ledcAttachPin(26, 0);
}

void loop() {

  // ----------- 5 PM and 7 AM event -----------
  int hourNow = localtime(&time(nullptr))->tm_hour;

  if (hourNow == 17 || hourNow == 7) {
    ledcWriteTone(0, 2000);
    CatA.write(90);
    CatB.write(90);
    delay(openTime);
    CatA.write(0);
    CatB.write(0);
    ledcWriteTone(0, 0);
    delay(3700000);
  }

  WiFiClient client = server.available();
  if (!client) return;

  if (millis() - lastProcess < 1000) { 
    client.stop();
    return; 
  }
  lastProcess = millis();

  String req = client.readStringUntil('\r');
  client.flush();

  if (req.indexOf("GET /probabilities?probs=") >= 0) {
    int start = req.indexOf("probs=") + 6;
    int end = req.indexOf(" ", start);
    if (end < 0) end = req.length();

    String encoded = req.substring(start, end);
    String json = urlDecode(encoded);

    float a, b;
    extractProbs(json, a, b);

    float high = max(a, b);

    if (high > 0.80) {
      if (a > b) blocker.write(0);
      else blocker.write(180);
    } 
    else {
      blocker.write(90);
    }

    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/plain");
    client.println("Connection: close");
    client.println();
    client.println("OK");
  }
}
