// Import the inert history hook before Turbo's window history observer.
import { installTurboDraftProtection } from 'fieldwork/turbo-drafts';
import '@hotwired/turbo-rails';
import { installTurboEditing } from 'fieldwork/turbo';
import { enhanceForm } from 'fieldwork/forms';

const reminderKey = 'fieldwork-draft-example:reminder';
function reminderRetained(form) {
  if (form.id !== 'reminder') return false;
  try { return localStorage.getItem(reminderKey) === form.querySelector('textarea').value; }
  catch { return false; }
}
installTurboEditing();
installTurboDraftProtection({ transitions: ['visit', 'frame', 'history', 'unload'], isRetained: reminderRetained });

const mounted = new Map();
function mount() {
  for (const [form, events] of mounted) if (!form.isConnected) { events.abort(); mounted.delete(form); }
  const reminder = document.querySelector('#reminder');
  if (reminder && !mounted.has(reminder)) {
    const events = new AbortController(); mounted.set(reminder, events);
    reminder.closest('[data-browser-reminder]').hidden = false;
    const field = reminder.querySelector('textarea'), status = document.querySelector('#reminder-status');
    try { field.value = localStorage.getItem(reminderKey) || ''; } catch { /* Display retention failure below. */ }
    const persist = () => {
      try { localStorage.setItem(reminderKey, field.value); status.textContent = 'Saved in this browser.'; }
      catch { status.textContent = 'Browser storage is unavailable. Keep this page open to retain your reminder.'; }
    };
    reminder.addEventListener('submit', event => {
      event.preventDefault();
      persist();
      if (reminderRetained(reminder)) { const editor = enhanceForm(reminder); editor.startSubmission(event.submitter); editor.finishSubmission({ success: true }); }
    }, { signal: events.signal });
    reminder.addEventListener('fieldwork:discarded', persist, { signal: events.signal });
    if (reminderRetained(reminder)) { const editor = enhanceForm(reminder); editor.startSubmission(); editor.finishSubmission({ success: true }); }
    status.textContent = reminderRetained(reminder) ? 'Saved in this browser.' : 'Not saved in this browser.';
  }
  const form = document.querySelector('#brief');
  if (form && !mounted.has(form)) {
    const events = new AbortController(); mounted.set(form, events);
    if (form.dataset.transport !== 'native') {
      form.dataset.draftSubmit = 'in-place';
      const editor = enhanceForm(form);
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
          document.querySelector('[data-upload-result]').textContent = result.upload_message || '';
        } catch (error) {
          if (!events.signal.aborted) editor.finishSubmission({ success: false, message: error.message });
        }
      }, { signal: events.signal });
    }
  }
}
function cleanup() { mounted.forEach(events => events.abort()); mounted.clear(); }
document.addEventListener('turbo:before-cache', cleanup);
document.addEventListener('turbo:before-render', cleanup);
for (const type of ['turbo:load', 'turbo:frame-load']) document.addEventListener(type, mount);
mount();

// Drive decisions happen at visit start. This app prevents further editing
// while a full-page visit is pending; Frame responses use the late render guard.
let leavingFields = [];
function restoreVisitFields() {
  for (const [fieldset, disabled] of leavingFields) if (fieldset.isConnected) fieldset.disabled = disabled;
  leavingFields = [];
}
document.addEventListener('turbo:visit', () => {
  restoreVisitFields();
  leavingFields = [...document.querySelectorAll('form[data-draft-protection] [data-form-fields]')]
    .map(fieldset => [fieldset, fieldset.disabled]);
  leavingFields.forEach(([fieldset]) => fieldset.disabled = true);
});
document.addEventListener('turbo:load', restoreVisitFields);
document.addEventListener('turbo:fetch-request-error', restoreVisitFields);
