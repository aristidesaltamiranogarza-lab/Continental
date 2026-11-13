// c_casino2d.js — C2D: Blackjack y Póker en 2D para el modo Ligero (sin casa 3D). El inicio (c_lobby.js) los ofrece con C2D.tarjeta().
// Habla con POST /casa como c_casa3d.js (piso '2d': nadie lo ve caminar) y reusa BJ3/PK3 (estado, act, yo), BJH/PKH (barras) y BJ2D/PK2D (mesa, forzada en 2D).
// Envuelve home() de game.js/c_lobby.js mientras hay mesa abierta. Estilos en ui_juegos.css (html.c2don).
(function(){
let g=null,tm=0,tc=0,busy=false,hk='',err='',errT=0;
const I=n=>window.UI?UI.ico(n):'',es=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const NOM={bj:'Blackjack',pk:'Póker'};
const J=()=>g==='pk'?window.PK3:window.BJ3,D=()=>g==='pk'?window.PK2D:window.BJ2D,HU=()=>g==='pk'?window.PKH:window.BJH;
const ok=()=>!!(window.BJ3&&window.PK3&&window.CASA3D&&CASA3D.myId);
const tres=()=>window.CASA3D&&CASA3D.on&&CASA3D.on();
const rr=()=>{if(typeof render=='function')render()};
const B=(t,on,cls)=>`<button class="ui-btn${cls?' '+cls:''}" onclick="${on}">${t}</button>`;

async function tick(){if(!g||busy)return;if(tres())return cierra();busy=true;
 const b={id:CASA3D.myId(),name:(typeof pname=='string'&&pname.trim())||'Jugador',av:window.AV&&AV.mio?AV.mio():'',x:0,z:0,yaw:0,w:0,f:'2d'};
 const j=J().out();if(j)b[g]=j;
 try{const d=await api('casa',b);if(g){BJ3.estado(d.bj,null);PK3.estado(d.pk,null);const e=g==='pk'?d.pkerr:d.bjerr;if(e){err=e;errT=Date.now()}pinta()}}catch(e){}
 busy=false}
function firma(){const v=J().v,s=v?J().yo():-1;if(err&&Date.now()-errT>5000)err='';
 return [s,err,!v?'':s>=0?HU().firma(v,s):D().html(v,-1,true)].join('|')}
function pinta(){const k=firma();if(k!==hk){hk=k;rr()}}
// la cuenta regresiva del turno sin redibujar todo
function cuenta(){const v=J()&&J().v,el=document.getElementById(g==='pk'?'pkLeft':'bjLeft');if(!v||!el)return;
 const t=String(Math.max(0,Math.ceil(((v.left||0)-(performance.now()-(v.t0||0)))/1000)));if(el.textContent!==t)el.textContent=t}

function pagina(){document.documentElement.classList.add('lbon','c2don');const v=J().v,s=v?J().yo():-1;
 const e=err?`<p class="lb-err c2d-err" role="alert">${es(err)}</p>`:'';
 if(!v)return `<div class="ui lb c2d"></div>${window.LOBBY&&LOBBY.carga?LOBBY.carga('Abriendo la mesa'):''}`;
 if(s>=0)return `<div class="ui lb c2d"></div>${HU().hud(v,s)}${e}`;
 const n=v.as.filter(Boolean).length,libre=v.as.some(a=>!a),[sb,bb]=v.ciegas||[5,10];
 const sub=g==='pk'?`Ciegas $${sb}/$${bb}`:'Paga 3 a 2';
 return `<div class="ui lb c2d"></div><div class="ui bj-top"><span class="ui-pill"><b>${NOM[g]}</b>&nbsp;<small>${n?n+' en la mesa · ':''}${sub}</small></span></div>
 ${D().html(v,-1)}${e}
 <div class="ui bj-bar" role="group" aria-label="Mesa"><div class="bj-bb">${libre?B(I('jugar')+'Sentarme','C2D.sienta()','go'):'<span class="gj-note">La mesa está llena</span>'}${B(I('salir')+'Volver','C2D.cierra()','ghost')}</div></div>`}

function abre(k){if(!ok()||!NOM[k])return;g=k;hk='';err='';D().forzar(true);clearInterval(tm);clearInterval(tc);tm=setInterval(tick,800);tc=setInterval(cuenta,250);tick();rr()}
function sienta(){const v=J().v;if(!v)return;const i=v.as.findIndex(a=>!a);if(i<0)return;J().act('sentar',{s:i});if(typeof sfx=='function')sfx('tick');tick()}
async function cierra(){if(!g)return;const k=g;if(J().yo()>=0){J().levantarse();busy=false;await tick()}
 g=null;clearInterval(tm);clearInterval(tc);(k==='pk'?window.PK2D:window.BJ2D).forzar(false);document.documentElement.classList.remove('c2don');hk='';rr()}
function tarjeta(){if(!ok()||tres())return '';
 return `<section class="ui-card lb-card"><h2>${I('jugar')}Casino</h2><p class="ui-sub lb-nota">Las mesas del sótano en 2D. Juegas con quien esté en la casa.</p>
  <div class="lb-dos">${B('Blackjack',"C2D.abre('bj')",'sec')}${B('Póker',"C2D.abre('pk')",'sec')}</div></section>`}

window.C2D={abre,cierra,sienta,tarjeta,on:()=>!!g};
const h0=window.home;window.home=function(){return g?pagina():h0.apply(this,arguments)};
})();
