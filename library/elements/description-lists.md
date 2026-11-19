# Description lists

Assets: [ui.css](../assets/fieldwork/ui.css).

## Default markup

```html
<dl class="description-list">
  <div><dt>Owner</dt><dd>Alex Morgan</dd></div>
</dl>
```

## Behavior and variations

| Variation | Use |
| --- | --- |
| Default | Vertical summary. |
| `.grid` | Responsive equal-width columns. |
| `data-layout="facts"` | Prominent task-defining facts. |
| `data-density="compact"` | Aligned attribute rows with separators. |

Do not combine compact density with facts or `.grid`. Distinguish missing values such as **Not assigned**, **Not recorded**, and **Not applicable**.

### Primary task summaries

```html
<section class="stack" aria-labelledby="review-summary-title">
  <header class="split">
    <h2 id="review-summary-title">Review summary</h2>
    <a class="button" href="/reviews/42/edit#summary">Edit review summary</a>
  </header>
  <dl class="description-list" data-layout="facts">
    <div><dt>Status</dt><dd><span class="status-indicator">Open</span></dd></div>
    <div><dt>Reviewed by</dt><dd>Not recorded</dd></div>
    <div><dt>Reviewed on</dt><dd>Not recorded</dd></div>
  </dl>
</section>
```

Keep this primary summary within the shared task surface described by [page composition](../patterns/application-layout.md#page-composition). Add a panel only when the summary is an independently operated module or needs a visible contextual boundary.

Follow the [record-detail pattern](../patterns/record-details.md#identity-and-key-facts) for prioritizing facts and [historical context](../patterns/record-details.md#history) when displaying past values.

### Compact attribute groups

```html
<section class="stack" aria-labelledby="service-details-title">
  <h2 id="service-details-title">Service details</h2>
  <dl class="description-list" data-density="compact">
    <div><dt>Responsible team</dt><dd>Workplace services</dd></div>
    <div><dt>Environment</dt><dd>Production</dd></div>
    <div><dt>Support contact</dt><dd><a href="mailto:service@example.com">service@example.com</a></dd></div>
    <div><dt>Contract owner</dt><dd>Not assigned</dd></div>
  </dl>
</section>
```

Use one list per meaningful group. Use [formatted content](formatted-content.md) for substantial prose.

Compact rows retain their vertical padding when labels and values stack in narrow containers; the smaller label/value gap keeps each pair together.
