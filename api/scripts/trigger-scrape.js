#!/usr/bin/env node
/**
 * trigger-scrape.js
 * Triggers an Apify actor run and prints the run ID.
 * Usage:
 *   APIFY_API_TOKEN=xxx APIFY_ACTOR_ID=yyy node scripts/trigger-scrape.js
 */

const https = require('https');

const TOKEN    = process.env.APIFY_API_TOKEN;
const ACTOR_ID = process.env.APIFY_ACTOR_ID;

if (!TOKEN || !ACTOR_ID) {
  console.error('❌  APIFY_API_TOKEN and APIFY_ACTOR_ID must be set');
  process.exit(1);
}

const body = JSON.stringify({
  searchRegions: ['worldwide', 'middle-east', 'africa', 'europe', 'asia', 'americas'],
  upcomingOnly:  true,
  maxResults:    200,
  minDate:       new Date().toISOString().split('T')[0],
});

const options = {
  hostname: 'api.apify.com',
  path:     `/v2/acts/${ACTOR_ID}/runs`,
  method:   'POST',
  headers:  {
    'Content-Type':   'application/json',
    'Authorization':  `Bearer ${TOKEN}`,
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    if (res.statusCode === 201) {
      const run = JSON.parse(data).data;
      console.log('✅  Actor run triggered!');
      console.log(`   Run ID    : ${run.id}`);
      console.log(`   Status    : ${run.status}`);
      console.log(`   Dataset   : ${run.defaultDatasetId}`);
      console.log(`   View run  : https://console.apify.com/actors/${ACTOR_ID}/runs/${run.id}`);
    } else {
      console.error(`❌  HTTP ${res.statusCode}: ${data}`);
      process.exit(1);
    }
  });
});

req.on('error', e => { console.error('❌ ', e.message); process.exit(1); });
req.write(body);
req.end();
