# Claude Code — Complete Prompt
# Copy everything below this line and paste into Claude Code

---

## CONTEXT: What already exists

Project: `ai-festivals-scraper` — a platform that scrapes AI conferences & events worldwide.

### Already built (do NOT recreate these files):
```
ai-festivals-scraper/
├── main.js           # Apify actor: scrapes Eventbrite, Meetup, NeurIPS, ICML, CVPR, AAAI, ICLR
├── package.json      # dependencies: apify ^3, axios ^1.6, cheerio ^1
├── INPUT_SCHEMA.json # 6 regions, 7 event types, quality score filter
├── apify.json        # actor metadata v2.0
├── Dockerfile        # FROM apify/actor-node:20
└── test.js           # 33 unit tests (quality scoring, dedup, categories, date parsing)
```

### What main.js does:
- Scrapes from: Eventbrite API, Meetup GraphQL, official conference websites
- Regions: worldwide, middle-east, africa, europe, asia, americas
- Event types: conference, workshop, webinar, meetup, summit, hackathon, course
- Quality scoring: 0.0–1.0 per event
- Deduplication: by URL or title+date composite key
- Output: pushes clean JSON records to Apify Dataset + SUMMARY to Key-Value Store

---

## YOUR MISSION: Complete the full platform

Build everything missing so the ENTIRE platform works end-to-end with zero issues.

---

## STEP 0 — Install UX Writing Skill
```bash
npx skills add content-designer/ux-writing-skill
```
Use this skill for ALL user-facing copy: button labels, error messages, empty states, 
loading text, form placeholders, tooltips, and success messages.
Apply UX writing best practices: clear, concise, action-oriented, human.

---

## STEP 1 — Frontend Web Application

**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion

**Design Reference:** Dribble-quality, inspired by:
- Linear.app (clean, fast, minimal)
- Vercel Dashboard (data-dense but beautiful)  
- Notion-style sidebars
- Glassmorphism cards for event tiles

**Pages to build:**

### `/` — Landing Page
- Hero: animated globe showing event pins by region
- Stats bar: "12,000+ events · 200+ countries · 100+ sources · Updated daily"
- Search bar (prominent, centered): "Search AI events worldwide..."
- Featured events carousel (horizontal scroll, 3 visible cards)
- Region filter pills: 🌎 Worldwide · 🏜️ Middle East · 🌍 Africa · 🇪🇺 Europe · 🏯 Asia · 🗽 Americas
- CTA section: "Run the scraper" button → links to Apify
- Footer with n8n, Claude MCP, GitHub links

### `/events` — Events Dashboard (main page)
Layout: Left sidebar + main content grid

**Left Sidebar:**
- Search input with live filter
- Region checkboxes (with event counts)
- Event type multi-select (conference, workshop, etc.)
- Date range picker
- Quality score slider (0.5 – 1.0)
- "Online only" toggle
- "Free only" toggle
- Clear all filters button

**Main content:**
- Toolbar: "{X} events found" · Sort by [Relevance | Date | Quality] · View toggle [Grid | List | Map]
- Event cards (grid view, 3 columns):
  - Quality score badge (colored dot: green=0.8+, yellow=0.6+, red<0.6)
  - Event type chip
  - Title (bold, truncated at 2 lines)
  - Date + Location (icon)
  - Source logo (Eventbrite, Meetup, NeurIPS logo)
  - Region flag emoji
  - "View details →" link
- Pagination or infinite scroll
- Empty state with illustration when no results
- Loading skeleton cards during fetch

### `/events/[id]` — Event Detail Page
- Full event info
- Map embed (if physical location)
- Related events (same region/type)
- Share buttons
- "Add to Calendar" button (.ics download)
- Quality score explanation tooltip
- Source attribution

### `/dashboard` — Admin/Analytics Page (protected, password: admin)
- Stats cards: Total Events · Events This Week · Top Region · Avg Quality Score
- Line chart: events scraped per day (last 30 days)
- Pie chart: events by category
- Bar chart: events by region
- Recent scrape runs table: timestamp, events collected, duration, status
- "Trigger new scrape" button → calls Apify API

### `/api-docs` — Public API Documentation Page
- OpenAPI-style docs built with Swagger UI or custom component
- Example requests/responses
- Interactive "Try it" section
- Rate limits info

---

## STEP 2 — Backend API

**Stack:** Express.js + TypeScript + Prisma ORM

