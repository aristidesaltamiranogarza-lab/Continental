// Mérida en Venta: interfaz del juego (igual en 2D y 3D). Barra de jugadores arriba; acciones y pestañas abajo (a la derecha en compu);
// título de propiedad al tocar una casilla, cartas que se voltean, dinero que flota, "¡Te toca!" y temas del tablero (Menta y Oscuro).
// Envuelve GM.merida.body/after; NO cambia reglas ni servidor. El tablero lo dibuja c_merida3d.js (M3) o c_merida2d.js (M2):
// aquí se elige cuál se ve y cuánto espacio le deja la interfaz (ins). Ambos tienen: ok, show, layout, theme, follow, sync, cam, look.
(function(){
if(typeof GM==='undefined'||!GM.merida||!window.MR){console.warn('Mérida UI: falta c_merida.js');return}
const D=MR.D,B=MR.B,GR=MR.GR,$m=MR.$m,pc=MR.pc,tk=MR.tk,origBody=GM.merida.body,origAfter=GM.merida.after;
const lsg=(k,d)=>{try{const x=localStorage.getItem(k);return x==null?d:x}catch(e){return d}},lss=(k,x)=>{try{localStorage.setItem(k,x)}catch(e){}};
let theme=lsg('mr_theme','menta')=='oscuro'?'oscuro':'menta',mode=lsg('merida_3d','1')==='0'?'2d':'3d',follow=lsg('mr_follow','1')!=='0',topv=false;
let tab=null,menu=false,sel=-1,prev=null,keep={},on=false,ok=true,msgSeen='',msgT=0,hintT=0,TR={to:-1,ap:[],bp:[],ac:0,bc:0,aj:0,bj:0},ins={t:0,r:0,b:0,l:0},bMax=0;
const ICO={go:'⬅️',jail:'🔒',free:'🏖️',gtj:'👮',s:'❓',c:'🎁',tax:'🧾',r:'🚌'},UI={CFE:'⚡',JAPAY:'💧'},icon=s=>s.t=='u'?UI[s.n]||'💡':ICO[s.t]||'';
// panel a la derecha en compu y en celular acostado; abajo en celular parado
const land=()=>innerWidth>innerHeight,wide=()=>innerWidth>=900&&innerHeight>=520||land()&&innerWidth>=600;
const active=()=>!!S&&!!V&&V.game==='merida'&&!!V.G&&(V.G.phase==='play'||V.G.phase==='final');
const me=()=>V.me,nm=k=>k>=0&&V.G.players[k]?esc(V.G.players[k].name):'el banco',alive=G=>G.players.map((_,k)=>k).filter(k=>!G.bk[k]);
const col=i=>B[i].t=='p'?D.gcol[B[i].g]:'#9aa59f',full=(g,o)=>GR[g].every(j=>V.G.own[j]===o);
const lum=h=>{const n=parseInt(h.slice(1),16);return ((n>>16&255)*299+(n>>8&255)*587+(n&255)*114)/1000},onCol=h=>lum(h)>165?'#18201b':'#fff';
const tok=(k,c='')=>`<span class="mu-tok ${c}" style="--pc:${pc(k)}">${tk(k)}</span>`;
if(!document.getElementById('mufont')){const l=document.createElement('link');l.id='mufont';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&display=swap';document.head.appendChild(l)}
// ---- íconos (trazos simples que toman el color del botón) y dados ----
const ic=d=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const SV={menu:ic('<path d="M4 7h16M4 12h16M4 17h16"/>'),x:ic('<path d="M6 6l12 12M18 6 6 18"/>'),
 home:ic('<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>'),
 top:ic('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 4v16"/>'),rot:ic('<path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 3v5h-5"/>'),
 follow:ic('<circle cx="12" cy="12" r="6"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><path d="M12 9l2.6 4.6H9.4z" fill="currentColor"/>'),
 zi:ic('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6"/>'),zo:ic('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M7.5 10.5h6"/>'),
 pl:ic('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.8 3.4-5.5 6.5-5.5s5.7 1.7 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M17 14c2.4 0 4 1.4 4.6 4.5"/>'),
 house:ic('<path d="M3 11 12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>'),deal:ic('<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>'),
 log:ic('<path d="M6 3.5h12v17H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>')};
const PIPS={1:[[12,12]],2:[[7,7],[17,17]],3:[[6.5,6.5],[12,12],[17.5,17.5]],4:[[7,7],[17,7],[7,17],[17,17]],5:[[6.5,6.5],[17.5,6.5],[12,12],[6.5,17.5],[17.5,17.5]],6:[[7,6],[17,6],[7,12],[17,12],[7,18],[17,18]]};
const die=n=>`<svg class="mu-die" viewBox="0 0 24 24" aria-label="${n}"><rect x="1.2" y="1.2" width="21.6" height="21.6" rx="5"/>${(PIPS[n]||[]).map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.3"${n==1?' class="r"':''}/>`).join('')}</svg>`;
const dice=()=>{const G=V.G;return G.dice[0]?`<div class="mu-dice" title="Sacó ${G.dice[0]+G.dice[1]}">${die(G.dice[0])}${die(G.dice[1])}</div>`:''};
const mini=i=>{const s=B[i];return `<span class="mu-mini${s.t=='p'?'':' ic'}" style="--gc:${s.t=='p'?D.gcol[s.g]:'transparent'}">${s.t=='p'?'':icon(s)}</span>`};
const chipSq=q=>`<button class="mu-chip" style="--gc:${col(q)}" onclick="MRU.sel(${q})"><i></i>${esc(B[q].n)}${V.G.hs[q]?' 🏠':''}</button>`;
// ---- qué puedo hacer ----
const canAct=()=>{const G=V.G,m=me();if(m<0||G.bk[m]||G.auc||G.phase!='play')return false;return G.debts.length?G.debts[0].k===m:G.turn===m};
function buildable(i){const G=V.G,m=me(),s=B[i];if(s.t!='p'||G.own[i]!==m||G.hs[i]>=5)return false;const g=GR[s.g];
 if(!full(s.g,m)||g.some(j=>G.mg[j]))return false;if(G.o.even&&G.hs[i]>Math.min(...g.map(j=>G.hs[j])))return false;return G.cash[m]>=D.hc[s.g]}
const canBuild=()=>canAct()&&V.G.own.some((o,i)=>o===me()&&buildable(i));
// ---- barra de arriba: jugadores (data-seat: ahí llegan los tomates) y menú ----
function topBar(){const G=V.G,m=me();
 return `<div class="mu-top"><div class="mu-tr1"><div class="mu-pls" id="mupls">${G.players.map((p,k)=>{const t=k===G.turn&&G.phase=='play';
  return `<button class="mu-pl${t?' on':''}${k===m?' me':''}${G.bk[k]?' x':''}" data-seat="${k}" style="--pc:${pc(k)}" onclick="MRU.look(${k})" aria-label="${esc(p.name)}: ${G.bk[k]?'quebró':$m(G.cash[k])}">
   ${tok(k)}<span class="mu-pi"><span class="n">${esc(p.name)}${G.jail[k]?' 🔒':''}</span><b>${G.bk[k]?'Quebró':$m(G.cash[k])}</b></span>${k===m?'<em>TÚ</em>':''}</button>`}).join('')}</div>
  </div>${camBar()}</div>`}
function camBar(){const m3=stageName()=='3d',b=(c,t,h,o)=>`<button class="mu-cb${o?' on':''}" onclick="${c}" title="${t}" aria-label="${t}">${h}</button>`;
 return `<div class="mu-cam"><button class="mu-cb mu-ib" onclick="MRU.menu(1)" aria-label="Opciones" title="Opciones">${SV.menu}</button><span class="mu-sp"></span>${b('MRU.mode()','Cambiar a vista '+(m3?'2D':'3D'),`<b>${m3?'2D':'3D'}</b>`)}${b("MRU.cam('home')",'Recentrar',SV.home)}`+
  (m3?b("MRU.cam('top')",'Vista desde arriba',SV.top,topv)+b('MRU.follow()','Seguir la ficha que se mueve',SV.follow,follow)+b("MRU.cam('rr')",'Girar',SV.rot)
   :b("MRU.cam('zi')",'Acercar',SV.zi)+b("MRU.cam('zo')",'Alejar',SV.zo)+b('MRU.follow()','Seguir la ficha que se mueve',SV.follow,follow))+'</div>'}
// ---- tarjeta de acciones (siempre a la vista) ----
function dock(){const G=V.G,m=me(),T=G.trade;
 if(G.phase=='final')return `<div class="mu-dk hi"><div class="mu-row"><span class="mu-big">🏆</span><div class="mu-f1"><b class="mu-h">${G.win>=0?nm(G.win)+' gana':'Se acabó'}</b><div class="mu-s">${G.win===m?'¡Eres el último en pie! 🎉':'Fue el último que no quebró.'}</div></div></div>${V.host?`<button class="mu-b pri big" onclick="send({t:'reset'})">Otra partida</button>`:''}</div>`;
 if(G.auc)return aucDock();if(G.debts.length)return debtDock();if(T&&T.b===m)return tradeCard(1);
 if(G.turn!==m||m<0||G.bk[m])return waitDock();return myDock()}
function waitDock(){const G=V.G,k=G.turn,s=B[G.pos[k]],T=G.trade,m=me();
 const st=G.jail[k]&&G.st=='roll'?'está en la cárcel 🔒':G.st=='roll'?(G.again?'sacó dobles: tira otra vez':'va a tirar los dados'):G.st=='buy'?`decide si compra <b>${esc(s.n)}</b> (${$m(s.p)})`:'está terminando su turno';
 return `<div class="mu-dk"><div class="mu-row">${tok(k,'lg')}<div class="mu-f1"><div class="mu-s">Turno de</div><b class="mu-h">${nm(k)}</b><div class="mu-s">${st}</div></div>${dice()}</div>
  ${T&&T.a===m?`<div class="mu-note">🤝 Le ofreciste un trato a ${nm(T.b)}. <button class="mu-lk" onclick="MRU.tab('trato')">Ver</button></div>`:''}</div>`}
function myDock(){const G=V.G,m=me(),q=G.pos[m],s=B[q],where=`<div class="mu-s">Estás en <b>${esc(s.n)}</b></div>`;let h;
 if(G.st=='roll'&&G.jail[m])h=`<div class="mu-row"><span class="mu-big">🔒</span><div class="mu-f1"><b class="mu-h">Estás en la cárcel</b><div class="mu-s">Intento ${G.jail[m]} de 3: saca dobles para salir</div></div>${dice()}</div>
  <button class="mu-b pri big" onclick="MRU.a('roll')">🎲 Tirar por dobles</button><div class="mu-acts"><button class="mu-b" onclick="MRU.a('bail')"${G.cash[m]<D.bail?' disabled':''}>Pagar fianza ${$m(D.bail)}</button>${G.jf[m]?`<button class="mu-b" onclick="MRU.a('jcard')">🗝️ Usar tarjeta</button>`:''}</div>`;
 else if(G.st=='roll')h=`<div class="mu-row"><div class="mu-f1"><b class="mu-h">¡Tu turno!</b>${G.again?'<div class="mu-s">Sacaste dobles: tira otra vez</div>':where}</div>${dice()}</div><button class="mu-b pri big" onclick="MRU.a('roll')">🎲 ${G.again?'Tirar otra vez':'Tirar dados'}</button>`;
 else if(G.st=='buy')h=`<div class="mu-row mu-tap" onclick="MRU.sel(${q})">${mini(q)}<div class="mu-f1"><div class="mu-s">Caíste en</div><b class="mu-h">${esc(s.n)}</b><div class="mu-s">Tienes ${$m(G.cash[m])} · <u>ver rentas</u></div></div>${dice()}</div>
  <div class="mu-acts"><button class="mu-b ok big" onclick="MRU.a('buy')"${G.cash[m]<s.p?' disabled':''}>Comprar ${$m(s.p)}</button><button class="mu-b big2" onclick="MRU.a('nobuy')">${G.o.auc?'Subastar':'No comprar'}</button></div>`;
 else h=`<div class="mu-row"><div class="mu-f1"><b class="mu-h">Tu turno</b>${where}<div class="mu-s">${canBuild()?'Ya puedes construir: <button class="mu-lk" onclick="MRU.tab(\'mias\')">ver mis propiedades</button>':'Puedes hacer un trato antes de terminar.'}</div></div>${dice()}</div><button class="mu-b pri big" onclick="MRU.a('end')">Terminar turno ➜</button>`;
 return `<div class="mu-dk hi">${h}</div>`}
function aucDock(){const G=V.G,a=G.auc,m=me(),s=B[a.sq],inn=a.in.includes(m),cash=G.cash[m]||0;
 const bt=d=>{const v=a.bid+d;return `<button class="mu-b${d==10?' pri':''}" onclick="MR.bid(${v})"${v>cash?' disabled':''}>+${d}<small>${$m(v)}</small></button>`};
 return `<div class="mu-dk hi"><div class="mu-row mu-tap" onclick="MRU.sel(${a.sq})">${mini(a.sq)}<div class="mu-f1"><div class="mu-s">🔨 Subasta · vale ${$m(s.p)}</div><b class="mu-h">${esc(s.n)}</b>
  <div class="mu-s">${a.hi>=0?`Va ganando ${nm(a.hi)} con <b>${$m(a.bid)}</b>`:'Nadie ha ofrecido'}</div></div><div class="mu-clock"><b id="mraT">${Math.ceil(a.left/1000)}</b><small>seg</small></div></div>
  ${inn?`<div class="mu-acts four">${[1,10,50,100].map(bt).join('')}</div><div class="mu-acts"><input id="mubv" class="mu-in" type="number" inputmode="numeric" min="${a.bid+1}" max="${cash}" placeholder="Otra cantidad"><button class="mu-b" onclick="MR.bid(+document.getElementById('mubv').value)">Ofrecer</button><button class="mu-b" onclick="MRU.a('apass')">Me retiro</button></div>`
   :`<div class="mu-s">${m>=0?'Ya te retiraste.':'Estás mirando.'} Siguen: ${a.in.map(nm).join(', ')||'nadie'}</div>`}</div>`}
function debtDock(){const G=V.G,d=G.debts[0],m=me();
 if(d.k!==m)return `<div class="mu-dk"><div class="mu-row"><span class="mu-big">💸</span><div class="mu-f1"><b class="mu-h">${nm(d.k)} debe ${$m(d.amt)}</b><div class="mu-s">a ${nm(d.to)} · está juntando el dinero…</div></div></div></div>`;
 const f=G.cash[m]<d.amt;
 return `<div class="mu-dk hi bad"><div class="mu-row"><span class="mu-big">💸</span><div class="mu-f1"><b class="mu-h">Debes ${$m(d.amt)} a ${nm(d.to)}</b><div class="mu-s">Tienes ${$m(G.cash[m])}${f?` · te faltan <b>${$m(d.amt-G.cash[m])}</b>. Vende casas${G.o.mort?', hipoteca':''} o haz un trato.`:''}</div></div></div>
  <div class="mu-acts"><button class="mu-b ok" onclick="MRU.a('paydebt')"${f?' disabled':''}>Pagar</button><button class="mu-b" onclick="MRU.tab('mias')">Mis propiedades</button><button class="mu-b" onclick="if(confirm('¿Declararte en quiebra? Pierdes la partida.'))MRU.a('broke')">Quiebra</button></div></div>`}
function tradeSide(c,L,j){return [c?`<span class="mu-chip money">${$m(c)}</span>`:'',...L.map(chipSq),j?`<span class="mu-chip">🗝️ ×${j}</span>`:''].filter(Boolean).join('')||'<span class="mu-s">nada</span>'}
function tradeCard(dk){const G=V.G,T=G.trade,m=me();if(!T)return '';const mine=T.a===m,forMe=T.b===m;
 if(!mine&&!forMe)return `<div class="mu-card"><div class="mu-s">🤝 ${nm(T.a)} le ofreció un trato a ${nm(T.b)}.</div></div>`;
 return `<div class="${dk?'mu-dk':'mu-card'} hi"><b class="mu-h">🤝 ${mine?'Tu oferta a '+nm(T.b):nm(T.a)+' te ofrece un trato'}</b>
  <div class="mu-trd"><div><div class="mu-s">${mine?'Das':nm(T.a)+' da'}</div>${tradeSide(T.ac,T.ap,T.aj)}</div><div><div class="mu-s">${mine?'Pides':'Te pide'}</div>${tradeSide(T.bc,T.bp,T.bj)}</div></div>
  <div class="mu-acts">${forMe?`<button class="mu-b ok" onclick="MRU.a('tyes')">Aceptar</button><button class="mu-b" onclick="MRU.a('tno')">Rechazar</button>`:`<button class="mu-b" onclick="MRU.a('tno')">Retirar oferta</button>`}</div></div>`}
// ---- pestañas: jugadores, mis propiedades, tratos, historial ----
const TABS=[['jug','Jugadores','pl'],['mias','Mías','house'],['trato','Tratos','deal'],['hist','Historial','log']];
const curTab=()=>wide()?tab||'jug':tab,playing=()=>me()>=0&&!V.G.bk[me()];
function tabs(){const G=V.G,t=curTab(),bd={mias:canBuild()?'🏠':'',trato:G.trade&&G.trade.b===me()?'1':''};
 return `<nav class="mu-tabs">${TABS.filter(x=>playing()||x[0]=='jug'||x[0]=='hist').map(([k,n,i])=>`<button class="${t===k?'on':''}" onclick="MRU.tab('${k}')">${SV[i]}<span>${n}</span>${bd[k]?`<i>${bd[k]}</i>`:''}</button>`).join('')}</nav>`}
function sheet(){const t=curTab(),T={jug:['Jugadores',pJug],mias:['Mis propiedades',pMias],trato:['Tratos',pTrato],hist:['Historial',pHist]}[t];if(!T)return '';
 return `<section class="mu-sheet"><header><b>${T[0]}</b>${wide()?'':`<button class="mu-x" onclick="MRU.tab(null)" aria-label="Cerrar">${SV.x}</button>`}</header><div class="mu-sc" id="musc">${T[1]()}</div></section>`}
function pJug(){const G=V.G;return G.players.map((p,k)=>{const L=G.own.map((o,i)=>o===k?i:-1).filter(i=>i>=0),t=k===G.turn&&G.phase=='play';
 return `<div class="mu-prow${t?' on':''}${G.bk[k]?' x':''}" style="--pc:${pc(k)}">${tok(k,'lg')}<div class="mu-f1"><b>${esc(p.name)}${k===me()?' <em class="mu-tu">TÚ</em>':''}</b>
  <div class="mu-s">${G.bk[k]?'Quebró':esc(D.tok[k%6][0])+' · en '+esc(B[G.pos[k]].n)}${G.jail[k]?' · 🔒 en la cárcel':''}${G.jf[k]?' · 🗝️×'+G.jf[k]:''}</div>
  ${L.length?`<div class="mu-own">${L.map(i=>`<i style="--gc:${col(i)}" title="${esc(B[i].n)}" onclick="MRU.sel(${i})">${G.hs[i]?(G.hs[i]==5?'H':G.hs[i]):''}</i>`).join('')}</div>`:''}</div><b class="mu-cash">${G.bk[k]?'—':$m(G.cash[k])}</b></div>`}).join('')
 +(typeof plist=='function'?`<details class="mu-det"><summary>Sala y espectadores</summary>${plist()}</details>`:'')}
function pMias(){const G=V.G,m=me(),L=G.own.map((o,i)=>o===m?i:-1).filter(i=>i>=0);
 if(!L.length)return `<div class="mu-empty"><span>🏘️</span><b>Aún no tienes propiedades</b>Cuando caigas en una casilla sin dueño, la puedes comprar.</div>`;
 const grp={};L.forEach(i=>{const s=B[i],key=s.t=='p'?'g'+s.g:s.t;(grp[key]=grp[key]||[]).push(i)});
 return Object.keys(grp).map(key=>{const L2=grp[key],s0=B[L2[0]];let hd;
  if(s0.t=='p'){const g=GR[s0.g],n=g.filter(j=>G.own[j]===m).length;hd=`<header style="--gc:${D.gcol[s0.g]}"><i></i><b>${n} de ${g.length}</b><span>${n==g.length?'¡Grupo completo! Puedes construir':'Te '+(g.length-n>1?'faltan '+(g.length-n):'falta 1')+' para construir'}</span><small>Casa ${$m(D.hc[s0.g])}</small></header>`}
  else hd=`<header><b>${s0.t=='r'?'🚌 Va y Ven':'💡 Servicios'}</b><span>${L2.length} de ${s0.t=='r'?4:2}</span></header>`;
  return `<div class="mu-grp">${hd}${L2.map(i=>{const s=B[i],h=G.hs[i];return `<div class="mu-prop" onclick="MRU.sel(${i})"><b>${esc(s.n)}</b><span>${h==5?'🏨 Hotel':h?'🏠'.repeat(h):''}${G.mg[i]?' <em>hipotecada</em>':''}</span>${buildable(i)&&canAct()?`<button class="mu-b sm ok" onclick="event.stopPropagation();MRU.a('build',${i})">＋🏠 ${$m(D.hc[s.g])}</button>`:''}</div>`}).join('')}</div>`}).join('')}
function pTrato(){const G=V.G,m=me(),h=G.trade?tradeCard(0):'';
 if(!playing()||G.phase!='play')return h||'<div class="mu-empty">Sin tratos.</div>';
 if(G.trade)return h+'<div class="mu-s mu-pad">Cuando se resuelva este trato podrás proponer otro.</div>';
 const ot=alive(G).filter(k=>k!==m);if(!ot.length)return '';if(!ot.includes(TR.to))TR.to=ot[0];
 const props=k=>G.own.map((o,i)=>o===k?i:-1).filter(i=>i>=0);
 const chips=(k,key)=>props(k).map(i=>`<button class="mu-chip${TR[key].includes(i)?' on':''}" style="--gc:${col(i)}" onclick="MRU.tg('${key}',${i})"><i></i>${esc(B[i].n)}${G.hs[i]?' 🏠':''}</button>`).join('')||'<span class="mu-s">Sin propiedades</span>';
 const num=(key,max,lb)=>`<label class="mu-num">${lb}<input id="mut_${key}" class="mu-in" type="number" inputmode="numeric" min="0" max="${max}" value="${TR[key]||''}" placeholder="0" oninput="MRU.n('${key}',this.value)"></label>`;
 return `<div class="mu-card"><div class="mu-s">Con quién:</div><div class="mu-who">${ot.map(k=>`<button class="mu-chip pl${k===TR.to?' on':''}" style="--pc:${pc(k)}" onclick="MRU.to(${k})">${tk(k)} ${nm(k)}</button>`).join('')}</div>
  <div class="mu-tside"><b>Tú das</b><div>${chips(m,'ap')}</div><div class="mu-row">${num('ac',G.cash[m],'$')}${G.jf[m]?num('aj',G.jf[m],'🗝️'):''}</div></div>
  <div class="mu-tside"><b>Tú pides</b><div>${chips(TR.to,'bp')}</div><div class="mu-row">${num('bc',G.cash[TR.to],'$')}${G.jf[TR.to]?num('bj',G.jf[TR.to],'🗝️'):''}</div></div>
  <button class="mu-b pri big" onclick="MRU.offer()">Ofrecer trato</button></div>`}
function pHist(){const G=V.G;
 return `<div class="mu-log">${(G.log||[]).slice().reverse().map(e=>`<div>${e.k>=0?tok(e.k,'xs'):'<span class="mu-tok xs bank">🏦</span>'}<span>${e.k>=0?`<b>${nm(e.k)}</b> `:''}${esc(e.t)}</span></div>`).join('')}</div>
  <details class="mu-det"><summary>Reglas</summary>${String(GM.merida.rules||'').replace(/<\/?details>|<summary>[^<]*<\/summary>/g,'')}</details>`}
// ---- título de propiedad (tocar una casilla) ----
function deed(i){const G=V.G,s=B[i],o=G.own[i],h=G.hs[i],m=me();let head,body='',foot='';
 if(s.t=='p'){const c=D.gcol[s.g];head=`<div class="mu-dh" style="background:${c};color:${onCol(c)}"><small>Título de propiedad</small><b>${esc(s.n)}</b></div>`;
  const rows=[['Renta',s.r[0]]];if(G.o.dbl)rows.push(['Con todo el grupo',s.r[0]*2]);[1,2,3,4].forEach(n=>rows.push(['Con '+n+' casa'+(n>1?'s':''),s.r[n]]));rows.push(['Con HOTEL',s.r[5]]);
  const cur=o<0?-1:h?(G.o.dbl?h+1:h):(G.o.dbl&&full(s.g,o)?1:0);
  body=`<table>${rows.map((r,j)=>`<tr${j===cur?' class="cur"':''}><td>${r[0]}</td><td>${$m(r[1])}</td></tr>`).join('')}</table>`;
  foot=`<div class="mu-df">Cada casa cuesta ${$m(D.hc[s.g])}. El hotel: 4 casas más ${$m(D.hc[s.g])}.${G.o.mort?'<br>Hipoteca: '+$m(s.p/2):''}</div>`}
 else if(s.t=='r'){const n=o>=0?B.reduce((a,x,j)=>a+(x.t=='r'&&G.own[j]===o?1:0),0):0;head=`<div class="mu-dh pl"><span>🚌</span><b>${esc(s.n)}</b><small>Va y Ven</small></div>`;
  body=`<table>${[1,2,3,4].map(k=>`<tr${k===n?' class="cur"':''}><td>Con ${k} ruta${k>1?'s':''}</td><td>${$m(25*2**(k-1))}</td></tr>`).join('')}</table>`;if(G.o.mort)foot=`<div class="mu-df">Hipoteca: ${$m(s.p/2)}</div>`}
 else if(s.t=='u'){head=`<div class="mu-dh pl"><span>${icon(s)}</span><b>${esc(s.n)}</b><small>Servicio</small></div>`;
  body=`<p>Si alguien cae aquí, paga <b>4 veces</b> lo que sacó en los dados.</p><p>Si el dueño tiene <b>CFE y JAPAY</b>, paga <b>10 veces</b>.</p>`;if(G.o.mort)foot=`<div class="mu-df">Hipoteca: ${$m(s.p/2)}</div>`}
 else{const T={go:'Cobras '+$m(D.go)+' cada vez que pasas por aquí.',jail:'Si solo caes aquí, vienes de visita.',free:'Descanso en la playa.'+(G.o.pot?' Te llevas el bote: '+$m(G.pot)+'.':''),gtj:'Te vas directo a la cárcel, sin pasar por la Salida.',s:'Saca una carta de Suerte.',c:'Saca una carta de Comunidad.',tax:'Pagas '+$m(s.v)+' al banco.'};
  head=`<div class="mu-dh pl"><span>${icon(s)}</span><b>${esc(s.n)}</b>${s.s?`<small>${esc(s.s)}</small>`:''}</div>`;body=`<p>${T[s.t]||''}</p>`}
 const here=G.players.map((_,k)=>k).filter(k=>!G.bk[k]&&G.pos[k]===i);
 let own=s.p?`<div class="mu-down">${o>=0?`${tok(o,'xs')} Dueño: <b>${nm(o)}</b>${h?' · '+(h==5?'hotel':h+(h>1?' casas':' casa')):''}${G.mg[i]?' · <em>hipotecada</em>':''}`:`Sin dueño · cuesta <b>${$m(s.p)}</b>`}</div>`:'';
 if(here.length)own+=`<div class="mu-down">Aquí está${here.length>1?'n':''}: ${here.map(k=>tok(k,'xs')+' '+nm(k)).join(', ')}</div>`;
 let act='';if(o===m&&m>=0&&G.phase=='play'){const okk=canAct(),hc=s.t=='p'?D.hc[s.g]:0,b=[];
  if(s.t=='p'){b.push(`<button class="mu-b ok" onclick="MRU.a('build',${i})"${!okk||!buildable(i)?' disabled':''}>🏠 ${h==4?'Poner hotel':'Construir'} ${$m(hc)}</button>`);if(h)b.push(`<button class="mu-b" onclick="MRU.a('sell',${i})"${okk?'':' disabled'}>Vender ${h==5?'hotel':'casa'} +${$m(hc/2)}</button>`)}
  if(G.o.mort)b.push(G.mg[i]?`<button class="mu-b" onclick="MRU.a('unm',${i})"${okk?'':' disabled'}>Deshipotecar ${$m(Math.ceil(s.p*.55))}</button>`:`<button class="mu-b" onclick="MRU.a('mort',${i})"${okk?'':' disabled'}>Hipotecar +${$m(s.p/2)}</button>`);
  const why=s.t!='p'||h>=5?'':!okk?'Puedes construir en tu turno (o cuando debes dinero).':!full(s.g,m)?'Para construir necesitas todas las colonias de este color.':GR[s.g].some(j=>G.mg[j])?'Hay una colonia hipotecada en el grupo.':G.cash[m]<hc?'No te alcanza para otra casa.':!buildable(i)?'Construye parejo: primero en las otras del grupo.':'';
  if(b.length)act=`<div class="mu-acts">${b.join('')}</div>${why?`<div class="mu-hint">${why}</div>`:''}`}
 return `<div class="mu-deed">${head}${body}${foot}${own}${act}</div>`}
const modal=(h,close)=>`<div class="mu-modal" onclick="if(event.target===this)${close}"><div class="mu-mw">${h}</div></div>`;
function menuBox(){const m3ok=!!(window.M3&&M3.ok()),sn=stageName(),G=V.G,seg=(L)=>`<div class="mu-seg">${L.map(([on,c,t,dis])=>`<button class="${on?'on':''}" onclick="${c}"${dis?' disabled':''}>${t}</button>`).join('')}</div>`;
 return `<div class="mu-card mu-menu"><header><b class="mu-h">Opciones</b><button class="mu-x" onclick="MRU.menu(0)" aria-label="Cerrar">${SV.x}</button></header>
  <div class="mu-opt"><span>Vista</span>${seg([[sn=='3d',"MRU.mode('3d')",'🎲 3D',!m3ok],[sn=='2d',"MRU.mode('2d')",'🗺️ 2D']])}</div>
  <div class="mu-opt"><span>Tablero</span>${seg([[theme=='menta',"MRU.theme('menta')",'<i class="mu-sw" style="background:#cde6d0"></i>Menta'],[theme=='oscuro',"MRU.theme('oscuro')",'<i class="mu-sw" style="background:#1f2a25"></i>Oscuro']])}</div>
  <div class="mu-opt"><span>Seguir la ficha que se mueve</span>${seg([[follow,'MRU.follow(1)','Sí'],[!follow,'MRU.follow(0)','No']])}</div>
  <div class="mu-opt"><span>Sonidos</span>${seg([[!mute,'mute=false;render()','🔊 Sí'],[mute,'mute=true;render()','🔇 No']])}</div>
  ${typeof musUI=='function'?`<div class="mu-opt"><span>Música</span>${musUI()}</div>`:''}
  <div class="mu-acts">${V.watch?`<button class="mu-b" onclick="leave()">🚪 Dejar de mirar</button>`:playing()&&G.phase=='play'?`<button class="mu-b danger" onclick="if(confirm('¿Abandonar la partida? Tus propiedades regresan al banco.'))MRU.a('quit')">🚪 Abandonar partida</button>`:`<button class="mu-b" onclick="leave()">🚪 Salir de la sala</button>`}</div></div>`}
function hud(){const w=wide();if(msg!==msgSeen){msgSeen=msg;msgT=Date.now();if(msg)setTimeout(()=>{if(active())render()},4700)}
 const sn=stageName();if(!hintT&&lsg('mr_hint_'+sn,'')!=='1'){hintT=Date.now();lss('mr_hint_'+sn,'1');setTimeout(()=>{if(active())render()},6100)}
 const hint=Date.now()-hintT<6000?`<div class="mu-toast mu-hint2">${sn=='3d'?'☝️ Un dedo: girar · ✌️ Dos dedos: acercar y mover · Doble toque: centrar':'✌️ Pellizca para acercar · ☝️ arrastra para mover · toca una casilla'}</div>`:'';
 const toast=msg&&Date.now()-msgT<4500?`<div class="mu-toast" onclick="msg='';render()">${esc(String(msg).replace(/^✋ No puedes hacer eso\. /,''))}</div>`:'';
 return `<div class="mu-hud${w?' wide':''}${land()?' land':''}">${online?'':'<div class="mu-off">⚠ Reconectando… tu lugar se conserva</div>'}${topBar()}
  <div class="mu-bot">${w?'':sheet()}<div class="mu-dockw" id="mudock">${dock()}${w?'':tabs()}</div>${w?tabs()+sheet():''}</div>${toast||hint}
  ${sel>=0?modal(deed(sel)+'<button class="mu-b" onclick="MRU.sel(-1)">Cerrar</button>','MRU.sel(-1)'):''}${menu?modal(menuBox(),'MRU.menu(0)'):''}</div>`}
// ---- qué tablero se ve y cuánto espacio le queda ----
const stageName=()=>mode==='3d'&&window.M3&&M3.ok()?'3d':'2d',stage=()=>stageName()=='3d'?window.M3:window.M2;
function layout(){const st=stage(),o=st===window.M3?window.M2:window.M3;if(o&&o.show)o.show(false);if(!st)return;
 const t=document.querySelector('.mu-top'),dk=document.getElementById('mudock'),bt=document.querySelector('.mu-bot'),sh=document.querySelector('.mu-sheet'),w=wide(),rs=document.documentElement.style;
 let T=t?t.getBoundingClientRect().bottom:0,b=0,r=0,cb=0;
 if(w&&bt)r=innerWidth-bt.getBoundingClientRect().left;else if(dk){b=innerHeight-dk.getBoundingClientRect().top;cb=sh?b+sh.offsetHeight-14:b}
 const cl=!!document.querySelector('.mu-cam')&&land();if(cl)rs.setProperty('--mu-ct',(T+6)+'px');   // en horizontal los botones de cámara van en columna a la izquierda
 if(!w)bMax=Math.max(bMax,b);const bs=w?0:Math.min(Math.max(b,bMax),innerHeight*.45);   // el tablero no brinca cada vez que la tarjeta de acciones cambia de alto
 ins={t:T+6,r,b:bs+6,l:cl?58:0};rs.setProperty('--mu-b',b+'px');rs.setProperty('--mu-cb',(cb||b)+'px');rs.setProperty('--mu-r',(w?innerWidth-bt.getBoundingClientRect().left:0)+'px');
 try{st.show(true);st.theme(theme);st.follow(follow);st.layout(ins);st.sync(V.G,sel)}catch(e){console.warn('Mérida tablero:',e);if(st===window.M3){M3.fail();render()}}}
// ---- efectos: dinero que flota, carta que se voltea, "¡Te toca!" ----
const hopMs=(p,c,k)=>{const d=(c.pos[k]-p.pos[k]+40)%40;return d>0&&d<=12?d*180+200:0};
function effects(){const G=V.G,m=me(),c={cash:G.cash.slice(),turn:G.turn,tc:G.tc,cn:G.card?G.card.n:-1,pos:G.pos.slice()},p=prev;prev=c;if(!p||p.cash.length!==c.cash.length)return;
 G.cash.forEach((x,k)=>{const d=x-p.cash[k];if(d&&!G.bk[k])setTimeout(()=>money(k,d),hopMs(p,c,k))});
 if(G.card&&G.card.n!==p.cn)setTimeout(()=>cardFx(G.card),Math.min(2600,hopMs(p,c,G.card.k)+150));
 if(G.phase=='play'&&m>=0&&G.turn===m&&(p.turn!==m||p.tc!==G.tc))setTimeout(yourTurn,250);
 if(p.turn!==G.turn)turnInView()}
function turnInView(){const pl=document.getElementById('mupls'),e=pl&&pl.querySelector('.mu-pl.on');if(!e)return;const a=e.offsetLeft-pl.offsetLeft,b=a+e.offsetWidth;if(a<pl.scrollLeft||b>pl.scrollLeft+pl.clientWidth)pl.scrollLeft=a-12}
function money(k,d){if(!active())return;const el=document.querySelector(`.mu-pl[data-seat="${k}"]`);if(!el)return;const r=el.getBoundingClientRect(),f=document.createElement('div');
 f.className='mu-mf '+(d>0?'up':'dn');f.textContent=(d>0?'+':'−')+$m(Math.abs(d));f.style.left=Math.max(40,Math.min(innerWidth-40,r.left+r.width/2))+'px';f.style.top=(r.bottom+2)+'px';
 document.body.appendChild(f);setTimeout(()=>f.remove(),1800);if(k===me())sfx(d>0?'go':'tick')}
function cardFx(c){if(!active())return;const cd=D.cards[c.d]&&D.cards[c.d][c.id];if(!cd)return;const old=document.getElementById('mucfx');if(old)old.remove();
 const e=document.createElement('div');e.id='mucfx';e.className='mu-cfx '+(c.d=='s'?'sx':'cx');   // ojo: .c y .bk ya existen en style.css (cartas)
 e.innerHTML=`<div class="mu-cf" role="dialog" aria-label="Carta"><div class="fc mu-back"><b>${c.d=='s'?'?':'🎁'}</b><span>${c.d=='s'?'Suerte':'Comunidad'}</span></div>
  <div class="fc mu-front"><h5>${c.d=='s'?'❓ Suerte':'🎁 Comunidad'}</h5><p>${esc(cd.t)}</p><small>${tok(c.k,'xs')} ${nm(c.k)}</small></div></div>`;
 e.style.cssText=`top:${ins.t}px;bottom:${ins.b}px;right:${ins.r}px`;e.onclick=()=>e.remove();document.body.appendChild(e);sfx('card');
 setTimeout(()=>e.classList.add('out'),5600);setTimeout(()=>e.remove(),6000)}
function yourTurn(){if(!active())return;const e=document.createElement('div');e.className='mu-yt';e.innerHTML=`<div>${tok(me(),'lg')}<b>¡Te toca!</b></div>`;e.style.cssText=`top:${ins.t}px;bottom:${ins.b}px;right:${ins.r}px`;
 document.body.appendChild(e);setTimeout(()=>e.remove(),1900);try{if(navigator.vibrate)navigator.vibrate([90,60,90])}catch(_){}}
// ---- enganche con game.js ----
GM.merida.body=function(){if(!active())return origBody();
 const sc=document.getElementById('musc');keep.sc=sc?sc.scrollTop:keep.sc;const pl=document.getElementById('mupls');keep.pl=pl?pl.scrollLeft:null;
 const ae=document.activeElement;keep.f=ae&&ae.id&&/^mu/.test(ae.id)?{id:ae.id,s:ae.selectionStart,e:ae.selectionEnd}:null;
 try{ok=true;return hud()}catch(e){console.warn('Mérida UI:',e);ok=false;return origBody()}};
GM.merida.after=function(){if(origAfter)origAfter();if(!active()||!ok){off();return}
 on=true;const r=document.documentElement;r.classList.add('mrui');r.classList.toggle('mumodal',sel>=0||menu);r.dataset.mrt=theme;
 const sc=document.getElementById('musc');if(sc&&keep.sc)sc.scrollTop=keep.sc;const pl=document.getElementById('mupls');if(pl&&keep.pl!=null)pl.scrollLeft=keep.pl;
 if(keep.f){const e=document.getElementById(keep.f.id);if(e){e.focus({preventScroll:true});try{if(keep.f.s!=null)e.setSelectionRange(keep.f.s,keep.f.e)}catch(_){}}}
 layout();if(keep.pl==null)turnInView();effects()};
function off(){if(!on)return;on=false;document.documentElement.classList.remove('mrui','mumodal');if(window.M3)M3.show(false);if(window.M2)M2.show(false);prev=null;sel=-1;tab=null;menu=false}
setInterval(()=>{if(on&&!active())off()},400);
let rzT=0;addEventListener('resize',()=>{if(!on)return;clearTimeout(rzT);rzT=setTimeout(()=>{bMax=0;if(active())render()},120)});
window.MRU={get selected(){return sel},get insets(){return ins},
 a:(t,sq)=>{sfx('tick');send(sq!=null?{t,sq}:{t})},
 sel:i=>{sel=i==null||i<0||i===sel?-1:i;sfx('tick');render()},
 tab:t=>{tab=wide()?t||'jug':t&&t!==tab?t:null;keep.sc=0;sfx('tick');render()},
 menu:o=>{menu=!!o;sfx('tick');render()},
 mode:x=>{mode=x||(stageName()=='3d'?'2d':'3d');hintT=0;lss('merida_3d',mode=='3d'?'1':'0');menu=false;topv=false;sfx('tick');render()},
 theme:t=>{theme=t=='oscuro'?'oscuro':'menta';lss('mr_theme',theme);sfx('tick');render()},
 follow:x=>{follow=x==null?!follow:!!x;lss('mr_follow',follow?'1':'0');sfx('tick');render()},
 cam:c=>{const st=stage();if(c=='top')topv=!topv;if(c=='home')topv=false;if(st)st.cam(c=='top'?(topv?'top':'untop'):c);sfx('tick');render()},
 look:k=>{const st=stage();if(st&&st.look)st.look(k);sfx('tick')},
 tg:(key,i)=>{const L=TR[key],j=L.indexOf(i);if(j<0)L.push(i);else L.splice(j,1);render()},
 to:k=>{TR.to=k;TR.bp=[];TR.bj=0;TR.bc=0;render()},n:(k,v)=>{TR[k]=Math.max(0,Math.floor(+v||0))},
 offer:async()=>{const okk=await send({t:'tprop',to:TR.to,ap:TR.ap,bp:TR.bp,ac:TR.ac,bc:TR.bc,aj:TR.aj,bj:TR.bj});if(okk){TR={to:TR.to,ap:[],bp:[],ac:0,bc:0,aj:0,bj:0};sfx('go');render()}}};
// ---- estilos ----
const css=document.createElement('style');css.textContent=`
html[data-mrt]{--mu-f:"Archivo",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
html[data-mrt=menta]{--mu-card:#fffef8;--mu-card2:#eef5ec;--mu-ink:#18201b;--mu-sub:#56635b;--mu-line:#18201b;--mu-soft:rgba(24,32,27,.14);--mu-red:#d7261e;--mu-redd:#8f1610;--mu-grn:#1e8a4a;--mu-grnd:#0f5a2e;--mu-glass:rgba(255,254,248,.92);--mu-hs:0 3px 0 #18201b;--mu-page:#dfeadf;--mu-hi:#fff4c2}
html[data-mrt=oscuro]{--mu-card:#1b2320;--mu-card2:#232d29;--mu-ink:#eef3ef;--mu-sub:#9fb2a8;--mu-line:#3f4d46;--mu-soft:rgba(238,243,239,.12);--mu-red:#ff5548;--mu-redd:#a1251c;--mu-grn:#2fb866;--mu-grnd:#17703c;--mu-glass:rgba(24,31,28,.9);--mu-hs:0 6px 18px rgba(0,0,0,.45);--mu-page:#0d1210;--mu-hi:#3a3520}
html.mrui,html.mrui body{overflow:hidden;height:100%;overscroll-behavior:none}html.mrui body{background:var(--mu-page)}
html.mrui #app{pointer-events:none;max-width:none;margin:0;padding:0}html.mrui #app>:not(.mu-hud){display:none!important}
html.mumodal #chat,html.mumodal #tombtn{visibility:hidden}html.mrui #chat{bottom:calc(var(--mu-cb,0px) + 10px);right:calc(var(--mu-r,0px) + 10px)}html.mrui #tombtn{bottom:calc(var(--mu-cb,0px) + 72px);right:calc(var(--mu-r,0px) + 12px)}
.mu-hud{position:fixed;inset:0;z-index:20;pointer-events:none;font:500 14px/1.3 var(--mu-f);color:var(--mu-ink);-webkit-tap-highlight-color:transparent;--mu-sbw:min(390px,44vw)}
.mu-hud button{font-family:var(--mu-f);touch-action:manipulation}.mu-hud input{font-family:var(--mu-f)}
.mu-top{position:absolute;left:0;right:0;top:0;padding:calc(env(safe-area-inset-top,0px) + 8px) 10px 6px;display:flex;flex-direction:column;gap:6px;pointer-events:none}
.mu-hud.wide .mu-top{right:var(--mu-sbw)}.mu-top>*{pointer-events:auto}
.mu-tr1{display:flex;align-items:center;gap:8px;min-width:0}
.mu-pls{flex:1;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:3px 3px 6px;min-width:0;scroll-behavior:smooth}.mu-pls::-webkit-scrollbar{display:none}
.mu-pl{flex:none;position:relative;display:flex;align-items:center;gap:6px;padding:3px 10px 3px 3px;border-radius:999px;border:2px solid var(--mu-line);background:var(--mu-glass);color:var(--mu-ink);box-shadow:var(--mu-hs);cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);text-align:left}
.mu-pi{display:flex;flex-direction:column;min-width:0}.mu-pi .n{max-width:66px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 11px/1.15 var(--mu-f);color:var(--mu-sub)}
.mu-pl .mu-tok{width:28px;height:28px;font-size:15px}.mu-pi b{font:800 14px/1.1 var(--mu-f);font-variant-numeric:tabular-nums}
.mu-pl em{position:absolute;top:-7px;right:6px;font:900 9px/1 var(--mu-f);font-style:normal;letter-spacing:.06em;background:var(--pc);color:#fff;border:1.5px solid #fff;border-radius:5px;padding:2px 4px}
.mu-pl.on{border-color:var(--pc);box-shadow:0 0 0 3px var(--pc),var(--mu-hs);animation:mupl 1.4s ease-in-out infinite}.mu-pl.on .n{color:var(--mu-ink)}
.mu-pl.x{opacity:.5;filter:grayscale(1)}.mu-pl.x b{text-decoration:line-through}
@keyframes mupl{50%{transform:translateY(-2px)}}
.mu-tok{flex:none;display:inline-grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--pc);border:2px solid #fff;box-shadow:0 0 0 2px var(--pc),0 2px 5px rgba(0,0,0,.3);font-size:18px;line-height:1}
.mu-tok.lg{width:44px;height:44px;font-size:24px}.mu-tok.xs{width:20px;height:20px;font-size:11px;border-width:1.5px;box-shadow:0 0 0 1.5px var(--pc);vertical-align:-5px}.mu-tok.bank{--pc:#7c8a83}
.mu-ib,.mu-cb{flex:none;display:grid;place-items:center;width:44px;height:44px;padding:0;border-radius:12px;border:2px solid var(--mu-line);background:var(--mu-glass);color:var(--mu-ink);box-shadow:var(--mu-hs);cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.mu-cam{display:flex;gap:6px;justify-content:flex-end}.mu-sp{flex:1}.mu-hud.land .mu-sp{display:none}.mu-cb{width:40px;height:40px;border-radius:11px}.mu-cb b{font:900 14px var(--mu-f)}.mu-cb.on{background:var(--mu-ink);color:var(--mu-card)}
.mu-hud.land .mu-cam{position:fixed;flex-direction:column;top:var(--mu-ct,70px);left:10px}
.mu-bot{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;pointer-events:none;max-height:100%}.mu-bot>*{pointer-events:auto}
.mu-dockw{background:var(--mu-card);border-top:2px solid var(--mu-line);border-radius:20px 20px 0 0;box-shadow:0 -6px 22px rgba(0,0,0,.22);padding:12px 12px 0;position:relative}
.mu-hud.land:not(.wide) .mu-dockw{margin:0 auto;width:min(560px,100%);border:2px solid var(--mu-line);border-bottom:0}
.mu-dk{display:flex;flex-direction:column;gap:10px}.mu-row{display:flex;align-items:center;gap:10px}.mu-f1{flex:1;min-width:0}.mu-tap{cursor:pointer}
.mu-h{display:block;font:900 19px/1.12 var(--mu-f);text-transform:uppercase;letter-spacing:.005em;overflow-wrap:anywhere}.mu-s{color:var(--mu-sub);font-size:13.5px}.mu-s b,.mu-s u{color:var(--mu-ink)}
.mu-big{font-size:32px;line-height:1}.mu-dice{display:flex;gap:5px;flex:none}.mu-die{width:32px;height:32px;filter:drop-shadow(0 2px 0 rgba(0,0,0,.35))}
.mu-die rect{fill:#fff;stroke:#18201b;stroke-width:1.6}.mu-die circle{fill:#18201b}.mu-die circle.r{fill:#d7261e;r:3}
.mu-acts{display:flex;gap:8px;flex-wrap:wrap}.mu-acts>*{flex:1 1 auto}.mu-acts.four>.mu-b{flex:1 1 18%;flex-direction:column;gap:1px;min-height:50px;padding:0 4px}
.mu-acts small{font:700 11px var(--mu-f);text-transform:none;opacity:.85}
.mu-b{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:0 14px;border-radius:12px;border:2px solid var(--mu-line);background:var(--mu-card);color:var(--mu-ink);font:800 14px/1.1 var(--mu-f);text-transform:uppercase;letter-spacing:.03em;cursor:pointer;box-shadow:0 3px 0 var(--mu-line);transition:transform .08s,box-shadow .08s;text-align:center}
.mu-b:active{transform:translateY(2px);box-shadow:0 1px 0 var(--mu-line)}.mu-b:disabled{opacity:.4;pointer-events:none;box-shadow:none}
.mu-b.pri{background:var(--mu-red);color:#fff;border-color:var(--mu-redd);box-shadow:0 4px 0 var(--mu-redd)}.mu-b.ok{background:var(--mu-grn);color:#fff;border-color:var(--mu-grnd);box-shadow:0 4px 0 var(--mu-grnd)}
.mu-b.big{min-height:54px;font-size:18px;width:100%}.mu-b.big2{min-height:54px;flex:0 1 36%}.mu-acts>.mu-b.big{width:auto;flex:1 1 58%}.mu-b.sm{min-height:32px;padding:0 10px;font-size:12px;border-radius:9px}.mu-b.danger{color:var(--mu-red);border-color:var(--mu-red);box-shadow:0 3px 0 var(--mu-red)}
.mu-lk{background:none;border:0;padding:0;color:var(--mu-red);font:800 13px var(--mu-f);text-decoration:underline;cursor:pointer}
.mu-note{font-size:13px;color:var(--mu-sub);background:var(--mu-card2);border-radius:10px;padding:6px 10px}
.mu-clock{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;border:3px solid var(--mu-red);color:var(--mu-red)}.mu-clock b{font:900 20px/1 var(--mu-f)}.mu-clock small{font:700 9px var(--mu-f);text-transform:uppercase}
.mu-in{min-width:0;width:auto;margin:0;flex:1 1 90px;height:44px;border-radius:10px;border:2px solid var(--mu-line);background:var(--mu-card2);color:var(--mu-ink);font:700 15px var(--mu-f);padding:0 10px;box-sizing:border-box}
.mu-dk.bad .mu-h{color:var(--mu-red)}
.mu-mini{flex:none;position:relative;display:grid;place-items:center;width:40px;height:52px;border:2px solid #18201b;border-radius:6px;background:#fffef8;overflow:hidden;font-size:20px;box-shadow:0 2px 0 #18201b}
.mu-mini:not(.ic)::before{content:'';position:absolute;left:0;right:0;top:0;height:15px;background:var(--gc);border-bottom:2px solid #18201b}.mu-mini:not(.ic)::after{content:'';position:absolute;left:7px;right:7px;top:24px;height:14px;background:repeating-linear-gradient(#18201b33 0 2px,transparent 2px 5px)}
.mu-tabs{display:flex;margin:10px -12px 0;border-top:1px solid var(--mu-soft);padding:4px 4px calc(env(safe-area-inset-bottom,0px) + 4px)}
.mu-tabs button{flex:1;position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:0;color:var(--mu-sub);font:700 11px var(--mu-f);padding:5px 0 3px;border-radius:10px;cursor:pointer}
.mu-tabs button.on{color:var(--mu-red)}.mu-tabs button.on::after{content:'';position:absolute;top:-5px;left:30%;right:30%;height:3px;border-radius:3px;background:var(--mu-red)}
.mu-tabs button i{position:absolute;top:0;left:calc(50% + 7px);min-width:16px;height:16px;border-radius:8px;background:var(--mu-red);color:#fff;font:800 10px/16px var(--mu-f);font-style:normal;padding:0 3px;box-sizing:border-box}
.mu-sheet{margin:0 8px;background:var(--mu-card);border:2px solid var(--mu-line);border-bottom:0;border-radius:20px 20px 0 0;max-height:min(56vh,calc(100vh - var(--mu-b,200px) - 110px));display:flex;flex-direction:column;box-shadow:0 -6px 20px rgba(0,0,0,.2);animation:muup .22s ease-out;margin-bottom:-14px;padding-bottom:14px;min-height:0}
.mu-hud.land:not(.wide) .mu-sheet{width:min(540px,calc(100% - 16px));margin-left:auto;margin-right:auto}
.mu-sheet header{display:flex;align-items:center;justify-content:space-between;padding:10px 12px 6px 16px;font:900 15px var(--mu-f);text-transform:uppercase;letter-spacing:.03em}
.mu-x{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;border:0;background:var(--mu-card2);color:var(--mu-ink);cursor:pointer}
.mu-sc{overflow:auto;padding:2px 12px 14px;overscroll-behavior:contain;min-height:0}
.mu-hud.wide .mu-bot{left:auto;top:0;width:var(--mu-sbw);background:var(--mu-card);border-left:2px solid var(--mu-line);box-shadow:-6px 0 22px rgba(0,0,0,.15)}
.mu-hud.wide .mu-dockw{border:0;border-radius:0;box-shadow:none;padding:calc(env(safe-area-inset-top,0px) + 14px) 14px 12px;background:var(--mu-card2)}
.mu-hud.wide .mu-tabs{margin:0;border-top:2px solid var(--mu-line);border-bottom:1px solid var(--mu-soft);padding:4px}
.mu-hud.wide .mu-sheet{margin:0;border:0;border-radius:0;max-height:none;flex:1;box-shadow:none;animation:none;padding:0}
.mu-card{background:var(--mu-card);border:2px solid var(--mu-line);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px;margin-bottom:10px}.mu-card.hi,.mu-dk.hi.mu-card{background:var(--mu-hi)}
.mu-prow{display:flex;align-items:center;gap:10px;padding:10px 8px;border-bottom:1px solid var(--mu-soft);border-left:4px solid transparent;border-radius:6px}.mu-prow.on{border-left-color:var(--pc);background:var(--mu-card2)}.mu-prow.x{opacity:.5}
.mu-prow>.mu-f1>b{font:800 15px var(--mu-f)}.mu-cash{font:900 16px var(--mu-f);font-variant-numeric:tabular-nums}
.mu-tu{font:900 10px var(--mu-f);font-style:normal;background:var(--pc);color:#fff;border-radius:4px;padding:1px 5px;vertical-align:2px}
.mu-own{display:flex;flex-wrap:wrap;gap:3px;margin-top:5px}.mu-own i{display:grid;place-items:center;width:15px;height:20px;border-radius:3px;background:var(--gc);border:1.5px solid var(--mu-line);font:800 10px var(--mu-f);font-style:normal;color:#fff;text-shadow:0 1px 1px #000;cursor:pointer}
.mu-grp{border:2px solid var(--mu-line);border-radius:14px;overflow:hidden;margin-bottom:10px}
.mu-grp header{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--mu-card2);border-bottom:1.5px solid var(--mu-line);flex-wrap:wrap}
.mu-grp header i{width:22px;height:14px;border-radius:3px;background:var(--gc);border:1.5px solid var(--mu-line)}.mu-grp header b{font:900 13px var(--mu-f)}.mu-grp header span{flex:1;font-size:12.5px;color:var(--mu-sub)}.mu-grp header small{font:700 12px var(--mu-f);color:var(--mu-sub)}
.mu-prop{display:flex;align-items:center;gap:8px;padding:10px 12px;border-top:1px solid var(--mu-soft);cursor:pointer}.mu-prop:first-of-type{border-top:0}
.mu-prop b{flex:1;font:700 14.5px var(--mu-f)}.mu-prop span{font-size:13px}.mu-prop em,.mu-down em{font-style:normal;font:800 10px var(--mu-f);text-transform:uppercase;background:var(--mu-sub);color:var(--mu-card);border-radius:4px;padding:2px 5px}
.mu-empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;padding:26px 16px;color:var(--mu-sub)}.mu-empty span{font-size:40px}.mu-empty b{color:var(--mu-ink);font:800 16px var(--mu-f)}
.mu-chip{display:inline-flex;align-items:center;gap:6px;margin:3px 5px 3px 0;padding:6px 10px;border-radius:999px;border:1.5px solid var(--mu-line);background:var(--mu-card);color:var(--mu-ink);font:600 13px var(--mu-f);cursor:pointer}
.mu-chip i{width:11px;height:11px;border-radius:3px;background:var(--gc);border:1px solid rgba(0,0,0,.4)}.mu-chip.on{background:var(--mu-ink);color:var(--mu-card)}
.mu-chip.pl.on{background:var(--pc);border-color:var(--pc);color:#fff}.mu-chip.money{background:#e3f4e8;color:#0f5a2e;border-color:#0f5a2e;font-weight:800}
.mu-who{display:flex;flex-wrap:wrap}.mu-tside{border-top:1px dashed var(--mu-soft);padding-top:8px;display:flex;flex-direction:column;gap:6px}.mu-tside>b{font:900 13px var(--mu-f);text-transform:uppercase}
.mu-num{display:flex;align-items:center;gap:6px;font:800 16px var(--mu-f);flex:1}.mu-trd{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mu-log>div{display:flex;gap:8px;align-items:flex-start;padding:7px 2px;border-bottom:1px solid var(--mu-soft);font-size:13.5px}.mu-log b{font-weight:800}
.mu-det{margin-top:10px;font:500 13.5px/1.4 var(--mu-f);color:var(--mu-sub)}.mu-det summary{cursor:pointer;font:800 13px var(--mu-f);color:var(--mu-ink);padding:8px 0}
.mu-sheet .box{background:none!important;border:0!important;box-shadow:none!important;padding:0!important;color:var(--mu-ink)!important;font:14px var(--mu-f)!important}.mu-pad{padding:4px 2px}
.mu-modal{position:fixed;inset:0;z-index:70;background:rgba(8,12,10,.5);display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:auto;animation:mufade .15s}
.mu-mw{display:flex;flex-direction:column;align-items:center;gap:12px;max-height:100%;overflow:auto;animation:mupop .22s cubic-bezier(.2,1.4,.5,1)}
.mu-deed{width:min(300px,84vw);background:#fffef8;color:#18201b;border:2px solid #18201b;border-radius:10px;padding:10px;box-shadow:0 12px 40px rgba(0,0,0,.45);font:500 14px/1.35 var(--mu-f);box-sizing:border-box}
.mu-dh{border:2px solid #18201b;text-align:center;padding:8px 6px 9px;margin-bottom:8px;display:flex;flex-direction:column;align-items:center;gap:3px}
.mu-dh small{font:700 10px var(--mu-f);letter-spacing:.14em;text-transform:uppercase}.mu-dh b{font:900 21px/1.1 var(--mu-f);text-transform:uppercase}.mu-dh.pl{background:#fff}.mu-dh span{font-size:36px;line-height:1.1}
.mu-deed table{width:100%;border-collapse:collapse;font:inherit}.mu-deed td{padding:3px 6px;text-align:left}.mu-deed td:last-child{text-align:right;font-weight:800;font-variant-numeric:tabular-nums}
.mu-deed tr.cur td{background:#ffe27a}.mu-deed tr.cur td:first-child{border-radius:6px 0 0 6px}.mu-deed tr.cur td:last-child{border-radius:0 6px 6px 0}
.mu-deed p{margin:6px 4px;text-align:center}.mu-df{border-top:1.5px solid #18201b;margin-top:8px;padding-top:7px;font-size:12px;text-align:center;color:#45524a}
.mu-down{margin-top:8px;font-size:13px;display:flex;align-items:center;gap:5px;flex-wrap:wrap}.mu-deed .mu-acts{margin-top:10px}.mu-deed .mu-b{--mu-line:#18201b;--mu-card:#fffef8;--mu-ink:#18201b}
.mu-hint{font-size:12px;color:#56635b;margin-top:6px;text-align:center}
.mu-menu{width:min(380px,92vw);box-sizing:border-box;margin:0;gap:12px}.mu-menu header{display:flex;align-items:center;justify-content:space-between}
.mu-opt{display:flex;flex-direction:column;gap:6px}.mu-opt>span{font:800 12px var(--mu-f);text-transform:uppercase;letter-spacing:.06em;color:var(--mu-sub)}
.mu-seg{display:flex;border:2px solid var(--mu-line);border-radius:12px;overflow:hidden}.mu-seg button{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;min-height:42px;border:0;background:var(--mu-card);color:var(--mu-ink);font:700 14px var(--mu-f);cursor:pointer}
.mu-seg button+button{border-left:2px solid var(--mu-line)}.mu-seg button.on{background:var(--mu-ink);color:var(--mu-card)}.mu-seg button:disabled{opacity:.4}
.mu-seg .mu-sw{width:16px;height:16px;border-radius:50%;border:2px solid currentColor}.mu-menu .b{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;min-height:42px;border:2px solid var(--mu-line);border-radius:12px;font:700 14px var(--mu-f);cursor:pointer}
.mu-toast{position:fixed;left:12px;right:calc(var(--mu-r,0px) + 74px);bottom:calc(var(--mu-cb,0px) + 14px);margin:0 auto;width:fit-content;max-width:min(460px,calc(100% - 24px));background:#18201b;color:#fff;border-radius:12px;padding:10px 14px;font:700 14px var(--mu-f);box-shadow:0 8px 24px rgba(0,0,0,.35);pointer-events:auto;animation:muup .2s;z-index:3}
.mu-hint2{background:var(--mu-ink);color:var(--mu-card);font-weight:700;text-align:center;line-height:1.35}
.mu-off{position:fixed;top:calc(env(safe-area-inset-top,0px) + 64px);left:50%;transform:translateX(-50%);background:#ffe08a;color:#3b2600;border:2px solid #18201b;border-radius:10px;padding:6px 12px;font:800 13px var(--mu-f);pointer-events:auto;z-index:4}
.mu-cfx,.mu-yt{position:fixed;left:0;top:0;right:0;bottom:0;z-index:66;display:flex;align-items:center;justify-content:center;pointer-events:none;perspective:1000px}
.mu-cf{pointer-events:auto;position:relative;width:min(310px,80vw);aspect-ratio:1.55;transform-style:preserve-3d;animation:muflip 1s cubic-bezier(.3,1.25,.5,1) forwards;cursor:pointer}
.mu-cfx.out .mu-cf{animation:muout .4s ease-in forwards}
.mu-cf .fc{position:absolute;inset:0;-webkit-backface-visibility:hidden;backface-visibility:hidden;border-radius:14px;border:3px solid #18201b;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:14px 16px;box-sizing:border-box;box-shadow:0 16px 44px rgba(0,0,0,.5);font-family:var(--mu-f);text-align:center}
.mu-cf .mu-back{background:#f7a21b;color:#18201b}.mu-cfx.cx .mu-back{background:#5bb4ec}.mu-cf .mu-back b{font:900 64px/1 var(--mu-f)}.mu-cf .mu-back span{font:900 20px var(--mu-f);text-transform:uppercase;letter-spacing:.12em}
.mu-cf .mu-front{transform:rotateY(180deg);background:#fffef8;color:#18201b;border-top:14px solid #f7a21b}.mu-cfx.cx .mu-front{border-top-color:#5bb4ec}
.mu-cf h5{margin:0;font:900 15px var(--mu-f);text-transform:uppercase;letter-spacing:.1em}.mu-cf p{margin:0;font:700 16px/1.3 var(--mu-f)}.mu-cf small{font:600 12px var(--mu-f);color:#56635b;display:flex;align-items:center;gap:5px}
.mu-yt>div{display:flex;align-items:center;gap:12px;background:var(--mu-red);color:#fff;border:3px solid #fff;border-radius:22px;padding:14px 24px 14px 16px;box-shadow:0 8px 0 var(--mu-redd),0 22px 44px rgba(0,0,0,.4);animation:muyt 1.9s cubic-bezier(.2,1.4,.5,1) forwards}
.mu-yt b{font:900 clamp(30px,8vw,46px)/1 var(--mu-f);text-transform:uppercase;letter-spacing:.01em}
.mu-mf{position:fixed;z-index:68;transform:translate(-50%,0);font:900 17px var(--mu-f);pointer-events:none;padding:3px 10px;border-radius:999px;border:2px solid #fff;color:#fff;box-shadow:0 4px 10px rgba(0,0,0,.35);animation:mumf 1.8s ease-out forwards;white-space:nowrap}
.mu-mf.up{background:#1e8a4a}.mu-mf.dn{background:#d7261e}
@keyframes muup{from{transform:translateY(30px);opacity:0}}@keyframes mufade{from{opacity:0}}@keyframes mupop{from{transform:scale(.85);opacity:0}}
@keyframes muflip{0%{transform:translateY(60px) scale(.5) rotateY(0)}35%{transform:translateY(0) scale(1.04) rotateY(0)}55%{transform:scale(1.04) rotateY(0)}100%{transform:scale(1) rotateY(180deg)}}
@keyframes muout{to{transform:rotateY(180deg) translateY(-40px) scale(.7);opacity:0}}
@keyframes muyt{0%{transform:scale(.3) rotate(-8deg);opacity:0}18%{transform:scale(1.08) rotate(2deg);opacity:1}30%{transform:scale(1) rotate(0)}80%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.92) translateY(-30px)}}
@keyframes mumf{0%{opacity:0;transform:translate(-50%,-6px) scale(.6)}15%{opacity:1;transform:translate(-50%,6px) scale(1.12)}100%{opacity:0;transform:translate(-50%,48px) scale(1)}}
@media (prefers-reduced-motion:reduce){.mu-hud *,.mu-cf,.mu-yt>div,.mu-mf{animation-duration:.01s!important}}
`;document.head.appendChild(css);
})();
