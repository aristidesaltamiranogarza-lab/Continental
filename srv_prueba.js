// /prueba (solo localhost): sala nueva de Continental con 5 jugadores y todos ya bajados. ?r=ronda (0–6), ?n=jugadores (2–5; Uno 2–8) · &casa=caja: abre la partida en la mesa de la casona · &mano=N: tu mano con N cartas, nadie bajado y los demás son bots (menú de c_prueba_mano.js)
// ?g=uno: partida de Uno ya empezada contra bots · ?g=merida: Mérida en orden de salida (los demás ya tiraron)
// ?g=merida&casas=1: ya jugando, es tu turno, $3000 y los cuatro primeros grupos de colonias completos (para el modo enfoque de construir)
// ?g=md: Monopoly Deal contra bots, tu turno (&mesa=1: todos con banco, sets y comodines puestos; &disc=N: te sobran N cartas y toca descartar)
// ?g=merida&casas=1&hotel=1: igual, pero cada colonia ya con 4 casas (para ver caer el hotel)
// Mérida: los demás son bots; con &aus=1 son personas sin conexión (el bot solo tira, paga y termina por ellas)
const CON=['TT','TC','CC','TTT','TTC','CCT','CCC'];
function saca(G,b){const k=G.deck.findIndex(x=>x%53==b);return k<0?null:G.deck.splice(k,1)[0]}
function bajaTodos(R){const G=R.G;let v=0;
 G.players.forEach((_,i)=>{if(G.down[i])return;const ms=[];
  for(const t of CON[G.round]){let cs=null;
   for(let n=0;n<13&&!cs;n++){const r0=(v++)%(t=='T'?13:10),s0=v%4;   // T: tres del mismo número; C: cuatro seguidas del mismo palo
    const bs=t=='T'?[0,1,2].map(k=>((s0+k)%4)*13+r0):[0,1,2,3].map(k=>s0*13+r0+k),got=[];
    for(const b of bs){const c=saca(G,b);if(c==null)break;got.push(c)}
    if(got.length==bs.length)cs=got;else G.deck.push(...got)}
   if(cs)ms.push({type:t,cards:cs,owner:i})}
  const n=ms.reduce((a,m)=>a+m.cards.length,0),h=G.hands[i];
  G.deck.push(...h.splice(0,Math.min(n,h.length-1)));   // la mano baja lo mismo que bajó (se queda con al menos una)
  G.melds.push(...ms);G.down[i]=true});
 G.rlUntil=G.cdUntil=0}
// Monopoly Deal: empieza tu turno; con mesa, cada quien ya tiene billetes, un set completo, otro a medias y un comodín
function mdPrueba(R,MG,mesa,dz){MG.start(R);const G=R.G,C=MG.CAT,toma=f=>{const j=G.deck.findIndex(x=>f(C[x]));return j<0?null:G.deck.splice(j,1)[0]};
 if(G.turn!==0){G.turn=0;G.plays=0;G.step='play';for(let j=0;j<2;j++)G.hands[0].push(G.deck.pop())}
 if(mesa)G.players.forEach((p,k)=>{const a=(k*2)%8,b=(k*2+1)%8;
  for(let j=0;j<MG.NEED[a];j++){const x=toma(c=>c.t=='p'&&c.c==a);if(x!=null)(G.tb[k][a]=G.tb[k][a]||[]).push(x)}
  {const x=toma(c=>c.t=='p'&&c.c==b);if(x!=null)(G.tb[k][b]=G.tb[k][b]||[]).push(x)}
  {const x=toma(c=>c.t=='w'&&c.cs!='any'&&c.cs.includes(b));if(x!=null)(G.tb[k][b]=G.tb[k][b]||[]).push(x)}
  for(let j=0;j<3+k%3;j++){const x=toma(c=>c.t=='m');if(x!=null)G.bank[k].push(x)}});
 if(mesa){const h=G.hands[0];['cobro','ladron','casa','dino'].forEach(n=>{const x=toma(c=>c.k==n);if(x!=null)h.push(x)});const r=toma(c=>c.t=='r'&&c.cs=='any');if(r!=null)h.push(r)}
 if(dz>0){const h=G.hands[0];while(h.length<7+dz&&G.deck.length)h.push(G.deck.pop());G.step='disc'}}
