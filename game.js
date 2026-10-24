const A=document.getElementById('app'),RN=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],SU=['♠','♥','♦','♣'];
const CON=['TT','TC','CC','TTT','TTC','CCT','CCC'],TN={T:'Trío',C:'Corrida'};
let S=null,V=null,v=0,sortS=false,sel=new Set(),staged=[],armando=false,msg='',online=true,pname='',code='',manual=false,myOrder=[],dg=null,noClick=0,seenTs=0,lastTs=-1,mute=false,AC=null,cdEnd=0,rlEnd=0,cdT=null,cdN=0,dealKey=-1,prevHand=new Set(),prevTop=-1;
try{S=JSON.parse(localStorage.getItem('cont_s')||'null');pname=localStorage.getItem('cont_n')||''}catch(e){}
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const conTxt=k=>CON[k].split('').map(x=>TN[x]).join(' + ');
const C=id=>id%53==52?{id,r:0,s:-1,j:1}:{id,r:id%53%13+1,s:Math.floor(id%53/13),j:0};
const pts=c=>c.j?50:c.r==1?20:c.r>=11?15:c.r;
function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function trio(cs){const n=cs.filter(c=>!c.j);return n.length>=3&&n.every(c=>c.r==n[0].r)}
function runArr(cs){const n=cs.filter(c=>!c.j),L=cs.length;
 if(L<4||new Set(n.map(c=>c.s)).size>1||new Set(n.map(c=>c.r)).size<n.length)return null;
 for(const hi of [0,1]){const v=n.map(c=>[c,c.r==1&&hi?14:c.r]);
  for(let st=1;st+L-1<=14;st++)if(v.every(x=>x[1]>=st&&x[1]<=st+L-1)){const js=cs.filter(c=>c.j),o=[];
   for(let p=st;p<st+L;p++){const f=v.find(x=>x[1]==p);o.push(f?f[0]:js.pop())}if(o.every((c,i)=>!(c.j&&i&&o[i-1].j)))return o}}
 return null}
function card(c,o={}){const red=!c.j&&(c.s==1||c.s==2);
 return `<div class="c${red?' r':''}${o.sel?' s':''}${o.sm?' sm':''}${o.nw?' nw':''}"${o.id?` id="${o.id}"`:''}${o.did!=null?` data-id="${o.did}"`:''}${o.on?` onclick="${o.on}"`:''}>${c.j?'🃏':RN[c.r-1]+'<small>'+SU[c.s]+'</small>'}</div>`}
const rules=`<details><summary>Reglas</summary>Rondas 1 a 7 con 7 a 13 cartas. Contratos: ${CON.map((_,i)=>(i+1)+'. '+conTxt(i)).join('; ')}.<br>Trío: 3 o más cartas normales del mismo número; puedes agregarle comodines. Corrida: 4 o más cartas seguidas del mismo palo (el As va al inicio o al final). En las corridas los comodines nunca van dos seguidos. Un comodín jamás se descarta ni aparece en el descarte. Al empezar cada ronda gira la ruleta: con 1 posibilidad entre 52, quien tiene el primer turno se queda un comodín como una de sus cartas iniciales. Barajas: jugadores ÷ 2 + 1 (hacia abajo), cada una con 1 comodín.<br>Turno: robas (mazo o descarte), armas, pegas y descartas. No puedes descartar una carta que cabe en una combinación de la mesa (salvo que todas las tuyas quepan). Para bajarte armas todo el contrato de una vez; solo después puedes pegar cartas. Puedes cambiar un comodín de una corrida por la carta natural que representa; si no te has bajado, solo si usarás ese comodín para bajarte en el mismo turno.<br>Comprar: fuera de tu turno, mientras quien lo tiene no haya descartado, puedes pedir la carta de arriba del descarte (+1 carta de castigo). Si quien tiene el turno la toma, él tiene prioridad. Si no, al descartar se la lleva el más cercano a jugar.<br>Puntos: 2 a 10 = su valor, J, Q y K = 15, As = 20, comodín = 50. Gana quien tenga menos puntos.</details>`;
const FX=document.createElement('div');FX.id='fx';document.body.appendChild(FX);
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
function sfx(k){if(mute)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume();
 if(cardSfx(k))return;const f={bad:[[170,.18,'sawtooth']],tick:[[660,.08]],go:[[880,.25]],card:[[420,.06,'triangle']],win:[[523,.12],[659,.12],[784,.12],[1047,.35]]}[k];let t=AC.currentTime;
 f.forEach(([hz,d,ty])=>{const o=AC.createOscillator(),g=AC.createGain();o.type=ty||'sine';o.frequency.value=hz;g.gain.setValueAtTime(.15,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d);t+=d})}catch(e){}}
