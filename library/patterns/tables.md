# Pattern: data tables

## Recommended default

Use a table when people need to compare records across shared attributes. Start with the columns useful to that task and add querying or actions when needed.

For filterable tables, use the [table element's query enhancement](../elements/data-table.md#query-enhancement): place each field-specific filter and sort in its column header. Do not substitute a separate panel or toolbar of inputs/selects for filtering individual table attributes, even when the query is simple. Native criteria fields remain available as the non-JavaScript fallback; enhancement presents them through the column controls.

Choose filters from what the values mean, not their storage type:

| Values | Default filter |
| --- | --- |
| Free text, such as names or descriptions | Text conditions such as Contains, Equals, or Begins with. |
| Bounded categories or references, such as statuses or owners | A checkbox list for one or multiple matching values. |
| Amounts or measurements | Numeric comparisons or ranges, with units. |
| Calendar dates or timestamps | Date comparisons, inclusive ranges or relative calendar periods, resolved by the application. |

A category is still categorical when stored as a string; use the element's [value-filter example](../elements/data-table.md#categorical-value-filters), rather than a text condition and single-choice select. Expose useful operations supported by application queries. A global keyword search can complement column filters when people need to find records across attributes; it does not replace them.

Make the applied query visible and easy to change or clear. Preserve confirmed results and attempted criteria when an update fails. Keep controls usable through keyboard and native server-rendered interaction.

The element contract owns markup, setup, supported criteria, and APIs. Its example illustrates the structure; fields and options remain application choices.

## Column readability

Choose a wrapping policy with the column definitions. Keep short inline values such as owner names, identifiers, dates and amounts together when splitting them would hinder scanning. Give subjects, descriptions, milestones and notes room to wrap. Use the [table element’s wrapping markup](../elements/data-table.md#column-wrapping) consistently on headers and cells. Let the table scroll locally when its meaningful content needs more width; retain full values.

Choose initial widths from the task rather than giving every attribute the same share. Names and subjects usually need more room than short states, types or dates. Treat these as defaults: preserve saved user widths and order independently, and retain readable content minima and local scrolling.

## Query and navigation

The application owns data access, permissions, and query execution. A column criterion applies to that column only; keep cross-attribute keyword search outside individual column menus. Map application query parameters to the column controls; endpoint parameter names and existing scalar fields do not prescribe a separate filter panel. Keep one applied query across filtering, sorting, and navigation. A changed filter starts at the first page; paging retains the applied criteria.

For a sortable column, offer ascending, descending, and clear sort together. Labels should describe the values (A–Z/Z–A, low/high, earlier/later); an application-defined workflow order can suit states. Keep native options and enhanced actions consistent. Adapt application queries to support the chosen criteria, multiple category values, and both sort directions; inherited scalar parameters or incomplete sorting should not reduce the intended interaction.

For larger collections, show a bounded page and an accurate range or count when known. Keep pagination near the results. Follow the [pagination contract](../elements/data-table.md#pagination-and-large-datasets) when using the table controller.

## Selection and actions

Add selection when users need to act on several records. Follow the [bulk-action pattern](bulk-actions.md) for operation scope, review, and recovery, and [row selection](../elements/row-selection.md) for controls and runtime behavior.

## Presentation

Keep the table's identity, results, applied query, and relevant actions together. Use [column layout](../elements/column-layout.md) when users need to adjust which attributes they compare. Keep these view choices independent of the query and selected records.

Use one page title and a [compact collection toolbar](../elements/data-table.md#compact-collection-toolbar) for the current view, count, filters and actions. Avoid another “All records” heading that merely repeats the collection identity. Keep explanations for unfamiliar decisions and recovery; ordinary navigation does not need instructional copy.

## Results and recovery

| State | Presentation and next action |
| --- | --- |
| Available | Show rows, known counts, current sort, and active filters. |
| No records yet | Explain the starting state; offer creation when appropriate and permitted. |
| No filter matches | Keep conditions visible; offer adjustment/clearing. Show filtered versus total counts when known. |
| First load | Explain loading, without inventing a count. |
| First load failed | Explain unavailability and offer Retry for the same query. Do not show zero records. |
| Refreshing | Keep earlier rows readable and identify them until replacement succeeds. |
| Refresh failed | Keep earlier rows, warn they may be out of date, and offer Retry. |

Keep live feedback outside busy results and preserve unrelated focus and scroll. The [table element](../elements/data-table.md#query-enhancement) defines the supporting markup and controller behavior.

For named queries, personal defaults, modified/reset states, share links and task return, follow [saved table views](saved-table-views.md).
