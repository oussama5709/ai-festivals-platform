#!/usr/bin/env node
/**
 * Switches Prisma schema provider based on DATABASE_URL.
 * Default (production/build-time): PostgreSQL
 * Local dev only: if DATABASE_URL starts with 'file:' → SQLite
 */
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const dbUrl = process.env.DATABASE_URL || '';
const isSQLite = dbUrl.startsWith('file:');

let schema = fs.readFileSync(schemaPath, 'utf8');

if (isSQLite) {
  schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
  schema = schema.replace(/regions\s+String\b(?!\[\])/, 'regions      String');
  console.log('[switch-schema] → SQLite (local dev)');
} else {
  schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
  schema = schema.replace(/regions\s+String\b(?!\[\])/, 'regions      String');
  console.log('[switch-schema] → PostgreSQL (production)');
}

fs.writeFileSync(schemaPath, schema);
