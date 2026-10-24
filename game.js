const GM={};
const A=document.getElementById('app'),RN=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],SU=['♠','♥','♦','♣'];
let S=null,V=null,v=0,sortS=false,sel=new Set(),staged=[],armando=false,msg='',online=true,pname='',code='',manual=false,myOrder=[],dg=null,noClick=0,seenTs=0,lastTs=-1,mute=false,AC=null,cdEnd=0,rlEnd=0,cdT=null,cdN=0,dealKey=-1,prevHand=new Set(),prevTop=-1,pgame='continental',upick=null;
try{S=JSON.parse(localStorage.getItem('cont_s')||'null');pname=localStorage.getItem('cont_n')||'';pgame=localStorage.getItem('cont_g')||'continental'}catch(e){}
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const FX=document.createElement('div');FX.id='fx';document.body.appendChild(FX);
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
function sfx(k){if(mute)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume();
 if(cardSfx(k))return;const f={bad:[[170,.18,'sawtooth']],tick:[[660,.08]],go:[[880,.25]],card:[[420,.06,'triangle']],win:[[523,.12],[659,.12],[784,.12],[1047,.35]]}[k];let t=AC.currentTime;
 f.forEach(([hz,d,ty])=>{const o=AC.createOscillator(),g=AC.createGain();o.type=ty||'sine';o.frequency.value=hz;g.gain.setValueAtTime(.15,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d);t+=d})}catch(e){}}
document.addEventListener('pointerdown',()=>{try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume()}catch(e){}});
function confetti(n){if(RM)return;for(let k=0;k<n;k++){const e=document.createElement('i');e.style.cssText=`left:${Math.random()*100}%;background:hsl(${Math.random()*360},90%,60%);animation-duration:${2+Math.random()*2}s;animation-delay:${Math.random()*.8}s`;FX.appendChild(e);setTimeout(()=>e.remove(),5000)}}
function banner(t){const e=document.createElement('div');e.className='ban';e.textContent=t;FX.appendChild(e);setTimeout(()=>e.remove(),2800)}
function cdStart(ms,rc){const t0=Date.now();rlEnd=t0+(rc||0);sfx('shuf');cdEnd=t0+ms;cdN=0;clearInterval(cdT);cdT=setInterval(()=>{const now=Date.now(),n=Math.ceil((cdEnd-now)/1000);if(now>=rlEnd&&n!==cdN){cdN=n;sfx(n>0?'tick':'go')}if(n<=0)clearInterval(cdT);render()},100)}
function rouletteStart(n){const rl=n.rl;if(!rl||!(n.rc>0))return;const old=document.getElementById('rl');if(old)old.remove();
 const who=n.players[rl.who].name,ms=n.rc,spin=Math.max(0,Math.min(4800,ms-1700)),th=360/52,fin=360*6-(rl.sl+.5)*th+(Math.random()-.5)*th*.6;
 const el=document.createElement('div');el.id='rl';
 el.innerHTML=`<div class="rt">🎰 Ruleta del comodín</div><div class="rw"><div class="rp">▼</div><div class="rd"><i class="rj">🃏</i></div></div><div class="rs">${esc(who)} puede ganarse un comodín (1 de 52)</div><div class="rr"></div>`;
 document.body.appendChild(el);
 const rd=el.querySelector('.rd'),rr=el.querySelector('.rr'),show=()=>{rr.textContent=rl.hit?'🃏 ¡'+who+' se queda un comodín!':'Nadie se lleva el comodín';rr.className='rr on'+(rl.hit?' win':'');sfx(rl.hit?'win':'tick');if(rl.hit)confetti(60)};
 if(RM||spin<600){rd.style.transform=`rotate(${fin}deg)`;show()}
 else{rd.style.transition=`transform ${spin}ms cubic-bezier(.12,.6,.1,1)`;rd.getBoundingClientRect();requestAnimationFrame(()=>{rd.style.transform=`rotate(${fin}deg)`});
  setTimeout(show,spin+100);let w=70,t=0;const f=()=>{if(!el.isConnected||t>spin)return;sfx('card');t+=w;w*=1.08;setTimeout(f,w)};f()}
 setTimeout(()=>el.remove(),ms)}
