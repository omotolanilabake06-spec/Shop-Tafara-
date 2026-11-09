// Production time is promised in working days: Monday to Friday, excluding Nigerian public holidays.
// Dates are plain "YYYY-MM-DD" strings in Lagos time so a promise never shifts with the server's timezone.

/**
 * Federal public holidays. Islamic holidays move each year and are confirmed by the
 * Federal Government shortly before; update these when the dates are announced.
 */
const PUBLIC_HOLIDAYS = new Set([
  // 2026
  "2026-01-01", "2026-03-20", "2026-03-23", "2026-04-03", "2026-04-06", "2026-05-01",
  "2026-05-27", "2026-05-28", "2026-06-12", "2026-08-26", "2026-10-01", "2026-12-25", "2026-12-28",
  // 2027
  "2027-01-01", "2027-03-10", "2027-03-11", "2027-03-26", "2027-03-29", "2027-05-03",
  "2027-05-17", "2027-05-18", "2027-06-14", "2027-08-16", "2027-10-01", "2027-12-27", "2027-12-28",
]);

const lagos = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" });

/** Calendar date in Lagos for an instant, e.g. "2026-10-23". */
export function lagosDate(at: Date | string = new Date()) {
  return lagos.format(typeof at === "string" ? new Date(at) : at);
}

const toUTC = (day: string) => new Date(`${day}T12:00:00Z`);
const fromUTC = (d: Date) => d.toISOString().slice(0, 10);

export function isWorkingDay(day: string) {
  const weekday = toUTC(day).getUTCDay();
  return weekday !== 0 && weekday !== 6 && !PUBLIC_HOLIDAYS.has(day);
}

/** The date `n` working days after `day`. The day itself never counts. */
export function addWorkingDays(day: string, n: number) {
  const d = toUTC(day);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (isWorkingDay(fromUTC(d))) left--;
  }
  return fromUTC(d);
}

/** Working days after `from` up to and including `to`. Negative when `to` is earlier. */
export function workingDaysBetween(from: string, to: string) {
  if (from === to) return 0;
  const sign = from < to ? 1 : -1;
  const [start, end] = sign === 1 ? [from, to] : [to, from];
  const d = toUTC(start);
  let count = 0;
  while (fromUTC(d) < end) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (isWorkingDay(fromUTC(d))) count++;
  }
  return count * sign;
}

/** Subtracts working days, for building sample data and reports. */
export function subtractWorkingDays(day: string, n: number) {
  const d = toUTC(day);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() - 1);
    if (isWorkingDay(fromUTC(d))) left--;
  }
  return fromUTC(d);
}

const long = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
const short = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });

/** "Friday 30 October" */
export function formatDay(day: string) {
  return long.format(toUTC(day)).replace(",", "");
}

/** "Fri 30 Oct" */
export function formatDayShort(day: string) {
  return short.format(toUTC(day)).replace(",", "");
}

const stamp = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

/** "23 Oct, 2:15 pm" for an ISO instant. */
export function formatStamp(iso: string) {
  return stamp.format(new Date(iso));
}
