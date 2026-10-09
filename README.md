# Thomas Sako site

The app is a Vite/React site with an Express API deployed as a Vercel serverless
function. The vote form submits to the same-origin endpoint
`POST /question/vote`; it does not use a localhost URL in production.

## Deploy to Vercel

Import the repository with the project root set to this directory. Vercel uses
`vercel.json` to build the Vite app and route API requests to `server/app.cjs`.
No custom output directory or framework override is required.

Add these environment variables in **Project Settings → Environment Variables**
for each environment you deploy (Production, Preview, and Development as
appropriate):

```
GOOGLE_PROJECT_ID
GOOGLE_CLIENT_EMAIL
GOOGLE_CLIENT_ID
GOOGLE_PRIVATE_KEY         # service-account PEM; use literal newlines or \n
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
ALLOWED_ORIGINS            # optional comma-separated custom frontend origins
```

`https://robusttechliberia.github.io` is allowed by default for the repository's
GitHub Pages frontend. If the site is served from a custom domain, add its full
origin (for example, `https://example.com`) to `ALLOWED_ORIGINS`; do not include
a path or trailing slash.

Share the target spreadsheet with the service account email in
`GOOGLE_CLIENT_EMAIL` with Editor access. Credentials are intentionally not
stored in the repository.

## Verify before deploying

```
npm ci
npm run lint
npm run build
```

After deployment, submit a vote from the deployed site and confirm a row is
written to the configured Google Sheet. The API returns a clear JSON error when
its Google Sheets configuration or connection is unavailable.
