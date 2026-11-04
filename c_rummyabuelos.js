// Rummy 3D: los abuelitos y abuelitas de la terraza. Miis de la casa (C3D.mkAvatar) con canas, lentes, suéter o rebozo, bigote y alguno con su taza.
// Mientras esperan acomodan su atril, se rascan la cabeza o sorben café; celebran las jugadas grandes, se quejan o se burlan de quien roba,
// tamborilean cuando al de turno se le acaba el tiempo y aplauden al que gana, con confeti. Lo usa c_rummy3d.js como window.RMA. NO cambia reglas.
(function(){
if(typeof THREE==='undefined')return;
const v3=(x,y,z)=>new THREE.Vector3(x,y,z),rnd=(a,b)=>a+Math.random()*(b-a),cl=(x,a,b)=>Math.max(a,Math.min(b,x));
// los 8 abuelos (G.av del servidor dice cuál le toca a cada quien, sin repetir); top: color del suéter
const AB=[
 {A:{skin:'#f3cfb0',hair:'bun',hc:'#e4e1db',eyes:'oval',brow:'arch',nose:'curve',mouth:'smile',blush:1,glasses:1,bot:0x5b4a6e,shoe:0x3a2a20},top:3,rebozo:['#7a2f5a','#f2c14e'],taza:1},
 {A:{skin:'#e2a982',hair:'short',hc:'#cfcfcf',eyes:'dot',brow:'flat',nose:'wide',mouth:'smile',glasses:1,bot:0x4a3a2a,shoe:0x2a1a10},top:6,bigote:1},
 {A:{skin:'#c98f66',hair:'bun',hc:'#bdbab4',eyes:'happy',brow:'arch',nose:'dot',mouth:'grin',blush:1,bot:0x2f3b5a,shoe:0x5a2a2a},top:1,rebozo:['#1f5f7a','#e8e2d0']},
 {A:{skin:'#f0d2b8',hair:'bowl',hc:'#f2f2f2',eyes:'oval',brow:'flat',nose:'curve',mouth:'small',glasses:1,bot:0x6b5a3a,shoe:0x222222},top:8,taza:1,bigote:1},
 {A:{skin:'#a86f4c',hair:'cap',cap:'#e9e1cf',hc:'#d0d0d0',eyes:'dot',brow:'angry',nose:'wide',mouth:'smile',bot:0x3a3a2a,shoe:0x3a2a1a},top:4,bigote:1},
 {A:{skin:'#e8b894',hair:'long',hc:'#cfcac2',eyes:'lash',brow:'arch',nose:'curve',mouth:'smile',blush:1,glasses:1,bot:0x4a2f3a,shoe:0x6a2a3a},top:9,rebozo:['#b0413e','#2e2e2e']},
 {A:{skin:'#8a5a3c',hair:'short',hc:'#e0e0e0',eyes:'oval',brow:'flat',nose:'wide',mouth:'smile',glasses:1,bot:0xb9a078,shoe:0x3a2a1a},top:2,taza:1},
 {A:{skin:'#f6d3b3',hair:'bun',hc:'#ffffff',eyes:'happy',brow:'flat',nose:'dot',mouth:'grin',blush:1,glasses:1,bot:0x3b4a6b,shoe:0x2a2a2e},top:5,taza:1}];
let SC,K,CH,C=null,P=[],key='',POLE=null,CF=null,cfT=0;const TV=v3(0,0,0),O3=new THREE.Object3D();
function init(sc,k,ch){SC=sc;K=k;CH=ch;C=window.C3D&&C3D.mkAvatar&&C3D.ik&&C3D.seg?C3D:null;POLE=[v3(-1.2,-.4,-.7),v3(1.2,-.4,-.7)];return !!C}
const rebTex=c=>CH.ctex('rm-rebozo-'+c.join(''),64,64,(g,w,h)=>{g.fillStyle=c[0];g.fillRect(0,0,w,h);g.fillStyle=c[1];for(let x=0;x<w;x+=8){g.fillRect(x,0,2,h)}g.globalAlpha=.35;for(let y=0;y<h;y+=6)g.fillRect(0,y,w,1);g.globalAlpha=1},true);
// un abuelo sentado; su silla de madera se esconde (se sientan en las de herrería)
function mk(ai){const B=AB[ai%AB.length],base=C.AVP.length;let g;C.AVP.push(...AB.map(x=>x.bigote?Object.assign({must:1},x.A):x.A));try{g=C.mkAvatar(B.top,base+ai%AB.length,{})}finally{C.AVP.length=base}
 g.children.forEach(o=>{if(o.isMesh&&(o.geometry.type=='BoxGeometry'||o.geometry.type=='CylinderGeometry'))o.visible=false});g.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true});
 const u=g.userData,hair=new THREE.MeshStandardMaterial({color:B.A.hc,roughness:.8});let cup=null;
 if(B.rebozo){const m=new THREE.MeshStandardMaterial({map:rebTex(B.rebozo),roughness:.95,side:THREE.DoubleSide}),r=new THREE.Mesh(new THREE.CylinderGeometry(.25,.42,.3,24,1,true),m);r.position.y=-.05;r.scale.set(1,1,.85);u.body.add(r);   // sobre los hombros del avatar nuevo
  const f=new THREE.Mesh(new THREE.PlaneGeometry(.22,.42),m);f.position.set(.12,-.22,.34);f.rotation.set(-.15,0,.12);u.body.add(f)}
 if(B.bigote&&!window.MII){const b=new THREE.Mesh(new THREE.CapsuleGeometry(.035,.16,4,8),hair);b.rotation.z=Math.PI/2;b.position.set(0,-.13,.47);u.head.add(b)}
 if(B.taza){cup=new THREE.Group();const cm=new THREE.MeshStandardMaterial({color:0xa65a35,roughness:.8});const b=new THREE.Mesh(new THREE.CylinderGeometry(.1,.08,.17,16),cm);cup.add(b);
  const hd=new THREE.Mesh(new THREE.TorusGeometry(.05,.015,6,12),cm);hd.position.x=.11;cup.add(hd);const cf=new THREE.Mesh(new THREE.CircleGeometry(.09,14),new THREE.MeshStandardMaterial({color:0x2a160c,roughness:.3}));cf.rotation.x=-Math.PI/2;cf.position.y=.086;cup.add(cf);
  cup.position.set(0,.08,.1);u.arms.find(m=>m.s>0).hand.add(cup)}
 return {g,u,cup,seed:Math.random()*10,act:null,rx:null,nx:performance.now()+rnd(800,4000),hs:[v3(-.34,.22,.75),v3(.34,.22,.75)],hw:v3(0,0,0),tapT:0}}
