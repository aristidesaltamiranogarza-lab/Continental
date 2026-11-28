// Colonos: la isla de 5 recursos con las reglas clásicas. 3–4 jugadores en la Isla, 5–6 en la Isla grande (con fase de construcción entre turnos).
// Datos, tablero y reglas de lugar en colonos_data.js (también lo usa el cliente); los bots en g_colonos_bot.js; pruebas en tests/colonos.js.
// Estados (G.st): setup (poblado + camino, ida y vuelta) · roll (tirar; antes se puede jugar 1 carta) · main (comerciar, construir, terminar).
// Capas: discard (con un 7, descartan todos a la vez) · robber (mover el ladrón) · steal (elegir a quién robar) · roads (caminos gratis) · sbp (construcción entre turnos, 5–6).
// Al acabar robber/steal/roads se vuelve a G.ret. Esquinas: G.vo dueño (-1 libre), G.vt pieza ('p','u'); orillas: G.eo dueño, G.et pieza ('c').
// Deshacer (G.und): construir y cambiar con el banco se pueden deshacer hasta que pase algo al azar (dados, robar carta), un trato o el fin del turno.
// Expansiones: COL.usar({id, vp(G,k), prod(G,h,owed), siete(G), construido(G,k,w,at)}) y escenarios con ex:[id] en colonos_data.js.
const cr=require('crypto'),D=require('./colonos_data.js'),NB=require('./bots_nombres.js'),{COST,PZ,ESC}=D,IDLE_MS=60000,OFF_MS=35000;
// opciones: pts para ganar · fijo tablero de la primera partida (3–4) · hl límite de cartas con el 7 · n lugares en la mesa (los bots llenan)
const OPTS={pts:10,fijo:false,hl:7,n:4},RNG={pts:[6,15],hl:[7,12],n:[3,6]};
const geo=G=>D.geo(G.hx),tot=a=>a.reduce((s,x)=>s+x,0),has=(r,c)=>c.every((x,i)=>r[i]>=x);
const sub=(r,c)=>c.forEach((x,i)=>r[i]-=x),add=(r,c)=>c.forEach((x,i)=>r[i]+=x);
const res5=x=>Array.isArray(x)&&x.length==5&&x.every(v=>Number.isInteger(v)&&v>=0&&v<=99)?x.slice():null;
const isR=x=>Number.isInteger(x)&&x>=0&&x<5;
const lg=(G,k,t,d)=>{(G.log=G.log||[]).push(Object.assign({k,t,n:G.ln=(G.ln||0)+1},d||{}));if(G.log.length>40)G.log.shift()};
// ---- ganchos de expansión: solo corren los módulos que el escenario pide en G.ex ----
const MODS=[];
const hk=(G,nm,...a)=>{let s=0;for(const m of MODS)if(m[nm]&&G.ex.includes(m.id)){const x=m[nm](G,...a);if(typeof x=='number')s+=x}return s};
const vp=(G,k,hid)=>D.vp(G,k,hid)+hk(G,'vp',k);
function start(R){const o=Object.assign({},OPTS,R.opts),want=Math.max(R.players.length,Math.min(6,Math.max(3,o.n|0)));
 for(const nm of NB.BOTN){if(R.players.length>=want)break;if(R.players.some(p=>p.name==nm))continue;
  R.players.push({tok:cr.randomBytes(12).toString('hex'),id:cr.randomBytes(4).toString('hex'),name:nm,av:NB.avDe(nm),seen:Date.now(),bot:true})}
 const n=R.players.length,esc=ESC[o.esc]&&n>=ESC[o.esc].jug[0]&&n<=ESC[o.esc].jug[1]?o.esc:n>4?'grande':'base',S=ESC[esc];
 const b=D.board(esc,o.fijo,Math.random),g=D.geo(b.hx),t0=Math.random()*n|0,sq=[];
 for(let i=0;i<n;i++)sq.push((t0+i)%n);for(let i=n-1;i>=0;i--)sq.push((t0+i)%n);
 R.G={phase:'play',esc,ex:(S.ex||[]).slice(),sbp:!!S.sbp,round:0,tc:0,turn:t0,first:t0,players:R.players.map(p=>({id:p.id,name:p.name})),o,
  hx:b.hx,ports:b.ports,rob:b.rob,vo:Array(g.V.length).fill(-1),vt:Array(g.V.length).fill(''),eo:Array(g.E.length).fill(-1),et:Array(g.E.length).fill(''),
  res:R.players.map(()=>[0,0,0,0,0]),bank:Array(5).fill(S.banco),dev:R.players.map(()=>[]),kn:Array(n).fill(0),used:R.players.map(()=>[]),
  deck:D.shuf(D.mazo(esc)),out:Array(n).fill(0),st:'setup',sq,si:0,sv:-1,dice:[0,0],played:false,dis:null,cand:null,ret:null,free:0,
  offers:[],oid:0,sb:null,got:null,sl:null,lr:-1,ll:Array(n).fill(0),ga:-1,win:-1,und:[],ac:0,
  stats:{prod:Array(n).fill(0),tr:Array(n).fill(0),bk:Array(n).fill(0),rob:Array(n).fill(0),lost:Array(n).fill(0),dice:Array(13).fill(0)}};
 R.hz={nd:{},ato:{},need:[]};lg(R.G,t0,'empieza');arm(R)}
