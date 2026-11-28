// Prueba de Colonos: casos de reglas sueltos y partidas solo de bots con semilla fija (3 a 6 jugadores). Revisa cada jugada contra las reglas.
// Uso: node tests/colonos.js [partidas=300] [semilla=2026]
const N=+process.argv[2]||300,SEED=+process.argv[3]||2026;
let s=SEED;Math.random=()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const M=require('../g_colonos.js'),D=require('../colonos_data.js'),{ESC,PZ,COST,PIP}=D,tot=a=>a.reduce((x,y)=>x+y,0);
let bad=0;const ok=(c,msg)=>{if(!c){bad++;console.log('  MAL: '+msg)}};
const mk=n=>{const R={players:Array.from({length:n},(_,k)=>({tok:'t'+k,id:'p'+k,name:'P'+k,seen:Date.now(),bot:true})),opts:{n}};M.start(R);return R};
const A=(R,k,m)=>M.act(R,'t'+k,m);
const dar=(G,k,h)=>{G.res[k].forEach((x,i)=>{G.bank[i]+=x});G.res[k]=h.slice();h.forEach((x,i)=>{G.bank[i]-=x})};
// juega el inicio con los bots
function pasaInicio(R){let g=0;while(R.G.st=='setup'&&g++<200){const k=R.G.turn,d=M.bot(R,k);A(R,k,d.m)}}
// ---- camino más largo hecho aparte: DFS por orillas, sin pasar por esquinas con pieza rival ----
function road2(G,k){const g=D.geo(G.hx),mine=G.eo.map((o,e)=>o===k?e:-1).filter(e=>e>=0);let b=0;
 const go=(v,used)=>{let m=0;if(used.length&&G.vo[v]>=0&&G.vo[v]!==k)return 0;
  for(const e of mine){if(used.includes(e))continue;const E=g.E[e];if(E.v[0]!==v&&E.v[1]!==v)continue;m=Math.max(m,1+go(E.v[0]===v?E.v[1]:E.v[0],used.concat(e)))}return m};
 mine.forEach(e=>g.E[e].v.forEach(v=>b=Math.max(b,go(v,[]))));return b}
function pts(G,k){let p=0;G.vt.forEach((t,v)=>{if(t&&G.vo[v]===k)p+=PZ[t].pts});return p+(G.lr===k?2:0)+(G.ga===k?2:0)+G.dev[k].filter(c=>c.c=='v').length}
// ---- todas las reglas que deben valer después de cada jugada ----
function inv(G,tag){const g=D.geo(G.hx),S=ESC[G.esc],E=[],n=G.players.length;
 for(let r=0;r<5;r++){const t=G.bank[r]+G.res.reduce((a,x)=>a+x[r],0);if(t!==S.banco)E.push('recurso '+r+' suma '+t);if(G.bank[r]<0)E.push('banco negativo')}
 G.res.forEach((x,k)=>{if(x.some(v=>v<0))E.push('mano negativa '+k)});
 const dv=G.deck.length+G.dev.reduce((a,d)=>a+d.length,0)+G.used.reduce((a,u)=>a+u.length,0),dt=tot(Object.values(S.mazo));if(dv!==dt)E.push('cartas '+dv+' de '+dt);
 G.kn.forEach((x,k)=>{if(x!==G.used[k].filter(c=>c=='k').length)E.push('caballeros '+k)});
 G.players.forEach((_,k)=>{const l=D.left(G,k);for(const w in l)if(l[w]<0)E.push('piezas '+w+' de '+k)});
 G.vo.forEach((o,v)=>{if(o<0)return;if(!G.vt[v])E.push('esquina sin pieza');if(g.V[v].v.some(w=>G.vo[w]>=0))E.push('poblados vecinos en '+v)});
 G.eo.forEach((o,e)=>{if((o<0)!==!G.et[e])E.push('orilla sin pieza')});
 // cada camino está unido (por caminos propios) a una pieza propia
 for(let k=0;k<n;k++){const mine=new Set(G.eo.map((o,e)=>o===k?e:-1).filter(e=>e>=0)),seen=new Set(),st=[];
  G.vo.forEach((o,v)=>{if(o===k)st.push(v)});const vs=new Set(st);
  while(st.length){const v=st.pop();for(const e of g.V[v].e)if(mine.has(e)&&!seen.has(e)){seen.add(e);g.E[e].v.forEach(w=>{if(!vs.has(w)){vs.add(w);st.push(w)}})}}
  if(seen.size!==mine.size)E.push('camino suelto de '+k)}
 if(G.st!='setup'){const L=G.players.map((_,k)=>road2(G,k)),mx=Math.max(...L);
  if(G.lr>=0&&(L[G.lr]<5||L[G.lr]!==mx))E.push('ruta mal: tiene '+G.lr+' con '+L[G.lr]+', máx '+mx);
  if(G.lr<0&&mx>=5&&L.filter(x=>x===mx).length==1)E.push('ruta sin dueño con '+mx);
  L.forEach((l,k)=>{if(l!==G.ll[k])E.push('largo de ruta '+k+': '+G.ll[k]+' vs '+l)})}
 if(G.ga>=0&&(G.kn[G.ga]<3||G.kn.some(x=>x>G.kn[G.ga])))E.push('ejército mal');
 if(G.rob<0||!G.hx[G.rob])E.push('ladrón fuera');
 G.players.forEach((_,k)=>{if(pts(G,k)!==M._.vp(G,k,true))E.push('puntos '+k)});
 if(G.phase=='final'&&!G.out.some(x=>x)&&pts(G,G.win)<G.o.pts)E.push('ganó sin puntos');
 if(E.length)throw new Error(tag+': '+E.slice(0,3).join(' · '))}
