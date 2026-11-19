async page => {
  const origin = __ORIGIN__;
  const checks = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(10000);
  await page.context().clearCookies();
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const scenario = action => page.evaluate(async action => {
    const response = await fetch('/population-review/scenarios', {method:'POST', headers:{'X-CSRF-Token':document.querySelector('meta[name="csrf-token"]').content,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({scenario:action})});
    if(!response.ok) throw new Error('Could not apply comparison scenario');
  }, action);
  const row = key => page.locator(`[data-comparison-field="${key}"]`);
  const values = key => row(key).getByRole('definition').allTextContents();
  const saved = () => page.locator('#review-result').waitFor();
  const compare = number => page.goto(`${origin}/population-review/reviews/1/inputs/1/comparison?assessment=${number}&view=changed`);
  const assess = async id => {
    await page.goto(`${origin}/population-review/reviews/1/inputs/${id}/assessment`);
    await page.getByRole('radio',{name:'Satisfactory',exact:true}).check();
    await page.getByLabel('Assessment basis',{exact:true}).fill('Checked the current operating facts and evidence, including recorded availability limits.');
    await page.getByRole('button',{name:'Save assessment',exact:true}).click();
    await saved();
  };
  const link = async (id, filename, purpose) => {
    await page.goto(`${origin}/population-review/reviews/1/inputs/${id}/evidence/new?mode=link`);
    await page.getByRole('button',{name:/Existing evidence/}).click();
    await page.getByRole('combobox').fill(filename);
    await page.getByRole('option',{name:new RegExp(filename)}).click();
    await page.getByLabel('What this evidence supports',{exact:true}).fill(purpose);
    await page.getByRole('button',{name:'Link evidence',exact:true}).click();
    await saved();
  };
  await page.goto(origin+'/population-review/reviews/1');
  await page.getByRole('button',{name:'Start review',exact:true}).click();
  await saved();
  assert((await page.context().request.get(origin+'/population-review/reviews/1/inputs/1/comparison?assessment=1')).status()===404,'A comparison requires an actual recorded assessment');
  await link(1,'service-account-export','Identifies the account and its owner.');
  await assess(1);
  await compare(1);
  await page.getByRole('heading',{name:'No changes in the compared values',exact:true}).waitFor();
  assert((await values('interactive_sign_in'))[0].includes('No') && (await values('active_sessions'))[0].includes('0'),'False and zero are real unchanged values');
  assert((await values('identifier')).every(value=>value.includes('Not recorded')),'Missing values are explicitly identified');
  assert(await page.locator('.record-comparison-row[data-change="unchanged"]').count()===8,'Known field/evidence equality is distinct from missing comparison data');
  await scenario('comparison_changes');
  await compare(1);
  assert((await values('owner'))[0].includes('Jamie Chen') && (await values('owner'))[1].includes('Robin Ellis'),'Assessed/current owner values retain their direction');
  assert(await row('owner').getByText('Changed',{exact:true}).isVisible(),'Changes have a visible text label');
  assert(await row('identifier').getByText('Added',{exact:true}).isVisible() && (await values('identifier'))[0].includes('Not recorded'),'Added values preserve the missing earlier side');
  assert(await row('legacy_reference').getByText('Removed',{exact:true}).isVisible() && (await values('legacy_reference'))[1].includes('Not recorded'),'Removed values preserve the earlier content');
  assert((await values('scope'))[1].includes('<Restricted>') && await page.locator('.record-comparison restricted').count()===0,'Long multiline values are escaped and preserved as text');
  checks.push('directional changed/added/removed values, explicit absence, real false/zero values and escaped multiline content');

  await page.getByRole('link',{name:'Reassess account',exact:true}).click();
  await page.getByLabel('Assessment basis',{exact:true}).fill('Draft that must survive comparison and a stale save.');
  await scenario('change');
  await scenario('comparison_changes');
  await page.getByRole('button',{name:'Save assessment',exact:true}).click();
  await page.getByText(/The review or supporting facts changed/).waitFor();
  const [popup] = await Promise.all([page.waitForEvent('popup'),page.getByRole('link',{name:'Compare assessed and current values (new tab)',exact:true}).click()]);
  try {
    await popup.getByRole('heading',{name:'Compare assessment basis',exact:true}).waitFor();
    assert(new URL(popup.url()).searchParams.get('assessment')==='1','Stale form comparison names the recorded assessment');
    assert((await popup.locator('[data-comparison-field="owner"]').innerText()).includes('Robin Ellis'),'Popup reads the current basis');
  } finally {await popup.close();}
  assert(await page.getByLabel('Assessment basis',{exact:true}).inputValue()==='Draft that must survive comparison and a stale save.','Opening comparison never replaces the stale draft');
  await page.getByRole('link',{name:'Cancel',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Leave without saving',exact:true}).click();
  await page.getByRole('heading',{name:'Service-account assurance review',exact:true}).waitFor();
  await scenario('comparison_unavailable');
  await compare(1);
  await page.getByRole('heading',{name:'Comparison unavailable',exact:true}).waitFor();
  assert(await page.locator('.record-comparison-row').count()===0 && await page.getByRole('heading',{name:'No changes in the compared values',exact:true}).count()===0,'Unavailable data cannot appear as an identical comparison');
  assert((await page.getByRole('link',{name:'Retry comparison',exact:true}).getAttribute('href')).includes('assessment=1'),'Retry retains the exact assessed side');
  await scenario('comparison_available');
  await page.getByRole('link',{name:'Retry comparison',exact:true}).click();
  await row('owner').waitFor();
  checks.push('stale-form conflict retains its draft while comparison opens separately; unavailable/retry keeps the assessment identity');

  await page.goto(origin+'/population-review/reviews/1/inputs/1');
  await page.getByRole('link',{name:'Remove link to service-account-export.csv',exact:true}).click();
  await page.getByRole('button',{name:'Remove link',exact:true}).click();
  await saved();
  await link(1,'backup-safeguards','Documents backup safeguards checked for this account.');
  await compare(1);
  assert(await row('evidence-1').getByText('Removed',{exact:true}).isVisible() && (await values('evidence-1'))[0].includes('Identifies the account and its owner.'),'Removed evidence retains its original per-use explanation');
  assert(await row('evidence-2').getByText('Added',{exact:true}).isVisible() && (await values('evidence-2'))[1].includes('Documents backup safeguards'),'Added evidence is matched by original identity');
  await assess(1);
  await compare(2);
  await page.getByRole('heading',{name:'No changes in the compared values',exact:true}).waitFor();
  await compare(1);
  assert((await values('owner'))[0].includes('Jamie Chen'),'Old assessment URL is not retargeted after a fresh assessment');
  assert((await page.getByRole('region',{name:'Comparison sources',exact:true}).innerText()).includes('Assessment 1'),'Pair provenance names the pinned assessment');
  await page.goto(origin+'/population-review/evidence/2/withdrawal');
  await page.getByLabel('Withdrawal reason',{exact:true}).fill('Superseded by a new operating check.');
  await page.getByRole('button',{name:'Withdraw original',exact:true}).click();
  await saved();
  await compare(2);
  assert(await row('evidence-2').getByText('Changed',{exact:true}).isVisible(),'Withdrawal changes availability rather than pretending the evidence link disappeared');
  const availability=await values('evidence-2');
  assert(availability[0].includes('Available') && availability[1].includes('Withdrawn'),'Recorded and current availability remain distinct');
  checks.push('evidence additions/removals, stable historic pairs and recorded versus current file availability');

  for(const id of [1,2,3,4]) await assess(id);
  await page.getByRole('link',{name:'Complete review',exact:true}).click();
  await page.getByLabel('Review conclusion',{exact:true}).fill('Completed checking with retained comparison and evidence history.');
  await page.getByRole('button',{name:'Complete review',exact:true}).click();
  await saved();
  await scenario('change');
  await compare(3);
  assert((await page.locator('main').innerText()).includes('This review is completed.'),'Completed review comparison explains historical immutability');
  assert(await page.getByRole('link',{name:'Reassess account',exact:true}).count()===0,'Read-only completed comparison offers no reassessment action');
  assert((await page.context().request.get(origin+'/population-review/reviews/1/inputs/1/comparison?assessment=999')).status()===404,'Unknown assessment IDs never fall back to latest');
  checks.push('completed results remain immutable and invalid assessment identities are rejected');

  const context=await page.context().browser().newContext({javaScriptEnabled:false});
  try {
    const native=await context.newPage();
    await native.goto(origin+'/population-review/reviews/1');
    await native.getByRole('button',{name:'Start review',exact:true}).click();
    await native.getByRole('link',{name:'Continue review',exact:true}).click();
    await native.getByRole('radio',{name:'Satisfactory',exact:true}).check();
    await native.getByLabel('Assessment basis',{exact:true}).fill('Native assessment for comparison.');
    await native.getByRole('button',{name:'Save assessment',exact:true}).click();
    await native.locator('#review-result').waitFor();
    await native.goto(origin+'/population-review/reviews/1/inputs/1');
    await native.getByRole('link',{name:'Compare assessment 1 with current',exact:true}).click();
    await native.getByRole('heading',{name:'No changes in the compared values',exact:true}).waitFor();
    await native.goto(origin+'/population-review/scenarios');
    await native.getByRole('button',{name:'Change account comparison fields',exact:true}).click();
    await native.goto(origin+'/population-review/reviews/1/inputs/1/comparison?assessment=1');
    assert((await native.locator('[data-comparison-field="active_sessions"]').innerText()).includes('0'),'Native comparison shows unchanged zero values');
    assert(await native.locator('[data-comparison-field="identifier"]').getByText('Added',{exact:true}).isVisible(),'Native comparison shows directional changes');
  } finally {await context.close();}
  assert(errors.length===0,'No uncaught comparison errors: '+errors.join('; '));
  checks.push('native links, comparisons and unchanged values work without JavaScript');
  return {passed:true,checks};
}
