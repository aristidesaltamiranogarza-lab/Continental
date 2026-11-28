// c_gente.js — GENTE: quién está conectado, una sola lista para la casa 3D, el 2D y dentro de los juegos (SOCIAL.md S2–S4).
// El servidor manda q (gente() en server.js) e inv (invitación para ti) en /casa y en cada /poll; aquí se guardan con GENTE.pon(q,inv).
// GENTE.boton() es la pastilla (va arriba a la derecha, junto al menú, en todas las pantallas); el panel y la tarjeta de invitación los pone
// este módulo en <body>, así salen igual en todos lados. Si nadie trajo la lista hace rato (2D, bienvenida), manda un latido a /casa (piso '2d').
// Invitar: estando en una sala, cada persona de la lista que no está en ella tiene "Invitar" (POST /inv). Se carga después de c_casa_hud.js
// (CHUD.av) y antes de c_casa3d.js. Estilos: .uh-drop/.uh-per y .gen-… de ui_casa.css.
(function(){
const I=n=>window.UI?UI.ico(n):'',es=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PISO={pb:'Planta baja',sot:'Sótano',alta:'Planta alta',ter:'Terraza',cm1:'Sótano',c0:'Planta baja',c1:'Planta alta',c2:'Azotea','2d':'En 2D'};
const VERBO={play:'Jugando',lobby:'Esperando',fin:'Jugando',mira:'Mirando'};
const INV_S=20;   // segundos que dura la tarjeta de invitación
const nomJ=k=>window.lobbyName?lobbyName(k):(typeof GM!='undefined'&&GM[k]&&GM[k].name)||k;
const snd=n=>{if(typeof sfx=='function')try{sfx(n)}catch(e){}};
let q=null,abierto=false,sig='',t=0,inv=null,invVisto='',invT=0;const ya={};   // ya[k]: cuándo lo invitaste
const yoN=()=>(typeof pname=='string'&&pname.trim())||'Tú';
const sala=()=>typeof S!='undefined'&&S&&typeof V!='undefined'&&V?V:null;
// la lista: tú primero, luego los que juegan, luego el resto
function lista(){const L=(q||[]).slice();if(!L.some(p=>p.yo))L.push({n:yoN(),yo:1,f:window.CASA3D&&CASA3D.on&&CASA3D.on()?'':'2d'});
 const r=p=>p.yo?0:p.g?1:2;return L.sort((a,b)=>r(a)-r(b))}
const donde=p=>p.g?`${VERBO[p.st]||'En'} ${nomJ(p.g)}`:PISO[p.f]||'En la casa';
const av=n=>window.CHUD&&CHUD.av?CHUD.av(n):`<i class="gen-av">${es((Array.from(String(n||'?'))[0]||'?').toUpperCase())}</i>`;
function n(){return lista().length}
function boton(){const k=n();return `<button class="ui-pill gen-b" onclick="GENTE.tog()" aria-label="Quién está conectado: ${k}" aria-expanded="${abierto}">${I('gente')}<span class="gen-n">${k}</span></button>`}
// sin sala: junto a quien está en una partida, Unirme (esperando) o Mirar (ya empezó) (SOCIAL.md S3)
function accion(p){const v=sala();if(p.yo||!p.k)return '';
 if(!v){if(!p.c)return '';return p.st==='lobby'?`<button class="ui-btn sec gen-x" onclick="GENTE.a('${es(p.c)}',0)">Unirme</button>`:`<button class="ui-btn sec gen-x" onclick="GENTE.a('${es(p.c)}',1)">${I('ojo')}Mirar</button>`}
 if(p.c===v.code)return '';
 return Date.now()-(ya[p.k]||0)<20000?`<button class="ui-btn sec gen-x" disabled>Invitado</button>`:`<button class="ui-btn sec gen-x" data-gk="${es(p.k)}" onclick="GENTE.invita('${es(p.k)}')">Invitar</button>`}
// filas para invitar fuera del panel (la tarjeta "Invita a tu gente" de la sala de espera): solo quien no está en tu sala
function invitables(){const v=sala();if(!v)return '';const L=lista().filter(p=>!p.yo&&p.k&&p.c!==v.code);
 return L.length?`<span class="ui-lbl">Conectados</span>${L.slice(0,6).map(p=>`<div class="uh-per">${av(p.n)}<span><b>${es(p.n)}</b><small class="ui-sub">${es(donde(p))}</small></span>${accion(p)}</div>`).join('')}`:''}
function panel(){const L=lista();
 return `<div class="ui-scrim uh-clear" onclick="GENTE.tog(0)"></div><div class="ui ui-card uh-drop" role="dialog" aria-label="Quién está conectado"><span class="ui-lbl">Conectados · ${L.length}</span>${L.map(p=>`<div class="uh-per">${av(p.n)}<span><b>${es(p.n)}${p.yo?' <small class="ui-sub">(tú)</small>':''}</b><small class="ui-sub">${es(donde(p))}</small></span>${accion(p)}</div>`).join('')}${filaAvisos()}</div>`}
function pinta(){let el=document.getElementById('genteP');
 if(!abierto){if(el)el.remove();return}
 if(!el){el=document.createElement('div');el.id='genteP';el.className='ui';document.body.appendChild(el)}
 el.innerHTML=panel()}
// el número de las pastillas se cambia en su lugar, sin volver a dibujar la pantalla
function numeros(){const k=String(n());document.querySelectorAll('.gen-b .gen-n').forEach(e=>{if(e.textContent!==k)e.textContent=k});
 document.querySelectorAll('.gen-b').forEach(b=>{b.setAttribute('aria-label','Quién está conectado: '+k);b.setAttribute('aria-expanded',abierto)})}
// ---------- invitación que te llega: tarjeta arriba al centro con Ir / Ahora no ----------
function tarjeta(){let el=document.getElementById('genteInv');
 if(!inv){if(el)el.remove();return}
 if(!el){el=document.createElement('div');el.id='genteInv';document.body.appendChild(el)}
 el.innerHTML=`<div class="ui ui-card gen-inv" role="alertdialog" aria-label="${es(inv.de)} te invita a ${es(nomJ(inv.g))}">${av(inv.de)}<span><b>${es(inv.de)}</b><small class="ui-sub">te invita a ${es(nomJ(inv.g))}</small></span>
  <div class="gen-acc"><button class="ui-btn ghost" onclick="GENTE.no()">Ahora no</button><button class="ui-btn" onclick="GENTE.ir()">${I('jugar')}Ir</button></div><i class="gen-t" style="animation-duration:${INV_S}s"></i></div>`}
function llega(x){if(!x||!x.c)return;const id=x.c+':'+x.n+':'+x.de;if(id===invVisto)return;invVisto=id;
 const v=sala();if(v&&v.code===x.c)return;   // ya estás en esa sala
 inv=x;invT=Date.now();tarjeta();snd('tick');if(document.hidden)llama(x);else dura(x)}
// la barra de 20 s corre desde que la ves: con la pestaña escondida se espera a que vuelvas
function dura(x){clearTimeout(dura.t);const b=document.querySelector('#genteInv .gen-t');if(b){b.style.animation='none';void b.offsetWidth;b.style.animation=''}
 dura.t=setTimeout(()=>{if(inv===x){inv=null;tarjeta()}},INV_S*1000)}
// pestaña en segundo plano: el título parpadea con la invitación y el teléfono vibra, hasta que regresas
let t0='',parpa=0;
function llama(x){if(!t0)t0=document.title;try{navigator.vibrate&&navigator.vibrate([180,90,180])}catch(e){}
 const msj=x.de+' te invita · '+nomJ(x.g);let k=0;clearInterval(parpa);document.title=msj;parpa=setInterval(()=>{document.title=++k%2?t0:msj},1000)}
document.addEventListener('visibilitychange',()=>{if(document.hidden)return;if(parpa){clearInterval(parpa);parpa=0;document.title=t0;t0=''}if(inv)dura(inv)});
function no(){inv=null;tarjeta();snd('tick')}
// Ir: si estás en otra sala, te levantas de ella (la partida sigue con un bot) y entras; si ya empezó, entras a mirar
function ir(){const x=inv;if(!x)return;inv=null;tarjeta();snd('tick');
 const v=sala();if(v){if(v.G&&v.me>=0&&v.G.phase!='final'&&typeof send=='function')try{send({t:'leave'})}catch(e){}if(typeof leave=='function')leave()}
 abierto=false;pinta();
 if(x.st==='play'&&typeof watchR=='function')watchR(x.c);else{code=x.c;if(typeof joinR=='function')joinR()}}
async function invita(k){ya[k]=Date.now();snd('tick');if(abierto)pinta();document.querySelectorAll('[data-gk]').forEach(b=>{if(b.dataset.gk===k){b.disabled=true;b.textContent='Invitado'}});
 try{const d=await api('inv',{k});if(d&&d.err){ya[k]=0;if(abierto)pinta();if(typeof banner=='function')banner(d.err)}}catch(e){ya[k]=0;if(abierto)pinta()}}
// ---------- avisos con el navegador cerrado (Web Push; srv_push.js y sw.js) ----------
const LS='gen_push',lsG=()=>{try{return localStorage.getItem(LS)==='1'}catch(e){return false}},lsS=v=>{try{localStorage.setItem(LS,v?'1':'0')}catch(e){}};
const pushOk=()=>'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window&&window.isSecureContext&&Notification.permission!=='denied';
const avisosOn=()=>lsG()&&Notification.permission==='granted';
function filaAvisos(){if(!pushOk())return '';return `<label class="ui-row gen-push"><span>Avisarme si me invitan</span><span class="ui-sw"><input type="checkbox" ${avisosOn()?'checked':''} onchange="GENTE.avisos(this.checked)" aria-label="Avisarme si me invitan"><i></i></span></label>`}
async function registro(){let r=await navigator.serviceWorker.getRegistration();if(!r)r=await navigator.serviceWorker.register('/sw.js');return navigator.serviceWorker.ready.then(()=>r)}
async function suscribe(pedir){const r=await registro();let sub=await r.pushManager.getSubscription();
 if(!sub){if(!pedir)return false;const {k}=await api('push_llave',{});sub=await r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:Uint8Array.from(atob(k.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))})}
 const d=await api('push',{ep:sub.endpoint});return !(d&&d.err)}
