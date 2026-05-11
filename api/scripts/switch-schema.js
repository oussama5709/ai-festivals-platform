#!/usr/bin/env node
/**
 * Switches Prisma schema provider based on DATABASE_URL.
 * - postgresql://... → provider = "postgresql", regions String[]
 * - file:...         → provider = "sqlite",     regions String
 */
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgresql') || dbUrl.startsWith('postgres');

let schema = fs.readFileSync(schemaPath, 'utf8');

if (isPostgres) {
  schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
  schema = schema.replace(/regions\s+String\b(?!\[\])/, 'regions      String[]');
  console.log('[switch-schema] → PostgreSQL');
} else {
  schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
  schema = schema.replace(/regions\s+String\[\]/, 'regions      String');
  console.log('[switch-schema] → SQLite');
}

fs.writeFileSync(schemaPath, schema);
