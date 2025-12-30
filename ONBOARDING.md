# Developer Onboarding Guide

Welcome to Aura Core Monolith! This guide will help you get started as a developer.

## Prerequisites
- Node.js 18+
- npm
- (Optional) Docker for containerized development

## Setup
1. Clone the repository
2. Install dependencies:
   - `npm install` (root)
   - `cd aura-console && npm install`
3. Copy `.env.example` to `.env` and set secrets
4. Start backend: `npm start`
5. Start frontend: `cd aura-console && npm run dev`

## Running Tests
- `npm test` (backend and frontend)

## Linting & Formatting
- `npm run lint`
- `npm run format`

## API Reference
- See `docs/API.md` for all endpoints

## Security & Compliance
- See `SECURITY.md` and `PRIVACY.md`

## Health Checks
- `/health` and `/health/advanced` endpoints for monitoring

## Data Export
- `/api/users/export` for GDPR/data portability

## Contributing
- Open a pull request for all changes
- Follow code style and security best practices

## Support
- Contact maintainers for onboarding help or questions
