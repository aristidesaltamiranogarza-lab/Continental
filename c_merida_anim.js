// MANI: animaciones de la UI de Mérida (botones con presión y rebote, pulso del botón del turno,
// salida de paneles, dinero que cuenta y carta comprada que vuela a "Mías"). Respeta prefers-reduced-motion.
(function(){
const RM=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(_){return false}};
const PULSE=1800,COUNT=650;
let last=null;        // último botón tocado: {k,t} para rebotar al que lo reemplace tras el render
const key=b=>(b.getAttribute('onclick')||'')+'|'+b.textContent.trim().slice(0,24);
const bounce=b=>{if(!b||RM())return;b.classList.remove('mu-rb');void b.offsetWidth;b.classList.add('mu-rb')};
addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('.mu-hud button');if(b&&!b.disabled)last={k:key(b),t:performance.now()}},true);
const up=e=>{const b=e.target.closest&&e.target.closest('.mu-hud button');if(b)bounce(b)};
addEventListener('pointerup',up,true);addEventListener('pointercancel',up,true);

// ---- dinero que cuenta ----
const disp=[],tgt=[],an=[],fb=[];let fmt=v=>'$'+v,bk=[];
const pill=k=>document.querySelector(`.mu-pl[data-seat="${k}"] .mu-pi b`);
function paint(k){const e=pill(k);if(e&&!bk[k]&&disp[k]!=null){const s=fmt(Math.round(disp[k]));if(e.textContent!==s)e.textContent=s}}
function go(k){clearTimeout(fb[k]);if(tgt[k]==null||disp[k]===tgt[k])return;
 if(RM()){disp[k]=tgt[k];paint(k);return}
 const a={f:disp[k],to:tgt[k],t0:performance.now()};an[k]=a;
 const step=t=>{if(an[k]!==a)return;const p=Math.min(1,(t-a.t0)/COUNT),q=1-Math.pow(1-p,3);disp[k]=a.f+(a.to-a.f)*q;paint(k);
  const e=pill(k);if(e)e.classList.toggle('mu-cnt',p<1);if(p<1)requestAnimationFrame(step);else{disp[k]=a.to;an[k]=null}};
 requestAnimationFrame(step)}

// ---- salida de paneles: un fantasma del panel que se desliza y se desvanece ----
function out(sel,cls){if(RM())return;const el=document.querySelector(sel),hud=document.querySelector('.mu-hud');if(!el||!hud)return;
 const r=el.getBoundingClientRect();if(!r.width)return;const g=document.createElement('div');g.className=hud.className+' mu-ghost';
 const c=el.cloneNode(true);c.removeAttribute('id');c.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
 if(cls!='modal')c.style.cssText+=`;position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;box-sizing:border-box`;
 c.classList.add('mu-go-'+cls);g.appendChild(c);document.body.appendChild(g);setTimeout(()=>g.remove(),260)}

// ---- carta comprada que vuela a tu zona ----
function buy(html,delay){if(RM())return;setTimeout(()=>{
 const t=document.querySelector(`.mu-tabs button[onclick*="'mias'"]`)||document.querySelector('.mu-pl .mu-pi')?.closest('.mu-pl');
 const me=document.querySelector('.mu-pl em')?.closest('.mu-pl'),dst=t||me;if(!dst)return;
 const d=dst.getBoundingClientRect(),f=document.createElement('div');f.className='mu-fly';f.innerHTML=html;document.body.appendChild(f);
 const x0=innerWidth/2,y0=innerHeight*.42,x1=d.left+d.width/2,y1=d.top+d.height/2;
 f.style.left=x0+'px';f.style.top=y0+'px';
 const A=f.animate([{transform:'translate(-50%,-50%) scale(2.2) rotate(-6deg)',opacity:0},
  {transform:'translate(-50%,-50%) scale(2.4) rotate(0)',opacity:1,offset:.22},
  {transform:`translate(calc(-50% + ${(x1-x0)*.55}px),calc(-50% + ${(y1-y0)*.35-60}px)) scale(1.5) rotate(8deg)`,opacity:1,offset:.6},
  {transform:`translate(calc(-50% + ${x1-x0}px),calc(-50% + ${y1-y0}px)) scale(.5) rotate(0)`,opacity:.3}],
  {duration:900,easing:'cubic-bezier(.4,0,.3,1)',fill:'forwards'});
 A.onfinish=()=>{f.remove();const b=document.querySelector(`.mu-tabs button[onclick*="'mias'"]`)||dst;bounce(b)}},delay||0)}

