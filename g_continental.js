// Continental (rummy de 7 rondas): reglas en el servidor. Módulo cargado por server.js
const C=id=>id%53==52?{id,r:0,s:-1,j:1}:{id,r:id%53%13+1,s:Math.floor(id%53/13),j:0};
const pts=c=>c.j?50:c.r==1?20:c.r>=11?15:c.r;
function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function trio(cs){const n=cs.filter(c=>!c.j);return n.length>=3&&n.every(c=>c.r==n[0].r)}
function runArr(cs){const n=cs.filter(c=>!c.j),L=cs.length;
 if(L<4||new Set(n.map(c=>c.s)).size>1||new Set(n.map(c=>c.r)).size<n.length)return null;
 for(const hi of [0,1]){const v=n.map(c=>[c,c.r==1&&hi?14:c.r]);
  for(let st=1;st+L-1<=14;st++)if(v.every(x=>x[1]>=st&&x[1]<=st+L-1)){const js=cs.filter(c=>c.j),o=[];
   for(let p=st;p<st+L;p++){const f=v.find(x=>x[1]==p);o.push(f?f[0]:js.pop())}if(o.every((c,i)=>!(c.j&&i&&o[i-1].j)))return o}}
 return null}
function runOrd(cs){const L=cs.length;if(L<4)return null;const n=cs.filter(c=>!c.j);
 if(new Set(n.map(c=>c.s)).size>1||new Set(n.map(c=>c.r)).size<n.length||cs.some((c,i)=>c.j&&i&&cs[i-1].j))return null;
 for(const hi of [0,1]){let st=null,ok=true;cs.forEach((c,i)=>{if(c.j)return;const v=(c.r==1&&hi?14:c.r)-i;if(st===null)st=v;else if(st!==v)ok=false});
  if(ok&&st>=1&&st+L-1<=14)return cs}
 return null}
// ---- reglas ----
const CON=['TT','TC','CC','TTT','TTC','CCT','CCC'];   // contrato de cada ronda (igual que en c_continental.js)
function pull(G){if(!G.deck.length&&G.disc.length>1){const t=G.disc.pop();G.deck=shuf(G.disc);G.disc=[t]}return G.deck.pop()}
function nextTurn(R){const G=R.G,n=G.players.length;do{G.turn=(G.turn+1)%n}while(R.players[G.turn].out);G.tc++;G.note='';G.tdc=0;G.step='draw';R.pb=null}
const ROUL=1/52,RMS=6500;
function deal(R){const G=R.G,r=G.round,n=G.players.length,d=shuf([...Array(53*(Math.floor(n/2)+1)).keys()]);
 let t=r%n;while(R.players[t].out)t=(t+1)%n;
 const sz=7+r,hit=Math.random()<ROUL;let jk=null;
 if(hit){const k=d.findIndex(x=>x%53==52);if(k>=0)jk=d.splice(k,1)[0]}
 G.hands=R.players.map((p,k)=>p.out?[]:(k==t&&jk!==null?[jk].concat(d.splice(0,sz-1)):d.splice(0,sz)));
 let q=d.length-1;while(q>0&&d[q]%53==52)q--;
 G.disc=[d.splice(q,1)[0]];G.deck=d;G.melds=[];G.down=Array(n).fill(false);
 G.turn=t;G.tc++;G.note='';G.step='draw';G.phase='play';G.dn=(G.dn||0)+1;G.log=[];G.tdc=0;
 G.rl={n:G.dn,hit:jk!==null,who:t,sl:jk!==null?0:1+Math.floor(Math.random()*51)};
 if(jk!==null)lg(G,t,'se quedó un comodín (ruleta)');
 G.rlUntil=Date.now()+RMS;G.cdUntil=G.rlUntil+3000;R.pb=null;R.cl={}}
