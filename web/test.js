import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {planar2R} from './data.js';

const aml = readFileSync(new URL('aml.html', import.meta.url), 'utf8');
const expected = [['XGBoost','17.83%',288], ['Edge-MLP','17.62%',287], ['GIN','40.71%',529], ['PNA','55.59%',701]];
for (const [model, ap, detected] of expected) {
  const row = aml.match(new RegExp(`<tr[^>]*><th scope="row">${model}</th>(.*?)</tr>`, 's'))?.[1];
  assert.ok(row, `Missing result: ${model}`);
  assert.ok(row.includes(ap) && row.includes(`${detected}건`), `Wrong result: ${model}`);
  const width = Number(row.match(/--value:([\d.]+)%/)[1]);
  assert.ok(Math.abs(width - detected / 864 * 100) < .001);
}
assert.deepEqual(planar2R(0, 0), {elbow:[1,0], tip:[2,0]});
for (const [a,b] of [[35,70], [90,90], [0,180], [360,70], [270,0]]) {
  const {elbow,tip} = planar2R(a,b);
  assert.ok(Math.abs(Math.hypot(...elbow)-1) < 1e-12);
  assert.ok(Math.abs(Math.hypot(tip[0]-elbow[0], tip[1]-elbow[1])-1) < 1e-12);
  const wrapped = planar2R(a+360,b).tip;
  assert.ok(Math.hypot(tip[0]-wrapped[0],tip[1]-wrapped[1]) < 1e-12);
}
assert.throws(() => planar2R(Infinity,0), TypeError);
for (const file of ['index.html','aml.html','robotics.html']) {
  const html = readFileSync(new URL(file,import.meta.url),'utf8');
  for (const [,url] of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    if (!url.startsWith('https://')) assert.ok(existsSync(new URL(url.split('#')[0],import.meta.url)), `${file}: ${url}`);
  }
  for (const [,id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${id}"`), `${file}: #${id}`);
}
console.log('PASS: published AML values and bar proportions, 2R geometry and periodicity, page links');
