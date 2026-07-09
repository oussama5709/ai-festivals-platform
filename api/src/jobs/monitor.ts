import { PrismaClient } from '@prisma/client';
import { sendTelegramAlert, sendWhatsAppAlert } from '../services/notificationService';
import { computeRegistrationStatus, resolveEffectiveDates } from '../services/registrationStatusService';
import { dbCircuit } from './retry';

const prisma = new PrismaClient();

function log(event: string, data?: object) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

// ── In-memory pipeline health ─────────────────────────────────────────────────

export interface PipelineHealth {
  status: 'ok' | 'degraded' | 'down';
  lastRunAt: string | null;
  lastRunStatus: string | null;
  consecutiveFailures: number;
  dbCircuitState: string;
  nextScheduledRun: string | null;
}

let health: PipelineHealth = {
  status: 'ok',
  lastRunAt: null,
  lastRunStatus: null,
  consecutiveFailures: 0,
  dbCircuitState: 'closed',
  nextScheduledRun: null,
};

export function updateHealthFromRun(status: 'succeeded' | 'failed'): void {
  health.lastRunAt = new Date().toISOString();
  health.lastRunStatus = status;
  health.dbCircuitState = dbCircuit.getState();
  if (status === 'succeeded') {
    health.consecutiveFailures = 0;
    health.status = 'ok';
  } else {
    health.consecutiveFailures++;
    health.status = health.consecutiveFailures >= 3 ? 'down' : 'degraded';
  }
}

export function setNextScheduledRun(iso: string): void {
  health.nextScheduledRun = iso;
}

export function getPipelineHealth(): PipelineHealth {
  return { ...health, dbCircuitState: dbCircuit.getState() };
}

// ── Monitor loop liveness (separate from pipeline/scrape health above) ────────
// Answers "is the 30-min monitor loop actually ticking?" independently of
// whether any scrape has run recently.

let monitorLastRunAt: string | null = null;
let monitorRunCount = 0;

export function getMonitorHealth(): { lastRunAt: string | null; runCount: number } {
  return { lastRunAt: monitorLastRunAt, runCount: monitorRunCount };
}

// ── Check for stale data ──────────────────────────────────────────────────────

async function checkStaleness(): Promise<void> {
  if (dbCircuit.isOpen()) return;

  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.event.count({
      where: { createdAt: { gte: cutoff } },
    });

    log('monitor.stale_check', { recentCount, cutoffHours: 24 });

    if (recentCount < 10) {
      await sendTelegramAlert(
        `⚠️ <b>AI Festivals — Stale data</b>\n` +
        `Only <b>${recentCount}</b> new events in the last 24h. Pipeline may be stuck.`
      ).catch(() => {});
    }
  } catch (err) {
    log('monitor.stale_check.error', { error: (err as Error).message });
  }
}

// ── Check consecutive failures ────────────────────────────────────────────────

async function checkConsecutiveFailures(): Promise<void> {
  if (dbCircuit.isOpen()) return;

  try {
    const recent = await prisma.scrapeRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 3,
    });

    if (recent.length < 3) return;

    const allFailed = recent.every((r) => r.status === 'failed');
    if (allFailed) {
      log('monitor.consecutive_failures', { count: recent.length });
      await sendTelegramAlert(
        `🚨 <b>AI Festivals — ${recent.length} consecutive scrape failures</b>\n` +
        `Last run: ${recent[0]?.startedAt.toISOString()}\n` +
        `Error: ${recent[0]?.errorMessage ?? 'unknown'}`
      ).catch(() => {});
    }
  } catch (err) {
    log('monitor.consecutive_check.error', { error: (err as Error).message });
  }
}

// ── Check for new AI competitions (hourly) ────────────────────────────────────

export async function checkNewAICompetitions(): Promise<void> {
  if (dbCircuit.isOpen()) return;

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const newCompetitions = await prisma.event.findMany({
      where: {
        isCompetition: true,
        competitionStatus: 'open',
        createdAt: { gte: oneHourAgo },
        OR: [
          { category: 'hackathon' },
          { festivalType: 'ai' },
          { title: { contains: 'AI', mode: 'insensitive' } },
          { title: { contains: 'intelligence artificielle', mode: 'insensitive' } },
          { title: { contains: 'ذكاء اصطناعي', mode: 'insensitive' } },
        ],
      },
    });

    log('monitor.ai_competitions', { found: newCompetitions.length });

    for (const comp of newCompetitions) {
      const daysLeft = comp.submissionDeadline
        ? Math.ceil((new Date(comp.submissionDeadline).getTime() - Date.now()) / 86400000)
        : null;

      const message = buildCompetitionMessage(comp, daysLeft);
      await Promise.allSettled([
        sendTelegramAlert(message),
        sendWhatsAppAlert(message),
      ]);
    }
  } catch (err) {
    log('monitor.ai_competitions.error', { error: (err as Error).message });
  }
}