async function avisos(on){snd('tick');
 try{if(on){if(await Notification.requestPermission()!=='granted')throw 0;if(!await suscribe(true))throw 0;lsS(1)}
  else{lsS(0);const r=await navigator.serviceWorker.getRegistration(),sub=r&&await r.pushManager.getSubscription();if(sub)await sub.unsubscribe();await api('push',{off:1})}}
 catch(e){lsS(0);if(on&&typeof banner=='function')banner('No se pudieron activar los avisos.')}
 if(abierto)pinta()}
// al abrir el juego se vuelve a mandar la suscripción (el servidor la guarda en memoria y se pierde si se reinicia)
setTimeout(()=>{if(pushOk()&&avisosOn())suscribe(false).catch(()=>{})},2500);
// el aviso tocado con el juego abierto: sw.js pasa la invitación y sale la tarjeta
if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('message',e=>{const x=e.data&&e.data.inv;if(x&&x.c){invVisto='';llega(x)}});
// el aviso tocado con el juego cerrado: llega con ?inv=CODIGO (&mira=1 si ya empezó) y entra directo
(()=>{const u=new URLSearchParams(location.search),c=(u.get('inv')||'').toUpperCase().slice(0,5);if(!c)return;const mira=u.has('mira');
 try{u.delete('inv');u.delete('mira');history.replaceState(null,'',location.pathname+(u.toString()?'?'+u:'')+location.hash)}catch(e){}
 addEventListener('load',()=>setTimeout(()=>{if(mira&&typeof watchR=='function')watchR(c);else if(typeof joinR=='function'){code=c;joinR()}},900))})();
