// Partidas de Continental solo con bots (g_continental_bot.js): las 7 rondas terminan, sin jugadas rechazadas.  Uso: node tests/continental_bots.js
const assert=require('assert'),M=require('../g_continental.js');
function partida(n){const R={players:Array.from({length:n},(_,i)=>({id:'b'+i,name:'Bot'+i,tok:'t'+i,bot:true,out:false})),host:'t0',cl:{}};
 M.start(R,{round:0});let pasos=0,err=0,compras=0,bajadas=0;
 while(R.G.phase!='final'&&pasos<20000){pasos++;R.G.cdUntil=0;let best=null;
  R.players.forEach((p,k)=>{const d=M.bot(R,k);if(d&&(!best||d.ms<best.ms))best={k,d}});
  assert(best,'nadie se mueve en la ronda '+R.G.round+' ('+R.G.phase+')');
  const t=best.d.m.t;if(t=='buy')compras++;if(t=='down')bajadas++;
  const e=M.act(R,R.players[best.k].tok,best.d.m);if(e){err++;console.log('rechazo',best.d.m,e);assert(err<5,'demasiados rechazos')}
  // los tiempos de los bots no importan aquí
  for(const x in R.bc)if(x[0]=='t')R.bc[x]=0}
 assert.equal(R.G.phase,'final','no terminó en '+pasos+' pasos');
 return {pasos,err,compras,bajadas,pts:R.G.scores.reduce((a,s)=>a.map((v,i)=>v+s[i]))}}
const t0=Date.now();
for(const n of [2,3,4,5])for(let r=0;r<2;r++){const o=partida(n);assert.equal(o.err,0);if(!r)console.log(n,'bots:',JSON.stringify(o))}
console.log('continental bots ok',Date.now()-t0,'ms');
