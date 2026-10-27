// Mérida en Venta: interfaz del cliente (tablero 2D + panel de acciones). Se registra en GM.merida; datos en merida_data.js (window.MERD).
// c_merida3d.js reutiliza MR.panel() encima del tablero 3D. Usa sala, chat y sonidos de game.js (send, render, sfx, banner...).
(function(){
const D=window.MERD;if(!D||typeof GM==='undefined'){console.warn('Mérida: falta merida_data.js');return}
const B=D.board,GR=[];B.forEach((s,i)=>{if(s.t=='p')(GR[s.g]=GR[s.g]||[]).push(i)});
const ICO={go:'⬅️',jail:'🔒',free:'🏖️',gtj:'👮',s:'❓',c:'🎁',tax:'🧾',r:'🚌'},UI={CFE:'⚡',JAPAY:'💧'};
const $m=v=>'$'+Number(v||0).toLocaleString('es-MX'),pc=k=>D.pcol[k%6],tk=k=>D.tok[k%6][1];
const pnm=k=>k>=0&&V.G.players[k]?esc(V.G.players[k].name):'el banco';
let sel=-1,TR={to:-1,ap:[],bp:[],ac:0,bc:0,aj:0,bj:0},aucEnd=0,aucId=-1,winN=-1;
// ---- estilos (los del 2D y los del panel del 3D) ----
const css=document.createElement('style');css.textContent=`
.mrb{display:grid;grid-template-columns:1.5fr repeat(9,1fr) 1.5fr;grid-template-rows:1.5fr repeat(9,1fr) 1.5fr;aspect-ratio:1;width:min(100%,760px);margin:6px auto;gap:1px;background:#20402c;border:3px solid #20402c;border-radius:6px;font:600 clamp(6px,1.15vw,10px)/1.05 system-ui,sans-serif;color:#222}
.mrc{background:#fbf8ef;position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;cursor:pointer;padding:1px;word-break:break-word}
.mrc i{position:absolute;left:0;right:0;top:0;height:22%;font-style:normal;font-size:.95em;display:flex;align-items:center;justify-content:center;color:#fff;letter-spacing:-1px}
.mrc.p{padding-top:22%}.mrc.sel{outline:3px solid #ff9800;z-index:2}.mrc .pr{opacity:.7;font-weight:500}.mrc .tk{font-size:1.5em;line-height:1}
.mrc.mg{background:repeating-linear-gradient(45deg,#eee,#eee 4px,#ddd 4px,#ddd 8px)}.mrc.k{font-size:1.1em}
.mrctr{grid-area:2/2/11/11;background:radial-gradient(#fdf6e3,#e9dcb8);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:4%;font-size:1.25em;overflow:hidden}
.mrctr h2{margin:0;font-size:2.2em;color:#7a3e12;font-family:Georgia,serif}.mrdice{font-size:3.4em;line-height:1}
.mrcard{background:#fff;border:2px solid #c8a24a;border-radius:6px;padding:4px 8px;max-width:90%;font-weight:500}
.mrpan{font:500 14px/1.3 system-ui,"Segoe UI",sans-serif;color:#1d1d1d;display:flex;flex-direction:column;gap:6px;text-align:left}
.mrbx{background:rgba(255,255,255,.92);border-radius:8px;padding:8px 10px;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.mrbx.hi{background:#fff8d6;border:2px solid #f0b400}.mrbx h4{margin:0 0 4px;font-size:15px}
.mrbt{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 12px;margin:2px;border-radius:6px;border:1px solid #7a6a50;background:linear-gradient(#fff,#ece3cf);color:#222;font:600 14px system-ui,sans-serif;cursor:pointer}
.mrbt.go{background:linear-gradient(#ffd54f,#f0a800);border-color:#a86f00}.mrbt.on{background:#2e7d32;color:#fff;border-color:#1b5e20}.mrbt:disabled{opacity:.45;cursor:default}
.mrpl{display:flex;align-items:center;gap:6px;padding:2px 0}.mrpl b{margin-left:auto}.mrpl.t{font-weight:700}.mrpl.x{opacity:.45;text-decoration:line-through}
.mrdot{display:inline-block;width:11px;height:11px;border-radius:50%;border:1px solid rgba(0,0,0,.35);vertical-align:middle}
.mrsq{display:inline-flex;align-items:center;gap:4px;margin:2px;padding:2px 6px;border-radius:5px;border:1px solid #bbb;background:#fff;cursor:pointer;font-size:13px}
.mrsq.on{outline:2px solid #2e7d32;background:#e8f5e9}.mrlog{font-size:12.5px;max-height:150px;overflow:auto}.mrlog div{padding:1px 0;border-bottom:1px dotted #ddd}
.mrrt{width:100%;border-collapse:collapse;font-size:13px}.mrrt td{padding:1px 4px}.mrrt td:last-child{text-align:right}
.mrpan input[type=number]{width:90px;font-size:14px;padding:4px}.mrpan select{font-size:14px;padding:4px}
`;document.head.appendChild(css);
// ---- casillas ----
function cellRC(i){if(i<=10)return [11,11-i];if(i<=20)return [11-(i-10),1];if(i<=30)return [1,1+(i-20)];return [1+(i-30),11]}
const icon=s=>s.t=='u'?UI[s.n]||'💡':ICO[s.t]||'';
function cell(i){const G=V.G,s=B[i],[r,c]=cellRC(i),o=G.own[i],h=G.hs[i],here=G.players.map((_,k)=>k).filter(k=>!G.bk[k]&&G.pos[k]===i);
 const st=`grid-area:${r}/${c};${o>=0?`box-shadow:inset 0 -5px 0 ${pc(o)};`:''}`;
 let x=s.t=='p'?`<i style="background:${D.gcol[s.g]}">${h==5?'🏨':h?'🏠'.repeat(h):''}</i>`:`<span>${icon(s)}</span>`;
 x+=`<span>${esc(s.n)}</span>`+(s.s?`<span class="pr">${esc(s.s)}</span>`:'')+(s.p&&o<0?`<span class="pr">${$m(s.p)}</span>`:s.v?`<span class="pr">${$m(s.v)}</span>`:'');
 if(here.length)x+=`<span class="tk">${here.map(tk).join('')}</span>`;
 return `<div class="mrc${s.t=='p'?' p':''}${[0,10,20,30].includes(i)?' k':''}${G.mg[i]?' mg':''}${sel===i?' sel':''}" style="${st}" onclick="MR.sel(${i})" title="${esc(s.n)}">${x}</div>`}
const DIE='⚀⚁⚂⚃⚄⚅';
function cardHtml(){const G=V.G;if(!G.card)return '';const c=D.cards[G.card.d][G.card.id];
 return `<div class="mrcard"><b>${G.card.d=='s'?'❓ Suerte':'🎁 Comunidad'}</b> · ${pnm(G.card.k)}<br>${esc(c.t)}</div>`}
function board(){const G=V.G;let h='';for(let i=0;i<40;i++)h+=cell(i);
 return `<div class="mrb">${h}<div class="mrctr"><h2>Mérida en Venta</h2>${G.dice[0]?`<div class="mrdice">${DIE[G.dice[0]-1]}${DIE[G.dice[1]-1]}</div>`:''}
  ${G.o.pot?`<div>🏖️ Bote de vacaciones: <b>${$m(G.pot)}</b></div>`:''}${cardHtml()}</div></div>`}
// ---- panel ----
const can=()=>{const G=V.G,me=V.me;if(me<0||G.bk[me]||G.auc||G.phase!='play')return false;return G.debts.length?G.debts[0].k===me:G.turn===me};
function rentTable(i){const s=B[i];if(s.t=='p')return `<table class="mrrt"><tr><td>Renta</td><td>${$m(s.r[0])}</td></tr>${[1,2,3,4].map(n=>`<tr><td>Con ${n} casa${n>1?'s':''}</td><td>${$m(s.r[n])}</td></tr>`).join('')}<tr><td>Con hotel</td><td>${$m(s.r[5])}</td></tr><tr><td>Cada casa cuesta</td><td>${$m(D.hc[s.g])}</td></tr></table>`;
 if(s.t=='r')return '<div>Renta: $25 con 1 ruta, $50 con 2, $100 con 3, $200 con las 4.</div>';
 if(s.t=='u')return '<div>Renta: 4 veces los dados; 10 veces si el dueño tiene CFE y JAPAY.</div>';
 const T={go:'Cobras $200 cada vez que pasas.',jail:'Si solo caes aquí, vienes de visita.',free:'Descanso en la playa.'+(V.G.o.pot?' Te llevas el bote.':''),gtj:'Te vas directo a la cárcel.',s:'Saca una carta de Suerte.',c:'Saca una carta de Comunidad.',tax:'Pagas '+$m(s.v)+' al banco.'};return `<div>${T[s.t]||''}</div>`}
function selBox(){const G=V.G,i=sel;if(i<0)return '';const s=B[i],o=G.own[i],mine=o===V.me&&can(),hc=s.t=='p'?D.hc[s.g]:0;
 let b='';if(mine){if(s.t=='p'){b+=`<button class="mrbt" onclick="MR.a('build',${i})"${G.hs[i]>=5?' disabled':''}>🏠 Construir (${$m(hc)})</button>`;if(G.hs[i])b+=`<button class="mrbt" onclick="MR.a('sell',${i})">Vender casa (+${$m(hc/2)})</button>`}
  if(G.o.mort)b+=G.mg[i]?`<button class="mrbt" onclick="MR.a('unm',${i})">Deshipotecar (${$m(Math.ceil(s.p*.55))})</button>`:`<button class="mrbt" onclick="MR.a('mort',${i})">Hipotecar (+${$m(s.p/2)})</button>`}
 return `<div class="mrbx"><h4>${icon(s)} ${esc(s.n)} ${s.t=='p'?`<span class="mrdot" style="background:${D.gcol[s.g]}"></span>`:''} <button class="mrbt" style="float:right;min-height:26px" onclick="MR.sel(-1)">✕</button></h4>
  ${s.p?`<div>Precio: <b>${$m(s.p)}</b> · Dueño: ${o>=0?`<span class="mrdot" style="background:${pc(o)}"></span> ${pnm(o)}`:'el banco'}${G.mg[i]?' · <b>hipotecada</b>':''}${G.hs[i]?' · '+(G.hs[i]==5?'hotel':G.hs[i]+' casa(s)'):''}</div>`:''}
  ${rentTable(i)}${b?`<div>${b}</div>`:''}</div>`}
function aucBox(){const G=V.G,a=G.auc,me=V.me,s=B[a.sq],inn=a.in.includes(me),cash=G.cash[me]||0;
 const bt=d=>{const v=a.bid+d;return `<button class="mrbt go" onclick="MR.bid(${v})"${v>cash?' disabled':''}>+${d} (${$m(v)})</button>`};
 return `<div class="mrbx hi"><h4>🔨 Subasta: ${esc(s.n)} (vale ${$m(s.p)})</h4><div>Oferta más alta: <b>${a.hi>=0?$m(a.bid)+' de '+pnm(a.hi):'nadie todavía'}</b> · se cierra en <b id="mraT">${Math.ceil(a.left/1000)}</b> s</div>
  ${inn?`<div>${[1,10,50,100].map(bt).join('')}</div><div><input type="number" id="mrbv" min="${a.bid+1}" max="${cash}" placeholder="Otra cantidad"> <button class="mrbt" onclick="MR.bid(+document.getElementById('mrbv').value)">Ofrecer</button> <button class="mrbt" onclick="MR.a('apass')">Me retiro</button></div>`
   :me>=0?'<div>Ya te retiraste de esta subasta.</div>':''}<div style="font-size:12px;opacity:.75">Siguen: ${a.in.map(pnm).join(', ')||'nadie'}</div></div>`}
function debtBox(){const G=V.G,d=G.debts[0],me=V.me;
 if(d.k!==me)return `<div class="mrbx hi">💸 ${pnm(d.k)} debe <b>${$m(d.amt)} pesos</b> a ${pnm(d.to)} y está juntando el dinero…</div>`;
 return `<div class="mrbx hi"><h4>💸 Debes ${$m(d.amt)} pesos a ${pnm(d.to)}</h4><div>Tienes ${$m(G.cash[me])}. Vende casas${G.o.mort?', hipoteca':''} o haz un trato para juntar lo que falta (toca tus propiedades en la lista de abajo).</div>
  <div><button class="mrbt go" onclick="MR.a('paydebt')"${G.cash[me]<d.amt?' disabled':''}>Pagar</button><button class="mrbt" onclick="if(confirm('¿Declararte en quiebra? Pierdes la partida.'))MR.a('broke')">Me declaro en quiebra</button></div></div>`}
function tradeBox(){const G=V.G,T=G.trade,me=V.me;if(!T||(T.a!==me&&T.b!==me))return T?`<div class="mrbx">🤝 ${pnm(T.a)} le ofreció un trato a ${pnm(T.b)}.</div>`:'';
 const side=(c,L,j)=>[c?$m(c)+' pesos':'',...L.map(q=>esc(B[q].n)),j?j+' tarjeta(s) de cárcel':''].filter(Boolean).join(', ')||'nada';
 return `<div class="mrbx hi"><h4>🤝 Trato ${T.a===me?'que ofreciste a '+pnm(T.b):'de '+pnm(T.a)}</h4><div><b>${T.a===me?'Das':pnm(T.a)+' da'}:</b> ${side(T.ac,T.ap,T.aj)}</div><div><b>${T.a===me?'Pides':'Te pide'}:</b> ${side(T.bc,T.bp,T.bj)}</div>
  <div>${T.b===me?`<button class="mrbt go" onclick="MR.a('tyes')">Aceptar</button><button class="mrbt" onclick="MR.a('tno')">Rechazar</button>`:`<button class="mrbt" onclick="MR.a('tno')">Retirar el trato</button>`}</div></div>`}
function turnBox(){const G=V.G,me=V.me,k=G.turn;
 if(G.phase=='final')return `<div class="mrbx hi"><h4>🏆 ${G.win>=0?pnm(G.win)+' gana':'Se acabó'}</h4>${G.win===me?'¡Eres el último en pie! 🎉':'Fue el último que no quebró.'}${V.host?`<div><button class="mrbt go" onclick="send({t:'reset'})">Otra partida</button></div>`:''}</div>`;
 if(G.auc)return aucBox();if(G.debts.length)return debtBox();
 if(k!==me||me<0)return `<div class="mrbx">⏳ Turno de <span class="mrdot" style="background:${pc(k)}"></span> ${tk(k)} <b>${pnm(k)}</b>${G.st=='buy'?' (decidiendo si compra '+esc(B[G.pos[k]].n)+')':''}</div>`;
 const s=B[G.pos[me]];let h=`<h4>🎲 ¡Tu turno!</h4>`;
 if(G.st=='roll'){if(G.jail[me])h+=`<div>Estás en la cárcel (intento ${G.jail[me]} de 3).</div><button class="mrbt go" onclick="MR.a('roll')">🎲 Tirar por dobles</button><button class="mrbt" onclick="MR.a('bail')"${G.cash[me]<D.bail?' disabled':''}>Pagar fianza (${$m(D.bail)})</button>${G.jf[me]?`<button class="mrbt" onclick="MR.a('jcard')">Usar tarjeta</button>`:''}`;
  else h+=`<button class="mrbt go" onclick="MR.a('roll')">🎲 ${G.again?'Tirar otra vez (dobles)':'Tirar dados'}</button>`}
 else if(G.st=='buy')h+=`<div>Caíste en <b>${esc(s.n)}</b>. Cuesta <b>${$m(s.p)}</b>; tienes ${$m(G.cash[me])}.</div><button class="mrbt go" onclick="MR.a('buy')"${G.cash[me]<s.p?' disabled':''}>Comprar</button><button class="mrbt" onclick="MR.a('nobuy')">No comprar${G.o.auc?' (se subasta)':''}</button><button class="mrbt" onclick="MR.sel(${G.pos[me]})">Ver rentas</button>`;
 else h+=`<div>Puedes construir${G.o.mort?', hipotecar':''} o hacer tratos antes de terminar.</div><button class="mrbt go" onclick="MR.a('end')">Terminar turno ➡️</button>`;
 return `<div class="mrbx hi">${h}</div>`}
function players(){const G=V.G;return `<div class="mrbx">${G.players.map((p,k)=>{const n=G.own.filter(o=>o===k).length;
 return `<div class="mrpl${k===G.turn&&G.phase=='play'?' t':''}${G.bk[k]?' x':''}"><span class="mrdot" style="background:${pc(k)}"></span>${tk(k)} ${esc(p.name)}${k===V.me?' (tú)':''}${G.jail[k]?' 🔒':''}${G.jf[k]?' 🗝️'.repeat(G.jf[k]):''}<small>${n} prop.</small><b>${G.bk[k]?'quebró':$m(G.cash[k])}</b></div>`}).join('')}</div>`}
function mine(){const G=V.G,me=V.me;if(me<0)return '';const L=G.own.map((o,i)=>o===me?i:-1).filter(i=>i>=0);if(!L.length)return '';
 return `<div class="mrbx"><h4>Tus propiedades</h4>${L.map(i=>{const s=B[i];return `<span class="mrsq${sel===i?' on':''}" onclick="MR.sel(${i})">${s.t=='p'?`<span class="mrdot" style="background:${D.gcol[s.g]}"></span>`:icon(s)} ${esc(s.n)}${G.hs[i]?' '+(G.hs[i]==5?'🏨':G.hs[i]+'🏠'):''}${G.mg[i]?' (hip.)':''}</span>`}).join('')}</div>`}
function composer(){const G=V.G,me=V.me;if(me<0||G.bk[me]||G.phase!='play'||G.trade)return '';const ot=G.players.map((_,k)=>k).filter(k=>k!==me&&!G.bk[k]);if(!ot.length)return '';
 if(!ot.includes(TR.to))TR.to=ot[0];const props=k=>G.own.map((o,i)=>o===k?i:-1).filter(i=>i>=0);
 const chips=(k,key)=>props(k).map(i=>`<span class="mrsq${TR[key].includes(i)?' on':''}" onclick="MR.tg('${key}',${i})">${esc(B[i].n)}${G.hs[i]?' 🏠':''}</span>`).join('')||'<small>sin propiedades</small>';
 return `<details class="mrbx" id="mrtr"${TR.open?' open':''} ontoggle="MR.tr(this.open)"><summary><b>🤝 Proponer un trato</b></summary>
  <div>Con: <select onchange="MR.to(+this.value)">${ot.map(k=>`<option value="${k}"${k===TR.to?' selected':''}>${tk(k)} ${pnm(k)}</option>`).join('')}</select></div>
  <div><b>Das:</b> ${chips(me,'ap')}<br>Pesos: <input type="number" min="0" value="${TR.ac||''}" oninput="MR.n('ac',this.value)">${G.jf[me]?` Tarjetas de cárcel: <input type="number" min="0" max="${G.jf[me]}" value="${TR.aj||''}" oninput="MR.n('aj',this.value)">`:''}</div>
  <div><b>Pides:</b> ${chips(TR.to,'bp')}<br>Pesos: <input type="number" min="0" value="${TR.bc||''}" oninput="MR.n('bc',this.value)">${G.jf[TR.to]?` Tarjetas de cárcel: <input type="number" min="0" max="${G.jf[TR.to]}" value="${TR.bj||''}" oninput="MR.n('bj',this.value)">`:''}</div>
  <button class="mrbt go" onclick="MR.offer()">Ofrecer trato</button></details>`}
function logBox(){const G=V.G;return `<div class="mrbx mrlog">${(G.log||[]).slice().reverse().map(e=>`<div>${e.k>=0?`<span class="mrdot" style="background:${pc(e.k)}"></span> <b>${pnm(e.k)}</b> `:''}${esc(e.t)}</div>`).join('')}</div>`}
function panel(o={}){const G=V.G,me=V.me;
 return `<div class="mrpan">${me>=0&&!G.bk[me]?`<div class="mrbx"><span class="mrdot" style="background:${pc(me)}"></span> ${tk(me)} ${esc(D.tok[me%6][0])} · Tienes <b>${$m(G.cash[me])}</b> · estás en ${esc(B[G.pos[me]].n)}</div>`:''}
  ${turnBox()}${tradeBox()}${o.card&&G.card?`<div class="mrbx">${cardHtml()}</div>`:''}${selBox()}${players()}${mine()}${composer()}${logBox()}
  ${me>=0&&!G.bk[me]&&G.phase=='play'?`<button class="mrbt" onclick="if(confirm('¿Abandonar la partida? Tus propiedades regresan al banco.'))MR.a('quit')">🚪 Abandonar</button>`:''}</div>`}
// ---- lobby y reglas ----
const OPN=[['auc','Subasta si nadie compra'],['even','Construcción pareja'],['mort','Hipotecas (50% del precio)'],['dbl','x2 renta con grupo completo'],['pot','Bote de vacaciones'],['jr','Sin renta si el dueño está en la cárcel'],['qa','Abandono: sus propiedades se subastan']];
function lobby(host){const o=V.opts||{},t=([k,n])=>host?`<button class="b g sm2${o[k]?' on':''}" onclick="send({t:'opts',o:{${k}:${!o[k]}}})">${n}: ${o[k]?'Sí':'No'}</button>`:`<div class="top">${n}: <b>${o[k]?'Sí':'No'}</b></div>`;
 const cs=[1000,1500,2000,2500,3000].map(v=>host?`<button class="b g sm2${o.cash==v?' on':''}" onclick="send({t:'opts',o:{cash:${v}}})">${$m(v)}</button>`:'').join('');
 return `<div class="box"><b>Reglas de esta sala</b><br>${OPN.map(t).join('')}<div class="top">Dinero inicial: <b>${$m(o.cash)}</b></div>${cs}</div>`
  +(host?`<button class="b" ${V.players.length<2?'disabled':''} onclick="send({t:'start'})">Empezar partida</button><div class="top">De 2 a 6 jugadores.</div>`:'')}
const rules=`<details><summary>Reglas</summary>Juego de compra y renta en Mérida. Gana el último que no quiebre. Todos empiezan con el dinero de la sala (normalmente $1,500) y cobran $200 cada vez que pasan por la Salida.
 En tu turno tiras dos dados y avanzas. Si caes en una propiedad sin dueño puedes comprarla; si no, se subasta (si la regla está prendida). Si tiene dueño, le pagas renta.
 Con todas las colonias de un grupo puedes construir casas (hasta 4) y después un hotel: la renta sube mucho. Las rutas del Va y Ven cobran $25, $50, $100 o $200 según cuántas tenga el dueño. CFE y JAPAY cobran 4 veces los dados (10 veces si el dueño tiene las dos).
 Con dobles vuelves a tirar; tres dobles seguidos te mandan a la cárcel. Para salir: pagas $50, usas una tarjeta o intentas sacar dobles (a los 3 intentos pagas y sales).
 Si no te alcanza para pagar, vende casas, hipoteca (si está prendido) o haz tratos; si aun así no juntas el dinero, quiebras. En los tratos puedes ofrecer pesos, propiedades y tarjetas para salir de la cárcel.</details>`;
function body(){return board()+panel()+`<button class="b g sm2" onclick="mute=!mute;render()">${mute?'🔇 Sonido':'🔊 Sonido'}</button>`+(typeof plist=='function'?`<details><summary>Jugadores de la sala</summary>${plist()}</details>`:'')}
// cuenta regresiva de la subasta sin esperar al servidor
setInterval(()=>{const e=document.getElementById('mraT');if(e)e.textContent=Math.max(0,Math.ceil((aucEnd-Date.now())/1000))},250);
function after(){const G=V.G;if(!G)return;if(G.auc){if(G.auc.id!==aucId||G.auc.left>0){aucEnd=Date.now()+G.auc.left;aucId=G.auc.id}}}
window.MR={D,B,GR,panel,board,cellRC,pc,tk,$m,can,
 a:(t,sq)=>{sfx('tick');send(sq!=null?{t,sq}:{t})},bid:v=>{v=Math.floor(+v||0);if(v<=0)return;send({t:'bid',v})},
 sel:i=>{sel=sel===i?-1:i;sfx('tick');render()},get selected(){return sel},
 tg:(key,i)=>{const L=TR[key],j=L.indexOf(i);if(j<0)L.push(i);else L.splice(j,1);render()},to:k=>{TR.to=k;TR.bp=[];TR.bj=0;render()},n:(k,v)=>{TR[k]=Math.max(0,Math.floor(+v||0))},tr:o=>{TR.open=o},
 offer:async()=>{const ok=await send({t:'tprop',to:TR.to,ap:TR.ap,bp:TR.bp,ac:TR.ac,bc:TR.bc,aj:TR.aj,bj:TR.bj});if(ok){TR={to:TR.to,ap:[],bp:[],ac:0,bc:0,aj:0,bj:0};render()}}};
GM.merida={name:'Mérida en Venta',emoji:'🏘️',max:6,rules,lobby,body,face:()=>({h:''}),fx:()=>true,after,
 win:(n,fin)=>{if(!fin||winN===n.ln)return;winN=n.ln;const w=n.win,me=w===V.me;sfx('win');banner(me?'🏆 ¡Ganaste!':'🏆 '+(w>=0?n.players[w].name:'')+' ganó');confetti(me?90:35)},
 ev:e=>{if(/^ganó/.test(e.t)||/^¡Subasta/.test(e.t))banner((e.k>=0?V.G.players[e.k].name+' ':'')+e.t)}};
})();
