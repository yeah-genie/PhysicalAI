import {resultFor, reviewCount} from './data.js';
const selector = document.querySelector('#model');
if (selector) {
  const update = () => {
    const model = resultFor(selector.value);
    document.querySelector('#model-description').textContent = model.description;
    document.querySelector('#ap').textContent = `${model.ap.toFixed(2)}%`;
    document.querySelector('#precision').textContent = `${model.precision.toFixed(2)}%`;
    document.querySelector('#result-summary').textContent = `${model.name} · ${reviewCount}건 중 자금세탁 라벨 ${model.detected}건, 정상 라벨 ${model.normal}건.`;
    document.querySelectorAll('[data-model]').forEach(row => row.classList.toggle('selected',row.dataset.model===selector.value));
  };
  selector.addEventListener('change',update);
  update();
}
const graph = document.querySelector('#graph');
if (graph) {
  const ns='http://www.w3.org/2000/svg';
  const nodes=Array.from({length:32},(_,i)=>{
    const angle=i*2.39996, radius=45+Math.sqrt(i)*34;
    return [320+Math.cos(angle)*radius,255+Math.sin(angle)*radius*.8];
  });
  const append=(tag,attrs)=>{
    const element=document.createElementNS(ns,tag);
    Object.entries(attrs).forEach(([key,value])=>element.setAttribute(key,String(value)));
    graph.append(element);
  };
  nodes.forEach(([x,y],i)=>nodes.slice(i+1).forEach(([x2,y2],j)=>{
    if (Math.hypot(x-x2,y-y2)<130) append('line',{x1:x,y1:y,x2,y2,class:(i+j)%8===0?'signal':''});
  }));
  nodes.forEach(([cx,cy],i)=>{
    append('circle',{cx,cy,r:i%9===0?6:3,class:i===18?'anomaly':i%9===0?'core':'node'});
    if (i%9===0) append('circle',{cx,cy,r:13,fill:'none',stroke:'#b1cf8b','stroke-width':.6,opacity:.5});
  });
}

const slides = [...document.querySelectorAll('.slide')];
if (slides.length) {
  const body = document.body;
  const motion = document.querySelector('.motion-toggle');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = preference.matches, active = 0;
  const applyMotion = () => {
    body.classList.toggle('motion-reduced', reduced);
    motion.setAttribute('aria-pressed', String(reduced));
  };
  applyMotion();
  motion.addEventListener('click', () => { reduced = !reduced; applyMotion(); });
  preference.addEventListener('change', event => { reduced = event.matches; applyMotion(); });
  const dots = document.querySelector('.slide-dots');
  const go = index => slides[index]?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
  slides.forEach((slide,index) => {
    const button = document.createElement('button');
    button.setAttribute('aria-label', `${index+1}. ${slide.dataset.title}`);
    button.addEventListener('click', () => go(index));
    dots.append(button);
  });
  const circles = [...graph.querySelectorAll('circle')].filter(el => el.getAttribute('fill') !== 'none');
  const rings = [...graph.querySelectorAll('circle[fill="none"]')];
  const lines = [...graph.querySelectorAll('line')];
  // ponytail: conceptual layouts; replace with measured data when a real simulation is available.
  const positions = visual => circles.map((_,i) => {
    if(visual==='robotics') { const joint=Math.floor(i/8); return [170+joint*100+(i%8)*7,380-joint*65+Math.sin(i)*20]; }
    if(visual==='finance') return [130+(i%4)*125+Math.sin(i)*18,100+Math.floor(i/4)*48];
    const angle=i*2.39996,radius=45+Math.sqrt(i)*34;
    return [320+Math.cos(angle)*radius,255+Math.sin(angle)*radius*.8];
  });
  let points=positions('network'), frame=0;
  const draw = values => {
    circles.forEach((circle,i) => {circle.setAttribute('cx',values[i][0]);circle.setAttribute('cy',values[i][1]);});
    rings.forEach((ring,i) => {ring.setAttribute('cx',values[i*9][0]);ring.setAttribute('cy',values[i*9][1]);ring.setAttribute('stroke','currentColor');});
    lines.forEach((line,i) => {const a=values[i%values.length],b=values[(i*7+3)%values.length];['x1','y1','x2','y2'].forEach((key,j)=>line.setAttribute(key,[...a,...b][j]));});
  };
  const morph = visual => {
    cancelAnimationFrame(frame);
    const start=points.map(point=>[...point]), target=positions(visual), time=performance.now();
    const tick=now=>{
      const t=reduced?1:Math.min(1,(now-time)/750), eased=1-Math.pow(1-t,3);
      points=start.map((point,i)=>point.map((value,j)=>value+(target[i][j]-value)*eased));
      draw(points);
      if(t<1)frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
  };
  const previous=document.querySelector('.previous-slide'), next=document.querySelector('.next-slide');
  const update = index => {
    active=index; body.dataset.visual=slides[index].dataset.visual;
    document.querySelector('.slide-progress').textContent=`${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
    document.querySelector('.slide-name').textContent=slides[index].dataset.title;
    [...dots.children].forEach((dot,i)=>dot.setAttribute('aria-current',String(i===index)));
    previous.disabled=index===0;next.disabled=index===slides.length-1;
    document.querySelector('.reading-progress').style.width=`${(index+1)/slides.length*100}%`;
    morph(slides[index].dataset.visual);
  };
  previous.addEventListener('click',()=>go(active-1));next.addEventListener('click',()=>go(active+1));
  document.addEventListener('keydown',event=>{
    if(event.target.closest('a,button,input,select,textarea')||event.altKey||event.ctrlKey||event.metaKey)return;
    if(['ArrowDown','PageDown','ArrowUp','PageUp'].includes(event.key)){
      event.preventDefault();go(Math.max(0,Math.min(slides.length-1,active+(['ArrowDown','PageDown'].includes(event.key)?1:-1))));
    }
  });
  // Observe all slides through the same central viewport band.
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)update(slides.indexOf(entry.target));},{rootMargin:'-40% 0px -40% 0px',threshold:0});
  slides.forEach(slide=>observer.observe(slide));
  update(0);
}

