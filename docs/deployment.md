# Deployment Guide

## Frontend (Vercel)

### Files in this repo

- `vercel.json`: Vite build config + SPA rewrite

### Vercel setup

1. Import `currency-frontend` into Vercel.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Deploy.

## Backend (Render / Railway)

Backend code is in sibling folder: `../DA_2`.

### Required start command

Use module execution to avoid missing `uvicorn` shell path issues:

```bash
python -m uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

### Environment recommendations

- Python `3.11.x`
- Install from `requirements.txt`
- Keep CORS allow-list strict in production
- Rotate `SECRET_KEY` in `api/auth.py` via environment variable

## Production checklist

1. Move secrets (`SECRET_KEY`) to environment variables.
2. Replace SQLite with managed PostgreSQL for multi-instance production.
3. Configure persistent object storage for uploaded images.
4. Add centralized logs and error monitoring.
5. Add HTTPS custom domain for frontend and backend.
