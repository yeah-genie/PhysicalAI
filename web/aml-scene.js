import {layoutNodes, included} from './aml-graph.js';
const stage = document.querySelector('#network-stage');
const deck = document.querySelector('.deck');
const reduced = () => document.body.classList.contains('motion-reduced');
let graph, data, index = 0, hop = 2, future = false, focused = false;
function update() {
  document.querySelectorAll('[data-hop]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.hop === hop)));
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.view === 'target') === focused)));
  document.querySelector('#future-toggle').setAttribute('aria-pressed', String(future));
  if (!data) return;
  const count = data.edges.filter(e => included(e, hop, false)).length;
  document.querySelector('#hop-readout').textContent = `선택 부분망에서 ${count}거래 표시 · ${hop === 0 ? '대상 거래만' : `과거 ${hop}-hop까지`}`;
  const later = data.edges.filter(e => e.phase === 'future').length;
  document.querySelector('#time-readout').textContent = future ? `미래 ${later}거래를 점선으로 비교 · 입력에는 제외` : `미래 ${later}거래 제외 · 과거와 대상 거래만 표시`;
  renderFallback(); graph?.show(index, reduced());
}
document.querySelectorAll('[data-hop]').forEach(b => b.addEventListener('click', () => {hop = +b.dataset.hop; update();}));
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {focused = b.dataset.view === 'target'; update();}));
document.querySelector('#future-toggle').addEventListener('click', () => {future = !future; update();});
document.querySelector('#flow-play').addEventListener('click', () => {
  focused = true; update(); graph?.pulse();
  document.querySelector('#flow-play').textContent = 'A001 → A002 · 송금 방향';
});
document.addEventListener('deckchange', e => {index = Number(document.querySelectorAll('.slide')[e.detail.index].dataset.graphShot); graph?.resetOrbit(); update();});
document.addEventListener('motionchange', () => graph?.show(index, true));
document.addEventListener('visibilitychange', () => document.hidden ? graph?.stop() : graph?.show(index, true));

