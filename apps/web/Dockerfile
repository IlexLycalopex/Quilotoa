FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# ─── Development ──────────────────────────────────────────────────────────────
FROM base AS development
COPY package.json pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install
COPY . .
WORKDIR /app/apps/web
EXPOSE 5173
CMD ["pnpm", "dev", "--host"]

# ─── Build ────────────────────────────────────────────────────────────────────
FROM base AS builder
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY package.json pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @msas/shared build
RUN pnpm --filter @msas/web build

# ─── Production (static served by nginx) ─────────────────────────────────────
FROM nginx:alpine AS production
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY --from=builder /app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
