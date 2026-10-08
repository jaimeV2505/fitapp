# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22

# ---------- base ----------
FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm install; fi

# ---------- deps for development ----------
# Not frozen: the dev container also syncs dependencies on every start, so a lockfile that is a
# little behind package.json must not break `docker compose up`. Production builds stay frozen.
FROM base AS deps-dev
COPY package.json pnpm-lock.yaml* ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --no-frozen-lockfile

# ---------- dev (used by docker compose) ----------
FROM base AS dev
ENV NODE_ENV=development NEXT_TELEMETRY_DISABLED=1
COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .
RUN chmod +x scripts/docker-dev-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./scripts/docker-dev-entrypoint.sh"]
CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]

# ---------- build ----------
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Placeholder values only so module-level env validation passes during `next build`.
# Real values are provided at runtime.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build \
    BETTER_AUTH_SECRET=build-time-placeholder-secret-not-used-at-runtime-0000
RUN pnpm build

# ---------- production runner ----------
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
