// Continental: interfaz del cliente (mesa de armado, ruleta, comprar, etc.). Se registra en GM.continental
const CON=['TT','TC','CC','TTT','TTC','CCT','CCC'],TN={T:'Trío',C:'Corrida'};
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
const rules=`<details><summary>Reglas</summary>Rondas 1 a 7 con 7 a 13 cartas. Contratos: ${CON.map((_,i)=>(i+1)+'. '+conTxt(i)).join('; ')}.<br>Trío: 3 o más cartas normales del mismo número; puedes agregarle comodines. Corrida: 4 o más cartas seguidas del mismo palo (el As va al inicio o al final). En las corridas los comodines nunca van dos seguidos. Un comodín jamás se descarta ni aparece en el descarte. Al empezar cada ronda gira la ruleta: con 1 posibilidad entre 52, quien tiene el primer turno se queda un comodín como una de sus cartas iniciales. Barajas: jugadores ÷ 2 + 1 (hacia abajo), cada una con 1 comodín.<br>Turno: robas (mazo o descarte), armas, pegas y descartas. No puedes descartar una carta que cabe en una combinación de la mesa (salvo que todas las tuyas quepan). Para bajarte armas todo el contrato de una vez; solo después puedes pegar cartas. Puedes cambiar un comodín de una corrida por la carta natural que representa; si no te has bajado, solo si usarás ese comodín para bajarte en el mismo turno.<br>Comprar: fuera de tu turno, mientras quien lo tiene no haya descartado, puedes pedir la carta de arriba del descarte (+1 carta de castigo). Si quien tiene el turno la toma, él tiene prioridad. Si no, al descartar se la lleva el más cercano a jugar. Puedes cancelar tu compra mientras no se haya resuelto.<br>Puntos: 2 a 10 = su valor, J, Q y K = 15, As = 20, comodín = 50. Gana quien tenga menos puntos.</details>`;
function winFx(n,fin){let w=-1;const tot=n.players.map((_,i)=>n.scores.reduce((a,r)=>a+r[i],0));
 if(fin)tot.forEach((x,i)=>{if(!V.players[i].out&&(w<0||x<tot[w]))w=i});else w=n.out;
 if(w<0)return;const me=w==V.me;sfx('win');
 banner(me?(fin?'🏆 ¡Ganaste la partida!':'🎉 ¡Ganaste la ronda!'):'🏆 '+n.players[w].name+(fin?' ganó la partida':' ganó la ronda'));confetti(me||fin?90:35)}
function runOrd(cs){const L=cs.length;if(L<4)return null;const n=cs.filter(c=>!c.j);
 if(new Set(n.map(c=>c.s)).size>1||new Set(n.map(c=>c.r)).size<n.length||cs.some((c,i)=>c.j&&i&&cs[i-1].j))return null;
 for(const hi of [0,1]){let st=null,ok=true;cs.forEach((c,i)=>{if(c.j)return;const v=(c.r==1&&hi?14:c.r)-i;if(st===null)st=v;else if(st!==v)ok=false});
  if(ok&&st>=1&&st+L-1<=14)return cs}
 return null}
