// c_lobby_home.js — inicio sin casa 3D (modo Ligero y continental.html), con el estilo de la sala nueva (c_sala.js / c_sala2d.js):
// mesa 2D del color del juego arriba, los juegos como íconos y una hoja abajo con Crear y jugar y el código. Ajustes y reglas abren una hoja aparte.
// Reemplaza LOBBY.home (c_lobby.js; usa LOBBY.u). Se carga después de c_lobby.js y antes de c_casa3d.js. Estilos: ui_lobby.css (sección lbh).
(function(){
if(!window.LOBBY||!LOBBY.u)return;
const U=LOBBY.u,{COL,CAS,ico,nom,lista,c2d,b2d,est,avc,ini,es,I}=U;
let pan='';
// retrato de tu personaje (AV2D.retrato, solo donde está cargado); se guarda como imagen para no redibujarlo en cada render
let pjUrl='',pjCod='',pjPide=0;
function pj(){const cod=window.AV&&AV.mio?AV.mio():'';if(!cod||!window.AV2D)return '';
 if(cod!==pjCod&&!pjPide){pjPide=1;(async()=>{try{await AV.listo();const cv=await AV2D.retrato(cod,{tam:160,plano:'busto',giro:.35,fondo:null});pjUrl=cv.toDataURL();pjCod=cod;document.querySelectorAll('.lbh-pj').forEach(e=>{e.classList.add('img');e.innerHTML=`<img src="${pjUrl}" alt="">`})}catch(e){}pjPide=0})()}
 return pjUrl&&pjCod===cod?`<img src="${pjUrl}" alt="">`:''}   // '' | 'aj' (ajustes) | 'reg' (cómo se juega)
const gk=()=>{const c=U.cas();return c&&c2d()?c:(GM[pgame]?pgame:'continental')};
function mesa(k,g){const n=CAS[k]?4:Math.min(g.max||6,6),yo=String(pname||'').trim()||'Tú';
 const s=Array.from({length:n},(_,j)=>{const a=Math.PI/2+j*2*Math.PI/n,st=`left:${(50+Math.cos(a)*50).toFixed(1)}%;top:${(50+Math.sin(a)*50).toFixed(1)}%;--d:${(j*.07).toFixed(2)}s`;
  return j?`<div class="lbh-x ai" style="${st}"><i></i></div>`:`<div class="lbh-x yo" style="${st}"><i class="lbh-pj" style="--c:${avc(yo)}">${pj()||ini(yo)}</i></div>`}).join('');
 return `<div class="lbh-mesa" aria-hidden="true"><div class="lbh-m"><div class="lbh-p"><span class="lbh-ic" data-k="${k}">${ico(k)}</span></div><div class="lbh-s">${s}</div></div></div>`}
function juegos(k){return `<div class="lbh-js" role="radiogroup" aria-label="Juego">${lista().concat(c2d()?Object.keys(CAS):[]).map(x=>`<button class="lbh-j${x===k?' on':''}" style="--f:${COL[x]||'#C2512A'}" role="radio" aria-checked="${x===k}" aria-label="${es(nom(x))}" title="${es(nom(x))}" onclick="LOBBY.elige('${x}')"><span>${ico(x)}</span></button>`).join('')}</div>`}
function go(k){const c=CAS[k];if(k==='billar')return b2d()?`<button class="ui-btn full lbh-go" onclick="B2D.abre()">${I('jugar')}Ir a la mesa</button>`:'<button class="ui-btn full lbh-go" disabled>No disponible</button>';
 if(c)return `<button class="ui-btn full lbh-go" onclick="C2D.abre('${k}')">${I('jugar')}Ir a la mesa</button>`;
 return `<button class="ui-btn full lbh-go" onclick="mk('listo')">${I('jugar')}Crear y jugar</button>`}
// calidad: las mismas tarjetas dibujadas de la bienvenida (BIEN.CARD); se marca la actual leyendo BIEN.sel()
function cal(){const d=document.createElement('div');d.innerHTML=BIEN.sel();const o=[...d.querySelectorAll('option')],C=BIEN.CARD||{};
 return `<div class="lbh-q" role="radiogroup" aria-label="Calidad">${o.map(x=>{const c=C[x.value]||['',x.textContent,''];return `<button class="lbh-qc${x.selected?' on':''}" role="radio" aria-checked="${x.selected}" onclick="BIEN.set('${es(x.value)}');render()"><svg viewBox="0 0 48 40" aria-hidden="true">${c[0]}</svg><b>${es(c[1])}</b><small>${es(c[2])}</small></button>`}).join('')}</div>`}
const fila=(ic,t,der)=>`<div class="lbh-fila"><span>${I(ic)}${t}</span>${der}</div>`;
// vista previa de "Mesa y cartas": el fieltro con una carta de cara y otra de reverso
const vista=()=>{const bg=typeof BGS!='undefined'&&BGS[sbg]||'#1d6b47',bk=typeof BKS!='undefined'&&BKS[sback]||'#8B1A1A',neg=typeof scards!='undefined'&&scards==='black';
 return `<span class="lbh-prev" style="background:${bg}"><i class="lbh-pc${neg?' neg':''}">A<em>&#9830;</em></i><i class="lbh-pk" style="background:${bk}"></i></span>`};
function hoja(k,g){if(!pan)return '';const x=`<button class="ui-x" onclick="LOBBY.pan('')" aria-label="Cerrar">${I('x')}</button>`,est2=k==='continental'||k==='uno';let h,b,hd;
 if(pan==='reg'){h='Cómo se juega '+es(nom(k));b=(g.rules||'').replace(/<details/g,'<details open')}
 else if(pan==='est'){h='Mesa y cartas';hd=`<button class="ui-x" onclick="LOBBY.pan('aj')" aria-label="Volver">${I('atras')}</button><h2 class="ui-h lbh-ht">${h}</h2>${x}`;
  b=(k==='uno'?'':`<div class="lbh-vista">${vista()}</div>`)+est(k)}
 else{h='Ajustes';const n=window.UI&&UI.noche(),nm=String(pname||'').trim();
  b=`<div class="lbh-perfil">${window.MIPJ&&window.AV?`<button class="lbh-pjb" onclick="LOBBY.pj()" aria-label="Mi personaje" title="Mi personaje"><i class="lbh-pj" style="--c:${avc(nm||'Tú')}">${pj()||ini(nm||'?')}</i><span class="lbh-ed">${I('persona')}</span></button>`:`<i class="lbh-pj" style="--c:${avc(nm||'Tú')}">${ini(nm||'?')}</i>`}<input id="lbNom" class="ui-in" placeholder="Tu nombre" maxlength="14" value="${es(pname)}" oninput="pname=this.value" aria-label="Tu nombre" autocomplete="nickname"></div>
  ${window.BIEN?cal():''}
  ${fila(n?'luna':'sol','Tema',`<div class="lbh-tema" role="radiogroup" aria-label="Tema"><button class="${n?'':'on'}" role="radio" aria-checked="${!n}" aria-label="Día" onclick="LOBBY.tema1('dia')">${I('sol')}</button><button class="${n?'on':''}" role="radio" aria-checked="${!!n}" aria-label="Noche" onclick="LOBBY.tema1('noche')">${I('luna')}</button></div>`)}
  ${window.musSlider?`<div class="lbh-mus">${musSlider()}</div>`:''}
  ${window.casaToggle?`<button class="ui-btn sec full lbh-casa" onclick="casaToggle()">${I('casa')}Entrar a la casa 3D</button>`:''}`}
 if(!hd)hd=`<h2 class="ui-h">${h}</h2>${x}`;
 return `<div class="ui-scrim" onclick="LOBBY.pan('')"></div><section class="ui-sheet lbh-sheet mid" role="dialog" aria-label="${h}"><div class="ui-hd">${hd}</div><div class="ui-bd">${b}</div></section>`}
function home(){document.documentElement.classList.add('lbon');const k=gk(),g=GM[k]||{},c=CAS[k];
 const nm=String(pname||'').trim();
 return `<div class="ui lbh" style="--lb-c:${COL[k]||'#C2512A'}">
 <header class="lbh-top"><span class="lb-logo">${I('casa')}</span><b class="lbh-marca">gamemash</b>
  <button class="lbh-yo" onclick="LOBBY.pan('aj')" aria-label="Ajustes y personaje"><i class="lbh-pj" style="--c:${avc(nm||'Tú')}">${pj()||ini(nm||'?')}</i><span>${es(nm||'Tu nombre')}</span></button>
  <button class="ui-rb" onclick="LOBBY.pan('aj')" aria-label="Menú">${I('menu')}</button></header>
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
LOBBY.vista=vista;
// Mi personaje (c_mipj.js) desde Ajustes; al cerrarlo se vuelve a dibujar el retrato
LOBBY.pj=()=>{if(!window.MIPJ)return;pan='';render();MIPJ.abrir();const w=setInterval(()=>{if(!MIPJ.abierto()){clearInterval(w);pjCod='';render()}},400)};
LOBBY.tema1=t=>{if(window.UI)UI.setTema(t);render()};
window.home=LOBBY.home;
})();
