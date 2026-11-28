// Bots de Colonos. bot(R,k) → {m: acción, ms: espera} o null; server.js lo agenda y lo manda por act().
// Fundan por probabilidad (puntitos), escasez y variedad; construyen hacia la meta más cercana; cambian con banco, puertos y jugadores;
// no le ayudan a quien va ganando (ni comercian con él y le ponen el ladrón). Estilo por nombre: ciudad · camino · carta · comercio.
module.exports=X=>{const {D,geo,tot,has,vp,actor}=X,{COST,PIP}=D;
const botn=require('./bots_nombres.js').BOTN.slice(),STY=['ciudad','camino','carta','comercio'];
const sty=(R,k)=>{const s=R.players[k].name;let h=0;for(const c of s)h=h*31+c.charCodeAt(0)|0;return STY[Math.abs(h)%4]};
const miss=(r,c)=>c.reduce((s,x,i)=>s+Math.max(0,x-r[i]),0);
const avoid=(G,k,j)=>{const v=vp(G,j,false);return j!==k&&(v>=G.o.pts-2||v>=vp(G,k,false)+3)};
const other=(E,v)=>E.v[0]===v?E.v[1]:E.v[0];
// puntitos por recurso que ya produce k (el hex del ladrón no cuenta)
function prodOf(G,k){const g=geo(G),a=[0,0,0,0,0];G.vo.forEach((o,v)=>{if(o!==k)return;g.V[v].h.forEach(h=>{const x=G.hx[h];if(D.prod(x.t)&&h!==G.rob)a[x.t]+=PIP(x.n)*(G.vt[v]=='u'?2:1)})});return a}
// escasez: el recurso que la isla produce menos vale más
function peso(G){if(G._w)return G._w;const P=[0,0,0,0,0];G.hx.forEach(x=>{if(D.prod(x.t))P[x.t]+=PIP(x.n)});const m=tot(P)/5;
 const w=P.map(p=>Math.max(.75,Math.min(1.4,m/(p||1))));Object.defineProperty(G,'_w',{value:w,enumerable:false});return w}
function portAt(G,v){const g=geo(G);let r=null;G.ports.forEach(p=>{if(g.E[p.e].v.includes(v))r=p.r});return r}
// qué tan buena es una esquina para k
function vScore(G,k,v,first){const g=geo(G),w=peso(G),pr=prodOf(G,k);let s=0;const gain=[0,0,0,0,0];
 g.V[v].h.forEach(h=>{const x=G.hx[h];if(!D.prod(x.t))return;const p=PIP(x.n)*(h===G.rob?.3:1);gain[x.t]+=p;
  s+=p*w[x.t]*(pr[x.t]?1:1.35)*(first&&(x.t<2)?1.15:1)});
 const pt=portAt(G,v);if(pt!=null)s+=pt<0?1.5:.35*(pr[pt]+gain[pt]);return s}
function bestOf(L,f){let b=null,bs=-1e9;L.forEach(x=>{const s=f(x);if(s>bs){bs=s;b=x}});return b==null?null:{x:b,s:bs}}
// orilla para camino: hacia la mejor esquina libre cercana, y más si alarga la ruta en una carrera por la medalla
function roadPick(G,k,L,race){const g=geo(G),base=race?D.roadLen(G,k):0;
 return bestOf(L,e=>{const E=g.E[e];let t=0;
  E.v.forEach(w=>{if(G.vo[w]>=0)return;if(D.okV(G,k,w,true))t=Math.max(t,vScore(G,k,w));
   g.V[w].v.forEach(x=>{if(x!==other(E,w)&&D.okV(G,k,x,true))t=Math.max(t,.8*vScore(G,k,x))})});
  if(race){G.eo[e]=k;const l=D.roadLen(G,k);G.eo[e]=-1;t+=3*(l-base)}return t})}
// meta: lo que está más cerca de pagarse, con un empujón según el estilo
function meta(G,k,R){const r=G.res[k],lf=D.left(G,k),s=sty(R,k),C=[];
 const lrRace=lf.c>0&&G.ll[k]>=3&&G.lr!==k&&(G.lr<0?G.ll[k]>=4:G.ll[k]>=G.ll[G.lr]-1);
 if(D.spots(G,k,'u').length)C.push({w:'u',v:3+(s=='ciudad'?1:0)});
 const sp=D.spots(G,k,'p');if(sp.length)C.push({w:'p',v:3.2});
 else if(lf.p>0&&lf.c>0){const rp=roadPick(G,k,D.spots(G,k,'c'),lrRace);if(rp&&rp.s>0)C.push({w:'c',v:2+(s=='camino'?.8:0),e:rp.x})}
 if(lrRace&&!C.some(c=>c.w=='c')){const rp=roadPick(G,k,D.spots(G,k,'c'),true);if(rp&&rp.s>0)C.push({w:'c',v:2.2,e:rp.x})}
 if(G.deck.length)C.push({w:'d',v:1.4+(s=='carta'?1:0)});
 const b=bestOf(C,c=>-miss(r,COST[c.w])+.6*c.v);return b&&b.x}
function where(G,k,g0,R){const g=geo(G);
 if(g0.w=='u')return bestOf(D.spots(G,k,'u'),v=>g.V[v].h.reduce((s,h)=>s+(h===G.rob?0:PIP(G.hx[h].n)),0)).x;
 if(g0.w=='p')return bestOf(D.spots(G,k,'p'),v=>vScore(G,k,v)).x;
 if(g0.w=='c')return g0.e!=null?g0.e:(roadPick(G,k,D.spots(G,k,'c'),false)||{}).x}
// ladrón: donde más le duele a los demás (más al que va ganando), nunca en un hex propio si se puede
function robberPick(G,k){const g=geo(G);
 const L=G.hx.map((x,h)=>h).filter(h=>D.land(G.hx[h].t)&&h!==G.rob);
 return bestOf(L,h=>{const x=G.hx[h];let s=0;g.H[h].v.forEach(v=>{const o=G.vo[v];if(o<0)return;const m=G.vt[v]=='u'?2:1;
  if(o===k)s-=10*m*Math.max(1,PIP(x.n));else s+=PIP(x.n)*m*(1+vp(G,o,false)/G.o.pts)+(tot(G.res[o])?.5:0)});return s}).x}
function discardPick(G,k){const r=G.res[k].slice(),n=G.dis[k],g0=meta(G,k,{players:G.players})||{w:'u'},need=COST[g0.w]||[0,0,0,0,0],d=[0,0,0,0,0];
 for(let i=0;i<n;i++){const b=bestOf([0,1,2,3,4].filter(j=>r[j]>0),j=>r[j]-need[j]*1.5);d[b.x]++;r[b.x]--}return d}
// vale la pena aceptar: recibe lo que le falta para su meta y da lo que le sobra
function worth(G,k,get,give,R){const r=G.res[k],g0=meta(G,k,R),need=g0?COST[g0.w]:[0,0,0,0,0];let a=0,b=0;
 get.forEach((x,j)=>{a+=x*(Math.max(0,need[j]-r[j])>0?2:.7)});give.forEach((x,j)=>{b+=x*(r[j]-x<need[j]?2:.7)});return a>b+.05}
function respond(G,k,R){const T=G.turn;
 for(const o of G.offers){if(o.from!==T||o.from===k||(o.to>=0&&o.to!==k)||o.si.includes(k)||o.no.includes(k))continue;
  const ok=has(G.res[k],o.want)&&!avoid(G,k,T)&&worth(G,k,o.give,o.want,R);return {m:{t:ok?'accept':'reject',id:o.id},ms:700+Math.random()*600|0}}
 if(k===T&&G.st=='main')for(const o of G.offers){if(o.to!==k||o.from===k)continue;   // contraofertas que le llegan
  const ok=has(G.res[k],o.want)&&!avoid(G,k,o.from)&&worth(G,k,o.give,o.want,R);return {m:{t:ok?'accept':'reject',id:o.id},ms:700}}
 return null}
function playDev(G,k,R){if(G.played)return null;const can=c=>G.dev[k].some(x=>x.c===c&&x.t!==G.tc),g=geo(G);
 if(can('k')){const hurt=g.H[G.rob].v.some(v=>G.vo[v]===k)&&PIP(G.hx[G.rob].n)>=3,army=G.ga!==k&&G.kn[k]+1>=3&&(G.ga<0||G.kn[k]+1>G.kn[G.ga]);
  if(hurt||army||G.st=='main'&&G.dev[k].filter(x=>x.c=='k').length>1)return {t:'play',c:'k'}}
 if(G.st!='main')return null;
 if(can('m')){const P=G.players.map((_,j)=>prodOf(G,j));let best=-1,bs=0;
  for(let r=0;r<5;r++){let e=0;G.players.forEach((_,j)=>{if(j===k||G.out[j])return;const t=tot(P[j])||1;e+=tot(G.res[j])*P[j][r]/t});if(e>bs){bs=e;best=r}}
  if(bs>=3)return {t:'play',c:'m',r:best}}
 const g0=meta(G,k,R);
 if(can('a')&&g0){const m=COST[g0.w].map((x,i)=>Math.max(0,x-G.res[k][i])),L=[];m.forEach((x,i)=>{for(let j=0;j<x;j++)L.push(i)});
  if(L.length>=1&&L.length<=2){while(L.length<2)L.push(G.bank[4]>0?4:3);const nd=[0,0,0,0,0];L.forEach(r=>nd[r]++);if(has(G.bank,nd))return {t:'play',c:'a',r:L}}}
 if(can('c')&&D.left(G,k).c>=2){const rp=roadPick(G,k,D.spots(G,k,'c'),G.ll[k]>=3);if(rp&&rp.s>0)return {t:'play',c:'c'}}
 return null}
function bankFor(G,k,g0){const r=G.res[k],need=COST[g0.w];
 for(let j=0;j<5;j++){if(r[j]>=need[j]||G.bank[j]<1)continue;
  const b=bestOf([0,1,2,3,4].filter(s=>s!==j&&r[s]-need[s]>=D.rate(G,k,s)),s=>r[s]-need[s]-D.rate(G,k,s));if(b)return {t:'bank',give:b.x,get:j}}return null}
const SPD=900;
function bot(R,k){const G=R.G;if(!G||G.phase!='play'||G.out[k])return null;const ms=(a)=>Math.round((a||SPD)*(0.8+Math.random()*.4));
 if(G.st=='discard'){if(G.dis[k]==null)return null;return {m:{t:'discard',r:discardPick(G,k)},ms:ms(900)}}
 const rs=respond(G,k,R);if(rs)return rs;
 if(actor(G)!==k)return null;const g=geo(G);
 if(G.st=='setup'){if(G.sv<0)return {m:{t:'build',w:'p',at:bestOf(D.spots(G,k,'p'),v=>vScore(G,k,v,G.si<G.players.length)).x},ms:ms(1100)};
  return {m:{t:'build',w:'c',at:roadPick(G,k,D.spots(G,k,'c'),false).x},ms:ms(700)}}
 if(G.st=='roll'){const d=playDev(G,k,R);if(d)return {m:d,ms:ms(800)};return {m:{t:'roll'},ms:ms(900)}}
 if(G.st=='robber')return {m:{t:'robber',h:robberPick(G,k)},ms:ms(1000)};
 if(G.st=='steal')return {m:{t:'steal',v:bestOf(G.cand,j=>vp(G,j,false)*10+tot(G.res[j])).x},ms:ms(700)};
 if(G.st=='roads'){const rp=roadPick(G,k,D.spots(G,k,'c'),G.ll[k]>=3);return {m:rp?{t:'build',w:'c',at:rp.x}:{t:'skip'},ms:ms(700)}}
 if(G.ac>40)return {m:{t:'end'},ms:ms(600)};   // tope de seguridad por turno
 const g0=meta(G,k,R);
 if(G.st=='sbp'){if(g0&&has(G.res[k],COST[g0.w])){const at=where(G,k,g0,R);if(g0.w=='d')return {m:{t:'buy'},ms:ms(800)};if(at!=null)return {m:{t:'build',w:g0.w,at},ms:ms(800)}}
  return {m:{t:'end'},ms:ms(500)}}
 if(G.st!='main')return null;
 const mine=G.offers.find(o=>o.from===k);
 if(mine){const yes=mine.si.filter(j=>has(G.res[j],mine.want));if(yes.length)return {m:{t:'close',id:mine.id,k:bestOf(yes,j=>-vp(G,j,false)).x},ms:ms(700)};
  const el=G.players.map((_,j)=>j).filter(j=>j!==k&&!G.out[j]&&(mine.to<0||mine.to===j)),wait=5000-(Date.now()-mine.at);
  return {m:{t:'cancel',id:mine.id},ms:el.every(j=>mine.no.includes(j))?ms(500):Math.max(300,wait)}}
 const d=playDev(G,k,R);if(d)return {m:d,ms:ms(900)};
 if(g0){if(has(G.res[k],COST[g0.w])){if(g0.w=='d')return {m:{t:'buy'},ms:ms(900)};const at=where(G,k,g0,R);if(at!=null)return {m:{t:'build',w:g0.w,at},ms:ms(1000)}}
  const bk=bankFor(G,k,g0);if(bk)return {m:bk,ms:ms(800)};
  const H=R.hz||(R.hz={});H.of=H.of||{};const r=G.res[k],need=COST[g0.w],mi=need.map((x,i)=>Math.max(0,x-r[i]));
  if(tot(mi)==1&&H.of[k]!==G.tc){H.of[k]=G.tc;const s=bestOf([0,1,2,3,4].filter(j=>r[j]-need[j]>=1),j=>r[j]-need[j]-(sty(R,k)=='comercio'?0:.5));
   if(s){const give=[0,0,0,0,0],want=[0,0,0,0,0];give[s.x]=1;want[mi.indexOf(1)]=1;return {m:{t:'offer',give,want,to:-1},ms:ms(900)}}}}
 // con muchas cartas, antes de terminar gasta en lo que se pueda para no perder la mitad con un 7
 if(tot(G.res[k])>G.o.hl){if(G.deck.length&&has(G.res[k],COST.d))return {m:{t:'buy'},ms:ms(800)};
  const L=D.spots(G,k,'c');if(L.length&&has(G.res[k],COST.c))return {m:{t:'build',w:'c',at:roadPick(G,k,L,true).x},ms:ms(800)}}
 return {m:{t:'end'},ms:ms(700)}}
return {bot,botn}};
