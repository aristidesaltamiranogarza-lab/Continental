// Monopoly Deal: interfaz del cliente. Se registra en GM.monopolydeal. Reutiliza sala, chat, sonidos, animaciones y arrastre de game.js
const mdNEED=[2,3,3,3,3,3,3,2,4,2],mdRENT=[[1,2],[1,2,3],[1,2,4],[1,3,5],[2,3,6],[2,4,6],[2,4,7],[3,8],[1,2,3,4],[1,2]];
const mdCC=['#8b5a3c','#8fd3f4','#e45aa6','#f59a23','#d7263d','#f7d51d','#2e9e5b','#1f4aa8','#2b2b2b','#9ccf9a'],mdLT=[0,1,0,0,0,1,0,0,0,1];
const mdCN=['Café','Celeste','Rosa','Naranja','Rojo','Amarillo','Verde','Azul','Ferrocarril','Servicio'];
const mdAN={tratosucio:'Trato sucio',dino:'Di que no',ladron:'Ladrón',forzoso:'Trato forzoso',cobro:'Cobro',cumple:'Es mi cumpleaños',salida:'Pasa por la salida',casa:'Casa',hotel:'Hotel',doble:'Doble renta'};
const mdAI={tratosucio:'💥',dino:'🚫',ladron:'🥷',forzoso:'🔄',cobro:'💼',cumple:'🎂',salida:'🏁',casa:'🏠',hotel:'🏨',doble:'✖2'};
// Mazo oficial (106 cartas); idéntico al del servidor
const mdCAT=[],mdAdd=(n,o)=>{for(let i=0;i<n;i++)mdCAT.push({...o})};
[[1,6],[2,5],[3,3],[4,3],[5,2],[10,1]].forEach(([v,n])=>mdAdd(n,{t:'m',v}));
[[0,1,['Mediterráneo','Báltica']],[1,1,['Oriental','Vermont','Connecticut']],[2,2,['St. Charles','Virginia','States']],[3,2,['St. James','Tennessee','Nueva York']],
 [4,3,['Kentucky','Indiana','Illinois']],[5,3,['Atlantic','Ventnor','Marvin']],[6,4,['Pacific','N. Carolina','Pennsylvania']],[7,4,['Park Place','Boardwalk']],
 [8,2,['Reading','Penn.','B&O','Short Line']],[9,2,['Eléctrica','Agua']]].forEach(([c,v,ns])=>ns.forEach(n=>mdAdd(1,{t:'p',c,v,n})));
[[[7,6],4,1],[[1,0],1,1],[[3,2],2,2],[[4,5],3,2],[[6,8],4,1],[[1,8],4,1],[[8,9],2,1]].forEach(([cs,v,n])=>mdAdd(n,{t:'w',cs,v}));mdAdd(2,{t:'w',cs:'any',v:0});
[['tratosucio',5,2],['dino',4,3],['ladron',3,3],['forzoso',3,3],['cobro',3,3],['cumple',2,3],['salida',1,10],['casa',3,3],['hotel',4,2],['doble',1,2]].forEach(([k,v,n])=>mdAdd(n,{t:'a',k,v}));
[[0,1],[2,3],[4,5],[6,7],[8,9]].forEach(cs=>mdAdd(2,{t:'r',cs,v:1}));mdAdd(3,{t:'r',cs:'any',v:3});
const mdCols=c=>c.t=='p'?[c.c]:c.cs=='any'?[0,1,2,3,4,5,6,7,8,9]:c.cs;
const mdBg=c=>c.cs=='any'?'linear-gradient(90deg,#d7263d,#f7d51d,#2e9e5b,#1f4aa8)':`linear-gradient(90deg,${mdCC[c.cs[0]]} 50%,${mdCC[c.cs[1]]} 50%)`;
const mdWN=c=>c.cs=='any'?'multicolor':c.cs.map(x=>mdCN[x]).join(' / ');
const mdName=id=>{const c=mdCAT[id];return c.t=='m'?'Dinero $'+c.v+'M':c.t=='p'?c.n:c.t=='w'?'Comodín '+mdWN(c):c.t=='r'?'Renta '+mdWN(c):mdAN[c.k]};
function mdIn(id){const c=mdCAT[id],v=`<b class="mv">$${c.v}M</b>`;
 if(c.t=='m')return `<span class="mn">Dinero</span>${v}`;
 if(c.t=='p')return `<i class="mb" style="background:${mdCC[c.c]}"></i><span class="mn">${c.n}</span>${v}`;
 if(c.t=='w')return `<i class="mb" style="background:${mdBg(c)}"></i><span class="mn">Comodín ${mdWN(c)}</span>${v}`;
 if(c.t=='r')return `<i class="mb" style="background:${mdBg(c)}"></i><span class="mn">Renta ${mdWN(c)}</span>${v}`;
 return `<i class="ma">${mdAI[c.k]}</i><span class="mn">${mdAN[c.k]}</span>${v}`}
