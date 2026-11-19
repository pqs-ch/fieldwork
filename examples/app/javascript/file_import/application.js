import { installTurboDraftProtection } from 'fieldwork/turbo-drafts';
import { Turbo } from '@hotwired/turbo-rails';
import { installTurboEditing } from 'fieldwork/turbo';
import { enhanceForm } from 'fieldwork/forms';
import { enhanceErrorSummary } from 'fieldwork/error-summary';
installTurboEditing();
installTurboDraftProtection({ transitions: ['visit', 'history', 'unload'] });

let mounted, mountedRoot;
const summaries = new Map();
function cleanup() {
  mounted?.events.abort(); mounted = undefined; mountedRoot = undefined;
  summaries.forEach(controller => controller.destroy()); summaries.clear();
}
function mount() {
  const root = document.querySelector('main');
  if (mountedRoot !== root) { cleanup(); mountedRoot = root; }
  for (const summary of root.querySelectorAll('.error-summary:not([data-form-error-summary]), [data-row-summary]'))
    if (!summaries.has(summary)) summaries.set(summary, enhanceErrorSummary(summary, { focus: false }));
  const form = document.querySelector('#import-upload');
  if (form && mounted?.form !== form) {
    mounted?.events.abort();
    if (form && form.dataset.transport !== 'native') {
      const events = new AbortController(); mounted = { form, events };
      const editor = enhanceForm(form);
      form.dataset.draftSubmit = 'in-place';
      form.addEventListener('submit', async event => {
        if (event.defaultPrevented) return;
        event.preventDefault();
        const data = new FormData(form, event.submitter);
        editor.startSubmission(event.submitter);
        try {
          const response = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: events.signal });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message);
          if (events.signal.aborted) return;
          editor.finishSubmission({ success: true });
          Turbo.visit(result.location);
        } catch (error) {
          if (!events.signal.aborted) editor.finishSubmission({ success: false, message: error.message });
        }
      }, { signal: events.signal });
    }
  }
  if (document.querySelector('[data-editing-result="invalid"]')) return;
  const target = document.querySelector('[data-result]');
  if (target) { target.tabIndex = -1; target.focus(); }
}
document.addEventListener('turbo:before-cache', cleanup);
document.addEventListener('turbo:before-render', cleanup);
for (const type of ['turbo:load','turbo:render']) document.addEventListener(type, mount);
mount();

// Prevent edits after the full-page navigation decision; restore on failure.
let leavingFields = [];
function restoreVisitFields() {
  for (const [fieldset, disabled] of leavingFields) if (fieldset.isConnected) fieldset.disabled = disabled;
  leavingFields = [];
}
document.addEventListener('turbo:visit', () => {
  restoreVisitFields();
  leavingFields = [...document.querySelectorAll('form[data-draft-protection] [data-form-fields]')].map(fieldset => [fieldset, fieldset.disabled]);
  leavingFields.forEach(([fieldset]) => fieldset.disabled = true);
});
document.addEventListener('turbo:load', restoreVisitFields);
document.addEventListener('turbo:fetch-request-error', restoreVisitFields);
