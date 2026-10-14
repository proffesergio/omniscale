const escapeIcs = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
const stamp = (date: string) =>
  new Date(date)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
export function calendarEvent(booking: { id: string; starts_at: string; ends_at: string }) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OmniScale//Discovery//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@omniscale`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(booking.starts_at)}`,
    `DTEND:${stamp(booking.ends_at)}`,
    `SUMMARY:${escapeIcs('OmniScale — Growth discovery call')}`,
    `DESCRIPTION:${escapeIcs('A 30-minute conversation about your growth goals. The OmniScale team will share meeting details separately.')}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
export function downloadCalendar(booking: { id: string; starts_at: string; ends_at: string }) {
  const url = URL.createObjectURL(
    new Blob([calendarEvent(booking)], { type: 'text/calendar;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'omniscale-discovery.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