// ---- deshacer: foto del estado antes de construir o cambiar con el banco ----
const SNAP=['vo','vt','eo','et','res','bank','lr','ll','st','sv','si','free','ret','sb','phase','win','got','xp'];
const foto=(G,k)=>{const f={k};SNAP.forEach(x=>{if(G[x]!==undefined)f[x]=JSON.parse(JSON.stringify(G[x]))});G.und.push(f);if(G.und.length>20)G.und.shift()};
const sinDeshacer=G=>{G.und=[]};
// ---- medallas y victoria ----
function updLR(G){G.ll=G.players.map((_,k)=>D.roadLen(G,k));const h=G.lr,mx=Math.max(...G.ll);
 if(h>=0&&G.ll[h]>=5&&G.ll[h]===mx)return;   // quien la tiene la conserva si sigue empatado arriba
 const top=G.ll.map((l,k)=>l===mx?k:-1).filter(k=>k>=0);G.lr=mx>=5&&top.length==1?top[0]:-1;if(G.lr!==h&&G.lr>=0)lg(G,G.lr,'ruta')}
function updGA(G,k){if(G.kn[k]>=3&&G.ga!==k&&(G.ga<0||G.kn[k]>G.kn[G.ga])){G.ga=k;lg(G,k,'ejercito')}}
function chkWin(G){if(G.phase!='play'||G.st=='setup'||G.st=='sbp')return;const k=G.turn;
 if(vp(G,k,true)>=G.o.pts){G.phase='final';G.win=k;sinDeshacer(G);lg(G,k,'gana')}}
// ---- inicio en serpiente: poblado y camino; el segundo poblado cobra una carta de cada terreno que toca ----
function advSetup(G){G.sv=-1;G.tc++;sinDeshacer(G);while(G.si<G.sq.length&&G.out[G.sq[G.si]])G.si++;
 if(G.si>=G.sq.length){G.turn=G.first;while(G.out[G.turn])G.turn=(G.turn+1)%G.players.length;G.st='roll';G.round=1;return}G.turn=G.sq[G.si]}
