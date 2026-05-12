import axios from 'axios';

const FOURTEEN_MIN = 14 * 60 * 1000;

export function startKeepAlive(): void {
  const url = process.env.RENDER_EXTERNAL_URL
    ? `${process.env.RENDER_EXTERNAL_URL}/api/health`
    : `http://localhost:${process.env.PORT ?? 3001}/api/health`;

  setInterval(async () => {
    try {
      await axios.get(url, { timeout: 10000 });
      console.log(`[keep-alive] pinged ${new Date().toISOString()}`);
    } catch (err: unknown) {
      console.warn('[keep-alive] ping failed:', (err as Error).message);
    }
  }, FOURTEEN_MIN);

  console.log('[keep-alive] started — pinging every 14 min');
}

export function startDailyScrape(): void {
  if (!process.env.APIFY_API_TOKEN || !process.env.APIFY_ACTOR_ID) {
    console.log('[scheduler] Apify not configured — daily scrape disabled');
    return;
  }

  const scheduleNext = () => {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(6, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    const delay = next.getTime() - now.getTime();

    setTimeout(async () => {
      console.log('[scheduler] Starting daily scrape...');
      try {
        const { triggerActorRun } = await import('../services/apifyService');
        await triggerActorRun(
          ['worldwide', 'middle-east', 'africa', 'europe', 'asia', 'americas'],
          500
        );
        console.log('[scheduler] Daily scrape triggered ✓');
      } catch (err: unknown) {
        console.error('[scheduler] Daily scrape failed:', (err as Error).message);
      }
      scheduleNext();
    }, delay);

    console.log(`[scheduler] Next scrape at ${next.toISOString()}`);
  };

  scheduleNext();
}
