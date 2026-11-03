// Rummy 2D: mesa plana de respaldo (celulares lentos o sin 3D). Arriba la mesa con los grupos en filas y una zona para combinación nueva; abajo el atril de madera.
// Lo maneja c_rummyui.js como window.R2 (ok, show, layout, sync, cam, sort), la misma API que tendrá el 3D. Arrastrar, o tocar y tocar, llama a RMU:
// RMU.can(id) si se puede levantar · RMU.pick(id|null) levantar o soltar la selección · RMU.put(id, a) con a {g, at} en el grupo g, {g:-1} combinación nueva o {r:at} al atril · RMU.rack(on) acercar o alejar el atril (tocarlo sin selección; tocar la mesa lo regresa).
// sync(s) recibe {mesa, atril, sel, bad:Set de grupos inválidos, nuevas:Set de fichas puestas este turno, lock:Set de grupos que no se pueden tocar, my}. NO cambia reglas.
(function(){
const RU=window.RUMMY;if(!RU){console.warn('Rummy 2D: falta rummy_reglas.js');return}
const INK=['#c0392b','#1f5fa8','#2b2b2b','#e07a10'];
let root,mesaEl,atrilEl,shown=false,st=null,drag=null,big=false,hv=null,lay='';
window.R2={ok:()=>true,
 show(on){if(on)build();if(shown===on)return;shown=on;if(root)root.style.display=on?'flex':'none'},
 layout(i){const k=i.t+','+i.b;if(!root||k===lay)return;lay=k;root.style.paddingTop=i.t+'px';root.style.paddingBottom=i.b+'px';draw()},
 sync(s){st=s;draw()},
 cam(c){big=c=='atril';if(root)root.classList.toggle('big',big);draw()},
 sort(){}};   // en 2D el reacomodo ya se anima solo (FLIP en draw)
function build(){if(root)return;root=document.createElement('div');root.id='r2root';
 root.innerHTML='<div class="r2mesa"></div><div class="r2atril"></div>';document.body.appendChild(root);mesaEl=root.firstChild;atrilEl=root.lastChild;
 root.addEventListener('pointerdown',pDown);addEventListener('pointermove',pMove);addEventListener('pointerup',pUp);addEventListener('pointercancel',()=>{if(drag){if(drag.gh)drag.gh.remove();drag=null;draw()}})}
// ---- dibujo: fichas de madera clara con el número pintado; el comodín lleva una carita ----
const face='<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.2" fill="#f6c34a" stroke="#b5462a" stroke-width="1.4"/><circle cx="7" cy="8" r="1.3" fill="#3a2a1a"/><circle cx="13" cy="8" r="1.3" fill="#3a2a1a"/><path d="M6 12q4 4 8 0" fill="none" stroke="#b5462a" stroke-width="1.5" stroke-linecap="round"/></svg>';
const tile=x=>`<div class="r2t${RU.isJ(x)?' j':''}${st.sel===x?' sel':''}${st.nuevas.has(x)?' nu':''}${drag&&drag.id===x?' dr':''}" data-id="${x}"${RU.isJ(x)?'':` style="color:${INK[RU.col(x)]}"`}>${RU.isJ(x)?face:RU.num(x)}</div>`;
function draw(){if(!root||!st||!shown)return;const old=rects(),W=root.clientWidth||innerWidth,n=st.atril.length;
 root.style.setProperty('--tw',Math.max(26,Math.min(42,W/17))+'px');
 root.style.setProperty('--rw',Math.max(26,Math.min(big?64:46,(W-24)/Math.max(big?5:8,Math.ceil(n/2))-5))+'px');
 mesaEl.innerHTML=st.mesa.map((g,k)=>`<div class="r2g${st.bad.has(k)?' bad':''}${st.lock.has(k)?' lk':''}" data-g="${k}">${g.map(tile).join('')}</div>`).join('')
  +(st.my?`<div class="r2g r2new" data-g="-1">＋ nueva</div>`:'')+(!st.mesa.length&&!st.my?'<div class="r2vac">La mesa está vacía.</div>':'');
 atrilEl.innerHTML=st.atril?`<div class="r2rk">${st.atril.map(tile).join('')}</div>`:'';atrilEl.style.display=st.atril?'':'none';flip(old)}
// FLIP: cada ficha se desliza desde donde estaba (al ordenar, al moverla o cuando otro reacomoda la mesa)
function rects(){const o={};if(root)root.querySelectorAll('.r2t[data-id]').forEach(e=>{if(!e.classList.contains('gh'))o[e.dataset.id]=e.getBoundingClientRect()});return o}
function flip(old){const mv=[];root.querySelectorAll('.r2t[data-id]:not(.gh)').forEach(e=>{const a=old[e.dataset.id];if(!a)return;const b=e.getBoundingClientRect(),dx=a.left-b.left,dy=a.top-b.top;
  if(Math.abs(dx)+Math.abs(dy)<2)return;e.style.transition='none';e.style.transform=`translate(${dx}px,${dy}px)`;mv.push(e)});
 if(!mv.length)return;root.offsetWidth;mv.forEach(e=>{e.style.transition='transform .28s cubic-bezier(.3,.9,.4,1)';e.style.transform=''})}
// ---- arrastrar y soltar (PC y celular) o tocar una ficha y luego el lugar ----
function pDown(e){if(!st||drag)return;const t=e.target.closest('.r2t');drag={id:t?+t.dataset.id:null,el:t,x0:e.clientX,y0:e.clientY,pid:e.pointerId,gh:null}}
function pMove(e){const d=drag;if(!d||e.pointerId!==d.pid||d.id==null)return;
 if(!d.gh){const dx=e.clientX-d.x0,dy=e.clientY-d.y0;if(dx*dx+dy*dy<64)return;if(!RMU.can(d.id)){drag=null;return}
  const r=d.el.getBoundingClientRect();d.ox=e.clientX-r.left;d.oy=e.clientY-r.top;d.gh=d.el.cloneNode(true);d.gh.classList.add('gh');d.gh.style.width=r.width+'px';d.gh.style.height=r.height+'px';
  root.appendChild(d.gh);d.el.classList.add('dr')}
 e.preventDefault();d.gh.style.transform=`translate(${e.clientX-d.ox}px,${e.clientY-d.oy}px) rotate(-4deg) scale(1.12)`;
 const h=spot(e.clientX,e.clientY);if(h!==hv){if(hv)hv.classList.remove('hv');hv=h;if(hv)hv.classList.add('hv')}}
function pUp(e){const d=drag;if(!d||e.pointerId!==d.pid)return;drag=null;if(hv){hv.classList.remove('hv');hv=null}
 if(d.gh){d.gh.remove();const a=target(e.clientX,e.clientY,d.id);if(a)RMU.put(d.id,a);else draw();return}
 const s=st.sel;
 if(d.id!=null){if(s==null||s===d.id)return RMU.pick(s===d.id?null:d.id);
  if(st.atril&&st.atril.includes(s)&&st.atril.includes(d.id))return RMU.pick(d.id)}   // otra ficha del atril: cambia la selección
 if(s!=null){const a=target(e.clientX,e.clientY,s);if(a)return RMU.put(s,a)}
 if(e.target.closest('.r2atril'))RMU.rack(!big);else if(big)RMU.rack(false)}
function spot(x,y){const el=document.elementFromPoint(x,y);return el&&root.contains(el)?el.closest('.r2g,.r2rk'):null}
// a dónde va: grupo (y en qué lugar), combinación nueva (también la mesa vacía) o el atril
function target(x,y,id){const el=document.elementFromPoint(x,y);if(!el||!root.contains(el))return null;
 if(el.closest('.r2atril'))return {r:idx(atrilEl,x,y,id)};const g=el.closest('.r2g');
 if(g){const k=+g.dataset.g;return k<0?{g:-1}:{g:k,at:idx(g,x,y,id)}}return el.closest('.r2mesa')?{g:-1}:null}
function idx(box,x,y,id){let i=0;box.querySelectorAll('.r2t[data-id]').forEach(t=>{if(+t.dataset.id===id)return;const r=t.getBoundingClientRect();if(y>r.bottom||y>=r.top&&x>r.left+r.width/2)i++});return i}
// ---- estilos ----
const css=document.createElement('style');css.textContent=`
#r2root{position:fixed;inset:0;z-index:1;display:none;flex-direction:column;box-sizing:border-box;background:radial-gradient(ellipse at 50% 0,#ffd9a8 0,#f2a96b 38%,#b9654a 100%);user-select:none;-webkit-user-select:none;touch-action:manipulation}
.r2mesa{flex:1;overflow:auto;display:flex;flex-wrap:wrap;align-content:flex-start;gap:10px 14px;padding:12px;margin:8px 10px 6px;border-radius:18px;
 background:repeating-linear-gradient(45deg,rgba(255,255,255,.05) 0 10px,transparent 10px 20px),linear-gradient(#f4ecd9,#e7dcc2);box-shadow:inset 0 2px 10px rgba(80,40,10,.25);border:3px solid #fff8ea}
.r2g{display:flex;flex-wrap:wrap;gap:2px;padding:4px;border-radius:10px;border:2px dashed transparent;min-height:calc(var(--tw)*1.32);min-width:calc(var(--tw)*1.2);align-items:center}
.r2g.bad{border-color:#d63a2a;background:rgba(214,58,42,.12)}.r2g.lk{opacity:.86}.r2g.hv{border-color:#2e8b57;background:rgba(46,139,87,.14)}
.r2new{border-color:rgba(120,80,40,.35);color:rgba(90,60,30,.6);font:700 13px system-ui,sans-serif;justify-content:center;padding:0 10px}
.r2vac{margin:auto;color:rgba(90,60,30,.55);font:600 15px system-ui,sans-serif}
.r2t{--s:var(--tw);width:var(--s);height:calc(var(--s)*1.32);display:flex;align-items:center;justify-content:center;border-radius:calc(var(--s)*.16);box-sizing:border-box;
 background:linear-gradient(160deg,#fbf0d6,#ead2a2 70%,#ddc088);box-shadow:0 2px 0 #b8935a,0 3px 5px rgba(60,30,10,.35);font:900 calc(var(--s)*.62)/1 Georgia,'Times New Roman',serif;
 touch-action:none;cursor:grab;position:relative}
.r2t svg{width:72%;height:72%}.r2t.nu{box-shadow:0 2px 0 #b8935a,0 0 0 2px #ffb300,0 3px 6px rgba(60,30,10,.35)}
.r2t.sel{transform:translateY(-6px);box-shadow:0 2px 0 #b8935a,0 0 0 3px #2e8b57,0 8px 12px rgba(60,30,10,.35)}.r2t.dr{opacity:.3}
.r2t.gh{position:fixed;left:0;top:0;z-index:5;pointer-events:none;opacity:.95;box-shadow:0 10px 20px rgba(40,20,5,.45)}
.r2atril{margin:0 8px 8px;padding:10px 10px 14px;border-radius:12px 12px 16px 16px;background:linear-gradient(#a9713f,#7d4f28);box-shadow:inset 0 2px 0 rgba(255,255,255,.25),0 4px 10px rgba(40,20,5,.4)}
.r2rk{display:flex;flex-wrap:wrap;gap:5px 5px;justify-content:center;min-height:calc(var(--rw)*1.32)}.r2rk .r2t{--s:var(--rw)}
#r2root.big .r2atril{padding:14px 10px 18px}`;
document.head.appendChild(css);
})();
