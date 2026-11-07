// Interfaz "Cálida" de dentro de los juegos 3D (ui.css + ui_juegos.css): pastillas de estado y turno arriba, ☰ con un solo
// panel de ajustes (pestañas), botones de acción abajo, avisos, cámara y botón Cuadrar. Cada juego arma su hud() con estas piezas.
// Se carga después de c_ui.js (UI.ico, UI.setTema) y antes de los juegos 3D.
(function(){
const I=(n,c)=>UI.ico(n,c),$=id=>document.getElementById(id);
const rr=()=>{if(typeof render=='function')render()};
const tick=()=>{if(typeof sfx=='function')sfx('tick')};
let tab='',scroll=0;

// arriba: estado y turno a la izquierda; botones redondos (right) y ☰ a la derecha. o={st,turn,me,open,menu:'fn()',right}
function top(o){
 return `<div id="gjTop" class="ui gj-top"><div class="gj-tl"><span class="ui-pill gj-st">${o.st}</span>${o.turn?`<span class="ui-pill gj-turn${o.me?' me':''}"><span>${o.turn}</span></span>`:''}</div>
 <span class="gj-tr">${o.right||''}<button class="ui-rb${o.open?' on':''}" onclick="${o.menu}" aria-label="Menú del juego" aria-expanded="${!!o.open}" title="Menú">${I(o.open?'x':'menu')}</button></span></div>`}
// línea de ayuda debajo de las pastillas (se puede ocultar con el modo compacto)
const hint=t=>`<div id="gjHint" class="ui gj-hint">${t}</div>`;
// aviso que se desvanece solo (age = ms que lleva en pantalla, para no reiniciar la animación al redibujar)
const toast=(t,age,mini)=>`<div class="ui ui-toast gj-msg${mini?' mini':''}" role="status" style="animation-delay:-${age|0}ms">${t}</div>`;
// botones de acción abajo, al centro
const bar=b=>`<div id="gjBar" class="ui gj-bar"><div class="gj-bb">${b}</div></div>`;
// cámara: botón redondo (va en top.right) y su tarjeta de botones; cada juego atiende [data-cam]
const camTog=open=>`<button class="ui-rb${open?' on':''}" data-cam="tog" aria-label="Cámara" aria-expanded="${!!open}" title="Cámara">${I('camara')}</button>`;
function cam(IC,open,mini){if(!open)return '';const b=(c,t)=>`<button class="ui-rb" data-cam="${c}" title="${t}" aria-label="${t}">${IC[c]}</button>`;
 return `<div id="gjCam" class="ui ui-card gj-cam${mini?' mini':''}" role="group" aria-label="Cámara">${b('rl','Girar a la izquierda (Q)')}${b('rr','Girar a la derecha (E)')}${b('zi','Acercar (+)')}${b('zo','Alejar (−)')}${b('tu','Ver más desde arriba (R)')}${b('td','Ver más de lado (F)')}
 <button class="ui-btn sec gj-w" data-cam="home" title="Cuadrar la cámara (Esc)">${I('cuadrar')}Cuadrar</button></div>`}
// botón para regresar a la vista de siempre (el juego lo muestra y le pone el texto)
// botón redondo Cuadrar arriba a la derecha (va en top.right; el juego lo muestra y le pone el title)
const view=fn=>`<button id="gjView" class="ui-rb gj-view" onclick="${fn}" style="display:none" title="Cuadrar (Esc)" aria-label="Cuadrar">${I('cuadrar')}</button>`;

// panel del ☰: hoja de abajo en celular, tarjeta a la derecha en compu. tabs=[[clave,'Título',html],…]; close='fn()'
function sheet(title,tabs,close){if(!tabs.some(t=>t[0]==tab))tab=tabs[0][0];const cur=tabs.find(t=>t[0]==tab),ya=document.querySelector('.gj-sheet')?' ya':'';   // ya abierto: no se vuelve a animar al redibujar
 return `<div class="ui-scrim ligero${ya}" onclick="${close}"></div><div class="ui ui-sheet der gj-sheet${ya}" role="dialog" aria-label="${title}"><div class="ui-hd"><h2 class="ui-h">${title}</h2><button class="ui-x" onclick="${close}" aria-label="Cerrar">${I('x')}</button></div>
 ${tabs.length>1?`<div class="ui-seg full gj-tabs" role="tablist">${tabs.map(([k,t])=>`<button type="button" role="tab" class="${k==tab?'on':''}" aria-selected="${k==tab}" onclick="GHUD.tab('${k}')">${t}</button>`).join('')}</div>`:''}
 <div class="ui-bd" id="gjBd">${cur[2]}</div></div>`}
const seg=(L,cur,fn)=>`<div class="ui-seg full" role="group">${L.map(([v,t])=>`<button type="button" class="${v===cur?'on':''}" aria-pressed="${v===cur}" onclick="${fn}('${v}')">${t}</button>`).join('')}</div>`;
const sw=(on,fn,l)=>`<label class="ui-sw"><input type="checkbox"${on?' checked':''} onchange="${fn}" aria-label="${l}"><i></i></label>`;
const row=(ic,t,ctl)=>`<div class="ui-row"><span>${ic?I(ic):''}${t}</span>${ctl}</div>`;
// pestaña Ajustes: tema, música y sonidos de siempre + filas del juego (rows) + botones (btns)
function ajustes(rows,btns){const mus=typeof musName=='function'?musName():null,snd=!(typeof mute!='undefined'&&mute);
 return `<span class="ui-lbl">Tema</span>${seg([['auto','Automático'],['dia','Día'],['noche','Noche']],UI.tema(),'GHUD.tema')}
 ${mus!=null&&window.musSlider?`<span class="ui-lbl">Música</span>${musSlider()}`:''}
 <div class="gj-sws">${row('sonido','Sonidos',sw(snd,'GHUD.snd(this.checked)','Sonidos'))}${rows||''}</div>
 ${btns?`<div class="gj-btns">${btns}</div>`:''}`}
// ventanita de una mesa de la casa (Conecta 4, Backgammon, Cubilete, Ir a…): tarjeta a la derecha en compu, hoja de abajo en celular
const win=(title,body,close,cls)=>`<div id="h3win" class="ui ui-sheet h3w${cls?' '+cls:''}${$('h3win')?' ya':''}" role="dialog" aria-label="${title.replace(/<[^>]+>/g,'').replace(/"/g,'')}"><div class="ui-hd"><h2 class="ui-h">${title}</h2><button class="ui-x" onclick="${close}" aria-label="Cerrar">${I('x')}</button></div><div class="ui-bd">${body}</div></div>`;
// nombre de un jugador (centro x,y; medio ancho y alto hw,hh) que caería encima del botón Cuadrar: se sube o se baja, lo que quede más cerca (sin pasar de y0)
function dodge(x,y,hw,hh,y0){const e=$('gjView'),r=e&&e.style.display!='none'&&e.getBoundingClientRect();if(!r||!r.height)return y;
 if(x+hw<r.left||x-hw>r.right||y+hh<r.top||y-hh>r.bottom)return y;const up=r.top-hh-4,dn=r.bottom+hh+4;return up-hh>=(y0||0)&&y-up<dn-y?up:dn}
// el scroll del panel no se pierde al redibujar: save() antes de armar el HTML, restore() después
function save(){const b=$('gjBd');scroll=b?b.scrollTop:0}
function restore(){const b=$('gjBd');if(b)b.scrollTop=scroll}

window.GHUD={win,dodge,top,hint,toast,bar,camTog,cam,view,sheet,ajustes,seg,sw,row,save,restore,
 tab:k=>{tab=k;const b=$('gjBd');if(b)b.scrollTop=0;tick();rr()},
 tema:t=>{UI.setTema(t);tick();rr()},
 mus:n=>{if(typeof musCyc!='function')return;for(let i=0;i<4&&musName()!==n;i++)musCyc();rr()},
 snd:on=>{mute=!on;if(on)tick();rr()}};
})();
// chat de las salas (game.js, lo comparte el 2D Ligero): en la página 3D el botón lleva el icono de trazo en vez del emoji; estilos en ui_juegos.css
(function(){const f=()=>{const b=document.getElementById('cb'),n=document.getElementById('cn');if(!b||b.dataset.ui||!window.UI)return;b.dataset.ui=1;
 b.textContent='';b.insertAdjacentHTML('afterbegin',UI.ico('chat'));if(n)b.appendChild(n);b.setAttribute('aria-label','Chat');b.title='Chat'};
 f();document.addEventListener('DOMContentLoaded',f)})();
