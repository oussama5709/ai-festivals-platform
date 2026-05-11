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

export const SOURCE_COLORS: Record<string, string> = {
  'eventbrite.com': 'bg-orange-100 text-orange-700',
  'meetup.com': 'bg-red-100 text-red-700',
  'neurips.cc': 'bg-purple-100 text-purple-700',
  'icml.cc': 'bg-blue-100 text-blue-700',
  'thecvf.com': 'bg-indigo-100 text-indigo-700',
  default: 'bg-gray-100 text-gray-600',
};
