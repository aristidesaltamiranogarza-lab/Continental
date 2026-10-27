// Haciendas de Yucatán: juego original de colonizar y comerciar en hexágonos. 3 a 6 jugadores (5–6 con el tablero de 30), con bots.
// Tablero, puertos y cartas en haciendas_data.js; los bots en g_haciendas_bot.js.
// Estados del turno (G.st): setup (rancho + sacbé, ida y vuelta) · roll (tirar; antes puede jugar 1 carta) · main (comerciar, construir, terminar).
// Capas que interrumpen: discard (huracán: descartan todos a la vez) · move (mover el huracán) · steal (elegir a quién robar) · road (sacbés gratis de Fajina).
// Al acabar move/steal/road se vuelve a G.ret. Edificios: G.vo dueño de cada esquina (-1 libre), G.vl 1 rancho · 2 hacienda; G.eo dueño de cada orilla.
const D=require('./haciendas_data.js'),{COST,RES:RN}=D,IDLE_MS=60000,OFF_MS=35000,STALL=10;
// opciones: pts puntos para ganar · fijo tablero fijo · hl límite de cartas del huracán (descartan con más) · vel velocidad de bots (1 lenta, 3 rápida)
const OPTS={pts:10,fijo:false,hl:7,vel:2},RNG={pts:[8,14],hl:[5,12],vel:[1,3]};
const geo=G=>D.geo(G.bn),tot=a=>a.reduce((s,x)=>s+x,0),has=(r,c)=>c.every((x,i)=>r[i]>=x);
const sub=(r,c)=>c.forEach((x,i)=>r[i]-=x),add=(r,c)=>c.forEach((x,i)=>r[i]+=x),other=(E,v)=>E.v[0]===v?E.v[1]:E.v[0];
const txt=a=>a.map((x,i)=>x?x+' '+RN[i]:'').filter(Boolean).join(', ')||'nada',pn=(G,k)=>G.players[k].name;
const hn=(G,h)=>{const x=G.hx[h];return x.t>4?'el cenote':D.TER[x.t]+' '+x.n};
const res5=x=>Array.isArray(x)&&x.length==5&&x.every(v=>Number.isInteger(v)&&v>=0&&v<=999)?x.slice():null;
const isR=x=>Number.isInteger(x)&&x>=0&&x<5,PNM={s:'sacbés',r:'ranchos',h:'haciendas'};
const lg=(G,k,t)=>{(G.log=G.log||[]).push({k,t,n:G.ln=(G.ln||0)+1});if(G.log.length>40)G.log.shift()};
function shuf(a){return D.shuf(a,Math.random)}
function start(R){const o=Object.assign({},OPTS,R.opts),n=R.players.length,b=D.board(n>4?30:19,o.fijo),g=D.geo(b.n),t0=Math.random()*n|0,sq=[];
 for(let i=0;i<n;i++)sq.push((t0+i)%n);for(let i=n-1;i>=0;i--)sq.push((t0+i)%n);
 R.G={phase:'play',round:0,tc:0,turn:t0,first:t0,players:R.players.map(p=>({id:p.id,name:p.name})),o,bn:b.n,hx:b.hx,ports:b.ports,hur:b.hur,
  vo:Array(g.V.length).fill(-1),vl:Array(g.V.length).fill(0),eo:Array(g.E.length).fill(-1),out:Array(n).fill(0),
  res:R.players.map(()=>[0,0,0,0,0]),dev:R.players.map(()=>[]),gu:Array(n).fill(0),pl:Array(n).fill(0),deck:shuf(D.deck()),
  st:'setup',sq,si:0,sv:-1,dice:[0,0],rn:0,played:false,dis:null,cand:null,ret:null,free:0,offers:[],oc:0,ac:0,
  lr:-1,ll:Array(n).fill(0),ga:-1,prot:[],win:-1};
 R.hz={nd:{},ato:{},need:[]};lg(R.G,t0,'empieza la partida: cada quien pone rancho y sacbé');arm(R)}
