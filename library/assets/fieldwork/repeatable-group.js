// Add/remove application-authored groups. Native fields keep their names/values.
import { confirmDeletion } from './confirm-deletion.js';
import { captureFields, restoreFields } from './internal/field-values.js';

const controllers = new WeakMap();

export function enhanceRepeatableGroup(root) {
  if (controllers.has(root)) return controllers.get(root);
  const list = root.querySelector('[data-repeat-list]');
  const template = root.querySelector('template[data-repeat-template]');
  const add = root.querySelector('button[data-repeat-add]');
  if (!list || !template || !add)
    throw new Error('A repeatable group needs a list, template, and Add button.');
  const prototype = template.content.firstElementChild;
  if (template.content.children.length !== 1 || !prototype.matches('[data-repeat-item]'))
    throw new Error('The repeat template needs one data-repeat-item root.');
  const ids = [prototype, ...prototype.querySelectorAll('[id]')]
    .filter(node => node.id)
    .map(node => node.id);
  if (ids.some(id => !id.includes('__KEY__')) || new Set(ids).size !== ids.length)
    throw new Error('Template IDs must be unique and contain __KEY__.');
  const min = Number(root.dataset.repeatMin || 0);
  const max = root.dataset.repeatMax ? Number(root.dataset.repeatMax) : Infinity;
  if (
    !Number.isInteger(min) ||
    min < 0 ||
    !(max === Infinity || Number.isInteger(max)) ||
    max < min
  )
    throw new Error('Invalid repeatable group limits.');
  const label = root.dataset.repeatLabel || 'Entry';
  const items = () => [...list.children].filter(item => item.matches('[data-repeat-item]'));
  if (items().some(item => !item.dataset.repeatKey) || new Set(items().map(item => item.dataset.repeatKey)).size !== items().length)
    throw new Error('Existing repeatable items need unique nonempty keys.');
  if (items().length < min || items().length > max)
    throw new Error('Render an initial group count within its limits.');
  let status = root.querySelector('[data-repeat-status]');
  const generatedStatus = !status;
  if (!status) {
    status = document.createElement('p');
    status.className = 'hint';
    status.dataset.repeatStatus = '';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-atomic', 'true');
    root.append(status);
  }
  const events = new AbortController();
  const originals = new Map();
  let active = true, busy = false;
  const snapshots = new WeakSet();
  function captureState(nodes = items()) {
    if (nodes.length < min || nodes.length > max || nodes.some(item => !item.matches('[data-repeat-item]') || !item.dataset.repeatKey) ||
        new Set(nodes.map(item => item.dataset.repeatKey)).size !== nodes.length)
      throw new Error('Repeatable baseline rows need valid unique keys and a count within the group limits.');
    const rows = nodes.map(item => ({ item, fields: captureFields(item) }));
    const state = { rows, signature: JSON.stringify(rows.map(({ item, fields }) => [
      item.dataset.repeatKey, fields.map(({ field, value }) => [field.name, field.type, value])
    ])) };
    snapshots.add(state);
    return state;
  }
  const savedTemplate = root.querySelector('template[data-repeat-baseline]');
  const baselineState = captureState(savedTemplate
    ? [...savedTemplate.content.cloneNode(true).children] : items());
  let nextKey =
    Math.max(
      -1,
      ...items()
        .map(item => Number(item.dataset.repeatKey))
        .filter(Number.isInteger)
    ) + 1;
  function remember(button) {
    if (!originals.has(button))
      originals.set(button, {
        disabled: button.disabled,
        label: button.getAttribute('aria-label'),
      });
  }
  function update() {
    const entries = items();
    remember(add);
    add.disabled = busy || entries.length >= max;
    entries.forEach((item, index) => {
      const title = item.querySelector('[data-repeat-title]');
      if (title) title.textContent = `${label} ${index + 1}`;
      item.querySelectorAll('button[data-repeat-remove]').forEach(button => {
        remember(button);
        button.disabled = busy || entries.length <= min;
        button.setAttribute('aria-label', `Remove ${label.toLowerCase()} ${index + 1}`);
      });
    });
  }
  function focusItem(item) {
    const control = [
      ...item.querySelectorAll('input:not([type="hidden"]), select, textarea'),
      ...item.querySelectorAll('button, a[href]'),
    ].find(node => !node.matches(':disabled') && node.getClientRects().length);
    (control || add).focus();
  }
  function append() {
    if (!active || busy || items().length >= max || add.matches(':disabled')) return;
    let item;
    let key;
    do {
      key = String(nextKey++);
      const fragment = template.content.cloneNode(true);
      if (
        fragment.children.length !== 1 ||
        !fragment.firstElementChild.matches('[data-repeat-item]')
      )
        throw new Error('The repeat template needs one data-repeat-item root.');
      item = fragment.firstElementChild;
      for (const node of [item, ...item.querySelectorAll('*')]) {
        for (const attribute of [...node.attributes]) {
          if (attribute.value.includes('__KEY__'))
            node.setAttribute(attribute.name, attribute.value.replaceAll('__KEY__', key));
        }
      }
    } while (
      items().some(existing => existing.dataset.repeatKey === key) ||
      [item, ...item.querySelectorAll('[id]')].some(
        node => node.id && root.ownerDocument.getElementById(node.id)
      )
    );
    item.dataset.repeatKey = key;
    list.append(item);
    update();
    status.textContent = `${label} ${items().length} added. ${items().length} ${items().length === 1 ? 'entry' : 'entries'} total.`;
    focusItem(item);
    root.dispatchEvent(
      new CustomEvent('fieldwork:repeat-added', { bubbles: true, detail: { item, key } })
    );
  }
  root.addEventListener(
    'click',
    async event => {
      const button = event.target.closest('button');
      if (busy || event.defaultPrevented || !button || button.matches(':disabled')) return;
      if (button === add) {
        event.preventDefault();
        append();
        return;
      }
      if (!button.matches('[data-repeat-remove]')) return;
      const item = button.closest('[data-repeat-item]');
      const entries = items();
      const index = entries.indexOf(item);
      if (index === -1 || entries.length <= min) return;
      event.preventDefault();
      if (
        !root.dispatchEvent(
          new CustomEvent('fieldwork:repeat-before-remove', {
            bubbles: true,
            cancelable: true,
            detail: { item, key: item.dataset.repeatKey },
          })
        )
      )
        return;
      const confirmed = await confirmDeletion({
        action: 'remove',
        name: item.querySelector('[data-repeat-title]')?.textContent || label,
        description: 'This entry and its values will be removed from the form.',
        opener: button,
        signal: events.signal,
      });
      if (!confirmed || !active || busy || !list.contains(item) || items().length <= min) return;
      const focusWasInside = item.contains(document.activeElement);
      item.remove();
      item
        .querySelectorAll('button[data-repeat-remove]')
        .forEach(control => originals.delete(control));
      update();
      status.textContent = `${label} ${index + 1} removed. ${items().length} ${items().length === 1 ? 'entry' : 'entries'} remaining.`;
      if (focusWasInside) {
        const next = items()[index] || items()[index - 1];
        if (next) focusItem(next);
        else add.focus();
      }
      root.dispatchEvent(
        new CustomEvent('fieldwork:repeat-removed', {
          bubbles: true,
          detail: { item, key: item.dataset.repeatKey },
        })
      );
    },
    { signal: events.signal }
  );
  update();
  const controller = {
    captureState,
    get baselineState() { return baselineState; },
    restoreState(state) {
      if (!active || !snapshots.has(state)) throw new TypeError('Use a state from this repeatable group.');
      const restored = state.rows.map(row => row.item);
      const removed = items().filter(item => !restored.includes(item));
      list.replaceChildren(...restored);
      state.rows.forEach(row => restoreFields(row.fields));
      update();
      status.textContent = '';
      root.dispatchEvent(new CustomEvent('fieldwork:repeat-restored', {
        bubbles: true, detail: { items: items(), removed }
      }));
    },
    setBusy(value) { if (active) { busy = Boolean(value); update(); } },
    destroy() {
      if (!active) return;
      active = false;
      events.abort();
      originals.forEach((original, button) => {
        button.disabled = original.disabled;
        if (original.label === null) button.removeAttribute('aria-label');
        else button.setAttribute('aria-label', original.label);
      });
      if (generatedStatus) status.remove();
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  return controller;
}
