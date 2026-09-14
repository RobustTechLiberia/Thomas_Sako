# 1847 Liberty — Production Installation Guide

This guide walks through deploying the **1847 Liberty** platform to a
production server. The whole platform is a **single deploy unit**: one Node.js
process (Express) serves the public site, the public API, and the admin CMS,
and connects to one MySQL/MariaDB database.

```
Browser ──► nginx (SSL) ──► Express (server/index.js, port 8080)
                              ├─ /              built public SPA   (dist/)
                              ├─ /admin         built CMS SPA      (admin/dist/)
                              ├─ /api           public API
                              ├─ /api/admin     CMS API (JWT)
                              └─ /uploads       locally-stored media
```

---

## 1. Prerequisites

- **Node.js 20.11+** (recommended: latest 22 LTS). Test with `node -v`.
- **MySQL or MariaDB** (requires the existing **`db_poll`** database — see
  Schema for what gets created automatically).
- For sending email: an SMTP account (Gmail works — App Password requires 2FA).
- A Linux server (Ubuntu/Debian instructions shown) with a public hostname,
  or a Windows VPS/iisnode if the project is deployed on Windows.

---

## 2. Install dependencies

From the project root (`Thomas_Sako`):

```bash
npm install                 # root tooling + public site
npm --prefix server install # API server
npm --prefix admin install  # admin CMS
```

> `server/package.json` uses Node 22.15.0 as its engine floor. If your distro
> ships an older Node, install the current LTS via nvm.

---

## 3. Put the built frontends together (build the SPAs)

```bash
npm run build:all
```

This runs `vite build` for the public site (outputs to `dist/`) and for the
admin CMS (outputs to `admin/dist/`). The Express server serves these folders
at `/` and `/admin` when they exist — **rebuild them after every frontend
change** and restart the server.

---

## 4. Configure the server

Copy the template and fill in every value:

```bash
cp server/.env.example server/.env
nano server/.env
```

| Variable | Notes |
|---|---|
| `PORT` | Internal port Express listens on (default `8080`). Keep it behind nginx; do not expose publicly. |
| `NODE_ENV` | `production` (hides stack traces, disables dev-only help). |
| `PUBLIC_URL` | Deployed public origin, e.g. `https://liberty.example`. Used as the unsubscribe base in emails. |
| `CLIENT_URL` | Same as `PUBLIC_URL` for a single-unit deploy. Content links in subscription notifications (podcast/playlist/poll) use this. |
| `DB_*` | Database credentials for `db_poll`. |
| `JWT_SECRET` | **Required.** Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `ADMIN_INITIAL_EMAIL` / `ADMIN_INITIAL_PASSWORD` | Creates the first CMS admin **only when the account does not exist**. |
| `ADMIN_FORCE_RESET` | `0` default. Set `1` only if the env must re-apply the password/role on **every** boot (overwrites CMS changes). |
| `EMAIL_USER` / `EMAIL_PASS` | SMTP login. `EMAIL_USER` must be a real email address (e.g. a Gmail App Password), **not** a display name. |
| `EMAIL_NOTIFY_TO` | Recipient of CMS notifications (news bookings, new content). |
| `YOUTUBE_API_KEY` | Optional. Blank = CMS-managed content shown; set it to pull latest uploads. |
| `YOUTUBE_CHANNEL_ID`, social links | Filled from the CMS Settings page on first boot if left blank. |

### Important email note

The SMTP **username must be an address** (`you@gmail.com`), and the `EMAIL_PASS`
must be an **App Password** when 2FA is enabled. A display name like
`1847 Liberty` is not a valid SMTP login and will cause authentication failures.

---

## 5. Database

The schema lives in `server/migrations/`. On every boot the server applies
migrations automatically (creates missing tables/columns — no manual DDL
needed) and seeds missing defaults + the initial admin account.

**No manual schema upgrade is needed** — migrations are additive. To reset
**all** content you may drop the tables and let the server recreate them, but
backups first (see Backups).

---

## 6. Run the server (single process)

```bash
npm start          # = npm --prefix server run start
```

Expected boot log:

```
✓ Seeded initial admin account: you@example.com   (only the first time)
✓ CMS server listening on http://localhost:8080
```

**Verify it is healthy before continuing:**

```bash
curl -s http://localhost:8080/health
curl -s http://localhost:8080/api/polls/current
curl -sI http://localhost:8080/admin/
```

Process supervision (choose one):

**systemd** (`/etc/systemd/system/liberty.service`):

