// Música de fondo hecha con Web Audio (sin archivos): una canción para el menú y una para cada juego.
// Se carga después de game.js. musSync() elige la canción según la pantalla; musCyc() cambia el volumen.
(function(){
let mlvl=2;try{const x=localStorage.getItem('cont_mus');if(x!=null)mlvl=+x}catch(e){}
const LV=[0,.16,.3,.48],LN=['apagada','baja','media','alta'];
let ctx=null,master=null,bus=null,cur=null,timer=null,noise=null;const buf={};
const hz=m=>440*Math.pow(2,(m-69)/12);

// ---------- instrumentos ----------
// tonos pregrabados en un buffer (una vez por nota): piano eléctrico, piano, bajo, marimba
const TB={ep:{h:[[1,1],[2,.28],[3,.06],[7,.04]],d:2.4,k:1.6},pno:{h:[[1,1],[2,.55],[3,.3],[4,.18],[5,.1],[6,.06]],d:2,k:2.6},
 bass:{h:[[1,1],[2,.45],[3,.12]],d:1.4,k:2.2},mal:{h:[[1,1],[4,.35],[10,.08]],d:1.1,k:5}};
function tone(t,m){const key=t+m;if(buf[key])return buf[key];const sr=ctx.sampleRate;
 if(t=='gtr'){   // cuerda punteada (Karplus-Strong)
  const n=sr*1.8|0,b=ctx.createBuffer(1,n,sr),a=b.getChannelData(0),N=Math.max(2,Math.round(sr/hz(m)));
  for(let i=0;i<N;i++)a[i]=Math.random()*2-1;for(let i=N;i<n;i++)a[i]=(a[i-N]+a[i-N+1])*.4985;
  for(let i=0;i<N;i++)a[i]*=i/N;return buf[key]=b}
 const T=TB[t],n=sr*T.d|0,b=ctx.createBuffer(1,n,sr),a=b.getChannelData(0),f=hz(m),w=2*Math.PI/sr;
 T.h.forEach(([k,g],j)=>{const fk=f*k;if(fk>sr/2.2)return;const dk=T.k*(1+j*.6);for(let i=0;i<n;i++)a[i]+=g*Math.sin(w*fk*i)*Math.exp(-dk*i/sr)});
 const at=sr*.004;for(let i=0;i<at;i++)a[i]*=i/at;let mx=0;for(let i=0;i<n;i++)mx=Math.max(mx,Math.abs(a[i]));for(let i=0;i<n;i++)a[i]/=mx||1;
 return buf[key]=b}
function play(out,t,ins,m,v,len){const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=tone(ins,m);g.gain.value=v;
 if(len){g.gain.setValueAtTime(v,t+len);g.gain.exponentialRampToValueAtTime(.001,t+len+.12)}s.connect(g);g.connect(out);s.start(t);s.stop(t+(len?len+.15:s.buffer.duration))}
// osciladores para el chiptune de UNO
function osc(out,t,type,m,v,len,cut){const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type=type;o.frequency.value=hz(m);f.type='lowpass';f.frequency.value=cut||3500;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.setValueAtTime(v*.8,t+len*.6);g.gain.exponentialRampToValueAtTime(.001,t+len);o.connect(f);f.connect(g);g.connect(out);o.start(t);o.stop(t+len+.02)}
// percusión
function nzs(){if(noise)return noise;const n=ctx.sampleRate,b=ctx.createBuffer(1,n,n),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;return noise=b}
function hit(out,t,ft,fq,v,d,q){const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=nzs();f.type=ft;f.frequency.value=fq;f.Q.value=q||.7;
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f);f.connect(g);g.connect(out);s.start(t,Math.random()*.5);s.stop(t+d+.02)}
function drum(out,t,f0,f1,v,d,type){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+d*.6);
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(out);o.start(t);o.stop(t+d+.02)}
const kick=(o,t,v)=>drum(o,t,120,42,v,.28),hat=(o,t,v,d)=>hit(o,t,'highpass',7500,v,d||.04),shaker=(o,t,v)=>hit(o,t,'bandpass',6000,v,.06,1.5),
 brush=(o,t,v)=>hit(o,t,'bandpass',2600,v,.16,.6),snare=(o,t,v)=>{hit(o,t,'bandpass',1900,v,.14,.8);drum(o,t,220,160,v*.5,.08,'triangle')},
 clave=(o,t,v)=>drum(o,t,2500,2400,v,.05),bongo=(o,t,v,hi)=>drum(o,t,hi?420:290,hi?360:245,v,.14),rim=(o,t,v)=>drum(o,t,1700,1500,v,.035,'triangle');