**File structure:**
```
api/
├── src/
│   ├── routes/
│   │   ├── events.ts      # GET /api/events, GET /api/events/:id
│   │   ├── scrape.ts      # POST /api/scrape/trigger
│   │   ├── stats.ts       # GET /api/stats
│   │   └── webhook.ts     # POST /api/webhook/apify (receives Apify results)
│   ├── middleware/
│   │   ├── auth.ts        # API key validation
│   │   ├── rateLimit.ts   # 100 req/min per IP
│   │   └── cors.ts        # allow frontend origin
│   ├── services/
│   │   ├── apifyService.ts   # trigger runs, fetch datasets
│   │   ├── eventService.ts   # CRUD operations
│   │   └── cacheService.ts   # Redis or in-memory LRU cache
│   └── index.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

**API endpoints:**
```
GET  /api/events
  Query params: region, type, minDate, maxDate, minQuality, search, page, limit, sort
  Returns: { events: [...], total, page, totalPages }

GET  /api/events/:id
  Returns full event object

GET  /api/stats
  Returns: { totalEvents, byRegion, byCategory, avgQuality, lastUpdated }

GET  /api/regions
  Returns: regions with event counts

POST /api/scrape/trigger
  Headers: x-api-key required
  Body: { regions, maxResults }
  Triggers Apify actor run
  Returns: { runId, estimatedDuration }

POST /api/webhook/apify
  Called by Apify when run finishes
  Saves results to database
  Returns: 200 OK

GET  /api/health
  Returns: { status: "ok", uptime, version }
```

---

## STEP 3 — Database Schema

**Using:** PostgreSQL via Prisma

```prisma
model Event {
  id           String   @id @default(cuid())
  title        String
  description  String?
  date         DateTime?
  endDate      DateTime?
  location     String?
  isOnline     Boolean  @default(false)
  url          String?  @unique
  source       String
  region       String
  regionArabic String?
  category     String
  qualityScore Float
  scrapedAt    DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([region])
  @@index([category])
  @@index([date])
  @@index([qualityScore])
}

model ScrapeRun {
  id           String   @id @default(cuid())
  apifyRunId   String   @unique
  status       String   // pending | running | succeeded | failed
  eventsFound  Int      @default(0)
  regions      String[]
  startedAt    DateTime @default(now())
  completedAt  DateTime?
  durationMs   Int?
  errorMessage String?
}
```

---

## STEP 4 — Environment & Configuration

Create these files:

**.env.local** (frontend):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APIFY_ACTOR_URL=https://console.apify.com/actors/YOUR_ACTOR_ID
```

**.env** (api):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ai_festivals
APIFY_API_TOKEN=your_token_here
APIFY_ACTOR_ID=your_actor_id_here
ADMIN_PASSWORD=admin
API_KEY=your_api_key_here
REDIS_URL=redis://localhost:6379
PORT=3001
```

---

## STEP 5 — UX Writing Requirements

Apply the `content-designer/ux-writing-skill` to write ALL of:

**Error messages (never show raw errors to users):**
- API timeout: "We're having trouble loading events right now. Try refreshing in a moment."
- No results: "No events match your filters. Try expanding your search or selecting more regions."
- Payment/API limit: "You've reached the free plan limit. Upgrade to fetch more events."
- 404: "This event seems to have moved or been removed."
- Network error: "Can't connect to our servers. Check your connection and try again."

**Loading states:**
- Initial load: "Finding AI events worldwide..."
- Filtering: "Updating results..."
- Scrape triggered: "Starting your custom scrape. This takes 2–5 minutes."

**Empty states (with illustration):**
- No events in region: "No events found in [Region] yet. Be the first to submit one!"
- Dashboard no data: "Run your first scrape to start seeing analytics."

**Success messages:**
- Scrape triggered: "Scrape started! We'll notify you when it's done (~3 min)."
- Filter applied: "{X} events match your criteria"

---

## STEP 6 — Seed Data

Since Apify needs credentials to run live, create a seed script with 50 realistic mock events:

```bash
# api/prisma/seed.ts
# Include real-sounding events:
# - NeurIPS 2025 (New Orleans, Dec 2025, quality: 0.95)
# - ICML 2025 (Vienna, July 2025, quality: 0.92)
# - AI Summit Dubai (Dubai, Oct 2025, quality: 0.87)
# - PyTorch Workshop Cairo (Cairo, Aug 2025, quality: 0.76)
# - Machine Learning Nairobi Meetup (Nairobi, Jun 2025, quality: 0.71)
# ... and 45 more across all regions and types
```

Run with: `npx prisma db seed`

---

## STEP 7 — Docker Compose (for local development)

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: ai_festivals
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  api:
    build: ./api
    ports: ["3001:3001"]
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/ai_festivals
    depends_on: [postgres, redis]

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://api:3001
    depends_on: [api]

volumes:
  postgres_data:
```

