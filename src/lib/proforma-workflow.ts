/**
 * Single source of truth for the proforma lifecycle.
 *
 * Used by the API routes to validate transitions server-side and by the UI to
 * decide which actions to offer, so the two can never disagree.
 *
 *   DRAFT ──send email──▶ SENT ──confirm──▶ CONFIRMED ──convert──▶ CONVERTED (terminal)
 *     └──────────────── CANCELLED ◀────────────────┘
 *
 * CONVERTED is deliberately terminal and can only ever be set by the conversion
 * endpoint — never by a manual status change — so a tax invoice can't be
 * orphaned by someone editing the proforma back to an earlier state.
 */

export type ProformaStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'CONVERTED' | 'CANCELLED';

export const PROFORMA_STATUSES: ProformaStatus[] = ['DRAFT', 'SENT', 'CONFIRMED', 'CONVERTED', 'CANCELLED'];

/** Transitions a user may perform via a manual status change. */
const MANUAL_TRANSITIONS: Record<ProformaStatus, ProformaStatus[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['CONFIRMED', 'DRAFT', 'CANCELLED'],
  CONFIRMED: ['SENT', 'CANCELLED'],
  // Terminal: a converted proforma is locked to protect the issued tax invoice.
  CONVERTED: [],
  // A cancelled quote can be reopened for correction.
  CANCELLED: ['DRAFT'],
};

export const STATUS_LABELS: Record<ProformaStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  CONFIRMED: 'Confirmed',
  CONVERTED: 'Converted',
  CANCELLED: 'Cancelled',
};

export function isProformaStatus(value: unknown): value is ProformaStatus {
  return typeof value === 'string' && (PROFORMA_STATUSES as string[]).includes(value);
}

/** Statuses a user may move to from `current` (excludes CONVERTED by design). */
export function allowedNextStatuses(current: ProformaStatus): ProformaStatus[] {
  return MANUAL_TRANSITIONS[current] ?? [];
}

export interface TransitionCheck {
  ok: boolean;
  /** Human-readable reason, safe to surface directly to the user. */
  reason?: string;
}

/**
 * Validates a manual status change. `CONVERTED` is never allowed here — use the
 * conversion endpoint, which also creates the invoice and deducts stock.
 */
export function canTransition(current: ProformaStatus, next: ProformaStatus): TransitionCheck {
  if (current === next) {
    return { ok: false, reason: `This proforma is already ${STATUS_LABELS[next].toLowerCase()}.` };
  }

  if (next === 'CONVERTED') {
    return {
      ok: false,
      reason: 'A proforma can only become Converted by creating a tax invoice from it.',
    };
  }

  if (current === 'CONVERTED') {
    return {
      ok: false,
      reason: 'This proforma has been converted to a tax invoice and can no longer change status.',
    };
  }

  if (!allowedNextStatuses(current).includes(next)) {
    return {
      ok: false,
      reason: `Cannot move a ${STATUS_LABELS[current].toLowerCase()} proforma to ${STATUS_LABELS[next].toLowerCase()}.`,
    };
  }

  return { ok: true };
}
