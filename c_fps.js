// FPS: limita los cuadros por segundo para ahorrar batería y mide el costo de dibujar.
// Envuelve requestAnimationFrame: en PC sin tope con actividad del jugador; en pantalla táctil 60 mientras tocas; sin tocar nada por 4 s, 30.
// FPS.modo('auto'|'max') (se guarda). Medidor: F4, ?fps en la dirección o FPS.ver(true).
(function(){
const nRAF=window.requestAnimationFrame.bind(window),nCAF=window.cancelAnimationFrame.bind(window);
const mob=matchMedia('(pointer:coarse)').matches,IDLE=4000;
let modo='auto';try{modo=localStorage.getItem('fps_modo')||'auto'}catch(e){}
let cola=new Map(),sig=1,pend=0,ultIn=performance.now();
const toque=()=>{ultIn=performance.now()};
['pointerdown','pointermove','keydown','wheel','touchstart'].forEach(e=>addEventListener(e,toque,{passive:true,capture:true}));
function tope(t){if(modo==='max')return 0;const act=t-ultIn<IDLE||!!document.pointerLockElement;return act?(mob?1000/60:0):1000/30}   // celular: 60 mientras tocas (tope 60 aunque la pantalla sea de 120), 30 en reposo
// medidor
let ver=false,box=null,nCu=0,tCpu=0,t1=0,luces=0,tLuz=0,ren=null;
let est=1000/60,acc=0,tN=0;   // tope por refrescos de pantalla (cada 2 a 60 Hz): parejo aunque las marcas de tiempo bailen
function tick(t){pend=0;const d=tN?t-tN:est;tN=t;if(d>4&&d<40)est+=(d-est)*.1;const iv=tope(t);
 if(iv){acc+=Math.max(1,Math.round(d/est));if(acc<Math.max(1,Math.round(iv/est))){pend=nRAF(tick);return}acc=0}
 const q=cola;cola=new Map();const c0=ver?performance.now():0;
 if(ver){ren=window.CASA3D&&CASA3D.R&&CASA3D.R();if(ren){ren.info.autoReset=false;ren.info.reset()}}
 q.forEach(f=>{try{f(t)}catch(e){console.error(e)}});
 if(ver)med(t,performance.now()-c0);
 if(cola.size&&!pend)pend=nRAF(tick)}
window.requestAnimationFrame=function(f){const id=sig++;cola.set(id,f);if(!pend)pend=nRAF(tick);return id};
window.cancelAnimationFrame=function(id){cola.delete(id)};
function med(t,cpu){nCu++;tCpu+=cpu;if(t-t1<1000)return;
 const fps=nCu*1000/(t-t1),ms=tCpu/nCu;nCu=0;tCpu=0;t1=t;
 if(t-tLuz>3000&&window.CASA3D&&CASA3D.sc){tLuz=t;luces=0;let s=0;const sc=CASA3D.sc();sc&&sc.traverse(o=>{if(o.isLight&&o.visible&&o.intensity>0){luces++;if(o.castShadow)s++}});luces+=' ('+s+' con sombra)'}
 const i=ren&&ren.info,cv=ren&&ren.domElement;
 box.textContent=[
  'FPS '+fps.toFixed(0)+'  JS '+ms.toFixed(1)+' ms  '+(modo==='max'?'sin tope':(t-ultIn<IDLE?'activo':'en reposo')),
  i?'Dibujos '+i.render.calls+'  Triángulos '+(i.render.triangles/1000).toFixed(0)+'k':'',
  i?'Geometrías '+i.memory.geometries+'  Texturas '+i.memory.textures+'  Shaders '+(i.programs?i.programs.length:0):'',
  'Luces '+luces,
  cv?'Lienzo '+cv.width+'x'+cv.height+'  densidad '+ren.getPixelRatio().toFixed(2)+(ren.shadowMap.enabled?'  sombras':''):'',
  window.CASA3D&&CASA3D.piso?'Piso '+CASA3D.piso():''
 ].filter(Boolean).join('\n')}
function setVer(v){ver=!!v;if(ver&&!box){box=document.createElement('pre');box.style.cssText='position:fixed;left:8px;bottom:8px;z-index:99999;margin:0;padding:6px 8px;font:11px/1.35 ui-monospace,monospace;color:#fff;background:rgba(0,0,0,.65);border-radius:6px;pointer-events:none;white-space:pre';document.body.appendChild(box);t1=performance.now();nCu=0;tCpu=0;tLuz=0}
 if(box)box.style.display=ver?'block':'none';if(!ver&&ren)ren.info.autoReset=true}
addEventListener('keydown',e=>{if(e.key==='F4'){e.preventDefault();setVer(!ver)}});
if(/[?&]fps\b/.test(location.search))addEventListener('DOMContentLoaded',()=>setVer(true));
window.FPS={modo(m){if(m){modo=m;try{localStorage.setItem('fps_modo',m)}catch(e){}}return modo},ver:setVer};
})();
