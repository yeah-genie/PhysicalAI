const teal = '#64e4cb', amber = '#f0ad69', muted = '#a6b5b3';
const fmt = n => Number(n).toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = (x,y,s,extra='') => `<text x="${x}" y="${y}" fill="${muted}" ${extra}>${esc(s)}</text>`;
const svg = (title,content) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 440" role="group" aria-label="${esc(title)}" font-family="SUIT,Malgun Gothic,sans-serif" font-size="13">${content}</svg>`;
const hit = (i,label) => `data-point="${i}" tabindex="${i===0?0:-1}" role="button" aria-label="${esc(label)}"`;

export function validateOverview(d, graph) {
  for (const values of [Object.values(d.hourly), Object.values(d.formats)]) {
    if (values.some(a => !Array.isArray(a) || a.length!==2 || a.some(n => !Number.isInteger(n) || n<0) || a[1]>a[0]) ||
        values.reduce((s,a)=>s+a[0],0)!==graph.summary.transactions ||
        values.reduce((s,a)=>s+a[1],0)!==graph.summary.positiveTransactions) throw Error('집계 데이터의 합계가 맞지 않습니다.');
  }
  if (Object.keys(d.hourly).some(k=>!/^2022-09-(0[1-9]|1[0-8]) (0[0-9]|1[0-9]|2[0-3])$/.test(k))) throw Error('집계 날짜가 올바르지 않습니다.');
}

export function hourlyChart(d) {
  let content = text(0,18,'전체 거래 · 날짜 × 시간'), details=[];
  const max=Math.max(...Object.values(d.hourly).map(a=>a[0]));
  for(let h=0;h<24;h+=4) content+=text(61+h*24,42,`${String(h).padStart(2,'0')}시`);
  for(let day=1;day<=18;day++) {
    content+=text(4,65+(day-1)*19,`9.${day}`);
    for(let hour=0;hour<24;hour++) {
      const key=`2022-09-${String(day).padStart(2,'0')} ${String(hour).padStart(2,'0')}`, a=d.hourly[key]||[0,0];
      const v=Math.log1p(a[0])/Math.log1p(max), color=a[0]?`rgb(${Math.round(18+80*v)},${Math.round(35+190*v)},${Math.round(28+145*v)})`:'#0a1713';
      const detail=`${key}시 · 거래 ${fmt(a[0])}건 · 양성 라벨 ${fmt(a[1])}건`;
      content+=`<rect x="${61+hour*24}" y="${52+(day-1)*19}" width="21" height="16" rx="1" fill="${color}" ${hit(details.length,detail)}/>`;
      details.push(detail);
    }
  }
  content+=text(61,422,'낮은 거래량')+`<rect x="146" y="411" width="18" height="12" fill="#14392e"/><rect x="170" y="411" width="18" height="12" fill="#417f64"/><rect x="194" y="411" width="18" height="12" fill="${teal}"/>`+text(224,422,'높은 거래량 · 밝기는 log(1 + 거래 수)');
  return {markup:svg('18일 × 24시간의 실제 거래량. 방향키로 칸 이동',content),details};
}

export function timelineChart(d, future=false) {
  const ts=e=>Date.parse(e.timestamp.replace(' ','T')+':00Z');
  const min=Math.min(...d.edges.map(ts)), max=Math.max(...d.edges.map(ts));
  const cutoff=Date.parse(d.selection.cutoff.replace(' ','T')+':00Z'), x=t=>74+(t-min)/(max-min)*538;
  const recipients=[...new Set(d.edges.map(e=>e.target))].sort((a,b)=>a-b);
  let content=text(0,18,'선택 부분망 · 수신 계좌별 거래 시각');
  content+=`<rect x="${x(cutoff)}" y="54" width="${612-x(cutoff)}" height="302" fill="#17201c"/>`;
  recipients.forEach((id,i)=>{const y=88+i*50;content+=text(0,y+5,d.nodes[id].id)+`<line x1="74" x2="612" y1="${y}" y2="${y}" stroke="#29463a"/>`;});
  content+=`<line x1="${x(cutoff)}" x2="${x(cutoff)}" y1="48" y2="366" stroke="#e7fff5" stroke-dasharray="4 5"/>`+text(x(cutoff)-8,42,'대상 시각 t','text-anchor="end"')+text(x(cutoff)+10,385,'미래 구간');
  const details=[];
  d.edges.forEach((e,i)=>{
    if(e.phase==='future'&&!future)return;
    const y=88+recipients.indexOf(e.target)*50+(i%3-1)*11;
    const detail=`${e.timestamp} · ${d.nodes[e.source].id} → ${d.nodes[e.target].id} · ${fmt(e.amountReceived)} ${e.currency} · ${e.paymentFormat} · CSV 라벨 ${e.label}`;
    content+=`<circle cx="${x(ts(e))}" cy="${y}" r="${e.phase==='target'?7:4.5}" fill="${e.phase==='target'?amber:e.phase==='future'?'#17201c':teal}" stroke="${e.phase==='future'?'#a6b5b3':'none'}" ${hit(details.length,detail)}><title>${esc(detail)}</title></circle>`;
    details.push(detail);
  });
  for(let day=1;day<=10;day+=2) {
    const t=Date.parse(`2022-09-${String(day).padStart(2,'0')}T00:00:00Z`);
    if(t>=min&&t<=max)content+=text(x(t),407,`9.${day}`,'text-anchor="middle"');
  }
  content+=text(74,437,'청록: 과거 거래 · 주황: 대상 거래 · 빈 점: 이후 거래');
  return {markup:svg('대상 시각 전후의 거래 타임라인. 방향키로 거래 이동',content),details};
}

