// c_casa_gata.js — GATA: Bagera, la gata negra del patio. c_casa_amb.js llama a GATA.build(e) y GATA.step(now,dt) (solo en planta baja).
// Se sienta en la orilla del arriate del flamboyán (CPAT.gato), baja de un brinco a pasear por el patio y se echa a dormir.
// Al tocarla de cerca la cargas (ronronea en tus brazos); tocarla otra vez la baja. Se baja sola si sales del patio o se aburre. De lejos solo ronronea.
(function(){
if(typeof THREE==='undefined')return;
const BOX=[-14.4,14.4,-40,-27.4],OBS=[[-8.6,-36.2,2.3],[2.5,-30.4,.8],[8.7,-30.4,.8],[13.6,-41.2,2],[4.4,-38.6,.6],[11,-38.6,.6],[-7.4,-26.1,.9],[-1.2,-26.1,.9],[-12.4,-27.5,1]];
const R=(a,b)=>a+Math.random()*(b-a),cl=(v,a,b)=>Math.max(a,Math.min(b,v)),ang=a=>Math.atan2(Math.sin(a),Math.cos(a));
let o=null,AC=null,TA=0;

function build(e){if(o)return;const {SC,std,hits}=e,GT=(window.CPAT&&CPAT.gato)||{x:-13.3,y:0,z:-7.2,ry:Math.PI*.35},P=GT.P||SC;
 const G=new THREE.Group();P.add(G);
 const fur=std(0x141418,.55),pink=std(0xd88a92,.8),
  ball=(r,sx,sy,sz,x,y,z,p,m)=>{const b=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),m||fur);b.scale.set(sx,sy,sz);b.position.set(x,y,z);b.castShadow=true;p.add(b);return b};
 const B=new THREE.Group();B.position.set(0,.2,-.12);G.add(B);   // cadera: al sentarse baja y el cuerpo se inclina hacia arriba
 const body=ball(.12,.78,.84,1.75,0,.01,.13,B);ball(.085,.9,1.05,1,0,.04,.27,B);
 const legs=[[-.05,.25],[.05,.25],[-.055,.01],[.055,.01]].map(([x,z])=>{const g=new THREE.Group();g.position.set(x,-.02,z);B.add(g);
  const c=new THREE.Mesh(new THREE.CylinderGeometry(.024,.021,.17,8),fur);c.position.y=-.085;c.castShadow=true;g.add(c);ball(.03,1,.6,1.3,0,-.175,.012,g);return g});
 const H=new THREE.Group();H.position.set(0,.13,.37);B.add(H);
 ball(.105,1.08,.94,1,0,0,0,H);ball(.048,1.1,.78,1,0,-.032,.085,H);ball(.012,1.3,.8,.6,0,-.012,.128,H,pink);
 const ears=[-1,1].map(s=>{const k=new THREE.Mesh(new THREE.ConeGeometry(.04,.1,4),fur);k.position.set(s*.06,.09,-.005);k.rotation.z=-s*.25;H.add(k);return k});
 const em=new THREE.MeshBasicMaterial({color:0xcfe85a,toneMapped:false}),pm=new THREE.MeshBasicMaterial({color:0x050505});
 const eyes=[-1,1].map(s=>{const g=new THREE.Group();g.position.set(s*.042,.016,.088);H.add(g);ball(.02,1,1,.6,0,0,0,g,em);ball(.008,.5,1.6,.6,0,0,.011,g,pm);return g});
 let par=new THREE.Group();par.position.set(0,.03,-.06);B.add(par);const tail=[par];
 for(let i=0;i<8;i++){const s=new THREE.Group();if(i)s.position.y=.07;par.add(s);const c=new THREE.Mesh(new THREE.CylinderGeometry(.018-i*.0013,.021-i*.0013,.075,8),fur);c.position.y=.035;c.castShadow=true;s.add(c);if(i)tail.push(s);par=s}
 const hb=new THREE.Mesh(new THREE.SphereGeometry(.36,10,8),new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false}));hb.position.set(0,.25,.08);hb.userData.hit={t:'fn',f:toca};G.add(hb);if(hits)hits.push(hb);
 const tag=window.PERROS&&PERROS.etiqueta?PERROS.etiqueta('Bagera'):null;if(tag){tag.position.y=.75;G.add(tag)}
 const hs=[];if(window.PERROS&&PERROS.corazon)for(let i=0;i<3;i++){const h=new THREE.Sprite(new THREE.SpriteMaterial({map:PERROS.corazon(),transparent:true,depthWrite:false,opacity:0}));h.visible=false;G.add(h);hs.push(h)}
 const home={x:GT.x,y:GT.y||0,z:GT.z,ry:GT.ry||0},pie={x:home.x+.9*Math.sin(home.ry),z:home.z+.9*Math.cos(home.ry)};
 o={P,G,B,body,legs,H,ears,eyes,tail,tag,hs,home,pie,patio:!!GT.P,st:'home',t:R(8000,16000),ry:home.ry,sit:1,lie:0,ph:0,sp:0,pet:0,blink:0,hop:null,carga:0};
 G.position.set(home.x,home.y,home.z);G.rotation.y=home.ry}

