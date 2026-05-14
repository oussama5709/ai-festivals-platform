import rateLimit from 'express-rate-limit';
import slowDown, { SlowDownRequestHandler } from 'express-slow-down';
import { Request, Response, NextFunction, Express, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Rate Limiting ─────────────────────────────────────────────────────────────

export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  handler: (req, res, _next, options) => {
    logThreat(req, 'RATE_LIMIT_EXCEEDED');
    res.status(options.statusCode).json(options.message);
  },
  skip: (req) => req.path === '/api/health', // never rate-limit health check
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
  handler: (req, res, _next, options) => {
    logThreat(req, 'AUTH_BRUTE_FORCE');
    sendSecurityAlert(req, 'Brute force login attempt detected').catch(() => {});
    res.status(options.statusCode).json(options.message);
  },
});

export const speedLimiter: RequestHandler = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 80,
  delayMs: () => 300,
});

// ── Bot / Scanner Detection ────────────────────────────────────────────────────

const SCANNER_SIGNATURES = [
  'sqlmap', 'nikto', 'nmap', 'masscan', 'burpsuite', 'owasp',
  'acunetix', 'nessus', 'openvas', 'w3af', 'skipfish', 'havij',
  'zgrab', 'nuclei', 'dirbuster', 'gobuster', 'wfuzz',
];

export function detectBots(req: Request, res: Response, next: NextFunction): void {
  const ua = (req.headers['user-agent'] ?? '').toLowerCase();

  if (SCANNER_SIGNATURES.some((sig) => ua.includes(sig))) {
    logThreat(req, 'SCANNER_DETECTED', { ua: ua.slice(0, 120) });
    sendSecurityAlert(req, `Security scanner detected: ${ua.slice(0, 80)}`).catch(() => {});
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // No UA at all = likely raw script
  if (!ua || ua.length < 5) {
    logThreat(req, 'MISSING_UA');
    res.status(400).json({ error: 'Bad request' });
    return;
  }

  next();
}

// ── Injection Detection ────────────────────────────────────────────────────────

const SQL_RE  = /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|--|\/\*|\*\/|xp_)/gi;
const XSS_RE  = /<script|javascript:|on\w+\s*=|<iframe|<object|<embed|<svg\s/gi;

function hasDangerousInput(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  SQL_RE.lastIndex = 0;
  XSS_RE.lastIndex = 0;
  return SQL_RE.test(val) || XSS_RE.test(val);
}

function scanObject(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  return Object.values(obj as Record<string, unknown>).some((v) =>
    typeof v === 'object' ? scanObject(v) : hasDangerousInput(v)
  );
}

export function sanitizeInputs(req: Request, res: Response, next: NextFunction): void {
  if (scanObject(req.query) || scanObject(req.body) || scanObject(req.params)) {
    logThreat(req, 'INJECTION_ATTEMPT');
    sendSecurityAlert(req, 'Injection attack blocked').catch(() => {});
    res.status(400).json({ error: 'Invalid input detected' });
    return;
  }
  next();
}

// ── Security Response Headers ─────────────────────────────────────────────────

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  next();
}

// ── Honeypots (traps for attackers) ──────────────────────────────────────────

const HONEYPOT_PATHS = [
  '/admin', '/wp-admin', '/phpmyadmin', '/config', '/.env',
  '/backup', '/dump', '/shell', '/console', '/.git/config',
  '/api/v1/users/all', '/actuator', '/api/swagger-ui',
];

export function honeypotRoutes(app: Express): void {
  HONEYPOT_PATHS.forEach((path) => {
    app.all(path, (req: Request, res: Response) => {
      logThreat(req, 'HONEYPOT_TRIGGERED', { trapPath: path });
      sendSecurityAlert(req, `🍯 Honeypot hit: ${path}`).catch(() => {});
      // Return fake 200 to confuse attacker
      res.status(200).json({ status: 'ok', data: [] });
    });
  });
}

// ── IP Violation Tracking ─────────────────────────────────────────────────────

const violations = new Map<string, number>();

export function trackViolations(req: Request, res: Response, next: NextFunction): void {
  const ip = getIp(req);
  if ((violations.get(ip) ?? 0) >= 5) {
    sendSecurityAlert(req, `IP auto-blocked after repeated violations`).catch(() => {});
    res.status(403).json({ error: 'IP blocked' });
    return;
  }
  next();
}

export function incrementViolation(ip: string): void {
  const count = (violations.get(ip) ?? 0) + 1;
  violations.set(ip, count);
  setTimeout(() => violations.delete(ip), 24 * 60 * 60 * 1000);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function getIp(req: Request): string {
  return String(
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ??
    req.ip ??
    'unknown'
  );
}

function logThreat(req: Request, type: string, extra?: object): void {
  const entry = {
    ts: new Date().toISOString(),
    type,
    ip: getIp(req),
    ua: req.headers['user-agent']?.slice(0, 200),
    method: req.method,
    path: req.path,
    ...extra,
  };
  console.warn(`🔴 SECURITY [${type}] ${JSON.stringify(entry)}`);

  // Persist to DB async — don't block request
  prisma.securityLog.create({
    data: {
      type,
      ip: entry.ip,
      ua: entry.ua,
      path: entry.path,
      method: entry.method,
      details: extra ?? undefined,
    },
  }).catch(() => {});
}

async function sendSecurityAlert(req: Request, message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text =
    `🚨 <b>SECURITY ALERT</b>\n\n` +
    `<b>Type:</b> ${message}\n` +
    `<b>IP:</b> ${getIp(req)}\n` +
    `<b>Path:</b> ${req.method} ${req.path}\n` +
    `<b>Time:</b> ${new Date().toLocaleString('fr-TN')}\n\n` +
    `<i>AI Festivals Security System</i>`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}
