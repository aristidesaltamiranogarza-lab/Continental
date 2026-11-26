// c_mesa2d_zoom.js — MZOOM: pellizcar la mesa 2D redonda (.m2d-ronda) para acercarla y ver varias bajadas a la vez; con un dedo se mueve si está acercada.
// Ctrl+rueda en compu. Se guarda en variables de <html> para que sobreviva a cada render(). Pellizcar hacia afuera hasta 1 la regresa.
(()=>{const H=document.documentElement,MAX=3;let s=1,tx=0,ty=0,pt=new Map(),g=null,movio=0;
const ron=()=>document.querySelector('.m2d-ronda');
function base(r){const z=r.parentElement.getBoundingClientRect();return [z.left+r.offsetLeft,z.top+r.offsetTop,z]}
function pon(){if(s<=1.02){s=1;tx=ty=0}const r=ron();
 if(r&&s>1){const [Lx,Ly,z]=base(r),w=r.offsetWidth,h=r.offsetHeight,m=60;   // que la mesa no se salga toda de la vista
  tx=Math.min(z.right-m-Lx+s*w/2,Math.max(z.left+m-Lx-s*w/2,tx));ty=Math.min(z.bottom-m-Ly,Math.max(z.top+m-Ly-s*h,ty))}
 H.style.setProperty('--mz-s',s);H.style.setProperty('--mz-x',tx+'px');H.style.setProperty('--mz-y',ty+'px');H.classList.toggle('mz-on',s>1)}
function fija(cx,cy,ns){const r=ron();if(!r)return;const [Lx,Ly]=base(r),ux=Lx+(cx-Lx-tx)/s,uy=Ly+(cy-Ly-ty)/s;   // el punto bajo los dedos no se mueve
 s=Math.max(1,Math.min(MAX,ns));tx=cx-Lx-s*(ux-Lx);ty=cy-Ly-s*(uy-Ly);pon()}
const cen=()=>{const a=[...pt.values()];return [(a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2,Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)]};
addEventListener('pointerdown',e=>{if(e.pointerType=='mouse'||!e.target.closest||!e.target.closest('.m2d-zona'))return;pt.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pt.size==2){const [cx,cy,d]=cen();g={cx,cy,d,s};movio=1}else if(pt.size==1){g=null;movio=0}},true);
addEventListener('pointermove',e=>{const p=pt.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
 if(pt.size==2&&g){p.x=e.clientX;p.y=e.clientY;const [cx,cy,d]=cen();tx+=cx-g.cx;ty+=cy-g.cy;g.cx=cx;g.cy=cy;fija(cx,cy,g.s*d/g.d)}
 else if(pt.size==1&&s>1&&(movio||Math.hypot(dx,dy)>10)){movio=1;p.x=e.clientX;p.y=e.clientY;tx+=dx;ty+=dy;pon()}},true);
const fin=e=>{if(!pt.delete(e.pointerId))return;if(pt.size<2)g=null;if(movio){if(!pt.size)setTimeout(()=>movio=0,80)}};
addEventListener('pointerup',fin,true);addEventListener('pointercancel',fin,true);
addEventListener('click',e=>{if(movio&&e.target.closest&&e.target.closest('.m2d-zona')){e.stopPropagation();e.preventDefault()}},true);
addEventListener('wheel',e=>{if(!e.ctrlKey||!e.target.closest||!e.target.closest('.m2d-zona'))return;e.preventDefault();fija(e.clientX,e.clientY,s*Math.exp(-e.deltaY*.01))},{passive:false});
setInterval(()=>{if(s>1&&!ron()){s=1;pon()}},1000);   // al salir de la mesa vuelve a 1
window.MZOOM={reset(){s=1;pon()},get s(){return s}};})();
