import { Request, Response, NextFunction } from 'express';

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.API_KEY) {
    res.status(401).json({ error: 'Invalid or missing API key.' });
    return;
  }
  next();
}

export function requireAdminPassword(req: Request, res: Response, next: NextFunction): void {
  const password = req.headers['x-admin-password'] ?? req.query['password'];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  next();
}
