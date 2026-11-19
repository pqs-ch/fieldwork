async page => {
  page.setDefaultTimeout(10000);
  const origin=__ORIGIN__, checks=[], errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const assert=(value,message)=>{if(!value)throw new Error(message);};
  const button=name=>page.getByRole('button',{name,exact:true});
  const heading=name=>page.getByRole('heading',{name,exact:true});
  const sampleResponse=await page.request.get(origin+'/file-import/imports/sample');
  const sample=await sampleResponse.text();
  const file=(name,contents)=>({name,mimeType:'text/csv',buffer:Buffer.from(contents)});
  const choose=async(contents,name='suppliers.csv')=>page.locator('#source').setInputFiles(file(name,contents));
  const upload=async(contents,name='suppliers.csv')=>{
    await page.goto(origin+'/file-import/imports/new');await choose(contents,name);
    await button('Upload and map columns').click();await heading('Map supplier columns').waitFor();
    await page.waitForURL('**/imports/*/mapping');
  };
  const validate=async()=>{await button('Validate rows').click();await heading('Check supplier rows').waitFor();await page.waitForURL('**/imports/*/review');};
  const failNext=async()=>{
    await page.getByRole('link',{name:'Review scenarios',exact:true}).click();
    await heading('Supplier import review scenarios').waitFor();
    await button('Fail one ready row once').click();
    await page.getByText('The next import will fail once. All-or-nothing will roll back; valid-rows-only can keep other successes.',{exact:true}).waitFor();
  };
  try {
    await page.goto(origin+'/file-import/imports/new');
    const csrf=await page.locator('input[name="authenticity_token"]').inputValue();
    for (const [contents,expected] of [
      [Buffer.from('A,B\nx\n'),'Every row must have the same number of cells'],
      [Buffer.from([0xff,0x00]),'Use UTF-8 text without binary content.'],
      [Buffer.alloc(100001,65),'The file exceeds 100 KB.']
    ]) {
      const rejected=await page.request.post(origin+'/file-import/imports',{multipart:{authenticity_token:csrf,source:{name:'rejected.csv',mimeType:'text/csv',buffer:contents}},headers:{Accept:'application/json'}});
      assert(rejected.status()===422 && (await rejected.json()).message.startsWith(expected),'Unsafe or ambiguous source was accepted: '+expected);
    }
    checks.push('Ragged records, invalid encoding/binary content and oversized sources are rejected before acceptance');
    await choose('Name,Ref\n"Unclosed,SUP-100');
    await button('Upload and map columns').click();
    await page.getByText('The CSV could not be read. Check separators, closing quotes and line endings, then try again.',{exact:true}).waitFor();
    assert(await page.locator('#source').evaluate(input=>input.files.length)===1,'Failed upload lost File');
    await page.getByRole('link',{name:'Supplier imports',exact:true}).click();
    await page.getByRole('button',{name:'Keep editing',exact:true}).click();
    assert(await page.locator('#source').evaluate(input=>input.files[0].name)==='suppliers.csv','Keep editing lost selected CSV');
    const transfer=await page.evaluateHandle(text=>{const data=new DataTransfer();data.items.add(new File([text],'sample.csv',{type:'text/csv'}));return data;},sample);
    await page.locator('[data-file-dropzone]').dispatchEvent('drop',{dataTransfer:transfer});await transfer.dispose();
    assert(await page.locator('#source').evaluate(input=>input.files[0].name)==='sample.csv','Dropped file did not replace single-file queue');
    await button('Upload and map columns').click();await heading('Map supplier columns').waitFor();
    await page.waitForURL('**/imports/*/mapping');
    const mappingURL=page.url();
    assert(await page.locator('#column-reference').inputValue()==='0','Suggested reference mapping missing');
    assert(await page.locator('#column-name').inputValue()==='1','Suggested name mapping missing');
    await page.locator('#column-name').selectOption('0');
    await button('Validate rows').click();
    await page.locator('#column-name-error').filter({hasText:'Map each source column only once.'}).waitFor();
    assert(await page.locator('#column-name').inputValue()==='0','Invalid mapping attempt lost');
    assert(await page.locator('[data-form-error-summary]').evaluate(el=>el===document.activeElement), 'Rejected mapping did not focus its field summary');
    assert(await page.locator('#column-reference').getAttribute('aria-invalid')==='true' && await page.locator('#column-name').getAttribute('aria-invalid')==='true', 'Repeated source columns did not identify both affected assignments');
    await page.locator('[data-form-error-list]').getByRole('link',{name:/^Supplier name:/}).focus();
    await page.keyboard.press('Enter');
    assert(await page.locator('#column-name').evaluate(el=>el===document.activeElement), 'Mapping error link did not focus its select');
    await page.locator('#column-name').selectOption('1');
    await validate();
    const reviewURL=page.url(), batchId=new URL(reviewURL).pathname.split('/')[3];
    assert(await page.locator('tbody tr').count()===6,'Validation omitted rows');
    assert(await page.locator('#row-3').innerText().then(text=>text.includes('Supplier name is required')),'Missing name not tied to source row');
    assert(await page.locator('#row-5').innerText().then(text=>text.includes('Repeated reference')),'In-file duplicate policy missing');
    assert(await page.locator('#row-4').innerText().then(text=>text.includes('already exists')),'Existing reference not skipped');
    await page.getByRole('link',{name:/^Row 3:/}).click();
    assert(await page.locator('#row-3').evaluate(node=>node===document.activeElement),'Row error link did not focus row');
    await button('Import 2 ready rows').click();
    await page.getByText('No rows were imported. Correct invalid rows or explicitly choose valid rows only. At least one ready row is required.',{exact:true}).waitFor();
    checks.push('Failed upload retains File; drop replaces source; mapping validates; row errors, duplicates and strict-policy blocking are explicit');

    // An older check page must not import using a newer saved mapping.
    const oldReview=await page.context().newPage();await oldReview.goto(reviewURL);
    await page.getByRole('link',{name:'Change mapping',exact:true}).click();
    await heading('Map supplier columns').waitFor();
    await page.waitForURL('**/imports/*/mapping');
    const oldMapping=await page.context().newPage();await oldMapping.goto(mappingURL);
    await validate();
    await oldReview.getByRole('button',{name:'Import 2 ready rows',exact:true}).click();
    await oldReview.getByRole('heading',{name:'Check the updated import',exact:true}).waitFor();
    await oldMapping.getByRole('button',{name:'Validate rows',exact:true}).click();
    await oldMapping.getByRole('heading',{name:'Check the updated import',exact:true}).waitFor();
    await oldReview.close();await oldMapping.close();
    checks.push('Stale mapping and reviewed revisions cannot overwrite or execute newer state');

    await failNext();
    await page.locator('[name="policy"]').selectOption('valid');
    const confirmation=await page.locator('#confirm-import').evaluate(form=>({...Object.fromEntries(new FormData(form)),policy:'valid'}));
    await button('Import 2 ready rows').click();await heading('Supplier import result').waitFor();
    await page.waitForURL('**/imports/'+batchId);
    assert(await page.locator('#row-2').innerText().then(text=>text.includes('Unsuccessful')),'Temporary failed row not identified');
    assert(await page.locator('#row-7').innerText().then(text=>text.includes('Imported')),'Partial success not preserved');
    const retryForm=await page.locator('form').filter({has:page.getByRole('button',{name:'Retry 1 unsuccessful row',exact:true})}).evaluate(form=>Object.fromEntries(new FormData(form)));
    await button('Retry 1 unsuccessful row').click();
    await page.getByText('2 suppliers added. 0 rows unsuccessful. 2 excluded; 2 skipped.',{exact:true}).waitFor();
    assert(await page.locator('#row-2').innerText().then(text=>text.includes('Imported')),'Retry did not recover unsuccessful row');
    const replay=await page.request.post(origin+'/file-import/imports/'+batchId+'/execute',{form:confirmation});
    assert(replay.ok(),'Repeated confirmation did not reconcile result');
    await page.request.post(origin+'/file-import/imports/'+batchId+'/retry_failed',{form:retryForm});
    await page.getByRole('link',{name:'View supplier register',exact:true}).click();
    await heading('Supplier imports').waitFor();
    assert(await page.getByRole('region',{name:'Supplier register',exact:true}).locator('tbody tr').count()===3,'Replay duplicated imported suppliers');
    checks.push('Valid-only operation preserves successes; retries server-confirmed failures once; confirmation/retry replay creates no duplicates');

    // A second batch can change the register after validation of the first.
    const freshCSV='Ref,Name,Email\nSUP-210,Current register change,owner@example.test\n';
    await upload(freshCSV,'first.csv');
    // Unrecognized Ref header needs an explicit choice.
    await page.locator('#column-reference').selectOption('0');await validate();
    const firstReviewURL=page.url();
    await upload(freshCSV,'second.csv');await page.locator('#column-reference').selectOption('0');await validate();
    await button('Import 1 ready row').click();await heading('Supplier import result').waitFor();
    await page.goto(firstReviewURL);await heading('Check supplier rows').waitFor();
    await button('Import 1 ready row').click();
    await page.getByText('The supplier register changed since validation. No rows were imported. Check the updated validation results before confirming.',{exact:true}).waitFor();
    checks.push('Concurrent register changes invalidate validation before any rows are added');

    const atomicCSV='\uFEFFReference,Name,Email\nSUP-301,"Atomic\nOne",one@example.test\nSUP-302,Atomic Two,two@example.test\n';
    await upload(atomicCSV,'atomic.csv');await validate();
    assert(await page.locator('#row-3').innerText().then(text=>text.includes('Atomic Two')) && await page.locator('tbody tr').count()===2,'BOM/quoted multiline source changed row identities');
    await failNext();
    await button('Import 2 ready rows').click();await heading('Supplier import result').waitFor();
    await page.getByText('0 suppliers added. 2 rows unsuccessful. 0 excluded; 0 skipped.',{exact:true}).waitFor();
    await button('Retry 2 unsuccessful rows').click();
    await page.getByText('2 suppliers added. 0 rows unsuccessful. 0 excluded; 0 skipped.',{exact:true}).waitFor();
    checks.push('All-or-nothing failure adds no suppliers; retry commits the complete eligible batch');

    const nativeContext=await page.context().browser().newContext({javaScriptEnabled:false});const native=await nativeContext.newPage();
    const inaccessible=await native.goto(origin+'/file-import/imports/'+batchId);
    assert(inaccessible.status()===410,'Another session could access the retained source/result');
    await native.goto(origin+'/file-import/imports/new');
    await native.locator('#source').setInputFiles(file('bad.csv','A,A\none,two\n'));
    await native.getByRole('button',{name:'Upload and map columns',exact:true}).click();
    await native.getByText('Choose a corrected CSV to try again. Your previous file was not accepted.',{exact:true}).waitFor();
    await native.locator('#source').setInputFiles(file('native.csv','Reference,Name,Email\nSUP-401,Native supplier,native@example.test\n'));
    await native.getByRole('button',{name:'Upload and map columns',exact:true}).click();
    await native.locator('#column-name').selectOption('0');
    await native.getByRole('button',{name:'Validate rows',exact:true}).click();
    assert(await native.locator('[data-form-error-summary]').isVisible() && await native.locator('#column-name').inputValue()==='0', 'Native mapping rejection lost the attempted assignment or summary');
    await native.locator('[data-form-error-list]').getByRole('link',{name:/^Supplier name:/}).click();
    assert(await native.locator('#column-name').evaluate(el=>el===document.activeElement), 'Native mapping error link did not focus its select');
    await native.locator('#column-name').selectOption('1');
    await native.getByRole('button',{name:'Validate rows',exact:true}).click();
    await native.getByRole('button',{name:'Import 1 ready row',exact:true}).click();
    await native.getByText('1 supplier added. 0 rows unsuccessful. 0 excluded; 0 skipped.',{exact:true}).waitFor();await nativeContext.close();
    assert(errors.length===0,errors.join('\n'));
    checks.push('Sources/results are session-isolated; native upload rejection explains reselection; mapping and import work without JavaScript');
    return {passed:true,checks};
  }catch(error){throw new Error(JSON.stringify({checks,url:page.url(),errors,content:await page.locator('main').innerText(),error:error.message}));}
}
