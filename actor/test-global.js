/**
 * Local test for global event scraper (mimics Apify environment)
 */

const { scrapeGlobalEvents } = require('./sources/globalEventSource');

async function test() {
  console.log('Starting local test of globalEventSource...\n');

  try {
    const events = await scrapeGlobalEvents();

    console.log(`\n✅ Test completed!`);
    console.log(`Total events fetched: ${events.length}`);

    if (events.length > 0) {
      console.log('\nSample event:');
      console.log(JSON.stringify(events[0], null, 2));

      // Summary by region
      const byRegion = {};
      for (const e of events) {
        byRegion[e.region] = (byRegion[e.region] || 0) + 1;
      }
      console.log('\nBy region:');
      console.log(JSON.stringify(byRegion, null, 2));
    }
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

test();
