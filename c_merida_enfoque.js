// c_merida_enfoque.js — MENF: modo enfoque para construir en Mérida en Venta.
// Al tocar Construir (o una colonia tuya de grupo completo) la cámara de M3 se acerca a la colonia, vista desde fuera del tablero, y las
// vecinas quedan a los lados borrosas y oscurecidas. ‹ › o deslizar pasa a tu siguiente colonia (la cámara viaja por el borde).
// + Casa / − Casa grandes bajo la colonia; si una regla bloquea, parpadea la colonia que falta (M3.blink y su ficha en el grupo) en vez de texto.
// En 2D es un carrusel plano de cartas. c_meridaui.js llama MENF.init(H), MENF.sync() tras cada render y MENF.close(1) al salir.
(function(){
let H=null,el=null,on=false,cur=-1,raf=0,cnt=null,dn=null,botPx=0;
const RMo=()=>typeof RM!=='undefined'&&RM,snd=k=>{if(typeof sfx=='function')sfx(k)},G=()=>H.G,q=s=>el.querySelector(s);
const SVG=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const XI=()=>window.UI&&UI.ico?UI.ico('x'):SVG('<path d="M6 6l12 12M18 6L6 18"/>'),AL=SVG('<path d="M15 5l-7 7 7 7"/>'),AR=SVG('<path d="M9 5l7 7-7 7"/>');
const hsI=h=>h==5?'<i class="mf-h ht"></i>':'<i class="mf-h"></i>'.repeat(h||0);
function list(){const g=G(),m=H.me();return H.B.map((s,i)=>i).filter(i=>H.B[i].t=='p'&&g.own[i]===m)}
function can(i){if(!H)return false;const g=G(),s=H.B[i],m=H.me();return !!s&&s.t=='p'&&g.own[i]===m&&g.phase=='play'&&H.canAct()&&H.full(s.g,m)}
function rent(i){const g=G(),s=H.B[i],h=g.hs[i];return h?s.r[h]:s.r[0]*(g.o.dbl&&H.full(s.g,g.own[i])?2:1)}
// lo que impide construir o vender (mismas reglas que g_merida.js); bl = colonias que deben parpadear
function why(i,t){const g=G(),m=H.me(),s=H.B[i],gr=H.GR[s.g],hs=gr.map(j=>g.hs[j]);
 if(t=='build'){if(!H.full(s.g,m))return {bl:gr.filter(j=>g.own[j]!==m)};if(gr.some(j=>g.mg[j]))return {bl:gr.filter(j=>g.mg[j])};if(g.hs[i]>=5)return {b:1};
  if(g.o.even&&g.hs[i]>Math.min(...hs))return {bl:gr.filter(j=>g.hs[j]<g.hs[i])};if(g.cash[m]<H.D.hc[s.g])return {c:1};return null}
 if(!g.hs[i])return {b:1};if(g.o.even&&g.hs[i]<Math.max(...hs))return {bl:gr.filter(j=>g.hs[j]>g.hs[i])};return null}
const again=(e,c)=>{if(!e)return;e.classList.remove(c);void e.offsetWidth;e.classList.add(c)};
function blinkL(L){const st=H.stage();if(H.is3d()&&st&&st.blink)st.blink(L);L.forEach(j=>{again(q(`.mf-gc[data-i="${j}"]`),'bl');again(q(`.mf-card[data-i="${j}"]`),'bl')})}
// una casa en cada colonia del grupo que va mas baja (todas parejas al terminar); costo sumado
function whyG(i){const g=G(),m=H.me(),s=H.B[i],gr=H.GR[s.g],hs=gr.map(j=>g.hs[j]),mn=Math.min(...hs);if(!H.full(s.g,m))return {bl:gr.filter(j=>g.own[j]!==m)};
 if(gr.some(j=>g.mg[j]))return {bl:gr.filter(j=>g.mg[j])};if(mn>=5)return {b:1};if(g.cash[m]<H.D.hc[s.g]*gr.filter(j=>g.hs[j]==mn).length)return {c:1};return null}
function actG(){const w=whyG(cur);if(w){snd('bad');if(w.bl&&w.bl.length)blinkL(w.bl);else again(q(w.c?'.mf-cash':'.mf-bt.mg'),'mf-sh');return}if(window.MRU)MRU.a('buildg',cur)}
function act(t){const w=why(cur,t);if(w){snd('bad');if(w.bl&&w.bl.length)blinkL(w.bl);else again(q(w.c?'.mf-cash':t=='build'?'.mf-bt.ms':'.mf-bt.mn'),'mf-sh');return}
 if(window.MRU)MRU.a(t,cur)}
// ---- moverse entre tus colonias ----
function to(i,d){if(i===cur)return;cur=i;snd('tick');const st=H.stage();if(H.is3d()&&st&&st.focus)st.focus(i,d);paint()}
function go(d){const L=list(),n=L.length;if(n<2)return;to(L[((L.indexOf(cur)+d)%n+n)%n],d)}
function jump(i){if(G().own[i]!==H.me()){snd('bad');blinkL([i]);return}to(i,(i-cur+40)%40<=20?1:-1)}
const arrow=s=>go((s=='r')===H.is3d()?-1:1);   // en 3D la siguiente colonia del tablero queda a la izquierda
// ---- pantalla ----
function mk(){el=document.createElement('div');el.id='mufoc';el.className='mf';el.setAttribute('role','dialog');el.setAttribute('aria-label','Construir');
 el.innerHTML=`<div class="mf-blur"></div><div class="mf-car"></div>
<button class="mf-x" data-a="x" aria-label="Salir">${XI()}</button><button class="mf-ar l" data-a="l" aria-label="Anterior">${AL}</button><button class="mf-ar r" data-a="r" aria-label="Siguiente">${AR}</button>
<div class="mf-bts"><button class="mf-bt mn" data-a="sell"></button><button class="mf-bt ms" data-a="build"></button></div><button class="mf-bt mg" data-a="buildg"></button>
<div class="mf-pan"><div class="mf-hd"><i class="mf-sw"></i><b class="mf-nm"></b><span class="mf-rt"></span><button class="mf-fi" data-a="fi" aria-label="Ficha" title="Ficha">${H.MIC.h('recibo')}</button></div>
<div class="mf-row"><div class="mf-grp"></div><span class="mf-cash"></span></div></div>`;
 document.body.appendChild(el);
 el.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;e.stopPropagation();const a=b.dataset.a;
  if(a=='x')close();else if(a=='l'||a=='r')arrow(a);else if(a=='build'||a=='sell')act(a);else if(a=='buildg')actG();else if(a=='j')jump(+b.dataset.i);
  else if(a=='fi'){const i=cur;close();if(window.MRU&&MRU.ficha)setTimeout(()=>MRU.ficha(i),0)}});
 el.addEventListener('pointerdown',e=>{dn=e.target.closest('button')?null:{x:e.clientX,y:e.clientY,c:e.target.closest('.mf-card')}});
 el.addEventListener('pointercancel',()=>{dn=null});
 el.addEventListener('pointerup',e=>{const d=dn;dn=null;if(!d||!on)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;
  if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){arrow(dx<0?'r':'l');return}
  if(Math.abs(dx)>10||Math.abs(dy)>10||e.target.closest('.mf-pan'))return;
  if(d.c){const i=+d.c.dataset.i;if(i!==cur)jump(i);return}
  if(!H.is3d()||Math.abs(e.clientX-innerWidth/2)>Math.max(80,Math.min(innerWidth*.22,200)))close()})}   // tocar fuera de la colonia: salir
