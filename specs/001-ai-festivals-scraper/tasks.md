# Tasks: AI Festivals & Conferences Scraper v2.0

**Input**: Design documents from `/specs/001-ai-festivals-scraper/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency fixes, and base infrastructure

- [ ] T001 Install missing `package.json` in `ai-festivals-scraper-main/` (currently missing)
- [ ] T002 Run `npm install` to verify all dependencies (apify, axios, cheerio) resolve
- [ ] T003 [P] Add `.env.example` with APIFY_TOKEN placeholder
- [ ] T004 [P] Create `utils/retry.js` - Implement `retryWithBackoff(fn, maxRetries=3, baseDelay=1000)` helper
- [ ] T005 [P] Create `utils/rate-limiter.js` - Implement per-source rate limiter (60 req/min default)
- [ ] T006 [P] Create `utils/proxy.js` - Implement Apify Proxy rotation wrapper

**Checkpoint**: Base utilities ready. All source adapters can now use retry + rate limiting.

---

## Phase 2: User Story 1 - Scrape Major AI Conferences (Priority: P1) 🎯 MVP

**Goal**: Reliably scrape 8+ major AI conferences from official websites
**Independent Test**: `node test.js` → "المؤتمرات الرسمية" section passes with 6+ results

### Implementation for User Story 1

- [ ] T007 [US1] Refactor `scrapeMajorConferences()` in `ai-festivals-scraper.js:156-191` to use `retryWithBackoff()` for each HTTP request
- [ ] T008 [US1] Add 5 more conferences to `MAJOR_CONFERENCES` array: ECCV, EMNLP, SIGKDD, WSDM, TheWebConf
- [ ] T009 [US1] Improve date extraction regex in `scrapeMajorConferences()` to capture "Month DD-DD, YYYY" patterns (currently only matches raw digits)
- [ ] T010 [US1] Improve location extraction to handle "City, Country" and "Virtual" patterns
- [ ] T011 [US1] Add quality score to each event: `qualityScore = (hasDate ? 0.3 : 0) + (hasLocation ? 0.3 : 0) + (hasDescription ? 0.2 : 0) + (hasUrl ? 0.2 : 0)`
- [ ] T012 [US1] Add test case in `test.js` for `scrapeMajorConferences()` that verifies ≥6 conferences returned

**Checkpoint**: Major conferences scraping is robust with retry logic and quality scoring.

---

## Phase 3: User Story 2 - Scrape Eventbrite AI Events by Region (Priority: P1) 🎯 MVP

**Goal**: Scrape Eventbrite across 6 regions with proper error handling
**Independent Test**: `node test.js` → "Eventbrite" section passes

### Implementation for User Story 2

- [ ] T013 [US2] Refactor `scrapeEventbrite()` in `ai-festivals-scraper.js:196-248` to use `retryWithBackoff()`
- [ ] T014 [US2] Add rate limiting via `utils/rate-limiter.js` (max 30 req/min for Eventbrite)
- [ ] T015 [US2] Add Apify Proxy support: `proxyConfiguration` input → rotate per request
- [ ] T016 [US2] Update CSS selectors in Eventbrite scraper to handle 2026 page structure (current selectors: `[data-eventid]`, `[data-spec-id="event-title"]`)
- [ ] T017 [P] [US2] Add `detectRegion()` enhancement: add 20+ city/country keywords per region
- [ ] T018 [US2] Add quality score calculation to Eventbrite events
- [ ] T019 [US2] Add test case verifying Eventbrite connectivity and selector validation

**Checkpoint**: Eventbrite scraping works across all 6 regions with proxy support.

---

## Phase 4: User Story 3 - Scrape Meetup Communities (Priority: P2)

**Goal**: Find AI meetups and community events from Meetup.com
**Independent Test**: Run with `dataSources: ["meetup"]` → returns meetup-type events

### Implementation for User Story 3

- [ ] T020 [US3] Refactor `scrapeMeetup()` in `ai-festivals-scraper.js:253-300` to use `retryWithBackoff()`
- [ ] T021 [US3] Fix URL construction: ensure all Meetup URLs are absolute (prefix `https://www.meetup.com` when relative)
- [ ] T022 [US3] Update CSS selectors for current Meetup page structure
- [ ] T023 [US3] Add rate limiting (max 20 req/min for Meetup - stricter than Eventbrite)
- [ ] T024 [US3] Add Meetup API key support via environment variable `MEETUP_API_KEY` (optional, falls back to scraping)
- [ ] T025 [US3] Add test case for Meetup source

