# Local timestamps

Assets: [ui.css](../assets/fieldwork/ui.css) · [local-time.js](../assets/fieldwork/local-time.js).

## Default markup

```html
<time datetime="2026-10-17T14:30:00Z">17 Oct 2026, 14:30 UTC</time>
```

## Initialization and cleanup

```js
import { localizeTimestamps } from 'fieldwork/local-time';
localizeTimestamps(); // Document, or pass an inserted/replaced container.
```

Call again for inserted/replaced timestamps. The function also accepts one `time` element; it installs no listeners or controller.

## Behavior and variations

Display instants in the viewer's local time with a 24-hour clock. Preserve `Z` or an explicit offset in `datetime`. The formatter uses the browser's locale/time zone and leaves calendar dates, invalid values, and timezone-less values unchanged.

Server-rendered fallback text should use the user's known local zone with an explicit zone label. If it is unknown, show the actual UTC date/time with a UTC label, as above, so the timestamp remains useful without JavaScript. Use an unavailable message only when the instant itself is unknown. `enhanceContentRevisions` formats its root automatically before selecting a revision.

For entering or confirming a local time with a named zone, follow [dates, times and timezones](date-and-time.md). Scope this formatter to timestamps intended for viewer-local display; keep explicitly zoned/UTC confirmation values outside that scope so their visible labels remain accurate.