// los demás jugadores en sus sillas (tú no: estás en primera persona); si los Miis fallan, la mesa sigue sin abuelos
function seats(G,seatK,me,E){const k=seatK.map(kk=>kk+'.'+(G.av?G.av[kk]:kk)).join(',')+':'+me;if(!C||k===key)return;key=k;
 P.forEach(p=>{SC.remove(p.g);p.g.traverse(o=>{if(o.geometry)o.geometry.dispose()})});P=[];
 seatK.forEach((kk,c)=>{if(kk==null||c===0&&me>=0||!C)return;let p;try{p=mk(G.av?G.av[kk]:kk)}catch(e){console.warn('Rummy abuelos:',e);C=null;return}const pos=E.seat(c);p.g.position.set(pos.x,1.6,pos.z);p.g.rotation.y=Math.atan2(-pos.x,-pos.z);SC.add(p.g);p.g.updateMatrixWorld(true);
  p.u.head.getWorldPosition(p.hw);Object.assign(p,{k:kk,c});P.push(p)})}
// qué hace mientras espera
function idle(p,turn,now){const r=Math.random();if(p.k===turn)return {t:r<.6?'rack':'scratch',t0:now,d:rnd(1600,2600)};
 const t=r<.35?'rack':r<.55?'scratch':r<.8&&p.cup?'sip':'look',o=P.filter(q=>q!==p);return {t,t0:now,d:t=='sip'?2400:t=='look'?2200:1800,to:t=='look'&&o.length?o[Math.random()*o.length|0].hw:null}}