// ---------- a dónde ir ----------
const libre=(x0,z0,x1,z1)=>OBS.every(([x,z,r])=>{if(Math.hypot(x0-x,z0-z)<r+.3)return true;const dx=x1-x0,dz=z1-z0,L=dx*dx+dz*dz||1,u=cl(((x-x0)*dx+(z-z0)*dz)/L,0,1),ex=x0+u*dx-x,ez=z0+u*dz-z;return ex*ex+ez*ez>(r+.2)*(r+.2)});
function meta(){const p=o.G.position;
 if(Math.random()<.3&&libre(p.x,p.z,o.pie.x,o.pie.z)){o.tx=o.pie.x;o.tz=o.pie.z;o.aCasa=1;o.st='walk';return}
 for(let k=0;k<30;k++){const x=R(BOX[0],BOX[1]),z=R(BOX[2],BOX[3]);if(Math.hypot(x-p.x,z-p.z)<1.5||!libre(p.x,p.z,x,z))continue;o.tx=x;o.tz=z;o.aCasa=0;o.st='walk';return}
 o.st='idle';o.t=1500}
function brinca(x0,y0,z0,x1,y1,z1,fin){o.hop={x0,y0,z0,x1,y1,z1,t:0,fin};o.st='hop';o.ry=Math.atan2(x1-x0,z1-z0)}

function step(now,dt){if(!o)return;if(!dt)dt=TA?now-TA:16;TA=now;dt=Math.min(dt,50);o.sp=0;
 if(o.carga)lleva(now,dt);else if(o.patio)piensa(now,dt);pose(now,dt)}
function piensa(now,dt){const p=o.G.position,feliz=now-o.pet<2400;
 if(o.st==='hop'){const h=o.hop;h.t+=dt/520;const u=Math.min(1,h.t);p.set(h.x0+(h.x1-h.x0)*u,h.y0+(h.y1-h.y0)*u+.35*Math.sin(u*Math.PI),h.z0+(h.z1-h.z0)*u);if(u>=1){o.hop=null;h.fin()}return}
 if(feliz)return;
 if(o.st==='walk'){const dx=o.tx-p.x,dz=o.tz-p.z,L=Math.hypot(dx,dz);
  if(L<.05){if(o.aCasa){brinca(p.x,0,p.z,o.home.x,o.home.y,o.home.z,()=>{o.st='home';o.t=R(15000,30000);o.ry=o.home.ry})}
   else if(Math.random()<.3){o.st='sleep';o.t=R(18000,35000)}else{o.st='idle';o.t=R(2500,7000)}return}
  const df=ang(Math.atan2(dx,dz)-o.ry);o.ry+=cl(df,-1,1)*Math.min(1,dt*.006);
  o.sp=(Math.abs(df)<.6?.75:.25)*(L<.3?.6:1);const s=Math.min(L,o.sp*dt/1000);p.x+=dx/L*s;p.z+=dz/L*s;return}
 if((o.t-=dt)>0)return;
 if(o.st==='home'){brinca(p.x,p.y,p.z,o.pie.x,0,o.pie.z,()=>meta());return}
 meta()}

