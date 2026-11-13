// Servidor de juegos de cartas (Continental, Uno, Monopoly Deal...). Sin dependencias.  Uso: node server.js  (PORT=8080 node server.js para otro puerto)
// Núcleo: salas, polling, chat, expulsar, reconexión. Cada juego es un módulo g_*.js con: id,name,min,max,opts,start,view,act,kick,tick
const http=require('http'),fs=require('fs'),path=require('path'),cr=require('crypto'),SM=require('./srv_modelos.js'),PORT=process.env.PORT||3000;
const GAMES={continental:require('./g_continental.js'),uno:require('./g_uno.js'),monopolydeal:require('./g_monopolydeal.js'),merida:require('./g_merida.js'),haciendas:require('./g_haciendas.js'),ruleta:require('./g_ruleta.js'),rummy:require('./g_rummy.js')},ALF='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',rooms={};
const files={'/':['continental.html','text/html; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/game.js':['game.js','text/javascript; charset=utf-8'],
 '/c_continental.js':['c_continental.js','text/javascript; charset=utf-8'],'/c_uno.js':['c_uno.js','text/javascript; charset=utf-8'],'/c_monopolydeal.js':['c_monopolydeal.js','text/javascript; charset=utf-8'],
 '/merida_data.js':['merida_data.js','text/javascript; charset=utf-8'],'/c_merida.js':['c_merida.js','text/javascript; charset=utf-8'],
 '/haciendas_data.js':['haciendas_data.js','text/javascript; charset=utf-8'],'/c_haciendas.js':['c_haciendas.js','text/javascript; charset=utf-8'],
 '/c_haciendas2d.js':['c_haciendas2d.js','text/javascript; charset=utf-8'],'/c_haciendasui.js':['c_haciendasui.js','text/javascript; charset=utf-8'],'/c_haciendastabs.js':['c_haciendastabs.js','text/javascript; charset=utf-8'],
 '/c_haciendas3d.js':['c_haciendas3d.js','text/javascript; charset=utf-8'],'/c_haciendas3dm.js':['c_haciendas3dm.js','text/javascript; charset=utf-8'],'/c_haciendasfx.js':['c_haciendasfx.js','text/javascript; charset=utf-8'],
 '/c_rr_pj.js':['c_rr_pj.js','text/javascript; charset=utf-8'],'/c_rr_anim.js':['c_rr_anim.js','text/javascript; charset=utf-8'],'/c_ragdoll.js':['c_ragdoll.js','text/javascript; charset=utf-8'],'/c_ruleta3d.js':['c_ruleta3d.js','text/javascript; charset=utf-8'],'/c_ruletagore.js':['c_ruletagore.js','text/javascript; charset=utf-8'],'/c_ruletasonido.js':['c_ruletasonido.js','text/javascript; charset=utf-8'],
 '/rummy_reglas.js':['rummy_reglas.js','text/javascript; charset=utf-8'],'/c_rummy.js':['c_rummy.js','text/javascript; charset=utf-8'],
 '/c_rummy2d.js':['c_rummy2d.js','text/javascript; charset=utf-8'],'/c_rummyui.js':['c_rummyui.js','text/javascript; charset=utf-8'],
 '/c_rummyesc.js':['c_rummyesc.js','text/javascript; charset=utf-8'],'/c_rummy3dm.js':['c_rummy3dm.js','text/javascript; charset=utf-8'],'/c_rummy3d.js':['c_rummy3d.js','text/javascript; charset=utf-8'],'/c_rummy3dvista.js':['c_rummy3dvista.js','text/javascript; charset=utf-8'],'/c_bienvenida.js':['c_bienvenida.js','text/javascript; charset=utf-8'],'/c_etiquetas.js':['c_etiquetas.js','text/javascript; charset=utf-8'],'/c_casa_cam.js':['c_casa_cam.js','text/javascript; charset=utf-8'],'/c_casa_amb.js':['c_casa_amb.js','text/javascript; charset=utf-8'],'/music_mp3.js':['music_mp3.js','text/javascript; charset=utf-8'],'/sonidos/uno.mp3':['sonidos/uno.mp3','audio/mpeg'],'/musica/neondemedianoche.mp3':['musica/neondemedianoche.mp3','audio/mpeg'],'/musica/bosadelcomodin.mp3':['musica/bosadelcomodin.mp3','audio/mpeg'],'/musica/fichalentalofi.mp3':['musica/fichalentalofi.mp3','audio/mpeg'],'/c_casa_dollhouse.js':['c_casa_dollhouse.js','text/javascript; charset=utf-8'],'/c_casa_ir.js':['c_casa_ir.js','text/javascript; charset=utf-8'],'/c_casa_hover.js':['c_casa_hover.js','text/javascript; charset=utf-8'],'/c_sotano.js':['c_sotano.js','text/javascript; charset=utf-8'],'/c_billar3d.js':['c_billar3d.js','text/javascript; charset=utf-8'],'/c_casino3d.js':['c_casino3d.js','text/javascript; charset=utf-8'],'/c_sotano_salon.js':['c_sotano_salon.js','text/javascript; charset=utf-8'],'/c_casa_esc.js':['c_casa_esc.js','text/javascript; charset=utf-8'],'/c_casa_ruta.js':['c_casa_ruta.js','text/javascript; charset=utf-8'],'/c_casa_joy.js':['c_casa_joy.js','text/javascript; charset=utf-8'],'/c_casa_alta.js':['c_casa_alta.js','text/javascript; charset=utf-8'],'/c_casa_terraza.js':['c_casa_terraza.js','text/javascript; charset=utf-8'],'/c_casa_avatar.js':['c_casa_avatar.js','text/javascript; charset=utf-8'],
 '/c_mii.js':['c_mii.js','text/javascript; charset=utf-8'],'/c_rummyabuelos.js':['c_rummyabuelos.js','text/javascript; charset=utf-8'],'/c_rummysfx.js':['c_rummysfx.js','text/javascript; charset=utf-8'],
 '/ui.css':['ui.css','text/css; charset=utf-8'],'/ui_casa.css':['ui_casa.css','text/css; charset=utf-8'],'/ui_juegos.css':['ui_juegos.css','text/css; charset=utf-8'],'/ui_sala.css':['ui_sala.css','text/css; charset=utf-8'],'/c_sala.js':['c_sala.js','text/javascript; charset=utf-8'],'/c_c4_2d.js':['c_c4_2d.js','text/javascript; charset=utf-8'],'/c_bj_crupier.js':['c_bj_crupier.js','text/javascript; charset=utf-8'],'/c_blackjack3d.js':['c_blackjack3d.js','text/javascript; charset=utf-8'],'/c_blackjack_hud.js':['c_blackjack_hud.js','text/javascript; charset=utf-8'],'/poker_eval.js':['poker_eval.js','text/javascript; charset=utf-8'],'/c_poker3d.js':['c_poker3d.js','text/javascript; charset=utf-8'],'/c_blackjack2d.js':['c_blackjack2d.js','text/javascript; charset=utf-8'],'/c_avatar.js':['c_avatar.js','text/javascript; charset=utf-8'],'/c_mipj.js':['c_mipj.js','text/javascript; charset=utf-8'],'/c_lobby.js':['c_lobby.js','text/javascript; charset=utf-8'],'/ui_lobby.css':['ui_lobby.css','text/css; charset=utf-8'],'/c_juegos_hud.js':['c_juegos_hud.js','text/javascript; charset=utf-8'],'/c_mdeal_hud.js':['c_mdeal_hud.js','text/javascript; charset=utf-8'],'/c_juegos2d.js':['c_juegos2d.js','text/javascript; charset=utf-8'],'/c_casa_fondo.js':['c_casa_fondo.js','text/javascript; charset=utf-8'],'/c_casa_ocupada.js':['c_casa_ocupada.js','text/javascript; charset=utf-8'],'/c_mesa3d.js':['c_mesa3d.js','text/javascript; charset=utf-8'],'/c_mesa_pj.js':['c_mesa_pj.js','text/javascript; charset=utf-8'],'/c_mesa_cam.js':['c_mesa_cam.js','text/javascript; charset=utf-8'],'/c_mesa_fx.js':['c_mesa_fx.js','text/javascript; charset=utf-8'],'/c_casa_hud.js':['c_casa_hud.js','text/javascript; charset=utf-8'],'/c_emote_ico.js':['c_emote_ico.js','text/javascript; charset=utf-8'],'/c_casa_mesa.js':['c_casa_mesa.js','text/javascript; charset=utf-8'],'/c_casa_minis.js':['c_casa_minis.js','text/javascript; charset=utf-8'],'/c_ui.js':['c_ui.js','text/javascript; charset=utf-8'],'/c_casa_glb.js':['c_casa_glb.js','text/javascript; charset=utf-8'],'/c_casa_medidor.js':['c_casa_medidor.js','text/javascript; charset=utf-8'],'/c_casa_res.js':['c_casa_res.js','text/javascript; charset=utf-8'],'/c_casa_luces.js':['c_casa_luces.js','text/javascript; charset=utf-8'],'/c_casa_cielo.js':['c_casa_cielo.js','text/javascript; charset=utf-8'],'/c_casa_ventanas.js':['c_casa_ventanas.js','text/javascript; charset=utf-8'],'/c_casa_pb.js':['c_casa_pb.js','text/javascript; charset=utf-8'],'/c_casa_lote.js':['c_casa_lote.js','text/javascript; charset=utf-8'],'/c_casa_vocho.js':['c_casa_vocho.js','text/javascript; charset=utf-8'],'/c_casa_calle.js':['c_casa_calle.js','text/javascript; charset=utf-8'],'/c_casa_patio.js':['c_casa_patio.js','text/javascript; charset=utf-8'],'/c_casa_casco.js':['c_casa_casco.js','text/javascript; charset=utf-8']};
const out=(res,o,c=200)=>{res.writeHead(c,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(o))};
const rnd=n=>Array.from({length:n},()=>ALF[Math.random()*32|0]).join('');
const body=req=>new Promise(r=>{let b='';req.on('data',d=>{b+=d;if(b.length>1e5)req.destroy()});req.on('end',()=>{try{r(JSON.parse(b||'{}'))}catch(e){r({})}})});
// personaje (formato de c_avatar.js): s1p3c1b2n1a2d3-2051; si viene mal o no viene, uno al azar
const AVRE=/^s[12]p[1-7]c[1-3]b[1-3]n[1-3]a[1-3]d[1-3]-[0-7][0-7][0-9][0-9]$/,ri=n=>cr.randomInt(n),
 avAzar=()=>'s'+(1+ri(2))+'p'+(1+ri(7))+'c'+(1+ri(3))+'b'+(1+ri(3))+'n'+(1+ri(3))+'a'+(1+ri(3))+'d'+(1+ri(3))+'-'+ri(8)+ri(8)+ri(10)+ri(10),
 avOk=c=>AVRE.test(String(c||''))?String(c):avAzar();
const meOf=b=>String(b&&b.me||'').replace(/[^a-z0-9]/gi,'').slice(0,24)||null;
const mkP=(tok,name,av,me)=>({tok,me:me||null,id:cr.randomBytes(4).toString('hex'),name:String(name||'Jugador').trim().slice(0,14)||'Jugador',av:avOk(av),seen:Date.now()});
// ---- vista y sincronización ----
// espectadores (R.spec): ven la partida como el host que no juega (me = -1, sin ver cartas de nadie) y pueden chatear
const specOf=(R,tok)=>(R.spec||[]).find(s=>s.tok==tok);
function view(R,tok){const me=R.players.findIndex(p=>p.tok==tok),now=Date.now(),M=GAMES[R.gt];
 const v={code:R.code,v:R.v,host:R.host==tok,me,game:R.gt,opts:R.opts,players:R.players.map(p=>({id:p.id,name:p.name,on:!!p.bot||now-p.seen<35000,out:!!p.out,bot:!!p.bot,av:p.av})),G:null,claim:false,pend:!!R.pb,chat:R.chat.slice(-40),
  watch:!!specOf(R,tok),spec:(R.spec||[]).filter(s=>now-s.seen<35000).map(s=>s.name),
  tt:R.G?now-(R.tt||now):0,tom:TOM_MS,fx:(R.fx||[]).filter(f=>now-f.ts<6000)};   // tt: cuánto lleva el turno; fx: tomates recientes
 if(R.G)Object.assign(v,M.view(R,tok,me,now));return v}
// ---- tomates 🍅: a quien se tarda más de TOM_MS en su turno se le pueden lanzar (jugadores y espectadores) ----
const TOM_MS=15000,turnKey=G=>G?[G.phase,G.turn,G.tc,G.round].join(':'):'';
function tomato(R,tok,i){const G=R.G,now=Date.now();if(!G||G.phase!='play'||G.turn==null)return 'No hay a quién lanzarle tomates.';const k=G.turn;
 if(k===i)return '¡No te puedes lanzar tomates a ti!';if(R.players[k]&&R.players[k].bot)return 'Los bots no se tardan 😉';
 if(now-(R.tt||now)<TOM_MS)return 'Todavía no se está tardando tanto.';const lt=R.lt=R.lt||{};if(now-(lt[tok]||0)<120)return 'Más despacio.';lt[tok]=now;
 const sp=specOf(R,tok),from=i>=0?R.players[i].name:sp?sp.name:'Host';R.fx=(R.fx||[]).concat({n:R.fxn=(R.fxn||0)+1,t:'tom',from,k,ts:now}).slice(-40)}
function bump(R){const tk=turnKey(R.G);if(tk!==R.tk){R.tk=tk;R.tt=Date.now()}R.v++;R.ts=Date.now();const ws=R.w;R.w=[];ws.forEach(w=>{clearTimeout(w.t);out(w.res,view(R,w.tok))});botGo(R)}
// ---- bots: el módulo del juego decide (M.bot), aquí se agenda y se manda por act() como cualquier jugador ----
// M.auto(R,k), si existe, decide quién juega en automático (bots, y personas ausentes o desconectadas); M.botn: nombres de sus bots
const BOTN=['Ana','Beto','Caro','Dani','Eli','Fer','Gabo','Hugo','Iris'];
// el asiento se queda con un bot (abandonó, o se levantó y no volvió en 2 min): token nuevo para que ya nadie lo use; si era el host, pasa a otra persona
function botSeat(R,p){const old=p.tok;p.bot=true;p.away=0;p.tok=cr.randomBytes(12).toString('hex');if(R.host==old){const h=R.players.find(x=>!x.bot&&!x.out);if(h)R.host=h.tok}}
// volver a tu lugar (cerraste la sala, se recargó o se durmió el celular): se te reconoce por la clave de tu aparato (me).
// si un bot lo tomó, te lo regresa; si tu lugar sigue vivo en otra pestaña (está esperando su poll), no: eres otra persona
function volver(R,b){const me=meOf(b);if(!me)return null;const p=R.players.find(x=>x.me==me&&!x.out);if(!p)return null;
 if(!p.bot&&(R.w.some(w=>w.tok==p.tok)||Date.now()-p.seen<5000))return null;
 if(p.bot){p.tok=cr.randomBytes(12).toString('hex');p.bot=false;R.chat.push({k:-1,name:'Aviso',t:p.name+' volvió a la mesa',ts:Date.now()});if(R.chat.length>60)R.chat.shift()}
 p.away=0;p.seen=Date.now();return p.tok}
const OFF_MS=35000,FUERA_MS=180000;
// soltar el asiento: si el juego tiene bot, se queda un bot; si no, sale de la partida (un asiento sin nadie trabaría el juego)
function soltar(R,p){const M=GAMES[R.gt];if(M.bot||M.auto)return botSeat(R,p);const k=R.players.indexOf(p);if(R.host==p.tok){const h=R.players.find(x=>x!==p&&!x.bot&&!x.out);if(h)R.host=h.tok}kick(R,k);if(M.tick)M.tick(R)}
function botGo(R){clearTimeout(R.bt);R.bt=null;const M=GAMES[R.gt];if(!R.G||!M.bot||!rooms[R.code])return;
 // de todos los bots, la jugada que toca primero
 let best=null;R.players.forEach((p,k)=>{if(M.auto?!M.auto(R,k):!(p.bot||p.away||Date.now()-p.seen>OFF_MS)||p.out)return;const d=M.bot(R,k);if(d&&(!best||d.ms<best.ms))best=Object.assign({p},d)});if(!best)return;
 R.bt=setTimeout(()=>{R.bt=null;if(!rooms[R.code]||!R.G)return;let e=act(R,best.p.tok,best.m);
  // si algo falla: roba para no trabar la partida, o lo vuelve a pensar en un rato
  if(e){console.log('bot',best.p.name,e);if(best.m.t=='play')e=act(R,best.p.tok,{t:'draw'});if(e){R.bt=setTimeout(()=>botGo(R),3000);return}}
  bump(R)},Math.max(50,best.ms))}
function touch(R,pl){if(pl){const off=Date.now()-pl.seen>35000;pl.seen=Date.now();if(off)bump(R)}}
// ---- ausentes: en un juego sin bot, quien lleva FUERA_MS sin conexión a media partida sale (si no, se traba); el host, si se va, pasa a quien sí está ----
// hay alguien de verdad jugando: humano sentado (no se levantó) y conectado. Sin nadie así, la partida se cierra
const vivoH=(R,now)=>R.players.some(p=>!p.bot&&!p.out&&!p.away&&now-p.seen<OFF_MS);
function fuera(R){const M=GAMES[R.gt],now=Date.now(),vivo=p=>!p.bot&&!p.out&&now-p.seen<OFF_MS,av=t=>{R.chat.push({k:-1,name:'Aviso',t,ts:now});if(R.chat.length>60)R.chat.shift()};
 if(R.G&&R.G.phase!='final'&&!M.bot&&!M.auto)R.players.forEach((p,k)=>{if(!p.bot&&!p.out&&now-p.seen>FUERA_MS){av(p.name+' salió de la mesa: se desconectó');kick(R,k);if(M.tick)M.tick(R);bump(R)}});
 if(now-(R.hs||now)>120000){const h=R.players.find(vivo);if(h&&h.tok!=R.host){R.host=h.tok;R.hs=now;av(h.name+' ahora es el anfitrión');bump(R)}}}
// ---- acciones comunes ----
function kick(R,k){const p=R.players[k];R.kk.push(p.tok);
 if(!R.G){R.players.splice(k,1);return}
 p.out=true;GAMES[R.gt].kick(R,k);delete R.cl[p.id]}
function act(R,tok,m){const G=R.G,M=GAMES[R.gt],i=R.players.findIndex(p=>p.tok==tok),H=R.host==tok,t=m.t;
 if(t=='av'){if(i<0)return 'No estás en la sala.';R.players[i].av=avOk(m.av);return}
 if(t=='chat'){const tx=String(m.text||'').trim().slice(0,300);if(!tx)return;if(Date.now()-(R.lc[tok]||0)<400)return 'Más despacio.';R.lc[tok]=Date.now();
  const sp=i<0&&specOf(R,tok);R.chat.push({k:i,name:i>=0?R.players[i].name:sp?'👁 '+sp.name:'Host',t:tx,ts:Date.now()});if(R.chat.length>60)R.chat.shift();return}
 if(t=='tomato')return tomato(R,tok,i);
 if(t=='kick'){if(!H)return 'Solo el host puede expulsar.';const k=R.players.findIndex(p=>p.id==m.id);if(k<0||R.players[k].tok==tok)return 'No se puede expulsar a ese jugador.';kick(R,k);if(M.tick)M.tick(R);return}
 if(t=='opts'){if(!H)return 'Solo el host puede cambiar las reglas.';if(G)return 'Ya empezó.';const o=m.o||{};for(const k in R.opts){const x=o[k],r=M.rng&&M.rng[k];if(typeof x=='boolean'&&typeof R.opts[k]=='boolean')R.opts[k]=x;else if(typeof x=='number'&&typeof R.opts[k]=='number'&&r&&x>=r[0]&&x<=r[1])R.opts[k]=Math.floor(x)}return}
 // la misma sala sirve para todos los juegos: entre partidas, el host elige a qué juegan
 if(t=='game'){if(!H)return 'Solo el host elige el juego.';if(G)return 'Termina primero esta partida.';const M2=GAMES[m.g];if(!M2)return 'Ese juego no existe.';if(m.g==R.gt)return;
  const ps=R.players.filter(p=>M2.bot||!p.bot);if(ps.length>M2.max)return 'Son demasiados para '+M2.name+' (máximo '+M2.max+').';
  if(ps.length<R.players.length)R.chat.push({k:-1,name:'Aviso',t:M2.name+' todavía no tiene bots: salieron de la sala',ts:Date.now()});
  R.players=ps;R.gt=m.g;R.opts=Object.assign({},M2.opts);R.chat.push({k:-1,name:'Aviso',t:'Ahora van a jugar '+M2.name,ts:Date.now()});return}
 if(t=='addbot'){if(!H)return 'Solo el host puede agregar bots.';if(G)return 'Ya empezó.';if(!M.bot)return 'Este juego todavía no tiene bots.';if(R.players.length>=M.max)return 'La sala está llena (máximo '+M.max+').';
  const nm=(M.botn||BOTN).find(x=>!R.players.some(p=>p.name==x))||'Bot';R.players.push(Object.assign(mkP(cr.randomBytes(12).toString('hex'),nm),{bot:true}));return}
 if(t=='start'){if(!H)return 'Solo el host puede empezar.';if(G)return 'Ya empezó.';const n=R.players.length;
  if(n<M.min||n>M.max)return 'Se necesitan de '+M.min+' a '+M.max+' jugadores.';M.start(R,m);return}
 if(!G)return 'No hay partida.';
 if(t=='reset'){R.players=R.players.filter(p=>!p.out);R.G=null;return}
 // levantarse (stand): el automático juega por ti y guardas el lugar 2 min (sit = volver). abandonar (leave): un bot se queda con tu asiento
 if(t=='stand'||t=='sit'||t=='leave'){const p=R.players[i];if(!p||p.bot||p.out)return 'No tienes lugar en esta mesa.';
  if(t=='sit'){p.away=0;return}if(t=='stand'){p.away=Date.now();if(M.tick)M.tick(R);return}
  soltar(R,p);if(M.tick)M.tick(R);return}
 return M.act(R,tok,m)}
// ---- casa de juegos: quién anda caminando (posición, emote, lo que dijo) y qué salas hay en cada mesa ----
const CUB=require('./g_cubilete.js'),JG=require('./g_casajuegos.js'),BJ=require('./g_blackjack.js'),PK=require('./g_poker.js');   // JG: Conecta 4 y Backgammon sueltos en la casa
//   // Cubilete de la esquina (sin salas)
const casa={},EMO=['😭','🥺','🤣','👻','❤️','🔥','🤬','🖕','💃','🕺','👯','🎧','👟','🌀','🤸','🎮'];
function salas(){const now=Date.now();return Object.values(rooms).filter(R=>R.G?vivoH(R,now):R.players.some(p=>!p.bot&&!p.out&&now-p.seen<35000)).map(R=>{const ps=R.players.filter(p=>!p.out),h=R.players.find(p=>p.tok==R.host);
 // c: código para unirse (solo si espera jugadores); w: código para ir a mirar (si ya empezó)
 const fin=R.G&&R.G.phase=='final';   // partida terminada: ya no cuenta como en curso
 return {c:R.G?null:R.code,w:R.G&&!fin?R.code:null,g:R.gt,st:R.G?(fin?'fin':'play'):'lobby',n:ps.length,max:GAMES[R.gt].max,host:h?h.name:'Host',ps:ps.slice(0,6).map(p=>p.name),av:ps.slice(0,6).map(p=>p.av||''),sp:(R.spec||[]).filter(s=>now-s.seen<35000).length}})}
function casaAct(b){const now=Date.now(),id=String(b.id||'').slice(0,16);
 if(id){const o=casa[id]||(casa[id]={id,emT:0,sayT:0});o.name=String(b.name||'').trim().slice(0,14)||'Jugador';if(AVRE.test(String(b.av||'')))o.av=String(b.av);
  ['x','z','yaw'].forEach(k=>{const v=+b[k];if(isFinite(v))o[k]=Math.round(v*100)/100});o.w=b.w?1:0;o.f=['sot','alta','ter'].includes(b.f)?b.f:'pb';   // f: piso (sótano, planta baja, planta alta o terraza)
  if(EMO.includes(b.em)){o.em=b.em;o.emT=now}if(b.say){const s=String(b.say).trim().slice(0,80);if(s){o.say=s;o.sayT=now}}o.ts=now}
 if(id&&b.cub)CUB.act(id,casa[id].name,b.cub);
 let jerr=id&&b.jg?JG.act(id,casa[id].name,b.jg):null;if(id)JG.act(id,casa[id].name,null);
 let bjerr=id&&b.bj?BJ.act(id,casa[id].name,b.bj):null; let pkerr=id&&b.pk?PK.act(id,casa[id].name,b.pk):null;
 for(const k in casa)if(now-casa[k].ts>8000)delete casa[k];
 CUB.tick(k=>!!casa[k]);JG.tick(k=>!!casa[k]);BJ.tick(k=>!!casa[k]);PK.tick(k=>!!casa[k]);
 return {p:Object.values(casa).filter(o=>o.id!==id).map(o=>({id:o.id,name:o.name,av:o.av||'',x:o.x,z:o.z,yaw:o.yaw,w:o.w,f:o.f,em:now-o.emT<3500?o.em:null,emN:o.emT,say:now-o.sayT<6000?o.say:null,sayN:o.sayT})),r:salas(),cub:CUB.view(),jg:JG.view(id),jerr,bj:BJ.view(),bjerr,pk:PK.view(id),pkerr}}
// ---- HTTP ----
http.createServer(async(req,res)=>{const u=new URL(req.url,'http://x'),p=u.pathname,q=u.searchParams;
 if(files[p])return SM.envia(req,res,path.join(__dirname,files[p][0]),files[p][1],files[p][1]=='audio/mpeg'?'public, max-age=604800':'no-store');   // por partes (srv_modelos.js)
 if(p.startsWith('/modelos/'))return SM.modelos(req,res,p);
 if(p=='/prueba')return require('./srv_prueba.js')(req,res,q,{rooms,GAMES,mkP,rnd,cr,bump});
 if(p=='/manifest.webmanifest')return SM.envia(req,res,path.join(__dirname,'manifest.webmanifest'),'application/manifest+json','no-store');   // app instalable (ícono en la pantalla de inicio)
 if(/^\/iconos\/[a-z0-9_]+\.png$/.test(p))return SM.envia(req,res,path.join(__dirname,p),'image/png','public, max-age=86400');
 if(p=='/poll'){const R=rooms[q.get('c')],tok=q.get('t');if(!R)return out(res,{gone:1});
  if(R.kk.includes(tok))return out(res,{kicked:1});
  const pl=R.players.find(x=>x.tok==tok),sp=specOf(R,tok);if(!pl&&R.host!=tok&&!sp)return out(res,{gone:1});
  if(sp)sp.seen=Date.now();if(tok==R.host)R.hs=Date.now();touch(R,pl);if(R.v>+q.get('v'))return out(res,view(R,tok));
  const w={res,tok,t:setTimeout(()=>{R.w=R.w.filter(x=>x!==w);touch(R,pl);if(tok==R.host)R.hs=Date.now();if(sp)sp.seen=Date.now();out(res,{same:1})},25000)};R.w.push(w);
  req.on('close',()=>{clearTimeout(w.t);R.w=R.w.filter(x=>x!==w)});return}
 if(req.method!='POST'){res.writeHead(404);return res.end()}
 const b=await body(req);
 if(p=='/casa')return out(res,casaAct(b));
 if(p=='/new'){const code=rnd(5),tok=cr.randomBytes(12).toString('hex'),gt=GAMES[b.game]?b.game:'continental',
   R=rooms[code]={code,gt,opts:Object.assign({},GAMES[gt].opts),host:tok,players:[],G:null,v:1,w:[],cl:{},kk:[],pb:null,chat:[],lc:{},ts:Date.now()};
  R.poke=()=>bump(R);
  R.hs=Date.now();if(b.mode=='listo')R.players.push(mkP(tok,b.name,b.av,meOf(b)));return out(res,{c:code,t:tok})}
 const R=rooms[String(b.c||'').toUpperCase()];if(!R)return out(res,{err:'No se encontró la sala. Revisa el código y que el servidor siga abierto.'});
 if(p=='/join'||p=='/watch'){const vt=volver(R,b);if(vt){bump(R);return out(res,{c:R.code,t:vt})}}
 if(p=='/join'){const mx=GAMES[R.gt].max;if(R.G)return out(res,{err:'La partida ya empezó.'});if(R.players.length>=mx)return out(res,{err:'La sala está llena (máximo '+mx+').'});
  const tok=cr.randomBytes(12).toString('hex');R.players.push(mkP(tok,b.name,b.av,meOf(b)));bump(R);return out(res,{c:R.code,t:tok})}
 // ir a mirar una partida (también sirve si todavía no empieza)
 if(p=='/watch'){const tok=cr.randomBytes(12).toString('hex'),nm=String(b.name||'').trim().slice(0,14)||'Alguien';(R.spec=R.spec||[]).push({tok,name:nm,seen:Date.now()});
  R.chat.push({k:-1,name:'👁',t:nm+' está mirando la partida',ts:Date.now()});if(R.chat.length>60)R.chat.shift();bump(R);return out(res,{c:R.code,t:tok})}
 if(p=='/act'){const tok=b.t,m=b.m||{},sp=specOf(R,tok);if(R.host!=tok&&!sp&&!R.players.some(x=>x.tok==tok&&!x.out))return out(res,{err:'No estás en la sala.'});
  if(sp&&m.t!='chat'&&m.t!='tomato')return out(res,{err:'Estás mirando: no puedes jugar en esta partida.'});
  if(m.t=='close'){if(R.host!=tok)return out(res,{err:'Solo el host puede cerrar la sala.'});delete rooms[R.code];R.w.forEach(w=>{clearTimeout(w.t);out(w.res,{gone:1})});return out(res,{ok:1})}
  const e=act(R,tok,m);if(e)return out(res,{err:e});bump(R);return out(res,{ok:1})}
 res.writeHead(404);res.end()}).listen(PORT,()=>console.log('Juegos de cartas listo en http://localhost:'+PORT));
setInterval(()=>{for(const c in rooms){const R=rooms[c],M=GAMES[R.gt],s=R.players.map(p=>p.bot||Date.now()-p.seen<35000?1:0).join('');const ph=R.G&&R.G.round+':'+R.G.phase;if(M.tick)M.tick(R);R.players.forEach(p=>{if(p.away&&Date.now()-p.away>120000&&!p.out){p.away=0;soltar(R,p);bump(R)}});fuera(R);if(R.spec)R.spec=R.spec.filter(x=>Date.now()-x.seen<120000);if(s!==R.sig||(R.G&&R.G.round+':'+R.G.phase)!==ph){R.sig=s;bump(R)}if(Date.now()-R.ts>432e5||(R.G&&!vivoH(R,Date.now()))){clearTimeout(R.bt);delete rooms[c];R.w.forEach(w=>{clearTimeout(w.t);out(w.res,{gone:1})});R.w=[]}}},10000);
