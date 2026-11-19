# Dates, times and timezones

Assets: [ui.css](../assets/fieldwork/ui.css). Use native inputs and the existing form behavior; Fieldwork does not resolve timezones or calculate deadlines.

## Choose the value's meaning

| Value | Native control and presentation |
| --- | --- |
| Calendar date, such as Review by | `input type="date"`. Store and display a date without inventing midnight, UTC or an end-of-day deadline. |
| Local date and clock time | `input type="datetime-local"` plus an explicit timezone. Resolve the pair in the application before treating it as an instant. |
| An instant | Retain `Z` or an explicit offset in transport/display metadata. Show the relevant named zone or clearly identified viewer-local time. |
| Recording time | Derive from the application's acknowledged recording operation. Keep separate from the entered time of an earlier event. |

Applications choose operating timezones, locale formats, precision, calendars and business rules. Keep those choices visible where they affect the user's result.

For repeated entry, keep local time and timezone together and use concise field guidance. Show clock-change explanations and occurrence choices when they apply. In review, make the entered event time and any derived target easy to compare; keep UTC equivalents secondary and explicitly labeled. Routine entry should not require reading the timezone explanation again.

## Default markup

Use the [form helpers](../rails.md#render-a-form) through [creation](../patterns/creation.md) or [editing](../patterns/editing.md). This native composition illustrates the required meanings and associations:

```html
<form action="/events/review" method="post" class="stack">
  <div class="field">
    <label for="event-local">Event local time</label>
    <input id="event-local" name="local_time" type="datetime-local" step="60"
      required aria-describedby="event-local-hint">
    <p class="hint" id="event-local-hint">Enter the local date and clock time in the timezone below.</p>
  </div>
  <div class="field">
    <label for="event-zone">Event timezone</label>
    <select id="event-zone" name="timezone" required aria-describedby="event-zone-hint">
      <option value="Europe/Zurich">Zürich — Europe/Zurich</option>
      <option value="America/New_York">New York — America/New_York</option>
      <option value="Etc/UTC">UTC — Etc/UTC</option>
    </select>
    <p class="hint" id="event-zone-hint">Changing timezone keeps the entered clock time. Review the resolved instant before recording.</p>
  </div>
  <div class="field">
    <label for="review-date">Review by</label>
    <input id="review-date" name="review_on" type="date" required
      aria-describedby="review-date-hint">
    <p class="hint" id="review-date-hint">A calendar date; no time of day is implied.</p>
  </div>
  <button class="button" type="submit">Review event</button>
</form>
```

The locations and minute precision are illustrative application choices. Use an application-supported timezone set with recognizable labels and stable named identifiers. A current numeric UTC offset alone cannot express a location's rules across dates. Do not silently use the browser or server timezone for a local value.

State what changing a zone does. The default above preserves the entered wall-clock fields and requires another review; an application may instead preserve an already chosen instant, but must make that transformation clear and require review where it changes the intended result.

## Clock changes

Resolve local time against the application's timezone rules before saving. Native input constraints do not establish that a local clock time exists or that it identifies only one instant.

- **Nonexistent time:** retain all entered values, associate the error with the local-time control, explain that the clock skips that time in the selected zone, and ask for a correction. Do not silently move the event forward or backward.
- **Repeated time:** offer the actual candidate occurrences as a native radio group with no default. Identify each by offset and, where helpful, zone abbreviation and UTC instant. A bare First/Second choice or abbreviation is insufficient context.
- **Edited time or zone:** invalidate the earlier occurrence choice and resolve again. Check this on the server as well as in any client enhancement; the same offset value on a different date must not accidentally reuse an old choice.

For example, this application-resolved pair distinguishes the repeated Zürich clock time on 25 October 2026:

```html
<fieldset class="stack" aria-describedby="occurrence-hint">
  <legend>Which occurrence of 25 October 2026, 02:30 in Europe/Zurich?</legend>
  <p class="hint" id="occurrence-hint">Choose the occurrence supported by the event's source.</p>
  <label class="check"><input type="radio" name="occurrence" value="first" required>
    First occurrence · UTC+02:00 (CEST) · 25 October 2026, 00:30 UTC</label>
  <label class="check"><input type="radio" name="occurrence" value="second" required>
    Second occurrence · UTC+01:00 (CET) · 25 October 2026, 01:30 UTC</label>
</fieldset>
```

Applications supply valid candidates and their identities from their timezone data. Never infer a one-hour transition, two candidates, or daylight-saving status from the label alone. Retain the original zone and selected offset where needed to explain a historical event.

## Review an instant and its consequences

Show the entered local date/time with its named zone and resolved offset before committing a consequential operation. A separately labeled UTC equivalent can help users reconcile it with logs. Display non-hour offsets and changes of calendar date without rounding them away.

For derived targets, state the rule: elapsed hours, calendar days and business hours are different calculations. Elapsed durations operate on instants; business-hour/day rules need an application-owned operating calendar and timezone. Show the resulting target and its zone. Recording an old event must not silently shift its original target to the recording time.

Keep a date-only value separate from the derived instant. Do not imply end-of-day timing unless the application has explicitly defined the governing zone and calendar rule.

A review step does not record completion. On confirmation, use the reviewed server-owned values, check that the review is current, and deduplicate acknowledged recording. Failed or stale confirmation retains the draft/reviewed details and offers a precise recovery path. Preserve edited values when resolving time errors or returning from review.

## Display and enhancement

Use `time[datetime]` with an offset/`Z` for instants and a bare ISO date for calendar dates. Identify any explicit presentation zone in visible text. [Local timestamps](local-timestamps.md) can format instants in the viewer's zone; scope that formatter to values intended for viewer-local presentation. Do not run it over explicitly zoned confirmation values or UTC equivalents and then leave their labels unchanged.

Keep native inputs, errors, occurrence choices, review links and recording usable without JavaScript. The library owns shared field/form presentation, not timezone conversion, rule storage or scheduling.

## Date ranges

Group related native date controls with a fieldset/legend and label both ends. State whether endpoints are inclusive, whether equal dates are valid, and which bounds or maximum span apply:

```html
<fieldset class="stack" aria-describedby="delivery-range-hint">
  <legend>Delivery period</legend>
  <p class="hint" id="delivery-range-hint">Inclusive calendar dates, up to 366 days. Start and end may be the same day.</p>
  <div class="field"><label for="delivery-start">Starts on</label><input id="delivery-start" name="starts_on" type="date" required></div>
  <div class="field"><label for="delivery-end">Ends on</label><input id="delivery-end" name="ends_on" type="date" required aria-describedby="delivery-end-error"><p class="field-error" id="delivery-end-error" hidden></p></div>
</fieldset>
```

The 366-day inclusive range is an example business policy. Applications choose whether dates are optional, bounded, business-day based or open ended. Validate each date first, then the relationship. Associate an end-before-start or span error with the affected endpoint, retain both values and focus the useful correction. Never silently swap dates or move an endpoint to repair a range.

Optional client `min`/`max` hints may track the other endpoint; recheck on the server and preserve values that need correction. A range of calendar dates does not become a pair of midnight instants or an inclusive end-of-day timestamp. If the task really uses instant boundaries, define timezone and interval semantics explicitly using the guidance above.

Review both endpoints and any derived duration using the same application policy. The [purchase-request example](../../examples/README.md#purchase-requests-and-business-values) demonstrates linked errors, equal endpoints, inclusive counts and persistence without timezone shifts.
