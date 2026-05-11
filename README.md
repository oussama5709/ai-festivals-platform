# AI Festivals Scraper 🤖

**Intelligent scraper for AI conferences & events worldwide**  
**جامع ذكي لمهرجانات وأحداث الذكاء الاصطناعي من حول العالم**

Discover AI conferences, workshops, hackathons, and meetups across 200+ countries. Powered by Apify, served via a Next.js + Express platform.

[![CI](https://github.com/YOUR_USERNAME/ai-festivals-scraper/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/ai-festivals-scraper/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ai-festivals-scraper                    │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐ │
│  │   frontend/  │───▶│    api/      │───▶│  PostgreSQL   │ │
│  │  Next.js 14  │    │  Express +   │    │  (Prisma ORM) │ │
│  │  TypeScript  │    │  TypeScript  │    └───────────────┘ │
│  └──────────────┘    └──────┬───────┘                      │
│                             │                               │
│                     ┌───────▼───────┐    ┌───────────────┐ │
│                     │    actor/     │───▶│    Apify      │ │
│                     │  Apify Actor  │    │   Platform    │ │
│                     │   (main.js)   │    └───────────────┘ │
│                     └───────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# 1. Clone and enter
git clone https://github.com/YOUR_USERNAME/ai-festivals-scraper.git
cd ai-festivals-scraper

# 2. Copy env file and fill in your values
cp .env.example api/.env
cp .env.example frontend/.env.local

# 3. Start everything
docker compose up -d
```

Frontend: http://localhost:3000  
API: http://localhost:3001  
API Health: http://localhost:3001/api/health

---

## Local Development (without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### API
```bash
cd api
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Actor (Apify)
```bash
cd actor
npm install
npm test            # run 33 unit tests
apify run --local   # test locally with Apify CLI
```

---

## API Documentation

Full API reference at **http://localhost:3000/api-docs** when running locally.

### Key endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/events` | List events (filterable) |
| `GET` | `/api/events/:id` | Get single event |
| `GET` | `/api/stats` | Aggregate statistics |
| `GET` | `/api/events/regions` | Regions with counts |
| `POST` | `/api/scrape/trigger` | Trigger Apify actor run |
| `POST` | `/api/webhook/apify` | Receive Apify results |
| `GET` | `/api/health` | Health check |

### Example request

```bash
curl "http://localhost:3001/api/events?region=europe&type=conference&minQuality=0.8"
```

---

## Apify Store

Run the actor directly on Apify:  
→ https://console.apify.com/actors/YOUR_ACTOR_ID

### Input schema

```json
{
  "regions": ["worldwide"],
  "eventTypes": ["conference", "workshop"],
  "maxResults": 500,
  "minQualityScore": 0.6
}
```

---

## n8n Workflow Setup

1. Import `n8n-workflow.json` from repo root into your n8n instance
2. Configure the **Apify** node with your API token
3. Configure the **HTTP Request** node to point to `POST /api/webhook/apify`
4. Activate the workflow — it triggers on Apify run completion

---

## Claude MCP Setup

The scraper exposes a REST API compatible with Claude's tool-use protocol.

```json
{
  "name": "ai-festivals",
  "description": "Search AI events worldwide",
  "url": "http://localhost:3001",
  "tools": [
    {
      "name": "search_events",
      "endpoint": "GET /api/events",
      "params": ["region", "type", "search", "minQuality"]
    }
  ]
}
```

---

## Project Structure

```
ai-festivals-scraper/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI: test → build → deploy
├── actor/                      # Apify actor (do not modify)
│   ├── main.js                 # Scraper: Eventbrite, Meetup, NeurIPS, ICML…
│   ├── test.js                 # 33 unit tests
│   ├── package.json
│   ├── INPUT_SCHEMA.json
│   ├── Dockerfile
│   └── utils/
├── api/                        # Express backend
│   ├── src/
│   │   ├── routes/             # events, scrape, stats, webhook
│   │   ├── middleware/         # auth, rateLimit, cors
│   │   └── services/           # apify, event, cache
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts             # 50 realistic seed events
│   └── package.json
├── frontend/                   # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   ├── events/page.tsx     # Events dashboard
│   │   ├── events/[id]/        # Event detail
│   │   ├── dashboard/page.tsx  # Analytics (password: admin)
│   │   └── api-docs/page.tsx   # API documentation
│   ├── components/
│   └── lib/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit: `git commit -m "feat: add my feature"`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

**Do not modify files in `/actor`** — they are production-deployed to Apify.

---

## License

MIT © 2025 AI Festivals Scraper Team
