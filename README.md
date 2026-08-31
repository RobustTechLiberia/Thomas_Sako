# 1847 Liberty

1847 Liberty is a content-driven website for publishing shows, pages, polls, and community information. It pairs a React website with two backend services: an Express API for operational features and Strapi for editorial content.

## What is in this repository?

The application is intentionally split by responsibility:

```text
Browser
  │
  ├── React + Vite website (port 5173)
  │     ├── /api/* ──────────────► Strapi CMS (port 1337)
  │     └── /db, /subscribe, /home ► Express API (port 8080)
  │                                      ├── MySQL: poll votes
  │                                      └── SMTP: subscription emails
  │
  └── Strapi CMS
        └── SQLite: editorial content, media metadata, and CMS users
```

Strapi is the source of truth for website-managed content: pages, podcast episodes, daily polls, social links, and global site settings. Express remains the operational API for recording poll votes and sending subscription emails.

## Technology stack

| Area | Technology |
| --- | --- |
| Website | React 19, React Router, Vite, Tailwind CSS, Sass |
| Operational API | Node.js, Express 5, CORS |
| Headless CMS | Strapi 5 |
| CMS database | SQLite through `better-sqlite3` |
| Poll-vote database | MySQL through `mysql2` |
| Email | Nodemailer with an SMTP/Gmail transport |
| Tooling | ESLint, Nodemon, Concurrently |

## Requirements

- Node.js 20 LTS (the project is currently developed with Node `20.20.0`)
- npm 10+
- MySQL 8+ for poll-vote storage
- An SMTP/Gmail account for the subscription email feature

## Run locally

Install dependencies for all three applications once:

```bash
npm install
npm --prefix server install
npm --prefix cms install
```

Start the complete development environment:

```bash
npm run dev:all
```

This starts:

| Service | Address | Purpose |
| --- | --- | --- |
| Website | http://localhost:5173 | React development server |
| Express API | http://localhost:8080 | Poll vote, subscription, and social APIs |
| Strapi admin | http://localhost:1337/admin | Content editing and publishing |

To run a service by itself:

```bash
npm run dev           # Website
npm run dev:server    # Express API
npm run dev:cms       # Strapi CMS
```

Build the website for deployment:

```bash
npm run build
```

Build Strapi’s admin application when preparing a production CMS deployment:

```bash
npm --prefix cms run build
```

## First-time CMS setup

1. Start the CMS with `npm run dev:cms`.
2. Open http://localhost:1337/admin.
3. Create the first Strapi administrator account.
4. Go to **Content Manager** to add or edit content.
5. For public website reads, go to **Settings → Users & Permissions plugin → Roles → Public** and enable only the relevant `find` and `findOne` permissions.

On its first start, Strapi adds an editable record for every current route:

- Home (`/`)
- Podcast (`/podcast`)
- Playlist (`/playlist`)
- About (`/about`)
- Contact (`/contact`)
- Book Michael (`/book`)
- Advertising (`/advertising`)

The starter records are created only if a route does not already exist; editorial changes made in Strapi are never replaced by the seed process.

### CMS content model

| Content type | Use |
| --- | --- |
| **Page** | Route-aware website pages, navigation labels, hero text, SEO metadata, body content, and hero images |
| **Episode** | Podcast/video title, summary, video URL, air date, cover image, and featured state |
| **Poll** | A question, options, start/end dates, and its active state |
| **Social link** | Social platform links and display order |
| **Site settings** | Shared site name, tagline, contact email, and logo |

The React app sends Strapi requests to `/api`. Vite proxies this path to `http://localhost:1337` during local development. In a deployed frontend, set `VITE_STRAPI_URL` to the public Strapi API origin when the CMS is hosted on a different domain.

The poll component requests the active Strapi poll first. It retains the static `public/questions.json` file as a fallback until CMS public access is configured and an active poll has been published.

## Environment configuration

### Strapi

