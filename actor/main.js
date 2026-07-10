const { Actor } = require('apify'); // SDK v3
const { scrapeTunisiaEvents } = require('./sources/tunisiaSource');
const { scrapeGlobalEvents } = require('./sources/globalEventSource');

// ── Hard-coded authoritative conferences (always include) ─────────────────────
// These are the real, verified 2026 editions of major international AI/ML
// conferences and summits. Dates/locations verified via web search on 2026-07-10.
//
// NOTE: This list needs a manual refresh once a year (each conference announces
// its next edition's dates/venue ~6-12 months ahead). The three generic
// aggregator scrapers previously used here (conftech.ai, conferences.ai,
// wikicfp.com) were removed after verifying they no longer return usable data:
// conftech.ai's domain no longer resolves, conferences.ai is now a parked
// domain-for-sale page, and wikicfp.com is blocked/untrusted. Rather than
// scrape unreliable/dead sources, we rely on this curated list + the
// dedicated Tunisia scraper (tunisiaSource.js), which is real and working.

const HARDCODED = [
  { title: 'NeurIPS 2026',              date: '2026-12-06', endDate: '2026-12-12', location: 'Sydney, Australia',        url: 'https://neurips.cc/Conferences/2026',              category: 'conference', region: 'asia',        qualityScore: 0.98 },
  { title: 'ICML 2026',                 date: '2026-07-06', endDate: '2026-07-11', location: 'Seoul, South Korea',       url: 'https://icml.cc/Conferences/2026',                 category: 'conference', region: 'asia',        qualityScore: 0.97 },
  { title: 'ICLR 2026',                 date: '2026-04-23', endDate: '2026-04-27', location: 'Rio de Janeiro, Brazil',   url: 'https://iclr.cc/Conferences/2026',                 category: 'conference', region: 'americas',    qualityScore: 0.97 },
  { title: 'CVPR 2026',                 date: '2026-06-02', endDate: '2026-06-07', location: 'Denver, USA',              url: 'https://cvpr.thecvf.com/Conferences/2026',         category: 'conference', region: 'americas',    qualityScore: 0.96 },
  { title: 'AAAI 2026',                 date: '2026-01-20', endDate: '2026-01-27', location: 'Singapore',                url: 'https://aaai.org/conference/aaai/aaai-26/',        category: 'conference', region: 'asia',        qualityScore: 0.96 },
  { title: 'IJCAI-ECAI 2026',           date: '2026-08-15', endDate: '2026-08-21', location: 'Bremen, Germany',          url: 'https://2026.ijcai.org/',                          category: 'conference', region: 'europe',      qualityScore: 0.95 },
  { title: 'ACL 2026',                  date: '2026-07-02', endDate: '2026-07-07', location: 'San Diego, USA',           url: 'https://2026.aclweb.org',                          category: 'conference', region: 'americas',    qualityScore: 0.95 },
  { title: 'EMNLP 2026',                date: '2026-10-24', endDate: '2026-10-29', location: 'Budapest, Hungary',        url: 'https://2026.emnlp.org',                           category: 'conference', region: 'europe',      qualityScore: 0.93 },
  { title: 'KDD 2026',                  date: '2026-08-09', endDate: '2026-08-13', location: 'Jeju, South Korea',        url: 'https://kdd2026.kdd.org',                          category: 'conference', region: 'asia',        qualityScore: 0.93 },
  { title: 'ECCV 2026',                 date: '2026-09-08', endDate: '2026-09-13', location: 'Malmö, Sweden',            url: 'https://eccv.ecva.net/Conferences/2026',           category: 'conference', region: 'europe',      qualityScore: 0.94 },
  { title: 'MICCAI 2026',               date: '2026-09-27', endDate: '2026-10-01', location: 'Strasbourg, France',       url: 'https://conferences.miccai.org/2026/',             category: 'conference', region: 'europe',      qualityScore: 0.91 },
  { title: 'INTERSPEECH 2026',          date: '2026-09-27', endDate: '2026-10-01', location: 'Sydney, Australia',        url: 'https://interspeech2026.org',                      category: 'conference', region: 'asia',        qualityScore: 0.90 },
  { title: 'AISTATS 2026',              date: '2026-05-02', endDate: '2026-05-05', location: 'Tangier, Morocco',         url: 'https://aistats.org/aistats2026/',                 category: 'conference', region: 'africa',      qualityScore: 0.93 },
  { title: 'GITEX Global 2026',         date: '2026-12-07', endDate: '2026-12-11', location: 'Dubai, UAE',               url: 'https://www.gitex.com/gitex-global-2026',          category: 'summit',     region: 'middle-east', qualityScore: 0.88 },
  { title: 'Global AI Summit 2026',     date: '2026-09-15', endDate: '2026-09-17', location: 'Riyadh, Saudi Arabia',     url: 'https://globalaisummit.org/',                      category: 'summit',     region: 'middle-east', qualityScore: 0.87 },
  { title: 'AI Everything Abu Dhabi 2026', date: '2026-10-05', endDate: '2026-10-07', location: 'Abu Dhabi, UAE',        url: 'https://aieverythingabudhabi.com/',                category: 'summit',     region: 'middle-east', qualityScore: 0.86 },
  { title: 'LEAP 2026',                 date: '2026-08-31', endDate: '2026-09-03', location: 'Riyadh, Saudi Arabia',     url: 'https://onegiantleap.com/',                        category: 'conference', region: 'middle-east', qualityScore: 0.87 },
  { title: 'GITEX Africa 2026',         date: '2026-04-07', endDate: '2026-04-09', location: 'Marrakech, Morocco',       url: 'https://gitexafrica.com/',                         category: 'summit',     region: 'africa',      qualityScore: 0.85 },
  { title: 'AI Summit London 2026',     date: '2026-06-10', endDate: '2026-06-11', location: 'London, UK',               url: 'https://london.theaisummit.com/',                  category: 'summit',     region: 'europe',      qualityScore: 0.88 },
  { title: 'VivaTech 2026',             date: '2026-06-17', endDate: '2026-06-20', location: 'Paris, France',            url: 'https://vivatech.com/',                            category: 'summit',     region: 'europe',      qualityScore: 0.87 },
  { title: 'Web Summit 2026',           date: '2026-11-09', endDate: '2026-11-12', location: 'Lisbon, Portugal',         url: 'https://websummit.com/',                           category: 'conference', region: 'europe',      qualityScore: 0.86 },
  { title: 'AI for Good Global Summit 2026', date: '2026-07-07', endDate: '2026-07-10', location: 'Geneva, Switzerland', url: 'https://aiforgood.itu.int/',                       category: 'conference', region: 'europe',      qualityScore: 0.88 },
  { title: 'CoRL 2026',                 date: '2026-11-09', endDate: '2026-11-12', location: 'Austin, USA',              url: 'https://www.corl.org/',                            category: 'conference', region: 'americas',    qualityScore: 0.88 },
  { title: 'FAccT 2026',                date: '2026-06-25', endDate: '2026-06-28', location: 'Montreal, Canada',         url: 'https://facctconference.org/2026/',                category: 'conference', region: 'americas',    qualityScore: 0.89 },
  { title: 'SIGIR 2026',                date: '2026-07-20', endDate: '2026-07-24', location: 'Melbourne, Australia',     url: 'https://sigir2026.org',                            category: 'conference', region: 'asia',        qualityScore: 0.91 },
  { title: 'UAI 2026',                  date: '2026-08-17', endDate: '2026-08-21', location: 'Amsterdam, Netherlands',   url: 'https://www.auai.org/uai2026/',                    category: 'conference', region: 'europe',      qualityScore: 0.92 },
];

