// Rummy: sonidos hechos con código (Web Audio, sin archivos), como los de la Ruleta y Haciendas. Lo usan c_rummyui.js y c_rummy3d.js como window.RMS:
// snd('clac'|'roce'|'mez'|'mal'|'gana'|'aplauso'|'tap'|'tic') fichas de madera, bolsa y reacciones · voz(texto) exclamaciones cortas de los abuelos (voz del navegador)
// amb(on) grillos, un perro a lo lejos, el ventilador y la cucharita · radio(on) boleros instrumentales generados al momento (nada grabado), con sonido de radio vieja.
(function(){
let NZ=null,MS=null,AMB=null,FAN=null,RAD=null,on=false,lastVoz=0,radioOn=(()=>{try{return localStorage.getItem('rm_radio')!=='0'}catch(e){return true}})();
const muted=()=>typeof mute!='undefined'&&mute,rnd=(a,b)=>a+Math.random()*(b-a);
// el AudioContext es el de game.js (AC); sin Web Audio todo se queda callado
function ctx(){try{const K=window.AudioContext||window.webkitAudioContext;if(!K)return null;AC=AC||new K();if(AC.state!='running')AC.resume();return AC}catch(e){return null}}
function master(A){if(!MS){MS=A.createGain();MS.gain.value=.9;MS.connect(A.destination)}return MS}
function nbuf(A){if(!NZ){NZ=A.createBuffer(1,A.sampleRate*2,A.sampleRate);const a=NZ.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1}return NZ}
function tone(A,dst,t,f0,f1,d,v,ty){const o=A.createOscillator(),g=A.createGain();o.type=ty||'sine';o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d*.8);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(dst);o.start(t);o.stop(t+d+.03)}
function noise(A,dst,t,d,v,f0,f1,q,ty,at){const s=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain();s.buffer=nbuf(A);f.type=ty||'bandpass';f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+d*.7);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+d*(at||.15));g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(dst);s.start(t,Math.random()*1.5);s.stop(t+d+.03)}
// ---------- efectos ----------
function snd(n,v){const A=!muted()&&ctx();if(!A)return;const t=A.currentTime+.01,D=master(A),T=(...a)=>tone(A,D,...a),N=(...a)=>noise(A,D,...a);v=v||1;
 if(n=='clac'){N(t,.05,.45*v,2600,900,1.3,'bandpass',.04);T(t,560,190,.07,.22*v,'triangle')}                       // ficha de madera que cae en la mesa
 else if(n=='roce'){N(t,.38,.2,800,2600,.8,'bandpass',.35);N(t+.34,.05,.35,2200,900,1.2,'bandpass',.05)}             // mano en la bolsa y la ficha que sale
 else if(n=='mez'){for(let i=0;i<10;i++){const d=i*.12+Math.random()*.05;N(t+d,.12,.22,rnd(1100,2500),600,1,'bandpass',.2);if(i%2)T(t+d,rnd(280,480),150,.05,.07,'triangle')}}
 else if(n=='mal'){T(t,330,300,.18,.16,'triangle');T(t+.2,247,220,.32,.16,'triangle')}
 else if(n=='gana'){[523,659,784,1047].forEach((f,i)=>T(t+i*.12,f,0,.4,.15,'triangle'))}
 else if(n=='aplauso'){for(let i=0;i<70;i++)N(t+Math.random()*2.4,.05,rnd(.15,.35),rnd(1700,3200),0,.8,'bandpass',.1)}
 else if(n=='tap'){T(t,150,90,.06,.1,'sine');N(t,.03,.06,700,0,1,'lowpass',.1)}                                       // dedos en la mesa
 else if(n=='tic')T(t,1300,900,.04,.05,'sine')}
// murmullo de abuelo: un "mmm" grave con la boca cerrada
function murmullo(){const A=!muted()&&ctx();if(!A)return;const t=A.currentTime+.02,o=A.createOscillator(),f=A.createBiquadFilter(),g=A.createGain(),f0=rnd(105,190);o.type='sawtooth';
 o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f0*rnd(.8,1.25),t+.5);f.type='lowpass';f.frequency.value=420;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+.08);g.gain.exponentialRampToValueAtTime(.0001,t+.6);
 o.connect(f);f.connect(g);g.connect(master(A));o.start(t);o.stop(t+.65)}
