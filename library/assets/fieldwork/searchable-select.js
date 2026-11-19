// Single or multiple selection over a native select. Applications own data, transport, and saving.
import { createAttributeSnapshot } from './internal/attributes.js';
import {
  viewportBounds,
  outsideViewport,
  popupSpace,
  popupPosition,
} from './internal/popup-position.js';

const controllers = new WeakMap();
let nextId = 0;
export function enhanceSearchableSelect(root, { loadOptions } = {}) {
  if (controllers.has(root)) return controllers.get(root);
  if (loadOptions !== undefined && typeof loadOptions !== 'function')
    throw new TypeError('loadOptions must be a function.');
  const select = root.querySelector('select');
  if (
    root.querySelectorAll('select').length !== 1 ||
    !select ||
    !select.id ||
    !select.labels.length
  )
    throw new Error('Supply one labeled native select with a unique ID.');
  if (new Set([...select.options].map(option => option.value)).size !== select.options.length)
    throw new Error('Option IDs must be unique, including the empty option.');
  const multiple = select.multiple;
  if (multiple && [...select.options].some(option => !option.value))
    throw new Error('Multiple selections need nonempty option IDs; use no selected options for an empty choice.');
  if (!('showPopover' in HTMLElement.prototype)) return;
  const events = new AbortController();
  const on = (el, type, fn, options = {}) =>
    el.addEventListener(type, fn, { ...options, signal: events.signal });
  const make = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };
  const button = text => {
    const el = make('button', 'button', text);
    el.type = 'button';
    return el;
  };
  const id = `fieldwork-selection-${++nextId}`;
  const labels = [...select.labels];
  const name = root.dataset.label || labels.map(label => label.textContent.trim()).join(' ');
  const attributes = createAttributeSnapshot();
  attributes.remember(select, 'class', 'tabindex', 'aria-hidden');
  labels.forEach(label => attributes.remember(label, 'id', 'for'));
  const controls = make('div', 'searchable-selection');
  const trigger = button('');
  trigger.classList.add('searchable-selection-trigger');
  trigger.id = `${id}-trigger`;
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  const selectedText = make('span');
  selectedText.id = `${id}-value`;
  trigger.append(selectedText);
  labels.forEach((label, index) => {
    if (!label.id) label.id = `${id}-label-${index}`;
    label.htmlFor = trigger.id;
  });
  trigger.setAttribute(
    'aria-labelledby',
    [...labels.map(label => label.id), selectedText.id].join(' ')
  );
  const clear = button('Clear');
  clear.dataset.variant = 'quiet';
  clear.setAttribute('aria-label', `Clear ${name}`);
  controls.append(trigger, clear);
  const error = make('p', 'field-error');
  error.id = `${id}-error`;
  error.hidden = true;
  const panel = make('div', 'searchable-selection-popup');
  panel.id = `${id}-popup`;
  panel.setAttribute('popover', 'auto');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', `Choose ${name}`);
  trigger.setAttribute('aria-controls', panel.id);
  trigger.setAttribute('popovertarget', panel.id);
  const searchLabel = make('label', 'field', root.dataset.searchLabel || 'Search options');
  const input = make('input');
  input.type = 'search';
  input.id = `${id}-search`;
  input.autocomplete = 'off';
  input.setAttribute('form', `${id}-no-form`);
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'true');
  input.setAttribute('aria-controls', `${id}-list`);
  searchLabel.append(input);
  const results = make('div', 'searchable-selection-results');
  results.id = `${id}-list`;
  results.tabIndex = -1;
  results.setAttribute('role', 'listbox');
  results.setAttribute('aria-label', `${name} options`);
  if (multiple) results.setAttribute('aria-multiselectable', 'true');
  const message = make('p', 'hint');
  message.setAttribute('role', 'status');
  const retry = button('Retry');
  retry.hidden = true;
  panel.append(searchLabel, message, results, retry);
  (root.closest('dialog') || document.body).append(panel);
  const selectedList = make('ul', 'searchable-selection-values');
  selectedList.setAttribute('aria-label', `Selected ${name}`);
  selectedList.hidden = true;
  const selectionStatus = make('p', 'visually-hidden');
  selectionStatus.setAttribute('role', 'status');
  const selectedRows = new Map();
  if (multiple) select.after(controls, selectedList, selectionStatus, error);
  else select.after(controls, error);
  select.classList.add('visually-hidden');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  let active = true,
    request,
    timer,
    version = 0,
    choices = [],
    highlighted = -1,
    pending = false,
    committing = false;
  const isOpen = () => panel.matches(':popover-open');
  const selected = () => select.selectedOptions[0];
  function sync() {
    const selections = [...select.selectedOptions];
    selectedText.textContent = multiple
      ? selections.length ? `${selections.length} selected` : root.dataset.placeholder || 'Choose options'
      : select.value ? selected()?.label || select.value : root.dataset.placeholder || 'Choose an option';
    if (multiple) {
      const current = new Set(selections.map(option => option.value));
      for (const [value, row] of selectedRows) {
        if (!current.has(value)) { row.remove(); selectedRows.delete(value); }
      }
      for (const option of selections) {
        let row = selectedRows.get(option.value);
        if (!row) {
          row = make('li', 'searchable-selection-value');
          const title = make('span');
          const remove = button('');
          remove.dataset.iconOnly = '';
          remove.dataset.variant = 'quiet';
          remove.dataset.selectionRemove = option.value;
          const icon = make('span', 'icon');
          icon.dataset.icon = 'x';
          icon.setAttribute('aria-hidden', 'true');
          remove.append(icon);
          row.append(title, remove);
          selectedRows.set(option.value, row);
        }
        row.firstElementChild.textContent = option.label;
        const remove = row.lastElementChild;
        remove.setAttribute('aria-label', `Remove ${option.label} from ${name}`);
        remove.disabled = select.matches(':disabled') || option.matches(':disabled');
        // Only move rows when order actually changes; retain focus on existing controls.
        const index = selections.indexOf(option);
        if (selectedList.children[index] !== row) selectedList.insertBefore(row, selectedList.children[index] || null);
      }
      selectedList.hidden = selections.length === 0;
      paintSelection();
    }
    trigger.disabled = select.matches(':disabled');
    clear.disabled = trigger.disabled;
    clear.hidden = multiple
      ? !selections.some(option => !option.matches(':disabled'))
      : !select.value || ![...select.options].some(option => option.value === '' && !option.disabled);
    trigger.setAttribute(
      'aria-invalid',
      error.hidden ? select.getAttribute('aria-invalid') || 'false' : 'true'
    );
    const description = [select.getAttribute('aria-describedby'), error.hidden ? '' : error.id]
      .filter(Boolean)
      .join(' ');
    if (description) trigger.setAttribute('aria-describedby', description);
    else trigger.removeAttribute('aria-describedby');
    if (trigger.disabled) close();
  }
  function stop() {
    clearTimeout(timer);
    version++;
    request?.abort();
    pending = false;
  }
  function close(restore = false) {
    if (!active) return;
    stop();
    if (isOpen()) panel.hidePopover();
    trigger.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    if (restore && !trigger.disabled && trigger.isConnected) trigger.focus();
  }
  function position() {
    if (!isOpen()) return;
    const box = trigger.getBoundingClientRect();
    const viewport = viewportBounds(window);
    if (!trigger.isConnected || outsideViewport(box, viewport)) {
      close();
      return;
    }
    panel.style.width = `${Math.min(Math.max(box.width, 300), viewport.width - 16)}px`;
    const space = popupSpace(box, viewport, panel.scrollHeight, 280);
    panel.style.maxHeight = `${space.maxHeight}px`;
    const rect = panel.getBoundingClientRect();
    const position = popupPosition(box, viewport, rect, space.placeBelow);
    panel.style.left = `${position.left}px`;
    panel.style.top = `${position.top}px`;
  }
  function highlight(index) {
    highlighted = index;
    [...results.children].forEach((option, i) =>
      option.toggleAttribute('data-active', i === index)
    );
    if (index < 0) input.removeAttribute('aria-activedescendant');
    else {
      input.setAttribute('aria-activedescendant', results.children[index].id);
      results.children[index].scrollIntoView({ block: 'nearest' });
    }
  }
  function render(items, more = false) {
    choices = items.map(item => ({
      ...item,
      unavailable: Boolean(item.disabled),
      disabled: Boolean(
        item.disabled ||
          [...select.options].find(option => option.value === item.value)?.matches(':disabled')
      ),
    }));
    results.replaceChildren();
    highlighted = -1;
    input.removeAttribute('aria-activedescendant');
    retry.hidden = true;
    choices.forEach((item, index) => {
      const option = make('div', 'searchable-selection-option');
      option.id = `${id}-option-${index}`;
      option.dataset.index = index;
      option.setAttribute('role', 'option');
      const chosen = [...select.selectedOptions].some(option => option.value === item.value);
      option.setAttribute('aria-selected', String(chosen));
      option.setAttribute('aria-disabled', String(Boolean(item.disabled)));
      const title = make('span', '', item.label);
      option.append(title);
      if (item.description) option.append(make('small', 'hint', item.description));
      if (item.disabled) option.append(make('small', 'hint', 'Unavailable'));
      const check = make('span', 'icon searchable-selection-check');
      check.dataset.icon = 'check';
      check.hidden = !chosen;
      check.setAttribute('aria-hidden', 'true');
      option.append(check);
      results.append(option);
    });
    message.textContent = !items.length
      ? input.value.trim()
        ? 'No matches. Try another search.'
        : 'No options available.'
      : more
        ? 'More matches available. Refine your search.'
        : `${items.length} ${items.length === 1 ? 'option' : 'options'} available.`;
    position();
  }
  async function search() {
    stop();
    const ticket = version;
    highlighted = -1;
    input.removeAttribute('aria-activedescendant');
    if (!loadOptions) {
      const term = input.value.trim().toLocaleLowerCase();
      const all = [...select.options]
        .filter(option => option.value && !option.hidden)
        .map(option => ({
          value: option.value,
          label: option.label,
          description: option.dataset.description || '',
          disabled: option.disabled || option.parentElement.disabled,
        }))
        .filter(item => `${item.label} ${item.description}`.toLocaleLowerCase().includes(term));
      render(all.slice(0, 20), all.length > 20);
      return;
    }
    pending = true;
    results.replaceChildren();
    choices = [];
    retry.hidden = true;
    message.textContent = 'Loading options…';
    position();
    request = new AbortController();
    try {
      const response = await loadOptions(input.value, { signal: request.signal });
      if (!active || ticket !== version || !isOpen()) return;
      if (
        !response ||
        !Array.isArray(response.items) ||
        response.items.some(
          item =>
            !item ||
            typeof item.value !== 'string' ||
            !item.value ||
            typeof item.label !== 'string' ||
            !item.label.trim() ||
            (item.description !== undefined && typeof item.description !== 'string')
        ) ||
        new Set(response.items.map(item => item.value)).size !== response.items.length
      )
        throw new Error('Supply unique string IDs and labels.');
      pending = false;
      render(response.items.slice(0, 20), Boolean(response.hasMore) || response.items.length > 20);
    } catch (cause) {
      if (!active || ticket !== version || !isOpen()) return;
      pending = false;
      message.textContent = 'Options could not be loaded. Your selection is unchanged.';
      retry.hidden = false;
      position();
    }
  }
  function open() {
    if (!active || select.matches(':disabled') || isOpen()) return;
    trigger.click();
  }
  function paintSelection() {
    [...results.children].forEach((row, index) => {
      const chosen = [...select.selectedOptions].some(option => option.value === choices[index]?.value);
      const item = choices[index];
      if (item) {
        item.disabled = item.unavailable || Boolean([...select.options].find(option => option.value === item.value)?.matches(':disabled'));
        row.setAttribute('aria-disabled', String(item.disabled));
        if (index === highlighted && item.disabled) highlight(-1);
      }
      row.setAttribute('aria-selected', String(chosen));
      const check = row.querySelector('.searchable-selection-check');
      if (check) check.hidden = !chosen;
    });
  }
  function notify() {
    committing = true;
    try {
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    } finally { committing = false; }
  }
  function removeSelection(value) {
    if (select.matches(':disabled')) return;
    const option = [...select.options].find(option => option.value === value);
    if (!option?.selected || option.matches(':disabled')) return;
    const rows = [...selectedList.children];
    const index = rows.indexOf(selectedRows.get(value));
    option.selected = false;
    error.hidden = true;
    sync();
    notify();
    selectionStatus.textContent = `${option.label} removed. ${select.selectedOptions.length} selected.`;
    const next = selectedList.children[index] || selectedList.lastElementChild;
    if (!isOpen()) (next?.querySelector('button:not(:disabled)') || trigger).focus();
  }
  function commit(item) {
    if (item?.disabled || select.matches(':disabled')) return;
    if (multiple && !item) {
      for (const option of [...select.selectedOptions])
        if (!option.matches(':disabled')) option.selected = false;
      error.hidden = true;
      sync(); notify(); close(true);
      selectionStatus.textContent = `${select.selectedOptions.length} selected.`;
      return;
    }
    const value = item?.value || '';
    let option = [...select.options].find(option => option.value === value);
    if (option?.matches(':disabled') || (!option && !item)) return;
    if (!option) {
      option = new Option(item.label, value);
      if (item.description) option.dataset.description = item.description;
      select.add(option);
    }
    if (item) {
      option.textContent = item.label;
      option.label = item.label;
    }
    const changed = multiple || select.value !== value;
    if (multiple) option.selected = !option.selected;
    else select.value = value;
    error.hidden = true;
    sync();
    if (!multiple) close(true);
    if (changed) notify();
    if (multiple) {
      message.textContent = `${option.label} ${option.selected ? 'selected' : 'removed'}. ${select.selectedOptions.length} selected.`;
      input.focus();
    }
  }
  if (multiple) on(selectedList, 'click', event => {
    const remove = event.target.closest('button[data-selection-remove]');
    if (remove && !remove.disabled) removeSelection(remove.dataset.selectionRemove);
  });
  on(trigger, 'keydown', event => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      open();
    }
  });
  on(clear, 'click', () => commit());
  on(input, 'input', () => {
    stop();
    pending = Boolean(loadOptions);
    highlighted = -1;
    choices = [];
    results.replaceChildren();
    input.removeAttribute('aria-activedescendant');
    message.textContent = loadOptions ? 'Loading options…' : '';
    timer = setTimeout(search, loadOptions ? 200 : 0);
  });
  on(input, 'keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!pending && choices[highlighted]) commit(choices[highlighted]);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || !choices.length) return;
    if (['Home', 'End'].includes(event.key) && !event.altKey) return; // Preserve ordinary text editing; Alt+Home/End jumps to an option boundary.
    event.preventDefault();
    const available = choices
      .map((item, index) => (!item.disabled ? index : -1))
      .filter(index => index >= 0);
    if (!available.length) return;
    const current = available.indexOf(highlighted);
    highlight(
      event.key === 'Home'
        ? available[0]
        : event.key === 'End'
          ? available.at(-1)
          : available[
              (current +
                (event.key === 'ArrowDown' ? 1 : current < 0 ? 0 : -1) +
                available.length) %
                available.length
            ]
    );
  });
  on(results, 'pointerdown', event => event.preventDefault());
  on(results, 'click', event => {
    const option = event.target.closest('[data-index]');
    if (option && choices[Number(option.dataset.index)])
      commit(choices[Number(option.dataset.index)]);
  });
  on(retry, 'click', () => {
    input.focus();
    search();
  });
  on(panel, 'beforetoggle', event => {
    if (event.newState === 'closed') {
      stop();
      trigger.setAttribute('aria-expanded', 'false');
    } else {
      input.value = '';
      choices = [];
      results.replaceChildren();
      panel.style.visibility = 'hidden';
      trigger.setAttribute('aria-expanded', 'true');
    }
  });
  on(panel, 'toggle', () => {
    if (isOpen()) {
      position();
      panel.style.visibility = '';
      input.focus({ preventScroll: true });
      search();
    }
  });
  on(document, 'focusin', event => {
    if (isOpen() && event.target !== trigger && !panel.contains(event.target)) close();
  });
  on(select, 'change', () => {
    error.hidden = true;
    if (!multiple || !committing) close();
    sync();
  });
  on(select, 'focus', () => trigger.focus());
  on(select, 'invalid', event => {
    event.preventDefault();
    error.textContent = multiple ? 'Choose at least one option.' : 'Choose an option.';
    error.hidden = false;
    sync();
    trigger.focus();
  });
  const reset = () =>
    queueMicrotask(() => {
      if (active) {
        error.hidden = true;
        close();
        sync();
      }
    });
  if (select.form) {
    on(select.form, 'reset', reset);
    on(select.form, 'fieldwork:discarded', reset);
  }
  const observer = new MutationObserver(records => {
    if (
      active &&
      records.some(
        record =>
          record.target === select ||
          select.contains(record.target) ||
          record.target.tagName === 'FIELDSET'
      )
    )
      sync();
  });
  observer.observe(select.form || root, {
    attributes: true,
    attributeFilter: ['disabled', 'required', 'aria-invalid', 'aria-describedby'],
    childList: true,
    subtree: true,
    characterData: true,
  });
  on(window, 'resize', position);
  on(window, 'scroll', position, { capture: true, passive: true });
  if (window.visualViewport) {
    on(window.visualViewport, 'resize', position);
    on(window.visualViewport, 'scroll', position);
  }
  on(window, 'pagehide', () => close());
  if (root.closest('dialog')) on(root.closest('dialog'), 'close', () => close());
  const controller = {
    open,
    close,
    refresh() {
      if (active) {
        close();
        sync();
      }
    },
    destroy() {
      if (!active) return;
      close();
      active = false;
      observer.disconnect();
      events.abort();
      controls.remove();
      selectedList.remove();
      selectionStatus.remove();
      error.remove();
      panel.remove();
      attributes.restore();
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  sync();
  return controller;
}