document.addEventListener('pointerdown',()=>{try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume()}catch(e){}});
function confetti(n){if(RM)return;for(let k=0;k<n;k++){const e=document.createElement('i');e.style.cssText=`left:${Math.random()*100}%;background:hsl(${Math.random()*360},90%,60%);animation-duration:${2+Math.random()*2}s;animation-delay:${Math.random()*.8}s`;FX.appendChild(e);setTimeout(()=>e.remove(),5000)}}
function banner(t){const e=document.createElement('div');e.className='ban';e.textContent=t;FX.appendChild(e);setTimeout(()=>e.remove(),2800)}
function winFx(n,fin){let w=-1;const tot=n.players.map((_,i)=>n.scores.reduce((a,r)=>a+r[i],0));
 if(fin)tot.forEach((x,i)=>{if(!V.players[i].out&&(w<0||x<tot[w]))w=i});else w=n.out;
 if(w<0)return;const me=w==V.me;sfx('win');
 banner(me?(fin?'🏆 ¡Ganaste la partida!':'🎉 ¡Ganaste la ronda!'):'🏆 '+n.players[w].name+(fin?' ganó la partida':' ganó la ronda'));confetti(me||fin?90:35)}
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
 if(n.phase=='end'&&(!o||o.phase!='end'||o.round!==n.round))winFx(n,0);
 if(n.phase=='final'&&(!o||o.phase!='final'))winFx(n,1)}