// ---------- cargarla ----------
function yoG(){const C=window.CASA3D;return C&&C.quien&&C.quien(C.myId())}
// en brazos: los dos antebrazos al frente a la altura de la cintura (gesto 'gata' en AV.GE) y ella acostada de lado sobre ellos
const BRZ=['antebrazo_D','mano_D','antebrazo_I','mano_I'],v1=new THREE.Vector3();
function lleva(now,dt){const me=yoG(),C=window.CASA3D;if(!me||!me.g){suelta();return}
 const g=me.g,yaw=me.yaw!=null?me.yaw:g.rotation.y,av=window.AV&&AV.gesto&&g.userData.av,w=new THREE.Vector3();
 if(av)AV.gesto(g,{gata:1});
 const hs=av?BRZ.map(n=>g.getObjectByName(n)).filter(Boolean):[];
 if(hs.length===4){hs.forEach(b=>w.add(b.getWorldPosition(v1)));w.multiplyScalar(.25);w.y-=.07}   // la panza (.11 arriba de sus patas) sobre los antebrazos
 else w.set(g.position.x+Math.sin(yaw)*.3,g.position.y+.25,g.position.z+Math.cos(yaw)*.3);
 o.P.updateWorldMatrix(true,false);const Lc=o.P.worldToLocal(w.clone()),F=o.P.worldToLocal(w.clone().add(v1.set(Math.cos(yaw),0,-Math.sin(yaw))));
 o.G.position.copy(Lc);o.ry=Math.atan2(F.x-Lc.x,F.z-Lc.z);
 const fuera=Lc.x<BOX[0]-.5||Lc.x>BOX[1]+.5||Lc.z<BOX[2]-.5||Lc.z>BOX[3]+.5||(C.piso&&C.piso()!=='pb');
 if(fuera||(o.carga-=dt)<=0)suelta()}
function carga(){const me=yoG();if(!me||!me.g)return;if(window.AV&&AV.GE&&!AV.GE.gata)AV.GE.gata={I:[-.3,-.3,-1,0],D:[-.3,.3,-1,0]};
 o.carga=R(18000,28000);o.st='carga';o.hop=null;o.pet=performance.now();ronroneo()}
function suelta(){const me=yoG(),p=o.G.position;o.carga=0;if(me&&me.g&&window.AV&&AV.gesto)AV.gesto(me.g,null);
 const x=cl(p.x,BOX[0]+.3,BOX[1]-.3),z=cl(p.z,BOX[2]+.3,BOX[3]-.3);brinca(p.x,p.y,p.z,x,0,z,()=>{o.st='idle';o.t=R(1500,4000)})}

// al tocarla: de cerca la cargas (o la bajas); de lejos solo ronronea
function toca(){const now=performance.now();if(now-o.pet<700&&!o.carga)return;
 if(o.carga){suelta();return}
 const C=window.CASA3D,yo=C&&C.yo&&C.yo(),w=o.G.getWorldPosition(new THREE.Vector3());
 if(o.patio&&yo&&Math.hypot(yo.x-w.x,yo.z-w.z)<2.6&&o.st!=='hop'){carga();return}
 o.pet=now;ronroneo();if(o.st==='walk'){o.st='idle';o.t=2600}else if(o.st==='sleep')o.t=Math.min(o.t,3000)}

