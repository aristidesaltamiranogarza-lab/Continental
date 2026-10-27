// Haciendas de Yucatán: pulido de la interfaz. Sonidos hechos con código, cartas que se voltean (al comprar solo tú; al jugar, todos),
// resumen final con puntos y estadísticas, guía de reglas con dibujos y consejos la primera vez que te toca cada cosa.
// Lo llama c_haciendasui.js (HZX.after cada vez que se dibuja, HZX.hud para sus ventanas). NO cambia reglas ni servidor.
(function(){
if(!window.HZU){console.warn('Haciendas pulido: falta c_haciendasui.js');return}
const U=HZU,D=U.D,{tok,rc,chips,nm}=U,sum=a=>a.reduce((x,y)=>x+y,0);
const lsg=(k,d)=>{try{const x=localStorage.getItem(k);return x==null?d:x}catch(e){return d}},lss=(k,x)=>{try{localStorage.setItem(k,x)}catch(e){}};
let prev=null,guide=false,showSum=false,sumFor=null,tipsSeen=new Set(JSON.parse(lsg('hz_tips','[]')||'[]'));
// ---- sonidos (Web Audio, sin archivos) ----
let NZ=null;
function snd(k){if(typeof mute!='undefined'&&mute)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume();const A=AC,t0=A.currentTime;
 const tone=(t,f0,f1,d,v,ty)=>{const o=A.createOscillator(),g=A.createGain();o.type=ty||'sine';o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d*.8);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(A.destination);o.start(t);o.stop(t+d+.02)};
 const noise=(t,d,v,f0,f1,q)=>{if(!NZ){NZ=A.createBuffer(1,A.sampleRate,A.sampleRate);const a=NZ.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1}
  const s=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain();s.buffer=NZ;f.type='bandpass';f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+d*.7);
  g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(v,t+d*.15);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f);f.connect(g);g.connect(A.destination);s.start(t,Math.random()*.5);s.stop(t+d+.02)};
 ({dados:()=>{for(let i=0;i<7;i++)noise(t0+i*.055+Math.random()*.02,.05,.25,2600+Math.random()*1500,0,3);tone(t0+.42,300,180,.07,.12,'triangle');tone(t0+.5,260,170,.06,.1,'triangle')},
  construir:()=>{tone(t0,320,170,.08,.18,'triangle');tone(t0+.09,240,150,.07,.14,'triangle')},
  huracan:()=>noise(t0,1.3,.22,350,1700,.8),
  trato:()=>{tone(t0,880,0,.3,.09);tone(t0+.11,1320,0,.4,.08)},
  robo:()=>tone(t0,520,240,.25,.1,'square'),
  cosecha:()=>{tone(t0,660,0,.12,.07);tone(t0+.06,990,0,.14,.05)},
  carta:()=>{noise(t0,.18,.12,1200,3800,.7);tone(t0+.12,700,0,.12,.06,'triangle')}})[k]()}catch(e){}}
// ---- cartas que se voltean ----
function flip(id,who){const c=D.DEV[id[0]],e=document.createElement('div');e.className='hz-flip';
 e.innerHTML=`<div class="hz-fc"><div class="hz-fb">🌿<b>Haciendas</b></div><div class="hz-ff"><span>${c.ico}</span><b>${id[0]=='p'?D.PTS[+id[1]]:c.nm}</b><small>${id[0]=='p'?'Punto oculto':c.tx}</small><em>${who}</em></div></div>`;
 document.body.appendChild(e);snd('carta');setTimeout(()=>e.classList.add('out'),2300);setTimeout(()=>e.remove(),2700)}
