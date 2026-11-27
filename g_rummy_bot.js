// Bot del Rummy de fichas. plan(mesa,atril,bajo) arma la mesa final de su turno y los pasos para mostrarla en vivo:
// sin primera bajada, solo grupos nuevos de su atril que sumen 30 o más; ya bajado: grupos nuevos, pegar fichas a la mesa,
// partir escaleras para meter un repetido, completar parejas con fichas que sobran en la mesa y recuperar comodines.
// bot(R,k): manda cada paso como mesa temporal (t:'tmp') con pausas de persona y al final t:'end'; si no puede jugar, pasa y roba.
const RU=require('./rummy_reglas.js'),{isJ,col,num,grp}=RU,J=52,CAP=40000;
const kd=x=>isJ(x)?J:col(x)*13+num(x)-1,cl=m=>m.map(g=>g.slice()),ok=g=>!!grp(g);
// ---- grupos abstractos (por clase de ficha: color*13+número-1, 52 = comodín) que se pueden hacer con cnt ----
function grupos(cnt){const nj=Math.min(cnt[J],2),G=[];
 for(let n=1;n<=13;n++){const C=[0,1,2,3].filter(c=>cnt[c*13+n-1]);
  for(let m=1;m<1<<C.length;m++){const S=C.filter((_,i)=>m>>i&1);if(S.length<2)continue;
   for(const s of [3,4]){const j=s-S.length;if(j>=0&&j<=nj)G.push(S.map(c=>c*13+n-1).concat(Array(j).fill(J)))}}}
 for(let c=0;c<4;c++)for(let a=1;a<=13;a++){if(!cnt[c*13+a-1])continue;
  for(let b=a+1;b<=13;b++){if(!cnt[c*13+b-1])continue;const g=[];let j=0;
   for(let v=a;v<=b;v++){if(cnt[c*13+v-1])g.push(c*13+v-1);else{g.push(J);j++}}if(j>nj)break;
   if(g.length>=3)G.push(g);else if(j<nj)G.push(b<13?g.concat(J):[J].concat(g))}}
 const seen=new Set();return G.filter(g=>{const s=g.join();if(seen.has(s))return false;seen.add(s);return true})}
const pts=g=>{const r=grp(g.map(k=>k==J?104:k));return r?r.pts:0};
// mejor juego de grupos disjuntos del atril: más fichas, menos comodines gastados; min: puntos mínimos (primera bajada)
function mejor(atril,min){const cnt=Array(53).fill(0);atril.forEach(x=>cnt[kd(x)]++);
 const L=grupos(cnt),por=Array.from({length:52},()=>[]);L.sort((a,b)=>b.length-a.length).forEach(g=>{const f=Math.min(...g.filter(k=>k!=J));por[f].push(g)});
 let best={s:0,sel:[]},nodes=0;const sel=[];
 const usa=(g,d)=>g.forEach(k=>cnt[k]+=d),cabe=g=>{const t={};return g.every(k=>(t[k]=(t[k]||0)+1)<=cnt[k])};
 function dfs(i,ti,tj,tp){if(++nodes>CAP)return;
  while(i<52&&!cnt[i])i++;
  if(i>=52){const s=ti-tj*.35;if((!min||tp>=min)&&s>best.s)best={s,sel:sel.slice()};return}
  for(const g of por[i])if(cabe(g)){usa(g,-1);sel.push(g);dfs(i,ti+g.length,tj+g.filter(k=>k==J).length,tp+pts(g));sel.pop();usa(g,1)}
  cnt[i]--;dfs(i,ti,tj,tp);cnt[i]++}
 dfs(0,0,0,0);
 // de clases a ids del atril (en las escaleras el orden ya dice qué representa cada comodín)
 const ids={};atril.forEach(x=>(ids[kd(x)]=ids[kd(x)]||[]).push(x));
 return best.sel.map(g=>g.map(k=>ids[k].pop()))}
// ---- jugadas sobre la mesa (ya bajado). Cada una cambia M y A en su lugar y devuelve true si hizo algo ----
// pegar una ficha al principio o al final de un grupo; comodines solo si ya no le queda otra cosa en el atril
function pega(M,A){for(const x of A.slice().sort((a,b)=>isJ(a)-isJ(b))){if(isJ(x)&&A.some(y=>!isJ(y)))continue;
  for(const g of M){for(const h of [g.concat(x),[x].concat(g)])if(ok(h)){g.splice(0,g.length,...h);A.splice(A.indexOf(x),1);return true}}}return false}
// escalera 3-4-5-6-7 y un 5 repetido en el atril: 3-4-5 y 5-6-7
function parte(M,A){for(const x of A){if(isJ(x))continue;for(let i=0;i<M.length;i++){const g=M[i],r=grp(g);if(!r||r.k!='esc'||r.c!=col(x))continue;
  const p=r.v.indexOf(num(x));if(p<0||isJ(g[p]))continue;
  for(const [a,b] of [[g.slice(0,p).concat(x),g.slice(p)],[g.slice(0,p+1),[x].concat(g.slice(p+1))]])if(ok(a)&&ok(b)){M.splice(i,1,a,b);A.splice(A.indexOf(x),1);return true}}}return false}
