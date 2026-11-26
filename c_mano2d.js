// MANO2D: tu mano de Continental en la mesa 2D, como Balatro.
// - Tomar: gana la carta cuya esquina asoma bajo el puntero, medida en reposo (levantar la de encima no cambia de dueño a nadie).
// - Arrastrar: la carta alcanza al dedo con un poco de retraso y se ladea según la velocidad; las demás se hacen a un lado
//   para abrir el hueco donde caería (por posición, sin brincos). Al soltar en tu mano vuela a su hueco.
// El arrastre base (fantasma, casillas, soltar en el centro) sigue en game.js y c_mesa2d.js; aquí solo lo que cambia.
(function(){
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const esCont=()=>typeof gnow=='function'&&gnow()==='continental';
const mano=()=>esCont()?document.querySelector('#app .m2d #hand.m2d-mano'):null;
const cas=h=>[...h.querySelectorAll(':scope>.m2d-ca')];
const num=(el,k)=>parseFloat(el.style.getPropertyValue(k))||0;
// lo que asoma bajo (px,py): de la de más arriba a la de más abajo, con su giro y su caída en reposo
function duena(h,px,py){const ks=cas(h);if(!ks.length)return null;const hr=h.getBoundingClientRect(),b=ks[0].offsetParent===h?0:h.offsetLeft,bt=ks[0].offsetParent===h?0:h.offsetTop;
 for(let i=ks.length-1;i>=0;i--){const k=ks[i],w=k.offsetWidth,hh=k.offsetHeight,l=hr.left+k.offsetLeft-b,t=hr.top+k.offsetTop-bt,ox=l+w/2,oy=t+hh*1.3,a=-num(k,'--r')*Math.PI/180,
  dx=px-ox,dy=py-oy-num(k,'--y'),lx=dx*Math.cos(a)-dy*Math.sin(a)+w/2,ly=dx*Math.sin(a)+dy*Math.cos(a)+hh*1.3;
  if(lx>=-1&&lx<=w+1&&ly>=-16&&ly<=hh+2)return k}return null}
function marca(k){const h=mano();if(!h)return;h.querySelectorAll(':scope>.m2d-ca.hv').forEach(x=>{if(x!==k)x.classList.remove('hv')});if(k)k.classList.add('hv')}
// pasar el mouse: se asoma la que es dueña de ese punto
addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||(typeof dg!='undefined'&&dg&&dg.on))return;const h=mano();if(!h)return;marca(duena(h,e.clientX,e.clientY))},{passive:true});
addEventListener('pointerleave',()=>marca(null));
// un clic en la orilla de la carta levantada cae en su caja: que cuente como clic en la carta
document.addEventListener('click',e=>{const k=e.target.classList&&e.target.classList.contains('m2d-ca')&&e.target.closest('.m2d #hand.m2d-mano')?e.target:null;if(!k||!esCont())return;const c=k.querySelector('.c');if(c&&c!==e.target)c.click()});
// la carta que agarra game.js: la dueña del punto, no la que el navegador crea que está encima
function carta(e){const h=mano();if(!h||!h.contains(e.target))return null;const k=duena(h,e.clientX,e.clientY);return k&&k.querySelector('.c')}
function down(d,e){const h=mano();if(!h||!h.contains(d.el))return;d.m=1;if(e.pointerType!=='mouse')marca(d.el.closest('.m2d-ca'))}   // con el dedo no hay "pasar encima": la que tocas se asoma
// abanico: giro y caída según el lugar (la misma cuenta que M2D.abanico)
function arco(ks){const n=ks.length,mid=(n-1)/2,st=n>1?Math.min(5,26/(n-1)):0,rm=mid*st;ks.forEach((k,j)=>{const r=(j-mid)*st;k.style.setProperty('--r',r.toFixed(1)+'deg');k.style.setProperty('--y',((r*r-rm*rm)*.16).toFixed(1)+'px')})}
function start(d,e){const h=d.el.closest('#hand.m2d-mano');if(!h){d.m=0;return}marca(null);d.h=h;d.ca=d.el.closest('.m2d-ca');
 d.ids=cas(h).map(k=>+k.querySelector('.c').dataset.id);d.k=d.ids.indexOf(d.id);
 const r=d.el.getBoundingClientRect();d.w=d.el.offsetWidth;d.hh=d.el.offsetHeight;d.cx=r.left+r.width/2;d.cy=r.top+r.height/2;d.ox=d.cx-e.clientX;d.oy=d.cy-e.clientY;
 {const hr=h.getBoundingClientRect(),b=d.ca.offsetParent===h?0:h.offsetLeft;d.ax=hr.left+d.ca.offsetLeft-b+d.ca.offsetWidth/2-e.clientX}   // centro en reposo (sin giro): para el hueco
 d.px=e.clientX;d.py=e.clientY;d.vx=0;d.rz=num(d.ca,'--r');d.el.style.opacity='0';
 Object.assign(d.g.style,{left:'0px',top:'0px',width:d.w+'px',height:d.hh+'px'});pinta(d,1.08);
 try{rHold=1}catch(_){}let t0=performance.now();
 (function paso(t){if(dg!==d){if(!d.keep){try{rHold=0}catch(_){}}return}const dt=Math.min(50,t-t0);t0=t;
  const k=RM?1:1-Math.exp(-dt/40),x0=d.cx;d.cx+=(d.px+d.ox-d.cx)*k;d.cy+=(d.py+d.oy-10-d.cy)*k;
  d.vx+=((d.cx-x0)/Math.max(dt,1)-d.vx)*Math.min(1,dt/50);const tl=RM?0:Math.max(-14,Math.min(14,d.vx*9));d.rz+=(tl-d.rz)*Math.min(1,dt/60);
  pinta(d,1.08);requestAnimationFrame(paso)})(t0)}