// ---- piezas, lugares válidos, puertos y puntos ----
const {left,okV,okE,spots,rate}=D;
// puntos: rancho 1, hacienda 2, Sacbé real 2, Guardia mayor 2; hid suma los puntos ocultos
function vp(G,k,hid){let p=0;G.vo.forEach((o,v)=>{if(o===k)p+=G.vl[v]});if(G.lr===k)p+=2;if(G.ga===k)p+=2;
 if(hid)p+=G.dev[k].filter(c=>c.id[0]=='p').length;return p}
// ---- Sacbé real: camino continuo más largo (cada orilla una vez); no se pasa por una esquina con edificio rival ----
function roadLen(G,k){const g=geo(G),used=new Set(),vs=new Set();let best=0;
 G.eo.forEach((o,e)=>{if(o===k)g.E[e].v.forEach(v=>vs.add(v))});
 const dfs=(v,len)=>{if(len>best)best=len;if(len&&G.vo[v]>=0&&G.vo[v]!==k)return;
  for(const e of g.V[v].e){if(G.eo[e]!==k||used.has(e))continue;used.add(e);dfs(other(g.E[e],v),len+1);used.delete(e)}};
 vs.forEach(v=>dfs(v,0));return best}
// si te igualan lo conservas; si lo pierdes y hay empate arriba, no es de nadie
function updLR(G){G.ll=G.players.map((_,k)=>roadLen(G,k));const h=G.lr,mx=Math.max(...G.ll);let nw;
 if(h>=0&&G.ll[h]>=5&&G.ll[h]>=mx)nw=h;else if(mx<5)nw=-1;else{const c=G.ll.map((l,k)=>l===mx?k:-1).filter(k=>k>=0);nw=c.length==1?c[0]:-1}
 if(nw!==h){G.lr=nw;if(nw>=0)lg(G,nw,'se queda con el Sacbé real ('+G.ll[nw]+' tramos)');else lg(G,h,'pierde el Sacbé real')}}
function updGA(G,k){if(G.gu[k]>=3&&G.ga!==k&&(G.ga<0||G.gu[k]>G.gu[G.ga])){G.ga=k;lg(G,k,'se queda con la Guardia mayor ('+G.gu[k]+' guardias)')}}
// si pasan STALL rondas sin que cambien los puntos de nadie, gana quien tenga más (en empate, quien llegó antes a ese puntaje)
function chkWin(G){const k=G.turn;if(G.phase!='play'||G.st=='setup')return;const s=G.players.map((_,j)=>vp(G,j,true));
 if(!G.ps||s.some((x,j)=>x!==G.ps[j])){G.pat=s.map((x,j)=>G.ps&&x===G.ps[j]?G.pat[j]:G.ln);G.ps=s;G.lpc=G.round}
 const fin=(w,t)=>{G.phase='final';G.win=w;G.offers=[];G.dis=null;lg(G,w,t)};
 if(!G.out[k]&&s[k]>=G.o.pts)return fin(k,'¡gana la partida con '+s[k]+' puntos!');
 if(G.round-G.lpc>=STALL){const w=G.players.map((_,j)=>j).filter(j=>!G.out[j]).sort((a,b)=>s[b]-s[a]||G.pat[a]-G.pat[b])[0];G.stall=1;
  fin(w,'nadie sumó puntos en '+STALL+' rondas: gana con '+s[w]+' puntos')}}
// ---- inicio: ida y vuelta; la segunda colocación da 1 recurso por hexágono vecino ----
function advSetup(G){G.sv=-1;G.tc++;while(G.si<G.sq.length&&G.out[G.sq[G.si]])G.si++;
 if(G.si<G.sq.length){G.turn=G.sq[G.si];return}
 G.st='roll';G.round=1;G.turn=G.first;if(G.out[G.turn])nextTurn(G);lg(G,G.turn,'empieza el primer turno')}
function setup(G,i,m){if(m.t!='build')return 'Primero pon tu rancho y tu sacbé.';const g=geo(G);
 if(G.sv<0){if(m.w!='r')return 'Primero pon tu rancho.';const v=m.v;if(!Number.isInteger(v)||!okV(G,i,v,true))return 'Ahí no se puede: entre dos ranchos debe haber al menos una orilla.';
  G.vo[v]=i;G.vl[v]=1;G.sv=v;lg(G,i,'pone su rancho');
  if(G.si>=G.players.length){const r=[0,0,0,0,0];g.V[v].h.forEach(h=>{if(G.hx[h].t<5)r[G.hx[h].t]++});add(G.res[i],r);if(tot(r))lg(G,i,'recibe '+txt(r))}return}
 if(m.w!='s')return 'Ahora pon un sacbé junto a tu rancho.';const e=m.e;if(!Number.isInteger(e)||!okE(G,i,e,G.sv))return 'El sacbé tiene que salir de tu rancho nuevo.';
 G.eo[e]=i;updLR(G);G.si++;advSetup(G)}
