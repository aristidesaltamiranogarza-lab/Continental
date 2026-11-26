// Mérida en Venta: base del cliente (fichas, sala, reglas, subasta, festejo). Se registra en GM.merida; datos en merida_data.js (window.MERD).
// La pantalla de juego es c_meridaui.js con c_merida2d.js / c_merida3d.js. Usa sala, chat y sonidos de game.js (send, render, sfx, banner...).
(function(){
const D=window.MERD;if(!D||typeof GM==='undefined'){console.warn('Mérida: falta merida_data.js');return}
const B=D.board,GR=[];B.forEach((s,i)=>{if(s.t=='p')(GR[s.g]=GR[s.g]||[]).push(i)});

const $m=v=>'$'+Number(v||0).toLocaleString('es-MX'),pc=k=>D.pcol[k%6],FI=D.tok.map(t=>t[1]);
// ficha de cada asiento: la que eligió en la sala (el servidor no deja repetir); los que no eligieron (bots) toman las libres en orden
function ti(k){const ps=(typeof V!='undefined'&&V.players)||[],n=Math.max(ps.length,k+1),r=[],us=new Set();
 for(let j=0;j<n;j++){const i=FI.indexOf((ps[j]||{}).fi);if(i>=0&&!us.has(i)){r[j]=i;us.add(i)}}
 let f=0;for(let j=0;j<n;j++)if(r[j]==null){while(us.has(f))f++;r[j]=f;us.add(f)}return r[k]%FI.length}
const tk=k=>MIC.h(D.tok[ti(k)][1]);
// elegir ficha en la sala de espera (SALA: botón Ficha); se recuerda para la próxima
const fiMia=()=>{try{return localStorage.getItem('mr_ficha')||''}catch(e){return ''}};
const fiTom=()=>new Set((V.players||[]).filter((p,j)=>j!==V.me&&!p.out&&p.fi).map(p=>p.fi));
function fiSel(id){try{localStorage.setItem('mr_ficha',id)}catch(e){}if(fiTom().has(id)||V.G)return;send({t:'fi',fi:id})}
let fiPed='';function fiAuto(){const yo=(V.players||[])[V.me],q=fiMia();if(!yo||V.G||!q||yo.fi===q||fiPed===q||fiTom().has(q))return;fiPed=q;send({t:'fi',fi:q})}
const ficha={key:()=>JSON.stringify((V.players||[]).map(p=>p.fi||''))+V.me,ico:()=>tk(V.me),
 html:()=>{const tom=fiTom(),mia=FI[ti(V.me)];return `<div class="sl-cajas sl-fi">${D.tok.map(([n,id],i)=>`<button class="sl-caja${id===mia?' on':''}" style="--f:var(--sl-c)"${tom.has(id)?' disabled':''} onclick="MR.fiSel('${id}')" aria-pressed="${id===mia}"><span class="ic"><i class="sl-spr" style="background-image:url(modelos/merida/fichas_ico.webp?v=2);background-position-x:${i*100/(D.tok.length-1)}%"></i></span><b>${esc(n)}</b></button>`).join('')}</div>`}};
let aucEnd=0,aucId=-1,winN=-1;
// ---- lobby y reglas ----
const OPN=[['auc','Subasta si nadie compra'],['even','Construcción pareja'],['mort','Hipotecas (50% del precio)'],['dbl','x2 renta con grupo completo'],['pot','Bote de vacaciones'],['jr','Sin renta si el dueño está en la cárcel'],['qa','Abandono: sus propiedades se subastan']];
function lobby(host){fiAuto();const o=V.opts||{},t=([k,n])=>host?`<button class="b g sm2${o[k]?' on':''}" onclick="send({t:'opts',o:{${k}:${!o[k]}}})">${n}: ${o[k]?'Sí':'No'}</button>`:`<div class="top">${n}: <b>${o[k]?'Sí':'No'}</b></div>`;
 const cs=[1000,1500,2000,2500,3000].map(v=>host?`<button class="b g sm2${o.cash==v?' on':''}" onclick="send({t:'opts',o:{cash:${v}}})">${$m(v)}</button>`:'').join('');
 return `<div class="box"><b>Reglas de esta sala</b><br>${OPN.map(t).join('')}<div class="top">Dinero inicial: <b>${$m(o.cash)}</b></div>${cs}<div class="top">Duración: <b>${o.tl?o.tl+' min (gana la mayor fortuna)':'Hasta que quede uno'}</b></div>${host?[0,30,45,60].map(v=>`<button class="b g sm2${(o.tl||0)==v?' on':''}" onclick="send({t:'opts',o:{tl:${v}}})">${v?v+' min':'Sin límite'}</button>`).join(''):''}</div>`
  +(host?`<div class="box"><b>Bots</b><br><button class="b g sm2" ${V.players.length>=6?'disabled':''} onclick="send({t:'addbot'})">Agregar bot</button><div class="top">Juegan solos. Para quitar uno, usa «Expulsar» en la lista.</div></div><button class="b" ${V.players.length<2?'disabled':''} onclick="send({t:'start'})">Empezar partida</button><div class="top">De 2 a 6 jugadores.</div>`:'')}
const rules=`<details><summary>Reglas</summary>Juego de compra y renta en Mérida. Gana el último que no quiebre. Todos empiezan con el dinero de la sala (normalmente $1,500) y cobran $200 cada vez que pasan por la Salida.
 En tu turno tiras dos dados y avanzas. Si caes en una propiedad sin dueño puedes comprarla; si no, se subasta (si la regla está prendida). Si tiene dueño, le pagas renta.
 Con todas las colonias de un grupo puedes construir casas (hasta 4) y después un hotel: la renta sube mucho. Las rutas del Va y Ven cobran $25, $50, $100 o $200 según cuántas tenga el dueño. CFE y JAPAY cobran 4 veces los dados (10 veces si el dueño tiene las dos).
 Con dobles vuelves a tirar; tres dobles seguidos te mandan a la cárcel. Para salir: pagas $50, usas una tarjeta o intentas sacar dobles (a los 3 intentos pagas y sales).
 Si no te alcanza para pagar, vende casas, hipoteca (si está prendido) o haz tratos; si aun así no juntas el dinero, quiebras. En los tratos puedes ofrecer pesos, propiedades y tarjetas para salir de la cárcel.</details>`;
function body(){return '<p style="padding:16px">No se pudo mostrar la partida. Recarga la página.</p>'}   // solo si falla la interfaz de c_meridaui.js
// cuenta regresiva de la subasta sin esperar al servidor
setInterval(()=>{const e=document.getElementById('mraT');if(e)e.textContent=Math.max(0,Math.ceil((aucEnd-Date.now())/1000))},250);
function after(){const G=V.G;if(!G)return;if(G.auc){if(G.auc.id!==aucId||G.auc.left>0){aucEnd=Date.now()+G.auc.left;aucId=G.auc.id}}}
window.MR={D,B,GR,pc,tk,ti,fiSel,$m,bid:v=>{v=Math.floor(+v||0);if(v<=0)return;send({t:'bid',v})}};
GM.merida={name:'Mérida en Venta',emoji:'',max:6,rules,lobby,ficha,body,face:()=>({h:''}),fx:()=>true,after,
 win:(n,fin)=>{if(!fin||winN===n.ln)return;winN=n.ln;const w=n.win,me=w===V.me;sfx('win');banner(me?'¡Ganaste!':''+(w>=0?n.players[w].name:'')+' ganó');confetti(me?90:35)},
 ev:e=>{if(/^ganó/.test(e.t)||/^¡Subasta/.test(e.t))banner((e.k>=0?V.G.players[e.k].name+' ':'')+e.t)}};
})();