const mdCls=id=>'c md m'+mdCAT[id].t;
function mdc(id,o={}){return `<div class="${mdCls(id)}${o.sel?' s':''}${o.sm?' sm':''}${o.nw?' nw':''}"${o.id?` id="${o.id}"`:''}${o.did!=null?` data-id="${o.did}"`:''}${o.on?` onclick="${o.on}"`:''}>${mdIn(id)}</div>`}
const mdKey=id=>{const c=mdCAT[id];return c.t=='p'?c.c:c.t=='w'?10+(c.cs=='any'?9:c.cs[0]):c.t=='m'?30+c.v:c.t=='a'?60:80};
const mdDisp=h=>[...h].sort(manual?(a,b)=>oi({id:a})-oi({id:b}):sortS?(a,b)=>mdCAT[b].v-mdCAT[a].v||mdKey(a)-mdKey(b):(a,b)=>mdKey(a)-mdKey(b)||a-b);
const mdSets=k=>{const tb=V.G.tb[k];return Object.keys(tb).filter(c=>tb[c].length>=mdNEED[c]).length};
let mdSel=null,mdFrom='h';
function mdPick(id){if(Date.now()-noClick<300)return;const G=V.G;if(V.me!=G.turn)return bad('No es tu turno.');if(Date.now()<cdEnd)return;mdSel=mdSel==id&&mdFrom=='h'?null:id;mdFrom='h';render()}
function mdPickT(id){if(Date.now()-noClick<300)return;const G=V.G;if(V.me!=G.turn||G.step!='play')return;mdSel=mdSel==id&&mdFrom=='t'?null:id;mdFrom='t';render()}
const mdDo=m=>{mdSel=null;render();send(m)};
function mdGroups(k,mine){const G=V.G,tb=G.tb[k],cols=Object.keys(tb).map(Number).filter(c=>tb[c].length).sort((a,b)=>a-b);
 if(!cols.length)return '<div class="top">Sin propiedades todavía.</div>';
 return '<div class="mgs">'+cols.map(c=>{const ids=tb[c],need=mdNEED[c],full=ids.length>=need,r=mdRENT[c][Math.min(ids.length,need)-1];
  return `<div class="mg${full?' full':''}" style="--gc:${mdCC[c]};--gt:${mdLT[c]?'#111':'#fff'}"><div class="mgh"><b>${mdCN[c]}</b><span>${Math.min(ids.length,need)}/${need}${full?' ✓':''}</span></div><div class="pips">${Array.from({length:need},(_,j)=>`<u class="${j<ids.length?'on':''}"></u>`).join('')}</div><div class="mgc">${ids.map(x=>mdc(x,{sm:1,sel:mine&&x==mdSel&&mdFrom=='t',on:mine&&mdCAT[x].t=='w'?`mdPickT(${x})`:''})).join('')}</div><div class="mrent">Renta $${r}M</div></div>`}).join('')+'</div>'}
