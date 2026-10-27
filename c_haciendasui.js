// Haciendas de Yucatán: interfaz del juego. Reusa el aspecto de Mérida (clases mu-* y temas de c_meridaui.js): barra de jugadores arriba,
// tarjeta de acciones con botón grande, pestañas (en c_haciendastabs.js), "¡Te toca!", recursos que flotan y aviso del reloj de 60 s.
// Envuelve GM.haciendas.body/after; NO cambia reglas ni servidor. El tablero lo dibuja c_haciendas2d.js (H2); lo válido se ilumina con HACD.spots.
(function(){
const D=window.HACD;if(typeof GM==='undefined'||!GM.haciendas||!D||!window.H2||!window.MRU){console.warn('Haciendas UI: falta c_haciendas.js, c_haciendas2d.js o c_meridaui.js');return}
const origBody=GM.haciendas.body,TK=['🐆','🦩','🦜','🐢','🦎','🦌'],IDLE=60000,WARN=15000;
const lsg=(k,d)=>{try{const x=localStorage.getItem(k);return x==null?d:x}catch(e){return d}},lss=(k,x)=>{try{localStorage.setItem(k,x)}catch(e){}};
// vista: 2D en celular y 3D en compu, salvo que la persona elija otra
let mode=lsg('hz_view',matchMedia('(pointer:coarse)').matches||Math.min(innerWidth,innerHeight)<600?'2d':'3d'),theme=lsg('hz_theme','claro')=='oscuro'?'oscuro':'claro',tab=null,menu=false,bm=null,pick=null,prev=null,keep={},on=false,ok=true,msgSeen='',msgT=0,ins={t:0,r:0,b:0,l:0},bMax=0,since=0,needK='',clkT=0;
const land=()=>innerWidth>innerHeight,wide=()=>innerWidth>=900&&innerHeight>=520||land()&&innerWidth>=600;
const active=()=>!!S&&!!V&&V.game==='haciendas'&&!!V.G&&(V.G.phase==='play'||V.G.phase==='final');
const me=()=>V.me,nm=k=>k>=0&&V.G.players[k]?esc(V.G.players[k].name):'',pc=k=>D.PCOL[k%D.PCOL.length];
const tok=(k,c='')=>`<span class="mu-tok ${c}" style="--pc:${pc(k)}">${TK[k%6]}</span>`;
const rc=(i,n,c='')=>`<span class="hz-rc r${i} ${c}" title="${D.RES[i]}">${D.ICO[i]}${n!=null?`<b>${n}</b>`:''}</span>`;
const chips=a=>a.map((x,i)=>x?rc(i,x):'').join('')||'<span class="mu-s">nada</span>';
const mine=()=>{const G=V.G,m=me();return m>=0&&G.res[m]?G.res[m]:null},has=c=>{const r=mine();return !!r&&c.every((x,i)=>r[i]>=x)};
const myTurn=()=>{const G=V.G;return G.phase=='play'&&me()>=0&&G.turn===me()&&!G.out[me()]};
const needers=G=>G.phase!='play'?[]:G.st=='discard'?Object.keys(G.dis||{}).map(Number):[G.turn];
const playable=()=>{const G=V.G,m=me();return myTurn()&&!G.played&&(G.st=='roll'||G.st=='main')?(G.dev[m]||[]).filter(c=>'gfcm'.includes(c.id)&&c.tc<G.tc):[]};
const offersToMe=()=>{const G=V.G,m=me();if(m<0||G.st!='main')return [];return G.offers.filter(o=>o.from!==m&&(o.from===G.turn?(o.to<0||o.to===m)&&!o.no.includes(m):m===G.turn))};
// ---- íconos y dados (los de Mérida, en chico) ----
const ic=d=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const SV={menu:ic('<path d="M4 7h16M4 12h16M4 17h16"/>'),x:ic('<path d="M6 6l12 12M18 6 6 18"/>'),home:ic('<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>'),
 zi:ic('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6"/>'),zo:ic('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M7.5 10.5h6"/>'),
 pl:ic('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.8 3.4-5.5 6.5-5.5s5.7 1.7 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M17 14c2.4 0 4 1.4 4.6 4.5"/>'),
 card:ic('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6"/>'),deal:ic('<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>'),log:ic('<path d="M6 3.5h12v17H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>'),rot:ic('<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 3v5h-5"/>')};
const is3=()=>mode=='3d'&&!!window.H3&&H3.ok(),stage=()=>is3()?window.H3:H2;
const PIPS={1:[[12,12]],2:[[7,7],[17,17]],3:[[6.5,6.5],[12,12],[17.5,17.5]],4:[[7,7],[17,7],[7,17],[17,17]],5:[[6.5,6.5],[17.5,6.5],[12,12],[6.5,17.5],[17.5,17.5]],6:[[7,6],[17,6],[7,12],[17,12],[7,18],[17,18]]};
const die=n=>`<svg class="mu-die" viewBox="0 0 24 24" aria-label="${n}"><rect x="1.2" y="1.2" width="21.6" height="21.6" rx="5"/>${(PIPS[n]||[]).map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.3"/>`).join('')}</svg>`;
const dice=()=>{const G=V.G;return G.dice[0]?`<div class="mu-dice" title="Sacó ${G.dice[0]+G.dice[1]}">${die(G.dice[0])}${die(G.dice[1])}</div>`:''};
// ---- lo que se ilumina en el tablero según el estado y lo que elegiste construir ----
function hl(){const G=V.G,m=me(),g=D.geo(G.bn);if(!myTurn())return {};
 if(G.st=='setup')return G.sv<0?{v:D.spots(G,m,'r')}:{e:D.spots(G,m,'s')};
 if(G.st=='road')return {e:D.spots(G,m,'s')};
 if(G.st=='move')return {h:G.hx.map((_,i)=>i).filter(i=>i!==G.hur&&!G.prot.some(p=>p.h===i))};
 if(bm=='prot')return {h:G.hx.map((_,i)=>i).filter(i=>i!==G.hur&&g.H[i].v.some(v=>G.vo[v]===m))};
 if(G.st=='main'&&bm&&bm!='c'){const L=D.spots(G,m,bm);return bm=='s'?{e:L}:{v:L}}return {}}
// ---- barra de arriba: jugadores con puntos y cartas (data-seat: ahí flotan recursos y tomates) ----
function topBar(){const G=V.G,m=me();
 return `<div class="mu-top"><div class="mu-tr1"><div class="mu-pls" id="mupls">${G.players.map((p,k)=>{const t=k===G.turn&&G.phase=='play';
  return `<button class="mu-pl${t?' on':''}${k===m?' me':''}${G.out[k]?' x':''}" data-seat="${k}" style="--pc:${pc(k)}" onclick="HZU.tab('jug')" aria-label="${esc(p.name)}: ${G.vp[k]} puntos">
   ${tok(k)}<span class="mu-pi"><span class="n">${esc(p.name)}${G.auto&&G.auto[k]?' 🤖':''}</span><b>★ ${G.vp[k]} · 🂠 ${G.nres[k]}${G.lr===k?' 🛤️':''}${G.ga===k?' 🛡️':''}</b></span>${k===m?'<em>TÚ</em>':''}</button>`}).join('')}</div></div>
  <div class="mu-cam"><button class="mu-cb mu-ib" onclick="HZU.menu(1)" aria-label="Opciones">${SV.menu}</button><span class="mu-sp"></span>
  <button class="mu-cb" onclick="HZU.mode()" aria-label="Cambiar a vista ${is3()?'2D':'3D'}"><b>${is3()?'2D':'3D'}</b></button><button class="mu-cb" onclick="HZU.cam('home')" aria-label="Recentrar">${SV.home}</button><button class="mu-cb" onclick="HZU.cam('zi')" aria-label="Acercar">${SV.zi}</button><button class="mu-cb" onclick="HZU.cam('zo')" aria-label="Alejar">${SV.zo}</button>${is3()?`<button class="mu-cb" onclick="HZU.cam('rr')" aria-label="Girar">${SV.rot}</button>`:''}</div></div>`}
// ---- tarjeta de acciones ----
const ST={setup:G=>G.sv<0?'pone su rancho':'pone su sacbé',roll:()=>'va a tirar los dados',main:()=>'comercia y construye',discard:G=>'huracán: esperando que descarten ('+Object.keys(G.dis||{}).length+')',
 move:()=>'mueve el huracán 🌀',steal:()=>'elige a quién robarle',road:()=>'pone sacbés gratis'};
function dock(){const G=V.G,m=me();
 if(G.phase=='final')return `<div class="mu-dk hi"><div class="mu-row"><span class="mu-big">🏆</span><div class="mu-f1"><b class="mu-h">${nm(G.win)} gana</b><div class="mu-s">${G.stall?'Nadie sumó puntos en 10 rondas: ganó quien tenía más.':'Llegó a '+G.vp[G.win]+' puntos en su turno.'}</div>
  <div class="mu-s">${G.players.map((_,k)=>tok(k,'xs')+' '+G.vp[k]).join(' · ')}</div></div></div><div class="mu-acts"><button class="mu-b" onclick="HZX.sum(1)">📊 Ver resumen</button></div>${V.host?`<button class="mu-b pri big" onclick="send({t:'reset'})">Otra partida</button>`:''}</div>`;
 const au=m>=0&&G.auto&&G.auto[m]?`<div class="mu-note">🤖 Un bot está jugando por ti. <button class="mu-lk" onclick="HZU.a({t:'back'})">Volver a jugar</button></div>`:'';
 if(G.st=='discard'&&G.dis&&G.dis[m]!=null)return au+discardDock();
 const o=offersToMe()[0];if(o)return au+offerDock(o);
 if(!myTurn())return `<div class="mu-dk">${au}<div class="mu-row">${tok(G.turn,'lg')}<div class="mu-f1"><div class="mu-s">Turno de</div><b class="mu-h">${nm(G.turn)}</b><div class="mu-s">${(ST[G.st]||(()=>''))(G)}</div></div>${dice()}</div>${clock()}</div>`;
 return `<div class="mu-dk hi">${au}${myDock()}${clock()}</div>`}
const row=(big,h,s)=>`<div class="mu-row"><span class="mu-big">${big}</span><div class="mu-f1"><b class="mu-h">${h}</b>${s?`<div class="mu-s">${s}</div>`:''}</div>${dice()}</div>`;
function myDock(){const G=V.G,m=me(),r=mine();
 if(G.st=='setup')return G.sv<0?row('🏠','Pon tu rancho',G.si>=G.players.length?'Este segundo rancho te da un recurso por cada terreno vecino.':'Toca una esquina iluminada: mira los números con más puntitos.')
  :row('🛤️','Pon tu sacbé','Toca una orilla iluminada junto a tu rancho nuevo.');
 if(G.st=='roll')return row('🎲','¡Tu turno!',playable().length?'Puedes jugar una carta antes de tirar.':'')+`<button class="mu-b pri big" onclick="HZU.a({t:'roll'})">🎲 Tirar dados</button>`
  +(playable().length?`<div class="mu-acts"><button class="mu-b" onclick="HZU.tab('cartas')">🃏 Jugar una carta</button></div>`:'');
 if(G.st=='move')return row('🌀','Manda el huracán','Toca un terreno iluminado: ahí no se producirá y le robas una carta a alguien de ahí.');
 if(G.st=='steal')return row('🌀','¿A quién le robas?','Se lleva una carta al azar.')+`<div class="mu-acts">${G.cand.map(k=>`<button class="mu-b big2" onclick="HZU.a({t:'steal',v:${k}})">${tok(k,'xs')} ${nm(k)} (${G.nres[k]})</button>`).join('')}</div>`;
 if(G.st=='road')return row('⛏️','Fajina: pon '+G.free+' sacbé'+(G.free>1?'s':'')+' gratis','Toca una orilla iluminada.')+`<div class="mu-acts"><button class="mu-b" onclick="HZU.a({t:'skip'})">Ya no</button></div>`;
 // main: construir y terminar
 const B=[['s','🛤️','Sacbé'],['r','🏠','Rancho'],['h','🏛️','Hacienda'],['c','🃏','Carta']].map(([w,i,n])=>{const okk=has(D.COST[w])&&(w=='c'?G.deck>0:D.spots(G,m,w).length>0);
  return `<button class="hz-bb${bm===w?' on':''}" onclick="HZU.bm('${w}')"${okk||bm===w?'':' disabled'}><span>${i} ${n}</span><span class="hz-cost">${chips(D.COST[w])}</span></button>`}).join('');
 return row('🌿','Tu turno',`<span class="hz-mine">${r.map((x,i)=>rc(i,x,x?'':'z')).join('')}</span>`)+`<div class="hz-bg">${B}</div>`
  +(bm&&bm!='c'?`<div class="mu-note">Toca un lugar iluminado en el tablero. <button class="mu-lk" onclick="HZU.bm(null)">Cancelar</button></div>`:'')
  +`<div class="mu-acts"><button class="mu-b" onclick="HZU.tab('com')">🤝 Comerciar</button>${playable().length?`<button class="mu-b" onclick="HZU.tab('cartas')">🃏 Cartas</button>`:''}</div>
  <button class="mu-b pri big" onclick="HZU.a({t:'end'})">Terminar turno ➜</button>`}
// descarte por huracán: contadores +/-
function discardDock(){const G=V.G,m=me(),n=G.dis[m],r=mine();keep.dis=keep.dis&&keep.dis.length==5?keep.dis:[0,0,0,0,0];const d=keep.dis,s=d.reduce((a,b)=>a+b,0);
 return `<div class="mu-dk hi">${row('🌀','Huracán: descarta '+n,'Tienes '+G.nres[m]+' cartas. Elige cuáles sueltas.')}
  <div class="hz-cnt">${r.map((x,i)=>`<div>${rc(i,x)}<button class="mu-b" onclick="HZU.dis(${i},-1)"${d[i]?'':' disabled'}>−</button><b>${d[i]}</b><button class="mu-b" onclick="HZU.dis(${i},1)"${d[i]<x&&s<n?'':' disabled'}>+</button></div>`).join('')}</div>
  <button class="mu-b pri big" onclick="HZU.a({t:'discard',r:[${d}]})"${s===n?'':' disabled'}>Descartar ${s} de ${n}</button>${clock()}</div>`}
function offerDock(o){const G=V.G,ok2=has(o.want);
 return `<div class="mu-dk hi"><div class="mu-row">${tok(o.from,'lg')}<div class="mu-f1"><b class="mu-h">${nm(o.from)} te ofrece</b><div class="hz-tr">${chips(o.give)}<span>por</span>${chips(o.want)}</div></div></div>
  <div class="mu-acts"><button class="mu-b ok big" onclick="HZU.a({t:'accept',id:${o.id}})"${ok2?'':' disabled'}>Aceptar</button><button class="mu-b big2" onclick="HZU.a({t:'reject',id:${o.id}})">No, gracias</button>
  <button class="mu-b" onclick="HZU.counter(${o.id})">Contraoferta</button></div>${ok2?'':'<div class="mu-s">No tienes lo que te pide.</div>'}</div>`}
// reloj: en los últimos 15 s avisa que un bot va a jugar por ti
function clock(){const G=V.G,m=me();if(m<0||G.phase!='play'||!needers(G).includes(m)||(G.auto&&G.auto[m]))return '';const left=IDLE-(Date.now()-since);
 return left<=WARN?`<div class="mu-note hz-clk">⏳ ${Math.max(0,Math.ceil(left/1000))} s: si no juegas, un bot jugará por ti.</div>`:''}
// ---- cartas que piden elegir algo (modal) ----
function pickBox(){const p=pick,G=V.G,res=(f,L)=>`<div class="hz-pk">${[0,1,2,3,4].map(i=>`<button class="mu-b${L&&L.includes(i)?' on':''}" onclick="${f}(${i})">${rc(i)} ${D.RES[i]}</button>`).join('')}</div>`;let h='';
 if(p.c=='g')h=`<div class="mu-acts"><button class="mu-b pri big" onclick="HZU.a({t:'dev',c:'g'})">🌀 Mover el huracán y robar</button><button class="mu-b big2" onclick="HZU.prot()">🛡️ Proteger uno de mis terrenos</button></div>`;
 if(p.c=='f')h=`<button class="mu-b pri big" onclick="HZU.a({t:'dev',c:'f'})">🛤️🛤️ Dos sacbés gratis</button><div class="mu-s">O un sacbé gratis y un recurso:</div>`+res('HZU.pf');
 if(p.c=='c')h=`<div class="mu-s">Elige dos recursos (${p.r.length}/2; puedes repetir):</div>`+res('HZU.pco',p.r)+`<div class="hz-tr">${p.r.map(i=>rc(i)).join('')}</div>`
  +`<button class="mu-b pri big" onclick="HZU.a({t:'dev',c:'c',r:[${p.r}]})"${p.r.length==2?'':' disabled'}>Tomar</button>`;
 if(p.c=='m')h=`<div class="mu-s">Cada rival te da hasta 2 del recurso que elijas:</div>`+res('HZU.pm');
 const c=D.DEV[p.c];return `<div class="mu-card"><header><b class="mu-h">${c.ico} ${c.nm}</b><button class="mu-x" onclick="HZU.pick(null)" aria-label="Cerrar">${SV.x}</button></header><div class="mu-s">${c.tx}</div>${h}</div>`}
function menuBox(){const seg=L=>`<div class="mu-seg">${L.map(([o,c,t])=>`<button class="${o?'on':''}" onclick="${c}">${t}</button>`).join('')}</div>`;
 return `<div class="mu-card mu-menu"><header><b class="mu-h">Opciones</b><button class="mu-x" onclick="HZU.menu(0)" aria-label="Cerrar">${SV.x}</button></header>
  <div class="mu-opt"><span>Vista</span>${seg([[is3(),"HZU.mode('3d')",'🎲 3D'],[!is3(),"HZU.mode('2d')",'🗺️ 2D']])}</div>
  <div class="mu-opt"><span>Tema</span>${seg([[theme=='claro',"HZU.theme('claro')",'☀️ Claro'],[theme=='oscuro',"HZU.theme('oscuro')",'🌙 Oscuro']])}</div>
  <div class="mu-opt"><span>Sonidos</span>${seg([[!mute,'mute=false;render()','🔊 Sí'],[mute,'mute=true;render()','🔇 No']])}</div>
  ${typeof musUI=='function'?`<div class="mu-opt"><span>Música</span>${musUI()}</div>`:''}
  <div class="mu-acts"><button class="mu-b" onclick="HZU.menu(0);HZX.guide(1)">📖 Cómo se juega</button><button class="mu-b" onclick="leave()">🚪 ${V.watch?'Dejar de mirar':'Salir de la sala'}</button></div></div>`}
// ---- pestañas (contenido en c_haciendastabs.js) ----
const TABS=[['jug','Jugadores','pl'],['cartas','Mis cartas','card'],['com','Comercio','deal'],['hist','Historial','log']];
const curTab=()=>wide()?tab||'jug':tab,playing=()=>me()>=0&&!V.G.out[me()];
function tabs(){const G=V.G,t=curTab(),bd={cartas:playable().length?'!':'',com:offersToMe().length?String(offersToMe().length):''};
 return `<nav class="mu-tabs">${TABS.filter(x=>playing()||x[0]=='jug'||x[0]=='hist').map(([k,n,i])=>`<button class="${t===k?'on':''}" onclick="HZU.tab('${k}')">${SV[i]}<span>${n}</span>${bd[k]?`<i>${bd[k]}</i>`:''}</button>`).join('')}</nav>`}
function sheet(){const t=curTab(),P=HZU.P||{},T={jug:'Jugadores',cartas:'Mis cartas',com:'Comercio',hist:'Historial'}[t];if(!T||!P[t])return '';
 return `<section class="mu-sheet"><header><b>${T}</b>${wide()?'':`<button class="mu-x" onclick="HZU.tab(null)" aria-label="Cerrar">${SV.x}</button>`}</header><div class="mu-sc" id="musc">${P[t]()}</div></section>`}
const modal=(h,close)=>`<div class="mu-modal" onclick="if(event.target===this)${close}"><div class="mu-mw">${h}</div></div>`;
function hud(){const w=wide();syncClock();if(msg!==msgSeen){msgSeen=msg;msgT=Date.now();if(msg)setTimeout(()=>{if(active())render()},4700)}
 const toast=msg&&Date.now()-msgT<4500?`<div class="mu-toast" onclick="msg='';render()">${esc(String(msg).replace(/^✋ No puedes hacer eso\. /,''))}</div>`:'';
 return `<div class="mu-hud${w?' wide':''}${land()?' land':''}">${online?'':'<div class="mu-off">⚠ Reconectando… tu lugar se conserva</div>'}${topBar()}
  <div class="mu-bot">${w?'':sheet()}<div class="mu-dockw" id="mudock">${dock()}${w?'':tabs()}</div>${w?tabs()+sheet():''}</div>${toast}
  ${pick&&myTurn()?modal(pickBox(),'HZU.pick(null)'):''}${menu?modal(menuBox(),'HZU.menu(0)'):''}${window.HZX?HZX.hud():''}</div>`}
// ---- espacio que le queda al tablero ----
function layout(){const t=document.querySelector('.mu-top'),dk=document.getElementById('mudock'),bt=document.querySelector('.mu-bot'),sh=document.querySelector('.mu-sheet'),w=wide(),rs=document.documentElement.style;
 let T=t?t.getBoundingClientRect().bottom:0,b=0,r=0,cb=0;if(w&&bt)r=innerWidth-bt.getBoundingClientRect().left;else if(dk){b=innerHeight-dk.getBoundingClientRect().top;cb=sh?b+sh.offsetHeight-14:b}
 if(!w)bMax=Math.max(bMax,b);const bs=w?0:Math.min(Math.max(b,bMax),innerHeight*.45);ins={t:T+6,r,b:bs+6,l:0};
 rs.setProperty('--mu-b',b+'px');rs.setProperty('--hz-tt',T+'px');rs.setProperty('--mu-cb',(cb||b)+'px');rs.setProperty('--mu-r',r+'px');
 const st=stage(),o=st===H2?window.H3:H2;if(o)o.show(false);
 try{st.show(true);st.theme(theme);st.layout(ins);st.sync(V.G,hl())}catch(e){console.warn('Haciendas tablero:',e);if(st!==H2){H3.fail();render()}}}
// ---- efectos: recursos que flotan, "¡Te toca!", ganador ----
function float(k,txt,dn){const el=document.querySelector(`.mu-pl[data-seat="${k}"]`);if(!el)return;const r=el.getBoundingClientRect(),f=document.createElement('div');
 f.className='mu-mf hz-mf '+(dn?'dn':'up');f.innerHTML=txt;f.style.left=Math.max(40,Math.min(innerWidth-40,r.left+r.width/2))+'px';f.style.top=(r.bottom+2)+'px';document.body.appendChild(f);setTimeout(()=>f.remove(),2200)}
function yourTurn(){const e=document.createElement('div');e.className='mu-yt';e.innerHTML=`<div>${tok(me(),'lg')}<b>¡Te toca!</b></div>`;e.style.cssText=`top:${ins.t}px;bottom:${ins.b}px;right:${ins.r}px`;
 document.body.appendChild(e);setTimeout(()=>e.remove(),1900);try{if(navigator.vibrate)navigator.vibrate([90,60,90])}catch(_){}}
function effects(){const G=V.G,m=me(),c={prn:G.prod?G.prod.rn:-1,sln:G.sl?G.sl.n:-1,tc:G.tc,turn:G.turn,ph:G.phase},p=prev;prev=c;if(!p)return;
 if(c.prn!==p.prn&&G.prod)G.prod.got.forEach((a,k)=>{if(a.some(x=>x))setTimeout(()=>float(k,a.map((x,i)=>x?'+'+x+D.ICO[i]:'').join(' ')),300)});
 if(c.sln!==p.sln&&G.sl&&G.sl.r!=null){const t=D.ICO[G.sl.r];float(G.sl.a,'+1'+t);float(G.sl.b,'−1'+t,1)}
 if(G.phase=='play'&&m>=0&&G.turn===m&&(p.turn!==m||p.tc!==G.tc)&&G.st!='setup'){bm=null;setTimeout(yourTurn,250)}
 if(p.ph=='play'&&G.phase=='final'){if(typeof sfx=='function')sfx('win');if(typeof banner=='function')banner('🏆 '+(G.win===m?'¡Ganaste!':V.G.players[G.win].name+' ganó'));if(typeof confetti=='function')confetti(G.win===m?90:35)}}
// el reloj se cuenta desde que te toca actuar o desde tu última jugada (como en el servidor)
function syncClock(){const G=V.G,k=G.tc+':'+G.st+':'+needers(G).includes(me());if(k!==needK){needK=k;since=Date.now()}}
function tickClock(){const G=V.G,m=me();clearTimeout(clkT);if(m<0||G.phase!='play'||!needers(G).includes(m))return;const left=IDLE-(Date.now()-since);if(left<-2000)return;
 clkT=setTimeout(()=>{if(active())render()},left>WARN?left-WARN+50:1000)}
// ---- acciones (las usan los botones y el tablero) ----
window.HZU={get me(){return me()},D,tok,rc,chips,nm,pc,has,mine,myTurn,playable,offersToMe,
 a:async m=>{sfx('tick');since=Date.now();const okk=await send(m);if(okk){bm=null;pick=null;keep.dis=null;if(m.t=='offer'||m.t=='accept')keep.trd=null}render();return okk},
 tap(kind,id){const G=V.G;if(!myTurn())return;
  if(G.st=='setup')return HZU.a(G.sv<0?{t:'build',w:'r',v:id}:{t:'build',w:'s',e:id});
  if(G.st=='road'&&kind=='e')return HZU.a({t:'build',w:'s',e:id});
  if(G.st=='move'&&kind=='h')return HZU.a({t:'move',h:id});
  if(bm=='prot'&&kind=='h')return HZU.a({t:'dev',c:'g',h:id});
  if(G.st=='main'&&bm)return HZU.a(bm=='s'?{t:'build',w:'s',e:id}:{t:'build',w:bm,v:id})},
 bm:w=>{if(w=='c')return HZU.a({t:'build',w:'c'});bm=bm===w?null:w;sfx('tick');render()},
 prot:()=>{pick=null;bm='prot';tab=wide()?tab:null;sfx('tick');render()},
 tab:t=>{tab=wide()?t||'jug':t&&t!==tab?t:null;keep.sc=0;sfx('tick');render()},
 menu:o=>{menu=!!o;sfx('tick');render()},
 theme:t=>{theme=t=='oscuro'?'oscuro':'claro';lss('hz_theme',theme);sfx('tick');render()},
 cam:c=>{stage().cam(c);sfx('tick')},
 mode:x=>{mode=x||(is3()?'2d':'3d');lss('hz_view',mode);menu=false;sfx('tick');render()},
 dis:(i,d)=>{keep.dis[i]=Math.max(0,keep.dis[i]+d);render()},
 pick:c=>{pick=c?{c,r:[]}:null;if(pick&&!wide())tab=null;sfx('tick');render()},
 pf:i=>HZU.a({t:'dev',c:'f',r:i}),pm:i=>HZU.a({t:'dev',c:'m',r:i}),pco:i=>{if(pick.r.length<2)pick.r.push(i);else pick.r=[i];render()},
 counter:id=>{const o=V.G.offers.find(x=>x.id===id);if(!o)return;keep.trd={give:o.want.slice(),want:o.give.slice(),to:-1,re:id};HZU.tab('com')},
 get keep(){return keep}};
// ---- enganche con game.js ----
GM.haciendas.body=function(){if(!active())return origBody();const sc=document.getElementById('musc');keep.sc=sc?sc.scrollTop:keep.sc;
 try{ok=true;return hud()}catch(e){console.warn('Haciendas UI:',e);ok=false;return origBody()}};
GM.haciendas.after=function(){if(!active()||!ok){off();return}
 on=true;const r=document.documentElement;r.classList.add('mrui');r.classList.toggle('mumodal',!!pick||menu||!!(window.HZX&&HZX.open()));r.dataset.mrt=theme=='oscuro'?'oscuro':'menta';
 const sc=document.getElementById('musc');if(sc&&keep.sc)sc.scrollTop=keep.sc;
 const st=V.G.st;if(!myTurn()||(bm=='prot'?V.G.played||(st!='roll'&&st!='main'):st!='main'))bm=null;   // el modo de construir se apaga solo
 tickClock();layout();effects();if(window.HZX)HZX.after(V.G,me())};
function off(){if(!on)return;on=false;document.documentElement.classList.remove('mrui','mumodal');H2.show(false);if(window.H3)H3.show(false);if(window.HZX)HZX.reset();prev=null;tab=null;menu=false;bm=null;pick=null}
setInterval(()=>{if(on&&!active())off()},400);
let rzT=0;addEventListener('resize',()=>{if(!on)return;clearTimeout(rzT);rzT=setTimeout(()=>{bMax=0;if(active())render()},120)});
// ---- estilos propios (lo demás viene de c_meridaui.js) ----
const css=document.createElement('style');css.textContent=`
.hz-rc{display:inline-flex;align-items:center;gap:2px;padding:1px 6px;margin:1px;border-radius:999px;background:var(--mu-soft);font-size:15px;line-height:1.4;white-space:nowrap}
.hz-rc b{font-size:13px;font-weight:800}.hz-rc.z{opacity:.4}.hz-mine{display:inline-flex;flex-wrap:wrap}
.hz-bg{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0}
.hz-bb{display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 3px;border-radius:12px;border:2px solid var(--mu-line);background:var(--mu-card2);color:var(--mu-ink);font:700 13px/1.2 inherit;cursor:pointer}
.hz-bb:disabled{opacity:.42;cursor:default}.hz-bb.on{border-color:#ffb300;box-shadow:0 0 0 3px rgba(255,179,0,.35)}.hz-cost{display:flex;flex-wrap:wrap;justify-content:center}.hz-cost .hz-rc{font-size:12px;padding:0 4px}
.hz-cnt{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin:6px 0}.hz-cnt>div{display:flex;flex-direction:column;align-items:center;gap:2px}.hz-cnt .mu-b{min-height:30px;padding:0 10px;margin:0}
.hz-tr{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:3px 0}.hz-tr>span{font-size:12px;opacity:.75}
.hz-pk{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.hz-pk .mu-b{flex:1 1 30%}.hz-clk{background:#fff3cd;color:#5c4400}
.hz-mf{font-size:18px}`;
document.head.appendChild(css);
})();
