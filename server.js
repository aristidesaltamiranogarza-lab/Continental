// Continental: servidor con el juego completo. Sin dependencias.  Uso: node server.js  (PORT=8080 node server.js para otro puerto)
const http=require('http'),fs=require('fs'),path=require('path'),cr=require('crypto'),PORT=process.env.PORT||3000;
const CON=['TT','TC','CC','TTT','TTC','CCT','CCC'],ALF='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',rooms={};
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
const files={'/':['continental.html','text/html; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/game.js':['game.js','text/javascript; charset=utf-8']};
const out=(res,o,c=200)=>{res.writeHead(c,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(o))};
const rnd=n=>Array.from({length:n},()=>ALF[Math.random()*32|0]).join('');
const body=req=>new Promise(r=>{let b='';req.on('data',d=>{b+=d;if(b.length>1e5)req.destroy()});req.on('end',()=>{try{r(JSON.parse(b||'{}'))}catch(e){r({})}})});
const mkP=(tok,name)=>({tok,id:cr.randomBytes(4).toString('hex'),name:String(name||'Jugador').trim().slice(0,14)||'Jugador',seen:Date.now()});
// ---- vista y sincronización ----
function view(R,tok){const me=R.players.findIndex(p=>p.tok==tok),G=R.G,now=Date.now();
 const v={code:R.code,v:R.v,host:R.host==tok,me,players:R.players.map(p=>({id:p.id,name:p.name,on:now-p.seen<35000,out:!!p.out})),G:null,claim:false,pend:!!R.pb,chat:R.chat.slice(-40)};
 if(G){v.G={...G,cd:Math.max(0,(G.cdUntil||0)-now),rc:Math.max(0,(G.rlUntil||0)-now),deck:G.deck?G.deck.length:0,hands:(G.hands||[]).map((h,i)=>i==me?h:h.length)};v.claim=me>=0&&R.cl[R.players[me].id]==G.tc}
 return v}
function bump(R){R.v++;R.ts=Date.now();const ws=R.w;R.w=[];ws.forEach(w=>{clearTimeout(w.t);out(w.res,view(R,w.tok))})}
function touch(R,pl){if(pl){const off=Date.now()-pl.seen>35000;pl.seen=Date.now();if(off)bump(R)}}
// ---- reglas ----
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
function kick(R,k){const p=R.players[k],G=R.G;R.kk.push(p.tok);
 if(!G){R.players.splice(k,1);return}
 p.out=true;G.deck.push(...G.hands[k]);shuf(G.deck);G.hands[k]=[];delete R.cl[p.id];
 if(R.players.filter(x=>!x.out).length<2){G.phase='final';return}
 if(G.phase=='play'&&G.turn==k)nextTurn(R)}
function resolveBuy(R,i){const G=R.G,n=G.players.length;if(G.tdc||!G.disc.length)return '';
 const b=R.players.map((p,k)=>k).filter(k=>k!=i&&!R.players[k].out&&R.cl[R.players[k].id]==G.tc).sort((p,q)=>(p-i+n)%n-(q-i+n)%n)[0];if(b===undefined)return '';
 const dc=G.disc.pop();G.hands[b].push(dc);const y=pull(G);if(y!==undefined)G.hands[b].push(y);
 lg(G,b,'compró el descarte (+1 de castigo)',dc);return G.players[b].name+' compró el descarte (+1 carta de castigo).'}
function act(R,tok,m){const G=R.G,i=R.players.findIndex(p=>p.tok==tok),H=R.host==tok,t=m.t,own=G&&G.phase=='play'&&i>=0&&i==G.turn;
 if(t=='chat'){const tx=String(m.text||'').trim().slice(0,300);if(!tx)return;if(Date.now()-(R.lc[tok]||0)<400)return 'Más despacio.';R.lc[tok]=Date.now();
  R.chat.push({k:i,name:i>=0?R.players[i].name:'Host',t:tx,ts:Date.now()});if(R.chat.length>60)R.chat.shift();return}
 if(t=='kick'){if(!H)return 'Solo el host puede expulsar.';const k=R.players.findIndex(p=>p.id==m.id);if(k<0||R.players[k].tok==tok)return 'No se puede expulsar a ese jugador.';kick(R,k);chkReady(R);return}
 if(t=='start'){if(!H)return 'Solo el host puede empezar.';if(G)return 'Ya empezó.';const r0=Math.max(0,Math.min(6,Math.floor(+m.round)||0)),n=R.players.length;if(n<2||n>5)return 'Se necesitan de 2 a 5 jugadores.';
  R.G={phase:'play',players:R.players.map(p=>({id:p.id,name:p.name})),round:r0,r0,scores:[],tc:0};deal(R);return}
 if(!G)return 'No hay partida.';
 if(t=='ready'||t=='next'){if(G.phase!='end')return;if(t=='next'){if(!H)return 'Solo el host puede forzar la siguiente ronda.'}else if(i<0)return;else G.rd[i]=true;chkReady(R,t=='next');return}
 if(t=='reset'){R.players=R.players.filter(p=>!p.out);R.G=null;return}
 if(t=='buy'){if(G.phase!='play'||G.tdc||i<0||i==G.turn||!G.disc.length)return 'No puedes comprar ahora (quien tiene el turno ya tomó el descarte).';if(R.cl[R.players[i].id]==G.tc)return;R.cl[R.players[i].id]=G.tc;lg(G,i,'quiere comprar el descarte');return}
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
// ---- HTTP ----
http.createServer(async(req,res)=>{const u=new URL(req.url,'http://x'),p=u.pathname,q=u.searchParams;
 if(files[p]){res.writeHead(200,{'Content-Type':files[p][1],'Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,files[p][0])))}
 if(p=='/poll'){const R=rooms[q.get('c')],tok=q.get('t');if(!R)return out(res,{gone:1});
  if(R.kk.includes(tok))return out(res,{kicked:1});
  const pl=R.players.find(x=>x.tok==tok);if(!pl&&R.host!=tok)return out(res,{gone:1});
  touch(R,pl);if(R.v>+q.get('v'))return out(res,view(R,tok));
  const w={res,tok,t:setTimeout(()=>{R.w=R.w.filter(x=>x!==w);touch(R,pl);out(res,{same:1})},25000)};R.w.push(w);
  req.on('close',()=>{clearTimeout(w.t);R.w=R.w.filter(x=>x!==w)});return}
 if(req.method!='POST'){res.writeHead(404);return res.end()}
 const b=await body(req);
 if(p=='/new'){const code=rnd(5),tok=cr.randomBytes(12).toString('hex'),R=rooms[code]={code,host:tok,players:[],G:null,v:1,w:[],cl:{},kk:[],pb:null,chat:[],lc:{},ts:Date.now()};
  if(b.mode=='listo')R.players.push(mkP(tok,b.name));return out(res,{c:code,t:tok})}
 const R=rooms[String(b.c||'').toUpperCase()];if(!R)return out(res,{err:'No se encontró la sala. Revisa el código y que el servidor siga abierto.'});
 if(p=='/join'){if(R.G)return out(res,{err:'La partida ya empezó.'});if(R.players.length>=5)return out(res,{err:'La sala está llena (máximo 5).'});
  const tok=cr.randomBytes(12).toString('hex');R.players.push(mkP(tok,b.name));bump(R);return out(res,{c:R.code,t:tok})}
 if(p=='/act'){const tok=b.t,m=b.m||{};if(R.host!=tok&&!R.players.some(x=>x.tok==tok&&!x.out))return out(res,{err:'No estás en la sala.'});
  if(m.t=='close'){if(R.host!=tok)return out(res,{err:'Solo el host puede cerrar la sala.'});delete rooms[R.code];R.w.forEach(w=>{clearTimeout(w.t);out(w.res,{gone:1})});return out(res,{ok:1})}
  const e=act(R,tok,m);if(e)return out(res,{err:e});bump(R);return out(res,{ok:1})}
 res.writeHead(404);res.end()}).listen(PORT,()=>console.log('Continental listo en http://localhost:'+PORT));
setInterval(()=>{for(const c in rooms){const R=rooms[c],s=R.players.map(p=>Date.now()-p.seen<35000?1:0).join('');const ph=R.G&&R.G.round+':'+R.G.phase;chkReady(R);if(s!==R.sig||(R.G&&R.G.round+':'+R.G.phase)!==ph){R.sig=s;bump(R)}if(Date.now()-R.ts>432e5)delete rooms[c]}},10000);
