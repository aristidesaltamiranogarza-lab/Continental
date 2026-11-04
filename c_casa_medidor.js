// c_casa_medidor.js — CMED: medidor de FPS y memoria (para D7: medir en iPhone, laptop y Android débil).
// Se prende con F3, con ?medir en la dirección o con CMED.on(true). Se recuerda en localStorage casa_medir.
// Muestra: cuadros por segundo y el peor cuadro, llamadas de dibujo y triángulos, geometrías y texturas en la tarjeta,
// memoria de JS (solo Chrome) y los modelos de CGLB (puestos, HD, MB bajados, origen), tiempos de primera carga (página, primera
// imagen y modelos del piso), copias dibujadas como instancias y si HD se apagó por memoria.
(function(){
let el=null,on=false,fr=0,t0=0,peor=0,last=0,raf=0;
const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
function css(){if(document.getElementById('cmed-css'))return;const s=document.createElement('style');s.id='cmed-css';
 s.textContent='#cmed{position:fixed;left:calc(12px + env(safe-area-inset-left));top:calc(68px + env(safe-area-inset-top));z-index:60;pointer-events:none;'+
 'background:var(--ui-panel);color:var(--ui-text);border:1px solid var(--ui-line);border-radius:16px;box-shadow:var(--ui-shadow);padding:8px 12px;'+
 'font:700 12px/1.45 var(--ui-font,system-ui);font-variant-numeric:tabular-nums;min-width:150px}'+
 '#cmed b{color:var(--ui-accent);font-weight:800;font-size:15px}#cmed i{font-style:normal;color:var(--ui-sub)}#cmed .m-mal{color:var(--ui-icon)}';
 document.head.appendChild(s)}
const f1=x=>(Math.round(x*10)/10).toFixed(1),k=n=>n>=1e6?f1(n/1e6)+' M':n>=1e3?f1(n/1e3)+' k':String(n),seg=ms=>ms?f1(ms/1000):'—';
// tiempos de primera carga (desde que se abrió la página): página cargada y primera imagen de la casa; se miden aunque el medidor esté apagado
let t1=0;const n0=Date.now();(function mira(){const R=window.CASA3D&&CASA3D.R&&CASA3D.R(),r=R&&R.info&&R.info.render;if(r&&(r.frame||r.calls)){t1=performance.now();return}if(Date.now()-n0<18e4)requestAnimationFrame(mira)})();
let GPU='';const gpu=R=>{if(GPU)return GPU;try{const g=R.getContext(),e=g.getExtension('WEBGL_debug_renderer_info');
 GPU=String(e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER)).replace(/^ANGLE \([^,]*,\s*/,'').replace(/\s*\(0x[0-9a-f]+\)/i,'').replace(/\s*(Direct3D|OpenGL|Vulkan|Metal).*$/i,'').replace(/,.*$/,'').slice(0,40)}catch(e){GPU='?'}return GPU};
const nav=()=>{const e=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];return e&&e.loadEventEnd||0};
function pinta(fps){const R=window.CASA3D&&CASA3D.R&&CASA3D.R(),I=R&&R.info,M=performance.memory,G=window.CGLB&&CGLB.info();
 let h='<div><b class="'+(fps<30?'m-mal':'')+'">'+fps+'</b> <i>fps · peor</i> '+Math.round(peor)+' <i>ms</i></div>';
 if(I)h+='<div>'+I.render.calls+' <i>llamadas ·</i> '+k(I.render.triangles)+' <i>triáng.</i></div><div>'+I.memory.geometries+' <i>geom. ·</i> '+I.memory.textures+' <i>texturas</i></div>';
 if(R){const X=window.RES&&RES.info();h+='<div>'+R.getPixelRatio()+' <i>px ·</i> '+R.domElement.width+'×'+R.domElement.height+(X&&X.tope?' <i>(auto)</i>':'')+'</div><div><i>'+gpu(R)+'</i></div>'}
 if(M)h+='<div>'+Math.round(M.usedJSHeapSize/1048576)+' <i>de</i> '+Math.round(M.jsHeapSizeLimit/1048576)+' <i>MB de JS</i></div>';
 if(G)h+='<div>'+G.puestos+' <i>modelos ('+G.hd+' HD) ·</i> '+f1(G.mb)+' <i>MB</i></div><div><i>'+G.calidad+' · '+G.origen+(G.cargando?' · bajando '+G.cargando:'')+(G.errores?' · '+G.errores+' errores':'')+'</i></div>';
 h+='<div>'+seg(nav())+' <i>s página ·</i> '+seg(t1)+' <i>s 1ª imagen</i></div>';
 if(G){h+='<div>'+(G.listo==null?'…':seg(G.listo))+' <i>s modelos del piso</i>'+(G.copias?' <i>·</i> '+G.copias[0]+' <i>copias en</i> '+G.copias[1]:'')+'</div>';
  if(G.sinHD)h+='<div class="m-mal">Solo Medio: '+G.sinHD+'</div>'}
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
