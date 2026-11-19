// Optional client transport for a native GET collection. Query execution and
// escaped result markup belong to the application; obsolete work cannot commit.
const controllers = new WeakMap();
export function enhanceCollectionSearch(root, { load, onCommit } = {}) {
  if (controllers.has(root)) return controllers.get(root);
  const form = root.querySelector('form[data-collection-query]');
  let view = root.querySelector('[data-collection-view]');
  if (!form || form.method.toLowerCase() !== 'get' || !view)
    throw new Error('Supply a GET query form and a collection view.');
  if (load !== undefined && typeof load !== 'function')
    throw new TypeError('load must be a function.');
  if (onCommit !== undefined && typeof onCommit !== 'function')
    throw new TypeError('onCommit must be a function.');
  if (form.querySelector('input[type="file"]'))
    throw new Error('Collection queries do not support file inputs.');
  const events = new AbortController();
  let request,
    failedURL,
    version = 0,
    active = true,
    busy = false;
  const originalBusy = view.getAttribute('aria-busy');
  const initialURL = new URL(root.dataset.collectionUrl || location.href, location.href);
  let appliedURL = initialURL;
  const feedback = document.createElement('div');
  feedback.className = 'collection-feedback stack';
  feedback.hidden = true;
  const message = document.createElement('p');
  message.setAttribute('role', 'status');
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'button';
  retry.textContent = 'Retry search';
  retry.hidden = true;
  feedback.append(message, retry);
  const announcement = document.createElement('p');
  announcement.className = 'visually-hidden';
  announcement.setAttribute('role', 'status');
  view.before(feedback, announcement);
  const draft = root.querySelector('[data-collection-draft]');
  const draftWasHidden = draft?.hidden;
  const readForm = submitter => {
    const url = new URL(form.action, location.href);
    url.search = '';
    url.hash = '';
    for (const [name, value] of new FormData(form, submitter)) {
      if (typeof value !== 'string')
        throw new TypeError('Collection queries do not support file inputs.');
      url.searchParams.append(name, value);
    }
    return url;
  };
  const queryKey = url => {
    const values = new URLSearchParams();
    for (const name of new Set(
      [...form.elements]
        .filter(el => el.name && !['submit', 'button'].includes(el.type))
        .map(el => el.name)
    )) {
      for (const value of url.searchParams.getAll(name).filter(Boolean)) values.append(name, value);
    }
    values.sort();
    return values.toString();
  };
  function syncDraft() {
    if (draft) draft.hidden = queryKey(readForm()) === queryKey(appliedURL);
  }
  function writeForm(url) {
    for (const field of form.elements) {
      if (!field.name || ['submit', 'button', 'reset', 'fieldset'].includes(field.type)) continue;
      const values = url.searchParams.getAll(field.name);
      if (['checkbox', 'radio'].includes(field.type)) field.checked = values.includes(field.value);
      else if (field.tagName === 'SELECT' && field.multiple)
        for (const option of field.options) option.selected = values.includes(option.value);
      else field.value = values[0] ?? '';
    }
  }
  function setBusy(value) {
    busy = value;
    if (value) view.setAttribute('aria-busy', 'true');
    else if (originalBusy === null) view.removeAttribute('aria-busy');
    else view.setAttribute('aria-busy', originalBusy);
  }
  async function navigate(input, { reason = 'navigate', focus = true } = {}) {
    if (!active || !load) return false;
    const url = new URL(input, location.href);
    const endpoint = new URL(form.action, location.href);
    if (url.origin !== endpoint.origin || url.pathname !== endpoint.pathname)
      throw new Error('Collection navigation must use its query endpoint.');
    request?.abort();
    request = new AbortController();
    const signal = request.signal,
      ticket = ++version;
    const startFields = readForm().href;
    const focused = document.activeElement;
    failedURL = undefined;
    setBusy(true);
    feedback.hidden = false;
    feedback.removeAttribute('data-tone');
    retry.hidden = true;
    const hasPrevious = !view.hasAttribute('data-collection-unavailable');
    message.textContent = hasPrevious
      ? 'Updating results… The previous results remain below.'
      : 'Loading results…';
    let next;
    try {
      next = await load(new URL(url), { signal });
      if (!active || signal.aborted || ticket !== version) return false;
      if (
        !(next instanceof HTMLElement) ||
        (next.ownerDocument === document && next.isConnected) ||
        !next.matches('[data-collection-view]') ||
        !next.querySelector('[data-collection-summary]')
      )
        throw new Error('Return a collection view with a results summary.');
    } catch (error) {
      if (!active || signal.aborted || ticket !== version) return false;
      setBusy(false);
      failedURL = new URL(url);
      feedback.dataset.tone = 'error';
      message.textContent = hasPrevious
        ? 'Could not update results. The previous results are still shown. Your search options are still here.'
        : 'Could not load results. Your search options are still here.';
      retry.hidden = false;
      return false;
    }
    const ownsFocus = document.activeElement === focused || view.contains(document.activeElement);
    const fieldsUnchanged = readForm().href === startFields;
    setBusy(false);
    view.replaceWith(next);
    view = next;
    appliedURL = new URL(url);
    root.dataset.collectionUrl = url.href;
    if (fieldsUnchanged) writeForm(url);
    syncDraft();
    message.textContent = view.querySelector('[data-collection-summary]').textContent.trim();
    feedback.hidden = true;
    announcement.textContent = message.textContent;
    if (focus && ownsFocus) view.querySelector('[data-collection-summary]').focus();
    onCommit?.(new URL(url), { reason });
    return true;
  }
  if (load) {
    form.addEventListener(
      'submit',
      event => {
        event.preventDefault();
        navigate(readForm(event.submitter), { reason: 'submit' });
      },
      { signal: events.signal }
    );
    root.addEventListener(
      'click',
      event => {
        const link = event.target.closest('a[data-collection-link]');
        if (
          !link ||
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey ||
          event.shiftKey ||
          link.target ||
          link.hasAttribute('download')
        )
          return;
        event.preventDefault();
        navigate(link.href, { reason: 'link' });
      },
      { signal: events.signal }
    );
    form.addEventListener('input', syncDraft, { signal: events.signal });
    form.addEventListener('change', syncDraft, { signal: events.signal });
    retry.addEventListener(
      'click',
      () => {
        if (failedURL) navigate(failedURL, { reason: 'retry' });
      },
      { signal: events.signal }
    );
    syncDraft();
  }
  const controller = {
    navigate,
    get url() {
      return new URL(appliedURL);
    },
    get isLoading() {
      return busy;
    },
    destroy() {
      active = false;
      version++;
      request?.abort();
      events.abort();
      setBusy(false);
      feedback.remove();
      announcement.remove();
      if (draft) draft.hidden = draftWasHidden;
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  return controller;
}
