async page => {
  const origin = __ORIGIN__;
  page.setDefaultTimeout(10000);
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const compare = '/versioned-documents/documents/example/compare?earlier=r2&later=r4';
  await page.goto(origin + compare);
  const pair = page.locator('[data-document-comparison]');
  assert(await pair.getAttribute('data-earlier-revision') === 'r2', 'Earlier pair changed');
  const first = page.locator('[data-comparison-change]').first();
  await page.getByRole('link', { name: 'First change', exact: true }).click();
  assert(await first.evaluate(el => el === document.activeElement), 'Change navigation does not focus heading');
  await page.getByRole('link', { name: 'Next change', exact: true }).first().click();
  assert(await page.locator('[data-comparison-change]').nth(1).evaluate(el => el === document.activeElement), 'Next change lost focus');
  assert(await page.locator('[data-comparison-context]').count() > 0, 'Comparison has no unchanged context');
  for (const context of await page.locator('[data-comparison-context]').all())
    assert(await context.isVisible(), 'Supplied context must be visible without expansion');
  assert(await page.locator('ins').count() > 0 && await page.locator('del').count() > 0, 'Word changes absent');
  assert((await page.locator('[data-change="added"] .comparison-marker').first().innerText()).includes('+'), 'Addition lacks marker');
  assert((await page.locator('[data-change="removed"] .comparison-marker').first().textContent()).includes('Removed'), 'Deletion lacks readable label');

  // Distinct behavior: idempotence, destroy, visible context, and cleanup.
  await page.evaluate(async () => {
    const { enhanceDocumentComparison } = await import('fieldwork/document-comparison');
    const root = document.querySelector('[data-document-comparison]');
    const a = enhanceDocumentComparison(root), b = enhanceDocumentComparison(root);
    if (a !== b) throw new Error('Comparison initialization duplicated controllers');
    a.destroy(); a.destroy();
    enhanceDocumentComparison(root);
  });
  // A real Turbo visit and Back restore are more valuable than simulating only lifecycle events.
  await page.getByRole('link', { name: 'History', exact: true }).click();
  await page.getByRole('heading', { name: 'Document history', exact: true }).waitFor();
  assert(await page.getByRole('heading', { name: 'Additional comparison states', exact: true }).count() === 0, 'Technical review states compete with recorded document history');
  await page.goBack();
  await page.getByRole('heading', { name: 'Compare saved revisions', exact: true }).waitFor();
  await page.getByRole('link', { name: 'First change', exact: true }).click();
  assert(await page.locator('[data-comparison-change]').first().evaluate(el => el === document.activeElement), 'Comparison failed after cache restoration');

  for (const [query, text, entry] of [
    ['earlier=r3&later=r4', 'No source changes', 'Identical revisions'],
    ['later=r1', 'no earlier revision', 'First revision'],
    ['earlier=r2&later=r4&unavailable=1', 'does not mean there are no changes', 'Unavailable comparison'],
    ['earlier=missing&later=r4', 'does not mean there are no changes'],
  ]) {
    if (entry) {
      await page.goto(origin + '/review/versioned-documents');
      await page.getByRole('navigation', { name: 'Comparison states', exact: true }).getByRole('link', { name: entry, exact: true }).click();
    } else {
      await page.goto(origin + '/versioned-documents/documents/example/compare?' + query);
    }
    assert((await page.locator('main').innerText()).includes(text), 'Comparison state mislabeled: ' + query);
    assert(await page.locator('[data-comparison-change]').count() === 0, 'Empty state retained change navigation');
  }
  await page.goto(origin + '/versioned-documents/documents/example');
  await page.getByRole('link', { name: 'Open saved draft', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Changes since publication', exact: true }).click();
  assert(await page.locator('[data-document-comparison]').getAttribute('data-later-revision') === 'r4', 'Changes since publication not pinned');
  await page.goto(origin + '/versioned-documents/documents/example/read?revision=r1');
  assert((await page.locator('main').innerText()).includes('Historical publication 1.0'), 'Historical publication not labeled');
  assert(await page.locator('main textarea').count() === 0, 'Historical reader is editable');

  await page.goto(origin + '/versioned-documents/documents/example/edit');
  const initial = await page.getByLabel('Markdown source', { exact: true }).inputValue();
  await page.getByRole('button', { name: 'Preview submitted text', exact: true }).click();
  await page.getByRole('heading', { name: 'Rendered preview · Saved text', exact: true }).waitFor();
  await page.getByLabel('Markdown source', { exact: true }).fill(initial.replace('three days', 'two days'));
  await page.getByRole('button', { name: 'Preview submitted text', exact: true }).click();
  await page.getByRole('heading', { name: /Unsaved text/ }).waitFor();
  assert((await page.locator('.rich-content').innerText()).includes('Respond within two days.'), 'Unsaved fixture preview did not render submitted source');
  const attempted = initial + '\nAn unsaved paragraph <img src=x onerror="window.sourceExecuted=true">\n';
  await page.getByLabel('Markdown source', { exact: true }).fill(attempted);
  assert((await page.locator('#preview-title').textContent()).includes('out of date'), 'Preview freshness mislabeled');
  await page.getByRole('button', { name: 'Preview submitted text', exact: true }).click();
  await page.getByRole('heading', { name: /Unsaved text/ }).waitFor();
  assert(await page.getByLabel('Markdown source', { exact: true }).inputValue() === attempted, 'Preview lost attempted Markdown');
  assert(await page.locator('.rich-content img').count() === 0, 'Preview rendered untrusted source as HTML');
  assert(await page.getByRole('button', { name: 'Save draft', exact: true }).isEnabled(), 'Preview advanced saved baseline');
  // Server validation retains source, summary and original baseline.
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await page.getByText('Enter a change summary.', { exact: true }).waitFor();
  assert(await page.getByLabel('Markdown source', { exact: true }).inputValue() === attempted, '422 lost Markdown');
  await page.getByLabel('Change summary', { exact: true }).fill('Clarify synthetic guidance');
  await page.getByRole('button', { name: 'Simulate stale save', exact: true }).click();
  await page.getByRole('heading', { name: /Newer saved revision/ }).waitFor();
  assert(await page.getByLabel('Markdown source', { exact: true }).inputValue() === attempted, '409 lost Markdown');
  assert(await page.getByLabel('Change summary', { exact: true }).inputValue() === 'Clarify synthetic guidance', '409 lost summary');
  // Old pair remains stable despite the competing saved revision.
  const response = await page.request.get(origin + compare);
  assert((await response.text()).includes('data-later-revision="r4"'), 'New edits changed existing comparison');
  await page.getByRole('link', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Keep editing', exact: true }).click();
  assert(await page.getByLabel('Markdown source', { exact: true }).inputValue() === attempted, 'Exit confirmation lost text');
  await page.getByRole('button', { name: /Save submitted text as a new revision/ }).click();
  await page.getByText('Draft saved. Published version 1.1 is unchanged.', { exact: true }).waitFor();
  const savedUrl = page.url();
  const savedRead = await page.request.get(savedUrl);
  assert((await savedRead.text()).includes('An unsaved paragraph &lt;img'), 'Explicit recovery did not save submitted source');
  await page.getByRole('link', { name: 'Edit saved draft', exact: true }).click();
  await page.getByLabel('Markdown source', { exact: true }).fill('Temporary unsaved replacement');
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  assert(await page.getByLabel('Markdown source', { exact: true }).inputValue() === attempted, 'Discard did not restore saved draft');

  // Native server behavior: visible context, preview/validation without JS.
  const nativeContext = await page.context().browser().newContext({ javaScriptEnabled: false });
  const native = await nativeContext.newPage();
  await native.goto(origin + '/review/versioned-documents');
  await native.getByRole('link', { name: 'Unpublished document', exact: true }).click();
  assert((await native.locator('main').innerText()).includes('This document has no published edition.'), 'Native guide did not open the unpublished state');
  await native.goto(origin + compare);
  assert(await native.locator('[data-comparison-context]').count() > 0, 'Native comparison has no context');
  for (const context of await native.locator('[data-comparison-context]').all())
    assert(await context.isVisible(), 'Native context must remain visible');
  await native.goto(origin + '/versioned-documents/documents/example/edit');
  await native.getByLabel('Change summary', { exact: true }).fill('');
  await native.getByRole('button', { name: 'Save draft', exact: true }).click();
  await native.getByText('Enter a change summary.', { exact: true }).waitFor();
  assert(await native.getByLabel('Markdown source', { exact: true }).inputValue() === attempted, 'Native validation lost text');
  await native.getByRole('button', { name: 'Preview submitted text', exact: true }).click();
  await native.getByRole('heading', { name: 'Rendered preview · Saved text', exact: true }).waitFor();
  await native.getByLabel('Change summary', { exact: true }).fill('Save from the summary field with Enter');
  await native.getByLabel('Change summary', { exact: true }).press('Enter');
  await native.getByText('Draft saved. Published version 1.1 is unchanged.', { exact: true }).waitFor();
  await nativeContext.close();

  // Existing local revision-switching API stays independent of the new element.
  await page.goto(origin + compare);
  await page.evaluate(async markup => {
    const { enhanceContentRevisions } = await import('fieldwork/content-revisions');
    const container = document.createElement('div'); container.innerHTML = markup; document.body.append(container);
    const root = container.firstElementChild;
    const controller = enhanceContentRevisions(root);
    root.querySelector('[href="#description-previous"]').click();
    if (root.querySelector('#description-previous').hidden) throw new Error('Existing revision picker no longer switches');
    controller.destroy();
    if ([...root.querySelectorAll('[data-revision-view]')].some(view => view.hidden)) throw new Error('Existing revision cleanup changed');
    container.remove();
  }, __COMPATIBILITY__);
  assert(!errors.length, errors.join('; '));
  return { passed: true, checks: [
    'unified comparison: focus, visible context, fixed pair and cleanup',
    'Turbo visit/cache restoration and existing local revision picker compatibility',
    'explicit identical/first/unavailable states and publication/history entry points',
    'preview/422/409/exit protection retain attempted source; explicit recovery and Discard',
    'native comparison, validation, explicit preview and Enter-to-save; escaped source'
  ] };
}
