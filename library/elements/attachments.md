# Attachments

Assets: [ui.css](../assets/fieldwork/ui.css). Optional behavior is linked below.

## Default markup

```html
<ul class="attachment-list" aria-label="Attachments">
  <li class="attachment">
    <div class="attachment-content">
      <a href="/attachments/123/download" download>project-brief.txt</a>
      <p class="hint">2 KB · <time datetime="2026-10-17T08:30:00Z">17 Oct 2026, 08:30 UTC</time></p>
    </div>
  </li>
</ul>
```

## Usage

Replace sample URLs and metadata; use [local timestamps](local-timestamps.md). Add `data-density="standard"` for more spacing. Follow [record details](../patterns/record-details.md#related-information) for placement and [history](../patterns/record-details.md#history) for related events.

[Linked supporting material](#linked-supporting-material) · [Description editing](#description-editing) · [Deletion](#deletion-and-states) · [File selection](#adding-attachments)

For file-type cues, use the [bundled icons](icons.md#choosing-icons) beside the filename. The application supplies the type; keep unknown types generic.

## Optional descriptions and actions

Add these parts inside `li.attachment`. Omit an empty description and label its edit action **Add description for …**:

<!-- fieldwork:fragment -->

```html
<div class="attachment-actions" role="group" aria-label="Actions for project-brief.txt">
  <a class="button" data-variant="quiet" data-icon-only href="/attachments/123/edit"
    aria-label="Edit description for project-brief.txt" title="Edit description for project-brief.txt">
    <span class="icon" data-icon="pencil" aria-hidden="true"></span>
  </a>
  <form action="/attachments/123/delete-confirmation" method="get">
    <!-- Opens a server confirmation page; this GET must not delete anything. -->
    <button class="button" data-variant="quiet" data-intent="danger" data-icon-only
      type="submit" aria-label="Delete project-brief.txt" title="Delete project-brief.txt">
      <span class="icon" data-icon="trash" aria-hidden="true"></span>
    </button>
  </form>
</div>
<div class="attachment-details">
  <div class="attachment-description">
    <p>Goals, scope, and milestones for the website refresh.</p>
  </div>
</div>
```

## Linked supporting material

For the coordinated upload/reuse journey, follow [supporting evidence](../patterns/supporting-evidence.md). Reuse attachment presentation when a saved original supports another record. Keep its source/date metadata separate from the explanation for this use:

```html
<ul class="attachment-list" aria-label="Supporting evidence">
  <li class="attachment">
    <div class="attachment-content">
      <a href="/evidence/123/download" download>account-export.csv</a>
      <p class="hint">Access inventory · Evidence date: 20 October 2026</p>
    </div>
    <div class="attachment-actions">
      <a class="button" data-variant="quiet" href="/accounts/42/evidence/123/removal"
        aria-label="Remove link to account-export.csv">Remove link</a>
    </div>
    <div class="attachment-details">
      <p>Identifies this account and its recorded owner.</p>
      <a href="/evidence/123">Original and other uses</a>
    </div>
  </li>
</ul>
```

**Remove link** opens a scoped confirmation; it must not imply deletion or withdrawal of the original. Put original management at its source, subject to application permissions. Omit local editing/removal actions for a read-only historical reference.

When a download is unavailable or an original is withdrawn, render the retained filename as text and explain why it cannot be downloaded. Keep source metadata and the recorded explanation visible. Applications supply availability, reference history and the effect of changes on assessments; this markup stores or evaluates no evidence.

## Description editing

Place a fixed-field editor in `.attachment-details`, separate from deletion:

```html
<form id="attachment-description-form" action="/attachments/123/description" method="post">
  <div class="field">
    <label for="attachment-description">Description</label>
    <textarea id="attachment-description" name="description" rows="3">Goals and milestones.</textarea>
  </div>
  <div class="form-actions">
    <a class="button" data-variant="quiet" href="/attachments/123">Cancel</a>
    <button class="button" data-intent="primary" type="submit">Save</button>
  </div>
</form>
```

```js
import { enhanceForm } from 'fieldwork/forms';
// Native/server submission. For client-owned saving, supply the existing save callback.
const editor = enhanceForm(document.querySelector('#attachment-description-form'));
// editor.destroy() before application-owned replacement/cache cleanup.
```

Use the [form controller](form-controller.md) for native submission or a save callback. Application code opens/closes editing and disables Delete while editing. Failed saves retain the draft; Cancel restores the saved description and returns focus to the edit action. An empty saved description returns to Add description.

## Deletion and states

- Open [styled confirmation](deletion-confirmation.md) before every deletion attempt, including retries. Cancel/Escape leaves the file unchanged.
- While deleting, prevent duplicates and show accessible progress. Remove the row only after success, announce the result, and focus a neighboring file or the empty list's heading.
- On failure, keep the row/description and offer Retry delete. Unavailable downloads show the filename as text with an explanation.

The application supplies authorization, persistence, and accurate consequences.

## Adding attachments

Use a visible drop zone with a native file chooser for uploads and imports by default. Dragging is convenient for desktop users who already have a file at hand; the chooser remains essential for keyboard, touch, and native use. Selection is a draft until the application confirms upload or import.

For frequent or supporting file intake, `.file-dropzone[data-density="compact"]` provides a smaller, left-aligned area. Keep the visible label, selection/submission guidance and native chooser; an upload icon is optional. Use the default larger area when extra drop space helps the task.

Use a multipart form for unsaved file choices. For a standalone queue, initialize it below; for one save scope containing other fields or repeatable rows, use the [mixed-form composition](form-controller.md#mixed-forms), which owns queue initialization and reset. Do not attach a fixed-form or repeatable-group controller to the queue:

```html
<form action="/attachments" method="post" enctype="multipart/form-data">
  <div class="file-selection stack" data-file-selection>
    <div class="file-dropzone" data-file-dropzone>
      <span class="icon" data-icon="upload" aria-hidden="true"></span>
      <label for="files">Add files</label>
      <p class="hint" id="files-hint">Choose files<span data-file-enhanced-hint hidden> or drag and drop them here</span>. Review your selection before uploading.</p>
      <input id="files" type="file" name="files[]" multiple required aria-describedby="files-hint">
    </div>
    <p class="hint" data-file-empty>No files selected.</p>
    <ul class="file-selection-list" data-file-list aria-label="Files selected for upload" hidden></ul>
    <template data-file-template>
      <li class="file-selection-item" data-file-item>
        <div class="file-selection-item-header">
          <div><strong data-file-name></strong><p class="hint" data-file-size></p></div>
          <button class="button" data-variant="quiet" type="button" data-file-remove disabled>Remove</button>
        </div>
        <div class="field">
          <label for="description-__KEY__">Description (optional)</label>
          <textarea id="description-__KEY__" name="descriptions[]" data-file-description rows="2"></textarea>
        </div>
      </li>
    </template>
    <button class="button" type="button" data-file-clear disabled>Clear selection</button>
    <p class="hint" data-file-status role="status"></p>
  </div>
  <button class="button" type="submit">Upload files</button>
</form>
```

```js
import { enhanceFileSelection } from 'fieldwork/file-selection';
const root = document.querySelector('[data-file-selection]');
const queue = enhanceFileSelection(root);
// Before removing/caching this view: queue.destroy();
// Omit submission interception for native multipart forms, including application-owned Turbo handling.
```

### Queue requirements

- Keep exactly one named file input, an empty list (or table body), and a template with `data-file-item`, `data-file-name`, and Remove. Template IDs and matching label/ARIA references use `__KEY__`.
- Use `multiple` for an additive queue; omit it for a single-file choice. A single-file choice replaces the previous file and its draft description, matching native chooser behavior; dropping several files rejects the batch and preserves the previous selection.
- Size, description, Clear, empty/status text, and the decorative icon are optional. Pair `files[]` and `descriptions[]` by display order, keeping a description field even when blank. Field names are application-owned.
- In a multiple queue, choosing/dropping appends files, preserving descriptions; duplicate filenames remain separate. Keep the native chooser visible, labeled, and keyboard accessible. Saved files do not belong in the queue.
- `data-file-dropzone` scopes dropping and drag feedback to the intake area, leaving queued controls outside the target. Older markup without it uses the queue root. Show `data-file-enhanced-hint` only after successful enhancement; never hide the input or require dragging.
- Use `accept` for the application's supported extensions/MIME types. Enhancement checks both picked and dropped files against it, rejecting an entire mismatching batch with an inline status and preserving the queue. A MIME rule requires a matching browser-supplied type; include extensions when necessary. The application still owns size/count limits, content checks, and server validation. State its requirements beside the input and associate errors using `aria-describedby`.
- Use a persistent `data-file-status` with `role="status"` for selection feedback. Do not label local choices as uploaded or show invented progress.

The helper synchronizes native `input.files`, so multipart/FormData submits the displayed queue. It does not upload files.

### Single-file import

Omit `multiple` for one document or import source. Use the same initializer and lifecycle as above. These sample CSV constraints belong to the application:

```html
<form action="/imports" method="post" enctype="multipart/form-data">
  <div class="file-selection stack" data-file-selection>
    <div class="file-dropzone" data-file-dropzone>
      <label for="import-file">Import records</label>
      <p class="hint" id="import-hint">Choose a CSV file<span data-file-enhanced-hint hidden> or drag and drop it here</span>. Review records before importing.</p>
      <input id="import-file" type="file" name="source" accept=".csv,text/csv" required aria-describedby="import-hint">
    </div>
    <p class="hint" data-file-empty>No file selected.</p>
    <ul class="file-selection-list" data-file-list aria-label="Selected import file" hidden></ul>
    <template data-file-template>
      <li class="file-selection-item" data-file-item>
        <div class="file-selection-item-header">
          <div><strong data-file-name></strong><p class="hint" data-file-size></p></div>
          <button class="button" data-variant="quiet" type="button" data-file-remove disabled>Remove</button>
        </div>
      </li>
    </template>
    <p class="hint" data-file-status role="status"></p>
  </div>
  <button class="button" type="submit">Review import</button>
</form>
```

Follow the [file-import pattern](../patterns/file-imports.md) for coordinated upload, mapping, validation, review and outcomes. The application parses the file and supplies final import actions. Choosing a file does not start an import.

### Table review

For batches where comparing filenames and sizes helps, replace the list and template with a semantic table. Reuse [table styling and overflow](data-table.md#behavior-and-variations), including [tables.css](../assets/fieldwork/tables.css); no data-table controller is needed. `data-file-list` goes on the empty `tbody`. The optional `data-file-list-container` hides its table headers and scroll region while empty. Keep the template outside the table:

```html
<form action="/attachments" method="post" enctype="multipart/form-data">
  <div class="file-selection stack" data-file-selection>
    <div class="file-dropzone" data-file-dropzone>
      <label for="batch-files">Add files</label>
      <p class="hint" id="batch-hint">Choose files<span data-file-enhanced-hint hidden> or drag and drop them here</span>. Review the batch before uploading.</p>
      <input id="batch-files" type="file" name="files[]" multiple required aria-describedby="batch-hint">
    </div>
    <p class="hint" data-file-empty>No files selected.</p>
    <div class="table-panel" data-file-list-container hidden>
      <div class="table-scroll" role="region" aria-label="Selected files" tabindex="0">
        <table class="data-table">
          <caption>Files selected for upload</caption>
          <thead><tr>
            <th scope="col" data-wrap="wrap">File</th>
            <th scope="col" data-align="number" data-wrap="nowrap">Size</th>
            <th scope="col">Action</th>
          </tr></thead>
          <tbody data-file-list></tbody>
        </table>
      </div>
    </div>
    <template data-file-template>
      <tr data-file-item>
        <td data-wrap="wrap"><strong data-file-name></strong></td>
        <td data-align="number" data-wrap="nowrap" data-file-size></td>
        <td><button class="button" data-variant="quiet" type="button" data-file-remove disabled>Remove</button></td>
      </tr>
    </template>
    <button class="button" type="button" data-file-clear disabled>Clear selection</button>
    <p class="hint" data-file-status role="status"></p>
  </div>
  <button class="button" type="submit">Upload files</button>
</form>
```

Add application-owned per-file validation or measured upload status columns only when the workflow needs them. Keep any description fields in the row template and use the same ordered pairing as the list queue.

### Queue API

| Member / event | Use |
| --- | --- |
| `queue.files` | Copy of `{ key, file, description }` entries with actual `File` objects. Keys identify UI entries. |
| `fieldwork:fileschange` | Bubbles with `detail.files` after file/description changes. |
| `queue.clear(opener)` | Confirms, then resolves whether clearing occurred. Native reset also confirms. |
| `queue.setBusy(boolean)` | Disables/restores queue controls without clearing values. |
| `queue.captureState()` / `queue.restoreState(state)` | Opaque in-memory snapshots of native files, row nodes and description values from this live controller only; restoration does not ask for confirmation. Owned by the mixed form when composed. |
| `queue.emptyState` | Empty snapshot for acknowledged-file clearing or coordinated Discard. Never persist snapshots or serialize them as upload references. |
| `queue.destroy()` | Cancels confirmations, removes listeners, restores availability, and retains native files/rows/descriptions. |

Remove/Clear use shared confirmation and affect only queued files. Cancel preserves values and focus; removal focuses a neighboring Remove action or the chooser when empty.

## Upload states and application responsibilities

Capture FormData or `queue.files` **before** `setBusy(true)`. Applications own validation, upload transport, and storage:

- **Uploading:** prevent duplicate submission; report [labeled progress](feedback.md#progress) only from transport measurements. Keep status/errors outside busy regions.
- **Failed:** call `setBusy(false)`, retain the queue, and offer recovery. Reconcile unknown outcomes before retry; partial success retries only unacknowledged/failed files. `accept` does not replace server validation; associate file errors with their rows.
- **Succeeded:** render acknowledged saved attachments and a fresh intake form or Add more files action.

Initialization is idempotent. Destroy before replacement/cache; reinitialization on intact DOM reuses native files and rows. Applications own cancellation of running uploads. Reload/navigation can lose `File` objects; filenames cannot reconstruct them, so request reselection or use application-owned staged uploads. Turbo snapshots clone markup without its native file selections: for an intake page, use `<meta name="turbo-cache-control" content="no-cache">` in the application layout, or replace the queue with a fresh intake form before caching. Never restore queued filenames as though the files were retained.

Without JavaScript or DataTransfer/FileList assignment, the native chooser still submits files. Unenhanced descriptions require file/description pairs or a server review step.
