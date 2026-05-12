import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date TBD';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function qualityColor(score: number): string {
  if (score >= 0.8) return 'bg-emerald-500';
  if (score >= 0.6) return 'bg-amber-500';
  return 'bg-red-500';
}

export function qualityLabel(score: number): string {
  if (score >= 0.8) return 'High quality';
  if (score >= 0.6) return 'Medium quality';
  return 'Low quality';
}

export const REGION_FLAGS: Record<string, string> = {
  worldwide: '🌎',
  'middle-east': '🏜️',
  africa: '🌍',
  europe: '🇪🇺',
  asia: '🏯',
  americas: '🗽',
};

export const REGION_LABELS: Record<string, string> = {
  worldwide: 'Worldwide',
  'middle-east': 'Middle East',
  africa: 'Africa',
  europe: 'Europe',
  asia: 'Asia',
  americas: 'Americas',
};

export const CATEGORY_LABELS: Record<string, string> = {
  conference: 'Conference',
  workshop: 'Workshop',
  webinar: 'Webinar',
  meetup: 'Meetup',
  summit: 'Summit',
  hackathon: 'Hackathon',
  course: 'Course',
};

export const CATEGORY_COLORS: Record<string, string> = {
  conference: 'bg-violet-900/40 text-violet-300 border border-violet-800/50',
  workshop: 'bg-blue-900/40 text-blue-300 border border-blue-800/50',
  webinar: 'bg-sky-900/40 text-sky-300 border border-sky-800/50',
  meetup: 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50',
  summit: 'bg-amber-900/40 text-amber-300 border border-amber-800/50',
  hackathon: 'bg-rose-900/40 text-rose-300 border border-rose-800/50',
  course: 'bg-teal-900/40 text-teal-300 border border-teal-800/50',
  default: 'bg-secondary text-secondary-foreground',
};

export const SOURCE_COLORS: Record<string, string> = {
  'eventbrite.com': 'bg-orange-900/40 text-orange-300 border border-orange-800/50',
  'meetup.com': 'bg-red-900/40 text-red-300 border border-red-800/50',
  'neurips.cc': 'bg-purple-900/40 text-purple-300 border border-purple-800/50',
  'icml.cc': 'bg-blue-900/40 text-blue-300 border border-blue-800/50',
  'thecvf.com': 'bg-indigo-900/40 text-indigo-300 border border-indigo-800/50',
  default: 'bg-secondary text-muted-foreground border border-border',
};
