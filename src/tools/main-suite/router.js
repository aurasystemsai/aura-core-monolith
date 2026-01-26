const express = require("express");
const modules = require("./modules");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, status: "Main Suite router active" });
});

router.get("/modules", (_req, res) => {
  res.json({ ok: true, modules });
});

module.exports = router;
