// Uno y Monopoly Deal (3D con GHUD y 2D con M2D): que se sientan vivos, al nivel de la portada y de Mérida (GVIV).
// - Toques: los botones se hunden con resorte y rebotan al soltar (también el que lo reemplaza tras el render).
// - Paneles (☰, color, tarjetas, menú 2D, ver la mesa de otro, final): entran con resorte una sola vez y al cerrarse salen
//   deslizándose (el nodo viejo se queda un momento en su lugar), en vez de aparecer y desaparecer de golpe.
// - Pulsos y detalles vivos con la misma fase en cada render (--gv-t*), así no brincan al redibujar.
// - Cartas 2D: vuelan en arco, giran y la pila que las recibe da un golpecito (reemplaza fly() de game.js solo en estos juegos).
// - Uno 2D: el fieltro pasa al color nuevo en vez de cambiar seco. Números marcados con data-gvn rebotan y cuentan al cambiar.
// Solo transform/opacity y translate/scale/rotate sueltos; respeta prefers-reduced-motion.
(function(){
const JS=['uno','monopolydeal'],R=document.documentElement,RM=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(_){return false}};
const ge=()=>typeof V!='undefined'&&V&&V.G&&JS.includes(V.game)&&(V.G.phase=='play'||V.G.phase=='final');
const B='cubic-bezier(.3,1.4,.5,1)',$=s=>document.querySelector(s);
// ---------- paneles: entrada una vez, salida con el nodo viejo ----------
const P=['.gj-win','.gj-sheet','#u3pick','#md3box','.m2d-menu','.m2-ver','.m2-pa','.m2d-fin'];
function antes(){const o=[];if(!R.classList.contains('gv'))return o;P.forEach(s=>{const e=$('#app '+s);if(e){const p=e.parentElement;o.push({s,e,r:e.getBoundingClientRect(),
 p:p&&(p.id?'#'+p.id:p.classList[0]?'.'+p.classList[0]:null)})}});return o}
function sale(x){if(RM()||!x.r.width)return;const e=x.e,np=x.p&&$('#app '+x.p);
 e.classList.add('gv-sale');e.removeAttribute('id');e.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));e.style.pointerEvents='none';
 if(np){np.appendChild(e)}else{e.style.cssText+=`;position:fixed;left:${x.r.left}px;top:${x.r.top}px;width:${x.r.width}px;height:${x.r.height}px;margin:0;transform:none`;document.body.appendChild(e)}
 const a=e.animate([{opacity:1,translate:'0 0'},{opacity:0,translate:'0 34px'}],{duration:240,easing:'cubic-bezier(.5,0,.75,0)',fill:'forwards'});
 a.onfinish=a.oncancel=()=>e.remove();setTimeout(()=>e.remove(),400)}
function despues(o){o.forEach(x=>{const n=$('#app '+x.s);if(n)n.classList.add('gv-ya');else sale(x)})}
// ---------- botones: rebote al soltar, también en el que lo reemplaza ----------
const BT='#app :is(.gj-bar,.gj-top,.gj-win,.gj-sheet,#u3pick,#md3box,.m2d) :is(button,.ui-btn,.ui-rb)';
let last=null;const key=b=>(b.getAttribute('onclick')||'')+'|'+b.textContent.trim().slice(0,24);
const rebota=b=>{if(!b||RM())return;b.classList.remove('gv-rb');void b.offsetWidth;b.classList.add('gv-rb')};
addEventListener('pointerdown',e=>{const b=R.classList.contains('gv')&&e.target.closest&&e.target.closest(BT);if(b&&!b.disabled)last={k:key(b),t:performance.now()}},true);
const up=e=>{const b=R.classList.contains('gv')&&e.target.closest&&e.target.closest(BT);if(b&&!b.disabled)rebota(b)};
addEventListener('pointerup',up,true);addEventListener('pointercancel',up,true);
// ---------- números que cuentan (data-gvn="clave", el texto es el número) ----------
const nv={};
function nums(){document.querySelectorAll('#app [data-gvn]').forEach(e=>{const k=e.dataset.gvn,v=+e.textContent,o=nv[k];
 if(!o||RM()||isNaN(v)){nv[k]={f:v,v,t:0};return}
 if(o.v!==v){o.f=o.t&&performance.now()-o.t<600?o.f+(o.v-o.f)*Math.min(1,(performance.now()-o.t)/600):o.v;o.v=v;o.t=performance.now()}
 if(o.t&&performance.now()-o.t<600){e.classList.add('gv-nb');e.style.animationDelay=-(performance.now()-o.t)+'ms';cuenta()}})}
