import { runPipeline } from './pipeline';
import { runMonitorChecks, setNextScheduledRun } from './monitor';
import { startLinkValidatorLoop } from './linkValidator';

function log(event: string, data?: object) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

function msUntilNextUTC(hour: number, minute = 0): number {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getTime() - now.getTime();
}

function msUntilNextSundayUTC(hour: number): number {
  const now = new Date();
  const next = new Date(now);
  const daysUntilSunday = (7 - next.getUTCDay()) % 7 || 7;
  next.setUTCDate(next.getUTCDate() + daysUntilSunday);
  next.setUTCHours(hour, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 7);
  }
  return next.getTime() - now.getTime();
}

function scheduleDailyScrape(): void {
  const delay = msUntilNextUTC(6, 0);
  const nextRun = new Date(Date.now() + delay).toISOString();
  setNextScheduledRun(nextRun);
  log('scheduler.daily.scheduled', { nextRun });

  setTimeout(async () => {
    log('scheduler.daily.start');
    await runPipeline(
      ['worldwide', 'middle-east', 'africa', 'europe', 'asia', 'americas'],
      500
    );
    scheduleDailyScrape();
  }, delay);
}

function scheduleWeeklyDeepScrape(): void {
  const delay = msUntilNextSundayUTC(3);
  log('scheduler.weekly.scheduled', { nextRun: new Date(Date.now() + delay).toISOString() });

  setTimeout(async () => {
    log('scheduler.weekly.start');
    await runPipeline(
      ['worldwide', 'middle-east', 'africa', 'europe', 'asia', 'americas'],
      1000
    );
    scheduleWeeklyDeepScrape();
  }, delay);
}

function startMonitorLoop(): void {
  const THIRTY_MIN = 30 * 60 * 1000;
  setInterval(async () => {
    await runMonitorChecks();
  }, THIRTY_MIN);
  log('scheduler.monitor.started', { intervalMin: 30 });
}

export function startScheduler(): void {
  log('scheduler.boot');
  scheduleDailyScrape();
  scheduleWeeklyDeepScrape();
  startMonitorLoop();
  startLinkValidatorLoop();
}
