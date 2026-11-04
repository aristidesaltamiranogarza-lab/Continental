// c_casa_medidor.js — CMED: medidor de FPS y memoria (para D7: medir en iPhone, laptop y Android débil).
// Se prende con F3, con ?medir en la dirección o con CMED.on(true). Se recuerda en localStorage casa_medir.
// Muestra: cuadros por segundo y el peor cuadro, llamadas de dibujo y triángulos, geometrías y texturas en la tarjeta,
// memoria de JS (solo Chrome) y los modelos de CGLB (puestos, HD, MB bajados, origen).
(function(){
let el=null,on=false,fr=0,t0=0,peor=0,last=0,raf=0;
const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
function css(){if(document.getElementById('cmed-css'))return;const s=document.createElement('style');s.id='cmed-css';
 s.textContent='#cmed{position:fixed;left:calc(12px + env(safe-area-inset-left));top:calc(68px + env(safe-area-inset-top));z-index:60;pointer-events:none;'+
 'background:var(--ui-panel);color:var(--ui-text);border:1px solid var(--ui-line);border-radius:16px;box-shadow:var(--ui-shadow);padding:8px 12px;'+
 'font:700 12px/1.45 var(--ui-font,system-ui);font-variant-numeric:tabular-nums;min-width:150px}'+
 '#cmed b{color:var(--ui-accent);font-weight:800;font-size:15px}#cmed i{font-style:normal;color:var(--ui-sub)}#cmed .m-mal{color:var(--ui-icon)}';
 document.head.appendChild(s)}
const f1=x=>(Math.round(x*10)/10).toFixed(1),k=n=>n>=1e6?f1(n/1e6)+' M':n>=1e3?f1(n/1e3)+' k':String(n);
function pinta(fps){const R=window.CASA3D&&CASA3D.R&&CASA3D.R(),I=R&&R.info,M=performance.memory,G=window.CGLB&&CGLB.info();
 let h='<div><b class="'+(fps<30?'m-mal':'')+'">'+fps+'</b> <i>fps · peor</i> '+Math.round(peor)+' <i>ms</i></div>';
 if(I)h+='<div>'+I.render.calls+' <i>llamadas ·</i> '+k(I.render.triangles)+' <i>triáng.</i></div><div>'+I.memory.geometries+' <i>geom. ·</i> '+I.memory.textures+' <i>texturas</i></div>';
 if(M)h+='<div>'+Math.round(M.usedJSHeapSize/1048576)+' <i>de</i> '+Math.round(M.jsHeapSizeLimit/1048576)+' <i>MB de JS</i></div>';
 if(G)h+='<div>'+G.puestos+' <i>modelos ('+G.hd+' HD) ·</i> '+f1(G.mb)+' <i>MB</i></div><div><i>'+G.calidad+' · '+G.origen+(G.cargando?' · bajando '+G.cargando:'')+(G.errores?' · '+G.errores+' errores':'')+'</i></div>';
 el.innerHTML=h}
function tick(now){raf=requestAnimationFrame(tick);if(last)peor=Math.max(peor,now-last);last=now;fr++;
 if(now-t0>=1000){pinta(Math.round(fr*1000/(now-t0)));fr=0;t0=now;peor=0}}
function set(v){on=!!v;ls.set('casa_medir',on?'1':'0');
 if(on){css();if(!el){el=document.createElement('div');el.id='cmed';el.className='ui';el.setAttribute('aria-hidden','true');document.body.appendChild(el)}el.style.display='';el.textContent='…';fr=0;t0=performance.now();last=0;peor=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(tick)}
 else{cancelAnimationFrame(raf);if(el)el.style.display='none'}}
addEventListener('keydown',e=>{if(e.key==='F3'){e.preventDefault();set(!on)}});
window.CMED={on:v=>set(v===undefined?!on:v),activo:()=>on};
const ini=()=>{if(/[?&]medir\b/.test(location.search)||ls.get('casa_medir')==='1')set(true)};
document.readyState==='loading'?addEventListener('DOMContentLoaded',ini):ini();
})();
