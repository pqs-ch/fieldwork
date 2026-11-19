# Pattern: long-running actions

Assets: [ui.css](../assets/fieldwork/ui.css).

For operations initiated from selected records, compose this with the [bulk-action pattern](bulk-actions.md).

## Default markup

```html
<section class="operation" aria-labelledby="export-title">
  <header class="operation-header">
    <div class="stack" data-gap="tight">
      <h3 id="export-title">Export reports</h3>
      <p class="hint">6 projects · Selection at request time</p>
    </div>
    <span class="operation-state" data-tone="warning">Needs attention</span>
  </header>
  <p role="status" aria-atomic="true">4 reports ready. 2 could not be generated.</p>
  <dl class="operation-counts">
    <div><dt>Ready</dt><dd>4</dd></div>
    <div><dt>Unsuccessful</dt><dd>2</dd></div>
  </dl>
  <form action="/exports/operation-reference/retry" method="post" class="cluster">
    <!-- Include the application's CSRF protection. The server resolves the
         unsuccessful subset from this authorized operation reference. -->
    <button class="button" data-intent="primary">Retry 2 reports</button>
    <a class="button" href="/exports/operation-reference/results">View 4 ready reports</a>
  </form>
</section>
```

## Behavior and variations

Use `.operation` for persistent status beyond a button's pending state, near the task or at a stable status URL. Applications own execution, transport, persistence, and cancellation.

| Part | Use |
| --- | --- |
| `.operation-header` | Operation name and captured scope. |
| `.operation-state` | Explicit state; optional `data-tone` of `success`, `warning`, or `error`. |
| `.operation-counts` | Confirmed outcomes, using task-specific labels. |

### State and recovery

- Capture the requested scope; later filter/selection changes must not change it. All-matching scope uses a validated query reference and exclusions.
- Distinguish requesting, queued, running, complete, partial success, and failure. Label [progress](../elements/feedback.md#progress) with a confirmed denominator, or omit `value` when unknown.
- Preserve successful results. Retry only the server-confirmed retryable subset of that operation, never the current selection or acknowledged successes. Bound failure-detail lists.
- Reconcile unknown outcomes through Check status before retrying. Prevent duplicates while acceptance is pending; retain a request/operation reference.
- Offer Cancel only when supported. Distinguish cancellation requested from confirmed; stopping polling or leaving is not server cancellation.

For client updates, keep a small live status region outside busy content. Preserve focus during background updates. If an explicit recovery action disappears while focused, move focus to the operation heading (`tabindex="-1"`) or another useful destination.

If work continues after navigation, provide a stable status destination and restore authoritative state on return. Cleanup stops client listeners/polling and ignores stale responses.

For uploaded records, follow [file imports](file-imports.md) to bind source/mapping review to the operation and distinguish invalid source rows from retryable execution failures.
