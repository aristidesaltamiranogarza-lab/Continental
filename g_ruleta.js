// Ruleta Rusa: revólver de 6 recámaras con 1 bala. Mesa de 2 a 6 lugares: al empezar, los bots llenan los que falten. Gana el último vivo; los muertos se quedan mirando.
// Turno (G.st): spin (decide si gira; se salta si no puede) · aim (elige a quién) · fire (le apunta a otro) · nerv (se apunta a la sien, 3–4 s) · res (se ve qué salió).
// A otro y no sale: se dispara él con la siguiente recámara. Sobrevive a su propio tiro: el siguiente no puede girar. Muere alguien: bala nueva, se gira y sigue el siguiente vivo.
// La bala (G.cy) nunca sale en la vista. G.fired: clics desde que se giró o recargó (con eso los bots calculan 1/(6-fired)). Los tiempos los lleva el servidor (G.t0, G.at).
const cr=require('crypto'),IDLE_MS=40000,OFF_MS=35000,T={fire:1500,click:1800,bang:4800},SPD=[0,2600,1700,1000];
// opciones: n lugares en la mesa (los bots llenan) · vel velocidad de bots (1 lenta, 3 rápida)
const OPTS={n:6,vel:2},RNG={n:[2,6],vel:[1,3]};
const BOTN=['Chucho','Lupe','Toño','Chela','Neto','Paty','Memo','Rosy'];
const r6=()=>Math.random()*6|0,alive=G=>G.players.map((_,k)=>k).filter(k=>!G.dead[k]),pn=(G,k)=>G.players[k].name;
const lg=(G,t)=>{G.log.push({t,n:G.ln=(G.ln||0)+1});if(G.log.length>30)G.log.shift()};
const fx=(G,t,k,to)=>{G.fx.push({n:G.fn=(G.fn||0)+1,t,k,to,ts:Date.now()});if(G.fx.length>12)G.fx.shift()};
function start(R){const o=Object.assign({},OPTS,R.opts),want=Math.max(R.players.length,Math.min(6,o.n));
 for(const nm of BOTN){if(R.players.length>=want)break;if(R.players.some(p=>p.name==nm))continue;
  R.players.push({tok:cr.randomBytes(12).toString('hex'),id:cr.randomBytes(4).toString('hex'),name:nm,seen:Date.now(),bot:true})}
 const n=R.players.length,t0=Math.random()*n|0;
 R.G={phase:'play',round:0,tc:0,turn:t0,players:R.players.map(p=>({id:p.id,name:p.name,bot:!!p.bot})),o,dead:Array(n).fill(0),
  cy:{b:r6(),p:r6()},fired:0,can:true,st:'spin',sh:t0,tg:null,forced:false,t0:Date.now(),at:0,res:null,nx:null,log:[],fx:[],kills:Array(n).fill(0),lastBy:Array(n).fill(null),win:null};
 lg(R.G,'Se carga una bala y se gira el tambor. Empieza '+pn(R.G,t0)+'.');fx(R.G,'spin',-1);begin(R.G,t0,true);arm(R)}
// empieza el turno de k (can: si puede girar el tambor)
function begin(G,k,can){Object.assign(G,{turn:k,sh:k,tg:null,forced:false,can,st:can?'spin':'aim',t0:Date.now(),at:0,res:null,nx:null});G.tc++}
function nextAlive(G,k){const n=G.players.length;for(let i=1;i<=n;i++){const j=(k+i)%n;if(!G.dead[j])return j}return k}
function timed(G,st,ms){G.st=st;G.t0=Date.now();G.at=G.t0+ms;G.tc++}
function reload(G){G.cy={b:r6(),p:r6()};G.fired=0;fx(G,'spin',-1);lg(G,'Se mete una bala nueva y se gira el tambor.')}
function final(G){const L=alive(G);if(L.length>1)return false;G.phase='final';G.win=L.length?L[0]:null;G.st='end';G.at=0;G.tc++;if(G.win!=null)lg(G,pn(G,G.win)+' es el último en pie y gana.');return true}
// jalar el gatillo: ¿sale la bala? (la recámara avanza siempre)
function pull(G){const bang=G.cy.p===G.cy.b;G.cy.p=(G.cy.p+1)%6;if(!bang)G.fired++;return bang}
function kill(G,v,by){G.dead[v]=1;fx(G,'bang',by,v);if(v!==by)G.kills[by]++;lg(G,'¡BANG! '+(v===by?pn(G,v)+' se voló la cabeza.':pn(G,by)+' mató a '+pn(G,v)+'.'))}
function shoot(G,i,to){G.tg=to;if(to===i){timed(G,'nerv',3000+Math.random()*1000);lg(G,pn(G,i)+' se pone el revólver en la sien…')}
 else{G.lastBy[to]=i;timed(G,'fire',T.fire);lg(G,pn(G,i)+' le apunta a '+pn(G,to)+'.')}}
// se acabó el tiempo de la etapa: disparar o pasar a lo que sigue
function advance(G){const i=G.sh;
 if(G.st=='fire'||G.st=='nerv'){const v=G.st=='fire'?G.tg:i;
  if(pull(G)){kill(G,v,i);G.res={r:'bang',v};G.nx='dead'}
  else{fx(G,'click',i,v);G.res={r:'click',v};G.nx=v===i?'lock':'self';lg(G,'Clic. '+(v===i?pn(G,i)+' sobrevive: el siguiente no puede girar.':pn(G,v)+' se salva y ahora '+pn(G,i)+' se tiene que disparar.'))}
  timed(G,'res',G.nx=='dead'?T.bang:T.click);return}
 if(G.st!='res')return;
 if(G.nx=='self'){G.forced=true;G.tg=i;G.res=null;timed(G,'nerv',3000+Math.random()*1000);return}
 if(G.nx=='lock'){begin(G,nextAlive(G,i),false);return}
 if(final(G))return;reload(G);begin(G,nextAlive(G,i),true)}
