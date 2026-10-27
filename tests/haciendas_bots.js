// Prueba de Haciendas de Yucatán: partidas solo de bots con semilla fija. Revisa que nada se trabe y que no se rompa ninguna regla.
// Uso: node tests/haciendas_bots.js [partidas=500] [semilla=2026]
const N=+process.argv[2]||500,SEED=+process.argv[3]||2026;
let s=SEED;Math.random=()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const M=require('../g_haciendas.js'),D=require('../haciendas_data.js'),{PIECES}=D,tot=a=>a.reduce((x,y)=>x+y,0);
const MAX_ACTS=30000,MAX_TURNS=1500;
// camino más largo, hecho aparte para comparar con el del módulo: DFS por orillas, sin pasar por esquinas con edificio rival
function road2(G,k){const g=D.geo(G.bn);let b=0;const mine=G.eo.map((o,e)=>o===k?e:-1).filter(e=>e>=0);
 const go=(v,used)=>{let m=0;if(used.length&&G.vo[v]>=0&&G.vo[v]!==k)return 0;
  for(const e of mine){if(used.includes(e))continue;const E=g.E[e];if(E.v[0]!==v&&E.v[1]!==v)continue;m=Math.max(m,1+go(E.v[0]===v?E.v[1]:E.v[0],used.concat(e)))}return m};
 mine.forEach(e=>g.E[e].v.forEach(v=>b=Math.max(b,go(v,[]))));return b}
