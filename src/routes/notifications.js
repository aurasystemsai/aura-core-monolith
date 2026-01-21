const express = require('express');
const router = express.Router();


// Live notifications from persistent DB
const { listNotifications } = require('../core/notifications');

router.get('/', (req, res) => {
  try {
    const notifications = listNotifications(20);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
