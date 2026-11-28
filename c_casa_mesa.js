// Mesa de la casa: aviso al centro abajo "Jugar Uno · 2 jugando" (tecla E) y el panel de la mesa
// (partidas en curso con Mirar, salas esperando, Crear sala y jugar). Sin nada que elegir, tocar el aviso ya crea la sala (un toque).
// c_casa3d.js llama CMESA.html(ctx) en hud(): ctx cuando estás junto a la mesa que picaste (sel), o null.
// Se carga después de c_casa_hud.js (CHUD.av) y ANTES de c_casa3d.js.
(function(){
const I=(n,c)=>UI.ico(n,c),$=id=>document.getElementById(id);
const es=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gico=c=>window.SALA&&SALA.ico?SALA.ico(c.g):c.G.emoji;
const touchy=matchMedia('(pointer:coarse)').matches;
let open=false,last=null,cur=null,va=0;
const rr=()=>{if(typeof render=='function')render()},tick=()=>{if(typeof sfx=='function')sfx('tick')};
const av=(n,o)=>window.CHUD?CHUD.av(n,o):'';
// r: sala del servidor (ps, av, bt) para que la AI quede con inicial y las personas con retrato
const avs=(L,r)=>`<span class="uh-avs">${L.slice(0,3).map((n,i)=>av(n,r?{av:(r.av||[])[i],bot:(r.bt||[])[i]}:null)).join('')}</span>`;
const nombres=(L,n)=>{const a=L.slice(0,3);return n>3?a.join(', ')+` y ${n-3} más`:a.length>1?a.slice(0,-1).join(', ')+' y '+a[a.length-1]:a[0]||''};
const estado=c=>[c.pl?c.pl+' jugando':'',c.op.length?c.op.length+(c.op.length>1?' salas esperando':' sala esperando'):''].filter(Boolean).join(' · ');

// con partida en curso, el letrero dice quién juega (retratos pequeños y nombres) en vez de solo "2 jugando" (SOCIAL.md S6)
function aviso(c){const s=estado(c),ps=[].concat(...c.pr.map(r=>r.ps)),quien=ps.length?nombres(ps,ps.length)+(ps.length>1?' juegan':' juega'):'';
 const sub=quien?quien+(c.op.length?' · '+estado({pl:0,op:c.op}):''):s||'Crea una sala';
 return `<button class="ui uh-aviso" onclick="CMESA.abrir()" aria-label="Jugar ${es(c.name)} · ${es(sub)}"><span class="uh-ai" aria-hidden="true">${gico(c)}</span>
 <span class="uh-at"><b>Jugar ${es(c.name)}</b><small>${es(sub)}${touchy?(elige(c)?' · toca para ver':' · toca para jugar'):''}</small></span>${ps.length?avs(ps):''}${touchy?'':'<kbd>E</kbd>'}</button>`}
function panel(c){const op=c.op.slice(0,5),pr=c.pr.slice(0,5);
 let b=`<div class="uh-mh"><span class="uh-mi" aria-hidden="true">${gico(c)}</span><span><h2 class="ui-h">${es(c.name)}</h2><small class="ui-sub">${es(c.desc)} Hasta ${c.G.max} jugadores.</small></span>
  <button class="ui-x" onclick="CMESA.cerrar()" aria-label="Cerrar">${I('x')}</button></div>`;
 if(op.length)b+=`<span class="ui-lbl">Salas esperando jugadores</span><div class="uh-ls">${op.map(r=>`<div class="uh-li">${avs([r.host])}<span><b>Sala de ${es(r.host)}</b><small class="ui-sub">${r.n} de ${r.max} jugadores</small></span>
  <button class="ui-btn" onclick="casaJoin('${es(r.c)}')">Unirme</button></div>`).join('')}</div>`;
 b+=`<span class="ui-lbl">Partidas en curso</span>`+(pr.length?`<div class="uh-ls">${pr.map(r=>`<div class="uh-li">${avs(r.ps,r)}<span><b>${es(nombres(r.ps,r.n))}</b><small class="ui-sub">${r.sp?r.sp+' mirando':'Jugando ahora'}</small></span>
  <button class="ui-btn sec" onclick="casaWatch('${es(r.w)}')">${I('ojo')}Mirar</button></div>`).join('')}</div>`:`<p class="ui-sub uh-nada">No hay partidas ahora. ¡Empieza una!</p>`);
 b+=`<button class="ui-btn full uh-play" onclick="${c.play||"casaPlay('listo')"}">${I('jugar')}Crear sala y jugar</button>`+(c.extra||'');   // play/extra: el plano 2D (c_plano2d.js)
 if(c.msg)b+=`<p class="uh-err" role="alert">${es(c.msg)}</p>`;
 return `<div class="ui-scrim ligero" onclick="CMESA.cerrar()"></div><div class="ui ui-sheet der uh-mesa" role="dialog" aria-label="Mesa de ${es(c.name)}"><div class="ui-bd">${b}</div></div>`}

function html(c){cur=c;if(!c){last=null;open=false;return ''}
 if(c.g!==last){last=c.g;open=false}
 return open?panel(c):aviso(c)}
// nada que elegir (sin salas esperando ni partidas que mirar): el aviso late, se va hacia arriba y ya estás en la sala
const elige=c=>c.op.length||c.pr.length;
function abrir(){if(!last||!cur||va)return;if(window.CHUD&&CHUD.isOpen())CHUD.close();
 if(!elige(cur)){const b=document.querySelector('.uh-aviso'),c=cur;va=1;if(typeof sfx=='function')try{sfx('card')}catch(e){}
  if(b)b.classList.add('va');setTimeout(()=>{va=0;try{(0,eval)(c.play||"casaPlay('listo')")}catch(e){console.error(e)}},matchMedia('(prefers-reduced-motion:reduce)').matches?0:260);return}
 open=true;tick();rr()}
function cerrar(){if(!open)return;open=false;tick();rr()}
// plano 2D (c_plano2d.js): abre el panel de esa mesa sin pasar por el aviso
function abre2d(g){if(window.CHUD&&CHUD.isOpen&&CHUD.isOpen())CHUD.close();last=g;open=true}
window.CMESA={html,abrir,cerrar,abre2d,panel2d:c=>panel(c),abierta:()=>open&&!!last,
 key:k=>{if(k=='e'&&last&&!open){abrir();return true}if(k=='escape'&&open){cerrar();return true}return false}};
})();