// ---------- avisos cortos (SOCIAL.md S6): "Ana llegó", "Ana abrió Uno"; 2 s, sin registro; dentro de un juego, más chicos ----------
let antes=null;
function aviso(txt){if(document.hidden)return;let box=document.getElementById('genAv');if(!box){box=document.createElement('div');box.id='genAv';box.setAttribute('aria-live','polite');document.body.appendChild(box)}
 while(box.children.length>1)box.firstChild.remove();
 const el=document.createElement('div');el.className='ui gen-av-t'+(sala()?' min':'');el.textContent=txt;box.appendChild(el);setTimeout(()=>el.remove(),2200)}
function cambios(x){const m={};x.forEach(p=>{if(p.k&&!p.yo)m[p.k]=p});const a=antes;antes=m;if(!a)return;
 const M=Object.values(m);if(M.length>6)return;   // de golpe muchos (reinicio del servidor): nada
 M.forEach(p=>{const o=a[p.k];if(!o)aviso(`${p.n} llegó`);else if(p.g&&p.st==='lobby'&&o.g!==p.g)aviso(`${p.n} abrió ${nomJ(p.g)}`)})}
function pon(x,iv){if(iv)llega(iv);if(!Array.isArray(x))return;q=x;t=Date.now();cambios(x);const s=JSON.stringify(x);if(s===sig)return;sig=s;numeros();if(abierto)pinta()}
function tog(v){abierto=v==null?!abierto:!!v;snd('tick');pinta();numeros()}
// latido: si nadie trajo la lista en 3.5 s (la casa 3D la trae cada 0.3 s; el /poll de la sala solo cuando algo cambia), cada 4 s.
// En una sala el servidor te pone "Jugando …" aunque aquí diga '2d' (la sala gana); la casa 3D no dibuja a los '2d'.
// Con el plano 2D en pantalla (c_plano2d.js) cada 2 s y con tu lugar junto a la mesa que tocaste; la respuesta (salas y gente) va al plano.
const plano=()=>window.PLANO2D&&PLANO2D.visible();
async function latido(ya){if(!ya&&Date.now()-t<(plano()?1500:3500)||typeof api!='function'||typeof ME=='undefined')return;
 const o=plano()?PLANO2D.pos():{f:'2d',x:0,z:0,yaw:0};
 try{const d=await api('casa',{id:'w'+String(ME).slice(0,12),name:yoN()==='Tú'?'Jugador':yoN(),av:window.AV&&AV.mio?AV.mio():'',x:o.x,z:o.z,yaw:o.yaw,w:0,f:o.f});pon(d.q,d.inv);if(window.PLANO2D)PLANO2D.casa(d)}catch(e){}}
setInterval(()=>latido(),2000);setTimeout(()=>latido(),600);
// pantallas con interfaz propia que aún no traen la pastilla (Rummy 2D, Ruleta 2D…; S3, hasta el marco común S7):
// si en una partida no se ve ninguna, GENTE pone la suya flotando arriba a la derecha, debajo de la barra del juego
function flota(){let f=document.getElementById('genFlota');const otra=[...document.querySelectorAll('.gen-b')].some(b=>!b.closest('#genFlota')&&b.offsetParent);
 const v=sala(),ver=!!v&&!otra&&!/^(merida)$/.test(v.game);   // Mérida y YuCATÁN: "Conectados" en su menú de Opciones
if(!ver){if(f)f.remove();return}
 if(!f){f=document.createElement('div');f.id='genFlota';f.className='ui';f.innerHTML=boton();document.body.appendChild(f)}}
setInterval(flota,1000);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(abierto)tog(0);else if(inv)no()}});
function a(c,mira){abierto=false;pinta();snd('tick');if(mira&&typeof watchR=='function')watchR(c);else if(typeof joinR=='function'){code=c;joinR()}}
window.GENTE={late:()=>latido(1),a,invitables,pon,boton,tog,n,lista,donde,invita,ir,no,avisos};
})();