// ---- tirar, producir y huracán ----
function produce(G,n){const g=geo(G),got=G.players.map(()=>[0,0,0,0,0]);
 G.hx.forEach((h,i)=>{if(h.n!==n||i===G.hur)return;g.H[i].v.forEach(v=>{if(G.vo[v]>=0)got[G.vo[v]][h.t]+=G.vl[v]})});
 got.forEach((a,k)=>{if(tot(a)){add(G.res[k],a);lg(G,k,'recibe '+txt(a))}});G.prod={rn:G.rn,got}}
function roll(G,k){const a=1+Math.random()*6|0,b=1+Math.random()*6|0,s=a+b;G.dice=[a,b];G.rn++;lg(G,k,'tiró '+a+' y '+b+' ('+s+')');
 if(s!==7){produce(G,s);G.st='main';return}
 const dis={};G.res.forEach((r,j)=>{const t=tot(r);if(!G.out[j]&&t>G.o.hl)dis[j]=Math.floor(t/2)});
 lg(G,k,'¡Huracán!'+(Object.keys(dis).length?' Los que tienen más de '+G.o.hl+' cartas descartan la mitad':''));
 G.ret='main';if(Object.keys(dis).length){G.dis=dis;G.st='discard'}else G.st='move'}
const back=G=>{G.st=G.ret||'main';G.ret=null};
function steal(G,a,b){const r=G.res[b],n=tot(r);if(!n)return;let x=Math.random()*n|0,j=0;while(x>=r[j]){x-=r[j];j++}
 r[j]--;G.res[a][j]++;G.sl={a,b,r:j,n:(G.sln=(G.sln||0)+1)};lg(G,a,'le roba una carta a '+pn(G,b))}
function moveH(G,i,h){const g=geo(G);if(!Number.isInteger(h)||!g.H[h])return 'Ese lugar no existe.';if(h===G.hur)return 'El huracán tiene que irse a otro lugar.';
 if(G.prot.some(p=>p.h===h))return 'Ese lugar está protegido por la Guardia maya.';G.hur=h;lg(G,i,'manda el huracán a '+hn(G,h));
 const c=[...new Set(g.H[h].v.map(v=>G.vo[v]).filter(o=>o>=0&&o!==i&&tot(G.res[o])>0))];
 if(c.length>1){G.cand=c;G.st='steal';return}if(c.length)steal(G,i,c[0]);back(G)}
