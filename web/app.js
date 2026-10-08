import {resultFor, reviewCount, planar2R} from './data.js';
const motion=document.querySelector('.motion-toggle');
const preference=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=preference.matches;
const setMotion=()=>{document.body.classList.toggle('motion-reduced',reduced);motion?.setAttribute('aria-pressed',String(reduced));};
setMotion();
motion?.addEventListener('click',()=>{reduced=!reduced;setMotion();});
preference.addEventListener('change',event=>{reduced=event.matches;setMotion();});
const slides=[...document.querySelectorAll('.slide')];
const frame=document.querySelector('#deck-frame');
const deck=document.querySelector('.deck');
const mobile=matchMedia('(max-width:700px)');
const stage=document.querySelector('.stage');
let active=-1,relations=true,wrapAngle=0;
const selector=document.querySelector('#model');
const angles=()=>[Number(document.querySelector('#theta1')?.value??35),Number(document.querySelector('#theta2')?.value??70)];
const svg=(content,label)=>`<svg viewBox="0 0 560 420" role="img" aria-label="${label}">${content}</svg>`;
const visual=(title,content,caption)=>`<div class="visual"><p class="visual-title"><span>${title}</span><span>EXPLORATION / ${document.body.classList.contains('robot')?'02':'01'}</span></p>${content}<p class="visual-caption">${caption}</p></div>`;
// ponytail: illustrative accounts, not raw transactions; connect real data only with a verified export.
function graph(scene) {
  const points=Array.from({length:16},(_,i)=>{
    const a=i/16*Math.PI*2;
    if(scene==='single')return [100+(i%4)*120,80+Math.floor(i/4)*90];
    return [280+Math.cos(a)*(i%3===0?180:140),200+Math.sin(a)*(i%3===0?150:115)];
  });
  const central=[3,11];points[3]=[205,200];points[11]=[355,200];
  const edges=[[3,11],...[0,1,2,4,5,6,7].map(i=>[i,3]),...[8,9,10,12,13,14,15].map(i=>[i,11]),[0,7],[4,6],[8,15],[10,12]];
  let content='<defs><radialGradient id="glow-'+scene+'"><stop stop-color="currentColor" stop-opacity=".12"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs><circle cx="280" cy="200" r="200" fill="url(#glow-'+scene+')"/>';
  for(const [i,j] of edges){
    const focus=i===3&&j===11;
    if((scene==='single'||(scene==='neighborhood'&&!relations))&&!focus)continue;
    content+=`<line class="graph-edge ${focus?'focus flow':''}" x1="${points[i][0]}" y1="${points[i][1]}" x2="${points[j][0]}" y2="${points[j][1]}"/>`;
  }
  points.forEach(([x,y],i)=>{
    if((scene==='single'||(scene==='neighborhood'&&!relations))&&!central.includes(i))return;
    content+=`<circle class="graph-node ${central.includes(i)?'focus':''}" cx="${x}" cy="${y}" r="${central.includes(i)?14:7}"/><text class="graph-label" x="${x}" y="${y+28}" text-anchor="middle">${central.includes(i)?(i===3?'ACCOUNT A':'ACCOUNT B'):''}</text>`;
  });
  content+='<text x="280" y="180" fill="currentColor" text-anchor="middle" font-size="12">TRANSACTION</text>';
  const title={overview:'CONNECTED TRANSACTIONS',single:'ONE TRANSACTION',network:'ACCOUNTS → EDGES',neighborhood:relations?'FEATURES + NEIGHBORHOOD':'TRANSACTION FEATURES'}[scene];
  return visual(title,svg(content,'계좌 사이의 거래와 주변 연결을 보여주는 설명용 그래프'),'<strong>점은 계좌, 선은 거래.</strong><br>구조 설명용 예시 · 실제 데이터·모델 설명이 아닙니다.');
}
function results(){
  const model=resultFor(selector.value);
  const tiles=Array.from({length:reviewCount},(_,i)=>`<rect class="result-dot ${i>=model.detected?'normal':''}" x="${10+(i%36)*15}" y="${18+Math.floor(i/36)*15}" width="10" height="10" rx="1"/>`).join('');
  return visual(`${model.name.toUpperCase()} / 864 REVIEWED`,svg(tiles,`${reviewCount}건 중 양성 라벨 ${model.detected}건과 정상 라벨 ${model.normal}건`)+`<div class="result-legend"><span><i></i>양성 ${model.detected}</span><span class="normal"><i></i>정상 ${model.normal}</span></div>`,'<strong>한 칸 = 검토한 거래 한 건.</strong><br>실험 집계 수치 · 실제 거래 순서나 개별 예측을 재현하지 않습니다.');
}
function armContent(a,b){
  const pose=planar2R(a,b),origin=[255,285],scale=105;
  const e=[origin[0]+pose.elbow[0]*scale,origin[1]-pose.elbow[1]*scale];
  const p=[origin[0]+pose.tip[0]*scale,origin[1]-pose.tip[1]*scale];
  return `<circle cx="255" cy="285" r="210" fill="none" stroke="currentColor" opacity=".12" stroke-dasharray="4 9"/><path class="robot-ground" d="M30 285H530M255 50V395"/><path class="arm-link" d="M${origin.join(' ')} L${e.join(' ')} L${p.join(' ')}"/><circle class="arm-joint" cx="255" cy="285" r="12"/><circle class="arm-joint" cx="${e[0]}" cy="${e[1]}" r="10"/><circle cx="${p[0]}" cy="${p[1]}" r="6" fill="currentColor"/><text x="35" y="390" fill="currentColor" font-size="16">q = (${a}°, ${b}°)</text><text x="35" y="412" fill="#a5afb7" font-size="11">x = ${pose.tip[0].toFixed(2)} · y = ${pose.tip[1].toFixed(2)} · LINK LENGTH 1 + 1</text>`;
}
function arm(){const [a,b]=angles();return visual('PLANAR 2R / CONFIGURATION',svg(armContent(a,b),'두 독립 관절 각도로 정해지는 평면 2R 로봇'),'<strong>같은 두 링크, 서로 다른 자세.</strong><br>기구학 개념 데모 · 실물 제어 또는 동역학 시뮬레이션이 아닙니다.');}
function cspace(){
 const y=280-70/360*230,x=wrapAngle===0?40:270;
 const content=`<path d="M40 50H270V280H40Z" fill="#ffffff03" stroke="currentColor" stroke-width="1"/><path d="M40 50V280M270 50V280" stroke="currentColor" stroke-width="3"/><text x="35" y="310" fill="currentColor" font-size="14">0°</text><text x="250" y="310" fill="currentColor" font-size="14">360°</text><text x="140" y="340" fill="#a5afb7" font-size="14">θ₁ →</text><text x="12" y="40" fill="#a5afb7" font-size="14">θ₂</text><path d="M40 ${y}H270" stroke="currentColor" opacity=".3" stroke-dasharray="5 5"/><circle cx="${x}" cy="${y}" r="8" fill="currentColor"/><text x="320" y="70" fill="currentColor" font-size="17">${wrapAngle}° ≡ ${wrapAngle===0?360:0}°</text><g transform="translate(265 80) scale(.48)">${armContent(wrapAngle,70)}</g><text x="310" y="325" fill="#a5afb7" font-size="13">같은 자세</text>`;
 return visual('C-SPACE / PERIODIC BOUNDARIES',svg(content,'0도와 360도 경계는 같은 로봇 자세를 표현합니다'),'<strong>사각형은 좌표 표현입니다.</strong><br>맞은편 경계를 이어 붙이면 이상적 2R의 토러스가 됩니다.');
}
function diagram(scene){
  if(['overview','single','network','neighborhood'].includes(scene))return graph(scene);
  if(scene==='results')return results();
  if(scene==='arm')return arm();
  if(scene==='cspace')return cspace();
  const robot=scene==='roadmap';
  const labels=robot?['FOUNDATIONS','MANIPULATION','LEARNING','FAILURE / RECOVERY']:scene==='limits'?['SINGLE RUN','UNEQUAL BUDGET','SYNTHETIC DATA','REAL-WORLD VALIDATION?']:['REPEAT','INSPECT ERRORS','MEASURE COST','COMPARE AGAIN'];
  const content=labels.map((label,i)=>`<circle cx="70" cy="${60+i*95}" r="${i===0?8:5}" fill="${i===0?'currentColor':'#34424c'}"/>${i<3?`<path d="M70 ${75+i*95}V${140+i*95}" stroke="currentColor" opacity=".3"/>`:''}<text x="105" y="${65+i*95}" fill="${i===0?'currentColor':'#a5afb7'}" font-size="20">${label}</text>`).join('');
  return visual(robot?'STUDY → BUILD → VERIFY':scene==='limits'?'EVIDENCE / BOUNDARIES':'NEXT / NOT COMPLETED',svg(content,'현재 단계와 다음 검증 항목'),robot?'<strong>현재: 기본기 학습.</strong><br>결과가 쌓일 때마다 새 실습과 프로젝트를 연결합니다.':'<strong>결론의 범위도 연구의 일부.</strong><br>실험을 반복하고 조건을 맞추며 근거를 쌓아갑니다.');
}
function refreshVisuals(scene){
  slides.filter(slide=>!scene||slide.dataset.scene===scene).forEach(slide=>{slide.querySelector('.visual-slot').innerHTML=diagram(slide.dataset.scene);});
  if(active>=0&&(!scene||slides[active].dataset.scene===scene))stage.innerHTML=diagram(slides[active].dataset.scene);
}
if(selector){
 const update=()=>{
  const model=resultFor(selector.value);
  document.querySelector('#model-description').textContent=model.description;
  document.querySelector('#ap').textContent=`${model.ap.toFixed(2)}%`;
  document.querySelector('#precision').textContent=`${model.precision.toFixed(2)}%`;
  document.querySelector('#result-summary').textContent=`${model.name} · ${reviewCount}건 중 자금세탁 라벨 ${model.detected}건, 정상 라벨 ${model.normal}건.`;
  document.querySelectorAll('[data-model]').forEach(row=>row.classList.toggle('selected',row.dataset.model===selector.value));
  refreshVisuals('results');
 };
 selector.addEventListener('change',update);update();
}
document.querySelector('#relation-toggle')?.addEventListener('click',event=>{
 relations=!relations;event.currentTarget.setAttribute('aria-pressed',String(relations));event.currentTarget.textContent=relations?'주변 연결 숨기기':'주변 연결 보기';refreshVisuals('neighborhood');
});
for(const id of ['theta1','theta2'])document.querySelector('#'+id)?.addEventListener('input',event=>{
 document.querySelector('#'+id+'-value').textContent=event.target.value+'°';refreshVisuals('arm');
});
document.querySelector('#wrap-demo')?.addEventListener('click',()=>{
 wrapAngle=wrapAngle===0?360:0;refreshVisuals('cspace');
 document.querySelector('#wrap-result').textContent=`θ₁ = ${wrapAngle}°, θ₂ = 70° · 0°와 360°의 로봇 자세는 같습니다.`;
});
if(slides.length){
 const rail=document.querySelector('.slide-rail');
 const previous=document.querySelector('.previous-slide'),next=document.querySelector('.next-slide');
 const go=index=>slides[index]?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
 slides.forEach((slide,i)=>{
  const button=document.createElement('button');button.className='rail-button';button.textContent=String(i+1).padStart(2,'0');button.setAttribute('aria-label',`${i+1}. ${slide.dataset.title}`);button.title=slide.dataset.title;button.addEventListener('click',()=>go(i));rail.append(button);
 });
 const update=index=>{
  if(active===index)return;
  active=index;document.body.dataset.scene=slides[index].dataset.scene;
  slides.forEach((slide,i)=>slide.classList.toggle('is-active',i===index));
  document.querySelector('.slide-progress').textContent=`${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
  document.querySelector('.slide-name').textContent=slides[index].dataset.title;
  [...rail.children].forEach((button,i)=>button.setAttribute('aria-current',String(i===index)));
  previous.disabled=index===0;next.disabled=index===slides.length-1;
  stage.innerHTML=diagram(slides[index].dataset.scene);stage.classList.remove('scene-enter');void stage.offsetWidth;stage.classList.add('scene-enter');
 };
 const current=()=>{
  const center=mobile.matches?innerHeight/2:deck.getBoundingClientRect().top+deck.getBoundingClientRect().height/2;
  const index=slides.findIndex(slide=>{const rect=slide.getBoundingClientRect();return rect.top<=center&&rect.bottom>center;});
  if(index>=0)update(index);
 };
 const fit=()=>{frame.style.transform=mobile.matches?'none':`translate(-50%,-50%) scale(${Math.min(innerWidth/1600,innerHeight/900)})`;current();};
 let pending=false;
 const onScroll=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;current();});};
 deck.addEventListener('scroll',onScroll,{passive:true});addEventListener('scroll',onScroll,{passive:true});
 addEventListener('resize',fit);mobile.addEventListener('change',()=>{fit();go(Math.max(0,active));});
 previous.addEventListener('click',()=>go(active-1));next.addEventListener('click',()=>go(active+1));
 addEventListener('keydown',event=>{
  if(event.target.closest('a,button,input,select,textarea')||event.altKey||event.ctrlKey||event.metaKey)return;
  let index;
  if(['ArrowRight','ArrowDown','PageDown',' '].includes(event.key))index=Math.min(slides.length-1,active+1);
  if(['ArrowLeft','ArrowUp','PageUp'].includes(event.key))index=Math.max(0,active-1);
  if(event.key==='Home')index=0;if(event.key==='End')index=slides.length-1;
  if(index!==undefined){event.preventDefault();go(index);}
 });
 refreshVisuals();update(0);fit();
}

