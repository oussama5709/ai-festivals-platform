-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME,
    "endDate" DATETIME,
    "location" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT,
    "source" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "regionArabic" TEXT,
    "category" TEXT NOT NULL,
    "qualityScore" REAL NOT NULL,
    "scrapedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScrapeRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apifyRunId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "eventsFound" INTEGER NOT NULL DEFAULT 0,
    "regions" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "durationMs" INTEGER,
    "errorMessage" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_url_key" ON "Event"("url");

-- CreateIndex
CREATE INDEX "Event_region_idx" ON "Event"("region");

-- CreateIndex
CREATE INDEX "Event_category_idx" ON "Event"("category");

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date");

-- CreateIndex
CREATE INDEX "Event_qualityScore_idx" ON "Event"("qualityScore");

-- CreateIndex
CREATE UNIQUE INDEX "ScrapeRun_apifyRunId_key" ON "ScrapeRun"("apifyRunId");
