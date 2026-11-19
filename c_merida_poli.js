// Mérida 3D: la patrulla que te lleva a la cárcel (POLI). Llega por la orilla del tablero con sirena y torreta, la ficha se sube,
// la patrulla da la vuelta hasta la cárcel, la ficha sale tras las rejas (portazo metálico) y la patrulla se va.
// POLI.go({THREE,SC,tok,q,cpos,jail:[x,z],cam(x,z),done()}) · POLI.step(now) cada cuadro · POLI.sirena(ms) también la usa el 2D.
(function(){
let S=null,car=null,LR=null,LB=null;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,smt=t=>t*t*(3-2*t);
function ac(){try{if(typeof mute!='undefined'&&mute)return null;AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume();return AC}catch(_){return null}}
// sirena de dos tonos que sube, se queda y se apaga
function sirena(ms){const A=ac();if(!A)return;const t=A.currentTime,d=ms/1000,o=A.createOscillator(),o2=A.createOscillator(),f=A.createBiquadFilter(),g=A.createGain();
 o.type='sawtooth';o2.type='square';f.type='lowpass';f.frequency.value=2200;
 for(let i=0,x=0;x<d;i++,x+=.38){const hz=i%2?640:880;o.frequency.setValueAtTime(hz,t+x);o2.frequency.setValueAtTime(hz*1.006,t+x)}
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+.25);g.gain.setValueAtTime(.07,t+Math.max(.3,d-.5));g.gain.exponentialRampToValueAtTime(.0001,t+d);
 o.connect(f);o2.connect(f);f.connect(g).connect(A.destination);o.start(t);o2.start(t);o.stop(t+d+.05);o2.stop(t+d+.05)}
// rejas que se cierran: golpe metálico con resonancia
function reja(){const A=ac();if(!A)return;const t=A.currentTime;
 [[220,.9],[331,.6],[587,.35],[913,.22],[1417,.12]].forEach(([hz,a])=>{const o=A.createOscillator(),g=A.createGain();o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(a*.25,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+1.2*(1-hz/2500));o.connect(g).connect(A.destination);o.start(t);o.stop(t+1.3)});
 const sr=A.sampleRate,b=A.createBuffer(1,sr*.08|0,sr),c=b.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=(Math.random()*2-1)*Math.pow(1-i/c.length,4);
 const n=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain();n.buffer=b;f.type='highpass';f.frequency.value=1500;g.gain.value=.5;n.connect(f).connect(g).connect(A.destination);n.start(t)}
function mk(T){const g=new T.Group(),M=(c,e)=>new T.MeshStandardMaterial({color:c,roughness:.45,emissive:e||0}),
  b=(w,h,d,m,x,y,z)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o},wh=M(0xf3f3ee),bl=M(0x1d2733);
 b(.52,.09,.27,bl,0,.1,0);b(.3,.05,.275,wh,0,.11,0);b(.29,.1,.24,wh,-.02,.19,0);b(.12,.045,.25,bl,.13,.165,0);b(.06,.04,.25,bl,-.2,.165,0);
 LR=b(.07,.04,.09,M(0xff2a2a,0xff2a2a),-.02,.26,-.05);LB=b(.07,.04,.09,M(0x2a6cff,0x2a6cff),-.02,.26,.05);
 const wg=new T.CylinderGeometry(.055,.055,.04,12),wm=M(0x111111);[[-.16,-.13],[-.16,.13],[.16,-.13],[.16,.13]].forEach(([x,z])=>{const w=new T.Mesh(wg,wm);w.rotation.x=Math.PI/2;w.position.set(x,.055,z);g.add(w)});
 return g}
// recorrido por la orilla: de casilla en casilla, un poco hacia afuera para no chocar con las casas
function ring(cpos,i0,n,dir){const P=[];for(let j=0;j<=n;j++){const i=((i0+j*dir)%40+40)%40,[x,z]=cpos(i),c=i%10==0;P.push(c?[x,z]:Math.abs(x)>Math.abs(z)?[x+Math.sign(x)*.28,z]:[x,z+Math.sign(z)*.28])}
 const L=[0];for(let j=1;j<P.length;j++)L.push(L[j-1]+Math.hypot(P[j][0]-P[j-1][0],P[j][1]-P[j-1][1]));return {P,L,len:L[L.length-1]}}