function endRound(R,w){const G=R.G;G.out=w;G.scores.push(G.hands.map((h,k)=>k==w||R.players[k].out?0:h.reduce((a,x)=>a+pts(C(x)),0)));G.phase='end';G.rd=G.players.map(()=>false)}
const RN=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],SU=['♠','♥','♦','♣'];
const cn=id=>{const c=C(id);return c.j?'🃏 comodín':RN[c.r-1]+SU[c.s]};
const lg=(G,k,t,c)=>{(G.log=G.log||[]).push({k,t,c,n:G.ln=(G.ln||0)+1});if(G.log.length>12)G.log.shift()};
const fits=(G,id)=>{const c=C(id);return G.melds.some(m=>{const a=m.cards.map(C).concat(c);return m.type=='T'?trio(a):!!runArr(a)})};
function chkReady(R,f){const G=R.G;if(!G||G.phase!='end')return;const now=Date.now();
 if(f||R.players.every((p,k)=>p.out||now-p.seen>35000||G.rd[k])){G.round++;if(G.round>=7)G.phase='final';else deal(R)}}
function swapJ(R,m,c,i){const G=R.G;if(m.type!='C')return 0;const cs=m.cards.map(C),n=cs.findIndex(x=>!x.j);
 for(let q=0;q<cs.length;q++)if(cs[q].j){let v=(cs[n].r==1&&n>0?14:cs[n].r)+q-n;if(v>13)v-=13;
  if(c.r==v&&c.s==cs[n].s){if(!G.down[i]&&!R.pb)R.pb=JSON.stringify({i,melds:G.melds,hand:G.hands[i]});
   m.cards[q]=c.id;G.hands[i]=G.hands[i].filter(x=>x!=c.id);G.hands[i].push(cs[q].id);return 1}}
 return 0}
function kick(R,k){const p=R.players[k],G=R.G;if(G.c4s)G.c4s=G.c4s.filter(x=>!x.p.includes(k));if(G.bgs)G.bgs=G.bgs.filter(x=>!x.p.includes(k));G.deck.push(...G.hands[k]);shuf(G.deck);G.hands[k]=[];delete R.cl[p.id];
 if(R.players.filter(x=>!x.out).length<2){G.phase='final';return}
 if(G.phase=='play'&&G.turn==k)nextTurn(R)}
function resolveBuy(R,i){const G=R.G,n=G.players.length;if(G.tdc||!G.disc.length)return '';
 const b=R.players.map((p,k)=>k).filter(k=>k!=i&&!R.players[k].out&&R.cl[R.players[k].id]==G.tc).sort((p,q)=>(p-i+n)%n-(q-i+n)%n)[0];if(b===undefined)return '';
 const dc=G.disc.pop();G.hands[b].push(dc);const y=pull(G);if(y!==undefined)G.hands[b].push(y);
 lg(G,b,'compró el descarte (+1 de castigo)',dc);return G.players[b].name+' compró el descarte (+1 carta de castigo).'}
// ---- Conecta 4: partidas de 2 jugadores aparte, se pueden jugar durante el Continental ----
// G.c4s = [{id,p:[a,b],b:[42] (fila 0 = abajo; 0 vacío, 1/2 = ficha de p[0]/p[1]),turn:0|1,st:'inv'|'play'|'end',w:-1|0|1|2(empate),line,last,why}]
function c4win(b,x){const r=Math.floor(x/7),c=x%7,v=b[x];
 for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){const l=[x];
  for(const s of [1,-1]){let rr=r+dr*s,cc=c+dc*s;while(rr>=0&&rr<6&&cc>=0&&cc<7&&b[rr*7+cc]==v){l.push(rr*7+cc);rr+=dr*s;cc+=dc*s}}
  if(l.length>=4)return l}
 return null}
