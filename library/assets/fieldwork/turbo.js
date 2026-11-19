// Optional bridge: Turbo owns requests/rendering; Fieldwork owns editing UI.
// No Turbo or Stimulus dependency is imported by the library.
import { enhanceForm } from './forms.js';

let installed;
export function installTurboEditing() {
  if (installed) return installed;
  const connected = new Map();
  const events = new AbortController();
  let observing = false;
  function disconnectAll() {
    connected.forEach(controller => controller.destroy());
    connected.clear();
  }
  function sync() {
    if (!observing || document.documentElement.hasAttribute('data-turbo-preview')) return;
    connected.forEach((controller, form) => {
      if (!form.isConnected) {
        controller.destroy();
        connected.delete(form);
      }
    });
    document.querySelectorAll('form[data-fieldwork-editing]').forEach(form => {
      if (connected.has(form)) return;
      const controller = enhanceForm(form);
      connected.set(form, controller);
      controller.focusResult();
    });
  }
  const observer = new MutationObserver(sync);
  function connect() {
    observing = true;
    observer.observe(document.documentElement, { childList: true, subtree: true });
    sync();
  }
  const on = (type, listener) =>
    document.addEventListener(type, listener, { signal: events.signal });
  on('turbo:submit-start', event =>
    connected.get(event.target)?.startSubmission(event.detail.formSubmission.submitter)
  );
  on('turbo:submit-end', event => {
    if (event.target.isConnected)
      connected.get(event.target)?.finishSubmission({ success: event.detail.success });
  });
  on('turbo:before-cache', () => {
    observing = false;
    observer.disconnect();
    connected.forEach(controller => controller.prepareForCache());
    disconnectAll();
  });
  on('turbo:before-render', disconnectAll);
  on('turbo:before-frame-render', event => {
    // A navigation guard may pause or replace this render. Keep the live form
    // (including File objects) until Turbo actually replaces its contents.
    const render = event.detail.render;
    event.detail.render = (...args) => {
      connected.forEach((controller, form) => {
        if (event.target.contains(form)) {
          controller.destroy();
          connected.delete(form);
        }
      });
      return render(...args);
    };
  });
  for (const type of ['turbo:load', 'turbo:render', 'turbo:frame-load', 'turbo:morph'])
    on(type, connect);
  connect();
  installed = () => {
    if (events.signal.aborted) return;
    observing = false;
    observer.disconnect();
    events.abort();
    disconnectAll();
    installed = undefined;
  };
  return installed;
}