// ---------- postura de cada cuadro ----------
function pose(now,dt){const {G,B,legs,H,ears,eyes,tail,body}=o,pt=now-o.pet,feliz=o.pet&&pt<2400,lleva=!!o.carga,k=Math.min(1,dt*.005);
 const sitT=lleva||o.st==='walk'||o.st==='hop'?0:o.st==='sleep'?0:1,lieT=o.st==='sleep'&&!lleva?1:0;
 o.sit+=(sitT-o.sit)*k;o.lie+=(lieT-o.lie)*k;const s=o.sit,l=o.lie,th=-.8*s;
 G.rotation.y=o.ry;o.ph+=dt*o.sp*.022;const w=Math.min(1,o.sp/.6),sn=Math.sin(o.ph);
 B.rotation.x=th;B.position.y=.2-.14*s-.1*l+.012*Math.abs(sn)*w;
 legs.forEach((g,i)=>{const fr=i<2,sw=(i===0||i===3?1:-1)*.5*sn*w;
  g.rotation.x=lleva?.25+.08*Math.sin(now/500+i):fr?.8*s-1.57*l+sw:-.77*s-1.57*l+sw});
 body.scale.y=.84*(1+.025*Math.sin(now/(l>.5?1200:650)));
 const mira=o.st==='home'||o.st==='idle'||lleva;
 H.rotation.x=.8*s+.4*l+(mira?.08*Math.sin(now/3100):0)-(lleva?.1:0);H.rotation.y=mira?.55*Math.sin(now/4200)*Math.max(0,Math.sin(now/9000+1)):0;H.rotation.z=0;H.position.y=.13-.05*l;
 // cola: parada en S al caminar, recostada y enroscada sentada o dormida, colgando en brazos
 tail[0].rotation.x=lleva?-2.7:-.45+(-1.4+.45)*Math.max(s,l);tail[0].rotation.z=0;
 tail.forEach((t,i)=>{if(!i)return;const sw=Math.sin(now/600-i*.55);
  t.rotation.x=lleva?.05:(.12-.02*i)*(1-Math.max(s,l))+(i>5?.25:0)*(1-Math.max(s,l));t.rotation.z=Math.max(s,l)*(.22+.12*sw)+(1-Math.max(s,l))*.1*sw});
 if(!o.blink&&Math.random()<dt/4000)o.blink=now;const b=o.blink&&now-o.blink<140;if(o.blink&&!b)o.blink=0;
 eyes.forEach(e=>e.scale.y=l>.5||b?.12:1);const fl=Math.sin(now/1700)>.97;ears.forEach((e,i)=>e.rotation.x=fl&&i?-.35:0);
 const q=feliz?Math.min(1,pt/250,(2400-pt)/400):0;
 if(q){H.rotation.x-=.35*q;H.rotation.z=.18*q*Math.sin(now/260);eyes.forEach(e=>e.scale.y=Math.min(e.scale.y,1-.85*q));ears.forEach(e=>e.rotation.x=.25*q)}
 if(o.tag){const on=feliz||lleva;o.tag.visible=on;if(on)o.tag.material.opacity=lleva?1:Math.min(1,pt/200,(2400-pt)/400)}
 o.hs.forEach((h,i)=>{const u=(pt-i*350)/1300;h.visible=feliz&&u>0&&u<1;if(!h.visible)return;h.position.set(Math.sin(u*6+i*2)*.08+(i-1)*.06,.55+u*.45,.12);h.material.opacity=Math.min(1,u*4,(1-u)*3);h.scale.setScalar(.09+.05*u)})}

function ronroneo(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const a=AC,t=a.currentTime,d=2.2,n=a.sampleRate*d,b=a.createBuffer(1,n,a.sampleRate),q=b.getChannelData(0);let l=0;
 for(let i=0;i<n;i++){l=(l+.02*(Math.random()*2-1))/1.02;q[i]=l*3.5}const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=320;
 const g=a.createGain(),am=a.createGain(),lfo=a.createOscillator();lfo.frequency.value=24;lfo.connect(am.gain);am.gain.value=.5;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.5,t+.25);g.gain.setValueAtTime(.5,t+d-.5);g.gain.linearRampToValueAtTime(0,t+d);
 s.connect(f);f.connect(am);am.connect(g);g.connect(a.destination);s.start(t);lfo.start(t);s.stop(t+d);lfo.stop(t+d)}catch(_){}}
window.GATA={build,step,get o(){return o}};
})();
