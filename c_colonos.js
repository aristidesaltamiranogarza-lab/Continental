// Colonos: registro en GM.colonos (lobby y reglas). Datos y reglas de lugar en colonos_data.js (window.COLD); servidor en g_colonos.js.
// La mesa 2D la dibujan c_colonos2d.js (CO2: tablero), c_colonos_ui.js (COU: tus cartas, bandeja, botón, rivales) y c_colonos_fx.js (COFX: animaciones).
(function(){
const D=window.COLD;if(!D||typeof GM==='undefined'){console.warn('Colonos: falta colonos_data.js');return}
const rules=`<details><summary>Reglas</summary>Funda poblados en la isla, cosecha madera, ladrillo, lana, trigo y mineral, y comercia. Gana quien llegue a los puntos de la sala en su turno.
<br>Camino: madera + ladrillo · Poblado (1 punto): madera + ladrillo + lana + trigo · Ciudad (2 puntos, cosecha doble): 2 trigo + 3 mineral · Carta: lana + trigo + mineral.
<br>Al inicio cada quien pone dos poblados con su camino (ida y vuelta); el segundo cobra una carta de cada terreno que toca.
<br>Con 7: quien tenga más de 7 cartas descarta la mitad; quien tiró mueve el ladrón (ese terreno no cosecha) y roba una carta a alguien de ahí.
<br>Banco 4:1; con puerto 3:1, o 2:1 del recurso del puerto. Solo se comercia con quien tiene el turno.
<br>Ruta más larga (5+ caminos seguidos) y Ejército más grande (3+ caballeros) dan 2 puntos. Con 5 o 6 jugadores la isla es más grande y, al terminar cada turno, los demás pueden construir.</details>`;
function lobby(host){const o=V.opts||{},row=(k,n,L,f)=>`<div class="top">${n}: <b>${f(o[k])}</b></div>`+(host?L.map(v=>`<button class="b g sm2${o[k]===v?' on':''}" onclick="send({t:'opts',o:{${k}:${JSON.stringify(v)}}})">${f(v)}</button>`).join(''):'');
 return `<div class="box"><b>Reglas de esta sala</b><br>`+row('pts','Puntos para ganar',[8,10,12],v=>v)+row('fijo','Isla',[false,true],v=>v?'Fija (primera partida)':'Al azar')
  +row('hl','Con 7 descartan con más de',[7,8,9],v=>v+' cartas')+row('n','Jugadores en la mesa',[3,4,5,6],v=>v)+`<div class="top">Los bots llenan los lugares vacíos.</div></div>`
  +(host?`<button class="b" onclick="send({t:'start'})">Empezar partida</button><div class="top">5 o 6 jugadores usan la isla grande.</div>`:'')}
const body=()=>`<div class="box"><b>Colonos</b><p>Cargando la mesa…</p></div>`;
GM.colonos={name:'Colonos',emoji:'',max:6,rules,lobby,body,face:()=>({h:''})};
})();