// ---- cartas de desarrollo: 1 por turno, antes o después de tirar; las compradas este turno esperan ----
function dev(G,i,m){if(G.st!='roll'&&G.st!='main')return 'Ahora no puedes jugar cartas.';if(G.played)return 'Solo puedes jugar una carta por turno.';
 const c=String(m.c||''),h=G.dev[i],j=h.findIndex(x=>x.id===c&&x.tc<G.tc),g=geo(G);
 if(c.length!==1||!'gfcm'.includes(c))return 'Esa carta no se juega.';
 if(j<0)return h.some(x=>x.id===c)?'Las cartas que compras no se juegan en el mismo turno.':'No tienes esa carta.';
 const nm=D.DEV[c].nm;
 if(c=='g'){if(m.h!=null){const x=m.h;if(!Number.isInteger(x)||!g.H[x])return 'Ese lugar no existe.';if(x===G.hur)return 'Ahí está el huracán.';
   if(!g.H[x].v.some(v=>G.vo[v]===i))return 'Solo puedes proteger un lugar donde tengas construcciones.';
   G.prot=G.prot.filter(p=>p.h!==x);G.prot.push({h:x,k:i});lg(G,i,'juega '+nm+': protege '+hn(G,x)+' una ronda')}
  else{G.ret=G.st;G.st='move';lg(G,i,'juega '+nm+': va a mover el huracán')}
  G.gu[i]++;updGA(G,i)}
 if(c=='f'){const lf=left(G,i).s;if(!lf)return 'Ya no te quedan sacbés.';if(!spots(G,i,'s').length)return 'No hay dónde poner un sacbé.';
  if(m.r!=null){if(!isR(m.r))return 'Elige un recurso.';G.res[i][m.r]++;G.free=1;lg(G,i,'juega '+nm+': 1 '+RN[m.r]+' y un sacbé gratis')}
  else{G.free=Math.min(2,lf);lg(G,i,'juega '+nm+': '+G.free+' sacbés gratis')}G.ret=G.st;G.st='road'}
 if(c=='c'){const r=m.r;if(!Array.isArray(r)||r.length!==2||!r.every(isR))return 'Elige dos recursos.';r.forEach(x=>G.res[i][x]++);lg(G,i,'juega '+nm+': toma '+RN[r[0]]+' y '+RN[r[1]])}
 if(c=='m'){const r=m.r;if(!isR(r))return 'Elige un recurso.';let n=0;
  G.res.forEach((x,o)=>{if(o===i)return;const t=Math.min(2,x[r]);x[r]-=t;n+=t});G.res[i][r]+=n;lg(G,i,'juega '+nm+': pide '+RN[r]+' y junta '+n)}
 h.splice(j,1);G.played=true;G.pl[i]++}
// ---- construir: s sacbé · r rancho · h hacienda · c carta ----
function build(G,i,m){const w=m.w,road=G.st=='road',lf=left(G,i);
 if(road&&w!=='s')return 'Primero pon tus sacbés gratis (o sáltalos).';
 if(!road&&G.st!='main')return G.st=='roll'?'Primero tira los dados.':'Termina primero lo que estás haciendo.';
 if(!COST[w])return 'Eso no se construye.';
 const miss=COST[w].map((x,j)=>Math.max(0,x-G.res[i][j]));if(!road&&tot(miss))return 'Te falta: '+txt(miss)+'.';
 if(w=='c'){if(!G.deck.length)return 'Ya no quedan cartas.';sub(G.res[i],COST.c);G.dev[i].push({id:G.deck.pop(),tc:G.tc});lg(G,i,'compra una carta de desarrollo');return}
 if(lf[w]<=0)return 'Ya no te quedan '+PNM[w]+'.';const x=w=='s'?m.e:m.v;if(!Number.isInteger(x))return 'Elige dónde.';
 if(w=='s'&&!okE(G,i,x))return G.eo[x]>=0?'Ya hay un sacbé ahí.':'El sacbé tiene que conectar con tu red.';
 if(w=='r'&&!okV(G,i,x))return 'Ahí no se puede: necesita un sacbé tuyo y una orilla de separación con otros ranchos.';
 if(w=='h'&&!(G.vo[x]===i&&G.vl[x]==1))return 'La hacienda va sobre uno de tus ranchos.';
 if(!road)sub(G.res[i],COST[w]);
 if(w=='s'){G.eo[x]=i;lg(G,i,road?'pone un sacbé gratis':'construye un sacbé');updLR(G);if(road&&(--G.free<=0||!spots(G,i,'s').length)){G.free=0;back(G)}}
 if(w=='r'){G.vo[x]=i;G.vl[x]=1;lg(G,i,'construye un rancho');updLR(G)}
 if(w=='h'){G.vl[x]=2;lg(G,i,'convierte un rancho en hacienda')}}
function bank(G,i,m){if(G.st!='main')return 'Solo en tu turno, después de tirar.';const a=m.give,b=m.get;
 if(!isR(a)||!isR(b)||a===b)return 'Elige qué das y qué recibes.';const n=rate(G,i,a);if(G.res[i][a]<n)return 'Necesitas '+n+' de '+RN[a]+'.';
 G.res[i][a]-=n;G.res[i][b]++;lg(G,i,'cambia '+n+' '+RN[a]+' por 1 '+RN[b]+(n<4?' en el puerto':' con el banco'))}
