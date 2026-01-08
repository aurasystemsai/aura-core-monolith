// abTestingSuiteSocket.js
// WebSocket server for real-time A/B test experiment updates

const { Server } = require('ws');
let wss;

function initABTestingSuiteSocket(server) {
  wss = new Server({ server, path: '/ws/ab-testing-suite' });
  wss.on('connection', (ws) => {
    ws.on('message', (msg) => {
      // Handle incoming messages if needed
      // Example: ws.send(JSON.stringify({ type: 'pong' }));
    });
    ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to A/B Testing Suite live updates.' }));
  });
}

function broadcastExperimentUpdate(update) {
  if (!wss) return;
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'experiment-update', data: update }));
    }
  });
}

module.exports = { initABTestingSuiteSocket, broadcastExperimentUpdate };