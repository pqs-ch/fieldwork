// Import the history hook before Turbo, then install policy after the form bridge.
import { installTurboDraftProtection } from 'fieldwork/turbo-drafts';
import '@hotwired/turbo-rails';
import { installTurboEditing } from 'fieldwork/turbo';
installTurboEditing();
installTurboDraftProtection({ transitions: ['visit', 'history', 'unload'] });

let mounted;
function mount() {
  const form = document.querySelector('#request-step');
  if (mounted?.form !== form) {
    mounted?.events.abort();
    mounted = undefined;
    if (form) {
      const events = new AbortController();
      mounted = { form, events };
      const approach = form.querySelector('[name="entry[approach]"]');
      if (approach) {
        const section = form.querySelector('[data-assessor-fields]'), assessor = section.querySelector('input');
        const sync = () => {
          const independent = approach.value === 'independent';
          section.hidden = !independent;
          assessor.required = independent;
          // Retain an earlier name in the draft when switching back to internal.
          // The server ignores it in the created internal-review record.
        };
        approach.addEventListener('change', sync, { signal: events.signal });
        sync();
      }
    }
  }
  if (document.querySelector('[data-editing-result="invalid"]')) return;
  const target = document.querySelector('[data-result]');
  if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
}
function cleanup() { mounted?.events.abort(); mounted = undefined; }
document.addEventListener('turbo:before-cache', cleanup);
document.addEventListener('turbo:before-render', cleanup);
for (const type of ['turbo:load', 'turbo:render']) document.addEventListener(type, mount);
mount();

// Protect the interval after a Drive decision: further edits must wait for the
// destination, or for a failed request to return control to this draft.
let leavingFields = [];
function restoreVisitFields() {
  for (const [fieldset, disabled] of leavingFields) if (fieldset.isConnected) fieldset.disabled = disabled;
  leavingFields = [];
}
document.addEventListener('turbo:visit', () => {
  restoreVisitFields();
  leavingFields = [...document.querySelectorAll('#request-step [data-form-fields]')]
    .map(fieldset => [fieldset, fieldset.disabled]);
  leavingFields.forEach(([fieldset]) => fieldset.disabled = true);
});
document.addEventListener('turbo:load', restoreVisitFields);
document.addEventListener('turbo:fetch-request-error', restoreVisitFields);
