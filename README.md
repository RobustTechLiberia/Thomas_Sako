# Thomas Sako site

The app is a Vite/React site with an Express API deployed as a Vercel serverless
function. The vote form submits to the same-origin endpoint
`POST /question/submit`; it does not use a localhost URL in production.

## Deploy to Vercel

Import the repository with the project root set to this directory. Vercel uses
`vercel.json` to build the Vite app and route API requests to `server/app.cjs`.
No custom output directory or framework override is required.

Add these environment variables in **Project Settings → Environment Variables**
for each environment you deploy (Production, Preview, and Development as
appropriate):

```
DB_HOST
DB_PORT=3306
DB_USER
DB_PASS
DB_DATABASE
DB_SSL_CA                 # PEM certificate; use literal newlines or \n
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

`DB_SSL_CA` is recommended for serverless deployments because it avoids relying
on a filesystem certificate. Local development uses the ignored
`DB_SSL_CA_FILE=../ca.pem` entry in `server/.env`; do not set that file path in
Vercel. Database credentials are intentionally not stored in the repository.

## Verify before deploying

```
npm ci
npm run lint
npm run build
```

For a new Aiven database, run the idempotent schema migration once after adding
the database variables:

```
npm run db:migrate
```

After deployment, submit a vote from the deployed site and confirm a new row is
written to the existing `poll` table. The API returns a clear JSON error if the
database configuration or connection is unavailable.
