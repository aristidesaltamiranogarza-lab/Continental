// Uno y Monopoly Deal (3D con GHUD y 2D con M2D): la pantalla entra escalonada al sentarse (y en cada reparto nuevo),
// las cartas de la mano 2D llegan repartidas y el final brota con los números contando (GENT). Mismo patrón que MENT (Mérida):
// un tiempo de inicio + animation-delay negativo (--ge-edl, --ge-fdl) para que los render (que rehacen el HTML) no reinicien nada.
// Solo translate/scale/rotate sueltos y opacity; donde el elemento ya se ubica con transform se usa translate (va por fuera).
(function(){
const JS=['uno','monopolydeal','continental'],R=document.documentElement,RM=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(_){return false}};
const ease=p=>1-Math.pow(1-p,3);
let key='',t0=0,tf=0,raf=0,tm=0,fph='';
function cnt(){cancelAnimationFrame(raf);raf=0;if(!tf)return;const now=Date.now();let more=false;
 document.querySelectorAll('.gj-win [data-cnt],.m2d-fin [data-cnt]').forEach(e=>{const row=e.closest('.u3res>div,.m2d-tab>div'),i=row?[...row.parentNode.children].indexOf(row):0;
  const p=RM()?1:Math.max(0,Math.min(1,(now-tf-550-i*100)/800)),s=String(Math.round(+e.dataset.cnt*ease(p)));if(e.textContent!==s)e.textContent=s;if(p<1)more=true});
 if(more)raf=requestAnimationFrame(cnt)}
function after(){const G=typeof V!='undefined'&&V&&V.G,fp=G&&(G.phase=='final'||G.phase=='end'),ok=G&&JS.includes(V.game)&&(G.phase=='play'||fp);   // 'end': fin de ronda del Continental
 if(!ok){R.classList.remove('ge-in','ge-fin');tf=0;key='';return}
 const now=Date.now(),k=V.game+':'+(V.room||'')+':'+G.dn;
 if(G.phase=='play'){if(k!==key){key=k;t0=now+Math.min(G.cd||0,6000)}tf=0}else{if(!key)key=k;if(!tf||fph!==G.phase)tf=now;fph=G.phase}   // con cuenta regresiva entra al terminar ella
 const a=now-t0,on=G.phase=='play'&&a<1900;R.classList.toggle('ge-in',on);R.style.setProperty('--ge-edl',-a+'ms');
 clearTimeout(tm);if(on)tm=setTimeout(()=>R.classList.remove('ge-in'),1950-a);   // al terminar se quita: las animaciones ya no tapan las transiciones propias
 R.classList.toggle('ge-fin',!!tf);R.style.setProperty('--ge-fdl',-(tf?now-tf:0)+'ms');if(tf)cnt()}
// engancha el after() de cada juego (ya envuelto por sus vistas 2D y 3D)
if(typeof GM!='undefined')JS.forEach(j=>{const g=GM[j];if(!g)return;const o=g.after;g.after=function(){if(o)o.apply(this,arguments);try{after()}catch(e){console.warn('GENT:',e)}}});
const B='cubic-bezier(.3,1.4,.5,1)',E='var(--ge-edl,0s)',F='var(--ge-fdl,0s)',I='html.ge-in',W='html.ge-fin';
let ix='';for(let i=1;i<=12;i++)ix+=`${I} .gj-bb>:nth-child(${i}),${I} .m2d-top>:nth-child(${i}),${I} .m2d-bar>:nth-child(${i}),${I} #hand>.m2d-ca:nth-child(${i}),${W} .u3res>:nth-child(${i}),${W} .m2d-tab>:nth-child(${i}){--i:${i-1}}`;
for(let i=0;i<10;i++)ix+=`${I} [data-seat="${i}"]{--s:${i}}`;
const css=document.createElement('style');css.textContent=`
[data-cnt]{font-style:normal}
@media (prefers-reduced-motion:no-preference){
${ix}
${I} .gj-top>*,${I} .gj-hint{animation:geB .6s ${B} ${E} backwards}
${I} .gj-top>:nth-child(2){animation-delay:calc(${E} + .08s)}${I} .gj-top>:nth-child(3){animation-delay:calc(${E} + .16s)}
${I} .gj-seat,${I} .m2d-seat{animation:geU .5s ${B} calc(${E} + .2s + var(--s,0)*.08s) backwards}
${I} .gj-seat.on,${I} .m2d-seat.on{animation:geU .5s ${B} calc(${E} + .2s + var(--s,0)*.08s) backwards,gjTurn 1.6s ease-in-out calc(${E} + .8s) infinite}
${I} .gj-pl,${I} .u3tt,${I} .gj-cam,${I} .gj-view,${I} .m2d-felt>*{animation:geP .5s ${B} calc(${E} + .35s) backwards}
${I} .gj-bb>*,${I} .m2d-bar>*{animation:geS .6s ${B} calc(${E} + .3s + var(--i,0)*.06s) backwards}
${I} .gj-bb>.go{animation:geS .6s ${B} calc(${E} + .3s + var(--i,0)*.06s) backwards,gjGo 1s ease-in-out calc(${E} + 1s) infinite}
${I} .m2d-top>*{animation:geB .55s ${B} calc(${E} + var(--i,0)*.06s) backwards}
${I} #hand>.m2d-ca{animation:geD .55s cubic-bezier(.2,.8,.3,1.12) calc(${E} + .45s + var(--i,0)*.07s) backwards}
${W} .gj-win,html.ge-fin .m2d .m2d-fin{transform-origin:0 0;animation:geWin .6s ${B} ${F} backwards}
${W} .u3wn,${W} .m2d-fin>.m2d-pt.big{animation:geT .7s ${B} calc(${F} + .15s) backwards,geF 2.8s ease-in-out calc(${F} + .9s) infinite}
${W} .u3wn{display:inline-block}
${W} .m2d-fin>h2,${W} .m2d-fin>.m2-fs{animation:geP .5s ${B} calc(${F} + .3s) backwards}
${W} .u3res>*,${W} .m2d-tab>*{animation:geL .45s ${B} calc(${F} + .45s + var(--i,0)*.1s) backwards}
${W} .u3res>.w,${W} .m2d-tab>.w{animation:geL .45s ${B} calc(${F} + .45s + var(--i,0)*.1s) backwards,geW .45s ease-in-out calc(${F} + 1.4s) 2}
${W} .m2d-tab>:not(.w) .m2d-pt{animation:geNo .7s ease-in-out calc(${F} + 1.1s + var(--i,0)*.1s) backwards}
${W} .m2d-fin>.m2d-bts>*,${W} .gj-bb>*{animation:geS .55s ${B} calc(${F} + 1.2s) backwards}
${W} .m2d-fin>.m2d-bts>:nth-child(2),${W} .gj-bb>:nth-child(2){animation-delay:calc(${F} + 1.3s)}
}
@keyframes geB{from{opacity:0;translate:0 -36px}}
@keyframes geU{from{opacity:0;translate:0 26px}}
@keyframes geP{from{opacity:0;scale:.4}}
@keyframes geS{from{opacity:0;translate:0 60px}}
@keyframes geL{from{opacity:0;translate:-30px 0}}
@keyframes geD{from{opacity:0;translate:0 -46vh;rotate:-24deg}}
@keyframes geWin{0%{opacity:0;scale:.3}}
@keyframes geT{0%{opacity:0;scale:0;rotate:-25deg}60%{opacity:1;scale:1.25;rotate:6deg}100%{scale:1;rotate:0deg}}
@keyframes geF{0%,100%{translate:0 0;rotate:0deg}50%{translate:0 -4px;rotate:-4deg}}
@keyframes geW{50%{scale:1.04}}
@keyframes geNo{0%,100%{rotate:0deg}25%{rotate:-10deg}55%{rotate:8deg}80%{rotate:-4deg}}`;
document.head.appendChild(css);
window.GENT={after};
})();
