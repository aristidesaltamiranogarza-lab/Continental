// Partidas de Rummy solo con bots (sin pausas): node tests/rummy_bots.js [partidas]
const M=require('../g_rummy.js'),{plan}=require('../g_rummy_bot.js');
const N=+process.argv[2]||200;let malas=0,turnos=0,gan={sin:0,bolsa:0},lento=0,t0=Date.now();
for(let p=0;p<N;p++){const n=2+p%4,R={players:Array.from({length:n},(_,i)=>({id:i,name:'B'+i,tok:'t'+i})),opts:{}};M.start(R);const G=R.G;let t=0;
 while(G.phase=='play'&&t<2000){const k=G.turn,a=Date.now(),pl=plan(G.mesa,G.racks[k],G.down[k]);lento=Math.max(lento,Date.now()-a);
  if(pl)for(const s of pl.pasos){const e=M.act(R,'t'+k,{t:'tmp',mesa:s});if(e)throw new Error('paso: '+e)}
  const e=M.act(R,'t'+k,{t:'end',mesa:pl?pl.mesa:null});if(e)throw new Error(e);t++}
 clearTimeout(R.rmT);turnos+=t;malas+=G.log.filter(l=>/volvió a como estaba/.test(l.t)).length;
 if(G.phase!='final')throw new Error('no terminó');gan[G.racks[G.win].length?'bolsa':'sin']++}
console.log(N+' partidas · turnos/partida '+(turnos/N).toFixed(1)+' · jugadas inválidas '+malas+' · ganó sin fichas '+gan.sin+' / por puntos '+gan.bolsa+' · peor turno '+lento+' ms · total '+(Date.now()-t0)+' ms');
if(malas)process.exit(1);
