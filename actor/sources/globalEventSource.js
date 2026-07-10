const axios = require('axios');

/**
 * Scrape global AI/tech events from Meetup.com using their public API.
 * Returns events with standardized fields: title, date, endDate, location, url, region, category, qualityScore, etc.
 */
async function scrapeGlobalEvents() {
  const events = [];

  try {
    console.log('  Fetching Meetup events...');

    // Search for AI/ML/tech conference events globally
    // Meetup API endpoint (no auth required for basic search)
    const queries = [
      'ai conference',
      'machine learning summit',
      'tech summit',
      'data science conference',
      'deep learning workshop',
      'nlp conference',
      'computer vision conference'
    ];

    for (const query of queries) {
      try {
        const response = await axios.get('https://www.meetup.com/api/find/events', {
          params: {
            query: query,
            lat: 20, // approximate global center
            lon: 0,
            radius: 'global', // search worldwide
            order: 'time',
            sign: 'true',
            photo_host: 'public',
            page: 20, // fetch up to 20 results per query
            offset: 0,
          },
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AIFestivalsScraper/1.0)'
          }
        });

        if (response.data && Array.isArray(response.data.events)) {
          for (const event of response.data.events) {
            const evt = mapMeetupToEvent(event);
            if (evt) events.push(evt);
          }
        }
      } catch (err) {
        console.log(`  Query "${query}": ${err.message}`);
      }
    }

    console.log(`  Found ${events.length} global events from Meetup`);
  } catch (err) {
    console.error(`  Global events scraper failed: ${err.message}`);
  }

  return events;
}

/**
 * Map Meetup event object to our standardized event format
 */
function mapMeetupToEvent(meetupEvent) {
  if (!meetupEvent.title || !meetupEvent.local_date) return null;

  // Extract region from venue location
  const region = inferRegionFromLocation(meetupEvent);

  // Infer category from title/group keywords
  const category = inferCategory(meetupEvent.title + ' ' + (meetupEvent.group?.name || ''));

  return {
    title: meetupEvent.title?.slice(0, 200) || '',
    description: meetupEvent.description?.slice(0, 500) || '',
    date: meetupEvent.local_date || '',
    endDate: meetupEvent.local_date || '', // Meetup doesn't always have end date
    location: formatLocation(meetupEvent),
    isOnline: meetupEvent.venue?.name?.toLowerCase().includes('virtual') ||
              meetupEvent.venue?.name?.toLowerCase().includes('online') ||
              false,
    url: meetupEvent.link || '',
    source: 'meetup.com',
    region: region,
    category: category,
    qualityScore: 0.72, // Medium quality (crowdsourced community events)
    scrapedAt: new Date(),
  };
}

function formatLocation(event) {
  if (!event.venue) return 'Online/TBD';

  const parts = [];
  if (event.venue.name) parts.push(event.venue.name);
  if (event.venue.city) parts.push(event.venue.city);
  if (event.venue.state) parts.push(event.venue.state);
  if (event.venue.country) parts.push(event.venue.country);

  return parts.filter(Boolean).slice(-3).join(', ') || 'TBD';
}

function inferRegionFromLocation(event) {
  const location = (
    (event.venue?.city || '') + ' ' +
    (event.venue?.state || '') +
    (event.venue?.country || '')
  ).toLowerCase();

  // Simple heuristic region detection
  const euroCountries = ['uk', 'germany', 'france', 'spain', 'italy', 'netherlands', 'sweden', 'poland', 'hungary', 'belgium', 'austria', 'czech', 'ireland', 'portugal', 'finland', 'greece'];
  const asiaCountries = ['japan', 'china', 'india', 'korea', 'singapore', 'vietnam', 'thailand', 'indonesia', 'malaysia', 'philippines', 'taiwan'];
  const americasCountries = ['usa', 'canada', 'united states', 'mexico', 'brazil', 'argentina', 'chile'];
  const middleEastCountries = ['saudi', 'uae', 'dubai', 'qatar', 'israel', 'jordan'];
  const africaCountries = ['egypt', 'south africa', 'morocco', 'nigeria', 'kenya'];

  for (const country of euroCountries) {
    if (location.includes(country)) return 'europe';
  }
  for (const country of asiaCountries) {
    if (location.includes(country)) return 'asia';
  }
  for (const country of americasCountries) {
    if (location.includes(country)) return 'americas';
  }
  for (const country of middleEastCountries) {
    if (location.includes(country)) return 'middle-east';
  }
  for (const country of africaCountries) {
    if (location.includes(country)) return 'africa';
  }

  return 'worldwide'; // fallback
}

function inferCategory(text) {
  const lower = text.toLowerCase();

  if (lower.includes('hackathon')) return 'hackathon';
  if (lower.includes('workshop')) return 'workshop';
  if (lower.includes('summit')) return 'summit';
  if (lower.includes('competition')) return 'competition';
  if (lower.includes('meetup')) return 'meetup';
  if (lower.includes('conference')) return 'conference';

  return 'conference'; // default
}

module.exports = { scrapeGlobalEvents };
