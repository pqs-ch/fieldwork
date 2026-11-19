# Document comparison

Assets: [ui.css](../assets/fieldwork/ui.css) · [document-comparison.js](../assets/fieldwork/document-comparison.js).

Follow the [versioned-document pattern](../patterns/versioned-documents.md) for revision selection, reading, editing and history. This element presents a unified comparison of Markdown **source** supplied by the application.

## Default markup

```html
<form class="comparison-selection" action="/documents/guide/compare" method="get">
  <div class="field"><label for="comparison-earlier">Earlier revision</label>
    <select id="comparison-earlier" name="earlier"><option value="r4" selected>Revision 4 · Published 1.0</option><option value="r7">Saved revision 7</option></select>
  </div>
  <div class="field"><label for="comparison-later">Later revision</label>
    <select id="comparison-later" name="later"><option value="r4">Revision 4 · Published 1.0</option><option value="r7" selected>Saved revision 7</option></select>
  </div>
  <button class="button" type="submit">Compare revisions</button>
</form>
<section class="document-comparison" data-document-comparison
  data-earlier-revision="r4" data-later-revision="r7"
  aria-labelledby="comparison-title">
  <h2 id="comparison-title">Published version 1.0 → Saved revision 7</h2>
  <p>Earlier: revision 4 · Later: revision 7. Source changes; + added, − removed.</p>
  <nav class="cluster" aria-label="Comparison controls">
    <a href="#change-response" data-comparison-jump>First change</a>
    <a href="/documents/guide/revisions/r4">Read earlier revision</a>
    <a href="/documents/guide/revisions/r7">Read later revision</a>
  </nav>
  <p class="hint" data-comparison-status role="status" aria-atomic="true"></p>
  <section class="comparison-block" aria-labelledby="change-response">
    <header class="comparison-block-header">
      <h3 id="change-response" data-comparison-change tabindex="-1">Change 1 · Response time · earlier 3–5, later 3–5</h3>
    </header>
    <div class="comparison-scroll" role="region" aria-label="Response time source changes" tabindex="0">
      <ol class="comparison-lines">
        <li class="comparison-line" data-change="context"><span class="comparison-number" aria-hidden="true">3</span><span class="comparison-number" aria-hidden="true">3</span><span class="comparison-marker" aria-hidden="true"> </span><code>## Response time</code></li>
        <li class="comparison-line" data-change="removed"><span class="comparison-number" aria-hidden="true">4</span><span class="comparison-number" aria-hidden="true"></span><span class="comparison-marker"><span aria-hidden="true">−</span><span class="visually-hidden">Removed: </span></span><code>Respond within <del>five</del> days.</code></li>
        <li class="comparison-line" data-change="added"><span class="comparison-number" aria-hidden="true"></span><span class="comparison-number" aria-hidden="true">4</span><span class="comparison-marker"><span aria-hidden="true">+</span><span class="visually-hidden">Added: </span></span><code>Respond within <ins>three</ins> days.</code></li>
      </ol>
      <section class="comparison-context" data-comparison-context>
        <h4>1 unchanged line · earlier 5, later 5</h4>
        <ol class="comparison-lines">
          <li class="comparison-line" data-change="context"><span class="comparison-number" aria-hidden="true">5</span><span class="comparison-number" aria-hidden="true">5</span><span class="comparison-marker" aria-hidden="true"> </span><code>Contact the support team for help.</code></li>
        </ol>
      </section>
    </div>
  </section>
</section>
```

## Initialization and cleanup

```js
import { enhanceDocumentComparison } from 'fieldwork/document-comparison';
const comparison = enhanceDocumentComparison(document.querySelector('[data-document-comparison]'));
// Before caching/replacing/removing this root: comparison.destroy();
```

