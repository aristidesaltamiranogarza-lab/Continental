// c_portada.js — PTDA: portada animada al abrir el juego (antes de la casa). Cielo, la fachada de la casona, fichas que flotan y dos
// tarjetas: Plano (2D) o Casa (3D, con Medio/HD). Al elegir Plano la portada se sube como telón y el plano entra girando (PLANO2D.entra);
// al elegir Casa la fachada se vuelve la pantalla de carga (las ventanas se prenden con el progreso del piso) y al estar lista se entra
// por la puerta. Mientras está, c_casa3d.js no arma la casa (home() mira PTDA.pend()). La primera vez sale antes la bienvenida
// (c_bienvenida.js), que al Entrar usa PTDA.ve(q) para las mismas transiciones. Se carga después de c_bienvenida.js y antes de c_casa3d.js.
(function(){
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const inGame=()=>{if(typeof S!=='undefined')return !!S;try{return !!JSON.parse(ls.get('cont_s')||'null')}catch(e){return false}},I=n=>window.UI&&UI.ico?UI.ico(n):'',noche=()=>document.documentElement.dataset.tema==='noche';
const es=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=document.createElement('style');css.textContent=`
#port{--pt-c1:#F7DDB0;--pt-c2:#EFB27C;--pt-muro:#D9A27F;--pt-muro2:#C58C6B;--pt-marco:#FFF4E2;--pt-vid:#5C86A6;--pt-luz:#FFD98A;--pt-teja:#A8532E;--pt-hoja:#5F8A45;--pt-sol:#FFE7A8;--pt-nube:#FFFAF0;--pt-nubea:.75;--pt-can:#EEE0C8;--pt-lam:#5C8771;--pt-per:#6F9D86;--pt-fe:#2B211C;--pt-por:#7E4F33;--pt-mad:#8A6244;--pt-tin:#3A3D42;--pt-v1:#E3C47C;--pt-v2:#A7C2BE;--pt-ban:#D6C4AB;--pt-calle:#A99A8B;--pt-bug:#C9417C;--pt-sil:#4A2A1A;--pt-farol:#F6EAD0;--pt-lin:#7A3E1E;--pt-cua:rgba(122,62,30,.11);
 position:fixed;inset:0;z-index:1001;overflow:hidden;color:var(--ui-text);font-family:var(--ui-font);background:linear-gradient(180deg,var(--pt-c1),var(--pt-c2));
 display:grid;grid-template-rows:auto 1fr;grid-template-columns:minmax(0,1fr);touch-action:manipulation;user-select:none;-webkit-user-select:none;transition:transform .6s cubic-bezier(.6,0,.3,1),opacity .5s}
html[data-tema=noche] #port{--pt-c1:#1C1430;--pt-c2:#47284A;--pt-muro:#6C4636;--pt-muro2:#583628;--pt-marco:#E9D6BE;--pt-vid:#2B2F4A;--pt-teja:#6A2E1A;--pt-hoja:#2F4A2A;--pt-sol:#F2E6C8;--pt-nube:#FFF0E6;--pt-nubea:.12;--pt-can:#A8957E;--pt-lam:#2C4639;--pt-per:#33503F;--pt-fe:#140E0B;--pt-por:#4E2C1C;--pt-mad:#4A3324;--pt-tin:#17181C;--pt-v1:#5E5038;--pt-v2:#3D4A52;--pt-ban:#3E3240;--pt-calle:#2C2434;--pt-bug:#8A2D5C;--pt-sil:#2A160C;--pt-farol:var(--pt-luz);--pt-lin:#F4DEC6;--pt-cua:rgba(244,222,198,.07)}
#port button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
#port .pt-sol{position:absolute;right:12%;top:9%;width:min(18vmin,110px);aspect-ratio:1;border-radius:50%;background:var(--pt-sol);box-shadow:0 0 60px 10px color-mix(in srgb,var(--pt-sol) 45%,transparent);animation:ptSol .9s .1s cubic-bezier(.3,1.4,.5,1) both}
html[data-tema=noche] #port .pt-sol{box-shadow:inset -14px -6px 0 0 color-mix(in srgb,var(--pt-c2) 70%,var(--pt-sol)),0 0 40px 4px rgba(242,230,200,.18)}
#port .pt-nb{position:absolute;height:22px;border-radius:999px;background:var(--pt-nube);opacity:var(--pt-nubea);animation:ptNube linear infinite}
#port .pt-nb::before{content:'';position:absolute;left:22%;bottom:40%;width:45%;height:150%;border-radius:50%;background:inherit}
#port .pt-fl{position:absolute;width:34px;opacity:.85;animation:ptFlota ease-in-out infinite alternate;filter:drop-shadow(0 4px 6px rgba(58,36,22,.2))}
#port .pt-fl svg{display:block;width:100%;height:auto}
#port .pt-fach{position:absolute;left:50%;bottom:-2px;width:min(142vw,192vh,1080px);translate:-50% 0;transform-origin:50% 64%;animation:ptSube .9s .15s cubic-bezier(.25,1.25,.4,1) both;transition:transform .9s cubic-bezier(.5,0,.2,1),bottom .9s cubic-bezier(.5,0,.2,1),opacity .6s}
#port .pt-fach svg{display:block;width:100%;height:auto}
#port .pt-fach .w{fill:var(--pt-vid);transition:fill .5s}#port .pt-fach .w:is(.on,.n){fill:var(--pt-luz)}html[data-tema=noche] #port .pt-fach .w.nn{fill:var(--pt-luz)}
#port .pt-fach .sil{fill:var(--pt-sil);opacity:0;transition:opacity .6s}#port .pt-fach .sil .ct{fill:#FFF8EE;stroke:var(--pt-sil);stroke-width:.5}
#port .pt-fach .w:is(.on,.n)~.sil,html[data-tema=noche] #port .pt-fach .w.nn~.sil{opacity:.85}
#port .pt-fach .w:is(.on,.n)~.sil .pp,html[data-tema=noche] #port .pt-fach .w.nn~.sil .pp{animation:ptRes 3.4s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
@keyframes ptRes{0%,60%,100%{transform:none}75%{transform:translateY(-.8px) rotate(-3deg)}}
#port .pt-fach .dl{animation:ptRespira 2.8s ease-in-out infinite}@keyframes ptRespira{50%{opacity:.72}}
#port .pt-fach .hj{transform-box:fill-box;transition:transform .7s cubic-bezier(.5,0,.2,1)}#port .pt-fach .hj1{transform-origin:0 50%}#port .pt-fach .hj2{transform-origin:100% 50%}
#port.m3d:has(.pt-in:hover) .pt-fach .hj{transform:scaleX(.72)}#port.a3d .pt-fach .hj{transform:scaleX(.2);transition-delay:.25s}
#port .pt-fach .fg{fill:var(--pt-luz);opacity:0;transition:opacity .6s}html[data-tema=noche] #port .pt-fach .fg{opacity:.22}#port .pt-fach .fp{fill:var(--pt-farol)}
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
#port .pt-sp{height:42px}
#port .pt-ent{display:flex;flex-direction:column;align-items:center;gap:12px;--r:0deg;animation:ptCarta .7s .45s cubic-bezier(.3,1.4,.5,1) both}
#port .pt-in{position:relative;overflow:hidden;display:flex;align-items:center;gap:10px;min-height:66px;padding:0 32px 0 40px;border:0;border-radius:999px;background:var(--ui-accent);color:var(--ui-on);font:900 1.7em/1 var(--ui-font);box-shadow:var(--ui-shadow),inset 0 -4px 0 rgba(0,0,0,.16);transition:transform .25s cubic-bezier(.3,1.5,.5,1)}
#port .pt-in svg{width:26px;height:26px}
#port .pt-in::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,transparent 35%,rgba(255,255,255,.32) 50%,transparent 65%);transform:translateX(-120%);animation:ptBrillo 5s 2.2s ease-in-out infinite;pointer-events:none}
@keyframes ptBrillo{0%,72%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
@media (hover:hover){#port .pt-in:hover{transform:translateY(-4px) scale(1.03)}}
#port .pt-in:active{transform:scale(.95);transition-duration:.08s}html.teclado #port .pt-in:focus-visible{outline:3px solid var(--ui-text);outline-offset:3px}
#port .pt-modo{display:flex;padding:3px;border-radius:999px;background:var(--ui-panel);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow);animation:ptPop .5s .75s cubic-bezier(.3,1.5,.5,1) both}
#port .pt-modo button{min-height:40px;min-width:60px;padding:0 16px;border:0;border-radius:999px;background:transparent;font-weight:800;font-size:.92em;color:var(--ui-sub);transition:background .2s,color .2s,box-shadow .2s,transform .15s}
#port .pt-modo button.on{background:var(--ui-chip);color:var(--ui-text);box-shadow:inset 0 0 0 1.5px var(--ui-accent)}#port .pt-modo button:active{transform:scale(.92)}
#port.sale .pt-in{animation:ptLatido .4s ease-out}
#port .pt-rec{position:absolute;top:-10px;left:50%;translate:-50% 0;padding:3px 10px;border-radius:999px;background:var(--ui-accent);color:var(--ui-on);font:800 12px/1.2 var(--ui-font);white-space:nowrap}
#port .pt-bar{position:absolute;left:50%;bottom:9vh;translate:-50% 0;width:min(220px,60vw);height:8px;border-radius:999px;background:var(--ui-panel);box-shadow:var(--ui-shadow);overflow:hidden;opacity:0;transition:opacity .3s}
#port .pt-bar i{display:block;height:100%;width:0;border-radius:999px;background:var(--ui-accent);transition:width .3s linear}
/* elegir */
#port.bnv .pt-ops,#port.bnv .pt-top{visibility:hidden}
#port.sale .pt-op:not(.yo){animation:ptFuera .35s ease-in both}
#port.sale .pt-op.yo .pt-go{animation:ptLatido .4s ease-out}
#port.a3d .pt-top,#port.a3d .pt-ops{transition:opacity .35s .15s,transform .45s .15s}#port.a3d .pt-top{opacity:0;transform:translateY(-30px)}#port.a3d .pt-ops{opacity:0;transform:translateY(30px) scale(.9)}
#port.a3d .pt-fach{bottom:22vh;transform:scale(1.08);transform-origin:51% 79%}
#port.a3d .pt-bar{opacity:1;transition-delay:.5s}
#port.a3d .pt-fl{animation-duration:2.4s!important}
#port.a3d.va{opacity:0;transition:opacity .45s .4s}#port.a3d.va .pt-bar{opacity:0;transition:opacity .2s}#port.a3d.va .pt-fach{transform:scale(9);transition:transform 1s cubic-bezier(.6,0,.4,1)}
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
@media (orientation:portrait){#port .pt-fl.k3{top:47%!important}#port .pt-fach{width:min(175vw,92vh,1080px)}#port .pt-mid{padding-bottom:36vh}}
@media (orientation:landscape) and (max-height:500px){#port .pt-mid{padding:4px max(16px,3vw) 10px 50vw;justify-content:center}#port .pt-ops{flex-direction:column;width:min(290px,44vw);max-width:none;gap:10px}
 #port .pt-op{position:relative;max-width:none}#port .pt-sp{display:none}
 #port .pt-go{display:grid;grid-template-columns:auto 1fr;justify-items:start;align-items:center;column-gap:12px;row-gap:0;width:100%;padding:8px 12px 8px 10px}
 #port .pt-il{grid-row:1/3;width:min(76px,20vh)}#port .pt-go b{align-self:end}#port .pt-go small{align-self:start}
 #port .pt-fach{width:min(58vw,144vh,912px);left:26%}#port.a3d .pt-fach{left:50%;bottom:10vh}
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
#port .pt-ops{flex-wrap:wrap}
@media (orientation:landscape) and (max-height:500px){#port .pt-guia{font-size:13px;max-width:none;white-space:nowrap;top:50%;left:auto;right:calc(100% + 6px);translate:0 -50%;flex-direction:row-reverse;align-items:center;transform-origin:100% 50%}#port .pt-guia svg{width:26px;height:26px;rotate:90deg}}
@media (max-width:420px){#port .pt-top{gap:8px}#port .pt-logo{font-size:24px}#port .pt-yo{gap:6px;padding:3px}#port .pt-pj{width:36px;height:36px}#port .pt-dado{width:34px;height:34px}#port .pt-tema{width:42px;height:42px}#port .pt-yo{min-height:44px}}
/* modo: Casa 3D = fachada a color (.pt-col); Plano 2D = alzado de arquitecto (.pt-ln) que se traza solo sobre cuadrícula */
#port .pt-fz{position:relative;transform-origin:50% 100%}#port .pt-fz.boing{animation:ptBoing .6s cubic-bezier(.3,1.3,.5,1)}
@keyframes ptBoing{22%{transform:scale(1.025,.95)}48%{transform:scale(.985,1.035)}72%{transform:scale(1.006,.99)}}
#port .pt-col{clip-path:inset(0 0 0 0);transition:clip-path .75s cubic-bezier(.6,0,.3,1)}#port.m2d .pt-col{clip-path:inset(100% 0 0 0);transition-duration:.65s;transition-delay:.25s}
#port .pt-ln{position:absolute;inset:0;opacity:0;transition:opacity .4s;pointer-events:none}#port.traza .pt-ln{opacity:1;transition:none}
#port .pt-ln *{fill:none!important;stroke:var(--pt-lin)!important;stroke-width:var(--w,1.1)!important;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:var(--l,0);stroke-dashoffset:var(--l,0);transition:stroke-dashoffset 0s .45s}
#port.traza .pt-ln *{stroke-dashoffset:0;transition:stroke-dashoffset var(--t,.5s) calc(var(--d,0s) + var(--d0,0s)) cubic-bezier(.45,0,.2,1)}
#port .pt-ln :is([fill="var(--pt-muro)"],[fill="var(--pt-v1)"],[fill="var(--pt-v2)"]){fill:var(--pt-lin)!important;fill-opacity:0;transition:fill-opacity .3s,stroke-dashoffset 0s .45s}
#port.traza .pt-ln :is([fill="var(--pt-muro)"],[fill="var(--pt-v1)"],[fill="var(--pt-v2)"]){fill-opacity:.06;transition:fill-opacity .8s calc(.9s + var(--d0,0s)),stroke-dashoffset var(--t,.5s) calc(var(--d,0s) + var(--d0,0s)) cubic-bezier(.45,0,.2,1)}
#port .pt-ln :is(.sil,.fg,.dl,.fol){display:none}#port .pt-ln g,#port .pt-ln svg{stroke:none!important}
#port .pt-cuad{position:absolute;left:-6%;right:-6%;top:-45%;bottom:0;pointer-events:none;opacity:0;transition:opacity .5s;background-image:linear-gradient(var(--pt-cua) 1px,transparent 1px),linear-gradient(90deg,var(--pt-cua) 1px,transparent 1px);background-size:22px 22px;background-position:center bottom;
 -webkit-mask-image:radial-gradient(ellipse 55% 60% at 50% 70%,#000 35%,transparent 78%);mask-image:radial-gradient(ellipse 55% 60% at 50% 70%,#000 35%,transparent 78%)}
#port.m2d .pt-cuad{opacity:1;transition-delay:.15s}
#port.enc .pt-col :is(.w,.sil){transition-delay:var(--wd,0s)}#port.m2d .pt-col .w{fill:var(--pt-vid)!important}#port.m2d .pt-col .sil{opacity:0!important}
#port .pt-modo{position:relative}#port .pt-modo button{position:relative;z-index:1}#port .pt-modo button.on{background:transparent;box-shadow:none}
#port .pt-mi{position:absolute;top:3px;bottom:3px;left:0;width:0;border-radius:999px;background:var(--ui-chip);box-shadow:inset 0 0 0 1.5px var(--ui-accent)}#port .pt-mi.ok{transition:left .5s cubic-bezier(.3,1.45,.5,1),width .35s cubic-bezier(.3,1.3,.5,1)}
/* entrar al plano: la fachada se acuesta (rebota al tocar el suelo) y queda el plano 2D, que es la casa vista desde arriba */
#port.a2d .pt-top,#port.a2d .pt-ops{transition:opacity .3s .1s,transform .4s .1s}#port.a2d .pt-top{opacity:0;transform:translateY(-30px)}#port.a2d .pt-ops{opacity:0;transform:translateY(30px) scale(.9)}
#port.a2d .pt-fach{perspective:1100px;perspective-origin:50% -40%}#port.a2d .pt-fz{animation:ptCae 1s .2s cubic-bezier(.55,0,.75,.35) both}
@keyframes ptCae{62%{transform:translateY(-12vh) rotateX(80deg)}76%{transform:translateY(-14vh) rotateX(68deg)}88%{transform:translateY(-15vh) rotateX(79deg)}100%{transform:translateY(-17vh) rotateX(82deg) scale(1.08);opacity:0}}
#port.a2d.va{opacity:0;transition:opacity .5s .2s}
@media (prefers-reduced-motion:reduce){#port .pt-ln *{transition:none!important}#port .pt-col{transition:none}}
@media (prefers-reduced-motion:reduce){#port *,#port{animation-duration:.01s!important;animation-iteration-count:1!important}}`;
document.head.appendChild(css);

// dibujos (trazo de UI.ico): plano con mesa y sillas; casita en 3D
const IL2='<svg viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><rect x="8" y="6" width="104" height="68" rx="4"/><path d="M8 40h34M64 6v24M64 46v28M42 40v34M86 40h26"/><circle cx="88" cy="22" r="8" fill="currentColor" fill-opacity=".18"/><circle cx="88" cy="9.5" r="2.2"/><circle cx="100.5" cy="22" r="2.2"/><circle cx="88" cy="34.5" r="2.2"/><circle cx="75.5" cy="22" r="2.2"/><rect x="16" y="50" width="16" height="16" rx="3" fill="currentColor" fill-opacity=".18"/><path d="M20 14h28v16H20z" stroke-dasharray="3 4"/></svg>';
const IL3='<svg viewBox="0 0 120 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M22 36 60 14l38 22"/><path d="M28 33v33l32 10 32-10V33"/><path d="M60 76V44M28 33l32 11 32-11" opacity=".55"/><path d="M38 62V50l10 3v12z" fill="currentColor" fill-opacity=".18"/><path d="M70 54l12-4v8l-12 4z" fill="currentColor" fill-opacity=".35"/><path d="M84 22V12h6v14"/></svg>';
// fachada de la casona, calcada del anteproyecto (36 m de frente a 10 px/m, x 60..420): zaguán al centro, ventanales con
// reja abajo, balcones con persianas arriba, pérgola y tinacos en la azotea, vecinas a los lados. Ventanas .w: se prenden
// al cargar (.on); .n siempre con luz, .nn solo de noche; detrás de cada una, gente jugando (.sil, en caja de 30x32).
const SC=[
 '<g class="pp"><circle cx="9" cy="15" r="3.6"/><path d="M3 32v-7a6 6 0 0 1 12 0v7z"/></g><g class="pp" style="animation-delay:-1.3s"><circle cx="21.5" cy="14" r="3.6"/><path d="M15.5 32v-8a6 6 0 0 1 12 0v8z"/></g><rect x="1" y="28" width="28" height="2.2" rx="1"/><g class="ct"><rect x="12.4" y="18" width="3.2" height="4.4" rx=".6" transform="rotate(-22 14 23)"/><rect x="12.4" y="18" width="3.2" height="4.4" rx=".6"/><rect x="12.4" y="18" width="3.2" height="4.4" rx=".6" transform="rotate(22 14 23)"/></g>',
 '<rect x="14.6" y="0" width=".8" height="7"/><path d="M9 11l2.5-4h7l2.5 4z"/><rect x="2" y="25" width="26" height="3" rx="1"/><rect x="4" y="27" width="2" height="5"/><rect x="24" y="27" width="2" height="5"/><g class="pp"><circle cx="21" cy="16.5" r="3.4"/><path d="M14 25c0-4 3-6.5 7-6.5s6.5 2.5 7 6.5z"/><rect x="4" y="21.4" width="15" height="1" rx=".5" transform="rotate(-9 12 22)"/></g>',
 '<g class="pp"><circle cx="10" cy="15" r="3.6"/><path d="M4 32v-7a6 6 0 0 1 12 0v7z"/><path d="M13.5 21.5l4-9.5 2.2 1-4 9.5z"/><path d="M16.4 7.5h5.6l-.8 5.2h-4z"/></g><g class="pp" style="animation-delay:-.8s"><circle cx="23" cy="17" r="3.4"/><path d="M17.5 32v-6a5.5 5.5 0 0 1 11 0v6z"/></g><rect x="1" y="28" width="28" height="2.2" rx="1"/>',
 '<g class="pp"><circle cx="7" cy="17" r="3.4"/><path d="M1 32v-6a6 6 0 0 1 12 0v6z"/></g><g class="pp" style="animation-delay:-2s"><circle cx="23" cy="17" r="3.4"/><path d="M17 32v-6a6 6 0 0 1 12 0v6z"/></g><path d="M8 25.5h14l2.4 3.5H5.6z"/><g class="ct"><circle cx="12" cy="27.3" r=".9"/><circle cx="17.5" cy="27" r=".9"/><circle cx="15" cy="28.2" r=".9"/></g>'];
const r1=v=>Math.round(v*10)/10,C='var(--pt-can)',F='var(--pt-fe)';
const per=(x,y,w,h)=>{let l='';for(let v=y+3;v<y+h-1;v+=2.6)l+=`M${r1(x+1)} ${r1(v)}h${w-2}`;return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx=".8" fill="var(--pt-per)"/><path d="${l}" stroke="${F}" stroke-opacity=".25" stroke-width=".7"/>`};
// ventana (pa: puerta de balcón con persianas; si no, ventanal con reja y repisa)
function vent(x,y,w,h,sc,cl,pa){const s=Math.min(w/30,h/32);let o=pa?per(x-9,y,7,h)+per(x+w+2,y,7,h):'';
 o+=`<path d="M${x-6} ${y-2}h${w+12}l-2-${pa?5:4}h-${w+8}z" fill="${C}"/><rect x="${x-2}" y="${y-2}" width="${w+4}" height="${h+2}" fill="${C}"/>`;
 o+=`<g style="--wd:${(.55+x/480*.6).toFixed(2)}s"><rect class="w ${cl}" x="${x}" y="${y}" width="${w}" height="${h}"/><g class="sil" transform="translate(${r1(x+(w-30*s)/2)} ${r1(y+h-32*s)}) scale(${s.toFixed(3)})">${SC[sc]}</g></g>`;
 o+=`<path d="M${r1(x+w/2)} ${y}v${h}M${x} ${r1(y+h*.3)}h${w}" stroke="${C}" stroke-width="1.2"/>`;
 if(!pa){let b='',q='';for(let v=x+3.5;v<x+w-1;v+=4.5){b+=`M${r1(v)} ${y}v${h}`;if(v<x+w-5)q+=`M${r1(v)} ${y+6}q2.25-3.4 4.5 0`}
  o+=`<path d="${b}M${x-1} ${y+1.5}h${w+2}M${x-1} ${y+h-1.5}h${w+2}${q}" stroke="${F}" stroke-width=".9" fill="none"/><rect x="${x-4}" y="${y+h}" width="${w+8}" height="2.5" fill="${C}"/>`}
 return o}
function balc(x0,x1){const y=104,n=Math.max(2,Math.round((x1-x0)/22));let o=`<rect x="${x0-3}" y="${y}" width="${x1-x0+6}" height="4" fill="${C}"/>`,b='';
 for(let i=0;i<n;i++){const c=r1(x0+6+i*(x1-x0-12)/(n-1));o+=`<path d="M${c-2.5} ${y+4}h5l-1.4 5h-2.2z" fill="${C}"/>`}
 for(let v=x0+2;v<x1-1;v+=3.4)b+=`M${r1(v)} ${y-11}v11`;
 return o+`<path d="${b}" stroke="${F}" stroke-width=".8"/><rect x="${x0}" y="${y-12.5}" width="${x1-x0}" height="1.8" rx=".9" fill="${F}"/><rect x="${x0}" y="${y-2}" width="${x1-x0}" height="1.2" fill="${F}"/>`}
const farol=(cx,y)=>`<circle class="fg" cx="${cx}" cy="${y+6}" r="15"/><rect x="${cx-.8}" y="${y-5}" width="1.6" height="5" fill="${F}"/><path d="M${cx-5} ${y+1}h10l-2-3h-6z" fill="${F}"/><path class="fp" d="M${cx-4} ${y+1}h8l-1.2 10h-5.6z" stroke="${F}" stroke-width="1"/><path d="M${cx-3} ${y+11}h6l-3 3z" fill="${F}"/>`;
const bola=(l,c)=>l.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
function fach(){
 const tab=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1"/>`;
 const hoja=(x,k)=>`<g class="hj ${k}"><rect x="${x}" y="118" width="11.5" height="46" fill="var(--pt-por)"/>${tab(x+1.8,126,7.9,9)+tab(x+1.8,138,7.9,10)+tab(x+1.8,151,7.9,10)}<circle cx="${k==='hj1'?x+9.5:x+2}" cy="145" r="1.1" fill="${F}"/></g>`;
 const V=[[80,120,35,35,0,'n',0],[105,74,25,32,3,'n',1],[150,120,35,35,2,'',0],[150,74,25,32,1,'',1],[233,74,24,32,2,'',1],[305,120,35,35,0,'n',0],[315,74,25,32,3,'nn',1],[355,74,25,32,0,'',1],[375,120,35,35,1,'nn',0]];
 return `<svg viewBox="0 0 480 180" aria-hidden="true">
 <g fill="var(--pt-v1)"><rect x="0" y="92" width="58" height="72"/></g><rect x="-2" y="89" width="60" height="4" fill="${C}" opacity=".8"/><rect x="0" y="155" width="58" height="9" fill="#000" opacity=".12"/>
 <path d="M12 164v-30a8 8 0 0 1 16 0v30z" fill="var(--pt-por)" opacity=".85"/><rect x="36" y="114" width="14" height="24" fill="var(--pt-vid)"/><path d="M39.5 114v24M43 114v24M46.5 114v24" stroke="${F}" stroke-width=".8"/>
 <rect x="422" y="98" width="58" height="66" fill="var(--pt-v2)"/><rect x="421" y="95" width="61" height="4" fill="${C}" opacity=".8"/><rect x="422" y="155" width="58" height="9" fill="#000" opacity=".12"/>
 <rect x="432" y="116" width="15" height="24" fill="var(--pt-vid)"/><rect x="462" y="116" width="15" height="24" fill="var(--pt-vid)"/><path d="M436 116v24M439.5 116v24M443 116v24M466 116v24M469.5 116v24M473 116v24" stroke="${F}" stroke-width=".8"/>
 <g fill="var(--pt-mad)"><rect x="64" y="36" width="3" height="16"/><rect x="211" y="36" width="3" height="16"/><rect x="60" y="33" width="158" height="4" rx="1"/></g>
 <path d="${Array.from({length:14},(_,i)=>`M${66+i*11} 33v4`).join('')}" stroke="#000" stroke-opacity=".2" stroke-width="1.6"/>
 <g fill="var(--pt-tin)"><rect x="362" y="35" width="21" height="16" rx="2.5"/><rect x="388" y="35" width="21" height="16" rx="2.5"/><ellipse cx="372.5" cy="35" rx="9" ry="2.6"/><ellipse cx="398.5" cy="35" rx="9" ry="2.6"/></g>
 <path d="M362 41h21M362 46h21M388 41h21M388 46h21" stroke="#fff" stroke-opacity=".12" stroke-width="1"/>
 <rect x="60" y="51" width="360" height="113" fill="var(--pt-muro)"/><rect x="60" y="50" width="360" height="11" fill="var(--pt-muro2)"/>
 <rect x="58" y="48" width="364" height="3" rx="1" fill="${C}"/><rect x="57" y="60" width="366" height="5" fill="${C}"/><rect x="57" y="64" width="366" height="1.4" fill="#000" opacity=".12"/>
 <rect x="58" y="105" width="364" height="4" fill="${C}"/><rect x="60" y="155" width="360" height="9" fill="var(--pt-lam)"/>
 ${[60,217.5,267.5,415].map(x=>`<rect x="${x}" y="65" width="5" height="99" fill="${C}"/><rect x="${x-1}" y="152" width="7" height="12" fill="${C}"/>`).join('')}
 ${V.map(v=>vent(...v)).join('')}
 ${balc(90,190)+balc(228,262)+balc(300,390)}
 <path d="M227 164V132a18 18 0 0 1 36 0v32z" fill="${C}"/><path d="M242 113h6l-1 7h-4z" fill="${C}" stroke="var(--pt-muro2)" stroke-width=".6"/>
 <clipPath id="ptArco"><path d="M231 164V132a14 14 0 0 1 28 0v32z"/></clipPath>
 <g clip-path="url(#ptArco)"><rect class="dl" x="231" y="118" width="28" height="46" fill="var(--pt-luz)"/>${hoja(231,'hj1')+hoja(247.5,'hj2')}</g>
 ${farol(220,120)+farol(270,120)}
 <g class="fol" fill="var(--pt-hoja)">${bola([[72,34,4],[92,33,5],[118,35,4],[146,33,5],[171,34,4],[198,33,4.5],[206,38,3],[80,38,2.5],[160,38,3]])}</g>
 <g class="fol" fill="var(--pt-bug)">${bola([[88,31,2],[96,35,1.8],[150,30,2],[176,37,1.8],[201,30,2],[110,32,1.6]])}</g>
 <g class="fol" fill="var(--pt-hoja)">${bola([[48,92,5],[55,95,6],[61,103,5],[52,100,4],[58,111,4]])}</g>
 <g class="fol" fill="var(--pt-bug)">${bola([[45,90,3],[51,94,3.5],[57,91,3],[60,99,3],[54,104,3],[62,108,2.5],[58,115,2.5],[49,98,2.5]])}</g>
 <rect x="0" y="164" width="480" height="8" fill="var(--pt-ban)"/><rect x="0" y="171" width="480" height="2" fill="#000" opacity=".15"/><rect x="0" y="173" width="480" height="7" fill="var(--pt-calle)"/>
 <path class="dl" d="M242.5 164h5l11 7.5h-27z" fill="var(--pt-luz)" fill-opacity=".45"/>
 <g fill="var(--pt-teja)"><path d="M203 155h10l-1.6 9h-6.8z"/><path d="M277 155h10l-1.6 9h-6.8z"/></g>
 <g fill="var(--pt-hoja)"><path d="M204 156c-3-9 2-13 4-13s7 4 4 13z"/><path d="M278 156c-3-9 2-13 4-13s7 4 4 13z"/></g>
 <ellipse class="fg" cx="438" cy="168" rx="22" ry="3"/><rect x="451" y="72" width="2.4" height="100" fill="${F}"/><path d="M452 74q0-7-9-7h-5" stroke="${F}" stroke-width="2" fill="none"/>${farol(438,68)}
 </svg>`}
const FL=['<svg viewBox="0 0 30 40"><rect x="1" y="1" width="28" height="38" rx="4" fill="#FFF8EE" stroke="#C2512A" stroke-width="2"/><path d="M15 12l6 8-6 8-6-8z" fill="#C2512A"/></svg>',
 '<svg viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="7" fill="#FFF8EE" stroke="#3A2416" stroke-width="2"/><circle cx="10" cy="10" r="2.6" fill="#3A2416"/><circle cx="16" cy="16" r="2.6" fill="#3A2416"/><circle cx="22" cy="22" r="2.6" fill="#3A2416"/></svg>',
 '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#2F7A55"/><circle cx="16" cy="16" r="9" fill="none" stroke="#FFF8EE" stroke-width="2.5" stroke-dasharray="4 3.2"/></svg>',
 '<svg viewBox="0 0 30 40"><rect x="1" y="1" width="28" height="38" rx="4" fill="#8B1A1A" stroke="#FFF8EE" stroke-width="2"/><rect x="6" y="6" width="18" height="28" rx="2" fill="none" stroke="#FFF8EE" stroke-width="1.5" opacity=".6"/></svg>',
 '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#C2512A"/><circle cx="16" cy="16" r="9" fill="none" stroke="#FFF8EE" stroke-width="2.5" stroke-dasharray="4 3.2"/></svg>'];
const FLP=[[8,22,7,-12,10],[86,30,9,8,-14],[18,58,8,20,-6],[74,62,10,-18,6],[48,16,11,6,16]];   // left%, top%, s, giro0, giro1

let el=null,busy=false,pend=false,cal=(c=>c==='medio'||c==='completo'?c:matchMedia('(pointer:coarse)').matches?'medio':'completo')(ls.get('casa_cal3')),modo='3d';
const ult=()=>(window.CALIDAD||ls.get('casa_cal'))==='ligero'?'ligero':'3d';
const hay3=()=>!/continental\.html$/.test(location.pathname);   // CASA3D se carga después: se revisa al terminar de cargar
async function pinta(box){for(let i=0;i<40&&!(window.AV&&window.AV2D);i++)await new Promise(r=>setTimeout(r,250));if(!window.AV||!window.AV2D)return;
 try{await AV.listo();const cv=await AV2D.retrato(AV.mio(),{tam:120,plano:'busto',giro:.35,fondo:null});if(box.isConnected)box.replaceChildren(cv)}catch(e){}}
function snd(k){if(typeof sfx=='function')try{sfx(k||'tick')}catch(e){}}

function arma(){
 el=document.createElement('div');el.id='port';el.className='ui';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','gamemash');
 const nb=[[14,40,90],[52,26,70],[30,55,110]].map(([t,s,w],i)=>`<i class="pt-nb" style="top:${t}%;width:${w}px;animation-duration:${s}s;animation-delay:-${(i*13+5)}s"></i>`).join('');
 const fl=FLP.map(([l,t,d,a,b],i)=>`<i class="pt-fl k${i}" style="left:${l}%;top:${t}%;--a0:${a}deg;--a1:${b}deg;animation-duration:${d/3}s;animation-delay:-${i*.7}s">${FL[i]}</i>`).join('');
 const nm=String(typeof pname!=='undefined'&&pname||ls.get('cont_n')||'').trim(),u=ult(),c3=hay3(),pri=!ls.get('casa_cal');modo=u==='ligero'||!c3?'ligero':'3d';
 const debil=matchMedia('(pointer:coarse)').matches&&((navigator.deviceMemory||8)<=4||(navigator.hardwareConcurrency||8)<=4),rec=t=>(debil?'ligero':'3d')===t&&c3?'<i class="pt-rec">Recomendado</i>':'';
 const F=fach();el.innerHTML=`<i class="pt-sol"></i>${nb}${fl}<div class="pt-fach"><div class="pt-fz"><i class="pt-cuad"></i><div class="pt-col">${F}</div><div class="pt-ln">${F.replace(/ptArco/g,'ptArcoL')}</div></div></div>
 <header class="pt-top"><h1 class="pt-logo" aria-label="gamemash">${[...'gamemash'].map((c,i)=>`<span style="animation-delay:${(.05+i*.05).toFixed(2)}s">${c}</span>`).join('')}</h1>
  <div class="pt-yo"><button class="pt-pjb" aria-label="Mi personaje"><i class="pt-pj"></i></button><input class="pt-nm" maxlength="14" autocomplete="nickname" spellcheck="false" aria-label="Tu nombre" value="${es(nm||(window.BIEN&&BIEN.rnd?BIEN.rnd():''))}"><button class="pt-dado" aria-label="Otro nombre al azar">${I('dado')}</button>${ls.get('cont_av_hecho')?'':'<div class="pt-guia" aria-hidden="true"><svg viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 31C10 28 8 18 12 6"/><path d="M5 12l7-7 7 6"/></svg><span>Cambia tu personaje y tu nombre</span></div>'}</div><button class="pt-tema" aria-label="Día o noche">${I(noche()?'sol':'luna')}</button></header>
 <div class="pt-mid"><div class="pt-ops">${pri?`
  <div class="pt-op" data-q="ligero"><button class="pt-go">${rec('ligero')}<span class="pt-il">${IL2}</span><b>Plano</b><small>2D, ligero</small></button></div>
  ${c3?`<div class="pt-op" data-q="3d"><button class="pt-go">${rec('3d')}<span class="pt-il">${IL3}</span><b>Casa</b><small>3D</small></button></div>`:''}`
 :`<div class="pt-ent"><button class="pt-in"><span>Entrar</span>${I('jugar')}</button>
  ${c3?'<div class="pt-modo" role="radiogroup" aria-label="Modo"><i class="pt-mi"></i><button data-m="ligero" role="radio">2D</button><button data-m="3d" role="radio">3D</button></div>':''}</div>`}</div></div><div class="pt-bar" role="progressbar" aria-label="Cargando"><i></i></div>`;
 document.body.appendChild(el);
 // alzado: largo de cada trazo y su turno (de abajo hacia arriba, de izquierda a derecha; los detalles chicos al final)
 const ln=el.querySelector('.pt-ln svg');let listo=false;
 const prepara=()=>{if(listo||!ln)return;listo=true;for(const g of ln.querySelectorAll('rect,circle,ellipse,path')){if(g.closest('.sil'))continue;
  let L=0,b=null;try{L=g.getTotalLength();b=g.getBBox()}catch(e){continue}if(!L||!b)continue;const chico=b.width*b.height<45&&L<45;
  g.style.cssText+=`;--l:${L.toFixed(1)};--d:${(.02+(1-(b.y+b.height)/180)*.6+(b.x+b.width/2)/480*.3+(chico?.28:0)).toFixed(2)}s;--t:${Math.min(.75,.28+L/700).toFixed(2)}s;--w:${L>500?1.6:chico?.75:1.1}`}};
 const mi=el.querySelector('.pt-mi'),fz=el.querySelector('.pt-fz');let t2=0;
 const pm=(anim)=>{const d2=modo!=='3d';el.classList.toggle('m3d',!d2);el.classList.toggle('m2d',d2);
  el.querySelectorAll('.pt-modo button').forEach(b=>{const on=b.dataset.m===modo;b.classList.toggle('on',on);b.setAttribute('aria-checked',on);
   if(on&&mi){mi.style.left=b.offsetLeft+'px';mi.style.width=b.offsetWidth+'px'}});
  if(mi&&!anim)requestAnimationFrame(()=>mi.classList.add('ok'));
  clearTimeout(t2);if(d2){prepara();requestAnimationFrame(()=>requestAnimationFrame(()=>{if(el&&modo!=='3d')el.classList.add('traza')}))}
  else{el.classList.remove('traza');if(anim){el.classList.add('enc');t2=setTimeout(()=>el&&el.classList.remove('enc'),1500)}}
  if(anim&&fz){fz.classList.remove('boing');void fz.offsetWidth;fz.classList.add('boing')}};
 // la primera vez que se dibuja espera a que la fachada termine de subir
 el.style.setProperty('--d0',modo==='3d'?'0s':'.85s');pm(false);setTimeout(()=>{if(el)el.style.setProperty('--d0','0s')},1800);
 if(modo==='3d')setTimeout(()=>{if(el)prepara()},1500);
 el.querySelectorAll('.pt-modo button').forEach(b=>b.onclick=()=>{if(modo===b.dataset.m)return;modo=b.dataset.m;el.style.setProperty('--d0','0s');snd();pm(true)});
 const ent=el.querySelector('.pt-in');if(ent)ent.onclick=()=>elige(modo==='3d'?cal:'ligero');
 el.querySelectorAll('.pt-op').forEach(o=>o.querySelector('.pt-go').onclick=()=>elige(o.dataset.q==='3d'?cal:'ligero'));
 const pj=el.querySelector('.pt-pj');pinta(pj);
 const nmI=el.querySelector('.pt-nm'),ancho=()=>{nmI.style.width=Math.max(4,nmI.value.length+1)+'ch'};ancho();if(!nmI.value)addEventListener('DOMContentLoaded',()=>{if(el&&!nmI.value&&window.BIEN&&BIEN.rnd){nmI.value=BIEN.rnd();ancho()}});nmI.oninput=()=>{nmI.classList.remove('mal');ancho()};
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
 // Enter en el nombre solo lo confirma; no elige Plano ni Casa
 nmI.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const n=nmI.value.trim();if(n){pname=n;ls.set('cont_n',n)}nmI.blur();snd()}});}

