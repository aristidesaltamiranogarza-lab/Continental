// c_gente.js — GENTE: quién está conectado, una sola lista para la casa 3D, el 2D y dentro de los juegos (SOCIAL.md S2/S3).
// El servidor manda q (gente() en server.js) en /casa y en cada /poll; aquí se guarda con GENTE.pon(q).
// GENTE.boton() es la pastilla (va arriba a la derecha, junto al menú, en todas las pantallas); el panel lo pone este módulo en <body>,
// así sale igual en todos lados. Si nadie la trajo hace rato (2D, bienvenida), manda un latido a /casa (piso '2d') para que los demás te vean.
// Se carga después de c_casa_hud.js (CHUD.av) y antes de c_casa3d.js. Estilos: .uh-drop/.uh-per de ui_casa.css.
(function(){
const I=n=>window.UI?UI.ico(n):'',es=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PISO={pb:'Planta baja',sot:'Sótano',alta:'Planta alta',ter:'Terraza',cm1:'Sótano',c0:'Planta baja',c1:'Planta alta',c2:'Azotea','2d':'En 2D'};
const VERBO={play:'Jugando',lobby:'Esperando',fin:'Jugando',mira:'Mirando'};
const nomJ=k=>window.lobbyName?lobbyName(k):(typeof GM!='undefined'&&GM[k]&&GM[k].name)||k;
let q=null,abierto=false,sig='',t=0;
const yoN=()=>(typeof pname=='string'&&pname.trim())||'Tú';
// la lista: tú primero, luego los que juegan, luego el resto
function lista(){const L=(q||[]).slice();if(!L.some(p=>p.yo))L.push({n:yoN(),yo:1,f:window.CASA3D&&CASA3D.on&&CASA3D.on()?'':'2d'});
 const r=p=>p.yo?0:p.g?1:2;return L.sort((a,b)=>r(a)-r(b))}
const donde=p=>p.g?`${VERBO[p.st]||'En'} ${nomJ(p.g)}`:PISO[p.f]||'En la casa';
const av=n=>window.CHUD&&CHUD.av?CHUD.av(n):`<i class="gen-av">${es((Array.from(String(n||'?'))[0]||'?').toUpperCase())}</i>`;
function n(){return lista().length}
function boton(){const k=n();return `<button class="ui-pill gen-b" onclick="GENTE.tog()" aria-label="Quién está conectado: ${k}" aria-expanded="${abierto}">${I('gente')}<span class="gen-n">${k}</span></button>`}
function panel(){const L=lista();
 return `<div class="ui-scrim uh-clear" onclick="GENTE.tog(0)"></div><div class="ui ui-card uh-drop" role="dialog" aria-label="Quién está conectado"><span class="ui-lbl">Conectados · ${L.length}</span>${L.map(p=>`<div class="uh-per">${av(p.n)}<span><b>${es(p.n)}${p.yo?' <small class="ui-sub">(tú)</small>':''}</b><small class="ui-sub">${es(donde(p))}</small></span></div>`).join('')}</div>`}
function pinta(){let el=document.getElementById('genteP');
 if(!abierto){if(el)el.remove();return}
 if(!el){el=document.createElement('div');el.id='genteP';el.className='ui';document.body.appendChild(el)}
 el.innerHTML=panel()}
// el número de las pastillas se cambia en su lugar, sin volver a dibujar la pantalla
function numeros(){const k=String(n());document.querySelectorAll('.gen-b .gen-n').forEach(e=>{if(e.textContent!==k)e.textContent=k});
 document.querySelectorAll('.gen-b').forEach(b=>{b.setAttribute('aria-label','Quién está conectado: '+k);b.setAttribute('aria-expanded',abierto)})}
function pon(x){if(!Array.isArray(x))return;q=x;t=Date.now();const s=JSON.stringify(x);if(s===sig)return;sig=s;numeros();if(abierto)pinta()}
function tog(v){abierto=v==null?!abierto:!!v;if(typeof sfx=='function')try{sfx('tick')}catch(e){}pinta();numeros()}
// latido: si nadie trajo la lista en 3.5 s (la casa 3D la trae cada 0.3 s; el /poll de la sala solo cuando algo cambia), cada 4 s.
// En una sala el servidor te pone "Jugando …" aunque aquí diga '2d' (la sala gana); la casa 3D no dibuja a los '2d'.
async function latido(){if(Date.now()-t<3500||document.hidden||typeof api!='function'||typeof ME=='undefined')return;
 try{const d=await api('casa',{id:'w'+String(ME).slice(0,12),name:yoN()==='Tú'?'Jugador':yoN(),av:window.AV&&AV.mio?AV.mio():'',x:0,z:0,yaw:0,w:0,f:'2d'});pon(d.q)}catch(e){}}
setInterval(latido,4000);setTimeout(latido,600);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&abierto)tog(0)});
window.GENTE={pon,boton,tog,n,lista,donde};
})();
