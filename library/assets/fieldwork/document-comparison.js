// Presentation only. Applications supply immutable revision pairs and escaped diff markup.
const controllers = new WeakMap();

export function enhanceDocumentComparison(root) {
  if (controllers.has(root)) return controllers.get(root);
  if (!root.matches('[data-document-comparison]'))
    throw new TypeError('Document comparison needs a data-document-comparison root.');
  const events = new AbortController();
  const status = root.querySelector('[data-comparison-status]');
  const originalStatus = status?.textContent;
  const changes = [...root.querySelectorAll('[data-comparison-change]')];
  const pair = [root.dataset.earlierRevision, root.dataset.laterRevision];
  function samePair() {
    return pair[0] === root.dataset.earlierRevision && pair[1] === root.dataset.laterRevision;
  }
  root.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || !root.contains(link) || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.hasAttribute('download') || (link.target && link.target !== '_self') ||
        !samePair()) return;
    const href = link.getAttribute('href');
    if (!link.hasAttribute('data-comparison-jump') || !href.startsWith('#')) return;
    const change = changes.find(part => `#${part.id}` === href);
    if (!change) return;
    event.preventDefault();
    // Author tabindex=-1 on change headings. No focus movement during mounting/cleanup.
    change.focus({ preventScroll: true });
    change.scrollIntoView({ block: 'start', behavior: 'instant' });
    if (status) status.textContent = `Change ${changes.indexOf(change) + 1} of ${changes.length}.`;
  }, { signal: events.signal });
  let active = true;
  const controller = {
    destroy() {
      if (!active) return;
      active = false;
      events.abort();
      if (status) status.textContent = originalStatus;
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  return controller;
}
