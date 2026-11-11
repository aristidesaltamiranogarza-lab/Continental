// /prueba (solo localhost): sala nueva de Continental con 5 jugadores y todos ya bajados. ?r=ronda (0–6), ?n=jugadores (2–5)
// ?g=uno: partida de Uno ya empezada contra bots
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
module.exports=(req,res,q,{rooms,GAMES,mkP,rnd,cr,bump})=>{
 const ip=req.socket.remoteAddress||'';if(!/^(::1|127\.|::ffff:127\.)/.test(ip)){res.writeHead(404);return res.end()}
 const c=rnd(5),t=cr.randomBytes(12).toString('hex'),n=Math.max(2,Math.min(5,+q.get('n')||5));
 const uno=q.get('g')==='uno',R=rooms[c]={code:c,gt:uno?'uno':'continental',opts:{},host:t,players:[mkP(t,q.get('name')||'Tío Lentejas')],G:null,v:1,w:[],cl:{},kk:[],pb:null,chat:[],lc:{},ts:Date.now()};
 R.poke=()=>bump(R);
 ['Ana','Beto','Caro','Dani'].slice(0,n-1).forEach(nm=>R.players.push(Object.assign(mkP(cr.randomBytes(12).toString('hex'),nm),uno?{bot:true}:{})));
 if(uno)GAMES.uno.start(R);else{GAMES.continental.start(R,{round:+q.get('r')||0});bajaTodos(R)}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
 res.end('<script>localStorage.setItem("cont_s",JSON.stringify({c:"'+c+'",t:"'+t+'"}));localStorage.setItem("cont_g","'+R.gt+'");location.replace("/")</script>')};