// The same extracted edges remain available when WebGL is unavailable.
function renderFallback() {
  const points = layoutNodes(data.nodes);
  document.querySelectorAll('.scene-map').forEach((figure, page) => {
    const localHop = page === 0 ? (focused ? 0 : 3) : page === 1 ? hop : 2;
    const showFuture = page === 0 ? !focused : page === 2 ? future : false;
    const svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 440" role="img" aria-label="실제 데이터의 거래 부분망"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="#64e4cb"/></marker></defs>'];
    const xy = i => [325 + points[i][0]*72, 220 - points[i][1]*72];
    data.edges.forEach(e => {
      if (!included(e,localHop,showFuture)) return;
      const a=xy(e.source), b=xy(e.target), main=e.phase==='target';
      svg.push(`<path d="M${a} Q${(a[0]+b[0])/2} ${(a[1]+b[1])/2-18} ${b}" fill="none" stroke="${main?'#64e4cb':'#456c62'}" stroke-width="${main?3:1}" ${e.phase==='future'?'stroke-dasharray="4 5"':''} marker-end="url(#arrow)"/>`);
    });
    data.nodes.forEach((n,i) => { const [x,y]=xy(i);svg.push(`<circle cx="${x}" cy="${y}" r="${i<2?9:4}" fill="${i<2?'#b3ffec':'#7b9e92'}"/>`);if(i<2)svg.push(`<text x="${x+14}" y="${y+5}" fill="#dffaf2" font-size="14">${n.id}</text>`); });
    svg.push('</svg>');figure.innerHTML=svg.join('');
  });
}
async function load() {
  try {
    const response = await fetch('data/transactions.json'); if (!response.ok) throw Error('데이터를 불러오지 못했습니다.');
    data = await response.json();
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges) || data.edges.some(e => !data.nodes[e.source] || !data.nodes[e.target])) throw Error('거래 연결 데이터가 올바르지 않습니다.');
    const target = data.edges.find(e => e.phase === 'target');
    document.querySelector('#transaction-detail').textContent = `A001 → A002 · ${target.timestamp} · ${Number(target.amountReceived).toLocaleString('en-US',{minimumFractionDigits:2})} ${target.currency} · CSV 라벨 ${target.label}`;
    index = Number(document.querySelector('.slide.is-active')?.dataset.graphShot || 0);
    update();
    try { graph = createGraph(await import('./vendor/three/three.module.js')); graph.show(index,true); }
    catch(error) { stage.replaceChildren(); document.body.classList.remove('has-network'); console.warn('2D 거래망으로 표시합니다.',error.message); }
  } catch(error) {
    document.querySelector('#hop-readout').textContent = error.message;
    document.querySelectorAll('.graph-controls button,#flow-play').forEach(b=>b.disabled=true);
  }
}
load();
function createGraph(T) {
  const W=810,H=590;
  const renderer = new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.setSize(W,H);
  const scene = new T.Scene(), group = new T.Group(); scene.add(group);
  const camera = new T.PerspectiveCamera(42,W/H,.1,50); camera.position.set(0,0,10.8);
  scene.add(new T.HemisphereLight(0xd8fff0,0x102720,2.5));
  const light = new T.DirectionalLight(0xc6fff4,4); light.position.set(-3,4,5);scene.add(light);
  const points = layoutNodes(data.nodes).map(p=>new T.Vector3(...p));
  const sphere = new T.SphereGeometry(1,24,16);
  const nodes = points.map((p,i)=>{
    const mesh = new T.Mesh(sphere,new T.MeshStandardMaterial({color:i<2?0xc4fff1:0x8bab9f,metalness:.48,roughness:.26,transparent:true}));
    mesh.position.copy(p);mesh.scale.setScalar(i<2?.17:.075);group.add(mesh);return mesh;
  });
  const links = data.edges.map((e,i)=>{
    const a=points[e.source], b=points[e.target];
    const mid=a.clone().lerp(b,.5);mid.z+=.15+(i%5)*.09;mid.y+=(i%3-1)*.13;
    const curve=new T.QuadraticBezierCurve3(a,mid,b), main=e.phase==='target';
    const material = new T.MeshBasicMaterial({color:main?0x70ffda:e.phase==='future'?0x6d7a79:0x44766a,transparent:true});
    let line;
    if(e.phase==='future') {line=new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(24)),new T.LineDashedMaterial({color:0x7e9690,dashSize:.07,gapSize:.09,transparent:true}));line.computeLineDistances();}
    else line=new T.Mesh(new T.TubeGeometry(curve,24,main?.022:.009,5,false),material);
    const arrow=new T.Mesh(new T.ConeGeometry(main?.065:.038,.13,8),material);
    arrow.position.copy(curve.getPoint(.85));arrow.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),curve.getTangent(.85));
    group.add(line,arrow);return {e,curve,line,arrow};
  });
  const pulse = new T.Mesh(new T.SphereGeometry(.07,16,12),new T.MeshBasicMaterial({color:0xffffff}));pulse.visible=false;group.add(pulse);
  const labels = [0,1].map(i=>{const el=document.createElement('span');el.className='network-label';el.textContent=`${data.nodes[i].id} · ${i?'수신':'송신'}`;stage.append(el);return el;});
  stage.prepend(renderer.domElement);document.body.classList.add('has-network');
  let frame, start=0, pulseStart=0, orbit={x:0,y:0,zoom:1}, drag;
  let state={x:-.14,y:.48,zoom:1,dim:1}, from={...state}, target={...state};
  const shots=[[-.14,.48,1.16,1],[.08,-.10,1.14,1],[.12,.18,1.04,1],[-.3,.75,.88,.08],[-.1,.9,.86,.06],[.1,1,.86,.05],[-.15,.4,1,.65]];
  function draw(now) {
    const p=reduced()?1:Math.min(1,(now-start)/950), ease=1-Math.pow(1-p,4);
    for(const k of Object.keys(state))state[k]=from[k]+(target[k]-from[k])*ease;
    group.rotation.set(state.x+orbit.x,state.y+orbit.y,0);camera.zoom=state.zoom*orbit.zoom;camera.updateProjectionMatrix();
    const depth=index===0?(focused?0:3):index===1?hop:2, later=index===0?!focused:index===2?future:false;
    const connected=new Set([0,1]);
    links.forEach(({e,line,arrow})=>{
      const on=included(e,depth,later);if(on){connected.add(e.source);connected.add(e.target);}
      const alpha=(on?(e.phase==='target'?1:.65):.035)*state.dim;
      line.material.opacity=alpha;arrow.material.opacity=alpha;arrow.visible=on&&index<3;
    });
    nodes.forEach((n,i)=>n.material.opacity=(connected.has(i)?1:.09)*state.dim);
    pulse.visible=!!pulseStart&&!reduced()&&index===0&&now-pulseStart<2200;
    if(pulse.visible)pulse.position.copy(links.find(l=>l.e.phase==='target').curve.getPoint(Math.min(1,(now-pulseStart)/2200)));
    group.updateMatrixWorld(true);camera.updateMatrixWorld();
    labels.forEach((el,i)=>{const v=nodes[i].getWorldPosition(new T.Vector3()).project(camera);el.style.left=`${(v.x*.5+.5)*W+14}px`;el.style.top=`${(-v.y*.5+.5)*H-9}px`;el.hidden=index>2;});
    renderer.render(scene,camera);stage.dataset.scene=String(index);stage.dataset.hop=String(depth);stage.dataset.future=String(later);
    if(p<1||pulse.visible)frame=requestAnimationFrame(draw);
  }
  function stop(){cancelAnimationFrame(frame);}
  function show(next,instant=false){
    stop();const [x,y,zoom,dim]=shots[next];from={...state};target={x,y,zoom:zoom*(next===0&&focused?1.26:1),dim};start=performance.now()-(instant?950:0);
    if(!document.hidden)frame=requestAnimationFrame(draw);
  }
  const eligible=e=>index<3&&!e.target.closest('button,a,input,select,.narrative,.scene-caption')&&e.clientX>stage.getBoundingClientRect().left;
  deck.addEventListener('pointerdown',e=>{if(!eligible(e))return;drag={x:e.clientX,y:e.clientY};deck.setPointerCapture(e.pointerId);});
  deck.addEventListener('pointermove',e=>{if(!drag)return;const scale=stage.getBoundingClientRect().width/W;orbit.y+=(e.clientX-drag.x)/scale*.006;orbit.x=Math.max(-.8,Math.min(.8,orbit.x+(e.clientY-drag.y)/scale*.004));drag={x:e.clientX,y:e.clientY};show(index,true);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])deck.addEventListener(name,()=>drag=null);
  deck.addEventListener('wheel',e=>{if(!e.shiftKey||!eligible(e))return;e.preventDefault();orbit.zoom=Math.max(.65,Math.min(1.6,orbit.zoom*(e.deltaY>0?.92:1.08)));show(index,true);},{passive:false});
  deck.addEventListener('dblclick',e=>{if(eligible(e)){orbit={x:0,y:0,zoom:1};show(index,true);}});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();document.body.classList.remove('has-network');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{document.body.classList.add('has-network');show(index,true);});
  return {show,stop,resetOrbit(){orbit={x:0,y:0,zoom:1};pulseStart=0;},pulse(){pulseStart=performance.now();show(index,true);}};
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
