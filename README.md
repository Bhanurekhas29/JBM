# JBM

Landing page with an admin panel.

- `frontend/` – React + Vite website, and the admin panel in `frontend/src/admin`
- `backend/` – core PHP API (`backend/api`) and database scripts (`backend/database`)
- Database: MySQL locally, TiDB Cloud (MySQL compatible) in production

## Run locally

1. Copy your MySQL login into `backend/config/config.local.php` (git-ignored). Defaults: host `127.0.0.1`, database `jbm`.
2. Create the tables and starting content: `php backend/database/seed.php`
3. Start the API: `php -S localhost:8000 -t backend`
4. Start the website: `cd frontend && npm install && npm run dev`
5. Website: http://localhost:5173/ – admin: http://localhost:5173/admin

## Deploy (Render + TiDB Cloud, free plans)

`render.yaml` and `Dockerfile` describe the Render service. Environment variables:

| Variable | Meaning |
|---|---|
| `DB_HOST`, `DB_USER`, `DB_PASS` | TiDB Cloud connection (port 4000, TLS on) |
| `DB_NAME` | `jbm` |
| `DB_SSL` | `1` (TiDB Cloud needs an encrypted connection) |
| `APP_KEY` | random secret that encrypts the saved SMTP password |
| `ADMIN_PASSWORD` | password for the `admin` login, used when the database is first created |

On every start the container creates/updates the tables (`seed.php`) and, only the first time, loads the starting
content from `backend/database/content.sql` (`import_content.php`). To refresh that snapshot from your local
database run `php backend/database/export_content.php`.

Note: Render's free plan has a temporary disk. Pictures uploaded through the admin after deployment are lost when the
service restarts or redeploys; pictures committed in `frontend/public/images` are kept.
