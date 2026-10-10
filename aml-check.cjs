const {chromium}=require('C:/Users/yejin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const assert=require('node:assert/strict');
const url=process.env.SITE_URL||'http://127.0.0.1:8001';
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
const errors=[];const p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errors.push(e.message));await p.goto(url+'/aml.html');await p.waitForSelector('.has-network');await p.locator('.motion-toggle').click();
for(const viewport of [{width:1440,height:900},{width:960,height:540},{width:390,height:844}]){
await p.setViewportSize(viewport);for(const id of ['question','agenda','section-method','approach','protocol','section-results','results','budget','section-analysis','population','shift','formats','section-next','lessons']){await p.locator(`.chapter-nav a[href="#${id}"]`).click();await p.waitForTimeout(100);const bad=await p.locator('#'+id).evaluate(s=>{const f=document.querySelector('.deck-footer').getBoundingClientRect(),h=document.querySelector('.header').getBoundingClientRect();return [...s.querySelectorAll('.narrative,.evidence,.scene-caption,.agenda,.data-figure')].map(e=>({name:e.className,r:e.getBoundingClientRect()})).filter(({r})=>r.bottom>f.top+2||r.top<h.bottom-2).map(({name,r})=>({name,top:r.top,bottom:r.bottom,footer:f.top,header:h.bottom}));});assert.deepEqual(bad,[],`${viewport.width} ${id}: clipped content`);}assert.ok(await p.locator('html').evaluate(e=>e.classList.contains('presentation')));}
await p.setViewportSize({width:1440,height:900});await p.locator('a[href="#approach"]').click();for(const [hop,count] of [[0,1],[1,null],[2,42]]){await p.locator(`[data-hop="${hop}"]`).click();if(count)assert.match(await p.locator('#hop-readout').innerText(),new RegExp(count+'거래'));await p.waitForTimeout(60);assert.equal(await p.locator('#network-stage').getAttribute('data-hop'),String(hop));}
await p.screenshot({path:'site-preview/aml-final-approach.png'});
await p.locator('a[href="#protocol"]').click();await p.locator('#future-toggle').click();assert.equal(await p.locator('#future-toggle').getAttribute('aria-pressed'),'true');assert.match(await p.locator('#time-readout').innerText(),/6거래/);await p.waitForTimeout(60);assert.equal(await p.locator('#timeline-chart [data-point]').count(),48);await p.screenshot({path:'site-preview/aml-final-protocol.png'});
await p.locator('a[href="#shift"]').click();await p.locator('[data-period="late"]').click();assert.match(await p.locator('#period-summary').innerText(),/59.12%/);
await p.locator('a[href="#question"]').click();assert.equal(await p.locator('#hourly-chart [data-point]').count(),432);await p.locator('#hourly-chart [data-point]').first().click();assert.match(await p.locator('#hourly-chart-readout').innerText(),/344,208/);await p.screenshot({path:'site-preview/aml-final-cover.png'});
await p.locator('#hourly-chart [data-point]').first().focus();await p.keyboard.press('ArrowDown');assert.match(await p.locator('#hourly-chart-readout').innerText(),/2022-09-02 00/);assert.equal(await p.locator('#question').getAttribute('class'),'slide is-active');
await p.locator('a[href="#population"]').click();await p.locator('#daily-chart [data-point="10"]').click();assert.match(await p.locator('#daily-chart-readout').innerText(),/396건.*58.59%/);await p.screenshot({path:'site-preview/aml-final-population.png'});
await p.locator('a[href="#formats"]').click();await p.locator('#format-chart [aria-label^="ACH "]').click();assert.match(await p.locator('#format-chart-readout').innerText(),/600,797.*4,483/);await p.screenshot({path:'site-preview/aml-final-formats.png'});
await p.locator('a[href="#lessons"]').click();assert.equal(await p.locator('#network-stage').isVisible(),false);await p.screenshot({path:'site-preview/aml-final-lessons.png'});
await p.locator('a[href="#approach"]').click();await p.locator('#flow-play').click();assert.match(await p.locator('#flow-play').innerText(),/A001 → A002/);
await p.locator('.motion-toggle').click();await p.mouse.move(1100,350);await p.mouse.down();await p.mouse.move(1200,390,{steps:8});await p.mouse.up();await p.screenshot({path:'site-preview/aml-final-drag.png'});
await p.locator('.motion-toggle').click();
await p.locator('a[href="#agenda"]').click();await p.waitForFunction(()=>document.querySelector('#agenda').classList.contains('is-active'));
await p.locator('#agenda [data-slide-target="section-results"]').click();await p.waitForFunction(()=>document.querySelector('#section-results').classList.contains('is-active'));
assert.equal(await p.locator('#section-results h2').getAttribute('aria-label'),'1차 성과');
assert.equal(await p.locator('#network-stage').evaluate(e=>getComputedStyle(e).visibility),'hidden');
await p.screenshot({path:'site-preview/aml-chapter-results.png'});
await p.locator('#section-results .chapter-start').click();await p.waitForFunction(()=>document.querySelector('#results').classList.contains('is-active'));
await p.locator('.motion-toggle').click();
await p.locator('a[href="#agenda"]').click();await p.waitForFunction(()=>document.querySelector('#agenda').classList.contains('is-active'));
await p.waitForFunction(()=>{const c=[...document.querySelectorAll('#agenda .typed-char')];const n=c.filter(e=>e.style.visibility!=='hidden').length;return n>0&&n<c.length;});
const headingBox=await p.locator('#agenda h2').boundingBox();
await p.screenshot({path:'site-preview/aml-typing-in-progress.png'});
await p.waitForFunction(()=>!document.querySelector('#agenda h2').classList.contains('is-typing'));
const finishedBox=await p.locator('#agenda h2').boundingBox();assert.ok(Math.abs(headingBox.height-finishedBox.height)<1&&Math.abs(headingBox.width-finishedBox.width)<1,'Typing should reserve heading space');
await p.screenshot({path:'site-preview/aml-agenda.png'});
await p.locator('a[href="#section-next"]').click();await p.waitForFunction(()=>document.querySelector('#section-next').classList.contains('is-active'));
await p.locator('a[href="#question"]').click();await p.waitForFunction(()=>document.querySelector('#question').classList.contains('is-active'));
await p.locator('.motion-toggle').click();assert.equal(await p.locator('.typed-char[style*="hidden"]').count(),0,'Interrupting typing must restore all text');
assert.equal(await p.locator('#question h1').getAttribute('aria-label'),'거래 한 건에서,\n연결된 거래로.');
const fallback=await b.newPage({viewport:{width:960,height:540}});await fallback.route('**/vendor/three/**',r=>r.abort());await fallback.goto(url+'/aml.html');await fallback.waitForSelector('.scene-map svg');await fallback.locator('a[href="#approach"]').click();await fallback.locator('[data-hop="0"]').click();assert.equal(await fallback.locator('#approach .scene-map svg > path').count(),1);await fallback.close();
const nojs=await b.newPage({javaScriptEnabled:false});await nojs.goto(url+'/aml.html');assert.ok(await nojs.locator('#question .data-chart img').evaluate(e=>e.complete&&e.naturalWidth>0));await nojs.close();
await p.goto(url+'/robotics.html');await p.locator('#theta1').fill('90');await p.locator('#theta1').dispatchEvent('input');assert.match(await p.locator('#theta1-value').innerText(),/90/);assert.deepEqual(errors,[]);console.log('PASS: fixed deck in 3 viewports, all 14 slides unclipped, graph scope/time controls, period results, rotation, typing/cancellation, agenda/chapter links, reduced motion, WebGL fallback, no-JS and robot control');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