function bad(t){msg='✋ No puedes hacer eso. '+t;sfx('bad');render();document.querySelectorAll('.c.s').forEach(e=>e.classList.add('bad'));if(navigator.vibrate)navigator.vibrate(120)}
const BGS={green:'#1f8a5a',red:'#a4303a',blue:'#2a6db0',orange:'#c8731d'};
const BKS={red:'#8e1b1b',blue:'#1e4fa3',gold:'#c9a227',neon:'linear-gradient(45deg,#00e5ff,#a100ff)'},CARDS=['classic','black','retro','contrast'];
let sbg='green',scards='classic',sback='red',lastN=-1;
try{sbg=localStorage.getItem('cont_bg')||'green';scards=localStorage.getItem('cont_cards')||'classic';sback=localStorage.getItem('cont_back')||'red'}catch(e){}
if(!BGS[sbg])sbg='green';if(!CARDS.includes(scards))scards='classic';if(!BKS[sback])sback='red';
function applyStyle(){document.documentElement.dataset.bg=sbg;document.documentElement.dataset.cards=scards;document.documentElement.dataset.back=sback;try{localStorage.setItem('cont_bg',sbg);localStorage.setItem('cont_cards',scards);localStorage.setItem('cont_back',sback)}catch(e){}}
const setBg=x=>{sbg=x;applyStyle();render()},setCards=x=>{scards=x;applyStyle();render()},setBack=x=>{sback=x;applyStyle();render()};
applyStyle();
function styleUI(){return '<div class="box">Fondo: '+Object.keys(BGS).map(k=>`<button class="sw${sbg==k?' on':''}" style="background:${BGS[k]}" onclick="setBg('${k}')" aria-label="${k}"></button>`).join('')+`<br>Cartas: ${[['classic','Clásicas'],['black','Negras'],['retro','Retro'],['contrast','Contraste']].map(([k,n])=>`<button class="b g sm2${scards==k?' on':''}" onclick="setCards('${k}')">${n}</button>`).join('')}<br>Reverso: ${Object.keys(BKS).map(k=>`<button class="sw${sback==k?' on':''}" style="background:${BKS[k]}" onclick="setBack('${k}')" aria-label="${k}"></button>`).join('')}</div>`}
function nz(d,f,q,v,at){const n=AC.sampleRate*d|0,b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/n,2);const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=b;fl.type='bandpass';fl.frequency.value=f;fl.Q.value=q;g.gain.value=v;s.connect(fl);fl.connect(g);g.connect(AC.destination);s.start(AC.currentTime+(at||0))}
function cardSfx(k){if(k=='draw'){nz(.1,3200,1,.9);nz(.07,1800,1.2,.6,.05)}else if(k=='place'){nz(.05,900,.8,1.1);nz(.08,3800,1,.7,.01)}else if(k=='shuf'){for(let i=0;i<7;i++)nz(.05,2500+Math.random()*1500,1,.7,i*.07)}else return false;return true}
function fly(a,b,id){if(RM||!a||!b)return;const r=a.getBoundingClientRect(),q=b.getBoundingClientRect(),W=46,H=64;
 const e=document.createElement('div');e.className='c fly'+(id==null?' bk':'');
 if(id!=null){const c=C(id);e.innerHTML=c.j?'🃏':RN[c.r-1]+'<small>'+SU[c.s]+'</small>';if(!c.j&&(c.s==1||c.s==2))e.classList.add('r')}
 e.style.cssText=`left:${r.left+r.width/2-W/2}px;top:${r.top+r.height/2-H/2}px;width:${W}px;height:${H}px`;FX.appendChild(e);
 requestAnimationFrame(()=>requestAnimationFrame(()=>{e.style.transform=`translate(${q.left+q.width/2-r.left-r.width/2}px,${q.top+q.height/2-r.top-r.height/2}px)`}));
 setTimeout(()=>e.remove(),700)}
function flyEv(e){const $=s=>document.querySelector(s),seat=k=>$(`[data-seat="${k}"]`),t=e.t;
 if(t.startsWith('robó'))fly($('#deck'),seat(e.k),null);
 else if(t.startsWith('tomó'))fly($('#disc'),seat(e.k),e.c);
 else if(t.startsWith('compró')){fly($('#disc'),seat(e.k),e.c);fly($('#deck'),seat(e.k),null)}
 else if(t.startsWith('descartó'))fly(seat(e.k),$('#disc'),e.c);
 else if(t.startsWith('pegó')||t.startsWith('cambió'))fly(seat(e.k),$('#mesa'),e.c);
 else if(t.startsWith('se bajó'))fly(seat(e.k),$('#mesa'),null)}
function evs(n){const ln=n.ln||0;if(ln<lastN||lastN<0){lastN=ln;return}if(ln==lastN)return;
 const ev=(n.log||[]).filter(e=>e.n>lastN).slice(-3);lastN=ln;
 ev.forEach((e,i)=>setTimeout(()=>{sfx(/^(robó|tomó|compró)/.test(e.t)?'draw':e.t.startsWith('quiere')?'tick':'place');if(!(e.k===V.me&&/^(robó|tomó|compró)/.test(e.t)))flyEv(e)},60+i*320))}
