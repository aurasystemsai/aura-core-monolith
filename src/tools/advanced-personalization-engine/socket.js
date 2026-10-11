// src/tools/advanced-personalization-engine/socket.js
// WebSocket server for real-time updates (rules, analytics, notifications)
const { Server } = require('ws');
let wss;
const clients = new Set();

function init(server) {
  wss = new Server({ server });
  wss.on('connection', ws => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });
}

function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload });
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) ws.send(message);
  }
}

module.exports = { init, broadcast };