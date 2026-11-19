async page => {
  page.setDefaultTimeout(10000);
  const origin=__ORIGIN__,checks=[],errors=[],aborted=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('requestfailed',request=>{if(request.url().includes('/purchase-request/suppliers/options'))aborted.push(request.url());});
  const assert=(value,message)=>{if(!value)throw new Error(message);};
  const ready=()=>page.waitForFunction(()=>document.querySelectorAll('[role="combobox"]').length===2);
  try {
    await page.goto(origin+'/purchase-request/suppliers');await ready();
    await page.locator('#supplier-lookup .searchable-selection-trigger').click();
    await page.getByRole('dialog',{name:'Choose Reference supplier',exact:true}).getByRole('combobox').fill('Alpine');
    await page.getByRole('option',{name:'Alpine Equipment',exact:true}).waitFor();
    await page.keyboard.press('Escape');
    const outside=await page.locator('[data-label="Independent supplier"] .searchable-selection-trigger').elementHandle();
    const original=await page.locator('#supplier-lookup').elementHandle();
    await page.locator('#keep-reference').check();
    await page.getByRole('link',{name:'Regional suppliers',exact:true}).click();await page.getByText('The response was kept from replacing the current lookup.',{exact:true}).waitFor();
    assert(await original.evaluate(node=>node.isConnected && node.querySelectorAll('.searchable-selection-trigger').length===1),'Canceled Frame destroyed live enhancement');
    await page.getByRole('link',{name:'All suppliers',exact:true}).click();await page.waitForFunction(node=>!node.isConnected,original);await ready();
    assert(await original.evaluate(node=>node.querySelector('.searchable-selection-trigger')===null),'Replaced Frame root did not clean up generated UI');
    assert(await outside.evaluate(node=>node.isConnected),'Unrelated root was remounted on Frame navigation');
    checks.push('Successful lookup; one mount per root; canceled Frame preserves live UI; actual replacement cleans only affected roots');

    const current=await page.locator('#supplier-lookup').elementHandle();
    const request=page.waitForRequest(request=>request.url().includes('/purchase-request/suppliers/options?q=Slow'));
    await page.locator('#supplier-lookup .searchable-selection-trigger').click();
    await page.getByRole('dialog',{name:'Choose Reference supplier',exact:true}).getByRole('combobox').fill('Slow');await request;
    await page.getByRole('link',{name:'Regional suppliers',exact:true}).click();await page.waitForFunction(node=>!node.isConnected,current);await ready();
    assert(await current.evaluate(node=>node.querySelector('.searchable-selection-trigger')===null),'Pending lookup root not destroyed');
    assert(aborted.some(url=>url.includes('q=Slow')),'Removed lookup transport was not aborted');
    const beforeStream=await page.locator('#supplier-lookup').elementHandle();
    await page.getByRole('button',{name:'Refresh supplier contacts',exact:true}).click();await page.waitForFunction(node=>!node.isConnected,beforeStream);await ready();
    assert(await outside.evaluate(node=>node.isConnected),'Stream replaced unrelated controller');
    assert(await beforeStream.evaluate(node=>node.querySelector('.searchable-selection-trigger')===null),'Stream replacement skipped cleanup');
    const retained=await page.locator('#supplier-lookup').elementHandle();
    const retainedTrigger=await page.locator('#supplier-lookup .searchable-selection-trigger').elementHandle();
    await page.getByRole('button',{name:'Update reference contents',exact:true}).click();
    await page.waitForFunction(node=>!node.isConnected,retainedTrigger);await ready();
    assert(await retained.evaluate(node=>node.isConnected && node===document.querySelector('#supplier-lookup')),'Stream update replaced a retained enhancement root');
    assert(await outside.evaluate(node=>node.isConnected),'Stream update rebuilt unrelated lookup');
    checks.push('Frame removal aborts pending remote lookup; Stream replacement/update settle with fresh UI and unrelated roots intact');

    const html=await (await page.request.get(origin+'/purchase-request/suppliers')).text();
    const old=await page.locator('#supplier-lookup').elementHandle();
    await page.evaluate(html=>{const fresh=new DOMParser().parseFromString(html,'text/html').querySelector('#supplier-lookup');document.querySelector('#supplier-lookup').replaceWith(fresh);},html);await ready();
    assert(await old.evaluate(node=>node.querySelector('.searchable-selection-trigger')===null),'Direct removed root was not reaped');
    await page.getByRole('link',{name:'Purchase requests',exact:true}).click();await page.getByRole('heading',{name:'Purchase requests',exact:true}).waitFor();
    await page.evaluate(()=>history.back());await ready();
    assert(await page.locator('[data-searchable-selection]').count()===2,'Cache/history restoration duplicated enhancement roots');
    checks.push('Direct node replacement and Turbo cache/history return remount cleanly without duplicate generated UI');

    const controls=await page.evaluate(async()=>{
      const {installTurboElements}=await import('fieldwork/turbo-elements');
      const {purchaseEnhancements}=await import('purchase_request/purchase-enhancements');
      const stop=installTurboElements(purchaseEnhancements);
      const same=stop===installTurboElements(purchaseEnhancements);stop();
      const native=document.querySelectorAll('[role="combobox"]').length===0 && !document.querySelector('#reference-supplier').hidden;
      const stopAgain=installTurboElements(purchaseEnhancements);stop();
      const active=document.querySelectorAll('[role="combobox"]').length===2;
      const sameNew=stopAgain===installTurboElements(purchaseEnhancements);
      return {same,native,active,sameNew};
    });
    assert(Object.values(controls).every(Boolean),'Uninstall/idempotence/reinstall broke native control ownership: '+JSON.stringify(controls));
    const owners = await page.evaluate(async () => {
      const { installTurboEditing } = await import('fieldwork/turbo');
      const { installTurboDraftProtection } = await import('fieldwork/turbo-drafts');
      return [installTurboEditing, installTurboDraftProtection].map(install => {
        const options = { transitions: ['visit', 'history', 'unload'] };
        const old = install(options);
        old();
        const current = install(options);
        old();
        return current === install(options);
      });
    });
    assert(owners.every(Boolean), 'Old form/draft cleanup disabled the new installer owner');
    checks.push('Repeated form/draft cleanup cannot clear a newer installation');
    assert(errors.length===0,errors.join('\n'));
    checks.push('Installer/uninstaller are idempotent; native controls restore; reinstall mounts once and old cleanup cannot disable the new owner');
    return {passed:true,checks};
  }catch(error){throw new Error(JSON.stringify({checks,url:page.url(),errors,content:await page.locator('main').innerText(),error:error.message}));}
}
