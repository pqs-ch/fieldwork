# Dialogs

Assets: [ui.css](../assets/fieldwork/ui.css).

## Default markup

```html
<button class="button" type="button" id="open-review">Review details</button>
<dialog class="dialog" id="review-dialog" aria-labelledby="review-dialog-title">
  <h2 id="review-dialog-title">Review details</h2>
  <p>Check the supplied information before continuing.</p>
  <form method="dialog" class="dialog-actions">
    <button class="button" type="submit" autofocus>Close</button>
  </form>
</dialog>
```

## Initialization and cleanup

```js
const dialog = document.querySelector('#review-dialog');
const lifecycle = new AbortController();
document.querySelector('#open-review').addEventListener('click', () => dialog.showModal(), { signal: lifecycle.signal });
// Before removing/caching this view: lifecycle.abort(); dialog.close();
```

## Behavior and variations

Use a named native `.dialog` for a short task. The dialog spaces its direct content blocks; nested groups use [layout primitives](layout-primitives.md). Place actions in `.dialog-actions`; set `autofocus` on the safest confirmation action or first field. Use [deletion confirmation](deletion-confirmation.md) for deletion.

Applications own open/close handlers, draft retention, submission, and pending/error behavior. There is no generic dialog controller.

## Confirmation coordination

[Deletion](deletion-confirmation.md) and [unsaved-changes](confirmation.md) confirmations share one active decision. They may cover a task dialog; competing confirmation calls resolve `false` without opening another dialog or moving focus. Cancellation restores the connected, enabled opener and leaves the task dialog open.