const DEVBYNAME=Object.keys(D.DEV).reduce((o,k)=>(o[D.DEV[k].nm]=k,o),{});
// ---- cada vez que se dibuja: comparar con lo anterior y sonar / voltear / abrir el resumen ----
function after(G,m){const c={rn:G.rn,pz:G.vo.filter(x=>x>=0).length+G.vl.reduce((a,b)=>a+b,0)+G.eo.filter(x=>x>=0).length,trn:G.trn||0,sln:G.sl?G.sl.n:0,pl:sum(G.pl),
  nd:m>=0&&G.dev[m]?G.dev[m].length:0,ph:G.phase,prn:G.prod?G.prod.rn:-1,ln:G.ln||0},p=prev;prev=c;if(!p)return;
 if(c.rn!==p.rn){snd('dados');if(G.dice[0]+G.dice[1]==7)setTimeout(()=>snd('huracan'),450)}
 if(c.pz>p.pz)setTimeout(()=>snd('construir'),c.rn!==p.rn?600:0);
 if(c.trn!==p.trn)snd('trato');if(c.sln!==p.sln)setTimeout(()=>snd('robo'),300);
 if(c.prn!==p.prn&&m>=0&&G.prod.got[m]&&sum(G.prod.got[m]))setTimeout(()=>snd('cosecha'),700);
 if(c.nd>p.nd&&c.pl===p.pl&&G.dev[m]){const id=G.dev[m][G.dev[m].length-1].id;setTimeout(()=>flip(id,'Te salió esta carta'),200)}
 if(c.pl>p.pl){const L=(G.log||[]).filter(e=>e.n>p.ln&&/^juega /.test(e.t));L.forEach((e,i)=>{const n=e.t.slice(6).split(':')[0],id=DEVBYNAME[n];if(id)setTimeout(()=>flip(id,U.nm(e.k)+' la juega'),200+i*900)})}
 if(c.ph=='final'&&p.ph=='play'){sumFor=G.ln;setTimeout(()=>{showSum=true;render()},2600)}}
// ---- resumen final ----
function sumBox(){const G=V.G,P=G.players.map((_,k)=>k),st=G.stats||{prod:[],tr:[],bk:[],rob:[],lost:[],dice:[],h:0};
 const cnt=(k,l)=>G.vo.filter((o,v)=>o===k&&G.vl[v]==l).length,hid=k=>(G.dev[k]||[]).filter(c=>c.id[0]=='p').map(c=>D.PTS[+c.id[1]]);
 const order=P.slice().sort((a,b)=>G.vp[b]-G.vp[a]||(a===G.win?-1:b===G.win?1:0));
 const rows=order.map(k=>{const h=hid(k);return `<tr${k===G.win?' class="w"':''}><td>${tok(k,'xs')} ${nm(k)}</td><td>${cnt(k,1)}</td><td>${cnt(k,2)*2}</td><td>${G.lr===k?2:''}</td><td>${G.ga===k?2:''}</td><td title="${h.join(', ')}">${h.length||''}</td><td><b>${G.vp[k]}</b></td></tr>`}).join('');
 const stat=order.map(k=>`<tr><td>${tok(k,'xs')} ${nm(k)}</td><td>${st.prod[k]||0}</td><td>${st.tr[k]||0}</td><td>${st.bk[k]||0}</td><td>${st.rob[k]||0}/${st.lost[k]||0}</td><td>${G.gu[k]}</td><td>${G.ll[k]}</td></tr>`).join('');
 const dmax=Math.max(1,...(st.dice||[]).slice(2));
 const bars=[2,3,4,5,6,7,8,9,10,11,12].map(n=>{const v=(st.dice||[])[n]||0;return `<div><i style="height:${Math.round(v/dmax*56)}px"${n==7?' class="h"':n==6||n==8?' class="r"':''}></i><span>${v}</span><b>${n}</b></div>`}).join('');
 const ocultos=P.filter(k=>hid(k).length).map(k=>`${tok(k,'xs')} ${nm(k)}: ${hid(k).join(', ')}`).join(' · ');
 return `<div class="mu-card hz-sum"><header><b class="mu-h">🏆 ${nm(G.win)} gana</b><button class="mu-x" onclick="HZX.sum(0)" aria-label="Cerrar">✕</button></header>
  <div class="mu-s">${G.stall?'Nadie sumó puntos en 10 rondas: ganó quien tenía más.':'Llegó a '+G.vp[G.win]+' puntos en su turno, en la ronda '+G.round+'.'}</div>
  <table class="hz-tb"><tr><th></th><th title="Ranchos">🏠</th><th title="Haciendas">🏛️</th><th title="Sacbé real">🛤️</th><th title="Guardia mayor">🛡️</th><th title="Puntos ocultos">⛪</th><th>★</th></tr>${rows}</table>
  ${ocultos?`<div class="mu-s">Puntos ocultos: ${ocultos}</div>`:''}
  <h4 class="hz-h">Cómo jugó cada quien</h4><table class="hz-tb"><tr><th></th><th title="Recursos producidos">🌾</th><th title="Tratos con jugadores">🤝</th><th title="Cambios con banco o puerto">🏦</th><th title="Robó / le robaron">🌀</th><th title="Guardias jugadas">🛡️</th><th title="Camino más largo">🛤️</th></tr>${stat}</table>
  <div class="mu-s">🌾 producidos · 🤝 tratos · 🏦 banco/puerto · 🌀 robó/le robaron · 🛡️ guardias · 🛤️ camino</div>
  <h4 class="hz-h">Dados (${st.h||0} huracanes)</h4><div class="hz-dh">${bars}</div>
  <div class="mu-acts">${V.host?`<button class="mu-b pri big" onclick="send({t:'reset'})">Otra partida</button>`:''}<button class="mu-b" onclick="HZX.sum(0)">Cerrar</button></div></div>`}