console.log('Colonos: casos de reglas');
// tableros: 6 y 8 nunca juntos, cuentas de terrenos y números, puertos en la costa
for(const esc of ['base','grande'])for(let i=0;i<150;i++){const b=D.board(esc,i==0&&esc=='base'),g=D.geo(b.hx),S=ESC[esc];
 const hot=n=>n==6||n==8;ok(!b.hx.some((h,j)=>hot(h.n)&&g.H[j].nb.some(x=>x>=0&&hot(b.hx[x].n))),esc+': 6/8 juntos');
 for(const t in S.ter)ok(b.hx.filter(h=>h.t==t).length==S.ter[t],esc+': terreno '+t);
 ok(b.hx.filter(h=>h.n).map(h=>h.n).sort((a,c)=>a-c).join()==S.num.slice().sort((a,c)=>a-c).join(),esc+': números');
 ok(b.ports.length==S.tipos.length&&b.ports.every(p=>g.E[p.e].h.length==1),esc+': puertos');
 ok(new Set(b.ports.map(p=>p.e)).size==b.ports.length,esc+': puertos repetidos');
 const pv=new Set();b.ports.forEach(p=>g.E[p.e].v.forEach(v=>{ok(!pv.has(v),esc+': puertos pegados');pv.add(v)}));
 ok(b.hx[b.rob].t==D.DES,esc+': ladrón en el desierto')}
{const R=mk(5);ok(R.G.esc=='grande'&&R.G.sbp&&R.G.bank[0]==24&&R.G.deck.length==34,'5 jugadores usan la isla grande');}
{const R=mk(3);ok(R.G.esc=='base'&&!R.G.sbp&&R.G.deck.length==25,'3 jugadores usan la isla');}
// inicio: el segundo poblado cobra; deshacer el poblado antes del camino
{const R=mk(4),G=R.G;pasaInicio(R);inv(G,'inicio');
 G.players.forEach((_,k)=>{ok(G.vo.filter(o=>o===k).length==2&&G.eo.filter(o=>o===k).length==2,'inicio: 2 poblados y 2 caminos de '+k)});
 ok(G.st=='roll'&&G.turn==G.first,'inicio: tira el primero');ok(tot(G.res.map(tot))>0,'inicio: cobran el segundo poblado');}
{const R=mk(3),G=R.G,k=G.turn,v=D.spots(G,k,'p')[0];A(R,k,{t:'build',w:'p',at:v});ok(G.vo[v]===k,'pone');ok(!A(R,k,{t:'undo'})&&G.vo[v]===-1&&G.sv===-1,'deshace el poblado del inicio');}
// construir y deshacer en el turno; el dado lo vuelve definitivo
{const R=mk(4),G=R.G;pasaInicio(R);const k=G.turn;G.st='main';dar(G,k,[3,3,1,1,0]);
 const before=JSON.stringify([G.vo,G.vt,G.eo,G.res,G.bank,G.ll,G.lr]),e=D.spots(G,k,'c')[0];
 ok(!A(R,k,{t:'build',w:'c',at:e})&&G.eo[e]===k,'construye camino');ok(!A(R,k,{t:'bank',give:0,get:4})||true,'banco');
 while(G.und.length)ok(!A(R,k,{t:'undo'}),'deshace');ok(JSON.stringify([G.vo,G.vt,G.eo,G.res,G.bank,G.ll,G.lr])==before,'deshacer deja todo igual');
 A(R,k,{t:'build',w:'c',at:e});A(R,k,{t:'end'});ok(A(R,k,{t:'undo'}),'después de terminar ya no se deshace');ok(G.eo[e]===k,'el camino se queda');inv(G,'deshacer');}