function runOrd(cs){const L=cs.length;if(L<4)return null;const n=cs.filter(c=>!c.j);
 if(new Set(n.map(c=>c.s)).size>1||new Set(n.map(c=>c.r)).size<n.length||cs.some((c,i)=>c.j&&i&&cs[i-1].j))return null;
 for(const hi of [0,1]){let st=null,ok=true;cs.forEach((c,i)=>{if(c.j)return;const v=(c.r==1&&hi?14:c.r)-i;if(st===null)st=v;else if(st!==v)ok=false});
  if(ok&&st>=1&&st+L-1<=14)return cs}
 return null}
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
function store(){CH.style.display=S&&V?'block':'none';try{S?localStorage.setItem('cont_s',JSON.stringify(S)):localStorage.removeItem('cont_s');localStorage.setItem('cont_n',pname)}catch(e){}}
function enter(d){if(d.err){msg=d.err;return render()}S={c:d.c,t:d.t};V=null;v=0;msg='';store();loop();render()}
async function mk(mode){pname=pname.trim()||'Jugador';try{enter(await api('new',{name:pname,mode}))}catch(e){msg='No se pudo conectar con el servidor.';render()}}
async function joinR(){pname=pname.trim()||'Jugador';try{enter(await api('join',{c:code.trim(),name:pname}))}catch(e){msg='No se pudo conectar con el servidor.';render()}}
function leave(){S=null;V=null;store();render()}
async function loop(){const my=S;while(S===my){try{const d=await(await fetch(`poll?c=${S.c}&t=${S.t}&v=${v}`)).json();online=true;
  if(d.gone||d.kicked){msg=d.kicked?'Fuiste expulsado de la sala.':'La sala ya no existe.';S=null;V=null;store();render();return}
  if(!d.same){const o=V&&V.G;if(!o||!d.G||o.tc!==d.G.tc||o.phase!==d.G.phase||o.round!==d.G.round){sel=new Set();staged=[];armando=false}V=d;v=d.v;onNew(o,d.G);chatUp()}render()}
 catch(e){online=false;render();await sleep(1500)}}}
async function send(m){msg='';try{const d=await api('act',{c:S.c,t:S.t,m});if(d.err){bad(d.err);return false}sel=new Set();return true}catch(e){bad('Sin conexión.');return false}}
const kick=id=>{if(confirm('¿Expulsar a este jugador?'))send({t:'kick',id})};
const draw=src=>send({t:'draw',src}),comprar=()=>send({t:'buy'});
const hc=k=>{const h=V.G.hands[k];return Array.isArray(h)?h.length:h};
const nm=i=>esc(V.G.players[i].name);
function disp(){const ids=new Set(staged.flatMap(g=>g.ids));return V.G.hands[V.me].filter(id=>!ids.has(id)).map(C).sort(manual?(a,b)=>oi(a)-oi(b):sortS?(a,b)=>a.s-b.s||a.r-b.r:(a,b)=>a.r-b.r||a.s-b.s)}
const one=()=>disp().filter(c=>sel.has(c.id));
function tog(id){if(Date.now()-noClick<300)return;sel.has(id)?sel.delete(id):sel.add(id);render()}
const okSlot=g=>{const cs=g.ids.map(C);return g.type=='T'?trio(cs):!!runOrd(cs)};
function armar(){if(armando)return;armando=true;staged=CON[V.G.round].split('').map(type=>({type,ids:[]}));sel=new Set();msg='';render();setTimeout(()=>{const w=document.getElementById('armwrap');if(w)w.scrollIntoView({block:'center',behavior:RM?'auto':'smooth'})},60)}
function cancelArm(){armando=false;staged=[];render()}
function unslot(id){staged.forEach(g=>{g.ids=g.ids.filter(z=>z!=id)});render()}
function tapSlot(id){if(Date.now()-noClick<300)return;unslot(id)}
function dropSlot(id,k,x,y){staged.forEach(g=>{g.ids=g.ids.filter(z=>z!=id)});const g=staged[k];if(!g)return render();
 const els=[...document.querySelectorAll(`#mini .slot[data-k="${k}"] .c`)].filter(el=>+el.dataset.id!==id);let best=-1,bd=1e12;
 els.forEach((el,j)=>{const r=el.getBoundingClientRect(),dd=(x-(r.left+r.width/2))**2+(y-(r.top+r.height/2))**2;if(dd<bd){bd=dd;best=j}});
 const r=best>=0?els[best].getBoundingClientRect():null;g.ids.splice(best<0?0:best+(x>r.left+r.width/2?1:0),0,id);sfx('place');render()}
