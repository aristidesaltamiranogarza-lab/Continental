// Uno: reglas en el servidor. Módulo cargado por server.js
// Cartas 0..107. Colores: 0 rojo, 1 amarillo, 2 verde, 3 azul, 4 comodín.
// Tipos: n número, s salto, r reversa, d +2, w comodín, f comodín +4.
const U=id=>{if(id>=100)return{id,c:4,t:id<104?'w':'f',n:-1};const c=Math.floor(id/25),k=id%25;
 if(k==0)return{id,c,t:'n',n:0};if(k<=18)return{id,c,t:'n',n:Math.ceil(k/2)};return{id,c,t:k<=20?'s':k<=22?'r':'d',n:-1}};
const CN=['rojo','amarillo','verde','azul'],SYM={s:'salto',r:'reversa',d:'+2',w:'comodín',f:'comodín +4'};
const un=id=>{const c=U(id);return c.t=='n'?c.n+' '+CN[c.c]:c.t=='w'||c.t=='f'?SYM[c.t]:SYM[c.t]+' '+CN[c.c]};
const DRAW_MS=800; // pausa entre cartas cuando robas hasta poder jugar
const UG=1500; // segundos de gracia (ms) para decir UNO sin riesgo
function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const lg=(G,k,t,c)=>{(G.log=G.log||[]).push({k,t,c,n:G.ln=(G.ln||0)+1});if(G.log.length>12)G.log.shift()};
function pull(G){if(!G.deck.length&&G.disc.length>1){const t=G.disc.pop();G.deck=shuf(G.disc);G.disc=[t]}return G.deck.pop()}
function give(G,k,n){let g=0;while(g<n){const x=pull(G);if(x===undefined)break;G.hands[k].push(x);g++}return g}
// ¿Se puede jugar esta carta ahora? (h = mano del jugador)
function ok(G,h,id){const c=U(id);
 if(c.c==4&&h.length==1)return false;                              // no se gana con un comodín
 if(G.pend>0)return c.t=='f'||(c.t=='d'&&G.pendT=='d');           // acumular
 if(c.t=='w')return true;
 if(c.t=='f')return !h.some(x=>U(x).c==G.color);                    // oficial: solo sin cartas del color actual
 if(c.c==G.color)return true;
 const t=U(G.disc[G.disc.length-1]);return t.c<4&&c.t==t.t&&(c.t!='n'||c.n==t.n)}
// Cobro de UNO: castiga con 2 cartas si, pasada la gracia, el jugador con 1 carta no dijo UNO
function cobrar(R,v,by){const G=R.G;give(G,v.k,2);G.vuln=null;lg(G,by,'cobró UNO a '+G.players[v.k].name+' (+2)')}
function settle(R){const G=R.G;if(!G||G.phase!='play'||!G.vuln)return false;const v=G.vuln;
 if(v.by<0||Date.now()<v.t0+UG)return false;
 if(G.hands[v.k].length==1&&!G.uno[v.k])cobrar(R,v,v.by);else G.vuln=null;return true}
// Robar hasta poder jugar, UNA POR UNA: cada carta llega con una pausa para que se note la desesperación
function sched(R,i,tc){setTimeout(()=>{const G=R.G;if(!G||G.phase!='play'||G.tc!==tc||!G.ad||R.players[i].out)return;
  const h=G.hands[i],x=pull(G);
  if(x===undefined){G.ad=0;lg(G,i,'se quedó sin cartas en el mazo');adv(R,1);if(R.poke)R.poke();return}
  h.push(x);G.ad++;lg(G,i,'robó otra carta ('+G.ad+')');
  if(ok(G,h,x)){G.ad=0;G.step='drawn';G.drawn=x}else sched(R,i,tc);
  if(R.poke)R.poke()},DRAW_MS)}
function adv(R,s){const G=R.G,n=G.players.length;for(let j=0;j<s;j++){do{G.turn=(G.turn+G.dir+n)%n}while(R.players[G.turn].out)}
 G.tc++;G.step='play';G.drawn=null;G.note='';G.ad=0}
function deal(R){const G=R.G,n=R.players.length,d=shuf([...Array(108).keys()]);
 G.hands=R.players.map(p=>p.out?[]:d.splice(0,7));
 let q=d.length-1;while(U(d[q]).t!='n')q--;                          // la primera carta es un número
 G.disc=d.splice(q,1);G.deck=d;G.color=U(G.disc[0]).c;G.dir=1;
 do{G.turn=Math.floor(Math.random()*n)}while(R.players[G.turn].out);
 G.pend=0;G.pendT=null;G.ad=0;G.step='play';G.drawn=null;G.uno=Array(n).fill(false);G.vuln=null;G.win=-1;G.tc++;G.note='';G.log=[];
 G.dn=(G.dn||0)+1;G.rlUntil=Date.now();G.cdUntil=Date.now()+3000;R.pb=null;R.cl={}}
