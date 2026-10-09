const stage = document.querySelector('#network-stage');
const desktop = matchMedia('(min-width: 1180px) and (min-height: 660px)');
let network, loading = false;
const activeIndex = () => [...document.querySelectorAll('.slide')].findIndex(el => el.classList.contains('is-active'));
const reduced = () => document.body.classList.contains('motion-reduced');

async function enableNetwork() {
  if (!desktop.matches || loading || network) return;
  loading = true;
  try {
    const THREE = await import('./vendor/three/three.module.js');
    network = createNetwork(THREE);
    network.show(Math.max(0, activeIndex()), true);
  } catch (error) {
    // A static diagram stays visible when graphics cannot initialize.
    stage.replaceChildren();
    document.body.classList.remove('has-network');
    console.warn('3D 대신 2D 거래 구조도를 표시합니다.', error.message);
  } finally { loading = false; }
}
document.addEventListener('deckchange', event => network?.show(event.detail.index, reduced()));
document.addEventListener('motionchange', () => network?.show(Math.max(0, activeIndex()), true));
desktop.addEventListener('change', () => {
  if (desktop.matches) { enableNetwork(); network?.show(Math.max(0, activeIndex()), true); }
  else network?.stop();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) network?.stop();
  else if (desktop.matches) network?.show(Math.max(0, activeIndex()), true);
});
enableNetwork();

