FROM node:20-alpine
WORKDIR /app

# OpenSSL required by Prisma on Alpine
RUN apk add --no-cache openssl

# Install all deps (including dev) for build
COPY package*.json ./
RUN npm ci

# Copy source + scripts + prisma schema
COPY src ./src
COPY prisma ./prisma
COPY scripts ./scripts
COPY tsconfig.json ./

# Build: switch-schema (→ PostgreSQL) + prisma generate + tsc
RUN npm run build

# Remove dev deps after build
RUN npm prune --production

EXPOSE 3001
# db push syncs schema directly (no migration files needed) then start
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/index.js"]
