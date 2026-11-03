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
function hud(){syncTurn();syncOrder();const G=V.G,m=me(),fin=G.phase!='play',my=myTurn(),L=G.log[G.log.length-1];
 if(L&&L.n!==logN){if(logN>=0||G.log.length==1){say=L.t;sayT=Date.now()}logN=L.n}
 const chips=G.ord.map(k=>`<span class="rm-p${k===G.turn&&!fin?' t':''}${G.out[k]?' o':''}${k===m?' yo':''}">${nm(k)} <b>${cnt(k)}</b></span>`).join('');
 let h=`<div class="rm-hud"><div class="rm-top">🀄 <b>Rummy</b><span class="rm-ps">${chips}</span><span title="Fichas en la bolsa">👜 ${G.nb}</span><button class="rm-ib" onclick="RMU.menu(1)" aria-label="Menú">☰</button>${fin?'':'<i id="rmclk"></i>'}</div>`;
 const t=txt();h+=`<div id="rmsay" class="rm-say${t?' on':''}">${es(t)}</div>`;
 if(my){const b=RU.bajada(base,work);h+=`<div class="rm-bot">${G.down[m]?'':`<span class="rm-baj${b>=RU.MIN1?' ok':''}" title="Primera bajada">${b} / ${RU.MIN1}</span>`}`
  +`<button class="rm-b" onclick="RMU.sort()">⇅ Ordenar</button><button class="rm-b" onclick="RMU.undo()"${hist.length?'':' disabled'}>↶ Deshacer</button>`
  +`<button class="rm-b pri" onclick="RMU.end()"${busy?' disabled':''}>✔ Terminar turno${placed.size?'':'<small>robas 1</small>'}</button>`
  +(is3()?'<button class="rm-b" onclick="RMU.vista()">👁 Cambiar vista</button>':'')+(big?'<button class="rm-b" onclick="RMU.rack(0)">↩</button>':'')+`</div>`}
 else if(big)h+=`<div class="rm-bot"><button class="rm-b" onclick="RMU.rack(0)">↩ Vista normal</button></div>`;
 if(fin){const rows=G.ord.slice().sort((a,b)=>(b===G.win)-(a===G.win)||G.pts[a]-G.pts[b]).map(k=>`<tr class="${k===G.win?'w':''}"><td>${k===G.win?'🏆 ':''}${nm(k)}${G.out[k]?' <small>(se fue)</small>':''}</td><td>${G.racks[k].length} ${G.racks[k].length==1?'ficha':'fichas'}</td><td><b>${G.pts[k]}</b> pts</td></tr>`).join('');
  h+=`<div class="rm-fin"><div class="rm-big">${G.win==null?'Nadie ganó':G.win===m?'🏆 ¡Ganaste!':'🏆 Ganó '+nm(G.win)}</div><table>${rows}</table><div class="rm-s">Puntos que quedaron en mano (el comodín vale ${RU.JV}).</div>`
   +`<div class="rm-acts">${V.host?'<button class="rm-b pri" onclick="RMU.again()">🔁 Jugar otra vez</button>':'<span class="rm-s">El host puede empezar otra.</span>'}<button class="rm-b" onclick="leave()">🏠 Volver a la casa</button></div></div>`}
 if(menu)h+=`<div class="rm-menu"><div class="rm-mt">🀄 Rummy</div>${GM.rummy.rules}${window.RMS?`<button class="rm-b" onclick="RMU.radio()">📻 ${RMS.radioOn?'Apagar':'Prender'} la radio</button> `:''}${window.R3?`<button class="rm-b" onclick="RMU.mode()">${is3()?'Ver en 2D':'Ver en 3D'}</button>`:''}`
  +`<div class="rm-acts"><button class="rm-b" onclick="leave()">🚪 ${V.watch?'Dejar de mirar':'Salir de la sala'}</button><button class="rm-b" onclick="RMU.menu(0)">Cerrar</button></div></div>`;
 return h+'</div>'}
function ins(){const t=document.querySelector('.rm-top'),b=document.querySelector('.rm-bot');return {t:t?Math.round(t.getBoundingClientRect().bottom+6):0,b:b?Math.round(innerHeight-b.getBoundingClientRect().top+4):0}}
// ---- enganche con game.js ----
GM.rummy.body=function(){if(!active())return origBody();try{ok=true;return hud()}catch(e){console.warn('Rummy UI:',e);ok=false;return origBody()}};
GM.rummy.after=function(){if(!active()||!ok){off();return}
 if(!on){on=true;document.documentElement.classList.add('rmui');if(window.RMS)RMS.amb(true)}if(V!==lastV){lastV=V;dl=Date.now()+(V.G.left||0);fxSnd()}
 const s=stage();if(s!==R2)R2.show(false);if(window.R3&&s!==R3)R3.show(false);s.show(true);
 if(s!==R2&&!s.ok())return render();   // el 3D no pudo arrancar: queda el 2D
 s.layout(ins());s.sync(view())};
