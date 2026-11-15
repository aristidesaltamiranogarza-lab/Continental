// c_casa_perros.js — PERROS: Harry (canela) y Mapacha (negro con blanco), dos chihuahuas chibi en el patio (easter egg).
// Hechos con primitivas mate y ojos sólidos. c_casa_amb.js llama a PERROS.build(e) y PERROS.step(now,dt) y c_casa_balcon.js PERROS.zona("alta"); van al piso donde estás (también en calidad Media).
// Pasean por el patio esquivando el flamboyán, los pilares y el lavadero, se echan a dormir en su cama y, al tocarlos, brincan, ladran y dicen su nombre.
(function(){
if(typeof THREE==='undefined')return;
// cada casa de los perros: el patio (planta baja) y la azotea de atrás de la planta alta (c_casa_balcon.js). Van al piso donde estás.
// BOX: por dónde pasean; OBS: [x,z,r] a esquivar, la cama al final
const SPOT=[[-.2,.02],[.22,-.04]],ZN={pb:{BOX:[-14.4,14.4,-40,-27.4],CAMA:{x:-12.4,z:-27.5},MA:[3,-34],
  OBS:[[-8.6,-36.2,2.3],[2.5,-30.4,.8],[8.7,-30.4,.8],[13.6,-41.2,2],[4.4,-38.6,.6],[11,-38.6,.6],[-7.4,-26.1,.9],[-1.2,-26.1,.9]]},
 alta:{BOX:[-15.4,15.4,-23.8,-13.4],CAMA:{x:-13.6,z:-13.8},MA:[4,-19],OBS:[[-16,-24,.7],[16,-24,.7]]}},
 DEF=[{n:'Harry',c:0xc68a52,cl:0xecd2ae,p:1},{n:'Mapacha',c:0x232328,cl:0xf3efe7,p:1.22,bl:1,w:.8,s:.9}];
let dogs=[],AC=null,Z=null,TA=0;
const R=(a,b)=>a+Math.random()*(b-a),cl=(v,a,b)=>Math.max(a,Math.min(b,v));

function build(e){if(!window.CPAT||!CPAT.ham||ZN.pb.P)return;zona('pb',{P:CPAT.ham.P,std:e.std,OB:e.OB,hits:e.hits})}
// arma la cama de una casa; los perros se hacen la primera vez y luego solo se mudan
function zona(n,{P,std,OB,hits}){const z=ZN[n];if(z.P)return;Object.assign(z,{n,P,hits});z.OBS.push([z.CAMA.x,z.CAMA.z,1]);
 cama(P,std,z.CAMA);OB.push({x:z.CAMA.x,z:z.CAMA.z,r:.7});
 if(!dogs.length){dogs=DEF.map((d,i)=>mk(d,i,std,P,hits));muda(z)}}
function muda(z){if(Z===z)return;dogs.forEach(o=>{if(Z&&Z.hits){const k=Z.hits.indexOf(o.hb);if(k>=0)Z.hits.splice(k,1)}z.P.add(o.G);if(z.hits&&!z.hits.includes(o.hb))z.hits.push(o.hb)});Z=z;
 const h=dogs[0],m=dogs[1];h.st='sleep';h.t=R(15000,30000);h.lie=1;h.cama=1;h.G.position.set(z.CAMA.x+SPOT[0][0],0,z.CAMA.z+SPOT[0][1]);h.ry=.6;
 m.st='idle';m.t=2000;m.lie=0;m.cama=0;m.tx=null;m.G.position.set(z.MA[0],0,z.MA[1]);m.ry=-.8;
 dogs.forEach(o=>pose(o,performance.now(),0))}

function cama(P,std,C){const g=new THREE.Group();g.position.set(C.x,0,C.z);P.add(g);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(.62,.64,.06,28),std(0xf1e8dc,.95));base.position.y=.03;base.receiveShadow=true;g.add(base);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(.6,.11,12,32),std(0xe7b3c1,.95));rim.rotation.x=Math.PI/2;rim.position.y=.1;rim.castShadow=rim.receiveShadow=true;g.add(rim)}