// notas de la melodía de un compás: [paso, nota, duración en pasos, (segunda voz)]
function mel(bar,i,fn){(bar||[]).forEach(n=>{if(n[0]===i)fn(n)})}

// ---------- canciones (compases de 16 pasos) ----------
const SONGS={
 // Menú: lounge / bossa tranquila en Fa
 menu:{bpm:84,sw:.12,bars:[
  {c:[53,57,60,64],r:41,m:[[0,72,4],[6,69,2],[8,76,6]]},{c:[53,57,60,62],r:38,m:[[2,74,2],[4,72,2],[6,69,8]]},
  {c:[55,58,62,65],r:43,m:[[0,70,3],[4,74,2],[8,77,6]]},{c:[52,55,58,62],r:36,m:[[2,76,2],[4,74,2],[6,72,2],[8,70,6]]},
  {c:[57,60,64,67],r:45,m:[[0,72,4],[6,76,2],[8,79,6]]},{c:[54,57,60,62],r:38,m:[[0,78,3],[4,76,2],[8,74,6]]},
  {c:[55,58,62,65],r:43,m:[[2,74,2],[4,72,2],[6,70,2],[8,67,6]]},{c:[52,55,58,64],r:36,m:[[0,70,2],[2,69,2],[4,67,2],[8,72,8]]}],
  step(o,i,t,sd){const B=this.bars,k=Math.floor(i/16),s=i%16,bar=B[k%8],pass=Math.floor(k/8)%2;
   if([0,3,6,10,12].includes(s))bar.c.forEach((m,j)=>play(o,t+j*.012,'ep',m,s==0?.11:.07,sd*(s==6?3:2)));
   if(s==0||s==8)play(o,t,'bass',bar.r,.42,sd*5);if(s==6||s==14)play(o,t,'bass',bar.r+7,.3,sd*2);
   if(pass==0)mel(bar.m,s,n=>play(o,t,'mal',n[1],.2,sd*n[2]));else if(s==0)play(o,t,'mal',bar.m[0][1]+12,.1,sd*6);
   if(s%2==0)shaker(o,t,s%4?.035:.05);if(s==3||s==10)rim(o,t,.08);if(s==0)kick(o,t,.18)}},
 // Continental: trío con requintos en terceras, tumbao y clave (La menor)
 continental:{bpm:104,bars:[
  {c:[57,60,64,69],r:45,m:[[0,76,4,72],[4,74,2,71],[6,72,2,69],[8,76,6,72]]},{c:[57,62,65,69],r:38,m:[[0,77,4,74],[4,76,2,72],[6,74,2,71],[8,72,6,69]]},
  {c:[55,59,62,67],r:43,m:[[0,74,4,71],[4,72,2,69],[6,71,2,67],[8,74,6,71]]},{c:[55,60,64,67],r:48,m:[[0,76,4,72],[4,74,2,71],[6,72,2,67],[8,72,6,67]]},
  {c:[57,60,65,69],r:41,m:[[0,77,4,72],[4,76,2,72],[6,74,2,69],[8,72,6,69]]},{c:[57,62,65,69],r:38,m:[[0,74,2,69],[2,76,2,72],[4,77,4,74],[8,81,6,77]]},
  {c:[56,59,62,64],r:40,m:[[0,80,4,76],[4,77,2,74],[6,76,2,71],[8,74,6,71]]},{c:[57,60,64,69],r:45,m:[[0,72,6,69],[8,69,8,64]]}],
  step(o,i,t,sd){const k=Math.floor(i/16),s=i%16,bar=this.bars[k%8],pass=Math.floor(k/8)%2,c=bar.c;
   // guitarra rítmica: rasgueo en 1 y arpegio en los demás octavos
   if(s==0)c.forEach((m,j)=>play(o,t+j*.018,'gtr',m,.16));else if(s%2==0)play(o,t,'gtr',c[(s/2)%4],.12);
   if(s==0)play(o,t,'bass',bar.r,.45,sd*3);if(s==6)play(o,t,'bass',bar.r+7,.35,sd*2);if(s==12)play(o,t,'bass',bar.r+12,.3,sd*2);
   if(pass==0)mel(bar.m,s,n=>{play(o,t,'gtr',n[1],.26);play(o,t+.01,'gtr',n[3],.2)});
   else if(s==0&&k%2==0)play(o,t,'gtr',c[3]+12,.12);
   if((k%2==0?[0,6,12]:[4,8]).includes(s))clave(o,t,.07);
   if(s%4==0)bongo(o,t,.12,1);else if(s%4==2)bongo(o,t,.07,0);if(s%2)shaker(o,t,.03)}},
 // UNO: chiptune pop alegre (Do mayor)
 uno:{bpm:136,bars:[
  {c:[60,64,67],r:36,m:[[0,72,2],[2,76,2],[4,79,2],[6,76,2],[8,84,4],[12,79,4]]},{c:[59,62,67],r:43,m:[[0,79,2],[2,77,2],[4,76,2],[6,74,2],[8,71,4],[12,74,4]]},
  {c:[60,64,69],r:45,m:[[0,72,2],[2,76,2],[4,81,2],[6,79,2],[8,76,4],[12,72,2],[14,74,2]]},{c:[60,65,69],r:41,m:[[0,77,4],[4,76,2],[6,74,2],[8,72,6],[14,71,2]]},
  {c:[60,64,67],r:36,m:[[0,72,2],[2,76,2],[4,79,2],[6,76,2],[8,84,4],[12,79,4]]},{c:[59,62,67],r:43,m:[[0,79,2],[2,81,2],[4,83,2],[6,86,2],[8,83,4],[12,79,4]]},
  {c:[60,65,69],r:41,m:[[0,81,2],[2,79,2],[4,77,2],[6,76,2],[8,74,2],[10,77,2],[12,81,4]]},{c:[59,62,67],r:43,m:[[0,79,6],[8,74,2],[10,76,2],[12,77,2],[14,71,2]]}],
  step(o,i,t,sd){const k=Math.floor(i/16),s=i%16,bar=this.bars[k%8],pass=Math.floor(k/8)%2;
   osc(o,t,'square',bar.c[s%3]+(s%6>2?12:0),pass?.045:.03,sd*.9,2400);
   if(s%2==0)osc(o,t,'triangle',bar.r+(s%4?12:0),.2,sd*1.6,1200);
   if(pass==0)mel(bar.m,s,n=>osc(o,t,'square',n[1],.07,sd*n[2]*.95,3800));
   else mel(bar.m,s,n=>{if(n[0]%4==0)osc(o,t,'triangle',n[1]+12,.06,sd*2,5000)});
   if(s==0||s==8||(s==10&&k%2))kick(o,t,.32);if(s==4||s==12)snare(o,t,.16);if(s%2==0)hat(o,t,s%4?.03:.05)}},
 // Monopoly Deal: ragtime de piano (Fa mayor)
 monopolydeal:{bpm:112,bars:[
  {c:[57,60,65],r:41,f:36,m:[[0,72,2],[2,69,1],[3,72,2],[6,77,2],[8,76,2],[10,77,2],[12,81,4]]},{c:[54,60,62],r:38,f:33,m:[[0,78,2],[2,74,1],[3,78,2],[6,81,2],[8,79,2],[10,78,2],[12,74,4]]},
  {c:[53,59,62],r:43,f:38,m:[[0,77,2],[2,74,1],[3,77,2],[6,79,2],[8,77,2],[10,74,2],[12,71,4]]},{c:[52,58,60],r:36,f:31,m:[[0,70,2],[2,72,2],[4,74,2],[6,76,2],[8,79,4],[12,76,4]]},
  {c:[57,60,65],r:41,f:36,m:[[0,72,2],[2,69,1],[3,72,2],[6,77,2],[8,76,2],[10,77,2],[12,81,4]]},{c:[51,57,60],r:41,f:36,m:[[0,75,2],[2,72,1],[3,75,2],[6,77,2],[8,81,2],[10,84,4]]},
  {c:[53,58,62],r:34,f:41,m:[[0,82,2],[2,77,1],[3,82,2],[6,81,2],[8,79,2],[10,77,2],[12,74,4]]},{c:[52,58,60],r:36,f:31,m:[[0,76,2],[2,79,2],[4,82,2],[6,79,2],[8,76,2],[10,72,2],[12,70,4]]}],
  step(o,i,t,sd){const k=Math.floor(i/16),s=i%16,bar=this.bars[k%8],pass=Math.floor(k/8)%2;
   // mano izquierda "stride": bajo en 1 y 3, acorde en 2 y 4
   if(s==0)play(o,t,'pno',bar.r,.42,sd*3);if(s==8)play(o,t,'pno',bar.f,.38,sd*3);
   if(s==4||s==12)bar.c.forEach(m=>play(o,t,'pno',m,.14,sd*2));
   mel(bar.m,s,n=>{play(o,t,'pno',n[1]+(pass?12:0),pass?.17:.22,sd*n[2]);if(!pass&&n[2]>=4)play(o,t,'pno',n[1]-12,.1,sd*n[2])});
   if(s==4||s==12)brush(o,t,.07);if(s%4==0)hat(o,t,.035,.08)}}};

