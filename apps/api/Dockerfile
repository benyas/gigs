FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma/
RUN pnpm install --frozen-lockfile

# --- Build shared ---
FROM deps AS build-shared
COPY packages/shared packages/shared/
COPY tsconfig.base.json ./
RUN pnpm --filter @gigs/shared build

# --- Build API ---
FROM build-shared AS build
COPY apps/api apps/api/
RUN pnpm --filter @gigs/api build

# --- Production ---
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=deps /app/apps/api/prisma ./apps/api/prisma
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY package.json pnpm-workspace.yaml ./

# Generate Prisma client for production
RUN cd apps/api && npx prisma generate

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