```ini
[Unit]
Description=1847 Liberty CMS
After=network.target mysql.service

[Service]
WorkingDirectory=/opt/liberty/Thomas_Sako
ExecStart=/usr/bin/node server/index.js
Environment=NODE_ENV=production
EnvironmentFile=/opt/liberty/Thomas_Sako/server/.env
Restart=always
RestartSec=3
User=liberty
Group=liberty

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now liberty
sudo systemctl status liberty
sudo journalctl -u liberty -f
```

**PM2:**

```bash
npm i -g pm2
pm2 start server/index.js --name liberty --env production
pm2 save && pm2 startup
```

> `server/index.js` closes the DB pool and the open event streams on SIGTERM,
> so restarting (`systemctl restart liberty` / `pm2 restart`) is safe.

---

## 7. Reverse proxy + SSL (nginx)

The Node process must **not** be reachable directly. Put nginx in front:

```nginx
server {
    listen 80;
    server_name liberty.example www.liberty.example;

    client_max_body_size 12m;   # media uploads

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Real-time poll results (Server-Sent Events): keep it open, no buffering.
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 1h;
        proxy_set_header Connection '';
    }
}
```

Speed up static assets (optional, requires `sudo apt install nginx-extras` or
nginx≥1.21):

```nginx
location /assets/ {
    proxy_pass http://127.0.0.1:8080;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

Enable HTTPS — EFF certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d liberty.example -d www.liberty.example
```

Then set `PUBLIC_URL=https://liberty.example` and `CLIENT_URL=https://liberty.example`
in `server/.env` and restart the service. Rate limiting uses `req.ip`, which is
correct because the app trusts exactly **one** proxy hop (nginx).

> `proxy_read_timeout 1h` is required for the SSE stream at
> `GET /api/polls/stream?poll=<id>`. Disabling `proxy_buffering` lets poll
> results update live.

---

## 8. First-run checklist

1. `curl https://liberty.example/health` → `{"status":"ok",...}`
2. Open the public site: today's poll loads, newsletter subscribe shows the
   success modal, links go to `https://liberty.example/podcast` etc.
3. Open `https://liberty.example/admin` and log in with
   `ADMIN_INITIAL_EMAIL` / `ADMIN_INITIAL_PASSWORD`.
4. **Immediately** change the admin password (CMS → Users) and
   `rm server/.env` value for `ADMIN_INITIAL_PASSWORD` (or move it to a
   password manager). The seed only creates the account on first boot, so
   deleting the var does **not** break login.
5. Subscribe a test address and confirm the notification email + unsubscribe
   link arrive.
6. Configure SMTP real settings if not using Gmail, and run a booking test.

---

## 9. Backups

Back up two things, nightly:

```bash
# Database
mysqldump -u liberty -p db_poll > /var/backups/db_poll_$(date +%F).sql

# User media (uploads folder) + both built dists are re-creatable from code.
tar -czf /var/backups/uploads_$(date +%F).tgz -C server uploads
```

Keep at least 14 daily snapshots (e.g. `logrotate`) and, ideally, run
restores in a disposable copy before trusting a backup.

---

## 10. Updating

1. Back up (Section 9).
2. `git pull` (or upload the new code).
3. `npm install && npm run build:all` (+ server install if deps changed).
4. `sudo systemctl restart liberty` (migrations run automatically on boot).
5. `curl /health` and spot-check the public site + admin.

---

## 11. Security notes (what is already done and what to keep in mind)

**Hardened by default:**
- Helmet security headers (clickjacking, MIME sniffing, HSTS, referrer policy)
  — CSP is intentionally relaxed because CMS editors may reference third-party
  ad/sponsor/YouTube resources; the shell also loads Flowbite from a CDN.
- `X-Powered-By` disabled; `trust proxy` limited to one hop.
- Global rate limits on subscribe, voting, bookings; **login throttled
  (10 tries / 15 min per IP)**.
- JWT auth for all `/api/admin/*`; passwords hashed with bcrypt (cost 12);
  audit log records admin actions.
- Uploads restricted to `image/jpeg|png|gif|webp|svg+xml`, max 5 MB,
  served read-only from `/uploads`.
- Secrets never committed: `server/.env` + all `*.env` are gitignored.
- Dependency audit clean (`npm audit` reports 0 vulnerabilities) and every
  known advisory in transitive packages (cloudinary, bcrypt, nodemailer,
  qs, tar) has been resolved.

**Keep in mind:**
- `.env` is your only copy of secrets — keep a secure backup.
- Do not expose port `8080` directly (firewall/security group); nginx is the
  only public entry point.
- Submission endpoints (newsletter, bookings, voting) are rate-limited, but
  consider a WAF/CloudFront in front of nginx for DDoS-grade traffic.
