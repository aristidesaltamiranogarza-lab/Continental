// Rummy: interfaz del juego (HUD mínimo y estado local del turno). Envuelve GM.rummy.body/after; NO cambia reglas ni servidor.
// El tablero lo dibuja la terraza 3D (R3, c_rummy3d.js) o la mesa 2D (R2, c_rummy2d.js), con la misma API; se cambia en el menú. En tu turno se arma una mesa de trabajo local con Deshacer:
// cada cambio se manda como mesa temporal (t:'tmp', para que los demás la vean en vivo) y al terminar se valida aquí con RUMMY.check antes de mandarla (t:'end').
(function(){
const RU=window.RUMMY;if(!RU||typeof GM==='undefined'||!GM.rummy||!window.R2){console.warn('Rummy UI: faltan rummy_reglas.js, c_rummy.js o c_rummy2d.js');return}
const origBody=GM.rummy.body,es=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])),cp=m=>m.map(g=>g.slice());
const coarse=matchMedia('(pointer:coarse)').matches,LOCK='Antes de tu primera bajada no puedes tocar las fichas de la mesa.';
// key: turno que se está armando (G.tc:G.turn) · base: la mesa al empezar el turno · work: la mesa de trabajo · placed: fichas del atril puestas en work · hist: para Deshacer
let on=false,ok=true,menu=false,key='',base=[],work=[],placed=new Set(),hist=[],sel=null,order=[],porNum=false,aviso='',avT=0,logN=-1,say='',sayT=0,dl=0,lastV=null,tmpT=0,tmpK='',busy=false,big=false,mode=(()=>{try{return localStorage.getItem('rm_view')||'3d'}catch(e){return '3d'}})();
const active=()=>!!S&&!!V&&V.game==='rummy'&&!!V.G&&(V.G.phase==='play'||V.G.phase==='final');
const me=()=>V.me,mine=()=>V.G.mio||[],nm=k=>k>=0&&V.G.players[k]?es(V.G.players[k].name):'',baseSet=()=>new Set(base.flat());
const myTurn=()=>V.G.phase==='play'&&me()>=0&&!!V.G.players[me()]&&!V.G.out[me()]&&V.G.turn===me();
const is3=()=>mode=='3d'&&!!window.R3&&R3.ok(),stage=()=>is3()?window.R3:R2;
const inRack=id=>mine().includes(id)&&!placed.has(id),onTable=id=>work.some(g=>g.includes(id));
const tell=t=>{aviso=t;avT=Date.now()};
// ---- sonidos (c_rummysfx.js): lo que manda el servidor (G.fx) y las fichas que mueve quien está jugando ----
let lastF=-1,lastTn=null;const SFX=(n,v)=>{if(window.RMS)RMS.snd(n,v)},VOZ=t=>{if(window.RMS)RMS.voz(t)},una=a=>a[Math.random()*a.length|0];
function fxSnd(){const G=V.G,F=G.fx||[];if(G.tn!==lastTn){if(lastTn!=null&&!myTurn())SFX('clac',.6);lastTn=G.tn}
 if(lastF<0)lastF=F.filter(f=>(f.ago||0)>2500).reduce((m,f)=>Math.max(m,f.n),0);   // al llegar solo suena lo recién pasado (como revolver la bolsa al empezar)
 F.forEach(f=>{if(f.n<=lastF)return;lastF=f.n;const yo=f.k===me();
  if(f.t=='mez')SFX('mez');
  else if(f.t=='roba'){SFX('roce');if(Math.random()<.35)VOZ(una(yo?['¡Ja, ja! ¡A robar!','¡Otra más!']:['¡Uy!','¡Ay, nanita!','¡Otra más!']))}
  else if(f.t=='juega'){for(let i=0;i<Math.min(f.to||1,6);i++)setTimeout(()=>SFX('clac',.8),i*90);if((f.to||0)>=3)VOZ(una(yo?['¡Eso!','¡Muy bien, mijo!']:['¡Ándale!','¡Mira nomás!','¡Qué bárbaro!']))}
  else if(f.t=='tiempo'||f.t=='mal'){SFX('mal');VOZ(una(yo?['¡Te tardaste!','¡Ándale, pues!']:['¡Ay, no!','¡Uy!']))}
  else if(f.t=='gana'){SFX('gana');setTimeout(()=>SFX('aplauso'),350);VOZ(yo?'¡Felicidades!':una(['¡Bravo!','¡Felicidades!','¡Qué suerte!']))}})}
