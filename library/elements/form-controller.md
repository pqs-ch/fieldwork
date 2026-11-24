# Form controller

Assets: [ui.css](../assets/fieldwork/ui.css) · [forms.js](../assets/fieldwork/forms.js).

## Default markup

Use native submission by default; the application's endpoint supplies persistence and server validation.

```html
<form id="settings-form" action="/settings" method="post">
  <!-- Include the application's CSRF token when required. -->
  <fieldset data-form-fields>
    <div class="field">
      <label for="settings-email">Email</label>
      <input id="settings-email" name="email" type="email" required value="alex@example.com">
    </div>
    <div class="form-actions">
      <button class="button" type="reset" hidden>Discard changes</button>
      <button class="button" data-intent="primary" type="submit">Save changes</button>
    </div>
  </fieldset>
</form>
```

## Initialization and cleanup

```js
import { enhanceForm } from 'fieldwork/forms';
const form = document.querySelector('#settings-form');
const editor = enhanceForm(form);
// Before a DOM snapshot: editor.prepareForCache();
// Before removing the form: editor.destroy();
```

Initialization is idempotent. The installed Turbo bridge owns forms rendered by the Rails helper. Initialize/configure application-managed forms here and manage their lifecycle through the API below; reuse bridge-owned state as described next. Without `save`, valid submission stays native. Server errors/hints are preserved; named radios share one error.

[Searchable selects](searchable-select.md) share the form's associated inline error in either initialization order. The form owns validation and correction while enhanced; the picker mirrors its error state and redirects native-field focus to the visible trigger. Generated errors adopted by the form remain associated after controller teardown for native use and remounting.

### Reading an existing controller

`enhanceForm(form)` is idempotent: with a live controller, it returns that same object. To read `hasChanges`, `isSubmitting`, or other public state from a Rails helper form, call it **without options after the installed bridge has mounted the current form**. Install the bridge before application lifecycle listeners, and obtain the controller again from the new form after replacement/restoration.

