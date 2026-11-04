// Ambiente de la planta baja de la casa: lámparas colgantes sobre las mesas, ventiladores de techo, reloj de pie, hamaca yucateca y un gato negro.
// c_casa3d.js llama a CAMB.build (al armar la casa) y CAMB.step (cada cuadro, solo en la planta baja). Se carga ANTES de c_casa3d.js.
// Calidad Media: sin animación (el reloj solo marca la hora) y sin luces extra (applyQ apaga las PointLight que no traen userData.keep).
(function(){
let E=null,fans=[],clk=null,ham=null,cat=null,hT=0,blink=0;
const lo=()=>window.CALIDAD==='medio',CEIL=9;

function build(e){if(E)return;E=e;const {THREE,SC,OB,std,box,cyl,ctex,TB,HX,ZB}=e;
 const brass=std(0xc9a24a,.32,{metalness:.8}),cord=std(0x161616,.6),wd=std(0x3a2212,.5),wd2=std(0x5a3418,.6);

 // ---------- lámparas colgantes sobre cada mesa (pantalla de latón y foco cálido) ----------
 TB.filter(t=>!t.door).forEach(t=>{const y=5.6;cyl(.01,.01,CEIL-y,cord,t.x,(CEIL+y)/2,t.z,SC,6);
  const sh=new THREE.Mesh(new THREE.CylinderGeometry(.14,.62,.42,32,1,true),std(0x2f5a3a,.45,{side:THREE.DoubleSide,metalness:.35}));sh.position.set(t.x,y,t.z);SC.add(sh);
  cyl(.15,.15,.06,brass,t.x,y+.22,t.z,SC,24);const rim=new THREE.Mesh(new THREE.TorusGeometry(.62,.025,8,40),brass);rim.rotation.x=Math.PI/2;rim.position.set(t.x,y-.21,t.z);SC.add(rim);
  const b=new THREE.Mesh(new THREE.SphereGeometry(.1,14,10),new THREE.MeshBasicMaterial({color:0xfff0c8,toneMapped:false}));b.position.set(t.x,y-.14,t.z);SC.add(b);
  const L=new THREE.PointLight(0xffd9a0,7,8,1.6);L.position.set(t.x,y-.3,t.z);SC.add(L)});

 // ---------- ventiladores de techo (entre las mesas) ----------
 [[-4.6,1.8],[4.6,1.8]].forEach(([x,z],k)=>{const y=8.2;cyl(.035,.035,CEIL-y,cord,x,(CEIL+y)/2,z,SC,8);
  const rot=new THREE.Group();rot.position.set(x,y,z);SC.add(rot);cyl(.2,.24,.22,wd,0,0,0,rot,20);cyl(.1,.1,.08,brass,0,-.14,0,rot,16);
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2,arm=new THREE.Group();arm.rotation.y=a;rot.add(arm);box(.32,.03,.06,brass,.3,-.02,0,arm);
   const bl=box(1.35,.025,.3,wd2,1.1,-.02,0,arm);bl.rotation.x=.12;bl.castShadow=false}
  rot.rotation.y=k;fans.push(rot)});

 // ---------- reloj de pie contra la pared del fondo (marca la hora de verdad) ----------
 {const G=new THREE.Group();G.position.set(-4.6,0,ZB+.42);SC.add(G);
  box(.8,2.1,.5,wd,0,1.05,0,G);box(.95,.85,.56,wd,0,2.55,0,G);box(1.04,.12,.62,wd2,0,3.03,0,G);box(.9,.1,.58,wd2,0,.05,0,G);
  box(.5,1.25,.02,std(0x120a06,.3,{metalness:.2}),0,1.15,.26,G);   // ventanita del péndulo
  const ft=ctex('reloj-cara',256,256,(g,w,h)=>{g.fillStyle='#f3ead2';g.beginPath();g.arc(128,128,124,0,7);g.fill();g.strokeStyle='#3a2a18';g.lineWidth=6;g.stroke();
   g.fillStyle='#2a1a10';g.font='bold 30px Georgia,serif';g.textAlign='center';g.textBaseline='middle';
   ['XII','I','II','III','IIII','V','VI','VII','VIII','IX','X','XI'].forEach((n,i)=>{const a=i/12*Math.PI*2;g.fillText(n,128+Math.sin(a)*94,128-Math.cos(a)*94)})});
  const fc=new THREE.Mesh(new THREE.CircleGeometry(.32,40),std(0xffffff,.7,{map:ft}));fc.position.set(0,2.55,.285);G.add(fc);
  const rg=new THREE.Mesh(new THREE.TorusGeometry(.33,.025,8,40),brass);rg.position.set(0,2.55,.29);G.add(rg);
  const hand=(len,wid)=>{const p=new THREE.Group();p.position.set(0,2.55,.3);G.add(p);box(wid,len,.012,std(0x1a1210,.5),0,len/2-.03,0,p).castShadow=false;return p};
  const hh=hand(.18,.035),mm=hand(.27,.022);
  const pe=new THREE.Group();pe.position.set(0,1.75,.2);G.add(pe);box(.018,.9,.012,brass,0,-.45,0,pe);const bob=cyl(.1,.1,.025,brass,0,-.92,0,pe,24);bob.rotation.x=Math.PI/2;
  clk={hh,mm,pe};hands();OB.push({x:-4.6,z:ZB+.42,r:.7})}

 // ---------- hamaca yucateca entre dos horcones, en la esquina del fondo ----------
 {const HM=(window.CPAT&&CPAT.ham)||{},P=HM.P||SC,x0=HM.x0||10.3,x1=HM.x1||14.9,z=HM.z||-12.2,hy=2.15,L=x1-x0,cx=(x0+x1)/2;   // con patio: entre sus dos pilares (c_casa_patio.js)
  [x0,x1].forEach(x=>{if(!HM.P)cyl(.13,.15,2.7,wd2,x,1.35,z,SC,10);cyl(.05,.05,.1,brass,x+(x<cx?.12:-.12),hy,z,P,8).rotation.z=Math.PI/2});
  const tx=ctex('hamaca',256,256,(g,w,h)=>{const C=['#e63946','#f4a261','#e9c46a','#2a9d8f','#3a86c8','#8e5cd9','#f15bb5','#f4f1de'];
   for(let i=0;i<16;i++){g.fillStyle=C[i%C.length];g.fillRect(i*16,0,16,h)}
   g.strokeStyle='rgba(30,15,10,.35)';g.lineWidth=2;for(let k=-h;k<w;k+=10){g.beginPath();g.moveTo(k,0);g.lineTo(k+h,h);g.moveTo(k+h,0);g.lineTo(k,h);g.stroke()}});
  const G=new THREE.Group();G.position.set(cx,hy,z);P.add(G);
  // la cama: u a lo largo (0..1 entre ganchos, el tejido va de .2 a .8), v a lo ancho (-1..1); cuelga como catenaria y se abre en medio
  const NU=26,NV=10,U0=.2,U1=.8,pos=[],uv=[],ix=[],S=1.38,yAt=u=>-S*Math.sin(Math.PI*u);
  for(let i=0;i<=NU;i++){const u=U0+(U1-U0)*i/NU,t=(u-U0)/(U1-U0),wd=.07+.58*Math.pow(Math.sin(Math.PI*t),.6);
   for(let j=0;j<=NV;j++){const v=j/NV*2-1;pos.push(-L/2+L*u,yAt(u)-.2*(1-v*v)*Math.sin(Math.PI*t),wd*v);uv.push(t*2,(v+1)/2)}}
  for(let i=0;i<NU;i++)for(let j=0;j<NV;j++){const a=i*(NV+1)+j,b=a+NV+1;ix.push(a,b,a+1,b,b+1,a+1)}
  const gm=new THREE.BufferGeometry();gm.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));gm.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));gm.setIndex(ix);gm.computeVertexNormals();
  const bed=new THREE.Mesh(gm,std(0xffffff,.92,{map:tx,side:THREE.DoubleSide}));bed.castShadow=true;G.add(bed);
  // los brazos: hilos del gancho a cada orilla de la cama
  const ln=[];[[0,U0],[1,U1]].forEach(([e,u])=>{const hx=-L/2+L*e+(e?-.12:.12);for(let j=0;j<=NV;j++){const v=j/NV*2-1;ln.push(hx,0,0,-L/2+L*u,yAt(u),.07*v)}});
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(ln,3));G.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0xf0e2c0})));
  ham=G;for(let x=x0;x<=x1+.01;x+=L/4)OB.push({x,z,r:.75})}

 // ---------- gato negro sentado junto a la chimenea ----------
 {const GT=(window.CPAT&&CPAT.gato)||{x:-13.3,y:0,z:-7.2,ry:Math.PI*.35},G=new THREE.Group();G.position.set(GT.x,GT.y,GT.z);G.rotation.y=GT.ry;(GT.P||SC).add(G);   // con patio: en el arriate del flamboyán
  const fur=std(0x141418,.55),ball=(r,sx,sy,sz,x,y,z,p,m)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),m||fur);o.scale.set(sx,sy,sz);o.position.set(x,y,z);o.castShadow=true;(p||G).add(o);return o};
  const body=ball(.2,1.05,1.15,1.25,0,.22,-.05);ball(.14,1,1.3,1,0,.33,.1);
  [-.065,.065].forEach(x=>{cyl(.034,.03,.3,fur,x,.15,.15,G,8);ball(.042,1,.6,1.3,x,.02,.18)});
  const head=new THREE.Group();head.position.set(0,.53,.13);G.add(head);ball(.12,1.1,.95,1,0,0,0,head);ball(.055,1.1,.8,1,0,-.035,.095,head);
  const ears=[-1,1].map(s=>{const e=new THREE.Mesh(new THREE.ConeGeometry(.045,.11,4),fur);e.position.set(s*.068,.1,-.005);e.rotation.z=-s*.25;head.add(e);return e});
  const em=new THREE.MeshBasicMaterial({color:0xcfe85a,toneMapped:false}),pm=new THREE.MeshBasicMaterial({color:0x050505});
  const eyes=[-1,1].map(s=>{const g=new THREE.Group();g.position.set(s*.046,.018,.1);head.add(g);ball(.022,1,1,.6,0,0,0,g,em);ball(.009,.5,1.6,.6,0,0,.012,g,pm);return g});
  // cola: cadena de segmentos que sale de atrás, se recuesta en el piso y se enrosca
  let par=new THREE.Group();par.position.set(0,.05,-.26);par.rotation.y=Math.PI;G.add(par);const tail=[];
  for(let i=0;i<8;i++){const s=new THREE.Group();if(i)s.position.z=.085;s.rotation.y=i?.22:-.4;par.add(s);const c=cyl(.028-i*.002,.03-i*.002,.09,fur,0,0,.045,s,8);c.rotation.x=Math.PI/2;tail.push(s);par=s}
  cat={body,head,ears,eyes,tail};OB.push({x:GT.x,z:GT.z,r:.45})}
}
function hands(){if(!clk)return;const d=new Date(),m=d.getMinutes()+d.getSeconds()/60,h=d.getHours()%12+m/60;clk.mm.rotation.z=-m/60*Math.PI*2;clk.hh.rotation.z=-h/12*Math.PI*2}
function step(now,dt){if(!E)return;
 if(now-hT>(lo()?10000:1000)){hT=now;hands()}
 if(lo())return;   // calidad Media: quieto
 fans.forEach((f,i)=>f.rotation.y+=dt*(.006+i*.0008));
 if(clk)clk.pe.rotation.z=.13*Math.sin(now/1000*Math.PI);
 if(ham)ham.rotation.x=.06*Math.sin(now/1500);
 if(cat){const c=cat;c.body.scale.y=1.15*(1+.025*Math.sin(now/650));
  c.head.rotation.y=.55*Math.sin(now/4200)*Math.max(0,Math.sin(now/9000+1));c.head.rotation.x=.08*Math.sin(now/3100);
  c.tail.forEach((s,i)=>{if(i)s.rotation.y=.22+.16*Math.sin(now/600-i*.55)});
  if(!blink&&Math.random()<dt/4000)blink=now;const b=blink&&now-blink<140;if(blink&&!b)blink=0;c.eyes.forEach(e=>e.scale.y=b?.12:1);
  const fl=Math.sin(now/1700)>.97;c.ears.forEach((e,i)=>e.rotation.x=fl&&i?-.35:0)}}
window.CAMB={build,step};
})();
