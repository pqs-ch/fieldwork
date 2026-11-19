# Feedback

Assets: [ui.css](../assets/fieldwork/ui.css).

## Default markup

```html
<p class="notice" data-tone="success" role="status">Changes saved.</p>
```

## Behavior and variations

`.notice` supports `data-tone="success"`, `"error"`, and `"warning"`. Explain the meaning in text and include recovery steps where possible. Multi-part notices separate their block children with the shared small gap; use `.cluster` for a row of recovery actions. Static examples do not need live-region roles; dynamically updated feedback should use an appropriate status or alert region.

## Progress

```html
<div class="field">
  <label for="report-progress">Generating report</label>
  <progress id="report-progress" value="3" max="10">3 of 10</progress>
</div>
```

Set `value` and `max` for measurable progress; omit `value` when unknown.

## Loading text

```html
<p role="status"><span class="loading-text">Preparing your export…</span></p>
```

Use `.loading-text` for a short status without a measurable amount. Keep the status region in the DOM, update its text at meaningful milestones, and remove the class when loading ends. Use progress when an amount is known; avoid multiple animated indicators for the same work.

Override `--loading-text-base` and `--loading-text-highlight` for theme colors, keeping text legible. Reduced motion and forced colors retain readable text. Applications own completion, failure, and recovery. For work that needs persistent status and recovery, use the [long-running actions pattern](../patterns/long-running-actions.md).
