// Conecta 4 y Backgammon sueltos en la Casa 3D (sin salas): usa las mismas reglas que el cuarto del Continental (c4 y bg de g_continental.js).
// Los que andan en la casa son los "jugadores" de una sala de mentiras (LB); cada quien conserva su número mientras no se vaya.
const CONT=require('./g_continental.js');
const LB={G:{players:[],c4s:[],bgs:[]},players:[]},slot={};
function k(id,name){let i=slot[id];if(i==null){i=slot[id]=LB.players.length;LB.players.push({out:0});LB.G.players.push({name})}
 LB.players[i].out=0;LB.G.players[i].name=name;return i}
function act(id,name,m){const i=k(id,name);m=m||{};if(m.t=='c4')return CONT.c4(LB,i,m);if(m.t=='bg')return CONT.bg(LB,i,m)}
// alive: ids que siguen en la casa; al que se fue se le acaban sus partidas
function tick(alive){for(const id in slot){const i=slot[id];if(alive(id)||LB.players[i].out)continue;LB.players[i].out=1;
 LB.G.c4s=LB.G.c4s.filter(x=>!x.p.includes(i));LB.G.bgs=LB.G.bgs.filter(x=>!x.p.includes(i))}}
function view(id){const G=LB.G;return {me:slot[id]??-1,pl:G.players.map((p,i)=>({k:i,n:p.name,out:LB.players[i].out})).filter(p=>!p.out),c4s:G.c4s,bgs:G.bgs}}
module.exports={act,tick,view};
