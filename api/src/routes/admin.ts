import { Router, Request, Response } from 'express';
import { requireAdminPassword } from '../middleware/auth';
import { sendTelegramAlert, sendWhatsAppAlert } from '../services/notificationService';
import { seedTunisiaFull } from '../../prisma/tunisia-seed';

const router = Router();

// POST /api/admin/seed-tunisia?password=xxx
// Idempotent: clears existing isTunisia:true rows then re-inserts the curated list.
// Safe to call repeatedly (e.g. after a fresh DB provision).
router.post('/seed-tunisia', requireAdminPassword, async (_req: Request, res: Response) => {
  try {
    const result = await seedTunisiaFull();
    res.json({ status: 'ok', ...result });
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
