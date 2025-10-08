const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const MQTT_BROKER = 'mqtt://broker.emqx.io:1883';
const MQTT_TOPIC = 'PMS/d1';

let latestMessage = null;
let lastMessageTime = 0; // store the last received timestamp (in ms)

// Helper function to format time as human-readable string
function getReadableTime() {
  const now = new Date();
  return now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false
  });
}

// Connect to MQTT broker
const client = mqtt.connect(MQTT_BROKER);

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe(MQTT_TOPIC, (err) => {
    if (!err) console.log(`Subscribed to topic: ${MQTT_TOPIC}`);
  });
});

client.on('message', (topic, message) => {
  if (topic === MQTT_TOPIC) {
    let payload;
    try {
      payload = JSON.parse(message.toString());
    } catch (e) {
      payload = { raw: message.toString() };
    }

    latestMessage = {
      data: payload,
      timestamp: getReadableTime()
    };

    lastMessageTime = Date.now(); // store current time in ms
    console.log('New MQTT message:', latestMessage);
  }
});

// HTTP endpoint to get latest message
app.get('/api/latest', (req, res) => {
  const now = Date.now();
  const diffMinutes = (now - lastMessageTime) / (1000 * 60); // convert ms → minutes

  if (latestMessage && diffMinutes <= 5) {
    res.json(latestMessage);
  } else {
    res.json({
      data: "no response",
      timestamp: getReadableTime()
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
