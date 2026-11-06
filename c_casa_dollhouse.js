// Vista "casa de muñecas" del 🧭: corte de la casa con los 4 pisos apilados, sus mesas y cuántos juegan.
// Tocas un piso → su spawn; tocas una mesa → junto a ella (CASA3D.ir). HTML/CSS, sin escena propia.
// CIR (c_casa_ir.js) le pasa el control si DH.ok(); si no carga o falla, queda la lista simple. Se carga ANTES de c_casa3d.js.
// Calidad: Ligero → lista; Medio → sin animación; Completo → entrada escalonada y mesas ocupadas que laten.
(function(){
let el=null,tm=0,last='',back=null;
const es=s=>typeof esc=='function'?esc(s):String(s);
const ok=()=>window.CALIDAD!=='ligero'&&!!(window.CASA3D&&CASA3D.on()&&window.CIR&&CIR.PISOS&&CIR.info);
const C={ter:'#F2B23A',alta:'#A88BE0',pb:'#E8834F',sot:'#B9A08A'};
const ic=n=>window.UI?UI.ico(n):'';
function floors(){const H=window.CASA3D,here=H.piso();
 return CIR.PISOS.map(p=>{const can=H.can(p.id),me=p.id===here;
  const t=can?p.g.map(g=>{const i=CIR.info(g);if(!i)return '';
   return `<button class="dht${i.on?' on':''}" data-k="${p.id}:${g}" onclick="DH.go('${p.id}','${g}')" aria-label="${es(i.t)}: ${es(i.s||'mesa')}"><b>${i.e}</b><span>${es(i.t)}</span><small>${i.on?'<i></i>':''}${es(i.s||'mesa')}</small></button>`}).join(''):'';
  return `<section class="dhf${me?' here':''}${can?'':' off'}" style="--c:${C[p.id]||'var(--ui-accent)'}">
<button class="dhn" data-k="${p.id}" ${can?`onclick="DH.go('${p.id}')"`:'disabled'} aria-label="${es(p.n)}${me?', estás aquí':''}"><span class="dhpi">${p.i||''}</span><span class="dhnt">${p.n}</span>${me?'<em>Estás aquí</em>':can?`<span class="dhgo">${ic('abajo')}</span>`:'<em class="pr">Pronto</em>'}</button>
<div class="dhm">${t||(can?'<small class="dhv">Sin mesas</small>':'')}</div></section>`+(p.id==='pb'?'<div class="dhg" aria-hidden="true"><span>calle</span></div>':'')}).join('')}
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
 el.innerHTML=`<div class="dhh ui"><div class="dht0"><span class="dhic">${ic('brujula')}</span><div><h2 id="dht">Ir a…</h2><small>Elige un piso o una mesa</small></div><button class="ui-rb dhx" onclick="DH.close(1)" aria-label="Cerrar">${ic('x')}</button></div><div class="dhr" aria-hidden="true"></div><div class="dhb"></div></div>`;
 el.onclick=e=>{if(e.target===el)close(1)};document.body.appendChild(el);last='';paint();
 addEventListener('keydown',key,true);tm=setInterval(paint,2000);
 const f=el.querySelector('.here .dht,.here .dhn')||btns()[0];if(f)f.focus({preventScroll:true});
 if(anim)setTimeout(()=>el&&el.classList.remove('anim'),900);if(typeof sfx=='function')sfx('tick');if(typeof render=='function')render()}
function close(ret){if(!el)return;clearInterval(tm);removeEventListener('keydown',key,true);el.remove();el=null;if(typeof render=='function')render();
 if(ret){const b=document.querySelector('button[aria-label="Ir a…"]')||back;if(b&&b.focus)b.focus()}}
function go(id,g){const H=window.CASA3D;close();if(id===H.piso()&&!g)return;H.ir(id,g);if(typeof render=='function')render()}
window.DH={ok,open,close,go,isOpen:()=>!!el,toggle:()=>el?close(1):open()};
const css=document.createElement('style');css.textContent=`
.dhw{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:var(--ui-scrim);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);padding:16px;box-sizing:border-box;--dh-ok:#2E8A4E}
html[data-tema=noche] .dhw{--dh-ok:#86D995}
.dhh{position:relative;width:min(620px,100%);max-height:calc(100dvh - 32px);overflow:auto;display:flex;flex-direction:column;background:var(--ui-sheet);color:var(--ui-text);font:600 14px var(--ui-font);border:1px solid var(--ui-line);border-radius:var(--ui-r);box-shadow:var(--ui-shadow);padding:16px 18px 18px;box-sizing:border-box;overscroll-behavior:contain}
.dht0{display:flex;align-items:center;gap:12px;padding-bottom:4px}
.dht0>div{flex:1;min-width:0}
.dht0 h2{margin:0;font:800 21px/1.15 var(--ui-font);letter-spacing:-.01em;color:var(--ui-text)}
.dht0 small{display:block;color:var(--ui-sub);font-size:13px;margin-top:2px}
.dhic{flex:none;width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:var(--ui-chip);color:var(--ui-icon)}
.dhic .ui-ico{width:24px;height:24px}
.dhx{flex:none}
.dhr{height:22px;margin:8px 12% 0;background:var(--ui-chip);clip-path:polygon(50% 0,100% 100%,0 100%);flex:none}
.dhb{display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:0 0 18px 18px;background:var(--ui-chip)}
.dhf{position:relative;padding:10px 12px 12px;border-radius:16px;background:var(--ui-sheet);border:1px solid var(--ui-line);box-shadow:inset 4px 0 0 var(--c)}
.dhf.here{border-color:var(--ui-accent);box-shadow:inset 4px 0 0 var(--c),0 0 0 1px var(--ui-accent)}
.dhf.off{opacity:.5}
.dhn{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;min-height:40px;padding:2px 6px 2px 2px;margin-bottom:8px;border-radius:12px;cursor:pointer;font:800 16px var(--ui-font);color:var(--ui-text)}
.dhn[disabled]{cursor:default}
.dhpi{flex:none;width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 22%,transparent);color:var(--ui-text)}
.dhpi .pic{width:24px;height:24px}
.dhnt{flex:1;min-width:0}
.dhn em{font:800 11px var(--ui-font);font-style:normal;text-transform:uppercase;letter-spacing:.06em;padding:5px 10px;border-radius:999px;background:var(--ui-accent);color:var(--ui-on)}
.dhn em.pr{background:var(--ui-chip);color:var(--ui-sub)}
.dhgo{display:grid;place-items:center;color:var(--ui-sub);opacity:0;transition:opacity .15s}
.dhgo .ui-ico{width:20px;height:20px;transform:rotate(-90deg)}
.dhn:hover .dhgo,.dhn:focus-visible .dhgo{opacity:1}
.dhm{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}
.dht{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:10px;align-items:center;text-align:left;min-height:58px;padding:8px 12px 8px 8px;border-radius:14px;border:1px solid var(--ui-line);background:var(--ui-field);color:var(--ui-text);font:inherit;cursor:pointer;transition:border-color .15s,transform .15s}
.dht b{grid-row:1/3;width:40px;height:40px;display:grid;place-items:center;border-radius:11px;background:var(--ui-chip);font-size:22px;font-weight:400}
.dht b svg,.dht b img{display:block;width:32px;height:32px}
.dht span{font:800 15px/1.15 var(--ui-font);overflow-wrap:break-word;min-width:0}
.dht small{display:flex;align-items:center;gap:5px;color:var(--ui-sub);font:700 12px var(--ui-font)}
.dht.on small{color:var(--dh-ok)}
.dht small i{width:7px;height:7px;border-radius:50%;background:currentColor;flex:none}
.dhv{color:var(--ui-sub);padding:4px 2px}
.dht:hover{border-color:var(--ui-accent)}
.dhn:hover{background:var(--ui-chip)}
.dht:active{transform:scale(.98)}
.dht:focus-visible,.dhn:focus-visible,.dhx:focus-visible{outline:3px solid var(--ui-accent);outline-offset:2px}
.dhg{display:flex;align-items:center;gap:8px;margin:2px 4px;color:var(--ui-sub);font:800 10px var(--ui-font);text-transform:uppercase;letter-spacing:.14em}
.dhg::before,.dhg::after{content:'';flex:1;height:0;border-top:2px dashed var(--ui-line)}
.dhw.anim .dhh{animation:dhIn .25s ease-out}.dhw.anim .dhf{animation:dhIn .32s ease-out both}
.dhw.anim .dhf:nth-child(2){animation-delay:.05s}.dhw.anim .dhf:nth-child(3){animation-delay:.1s}.dhw.anim .dhf:nth-child(5){animation-delay:.15s}
@keyframes dhIn{from{opacity:0;transform:translateY(8px)}}
.dhw.qc .dht.on small i{animation:dhP 1.6s ease-in-out infinite}@keyframes dhP{50%{opacity:.35;transform:scale(1.4)}}
@media (prefers-reduced-motion:reduce){.dhw .dhh,.dhw .dhf,.dhw .dht small i{animation:none!important}}
@media (max-width:600px){.dhw{align-items:flex-end;padding:0}.dhh{width:100%;max-height:92dvh;border-radius:var(--ui-r) var(--ui-r) 0 0;padding:14px 12px calc(14px + env(safe-area-inset-bottom,0px))}
 .dhm{grid-template-columns:1fr 1fr;gap:6px}.dhf{padding:8px 8px 10px 10px}.dht{min-width:0;padding:7px;column-gap:7px}.dht b{width:30px;height:30px;border-radius:9px}.dht b svg,.dht b img{width:26px;height:26px}.dht span{font-size:13px}.dhr{height:16px}.dhb{padding:8px}}
`;
document.head.appendChild(css);
})();
