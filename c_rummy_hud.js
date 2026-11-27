// c_rummy_hud.js — RUH: la interfaz del Rummy (estilo Cálida, tokens de ui.css). Poca cosa en pantalla: arriba el ☰ (GHUD.top) y, solo en tu turno
// sin haber bajado, la pastilla "Primera bajada 18 / 30"; sobre cada quien una tablita con su nombre y sus fichas (la pone R3 en su lugar);
// el número de la bolsa sobre la bolsa; abajo a la derecha Ordenar, Deshacer y el botón que dice qué va a pasar (RMU.st.estado).
// Momentos: "¡Te toca!", la raya del tiempo sobre tu atril, el final con podio (puntos que cuentan) y "Mientras no estabas" al volver.
// Las animaciones usan un tiempo de inicio y animation-delay negativo para que render() no las reinicie.
(function(){
if(typeof GHUD==='undefined'||!window.UI)return;
const RU=window.RUMMY,es=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])),ic=n=>UI.ico(n);
const nm=k=>V.G.players[k]?es(V.G.players[k].name):'';
let t0=0;
function html(){const G=V.G,st=RMU.st,m=V.me,fin=G.phase!='play',my=st.myTurn,e=st.estado,is3=st.vista=='3d',now=Date.now();let h='<div class="rm-hud">';
 const baj=my&&!G.down[m]?`<span class="rm-baj${st.bajada>=RU.MIN1?' ok':''}">Primera bajada <b>${st.bajada}</b> / ${RU.MIN1}</span>`:'';
 h+=GHUD.top({st:baj||null,turn:fin?'Fin de la partida':my?'Tu turno':null,me:my,open:st.menu,menu:'RMU.menu()',right:`<button id="rmHome" class="ui-rb" onclick="RMU.home()" aria-label="Recentrar la vista" title="Recentrar" style="display:none">${ic('cuadrar')}</button>`});
 if(st.aviso)h+=GHUD.toast(es(st.aviso),now-st.avT);
 if(my&&now-st.turnoT<1700)h+=`<div class="ui rm-yt" style="--d:-${now-st.turnoT}ms" aria-live="polite"><b>¡Te toca!</b></div>`;
 // tablitas de los demás (R3 las acomoda sobre su cabeza; en 2D van en fila arriba)
 h+=`<div class="rm-pls${is3?'':' d2'}">`+G.ord.filter(k=>k!==m).map((k,i)=>{const c=st.cnt(k);return `<div class="ui rm-pl${!fin&&G.turn===k?' on':''}${!fin&&c<=2&&!G.out[k]?' hot':''}${G.out[k]?' out':''}" data-seat="${k}" style="--i:${i}"><b>${nm(k)}</b><i aria-label="${c} fichas">${c}</i></div>`}).join('')+'</div>';
 if(is3&&!fin)h+=`<div id="rmbag" class="ui rm-bag" title="Fichas en la bolsa" aria-label="${G.nb} fichas en la bolsa">${G.nb}</div>`;
 if(!fin)h+=`<i id="rmclk" class="rm-clk${my?' yo':''}"></i>`;
 // botones: Ordenar siempre; en tu turno Deshacer (mantener = todo) y el grande
 let b='';
 if(!fin&&m>=0){b+=`<button class="ui-rb rm-ord" onclick="RMU.sort()" aria-label="Ordenar el atril" title="Ordenar (O)">${ic('ordenar')}</button>`;
  if(my){b+=`<button class="ui-rb rm-und" ${st.hist?'':'disabled'} onpointerdown="RUH.lp(1)" onpointerup="RUH.lp(0)" onpointerleave="RUH.lp(-1)" onclick="RUH.clic()" aria-label="Deshacer (mantén para regresar todo)" title="Deshacer (Ctrl+Z) · mantén para regresar todo">${ic('deshacer')}</button>`;
   b+=`<button class="ui-btn rm-go ${e.k}" ${st.busy?'disabled':''} onclick="RMU.end()">${e.k=='listo'?ic('ok'):''}<span>${e.t}</span></button>`}}
 if(is3)h+=b?`<div class="ui rm-acc">${b}</div>`:'';else if(b)h+=GHUD.bar(b);
 if(fin)h+=final(G,now-st.finT);
 if(st.menu){const rg=String(GM.rummy.rules).replace(/^\s*<details>\s*<summary>[^<]*<\/summary>/,'').replace(/<\/details>\s*$/,'');
  const aj=GHUD.ajustes(GHUD.row('','Vista',UI.dim(is3?1:0,'RMU.mode()'))+GHUD.row('','Sugerencias en el atril',GHUD.sw(st.ayuda,'RMU.ayuda()','Sugerencias en el atril')),
   `<button class="ui-btn sec full" onclick="leave()">${ic('salir')}${V.watch?'Dejar de mirar':'Salir de la sala'}</button>`);
  h+=GHUD.sheet('Rummy',[['aj','Ajustes',aj],['rg','Reglas',`<div class="gj-rt">${rg}</div>`]],'RMU.menu(0)')}
 return h+'</div>'}