function onNew(o,n){if(!n){dealKey=-1;lastN=-1;return}
 if(n.phase=='play'&&n.cd>0&&dealKey!==n.dn){dealKey=n.dn;cdStart(n.cd,n.rc);rouletteStart(n)}
 else if(o&&n.phase=='play'&&n.turn===V.me&&o.turn!==n.turn)sfx('go');
 evs(n);
 const g=GM[V.game];if(g&&g.win){if(n.phase=='end'&&(!o||o.phase!='end'||o.round!==n.round))g.win(n,0);
 if(n.phase=='final'&&(!o||o.phase!='final'))g.win(n,1)}}
function bad(t){msg='✋ No puedes hacer eso. '+t;sfx('bad');render();document.querySelectorAll('.c.s').forEach(e=>e.classList.add('bad'));if(navigator.vibrate)navigator.vibrate(120)}
const BGS={green:'#1f8a5a',red:'#a4303a',blue:'#2a6db0',orange:'#c8731d'};
const BKS={red:'#8e1b1b',blue:'#1e4fa3',gold:'#c9a227',neon:'linear-gradient(45deg,#00e5ff,#a100ff)'},CARDS=['classic','black','retro','contrast'];
let sbg='green',scards='classic',sback='red',lastN=-1;
try{sbg=localStorage.getItem('cont_bg')||'green';scards=localStorage.getItem('cont_cards')||'classic';sback=localStorage.getItem('cont_back')||'red'}catch(e){}
if(!BGS[sbg])sbg='green';if(!CARDS.includes(scards))scards='classic';if(!BKS[sback])sback='red';
let cbl=false;try{cbl=localStorage.getItem('cont_cb')=='1'}catch(e){}
const gnow=()=>S&&V?V.game:pgame;
function theme(){const r=document.documentElement;r.dataset.game=gnow()=='uno'?'uno':'';r.dataset.cb=cbl?'on':'off';if(gnow()!='uno')delete r.dataset.ucol}
const setCb=x=>{cbl=x;try{localStorage.setItem('cont_cb',x?'1':'0')}catch(e){}render()};
const H1=t=>gnow()=='uno'?'<h1 class="ulogo"><span>UNO</span></h1>':`<h1>${t}</h1>`;
function applyStyle(){document.documentElement.dataset.bg=sbg;document.documentElement.dataset.cards=scards;document.documentElement.dataset.back=sback;try{localStorage.setItem('cont_bg',sbg);localStorage.setItem('cont_cards',scards);localStorage.setItem('cont_back',sback)}catch(e){}}
const setBg=x=>{sbg=x;applyStyle();render()},setCards=x=>{scards=x;applyStyle();render()},setBack=x=>{sback=x;applyStyle();render()};
applyStyle();
function styleUI(){if(gnow()=='uno')return `<div class="box"><b>Estilo UNO</b> (caja clásica)<br>Letra del color en cada carta (ayuda si confundes colores): <button class="b g sm2${cbl?' on':''}" onclick="setCb(${!cbl})">${cbl?'Sí':'No'}</button></div>`;return '<div class="box">Fondo: '+Object.keys(BGS).map(k=>`<button class="sw${sbg==k?' on':''}" style="background:${BGS[k]}" onclick="setBg('${k}')" aria-label="${k}"></button>`).join('')+`<br>Cartas: ${[['classic','Clásicas'],['black','Negras'],['retro','Retro'],['contrast','Contraste']].map(([k,n])=>`<button class="b g sm2${scards==k?' on':''}" onclick="setCards('${k}')">${n}</button>`).join('')}<br>Reverso: ${Object.keys(BKS).map(k=>`<button class="sw${sback==k?' on':''}" style="background:${BKS[k]}" onclick="setBack('${k}')" aria-label="${k}"></button>`).join('')}</div>`}
function nz(d,f,q,v,at){const n=AC.sampleRate*d|0,b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/n,2);const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=b;fl.type='bandpass';fl.frequency.value=f;fl.Q.value=q;g.gain.value=v;s.connect(fl);fl.connect(g);g.connect(AC.destination);s.start(AC.currentTime+(at||0))}
function cardSfx(k){if(k=='draw'){nz(.1,3200,1,.9);nz(.07,1800,1.2,.6,.05)}else if(k=='place'){nz(.05,900,.8,1.1);nz(.08,3800,1,.7,.01)}else if(k=='shuf'){for(let i=0;i<7;i++)nz(.05,2500+Math.random()*1500,1,.7,i*.07)}else return false;return true}
function fly(a,b,id){if(RM||!a||!b)return;const r=a.getBoundingClientRect(),q=b.getBoundingClientRect(),W=46,H=64;
 const e=document.createElement('div');e.className='c fly'+(id==null?' bk':'');
 if(id!=null){const f=(GM[V.game]||GM.continental).face(id);e.innerHTML=f.h;if(f.cls)e.className+=' '+f.cls}
 e.style.cssText=`left:${r.left+r.width/2-W/2}px;top:${r.top+r.height/2-H/2}px;width:${W}px;height:${H}px`;FX.appendChild(e);
 requestAnimationFrame(()=>requestAnimationFrame(()=>{e.style.transform=`translate(${q.left+q.width/2-r.left-r.width/2}px,${q.top+q.height/2-r.top-r.height/2}px)`}));
 setTimeout(()=>e.remove(),700)}
