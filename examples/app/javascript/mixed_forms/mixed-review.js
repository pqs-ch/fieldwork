import { enhanceForm } from 'fieldwork/forms';
import { enhanceSearchableSelect } from 'fieldwork/searchable-select';
import { installTurboElements } from 'fieldwork/turbo-elements';
export function mountMixedReview() {
  installTurboElements([{selector:'[data-searchable-selection]',mount(root) {
    return enhanceSearchableSelect(root, root.hasAttribute('data-people-lookup') ? {async loadOptions(term,{signal}) {
      const response=await fetch(`/mixed-forms/mixed-form/people?q=${encodeURIComponent(term)}`,{signal});
      if (!response.ok) throw new Error('Lookup failed');
      return response.json();
    }} : {});
  }}, {selector:'#project-brief',mount(form,{signal}) {
    function syncDates() {
      const required = form.querySelector('#dates-required').checked;
      for (const field of form.querySelectorAll('[data-repeat-list] input[type="date"]')) {
        field.required = required;
        field.labels[0].textContent = required ? 'Due date' : 'Due date (optional)';
      }
    }
    for (const type of ['change', 'fieldwork:repeat-added', 'fieldwork:repeat-restored', 'fieldwork:discarded'])
      form.addEventListener(type, syncDates, { signal });
    syncDates();
    form.addEventListener('fieldwork:discarded', () => form.querySelector('[data-file-reselection]')?.remove(), { signal });
    if (form.dataset.reviewTransport !== 'callback') return;
    const editor = enhanceForm(form);
    form.addEventListener('submit', async event => {
      if (event.defaultPrevented) return;
      event.preventDefault();
      const data = new FormData(form, event.submitter);
      editor.startSubmission(event.submitter);
      try {
        const response = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        if (signal.aborted) return;
        form.querySelector('[data-file-reselection]')?.remove();
        const list = document.querySelector('#saved-attachments');
        list.replaceChildren(...result.attachments.map(file => {
          const item = document.createElement('li'); item.className = 'attachment';
          const content = document.createElement('div');
          const name = document.createElement('strong'); name.textContent = file.name;
          const description = document.createElement('p'); description.textContent = file.description;
          content.append(name, description); item.append(content); return item;
        }));
        editor.finishSubmission({ success: true });
      } catch (error) {
        if (!signal.aborted) editor.finishSubmission({ success: false, message: error.message });
      }
    }, { signal });
  }}, {selector: 'main', mount(root) {
    const result = root.querySelector('#project-brief')?.dataset.editingResult;
    if (result === 'invalid' || result === 'saved') return;
    root.querySelector('[autofocus]')?.focus({ preventScroll: true });
  }}]);
}
