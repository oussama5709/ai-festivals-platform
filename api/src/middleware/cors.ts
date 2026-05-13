import cors from 'cors';

const PRODUCTION_ORIGINS = [
  'https://ai-festivals-platform.vercel.app',
  'https://ai-festivals-scraper.vercel.app', // fallback alias
];

const allowedOrigins = [
  ...PRODUCTION_ORIGINS,
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
].filter((v): v is string => Boolean(v));

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) and all allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
