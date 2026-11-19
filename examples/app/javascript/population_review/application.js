import { installTurboDraftProtection } from 'fieldwork/turbo-drafts';
import { Turbo } from '@hotwired/turbo-rails';
import { installTurboEditing } from 'fieldwork/turbo';
import { installTurboElements } from 'fieldwork/turbo-elements';
import { localizeTimestamps } from 'fieldwork/local-time';
import { enhanceForm } from 'fieldwork/forms';
import { enhanceSearchableSelect } from 'fieldwork/searchable-select';

installTurboEditing();
installTurboElements([
  { selector: 'main', mount(root) {
    localizeTimestamps(root);
    const form = root.querySelector('#review-entry, #evidence-form');
    const result = root.querySelector('#review-result');
    if (form?.dataset.editingResult !== 'invalid' && result) {
      result.focus({ preventScroll: true });
    }
  } },
  { selector: '[data-searchable-selection]', mount(root) {
    return enhanceSearchableSelect(root);
  } },
  { selector: '[data-evidence-upload="true"]', mount(form, { signal }) {
    const editor = enhanceForm(form); // The bridge retains ownership.
    form.dataset.draftSubmit = 'in-place';
    form.addEventListener('submit', async event => {
      if (event.defaultPrevented) return;
      event.preventDefault();
      const data = new FormData(form, event.submitter);
      editor.startSubmission(event.submitter);
      try {
        const response = await fetch(form.action, {method: 'POST', body: data, headers: {Accept: 'application/json'}, signal});
        const result = await response.json();
        if (signal.aborted) return;
        if (!response.ok) {
          editor.finishSubmission({success: false, message: result.message});
          return;
        }
        editor.finishSubmission({success: true});
        Turbo.visit(result.location);
      } catch {
        if (!signal.aborted) editor.finishSubmission({success: false, message: 'The result could not be confirmed. Your file selection is retained. Retry this submission to check its outcome.'});
      }
    }, {signal});
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