// lo que manda el servidor: o.bag y o.table son puntos del mundo, o.cam tu cabeza (para burlarse de ti)
function fx(f,o){const now=performance.now(),src=P.find(p=>p.k===f.k),oth=P.filter(p=>p.k!==f.k),at=src?src.hw:o.cam,R=(p,t,d,to,del)=>{p.rx={t,t0:now+(del||0),d,to}};
 if(f.t=='juega'){if(f.to>=3){if(src)R(src,'cheer',1500);oth.forEach(p=>{if(Math.random()<.65)R(p,Math.random()<.5?'clap':'cheer',1300,null,rnd(0,350))});return 'big'}if(src)R(src,'reach',700,o.table);return}
 if(f.t=='roba'){if(src)R(src,'reach',800,o.bag);oth.forEach(p=>{const r=Math.random();if(r<.4)R(p,'laugh',1400,at,rnd(150,500));else if(r<.55)R(p,'boo',1200,null,rnd(150,500))});return}
 if(f.t=='tiempo'||f.t=='mal'){if(src)R(src,'boo',1500);oth.forEach(p=>{if(Math.random()<.5)R(p,'laugh',1400,at,rnd(100,400))});return}
 if(f.t=='gana'){if(src)R(src,'cheer',6500);oth.forEach(p=>R(p,Math.random()<.72?'clap':'boo',Math.random()<.7?4200:2500,null,rnd(0,400)));fiesta(now)}}
// quien está jugando estira la mano a la mesa cuando mueve fichas
function poke(k,to){const p=P.find(q=>q.k===k),now=performance.now();if(p&&(!p.rx||now-p.rx.t0>p.rx.d))p.rx={t:'reach',t0:now,d:650,to}}
function step(now,dt,o){if(!C)return;const G=o.G,k=1-Math.exp(-dt/110),turn=G.phase=='play'?G.turn:-1,low=G.phase=='play'&&o.left>0&&o.left<15000;
 P.forEach(p=>{const u=p.u,L=TV.set(-.34,.22,.75).clone(),Rh=v3(.34,.22,.75);p.g.visible=!G.out[p.k];if(!p.g.visible)return;
  const tp=P.find(q=>q.k===turn);let hx=.22,bob=0,look=turn===o.me?o.cam:tp&&tp!==p?tp.hw:null,shake=0;
  let a=p.rx&&now-p.rx.t0<p.rx.d?p.rx:null;if(a&&now<a.t0)a=null;if(!a&&p.act&&now-p.act.t0<p.act.d)a=p.act;
  if(!a&&now>p.nx&&G.phase=='play'){p.act=a=idle(p,turn,now);p.nx=now+rnd(3500,9000)}
  const f=a?cl((now-a.t0)/a.d,0,1):0,env=Math.sin(Math.PI*f);
  switch(a&&a.t){
   case 'rack':hx=.5;look=null;L.set(-.2,.28+.04*Math.sin(now/180),.62);Rh.set(.2,.28+.04*Math.sin(now/180+1.6),.62);break;
   case 'scratch':Rh.lerp(v3(.5,1.02+.03*Math.sin(now/70),.1),env);hx=.1;break;
   case 'sip':Rh.lerp(v3(.1,.66,.52),env);hx=-.12*env;if(p.cup)p.cup.rotation.x=-.8*env;break;
   case 'look':look=a.to;break;
   case 'cheer':L.set(-.55,1.5+.06*Math.sin(now/110),.2);Rh.set(.55,1.5+.06*Math.sin(now/110+1),.2);hx=-.15;bob=.04*Math.abs(Math.sin(now/120));break;
   case 'clap':{const w=.07+.12*Math.abs(Math.sin(now/105));L.set(-w,.75,.62);Rh.set(w,.75,.62);hx=0;break}
   case 'boo':L.set(-.56,1,.12);Rh.set(.56,1,.12);hx=.35;look=null;shake=.4*Math.sin(now/110);break;
   case 'laugh':hx=-.3;bob=.035*Math.abs(Math.sin(now/85));L.set(-.18,.15,.42);if(a.to){const sh=u.arms.find(m=>m.s>0).sh;Rh.copy(u.body.worldToLocal(a.to.clone()).sub(sh).normalize().multiplyScalar(.82).add(sh))}look=a.to;break;
   case 'reach':if(a.to){const sh=u.arms.find(m=>m.s>0).sh;Rh.lerp(u.body.worldToLocal(a.to.clone()).sub(sh).clampLength(0,.84).add(sh),env)}hx=.45;look=a.to;break}
  // tamborilean con los dedos cuando al de turno se le acaba el tiempo
  if(!a&&low&&p.k!==turn){const s=Math.abs(Math.sin(now/80+p.seed));Rh.set(.3,.22+.06*s,.74);if(s<.1&&now-p.tapT>140){p.tapT=now;if(o.tap)o.tap()}}
  p.hs[0].lerp(L,k);p.hs[1].lerp(Rh,k);u.body.scale.y=1+.012*Math.sin(now/650+p.seed);u.body.position.y=bob;u.head.rotation.x+=(hx-u.head.rotation.x)*k;
  if(shake)u.head.rotation.y=shake;else if(look){p.g.updateMatrixWorld();const l=p.g.worldToLocal(look.clone());u.head.rotation.y+=(cl(Math.atan2(l.x,l.z),-1,1)-u.head.rotation.y)*.08}else u.head.rotation.y*=.95;
  u.arms.forEach(m=>{m.h.copy(p.hs[m.s>0?1:0]);C.ik(m.sh,m.h,u.l1,u.l2,POLE[m.s>0?1:0],m.el);C.seg(m.up,m.sh,m.el);C.seg(m.fo,m.el,m.h);m.hand.position.copy(m.h)});
  if(p.cup&&!(a&&a.t=='sip'))p.cup.rotation.x*=.9;u.head.getWorldPosition(p.hw)});
 stepConfeti(now,dt)}