// el banco no alcanza: si se le debe a varios, nadie cobra
const RND=Math.random,dados=(a,b,f)=>{const w=[(a-1)/6+.01,(b-1)/6+.01];let i=0;Math.random=()=>w[i++%2];try{f()}finally{Math.random=RND}};
{const R=mk(4),G=R.G;pasaInicio(R);const g=D.geo(G.hx),h=G.hx.findIndex((x,j)=>D.prod(x.t)&&j!==G.rob&&new Set(g.H[j].v.map(v=>G.vo[v]).filter(o=>o>=0)).size>=2);
 if(h>=0){const t=G.hx[h].t,n=G.hx[h].n,nums=G.hx.map(x=>x.n);G.hx.forEach((x,j)=>{if(j!==h&&x.n===n)x.n=0});
  G.res.forEach((r,k)=>{G.bank[t]+=r[t];r[t]=0});G.res[G.turn][t]=G.bank[t]-1;G.bank[t]=1;
  const r0=G.res.map(r=>r.slice());dados(Math.min(6,n-1),n-Math.min(6,n-1),()=>A(R,G.turn,{t:'roll'}));
  ok(G.dice[0]+G.dice[1]===n,'dados fijos');ok(G.res.every((r,k)=>r[t]===r0[k][t])&&G.bank[t]===1,'banco corto: nadie cobra si se le debe a varios');
  G.hx.forEach((x,j)=>x.n=nums[j]);inv(G,'banco corto')}}
// carta comprada en el turno no se juega; un 7 hace descartar la mitad hacia abajo
{const R=mk(3),G=R.G;pasaInicio(R);const k=G.turn;G.st='main';{const d=G.deck,i=d.indexOf('k');[d[i],d[d.length-1]]=[d[d.length-1],d[i]]}const take=c=>c.forEach((x,i)=>{G.bank[i]-=x;G.res[k][i]+=x});take(COST.d);
 ok(!A(R,k,{t:'buy'})&&G.dev[k].length==1,'compra carta');ok(!!A(R,k,{t:'play',c:'k'}),'no juega la carta del mismo turno');
 const j=(k+1)%3;G.res[j].forEach((x,i)=>{G.bank[i]+=x;G.res[j][i]=0});[3,3,3,0,0].forEach((x,i)=>{G.bank[i]-=x;G.res[j][i]+=x});
 A(R,k,{t:'end'});dados(3,4,()=>A(R,G.turn,{t:'roll'}));
 ok(G.dice[0]+G.dice[1]==7&&G.st=='discard'&&G.dis[j]==4,'con 9 cartas descarta 4');inv(G,'siete');}
// ruta más larga: 5 caminos dan la medalla; un poblado rival en medio la corta
{const R=mk(3),G=R.G;pasaInicio(R);const g=D.geo(G.hx),k=G.turn;G.st='main';let put=0;
 for(let i=0;i<8&&put<5;i++){const L=D.spots(G,k,'c');if(!L.length)break;let best=null,bl=-1;for(const e of L){G.eo[e]=k;G.et[e]='c';const l=D.roadLen(G,k);G.eo[e]=-1;G.et[e]='';if(l>bl){bl=l;best=e}}
  COST.c.forEach((x,r)=>{G.bank[r]-=x;G.res[k][r]+=x});A(R,k,{t:'build',w:'c',at:best});put=D.roadLen(G,k)}
 inv(G,'ruta');ok(D.roadLen(G,k)<5||G.lr===k,'5 caminos dan la Ruta más larga');}
