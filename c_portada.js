// c_portada.js — PTDA: portada animada al abrir el juego (antes de la casa). Cielo, la fachada de la casona, fichas que flotan y dos
// tarjetas: Plano (2D) o Casa (3D, con Medio/HD). Al elegir Plano la portada se sube como telón y el plano entra girando (PLANO2D.entra);
// al elegir Casa la fachada se vuelve la pantalla de carga (las ventanas se prenden con el progreso del piso) y al estar lista se entra
// por la puerta. Mientras está, c_casa3d.js no arma la casa (home() mira PTDA.pend()). La primera vez sale antes la bienvenida
// (c_bienvenida.js), que al Entrar usa PTDA.ve(q) para las mismas transiciones. Se carga después de c_bienvenida.js y antes de c_casa3d.js.
(function(){
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const inGame=()=>typeof S!=='undefined'&&!!S,I=n=>window.UI&&UI.ico?UI.ico(n):'',noche=()=>document.documentElement.dataset.tema==='noche';
const es=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=document.createElement('style');css.textContent=`
#port{--pt-c1:#F7DDB0;--pt-c2:#EFB27C;--pt-muro:#E7B47A;--pt-muro2:#D39A5E;--pt-marco:#FFF4E2;--pt-vid:#5C86A6;--pt-luz:#FFD98A;--pt-teja:#A8532E;--pt-hoja:#5F8A45;--pt-sol:#FFE7A8;--pt-nube:#FFFAF0;--pt-nubea:.75;
 position:fixed;inset:0;z-index:1001;overflow:hidden;color:var(--ui-text);font-family:var(--ui-font);background:linear-gradient(180deg,var(--pt-c1),var(--pt-c2));
 display:grid;grid-template-rows:auto 1fr;grid-template-columns:minmax(0,1fr);touch-action:manipulation;user-select:none;-webkit-user-select:none;transition:transform .6s cubic-bezier(.6,0,.3,1),opacity .5s}
html[data-tema=noche] #port{--pt-c1:#1C1430;--pt-c2:#47284A;--pt-muro:#6E4A34;--pt-muro2:#583926;--pt-marco:#E9D6BE;--pt-vid:#2B2F4A;--pt-teja:#6A2E1A;--pt-hoja:#2F4A2A;--pt-sol:#F2E6C8;--pt-nube:#FFF0E6;--pt-nubea:.12}
#port button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
#port .pt-sol{position:absolute;right:12%;top:9%;width:min(18vmin,110px);aspect-ratio:1;border-radius:50%;background:var(--pt-sol);box-shadow:0 0 60px 10px color-mix(in srgb,var(--pt-sol) 45%,transparent);animation:ptSol .9s .1s cubic-bezier(.3,1.4,.5,1) both}
html[data-tema=noche] #port .pt-sol{box-shadow:inset -14px -6px 0 0 color-mix(in srgb,var(--pt-c2) 70%,var(--pt-sol)),0 0 40px 4px rgba(242,230,200,.18)}
#port .pt-nb{position:absolute;height:22px;border-radius:999px;background:var(--pt-nube);opacity:var(--pt-nubea);animation:ptNube linear infinite}
#port .pt-nb::before{content:'';position:absolute;left:22%;bottom:40%;width:45%;height:150%;border-radius:50%;background:inherit}
#port .pt-fl{position:absolute;width:34px;opacity:.85;animation:ptFlota ease-in-out infinite alternate;filter:drop-shadow(0 4px 6px rgba(58,36,22,.2))}
#port .pt-fl svg{display:block;width:100%;height:auto}
#port .pt-fach{position:absolute;left:50%;bottom:-2px;width:min(118vw,160vh,900px);translate:-50% 0;transform-origin:50% 64%;animation:ptSube .9s .15s cubic-bezier(.25,1.25,.4,1) both;transition:transform .9s cubic-bezier(.5,0,.2,1),bottom .9s cubic-bezier(.5,0,.2,1),opacity .6s}
#port .pt-fach svg{display:block;width:100%;height:auto}
#port .pt-fach .w{fill:var(--pt-vid);transition:fill .5s}#port .pt-fach .w.on{fill:var(--pt-luz)}
html[data-tema=noche] #port .pt-fach .w.n{fill:var(--pt-luz)}
#port .pt-top{position:relative;display:flex;align-items:center;gap:12px;padding:max(14px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) 0 max(16px,env(safe-area-inset-left))}
#port .pt-logo{display:flex;font:900 clamp(30px,7vmin,52px)/1 var(--ui-font);letter-spacing:-.01em;color:var(--ui-text);text-shadow:0 3px 0 color-mix(in srgb,var(--ui-accent) 35%,transparent)}
#port .pt-logo span{display:inline-block;animation:ptLetra .7s cubic-bezier(.3,1.6,.5,1) both}
#port .pt-logo span:nth-child(n+5){color:var(--ui-accent)}
#port .pt-yo{margin-left:auto;display:flex;align-items:center;gap:8px;padding:4px 14px 4px 4px;min-height:48px;border-radius:999px;border:1px solid var(--ui-line);background:var(--ui-panel);box-shadow:var(--ui-shadow);font-weight:800;animation:ptPop .6s .55s cubic-bezier(.3,1.5,.5,1) both;transition:transform .15s}
#port .pt-yo:active{transform:scale(.94)}
#port .pt-pj{width:40px;height:40px;border-radius:50%;overflow:hidden;background:var(--ui-chip);display:grid;place-items:center;animation:ptBob 2.6s 1.2s ease-in-out infinite}
#port .pt-pj canvas,#port .pt-pj img{width:100%;height:100%;display:block}
#port .pt-yo{padding-right:4px}#port .pt-pjb{padding:0;border:0;background:none;border-radius:50%}
#port .pt-nm{width:9ch;min-width:4ch;max-width:34vw;min-height:36px;padding:0 4px;border:0;border-bottom:2px dashed transparent;background:transparent;color:var(--ui-text);font:800 1em var(--ui-font);outline:none}
#port .pt-nm:focus{border-bottom-color:var(--ui-accent)}#port .pt-nm.mal{animation:ptMal .4s}
#port .pt-dado{flex:none;width:40px;height:40px;display:grid;place-items:center;padding:0;border:0;border-radius:50%;background:var(--ui-chip);color:var(--ui-icon);transition:transform .3s}
#port .pt-dado:active{transform:rotate(180deg) scale(.9)}#port .pt-dado svg{width:22px;height:22px}
@keyframes ptMal{25%{translate:-6px 0}75%{translate:6px 0}}
#port .pt-mid{position:relative;display:flex;align-items:center;justify-content:center;padding:8px 16px 30vh}
#port .pt-ops{display:flex;gap:clamp(12px,3vw,24px);width:100%;max-width:560px;justify-content:center}
#port .pt-op{flex:1;max-width:250px;display:flex;flex-direction:column;gap:8px;animation:ptCarta .7s cubic-bezier(.3,1.4,.5,1) both}
#port .pt-op:nth-child(1){animation-delay:.45s;--r:-3deg}#port .pt-op:nth-child(2){animation-delay:.6s;--r:3deg}
#port .pt-go{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;padding:14px 10px 14px;border-radius:var(--ui-r);border:2px solid transparent;background:var(--ui-sheet);box-shadow:var(--ui-shadow);
 transition:transform .25s cubic-bezier(.3,1.5,.5,1),box-shadow .25s,border-color .2s}
@media (hover:hover){#port .pt-go:hover{transform:translateY(-6px) rotate(var(--r));border-color:var(--ui-accent)}}
html.teclado #port .pt-go:focus-visible{transform:translateY(-6px) rotate(var(--r));outline:none;border-color:var(--ui-accent)}
#port .pt-go:active{transform:translateY(-2px) scale(.95);transition-duration:.08s}
#port .pt-il{width:min(100%,150px);aspect-ratio:3/2;display:block;color:var(--ui-icon)}
#port .pt-il svg{width:100%;height:100%;display:block;overflow:visible}
@media (hover:hover){#port .pt-go:hover .pt-il svg{animation:ptMueve .6s ease-in-out}}
html.teclado #port .pt-go:focus-visible .pt-il svg{animation:ptMueve .6s ease-in-out}
#port .pt-go b{font-size:1.25em;font-weight:900}#port .pt-go small{font-weight:700;color:var(--ui-sub)}
#port .pt-seg{display:flex;align-self:center;padding:3px;border-radius:999px;background:var(--ui-panel);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow)}
#port .pt-seg button{min-height:36px;min-width:64px;padding:0 12px;border:0;border-radius:999px;background:transparent;font-weight:800;font-size:.9em;color:var(--ui-sub);transition:background .2s,color .2s,transform .15s}
#port .pt-seg button.on{background:var(--ui-accent);color:var(--ui-on)}#port .pt-seg button:active{transform:scale(.92)}
#port .pt-sp{height:42px}
#port .pt-bar{position:absolute;left:50%;bottom:9vh;translate:-50% 0;width:min(220px,60vw);height:8px;border-radius:999px;background:var(--ui-panel);box-shadow:var(--ui-shadow);overflow:hidden;opacity:0;transition:opacity .3s}
#port .pt-bar i{display:block;height:100%;width:0;border-radius:999px;background:var(--ui-accent);transition:width .3s linear}
/* elegir */
#port.bnv .pt-ops,#port.bnv .pt-top{visibility:hidden}
#port.sale .pt-op:not(.yo){animation:ptFuera .35s ease-in both}
#port.sale .pt-op.yo .pt-go{animation:ptLatido .4s ease-out}
#port.a2d.va{transform:translateY(-104%)}
#port.a3d .pt-top,#port.a3d .pt-ops{transition:opacity .35s .15s,transform .45s .15s}#port.a3d .pt-top{opacity:0;transform:translateY(-30px)}#port.a3d .pt-ops{opacity:0;transform:translateY(30px) scale(.9)}
#port.a3d .pt-fach{bottom:22vh;transform:scale(1.08)}
#port.a3d .pt-bar{opacity:1;transition-delay:.5s}
#port.a3d .pt-fl{animation-duration:2.4s!important}
#port.a3d.va{opacity:0;transition:opacity .7s .25s}#port.a3d.va .pt-fach{transform:scale(5.5);transition:transform 1s cubic-bezier(.6,0,.4,1)}
@keyframes ptSol{from{transform:scale(0)}}
@keyframes ptNube{from{transform:translateX(-30vw)}to{transform:translateX(130vw)}}
@keyframes ptFlota{from{transform:translateY(0) rotate(var(--a0))}to{transform:translateY(-26px) rotate(var(--a1))}}
@keyframes ptSube{from{transform:translateY(70%)}}
@keyframes ptLetra{from{transform:translateY(-120%) rotate(-14deg);opacity:0}}
@keyframes ptPop{from{transform:scale(0)}}
@keyframes ptBob{50%{transform:translateY(-3px) rotate(-4deg)}}
@keyframes ptCarta{from{transform:translateY(60px) scale(.6) rotate(calc(var(--r)*3));opacity:0}}
@keyframes ptMueve{30%{transform:rotate(-5deg) scale(1.06)}65%{transform:rotate(4deg) scale(1.04)}}
@keyframes ptFuera{to{transform:translateY(40px) scale(.8);opacity:0}}
@keyframes ptLatido{40%{transform:scale(1.07)}}
@media (orientation:landscape) and (max-height:500px){#port .pt-mid{padding:4px max(16px,3vw) 10px 50vw;justify-content:center}#port .pt-ops{flex-direction:column;width:min(290px,44vw);max-width:none;gap:10px}
 #port .pt-op{position:relative;max-width:none}#port .pt-sp{display:none}
 #port .pt-go{display:grid;grid-template-columns:auto 1fr;justify-items:start;align-items:center;column-gap:12px;row-gap:0;width:100%;padding:8px 12px 8px 10px}
 #port .pt-il{grid-row:1/3;width:min(76px,20vh)}#port .pt-go b{align-self:end}#port .pt-go small{align-self:start}
 #port .pt-seg{position:absolute;right:12px;top:50%;translate:0 -50%;padding:2px;box-shadow:none;background:var(--ui-chip)}#port .pt-seg button{min-height:30px;min-width:0;padding:0 10px;font-size:.8em}
 #port .pt-fach{width:min(48vw,120vh,760px);left:26%}#port.a3d .pt-fach{left:50%;bottom:10vh}
 #port .pt-fl.k1{left:40%!important;top:30%!important}#port .pt-fl.k3{display:none}#port .pt-fl.k4{left:26%!important;top:22%!important}}
#port .pt-yo{position:relative}#port .pt-top{z-index:5}
#port .pt-tema{flex:none;width:48px;height:48px;display:grid;place-items:center;padding:0;border:1px solid var(--ui-line);border-radius:50%;background:var(--ui-panel);box-shadow:var(--ui-shadow);color:var(--ui-icon);animation:ptPop .6s .65s cubic-bezier(.3,1.5,.5,1) both;transition:transform .3s}
#port .pt-tema:active{transform:rotate(-40deg) scale(.9)}#port .pt-tema svg{width:24px;height:24px}
#port .pt-guia{position:absolute;top:calc(100% + 4px);left:6px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;pointer-events:none;color:var(--ui-accent);font:800 14px/1.2 var(--ui-font);max-width:min(230px,46vw);animation:ptPop .5s 1.4s cubic-bezier(.3,1.5,.5,1) both;transform-origin:20px 0;z-index:2}
#port .pt-guia svg{flex:none;width:34px;height:34px;animation:ptFlecha 1.1s 2s ease-in-out infinite}
#port .pt-guia span{padding:6px 12px;border-radius:999px;background:var(--ui-panel);box-shadow:var(--ui-shadow);color:var(--ui-text)}
#port .pt-guia.va{animation:ptFuera .3s ease-in both}
@keyframes ptFlecha{50%{transform:translateY(-6px)}}
#port .pt-ops{position:relative}
html[data-tema=noche] #port .pt-go{background:color-mix(in srgb,var(--ui-sheet),#fff 9%);border-color:var(--ui-line)}html[data-tema=noche] #port .pt-go:is(:hover,:focus-visible){border-color:var(--ui-accent)}
#port .pt-ops{flex-wrap:wrap}#port .pt-ayu{flex-basis:100%;margin:0 auto;min-height:32px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:var(--ui-sub);font:700 13px/1 var(--ui-font);text-decoration:underline dotted;text-underline-offset:3px;opacity:.8;animation:ptPop .5s 1s cubic-bezier(.3,1.5,.5,1) both;transition:opacity .2s}
#port .pt-ayu:hover{opacity:1}
#port .pt-ayu:hover{opacity:1}
#port .pt-ayu.on{opacity:1;color:var(--ui-accent)}
#port .pt-ayp{position:absolute;inset:0 0 auto 0;margin:auto;max-width:340px;z-index:4;padding:14px 16px;border-radius:18px;background:var(--ui-panel);backdrop-filter:blur(8px);box-shadow:var(--ui-shadow);border:1px solid var(--ui-line);display:grid;gap:8px;font-size:14px;line-height:1.3;transform-origin:20% 100%;animation:ptPop .3s cubic-bezier(.3,1.4,.5,1) both}
#port .pt-ayp.va{animation:ptFuera .25s ease-in both}
#port .pt-ayp b{display:block;font-weight:900}#port .pt-ayp p{margin:0;color:var(--ui-sub)}
@media (orientation:landscape) and (max-height:500px){#port .pt-ayp{inset:50% calc(100% + 14px) auto auto;width:270px;max-width:none;translate:0 -50%;transform-origin:100% 50%}#port .pt-guia{font-size:13px;max-width:none;white-space:nowrap;top:50%;left:auto;right:calc(100% + 6px);translate:0 -50%;flex-direction:row-reverse;align-items:center;transform-origin:100% 50%}#port .pt-guia svg{width:26px;height:26px;rotate:90deg}}
@media (max-width:420px){#port .pt-top{gap:8px}#port .pt-logo{font-size:24px}#port .pt-yo{gap:6px;padding:3px}#port .pt-pj{width:36px;height:36px}#port .pt-dado{width:34px;height:34px}#port .pt-tema{width:42px;height:42px}#port .pt-yo{min-height:44px}}
@media (prefers-reduced-motion:reduce){#port *,#port{animation-duration:.01s!important;animation-iteration-count:1!important}}`;
document.head.appendChild(css);

// dibujos (trazo de UI.ico): plano con mesa y sillas; casita en 3D
const IL2='<svg viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><rect x="8" y="6" width="104" height="68" rx="4"/><path d="M8 40h34M64 6v24M64 46v28M42 40v34M86 40h26"/><circle cx="88" cy="22" r="8" fill="currentColor" fill-opacity=".18"/><circle cx="88" cy="9.5" r="2.2"/><circle cx="100.5" cy="22" r="2.2"/><circle cx="88" cy="34.5" r="2.2"/><circle cx="75.5" cy="22" r="2.2"/><rect x="16" y="50" width="16" height="16" rx="3" fill="currentColor" fill-opacity=".18"/><path d="M20 14h28v16H20z" stroke-dasharray="3 4"/></svg>';
const IL3='<svg viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M22 36 60 14l38 22"/><path d="M28 33v33l32 10 32-10V33"/><path d="M60 76V44M28 33l32 11 32-11" opacity=".55"/><path d="M38 62V50l10 3v12z" fill="currentColor" fill-opacity=".18"/><path d="M70 54l12-4v8l-12 4z" fill="currentColor" fill-opacity=".35"/><path d="M84 22V12h6v14"/></svg>';
// fachada de la casona: dos pisos, arcos, balcones, pérgola y macetas
function fach(){const w=[];let s='';
 for(let i=0;i<5;i++){const x=46+i*66;s+=`<rect class="w${i===1||i===3?' n':''}" x="${x}" y="40" width="26" height="36" rx="13"/><path d="M${x-4} 80h34M${x-2} 80v8M${x+28} 80v8M${x-2} 88h30" stroke="var(--pt-marco)" stroke-width="2.5" fill="none"/>`}
 for(let i=0;i<5;i++){const x=40+i*66;s+=i===2?`<path d="M${x} 170v-44a19 19 0 0 1 38 0v44z" fill="var(--pt-teja)"/><path d="M${x+19} 170v-62" stroke="var(--pt-muro2)" stroke-width="2"/>`:`<path class="w${i===4?' n':''}" d="M${x} 162v-38a19 19 0 0 1 38 0v38z"/>`}
 return `<svg viewBox="0 0 400 176" aria-hidden="true"><path d="M0 170h400v6H0z" fill="var(--pt-muro2)"/>
 <path d="M84 14h232M96 14v-10M140 14v-10M184 14v-10M228 14v-10M272 14v-10M304 14v-10M90 4h220" stroke="var(--pt-muro2)" stroke-width="3" fill="none"/>
 <rect x="20" y="20" width="360" height="152" fill="var(--pt-muro)"/><rect x="14" y="14" width="372" height="10" rx="3" fill="var(--pt-marco)"/><rect x="20" y="96" width="360" height="6" fill="var(--pt-marco)" opacity=".8"/>
 ${s}<g fill="var(--pt-hoja)"><path d="M4 170c0-14 6-22 14-22s12 8 12 22z"/><path d="M370 170c0-16 6-26 14-26s14 10 14 26z"/></g></svg>`}
const FL=['<svg viewBox="0 0 30 40"><rect x="1" y="1" width="28" height="38" rx="4" fill="#FFF8EE" stroke="#C2512A" stroke-width="2"/><path d="M15 12l6 8-6 8-6-8z" fill="#C2512A"/></svg>',
 '<svg viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="7" fill="#FFF8EE" stroke="#3A2416" stroke-width="2"/><circle cx="10" cy="10" r="2.6" fill="#3A2416"/><circle cx="16" cy="16" r="2.6" fill="#3A2416"/><circle cx="22" cy="22" r="2.6" fill="#3A2416"/></svg>',
 '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#2F7A55"/><circle cx="16" cy="16" r="9" fill="none" stroke="#FFF8EE" stroke-width="2.5" stroke-dasharray="4 3.2"/></svg>',
 '<svg viewBox="0 0 30 40"><rect x="1" y="1" width="28" height="38" rx="4" fill="#8B1A1A" stroke="#FFF8EE" stroke-width="2"/><rect x="6" y="6" width="18" height="28" rx="2" fill="none" stroke="#FFF8EE" stroke-width="1.5" opacity=".6"/></svg>',
 '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#C2512A"/><circle cx="16" cy="16" r="9" fill="none" stroke="#FFF8EE" stroke-width="2.5" stroke-dasharray="4 3.2"/></svg>'];
const FLP=[[8,22,7,-12,10],[86,30,9,8,-14],[18,58,8,20,-6],[74,62,10,-18,6],[48,16,11,6,16]];   // left%, top%, s, giro0, giro1

let el=null,busy=false,pend=false,cal=ls.get('casa_cal3')==='completo'?'completo':'medio';
const ult=()=>(window.CALIDAD||ls.get('casa_cal'))==='ligero'?'ligero':'3d';
const hay3=()=>!/continental\.html$/.test(location.pathname);   // CASA3D se carga después: se revisa al terminar de cargar
async function pinta(box){for(let i=0;i<40&&!(window.AV&&window.AV2D);i++)await new Promise(r=>setTimeout(r,250));if(!window.AV||!window.AV2D)return;
 try{await AV.listo();const cv=await AV2D.retrato(AV.mio(),{tam:120,plano:'busto',giro:.35,fondo:null});if(box.isConnected)box.replaceChildren(cv)}catch(e){}}
function snd(k){if(typeof sfx=='function')try{sfx(k||'tick')}catch(e){}}

function arma(){
 el=document.createElement('div');el.id='port';el.className='ui';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','gamemash');
 const nb=[[14,40,90],[52,26,70],[30,55,110]].map(([t,s,w],i)=>`<i class="pt-nb" style="top:${t}%;width:${w}px;animation-duration:${s}s;animation-delay:-${(i*13+5)}s"></i>`).join('');
 const fl=FLP.map(([l,t,d,a,b],i)=>`<i class="pt-fl k${i}" style="left:${l}%;top:${t}%;--a0:${a}deg;--a1:${b}deg;animation-duration:${d/3}s;animation-delay:-${i*.7}s">${FL[i]}</i>`).join('');
 const nm=String(typeof pname!=='undefined'&&pname||'').trim(),u=ult(),c3=hay3();
 el.innerHTML=`<i class="pt-sol"></i>${nb}${fl}<div class="pt-fach">${fach()}</div>
 <header class="pt-top"><h1 class="pt-logo" aria-label="gamemash">${[...'gamemash'].map((c,i)=>`<span style="animation-delay:${(.05+i*.05).toFixed(2)}s">${c}</span>`).join('')}</h1>
  <div class="pt-yo"><button class="pt-pjb" aria-label="Mi personaje"><i class="pt-pj"></i></button><input class="pt-nm" maxlength="14" autocomplete="nickname" spellcheck="false" aria-label="Tu nombre" value="${es(nm||(window.BIEN&&BIEN.rnd?BIEN.rnd():''))}"><button class="pt-dado" aria-label="Otro nombre al azar">${I('dado')}</button>${ls.get('cont_av_hecho')?'':'<div class="pt-guia" aria-hidden="true"><svg viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 31C10 28 8 18 12 6"/><path d="M5 12l7-7 7 6"/></svg><span>Cambia tu personaje y tu nombre</span></div>'}</div><button class="pt-tema" aria-label="Día o noche">${I(noche()?'sol':'luna')}</button></header>
 <div class="pt-mid"><div class="pt-ops">
  <div class="pt-op" data-q="ligero"><button class="pt-go${u==='ligero'||!c3?' ult':''}"><span class="pt-il">${IL2}</span><b>Plano</b><small>2D</small></button><div class="pt-sp"></div></div>
  ${c3?`<div class="pt-op" data-q="3d"><button class="pt-go${u==='3d'?' ult':''}"><span class="pt-il">${IL3}</span><b>Casa</b><small>3D</small></button>
   <div class="pt-seg" role="radiogroup" aria-label="Calidad"><button data-c="medio" role="radio">Medio</button><button data-c="completo" role="radio">HD</button></div></div>`:''}
  ${c3?'<button class="pt-ayu" aria-expanded="false">¿Cuál elijo?</button>':''}
  </div></div><div class="pt-bar" role="progressbar" aria-label="Cargando"><i></i></div>`;
 document.body.appendChild(el);
 const seg=()=>el.querySelectorAll('.pt-seg button').forEach(b=>{const on=b.dataset.c===cal;b.classList.toggle('on',on);b.setAttribute('aria-checked',on)});seg();
 el.querySelectorAll('.pt-seg button').forEach(b=>b.onclick=()=>{cal=b.dataset.c;snd();seg()});
 el.querySelectorAll('.pt-op').forEach(o=>o.querySelector('.pt-go').onclick=()=>elige(o.dataset.q==='3d'?cal:'ligero'));
 const pj=el.querySelector('.pt-pj');pinta(pj);
 const nmI=el.querySelector('.pt-nm'),ancho=()=>{nmI.style.width=Math.max(4,nmI.value.length+1)+'ch'};ancho();nmI.oninput=()=>{nmI.classList.remove('mal');ancho()};
 el.querySelector('.pt-dado').onclick=()=>{if(window.BIEN&&BIEN.rnd){nmI.value=BIEN.rnd(nmI.value);ancho();snd()}};
 const guia=()=>{const g=el.querySelector('.pt-guia');if(g&&!g.classList.contains('va')){g.classList.add('va');setTimeout(()=>g.remove(),300)}};
 nmI.addEventListener('focus',guia);
 // Mi personaje se abre encima de la portada (no se ve la casa ni el plano debajo)
 el.querySelector('.pt-pjb').onclick=()=>{if(!window.MIPJ||!window.AV)return;guia();snd();MIPJ.abrir();if(!MIPJ.abierto())return;
  const m=document.querySelector('.mj-raiz');if(m){if(getComputedStyle(m).position==='static')m.style.position='relative';m.style.zIndex='1100'}
  const t=setInterval(()=>{if(MIPJ.abierto())return;clearInterval(t);if(el)pinta(pj)},200)};
 // día / noche, con fundido si el navegador lo permite
 const tb=el.querySelector('.pt-tema');tb.onclick=()=>{if(!window.UI||!UI.setTema)return;snd();const f=()=>{UI.setTema(noche()?'dia':'noche');tb.innerHTML=I(noche()?'sol':'luna')};
  document.startViewTransition&&!matchMedia('(prefers-reduced-motion:reduce)').matches?document.startViewTransition(f):f()};
 // ayuda: diferencia entre Plano y Casa
 const ay=el.querySelector('.pt-ayu');if(ay){const ops=el.querySelector('.pt-ops');let p=null;
  const cierra=()=>{if(!p)return;const q=p;p=null;ay.classList.remove('on');ay.setAttribute('aria-expanded','false');q.classList.add('va');setTimeout(()=>q.remove(),250)};
  ay.onclick=e=>{e.stopPropagation();snd();if(p)return cierra();guia();p=document.createElement('div');p.className='pt-ayp';p.setAttribute('role','note');
   p.innerHTML='<div><b>Plano 2D</b><p>Ligero, va en cualquier celular.</p></div><div><b>Casa 3D</b><p>Recorres la casa. Pide más equipo.</p></div><div><b>HD</b><p>Se ve mejor, carga más lento.</p></div>';
   ops.appendChild(p);ay.classList.add('on');ay.setAttribute('aria-expanded','true')};
  el.addEventListener('click',e=>{if(p&&!p.contains(e.target))cierra()})}
 // Enter en el nombre solo lo confirma; no elige Plano ni Casa
 nmI.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const n=nmI.value.trim();if(n){pname=n;ls.set('cont_n',n)}nmI.blur();snd()}});}