function mdTbl(k){const G=V.G,o=V.players[k],bank=G.bank[k],tot=bank.reduce((a,x)=>a+mdCAT[x].v,0),mine=k==V.me&&G.turn==k&&G.step=='play'&&G.phase=='play';
 return `<div class="box mtb${k==G.turn&&G.phase=='play'?' on':''}${o.out?' out':''}" data-tbl="${k}" style="--c:${COL[k%10]}"><div class="mth">${chip(k)}<b>${nm(k)}${k==V.me?' (tú)':''}</b><span class="msets">Sets ${mdSets(k)}/${G.opts.sets}</span></div>`
  +(o.out?'<div class="top">Expulsado.</div>':`<div class="mbank"><b>🏦 Banco $${tot}M</b> <span class="top">(${bank.length} cartas)</span><div class="mbc">${bank.map(x=>mdc(x,{sm:1})).join('')}</div></div>${mdGroups(k,mine)}`)+'</div>'}
function mdTables(){const G=V.G,ord=[...G.players.keys()];if(V.me>0){ord.splice(V.me,1);ord.unshift(V.me)}return ord.map(mdTbl).join('')}
function mdMenu(){const G=V.G;if(mdSel==null)return '';const id=mdSel,c=mdCAT[id],play=G.step=='play'&&G.plays<3,B=(m,t,cl)=>`<button class="b${cl||''}" onclick='mdDo(${JSON.stringify(m)})'>${t}</button>`;let b='';
 if(mdFrom=='t'){const cur=Object.keys(G.tb[V.me]).find(k=>G.tb[V.me][k].includes(id));b=mdCols(c).filter(x=>x!=cur).map(x=>B({t:'move',id,col:x},'→ '+mdCN[x])).join('')||'<span class="top">No hay otro color disponible.</span>'}
 else if(G.step=='disc')b=B({t:'discard',id},'Descartar');
 else if(!play)b='<span class="top">No te quedan jugadas: termina tu turno.</span>';
 else if(c.t=='p')b=B({t:'prop',id},'Poner en mi mesa ('+mdCN[c.c]+')');
 else if(c.t=='w')b=mdCols(c).map(x=>B({t:'prop',id,col:x},'En '+mdCN[x])).join('');
 else{if(c.t=='a'&&c.k=='salida')b+=B({t:'go',id},'Pasa por la salida (robar 2)');b+=B({t:'bank',id},'Al banco $'+c.v+'M',' g');if(c.t!='m'&&!(c.k=='salida'))b+='<div class="top">Las acciones y rentas se activan en la siguiente etapa; por ahora van al banco.</div>'}
 return `<div class="box mdm"><div class="mdmh">${mdc(id,{sm:1})}<b>${esc(mdName(id))}</b></div>${b}<button class="b g sm2" onclick="mdSel=null;render()">Cancelar</button></div>`}
