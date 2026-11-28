// Conecta 4 y Backgammon de la Casa 3D (reglas). Los usa g_casajuegos.js (vía g_continental.js, que los reexporta).
// ---- Conecta 4: partidas de 2 jugadores ----
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
// jugadas de varios dados con la misma ficha (p. ej. 6 y 2 -> también la suma): [desde, hasta, dados]
function bgCombos(g,p){const out=[],seen=new Set(g.mv.map(m=>m[0]+'>'+m[2]));
 const rec=(c,from,cur,ds,L)=>{for(const m of L){if(m[0]!==cur||m[2]===-1&&!ds.length)continue;const c2=bgCl(c);bgApply(c2,p,...m);const d2=[...ds,m[1]];
  if(d2.length>1){const k=from+'>'+m[2];if(!seen.has(k)){seen.add(k);out.push([from,m[2],d2])}}if(m[2]!==-1&&c2.left.length)rec(c2,from,m[2],d2,bgLegal(c2,p))}};
 for(const f of new Set(g.mv.map(m=>m[0])))rec(bgCl(g),f,f,[],g.mv);return out}
function bgSet(g,p){g.mv=bgLegal(g,p);g.mv2=g.mv.length?bgCombos(g,p):[]}
function bgRoll(g){const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);g.dice=[a,b];g.left=a==b?[a,a,a,a]:[a,b];g.rn=(g.rn||0)+1;bgSet(g,g.turn)}
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
  bgApply(g,me,...mv);g.last=[mv[0],mv[2],me];if(g.off[me]==15){g.st='end';g.w=me;g.left=[];g.mv=[];g.mv2=[];return}
  bgSet(g,me);if(!g.left.length||!g.mv.length)next();return}
 if(op=='moves'){const c=g.mv2&&g.mv2.find(x=>x[0]===m.from&&Array.isArray(m.dice)&&x[2].join()==m.dice.join());if(!c)return 'Esa jugada no se puede.';
  let cur=c[0];for(const d of c[2]){const r=bg(R,i,{op:'move',id:g.id,from:cur,die:d});if(r||g.st!='play'||g.turn!=me)return r;cur=g.last[1]}return}
 return 'Acción desconocida.'}
module.exports={c4,bg};
