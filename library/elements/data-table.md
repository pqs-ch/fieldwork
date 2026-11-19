# Data table

<a id="table"></a>

Assets: [ui.css](../assets/fieldwork/ui.css) · [tables.css](../assets/fieldwork/tables.css) · optional [data-table.js](../assets/fieldwork/data-table.js).

Start with the [data-table pattern](../patterns/tables.md) for interaction defaults. For filtering or sorting, start with [query enhancement](#query-enhancement), including its column triggers and initialization. The basic markup below is for tables without query controls; styling a table with `.data-table` alone does not supply column filtering.

## Default markup

```html
<table class="data-table">
  <caption>Project owners</caption>
  <thead><tr><th scope="col">Project</th><th scope="col">Owner</th></tr></thead>
  <tbody><tr><td>Website refresh</td><td>Alex Morgan</td></tr></tbody>
</table>
```

## Behavior and variations

Use `.data-table` with a caption, scoped headers, and `data-align="number"` on numeric headers/cells. A `.table-panel` groups the table, controls and footer on the continuous page background without an outer border or radius; `.table-scroll` contains overflow. Name wide scroll regions and add `tabindex="0"`.

All `<th>` cells use a heavier `650` font weight, regardless of table section or column position. Header links and column triggers inherit that weight. Ordinary data cells receive no special first-column emphasis. No-wrap defaults and shading apply only to `<thead>` cells. Body row headers (`<th scope="row">`) use accent-colored text with ordinary body-cell sizing, padding, wrapping, borders and row-state styling; hover, focus and selection highlights extend across the whole row. Plain row headings remain ordinary text; links retain their underline on hover and keyboard focus.

Column headers use a light neutral background and rows use quiet dividers. Navigation links in data cells keep their accent color and medium weight; underlines appear on hover and keyboard focus. Links within paragraphs or `.rich-content` remain underlined, and links styled as buttons retain their own treatment. Keep meaningful [status tones](status-indicators.md) for outcomes and exceptions; routine neutral states and counts use plain muted text.

The scroll region adds no divider above the table. Toolbars and selection bars own their lower divider, so hiding optional controls leaves no extra rule above the column headers.

Use `.table-footer` for result ranges and pagination inside a table panel. A [panel footer](panels.md) (`.panel-footer`) inside `.table-panel` receives the same inset spacing and layout. Both sit directly against the table with a single divider, align count and navigation vertically, and wrap when space is limited. Keep the footer outside `.table-scroll` so pagination stays visible when the table scrolls horizontally.

### Compact collection toolbar

When the page title already identifies the collection, avoid repeating it as another table heading. Keep the current view, result count, applied filters and relevant actions in one wrapping toolbar. The footer can still show the current page range and pagination.

```html
<div class="table-toolbar">
  <p class="hint">9 of 24 projects</p>
  <div data-table-filter-summary hidden></div>
  <a class="button" data-variant="quiet" href="/projects">Reset view</a>
</div>
```

Place the optional `[data-table-filter-summary]` inside the same `[data-data-table]` root as the query form. Enhancement inserts the applied-filter chips there, reveals the slot only while filters are applied, and restores its original hidden state on cleanup. Leave the slot empty and initially `hidden`; native criteria remain in the form. Without a slot, chips retain their default position before the results. Toolbar chips wrap when necessary instead of squeezing view controls or actions.

### Column wrapping

Declare `data-wrap="wrap"` or `data-wrap="nowrap"` on a column's header and every corresponding body/footer cell. Applications can keep this choice in their column definitions and emit it consistently. It is presentation markup, independent of query parameters, column visibility and user preferences; it works without JavaScript.

```html
<table class="data-table">
  <caption>Projects and owners</caption>
  <thead><tr>
    <th scope="col" data-wrap="wrap">Project</th>
    <th scope="col" data-wrap="nowrap">Owner</th>
  </tr></thead>
  <tbody><tr>
    <td data-wrap="wrap">Customer onboarding improvements</td>
    <td data-wrap="nowrap">Alex Morgan</td>
  </tr></tbody>
</table>
```

| Value | Cell content |
| --- | --- |
| `wrap` | Allow line breaks and break long unspaced text when necessary. |
| `nowrap` | Keep inline values together, including whitespace between words. |

Choose from the values' meaning and expected length. Names, identifiers, dates and amounts often benefit from staying together; subjects, descriptions and notes usually need wrapping space. Each application chooses explicitly; Fieldwork does not infer wrapping from a heading or value type. Preserve full content and place wide tables in a named `.table-scroll` region. Header controls and state indicators retain their own presentation contracts.

Omitting the attribute preserves existing behavior: ordinary body text wraps at normal opportunities; configured tables also break long text; plain headers stay on one line. Explicit `wrap` also permits plain header text to wrap. Column query labels retain the [column-layout contract's](column-layout.md) truncation behavior when configured.

Native automatic table layout reserves space for `nowrap` values and distributes the remaining space to wrapping columns. Explicit wrapping cells retain a modest minimum reading width (`12ch` plus cell padding) before the table scrolls, preventing single-letter columns. [Column layout](column-layout.md) also protects their content width during resizing and refresh. Wrapping is an author choice, so the Columns dialog does not add a wrapping toggle.

### Panel with pagination

```html
<section class="table-panel" aria-label="Project owners">
  <div class="table-scroll" role="region" aria-label="Project owner results" tabindex="0">
    <table class="data-table">
      <caption>Project owners</caption>
      <thead><tr><th scope="col">Project</th><th scope="col">Owner</th></tr></thead>
      <tbody><tr><td>Website refresh</td><td>Alex Morgan</td></tr></tbody>
    </table>
  </div>
  <footer class="table-footer">
    <p class="hint">Showing 1–1 of 2</p>
    <nav class="pagination" aria-label="Result pages">
      <span aria-disabled="true">Previous</span>
      <a href="/records?page=1" aria-current="page">1</a>
      <a href="/records?page=2">2</a>
      <a href="/records?page=2">Next</a>
    </nav>
  </footer>
</section>
```

Use the [row-selection contract](row-selection.md) to add selection controls. Both the native controls and their enhanced visible/hidden states use the same panel layout. Follow [pagination](breadcrumbs-and-pagination.md#pagination) for link semantics and query retention.

See the [data-table pattern](../patterns/tables.md#results-and-recovery) for result states and recovery. [Column layout](column-layout.md) can also enhance a standalone keyed table.

Use `.table-feedback` for pending or failed queries (`data-tone="error"` for failures) and `.table-empty` for empty results. Keep feedback outside busy results. Application requests outside the controller manage their own stale-response and selection-busy lifecycle.

## Query enhancement

Link each filterable column's header trigger to its native fieldset. Include sort actions where useful. Use this text example for free-text values and the [categorical example](#categorical-value-filters) for bounded choices. Add only the controls and columns the task needs. Supported filter types and optional hooks are described below.

```html
<section class="table-panel" data-data-table aria-label="Records">
  <form class="table-options-form" action="/records" method="get" data-table-query>
    <div class="field">
      <label for="record-sort">Sort</label>
      <select id="record-sort" name="sort" data-table-sort>
        <option value="">Default order</option>
        <option value="name:ascending">Name A–Z</option>
        <option value="name:descending">Name Z–A</option>
      </select>
    </div>
    <fieldset class="table-column-fields" id="name-options" data-table-column="name" data-label="Name" data-type="text">
      <legend>Name</legend>
      <div class="menu-sort">
        <button class="menu-command" type="button" data-sort-direction="ascending" disabled>Sort A to Z</button>
        <button class="menu-command" type="button" data-sort-direction="descending" disabled>Sort Z to A</button>
        <button class="menu-command" type="button" data-sort-direction="none" disabled>Clear sort</button>
      </div>
      <button class="menu-command" type="button" data-reset-filter disabled>Clear filter from “Name”</button>
      <div class="field">
        <label for="name-condition">Text filters</label>
        <select id="name-condition" name="name_condition" data-filter-condition>
          <option value="any">No filter</option>
          <option value="equals">Equals</option>
          <option value="not-equals">Does not equal</option>
          <option value="starts">Begins with</option>
          <option value="ends">Ends with</option>
          <option value="contains">Contains</option>
          <option value="not-contains">Does not contain</option>
          <option value="blank">Is blank</option>
          <option value="not-blank">Is not blank</option>
        </select>
      </div>
      <div class="field" data-when="equals not-equals starts ends contains not-contains">
        <label for="name-text">Text to match</label>
        <input id="name-text" name="name_text" data-filter-text>
      </div>
    </fieldset>
    <button class="button" type="submit" data-table-submit>Apply</button>
    <div class="table-scroll" data-table-results tabindex="0" role="region" aria-label="Record results">
      <table class="data-table">
        <caption>Records</caption>
        <thead><tr><th scope="col">
          <a class="column-trigger" href="#name-options" data-table-options="name">
            <span class="column-label">Name</span>
            <svg class="icon column-filter-indicator" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 5h20" /><path d="M6 12h12" /><path d="M9 19h6" /></svg>
            <span data-table-sort-indicator aria-hidden="true"></span>
          </a>
        </th></tr></thead>
        <tbody><tr><td>First record</td></tr><tr><td>Second record</td></tr></tbody>
      </table>
    </div>
  </form>
</section>
```

Render confirmed rows and controls from the validated query. The native sort select, criteria, and Apply action remain usable without JavaScript; enhancement moves the authored criteria and sort actions into column menus.

### Initialization and cleanup

```js
import { enhanceDataTable } from 'fieldwork/data-table';
const table = enhanceDataTable(document.querySelector('[data-data-table]'));
// Before removing/caching this view: table.destroy();
```

Without a callback, query submission stays native, including Turbo transport. The endpoint returns confirmed controls, rows, counts, and errors. Destroy before replacement/cache and initialize the new root.

### Supported scope

Bounded native or application-rendered table pages, with optional selection and keyed column layout. The application owns data, query execution, counts, rendering, and bulk operations; this is not a data provider or virtualized grid.

### Query configuration

Use one native `[data-table-query]` form with:

- A native select marked `data-table-sort`, with an empty-value option and options whose values are `column:ascending` or `column:descending`. These values describe the UI sort state; the application's endpoint can use its own field name. Supply both directions for each sortable column, along with matching `data-sort-direction` actions and a clear-sort action; query execution must support the same choices.
- A fieldset per column with a unique, nonempty `data-table-column` key without colons, human `data-label`, `data-type="text"`, `"number"`, `"date"`, or `"values"`, and a unique ID.
- An ordinary Apply submit button marked `data-table-submit`.

Each `.column-trigger[data-table-options="column"]` links to its fieldset. Enhancement opens those fields in a modal menu. Include `.column-label`, a decorative `.column-filter-indicator` SVG or [CSS icon](icons.md#default-markup-and-setup), and an empty `<span data-table-sort-indicator aria-hidden="true"></span>` for sortable columns. Both indicators use 16px icons, muted at rest so column labels lead. An applied filter or sort accents its corresponding icon; hover, keyboard focus and an open menu bring both icons to the header's color. The filter icon has no separate badge; `data-filtered` highlights and underlines the header, while the applied summary names the criteria. The sort indicator shows paired up/down chevrons when unsorted and a single arrow for the active direction, using the header's `aria-sort`. Render `aria-sort="ascending"` or `"descending"` on the sorted `th` for native use. Fieldwork updates `data-filtered`, contextual names, and `aria-sort` from the confirmed query during enhancement.

Follow the table markup above. `[data-table-results]`, or the first `.table-scroll`, identifies results and placement of filter/error feedback.

Mark server-rendered filter summaries `data-table-native-summary`; enhancement hides/restores them. Render confirmed `aria-sort` and `data-filtered` for the native view.

Do not nest forms; multiple instances require document-unique IDs. Column menus use compact controls and spacing by default, with larger targets for touch input. Their very light backdrop keeps the table readable; they remain modal, with the same Apply/Cancel, focus containment and opener recovery. Shared menu spacing reserves room for the default focus outline and offset. Keep authored controls in the field/choice groups above; the scrolling criteria body and value list include focus clearance, and the action footer does not overlay focused criteria.

#### Presentation classes

| Class | Use |
| --- | --- |
| `.table-toolbar` | Table identity and view controls, outside bulk actions. |
| `[data-table-filter-summary]` | Optional empty, initially hidden slot for applied-filter chips, including inside a toolbar. |
| `.table-options-form` | Spaces the native query controls and column groups; padding and gaps collapse when its column menu is enhanced. |
| `.table-column-fields` | Each column’s native fieldset, with a regular gap between controls; the enhanced menu uses its own compact gap. |
| `[data-table-sort-indicator]` | Decorative sort state, driven by the header's `aria-sort`. |
| `.menu-sort`, `.menu-command` | Group and style native sort/reset buttons. |
| `.column-menu-body` | Generated scrolling criteria region; the title and action footer remain outside its scroll area. |
| `.filter-values`, `.filter-all` | Bounded checkbox list and its select-all label. |

#### Column controls

Use Excel's familiar entries with Fieldwork's compact menu styling: type-appropriate sort actions, **Clear sort**, **Clear filter from “Column”**, then text/number conditions or a searchable checklist with **Select all**. Put clear-filter actions in `.menu-command` buttons after `.menu-sort`. Label condition fields **Text filters** or **Number filters** and use the comparison labels below. Applications supply the supported choices and execute their queries.

`any` means no text/numeric condition: it is not a search for the word “Any” and includes blank values. Label it **No filter**. A separate selected-value restriction can still apply when conditions and value choices are intentionally combined; value-only categories need no condition select.

Text menus open with **Contains** selected when the column has no text condition and that option is available. Focus starts in the text input. Applied conditions and values are preserved; conditions such as **Is blank** focus the condition select. **Apply** confirms the menu's draft, while **Cancel** restores the current query.

Choice values must be unique strings per column; `value=""` is a valid blank choice. Native field names are application-owned; Fieldwork uses data hooks. Include a named presence marker to distinguish no choices selected from an absent filter parameter.

| Hook | Native control / purpose |
| --- | --- |
| `data-filter-condition` | Select with supported condition values below; omitted for value-only columns. |
| `data-filter-text` | Text input, required for text comparisons other than any/blank/not-blank. |
| `data-filter-case` | Optional native checkbox for case sensitivity. |
| `data-filter-minimum`, `data-filter-maximum` | Number inputs with `step="any"`; maximum is used for between. Label amounts with application units. |
| `data-filter-date`, `data-filter-date-end` | Native `type="date"` inputs for date comparisons; the end date is used for between. |
| `data-filter-period` | Optional select for All dates in the period, with `month:01`–`month:12` or `quarter:1`–`quarter:4` values. |
| `data-filter-value` | Checkbox with a stable string `value`; optional `data-label` supplies readable chip/search text. |
| `data-value-search` | Optional, initially disabled search input without a submitted name. Searches and selects available choices. |
| `data-select-values` | Optional, initially disabled checkbox selecting all choices normally, or just matching results during search. |
| `data-select-values-label` | Span containing the bulk checkbox's visible label, updated to Select all search results during search. |
| `data-value-count`, `data-values-empty` | Optional count and hidden no-matching-choice message. |
| `data-sort-direction` | Initially disabled `type="button"` with ascending, descending, or none. Supply accurate visible labels for the column type. |
| `data-reset-filter` | Initially disabled `type="button"`; immediately clears this column's applied filter. Enabled when the column has an applied filter. |
| `data-when="contains equals …"` | Wrapper naming the conditions for which its inputs apply. Enhancement hides/disables other inputs; native server handlers must ignore irrelevant fields. |

Start enhancement-only helpers disabled; native condition/value fields and Apply remain usable. The server must ignore irrelevant condition fields. Omit unavailable controls from the enhancement contract.

#### Categorical value filters

Use `data-type="values"` for a bounded category/reference. Do not add an Any/Equals select or a single-value dropdown. Put this fieldset in the existing query form. Use the same header-trigger markup as above with `data-table-options="owner"` and `href="#owner-options"`; add `owner:ascending` and `owner:descending` to its native sort select. Initialize the table once, using the setup above.

```html
<fieldset class="table-column-fields" id="owner-options"
          data-table-column="owner" data-label="Owner" data-type="values">
  <legend>Owner</legend>
  <div class="menu-sort">
    <button class="menu-command" type="button" data-sort-direction="ascending" disabled>Sort A to Z</button>
    <button class="menu-command" type="button" data-sort-direction="descending" disabled>Sort Z to A</button>
    <button class="menu-command" type="button" data-sort-direction="none" disabled>Clear sort</button>
  </div>
  <button class="menu-command" type="button" data-reset-filter disabled>Clear filter from “Owner”</button>
  <div class="field">
    <label class="visually-hidden" for="owner-choice-search">Search owner values</label>
    <input id="owner-choice-search" type="search" placeholder="Search" data-value-search disabled>
  </div>
  <input type="hidden" name="owner_values_present" value="1">
  <label class="check filter-all">
    <input type="checkbox" data-select-values checked disabled><span data-select-values-label>Select all owners</span>
  </label>
  <div class="filter-values">
    <label class="check"><input type="checkbox" name="owner_values[]" value="alex" data-filter-value data-label="Alex Morgan" checked> Alex Morgan</label>
    <label class="check"><input type="checkbox" name="owner_values[]" value="sam" data-filter-value data-label="Sam Rivera" checked> Sam Rivera</label>
    <label class="check"><input type="checkbox" name="owner_values[]" value="jordan" data-filter-value data-label="Jordan Lee" checked> Jordan Lee</label>
  </div>
  <p class="hint" data-value-count role="status"></p>
  <p class="hint" data-values-empty hidden>No matching values</p>
</fieldset>
```

Render checked state from the validated query; all checked is unrestricted, a subset matches any selected value (**OR**), and none checked matches no records. Different columns combine with **AND**. The presence marker distinguishes an intentionally empty selection from absent parameters. Clear filter immediately restores all choices. Apply commits checkbox edits; Cancel restores the applied selection.

Applied chips name one or two selected values. Larger selections with only one or two omitted choices read **All except …**; other selections show their count. An empty selection reads **No values selected**. These are summaries of the supplied choices, not different query operators. Open the column menu to inspect or change the complete selection; the chip removes that column's filter.

Keep the applied-filter group quiet beside the results. Each chip has its own remove action; **Clear all filters** appears when two or more column filters are active.

Supply choices from the authorized/eligible collection, including selected values outside the visible page. The example IDs and labels are illustrative. For longer lists, add the optional choice-search hook above; it searches choices, not records. The server must implement these multi-value semantics, validate allowed values, and retain them through paging/retry. Do not silently take only the first submitted value.

#### Searching checkbox values

Search uses case-insensitive literal matches against supplied labels and values. The search input remains focused while matches, counts and selection update.

- Typing selects all matching values and unchecks other values. **Select all search results** and its partial-selection state apply to the matches. Uncheck individual results to refine the selection. Counts report matching and total selected values; zero matches shows **No matching values** and disables the bulk checkbox.
- **Apply** or Enter in the search field replaces this column's value selection with the checked search results. Other columns and sorting are preserved; a changed selection resets pagination.
- When the selection before searching is a nonempty subset, Fieldwork generates **Add current selection to filter**, initially unchecked. Checking it preserves selections outside the search results; inside the results, the checkboxes determine membership. This supports adding matches and removing an already-selected match while keeping other selections.
- Changing the search term selects its new matches. The add option keeps its chosen state for that search session. Clearing the search field restores the pre-search draft and resets the add option. Closing and reopening starts from the confirmed query with an empty search.
- Pending requests block conflicting actions. Failure retains the search text, checked results and add option for retry. Cancel/Escape restores the confirmed selection. **Clear filter** immediately removes the column restriction and resets the search session.

This follows the search-selection behavior illustrated by [MrExcel](https://www.excelarticles.com/excelbook/use_search_while_filtering.html) and the [Microsoft additive-search example](https://learn.microsoft.com/en-us/answers/questions/5077012/using-multi-option-drop-down-in-excel-column). Restoring the pre-search draft when clearing search is Fieldwork's explicit recovery rule.

Search-session controls have no submitted names. The existing named checkboxes, presence marker and callback `values` carry the effective selection; applications continue to execute the same value query. The generated add control is removed and authored labels, visibility and disabled states are restored during cleanup. Native checkbox selection and Apply remain server-rendered.

<a id="project-text-condition"></a>

#### Text conditions

| Label | Value |
| --- | --- |
| Equals | `equals` |
| Does not equal | `not-equals` |
| Begins with | `starts` |
| Ends with | `ends` |
| Contains | `contains` |
| Does not contain | `not-contains` |
| Is blank | `blank` |
| Is not blank | `not-blank` |

Use `any` for **No filter**. Comparisons require non-whitespace text, preserving intentional spaces. Case-insensitive literal comparison is the recommended default; Match case is explicit. Blank means missing, empty, or whitespace-only; text comparisons exclude blank cells, including Does not contain and Does not equal. Applications enforce these semantics in their execution layer or describe deliberate differences.

<a id="budget-number-condition"></a>

#### Numeric conditions

| Label | Value |
| --- | --- |
| Equals | `equals` |
| Does not equal | `not-equals` |
| Greater than | `greater` |
| Greater than or equal to | `greater-equal` |
| Less than | `less` |
| Less than or equal to | `less-equal` |
| Between | `between` |

Use `any` for **No filter**. Between includes both limits; greater/less are strict comparisons and their `-equal` variants include the boundary. Empty/nonfinite amounts and a maximum below the minimum are invalid; zero and equal limits are valid. Shared validation identifies the field, associates a message, and focuses it. Servers validate every submitted value independently.

Compose a numeric fieldset into the same query form and link its column trigger to its ID:

```html
<fieldset class="table-column-fields" id="budget-options" data-table-column="budget" data-label="Budget" data-type="number">
  <legend>Budget</legend>
  <div class="menu-sort">
    <button class="menu-command" type="button" data-sort-direction="ascending" disabled>Sort smallest to largest</button>
    <button class="menu-command" type="button" data-sort-direction="descending" disabled>Sort largest to smallest</button>
    <button class="menu-command" type="button" data-sort-direction="none" disabled>Clear sort</button>
  </div>
  <button class="menu-command" type="button" data-reset-filter disabled>Clear filter from “Budget”</button>
  <div class="field">
    <label for="budget-condition">Number filters</label>
    <select id="budget-condition" name="budget_condition" data-filter-condition>
      <option value="any">No filter</option>
      <option value="equals">Equals</option>
      <option value="not-equals">Does not equal</option>
      <option value="greater">Greater than</option>
      <option value="greater-equal">Greater than or equal to</option>
      <option value="less">Less than</option>
      <option value="less-equal">Less than or equal to</option>
      <option value="between">Between</option>
    </select>
  </div>
  <div class="field" data-when="equals not-equals greater greater-equal less less-equal between">
    <label for="budget-minimum">Amount (CHF)</label>
    <input id="budget-minimum" name="budget_minimum" type="number" step="any" data-filter-minimum>
  </div>
  <div class="field" data-when="between">
    <label for="budget-maximum">Upper amount (CHF)</label>
    <input id="budget-maximum" name="budget_maximum" type="number" step="any" data-filter-maximum>
  </div>
</fieldset>
```

Include `budget:ascending` and `budget:descending` in the native sort select and execute them numerically. Render selected criteria from the application's validated query.

#### Date conditions

Use `data-type="date"` for calendar dates. Compose a fieldset into the query form, with its header trigger linking to the fieldset's ID:

```html
<fieldset class="table-column-fields" id="due-options" data-table-column="due" data-label="Due date" data-type="date">
  <legend>Due date</legend>
  <div class="menu-sort">
    <button class="menu-command" type="button" data-sort-direction="ascending" disabled>Sort oldest to newest</button>
    <button class="menu-command" type="button" data-sort-direction="descending" disabled>Sort newest to oldest</button>
    <button class="menu-command" type="button" data-sort-direction="none" disabled>Clear sort</button>
  </div>
  <button class="menu-command" type="button" data-reset-filter disabled>Clear filter from “Due date”</button>
  <div class="field">
    <label for="due-condition">Date filters</label>
    <select id="due-condition" name="due_condition" data-filter-condition>
      <option value="any">No filter</option>
      <option value="equals">Equals</option>
      <option value="before">Before</option>
      <option value="after">After</option>
      <option value="between">Between</option>
      <option value="today">Today</option>
      <option value="this-week">This week</option>
      <option value="this-month">This month</option>
      <option value="this-quarter">This quarter</option>
      <option value="this-year">This year</option>
      <option value="year-to-date">Year to date</option>
      <option value="period">All dates in the period</option>
    </select>
  </div>
  <div class="field" data-when="equals before after between">
    <label for="due-date">Date</label>
    <input id="due-date" name="due_date" type="date" data-filter-date>
  </div>
  <div class="field" data-when="between">
    <label for="due-end">End date</label>
    <input id="due-end" name="due_end" type="date" data-filter-date-end>
  </div>
  <div class="field" data-when="period">
    <label for="due-period">Month or quarter</label>
    <select id="due-period" name="due_period" data-filter-period>
      <option value="">Choose a period</option>
      <option value="month:01">January</option>
      <option value="quarter:1">Quarter 1</option>
    </select>
  </div>
</fieldset>
```

Supply the periods useful to the application. Include `due:ascending` and `due:descending` in the native sort select and execute them chronologically. Supported conditions:

| Conditions | Input and meaning |
| --- | --- |
| `any` | No date restriction. |
| `equals`, `before`, `after` | One `YYYY-MM-DD` date. Before/after are strict comparisons. |
| `between` | Start and end dates, both inclusive. Equal endpoints are valid; a reversed range is invalid. |
| `yesterday`, `today`, `tomorrow` | Application-resolved relative dates. |
| `last-week`, `this-week`, `next-week` | Application-resolved calendar weeks. |
| `last-month`, `this-month`, `next-month` | Application-resolved calendar months. |
| `last-quarter`, `this-quarter`, `next-quarter` | Application-resolved calendar quarters. |
| `last-year`, `this-year`, `next-year`, `year-to-date` | Application-resolved years or year to the reference date, inclusive. |
| `period` | A selected month or quarter regardless of year, using `data-filter-period`. |

Fieldwork validates required date inputs and range order, shows the relevant fields, and carries date strings or the selected relative condition in the query. Applications own the clock, time zone, week start, calendar interpretation, persistence and query execution. Explain the relevant reference date/time zone and week start near relative choices. For timestamp columns, applications convert calendar boundaries to their time zone and use appropriate timestamp bounds.

Relative queries carry their condition rather than a browser-calculated date. The application resolves that condition when executing the request. Render the confirmed condition and any absolute dates back into the controls, including validation failures.

<a id="enhancement-and-query-contract"></a>

### Client-owned query execution

Use this initializer instead of the native setup above. `applicationLoad` and `renderApplicationRows` are application-owned transport and bounded rendering callbacks:

```js
import { enhanceDataTable } from 'fieldwork/data-table';
const root = document.querySelector('[data-data-table]');
const table = enhanceDataTable(root, {
  async onQueryChange(query, { signal }) {
    const result = await applicationLoad(query, { signal });
    if (signal.aborted || !root.isConnected) return;
    renderApplicationRows(result); // Bounded page, accurate range, and native pager links.
    return { matching: result.matching }; // Optional server-issued { token, total }; null disables all-matching selection.
  },
});
```

Application-owned global search must be combined with this state by the application; it is not added to `query` automatically.

`query` is an independent plain object:

```js
{
  sort: { column: 'budget', direction: 'ascending' }, // or null
  page: { cursor: null, size: 25 }, // Only when pagination controls exist.
  filters: {
    project: { condition: 'contains', value: 'portal', caseSensitive: false, values: null },
    budget: { condition: 'between', value: 10000, upper: 25000, values: ['12400', '18000'] },
    due: { condition: 'between', value: '2026-11-01', upper: '2026-11-30', values: null },
    status: { condition: 'any', values: ['Active'] }
  }
}
```

Only active filters are included. `values: null` is unrestricted; `[]` matches nothing. Lists contain checkbox values, not labels. Conditions and values intersect; columns combine with AND. Text and absolute date values are strings; numeric `value`/`upper` are numbers. Relative date filters carry just their condition and `values`; `period` carries its month/quarter key in `value`. Only one sort is active. Applications own collation, data types, choices, and execution; choices do not represent the complete dataset.

Resolve only after successful rendering; then Fieldwork commits query/indicators, closes the menu, and synchronizes selection. Reject to retain prior rows/query and retryable drafts. Respect the abort signal before DOM mutations; Fieldwork cannot undo adapter side effects. Queries are serialized and conflicting controls/dismissal blocked while pending. Callbacks must eventually settle; adapters own timeouts.

#### Shared interaction

- Apply validates and commits changes; Enter in an ordinary field uses the same submit path. An unchanged draft cannot be applied.
- Cancel, Escape, and outside dismissal discard only the open draft. Reopening starts from the confirmed query.
- Sorting discards the open filter draft and changes only the sort. Clear sort removes ordering, preserving filters.
- Clear filter immediately removes this column's applied condition and value restriction, discarding its open draft and preserving other columns and sort. A changed filter resets pagination. Success closes the menu; failure retains the confirmed query and the attempted clear for retry. Removing a chip also clears that filter immediately. Clear all filters keeps the sort. Failed chip removal keeps the confirmed chip so it can be retried.
- Successful chip removal returns focus to that header; clearing all returns to the first header. Modal closing restores its opener. Feedback is outside the busy query form; announcements describe meaningful transitions without rereading rows.

Initialization is idempotent. `table.query` returns a copy of the confirmed state. `table.isUpdating` reports a pending callback. `table.openColumn(key)` opens a known column, useful for application entry points. `table.refresh({ matching })` binds optional matching-query metadata and synchronizes selection after application-owned row replacement. `table.destroy()` aborts pending callbacks, discards drafts, removes generated UI/listeners, restores native form/header attributes and field locations, and destroys optional selection and column layout. Confirmed values remain in the native controls. Reinitialize after server/Turbo replacement or a cached page return. Page exit aborts the current callback; the adapter must respect its signal. Table configuration and choice lists are fixed per initialization; destroy/reinitialize when changing them.

### Optional column layout

See the [column layout contract](column-layout.md).

### Pagination and large datasets

Render only a bounded page; never download/enumerate all rows to query, select all, or execute bulk work. Applications own efficient data access.

Opt in by adding **both** to the query form:

<!-- fieldwork:fragment -->

```html
<input type="hidden" name="cursor" data-table-cursor value="">
<div class="table-footer">
  <span data-table-result-total>1–25 of 250 projects</span>
  <div class="field table-page-size">
    <label for="project-page-size">Rows per page</label>
    <select id="project-page-size" name="page_size" data-table-page-size>
      <option value="25">25</option><option value="50">50</option><option value="100">100</option>
    </select>
  </div>
  <nav class="cluster" aria-label="Project pages">
    <span aria-disabled="true">Previous</span>
    <a class="button" href="/projects?cursor=next-reference" data-table-page="next-reference">Next</a>
  </nav>
</div>
```

Keep range, page size, and pager together in `.table-footer`, inside the query form. `.field.table-page-size` supplies the inline label/select layout.

Use real pager URLs with `data-table-page="opaque-cursor"`. Omit unavailable links or use disabled buttons/plain text; enhanced `aria-disabled="true"` links also block activation. Ordinary clicks use native query submission or the callback; modified clicks stay native. Render the confirmed range in `[data-table-result-total]` and an optional `[data-table-results-heading]` focus target.

Pagination adds `page: { cursor: string | null, size: number }` to the query object; unpaged tables keep their existing shape. A changed filter, sort, or page size resets the cursor to the first page. Size changes submit immediately with enhancement; the native fallback uses the form's Apply action. Page failures keep the confirmed cursor, rows, filters, and selection available to retry. Duplicate transitions are ignored while pending. Application rendering supplies the next/previous cursors and authoritative range; Fieldwork does not infer an end from a short response.

Validate cursor/query compatibility and bound responses. Exact totals are optional. Use conditions or application-owned remote value search when distinct values cannot be supplied as a bounded list.

### Row selection

See [row selection](row-selection.md) for markup, scope, and lifecycle.
