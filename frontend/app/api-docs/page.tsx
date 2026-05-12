import Navbar from '@/components/Navbar';
import { Code, Terminal, Zap, Shield } from 'lucide-react';

const endpoints = [
  {
    method: 'GET',
    path: '/api/events',
    summary: 'List events',
    description: 'Returns a paginated list of AI events. Supports filtering by region, type, date, quality, and text search.',
    params: [
      { name: 'region', type: 'string', desc: 'worldwide | middle-east | africa | europe | asia | americas' },
      { name: 'type', type: 'string', desc: 'conference | workshop | webinar | meetup | summit | hackathon | course' },
      { name: 'minDate', type: 'ISO date', desc: 'Filter events on or after this date' },
      { name: 'maxDate', type: 'ISO date', desc: 'Filter events on or before this date' },
      { name: 'minQuality', type: 'number 0–1', desc: 'Minimum quality score (default: 0)' },
      { name: 'search', type: 'string', desc: 'Full-text search across title, description, location' },
      { name: 'isOnline', type: 'boolean', desc: 'Filter online-only events' },
      { name: 'sort', type: 'string', desc: 'date | quality | relevance' },
      { name: 'page', type: 'number', desc: 'Page number (default: 1)' },
      { name: 'limit', type: 'number', desc: 'Results per page (max 100, default 20)' },
    ],
    example: `GET /api/events?region=europe&type=conference&minQuality=0.8&page=1`,
    response: `{
  "events": [
    {
      "id": "clxyz123",
      "title": "ICML 2025",
      "date": "2025-07-13T00:00:00.000Z",
      "location": "Vienna, Austria",
      "isOnline": false,
      "region": "europe",
      "category": "conference",
      "qualityScore": 0.92,
      "source": "icml.cc",
      "url": "https://icml.cc/Conferences/2025"
    }
  ],
  "total": 42,
  "page": 1,
  "totalPages": 3
}`,
  },
  {
    method: 'GET',
    path: '/api/events/:id',
    summary: 'Get event',
    description: 'Returns full details for a single event by its ID.',
    params: [],
    example: `GET /api/events/clxyz123`,
    response: `{
  "id": "clxyz123",
  "title": "ICML 2025",
  "description": "International Conference on Machine Learning...",
  "date": "2025-07-13T00:00:00.000Z",
  "endDate": "2025-07-19T00:00:00.000Z",
  "location": "Vienna, Austria",
  "isOnline": false,
  "url": "https://icml.cc/Conferences/2025",
  "source": "icml.cc",
  "region": "europe",
  "regionArabic": "أوروبا",
  "category": "conference",
  "qualityScore": 0.92,
  "scrapedAt": "2025-06-01T12:00:00.000Z"
}`,
  },
  {
    method: 'GET',
    path: '/api/stats',
    summary: 'Get stats',
    description: 'Returns aggregate statistics about the events dataset.',
    params: [],
    example: `GET /api/stats`,
    response: `{
  "totalEvents": 1250,
  "byRegion": { "europe": 320, "americas": 280, "asia": 210 },
  "byCategory": { "conference": 450, "workshop": 180 },
  "avgQuality": 0.81,
  "lastUpdated": "2025-06-01T12:00:00.000Z"
}`,
  },
  {
    method: 'GET',
    path: '/api/events/regions',
    summary: 'List regions',
    description: 'Returns all regions with event counts.',
    params: [],
    example: `GET /api/events/regions`,
    response: `[
  { "region": "europe", "count": 320 },
  { "region": "americas", "count": 280 },
  { "region": "asia", "count": 210 }
]`,
  },
  {
    method: 'POST',
    path: '/api/scrape/trigger',
    summary: 'Trigger scrape',
    description: 'Triggers a new Apify actor run. Requires a valid API key in the x-api-key header.',
    params: [
      { name: 'regions', type: 'string[]', desc: 'Array of regions to scrape' },
      { name: 'maxResults', type: 'number', desc: 'Maximum events to collect (default: 500)' },
    ],
    example: `POST /api/scrape/trigger
x-api-key: your_api_key

{
  "regions": ["europe", "americas"],
  "maxResults": 1000
}`,
    response: `{
  "runId": "abc123xyz",
  "estimatedDuration": 180,
  "message": "Scrape started! Check back in a few minutes."
}`,
  },
  {
    method: 'GET',
    path: '/api/health',
    summary: 'Health check',
    description: 'Returns API health status, uptime, and version.',
    params: [],
    example: `GET /api/health`,
    response: `{
  "status": "ok",
  "uptime": 3600,
  "version": "1.0.0",
  "timestamp": "2025-06-01T12:00:00.000Z"
}`,
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
  POST: 'bg-blue-900/40 text-blue-400 border-blue-800',
};

export default function ApiDocsPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-10">
        <header className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-foreground">API Reference</h1>
          <p className="text-muted-foreground">
            REST API for querying AI events. Base URL:{' '}
            <code className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono">
              https://ai-festivals-platform.onrender.com
            </code>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: 'Fast responses', desc: 'Cached results under 50ms for most queries' },
              { icon: Shield, title: 'Rate limited', desc: '100 requests per minute per IP address' },
              { icon: Code, title: 'JSON responses', desc: 'All endpoints return JSON with proper status codes' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card rounded-xl p-4 flex gap-3">
                <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </header>

        <section aria-label="API endpoints" className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" aria-hidden />
            Endpoints
          </h2>

          {endpoints.map((ep) => (
            <div key={ep.path} className="glass-card rounded-xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${METHOD_COLORS[ep.method]}`}
                >
                  {ep.method}
                </span>
                <code className="font-mono text-sm text-foreground">{ep.path}</code>
                <span className="text-sm text-muted-foreground ml-1">— {ep.summary}</span>
              </div>

              <div className="px-6 py-4 flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">{ep.description}</p>

                {ep.params.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Query parameters
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-muted-foreground border-b border-border">
                            <th className="pb-2 pr-4 font-medium">Name</th>
                            <th className="pb-2 pr-4 font-medium">Type</th>
                            <th className="pb-2 font-medium">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ep.params.map((p) => (
                            <tr key={p.name} className="border-b border-border/50">
                              <td className="py-2 pr-4">
                                <code className="font-mono text-primary">{p.name}</code>
                              </td>
                              <td className="py-2 pr-4 text-muted-foreground font-mono">{p.type}</td>
                              <td className="py-2 text-muted-foreground">{p.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Request
                    </h3>
                    <pre className="bg-black/30 rounded-lg p-3 text-xs font-mono text-foreground overflow-x-auto leading-relaxed">
                      {ep.example}
                    </pre>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Response
                    </h3>
                    <pre className="bg-black/30 rounded-lg p-3 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed">
                      {ep.response}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Rate limits */}
        <section className="glass-card rounded-xl p-6 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Rate limits</h2>
          <p className="text-sm text-muted-foreground">
            Free tier: 100 requests per minute per IP. Rate limit headers are returned on every response:
          </p>
          <pre className="bg-black/30 rounded-lg p-3 text-xs font-mono text-muted-foreground overflow-x-auto">
{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1717249200`}
          </pre>
        </section>
      </main>
    </>
  );
}