function autoOrd(k){const g=staged[k],a=g&&runArr(g.ids.map(C));if(!a)return bad('Esas cartas no forman una corrida.');g.ids=a.map(c=>c.id);render()}
function bajar(){if(!staged.length||!staged.every(okSlot))return bad('Completa y ordena todas las combinaciones.');send({t:'down',groups:staged.map(g=>({type:g.type,ids:g.ids}))})}
function miniV(){return `<div id="mini" class="box felt"><b class="top">Mesa de armado</b><div class="top">Arrastra tus cartas a cada casilla y ordénalas. Toca una carta para devolverla a tu mano.</div>`+staged.map((g,k)=>{const ok=okSlot(g),tot=staged.filter(x=>x.type==g.type).length,n=staged.slice(0,k+1).filter(x=>x.type==g.type).length;
 return `<div class="slot${ok?' ok':g.ids.length?' no':''}" data-k="${k}"><div class="sl"><b>${TN[g.type]}${tot>1?' '+n:''}${ok?' ✓':''}</b> <span>${g.type=='T'?'3 o más del mismo número (mínimo 3 normales); admite comodines':'4 o más seguidas del mismo palo'}</span>${g.type=='C'&&g.ids.length>3?` <button class="b g sm2" onclick="autoOrd(${k})">Ordenar</button>`:''}</div><div class="row">${g.ids.map(x=>card(C(x),{did:x,on:`tapSlot(${x})`})).join('')||'<span class="ph">Suelta aquí</span>'}</div></div>`}).join('')+`<button class="b" ${staged.every(okSlot)?'':'disabled'} onclick="bajar()">Bajarme</button><button class="b g" onclick="cancelArm()">Cancelar</button></div>`}