// pareja del atril + una ficha que le sobra a la mesa (punta de escalera de 4+, cualquiera de una serie de 4, o partir una escalera larga por en medio)
function presta(M,A){const R=A.filter(x=>!isJ(x));
 for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const a=R[i],b=R[j],par=num(a)==num(b)&&col(a)!=col(b)||col(a)==col(b)&&Math.abs(num(a)-num(b))<=2&&num(a)!=num(b);if(!par)continue;
  for(let gi=0;gi<M.length;gi++){const g=M[gi];if(g.length<4)continue;const op=[];
   op.push([0,[g.slice(1)]],[g.length-1,[g.slice(0,-1)]]);
   if(grp(g).k=='serie')for(let p=1;p<g.length-1;p++)op.push([p,[g.slice(0,p).concat(g.slice(p+1))]]);
   else for(let p=3;p<g.length-3;p++)op.push([p,[g.slice(0,p),g.slice(p+1)]]);
   for(const [p,rest] of op){const y=g[p];if(isJ(y)||!rest.every(ok))continue;const n=RU.arregla([a,b,y]);
    if(ok(n)){M.splice(gi,1,...rest,n);A.splice(A.indexOf(a),1);A.splice(A.indexOf(b),1);return true}}}}
 return false}
// comodín de la mesa por la ficha que representa; el comodín tiene que volver a la mesa en este turno (si no, no se hace)
function comodin(M,A,pasos){const rp=RU.reps(M);
 for(const jk in rp){const r=rp[jk],x=A.find(z=>!isJ(z)&&num(z)==r.n&&(r.k=='esc'?col(z)==r.c:r.falt.includes(col(z))));if(x==null)continue;
  const M2=cl(M),A2=A.slice(),g=M2.find(g=>g.includes(+jk));g[g.indexOf(+jk)]=x;A2.splice(A2.indexOf(x),1);A2.push(+jk);
  if(!ok(g))continue;const P2=[cl(M2)];resto(M2,A2,P2);
  if(!A2.includes(+jk)){M.splice(0,M.length,...M2);A.splice(0,A.length,...A2);pasos.push(...P2);return true}}
 return false}
// todo lo que se puede hacer después de bajar, paso por paso
function resto(M,A,pasos){const nv=mejor(A,0);nv.forEach(g=>{M.push(g);g.forEach(x=>A.splice(A.indexOf(x),1));pasos.push(cl(M))});
 for(let n=0;n<60;n++){if(pega(M,A)||parte(M,A)||presta(M,A)){pasos.push(cl(M));continue}
  const nv=mejor(A,0);if(nv.length){nv.forEach(g=>{M.push(g);g.forEach(x=>A.splice(A.indexOf(x),1))});pasos.push(cl(M));continue}break}}
function plan(mesa,atril,bajo){const M=cl(mesa),A=atril.slice(),pasos=[];
 if(!bajo){const nv=mejor(A,RU.MIN1);nv.forEach(g=>{M.push(g);g.forEach(x=>A.splice(A.indexOf(x),1));pasos.push(cl(M))})}
 else{resto(M,A,pasos);while(A.length&&comodin(M,A,pasos));}
 if(!pasos.length)return null;
 const r=RU.check(mesa,atril,M,bajo);if(r.err){if(bajo){const s=plan0(mesa,atril);if(s)return s}return null}
 return {mesa:M,pasos}}
// respaldo: solo grupos nuevos del atril (siempre válido si el atril lo permite)
function plan0(mesa,atril){const M=cl(mesa),pasos=[];mejor(atril,0).forEach(g=>{M.push(g);pasos.push(cl(M))});
 return pasos.length&&!RU.check(mesa,atril,M,true).err?{mesa:M,pasos}:null}
// ---- turno en vivo: piensa, va poniendo los pasos como mesa temporal y cierra ----
const rnd=(a,b)=>a+Math.random()*(b-a),jj=m=>JSON.stringify(m.filter(g=>g.length));
function bot(R,k){const G=R.G;if(!G||G.phase!='play'||G.turn!==k||G.out[k])return null;
 const now=Date.now(),mem=R.rbm=R.rbm&&R.rbm.tc==G.tc?R.rbm:{tc:G.tc},fin=G.at-1500;
 if(!mem.p){mem.p=plan(G.mesa,G.racks[k],G.down[k])||{pasos:[]};mem.i=0;const n=mem.p.pasos.length;
  mem.gap=Math.min(rnd(650,1100),Math.max(150,(fin-now-2500)/(n+1)));mem.at=Math.min(now+rnd(1600,3400),fin-mem.gap*(n+1))}
 const P=mem.p.pasos;
 if(mem.i<P.length&&G.tmp&&jj(G.tmp)==jj(P[mem.i])){mem.i++;mem.at=now+mem.gap*(mem.i<P.length?1:1.3)}
 const ms=Math.max(0,Math.min(mem.at,fin)-now);
 if(!P.length)return {m:{t:'end',mesa:null},ms};
 if(mem.i<P.length)return {m:{t:'tmp',mesa:P[mem.i]},ms};
 return {m:{t:'end',mesa:mem.p.mesa},ms}}
module.exports={bot,plan,mejor};