const set=(s,h)=>{const e=q(s);if(e&&e._h!==h){e._h=h;e.innerHTML=h}};
function paint(){if(!el)return;const g=G(),m=H.me(),i=cur,s=H.B[i],gr=H.GR[s.g],h=g.hs[i],hc=H.D.hc[s.g],L=list(),d3=H.is3d();
 el.classList.toggle('d3',d3);el.classList.toggle('d2',!d3);
 q('.mf-sw').style.background=H.D.gcol[s.g];q('.mf-nm').textContent=s.n;set('.mf-rt',`Renta <b>${H.$m(rent(i))}</b>`);
 set('.mf-grp',gr.map(j=>{const o=g.own[j];return `<button class="mf-gc${j===i?' on':''}${o===m?'':' ot'}${g.mg[j]?' mg':''}" data-a="j" data-i="${j}" style="--pc:${o>=0?H.pc(o):'transparent'}" title="${H.esc(H.B[j].n)}"><em>${H.esc(H.B[j].n)}</em><span class="mf-hs">${g.mg[j]?'':hsI(g.hs[j])}</span></button>`}).join(''));
 const bb=q('.mf-bt.ms'),bs=q('.mf-bt.mn');
 set('.mf-bt.ms',`<b>+ ${h>=4?'Hotel':'Casa'}</b><small>${H.$m(hc)}</small>`);bb.classList.toggle('off',!!why(i,'build'));bb.hidden=h>=5;
 set('.mf-bt.mn',`<b>− ${h==5?'Hotel':'Casa'}</b><small>+${H.$m(hc/2)}</small>`);bs.classList.toggle('off',!!why(i,'sell'));bs.hidden=!h;
 {const bg=q('.mf-bt.mg'),mn=Math.min(...gr.map(j=>g.hs[j])),n=gr.filter(j=>g.hs[j]==mn).length;bg.hidden=mn>=5||!H.full(s.g,m)||n<2;
  if(!bg.hidden){set('.mf-bt.mg',`<b>+ ${mn>=4?'Hotel':'Casa'} en ${n==gr.length?'todas':'las '+n}</b><small>${H.$m(hc*n)}</small>`);bg.classList.toggle('off',!!whyG(i))}}
 el.querySelectorAll('.mf-ar').forEach(a=>a.hidden=L.length<2);
 cash(g.cash[m]);if(d3)set('.mf-car','');else car(L)}
