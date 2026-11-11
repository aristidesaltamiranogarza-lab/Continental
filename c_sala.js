// c_sala.js — SALA: la sala de espera dentro de la casa 3D. La casa sigue detrás: c_casa3d.js gira la cámara alrededor de la mesa del juego
// y sienta a los de la sala (CASA3D.sala). Encima va el "boleto": hoja de abajo en celular, tarjeta a la derecha en compu, teñido con el color del juego.
// game.js: render() llama SALA.tapa() (al empezar retiene el juego mientras la cámara baja a tu silla) y SALA.sync(g) en la sala (true = la dibuja SALA).
// Se carga después de c_ui.js y antes de c_casa3d.js. Estilos: ui_sala.css.
(function(){
const $=id=>document.getElementById(id),I=n=>window.UI?UI.ico(n):'';
const es=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const st=()=>typeof S!=='undefined'?S:null,vv=()=>typeof V!=='undefined'?V:null;
const H3=()=>window.CASA3D&&CASA3D.on()&&CASA3D.sala?CASA3D:null;
const snd=n=>{if(typeof sfx=='function')try{sfx(n)}catch(e){}};
const COL={continental:'#1F6B4A',uno:'#B23A2E',monopolydeal:'#2D5D8A',merida:'#3F7D4F',haciendas:'#8A6A2A',rummy:'#24527A',ruleta:'#6A2436'};
const ORD=['continental','uno','monopolydeal','merida','haciendas','rummy','ruleta'];
const nom=k=>window.lobbyName?lobbyName(k):(GM[k]||{}).name||k;
const colOf=n=>{const m=window.CHUD&&CHUD.av?/background:([^;"]+)/.exec(CHUD.av(n)):null;return m?m[1]:'#C2512A'};
const ini=n=>es((Array.from(String(n||'?').trim())[0]||'?').toUpperCase());
// íconos de cada juego (64×64, colores fijos: van sobre la caja del color del juego)
const HEART='M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.3 5 6.6 5c2.1 0 3.6 1.2 5.4 3.2C13.8 6.2 15.3 5 17.4 5c3.3 0 5.6 3.3 4.1 6.8C19.5 16.4 12 21 12 21z',
 SPADE='M12 2c-3.5 4.6-9 7.7-9 12a4.4 4.4 0 0 0 7.6 3l-1.6 5h6l-1.6-5a4.4 4.4 0 0 0 7.6-3c0-4.3-5.5-7.4-9-12z',
 CARD='width="28" height="40" rx="4" fill="#FFF8EE" stroke="#3A2416" stroke-opacity=".25"',
 UC=c=>`<rect x="20" y="10" width="24" height="38" rx="4" fill="${c}" stroke="#FFF8EE" stroke-width="2.5"/>`,
 SV=b=>`<svg viewBox="0 0 64 64" aria-hidden="true">${b}</svg>`;
const IC={
 continental:SV(`<g transform="rotate(-18 32 60)"><rect x="18" y="8" ${CARD}/><path transform="translate(20.5 11) scale(.45)" d="${HEART}" fill="#C8352B"/></g><g transform="rotate(18 32 60)"><rect x="18" y="8" ${CARD}/><path transform="translate(32.5 11) scale(.45)" d="${SPADE}" fill="#2A1A10"/></g><rect x="18" y="8" ${CARD}/><text x="21.5" y="17" font-family="Georgia,serif" font-weight="700" font-size="8" fill="#C8352B">A</text><path d="M32 19l7 9-7 9-7-9z" fill="#C8352B"/><text x="42.5" y="42" font-family="Georgia,serif" font-weight="700" font-size="8" fill="#C8352B" transform="rotate(180 40.5 39.5)">A</text>`),
 uno:SV(`<g transform="rotate(-20 32 62)">${UC('#2F7DD1')}</g><g transform="rotate(-7 32 62)">${UC('#2EAD6B')}</g><g transform="rotate(7 32 62)">${UC('#F2C230')}</g><g transform="rotate(20 32 62)">${UC('#D93A2E')}<ellipse cx="32" cy="29" rx="8" ry="13" transform="rotate(28 32 29)" fill="#FFF8EE"/><text x="32" y="34.5" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="15" fill="#D93A2E">7</text></g>`),
 c4:SV(`<rect x="7" y="20" width="50" height="36" rx="7" fill="#2F7DD1"/><g fill="#1F5FA8"><circle cx="17" cy="30" r="4.6"/><circle cx="27.7" cy="30" r="4.6"/><circle cx="38.3" cy="30" r="4.6"/><circle cx="49" cy="30" r="4.6"/><circle cx="17" cy="45" r="4.6"/></g><g fill="#D93A2E"><circle cx="27.7" cy="45" r="4.6"/><circle cx="38.3" cy="30" r="4.6"/></g><g fill="#F2C230"><circle cx="38.3" cy="45" r="4.6"/></g><circle cx="49" cy="45" r="4.6" fill="#D93A2E"/><circle cx="49" cy="9" r="5.5" fill="#F2C230"/><path d="M49 15.5v2.5" stroke="#F2C230" stroke-width="2" stroke-linecap="round" opacity=".6"/>`),
 bg:SV(`<rect x="5" y="9" width="54" height="46" rx="6" fill="#8E5A30"/><rect x="9" y="13" width="46" height="38" rx="2" fill="#F2DFB8"/><path d="M9.5 13h7l-3.5 16z" fill="#C8352B"/><path d="M9.5 51h7l-3.5-16z" fill="#3A2416"/><path d="M16.5 13h7l-3.5 16z" fill="#3A2416"/><path d="M16.5 51h7l-3.5-16z" fill="#C8352B"/><path d="M23.5 13h7l-3.5 16z" fill="#C8352B"/><path d="M23.5 51h7l-3.5-16z" fill="#3A2416"/><path d="M34.5 13h7l-3.5 16z" fill="#3A2416"/><path d="M34.5 51h7l-3.5-16z" fill="#C8352B"/><path d="M41.5 13h7l-3.5 16z" fill="#C8352B"/><path d="M41.5 51h7l-3.5-16z" fill="#3A2416"/><path d="M48.5 13h7l-3.5 16z" fill="#3A2416"/><path d="M48.5 51h7l-3.5-16z" fill="#C8352B"/><rect x="30.5" y="13" width="3" height="38" fill="#8E5A30"/><circle cx="20" cy="45" r="5" fill="#FFF8EE" stroke="#3A2416" stroke-opacity=".35"/><circle cx="45" cy="19" r="5" fill="#2A1A10"/>`),
 monopolydeal:SV(`<g transform="rotate(-16 32 60)"><rect x="18" y="9" ${CARD}/><rect x="21" y="12" width="22" height="9" rx="1.5" fill="#2D5D8A"/><rect x="22" y="26" width="20" height="2.4" rx="1.2" fill="#3A2416" opacity=".25"/><rect x="22" y="31" width="14" height="2.4" rx="1.2" fill="#3A2416" opacity=".25"/></g><g transform="rotate(12 32 60)"><rect x="18" y="9" width="28" height="40" rx="4" fill="#F4B8C4" stroke="#B5566E"/><rect x="21" y="12" width="22" height="34" rx="2.5" fill="none" stroke="#FFF8EE" stroke-opacity=".7"/><circle cx="32" cy="29" r="8.5" fill="#FFF8EE"/><text x="32" y="33.8" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900" font-size="13" fill="#B5566E">5</text></g>`),
 merida:SV(`<path d="M2 46 32 34l30 12-30 12z" fill="#E4EDD6"/><path d="M2 46l15 6" stroke="#C8352B" stroke-width="3.5"/><path d="M17 52l15 6" stroke="#F2C230" stroke-width="3.5"/><path d="M32 58l15-6" stroke="#2EAD6B" stroke-width="3.5"/><path d="M47 52l15-6" stroke="#2F7DD1" stroke-width="3.5"/><path d="M12 45l9 3.5V41l-9-3.5z" fill="#2E9A4E"/><path d="M21 48.5l8-3V38l-8 3z" fill="#22783B"/><path d="M12 37.5l9 3.5 0-12z" fill="#3FB862"/><path d="M21 41l8-3-8-9z" fill="#2E9A4E"/><path d="M31 40l11 4.5V30L31 25.5z" fill="#D2402F"/><path d="M42 44.5l12-5V25l-12 5z" fill="#A93222"/><path d="M31 25.5 42 30l12-5-11-4.5z" fill="#E6604D"/><path d="M34 30l3 1.2v3l-3-1.2zM34 35.5l3 1.2v3l-3-1.2zM45 32l3-1.2v3l-3 1.2zM45 37.5l3-1.2v3l-3 1.2z" fill="#FFE3B8"/>`),
 haciendas:SV(`<circle cx="47" cy="15" r="9" fill="#F2B23A"/><path d="M6 56h52l-6-9H12z" fill="#B58A4E"/><path d="M12 47h40l-5-8H17z" fill="#C9A066"/><path d="M17 39h30l-5-7H22z" fill="#B58A4E"/><path d="M22 32h20l-4-6H26z" fill="#C9A066"/><path d="M28.5 56l1.5-30h4l1.5 30z" fill="#8E6634"/><path d="M25 16h14v10H25z" fill="#9C7240"/><path d="M24 13.5h16V17H24z" fill="#7E5A30"/><path d="M30 20h4v6h-4z" fill="#3A2416"/><path d="M10 56c-1-8 0-13 3-19" stroke="#6B4A2A" stroke-width="2.2" fill="none"/><path d="M13 37c-3-4-8-4-11-1 4 0 7 1 11 1zM13 37c1-5 6-7 10-5-4 1-7 3-10 5zM13 37c-5-1-8 2-9 6 3-3 6-5 9-6zM13 37c4-1 8 2 9 6-3-3-6-5-9-6z" fill="#3E9B4F"/>`),
 rummy:SV(`<g stroke="#3A2416" stroke-opacity=".22"><rect x="9" y="12" width="15" height="30" rx="3" fill="#FFF8EE"/><rect x="24.5" y="10" width="15" height="32" rx="3" fill="#FFF8EE"/><rect x="40" y="12" width="15" height="30" rx="3" fill="#FFF8EE"/></g><g font-family="Nunito,sans-serif" font-weight="900" font-size="16" text-anchor="middle"><text x="16.5" y="31" fill="#D93A2E">7</text><text x="32" y="29" fill="#2F7DD1">8</text><text x="47.5" y="31" fill="#2A1A10">9</text></g><circle cx="16.5" cy="36" r="1.6" fill="#D93A2E"/><circle cx="32" cy="34" r="1.6" fill="#2F7DD1"/><circle cx="47.5" cy="36" r="1.6" fill="#2A1A10"/><path d="M4 42h56l-4 13H8z" fill="#8A5532"/><rect x="3" y="39.5" width="58" height="5" rx="2.5" fill="#A86A40"/>`),
 ruleta:SV(`<circle cx="32" cy="32" r="25" fill="#6E7884" stroke="#454C55" stroke-width="2"/><circle cx="32" cy="32" r="21" fill="#9AA5B1"/><g fill="#2B2F35"><circle cx="42.4" cy="26" r="5"/><circle cx="42.4" cy="38" r="5"/><circle cx="32" cy="44" r="5"/><circle cx="21.6" cy="38" r="5"/><circle cx="21.6" cy="26" r="5"/><circle cx="32" cy="20" r="5"/></g><circle cx="32" cy="20" r="3.4" fill="#D93A2E"/><circle cx="31" cy="19" r="1.1" fill="#FFB3A8"/><circle cx="32" cy="32" r="4" fill="#454C55"/><path d="M15 23a20 20 0 0 1 11-10" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round" fill="none"/>`)};
for(const k of ['cub','billar','blackjack','poker'])IC[k]=`<img src="iconos/${k}.png" alt="">`;
const ico=k=>IC[k]||`<span class="sl-emo">${(GM[k]||{}).emoji||''}</span>`;
// en la casa los bots se llaman AI
const aiStr=s=>String(s||'').replace(/Velocidad de (los )?bots/gi,'Velocidad de la AI').replace(/Los bots llenan/gi,'La AI llena').replace(/\bbots\b/gi,'AI').replace(/\bbot\b/gi,'AI');
function aiTxt(d){const w=document.createTreeWalker(d,NodeFilter.SHOW_TEXT);let t;while((t=w.nextNode()))t.nodeValue=aiStr(t.nodeValue)}

let el=null,shown=false,sale=0,abierta=false,sig={},prev=null,hola={},tagEls=[],ai=false,qrPide=false,cur=null;
function arma(){if(el)return;el=document.createElement('div');el.id='sala';el.className='ui sl';
 el.innerHTML=`<div class="sl-vig"></div><div class="sl-tags" id="slTags"></div><div class="sl-sello" id="slSello" aria-hidden="true">¡A jugar!</div>
 <section class="sl-sh" id="slSh" role="dialog" aria-label="Sala de espera">
  <button class="sl-handle" onclick="SALA.mas()" aria-label="Mostrar u ocultar opciones"><i></i></button>
  <header class="sl-hd"><div class="sl-ic" id="slIc"></div>
   <div class="sl-t"><button class="sl-code" onclick="SALA.copia()" aria-label="Copiar el código de la sala">Sala <b id="slCode"></b>${I('copiar')}</button><h2 id="slName"></h2></div>
   <button class="ui-btn sl-inv" onclick="SALA.invita()">${I('compartir')}Invitar</button></header>
  <div class="sl-bd" id="slBd">
   <div class="sl-gente"><div class="sl-avs" id="slAvs"></div><div class="sl-res" id="slRes"></div></div>
   <button class="sl-mas" onclick="SALA.mas()"><span>Juego, reglas y música</span>${I('abajo')}</button>
   <div class="sl-x" id="slJuego"></div>
   <div class="sl-x sl-reglas" id="slReglas"></div>
   <div class="sl-x"><span class="ui-lbl">En la mesa</span><div id="slLista"></div></div>
   <div class="sl-x sl-aj"><span class="ui-lbl">Música</span><div id="slMus"></div>
    <button class="sl-row" onclick="SALA.reglas()"><span>Cómo se juega</span>${I('ayuda')}</button><button class="sl-row sl-peligro" id="slSalir" onclick="SALA.salir()"></button></div>
  </div>
  <footer class="sl-ft" id="slFt"></footer>
 </section><div class="sl-modal" id="slModal" hidden onclick="if(event.target===this)SALA.cierra()"></div>`;
 document.body.appendChild(el)}

// sync(g): game.js en cada render() de la sala de espera. false = no hay casa (sala de siempre)
function sync(g){const H=H3(),v=vv();if(!g||!H||!v||v.G)return false;arma();cur=g;
 if(!shown){shown=true;abierta=false;sig={};prev=null;hola={};if(H.arranca)H.arranca(v.game);el.classList.remove('sale','open','in');void el.offsetWidth;el.classList.add('in');requestAnimationFrame(paso)}
 pinta(g,v);return true}
function pinta(g,v){const k=v.game,host=!!v.host,me=v.me;el.style.setProperty('--sl-c',COL[k]||'#C2512A');
 if(sig.k!==k){sig.k=k;const ic=$('slIc');ic.innerHTML=ico(k);ic.classList.remove('pop');void ic.offsetWidth;ic.classList.add('pop');$('slName').textContent=nom(k)}
 $('slCode').textContent=v.code||'';
 // reglas del juego (su lobby de siempre) sin el botón de empezar, que va abajo
 let raw='';try{raw=g.lobby(host?1:0)||''}catch(e){}
 if(raw!==sig.raw){sig.raw=raw;const d=document.createElement('div');d.innerHTML=raw;ai=/\bbots?\b/i.test(d.textContent);
  const b=[...d.querySelectorAll('button')].find(x=>/'start'/.test(x.getAttribute('onclick')||''));sig.go=null;
  if(b){const nx=b.nextElementSibling,h=nx&&nx.classList.contains('top')?nx.textContent:'';sig.go={on:b.getAttribute('onclick'),dis:b.disabled,hint:aiStr(h)};if(h)nx.remove();b.remove()}
  d.querySelectorAll('b,strong').forEach(x=>{if(/^reglas de esta sala$/i.test(x.textContent.trim()))x.remove()});
  aiTxt(d);$('slReglas').innerHTML=d.textContent.trim()||d.querySelector('select,input')?`<span class="ui-lbl">Reglas de esta sala</span>`+d.innerHTML:''}
 // ¿a qué juegan? (solo quien creó la sala)
 const jk=host+'|'+k;if(sig.j!==jk){sig.j=jk;const L=ORD.filter(x=>GM[x]).concat(Object.keys(GM).filter(x=>!ORD.includes(x)));
  $('slJuego').innerHTML=host?`<span class="ui-lbl">¿A qué juegan?</span><div class="sl-cajas" id="slCajas">${L.map(x=>`<button class="sl-caja${x===k?' on':''}" style="--f:${COL[x]||'#C2512A'}" onclick="SALA.juego('${x}')" aria-pressed="${x===k}"><span class="ic">${ico(x)}</span><b>${es(nom(x))}</b></button>`).join('')}</div><p class="ui-sub sl-nota">Al terminar una partida pueden cambiar de juego sin salir de la sala.</p>`
   :`<p class="ui-sub sl-nota">El juego lo elige quien creó la sala.</p>`;
  const cs=$('slCajas'),on=cs&&cs.querySelector('.on');if(on)requestAnimationFrame(()=>{cs.scrollLeft=on.offsetLeft-(cs.clientWidth-on.offsetWidth)/2})}
 // gente: los de la sala se sientan en la mesa de la casa; la AI ocupa el resto
 const ps=v.players.map((p,i)=>Object.assign({i},p)).filter(p=>!p.out),n=ps.length,max=Math.max(n,(v.opts&&+v.opts.n)||g.max||6),libres=ai?Math.min(max,6)-n:0;
 const names=ps.map(p=>p.name),avs=ps.map(p=>p.av||''),nk=k+'#'+names.join('|')+'#'+avs.join('|');
 if(nk!==sig.n){sig.n=nk;const H=H3();if(H)H.sala.gente(k,names,avs);
  if(prev){const nuevos=names.filter(x=>!prev.includes(x));nuevos.forEach(x=>{hola[x]=performance.now()});if(nuevos.length)snd('tick')}prev=names;
  $('slAvs').innerHTML=ps.slice(0,6).map(p=>`<i class="sl-av${performance.now()-(hola[p.name]||-1e9)<2500?' nuevo':''}" style="--c:${colOf(p.name)}" title="${es(p.name)}">${ini(p.name)}</i>`).join('')+'<i class="sl-av ai">AI</i>'.repeat(Math.max(0,libres))}
 $('slRes').innerHTML=`<b>${n} de ${max}</b> en la mesa<br>${ai&&n<max?'La AI juega '+(max-n)+(max-n>1?' lugares':' lugar'):n<2&&!ai?'Falta gente para empezar':'¡Mesa completa!'}`;
 const lk=JSON.stringify([ps.map(p=>[p.name,p.on,p.id,p.i]),me,host,v.spec,v.watch,libres]);
 if(lk!==sig.l){sig.l=lk;$('slLista').innerHTML=ps.map(p=>`<div class="sl-pl"><i class="sl-av" style="--c:${colOf(p.name)}">${ini(p.name)}</i><span><b>${es(p.name)}</b>${p.i===me?' <em>(tú)</em>':''}</span>`+
   (host&&p.i!==me?`<button class="ui-btn ghost sl-kick" onclick="kick('${es(p.id)}')">Sacar</button>`:'')+`<i class="sl-dot${p.on?' on':''}" title="${p.on?'Conectado':'Desconectado'}"></i></div>`).join('')+
   `<div class="sl-pl ai"><i class="sl-av ai">AI</i><span class="ui-sub">Lugar libre</span><b class="sl-chip">AI</b></div>`.repeat(Math.max(0,libres))+
   (host&&me<0?'<p class="ui-sub">Eres el anfitrión: administras, no juegas.</p>':'')+(v.spec&&v.spec.length?`<p class="ui-sub">Mirando: ${v.spec.map(es).join(', ')}</p>`:'')}
 if(!sig.m){sig.m=1;$('slMus').innerHTML=window.musSlider?musSlider():''}
 $('slSalir').textContent=host?'Cerrar sala':v.watch?'Dejar de mirar':'Salir de la sala';
 // abajo: empezar (quien creó la sala), unirse (mirando) o esperando
 const m=typeof msg!='undefined'?msg:'',go=sig.go||{on:"send({t:'start'})"};let ft;
 if(host)ft=`<button class="ui-btn full sl-go" ${go.dis?'disabled':''} onclick="${es(go.on)}">${I('jugar')}Empezar partida</button><p class="ui-sub sl-hint">${es(go.hint||(ai&&n<max?'La AI llena los lugares vacíos':''))}</p>`;
 else if(v.watch)ft=`<button class="ui-btn full sl-go" onclick="joinSpec()">${I('jugar')}Unirme a jugar</button><p class="ui-sub sl-hint">La partida terminó: puedes unirte a la siguiente.</p>`;
 else ft=`<div class="sl-espera" role="status"><i></i><i></i><i></i><span>Esperando a que empiece la partida</span></div>`;
 if(m)ft+=`<p class="sl-err" role="alert">${es(m)}</p>`;
 if(ft!==sig.ft){sig.ft=ft;$('slFt').innerHTML=ft}}

// cada cuadro: nombres sobre los Miis sentados (y "AI" en las sillas libres); si saliste de la sala, el boleto se va
let slH=-1;
function paso(){if(!el||!shown)return;requestAnimationFrame(paso);if(!sale&&!st())return ocultar();tags();
 const h=Math.max(0,Math.round(innerHeight-$('slSh').getBoundingClientRect().top));if(h!==slH){slH=h;document.documentElement.style.setProperty('--sl-h',h+'px')}}   // el chat va arriba de la hoja
function tags(){const H=H3(),v=vv(),box=$('slTags');if(!H||!v||!box)return;const P=H.sala.sillas(),cam=H.cam(),now=performance.now();
 const ps=(v.players||[]).map((p,i)=>Object.assign({i},p)).filter(p=>!p.out),max=Math.max(ps.length,(v.opts&&+v.opts.n)||(cur&&cur.max)||6);
 for(let j=0;j<Math.max(P.length,tagEls.length);j++){let t=tagEls[j];if(!t){t=document.createElement('div');box.appendChild(t);tagEls[j]=t}
  const p=ps[j],lab=p?p.name+(p.i===v.me?' (tú)':''):ai&&j<max&&!sale?'AI':'',q=P[j]&&lab?P[j].project(cam):null;
  if(!q||q.z>1||Math.abs(q.x)>1.1||Math.abs(q.y)>1.1){t.style.display='none';continue}
  const c='sl-tag'+(p?p.i===v.me?' yo':'':' ai')+(p&&hola[p.name]&&now-hola[p.name]<2300?' hi':'');
  if(t.className!==c)t.className=c;if(t.textContent!==lab)t.textContent=lab;t.style.display='';
  t.style.transform=`translate(${((q.x+1)/2*innerWidth).toFixed(1)}px,${((1-q.y)/2*innerHeight).toFixed(1)}px) translate(-50%,-100%)`}}
// cuánto tapa el boleto (px): la cámara de la casa corre el encuadre la mitad para que la mesa quede a la vista
function hueco(){if(!el||!shown||sale)return {x:0,y:0};const r=$('slSh').getBoundingClientRect();
 return innerWidth>=768?{x:Math.max(0,innerWidth-r.left)/2,y:0}:{x:0,y:Math.max(0,innerHeight-r.top)*.45}}
// empezó la partida: el boleto se va, la cámara baja a tu silla, "¡A jugar!" y fundido al juego
function tapa(){if(sale)return true;const v=vv();if(!shown||!st()||!v||!v.G)return false;
 sale=performance.now();el.classList.add('sale');el.classList.remove('in','open');$('slModal').hidden=true;const H=H3();if(H)H.sala.baja();snd('card');
 const s=$('slSello');s.classList.remove('on');void s.offsetWidth;s.classList.add('on');
 const RM=window.CCAM&&CCAM.RM,fin=()=>{sale=0;ocultar();if(typeof render=='function')render()};
 setTimeout(()=>{if(window.CCAM)CCAM.fade(1,RM?120:280).then(()=>{fin();setTimeout(()=>CCAM.fade(0,RM?120:520),60)});else fin()},RM?250:1100);return true}
function ocultar(){shown=false;sale=0;if(!el)return;el.classList.remove('in','sale','open');abierta=false;$('slModal').hidden=true;tagEls.forEach(t=>t.style.display='none');
 if(window.CASA3D&&CASA3D.sala)CASA3D.sala.gente(null,null);sig={}}
// celular: la hoja crece para mostrar juego, reglas, gente y música (alto animado de auto a auto)
function mas(){if(innerWidth>=768||!el)return;const sh=$('slSh'),h0=sh.offsetHeight;abierta=!abierta;el.classList.toggle('open',abierta);snd('tick');
 sh.style.height='auto';const h1=sh.offsetHeight;sh.style.height=h0+'px';void sh.offsetHeight;sh.style.height=h1+'px';
 const end=e=>{if(e.propertyName!=='height')return;sh.style.height='';sh.removeEventListener('transitionend',end)};sh.addEventListener('transitionend',end);if(!abierta)$('slBd').scrollTop=0}
const url=()=>location.origin+'/#'+((vv()||{}).code||'');
function copiaL(){const u=url();const ok=()=>{if(typeof banner=='function')banner('Enlace copiado ✓')};
 if(navigator.clipboard)navigator.clipboard.writeText(u).then(ok,()=>copyT(u));else copyT(u)}
function qr(u){const box=$('slQr');if(!box)return;const mk=()=>{const b=$('slQr');if(!b||!window.QRCode)return;try{b.innerHTML='';new QRCode(b,{text:u,width:176,height:176,colorDark:'#22201C',colorLight:'#FFFFFF',correctLevel:QRCode.CorrectLevel.M})}catch(e){b.remove()}};
 if(window.QRCode)return mk();if(qrPide)return;qrPide=true;const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
 s.onload=mk;s.onerror=()=>{qrPide=false;const b=$('slQr');if(b)b.remove()};document.head.appendChild(s)}
function modal(h){const m=$('slModal');m.innerHTML=h;m.hidden=false;snd('tick');const b=m.querySelector('button');if(b)b.focus({preventScroll:true})}
window.SALA={ico,sync,tapa,hueco,
 on:()=>shown||sale>0||!!(st()&&!vv()&&H3()),   // también mientras entras (todavía sin datos de la sala): la casa sigue viva
 g:()=>{const v=vv();return v?v.game:typeof pgame!='undefined'?pgame:null},
 mas,copiaL,
 juego:k=>{if(vv()&&vv().host&&k!==vv().game){send({t:'game',g:k});snd('tick')}},
 copia:()=>{const v=vv();if(v)copyT(v.code)},
 comparte:()=>{const v=vv();if(!v)return;const u=url();if(navigator.share)navigator.share({title:'gamemash',text:'¡Ven a jugar '+nom(v.game)+' conmigo! Código '+v.code,url:u}).catch(()=>{});else copiaL()},
 invita:()=>{const v=vv();if(!v)return;const u=url();modal(`<div class="sl-card" role="dialog" aria-label="Invitar a la sala"><h3>Invita a tu gente</h3><p class="ui-sub">Que escaneen el código con la cámara del celular</p><div class="sl-qr" id="slQr"></div><div class="sl-big">${es(v.code)}</div><div class="sl-link">${es(u)}</div>
  <div class="sl-dos"><button class="ui-btn sec" onclick="SALA.copiaL()">${I('copiar')}Copiar enlace</button><button class="ui-btn" onclick="SALA.comparte()">${I('compartir')}Compartir</button></div><button class="ui-btn ghost full" onclick="SALA.cierra()">Listo</button></div>`);qr(u)},
 reglas:()=>{if(!cur)return;modal(`<div class="sl-card sl-rul" role="dialog" aria-label="Cómo se juega"><div class="sl-rh"><h3>Cómo se juega ${es(nom(sig.k))}</h3><button class="ui-x" onclick="SALA.cierra()" aria-label="Cerrar">${I('x')}</button></div><div class="sl-rb">${cur.rules||''}</div></div>`);
  $('slModal').querySelectorAll('details').forEach(d=>d.open=true)},
 cierra:()=>{const m=$('slModal');if(m&&!m.hidden){m.hidden=true;snd('tick')}},
 salir:()=>{const v=vv();if(!v)return;if(v.host){if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}}else leave()}};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&el&&shown&&!$('slModal').hidden){SALA.cierra();e.stopPropagation()}},true);
})();
