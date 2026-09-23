# CyberArena — Vercel Deployment

CyberArena is now structured as a Vercel deployment:

- React/Vite frontend: `frontend/`
- Serverless Flask API: `api/index.py`
- API routes: `/api/*`
- SPA fallback: all non-API routes go to `index.html`
- Optional MongoDB Atlas persistence via `MONGO_URI`
- Realtime dashboard updates use lightweight API polling instead of Flask-SocketIO

## Deploy

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Keep the project root as the repository root.
4. Vercel will use `vercel.json` automatically.
5. Optional: add `MONGO_URI` in Vercel Project Settings → Environment Variables for persistent attack logs.
6. Redeploy.

## Verify

Open:

- `/api/health`
- `/`
- `/red-team`
- `/feed`
- `/intel`
- `/target`

The Red Team Console should launch simulated attacks and the dashboard should update without a `localhost:5000` dependency.

## Local development

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The existing Flask backend can still be run locally from `backend/` if desired. The Vercel deployment uses `api/index.py` instead.
