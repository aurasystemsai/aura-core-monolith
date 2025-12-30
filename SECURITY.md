# Security Best Practices for Aura Core Monolith

## Reporting Security Issues
If you discover a vulnerability, please report it privately to the maintainers. Do not disclose it publicly until it is resolved.

## Key Security Controls
- All secrets and credentials must be stored in environment variables, never in code or version control.
- CORS is restricted to trusted origins (set CORS_ORIGINS in your environment).
- HTTPS is enforced in production.
- Sensitive user data (email, password) is encrypted at rest.
- Audit logging is enabled for critical actions.
- Fine-grained RBAC and SSO are implemented.
- Static file serving is restricted to safe extensions only.
- All dependencies should be regularly audited and updated.

## Secure Deployment Checklist
- [ ] Set strong, unique values for all secrets in your environment (.env, cloud config, etc).
- [ ] Set NODE_ENV=production in production environments.
- [ ] Set CORS_ORIGINS to a comma-separated list of trusted domains.
- [ ] Use a reverse proxy (Nginx, Caddy, etc) to terminate TLS and set secure headers for frontend.
- [ ] Run `npm audit` and update dependencies regularly.
- [ ] Review and update this document as new features are added.

## Contact
For security questions, contact the project maintainers.
