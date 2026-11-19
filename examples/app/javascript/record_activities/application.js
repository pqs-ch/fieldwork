import { installTurboDraftProtection } from 'fieldwork/turbo-drafts';
import '@hotwired/turbo-rails';
import { installTurboEditing } from 'fieldwork/turbo';
import { installTurboElements } from 'fieldwork/turbo-elements';
import { localizeTimestamps } from 'fieldwork/local-time';

installTurboEditing();
installTurboElements([
  { selector: 'main', mount(root) {
    localizeTimestamps(root);
    const form = root.querySelector('#activity-form');
    const result = root.querySelector('#record-result');
    if (form?.dataset.editingResult !== 'invalid' && result) {
      result.focus({ preventScroll: true });
    }
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
