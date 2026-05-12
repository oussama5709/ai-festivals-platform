'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Globe, Calendar, ExternalLink } from 'lucide-react';
import { Event } from '@/lib/api';
import {
  cn,
  formatDate,
  qualityColor,
  qualityLabel,
  REGION_FLAGS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  SOURCE_COLORS,
} from '@/lib/utils';

interface EventCardProps {
  event: Event;
  index?: number;
}

export default function EventCard({ event, index = 0 }: EventCardProps) {
  const sourceColor =
    SOURCE_COLORS[event.source as keyof typeof SOURCE_COLORS] ?? SOURCE_COLORS['default'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="glass-card rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.01]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
              sourceColor
            )}
          >
            {event.source}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS['default']
            )}
          >
            {CATEGORY_LABELS[event.category] ?? event.category}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            title={`${qualityLabel(event.qualityScore)} (${event.qualityScore.toFixed(2)})`}
            className={cn('w-2.5 h-2.5 rounded-full', qualityColor(event.qualityScore))}
            aria-label={qualityLabel(event.qualityScore)}
          />
          <span className="text-xs text-muted-foreground tabular-nums">
            {event.qualityScore.toFixed(2)}
          </span>
        </div>
      </div>

      <h3 className="font-semibold text-foreground leading-snug line-clamp-2 text-sm">
        {event.title}
      </h3>

      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        {event.date && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden />
            <span>{formatDate(event.date)}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {event.isOnline ? (
            <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden />
          ) : (
            <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
          )}
          <span className="truncate">{event.isOnline ? 'Online' : (event.location ?? 'Location TBD')}</span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between pt-2 border-t border-border">
        <span className="text-base" aria-label={`Region: ${event.region}`}>
          {REGION_FLAGS[event.region] ?? '🌐'}
        </span>
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          aria-label={`View details for ${event.title}`}
        >
          View details
          <ExternalLink className="w-3 h-3" aria-hidden />
        </Link>
      </div>
    </motion.div>
  );
}
