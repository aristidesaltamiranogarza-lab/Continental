// Mesa de la casa: aviso al centro abajo "Jugar Uno · 2 jugando" (tecla E) y el panel de la mesa
// (partidas en curso con Mirar, salas esperando, Crear sala y jugar, Unirme con código).
// c_casa3d.js llama CMESA.html(ctx) en hud(): ctx cuando estás junto a la mesa que picaste (sel), o null.
// Se carga después de c_casa_hud.js (CHUD.av) y ANTES de c_casa3d.js.
(function(){
const I=(n,c)=>UI.ico(n,c),$=id=>document.getElementById(id);
const es=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gico=c=>window.SALA&&SALA.ico?SALA.ico(c.g):c.G.emoji;
const touchy=matchMedia('(pointer:coarse)').matches;
let open=false,last=null,cod=false;
const rr=()=>{if(typeof render=='function')render()},tick=()=>{if(typeof sfx=='function')sfx('tick')};
const av=n=>window.CHUD?CHUD.av(n):'';
const avs=L=>`<span class="uh-avs">${L.slice(0,3).map(av).join('')}</span>`;
const nombres=(L,n)=>{const a=L.slice(0,3);return n>3?a.join(', ')+` y ${n-3} más`:a.length>1?a.slice(0,-1).join(', ')+' y '+a[a.length-1]:a[0]||''};
const estado=c=>[c.pl?c.pl+' jugando':'',c.op.length?c.op.length+(c.op.length>1?' salas esperando':' sala esperando'):''].filter(Boolean).join(' · ');

// con partida en curso, el letrero dice quién juega (retratos pequeños y nombres) en vez de solo "2 jugando" (SOCIAL.md S6)
function aviso(c){const s=estado(c),ps=[].concat(...c.pr.map(r=>r.ps)),quien=ps.length?nombres(ps,ps.length)+(ps.length>1?' juegan':' juega'):'';
 const sub=quien?quien+(c.op.length?' · '+estado({pl:0,op:c.op}):''):s||'Sin partidas';
 return `<button class="ui uh-aviso" onclick="CMESA.abrir()" aria-label="Jugar ${es(c.name)} · ${es(sub)}"><span class="uh-ai" aria-hidden="true">${gico(c)}</span>
 <span class="uh-at"><b>Jugar ${es(c.name)}</b><small>${es(sub)}${touchy?' · toca para entrar':''}</small></span>${ps.length?avs(ps):''}${touchy?'':'<kbd>E</kbd>'}</button>`}
function panel(c){const op=c.op.slice(0,5),pr=c.pr.slice(0,5);
 let b=`<div class="uh-mh"><span class="uh-mi" aria-hidden="true">${gico(c)}</span><span><h2 class="ui-h">${es(c.name)}</h2><small class="ui-sub">${es(c.desc)} Hasta ${c.G.max} jugadores.</small></span>
  <button class="ui-x" onclick="CMESA.cerrar()" aria-label="Cerrar">${I('x')}</button></div>`;
 if(op.length)b+=`<span class="ui-lbl">Salas esperando jugadores</span><div class="uh-ls">${op.map(r=>`<div class="uh-li">${avs([r.host])}<span><b>Sala de ${es(r.host)}</b><small class="ui-sub">${r.n} de ${r.max} jugadores</small></span>
  <button class="ui-btn" onclick="casaJoin('${es(r.c)}')">Unirme</button></div>`).join('')}</div>`;
 b+=`<span class="ui-lbl">Partidas en curso</span>`+(pr.length?`<div class="uh-ls">${pr.map(r=>`<div class="uh-li">${avs(r.ps)}<span><b>${es(nombres(r.ps,r.n))}</b><small class="ui-sub">${r.sp?r.sp+' mirando':'Jugando ahora'}</small></span>
  <button class="ui-btn sec" onclick="casaWatch('${es(r.w)}')">${I('ojo')}Mirar</button></div>`).join('')}</div>`:`<p class="ui-sub uh-nada">No hay partidas ahora. ¡Empieza una!</p>`);
 b+=`<button class="ui-btn full uh-play" onclick="${c.play||"casaPlay('listo')"}">${I('jugar')}Crear sala y jugar</button>`+(c.extra||'');   // play/extra: el plano 2D (c_plano2d.js)
 b+=cod?`<div class="uh-cod"><input id="h3code" class="ui-in" placeholder="Código" maxlength="5" value="${es(c.code)}" oninput="code=this.value.toUpperCase()" onkeydown="if(event.key==='Enter')joinR();else if(event.key==='Escape')CMESA.cerrar()" aria-label="Código de la sala" autocapitalize="characters" autocomplete="off" spellcheck="false"><button class="ui-btn" onclick="joinR()">Unirme</button></div>`
  :`<button class="ui-btn ghost full" onclick="CMESA.codigo()">${I('llave')}Unirme con código</button>`;
 if(c.msg)b+=`<p class="uh-err" role="alert">${es(c.msg)}</p>`;
 return `<div class="ui-scrim ligero" onclick="CMESA.cerrar()"></div><div class="ui ui-sheet der uh-mesa" role="dialog" aria-label="Mesa de ${es(c.name)}"><div class="ui-bd">${b}</div></div>`}

function html(c){if(!c){last=null;open=false;return ''}
 if(c.g!==last){last=c.g;open=false;cod=!!(c.code&&c.code.length)}
 return open?panel(c):aviso(c)}
function abrir(){if(!last)return;open=true;if(window.CHUD&&CHUD.isOpen())CHUD.close();tick();rr()}
function cerrar(){if(!open)return;open=false;tick();rr()}
// plano 2D (c_plano2d.js): abre el panel de esa mesa sin pasar por el aviso
function abre2d(g){if(window.CHUD&&CHUD.isOpen&&CHUD.isOpen())CHUD.close();last=g;open=true;cod=false}
window.CMESA={html,abrir,cerrar,abre2d,panel2d:c=>panel(c),abierta:()=>open&&!!last,
 codigo:()=>{cod=true;rr();const i=$('h3code');if(i)i.focus()},
 key:k=>{if(k=='e'&&last&&!open){abrir();return true}if(k=='escape'&&open){cerrar();return true}return false}};
})();
