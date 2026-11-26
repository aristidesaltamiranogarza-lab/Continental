// Conecta 4 y Backgammon sueltos en la Casa 3D (sin salas): usa las mismas reglas que el cuarto del Continental (c4 y bg de g_continental.js).
// Los que andan en la casa son los "jugadores" de una sala de mentiras (LB); cada quien conserva su número mientras no se vaya.
// Backgammon contra bot: inv con k=-2 le da a esa persona su propio bot (acepta solo y juega desde tick, una ficha a la vez).
const CONT=require('./g_continental.js'),BGB=require('./g_bg_bot.js'),{BOTN}=require('./bots_nombres.js');
const LB={G:{players:[],c4s:[],bgs:[]},players:[]},slot={},BOT_MS=900,BOT_PRIMERO=1400;
function k(id,name,bot){let i=slot[id];if(i==null){i=slot[id]=LB.players.length;LB.players.push({out:0,bot:!!bot});LB.G.players.push({name})}
 LB.players[i].out=0;LB.G.players[i].name=name;return i}
function botDe(id){const b='bot:'+id;return k(b,slot[b]!=null?LB.G.players[slot[b]].name:BOTN[Math.random()*BOTN.length|0],1)}
function act(id,name,m){const i=k(id,name);m=m||{};if(m.t=='c4')return CONT.c4(LB,i,m);if(m.t!='bg')return;
 if(m.op=='inv'&&m.k==-2)m=Object.assign({},m,{k:botDe(id)});
 const r=CONT.bg(LB,i,m);if(r||m.op!='inv'||!LB.players[m.k]||!LB.players[m.k].bot)return r;
 const g=LB.G.bgs.find(x=>x.st=='inv'&&x.p[0]==i&&x.p[1]==m.k);if(g)CONT.bg(LB,m.k,{op:'acc',id:g.id})}
// el bot espera un poco al empezar su turno y luego mueve una ficha cada BOT_MS (o pasa si no puede)
function bots(){const now=Date.now();for(const g of LB.G.bgs){if(g.st!='play')continue;const b=g.p[g.turn];if(!LB.players[b].bot)continue;
 if(g.tk!==g.rn+'.'+g.turn){g.tk=g.rn+'.'+g.turn;g.bt=now+BOT_PRIMERO-BOT_MS;continue}if(now-g.bt<BOT_MS)continue;g.bt=now;
 const m=g.mv.length?BGB.pick(g,g.turn):null;CONT.bg(LB,b,m?{op:'move',id:g.id,from:m[0],die:m[1]}:{op:'pass',id:g.id})}}
// alive: ids que siguen en la casa; al que se fue se le acaban sus partidas
function tick(alive){for(const id in slot){const i=slot[id];if(alive(LB.players[i].bot?id.slice(4):id)||LB.players[i].out)continue;LB.players[i].out=1;
 LB.G.c4s=LB.G.c4s.filter(x=>!x.p.includes(i));LB.G.bgs=LB.G.bgs.filter(x=>!x.p.includes(i))}bots()}
function view(id){const G=LB.G;return {me:slot[id]??-1,pl:G.players.map((p,i)=>({k:i,n:p.name,out:LB.players[i].out,bot:LB.players[i].bot})).filter(p=>!p.out),c4s:G.c4s,bgs:G.bgs}}
module.exports={act,tick,view};
