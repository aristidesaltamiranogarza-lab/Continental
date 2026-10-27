// Conecta 4 como juego de la sala: tablero en HTML (las reglas están en g_c4.js). Se registra en GM.c4
(function(){
const COLS=['#e53935','#f9c623'],rules='Junta 4 fichas de tu color en línea: horizontal, vertical o diagonal. Toca una columna para soltar tu ficha; cae hasta el fondo. Si se llena el tablero sin ganador, es empate.';
const disc=k=>`<i class="c4d" style="--c:${COLS[k]}"></i>`;
const who=k=>{const G=V.G;return `<div class="seat c4pl${G.phase=='play'&&G.turn==k?' on':''}" data-seat="${k}">${disc(k)}<b>${esc(G.players[k].name)}${k==V.me?' (tú)':''}</b><span class="c4sc">${G.sc[k]}</span></div>`};
function body(){const G=V.G,me=V.me,mine=G.phase=='play'&&G.turn==me,win=new Set(G.line||[]);
 const st=G.phase=='final'?(G.win<0?'Empate: se llenó el tablero':G.win==me?'🏆 ¡Ganaste!':'🏆 Ganó '+nm(G.win)):mine?`${disc(me)} <b>¡Tu turno!</b> Toca una columna`:me<0?mirTxt():'Turno de '+nm(G.turn)+'…';
 let h=`${H1('🔴 Conecta 4')}<div class="c4top">${who(0)}<span class="vs">vs</span>${who(1)}</div><div class="top${mine?' myturn':''}">${st}</div><div class="c4b${mine?' go':''}">`;
 for(let c=0;c<7;c++){h+=`<button class="c4c" onclick="c4x(${c})"${mine?'':' disabled'} aria-label="Columna ${c+1}">`;
  for(let r=5;r>=0;r--){const x=r*7+c,v=G.b[x];h+=`<i class="c4h${v?' f':''}${win.has(x)?' w':''}${x===G.last?' nw':''}"${v?` style="--c:${COLS[v-1]};--r:${6-r}"`:''}></i>`}h+='</button>'}
 h+='</div>';if(G.phase=='final')h+=`<button class="b" onclick="send({t:'reset'})">🔄 Otra partida</button><button class="b g" onclick="leave()">Salir</button>`;
 return h+logv()+`<div class="msg">${msg}</div>`+plist()+`<details><summary>Reglas</summary>${rules}</details>`}
window.c4x=c=>send({t:'drop',c});
GM.c4={name:'Conecta 4',emoji:'🔴',max:2,rules:`<details><summary>Reglas</summary>${rules}</details>`,
 lobby:host=>host?`<div class="box"><b>Bots</b><br><button class="b g sm2" ${V.players.length>=2?'disabled':''} onclick="send({t:'addbot'})">🤖 Jugar contra un bot</button></div><button class="b" ${V.players.length!=2?'disabled':''} onclick="send({t:'start'})">Empezar partida</button>`:'',
 body,face:()=>({h:''}),
 win:(n,fin)=>{if(!fin)return;if(n.win<0){sfx('tick');banner('Empate');return}const me=n.win==V.me;sfx('win');banner(me?'🏆 ¡Ganaste!':'🏆 '+n.players[n.win].name+' ganó');confetti(me?80:30)}};
})();
