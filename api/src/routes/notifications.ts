import { Router, Request, Response } from 'express';
import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Configure VAPID — required before any push send
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@ai-festivals-platform.vercel.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

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
  if (!key) return res.status(503).json({ error: 'Push not configured' });
  res.json({ publicKey: key });
});

// ── Export helper for internal use ────────────────────────────────────────────

export async function sendPushToTopic(topic: string, payload: {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { topics: { has: topic } },
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(async (err: any) => {
        // 410 Gone = subscription expired, remove it
        if (err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
        throw err;
      })
    )
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  console.log(`[push] sent to ${results.length - failed}/${results.length} subscribers on topic "${topic}"`);
}

export default router;