// ---- estado local: se reinicia en cada turno; si recargas a media jugada se recupera de G.tmp ----
function syncTurn(){const G=V.G,k=G.tc+':'+G.turn;if(k===key)return;key=k;base=cp(G.mesa);hist=[];sel=null;placed=new Set();tmpK='';work=cp(base);
 if(myTurn()){if(G.tmp){const A=baseSet(),M=new Set(mine());work=cp(G.tmp);work.flat().forEach(x=>{if(!A.has(x)&&M.has(x))placed.add(x)})}tell('¡Te toca!')}}
function syncOrder(){const M=mine();if(!order.length&&M.length){order=RU.ordena(M,porNum);return}order=order.filter(x=>M.includes(x));M.forEach(x=>{if(!order.includes(x))order.push(x)})}
// lo que dibuja el tablero: en tu turno tu mesa de trabajo; si no, la mesa temporal de quien está jugando
function view(){const G=V.G,my=myTurn(),live=G.phase=='play'&&!my&&G.tmp,mesa=my?work:live?G.tmp:G.mesa,A=new Set(G.mesa.flat());
 const bad=new Set(),lock=new Set();mesa.forEach((g,k)=>{if(!RU.grp(g))bad.add(k);if(my&&!G.down[me()]&&g.some(x=>A.has(x)))lock.add(k)});
 const nuevas=new Set(my?placed:live?G.tmp.flat().filter(x=>!A.has(x)):[]);
 return {mesa,atril:me()>=0?order.filter(x=>!placed.has(x)):null,sel,bad,nuevas,lock,my,G,me:me(),dl,cnt:G.players.map((_,k)=>cnt(k))}}   // G, me, dl y cnt los usa el 3D
function cnt(k){const G=V.G;if(G.phase!='play')return G.nr[k];if(k===me()&&myTurn())return mine().length-placed.size;
 if(k===G.turn&&G.tmp){const A=new Set(G.mesa.flat());return G.nr[k]-G.tmp.flat().filter(x=>!A.has(x)).length}return G.nr[k]}
function why(id){return !myTurn()?'Espera tu turno.':placed.has(id)||V.G.down[me()]?'':LOCK}
function save(){hist.push({w:cp(work),p:[...placed]});if(hist.length>80)hist.shift()}
function changed(){clearTimeout(tmpT);tmpT=setTimeout(()=>{if(!active()||!myTurn())return;const k=JSON.stringify(work);if(k===tmpK)return;tmpK=k;
  api('act',{c:S.c,t:S.t,m:{t:'tmp',mesa:work}}).catch(()=>{})},300);render()}