// ---- guía con dibujos ----
const HEX=(cx,cy,r)=>[0,1,2,3,4,5].map(c=>{const a=(60*c-30)*Math.PI/180;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r]});
function drawing(){const A=HEX(70,60,42),B=HEX(70+42*Math.sqrt(3),60,42),pt=p=>p.map(x=>x.toFixed(1)).join(','),pg=(L,f)=>`<polygon points="${L.map(pt).join(' ')}" fill="${f}" stroke="#5a4a2a" stroke-width="2"/>`;
 const house=(x,y,c)=>`<path d="M${x-9},${y+7} L${x-9},${y-2} L${x},${y-11} L${x+9},${y-2} L${x+9},${y+7} Z" fill="${c}" stroke="#1b1b1b" stroke-width="2"/>`;
 return `<svg viewBox="0 0 240 125" width="240" height="125" class="hz-draw"><g>${pg(A,'#e8c24a')}${pg(B,'#79a96a')}</g>
  <text x="70" y="66" text-anchor="middle" font-size="16" font-weight="800">8</text><text x="143" y="66" text-anchor="middle" font-size="16" font-weight="800">5</text>
  <line x1="${A[0][0]}" y1="${A[0][1]}" x2="${A[1][0]}" y2="${A[1][1]}" stroke="#1b1b1b" stroke-width="9" stroke-linecap="round"/><line x1="${A[0][0]}" y1="${A[0][1]}" x2="${A[1][0]}" y2="${A[1][1]}" stroke="#d63a3a" stroke-width="5" stroke-linecap="round"/>
  ${house(A[0][0],A[0][1],'#d63a3a')}<text x="${A[5][0]}" y="${A[5][1]+6}" text-anchor="middle" font-size="18" fill="#c62828" font-weight="900">✕</text>
  <text x="${A[2][0]}" y="${A[2][1]+20}" text-anchor="middle" font-size="11">rancho en una esquina</text></svg>
  <div class="mu-s">El rancho va en una <b>esquina</b> y cobra de los terrenos que toca. El sacbé va en una <b>orilla</b>. Junto a un rancho (✕) no cabe otro: debe haber al menos una orilla entre ranchos.</div>`}
