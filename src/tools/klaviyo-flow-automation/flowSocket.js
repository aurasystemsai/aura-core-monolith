// flowSocket.js
// WebSocket server for real-time flow builder collaboration

const { Server } = require('ws');
let wss;
const clients = new Set();

function initFlowSocket(server) {
  wss = new Server({ server, path: '/ws/klaviyo-flow-automation' });
  wss.on('connection', ws => {
    clients.add(ws);
    ws.on('message', msg => {
      // Broadcast received flow update to all clients
      try {
        const data = JSON.parse(msg);
        if (data.type === 'flow-update') {
          broadcast('flow-update', data.payload);
        }
      } catch {}
    });
    ws.on('close', () => clients.delete(ws));
    ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to Flow Builder live updates.' }));
  });
}

function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload });
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) ws.send(message);
  }
}

module.exports = { initFlowSocket, broadcast };
