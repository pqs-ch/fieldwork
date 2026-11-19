// Optional navigation policy for bridge-owned forms. Turbo remains app-owned.
import { enhanceForm } from './forms.js';
import { confirmUnsavedChanges } from './confirm-unsaved-changes.js';

// Window-target listeners run in registration order. Import this module before
// Turbo starts; the hook stays inert until the application installs a policy.
let historyHandler;
window.addEventListener('popstate', event => historyHandler?.(event), true);
let installed;
export function installTurboDraftProtection({ transitions, isRetained = () => false } = {}) {
  if (!Array.isArray(transitions) || transitions.some(type => !['visit', 'frame', 'history', 'unload'].includes(type)))
    throw new TypeError('Choose protected transitions: visit, frame, history, unload.');
  if (typeof isRetained !== 'function') throw new TypeError('isRetained must be a synchronous predicate.');
  if (installed) return installed;
  const enabled = new Set(transitions);
  const events = new AbortController();
  const replay = new WeakSet();
  const frameRequests = new WeakMap();
  const submitters = new WeakMap();
  let pending, approved, nativeExit = false, nativeSave, status;
  let index = history.state?.turbo?.restorationIndex;
  let rollback, historyReplay;
  const on = (target, type, callback, capture = false) =>
    target.addEventListener(type, callback, { capture, signal: events.signal });
  function forms(context) {
    return [...document.querySelectorAll('form[data-fieldwork-editing][data-draft-protection]')]
      .filter(form => form.dataset.draftProtection.trim() && form !== context.source &&
        (!context.scope || context.scope.contains(form)))
      .filter(form => {
        const editor = enhanceForm(form);
        return editor.isSubmitting || (editor.hasChanges && isRetained(form, context) !== true);
      });
  }
  // Compare live values as well as input events: programmatic edits must not
  // inherit an earlier approval. Keep File identity, not just filenames.
  function snapshot(affected) {
    return affected.map(form => [form, [...form.elements].map(control => ({
      control, value: control.value, checked: control.checked,
      selected: control.options ? [...control.options].map(option => option.selected) : null,
      files: control.files ? [...control.files] : null
    }))]);
  }
  function same(saved, affected) {
    const current = snapshot(affected);
    return saved?.length === current.length && saved.every(([form, fields], i) =>
      form === current[i][0] && fields.length === current[i][1].length && fields.every((field, j) => {
        const next = current[i][1][j];
        return field.control === next.control && field.value === next.value && field.checked === next.checked &&
          JSON.stringify(field.selected) === JSON.stringify(next.selected) &&
          field.files?.length === next.files?.length && (!field.files || field.files.every((file, k) => file === next.files[k]));
      }));
  }
  function message(text) {
    if (!status?.isConnected) {
      status = document.createElement('p');
      status.className = 'notice'; status.setAttribute('role', 'status');
      (document.querySelector('main') || document.body).prepend(status);
    }
    status.textContent = text;
  }
  function permitted(context, affected) {
    return approved?.type === context.type && approved.scope === context.scope &&
      approved.destination === context.destination && same(approved.saved, affected);
  }
  async function decide(context, opener) {
    if (events.signal.aborted) return false;
    const affected = forms(context);
    if (!affected.length) return true;
    if (affected.some(form => enhanceForm(form).isSubmitting)) {
      message('This exit was stopped because a save was in progress. Check its result before leaving.'); return false;
    }
    if (permitted(context, affected)) return true;
    if (pending) return false;
    const abort = new AbortController();
    pending = abort;
    const saved = snapshot(affected);
    try {
      const leave = await confirmUnsavedChanges({ name: affected.map(form => form.dataset.draftProtection).join(', '), opener, signal: abort.signal });
      if (!leave || events.signal.aborted || abort.signal.aborted || !same(saved, forms(context)) ||
          affected.some(form => !form.isConnected || enhanceForm(form).isSubmitting)) return false;
      approved = { ...context, saved };
      return true;
    } finally { if (pending === abort) pending = undefined; }
  }
  function targetFor(element, submitter) {
    if (element.closest('[data-turbo="false"]') || (element.href && new URL(element.href).origin !== location.origin)) return null;
    const id = submitter?.dataset.turboFrame || element.dataset.turboFrame || element.closest('turbo-frame')?.getAttribute('target') || element.closest('turbo-frame')?.id;
    const frame = id === '_self' ? element.closest('turbo-frame') : id && id !== '_top' ? document.getElementById(id) : null;
    return frame?.matches('turbo-frame:not([disabled])') ? frame : null;
  }
  function contextFor(element, submitter) {
    const scope = targetFor(element, submitter);
    return { type: scope ? 'frame' : 'visit', scope, source: element instanceof HTMLFormElement ? element : null,
      destination: element instanceof HTMLFormElement ? (submitter?.hasAttribute('formaction') ? submitter.formAction : element.action) : element.href };
  }
  function usable(context) { return enabled.has(context.type); }
  function reset() { pending?.abort(); approved = undefined; nativeSave = undefined; status?.remove(); status = undefined; }

  on(document, 'click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link || replay.has(link) || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || link.hasAttribute('download') ||
        (link.target || document.querySelector('base[target]')?.target || '_self').toLowerCase() !== '_self') return;
    const url = new URL(link.href);
    if (!['http:', 'https:'].includes(url.protocol)) return;
    if (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search && url.hash) return;
    const context = contextFor(link);
    if (!usable(context) || !forms(context).length) return;
    event.preventDefault(); event.stopImmediatePropagation();
    approved = undefined;
    decide(context, link).then(leave => {
      if (!leave || !link.isConnected || link.href !== context.destination) return;
      if (context.scope) frameRequests.set(context.scope, { ...approved, source: null });
      replay.add(link); nativeExit = true;
      try { link.click(); } finally { replay.delete(link); nativeExit = false; }
    });
  }, true);
  on(document, 'submit', event => {
    const form = event.target, submitter = event.submitter;
    submitters.set(form, submitter);
    if (form.dataset.draftSubmit === 'in-place' || event.defaultPrevented || replay.has(form) || (submitter?.formMethod || form.method).toLowerCase() === 'dialog' ||
        (submitter?.formTarget || form.target || document.querySelector('base[target]')?.target || '_self').toLowerCase() !== '_self') return;
    const context = contextFor(form, submitter);
    if (!usable(context) || !forms(context).length) return;
    event.preventDefault(); event.stopImmediatePropagation(); approved = undefined;
    decide(context, submitter || form).then(leave => {
      if (!leave || !form.isConnected || (submitter && (!submitter.isConnected || submitter.form !== form)) ||
          (submitter?.hasAttribute('formaction') ? submitter.formAction : form.action) !== context.destination) return;
      replay.add(form); nativeExit = true;
      try { form.requestSubmit(submitter || undefined); } finally { replay.delete(form); nativeExit = false; }
    });
  }, true);
  on(document, 'turbo:before-visit', event => {
    const context = { type: 'visit', scope: null, destination: event.detail.url,
      source: approved?.destination === event.detail.url ? approved.source : null };
    if (!usable(context)) return;
    const affected = forms(context);
    if (!affected.length ||
        (!affected.some(form => enhanceForm(form).isSubmitting) && permitted(context, affected))) return;
    event.preventDefault();
    decide(context, document.activeElement).then(leave => {
      // Replaying the original application request needs no Turbo import.
      if (leave) {
        const link = document.createElement('a'); link.href = context.destination;
        replay.add(link); document.body.append(link); link.click(); link.remove();
      }
    });
  });
  on(document, 'turbo:before-fetch-request', event => {
    if (approved?.type === 'visit' && approved.source === event.target && same(approved.saved, forms(approved)))
      approved.destination = event.detail.url.href; // Include GET fields in the replayed visit URL.
    const frame = event.target instanceof HTMLFormElement
      ? targetFor(event.target, submitters.get(event.target)) : event.target.closest?.('turbo-frame');
    if (!frame || !enabled.has('frame')) return;
    const source = event.target instanceof HTMLFormElement ? event.target : null;
    const context = { type: 'frame', scope: frame, source, destination: event.detail.url.href };
    // Requests may already be in flight (for example a programmatic src
    // change). Guard replacement at render time; do not strand a paused fetch.
    frameRequests.set(frame, { ...context,
      saved: !forms(context).length || permitted(context, forms(context)) ? snapshot(forms(context)) : undefined });
  });
  on(document, 'turbo:before-frame-render', event => {
    if (!enabled.has('frame')) return;
    const frame = event.target, request = frameRequests.get(frame);
    const context = { type: 'frame', scope: frame, source: request?.source, destination: request?.destination || frame.src };
    const affected = forms(context);
    if (!affected.length || (!affected.some(form => enhanceForm(form).isSubmitting) && same(request?.saved, affected))) return;
    event.preventDefault();
    // Turbo captures detail.render after dispatch. Select the actual renderer
    // only after the asynchronous decision; a canceled render is a settled no-op.
    const render = event.detail.render;
    let leave = false;
    event.detail.render = (...args) => leave ? render(...args) : undefined;
    decide(context, document.activeElement).then(result => { leave = result; event.detail.resume(); });
  });
  // A real native submission sends its own draft. At the end of propagation,
  // Turbo/callback submissions have already prevented their native default.
  on(window, 'submit', event => {
    const form = event.target, submitter = event.submitter;
    if (event.defaultPrevented || (submitter?.formMethod || form.method).toLowerCase() === 'dialog' ||
        (submitter?.formTarget || form.target || document.querySelector('base[target]')?.target || '_self').toLowerCase() !== '_self') return;
    nativeSave = { form, saved: snapshot([form]) };
  });
  on(window, 'beforeunload', event => {
    const source = nativeSave && same(nativeSave.saved, [nativeSave.form]) ? nativeSave.form : null;
    nativeSave = undefined; // Exempt one departure for the submitted snapshot only.
    if (enabled.has('unload') && !nativeExit && forms({ type: 'unload', source }).length) {
      event.preventDefault(); event.returnValue = '';
    }
  });
  // Turbo restoration visits do not fire before-visit. Return to the current
  // entry before asking; keep Turbo's history observer from rendering meanwhile.
  historyHandler = event => {
    if (!enabled.has('history')) return;
    const next = event.state?.turbo?.restorationIndex;
    if (rollback) {
      event.stopImmediatePropagation();
      const continuation = rollback; rollback = undefined;
      setTimeout(continuation, 0); return;
    }
    if (historyReplay === next) { historyReplay = undefined; index = next; return; }
    const context = { type: 'history', scope: null, destination: location.href };
    if (!Number.isInteger(index) || !Number.isInteger(next) || next === index || !forms(context).length) { index = next; return; }
    event.stopImmediatePropagation();
    const delta = next - index, saved = snapshot(forms(context)), opener = document.activeElement;
    rollback = () => {
      if (events.signal.aborted) return;
      // Browsers restore form values after popstate. Put back the live draft,
      // including files where a browser replaced the input's FileList.
      for (const [, fields] of saved) for (const field of fields) {
        const control = field.control;
        if (!control.isConnected) continue;
        if (field.files) {
          if (![...control.files].every((file, i) => file === field.files[i]) || control.files.length !== field.files.length) {
            const transfer = new DataTransfer(); field.files.forEach(file => transfer.items.add(file)); control.files = transfer.files;
          }
        } else if (field.selected) [...control.options].forEach((option, i) => option.selected = field.selected[i]);
        else { control.value = field.value; if (field.checked !== undefined) control.checked = field.checked; }
      }
      decide(context, opener).then(leave => { if (leave) { historyReplay = next; history.go(delta); } });
    };
    history.go(-delta);
  };
  on(document, 'turbo:load', () => { index = history.state?.turbo?.restorationIndex; reset(); });
  on(document, 'turbo:before-cache', reset);
  on(document, 'turbo:before-render', () => pending?.abort());
  on(document, 'turbo:fetch-request-error', reset);
  on(document, 'turbo:frame-load', () => { approved = undefined; });
  installed = () => {
    if (events.signal.aborted) return;
    reset();
    events.abort();
    historyHandler = undefined;
    installed = undefined;
  };
  return installed;
}
