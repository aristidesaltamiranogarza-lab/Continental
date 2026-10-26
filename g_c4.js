// Conecta 4 como juego de la sala (2 jugadores). Mismas reglas que el que está escondido en el Continental (g_continental.js).
// Tablero b[42]: fila 0 = abajo, x = fila*7 + columna; 0 vacío, 1 = jugador 0 (rojo), 2 = jugador 1 (amarillo).
const {c4win}=require('./g_continental.js');
const lg=(G,k,t)=>{(G.log=G.log||[]).push({k,t,n:G.ln=(G.ln||0)+1});if(G.log.length>12)G.log.shift()};
const low=(b,c)=>{for(let r=0;r<6;r++)if(!b[r*7+c])return r*7+c;return -1};
function start(R){R.G={phase:'play',players:R.players.map(p=>({id:p.id,name:p.name})),b:Array(42).fill(0),turn:Math.random()<.5?0:1,tc:1,win:-1,line:null,last:-1,log:[],sc:R.sc4||[0,0]}}
function view(R){return {G:R.G}}
function end(R,w){const G=R.G;G.phase='final';G.win=w;if(w>=0)G.sc[w]++;R.sc4=G.sc}
function act(R,tok,m){const G=R.G,i=R.players.findIndex(p=>p.tok==tok);if(G.phase!='play')return 'La partida terminó.';
 if(m.t!='drop')return 'Acción desconocida.';if(i!==G.turn)return 'No es tu turno.';
 const c=+m.c;if(!(c>=0&&c<7))return 'Columna inválida.';const x=low(G.b,c);if(x<0)return 'Esa columna está llena.';
 G.b[x]=i+1;G.last=x;lg(G,i,'tiró en la columna '+(c+1));const l=c4win(G.b,x);
 if(l){G.line=l;lg(G,i,'¡conectó 4!');end(R,i)}else if(G.b.every(v=>v)){lg(G,i,'llenó el tablero: empate');end(R,-1)}else{G.turn=1-i;G.tc++}}
function kick(R,k){end(R,1-k)}
// bot: gana si puede, tapa si el otro está por ganar, si no busca el centro (y no le deja al otro una jugada ganadora arriba)
function bot(R,k){const G=R.G;if(!G||G.phase!='play'||G.turn!==k)return null;const b=G.b,me=k+1,op=2-k;
 const wins=(v,c)=>{const x=low(b,c);if(x<0)return false;b[x]=v;const w=!!c4win(b,x);b[x]=0;return w};
 let c=[...Array(7).keys()].find(c=>wins(me,c));if(c==null)c=[...Array(7).keys()].find(c=>wins(op,c));
 if(c==null){const ok=[...Array(7).keys()].filter(c=>{const x=low(b,c);if(x<0)return false;if(x+7>=42)return true;b[x]=me;const bad=wins(op,c);b[x]=0;return !bad});
  const cs=(ok.length?ok:[...Array(7).keys()].filter(c=>low(b,c)>=0)).map(c=>[c,-Math.abs(c-3)+Math.random()*2.2]).sort((a,b)=>b[1]-a[1]);c=cs[0][0]}
 return {m:{t:'drop',c},ms:900+Math.random()*900}}
module.exports={id:'c4',name:'Conecta 4',min:2,max:2,opts:{},start,view,act,kick,bot};
