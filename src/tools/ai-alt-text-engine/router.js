const express = require('express');
const bodyParser = require('body-parser');
const { run, meta } = require('./index');

const router = express.Router();
router.use(bodyParser.json());

// Tool metadata endpoint
router.get('/meta', (req, res) => {
  res.json(meta || {});
});

// Tool run endpoint
router.post('/run', async (req, res) => {
  try {
    const input = req.body;
    // Pass req, res for compatibility with other tools
    const result = await run(input, req, res);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || err });
  }
});

module.exports = router;