// final: primero se ve en la mesa (todos voltean su atril) y a los 2.2 s brota el podio con los puntos contando
function final(G,age){const m=V.me,w=G.win,ks=G.ord.slice().sort((a,b)=>(b===w)-(a===w)||(G.pts[a]-G.pts[b])||(G.racks[a].length-G.racks[b].length));
 const t=w==null?'Nadie ganó':w===m?'¡Ganaste!':'Ganó '+nm(w);
 return `<div class="ui ui-card gj-win rm-fin" style="--d:-${age}ms" role="dialog" aria-label="Fin de la partida"><div class="ui-bd">
  <div class="rm-big">${t}</div><div class="ui-sub rm-sub">${w!=null&&G.racks[w].length===0?'Se quedó sin fichas.':'Se acabó la bolsa: gana quien tiene menos puntos.'}</div>
  <div class="rm-res">${ks.map((k,i)=>`<div class="${k===w?'w':''}" style="--i:${i}"><span>${nm(k)}${k===m?' <small>(tú)</small>':''}${G.out[k]?' <small>(se fue)</small>':''}</span><small>${G.racks[k].length} ${G.racks[k].length==1?'ficha':'fichas'}</small><b data-cnt="${G.pts[k]}">0</b></div>`).join('')}</div>
  <div class="rm-btns">${V.host?`<button class="ui-btn full" onclick="RMU.again()">${ic('nuevo')}Jugar otra vez</button>`:'<span class="ui-sub">El host puede empezar otra.</span>'}<button class="ui-btn sec full" onclick="leave()">${ic('casa')}Volver a la casa</button></div></div></div>`}
// lo que el tablero deja libre: arriba la barra; en 3D a la derecha nada (los botones flotan sobre la mesa) y en vertical una fila arriba del atril
function ins(is3){const t=document.getElementById('gjTop'),b=document.querySelector('#gjBar .gj-bb'),top=t?Math.round(t.getBoundingClientRect().bottom+6):56,land=innerWidth>innerHeight*1.1;
 return {t:top,b:b?Math.round(innerHeight-b.getBoundingClientRect().top+4):0,r:0,rb:is3&&!land?60:0}}
let cntT=0;
function after(){const R=document.documentElement;R.style.setProperty('--rm-edl',-(Date.now()-t0)+'ms');R.classList.toggle('rm-entra',Date.now()-t0<1900);
 rack();
 // puntos del final que cuentan
 const st=RMU.st;if(st.finT){cancelAnimationFrame(cntT);const go=()=>{const a=Date.now()-st.finT-2500;let more=false;document.querySelectorAll('.rm-res [data-cnt]').forEach((e,i)=>{const p=Math.max(0,Math.min(1,(a-i*120)/800)),v=Math.round(+e.dataset.cnt*(1-Math.pow(1-p,3)));if(e.textContent!=v)e.textContent=v;if(p<1)more=true});if(more)cntT=requestAnimationFrame(go)};go()}}
function rack(){const y=window.R3&&RMU.st.vista=='3d'?Math.round(innerHeight-R3.rackTop):0;document.documentElement.style.setProperty('--rm-rack',y+'px');
 const h=document.getElementById('rmHome');if(h){const v=RMU.st.vista=='3d'&&window.R3&&R3.vista;h.style.display=v?'':'none'}}