const no=t=>{tell(t);sel=null;render()};
window.RMU={
 can(id){if(V.G.phase!='play')return false;if(inRack(id))return true;return myTurn()&&onTable(id)&&!why(id)},
 pick(id){if(id!=null&&!RMU.can(id))return no(why(id)||'Esa ficha no se puede mover.');sel=id;render()},
 // a: {g, at} en el grupo g · {g:-1} combinación nueva · {r:at} al atril (reacomodar el atril se vale en cualquier momento)
 put(id,a){const G=V.G;if(G.phase!='play')return;const fromRack=inRack(id);
  if(a.r!=null){if(!fromRack){if(!myTurn()||!placed.has(id))return no('Las fichas de la mesa no pueden regresar a tu atril.');save();work=work.map(g=>g.filter(x=>x!==id)).filter(g=>g.length);placed.delete(id)}
   const sh=order.filter(x=>x!==id&&!placed.has(x)),b=sh[a.r];order=order.filter(x=>x!==id);order.splice(b==null?order.length:order.indexOf(b),0,id);sel=null;return changed()}
  if(!myTurn())return no('Espera tu turno.');if(!fromRack&&!RMU.can(id))return no(why(id)||'Esa ficha no se puede mover.');
  if(a.g>=0&&!G.down[me()]&&work[a.g]&&work[a.g].some(x=>baseSet().has(x)))return no(LOCK);
  save();const W=cp(work);for(const g of W){const p=g.indexOf(id);if(p>=0){g.splice(p,1);break}}
  if(a.g<0||!W[a.g])W.push([id]);else{W[a.g].splice(Math.min(a.at,W[a.g].length),0,id);W[a.g]=RU.arregla(W[a.g])}
  work=W.filter(g=>g.length);if(fromRack)placed.add(id);sel=null;SFX('clac');changed()},
 rack(o){if(o&&!coarse)return;big=!!o;stage().cam(big?'atril':'home');render()},
 undo(){if(!myTurn()||!hist.length)return;const h=hist.pop();work=h.w;placed=new Set(h.p);sel=null;changed()},
 sort(){porNum=!porNum;order=RU.ordena(order,porNum);stage().sort(porNum);[0,70,150].forEach(d=>setTimeout(()=>SFX('clac',.5),d));tell(porNum?'Atril ordenado por número.':'Atril ordenado por color.');render()},
 async end(){if(!myTurn()||busy)return;const G=V.G,r=RU.check(base,mine(),work,G.down[me()]);
  if(r.err)return no(r.err+(r.bad?' Corrígelas o usa Deshacer.':''));
  busy=true;clearTimeout(tmpT);render();const okk=await send(r.pass?{t:'end'}:{t:'end',mesa:work});busy=false;
  if(!okk&&typeof msg=='string'&&msg)tell(msg.replace(/^✋ No puedes hacer eso\. /,''));render()},
 async again(){if(await send({t:'reset'}))await send({t:'start'});render()},
 menu(o){menu=!!o;render()},
 radio(){if(!window.RMS)return;const v=RMS.radio();tell(v?'📻 Radio prendida.':'📻 Radio apagada.');render()},
 mode(x){stage().cam('home');big=false;mode=x||(is3()?'2d':'3d');try{localStorage.setItem('rm_view',mode)}catch(e){}menu=false;render()},
 vista(){stage().cam('vista')}};