function c4(R,i,m){const G=R.G;if(i<0)return 'Solo los jugadores pueden jugar Conecta 4.';const L=G.c4s=G.c4s||[],op=m.op,g=L.find(x=>x.id===m.id);
 const busy=k=>L.some(x=>x.st!='end'&&x.p.includes(k));
 if(op=='inv'){const k=m.k;if(!(k>=0&&k<G.players.length)||k==i||R.players[k].out)return 'Ese jugador no puede jugar.';
  if(busy(i))return 'Ya tienes una partida de Conecta 4 abierta.';if(busy(k))return G.players[k].name+' ya está en otra partida de Conecta 4.';
  G.c4s=L.filter(x=>!x.p.includes(i)&&!x.p.includes(k));G.c4s.push({id:G.c4n=(G.c4n||0)+1,p:[i,k],b:Array(42).fill(0),turn:0,st:'inv',w:-1,line:null,last:-1});return}
 if(!g||!g.p.includes(i))return 'Esa partida de Conecta 4 ya no existe.';const me=g.p.indexOf(i);
 if(op=='acc'){if(g.st!='inv'||me!=1)return;g.st='play';return}
 if(op=='end'){if(g.st=='play'){g.st='end';g.w=1-me;g.why='rindió';return}G.c4s=L.filter(x=>x!==g);return}
 if(op=='drop'){if(g.st!='play')return 'La partida no está en juego.';if(g.turn!=me)return 'Es el turno de '+G.players[g.p[g.turn]].name+'.';
  const c=m.c;if(!(c>=0&&c<7))return 'Columna inválida.';let x=-1;for(let r=0;r<6;r++)if(!g.b[r*7+c]){x=r*7+c;break}if(x<0)return 'Esa columna está llena.';
  g.b[x]=me+1;g.last=x;const l=c4win(g.b,x);if(l){g.st='end';g.w=me;g.line=l}else if(g.b.every(v=>v)){g.st='end';g.w=2}else g.turn=1-me;return}
 return 'Acción desconocida.'}
// ---- Backgammon: también entre dos jugadores, aparte del Continental ----
// pts[i] (i=0..23): >0 fichas de p[0] (avanza hacia i=0), <0 fichas de p[1] (avanza hacia i=23). bar/off por jugador.
// En las jugadas, from=25 significa "desde la barra" y to=-1 "sacar la ficha".
function bgStart(){const pts=Array(24).fill(0);[[23,2],[12,5],[7,3],[5,5]].forEach(([i,n])=>{pts[i]=n;pts[23-i]=-n});return pts}
const bgHome=(g,p)=>!g.bar[p]&&g.pts.every((v,i)=>p?!(v<0&&i<18):!(v>0&&i>5));
function bgDest(g,p,from,die){const s=p?-1:1,start=from==25?(p?-1:24):from,to=start+(p?die:-die);
 if(to<0||to>23){if(from==25||!bgHome(g,p))return null;if(to==(p?24:-1))return -1;
  // con un dado mayor solo se saca si no quedan fichas más lejos
  for(let i=0;i<24;i++)if(g.pts[i]*s>0&&(p?i<from:i>from))return null;return -1}
 return g.pts[to]*s<=-2?null:to}
function bgApply(g,p,from,die,to){const s=p?-1:1;if(from==25)g.bar[p]--;else g.pts[from]-=s;
 if(to==-1)g.off[p]++;else{if(g.pts[to]*s==-1){g.pts[to]=0;g.bar[1-p]++}g.pts[to]+=s}g.left.splice(g.left.indexOf(die),1)}
function bgSingles(g,p){const s=p?-1:1,out=[],fr=g.bar[p]?[25]:[...Array(24).keys()].filter(i=>g.pts[i]*s>0);
 for(const d of new Set(g.left))for(const f of fr){const t=bgDest(g,p,f,d);if(t!==null)out.push([f,d,t])}return out}
const bgCl=g=>({pts:g.pts.slice(),bar:g.bar.slice(),off:g.off.slice(),left:g.left.slice()});
function bgDepth(g,p){let b=0;for(const m of bgSingles(g,p)){const c=bgCl(g);bgApply(c,p,...m);b=Math.max(b,1+bgDepth(c,p));if(b==g.left.length)break}return b}
// jugadas válidas: hay que usar todos los dados que se pueda; si solo cabe uno, el mayor
function bgLegal(g,p){const ms=bgSingles(g,p);if(!ms.length)return [];const sc=ms.map(m=>{const c=bgCl(g);bgApply(c,p,...m);return 1+bgDepth(c,p)}),mx=Math.max(...sc);
 let L=ms.filter((_,i)=>sc[i]==mx);if(mx==1&&g.left.length==2&&g.left[0]!=g.left[1]){const big=Math.max(...L.map(m=>m[1]));L=L.filter(m=>m[1]==big)}return L}
