Pollen Web — Frontend (MVP)

Next.js 14 + TypeScript UI for the MVP: upload CSV/Excel files to your Data Workspace and preview tables.

Most setup and run instructions live in the repository root README. See `../README.md`.

Quick start (frontend only)

```powershell
cd frontend
npm install
npm run dev    # http://localhost:3000
```

Backend dependency

- The UI expects the backend API running at http://localhost:4000
- Start the backend per instructions in `../README.md` (Postgres/Redis via Docker, run migrations, then `npm run dev` and `npm run dev:worker`).

MVP routes

- /uploads — My Data: upload CSV/Excel, list tables, preview rows
- Home page links to /uploads; non-MVP pages are hidden or show placeholders

Troubleshooting

- If requests fail with CORS or auth errors, confirm the backend is running on port 4000 and that a JWT is present in localStorage (login via the app).
- If TypeScript or ESLint errors occur, ensure you’re on Node 18+ and run `npm install` again.
