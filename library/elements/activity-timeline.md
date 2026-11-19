# Activity timeline

<a id="activity"></a>

Assets: [ui.css](../assets/fieldwork/ui.css) · optional [local-time.js](../assets/fieldwork/local-time.js).

Follow the [record-detail pattern](../patterns/record-details.md#history) for composing activity with current information and past versions. This element owns timeline presentation and continuation behavior.

## Default markup

```html
<section class="stack" aria-labelledby="activity-title">
  <h2 id="activity-title">Activity</h2>
  <ol class="change-history" role="list" aria-label="Record activity, newest first">
    <li>
      <p>Alex Morgan updated <strong>Status</strong> to <strong>In progress</strong>.</p>
      <p class="change-meta"><time datetime="2026-10-17T14:30:00Z">17 Oct 2026, 14:30 UTC</time></p>
    </li>
  </ol>
</section>
```

## Usage

- Order entries newest first and keep them flat; render only recorded events.
- Each entry names actor, action, subject, and timestamp. The timeline separates description blocks within an entry; `.change-meta` stays closer to the preceding content. Attribute changes show one field and its new value; preserve zero/false values and state unknown actors/dates honestly.
- Use [local timestamps](local-timestamps.md). Link only to available, permitted subjects; deleted subjects remain text. [Content revisions](content-revisions.md) hold complete past text; Activity can link to an exact version while preserving current drafts.
- When empty, show **No activity yet**. Show useful history directly or link to a dedicated history page.

## Long activity

Render a bounded recent set. Use this optional continuation footer for earlier events; keep unloaded entries out of the DOM so connectors end at the displayed events:

<!-- fieldwork:fragment -->

```html
<footer class="panel-footer">
  <div class="activity-continuation">
    <div class="cluster">
      <a class="button" href="/records/123/activity?before=older-cursor"
        aria-describedby="activity-load-status">Show earlier activity</a>
      <p class="hint">Showing 4 events</p>
    </div>
    <p class="hint" id="activity-load-status" role="status" aria-atomic="true">
      Earlier activity is available.
    </p>
  </div>
</footer>
```

The application supplies the destination and optional count. Native page navigation works without a loading controller. For in-place loading:

While loading, retain entries, announce progress outside busy regions, and prevent duplicate requests. `aria-disabled` requires application activation blocking.

On failure, retain entries/cursor and offer Retry for the same range without skipping or duplicating events.

On success, append older events in newest-first order and announce the number added. Preserve viewport and drafts. If focus remains on the opener, focus a new-entry target with `tabindex="-1"` and `focus({ preventScroll: true })`; otherwise leave focus alone.

Remove the action only after the source confirms no earlier events remain, then show **Beginning of activity**. If the removed action held focus, recover it to added content/status. A short response alone does not prove completion.

Ignore stale responses after reset, replacement, or navigation; restore a usable action on return. Totals must be known and authorized. Loading must preserve other drafts, filters, and selections.

Applications own event data, permissions, pagination, transport, and lifecycle. Fieldwork supplies presentation, not event storage or a loading controller.