function bgRoll(g){const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);g.dice=[a,b];g.left=a==b?[a,a,a,a]:[a,b];g.rn=(g.rn||0)+1;g.mv=bgLegal(g,g.turn)}
function bg(R,i,m){const G=R.G;if(i<0)return 'Solo los jugadores pueden jugar Backgammon.';const L=G.bgs=G.bgs||[],op=m.op,g=L.find(x=>x.id===m.id);
 const busy=k=>L.some(x=>x.st!='end'&&x.p.includes(k));
 if(op=='inv'){const k=m.k;if(!(k>=0&&k<G.players.length)||k==i||R.players[k].out)return 'Ese jugador no puede jugar.';
  if(busy(i))return 'Ya tienes una partida de Backgammon abierta.';if(busy(k))return G.players[k].name+' ya está en otra partida de Backgammon.';
  G.bgs=L.filter(x=>!x.p.includes(i)&&!x.p.includes(k));G.bgs.push({id:G.bgn=(G.bgn||0)+1,p:[i,k],st:'inv',w:-1,pts:bgStart(),bar:[0,0],off:[0,0],turn:0,dice:[0,0],left:[],mv:[],last:null});return}
 if(!g||!g.p.includes(i))return 'Esa partida de Backgammon ya no existe.';const me=g.p.indexOf(i);
 if(op=='acc'){if(g.st!='inv'||me!=1)return;g.st='play';bgRoll(g);return}
 if(op=='end'){if(g.st=='play'){g.st='end';g.w=1-me;g.why='rindió';return}G.bgs=L.filter(x=>x!==g);return}
 if(g.st!='play')return 'La partida no está en juego.';if(g.turn!=me)return 'Es el turno de '+G.players[g.p[g.turn]].name+'.';
 const next=()=>{g.turn=1-g.turn;bgRoll(g)};
 if(op=='pass'){if(g.mv.length)return 'Todavía tienes jugadas posibles.';next();return}
 if(op=='move'){const mv=g.mv.find(x=>x[0]===m.from&&x[1]===m.die);if(!mv)return 'Esa jugada no se puede.';
  bgApply(g,me,...mv);g.last=[mv[0],mv[2],me];if(g.off[me]==15){g.st='end';g.w=me;g.left=[];g.mv=[];return}
  g.mv=bgLegal(g,me);if(!g.left.length||!g.mv.length)next();return}
 return 'Acción desconocida.'}
