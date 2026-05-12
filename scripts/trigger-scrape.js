#!/usr/bin/env node
/**
 * Manually trigger an Apify actor run to populate the database.
 * Run: node scripts/trigger-scrape.js
 * Requires: APIFY_API_TOKEN and APIFY_ACTOR_ID in environment
 */

const https = require('https');

const TOKEN    = process.env.APIFY_API_TOKEN;
const ACTOR_ID = process.env.APIFY_ACTOR_ID;

if (!TOKEN || !ACTOR_ID) {
  console.error('❌ Set APIFY_API_TOKEN and APIFY_ACTOR_ID environment variables');
  process.exit(1);
}

const body = JSON.stringify({
  searchRegions:  ['worldwide', 'middle-east', 'africa', 'europe', 'asia', 'americas'],
  maxResults:     500,
  upcomingOnly:   true,
  minimumQuality: 0.5,
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
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const run = JSON.parse(data);
    if (run.data?.id) {
      console.log('✅ Scrape started!');
      console.log(`   Run ID: ${run.data.id}`);
      console.log(`   Status: ${run.data.status}`);
      console.log(`   Watch:  https://console.apify.com/actors/${ACTOR_ID}/runs/${run.data.id}`);
      console.log('\nResults sent to webhook automatically when done (~3-5 min)');
    } else {
      console.error('❌ Failed:', data);
    }
  });
});

req.on('error', err => console.error('❌ Request error:', err.message));
req.write(body);
req.end();
