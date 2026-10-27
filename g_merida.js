// Mérida en Venta: juego original de compra y renta con colonias de Mérida. 2 a 6 jugadores, sin bots. Gana el último que no quiebra.
// Tablero y cartas en merida_data.js. Estados del turno (G.st): roll (tirar) · buy (comprar o no) · end (terminar turno).
// Encima del turno pueden ir capas que lo bloquean: G.auc (subasta), G.debts (deudas en fila: la primera la resuelve su deudor).
const D=require('./merida_data.js'),B=D.board,NB=B.length,JAIL=D.jail,BAIL=D.bail,AUC_MS=12000,AWAY_MS=180000;
// reglas opcionales: dbl x2 renta con grupo completo · pot bote de vacaciones · auc subasta · jr sin renta si el dueño está en la cárcel
// mort hipotecas · even construcción pareja · cash dinero inicial · qa abandono → subasta de sus propiedades
const OPTS={dbl:false,pot:false,auc:true,jr:false,mort:false,even:true,cash:1500,qa:false};
const GR=[],RR=[],UU=[];B.forEach((s,i)=>{if(s.t=='p')(GR[s.g]=GR[s.g]||[]).push(i);if(s.t=='r')RR.push(i);if(s.t=='u')UU.push(i)});
const JF={s:D.cards.s.findIndex(c=>c.jf),c:D.cards.c.findIndex(c=>c.jf)};
function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const lg=(G,k,t)=>{(G.log=G.log||[]).push({k,t,n:G.ln=(G.ln||0)+1});if(G.log.length>14)G.log.shift()};
const $=v=>'$'+v,pn=(G,k)=>k>=0?G.players[k].name:'el banco',alive=G=>G.players.map((_,k)=>k).filter(k=>!G.bk[k]);
const after=(G,k)=>G.again&&!G.jail[k]?'roll':'end';
function start(R){const o=Object.assign({},OPTS,R.opts),n=R.players.length;
 R.G={phase:'play',round:0,tc:0,turn:Math.random()*n|0,players:R.players.map(p=>({id:p.id,name:p.name})),o,
  cash:Array(n).fill(o.cash),pos:Array(n).fill(0),jail:Array(n).fill(0),jfc:R.players.map(()=>[]),bk:Array(n).fill(0),
  own:Array(NB).fill(-1),hs:Array(NB).fill(0),mg:Array(NB).fill(0),dice:[0,0],rn:0,dbl:0,again:false,st:'roll',pot:0,
  debts:[],auc:null,aq:[],trade:null,card:null,dk:{s:shuf([...Array(16).keys()]),c:shuf([...Array(16).keys()])}};
 lg(R.G,R.G.turn,'empieza la partida')}
// ---- dinero: to = jugador, -1 banco, -2 banco/bote (impuestos y multas van al bote si está prendido) ----
function xfer(G,k,v,to){G.cash[k]-=v;if(to>=0)G.cash[to]+=v;else if(to==-2&&G.o.pot)G.pot+=v}
function pay(G,k,v,to,why){if(v<=0)return true;if(G.cash[k]>=v){xfer(G,k,v,to);return true}
 G.debts.push({k,amt:v,to,why});lg(G,k,'no le alcanza: debe '+$(v)+' pesos a '+pn(G,to)+(why?' ('+why+')':''));return false}
function settle(G){while(G.debts.length){const d=G.debts[0];if(G.cash[d.k]<d.amt)return;xfer(G,d.k,d.amt,d.to);G.debts.shift();lg(G,d.k,'pagó lo que debía ('+$(d.amt)+' pesos)')}}
// ---- renta ----
const full=(G,g,o)=>GR[g].every(j=>G.own[j]===o);
function rent(G,i,x){const s=B[i],o=G.own[i];
 if(s.t=='r')return 25*2**(RR.filter(j=>G.own[j]===o).length-1)*(x.x2?2:1);
 if(s.t=='u')return x.sum*(x.u10||UU.every(j=>G.own[j]===o)?10:4);
 const h=G.hs[i];return h?s.r[h]:s.r[0]*(G.o.dbl&&full(G,s.g,o)?2:1)}
