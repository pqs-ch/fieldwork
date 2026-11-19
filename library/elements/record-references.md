# Record references

Assets: [ui.css](../assets/fieldwork/ui.css).

## Default markup

```html
<section class="record-reference" aria-labelledby="source-title">
  <header class="record-reference-header">
    <div class="record-reference-identity">
      <p class="record-reference-label">Referenced service · SVC-1042</p>
      <h2 class="record-reference-title" id="source-title">Document storage</h2>
      <p class="record-reference-meta">Current record</p>
    </div>
    <a class="record-reference-link" href="/services/1042"
       aria-label="Open record: Document storage">Open record</a>
  </header>
  <div class="record-reference-body">
    <dl class="description-list" data-density="compact">
      <div><dt>Owner</dt><dd>Alex Morgan</dd></div>
      <div><dt>Contract owner</dt><dd>Not assigned</dd></div>
    </dl>
  </div>
</section>
<!-- The task's form is a separate sibling, with its own heading and actions. -->
```

## Behavior and variations

Use to quote read-only record context for another task. Keep the task's inputs and Save/Cancel actions outside the reference; only explicit source links are interactive.

- Identify the source and whether values are current, captured, or last available. A “Current record” label does not promise live refresh.
- For snapshots, identify the revision/capture context in `.record-reference-meta` and link to that captured version. Label any separate current-record link explicitly.
- Reuse [description lists](description-lists.md) or [formatted content](formatted-content.md) in the body. Keep meaningful missing values visible.
- Preserve drafts when following source links. Label links that open a new tab.
- If the source becomes unavailable, retain its known identity and explain unavailability rather than showing an empty record.

Use [structured record comparison](record-comparison.md) when the task needs to see differences between captured, current or proposed facts.

Applications own lookup, authorization, sanitization, snapshot storage, freshness, and concurrency checks. A displayed version label is not a saved assessment reference or concurrency token.
