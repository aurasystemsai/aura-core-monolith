const express = require('express');
const router = express.Router();

// Dummy notifications (replace with real logic or DB)
const notifications = [
  { id: 1, type: 'info', message: 'Welcome to AURA Systems! Your dashboard is live.', time: Date.now() - 1000 * 60 * 60 },
  { id: 2, type: 'warning', message: 'Klaviyo integration not connected. Some automations may be limited.', time: Date.now() - 1000 * 60 * 30 },
  { id: 3, type: 'error', message: 'Failed to sync with Google Analytics. Please check your credentials.', time: Date.now() - 1000 * 60 * 10 },
];

router.get('/', (req, res) => {
  res.json({ notifications });
});

module.exports = router;
