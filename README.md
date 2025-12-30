# Aura Core Monolith

A modern, full-stack Shopify automation and AI platform.

## Features
- React 18 frontend (Vite, modern UI, accessibility)
- Node.js/Express backend (API routes, file-based storage)
- Automated tests (Jest, React Testing Library, supertest)
- Robust error handling (backend and frontend)
- Tool registry and modular architecture
- Shopify app bridge integration
- Project, content, and automation management

## Getting Started

### Prerequisites
- Node.js 18+
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

## Project Structure
- `src/` — Backend API, core logic, routes, tools
- `aura-console/` — React frontend (Vite, src/components, etc)
- `data/` — File-based storage (JSON, SQLite)
- `scripts/` — Utility scripts

## Tool Registry
Tools are modular and live in `src/tools/`. Each tool is auto-registered and can be extended or replaced.

## Error Handling
- All API routes return `{ ok: false, error: "..." }` on error
- Frontend shows errors via toast and inline messages
- Global error boundary for React render errors

## Testing
- Run `npm test` to execute all backend and frontend tests
- Coverage for all major API routes and UI components

## Security & Deployment
- Review `.env.example` for required environment variables
- Ensure sensitive data is protected
- Recommended: set up CI/CD for automated testing and deployment

## License
MIT
