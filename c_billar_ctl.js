// c_billar_ctl.js — BCTL: controles del Billar durante la partida. Abajo-derecha, en lugar del ojo y los gestos: Tirar (abre la barra de
// fuerza) y Vista (detrás / arriba, tecla C). La barra se jala hacia abajo con el dedo o el ratón; el taco se mueve con ella y cerca del
// máximo tiembla. Al soltar tira (menos de 3 %: no tira). Abajo-izquierda: salir, Mover blanca y Revancha; a media altura, el efecto en la vista de
// arriba. Arriba al centro: de quién es el tiro y el tiempo. Cuelga de <body>: #app se redibuja y en la casa no recibe toques.
// c_billar_juego.js: BCTL.cfg({pot,tira,vista,ef,act,mover}) una vez y BCTL.paso({on,tiro,vista,pot,ex,ey,mano,fin,chip}) cada cuadro.
(function(){
let cb={},carga=false,pz=null,ef=0,R=null,S={},maxOn=false;
const I=n=>window.UI?UI.ico(n):'',q=s=>R.querySelector(s),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
function css(){if(document.getElementById('bctlCss'))return;const s=document.createElement('style');s.id='bctlCss';s.textContent=`
html.bijon #joy,html.bijon .h3sign,html.bijon .uh-br .ui-rb:not(.big){display:none!important}
.bctl>*{position:fixed;pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none}
.bctl [hidden],.bctl[hidden]{display:none!important}
.bctl-chip{left:50%;top:calc(76px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:13;max-width:calc(100vw - 32px);padding:7px 16px;border-radius:999px;
 background:var(--ui-panel);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow);color:var(--ui-text);font:700 14px/1.25 var(--ui-font);text-align:center;pointer-events:none!important}
.bctl-chip small{display:block;color:var(--ui-sub);font-size:12px}
.bctl-vis{right:calc(22px + env(safe-area-inset-right,0px));bottom:calc(112px + env(safe-area-inset-bottom,0px));z-index:13}
.bctl-vis.on{background:var(--ui-accent);color:var(--ui-on)}
.bctl-tir{right:calc(98px + env(safe-area-inset-right,0px));bottom:calc(30px + env(safe-area-inset-bottom,0px));z-index:13;min-height:58px;min-width:112px;font-size:16px;padding:0 22px}
.bctl-izq{left:calc(16px + env(safe-area-inset-left,0px));bottom:calc(30px + env(safe-area-inset-bottom,0px));z-index:13;display:flex;flex-direction:column-reverse;align-items:flex-start;gap:8px;pointer-events:none!important}
.bctl-izq>*{pointer-events:auto}.bctl-izq .ui-btn{min-height:46px}
.bctl-ef{left:calc(16px + env(safe-area-inset-left,0px));top:50%;margin-top:-36px;z-index:13;width:72px;height:72px;border-radius:50%;cursor:grab;
 background:radial-gradient(circle at 35% 30%,#fff,#ece6da 60%,#cfc6b6);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow)}
.bctl-ef i{position:absolute;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#222;left:50%;top:50%}
.bctl-pot{right:calc(18px + env(safe-area-inset-right,0px));top:50%;transform:translateY(-50%);z-index:14;width:84px;height:min(48vh,320px);display:flex;flex-direction:column;align-items:center;gap:8px;cursor:ns-resize}
.bctl-tr{position:relative;flex:1;width:30px;border-radius:999px;background:var(--ui-panel);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow)}
.bctl-tr b{position:absolute;left:5px;right:5px;top:5px;border-radius:999px;background:var(--ui-accent);opacity:.55;height:0}
.bctl-kn{position:absolute;left:50%;top:0;width:62px;height:62px;margin-left:-31px;border-radius:50%;background:var(--ui-accent);color:var(--ui-on);
 box-shadow:var(--ui-shadow);display:flex;align-items:center;justify-content:center;transition:transform .12s}
.bctl-kn .ui-ico{width:26px;height:26px}
.bctl-pot.drag .bctl-kn{transform:scale(1.08)}
.bctl-pot span{font:800 14px var(--ui-font);color:var(--ui-text);background:var(--ui-panel);border:1px solid var(--ui-line);border-radius:999px;padding:3px 10px;box-shadow:var(--ui-shadow)}
.bctl-pot.max .bctl-kn{animation:bctlTi .07s linear infinite alternate}.bctl-pot.max .bctl-tr b{opacity:1}
@keyframes bctlTi{from{translate:-2px 1px}to{translate:2px -1px}}
@media (max-height:520px){.bctl-chip{top:calc(62px + env(safe-area-inset-top,0px))}.bctl-vis{right:calc(16px + env(safe-area-inset-right,0px));bottom:calc(78px + env(safe-area-inset-bottom,0px))}
 .bctl-tir{right:calc(82px + env(safe-area-inset-right,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px))}.bctl-izq{bottom:calc(12px + env(safe-area-inset-bottom,0px))}
.bctl-pot{height:min(70vh,260px)}}`;document.head.appendChild(s)}
function arma(){css();R=document.createElement('div');R.className='ui bctl';R.hidden=true;
 R.innerHTML=`<div class="bctl-chip" role="status"></div>
 <div class="bctl-pot" aria-label="Fuerza: jala hacia abajo y suelta para tirar"><div class="bctl-tr"><b></b><i class="bctl-kn">${I('abajo')}</i></div><span>0%</span></div>
 <button class="ui-rb mid bctl-vis"></button><button class="ui-btn bctl-tir"></button>
 <div class="bctl-izq"><button class="ui-rb bctl-sal" aria-label="Salir del Billar" title="Salir del Billar">${I('salir')}</button>
  <button class="ui-btn sec bctl-mov">Mover blanca</button><button class="ui-btn bctl-rev">Revancha</button></div>
 <div class="bctl-ef" aria-label="Efecto: arrastra el punto"><i></i></div>`;document.body.appendChild(R);
 const tap=(s,f)=>{const b=q(s);b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('click',e=>{e.stopPropagation();f()})};
 tap('.bctl-vis',()=>cb.vista&&cb.vista());tap('.bctl-sal',()=>cb.act&&cb.act('salir'));tap('.bctl-mov',()=>{carga=false;cb.mover&&cb.mover()});
 tap('.bctl-rev',()=>cb.act&&cb.act('revancha'));tap('.bctl-tir',()=>{carga=!carga;if(!carga&&cb.pot)cb.pot(0)});
 const po=q('.bctl-pot'),tr=q('.bctl-tr');
 po.addEventListener('pointerdown',e=>{if(!S.tiro)return;e.preventDefault();e.stopPropagation();
  const h=Math.max(40,tr.clientHeight-62);pz={id:e.pointerId,y0:e.clientY-(S.pot||0)*h,h};po.classList.add('drag');try{po.setPointerCapture(e.pointerId)}catch(_){}});
 po.addEventListener('pointermove',e=>{if(!pz||pz.id!==e.pointerId)return;e.stopPropagation();cb.pot&&cb.pot(cl((e.clientY-pz.y0)/pz.h,0,1))});
 const fin=(e,ok)=>{if(!pz||pz.id!==e.pointerId)return;pz=null;po.classList.remove('drag');if(ok&&S.pot>=.03){carga=false;cb.tira&&cb.tira()}else cb.pot&&cb.pot(0)};
 po.addEventListener('pointerup',e=>fin(e,true));po.addEventListener('pointercancel',e=>fin(e,false));po.addEventListener('lostpointercapture',e=>fin(e,false));
 const eb=q('.bctl-ef'),efm=e=>{const r=eb.getBoundingClientRect();let x=(e.clientX-r.left)/r.width*2-1,y=-((e.clientY-r.top)/r.height*2-1);const m=Math.hypot(x,y);
  if(m>.85){x*=.85/m;y*=.85/m}cb.ef&&cb.ef(Math.abs(x)<.06?0:x/.85,Math.abs(y)<.06?0:y/.85)};
 eb.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();ef=1;efm(e);try{eb.setPointerCapture(e.pointerId)}catch(_){}});
 eb.addEventListener('pointermove',e=>{if(ef)efm(e)});eb.addEventListener('pointerup',()=>{ef=0});eb.addEventListener('dblclick',()=>cb.ef&&cb.ef(0,0))}
