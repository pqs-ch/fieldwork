# Unsaved-changes confirmation

<a id="unsaved-changes"></a>

Assets: [ui.css](../assets/fieldwork/ui.css) · [confirm-unsaved-changes.js](../assets/fieldwork/confirm-unsaved-changes.js).

## Initialization and cleanup

Confirm transitions that would lose edits. Pristine or reliably retained drafts need no prompt. `editor.hasChanges` compares current tracked values with the baseline; `isSubmitting` reports pending work.

```js
import { enhanceForm } from 'fieldwork/forms';
import { confirmUnsavedChanges } from 'fieldwork/confirm-unsaved-changes';
const form = document.querySelector('#settings-form'); // The owning application's form.
const editor = enhanceForm(form); // Reuse state after the bridge mounts a Rails helper form; no options.
async function mayLeave(opener, signal) {
  if (editor.isSubmitting) return false; // This application's policy: wait for the save result.
  if (!editor.hasChanges) return true;
  const approved = await confirmUnsavedChanges({ name: 'Settings', opener, signal });
  return approved && form.isConnected && !signal?.aborted && !editor.isSubmitting;
}
```

For bridge-owned forms, follow [reading an existing controller](form-controller.md#reading-an-existing-controller); the bridge retains lifecycle ownership. Synchronously suspend navigation before awaiting, then recheck view lifetime, destination, and submission state before resuming. Preserve modified clicks and other browsing contexts.

`confirmUnsavedChanges({ name, opener, signal })` requires a nonempty task name. It resolves `true` only after **Leave without saving**. **Keep editing** receives initial focus; Escape, page exit, or signal abort resolves `false`, removes the dialog, and recovers focus to a connected opener. Concurrent calls follow [shared confirmation coordination](dialogs.md#confirmation-coordination). Abort before removing/caching the view.

## Supported scope

Confirmation only: no saving, reset, request cancellation, navigation, global guard, or browser-close protection. Applications own transition hooks and pending-save policy; leaving does not cancel a save. See [Editing](../patterns/editing.md#leaving-the-editor).

## Guarding a native Cancel link

This application-owned adapter protects one exit link:

```js
import { confirmUnsavedChanges } from 'fieldwork/confirm-unsaved-changes';

function guardCancelLink({ form, editor, link, name, signal, navigate = url => window.location.assign(url) }) {
  let pending = false;
  link.addEventListener('click', async event => {
    const target = link.target || document.querySelector('base[target]')?.target || '_self';
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey || target.toLowerCase() !== '_self' ||
        link.hasAttribute('download')) return;
    if (pending || editor.isSubmitting) {
      event.preventDefault();
      return;
    }
    if (!editor.hasChanges) return; // Keep ordinary native navigation.
    event.preventDefault(); // Suspend synchronously, before awaiting anything.
    const destination = link.href;
    pending = true;
    try {
      const approved = await confirmUnsavedChanges({ name, opener: link, signal });
      if (approved && !signal.aborted && form.isConnected && link.isConnected &&
          link.href === destination && !editor.isSubmitting) {
        navigate(destination);
      }
    } finally {
      pending = false;
    }
  }, { signal });
}
```

The adapter protects this link only. Native use keeps the default `window.location.assign`; Rails/Turbo use passes a navigator as shown below. Without enhancement the link navigates normally. Abort its signal before replacement/cache; the caller owns that signal, while the form's lifecycle owner still prepares/destroys the form controller.

### Rails Cancel lifecycle

Use this when leaving through a specific Cancel link would lose a draft. Give the Rails helper form an application-chosen `id: "settings-form"`. Author its Cancel link in [custom actions](../rails.md#custom-actions) with `id: "cancel-settings"`, omitting the helper's `cancel:` option to avoid a second link. The link must be an ordinary same-origin full-page destination (or `_top` from a Frame), not a download, a Turbo-method action, or navigation targeting another Frame.

Put the `guardCancelLink` function above in the same application module as this setup. Place this setup directly after the installed `installTurboEditing()` call in `application.js`, or export a setup function from a separate module and invoke it after that call. A static import alone does not establish this order. Do not call the installer again:

```js
import { Turbo } from '@hotwired/turbo-rails';
import { enhanceForm } from 'fieldwork/forms';

let mountedCancel;
function unmountCancel() {
  mountedCancel?.events.abort();
  mountedCancel = undefined;
}
function mountCancel() {
  if (document.documentElement.hasAttribute('data-turbo-preview')) return;
  const form = document.querySelector('#settings-form');
  const link = form?.querySelector('#cancel-settings');
  if (mountedCancel?.form === form && mountedCancel?.link === link) return;
  unmountCancel();
  if (!form || !link) return;
  const editor = enhanceForm(form); // Read the live bridge-owned controller.
  const events = new AbortController();
  guardCancelLink({ form, editor, link, name: 'Profile details', signal: events.signal,
    navigate: destination => Turbo.visit(destination) });
  mountedCancel = { form, link, events };
}
document.addEventListener('turbo:before-cache', unmountCancel);
document.addEventListener('turbo:before-render', unmountCancel);
document.addEventListener('turbo:render', mountCancel);
document.addEventListener('turbo:load', mountCancel);
mountCancel();
```

The live form/link check prevents duplicate listeners on render/load. Failed full-page submissions remount the guard on `turbo:render`; neither mounting nor cleanup takes focus from form errors/results. This setup covers Drive/body replacement. For a guard inside a Frame or a Stream-replaced root, apply the [affected-root lifecycle rules](../rails.md#other-component-lifecycles) and mount it against the new form after the bridge has connected it.

### Broader navigation and browser close

A scoped Cancel guard does not protect every link, Back/Forward, redirects, or browser close. Choose those policies only when the task needs them and drafts would actually be lost; keep reliably retained drafts free of unnecessary prompts. Intercept the relevant application/Turbo transition synchronously and resume the captured destination only after approval and lifetime checks. Do not turn this example into document-wide click interception by default.

Browser-close/reload protection uses the browser's native `beforeunload` prompt and remains an explicit application policy, separate from this dialog. If added, install/remove it with the view lifecycle and enable it only while a draft would be lost. Coordinate it with approved exits so a single confirmed exit does not produce a second prompt; confirmation must not globally disable protection for later edits. Do not add an independent `beforeunload` handler merely to use the Cancel adapter.

For explicit application-wide Rails/Turbo protection, use the separate [opt-in draft adapter](../rails.md#draft-protection). It coordinates transition hooks around this confirmation; importing the confirmation alone still installs no navigation guard.
