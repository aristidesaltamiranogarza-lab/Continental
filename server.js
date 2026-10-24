// Servidor de juegos de cartas (Continental, Uno...). Sin dependencias.  Uso: node server.js  (PORT=8080 node server.js para otro puerto)
// Núcleo: salas, polling, chat, expulsar, reconexión. Cada juego es un módulo g_*.js con: id,name,min,max,opts,start,view,act,kick,tick
const http=require('http'),fs=require('fs'),path=require('path'),cr=require('crypto'),PORT=process.env.PORT||3000;
const GAMES={continental:require('./g_continental.js'),uno:require('./g_uno.js')},ALF='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',rooms={};
const files={'/':['continental.html','text/html; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/game.js':['game.js','text/javascript; charset=utf-8'],
 '/c_continental.js':['c_continental.js','text/javascript; charset=utf-8'],'/c_uno.js':['c_uno.js','text/javascript; charset=utf-8']};
const out=(res,o,c=200)=>{res.writeHead(c,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(o))};
const rnd=n=>Array.from({length:n},()=>ALF[Math.random()*32|0]).join('');
const body=req=>new Promise(r=>{let b='';req.on('data',d=>{b+=d;if(b.length>1e5)req.destroy()});req.on('end',()=>{try{r(JSON.parse(b||'{}'))}catch(e){r({})}})});
const mkP=(tok,name)=>({tok,id:cr.randomBytes(4).toString('hex'),name:String(name||'Jugador').trim().slice(0,14)||'Jugador',seen:Date.now()});
// ---- vista y sincronización ----
function view(R,tok){const me=R.players.findIndex(p=>p.tok==tok),now=Date.now(),M=GAMES[R.gt];
 const v={code:R.code,v:R.v,host:R.host==tok,me,game:R.gt,opts:R.opts,players:R.players.map(p=>({id:p.id,name:p.name,on:now-p.seen<35000,out:!!p.out})),G:null,claim:false,pend:!!R.pb,chat:R.chat.slice(-40)};
 if(R.G)Object.assign(v,M.view(R,tok,me,now));return v}
function bump(R){R.v++;R.ts=Date.now();const ws=R.w;R.w=[];ws.forEach(w=>{clearTimeout(w.t);out(w.res,view(R,w.tok))})}
function touch(R,pl){if(pl){const off=Date.now()-pl.seen>35000;pl.seen=Date.now();if(off)bump(R)}}
// ---- acciones comunes ----
function kick(R,k){const p=R.players[k];R.kk.push(p.tok);
 if(!R.G){R.players.splice(k,1);return}
 p.out=true;GAMES[R.gt].kick(R,k);delete R.cl[p.id]}
function act(R,tok,m){const G=R.G,M=GAMES[R.gt],i=R.players.findIndex(p=>p.tok==tok),H=R.host==tok,t=m.t;
 if(t=='chat'){const tx=String(m.text||'').trim().slice(0,300);if(!tx)return;if(Date.now()-(R.lc[tok]||0)<400)return 'Más despacio.';R.lc[tok]=Date.now();
  R.chat.push({k:i,name:i>=0?R.players[i].name:'Host',t:tx,ts:Date.now()});if(R.chat.length>60)R.chat.shift();return}
 if(t=='kick'){if(!H)return 'Solo el host puede expulsar.';const k=R.players.findIndex(p=>p.id==m.id);if(k<0||R.players[k].tok==tok)return 'No se puede expulsar a ese jugador.';kick(R,k);if(M.tick)M.tick(R);return}
 if(t=='opts'){if(!H)return 'Solo el host puede cambiar las reglas.';if(G)return 'Ya empezó.';const o=m.o||{};for(const k in R.opts)if(typeof o[k]=='boolean')R.opts[k]=o[k];return}
 if(t=='start'){if(!H)return 'Solo el host puede empezar.';if(G)return 'Ya empezó.';const n=R.players.length;
  if(n<M.min||n>M.max)return 'Se necesitan de '+M.min+' a '+M.max+' jugadores.';M.start(R,m);return}
 if(!G)return 'No hay partida.';
 if(t=='reset'){R.players=R.players.filter(p=>!p.out);R.G=null;return}
 return M.act(R,tok,m)}
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
 if(p=='/new'){const code=rnd(5),tok=cr.randomBytes(12).toString('hex'),gt=GAMES[b.game]?b.game:'continental',
   R=rooms[code]={code,gt,opts:Object.assign({},GAMES[gt].opts),host:tok,players:[],G:null,v:1,w:[],cl:{},kk:[],pb:null,chat:[],lc:{},ts:Date.now()};
  R.poke=()=>bump(R);
  if(b.mode=='listo')R.players.push(mkP(tok,b.name));return out(res,{c:code,t:tok})}
 const R=rooms[String(b.c||'').toUpperCase()];if(!R)return out(res,{err:'No se encontró la sala. Revisa el código y que el servidor siga abierto.'});
 if(p=='/join'){const mx=GAMES[R.gt].max;if(R.G)return out(res,{err:'La partida ya empezó.'});if(R.players.length>=mx)return out(res,{err:'La sala está llena (máximo '+mx+').'});
  const tok=cr.randomBytes(12).toString('hex');R.players.push(mkP(tok,b.name));bump(R);return out(res,{c:R.code,t:tok})}
 if(p=='/act'){const tok=b.t,m=b.m||{};if(R.host!=tok&&!R.players.some(x=>x.tok==tok&&!x.out))return out(res,{err:'No estás en la sala.'});
  if(m.t=='close'){if(R.host!=tok)return out(res,{err:'Solo el host puede cerrar la sala.'});delete rooms[R.code];R.w.forEach(w=>{clearTimeout(w.t);out(w.res,{gone:1})});return out(res,{ok:1})}
  const e=act(R,tok,m);if(e)return out(res,{err:e});bump(R);return out(res,{ok:1})}
 res.writeHead(404);res.end()}).listen(PORT,()=>console.log('Juegos de cartas listo en http://localhost:'+PORT));
setInterval(()=>{for(const c in rooms){const R=rooms[c],M=GAMES[R.gt],s=R.players.map(p=>Date.now()-p.seen<35000?1:0).join('');const ph=R.G&&R.G.round+':'+R.G.phase;if(M.tick)M.tick(R);if(s!==R.sig||(R.G&&R.G.round+':'+R.G.phase)!==ph){R.sig=s;bump(R)}if(Date.now()-R.ts>432e5)delete rooms[c]}},10000);
