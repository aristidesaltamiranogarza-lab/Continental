// c_lobby.js — LOBBY: inicio y sala de espera en estilo Cálida cuando no hay casa 3D (modo Ligero y continental.html).
// Reemplaza home() de game.js; render() llama LOBBY.sala(g) en la sala de espera. Iconos y colores de cada juego: SALA (c_sala.js). Estilos: ui_lobby.css.
(function(){
const I=n=>window.UI?UI.ico(n):'',es=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COL={continental:'#1F6B4A',uno:'#B23A2E',monopolydeal:'#2D5D8A',merida:'#3F7D4F',haciendas:'#8A6A2A',rummy:'#24527A',ruleta:'#6A2436'};
const ORD=['continental','uno','monopolydeal','merida','haciendas','rummy','ruleta'];
const nom=k=>window.lobbyName?lobbyName(k):(GM[k]||{}).name||k;
const ico=k=>window.SALA&&SALA.ico?SALA.ico(k):`<span class="lb-emo">${(GM[k]||{}).emoji||''}</span>`;
const lista=()=>ORD.filter(x=>GM[x]).concat(Object.keys(GM).filter(x=>!ORD.includes(x)));
const on=()=>document.documentElement.classList.add('lbon');
const ini=n=>es((Array.from(String(n||'?').trim())[0]||'?').toUpperCase());
const PAL=['#C2512A','#2D5D8A','#3F7D4F','#8A3F7A','#B8862A','#2E7C83','#7A4A2A','#5A5FA8'];
const avc=n=>{let h=0;for(const c of String(n))h=(h*31+c.charCodeAt(0))|0;return PAL[Math.abs(h)%PAL.length]};

// cajas de juego (las mismas de la sala 3D)
const cajas=(sel,fn)=>`<div class="lb-cajas" role="radiogroup" aria-label="Juego">${lista().map(k=>`<button class="lb-caja${k===sel?' on':''}" style="--f:${COL[k]||'#C2512A'}" role="radio" aria-checked="${k===sel}" onclick="${fn}('${k}')"><span class="ic">${ico(k)}</span><b>${es(nom(k))}</b></button>`).join('')}</div>`;
const cab=(k,sub,der)=>`<div class="lb-cab" style="--c:${COL[k]||'#C2512A'}"><span class="lb-ic">${ico(k)}</span><div class="lb-t"><small>${sub}</small><b>${es(nom(k))}</b></div>${der||''}</div>`;
const tema=()=>`<button class="ui-rb" onclick="LOBBY.tema()" aria-label="Cambiar a tema ${window.UI&&UI.noche()?'de día':'de noche'}">${I(window.UI&&UI.noche()?'sol':'luna')}</button>`;
const top=()=>`<header class="lb-top"><div class="lb-marca"><span class="lb-logo">${I('casa')}</span><div><small>Casa de juegos</small><h1>Juegos de cartas</h1></div></div>${tema()}</header>`;

// solo Continental (fondo, cartas, reverso) y Uno (letra del color) tienen estilo de mesa 2D; va en un plegable chico
let abre=false;
function mesa(){const g=typeof gnow=='function'?gnow():pgame;if(g!='continental'&&g!='uno')return '';
 return `<details class="lb-mas"${abre?' open':''} ontoggle="LOBBY.abre(this.open)"><summary>${I('ajustes')}Estilo de las cartas</summary>${est(g)}</details>`}
function est(g){
 if(g=='uno')return `<div class="ui-row lb-fila"><span>Letra del color en cada carta<small class="ui-sub">Ayuda si confundes colores</small></span><label class="ui-sw"><input type="checkbox"${cbl?' checked':''} onchange="setCb(this.checked)"><i></i></label></div>`;
 const sw=(O,cur,f)=>`<div class="lb-sws">${Object.keys(O).map(k=>`<button class="lb-sw${cur==k?' on':''}" style="background:${O[k]}" onclick="${f}('${k}')" aria-label="${k}" aria-pressed="${cur==k}"></button>`).join('')}</div>`;
 return `<span class="ui-lbl">Fondo de la mesa</span>${sw(BGS,sbg,'setBg')}<span class="ui-lbl">Cartas</span><div class="ui-seg lb-seg">${[['classic','Clásicas'],['big','Grandes'],['black','Negras'],['retro','Retro'],['contrast','Contraste']].map(([k,n])=>`<button class="${scards==k?'on':''}" onclick="setCards('${k}')">${n}</button>`).join('')}</div><span class="ui-lbl">Reverso</span>${sw(BKS,sback,'setBack')}`}
const ajustes=()=>`<section class="ui-card lb-card"><h2>${I('ajustes')}Ajustes</h2><span class="ui-lbl">Música</span>${window.musSlider?musSlider():''}${mesa()}</section>`;
const reglas=g=>g&&g.rules?`<section class="ui-card lb-card lb-reglas">${g.rules.replace('<summary>Reglas</summary>',`<summary>${I('ayuda')}Cómo se juega ${es(nom(typeof gnow=='function'?gnow():pgame))}</summary>`)}</section>`:'';
const err=()=>msg?`<p class="lb-err" role="alert">${es(msg)}</p>`:'';

function home(){on();const k=GM[pgame]?pgame:'continental',g=GM[k],sel=lista().includes(k)?k:'continental';
 return `<div class="ui lb" style="--lb-c:${COL[k]||'#C2512A'}">${top()}
 <section class="ui-card lb-card"><label class="ui-lbl" for="lbNom">Tu nombre</label><input id="lbNom" class="ui-in" placeholder="¿Cómo te llamas?" maxlength="14" value="${es(pname)}" oninput="pname=this.value" autocomplete="nickname"></section>
 <section class="ui-card lb-card"><h2>${I('nuevo')}Crear una sala</h2>${cajas(sel,'LOBBY.elige')}
  ${cab(k,'Hasta '+(g.max||6)+' jugadores')}
  <div class="lb-dos"><button class="ui-btn" onclick="mk('listo')">${I('jugar')}Crear y jugar</button><button class="ui-btn sec" onclick="mk('host')">${I('llave')}Solo administrar</button></div>
  <p class="ui-sub lb-nota"><b>Crear y jugar</b>: abres la sala y te sientas. <b>Solo administrar</b>: eres el anfitrión, no juegas.</p></section>
 <section class="ui-card lb-card"><h2>${I('gente')}Unirme a una sala</h2><div class="lb-join"><input class="ui-in lb-code" placeholder="CÓDIGO" maxlength="5" value="${es(code)}" oninput="code=this.value.toUpperCase()" onkeydown="if(event.key==='Enter')joinR()" aria-label="Código de la sala" autocomplete="off" autocapitalize="characters"><button class="ui-btn" onclick="joinR()">Unirme</button></div>${err()}</section>
 ${ajustes()}${reglas(g)}</div>`}

// sala de espera sin casa: misma idea que el boleto de c_sala.js, en la página
function sala(g){on();const v=V,k=v.game,host=!!v.host,me=v.me;
 let raw='';try{raw=g.lobby(host?1:0)||''}catch(e){}
 const d=document.createElement('div');d.innerHTML=raw;let go=null;
 const b=[...d.querySelectorAll('button')].find(x=>/'start'/.test(x.getAttribute('onclick')||''));
 if(b){const nx=b.nextElementSibling,h=nx&&nx.classList.contains('top')?nx.textContent:'';go={on:b.getAttribute('onclick'),dis:b.disabled,hint:h};if(h)nx.remove();b.remove()}
 d.querySelectorAll('b,strong').forEach(x=>{if(/^reglas de esta sala$/i.test(x.textContent.trim()))x.remove()});
 const rr=d.textContent.trim()||d.querySelector('select,input')?`<section class="ui-card lb-card lb-r"><h2>${I('ajustes')}Reglas de esta sala</h2>${d.innerHTML}</section>`:'';
 const ps=v.players.map((p,i)=>Object.assign({i},p)).filter(p=>!p.out),n=ps.length,max=Math.max(n,(v.opts&&+v.opts.n)||g.max||6);
 const gente=`<section class="ui-card lb-card"><h2>${I('gente')}En la mesa <span class="ui-tag">${n} de ${max}</span></h2>`+ps.map(p=>`<div class="lb-pl"><i class="lb-av" style="--c:${avc(p.name)}">${ini(p.name)}</i><span><b>${es(p.name)}</b>${p.i===me?' <em>(tú)</em>':''}</span>`+
  (host&&p.i!==me?`<button class="ui-btn ghost" onclick="kick('${es(p.id)}')">Sacar</button>`:'')+`<i class="lb-dot${p.on?' on':''}" title="${p.on?'Conectado':'Desconectado'}"></i></div>`).join('')+
  (host&&me<0?'<p class="ui-sub">Eres el anfitrión: administras, no juegas.</p>':'')+(v.spec&&v.spec.length?`<p class="ui-sub">Mirando: ${v.spec.map(es).join(', ')}</p>`:'')+'</section>';
 const juego=host?`<section class="ui-card lb-card"><h2>${I('jugar')}¿A qué juegan?</h2>${cajas(k,'LOBBY.juego')}<p class="ui-sub lb-nota">Al terminar una partida pueden cambiar de juego sin salir de la sala.</p></section>`:'';
 let ft;
 if(host)ft=`<button class="ui-btn full lb-go" ${go&&go.dis?'disabled':''} onclick="${es(go?go.on:"send({t:'start'})")}">${I('jugar')}Empezar partida</button>${go&&go.hint?`<p class="ui-sub lb-nota">${es(go.hint)}</p>`:''}`;
 else if(v.watch)ft=`<button class="ui-btn full lb-go" onclick="joinSpec()">${I('jugar')}Unirme a jugar</button><p class="ui-sub lb-nota">La partida terminó: puedes unirte a la siguiente.</p>`;
 else ft=`<div class="lb-espera" role="status"><i></i><i></i><i></i><span>Esperando a que empiece la partida</span></div>`;
 return `<div class="ui lb" style="--lb-c:${COL[k]||'#C2512A'}">${top()}
 <section class="ui-card lb-card lb-boleto">${cab(k,`Sala <button class="lb-code-b" onclick="copyT('${es(v.code)}')" aria-label="Copiar código">${es(v.code)} ${I('copiar')}</button>`,`<button class="ui-btn sec lb-inv" onclick="LOBBY.invita()">${I('compartir')}Invitar</button>`)}
  <div class="lb-ft">${ft}${err()}<button class="ui-btn ghost full" onclick="LOBBY.salir()">${I('salir')}${host?'Cerrar sala':v.watch?'Dejar de mirar':'Salir de la sala'}</button></div></section>
 ${juego}${rr}${gente}${ajustes()}${reglas(g)}</div>`}

window.LOBBY={home,sala,abre:x=>{abre=x},
 elige:k=>{pgame=k;render()},
 juego:k=>{if(V&&V.host&&k!==V.game)send({t:'game',g:k})},
 tema:()=>{if(window.UI)UI.setTema(UI.noche()?'dia':'noche');render()},
 invita:()=>{if(!V)return;const u=location.origin+'/#'+V.code;if(navigator.share)navigator.share({title:'Casa de juegos',text:'¡Ven a jugar '+nom(V.game)+' conmigo! Código '+V.code,url:u}).catch(()=>{});
  else if(navigator.clipboard)navigator.clipboard.writeText(u).then(()=>banner('Enlace copiado ✓'),()=>copyT(u));else copyT(u)},
 salir:()=>{if(!V)return;if(V.host){if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}}else leave()}};
window.home=LOBBY.home;   // c_casa3d.js la envuelve (se carga después)
})();
