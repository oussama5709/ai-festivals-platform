const log = (msg: string, data?: object) =>
  console.log(JSON.stringify({ ts: new Date().toISOString(), event: msg, ...data }));

// ── Exponential backoff ───────────────────────────────────────────────────────

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  label: string;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions
): Promise<T> {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      return await fn();
    } catch (err) {
      const isLast = attempt >= opts.maxAttempts;
      const delay = opts.baseDelayMs * Math.pow(3, attempt - 1); // 1x, 3x, 9x
      log(`[retry] ${opts.label} attempt ${attempt}/${opts.maxAttempts} failed`, {
        error: (err as Error).message,
        nextDelayMs: isLast ? null : delay,
      });
      if (isLast) throw err;
      await sleep(delay);
    }
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Circuit breaker ───────────────────────────────────────────────────────────

type CBState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CBState = 'closed';
  private failures = 0;
  private openedAt: number | null = null;

  constructor(
    private readonly label: string,
    private readonly threshold = 3,
    private readonly resetMs = 60_000
  ) {}

  isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - (this.openedAt ?? 0) > this.resetMs) {
        this.state = 'half-open';
        log(`[circuit] ${this.label} half-open — trying recovery`);
        return false;
      }
      return true;
    }
    return false;
  }

  onSuccess(): void {
    if (this.state !== 'closed') {
      log(`[circuit] ${this.label} recovered — closed`);
    }
    this.failures = 0;
    this.state = 'closed';
    this.openedAt = null;
  }

  onFailure(): void {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'open';
      this.openedAt = Date.now();
      log(`[circuit] ${this.label} OPEN after ${this.failures} failures`);
    }
  }

  getState(): CBState {
    return this.state;
  }
}

export const dbCircuit = new CircuitBreaker('db', 3, 60_000);