module.exports=(req,res,q,{rooms,GAMES,mkP,rnd,cr,bump})=>{
 const ip=req.socket.remoteAddress||'';if(!/^(::1|127\.|::ffff:127\.)/.test(ip)){res.writeHead(404);return res.end()}
 const c=rnd(5),t=cr.randomBytes(12).toString('hex'),n=Math.max(2,Math.min(q.get('g')==='uno'?8:5,+q.get('n')||5));
 const uno=q.get('g')==='uno',md=q.get('g')==='md',mer=q.get('g')==='merida',R=rooms[c]={code:c,gt:uno?'uno':md?'monopolydeal':mer?'merida':'continental',opts:md?{sets:3}:{},host:t,players:[mkP(t,q.get('name')||'Tío Lentejas')],G:null,v:1,w:[],cl:{},kk:[],pb:null,chat:[],lc:{},ts:Date.now()};
 R.poke=()=>bump(R);
 ['Lupe','Toño','Paty','Memo','Chuy','Rosa','Beto'].slice(0,n-1).forEach(nm=>R.players.push(Object.assign(mkP(cr.randomBytes(12).toString('hex'),nm,require('./bots_nombres.js').avDe(nm)),uno||md||(mer&&!q.get('aus'))||(q.get('mano')&&!mer)?{bot:true}:{})));
 if(mer){GAMES.merida.start(R);const G=R.G;let k=0;while(G.phase=='orden'&&G.turn!==0&&k++<50)GAMES.merida.act(R,R.players[G.turn].tok,{t:'roll'});
  if(q.get('casas')){k=0;while(G.phase=='orden'&&k++<80)GAMES.merida.act(R,R.players[G.turn].tok,{t:'roll'});const B=require('./merida_data.js').board;
   B.forEach((s,i)=>{if(s.t=='p'&&s.g<4){G.own[i]=0;if(q.get('hotel'))G.hs[i]=4}});G.cash[0]=3000;if(G.seq){const j=G.seq.indexOf(0);G.seq=G.seq.slice(j).concat(G.seq.slice(0,j))}G.turn=0}
  // bot=1: te toca a ti; al pasar el turno, el bot que sigue pone un hotel (en 37) y una casa (en 29), sin dinero para más
  if(q.get('bot')){k=0;while(G.phase=='orden'&&k++<80)GAMES.merida.act(R,R.players[G.turn].tok,{t:'roll'});
   if(G.seq){const j=G.seq.indexOf(0);G.seq=G.seq.slice(j).concat(G.seq.slice(0,j))}G.turn=0;const b=G.seq?G.seq[1]:1;
   [37,39,26,28,29].forEach(i=>G.own[i]=b);Object.assign(G.hs,{37:4,39:5,26:1,28:1,29:0});G.cash[b]=560}
  // grupos=1: cada jugador con grupos de color completos (0..7 repartidos) y dinero de sobra, para ver construir casas y hoteles
  if(q.get('grupos')){k=0;while(G.phase=='orden'&&k++<80)GAMES.merida.act(R,R.players[G.turn].tok,{t:'roll'});const B=require('./merida_data.js').board,np=R.players.length;
   B.forEach((s,i)=>{if(s.t=='p')G.own[i]=s.g%np});G.cash=G.cash.map(()=>999999);if(G.seq){const j=G.seq.indexOf(0);G.seq=G.seq.slice(j).concat(G.seq.slice(0,j))}G.turn=0}}else if(md)mdPrueba(R,GAMES.monopolydeal,q.get('mesa'),+q.get('disc')||0);else if(uno)GAMES.uno.start(R);else{GAMES.continental.start(R,{round:+q.get('r')||0});if(!q.get('mano'))bajaTodos(R)}
 // &mano=N: tu mano con N cartas sacadas del mazo (Continental sin bajarse nadie), para probar manos grandes
 {const mn=+q.get('mano'),G=R.G;if(mn&&G&&G.hands&&Array.isArray(G.hands[0])&&Array.isArray(G.deck)){const h=G.hands[0];while(h.length<mn&&G.deck.length)h.push(G.deck.pop())}}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
 res.end('<script>localStorage.setItem("cont_s",JSON.stringify({c:"'+c+'",t:"'+t+'"}));localStorage.setItem("cont_g","'+R.gt+'");location.replace("/'+(q.get('casa')?'?casa='+encodeURIComponent(q.get('casa')):'')+'")</script>')};
