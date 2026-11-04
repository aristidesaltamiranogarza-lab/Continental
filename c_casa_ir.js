// Botón 🧭 "Ir a…" de la casa: lista de pisos y mesas con cuántos juegan; tocas una y llegas con un fundido junto a ella (CASA3D.ir).
// c_casa3d.js pone CIR.btn() en la barra de arriba y CIR.hud() con los demás paneles. Se carga ANTES de c_casa3d.js.
// (La vista "casa de muñecas" con el corte de los pisos llega después; esto es la versión simple.)
(function(){
let open=false;
// g: juego de GM (mesa o puerta), o 'cub' / 'c4' / 'bg' (Cubilete, Conecta 4 y Backgammon, sin salas)
const PISOS=[
 {id:'ter',n:'🌅 Terraza',g:['rummy','c4']},
 {id:'alta',n:'📚 Planta alta',g:['merida','haciendas','bg']},
 {id:'pb',n:'🏠 Planta baja',g:['continental','uno','monopolydeal']},
 {id:'sot',n:'🕯️ Sótano',g:['ruleta','cub']}];
const SUELTOS={cub:['🎲','Cubilete'],c4:['🔴','Conecta 4'],bg:['🎯','Backgammon']};
const es=s=>typeof esc=='function'?esc(s):String(s);
function info(g){const H=window.CASA3D;
 if(g=='cub'){if(!window.CUB3)return null;const n=CUB3.n();return {e:'🎲',t:'Cubilete',s:n?n+(CUB3.play()?' jugando':' en la mesa'):'sin partidas',on:n>0}}
 if(SUELTOS[g])return window.JG3&&JG3.P&&JG3.P[g]?{e:SUELTOS[g][0],t:SUELTOS[g][1],s:'',on:false}:null;
 const G=typeof GM!='undefined'&&GM[g];if(!G)return null;const {pl,op}=H.tinfo(g);
 return {e:G.emoji,t:window.lobbyName?lobbyName(g):G.name,s:[pl?pl+' jugando':'',op.length?op.length+(op.length>1?' salas abiertas':' sala abierta'):''].filter(Boolean).join(' · ')||'sin partidas',on:pl>0||op.length>0}}
function btn(){return `<button class="w7b${open?' on':''}" onclick="CIR.tog()" title="Ir a…" aria-label="Ir a…" aria-expanded="${open}">🧭</button>`}
function hud(busy){if(busy)open=false;if(!open||!window.CASA3D)return '';const H=window.CASA3D,here=H.piso();
 const sec=PISOS.map(p=>{if(!H.can(p.id))return '';const it=p.g.map(g=>{const i=info(g);if(!i)return '';
   return `<button class="w7b cirb${i.on?' on':''}" onclick="CIR.go('${p.id}','${g}')"><span>${i.e} ${es(i.t)}</span><small>${es(i.s)}</small></button>`}).join('');
  return it?`<div class="cirp"><span>${p.n}${p.id===here?' <small>(aquí)</small>':''}</span>${it}</div>`:''}).join('');
 return `<div id="h3win" class="w7 w7win cirw" role="dialog" aria-labelledby="cirt"><div class="wt"><span id="cirt">🧭 Ir a…</span><button class="wx" onclick="CIR.tog()" aria-label="Cerrar">✕</button></div><div class="wb">${sec}</div></div>`}
window.CIR={btn,hud,show:()=>{if(!open)window.CIR.tog()},   // show: el plano junto a cada escalera (c_casa_esc.js)
 tog:()=>{open=!open;if(open){if(window.CUB3&&CUB3.isOpen())CUB3.close();if(window.JG3)JG3.close(1);if(typeof casaClose=='function')return casaClose()}if(typeof sfx=='function')sfx('tick');render()},
 go:(id,g)=>{open=false;window.CASA3D.ir(id,g);render()}};
const css=document.createElement('style');css.textContent=`.cirw .wb{display:flex;flex-direction:column;gap:10px}.cirp{display:flex;flex-direction:column;gap:4px}.cirp>span{font-weight:700;opacity:.85}
.cirb{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;text-align:left}.cirb small{opacity:.7;white-space:nowrap}.cirb.on small{opacity:1;color:#7ad48a}`;document.head.appendChild(css);
})();
