async page => {
  const origin = __ORIGIN__;
  await page.context().clearCookies();
  page.setDefaultTimeout(10000);
  const checks = [];
  const assert = (ok, label) => { if (!ok) throw new Error(label); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const form = page.locator('#project-brief');
  const rows = page.locator('[data-repeat-list] [data-repeat-item]');
  const save = page.getByRole('button', { name: 'Save project', exact: true });
  const discard = page.getByRole('button', { name: 'Discard changes', exact: true });
  const ready = () => page.waitForFunction(() => document.querySelector('#project-brief')?.dataset.state === 'unchanged');
  const title = () => page.getByLabel('Project name', { exact: true });
  const arm = async kind => page.evaluate(async kind => {
    const token = document.querySelector('meta[name="csrf-token"]').content;
    const response = await fetch('/mixed-forms/mixed-form/fail-next', { method: 'POST', headers: { 'X-CSRF-Token': token, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ kind }) });
    if (!response.ok) throw new Error('Could not arm failure');
  }, kind);
  await page.goto(origin + '/mixed-forms/mixed-form');
  await ready();
  const startingRows = await rows.count();
  assert(await page.evaluate(() => document.activeElement === document.body), 'Ordinary editor entry leaves focus with the browser');
  assert(await save.isDisabled(), 'Saved mixed form starts pristine');
  await page.getByRole('button', { name: 'Add deliverable', exact: true }).click();
  assert(await rows.last().getByLabel('Title', { exact: true }).evaluate(el => el === document.activeElement), 'Adding a row focuses its first field');
  await page.getByLabel('Require a due date for every deliverable', { exact: true }).check();
  await rows.last().getByLabel('Title', { exact: true }).fill('Draft deliverable');
  await save.click();
  assert((await page.locator('[data-form-error-list]').innerText()).includes('Due date'), 'Conditional requirements apply to newly added rows');
  await page.getByLabel('Require a due date for every deliverable', { exact: true }).uncheck();
  await rows.last().locator('[id$="-due-error"]').waitFor({ state: 'hidden' });
  assert(await rows.last().locator('[id$="-due-error"]').isHidden(), 'Changing the conditional requirement clears its obsolete native error');
  await rows.last().getByLabel('Title', { exact: true }).fill(' ');
  await title().press('Enter');
  await page.waitForFunction(() => document.querySelector('#project-brief').dataset.state === 'failed');
  assert(await rows.count() === startingRows + 1, 'Server failure retains dynamic rows');
  assert((await page.locator('[data-form-status]').innerText()).includes(`Deliverable ${startingRows + 1} — Title: Enter a deliverable title.`), 'In-place server rejection identifies the row and correction');
  await rows.last().getByLabel('Title', { exact: true }).fill('Browser verification');
  // A newly-added invalid field participates in the shared error summary and focus.
  await rows.last().getByLabel('Title', { exact: true }).fill('');
  await save.click();
  assert(await page.locator('[data-form-error-summary]').evaluate(el => !el.hidden && el === document.activeElement), 'Dynamic field validation focuses the form summary');
  assert((await page.locator('[data-form-error-list]').innerText()).includes(`Deliverable ${startingRows + 1}`), 'Dynamic errors identify their row');
  await rows.last().getByLabel('Title', { exact: true }).fill('Browser verification');
  await page.locator('#brief-files').setInputFiles({ name: 'brief.txt', mimeType: 'text/plain', buffer: Buffer.from('Retained file content') });
  await page.locator('[data-file-description]').fill('Retained description');
  await title().fill('Project with supporting files');
  await arm('unavailable');
  await save.click();
  await page.waitForFunction(() => document.querySelector('#project-brief').dataset.state === 'failed');
  assert(await page.locator('#brief-files').evaluate(el => el.files[0]?.name === 'brief.txt'), 'Failure retains native file objects');
  assert(await page.locator('[data-file-description]').inputValue() === 'Retained description', 'Failure retains file descriptions');
  assert(await rows.last().getByLabel('Title', { exact: true }).inputValue() === 'Browser verification', 'Failure retains row fields');
  assert(await save.isEnabled(), 'Failure permits retry');
  checks.push('mixed forms: dynamic validation, contextual summary focus, failed-request draft and File retention');

  await page.getByLabel('Require a due date for every deliverable', { exact: true }).check();
  await discard.click();
  assert(await page.getByRole('dialog').count() === 1, 'Mixed Discard opens exactly one decision');
  await page.getByRole('button', { name: 'Keep editing', exact: true }).click();
  assert(await page.locator('#brief-files').evaluate(el => el.files.length === 1), 'Canceled Discard preserves files');
  assert(await discard.evaluate(el => el === document.activeElement), 'Canceled Discard restores focus');
  await discard.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Discard changes', exact: true }).click();
  await ready();
  assert(await rows.count() === startingRows && await page.locator('#brief-files').evaluate(el => el.files.length === 0), 'Discard restores row structure and clears draft files');
  assert(await title().inputValue() === 'Website refresh', 'Discard restores fixed fields');
  assert(!await page.getByLabel('Require a due date for every deliverable', { exact: true }).isChecked() && await rows.first().locator('input[type=date]').evaluate(el => !el.required), 'Discard restores application-owned conditional requirements after row restoration');
  // Removing a saved row and restoring it must not reuse its field key on the next Add.
  await page.getByRole('button', { name: 'Remove deliverable 1', exact: true }).click();
  assert(await page.getByRole('dialog').getByRole('heading', { name: 'Remove Deliverable 1?', exact: true }).count() === 1, 'Draft removal uses Remove wording');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  assert(await rows.count() === startingRows && await page.getByRole('button', { name: 'Remove deliverable 1', exact: true }).evaluate(el => el === document.activeElement), 'Canceled row removal preserves rows and returns focus');
  for (let count = startingRows; count > 0; count--) {
    await page.getByRole('button', { name: 'Remove deliverable 1', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Remove', exact: true }).click();
    await page.waitForFunction(expected => document.querySelectorAll('[data-repeat-list] [data-repeat-item]').length === expected, count - 1);
  }
  await page.waitForFunction(() => document.querySelectorAll('[data-repeat-list] [data-repeat-item]').length === 0);
  assert(await rows.count() === 0, 'Confirmed row removal updates the form');
  await discard.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Discard changes', exact: true }).click();
  await ready();
  await page.getByRole('button', { name: 'Add deliverable', exact: true }).click();
  const keys = await rows.evaluateAll(items => items.map(item => item.dataset.repeatKey));
  assert(new Set(keys).size === keys.length, 'Restored row keys stay unique');
  await rows.last().getByLabel('Title', { exact: true }).fill('Saved deliverable');
  await page.locator('#brief-files').setInputFiles({ name: 'saved.txt', mimeType: 'text/plain', buffer: Buffer.from('saved exactly once') });
  await page.locator('[data-file-description]').fill('Submitted description');
  const payload = await form.evaluate(el => [...new FormData(el).entries()].map(([name, value]) => [name, value instanceof File ? value.name : value]));
  assert(payload.some(([name, value]) => name === 'files[]' && value === 'saved.txt') && payload.some(([name, value]) => name === 'descriptions[]' && value === 'Submitted description'), 'Displayed files and descriptions share native multipart transport');
  await save.click();
  await page.waitForFunction(() => document.querySelector('#project-brief').dataset.state === 'saved');
  assert(await page.locator('#brief-files').evaluate(el => el.files.length === 0), 'Acknowledged save clears submitted file choices');
  assert((await page.locator('#saved-attachments').innerText()).includes('saved.txt'), 'Application renders acknowledged attachment metadata');
  assert((await page.locator('#saved-attachments').innerText()).includes('Submitted description'), 'Application receives paired file descriptions');
  assert(await save.isDisabled(), 'Acknowledged save advances the complete baseline');
  assert(await page.locator('[data-form-status]').evaluate(el => el === document.activeElement), 'Acknowledged save focuses its nearby feedback when Save becomes disabled');
  await title().fill('Another edit');
  await save.click();
  await page.waitForFunction(() => document.querySelector('#project-brief').dataset.state === 'saved');
  assert((await page.locator('#saved-attachments').innerText()).split('saved.txt').length === 2, 'Later saves do not resend acknowledged files');
  checks.push('mixed forms: one cancellable Discard, restored row identities, aligned multipart fields and acknowledged-file clearing');

  await page.getByRole('button', { name: /Reviewers 1 selected/ }).click();
  const search = page.getByRole('combobox');
  await search.fill('Alex');
  await page.getByRole('option', { name: /Alex Morgan/ }).click();
  assert(await search.evaluate(el => el === document.activeElement), 'Multi-selection keeps search focus');
  assert(await page.getByRole('listbox', { name: 'Reviewers options' }).getAttribute('aria-multiselectable') === 'true', 'Results expose multi-selection semantics');
  assert(await page.getByRole('option', { name: /Alex Morgan/ }).getAttribute('aria-selected') === 'true', 'Chosen result announces selected state');
  await search.fill('Sam');
  await page.getByRole('option', { name: /Sam Rivera/ }).click();
  assert(await page.locator('#project-reviewers').evaluate(el => el.selectedOptions.length === 3), 'Different searches preserve earlier selections');
  await page.route('**/mixed-form/people?q=Alex', route => route.fulfill({ status: 503, json: {} }), { times: 1 });
  await search.fill('Alex');
  await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
  assert(await page.locator('#project-reviewers').evaluate(el => el.selectedOptions.length === 3), 'Failed lookup preserves all selections');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await page.getByRole('option', { name: /Alex Morgan/ }).waitFor();
  assert(await page.locator('#project-reviewers').evaluate(el => el.selectedOptions.length === 3), 'Retry recovers without changing committed selections');
  await search.fill('Lee');
  await page.getByRole('option', { name: /Lee Patel/ }).waitFor();
  await search.press('ArrowDown');
  await search.press('Enter');
  assert(await page.locator('#project-reviewers').evaluate(el => el.selectedOptions.length === 4), 'Keyboard selection commits the recovered search result');
  await search.press('Enter');
  assert(await page.locator('#project-reviewers').evaluate(el => el.selectedOptions.length === 3), 'Keyboard toggling removes the result while preserving other reviewers');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Remove Sam Rivera from Reviewers', exact: true }).click();
  assert(await page.locator('#project-reviewers').evaluate(el => [...el.selectedOptions].map(o => o.value).join() === 'alex,jamie'), 'Individual removal updates native selections');
  const selectedPayload = await form.evaluate(el => new FormData(el).getAll('project[reviewer_ids][]').filter(Boolean));
  assert(selectedPayload.join() === 'alex,jamie', 'Multiple selected IDs submit as repeated native values');
  await discard.click(); // Only fixed values changed; no child confirmation.
  await ready();
  assert(await page.locator('#project-reviewers').evaluate(el => [...el.selectedOptions].map(o => o.value).join() === 'jamie'), 'Discard restores the multi-value baseline');
  assert(await page.locator('.searchable-selection-values').innerText() === 'Jamie Chen', 'Discard synchronizes visible selections');
  // Adding an unselected remote option must not make a pristine multiple field dirty.
  await page.evaluate(() => {
    const select = document.querySelector('#project-reviewers');
    select.add(new Option('Remote person', 'remote'));
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  assert(await save.isDisabled(), 'Unselected lookup options do not change dirty state');
  await page.getByRole('button', { name: 'Clear Reviewers', exact: true }).click();
  await title().fill('Required reviewers');
  await save.click();
  assert(await page.locator('[data-form-error-summary]').isVisible(), 'Required multi-select participates in form validation');
  await discard.click();
  await ready();
  // Single selection keeps its existing commit-and-close interaction.
  await page.getByRole('button', { name: 'Owner Alex Morgan', exact: true }).click();
  await page.getByRole('combobox').fill('Lee');
  await page.getByRole('option', { name: /Lee Patel/ }).click();
  assert(await page.locator('#project-owner').inputValue() === 'lee' && await page.getByRole('dialog', { name: 'Choose Owner' }).count() === 0, 'Single selection still commits and closes');
  checks.push('multiple selection: remote search retention, failed lookup, individual removal, native values, required validation and saved baselines');

  // Disabled native options stay selected and cannot be toggled or removed.
  await page.evaluate(() => {
    const select = document.querySelector('#project-reviewers');
    select.querySelector('[value="jamie"]').disabled = true;
  });
  await page.waitForFunction(() => document.querySelector('[data-selection-remove="jamie"]')?.disabled);
  assert(await page.getByRole('button', { name: 'Remove Jamie Chen from Reviewers', exact: true }).isDisabled(), 'Disabled selected options cannot be removed');
  await page.evaluate(() => { document.querySelector('#project-reviewers [value="jamie"]').disabled = false; });
  await page.waitForFunction(() => !document.querySelector('[data-selection-remove="jamie"]').disabled);
  await page.evaluate(() => { document.querySelector('#project-reviewers').disabled = true; });
  await page.waitForFunction(() => document.querySelector('[aria-labelledby*="project-reviewers"]')?.disabled || document.querySelector('#project-reviewers + .searchable-selection button').disabled);
  assert(await page.getByRole('button', { name: /Reviewers 1 selected/ }).isDisabled(), 'Native disabled state locks the enhanced picker without observer feedback');
  await page.evaluate(() => { document.querySelector('#project-reviewers').disabled = false; });
  await page.waitForFunction(() => !document.querySelector('#project-reviewers + .searchable-selection button').disabled);

  // Force out-of-order lookups: stale responses cannot replace the latest results.
  await page.route('**/mixed-form/people?q=slow', async route => { await new Promise(resolve => setTimeout(resolve, 350)); await route.fulfill({ json: { items: [{ value: 'slow', label: 'Obsolete result' }] } }).catch(() => {}); });
  await page.getByRole('button', { name: /Reviewers 1 selected/ }).click();
  await search.fill('slow');
  await page.waitForTimeout(230);
  await search.fill('Alex');
  await page.getByRole('option', { name: /Alex Morgan/ }).waitFor();
  await page.waitForTimeout(400);
  assert(await page.getByRole('option', { name: 'Obsolete result', exact: true }).count() === 0, 'Late lookup cannot replace current results');
  await page.keyboard.press('Escape');
  await page.unroute('**/mixed-form/people?q=slow');
  await page.getByRole('link', { name: 'Workspace', exact: true }).click();
  await page.waitForURL('**/mixed-form/other');
  assert(await page.locator('main').count() === 1, 'The return destination has one main landmark');
  assert(await page.getByRole('heading', { name: 'Workspace', exact: true }).evaluate(el => el !== document.activeElement), 'Turbo navigation must not autofocus the destination title');
  await page.goBack();
  await page.waitForURL('**/mixed-form');
  await ready();
  assert(await page.locator('#project-owner').inputValue() === 'alex', 'Turbo return renders authoritative saved values');
  assert(await page.locator('.searchable-selection-trigger').count() === 2, 'Turbo restoration mounts one picker per field');
  assert(await page.getByRole('heading', { name: 'Project brief', exact: true }).evaluate(el => el !== document.activeElement), 'History return must not autofocus the title');
  await page.getByRole('link', { name: 'Workspace', exact: true }).click();
  await page.getByRole('link', { name: 'Return to project brief', exact: true }).click();
  await ready();
  assert(await page.getByRole('heading', { name: 'Project brief', exact: true }).evaluate(el => el !== document.activeElement), 'The return link must not autofocus the editor title');
  checks.push('selection lifecycle: stale lookup rejection, single-select compatibility and Turbo remount');

  // Server replacement retains ordinary/repeated values and explicitly requests file reselection.
  await page.goto(origin + '/mixed-forms/mixed-form?transport=native');
  await ready();
  await title().fill(' ');
  await page.locator('#brief-files').setInputFiles({ name: 'reselect.txt', mimeType: 'text/plain', buffer: Buffer.from('not staged') });
  await page.locator('[data-file-description]').fill('Retain file notes for reselection');
  await save.click();
  await page.waitForFunction(() => document.querySelector('#project-brief')?.dataset.editingResult === 'invalid');
  assert(await page.locator('[data-form-error-summary]').evaluate(el => el === document.activeElement), 'Navigation focus leaves server validation focus with the error summary');
  assert((await page.locator('body').innerText()).includes('Choose your files again'), 'Server replacement explains file reselection');
  assert((await page.locator('body').innerText()).includes('Retain file notes for reselection'), '422 retains textual file notes without pretending to retain file contents');
  assert(await title().inputValue() === ' ', '422 retains attempted ordinary fields');
  assert(await rows.count() === startingRows + 1, '422 retains attempted repeated rows');
  // Another server response must not erase the only record of lost file choices.
  await form.evaluate(form => {
    // Exercise the server Add action with notes produced by the enhanced queue.
    const field = document.createElement('input'); field.type = 'hidden'; field.name = 'intent'; field.value = 'add';
    form.append(field); form.submit();
  });
  await page.waitForFunction(expected => document.querySelectorAll('[data-repeat-list] [data-repeat-item]').length === expected, startingRows + 2);
  assert((await page.locator('[data-file-reselection]').innerText()).includes('Retain file notes for reselection'), 'Native Add retains prior file notes and reselection guidance');
  assert(await page.locator('#brief-files').evaluate(el => el.files.length === 0), 'Retained file notes do not reconstruct file contents');
  await discard.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Discard changes', exact: true }).click();
  await ready();
  assert(await title().inputValue() === 'Another edit', '422 Discard restores the original saved baseline');
  assert(await page.locator('[data-file-reselection]').count() === 0, 'Discard removes obsolete file-reselection notes');

  const nativeContext = await page.context().browser().newContext({ javaScriptEnabled: false });
  const nativePage = await nativeContext.newPage();
  try {
    await nativePage.goto(origin + '/mixed-forms/mixed-form');
    await nativePage.getByLabel('Project name', { exact: true }).press('Enter');
    await nativePage.getByText('Project saved.', { exact: true }).waitFor();
    assert(await nativePage.locator('[data-repeat-list] [data-repeat-item]').count() === startingRows, 'Pristine native Enter unexpectedly changed the row list');
    await nativePage.getByLabel('Project name', { exact: true }).fill(' ');
    await nativePage.locator('#brief-files').setInputFiles({ name: 'lost-native.txt', mimeType: 'text/plain', buffer: Buffer.from('Not staged') });
    await nativePage.getByLabel('Project name', { exact: true }).press('Enter');
    await nativePage.locator('[data-file-reselection]').waitFor();
    await nativePage.locator('button[name=intent][value=add]').click();
    await nativePage.locator('[data-repeat-list] [data-repeat-item]').nth(startingRows).waitFor();
    assert((await nativePage.locator('[data-file-reselection]').innerText()).includes('lost-native.txt'), 'JavaScript-disabled row addition retains the upload reminder');
    await nativePage.locator('[data-repeat-list] [data-repeat-item]').last().getByLabel('Title', { exact: true }).fill('Native follow-up');
    await nativePage.getByRole('button', { name: 'Save project', exact: true }).click();
    assert((await nativePage.locator('[data-file-reselection]').innerText()).includes('lost-native.txt'), 'Repeated native validation retains prior file choices');
    await nativePage.getByLabel('Project name', { exact: true }).fill('Native project');
    await nativePage.locator('#project-reviewers').selectOption(['sam', 'lee']);
    await nativePage.getByLabel('Require a due date for every deliverable', { exact: true }).check();
    const nativeRows = () => nativePage.locator('[data-repeat-list] [data-repeat-item]');
    const rowKeys = () => nativeRows().evaluateAll(items => items.map(item => item.dataset.repeatKey));
    await nativeRows().nth(1).getByLabel('Title', { exact: true }).fill('Navigation for field teams');
    await nativePage.locator('#brief-files').setInputFiles({ name: 'removal-notes.txt', mimeType: 'text/plain', buffer: Buffer.from('Still a draft') });
    const token = await nativePage.locator('meta[name=csrf-token]').getAttribute('content');
    assert((await nativePage.request.post(origin + '/mixed-forms/mixed-form/fail-next', { headers: { 'X-CSRF-Token': token } })).ok(), 'Native save failure is armed');
    await nativePage.getByRole('button', { name: 'Remove deliverable 2', exact: true }).click();
    await nativePage.getByRole('heading', { name: 'Remove deliverable?', exact: true }).waitFor();
    assert(await nativePage.getByRole('heading', { name: 'Navigation for field teams', exact: true }).count() === 1, 'Native confirmation names the draft row');
    assert(await nativePage.getByRole('button', { name: 'Keep editing', exact: true }).evaluate(el => el === document.activeElement), 'Native removal initially focuses the safe action');
    assert(await nativePage.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
      return new Set(ids).size === ids.length;
    }), 'Repeated draft values and file notes do not create duplicate HTML IDs');
    const savedPage = await nativeContext.newPage();
    const checkSavedRows = async expected => {
      await savedPage.goto(origin + '/mixed-forms/mixed-form');
      assert(await savedPage.locator('[data-repeat-list] [data-repeat-item]').count() === expected, 'Draft row actions leave the saved structure intact');
      assert(await savedPage.getByLabel('Project name', { exact: true }).inputValue() === 'Website refresh', 'Draft row actions do not save unrelated edits');
      assert(!(await savedPage.locator('#saved-attachments').innerText()).includes('removal-notes.txt'), 'Row confirmation does not accept an upload');
    };
    await checkSavedRows(startingRows);
    await nativePage.getByRole('button', { name: 'Keep editing', exact: true }).click();
    assert(await nativeRows().count() === startingRows + 1 && (await rowKeys()).join() === '0,1,2,3', 'Native cancellation retains every row and its identity');
    assert(await nativePage.getByRole('button', { name: 'Remove deliverable 2', exact: true }).evaluate(el => el === document.activeElement), 'Native cancellation returns focus to its Remove action');
    assert(await nativePage.getByLabel('Project name', { exact: true }).inputValue() === 'Native project' && await nativePage.locator('#project-reviewers').evaluate(el => [...el.selectedOptions].map(o => o.value).join() === 'sam,lee'), 'Native cancellation retains fixed and multiple values');
    assert(await nativePage.getByLabel('Require a due date for every deliverable', { exact: true }).isChecked() && await nativeRows().last().locator('input[type=date]').evaluate(el => el.required && !el.value), 'Row actions retain conditional requirements without validating an incomplete draft');
    assert((await nativePage.locator('[data-file-reselection]').innerText()).includes('removal-notes.txt') && await nativePage.locator('#brief-files').evaluate(el => !el.files.length), 'Native cancellation retains file notes while honestly requiring reselection');
    await nativePage.getByRole('button', { name: 'Remove deliverable 2', exact: true }).click();
    await nativePage.getByRole('button', { name: 'Remove deliverable', exact: true }).click();
    assert((await rowKeys()).join() === '0,2,3', 'Native confirmation removes only the requested draft row without renumbering keys');
    assert(await nativeRows().nth(1).getByLabel('Title', { exact: true }).evaluate(el => el === document.activeElement), 'Native removal focuses the next row');
    await checkSavedRows(startingRows);
    await savedPage.close();
    await nativeRows().last().locator('input[type=date]').fill('2026-11-26');
    await nativePage.getByRole('button', { name: 'Save project', exact: true }).click();
    assert((await nativePage.locator('[data-form-status]').innerText()).includes('Could not save the project. Try again.'), 'Row actions do not consume the next-save failure');
    assert((await rowKeys()).join() === '0,2,3', 'Failed native saving retains the confirmed draft structure');
    await nativePage.locator('#brief-files').setInputFiles({ name: 'native.txt', mimeType: 'text/plain', buffer: Buffer.from('native upload') });
    await nativeRows().last().getByLabel('Title', { exact: true }).press('Enter');
    await nativePage.waitForURL('**/mixed-form');
    assert(await nativePage.getByLabel('Project name', { exact: true }).inputValue() === 'Native project', 'Native multipart submission saves fields');
    assert((await nativePage.locator('#saved-attachments').innerText()).includes('native.txt'), 'Native multipart submission includes files');
    assert(!(await nativePage.locator('#saved-attachments').innerText()).includes('lost-native.txt'), 'File-note metadata is never treated as an upload');
    assert(await nativePage.locator('#project-reviewers').evaluate(el => el.selectedOptions.length === 2), 'Native submission preserves multiple selected IDs');
    // Removing the last draft row gives a usable empty editor, saved only explicitly.
    while (await nativeRows().count()) {
      await nativeRows().first().getByRole('button', { name: /Remove deliverable/ }).click();
      await nativePage.getByRole('button', { name: 'Remove deliverable', exact: true }).click();
    }
    assert(await nativePage.getByRole('button', { name: 'Add deliverable', exact: true }).isEnabled() && await nativePage.getByRole('button', { name: 'Add deliverable', exact: true }).evaluate(el => el === document.activeElement), 'Removing the final native row focuses Add and leaves it available');
    await nativePage.getByRole('button', { name: 'Save project', exact: true }).click();
    await nativePage.reload();
    assert(await nativeRows().count() === 0, 'An explicitly saved empty row list stays empty on return');
    await page.context().addCookies(await nativeContext.cookies());
    await page.goto(origin + '/mixed-forms/mixed-form');
    await ready();
    assert(await save.isDisabled(), 'Native multi-value baseline remains pristine regardless of ID order');
  } finally { await nativeContext.close(); }
  checks.push('server/native boundaries: Enter saves and validates without row actions; cancelable removal, stable keys, file reselection, retry and empty rows');
  const limited = await page.context().browser().newContext();
  await limited.addInitScript(() => {
    window.DataTransfer = class { constructor() { throw new Error('Unavailable'); } };
    delete HTMLElement.prototype.showPopover;
  });
  const limitedPage = await limited.newPage();
  try {
    await limitedPage.goto(origin + '/mixed-forms/mixed-form');
    assert(await limitedPage.locator('.searchable-selection-trigger').count() === 0, 'Unsupported Popover API retains native selects');
    await limitedPage.getByLabel('Project name', { exact: true }).fill('Limited browser');
    await limitedPage.locator('#brief-files').setInputFiles({ name: 'limited.txt', mimeType: 'text/plain', buffer: Buffer.from('native fallback') });
    await limitedPage.getByRole('button', { name: 'Save project', exact: true }).click();
    await limitedPage.waitForFunction(() => document.querySelector('#project-brief').dataset.state === 'saved');
    assert((await limitedPage.locator('#saved-attachments').innerText()).includes('limited.txt'), 'Mixed forms submit native files without DataTransfer assignment');
    const limitedErrors = []; limitedPage.on('pageerror', error => limitedErrors.push(error.message));
    await limitedPage.locator('#brief-files').setInputFiles({ name: 'leaving.txt', mimeType: 'text/plain', buffer: Buffer.from('leaving native choice') });
    await limitedPage.getByRole('link', { name: 'Workspace', exact: true }).click();
    await limitedPage.waitForURL('**/mixed-form/other');
    assert(!limitedErrors.length, 'Unsupported FileList assignment still permits clean navigation with draft files');
  } finally { await limited.close(); }
  await page.goto(origin + '/mixed-forms/mixed-form?mode=create');
  await page.waitForFunction(() => document.querySelector('#project-brief')?.dataset.state === 'ready');
  const create = page.getByRole('button', { name: 'Create project', exact: true });
  assert(await create.isEnabled(), 'Mixed creation permits unchanged defaults');
  await page.locator('#brief-files').setInputFiles({ name: 'created.txt', mimeType: 'text/plain', buffer: Buffer.from('creation upload') });
  await create.click();
  await page.waitForFunction(() => document.querySelector('#project-brief').dataset.state === 'created');
  assert(await create.isDisabled() && await page.getByRole('button', { name: 'Add deliverable', exact: true }).isDisabled(), 'Confirmed creation locks the whole composed form');
  assert(await page.locator('#brief-files').evaluate(el => el.files.length === 0), 'Creation acknowledges and clears queued files');
  const requests = [];
  const countRequests = request => { if (request.method() === 'POST' && request.url().endsWith('/mixed-forms/mixed-form')) requests.push(request); };
  page.on('request', countRequests);
  await form.evaluate(el => el.requestSubmit());
  await page.waitForTimeout(100);
  page.off('request', countRequests);
  assert(!requests.length, 'Completed creation prevents programmatic duplicate submission');
  checks.push('composition boundaries: disabled choices, unsupported browser APIs, unchanged creation defaults and duplicate prevention');
  assert(!errors.length, errors.join('; '));
  return { passed: true, checks };
}