// ---- comercio: el jugador en turno ofrece a todos (to -1) o a uno; los demás aceptan, rechazan o contraofertan (solo al jugador en turno) ----
function canTake(G,o,i){return i!==o.from&&!G.out[i]&&(o.from===G.turn?(o.to<0||o.to===i)&&!o.no.includes(i):i===G.turn)}
const drop=(G,o)=>{G.offers=G.offers.filter(x=>x!==o)};
function noAll(G,o,i){o.no.push(i);if(G.players.every((_,j)=>j===o.from||G.out[j]||o.no.includes(j)))drop(G,o)}
function trade(G,i,t,m){if(G.st!='main')return 'Solo se comercia después de tirar.';const T=G.turn;
 if(t=='offer'){const give=res5(m.give),want=res5(m.want);if(!give||!want||!tot(give)||!tot(want))return 'La oferta necesita algo que das y algo que pides.';
  if(give.some((x,j)=>x&&want[j]))return 'No puedes dar y pedir el mismo recurso.';if(!has(G.res[i],give))return 'No tienes lo que ofreces.';
  let to=-1;if(i!==T)to=T;else if(m.to!=null&&m.to>=0){to=m.to;if(!Number.isInteger(to)||to===i||!G.players[to]||G.out[to])return 'Ese jugador no está.'}
  if(G.offers.filter(o=>o.from===i).length>=(i===T?3:1))return 'Ya tienes ofertas abiertas.';
  const re=m.re!=null?G.offers.find(o=>o.id===m.re&&o.from===T):null;if(re&&i!==T&&!re.no.includes(i)){if(re.to<0)noAll(G,re,i);else drop(G,re)}
  G.offers.push({id:G.on=(G.on||0)+1,from:i,to,give,want,no:[],ts:Date.now()});if(i===T)G.oc++;
  lg(G,i,(i===T?'ofrece ':'contraoferta: da ')+txt(give)+' por '+txt(want)+(i===T&&to>=0?' a '+pn(G,to):''));return}
 const o=G.offers.find(x=>x.id===m.id);if(!o)return 'Esa oferta ya no está.';
 if(t=='reject'){if(o.from===i){drop(G,o);return}if(!canTake(G,o,i))return 'Esa oferta no es para ti.';
  if(o.to<0&&o.from===T)noAll(G,o,i);else{drop(G,o);lg(G,i,'rechaza la oferta de '+pn(G,o.from))}return}
 if(!canTake(G,o,i))return 'Esa oferta no es para ti.';
 if(!has(G.res[o.from],o.give)){drop(G,o);return pn(G,o.from)+' ya no tiene lo que ofrecía.'}if(!has(G.res[i],o.want))return 'No tienes lo que te piden.';
 sub(G.res[o.from],o.give);add(G.res[i],o.give);sub(G.res[i],o.want);add(G.res[o.from],o.want);drop(G,o);
 G.offers=G.offers.filter(x=>has(G.res[x.from],x.give));   // las que ya no se pueden pagar se caen
 G.tr={a:o.from,b:i,give:o.give,want:o.want,n:(G.trn=(G.trn||0)+1)};lg(G,i,'acepta: '+pn(G,o.from)+' da '+txt(o.give)+' por '+txt(o.want))}
function nextTurn(G){const n=G.players.length,pos=t=>(t-G.first+n)%n;let t=G.turn;do t=(t+1)%n;while(G.out[t]&&t!==G.turn);
 if(pos(t)<=pos(G.turn))G.round++;G.turn=t;G.tc++;G.st='roll';G.played=false;G.offers=[];G.oc=0;G.ac=0;G.cand=null;G.dis=null;G.free=0;G.ret=null;
 G.prot=G.prot.filter(p=>p.k!==t)}  // la protección dura hasta el siguiente turno de quien la puso
// ---- acciones ----
function act(R,tok,m){const G=R.G,i=R.players.findIndex(p=>p.tok==tok),t=m.t;
 if(G.phase!='play')return 'La partida terminó.';if(i<0||G.out[i])return 'Ya no estás jugando.';
 if(!m.ab&&!R.players[i].bot)awake(R,i);   // ab: jugada del bot que suple a una persona
 if(t=='back'){arm(R);return}
 const e=inner(G,i,t,m);if(!e){if(i===G.turn)G.ac++;chkWin(G);arm(R)}return e}