function setup(G,i,m){if(m.t!='build')return 'Primero pon tu poblado y tu camino.';const g=geo(G);
 if(G.sv<0){if(m.w!='p'||!D.okV(G,i,m.at,true))return 'Ahí no se puede poner un poblado.';foto(G,i);
  G.vo[m.at]=i;G.vt[m.at]='p';G.sv=m.at;lg(G,i,'pone',{w:'p',at:m.at});
  if(G.si>=G.players.length){const got=[0,0,0,0,0];g.V[m.at].h.forEach(h=>{const t=G.hx[h].t;if(D.prod(t)&&G.bank[t]>0){got[t]++;G.bank[t]--}});add(G.res[i],got);G.got={[i]:got}}
  return}
 if(m.w!='c'||!D.okE(G,i,m.at,G.sv))return 'El camino tiene que salir de tu poblado nuevo.';
 G.eo[m.at]=i;G.et[m.at]='c';lg(G,i,'pone',{w:'c',at:m.at});updLR(G);G.si++;advSetup(G)}
// ---- dados y cosecha (si el banco no alcanza para todos un recurso, nadie lo cobra, salvo que solo lo deba a uno) ----
function produce(G,s){const g=geo(G),owed=G.players.map(()=>[0,0,0,0,0]);
 G.hx.forEach((x,h)=>{if(x.n!==s||h===G.rob||!D.prod(x.t))return;g.H[h].v.forEach(v=>{const o=G.vo[v];if(o>=0&&!G.out[o])owed[o][x.t]+=G.vt[v]=='u'?2:1})});
 hk(G,'prod',s,owed);const got={};
 for(let r=0;r<5;r++){const need=owed.reduce((a,o)=>a+o[r],0);if(!need)continue;const who=owed.map((o,k)=>o[r]?k:-1).filter(k=>k>=0);
  if(need>G.bank[r]&&who.length>1){owed.forEach(o=>o[r]=0);continue}owed.forEach(o=>{o[r]=Math.min(o[r],G.bank[r])})}
 owed.forEach((o,k)=>{const n=tot(o);if(!n)return;add(G.res[k],o);sub(G.bank,o);got[k]=o;G.stats.prod[k]+=n});G.got=got}
function roll(G,k){const a=1+Math.random()*6|0,b=1+Math.random()*6|0,s=a+b;G.dice=[a,b];G.stats.dice[s]++;sinDeshacer(G);G.got=null;lg(G,k,'tira',{s});
 if(s!==7){produce(G,s);G.st='main';return}
 hk(G,'siete');G.ret='main';const dis={};G.res.forEach((r,j)=>{const n=tot(r);if(n>G.o.hl&&!G.out[j])dis[j]=Math.floor(n/2)});
 if(Object.keys(dis).length){G.dis=dis;G.st='discard'}else G.st='robber'}
function steal(G,a,b){const r=G.res[b],n=tot(r);if(!n)return;let x=Math.random()*n|0,i=0;while(x>=r[i]){x-=r[i];i++}
 r[i]--;G.res[a][i]++;G.sl={a,b,r:i,n:G.ln+1};G.stats.rob[a]++;G.stats.lost[b]++;sinDeshacer(G);lg(G,a,'roba',{v:b})}
function moveR(G,i,h){if(!Number.isInteger(h)||!G.hx[h]||!D.land(G.hx[h].t))return 'Elige un hexágono de la isla.';if(h===G.rob)return 'El ladrón tiene que cambiar de lugar.';
 G.rob=h;lg(G,i,'ladron',{h});const c=[...new Set(geo(G).H[h].v.map(v=>G.vo[v]).filter(o=>o>=0&&o!==i&&!G.out[o]&&tot(G.res[o])>0))];
 if(!c.length)return back(G);if(c.length==1){steal(G,i,c[0]);return back(G)}G.cand=c;G.st='steal'}
function back(G){G.st=G.ret||'main';G.ret=null;G.cand=null;G.free=0}
// ---- cartas de desarrollo: una por turno, nunca la comprada en este turno; se pueden jugar antes de tirar ----
function buy(G,i){if(G.st!='main'&&G.st!='sbp')return 'Ahora no puedes comprar cartas.';if(!G.deck.length)return 'Ya no quedan cartas.';
 if(!has(G.res[i],COST.d))return 'Te falta para la carta.';sub(G.res[i],COST.d);add(G.bank,COST.d);G.dev[i].push({c:G.deck.pop(),t:G.tc});sinDeshacer(G);lg(G,i,'compra')}
