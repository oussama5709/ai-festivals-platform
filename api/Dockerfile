FROM node:20-alpine
WORKDIR /app

# Install all deps (including dev) for build
COPY package*.json ./
RUN npm ci

# Copy source + scripts + prisma schema
COPY src ./src
COPY prisma ./prisma
COPY scripts ./scripts
COPY tsconfig.json ./

# Build: switch-schema + prisma generate + tsc
RUN npm run build

# Remove dev deps after build
RUN npm prune --production

EXPOSE 3001
CMD ["node", "dist/index.js"]
