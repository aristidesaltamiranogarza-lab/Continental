// Vista "casa de muñecas" del 🧭: corte de la casa con los 4 pisos apilados, sus mesas y cuántos juegan.
// Tocas un piso → su spawn; tocas una mesa → junto a ella (CASA3D.ir). HTML/CSS, sin escena propia.
// CIR (c_casa_ir.js) le pasa el control si DH.ok(); si no carga o falla, queda la lista simple. Se carga ANTES de c_casa3d.js.
// Calidad: Ligero → lista; Medio → sin animación; Completo → entrada escalonada y mesas ocupadas que laten.
(function(){
let el=null,tm=0,last='',back=null;
const es=s=>typeof esc=='function'?esc(s):String(s);
const ok=()=>window.CALIDAD!=='ligero'&&!!(window.CASA3D&&CASA3D.on()&&window.CIR&&CIR.PISOS&&CIR.info);
function floors(){const H=window.CASA3D,here=H.piso();
 return CIR.PISOS.map(p=>{const can=H.can(p.id),me=p.id===here;
  const t=can?p.g.map(g=>{const i=CIR.info(g);if(!i)return '';
   return `<button class="dht${i.on?' on':''}" data-k="${p.id}:${g}" onclick="DH.go('${p.id}','${g}')" aria-label="${es(i.t)}: ${es(i.s||'mesa')}"><b>${i.e}</b><span>${es(i.t)}</span><small>${es(i.s||'mesa')}</small></button>`}).join(''):'';
  return `<div class="dhf dh-${p.id}${me?' here':''}${can?'':' off'}"${can?` onclick="if(event.target===this)DH.go('${p.id}')"`:''}>
<button class="dhn" data-k="${p.id}" ${can?`onclick="DH.go('${p.id}')"`:'disabled'} aria-label="${es(p.n)}${me?', estás aquí':''}">${p.n}${me?' <em>📍 estás aquí</em>':can?'':' <em>pronto</em>'}</button>
<div class="dhm">${t||(can?'<small class="dhv">sin mesas</small>':'')}</div></div>`+(p.id==='pb'?'<div class="dhg" aria-hidden="true"></div>':'')}).join('')}
function paint(){if(!el)return;const s=floors();if(s===last)return;last=s;
 const k=document.activeElement&&el.contains(document.activeElement)&&document.activeElement.dataset.k,b=el.querySelector('.dhb');b.innerHTML=s;
 const f=k&&b.querySelector(`[data-k="${k}"]`);if(f)f.focus()}
function btns(){return [...el.querySelectorAll('button:not([disabled])')]}
function key(e){if(!el)return;const k=e.key;
 if(k==='Escape'){e.preventDefault();close(1)}
 else if(k==='Tab'||/^Arrow/.test(k)){const L=btns(),i=L.indexOf(document.activeElement),d=(k==='Tab'?!e.shiftKey:k==='ArrowDown'||k==='ArrowRight')?1:-1;
  e.preventDefault();if(L.length)L[i<0?(d>0?0:L.length-1):(i+d+L.length)%L.length].focus()}
 e.stopPropagation()}   // que la casa no camine ni corte la cámara mientras está abierto
function open(){if(el)return;if(window.CUB3&&CUB3.isOpen())CUB3.close();if(window.JG3)JG3.close(1);if(typeof casaClose=='function')casaClose();
 back=document.activeElement;const anim=window.CALIDAD==='completo';
 el=document.createElement('div');el.id='dhw';el.className='dhw'+(anim?' anim qc':'');el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','dht');
 el.innerHTML=`<div class="dhh"><div class="dht0"><span id="dht">🧭 Ir a…</span><button class="dhx" onclick="DH.close(1)" aria-label="Cerrar">✕</button></div><div class="dhr" aria-hidden="true"></div><div class="dhb"></div></div>`;
 el.onclick=e=>{if(e.target===el)close(1)};document.body.appendChild(el);last='';paint();
 addEventListener('keydown',key,true);tm=setInterval(paint,2000);
 const f=el.querySelector('.here .dht,.here .dhn')||btns()[0];if(f)f.focus({preventScroll:true});
 if(anim)setTimeout(()=>el&&el.classList.remove('anim'),900);if(typeof sfx=='function')sfx('tick');if(typeof render=='function')render()}
function close(ret){if(!el)return;clearInterval(tm);removeEventListener('keydown',key,true);el.remove();el=null;if(typeof render=='function')render();
 if(ret){const b=document.querySelector('button[aria-label="Ir a…"]')||back;if(b&&b.focus)b.focus()}}
function go(id,g){const H=window.CASA3D;close();if(id===H.piso()&&!g)return;H.ir(id,g);if(typeof render=='function')render()}
window.DH={ok,open,close,go,isOpen:()=>!!el,toggle:()=>el?close(1):open()};
const css=document.createElement('style');css.textContent=`
.dhw{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(10,6,4,.62);padding:12px;box-sizing:border-box}
.dhh{position:relative;width:min(560px,100%);max-height:calc(100dvh - 24px);overflow:auto;display:flex;flex-direction:column;color:#f6ead2;font-size:14px;overscroll-behavior:contain}
.dht0{display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:16px;padding:0 4px 6px}
.dhx{background:none;border:0;color:inherit;font-size:18px;cursor:pointer;padding:4px 8px;border-radius:6px}
.dhr{height:34px;margin:0 6%;background:linear-gradient(#8a3b22,#5e2414);clip-path:polygon(50% 0,100% 100%,0 100%);flex:none}
.dhb{display:flex;flex-direction:column;border:4px solid #e9dcc0;border-top:0;border-radius:0 0 6px 6px;background:#e9dcc0;gap:4px}
.dhf{position:relative;padding:8px 10px 10px;background:linear-gradient(#5a3a24,#3d2716);box-shadow:inset 0 -6px 0 #b7894f,inset 0 -8px 0 #6d4a2c;cursor:pointer}
.dh-ter{background:linear-gradient(#f4a35e,#b45a3c 70%,#6d3a28);box-shadow:inset 0 -6px 0 #c9b28a}
.dh-ter::before{content:'';position:absolute;left:0;right:0;bottom:8px;height:10px;background:repeating-linear-gradient(90deg,#e9dcc0 0 3px,transparent 3px 14px);opacity:.5;pointer-events:none}
.dh-alta{background:linear-gradient(#4a3a5a,#2f2438)}
.dh-sot{background:linear-gradient(#2a2420,#14100d);box-shadow:inset 0 -6px 0 #4a3e34}
.dhg{height:8px;background:repeating-linear-gradient(90deg,#6b8a3a 0 10px,#55702d 10px 20px)}
.dhf.here{outline:3px solid #f4d58a;outline-offset:-3px}
.dhf.off{opacity:.45;cursor:default}
.dhn{all:unset;display:block;font-weight:700;cursor:pointer;padding:2px 4px;border-radius:6px;margin-bottom:6px}
.dhn em{font-style:normal;font-size:12px;font-weight:600;color:#f4d58a;margin-left:6px}
.dhm{position:relative;display:flex;flex-wrap:wrap;gap:6px}
.dht{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:6px;align-items:center;text-align:left;min-width:132px;flex:1 1 132px;padding:6px 9px;border-radius:9px;border:1px solid rgba(255,255,255,.22);background:rgba(0,0,0,.32);color:inherit;font:inherit;cursor:pointer}
.dht b{grid-row:1/3;font-size:22px;font-weight:400}
.dht small{opacity:.7;font-size:12px}
.dht.on{border-color:#7ad48a;background:rgba(40,90,50,.45)}.dht.on small{opacity:1;color:#9ff0ad}
.dhv{opacity:.6}
.dht:hover,.dhn:hover{background:rgba(255,255,255,.14)}
.dht:focus-visible,.dhn:focus-visible,.dhx:focus-visible{outline:2px solid #f4d58a;outline-offset:2px}
.dhw.anim .dhh{animation:dhIn .28s ease-out}.dhw.anim .dhf{animation:dhIn .35s ease-out both}
.dhw.anim .dhf:nth-child(2){animation-delay:.06s}.dhw.anim .dhf:nth-child(3){animation-delay:.12s}.dhw.anim .dhf:nth-child(5){animation-delay:.18s}
@keyframes dhIn{from{opacity:0;transform:translateY(10px)}}
.dhw.qc .dht.on b{animation:dhP 1.6s ease-in-out infinite}@keyframes dhP{50%{transform:scale(1.15)}}
@media (prefers-reduced-motion:reduce){.dhw .dhh,.dhw .dhf,.dhw .dht b{animation:none!important}}
@media (max-width:480px){.dhh{font-size:13px}.dht{min-width:0;flex-basis:calc(50% - 3px)}.dhr{height:26px}}`;
document.head.appendChild(css);
})();