function inner(G,i,t,m){
 if(t=='discard'){if(G.st!='discard'||G.dis[i]==null)return 'No tienes que descartar.';const r=res5(m.r);
  if(!r||tot(r)!==G.dis[i])return 'Tienes que descartar '+G.dis[i]+' cartas.';if(!has(G.res[i],r))return 'No tienes esas cartas.';
  sub(G.res[i],r);delete G.dis[i];lg(G,i,'descarta '+txt(r));if(!Object.keys(G.dis).length){G.dis=null;G.st='move'}return}
 if(t=='offer'||t=='accept'||t=='reject')return trade(G,i,t,m);
 if(G.st=='discard')return 'Esperando a que todos descarten.';
 if(G.turn!==i)return 'No es tu turno.';
 if(G.st=='setup')return setup(G,i,m);
 if(t=='roll'){if(G.st!='roll')return 'Ya tiraste.';roll(G,i);return}
 if(t=='move'){if(G.st!='move')return 'Ahora no toca mover el huracán.';return moveH(G,i,m.h)}
 if(t=='steal'){if(G.st!='steal')return 'Ahora no toca robar.';if(!G.cand.includes(m.v))return 'A ese jugador no le puedes robar.';steal(G,i,m.v);G.cand=null;back(G);return}
 if(t=='dev')return dev(G,i,m);
 if(t=='skip'){if(G.st!='road')return 'No hay sacbés pendientes.';G.free=0;back(G);return}
 if(t=='build')return build(G,i,m);
 if(t=='bank')return bank(G,i,m);
 if(t=='end'){if(G.st!='main')return G.st=='roll'?'Primero tira los dados.':'Termina primero lo que estás haciendo.';nextTurn(G);return}
 return 'Esa acción no existe.'}
// quién tiene que actuar ahora (los demás solo pueden responder ofertas)
function needers(G){if(G.phase!='play')return [];if(G.st=='discard')return Object.keys(G.dis).map(Number);return [G.turn]}
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
function kick(R,k){const G=R.G;if(!G||G.phase!='play'||G.out[k])return;G.out[k]=1;lg(G,k,'salió de la partida');
 G.offers=G.offers.filter(o=>o.from!==k&&o.to!==k);
 if(G.dis&&G.dis[k]!=null){delete G.dis[k];if(!Object.keys(G.dis).length){G.dis=null;G.st='move'}}
 const L=G.players.map((_,j)=>j).filter(j=>!G.out[j]);if(L.length==1){G.phase='final';G.win=L[0];lg(G,L[0],'¡gana la partida: ya no queda nadie más!');return}
 if(G.turn===k){if(G.st=='setup'){G.si++;advSetup(G)}else nextTurn(G)}chkWin(G);arm(R)}
// ---- vista: cada quien ve sus cartas; de los demás solo cuántas tiene. Al terminar se ve todo ----
function view(R,tok,me,now){const G=R.G,fin=G.phase!='play',v=Object.assign({},G);
 v.res=G.res.map((r,k)=>k===me||fin?r:null);v.nres=G.res.map(tot);v.dev=G.dev.map((d,k)=>k===me||fin?d:null);v.ndev=G.dev.map(d=>d.length);
 v.deck=G.deck.length;v.vp=G.players.map((_,k)=>vp(G,k,k===me||fin));v.left=G.players.map((_,k)=>left(G,k));
 v.auto=R.players.map((p,k)=>!p.bot&&auto(R,k));if(me>=0&&G.turn===me&&!fin)v.rates=[0,1,2,3,4].map(r=>rate(G,me,r));
 if(G.sl&&me!==G.sl.a&&me!==G.sl.b){v.sl=Object.assign({},G.sl);delete v.sl.r}delete v.sq;return {G:v,claim:false,pend:false}}
const X={D,geo,tot,has,left,okV,okE,spots,rate,vp,roadLen,needers};
const B=require('./g_haciendas_bot.js')(X);
module.exports={id:'haciendas',name:'Haciendas de Yucatán',min:3,max:6,opts:OPTS,rng:RNG,start,view,act,kick,tick,auto,bot:B.bot,botn:B.botn,_:X};