function guideBox(){const cost=(w,n)=>`<div class="hz-cr"><span>${n}</span><span>${chips(D.COST[w])}</span></div>`,dv=Object.keys(D.DEV).map(k=>`<div class="hz-gd"><span>${D.DEV[k].ico}</span><div><b>${D.DEV[k].nm}</b> (${D.DEV[k].n})<div class="mu-s">${D.DEV[k].tx}</div></div></div>`).join('');
 return `<div class="mu-card hz-guide"><header><b class="mu-h">📖 Reglas</b><button class="mu-x" onclick="HZX.guide(0)" aria-label="Cerrar">✕</button></header>
  <div class="mu-s">Coloniza Yucatán: gana quien llegue primero a <b>${V.G.o.pts} puntos</b> en su turno.</div>
  <h4 class="hz-h">1. Al empezar</h4><div class="mu-s">Cada quien pone un rancho y un sacbé, de ida y de vuelta. El segundo rancho te da un recurso de cada terreno que toca.</div>${drawing()}
  <h4 class="hz-h">2. Tu turno</h4><div class="hz-steps"><div>🃏<span>Si quieres, juega una carta</span></div><div>🎲<span>Tira: los terrenos con ese número producen</span></div><div>🤝<span>Comercia y construye</span></div><div>➜<span>Termina</span></div></div>
  <div class="mu-s">Cada rancho que toca el terreno recibe 1 recurso; una hacienda recibe 2. ${D.ICO.slice(0,5).map((x,i)=>x+' '+D.RES[i]).join(' · ')}. El 💧 cenote no produce.</div>
  <h4 class="hz-h">3. Construir</h4>${cost('s','🛤️ Sacbé')}${cost('r','🏠 Rancho: 1 punto')}${cost('h','🏛️ Hacienda: 2 puntos (sobre tu rancho)')}${cost('c','🃏 Carta de desarrollo')}
  <h4 class="hz-h">4. Comercio</h4><div class="mu-s">En tu turno ofreces cambios a todos o a uno; ellos aceptan, rechazan o contraofertan. Con el banco cambias 4 por 1; en un puerto 3:1 cambias 3 por 1 y en uno 2:1 cambias 2 del recurso que indica. Los puertos se usan con un rancho o hacienda en su muelle.</div>
  <h4 class="hz-h">5. 🌀 Huracán (sale el 7)</h4><div class="mu-s">Quien tenga más de ${V.G.o.hl} cartas descarta la mitad. Quien tiró manda el huracán a otro terreno (ahí no se produce) y le roba una carta a alguien que construyó ahí.</div>
  <h4 class="hz-h">6. Cartas de desarrollo</h4>${dv}<div class="mu-s">Una por turno, y nunca la que compraste en ese turno.</div>
  <h4 class="hz-h">7. Bonos</h4><div class="mu-s">🛤️ <b>Sacbé real</b>: camino continuo más largo, de 5 tramos o más (2 puntos). 🛡️ <b>Guardia mayor</b>: 3 guardias jugadas o más (2 puntos). Si te igualan, lo conservas. Un rancho rival corta tu camino.</div>
  <div class="mu-s">Si pasan 10 rondas sin que cambien los puntos de nadie, gana quien tenga más. Si alguien no juega en 60 s, un bot juega por él.</div>
  <div class="mu-acts"><button class="mu-b" onclick="HZX.tips(1)">Volver a ver los consejos</button><button class="mu-b pri" onclick="HZX.guide(0)">Entendido</button></div></div>`}
// ---- consejos: la primera vez que te toca cada cosa ----
const TIPS={setup:'Pon tu rancho en una esquina que toque números con muchos puntitos: el 6 y el 8 son los que más salen.',
 roll:'Tira los dados: cada terreno con ese número da recursos a los ranchos que lo tocan (las haciendas, doble).',
 main:'Elige qué construir y toca un lugar iluminado. Si te falta algo, comercia con el banco, tus puertos o los demás.',
 discard:'¡Huracán! Tienes muchas cartas: suelta la mitad y quédate con lo que necesitas para construir.',
 move:'Manda el huracán a un terreno de un rival: no producirá y le robas una carta.',
 offer:'Te ofrecen un cambio: acéptalo, recházalo o haz una contraoferta.',
 card:'Tus cartas de desarrollo se juegan desde el turno siguiente, una por turno. Están en «Mis cartas».'};
function tipKey(){const G=V.G,m=U.me;if(m<0||G.phase!='play')return null;const L=[];
 if(G.st=='discard'&&G.dis&&G.dis[m]!=null)L.push('discard');if(U.offersToMe().length)L.push('offer');
 if(G.turn===m){if(G.st=='setup')L.push('setup');if(G.st=='roll')L.push('roll');if(G.st=='main')L.push('main');if(G.st=='move')L.push('move')}
 if((G.dev[m]||[]).some(c=>c.id[0]!='p'))L.push('card');return L.find(k=>!tipsSeen.has(k))||null}
function hud(){const k=tipKey(),tip=k&&!guide&&!showSum?`<div class="hz-tip"><span>💡</span><div>${TIPS[k]}</div><button class="mu-lk" onclick="HZX.seen('${k}')">Entendido</button></div>`:'';
 return tip+(showSum&&V.G.phase=='final'?`<div class="mu-modal" onclick="if(event.target===this)HZX.sum(0)"><div class="mu-mw">${sumBox()}</div></div>`:'')
  +(guide?`<div class="mu-modal" onclick="if(event.target===this)HZX.guide(0)"><div class="mu-mw">${guideBox()}</div></div>`:'')}
