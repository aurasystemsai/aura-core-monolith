# Scaling & Cloud-Readiness Checklist

## Horizontal Scaling
- Use stateless API design (no in-memory sessions)
- Store sessions in Redis or database if needed
- Use a load balancer (cloud or Nginx) for multiple instances

## Database
- Support for both SQLite (dev) and Postgres (prod/cloud)
- Use connection pooling for Postgres
- Regular backups and restore procedures

## Docker & Orchestration
- Use official, minimal Node.js images
- Set resource limits in docker-compose.yml
- Use .dockerignore to exclude node_modules, logs, and secrets
- Ready for deployment to Docker Swarm, Kubernetes, or cloud platforms

## Environment & Secrets
- All secrets/config via environment variables
- Use secret managers in cloud (AWS Secrets Manager, Azure Key Vault, etc)

## Monitoring & Logging
- Use /health/advanced for readiness/liveness probes
- Centralized logging (stdout, cloud logging, or ELK stack)
- Alerting for errors and downtime

## CDN & Caching
- Serve static assets via CDN (Cloudflare, AWS CloudFront, etc)
- Enable HTTP caching headers for static files

## Zero-Downtime Deployments
- Use rolling updates in cloud or orchestrator
- Health checks for safe rollout

## Documentation
- See ONBOARDING.md, API.md, SECURITY.md, PRIVACY.md

## Next Steps
- Review this checklist before production launch
- Test in a staging environment that mirrors production
- Set up automated backups and monitoring