function play(G,i,m){if(G.st!='roll'&&G.st!='main')return 'Ahora no puedes jugar cartas.';if(G.played)return 'Ya jugaste una carta en este turno.';
 const c=m.c,j=G.dev[i].findIndex(x=>x.c===c&&x.t!==G.tc);if(c=='v'||!D.DEV[c])return 'Esa carta no se juega.';if(j<0)return 'No tienes esa carta (o la compraste en este turno).';
 if(c=='c'){const n=Math.min(2,D.left(G,i).c);if(!n||!D.spots(G,i,'c').length)return 'No tienes dónde poner caminos.'}
 if(c=='a'){if(!Array.isArray(m.r)||m.r.length!=2||!m.r.every(isR))return 'Elige dos recursos.';const need=[0,0,0,0,0];m.r.forEach(r=>need[r]++);if(!has(G.bank,need))return 'El banco no tiene esos recursos.'}
 if(c=='m'&&!isR(m.r))return 'Elige un recurso.';
 G.dev[i].splice(j,1);G.used[i].push(c);G.played=true;sinDeshacer(G);lg(G,i,'juega',{c});
 if(c=='k'){G.kn[i]++;updGA(G,i);G.ret=G.st;G.st='robber';return}
 if(c=='c'){G.ret=G.st;G.free=Math.min(2,D.left(G,i).c);G.st='roads';return}
 if(c=='a'){m.r.forEach(r=>{G.bank[r]--;G.res[i][r]++});return}
 if(c=='m'){let n=0;G.res.forEach((r,k)=>{if(k!==i){n+=r[m.r];r[m.r]=0}});G.res[i][m.r]+=n;G.mono={k:i,r:m.r,n};return}}
// ---- construir ----
function build(G,i,m){const w=m.w,P=PZ[w],free=G.st=='roads';if(!P)return 'Esa pieza no existe.';
 if(free&&w!='c')return 'Ahora solo puedes poner caminos.';if(G.st!='main'&&G.st!='sbp'&&!free)return 'Ahora no puedes construir.';
 if(!(D.left(G,i)[w]>0))return 'Ya no te quedan '+P.nm+'s.';if(!D.spots(G,i,w).includes(m.at))return 'Ahí no se puede.';
 if(!free&&!has(G.res[i],COST[w]))return 'Te falta para '+({c:'el camino',p:'el poblado',u:'la ciudad'}[w]||P.nm)+'.';
 foto(G,i);if(!free){sub(G.res[i],COST[w]);add(G.bank,COST[w])}
 if(P.en=='o'){G.eo[m.at]=i;G.et[m.at]=w}else{G.vo[m.at]=i;G.vt[m.at]=w}lg(G,i,'pone',{w,at:m.at});
 if(w!='u')updLR(G);hk(G,'construido',i,w,m.at);
 if(free&&(--G.free<=0||!D.spots(G,i,'c').length))back(G)}
// ---- comercio: con el banco (4:1, puertos 3:1 y 2:1) y entre jugadores, siempre con quien tiene el turno ----
function bank(G,i,m){if(G.st!='main')return 'Solo en tu turno, después de tirar.';if(!isR(m.give)||!isR(m.get)||m.give===m.get)return 'Elige qué das y qué quieres.';
 const k=D.rate(G,i,m.give);if(G.res[i][m.give]<k)return 'Necesitas '+k+' de '+D.RES[m.give]+'.';if(G.bank[m.get]<1)return 'El banco no tiene '+D.RES[m.get]+'.';
 foto(G,i);G.res[i][m.give]-=k;G.bank[m.give]+=k;G.res[i][m.get]++;G.bank[m.get]--;G.stats.bk[i]++;lg(G,i,'banco',{give:m.give,get:m.get,k})}