function pegar(k){const ch=one();if(ch.length!=1){return bad('Selecciona una sola carta para pegar.')}const j=ch[0].j&&V.G.melds[k].type=='C';send({t:'pegar',k,id:ch[0].id,end:j?(confirm('¿Poner el comodín al FINAL de la corrida?\nAceptar = al final · Cancelar = al inicio')?'end':'start'):undefined})}
function discard(){const ch=one();if(ch.length!=1){return bad('Selecciona una carta para descartar.')}send({t:'discard',id:ch[0].id})}
function table(){const G=V.G,tot=G.players.map((_,i)=>G.scores.reduce((a,r)=>a+r[i],0));
 return '<table><tr><th></th>'+G.players.map(p=>`<th>${esc(p.name)}</th>`).join('')+'</tr>'+G.scores.map((r,k)=>`<tr><td>R${k+1+(G.r0||0)}</td>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')+'<tr><th>Total</th>'+tot.map(x=>`<th>${x}</th>`).join('')+'</tr></table>'}
const COL=['#e53935','#1e88e5','#fdd835','#43a047','#8e24aa'];
const chip=k=>`<i class="chip" style="--c:${COL[k%5]}"></i>`;
function seats(){const G=V.G;return '<div class="seats">'+G.players.map((p,k)=>{const o=V.players[k],n=hc(k),on=G.phase=='play'&&G.turn==k,st=o.out?'expulsado':on?(G.step=='draw'?'robando…':'jugando…'):'';
 return `<div class="seat${on?' on':''}${o.out?' out':''}" data-seat="${k}" style="--c:${COL[k%5]}">${chip(k)}<b>${esc(p.name)}${k==V.me?' (tú)':''}</b><i class="dot${o.on?' on':''}"></i><div class="fan">${'<u></u>'.repeat(Math.min(n,9))}<em>${n}</em></div>${G.down[k]?'<span class="dn">✓ ya bajó</span>':''}<small>${st}</small></div>`}).join('')+'</div>'}
function logv(){const L=(V.G.log||[]).slice(-5).reverse();return L.length?'<div class="log">'+L.map(e=>`<div>${chip(e.k)}<b>${esc(V.G.players[e.k].name)}</b> ${esc(e.t)}</div>`).join('')+'</div>':''}
function plist(){return `<div class="box"><b>Jugadores</b> (${V.players.filter(p=>!p.out).length}/5)`+V.players.map((p,k)=>`<div><i class="dot${p.on?' on':''}"></i>${esc(p.name)}${k==V.me?' (tú)':''}${p.out?' · expulsado':''}${V.host&&k!=V.me&&!p.out?` <button class="b g sm2" onclick="kick('${p.id}')">Expulsar</button>`:''}</div>`).join('')+(V.host&&V.me<0?'<div class="top">Eres el host: administras, no juegas.</div>':'')+'</div>'}
function home(){return `<h1>🃏 Continental</h1><input placeholder="Tu nombre" maxlength="14" value="${esc(pname)}" oninput="pname=this.value">
 <div class="box"><b>Crear una sala</b><br><button class="b" onclick="mk('listo')">Listo</button><button class="b g" onclick="mk('host')">Host</button><br><span class="top"><b>Listo</b>: creas la sala y juegas. <b>Host</b>: solo administras, no juegas.</span></div>
 <div class="box"><b>Unirme a una sala</b><br><input placeholder="Código" maxlength="5" value="${esc(code)}" oninput="code=this.value.toUpperCase()" style="text-transform:uppercase;width:120px"><button class="b" onclick="joinR()">Unirme</button></div><div class="msg">${msg}</div>`+styleUI()+rules}
function render(){if(!S){A.innerHTML=home();return}
 if(!V){A.innerHTML=`<h1>🃏 Continental</h1><p>${online?'Entrando a la sala…':'Reconectando…'}</p>`;return}
 const cdn=Math.ceil((cdEnd-Date.now())/1000),cd=cdn>0&&Date.now()>=rlEnd?`<div class="cd">${cdn}</div>`:'';const G=V.G,off=online?'':'<div class="box msg">⚠ Reconectando con el servidor… tu lugar y tus cartas se conservan.</div>';let h='';
 if(!G)h=`<h1>🃏 Continental</h1><div class="box">Código: <b style="font-size:1.6em;letter-spacing:.15em;cursor:pointer" onclick="copyT('${esc(V.code)}')">${esc(V.code)}</b> <span class="top">(toca para copiar)</span><br><span class="top">Enlace: ${esc(location.origin+'/#'+V.code)}</span></div>${plist()}`+(V.host?`Empezar en la ronda: <select id="r0">${[1,2,3,4,5,6,7].map(n=>`<option>${n}</option>`).join('')}</select><br><button class="b" ${V.players.length<2?'disabled':''} onclick="send({t:'start',round:+document.getElementById('r0').value-1})">Empezar partida</button><button class="b g" onclick="if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}">Cerrar sala</button>`:'<p>Esperando a que el host empiece…</p><button class="b g" onclick="leave()">Salir</button>')+`<div class="msg">${msg}</div>`+rules;
 else if(G.phase=='end')h=`<h1>Fin de la ronda ${G.round+1}</h1><p><b>${nm(G.out)}</b> se quedó sin cartas.</p><div class="box">${table()}</div>${V.me>=0?(G.rd[V.me]?'<b>Esperando a los demás…</b>':`<button class="b" onclick="send({t:'ready'})">${G.round>=6?'Ver resultado final':'Listo ✔'}</button>`):''}<div class="top">${G.players.map((p,k)=>esc(p.name)+(G.rd[k]?' ✔':' …')).join(' · ')}</div>${V.host?`<button class="b g sm2" onclick="send({t:'next'})">Forzar siguiente ronda</button>`:''}${plist()}`;
 else if(G.phase=='final'){const t=G.players.map((p,i)=>[p.name,G.scores.reduce((a,r)=>a+r[i],0),V.players[i].out]).filter(x=>!x[2]).sort((a,b)=>a[1]-b[1]);
  h=`<h1>🏆 ${esc(t[0][0])} gana</h1><div class="box">${t.map((x,k)=>`<div style="font-size:1.3em">${['🥇','🥈','🥉','4º','5º'][k]} ${esc(x[0])} — ${x[1]}</div>`).join('')}</div><div class="box">${table()}</div><p>Gana quien tiene menos puntos.</p><button class="b" onclick="send({t:'reset'})">Nueva partida</button><button class="b g" onclick="leave()">Salir</button>`}
 else{const i=V.me,t=G.turn,mine=i==t,dn=i>=0&&G.down[i],pl=mine&&G.step=='play';
  h=`<div class="top${mine?' myturn':''}">Ronda ${G.round+1}/7 · <b>${conTxt(G.round)}</b> · Turno de <b>${nm(t)}</b>${mine?' (¡tú!)':''}${G.note?'<br><b>'+esc(G.note)+'</b>':''}</div>${seats()}
  <div class="box piles felt"><div>Mazo (${G.deck})<br>${mine&&G.step=='draw'?`<div class="c bk" id="deck" onclick="draw('deck')">🂠</div>`:'<div class="c sm bk" id="deck">🂠</div>'}</div><div>Descarte<br>${G.disc.length?card(C(G.disc[G.disc.length-1]),{id:'disc',nw:G.disc[G.disc.length-1]!==prevTop,on:mine&&G.step=='draw'?"draw('disc')":''}):'—'}</div><div class="top">${i<0?'Mirando como host.':mine?(G.step=='draw'?'Toma una carta del mazo o del descarte.':'Arma, pega o descarta.'):'Esperando a '+nm(t)+'…'}${i>=0&&!mine&&!G.tdc&&G.disc.length?(V.claim?'<br><b>Pediste comprar</b> (se resuelve cuando descarte quien tiene el turno)':'<br><button class="b" onclick="comprar()">Comprar (+1 de castigo)</button>'):''}</div></div>
  <div class="box felt" id="mesa"><b class="top">Mesa</b>${G.melds.length?G.melds.map((m,k)=>`<div class="meld${pl?' hit':''}" ${pl?`onclick="pegar(${k})"`:''}><b>${chip(m.owner)}${nm(m.owner)} · ${TN[m.type]}</b>${m.cards.map(x=>card(C(x),{sm:1})).join('')}</div>`).join(''):'<div class="top">Nadie se ha bajado.</div>'}
  </div>${logv()}<div class="msg">${msg}</div>`;
  if(i>=0)h+=`<div id="armwrap">${armando&&pl&&!dn?miniV():''}<div class="top">Tus cartas:</div><div id="hand">${disp().map(c=>card(c,{did:c.id,sel:sel.has(c.id),nw:prevHand.size&&!prevHand.has(c.id),on:pl?`tog(${c.id})`:''})).join('')}</div></div>
  <div>${pl?(dn?'':`${armando?'':'<button class="b" onclick="armar()">Armar</button>'}${V.pend?'<button class="b g" onclick="send({t:\'undoswap\'})">Deshacer cambio de comodín</button>':''}`)+'<button class="b" onclick="discard()">Descartar</button>':''}<button class="b g" onclick="cyc()">Ordenar: ${manual?'a mi orden':sortS?'por palo':'por número'}</button></div>${pl?'<div class="top">Para pegar o cambiar un comodín: selecciona una carta y toca una combinación de la mesa.</div>':''}`;
  h+=`<button class="b g sm2" onclick="mute=!mute;render()">${mute?'🔇 Sonido':'🔊 Sonido'}</button><details><summary>🎨 Estilo</summary>${styleUI()}</details><details><summary>Jugadores</summary>${plist()}</details>`+(V.host?`<button class="b g sm2" onclick="if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}">Cerrar sala</button>`:'')}
 A.innerHTML=cd+off+h;if(G&&G.phase=='play'){prevHand=new Set(Array.isArray(G.hands[V.me])?G.hands[V.me]:[]);prevTop=G.disc[G.disc.length-1]}}
if(location.hash.length>1)code=location.hash.slice(1).toUpperCase().slice(0,5);
if(S)loop();
render();
