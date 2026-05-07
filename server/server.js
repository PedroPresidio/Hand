const express = require('express');
const cors = require('cors');
const { SerialPort } = require('serialport');
 
const app = express();
const PORT = 3000;
 
// CHANGE THIS TO YOUR REAL ARDUINO PORT
const SERIAL_PORT = 'COM8';
// macOS example: '/dev/cu.usbmodemXXXX'
// Linux example: '/dev/ttyACM0'
 
const BAUD_RATE = 115200;
 
app.use(cors());
app.use(express.json());
 
let port;
let distance = 999;

try {
  port = new SerialPort({
    path: SERIAL_PORT,
    baudRate: BAUD_RATE,
  });
 
  port.on('open', () => {
    console.log(`Serial port opened on ${SERIAL_PORT}`);
  });
 
  port.on('data', (data) => {
    const message = data.toString().trim();
    console.log('Arduino:', message);
    
    // Parse distance from Arduino: "DISTANCE:45"
    if (message.startsWith('DISTANCE:')) {
      const distanceStr = message.split(':')[1];
      const distanceValue = parseInt(distanceStr, 10);
      if (!isNaN(distanceValue)) {
        distance = distanceValue;
        console.log(`Distance: ${distance} cm`);
      }
    }
  });
 
  port.on('error', (err) => {
    console.error('Serial error:', err.message);
  });
} catch (error) {
  console.error('Failed to open serial port:', error.message);
}
 
app.get('/status', (req, res) => {
  res.json({
    ok: true,
    port: SERIAL_PORT,
    serialOpen: port ? port.isOpen : false,
  });
});

app.get('/distance', (req, res) => {
  res.json({ distance });
});

app.post('/distance', (req, res) => {
  distance = req.body.distance || 999;
  console.log(`Distance updated: ${distance} cm`);
  res.json({ ok: true });
});

app.post('/hand', (req, res) => {
  const {
    thumb = 0,
    index = 0,
    middle = 0,
    ring = 0,
    pinky = 0
  } = req.body;
 
  const line =
    `T:${Math.round(thumb)},` +
    `I:${Math.round(index)},` +
    `M:${Math.round(middle)},` +
    `R:${Math.round(ring)},` +
    `P:${Math.round(pinky)}\n`;
 
  console.log('Sending:', line.trim());
 
  if (!port || !port.isOpen) {
    return res.status(500).json({
      ok: false,
      error: 'Serial port not open'
    });
  }
 
  port.write(line, (err) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        error: err.message
      });
    }
 
    res.json({
      ok: true,
      sent: line.trim()
    });
  });
});
 
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