function mk(d,i,std,P,hits){const G=new THREE.Group();P.add(G);
 const fur=std(d.c,.9),lt=std(d.cl,.9),blk=std(0x0e0e10,.55),pink=std(0xe6a2a0,.9),
  ball=(r,sx,sy,sz,x,y,z,p,m)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,18,14),m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);o.castShadow=true;p.add(o);return o};
 const B=new THREE.Group(),W=d.w||1;G.add(B);G.scale.setScalar(d.s||1);   // todo lo que sube y baja: respira, trota, se echa
 const body=ball(.16,.95*W,.9,1.4,0,.27,0,B,fur);
 ball(.105,W,1,.8,0,.3,.15,B,d.bl?lt:fur);if(!d.bl)ball(.1,1,.6,1,0,.2,.04,B,lt);
 const legs=[[-.075,.13],[.075,.13],[-.075,-.13],[.075,-.13]].map(([x,z])=>{const g=new THREE.Group();g.position.set(x*W,.22,z);B.add(g);const m=d.bl?lt:fur;
  const c=new THREE.Mesh(new THREE.CylinderGeometry(.034*W,.03*W,.18,10),d.bl&&z<0?fur:m);c.position.y=-.09;c.castShadow=true;g.add(c);ball(.038,W,.6,1.3,0,-.19,.012,g,m);return g});
 const H=new THREE.Group();H.position.set(0,.46,.2);B.add(H);
 ball(.15,1.08,.98,1,0,0,0,H,fur);ball(.065,1.1,.8,1.05,0,-.045,.12,H,lt);ball(.022,1.2,.9,1,0,-.02,.185,H,blk);
 if(d.bl){ball(.06,.42,1.35,.6,0,.07,.105,H,lt);ball(.017,1.4,.8,.5,0,-.008,.172,H,blk)}   // franja blanca y la mancha del hocico
 const eyes=[-1,1].map(s=>ball(.03,1,1.1,.6,s*.062,.02,.125,H,blk));
 const ears=[-1,1].map(s=>{const g=new THREE.Group();g.position.set(s*.09,.1,-.01);g.rotation.z=-s*.5;H.add(g);ball(.085,.55,1,.2,0,.075,0,g,fur);ball(.062,.4,.8,.12,0,.07,.012,g,pink);return g});
 let par=new THREE.Group();par.position.set(0,.33,-.2);par.rotation.x=-.9;B.add(par);const tail=[];
 for(let k=0;k<5;k++){const s=new THREE.Group();if(k)s.position.y=.05;s.rotation.x=k?.35:0;par.add(s);
  const c=new THREE.Mesh(new THREE.CylinderGeometry(.017-k*.002,.021-k*.002,.056,8),fur);c.position.y=.026;c.castShadow=true;s.add(c);tail.push(s);par=s}
 const o={i,d,G,B,body,legs,H,eyes,ears,tail,st:'idle',t:0,ry:0,lie:0,ph:0,sp:0,joy:0,blink:0,paseos:R(3,6)|0,tag:etiqueta(d.n),hs:[]};
 o.tag.position.y=.92;G.add(o.tag);
 for(let k=0;k<2;k++){const h=new THREE.Sprite(new THREE.SpriteMaterial({map:corazon(),transparent:true,depthWrite:false,opacity:0}));h.visible=false;G.add(h);o.hs.push(h)}
 const hb=new THREE.Mesh(new THREE.SphereGeometry(.38,10,8),new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false}));hb.position.y=.32;hb.userData.hit={t:'fn',f:()=>toca(o)};G.add(hb);o.hb=hb;
 return o}