function buildCompetitionMessage(event: any, daysLeft: number | null): string {
  const lines = [
    `🎉 مسابقة ذكاء اصطناعي جديدة مفتوحة!`,
    ``,
    `🏆 <b>${event.title}</b>`,
    ``,
    `📍 <b>المكان:</b> ${event.isOnline ? '🌐 أونلاين' : event.location || 'غير محدد'}`,
    `🗓️ <b>تاريخ البداية:</b> ${event.date ? new Date(event.date).toLocaleDateString('fr-TN') : 'غير محدد'}`,
  ];

  if (event.submissionDeadline) {
    lines.push(`⏰ <b>آخر أجل للتقديم:</b> ${new Date(event.submissionDeadline).toLocaleDateString('fr-TN')}`);
  }
  if (daysLeft !== null && daysLeft > 0) {
    lines.push(`⚠️ <b>باقي:</b> ${daysLeft} يوم باش ينقضي الأجل!`);
  }
  if (event.prize) {
    lines.push(`💰 <b>الجائزة:</b> ${event.prize}`);
  }
  if (event.eligibility) {
    lines.push(`👥 <b>شروط المشاركة:</b> ${event.eligibility}`);
  }
  if (event.description) {
    lines.push(`📝 <b>الوصف:</b> ${String(event.description).slice(0, 200)}...`);
  }
  if (event.howToApply) {
    lines.push(``, `🔗 <b>للتقديم:</b> ${event.howToApply}`);
  } else if (event.url) {
    lines.push(``, `🌐 <b>رابط المسابقة:</b> ${event.url}`);
  }
  lines.push(``, `📲 شاركها مع أصحابك وقدّم — المنافسة قوية!`);
  lines.push(``, `<i>AI Festivals Platform — ai-festivals-platform.vercel.app/tunisia</i>`);

  return lines.join('\n');
}

// ── Registration Intelligence: keep the persisted registrationStatus column
// fresh so DB-level filtering (WHERE registrationStatus IN (...)) stays
// accurate even between crawls. Pure date math — no network calls, cheap
// enough to run on every 30-min monitor tick. The API layer additionally
// recomputes status live on every read (see eventService.ts), so this is a
// freshness optimization for filtering, not the source of truth for display. ──

async function refreshRegistrationStatuses(): Promise<void> {
  if (dbCircuit.isOpen()) return;

  try {
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { registrationOpensAt: { not: null } },
          { registrationClosesAt: { not: null } },
          { submissionDeadline: { not: null } },
          { cfpDeadline: { not: null } },
        ],
      },
      select: {
        id: true,
        registrationOpensAt: true,
        registrationClosesAt: true,
        submissionDeadline: true,
        cfpDeadline: true,
        registrationStatus: true,
      },
    });

    let updated = 0;
    for (const event of events) {
      const { opensAt, closesAt } = resolveEffectiveDates(event);
      const nextStatus = computeRegistrationStatus({
        opensAt,
        closesAt,
        cancelled: event.registrationStatus === 'cancelled',
        waitingList: event.registrationStatus === 'waiting_list',
        invitationOnly: event.registrationStatus === 'invitation_only',
      });
      if (nextStatus !== event.registrationStatus) {
        await prisma.event.update({
          where: { id: event.id },
          data: { registrationStatus: nextStatus },
        }).catch(() => {});
        updated++;
      }
    }

    log('monitor.registration_status_refresh', { checked: events.length, updated });
  } catch (err) {
    log('monitor.registration_status_refresh.error', { error: (err as Error).message });
  }
}

// ── Public: run all monitor checks ───────────────────────────────────────────

export async function runMonitorChecks(): Promise<void> {
  log('monitor.run');
  await Promise.allSettled([
    checkStaleness(),
    checkConsecutiveFailures(),
    checkNewAICompetitions(),
    refreshRegistrationStatuses(),
  ]);
  monitorLastRunAt = new Date().toISOString();
  monitorRunCount++;
}