// confeti suave que cae sobre la mesa al final
function fiesta(now){if(!CF){const N=220,cs=['#e53935','#fdd835','#43a047','#1e88e5','#d81b60','#ff8f00','#ffffff'],c=new THREE.Color();
  CF=new THREE.InstancedMesh(new THREE.PlaneGeometry(.06,.035),new THREE.MeshBasicMaterial({side:THREE.DoubleSide,transparent:true,depthWrite:false}),N);CF.frustumCulled=false;CF.userData.p=[];
  for(let i=0;i<N;i++){CF.setColorAt(i,c.set(cs[i%7]));CF.userData.p.push({})}CF.instanceColor.needsUpdate=true;SC.add(CF)}
 CF.userData.p.forEach(q=>Object.assign(q,{x:rnd(-2.8,2.8),y:rnd(3.4,6),z:rnd(-2.8,2.8),vy:rnd(.3,.55),r:rnd(0,6),vr:rnd(-4,4),w:rnd(0,6)}));cfT=now;CF.visible=true}
function stepConfeti(now,dt){if(!CF||!CF.visible)return;const s=dt/1000,age=(now-cfT)/1000;
 CF.userData.p.forEach((q,i)=>{const fl=Math.hypot(q.x,q.z)<K.TBR?K.TH+.02:.02;if(q.y>fl){q.y=Math.max(fl,q.y-q.vy*s);q.x+=Math.sin(now/600+q.w)*.12*s;q.r+=q.vr*s}
  O3.position.set(q.x,q.y,q.z);O3.rotation.set(q.y>fl?q.r:-Math.PI/2,q.y>fl?q.r*.7:0,q.w);O3.updateMatrix();CF.setMatrixAt(i,O3.matrix)});
 CF.instanceMatrix.needsUpdate=true;CF.material.opacity=age>10?Math.max(0,1-(age-10)/2):1;if(age>12)CF.visible=false}
function reset(){key='';P.forEach(p=>SC.remove(p.g));P=[];if(CF)CF.visible=false}
window.RMA={init,seats,fx,poke,step,reset,head:c=>{const p=P.find(q=>q.c===c);return p&&p.g.visible?p.hw:null}};
})();
