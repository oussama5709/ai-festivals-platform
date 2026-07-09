import { PrismaClient, Prisma } from '@prisma/client';
import { computeRegistrationStatus, resolveEffectiveDates, RegistrationStatus } from './registrationStatusService';

const prisma = new PrismaClient();

const REGISTRATION_LINKS_INCLUDE = {
  registrationLinks: {
    where: { isActive: true },
    orderBy: { confidence: 'desc' as const },
  },
};

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
  registrationStatus?: string;
}

function withLiveRegistrationStatus<
  T extends {
    registrationOpensAt: Date | null;
    registrationClosesAt: Date | null;
    submissionDeadline: Date | null;
    cfpDeadline: Date | null;
    registrationStatus: string | null;
  }
>(event: T): T & { registrationStatus: RegistrationStatus } {
  const { opensAt, closesAt } = resolveEffectiveDates(event);
  const status = computeRegistrationStatus({
    opensAt,
    closesAt,
    cancelled: event.registrationStatus === 'cancelled',
    waitingList: event.registrationStatus === 'waiting_list',
    invitationOnly: event.registrationStatus === 'invitation_only',
  });
  return { ...event, registrationStatus: status };
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
  if (q.isFree) {
    where.isFree = true;
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
  if (q.registrationStatus) {
    const statuses = q.registrationStatus.split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length > 0) {
      where.registrationStatus = { in: statuses };
    }
  }

  let orderBy: Prisma.EventOrderByWithRelationInput = { date: 'asc' };
  if (q.sort === 'quality') orderBy = { qualityScore: 'desc' };
  if (q.sort === 'date') orderBy = { date: 'asc' };

  const [events, total] = await Promise.all([
    prisma.event.findMany({ where, orderBy, skip, take: limit, include: REGISTRATION_LINKS_INCLUDE }),
    prisma.event.count({ where }),
  ]);

  return {
    events: events.map(withLiveRegistrationStatus),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getEventById(id: string) {
  const event = await prisma.event.findUnique({ where: { id }, include: REGISTRATION_LINKS_INCLUDE });
  return event ? withLiveRegistrationStatus(event) : null;
}

function dedupKeyFor(item: Prisma.EventCreateInput): string {
  return item.url ?? `__no_url__${item.title}__${item.date?.toString() ?? ''}`;
}

export interface DeadlineChange {
  event: Prisma.EventCreateInput & { id: string; url: string };
  kind: 'submission' | 'cfp';
  oldDeadline: Date | null;
  newDeadline: Date | null;
}

export interface UpsertResult {
  saved: number;
  newEvents: (Prisma.EventCreateInput & { id: string; url: string })[];
  deadlineChanges: DeadlineChange[];
}

export async function upsertEvents(items: Prisma.EventCreateInput[]): Promise<UpsertResult> {
  const keyed = items.map((item) => ({ item, key: dedupKeyFor(item) }));
  const keys = keyed.map((k) => k.key);

  const existing = await prisma.event.findMany({
    where: { url: { in: keys } },
    select: { url: true, submissionDeadline: true, cfpDeadline: true },
  });
  const existingByKey = new Map(existing.map((e) => [e.url as string, e]));

  const newEvents: (Prisma.EventCreateInput & { id: string; url: string })[] = [];
  const deadlineChanges: DeadlineChange[] = [];

  const results = await Promise.allSettled(
    keyed.map(async ({ item, key }) => {
      const prior = existingByKey.get(key);
      const saved = await prisma.event.upsert({
        where: { url: key },
        update: { ...item },
        create: { ...item, url: key },
      });

      if (!prior) {
        newEvents.push({ ...item, id: saved.id, url: key });
      } else {
        if (dateDiffers(prior.submissionDeadline, item.submissionDeadline as Date | null | undefined)) {
          deadlineChanges.push({
            event: { ...item, id: saved.id, url: key },
            kind: 'submission',
            oldDeadline: prior.submissionDeadline,
            newDeadline: (item.submissionDeadline as Date | null | undefined) ?? null,
          });
        }
        if (dateDiffers(prior.cfpDeadline, item.cfpDeadline as Date | null | undefined)) {
          deadlineChanges.push({
            event: { ...item, id: saved.id, url: key },
            kind: 'cfp',
            oldDeadline: prior.cfpDeadline,
            newDeadline: (item.cfpDeadline as Date | null | undefined) ?? null,
          });
        }
      }

      return saved;
    })
  );

  return {
    saved: results.filter((r) => r.status === 'fulfilled').length,
    newEvents,
    deadlineChanges,
  };
}

function dateDiffers(a: Date | null | undefined, b: Date | null | undefined): boolean {
  const at = a ? new Date(a).getTime() : null;
  const bt = b ? new Date(b).getTime() : null;
  return at !== bt;
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