- `EMAIL_USER` must be a real SMTP address (see Section 4).
- The admin token lives in `localStorage`; use HTTPS everywhere so it can
  never be read in transit.

---

## 12. Option B: Fly.io — one-command container deploy

Serverless platforms (Vercel/Netlify/Railway) don't fit this project (live
SSE poll streams, local disk uploads, MySQL). Fly.io runs the exact same
single-unit container this repo already deploys to, for bills under **$5/mo
(waived)** — effectively free tier. Files included:

- `Dockerfile` — multi-stage: installs deps with `npm ci`, builds both SPAs,
  then runs only the Express server (`node server/index.js`).
- `.dockerignore` — keeps node_modules, dists, `.env` and uploads out of the
  image context.
- `fly.toml` — one Machine, 256 MB, `force_https`, always-on
  (`min_machines_running = 1`), health check on `/health`, and a persistent
  volume for `/app/server/uploads`.
- `server/.env.fly.example` — Fly/Aiven-friendly template (MySQL via TLS).

**Prerequisites:** a Fly account (`flyctl auth login`), and a MySQL reachable
from the app (e.g. **Aiven MySQL free tier** — TLS-only, which this repo now
supports via `DB_SSL=1`).

```bash
# 1. Create the app + uploads volume (region must match fly.toml)
fly apps create APP_NAME
fly volumes create liberty_uploads --size 1 --region iad

# 2. Fill the template, then load it as Fly secrets (keeps them out of the image)
notepad server/.env.fly.example
fly secrets import < server/.env.fly.example

# 3. Set the app name from your fly.toml, then deploy
fly deploy      # builds the Dockerfile, starts the Machine

# 4. Verify
fly logs --app APP_NAME
curl -s https://APP_NAME.fly.dev/health
```

Notes:
- `PUBLIC_URL`/`CLIENT_URL` in the secrets are your `https://APP_NAME.fly.dev`
  origin (or a custom domain added via `fly certs add`); content links in
  emails point there.
- Media uploads are written to the `liberty_uploads` volume and survive
  redeploys/restarts.
- Updating: `fly deploy` rebuilds from the Dockerfile — nothing else to do.

---

## 13. Deploying on the Windows server instead

This project is developed on Windows; it deploys just as cleanly there.

Copy the **entire** project folder to the server (including `server/uploads`,
`public/`, and both `dist/` folders — or rebuild in place with
`npm run build:all`), then:

