import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {layoutNodes,included} from './aml-graph.js';
const d=JSON.parse(readFileSync(new URL('data/transactions.json',import.meta.url),'utf8'));
assert.equal(d.summary.transactions,5078345);assert.equal(d.summary.positiveTransactions,5177);
assert.equal(d.nodes.length,26);assert.equal(d.edges.length,48);
assert.equal(new Set(d.edges.map(e=>e.id)).size,48);
assert.equal(d.daily.reduce((n,x)=>n+x.transactions,0),d.summary.transactions);
assert.equal(d.daily.reduce((n,x)=>n+x.positiveTransactions,0),d.summary.positiveTransactions);
for(const e of d.edges){assert.ok(d.nodes[e.source]&&d.nodes[e.target]);assert.equal(e.id,`T${e.row}`);assert.ok([0,1].includes(e.label));assert.ok(Number.isFinite(Number(e.amountReceived)));if(e.phase==='future')assert.ok(e.timestamp>d.selection.cutoff);else assert.ok(e.timestamp<=d.selection.cutoff);}
assert.equal(d.edges.filter(e=>included(e,0,false)).length,1);
assert.equal(d.edges.filter(e=>included(e,2,false)).length,42);
assert.equal(d.edges.filter(e=>included(e,2,true)).length,48);
assert.ok(d.edges.filter(e=>included(e,1,false)).length>1);
assert.equal(d.edges.find(e=>e.phase==='target').id,d.selection.targetEdgeId);
const layout=layoutNodes(d.nodes);assert.equal(layout.length,26);assert.ok(layout.flat().every(Number.isFinite));assert.deepEqual(layout,layoutNodes(d.nodes));
console.log('PASS: actual graph integrity, time cutoff, 0/1/2-hop selection, deterministic layout and full-data totals');