// ---- moverse y caer ----
function toJail(G,k){G.pos[k]=JAIL;G.jail[k]=1;G.again=false;lg(G,k,'se va a la cárcel')}
function moveTo(G,k,to,pass){if(pass&&to<G.pos[k]){G.cash[k]+=D.go;lg(G,k,'pasó por la Salida y cobra '+$(D.go)+' pesos')}G.pos[k]=to}
function land(R,k,x){const G=R.G,i=G.pos[k],s=B[i];
 if(s.p){const o=G.own[i];if(o<0){G.st='buy';return}
  if(o===k||G.bk[o])return;if(G.mg[i])return lg(G,k,'cayó en '+s.n+' (hipotecada: no paga)');
  if(G.o.jr&&G.jail[o])return lg(G,k,'no paga renta: '+pn(G,o)+' está en la cárcel');
  const r=rent(G,i,x);lg(G,k,'paga '+$(r)+' pesos de renta a '+pn(G,o)+' por '+s.n);pay(G,k,r,o,'renta');return}
 if(s.t=='tax'){lg(G,k,'paga '+$(s.v)+' pesos de '+s.n);pay(G,k,s.v,-2,s.n);return}
 if(s.t=='s'||s.t=='c')return card(R,k,s.t,x);
 if(s.t=='gtj')return toJail(G,k);
 if(s.t=='free'&&G.o.pot&&G.pot){G.cash[k]+=G.pot;lg(G,k,'se lleva el bote de vacaciones: '+$(G.pot)+' pesos');G.pot=0}}
function card(R,k,d,x){const G=R.G,id=G.dk[d].shift(),c=D.cards[d][id];G.card={d,id,k,n:(G.cn=(G.cn||0)+1)};
 lg(G,k,'sacó '+(d=='s'?'Suerte':'Comunidad')+': '+c.t);if(c.jf){G.jfc[k].push(d);return}G.dk[d].push(id);
 if(c.go!=null){moveTo(G,k,c.go,true);return land(R,k,x)}
 if(c.back){G.pos[k]=(G.pos[k]-c.back+NB)%NB;return land(R,k,x)}
 if(c.near){const L=c.near=='r'?RR:UU;let j=G.pos[k];do j=(j+1)%NB;while(!L.includes(j));moveTo(G,k,j,true);return land(R,k,Object.assign({},x,c.near=='r'?{x2:1}:{u10:1}))}
 if(c.jail)return toJail(G,k);
 if(c.get)G.cash[k]+=c.get;
 if(c.pay)pay(G,k,c.pay,-2,'carta');
 if(c.each)alive(G).filter(o=>o!==k).forEach(o=>pay(G,k,c.each,o,'carta'));
 if(c.all)alive(G).filter(o=>o!==k).forEach(o=>pay(G,o,c.all,k,'carta'));
 if(c.rep){let v=0;G.own.forEach((o,i)=>{if(o===k&&G.hs[i])v+=G.hs[i]==5?c.rep[1]:G.hs[i]*c.rep[0]});if(v){lg(G,k,'paga '+$(v)+' pesos de reparaciones');pay(G,k,v,-2,'reparaciones')}}}
function roll(R,k){const G=R.G,a=1+Math.random()*6|0,b=1+Math.random()*6|0,d=a===b;G.dice=[a,b];G.rn++;G.card=null;G.again=false;
 lg(G,k,'tiró '+a+' y '+b+(d?' (dobles)':''));G.st='end';
 if(G.jail[k]){if(d){G.jail[k]=0;lg(G,k,'sacó dobles y sale de la cárcel')}
  else if(G.jail[k]>=3){G.jail[k]=0;lg(G,k,'tercer intento: paga '+$(BAIL)+' pesos de fianza y sale');pay(G,k,BAIL,-2,'fianza')}
  else{G.jail[k]++;return}}
 else if(d){if(++G.dbl>=3){lg(G,k,'sacó dobles 3 veces seguidas');return toJail(G,k)}G.again=true}
 moveTo(G,k,(G.pos[k]+a+b)%NB,true);land(R,k,{sum:a+b});if(G.st!='buy')G.st=after(G,k)}
function nextTurn(G){const n=G.players.length;let t=G.turn;do t=(t+1)%n;while(G.bk[t]&&t!==G.turn);
 G.turn=t;G.tc++;G.st='roll';G.dbl=0;G.again=false;G.card=null}
function won(G){const L=alive(G);if(L.length>1)return false;G.phase='final';G.win=L[0]??-1;G.auc=null;G.aq=[];G.trade=null;G.debts=[];
 if(G.win>=0)lg(G,G.win,'¡gana la partida!');return true}