function mdBody(){const G=V.G,i=V.me,t=G.turn,mine=i==t;
 if(G.phase=='final'){const w=G.win;return `<h1>🏆 ${w>=0?nm(w):'—'} gana</h1><div class="box" style="font-size:1.2em">${w>=0&&w==i?'¡Juntaste '+G.opts.sets+' sets completos! 🎉':'Juntó '+G.opts.sets+' sets completos.'}</div>${mdTables()}<button class="b" onclick="send({t:'reset'})">Nueva partida</button><button class="b g" onclick="leave()">Salir</button>${plist()}`}
 const h=i>=0?G.hands[i]:[];
 if(!mine||(mdFrom=='h'&&!h.includes(mdSel))||(mdFrom=='t'&&!(G.tb[i]&&Object.values(G.tb[i]).some(a=>a.includes(mdSel)))))mdSel=null;
 const pl=mine&&G.step=='play',dis=mine&&G.step=='disc',left=3-G.plays;
 const st=i<0?'Mirando como host.':dis?`Descarta ${h.length-7} carta${h.length-7>1?'s':''} para quedarte con 7.`:mine?`Te ${left==1?'queda':'quedan'} <b>${left}</b> jugada${left==1?'':'s'}. Toca una carta de tu mano.`:'Esperando a '+nm(t)+'…';
 let o=`<div class="top${mine?' myturn':''}">Turno de <b>${nm(t)}</b>${mine?' (¡tú!)':''} · Jugadas ${G.plays}/3 · Gana quien junte <b>${G.opts.sets}</b> sets${G.note?'<br><b>'+esc(G.note)+'</b>':''}</div>${seats(k=>`<span class="dn">Sets ${mdSets(k)}/${G.opts.sets}</span>`)}
 <div class="box piles felt"><div class="pile"><small>Mazo (${G.deck})</small><div class="c bk" id="deck">🂠</div></div><div class="pile"><small>Descarte</small>${G.disc.length?mdc(G.disc[G.disc.length-1],{id:'disc',nw:G.disc[G.disc.length-1]!==prevTop}):'<div class="c md empty" id="disc"></div>'}</div><div class="top pstat">${st}${pl?`<br><button class="b" onclick="send({t:'end'})">${h.length>7?'Terminar (descartar '+(h.length-7)+')':'Terminar turno'}</button>`:''}</div></div>`;
 o+=mdMenu()+`<div class="msg">${msg}</div>`;
 if(i>=0)o+=`<div class="top">Tus cartas (${h.length}):</div><div id="hand">${mdDisp(h).map(id=>mdc(id,{did:id,sel:id==mdSel&&mdFrom=='h',nw:prevHand.size&&!prevHand.has(id),on:`mdPick(${id})`})).join('')}</div><div><button class="b g sm2" onclick="cyc()">Ordenar: ${manual?'a mi orden':sortS?'por valor':'por tipo'}</button></div>`;
 return o+logv()+mdTables()+`<button class="b g sm2" onclick="mute=!mute;render()">${mute?'🔇 Sonido':'🔊 Sonido'}</button><details><summary>Jugadores</summary>${plist()}</details>`+(V.host?`<button class="b g sm2" onclick="if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}">Cerrar sala</button>`:'')+mdRules}
const mdRules=`<details><summary>Reglas</summary>Gana quien primero junte <b>3 sets completos de colores distintos</b> (el host puede cambiarlo de 2 a 4). Cada turno robas 2 cartas (5 si te quedaste sin cartas), juegas hasta 3 cartas y al terminar descartas hasta quedarte con 7.<br><b>Qué puedes jugar:</b> dinero y acciones al banco (una acción en el banco ya no se recupera), propiedades a tu mesa por color, y comodines de propiedad en cualquiera de sus colores. Mover un comodín de color en tu mesa durante tu turno no cuenta como jugada. Un set está completo con: café 2, celeste 3, rosa 3, naranja 3, rojo 3, amarillo 3, verde 3, azul 2, ferrocarril 4, servicio 2. Todas las propiedades de un color se agrupan en un solo conjunto.<br><b>Pasa por la salida:</b> robas 2 cartas. El banco y la mesa de todos son visibles. Las acciones (renta, cobro, cumpleaños, ladrón, trato forzoso, trato sucio, casa, hotel, doble renta y «Di que no») se agregan en las siguientes etapas.</details>`;
function mdLobby(host){const o=V.opts||{},s=host?[2,3,4].map(n=>`<button class="b g sm2${o.sets==n?' on':''}" onclick="send({t:'opts',o:{sets:${n}}})">${n}</button>`).join(''):`<b>${o.sets}</b>`;
 return `<div class="box"><b>Reglas de esta sala</b><br>Sets completos para ganar: ${s}${host?'<div class="top">Oficial: 3 sets de colores distintos.</div>':''}</div>`+(host?`<button class="b" ${V.players.length<2?'disabled':''} onclick="send({t:'start'})">Empezar partida</button>`:'')}
GM.monopolydeal={name:'Monopoly Deal',emoji:'💰',max:5,rules:mdRules,lobby:mdLobby,body:mdBody,
 face:id=>({h:mdIn(id),cls:'md m'+mdCAT[id].t}),
 win:(n,fin)=>{const w=n.win;if(!fin||w<0)return;const me=w==V.me;sfx('win');banner(me?'🏆 ¡Ganaste!':'🏆 '+n.players[w].name+' ganó');confetti(me?90:35)},
 after:()=>{const G=V.G;if(G&&G.phase=='play'){prevHand=new Set(Array.isArray(G.hands[V.me])?G.hands[V.me]:[]);prevTop=G.disc[G.disc.length-1]}}};
