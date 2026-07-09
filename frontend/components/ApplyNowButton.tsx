import { ExternalLink } from 'lucide-react';
import { Event, PLATFORM_LABELS } from '@/lib/api';

interface ApplyNowButtonProps {
  event: Pick<Event, 'url' | 'officialWebsite' | 'registrationLinks'>;
  className?: string;
}

/**
 * The one prominent "Apply Now" button every event page must have.
 * Always opens the organizer's official registration page directly in a new
 * tab — never an intermediate page, never a fake in-app form.
 *
 * Priority: highest-confidence discovered registration link -> officialWebsite
 * -> the original scraped event.url. Renders nothing if none of those exist.
 */
export function ApplyNowButton({ event, className = '' }: ApplyNowButtonProps) {
  const activeLinks = (event.registrationLinks ?? []).filter((l) => l.status !== 'broken');
  const primary =
    activeLinks.find((l) => l.isPrimary) ??
    [...activeLinks].sort((a, b) => b.confidence - a.confidence)[0];

  const targetUrl = primary?.url ?? event.officialWebsite ?? event.url;
  if (!targetUrl) return null;

  const platformLabel = primary ? PLATFORM_LABELS[primary.platform] ?? primary.platform : null;

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all ${className}`}
      aria-label={platformLabel ? `Apply Now via ${platformLabel}` : 'Apply Now'}
    >
      <ExternalLink className="w-4 h-4" aria-hidden />
      Apply Now{platformLabel ? ` · ${platformLabel}` : ''}
    </a>
  );
}
