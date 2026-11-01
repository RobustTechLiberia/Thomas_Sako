# Thomas Sako

Thomas Sako is a modern media and personal-brand website built to make it easy for visitors to follow stories, explore shows and playlists, book appearances, join the mailing list, and take part in a daily poll.

The project pairs a polished React experience with a small server-side API. The poll is especially important: a visitor's vote is recorded in Google Sheets, and the app only confirms the vote after Google has confirmed that one row was written.

## Why this project matters

For a non-technical reader, this site is a home for content, conversation, and audience engagement. It gives the Thomas Sako brand a single place for articles, podcasts, bookings, contact information, social links, and an interactive daily question.

For recruiters, it demonstrates practical full-stack product work: responsive React UI, a protected server-side integration, third-party API reliability, environment-based configuration, deployment automation, and a user journey that stays smooth even when an external service is unavailable.

For developers, it is a Vite + React single-page application backed by an Express API deployed as a Vercel serverless function.

## What visitors can do

- Read and explore the site across desktop and mobile layouts.
- Browse podcast, playlist, biography, booking, advertising, and contact pages.
- Subscribe to updates.
- Vote in the daily poll and view results.
- Follow the brand through connected social channels.

## Daily poll experience

The daily poll is designed around two priorities: a low-friction visitor experience and dependable recording of votes.

1. The browser loads the current question from `public/questions.json`.
2. The visitor selects an answer and submits it.
3. The app sends the vote to `POST /question/vote` on the same domain.
4. The server appends one row to Google Sheets.
5. The server returns success only when Google confirms that exactly one row was updated.
6. The visitor is taken to the results page whether the write succeeds or the external service is temporarily unavailable.

To discourage repeat voting, the app uses a 24-hour browser-based vote lock. The server also sets a short-lived HTTP-only cookie after a confirmed vote. This is a practical anonymous-voting safeguard; it is not an account-based identity system, so a determined visitor can bypass it by clearing browser data or changing browsers.

Each confirmed vote is written as:

| Column | Value |
| --- | --- |
| A | ISO timestamp |
| B | Question text |
| C | Selected answer |
| D | Vote count (`1`) |
| E | Date (`YYYY-MM-DD`) |

## Technology at a glance

| Area | Tools |
| --- | --- |
| Front end | React 19, React Router, Vite, Tailwind CSS, Sass |
| API | Express, Helmet, CORS |
| Poll storage | Google Sheets API and a Google service account |
| Deployment | Vercel serverless functions and Vercel Web Analytics |
| Developer tooling | ESLint, Vite build, sitemap generation |

## Project structure

```text
src/                         React pages, components, styles, and assets
src/components/vote_poll/    Daily poll form and results experience
src/lib/api.js               Same-origin API URL helper
server/app.cjs               Express application entry point
server/routes/question.js    Vote validation and Google Sheets insertion
server/routes/subscribe.js   Subscription API route
server/routes/db.js          Google Sheets connection check
public/questions.json        Daily-poll question bank
vercel.json                  Vercel build and API route configuration
```

## Run locally

### Prerequisites

- Node.js 20 or later
- npm
- Google Cloud service-account access, only if you need to test real poll writes locally

### Install and start

```bash
npm ci
npm run dev:all
```

The React app runs through Vite. The API runs on port `8080`; Vite proxies poll requests to it during development.

Useful commands:

```bash
npm run lint       # Check code quality
npm run build      # Generate sitemap and production assets
npm run dev        # Start the front end only
npm run dev:server # Start the API only
npm run preview    # Preview the production build
```

## Google Sheets setup

The application reads credentials from server environment variables. Do not put credentials in frontend code, `VITE_*` variables, a committed `.env` file, or a service-account JSON file in this repository.

For local development only, create an untracked `server/.env` file containing:

```text
GOOGLE_CLIENT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_ID=your-spreadsheet-id-or-full-google-sheets-url
GOOGLE_SHEET_NAME=Sheet1
```

Then:

1. Enable **Google Sheets API** in the relevant Google Cloud project.
2. Share the target spreadsheet with `GOOGLE_CLIENT_EMAIL` and give it **Editor** access.
3. Ensure `GOOGLE_SHEET_NAME` matches the tab name exactly.

The app accepts either the raw spreadsheet ID or a full Google Sheets URL for `GOOGLE_SHEETS_ID`.

## Deploy to Vercel

Vercel builds the frontend and routes API requests to `server/app.cjs` through `vercel.json`.

1. Import the repository into Vercel with this directory as the project root.
2. In **Project Settings → Environment Variables**, add the variables below to Production and any Preview environments that need live polling:

   ```text
   GOOGLE_CLIENT_EMAIL
   GOOGLE_PRIVATE_KEY
   GOOGLE_SHEETS_ID
   GOOGLE_SHEET_NAME
   ```

3. Save the values and redeploy.
4. In the Vercel project, open the **Analytics** tab and enable Web Analytics.

`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, and the other Google values must not start with `VITE_`. Vite exposes `VITE_*` variables to the browser, while these values must remain available only to the serverless function.

When deployment is connected to GitHub, a normal release workflow is:

```bash
git status
git add package.json package-lock.json src/App.jsx
git diff --cached
git commit -m "Describe the change"
git push
```

Use explicit `git add` paths instead of `git add .` so credentials and local files cannot be accidentally committed.

## Health checks and troubleshooting

| URL | Purpose |
| --- | --- |
| `/health` | Confirms the API function is running. |
| `/db` | Confirms the deployed API can connect to Google Sheets. |

If `/db` fails:

- Confirm the Google Sheets API is enabled.
- Confirm the spreadsheet is shared with the service-account email as Editor.
- Replace `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` together using values from the same active service-account JSON key.
- Confirm the configured sheet tab name is correct.
- Redeploy after changing Vercel environment variables.
- Check Vercel Function logs for the safe error category; never copy private keys into logs, issues, chats, or commits.

## Security and privacy notes

- Service-account credentials are server-only and intentionally excluded from version control.
- Helmet adds HTTP security headers and request bodies are size-limited.
- Poll input is validated before it reaches Google Sheets.
- Google Sheets writes are confirmed before the API reports success.
- If a credential is ever committed or pasted into a public place, create a replacement key, update Vercel, and revoke the exposed key immediately.

## Quality checks

Before opening a pull request or deploying, run:

```bash
npm run lint
npm run build
```

For a live poll integration check, confirm `/db` is successful and submit one clearly labelled test vote. Verify the row appears in the configured sheet, then remove the test row.

## Maintainer handoff

This project is intentionally straightforward to maintain. Content and poll questions live close to the frontend, secrets stay in Vercel, and the API has small, focused routes. If you are taking over the project, start with the technology table above, run the local commands, review Vercel environment variables, and use `/db` before troubleshooting the poll itself.
