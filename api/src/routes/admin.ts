import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdminPassword } from '../middleware/auth';
import { sendTelegramAlert, sendWhatsAppAlert } from '../services/notificationService';
import { seedTunisiaFull } from '../data/tunisiaEvents';

const router = Router();
const prisma = new PrismaClient();

// POST /api/admin/seed-tunisia?password=xxx
// Idempotent: clears existing isTunisia:true rows then re-inserts the curated list.
// Safe to call repeatedly (e.g. after a fresh DB provision).
router.post('/seed-tunisia', requireAdminPassword, async (_req: Request, res: Response) => {
  try {
    const result = await seedTunisiaFull(prisma, false);
    res.json({ status: 'ok', ...result });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message });
  }
});

// GET /api/admin/export-data?password=xxx
// One-off export used for the Render -> Neon database migration.
// Dumps Event + RegistrationLink rows as JSON so they can be re-imported
// into a fresh database via /api/admin/import-data.
router.get('/export-data', requireAdminPassword, async (_req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({ include: { registrationLinks: true } });
    res.json({ status: 'ok', count: events.length, events });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message });
  }
});

// POST /api/admin/import-data?password=xxx
// Body: { events: [...] } (shape produced by /export-data, each event may
// carry a nested `registrationLinks` array). Upserts by Event.url so it's
// safe to re-run. Intended to run AFTER DATABASE_URL has been pointed at
// the new (empty) database, so `prisma.event` here targets the new DB.
router.post('/import-data', requireAdminPassword, async (req: Request, res: Response) => {
  try {
    const events = (req.body?.events ?? []) as any[];
    let created = 0;
    let updated = 0;
    let linksCreated = 0;

    for (const e of events) {
      const { id, registrationLinks, createdAt, updatedAt, ...rest } = e;

      const data: any = { ...rest };
      for (const key of ['date', 'endDate', 'submissionDeadline', 'cfpDeadline', 'registrationOpensAt', 'registrationClosesAt', 'lastVerifiedAt']) {
        if (data[key]) data[key] = new Date(data[key]);
      }
      data.scrapedAt = data.scrapedAt ? new Date(data.scrapedAt) : new Date();

      if (!data.url) {
        // No unique key to upsert on — just create.
        await prisma.event.create({ data });
        created++;
        continue;
      }

      const existing = await prisma.event.findUnique({ where: { url: data.url } });
      const saved = existing
        ? await prisma.event.update({ where: { url: data.url }, data })
        : await prisma.event.create({ data });
      existing ? updated++ : created++;

      if (Array.isArray(registrationLinks)) {
        for (const link of registrationLinks) {
          const { id: linkId, eventId, discoveredAt, lastCheckedAt, lastValidAt, ...linkRest } = link;
          try {
            await prisma.registrationLink.upsert({
              where: { eventId_url: { eventId: saved.id, url: linkRest.url } },
              update: linkRest,
              create: { ...linkRest, eventId: saved.id },
            });
            linksCreated++;
          } catch { /* skip malformed link rows */ }
        }
      }
    }

    res.json({ status: 'ok', total: events.length, created, updated, linksCreated });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message });
  }
});

// GET /api/admin/test-notify?password=xxx
router.get('/test-notify', requireAdminPassword, async (_req: Request, res: Response) => {
  const message = '🧪 Test notification from AI Festivals API\nTelegram ✅ + WhatsApp test';

  const [telegram, whatsapp] = await Promise.allSettled([
    sendTelegramAlert(message),
    sendWhatsAppAlert(message),
  ]);

  res.json({
    telegram: telegram.status === 'fulfilled' ? 'sent ✓' : `failed: ${(telegram as PromiseRejectedResult).reason?.message}`,
    whatsapp: whatsapp.status === 'fulfilled' ? 'sent ✓' : `failed: ${(whatsapp as PromiseRejectedResult).reason?.message}`,
  });
});

export default router;
