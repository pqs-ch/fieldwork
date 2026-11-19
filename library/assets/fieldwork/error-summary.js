// Enhance application-rendered errors without owning validation or submission.
const controllers = new WeakMap();

export function enhanceErrorSummary(summary, { focus = true } = {}) {
  if (controllers.has(summary)) return controllers.get(summary);
  const originalTabindex = summary.getAttribute('tabindex');
  let active = true;
  summary.tabIndex = -1;
  const events = new AbortController();
  summary.addEventListener(
    'click',
    event => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = event.target.closest('a[href^="#"]');
      if (!link || !summary.contains(link)) return;
      let id;
      try {
        id = decodeURIComponent(link.hash.slice(1));
      } catch {
        return;
      }
      const field = summary.ownerDocument.getElementById(id);
      if (!field || typeof field.focus !== 'function' || field.matches(':disabled')) return;
      event.preventDefault();
      for (let parent = field.parentElement; parent; parent = parent.parentElement) {
        if (parent.tagName === 'DETAILS') parent.open = true;
      }
      field.focus();
      field.scrollIntoView({ block: 'center' });
    },
    { signal: events.signal }
  );
  const controller = {
    focus() {
      if (active && summary.isConnected && !summary.hidden) summary.focus();
    },
    destroy() {
      if (!active) return;
      active = false;
      events.abort();
      if (originalTabindex === null) summary.removeAttribute('tabindex');
      else summary.setAttribute('tabindex', originalTabindex);
      controllers.delete(summary);
    },
  };
  controllers.set(summary, controller);
  if (focus) controller.focus();
  return controller;
}
