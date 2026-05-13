import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface EventQuery {
  region?: string;
  type?: string;
  minDate?: string;
  maxDate?: string;
  minQuality?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'date' | 'quality' | 'relevance';
  isOnline?: boolean;
  isFree?: boolean;
  openCompetitions?: boolean;
  hasCfp?: boolean;
  isTunisia?: boolean;
}

export async function queryEvents(q: EventQuery) {
  const page = q.page ?? 1;
  const limit = Math.min(q.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.EventWhereInput = {};

  if (q.region && q.region !== 'worldwide') {
    where.region = q.region;
  }
  if (q.type) {
    where.category = q.type;
  }
  if (q.minDate || q.maxDate) {
    where.date = {};
    if (q.minDate) (where.date as Prisma.DateTimeFilter).gte = new Date(q.minDate);
    if (q.maxDate) (where.date as Prisma.DateTimeFilter).lte = new Date(q.maxDate);
  }
  if (q.minQuality) {
    where.qualityScore = { gte: q.minQuality };
  }
  if (q.search) {
    where.OR = [
      { title: { contains: q.search, mode: 'insensitive' } },
      { description: { contains: q.search, mode: 'insensitive' } },
      { location: { contains: q.search, mode: 'insensitive' } },
    ];
  }
  if (q.isOnline !== undefined) {
    where.isOnline = q.isOnline;
  }
  if (q.openCompetitions) {
    where.isCompetition = true;
    where.competitionStatus = 'open';
  }
  if (q.hasCfp) {
    where.hasCfp = true;
    where.cfpDeadline = { gt: new Date() };
  }
  if (q.isTunisia) {
    where.isTunisia = true;
  }

  let orderBy: Prisma.EventOrderByWithRelationInput = { date: 'asc' };
  if (q.sort === 'quality') orderBy = { qualityScore: 'desc' };
  if (q.sort === 'date') orderBy = { date: 'asc' };

  const [events, total] = await Promise.all([
    prisma.event.findMany({ where, orderBy, skip, take: limit }),
    prisma.event.count({ where }),
  ]);

  return {
    events,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getEventById(id: string) {
  return prisma.event.findUnique({ where: { id } });
}

export async function upsertEvents(items: Prisma.EventCreateInput[]) {
  const results = await Promise.allSettled(
    items.map((item) => {
      if (item.url) {
        // URL is unique — use it as the dedup key
        return prisma.event.upsert({
          where: { url: item.url },
          update: { ...item },
          create: item,
        });
      }
      // No URL: insert-only, skip if identical title+date already exists
      return prisma.event.upsert({
        where: { url: `__no_url__${item.title}__${item.date?.toString() ?? ''}` },
        update: { ...item },
        create: { ...item, url: `__no_url__${item.title}__${item.date?.toString() ?? ''}` },
      });
    })
  );
  return results.filter((r) => r.status === 'fulfilled').length;
}

export async function getStats() {
  const [total, byRegion, byCategory, qualityAgg, lastEvent] = await Promise.all([
    prisma.event.count(),
    prisma.event.groupBy({ by: ['region'], _count: { id: true } }),
    prisma.event.groupBy({ by: ['category'], _count: { id: true } }),
    prisma.event.aggregate({ _avg: { qualityScore: true } }),
    prisma.event.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
  ]);

  return {
    totalEvents: total,
    byRegion: Object.fromEntries(byRegion.map((r) => [r.region, r._count.id])),
    byCategory: Object.fromEntries(byCategory.map((c) => [c.category, c._count.id])),
    avgQuality: Math.round((qualityAgg._avg.qualityScore ?? 0) * 100) / 100,
    lastUpdated: lastEvent?.createdAt ?? null,
  };
}

export async function getRegions() {
  const regions = await prisma.event.groupBy({
    by: ['region'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });
  return regions.map((r) => ({ region: r.region, count: r._count.id }));
}

export async function getScrapeRuns() {
  return prisma.scrapeRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: 20,
  });
}

export async function createScrapeRun(apifyRunId: string, regions: string[]) {
  return prisma.scrapeRun.create({
    data: {
      apifyRunId,
      status: 'running',
      regions: JSON.stringify(regions),
    },
  });
}

export async function updateScrapeRun(
  apifyRunId: string,
  data: {
    status: string;
    eventsFound?: number;
    completedAt?: Date;
    durationMs?: number;
    errorMessage?: string;
  }
) {
  return prisma.scrapeRun.update({
    where: { apifyRunId },
    data,
  });
}
