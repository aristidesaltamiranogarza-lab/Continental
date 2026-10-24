// Uno: interfaz del cliente. Se registra en GM.uno. Reutiliza sala, chat, sonidos, animaciones y arrastre de game.js
const UCN=['Rojo','Amarillo','Verde','Azul'],UCH=['#d32f2f','#f9a825','#2e9e4a','#1e6bd6'];
const U=id=>{if(id>=100)return{id,c:4,t:id<104?'w':'f',n:-1};const c=Math.floor(id/25),k=id%25;
 if(k==0)return{id,c,t:'n',n:0};if(k<=18)return{id,c,t:'n',n:Math.ceil(k/2)};return{id,c,t:k<=20?'s':k<=22?'r':'d',n:-1}};
const usym=c=>c.t=='n'?c.n:c.t=='s'?'⊘':c.t=='r'?'⇄':c.t=='d'?'+2':c.t=='w'?'★':'+4';
const uval=c=>c.t=='n'?c.n:{s:10,r:11,d:12,w:13,f:14}[c.t];
function ucard(c,o={}){const s=usym(c);return `<div class="c u${c.c}${o.sm?' sm':''}${o.nw?' nw':''}${o.dim?' dim':''}${String(s).length>1?' l2':''}"${c.c<4?` data-cl="${'RAVZ'[c.c]}"`:''}${o.id?` id="${o.id}"`:''}${o.did!=null?` data-id="${o.did}"`:''}${o.on?` onclick="${o.on}"`:''}><span>${s}</span><i class="k1">${s}</i><i class="k2">${s}</i></div>`}
// ¿Se puede jugar? (misma regla que el servidor; el servidor es quien valida)
function uok(id){const G=V.G,h=G.hands[V.me],c=U(id);
 if(G.step=='drawn'&&id!=G.drawn)return false;
 if(G.pend>0)return c.t=='f'||(c.t=='d'&&G.pendT=='d');
 if(c.t=='w')return true;if(c.t=='f')return !h.some(x=>U(x).c==G.color);if(c.c==G.color)return true;
 const t=U(G.disc[G.disc.length-1]);return t.c<4&&c.t==t.t&&(c.t!='n'||c.n==t.n)}
const udisp=()=>V.G.hands[V.me].map(U).sort(manual?(a,b)=>oi(a)-oi(b):sortS?(a,b)=>uval(a)-uval(b)||a.c-b.c:(a,b)=>a.c-b.c||uval(a)-uval(b));
function uplay(id){if(Date.now()-noClick<300)return;const G=V.G;
 if(V.me!=G.turn)return bad('No es tu turno.');
 if(Date.now()<cdEnd)return;
 if(U(id).c==4){if(!uok(id))return bad('Esa carta no se puede jugar ahora.');upick=id;render();return}
 send({t:'play',id})}
function ucol(k){const id=upick;upick=null;render();send({t:'play',id,col:k})}
const udraw=()=>{if(V.me!=V.G.turn)return bad('No es tu turno.');send({t:'draw'})};
const upass=()=>send({t:'pass'}),uuno=()=>send({t:'uno'}),ucatch=()=>send({t:'catch'});
const unoRules=`<details><summary>Reglas</summary>Gana quien se quede sin cartas. Cada quien empieza con 7. Juegas una carta del mismo color, número o símbolo que la de arriba del descarte; los comodines se juegan siempre (eliges el color). El comodín +4 solo se puede jugar si no tienes cartas del color actual. Si no puedes jugar, robas: si la carta robada se puede jugar, la juegas o pasas.<br>Salto: el siguiente pierde su turno. Reversa: cambia el sentido (con 2 jugadores funciona como salto). +2: el siguiente roba 2 y pierde su turno. +4: el siguiente roba 4 y pierde su turno.<br><b>Uno:</b> el botón «¡UNO!» siempre está a la vista, pero solo se activa cuando te queda exactamente 1 carta. Al quedarte con 1 carta tienes 1.5 segundos para tocarlo sin riesgo. Pasado ese tiempo, si alguien toca «Cobrar UNO» y no lo dijiste, robas 2 cartas. Un cobro hecho antes de los 1.5 segundos también cuenta: se aplica justo al cumplirse. Solo se puede cobrar a un jugador a la vez (el último que se quedó con 1 carta).<br><b>Reglas del host:</b> «Acumular»: si te lanzan un +2 puedes responder con otro +2 (o un +4), y a un +4 solo con otro +4; el que no pueda acumular roba todo lo acumulado. «Robar hasta poder jugar»: robas hasta sacar una carta jugable.</details>`;
function ulobby(host){const o=V.opts||{},t=(k,n)=>host?`<button class="b g sm2${o[k]?' on':''}" onclick="send({t:'opts',o:{${k}:${!o[k]}}})">${n}: ${o[k]?'Sí':'No'}</button>`:`<div class="top">${n}: <b>${o[k]?'Sí':'No'}</b></div>`;
 return `<div class="box"><b>Reglas de esta sala</b><br>${t('stack','Acumular +2 / +4')}${t('until','Robar hasta poder jugar')}${host?'<div class="top">Acumular: +2 sobre +2, +4 sobre +2 o +4; nunca +2 sobre +4.</div>':''}</div>`
  +(host?`<button class="b" ${V.players.length<2?'disabled':''} onclick="send({t:'start'})">Empezar partida</button>`:'')}
