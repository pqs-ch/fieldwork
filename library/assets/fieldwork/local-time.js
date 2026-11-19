// Keep absolute instants in datetime; display them in the viewer's locale/time zone.
// Calendar dates (due dates, birthdays, etc.) must not shift across time zones.
export function localizeTimestamps(root = document) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    hourCycle: 'h23',
  });
  const times = [...root.querySelectorAll('time[datetime]')];
  if (root.matches?.('time[datetime]')) times.unshift(root);
  for (const time of times) {
    const value = time.getAttribute('datetime');
    if (!/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) continue;
    const instant = new Date(value);
    if (Number.isFinite(instant.getTime())) time.textContent = formatter.format(instant);
  }
}
