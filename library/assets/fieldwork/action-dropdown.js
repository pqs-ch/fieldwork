// Native popovers supply top-layer rendering and light dismissal.
// Ordinary links/buttons retain their navigation and submission behavior.
import { createAttributeSnapshot } from './internal/attributes.js';
import {
  viewportBounds,
  outsideViewport,
  popupSpace,
  popupPosition,
} from './internal/popup-position.js';

const controllers = new WeakMap();

export function enhanceActionDropdown(root) {
  if (controllers.has(root)) return controllers.get(root);
  const trigger = root.querySelector('button[popovertarget]');
  const panel = trigger?.ownerDocument.getElementById(trigger.getAttribute('popovertarget'));
  if (!trigger || !panel || !root.contains(panel))
    throw new Error('An action dropdown needs a button targeting its own popover.');
  if (typeof panel.showPopover !== 'function') return;
  const events = new AbortController();
  const attributes = createAttributeSnapshot();
  attributes.remember(panel, 'style');
  attributes.remember(trigger, 'aria-expanded');
  const originalVisibility = panel.style.visibility;
  let active = true;
  let openingIndex = 0;
  const isOpen = () => panel.matches(':popover-open');
  const items = () =>
    [...panel.querySelectorAll('a.action-item[href], button.action-item')].filter(
      item => !item.matches(':disabled') && !item.hidden && item.getClientRects().length
    );
  function close(restoreFocus = true) {
    if (!active || !isOpen()) return;
    const focusInside = panel.contains(document.activeElement);
    panel.hidePopover();
    if (restoreFocus && focusInside && trigger.isConnected) trigger.focus();
  }
  function position() {
    if (!active || !isOpen()) return;
    const anchor = trigger.getBoundingClientRect();
    const viewport = viewportBounds(window, document.documentElement.clientWidth);
    if (!trigger.isConnected || outsideViewport(anchor, viewport)) {
      close(false);
      return;
    }
    // A trigger scrolled out of a table's local viewport must not leave a menu behind.
    for (let parent = trigger.parentElement; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      const rect = parent.getBoundingClientRect();
      if (
        (/(auto|scroll|hidden|clip)/.test(style.overflowX) &&
          (anchor.right <= rect.left || anchor.left >= rect.right)) ||
        (/(auto|scroll|hidden|clip)/.test(style.overflowY) &&
          (anchor.bottom <= rect.top || anchor.top >= rect.bottom))
      ) {
        close(false);
        return;
      }
    }
    const inset = 8;
    panel.style.inset = 'auto';
    panel.style.margin = '0';
    panel.style.maxWidth = `${Math.max(0, viewport.width - inset * 2)}px`;
    const space = popupSpace(anchor, viewport, panel.scrollHeight, 240, inset);
    panel.style.maxHeight = `${space.maxHeight}px`;
    const rect = panel.getBoundingClientRect();
    const alignRight = getComputedStyle(trigger).direction !== 'rtl';
    const position = popupPosition(anchor, viewport, rect, space.placeBelow, alignRight, inset);
    panel.style.left = `${position.left}px`;
    panel.style.top = `${position.top}px`;
  }
  const on = (target, type, listener, options = {}) =>
    target.addEventListener(type, listener, { ...options, signal: events.signal });
  on(panel, 'beforetoggle', event => {
    if (event.newState === 'open') panel.style.visibility = 'hidden';
  });
  on(panel, 'toggle', () => {
    trigger.setAttribute('aria-expanded', String(isOpen()));
    if (!isOpen()) {
      panel.style.visibility = originalVisibility;
      return;
    }
    position();
    panel.style.visibility = originalVisibility;
    const options = items();
    options[openingIndex === -1 ? options.length - 1 : 0]?.focus();
    openingIndex = 0;
  });
  on(trigger, 'keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    openingIndex = event.key === 'ArrowUp' ? -1 : 0;
    if (!isOpen()) panel.showPopover();
    else {
      const options = items();
      options[openingIndex === -1 ? options.length - 1 : 0]?.focus();
    }
  });
  on(panel, 'keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const options = items();
    const index = options.indexOf(document.activeElement);
    if (index === -1 || !options.length) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? options.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options[next].focus();
  });
  on(panel, 'click', event => {
    const item = event.target.closest('.action-item');
    if (item && panel.contains(item) && !item.matches(':disabled')) close();
  });
  // Native pointer focus can dispatch blur before the next control receives focus.
  on(root, 'focusout', () =>
    setTimeout(() => {
      if (active && isOpen() && !root.contains(document.activeElement)) close(false);
    }, 0)
  );
  on(window, 'scroll', position, { capture: true, passive: true });
  on(window, 'resize', position);
  if (window.visualViewport) {
    on(window.visualViewport, 'resize', position);
    on(window.visualViewport, 'scroll', position);
  }
  trigger.setAttribute('aria-expanded', String(isOpen()));
  const controller = {
    close,
    destroy() {
      if (!active) return;
      close(false);
      active = false;
      events.abort();
      attributes.restore();
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  if (isOpen()) position();
  return controller;
}
