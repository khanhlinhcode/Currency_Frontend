# Currency Frontend

## Run (Local)

```bash
nvm use
npm install
npm run dev
```

`nvm run dev` is not valid for Vite projects. Use `npm run dev`.

## Build

```bash
npm run lint
npm run build
```

## API URL

Frontend uses:

- `http://127.0.0.1:8000`

You can change it in `src/api/axios.js`.

## Default Admin Account (Backend DA_2)

- Username: `admin`
- Password: `admin123`

## Added Features

- Predict page with drag-drop upload, preview, loading state, top-3 confidence bars, suspicious warning.
- History page with search, filters, pagination, detail modal, CSV/PDF export.
- Dashboard with summary cards and analytics charts (pie/bar/line).
- Role-based route protection (`admin` / `analyst`) and session status indicator.
- Model Info page with architecture, dataset, classes, and training metadata.
- Deployment docs and configs: Vercel, Render, Railway.
# Currency_Frontend
