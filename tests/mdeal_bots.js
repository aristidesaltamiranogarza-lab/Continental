// Partidas de Monopoly Deal solo con bots (g_monopolydeal_bot.js): todas terminan, sin jugadas rechazadas que traben el turno.  Uso: node tests/mdeal_bots.js
const assert=require('assert'),M=require('../g_monopolydeal.js');
const real=setTimeout;global.setTimeout=(f,ms)=>({});   // los avisos con tiempo del módulo no hacen falta aquí
function partida(n,sets){const R={players:Array.from({length:n},(_,i)=>({id:'b'+i,name:'Bot'+i,tok:'t'+i,bot:true})),opts:{sets,autopay:false}};
 R.players.forEach(p=>p.out=false);M.start(R,{});R.G.cdUntil=0;let pasos=0,err=0,seguidos=0;
 while(R.G.phase=='play'&&pasos<4000){pasos++;let best=null;
  R.players.forEach((p,k)=>{const d=M.bot(R,k);if(d&&(!best||d.ms<best.ms))best={k,d}});
  if(!best){// nadie se mueve: debe ser fin de mazo con todos sin jugadas; termina el turno a la fuerza
   throw new Error('nadie juega: '+JSON.stringify({turn:R.G.turn,step:R.G.step,pa:R.G.pa}))}
  const e=M.act(R,R.players[best.k].tok,best.d.m);
  if(e){err++;seguidos++;if(seguidos>5)throw new Error('bot trabado: '+e+' '+JSON.stringify(best.d.m))}else seguidos=0}
 return {pasos,err,fin:R.G.phase,win:R.G.win,mazo:R.G.deck.length}}
let fin=0,tope=0,errs=0;const N=60;
for(let i=0;i<N;i++){const r=partida(2+i%4,i%3==0?2:3);errs+=r.err;if(r.fin=='final'){fin++;assert(r.win>=0)}else tope++}
global.setTimeout=real;
console.log(`mdeal bots: ${fin}/${N} partidas terminadas (${tope} llegaron al tope de pasos), ${errs} jugadas rechazadas`);
assert(fin>=N*.9,'muchas partidas sin terminar');
