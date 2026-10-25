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
function kick(R,k){const p=R.players[k],G=R.G;G.deck.push(...G.hands[k]);shuf(G.deck);G.hands[k]=[];delete R.cl[p.id];
 if(R.players.filter(x=>!x.out).length<2){G.phase='final';return}
 if(G.phase=='play'&&G.turn==k)nextTurn(R)}
function resolveBuy(R,i){const G=R.G,n=G.players.length;if(G.tdc||!G.disc.length)return '';
 const b=R.players.map((p,k)=>k).filter(k=>k!=i&&!R.players[k].out&&R.cl[R.players[k].id]==G.tc).sort((p,q)=>(p-i+n)%n-(q-i+n)%n)[0];if(b===undefined)return '';
 const dc=G.disc.pop();G.hands[b].push(dc);const y=pull(G);if(y!==undefined)G.hands[b].push(y);
 lg(G,b,'compró el descarte (+1 de castigo)',dc);return G.players[b].name+' compró el descarte (+1 carta de castigo).'}
function act(R,tok,m){const G=R.G,i=R.players.findIndex(p=>p.tok==tok),H=R.host==tok,t=m.t,own=G&&G.phase=='play'&&i>=0&&i==G.turn;
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
