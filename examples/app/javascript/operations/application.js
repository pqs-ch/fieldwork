import { installTurboDraftProtection } from 'fieldwork/turbo-drafts';
import '@hotwired/turbo-rails';
import { installTurboEditing } from 'fieldwork/turbo';
import { installTurboElements } from 'fieldwork/turbo-elements';
import { enhanceDataTable } from 'fieldwork/data-table';
import { mountWorkViews } from 'operations/work-views';
import { enhanceActionDropdown } from 'fieldwork/action-dropdown';

installTurboEditing();
installTurboElements([
  { selector: '.action-dropdown', mount: enhanceActionDropdown },
  { selector: 'main[data-work-page]', mount(root) {
    if (root.querySelector('[data-editing-result="invalid"]')) return;
    const target = root.querySelector('[data-work-result]');
    if (target) { target.tabIndex = -1; target.focus(); }
  } },
  { selector: '[data-data-table]', mount(root) {
    const table = enhanceDataTable(root);
    const cleanup = mountWorkViews(root.closest('main'), table);
    return () => { cleanup(); table.destroy(); };
  } },
  { selector: '#project-editor', mount(form) {
    const nativeDiscard = form.querySelector('[data-native-discard]');
    if (nativeDiscard) nativeDiscard.hidden = true;
    return () => { if (nativeDiscard) nativeDiscard.hidden = false; };
  } }
]);
installTurboDraftProtection({ transitions: ['visit', 'history', 'unload'] });

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
