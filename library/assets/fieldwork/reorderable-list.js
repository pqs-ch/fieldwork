// One vertical list, ordinary controls, application-owned saving.
const controllers = new WeakMap();
export function enhanceReorderableList(root) {
  if (controllers.has(root)) return controllers.get(root);
  const items = () => [...root.children].filter(item => item.hasAttribute('data-reorder-item'));
  const keys = () => items().map(item => item.dataset.reorderItem);
  function validate() {
    const rows = items();
    if (
      rows.some(
        item => !item.dataset.reorderItem || !item.querySelector('button[data-reorder-handle]')
      ) ||
      new Set(keys()).size !== rows.length
    )
      throw new Error('Reorderable items need unique nonempty keys and native button handles.');
    return rows;
  }
  validate(); // Invalid markup must not generate status UI or register listeners.
  const events = new AbortController(),
    originals = new Map();
  const status = document.createElement('p');
  status.className = 'visually-hidden';
  status.setAttribute('role', 'status');
  root.after(status);
  const label = item => item.dataset.label || item.dataset.reorderItem;
  const on = (el, type, fn, options = {}) =>
    el.addEventListener(type, fn, { ...options, signal: events.signal });
  let active = true,
    drag,
    frame;
  function refresh() {
    const rows = validate();
    rows.forEach((item, index) => {
      for (const control of item.querySelectorAll(
        'button[data-reorder-handle], button[data-reorder-move]'
      )) {
        if (!originals.has(control)) originals.set(control, control.disabled);
        control.disabled =
          control.hasAttribute('data-reorder-move') &&
          (control.dataset.reorderMove === 'up' ? index === 0 : index === rows.length - 1);
      }
    });
  }
  function changed(item) {
    refresh();
    status.textContent = `${label(item)} moved to position ${items().indexOf(item) + 1} of ${items().length}.`;
    root.dispatchEvent(
      new CustomEvent('fieldwork:reorder', { bubbles: true, detail: { keys: keys() } })
    );
  }
  function place(item, index) {
    const others = items().filter(other => other !== item);
    root.insertBefore(item, others[index] || null);
  }
  function finish(cancelled = false) {
    if (!drag) return;
    const previous = drag;
    drag = null;
    cancelAnimationFrame(frame);
    previous.ghost?.remove();
    previous.item.removeAttribute('data-reordering');
    if (root.hasPointerCapture(previous.pointerId)) root.releasePointerCapture(previous.pointerId);
    if (cancelled)
      for (const key of previous.order)
        root.append(items().find(item => item.dataset.reorderItem === key));
    refresh();
    previous.handle.focus({ preventScroll: true });
    if (!cancelled && keys().join('\u0000') !== previous.order.join('\u0000'))
      changed(previous.item);
    else if (previous.started)
      status.textContent = cancelled ? 'Reordering cancelled.' : 'Order unchanged.';
  }
  function position() {
    if (!drag?.started) return;
    drag.ghost.style.top = `${drag.y - drag.offset}px`;
    const others = items().filter(item => item !== drag.item);
    const index = others.findIndex(item => {
      const box = item.getBoundingClientRect();
      return drag.y < box.top + box.height / 2;
    });
    const target = index === -1 ? others.length : index;
    if (items().indexOf(drag.item) !== target) {
      place(drag.item, target);
      drag.handle.focus({ preventScroll: true });
    }
  }
  function autoScroll() {
    if (!drag?.started) return;
    const parent = drag.scroll;
    const box =
      parent === document.scrollingElement
        ? { top: 0, bottom: innerHeight }
        : parent.getBoundingClientRect();
    const delta = drag.y < box.top + 40 ? -12 : drag.y > box.bottom - 40 ? 12 : 0;
    if (delta) {
      parent.scrollTop += delta;
      position();
    }
    frame = requestAnimationFrame(autoScroll);
  }
  on(root, 'pointerdown', event => {
    const handle = event.target.closest('button[data-reorder-handle]');
    if (!handle || handle.disabled || event.button !== 0 || drag) return;
    const item = handle.closest('[data-reorder-item]');
    if (item?.parentElement !== root) return;
    event.preventDefault();
    handle.focus();
    root.setPointerCapture(event.pointerId);
    const box = item.getBoundingClientRect();
    let scroll = root;
    while (
      scroll &&
      !(
        scroll.scrollHeight > scroll.clientHeight &&
        /(auto|scroll)/.test(getComputedStyle(scroll).overflowY)
      )
    )
      scroll = scroll.parentElement;
    drag = {
      item,
      handle,
      pointerId: event.pointerId,
      order: keys(),
      y: event.clientY,
      startY: event.clientY,
      offset: event.clientY - box.top,
      box,
      scroll: scroll || document.scrollingElement,
    };
  });
  on(root, 'pointermove', event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.y = event.clientY;
    if (!drag.started && Math.abs(drag.y - drag.startY) >= 4) {
      drag.started = true;
      drag.item.dataset.reordering = '';
      const ghost = drag.item.cloneNode(true);
      ghost.removeAttribute('data-reorder-item');
      ghost.removeAttribute('data-reordering');
      ghost.removeAttribute('id');
      ghost.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      ghost.querySelectorAll('input,select,textarea,button').forEach(control => {
        control.disabled = true;
        control.removeAttribute('name');
        control.removeAttribute('form');
      });
      ghost.classList.add('reorder-ghost');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.inert = true;
      ghost.style.width = `${drag.box.width}px`;
      ghost.style.left = `${drag.box.left}px`;
      (root.closest('dialog') || document.body).append(ghost);
      drag.ghost = ghost;
      status.textContent = `Moving ${label(drag.item)}. Escape cancels.`;
      autoScroll();
    }
    position();
  });
  on(root, 'pointerup', event => {
    if (drag?.pointerId === event.pointerId) finish();
  });
  on(root, 'pointercancel', () => finish(true));
  on(root, 'lostpointercapture', () => finish(true));
  on(root, 'keydown', event => {
    if (event.key === 'Escape' && drag) {
      event.preventDefault();
      event.stopPropagation();
      finish(true);
      return;
    }
    if (drag) return;
    const handle = event.target.closest('button[data-reorder-handle]');
    if (!handle || handle.disabled || !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key))
      return;
    event.preventDefault();
    const item = handle.closest('[data-reorder-item]'),
      rows = items(),
      index = rows.indexOf(item);
    const target =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? rows.length - 1
          : Math.max(0, Math.min(rows.length - 1, index + (event.key === 'ArrowUp' ? -1 : 1)));
    if (target !== index) {
      place(item, target);
      handle.focus({ preventScroll: true });
      handle.scrollIntoView({ block: 'nearest' });
      changed(item);
    }
  });
  on(root, 'click', event => {
    if (drag) return;
    const move = event.target.closest('button[data-reorder-move]');
    if (!move || move.disabled) return;
    const item = move.closest('[data-reorder-item]');
    if (item?.parentElement !== root) return;
    place(item, items().indexOf(item) + (move.dataset.reorderMove === 'up' ? -1 : 1));
    changed(item);
    const focus = move.disabled ? item.querySelector('button[data-reorder-handle]') : move;
    focus.focus({ preventScroll: true });
    focus.scrollIntoView({ block: 'nearest' });
  });
  on(window, 'pagehide', () => finish(true));
  const controller = {
    get value() {
      return keys();
    },
    refresh() {
      if (active) {
        finish(true);
        refresh();
      }
    },
    cancel() {
      finish(true);
    },
    destroy() {
      if (!active) return;
      finish(true);
      active = false;
      events.abort();
      status.remove();
      for (const [control, disabled] of originals) control.disabled = disabled;
      controllers.delete(root);
    },
  };
  try {
    refresh();
  } catch (error) {
    controller.destroy();
    throw error;
  }
  controllers.set(root, controller);
  return controller;
}