function start(R){const o=R.opts||{};
 R.G={phase:'play',players:R.players.map(p=>({id:p.id,name:p.name})),round:0,scores:[],tc:0,opts:{stack:!!o.stack,until:!!o.until}};deal(R)}
function view(R,tok,me,now){const G=R.G,v={...G,hands:G.hands.map((h,i)=>i==me?h:h.length),deck:G.deck.length,disc:G.disc.slice(-1),dc:G.disc.length,
  cd:Math.max(0,G.cdUntil-now),rc:0,drawn:me==G.turn?G.drawn:null,vuln:G.vuln?{k:G.vuln.k,gr:Math.max(0,G.vuln.t0+UG-now),by:G.vuln.by>=0}:null};
 delete v.rlUntil;delete v.cdUntil;return {G:v,claim:false,pend:false}}
function kick(R,k){const G=R.G;G.deck.push(...G.hands[k]);shuf(G.deck);G.hands[k]=[];G.vuln=null;
 const left=R.players.map((p,i)=>i).filter(i=>!R.players[i].out);
 if(left.length<2){G.phase='final';G.win=left[0]??-1;return}
 if(G.turn==k){G.pend=0;G.pendT=null;adv(R,1)}}
function act(R,tok,m){const G=R.G,i=R.players.findIndex(p=>p.tok==tok),t=m.t;
 settle(R);
 const e=inner(R,G,i,t,m);
 // una jugada de turno hecha después de la gracia cierra la ventana de cobro (antes de la gracia no)
 if(!e&&(t=='play'||t=='draw'||t=='pass')&&G.vuln&&Date.now()>=G.vuln.t0+UG)G.vuln=null;
 G.uno.forEach((u,k)=>{if(u&&G.hands[k].length>1)G.uno[k]=false});
 if(G.vuln&&G.hands[G.vuln.k].length!=1)G.vuln=null;
 return e}
function inner(R,G,i,t,m){
 if(G.phase!='play')return 'La partida terminó.';
 if(t=='uno'){if(i<0)return;
  if(G.hands[i].length!=1)return 'Solo puedes decir UNO cuando te queda 1 carta.';
  if(G.uno[i])return;G.uno[i]=true;if(G.vuln&&G.vuln.k==i)G.vuln=null;lg(G,i,'dijo ¡UNO!');return}
 if(t=='catch'){if(i<0)return;const v=G.vuln;
  if(!v||v.k==i||G.hands[v.k].length!=1||G.uno[v.k])return 'Nadie tiene 1 carta sin haber dicho UNO.';
  const left=v.t0+UG-Date.now();
  if(left<=0){cobrar(R,v,i);return}
  if(v.by<0){v.by=i;setTimeout(()=>{if(settle(R)&&R.poke)R.poke()},left+30)}   // cobro anticipado: se aplica al cumplirse la gracia
  return}
 if(i<0||i!=G.turn)return 'No es tu turno.';
 if(Date.now()<G.cdUntil)return 'Espera a que termine la cuenta regresiva.';
 if(G.ad)return 'Se están robando cartas: espera a que termine.';
 const h=G.hands[i];
 if(t=='draw'){if(G.step!='play')return 'Ya robaste: juega esa carta o pasa.';
  if(G.pend>0){const n=G.pend,g=give(G,i,n);G.pend=0;G.pendT=null;lg(G,i,'robó '+g+' cartas (castigo)');adv(R,1);return}
  const x=pull(G);if(x===undefined){lg(G,i,'no pudo robar: no quedan cartas');adv(R,1);return}
  h.push(x);lg(G,i,'robó del mazo');
  if(ok(G,h,x)){G.step='drawn';G.drawn=x;return}
  if(!G.opts.until){adv(R,1);return}
  G.ad=1;sched(R,i,G.tc);return}
 if(t=='pass'){if(G.step!='drawn')return 'Primero roba una carta.';lg(G,i,'pasó');adv(R,1);return}
 if(t!='play')return 'Acción desconocida.';
 const id=m.id;if(!h.includes(id))return 'Jugada inválida.';
 if(G.step=='drawn'&&id!=G.drawn)return 'Solo puedes jugar la carta que robaste, o pasar.';
 const c=U(id);
 if(c.c==4&&h.length==1)return 'No puedes ganar con un comodín: roba una carta para seguir.';
 if(!ok(G,h,id))return G.pend>0?'Hay '+G.pend+' por robar: acumula con un +2/+4 válido o roba.':c.t=='f'?'El +4 solo se juega si no tienes cartas del color actual ('+CN[G.color]+').':'Esa carta no se puede jugar ahora.';
 if(c.c==4){const col=+m.col;if(!(col>=0&&col<4))return 'Elige un color.';G.color=col}else G.color=c.c;
 G.hands[i]=h.filter(x=>x!=id);G.disc.push(id);lg(G,i,'jugó '+un(id)+(c.c==4?' → '+CN[G.color]:''),id);
 const L=G.hands[i].length;
 if(L==0){G.win=i;G.phase='final';G.vuln=null;return}
 if(L==1){if(!G.uno[i])G.vuln={k:i,t0:Date.now(),by:-1}}else G.uno[i]=false;
 const act2=R.players.filter(p=>!p.out).length;
 if(c.t=='r'){G.dir=-G.dir;adv(R,act2==2?2:1)}
 else if(c.t=='s')adv(R,2)
 else if(c.t=='d'||c.t=='f'){const n=c.t=='d'?2:4;
  if(G.opts.stack){G.pend+=n;G.pendT=c.t;adv(R,1)}
  else{adv(R,1);const v=G.turn,g=give(G,v,n);lg(G,v,'robó '+g+' cartas (castigo)');adv(R,1)}}
 else adv(R,1)}
