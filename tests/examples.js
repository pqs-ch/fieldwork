async page => {
  const origin = __ORIGIN__, checks = [], errors = [];
  const assert = (value, message) => { if (!value) throw new Error(message); };
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  let stage = 'catalogue entry points and resets';
  try {
  await page.goto(origin);
  const rows = page.locator('.review-catalogue tbody tr');
  assert(await rows.count() === 11, 'Catalogue must expose all maintained examples');
  const entries = await rows.evaluateAll(rows => rows.map(row => ({
    slug: row.id,
    links: [...row.querySelectorAll('td:last-child a')].map(link => link.getAttribute('href'))
  })));
  for (const entry of entries) {
    const guide = await page.goto(origin + '/review/' + entry.slug);
    assert(guide.status() === 200, 'Guide unavailable: ' + entry.slug);
    assert(await page.getByRole('heading', { name: 'Try the workflow', exact: true }).count() === 1, 'Missing walkthrough');
    for (const path of entry.links) {
      if (path.endsWith('/sample')) {
        const csv = await page.request.get(origin + path);
        assert(csv.status() === 200 && (await csv.text()).includes('Vendor ID,Company'), 'Sample CSV unavailable');
        continue;
      }
      const response = await page.goto(origin + path);
      assert(response.status() === 200, 'Entry unavailable: ' + path);
      assert(await page.getByRole('navigation', { name: 'Example review', exact: true }).count() === 1, 'Missing return navigation');
    }
    await page.getByRole('link', { name: 'Review guide', exact: true }).click();
    await page.getByRole('link', { name: 'Reset example…', exact: true }).click();
    await page.getByRole('button', { name: 'Reset example', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'reset to its starting data.' }).waitFor();
  }
  checks.push('All 11 guides, entry links, samples, return links and confirmed resets work');

  // Full-document boundaries prevent one scenario’s global lifecycle policy leaking into another.
  stage = 'cross-example navigation';
  await page.goto(origin + '/draft-protection/workspace');
  await page.evaluate(() => { window.exampleDocumentMarker = 'draft'; });
  await page.getByRole('link', { name: 'All examples', exact: true }).click();
  await page.locator('#mixed-forms').getByRole('link', { name: 'Project brief', exact: true }).click();
  assert(await page.evaluate(() => window.exampleDocumentMarker === undefined), 'Scenario navigation reused the old document');
  await page.waitForFunction(() => document.querySelector('#project-brief')?.dataset.state === 'unchanged');
  stage = 'saving the mixed form';
  await page.getByLabel('Project name', { exact: true }).fill('Saved catalogue project');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#project-brief')?.dataset.state === 'saved');

  stage = 'operations reset isolation';
  await page.goto(origin + '/operations/projects/1/edit');
  await page.getByLabel('Project name', { exact: true }).fill('Changed catalogue project');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await page.getByRole('heading', { name: 'Changed catalogue project', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Reset example…', exact: true }).click();
  await page.getByRole('link', { name: 'Cancel', exact: true }).click();
  await page.goto(origin + '/operations/projects/1');
  assert(await page.getByRole('heading', { name: 'Changed catalogue project', exact: true }).count() === 1, 'Opening reset confirmation mutated data');
  await page.getByRole('link', { name: 'Reset example…', exact: true }).click();
  await page.getByRole('button', { name: 'Reset example', exact: true }).click();
  await page.goto(origin + '/operations/projects/1');
  assert(await page.getByRole('heading', { name: 'Website refresh', exact: true }).count() === 1, 'Project reset failed');
  await page.goto(origin + '/mixed-forms/mixed-form');
  assert(await page.getByLabel('Project name', { exact: true }).inputValue() === 'Saved catalogue project', 'Reset changed another example’s saved work');
  checks.push('Cross-example navigation starts a new document; reset is confirmed and preserves other examples');

  stage = 'browser reminder reset';
  await page.goto(origin + '/draft-protection/workbench');
  await page.locator('#reminder-text').fill('Catalogue reminder');
  await page.getByRole('button', { name: 'Save reminder in this browser' }).click();
  await page.getByText('Saved in this browser.', { exact: true }).waitFor();
  await page.evaluate(() => localStorage.setItem('review-check-other', 'keep'));
  await page.getByRole('link', { name: 'Reset example…', exact: true }).click();
  await page.getByRole('button', { name: 'Reset example', exact: true }).click();
  await page.getByText('The personal reminder stored in this browser was also cleared.', { exact: true }).waitFor();
  assert(await page.evaluate(() => localStorage.getItem('fieldwork-draft-example:reminder') === null && localStorage.getItem('review-check-other') === 'keep'), 'Reminder reset affected unrelated storage');
  await page.evaluate(() => localStorage.removeItem('review-check-other'));
  checks.push('Draft reset clears its retained reminder without clearing unrelated browser storage');

  stage = 'native catalogue and reset';
  const nativeContext = await page.context().browser().newContext({ javaScriptEnabled: false });
  try {
    const native = await nativeContext.newPage();
    await native.goto(origin);
    await native.locator('#mixed-forms').getByRole('link', { name: 'Project brief', exact: true }).click();
    await native.getByLabel('Project name', { exact: true }).fill('Native catalogue project');
    await native.getByRole('button', { name: 'Save project', exact: true }).click();
    assert(await native.getByLabel('Project name', { exact: true }).inputValue() === 'Native catalogue project', 'Native save failed');
    await native.getByRole('link', { name: 'Reset example…', exact: true }).click();
    await native.getByRole('button', { name: 'Reset example', exact: true }).click();
    await native.getByRole('link', { name: 'Open example', exact: true }).click();
    assert(await native.getByLabel('Project name', { exact: true }).inputValue() === 'Website refresh', 'Native reset failed');
    await native.getByRole('link', { name: 'All examples', exact: true }).click();
    assert(await native.getByRole('heading', { name: 'Explore the examples', exact: true }).count() === 1, 'Native return failed');
  } finally { await nativeContext.close(); }
  checks.push('Catalogue, saved changes, reset and return work with JavaScript disabled');
  assert((await page.request.get(origin + '/review/unknown')).status() === 404, 'Unknown guide should be unavailable');
  assert((await page.request.post(origin + '/review/operations/reset')).status() === 422, 'Reset accepted an unprotected request');
  assert(errors.length === 0, 'Browser errors: ' + errors.join('; '));
  return { passed: true, checks };
  } catch (error) {
    throw new Error(JSON.stringify({ stage, checks, url: page.url(), errors, error: error.message }));
  }
}