window.MANI={go,out,buy,
 // después de cada render: valores en pantalla, rebote del botón reemplazado y pulso sin reinicio
 after(cash,bks,f){fmt=f||fmt;bk=bks||[];const now=performance.now();
  cash.forEach((v,k)=>{if(disp[k]==null||bk[k]){disp[k]=tgt[k]=v;return}
   if(v!==tgt[k]){tgt[k]=v;clearTimeout(fb[k]);fb[k]=setTimeout(()=>go(k),2800)}paint(k)});
  disp.length=tgt.length=cash.length;
  document.querySelectorAll('.mu-b.go').forEach(b=>b.style.animationDelay=-(now%PULSE)+'ms');
  if(last&&now-last.t<700){const k=last.k;last=null;const b=[...document.querySelectorAll('.mu-hud button')].find(x=>key(x)===k);if(b)bounce(b)}},
 reset(){disp.length=tgt.length=0;an.length=0}};

const css=document.createElement('style');css.textContent=`
.mu-hud button:not(:disabled){transition:transform .3s cubic-bezier(.34,1.7,.5,1),background-color .18s,color .18s}
.mu-hud button:not(:disabled):active,.mu-hud .mu-b:not(:disabled):active{transform:scale(.94);transition-duration:.07s}
.mu-hud button.mu-rb{animation:murb .34s cubic-bezier(.3,1.6,.5,1)}
@keyframes murb{0%{transform:scale(.94)}55%{transform:scale(1.05)}100%{transform:scale(1)}}
.mu-b.go{animation:mugo ${PULSE}ms ease-in-out infinite}
.mu-b.go.mu-rb{animation:murb .34s cubic-bezier(.3,1.6,.5,1),mugo ${PULSE}ms ease-in-out .34s infinite}
@keyframes mugo{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--mu-red) 55%,transparent);filter:brightness(1)}
 50%{box-shadow:0 0 0 9px color-mix(in srgb,var(--mu-red) 0%,transparent);filter:brightness(1.08)}}
.mu-pi b.mu-cnt{color:var(--mu-red)}
@keyframes mupop{from{transform:translateY(12px) scale(.95);opacity:0}}
@keyframes muup{from{transform:translateY(24px);opacity:0}}
.mu-modal{animation-duration:.2s}
.mu-ghost{pointer-events:none!important;z-index:75}.mu-ghost *{pointer-events:none!important}
.mu-go-sheet{animation:mugos .2s ease-in forwards!important}
.mu-go-peek{animation:mugop .18s ease-in forwards!important}
.mu-go-modal{animation:mufout .2s ease-in forwards!important}.mu-go-modal .mu-mw{animation:mugop .2s ease-in forwards!important}
@keyframes mugos{to{transform:translateY(28px);opacity:0}}
@keyframes mugop{to{transform:translateY(10px) scale(.94);opacity:0}}
@keyframes mufout{to{opacity:0}}
.mu-fly{position:fixed;z-index:80;pointer-events:none;filter:drop-shadow(0 6px 10px rgba(0,0,0,.35))}
@media (prefers-reduced-motion:reduce){.mu-hud button,.mu-b.go{animation:none!important;transition:none!important}.mu-hud button:active{transform:none!important}}
`;document.head.appendChild(css);
})();
