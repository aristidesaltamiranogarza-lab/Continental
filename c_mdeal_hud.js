// Monopoly Deal en la casa 3D con la interfaz Cálida (skill casa-ui): un ☰ con un solo panel (ajustes, jugadores, reglas) en lugar de la barra de abajo.
// No cambia c_monopolydeal.js (lo comparte el modo 2D Ligero): envuelve GM.monopolydeal.body/after y pone html.mdui; los estilos van en ui_juegos.css.
(function(){
if(typeof GM=='undefined'||!GM.monopolydeal||!window.GHUD||!window.UI)return;
const MD=GM.monopolydeal,body0=MD.body,after0=MD.after,ic=n=>UI.ico(n);let menu=false;
const active=()=>typeof S!='undefined'&&!!S&&typeof V!='undefined'&&!!V&&V.game==='monopolydeal'&&!!V.G&&(V.G.phase==='play'||V.G.phase==='final');
const rr=()=>{if(typeof render=='function')render()};
function panel(){const rg=String(MD.rules).replace(/^\s*<details>\s*<summary>[^<]*<\/summary>/,'').replace(/<\/details>\s*$/,'');
 const aj=GHUD.ajustes('',(V.host?`<button class="ui-btn sec full" onclick="if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}">${ic('x')}Cerrar sala</button>`:'')
  +`<button class="ui-btn sec full" onclick="leave()">${ic('salir')}${V.watch?'Dejar de mirar':'Salir de la sala'}</button>`);
 return GHUD.sheet('Monopoly Deal',[['aj','Ajustes',aj],['pl','Jugadores',typeof plist=='function'?plist():''],['rg','Reglas',`<div class="gj-rt">${rg}</div>`]],'MDH.menu()')}
MD.body=function(){const h=body0.apply(this,arguments);if(!active()){menu=false;return h}
 GHUD.save();let o=h;const k=o.lastIndexOf('<div class="mdft">');if(k>=0)o=o.slice(0,k)+'</div>';   // la barra de abajo (sonido, música, jugadores, reglas) pasa al ☰
 o+=`<button class="ui ui-rb md-menu${menu?' on':''}" onclick="MDH.menu()" aria-label="Menú del juego" aria-expanded="${menu}" title="Menú">${ic(menu?'x':'menu')}</button>`;
 return menu?o+panel():o};
MD.after=function(){if(after0)after0.apply(this,arguments);const a=active();document.documentElement.classList.toggle('mdui',a);if(a)GHUD.restore()};
setInterval(()=>{if(!active()&&document.documentElement.classList.contains('mdui')){menu=false;document.documentElement.classList.remove('mdui')}},400);
addEventListener('keydown',e=>{if(e.key=='Escape'&&menu&&active()){menu=false;rr()}});
window.MDH={menu:()=>{menu=!menu;if(typeof sfx=='function')sfx('tick');rr()}};
})();