function flyEv(e){const $=s=>document.querySelector(s),seat=k=>$(`[data-seat="${k}"]`),t=e.t;
 if(t.startsWith('robó'))fly($('#deck'),seat(e.k),null);
 else if(t.startsWith('tomó'))fly($('#disc'),seat(e.k),e.c);
 else if(t.startsWith('compró')){fly($('#disc'),seat(e.k),e.c);fly($('#deck'),seat(e.k),null)}
 else if(/^(descartó|jugó)/.test(t))fly(seat(e.k),$('#disc'),e.c);
 else if(t.startsWith('pegó')||t.startsWith('cambió'))fly(seat(e.k),$('#mesa'),e.c);
 else if(t.startsWith('se bajó'))fly(seat(e.k),$('#mesa'),null)}
function evs(n){const ln=n.ln||0;if(ln<lastN||lastN<0){lastN=ln;return}if(ln==lastN)return;
 const ev=(n.log||[]).filter(e=>e.n>lastN).slice(-3);lastN=ln;
 ev.forEach((e,i)=>setTimeout(()=>{sfx(/^(robó|tomó|compró)/.test(e.t)?'draw':/^(quiere|dijo)/.test(e.t)?'tick':'place');const gm=GM[V.game];if(gm&&gm.ev)gm.ev(e);if(!(e.k===V.me&&/^(robó|tomó|compró)/.test(e.t)))flyEv(e)},60+i*320))}