export function dailyChart(d) {
  const max=Math.max(...d.daily.map(a=>a.transactions));
  let content=text(0,20,'거래 수 · 로그 축')+text(0,255,'양성률 · 0–100%'), details=[];
  const x=i=>65+i*32;
  content+=`<rect x="${x(10)-9}" y="33" width="251" height="344" fill="#17201c"/>`+text(x(10),48,'9.11 이후');
  for(const n of [1,100,10000,1000000]) {
    const y=213-Math.log10(n)*24;
    content+=`<line x1="60" x2="635" y1="${y}" y2="${y}" stroke="#24372f"/>`+text(0,y+4,fmt(n));
  }
  for(const p of [0,50,100]) {
    const y=375-p;
    content+=`<line x1="60" x2="635" y1="${y}" y2="${y}" stroke="#24372f"/>`+text(0,y+4,`${p}%`);
  }
  let path='';
  d.daily.forEach((a,i)=>{
    const height=Math.log10(a.transactions)*24, rate=a.positiveTransactions/a.transactions*100;
    content+=`<rect x="${x(i)-7}" y="${213-height}" width="14" height="${height}" fill="${teal}"/>`;
    path+=`${i?'L':'M'}${x(i)},${375-rate}`;
    const detail=`${a.date} · 거래 ${fmt(a.transactions)}건 · 양성 ${fmt(a.positiveTransactions)}건 · 양성률 ${rate.toFixed(2)}%`;
    details.push(detail);
    content+=`<circle cx="${x(i)}" cy="${375-rate}" r="4" fill="${amber}"/>`;
    content+=`<rect x="${x(i)-12}" y="33" width="24" height="344" fill="transparent" ${hit(i,detail)}/>`;
    if(i%2===0||i===17)content+=text(x(i),401,`9.${i+1}`,'text-anchor="middle"');
  });
  content+=`<path d="${path}" fill="none" stroke="${amber}" stroke-width="1.5" pointer-events="none"/>`+text(60,434,'같은 날짜 축 · 위: 거래 수 / 아래: 해당 날짜의 양성 비율');
  return {markup:svg('날짜별 거래량과 양성률. 방향키로 날짜 이동',content),details};
}

export function formatChart(d) {
  let content=text(140,18,'각 집단 안에서의 결제 방식 비중'), details=[];
  for(let p=0;p<=100;p+=25)content+=text(140+p*4.2,42,`${p}%`,'text-anchor="middle"');
  Object.entries(d.formats).sort((a,b)=>b[1][0]-a[1][0]).forEach(([name,a],i)=>{
    const y=63+i*48, shares=[a[0]/d.transactions*100,a[1]/d.positiveTransactions*100];
    content+=text(0,y+13,name,name==='ACH'?`style="fill:#fff;font-weight:650"`:'');
    shares.forEach((v,j)=>{
      content+=`<rect x="140" y="${y+j*16}" width="420" height="8" fill="#17241f"/><rect x="140" y="${y+j*16}" width="${v*4.2}" height="8" fill="${j?amber:teal}"/>`+text(572,y+j*16+9,`${v.toFixed(2)}%`);
    });
    const detail=`${name} · 전체 ${fmt(a[0])}건 · 양성 ${fmt(a[1])}건 · 이 방식 내 양성률 ${(a[1]/a[0]*100).toFixed(4)}%`;
    content+=`<rect x="0" y="${y-5}" width="650" height="41" fill="transparent" ${hit(i,detail)}/>`;
    details.push(detail);
  });
  content+=text(0,423,'청록: 전체 거래 5,078,345건 기준 · 주황: 양성 5,177건 기준');
  return {markup:svg('결제 방식별 전체 거래와 양성 라벨의 구성. 방향키로 방식 이동',content),details};
}

export function mountChart(id,chart,columns=1) {
  const el=document.getElementById(id);el.innerHTML=chart.markup;
  const points=[...el.querySelectorAll('[data-point]')], readout=document.getElementById(`${id}-readout`);
  const select=point=>{
    points.forEach(p=>p.setAttribute('tabindex',p===point?'0':'-1'));
    readout.textContent=chart.details[Number(point.dataset.point)];
  };
  points.forEach(p=>p.onfocus=()=>select(p));
  el.onclick=e=>{const p=e.target.closest('[data-point]');if(p)select(p);};
  el.onkeydown=e=>{
    const p=e.target.closest('[data-point]');if(!p)return;
    const step={ArrowRight:1,ArrowLeft:-1,ArrowDown:columns,ArrowUp:-columns}[e.key];
    if(step!==undefined){e.preventDefault();e.stopPropagation();points[Math.max(0,Math.min(points.length-1,Number(p.dataset.point)+step))].focus();}
    if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();select(p);}
  };
}
