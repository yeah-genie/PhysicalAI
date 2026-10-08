import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {models,resultFor,reviewCount} from './data.js';
assert.equal(reviewCount,864);
assert.equal(resultFor('pna').normal,163);
assert.equal(resultFor('pna').precision.toFixed(2),'81.13');
assert.equal(resultFor('xgboost').detected,288);
assert.equal(resultFor('mlp').detected,287);
assert.equal(resultFor('gin').detected,529);
assert.throws(()=>resultFor('invalid'),RangeError);
for (const key of Object.keys(models)) {
  const result=resultFor(key);
  assert.equal(result.normal+result.detected,reviewCount);
  assert.ok(result.ap>=0&&result.ap<=100);
}
for (const page of ['index.html','aml.html','robotics.html']) {
  const html=readFileSync(new URL(page,import.meta.url),'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    if (!match[1].startsWith('https://')) assert.ok(existsSync(new URL(match[1].split('#')[0],import.meta.url)),`${page}: ${match[1]}`);
  }
  assert.ok(html.includes('name="viewport"'));
  assert.ok(html.includes('class="skip"'));
}
console.log('PASS: AML fixed-result calculations and local page links');
