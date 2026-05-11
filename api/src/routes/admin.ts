import { Router, Request, Response } from 'express';
import { requireAdminPassword } from '../middleware/auth';
import { sendTelegramAlert, sendWhatsAppAlert } from '../services/notificationService';

const router = Router();

// GET /api/admin/test-notify?password=xxx
// Tests both Telegram + WhatsApp notifications
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
