// Bot de Monopoly Deal (servidor). g_monopolydeal.js le pasa sus ayudas: require('./g_monopolydeal_bot.js')(H) → bot(R,k) → {ms, m} o null.
// Juega como una persona por act(): responde cobros y robos (paga lo más barato, usa «Di que no» cuando vale la pena), y en su turno
// prioriza: robar 2, completar sets, Trato sucio, Ladrón útil, propiedades, casa/hotel, rentas y cobros al más rico, dinero al banco; descarta lo menos útil.
module.exports=function(H){
const {CAT,NEED,cmp,hasBase,rentAmt,autoIds,assets,others,SK,ok}=H;
const v=id=>CAT[id].v,sum=ids=>ids.reduce((a,x)=>a+v(x),0);
const T=(a,b)=>a+Math.floor(Math.random()*(b-a));
const inc=(G,k)=>Object.keys(G.tb[k]).filter(c=>!cmp(G.tb[k][c],c)).flatMap(c=>G.tb[k][c].map(id=>({id,col:+c})));
const worth=(G,k)=>sum(assets(G,k).map(a=>a.id));
const cnt=(G,k,col)=>(G.tb[k][col]||[]).length;
const done=(G,k,col)=>cmp(G.tb[k][col],col);
// colores donde puede ir un comodín, del más avanzado (sin pasarse de completo) al menos
function bestCol(G,k,c){const cs=c.cs=='any'?[0,1,2,3,4,5,6,7,8,9]:c.cs;
 const ok=cs.filter(col=>!done(G,k,col)&&(c.cs!='any'||hasBase(G.tb[k][col]||[])));
 if(!ok.length)return c.cs=='any'?null:cs[0];return ok.sort((a,b)=>(cnt(G,k,b)/NEED[b])-(cnt(G,k,a)/NEED[a])||NEED[a]-NEED[b])[0]}
// ¿esta carta de la mano completa un set?
function completes(G,k,id){const c=CAT[id];if(c.t=='p')return cnt(G,k,c.c)+1>=NEED[c.c]&&!done(G,k,c.c);
 if(c.t=='w'){const col=bestCol(G,k,c);return col!=null&&cnt(G,k,col)+1>=NEED[col]&&!done(G,k,col)}return false}
function respond(R,k){const G=R.G,pa=G.pa,x=pa.tg.find(y=>y.k==k),h=G.hands[k],dn=h.find(id=>CAT[id].k=='dino');
 if(x&&x.st=='wait'){
  if(SK(pa.k)){const big=pa.k=='deal'||(pa.k=='forced'&&done(G,pa.by,+Object.keys(G.tb[pa.by]).find(c=>G.tb[pa.by][c].includes(pa.give))))||h.filter(id=>CAT[id].k=='dino').length>1;
   return {ms:T(1400,2400),m:dn!=null&&(big||pa.k=='sly')?{t:'dino',id:dn}:{t:'allow'}}}
  const w=worth(G,k);if(dn!=null&&(pa.amt>=5||(pa.amt>=3&&pa.amt>=w*.4)))return {ms:T(1400,2400),m:{t:'dino',id:dn}};
  return {ms:T(1500,2600),m:{t:'pay',ids:autoIds(G,k,pa.amt)}}}
 if(k==pa.by){const s=pa.tg.find(y=>y.st=='say');if(!s)return null;
  return {ms:T(1300,2200),m:dn!=null&&(pa.k=='deal'||pa.amt>=4)?{t:'dino',id:dn,k:s.k}:{t:'accept',k:s.k}}}
 return null}
// qué descartar: lo que menos sirve (dinero chico, rentas sin propiedades, acciones de poco valor); nunca «Di que no» si hay otra
function discard(G,k){const h=G.hands[k];const score=id=>{const c=CAT[id];if(c.k=='dino')return 100;if(c.k=='tratosucio')return 90;if(c.t=='p'||c.t=='w')return 60+v(id);
 if(c.t=='r'){const cs=c.cs=='any'?[0,1,2,3,4,5,6,7,8,9]:c.cs;return cs.some(x=>rentAmt(G,k,x)>0)?40:5}if(c.t=='m')return 20+v(id);return 15+v(id)};
 return h.slice().sort((a,b)=>score(a)-score(b))[0]}
function turn(R,k){const G=R.G,h=G.hands[k],riv=others(R,k),ms=T(900,1700),M=m=>({ms,m});
 const C=[];const has=kd=>h.filter(id=>CAT[id].k==kd),left=3-G.plays;
 // 1. Pasa por la salida (más opciones)
 const go=has('salida')[0];if(go!=null&&left>=2)C.push({t:'go',id:go});
 // 2. propiedades que completan un set
 for(const id of h)if(completes(G,k,id)){const c=CAT[id];C.push(c.t=='p'?{t:'prop',id}:{t:'prop',id,col:bestCol(G,k,c)})}
 // 3. Trato sucio: el set completo más caro de un rival
 const db=has('tratosucio')[0];if(db!=null){let b=null;riv.forEach(x=>Object.keys(G.tb[x]).forEach(c=>{if(done(G,x,c)){const r=rentAmt(G,x,+c);if(!b||r>b.r)b={x,c:+c,r}}}));if(b)C.push({t:'deal',id:db,tgt:b.x,col:b.c})}
 // 4. Ladrón: una propiedad que le sirva (de un color que ya junta), si no, la más cara
 const sly=has('ladron')[0];if(sly!=null){let b=null;riv.forEach(x=>inc(G,x).forEach(p=>{if(CAT[p.id].t=='a')return;const s=(cnt(G,k,p.col)?10+cnt(G,k,p.col)/NEED[p.col]*10:0)+v(p.id);if(!b||s>b.s)b={x,id:p.id,s}}));if(b&&b.s>=3)C.push({t:'sly',id:sly,tgt:b.x,take:b.id})}
 // 5. propiedades y comodines
 for(const id of h){const c=CAT[id];if(c.t=='p')C.push({t:'prop',id});if(c.t=='w'){const col=bestCol(G,k,c);if(col!=null&&(c.cs!='any'||hasBase(G.tb[k][col]||[])))C.push({t:'prop',id,col})}}
 // 6. casa y hotel
 for(const kd of ['hotel','casa']){const id=has(kd)[0];if(id==null)continue;const cs=Object.keys(G.tb[k]).map(Number).filter(c=>c<8&&done(G,k,c)&&(kd=='casa'?(G.hs[k][c]||{}).h==null:(G.hs[k][c]||{}).h!=null&&(G.hs[k][c]||{}).hh==null));
  if(cs.length)C.push({t:kd=='casa'?'house':'hotel',id,col:cs.sort((a,b)=>rentAmt(G,k,b)-rentAmt(G,k,a))[0]})}
 const rich=riv.filter(x=>worth(G,x)>0).sort((a,b)=>worth(G,b)-worth(G,a));
 // 7. renta (con doble renta si alcanza y vale la pena)
 if(rich.length)for(const id of h){const c=CAT[id];if(c.t!='r')continue;const cs=(c.cs=='any'?[0,1,2,3,4,5,6,7,8,9]:c.cs).filter(x=>rentAmt(G,k,x)>0);if(!cs.length)continue;
  const col=cs.sort((a,b)=>rentAmt(G,k,b)-rentAmt(G,k,a))[0],amt=rentAmt(G,k,col);if(amt<2&&left>1&&h.length<6)continue;
  const dbl=has('doble').slice(0,Math.max(0,Math.min(2,left-1))).filter(()=>amt>=2);const m={t:'rent',id,col,doubles:dbl};if(c.cs=='any')m.tgt=rich[0];C.push(m)}
 // 8. cobro y cumpleaños
 const dc=has('cobro')[0];if(dc!=null&&rich.length)C.push({t:'cobro',id:dc,tgt:rich[0]});
 const bd=has('cumple')[0];if(bd!=null&&rich.length)C.push({t:'bday',id:bd});
 // 9. Trato forzoso: da su peor propiedad suelta por una que le sirva
 const fd=has('forzoso')[0];const mine=inc(G,k).filter(p=>CAT[p.id].t!='a');if(fd!=null&&mine.length){const give=mine.sort((a,b)=>cnt(G,k,a.col)/NEED[a.col]-cnt(G,k,b.col)/NEED[b.col]||v(a.id)-v(b.id))[0];let b=null;
  riv.forEach(x=>inc(G,x).forEach(p=>{if(CAT[p.id].t=='a'||p.col==give.col||!cnt(G,k,p.col))return;const s=cnt(G,k,p.col)/NEED[p.col];if(!b||s>b.s)b={x,id:p.id,s}}));
  if(b&&b.s>cnt(G,k,give.col)/NEED[give.col])C.push({t:'forced',id:fd,tgt:b.x,take:b.id,give:give.id})}
 // 10. dinero al banco; si el banco está flaco, también acciones que no va a usar
 const bank=sum(G.bank[k]);const mo=h.filter(id=>CAT[id].t=='m').sort((a,b)=>v(b)-v(a))[0];if(mo!=null)C.push({t:'bank',id:mo});
 if(bank<8){const weak=h.filter(id=>{const c=CAT[id];if(c.t=='a')return !['dino','tratosucio'].includes(c.k)&&v(id)>0;if(c.t=='r')return true;return false}).sort((a,b)=>v(b)-v(a))[0];if(weak!=null)C.push({t:'bank',id:weak})}
 C.push({t:'end'});for(const m of C)if(ok(R,k,m))return M(m);return M({t:'end'})}
return function bot(R,k){const G=R.G;if(!G||G.phase!='play'||R.players[k].out)return null;
 if(G.pa)return respond(R,k);
 if(G.turn!=k)return null;
 const wait=(G.cdUntil||0)-Date.now();if(wait>0)return {ms:wait+400,m:turn(R,k).m};
 if(G.step=='disc')return {ms:T(700,1200),m:{t:'discard',id:discard(G,k)}};
 if(G.plays>=3)return {ms:T(700,1200),m:{t:'end'}};
 return turn(R,k)}};
