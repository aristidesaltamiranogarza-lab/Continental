// Backgammon como juego de la sala (2 jugadores). Mismas reglas que el que está escondido en el Continental (g_continental.js):
// pts[i] (i=0..23): >0 fichas del jugador 0 (avanza hacia i=0), <0 del jugador 1 (hacia i=23); bar/off por jugador.
// En las jugadas, from=25 = desde la barra y to=-1 = sacar la ficha. G.mv = jugadas válidas [from, dado, to].
const {bgStart,bgApply,bgLegal,bgRoll}=require('./g_continental.js');
const lg=(G,k,t)=>{(G.log=G.log||[]).push({k,t,n:G.ln=(G.ln||0)+1});if(G.log.length>12)G.log.shift()};
function start(R){const G=R.G={phase:'play',players:R.players.map(p=>({id:p.id,name:p.name})),pts:bgStart(),bar:[0,0],off:[0,0],turn:Math.random()<.5?0:1,
  dice:[0,0],left:[],mv:[],last:null,rn:0,tc:1,win:-1,log:[],sc:R.scbg||[0,0]};bgRoll(G)}
function view(R){return {G:R.G}}
function end(R,w){const G=R.G;G.phase='final';G.win=w;G.left=[];G.mv=[];if(w>=0)G.sc[w]++;R.scbg=G.sc}
function next(G){G.turn=1-G.turn;G.tc++;bgRoll(G)}
function act(R,tok,m){const G=R.G,i=R.players.findIndex(p=>p.tok==tok);if(G.phase!='play')return 'La partida terminó.';if(i!==G.turn)return 'No es tu turno.';
 if(m.t=='pass'){if(G.mv.length)return 'Todavía tienes jugadas posibles.';lg(G,i,'no pudo mover');next(G);return}
 if(m.t!='move')return 'Acción desconocida.';const mv=G.mv.find(x=>x[0]===m.from&&x[1]===m.die);if(!mv)return 'Esa jugada no se puede.';
 const hit=mv[2]>=0&&G.pts[mv[2]]*(i?-1:1)==-1;bgApply(G,i,...mv);G.last=[mv[0],mv[2],i];
 if(hit)lg(G,i,'¡comió una ficha!');if(mv[2]==-1&&G.off[i]==1)lg(G,i,'empezó a sacar fichas');
 if(G.off[i]==15){lg(G,i,'sacó sus 15 fichas');end(R,i);return}
 G.mv=bgLegal(G,i);if(!G.left.length||!G.mv.length)next(G)}
function kick(R,k){end(R,1-k)}
// bot: de las jugadas válidas prefiere sacar fichas, comer, cubrir fichas solas y avanzar; evita dejar fichas solas
function bot(R,k){const G=R.G;if(!G||G.phase!='play'||G.turn!==k)return null;const ms=900+Math.random()*700;
 if(!G.mv.length)return {m:{t:'pass'},ms};const s=k?-1:1;
 const sc=([f,d,t])=>{let v=Math.random()*.5;if(t==-1)v+=6;else{const at=G.pts[t]*s;if(at==-1)v+=5;if(at==1)v+=3;if(at==0)v-=1.5}
  if(f!=25&&G.pts[f]*s==2)v-=1.2;if(f==25)v+=2;v+=d*.1;return v};
 const best=G.mv.slice().sort((a,b)=>sc(b)-sc(a))[0];return {m:{t:'move',from:best[0],die:best[1]},ms}}
module.exports={id:'bg',name:'Backgammon',min:2,max:2,opts:{},start,view,act,kick,bot};