// dinero con contador animado y "−$" que flota
function cash(v){const e=q('.mf-cash');if(!cnt||!e.firstChild){cnt={a:v,b:v,t0:0,v};e.innerHTML=H.MIC.h('billete')+'<b>'+H.$m(v)+'</b>';return}
 if(v===cnt.b)return;const dl=v-cnt.v;cnt.a=cnt.v;cnt.b=v;cnt.t0=performance.now();e.classList.remove('up','dn');void e.offsetWidth;e.classList.add(dl<0?'dn':'up');
 const f=document.createElement('i');f.className='mf-dl '+(dl<0?'dn':'up');f.textContent=(dl<0?'−':'+')+H.$m(Math.abs(dl));e.appendChild(f);setTimeout(()=>f.remove(),1100)}
function tick(now){raf=0;if(!on)return;raf=requestAnimationFrame(tick);
 if(cnt&&cnt.v!==cnt.b){const u=RMo()?1:Math.min(1,(now-cnt.t0)/650),k=1-Math.pow(1-u,3);cnt.v=u>=1?cnt.b:Math.round(cnt.a+(cnt.b-cnt.a)*k);const b=q('.mf-cash b');if(b)b.textContent=H.$m(cnt.v)}}
// medidas: margen de abajo para el tablero, centro de la colonia y la máscara del desenfoque (nítido al centro, borroso a los lados)
function lay(){if(!el)return 0;const p=q('.mf-pan'),pt=Math.max(0,innerHeight-p.getBoundingClientRect().top);botPx=Math.round(pt+64+24);
 const top=el.getBoundingClientRect().top,free=Math.max(60,innerHeight-botPx-top),cy=Math.round(free/2),u=Math.min(innerWidth/2.4,free/2.3);
 el.style.setProperty('--mf-pan',Math.round(pt)+'px');el.style.setProperty('--mf-cy',cy+'px');el.style.setProperty('--mf-bot',botPx+'px');
 const mi=H.is3d()?`radial-gradient(${Math.round(u*.95)}px ${Math.round(u*1.05)}px at 50% ${cy}px,transparent 62%,#000 100%)`:'none',b=q('.mf-blur');
 if(b._m!==mi){b._m=mi;b.style.webkitMaskImage=b.style.maskImage=mi}return botPx}