`cms/.env` contains development defaults. Never deploy those placeholder secrets. Copy the template and replace every secret before deployment:

```bash
cp cms/.env.example cms/.env
```

Required settings include `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, and `JWT_SECRET`. `CLIENT_URL` is the allowed browser origin for CMS CORS, and defaults to `http://localhost:5173`.

### Express API

Create `server/.env` for local credentials:

```dotenv
EMAIL_USER=your-gmail-address@example.com
EMAIL_PASS=your-smtp-or-app-password
YOUTUBE_CHANNEL_URL=https://youtube.com/@your-channel
FACEBOOK_PAGE_URL=https://facebook.com/your-page
X_PAGE_URL=https://x.com/your-account
INSTAGRAM_PAGE_URL=https://instagram.com/your-account
WHATSAPP_ACCOUNT=https://wa.me/your-number
TIKTOK_PAGE_URL=https://tiktok.com/@your-account
GMAIL_ACCOUNT=contact@example.com

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-local-password
```

Do not commit `.env` files, passwords, API tokens, or email credentials. The legacy poll database route currently contains local development defaults; move those values into environment variables before any shared or production use.

## Database architecture

### Strapi SQLite database

Strapi uses a local SQLite database by default. Its database file is created at `cms/.tmp/data.db`; it is intentionally ignored by Git. This database contains the CMS content, Strapi admin users, role/permission configuration, and media metadata. Uploaded files are stored locally under `cms/public/uploads` during development.

For production, use a managed database supported by Strapi (commonly PostgreSQL or MySQL) and persistent object storage for uploads. Back up both the database and uploaded media.

### MySQL poll-vote database

The Express API uses the `db_poll` MySQL database and its `poll` table to record audience answers and generate aggregate poll results. This data is separate from Strapi’s **Poll** content type:

- Strapi defines the editorial question and answer choices.
- MySQL records a visitor’s selected answer and supports result aggregation.

This separation keeps publishing content independent from high-frequency vote writes. The API exposes vote-related endpoints under `/db` and `/question`.

## API routes

| Service | Route | Description |
| --- | --- | --- |
| Strapi | `GET /api/polls` | Published CMS poll data, subject to Strapi permissions |
| Express | `POST /db` | Record a poll vote |
| Express | `GET /results?question=...` | Aggregate answers for a question |
| Express | `POST /question/submit` | Rate-limited poll submission path |
| Express | `POST /subscribe` | Send a subscription confirmation email |
| Express | `GET /api/socialmedia` | Read configured social media URLs |

## Project structure

```text
.
├── src/                         # React website
│   ├── components/              # Shared UI, feature pages, polls, subscribe UI
│   ├── images/                  # Website image assets
│   ├── lib/cms.js               # Strapi API client
│   ├── pages/                   # Top-level React pages
│   ├── App.jsx                  # Client-side routes
│   └── main.jsx                 # React application entry point
├── public/                      # Static files; includes questions.json fallback
├── server/                      # Express operational API
│   ├── routes/                  # Poll, subscription, database, and social routes
│   └── app.js                   # API server entry point
├── cms/                         # Strapi headless CMS
│   ├── config/                  # Server, database, admin, middleware configuration
│   ├── src/api/                 # Content-type schemas
│   ├── src/seed/pages.js        # First-run website page seed data
│   └── src/index.js             # Strapi bootstrap logic
├── vite.config.js               # Vite configuration and local API proxies
└── package.json                 # Root website scripts
```

## Development notes

- Keep editorial content in Strapi; do not hard-code newly managed copy in React components.
- Publish a CMS entry before expecting it to appear through the public API.
- Grant the Public Strapi role the minimum required read permissions; never expose CMS write permissions publicly.
- Treat MySQL credentials and SMTP credentials as secrets.
- Before deploying, replace development secrets, configure explicit CORS origins, and use persistent databases and media storage.

## Useful checks

```bash
npm run lint
npm run build
git diff --check
```
