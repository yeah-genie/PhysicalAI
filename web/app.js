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