**Checkpoint**: Meetup scraping works with both scraping and API modes.

---

## Phase 5: User Story 4 - Automated Data Pipeline with n8n (Priority: P2)

**Goal**: Enable automated workflows with n8n integration
**Independent Test**: Actor run produces webhook-compatible output schema

### Implementation for User Story 4

- [ ] T026 [US4] Enhance summary object in `Apify.main()` to include: totalEvents, byCategory{}, byRegion{}, bySource{}, errors[], runDuration
- [ ] T027 [US4] Add webhook notification at end of Actor run (optional `webhookUrl` input parameter)
- [ ] T028 [P] [US4] Update `n8n-workflow.json` with proper Apify node configuration
- [ ] T029 [P] [US4] Add `INPUT_SCHEMA.json` field for `webhookUrl` (optional string, format: uri)
- [ ] T030 [US4] Add test case verifying summary object schema

**Checkpoint**: Actor output is n8n-ready with comprehensive summary stats.

---

## Phase 6: User Story 5 - Multi-format Export (Priority: P3)

**Goal**: Support CSV and XLSX export with proper Arabic/UTF-8 handling
**Independent Test**: Run with `outputFormat: "csv"` → valid CSV file with Arabic text

### Implementation for User Story 5

- [ ] T031 [US5] Add `json2csv` dependency to `package.json`
- [ ] T032 [US5] Implement CSV export with UTF-8 BOM (`\uFEFF` prefix) for Arabic support
- [ ] T033 [US5] Implement XLSX export using `xlsx` npm package (or `exceljs`)
- [ ] T034 [US5] Add column header mapping: English→Arabic for `language: "ar"` mode
- [ ] T035 [US5] Save export files to Apify Key-Value Store for download
- [ ] T036 [US5] Add test case verifying CSV output contains BOM and proper headers

**Checkpoint**: All 3 export formats (JSON, CSV, XLSX) work with Arabic support.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect all user stories

- [ ] T037 [P] Implement proper deduplication: normalize URLs, compare by domain+path (ignore query params)
- [ ] T038 [P] Add `categorizeEvent()` improvements: support 20+ Arabic keywords for categorization
- [ ] T039 Improve `scrapeLinkedIn()` to attempt real scraping (with auth warning if no credentials)
- [ ] T040 [P] Add conference aggregator source (conftech.ai or conferences.ai)
- [ ] T041 [P] Update README.md with v2.0 changes
- [ ] T042 [P] Update README_GITHUB.md with setup instructions
- [ ] T043 Run full test suite: `node test.js` → all sections pass
- [ ] T044 Build Docker image locally: `docker build -t ai-festivals-scraper .`
- [ ] T045 Deploy to Apify: `apify push`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **US1 (Phase 2)**: Depends on T004 (retry utility)
- **US2 (Phase 3)**: Depends on T004, T005, T006 (retry + rate limit + proxy)
- **US3 (Phase 4)**: Depends on T004, T005 (retry + rate limit)
- **US4 (Phase 5)**: Can start after Phase 1 (independent)
- **US5 (Phase 6)**: Can start after Phase 1 (independent)
- **Polish (Phase 7)**: After all user stories complete

### Parallel Opportunities

- T003, T004, T005, T006 (all Setup utilities) can run in parallel
- T017 (region detection) can run parallel to other US2 tasks
- T028, T029 (n8n configs) can run parallel to US4 implementation
- US4 and US5 are fully independent of US1-US3
- T037, T038, T040, T041, T042 (Polish) can all run in parallel

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup utilities
2. Complete Phase 2: Major Conferences (US1)
3. Complete Phase 3: Eventbrite (US2)
4. **STOP and VALIDATE**: Test with `node test.js`
5. Deploy MVP: `apify push`

### Incremental Delivery

1. Setup + US1 → Test → Deploy (MVP: conferences only)
2. Add US2 (Eventbrite) → Test → Deploy
3. Add US3 (Meetup) → Test → Deploy
4. Add US4 (n8n) → Test → Deploy
5. Add US5 (Export) → Test → Deploy
6. Polish → Final Test → Final Deploy

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Commit after each task or logical group
- Test after each phase checkpoint
- Arabic console output preserved throughout