// ---- subasta: cada puja reinicia el reloj; si nadie puja en AUC_MS, se la lleva el más alto ----
function aucStart(R,sq){const G=R.G,a=G.auc={sq,bid:0,hi:-1,in:alive(G),t:Date.now()+AUC_MS,id:(G.aid=(G.aid||0)+1)};lg(G,-1,'¡Subasta de '+B[sq].n+'!');aucTimer(R,a)}
function aucTimer(R,a){const G=R.G;setTimeout(()=>{if(R.G!==G||G.auc!==a)return;if(Date.now()<a.t-30)return aucTimer(R,a);aucEnd(R);if(R.poke)R.poke()},Math.max(50,a.t-Date.now()+40))}
function aucEnd(R){const G=R.G,a=G.auc;G.auc=null;
 if(a.hi>=0&&!G.bk[a.hi]&&G.cash[a.hi]>=a.bid){G.cash[a.hi]-=a.bid;G.own[a.sq]=a.hi;lg(G,a.hi,'ganó la subasta: '+B[a.sq].n+' por '+$(a.bid)+' pesos')}
 else lg(G,-1,'Nadie compró '+B[a.sq].n+': sigue siendo del banco');
 while(G.aq.length&&G.own[G.aq[0]]>=0)G.aq.shift();if(G.aq.length)aucStart(R,G.aq.shift());settle(G)}
function aucCheck(R){const a=R.G.auc;if(a&&(!a.in.length||(a.in.length==1&&a.in[0]===a.hi)))aucEnd(R)}
// ---- quiebra / abandono: to = acreedor (-1 banco). Las casas se venden al banco a mitad de precio ----
function broke(R,k,to){const G=R.G;if(G.bk[k])return;let c=G.cash[k];
 B.forEach((s,i)=>{if(G.own[i]===k&&G.hs[i]){c+=G.hs[i]*D.hc[s.g]/2;G.hs[i]=0}});G.cash[k]=0;G.bk[k]=1;
 G.debts=G.debts.filter(d=>d.k!==k);G.debts.forEach(d=>{if(d.to===k)d.to=-1});
 if(to>=0&&!G.bk[to]){G.cash[to]+=c;G.own.forEach((o,i)=>{if(o===k)G.own[i]=to});G.jfc[to].push(...G.jfc[k]);lg(G,k,'quebró: todo lo suyo pasa a '+pn(G,to))}
 else{G.own.forEach((o,i)=>{if(o===k){G.own[i]=-1;G.mg[i]=0;if(G.o.qa)G.aq.push(i)}});G.jfc[k].forEach(d=>G.dk[d].push(JF[d]));lg(G,k,'quebró: sus propiedades regresan al banco')}
 G.jfc[k]=[];if(G.trade&&(G.trade.a===k||G.trade.b===k))G.trade=null;
 const a=G.auc;if(a){a.in=a.in.filter(x=>x!==k);if(a.hi===k){a.hi=-1;a.bid=0}}
 if(won(G))return;if(G.turn===k)nextTurn(G);if(a)aucCheck(R);else if(G.aq.length)aucStart(R,G.aq.shift());settle(G)}
function quit(R,k){const G=R.G;if(!G||G.phase!='play'||G.bk[k])return;lg(G,k,'abandonó la partida');broke(R,k,-1)}
// ---- tratos: a le ofrece a b. ac/ap/aj = lo que da a (pesos, casillas, tarjetas de cárcel); bc/bp/bj = lo que pide ----
const ints=x=>[...new Set((Array.isArray(x)?x:[]).map(v=>v|0).filter(v=>v>=0&&v<NB))].slice(0,28),nn=v=>Math.max(0,Math.floor(+v||0));
function tcheck(G,T){if(G.bk[T.a]||G.bk[T.b])return 'Ese jugador ya no está jugando.';
 for(const [k,L] of [[T.a,T.ap],[T.b,T.bp]])for(const q of L){if(G.own[q]!==k)return pn(G,k)+' ya no tiene '+B[q].n+'.';
  if(B[q].t=='p'&&GR[B[q].g].some(j=>G.hs[j]))return 'Primero hay que vender las casas del grupo de '+B[q].n+'.'}
 if(G.cash[T.a]<T.ac||G.cash[T.b]<T.bc)return 'No alcanza el dinero para ese trato.';
 if(G.jfc[T.a].length<T.aj||G.jfc[T.b].length<T.bj)return 'No hay tantas tarjetas para salir de la cárcel.'}
