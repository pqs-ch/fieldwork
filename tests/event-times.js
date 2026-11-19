async page => {
  const origin=__ORIGIN__, checks=[], errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.setDefaultTimeout(10000);
  await page.context().clearCookies();
  const assert=(ok,message)=>{if(!ok)throw new Error(message);};
  const formValues=id=>page.locator(id).evaluate(form=>[...new FormData(form).entries()]);
  const post=(path,body)=>page.evaluate(async({path,body})=>{
    const response=await fetch(path,{method:'POST',headers:{'X-CSRF-Token':document.querySelector('meta[name="csrf-token"]').content,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)});
    return {status:response.status,text:await response.text()};
  },{path,body});
  const fill=async(target,local,zone='Europe/Zurich')=>{
    await target.getByLabel('Event',{exact:true}).fill('Synthetic service interruption');
    await target.getByLabel('Event local time',{exact:true}).fill(local);
    await target.getByLabel('Event timezone',{exact:true}).selectOption(zone);
    await target.getByLabel('Review by',{exact:true}).fill('2026-10-26');
  };
  const preview=async target=>{
    await target.getByRole('button',{name:'Review event',exact:true}).click();
  };
  const reviewReady=target=>target.getByRole('heading',{name:'Review event',exact:true}).waitFor();
  const instant=(target,selector)=>target.locator(selector).getAttribute('datetime');
  await page.goto(origin+'/event-times/events/new');
  await fill(page,'2026-10-25T02:30');
  await preview(page);
  await page.getByRole('group',{name:'Which occurrence?',exact:true}).waitFor();
  assert(await page.getByRole('radio').count()===2 && await page.locator('input[type=radio]:checked').count()===0,'Repeated local time requires an explicit occurrence without a default');
  await page.getByRole('radio',{name:/First occurrence/}).check();
  await preview(page);await reviewReady(page);
  assert(await instant(page,'[data-event-utc]')==='2026-10-25T00:30:00Z','First Zurich occurrence resolves to the earlier UTC instant');
  assert(await instant(page,'[data-target-utc]')==='2026-10-25T04:30:00Z' && (await page.locator('[data-target-time]').innerText()).includes('05:30'),'Four elapsed hours cross the clock change without adding four wall-clock hours');
  const firstReview=await formValues('#confirm-event');
  const firstUrl=page.url();
  await page.getByRole('link',{name:'Revise details',exact:true}).click();
  await page.getByRole('radio',{name:/Second occurrence/}).check();
  await preview(page);await reviewReady(page);
  assert(await instant(page,'[data-event-utc]')==='2026-10-25T01:30:00Z','Second occurrence resolves to a distinct UTC instant');
  const stale=await post('/event-times/events',firstReview);
  assert(stale.status===409 && stale.text.includes('Review details again'),'Confirmation cannot record an older reviewed revision');
  const currentReview=await formValues('#confirm-event');
  await page.getByRole('link',{name:'Review scenarios',exact:true}).click();
  await page.getByRole('button',{name:'Fail the next recording',exact:true}).click();
  await reviewReady(page);
  assert(await instant(page,'[data-event-utc]')==='2026-10-25T01:30:00Z', 'Scenario setup changed the reviewed time');
  await page.getByRole('button',{name:'Record event',exact:true}).click();
  await page.getByText(/Recording is temporarily unavailable/).waitFor();
  assert(await instant(page,'[data-event-utc]')==='2026-10-25T01:30:00Z','Failed recording retains the exact reviewed occurrence');
  await page.getByRole('button',{name:'Record event',exact:true}).click();
  await page.locator('#event-result').waitFor();
  await page.waitForURL(/\/events\/\d+$/);
  await page.getByRole('heading',{name:'Synthetic service interruption',exact:true}).waitFor();
  const recordedUrl=page.url();
  assert(await instant(page,'[data-recorded-time]')!==await instant(page,'[data-event-utc]'),'Recording time is independent of historical event time');
  const duplicate=await post('/event-times/events',currentReview);
  assert(duplicate.status===200 && duplicate.text.includes('already recorded'),'Successful confirmation replay acknowledges the same event');
  await page.goto(firstUrl);
  await page.getByRole('heading',{name:'Synthetic service interruption',exact:true}).waitFor();
  assert(page.url()===recordedUrl,'Back to an old review returns the already recorded event');
  await page.goto(origin+'/event-times/events');
  assert(await page.getByRole('list',{name:'Recorded events'}).locator('li').count()===1,'Preview, failure and retry create exactly one event');
  checks.push('explicit DST occurrence, elapsed deadline across a fold, confirmation freshness, failed-save retention and deduplication');

  for(const timezoneId of ['America/Los_Angeles','Asia/Tokyo']) {
    const viewer=await page.context().browser().newContext({timezoneId});
    try {
      await viewer.addCookies(await page.context().cookies());
      const other=await viewer.newPage();await other.goto(recordedUrl);
      assert(await instant(other,'[data-review-date]')==='2026-10-26' && (await other.locator('[data-review-date]').innerText()).includes('26 Oct 2026'),'Date-only review date is preserved in '+timezoneId);
      assert((await other.locator('[data-event-time]').innerText()).includes('02:30') && await instant(other,'[data-event-utc]')==='2026-10-25T01:30:00Z','Explicit event timezone is preserved in '+timezoneId);
    } finally {await viewer.close();}
  }
  checks.push('event-zone display and date-only values remain stable across different viewer timezones');

  await page.goto(origin+'/event-times/events/new');
  await fill(page,'2026-03-29T02:30');await preview(page);
  await page.getByText(/does not exist in Europe\/Zurich/).waitFor();
  assert(await page.getByLabel('Event local time',{exact:true}).evaluate(input=>input===document.activeElement), 'A time error should focus the local-time correction');
  assert(await page.getByLabel('Event local time',{exact:true}).inputValue()==='2026-03-29T02:30','Gap handling never silently shifts the entered time');
  assert(await page.getByLabel('Review by',{exact:true}).inputValue()==='2026-10-26','Gap failure retains other values');
  await page.getByLabel('Event local time',{exact:true}).fill('2026-03-29T03:30');
  await preview(page);await reviewReady(page);
  assert(await instant(page,'[data-event-utc]')==='2026-03-29T01:30:00Z','Corrected spring-forward time resolves normally');
  await page.getByRole('link',{name:'Revise details',exact:true}).click();
  await fill(page,'2026-10-24T00:15','Asia/Kolkata');await preview(page);await reviewReady(page);
  assert(await instant(page,'[data-event-utc]')==='2026-10-23T18:45:00Z','Non-hour offset preserves the previous UTC calendar date');
  assert(await instant(page,'[data-target-utc]')==='2026-10-23T22:45:00Z','Elapsed deadline works for non-hour offsets');
  await page.getByRole('link',{name:'Revise details',exact:true}).click();
  await page.getByLabel('Event timezone',{exact:true}).selectOption('Etc/UTC');
  assert(await page.getByLabel('Event local time',{exact:true}).inputValue()==='2026-10-24T00:15','Changing timezone keeps the entered wall-clock value');
  await preview(page);await reviewReady(page);
  assert(await instant(page,'[data-event-utc]')==='2026-10-24T00:15:00Z','New timezone must be reviewed as a newly resolved instant');
  checks.push('nonexistent-time recovery, explicit timezone changes, midnight boundaries and non-hour offsets');

  await page.goto(origin+'/event-times/events/new');await fill(page,'2026-10-25T02:30');await preview(page);
  await page.getByRole('radio',{name:/First occurrence/}).check();
  await page.getByLabel('Event local time',{exact:true}).fill('2025-10-26T02:30');
  assert(await page.locator('[data-occurrence-group]').isHidden(),'Changing the local time hides obsolete occurrence choices');
  await preview(page);
  await page.getByRole('group',{name:'Which occurrence?',exact:true}).waitFor();
  assert(await page.locator('input[type=radio]:checked').count()===0,'Another repeated time requires a new occurrence choice');
  await page.getByRole('radio',{name:/First occurrence/}).check();
  await page.getByRole('link',{name:'Cancel',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Keep editing',exact:true}).click();
  assert(await page.getByLabel('Event local time',{exact:true}).inputValue()==='2025-10-26T02:30','Canceled exit preserves the corrected draft');
  await page.getByRole('link',{name:'Cancel',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Leave without saving',exact:true}).click();
  await page.getByRole('heading',{name:'Event records',exact:true}).waitFor();
  checks.push('obsolete occurrence choices are reset and draft exit confirmation preserves corrections');

  await page.goto(origin+'/event-times/events/new');
  await fill(page,'2026-10-24T00:15','Asia/Kolkata');
  const reset=await page.context().newPage();
  try {
    await reset.goto(origin+'/review/event-times/reset');
    await reset.getByRole('button',{name:'Reset example',exact:true}).click();
    await reset.getByRole('status').filter({hasText:'reset to its starting data.'}).waitFor();
  } finally { await reset.close(); }
  await preview(page);
  await page.getByText(/This form expired/).waitFor();
  assert(await page.getByRole('button',{name:'Review event',exact:true}).isDisabled(), 'Expired form offered an impossible retry');
  assert(await page.getByLabel('Event local time',{exact:true}).inputValue()==='2026-10-24T00:15' && await page.getByLabel('Event timezone',{exact:true}).inputValue()==='Asia/Kolkata', 'Expired form lost attempted values');
  const freshPage=page.context().waitForEvent('page');
  await page.getByRole('link',{name:'Start a fresh event (new tab)',exact:true}).click();
  const fresh=await freshPage;
  try {
    await fresh.getByRole('heading',{name:'Record an event',exact:true}).waitFor();
    assert(await fresh.getByLabel('Event',{exact:true}).inputValue()==='', 'Recovery did not start a fresh event');
    assert(await page.getByLabel('Event local time',{exact:true}).inputValue()==='2026-10-24T00:15', 'Recovery replaced the attempted values');
  } finally { await fresh.close(); }
  await page.getByRole('link',{name:'Cancel',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Leave without saving',exact:true}).click();
  await page.getByRole('heading',{name:'Event records',exact:true}).waitFor();
  checks.push('expired forms retain attempted values, disable impossible retry and open recovery separately');

  const nativeContext=await page.context().browser().newContext({javaScriptEnabled:false});
  try {
    const native=await nativeContext.newPage();await native.goto(origin+'/event-times/events/new');
    await fill(native,'2026-10-25T02:30');await preview(native);
    await native.getByRole('radio',{name:/First occurrence/}).check();
    await native.getByLabel('Event local time',{exact:true}).fill('2025-10-26T02:30');
    await preview(native);
    assert(await native.locator('input[type=radio]:checked').count()===0,'Server rejects stale occurrence binding without JavaScript');
    await native.getByRole('radio',{name:/Second occurrence/}).check();
    await preview(native);await reviewReady(native);
    assert(await instant(native,'[data-event-utc]')==='2025-10-26T01:30:00Z','Native fold resolution is identical');
    await native.getByRole('button',{name:'Record event',exact:true}).click();
    await native.locator('#event-result').waitFor();
    assert(await instant(native,'[data-review-date]')==='2026-10-26','Native recording preserves the date-only value');
  } finally {await nativeContext.close();}
  assert(errors.length===0,'No uncaught event-time errors: '+errors.join('; '));
  checks.push('native timezone resolution, stale-choice rejection, review and confirmation work without JavaScript');
  return {passed:true,checks};
}
