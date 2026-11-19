async page => {
  page.setDefaultTimeout(10000);
  const origin=__ORIGIN__,checks=[],errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const assert=(value,message)=>{if(!value)throw new Error(message);};
  const field=name=>page.locator('#entry_'+name);
  const button=name=>page.getByRole('button',{name,exact:true});
  const value=label=>page.locator('dt').filter({hasText:new RegExp('^'+label+'$')}).locator('..').locator('dd').innerText();
  try {
    await page.goto(origin+'/purchase-request/purchases/new');
    await page.waitForFunction(()=>document.querySelector('#purchase-form')?.dataset.state==='ready');
    await field('unit_price').fill('1,234');await field('discount').fill('101');await field('quantity').fill('1e3');await field('ends_on').fill('2030-02-01');
    await button('Review request').click();
    await page.locator('#entry_unit_price[aria-invalid="true"]').waitFor();
    assert(await field('unit_price').inputValue()==='1,234' && await field('quantity').inputValue()==='1e3','Rejected decimal text was sanitized or lost');
    assert(await page.locator('[data-form-error-summary]').evaluate(node=>!node.hidden && node===document.activeElement),'Business errors did not focus the shared summary');
    await page.locator('[data-form-error-list] a').first().click();
    assert(await field('unit_price').evaluate(node=>node===document.activeElement),'Error summary did not focus the rejected amount');
    assert(await field('supplier').isVisible(),'Failed form replacement lost its native supplier choice');
    await field('unit_price').fill('125,50');await field('discount').fill('7,5');await field('quantity').fill('2,5');await field('ends_on').fill('2030-03-31');
    const oldForm=await page.locator('#purchase-form').elementHandle();
    let releaseReview;
    const reviewing = new Promise(resolve => { releaseReview = resolve; });
    await page.route('**/purchases/preview', async route => { await reviewing; await route.continue(); }, {times: 1});
    const submission = button('Review request').click();
    try {
      await button('Reviewing request…').waitFor();
      assert(await page.locator('#purchase-form [data-form-status]').innerText() === 'Reviewing request…', 'Review step falsely claims to create a record while pending');
      assert(await field('unit_price').isDisabled(), 'Pending review permits edits to its submitted values');
    } finally { releaseReview(); await submission; }
    await page.getByRole('heading',{name:'Review purchase request',exact:true}).waitFor();
    await page.waitForURL('**/purchases/review?*');
    assert(await value('Line subtotal')==='CHF 313.75' && await value('Discount amount')==='CHF 23.53' && await value('Total')==='CHF 290.22','Exact decimal review totals incorrect');
    assert((await value('Delivery period')).includes('31 inclusive days'),'Inclusive date-only period incorrect');
    assert(await oldForm.evaluate(form=>{const hint=form.querySelector('#entry_unit_price-hint').textContent;form.querySelector('[name="entry[currency]"]').value='JPY';form.dispatchEvent(new Event('change',{bubbles:true}));return hint===form.querySelector('#entry_unit_price-hint').textContent;}),'Removed form retained signal-owned business listeners');
    checks.push('Raw invalid decimal/range values survive 422; remount/focus work; comma decimals resolve with exact CHF rounding and inclusive dates');

    const oldReview=await page.context().newPage();await oldReview.goto(page.url());
    await page.getByRole('link',{name:'Change details',exact:true}).click();await field('currency').selectOption('JPY');await field('unit').selectOption('items');
    assert(await field('unit_price').inputValue()==='125,50' && await field('quantity').inputValue()==='2,5','Currency/unit change silently converted entered values');
    await button('Review request').click();await page.locator('#entry_unit_price[aria-invalid="true"]').waitFor();
    assert(await field('quantity').getAttribute('aria-invalid')==='true','Whole-item rule not enforced');
    await field('unit_price').fill('125');await field('quantity').fill('2');await field('ends_on').fill('2030-03-01');
    await button('Review request').click();await page.getByRole('heading',{name:'Review purchase request',exact:true}).waitFor();
    assert(await value('Total')==='JPY 231','JPY whole-amount rounding incorrect');
    assert((await value('Delivery period')).includes('1 inclusive day'),'Same-day period was not accepted');
    await oldReview.getByRole('button',{name:'Record purchase request',exact:true}).click();await oldReview.getByRole('heading',{name:'Review the current draft',exact:true}).waitFor();await oldReview.close();
    checks.push('Currency/unit changes preserve numbers, enforce new precision, permit same-day ranges and invalidate old reviews');

    await page.getByRole('link',{name:'Change details',exact:true}).click();await field('currency').selectOption('CHF');await field('unit_price').fill('0.05');await field('discount').fill('10');await field('quantity').fill('1');
    await button('Review request').click();await page.getByRole('heading',{name:'Review purchase request',exact:true}).waitFor();
    assert(await value('Discount amount')==='CHF 0.01' && await value('Total')==='CHF 0.04','Half-up minor-unit tie handled incorrectly');
    const reviewedURL = page.url();
    await page.getByRole('link',{name:'Review scenarios',exact:true}).click();
    await page.getByRole('heading',{name:'Purchase request review scenarios',exact:true}).waitFor();
    await page.getByRole('link',{name:'Return to review',exact:true}).click();
    await page.getByRole('heading',{name:'Review purchase request',exact:true}).waitFor();
    assert(page.url()===reviewedURL,'Review scenarios changed the reviewed attempt or revision');
    await page.getByRole('link',{name:'Review scenarios',exact:true}).click();
    await button('Fail next confirmation once').click();await page.getByText('The next confirmation will fail once.',{exact:true}).waitFor();
    const confirmation=await page.locator('#confirm-purchase').evaluate(form=>Object.fromEntries(new FormData(form)));
    await button('Record purchase request').click();await page.getByText('The request could not be saved. Nothing was created; your reviewed values are retained. Try again.',{exact:true}).waitFor();
    assert(await value('Total')==='CHF 0.04','Failed confirmation lost reviewed values');
    await button('Record purchase request').click();await page.getByRole('heading',{name:'Purchase request recorded',exact:true}).waitFor();await page.waitForURL(/\/purchases\/\d+$/);
    const recordURL=page.url();const replay=await page.request.post(origin+'/purchase-request/purchases',{form:confirmation});
    assert(replay.ok() && replay.url()===recordURL,'Retry did not reconcile the recorded request');
    checks.push('Half-up tie, failed confirmation retention, retry and idempotent recording');

    await page.goto(origin+'/purchase-request/purchases/new');
    const attempt = await page.locator('input[name="attempt"]').inputValue();
    const staleEditor = await page.context().newPage();
    await staleEditor.goto(origin+'/purchase-request/purchases/new?attempt='+attempt);
    await field('unit_price').fill('200');
    await button('Review request').click();
    await page.getByRole('heading',{name:'Review purchase request',exact:true}).waitFor();
    await staleEditor.locator('#entry_unit_price').fill('300,25');
    await staleEditor.getByRole('button',{name:'Review request',exact:true}).click();
    await staleEditor.getByRole('heading',{name:'Draft changed in another tab',exact:true}).waitFor();
    const attempted = staleEditor.getByRole('region',{name:'Your attempted values',exact:true});
    const saved = staleEditor.getByRole('region',{name:'Current saved values',exact:true});
    assert((await attempted.innerText()).includes('300,25'), 'Stale edit lost the raw attempted price');
    assert((await saved.innerText()).includes('200'), 'Stale edit did not show the current saved price');
    const recoveryOpened = staleEditor.waitForEvent('popup');
    await staleEditor.getByRole('link',{name:'Open current saved draft in a new tab',exact:true}).click();
    const recovery = await recoveryOpened;
    await recovery.locator('#entry_unit_price').waitFor();
    assert(await recovery.locator('#entry_unit_price').inputValue()==='200', 'Stale edit overwrote saved draft');
    assert((await attempted.innerText()).includes('300,25'), 'Opening recovery removed the attempted values');
    await recovery.close();
    await staleEditor.close();
    checks.push('Stale editor retains raw attempted values beside the saved draft; recovery opens separately without overwriting either');

    const nativeContext=await page.context().browser().newContext({javaScriptEnabled:false});const native=await nativeContext.newPage();
    await native.goto(origin+'/purchase-request/purchases/new');
    await native.locator('#entry_unit_price').fill('0,05');await native.locator('#entry_quantity').fill('3');await native.locator('#entry_ends_on').fill('2030-02-01');
    await native.getByRole('button',{name:'Review request',exact:true}).click();await native.locator('#entry_ends_on[aria-invalid="true"]').waitFor();
    assert(await native.locator('#entry_unit_price').inputValue()==='0,05','Native error lost raw decimal');
    assert(await native.locator('[data-form-error-summary]').isVisible(), 'Native server rejection omitted its error summary');
    await native.locator('[data-form-error-list] a').filter({hasText:'Ends on'}).click();
    assert(await native.locator('#entry_ends_on').evaluate(el=>el===document.activeElement), 'Native error link did not focus the delivery date');
    await native.locator('#entry_currency').selectOption('USD');await native.locator('#entry_ends_on').fill('2030-03-01');await native.getByRole('button',{name:'Review request',exact:true}).click();
    await native.getByText('USD 0.14',{exact:true}).waitFor();await native.getByRole('button',{name:'Record purchase request',exact:true}).click();await native.getByRole('heading',{name:'Purchase request recorded',exact:true}).waitFor();await nativeContext.close();
    assert(errors.length===0,errors.join('\n'));
    checks.push('Native decimal entry, linked date validation, correction and canonical USD confirmation work without JavaScript');
    return {passed:true,checks};
  }catch(error){throw new Error(JSON.stringify({checks,url:page.url(),errors,content:await page.locator('main').innerText(),error:error.message}));}
}