function reloj(t,tot,play){rack();const c=document.getElementById('rmclk');if(!c)return;c.style.transform=`scaleX(${play?(t/tot).toFixed(3):0})`;c.classList.toggle('w',t<10500)}
// Deshacer: tocar = uno; mantener = regresar todo
let lpT=0,lpH=false;
const lp=d=>{if(d===1){lpH=false;clearTimeout(lpT);lpT=setTimeout(()=>{lpH=true;try{navigator.vibrate&&navigator.vibrate(15)}catch(_){}RMU.todo()},650)}else clearTimeout(lpT)};
const clic=()=>{if(lpH){lpH=false;return}RMU.undo()};
// "Mientras no estabas": si te fuiste 20 s o más, al volver una tarjetita con lo último que pasó
let snap=null;
document.addEventListener('visibilitychange',()=>{const ok=typeof V!='undefined'&&V&&V.game=='rummy'&&V.G&&V.G.phase=='play'&&V.me>=0;
 if(document.hidden){if(ok)snap={t:Date.now(),n:V.G.ln||0}}else if(snap){const s=snap;snap=null;setTimeout(()=>{if(!ok||Date.now()-s.t<20000)return;const G=V.G,L=(G.log||[]).filter(l=>l.n>s.n).slice(-2).map(l=>es(l.t));if(!L.length)return;
  const el=document.createElement('div');el.className='ui ui-card rm-vue';el.setAttribute('role','status');el.innerHTML=`<b>Mientras no estabas</b>${L.map(x=>`<span>${x}</span>`).join('')}<span class="ui-sub">Te quedan ${G.nr[V.me]} fichas.</span>`;
  el.onclick=()=>el.remove();document.body.appendChild(el);setTimeout(()=>{el.classList.add('fue');setTimeout(()=>el.remove(),300)},6500)},900)}});