// exclamación corta con la voz del navegador (en español, más grave y despacio, como de abuelo); si no hay voz, un murmullo
function voz(txt){if(muted()||Date.now()-lastVoz<1600)return;lastVoz=Date.now();const S=window.speechSynthesis;if(!S||typeof SpeechSynthesisUtterance=='undefined')return murmullo();
 try{const u=new SpeechSynthesisUtterance(txt),vs=S.getVoices(),v=vs.find(x=>/^es[-_]MX/i.test(x.lang))||vs.find(x=>/^es/i.test(x.lang));u.lang=v?v.lang:'es-MX';if(v)u.voice=v;u.rate=rnd(.82,.95);u.pitch=rnd(.6,.9);u.volume=.65;S.cancel();S.speak(u)}catch(e){murmullo()}}
// ---------- ambiente de la terraza al anochecer ----------
function amb(v){v=!!v&&!!ctx();if(v===on)return;on=v;if(v){const A=ctx(),s=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain();s.buffer=nbuf(A);s.loop=true;f.type='lowpass';f.frequency.value=260;g.gain.value=muted()?0:.035;
  s.connect(f);f.connect(g);g.connect(master(A));s.start();FAN={s,g};
  AMB=setInterval(()=>{const A=ctx();if(!A)return;const t=A.currentTime+.02,D=master(A);if(FAN)FAN.g.gain.setTargetAtTime(muted()?0:.035,t,.3);if(muted())return;
   if(Math.random()<.75){const f=rnd(4100,4800),n=3+(Math.random()*4|0);for(let i=0;i<n;i++)tone(A,D,t+i*.065,f,0,.035,.018,'sine')}                    // grillos
   if(Math.random()<.018)[0,.28].forEach(d=>{noise(A,D,t+d,.16,.05,620,380,2,'bandpass',.1);tone(A,D,t+d,430,300,.14,.025,'triangle')});                // perro a lo lejos
   if(Math.random()<.025)[0,.11,.2].forEach(d=>{tone(A,D,t+d,2650,0,.16,.025,'sine');tone(A,D,t+d,3950,0,.12,.012,'sine')})},700)}                    // cucharita en la taza
 else{clearInterval(AMB);AMB=null;if(FAN){try{FAN.s.stop()}catch(e){}FAN=null}}radioRun(on&&radioOn)}
// ---------- la radio: boleros instrumentales generados (requinto, guitarras, bajo, maracas y bongó) ----------
const NT=m=>440*Math.pow(2,(m-69)/12),Q={m:[0,3,7],M:[0,4,7],'7':[0,4,7,10],d:[0,3,6]};
const PR=[[[0,'m'],[5,'m'],[7,'7'],[0,'m']],[[0,'m'],[8,'M'],[5,'m'],[7,'7']],[[0,'m'],[5,'m'],[10,'M'],[3,'M'],[8,'M'],[2,'d'],[7,'7'],[0,'m']]];
function newSong(){return {key:57+[0,2,4,5,-2][Math.random()*5|0],bpm:rnd(68,82),pr:PR[Math.random()*PR.length|0],bar:0,bars:24+(Math.random()*3|0)*8,mel:0}}
function curve(k){const n=1024,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(k*x)/Math.tanh(k)}return c}
function radio(v){if(v===undefined)v=!radioOn;radioOn=!!v;try{localStorage.setItem('rm_radio',radioOn?'1':'0')}catch(e){}radioRun(on&&radioOn);return radioOn}
function radioRun(go){if(!go||!ctx()){if(RAD){const r=RAD;RAD=null;clearInterval(r.iv);r.out.gain.setTargetAtTime(0,ctx().currentTime,.15);setTimeout(()=>{try{r.st.stop()}catch(e){}r.out.disconnect()},900)}return}
 if(RAD)return;const A=ctx(),out=A.createGain(),hp=A.createBiquadFilter(),lp=A.createBiquadFilter(),ws=A.createWaveShaper();out.gain.value=0;out.gain.setTargetAtTime(.5,A.currentTime,.5);
 hp.type='highpass';hp.frequency.value=280;lp.type='lowpass';lp.frequency.value=3300;ws.curve=curve(1.8);hp.connect(lp);lp.connect(ws);ws.connect(out);out.connect(master(A));
 const st=A.createBufferSource(),sf=A.createBiquadFilter(),sg=A.createGain();st.buffer=nbuf(A);st.loop=true;sf.type='bandpass';sf.frequency.value=2400;sg.gain.value=.01;st.connect(sf);sf.connect(sg);sg.connect(out);st.start();   // estática
 RAD={out,inp:hp,st,next:A.currentTime+.4,song:newSong()};RAD.iv=setInterval(sched,120)}
