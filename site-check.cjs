const {chromium}=require('C:/Users/yejin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  fs.mkdirSync('site-preview',{recursive:true});
  const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.SITE_URL||'http://127.0.0.1:8000';
  for(const [width,height] of [[1440,900],[980,620],[390,844],[320,568]]){
   await page.setViewportSize({width,height});
   for(const file of ['index.html','aml.html','robotics.html']){
    await page.goto(`${base}/${file}`);
    await page.locator('.motion-toggle').waitFor({state:'attached'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${file} overflows at ${width}`);
    if(file!=='index.html'){
     const count=file==='aml.html'?7:5;
     assert.equal(await page.locator('.slide').count(),count);
     if(width>700){
      const box=await page.locator('#deck-frame').boundingBox();
      assert.ok(Math.abs(box.width/box.height-16/9)<.01);
      assert.ok(box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=height+1);
      for(let i=0;i<count;i++){
       await page.locator('.rail-button').nth(i).click();
       await page.waitForFunction(i=>document.querySelectorAll('.slide')[i].classList.contains('is-active'),i);
       const copy=await page.locator('.slide').nth(i).locator('.slide-copy').boundingBox();
       assert.ok(copy.y>=box.y-1&&copy.y+copy.height<=box.y+box.height-35,`slide ${i} is clipped: ${JSON.stringify(copy)} frame ${JSON.stringify(box)}`);
      }
     }
     assert.equal(await page.locator('.motion-toggle').getAttribute('aria-pressed'),'true');
     await page.locator('.motion-toggle').click();
     assert.equal(await page.locator('.motion-toggle').getAttribute('aria-pressed'),'false');
     await page.locator('.motion-toggle').click();
    }
    if(file==='aml.html'){
     await page.locator('#model').selectOption('xgboost');
     assert.match(await page.locator('#result-summary').innerText(),/288건, 정상 라벨 576건/);
     assert.equal(await page.locator('#ap').innerText(),'17.83%');
     assert.equal(await page.locator('.visual-slot .result-dot:not(.normal)').count(),288);
     await page.locator('#model').selectOption('pna');
     assert.equal(await page.locator('.visual-slot .result-dot:not(.normal)').count(),701);
     assert.equal(await page.locator('.visual-slot .result-dot.normal').count(),163);
     const rel=page.locator('.slide[data-scene=neighborhood] .visual-slot .graph-edge');
     const before=await rel.count();
     await page.locator('#relation-toggle').click();
     assert.equal(await rel.count(),1);
     await page.locator('#relation-toggle').click();assert.equal(await rel.count(),before);
    }
    if(file==='robotics.html'){
     await page.locator('#theta1').fill('0');await page.locator('#theta2').fill('0');
     assert.equal(await page.locator('#theta1-value').innerText(),'0°');
     assert.match(await page.locator('.visual-slot .visual').first().innerText(),/x = 2.00 · y = 0.00/);
     await page.locator('#wrap-demo').click();
     assert.match(await page.locator('#wrap-result').innerText(),/θ₁ = 360°/);
    }
    if(width===1440&&file!=='index.html'){
     await page.locator('.rail-button').first().click();
     await page.waitForFunction(()=>document.querySelector('.slide').classList.contains('is-active'));
    }
    await page.screenshot({path:`site-preview/${file.replace('.html','')}-${width}.png`,fullPage:width<=700});
   }
  }
  await page.setViewportSize({width:1440,height:900});await page.goto(base+'/aml.html');
  await page.locator('#main').focus();await page.keyboard.press('ArrowDown');
  await page.waitForFunction(()=>document.querySelector('.slide-name').textContent==='문제');
  await page.keyboard.press('End');await page.waitForFunction(()=>document.querySelector('.slide-name').textContent==='다음 실험');
  await page.locator('.rail-button').nth(4).click();await page.waitForFunction(()=>document.body.dataset.scene==='results');
  await page.screenshot({path:'site-preview/aml-results.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: 16:9 deck bounds and all slides; 390/320px mobile; model counts; graph toggle; 2R controls; keyboard; reduced motion; no JS errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});


