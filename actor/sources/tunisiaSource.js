// Tunisia-specific event source.
//
// Unlike the generic AI-conference aggregators in main.js, tunis.events is a
// real, actively-maintained directory of Tunisian festivals (music, film,
// heritage, contemporary arts). Every event is server-rendered on both the
// listing page and each festival's own detail page, so it can be scraped
// reliably with axios + cheerio (no headless browser needed).
//
// Coverage note (be honest about limits, don't overclaim):
//   - Covers: cinema (Film), mixed-image/arts (Music/Electronic/Heritage/
//     Cultural), and photo when the festival's own description mentions it.
//   - Does NOT cover: hackathon / ai. Tunisian tech hackathons are mostly
//     announced on GDG Community (gdg.community.dev) and Devpost, both of
//     which render their event lists client-side (JS), so they can't be
//     scraped with a plain HTTP request the way this source can. Until a
//     headless-browser source is added for those two, the hackathon/ai
//     categories fall back to the curated baseline in
//     api/src/data/tunisiaEvents.ts.

const axios = require('axios');
const cheerio = require('cheerio');

const LISTING_URL = 'https://tunis.events/en/festivals-tunisie';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December|Variable|Autumn|Spring|Summer|Winter';

// Tunis.events' own editorial category -> our festivalType/mediaType.
// Everything that isn't clearly "Film" is bucketed as mixed-image (arts &
// culture); the per-event description is separately checked for photography
// keywords so genuine photo festivals still land in the right tab.
function mapCategory(category, description) {
  const d = (description || '').toLowerCase();
  if (category === 'Film') return { festivalType: 'cinema', mediaType: 'film' };
  if (/(photo|photographie|photography)/.test(d)) return { festivalType: 'photo', mediaType: 'photo' };
  return { festivalType: 'mixed-image', mediaType: category === 'Cultural' ? 'mixed-image' : 'all' };
}

async function fetchFestivalSlugs() {
  const { data } = await axios.get(LISTING_URL, { headers: HEADERS, timeout: 20000 });
  const $ = cheerio.load(data);

  const slugs = new Set();
  $('a[href*="/en/festivals-tunisie/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const m = href.match(/\/en\/festivals-tunisie\/([a-z0-9-]+)\/?$/);
    if (m) slugs.add(m[1]);
  });
  return [...slugs];
}

async function scrapeFestivalDetail(slug) {
  const url = `https://tunis.events/en/festivals-tunisie/${slug}`;
  const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
  const $ = cheerio.load(data);

  const title = $('h1').first().text().trim();
  if (!title) return null;

  // The category/location/date/since/capacity line sits in the ~400 chars
  // right after the title in the flattened body text (no reliable class
  // names to hook into, so we parse it with regex instead of selectors).
  const bodyText = $('body').text();
  const titleIdx = bodyText.indexOf(title);
  const windowText = titleIdx >= 0 ? bodyText.slice(titleIdx, titleIdx + 500) : bodyText;

  const categoryMatch = windowText.match(/\n(Music|Electronic|Heritage|Film|Cultural)\n/);
  const category = categoryMatch ? categoryMatch[1] : null;

  const locMatch = windowText.match(/([A-ZÉÀÈÎ][a-zà-ÿ'’.\- ]+),\s*([A-ZÉÀÈÎ][a-zà-ÿ]+)(?=[A-Z][a-z]+(?:\s*-\s*[A-Z][a-z]+)?|Since|Variable)/);
  const monthMatch = windowText.match(new RegExp(`(${MONTHS})(?:\\s*-\\s*(${MONTHS}))?`));

  const description = $('h1').first().nextAll('p').slice(0, 2).map((_, p) => $(p).text().trim()).get().join(' ') || null;

  let officialUrl = url;
  $('a').each((_, a) => {
    if ($(a).text().trim().toLowerCase() === 'official website') {
      const href = $(a).attr('href');
      if (href) officialUrl = href;
    }
  });

  const { festivalType, mediaType } = mapCategory(category, description);

  return {
    title,
    description,
    url: officialUrl,
    location: locMatch ? `${locMatch[1].trim()}, ${locMatch[2].trim()}` : null,
    governorate: locMatch ? locMatch[2].trim() : null,
    // tunis.events gives recurring month ranges (e.g. "July - August"), not a
    // single hard date — real per-year dates are picked up in the "Past
    // editions" section for OLD editions only, so we deliberately leave
    // date/endDate null here rather than guess a specific day.
    date: null,
    endDate: null,
    isOnline: false,
    category: 'conference',
    region: 'africa',
    regionArabic: 'أفريقيا',
    qualityScore: 0.8,
    source: 'tunis.events',
    isTunisia: true,
    festivalType,
    mediaType,
    recurrence: monthMatch ? monthMatch[0] : null,
  };
}

async function scrapeTunisiaEvents() {
  const events = [];
  let slugs = [];

  try {
    slugs = await fetchFestivalSlugs();
    console.log(`  Tunis.events: found ${slugs.length} festival pages`);
  } catch (e) {
    console.log(`  Tunis.events (listing): failed (${e.message})`);
    return events;
  }

  for (const slug of slugs) {
    try {
      const event = await scrapeFestivalDetail(slug);
      if (event) events.push(event);
    } catch (e) {
      console.log(`  Tunis.events (${slug}): failed (${e.message})`);
    }
  }

  console.log(`  Tunis.events: ${events.length}/${slugs.length} Tunisia events scraped`);
  return events;
}

module.exports = { scrapeTunisiaEvents };
