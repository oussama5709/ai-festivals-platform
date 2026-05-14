const FESTIVAL_COLORS: Record<string, string> = {
  'ai':           'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  'cinema':       'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-300',
  'photo':        'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-300',
  'video':        'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300',
  'mixed-image':  'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-300',
  'hackathon':    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

const FESTIVAL_EMOJI: Record<string, string> = {
  'ai':          '🤖',
  'cinema':      '🎬',
  'photo':       '📸',
  'video':       '🎥',
  'mixed-image': '🎭',
  'hackathon':   '💻',
};

interface CompetitionEvent {
  id: string;
  title: string;
  category: string;
  date: string | null;
  location: string | null;
  isOnline: boolean;
  isCompetition?: boolean;
  prize?: string | null;
  eligibility?: string | null;
  howToApply?: string | null;
  submissionDeadline?: string | null;
  competitionStatus?: string | null;
  hasCfp?: boolean;
  cfpDeadline?: string | null;
  cfpUrl?: string | null;
  isTunisia?: boolean;
  festivalType?: string | null;
  governorate?: string | null;
  isFilmCompetition?: boolean;
  filmFreewayUrl?: string | null;
  qualityScore: number;
  url?: string | null;
}

interface CompetitionCardProps {
  event: CompetitionEvent;
}

export function CompetitionCard({ event }: CompetitionCardProps) {
  const isOpen = event.competitionStatus === 'open';
  const isUpcoming = event.competitionStatus === 'upcoming';

  const daysLeft =
    event.submissionDeadline
      ? Math.ceil((new Date(event.submissionDeadline).getTime() - Date.now()) / 86_400_000)
      : null;

  const statusColor = isOpen
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    : isUpcoming
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    : 'bg-muted text-muted-foreground';

  const statusLabel = isOpen ? '🟢 Open' : isUpcoming ? '🔵 Upcoming' : '🔴 Closed';

  const festivalColor = event.festivalType
    ? FESTIVAL_COLORS[event.festivalType] ?? 'bg-secondary text-muted-foreground'
    : null;
  const festivalEmoji = event.festivalType ? FESTIVAL_EMOJI[event.festivalType] : null;

  return (
    <div className="group relative flex flex-col p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200">
      {/* Animated green dot for open events */}
      {isOpen && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3" aria-label="Open now">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 ring-2 ring-background" />
        </span>
      )}

      {/* Top badges */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {event.isTunisia && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium">
              🇹🇳 Tunisia
            </span>
          )}
          {festivalColor && festivalEmoji && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${festivalColor}`}>
              {festivalEmoji} {event.festivalType}
            </span>
          )}
          {(event.competitionStatus || event.isCompetition) && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
              {statusLabel}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
            {event.isOnline ? '🌐 Online' : '📍 In-person'}
          </span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{event.qualityScore.toFixed(2)}</span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-base mb-3 group-hover:text-primary transition-colors line-clamp-2">
        {event.url ? (
          <a href={event.url} target="_blank" rel="noopener noreferrer">{event.title}</a>
        ) : (
          event.title
        )}
      </h3>

      {/* Prize */}
      {event.prize && (
        <div className="flex items-start gap-2 mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <span className="text-lg leading-none">🏆</span>
          <div>
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Prize</p>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{event.prize}</p>
          </div>
        </div>
      )}

      {/* Submission deadline */}
      {daysLeft !== null && daysLeft > 0 && (
        <div
          className={`flex items-center gap-2 mb-2 text-sm ${
            daysLeft < 7
              ? 'text-red-600 dark:text-red-400'
              : daysLeft < 30
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-muted-foreground'
          }`}
        >
          <span>⏰</span>
          <span>
            {daysLeft < 7
              ? `⚠️ Only ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left!`
              : `Deadline: ${new Date(event.submissionDeadline!).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}`}
          </span>
        </div>
      )}
      {daysLeft !== null && daysLeft <= 0 && (
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground line-through">
          <span>⏰</span>
          <span>
            Deadline passed:{' '}
            {new Date(event.submissionDeadline!).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      )}

      {/* Eligibility */}
      {event.eligibility && (
        <div className="flex items-start gap-2 mb-2 text-sm text-muted-foreground">
          <span>👥</span>
          <span className="line-clamp-1">{event.eligibility}</span>
        </div>
      )}

      {/* CFP badge */}
      {event.hasCfp && (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
            📝 Call for Papers open
          </span>
          {event.cfpDeadline && (
            <span className="text-xs text-muted-foreground">
              until{' '}
              {new Date(event.cfpDeadline).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
      )}

      {/* Governorate */}
      {event.governorate && (
        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
          <span>🏛</span>
          <span>{event.governorate}</span>
        </div>
      )}

      {/* Location & Date */}
      <div className="mt-auto pt-3 border-t border-border/60 flex flex-col gap-1.5">
        {event.date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>📅</span>
            <span>
              {new Date(event.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>📍</span>
          <span className="truncate">{event.isOnline ? 'Online' : (event.location ?? 'TBA')}</span>
        </div>
      </div>

      {/* FilmFreeway submit button */}
      {isOpen && (event.isFilmCompetition || event.filmFreewayUrl || event.howToApply?.includes('filmfreeway')) && (
        <a
          href={event.filmFreewayUrl ?? event.howToApply ?? `https://filmfreeway.com/search?q=${encodeURIComponent(event.title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
          قدّم فيلمك على FilmFreeway ↗
        </a>
      )}

      {/* Regular apply button */}
      {isOpen && event.howToApply && !event.isFilmCompetition && !event.filmFreewayUrl && !event.howToApply.includes('filmfreeway') && (
        <a
          href={event.howToApply}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 w-full text-center py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          سجّل توّه ←
        </a>
      )}
      {event.cfpUrl && event.hasCfp && (
        <a
          href={event.cfpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 w-full text-center py-2 rounded-xl border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
        >
          Submit paper →
        </a>
      )}
    </div>
  );
}
