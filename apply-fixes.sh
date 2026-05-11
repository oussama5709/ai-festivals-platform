#!/bin/bash
# apply-fixes.sh
# Run from your project root (ai-festivals-scraper/):
#   chmod +x apply-fixes.sh && ./apply-fixes.sh

set -e

FIXES_DIR="$(dirname "$0")"
PROJECT_ROOT="$(pwd)"

G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; Z='\033[0m'

echo ""
echo "🔧 Applying fixes to: $PROJECT_ROOT"
echo "────────────────────────────────────────"

# ── Check we're in the right directory ───────────────────────────────────────
if [ ! -f "docker-compose.yml" ] && [ ! -d "actor" ] && [ ! -d "frontend" ]; then
  echo -e "${R}✗ Not in the project root. Run this script from ai-festivals-scraper/${Z}"
  exit 1
fi

# ── 1. Fix next.config.js ────────────────────────────────────────────────────
echo ""
echo "1. Fixing frontend/next.config.js..."
mkdir -p frontend
cp "$FIXES_DIR/frontend/next.config.js" frontend/next.config.js
echo -e "  ${G}✓ next.config.js updated (output: 'standalone' added)${Z}"

# ── 2. Fix frontend Dockerfile ───────────────────────────────────────────────
echo ""
echo "2. Fixing frontend/Dockerfile..."
cp "$FIXES_DIR/frontend/Dockerfile" frontend/Dockerfile
echo -e "  ${G}✓ frontend/Dockerfile updated (multi-stage with standalone)${Z}"

# ── 3. Fix api/Dockerfile ────────────────────────────────────────────────────
echo ""
echo "3. Fixing api/Dockerfile..."
cp "$FIXES_DIR/api/Dockerfile" api/Dockerfile
echo -e "  ${G}✓ api/Dockerfile updated${Z}"

# ── 4. Replace docker-compose.yml ────────────────────────────────────────────
echo ""
echo "4. Replacing docker-compose.yml (adds healthchecks + migrate/seed services)..."
cp "$FIXES_DIR/docker-compose.yml" docker-compose.yml
echo -e "  ${G}✓ docker-compose.yml updated${Z}"

# ── 5. Update .env.example ───────────────────────────────────────────────────
echo ""
echo "5. Updating .env.example..."
cp "$FIXES_DIR/.env.example" .env.example
echo -e "  ${G}✓ .env.example updated${Z}"

# ── 6. Update .gitignore ─────────────────────────────────────────────────────
echo ""
echo "6. Updating .gitignore..."
cp "$FIXES_DIR/.gitignore" .gitignore
echo -e "  ${G}✓ .gitignore updated${Z}"

# ── 7. Add verify.js ─────────────────────────────────────────────────────────
echo ""
echo "7. Adding verify.js..."
cp "$FIXES_DIR/verify.js" verify.js
echo -e "  ${G}✓ verify.js added${Z}"

# ── 8. Create env files if missing ───────────────────────────────────────────
echo ""
echo "8. Checking env files..."
if [ ! -f "api/.env" ]; then
  cp .env.example api/.env
  echo -e "  ${Y}⚠ Created api/.env from example — fill in APIFY_API_TOKEN and API_KEY${Z}"
else
  echo -e "  ${G}✓ api/.env already exists${Z}"
fi

if [ ! -f "frontend/.env.local" ]; then
  cp .env.example frontend/.env.local
  echo -e "  ${Y}⚠ Created frontend/.env.local from example${Z}"
else
  echo -e "  ${G}✓ frontend/.env.local already exists${Z}"
fi

# ── 9. Run actor tests ────────────────────────────────────────────────────────
echo ""
echo "9. Running actor tests..."
if [ -f "actor/test.js" ]; then
  cd actor
  if node test.js 2>&1 | grep -q "passed"; then
    echo -e "  ${G}✓ Actor tests pass${Z}"
  else
    echo -e "  ${R}✗ Actor tests failed — check actor/test.js${Z}"
  fi
  cd "$PROJECT_ROOT"
else
  echo -e "  ${Y}⚠ actor/test.js not found${Z}"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────"
echo -e "${G}✓ All fixes applied!${Z}"
echo ""
echo "Next steps:"
echo "  1. Fill in api/.env  (set APIFY_API_TOKEN, API_KEY)"
echo "  2. npm install in api/ and frontend/"
echo "  3. docker compose up -d"
echo "  4. node verify.js    (run full health check)"
echo ""
echo "Or without Docker:"
echo "  cd api      && npm install && npx prisma migrate dev && npx prisma db seed && npm run dev"
echo "  cd frontend && npm install && npm run dev"
echo ""
