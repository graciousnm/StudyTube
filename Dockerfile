# syntax=docker/dockerfile:1

##########
# deps   — production dependency tree (compiled for node:24-slim, glibc)
##########
FROM node:24-slim AS deps
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN npm install -g pnpm@12.4.2
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

##########
# builder — full install, production build, standalone output
##########
FROM node:24-slim AS builder
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN npm install -g pnpm@12.4.2
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

##########
# runner  — standalone server + migrations + migrations guard script
##########
FROM node:24-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL=/data/learning.sqlite
WORKDIR /app

RUN groupadd --system studytube \
    && useradd --system --gid studytube --create-home --home-dir /app studytube \
    && mkdir -p /data \
    && chown -R studytube:studytube /app /data

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/db/migrations ./src/db/migrations
COPY --from=builder /app/scripts/migrate-on-boot.mjs ./scripts/migrate-on-boot.mjs

USER studytube
EXPOSE 3000
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "node scripts/migrate-on-boot.mjs && node server.js"]