// Application-owned saved preferences and URLs; Fieldwork owns table behavior.
export function mountWorkViews(root, table) {
  if (!root.hasAttribute('data-work-page')) return () => {};
  const panel = root.querySelector('#saved-work');
  if (!panel || !table?.columnLayout) return () => {};

  const events = new AbortController();
  const state = JSON.parse(panel.dataset.state);
  const baseline = JSON.parse(panel.dataset.baseline);
  const originalColumns = JSON.stringify(state.columns);
  table.columnLayout.setLayout(state.columns);
  state.columns = table.columnLayout.value;
  if (originalColumns === JSON.stringify(baseline.columns)) baseline.columns = state.columns;
  const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
  const badge = panel.querySelector('[data-work-change]');
  const picker = panel.querySelector('select[data-work-picker]');
  const open = panel.querySelector('[data-work-open]');
  const originalOpenHidden = open.hidden;
  open.hidden = true;
  picker.addEventListener('change', () => picker.form.requestSubmit(), { signal: events.signal });

  function sync() {
    state.columns = table.columnLayout.value;
    const modified = !equal(state, baseline);
    badge.textContent = panel.dataset.shared === 'true' ? 'Unsaved query' : 'Modified';
    badge.hidden = !modified && panel.dataset.shared !== 'true';
    for (const input of panel.querySelectorAll('[data-work-state]')) input.value = JSON.stringify(state);
    panel.querySelector('[data-work-columns]').value = JSON.stringify(state.columns);

    const update = panel.querySelector('[data-work-update]');
    if (update) {
      update.disabled = !modified || update.dataset.conflict === 'true';
      update.form.hidden = !modified;
    }
    const reset = panel.querySelector('[data-work-reset]');
    if (reset) reset.hidden = !modified && update?.dataset.conflict !== 'true' && !panel.querySelector('[data-work-result]');

    const current = new URL(panel.dataset.currentUrl, location.origin);
    current.searchParams.set('columns', JSON.stringify(state.columns));
    const back = current.pathname + current.search;
    for (const link of panel.querySelectorAll('[data-work-task]')) {
      const destination = new URL(link.href);
      destination.searchParams.set('back', back);
      link.href = destination.href;
    }
    for (const link of document.querySelectorAll('#saved-work [data-work-page], [data-work-context]')) {
      const destination = new URL(link.href);
      destination.searchParams.set('columns', JSON.stringify(state.columns));
      link.href = destination.href;
    }
    // Keep the committed working layout in the URL for history and task return.
    if (location.pathname === current.pathname) history.replaceState(history.state, '', current);
  }

  panel.addEventListener('fieldwork:columnlayoutchange', sync, { signal: events.signal });
  sync();
  return () => { events.abort(); open.hidden = originalOpenHidden; };
}
