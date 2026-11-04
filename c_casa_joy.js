// Casa en el celular: joystick abajo a la izquierda para caminar (el resto de la pantalla: arrastrar = girar la cámara)
// y, en iPhone/iPad desde Safari, un aviso para "Agregar a inicio" y verla en pantalla completa.
// c_casa3d.js lee JOY.x / JOY.y (-1..1; y negativo = adelante) cada cuadro. Solo se ve con la casa abierta (html.h3on) y pantalla táctil.
(function(){
const touch=matchMedia('(pointer:coarse)').matches||'ontouchstart' in window;
const J={x:0,y:0,on:false};window.JOY=J;if(!touch)return;
const css=document.createElement('style');css.textContent=`#joy{position:fixed;left:calc(18px + env(safe-area-inset-left));bottom:calc(152px + env(safe-area-inset-bottom));width:124px;height:124px;border-radius:50%;z-index:6;display:none;touch-action:none;
 background:radial-gradient(circle,rgba(255,255,255,.16),rgba(255,255,255,.07));border:2px solid rgba(255,255,255,.35);box-shadow:0 2px 10px rgba(0,0,0,.25)}
html.h3on #joy{display:block}#joy i{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;background:rgba(255,255,255,.55);box-shadow:0 2px 6px rgba(0,0,0,.3);pointer-events:none}
#a2hs{position:fixed;left:12px;right:12px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:60;display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;background:rgba(20,24,40,.92);color:#fff;font:600 14px/1.35 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.4)}
#a2hs span{flex:1}#a2hs button{border:0;background:rgba(255,255,255,.15);color:#fff;border-radius:10px;padding:6px 10px;font:inherit}`;
document.head.appendChild(css);
const el=document.createElement('div');el.id='joy';el.innerHTML='<i></i>';const knob=el.firstChild;
let pid=null,cx=0,cy=0;const R=50;
function set(x,y){const d=Math.hypot(x,y),k=d>R?R/d:1;x*=k;y*=k;knob.style.transform=`translate(${x}px,${y}px)`;const m=Math.hypot(x,y)/R;J.x=m<.15?0:x/R;J.y=m<.15?0:y/R;J.on=m>=.15}
el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();pid=e.pointerId;const r=el.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;try{el.setPointerCapture(pid)}catch(_){}set(e.clientX-cx,e.clientY-cy)});
el.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;e.preventDefault();set(e.clientX-cx,e.clientY-cy)});
const end=e=>{if(e.pointerId!==pid)return;pid=null;set(0,0)};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
// aviso de "Agregar a inicio" (una vez; se puede cerrar)
function a2hs(){const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 let seen=false;try{seen=!!localStorage.getItem('casa_a2hs')}catch(_){}if(!ios||navigator.standalone||seen)return;
 const b=document.createElement('div');b.id='a2hs';b.innerHTML='<span>📲 Para jugar en pantalla completa: toca <b>Compartir</b> ⬆️ y luego <b>Agregar a inicio</b>.</span><button aria-label="Cerrar">✕</button>';
 b.querySelector('button').onclick=()=>{b.remove();try{localStorage.setItem('casa_a2hs','1')}catch(_){}};document.body.appendChild(b);setTimeout(()=>b.remove(),20000)}
const go=()=>{document.body.appendChild(el);const w=setInterval(()=>{if(document.documentElement.classList.contains('h3on')){clearInterval(w);a2hs()}},1000)};
if(document.body)go();else addEventListener('DOMContentLoaded',go);
})();