function off(){if(!on)return;on=false;document.documentElement.classList.remove('rmui');R2.cam('home');R2.show(false);if(window.R3)R3.show(false);menu=false;key='';order=[];sel=null;big=false;hist=[];logN=-1;aviso='';say='';lastF=-1;lastTn=null;if(window.RMS)RMS.amb(false)}
// reloj y narración sin volver a dibujar todo
setInterval(()=>{if(on&&!active())return off();if(!on)return;const G=V.G,c=document.getElementById('rmclk');
 if(c&&G.phase=='play'){const t=Math.max(0,dl-Date.now());c.style.width=(t/(G.o.t*10)).toFixed(1)+'%';c.className=t<10000?'w':''}
 const s=document.getElementById('rmsay'),x=txt();if(s&&s.textContent!==x){s.textContent=x;s.classList.toggle('on',!!x)}},200);
let rzT=0;addEventListener('resize',()=>{if(!on)return;clearTimeout(rzT);rzT=setTimeout(()=>{if(active())render()},120)});
addEventListener('keydown',e=>{if(!on)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()=='z'){e.preventDefault();RMU.undo()}else if(e.key=='Escape'){if(menu)RMU.menu(0);else if(sel!=null){sel=null;render()}}});
// ---- estilos ----
const css=document.createElement('style');css.textContent=`
html.rmui,html.rmui body{overflow:hidden;height:100%;overscroll-behavior:none}html.rmui body{background:#b9654a}
html.rmui #app{pointer-events:none;max-width:none;margin:0;padding:0}html.rmui #app>:not(.rm-hud){display:none!important}
.rm-hud{position:fixed;inset:0;z-index:2;pointer-events:none;color:#3a2412;font:15px/1.35 system-ui,sans-serif}
.rm-top{position:absolute;top:8px;left:50%;transform:translateX(-50%);display:flex;gap:10px;align-items:center;padding:6px 8px 7px 12px;border-radius:14px;background:rgba(255,246,230,.9);
 border:1px solid rgba(150,90,40,.25);box-shadow:0 3px 10px rgba(80,40,10,.2);pointer-events:auto;white-space:nowrap;max-width:calc(100% - 16px);overflow-x:auto;overflow-y:hidden;box-sizing:border-box}
.rm-ps{display:flex;gap:4px}.rm-p{padding:2px 8px;border-radius:999px;background:rgba(150,90,40,.12);font-size:13px}.rm-p b{font-weight:800;margin-left:2px}
.rm-p.t{background:#ffb300;box-shadow:0 0 0 2px rgba(255,179,0,.35)}.rm-p.o{opacity:.4;text-decoration:line-through}.rm-p.yo{font-weight:700}
.rm-ib{border:0;background:none;font-size:18px;cursor:pointer;padding:0 4px;color:inherit}
#rmclk{position:absolute;left:0;bottom:0;height:3px;width:100%;background:#2e8b57;transition:width .2s linear}#rmclk.w{background:#d63a2a}
.rm-say{position:absolute;top:58px;left:50%;transform:translateX(-50%);max-width:calc(100% - 32px);padding:5px 12px;border-radius:12px;background:rgba(58,36,18,.85);color:#fff6e6;font-size:14px;text-align:center;opacity:0;transition:opacity .3s}
.rm-say.on{opacity:1}
.rm-bot{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:6px;align-items:center;pointer-events:auto;max-width:calc(100% - 12px)}
.rm-b{border:0;border-radius:12px;padding:9px 14px;font:700 14px/1.15 system-ui,sans-serif;background:#fff6e6;color:#3a2412;box-shadow:0 2px 0 #c79a6a,0 3px 8px rgba(60,30,10,.25);cursor:pointer;white-space:nowrap}
.rm-b:disabled{opacity:.5;cursor:default}.rm-b.pri{background:#2e8b57;color:#fff;box-shadow:0 2px 0 #1d5e3a,0 3px 8px rgba(60,30,10,.25)}.rm-b small{display:block;font-size:10px;font-weight:600;opacity:.85}
.rm-baj{padding:6px 10px;border-radius:10px;background:rgba(255,246,230,.92);font:800 14px system-ui,sans-serif;color:#b03a2e}.rm-baj.ok{color:#2e8b57}
.rm-fin,.rm-menu{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(420px,calc(100% - 32px));max-height:calc(100% - 40px);overflow:auto;box-sizing:border-box;padding:18px;border-radius:18px;
 background:#fff6e6;box-shadow:0 10px 40px rgba(40,20,5,.45);pointer-events:auto;text-align:center}
.rm-big{font:800 22px system-ui,sans-serif;margin-bottom:10px}.rm-fin table{width:100%;border-collapse:collapse;margin:6px 0}
.rm-fin td{padding:6px 4px;border-bottom:1px solid rgba(150,90,40,.2);text-align:left}.rm-fin td:last-child{text-align:right}.rm-fin tr.w{background:rgba(255,179,0,.18)}
.rm-s{font-size:12px;opacity:.75;margin:4px 0}.rm-acts{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px}
.rm-menu details{text-align:left;font-size:14px;margin-bottom:10px}.rm-mt{font:800 18px system-ui,sans-serif;margin-bottom:8px}
@media (max-width:560px){.rm-b{padding:8px 9px;font-size:13px}.rm-top{gap:6px;font-size:14px}.rm-say{top:54px;font-size:13px}}`;
document.head.appendChild(css);
})();