function act(R,tok,m){const G=R.G,i=R.players.findIndex(p=>p.tok==tok),t=m.t;
 if(G.phase!='play')return 'La partida terminó.';if(i<0||G.dead[i])return i>=0?'Estás muerto: solo puedes mirar.':'No estás jugando.';
 if(G.turn!==i)return 'No es tu turno.';
 if(t=='spin'){if(G.st!='spin')return G.can?'Ya decidiste.':'No puedes girar el tambor.';
  if(m.s){G.cy.p=r6();G.fired=0;fx(G,'spin',i);lg(G,pn(G,i)+' gira el tambor.')}else lg(G,pn(G,i)+' no gira el tambor.');
  G.st='aim';G.t0=Date.now();G.tc++;arm(R);return}
 if(t=='shoot'){if(G.st!='aim')return G.st=='spin'?'Primero decide si giras el tambor.':'Espera…';const to=+m.to;
  if(!Number.isInteger(to)||!G.players[to]||G.dead[to])return 'A esa persona no le puedes disparar.';shoot(G,i,to);arm(R);return}
 return 'Esa acción no existe.'}
// ---- reloj: las etapas con tiempo avanzan solas; si una persona se tarda IDLE_MS (o se desconecta), un bot juega por ella ----
function step(R){const G=R.G;let n=0;while(G&&G.phase=='play'&&G.at&&Date.now()>=G.at&&n++<5){G.at=0;advance(G)}arm(R)}
function arm(R){const G=R.G;clearTimeout(R.rrT);if(!G||G.phase!='play')return;let at=G.at;
 if(!at&&!R.players[G.turn].bot)at=G.t0+IDLE_MS;if(!at)return;
 R.rrT=setTimeout(()=>{if(R.G!==G)return;step(R);if(R.poke)R.poke()},Math.max(0,at-Date.now())+30);if(R.rrT.unref)R.rrT.unref()}
function auto(R,k){const G=R.G,p=R.players[k];if(!G||G.phase!='play'||!p||p.out||G.dead[k]||G.turn!==k||(G.st!='spin'&&G.st!='aim'))return false;
 if(p.bot||p.away)return true;const now=Date.now();return now-p.seen>OFF_MS||now-G.t0>=IDLE_MS}   // away: se levantó (server.js)
function tick(R){const G=R.G;if(!G||G.phase!='play'||!R.poke)return;if(G.at&&Date.now()>=G.at+500){step(R);R.poke()}else if(!R.bt&&!R.players[G.turn].bot&&auto(R,G.turn))R.poke()}
function kick(R,k){const G=R.G;if(!G||G.phase!='play'||G.dead[k])return;G.dead[k]=2;lg(G,pn(G,k)+' se levantó de la mesa.');
 if(G.st=='res'&&G.nx=='dead')reload(G);
 if(final(G))return;if(G.sh===k||G.turn===k)begin(G,nextAlive(G,k),true);arm(R)}
// ---- bots: con algo de lógica según el riesgo de la siguiente recámara (1/(6-clics)), con dudas y algo de suerte ----
function bot(R,k){const G=R.G;if(!auto(R,k))return null;const hum=!R.players[k].bot,ms=hum?400:Math.round(SPD[G.o.vel||2]*(.7+Math.random()*.6)),n=G.fired;
 // girar baja el riesgo a 1/6: con 2+ clics casi siempre gira; con 1, a veces se arriesga; con 0 no cambia nada
 if(G.st=='spin')return {m:{t:'spin',s:n>=2?Math.random()<.93:n==1?Math.random()<.6:Math.random()<.2},ms};
 // riesgo alto: le dispara a otro. Riesgo bajo: a veces se luce disparándose (si sobrevive, el siguiente no puede girar)
 const risk=1/(6-n),pSelf=risk>=1?0:risk>=.5?.03:risk>=1/3?.15:risk>=.25?.3:.42,vs=alive(G).filter(j=>j!==k);
 let to=k;if(vs.length&&Math.random()>=pSelf){const lb=G.lastBy[k];to=lb!=null&&!G.dead[lb]&&lb!==k&&Math.random()<.55?lb:vs[Math.random()*vs.length|0]}   // venganza contra quien le apuntó
 return {m:{t:'shoot',to},ms:Math.round(ms*1.3)}}
function view(R,tok,me,now){const G=R.G,v=Object.assign({},G);delete v.cy;v.el=now-G.t0;v.left=G.at?Math.max(0,G.at-now):0;
 v.fx=G.fx.filter(f=>now-f.ts<8000).map(f=>Object.assign({},f,{ago:now-f.ts}));v.auto=R.players.map((p,k)=>!p.bot&&auto(R,k));return {G:v,claim:false,pend:false}}
module.exports={id:'ruleta',name:'Ruleta Rusa',min:1,max:6,opts:OPTS,rng:RNG,start,view,act,kick,tick,auto,bot,botn:BOTN};