// q: 'ligero' | 'medio' | 'completo'
function elige(q){if(busy||!el)return;const nmI=el.querySelector('.pt-nm');
 if(nmI&&!el.classList.contains('bnv')){const n=nmI.value.trim();if(!n){nmI.classList.remove('mal');void nmI.offsetWidth;nmI.classList.add('mal');nmI.focus();return}
  pname=n;ls.set('cont_n',n);ls.set('cont_av_hecho','1')}busy=true;snd('card');const d3=q!=='ligero';
 el.querySelectorAll('.pt-op').forEach(o=>o.classList.toggle('yo',(o.dataset.q==='3d')===d3));el.classList.add('sale',d3?'a3d':'a2d');
 const pon=()=>{if(window.BIEN)BIEN.set(q);const C=window.CASA3D;if(C&&C.on()!==d3)casaToggle()};
 if(!d3){setTimeout(()=>{pon();pend=false;if(window.PLANO2D&&PLANO2D.entra)PLANO2D.entra();if(typeof render=='function')render();el.classList.add('va');setTimeout(quita,650)},380);return}
 setTimeout(()=>{pon();pend=false;if(typeof render=='function')render();espera()},650)}   // deja correr la animación antes de armar la casa (congela un momento)

// carga de la casa: progreso del piso (CAJA) en la barra y en las ventanas; al estar lista, se entra por la puerta
function espera(){const t0=performance.now(),bar=el.querySelector('.pt-bar i'),ws=[...el.querySelectorAll('.pt-fach .w')];let v=0,okT=0;
 const tic=()=>{if(!el)return;const t=performance.now()-t0,H=window.CASA3D,K=window.CAJA;let p=Math.min(.3,t/12000),listo=false;
  if(H&&H.R&&H.R()){p=Math.max(p,.3);
   if(K&&K.on){const id=H.piso&&H.piso(),F=id&&id!=='pb'&&K.piso?K.piso(id):null;if(F&&F.prog)p=Math.max(p,.3+.65*F.prog().p);listo=!!(F&&K.listos[id])&&!document.getElementById('ccarga')}
   else listo=t>1200}
  if(listo){if(!okT)okT=t;p=1}else okT=0;
  v+=(Math.max(v,p)-v)*.3;bar.style.width=(v*100).toFixed(1)+'%';const n=Math.round(v*ws.length);ws.forEach((w,i)=>w.classList.toggle('on',i<n));
  if((okT&&t-okT>900)||t>90000){snd();el.classList.add('va');setTimeout(quita,1100);return}
  setTimeout(tic,120)};tic()}
function quita(){if(el){el.remove();el=null}busy=false}

// desde la bienvenida (primera vez): mismas transiciones sin enseñar las tarjetas
function ve(q){if(!el){arma();el.classList.add('bnv')}pend=true;elige(q)}
function show(){if(el||inGame())return;pend=true;arma()}
// volver a la portada desde la casa o el plano (CHUD "Inicio", logo del plano); la casa sigue armada debajo
function volver(){if(el||inGame())return;busy=false;if(window.CMESA&&CMESA.cerrar)try{CMESA.cerrar()}catch(e){}show();snd()}
window.PTDA={pend:()=>pend,show,ve,volver};
addEventListener('load',()=>{if(el&&!window.CASA3D){const o=el.querySelector('.pt-op[data-q="3d"]');if(o)o.remove();const b=el.querySelector('.pt-go');if(b)b.classList.add('ult')}});
// sale al abrir si no hay partida, ni bienvenida, ni enlace de sala (#CODIGO), ni página de prueba
const salta=inGame()||location.hash.length>1||/prueba/.test(location.pathname)||/[?&](casa|pb|pa|sm|az)=/.test(location.search)||(window.BIEN&&BIEN.pend());
if(!salta)show();
})();