function pts(G,k){let p=0;G.vo.forEach((o,v)=>{if(o===k)p+=G.vl[v]});return p+(G.lr===k?2:0)+(G.ga===k?2:0)+G.dev[k].filter(c=>c.id[0]=='p').length}
const st={stall:0,rules:0,games:0,wins:0,stuck:0,noWin:0,fails:[],errs:{},turns:[],acts:0,byN:{},bySty:{},sevens:0,trades:0,bank:0,cards:0,lr:0,ga:0,prot:0,disc:0};
const fail=(gi,msg)=>{if(st.fails.length<15)st.fails.push('partida '+gi+': '+msg)};
const t0=Date.now();
for(let gi=0;gi<N;gi++){const n=3+gi%4,names=M.botn.slice().sort(()=>Math.random()-.5);
 const R={players:Array.from({length:n},(_,k)=>({tok:'t'+k,id:'p'+k,name:names[k],seen:Date.now(),bot:true})),
  opts:Object.assign({},M.opts,{pts:8+gi%7,fijo:gi%3==0,hl:gi%5==0?9:7,vel:1+gi%3})};
 M.start(R);const G=R.G,g=D.geo(G.bn);st.games++;let acts=0,errRun=0,ok=true,plays={};
 while(G.phase=='play'){
  let bm=null;R.players.forEach((p,k)=>{const d=M.bot(R,k);if(d&&(!bm||d.ms<bm.ms))bm=Object.assign({k},d)});
  if(!bm){fail(gi,'trabada: nadie tiene jugada en '+G.st);st.stuck++;ok=false;break}
  const pre={vo:G.vo.slice(),vl:G.vl.slice(),eo:G.eo.slice(),res:G.res.map(r=>r.slice()),dev:G.dev.map(d=>d.map(c=>Object.assign({},c))),
   st:G.st,sv:G.sv,tc:G.tc,prot:G.prot.map(p=>p.h),dis:G.dis&&Object.assign({},G.dis),pl:G.pl.slice(),trn:G.trn||0,turn:G.turn};
  const e=M.act(R,'t'+bm.k,bm.m);acts++;
  if(e){st.errs[e]=(st.errs[e]||0)+1;if(++errRun>5){fail(gi,'el bot repite un error: '+e+' '+JSON.stringify(bm.m));st.stuck++;ok=false;break}continue}
  errRun=0;const m=bm.m,k=bm.k,bad=x=>{st.rules++;fail(gi,x+' · jugada '+JSON.stringify(m)+' de '+k+' en '+pre.st);ok=false};
  // recursos nunca negativos ni con decimales
  G.res.forEach((r,j)=>{if(r.some(x=>x<0||!Number.isInteger(x)))bad('recursos inválidos de '+j+': '+r)});
  // límites de piezas
  G.players.forEach((_,j)=>{let r=0,h=0,sb=0;G.vo.forEach((o,v)=>{if(o===j)G.vl[v]==1?r++:h++});G.eo.forEach(o=>{if(o===j)sb++});
   if(r>PIECES.r||h>PIECES.h||sb>PIECES.s)bad('piezas de más: '+j+' '+[r,h,sb])});
  // distancia entre ranchos, y lo construido no cambia de dueño ni baja
  G.vo.forEach((o,v)=>{if(o<0)return;if(g.V[v].v.some(w=>G.vo[w]>=0))bad('ranchos juntos en '+v);
   if(pre.vo[v]>=0&&(pre.vo[v]!==o||G.vl[v]<pre.vl[v]))bad('cambió un edificio en '+v);
   if(pre.vo[v]<0){if(pre.st!='setup'&&!g.V[v].e.some(x=>pre.eo[x]===o))bad('rancho sin sacbé en '+v);if(o!==k)bad('rancho de otro')}
   if(pre.vl[v]==1&&G.vl[v]==2&&pre.vo[v]!==k)bad('hacienda en rancho ajeno')});
  G.eo.forEach((o,x)=>{if(o<0||pre.eo[x]===o)return;if(pre.eo[x]>=0)bad('sacbé encimado');const E=g.E[x];
   const con=pre.st=='setup'?E.v.includes(pre.sv):E.v.some(v=>pre.vo[v]===o||(pre.vo[v]<0&&g.V[v].e.some(y=>y!==x&&pre.eo[y]===o)));if(!con)bad('sacbé suelto en '+x)});
  // cartas: se conservan, máximo una jugada por turno y nunca la recién comprada
  const nd=tot(G.dev.map(d=>d.length))+G.deck.length+tot(G.pl);if(nd!==25)bad('cartas: '+nd);
  G.pl.forEach((x,j)=>{if(x>pre.pl[j]){const pk=pre.tc+':'+j;if(plays[pk])bad('dos cartas en un turno');plays[pk]=1;st.cards++;
   if(!pre.dev[j].some(c=>c.id===m.c&&c.tc<pre.tc))bad('jugó una carta recién comprada')}});
  // huracán, descartes, bonos y puntos
  if(m.t=='move'&&pre.prot.includes(G.hur))bad('huracán en lugar protegido');
  if(m.t=='dev'&&m.c=='g'&&m.h!=null)st.prot++;
  if(m.t=='discard'){st.disc++;if(tot(pre.res[k])-tot(G.res[k])!==pre.dis[k])bad('descarte mal')}
  if(m.t=='roll'&&G.dice[0]+G.dice[1]==7)st.sevens++;
  if((G.trn||0)>pre.trn)st.trades++;if(m.t=='bank')st.bank++;
  const L=G.players.map((_,j)=>road2(G,j));if(L.some((l,j)=>l!==G.ll[j]&&m.t=='build'))bad('largo de camino distinto: '+L+' vs '+G.ll);
  if(G.lr>=0&&(L[G.lr]<5||L.some(l=>l>L[G.lr])))bad('Sacbé real mal asignado');
  if(G.ga>=0&&(G.gu[G.ga]<3||G.gu.some(x=>x>G.gu[G.ga])))bad('Guardia mayor mal asignada');
  if(G.phase=='final'&&G.stall){const p=pts(G,G.win);if(G.players.some((_,j)=>!G.out[j]&&pts(G,j)>p))bad('estancada: no ganó el de más puntos')}
  else if(G.phase=='final'){const p=pts(G,G.win);if(G.win!==G.turn)bad('ganó fuera de su turno');if(p<G.o.pts)bad('ganó con '+p+' de '+G.o.pts)}
  if(!ok||acts>MAX_ACTS||G.round>MAX_TURNS)break}
 if(ok&&G.phase!='final'){st.noWin++;fail(gi,'sin ganador tras '+acts+' jugadas y '+G.round+' rondas (meta '+G.o.pts+', '+n+' jugadores, mazo '+G.deck.length+'): '+
  G.players.map((_,j)=>pts(G,j)+'pts piezas '+JSON.stringify(M._.left(G,j))+' lugares r'+M._.spots(Object.assign({},G,{st:'main'}),j,'r').length+' s'+M._.spots(Object.assign({},G,{st:'main'}),j,'s').length+' cartas '+tot(G.res[j])).join(' | '))}
 if(G.stall)st.stall++;if(G.phase=='final'){st.wins++;st.turns.push(G.round);const P=R.players[G.win].name;st.bySty[P]=(st.bySty[P]||0)+1;st.byN[n]=(st.byN[n]||0)+1;if(G.lr>=0)st.lr++;if(G.ga>=0)st.ga++}
 st.acts+=acts}
