# Analytics API & Integration Guide

## API Endpoints
- `POST /api/analytics/event` — Track a custom event (user, project, action, metadata)
- `GET /api/analytics/summary` — Get usage summary (active users, projects, content, etc)

## Example Event Payload
```
{
  "user": "user@example.com",
  "project": "project-id",
  "action": "content_created",
  "meta": { "tool": "blog-draft-engine" }
}
```

## Usage
- Use the event endpoint to track key actions (logins, content creation, project activity)
- Use the summary endpoint for dashboards and reporting

## Privacy
- No PII is stored in analytics events
- All analytics are opt-in and privacy-compliant

## Extending
- Add more event types or summary metrics as needed
- Integrate with external analytics (Segment, Amplitude, etc) if required

## Predictive Analytics Widgets (In-House Alerts)
- Tool: `predictive-analytics-widgets` — churn, LTV, demand, revenue forecasts plus anomaly highlights.
- Delivery model: Alerts are **simulated in-app only**; no Slack/webhook/email is sent. Routing is for preview and validation.
- Inputs: metrics, timeframe, granularity, cohort, benchmark peer set, scenario deltas, alert recipients (for preview), and routing.
- Outputs: widgets, forecasts, anomalies, cohort breakdown/trends, benchmarks, delivery preview (simulation), and recommended actions.
- Telemetry: local + cloud telemetry endpoints are available at `/api/paw-telemetry` for event capture and export.