// q: 'ligero' | 'medio' | 'completo'
function elige(q){if(busy||!el)return;const nmI=el.querySelector('.pt-nm');
 if(nmI&&!el.classList.contains('bnv')){const n=nmI.value.trim();if(!n){nmI.classList.remove('mal');void nmI.offsetWidth;nmI.classList.add('mal');nmI.focus();return}
  pname=n;ls.set('cont_n',n);ls.set('cont_av_hecho','1')}busy=true;snd('card');const d3=q!=='ligero';
 el.querySelectorAll('.pt-op').forEach(o=>o.classList.toggle('yo',(o.dataset.q==='3d')===d3));el.classList.add('sale',d3?'a3d':'a2d');
 const pon=()=>{if(window.BIEN)BIEN.set(q);const C=window.CASA3D;if(C&&C.on()!==d3)casaToggle()};
 if(!d3){setTimeout(()=>{pon();pend=false;if(window.PLANO2D&&PLANO2D.entra)PLANO2D.entra();if(typeof render=='function')render();el.classList.add('va');setTimeout(quita,800)},620);return}
 setTimeout(()=>{pon();pend=false;if(typeof render=='function')render();espera()},650)}   // deja correr la animación antes de armar la casa (congela un momento)

// carga de la casa: progreso del piso (CAJA) en la barra y en las ventanas; al estar lista, se entra por la puerta
function espera(){const t0=performance.now(),bar=el.querySelector('.pt-bar i'),ws=[...el.querySelectorAll('.pt-col .w')];let v=0,okT=0;
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
addEventListener('load',()=>{if(el&&!window.CASA3D){const o=el.querySelector('.pt-op[data-q="3d"],.pt-modo');if(o)o.remove();modo='ligero';el.classList.remove('m3d');const b=el.querySelector('.pt-go');if(b)b.classList.add('ult')}});
// sale al abrir si no hay partida, ni bienvenida, ni enlace de sala (#CODIGO), ni página de prueba
const salta=inGame()||location.hash.length>1||/prueba/.test(location.pathname)||/[?&](casa|pb|pa|sm|az)=/.test(location.search)||(window.BIEN&&BIEN.pend());
if(!salta)show();
})();
