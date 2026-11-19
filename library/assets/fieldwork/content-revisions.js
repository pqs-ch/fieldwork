import { enhanceActionDropdown } from './action-dropdown.js';
import { localizeTimestamps } from './local-time.js';

const controllers = new WeakMap();

// Enhance linked, application-rendered revisions without reading or writing fields.
export function enhanceContentRevisions(root) {
  if (controllers.has(root)) return controllers.get(root);
  const picker = root.querySelector('[data-revision-picker]');
  const label = picker?.querySelector('[data-revision-label]');
  const trigger = picker?.querySelector('button[popovertarget]');
  const links = [...(picker?.querySelectorAll('a[data-revision-link]') || [])];
  const views = links.map(link => {
    const id = link.getAttribute('href');
    return id?.startsWith('#') ? root.ownerDocument.getElementById(id.slice(1)) : null;
  });
  if (
    !trigger ||
    !label ||
    !links.length ||
    views.some(view => !view || !root.contains(view) || !view.matches('[data-revision-view]')) ||
    new Set(views).size !== views.length
  ) {
    throw new Error(
      'Content revisions need a picker with links to unique revision views inside the same root.'
    );
  }
  const dropdown = enhanceActionDropdown(picker);
  localizeTimestamps(root);
  const originalLabel = label.textContent;
  const originalHidden = views.map(view => view.hidden);
  const originalCurrent = links.map(link => link.getAttribute('aria-current'));
  const events = new AbortController();
  let active = true;
  function select(index, focus = false) {
    views.forEach((view, i) => {
      view.hidden = i !== index;
    });
    links.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    label.textContent =
      links[index].dataset.revisionLabel ||
      links[index].querySelector('[data-revision-label]')?.textContent ||
      links[index].textContent.trim();
    root.dispatchEvent(
      new CustomEvent('fieldwork:revisionselected', {
        bubbles: true,
        detail: { view: views[index] },
      })
    );
    dropdown?.close();
    // Also recover focus when leaving a revision through its return link.
    if (focus) (trigger.getClientRects().length ? trigger : links[index]).focus();
  }
  const fragment = root.ownerDocument.defaultView.location.hash;
  const linked = links.findIndex(link => link.getAttribute('href') === fragment);
  const initial =
    linked < 0 ? links.findIndex(link => link.getAttribute('aria-current') === 'true') : linked;
  root.addEventListener(
    'click',
    event => {
      const link = event.target.closest('a[href]');
      if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.hasAttribute('download') ||
        (link.target && link.target !== '_self')
      )
        return;
      const index = links.findIndex(
        item => item.getAttribute('href') === link.getAttribute('href')
      );
      if (index < 0) return;
      event.preventDefault();
      select(index, true);
    },
    { signal: events.signal }
  );
  const controller = {
    destroy() {
      if (!active) return;
      active = false;
      events.abort();
      dropdown?.destroy();
      views.forEach((view, i) => {
        view.hidden = originalHidden[i];
      });
      links.forEach((link, i) => {
        if (originalCurrent[i] === null) link.removeAttribute('aria-current');
        else link.setAttribute('aria-current', originalCurrent[i]);
      });
      label.textContent = originalLabel;
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  select(initial < 0 ? 0 : initial);
  return controller;
}
