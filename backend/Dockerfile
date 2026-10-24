# ---------- build ----------
FROM docker.io/library/node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# prisma.config.ts requires DATABASE_URL to be set; generate/build never connect to it
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm run build

# ---------- runtime ----------
FROM docker.io/library/node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PORT=3000

# Full node_modules: the prisma CLI (schema sync) and tsx (seed) are dev dependencies
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json /app/prisma.config.ts ./
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
# Sync the schema from the Prisma models (refuses destructive changes), then start the API
CMD ["sh", "-c", "npx prisma db push && node dist/src/main"]
