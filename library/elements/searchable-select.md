# Searchable select

<a id="searchable-selection"></a>

Assets: [ui.css](../assets/fieldwork/ui.css) · [searchable-select.js](../assets/fieldwork/searchable-select.js).

## Default markup

```html
<div class="field" data-searchable-selection data-search-label="Search people" data-placeholder="Choose an owner">
  <label for="owner">Project owner (optional)</label>
  <select id="owner" name="owner_id" aria-describedby="owner-hint">
    <option value="">No owner</option>
    <option value="42" data-description="Design · Zürich" selected>Alex Morgan</option>
    <option value="87" data-description="Engineering · Basel">Jamie Chen</option>
  </select>
  <p class="hint" id="owner-hint">The person responsible for the project.</p>
</div>
```

## Initialization and cleanup

```js
import { enhanceSearchableSelect } from 'fieldwork/searchable-select';
const root = document.querySelector('[data-searchable-selection]');
const picker = enhanceSearchableSelect(root);
// Before removing/caching this view: picker.destroy();
```

## Supported scope

One or several existing options, using supplied native options or bounded application lookups. Single/multiple mode is fixed from the native select at initialization. No free-text creation, nested result groups or infinite scrolling; the application supplies a native/server fallback for remote choices.

## Behavior and variations

Use searchable select to find existing options; use a native select for a short, scannable list. The single-select trigger shows its committed choice; multiple selection shows a count and a visible list of all selected labels with individual Remove actions. Opening reveals search and bounded results; typing does not change the submitted value. Choosing a result commits its ID. Single-select Clear removes the choice when an enabled empty option exists. Multiple-select Clear removes enabled selections; selected disabled native options remain unchanged. Selection does not save the form. Multiple selection commits each toggle immediately to the native select while leaving search open; Escape closes search without undoing already committed choices.

### Multiple selection

Add `multiple` and an application-owned repeated-value field name. Use the same initializer and lookup callback as single selection:

```html
<div class="field" data-searchable-selection data-label="Reviewers" data-search-label="Search reviewers">
  <label for="reviewers">Reviewers</label>
  <select id="reviewers" name="reviewer_ids[]" multiple required aria-describedby="reviewers-hint">
    <option value="42" selected>Alex Morgan</option>
    <option value="87">Jamie Chen</option>
    <option value="93">Sam Rivera</option>
  </select>
  <p class="hint" id="reviewers-hint">Choose at least one person.</p>
</div>
```

All selections stay visible outside the popup and survive new searches, no-match results and lookup failures. Selecting an already-selected result removes that choice. Individual Remove actions update native selected options and move focus to a neighboring removal action or the trigger. Disabled native options cannot be toggled or removed and follow native submission semantics; the application retains server-authoritative locked values. The listbox exposes `aria-multiselectable` and each result's selected state; changes are announced without saving the form.

Render every committed selected option even when it is not in the first lookup page. Remote options added during search remain in the native select so Save/Discard can restore earlier choices. Unselected lookup options do not make the form dirty. Native `select multiple` submits each selected ID using the same field name; Rails' ordinary hidden input for empty multiple values remains application/Rails-owned.