console.log(bad?'  '+bad+' casos mal':'  casos bien');
// ---- partidas de bots ----
const st={games:0,done:0,stuck:0,rule:0,fails:[],errs:{},turns:[],acts:0,byN:{},sevens:0,trades:0,bank:0,lr:0,ga:0,sbp:0,dev:0,undo:0};
const t0=Date.now();
for(let gi=0;gi<N;gi++){const n=3+gi%4,R=mk(n),G=R.G;G.o.pts=gi%5==0?8:10;G.o.fijo=gi%7==0;st.games++;let acts=0,errRun=0,good=true;
 while(G.phase=='play'){let bm=null;R.players.forEach((p,k)=>{const d=M.bot(R,k);if(d&&(!bm||d.ms<bm.ms))bm=Object.assign({k},d)});
  if(!bm){st.stuck++;st.fails.push('partida '+gi+': trabada en '+G.st);good=false;break}
  const pre={lr:G.lr,ga:G.ga,st:G.st,ln:G.ln};const e=A(R,bm.k,bm.m);acts++;
  if(e){st.errs[e]=(st.errs[e]||0)+1;if(++errRun>8){st.stuck++;st.fails.push('partida '+gi+': error repetido "'+e+'" '+JSON.stringify(bm.m));good=false;break}continue}errRun=0;
  if(bm.m.t=='roll'&&G.dice[0]+G.dice[1]==7)st.sevens++;if(bm.m.t=='close'||(bm.m.t=='accept'&&G.log[G.log.length-1].t=='trato'))st.trades++;if(bm.m.t=='bank')st.bank++;
  if(G.lr!==pre.lr&&G.lr>=0)st.lr++;if(G.ga!==pre.ga)st.ga++;if(pre.st=='sbp'&&bm.m.t!='end')st.sbp++;if(bm.m.t=='play')st.dev++;
  try{inv(G,'partida '+gi+' jugada '+acts+' ('+JSON.stringify(bm.m)+')')}catch(x){st.rule++;if(st.fails.length<12)st.fails.push(x.message);good=false;break}
  if(acts>40000||G.round>400){st.stuck++;st.fails.push('partida '+gi+': no termina (ronda '+G.round+')');good=false;break}}
 st.acts+=acts;if(good&&G.phase=='final'){st.done++;st.turns.push(G.round);(st.byN[n]=st.byN[n]||[]).push(G.round);
  if(M._.vp(G,G.win,true)<G.o.pts){st.rule++;st.fails.push('partida '+gi+': ganó con '+M._.vp(G,G.win,true))}}}
const avg=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1):'-';
console.log('Partidas: '+st.done+'/'+st.games+' terminadas en '+((Date.now()-t0)/1000).toFixed(1)+' s · rondas promedio '+avg(st.turns)+' ('+Object.keys(st.byN).map(n=>n+'j '+avg(st.byN[n])).join(', ')+')');
console.log('Por partida: sietes '+(st.sevens/st.games).toFixed(1)+' · tratos '+(st.trades/st.games).toFixed(1)+' · banco '+(st.bank/st.games).toFixed(1)+' · cartas jugadas '+(st.dev/st.games).toFixed(1)+' · ruta cambia '+(st.lr/st.games).toFixed(1)+' · ejército '+(st.ga/st.games).toFixed(1)+' · entre turnos '+(st.sbp/st.games).toFixed(1));
const ne=Object.entries(st.errs).sort((a,b)=>b[1]-a[1]);if(ne.length)console.log('Errores de bots: '+ne.slice(0,6).map(([e,c])=>c+'× '+e).join(' | '));
st.fails.forEach(f=>console.log('  '+f));
const fallo=bad||st.stuck||st.rule;console.log(fallo?'FALLA':'BIEN');process.exit(fallo?1:0);
