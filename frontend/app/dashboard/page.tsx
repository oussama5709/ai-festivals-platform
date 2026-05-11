'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { fetchStats, fetchScrapeRuns, triggerScrape, Stats, ScrapeRun } from '@/lib/api';
import { cn, REGION_LABELS, CATEGORY_LABELS } from '@/lib/utils';
import {
  Database, TrendingUp, Globe, Star, Play, CheckCircle,
  XCircle, Clock, AlertCircle, Lock,
} from 'lucide-react';

const CHART_COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2', '#7c3aed'];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  succeeded: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  failed: <XCircle className="w-4 h-4 text-red-500" />,
  running: <Clock className="w-4 h-4 text-amber-500 animate-spin" />,
  pending: <Clock className="w-4 h-4 text-muted-foreground" />,
};

export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [scrapeKey, setScrapeKey] = useState('');
  const [scrapeStatus, setScrapeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [scrapeMsg, setScrapeMsg] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') {
      setAuthed(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect password. Try again.');
    }
  };

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    Promise.allSettled([fetchStats(), fetchScrapeRuns()])
      .then(([s, r]) => {
        if (s.status === 'fulfilled') setStats(s.value);
        if (r.status === 'fulfilled') setRuns(r.value);
      })
      .finally(() => setLoading(false));
  }, [authed]);

  const handleScrape = async () => {
    setScrapeStatus('loading');
    setScrapeMsg('');
    try {
      const res = await triggerScrape(scrapeKey, ['worldwide'], 500);
      setScrapeStatus('success');
      setScrapeMsg(res.message ?? 'Scrape started! Check back in a few minutes.');
    } catch (err) {
      setScrapeStatus('error');
      setScrapeMsg(err instanceof Error ? err.message : 'Failed to trigger scrape. Check your API key.');
    }
  };

  if (!authed) {
    return (
      <>
        <Navbar />
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
          <div className="glass-card rounded-2xl p-8 w-full max-w-sm flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" aria-hidden />
              </div>
              <h1 className="text-xl font-bold text-foreground">Dashboard access</h1>
              <p className="text-sm text-muted-foreground">Enter your admin password to continue.</p>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                className="bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Admin password"
                autoFocus
              />
              {authError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5" role="alert">
                  <AlertCircle className="w-3.5 h-3.5" aria-hidden />
                  {authError}
                </p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Sign in
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  const regionData = stats
    ? Object.entries(stats.byRegion).map(([region, count]) => ({
        name: REGION_LABELS[region] ?? region,
        count,
      }))
    : [];

  const categoryData = stats
    ? Object.entries(stats.byCategory).map(([cat, count]) => ({
        name: CATEGORY_LABELS[cat] ?? cat,
        value: count,
      }))
    : [];

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Analytics dashboard</h1>
          {stats?.lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated {new Date(stats.lastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
        )}

        {/* Stat cards */}
        {!loading && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Database,
                label: 'Total events',
                value: stats.totalEvents.toLocaleString(),
                color: 'text-primary',
              },
              {
                icon: Globe,
                label: 'Top region',
                value: REGION_LABELS[Object.entries(stats.byRegion).sort(([, a], [, b]) => b - a)[0]?.[0] ?? ''] ?? '—',
                color: 'text-blue-400',
              },
              {
                icon: Star,
                label: 'Avg quality score',
                value: stats.avgQuality.toFixed(2),
                color: 'text-amber-400',
              },
              {
                icon: TrendingUp,
                label: 'Event types',
                value: Object.keys(stats.byCategory).length.toString(),
                color: 'text-emerald-400',
              },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="glass-card rounded-xl p-5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <Icon className={cn('w-4 h-4', color)} aria-hidden />
                </div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        {!loading && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-foreground">Events by region</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={regionData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#7c3aed' }}
                  />
                  <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-foreground">Events by category</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend
                    formatter={(value) => <span style={{ color: '#888', fontSize: 11 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Trigger scrape */}
        <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">Trigger new scrape</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1.5 flex-1 min-w-48">
              <label htmlFor="api-key" className="text-xs text-muted-foreground">
                API key
              </label>
              <input
                id="api-key"
                type="password"
                value={scrapeKey}
                onChange={(e) => setScrapeKey(e.target.value)}
                placeholder="Enter your API key"
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              onClick={handleScrape}
              disabled={!scrapeKey || scrapeStatus === 'loading'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Trigger new scrape"
            >
              <Play className="w-4 h-4" aria-hidden />
              {scrapeStatus === 'loading' ? 'Starting your custom scrape...' : 'Run scraper'}
            </button>
          </div>
          {scrapeMsg && (
            <p
              className={cn(
                'text-sm flex items-center gap-1.5',
                scrapeStatus === 'success' ? 'text-emerald-400' : 'text-red-400'
              )}
              role="status"
            >
              {scrapeStatus === 'success'
                ? <CheckCircle className="w-4 h-4" aria-hidden />
                : <AlertCircle className="w-4 h-4" aria-hidden />}
              {scrapeMsg}
            </p>
          )}
        </div>

        {/* Scrape runs table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Recent scrape runs</h2>
          </div>
          {runs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Run your first scrape to start seeing analytics.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Run ID', 'Status', 'Events', 'Regions', 'Started', 'Duration'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {run.apifyRunId.slice(0, 12)}…
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          {STATUS_ICONS[run.status] ?? <Clock className="w-4 h-4" />}
                          <span className="capitalize">{run.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{run.eventsFound}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {run.regions.join(', ')}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(run.startedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {run.durationMs ? `${(run.durationMs / 1000).toFixed(0)}s` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
