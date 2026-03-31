FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# ─── Development ──────────────────────────────────────────────────────────────
FROM base AS development
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install
COPY . .
WORKDIR /app/apps/api
CMD ["pnpm", "dev"]

# ─── Build ────────────────────────────────────────────────────────────────────
FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @msas/shared build
RUN pnpm --filter @msas/api build
# Deploy creates /deploy with prod-only node_modules and workspace deps bundled in
RUN pnpm --filter @msas/api deploy --prod /deploy

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS production
RUN addgroup -S msas && adduser -S msas -G msas
WORKDIR /app
COPY --from=builder /deploy/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
RUN mkdir -p /app/storage/proposals && chown -R msas:msas /app
USER msas
EXPOSE 3001
CMD ["node", "dist/index.js"]
