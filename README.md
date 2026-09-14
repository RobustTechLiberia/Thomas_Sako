# 1847 Liberty — Custom CMS + Public Site

Rebuilt production CMS for the existing **1847 Liberty / Thomas Sako** site:

| App | Tech | Dev URL |
|-----|------|---------|
| Public frontend | React 19 + Vite 8 (`src/`) | http://localhost:5173 |
| Express server + CMS API | Node 24 + Express 5 | http://localhost:8080 |
| Admin UI | React 19 + Vite 8 (`admin/`) | http://localhost:5174 |
| Database | MySQL — existing `db_poll` | localhost:3306 |

## Quick start

```bash
npm install                 # public frontend deps
npm --prefix server install # server deps (bcrypt needs a rebuild on Windows)
npm --prefix admin install  # admin deps

npm run db:init             # migrations + seed (idempotent; safe on existing db_poll)
npm run dev:server          # API on :8080
npm run dev:client          # public site on :5173
npm run dev:admin           # CMS on :5174
```

Or all three at once: `npm run dev:all`.

## Environment

Server config lives in `server/.env` (see `server/.env.example`):

- `DB_*` — MySQL connection (existing `db_poll`).
- `JWT_SECRET` — signer for admin tokens (24h expiry).
- `CLIENT_URL` / `PUBLIC_URL` — CORS origins and the base used for unsubscribe links.
- `ADMIN_INITIAL_*` — first admin account; seeded/upserted idempotently on boot.
- `APPROVED_ORIGINS` — optional extra CORS origins (comma separated).
- `EMAIL_*` — SMTP for subscription confirmations; when unset, subscribers are still saved but `emailSent:false` (dev default).

Default seeded admin: `admin@liberty.local` / `@Admin1234` (change after first login).

## Database

Schema reuses the existing `db_poll`; migrations are additive only:

- `poll_questions`, `poll_votes` (+ `uq_poll_vote_dedup` unique index for atomic vote dedupe).
- `newsletter_subscribers` (unique email + `unsubscribe_token`).
- `admin_users` (+ `display_name` column).
- `site_settings` (JSON storage for hero / footer / social links).
- `media_assets`, `audit_log` (`old_values`/`new_values` are MySQL JSON columns).

Run migrations directly with `npm --prefix server run migrate`, seed with `npm --prefix server run seed`.

## Polls

Single "current" poll enforced by the backend: activating one deactivates others.

- `GET /api/polls/current` — active poll + counts + `hasVoted` for this client (IP + UA hashed).
- `POST /api/polls/:id/vote` → `201` recorded, `409` duplicate (deduped atomically per IP/user-agent hash).
- `GET /api/polls/:id/results` — vote counts.
- `GET /api/polls/stream?poll=:id` — Server-Sent Events; pushes `poll-update` events on every vote (no extra infra — in-memory hub).

## Subscribe

- `POST /api/subscribe` → `201` new / `200` already subscribed (idempotent). Pays a `unsubscribeUrl`.
- `GET /api/subscribe/unsubscribe?token=...` — one-click unsubscribe.

## Admin API (JWT)

Login: `POST /api/admin/auth/login` → `{ token, user }`. Bearer token required on:

`/api/admin/polls` · `/pages` · `/subscribers` · `/settings` · `/media` · `/users` · `/audit`

Roles: `admin` (everything) and `editor` (content, prompts, subscribers, settings; not users/audit management). Unauthenticated requests get `401`.

Every mutating admin action is written to `audit_log` (actor, action, entity, before/after JSON).

## Legacy endpoints (still served for older components)

`GET /poll`, `GET /results`, `GET /socialmedia`, `POST /db` (legacy vote), plus `POST /subscribe` → `POST /api/subscribe` via proxy. New components should use the `/api/*` versions.

## Tests

```bash
npm --prefix server run test   # node:test integration suite against live db_poll
```

Boots the app on an ephemeral port and covers health, public endpoints, admin auth/roles, vote dedupe (create → duplicate 409 → archive → delete), and subscriber idempotency/unsubscribe. Requires a reachable MySQL `db_poll` and the seeded admin creds.

## Public frontend integration

- Poll widget (`src/components/vote_poll/Questions/quest.jsx`) — `GET /api/polls/current`, `POST /api/polls/:id/vote`, live updates via SSE.
- Subscribe form (`src/components/subscribe/form.jsx`) — relative `/api/subscribe` with loading/success/error states.
- Social icons (`src/components/features/component/socialmedia_icon.jsx`) — relative `/api/social`.
- `vite.config.js` proxies `/api`, `/subscribe`, `/poll`, `/results`, `/socialmedia`, `/home`, `/db` to `http://localhost:8080`.

## Builds

```bash
npm run build        # public site → dist/
npm run build:admin  # admin → admin/dist/
npm run build:all    # both
```