function trade(G,i,t,m){const T=G.trade;
 if(t=='tprop'){if(T&&T.a!==i)return 'Ya hay un trato pendiente; espera a que se resuelva.';const b=m.to|0;if(b===i||!G.players[b]||G.bk[b])return 'Elige con quién hacer el trato.';
  const N={a:i,b,ac:nn(m.ac),ap:ints(m.ap),aj:nn(m.aj),bc:nn(m.bc),bp:ints(m.bp),bj:nn(m.bj),n:(G.tn=(G.tn||0)+1)};
  if(!N.ac&&!N.ap.length&&!N.aj&&!N.bc&&!N.bp.length&&!N.bj)return 'El trato está vacío.';const e=tcheck(G,N);if(e)return e;
  G.trade=N;lg(G,i,'le ofrece un trato a '+pn(G,b));return}
 if(!T)return 'No hay trato pendiente.';
 if(t=='tno'){if(i!==T.a&&i!==T.b)return 'Ese trato no es tuyo.';G.trade=null;lg(G,i,i===T.a?'retiró su trato':'rechazó el trato de '+pn(G,T.a));return}
 if(t=='tyes'){if(i!==T.b)return 'Solo '+pn(G,T.b)+' puede aceptarlo.';const e=tcheck(G,T);if(e){G.trade=null;return e}
  G.cash[T.a]+=T.bc-T.ac;G.cash[T.b]+=T.ac-T.bc;T.ap.forEach(q=>G.own[q]=T.b);T.bp.forEach(q=>G.own[q]=T.a);
  G.jfc[T.b].push(...G.jfc[T.a].splice(0,T.aj));G.jfc[T.a].push(...G.jfc[T.b].splice(0,T.bj));
  G.trade=null;lg(G,T.b,'aceptó el trato con '+pn(G,T.a));settle(G);return}}
// ---- casas, hoteles e hipotecas ----
function manage(G,i,t,q){const s=B[q];if(!s||G.own[q]!==i)return 'Esa propiedad no es tuya.';
 if(t=='mort'||t=='unm'){if(!G.o.mort)return 'En esta sala no hay hipotecas.';
  if(t=='mort'){if(G.mg[q])return 'Ya está hipotecada.';if(s.t=='p'&&GR[s.g].some(j=>G.hs[j]))return 'Primero vende las casas del grupo.';
   G.mg[q]=1;G.cash[i]+=s.p/2;lg(G,i,'hipotecó '+s.n+' y recibe '+$(s.p/2)+' pesos');return}
  if(!G.mg[q])return 'No está hipotecada.';const c=Math.ceil(s.p*.55);if(G.cash[i]<c)return 'Para deshipotecar necesitas '+$(c)+' pesos.';
  G.cash[i]-=c;G.mg[q]=0;lg(G,i,'deshipotecó '+s.n+' ('+$(c)+' pesos)');return}
 if(s.t!='p')return 'Solo se construye en las colonias.';const g=GR[s.g],hc=D.hc[s.g],hs=g.map(j=>G.hs[j]);
 if(t=='build'){if(!full(G,s.g,i))return 'Necesitas todas las colonias del grupo.';if(g.some(j=>G.mg[j]))return 'Hay una colonia hipotecada en el grupo.';
  if(G.hs[q]>=5)return 'Ya tiene hotel.';if(G.o.even&&G.hs[q]>Math.min(...hs))return 'Construye parejo: primero en las otras del grupo.';
  if(G.cash[i]<hc)return 'Una casa aquí cuesta '+$(hc)+' pesos.';G.cash[i]-=hc;G.hs[q]++;lg(G,i,(G.hs[q]==5?'puso un hotel en ':'construyó una casa en ')+s.n);return}
 if(!G.hs[q])return 'No tiene casas.';if(G.o.even&&G.hs[q]<Math.max(...hs))return 'Vende parejo: primero en las otras del grupo.';
 G.hs[q]--;G.cash[i]+=hc/2;lg(G,i,'vendió '+(G.hs[q]==4?'el hotel':'una casa')+' de '+s.n+' ('+$(hc/2)+' pesos)')}
// ---- acciones ----
function act(R,tok,m){const G=R.G,i=R.players.findIndex(p=>p.tok==tok),t=m.t;
 if(G.phase!='play')return 'La partida terminó.';if(i<0||G.bk[i])return 'Ya no estás jugando.';
 const e=inner(R,G,i,t,m);if(!e&&G.phase=='play')settle(G);return e}