// ── Dedup by URL ──────────────────────────────────────────────────────────────

function dedup(events) {
  const seen = new Set();
  return events.filter(e => {
    const key = e.url || e.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

Actor.main(async () => {
  const input = await Actor.getInput();
  const {
    searchRegions = ['worldwide', 'middle-east', 'africa', 'europe', 'asia', 'americas'],
    minDate       = new Date().toISOString().split('T')[0],
    maxResults    = 300,
  } = input || {};

  const dataset = await Actor.openDataset();
  console.log(`\n🚀 AI Festivals Scraper v3.0`);
  console.log(`📍 Regions: ${searchRegions.join(', ')}`);
  console.log(`📅 Min date: ${minDate}\n`);

  let all = [];

  // 1. Always push hardcoded authoritative conferences
  console.log('📚 Loading hardcoded authoritative conferences...');
  const filtered = HARDCODED.filter(e =>
    searchRegions.includes('worldwide') ||
    searchRegions.includes(e.region)
  );
  all.push(...filtered.map(e => ({ ...e, source: e.source || 'official-website' })));
  console.log(`   Added ${filtered.length} authoritative conferences`);

  // 2. Tunisia-specific source (only runs if africa/worldwide is requested —
  // no point scraping it for a search scoped to e.g. asia-only).
  if (searchRegions.includes('worldwide') || searchRegions.includes('africa')) {
    console.log('\n🇹🇳 Scraping Tunisia source (tunis.events)...');
    const tunisia = await Promise.allSettled([scrapeTunisiaEvents()]);
    if (tunisia[0].status === 'fulfilled') all.push(...tunisia[0].value);
    else console.log(`  Tunisia source: failed (${tunisia[0].reason?.message})`);
  }

  // 3. Global events source (Meetup.com + others) — only if worldwide or if no region filter is strict
  if (searchRegions.includes('worldwide')) {
    console.log('\n🌍 Scraping global events source (Meetup.com)...');
    const global = await Promise.allSettled([scrapeGlobalEvents()]);
    if (global[0].status === 'fulfilled') all.push(...global[0].value);
    else console.log(`  Global events source: failed (${global[0].reason?.message})`);
  }

  // 4. Dedup + filter by date + cap
  all = dedup(all);
  all = all.filter(e => {
    if (!e.date) return true;
    return e.date >= minDate;
  });
  all = all.slice(0, maxResults);

  // 5. Push to dataset
  console.log(`\n📦 Pushing ${all.length} events to dataset...`);
  for (const ev of all) {
    await dataset.pushData(ev);
  }

  console.log(`\n✅ Done — ${all.length} events in dataset`);
});