function copyT(t){const ok=()=>banner('Código copiado ✓');const fb=()=>{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');ok()}catch(e){}a.remove()};
 try{navigator.clipboard.writeText(t).then(ok,fb)}catch(e){fb()}}
const CH=document.createElement('div');CH.id='chat';
CH.innerHTML=`<div id="cp"><div id="cl"></div><div id="cf"><input id="ci" maxlength="300" placeholder="Escribe un mensaje…" onkeydown="if(event.key==='Enter')chatSend()"><button class="b sm2" onclick="chatSend()">Enviar</button></div></div><button id="cb" onclick="chatTog()">💬<span id="cn"></span></button>`;
document.body.appendChild(CH);let chatOpen=false;
function chatTog(){chatOpen=!chatOpen;CH.classList.toggle('open',chatOpen);chatUp();if(chatOpen)document.getElementById('ci').focus()}
function chatUp(){const ch=(V&&V.chat)||[],l=document.getElementById('cl');CH.style.display=S&&V?'block':'none';if(!V)return;
 l.innerHTML=ch.map(m=>`<div>${m.k>=0?chip(m.k):''}<b>${esc(m.name)}:</b> ${esc(m.t)}</div>`).join('');
 const nw=ch.length?ch[ch.length-1].ts:0;if(lastTs>=0&&nw>lastTs&&ch[ch.length-1].k!==V.me)sfx('tick');lastTs=nw;
 if(chatOpen){seenTs=nw;l.scrollTop=l.scrollHeight}
 const u=ch.filter(m=>m.ts>seenTs&&m.k!==V.me).length;document.getElementById('cn').textContent=u?' '+u:''}
function chatSend(){const i=document.getElementById('ci'),t=i.value.trim();if(!t||!S)return;i.value='';i.focus();api('act',{c:S.c,t:S.t,m:{t:'chat',text:t}}).then(d=>{if(d&&d.err){i.value=t;bad(d.err==='Acción desconocida.'?'El servidor no tiene el chat: reinícialo (Ctrl+C y node server.js).':d.err)}}).catch(()=>{i.value=t;bad('Sin conexión.')})}
const oi=c=>{const k=myOrder.indexOf(c.id);return k<0?1e6+c.id:k};
function cyc(){if(!manual&&!sortS)sortS=true;else if(sortS){sortS=false;manual=true}else manual=false;render()}
document.addEventListener('pointerdown',e=>{const c=e.target.closest&&e.target.closest('#hand .c, #mini .c');if(!c)return;dg={id:+c.dataset.id,x:e.clientX,y:e.clientY,on:0,el:c,from:c.closest('#mini')?'slot':'hand'}});
document.addEventListener('pointermove',e=>{if(!dg)return;
 if(!dg.on&&Math.hypot(e.clientX-dg.x,e.clientY-dg.y)>10){dg.on=1;const r=dg.el.getBoundingClientRect();dg.g=dg.el.cloneNode(true);dg.g.className+=' fly';dg.g.removeAttribute('onclick');dg.g.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;transition:none;z-index:90`;FX.appendChild(dg.g);dg.el.style.opacity=.3}
 if(dg.on){dg.g.style.transform=`translate(${e.clientX-dg.x}px,${e.clientY-dg.y}px)`;const t=document.elementFromPoint(e.clientX,e.clientY),sl=t&&t.closest&&t.closest('.slot');document.querySelectorAll('.slot.over').forEach(x=>x.classList.remove('over'));if(armando&&sl)sl.classList.add('over')}});
document.addEventListener('pointerup',e=>{if(!dg)return;const d=dg;dg=null;if(!d.on)return;d.g.remove();noClick=Date.now();
 const tt=document.elementFromPoint(e.clientX,e.clientY),sl=tt&&tt.closest&&tt.closest('.slot');
 if(armando&&sl)return dropSlot(d.id,+sl.dataset.k,e.clientX,e.clientY);
 if(d.from=='slot')return unslot(d.id);
 const els=[...document.querySelectorAll('#hand .c')].filter(x=>+x.dataset.id!==d.id);let best=-1,bd=1e12;
 els.forEach((x,k)=>{const r=x.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),dd=dx*dx+dy*dy;if(dd<bd){bd=dd;best=k}});
 const ids=els.map(x=>+x.dataset.id),r=best>=0?els[best].getBoundingClientRect():null;ids.splice(best<0?0:best+(e.clientX>r.left+r.width/2?1:0),0,d.id);
 myOrder=ids;manual=true;render()});
document.addEventListener('pointercancel',()=>{if(dg&&dg.g)dg.g.remove();dg=null;render()});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const api=async(p,b)=>(await fetch(p,{method:'POST',body:JSON.stringify(b)})).json();
function store(){CH.style.display=S&&V?'block':'none';try{S?localStorage.setItem('cont_s',JSON.stringify(S)):localStorage.removeItem('cont_s');localStorage.setItem('cont_n',pname);localStorage.setItem('cont_g',pgame)}catch(e){}}
function enter(d){if(d.err){msg=d.err;return render()}S={c:d.c,t:d.t};V=null;v=0;msg='';store();loop();render()}
async function mk(mode){pname=pname.trim()||'Jugador';try{enter(await api('new',{name:pname,mode,game:pgame}))}catch(e){msg='No se pudo conectar con el servidor.';render()}}
async function joinR(){pname=pname.trim()||'Jugador';try{enter(await api('join',{c:code.trim(),name:pname}))}catch(e){msg='No se pudo conectar con el servidor.';render()}}
function leave(){S=null;V=null;store();render()}
async function loop(){const my=S;while(S===my){try{const d=await(await fetch(`poll?c=${S.c}&t=${S.t}&v=${v}`)).json();online=true;
  if(d.gone||d.kicked){msg=d.kicked?'Fuiste expulsado de la sala.':'La sala ya no existe.';S=null;V=null;store();render();return}
  if(!d.same){const o=V&&V.G;if(!o||!d.G||o.tc!==d.G.tc||o.phase!==d.G.phase||o.round!==d.G.round){sel=new Set();staged=[];armando=false}V=d;v=d.v;onNew(o,d.G);chatUp()}render()}
 catch(e){online=false;render();await sleep(1500)}}}
async function send(m){msg='';try{const d=await api('act',{c:S.c,t:S.t,m});if(d.err){bad(d.err);return false}sel=new Set();return true}catch(e){bad('Sin conexión.');return false}}
const kick=id=>{if(confirm('¿Expulsar a este jugador?'))send({t:'kick',id})};
const hc=k=>{const h=V.G.hands[k];return Array.isArray(h)?h.length:h};
const nm=i=>esc(V.G.players[i].name);
const COL=['#e53935','#1e88e5','#fdd835','#43a047','#8e24aa','#fb8c00','#00acc1','#ec407a','#9e9d24','#8d6e63'];
const chip=k=>`<i class="chip" style="--c:${COL[k%10]}"></i>`;
function seats(bd){const G=V.G;return '<div class="seats">'+G.players.map((p,k)=>{const o=V.players[k],n=hc(k),on=G.phase=='play'&&G.turn==k,st=o.out?'expulsado':on?(G.step=='draw'?'robando…':'jugando…'):'';
 return `<div class="seat${on?' on':''}${o.out?' out':''}" data-seat="${k}" style="--c:${COL[k%10]}">${chip(k)}<b>${esc(p.name)}${k==V.me?' (tú)':''}</b><i class="dot${o.on?' on':''}"></i><div class="fan">${'<u></u>'.repeat(Math.min(n,9))}<em>${n}</em></div>${bd?bd(k):''}<small>${st}</small></div>`}).join('')+'</div>'}
function logv(){const L=(V.G.log||[]).slice(-5).reverse();return L.length?'<div class="log">'+L.map(e=>`<div>${chip(e.k)}<b>${esc(V.G.players[e.k].name)}</b> ${esc(e.t)}</div>`).join('')+'</div>':''}
function plist(){return `<div class="box"><b>Jugadores</b> (${V.players.filter(p=>!p.out).length}/${(GM[V.game]||GM.continental).max})`+V.players.map((p,k)=>`<div><i class="dot${p.on?' on':''}"></i>${esc(p.name)}${k==V.me?' (tú)':''}${p.out?' · expulsado':''}${V.host&&k!=V.me&&!p.out?` <button class="b g sm2" onclick="kick('${p.id}')">Expulsar</button>`:''}</div>`).join('')+(V.host&&V.me<0?'<div class="top">Eres el host: administras, no juegas.</div>':'')+'</div>'}
function home(){const g=GM[pgame]||GM.continental;return `${H1('🎴 Juegos de cartas')}<input placeholder="Tu nombre" maxlength="14" value="${esc(pname)}" oninput="pname=this.value">
 <div class="box"><b>Crear una sala</b><br>Juego: ${Object.keys(GM).map(k=>`<button class="b g sm2${pgame==k?' on':''}" onclick="pgame='${k}';render()">${GM[k].emoji} ${GM[k].name}</button>`).join('')}<br><button class="b" onclick="mk('listo')">Listo</button><button class="b g" onclick="mk('host')">Host</button><br><span class="top"><b>Listo</b>: creas la sala y juegas. <b>Host</b>: solo administras, no juegas.</span></div>
 <div class="box"><b>Unirme a una sala</b><br><input placeholder="Código" maxlength="5" value="${esc(code)}" oninput="code=this.value.toUpperCase()" style="text-transform:uppercase;width:120px"><button class="b" onclick="joinR()">Unirme</button></div><div class="msg">${msg}</div>`+styleUI()+g.rules}
function render(){theme();if(!S){A.innerHTML=home();return}
 if(!V){A.innerHTML=`${H1('🎴 Juegos de cartas')}<p>${online?'Entrando a la sala…':'Reconectando…'}</p>`;return}
 const g=GM[V.game]||GM.continental,G=V.G,cdn=Math.ceil((cdEnd-Date.now())/1000),cd=cdn>0&&Date.now()>=rlEnd?`<div class="cd">${cdn}</div>`:'',off=online?'':'<div class="box msg">⚠ Reconectando con el servidor… tu lugar y tus cartas se conservan.</div>';let h;
 if(!G)h=`${H1(g.emoji+' '+g.name)}<div class="box">Código: <b style="font-size:1.6em;letter-spacing:.15em;cursor:pointer" onclick="copyT('${esc(V.code)}')">${esc(V.code)}</b> <span class="top">(toca para copiar)</span><br><span class="top">Enlace: ${esc(location.origin+'/#'+V.code)}</span></div>${plist()}`+(V.host?g.lobby(1)+`<button class="b g" onclick="if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}">Cerrar sala</button>`:g.lobby(0)+'<p>Esperando a que el host empiece…</p><button class="b g" onclick="leave()">Salir</button>')+`<div class="msg">${msg}</div>`+g.rules;
 else h=g.body();
 A.innerHTML=cd+off+h;if(g.after)g.after()}
if(location.hash.length>1)code=location.hash.slice(1).toUpperCase().slice(0,5);
addEventListener('load',()=>{if(S)loop();render()});