const tick=R=>{if(settle(R)&&R.poke)R.poke()};
// ---- bot: qué haría el jugador k ahora. Devuelve {m: acción, ms: espera} o null. server.js lo agenda y lo manda por act() ----
// Juega como una persona razonable: guarda los comodines, se deshace de las cartas altas, ataca si el siguiente está por ganar,
// casi siempre dice UNO (a veces se le pasa) y a veces cobra UNO a los demás.
const rnd=(a,b)=>a+Math.random()*(b-a);
function bcol(h,id){const n=[0,0,0,0];h.forEach(x=>{const c=U(x);if(x!==id&&c.c<4)n[c.c]++});const m=Math.max(...n);return m?n.indexOf(m):Math.floor(Math.random()*4)}
function bot(R,k){const G=R.G;if(!G||G.phase!='play'||R.players[k].out)return null;
 const now=Date.now(),h=G.hands[k],wait=Math.max(0,G.cdUntil-now),mem=R.bm=R.bm||{};
 // ¡UNO! con 1 carta: casi siempre dentro de la gracia; 1 de cada 5 veces se le pasa y lo pueden cobrar
 if(h.length==1&&!G.uno[k]){const key='u'+G.tc+':'+k,t0=G.vuln&&G.vuln.k==k?G.vuln.t0:now;if(mem[key]==null)mem[key]=Math.random()<.2?rnd(2300,3800):rnd(450,1150);
  return {m:{t:'uno'},ms:Math.max(0,t0+mem[key]-now)}}
 // cobrar UNO a otro (después de su gracia, con algo de reflejos)
 const v=G.vuln;if(v&&v.k!==k&&v.by<0&&G.hands[v.k].length==1&&!G.uno[v.k]){const key='c'+v.t0+':'+k;if(mem[key]==null)mem[key]=Math.random()<.6?UG+rnd(250,1600):-1;
  if(mem[key]>=0)return {m:{t:'catch'},ms:Math.max(0,v.t0+mem[key]-now)}}
 if(G.turn!==k||G.ad)return null;
 const ms=wait+rnd(900,1800),play=id=>({t:'play',id,col:U(id).c==4?bcol(h,id):undefined});
 if(G.step=='drawn')return {m:ok(G,h,G.drawn)?play(G.drawn):{t:'pass'},ms:wait+rnd(600,1100)};
 const can=h.filter(x=>ok(G,h,x));if(!can.length)return {m:{t:'draw'},ms};
 // ¿el siguiente está por ganar? entonces conviene atacarlo
 const n=G.players.length;let nx=G.turn;do{nx=(nx+G.dir+n)%n}while(R.players[nx].out);const danger=G.hands[nx].length<=2;
 const cnt=[0,0,0,0];h.forEach(x=>{const c=U(x);if(c.c<4)cnt[c.c]++});
 const score=x=>{const c=U(x);if(c.t=='w')return danger?6:-10;if(c.t=='f')return danger?14:-6;
  return 5+cnt[c.c]*1.5+(c.t!='n'?(danger?10:2):c.n*.15)+Math.random()};
 const best=can.map(x=>[score(x),x]).sort((a,b)=>b[0]-a[0])[0][1];return {m:play(best),ms}}
module.exports={id:'uno',name:'Uno',min:2,max:10,opts:{stack:true,until:true},start,view,act,kick,tick,bot};
