// Small display helpers shared across screens.

/** Format an ISO/date-ish string as a short local date; returns '—' for empty. */
export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
