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
