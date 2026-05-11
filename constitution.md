# AI Festivals Scraper - Constitution

## Core Principles

### I. Scraper-First Architecture
Every feature starts as a scraping module; Modules must be self-contained, independently testable, and target a single data source. Clear data schemas required - no ambiguous data structures.

### II. CLI & Actor Interface
The scraper runs as an Apify Actor with structured JSON input/output. All configuration via INPUT_SCHEMA.json. Support both local (node test.js) and cloud (apify push) execution.

### III. Data Quality First (NON-NEGOTIABLE)
- All scraped data MUST be validated before storage
- Deduplication is mandatory on every run
- Events with missing critical fields (name, url) are rejected
- Quality score calculation for every event (0.0 - 1.0)

### IV. Resilient Scraping
- Every source adapter MUST handle failures gracefully
- Retry logic with exponential backoff for network errors
- Rate limiting per source to avoid bans
- User-Agent rotation and proxy support required

### V. Multi-Region, Multi-Source
- Support 6 geographic regions minimum
- Each source adapter is independent and pluggable
- Adding a new source should NOT modify existing source code
- Region detection is automatic from location data

### VI. Bilingual Output
- Arabic and English supported for all user-facing output
- Event names preserve original language
- Logs and console output in Arabic by default
- Documentation maintained in both languages

## Technology Stack

- **Runtime**: Node.js 16+
- **Platform**: Apify Actor SDK
- **HTTP Client**: axios with cheerio for HTML parsing
- **Testing**: Custom test suite (test.js)
- **Container**: Docker (apify/actor-node:20)
- **Automation**: n8n integration via webhooks

## Development Workflow

1. Write test scenario in test.js first
2. Implement the scraping logic
3. Validate data quality with quality score
4. Test locally with `node test.js`
5. Deploy with `apify push`

## Governance

- Constitution supersedes all other development practices
- All source adapters must conform to the standard event schema
- Breaking changes to the event schema require migration plan
- Use FULL_DESCRIPTION.md as the feature reference

**Version**: 1.0.0 | **Ratified**: 2026-04-03 | **Last Amended**: 2026-04-03
