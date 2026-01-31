"use strict";

const express = require("express");
const router = express.Router();
const storage = require("../core/storageJson");

const STORAGE_KEY = "paw-telemetry";
const MAX_EVENTS = 200;

const safeKey = (value) => {
  if (!value) return STORAGE_KEY;
  return `${STORAGE_KEY}-${String(value).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
};

const tenantKeyFromReq = (req) => {
  const shop = req.shopify?.dest || req.headers["x-shopify-shop-domain"];
  const project = req.headers["x-project-id"];
  return safeKey(shop || project || "shared");
};

router.get("/", async (req, res) => {
  try {
    const key = tenantKeyFromReq(req);
    const events = (await storage.get(key, [])) || [];
    return res.json({ ok: true, events: events.slice(-MAX_EVENTS), total: events.length });
  } catch (err) {
    console.error("[paw-telemetry] read error", err);
    return res.status(500).json({ ok: false, error: "Unable to read telemetry" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { event, payload } = req.body || {};
    if (!event) return res.status(400).json({ ok: false, error: "event is required" });
    const key = tenantKeyFromReq(req);
    const prev = (await storage.get(key, [])) || [];
    const next = [...prev, { event, payload: payload || {}, at: new Date().toISOString() }].slice(-MAX_EVENTS);
    await storage.set(key, next);
    return res.json({ ok: true, stored: next.length });
  } catch (err) {
    console.error("[paw-telemetry] write error", err);
    return res.status(500).json({ ok: false, error: "Unable to store telemetry" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const key = tenantKeyFromReq(req);
    await storage.set(key, []);
    return res.json({ ok: true, cleared: true });
  } catch (err) {
    console.error("[paw-telemetry] delete error", err);
    return res.status(500).json({ ok: false, error: "Unable to clear telemetry" });
  }
});

module.exports = router;
