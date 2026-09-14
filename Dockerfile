# -----------------------------------------------------------------------------
# 1847 Liberty — single-unit production image for Fly.io (and any container
# host). Builds both SPAs, then runs only the Express server, which serves
# the public site at /, the CMS at /admin, the API at /api, and uploads at
# /uploads. All secrets come from runtime env vars (fly secrets set).
# -----------------------------------------------------------------------------

# ---- Build stage: clean install + build the two frontends ----
FROM node:22-bookworm-slim AS build

WORKDIR /build

# Native deps (bcrypt) need a toolchain; kept only in this stage.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies first so Docker layer caching stays efficient.
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
COPY admin/package.json admin/package-lock.json ./admin/

RUN npm ci --no-audit --no-fund \
    && npm ci --prefix server --no-audit --no-fund \
    && npm ci --prefix admin --no-audit --no-fund

# Build the public site (root vite app).
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

# Build the admin CMS.
COPY admin/index.html admin/vite.config.js ./admin/
COPY admin/src ./admin/src
RUN npm run build --prefix admin

# ---- Runtime stage: only what is needed to serve ----
FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /build/server ./server
COPY --from=build /build/server/node_modules ./server/node_modules
COPY --from=build /build/dist ./dist
COPY --from=build /build/admin/dist ./admin/dist

# Uploads folder (Fly persistent volume mounts over this path).
RUN mkdir -p /app/server/uploads

EXPOSE 8080

CMD ["node", "server/index.js"]