import { installTurboDraftProtection } from 'fieldwork/turbo-drafts';
import '@hotwired/turbo-rails';
import { installTurboEditing } from 'fieldwork/turbo';
import { installTurboElements } from 'fieldwork/turbo-elements';

installTurboEditing();
installTurboElements([
  { selector: 'main', mount(root) {
    const form = root.querySelector('#event-entry');
    const result = root.querySelector('#event-result');
    if (form?.dataset.editingResult !== 'invalid' && result) {
      result.focus({ preventScroll: true });
    }
  } },
  { selector: '#event-entry', mount(form, { signal }) {
    const occurrence = form.querySelector('[data-occurrence-group]');
    if (!occurrence) return;
    function syncOccurrence() {
      const stale = form.querySelector('#event_entry_local_time').value !== occurrence.dataset.localTime ||
        form.querySelector('#event_entry_timezone').value !== occurrence.dataset.timezone;
      occurrence.hidden = stale;
      for (const input of occurrence.querySelectorAll('input[type="radio"]')) {
        input.disabled = stale;
        if (stale) input.checked = false;
      }
      form.querySelector('[data-occurrence-status]').textContent = stale ? 'Review the updated time to resolve its occurrence.' : '';
    }
    form.addEventListener('input', syncOccurrence, { signal });
    form.addEventListener('change', syncOccurrence, { signal });
    syncOccurrence();
  } }
]);
installTurboDraftProtection({ transitions: ['visit', 'unload'] });

// Lock editing after the Drive decision until navigation settles or fails.
let leavingFields = [];
function restoreVisitFields() {
  for (const [fieldset, disabled] of leavingFields) {
    if (fieldset.isConnected) fieldset.disabled = disabled;
  }
  leavingFields = [];
}
document.addEventListener('turbo:visit', () => {
  restoreVisitFields();
  leavingFields = [...document.querySelectorAll('form[data-draft-protection] [data-form-fields]')]
    .map(fieldset => [fieldset, fieldset.disabled]);
  for (const [fieldset] of leavingFields) fieldset.disabled = true;
});
document.addEventListener('turbo:load', restoreVisitFields);
document.addEventListener('turbo:fetch-request-error', restoreVisitFields);
