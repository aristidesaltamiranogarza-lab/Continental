// Botón 🧭 "Ir a…" de la casa: lista de pisos y mesas con cuántos juegan; tocas una y llegas con un fundido junto a ella (CASA3D.ir).
// c_casa3d.js pone CIR.btn() en la barra de arriba y CIR.hud() con los demás paneles. Se carga ANTES de c_casa3d.js.
// Si c_casa_dollhouse.js (DH) cargó y la calidad no es Ligero, el 🧭 abre el corte de la casa; esta lista queda de respaldo.
(function(){
let open=false;
// g: juego de GM (mesa o puerta), o 'cub' / 'c4' / 'bg' (Cubilete, Conecta 4 y Backgammon, sin salas)
const PISOS=[
 {id:'ter',n:'Terraza',g:['rummy','c4']},
 {id:'alta',n:'Planta alta',g:['merida','haciendas','bg']},
 {id:'pb',n:'Planta baja',g:['continental','uno','monopolydeal']},
 {id:'sot',n:'Sótano',g:['ruleta','cub','blackjack','poker']}];
// Icono de cada piso: la casa en corte con ese piso pintado
const PHL={ter:['<rect x="4" y="3" width="16" height="5" rx="1"/>','#F2B23A'],alta:['<rect x="5" y="8" width="14" height="5"/>','#A88BE0'],pb:['<rect x="5" y="13" width="14" height="5"/>','#E8834F'],sot:['<rect x="6" y="19.5" width="12" height="3.5" rx=".8"/>','#B9A08A']};
PISOS.forEach(p=>{const h=PHL[p.id];p.i='<svg class="pic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><g opacity=".45"><path d="M5 8V4.5M12 8V4.5M19 8V4.5M4 4.5h16M5 13h14M2 18.5h20"/><rect x="5" y="8" width="14" height="10"/><rect x="6.5" y="20" width="11" height="2.5" stroke-dasharray="2 1.5"/></g><g fill="'+h[1]+'" stroke="currentColor">'+h[0]+'</g></svg>'});
const ICO=k=>window.SALA&&SALA.ico?'<span class="gic">'+SALA.ico(k)+'</span>':`<img class="gic" src="iconos/${k}.png" alt="">`;
const SUELTOS={cub:[ICO('cub'),'Cubilete'],c4:[ICO('c4'),'Conecta 4'],bg:[ICO('bg'),'Backgammon'],poker:[ICO('poker'),'Póker']};
const es=s=>typeof esc=='function'?esc(s):String(s);
function info(g){const H=window.CASA3D;
 if(g=='cub'){if(!window.CUB3)return null;const n=CUB3.n();return {e:ICO('cub'),t:'Cubilete',s:n?n+(CUB3.play()?' jugando':' en la mesa'):'sin partidas',on:n>0}}
 if(g=='blackjack'){if(!window.BJ3)return null;const n=BJ3.v?BJ3.v.as.filter(Boolean).length:0;return {e:ICO('blackjack'),t:'Blackjack',s:n?n+' jugando':'sin partidas',on:n>0}}
 if(g=='poker')return window.SAL&&SAL.P.poker?{e:SUELTOS.poker[0],t:'Póker',s:'',on:false}:null;
 if(SUELTOS[g])return window.JG3&&JG3.P&&JG3.P[g]?{e:SUELTOS[g][0],t:SUELTOS[g][1],s:'',on:false}:null;
 const G=typeof GM!='undefined'&&GM[g];if(!G)return null;const {pl,op}=H.tinfo(g);
 return {e:window.SALA&&SALA.ico?SALA.ico(g):G.emoji,t:window.lobbyName?lobbyName(g):G.name,s:[pl?pl+' jugando':'',op.length?op.length+(op.length>1?' salas abiertas':' sala abierta'):''].filter(Boolean).join(' · ')||'sin partidas',on:pl>0||op.length>0}}
const dhOn=()=>!!(window.DH&&DH.isOpen());
function btn(){const o=open||dhOn();return `<button class="ui-rb${o?' on':''}" onclick="CIR.tog()" title="Ir a…" aria-label="Ir a…" aria-expanded="${o}">${window.UI?UI.ico('brujula'):'🧭'}</button>`}
function hud(busy){if(busy){open=false;if(dhOn())setTimeout(()=>DH.close())}if(!open||!window.CASA3D)return '';const H=window.CASA3D,here=H.piso();
 const sec=PISOS.map(p=>{if(!H.can(p.id))return '';const it=p.g.map(g=>{const i=info(g);if(!i)return '';
   return `<button class="ui-btn sec cirb${i.on?' on':''}" onclick="CIR.go('${p.id}','${g}')"><span>${i.e} ${es(i.t)}</span><small>${es(i.s)}</small></button>`}).join('');
  return it?`<div class="cirp"><span>${p.i} ${p.n}${p.id===here?' <small>(aquí)</small>':''}</span>${it}</div>`:''}).join('');
 return GHUD.win('🧭 Ir a…',sec,'CIR.tog()','cirw')}
window.CIR={btn,hud,info,PISOS,show:()=>{if(!open&&!dhOn())window.CIR.tog()},   // show: el plano junto a cada escalera (c_casa_esc.js)
 tog:()=>{if(!open&&window.DH)try{if(DH.ok())return DH.toggle()}catch(e){console.warn('DH',e);try{DH.close()}catch(_){}}
  open=!open;if(open){if(window.CUB3&&CUB3.isOpen())CUB3.close();if(window.JG3)JG3.close(1);if(typeof casaClose=='function')return casaClose()}if(typeof sfx=='function')sfx('tick');render()},
 go:(id,g)=>{open=false;window.CASA3D.ir(id,g);render()}};
const css=document.createElement('style');css.textContent=`.cirw .ui-bd{display:flex;flex-direction:column;gap:12px}.cirp{display:flex;flex-direction:column;gap:4px}.cirp>span{font-weight:800;color:var(--ui-sub)}
.cirb{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;text-align:left}.cirb small{opacity:.7;white-space:nowrap}.cirb{justify-content:space-between;text-align:left}.cirb.on{border-color:var(--ui-accent)}.cirb.on small{opacity:1;color:var(--ui-accent)}`;document.head.appendChild(css);
})();
