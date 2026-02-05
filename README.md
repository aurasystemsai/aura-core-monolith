# Aura Core Monolith

[![CI](https://github.com/aurasystemsai/aura-core-monolith/actions/workflows/ci.yml/badge.svg)](https://github.com/aurasystemsai/aura-core-monolith/actions/workflows/ci.yml)

A modern, full-stack Shopify automation and AI platform.

## Features
- React 18 frontend (Vite, modern UI, accessibility)
- Node.js/Express backend (API routes, file-based storage)
- Automated tests (Jest, React Testing Library, supertest)
- Robust error handling (backend and frontend)
- Tool registry and modular architecture
- Project, content, and automation management

## Recent Updates (Phase 6)
- Image Alt Media SEO exports now support similarity-scored JSON/CSV with `q` and `limit`, returning a `score` field when query filtering is used.
- Postgres performance hardening via pg_trgm GIN indexes alongside lower() btree indexes on url/alt_text to speed search and similarity.
- Console similarity finder adds a Clear control and scored CSV download to streamline refinement.

## Getting Started

### Prerequisites
- Node.js 22.x (22.22.0 used in CI)
- npm

### Install dependencies
```
npm install
```

### Run the backend
```
npm start
```

### Run the frontend (dev mode)
```
cd aura-console
npm install
npm run dev
```

### Run all tests
```
npm test
```
If Node 24+ causes Jest resolver issues or PowerShell blocks `npm.ps1`, use the bundled Node 22 runner:
```
npm run test:node22       # adjusts PATH to bundled node 22
npm run test:node22:direct # calls bundled node/npm directly (bypasses PowerShell policy)
npm run test:node22:direct:local # same, but also sets OPENAI_API_KEY=test-key for local runs
```

## Project Structure
- `src/` — Backend API, core logic, routes, tools
- `aura-console/` — React frontend (Vite, src/components, etc)
- `data/` — File-based storage (JSON, SQLite)
- `scripts/` — Utility scripts

## Tool Registry
Tools are modular and live in `src/tools/`. Each tool is auto-registered and can be extended or replaced.

### Featured tools
- Image Alt Media SEO: AI alt text generator with lint/grade, batch, analytics, Postgres persistence, Shopify HMAC/shop safeguards, and health checks. See [docs/IMAGE_ALT_MEDIA_SEO.md](docs/IMAGE_ALT_MEDIA_SEO.md).

## Error Handling
- All API routes return `{ ok: false, error: "..." }` on error
- Frontend shows errors via toast and inline messages
- Global error boundary for React render errors

## Testing
- Run `npm test` to execute all backend and frontend tests
- Coverage for all major API routes and UI components
- If Jest is blocked on Node 24+ export resolution, run `node scripts/manual-image-alt-test.js` to validate Image Alt Media SEO in-memory (`OPENAI_STUB=true`, no Postgres required).
- Use `npm run test:node22` to force tests under the bundled portable Node 22.22.0 at `.tools/node22` (helps avoid ABI issues with native modules).

## Security & Deployment

### CI/CD
Automated tests and builds run on every push and pull request via GitHub Actions. See the CI badge above for status.

### Deployment
Deploy to Render or your preferred cloud platform. Health checks are available at `/health`.
- Review `.env.example` for required environment variables
- Ensure sensitive data is protected
- Recommended: set up CI/CD for automated testing and deployment

## License
MIT