// ---- HUD: barra de arriba, narración, botones del turno, resumen y menú ----
function txt(){const n=Date.now();return aviso&&n-avT<4500?aviso:say&&n-sayT<5500?say:''}
function hud(){syncTurn();syncOrder();const G=V.G,m=me(),fin=G.phase!='play',my=myTurn(),L=G.log[G.log.length-1],ic=n=>UI.ico(n);
 if(L&&L.n!==logN){if(logN>=0||G.log.length==1){say=L.t;sayT=Date.now()}logN=L.n}
 // arriba: juego y bolsa, turno y ☰ (con el reloj del turno); debajo los jugadores con sus fichas
 const chips=G.ord.map(k=>`<span class="ui-pill rm-p${k===G.turn&&!fin?' t':''}${G.out[k]?' o':''}${k===m?' yo':''}">${nm(k)} <b>${cnt(k)}</b></span>`).join('');
 let h=`<div class="rm-hud">`+GHUD.top({st:`🀄 <b>Rummy</b> <span class="rm-nb" title="Fichas en la bolsa">👜 ${G.nb}</span>`,turn:(fin?'Fin de la partida':my?'¡Tu turno!':'Turno de '+nm(G.turn))+(fin?'':'<i id="rmclk"></i>'),me:my,open:menu,menu:`RMU.menu(${menu?0:1})`});
 h+=`<div class="ui rm-ps">${chips}</div>`;
 const t=txt();h+=`<div id="rmsay" class="ui rm-say${t?' on':''}">${es(t)}</div>`;
 let b='';
 if(my){const bj=RU.bajada(base,work);b=(G.down[m]?'':`<span class="gj-note rm-baj${bj>=RU.MIN1?' ok':''}" title="Primera bajada">${bj} / ${RU.MIN1}</span>`)
  +`<button class="ui-btn sec" onclick="RMU.sort()">${ic('ordenar')}Ordenar</button><button class="ui-btn sec" onclick="RMU.undo()"${hist.length?'':' disabled'}>Deshacer</button>`
  +`<button class="ui-btn go rm-end" onclick="RMU.end()"${busy?' disabled':''}>${ic('ok')}<span>Terminar turno${placed.size?'':'<small>robas 1</small>'}</span></button>`
  +(is3()?`<button class="ui-btn sec" onclick="RMU.vista()">${ic('ojo')}Cambiar vista</button>`:'')+(big?`<button class="ui-btn sec" onclick="RMU.rack(0)" aria-label="Vista normal">${ic('cuadrar')}</button>`:'')}
 else if(big)b=`<button class="ui-btn sec" onclick="RMU.rack(0)">${ic('cuadrar')}Vista normal</button>`;
 if(b)h+=GHUD.bar(b);
 if(fin){const rows=G.ord.slice().sort((a,b)=>(b===G.win)-(a===G.win)||G.pts[a]-G.pts[b]).map(k=>`<div class="${k===G.win?'w':''}"><span>${k===G.win?'🏆 ':''}${nm(k)}${G.out[k]?' <small>(se fue)</small>':''}</span><small>${G.racks[k].length} ${G.racks[k].length==1?'ficha':'fichas'}</small><b>${G.pts[k]} pts</b></div>`).join('');
  h+=`<div class="ui ui-card gj-win rm-fin" role="dialog" aria-label="Fin de la partida"><div class="ui-hd"><h2 class="ui-h">Fin de la partida</h2></div><div class="ui-bd"><div class="rm-big">${G.win==null?'Nadie ganó':G.win===m?'🏆 ¡Ganaste!':'🏆 Ganó '+nm(G.win)}</div><div class="rm-res">${rows}</div><p class="ui-sub rm-s">Puntos que quedaron en mano (el comodín vale ${RU.JV}).</p>`
   +`<div class="gj-btns">${V.host?`<button class="ui-btn full" onclick="RMU.again()">${ic('nuevo')}Jugar otra vez</button>`:'<span class="ui-sub">El host puede empezar otra.</span>'}<button class="ui-btn sec full" onclick="leave()">${ic('casa')}Volver a la casa</button></div></div></div>`}
 // menú ☰: un solo panel con pestañas (ajustes y reglas)
 if(menu){const rg=String(GM.rummy.rules).replace(/^\s*<details>\s*<summary>[^<]*<\/summary>/,'').replace(/<\/details>\s*$/,'');
  const aj=GHUD.ajustes(window.RMS?GHUD.row('musica','Radio',GHUD.sw(!!RMS.radioOn,'RMU.radio()','Radio')):'',
   (window.R3?`<button class="ui-btn sec full" onclick="RMU.mode()">${ic('pantalla')}${is3()?'Ver en 2D':'Ver en 3D'}</button>`:'')+`<button class="ui-btn sec full" onclick="leave()">${ic('salir')}${V.watch?'Dejar de mirar':'Salir de la sala'}</button>`);
  h+=GHUD.sheet('Rummy',[['aj','Ajustes',aj],['rg','Reglas',`<div class="gj-rt">${rg}</div>`]],'RMU.menu(0)')}
 return h+'</div>'}
function ins(){const t=document.querySelector('.rm-ps')||document.getElementById('gjTop'),b=document.querySelector('#gjBar .gj-bb');return {t:t?Math.round(t.getBoundingClientRect().bottom+6):0,b:b?Math.round(innerHeight-b.getBoundingClientRect().top+4):0}}
// ---- enganche con game.js ----
GM.rummy.body=function(){if(!active())return origBody();GHUD.save();try{ok=true;return hud()}catch(e){console.warn('Rummy UI:',e);ok=false;return origBody()}};
GM.rummy.after=function(){if(!active()||!ok){off();return}
 if(!on){on=true;document.documentElement.classList.add('rmui');if(window.RMS)RMS.amb(true)}if(V!==lastV){lastV=V;dl=Date.now()+(V.G.left||0);fxSnd()}
 const s=stage();if(s!==R2)R2.show(false);if(window.R3&&s!==R3)R3.show(false);s.show(true);
 if(s!==R2&&!s.ok())return render();   // el 3D no pudo arrancar: queda el 2D
 GHUD.restore();s.layout(ins());s.sync(view())};
