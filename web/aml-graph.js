export function layoutNodes(nodes) {
  const counts = new Map();
  return nodes.map((node, i) => {
    if (i < 2) return [2.15, i ? -1.25 : 1.25, .25];
    const peers = nodes.filter(n => n.hop === node.hop).length;
    const n = counts.get(node.hop) || 0; counts.set(node.hop, n + 1);
    // Layers show the neighborhood used as input, not a traced path of money.
    return [node.hop === 1 ? -.25 : -2.8, peers===1 ? 0 : 2.4-n/(peers-1)*4.8, -.15];
  });
}
export function included(edge, hop, future) {
  return edge.phase === 'target' || (edge.phase === 'future' ? future : edge.hop <= hop);
}
export function graphSvg(data, hop=2) {
  const points=layoutNodes(data.nodes), xy=i=>[325+points[i][0]*72,220-points[i][1]*72];
  const svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 440" role="img" aria-label="실제 데이터의 거래 부분망"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="#64e4cb"/></marker></defs>'];
  data.edges.forEach(e=>{
    if(!included(e,hop,false))return;
    const a=xy(e.source),b=xy(e.target),main=e.phase==='target';
    svg.push(`<path d="M${a} Q${(a[0]+b[0])/2} ${(a[1]+b[1])/2-18} ${b}" fill="none" stroke="${main?'#64e4cb':'#456c62'}" stroke-width="${main?3:1}" marker-end="url(#arrow)"/>`);
  });
  data.nodes.forEach((n,i)=>{
    if(i>1&&!data.edges.some(e=>included(e,hop,false)&&(e.source===i||e.target===i)))return;
    const [x,y]=xy(i);
    svg.push(`<circle cx="${x}" cy="${y}" r="${i<2?9:4}" fill="${i<2?'#b3ffec':'#7b9e92'}"/>`);
    if(i<2)svg.push(`<text x="${x+14}" y="${y+5}" fill="#dffaf2" font-family="sans-serif" font-size="14">${n.id}</text>`);
  });
  return svg.join('')+'</svg>';
}
