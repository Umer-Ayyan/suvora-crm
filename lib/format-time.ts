/**
 * Shared time/date formatting utilities — all in 12-hour format (PKT locale)
 */

const LOCALE = "en-PK";

/** "Jan 5, 2024" */
export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(LOCALE, { year: "numeric", month: "short", day: "numeric" });
}

/** "5:30 PM" */
export function fmtTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit", hour12: true });
}

/** "Jan 5, 5:30 PM" */
export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString(LOCALE, {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

/** "Jan 5" (no year) */
export function fmtShortDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(LOCALE, { month: "short", day: "numeric" });
}