function swap(G,o,a,b){sub(G.res[a],o.give);add(G.res[b],o.give);sub(G.res[b],o.want);add(G.res[a],o.want);G.stats.tr[a]++;G.stats.tr[b]++;sinDeshacer(G);
 G.offers=G.offers.filter(x=>x!==o);lg(G,a,'trato',{v:b,give:o.give,want:o.want})}
function trade(G,i,t,m){if(G.st!='main')return 'Solo se comercia en el turno de alguien, después de tirar.';const T=G.turn;
 if(t=='offer'){const give=res5(m.give),want=res5(m.want);if(!give||!want||!tot(give)||!tot(want))return 'Pon qué das y qué quieres.';
  if(give.some((x,r)=>x&&want[r]))return 'No puedes dar y pedir lo mismo.';if(!has(G.res[i],give))return 'No tienes esas cartas.';
  const to=i===T?(Number.isInteger(m.to)&&m.to>=0&&m.to!==T&&G.players[m.to]&&!G.out[m.to]?m.to:-1):T;
  if(G.offers.filter(o=>o.from===i).length>=3)return 'Ya tienes muchas ofertas abiertas.';
  G.offers.push({id:++G.oid,from:i,to,give,want,si:[],no:[],at:Date.now()});return}
 const o=G.offers.find(x=>x.id===m.id);if(!o)return 'Esa oferta ya no está.';
 if(t=='cancel'){if(o.from!==i)return 'Esa oferta no es tuya.';G.offers=G.offers.filter(x=>x!==o);return}
 if(t=='reject'){if(o.from===i)return 'Es tu oferta.';if(o.from===T?(o.to>=0&&o.to!==i):i!==T)return 'Esa oferta no es para ti.';
  if(o.from!==T){G.offers=G.offers.filter(x=>x!==o);return}if(!o.no.includes(i))o.no.push(i);o.si=o.si.filter(x=>x!==i);return}
 if(t=='accept'){if(o.from===i)return 'Es tu oferta.';
  if(o.from!==T){if(i!==T)return 'Esa oferta no es para ti.';if(!has(G.res[o.from],o.give)||!has(G.res[T],o.want))return 'Ya no les alcanzan las cartas.';swap(G,o,o.from,T);return}
  if(o.to>=0&&o.to!==i)return 'Esa oferta no es para ti.';if(!has(G.res[i],o.want))return 'No tienes lo que pide.';
  if(!o.si.includes(i))o.si.push(i);o.no=o.no.filter(x=>x!==i);return}
 if(t=='close'){if(o.from!==i||i!==T)return 'Esa oferta no es tuya.';if(!o.si.includes(m.k))return 'Esa persona no aceptó.';
  if(!has(G.res[i],o.give)||!has(G.res[m.k],o.want))return 'Ya no les alcanzan las cartas.';swap(G,o,i,m.k);return}}
// ---- fin de turno; con 5–6, antes pasa la fase de construcción de los demás (solo quien puede pagar algo) ----
const puede=(G,k)=>['c','p','u'].some(w=>has(G.res[k],COST[w])&&D.spots(G,k,w).length)||(G.deck.length&&has(G.res[k],COST.d));
function endTurn(G){sinDeshacer(G);G.offers=[];G.got=null;
 if(G.sbp&&G.st!='sbp'){const n=G.players.length,q=[];for(let d=1;d<n;d++){const k=(G.turn+d)%n;if(!G.out[k]&&puede(G,k))q.push(k)}
  if(q.length){G.st='sbp';G.sb=q;return}}
 nextTurn(G)}
