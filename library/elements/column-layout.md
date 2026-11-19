# Column layout

Assets: [ui.css](../assets/fieldwork/ui.css) · [tables.css](../assets/fieldwork/tables.css) · [table-columns.js](../assets/fieldwork/table-columns.js).

## Default markup

```html
<section class="table-panel" id="record-columns">
<button class="button" type="button" data-table-configure-columns disabled>Columns</button>
<div class="table-scroll" role="region" aria-label="Projects, scroll horizontally if needed" tabindex="0">
  <table class="data-table" data-table-columns>
    <caption>Projects</caption>
    <thead><tr>
      <th scope="col" data-table-cell="project" data-wrap="wrap" data-table-required data-table-width="260">Project</th>
      <th scope="col" data-table-cell="owner" data-wrap="nowrap" data-table-width="200">Owner</th>
    </tr></thead>
    <tbody><tr><td data-table-cell="project" data-wrap="wrap">Website refresh</td><td data-table-cell="owner" data-wrap="nowrap">Alex Morgan</td></tr></tbody>
  </table>
</div>
</section>
```

## Initialization and cleanup

```js
import { enhanceTableColumns } from 'fieldwork/table-columns';
const layout = enhanceTableColumns(document.querySelector('#record-columns'));
// Before removing the root: layout.destroy();
```

For a root managed by `enhanceDataTable`, use its controller instead of initializing this module separately. Read the [table query contract](data-table.md#query-enhancement) for query execution.

## Supported scope

One keyed header row with one matching cell per column in each row. No row/column spans, grouped headings, or authored colgroup; visibility is presentation, not authorization.

## Behavior and variations

Columns opens a visibility/order draft with Apply/Cancel and Reset; Escape cancels. Apply, Cancel and Escape return focus to the connected, enabled Columns button. Place it outside bulk actions. Ordering uses the [reorderable list](reorderable-list.md); resizing uses header dividers with Left/Right (8px; Shift: 32px), Home/End, and Escape to restore the starting width.

Use an initially disabled `[data-table-configure-columns]` button (its label and optional [icon](icons.md) are retained), a `[data-table-columns]` table, and stable `data-table-cell` keys on every header/body/footer cell.

`enhanceDataTable` owns `table.columnLayout` when the configure button exists. For independent tables use `enhanceTableColumns`; never initialize/destroy the same layout separately from its owner.

Requirements and supported limits:

- One header row, one cell per column in every row, unique keys matching the header, no row/column spans or authored `colgroup`. Keep empty-state messages outside the table. The module supplies its own column sizing group and reorders the actual semantic cells, retaining application controls and listeners. Grouped headings and spanning rows are not supported.
- Leading utility columns, such as selection, use `data-table-fixed` on their headers. They remain visible, in place, and outside configuration/resizing. This means fixed **order**, not sticky positioning. Keep all such columns before configurable columns.
- Use `data-table-required` for application-chosen columns that must remain visible; they can still move and resize. Otherwise at least one configurable column must remain visible. The example keeps Project visible; this is not a universal identity-column rule.
- `data-table-width` sets the initial width in pixels; otherwise use the initial rendered width. Ordinary configurable widths are bounded to 112–960px. Hidden headers use their supplied width or a 192px fallback. The enhanced table uses fixed pixel widths and horizontal scrolling; it can be narrower or wider than its container. Cell text follows the [column wrapping contract](data-table.md#column-wrapping); header query labels truncate within the available width. Width limits are an implementation constraint, not a content recommendation.
- For `data-wrap="nowrap"` columns, render the same policy on the header and matching cells. The controller raises an undersized requested width to fit currently rendered nonwrapping values and their padding, including after `refresh()`, showing a hidden column or applying saved widths. This content minimum applies to pointer and keyboard resizing, including Home, and is exposed by the resize handle’s ARIA bounds. Exceptionally long values can raise both minimum and maximum above 960px; widths supplied for these columns are normalized to the current content bounds. `value` and change events report the effective widths. No value is clipped or replaced with an ellipsis. Header query labels retain their existing truncation.
- Optional native `hidden` on a header supplies its initial hidden state. Hiding a column **does not clear its filters or sorting**. Applied filter chips remain available; a visible summary identifies hidden columns still used for filtering/sorting. Columns is the recovery path to reveal them.
- Layout never changes query scope, cursor, matching token, selection, or data. Query callbacks do not run for layout changes. The table controller blocks layout changes while a query is pending and reapplies layout after successful rendering. Call `table.refresh()` after other row replacement; every new row must carry the same keys. Destroy/reinitialize for a changed column schema or replaced table/header.

When owned by `enhanceDataTable`, access the same layout controller through the table:

```js
const layout = table.columnLayout;
layout.value; // Independent array: [{ key: 'project', visible: true, width: 260 }, …]. Fixed utility columns are omitted.
layout.setLayout(savedColumns); // Validates complete keys, visibility, and integer widths; normalizes nonwrapping widths to content bounds.
document.querySelector('[data-data-table]').addEventListener('fieldwork:columnlayoutchange', event => {
  // event.detail.columns is a copy of the committed layout; save it if the application needs preferences.
});
```

Independent controllers expose `refresh()`, `setBusy(boolean)`, and `destroy()`. Destroy cancels drafts/dragging, removes generated UI, and restores initial cell order, visibility, widths, and button attributes. Capture `value` first if needed. Reapply preferences through `setLayout`; applications own persistence and migrations. Without enhancement, keep the configure button disabled.

Column visibility is a presentation preference, never authorization: hidden data remains in the DOM. Sensitive or unauthorized data must be omitted by the application.