function pluck(A,t,f,d,v){const o=A.createOscillator(),o2=A.createOscillator(),fl=A.createBiquadFilter(),g=A.createGain();o.type='triangle';o2.type='sine';o.frequency.value=f;o2.frequency.value=f*2;
 fl.type='lowpass';fl.frequency.setValueAtTime(3200,t);fl.frequency.exponentialRampToValueAtTime(700,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);
 const g2=A.createGain();g2.gain.value=.3;o.connect(fl);o2.connect(g2);g2.connect(fl);fl.connect(g);g.connect(RAD.inp);o.start(t);o2.start(t);o.stop(t+d+.05);o2.stop(t+d+.05)}
function lead(A,t,f,d,v){const o=A.createOscillator(),lf=A.createOscillator(),lg=A.createGain(),g=A.createGain();o.type='triangle';o.frequency.setValueAtTime(f,t);lf.frequency.value=5.5;lg.gain.value=f*.006;lf.connect(lg);lg.connect(o.frequency);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.02);g.gain.setTargetAtTime(v*.6,t+.05,.2);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(RAD.inp);o.start(t);lf.start(t);o.stop(t+d+.05);lf.stop(t+d+.05)}
function perc(A,t,kind,v){const D=RAD.inp;if(kind=='mar')noise(A,D,t,.06,.05*v,6500,0,.7,'highpass',.2);else tone(A,D,t,kind=='hi'?420:260,kind=='hi'?300:170,.12,.12*v,'sine')}
// un compás a la vez, un poco antes de que suene
function sched(){if(!RAD)return;const A=ctx();RAD.out.gain.setTargetAtTime(muted()?0:.5,A.currentTime,.2);
 while(RAD.next<A.currentTime+.7){const S=RAD.song,b=60/S.bpm,t=RAD.next,[ro,q]=S.pr[S.bar%S.pr.length],root=S.key+ro,ch=Q[q].map(i=>root+i);
  if(S.bar>=S.bars){RAD.song=newSong();RAD.next=t+rnd(2.5,4);continue}   // entre canción y canción, solo la estática
  // bajo: raíz y quinta con el ritmo de bolero
  [[0,root-12,1.4],[1.5,root-5,.5],[2,root-12,1],[3,root-5,.9]].forEach(([o,m,d])=>pluck(A,t+o*b,NT(m),d*b,.16));
  // guitarra rasgueada en los contratiempos
  [.5,1.5,2.5,3,3.5].forEach((o,i)=>ch.forEach((m,j)=>pluck(A,t+o*b+j*.012,NT(m+12),.45*b,i==3?.06:.045)));
  // maracas en cada octavo y el bongó con su martillo
  for(let i=0;i<8;i++)perc(A,t+i*b/2,'mar',i%2?.7:1);[[.5,'hi'],[1.5,'hi'],[2.5,'hi'],[3,'lo'],[3.5,'hi']].forEach(([o,k])=>perc(A,t+o*b,k,.8));
  // requinto: frases de dos compases sobre las notas del acorde y la escala menor armónica, con descansos
  const sc=[0,2,3,5,7,8,11].map(i=>S.key+12+i),rest=S.bar%4==3&&Math.random()<.6;
  if(!rest){let o=0;while(o<4){const d=[.5,1,1,1.5,.5][Math.random()*5|0];if(Math.random()<.85){const pool=Math.random()<.6?ch.map(m=>m+12):sc;S.mel=Math.max(0,Math.min(pool.length-1,S.mel+(Math.random()*3|0)-1));
    lead(A,t+o*b,NT(pool[S.mel%pool.length]+(Math.random()<.2?12:0)),Math.min(d,4-o)*b*.95,.07)}o+=d}}
  S.bar++;RAD.next=t+4*b}}
// el navegador no deja sonar nada hasta que tocas la pantalla
addEventListener('pointerdown',()=>{if(typeof AC!='undefined'&&AC&&AC.state!='running')AC.resume()});
window.RMS={snd,voz,murmullo,amb,radio,get radioOn(){return radioOn}};
})();
