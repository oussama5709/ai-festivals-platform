// Smart registration status computation.
// Pure, no I/O — safe to call on every API read (not just at crawl time), so
// time-based transitions like "closing_soon" stay accurate between crawls.

export type RegistrationStatus =
  | 'open'
  | 'opening_soon'
  | 'closing_soon'
  | 'closed'
  | 'cancelled'
  | 'waiting_list'
  | 'invitation_only'
  | 'unknown';

const CLOSING_SOON_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;  // 7 days
const OPENING_SOON_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface StatusInput {
  opensAt?: Date | null;
  closesAt?: Date | null;
  cancelled?: boolean;
  waitingList?: boolean;
  invitationOnly?: boolean;
}

export function computeRegistrationStatus(
  input: StatusInput,
  now: Date = new Date()
): RegistrationStatus {
  if (input.cancelled) return 'cancelled';
  if (input.invitationOnly) return 'invitation_only';
  if (input.waitingList) return 'waiting_list';

  const opens = input.opensAt ? new Date(input.opensAt) : null;
  const closes = input.closesAt ? new Date(input.closesAt) : null;

  if (closes && closes.getTime() < now.getTime()) return 'closed';

  if (opens && opens.getTime() > now.getTime()) {
    return opens.getTime() - now.getTime() <= OPENING_SOON_WINDOW_MS ? 'opening_soon' : 'unknown';
  }

  if (closes && closes.getTime() - now.getTime() <= CLOSING_SOON_WINDOW_MS) {
    return 'closing_soon';
  }

  // Confidently "open" only if we actually know at least one boundary date —
  // otherwise we'd be claiming registration is open with zero evidence.
  if (opens || closes) return 'open';

  return 'unknown';
}

// Registration dates can come from the new discovery engine (registrationOpensAt/
// registrationClosesAt) or from the pre-existing structured fields
// (submissionDeadline for competitions, cfpDeadline for calls for papers).
// Explicit registration dates win when present.
export function resolveEffectiveDates(event: {
  registrationOpensAt?: Date | null;
  registrationClosesAt?: Date | null;
  submissionDeadline?: Date | null;
  cfpDeadline?: Date | null;
}): { opensAt: Date | null; closesAt: Date | null } {
  const closesAt =
    event.registrationClosesAt ??
    event.submissionDeadline ??
    event.cfpDeadline ??
    null;
  const opensAt = event.registrationOpensAt ?? null;
  return { opensAt, closesAt };
}
