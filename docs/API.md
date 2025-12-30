# Aura Core Monolith API Reference

## Authentication
- All API routes require JWT authentication (Bearer token in Authorization header)
- Obtain a token via `/api/users/login` or SSO

## User Management
- `POST /api/users/register` — Register a new user (admin/manager only)
- `POST /api/users/login` — Login and receive JWT
- `GET /api/users/list` — List all users (admin/manager only)
- `GET /api/users/me` — Get current user info
- `GET /api/users/export` — Export all user data (GDPR/data portability)

## Projects & Content
- `GET /api/projects` — List projects
- `POST /api/projects` — Create project
- `GET /api/projects/:id` — Get project details
- `POST /api/projects/:projectId/drafts` — Create content draft
- `GET /api/projects/:projectId/drafts` — List drafts for a project

## Fix Queue
- `POST /api/projects/:projectId/fix-queue` — Add fix queue item
- `PATCH /api/projects/:projectId/fix-queue/:id` — Update fix queue item
- `POST /api/projects/:projectId/fix-queue/:id/done` — Mark fix queue item as done

## SSO
- `GET /sso/google` — Start Google OAuth2 SSO
- `GET /sso/google/callback` — Google SSO callback

## Health & Monitoring
- `GET /health` — Basic health check
- `GET /health/advanced` — Advanced health check (process, memory, DB, version)

## Security
- All sensitive data is encrypted at rest
- Audit logging is enabled for critical actions
- Fine-grained RBAC and SSO are implemented

## See also
- `SECURITY.md` — Security controls and best practices
- `PRIVACY.md` — Privacy policy
- `docs/DATA_EXPORT.md` — Data export API
- `docs/HEALTHCHECK.md` — Health check API
