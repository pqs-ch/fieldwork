// Optional explicit-ID or query-scoped selection; never enumerate unseen matching rows.
const controllers = new WeakMap();
const clone = value => JSON.parse(JSON.stringify(value));
export function enhanceTableSelection(root) {
  if (controllers.has(root)) return controllers.get(root);
  const page = root.querySelector('[data-table-select-page]');
  if (!page) return;
  const events = new AbortController();
  const count = root.querySelector('[data-table-selected-count]');
  const bar = root.querySelector('[data-table-selection]');
  const barWasHidden = bar?.hidden;
  const clear = root.querySelector('[data-table-clear-selection]');
  const clearWasHidden = clear?.hidden;
  const bulk = [...root.querySelectorAll('[data-table-bulk-action]')];
  const stateInput = root.querySelector('input[data-table-selection-state]');
  const stateInputDisabled = stateInput?.disabled;
  const original = new Map([page, clear, ...bulk].filter(Boolean).map(el => [el, el.disabled]));
  const initialPage = { checked: page.checked, indeterminate: page.indeterminate };
  const rowDisabled = new WeakMap();
  let active = true,
    busy = false,
    mode = 'ids';
  let selected = new Set(),
    excluded = new Set(),
    matching = null;
  let scope, scopeText, selectMatching;
  const controls = () => [...root.querySelectorAll('tbody input[data-table-select-row]')];
  const eligible = input =>
    !input.disabled && !input.closest('[hidden]') && input.getClientRects().length > 0;
  function rows() {
    const inputs = controls(),
      keys = inputs.map(input => input.value);
    if (
      inputs.some(input => input.type !== 'checkbox' || !input.hasAttribute('value')) ||
      keys.some(key => !key) ||
      new Set(keys).size !== keys.length
    )
      throw new Error('Selectable rows need unique, nonempty checkbox values.');
    return inputs;
  }
  function context(value) {
    if (value === null) return null;
    if (
      !value ||
      typeof value.token !== 'string' ||
      !value.token.trim() ||
      (value.total !== null && (!Number.isSafeInteger(value.total) || value.total < 0))
    )
      throw new Error(
        'Matching selection needs a nonempty query token and a nonnegative total, or null for an unknown total.'
      );
    return { token: value.token, total: value.total };
  }
  if (root.dataset.tableMatchingToken)
    matching = context({
      token: root.dataset.tableMatchingToken,
      total: root.hasAttribute('data-table-matching-total')
        ? root.dataset.tableMatchingTotal.trim() === ''
          ? NaN
          : Number(root.dataset.tableMatchingTotal)
        : null,
    });
  const value = () =>
    mode === 'all'
      ? { mode: 'all', queryToken: matching.token, excludedIds: [...excluded] }
      : { mode: 'ids', ids: [...selected], ...(matching ? { queryToken: matching.token } : {}) };
  const size = () =>
    mode === 'ids'
      ? selected.size
      : matching.total === null
        ? null
        : Math.max(0, matching.total - excluded.size);
  const announce = () =>
    root.dispatchEvent(
      new CustomEvent('fieldwork:selectionchange', {
        bubbles: true,
        detail: { selection: value(), ids: mode === 'ids' ? [...selected] : null },
      })
    );
  function reset() {
    mode = 'ids';
    selected.clear();
    excluded.clear();
  }
  rows(); // Validate even when restoring an authored selection descriptor.
  if (stateInput?.value) {
    const saved = JSON.parse(stateInput.value);
    const list = saved.mode === 'all' ? saved.excludedIds : saved.ids;
    if (
      !['ids', 'all'].includes(saved.mode) ||
      !Array.isArray(list) ||
      list.some(id => typeof id !== 'string' || !id) ||
      new Set(list).size !== list.length
    )
      throw new Error('Invalid initial table selection.');
    if (
      (saved.queryToken && saved.queryToken !== matching?.token) ||
      (saved.mode === 'all' && (!matching || saved.queryToken !== matching.token))
    )
      throw new Error('Initial selection does not match the current query token.');
    mode = saved.mode;
    if (mode === 'all') excluded = new Set(list);
    else selected = new Set(list);
  } else
    selected = new Set(
      rows()
        .filter(input => eligible(input) && input.checked)
        .map(input => input.value)
    );
  function ensureScope() {
    if (scope || !matching) return;
    scope = document.createElement('div');
    scope.className = 'table-selection-scope';
    scopeText = document.createElement('p');
    selectMatching = document.createElement('button');
    selectMatching.type = 'button';
    selectMatching.className = 'button';
    selectMatching.dataset.tableSelectMatching = '';
    scope.append(scopeText, selectMatching);
    (
      root.querySelector('[data-table-selection]') ||
      root.querySelector('.table-toolbar') ||
      page.closest('table')
    ).after(scope);
    selectMatching.addEventListener(
      'click',
      () => {
        if (!active || busy || !matching) return;
        if (mode === 'all') {
          clearSelection();
          page.focus();
          return;
        }
        mode = 'all';
        selected.clear();
        excluded.clear();
        render();
        announce();
        // The same focused control now offers Deselect all.
      },
      { signal: events.signal }
    );
  }
  function render() {
    const focused = document.activeElement;
    const inputs = rows(),
      available = inputs.filter(eligible);
    const isSelected = input =>
      eligible(input) && (mode === 'all' ? !excluded.has(input.value) : selected.has(input.value));
    for (const input of inputs) {
      if (!rowDisabled.has(input)) rowDisabled.set(input, input.getAttribute('aria-disabled'));
      if (busy) input.setAttribute('aria-disabled', 'true');
      else if (rowDisabled.get(input) === null) input.removeAttribute('aria-disabled');
      else input.setAttribute('aria-disabled', rowDisabled.get(input));
      input.checked = isSelected(input);
      input.closest('tr').toggleAttribute('data-selected', input.checked);
    }
    page.checked = available.length > 0 && available.every(isSelected);
    page.indeterminate = available.some(isSelected) && !page.checked;
    page.disabled = busy || available.length === 0;
    const total = size();
    const visibleIds = new Set(available.map(input => input.value));
    const offPage = [...selected].some(id => !visibleIds.has(id));
    if (count)
      count.textContent =
        mode === 'all'
          ? total === null
            ? `All matching results selected${excluded.size ? ` except ${excluded.size}` : ''}`
            : `${total.toLocaleString()} selected across all pages`
          : `${selected.size.toLocaleString()} selected${matching ? (offPage ? ' across pages' : '') : ' on this page'}`;
    if (clear) {
      clear.disabled = busy || (mode === 'ids' && total === 0);
      clear.hidden = clearWasHidden || mode === 'all';
    }
    for (const action of bulk) action.disabled = original.get(action) || busy || total === 0;
    if (stateInput) {
      stateInput.value = JSON.stringify(value());
      stateInput.disabled = false;
    }
    ensureScope();
    if (scope) {
      selectMatching.disabled = busy;
      const more = matching && (matching.total === null || matching.total > selected.size);
      scope.hidden = mode !== 'all' && !(page.checked && more);
      if (mode === 'all') {
        scopeText.textContent = `Actions apply to matching results on every page.${excluded.size ? ` ${excluded.size.toLocaleString()} deselected ${excluded.size === 1 ? 'result is' : 'results are'} excluded.` : ''}`;
        selectMatching.hidden = false;
        selectMatching.textContent = 'Deselect all';
      } else {
        scopeText.textContent = `${available.length.toLocaleString()} rows on this page selected.`;
        selectMatching.hidden = false;
        selectMatching.disabled = busy;
        selectMatching.textContent =
          matching?.total == null
            ? 'Select all matching results'
            : `Select all ${matching?.total.toLocaleString()} matching results`;
      }
    }
    if (bar) {
      bar.hidden = mode === 'ids' && selected.size === 0;
      if (bar.hidden) {
        for (const menu of bar.querySelectorAll('[popover]')) {
          if (typeof menu.hidePopover === 'function' && menu.matches(':popover-open'))
            menu.hidePopover();
        }
      }
    }
    if ((bar?.hidden && bar.contains(focused)) || (scope?.hidden && scope.contains(focused))) {
      (!page.disabled ? page : root.querySelector('[data-table-options]'))?.focus();
    }
  }
  function refresh(options = {}) {
    if (!active) return;
    const before = JSON.stringify(value());
    if (Object.hasOwn(options, 'matching')) {
      const next = context(options.matching);
      if (next?.token !== matching?.token || (mode === 'all' && next?.total !== matching?.total))
        reset();
      matching = next;
      if (matching) {
        root.dataset.tableMatchingToken = matching.token;
        if (matching.total === null) root.removeAttribute('data-table-matching-total');
        else root.dataset.tableMatchingTotal = String(matching.total);
      } else {
        root.removeAttribute('data-table-matching-token');
        root.removeAttribute('data-table-matching-total');
      }
    }
    const inputs = rows(),
      visible = inputs.filter(input => !input.closest('[hidden]') && input.getClientRects().length);
    if (!matching) {
      const available = new Set(inputs.filter(eligible).map(input => input.value));
      selected = new Set([...selected].filter(id => available.has(id)));
    } else for (const input of visible) if (input.disabled) selected.delete(input.value);
    if (mode === 'all' && matching.total !== null && excluded.size > matching.total) reset();
    render();
    if (before !== JSON.stringify(value())) announce();
  }
  root.addEventListener(
    'change',
    event => {
      if (event.target !== page && !event.target.matches('input[data-table-select-row]')) return;
      if (busy) {
        render();
        return;
      }
      const affected =
        event.target === page ? rows().filter(eligible) : [event.target].filter(eligible);
      for (const input of affected) {
        const checked = event.target === page ? page.checked : input.checked;
        if (mode === 'all') {
          if (checked) excluded.delete(input.value);
          else excluded.add(input.value);
        } else if (checked) selected.add(input.value);
        else selected.delete(input.value);
      }
      render();
      announce();
    },
    { signal: events.signal }
  );
  const clearSelection = () => {
    if (!active) return;
    reset();
    render();
    announce();
  };
  clear?.addEventListener(
    'click',
    () => {
      if (!busy) {
        clearSelection();
        if (!page.disabled) page.focus();
      }
    },
    { signal: events.signal }
  );
  const forms = new Set(
    controls()
      .map(input => input.form)
      .filter(Boolean)
  );
  for (const form of forms) {
    form.addEventListener(
      'reset',
      event =>
        queueMicrotask(() => {
          if (!active || event.defaultPrevented) return;
          reset();
          selected = new Set(
            rows()
              .filter(input => eligible(input) && input.checked)
              .map(input => input.value)
          );
          render();
          announce();
        }),
      { signal: events.signal }
    );
    form.addEventListener(
      'submit',
      event => {
        if (busy) {
          event.preventDefault();
          return;
        }
        if (stateInput) {
          stateInput.value = JSON.stringify(value());
          stateInput.disabled = false;
        }
      },
      { signal: events.signal }
    );
  }
  root.addEventListener(
    'click',
    event => {
      if (
        busy &&
        event.target.closest(
          '[data-table-select-row], [data-table-select-page], [data-table-clear-selection], [data-table-select-matching], [data-table-bulk-action]'
        )
      )
        event.preventDefault();
    },
    { capture: true, signal: events.signal }
  );
  const controller = {
    get ids() {
      if (mode === 'all')
        throw new Error('All-matching selection has no enumerated ID list; use selection.value.');
      return [...selected];
    },
    get value() {
      return clone(value());
    },
    get count() {
      return size();
    },
    refresh,
    setMatching(matching) {
      refresh({ matching });
    },
    clear: clearSelection,
    setBusy(value) {
      if (!active) return;
      busy = Boolean(value);
      render();
    },
    destroy() {
      if (!active) return;
      active = false;
      events.abort();
      scope?.remove();
      for (const [el, disabled] of original) el.disabled = disabled;
      page.checked = initialPage.checked;
      page.indeterminate = initialPage.indeterminate;
      if (clear) clear.hidden = clearWasHidden;
      if (bar) bar.hidden = barWasHidden;
      if (stateInput) {
        stateInput.value = JSON.stringify(value());
        stateInput.disabled = stateInputDisabled;
      }
      for (const input of controls()) {
        input.closest('tr').removeAttribute('data-selected');
        const attribute = rowDisabled.get(input);
        if (attribute == null) input.removeAttribute('aria-disabled');
        else input.setAttribute('aria-disabled', attribute);
      }
      controllers.delete(root);
    },
  };
  controllers.set(root, controller);
  refresh();
  return controller;
}
