async page => {
  const origin = __ORIGIN__;
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const ready = () => page.waitForFunction(() =>
    document.querySelector('[data-table-options="owner"]')?.getAttribute('aria-haspopup') === 'dialog');
  const menu = page.locator('dialog[open]');
  const search = menu.getByRole('searchbox');
  const bulk = menu.getByRole('checkbox', { name: 'Select all search results', exact: true });
  const add = menu.getByRole('checkbox', { name: 'Add current selection to filter', exact: true });
  const open = async () => { await ready(); await page.locator('[data-table-options="owner"]').click(); };
  const apply = async expected => {
    await menu.getByRole('button', { name: 'Apply', exact: true }).click();
    await page.waitForFunction(expected =>
      !document.querySelector('dialog[open]') &&
      document.querySelector('.table-toolbar').textContent.includes(`${expected} of 9`), expected);
    await ready();
  };

  await page.goto(origin + '/operations/projects?sort=name%3Adescending&page=2');
  await ready();
  assert(await page.locator('.table-toolbar [data-table-filter-summary]').isHidden(), 'An unfiltered toolbar must not reserve an empty filter slot');
  await open();
  await search.fill('am');
  assert(await bulk.isChecked(), 'Search should select matching results');
  assert(await menu.locator('.filter-values label:visible').count() === 2, 'Overlapping matches');
  await menu.getByLabel('Jamie Chen', { exact: true }).uncheck();
  assert(await bulk.evaluate(input => input.indeterminate), 'Partial result selection');
  await bulk.check();
  await search.fill('No matching owner');
  assert(await bulk.isDisabled(), 'Empty results must disable Select all');
  await search.fill('Sam');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('dialog[open]'));
  await ready();
  assert((await page.locator('.table-toolbar').innerText()).includes('3 of 9'), 'Search alone must filter results');
  assert(await page.locator('.table-toolbar [data-table-filter-summary] .table-filter-bar').isVisible(), 'Applied filters must stay with the count and actions');
  assert(new URL(page.url()).searchParams.get('page') !== '2', 'Filtering resets pagination');
  assert(await page.locator('th[aria-sort="descending"]').count() === 1, 'Preserve sort');

  await open();
  await search.fill('Jamie');
  assert(!await add.isChecked(), 'Adding must be explicit');
  await apply(3);
  assert((await page.locator('tbody').innerText()).includes('Jamie Chen') &&
    !(await page.locator('tbody').innerText()).includes('Sam Rivera'), 'Default replaces earlier selection');

  await open();
  await search.fill('Alex');
  await add.check();
  await apply(6);
  await open();
  await search.fill('am');
  await add.check();
  await bulk.uncheck();
  assert(await menu.getByLabel('Alex Morgan', { exact: true }).isChecked(),
    'Scoped Select all must preserve the selection outside search results');
  await bulk.check();
  await menu.getByLabel('Jamie Chen', { exact: true }).uncheck();
  await apply(6);
  const rows = await page.locator('tbody').innerText();
  assert(rows.includes('Alex Morgan') && rows.includes('Sam Rivera') && !rows.includes('Jamie Chen'),
    'Adding preserves selections outside matches and respects unchecked matches');

  await open();
  await search.fill('Jamie');
  await search.fill('');
  assert(await menu.getByLabel('Alex Morgan', { exact: true }).isChecked() &&
    await menu.getByLabel('Sam Rivera', { exact: true }).isChecked() &&
    !await menu.getByLabel('Jamie Chen', { exact: true }).isChecked(), 'Clearing search restores pre-search draft');
  await search.fill('Jamie');
  await page.keyboard.press('Escape');
  await open();
  assert(await search.inputValue() === '', 'Cancel clears the search session');
  assert(!await menu.getByLabel('Jamie Chen', { exact: true }).isChecked(), 'Cancel preserves applied selection');
  await page.keyboard.press('Escape');

  await page.getByRole('link', { name: 'Website refresh', exact: true }).last().click();
  await page.waitForURL(origin + '/operations/projects/1');
  await page.goBack();
  await open();
  assert(await page.locator('[data-value-add-selection]').count() === 2, 'One generated add control per searchable column after Turbo restoration');
  assert(await search.inputValue() === '' && !await menu.getByLabel('Jamie Chen', { exact: true }).isChecked(),
    'Turbo restores confirmed selection');
  await page.keyboard.press('Escape');

  await page.goto(origin + '/operations/projects');
  await ready();
  await page.locator('[data-table-options="budget"]').click();
  await menu.locator('[data-filter-condition]').selectOption('greater-equal');
  await menu.locator('[data-filter-minimum]').fill('24000');
  await apply(4);
  assert(await page.evaluate(async () => {
    const { enhanceDataTable } = await import('fieldwork/data-table');
    return enhanceDataTable(document.querySelector('[data-data-table]')).query.filters.budget.value === 24000;
  }), 'Numeric query values are numbers');
  await page.locator('[data-table-options="due_on"]').click();
  await menu.locator('[data-filter-condition]').selectOption('between');
  await menu.locator('[data-filter-date]').fill('2026-11-01');
  await menu.locator('[data-filter-date-end]').fill('2026-10-01');
  await menu.getByRole('button', { name: 'Apply', exact: true }).click();
  assert(await menu.locator('[data-filter-date-end]').evaluate(input =>
    input.getAttribute('aria-invalid') === 'true' && document.activeElement === input), 'Date range validation and focus');
  await menu.locator('[data-filter-date-end]').fill('2026-11-30');
  await apply(4);
  assert(await page.evaluate(async () => {
    const { enhanceDataTable } = await import('fieldwork/data-table');
    const filter = enhanceDataTable(document.querySelector('[data-data-table]')).query.filters.due_on;
    return filter.value === '2026-11-01' && filter.upper === '2026-11-30';
  }), 'Date query values stay calendar strings');
  await page.locator('[data-table-options="budget"]').click();
  await menu.locator('[data-reset-filter]').click();
  await page.waitForFunction(() => !document.querySelector('dialog[open]'));
  await ready();
  assert(new URL(page.url()).searchParams.get('due_condition') === 'between', 'Clearing Budget retains Due date');
  await page.locator('[data-table-options="due_on"]').click();
  await menu.locator('[data-filter-condition]').selectOption('tomorrow');
  await apply(1);
  assert((await page.locator('tbody').innerText()).includes('Workspace consolidation'), 'Application resolves relative date');
  assert(await page.evaluate(async () => {
    const { enhanceDataTable } = await import('fieldwork/data-table');
    const filter = enhanceDataTable(document.querySelector('[data-data-table]')).query.filters.due_on;
    return filter.condition === 'tomorrow' && !Object.hasOwn(filter, 'value');
  }), 'Relative dates remain application-resolved conditions');
  await page.locator('[data-table-options="due_on"]').click();
  await menu.locator('[data-filter-condition]').selectOption('period');
  await menu.locator('[data-filter-period]').selectOption('quarter:4');
  await apply(9);
  assert((await page.locator('.table-filter-bar').innerText()).includes('Quarter 4'), 'Readable date-period chip');

  await open();await search.fill('Sam');await apply(3);
  assert(await page.getByRole('button', { name: 'Clear all filters', exact: true }).isVisible(), 'Multiple filters need a combined clearing action');
  await page.getByRole('button', { name: 'Clear all filters', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.table-toolbar')?.textContent.includes('9 of 9'));await ready();
  assert(await page.locator('.table-filter-bar').isHidden(), 'Clearing all filters left an empty filter summary');
  assert(await page.locator('[data-table-filter-summary]').isHidden(), 'Clearing filters must collapse the toolbar slot');
  assert(await page.evaluate(async () => {
    const { enhanceDataTable } = await import('fieldwork/data-table');
    const root = document.querySelector('[data-data-table]');
    const slot = root.querySelector('[data-table-filter-summary]');
    enhanceDataTable(root).destroy();
    return slot.hidden && slot.childElementCount === 0 && !root.querySelector('.table-filter-bar');
  }), 'Cleanup must restore the authored filter slot and remove generated controls');
  await page.reload();
  await ready();

  await page.goto(origin + '/operations/work');
  await ready();
  const stateChip = page.locator('.table-filter[data-column="status"]');
  assert(!await page.getByRole('button', { name: 'Clear all filters', exact: true }).isVisible(), 'One filter should use its own remove action');
  assert(await stateChip.getAttribute('aria-label') === 'Remove State: All except Done', 'Open-work scope must name the omitted state');
  const stateOptions = async () => page.locator('[data-table-options="status"]').click();
  const applyState = async text => {
    await menu.getByRole('button', { name: 'Apply', exact: true }).click();
    await page.waitForFunction(text => document.querySelector('.table-filter[data-column="status"]')?.textContent === text + ' ×', text);
    await ready();
  };
  await stateOptions();
  assert(await menu.getByRole('checkbox', { name: 'Done', exact: true }).isChecked() === false &&
    await menu.locator('[data-filter-value]:checked').count() === 5, 'Compact wording must retain the complete explicit selection');
  await menu.getByRole('checkbox', { name: 'Blocked', exact: true }).uncheck();
  await applyState('State: All except Blocked, Done');
  assert(new URL(page.url()).searchParams.getAll('status_values[]').length === 4, 'Exclusion wording changed the submitted inclusion query');
  await stateOptions();
  await menu.getByRole('checkbox', { name: 'Awaiting review', exact: true }).uncheck();
  await applyState('State: 3 values selected');
  await stateOptions();
  assert(await menu.locator('[data-filter-value]').count() === 6 &&
    await menu.locator('[data-filter-value]:checked').count() === 3, 'Count summaries must retain access to every criterion');
  await menu.getByRole('checkbox', { name: 'In progress', exact: true }).uncheck();
  await applyState('State: Open, Planned');
  await stateOptions();
  await menu.getByRole('checkbox', { name: 'Select all', exact: true }).check();
  await menu.getByRole('checkbox', { name: 'Select all', exact: true }).uncheck();
  await applyState('State: No values selected');
  assert((await page.locator('[data-work-count]').innerText()).trim()==='0 tasks', 'Empty selection did not remain an explicit empty query');
  await stateChip.focus();await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('.table-filter[data-column="status"]'));
  await ready();
  assert((await page.locator('[data-work-count]').innerText()).includes('of 15 tasks'), 'Removing the summary must clear only the state restriction');

  const native = await page.context().browser().newContext({ javaScriptEnabled: false });
  const nativePage = await native.newPage();
  try {
    const response = await nativePage.goto(origin + '/operations/projects?due_condition=between&due_date=2026-11-20&due_end=2026-11-01');
    assert(response.status() === 422 &&
      (await nativePage.locator('main').innerText()).includes('Filters could not be applied') &&
      await nativePage.locator('[name="due_date"]').inputValue() === '2026-11-20',
      'Native validation retains attempted dates and distinguishes unavailable results');
  } finally { await native.close(); }
  return { passed: true };
}
