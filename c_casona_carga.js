// c_casona_carga.js — CCARGA: pantalla de carga de los niveles de la casona (CASONA.md, pendiente de carga).
// goFloor (c_casa3d.js) llama CCARGA.espera(F) ya en negro: si el piso tarda, sale un panel con logo y barra de progreso
// (F.prog(): GLB y mapa de luz de c_casona_caja.js / CMAT). Se quita sola cuando F.listo se cumple; los reintentos los hace
// el piso solo (sin recargar). Tope de 90 s: después se entra igual y lo que falte aparece cuando llegue.
(function(){
const CSS=`#ccarga{position:fixed;inset:0;z-index:950;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;
 background:var(--ui-sheet,#2A1D16);color:var(--ui-text,#F7EADB);font-family:var(--ui-font,system-ui);opacity:0;transition:opacity .3s ease;pointer-events:auto}
#ccarga.on{opacity:1}
#ccarga .cc-logo{width:64px;height:64px;border-radius:20px;display:grid;place-items:center;background:var(--ui-chip);color:var(--ui-icon);animation:ccL 1.6s ease-in-out infinite}
#ccarga .cc-logo svg{width:34px;height:34px}
#ccarga .cc-barra{display:block;width:min(200px,55vw);height:6px;border-radius:999px;background:var(--ui-chip);box-shadow:inset 0 0 0 1px var(--ui-line);overflow:hidden}
#ccarga .cc-barra i{display:block;height:100%;width:0;border-radius:999px;background:var(--ui-accent);transition:width .25s linear}
#ccarga .cc-sub{min-height:1.2em;font-size:13px;font-weight:700;color:var(--ui-sub)}
@keyframes ccL{50%{transform:scale(.94)}}
@media (prefers-reduced-motion:reduce){#ccarga .cc-logo{animation:none}}`;
let el=null,bar=null,sub=null;
function arma(){if(el)return;const s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);
 el=document.createElement('div');el.id='ccarga';el.className='ui';el.setAttribute('role','progressbar');el.setAttribute('aria-label','Cargando');
 el.innerHTML=`<span class="cc-logo">${window.UI&&UI.ico?UI.ico('casa'):''}</span><span class="cc-barra"><i></i></span><span class="cc-sub"></span>`;
 bar=el.querySelector('i');sub=el.querySelector('.cc-sub')}
const muestra=()=>{arma();document.body.appendChild(el);void el.offsetWidth;el.classList.add('on')};
const quita=()=>new Promise(r=>{if(!el||!el.isConnected)return r();bar.style.width='100%';el.classList.remove('on');setTimeout(()=>{el.remove();r()},320)});

// espera a que el piso F esté completo; resuelve siempre (tope ms)
function espera(F,ms){if(!F||!F.listo)return Promise.resolve();let hecho=false;F.listo.then(()=>{hecho=true});
 return new Promise(res=>{const t0=performance.now(),tope=ms||90000;let vis=false,v=0;
  const tic=()=>{const t=performance.now()-t0;
   if(hecho||t>tope){(vis?quita():Promise.resolve()).then(res);return}
   const C=window.CORT&&CORT.enPiso();if(C){const p=F.prog?F.prog():{p:0,re:0};v+=(Math.max(v,Math.min(.97,Math.max(p.p||0,Math.min(.35,t/15000))))-v)*.25;CORT.prog(v,p.re)}
   if(!C&&!vis&&t>250){vis=true;muestra()}
   if(vis){const p=F.prog?F.prog():{p:0,re:0};v+=(Math.max(v,Math.min(.97,Math.max(p.p||0,Math.min(.35,t/15000))))-v)*.25;bar.style.width=(v*100).toFixed(1)+'%';sub.textContent=p.re?'Reintentando':''}
   setTimeout(tic,100)};
  tic()})}
window.CCARGA={espera};
})();