Use visible selection labels rather than a count alone; long labels wrap. For short lists, a [checkbox group](choice-controls.md#checkboxes) may provide a simpler native choice.

### Markup requirements

| Part | Requirement / option |
| --- | --- |
| Native select | One native select (single or `multiple`) with a unique ID, associated visible label, application field name, and string option IDs. |
| Current value | Render the current choice as a selected option, even when absent from the first result page. |
| Empty value | For single selection, reserve `value=""` for no choice; an enabled empty option enables Clear. Multiple selection requires nonempty option IDs and uses no selected options for an empty value. |
| Validation | Set native `required` as needed and state required/optional in the visible label. Existing errors and descriptions are mirrored to the trigger. |
| Supporting text | Optional `data-description` on local options distinguishes similar names. Disabled options/groups remain unavailable. |
| Contextual name | Optional `data-label` supplies a concise name when the visible label includes extra explanation. |

The native select remains the submitted source of truth. Enhancement visually hides it and routes label/error focus to the trigger. A changed committed choice emits bubbling `input`/`change`; search text has no submitted value and belongs to no form. This preserves `enhanceForm` validation, change tracking, pending fieldsets, and Save/Discard baselines.

Reuse an existing `.field-error` associated by `data-field-error-for` or `aria-describedby`, including the Rails helper's initially hidden error. With `enhanceForm`, the form owns validation messages and correction; the picker mirrors that same error and routes native-field focus to its visible trigger. Either initialization order is supported. Without the form controller, the picker handles native validation itself. Existing server errors remain until correction or reset, and hint/error IDs appear only once in the trigger's descriptions.

Destroy preserves existing error nodes, their current messages and native descriptions. A picker-generated error is removed unless the form controller has adopted it into the native field's `aria-describedby`; adopted errors remain for native use, re-enhancement and Turbo caching. Destroy does not reinstate a server error that the user has already corrected.

### Local and application-supplied results

The default filters supplied labels/descriptions case-insensitively and shows at most 20 results. For larger sets, replace the default initializer below; `applicationLookup` is application-owned:

```js
import { enhanceSearchableSelect } from 'fieldwork/searchable-select';
const root = document.querySelector('[data-searchable-selection]');
const picker = enhanceSearchableSelect(root, {
  async loadOptions(term, { signal }) {
    const result = await applicationLookup(term, { signal });
    return {
      items: result.items, // [{ value: '42', label: 'Alex Morgan', description: 'Design · Zürich', disabled: false }]
      hasMore: result.hasMore,
    };
  },
});
```

| Lookup contract | Requirement / behavior |
| --- | --- |
| Invocation | Empty term on opening, then after 200ms of typing. |
| Response | `items` with unique nonempty string `value` IDs, nonempty `label`, optional string `description`, and optional `disabled` flags. |
| Bound | At most 20 rendered results. `hasMore` or extra returned items asks the user to refine the search. |

Lookups must respect `signal` and eventually settle. A new term, dismissal, disabled control, page exit, or destroy aborts obsolete work; late responses cannot replace current results. Applications own filtering, permissions, bounded transport, timeout policy, and submitted-ID validation.

Choosing a remote result adds/updates its native option. Existing options remain for Discard/native reset; results never remove or silently replace the current selection.

### Result states

| State | Behavior |
| --- | --- |
| Loading | Remove obsolete results and retain the committed choice; never select automatically. |
| Failed | Explain that the choice is unchanged; Retry repeats the failed term. |
| No matches | Suggest changing the search. An empty initial response says no options are available. |

### Keyboard, native behavior, and lifecycle

The trigger names the current choice and opens a dialog containing an editable combobox/listbox. Its native top-layer popup avoids scroll-container clipping and repositions/flips within the viewport. Focus stays in the search field while navigating results.

| Input | Behavior |
| --- | --- |
| Open | Focus the search input. |
| Up/Down | Highlight available results, skipping disabled options. |
| Enter | Commit the highlighted result; in multiple mode toggle it and keep search focused/open. Click/tap does the same. Space remains ordinary search-text entry. |
| Home/End | Ordinary text editing; Alt+Home/End highlights a boundary result. |
| Escape | Close search and return focus to the trigger. Typed search never changes a choice; already committed multiple toggles remain selected. |
| Tab | Follow native popover focus order; leaving the popup dismisses it. |

### Controller API

| Member | Contract |
| --- | --- |
| `open()` | Open the picker. |
| `close(restoreFocus = false)` | Dismiss; optionally return focus to the trigger. |
| `refresh()` | Synchronize after programmatic single-value or native `option.selected` changes. Native `change`, reset, and `fieldwork:discarded` synchronize automatically; disabled/error attributes are observed. |
| `destroy()` | Abort requests, remove generated UI, restore label/attribute associations, and retain committed native options/value. |

Initialization is idempotent. Destroy before removal/cache and initialize after replacement or restoration.

### Native fallback

Without JavaScript or the Popover API, the native select remains usable. For remote choices, render the selected option plus a bounded native fallback; provide server search/selection when further choices must remain accessible without JavaScript. The helper does not fetch fallback options.