let rq=0;function cuenta(){if(rq)return;rq=requestAnimationFrame(function f(){rq=0;const now=performance.now();let more=false;
 document.querySelectorAll('#app [data-gvn].gv-nb').forEach(e=>{const o=nv[e.dataset.gvn];if(!o)return;const p=Math.min(1,(now-o.t)/600),s=String(Math.round(o.f+(o.v-o.f)*(1-Math.pow(1-p,3))));
  if(e.textContent!==s)e.textContent=s;if(p<1)more=true;else e.classList.remove('gv-nb')});if(more)rq=requestAnimationFrame(f)})}
// ---------- Uno 2D: color del fieltro ----------
let uc=null,ucT=0,uc0='';
function color(){if(V.game!='uno'||typeof UCH=='undefined')return;const c=V.G.color;if(uc!==null&&c!==uc&&UCH[uc]){uc0=UCH[uc];ucT=performance.now()}uc=c;
 const a=performance.now()-ucT;R.classList.toggle('gv-uc',!!uc0&&a<700);R.style.setProperty('--gv-uc0',uc0||'transparent');R.style.setProperty('--gv-ucd',-a+'ms')}
// ---------- render envuelto ----------
const r0=window.render;
if(typeof r0=='function')window.render=function(){const o=antes(),out=r0.apply(this,arguments);
 try{const on=ge();R.classList.toggle('gv',!!on);if(on){despues(o);const now=performance.now();
  R.style.setProperty('--gv-t10',-(now%1000)+'ms');R.style.setProperty('--gv-t16',-(now%1600)+'ms');R.style.setProperty('--gv-t28',-(now%2800)+'ms');
  if(last&&now-last.t<700){const k=last.k;last=null;const b=[...document.querySelectorAll(BT)].find(x=>key(x)===k);if(b)rebota(b)}
  nums();color()}}catch(e){console.warn('GVIV:',e)}
 return out};
// ---------- cartas 2D que vuelan en arco ----------
const f0=window.fly;
if(typeof f0=='function')window.fly=function(a,b,id){if(!ge()||RM()||!a||!b||typeof FX=='undefined')return f0.apply(this,arguments);
 const r=a.getBoundingClientRect(),q=b.getBoundingClientRect(),W=46,H=64,gm=GM[V.game]||{};
 const e=document.createElement('div');e.className='c fly gv-fly'+(id==null?' bk':'');
 if(id!=null&&gm.face){const f=gm.face(id);e.innerHTML=f.h;if(f.cls)e.className+=' '+f.cls}
 const ui=id!=null?gm.face&&gm.face(id).ui:gm.back&&gm.back();if(ui){e.className+=' ucv';e.style.setProperty('--ui',`url(${ui})`)}
 e.style.cssText+=`;left:${r.left+r.width/2-W/2}px;top:${r.top+r.height/2-H/2}px;width:${W}px;height:${H}px;transition:none`;FX.appendChild(e);
 const esC=el=>el.matches('#disc,#deck,#deck2,.c,.m2d-ca,.m2c')||!!el.closest('.m2d-felt'),sz=(el,rc)=>esC(el)?Math.max(.6,Math.min(2.2,rc.width/W)):.55;
 const s0=sz(a,r),s1=sz(b,q),dx=q.left+q.width/2-r.left-r.width/2,dy=q.top+q.height/2-r.top-r.height/2,d=Math.hypot(dx,dy),up=Math.min(110,30+d*.22),sg=dx>=0?1:-1,rt=sg*(12+Math.random()*14);
 const A=e.animate([{transform:`translate(0,0) scale(${s0*.8}) rotate(0deg)`,opacity:0},
  {transform:`translate(${dx*.1}px,${dy*.1-up*.45}px) scale(${s0*1.12}) rotate(${rt*.3}deg)`,opacity:1,offset:.16},
  {transform:`translate(${dx*.58}px,${dy*.58-up}px) scale(${(s0+s1)/2*1.12}) rotate(${rt}deg)`,offset:.58},
  {transform:`translate(${dx}px,${dy}px) scale(${s1}) rotate(${sg*3}deg)`,opacity:1}],{duration:Math.min(720,430+d*.35),easing:'cubic-bezier(.45,.05,.3,1)',fill:'forwards'});
 A.onfinish=()=>{e.remove();const t=b.matches('#disc,#deck,#deck2')?b:b.closest('[data-seat]')||b;
  try{t.animate([{scale:1},{scale:1.09,offset:.3},{scale:.97,offset:.65},{scale:1}],{duration:340,easing:'ease-out'})}catch(_){}};
 setTimeout(()=>e.remove(),1200)};
