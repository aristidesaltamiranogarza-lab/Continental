// Servidor de juegos de cartas (Continental, Uno, Monopoly Deal...). Sin dependencias.  Uso: node server.js  (PORT=8080 node server.js para otro puerto)
// Núcleo: salas, polling, chat, expulsar, reconexión. Cada juego es un módulo g_*.js con: id,name,min,max,opts,start,view,act,kick,tick
const http=require('http'),fs=require('fs'),path=require('path'),cr=require('crypto'),PORT=process.env.PORT||3000;
const GAMES={continental:require('./g_continental.js'),uno:require('./g_uno.js'),monopolydeal:require('./g_monopolydeal.js')},ALF='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',rooms={};
const files={'/':['continental.html','text/html; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/game.js':['game.js','text/javascript; charset=utf-8'],
 '/c_continental.js':['c_continental.js','text/javascript; charset=utf-8'],'/c_uno.js':['c_uno.js','text/javascript; charset=utf-8'],'/c_monopolydeal.js':['c_monopolydeal.js','text/javascript; charset=utf-8']};
const out=(res,o,c=200)=>{res.writeHead(c,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(o))};
const rnd=n=>Array.from({length:n},()=>ALF[Math.random()*32|0]).join('');
const body=req=>new Promise(r=>{let b='';req.on('data',d=>{b+=d;if(b.length>1e5)req.destroy()});req.on('end',()=>{try{r(JSON.parse(b||'{}'))}catch(e){r({})}})});
const mkP=(tok,name)=>({tok,id:cr.randomBytes(4).toString('hex'),name:String(name||'Jugador').trim().slice(0,14)||'Jugador',seen:Date.now()});
// ---- vista y sincronización ----
// espectadores (R.spec): ven la partida como el host que no juega (me = -1, sin ver cartas de nadie) y pueden chatear
const specOf=(R,tok)=>(R.spec||[]).find(s=>s.tok==tok);
function view(R,tok){const me=R.players.findIndex(p=>p.tok==tok),now=Date.now(),M=GAMES[R.gt];
 const v={code:R.code,v:R.v,host:R.host==tok,me,game:R.gt,opts:R.opts,players:R.players.map(p=>({id:p.id,name:p.name,on:!!p.bot||now-p.seen<35000,out:!!p.out,bot:!!p.bot})),G:null,claim:false,pend:!!R.pb,chat:R.chat.slice(-40),
  watch:!!specOf(R,tok),spec:(R.spec||[]).filter(s=>now-s.seen<35000).map(s=>s.name),
  tt:R.G?now-(R.tt||now):0,tom:TOM_MS,fx:(R.fx||[]).filter(f=>now-f.ts<6000)};   // tt: cuánto lleva el turno; fx: tomates recientes
 if(R.G)Object.assign(v,M.view(R,tok,me,now));return v}
// ---- tomates 🍅: a quien se tarda más de TOM_MS en su turno se le pueden lanzar (jugadores y espectadores) ----
const TOM_MS=15000,turnKey=G=>G?[G.phase,G.turn,G.tc,G.round].join(':'):'';
function tomato(R,tok,i){const G=R.G,now=Date.now();if(!G||G.phase!='play'||G.turn==null)return 'No hay a quién lanzarle tomates.';const k=G.turn;
 if(k===i)return '¡No te puedes lanzar tomates a ti!';if(R.players[k]&&R.players[k].bot)return 'Los bots no se tardan 😉';
 if(now-(R.tt||now)<TOM_MS)return 'Todavía no se está tardando tanto.';const lt=R.lt=R.lt||{};if(now-(lt[tok]||0)<1200)return 'Más despacio.';lt[tok]=now;
 const sp=specOf(R,tok),from=i>=0?R.players[i].name:sp?sp.name:'Host';R.fx=(R.fx||[]).concat({n:R.fxn=(R.fxn||0)+1,t:'tom',from,k,ts:now}).slice(-12)}
function bump(R){const tk=turnKey(R.G);if(tk!==R.tk){R.tk=tk;R.tt=Date.now()}R.v++;R.ts=Date.now();const ws=R.w;R.w=[];ws.forEach(w=>{clearTimeout(w.t);out(w.res,view(R,w.tok))});botGo(R)}
// ---- bots: el módulo del juego decide (M.bot), aquí se agenda y se manda por act() como cualquier jugador ----
const BOTN=['🤖 Ana','🤖 Beto','🤖 Caro','🤖 Dani','🤖 Eli','🤖 Fer','🤖 Gabo','🤖 Hugo','🤖 Iris'];
function botGo(R){clearTimeout(R.bt);R.bt=null;const M=GAMES[R.gt];if(!R.G||!M.bot||!rooms[R.code])return;
 // de todos los bots, la jugada que toca primero
 let best=null;R.players.forEach((p,k)=>{if(!p.bot||p.out)return;const d=M.bot(R,k);if(d&&(!best||d.ms<best.ms))best=Object.assign({p},d)});if(!best)return;
 R.bt=setTimeout(()=>{R.bt=null;if(!rooms[R.code]||!R.G)return;let e=act(R,best.p.tok,best.m);
  // si algo falla: roba para no trabar la partida, o lo vuelve a pensar en un rato
  if(e){console.log('bot',best.p.name,e);if(best.m.t=='play')e=act(R,best.p.tok,{t:'draw'});if(e){R.bt=setTimeout(()=>botGo(R),3000);return}}
  bump(R)},Math.max(50,best.ms))}
function touch(R,pl){if(pl){const off=Date.now()-pl.seen>35000;pl.seen=Date.now();if(off)bump(R)}}
// ---- acciones comunes ----
function kick(R,k){const p=R.players[k];R.kk.push(p.tok);
 if(!R.G){R.players.splice(k,1);return}
 p.out=true;GAMES[R.gt].kick(R,k);delete R.cl[p.id]}
function act(R,tok,m){const G=R.G,M=GAMES[R.gt],i=R.players.findIndex(p=>p.tok==tok),H=R.host==tok,t=m.t;
 if(t=='chat'){const tx=String(m.text||'').trim().slice(0,300);if(!tx)return;if(Date.now()-(R.lc[tok]||0)<400)return 'Más despacio.';R.lc[tok]=Date.now();
  const sp=i<0&&specOf(R,tok);R.chat.push({k:i,name:i>=0?R.players[i].name:sp?'👁 '+sp.name:'Host',t:tx,ts:Date.now()});if(R.chat.length>60)R.chat.shift();return}
 if(t=='tomato')return tomato(R,tok,i);
 if(t=='kick'){if(!H)return 'Solo el host puede expulsar.';const k=R.players.findIndex(p=>p.id==m.id);if(k<0||R.players[k].tok==tok)return 'No se puede expulsar a ese jugador.';kick(R,k);if(M.tick)M.tick(R);return}
 if(t=='opts'){if(!H)return 'Solo el host puede cambiar las reglas.';if(G)return 'Ya empezó.';const o=m.o||{};for(const k in R.opts){const x=o[k],r=M.rng&&M.rng[k];if(typeof x=='boolean'&&typeof R.opts[k]=='boolean')R.opts[k]=x;else if(typeof x=='number'&&typeof R.opts[k]=='number'&&r&&x>=r[0]&&x<=r[1])R.opts[k]=Math.floor(x)}return}
 // la misma sala sirve para todos los juegos: entre partidas, el host elige a qué juegan
 if(t=='game'){if(!H)return 'Solo el host elige el juego.';if(G)return 'Termina primero esta partida.';const M2=GAMES[m.g];if(!M2)return 'Ese juego no existe.';if(m.g==R.gt)return;
  const ps=R.players.filter(p=>M2.bot||!p.bot);if(ps.length>M2.max)return 'Son demasiados para '+M2.name+' (máximo '+M2.max+').';
  if(ps.length<R.players.length)R.chat.push({k:-1,name:'🤖',t:M2.name+' todavía no tiene bots: salieron de la sala',ts:Date.now()});
  R.players=ps;R.gt=m.g;R.opts=Object.assign({},M2.opts);R.chat.push({k:-1,name:'🎲',t:'Ahora van a jugar '+M2.name,ts:Date.now()});return}
 if(t=='addbot'){if(!H)return 'Solo el host puede agregar bots.';if(G)return 'Ya empezó.';if(!M.bot)return 'Este juego todavía no tiene bots.';if(R.players.length>=M.max)return 'La sala está llena (máximo '+M.max+').';
  const nm=BOTN.find(x=>!R.players.some(p=>p.name==x))||'🤖 Bot';R.players.push(Object.assign(mkP(cr.randomBytes(12).toString('hex'),nm),{bot:true}));return}
 if(t=='start'){if(!H)return 'Solo el host puede empezar.';if(G)return 'Ya empezó.';const n=R.players.length;
  if(n<M.min||n>M.max)return 'Se necesitan de '+M.min+' a '+M.max+' jugadores.';M.start(R,m);return}
 if(!G)return 'No hay partida.';
 if(t=='reset'){R.players=R.players.filter(p=>!p.out);R.G=null;return}
 return M.act(R,tok,m)}
// ---- casa de juegos: quién anda caminando (posición, emote, lo que dijo) y qué salas hay en cada mesa ----
const casa={},EMO=['👋','😂','🎉','❤️','👍','😮','💃','🕺'];
function salas(){const now=Date.now();return Object.values(rooms).filter(R=>R.players.some(p=>!p.bot&&!p.out&&now-p.seen<35000)).map(R=>{const ps=R.players.filter(p=>!p.out),h=R.players.find(p=>p.tok==R.host);
 // c: código para unirse (solo si espera jugadores); w: código para ir a mirar (si ya empezó)
 return {c:R.G?null:R.code,w:R.G?R.code:null,g:R.gt,st:R.G?'play':'lobby',n:ps.length,max:GAMES[R.gt].max,host:h?h.name:'Host',ps:ps.slice(0,6).map(p=>p.name),sp:(R.spec||[]).filter(s=>now-s.seen<35000).length}})}
function casaAct(b){const now=Date.now(),id=String(b.id||'').slice(0,16);
 if(id){const o=casa[id]||(casa[id]={id,emT:0,sayT:0});o.name=String(b.name||'').trim().slice(0,14)||'Jugador';
  ['x','z','yaw'].forEach(k=>{const v=+b[k];if(isFinite(v))o[k]=Math.round(v*100)/100});o.w=b.w?1:0;
  if(EMO.includes(b.em)){o.em=b.em;o.emT=now}if(b.say){const s=String(b.say).trim().slice(0,80);if(s){o.say=s;o.sayT=now}}o.ts=now}
 for(const k in casa)if(now-casa[k].ts>8000)delete casa[k];
 return {p:Object.values(casa).filter(o=>o.id!==id).map(o=>({id:o.id,name:o.name,x:o.x,z:o.z,yaw:o.yaw,w:o.w,em:now-o.emT<3500?o.em:null,emN:o.emT,say:now-o.sayT<6000?o.say:null,sayN:o.sayT})),r:salas()}}
// ---- HTTP ----
http.createServer(async(req,res)=>{const u=new URL(req.url,'http://x'),p=u.pathname,q=u.searchParams;
 if(files[p]){res.writeHead(200,{'Content-Type':files[p][1],'Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,files[p][0])))}
 if(p=='/poll'){const R=rooms[q.get('c')],tok=q.get('t');if(!R)return out(res,{gone:1});
  if(R.kk.includes(tok))return out(res,{kicked:1});
  const pl=R.players.find(x=>x.tok==tok),sp=specOf(R,tok);if(!pl&&R.host!=tok&&!sp)return out(res,{gone:1});
  if(sp)sp.seen=Date.now();touch(R,pl);if(R.v>+q.get('v'))return out(res,view(R,tok));
  const w={res,tok,t:setTimeout(()=>{R.w=R.w.filter(x=>x!==w);touch(R,pl);if(sp)sp.seen=Date.now();out(res,{same:1})},25000)};R.w.push(w);
  req.on('close',()=>{clearTimeout(w.t);R.w=R.w.filter(x=>x!==w)});return}
 if(req.method!='POST'){res.writeHead(404);return res.end()}
 const b=await body(req);
 if(p=='/casa')return out(res,casaAct(b));
 if(p=='/new'){const code=rnd(5),tok=cr.randomBytes(12).toString('hex'),gt=GAMES[b.game]?b.game:'continental',
   R=rooms[code]={code,gt,opts:Object.assign({},GAMES[gt].opts),host:tok,players:[],G:null,v:1,w:[],cl:{},kk:[],pb:null,chat:[],lc:{},ts:Date.now()};
  R.poke=()=>bump(R);
  if(b.mode=='listo')R.players.push(mkP(tok,b.name));return out(res,{c:code,t:tok})}
 const R=rooms[String(b.c||'').toUpperCase()];if(!R)return out(res,{err:'No se encontró la sala. Revisa el código y que el servidor siga abierto.'});
 if(p=='/join'){const mx=GAMES[R.gt].max;if(R.G)return out(res,{err:'La partida ya empezó.'});if(R.players.length>=mx)return out(res,{err:'La sala está llena (máximo '+mx+').'});
  const tok=cr.randomBytes(12).toString('hex');R.players.push(mkP(tok,b.name));bump(R);return out(res,{c:R.code,t:tok})}
 // ir a mirar una partida (también sirve si todavía no empieza)
 if(p=='/watch'){const tok=cr.randomBytes(12).toString('hex'),nm=String(b.name||'').trim().slice(0,14)||'Alguien';(R.spec=R.spec||[]).push({tok,name:nm,seen:Date.now()});
  R.chat.push({k:-1,name:'👁',t:nm+' está mirando la partida',ts:Date.now()});if(R.chat.length>60)R.chat.shift();bump(R);return out(res,{c:R.code,t:tok})}
 if(p=='/act'){const tok=b.t,m=b.m||{},sp=specOf(R,tok);if(R.host!=tok&&!sp&&!R.players.some(x=>x.tok==tok&&!x.out))return out(res,{err:'No estás en la sala.'});
  if(sp&&m.t!='chat'&&m.t!='tomato')return out(res,{err:'Estás mirando: no puedes jugar en esta partida.'});
  if(m.t=='close'){if(R.host!=tok)return out(res,{err:'Solo el host puede cerrar la sala.'});delete rooms[R.code];R.w.forEach(w=>{clearTimeout(w.t);out(w.res,{gone:1})});return out(res,{ok:1})}
  const e=act(R,tok,m);if(e)return out(res,{err:e});bump(R);return out(res,{ok:1})}
 res.writeHead(404);res.end()}).listen(PORT,()=>console.log('Juegos de cartas listo en http://localhost:'+PORT));
setInterval(()=>{for(const c in rooms){const R=rooms[c],M=GAMES[R.gt],s=R.players.map(p=>p.bot||Date.now()-p.seen<35000?1:0).join('');const ph=R.G&&R.G.round+':'+R.G.phase;if(M.tick)M.tick(R);if(R.spec)R.spec=R.spec.filter(x=>Date.now()-x.seen<120000);if(s!==R.sig||(R.G&&R.G.round+':'+R.G.phase)!==ph){R.sig=s;bump(R)}if(Date.now()-R.ts>432e5)delete rooms[c]}},10000);