function nextSb(G){G.sb.shift();sinDeshacer(G);while(G.sb.length&&(G.out[G.sb[0]]||!puede(G,G.sb[0])))G.sb.shift();if(!G.sb.length){G.sb=null;nextTurn(G)}}
function nextTurn(G){const n=G.players.length,pos=t=>(t-G.first+n)%n;let t=G.turn;do t=(t+1)%n;while(G.out[t]&&t!==G.turn);
 if(pos(t)<=pos(G.turn))G.round++;G.turn=t;G.tc++;G.st='roll';G.played=false;G.offers=[];G.cand=null;G.dis=null;G.free=0;G.ret=null;G.sb=null;G.ac=0;G.mono=null}
// quién actúa: en la fase de construcción, el primero de la fila; si no, quien tiene el turno
const actor=G=>G.st=='sbp'?G.sb[0]:G.turn;
// ---- acciones ----
function act(R,tok,m){const G=R.G,i=R.players.findIndex(p=>p.tok==tok);if(!m||typeof m!='object')return 'Acción inválida.';const t=m.t;
 if(G.phase!='play')return 'La partida terminó.';if(i<0||G.out[i])return 'Ya no estás jugando.';
 if(!m.ab&&!R.players[i].bot)awake(R,i);   // ab: jugada del bot que suple a una persona
 if(t=='back'){arm(R);return}
 const e=inner(G,i,t,m);if(!e){if(i===actor(G))G.ac++;chkWin(G);arm(R)}return e}
function inner(G,i,t,m){
 if(t=='discard'){if(G.st!='discard'||G.dis[i]==null)return 'No tienes que descartar.';const r=res5(m.r);
  if(!r||tot(r)!==G.dis[i])return 'Tienes que descartar '+G.dis[i]+' cartas.';if(!has(G.res[i],r))return 'No tienes esas cartas.';
  sub(G.res[i],r);add(G.bank,r);delete G.dis[i];lg(G,i,'descarta',{n:tot(r)});if(!Object.keys(G.dis).length){G.dis=null;G.st='robber'}return}
 if(t=='offer'||t=='accept'||t=='reject'||t=='close'||t=='cancel')return trade(G,i,t,m);
 if(G.st=='discard')return 'Esperando a que todos descarten.';
 if(actor(G)!==i)return 'No es tu turno.';
 if(t=='undo'){const f=G.und[G.und.length-1];if(!f||f.k!==i)return 'No hay nada que deshacer.';G.und.pop();SNAP.forEach(x=>{if(x in f)G[x]=f[x]});lg(G,i,'deshace');return}
 if(G.st=='setup')return setup(G,i,m);
 if(t=='roll'){if(G.st!='roll')return 'Ya tiraste.';roll(G,i);return}
 if(t=='robber'){if(G.st!='robber')return 'Ahora no toca mover el ladrón.';return moveR(G,i,m.h)}
 if(t=='steal'){if(G.st!='steal')return 'Ahora no toca robar.';if(!G.cand.includes(m.v))return 'A ese jugador no le puedes robar.';steal(G,i,m.v);back(G);return}
 if(t=='play')return play(G,i,m);
 if(t=='buy')return buy(G,i);
 if(t=='build')return build(G,i,m);
 if(t=='bank')return bank(G,i,m);
 if(t=='skip'){if(G.st!='roads')return 'No hay caminos pendientes.';sinDeshacer(G);back(G);return}
 if(t=='end'){if(G.st=='sbp'){nextSb(G);return}if(G.st!='main')return G.st=='roll'?'Primero tira los dados.':'Termina primero lo que estás haciendo.';endTurn(G);return}
 return 'Esa acción no existe.'}
