import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PUSH_CONFIGURED } from '../services/pushService';

const router = Router();
const prisma = new PrismaClient();

// POST /api/notifications/push/subscribe
router.post('/push/subscribe', async (req: Request, res: Response) => {
  const { subscription, topics } = req.body as {
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
    topics?: string[];
  };

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        topics: topics ?? ['ai-competitions'],
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        topics: topics ?? ['ai-competitions'],
      },
    });
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE /api/notifications/push/unsubscribe
router.delete('/push/unsubscribe', async (req: Request, res: Response) => {
  const { endpoint } = req.body as { endpoint: string };
  if (!endpoint) return res.status(400).json({ error: 'endpoint required' });

  try {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    res.json({ success: true });
  } catch {
    res.json({ success: true }); // idempotent
  }
});

// GET /api/notifications/vapid-public-key
router.get('/vapid-public-key', (_req: Request, res: Response) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!PUSH_CONFIGURED || !key) {
    return res.status(503).json({ error: 'Push not configured' });
  }
  res.json({ publicKey: key });
});

// GET /api/notifications/status — quick diagnostic so the dashboard/admin can see
// at a glance which notification channels are actually wired up.
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    push: PUSH_CONFIGURED,
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    whatsapp: Boolean(
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER
    ),
  });
});

export default router;
