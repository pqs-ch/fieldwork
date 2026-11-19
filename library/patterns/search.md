# Pattern: searching collections

Shared implementation: [ui.css](../assets/fieldwork/ui.css) · [collection-search.js](../assets/fieldwork/collection-search.js).

## Recommended default

Choose the query interface from the result presentation first. For tabular results, follow the [data-table pattern](tables.md#recommended-default) for column filtering and sorting. The visible query form below is for lists/cards; do not copy it as a substitute for table column controls.

For lists and cards, start with one keyword search and add a small number of visible filters only when they help the task. Keep those controls in one query form. Distinguish draft controls from the applied query; retain both after failure.

Render bounded pages and known ranges/counts. New filters start at the first page; [pagination](../elements/breadcrumbs-and-pagination.md#pagination) retains the applied query. Provide contextual links to remove/clear filters.

Retain confirmed results while refreshing and identify their previous scope. Failure retains the attempted query for retry. With no initial results, mark `data-collection-unavailable`; do not invent a zero count.

Use [empty states](../elements/empty-states.md) for no records, no matches, or unavailable initial results. Keep query controls outside; refresh failure retains content with feedback.

A global keyword search may complement column filtering when people need to search across attributes. Applications own that combined query and must preserve both search and column criteria through submission, pagination, and recovery. Never initialize two query controllers on one form.

## Native markup

```html
<section data-collection data-collection-url="/records?q=website">
  <form class="collection-search" action="/records" method="get"
    data-collection-query role="search" aria-label="Search records">
    <div class="field">
      <label for="record-search">Search records</label>
      <input id="record-search" type="search" name="q" value="website">
    </div>
    <div class="cluster">
      <button class="button" data-intent="primary">Search</button>
      <a class="button" href="/records" data-collection-link>Clear</a>
    </div>
  </form>
  <p class="hint" data-collection-draft hidden>Search options changed. Search to update results.</p>
  <div class="stack" data-collection-view>
    <h2 data-collection-summary tabindex="-1">1 record found</h2>
    <div class="collection-filters" aria-label="Applied search and filters">
      <a class="collection-filter" href="/records" data-collection-link
        aria-label="Remove search: website">Search: website <span aria-hidden="true">×</span></a>
    </div>
    <ul class="record-list" aria-label="Records">
      <li><article><h3><a href="/records/123">Website refresh</a></h3>
        <p>Refresh the public website.</p>
        <div class="record-meta"><span>Status: Active</span></div>
      </article></li>
    </ul>
  </div>
</section>
```

## Optional client enhancement

```js
import { enhanceCollectionSearch } from 'fieldwork/collection-search';
const root = document.querySelector('[data-collection]');
const search = enhanceCollectionSearch(root, {
  async load(url, { signal }) {
    const response = await fetch(url, { signal, headers: { Accept: 'text/html' } });
    if (!response.ok) throw new Error('Search unavailable.');
    const document = new DOMParser().parseFromString(await response.text(), 'text/html');
    return document.querySelector('[data-collection-view]');
  },
  onCommit(url, { reason }) {
    // Optional application history integration; see below.
  }
});
// Before removing/caching this view: search.destroy();
```

## Supported scope

Read-only GET collections with bounded, application-rendered results and optional client loading. The application owns queries, result HTML, and history; do not combine this query form with an editing controller.

## Behavior and variations

Set `data-collection-url` to the query that produced displayed results; otherwise location is used. Render controls, counts, and paging from the validated query. Omit page/cursor from the query form and carry it on pager URLs.

Without `load`, GET submissions and links stay native, including Rails/Turbo. Do not attach an editing controller to this form.

`load(URL, {signal})` must resolve with a detached HTMLElement marked `data-collection-view`, containing `[data-collection-summary][tabindex="-1"]`. Render trusted/escaped markup into that detached view. Reject errors; only the latest successful response replaces the live view.

The helper intercepts submission and same-origin/path `a[data-collection-link]` query/pager links. Record links and modified clicks stay native. It reads FormData before loading; file inputs are unsupported. New submissions abort/invalidate earlier requests.

Retry uses the captured failed URL. Edits made during a request remain a newer draft; otherwise successful query navigation synchronizes controls. Optional `[data-collection-draft]` compares named controls with the applied URL, ignoring page parameters outside the form; its authored text is restored on destroy.

Results become busy while feedback remains outside the busy region. After explicit actions, focus moves to the result summary only if the user has not moved elsewhere.

### State, history and lifecycle

- `search.url` returns a fresh copy of the last successful applied URL.
- `search.isLoading` reports whether a query is pending.
- `await search.navigate(url, {reason: 'navigate', focus: false})` supports application-owned Back/Forward or initial client loading. It returns true after a committed response, false after failure/abort/destruction. `reason` is forwarded to `onCommit`; explicit form/link/retry actions use `submit`, `link`, and `retry`.
- `onCommit(url, {reason})` runs after success only. The application may update history, analytics, or its router. Do not push a history entry on failure; handle `popstate` without pushing another entry. Preserve repeated query parameters with `URLSearchParams`.
- `destroy()` aborts the pending signal, invalidates late completions, removes listeners/generated feedback, restores the busy/draft attributes, and permits reinitialization. It does not clear results, reset the form, or change the browser URL. Initialize newly rendered roots through the application's lifecycle and destroy before replacement/cache preparation.

Initialization is idempotent. The editing Turbo bridge does not initialize search. Applications own authorization, bounded queries, rendering, history, and caching.
