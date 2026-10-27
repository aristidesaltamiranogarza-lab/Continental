// Haciendas de Yucatán: registro en GM.haciendas (lobby y reglas). Datos en haciendas_data.js (window.HACD).
// Etapa 1: solo servidor y bots; el tablero y el panel de juego llegan en la Etapa 2.
(function(){
const D=window.HACD;if(!D||typeof GM==='undefined'){console.warn('Haciendas: falta haciendas_data.js');return}
const rules=`<details><summary>Reglas</summary>Coloniza Yucatán: pon ranchos y sacbés, cosecha ${D.RES.join(', ')} y comercia. Gana quien llegue primero a los puntos de la sala en su turno.
<br>Sacbé: henequén + piedra · Rancho (1 punto): henequén + maíz + miel + sal · Hacienda (2 puntos, produce doble): 2 maíz + 3 piedra · Carta: maíz + miel + sal.
<br>Con 7 llega el huracán: quien tenga demasiadas cartas descarta la mitad, y quien tiró lo mueve y roba una carta. Sacbé real (5+ tramos) y Guardia mayor (3+ guardias) dan 2 puntos.
<br>Si pasan 10 rondas sin que cambien los puntos de nadie, gana quien tenga más.</details>`;
function lobby(host){const o=V.opts||{},row=(k,n,L,f)=>`<div class="top">${n}: <b>${f(o[k])}</b></div>`+(host?L.map(v=>`<button class="b g sm2${o[k]===v?' on':''}" onclick="send({t:'opts',o:{${k}:${JSON.stringify(v)}}})">${f(v)}</button>`).join(''):'');
 return `<div class="box"><b>Reglas de esta sala</b><br>`+row('pts','Puntos para ganar',[8,10,12,14],v=>v)+row('fijo','Tablero',[false,true],v=>v?'Fijo':'Aleatorio')
  +row('hl','Huracán: descartan con más de',[7,8,9],v=>v+' cartas')+row('vel','Velocidad de bots',[1,2,3],v=>['','Lenta','Normal','Rápida'][v])+`</div>`
  +(host?`<button class="b" ${V.players.length<3?'disabled':''} onclick="send({t:'start'})">Empezar partida</button><div class="top">De 3 a 6 jugadores (5 o 6 usan el tablero grande).</div>`:'')}
const body=()=>`<div class="box"><b>🌿 Haciendas de Yucatán</b><p>El tablero todavía está en construcción: por ahora solo juegan los bots en el servidor.</p></div>`;
GM.haciendas={name:'Haciendas de Yucatán',emoji:'🌿',max:6,rules,lobby,body,face:()=>({h:''})};
})();
