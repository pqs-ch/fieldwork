import { enhanceTableSelection } from './table-selection.js';
import { enhanceTableColumns } from './table-columns.js';
import { createAttributeSnapshot } from './internal/attributes.js';
const controllers = new WeakMap();
let nextId = 0;
const copy = value => JSON.parse(JSON.stringify(value));
const textRules = [
  'any',
  'contains',
  'not-contains',
  'equals',
  'not-equals',
  'starts',
  'ends',
  'blank',
  'not-blank',
];
const numberRules = ['any', 'equals', 'not-equals', 'greater', 'greater-equal', 'less', 'less-equal', 'between'];
const dateComparisons = ['equals', 'before', 'after', 'between'];
const dateRules = [
  'any', ...dateComparisons, 'today', 'yesterday', 'tomorrow',
  'last-week', 'this-week', 'next-week', 'last-month', 'this-month', 'next-month',
  'last-quarter', 'this-quarter', 'next-quarter', 'last-year', 'this-year', 'next-year',
  'year-to-date', 'period',
];

// Enhance application-authored native GET forms. Data transformation stays with the application.
export function enhanceDataTable(root, { onQueryChange } = {}) {
  if (controllers.has(root)) return controllers.get(root);
  if (onQueryChange !== undefined && typeof onQueryChange !== 'function')
    throw new TypeError('onQueryChange must be a function.');
  const form = root.querySelector('form[data-table-query]');
  if (!form) throw new Error('A data table needs a native data-table-query form.');
  const sort = form.querySelector('[data-table-sort]');
  const cursor = form.querySelector('[data-table-cursor]');
  const pageSize = form.querySelector('[data-table-page-size]');
  const originalPageSizeDisabled = pageSize?.disabled;
  if (Boolean(cursor) !== Boolean(pageSize))
    throw new Error('Pagination needs both a cursor input and a page-size select.');
  const groups = [...form.querySelectorAll('[data-table-column]')];
  const columns = new Map(groups.map(group => [group.dataset.tableColumn, group]));
  if (!sort || !groups.length || columns.size !== groups.length || columns.has(''))
    throw new Error('Supply a sort select and uniquely named columns.');
  const triggers = [...root.querySelectorAll('[data-table-options]')];
  for (const trigger of triggers)
    if (!columns.has(trigger.dataset.tableOptions))
      throw new Error('Each header must reference a column.');
  if (sort.tagName !== 'SELECT' || [...columns.keys()].some(key => key.includes(':')))
    throw new Error('Use a native sort select and column keys without colons.');
  for (const group of groups) {
    const type = group.dataset.type;
    const values = [...group.querySelectorAll('[data-filter-value]')];
    if (
      !['text', 'number', 'date', 'values'].includes(type) ||
      new Set(values.map(input => input.value)).size !== values.length ||
      values.some(input => input.type !== 'checkbox' || !input.closest('label'))
    )
      throw new Error('Supply a supported column type and uniquely valued, labeled checkboxes.');
    const required =
      type === 'text'
        ? ['filter-condition', 'filter-text']
        : type === 'number'
          ? ['filter-condition', 'filter-minimum', 'filter-maximum']
          : type === 'date'
            ? ['filter-condition', 'filter-date', 'filter-date-end']
            : [];
    if (required.some(name => !group.querySelector(`[data-${name}]`)))
      throw new Error('Supply the condition inputs for each typed column.');
  }
  if (!root.querySelector('[data-table-results], .table-scroll'))
    throw new Error('A data table needs a results region.');
  const events = new AbortController();
  const attributes = createAttributeSnapshot();
  const setAttribute = attributes.set;
  const on = (el, name, handler, options = {}) =>
    el.addEventListener(name, handler, { ...options, signal: events.signal });
  const part = (group, name) => group.querySelector(`[data-${name}]`);
  const choices = group => [...group.querySelectorAll('[data-filter-value]')];
  const label = key => columns.get(key).dataset.label || key;
  function readQuery() {
    const filters = {};
    for (const [key, group] of columns) {
      const condition = part(group, 'filter-condition')?.value || 'any';
      const all = choices(group);
      const checked = all.filter(input => input.checked).map(input => input.value);
      const values = all.length && checked.length !== all.length ? checked : null;
      const state = { condition, values };
      if (group.dataset.type === 'text' && !['any', 'blank', 'not-blank'].includes(condition)) {
        state.value = part(group, 'filter-text').value;
        state.caseSensitive = Boolean(part(group, 'filter-case')?.checked);
      }
      if (group.dataset.type === 'number' && condition !== 'any') {
        state.value = Number(part(group, 'filter-minimum').value);
        if (condition === 'between') state.upper = Number(part(group, 'filter-maximum').value);
      }
      if (group.dataset.type === 'date') {
        if (dateComparisons.includes(condition)) {
          state.value = part(group, 'filter-date').value;
          if (condition === 'between') state.upper = part(group, 'filter-date-end').value;
        } else if (condition === 'period') {
          state.value = part(group, 'filter-period')?.value || '';
        }
      }
      if (condition !== 'any' || values !== null) filters[key] = state;
    }
    const [column, direction] = sort.value.split(':');
    return {
      sort: column ? { column, direction } : null,
      filters,
      ...(cursor ? { page: { cursor: cursor.value || null, size: Number(pageSize.value) } } : {}),
    };
  }
  function syncFields(group) {
    const condition = part(group, 'filter-condition')?.value || 'any';
    for (const field of group.querySelectorAll('[data-when]')) {
      const visible = field.dataset.when.split(' ').includes(condition);
      setAttribute(field, 'hidden', visible ? null : '');
      for (const input of field.querySelectorAll('input,select,textarea'))
        setAttribute(input, 'disabled', visible ? null : '');
    }
  }
  function writeQuery(query) {
    sort.value = query.sort ? `${query.sort.column}:${query.sort.direction}` : '';
    if (cursor) {
      cursor.value = query.page?.cursor || '';
      if (query.page) pageSize.value = String(query.page.size);
    }
    for (const [key, group] of columns) {
      const state = query.filters[key] || { condition: 'any', values: null };
      const condition = part(group, 'filter-condition');
      if (condition) condition.value = state.condition;
      for (const [name, value] of [
        ['text', state.value ?? ''],
        ['minimum', state.value ?? ''],
        ['maximum', state.upper ?? ''],
        ['date', state.value ?? ''],
        ['date-end', state.upper ?? ''],
        ['period', state.value ?? ''],
      ]) {
        const input = part(group, `filter-${name}`);
        if (input) input.value = value;
      }
      const sensitive = part(group, 'filter-case');
      if (sensitive) sensitive.checked = Boolean(state.caseSensitive);
      for (const input of choices(group))
        input.checked = state.values === null || state.values.includes(input.value);
      syncFields(group);
    }
  }
  let query = readQuery();
  let active = true;
  let busy = false;
  const disabledDuringQuery = new Map();
  let current;
  let valueSearch;
  const valueSearchControls = new Map();
  const valueSelectLabels = new Map();
  let opener;
  let request;
  let errorControl;
  let errorAttributes;
  let version = 0;
  const columnLayout = enhanceTableColumns(root);
  let selection;
  try {
    selection = enhanceTableSelection(root);
  } catch (error) {
    columnLayout?.destroy();
    throw error;
  }
  const generated = [];
  const originalText = new Map(
    [...root.querySelectorAll('[data-value-count]')].map(el => [
      el,
      el.textContent,
    ])
  );
  const make = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };
  const announcement = make('p', 'visually-hidden');
  announcement.setAttribute('role', 'status');
  const feedback = make('p', 'table-feedback');
  feedback.hidden = true;
  const bar = make('div', 'table-filter-bar');
  bar.hidden = true;
  const chips = make('div', 'cluster');
  const clearAll = make('button', 'button', 'Clear all filters');
  clearAll.type = 'button';
  clearAll.dataset.variant = 'quiet';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Applied filters');
  bar.append(chips, clearAll);
  const originalBusy = form.getAttribute('aria-busy');
  const tableScroll =
    root.querySelector('[data-table-results]') || root.querySelector('.table-scroll');
  const filterSummary = root.querySelector('[data-table-filter-summary]');
  const originalSummaryHidden = filterSummary?.hidden;
  if (filterSummary) filterSummary.append(bar);
  else tableScroll.before(bar);
  tableScroll.before(feedback, announcement);
  generated.push(bar, feedback, announcement);
  const dialog = make('dialog', 'column-menu');
  dialog.id = `fieldwork-column-menu-${++nextId}`;
  dialog.dataset.tableMenu = '';
  const heading = make('h3');
  heading.id = `${dialog.id}-title`;
  const draftLabel = make('p', 'hint');
  draftLabel.setAttribute('role', 'status');
  const body = make('div', 'column-menu-body');
  const footer = make('div', 'menu-footer');
  const actions = make('div', 'form-actions');
  const cancel = make('button', 'button', 'Cancel');
  cancel.type = 'button';
  const apply = make('button', 'button', 'Apply');
  apply.type = 'submit';
  apply.dataset.intent = 'primary';
  const menuError = make('p', 'field-error');
  menuError.setAttribute('role', 'status');
  menuError.id = `${dialog.id}-error`;
  menuError.hidden = true;
  actions.append(cancel, apply);
  footer.append(menuError, actions);
  dialog.append(heading, draftLabel, body, footer);
  dialog.setAttribute('aria-labelledby', heading.id);
  form.append(dialog);
  generated.push(dialog);
  const selectionFields =
    !onQueryChange &&
    selection &&
    (form.dataset.tableSelectionName || form.dataset.tableSelectionStateName)
      ? document.createElement('div')
      : null;
  if (selectionFields) {
    selectionFields.hidden = true;
    form.append(selectionFields);
    generated.push(selectionFields);
  }
  const anchors = new Map();
  for (const group of groups) {
    const anchor = document.createComment('Column options return here');
    group.before(anchor);
    anchors.set(group, anchor);
    setAttribute(group, 'hidden', '');
    const valueList = group.querySelector('.value-filter');
    if (valueList && group.dataset.type !== 'values') setAttribute(valueList, 'open', null);
    const search = part(group, 'value-search');
    if (search) {
      setAttribute(search, 'disabled', null);
      const addLabel = make('label', 'check filter-add-selection');
      addLabel.hidden = true;
      const add = make('input');
      add.type = 'checkbox';
      add.dataset.valueAddSelection = '';
      addLabel.append(add, document.createTextNode('Add current selection to filter'));
      (search.closest('.field') || search).after(addLabel);
      valueSearchControls.set(group, {
        add, addLabel,
        allAriaLabel: part(group, 'select-values')?.getAttribute('aria-label') ?? null,
      });
      generated.push(addLabel);
      on(add, 'change', () => {
        if (!valueSearch || valueSearch.group !== group) return;
        valueSearch.add = add.checked;
        applyValueSearch();
        updateDraft();
      });
    }
    const selectAll = part(group, 'select-values');
    const selectLabel = part(group, 'select-values-label') ||
      [...(selectAll?.labels?.[0]?.childNodes || [])].find(node =>
        node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (selectLabel) {
      valueSelectLabels.set(group, selectLabel);
      originalText.set(selectLabel, selectLabel.textContent);
    }
    for (const control of group.querySelectorAll(
      '[data-select-values], [data-reset-filter], [data-sort-direction]'
    ))
      setAttribute(control, 'disabled', null);
  }
  const nativeSummary = root.querySelector('[data-table-native-summary]');
  if (nativeSummary) setAttribute(nativeSummary, 'hidden', '');
  const mainSubmit = form.querySelector('[data-table-submit]');
  if (mainSubmit) {
    setAttribute(mainSubmit, 'hidden', '');
    setAttribute(mainSubmit, 'disabled', '');
  }
  const sortField = sort.closest('.field') || sort;
  setAttribute(sortField, 'hidden', '');
  setAttribute(form, 'novalidate', '');
  function summary(key, state) {
    const group = columns.get(key);
    const parts = [];
    if (state.condition !== 'any') {
      const wording = part(group, 'filter-condition').selectedOptions[0].textContent;
      const value = group.dataset.type === 'date' && state.condition === 'period'
        ? part(group, 'filter-period')?.selectedOptions[0]?.textContent || state.value
        : state.value;
      parts.push(
        `${wording}${'value' in state ? ` ${value}${'upper' in state ? `–${state.upper}` : ''}` : ''}${state.caseSensitive ? ' · match case' : ''}`
      );
    }
    if (state.values !== null) {
      const inputs = choices(group);
      const valueLabel = input => input.dataset.label || input.value || '(Blanks)';
      const labels = inputs.filter(input => state.values.includes(input.value)).map(valueLabel);
      const excluded = inputs.filter(input => !state.values.includes(input.value)).map(valueLabel);
      parts.push(
        labels.length === 0
          ? 'No values selected'
          : labels.length <= 2
            ? labels.join(', ')
            : excluded.length > 0 && excluded.length <= 2
              ? `All except ${excluded.join(', ')}`
              : `${labels.length} values selected`
      );
    }
    return `${label(key)}: ${parts.join(' · ')}`;
  }
  function renderQuery() {
    chips.replaceChildren();
    bar.hidden = Object.keys(query.filters).length === 0;
    if (filterSummary) filterSummary.hidden = bar.hidden;
    clearAll.hidden = Object.keys(query.filters).length < 2;
    for (const trigger of triggers) {
      const key = trigger.dataset.tableOptions;
      setAttribute(trigger, 'data-filtered', query.filters[key] ? '' : null);
      setAttribute(
        trigger,
        'aria-label',
        `${label(key)}: sort or filter${query.filters[key] ? ', filter active' : ''}${query.sort?.column === key ? `, sorted ${query.sort.direction}` : ''}`
      );
      const th = trigger.closest('th');
      if (th)
        setAttribute(th, 'aria-sort', query.sort?.column === key ? query.sort.direction : null);
    }
    for (const [key, state] of Object.entries(query.filters)) {
      const chip = make('button', 'table-filter', `${summary(key, state)} ×`);
      chip.type = 'button';
      chip.setAttribute('aria-label', `Remove ${summary(key, state)}`);
      chip.dataset.column = key;
      chips.append(chip);
    }
    columnLayout?.refresh();
  }
  function position() {
    if (!dialog.open || !opener) return;
    const viewport = window.visualViewport;
    const x = viewport?.offsetLeft || 0,
      y = viewport?.offsetTop || 0;
    const width = viewport?.width || innerWidth,
      height = viewport?.height || innerHeight;
    dialog.style.maxWidth = `${width - 32}px`;
    dialog.style.maxHeight = `${height - 32}px`;
    const anchor = opener.getBoundingClientRect(),
      box = dialog.getBoundingClientRect();
    dialog.style.left = `${Math.max(x + 16, Math.min(anchor.left, x + width - box.width - 16))}px`;
    dialog.style.top = `${Math.max(y + 16, Math.min(anchor.bottom + 8, y + height - box.height - 16))}px`;
  }
  function clearError() {
    menuError.hidden = true;
    menuError.textContent = '';
    if (errorControl) {
      for (const [name, value] of Object.entries(errorAttributes)) {
        if (value === null) errorControl.removeAttribute(name);
        else errorControl.setAttribute(name, value);
      }
      errorControl = null;
    }
  }
  function resetValueSearch() {
    if (!valueSearch) return;
    const { group } = valueSearch;
    part(group, 'value-search').value = '';
    const { add, addLabel } = valueSearchControls.get(group);
    add.checked = false;
    addLabel.hidden = true;
    for (const input of choices(group)) setAttribute(input.closest('label'), 'hidden', null);
    const empty = part(group, 'values-empty');
    if (empty) setAttribute(empty, 'hidden', '');
    const label = valueSelectLabels.get(group);
    if (label) label.textContent = originalText.get(label);
    const all = part(group, 'select-values');
    if (all) setAttribute(all, 'aria-label', valueSearchControls.get(group).allAriaLabel);
    valueSearch = null;
  }
  function applyValueSearch() {
    const { group, before, matching, selected, add } = valueSearch;
    for (const input of choices(group))
      input.checked = matching.has(input.value)
        ? selected.has(input.value)
        : add && before.has(input.value);
  }
  function searchValues(group) {
    const term = part(group, 'value-search').value;
    const inputs = choices(group);
    if (!valueSearch || valueSearch.group !== group) {
      valueSearch = { group, term: '', before: new Set(), matching: new Set(), selected: new Set(), add: false };
    }
    if (!valueSearch.term && term)
      valueSearch.before = new Set(inputs.filter(input => input.checked).map(input => input.value));
    if (!term) {
      if (valueSearch.term)
        for (const input of inputs) input.checked = valueSearch.before.has(input.value);
      resetValueSearch();
      updateDraft();
      return;
    }
    valueSearch.term = term;
    valueSearch.matching = new Set(inputs.filter(input =>
      [input.dataset.label || '', input.value].some(value =>
        value.toLocaleLowerCase().includes(term.toLocaleLowerCase()))
    ).map(input => input.value));
    valueSearch.selected = new Set(valueSearch.matching);
    for (const input of inputs)
      setAttribute(input.closest('label'), 'hidden', valueSearch.matching.has(input.value) ? null : '');
    const { add, addLabel } = valueSearchControls.get(group);
    addLabel.hidden = valueSearch.before.size === 0 || valueSearch.before.size === inputs.length;
    if (addLabel.hidden) valueSearch.add = add.checked = false;
    const empty = part(group, 'values-empty');
    if (empty) setAttribute(empty, 'hidden', valueSearch.matching.size ? '' : null);
    applyValueSearch();
    updateDraft();
  }
  function updateDraft() {
    if (!current) return;
    const group = columns.get(current);
    syncFields(group);
    const inputs = choices(group),
      selected = inputs.filter(input => input.checked).length;
    const searching = valueSearch?.group === group && Boolean(valueSearch.term);
    const scope = searching ? inputs.filter(input => valueSearch.matching.has(input.value)) : inputs;
    const scopedSelected = scope.filter(input => input.checked).length;
    const all = part(group, 'select-values');
    if (all) {
      all.checked = scope.length > 0 && scopedSelected === scope.length;
      all.indeterminate = scopedSelected > 0 && scopedSelected < scope.length;
      setAttribute(all, 'disabled', busy || scope.length === 0 ? '' : null);
      if (searching) setAttribute(all, 'aria-label', 'Select all search results');
    }
    const selectLabel = valueSelectLabels.get(group);
    if (selectLabel) selectLabel.textContent = searching ? 'Select all search results' : originalText.get(selectLabel);
    const count = part(group, 'value-count');
    if (count)
      count.textContent = searching
        ? `${scopedSelected} of ${scope.length} matches selected · ${selected} total`
        : `${selected} of ${inputs.length} selected${group.dataset.type === 'values' ? '' : ' · AND with condition'}`;
    const draft = readQuery();
    const reset = part(group, 'reset-filter');
    if (reset) setAttribute(reset, 'disabled', query.filters[current] ? null : '');
    const clearSort = group.querySelector('[data-sort-direction=none]');
    if (clearSort) setAttribute(clearSort, 'disabled', query.sort ? null : '');
    const dirty = JSON.stringify(draft) !== JSON.stringify(query);
    draftLabel.textContent = dirty
      ? 'Changes not applied'
      : query.filters[current]
        ? 'Filter applied'
        : 'No changes';
    apply.disabled = busy || !dirty;
    position();
  }
  function close() {
    if (dialog.open) dialog.close();
    resetValueSearch();
    writeQuery(query);
    if (current) {
      const group = columns.get(current);
      updateDraft();
      anchors.get(group).after(group);
      group.hidden = true;
      current = null;
    }
    clearError();
    for (const trigger of triggers) trigger.setAttribute('aria-expanded', 'false');
  }
  function open(key, trigger) {
    if (!active || busy || document.querySelector('dialog[open]')) return;
    close();
    current = key;
    opener = trigger?.getClientRects().length
      ? trigger
      : root.querySelector('[data-table-configure-columns]') || trigger;
    const group = columns.get(key);
    body.append(group);
    group.hidden = false;
    const condition = part(group, 'filter-condition');
    const text = group.dataset.type === 'text' ? part(group, 'filter-text') : null;
    const date = group.dataset.type === 'date' ? part(group, 'filter-date') : null;
    if (text && condition.value === 'any' &&
        [...condition.options].some(option => option.value === 'contains' && !option.disabled))
      condition.value = 'contains';
    const search = part(group, 'value-search');
    if (search) search.value = '';
    for (const input of choices(group)) setAttribute(input.closest('label'), 'hidden', null);
    const noChoices = part(group, 'values-empty');
    if (noChoices) setAttribute(noChoices, 'hidden', '');
    heading.textContent = `${label(key)} options`;
    trigger.setAttribute('aria-expanded', 'true');
    dialog.showModal();
    dialog.scrollTop = 0;
    body.scrollTop = 0;
    updateDraft();
    (text && !text.disabled && text.getClientRects().length
      ? text
      : date && !date.disabled && date.getClientRects().length
        ? date
        : condition || search || group.querySelector('input'))?.focus();
  }
  function setBusy(value) {
    setAttribute(tableScroll, 'aria-busy', String(value));
    for (const trigger of triggers) setAttribute(trigger, 'aria-disabled', String(value));
    if (value) draftLabel.textContent = 'Updating results…';
    busy = value;
    columnLayout?.setBusy(value);
    selection?.setBusy(value);
    form.setAttribute('aria-busy', String(value));
    for (const button of [apply, cancel, clearAll, ...chips.querySelectorAll('button')])
      button.disabled = value;
    for (const group of groups)
      for (const control of group.querySelectorAll('input,select,button')) {
        if (value) {
          disabledDuringQuery.set(control, control.disabled);
          control.disabled = true;
        } else if (disabledDuringQuery.has(control))
          control.disabled = disabledDuringQuery.get(control);
      }
    if (!value) disabledDuringQuery.clear();
    if (pageSize) pageSize.disabled = value || originalPageSizeDisabled;
    apply.textContent = value ? 'Applying…' : 'Apply';
  }
  function validate() {
    clearError();
    if (pageSize && (!Number.isSafeInteger(Number(pageSize.value)) || Number(pageSize.value) < 1))
      throw new Error('Choose a positive integer page size.');
    for (const [key, group] of columns) {
      const condition = part(group, 'filter-condition')?.value || 'any';
      let invalid, message;
      if (
        (group.dataset.type === 'text' && !textRules.includes(condition)) ||
        (group.dataset.type === 'number' && !numberRules.includes(condition)) ||
        (group.dataset.type === 'date' && !dateRules.includes(condition))
      )
        throw new Error('Unsupported table condition.');
      if (group.dataset.type === 'text' && !['any', 'blank', 'not-blank'].includes(condition)) {
        invalid = part(group, 'filter-text');
        if (!invalid.value.trim()) message = 'Enter text to match, or choose Is blank.';
      }
      if (group.dataset.type === 'number' && condition !== 'any') {
        invalid = part(group, 'filter-minimum');
        if (!invalid.value || !Number.isFinite(invalid.valueAsNumber)) message = 'Enter an amount.';
        else if (condition === 'between') {
          const maximum = part(group, 'filter-maximum');
          if (!maximum.value || !Number.isFinite(maximum.valueAsNumber)) {
            invalid = maximum;
            message = 'Enter a maximum amount.';
          } else if (maximum.valueAsNumber < invalid.valueAsNumber) {
            invalid = maximum;
            message = 'Maximum must be at least the minimum.';
          }
        }
      }
      if (group.dataset.type === 'date' && dateComparisons.includes(condition)) {
        invalid = part(group, 'filter-date');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(invalid.value) || !Number.isFinite(invalid.valueAsNumber)) message = 'Enter a valid date.';
        else if (condition === 'between') {
          const end = part(group, 'filter-date-end');
          if (!/^\d{4}-\d{2}-\d{2}$/.test(end.value) || !Number.isFinite(end.valueAsNumber)) {
            invalid = end;
            message = 'Enter a valid end date.';
          } else if (end.valueAsNumber < invalid.valueAsNumber) {
            invalid = end;
            message = 'End date must be on or after the start date.';
          }
        }
      } else if (group.dataset.type === 'date' && condition === 'period') {
        invalid = part(group, 'filter-period') || part(group, 'filter-condition');
        if (!/^(month:(0[1-9]|1[0-2])|quarter:[1-4])$/.test(invalid.value))
          message = 'Choose a month or quarter.';
      }
      if (message) {
        if (!dialog.open)
          open(
            key,
            triggers.find(trigger => trigger.dataset.tableOptions === key)
          );
        menuError.textContent = message;
        menuError.hidden = false;
        errorControl = invalid;
        errorAttributes = {
          'aria-invalid': invalid.getAttribute('aria-invalid'),
          'aria-describedby': invalid.getAttribute('aria-describedby'),
        };
        setAttribute(invalid, 'aria-invalid', 'true');
        setAttribute(
          invalid,
          'aria-describedby',
          `${invalid.getAttribute('aria-describedby') || ''} ${menuError.id}`.trim()
        );
        position();
        invalid.focus();
        return false;
      }
    }
    return true;
  }
  async function submitQuery(focusTarget) {
    if (!active || busy || !validate()) return;
    let next = readQuery();
    if (
      cursor &&
      (JSON.stringify(next.filters) !== JSON.stringify(query.filters) ||
        JSON.stringify(next.sort) !== JSON.stringify(query.sort) ||
        next.page.size !== query.page.size)
    ) {
      cursor.value = '';
      next = readQuery();
    }
    if (!onQueryChange) {
      form.requestSubmit(apply);
      return;
    }
    const focusOrigin = document.activeElement;
    const modalRequest = dialog.open;
    const ticket = ++version;
    request = new AbortController();
    feedback.hidden = false;
    feedback.textContent = 'Updating results…';
    feedback.removeAttribute('data-tone');
    announcement.textContent = 'Updating results. Earlier results remain available.';
    setBusy(true);
    try {
      const result = await onQueryChange(copy(next), { signal: request.signal });
      if (!active || ticket !== version || request.signal.aborted) return;
      const filtersChanged = JSON.stringify(next.filters) !== JSON.stringify(query.filters);
      const restoreFocus =
        modalRequest ||
        document.activeElement === focusOrigin ||
        document.activeElement === document.body;
      query = next;
      setBusy(false);
      close();
      renderQuery();
      if (filtersChanged) selection?.clear();
      if (result && Object.hasOwn(result, 'matching'))
        selection?.refresh({ matching: result.matching });
      else if (filtersChanged) selection?.refresh({ matching: null });
      else selection?.refresh();
      feedback.hidden = true;
      announcement.textContent =
        `Table updated. ${root.querySelector('[data-table-result-total]')?.textContent || ''}`.trim();
      if (restoreFocus) {
        const target =
          focusTarget?.isConnected && focusTarget.getClientRects().length
            ? focusTarget
            : root.querySelector('[data-table-configure-columns]') ||
              root.querySelector('[data-table-results-heading]') ||
              tableScroll.querySelector('.table-scroll') ||
              tableScroll;
        if (!target.hasAttribute('tabindex') && !target.matches('a,button,input,select'))
          setAttribute(target, 'tabindex', '-1');
        target.focus();
      }
    } catch (error) {
      if (!active || ticket !== version || request.signal.aborted) return;
      setBusy(false);
      const message = 'Results could not be updated. Earlier results are still shown. Try again.';
      feedback.textContent = message;
      feedback.dataset.tone = 'error';
      announcement.textContent = message;
      if (current) {
        menuError.textContent =
          'Changes were not applied. Try Apply again, or Cancel to keep the current results.';
        menuError.hidden = false;
        updateDraft();
      } else {
        writeQuery(query);
        renderQuery();
      }
    }
  }
  on(form, 'keydown', event => {
    if (
      event.key !== 'Enter' ||
      !current ||
      !event.target.matches('input:not([type=checkbox]):not([type=radio])')
    )
      return;
    event.preventDefault();
    if (!apply.disabled) form.requestSubmit(apply);
  });
  on(form, 'submit', event => {
    if (busy) {
      event.preventDefault();
      return;
    }
    if (!validate()) {
      event.preventDefault();
      return;
    }
    if (cursor) {
      const next = readQuery();
      if (
        JSON.stringify(next.filters) !== JSON.stringify(query.filters) ||
        JSON.stringify(next.sort) !== JSON.stringify(query.sort) ||
        next.page.size !== query.page.size
      )
        cursor.value = '';
    }
    if (!onQueryChange) {
      selectionFields?.replaceChildren();
      const stateName = form.dataset.tableSelectionStateName;
      const name = stateName || form.dataset.tableSelectionName;
      if (
        selectionFields &&
        name &&
        selection &&
        JSON.stringify(readQuery().filters) === JSON.stringify(query.filters)
      ) {
        const state = selection.value;
        if (!stateName && state.mode === 'all') {
          event.preventDefault();
          throw new Error('Native all-matching navigation needs data-table-selection-state-name.');
        }
        for (const value of stateName ? [JSON.stringify(state)] : state.ids) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          selectionFields.append(input);
        }
      }
      return; // Native navigation/Turbo owns transport and response markup.
    }
    event.preventDefault();
    submitQuery(opener);
  });
  for (const trigger of triggers) {
    setAttribute(trigger, 'role', 'button');
    setAttribute(trigger, 'aria-haspopup', 'dialog');
    setAttribute(trigger, 'aria-controls', dialog.id);
    setAttribute(trigger, 'aria-expanded', 'false');
    on(trigger, 'click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      event.preventDefault();
      open(trigger.dataset.tableOptions, trigger);
    });
    on(trigger, 'keydown', event => {
      if (event.key === ' ') {
        event.preventDefault();
        open(trigger.dataset.tableOptions, trigger);
      }
    });
  }
  on(form, 'input', event => {
    if (event.target.matches('[data-select-values], [data-value-search], [data-value-add-selection]')) return;
    if (valueSearch?.term && valueSearch.group.contains(event.target) && event.target.matches('[data-filter-value]') &&
        valueSearch.matching.has(event.target.value)) {
      if (event.target.checked) valueSearch.selected.add(event.target.value);
      else valueSearch.selected.delete(event.target.value);
      applyValueSearch();
    }
    clearError();
    updateDraft();
  });
  on(form, 'change', event => {
    updateDraft();
    if (event.target === pageSize && !busy) {
      cursor.value = '';
      submitQuery(pageSize);
    }
  });
  on(root, 'click', event => {
    const control = event.target.closest('[data-table-page]');
    if (
      !control ||
      !root.contains(control) ||
      !cursor ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    if (busy || control.matches(':disabled') || control.getAttribute('aria-disabled') === 'true')
      return;
    cursor.value = control.dataset.tablePage;
    opener = control;
    submitQuery(control);
  });
  on(form, 'click', event => {
    if (busy || !current) return;
    const group = columns.get(current);
    if (event.target.closest('[data-reset-filter]')) {
      const next = copy(query);
      delete next.filters[current];
      resetValueSearch();
      writeQuery(next);
      updateDraft();
      submitQuery(opener);
      return;
    }
    const sorting = event.target.closest('[data-sort-direction]');
    if (sorting) {
      const key = current;
      resetValueSearch();
      writeQuery(query);
      sort.value =
        sorting.dataset.sortDirection === 'none' ? '' : `${key}:${sorting.dataset.sortDirection}`;
      submitQuery(opener);
    }
  });
  for (const group of groups) {
    const search = part(group, 'value-search');
    if (search) on(search, 'input', () => { clearError(); searchValues(group); });
    const all = part(group, 'select-values');
    if (all)
      on(all, 'change', () => {
        if (valueSearch?.group === group && valueSearch.term) {
          valueSearch.selected = all.checked ? new Set(valueSearch.matching) : new Set();
          applyValueSearch();
        } else {
          for (const input of choices(group)) input.checked = all.checked;
        }
        clearError();
        updateDraft();
      });
  }
  on(cancel, 'click', close);
  on(dialog, 'keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!busy) close();
    }
  });
  on(dialog, 'cancel', event => {
    event.preventDefault();
    if (!busy) close();
  });
  on(dialog, 'close', () => {
    if (active && !dialog.open) close();
  });
  on(dialog, 'click', event => {
    const box = dialog.getBoundingClientRect();
    if (
      !busy &&
      event.target === dialog &&
      (event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom)
    )
      close();
  });
  on(chips, 'click', event => {
    const chip = event.target.closest('button[data-column]');
    if (!chip || busy) return;
    const key = chip.dataset.column;
    const next = copy(query);
    delete next.filters[key];
    writeQuery(next);
    current = null;
    submitQuery(triggers.find(el => el.dataset.tableOptions === key));
  });
  on(clearAll, 'click', () => {
    if (!busy) {
      writeQuery({ ...query, filters: {} });
      current = null;
      submitQuery(triggers[0]);
    }
  });
  on(form, 'toggle', position, { capture: true });
  on(window, 'scroll', position, { capture: true, passive: true });
  on(window, 'resize', position);
  if (window.visualViewport) {
    on(window.visualViewport, 'resize', position);
    on(window.visualViewport, 'scroll', position);
  }
  function suspend() {
    version++;
    request?.abort();
    if (busy) setBusy(false);
    close();
    feedback.hidden = true;
    renderQuery();
  }
  on(window, 'pagehide', suspend);
  on(window, 'pageshow', () => {
    if (active) {
      columnLayout?.refresh();
      selection?.refresh();
    }
  });
  const controller = {
    get query() {
      return copy(query);
    },
    get isUpdating() {
      return busy;
    },
    selection,
    columnLayout,
    refresh(options) {
      columnLayout?.refresh();
      selection?.refresh(options);
    },
    openColumn(key) {
      if (!columns.has(key)) throw new Error('Unknown column.');
      open(
        key,
        triggers.find(trigger => trigger.dataset.tableOptions === key)
      );
    },
    destroy() {
      if (!active) return;
      suspend();
      active = false;
      events.abort();
      selection?.destroy();
      columnLayout?.destroy();
      for (const group of groups) {
        anchors.get(group).after(group);
        anchors.get(group).remove();
      }
      for (const el of generated) el.remove();
      if (filterSummary) filterSummary.hidden = originalSummaryHidden;
      for (const [el, text] of originalText) el.textContent = text;
      attributes.restore();
      if (originalBusy === null) form.removeAttribute('aria-busy');
      else form.setAttribute('aria-busy', originalBusy);
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  writeQuery(query);
  renderQuery();
  return controller;
}
