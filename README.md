# Thomas Sako site

The app is a Vite/React site with an Express API deployed as a Vercel serverless
function. The vote form submits to the same-origin endpoint
`POST /question/vote`; it does not use a localhost URL in production.

## Local Google Sheets configuration

For local development, add the Google Sheets values to an untracked
`server/.env` file. In Vercel, add them through Project Settings → Environment
Variables. Never commit a service-account JSON file, `.env` file, or private
key. Values already set by the host take precedence over `server/.env`.

## Deploy to Vercel

Import the repository with the project root set to this directory. Vercel uses
`vercel.json` to build the Vite app and route API requests to `server/app.cjs`.
No custom output directory or framework override is required.

This project deploys through Vercel's Git integration, so no Vercel CLI is
required. Commit the changes you want to publish, then run `npm run deploy`.
The script builds the site and pushes `main` to GitHub; Vercel deploys that push
automatically when this repository is connected to the Vercel project.

The former GitHub Pages command is available as `npm run deploy:github-pages`
when that hosting target is intentional.

Add these environment variables in **Project Settings → Environment Variables**
for each environment you deploy (Production, Preview, and Development as
appropriate):

```
GOOGLE_CLIENT_EMAIL
GOOGLE_PRIVATE_KEY         # complete service-account private_key PEM; literal newlines or \n are accepted
GOOGLE_SHEETS_ID             # `GOOGLE_SHEET` is also supported for existing deployments
GOOGLE_SHEET_NAME=Sheet1     # optional; defaults to Sheet1
EMAIL_USER                 # optional unless the subscription form is used
EMAIL_PASS                 # optional unless the subscription form is used
YOUTUBE_CHANNEL_URL        # optional social link values
FACEBOOK_PAGE_URL
X_PAGE_URL
INSTAGRAM_PAGE_URL
WHATSAPP_ACCOUNT
TIKTOK_PAGE_URL
GMAIL_ACCOUNT
```

Do not prefix the Google variables with `VITE_`: Vite embeds `VITE_*` values in
the browser bundle. Vercel injects the variables above only into the serverless
function. After saving or changing them, redeploy so the new function receives
them.

The API is public and does not require cookie authentication. On the same
domain, it uses a short-lived cookie only to help prevent duplicate votes. No
CORS origin environment variable is required.

Enable the **Google Sheets API** in the Google Cloud project that owns the
service account. Then share the target spreadsheet with the service account email in
`GOOGLE_CLIENT_EMAIL` with Editor access. Credentials are intentionally not
stored in the repository.

If Google Sheets returns a key-decoding error, download a fresh service-account
JSON key from Google Cloud and copy its entire `private_key` value into
`GOOGLE_PRIVATE_KEY`. Do not copy the JSON object itself, abbreviate the key, or
include a trailing semicolon. Redeploy after changing the environment variable.

`GOOGLE_PROJECT_ID` and `GOOGLE_CLIENT_ID` are not required for vote insertion.
The same `GOOGLE_PRIVATE_KEY` is used by both `POST /question/vote` and the
Google Sheets health check. Confirm `GET /db` returns a successful connection
before testing a vote; otherwise votes cannot be written to the spreadsheet.
For a deployed app, open `https://your-domain/db`; it reports the connection
status without returning credentials or the spreadsheet ID. If it fails, use
the Vercel Function logs and verify the API is enabled, the sheet is shared
with the service account, and the sheet tab name matches `GOOGLE_SHEET_NAME`.

## Verify before deploying

```
npm ci
npm run lint
npm run build
```

After deployment, submit a vote from the deployed site and confirm a row is
written to the configured Google Sheet. The API returns a clear JSON error when
its Google Sheets configuration or connection is unavailable.
