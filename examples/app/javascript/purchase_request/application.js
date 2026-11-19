import { installTurboDraftProtection } from 'fieldwork/turbo-drafts';
import '@hotwired/turbo-rails';
import { installTurboEditing } from 'fieldwork/turbo';
import { installTurboElements } from 'fieldwork/turbo-elements';
import { purchaseEnhancements } from 'purchase_request/purchase-enhancements';
installTurboEditing();
installTurboElements(purchaseEnhancements);
// Render guards register after lifecycle wrappers, so a selected no-op renderer
// preserves live controllers rather than destroying them before a decision.
installTurboDraftProtection({transitions:['visit','history','unload']});
document.addEventListener('turbo:before-frame-render',event=>{
  const checkbox=document.querySelector('#keep-reference');
  if (!checkbox?.checked) return;
  checkbox.checked=false;
  event.preventDefault();event.detail.render=()=>{};event.detail.resume();
  document.querySelector('[data-reference-status]').textContent='The response was kept from replacing the current lookup.';
});
function focusPage() {
  if (document.querySelector('[data-editing-result="invalid"]')) return;
  const target=document.querySelector('[data-result]');
  if (target) {target.tabIndex=-1;target.focus();}
}
for (const type of ['turbo:load','turbo:render']) document.addEventListener(type,focusPage);
focusPage();
let leaving=[];
function restore() {for(const [fieldset,disabled] of leaving) if(fieldset.isConnected)fieldset.disabled=disabled;leaving=[];}
document.addEventListener('turbo:visit',()=>{restore();leaving=[...document.querySelectorAll('form[data-fieldwork-editing] [data-form-fields]')].map(fieldset=>[fieldset,fieldset.disabled]);leaving.forEach(([fieldset])=>fieldset.disabled=true);});
document.addEventListener('turbo:load',restore);
document.addEventListener('turbo:fetch-request-error',restore);