// ---------- a dónde ir ----------
const libre=(x0,z0,x1,z1,cama)=>Z.OBS.every(([x,z,r],k)=>{if(cama&&k===Z.OBS.length-1||Math.hypot(x0-x,z0-z)<r+.3)return true;const dx=x1-x0,dz=z1-z0,L=dx*dx+dz*dz||1,u=cl(((x-x0)*dx+(z-z0)*dz)/L,0,1),ex=x0+u*dx-x,ez=z0+u*dz-z;return ex*ex+ez*ez>(r+.25)*(r+.25)});
function meta(o){const p=o.G.position;
 if(o.paseos<=0){const x=Z.CAMA.x+SPOT[o.i][0],z=Z.CAMA.z+SPOT[o.i][1];if(libre(p.x,p.z,x,z,1)){o.tx=x;o.tz=z;o.cama=1;o.st='walk';return}o.paseos=1}
 for(let k=0;k<30;k++){const B=Z.BOX,x=R(B[0],B[1]),z=R(B[2],B[3]),ot=dogs[1-o.i];
  if(Math.hypot(x-p.x,z-p.z)<2||(ot&&ot.tx!=null&&Math.hypot(x-ot.tx,z-ot.tz)<1.2)||!libre(p.x,p.z,x,z))continue;o.tx=x;o.tz=z;o.cama=0;o.st='walk';return}
 o.st='idle';o.t=1500}

// la planta baja (c_casa_amb.js) y la alta (c_casa_alta.js) lo llaman; solo cuenta el del piso donde estás
function step(now,dt,n){n=n||'pb';const p=window.CASA3D&&CASA3D.piso&&CASA3D.piso();if(!dogs.length||(p&&p!==n)||!ZN[n].P)return;muda(ZN[n]);
 if(!dt)dt=TA?now-TA:16;TA=now;dt=Math.min(dt,50);dogs.forEach(o=>{piensa(o,now,dt);pose(o,now,dt)})}
function piensa(o,now,dt){const p=o.G.position,feliz=now-o.joy<2200;o.sp=0;if(feliz)return;
 if(o.st==='walk'){const dx=o.tx-p.x,dz=o.tz-p.z,L=Math.hypot(dx,dz);
  if(L<.05){if(o.cama){o.st='sleep';o.t=R(25000,45000);o.ryT=o.i?-2.4:.6}else{o.st='idle';o.t=R(2000,5500);o.huele=Math.random()<.55;o.paseos--}return}
  let df=Math.atan2(dx,dz)-o.ry;df=Math.atan2(Math.sin(df),Math.cos(df));o.ry+=cl(df,-1,1)*Math.min(1,dt*.006);
  o.sp=(Math.abs(df)<.6?1.05:.3)*(L<.4?.6:1);const s=Math.min(L,o.sp*dt/1000);p.x+=dx/L*s;p.z+=dz/L*s;return}
 if(o.st==='sleep'&&o.ryT!=null){let df=o.ryT-o.ry;df=Math.atan2(Math.sin(df),Math.cos(df));o.ry+=df*Math.min(1,dt*.004)}
 if((o.t-=dt)<=0){if(o.st==='sleep')o.paseos=R(4,7)|0;meta(o)}}