// ---------- reproducción ----------
function init(){if(ctx)return true;if(typeof AC=='undefined'||!AC)return false;ctx=AC;
 master=ctx.createGain();master.gain.value=LV[mlvl];master.connect(ctx.destination);bus=ctx.createGain();bus.connect(master);
 // reverb suave
 const sr=ctx.sampleRate,n=sr*1.8|0,ir=ctx.createBuffer(2,n,sr);for(let c=0;c<2;c++){const a=ir.getChannelData(c);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/n,3)}
 const cv=ctx.createConvolver(),wet=ctx.createGain();cv.buffer=ir;wet.gain.value=.22;bus.connect(cv);cv.connect(wet);wet.connect(master);return true}
function tick(){if(!cur||ctx.state!=='running')return;const T=SONGS[cur.id],sd=60/T.bpm/4;
 if(cur.next<ctx.currentTime)cur.next=ctx.currentTime+.05;   // la pestaña estuvo dormida: no ponerse al corriente de golpe
 while(cur.next<ctx.currentTime+.18){const sw=cur.i%2?sd*(T.sw||0):0;try{T.step(cur.g,cur.i,cur.next+sw,sd)}catch(e){}cur.i++;cur.next+=sd}}
function start(id){if(cur&&cur.id===id)return;const now=ctx.currentTime;
 if(cur){const g=cur.g;g.gain.cancelScheduledValues(now);g.gain.setValueAtTime(g.gain.value,now);g.gain.linearRampToValueAtTime(0,now+1.2);setTimeout(()=>g.disconnect(),1600)}
 if(!id){cur=null;return}const g=ctx.createGain();g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(1,now+1.6);g.connect(bus);
 cur={id,g,i:0,next:now+.1};if(!timer)timer=setInterval(tick,30)}
function want(){if(!mlvl||document.hidden)return null;if(typeof S=='undefined'||!S||!V||!V.G)return 'menu';return SONGS[V.game]?V.game:'menu'}
window.musSync=function(){if(!init())return;start(want())};
window.musCyc=function(){mlvl=(mlvl+1)%4;try{localStorage.setItem('cont_mus',mlvl)}catch(e){}if(init()){master.gain.setTargetAtTime(LV[mlvl],ctx.currentTime,.1);musSync()}render()};
window.musName=()=>LN[mlvl];
window.musUI=()=>`<button class="b g sm2" onclick="musCyc()">${mlvl?'🎵':'🔇'} Música: ${LN[mlvl]}</button>`;
// el navegador solo deja sonar audio después de que el jugador toca algo
['pointerdown','keydown'].forEach(e=>document.addEventListener(e,()=>{setTimeout(musSync,0)}));
document.addEventListener('visibilitychange',()=>{if(ctx)musSync()});
})();