function off(){if(!on)return;on=false;document.documentElement.classList.remove('rmui');R2.cam('home');R2.show(false);if(window.R3)R3.show(false);menu=false;key='';order=[];sel=null;big=false;hist=[];logN=-1;aviso='';say='';lastF=-1;lastTn=null;if(window.RMS)RMS.amb(false)}
// reloj y narración sin volver a dibujar todo
setInterval(()=>{if(on&&!active())return off();if(!on)return;const G=V.G,c=document.getElementById('rmclk');
 if(c&&G.phase=='play'){const t=Math.max(0,dl-Date.now());c.style.width=(t/(G.o.t*10)).toFixed(1)+'%';c.className=t<10000?'w':''}
 const s=document.getElementById('rmsay'),x=txt();if(s&&s.textContent!==x){s.textContent=x;s.classList.toggle('on',!!x)}},200);
let rzT=0;addEventListener('resize',()=>{if(!on)return;clearTimeout(rzT);rzT=setTimeout(()=>{if(active())render()},120)});
addEventListener('keydown',e=>{if(!on)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()=='z'){e.preventDefault();RMU.undo()}else if(e.key=='Escape'){if(menu)RMU.menu(0);else if(sel!=null){sel=null;render()}}});
// ---- estilos ----
const css=document.createElement('style');css.textContent=`
html.rmui #app{pointer-events:none;max-width:none;margin:0;padding:0}html.rmui #app>:not(.rm-hud){display:none!important}
.rm-hud{position:fixed;inset:0;z-index:2;pointer-events:none}
.rm-nb{margin-left:6px;color:var(--ui-sub)}
.gj-turn{position:relative;overflow:hidden}
#rmclk{position:absolute;left:0;bottom:0;height:3px;width:100%;background:var(--ui-accent);transition:width .2s linear}.gj-turn.me #rmclk{background:var(--ui-on)}#rmclk.w{animation:gjPop .5s ease-in-out infinite alternate}
.rm-ps{position:fixed;z-index:12;top:calc(env(safe-area-inset-top,0px) + 68px);left:calc(14px + env(safe-area-inset-left,0px));right:calc(14px + env(safe-area-inset-right,0px));display:flex;gap:6px;overflow-x:auto;pointer-events:auto;scrollbar-width:none}
.rm-p{height:34px;padding:0 12px;font-size:13px;flex:none;cursor:default}.rm-p b{font-weight:800;margin-left:4px;color:var(--ui-accent)}
.rm-p.t{background:var(--ui-accent);color:var(--ui-on);border-color:transparent}.rm-p.t b{color:inherit}.rm-p.o{opacity:.45;text-decoration:line-through}.rm-p.yo{font-weight:800}
.rm-say{position:fixed;z-index:12;top:calc(env(safe-area-inset-top,0px) + 112px);left:50%;transform:translateX(-50%);max-width:calc(100% - 32px);padding:8px 16px;border-radius:999px;background:var(--ui-panel);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow);color:var(--ui-text);font-size:14px;text-align:center;opacity:0;transition:opacity .3s;pointer-events:none}
.rm-say.on{opacity:1}
.rm-baj{color:var(--ui-accent);font-weight:800}.rm-baj.ok{background:var(--ui-accent);color:var(--ui-on)}
.rm-end span{display:flex;flex-direction:column;align-items:flex-start;line-height:1.1}.rm-end small{font-size:11px;font-weight:600;opacity:.85}
.rm-fin{top:50%;transform:translate(-50%,-50%);width:min(400px,calc(100% - 28px));max-height:calc(100% - 40px)}
.rm-big{font-size:1.3em;font-weight:800;margin-bottom:6px}
.rm-res{align-self:stretch;display:flex;flex-direction:column;gap:4px}
.rm-res div{display:flex;align-items:center;gap:8px;min-height:40px;padding:4px 12px;border-radius:14px;background:var(--ui-chip)}.rm-res span{flex:1}.rm-res small{color:var(--ui-sub)}
.rm-res .w{background:var(--ui-accent);color:var(--ui-on)}.rm-res .w small{color:inherit}
.rm-s{font-size:12px;margin:6px 0 0;text-align:center}
`;
document.head.appendChild(css);
})();
