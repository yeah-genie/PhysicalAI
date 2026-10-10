const {chromium} = require('C:/Users/yejin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({
    executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true,
    args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']
  });
  try {
    fs.mkdirSync('site-preview',{recursive:true});
    const page = await browser.newPage({reducedMotion:'reduce'});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = process.env.SITE_URL || 'http://127.0.0.1:8000';
    const sceneIDs = ['question','agenda','section-method','approach','protocol','section-results','results','budget','section-analysis','shift','section-next','lessons'];
    const models = ['XGBoost','Edge-MLP','GIN','PNA'];
    const ap = ['17.83%','17.62%','40.71%','55.59%'];
    const alerts = ['1,278','3,525','2,533','1,561'];
    const detected = [288,287,529,701];
    async function scene(id) {
      if (await page.evaluate(() => document.documentElement.classList.contains('presentation'))) {
        await page.locator(`.chapter-nav a[href="#${id}"]`).click();
        await page.waitForFunction(id => document.getElementById(id).classList.contains('is-active'), id);
      } else {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      }
    }
    for (const [width,height] of [[1440,900],[1180,660],[1440,500],[980,620],[390,844],[320,568]]) {
      await page.setViewportSize({width,height});
      for (const file of ['index.html','aml.html','robotics.html']) {
        await page.goto(`${base}/${file}`);
        await page.evaluate(() => document.fonts.ready);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${file} overflows at ${width}`);
        if (file === 'index.html') continue;
        const count = file === 'aml.html' ? 12 : 3;
        assert.equal(await page.locator('.slide').count(), count);
        const presentation = file === 'aml.html' || (width >= 1180 && height >= 660);
        assert.equal(await page.evaluate(() => document.documentElement.classList.contains('presentation')), presentation);
        if (file === 'aml.html') {
          assert.deepEqual(await page.locator('.slide').evaluateAll(els => els.map(el => el.id)), sceneIDs);
          if (presentation) {
            await page.waitForFunction(() => document.body.classList.contains('has-network'));
            assert.equal(await page.locator('#network-stage canvas').count(), 1);
            const graphic = await page.locator('#network-stage canvas').boundingBox();
            const frame = await page.locator('#deck-frame').boundingBox();
            assert.ok(graphic.width > frame.width * .55 && graphic.height > frame.height * .8, '3D must dominate the presentation stage');
          } else {
            assert.equal(await page.locator('#network-stage canvas').count(), 0);
            assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').some(r => r.name.includes('/vendor/three/'))), false, 'Reading/mobile mode must not load Three.js');
            assert.ok(await page.locator('.scene-map img').first().isVisible());
            assert.ok(await page.locator('.scene-map img').first().evaluate(el => el.complete && el.naturalWidth > 0));
          }
        }
        if (presentation) {
          const box = await page.locator('#deck-frame').boundingBox();
          const scale = box.width / 1280;
          assert.ok(Math.abs(box.width / box.height - 16 / 9) < .01);
          for (let i = 0; i < count; i++) {
            await page.locator('.chapter-nav a').nth(i).click();
            await page.waitForFunction(i => document.querySelectorAll('.slide')[i].classList.contains('is-active'), i);
            const copy = await page.locator('.slide-content').nth(i).boundingBox();
            assert.ok(copy.y >= box.y + 68*scale - 1 && copy.y + copy.height <= box.y + 662*scale + 1, `${file} slide ${i} clipped: ${JSON.stringify(copy)}`);
            assert.ok(copy.x >= box.x - 1 && copy.x + copy.width <= box.x + box.width + 1, `${file} slide ${i} exceeds frame width`);
          }
        } else {
          assert.ok(await page.locator('.lead').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize)) >= 18);
          assert.ok(await page.locator('.source,.note').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize)) >= 14);
        }
        assert.equal(await page.locator('.motion-toggle').getAttribute('aria-pressed'), 'true');
        await page.locator('.motion-toggle').click();
        assert.equal(await page.locator('.motion-toggle').getAttribute('aria-pressed'), 'false');
        await page.locator('.motion-toggle').click();
        assert.ok(await page.evaluate(() => document.body.classList.contains('motion-reduced')));
        if (file === 'aml.html') {
          assert.equal(await page.locator('.results-table tbody tr').count(), 4);
          assert.equal(await page.locator('.budget-row').count(), 4);
          for (let i = 0; i < models.length; i++) {
            const row = await page.locator('.results-table tbody tr').nth(i).innerText();
            assert.ok(row.includes(models[i]) && row.includes(ap[i]) && row.includes(alerts[i]), `Paper result differs for ${models[i]}`);
            const budget = page.locator('.budget-row').nth(i);
            assert.ok((await budget.innerText()).includes(String(detected[i])));
            const width = await budget.locator('.budget-fill').evaluate(el => parseFloat(el.style.getPropertyValue('--value')));
            assert.ok(Math.abs(width - detected[i] / 864 * 100) < .001);
          }
          await scene('shift');
          for (const [period,trades,rate,scores] of [
            ['late','1,108','59.12%',['97.23%','97.35%','93.05%','90.04%']],
            ['early','862,792','0.11%',['7.69%','7.47%','23.60%','34.06%']]
          ]) {
            const button = page.locator(`[data-period="${period}"]`);
            await button.click();
            assert.equal(await button.getAttribute('aria-pressed'), 'true');
            const summary = await page.locator('#period-summary').innerText();
            assert.ok(summary.includes(trades) && summary.includes(rate));
            assert.deepEqual(await page.locator('#period-chart .period-row > strong').allTextContents(), scores);
            assert.equal(await page.locator('#period-chart .period-row.best').count(), 1);
          }
          await scene('results');
          await page.screenshot({path:`site-preview/aml-${width}x${height}.png`});
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
          await page.locator('#theta1').fill('35'); await page.locator('#theta2').fill('70');
        }
      }
    }
    await page.setViewportSize({width:1440,height:900});
    await page.goto(base+'/aml.html');
    await page.waitForFunction(() => document.body.classList.contains('has-network'));
    await page.screenshot({path:'site-preview/aml-cover.png'});
    const coverGraphic = await page.locator('#network-stage canvas').screenshot();
    await page.locator('#main').focus();
    for (const id of ['agenda','section-method','approach']) {
      await page.keyboard.press('ArrowDown');
      await page.waitForFunction(id => document.getElementById(id).classList.contains('is-active'), id);
    }
    await page.waitForFunction(() => document.querySelector('#network-stage').dataset.scene === '1');
    const approachGraphic = await page.locator('#network-stage canvas').screenshot();
    assert.notDeepEqual(coverGraphic, approachGraphic, 'Scene navigation must transform the persistent network');
    assert.ok(coverGraphic.length > 8000 && approachGraphic.length > 8000, 'Network canvas should render more than an empty background');
    await page.keyboard.press('End');
    await page.waitForFunction(() => document.querySelector('#lessons').classList.contains('is-active'));
    assert.equal(await page.locator('.next-slide').isDisabled(), true);
    await page.keyboard.press('Home');
    await page.waitForFunction(() => document.querySelector('#question').classList.contains('is-active'));
    assert.equal(await page.locator('.previous-slide').isDisabled(), true);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.waitForFunction(() => document.querySelector('.motion-toggle').getAttribute('aria-pressed') === 'false');
    assert.equal(await page.locator('.motion-toggle').getAttribute('aria-pressed'), 'false');
    await page.locator('#main').focus();
    await page.keyboard.press('PageDown');
    await page.waitForFunction(() => document.querySelector('#agenda').classList.contains('is-active'));
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(() => document.querySelector('.motion-toggle').getAttribute('aria-pressed') === 'true');
    await scene('results');
    await page.screenshot({path:'site-preview/aml-results.png'});
    await page.setViewportSize({width:1440,height:500});
    await page.waitForFunction(() => document.documentElement.classList.contains('presentation'));
    assert.ok(await page.locator('#results').evaluate(el => el.getBoundingClientRect().top) >= -1);
    assert.equal(await page.locator('#network-stage').isVisible(), true);
    await page.screenshot({path:'site-preview/aml-short-window.png'});
    await page.setViewportSize({width:1440,height:900});
    await page.goto(base+'/robotics.html#demo');
    await page.waitForFunction(() => document.querySelector('#demo').classList.contains('is-active'));
    await page.screenshot({path:'site-preview/robot-demo.png'});
    await page.goto(base+'/index.html'); await page.screenshot({path:'site-preview/home.png'});
    await page.setViewportSize({width:390,height:844}); await page.goto(base+'/aml.html#results');
    assert.ok(await page.locator('#results').evaluate(el => el.classList.contains('is-active')));
    await page.screenshot({path:'site-preview/aml-mobile.png'});

    const noJS = await browser.newPage({javaScriptEnabled:false, viewport:{width:390,height:844}});
    await noJS.goto(base+'/aml.html');
    assert.equal(await noJS.locator('.slide').count(), 12);
    assert.equal(await noJS.locator('.results-table tbody tr').count(), 4);
    assert.equal(await noJS.locator('.budget-row').count(), 4);
    assert.match(await noJS.locator('#period-summary').innerText(), /862,792/);
    assert.ok(await noJS.locator('#results').isVisible());
    assert.ok(await noJS.locator('.scene-map img').first().isVisible());
    await noJS.close();

    const fallback = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    fallback.on('pageerror', error => errors.push(error.message));
    await fallback.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type,...args) {
        return type.includes('webgl') ? null : original.call(this,type,...args);
      };
    });
    await fallback.goto(base+'/aml.html');
    await fallback.waitForLoadState('networkidle');
    assert.equal(await fallback.locator('#network-stage canvas').count(), 0);
    assert.ok(await fallback.locator('.scene-map svg').first().isVisible());
    assert.equal(await fallback.locator('.results-table tbody tr').count(), 4);
    await fallback.close();
    assert.deepEqual(errors,[]);
    console.log('PASS: 12/3 scenes; six responsive sizes; persistent 3D and proportional AML deck; paper results and period filters; 2R/C-space; keyboard, anchors, motion settings, no-JS and no-WebGL fallbacks; no JS errors');
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
