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
const PAL=['#C2512A','#2D5D8A','#3F7D4F','#8A3F7A','#B8862A','#2E7C83','#7A4A2A','#5A5FA8'];
const colOf=n=>{const m=window.CHUD&&CHUD.av?/background:([^;"]+)/.exec(CHUD.av(n)):null;if(m)return m[1];let h=0;for(const c of String(n))h=(h*31+c.charCodeAt(0))|0;return PAL[Math.abs(h)%PAL.length]};
const ini=n=>es((Array.from(String(n||'?').trim())[0]||'?').toUpperCase());
// íconos de cada juego (64×64, colores fijos: van sobre la caja del color del juego)
const HEART='M12 21s-7.5-4.6-9.5-9.2C1 8.3 3.3 5 6.6 5c2.1 0 3.6 1.2 5.4 3.2C13.8 6.2 15.3 5 17.4 5c3.3 0 5.6 3.3 4.1 6.8C19.5 16.4 12 21 12 21z',
 SPADE='M12 2c-3.5 4.6-9 7.7-9 12a4.4 4.4 0 0 0 7.6 3l-1.6 5h6l-1.6-5a4.4 4.4 0 0 0 7.6-3c0-4.3-5.5-7.4-9-12z',
 CARD='width="28" height="40" rx="4" fill="#FFF8EE" stroke="#3A2416" stroke-opacity=".25"',
 UC=c=>`<rect x="20" y="10" width="24" height="38" rx="4" fill="${c}" stroke="#FFF8EE" stroke-width="2.5"/>`,
 SV=b=>`<svg viewBox="0 0 64 64" aria-hidden="true">${b}</svg>`;
const IC={
 continental:SV(`<g transform="rotate(-18 32 60)"><rect x="18" y="8" ${CARD}/><path transform="translate(20.5 11) scale(.45)" d="${HEART}" fill="#C8352B"/></g><g transform="rotate(18 32 60)"><rect x="18" y="8" ${CARD}/><path transform="translate(32.5 11) scale(.45)" d="${SPADE}" fill="#2A1A10"/></g><rect x="18" y="8" ${CARD}/><text x="21.5" y="17" font-family="Georgia,serif" font-weight="700" font-size="8" fill="#C8352B">A</text><path d="M32 19l7 9-7 9-7-9z" fill="#C8352B"/><text x="21.5" y="17" font-family="Georgia,serif" font-weight="700" font-size="8" fill="#C8352B" transform="rotate(180 32 28)">A</text>`),
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

let el=null,shown=false,sale=0,sub=null,sig={},prev=null,hola={},tagEls=[],ai=false,qrPide=false,cur=null;
// el "boleto": cabecera (juego y código), asientos, una fila de accesos y Empezar. Reglas, juego y música se abren de lado dentro de la hoja (ver)
function arma(){if(el)return;el=document.createElement('div');el.id='sala';el.className='ui sl';
 el.innerHTML=`<div class="sl-vig"></div><div class="sl-tags" id="slTags"></div><div class="sl-sello" id="slSello" aria-hidden="true">¡A jugar!</div>
 <section class="sl-sh" id="slSh" role="dialog" aria-label="Sala de espera">
  <header class="sl-hd"><div class="sl-ic" id="slIc"></div>
   <button class="sl-t" onclick="SALA.ver('juego')" aria-label="Cambiar de juego"><h2 id="slName"></h2>${I('abajo')}</button>
   <button class="sl-code" onclick="SALA.invita()" aria-label="Invitar a la sala"><b id="slCode"></b>${I('compartir')}</button>${window.GENTE?GENTE.boton():''}</header>
  <div class="sl-bd" id="slBd">
   <div class="sl-v1" id="slV1"><div class="sl-mesa" id="slMesa"></div><p class="ui-sub sl-mira" id="slMira"></p>
    <nav class="sl-acc"><button class="sl-p" id="slRegB" onclick="SALA.ver('reglas')">${I('ajustes')}Reglas</button><button class="sl-p sl-est" id="slEstB" hidden onclick="SALA.ver('est')"><span class="sl-estv" id="slEstV"></span>Estilo</button><button class="sl-p sl-est" id="slFiB" hidden onclick="SALA.ver('ficha')"><span class="sl-estv" id="slFiV"></span>Ficha</button><button class="sl-p sl-i" onclick="SALA.reglas()" aria-label="Cómo jugar" title="Cómo jugar">${I('ayuda')}</button>
     <button class="sl-p sl-i" onclick="SALA.ver('mus')" aria-label="Música">${I('musica')}</button><button class="sl-p sl-i sl-peligro" id="slSalir" onclick="SALA.salir()">${I('salir')}</button></nav></div>
   <div class="sl-v2" id="slV2" hidden><button class="sl-back" onclick="SALA.ver(null)">${I('atras')}<b id="slSubT"></b></button><div id="slSubB"></div></div>
  </div>
  <footer class="sl-ft" id="slFt"></footer>
 </section><div class="sl-modal" id="slModal" hidden onclick="if(event.target===this)SALA.cierra()"></div>`;
 document.body.appendChild(el);if(window.MORPH)['slMesa','slFt'].forEach(i=>MORPH.auto($(i)))}
function vista(){const a=$('slV1'),b=$('slV2');if(!a)return;a.hidden=!!sub;b.hidden=!sub;el.classList.toggle('sub',!!sub)}
function ver(n){if(!el||!shown)return;const v=vv();if(n==='juego'&&!(v&&v.host))return;if(n===sub)n=null;sub=n;snd('tick');vista();$('slBd').scrollTop=0;
 if(sub){$('slSubT').textContent={reglas:'Reglas',juego:'Juego',mus:'Música',est:'Mesa y cartas',ficha:'Tu ficha'}[sub]||'';subPinta(true)}
 const a=sub?$('slV2'):$('slV1');a.classList.remove('ent');void a.offsetWidth;a.classList.add('ent')}
function subPinta(f){if(!sub)return;const k=sub+'|'+(sub==='reglas'?sig.raw:sub==='juego'?sig.k:sub==='est'?sig.k+estK():sub==='ficha'&&cur&&cur.ficha?cur.ficha.key():'');if(!f&&k===sig.sb)return;sig.sb=k;const b=$('slSubB');
 if(sub==='reglas')b.innerHTML=`<div class="sl-reglas">${sig.reglas||''}</div>`;
 else if(sub==='juego'){const L=ORD.filter(x=>GM[x]).concat(Object.keys(GM).filter(x=>!ORD.includes(x)));
  b.innerHTML=`<div class="sl-cajas">${L.map(x=>`<button class="sl-caja${x===sig.k?' on':''}" style="--f:${COL[x]||'#C2512A'}" onclick="SALA.juego('${x}')" aria-pressed="${x===sig.k}"><span class="ic">${ico(x)}</span><b>${es(nom(x))}</b></button>`).join('')}</div>`}
 else if(sub==='est')b.innerHTML=`<div class="sl-est2">${sig.k==='uno'||!LOBBY.vista?'':`<div class="lbh-vista">${LOBBY.vista()}</div>`}${LOBBY.u.est(sig.k)}</div>`;
 else if(sub==='ficha')b.innerHTML=cur&&cur.ficha?cur.ficha.html():'';
 else b.innerHTML=window.musSlider?musSlider():''}
// estilo de la mesa 2D (solo sin casa, en Continental y Uno): fondo, cartas y reverso de c_lobby.js
const estOk=k=>!H3()&&(k==='continental'||k==='uno')&&!!(window.LOBBY&&LOBBY.u&&LOBBY.u.est);
const estK=()=>{try{return [sbg,scards,sback,cbl].join()}catch(e){return ''}};

// sync(g): game.js en cada render() de la sala de espera. Sin casa la dibuja con la mesa 2D de SL2D (c_sala2d.js); false = sala de siempre (c_lobby.js)
function sync(g){const H=H3(),v=vv();if(!g||!v||v.G)return false;const d2=!H&&!!window.SL2D&&SL2D.ok();if(!H&&!d2)return false;arma();el.classList.toggle('sl2d',d2);if(d2)SL2D.monta(el);else if(window.SL2D)SL2D.quita();cur=g;
 if(!shown){shown=true;sub=null;vista();sig={};prev=null;hola={};if(H&&H.arranca)H.arranca(v.game);el.classList.remove('sale','open','in');void el.offsetWidth;el.classList.add('in');requestAnimationFrame(paso)}
 pinta(g,v);return true}
function pinta(g,v){const k=v.game,host=!!v.host,me=v.me;el.style.setProperty('--sl-c',COL[k]||'#C2512A');el.classList.toggle('host',host);
 if(sig.k!==k){sig.k=k;const ic=$('slIc');ic.innerHTML=ico(k);ic.classList.remove('pop');void ic.offsetWidth;ic.classList.add('pop');$('slName').textContent=nom(k)}
 $('slCode').textContent=v.code||'';{const eo=estOk(k),eb=$('slEstB');eb.hidden=!eo;if(eo){const ek=k+estK();if(eb.dataset.k!==ek){eb.dataset.k=ek;$('slEstV').innerHTML=k==='uno'?I('pincel'):LOBBY.vista?LOBBY.vista():''}}else if(sub==='est')ver(null)}if(!host&&sub==='juego')ver(null);
 {const fb=$('slFiB'),fo=!!g.ficha;fb.hidden=!fo;if(fo){const fk=g.ficha.key();if(fb.dataset.k!==fk){fb.dataset.k=fk;$('slFiV').innerHTML=g.ficha.ico()}}else if(sub==='ficha')ver(null)}
 // reglas del juego (su lobby de siempre): Empezar va abajo, "Agregar bot" es un asiento con +, los Sí/No son interruptores
 let raw='';try{raw=g.lobby(host?1:0)||''}catch(e){}
 if(raw!==sig.raw){sig.raw=raw;const d=document.createElement('div');d.innerHTML=raw;const bt=r=>[...d.querySelectorAll('button')].find(x=>r.test(x.getAttribute('onclick')||''));
  const b=bt(/'start'/);sig.go=null;
  if(b){const nx=b.nextElementSibling;if(nx&&nx.classList.contains('top'))nx.remove();sig.go={on:b.getAttribute('onclick'),dis:b.disabled};b.remove()}
  const ab=bt(/addbot/);sig.add=null;
  if(ab){sig.add={on:ab.getAttribute('onclick'),dis:ab.disabled};const bx=ab.closest('.box'),nx=ab.nextElementSibling;if(nx&&nx.classList.contains('top'))nx.remove();ab.remove();
   if(bx){const c=bx.cloneNode(true);c.querySelectorAll('b,strong,br').forEach(x=>x.remove());if(!c.textContent.trim()&&!c.querySelector('button,select,input'))bx.remove()}}
  ai=!sig.add&&/\bbots?\b/i.test(d.textContent);
  d.querySelectorAll('b,strong').forEach(x=>{if(/^reglas de esta sala$/i.test(x.textContent.trim()))x.remove()});
  d.querySelectorAll('button').forEach(x=>{const m=/^(.+?):\s*(Sí|No)$/.exec(x.textContent.trim());if(!m)return;const l=document.createElement('label');l.className='sl-tg';
   l.innerHTML=`<span>${es(m[1])}</span><span class="ui-sw"><input type="checkbox"${m[2]==='Sí'?' checked':''}${x.disabled?' disabled':''}><i></i></span>`;
   l.querySelector('input').setAttribute('onchange',x.getAttribute('onclick')||'');x.replaceWith(l)});
  aiTxt(d);sig.reglas=d.textContent.trim()||d.querySelector('select,input')?d.innerHTML:'';$('slRegB').hidden=!sig.reglas;if(!sig.reglas&&sub==='reglas')ver(null)}
 subPinta();
 // gente: los de la sala se sientan en la mesa de la casa; la AI ocupa el resto
 const ps=v.players.map((p,i)=>Object.assign({i},p)).filter(p=>!p.out),n=ps.length,max=Math.max(n,(v.opts&&+v.opts.n)||g.max||6),libres=ai?Math.min(max,6)-n:0;
 const names=ps.map(p=>p.name),avs=ps.map(p=>p.av||''),nk=k+'#'+v.me+'#'+names.join('|')+'#'+avs.join('|');
 if(nk!==sig.n){sig.n=nk;const H=H3();if(H)H.sala.gente(k,names,avs,ps.findIndex(p=>p.i===v.me));
  if(prev){const nuevos=names.filter(x=>!prev.includes(x));nuevos.forEach(x=>{hola[x]=performance.now()});if(nuevos.length)snd('tick')}prev=names}
 if(!H3()&&window.SL2D)SL2D.pinta({k,h:ico(k)},ps,me,libres,hola,colOf);
 const add=host&&sig.add&&!sig.add.dis&&n<max,lk=JSON.stringify([ps.map(p=>[p.name,p.on,p.id,p.i,p.bot]),me,host,libres,add]);
 if(lk!==sig.l){sig.l=lk;const t=performance.now();
  $('slMesa').innerHTML=ps.map(p=>`<div class="sl-seat${t-(hola[p.name]||-1e9)<2500?' nuevo':''}"><i class="sl-av" style="--c:${colOf(p.name)}">${ini(p.name)}${p.bot?'':`<span class="sl-dot${p.on?' on':''}"></span>`}</i><span>${p.i===me?'Tú':es(p.name)}</span>`+
   (host&&p.i!==me?`<button class="sl-kick" onclick="kick('${es(p.id)}')" aria-label="Sacar a ${es(p.name)}">${I('x')}</button>`:'')+'</div>').join('')+
   (add?`<button class="sl-seat sl-add" onclick="${es(sig.add.on)}" aria-label="Agregar AI"><i class="sl-av ai">${I('mas')}</i><span>AI</span></button>`:'')+
   '<div class="sl-seat"><i class="sl-av ai">AI</i><span>AI</span></div>'.repeat(Math.max(0,libres))}
 $('slMira').textContent=v.spec&&v.spec.length?'Mirando: '+v.spec.join(', '):'';
 const sa=host?'Cerrar sala':v.watch?'Dejar de mirar':'Salir de la sala',se=$('slSalir');if(se.title!==sa){se.title=sa;se.setAttribute('aria-label',sa)}
 // abajo: empezar (quien creó la sala), unirse (mirando) o esperando
 const m=typeof msg!='undefined'?msg:'',go=sig.go||{on:"send({t:'start'})"};let ft;
 if(host)ft=go.dis?'<button class="ui-btn full sl-go" disabled>Esperando jugadores</button>':`<button class="ui-btn full sl-go" onclick="${es(go.on)}">${I('jugar')}Empezar</button>`;
 else if(v.watch)ft=`<button class="ui-btn full sl-go" onclick="joinSpec()">${I('jugar')}Unirme a jugar</button>`;
 else ft='<div class="sl-espera" role="status"><i></i><i></i><i></i><span>Esperando al anfitrión</span></div>';
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
 sale=performance.now();el.classList.add('sale');el.classList.remove('in','open');$('slModal').hidden=true;const H=H3(),RM=window.CCAM&&CCAM.RM,va=!RM&&v.game==='uno'&&window.u3dVa&&u3dVa();if(H&&!va)H.sala.baja();snd('card');
 const s=$('slSello');s.classList.remove('on');void s.offsetWidth;s.classList.add('on');
 const fin=()=>{if(va&&window.u3dDesde)u3dDesde();sale=0;ocultar();if(typeof render=='function')render()};
 if(va){setTimeout(fin,160);return true}   // Uno en 3D: sin bajar ni fundir; su cámara sale de la de la casa y viaja a tu silla (c_uno3d.js)
 setTimeout(()=>{if(window.CCAM)CCAM.fade(1,RM?120:280).then(()=>{fin();setTimeout(()=>CCAM.fade(0,RM?120:520),60)});else fin()},RM?250:1100);return true}
function ocultar(){shown=false;sale=0;if(!el)return;el.classList.remove('in','sale','open');sub=null;vista();$('slModal').hidden=true;tagEls.forEach(t=>t.style.display='none');
 if(window.CASA3D&&CASA3D.sala)CASA3D.sala.gente(null,null);if(window.SL2D)SL2D.quita();sig={}}
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
 ver,copiaL,
 juego:k=>{if(vv()&&vv().host&&k!==vv().game){send({t:'game',g:k});ver(null)}},
 copia:()=>{const v=vv();if(v)copyT(v.code)},
 comparte:()=>{const v=vv();if(!v)return;const u=url();if(navigator.share)navigator.share({title:'gamemash',text:'¡Ven a jugar '+nom(v.game)+' conmigo! Código '+v.code,url:u}).catch(()=>{});else copiaL()},
 invita:()=>{const v=vv();if(!v)return;const u=url();modal(`<div class="sl-card" role="dialog" aria-label="Invitar a la sala"><h3>Invita a tu gente</h3>${window.GENTE?`<div class="sl-gen">${GENTE.invitables()}</div>`:''}<div class="sl-qr" id="slQr"></div><div class="sl-big">${es(v.code)}</div><div class="sl-link">${es(u)}</div>
  <div class="sl-dos"><button class="ui-btn sec" onclick="SALA.copiaL()">${I('copiar')}Copiar enlace</button><button class="ui-btn" onclick="SALA.comparte()">${I('compartir')}Compartir</button></div><button class="ui-btn ghost full" onclick="SALA.cierra()">Listo</button></div>`);qr(u)},
 reglas:()=>{if(!cur)return;modal(`<div class="sl-card sl-rul" role="dialog" aria-label="Cómo se juega"><div class="sl-rh"><h3>Cómo se juega ${es(nom(sig.k))}</h3><button class="ui-x" onclick="SALA.cierra()" aria-label="Cerrar">${I('x')}</button></div><div class="sl-rb">${cur.rules||''}</div></div>`);
  $('slModal').querySelectorAll('details').forEach(d=>d.open=true)},
 cierra:()=>{const m=$('slModal');if(m&&!m.hidden){m.hidden=true;snd('tick')}},
 salir:()=>{const v=vv();if(!v)return;if(v.host){if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}}else leave()}};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&el&&shown){if(!$('slModal').hidden){SALA.cierra();e.stopPropagation()}else if(sub){ver(null);e.stopPropagation()}}},true);
})();
