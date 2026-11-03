// Ruleta Rusa: sonidos hechos con código (Web Audio, sin archivos), igual que en Haciendas. Lo usa c_ruleta3d.js como window.RRS:
// snd('giro'|'clic'|'disparo'|'caida'|'chispa'), breath(segundos) → respiración agitada que se acelera (devuelve con qué pararla), hum(on) → zumbido del foco.
(function(){
let NZ=null,HUM=null;
const muted=()=>typeof mute!='undefined'&&mute;
function ctx(){AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume();return AC}
function kit(A,dst){dst=dst||A.destination;
 const tone=(t,f0,f1,d,v,ty)=>{const o=A.createOscillator(),g=A.createGain();o.type=ty||'sine';o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d*.8);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(dst);o.start(t);o.stop(t+d+.02)};
 const noise=(t,d,v,f0,f1,q,ty,at)=>{if(!NZ){NZ=A.createBuffer(1,A.sampleRate,A.sampleRate);const a=NZ.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1}
  const s=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain();s.buffer=NZ;f.type=ty||'bandpass';f.Q.value=q||1;f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+d*.7);
  g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(v,t+d*(at||.15));g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f);f.connect(g);g.connect(dst);s.start(t,Math.random()*.4);s.stop(t+d+.02)};
 return {tone,noise}}
function snd(k){if(muted())return;try{const A=ctx(),t0=A.currentTime,{tone,noise}=kit(A);
 ({// trinquete del tambor: rápido al principio y se va frenando
  giro:()=>{let t=t0;for(let i=0;i<20;i++){noise(t,.025,.22,3800+Math.random()*900,0,6);tone(t,1900,1500,.02,.03,'square');t+=.035+i*i*.0007}tone(t+.03,900,600,.05,.08,'triangle')},
  // martillo que pega en vacío: seco y metálico
  clic:()=>{noise(t0,.035,.45,4200,0,5);tone(t0,2600,1300,.04,.12,'square');tone(t0+.006,190,120,.07,.18,'triangle');noise(t0+.05,.02,.12,6000,0,8)},
  // disparo en un cuarto cerrado: chasquido, golpe grave, eco y el zumbido en los oídos
  disparo:()=>{noise(t0,.06,1,5000,2500,.6,'bandpass',.05);noise(t0,.5,.9,2400,180,.4,'lowpass',.02);tone(t0,140,38,.45,.9);tone(t0,70,30,.7,.6,'triangle');
   noise(t0+.08,1.6,.25,700,160,.7,'lowpass',.1);noise(t0+.25,1.2,.08,1400,500,2);tone(t0+.15,4100,3900,2.6,.025)},
  // cuerpo que cae de la silla: golpe sordo, la silla que rebota y un último golpe
  caida:()=>{tone(t0,95,42,.35,.7);noise(t0,.3,.5,320,90,.8,'lowpass',.05);[.16,.27,.34].forEach((d,i)=>{tone(t0+d,520-i*90,300,.06,.18-i*.04,'triangle');noise(t0+d,.05,.15,1600,0,3)});tone(t0+.5,70,40,.3,.45);noise(t0+.5,.25,.25,260,80,.8,'lowpass',.05)},
  // el foco que parpadea
  chispa:()=>{for(let i=0;i<4;i++)noise(t0+i*.03+Math.random()*.02,.02,.06,3000+Math.random()*3000,0,4)}})[k]()}catch(e){}}
// respiración agitada (y el corazón) durante d segundos: cada vez más rápida
function breath(d){if(muted())return ()=>{};try{const A=ctx(),out=A.createGain(),{tone,noise}=kit(A,out);out.gain.value=1;out.connect(A.destination);
 let t=A.currentTime+.05;const end=t+d;
 while(t<end){const f=(t-A.currentTime)/d,per=1.05-f*.72,v=.16+f*.22;   // de ~1 respiración por segundo a ~3
  noise(t,per*.42,v,900+f*400,1500,1.2,'bandpass',.45);noise(t+per*.46,per*.5,v*.8,700+f*300,500,1,'bandpass',.25);t+=per}
 for(let h=A.currentTime+.1,i=0;h<end;i++){tone(h,62,40,.12,.22+i*.008);tone(h+.16,55,38,.1,.15+i*.006);h+=Math.max(.36,.82-i*.05)}
 return ()=>{try{out.gain.setTargetAtTime(0,A.currentTime,.03);setTimeout(()=>out.disconnect(),400)}catch(e){}}}catch(e){return ()=>{}}}
// zumbido leve del foco (corriente de 60 Hz): suena todo el tiempo que estás en el sótano
function hum(on){on=on&&!muted();if(!!HUM===on)return;try{
 if(!on){const H=HUM;HUM=null;H.g.gain.setTargetAtTime(0,H.A.currentTime,.1);setTimeout(()=>{try{H.os.forEach(o=>o.stop())}catch(e){}},600);return}
 const A=ctx(),g=A.createGain(),lp=A.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;g.gain.value=0;g.gain.setTargetAtTime(.022,A.currentTime,.4);lp.connect(g);g.connect(A.destination);
 const os=[[120,'sawtooth',1],[240,'sine',.5],[360,'square',.12]].map(([f,ty,v])=>{const o=A.createOscillator(),og=A.createGain();o.type=ty;o.frequency.value=f+Math.random()*.4;og.gain.value=v;o.connect(og);og.connect(lp);o.start();return o});
 HUM={A,g,os}}catch(e){HUM=null}}
// cuando el foco parpadea, el zumbido se corta un instante
function flick(){if(HUM)try{const t=HUM.A.currentTime;HUM.g.gain.setValueAtTime(.004,t);HUM.g.gain.setTargetAtTime(.022,t+.08,.05)}catch(e){}}
window.RRS={snd,breath,hum,flick};
})();
