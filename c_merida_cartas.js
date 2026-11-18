// Mérida en Venta: mini-cartas de título (Mis propiedades, Jugadores y Tratos).
// c_meridaui.js llama MCAR.init(H) con sus utilidades (G, me, B, D, GR, $m, tok, nm, esc, buildable, canAct, icon, onCol, alive, TR).
(function(){
let H=null;
const MC={};
const fams=()=>{const B=H.B,F=H.GR.map((L,g)=>({k:'g'+g,g,L:L.slice()}));
 F.sort((a,b)=>a.L[0]-b.L[0]);
 [['r','r'],['u','u']].forEach(([k,t])=>{const L=[];B.forEach((s,i)=>{if(s.t==t)L.push(i)});if(L.length)F.push({k,L})});return F};
const houses=h=>h==5?'<span class="mc-hs"><i class="ht"></i></span>':h?`<span class="mc-hs">${'<i></i>'.repeat(h)}</span>`:'';
const gc=i=>{const s=H.B[i];return s.t=='p'?H.D.gcol[s.g]:''};
function card(i,o={}){const G=H.G,s=H.B[i],c=gc(i),cl='mc'+(o.c?' '+o.c:'')+(G.mg[i]?' dorso':'')+(c?'':' srv'),nm=H.esc(s.n);
 const on=o.on||`MRU.sel(${i})`,dr=o.drag?` draggable="true" ondragstart="MCAR.drag(event,'${o.drag}',${i})"`:'';
 return `<button class="${cl}"${c?` style="--gc:${c};--go:${H.onCol(c)}"`:''} onclick="${on}"${dr} title="${nm}"><span class="mc-b">${c?'':H.icon(s)}</span><b>${nm}</b>${G.mg[i]?'':houses(G.hs[i])}</button>`}
function hole(i){const G=H.G,s=H.B[i],w=G.own[i],c=gc(i);
 return `<button class="mc hole${c?'':' srv'}"${c?` style="--gc:${c}"`:''} onclick="MRU.sel(${i})" title="${H.esc(s.n)}"><span class="mc-b">${c?'':H.icon(s)}</span><b>${H.esc(s.n)}</b>${w>=0?`<span class="mc-who">${H.tok(w,'xs')}</span>`:''}</button>`}
// Mis propiedades: una fila por grupo, con huecos punteados para lo que falta
MC.mias=()=>{const G=H.G,m=H.me(),R=fams().filter(f=>f.L.some(i=>G.own[i]===m));
 if(!R.length)return `<div class="mu-empty"><span>${H.MIC.h('rancho')}</span><b>Sin propiedades</b></div>`;
 return `<div class="mc-wrap">${R.map(f=>{const n=f.L.filter(i=>G.own[i]===m).length,all=n==f.L.length;let bt='';
  if(f.g!=null&&all){const b=f.L.filter(i=>H.buildable(i)).sort((x,y)=>G.hs[x]-G.hs[y])[0],ok=b!=null&&H.canAct();
   const t=b!=null&&G.hs[b]==4?'Hotel':'Construir';
   bt=`<button class="mu-b sm ok mc-con" onclick="MRU.foc(${ok?b:-1})"${ok?'':' disabled'}>${H.MIC.h('rancho')} ${t} ${H.$m(H.D.hc[f.g])}</button>`}
  return `<div class="mc-g${all?' full':''}"${f.g!=null?` style="--gc:${H.D.gcol[f.g]}"`:''}><div class="mc-row">${f.L.map(i=>G.own[i]===m?card(i):hole(i)).join('')}</div>
   <div class="mc-ft"><span class="mc-n">${n}/${f.L.length}</span>${bt}</div></div>`}).join('')}</div>`};
// Jugadores: sus títulos en mini-cartas chicas, juntas por color
MC.jug=k=>{const G=H.G,R=fams().map(f=>f.L.filter(i=>G.own[i]===k)).filter(L=>L.length);
 return R.length?`<div class="mc-pj">${R.map(L=>`<span class="mc-cl">${L.map(i=>card(i,{c:'sm'})).join('')}</span>`).join('')}</div>`:''};
// Tratos: tocar o arrastrar cartas a "Tú das" / "Tú pides"; dinero con − / +
const ICM='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 12h12"/></svg>';
const ICP='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 12h12M12 6v12"/></svg>';
const fmt=(key,v)=>key=='aj'||key=='bj'?H.MIC.h('llave')+' '+v:H.$m(v);
const step=(key,max,st)=>`<div class="mc-st"><button class="mc-sb" onpointerdown="MCAR.hold(event,'${key}',${-st},${max})" aria-label="Menos">${ICM}</button><b id="mut_${key}" class="mc-sv">${fmt(key,H.TR[key]||0)}</b><button class="mc-sb" onpointerdown="MCAR.hold(event,'${key}',${st},${max})" aria-label="Más">${ICP}</button></div>`;
MC.trato=ot=>{const G=H.G,m=H.me(),TR=H.TR,to=TR.to,own=k=>fams().flatMap(f=>f.L.filter(i=>G.own[i]===k));
 const zone=(key,lb,ck,jk,k)=>`<div class="mc-z" ondragover="event.preventDefault();this.classList.add('ov')" ondragleave="this.classList.remove('ov')" ondrop="MCAR.drop(event,'${key}')">
  <b class="mc-zh">${lb}</b><div class="mc-row">${TR[key].length?TR[key].map(i=>card(i,{c:'in',on:`MRU.tg('${key}',${i})`})).join(''):'<span class="mc-ph"></span>'}</div>
  ${step(ck,G.cash[k],10)}${G.jf[k]?step(jk,G.jf[k],1):''}</div>`;
 const pool=(key,k)=>{const L=own(k).filter(i=>!TR[key].includes(i));return `<div class="mc-pool">${L.map(i=>card(i,{c:'sm',on:`MRU.tg('${key}',${i})`,drag:key})).join('')||'<span class="mu-s">—</span>'}</div>`};
 return `<div class="mc-tr"><div class="mu-who">${ot.map(k=>`<button class="mu-chip pl${k===to?' on':''}" style="--pc:${H.pc(k)}" onclick="MRU.to(${k})">${H.tk(k)} ${H.nm(k)}</button>`).join('')}</div>
  <div class="mc-zs">${zone('ap','Tú das','ac','aj',m)}${zone('bp','Tú pides','bc','bj',to)}</div>
  <div class="mc-pools"><div>${H.tok(m,'xs')}${pool('ap',m)}</div><div>${H.tok(to,'xs')}${pool('bp',to)}</div></div>
  <button class="mu-b pri big" onclick="MRU.offer()">${H.MIC.h('trato')} Ofrecer</button></div>`};
MC.card=(i,c)=>card(i,{c});
MC.drag=(e,key,i)=>{try{e.dataTransfer.setData('text/plain',key+':'+i);e.dataTransfer.effectAllowed='move'}catch(_){}};
MC.drop=(e,key)=>{e.preventDefault();const[k,i]=String(e.dataTransfer.getData('text/plain')).split(':');if(k===key&&!H.TR[key].includes(+i))MRU.tg(key,+i)};
let hT=0,hN=0;const stop=()=>{clearTimeout(hT);hT=0};
MC.hold=(e,key,d,max)=>{e.preventDefault();stop();hN=0;
 const go=()=>{const v=Math.max(0,Math.min(max,(H.TR[key]||0)+d*(hN++>14?5:1)));MRU.n(key,v);const el=document.getElementById('mut_'+key);if(el)el.innerHTML=fmt(key,v);hT=setTimeout(go,hN<2?380:70)};
 go();addEventListener('pointerup',stop,{once:true});addEventListener('pointercancel',stop,{once:true})};
MC.init=h=>{H=h;if(document.getElementById('mccss'))return;const st=document.createElement('style');st.id='mccss';st.textContent=CSS;document.head.appendChild(st)};
const CSS=`
.mc-wrap{display:flex;flex-direction:column;gap:10px;padding:4px 2px 10px}
.mc-g{border:1.5px solid var(--mu-line);border-radius:14px;padding:8px;background:var(--mu-card)}
.mc-g.full{border:2px solid var(--gc,var(--ui-accent));box-shadow:0 0 0 3px color-mix(in srgb,var(--gc,var(--ui-accent)) 25%,transparent)}
.mc-row{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-start}
.mc-ft{display:flex;align-items:center;gap:8px;margin-top:6px;min-height:28px}
.mc-n{font:800 13px var(--mu-f);color:var(--ui-sub);font-variant-numeric:tabular-nums}
.mc-con{margin-left:auto;flex:none!important;min-height:38px!important;font-size:13px!important;padding:0 12px!important}
.mc{appearance:none;position:relative;display:flex;flex-direction:column;align-items:stretch;width:64px;height:84px;padding:0;border-radius:8px;border:1.5px solid rgba(0,0,0,.35);background:#fffef8;color:#18201b;overflow:hidden;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,.18);font-family:var(--mu-f);transition:transform .12s}
.mc:active{transform:scale(.94)}
.mc-b{flex:none;display:grid;place-items:center;height:22px;background:var(--gc);color:var(--go,#fff);border-bottom:1.5px solid rgba(0,0,0,.3)}
.mc.srv .mc-b{background:#ece6d8;color:#18201b;height:26px}.mc.srv .mc-b svg{width:18px;height:18px}
.mc>b{flex:1;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;padding:3px 3px 0;font:800 9.5px/1.15 var(--mu-f);text-align:center;text-transform:uppercase;word-break:break-word}
.mc-hs{position:absolute;left:0;right:0;bottom:3px;display:flex;justify-content:center;gap:2px}
.mc-hs i{width:10px;height:9px;background:#3E8E4F;clip-path:polygon(50% 0,100% 45%,100% 100%,0 100%,0 45%)}
.mc-hs i.ht{width:18px;background:#C2412A}
.mc.dorso{background:repeating-linear-gradient(45deg,#C2512A 0 6px,#a8421f 6px 12px);color:#fff;border-color:#7a2f15}
.mc.dorso .mc-b{background:transparent;border:0}.mc.dorso>b{opacity:.85;text-shadow:0 1px 2px rgba(0,0,0,.5)}
.mc.hole{background:transparent;border:2px dashed var(--mu-line);box-shadow:none;color:var(--ui-sub)}
.mc.hole .mc-b{background:color-mix(in srgb,var(--gc,#9aa59f) 35%,transparent);border:0}.mc.hole>b{opacity:.75}
.mc.hole.srv .mc-b{background:transparent;color:var(--ui-sub)}
.mc-who{position:absolute;left:0;right:0;bottom:4px;display:flex;justify-content:center}
.mc.sm{width:30px;height:40px;border-radius:5px}.mc.sm>b{display:none}.mc.sm .mc-b{height:12px}.mc.sm.srv .mc-b{height:22px}.mc.sm.srv .mc-b svg{width:14px;height:14px}
.mc.sm .mc-hs{bottom:2px;gap:1px;flex-wrap:wrap;padding:0 2px}.mc.sm .mc-hs i{width:6px;height:6px}.mc.sm .mc-hs i.ht{width:12px}
.mc.in{width:52px;height:68px}.mc.in>b{font-size:8.5px}
.mc-pj{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:5px}.mc-cl{display:inline-flex;gap:3px}
.mc-tr{display:flex;flex-direction:column;gap:10px}
.mc-zs{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mc-z{display:flex;flex-direction:column;gap:6px;padding:8px;border:2px dashed var(--mu-line);border-radius:14px;min-height:120px;transition:background .15s,border-color .15s}
.mc-z.ov{border-color:var(--ui-accent);background:var(--ui-chip)}
.mc-zh{font:900 12px var(--mu-f);text-transform:uppercase;letter-spacing:.04em;color:var(--ui-sub)}
.mc-z .mc-row{flex:1;min-height:68px}.mc-ph{flex:1;align-self:stretch;min-height:64px;border-radius:8px;background:var(--ui-chip)}
.mc-st{display:flex;align-items:center;gap:4px}
.mc-sb{appearance:none;flex:none;display:grid;place-items:center;width:44px;height:44px;border-radius:999px;border:1.5px solid var(--mu-line);background:var(--ui-field);color:var(--ui-icon);cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none}
.mc-sb:active{transform:scale(.92);background:var(--ui-chip)}
.mc-sv{flex:1;text-align:center;font:900 16px var(--mu-f);font-variant-numeric:tabular-nums;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:3px}
.mc-pools{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mc-pools>div{display:flex;flex-direction:column;gap:6px;align-items:flex-start}
.mc-pool{display:flex;flex-wrap:wrap;gap:4px}
@media (prefers-reduced-motion:reduce){.mc,.mc-z{transition:none}}
`;
window.MCAR=MC;
})();