const draw=src=>send({t:'draw',src}),comprar=()=>send({t:'buy'});
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
function contBody(){const G=V.G;let h='';
if(G.phase=='end')h=`<h1>Fin de la ronda ${G.round+1}</h1><p><b>${nm(G.out)}</b> se quedó sin cartas.</p><div class="box">${table()}</div>${V.me>=0?(G.rd[V.me]?'<b>Esperando a los demás…</b>':`<button class="b" onclick="send({t:'ready'})">${G.round>=6?'Ver resultado final':'Listo ✔'}</button>`):''}<div class="top">${G.players.map((p,k)=>esc(p.name)+(G.rd[k]?' ✔':' …')).join(' · ')}</div>${V.host?`<button class="b g sm2" onclick="send({t:'next'})">Forzar siguiente ronda</button>`:''}${plist()}`;
 else if(G.phase=='final'){const t=G.players.map((p,i)=>[p.name,G.scores.reduce((a,r)=>a+r[i],0),V.players[i].out]).filter(x=>!x[2]).sort((a,b)=>a[1]-b[1]);
  h=`<h1>🏆 ${esc(t[0][0])} gana</h1><div class="box">${t.map((x,k)=>`<div style="font-size:1.3em">${['🥇','🥈','🥉','4º','5º'][k]} ${esc(x[0])} — ${x[1]}</div>`).join('')}</div><div class="box">${table()}</div><p>Gana quien tiene menos puntos.</p><button class="b" onclick="send({t:'reset'})">Nueva partida</button><button class="b g" onclick="leave()">Salir</button>`}
 else{const i=V.me,t=G.turn,mine=i==t,dn=i>=0&&G.down[i],pl=mine&&G.step=='play';
  h=`<div class="top${mine?' myturn':''}">Ronda ${G.round+1}/7 · <b>${conTxt(G.round)}</b> · Turno de <b>${nm(t)}</b>${mine?' (¡tú!)':''}${G.note?'<br><b>'+esc(G.note)+'</b>':''}</div>${seats(k=>G.down[k]?'<span class="dn">✓ ya bajó</span>':'')}
  <div class="box piles felt"><div>Mazo (${G.deck})<br>${mine&&G.step=='draw'?`<div class="c bk" id="deck" onclick="draw('deck')">🂠</div>`:'<div class="c sm bk" id="deck">🂠</div>'}</div><div>Descarte<br>${G.disc.length?card(C(G.disc[G.disc.length-1]),{id:'disc',nw:G.disc[G.disc.length-1]!==prevTop,on:mine&&G.step=='draw'?"draw('disc')":''}):'—'}</div><div class="top">${i<0?mirTxt():mine?(G.step=='draw'?'Toma una carta del mazo o del descarte.':'Arma, pega o descarta.'):'Esperando a '+nm(t)+'…'}${i>=0&&!mine&&!G.tdc&&G.disc.length?(V.claim?'<br><b>Pediste comprar</b> (se resuelve cuando descarte quien tiene el turno) <button class="b g sm2" onclick="send({t:\'unbuy\'})">Cancelar compra</button>':'<br><button class="b" onclick="comprar()">Comprar (+1 de castigo)</button>'):''}</div></div>
  <div class="box felt" id="mesa"><b class="top">Mesa</b>${G.melds.length?G.melds.map((m,k)=>`<div class="meld${pl?' hit':''}" ${pl?`onclick="pegar(${k})"`:''}><b>${chip(m.owner)}${nm(m.owner)} · ${TN[m.type]}</b>${m.cards.map(x=>card(C(x),{sm:1})).join('')}</div>`).join(''):'<div class="top">Nadie se ha bajado.</div>'}
  </div>${logv()}<div class="msg">${msg}</div>`;
  if(i>=0)h+=`<div id="armwrap">${armando&&pl&&!dn?miniV():''}<div class="top">Tus cartas:</div><div id="hand">${disp().map(c=>card(c,{did:c.id,sel:sel.has(c.id),nw:prevHand.size&&!prevHand.has(c.id),on:pl?`tog(${c.id})`:''})).join('')}</div></div>
  <div>${pl?(dn?'':`${armando?'':'<button class="b" onclick="armar()">Armar</button>'}${V.pend?'<button class="b g" onclick="send({t:\'undoswap\'})">Deshacer cambio de comodín</button>':''}`)+'<button class="b" onclick="discard()">Descartar</button>':''}<button class="b g" onclick="cyc()">Ordenar: ${manual?'a mi orden':sortS?'por palo':'por número'}</button></div>${pl?'<div class="top">Para pegar o cambiar un comodín: selecciona una carta y toca una combinación de la mesa.</div>':''}`;
  h+=`<button class="b g sm2" onclick="mute=!mute;render()">${mute?'🔇 Sonido':'🔊 Sonido'}</button>${typeof musUI=='function'?musUI():''}<details><summary>🎨 Estilo</summary>${styleUI()}</details><details><summary>Jugadores</summary>${plist()}</details>`+(V.host?`<button class="b g sm2" onclick="if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}">Cerrar sala</button>`:'')}
return h}
function contLobby(host){return host?`Empezar en la ronda: <select id="r0">${[1,2,3,4,5,6,7].map(n=>`<option>${n}</option>`).join('')}</select><br><button class="b" ${V.players.length<2?'disabled':''} onclick="send({t:'start',round:+document.getElementById('r0').value-1})">Empezar partida</button>`:''}
GM.continental={name:'Continental',emoji:'🃏',max:5,rules,lobby:contLobby,body:contBody,win:winFx,
 face:id=>{const c=C(id);return {h:c.j?'🃏':RN[c.r-1]+'<small>'+SU[c.s]+'</small>',cls:!c.j&&(c.s==1||c.s==2)?'r':''}},
 after:()=>{const G=V.G;if(G&&G.phase=='play'){prevHand=new Set(Array.isArray(G.hands[V.me])?G.hands[V.me]:[]);prevTop=G.disc[G.disc.length-1]}}};