1. Install **Node.js 22 LTS** (https://nodejs.org), MySQL, and if you want
   HTTPS, Caddy or nginx for Windows.
2. Create the DB user + grant on `db_poll`.
3. Copy `server\.env.example` → `server\.env` and fill in Section 4.
4. Install + build:
   ```powershell
   npm install
   npm --prefix server install
   npm --prefix admin install
   npm run build:all
   ```
5. Run once to verify: `npm start`, then check `http://localhost:8080/health`.

Make it a service that auto-starts and survives restarts — **NSSM**:

```powershell
nssm install Liberty "C:\Program Files\nodejs\node.exe" "C:\path\Thomas_Sako\server\index.js"
nssm set Liberty AppDirectory "C:\path\Thomas_Sako"
nssm set Liberty AppEnvironmentExtra NODE_ENV=production
nssm set Liberty AppStdout "C:\path\Thomas_Sako\server\boot.log"
nssm set Liberty AppStderr "C:\path\Thomas_Sako\server\boot.err"
nssm set Liberty Start SERVICE_AUTO_START
nssm start Liberty
```

(Alternatively run `pm2 start server/index.js` under a pm2-windows-service.)

For HTTPS reverse proxy on Windows, run **Caddy** (single binary) — it
auto-renews SSL and proxies to 127.0.0.1:8080:

```caddyfile
liberty.example {
    reverse_proxy 127.0.0.1:8080
}
```

Then set `PUBLIC_URL`/`CLIENT_URL` to `https://liberty.example` and restart.
Open firewall only for 80/443; keep 8080 on localhost.

Troubleshooting:
- `Route not found: GET /podcast` in email links → you forgot to **rebuild +
  restart** after a change, or `CLIENT_URL` still points to `localhost:5173`.
  The SPA fallback serves any non-API GET from the built `dist/`.
- Login throttling kicks in → wait 15 minutes or restart the service
  (in-memory limiter resets on restart).
- Emails not sent → check SMTP vars and that `EMAIL_USER` is a login address;
  verify with `systemctl status` logs.

## 14. Option C: Vercel + Aiven MySQL (no credit card)

The cheapest zero-card hosting: **Vercel Hobby** serves the two built SPAs as
static files and runs the same Express API as a serverless function, talking to
a **free-tier Aiven MySQL** over public TLS. Your normal setup serves and runs
everything from one Express process; Vercel splits that into:

- static: `dist/` (public site) + `dist/admin/` (CMS) from `outputDirectory`
- dynamic: `api/index.js` — imports `server/app.js` and exports it (`export
  default app`), routes `vercel.json` map any `/api/*` request to it.

### What is already wired in this repo

- `vercel.json` — `buildCommand: node scripts/vercel-build.mjs`,
  `outputDirectory: dist`, rewrites for `/api/*`, `/admin/*`, SPA fallback.
- `scripts/vercel-build.mjs` — runs schema migrations + seeds one time at build
  time (against the Production env Vercel injects), installs `server/` and
  `admin/` deps, builds both SPAs, assembles `dist/admin`.
- `api/index.js` — the serverless entry point.
- `package.json` — the server's runtime deps are duplicated at the root so
  Vercel's function bundler can resolve `express`, `mysql2`, `bcrypt`, etc.
  (`npm run vercel:build` runs the build locally on the same machine).
- `server/config/env.js` + `server/db/pool.js` — TLS settings `DB_SSL`,
  `DB_SSL_CA` (Aiven CA pasted inline as an env var — serverless-safe),
  `DB_SSL_CA_PATH`, `DB_SSL_VERIFY`.

### 14.1 Create the Aiven MySQL (free)

1. Sign up at https://console.aiven.io (no credit card required).
2. Project → **Create service** → **MySQL** → **Free plan** (snap), name e.g.
   `liberty-cms`, pick a region near you, **Create service**.
3. Open **Service settings** and download **CA Certificate** (`ca.pem`).
4. **Connection information** gives you the service URI in the form
   `mysql://avnadmin:PASSWORD@HOST:PORTnet/defaultdb` — you need `HOST`
   (e.g. `liberty-cms-...aivencloud.com`), `PORT`, user `avnadmin`, the
   password, and database `defaultdb`.
5. Optional: under **Authentication**, set an IP allowlist to `0.0.0.0/0` (or
   leave open) so Vercel's functions can reach it over public TLS.

### 14.2 Create the Vercel project

1. Import this repo into Vercel (Hobby plan, no card). Framework auto-detect
   is overridden by `vercel.json`, so no preset is required.
2. Add these environment variables (Project → Settings → Environment
   Variables → **Production**, and Preview if you want):

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PUBLIC_URL` | `https://<your-project>.vercel.app` |
| `CLIENT_URL` | `https://<your-project>.vercel.app` |
| `DB_HOST` | Aiven `HOST` from step 14.1 |
| `DB_PORT` | Aiven `PORT` |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | the Aiven password |
| `DB_NAME` | `defaultdb` |
| `DB_SSL` | `1` |
| `DB_SSL_CA` | the full PEM text of `ca.pem` (multiline works) |
| `DB_SSL_VERIFY` | `1` — set to `0` only if TLS handshake fails on first deploy |
| `DB_CONNECTION_LIMIT` | `3` (serverless pools must be small) |
| `JWT_SECRET` | a long random string |
| `ADMIN_INITIAL_EMAIL` / `_PASSWORD` / `_NAME` | initial admin account |
| `ADMIN_FORCE_RESET` | `0` |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` | SMTP (optional) |
| `EMAIL_NOTIFY_TO` | contact form inbox (optional) |
| `YOUTUBE_API_KEY` / `YOUTUBE_CHANNEL_ID` / social links | optional |

   No `.env` file is ever sent to Vercel — it only reads these project vars
   (`.gitignore` excludes it from the repo import).

3. **Deploy** (or `npx vercel --prod` from the CLI after `vercel login`).
   The build applies migrations + seeds to Aiven once, then Vercel serves the
   site. Verify: `curl https://<your-project>.vercel.app/health` →
   `{"status":"ok",...}`.

### 14.3 Known free-tier limits

- **Live poll results (SSE):** `/api/polls/stream` uses a long-lived HTTP
  connection; serverless functions cap execution time and share no in-memory
  hub across instances, so the realtime feed is unreliable on Vercel. The poll
  list/form still works; voters just don't see live tallies until reload.
  A connector fallback (periodic polling in the UI) can be added later in
  `src/components/vote_poll/Questions/quest.jsx`.
- **CMS media uploads:** `server/uploads/` is local disk on your server; the
  Vercel function filesystem is ephemeral, so uploads will error. Keep media
  managed from a normal (Linux/Windows) deployment, or move uploads to an
  object store later.
- **Cold starts + rate limiters:** login throttling and the SSE hub are
  in-memory — they reset with every cold start.