This is state access, not an ownership transfer. Do not supply new options, cache the controller across replaced forms, or call `destroy()`/`prepareForCache()` on a bridge-owned controller. The bridge owns initialization, submission, result focus, cache preparation, and destruction; application listeners own their own cancellation/cleanup. See the [Rails lifecycle](../rails.md#other-component-lifecycles) and [scoped Cancel example](confirmation.md#rails-cancel-lifecycle).

## Supported scope

A fixed set of text-like inputs, textareas, selects, checkboxes, and radios, using native submission or an optional save callback. Use the opt-in [mixed-form composition](#mixed-forms) when the same form also contains repeatable groups or file queues; the default fixed composition still excludes those fields.

## Behavior and variations

| Option | Default | Meaning |
| --- | --- | --- |
| `composition` | `form.dataset.formComposition` or `"fixed"` | `"mixed"` coordinates the existing repeatable-group and file-selection elements; see [mixed forms](#mixed-forms). |
| `save` | Absent | Optional `save(FormData)` callback; resolve after acknowledged persistence, reject to retain edits. |
| `mode` | `form.dataset.formMode` or `"edit"` | `"create"` changes submission and completion behavior; see [creation mode](#creation-mode). |
| `successMessage` | `"Changes saved."` in edit mode; `"Record created."` in create mode | Confirmed success wording. |

Missing actions/status/errors are generated. A marked `[data-form-fields]` or sole outer fieldset is reused and enabled; otherwise one is generated. Disabled inner controls remain disabled. Populate saved values before initialization. Hidden authenticity/method inputs submit without counting as edits.

Keep editable controls inside the form. The controller tracks descendant inputs, selects and textareas belonging to it. An external control associated through a `form` attribute participates in native submission, but does not participate in the controller’s change tracking or field-error rendering.

### Actions

Defaults are Save changes / Discard changes. A supplied `.form-actions` retains custom controls and receives a missing change indicator. Reset is optional; Cancel is an application link. Submitter attributes are retained; only its action shows progress. Initially disabled actions stay disabled.

Pending wording must describe the submitted action. Set `data-editing-pending-label` on the form for a shared label, or on a submit button to override it for that action. The label appears on the active submitter and in the pending feedback; the original button content is restored after failure or cleanup. For example, a review step can say “Reviewing request…” rather than claiming to create the final record. Without this attribute, the standard Creating/Saving wording remains. Rails forms use the [pending label helper option](../rails.md#helper-options).

Submit actions require changes by default. Add `data-editing-allow-unchanged` to an action such as Save and close when it should also work without edits. Callback FormData includes the chosen submit button's name/value. Rails/Turbo retain their normal submitter handling.

A submitter with native `formnovalidate` skips client validation, for actions such as saving an incomplete draft or returning to a previous step. The application must distinguish the submitted intent and enforce validation before advancing or creating the final record.

With several submit intents, put the normal Save/Continue submit button first in the form's action order. Enter in a single-line field activates the first submit button; it should not unexpectedly choose Save and leave or a `formnovalidate` action. Keep visible and keyboard order consistent.

When fields contain native row or preview submit buttons, place the main action row before those fields. Rails supplies `actions_position: :start`; native HTML can put `.form-actions[data-position="start"]` first inside the marked `[data-form-fields]` fieldset. Put its `.notice[data-form-status][data-position="start"]` immediately before that fieldset, so feedback remains available when fields are disabled. This placement shows compact feedback and suppresses the duplicate change indicator while a result is present. Keep one visible action row for the save scope.

### Saved baseline and server responses

`data-editing-baseline` is JSON keyed by native input name, with arrays of string values (an empty array means an unchecked group). On a failed server response, render attempted values plus the original persisted baseline so Discard does not treat invalid input as saved. Without an explicit baseline, rendered values establish it. Server-rendered `data-editing-result="invalid"` or `"saved"` supplies result/focus state. Render associated field errors and a `[data-form-status]` notice with `data-tone="error"` for failure feedback. Replace the form for new server errors or normalized values.

### Conditional fields after Discard

Discard restores all tracked values, clears errors, and updates feedback before dispatching a bubbling `fieldwork:discarded` event on the form. Listen synchronously to update application-owned visibility, disabled states, or required constraints using the restored values:

```js
form.addEventListener('change', syncConditionalFields);
form.addEventListener('fieldwork:discarded', syncConditionalFields);
```

No input/change events are synthesized. Pristine/busy forms do not emit Discard events. Preventing native reset before Fieldwork handles it vetoes restoration. Hiding/disabling existing controls is supported; changing the tracked set is not.

### Callback-based saving

For a client-owned operation, supply native fields and a save callback. Fieldwork creates the editing shell and associated errors:

```html
<form id="settings-form">
  <fieldset disabled>
    <div class="field">
      <label for="settings-email">Email</label>
      <input id="settings-email" name="email" type="email" required
        value="alex@example.com">
    </div>
  </fieldset>
</form>
<noscript>This form requires JavaScript to save.</noscript>
```

```js
import { enhanceForm } from 'fieldwork/forms';
enhanceForm(document.querySelector('#settings-form'), {
  save: data => persistSettings(data),
});
```

Resolve `persistSettings` only after persistence; reject to retain edits/baseline. Error messages become failure feedback. Field-only forms receive generated actions/status.

## Creation mode

Use the [creation pattern](../patterns/creation.md) for the Rails helper, task workflow, and server-side attempt/retry rules. The markup and callbacks below are for application-managed forms; do not initialize them on forms owned by the installed Turbo bridge.

```html
<form id="create-project" action="/projects" method="post" data-form-mode="create">
  <!-- Application-owned CSRF and attempt references remain ordinary hidden inputs. -->
  <fieldset data-form-fields>
    <div class="field">
      <label for="project-name">Project name</label>
      <input id="project-name" name="project[name]" required maxlength="80">
    </div>
    <div class="form-actions">
      <a class="button" href="/projects">Cancel</a>
      <button class="button" data-intent="primary" type="submit">Create project</button>
    </div>
  </fieldset>
</form>
```

```js
import { enhanceForm } from 'fieldwork/forms';
const form = document.querySelector('#create-project');
const creation = enhanceForm(form); // Reads data-form-mode="create".
// Equivalent: enhanceForm(form, { mode: 'create' }).
// Before a DOM snapshot: creation.prepareForCache();
// Before removing the form: creation.destroy();
```

Without a callback, valid submission remains native; the endpoint validates, creates, and redirects (normally POST → 303 → GET). Supply a specific submit label and Cancel destination; generated actions otherwise use Create record.

The Rails helper renders creation mode with `mode: :create`; the installed Turbo bridge initializes those forms automatically.

### Client-owned creation

Use this initializer instead of the native setup. `applicationCreate`, `renderCreatedRecord`, and `focusCreatedRecordHeading` are supplied by the application:

```js
import { enhanceForm } from 'fieldwork/forms';
const form = document.querySelector('#create-project');
const creation = enhanceForm(form, {
  mode: 'create',
  successMessage: 'Project created.',
  async save(data) {
    const result = await applicationCreate(data);
    // Resolve only after the application has confirmed creation.
    renderCreatedRecord(result);
    focusCreatedRecordHeading();
  },
});
```

The callback receives `FormData`, including the submitter, before controls are disabled. Reject to retain entries/baseline for retry. Resolve after persistence succeeds; the controller marks completion and blocks further submissions, including `requestSubmit()`. Applications own destination rendering and focus.

Follow the creation pattern’s [attempt and retry rules](../patterns/creation.md#rails-default).

### Baseline and completion lifecycle

Use the [form controller’s supported controls](#supported-scope). For file queues and repeatable groups, opt in to [mixed forms](#mixed-forms).

After server failure, retain attempted values/errors and the original defaults through `data-editing-baseline` (Rails `baseline:`). Here the baseline is the initial draft, not a saved record. Keep the same attempt reference across retries; a fresh GET uses rendered defaults.

The [controller API](#controller-api) applies. `hasChanges` compares with initial defaults; `isComplete` reports confirmed creation. Mode is fixed per controller.

Creation states are `ready`, `draft`, `creating`, `created`, and `failed`; validation errors remain draft. `data-form-complete="true"` survives caching/reinitialization and blocks submission. Server-rendered success can set it or `data-editing-result="saved"`. Start another record with a fresh unmarked form.

Destroy before replacement; applications must cancel/ignore late transport side effects and reconcile pending attempts after restoration.

## Controller API

| Member | Contract |
| --- | --- |
| `hasChanges` | Read-only comparison with the saved baseline, including programmatic changes. False after completed creation. |
| `isSubmitting` | Read-only pending-submission state. |
| `isComplete` | Read-only acknowledged creation state. |
| `startSubmission(submitter)` | Enter pending UI for an application-managed valid submission. |
| `finishSubmission({success, message})` | Finish application-managed submission; success advances the baseline, failure retains it. `message` customizes failure feedback. |
| `focusResult()` | Focus rendered result feedback or managed summary after failure. |
| `prepareForCache()` | Preserve the draft and separate baseline for snapshots; remove transient pending/success UI. |
| `destroy()` | Remove listeners and generated behavior before replacement; late callback completion cannot mutate this controller's DOM. |

## Managed error summary

For a longer form using `enhanceForm`, opt in with an authored shell above its fields:

<!-- fieldwork:fragment -->

```html
<div class="error-summary" data-form-error-summary role="region"
     tabindex="-1" aria-labelledby="settings-errors-title" hidden>
  <h2 id="settings-errors-title">Check the details</h2>
  <p>Correct these fields, then save again.</p>
  <ul data-form-error-list></ul>
</div>
<fieldset data-form-fields>
  <!-- Fixed fields and the form's actions. -->
</fieldset>
```

Keep the summary inside the form, with `data-form-error-list`. Inline errors populate one labeled entry per field/radio group; invalid submission focuses the summary. Editing updates/removes entries; Discard clears it. Without opt-in, focus goes to the first invalid field.

The marked list is controller-owned; put general/request errors in the result notice or a separate summary. For server failures, render associated inline errors and matching summary links with `hidden` removed. Enhancement synchronizes from inline errors; `focusResult()` handles `data-editing-result="invalid"`. Do not initialize another summary controller on this shell.

For section grouping and whole-form actions, follow the [editing contract](../patterns/editing.md#longer-forms-group-first-save-together). Mixed forms register their current child fields with this summary; standalone repeatable/file forms use application-owned validation and the standalone summary.

## Mixed forms

Use one multipart form and one action row when ordinary fields, repeatable rows and new files save together. The form owns its repeatable-group and file-selection controllers; do not initialize/destroy those children separately. Application code still owns searchable-select enhancement, remote lookups and any other custom row behavior.

```html
<form id="project-plan" action="/projects" method="post" enctype="multipart/form-data"
      data-form-composition="mixed" data-form-mode="create">
  <!-- Include the application's CSRF token. -->
  <div class="error-summary" data-form-error-summary role="region" tabindex="-1"
       aria-labelledby="plan-errors" hidden>
    <h2 id="plan-errors">Check the project details</h2><ul data-form-error-list></ul>
  </div>
  <fieldset data-form-fields>
    <div class="field"><label for="plan-name">Project name</label><input id="plan-name" name="project[name]" required></div>
    <div data-repeatable-group data-repeat-label="Deliverable">
      <div class="repeatable-list" data-repeat-list></div>
      <template data-repeat-template>
        <fieldset class="repeatable-item" data-repeat-item>
          <legend data-repeat-title>Deliverable</legend>
          <div class="field"><label for="deliverable-__KEY__">Title</label><input id="deliverable-__KEY__" name="deliverables[__KEY__][title]" required></div>
          <button class="button" type="button" data-repeat-remove disabled>Remove deliverable</button>
        </fieldset>
      </template>
      <button class="button" type="button" data-repeat-add disabled>Add deliverable</button>
    </div>
    <div class="file-selection stack" data-file-selection>
      <div class="file-dropzone" data-file-dropzone>
        <label for="plan-files">Supporting files (optional)</label>
        <p class="hint" id="plan-files-hint">Choose files<span data-file-enhanced-hint hidden> or drop them here</span>. Files are sent when you save.</p>
        <input id="plan-files" type="file" name="files[]" multiple aria-describedby="plan-files-hint">
      </div>
      <ul class="file-selection-list" data-file-list aria-label="New files" hidden></ul>
      <template data-file-template><li class="file-selection-item" data-file-item><strong data-file-name></strong><button class="button" type="button" data-file-remove disabled>Remove</button></li></template>
      <p class="hint" data-file-status role="status"></p>
    </div>
    <div class="form-actions"><button class="button" type="reset" hidden>Reset draft</button><button class="button" type="submit">Create project</button></div>
  </fieldset>
</form>
```

```js
import { enhanceForm } from 'fieldwork/forms';
const editor = enhanceForm(document.querySelector('#project-plan'));
// Native submission by default. A save callback remains optional.
// For application-managed views, destroy the form controller before removing it.
```

Rails uses `fieldwork_form_with composition: :mixed, multipart: true`; the installed form bridge owns it. The same mode supports creation and editing. Keep the child [repeatable markup](repeatable-field-groups.md) and [file queue markup](attachments.md#adding-attachments), including optional descriptions, with their owning contracts.

### Scope and ownership

- Repeating groups and file queues are separate, non-nested roots. Keep files in file queues outside repeating rows. Arbitrary DOM changes, nested groups and application-owned persisted-row deletion are outside this composition.
- Structural events register added/removed fields for validation, contextual error summaries and dirty state. Application changes to native required/disabled/readonly states refresh existing visible errors without revealing new errors before submission. Only the fixed fields outside child roots use `data-editing-baseline`; each child supplies its own saved structure and values.
- The form captures FormData before disabling controls. Child actions and drops are blocked while saving. Failed in-place requests keep fields, rows, file objects and descriptions available for retry.
- Discard restores fixed values and the baseline's repeated rows/values. When child values/structure would be discarded, one shared decision covers the whole form. Cancel keeps every draft value; confirmation does not trigger additional queue confirmations. Fixed-only edits retain the existing immediate Discard behavior.
- Confirmed success advances the submitted baseline and clears acknowledged file choices so later edits do not send those files again. Resolve a save callback, or report submission success, only when the entire submission is acknowledged. Partial/uncertain outcomes remain application-owned recovery; do not mark the whole form saved.
- Saved attachments remain application-rendered outside the queue. Native use retains the original fields, server validation and multipart submission; applications supply server actions for adding/removing rows without JavaScript.

### Saved row baseline after a server response

For each repeatable group, render an optional `template[data-repeat-baseline]` containing the saved rows, with their original keys, native values and field names. Without it, initial rendered rows establish the baseline. A rejected mixed form (`data-editing-result="invalid"`) requires this template, even when empty, so attempted rows never silently become saved rows. Use distinct IDs in baseline-template markup while retaining field names and keys:

<!-- fieldwork:fragment -->
```html
<template data-repeat-baseline>
  <fieldset class="repeatable-item" data-repeat-item data-repeat-key="saved-1">
    <legend data-repeat-title>Deliverable</legend>
    <div class="field"><label for="baseline-deliverable-1">Title</label><input id="baseline-deliverable-1" name="deliverables[saved-1][title]" value="Accessibility review" required></div>
    <button class="button" type="button" data-repeat-remove disabled>Remove deliverable</button>
  </fieldset>
</template>
```

Baseline snapshots retain native DOM references and values in memory. `fieldwork:repeat-restored` supplies restored `items` and detached `removed` rows for application-owned enhancement setup/cleanup; `fieldwork:discarded` follows the completed form reset. Use delegated application handlers or remount affected custom controls on structural events. Form mode/composition and the set of child roots are fixed for one controller; replace/remount the form when those change.

### Files, server replacement and navigation

A file queue contains draft browser File objects, not persisted attachment references. After a server response replaces the form, retain other attempted values, render the original fixed/row baselines and explicitly request file reselection, unless the application supplies staged-upload references. A filename cannot reconstruct file contents. Retain textual file notes separately for review/reassociation after reselection, or keep them with application-owned staged uploads; do not silently identify files by name. Stage references are ordinary application-owned hidden controls; do not put saved attachments into the queue.

Mixed forms do not serialize their structural baseline or File objects into Turbo snapshots. Use `<meta name="turbo-cache-control" content="no-cache">` on mixed-form pages and reload authoritative application state on return. If navigation must preserve a longer draft, the application supplies draft/staging storage and protected-exit policy. `prepareForCache()` is cleanup, not a durable mixed-form draft store. Native browser restoration of intact DOM is distinct from a cloned snapshot.

## Application responsibilities

The application owns validation on the server, authorization, persistence, transport, navigation, and callback cancellation/late side effects. The controller does not route or install a global leave guard. Use [unsaved changes](confirmation.md) for a scoped leave decision, or [Rails/Turbo](../rails.md) for its lifecycle bridge. The [editing pattern](../patterns/editing.md) owns user-facing save/discard states; [creation](../patterns/creation.md) owns the new-record workflow.
