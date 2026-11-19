import { enhanceReorderableList } from './reorderable-list.js';
// Optional presentation preferences for a bounded, semantic table. No data or storage API.
const controllers = new WeakMap();
let nextId = 0;
const clone = value => JSON.parse(JSON.stringify(value));
const minimum = 112,
  maximum = 960;
const clamp = value => Math.max(minimum, Math.min(maximum, Math.round(value)));

export function enhanceTableColumns(root) {
  if (controllers.has(root)) return controllers.get(root);
  const trigger = root.querySelector('[data-table-configure-columns]');
  if (!trigger) return;
  const table = root.querySelector('table[data-table-columns]');
  if (!table || table.tHead?.rows.length !== 1 || table.querySelector('colgroup'))
    throw new Error('Column layout needs one header row and no authored colgroup.');
  const headers = [...table.tHead.rows[0].cells];
  const keys = headers.map(cell => cell.dataset.tableCell);
  if (keys.some(key => !key) || new Set(keys).size !== keys.length)
    throw new Error('Column headers need unique data-table-cell keys.');
  const fixed = headers.filter(cell => cell.hasAttribute('data-table-fixed'));
  if (fixed.some((cell, index) => cell !== headers[index]))
    throw new Error('Fixed utility columns must precede configurable columns.');
  const configurable = headers.filter(cell => !fixed.includes(cell));
  if (!configurable.length) throw new Error('Supply at least one configurable column.');
  const labels = new Map(
    configurable.map(cell => [
      cell.dataset.tableCell,
      cell.dataset.label ||
        cell.querySelector('.column-label')?.textContent.trim() ||
        cell.textContent.trim(),
    ])
  );
  const nonwrapping = new Set(
    configurable.filter(cell => cell.dataset.wrap === 'nowrap').map(cell => cell.dataset.tableCell)
  );
  const minimums = new Map(configurable.map(cell => [cell.dataset.tableCell, minimum]));
  const columnMaximum = key => Math.max(maximum, minimums.get(key));
  const clampColumn = (key, width) =>
    Math.max(minimums.get(key), Math.min(columnMaximum(key), Math.round(width)));
  const required = new Set(
    configurable
      .filter(cell => cell.hasAttribute('data-table-required'))
      .map(cell => cell.dataset.tableCell)
  );
  const defaults = configurable.map(cell => ({
    key: cell.dataset.tableCell,
    visible: !cell.hidden,
    width: clamp(Number(cell.dataset.tableWidth) || cell.getBoundingClientRect().width || 192),
  }));
  if (
    !defaults.some(column => column.visible) ||
    defaults.some(column => required.has(column.key) && !column.visible)
  )
    throw new Error('Keep required columns and at least one data column visible.');
  const fixedWidths = fixed.map(cell =>
    Math.max(44, Math.round(cell.getBoundingClientRect().width || 52))
  );
  const originalHidden = new WeakMap();
  function rowCells(row) {
    const cells = [...row.cells];
    if (
      cells.length !== keys.length ||
      cells.some(cell => cell.colSpan !== 1 || cell.rowSpan !== 1) ||
      new Set(cells.map(cell => cell.dataset.tableCell)).size !== keys.length ||
      cells.some(cell => !keys.includes(cell.dataset.tableCell))
    )
      throw new Error(
        'Every layout row needs one keyed cell per column, without row/column spans.'
      );
    return new Map(cells.map(cell => [cell.dataset.tableCell, cell]));
  }
  const rows = () => [...table.rows];
  rows().forEach(rowCells); // Validate before creating controls or moving nodes.
  const events = new AbortController();
  const on = (el, name, fn, options = {}) =>
    el.addEventListener(name, fn, { ...options, signal: events.signal });
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
  const originalStyle = table.getAttribute('style');
  const originalConfigured = table.getAttribute('data-table-configured');
  const originalDisabled = trigger.disabled;
  const originalExpanded = trigger.getAttribute('aria-expanded');
  const originalControls = trigger.getAttribute('aria-controls');
  const colgroup = document.createElement('colgroup');
  table.tHead.before(colgroup);
  const dialog = make('dialog', 'dialog table-columns-dialog');
  dialog.id = `fieldwork-table-columns-${++nextId}`;
  const heading = make('h2', '', 'Columns');
  heading.id = `${dialog.id}-title`;
  const hint = make(
    'p',
    'hint',
    'Choose visible columns. Drag a handle to change their order. Hidden columns keep their filters and sorting.'
  );
  hint.id = `${dialog.id}-hint`;
  const count = make('p', 'hint');
  const form = document.createElement('form');
  const list = make('ol', 'reorderable-list');
  list.setAttribute('aria-label', 'Column order');
  const error = make('p', 'field-error');
  error.id = `${dialog.id}-error`;
  error.hidden = true;
  error.setAttribute('role', 'alert');
  const status = make('p', 'visually-hidden');
  status.setAttribute('role', 'status');
  const summary = make('p', 'table-column-summary hint');
  summary.hidden = true;
  (root.querySelector('[data-table-results]') || table.closest('.table-scroll') || table).before(
    summary
  );
  const reset = button('Reset to defaults'),
    cancel = button('Cancel'),
    apply = button('Apply');
  apply.type = 'submit';
  apply.dataset.intent = 'primary';
  const actions = make('div', 'dialog-actions');
  actions.append(cancel, apply);
  form.append(heading, hint, count, list, error, reset, actions);
  dialog.append(form);
  dialog.setAttribute('aria-labelledby', heading.id);
  dialog.setAttribute('aria-describedby', hint.id);
  root.append(dialog, status);
  trigger.disabled = false;
  trigger.setAttribute('aria-controls', dialog.id);
  trigger.setAttribute('aria-expanded', 'false');
  table.dataset.tableConfigured = '';
  let value = clone(defaults),
    draft,
    busy = false,
    active = true,
    drag,
    reorder;
  const handles = new Map();
  const emit = () =>
    root.dispatchEvent(
      new CustomEvent('fieldwork:columnlayoutchange', {
        bubbles: true,
        detail: { columns: clone(value) },
      })
    );
  function validate(next) {
    if (
      !Array.isArray(next) ||
      next.length !== defaults.length ||
      new Set(next.map(column => column.key)).size !== defaults.length ||
      next.some(
        column =>
          !labels.has(column.key) ||
          typeof column.visible !== 'boolean' ||
          !Number.isSafeInteger(column.width) ||
          column.width < minimum ||
          (column.width > maximum && !nonwrapping.has(column.key)) ||
          (required.has(column.key) && !column.visible)
      ) ||
      !next.some(column => column.visible)
    )
      throw new Error(
        `Keep at least one column visible and use integer widths from ${minimum} to ${maximum} pixels (nonwrapping content may require more).`
      );
    return clone(next);
  }
  function render() {
    const ordered = [
      ...fixed.map(cell => cell.dataset.tableCell),
      ...value.map(column => column.key),
    ];
    const maps = rows().map(row => [row, rowCells(row)]);
    for (const [row, cells] of maps)
      for (const [index, key] of ordered.entries()) {
        const cell = cells.get(key);
        if (!originalHidden.has(cell)) originalHidden.set(cell, cell.hidden);
        const column = value.find(column => column.key === key);
        cell.hidden = column ? !column.visible : false;
        if (row.cells[index] !== cell) row.insertBefore(cell, row.cells[index] || null); // Retain native controls and focus when order is unchanged.
      }
    function sizeColumns(probe = false) {
      colgroup.replaceChildren();
      let width = 0;
      const widths = [
        ...fixedWidths,
        ...value.filter(column => column.visible).map(column =>
          probe && nonwrapping.has(column.key) ? minimum : column.width
        ),
      ];
      for (const size of widths) {
        const col = document.createElement('col');
        col.style.width = `${size}px`;
        colgroup.append(col);
        width += size;
      }
      table.style.width = `${width}px`;
    }
    if (nonwrapping.size) {
      // Probe at the ordinary minimum, then retain the full inline content plus
      // trailing padding. Fixed-layout tables otherwise let nowrap text overlap
      // the next column. Measure live cells so fonts and native controls match.
      sizeColumns(true);
      for (const column of value) {
        if (!column.visible || !nonwrapping.has(column.key)) continue;
        let floor = minimum;
        for (const [, cells] of maps) {
          const cell = cells.get(column.key);
          if (cell.dataset.wrap !== 'nowrap' || !cell.getClientRects().length) continue;
          const overflow = cell.scrollWidth - cell.clientWidth;
          if (overflow > 0) {
            const trailing = parseFloat(getComputedStyle(cell).paddingInlineEnd) || 0;
            floor = Math.max(floor, Math.ceil(cell.getBoundingClientRect().width + overflow + trailing));
          }
        }
        minimums.set(column.key, floor);
      }
      for (const column of value) column.width = clampColumn(column.key, column.width);
    }
    sizeColumns();
    for (const column of value) {
      const handle = handles.get(column.key);
      if (handle) {
        handle.setAttribute('aria-valuemin', String(minimums.get(column.key)));
        handle.setAttribute('aria-valuemax', String(columnMaximum(column.key)));
        handle.setAttribute('aria-valuenow', String(column.width));
        handle.setAttribute('aria-valuetext', `${column.width} pixels`);
        handle.tabIndex = busy ? -1 : 0;
        handle.setAttribute('aria-disabled', String(busy));
      }
    }
    const hiddenActive = value
      .filter(column => !column.visible)
      .flatMap(column => {
        const header = headers.find(cell => cell.dataset.tableCell === column.key);
        const states = [];
        if (['ascending', 'descending'].includes(header.getAttribute('aria-sort')))
          states.push(`sorted ${header.getAttribute('aria-sort')}`);
        if (header.querySelector('[data-filtered]')) states.push('filtered');
        return states.length ? [`${labels.get(column.key)} (${states.join(', ')})`] : [];
      });
    summary.hidden = hiddenActive.length === 0;
    summary.textContent = hiddenActive.length
      ? `Hidden columns still in use: ${hiddenActive.join(' · ')}. Use Columns to show them.`
      : '';
  }
  function endResize(cancelled = false) {
    if (!drag) return;
    const previous = drag;
    drag = null;
    if (cancelled) value.find(column => column.key === previous.key).width = previous.width;
    if (previous.handle.hasPointerCapture(previous.pointerId))
      previous.handle.releasePointerCapture(previous.pointerId);
    table.removeAttribute('data-resizing');
    render();
    if (!cancelled && value.find(column => column.key === previous.key).width !== previous.width)
      emit();
  }
  for (const header of configurable) {
    const key = header.dataset.tableCell;
    const handle = make('span', 'table-column-resize');
    handle.tabIndex = 0;
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-orientation', 'vertical');
    handle.setAttribute('aria-label', `Resize ${labels.get(key)} column`);
    handle.setAttribute('aria-valuemin', String(minimum));
    handle.setAttribute('aria-valuemax', String(maximum));
    handle.title = 'Drag to resize, or use Left and Right arrow keys.';
    header.append(handle);
    handles.set(key, handle);
    on(handle, 'pointerdown', event => {
      if (busy || event.button !== 0 || drag) return;
      event.preventDefault();
      event.stopPropagation();
      handle.focus();
      drag = {
        key,
        width: value.find(column => column.key === key).width,
        x: event.clientX,
        pointerId: event.pointerId,
        handle,
      };
      handle.setPointerCapture(event.pointerId);
      table.dataset.resizing = '';
    });
    on(handle, 'pointermove', event => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const direction = getComputedStyle(table).direction === 'rtl' ? -1 : 1;
      value.find(column => column.key === key).width = clampColumn(
        key, drag.width + (event.clientX - drag.x) * direction
      );
      render();
    });
    on(handle, 'pointerup', () => endResize());
    on(handle, 'pointercancel', () => endResize(true));
    on(handle, 'lostpointercapture', () => endResize(true));
    on(handle, 'keydown', event => {
      if (event.key === 'Escape' && drag) {
        event.preventDefault();
        endResize(true);
        return;
      }
      if (busy || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const column = value.find(column => column.key === key);
      const direction = getComputedStyle(table).direction === 'rtl' ? -1 : 1;
      column.width =
        event.key === 'Home'
          ? minimums.get(key)
          : event.key === 'End'
            ? columnMaximum(key)
            : clampColumn(
                key, column.width +
                  (event.key === 'ArrowRight' ? 1 : -1) * direction * (event.shiftKey ? 32 : 8)
              );
      render();
      emit();
    });
  }
  function renderDraft() {
    count.textContent = `${draft.filter(column => column.visible).length} of ${draft.length} columns selected`;
    reorder?.destroy();
    list.replaceChildren();
    error.hidden = true;
    draft.forEach(column => {
      const item = make('li', 'reorderable-item');
      item.dataset.reorderItem = column.key;
      item.dataset.label = labels.get(column.key);
      const handle = button('');
      const grip = make('span', 'icon');
      grip.dataset.icon = 'grip-vertical';
      grip.setAttribute('aria-hidden', 'true');
      handle.append(grip);
      handle.classList.add('reorder-handle');
      handle.dataset.variant = 'quiet';
      handle.dataset.reorderHandle = '';
      handle.setAttribute('aria-label', `Reorder ${labels.get(column.key)}`);
      handle.title = 'Drag to reorder, or use Up and Down arrow keys';
      const label = make('label', 'table-column-choice');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = column.visible;
      checkbox.disabled = required.has(column.key);
      label.append(
        checkbox,
        document.createTextNode(
          `${labels.get(column.key)}${required.has(column.key) ? ' (required)' : ''}`
        )
      );
      const controls = make('div', 'reorder-moves');
      for (const [direction, text] of [
        ['up', 'Move up'],
        ['down', 'Move down'],
      ]) {
        const move = button('');
        const arrow = make('span', 'icon');
        arrow.dataset.icon = `arrow-${direction}`;
        arrow.setAttribute('aria-hidden', 'true');
        move.append(arrow);
        move.dataset.variant = 'quiet';
        move.dataset.reorderMove = direction;
        move.disabled = true;
        move.setAttribute('aria-label', `${text}: ${labels.get(column.key)}`);
        move.title = text;
        controls.append(move);
      }
      item.append(handle, label, controls);
      list.append(item);
    });
    reorder = enhanceReorderableList(list);
  }
  on(list, 'input', event => {
    const item = event.target.closest('[data-reorder-item]');
    if (!item || event.target.type !== 'checkbox') return;
    draft.find(column => column.key === item.dataset.reorderItem).visible = event.target.checked;
    error.hidden = true;
    count.textContent = `${draft.filter(column => column.visible).length} of ${draft.length} columns selected`;
  });
  on(list, 'fieldwork:reorder', event => {
    draft = event.detail.keys.map(key => draft.find(column => column.key === key));
    error.hidden = true;
  });
  function close() {
    reorder?.cancel();
    if (dialog.open) {
      dialog.close();
      // Safari pointer activation need not focus a button before showModal().
      // Restore the explicit opener rather than relying on native close focus.
      if (active && trigger.isConnected && !trigger.disabled) trigger.focus({ preventScroll: true });
    }
    trigger.setAttribute('aria-expanded', 'false');
  }
  on(trigger, 'click', () => {
    if (busy || document.querySelector('dialog[open]')) return;
    endResize(true);
    draft = clone(value);
    renderDraft();
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
  });
  on(cancel, 'click', close);
  on(dialog, 'close', () => {
    reorder?.cancel();
    trigger.setAttribute('aria-expanded', 'false');
  });
  on(dialog, 'cancel', event => {
    reorder?.cancel();
    event.preventDefault();
    close();
  });
  on(reset, 'click', () => {
    draft = clone(defaults);
    renderDraft();
    status.textContent = 'Default layout restored in the draft. Apply to confirm.';
  });
  on(form, 'submit', event => {
    event.preventDefault();
    try {
      value = validate(draft);
    } catch (cause) {
      error.textContent = cause.message;
      error.hidden = false;
      list.querySelector('input[type="checkbox"]:not(:disabled)')?.focus();
      return;
    }
    render();
    close();
    emit();
    status.textContent = 'Column layout updated.';
  });
  on(window, 'pagehide', () => {
    endResize(true);
    close();
  });
  const controller = {
    get value() {
      return clone(value);
    },
    setLayout(next) {
      if (!active) return;
      if (busy) throw new Error('Wait for the table update before changing its layout.');
      const validated = validate(next);
      endResize(true);
      close();
      value = validated;
      render();
      emit();
    },
    refresh() {
      if (active) render();
    },
    setBusy(next) {
      if (!active) return;
      busy = Boolean(next);
      trigger.disabled = busy;
      if (busy) {
        endResize(true);
        close();
      }
      render();
    },
    destroy() {
      if (!active) return;
      endResize(true);
      close();
      reorder?.destroy();
      active = false;
      events.abort();
      handles.forEach(handle => handle.remove());
      colgroup.remove();
      dialog.remove();
      status.remove();
      summary.remove();
      for (const row of rows()) {
        const cells = rowCells(row);
        for (const [index, key] of keys.entries()) {
          const cell = cells.get(key);
          cell.hidden = originalHidden.get(cell) ?? cell.hidden;
          if (row.cells[index] !== cell) row.insertBefore(cell, row.cells[index] || null);
        }
      }
      if (originalStyle === null) table.removeAttribute('style');
      else table.setAttribute('style', originalStyle);
      if (originalConfigured === null) table.removeAttribute('data-table-configured');
      else table.setAttribute('data-table-configured', originalConfigured);
      trigger.disabled = originalDisabled;
      for (const [name, previous] of [
        ['aria-expanded', originalExpanded],
        ['aria-controls', originalControls],
      ]) {
        if (previous === null) trigger.removeAttribute(name);
        else trigger.setAttribute(name, previous);
      }
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  render();
  return controller;
}