function createNetwork(T) {
  const renderer = new T.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(795, 654);
  renderer.setClearColor(0x000000, 0);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(43, 795 / 654, .1, 80);
  camera.position.set(0, 0, 10);
  const group = new T.Group();
  scene.add(group);
  scene.add(new T.HemisphereLight(0xc9fff1, 0x03100e, 2));
  const key = new T.DirectionalLight(0xeafffa, 4);
  key.position.set(-3, 5, 6); scene.add(key);
  const rim = new T.DirectionalLight(0x42d9b7, 6);
  rim.position.set(4, -1, -3); scene.add(rim);

  const close = [
    [-.9,-.05,.45],[1,.12,.45],[-2.05,1.05,.1],[-2.2,-1.15,.1],[1.1,1.6,-.1],[2.4,-.9,0],
    [-3.05,1.95,-.5],[-3.5,.75,.3],[-3.2,-.7,-.7],[-2.8,-2.25,.4],
    [.25,2.65,-.7],[2.3,2.5,.25],[3.35,-.15,-.5],[3.3,-1.95,.3],[2.7,1.1,1]
  ].map(p => new T.Vector3(...p));
  const cloud = close.map(p => p.clone());
  cloud.forEach((p,i) => { if (i > 1 && i < 14) { p.multiplyScalar(.72); p.z += Math.sin(i*1.7)*1.2; } });
  for (let i = 0; i < 65; i++) {
    const angle = i * 2.39996, ring = i % 3;
    const radius = 1.55 + (i % 5) * .17;
    cloud.push(new T.Vector3(Math.cos(angle) * radius + (ring - 1) * 1.25,
      Math.sin(angle) * radius * .94 + (ring === 1 ? .2 : -.15), Math.sin(i * 1.17) * 1.55));
  }
  const sphere = new T.SphereGeometry(1, 20, 14);
  const nodes = cloud.map((point, i) => {
    const material = new T.MeshStandardMaterial({
      color: i < 2 ? 0x72ffe1 : i < 15 ? 0xb6cdc5 : 0x49695d,
      emissive: i < 2 ? 0x106f58 : 0x000000, emissiveIntensity: .6,
      metalness: .48, roughness: .28, transparent: true
    });
    const mesh = new T.Mesh(sphere, material);
    const size = i < 2 ? .16 : i < 6 ? .105 : .055 + (i % 4) * .014;
    mesh.scale.setScalar(size); mesh.position.copy(point); group.add(mesh);
    return mesh;
  });
  const corePairs = [[0,1],[2,0],[3,0],[4,1],[5,1],[6,2],[7,2],[8,3],[9,3],[10,4],[11,4],[12,5],[13,5]];
  const tubeGeometry = new T.CylinderGeometry(1, 1, 1, 8);
  const arrowGeometry = new T.ConeGeometry(.052, .16, 8);
  const coreEdges = corePairs.map(([from,to], i) => {
    const mat = new T.MeshStandardMaterial({color: i === 0 ? 0x7affe0 : 0x537d6e,
      emissive: i === 0 ? 0x27b091 : 0x123e2b, emissiveIntensity: .75, roughness: .4, transparent: true});
    const tube = new T.Mesh(tubeGeometry, mat), arrow = new T.Mesh(arrowGeometry, mat);
    group.add(tube, arrow);
    return {from,to,tube,arrow};
  });
  const backgroundPairs = [];
  for (let i = 15; i < cloud.length; i++) {
    const near = cloud.map((p,j) => ({j,d:p.distanceTo(cloud[i])})).filter(x => x.j !== i && x.j !== 14).sort((a,b) => a.d-b.d);
    for (const {j} of near.slice(0, 3)) if (j < i) backgroundPairs.push([i,j]);
  }
  const positions = new Float32Array(backgroundPairs.length * 6);
  const linksGeometry = new T.BufferGeometry();
  linksGeometry.setAttribute('position', new T.BufferAttribute(positions, 3));
  const linksMaterial = new T.LineBasicMaterial({color: 0x679584, transparent: true, opacity: .35});
  group.add(new T.LineSegments(linksGeometry, linksMaterial));
  const futureGeometry = new T.BufferGeometry().setFromPoints([close[14],close[1]]);
  const futureMaterial = new T.LineDashedMaterial({color: 0x78867f, transparent: true, dashSize:.08,gapSize:.08});
  const futureEdge = new T.Line(futureGeometry, futureMaterial); futureEdge.computeLineDistances(); group.add(futureEdge);
  const rings = [0,1].map(i => {
    const ring = new T.Mesh(new T.TorusGeometry(.25,.009,8,60), new T.MeshBasicMaterial({color:0x6ee4c7, transparent:true}));
    group.add(ring); return ring;
  });
  const labelNodes = [[0,'계좌 A'],[1,'계좌 B'],[14,'t 이후 · 제외']];
  const labels = labelNodes.map(([node,text]) => {
    const el = document.createElement('span'); el.className = 'network-label' + (node === 14 ? ' future' : '');
    el.textContent = text; stage.append(el); return {node,el};
  });
  stage.prepend(renderer.domElement);
  document.body.classList.add('has-network');
  let frame, index = 0, start = 0;
  let from = {rotation:[-.12,.36,.12],zoom:1,context:1,spread:0,dim:1};
  let state = {...from};
  const shots = [
    {rotation:[-.12,.36,.12],zoom:1.03,context:1,spread:0,dim:1},
    {rotation:[.04,-.08,-.04],zoom:1.17,context:.08,spread:1,dim:1},
    {rotation:[.1,.18,.03],zoom:1.06,context:.045,spread:1,dim:1},
    {rotation:[-.35,.6,.3],zoom:.83,context:.2,spread:0,dim:.12},
    {rotation:[-.1,.95,.13],zoom:.8,context:.3,spread:0,dim:.1},
    {rotation:[.2,1.1,-.1],zoom:.9,context:.35,spread:.2,dim:.09},
    {rotation:[-.25,.6,.08],zoom:1.03,context:1,spread:0,dim:.7}
  ];
  const point = new T.Vector3(), direction = new T.Vector3(), up = new T.Vector3(0,1,0);
  function draw(progress) {
    const target = shots[index], ease = 1-Math.pow(1-progress, 3);
    for (const k of ['zoom','context','spread','dim']) state[k] = from[k] + (target[k]-from[k])*ease;
    state.rotation = target.rotation.map((v,i) => from.rotation[i]+(v-from.rotation[i])*ease);
    group.rotation.set(...state.rotation);
    camera.zoom = state.zoom; camera.updateProjectionMatrix();
    nodes.forEach((node,i) => {
      node.position.copy(cloud[i]);
      if (i > 1 && i < 14) node.position.lerp(close[i],state.spread);
      if (i >= 15) node.position.multiplyScalar(1+state.spread*.15);
      node.material.opacity = state.dim * (i >= 15 ? state.context : i === 14 ? (index === 2 ? .45 : 0) : 1);
    });
    coreEdges.forEach(({from:a,to:b,tube,arrow},i) => {
      direction.subVectors(nodes[b].position,nodes[a].position);
      tube.position.copy(nodes[a].position).addScaledVector(direction,.5);
      tube.quaternion.setFromUnitVectors(up, direction.clone().normalize());
      tube.scale.set(i === 0 ? .02 : .009,direction.length(),i === 0 ? .02 : .009);
      arrow.position.copy(nodes[b].position).addScaledVector(direction.clone().normalize(),-.22);
      arrow.quaternion.copy(tube.quaternion); tube.material.opacity=state.dim*(i === 0 ? 1 : .7);
      arrow.visible = index === 1 || index === 2;
    });
    backgroundPairs.forEach(([a,b],i) => {
      nodes[a].position.toArray(positions, i*6); nodes[b].position.toArray(positions, i*6+3);
    });
    linksGeometry.attributes.position.needsUpdate=true; linksMaterial.opacity=.42*state.context*state.dim;
    futureEdge.visible=index===2; futureMaterial.opacity=state.dim*.5;
    rings.forEach((ring,i) => {ring.position.copy(nodes[i].position); ring.material.opacity=state.dim*.6;});
    group.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    labels.forEach(({node,el}) => {
      el.hidden = (index > 2 && index !== 6) || (node === 14 && index !== 2);
      nodes[node].getWorldPosition(point); point.project(camera);
      el.style.left=`${(point.x*.5+.5)*795+13}px`; el.style.top=`${(-point.y*.5+.5)*654+13}px`;
    });
    renderer.render(scene,camera);
  }
  function stop() { cancelAnimationFrame(frame); }
  function show(next, instant=false) {
    stop(); index=next; stage.dataset.scene=String(index);
    if (!desktop.matches || document.hidden) return;
    from={...state,rotation:[...state.rotation]}; start=performance.now();
    function tick(now) {
      const progress=instant ? 1 : Math.min(1,(now-start)/1150);
      draw(progress);
      if (progress<1) frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
  }
  renderer.domElement.addEventListener('webglcontextlost', () => {stop();document.body.classList.remove('has-network');});
  renderer.domElement.addEventListener('webglcontextrestored', () => {document.body.classList.add('has-network');show(index,true);});
  return {show,stop};
}

const periods = {
  early: {trades:'862,792',positives:'956',rate:'0.11%',ap:[7.69,7.47,23.60,34.06]},
  late: {trades:'1,108',positives:'655',rate:'59.12%',ap:[97.23,97.35,93.05,90.04]}
};
const periodButtons = [...document.querySelectorAll('[data-period]')];
periodButtons.forEach(button => button.addEventListener('click', () => {
  const period=periods[button.dataset.period];
  if (!period) return;
  periodButtons.forEach(b => b.setAttribute('aria-pressed',String(b===button)));
  document.querySelector('#period-summary').innerHTML=`<div><dt>전체 거래</dt><dd>${period.trades}<small>건</small></dd></div><div><dt>양성률 · ${period.positives}건</dt><dd>${period.rate}</dd></div>`;
  const rows=[...document.querySelectorAll('#period-chart .period-row')];
  rows.forEach((row,i) => {
    row.classList.toggle('best',period.ap[i]===Math.max(...period.ap));
    row.querySelector('.period-fill').style.setProperty('--value',`${period.ap[i]}%`);
    row.querySelector('strong').textContent=`${period.ap[i].toFixed(2)}%`;
  });
}));