// ---- reloj de 60 s y desconexión: una persona que no hace nada ----
const clock=[];{const now0=Date.now();let fake=now0;const realNow=Date.now;Date.now=()=>fake;
 const R={players:[{tok:'h',id:'h',name:'Ana',seen:fake},{tok:'b1',id:'b1',name:M.botn[0],seen:fake,bot:true},{tok:'b2',id:'b2',name:M.botn[1],seen:fake,bot:true}],opts:Object.assign({},M.opts)};
 M.start(R);const G=R.G;while(G.turn!==0||G.st!='setup'){const d=M.bot(R,G.turn);M.act(R,R.players[G.turn].tok,d.m)}
 clock.push(['al empezar su colocación, sin bot',!M.auto(R,0)]);fake+=59000;R.players[0].seen=fake;clock.push(['a los 59 s, sin bot',!M.auto(R,0)]);
 fake+=2000;R.players[0].seen=fake;clock.push(['a los 61 s, el bot juega por ella',M.auto(R,0)&&!!M.bot(R,0)]);
 const d=M.bot(R,0);M.act(R,'h',d.m);clock.push(['la jugada del bot no reinicia el reloj',M.auto(R,0)]);
 M.act(R,'h',{t:'back'});clock.push(['al tocar algo, recupera su lugar',!M.auto(R,0)]);
 fake+=40000;clock.push(['desconectada (40 s sin verla), el bot la suple',M.auto(R,0)]);R.players[0].seen=fake;M.act(R,'h',{t:'back'});clock.push(['al regresar, se lo devuelve',!M.auto(R,0)]);
 Date.now=realNow}
// ---- partida estancada: 10 rondas sin que cambien los puntos ----
{const R={players:[0,1,2].map(k=>({tok:'s'+k,id:'s'+k,name:M.botn[k],seen:Date.now(),bot:true})),opts:Object.assign({},M.opts)};M.start(R);const G=R.G;
 while(G.st=='setup'){const d=M.bot(R,G.turn);M.act(R,'s'+G.turn,d.m)}M.act(R,'s'+G.turn,{t:'roll'});const r0=G.phase;G.round+=10;
 let guard=0;while(G.phase=='play'&&guard++<50){let bm=null;R.players.forEach((p,k)=>{const d=M.bot(R,k);if(d&&(!bm||d.ms<bm.ms))bm=Object.assign({k},d)});M.act(R,'s'+bm.k,bm.m)}
 const sc=G.players.map((_,j)=>pts(G,j));clock.push(['estancada 10 rondas: gana el de más puntos',r0=='play'&&G.stall===1&&sc[G.win]===Math.max(...sc)])}
// ---- resultado ----
const avg=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1):'-',mx=a=>a.length?Math.max(...a):'-';
console.log('Haciendas de Yucatán: '+st.games+' partidas de bots, semilla '+SEED+' ('+((Date.now()-t0)/1000).toFixed(1)+' s)');
console.log('  con ganador: '+st.wins+' (por estancamiento: '+st.stall+') · trabadas: '+st.stuck+' · sin ganador (meta inalcanzable): '+st.noWin+' · reglas rotas: '+st.rules);
console.log('  rondas por partida: promedio '+avg(st.turns)+', máximo '+mx(st.turns)+' · jugadas: '+st.acts);
console.log('  ganadas por número de jugadores: '+JSON.stringify(st.byN));
console.log('  ganadas por bot: '+Object.entries(st.bySty).map(([a,b])=>a.replace('🤖 ','')+' '+b).join(', '));
console.log('  huracanes: '+st.sevens+' · descartes: '+st.disc+' · tratos entre jugadores: '+st.trades+' · cambios con banco/puerto: '+st.bank+' · cartas jugadas: '+st.cards);
console.log('  partidas que terminaron con Sacbé real: '+st.lr+' · con Guardia mayor: '+st.ga);
const ne=Object.entries(st.errs);console.log('  jugadas de bot rechazadas: '+(ne.length?ne.map(([e,c])=>c+'× '+e).join(' | '):'0'));
console.log('  reloj y estancamiento: '+clock.map(([t,v])=>(v?'✔ ':'✘ ')+t).join(' · '));
st.fails.forEach(f=>console.log('  ✘ '+f));
const okAll=!st.fails.length&&!st.stuck&&!st.noWin&&st.wins===st.games&&clock.every(c=>c[1]);
console.log(okAll?'TODO BIEN ✔':'HAY PROBLEMAS ✘');process.exit(okAll?0:1);
