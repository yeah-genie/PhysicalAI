export function layoutNodes(nodes) {
  const counts = new Map();
  return nodes.map((node, i) => {
    if (i < 2) return [i ? .95 : -.95, i ? .2 : -.2, .5];
    const peers = nodes.filter(n => n.hop === node.hop).length;
    const n = counts.get(node.hop) || 0; counts.set(node.hop, n + 1);
    const angle = n / peers * Math.PI * 2 + node.hop * .62;
    const radius = node.hop === 1 ? 2 : node.hop === 2 ? 3.15 : 3.8;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius * .74, Math.sin(angle * 2) * .65 - node.hop * .22];
  });
}
export function included(edge, hop, future) {
  return edge.phase === 'target' || (edge.phase === 'future' ? future : edge.hop <= hop);
}
