# Deployment Guide

For the free diagnostic staging path, use `render.free.yaml` in this frontend repository and see `currency-backend/docs/free-staging-runbook.md`. Set `VITE_API_URL` to the Render Free backend HTTPS URL and `VITE_APP_ENV=staging`. The backend model remains a candidate until grouped data passes release gates.

Current production setup is documented in `currency-backend/docs/production-runbook.md`. Set `VITE_API_URL` in Vercel to the deployed backend HTTPS URL before building. The backend uses Docker, PostgreSQL, private S3 compatible storage, Alembic migrations and `/ready` health checks.

For staging, set `VITE_API_URL` to the staging backend and `VITE_APP_ENV=staging`. The prediction page then requires login, matching the staging API policy. See `currency-backend/docs/staging-runbook.md` for the isolated database, bucket and benchmark gates.

## Frontend (Vercel)

### Files in this repo

- `vercel.json`: Vite build config + SPA rewrite

### Vercel setup

1. Import `currency-frontend` into Vercel.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Deploy.

## Backend (Render / Railway)

Backend code is in sibling folder: `../currency-backend`.

### Required start command

The Dockerfile starts the backend. Render and Railway run the migration before starting it:

```bash
python -m alembic upgrade head
```

### Environment recommendations

- Python `3.11.x`
- Docker installs `requirements-api.txt`
- Keep CORS allow-list strict in production
- Provide `SECRET_KEY` through a secret environment variable

## Production checklist

1. Pass dataset audit and model evaluation gates; set release manifest to `approved`.
2. Configure managed PostgreSQL and private S3 compatible storage.
3. Configure frontend `VITE_API_URL` and backend `CORS_ORIGINS` with exact HTTPS origins.
4. Verify `/ready`, login, prediction, history, review and dashboard after deploy.