---

## STEP 8 — README.md (final, complete)

Write a comprehensive README.md for the GitHub repository that includes:
- Project description (English + Arabic)
- Architecture diagram (ASCII art)
- Quick start (3 commands to run everything)
- Full API documentation
- Apify Store link
- n8n workflow setup instructions
- Claude MCP setup instructions
- Contributing guide
- License (MIT)

---

## STEP 9 — GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
# On every push to main:
# 1. Run test.js (actor tests)
# 2. Build API (tsc)
# 3. Build frontend (next build)
# 4. If all pass → trigger Apify build via API
```

---

## STEP 10 — Final Checklist Before Declaring Done

You MUST verify each item before finishing:

**Backend:**
- [ ] All API routes return proper JSON with correct status codes
- [ ] Error handling: no unhandled promise rejections
- [ ] Rate limiting works (test with 101 rapid requests)
- [ ] Database migrations run cleanly: `npx prisma migrate dev`
- [ ] Seed data loads: `npx prisma db seed`
- [ ] Health endpoint responds: `curl http://localhost:3001/api/health`

**Frontend:**
- [ ] `npm run build` completes with zero TypeScript errors
- [ ] All pages render without console errors
- [ ] Mobile responsive (test at 375px, 768px, 1280px)
- [ ] Loading states show during API calls
- [ ] Error states show when API is unreachable
- [ ] Empty states show when filters return 0 results
- [ ] Filters work correctly (region, type, date, quality)
- [ ] Search is debounced (wait 300ms after typing)
- [ ] All UX copy follows the skill guidelines (no technical jargon)

**Apify Actor:**
- [ ] `node test.js` → 33 passed, 0 failed
- [ ] `docker build .` succeeds
- [ ] apify.json is valid JSON
- [ ] package.json has correct "main": "./main.js"

**Integration:**
- [ ] Webhook endpoint receives Apify results and saves to DB
- [ ] Frontend dashboard shows real data from API
- [ ] "Trigger scrape" button in dashboard calls Apify API

---

## EXECUTION ORDER

Run these phases in order. Complete each phase before starting the next.

```
Phase 1 (20 min): Setup monorepo structure + install dependencies
Phase 2 (30 min): Database schema + seed data + API routes
Phase 3 (60 min): Frontend pages (events list, detail, dashboard)
Phase 4 (20 min): UX writing pass (apply skill to all copy)
Phase 5 (20 min): Docker Compose + environment files
Phase 6 (15 min): GitHub Actions CI/CD
Phase 7 (15 min): README.md + final checklist verification

Total estimated time: ~3 hours
```

---

## PROJECT STRUCTURE (final)

```
ai-festivals-scraper/           ← root (GitHub repo)
├── .github/
│   └── workflows/
│       └── ci.yml
├── actor/                      ← Apify actor (existing files)
│   ├── main.js
│   ├── package.json
│   ├── INPUT_SCHEMA.json
│   ├── apify.json
│   ├── Dockerfile
│   └── test.js
├── api/                        ← Express backend
│   ├── src/
│   ├── prisma/
│   └── package.json
├── frontend/                   ← Next.js frontend
│   ├── app/
│   ├── components/
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## IMPORTANT CONSTRAINTS

1. **Zero external UI libraries except:** shadcn/ui, Tailwind CSS, Framer Motion, Recharts (for charts)
2. **TypeScript everywhere** — no `any` types
3. **Mobile-first** — all pages must work at 375px width
4. **No hardcoded data in the frontend** — everything comes from the API
5. **Arabic text support** — use `dir="rtl"` and `font-family: 'Cairo', sans-serif` for Arabic
6. **Accessible** — semantic HTML, ARIA labels, keyboard navigable
7. **Fast** — Next.js pages should score 90+ on Lighthouse Performance
8. **The Apify actor files in /actor folder must NOT be modified** — they are production-ready

---

Begin with Phase 1. Report each phase completion before moving to the next.
