# 1847 Liberty Platform

1847 Liberty is a content platform for publishing independent news, video shows, polls, playlists, and community stories. The repository contains the public React site, an operational Express API, a custom admin dashboard, and a Strapi headless CMS.

## Architecture

```text
Public browser
  └── React + Vite site :5173
      ├── /api/* ────────────────► Strapi :1337
      └── /db, /subscribe, /home ► Express API :8080 ──► MySQL

Editorial users
  ├── Strapi Admin :1337/admin ──► SQLite (local development)
  └── Custom Admin :3000 ─────────► Express API :8080 ──► MySQL
```

Use Strapi for editorial website content. Use the custom admin application for the operational dashboard features implemented by the Express API. MySQL remains the store for operational data such as votes, leads, and dashboard-managed records.

## Technology

| Area | Technology |
| --- | --- |
| Public website | React 19, React Router, Vite, Tailwind CSS, Sass |
| Operational API | Node.js, Express 5, MySQL (`mysql2`) |
| Editorial CMS | Strapi 5, SQLite (`better-sqlite3`) |
| Custom dashboard | React, Vite, Tailwind CSS |
| Email | Nodemailer / SMTP |
| Development | ESLint, Nodemon, Concurrently |

## Requirements

- Node.js 20 LTS and npm 10+
- MySQL 8+ for the Express API and custom dashboard
- SMTP credentials for the subscription-email feature

## Install and run locally

Install each application once:

```bash
npm install
npm --prefix server install
npm --prefix admin install
npm --prefix cms install
```

Start the entire local environment:

```bash
npm run dev:all
```

| Service | Address | Command |
| --- | --- | --- |
| Public site | http://localhost:5173 | `npm run dev:client` |
| Express API | http://localhost:8080 | `npm run dev:server` |
| Custom admin | http://localhost:3000 | `npm run dev:admin` |
| Strapi admin | http://localhost:1337/admin | `npm run dev:cms` |

To build all web applications:

```bash
npm run build:all
```

## Strapi CMS

Strapi is the source of truth for the public site’s editable content. It provides these content types:

| Content type | Purpose |
| --- | --- |
| Page | Website route, navigation label, hero text, SEO fields, content, and images |
| Episode | Video or podcast title, summary, URL, air date, cover image, and featured status |
| Poll | Editorial question, answer choices, active state, and publication dates |
| Social link | Social profile URL and display order |
| Site settings | Site name, tagline, contact email, and logo |

### First CMS start

1. Run `npm run dev:cms`.
2. Visit http://localhost:1337/admin and sign in with the local bootstrap administrator:
   `1847liberty@1847liberty.local` and password `1847@liberty`.
3. Open **Content Manager** and add or edit content.
4. In **Settings → Users & Permissions plugin → Roles → Public**, grant the minimum required `find` and `findOne` permissions for public content.

On its first startup, Strapi seeds editable records for the existing website routes: Home, Podcast, Playlist, About, Contact, Book Michael, and Advertising. Seed data creates only missing records and never overwrites editor changes.

The public React site requests Strapi through `/api`; Vite proxies this to `http://localhost:1337` in development. Set `VITE_STRAPI_URL` to the deployed CMS URL when the frontend and CMS are hosted separately.

## Environment configuration

### Strapi

Copy the CMS template and replace every placeholder secret before deployment:

```bash
cp cms/.env.example cms/.env
```

Set `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `CLIENT_URL`, and the `DEFAULT_ADMIN_*` values. The bootstrap account is created only if it does not already exist. Change its password immediately outside local development. `cms/.env`, Strapi’s local database, build output, and uploads are ignored by Git.

### Express API

Create `server/.env` locally:

```dotenv
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-local-password
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-smtp-or-app-password
YOUTUBE_CHANNEL_URL=https://youtube.com/@your-channel
FACEBOOK_PAGE_URL=https://facebook.com/your-page
X_PAGE_URL=https://x.com/your-account
INSTAGRAM_PAGE_URL=https://instagram.com/your-account
TIKTOK_PAGE_URL=https://tiktok.com/@your-account
```

Never commit credentials, access tokens, or production environment files. Use the included `.env.example` files as safe templates.

## Database design

### Editorial data: Strapi SQLite

For local development, Strapi stores content, roles, administrators, permissions, and media metadata in `cms/.tmp/data.db`. Local uploads are placed in `cms/public/uploads`. For production, migrate Strapi to a managed database such as PostgreSQL or MySQL and use persistent object storage for media.

### Operational data: MySQL

The Express service uses MySQL for vote recording, aggregate results, leads, and the custom admin API. The legacy poll-vote database is named `db_poll`; its `poll` table stores visitor answers separately from Strapi’s editorial **Poll** entries. This keeps publishing workflows independent of high-frequency vote writes.

## Main API routes

| Service | Route | Purpose |
| --- | --- | --- |
| Strapi | `GET /api/polls` | Published CMS polls, permission controlled |
| Express | `POST /db` | Record a poll vote |
| Express | `GET /results?question=...` | Poll result aggregation |
| Express | `POST /question/submit` | Rate-limited poll submission |
| Express | `POST /subscribe` | Subscription confirmation email |
| Express | `GET /api/socialmedia` | Social-link configuration |
| Express | `/api/admin/*` | Custom-admin dashboard endpoints |

## Repository structure

```text
.
├── src/                 # Public React website and responsive UI components
├── public/              # Static assets and questions.json fallback
├── server/              # Express API, MySQL schema, middleware, and admin routes
├── admin/               # Custom React administration dashboard
├── cms/                 # Strapi configuration, content schemas, and seed data
│   ├── config/          # Server, middleware, database, and admin settings
│   └── src/             # Strapi APIs and page-seeding bootstrap
├── vite.config.js       # Public-site development proxy configuration
└── package.json         # Root orchestration commands
```

## Quality checks

```bash
npm run lint
npm run build
git diff --check
```

Before deployment, replace development secrets, configure explicit CORS origins, use persistent databases and upload storage, and grant only the public API permissions the website needs.
