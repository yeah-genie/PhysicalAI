import {readFileSync,writeFileSync} from 'node:fs';
import {validateOverview,hourlyChart,timelineChart,dailyChart,formatChart} from '../web/aml-charts.js';
import {graphSvg} from '../web/aml-graph.js';
const graph=JSON.parse(readFileSync(new URL('../web/data/transactions.json',import.meta.url),'utf8'));
const overview=JSON.parse(readFileSync(new URL('../web/data/overview.json',import.meta.url),'utf8'));
validateOverview(overview,graph);
for(const [name,chart] of [['hourly',hourlyChart(overview)],['timeline',timelineChart(graph)],['daily',dailyChart(graph)],['formats',formatChart(overview)]]) {
  writeFileSync(new URL(`../web/assets/transactions-${name}.svg`,import.meta.url),chart.markup);
}
console.log('Built four static fallbacks from the same chart renderers.');
writeFileSync(new URL('../web/assets/network-neighbors.svg',import.meta.url),graphSvg(graph));
