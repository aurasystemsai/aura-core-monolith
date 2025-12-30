# Docker & Compose Usage

## Local Development

1. Build and run both backend and frontend:

   docker-compose up --build

- Backend: http://localhost:10000
- Frontend: http://localhost:3000

2. To rebuild after code changes:

   docker-compose build
   docker-compose up

## Production/Cloud
- Use the Dockerfiles for backend and frontend to deploy to any container platform (Render, AWS, GCP, Azure, etc).
- For Postgres, uncomment and configure the db service in docker-compose.yml.

## Notes
- Environment variables are loaded from .env for backend.
- Data is persisted in ./data (SQLite) or via Postgres volume.
- Frontend is served via Nginx in production mode.