// quién tiene que actuar ahora (los demás solo pueden responder ofertas)
function needers(G){if(G.phase!='play')return [];if(G.st=='discard')return Object.keys(G.dis).map(Number);return [actor(G)]}
// ---- reloj: si quien debe actuar pasa IDLE_MS sin hacer nada (o se desconecta), un bot actúa por él. server.js pregunta auto(R,k) ----
const hz=R=>R.hz||(R.hz={nd:{},ato:{},need:[]});
function awake(R,k){const H=hz(R);H.nd[k]=Date.now();delete H.ato[k]}
function auto(R,k){const G=R.G,p=R.players[k];if(!G||G.phase!='play'||!p||p.out||G.out[k])return false;if(p.bot)return true;
 const now=Date.now(),H=hz(R);if(now-p.seen>OFF_MS)return true;if(H.ato[k]===G.tc)return true;   // el bot juega hasta que cambie el turno
 if(needers(G).includes(k)&&now-(H.nd[k]||now)>=IDLE_MS){H.ato[k]=G.tc;return true}return false}
function arm(R){const G=R.G,H=hz(R),now=Date.now(),nd=needers(G).filter(k=>!R.players[k].bot);clearTimeout(H.t);
 nd.forEach(k=>{if(!H.need.includes(k))H.nd[k]=now});H.need=nd;if(!nd.length||!R.poke)return;
 const at=Math.min(...nd.map(k=>H.nd[k]))+IDLE_MS;H.t=setTimeout(()=>{if(R.G===G&&R.poke)R.poke()},Math.max(0,at-now)+50);if(H.t.unref)H.t.unref()}
function tick(R){const G=R.G;if(!G||G.phase!='play')return;if(!R.bt&&R.poke&&needers(G).some(k=>!R.players[k].bot&&auto(R,k)))R.poke()}
function kick(R,k){const G=R.G;if(!G||G.phase!='play'||G.out[k])return;G.out[k]=1;lg(G,k,'sale');
 G.offers=G.offers.filter(o=>o.from!==k&&o.to!==k);
 if(G.dis&&G.dis[k]!=null){delete G.dis[k];if(!Object.keys(G.dis).length){G.dis=null;G.st='robber'}}
 const L=G.players.map((_,j)=>j).filter(j=>!G.out[j]);if(L.length==1){G.phase='final';G.win=L[0];lg(G,L[0],'gana');return}
 if(G.st=='sbp'){if(G.sb[0]===k)nextSb(G);else G.sb=G.sb.filter(x=>x!==k)}
 else if(G.turn===k){sinDeshacer(G);if(G.st=='setup'){if(G.sv>=0){G.vo[G.sv]=-1;G.vt[G.sv]=''}G.si++;advSetup(G)}else nextTurn(G)}
 chkWin(G);arm(R)}
// ---- vista: cada quien ve sus cartas; de los demás solo cuántas tiene. Al terminar se ve todo ----
function view(R,tok,me,now){const G=R.G,fin=G.phase!='play',v=Object.assign({},G);
 v.res=G.res.map((r,k)=>k===me||fin?r:null);v.nres=G.res.map(tot);v.dev=G.dev.map((d,k)=>k===me||fin?d:null);v.ndev=G.dev.map(d=>d.length);
 v.deck=G.deck.length;v.vp=G.players.map((_,k)=>vp(G,k,k===me||fin));v.left=G.players.map((_,k)=>D.left(G,k));
 v.auto=R.players.map((p,k)=>!p.bot&&auto(R,k));v.actor=actor(G);if(me>=0&&!fin)v.rates=[0,1,2,3,4].map(r=>D.rate(G,me,r));
 v.undo=!!(G.und.length&&G.und[G.und.length-1].k===me);delete v.und;delete v.sq;
 if(G.sl&&me!==G.sl.a&&me!==G.sl.b&&!fin){v.sl=Object.assign({},G.sl);delete v.sl.r}return {G:v,claim:false,pend:false}}
const usar=m=>{if(!MODS.some(x=>x.id===m.id))MODS.push(m)};
const X={D,geo,tot,has,vp,needers,actor,puede};
const B=require('./g_colonos_bot.js')(X);
module.exports={id:'colonos',name:'Colonos',min:1,max:6,opts:OPTS,rng:RNG,start,view,act,kick,tick,auto,bot:B.bot,botn:B.botn,usar,_:X};
