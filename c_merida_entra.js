// Mérida en Venta: la pantalla entra animada al sentarse y el final brota con la fortuna de cada quien contando (MENT).
// Nivel de la portada: piezas escalonadas con rebote. Un tiempo de inicio + animation-delay negativo (--mu-edl, --mu-fdl)
// hace que los render (que rehacen el HTML) no reinicien nada. Solo se animan hijos: layout() mide .mu-top y #mudock.
(function(){
const RM=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(_){return false}};
const R=document.documentElement,fmt=v=>'$'+Math.round(v).toLocaleString('es-MX'),ease=p=>1-Math.pow(1-p,3);
let t0=0,tf=0,raf=0;
function cnt(){cancelAnimationFrame(raf);raf=0;if(!tf)return;const now=Date.now();let more=false;
 document.querySelectorAll('.mu-hud [data-cnt]').forEach(e=>{const p=RM()?1:Math.max(0,Math.min(1,(now-tf-(+e.dataset.d||0))/900)),s=fmt(+e.dataset.cnt*ease(p));
  if(e.textContent!==s)e.textContent=s;if(p<1)more=true});
 if(more)raf=requestAnimationFrame(cnt)}
// después de cada render; first = la pantalla de Mérida acaba de aparecer
function after(first,G){const now=Date.now();if(first||!t0)t0=now;const a=now-t0;
 R.classList.toggle('mu-entra',a<1800);R.style.setProperty('--mu-edl',-a+'ms');
 if(G&&G.phase=='final'){if(!tf)tf=now}else tf=0;
 R.style.setProperty('--mu-fdl',-(tf?now-tf:0)+'ms');if(tf)cnt()}
const B='cubic-bezier(.3,1.4,.5,1)',E='var(--mu-edl,0s)',F='var(--mu-fdl,0s)';
let pl='';for(let i=1;i<=8;i++)pl+=`html.mu-entra .mu-pls>:nth-child(${i}){--i:${i-1}}`;
const css=document.createElement('style');css.textContent=`
@media (prefers-reduced-motion:no-preference){
${pl}
html.mu-entra .mu-top>*{animation:mentB .6s ${B} ${E} both}
html.mu-entra .mu-pls>*{animation:mentP .5s ${B} calc(${E} + .15s + var(--i,0)*.07s) both}
html.mu-entra .mu-pls>.mu-pl.on{animation:mentP .5s ${B} calc(${E} + .15s + var(--i,0)*.07s) both,mupl 1.4s ease-in-out infinite}
html.mu-entra #mudock>*{animation:mentS .65s ${B} calc(${E} + .25s) both}
html.mu-entra #mudock>:nth-child(2){animation-delay:calc(${E} + .35s)}
html.mu-entra .mu-sheet{animation:mentS .65s ${B} calc(${E} + .3s) both}
html.mu-entra .mu-cam>*{animation:mentP .45s ${B} calc(${E} + .4s) both}
html.mu-entra .mu-cam>:nth-child(2){animation-delay:calc(${E} + .46s)}html.mu-entra .mu-cam>:nth-child(3){animation-delay:calc(${E} + .52s)}html.mu-entra .mu-cam>:nth-child(4){animation-delay:calc(${E} + .58s)}
.mu-fin .mu-big{display:inline-block;animation:mentT .7s ${B} calc(${F} + .1s) both,mentF 2.8s ease-in-out calc(${F} + .9s) infinite}
.mu-fin .mu-h{display:inline-block;animation:mentP .55s ${B} calc(${F} + .25s) both}
.mu-fin .mu-row .mu-s{animation:mentU .45s ease-out calc(${F} + .4s) both}
.mu-fin .mfin-q{animation:mentL .5s ${B} calc(${F} + .5s + var(--i)*.12s) both}
.mu-fin .mfin-q.w{animation:mentL .5s ${B} calc(${F} + .5s) both,mentW .45s ease-in-out calc(${F} + 1.5s) 2}
.mu-fin>.mu-b{animation:mentS .55s ${B} calc(${F} + 1.3s) both}
}
@keyframes mentB{from{opacity:0;translate:0 -36px}}
@keyframes mentP{from{opacity:0;scale:.4}}
@keyframes mentS{from{opacity:0;translate:0 60px}}
@keyframes mentU{from{opacity:0;translate:0 10px}}
@keyframes mentL{from{opacity:0;translate:-30px 0}}
@keyframes mentT{0%{opacity:0;scale:0;rotate:-25deg}60%{opacity:1;scale:1.25;rotate:6deg}100%{scale:1;rotate:0deg}}
@keyframes mentF{0%,100%{translate:0 0;rotate:0deg}50%{translate:0 -4px;rotate:-5deg}}
@keyframes mentW{50%{scale:1.04}}`;
document.head.appendChild(css);
window.MENT={after};
})();
