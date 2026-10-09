const {chromium} = require('C:/Users/yejin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    fs.mkdirSync('site-preview',{recursive:true});
    const page = await browser.newPage({reducedMotion:'reduce'});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = process.env.SITE_URL || 'http://127.0.0.1:8000';
    for (const [width,height] of [[1440,900],[1180,660],[1440,500],[980,620],[390,844],[320,568]]) {
      await page.setViewportSize({width,height});
      for (const file of ['index.html','aml.html','robotics.html']) {
        await page.goto(`${base}/${file}`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${file} overflows at ${width}`);
        if (file === 'index.html') continue;
        const count = file === 'aml.html' ? 4 : 3;
        assert.equal(await page.locator('.slide').count(), count);
        const presentation = width >= 1180 && height >= 660;
        assert.equal(await page.evaluate(() => document.documentElement.classList.contains('presentation')), presentation);
        if (presentation) {
          const box = await page.locator('#deck-frame').boundingBox();
          const scale = box.width / 1280;
          assert.ok(Math.abs(box.width / box.height - 16 / 9) < .01);
          for (let i = 0; i < count; i++) {
            await page.locator('.chapter-nav a').nth(i).click();
            await page.waitForFunction(i => document.querySelectorAll('.slide')[i].classList.contains('is-active'), i);
            const copy = await page.locator('.slide-content').nth(i).boundingBox();
            assert.ok(copy.y >= box.y + 68*scale - 1 && copy.y + copy.height <= box.y + 662*scale + 1, `${file} slide ${i} clipped: ${JSON.stringify(copy)}`);
          }
        } else {
          assert.ok(await page.locator('.lead').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize)) >= 18);
          assert.ok(await page.locator('.source,.note').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize)) >= 14);
        }
        assert.equal(await page.locator('.motion-toggle').getAttribute('aria-pressed'), 'true');
        await page.locator('.motion-toggle').click();
        assert.equal(await page.locator('.motion-toggle').getAttribute('aria-pressed'), 'false');
        await page.locator('.motion-toggle').click();
        if (file === 'aml.html') {
          assert.equal(await page.locator('.results-table tbody tr').count(), 4);
          assert.match(await page.locator('.results-table').innerText(), /55.59%/);
          assert.match(await page.locator('.results-table').innerText(), /701건/);
          assert.equal(await page.locator('select,.result-dot,.stage').count(), 0);
          assert.equal(await page.locator('.relation-figure svg').count(), 1);
        } else {
          await page.locator('#theta1').fill('0');
          await page.locator('#theta2').fill('0');
          assert.equal(await page.locator('#tip-position').innerText(), 'x = 2.00, y = 0.00');
          const p0 = await page.locator('#tip').evaluate(el => [Number(el.getAttribute('cx')), Number(el.getAttribute('cy'))]);
          assert.equal(await page.locator('#configuration-point').getAttribute('cx'), '60');
          await page.locator('#theta1').fill('360');
          assert.equal(await page.locator('#configuration-point').getAttribute('cx'), '380');
          const p360 = await page.locator('#tip').evaluate(el => [Number(el.getAttribute('cx')), Number(el.getAttribute('cy'))]);
          assert.ok(Math.hypot(p0[0]-p360[0],p0[1]-p360[1]) < 1e-10);
          await page.locator('#theta1').fill('270');
          const box = await page.locator('#arm-svg').evaluate(el => el.viewBox.baseVal.height);
          assert.ok(Number(await page.locator('#tip').getAttribute('cy')) < box);
          await page.locator('#theta1').fill('35');await page.locator('#theta2').fill('70');
        }
      }
    }
    await page.setViewportSize({width:1440,height:900});
    await page.goto(base+'/aml.html');await page.locator('#main').focus();
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(() => document.querySelector('#approach').classList.contains('is-active'));
    await page.keyboard.press('End');
    await page.waitForFunction(() => document.querySelector('#lessons').classList.contains('is-active'));
    await page.locator('.chapter-nav a').nth(2).click();
    await page.waitForFunction(() => document.querySelector('#results').classList.contains('is-active'));
    await page.screenshot({path:'site-preview/aml-results.png'});
    await page.setViewportSize({width:1440,height:500});
    await page.waitForFunction(() => !document.documentElement.classList.contains('presentation'));
    assert.ok(await page.locator('#results').evaluate(el => el.getBoundingClientRect().top) >= -1);
    await page.screenshot({path:'site-preview/aml-short-window.png'});
    await page.setViewportSize({width:1440,height:900});
    await page.goto(base+'/robotics.html#demo');
    await page.waitForFunction(() => document.querySelector('#demo').classList.contains('is-active'));
    await page.screenshot({path:'site-preview/robot-demo.png'});
    await page.goto(base+'/aml.html');await page.screenshot({path:'site-preview/aml-cover.png'});
    await page.goto(base+'/index.html');await page.screenshot({path:'site-preview/home.png'});
    await page.setViewportSize({width:390,height:844});await page.goto(base+'/aml.html#results');
    await page.screenshot({path:'site-preview/aml-mobile.png'});
    const noJS = await browser.newPage({javaScriptEnabled:false, viewport:{width:390,height:844}});
    await noJS.goto(base+'/aml.html');
    assert.equal(await noJS.locator('.results-table tbody tr').count(),4);
    assert.ok(await noJS.locator('#results').isVisible());
    await noJS.close();
    assert.deepEqual(errors,[]);
    console.log('PASS: 4/3 slides; 16:9 and short-window reading mode; 320/390px; all model results; linked 2R/C-space; keyboard, anchors, reduced motion, JS-free AML; no JS errors');
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
