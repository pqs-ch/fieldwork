async page => {
  page.setDefaultTimeout(8000);
  const origin = __ORIGIN__, checks = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const keep = () => page.getByRole('button', {name:'Keep editing', exact:true}).click();
  const leave = () => page.getByRole('button', {name:'Leave without saving', exact:true}).click();
  const title = () => page.locator('#title');
  const scenario = value => page.locator('#scenario').selectOption(value);
  try {
  await page.goto(origin + '/draft-protection/workspace');
  await page.getByRole('link', {name:'Edit project brief'}).click();
  await scenario('slow');
  assert(await page.getByRole('button',{name:'Save brief',exact:true}).isDisabled(), 'Synthetic choice was treated as a brief edit');
  await page.getByRole('link', {name:'Workspace',exact:true}).click();
  await page.getByRole('heading',{name:'Workspace',exact:true}).waitFor();
  assert(await page.getByRole('dialog').count()===0, 'Review choice alone produced a loss warning');
  await page.getByRole('link', {name:'Edit project brief'}).click();
  checks.push('Review controls stay secondary and do not create an editing draft');
  await title().fill('Retain the draft');
  await page.locator('#files').setInputFiles({name:'scope.txt',mimeType:'text/plain',buffer:Buffer.from('draft evidence')});
  await page.getByRole('link', {name:'Workspace',exact:true}).click();
  assert(await page.getByRole('button',{name:'Keep editing',exact:true}).evaluate(node=>node===document.activeElement), 'Safe choice must receive focus');
  await page.keyboard.press('Escape');
  assert(await title().inputValue()==='Retain the draft', 'Escape lost draft');
  assert(await page.getByRole('link',{name:'Workspace',exact:true}).evaluate(node=>node===document.activeElement), 'Opener focus not recovered');
  await page.getByRole('link',{name:'Cancel',exact:true}).click();
  await keep();
  assert(await title().inputValue()==='Retain the draft' && await page.locator('#files').evaluate(input=>input.files.length)===1, 'Canceled exit lost the live brief');
  await page.getByRole('link',{name:'Read brief guidance'}).click();
  await page.getByRole('link',{name:'Close guidance'}).waitFor();
  assert(await page.getByRole('dialog').count()===0, 'Unrelated frame prompted');
  checks.push('Safe initial focus, Escape/opener recovery, and unrelated Frame scope');

  await page.evaluate(()=>history.back());
  await page.getByRole('button',{name:'Keep editing',exact:true}).waitFor();
  await keep();
  assert(new URL(page.url()).pathname==='/draft-protection/workbench', 'History Keep editing moved location');
  assert(await title().inputValue()==='Retain the draft', 'History rollback lost text');
  assert(await page.locator('#files').evaluate(async input=>[input.files.length,await input.files[0].text()]).then(value=>value[0]===1&&value[1]==='draft evidence'), 'History rollback lost File bytes');
  await page.evaluate(()=>history.back()); await leave();
  await page.getByRole('heading',{name:'Workspace',exact:true}).waitFor();
  await page.evaluate(()=>history.forward());
  await title().waitFor();
  assert(await page.getByRole('dialog').count()===0,'Approved history exit duplicated confirmation');
  checks.push('Back Keep editing retains text/File bytes and address; approved Back/Forward completes once');

  await title().fill('Cancel this edit');
  await page.getByRole('link',{name:'Cancel',exact:true}).click(); await leave();
  await page.getByRole('heading',{name:'Workspace',exact:true}).waitFor();
  assert(await page.locator('#brief-editor').count()===0, 'Cancel replaced the editor Frame instead of leaving the page');
  await page.getByRole('link',{name:'Edit project brief'}).click();
  checks.push('Cancel keeps the live draft or leaves the Frame for Workspace once');

  // No draft when the request starts; type/select while its response is pending.
  await page.getByRole('link',{name:'Load latest brief slowly'}).click();
  await title().fill('Edited during request');
  await page.locator('#files').setInputFiles({name:'late.txt',mimeType:'text/plain',buffer:Buffer.from('late draft')});
  await page.getByRole('button',{name:'Keep editing',exact:true}).waitFor(); await keep();
  await page.waitForFunction(()=>!document.querySelector('#brief-editor').hasAttribute('busy'));
  assert(await title().inputValue()==='Edited during request','Late response lost draft');
  assert(await page.locator('#files').evaluate(async input=>await input.files[0].text())==='late draft','Late response lost File bytes');
  // The original bridge controller must still own the live form after a no-op render.
  await page.getByRole('link',{name:'Reload brief',exact:true}).click(); await keep();

  await scenario('fail');
  await page.getByRole('button',{name:'Save brief',exact:true}).click();
  await page.getByText('The service is unavailable. Your changes have not been saved. Try again.',{exact:true}).waitFor();
  assert(await page.locator('#files').evaluate(async input=>await input.files[0].text())==='late draft','Failure lost File bytes');
  checks.push('Late Frame replacement is canceled cleanly; live controller and files survive failure');

  // Approval of the earlier navigation must not authorize replacing a new save.
  await scenario('slow');
  const savingForm = await page.locator('form[data-fieldwork-editing]').first().elementHandle();
  await page.evaluate(async () => {
    const { enhanceForm } = await import('fieldwork/forms');
    document.addEventListener('turbo:before-frame-render', event => {
      if (event.target.id !== 'brief-editor') return;
      const form = document.querySelector('#title').form;
      window.pendingFrameSave = {
        pending: enhanceForm(form).isSubmitting,
        file: document.querySelector('#files').files[0]?.name
      };
    }, { once: true, capture: true });
  });
  await page.getByRole('link',{name:'Load latest brief slowly'}).click();
  await leave();
  await page.getByRole('button',{name:'Save brief',exact:true}).click();
  await page.getByText('This exit was stopped because a save was in progress. Check its result before leaving.',{exact:true}).waitFor();
  const overlap = await page.evaluate(() => window.pendingFrameSave);
  assert(overlap?.pending && overlap.file==='late.txt', 'Scenario did not overlap the Frame response and pending save');
  // A successful save replaces the form itself; record whether the earlier GET
  // selected its no-op renderer, rather than racing the later save response.
  assert(await savingForm.evaluate(form=>form.querySelector('#title').value==='Edited during request'), 'Earlier Frame approval lost pending values');
  await page.getByText('Received late.txt (10 bytes). This demonstration does not keep attachments.',{exact:true}).waitFor();
  checks.push('A new pending save overrides an earlier Frame approval and retains its live controls/files');
  await title().fill('Save before leaving');
  await scenario('slow');
  await page.getByRole('button',{name:'Save brief',exact:true}).click();
  await page.getByRole('link',{name:'Workspace',exact:true}).click();
  await page.getByText('This exit was stopped because a save was in progress. Check its result before leaving.',{exact:true}).waitFor();
  assert(await page.getByRole('dialog').count()===0,'Pending save opened discard confirmation');
  await page.getByText('Changes saved.',{exact:true}).waitFor();
  assert(await page.locator('#files').evaluate(input=>input.files.length)===0,'Acknowledged upload not cleared');
  await title().fill('Other-form exit');
  await page.getByRole('button',{name:'Search projects'}).click(); await keep();
  assert(await title().inputValue()==='Other-form exit','Other form lost draft');
  await page.getByRole('button',{name:'Search projects'}).click(); await leave();
  await page.getByRole('heading',{name:'Workspace',exact:true}).waitFor();
  assert(await page.getByRole('heading',{name:'Save before leaving',exact:true}).count()===1, 'Workspace did not reflect the saved project name');
  checks.push('Pending-save exits wait for outcome; acknowledged upload clears; other-form exit confirms once');

  await page.getByRole('link',{name:'Edit project brief'}).click();
  await title().fill('Brief remains open');
  await page.locator('#reminder-text').fill('Review tomorrow');
  await page.getByRole('button',{name:'Save reminder in this browser'}).click();
  await page.getByText('Saved in this browser.',{exact:true}).waitFor();
  assert(await page.getByRole('dialog').count()===0,'In-place reminder save prompted for unrelated brief');
  await page.getByRole('link',{name:'Workspace',exact:true}).click();
  await leave();
  await page.getByRole('heading',{name:'Workspace',exact:true}).waitFor();
  await page.getByRole('link',{name:'Edit project brief'}).click();
  assert(await page.locator('#reminder-text').inputValue()==='Review tomorrow','Saved local reminder not restored');
  assert(await page.getByRole('dialog').count()===0,'Retained reminder prompted');
  checks.push('Application-owned browser retention restores saved reminder without prompts');
  // Native close/reload uses a browser dialog; dispatching checks registration
  // without closing the test browser or depending on browser dialog wording.
  await title().fill('Unload draft');
  assert(await page.evaluate(()=>{const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;}),'Dirty unload not protected');
  await page.getByRole('link',{name:'Workspace',exact:true}).click(); await leave();
  await page.getByRole('heading',{name:'Workspace',exact:true}).waitFor();
  assert(!await page.evaluate(()=>{const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;}),'Pristine unload prompted');
  assert(errors.length===0, errors.join('\n'));
  checks.push('Native unload listener follows actual draft state; no runtime errors');

  await page.goto(origin + '/draft-protection/workbench?transport=native');
  await title().fill('Native Frame draft');
  await page.locator('#files').setInputFiles({name:'native.txt',mimeType:'text/plain',buffer:Buffer.from('native')});

  await scenario('fail');
  await page.getByRole('button',{name:'Save brief',exact:true}).click();
  await page.getByText('Your text is retained. Choose your files again.',{exact:true}).waitFor();
  assert(await title().inputValue()==='Native Frame draft','Native failed save lost text');
  assert(await page.locator('#files').evaluate(input=>input.files.length)===0,'Native response falsely retained file');
  assert(await page.getByRole('dialog').count()===0,'Own native save prompted');

  await scenario('ok');
  await page.locator('#files').setInputFiles({name:'native.txt',mimeType:'text/plain',buffer:Buffer.from('native')});
  await page.getByRole('button',{name:'Save brief',exact:true}).click();
  await page.getByText('Project brief saved.',{exact:true}).waitFor();
  await page.getByText('Received native.txt (6 bytes). This demonstration does not keep attachments.',{exact:true}).waitFor();
  assert(await page.locator('#brief').getAttribute('data-transport')==='native' && await page.locator('#brief').getAttribute('data-draft-submit')===null, 'A native save silently switched to in-place transport');
  assert(await page.locator('#brief').getAttribute('data-state')==='saved', 'Saved multiline text was treated as edited');
  await page.getByRole('link',{name:'Reload brief',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#brief')?.dataset.state==='unchanged');
  assert(await page.locator('#brief').getAttribute('data-transport')==='native', 'Review reload silently switched transport');
  await title().fill('Second native Frame save');
  await scenario('fail');
  await page.getByRole('button',{name:'Save brief',exact:true}).click();
  await page.getByText('The service is unavailable. Your changes have not been saved. Try again.',{exact:true}).waitFor();
  assert(await title().inputValue()==='Second native Frame save', 'Repeated native failure lost text');
  await scenario('ok');
  await page.getByRole('button',{name:'Save brief',exact:true}).click();
  await page.getByText('Project brief saved.',{exact:true}).waitFor();
  checks.push('Own Turbo Frame saves remain native across retry; text/reselection and actual received-file results are honest');

  await page.goto(origin + '/draft-protection/workbench?transport=native&drive=off');
  await title().fill('Native browser save');
  await page.getByRole('button',{name:'Save brief',exact:true}).click();
  await page.getByText('Project brief saved.',{exact:true}).waitFor();
  assert(await title().inputValue()==='Native browser save','Native browser save failed');
  assert(new URL(page.url()).searchParams.get('drive')==='off' && await page.locator('#brief').getAttribute('data-turbo')==='false', 'Full native save silently enabled Turbo');
  checks.push('Native submission with JavaScript sends its own draft without an unload warning');

  const native = await page.context().browser().newContext({javaScriptEnabled:false});
  const fallback = await native.newPage();
  await fallback.goto(origin + '/draft-protection/workbench?transport=native');
  await fallback.locator('#title').fill('Native saved brief');
  const savedNotes = 'Confirm ownership.\n\nAgree the handover: <owner> & <next action>.';
  await fallback.locator('#notes').fill(savedNotes);
  await fallback.locator('#files').setInputFiles({name:'plain.txt',mimeType:'text/plain',buffer:Buffer.from('x')});
  await fallback.getByRole('button',{name:'Save brief',exact:true}).click();
  await fallback.getByText('Project brief saved.',{exact:true}).waitFor();
  await fallback.getByText('Received plain.txt (1 byte). This demonstration does not keep attachments.',{exact:true}).waitFor();
  assert(await fallback.locator('#title').inputValue()==='Native saved brief','Native form did not save');
  assert(await fallback.locator('#notes').inputValue()===savedNotes, 'Native save changed logical textarea lines');
  assert(await fallback.locator('[data-browser-reminder]').isHidden(), 'Unenhanced reminder exposed an unsaved storage promise');
  await fallback.getByRole('link',{name:'Workspace',exact:true}).click();
  await fallback.getByRole('heading',{name:'Native saved brief',exact:true}).waitFor();
  assert((await fallback.locator('.formatted-content').innerText()).includes('Agree the handover: <owner> & <next action>.'), 'Workspace lost or interpreted the saved plain-text brief');
  await native.close();
  checks.push('Native multipart/server-rendered save works without JavaScript');
  return {passed:true,checks};
  } catch (error) { throw new Error(JSON.stringify({checks,url:page.url(),errors,content:await page.locator('main').innerText(),error:error.message})); }
}