Enhancement only adds focus/scroll handling for marked change links. It never calculates differences, fetches content, changes selection, edits fields, or updates the revision pair. Repeated initialization returns the same controller. `destroy()` removes listeners and restores the status text. Mounting and cleanup never move focus. Follow the [Rails lifecycle](../rails.md#other-component-lifecycles) for Drive, Frames and Streams.

## Application input and markup contract

The public input is server-rendered HTML, not an engine-specific JSON structure. An application adapter maps its comparison results to the following presentation:

`.document-comparison` spaces its direct introduction and navigation blocks, with more room before source and metadata sections. `.comparison-selection` wraps the native GET selectors and action, allowing long labels and enlarged controls to fit their container. It is a query form, not an editing form; do not attach a form editing controller.

| Input | Required presentation |
| --- | --- |
| Pair | Stable earlier/later revision IDs on the root; readable labels, attribution/time where available, and explicit earlier/later selectors in an application-owned GET form. Resolve “latest” aliases before rendering. Selection submits a new pair URL and replaces the root. |
| Result | Distinguish changed, identical, no predecessor, and unavailable in visible text. Only a successful comparison with no source or metadata changes means “No changes.” |
| Changed block | One `.comparison-block` per hunk, with a document-unique heading ID, `data-comparison-change`, `tabindex="-1"`, readable scope and accurate earlier/later ranges. Include a few unchanged lines around each change. Merge overlapping context in the application adapter. |
| Line | Ordered `.comparison-line` items with `data-change="context"`, `"added"` or `"removed"`. First two spans show earlier/later line numbers (blank when absent), then marker, then escaped source in `code`. Empty lines are valid. Numbers are decorative; ranges identify the block. |
| Addition/deletion | Visible +/− marker and a visually hidden Added/Removed label; colour is supplementary. Group removed lines before added replacement lines. Never render source as HTML. |
| Word segments | Optional `ins` within added lines and `del` within removed lines around application-supplied changed spans. Preserve whitespace and punctuation exactly; absent word data uses whole-line changes, not invented spans. Explain formatting-only/source changes in block labels when useful. |
| Unchanged context | Show supplied unchanged lines directly with an accurate count/range. For large comparisons, use ordinary revision-pinned links to a complete comparison on the server. |
| Complete comparison | When context is omitted, provide an ordinary URL including the same revision pair. The server supplies the missing lines; enhancement does not intercept this link. |
| Change navigation | Native previous/next anchors between block headings, marked `data-comparison-jump`. Omit unavailable directions at boundaries. The optional first-change link uses the same hook. Keep target headings visible. |
| Metadata | Separate labeled description list or table of field / earlier / later values outside the source lines. Explicitly report unchanged metadata when known. A source-only match does not imply identical metadata. |

HTML-escape all source segments and application labels, including text inside `ins`/`del`; these are source characters, not trusted rendered Markdown. Applications own size limits, line numbering (including newline-at-end distinctions), accessible labels, authorization, comparison calculation and error recovery. The element does not validate comparison accuracy.

### Native behavior, focus and reading position

Without JavaScript, selectors submit GET requests, change anchors navigate to focusable headings, supplied context stays visible, and a complete-comparison URL can load omitted lines. Give each horizontally scrolling block a name and keyboard entry point. Lines preserve Markdown whitespace and scroll locally rather than widening the page. Keep prose, metadata, labels and selectors wrapping outside that source region.

Enhanced change navigation focuses the destination heading and scrolls it into view, announcing its position. Do not announce every line through a large live region. Context fetched by the application must preserve the invoking control/reading anchor; use the same revision pair in every request.

### Explicit result states

- **Identical:** “No source changes between revision 6 and revision 7”; separately show whether metadata changed. With no source or metadata changes, “No changes between these revisions.” Omit empty block controls.
- **First revision:** “This is the first saved revision; there is no earlier revision.” Offer a rendered view. Comparing with empty content is a separate, explicitly labeled application choice.
- **Unavailable:** explain that the comparison could not be loaded/calculated, keep the selected labels and offer application-owned retry/read links. Partial results must be labeled incomplete.

## Scope

Unified Markdown-source comparison only. For labeled before/after record attributes, use [structured record comparison](record-comparison.md). Side-by-side views, rendered HTML/table differences, section-move detection, merging, accept/reject suggestions and inline review comments are outside this contract. Existing [content revisions](content-revisions.md) remain compatible and unchanged; this element neither initializes their picker nor assumes that historical views share one page.