function pinta(d,s){d.g.style.transform=`translate(${(d.cx-d.w/2).toFixed(1)}px,${(d.cy-d.hh/2).toFixed(1)}px) rotate(${d.rz.toFixed(2)}deg) scale(${s})`}
// el hueco sigue a la carta (por posición en reposo, así no tiembla); si te vas lejos de tu mano se queda donde estaba
function move(d,e){d.px=e.clientX;d.py=e.clientY;const h=d.h,ks=cas(h),n=ks.length;if(n<2)return;const hr=h.getBoundingClientRect();if(e.clientY<hr.top-d.hh*.8)return;
 const b=ks[0].offsetParent===h?0:h.offsetLeft,x0=hr.left+ks[0].offsetLeft-b+ks[0].offsetWidth/2,stp=ks[1].offsetLeft-ks[0].offsetLeft||1,k=Math.max(0,Math.min(n-1,Math.round((d.px+d.ax-x0)/stp)));
 if(k===d.k)return;d.k=k;const antes=new Map(ks.map(c=>[c,c.offsetLeft])),resto=ks.filter(c=>c!==d.ca);h.insertBefore(d.ca,resto[k]||null);
 const nuevo=cas(h);if(!RM){nuevo.forEach(c=>{const dx=antes.get(c)-c.offsetLeft;if(c!==d.ca&&dx){c.style.transition='none';c.style.translate=dx+'px 0'}});void h.offsetWidth;nuevo.forEach(c=>{c.style.transition='';c.style.translate=''})}
 arco(nuevo);const t=performance.now();if(t-(d.tk||0)>70&&typeof sfx=='function'){d.tk=t;sfx('tick')}}
// soltar en tu mano: vuela a su hueco y queda ahí
function suelta(d){d.keep=1;const ids=d.ids.filter(x=>x!==d.id);ids.splice(d.k,0,d.id);myOrder=ids;manual=true;
 const r=d.el.getBoundingClientRect();d.cx=r.left+r.width/2;d.cy=r.top+r.height/2;d.rz=num(d.ca,'--r');
 d.g.style.transition=RM?'none':'transform .22s cubic-bezier(.3,1.4,.5,1)';pinta(d,1);if(typeof sfx=='function')sfx('place');
 setTimeout(()=>{d.g.remove();d.el.style.opacity='';try{rHold=0}catch(_){}render()},RM?0:220)}
// al soltar el dedo sin arrastrar, la que se asomaba baja
addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')setTimeout(()=>marca(null),0)},true);
addEventListener('pointercancel',()=>marca(null),true);
window.MANO2D={carta,down,start,move,suelta};
})();
// Varias cartas elegidas: si arrastras una de ellas se van todas juntas (abanico detrás del dedo) a la casilla, a la bajada o a su hueco en tu mano.
(function(){
if(!window.MANO2D)return;
function arma(d){d.gq=1;if(d.from!=='hand'||typeof sel=='undefined'||!(sel instanceof Set)||!sel.has(d.id)||sel.size<2)return;
 const els=[...document.querySelectorAll('#hand .c[data-id]')].filter(x=>sel.has(+x.dataset.id));if(els.length<2)return;
 d.grupo=els.map(x=>+x.dataset.id);const g=d.g;if(!g)return;const ex=[];
 els.filter(x=>+x.dataset.id!==d.id).forEach((x,j)=>{const c=x.cloneNode(true);c.className+=' fly';c.removeAttribute('onclick');c.removeAttribute('id');c.style.cssText=g.style.cssText;
  const u=x.style.getPropertyValue('--ui');if(u)c.style.setProperty('--ui',u);c.style.zIndex=89;c.style.pointerEvents='none';g.parentNode.insertBefore(c,g);ex.push([c,x,j+1])});
 const sig=()=>{if(!g.isConnected){ex.forEach(([c,x])=>{c.remove();x.style.opacity=''});return}
  ex.forEach(([c,x,j])=>{x.style.opacity=.3;['left','top','width','height','transition'].forEach(k=>c.style[k]=g.style[k]);c.style.transform=(g.style.transform||'')+` translate(${j*12}px,${-j*4}px) rotate(${j*5}deg)`});requestAnimationFrame(sig)};
 sig();if(typeof sfx=='function')sfx('tick')}
addEventListener('pointermove',()=>{if(typeof dg!='undefined'&&dg&&dg.on&&!dg.gq)arma(dg)});
const s0=MANO2D.suelta;
MANO2D.suelta=function(d){s0(d);if(!d.grupo)return;const ids=myOrder.filter(x=>x===d.id||!d.grupo.includes(x)),p=ids.indexOf(d.id);if(p<0)return;ids.splice(p,1,...d.grupo);myOrder=ids};
// soltar el grupo en una casilla del contrato: entran todas, en el orden de tu mano, donde cayó la que arrastraste
MANO2D.slotGrupo=function(d,k,x,y){const o=d.grupo.filter(z=>z!==d.id);staged.forEach(g=>{g.ids=g.ids.filter(z=>!o.includes(z))});dropSlot(d.id,k,x,y);
 const g=staged[k];if(!g)return;const p=g.ids.indexOf(d.id);if(p<0)return;g.ids.splice(p,1,...d.grupo);sel=new Set();render()};
})();
