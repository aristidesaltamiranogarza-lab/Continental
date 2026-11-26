// Mérida en Venta: el dinero que pasa de un jugador a otro (MDIN). Un billete vuela de la pastilla del que paga a la del que cobra;
// si la renta es muy cara sale un aviso grande ("¡Ay! $1,100"). Lo llama effects() de c_meridaui.js cuando la ficha ya llegó.
(function(){
const RM=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(_){return false}};
const pill=k=>document.querySelector(`.mu-pl[data-seat="${k}"]`);
const mid=e=>{const r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]};
// pagos de este cambio: un pagador a varios (paga a cada jugador) o varios a uno (cobra a cada jugador / renta)
function pares(dc){const N=[],P=[];dc.forEach((d,k)=>{if(d<0)N.push(k);else if(d>0)P.push(k)});const sn=N.reduce((s,k)=>s+dc[k],0),sp=P.reduce((s,k)=>s+dc[k],0);
 if(!N.length||!P.length||sn+sp!==0||(N.length>1&&P.length>1))return [];return N.length==1?P.map(k=>[N[0],k,dc[k]]):N.map(k=>[k,P[0],-dc[k]])}
function billete(a,b,v,fmt,j){if(RM())return;const A=pill(a),Bp=pill(b);if(!A||!Bp)return;const [x0,y0]=mid(A),[x1,y1]=mid(Bp),e=document.createElement('div');
 e.className='mdin-b';e.textContent=fmt(v);e.style.left=x0+'px';e.style.top=y0+'px';document.body.appendChild(e);const dx=x1-x0,dy=y1-y0,up=Math.min(90,40+Math.abs(dx)*.15);
 e.animate([{transform:'translate(-50%,-50%) scale(.5) rotate(-8deg)',opacity:0},{transform:'translate(-50%,-50%) scale(1.1) rotate(-4deg)',opacity:1,offset:.15},
  {transform:`translate(calc(-50% + ${dx/2}px),calc(-50% + ${dy/2+up}px)) scale(1) rotate(6deg)`,offset:.55},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.6) rotate(0)`,opacity:.9}],
  {duration:900,delay:j*110,easing:'cubic-bezier(.4,0,.3,1)',fill:'backwards'}).onfinish=()=>{e.remove();Bp.animate([{scale:1},{scale:1.12},{scale:1}],{duration:260})}}
// aviso grande cuando una sola renta cuesta mucho
function ay(v,fmt,ins){const e=document.createElement('div');e.className='mdin-ay';e.innerHTML=`<div><small>¡Ay!</small><b>${fmt(v)}</b></div>`;
 if(ins)e.style.cssText=`top:${ins.t}px;bottom:${ins.b}px;right:${ins.r}px`;document.body.appendChild(e);setTimeout(()=>e.remove(),1700)}
// big(pagador) = true si el que paga acaba de caer (renta): solo entonces sale el aviso
function pasa(dc,fmt,ins,big){const L=pares(dc);L.forEach((p,j)=>billete(p[0],p[1],p[2],fmt,j));
 if(window.MPT&&L.length==1&&L[0][2]>=20){const [a,b,v]=L[0];setTimeout(()=>{MPT.reac(a,v>=400?'enojo':'triste');MPT.reac(b,'feliz')},700)}   /* caras: cuando llega el billete */if(L.length==1&&L[0][2]>=400&&big&&big(L[0][0]))ay(L[0][2],fmt,ins);return L}
const css=document.createElement('style');css.textContent=`
.mdin-b{position:fixed;z-index:69;pointer-events:none;padding:5px 12px;border-radius:8px;background:#2f9e5b;color:#fff;font:900 15px var(--mu-f,system-ui);box-shadow:0 6px 16px rgba(0,0,0,.35),inset 0 0 0 2px rgba(255,255,255,.55);white-space:nowrap}
.mdin-ay{position:fixed;left:0;top:0;right:0;bottom:0;z-index:67;display:flex;align-items:center;justify-content:center;pointer-events:none}
.mdin-ay>div{display:flex;flex-direction:column;align-items:center;background:#d7261e;color:#fff;border-radius:22px;padding:10px 26px 14px;box-shadow:0 8px 0 #9c1a14,0 22px 44px rgba(0,0,0,.4);animation:mdinay 1.7s cubic-bezier(.2,1.4,.5,1) forwards}
.mdin-ay small{font:900 20px var(--mu-f,system-ui);text-transform:uppercase;letter-spacing:.08em}.mdin-ay b{font:900 clamp(34px,9vw,52px)/1 var(--mu-f,system-ui)}
@keyframes mdinay{0%{transform:scale(.3) rotate(-6deg);opacity:0}18%{transform:scale(1.1) rotate(2deg);opacity:1}30%{transform:scale(1) rotate(0)}80%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.92) translateY(-26px)}}
@media (prefers-reduced-motion:reduce){.mdin-ay>div{animation-duration:.01s}}`;
document.head.appendChild(css);
window.MDIN={pasa,pares};
})();
