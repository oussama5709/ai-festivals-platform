#!/usr/bin/env ts-node
// CLI wrapper for `npm run seed:tunisia` (local dev only).
// The actual data + logic live in api/src/data/tunisiaEvents.ts so they can
// also be imported by the admin HTTP route without violating tsconfig's
// rootDir="./src" during `npm run build`.
import { PrismaClient } from '@prisma/client';
import { seedTunisiaFull } from '../src/data/tunisiaEvents';

const prisma = new PrismaClient();

seedTunisiaFull(prisma).catch(console.error);
