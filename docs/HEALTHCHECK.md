# Advanced Health Check Endpoint
# Add this to your monitoring system or cloud health checks.
GET /health/advanced

Returns:
{
  ok: true,
  uptime: <seconds>,
  memory: { rss, heapTotal, heapUsed, external },
  db: "ok" | "error",
  version: <git commit or version>
}

- Checks Node.js process health, memory, uptime
- Checks database connectivity
- Returns current version/commit if available
- Use for readiness/liveness probes in Docker/K8s/cloud
