# Implementation Plan: AI Festivals & Conferences Scraper v2.0

**Branch**: `001-ai-festivals-scraper` | **Date**: 2026-04-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-festivals-scraper/spec.md`

## Summary

Build a production-ready Apify Actor that scrapes AI conferences and events from 5+ sources across 6 geographic regions. The scraper must handle failures gracefully, deduplicate results, support Arabic/English output, and integrate with n8n for automation.

## Technical Context

**Language/Version**: Node.js 16+ (JavaScript ES2020)  
**Primary Dependencies**: Apify SDK, axios, cheerio  
**Storage**: Apify Dataset (cloud), local JSON (dev)  
**Testing**: Custom test suite (test.js) + node assertions  
**Target Platform**: Apify Cloud (Docker: apify/actor-node:20)  
**Project Type**: CLI/Actor (Apify SDK)  
**Performance Goals**: 100 events in <5 minutes, <512MB RAM  
**Constraints**: Rate limit 60 req/min per source, respect robots.txt  
**Scale/Scope**: 200+ countries, 1000+ events per full run

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Scraper-First Architecture | ✅ Pass | Each source is a separate async function |
| CLI & Actor Interface | ✅ Pass | Apify.main() entry, INPUT_SCHEMA.json |
| Data Quality First | ✅ Pass | Deduplication + quality filtering in place |
| Resilient Scraping | ⚠️ Needs Work | Missing retry logic, no proxy rotation |
| Multi-Region, Multi-Source | ✅ Pass | 6 regions, 5 sources defined |
| Bilingual Output | ✅ Pass | Arabic logs and descriptions |

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-festivals-scraper/
├── spec.md              # Feature specification
├── plan.md              # This file
└── tasks.md             # Task breakdown
```

### Source Code (repository root)

```text
ai-festivals-scraper-main/
├── ai-festivals-scraper.js   # Main Actor code (all logic)
├── package.json              # Dependencies
├── INPUT_SCHEMA.json         # Actor input schema
├── Dockerfile                # Container configuration
├── apify.json                # Actor metadata
├── test.js                   # Test suite
├── README.md                 # Documentation (EN)
├── README_GITHUB.md          # GitHub documentation
├── CONTRIBUTING.md           # Contribution guidelines
└── LICENSE                   # MIT License
```

**Structure Decision**: Single-file Actor pattern (standard for Apify). All logic in `ai-festivals-scraper.js` with helper functions. This is the Apify convention - keep it simple.

## Architecture

```
┌─────────────┐
│  Apify.main  │ ← Entry point, reads input
└──────┬───────┘
       │
       ├─► scrapeMajorConferences() ─── axios+cheerio ──► Official Sites
       ├─► scrapeEventbrite()       ─── axios+cheerio ──► Eventbrite
       ├─► scrapeMeetup()           ─── axios+cheerio ──► Meetup
       ├─► scrapeLinkedIn()         ─── axios (mock)  ──► LinkedIn
       │
       ▼
┌──────────────┐
│  Data Pipeline│
│  - Deduplicate│
│  - Categorize │
│  - Tag Region │
│  - Sort       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Apify Dataset │ ← JSON output + Summary
└──────────────┘
       │
       ▼
┌──────────────┐
│  n8n Webhook  │ ← Automation
└──────────────┘
```

## Key Improvements Needed (from Constitution Check)

1. **Add retry logic** with exponential backoff to all HTTP requests
2. **Add proxy rotation** support via Apify Proxy
3. **Improve LinkedIn scraper** (currently mock data only)
4. **Add conference aggregator source** (conftech.ai, conferences.ai)
5. **Implement proper deduplication** (current implementation is minimal)
6. **Add quality scoring** per event (0.0 - 1.0)
7. **CSV/XLSX export** with Arabic UTF-8 BOM support

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Mock LinkedIn data | LinkedIn requires auth | Real scraping needs OAuth, out of scope for v1 |
| Single-file architecture | Apify convention | Multi-file adds complexity without benefit for Actor pattern |