// ---- 2D: carrusel plano de cartas ----
function car(L){const box=q('.mf-car'),n=L.length,k=L.indexOf(cur),g=G();
 box.querySelectorAll('.mf-card').forEach(c=>{if(L.indexOf(+c.dataset.i)<0)c.remove()});
 const bh=box.clientHeight;let fit=1;
 L.forEach((i,j)=>{let c=box.querySelector(`.mf-card[data-i="${i}"]`);const s=H.B[i],gc=H.D.gcol[s.g];
  if(!c){c=document.createElement('div');c.className='mf-card';c.dataset.i=i;c.innerHTML=`<div class="mf-cb" style="--gc:${gc};--go:${H.onCol(gc)}"><b>${H.esc(s.n)}</b></div><div class="mf-lot"></div><div class="mf-cr"></div>`;box.appendChild(c)}
  let o=((j-k)%n+n)%n;if(o>n/2)o-=n;const po=c._o;c._o=o;
  if(po!=null&&Math.abs(po-o)>1.5){c.classList.add('nt');requestAnimationFrame(()=>requestAnimationFrame(()=>c.classList.remove('nt')))}   // la que da la vuelta no cruza volando
  if(j===k&&c.offsetHeight)fit=Math.min(1,(bh-16)/c.offsetHeight);
  c.classList.toggle('on',!o);c.classList.toggle('mg',!!g.mg[i]);c._fo=o;lot(c,i);
  const cr=c.querySelector('.mf-cr'),t=`Renta <b>${H.$m(rent(i))}</b>`;if(cr._h!==t){cr._h=t;cr.innerHTML=t}});
 box.querySelectorAll('.mf-card').forEach(c=>{const o=c._fo,a=Math.abs(o);c.style.transform=`translate(-50%,-50%) translateX(${o*68}%) scale(${fit*(o?.72:1)})`;
  c.style.filter=o?'blur(3px) brightness(.7)':'none';c.style.opacity=a>2?0:1;c.style.zIndex=10-a;c.style.pointerEvents=a>2?'none':''})}
// casas de la carta: caen con rebote y polvo, se levantan al vender, las 4 se juntan en hotel
function lot(c,i){const h=G().hs[i],p=c._h,L=c.querySelector('.mf-lot');c._h=h;if(p===h)return;
 if(p==null||RMo()){L.innerHTML=hsI(h);return}
 const n0=p==5?1:p,n=h==5?1:h,W=42;let x='',du=0;
 if(h==5){for(let j=0;j<n0;j++)x+=`<i class="mf-h jn" style="--jx:${-(j-(n0-1)/2)*W}px"></i>`;x+='<i class="mf-h ht pop"></i>';du=.5}
 else if(p==5){x='<i class="mf-h ht up ab"></i>';for(let j=0;j<n;j++)x+=`<i class="mf-h nw" style="--dl:${(.24+j*.1).toFixed(2)}s"></i>`;du=.52}
 else{for(let j=0;j<n;j++)x+=j<n0?'<i class="mf-h"></i>':`<i class="mf-h nw" style="--dl:${((j-n0)*.12).toFixed(2)}s"></i>`;for(let j=n;j<n0;j++)x+='<i class="mf-h up"></i>';if(n>n0)du=.28}
 if(du)x+=`<i class="mf-dust" style="--dl:${du}s"></i>`;L.innerHTML=x;if(du&&c.classList.contains('on'))setTimeout(()=>snd('place'),du*1000);
 clearTimeout(c._t);c._t=setTimeout(()=>{if(c._h===h)L.innerHTML=hsI(h)},1300)}
