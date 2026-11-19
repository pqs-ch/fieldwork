# Row selection

Assets: [ui.css](../assets/fieldwork/ui.css) · [tables.css](../assets/fieldwork/tables.css) · [table-selection.js](../assets/fieldwork/table-selection.js).

Follow the [bulk-action pattern](../patterns/bulk-actions.md) for choosing operations, review, and recovery. This element owns selection controls, descriptors, and runtime behavior.

## Default markup

```html
<section class="table-panel" id="record-selection">
  <form id="record-bulk" action="/records/bulk" method="post">
    <!-- Include the application's CSRF token when required. -->
    <input type="hidden" name="selection" data-table-selection-state disabled>
    <div class="table-selection-bar" data-table-selection>
      <span data-table-selected-count>0 selected</span>
      <button class="button" type="button" data-table-clear-selection disabled>Clear selection</button>
      <button class="button" type="submit" name="operation" value="export" data-table-bulk-action>Export selected</button>
    </div>
  </form>
  <div class="table-scroll" role="region" aria-label="Selectable records" tabindex="0">
    <table class="data-table">
      <caption>Records</caption>
      <thead><tr><th class="table-selection-cell" scope="col"><label class="table-row-choice"><input type="checkbox" data-table-select-page aria-label="Select all rows on this page" disabled></label></th><th scope="col">Name</th></tr></thead>
      <tbody><tr><td><label class="table-row-choice"><input type="checkbox" data-table-select-row value="r1" name="selected_ids" form="record-bulk" aria-label="Select first record"></label></td><td>First record</td></tr></tbody>
    </table>
  </div>
</section>
```

## Initialization and cleanup

```js
import { enhanceTableSelection } from 'fieldwork/table-selection';
const selection = enhanceTableSelection(document.querySelector('#record-selection'));
// Before removing the root: selection.destroy();
```

