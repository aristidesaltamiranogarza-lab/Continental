// c_billar_son.js — BSON: sonidos del Billar hechos con WebAudio (sin archivos): taco, choque bola-bola, banda y tronera.
// Volumen y tono según la velocidad del golpe (ev.v de BFIS). BREP avisa cada evento a su tiempo: BSON.ev(ev).
// Respeta el silencio de los sonidos (mute de game.js). Ajustes en BSON.A. (Pendiente: cambiar por grabaciones CC0.)
(function(){
const A={vol:.55,vref:5,bola:[2600,3600],banda:[95,150],gap:.006,max:6};
let ctx=null,ruido=null,ult={},n=0,t0=0;
function ac(){if(typeof mute!=='undefined'&&mute)return null;try{
 if(typeof AC!=='undefined'){AC=AC||new(window.AudioContext||window.webkitAudioContext)();ctx=AC}else ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();
 if(ctx.state==='suspended')ctx.resume();if(!ruido){const L=ctx.sampleRate*.5|0;ruido=ctx.createBuffer(1,L,ctx.sampleRate);const d=ruido.getChannelData(0);let s=1;
  for(let i=0;i<L;i++){s=(s*16807)%2147483647;d[i]=s/1073741823.5-1}}return ctx}catch(e){return null}}
const k01=v=>Math.min(1,Math.max(0,v/A.vref));
function env(c,t,g,d){const e=c.createGain();e.gain.setValueAtTime(Math.max(g,1e-4),t);e.gain.exponentialRampToValueAtTime(1e-4,t+d);e.connect(c.destination);return e}
function tono(c,t,hz,g,d,ty,hz2){const o=c.createOscillator();o.type=ty||'sine';o.frequency.setValueAtTime(hz,t);if(hz2)o.frequency.exponentialRampToValueAtTime(hz2,t+d);o.connect(env(c,t,g,d));o.start(t);o.stop(t+d+.02)}
function soplo(c,t,g,d,tipo,hz,q){const s=c.createBufferSource(),f=c.createBiquadFilter();s.buffer=ruido;f.type=tipo;f.frequency.value=hz;f.Q.value=q||1;
 s.connect(f);f.connect(env(c,t,g,d));s.start(t,Math.random()*.3);s.stop(t+d+.02)}
const SON={
 taco(c,t,v){const k=k01(v),g=A.vol*(.25+.6*k);soplo(c,t,g*.9,.035,'bandpass',1500+900*k,2.5);tono(c,t,900+300*k,g*.35,.05,'triangle',600)},
 bola(c,t,v){const k=k01(v),g=A.vol*(.08+.85*k*k),hz=A.bola[0]+(A.bola[1]-A.bola[0])*k*(.8+.4*Math.random());
  tono(c,t,hz,g*.6,.045+.03*k);tono(c,t,hz*1.52,g*.25,.03);soplo(c,t,g*.5,.012,'highpass',3000)},
 banda(c,t,v){const k=k01(v),g=A.vol*(.12+.7*k);tono(c,t,A.banda[1]-(A.banda[1]-A.banda[0])*k,g*.9,.11,'sine',60);soplo(c,t,g*.5,.06,'lowpass',700)},
 tronera(c,t,v){const k=k01(v),g=A.vol*(.3+.5*k);tono(c,t,170,g,.12,'sine',90);soplo(c,t,g*.6,.08,'lowpass',500);
  for(let i=1;i<4;i++)soplo(c,t+.09*i+.02*Math.random(),g*(.35/i),.05,'bandpass',900+200*i,3)}};
function ev(e){if(!e||!SON[e.k])return;const c=ac();if(!c)return;const now=c.currentTime;
 if(now-t0>.05){t0=now;n=0}if(++n>A.max)return;   // el saque trae muchos choques juntos
 if(ult[e.k]&&now-ult[e.k]<A.gap)return;ult[e.k]=now;try{SON[e.k](c,now,+e.v||0)}catch(x){}}
window.BSON={A,ev,prueba:k=>ev({k:k||'bola',v:3})};
})();