function inner(R,G,i,t,m){const a=G.auc;
 if(t=='bid'){if(!a)return 'No hay subasta.';if(!a.in.includes(i))return 'Ya te retiraste de esta subasta.';const v=m.v|0;
  if(v<=a.bid||v<1)return 'Tienes que ofrecer más de '+$(a.bid)+'.';if(v>G.cash[i])return 'No tienes tanto dinero.';
  a.bid=v;a.hi=i;a.t=Math.max(a.t,Date.now()+AUC_MS*.6);lg(G,i,'ofrece '+$(v)+' pesos');return}
 if(t=='apass'){if(!a||!a.in.includes(i))return 'No estás en la subasta.';a.in=a.in.filter(x=>x!==i);lg(G,i,'se retira de la subasta');aucCheck(R);return}
 if(a)return 'Hay una subasta en curso.';
 if(t=='tprop'||t=='tyes'||t=='tno')return trade(G,i,t,m);
 if(t=='quit'){quit(R,i);return}
 const dk=G.debts.length?G.debts[0].k:-1;
 if(t=='build'||t=='sell'||t=='mort'||t=='unm'){if(dk!==i&&(dk>=0||G.turn!==i))return 'Solo puedes hacerlo en tu turno o cuando debes dinero.';return manage(G,i,t,m.sq|0)}
 if(t=='paydebt'){if(dk!==i)return 'No debes nada.';const d=G.debts[0];if(G.cash[i]<d.amt)return 'Te faltan '+$(d.amt-G.cash[i])+' pesos.';return}  // settle() paga
 if(t=='broke'){if(dk!==i)return 'Solo si debes y no puedes pagar.';broke(R,i,G.debts[0].to);return}
 if(dk>=0)return 'Primero '+pn(G,dk)+' tiene que pagar lo que debe.';
 if(G.turn!==i)return 'No es tu turno.';
 if(t=='roll'){if(G.st!='roll')return G.st=='buy'?'Primero decide si compras.':'Ya tiraste.';roll(R,i);return}
 if(t=='buy'||t=='nobuy'){if(G.st!='buy')return 'No hay nada que comprar.';const q=G.pos[i],s=B[q];
  if(t=='buy'){if(G.cash[i]<s.p)return 'No te alcanza: cuesta '+$(s.p)+' pesos.';G.cash[i]-=s.p;G.own[q]=i;G.st=after(G,i);lg(G,i,'compró '+s.n+' en '+$(s.p)+' pesos');return}
  G.st=after(G,i);if(G.o.auc)aucStart(R,q);else lg(G,i,'no compró '+s.n);return}
 if(t=='bail'||t=='jcard'){if(!G.jail[i]||G.st!='roll')return 'No estás en la cárcel.';
  if(t=='bail'){if(G.cash[i]<BAIL)return 'La fianza cuesta '+$(BAIL)+' pesos.';xfer(G,i,BAIL,-2);lg(G,i,'pagó '+$(BAIL)+' pesos de fianza')}
  else{if(!G.jfc[i].length)return 'No tienes tarjeta para salir.';const d=G.jfc[i].pop();G.dk[d].push(JF[d]);lg(G,i,'usó su tarjeta para salir de la cárcel')}
  G.jail[i]=0;return}
 if(t=='end'){if(G.st!='end')return G.st=='roll'?'Primero tira los dados.':'Primero decide si compras.';nextTurn(G);return}
 return 'Esa acción no existe.'}
function view(R,tok,me,now){const G=R.G,v=Object.assign({},G,{dk:{s:G.dk.s.length,c:G.dk.c.length},jf:G.jfc.map(x=>x.length)});delete v.jfc;
 if(G.auc)v.auc=Object.assign({},G.auc,{left:Math.max(0,G.auc.t-now)});return {G:v,claim:false,pend:false}}
function kick(R,k){quit(R,k)}
// el que lleva AWAY_MS sin conectarse abandona: sus propiedades regresan al banco
function tick(R){const G=R.G;if(!G||G.phase!='play')return;const now=Date.now();let ch=0;
 R.players.forEach((p,k)=>{if(!G.bk[k]&&(p.out||now-p.seen>AWAY_MS)){quit(R,k);ch=1}});if(ch&&R.poke)R.poke()}
module.exports={id:'merida',name:'Mérida en Venta',min:2,max:6,opts:OPTS,rng:{cash:[500,5000]},start,view,act,kick,tick,_:{B,GR,rent,broke}};
