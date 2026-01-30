// Real-time Streaming Analytics and Predictive Alerts for Aura Systems
// Lightweight in-memory streaming engine with rolling stats, anomaly detection, and simple forecasting

const EventEmitter = require('events');
const notifications = require('./notifications');

class RealTimeAnalytics extends EventEmitter {
  constructor() {
    super();
    this.streams = new Map(); // metric -> [{ ts, value, meta }]
    this.maxPoints = 500;
    this.anomalySensitivity = 3; // std deviation multiplier
  }

  _getStream(metric) {
    if (!this.streams.has(metric)) this.streams.set(metric, []);
    return this.streams.get(metric);
  }

  ingest(metric, value, meta = {}) {
    const stream = this._getStream(metric);
    const point = { ts: Date.now(), value: Number(value), meta };
    stream.push(point);
    if (stream.length > this.maxPoints) stream.shift();

    this.emit('ingest', { metric, point });
    this._maybeAlert(metric, stream, point);
    return point;
  }

  getWindow(metric, windowMs = 60_000) {
    const stream = this._getStream(metric);
    const cutoff = Date.now() - windowMs;
    return stream.filter(p => p.ts >= cutoff);
  }

  stats(metric, windowMs = 60_000) {
    const window = this.getWindow(metric, windowMs);
    if (!window.length) return { count: 0, avg: 0, min: 0, max: 0, std: 0 };
    const values = window.map(p => p.value);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const variance = values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / count;
    const std = Math.sqrt(variance);
    return { count, avg, min, max, std };
  }

  forecast(metric, horizonMs = 30_000, windowMs = 120_000) {
    const window = this.getWindow(metric, windowMs);
    if (window.length < 3) return { ok: false, error: 'not enough data' };
    const { slope, intercept } = this._linearRegression(window);
    const targetTs = Date.now() + horizonMs;
    const forecastValue = slope * targetTs + intercept;
    return { ok: true, forecast: forecastValue, slope, intercept };
  }

  _maybeAlert(metric, stream, point) {
    if (stream.length < 10) return;
    const recent = stream.slice(-50);
    const values = recent.map(p => p.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / values.length;
    const std = Math.sqrt(variance) || 1;
    const z = Math.abs((point.value - avg) / std);
    if (z >= this.anomalySensitivity) {
      const message = `Anomaly detected on ${metric}: value=${point.value.toFixed(2)} (z=${z.toFixed(2)})`;
      notifications.addNotification({ type: 'alert', message, time: Date.now() });
      this.emit('alert', { metric, point, z });
    }
  }

  _linearRegression(points) {
    // points: [{ ts, value }]
    const n = points.length;
    const xs = points.map(p => p.ts);
    const ys = points.map(p => p.value);
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - meanX) * (ys[i] - meanY);
      den += Math.pow(xs[i] - meanX, 2);
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = meanY - slope * meanX;
    return { slope, intercept };
  }

  reset(metric) {
    if (metric) this.streams.delete(metric);
    else this.streams.clear();
  }
}

module.exports = new RealTimeAnalytics();
