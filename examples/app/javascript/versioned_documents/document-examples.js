// Application integration for the document workflow; not shipped in the gem.
import 'versioned_documents/application'; // Mount after the editing bridge registers its lifecycle.
import { Turbo } from '@hotwired/turbo-rails';
import { enhanceForm } from 'fieldwork/forms';
import { enhanceDocumentComparison } from 'fieldwork/document-comparison';
import { confirmUnsavedChanges } from 'fieldwork/confirm-unsaved-changes';
let mounted;
function unmount() {
  mounted?.events.abort();
  mounted?.comparison?.destroy();
  if (mounted?.nativeDiscard) mounted.nativeDiscard.hidden = false;
  mounted = undefined;
}
function mount() {
  if (document.documentElement.hasAttribute('data-turbo-preview')) return;
  const root = document.querySelector('main');
  if (mounted?.root === root) return;
  unmount();
  if (!root) return;
  const events = new AbortController();
  const comparisonRoot = root.querySelector('[data-document-comparison]');
  const comparison = comparisonRoot ? enhanceDocumentComparison(comparisonRoot) : null;
  const form = root.querySelector('[data-document-editor]');
  const nativeDiscard = form?.querySelector('[data-native-discard]');
  mounted = { root, events, comparison, nativeDiscard };
  if (!form) return;
  const editor = enhanceForm(form); // Read bridge-owned state; do not destroy it here.
  if (nativeDiscard) nativeDiscard.hidden = true;
  let confirming = false;
  // This example's explicit policy protects same-context exits from the editor page.
  root.closest('.page').addEventListener('click', async event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey ||
        event.ctrlKey || event.shiftKey || event.altKey ||
        (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
    const destination = link.href;
    const url = new URL(destination);
    if (url.origin !== location.origin) return; // Native unload guard covers external exits.
    if (url.origin === location.origin && url.pathname === location.pathname &&
        url.search === location.search && url.hash) return;
    if (!editor.hasChanges && !editor.isSubmitting) return;
    event.preventDefault();
    if (confirming || editor.isSubmitting) return;
    confirming = true;
    try {
      const approved = await confirmUnsavedChanges({ name: 'Document draft', opener: link, signal: events.signal });
      if (approved && !events.signal.aborted && form.isConnected && link.isConnected &&
          link.href === destination && !editor.isSubmitting) Turbo.visit(destination);
    } finally { confirming = false; }
  }, { signal: events.signal });
  const previewTitle = root.querySelector('#preview-title');
  const invalidatePreview = () => {
    if (previewTitle) previewTitle.textContent = 'Preview is out of date — preview submitted text again';
  };
  form.addEventListener('input', invalidatePreview, { signal: events.signal });
  form.addEventListener('fieldwork:discarded', invalidatePreview, { signal: events.signal });
  // Native Back/reload/close cannot await a custom dialog. Application chooses a native guard.
  window.addEventListener('beforeunload', event => {
    if (!events.signal.aborted && (editor.hasChanges || editor.isSubmitting)) {
      event.preventDefault(); event.returnValue = '';
    }
  }, { signal: events.signal });
}
document.addEventListener('turbo:before-cache', unmount);
document.addEventListener('turbo:before-render', unmount);
document.addEventListener('turbo:render', mount);
document.addEventListener('turbo:load', mount);
mount();