const show=(s,on)=>{const e=q(s);if(e.hidden===on)e.hidden=!on;return e};
function paso(s){S=s;if(!s.on){if(R&&!R.hidden){R.hidden=true;carga=false;pz=null}return}if(!R)arma();R.hidden=false;
 if(!s.tiro){carga=false;pz=null}
 const ch=show('.bctl-chip',!!s.chip);if(ch.dataset.h!==s.chip){ch.dataset.h=s.chip;ch.innerHTML=s.chip}
 const ar=s.vista==='arriba',v=q('.bctl-vis'),vt=ar?'Ver desde detrás de la blanca':'Ver toda la mesa desde arriba';
 if(v.dataset.t!==vt){v.dataset.t=vt;v.innerHTML=I(ar?'camara':'arriba');v.setAttribute('aria-label',vt);v.title=vt+(matchMedia('(hover:hover)').matches?' (C)':'');v.classList.toggle('on',ar)}
 const t=show('.bctl-tir',!!s.tiro),tt=carga?'Cancelar':'Tirar';if(t.textContent!==tt){t.textContent=tt;t.classList.toggle('sec',carga)}
 show('.bctl-mov',!!s.mano);show('.bctl-rev',!!s.fin);
 const p=show('.bctl-pot',!!s.tiro&&(carga||s.pot>.01||!!pz));if(!p.hidden){const pt=s.pot||0,h=Math.max(40,q('.bctl-tr').clientHeight-62);
  q('.bctl-kn').style.top=(pt*h)+'px';q('.bctl-tr b').style.height=(pt*h+26)+'px';q('.bctl-pot span').textContent=Math.round(pt*100)+'%';
  const mx=pt>.82;if(mx!==maxOn){maxOn=mx;p.classList.toggle('max',mx);if(mx&&navigator.vibrate)try{navigator.vibrate(12)}catch(e){}}}
 const e=show('.bctl-ef',!!s.tiro&&ar);if(!e.hidden){const d=e.firstChild;d.style.left=(50+s.ex*.85*50)+'%';d.style.top=(50-s.ey*.85*50)+'%'}}
window.BCTL={cfg:o=>{cb=o||{}},paso,carga:()=>carga};
addEventListener('blur',()=>{pz=null});
})();
