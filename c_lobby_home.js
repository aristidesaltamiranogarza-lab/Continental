// c_lobby_home.js — inicio sin casa 3D (modo Ligero y continental.html), con el estilo de la sala nueva (c_sala.js / c_sala2d.js):
// mesa 2D del color del juego arriba, los juegos como íconos y una hoja abajo con Crear y jugar y el código. Ajustes y reglas abren una hoja aparte.
// Reemplaza LOBBY.home (c_lobby.js; usa LOBBY.u). Se carga después de c_lobby.js y antes de c_casa3d.js. Estilos: ui_lobby.css (sección lbh).
(function(){
if(!window.LOBBY||!LOBBY.u)return;
const U=LOBBY.u,{COL,CAS,ico,nom,lista,c2d,b2d,est,avc,ini,es,I}=U;
let pan='';   // '' | 'aj' (ajustes) | 'reg' (cómo se juega)
const gk=()=>{const c=U.cas();return c&&c2d()?c:(GM[pgame]?pgame:'continental')};
function mesa(k,g){const n=CAS[k]?4:Math.min(g.max||6,6),yo=String(pname||'').trim()||'Tú';
 const s=Array.from({length:n},(_,j)=>{const a=Math.PI/2+j*2*Math.PI/n,st=`left:${(50+Math.cos(a)*50).toFixed(1)}%;top:${(50+Math.sin(a)*50).toFixed(1)}%;--d:${(j*.07).toFixed(2)}s`;
  return j?`<div class="lbh-x ai" style="${st}"><i></i></div>`:`<div class="lbh-x yo" style="${st}"><i style="--c:${avc(yo)}">${ini(yo)}</i></div>`}).join('');
 return `<div class="lbh-mesa" aria-hidden="true"><div class="lbh-m"><div class="lbh-p"><span class="lbh-ic" data-k="${k}">${ico(k)}</span></div><div class="lbh-s">${s}</div></div></div>`}
function juegos(k){return `<div class="lbh-js" role="radiogroup" aria-label="Juego">${lista().concat(c2d()?Object.keys(CAS):[]).map(x=>`<button class="lbh-j${x===k?' on':''}" style="--f:${COL[x]||'#C2512A'}" role="radio" aria-checked="${x===k}" aria-label="${es(nom(x))}" title="${es(nom(x))}" onclick="LOBBY.elige('${x}')"><span>${ico(x)}</span></button>`).join('')}</div>`}
function go(k){const c=CAS[k];if(k==='billar')return b2d()?`<button class="ui-btn full lbh-go" onclick="B2D.abre()">${I('jugar')}Ir a la mesa</button>`:'<button class="ui-btn full lbh-go" disabled>No disponible</button>';
 if(c)return `<button class="ui-btn full lbh-go" onclick="C2D.abre('${k}')">${I('jugar')}Ir a la mesa</button>`;
 return `<button class="ui-btn full lbh-go" onclick="mk('listo')">${I('jugar')}Crear y jugar</button>`}
// calidad como segmentado (las opciones salen del <select> de BIEN.sel())
function cal(){const d=document.createElement('div');d.innerHTML=BIEN.sel();const o=[...d.querySelectorAll('option')];if(!o.length)return BIEN.sel();
 return `<div class="ui-seg lbh-seg">${o.map(x=>`<button class="${x.selected?'on':''}" onclick="BIEN.set('${es(x.value)}');render()">${es(x.textContent)}</button>`).join('')}</div>`}
function hoja(k,g){if(!pan)return '';const x=`<button class="ui-x" onclick="LOBBY.pan('')" aria-label="Cerrar">${I('x')}</button>`;let h,b;
 if(pan==='reg'){h='Cómo se juega '+es(nom(k));b=(g.rules||'').replace(/<details/g,'<details open')}
 else{h='Ajustes';const n=window.UI&&UI.noche();
  b=`<label class="ui-lbl" for="lbNom">Tu nombre</label><input id="lbNom" class="ui-in" placeholder="¿Cómo te llamas?" maxlength="14" value="${es(pname)}" oninput="pname=this.value" autocomplete="nickname">
  ${window.BIEN?`<span class="ui-lbl">Calidad</span>${cal()}`:''}
  <span class="ui-lbl">Tema</span><div class="ui-seg"><button class="${n?'':'on'}" onclick="LOBBY.tema1('dia')">${I('sol')}Día</button><button class="${n?'on':''}" onclick="LOBBY.tema1('noche')">${I('luna')}Noche</button></div>
  <span class="ui-lbl">Música</span>${window.musSlider?musSlider():''}
  ${k==='continental'||k==='uno'?est(k):''}
  ${window.casaToggle?`<button class="ui-btn sec full lbh-casa" onclick="casaToggle()">${I('casa')}Entrar a la casa 3D</button>`:''}`}
 return `<div class="ui-scrim" onclick="LOBBY.pan('')"></div><section class="ui-sheet lbh-sheet mid" role="dialog" aria-label="${h}"><div class="ui-hd"><h2 class="ui-h">${h}</h2>${x}</div><div class="ui-bd">${b}</div></section>`}
function home(){document.documentElement.classList.add('lbon');const k=gk(),g=GM[k]||{},c=CAS[k];
 const nm=String(pname||'').trim();
 return `<div class="ui lbh" style="--lb-c:${COL[k]||'#C2512A'}">
 <header class="lbh-top"><span class="lb-logo">${I('casa')}</span><b class="lbh-marca">gamemash</b>
  <button class="lbh-yo" onclick="LOBBY.pan('aj')" aria-label="Cambiar tu nombre"><i style="--c:${avc(nm||'Tú')}">${ini(nm||'?')}</i><span>${es(nm||'Tu nombre')}</span></button>
  <button class="ui-rb" onclick="LOBBY.pan('aj')" aria-label="Ajustes">${I('ajustes')}</button></header>
 ${mesa(k,g)}
 ${juegos(k)}
 <section class="lbh-sh">
  <div class="lbh-hd"><span class="lbh-hic">${ico(k)}</span><div class="lbh-t"><h2>${es(nom(k))}</h2><small>${c?'Mesa del sótano':'Hasta '+(g.max||6)+' jugadores'}</small></div>
   ${!c&&g.rules?`<button class="lbh-ay" onclick="LOBBY.pan('reg')" aria-label="Cómo se juega">${I('ayuda')}</button>`:''}</div>
  <div class="lbh-bd">${go(k)}
   <div class="lbh-join"><input class="ui-in" placeholder="CÓDIGO" maxlength="5" value="${es(code)}" oninput="code=this.value.toUpperCase()" onkeydown="if(event.key==='Enter')joinR()" aria-label="Código de la sala" autocomplete="off" autocapitalize="characters"><button class="ui-btn sec" onclick="joinR()">Unirme</button></div>
   ${msg?`<p class="lb-err" role="alert">${es(msg)}</p>`:''}</div>
 </section>${hoja(k,g)}</div>`}
const v0=LOBBY.home;
LOBBY.home=function(){return (window.BIEN&&BIEN.pend&&BIEN.pend())?v0():home()};
LOBBY.pan=x=>{pan=x;render()};
LOBBY.tema1=t=>{if(window.UI)UI.setTema(t);render()};
window.home=LOBBY.home;
})();
