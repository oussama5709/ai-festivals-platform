import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const PUSH_CONFIGURED = Boolean(
  process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
);

if (PUSH_CONFIGURED) {
  webpush.setVapidDetails(
    'mailto:admin@ai-festivals-platform.vercel.app',
    process.env.VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
  );
} else {
  console.warn(
    '[push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not set — browser push notifications are disabled. ' +
    'Generate a pair with `npx web-push generate-vapid-keys` and set both vars in the API environment.'
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

/**
 * Sends a web-push notification to every subscriber registered for `topic`.
 * Silently no-ops (with a warning already logged at boot) if VAPID keys are missing.
 * Expired (410 Gone) subscriptions are pruned automatically.
 */
export async function sendPushToTopic(topic: string, payload: PushPayload): Promise<void> {
  if (!PUSH_CONFIGURED) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { topics: { has: topic } },
  });

  if (subs.length === 0) return;

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
        .catch(async (err: any) => {
          // 410 Gone = subscription expired on the browser/push-service side, remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
          throw err;
        })
    )
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  console.log(`[push] sent to ${results.length - failed}/${results.length} subscribers on topic "${topic}"`);
}
