// c_plano_zoom.js — PZOOM: acercar el plano 2D (PLANO2D) con dos dedos, rueda o doble toque, y arrastrar ya de cerca. Solo se mueve
// el plano (dentro de su caja): botones, pestañas y tarjetas se quedan donde están. El estado sobrevive a los render (PLANO2D.html lo
// pone con PZOOM.css() en .pl-lib). La página no hace zoom sobre el plano (touch-action:none). Se carga después de c_plano2d.js.
(function(){
let k=1,x=0,y=0,arr=0;const P=new Map();let g=null;   // g: gesto en curso
const MAX=3.2,box=()=>document.querySelector('.pl-box'),lib=()=>document.querySelector('.pl-lib');
function lim(){const b=box();if(!b)return;const w=b.clientWidth,h=b.clientHeight;k=Math.min(MAX,Math.max(1,k));x=Math.min(0,Math.max(w*(1-k),x));y=Math.min(0,Math.max(h*(1-k),y))}
const css=()=>k>1.001?`transform:translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${k.toFixed(3)})`:'';
function pon(an){const l=lib();if(!l)return;l.classList.toggle('suave',!!an);l.style.transform=k>1.001?`translate(${x}px,${y}px) scale(${k})`:''}
// acercar a escala n alrededor del punto (px,py) de la caja
function zoomA(n,px,py){const k0=k;k=Math.min(MAX,Math.max(1,n));x=px-(px-x)*k/k0;y=py-(py-y)*k/k0;lim()}
let antes=1;const fin=()=>{if((antes>1.001)!==(k>1.001)&&typeof render=='function')render();antes=k};
const rel=e=>{const r=box().getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top]};
let tap=0,tx=0,ty=0;
addEventListener('pointerdown',e=>{if(!e.target.closest||!e.target.closest('.pl-area')||!box())return;P.set(e.pointerId,rel(e));
 if(P.size===2){const [a,b]=[...P.values()];g={t:'pinch',d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,k0:k,mx:(a[0]+b[0])/2,my:(a[1]+b[1])/2,x0:x,y0:y}}
 else if(P.size===1){const [px,py]=rel(e);g={t:'pan',sx:px,sy:py,x0:x,y0:y,mov:false};
  const n=performance.now();if(e.target.closest('button'))tap=0;else if(n-tap<300&&Math.hypot(px-tx,py-ty)<30){tap=0;zoomA(k>1.2?1:2.2,px,py);pon(true);fin();g=null;arr=n;return}tap=n;tx=px;ty=py}},true);
addEventListener('pointermove',e=>{if(!P.has(e.pointerId)||!g)return;P.set(e.pointerId,rel(e));
 if(g.t==='pinch'&&P.size>=2){const [a,b]=[...P.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
  const n=Math.min(MAX,Math.max(1,g.k0*d/g.d));k=n;x=mx-(g.mx-g.x0)*n/g.k0;y=my-(g.my-g.y0)*n/g.k0;lim();pon();arr=performance.now()}
 else if(g.t==='pan'&&k>1.001){const [px,py]=rel(e);if(!g.mov&&Math.hypot(px-g.sx,py-g.sy)>6)g.mov=true;if(g.mov){x=g.x0+px-g.sx;y=g.y0+py-g.sy;lim();pon();arr=performance.now()}}},true);
const suelta=e=>{if(!P.delete(e.pointerId))return;if(P.size===0){g=null;fin()}else if(g&&g.t==='pinch'){const [p]=[...P.values()];g={t:'pan',sx:p[0],sy:p[1],x0:x,y0:y,mov:true}}};
addEventListener('pointerup',suelta,true);addEventListener('pointercancel',suelta,true);
// después de arrastrar o pellizcar, el toque no abre la mesa
addEventListener('click',e=>{if(performance.now()-arr<250&&e.target.closest&&e.target.closest('.pl-area')){e.preventDefault();e.stopPropagation()}},true);
addEventListener('wheel',e=>{const a=e.target.closest&&e.target.closest('.pl-area');if(!a||!box())return;e.preventDefault();const [px,py]=rel(e);zoomA(k*Math.exp(-e.deltaY*.0018),px,py);pon();fin()},{passive:false});
addEventListener('gesturestart',e=>{if(e.target.closest&&e.target.closest('.pl'))e.preventDefault()});   // Safari: sin zoom de página sobre el plano
window.PZOOM={css,k:()=>k,cero:()=>{k=1;x=0;y=0;antes=1;pon(true)}};
})();