// ---------- estilos ----------
try{CSS.registerProperty({name:'--uc',syntax:'<color>',inherits:true,initialValue:'#c2512a'})}catch(_){}
const css=document.createElement('style');css.textContent=`
html.gv ${BT}:not(:disabled){transition:scale .32s cubic-bezier(.34,1.7,.5,1),translate .25s ${B},transform .15s,background-color .18s,color .18s,box-shadow .2s,opacity .2s,border-color .2s}
html.gv ${BT}:not(:disabled):active{scale:.93;transition-duration:.07s}
html.gv ${BT}.gv-rb{animation:gvRb .36s cubic-bezier(.3,1.6,.5,1)}
html.gv .gj-bar .ui-btn.go.gv-rb{animation:gvRb .36s cubic-bezier(.3,1.6,.5,1),gjGo 1s ease-in-out .36s infinite}
@media (hover:hover){html.gv ${BT}:not(:disabled):hover{translate:0 -2px}}
.gv-fly{box-shadow:0 10px 22px rgba(0,0,0,.35);will-change:transform}
[data-gvn]{display:inline-block}
.gv-nb{animation:gvNb .6s ${B} both}
@media (prefers-reduced-motion:no-preference){
html.gv:not(.ge-in) .gj-bar .ui-btn.go:not(.gv-rb){animation-delay:var(--gv-t10)}
html.gv:not(.ge-in) .gj-seat.on,html.gv .gj-turn.me{animation-delay:var(--gv-t16)}
html.gv .gj-sheet:not(.ya):not(.gv-ya){animation:gvHoja .42s ${B} both}
html.gv .gj-sheet:not(.ya):not(.gv-ya) .ui-bd>*,html.gv .m2d-menu:not(.gv-ya)>*{animation:gvFila .38s ${B} backwards}
${[1,2,3,4,5,6,7,8].map(i=>`html.gv .gj-sheet:not(.ya):not(.gv-ya) .ui-bd>:nth-child(${i}),html.gv .m2d-menu:not(.gv-ya)>:nth-child(${i}){animation-delay:${.05+i*.04}s}`).join('')}
html.gv .m2d-menu:not(.gv-ya){animation:gvHoja .42s ${B} both}
html.gv #u3pick:not(.gv-ya),html.gv #md3box:not(.gv-ya){animation:gvHoja .42s ${B} both}
html.gv #u3pick:not(.gv-ya) .u3col{animation:gvPop .4s ${B} backwards}
html.gv #u3pick:not(.gv-ya) .u3col:nth-child(2){animation-delay:.05s}html.gv #u3pick:not(.gv-ya) .u3col:nth-child(3){animation-delay:.1s}html.gv #u3pick:not(.gv-ya) .u3col:nth-child(4){animation-delay:.15s}
html.gv .m2-ver:not(.gv-ya),html.gv .m2-pa:not(.gv-ya){animation:gvHoja .42s ${B} both}
@media (min-width:768px){html.gv #u3pick:not(.gv-ya){transform-origin:0 0;animation:gvMid .42s ${B} both}}
html.gv .m2d #deck{animation:gvRes 2.8s ease-in-out var(--gv-t28) infinite}
html.gv .m2d-seat.on .m2d-av,html.gv .m2d-me.on .m2d-av{animation:gvBob 2.8s ease-in-out var(--gv-t28) infinite}
html.gv .u3tt{animation:gvBob 2.8s ease-in-out var(--gv-t28) infinite}
html.gv.gv-uc .m2d.u2{animation:gvUc .7s ease-out var(--gv-ucd) backwards}
}
.gv-sale{z-index:30}
@keyframes gvRb{0%{scale:.93}55%{scale:1.06}100%{scale:1}}
@keyframes gvNb{0%{scale:1}35%{scale:1.35}100%{scale:1}}
@keyframes gvHoja{from{opacity:0;translate:0 40px}}
@keyframes gvMid{from{opacity:0;scale:.6}}
@keyframes gvFila{from{opacity:0;translate:0 14px}}
@keyframes gvPop{from{opacity:0;scale:.4}}
@keyframes gvRes{0%,100%{scale:1}50%{scale:1.025}}
@keyframes gvBob{0%,100%{translate:0 0;rotate:0deg}50%{translate:0 -3px;rotate:-2deg}}
@keyframes gvUc{from{--uc:var(--gv-uc0)}}`;
document.head.appendChild(css);
window.GVIV={nums};
})();
