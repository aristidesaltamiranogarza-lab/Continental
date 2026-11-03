// Rummy de fichas: registro en GM.rummy (lobby y reglas). Reglas puras en rummy_reglas.js (window.RUMMY).
// La mesa y el HUD los pone c_rummyui.js (con c_rummy2d.js); este body solo se ve si esos no cargan.
(function(){
const RU=window.RUMMY;if(!RU||typeof GM==='undefined'){console.warn('Rummy: falta rummy_reglas.js');return}
const rules=`<details><summary>Reglas</summary>${RU.TOT} fichas: dos juegos del 1 al 13 en ${RU.COL.join(', ')} y 2 comodines. Cada quien empieza con 14; el resto va a la bolsa.
<br>Combinaciones de 3 o más: serie (mismo número, colores distintos) o escalera (mismo color y seguidos; el 1 va solo antes del 2).
<br>Primera bajada: ${RU.MIN1} puntos o más solo con fichas de tu atril. Después puedes agregar y reacomodar toda la mesa, si al final todo queda válido y pusiste al menos una ficha.
<br>El comodín se recupera poniendo la ficha que representa y se usa en el mismo turno. Si no juegas, se te acaba el tiempo o la mesa queda mal, robas 1.
<br>Gana quien se quede sin fichas. Si se acaba la bolsa y nadie puede jugar, gana quien tenga menos puntos en mano (el comodín vale ${RU.JV}).</details>`;
function lobby(host){const o=V.opts||{},row=(k,n,L,f)=>`<div class="top">${n}: <b>${f(o[k])}</b></div>`+(host?L.map(v=>`<button class="b g sm2${o[k]===v?' on':''}" onclick="send({t:'opts',o:{${k}:${JSON.stringify(v)}}})">${f(v)}</button>`).join(''):'');
 return `<div class="box"><b>Reglas de esta sala</b><br>`+row('t','Tiempo por turno',[30,45,60,90],v=>v+' s')+`</div>`
  +(host?`<button class="b" ${V.players.length<2?'disabled':''} onclick="send({t:'start'})">Empezar partida</button><div class="top">De 2 a 5 jugadores, sin bots.</div>`:'')}
const body=()=>`<div class="box"><b>🀄 Rummy</b><p>No se pudo cargar la mesa. Recarga la página.</p></div>`;
GM.rummy={name:'Rummy',emoji:'🀄',max:5,rules,lobby,body,face:()=>({h:''})};
})();
