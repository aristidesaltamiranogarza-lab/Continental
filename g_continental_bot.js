// Bot de Continental (servidor). g_continental.js le pasa sus reglas: require('./g_continental_bot.js')(H) → bot(R,k) → {m, ms} o null.
// Una sola dificultad: arma el contrato con lo que tiene (corridas primero, tercias con lo que sobra), toma o compra el descarte si lo
// acerca al contrato, se baja en cuanto puede, pega todo lo que cabe y tira la carta alta que menos le sirve. Rechaza Conecta 4 y Backgammon.
module.exports=function(H){
const {C,pts,trio,runArr,runOrd,fits,CON}=H;
const rnd=(a,b)=>a+Math.random()*(b-a);   // antes de descartar espera 2–3 s: chance de que las personas compren el descarte
// mejor forma de armar el contrato con las cartas ids: {miss: cartas que le faltan, gs: grupos (ids con null = hueco; f = hueco que puede ir con comodín), jk, used}
function ev(ids,con){
 const cs=ids.map(C),nat=cs.filter(c=>!c.j),jk=cs.filter(c=>c.j).map(c=>c.id),byR={},byRS={},add=(o,k,id)=>(o[k]=o[k]||[]).push(id);
 nat.forEach(c=>{add(byR,c.r,c.id);add(byRS,c.s*15+c.r,c.id);if(c.r==1)add(byRS,c.s*15+14,c.id)});
 const slots=con.split('').sort(),T=[],RN=[],used=new Set();   // 'C' antes que 'T': las corridas piden cartas exactas
 for(const r in byR)T.push({t:'T',r:+r,c:Math.min(3,byR[r].length)});
 for(let s=0;s<4;s++)for(let st=1;st<=11;st++){let c=0;for(let p=st;p<st+4;p++)if(byRS[s*15+p])c++;if(c>1)RN.push({t:'C',s,st,c})}
 T.sort((a,b)=>b.c-a.c);RN.sort((a,b)=>b.c-a.c);const LT=T.slice(0,8),LC=RN.slice(0,14);
 function alloc(q){let ids,f=[];
  if(q.t=='T')ids=byR[q.r].filter(x=>!used.has(x)).slice(0,3);
  else{ids=[];let pj=false;for(let p=q.st;p<q.st+4;p++){const x=(byRS[q.s*15+p]||[]).find(y=>!used.has(y));ids.push(x===undefined?null:x);
   const can=x===undefined&&!pj;f.push(can);pj=can}}
  if(!ids.some(x=>x!=null))return null;ids.forEach(x=>x!=null&&used.add(x));
  return {t:q.t,ids,f,miss:q.t=='T'?3-ids.length:ids.filter(x=>x==null).length}}
 let best=null;
 function leaf(acc){let tm=0,gap=0,fill=0,nu=0;acc.forEach(g=>{nu+=g.ids.filter(x=>x!=null).length;if(g.t=='T')tm+=g.miss;else{gap+=g.miss;fill+=g.f.filter(Boolean).length}});
  const miss=tm+gap-Math.min(jk.length,fill),sc=miss*100-nu;
  if(!best||sc<best.sc)best={sc,miss,jk,gs:acc.map(g=>({...g,ids:g.ids.slice()})),used:new Set(used)}}
 function rec(i,from,acc){if(i==slots.length)return leaf(acc);
  const t=slots[i],L=t=='T'?LT:LC,f0=i&&slots[i-1]==t?from:0;let any=false;
  for(let q=f0;q<L.length;q++){const g=alloc(L[q]);if(!g)continue;any=true;acc.push(g);rec(i+1,q+1,acc);acc.pop();g.ids.forEach(x=>x!=null&&used.delete(x))}
  if(!any){acc.push({t,ids:[],f:t=='C'?[true,false,true,false]:[],miss:t=='T'?3:4,emp:1});rec(i+1,L.length,acc);acc.pop()}}
 rec(0,0,[]);return best}
// grupos para bajarse (miss 0), ya revisados con las mismas reglas del servidor
function build(e){const J=e.jk.slice(),gs=[];
 for(const g of e.gs){if(g.emp)return null;const ids=g.ids.map((x,i)=>x!=null?x:g.f[i]&&J.length?J.pop():null);if(ids.some(x=>x==null))return null;
  const cs=ids.map(C);if(g.t=='T'?!trio(cs):!(runOrd(cs)||runArr(cs)))return null;gs.push({type:g.t,ids})}
 return gs}
const fitM=(m,x)=>{const a=m.cards.map(C).concat(C(x));return m.type=='T'?trio(a):!!runArr(a)};
// qué tan amarrada está una carta a las demás (mismo número, o mismo palo y cerca)
function conn(x,h){const c=C(x),rs=c.r==1?[1,14]:[c.r];let s=0;
 h.forEach(y=>{if(y===x)return;const d=C(y);if(d.j)return;if(d.r==c.r)s+=2;else if(d.s==c.s){const dd=Math.min(...rs.flatMap(a=>(d.r==1?[1,14]:[d.r]).map(b=>Math.abs(a-b))));s+=dd==1?1.5:dd==2?1:0}});
 return s}
function pickDiscard(G,k,h,con){const nat=h.filter(x=>!C(x).j);if(!nat.length)return null;
 const all=nat.every(x=>fits(G,x)),cand=nat.filter(x=>all||!fits(G,x));
 if(G.down[k])return cand.map(x=>[-pts(C(x))+Math.random()*.1,x]).sort((a,b)=>a[0]-b[0])[0][1];
 const e0=ev(h,con);
 return cand.map(x=>[ev(h.filter(y=>y!==x),con).miss*1000+(e0.used.has(x)?50:0)+conn(x,h)*10-pts(C(x))+Math.random()*.1,x]).sort((a,b)=>a[0]-b[0])[0][1]}
function bot(R,k){const G=R.G,p=R.players[k];if(!G||!p||p.out)return null;
 const now=Date.now(),mem=R.bc=R.bc||{};if(Object.keys(mem).length>400)for(const x in mem)delete mem[x];
 // cada decisión se piensa una vez y sale a una hora fija, aunque botGo la vuelva a pedir
 const at=(key,a,b)=>{if(mem['t'+key]==null)mem['t'+key]=Math.max(now,G.cdUntil||0)+rnd(a,b);return Math.max(0,mem['t'+key]-now)};
 const once=(key,f)=>mem['m'+key]!==undefined?mem['m'+key]:(mem['m'+key]=f());
 if(G.phase=='end')return G.rd&&!G.rd[k]?{m:{t:'ready'},ms:at('r'+G.dn+':'+k,2000,4000)}:null;
 if(G.phase!='play')return null;
 for(const [t,L] of [['c4',G.c4s],['bg',G.bgs]]){const g=(L||[]).find(x=>x.st=='inv'&&x.p[1]==k);if(g)return {m:{t,op:'end',id:g.id},ms:at('i'+t+g.id,1500,3000)}}
 const h=G.hands[k],con=CON[G.round],dn=G.down[k],top=G.disc[G.disc.length-1];
 if(G.turn!=k){// comprar el descarte que el de turno deja pasar, si lo acerca al contrato (máximo 2 por ronda)
  if(dn||G.tdc||top===undefined||R.cl[p.id]==G.tc)return null;const bk='b'+G.tc+':'+k,nk='bn'+G.dn+':'+k;
  const yes=once(bk,()=>{if((mem[nk]||0)>=2||h.length>12+G.round)return false;const ok=ev(h.concat(top),con).miss<ev(h,con).miss;if(ok)mem[nk]=(mem[nk]||0)+1;return ok});
  return yes?{m:{t:'buy'},ms:at(bk,1200,2800)}:null}
 const key=G.tc+':'+G.step+':'+h.length+':'+G.melds.length;
 if(R.pb&&JSON.parse(R.pb).i==k)return {m:{t:'undoswap'},ms:at('u'+key,500,900)};
 if(G.step=='draw'){const m=once(key,()=>{let disc=top!==undefined&&(dn?fits(G,top):ev(h.concat(top),con).miss<ev(h,con).miss);
   if(!G.deck.length&&G.disc.length<2)disc=true;return {t:'draw',src:disc?'disc':'deck'}});return {m,ms:at(key,900,1800)}}
 const m=once(key,()=>{
  if(!dn){const e=ev(h,con);if(e.miss==0){const gs=build(e);if(gs)return {t:'down',groups:gs}}}
  else{const ord=h.slice().sort((a,b)=>C(a).j-C(b).j);for(const x of ord)for(let q=0;q<G.melds.length;q++)if(fitM(G.melds[q],x))return {t:'pegar',k:q,id:x}}
  const id=pickDiscard(G,k,h,con);return id==null?null:{t:'discard',id}});
 return m?{m,ms:at(key,m.t=='discard'?2000:700,m.t=='discard'?3000:1300)}:null}
return bot};
