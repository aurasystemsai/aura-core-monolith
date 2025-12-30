# Webhook Integration Guide

## Webhook Endpoint
POST /api/webhooks/:event

- Accepts JSON payloads for external integrations (marketing, CRM, analytics, etc)
- Event types: user_signup, project_created, content_published, etc
- Secured with a shared secret (set WEBHOOK_SECRET in env)

## Example Request
POST /api/webhooks/user_signup
Headers: { "X-Webhook-Secret": "<your-secret>" }
Body:
{
  "user": "user@example.com",
  "timestamp": "2025-12-30T12:00:00Z"
}

## Usage
- Configure external systems to POST to this endpoint on relevant events
- Use for marketing automation, CRM sync, analytics, etc

## Security
- Requests without the correct secret are rejected
- All events are logged for audit/compliance

## Extending
- Add more event types as needed
- Integrate with internal automation or external APIs
