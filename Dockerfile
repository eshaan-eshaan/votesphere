# VoteSphere: the built React app plus the Express API in one image.
# Used by docker-compose.yml for a self-contained local run (app + Postgres).

# ---- Stage 1: build the frontend ----
FROM node:22-bookworm-slim AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

# ---- Stage 2: API + built frontend ----
FROM node:22-bookworm-slim
# Prisma's engine needs OpenSSL.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
RUN npx prisma generate

# server.js serves ../dist in production.
COPY --from=web /app/dist /app/dist

EXPOSE 5000
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
    CMD node -e "fetch('http://localhost:5000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Apply committed migrations (never drops data), then start.
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
