'use client';

import Link from 'next/link';
import { MapPin, Globe, Clock, ExternalLink } from 'lucide-react';
import { Event, REGISTRATION_STATUS_LABELS, PLATFORM_LABELS } from '@/lib/api';
import { ApplyNowButton } from './ApplyNowButton';
import { CATEGORY_LABELS, REGION_FLAGS } from '@/lib/utils';

interface RegistrationCardProps {
  event: Event;
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  opening_soon: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  closing_soon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  closed: 'bg-secondary text-muted-foreground',
};

function daysRemaining(closesAt: string | null): number | null {
  if (!closesAt) return null;
  const ms = new Date(closesAt).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

function formatCost(event: Event): string {
  if (event.isFree) return 'Free';
  if (event.participationCost != null) {
    return `${event.participationCost}${event.currency ? ` ${event.currency}` : ''}`;
  }
  return 'Not specified';
}

export function RegistrationCard({ event }: RegistrationCardProps) {
  const closesAt = event.registrationClosesAt ?? event.submissionDeadline ?? event.cfpDeadline;
  const remaining = daysRemaining(closesAt);
  const status = event.registrationStatus ?? 'unknown';
  const platforms = (event.registrationLinks ?? []).filter((l) => l.status !== 'broken');

  return (
    <div className="glass-card rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES['closed']}`}>
          {REGISTRATION_STATUS_LABELS[status] ?? status}
        </span>
        {remaining !== null && remaining >= 0 && (status === 'open' || status === 'closing_soon') && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" aria-hidden />
            {remaining === 0 ? 'Last day' : `${remaining} day${remaining === 1 ? '' : 's'} left`}
          </span>
        )}
      </div>

      <Link href={`/events/${event.id}`} className="font-semibold text-sm leading-snug hover:text-primary transition-colors">
        {event.title}
      </Link>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          {event.isOnline ? <Globe className="w-3.5 h-3.5" aria-hidden /> : <MapPin className="w-3.5 h-3.5" aria-hidden />}
          {event.isOnline ? 'Online' : (event.location ?? 'TBD')}
        </span>
        <span>{REGION_FLAGS[event.region] ?? '🌐'} {CATEGORY_LABELS[event.category] ?? event.category}</span>
        <span>{formatCost(event)}</span>
      </div>

      {platforms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {platforms.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              {PLATFORM_LABELS[link.platform] ?? link.platform}
              <ExternalLink className="w-2.5 h-2.5" aria-hidden />
            </a>
          ))}
        </div>
      )}

      {closesAt && (
        <p className="text-xs text-muted-foreground">
          Deadline: {new Date(closesAt).toLocaleDateString()}
        </p>
      )}

      <div className="mt-auto pt-2 border-t border-border flex items-center gap-2">
        <ApplyNowButton event={event} className="flex-1 justify-center" />
      </div>
    </div>
  );
}