function ubody(){const G=V.G,i=V.me;document.documentElement.dataset.ucol=G.color;
 if(G.phase=='final'){const w=G.win;return `<h1>🏆 ${w>=0?nm(w):'—'} gana</h1><div class="box" style="font-size:1.2em">${w>=0&&w==i?'¡Te quedaste sin cartas! 🎉':'Se quedó sin cartas.'}</div><div class="box">${G.players.map((p,k)=>`<div>${chip(k)}${esc(p.name)}: ${V.players[k].out?'expulsado':hc(k)+' cartas'}</div>`).join('')}</div><button class="b" onclick="send({t:'reset'})">Nueva partida</button><button class="b g" onclick="leave()">Salir</button>${plist()}`}
 const t=G.turn,mine=i==t,drawn=mine&&G.step=='drawn',pend=G.pend>0,h=i>=0?G.hands[i]:[];
 if(!mine)upick=null;
 let st=i<0?'Mirando como host.':!mine?'Esperando a '+nm(t)+'…':drawn?'Juega la carta que robaste o pasa.':pend?`Acumula con un ${G.pendT=='d'?'+2 o +4':'+4'} o roba ${G.pend}.`:'Juega una carta o roba del mazo.';
 const vk=i>=0&&G.vuln&&G.vuln.k!=i&&hc(G.vuln.k)==1&&!G.uno[G.vuln.k]?G.vuln.k:-1,my1=i>=0&&h.length==1&&!G.uno[i],said=i>=0&&h.length==1&&!!G.uno[i];
 let o=`<div class="top${mine?' myturn':''}">Turno de <b>${nm(t)}</b>${mine?' (¡tú!)':''} · ${G.dir>0?'↻':'↺'} · Color <i class="ucol" style="background:${UCH[G.color]}"></i> ${UCN[G.color]}${pend?` · <b>Acumulado +${G.pend}</b>`:''}${G.note?'<br><b>'+esc(G.note)+'</b>':''}</div>${seats(k=>G.uno[k]&&hc(k)==1?'<span class="dn">¡UNO!</span>':'')}
 <div class="box piles felt"><div>Mazo (${G.deck})<br>${mine&&G.step=='play'?`<div class="c bk" id="deck" onclick="udraw()">🂠</div>`:'<div class="c sm bk" id="deck">🂠</div>'}</div><div>Descarte<br>${ucard(U(G.disc[G.disc.length-1]),{id:'disc',nw:G.disc[G.disc.length-1]!==prevTop})}</div><div class="top">${st}<br>${mine&&G.step=='play'&&pend?`<button class="b" onclick="udraw()">Robar ${G.pend}</button>`:''}${drawn?'<button class="b" onclick="upass()">Pasar</button>':''}</div></div>
 ${i>=0?`<div class="box unobox"><button class="b uno big${my1?' pulse':''}" ${my1?'':'disabled'} onclick="uuno()">${said?'¡UNO! ✔':'¡UNO!'}</button><button class="b g ucatch" ${vk>=0?'':'disabled'} onclick="ucatch()">${vk>=0?'Cobrar UNO a '+nm(vk):'Cobrar UNO'}</button></div>`:''}${logv()}<div class="msg">${msg}</div>`;
 if(upick!=null)o+=`<div class="box upick"><b>Elige el color:</b><br>${UCH.map((c,k)=>`<button class="sw" data-l="${'RAVZ'[k]}" style="background:${c}" aria-label="${UCN[k]}" onclick="ucol(${k})"></button>`).join('')}<button class="b g sm2" onclick="upick=null;render()">Cancelar</button></div>`;
 if(i>=0)o+=`<div class="top">Tus cartas (${h.length}):</div><div id="hand">${udisp().map(c=>ucard(c,{did:c.id,nw:prevHand.size&&!prevHand.has(c.id),dim:mine&&!uok(c.id),on:`uplay(${c.id})`})).join('')}</div><div><button class="b g" onclick="cyc()">Ordenar: ${manual?'a mi orden':sortS?'por número':'por color'}</button></div>`;
 return o+`<button class="b g sm2" onclick="mute=!mute;render()">${mute?'🔇 Sonido':'🔊 Sonido'}</button><details><summary>🎨 Estilo</summary>${styleUI()}</details><details><summary>Jugadores</summary>${plist()}</details>`+(V.host?`<button class="b g sm2" onclick="if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}">Cerrar sala</button>`:'')+unoRules}
GM.uno={name:'Uno',emoji:'🎴',max:10,rules:unoRules,lobby:ulobby,body:ubody,
 face:id=>{const c=U(id);return {h:`<span>${usym(c)}</span>`,cls:'u'+c.c}},
 win:(n,fin)=>{const w=n.win;if(!fin||w<0)return;const me=w==V.me;sfx('win');banner(me?'🏆 ¡Ganaste!':'🏆 '+n.players[w].name+' ganó');confetti(me?90:35)},
 ev:e=>{if(e.t.startsWith('dijo')||e.t.startsWith('cobró'))banner(e.t.startsWith('dijo')?'¡UNO! '+V.G.players[e.k].name:'😈 '+V.G.players[e.k].name+' '+e.t)},
 after:()=>{const G=V.G;if(G&&G.phase=='play'){prevHand=new Set(Array.isArray(G.hands[V.me])?G.hands[V.me]:[]);prevTop=G.disc[G.disc.length-1]}}};
