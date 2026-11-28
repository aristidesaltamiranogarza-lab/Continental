// c_cortina.js — CORT: la cortina que reemplaza el fundido a negro de CCAM.fade (c_casa_cam.js), al nivel de la portada.
// - Cambio de piso (goFloor llama CORT.destino(id,desde) antes del fundido): la cortina entra en la dirección del viaje (subir: baja
//   desde arriba), sale un corte de la casona con tu figura que salta del piso de origen al destino, el piso destino se llena con el
//   progreso real (CCARGA.espera llama CORT.prog) y el nombre cae letra por letra; al salir, la cortina sigue de largo.
// - Cualquier otro fundido (ir a una mesa, entrar a un juego, sótano): iris cálido que se cierra con la casita latiendo y se abre.
// - CORT.mini(texto): versión chica del corte para cargas dentro de paneles (entrar por enlace o a una sala; LOBBY.carga).
(function(){
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const NIV={ter:{i:0,n:'Azotea',y:23},alta:{i:1,n:'Planta alta',y:45},pb:{i:2,n:'Planta baja',y:69},sot:{i:3,n:'Sótano',y:93}};
const ORD=['ter','alta','pb','sot'];
const CSS=`#cort{position:fixed;inset:0;z-index:900;pointer-events:none;display:grid;place-items:center;visibility:hidden;
 --co-c1:#F7DDB0;--co-c2:#EFB27C;--co-lin:#7A3E1E;--co-muro:#E8BE98;--co-tierra:#C9A27F;--co-acc:var(--ui-accent,#C96B3C);--co-txt:#5A2E16;
 background:linear-gradient(180deg,var(--co-c1),var(--co-c2));color:var(--co-txt);font-family:var(--ui-font,system-ui)}
html[data-tema=noche] #cort{--co-c1:#33241B;--co-c2:#1E1510;--co-lin:#F0D9BF;--co-muro:#4A3428;--co-tierra:#2A1D15;--co-txt:#F7EADB}
#cort.on{visibility:visible;pointer-events:auto}
#cort .co-c{display:flex;flex-direction:column;align-items:center;gap:14px;transform:scale(0);opacity:0;transition:transform .5s cubic-bezier(.3,1.4,.5,1),opacity .2s}
#cort.ver .co-c{transform:none;opacity:1}
#cort.sale .co-c{transform:scale(.85);opacity:0;transition:transform .22s ease-in,opacity .2s}
#cort svg.co-casa{width:min(210px,42vmin);height:auto;overflow:visible}
.co-casa .ln{fill:none;stroke:var(--co-lin);stroke-width:1.6;stroke-linejoin:round;stroke-linecap:round}
.co-casa .mu{fill:var(--co-muro)}.co-casa .ti{fill:var(--co-tierra);opacity:.55}
.co-casa .ll{fill:var(--co-acc);opacity:.85;transform-box:fill-box;transform-origin:0 50%;transform:scaleX(0);transition:transform .3s linear}
.co-casa .bd{transition:opacity .3s}.co-casa .bd.no{opacity:.45}
.co-casa .pj{transition:transform .62s cubic-bezier(.35,1.5,.5,1)}
.co-casa .pj .cu{fill:var(--co-lin)}
.co-casa .pj.va{animation:coSal .62s cubic-bezier(.3,0,.4,1)}
#cort .co-n{font:800 clamp(18px,4.4vmin,26px)/1 var(--ui-font,system-ui);letter-spacing:.01em;display:flex;min-height:1em}
#cort .co-n span{display:inline-block;white-space:pre;animation:coLetra .5s cubic-bezier(.3,1.5,.5,1) both}
#cort .co-re{font:700 13px var(--ui-font,system-ui);opacity:.75;min-height:1.2em}
#cort .co-logo{width:66px;height:66px;border-radius:22px;display:grid;place-items:center;background:rgba(255,250,240,.55);color:var(--co-lin);animation:coLat 1.1s ease-in-out infinite}
html[data-tema=noche] #cort .co-logo{background:rgba(255,240,220,.08)}
#cort .co-logo svg{width:34px;height:34px}
@keyframes coLetra{from{transform:translateY(-120%) rotate(-14deg);opacity:0}}
@keyframes coLat{40%{transform:scale(1.08)}}
@keyframes coSal{40%{translate:0 -9px}}
/* versión chica (CORT.mini) */
.co-mini{display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 0;color:var(--ui-sub)}
.co-mini svg{width:96px;height:auto;overflow:visible;--co-lin:var(--ui-text,#5A2E16);--co-muro:var(--ui-chip,#F3E3CF);--co-tierra:var(--ui-line,#D9C2A8);--co-acc:var(--ui-accent,#C96B3C)}
.co-mini .pj{animation:coMini 2.8s cubic-bezier(.4,1.4,.5,1) infinite}
.co-mini .ll{transform:none;animation:coLlena 2.8s ease-in-out infinite}
.co-mini b{font:700 13px var(--ui-font,system-ui)}
@keyframes coMini{0%,18%{transform:translate(60px,69px)}30%,48%{transform:translate(60px,45px)}60%,78%{transform:translate(60px,23px)}90%,100%{transform:translate(60px,69px)}}
@keyframes coLlena{0%{transform:scaleX(0)}70%{transform:scaleX(1)}100%{transform:scaleX(1);opacity:0}}
@media (prefers-reduced-motion:reduce){#cort .co-c,#cort .co-n span,#cort .co-logo,.co-mini .pj,.co-mini .ll{animation:none;transition:opacity .15s}}`;

// corte de la casona: azotea con pérgola, planta alta, planta baja, suelo y sótano; una franja .bd por piso con su relleno .ll
function svg(){const b=(k,t,h)=>`<g class="bd" data-k="${k}"><rect class="mu" x="22" y="${t}" width="76" height="${h}" rx="1.5"/><rect class="ll" x="22" y="${t}" width="76" height="${h}" rx="1.5"/><rect class="ln" x="22" y="${t}" width="76" height="${h}" rx="1.5"/></g>`;
 return `<svg class="co-casa" viewBox="0 0 120 100" aria-hidden="true">`+
  `<rect class="ti" x="4" y="70" width="112" height="28" rx="3"/>`+
  `<g class="bd" data-k="ter"><rect class="ll" x="30" y="12" width="60" height="12"/><path class="ln" d="M28 12H92M34 12V24M52 12V24M70 12V24M86 12V24"/></g>`+
  b('alta',24,22)+b('pb',46,24)+b('sot',72,22)+
  `<path class="ln" d="M4 70H22M98 70H116"/><path class="ln" d="M36 34h10v8H36zM74 34h10v8H74zM54 58h12v12"/>`+
  `<g class="pj" style="transform:translate(60px,69px)"><g transform="translate(0,-12)"><circle class="cu" cx="0" cy="3.2" r="3.4"/><rect class="cu" x="-3.2" y="6.6" width="6.4" height="7.4" rx="2.8"/></g></g></svg>`}

let el=null,cas=null,nom=null,re=null,pend=null,modo=null,tCub=0;
function arma(){if(el)return;const s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);
 el=document.createElement('div');el.id='cort';el.setAttribute('aria-hidden','true');el.innerHTML=`<div class="co-c"></div>`;document.body.appendChild(el);cas=el.firstChild}
const I=n=>window.UI&&UI.ico?UI.ico(n):'';
const letras=t=>[...t].map((c,i)=>`<span style="animation-delay:${(.18+i*.035).toFixed(3)}s">${c==='<'?'&lt;':c}</span>`).join('');
const espera=ms=>new Promise(r=>setTimeout(r,ms));

// estado inicial de cada modo antes de cubrir
function prepara(){
 if(pend&&NIV[pend.a]){const a=NIV[pend.a],o=NIV[pend.de]||a,sube=a.i<o.i;modo={k:'piso',sube,a:pend.a};
  cas.innerHTML=svg()+`<div class="co-n"></div><div class="co-re"></div>`;nom=cas.querySelector('.co-n');re=cas.querySelector('.co-re');
  cas.querySelectorAll('.bd').forEach(g=>g.classList.toggle('no',g.dataset.k!==pend.a&&g.dataset.k!==pend.de));
  cas.querySelector('.pj').style.transform=`translate(60px,${o.y}px)`;
  el.style.transition='none';el.style.clipPath='none';el.style.opacity='1';el.style.transform=`translateY(${sube?-101:101}%)`}
 else{modo={k:'iris'};cas.innerHTML=`<span class="co-logo">${I('casa')}</span>`;
  el.style.transition='none';el.style.transform='none';el.style.opacity='1';el.style.clipPath='circle(0% at 50% 50%)'}
 pend=null;el.classList.remove('ver','sale');el.classList.add('on');void el.offsetWidth}

function cubre(ms){arma();prepara();
 if(RM){el.style.clipPath='none';el.style.transform='none';el.style.opacity='0';void el.offsetWidth;el.style.transition=`opacity ${ms}ms`;el.style.opacity='1'}
 else if(modo.k==='piso'){el.style.transition=`transform ${ms+120}ms cubic-bezier(.6,0,.3,1)`;el.style.transform='none';ms+=120}
 else{el.style.transition=`clip-path ${ms}ms cubic-bezier(.55,0,.35,1)`;el.style.clipPath='circle(75% at 50% 50%)'}
 return espera(ms*.55).then(()=>{el.classList.add('ver');
  if(modo&&modo.k==='piso'){const a=NIV[modo.a],pj=cas.querySelector('.pj');nom.innerHTML=letras(a.n);
   setTimeout(()=>{pj.classList.add('va');pj.style.transform=`translate(60px,${a.y}px)`;const d=cas.querySelector(`.bd[data-k="${modo.a}"]`);if(d)d.classList.remove('no')},120);
   prog(.08)}
  return espera(ms*.45+20)}).then(()=>{tCub=performance.now()})}

function abre(ms){if(!el||!el.classList.contains('on'))return espera(ms+20);
 const m=modo||{k:'iris'};let pre=Promise.resolve();
 if(m.k==='piso'){prog(1);const falta=760-(performance.now()-tCub);if(falta>0)pre=espera(falta)}   // que se alcance a leer el viaje
 return pre.then(()=>{el.classList.add('sale');return espera(RM?0:140)}).then(()=>{
  if(RM){el.style.transition=`opacity ${ms}ms`;el.style.opacity='0'}
  else if(m.k==='piso'){el.style.transition=`transform ${ms+140}ms cubic-bezier(.6,0,.3,1)`;el.style.transform=`translateY(${m.sube?101:-101}%)`;ms+=140}
  else{el.style.transition=`clip-path ${ms}ms cubic-bezier(.5,0,.3,1)`;el.style.clipPath='circle(0% at 50% 50%)'}
  return espera(ms+20)}).then(()=>{if(!el.classList.contains('sale'))return;el.classList.remove('on','ver','sale');modo=null})}

// CCAM.fade(to,ms) llega aquí
function fade(to,ms){ms=RM?Math.min(ms||0,150):(ms||400);return to>0?cubre(ms):abre(ms)}
function prog(v,reint){if(!modo||modo.k!=='piso'||!cas)return;const l=cas.querySelector(`.bd[data-k="${modo.a}"] .ll`);if(l)l.style.transform=`scaleX(${Math.max(0,Math.min(1,v)).toFixed(3)})`;if(re)re.textContent=reint?'Reintentando':''}

window.CORT={fade,prog,destino:(a,de)=>{pend={a,de}},enPiso:()=>!!(modo&&modo.k==='piso'),
 mini:t=>{arma();return `<div class="co-mini" role="progressbar" aria-label="${String(t||'Cargando').replace(/[&<>"]/g,'')}">${svg()}<b>${String(t||'').replace(/[&<>"]/g,'')}</b></div>`}};
})();