function act(R,tok,m){const G=R.G,i=R.players.findIndex(p=>p.tok==tok),H=R.host==tok,t=m.t,own=G&&G.phase=='play'&&i>=0&&i==G.turn;
 if(t=='c4')return c4(R,i,m);
 if(t=='bg')return bg(R,i,m);
 if(t=='ready'||t=='next'){if(G.phase!='end')return;if(t=='next'){if(!H)return 'Solo el host puede forzar la siguiente ronda.'}else if(i<0)return;else G.rd[i]=true;chkReady(R,t=='next');return}
 if(t=='buy'){if(G.phase!='play'||G.tdc||i<0||i==G.turn||!G.disc.length)return 'No puedes comprar ahora (quien tiene el turno ya tomó el descarte).';if(R.cl[R.players[i].id]==G.tc)return;R.cl[R.players[i].id]=G.tc;lg(G,i,'quiere comprar el descarte');return}
 if(t=='unbuy'){if(i<0||R.cl[R.players[i].id]!=G.tc)return 'Ya no tienes una compra que cancelar.';delete R.cl[R.players[i].id];lg(G,i,'canceló su compra');return}
 if(!own)return 'No es tu turno.';
 if(Date.now()<G.cdUntil)return 'Espera a que termine la cuenta regresiva.';
 const h=G.hands[i],has=x=>h.includes(x);
 if(t=='draw'){if(G.step!='draw')return 'Ya robaste.';G.note='';
  if(m.src=='deck'){const x=pull(G);if(x===undefined)return 'No quedan cartas.';h.push(x);lg(G,i,'robó del mazo');
   }
  else{if(!G.disc.length)return 'No hay descarte.';const d=G.disc.pop();h.push(d);lg(G,i,'tomó '+cn(d)+' del descarte',d);G.tdc=1}
  G.step='play';return}
 if(G.step!='play')return 'Primero roba una carta.';
 if(t=='down'){if(G.down[i])return 'Ya te bajaste.';const gs=Array.isArray(m.groups)?m.groups:[];
  if(gs.map(g=>g.type).sort().join('')!=CON[G.round].split('').sort().join(''))return 'El contrato está incompleto.';
  const all=gs.flatMap(g=>g.ids||[]);if(new Set(all).size!=all.length||!all.every(has))return 'Cartas inválidas.';
  const ms=[];for(const g of gs){const cs=g.ids.map(C),a=g.type=='T'?(trio(cs)?cs:null):(runOrd(cs)||runArr(cs));if(!a)return 'Combinación inválida.';ms.push({type:g.type,cards:a.map(c=>c.id),owner:i})}
  G.melds.push(...ms);lg(G,i,'se bajó');G.hands[i]=h.filter(x=>!all.includes(x));G.down[i]=true;R.pb=null;if(!G.hands[i].length)endRound(R,i);return}
 if(t=='pegar'){const mm=G.melds[m.k];if(!mm||!has(m.id))return 'Jugada inválida.';const c=C(m.id);let nc=null;
  if(G.down[i]){const cs=mm.cards.map(C),all=cs.concat(c);nc=mm.type=='T'?(trio(all)?all:null):(c.j&&m.end?(runOrd(m.end=='start'?[c].concat(cs):all)||runArr(all)):runArr(all))}
  if(nc){lg(G,i,'pegó '+cn(m.id),m.id);mm.cards=nc.map(x=>x.id);G.hands[i]=h.filter(x=>x!=m.id);if(!G.hands[i].length)endRound(R,i);return}
  if(swapJ(R,mm,c,i)){lg(G,i,'cambió un comodín por '+cn(m.id),m.id);return}
  return G.down[i]?'Esa carta no cabe ahí.':'Sin bajarte solo puedes cambiar un comodín (y usarlo para bajarte en este turno).'}
 if(t=='undoswap'){if(!R.pb)return;const b=JSON.parse(R.pb);G.melds=b.melds;G.hands[b.i]=b.hand;R.pb=null;return}
 if(t=='discard'){if(R.pb)return 'Debes bajarte este turno con el comodín que cambiaste, o deshacer el cambio.';if(!has(m.id))return 'Jugada inválida.';
  if(C(m.id).j)return 'Los comodines nunca se descartan: quédatelo hasta bajarte o pégalo en una combinación.'
  else if(fits(G,m.id)&&!h.filter(x=>!C(x).j).every(x=>fits(G,x)))return 'Esa carta cabe en una combinación de la mesa, no puedes descartarla.';
  G.hands[i]=h.filter(x=>x!=m.id);lg(G,i,'descartó '+cn(m.id),m.id);if(!G.hands[i].length){G.disc.push(m.id);endRound(R,i)}else{const bn=resolveBuy(R,i);G.disc.push(m.id);nextTurn(R);if(bn)G.note=bn}return}
 return 'Acción desconocida.'}

function start(R,m){const r0=Math.max(0,Math.min(6,Math.floor(+m.round)||0));
 R.G={phase:'play',players:R.players.map(p=>({id:p.id,name:p.name})),round:r0,r0,scores:[],tc:0};deal(R)}
function view(R,tok,me,now){const G=R.G;
 return {G:{...G,cd:Math.max(0,(G.cdUntil||0)-now),rc:Math.max(0,(G.rlUntil||0)-now),deck:G.deck?G.deck.length:0,hands:(G.hands||[]).map((h,i)=>i==me?h:h.length)},
  claim:me>=0&&R.cl[R.players[me].id]==G.tc,pend:!!R.pb}}
module.exports={id:'continental',name:'Continental',min:2,max:5,opts:{},start,view,act,kick,tick:chkReady};