window.HZX={after,hud,snd,flip,open:()=>guide||showSum&&V.G.phase=='final',
 guide:o=>{guide=!!o;sfx('tick');render()},sum:o=>{showSum=!!o;sfx('tick');render()},
 seen:k=>{tipsSeen.add(k);lss('hz_tips',JSON.stringify([...tipsSeen]));render()},tips:()=>{tipsSeen.clear();lss('hz_tips','[]');guide=false;render()},
 reset:()=>{prev=null;showSum=false}};
const css=document.createElement('style');css.textContent=`
.hz-flip{position:fixed;inset:0;z-index:60;font-family:"Archivo",system-ui,"Segoe UI",sans-serif;display:flex;align-items:center;justify-content:center;pointer-events:none;perspective:900px;transition:opacity .35s}.hz-flip.out{opacity:0}
.hz-fc{width:170px;height:240px;position:relative;transform-style:preserve-3d;animation:hzfl 1s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes hzfl{0%{transform:scale(.4) rotateY(0) translateY(60px)}45%{transform:scale(1.05) rotateY(0)}100%{transform:scale(1) rotateY(180deg)}}
.hz-fb,.hz-ff{position:absolute;inset:0;border-radius:16px;backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:14px;text-align:center;box-shadow:0 12px 30px rgba(0,0,0,.45)}
.hz-fb{background:repeating-linear-gradient(45deg,#2f5a2a 0 10px,#3d6f36 10px 20px);color:#fff;font-size:44px;border:4px solid #e8c24a}.hz-fb b{font-size:16px}
.hz-ff{background:#fbf3df;color:#2a2a2a;border:4px solid #c8a24a;transform:rotateY(180deg)}.hz-ff span{font-size:52px}.hz-ff b{font-size:17px}.hz-ff small{font-size:12.5px;line-height:1.3}.hz-ff em{font-size:12px;font-style:normal;font-weight:700;color:#7a5230}
.hz-tip{position:fixed;left:50%;transform:translateX(-50%);top:calc(var(--hz-tt,64px) + 4px);z-index:40;display:flex;align-items:center;gap:8px;width:min(520px,92vw);box-sizing:border-box;font-family:"Archivo",system-ui,sans-serif;padding:8px 10px;border-radius:14px;
 background:var(--mu-card,#fff);color:var(--mu-ink,#222);border:2px solid #ffb300;box-shadow:0 6px 18px rgba(0,0,0,.25);font-size:13.5px;pointer-events:auto}.hz-tip>span{font-size:22px}.hz-tip>div{flex:1;min-width:0;line-height:1.3}.hz-tip .mu-lk{white-space:nowrap;font-weight:800}
.hz-tb{width:100%;border-collapse:collapse;font-size:13px;margin:4px 0}.hz-tb th,.hz-tb td{padding:3px 4px;text-align:center;border-bottom:1px solid var(--mu-line)}.hz-tb td:first-child{text-align:left;white-space:nowrap}.hz-tb tr.w td{background:rgba(255,193,7,.18)}
.hz-dh{display:flex;align-items:flex-end;gap:3px;height:96px;padding-top:4px}.hz-dh>div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;font-size:11px}
.hz-dh i{width:100%;max-width:22px;background:#79a96a;border-radius:4px 4px 0 0}.hz-dh i.r{background:#c62828}.hz-dh i.h{background:#5aaec6}.hz-dh b{font-size:12px}
.hz-sum,.hz-guide{max-height:84vh;overflow:auto}.hz-sum>header,.hz-guide>header{display:flex;align-items:center;gap:8px}.hz-sum>header .mu-h,.hz-guide>header .mu-h{flex:1;min-width:0;overflow-wrap:anywhere}.hz-draw{width:100%;height:auto;max-width:320px;aspect-ratio:240/125;display:block;margin:6px auto;flex:none}
.hz-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0}.hz-steps>div{display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center;font-size:12px;padding:6px;border-radius:10px;background:var(--mu-soft)}.hz-steps>div{font-size:22px}.hz-steps span{font-size:11.5px}
.hz-gd{display:flex;gap:8px;align-items:flex-start;margin:4px 0}.hz-gd>span{font-size:24px}`;
document.head.appendChild(css);
})();
