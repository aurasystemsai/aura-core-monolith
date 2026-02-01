// src/core/analyticsScheduler.js
// Simple in-process scheduler to run saved analytics schedules and emit notifications
const storageJson = require('./storageJson');
const notifications = require('./notifications');
const analyticsRouter = require('../routes/analytics');
const fetch = require('node-fetch');

const ALERT_HISTORY_KEY = 'analytics-alert-history';

const SCHEDULES_KEY = 'analytics-schedules';
const SCHEDULE_INTERVAL_MS = 5 * 60 * 1000; // check every 5 minutes

function isDue(schedule, now = Date.now()) {
  const { cadence = 'daily', lastRunAt = 0 } = schedule;
  const diff = now - (lastRunAt || 0);
  if (cadence === 'hourly') return diff >= 60 * 60 * 1000;
  if (cadence === 'weekly') return diff >= 7 * 24 * 60 * 60 * 1000;
  return diff >= 24 * 60 * 60 * 1000; // daily default
}

async function loadSchedules() {
  return storageJson.get(SCHEDULES_KEY, []);
}

async function saveSchedules(data) {
  return storageJson.set(SCHEDULES_KEY, data);
}

async function appendAlertHistory(entry) {
  const all = storageJson.get(ALERT_HISTORY_KEY, []);
  const next = [entry, ...all].slice(0, 500);
  await storageJson.set(ALERT_HISTORY_KEY, next);
}

async function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function deliverWebhookWithRetry(url, body, attempts = 2) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return { ok: true };
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await sleep(500 + i * 500);
    }
  }
  return { ok: false, error: lastErr?.message || 'webhook failed' };
}

async function deliverAlertNotification(schedule, message, payload = {}) {
  const channel = schedule.channel || 'inapp';
  const target = schedule.target || null;
  const stamp = Date.now();

  // Always add in-app notification trail
  notifications.addNotification({ type: channel === 'inapp' ? 'alert' : 'alert_delivery', message, time: stamp });

  // Only attempt external delivery when configured
  if ((channel === 'email' || channel === 'webhook') && !target) return { ok: false, error: 'missing target' };

  try {
    if (channel === 'webhook') {
      const resp = await deliverWebhookWithRetry(target, {
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        sentAt: new Date(stamp).toISOString(),
        type: 'analytics_alert',
        message,
        payload,
      });
      return resp;
    } else if (channel === 'email') {
      // Simulated email delivery: log to notifications feed
      notifications.addNotification({ type: 'email', message: `[analytics alert → ${target}] ${message}`, time: stamp });
      return { ok: true };
    }
  } catch (err) {
    notifications.addNotification({ type: 'analytics_error', message: `Alert delivery failed for ${schedule.name || schedule.id}: ${err.message}`, time: stamp });
    return { ok: false, error: err.message };
  }
  return { ok: true };
}

async function runSchedule(schedule) {
  const { shop, payload, id, name } = schedule;
  if (!shop || !payload) return { ok: false, error: 'missing shop/payload' };
  const result = await analyticsRouter.runAnalyticsQuery({ shop, body: payload });
  if (result.ok) {
    notifications.addNotification({ type: 'analytics', message: `Schedule ${name || id} ran successfully`, time: Date.now() });
    if (payload.alertEnabled && payload.alertThreshold) {
      const threshold = Number(payload.alertThreshold.replace(/[^0-9.-]/g, ''));
      const val = result.kpis?.total;
      if (typeof val === 'number' && typeof threshold === 'number' && !Number.isNaN(threshold)) {
        const triggered = val > threshold;
        if (triggered) {
          const msg = `Alert ${name || id}: total ${val} exceeded ${threshold}`;
          const historyEntry = {
            id: `alert_${Date.now()}`,
            shop,
            scheduleId: id,
            scheduleName: name,
            channel: schedule.channel || 'inapp',
            target: schedule.target || null,
            threshold,
            value: val,
            message: msg,
            triggeredAt: Date.now(),
          };
          await appendAlertHistory(historyEntry);
          const delivery = await deliverAlertNotification(schedule, msg, { total: val, threshold });
          schedule.lastDeliveryStatus = delivery.ok ? 'sent' : 'failed';
          schedule.lastDeliveryError = delivery.ok ? null : delivery.error;
          schedule.lastDeliveryAt = Date.now();
        }
      }
    }
  } else {
    notifications.addNotification({ type: 'analytics_error', message: `Schedule ${name || id} failed: ${result.error || 'unknown'}`, time: Date.now() });
  }
  return result;
}

let timer = null;

async function tick() {
  try {
    const now = Date.now();
    const schedules = await loadSchedules();
    let changed = false;
    for (const sched of schedules) {
      if (sched.paused) continue;
      if (!isDue(sched, now)) continue;
      try {
        const result = await runSchedule(sched);
        sched.lastRunAt = now;
        sched.lastStatus = result.ok ? 'ok' : 'error';
        sched.lastError = result.ok ? null : result.error;
        changed = true;
      } catch (err) {
        sched.lastRunAt = now;
        sched.lastStatus = 'error';
        sched.lastError = err.message;
        changed = true;
      }
    }
    if (changed) await saveSchedules(schedules);
  } catch (err) {
    notifications.addNotification({ type: 'analytics_error', message: `Scheduler tick failed: ${err.message}`, time: Date.now() });
  }
}

function start() {
  if (process.env.DISABLE_ANALYTICS_SCHEDULER === 'true') return;
  if (timer) return;
  timer = setInterval(tick, SCHEDULE_INTERVAL_MS);
  // kick off immediately
  tick();
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { start, stop };
