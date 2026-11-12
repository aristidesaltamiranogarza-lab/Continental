// Interfaz de la casa (estilo "Cálida", ui.css + ui_casa.css): pastilla del piso, gente, ajustes, controles, chat y gestos.
// c_casa3d.js pone CHUD.html(ctx) en hud(), le pasa los mensajes (CHUD.msg) y las teclas Enter / G / Esc (CHUD.key).
// Se carga ANTES de c_casa3d.js y después de c_ui.js (UI.ico, UI.setTema).
(function(){
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const I=(n,c)=>UI.ico(n,c),$=id=>document.getElementById(id);
const es=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PISO={pb:'Planta baja',sot:'Sótano',alta:'Planta alta',ter:'Terraza'};
const RUEDA=['😭','🥺','🤣','👻','❤️','🔥','🤬','🖕'],BAILES=[['💃','Twerk','Twerk'],['🕺','Disco','Capoeira'],['🌀','Breakdance','Footwork'],['🎧','House','House'],['👟','Hip hop','HipHop'],['👯','Macarena','Macarena'],['🤸','Breakdown','Freezes'],['🎮','Default','Clasico']];
const QH={ligero:'Pantalla 2D clásica. Para celulares sencillos.',medio:'Casa 3D sin sombras. Va bien en casi todo.',completo:'Casa 3D con sombras y todas las luces.'};
const COL=['#B5482A','#2F6FB0','#2E7D4F','#8E4FB0','#9A6A1E','#22807F','#B03A6A'];
const col=s=>{let h=0;for(const c of String(s||''))h=(h*31+c.codePointAt(0))|0;return COL[Math.abs(h)%COL.length]};
const av=n=>`<span class="uh-av" style="background:${col(n)}" aria-hidden="true">${es((Array.from(String(n||'?').trim())[0]||'?').toUpperCase())}</span>`;
let open=null,unread=0,ctl=ls.get('casa_ctl')!=='0',ctx={};
const msgs=[];
const tick=()=>{if(typeof sfx=='function')sfx('tick')};
const rr=()=>{if(typeof render=='function')render()};

// ---------- piezas ----------
function top(c){const p=PISO[c.piso]||'Casa';
 return `<div id="uiTop" class="ui uh-top"><button class="ui-pill" onclick="CHUD.pisos()" aria-label="Estás en ${p}. Ir a otro piso">${I('casa')}<span>${p}</span>${I('abajo','uh-chev')}</button>
 <span class="uh-tr"><button class="ui-pill" onclick="CHUD.tog('gente')" aria-label="Quién está en la casa: ${c.n}" aria-expanded="${open=='gente'}">${I('gente')}<span>${c.n}</span></button>
 <button class="ui-rb" onclick="CHUD.tog('ajustes')" aria-label="Ajustes" aria-expanded="${open=='ajustes'}">${I('menu')}</button></span></div>`}
function br(c){const k=!c.touchy,fl=c.fp?'Volver a tercera persona':'Primera persona';
 return `<div class="ui uh-br">${c.canFp?`<button class="ui-rb${c.fp?' on':''}" onclick="CHUD.fp()" aria-label="${fl}" aria-pressed="${c.fp}" title="${fl}${k?' (V)':''}">${I(c.fp?'persona':'ojo')}</button>`:''}
 <span class="uh-row"><button class="ui-rb mid${open=='gestos'?' on':''}" onclick="CHUD.tog('gestos')" aria-label="Gestos" aria-expanded="${open=='gestos'}" title="Gestos${k?' (G)':''}">${I('gesto')}${k?'<kbd>G</kbd>':''}</button>
 <button class="ui-rb big" onclick="CHUD.tog('chat')" aria-label="Chat${unread?', '+unread+' mensajes nuevos':''}" aria-expanded="${open=='chat'}" title="Chat${k?' (Enter)':''}">${I('chat')}<span class="ui-badge" id="uiChatN">${unread||''}</span>${k?'<kbd>Enter</kbd>':''}</button></span></div>`}
function ctlCard(){const r=(k,t)=>`<div class="uh-k"><span>${k.map(x=>`<kbd>${x}</kbd>`).join('')}</span>${t}</div>`;
 return `<div class="ui ui-card uh-ctl" role="note" aria-label="Controles"><div class="ui-hd"><b>Controles</b><button class="ui-x uh-xs" onclick="CHUD.ctlX()" aria-label="Cerrar controles">${I('x')}</button></div>
 ${r(['W','A','S','D'],'caminar')}${r(['Arrastra'],'girar')}${r(['V'],'primera persona')}</div>`}
function sheet(t,body,cls,foot){return `<div class="ui ui-sheet ${cls||''}" role="dialog" aria-label="${t}"><div class="ui-hd"><h2 class="ui-h">${t}</h2><button class="ui-x" onclick="CHUD.close()" aria-label="Cerrar">${I('x')}</button></div><div class="ui-bd">${body}</div>${foot||''}</div>`}
const seg=(L,cur,fn)=>`<div class="ui-seg full" role="group">${L.map(([v,t])=>`<button type="button" class="${v===cur?'on':''}" aria-pressed="${v===cur}" onclick="CHUD.${fn}('${v}')">${t}</button>`).join('')}</div>`;
const sw=(on,fn,l)=>`<label class="ui-sw"><input type="checkbox"${on?' checked':''} onchange="${fn}" aria-label="${l}"><i></i></label>`;
const P={
 gente:c=>`<div class="ui ui-card uh-drop" role="dialog" aria-label="Quién está en la casa"><span class="ui-lbl">En la casa · ${c.n}</span>${c.people.map(p=>`<div class="uh-per">${av(p.n)}<span><b>${es(p.n)}${p.me?' <small class="ui-sub">(tú)</small>':''}</b><small class="ui-sub">${PISO[p.f]||''}</small></span></div>`).join('')}</div>`,
 ajustes:c=>{const q=window.CALIDAD,mus=typeof musName=='function'?musName():null,snd=!(typeof mute!='undefined'&&mute);
  return sheet('Ajustes',`<div class="uh-name">${av(c.name)}<label><span class="ui-lbl">Tu nombre</span><input id="uiName" class="ui-in" maxlength="14" value="${es(c.name)}" oninput="pname=this.value;casaName()" autocomplete="nickname" spellcheck="false"></label></div>${window.MIPJ?`<button class="ui-btn sec full uh-pj" onclick="CHUD.close();MIPJ.abrir()">${I('persona')} Mi personaje</button>`:''}
  ${window.BIEN?`<span class="ui-lbl">Calidad</span>${seg([['ligero','Ligero'],['medio','Medio'],['completo','Completo']],q,'cal')}<small class="ui-sub uh-hint">${QH[q]||''}</small>`:''}
  <span class="ui-lbl">Tema</span>${seg([['auto','Automático'],['dia','Día'],['noche','Noche']],UI.tema(),'tema')}
  ${mus!=null&&window.musSlider?`<span class="ui-lbl">Música</span>${musSlider()}`:''}
  <div class="uh-sws"><div class="ui-row"><span>${I('sonido')}Sonidos</span>${sw(snd,'CHUD.snd(this.checked)','Sonidos')}</div>
  ${c.canFp?`<div class="ui-row"><span>${I('ojo')}Primera persona${c.touchy?'':' <small class="ui-sub">(V)</small>'}</span>${sw(c.fp,'CHUD.fp()','Primera persona')}</div>`:''}</div>
  <div class="uh-2"><button class="ui-btn sec" onclick="CHUD.tog('ayuda')">${I('ayuda')}Cómo se juega</button><button class="ui-btn sec" onclick="CHUD.salir()">${I('salir')}Salir de la casa</button></div>`,'der')},
 chat:c=>sheet('Chat de la casa',`<div class="uh-msgs" id="uiMsgs" aria-live="polite">${msgs.length?msgs.map(mm).join(''):vacio}</div>`,'izq',
  `<div class="uh-say"><input id="uiSay" class="ui-in" maxlength="80" placeholder="Di algo…" aria-label="Mensaje" enterkeyhint="send" onkeydown="if(event.key==='Enter'){event.preventDefault();CHUD.send()}else if(event.key==='Escape')CHUD.close()"><button class="ui-rb on" onclick="CHUD.send()" aria-label="Enviar">${I('enviar')}</button></div>`),
 gestos:c=>{const k=!c.touchy,R=Math.max(98,Math.min(138,innerWidth/2-46)),T=76,EI=n=>window.EICO?EICO.url(n):'';if(window.EICO)EICO.prep();
  return `<div class="ui uh-rueda${k?'':' tq'}" role="dialog" aria-label="Bailes y gestos"><div class="uh-ring" style="width:${2*R+T}px;height:${2*R+T}px">
   <div class="uh-hub" style="left:${R+T/2}px;top:${R+T/2}px"><span id="uhNom" class="uh-nom">Bailes</span><button class="ui-rb uh-ex" onclick="CHUD.close()" aria-label="Cerrar">${I('x')}</button></div>
   ${BAILES.map(([e,t,cl],i)=>{const a=-Math.PI/2+i*Math.PI/4,u=EI(cl);
   return `<button class="uh-b" style="left:${(R+Math.cos(a)*R).toFixed(1)}px;top:${(R+Math.sin(a)*R).toFixed(1)}px" onclick="CHUD.em('${e}')" onmouseenter="CHUD.nom('${t}')" onmouseleave="CHUD.nom()" onfocus="CHUD.nom('${t}')" aria-label="${t}"><img data-eico="${cl}"${u?` src="${u}" class="ok"`:''} alt=""><span class="uh-bt">${t}</span></button>`}).join('')}</div>
   <div class="uh-gz">${RUEDA.map((e,i)=>`<button class="uh-e" onclick="CHUD.em('${e}')" aria-label="Gesto ${i+1}">${e}${k?`<kbd>${i+1}</kbd>`:''}</button>`).join('')}</div></div>`},
 ayuda:c=>sheet('Cómo se juega',(c.touchy?[['Camina','Con el joystick de abajo, o toca el piso.'],['Mira','Arrastra para girar; pellizca para acercar.'],['Juega','Toca una mesa; al llegar, toca «Jugar» abajo.'],['Platica','El botón grande es el chat; el de la carita, los gestos.'],['Pisos','Toca el nombre del piso, arriba, para ir a otro.']]
  :[['Camina','W A S D o flechas, o clic en el piso.'],['Mira','Arrastra para girar; la rueda acerca. V: primera persona.'],['Juega','Clic en una mesa; al llegar, E (o el botón de abajo) abre su panel.'],['Platica','Enter abre el chat; G los gestos; 1 a 8, un gesto directo.'],['Pisos','Clic en el nombre del piso, arriba, para ir a otro.']])
  .map(([t,d])=>`<div class="ui-row uh-ay"><b>${t}</b><span class="ui-sub">${d}</span></div>`).join(''),'der')};
const vacio='<p class="ui-sub uh-empty">Nadie ha dicho nada todavía. ¡Saluda!</p>';
const mm=m=>`<div class="uh-m${m.me?' me':''}">${av(m.n)}<span><small>${es(m.n)}</small><span>${es(m.t)}</span></span></div>`;
// el fondo detrás de cada panel: en compu el chat no tapa el juego y los demás se cierran tocando afuera sin oscurecer
const SCRIM={gente:'uh-clear',ajustes:'ligero',ayuda:'ligero',chat:'uh-nodesk',gestos:''};

function html(c){ctx=c;if(c.busy&&open)open=null;
 let o=top(c);
 if(!c.busy){o+=br(c);if(!c.touchy&&ctl&&open!='chat')o+=ctlCard()}
 if(open){o+=`<div class="ui-scrim ${SCRIM[open]}" onclick="CHUD.close()"></div>`+P[open](c);
  if(open=='chat')requestAnimationFrame(baja)}
 return o}
function baja(){const l=$('uiMsgs');if(l)l.scrollTop=l.scrollHeight}

// ---------- acciones ----------
function tog(p){open=open===p?null:p;if(open=='chat'){unread=0}tick();rr();if(open=='chat'&&!ctx.touchy){const i=$('uiSay');if(i)i.focus()}}
function close(){if(!open)return;open=null;rr()}
function msg(n,t,mine){msgs.push({n,t,me:!!mine});if(msgs.length>60)msgs.shift();
 if(open=='chat'){const l=$('uiMsgs');if(l){if(msgs.length==1)l.innerHTML='';l.insertAdjacentHTML('beforeend',mm(msgs[msgs.length-1]));baja()}}
 else if(!mine){unread++;const b=$('uiChatN');if(b)b.textContent=unread}}
function send(){const i=$('uiSay'),t=i&&i.value.trim().slice(0,80);if(!t)return;i.value='';if(typeof casaSay=='function')casaSay(t);i.focus()}
function key(k){if(k=='escape'){if(!open)return false;close();return true}
 if(ctx.busy)return false;
 if(k=='enter'){if(open!='chat')tog('chat');const i=$('uiSay');if(i)i.focus();return true}
 if(k=='g'){tog('gestos');return true}
 return false}
window.CHUD={html,msg,key,tog,close,send,av,isOpen:()=>open,
 pisos:()=>{open=null;if(window.CIR)CIR.tog();else rr()},
 fp:()=>{if(typeof casaFp=='function')casaFp()},
 nom:t=>{const n=$('uhNom');if(n)n.textContent=t||'Bailes'},
 em:e=>{open=null;if(typeof casaEm=='function')casaEm(e);rr()},
 cal:q=>{if(window.BIEN)BIEN.set(q);rr()},
 tema:t=>{UI.setTema(t);tick();rr()},
 mus:n=>{if(typeof musCyc!='function')return;for(let i=0;i<4&&musName()!==n;i++)musCyc()},
 snd:on=>{mute=!on;if(on)tick();rr()},
 salir:()=>{open=null;if(window.BIEN&&BIEN.show)BIEN.show();rr()},
 ctlX:()=>{ctl=false;ls.set('casa_ctl','0');rr()}};
})();
