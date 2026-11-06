// Botón 🧭 "Ir a…" de la casa: lista de pisos y mesas con cuántos juegan; tocas una y llegas con un fundido junto a ella (CASA3D.ir).
// c_casa3d.js pone CIR.btn() en la barra de arriba y CIR.hud() con los demás paneles. Se carga ANTES de c_casa3d.js.
// Si c_casa_dollhouse.js (DH) cargó y la calidad no es Ligero, el 🧭 abre el corte de la casa; esta lista queda de respaldo.
(function(){
let open=false;
// g: juego de GM (mesa o puerta), o 'cub' / 'c4' / 'bg' (Cubilete, Conecta 4 y Backgammon, sin salas)
const PISOS=[
 {id:'ter',n:'🌅 Terraza',g:['rummy','c4']},
 {id:'alta',n:'📚 Planta alta',g:['merida','haciendas','bg']},
 {id:'pb',n:'🏠 Planta baja',g:['continental','uno','monopolydeal']},
 {id:'sot',n:'🕯️ Sótano',g:['ruleta','cub']}];
const ICO=k=>`<img class="gic" src="iconos/${k}.png" alt="">`;
const SUELTOS={cub:[ICO('cub'),'Cubilete'],c4:[ICO('c4'),'Conecta 4'],bg:[ICO('bg'),'Backgammon']};
const es=s=>typeof esc=='function'?esc(s):String(s);
function info(g){const H=window.CASA3D;
 if(g=='cub'){if(!window.CUB3)return null;const n=CUB3.n();return {e:ICO('cub'),t:'Cubilete',s:n?n+(CUB3.play()?' jugando':' en la mesa'):'sin partidas',on:n>0}}
 if(SUELTOS[g])return window.JG3&&JG3.P&&JG3.P[g]?{e:SUELTOS[g][0],t:SUELTOS[g][1],s:'',on:false}:null;
 const G=typeof GM!='undefined'&&GM[g];if(!G)return null;const {pl,op}=H.tinfo(g);
 return {e:G.emoji,t:window.lobbyName?lobbyName(g):G.name,s:[pl?pl+' jugando':'',op.length?op.length+(op.length>1?' salas abiertas':' sala abierta'):''].filter(Boolean).join(' · ')||'sin partidas',on:pl>0||op.length>0}}
const dhOn=()=>!!(window.DH&&DH.isOpen());
function btn(){const o=open||dhOn();return `<button class="ui-rb${o?' on':''}" onclick="CIR.tog()" title="Ir a…" aria-label="Ir a…" aria-expanded="${o}">🧭</button>`}
function hud(busy){if(busy){open=false;if(dhOn())setTimeout(()=>DH.close())}if(!open||!window.CASA3D)return '';const H=window.CASA3D,here=H.piso();
 const sec=PISOS.map(p=>{if(!H.can(p.id))return '';const it=p.g.map(g=>{const i=info(g);if(!i)return '';
   return `<button class="ui-btn sec cirb${i.on?' on':''}" onclick="CIR.go('${p.id}','${g}')"><span>${i.e} ${es(i.t)}</span><small>${es(i.s)}</small></button>`}).join('');
  return it?`<div class="cirp"><span>${p.n}${p.id===here?' <small>(aquí)</small>':''}</span>${it}</div>`:''}).join('');
 return GHUD.win('🧭 Ir a…',sec,'CIR.tog()','cirw')}
window.CIR={btn,hud,info,PISOS,show:()=>{if(!open&&!dhOn())window.CIR.tog()},   // show: el plano junto a cada escalera (c_casa_esc.js)
 tog:()=>{if(!open&&window.DH)try{if(DH.ok())return DH.toggle()}catch(e){console.warn('DH',e);try{DH.close()}catch(_){}}
  open=!open;if(open){if(window.CUB3&&CUB3.isOpen())CUB3.close();if(window.JG3)JG3.close(1);if(typeof casaClose=='function')return casaClose()}if(typeof sfx=='function')sfx('tick');render()},
 go:(id,g)=>{open=false;window.CASA3D.ir(id,g);render()}};
const css=document.createElement('style');css.textContent=`.cirw .ui-bd{display:flex;flex-direction:column;gap:12px}.cirp{display:flex;flex-direction:column;gap:4px}.cirp>span{font-weight:800;color:var(--ui-sub)}
.cirb{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;text-align:left}.cirb small{opacity:.7;white-space:nowrap}.cirb{justify-content:space-between;text-align:left}.cirb.on{border-color:var(--ui-accent)}.cirb.on small{opacity:1;color:var(--ui-accent)}`;document.head.appendChild(css);
})();
