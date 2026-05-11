# Feature Specification: AI Festivals & Conferences Scraper v2.0

**Feature Branch**: `001-ai-festivals-scraper`  
**Created**: 2026-04-03  
**Status**: Active  
**Input**: Intelligent multi-source scraper for AI events worldwide with Arabic support

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scrape Major AI Conferences (Priority: P1)

A researcher wants to get a list of all major AI conferences (NeurIPS, ICML, CVPR, AAAI, etc.) with their dates, locations, and submission deadlines automatically from official websites.

**Why this priority**: These are the highest-value, most reliable data points. Official conference websites provide authoritative information.

**Independent Test**: Run the scraper with `dataSources: ["official-websites"]` and verify 8+ major conferences are returned with name, URL, and date info.

**Acceptance Scenarios**:

1. **Given** the scraper is configured with official-websites source, **When** it runs, **Then** it returns data for NeurIPS, ICML, ICCV, AAAI, ACL, CVPR, IJCAI, AI Summit
2. **Given** a conference website is unreachable, **When** the scraper encounters a timeout, **Then** it logs a warning and continues with remaining conferences
3. **Given** results are collected, **When** the output is generated, **Then** each event has: name, url, source, type, dateInfo, location, description, tags

---

### User Story 2 - Scrape Eventbrite AI Events by Region (Priority: P1)

A company wants to discover upcoming AI events in specific geographic regions via Eventbrite to plan team attendance.

**Why this priority**: Eventbrite is the largest events platform and provides the most volume of results.

**Independent Test**: Run with `searchRegions: ["middle-east"]` and `dataSources: ["eventbrite"]` and verify events are returned with proper region tagging.

**Acceptance Scenarios**:

1. **Given** searchRegions includes "middle-east", **When** scraper runs Eventbrite source, **Then** events from Middle East URLs are collected
2. **Given** maxResults is set to 50, **When** scraper exceeds the limit, **Then** only 50 results are returned
3. **Given** Eventbrite blocks the request, **When** 403/captcha is encountered, **Then** proxy rotation is attempted and error is logged

---

### User Story 3 - Scrape Meetup Communities (Priority: P2)

A developer wants to find local AI meetup groups and upcoming events in their region.

**Why this priority**: Meetup provides valuable community events but requires more complex scraping and may need API keys.

**Independent Test**: Run with `dataSources: ["meetup"]` and verify meetup-type events are returned with proper URLs.

**Acceptance Scenarios**:

1. **Given** keywords ["artificial intelligence", "machine learning"], **When** scraper queries Meetup, **Then** relevant events are returned
2. **Given** a Meetup URL is relative, **When** processing the result, **Then** it is converted to absolute URL (https://www.meetup.com/...)

---

### User Story 4 - Automated Data Pipeline with n8n (Priority: P2)

An operations team wants to schedule daily scraping runs and automatically push results to Google Sheets and Slack.

**Why this priority**: Automation is key for production use but depends on the core scraping being stable first.

**Independent Test**: Trigger the Actor via Apify API, verify webhook payload matches expected schema, and confirm n8n workflow processes it.

**Acceptance Scenarios**:

1. **Given** the Actor completes a run, **When** results are available, **Then** a summary object is included with totalEvents, conferences, workshops, meetups counts
2. **Given** n8n workflow is configured, **When** Actor run completes, **Then** webhook fires with structured JSON data

---

### User Story 5 - Multi-format Export (Priority: P3)

A researcher wants to export collected events in CSV and Excel formats for analysis in spreadsheets.

**Why this priority**: Nice-to-have that builds on the core data collection. JSON works for programmatic use; CSV/XLSX for human analysis.

**Independent Test**: Run scraper, verify output can be downloaded in JSON, CSV, and XLSX formats from Apify.

**Acceptance Scenarios**:

1. **Given** outputFormat is "csv", **When** export is generated, **Then** CSV file has proper UTF-8 BOM for Arabic support
2. **Given** outputFormat is "xlsx", **When** export is generated, **Then** Excel file has formatted headers and proper column widths

---

### Edge Cases

- What happens when ALL sources are unreachable? → Return empty dataset with error summary
- What happens when an event has no date? → Set dateInfo to "TBD" and include in results
- What happens with duplicate events across sources? → Deduplicate by URL, keep first occurrence
- What happens when proxy quota is exhausted? → Fall back to direct connection with warning
- What happens with non-Latin characters (Arabic, Chinese)? → Preserve original encoding, UTF-8 throughout

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST scrape from 5+ independent data sources (Eventbrite, Meetup, LinkedIn, Official websites, Conference aggregators)
- **FR-002**: System MUST support 6 geographic regions (worldwide, middle-east, africa, europe, asia, americas)
- **FR-003**: System MUST categorize events into 7 types (conference, workshop, meetup, webinar, summit, hackathon, course)
- **FR-004**: System MUST auto-detect geographic region from location text
- **FR-005**: System MUST remove duplicate events based on URL matching
- **FR-006**: System MUST support date filtering (upcomingOnly, minDate)
- **FR-007**: System MUST output structured JSON with summary statistics
- **FR-008**: System MUST handle Arabic text natively (RTL, UTF-8 BOM for CSV)
- **FR-009**: System MUST retry failed HTTP requests with exponential backoff (max 3 retries)
- **FR-010**: System MUST respect rate limits per source (max 60 requests/minute)
- **FR-011**: System MUST log all operations with structured console output (Arabic)
- **FR-012**: System MUST run as Apify Actor with INPUT_SCHEMA.json

### Key Entities

- **Event**: name, url, source, type, category, date, dateInfo, location, description, tags[], region, addedAt
- **Source**: name, url, type (official/platform/aggregator), scraping strategy
- **Region**: code, name (ar/en), keywords for detection
- **Summary**: totalEvents, conferences, workshops, meetups, generatedAt, regions[]

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Scraper collects 50+ events from official conference websites per run
- **SC-002**: Eventbrite source returns 100+ events across 6 regions
- **SC-003**: All events have valid name and URL (100% compliance)
- **SC-004**: Duplicate removal reduces dataset by 10-20% (indicating effective dedup)
- **SC-005**: Complete scraping run finishes in under 5 minutes
- **SC-006**: Error rate per source is below 5% (successful page loads/total attempts)
- **SC-007**: Arabic output displays correctly in Excel, Google Sheets, and JSON viewers

## Assumptions

- Users have an Apify account (free tier suffices for testing)
- Internet connectivity is available during scraping
- Target websites have not fundamentally changed their HTML structure
- LinkedIn Events requires authentication and may return limited results without it
- Meetup may require API key for production use; scraping works for prototyping
- n8n cloud or self-hosted instance available for automation workflows
