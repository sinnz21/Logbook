// Time handling for API data.
//
// The backend stores UTC and serialises naive ISO strings ("2026-09-18T01:42:00"),
// so a timestamp without an offset is UTC. Everything is shown in clinic time.
export const CLINIC_TZ = 'Asia/Manila';
const CLINIC_UTC_OFFSET = '+08:00'; // the Philippines has no DST

const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/i;

export function parseApiDate(value) {
  if (!value) return null;
  return new Date(HAS_OFFSET.test(value) ? value : `${value}Z`);
}

const formatter = (options, locale = 'en-US') =>
  new Intl.DateTimeFormat(locale, { timeZone: CLINIC_TZ, ...options });

const shortDate = formatter({ month: 'short', day: 'numeric', year: 'numeric' });
const longDate = formatter({ month: 'long', day: 'numeric', year: 'numeric' });
const clockTime = formatter({ hour: 'numeric', minute: '2-digit' });
const weekday = formatter({ weekday: 'short' });
const isoDay = formatter({ year: 'numeric', month: '2-digit', day: '2-digit' }, 'en-CA');

export const formatDate = (d) => shortDate.format(d); // Aug 15, 2026
export const formatLongDate = (d) => longDate.format(d); // August 15, 2026
export const formatTime = (d) => clockTime.format(d); // 9:42 AM
export const weekdayOf = (d) => weekday.format(d); // Mon

/** Clinic calendar day of an instant, as YYYY-MM-DD. */
export const clinicDay = (d) => isoDay.format(d);

/** The instant a clinic calendar day (YYYY-MM-DD) begins. */
export const startOfClinicDay = (day) => new Date(`${day}T00:00:00${CLINIC_UTC_OFFSET}`);

export function addDays(day, n) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Inclusive YYYY-MM-DD bounds for the range-bar presets. Weeks start on Monday. */
export function presetRange(preset, today) {
  if (preset === 'today') return { from: today, to: today };
  if (preset === 'week') {
    const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
    const monday = addDays(today, -((dow + 6) % 7));
    return { from: monday, to: addDays(monday, 6) };
  }
  return { from: `${today.slice(0, 8)}01`, to: today };
}

export function formatDuration(minutes) {
  if (minutes == null) return '';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
