async page => {
  const origin = __ORIGIN__;
  page.setDefaultTimeout(10000);
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin);
  const imports = JSON.parse(await page.locator('script[type="importmap"]').textContent()).imports;
  for (const module of Object.keys(imports).filter(name => name.startsWith('fieldwork/'))) {
    assert(/\/assets\/fieldwork\/.+-[a-f0-9]+\.js$/.test(imports[module]), 'Module lacks a fingerprint: ' + module);
    await page.evaluate(name => import(name), module);
    const response = await page.request.get(origin + imports[module]);
    assert(response.ok() && response.headers()['content-type']?.includes('javascript'), 'Module route/MIME failed: ' + module);
  }
  const iconUrls = new Set();
  for (const sheet of ['ui', 'tables']) {
    const url = await page.locator(`link[href*="/assets/fieldwork/${sheet}-"]`).getAttribute('href');
    const response = await page.request.get(origin + url);
    assert(response.ok() && response.headers()['content-type']?.includes('text/css'), 'Stylesheet route/MIME failed: ' + sheet);
    for (const match of (await response.text()).matchAll(/url\(["']?([^"')]+\.svg)["']?\)/g)) {
      if (match[1].includes('/icons/')) iconUrls.add(new URL(match[1], origin + url).href);
    }
  }
  assert(iconUrls.size > 0, 'Bundled CSS icon references are missing');
  for (const url of iconUrls) {
    assert(/\/icons\/.+-[a-f0-9]+\.svg$/.test(url), 'Icon lacks a fingerprint: ' + url);
    const response = await page.request.get(url);
    assert(response.ok() && response.headers()['content-type']?.includes('image/svg+xml'), 'Icon route/MIME failed: ' + url);
  }
  const decorative = page.getByRole('button', { name: 'Upload sample', exact: true }).locator('svg');
  assert(await decorative.getAttribute('aria-hidden') === 'true', 'Decorative helper icon is exposed');
  assert(await decorative.getAttribute('focusable') === 'false', 'Helper icon can take focus');
  const labelled = page.getByRole('img', { name: 'Spreadsheet <CSV>', exact: true });
  assert(await labelled.getAttribute('class') === 'icon installed-file-icon', 'Helper lost the default or supplied class');
  assert(await labelled.evaluate(el => getComputedStyle(el).width) === '20px', 'Default icon size differs');
  const native = page.locator('span[data-icon="alarm-clock"]');
  assert(await native.evaluate(el => /alarm-clock-[a-f0-9]+\.svg/.test(getComputedStyle(el).maskImage)), 'Plain HTML icon lacks its production asset');
  await page.getByLabel('Name', {exact: true}).waitFor();
  await page.getByRole('button', {name: 'Discard changes', exact: true}).waitFor();
  await page.goto(origin + '?form_position=start');
  await page.getByLabel('Name', {exact: true}).waitFor();
  const placement = await page.locator('form').evaluate(form => {
    const actions = form.querySelector('.form-actions');
    const field = form.querySelector('input[name="name"]');
    const status = form.querySelector('[data-form-status]');
    const fields = form.querySelector('[data-form-fields]');
    return Boolean(actions.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING) &&
      Boolean(status.compareDocumentPosition(fields) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  assert(placement, 'Rails helper did not put start actions and feedback before the fields');
  assert(!errors.length, errors.join('; '));
  return {passed: true, checks: ['fresh app: installer idempotency, agent reference, helpers and form initialization',
    'production assets: fingerprinted styles, icon assets and complete native module graph',
    'Rails helper supports actions and feedback before fields',
    'icons: registered SVG helper, decorative/labeled accessibility, sizing and plain HTML masks']};
}
