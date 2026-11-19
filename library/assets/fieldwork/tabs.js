// Enhance linked sections into horizontal, automatically activated tabs.
// Without enhancement, the links and every section remain available.
import { createAttributeSnapshot } from './internal/attributes.js';

const controllers = new WeakMap();

export function enhanceTabs(root) {
  if (controllers.has(root)) return controllers.get(root);
  const list = root.querySelector('.tab-list');
  if (!list) return;
  const document = root.ownerDocument;
  const view = document.defaultView;
  const links = [...list.querySelectorAll('a[href^="#"]')];
  const panels = links.map(link => {
    try {
      return document.getElementById(decodeURIComponent(link.hash.slice(1)));
    } catch {
      return null;
    }
  });
  if (
    !links.length ||
    panels.some(panel => !panel || !root.contains(panel)) ||
    new Set(panels).size !== panels.length
  )
    return;
  const events = new view.AbortController();
  const attributes = createAttributeSnapshot();
  const set = attributes.set;
  let active = true;
  set(list, 'role', 'tablist');
  function select(index, focus = false) {
    links.forEach((link, i) => {
      set(link, 'aria-selected', String(i === index));
      set(link, 'tabindex', i === index ? '0' : '-1');
      set(panels[i], 'hidden', i === index ? null : '');
    });
    if (focus) links[index].focus();
  }
  links.forEach((link, index) => {
    set(link, 'role', 'tab');
    set(link, 'aria-controls', panels[index].id);
    set(panels[index], 'role', 'tabpanel');
    set(panels[index], 'tabindex', '0');
    link.addEventListener(
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
        event.preventDefault();
        select(index);
      },
      { signal: events.signal }
    );
    link.addEventListener(
      'keydown',
      event => {
        if (event.defaultPrevented) return;
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % links.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + links.length) % links.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = links.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        select(next, true);
      },
      { signal: events.signal }
    );
  });
  function selectFromFragment() {
    const index = links.findIndex(link => link.hash === view.location.hash);
    if (index >= 0) select(index);
  }
  select(0);
  selectFromFragment();
  view.addEventListener('hashchange', selectFromFragment, { signal: events.signal });
  const controller = {
    destroy() {
      if (!active) return;
      active = false;
      events.abort();
      attributes.restore();
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  return controller;
}
