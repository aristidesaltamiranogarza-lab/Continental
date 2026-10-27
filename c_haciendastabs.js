// Haciendas de Yucatán: pestañas de la interfaz (Jugadores, Mis cartas, Comercio, Historial). Las usa c_haciendasui.js como HZU.P.
// Comercio: banco y puertos con su tasa, ofertas con contadores +/- a todos o a un jugador, y la lista de ofertas abiertas. NO cambia reglas.
(function(){
if(!window.HZU){console.warn('Haciendas pestañas: falta c_haciendasui.js');return}
const U=HZU,D=U.D,{tok,rc,chips,nm}=U,R5=[0,1,2,3,4];
let bk={give:-1,get:-1};
const trd=()=>U.keep.trd||(U.keep.trd={give:[0,0,0,0,0],want:[0,0,0,0,0],to:-1,re:null});
function pJug(){const G=V.G;return G.players.map((p,k)=>{const t=k===G.turn&&G.phase=='play',lf=G.left[k];
 return `<div class="mu-prow${t?' on':''}${G.out[k]?' x':''}" style="--pc:${U.pc(k)}">${tok(k,'lg')}<div class="mu-f1"><b>${esc(p.name)}${k===U.me?' <em class="mu-tu">TÚ</em>':''}${G.auto&&G.auto[k]?' 🤖':''}</b>
  <div class="mu-s">🂠 ${G.nres[k]} cartas · 🃏 ${G.ndev[k]} de desarrollo · 🛡️ ${G.gu[k]} guardias · 🛤️ camino ${G.ll[k]}</div>
  <div class="mu-s">Le quedan ${lf.s} sacbés, ${lf.r} ranchos, ${lf.h} haciendas${G.lr===k?' · <b>Sacbé real</b>':''}${G.ga===k?' · <b>Guardia mayor</b>':''}</div></div><b class="mu-cash">★ ${G.vp[k]}</b></div>`}).join('')
 +`<div class="mu-s">Gana quien llegue a <b>${G.o.pts}</b> puntos en su turno. Los puntos ocultos no se ven hasta el final.</div>`
 +(typeof plist=='function'?`<details class="mu-det"><summary>Sala y espectadores</summary>${plist()}</details>`:'')}
function pCartas(){const G=V.G,m=U.me,r=U.mine();if(!r)return '';const pl=U.playable(),hand=G.dev[m]||[];
 const cost=[['s','🛤️ Sacbé'],['r','🏠 Rancho (1 punto)'],['h','🏛️ Hacienda (2 puntos, sobre un rancho)'],['c','🃏 Carta de desarrollo']].map(([w,n])=>`<div class="hz-cr"><span>${n}</span><span>${chips(D.COST[w])}</span></div>`).join('');
 const grp={};hand.forEach(c=>{const k=c.id[0]=='p'?c.id:c.id;(grp[k]=grp[k]||[]).push(c)});
 const cards=Object.keys(grp).map(id=>{const c=D.DEV[id[0]],L=grp[id],can=pl.some(x=>x.id===id),nw=L.every(x=>x.tc>=G.tc);
  return `<div class="hz-dc"><span class="hz-di">${c.ico}</span><div class="mu-f1"><b>${id[0]=='p'?D.PTS[+id[1]]+' (punto oculto)':c.nm}${L.length>1?' ×'+L.length:''}</b><div class="mu-s">${c.tx}</div>
   ${id[0]=='p'?'':nw?'<div class="mu-s">La compraste en este turno: se juega desde el siguiente.</div>':''}</div>${can?`<button class="mu-b ok" onclick="HZU.pick('${id}')">Jugar</button>`:''}</div>`}).join('');
 return `<div class="hz-mine big">${r.map((x,i)=>rc(i,x,x?'':'z')).join('')}</div>
  <h4 class="hz-h">Cartas de desarrollo ${G.played?'<span class="mu-s">(ya jugaste una este turno)</span>':''}</h4>${cards||'<div class="mu-s">Todavía no tienes. Cuestan maíz + miel + sal.</div>'}
  <h4 class="hz-h">Costos</h4>${cost}`}
// ---- comercio ----
function pCom(){const G=V.G,m=U.me,T=G.turn,r=U.mine();if(!r)return '';const mt=U.myTurn(),main=G.st=='main',t=trd(),sum=a=>a.reduce((x,y)=>x+y,0);
 let h='';
 if(mt&&main){const rt=G.rates||[4,4,4,4,4];
  h+=`<h4 class="hz-h">Banco y puertos</h4><div class="mu-s">Das varias de un recurso por 1 de otro. Tu tasa: ${R5.map(i=>rc(i)+' '+rt[i]+':1').join(' ')}</div>
   <div class="hz-row2"><span>Doy</span>${R5.map(i=>`<button class="mu-b${bk.give===i?' on':''}" onclick="HZU.bk('give',${i})"${r[i]>=rt[i]?'':' disabled'}>${rc(i)}×${rt[i]}</button>`).join('')}</div>
   <div class="hz-row2"><span>Recibo</span>${R5.map(i=>`<button class="mu-b${bk.get===i?' on':''}" onclick="HZU.bk('get',${i})"${i===bk.give?' disabled':''}>${rc(i)}</button>`).join('')}</div>
   <button class="mu-b pri" onclick="HZU.bank()"${bk.give>=0&&bk.get>=0&&bk.give!==bk.get&&r[bk.give]>=rt[bk.give]?'':' disabled'}>Cambiar</button>`}
 if(main&&(mt||G.players[T])){const others=G.players.map((_,k)=>k).filter(k=>k!==m&&!G.out[k]);
  const cnt=(side)=>`<div class="hz-cnt">${R5.map(i=>`<div>${rc(i,side=='give'?r[i]:null)}<button class="mu-b" onclick="HZU.trd('${side}',${i},-1)"${t[side][i]?'':' disabled'}>−</button><b>${t[side][i]}</b><button class="mu-b" onclick="HZU.trd('${side}',${i},1)"${side=='give'&&t.give[i]>=r[i]||t[side=='give'?'want':'give'][i]?' disabled':''}>+</button></div>`).join('')}</div>`;
  h+=`<h4 class="hz-h">${t.re?'Contraoferta':'Ofrecer un cambio'}</h4>${mt?'':`<div class="mu-s">Solo se comercia con quien tiene el turno: tu oferta va para ${nm(T)}.</div>`}
   <div class="mu-s">Doy</div>${cnt('give')}<div class="mu-s">Pido</div>${cnt('want')}
   ${mt?`<div class="hz-row2"><span>Para</span><button class="mu-b${t.to<0?' on':''}" onclick="HZU.trTo(-1)">Todos</button>${others.map(k=>`<button class="mu-b${t.to===k?' on':''}" onclick="HZU.trTo(${k})">${tok(k,'xs')} ${nm(k)}</button>`).join('')}</div>`:''}
   <button class="mu-b pri" onclick="HZU.offer()"${sum(t.give)&&sum(t.want)?'':' disabled'}>${t.re?'Mandar contraoferta':'Ofrecer'}</button>${t.re?` <button class="mu-lk" onclick="HZU.trClear()">Cancelar</button>`:''}`}
 else h+=`<div class="mu-empty"><span>🤝</span><b>${mt?'Primero tira los dados':'Ahora no se puede comerciar'}</b>Se comercia en el turno de cada quien, después de tirar.</div>`;
 const L=G.offers.filter(o=>o.from===m||o.to===m||o.to<0||m===T);
 if(L.length)h+=`<h4 class="hz-h">Ofertas abiertas</h4>`+L.map(o=>{const tk=U.offersToMe().includes(o);
  return `<div class="hz-of">${tok(o.from,'xs')}<div class="mu-f1"><b>${nm(o.from)}</b> → ${o.to<0?'todos':nm(o.to)}<div class="hz-tr">${chips(o.give)}<span>por</span>${chips(o.want)}</div>${o.no.length?`<div class="mu-s">No quisieron: ${o.no.map(nm).join(', ')}</div>`:''}</div>
   ${o.from===m?`<button class="mu-b" onclick="HZU.a({t:'reject',id:${o.id}})">Retirar</button>`:tk?`<button class="mu-b ok" onclick="HZU.a({t:'accept',id:${o.id}})"${U.has(o.want)?'':' disabled'}>Aceptar</button><button class="mu-b" onclick="HZU.a({t:'reject',id:${o.id}})">No</button><button class="mu-b" onclick="HZU.counter(${o.id})">Contra</button>`:''}</div>`}).join('');
 return h}
function pHist(){const G=V.G;
 return `<div class="mu-log">${(G.log||[]).slice().reverse().map(e=>`<div>${e.k>=0?tok(e.k,'xs'):'<span class="mu-tok xs bank">🌀</span>'}<span>${e.k>=0?`<b>${nm(e.k)}</b> `:''}${esc(e.t)}</span></div>`).join('')}</div>
  <details class="mu-det"><summary>Reglas</summary>${String(GM.haciendas.rules||'').replace(/<\/?details>|<summary>[^<]*<\/summary>/g,'')}</details>`}
U.P={jug:pJug,cartas:pCartas,com:pCom,hist:pHist};
Object.assign(U,{
 bk:(s,i)=>{bk[s]=bk[s]===i?-1:i;if(bk.give===bk.get)bk.get=-1;sfx('tick');render()},
 bank:async()=>{if(await U.a({t:'bank',give:bk.give,get:bk.get}))bk={give:-1,get:-1}},
 trd:(s,i,d)=>{const t=trd();t[s][i]=Math.max(0,t[s][i]+d);render()},trTo:k=>{trd().to=k;render()},trClear:()=>{U.keep.trd=null;render()},
 offer:()=>{const t=trd(),m={t:'offer',give:t.give,want:t.want};if(t.re!=null)m.re=t.re;else if(t.to>=0)m.to=t.to;U.a(m)}});
const css=document.createElement('style');css.textContent=`
.hz-h{margin:10px 0 4px;font-size:14px}.hz-mine.big .hz-rc{font-size:20px;padding:3px 10px}.hz-mine.big .hz-rc b{font-size:16px}
.hz-cr{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid var(--mu-line);font-size:13px}
.hz-dc,.hz-of{display:flex;align-items:center;gap:8px;padding:7px;margin:5px 0;border-radius:12px;background:var(--mu-card2);border:1px solid var(--mu-line)}.hz-di{font-size:26px}
.hz-row2{display:flex;flex-wrap:wrap;align-items:center;gap:3px;margin:4px 0}.hz-row2>span{font-size:12px;font-weight:700;min-width:48px}.hz-row2 .mu-b{margin:0;min-height:32px;padding:0 8px}`;
document.head.appendChild(css);
})();
