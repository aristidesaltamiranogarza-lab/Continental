// Mérida en Venta: "Mientras no estabas" (MVUE). Si te fuiste 20 s o más (otra app, pantalla apagada o sin conexión), al volver
// sale una tarjetita con cuánto cambió tu dinero, qué colonias ganaste o perdiste y lo último que te pasó (hasta 2 líneas del registro).
(function(){
let snap=null,el=null,tq=0;
const g=()=>typeof V!='undefined'&&V&&V.game=='merida'&&V.G&&V.G.phase=='play'&&V.me>=0?V.G:null;
const off=()=>typeof online!='undefined'&&!online;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $m=v=>window.MR&&MR.$m?MR.$m(v):'$'+v;
function toma(){const G=g();if(!G){snap=null;return}const m=V.me;snap={t:Date.now(),n:G.ln||0,cash:G.cash[m],own:G.own.map(o=>o===m)}}
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(!snap)toma()}else if(snap)snap.v=Date.now()});
setInterval(()=>{if(!snap){if(off())toma();return}
 if(document.hidden||off())return;const G=g();if(!G){snap=null;return}
 if(Date.now()-snap.t<20000){snap=null;return}            // fue un momento: nada
 if(snap.v&&Date.now()-snap.v<1500)return;                  // espera a que llegue el estado nuevo
 const s=snap;snap=null;muestra(G,s)},700);
function muestra(G,s){const m=V.me,B=window.MR&&MR.B||[],dl=G.cash[m]-s.cash,nom=(G.players[m]||{}).name||'';
 const gan=G.own.map((o,i)=>o===m&&!s.own[i]?i:-1).filter(i=>i>=0),per=s.own.map((x,i)=>x&&G.own[i]!==m?i:-1).filter(i=>i>=0);
 const ev=(G.log||[]).filter(e=>e.n>s.n&&(e.k===m||(nom&&String(e.t).includes(nom)))).slice(-2);
 if(!dl&&!gan.length&&!per.length&&!ev.length)return;
 const nm=i=>esc((B[i]||{}).n||'');
 const lis=(v,L)=>v+' '+(L.length>2?L.length+' colonias':L.map(nm).join(' y ')),L=[];if(gan.length)L.push(lis('Ganaste',gan));if(per.length)L.push(lis('Perdiste',per));
 ev.forEach(e=>L.push((e.k===m?'Tú ':e.k>=0?esc(G.players[e.k].name)+' ':'')+esc(e.t)));
 cierra();el=document.createElement('div');el.className='mvu';el.setAttribute('role','status');
 el.innerHTML=`<b>Mientras no estabas</b>${dl?`<div class="mvu-d ${dl<0?'dn':'up'}">${dl<0?'−':'+'}${$m(Math.abs(dl))}</div>`:''}${L.slice(0,3).map(t=>`<span>${t}</span>`).join('')}<button class="mvu-ok">Listo</button>`;
 el.querySelector('.mvu-ok').onclick=cierra;document.body.appendChild(el);
 {const sb=document.querySelector('.mu-hud.wide .mu-bot'),w=sb?sb.getBoundingClientRect().left:innerWidth;el.style.left=w/2+'px';el.style.width=Math.min(320,w-32)+'px'}   /* centrada sobre el tablero, no bajo el panel de la derecha */
 clearTimeout(tq);tq=setTimeout(cierra,9000)}
function cierra(){if(el){const e=el;el=null;e.classList.add('out');setTimeout(()=>e.remove(),220)}}
const css=document.createElement('style');css.textContent=`
.mvu{position:fixed;z-index:70;left:50%;top:calc(var(--mu-t,64px) + 8px);translate:-50% 0;width:min(320px,calc(100vw - 32px));box-sizing:border-box;padding:12px 14px;border-radius:var(--ui-r,22px);background:var(--ui-sheet);color:var(--ui-text);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow);font:600 14px/1.3 var(--ui-font);display:flex;flex-direction:column;gap:4px;animation:mvuIn .25s cubic-bezier(.2,1.3,.4,1) both}
.mvu>b{font:800 13px var(--ui-font);color:var(--ui-sub);text-transform:uppercase;letter-spacing:.06em}
.mvu-d{font:900 26px/1.1 var(--ui-font)}.mvu-d.up{color:#2e8b57}.mvu-d.dn{color:#c0392b}
html[data-tema=noche] .mvu-d.up{color:#7fd6a0}html[data-tema=noche] .mvu-d.dn{color:#ff8a7a}
.mvu span{color:var(--ui-sub)}
.mvu-ok{align-self:flex-end;min-height:44px;padding:0 18px;margin-top:4px;border:0;border-radius:999px;background:var(--ui-chip);color:var(--ui-text);font:800 14px var(--ui-font);cursor:pointer}
.mvu.out{animation:mvuOut .2s ease both}
@keyframes mvuIn{from{opacity:0;transform:translateY(-10px)}}@keyframes mvuOut{to{opacity:0;transform:translateY(-10px)}}`;
document.head.appendChild(css);
window.MVUE={prueba:()=>{const G=g();if(G)muestra(G,{n:(G.ln||0)-3,cash:G.cash[V.me]+120,own:G.own.map(()=>false)})}};
})();