const css=document.createElement('style');css.textContent=`
html.rmui #app{pointer-events:none;max-width:none;margin:0;padding:0}html.rmui #app>:not(.rm-hud){display:none!important}
#rm3root{position:fixed;inset:0;z-index:1;display:none}#rm3root canvas{display:block;width:100%;height:100%;touch-action:none;-webkit-user-select:none;user-select:none}
.rm-hud{position:fixed;inset:0;z-index:2;pointer-events:none}.rm-hud .ui,.rm-hud button{pointer-events:auto}
.rm-baj{font-weight:700}.rm-baj b{color:var(--ui-accent);font-weight:800}.rm-baj.ok b{color:inherit}
.rm-pls{position:fixed;inset:0;pointer-events:none}
.rm-pl{position:fixed;left:0;top:0;display:flex;align-items:center;gap:6px;padding:3px 4px 3px 11px;border-radius:999px;background:var(--ui-panel);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow);color:var(--ui-text);font:700 13px var(--ui-font);white-space:nowrap;pointer-events:none!important;transition:background-color .25s,color .25s}
.rm-pl b{max-width:9em;overflow:hidden;text-overflow:ellipsis;font-weight:700}.rm-pl i{font-style:normal;font-weight:800;min-width:24px;height:24px;border-radius:999px;display:grid;place-items:center;background:var(--ui-chip);color:var(--ui-accent);font-size:13px}
.rm-pl.on{background:var(--ui-accent);color:var(--ui-on);border-color:transparent}.rm-pl.on i{background:var(--ui-on);color:var(--ui-accent)}
.rm-pl.out{opacity:.45}.rm-pl.out b{text-decoration:line-through}
.rm-pls.d2{position:fixed;inset:auto 0 auto 0;top:calc(env(safe-area-inset-top,0px) + 62px);display:flex;justify-content:center;gap:6px;flex-wrap:wrap}.rm-pls.d2 .rm-pl{position:static;transform:none!important}
.rm-bag{position:fixed;left:0;top:0;min-width:30px;height:24px;padding:0 8px;border-radius:999px;display:grid;place-items:center;background:var(--ui-panel);border:1px solid var(--ui-line);color:var(--ui-text);font:800 12px var(--ui-font);pointer-events:none!important}
.rm-clk{position:fixed;left:0;right:0;bottom:var(--rm-rack,0px);height:3px;background:var(--ui-accent);opacity:.55;transform-origin:0 50%;transition:transform .25s linear;pointer-events:none}.rm-clk.yo{opacity:.95;height:4px}
.rm-clk.w.yo{animation:rmBl .5s ease-in-out infinite alternate}
.rm-acc{position:fixed;right:calc(10px + env(safe-area-inset-right,0px));bottom:calc(var(--rm-rack,90px) + 10px);display:flex;align-items:center;gap:8px;background:none;border:0;box-shadow:none}
.rm-go{min-width:136px;height:48px;font-size:16px;font-weight:800;padding:0 20px}.rm-go span{white-space:nowrap}
.rm-go.robar,.rm-go.faltan,.rm-go.mal{background:var(--ui-panel);color:var(--ui-text);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow)}
.rm-go.faltan span,.rm-go.mal span{color:var(--ui-accent)}.rm-go.mal{border-color:var(--ui-accent)}
.rm-und:disabled{opacity:.4}
.rm-yt{position:fixed;left:50%;top:38%;translate:-50% -50%;padding:12px 26px;border-radius:999px;background:var(--ui-accent);color:var(--ui-on);font:800 22px var(--ui-font);box-shadow:var(--ui-shadow);pointer-events:none!important;animation:rmYt 1.7s cubic-bezier(.3,1.4,.5,1) var(--d,0s) both}
.rm-fin{position:fixed;left:50%;top:50%;translate:-50% -50%;width:min(380px,calc(100% - 28px));max-height:calc(100% - 28px);z-index:20}
.rm-big{font:800 26px var(--ui-font);text-align:center}.rm-sub{text-align:center;margin:2px 0 12px}
.rm-res{display:flex;flex-direction:column;gap:6px}.rm-res>div{display:flex;align-items:center;gap:10px;min-height:44px;padding:4px 14px;border-radius:16px;background:var(--ui-chip)}
.rm-res span{flex:1;font-weight:700}.rm-res small{color:var(--ui-sub)}.rm-res b{min-width:2.2em;text-align:right;font-weight:800;font-size:17px}
.rm-res .w{background:var(--ui-accent);color:var(--ui-on)}.rm-res .w small{color:inherit;opacity:.85}
.rm-btns{display:flex;flex-direction:column;gap:8px;margin-top:14px}
.rm-vue{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 70px);translate:-50% 0;z-index:30;display:flex;flex-direction:column;gap:3px;padding:12px 18px;max-width:calc(100% - 28px);font-size:14px;cursor:pointer;animation:rmS .5s cubic-bezier(.3,1.4,.5,1) both}
.rm-vue.fue{transition:opacity .25s,translate .25s;opacity:0;translate:-50% -20px}
@media (orientation:portrait){.rm-acc{left:10px;right:10px;justify-content:flex-end}.rm-go{flex:1;max-width:230px}}
@media (prefers-reduced-motion:no-preference){
.rm-pl.hot i{animation:rmHot 1.1s ease-in-out infinite}
.rm-go.listo{animation:rmGo 1.6s ease-in-out infinite}
.rm-acc button{transition:transform .3s cubic-bezier(.34,1.7,.5,1)}.rm-acc button:active{transform:scale(.94);transition-duration:.07s}
.rm-fin{animation:rmP .6s cubic-bezier(.3,1.4,.5,1) calc(var(--d,0s) + 2.2s) both}.rm-res>div{animation:rmL .5s cubic-bezier(.3,1.4,.5,1) calc(var(--d,0s) + 2.45s + var(--i)*.12s) both}
.rm-res>.w{animation:rmL .5s cubic-bezier(.3,1.4,.5,1) calc(var(--d,0s) + 2.45s) both,rmW .45s ease-in-out calc(var(--d,0s) + 3.4s) 2}
.rm-btns{animation:rmS .5s cubic-bezier(.3,1.4,.5,1) calc(var(--d,0s) + 3s) both}
html.rm-entra .gj-top>*{animation:rmB .6s cubic-bezier(.3,1.4,.5,1) var(--rm-edl,0s) both}
html.rm-entra .rm-pl>*{animation:rmP .5s cubic-bezier(.3,1.4,.5,1) calc(var(--rm-edl,0s) + .5s + var(--i,0)*.09s) both}
html.rm-entra .rm-acc>*{animation:rmS .6s cubic-bezier(.3,1.4,.5,1) calc(var(--rm-edl,0s) + .35s) both}
html.rm-entra .rm-acc>:nth-child(2){animation-delay:calc(var(--rm-edl,0s) + .42s)}html.rm-entra .rm-acc>:nth-child(3){animation-delay:calc(var(--rm-edl,0s) + .5s)}
}
@media (prefers-reduced-motion:reduce){.rm-fin{animation:rmF .2s linear calc(var(--d,0s) + 2.2s) both}}
@keyframes rmB{from{opacity:0;translate:0 -36px}}@keyframes rmP{from{opacity:0;scale:.4}}@keyframes rmS{from{opacity:0;translate:0 50px}}@keyframes rmL{from{opacity:0;translate:-30px 0}}@keyframes rmF{from{opacity:0}}
@keyframes rmW{50%{scale:1.05}}@keyframes rmGo{0%,100%{box-shadow:var(--ui-shadow)}50%{box-shadow:var(--ui-shadow),0 0 0 6px var(--ui-chip)}}
@keyframes rmHot{0%,100%{scale:1}50%{scale:1.22;background:var(--ui-accent);color:var(--ui-on)}}@keyframes rmBl{to{opacity:.35}}
@keyframes rmYt{0%{opacity:0;scale:.4}18%{opacity:1;scale:1}78%{opacity:1;scale:1}100%{opacity:0;scale:1.08}}
`;document.head.appendChild(css);
window.RUH={html,ins,after,reloj,lp,clic,entra(){t0=Date.now()}};
})();
