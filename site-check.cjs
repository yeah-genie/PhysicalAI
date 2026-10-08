const {chromium}=require('C:/Users/yejin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    fs.mkdirSync('site-preview',{recursive:true});
    const page=await browser.newPage({reducedMotion:'reduce'});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    for (const width of [1440,390,320]) {
      await page.setViewportSize({width,height:1000});
      for (const file of ['index.html','aml.html','robotics.html']) {
        await page.goto(`${process.env.SITE_URL || 'http://127.0.0.1:8000'}/${file}`);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${file} overflows at ${width}`);
        if (file==='aml.html') {
          await page.locator('#model').selectOption('xgboost');
          await page.locator('#result-summary').waitFor();
          assert.match(await page.locator('#result-summary').innerText(),/288건, 정상 라벨 576건/);
          assert.equal(await page.locator('#ap').innerText(),'17.83%');
          await page.locator('#model').selectOption('pna');
          assert.match(await page.locator('#result-summary').innerText(),/701건, 정상 라벨 163건/);
        }
        if (file==='index.html') {
          assert.ok(await page.locator('#graph circle').count()>30);
          assert.equal(await page.locator('.slide-dots button').count(),6);
          await page.locator('.slide-dots button').nth(2).click();
          await page.waitForFunction(()=>document.body.dataset.visual==='finance');
          const financeX=await page.locator('#graph circle').first().getAttribute('cx');
          await page.locator('.next-slide').click();
          await page.waitForFunction(()=>document.body.dataset.visual==='robotics');
          await page.waitForFunction(x=>document.querySelector('#graph circle').getAttribute('cx')!==x,financeX);
          assert.equal(await page.locator('.motion-toggle').getAttribute('aria-pressed'),'true');
          await page.locator('.motion-toggle').click();
          assert.equal(await page.locator('.motion-toggle').getAttribute('aria-pressed'),'false');
          await page.locator('.motion-toggle').click();
          await page.locator('.slide-dots button').first().click();
          await page.waitForFunction(()=>document.querySelector('.slide-name').textContent==='소개');
          if(width===1440)await page.screenshot({path:'site-preview/cover.png'});
        }
        await page.screenshot({path:`site-preview/${file.replace('.html','')}-${width}.png`,fullPage:true});
      }
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: 3 pages at 1440/390/320px, no overflow, model selection, graph, no JS errors');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

