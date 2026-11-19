# Structured record comparison

Assets: [ui.css](../assets/fieldwork/ui.css). Native HTML and CSS only; no initialization or cleanup.

## Default markup

Use to read application-supplied pairs of structured values. Identify both sources, their direction and their capture/revision context before the rows. This example compares a recorded assessment with values read from the current record:

```html
<section class="stack" aria-labelledby="basis-title">
  <h2 id="basis-title">Assessment 3 compared with the current record</h2>
  <p>Assessed on 20 October 2026. Current values read on 25 October 2026.</p>
  <dl class="record-comparison">
    <div class="record-comparison-row" data-change="changed">
      <dt>
        <span class="record-comparison-label">Owner</span>
        <span class="record-comparison-change">Changed</span>
      </dt>
      <dd>
        <span class="record-comparison-side">Assessed</span>
        <div class="record-comparison-content"><p>Jamie Chen</p></div>
      </dd>
      <dd>
        <span class="record-comparison-side">Current</span>
        <div class="record-comparison-content"><p>Robin Ellis</p></div>
      </dd>
    </div>
  </dl>
</section>
```

Repeat the row for each field. Its `dt` names the field and change; the two `dd` values stay in the stated earlier/later order. Use the same directional labels throughout a comparison. **Captured / Current**, **Current / Proposed** or explicit revision labels can replace Assessed / Current when they describe the actual pair.

## States and values

| `data-change` | Visible label | Meaning supplied by the application |
| --- | --- | --- |
| `changed` | Changed | Both sides have values whose meanings differ. |
| `added` | Added | The later side has a value absent on the earlier side. |
| `removed` | Removed | The earlier side has a value absent on the later side. |
| `unchanged` | Unchanged | The compared values are equivalent. |

Keep the visible text label; color is supplementary. Render an explicit **Not recorded**, **Not linked**, **Not applicable** or other accurate explanation on an absent side. Do not treat zero, false, an empty collection or an unavailable read as missing by default. Applications decide field meanings, equality, normalization and whether a change matters to the workflow.

Escape all application strings, including long names and source labels. `.record-comparison-content p` preserves line breaks and wraps long text. Structured values can contain several paragraphs or a [description list](description-lists.md); retain each value's labels and provenance. Supply field-level changes rather than inventing word-level differences in prose.

## Composition and recovery

- Clearly name and identify both sources. A historical comparison URL should retain the exact recorded version. If Current is refreshed on navigation/reload, say when it was read rather than implying it is a pinned or live-updating snapshot.
- A concise summary can introduce changed values. Show unchanged values in a labeled section or provide an explicit view link. Keep changed rows visible.
- When the values match, state **No changes in the compared values**. Name any limits to the compared scope; equality of displayed fields does not prove whole-record equality or unchanged requirements.
- When one side cannot be loaded, retain the known identities, explain that comparison is unavailable and offer a retry for the same intended pair. Do not turn an incomplete read into an identical result or a row of invented removals.
- Keep comparison read-only. Put an explicit edit/reassessment entry point outside the rows. Comparison must not merge values, accept a proposal, rewrite an earlier result or decide whether approval is needed.
- From an editing/recovery task, preserve the draft when inspecting a comparison. A clearly labeled new-tab link is one native option. Follow [record-activity recovery](../patterns/record-activities.md#save-return-and-continue) for stale submissions and [population reviews](../patterns/population-reviews.md#changes-recovery-and-completion) for assessment freshness.

Rows pair values in two columns when their container has room and stack Assessed before Current in narrow containers. Keep repeated side labels in the markup so either layout has unambiguous direction. There is no horizontal table scrolling requirement, keyboard mode or enhancement dependency.

## Scope

Presentation of supplied structured values only. Applications own fetching, stable field/item matching, authorization, version capture, comparison calculation, concurrency and business consequences. For Markdown-source line changes, use [document comparison](document-comparison.md). For quoting a single source without differences, use [record references](record-references.md).
