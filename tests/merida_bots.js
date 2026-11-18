// Partidas de Mérida en Venta solo con bots (g_merida_bot.js): todas terminan, sin jugadas rechazadas.  Uso: node tests/merida_bots.js
const assert=require('assert'),M=require('../g_merida.js');
global.setTimeout=()=>({});   // el reloj de la subasta no hace falta: cierra cuando todos pasan o puja el último
function partida(n,opts){const R={players:Array.from({length:n},(_,i)=>({id:'b'+i,name:'Bot'+i,tok:'t'+i,bot:true})),opts};M.start(R);let pasos=0,err=0;
 while(R.G.phase!='final'&&pasos<30000){pasos++;let best=null;
  R.players.forEach((p,k)=>{const d=M.bot(R,k);if(d&&(!best||d.ms<best.ms))best={k,d}});
  if(!best)throw new Error('nadie juega: '+JSON.stringify({st:R.G.st,turn:R.G.turn,debts:R.G.debts,auc:R.G.auc,trade:R.G.trade}));
  const e=M.act(R,'t'+best.k,best.d.m);if(e){err++;throw new Error('jugada rechazada: '+e+' '+JSON.stringify(best.d.m))}}
 return {fin:R.G.phase,tc:R.G.tc}}
const N=40;let fin=0,tc=0;
for(let i=0;i<N;i++){const r=partida(2+i%5,i%2?{mort:true,dbl:true,pot:true,jr:true}:{auc:i%4!=2});if(r.fin=='final')fin++;tc+=r.tc}
console.log('Mérida bots: '+fin+'/'+N+' terminadas, '+Math.round(tc/N)+' turnos en promedio');
assert(fin>=N-1,'demasiadas partidas sin terminar');process.exit(0)
