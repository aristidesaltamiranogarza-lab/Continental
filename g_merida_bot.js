// Bot de Mérida en Venta (servidor). g_merida.js le pasa sus ayudas: require('./g_merida_bot.js')(H) → bot(R,k) → {ms, m} o null.
// Juega por act() como una persona: tira, compra si le queda colchón, puja en subastas según lo que le sirve la casilla,
// construye parejo en sus grupos completos, paga deudas vendiendo casas o hipotecando, acepta o rechaza tratos y, al final de su turno, propone tratos para completar sus grupos.
module.exports=function(H){
const {B,GR,D,BAIL}=H;
const T=(a,b)=>a+Math.floor(Math.random()*(b-a)),RES=150;
const mine=(G,k)=>B.map((_,i)=>i).filter(i=>G.own[i]===k);
const full=(G,g,o)=>GR[g].every(j=>G.own[j]===o);
// cuánto vale la casilla q para k: precio, más si le completa el grupo o si le corta el grupo a otro
function worth(G,k,q,sinQ,ext){const s=B[q],has=j=>G.own[j]===k||(ext&&ext.includes(j));let v=s.p;
 if(s.t=='p'){const g=GR[s.g],tiene=g.filter(j=>j!==q&&has(j)).length,otros=g.filter(j=>j!==q&&G.own[j]>=0&&G.own[j]!==k);
  if(tiene==g.length-1)v*=sinQ?2.5:1.8;else if(tiene==g.length-2&&tiene)v*=1.5;else if(tiene)v*=1.25;
  if(otros.length==g.length-1&&otros.every(j=>G.own[j]===G.own[otros[0]]))v*=1.3}
 else if(s.t=='r'||s.t=='u'){const L=B.filter((x,j)=>x.t==s.t&&j!==q&&G.own[j]===k).length;v*=1+.2*L}
 return v*(1+Math.max(0,G.cash[k]-1500)/2000)}
// lo que vale un trato para k (positivo: le conviene)
function tval(G,k,T){const yo=T.b===k,da=yo?T.bp:T.ap,rec=yo?T.ap:T.bp,cd=yo?T.bc:T.ac,cr=yo?T.ac:T.bc,jd=yo?T.bj:T.aj,jr=yo?T.aj:T.bj,otro=yo?T.a:T.b;
 let v=cr-cd+50*(jr-jd);
 rec.forEach(q=>v+=worth(G,k,q,0,rec));
 da.forEach(q=>{v-=worth(G,k,q,1);const s=B[q];
  // no regalarle un grupo completo al otro
  if(s.t=='p'&&GR[s.g].every(j=>j===q||G.own[j]===otro||rec.includes(j)))v-=s.p});
 return v}
// construir: en el grupo completo más caro, la colonia con menos casas
function build(G,k){if(G.debts.length||G.auc)return null;
 const gs=[...new Set(mine(G,k).filter(i=>B[i].t=='p').map(i=>B[i].g))].filter(g=>full(G,g,k)&&!GR[g].some(j=>G.mg[j]));
 gs.sort((a,b)=>D.hc[b]-D.hc[a]);
 for(const g of gs){const hc=D.hc[g];if(G.cash[k]-hc<RES+40)continue;const L=GR[g].filter(j=>G.hs[j]<5);if(!L.length)continue;
  const q=L.sort((a,b)=>G.hs[a]-G.hs[b])[0];return {t:'build',sq:q}}
 return null}
// juntar dinero para una deuda: vender casas (la más alta del grupo), luego hipotecar lo que no está en grupo completo
function raise(G,k){const P=mine(G,k);
 const ch=P.filter(i=>G.hs[i]).sort((a,b)=>G.hs[b]-G.hs[a]||D.hc[B[b].g]-D.hc[B[a].g]);if(ch.length)return {t:'sell',sq:ch[0]};
 if(G.o.mort){const M=P.filter(i=>!G.mg[i]&&!(B[i].t=='p'&&GR[B[i].g].some(j=>G.hs[j])));
  M.sort((a,b)=>(B[a].t=='p'&&full(G,B[a].g,k))-(B[b].t=='p'&&full(G,B[b].g,k))||B[a].p-B[b].p);if(M.length)return {t:'mort',sq:M[0]}}
 return null}
// memoria por partida: cuándo propuso cada bot
const MEM=new WeakMap(),mem=G=>{let m=MEM.get(G);if(!m)MEM.set(G,m={t:{},last:{}});return m};
const casas=(G,q)=>B[q].t=='p'&&GR[B[q].g].some(j=>G.hs[j]);
// trato para juntar un grupo: le pide a un dueño sus casillas del grupo (al que tiene menos); si esa persona necesita una suya para su grupo, se la cambia;
// pone el dinero que haga falta para que al otro le convenga, si a él todavía le conviene
function propose(G,k){const m=mem(G),n=G.players.length;if(G.tc-(m.last[k]??-99)<2*n)return null;
 for(const g of GR.map((_,g)=>g).sort(()=>Math.random()-.5)){const L=GR[g];if(!L.some(j=>G.own[j]===k)||L.some(j=>G.own[j]<0||G.hs[j]))continue;
  const F=L.filter(j=>G.own[j]!==k);if(!F.length)continue;const os=[...new Set(F.map(j=>G.own[j]))].sort((a,b)=>F.filter(j=>G.own[j]===a).length-F.filter(j=>G.own[j]===b).length),o=os[0],falt=F.filter(j=>G.own[j]===o);if(G.bk[o])continue;
  const sw=mine(G,k).filter(i=>B[i].t=='p'&&B[i].g!==g&&!casas(G,i)&&GR[B[i].g].every(j=>j===i||G.own[j]===o)).slice(0,1);
  const Tr={a:k,b:o,ac:0,ap:sw,aj:0,bc:0,bp:falt,bj:0},vt=tval(G,o,Tr),c=Math.max(0,Math.ceil((40-vt)/10)*10+T(0,4)*10);Tr.ac=c;
  if(G.cash[k]-c>=RES&&tval(G,k,Tr)>30){m.last[k]=G.tc;m.t[k]=Date.now();return {t:'tprop',to:o,ac:c,ap:sw,bp:falt}}}
 m.last[k]=G.tc;return null}
// aus: el asiento es de una persona sin conexión (no de un bot): solo mantiene la partida andando (tira, paga, termina, junta dinero si debe);
// no compra, no puja, no construye, no deshipoteca y no acepta ni propone tratos (al volver, sus decisiones siguen siendo suyas)
function bot0(R,k){const G=R.G;if(!G||G.bk[k])return null;const aus=!!(R.players[k]&&!R.players[k].bot);
 if(G.phase=='orden')return G.turn===k?{ms:T(900,1600),m:{t:'roll'}}:null;
 if(G.phase!='play')return null;
 // subasta: puja hasta lo que le sirve la casilla, sin quedarse sin colchón
 const a=G.auc;if(a){if(!a.in.includes(k)||a.hi===k)return null;if(aus)return {ms:T(1200,2000),m:{t:'apass'}};
  const tope=Math.min(G.cash[k]-60,Math.round(worth(G,k,a.sq)*(.85+Math.random()*.25))),step=a.bid<100?10:a.bid<300?20:50,v=a.bid+step;
  return v<=tope?{ms:T(1200,3200),m:{t:'bid',v}}:{ms:T(1500,3000),m:{t:'apass'}}}
 // tratos
 const Tr=G.trade;if(Tr){if(Tr.b===k)return {ms:T(2500,4000),m:{t:!aus&&tval(G,k,Tr)>20?'tyes':'tno'}};if(Tr.a===k){const t0=mem(G).t[k],ya=t0&&Date.now()-t0<40000;return {ms:ya?Math.max(800,t0+25000-Date.now()):T(4000,6000),m:{t:'tno'}}}}
 // deudas
 if(G.debts.length){const d=G.debts[0];if(d.k!==k)return null;
  if(G.cash[k]>=d.amt)return {ms:T(800,1400),m:{t:'paydebt'}};
  const r=raise(G,k);return {ms:T(900,1500),m:r||{t:'broke'}}}
 if(G.turn!==k)return null;
 if(G.st=='buy'){const s=B[G.pos[k]],w=worth(G,k,G.pos[k]),res=w>s.p*1.5?40:RES;
  return {ms:T(1600,2400),m:{t:!aus&&G.cash[k]-s.p>=res?'buy':'nobuy'}}}
 const b=!aus&&build(G,k);if(b)return {ms:T(900,1500),m:b};
 // deshipotecar con dinero de sobra
 if(G.o.mort&&!aus){const q=mine(G,k).find(i=>G.mg[i]&&G.cash[k]-Math.ceil(B[i].p*.55)>RES+300);if(q!=null)return {ms:T(900,1500),m:{t:'unm',sq:q}}}
 if(G.st=='roll'){if(G.jail[k]&&!aus){const libres=B.filter((s,i)=>s.p&&G.own[i]<0).length;
   if(G.jfc[k].length&&libres>6)return {ms:T(1000,1600),m:{t:'jcard'}};
   if(libres>10&&G.cash[k]>=BAIL+RES)return {ms:T(1000,1600),m:{t:'bail'}}}
  return {ms:T(1100,1800),m:{t:'roll'}}}
 if(G.st=='end'){const p=!Tr&&!aus&&propose(G,k);return p?{ms:T(1500,2500),m:p}:{ms:T(1800,2600),m:{t:'end'}}}
 return null}
// ritmo: piensa la mitad que antes, pero nunca antes de que su ficha termine de caminar en la pantalla (y de que se vea la carta)
function espera(G){const m=mem(G),now=Date.now();if(G.rn!==m.rn){m.rn=G.rn;const n=(G.dice[0]||0)+(G.dice[1]||0);m.w=n?now+n*240+700:0}
 const cn=G.card?G.card.n:-1;if(cn!==m.cn){if(m.cn!==undefined&&cn>=0)m.w=Math.max(m.w||0,now)+2300;m.cn=cn}return (m.w||0)-now}
return function bot(R,k){const d=bot0(R,k);if(d&&R.G)d.ms=Math.max(400,Math.round(d.ms*.5),espera(R.G)+200);return d}}