// ---- abrir, cerrar, seguir al juego ----
function open(i){if(!H)return false;if(on){if(i!==cur&&list().indexOf(i)>=0)jump(i);return true}
 if(!H.canAct()||list().indexOf(i)<0)return false;
 cur=i;on=true;cnt=null;mk();document.documentElement.classList.add('mufoc');paint();lay();if(!raf)raf=requestAnimationFrame(tick);
 if(typeof render=='function')render();   // el tablero toma los márgenes del enfoque; sync() mueve la cámara
 return true}
function close(silent){if(!on)return;on=false;document.documentElement.classList.remove('mufoc');
 try{const st=H.stage();if(st&&st.focus)st.focus(-1)}catch(e){}
 if(el){const e=el;e.classList.add('out');setTimeout(()=>e.remove(),240)}el=null;cancelAnimationFrame(raf);raf=0;
 if(!silent){snd('tick');setTimeout(()=>{if(typeof render=='function')render()},0)}}
function sync(){if(!on||!el)return;const g=G();if(!H.canAct()||g.own[cur]!==H.me()){close();return}
 paint();lay();const st=H.stage();if(H.is3d()&&st&&st.focus)st.focus(cur,0)}
addEventListener('keydown',e=>{if(!on)return;const k=e.key;if(k=='Escape')close();else if(k=='ArrowLeft'||k=='ArrowRight')arrow(k=='ArrowLeft'?'l':'r');else return;e.preventDefault();e.stopPropagation()},true);
let rz=0;addEventListener('resize',()=>{if(!on)return;clearTimeout(rz);rz=setTimeout(()=>{if(on){lay();if(typeof render=='function')render()}},140)});
window.MENF={init:h=>{H=h},open,close,sync,can,get on(){return on},bot:()=>on?botPx||lay():0};
// ---- estilos (Cálida: tokens de ui.css) ----
const css=document.createElement('style');css.textContent=`
html.mufoc .mu-cam{display:none!important}
html.mufoc .mu-hud>:not(.mu-top){opacity:0!important;visibility:hidden!important;pointer-events:none!important}
.mf{--mf-ok:#2e8b57;position:fixed;left:0;right:0;bottom:0;top:var(--mu-t,64px);z-index:64;font:600 14px/1.25 var(--ui-font);color:var(--ui-text);touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
html[data-tema=noche] .mf{--mf-ok:#7fd6a0}
.mf.out{pointer-events:none}.mf.out>*{animation:mfOut .22s ease both!important}   /* sin opacidad en .mf: si no, el backdrop-filter de .mf-blur no ve el tablero */
.mf button{font-family:var(--ui-font);-webkit-tap-highlight-color:transparent}
.mf-blur{position:absolute;inset:0;animation:mfIn .3s ease both;-webkit-backdrop-filter:blur(3.5px) brightness(.66) saturate(.85);backdrop-filter:blur(3.5px) brightness(.66) saturate(.85)}
.mf.d2 .mf-blur{background:var(--ui-scrim)}
.mf-x,.mf-ar,.mf-fi{width:48px;height:48px;padding:0;border-radius:999px;border:1px solid var(--ui-line);background:var(--ui-panel);color:var(--ui-icon);display:grid;place-items:center;box-shadow:var(--ui-shadow);cursor:pointer;transition:transform .1s}
.mf-x svg,.mf-ar svg{width:24px;height:24px}
.mf-x{position:absolute;top:8px;right:10px}.mf-x:active,.mf-fi:active{transform:scale(.92)}
.mf-ar{position:absolute;top:var(--mf-cy,40%);margin-top:-24px}.mf-ar.l{left:10px}.mf-ar.r{right:10px}.mf-ar:active{transform:scale(.92)}.mf-ar[hidden]{display:none}
.mf-fi{width:44px;height:44px;flex:none;box-shadow:none;background:var(--ui-chip)}.mf-fi svg{width:22px;height:22px}
.mf-bts{position:absolute;left:0;right:0;bottom:calc(var(--mf-pan,120px) + 12px);display:flex;justify-content:center;gap:14px;pointer-events:none}
.mf-bt{pointer-events:auto;min-width:132px;height:64px;padding:0 22px;border-radius:999px;border:1px solid var(--ui-line);background:var(--ui-panel);color:var(--ui-text);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font:800 19px/1 var(--ui-font);box-shadow:var(--ui-shadow);cursor:pointer;transition:transform .1s,opacity .2s;animation:mfPop .34s cubic-bezier(.2,1.5,.5,1) both}
.mf-bt small{font:700 13px/1 var(--ui-font);color:var(--ui-sub)}
.mf-bt.mg{position:absolute;left:50%;translate:-50% 0;bottom:calc(var(--mf-pan,120px) + 88px);height:44px;min-width:0;font-size:16px;flex-direction:row;gap:8px}.mf-bt.mg[hidden]{display:none}
.mf-bt.ms{background:var(--ui-accent);color:var(--ui-on);border-color:transparent}.mf-bt.ms small{color:var(--ui-on);opacity:.85}
.mf-bt.off{opacity:.5}.mf-bt:active{transform:scale(.94)}.mf-bt[hidden]{display:none}
.mf-sh{animation:mfSh .4s!important}
.mf-pan{position:absolute;left:0;right:0;bottom:0;margin:0 auto;max-width:520px;box-sizing:border-box;padding:12px 14px calc(12px + env(safe-area-inset-bottom));background:var(--ui-sheet);border:1px solid var(--ui-line);border-bottom:0;border-radius:var(--ui-r,22px) var(--ui-r,22px) 0 0;box-shadow:var(--ui-shadow);display:flex;flex-direction:column;gap:10px;animation:mfUp .3s cubic-bezier(.2,1,.4,1) both}
@media(min-width:768px){.mf-pan{bottom:12px;border-bottom:1px solid var(--ui-line);border-radius:var(--ui-r,22px)}}
@media(max-height:480px){.mf-pan{padding-top:8px;padding-bottom:8px;gap:6px}.mf-bt{height:52px}}
.mf-hd{display:flex;align-items:center;gap:10px;min-width:0}
.mf-sw{width:16px;height:16px;border-radius:999px;flex:none;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}
.mf-nm{font:800 18px/1.1 var(--ui-font);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mf-rt{color:var(--ui-sub);font-weight:700;white-space:nowrap}.mf-rt b{color:var(--ui-text)}
.mf-row{display:flex;align-items:center;gap:10px}
.mf-grp{display:flex;gap:6px;flex:1;min-width:0}
.mf-gc{position:relative;flex:1 1 0;min-width:0;max-width:120px;height:46px;padding:4px 6px 0;border-radius:12px;border:1px solid var(--ui-line);background:var(--ui-chip);color:var(--ui-text);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font:700 11px/1 var(--ui-font);cursor:pointer;overflow:hidden}
.mf-gc::before{content:'';position:absolute;left:8px;right:8px;top:0;height:4px;border-radius:0 0 4px 4px;background:var(--pc)}
.mf-gc em{font-style:normal;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mf-gc.on{border-color:var(--ui-accent);box-shadow:inset 0 0 0 1px var(--ui-accent)}
.mf-gc.ot{border-style:dashed;color:var(--ui-sub)}.mf-gc.mg{opacity:.6}
.mf-gc.bl,.mf-card.bl{animation:mfBl .46s 3}
.mf-cash{position:relative;display:flex;align-items:center;gap:6px;font:800 20px/1 var(--ui-font);white-space:nowrap}
.mf-cash svg{width:22px;height:22px;color:var(--ui-icon)}.mf-cash b{display:inline-block}
.mf-cash.dn b{animation:mfDn .7s}.mf-cash.up b{animation:mfUc .7s}
.mf-dl{position:absolute;right:0;bottom:100%;font:800 15px/1 var(--ui-font);font-style:normal;pointer-events:none;animation:mfDl 1.1s ease-out both}
.mf-dl.dn{color:var(--ui-accent)}.mf-dl.up{color:var(--mf-ok)}
.mf-hs{display:flex;gap:2px;align-items:flex-end;min-height:10px;--hw:10px}
.mf-h{display:inline-block;flex:none;width:var(--hw,12px);height:var(--hw,12px);background:linear-gradient(#1d6e3c 0 46%,#2e9e57 46%);clip-path:polygon(50% 0,100% 46%,100% 100%,0 100%,0 46%)}
.mf-h.ht{width:calc(var(--hw,12px)*2);background:linear-gradient(#8e1b1b 0 32%,#c62828 32%);clip-path:polygon(10% 0,90% 0,100% 32%,100% 100%,0 100%,0 32%)}
.mf-car{position:absolute;left:0;right:0;top:0;bottom:var(--mf-bot,200px);pointer-events:none}
.mf-card{position:absolute;left:50%;top:50%;width:min(220px,56vw);box-sizing:border-box;border-radius:16px;background:var(--ui-sheet);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow);overflow:hidden;pointer-events:auto;cursor:pointer;transition:transform .45s cubic-bezier(.3,1.15,.4,1),filter .45s,opacity .45s}
.mf-card.nt{transition:none}.mf-card.mg .mf-lot{opacity:.4}
.mf-cb{background:var(--gc);color:var(--go);padding:12px;min-height:56px;display:grid;place-items:center;text-align:center;font:800 17px/1.15 var(--ui-font)}
.mf-lot{--hw:34px;position:relative;height:clamp(64px,15vh,116px);margin:0 12px;padding-bottom:8px;display:flex;align-items:flex-end;justify-content:center;gap:8px;border-bottom:2px dashed var(--ui-line)}
.mf-cr{padding:10px 12px 14px;text-align:center;color:var(--ui-sub);font-weight:700}.mf-cr b{color:var(--ui-text);font-size:18px}
.mf-lot .nw{animation:mfDrop .56s cubic-bezier(.3,0,.6,1) var(--dl,0s) both}
.mf-lot .up{animation:mfRise .5s ease-in both}.mf-lot .ab,.mf-lot .pop{position:absolute;left:50%;bottom:8px;margin-left:calc(var(--hw)*-1)}
.mf-lot .jn{animation:mfJn .42s ease-in both}.mf-lot .pop{animation:mfPopH .56s cubic-bezier(.2,1.6,.5,1) .38s both}
.mf-dust{position:absolute;left:50%;bottom:0;width:130px;height:30px;margin-left:-65px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.8),rgba(255,255,255,0));opacity:0;pointer-events:none;animation:mfDust .6s ease-out var(--dl,0s) both}
@keyframes mfIn{from{opacity:0}}@keyframes mfOut{to{opacity:0}}
@keyframes mfPop{from{transform:scale(.6);opacity:0}}@keyframes mfUp{from{transform:translateY(40px);opacity:0}}
@keyframes mfSh{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
@keyframes mfBl{50%{background:#ffc400;box-shadow:0 0 0 4px rgba(255,196,0,.55)}}
@keyframes mfDn{30%{color:var(--ui-accent);transform:scale(1.12)}}@keyframes mfUc{30%{color:var(--mf-ok);transform:scale(1.12)}}
@keyframes mfDl{from{transform:translateY(6px);opacity:0}20%{opacity:1}to{transform:translateY(-26px);opacity:0}}
@keyframes mfDrop{0%{transform:translateY(-150px);opacity:0}12%{opacity:1}50%{transform:translateY(0) scale(1.15,.8)}66%{transform:translateY(-14px) scale(.95,1.05)}82%{transform:translateY(0) scale(1.05,.95)}91%{transform:translateY(-4px)}100%{transform:none}}
@keyframes mfRise{to{transform:translateY(-90px) scale(.3) rotate(25deg);opacity:0}}
@keyframes mfJn{to{transform:translate(var(--jx,0),-24px) scale(.25);opacity:0}}
@keyframes mfPopH{from{transform:scale(0)}}
@keyframes mfDust{0%{opacity:.9;transform:scale(.3)}100%{opacity:0;transform:scale(1.4) translateY(-8px)}}
@media(prefers-reduced-motion:reduce){.mf,.mf *{animation-duration:.01s!important;animation-delay:0s!important;transition:none!important}}`;
document.head.appendChild(css);
})();