For a root managed by `enhanceDataTable`, use its controller instead of initializing this module separately. Read the [table query contract](data-table.md#query-enhancement) for query execution.

## Supported scope

Explicit row IDs or all-matching scope represented by a query reference and excluded IDs. Query execution, authorization, and bulk operations remain application-owned; never enumerate every match in the browser.

## Behavior and variations

Row links/actions remain independent; clicking a row does not toggle selection.

- Add an initially disabled header checkbox `[data-table-select-page]`, labeled **Select all rows on this page**. Use `.table-selection-cell` on its header and the same `.table-row-choice` wrapper as body rows for aligned centers and consistent hit areas. Shared styles also align an existing bare header checkbox with row wrappers.
- Add row checkboxes `[data-table-select-row]` with **unique nonempty stable record IDs** as values. Use contextual labels such as Select Website refresh and `.table-row-choice` for full-size targets. Names and native `form` ownership are application-defined.
- Add `[data-table-selected-count]`, optional `[data-table-clear-selection]` (`type="button"`, initially disabled), and any number of application-owned `[data-table-bulk-action]` buttons. `.table-selection-bar` groups count/actions; initially disabled actions stay unavailable.
- For an [action dropdown](action-dropdowns.md#action-dropdowns), mark both the trigger and its operation buttons with `data-table-bulk-action` and initialize `enhanceActionDropdown` separately. Bind operation handlers to actual operations only; choosing the trigger must not run an action. Keep selection count, scope, and Deselect all outside the menu. Every operation reads the same current selection descriptor, including unseen matches and exclusions.

The optional `[data-table-selection]` region appears when a selection exists and hides when the explicit selection is empty. Keep checkboxes visible so selection remains discoverable. Off-page selections and all-matching selections keep their actions available. Clearing a selection closes any open action popover and recovers focus from hidden controls to the page checkbox, or a column control when no rows are selectable. The controller restores the region’s original visibility on destroy; leave native bulk controls rendered for use without JavaScript.

`enhanceDataTable` initializes selection only when its header checkbox exists. Otherwise `table.selection` is undefined. For the independently initialized `selection` above, the following API calls use matching metadata from an application-owned `response`:

```js
selection.value;      // Descriptor below; use this for every bulk action.
selection.count;      // Selected count, or null when the all-matching total is unknown.
selection.setMatching({ token: response.queryToken, total: response.eligibleCount });
selection.refresh();  // After application-owned row replacement.
selection.clear();
selection.setBusy(true);  // Capture descriptor first, then block conflicting bulk/selection UI.
selection.setBusy(false);
selection.destroy();
```

### Page selection versus all matching results

The header checkbox affects **only the current page** and reflects all/none/mixed state among its visible enabled rows. It never silently selects unseen records. Once the page is selected, Fieldwork offers **Select all 12,500 matching results**, or **Select all matching results** when the total is unknown. This is an explicit second step. Its scope bar then says actions apply across every page; deselections appear as exclusions. The promotion button stays in place and becomes **Deselect all**, retaining keyboard focus so the operation can be reversed immediately. It clears the entire selection and all exclusions, across pages. In this mode the toolbar’s duplicate Clear selection action is hidden; it returns for explicit selections. The header checkbox continues to affect only the current page. The total is the number of **eligible selectable matches**, which may differ from the table's record count.

All-matching selection is available only with application-supplied matching context. Return `{ matching: { token, total } }` from a successful query callback, call `table.refresh({ matching })`/`selection.setMatching(matching)` after other successful rendering, or render `data-table-matching-token` and optional `data-table-matching-total` on the root. `total` is a nonnegative safe integer or null; omit the root total attribute for unknown totals. `token` is a nonempty server-issued query reference; sorting and pagination do not change its matching scope. Return/pass `matching: null` to disable this capability. Without matching metadata, selection retains the original page-only behavior.

In matching context, explicit IDs survive page replacement and sorting; returning to a page restores their checked state. All-matching selection follows the same query across pages, using only deselected IDs as exceptions. `refresh()` drops explicitly selected visible disabled rows; it does not discard off-page IDs belonging to the same query. The server remains responsible for eligibility of unseen rows. Disabled rows are not selected, and the context count must already exclude ineligible records.

A successful filter change clears either selection mode. Changed query tokens clear selection; a changed total also clears all-matching mode so its stated scope does not silently change. Failures preserve the prior confirmed selection/context. If a filter callback returns no new matching context, the previous context is removed; it must not be reused with a different filter. Pending callbacks block selection and bulk actions. The helper emits bubbling `fieldwork:selectionchange` with `{ selection, ids }`; `ids` is null in all-matching mode.

### Efficient backend descriptor

```js
// A small explicitly chosen set; queryToken is included when matching context exists.
{ mode: 'ids', ids: ['123', '456'], queryToken: 'server-reference' }

// Every eligible match, including unseen pages, except deliberate deselections.
{ mode: 'all', queryToken: 'server-reference', excludedIds: ['789'] }
```

`selection.value` returns a copy. `selection.ids` throws in all-matching mode; use the descriptor rather than enumerating matching IDs. If explicit IDs/exclusions become unbounded, store a server-side selection resource.

The backend must validate references against user/tenant/permissions, query compatibility, expiry, and current eligibility. Define snapshot versus execution-time matching; reject changed scope rather than widening it. Execute set-based/queued operations and report confirmed outcomes; accepted jobs are not completed work.

### Native submission and lifecycle

For enhanced native query navigation, set `data-table-selection-state-name="selection"` on the query form to carry the descriptor as one JSON field when filters are unchanged. The endpoint validates it, returns matching metadata, and renders a hidden `input[data-table-selection-state]` with the validated descriptor in the independent bulk form. Give that hidden input the application's submitted field name and render it **disabled** until enhancement is ready. Fieldwork enables and updates it as selection changes, so every ordinary submit button (including its own name/value) sends the same scope. This keeps a stale hidden descriptor from overriding native checkbox edits when JavaScript is unavailable. The server must parse an enabled/submitted descriptor explicitly; malformed all-matching state must never fall back to the checked page IDs. Bulk row checkboxes may still submit their bounded page values for the native fallback.

Without JavaScript, row checkboxes can submit directly through their native `form` attribute. The endpoint executes those explicit IDs without all-matching promotion; server-rendered pages need no client data loading. Native pager/filter links remain usable. Query navigation without carried state starts a new selection. The older `data-table-selection-name="selected_ids"` mapping still supports explicit IDs only; use the JSON mapping when all-matching selection is enabled.

When the hidden state field is supplied, committed matching metadata and descriptor values survive cleanup/reinitialization; the state field’s original disabled state is restored for the native fallback. Destroy before Turbo replacement/cache and reinitialize new/restored roots. Call `refresh()` after in-place row changes; pass matching metadata only after successful results. Keep the query token stable across sort/page requests for the same eligible scope and invalidate it on actual scope changes.