// ---------- postura de cada cuadro ----------
function pose(o,now,dt){const {B,H,body,legs,eyes,ears,tail,G}=o,pt=now-o.joy,feliz=o.joy&&pt<2200,dorm=o.st==='sleep'&&!feliz;
 o.lie+=((dorm?1:0)-o.lie)*Math.min(1,dt*.003);const lie=o.lie,camaY=o.st==='sleep'||o.cama&&o.st!=='walk'?.05:0;
 G.position.y+=(camaY-G.position.y)*Math.min(1,dt*.01);G.rotation.y=o.ry;
 o.ph+=dt*o.sp*.016;const w=Math.min(1,o.sp),sn=Math.sin(o.ph);
 let by=-.11*lie+.016*Math.abs(sn)*w;if(feliz&&pt<1000)by+=.11*Math.abs(Math.sin(pt/1000*Math.PI*2));B.position.y=by;
 legs.forEach((l,k)=>{const fr=k<2;l.rotation.x=(fr?-1.3:1.3)*lie+(k===0||k===3?1:-1)*.55*sn*w});
 body.scale.y=.9*(1+(lie>.5?.045:.02)*Math.sin(now/(lie>.5?1150:520)));
 const idle=o.st==='idle'&&!feliz;
 H.rotation.y=idle&&!o.huele?.55*Math.sin(now/1700+o.i*2):feliz?.15*Math.sin(now/180):0;
 H.rotation.x=.3*lie+(idle&&o.huele?.5+.05*Math.sin(now/85):0)+.05*Math.sin(o.ph*2)*w+(feliz?-.2:0);
 H.position.y=.46-.03*lie;
 if(!o.blink&&Math.random()<dt/3500)o.blink=now;const b=o.blink&&now-o.blink<130;if(o.blink&&!b)o.blink=0;
 eyes.forEach(e=>e.scale.y=1.1*(lie>.5||b?.12:1));
 const tw=Math.sin(now/1900+o.i*3)>.985;ears.forEach((e,k)=>e.rotation.x=feliz?-.45:lie>.5?-.5:tw&&k===o.i?-.4:0);
 const amp=feliz?.9:dorm?0:w>0?.45:.3,fq=feliz?55:w>0?95:150;tail[0].rotation.z=amp*Math.sin(now/fq);tail.forEach((s,k)=>{if(k)s.rotation.x=.35-.25*lie});
 o.tag.visible=!!feliz;if(feliz)o.tag.material.opacity=Math.min(1,pt/200,(2200-pt)/400);
 o.hs.forEach((h,k)=>{const u=(pt-k*400)/1300;h.visible=feliz&&u>0&&u<1;if(!h.visible)return;h.position.set((k?.1:-.1)+.05*Math.sin(u*6),.65+u*.4,.15);h.material.opacity=Math.min(1,u*4,(1-u)*3);h.scale.setScalar(.08+.05*u)})}

// al tocarlo: se despierta si dormía, brinca dos veces, mueve la cola rápido, ladra y dice su nombre
function toca(o){const now=performance.now();if(now-o.joy<1200)return;o.joy=now;yip(o.d.p);
 if(o.st==='sleep'){o.st='idle';o.t=2600;o.huele=0;o.paseos=R(3,6)|0}else if(o.st==='walk'){o.st='idle';o.t=1800;o.huele=0}}

function etiqueta(n){const c=document.createElement('canvas');c.width=256;c.height=72;const x=c.getContext('2d');x.font='600 36px system-ui, sans-serif';
 const w=Math.min(244,x.measureText(n).width+44);x.fillStyle='rgba(251,243,230,.94)';x.beginPath();if(x.roundRect)x.roundRect((256-w)/2,8,w,56,28);else x.rect((256-w)/2,8,w,56);x.fill();
 x.fillStyle='#4a3324';x.textAlign='center';x.textBaseline='middle';x.fillText(n,128,37);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(.48,.135,1);s.visible=false;return s}
function corazon(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#e85a6a';x.beginPath();x.moveTo(32,56);
 x.bezierCurveTo(4,36,6,10,22,10);x.bezierCurveTo(28,10,32,15,32,20);x.bezierCurveTo(32,15,36,10,42,10);x.bezierCurveTo(58,10,60,36,32,56);x.fill();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function yip(p){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const a=AC,t0=a.currentTime;
 [0,.17].forEach(dl=>{const t=t0+dl,o=a.createOscillator(),g=a.createGain(),f=a.createBiquadFilter();o.type='sawtooth';f.type='bandpass';f.frequency.value=1500*p;f.Q.value=2.2;
  o.frequency.setValueAtTime(720*p,t);o.frequency.exponentialRampToValueAtTime(1300*p,t+.03);o.frequency.exponentialRampToValueAtTime(620*p,t+.11);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.35,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(f);f.connect(g);g.connect(a.destination);o.start(t);o.stop(t+.13)})}catch(_){}}
window.PERROS={build,zona,step,etiqueta,corazon,get dogs(){return dogs}};
})();
