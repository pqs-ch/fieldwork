# Deletion confirmation

Shared implementation: [ui.css](../assets/fieldwork/ui.css) · [confirm-deletion.js](../assets/fieldwork/confirm-deletion.js).

## Initialization and cleanup

Supply the item name, opener, and deletion operation. Prevent the original click or form submission synchronously before awaiting confirmation:

```js
import { confirmDeletion } from 'fieldwork/confirm-deletion';

const viewLifecycle = new AbortController();
const confirmed = await confirmDeletion({
  name: filename,
  description: 'This will delete the attachment and its description from this list.',
  opener: deleteButton,
  signal: viewLifecycle.signal, // Optional application-owned AbortController.
});
if (confirmed) await deleteAttachment(); // Application-owned transport.
```

## Usage

Deletion requires explicit confirmation through this styled dialog or a server-rendered confirmation page. Name the item and describe the actual consequence; do not use `window.confirm()`.

| Option | Usage |
| --- | --- |
| `name`, `description` | Required text, inserted without interpreting HTML. Describe only consequences the application guarantees. |
| `opener` | Defaults to the active element; focus returns there if still connected and enabled. |
| `signal` | Abort when removing or caching the view to cancel and remove the dialog. Page exit also cancels. |
| `action` | Defaults to `'delete'`. Use `'remove'` for draft entries or associations without deleting the underlying item, with an accurate consequence. |

Cancel receives initial focus. The promise resolves to `true` only after Delete (or Remove); Cancel, Escape, and lifecycle cancellation resolve to `false`. Concurrent calls follow [shared confirmation coordination](dialogs.md#confirmation-coordination). Start a fresh confirmation for a retry.

The caller owns requests and data changes; run them only after confirmation. For native/server-rendered use, the initial Delete action navigates to a confirmation page whose confirmed action submits deletion. Keep GET requests side-effect free.