function at(R,s){s=Math.max(0,Math.min(R.len,s));let j=1;while(j<R.L.length-1&&R.L[j]<s)j++;const a=R.P[j-1],b=R.P[j],u=(s-R.L[j-1])/((R.L[j]-R.L[j-1])||1);
 return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,Math.atan2(b[1]-a[1],b[0]-a[0])]}
function place(p,ang){car.position.set(p[0],.1,p[1]);let d=-ang-car.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));car.rotation.y+=d*.35}
function go(o){if(S)fin();const T=o.THREE,q=o.q,dir=q>10?-1:1,nB=dir>0?(10-q+40)%40:(q-10+40)%40;
 if(!car){car=mk(T);car.scale.setScalar(1.25)}o.SC.add(car);car.visible=true;car.scale.setScalar(1.25);
 const A=ring(o.cpos,q-dir*5,5,dir),B=ring(o.cpos,q,nB,dir),C=ring(o.cpos,10,4,dir),now=performance.now(),dA=1100,dB=Math.max(1300,Math.min(2800,B.len*190));
 S={o,A,B,C,dA,dB,t0:now,ph:0,p0:o.tok.position.clone(),s0:o.tok.scale.x};car.rotation.y=-at(A,0)[2];place(at(A,0),at(A,0)[2]);sirena(dA+450+dB+900)}
function fin(){if(!S)return;const o=S.o;o.tok.visible=true;o.tok.scale.setScalar(S.s0);o.tok.position.set(o.jail[0],.1,o.jail[1]);car.visible=false;if(car.parent)car.parent.remove(car);S=null;o.done&&o.done()}
function step(now){if(!S)return false;const o=S.o,e=now-S.t0;
 const fl=Math.floor(now/140)%2;LR.material.emissiveIntensity=fl?2.2:.15;LB.material.emissiveIntensity=fl?.15:2.2;
 if(S.ph==0){const u=Math.min(1,e/S.dA),p=at(S.A,(1-(1-u)*(1-u))*S.A.len);place(p,p[2]);o.cam&&o.cam(p[0],p[1]);if(u>=1){S.ph=1;S.t0=now;if(typeof sfx=='function')sfx('place')}}
 else if(S.ph==1){const u=Math.min(1,e/450),v=smt(u);o.tok.position.set(S.p0.x+(car.position.x-S.p0.x)*v,.1+Math.sin(u*Math.PI)*.45,S.p0.z+(car.position.z-S.p0.z)*v);o.tok.scale.setScalar(Math.max(.001,S.s0*(1-v)));
  if(u>=1){o.tok.visible=false;S.ph=2;S.t0=now}}
 else if(S.ph==2){const u=Math.min(1,e/S.dB),p=at(S.B,ease(u)*S.B.len);place(p,p[2]);car.position.y=.1+Math.abs(Math.sin(u*Math.PI*9))*.015;o.cam&&o.cam(p[0],p[1]);
  if(u>=1){S.ph=3;S.t0=now;o.tok.visible=true;reja();try{if(navigator.vibrate)navigator.vibrate([60,40,60])}catch(_){}}}
 else{const u=Math.min(1,e/900),v=u-1,k=Math.max(.001,1+2.70158*v*v*v+1.70158*v*v);o.tok.position.set(o.jail[0],.1+Math.sin(Math.min(1,u*2)*Math.PI)*.3,o.jail[1]);o.tok.scale.setScalar(Math.max(.001,S.s0*Math.min(1,k)));
  const p=at(S.C,u*u*S.C.len);place(p,p[2]);car.scale.setScalar(1.25*Math.max(.001,1-Math.max(0,u-.55)/.45));if(u>=1)fin()}
 return true}
window.POLI={go,step,sirena,reja,on:()=>!!S,stop:fin};
})();
