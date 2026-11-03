// Ruleta Rusa: sangre y efectos. Lo usa c_ruleta3d.js como window.RRG: init(THREE,SC,W) · flash(punta,dir) fogonazo · kill(o) salpicadura de quien muere
// · screen(f) gotas en tu pantalla · step(dt) · reset() (al acabar la partida). Las manchas, el charco que crece y las gotas que escurren se quedan hasta reset().
(function(){
let T=null,SC=null,W=5,grp=null,tex={},light=null,flashT=0,flashM=null,parts=[],drips=[],pools=[],spots=0,scr=null,scrA=0;
const R=(a,b)=>a+Math.random()*(b-a);
function cnv(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t}
const red=a=>`rgba(${90+Math.random()*50|0},${Math.random()*6|0},${Math.random()*8|0},${a})`;
// manchas: una mancha central, chorros hacia afuera y gotitas
function splatTex(seed){return cnv(256,256,(g,w,h)=>{const c=w/2;
 for(let i=0;i<14;i++){g.fillStyle=red(.85);g.beginPath();g.arc(c+R(-30,30),c+R(-30,30),R(14,38),0,7);g.fill()}
 for(let i=0;i<22+seed*4;i++){const a=R(0,7),l=R(40,120),wd=R(3,9);g.strokeStyle=red(.8);g.lineCap='round';g.lineWidth=wd;g.beginPath();g.moveTo(c,c);g.lineTo(c+Math.cos(a)*l,c+Math.sin(a)*l);g.stroke();
  g.fillStyle=red(.9);g.beginPath();g.arc(c+Math.cos(a)*(l+wd),c+Math.sin(a)*(l+wd),wd*.9,0,7);g.fill()}
 for(let i=0;i<70;i++){const a=R(0,7),d=R(30,125);g.fillStyle=red(R(.6,.95));g.beginPath();g.arc(c+Math.cos(a)*d,c+Math.sin(a)*d,R(1,4.5),0,7);g.fill()}
 const gr=g.createRadialGradient(c,c,4,c,c,60);gr.addColorStop(0,'rgba(30,0,0,.55)');gr.addColorStop(1,'rgba(30,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)})}
// charco: mancha irregular, más oscura al centro y con brillo
function poolTex(){return cnv(256,256,(g,w,h)=>{const c=w/2;for(let i=0;i<26;i++){const a=R(0,7),d=R(0,60);g.fillStyle='rgba(95,0,2,.95)';g.beginPath();g.arc(c+Math.cos(a)*d,c+Math.sin(a)*d,R(28,58),0,7);g.fill()}
 const gr=g.createRadialGradient(c,c,8,c,c,110);gr.addColorStop(0,'rgba(25,0,0,.7)');gr.addColorStop(.7,'rgba(40,0,0,.25)');gr.addColorStop(1,'rgba(40,0,0,0)');g.globalCompositeOperation='source-atop';g.fillStyle=gr;g.fillRect(0,0,w,h)})}
// gota que escurre: gruesa arriba, se adelgaza y termina en gotita
function dripTex(){return cnv(32,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(110,0,2,.95)');gr.addColorStop(1,'rgba(70,0,0,.9)');g.fillStyle=gr;
 g.beginPath();g.moveTo(4,0);g.lineTo(28,0);g.quadraticCurveTo(20,h*.5,18,h-20);g.lineTo(14,h-20);g.quadraticCurveTo(12,h*.5,4,0);g.fill();g.beginPath();g.arc(16,h-14,9,0,7);g.fill()})}
function mat(map,o){return new T.MeshStandardMaterial(Object.assign({map,transparent:true,depthWrite:false,roughness:.22,metalness:.05,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4},o||{}))}
// calcomanía sobre una superficie: p punto, n normal (hacia afuera de la superficie)
function decal(t,p,n,s,rot){const m=new T.Mesh(new T.PlaneGeometry(1,1),mat(t));m.position.copy(p).addScaledVector(n,.006+spots*.00002);m.lookAt(p.clone().add(n));m.rotateZ(rot==null?R(0,7):rot);m.scale.set(s,s,1);m.renderOrder=2+(spots++%50);grp.add(m);return m}
function init(THREE,scene,w){T=THREE;SC=scene;W=w;grp=new T.Group();SC.add(grp);tex.s=[0,1,2].map(splatTex);tex.p=poolTex();tex.d=dripTex();
 light=new T.PointLight(0xffb040,0,9,1.5);SC.add(light);
 flashM=new T.Mesh(new T.ConeGeometry(.09,.38,10,1,true),new T.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));flashM.geometry.rotateX(Math.PI/2);flashM.geometry.translate(0,0,.19);SC.add(flashM)}
// fogonazo en la punta del cañón
function flash(p,dir){if(!T)return;light.position.copy(p);light.intensity=60;flashM.position.copy(p);flashM.lookAt(p.clone().add(dir));flashM.material.opacity=1;flashM.scale.setScalar(R(.9,1.4));flashT=1}
// alguien muere. o: {head, out (hacia afuera de la mesa), wall:{p,n}, tableY, tableR, center, floor (donde queda la cabeza del cadáver)}
function kill(o){if(!T)return;const out=o.out.clone().normalize(),side=new T.Vector3(-out.z,0,out.x);
 // chorro de gotas que salen de la cabeza
 for(let i=0;i<(o.quiet?0:90);i++){const v=out.clone().multiplyScalar(R(2,6.5)).addScaledVector(side,R(-2.2,2.2));v.y=R(-.5,2.6);if(i<28)v.multiplyScalar(-.45).setY(R(-.2,1.2));   // unas caen hacia la mesa
  const m=new T.Mesh(PG||(PG=new T.SphereGeometry(.022,6,4)),PM||(PM=new T.MeshStandardMaterial({color:0x7a0004,roughness:.2})));m.position.copy(o.head);m.scale.setScalar(R(.6,1.8));grp.add(m);parts.push({m,v,o})}
 // en la mesa, enfrente de donde estaba
 const tp=o.center.clone().addScaledVector(out,o.tableR-.45);tp.y=o.tableY;const up=new T.Vector3(0,1,0);
 decal(tex.s[0],tp,up,R(.9,1.3));decal(tex.s[2],tp.clone().addScaledVector(side,R(-.4,.4)).addScaledVector(out,-.3),up,R(.4,.7));
 // en la pared de atrás: la mancha grande y gotas que escurren
 const wp=o.wall.p.clone(),wn=o.wall.n.clone();wp.y=o.head.y+R(-.1,.35);decal(tex.s[1],wp,wn,R(1.8,2.4));decal(tex.s[0],wp.clone().addScaledVector(new T.Vector3(-wn.z,0,wn.x),R(-.6,.6)).setY(wp.y+R(-.3,.4)),wn,R(.6,1));
 const wt=new T.Vector3(-wn.z,0,wn.x);for(let i=0;i<7;i++){const g=new T.PlaneGeometry(1,1);g.translate(0,-.5,0);const m=new T.Mesh(g,mat(tex.d));const p=wp.clone().addScaledVector(wt,R(-.75,.75));p.y-=R(.05,.45);
  m.position.copy(p).addScaledVector(wn,.012);m.lookAt(p.clone().add(wn));const wd=R(.03,.075);m.scale.set(wd,.01,1);m.renderOrder=60;grp.add(m);const len=Math.min(p.y-.05,R(.7,2.2));if(o.quiet)m.scale.y=len;drips.push({m,len,sp:R(.05,.16),t:0})}
 // el charco debajo del cadáver: crece poco a poco
 const pm=decal(tex.p,o.floor.clone().setY(.004),up,1);pm.scale.set(.05,.05,1);pools.push({m:pm,max:R(1.5,2.2),t:o.quiet?40:0});
 decal(tex.s[2],o.floor.clone().addScaledVector(out,-.5).setY(.004),up,R(.6,.9))}
let PG=null,PM=null;
// gotas en tu pantalla (cuando muere alguien a tu lado o tú)
function screen(f){if(!scr){scr=document.createElement('canvas');scr.id='rrblood';scr.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:3;opacity:0';document.body.appendChild(scr)}
 const w=scr.width=innerWidth,h=scr.height=innerHeight,g=scr.getContext('2d');
 for(let i=0;i<30*f;i++){const x=R(0,w),y=R(0,h*.8),r=R(4,26)*Math.min(1.6,f+.4);g.fillStyle=red(R(.55,.9));g.beginPath();g.arc(x,y,r,0,7);g.fill();
  if(Math.random()<.5){g.fillRect(x-r*.25,y,r*.5,R(20,140));g.beginPath();g.arc(x,y+R(20,140),r*.35,0,7);g.fill()}
  for(let k=0;k<6;k++){g.beginPath();g.arc(x+R(-3,3)*r,y+R(-3,3)*r,R(1,4),0,7);g.fill()}}
 scrA=Math.min(1,.55+f*.4);scr.style.opacity=scrA}
function step(dt){if(!T)return;const s=dt/1000;
 if(flashT>0){flashT=Math.max(0,flashT-s*9);light.intensity=60*flashT*flashT;flashM.material.opacity=flashT}
 for(let i=parts.length-1;i>=0;i--){const P=parts[i],p=P.m.position,o=P.o;P.v.y-=9.8*s;p.addScaledVector(P.v,s);
  const onT=p.y<=o.tableY&&p.y>o.tableY-.2&&Math.hypot(p.x-o.center.x,p.z-o.center.z)<o.tableR,hitW=Math.abs(p.x)>=W-.01||Math.abs(p.z)>=W-.01;
  if(onT||p.y<=.01||hitW){if(spots<900&&Math.random()<.7){
    const n=hitW?(Math.abs(p.x)>=W-.01?new T.Vector3(-Math.sign(p.x),0,0):new T.Vector3(0,0,-Math.sign(p.z))):new T.Vector3(0,1,0),q=p.clone();
    if(hitW){q.x=Math.max(-W,Math.min(W,q.x));q.z=Math.max(-W,Math.min(W,q.z))}else q.y=onT?o.tableY:0;decal(tex.s[i%3],q,n,R(.06,.22))}
   grp.remove(P.m);parts.splice(i,1)}}
 drips.forEach(d=>{if(d.m.scale.y<d.len){d.t+=s;d.m.scale.y=Math.min(d.len,d.m.scale.y+d.sp*s*(1.4-Math.min(1,d.t/20)))}});
 pools.forEach(P=>{P.t+=s;const k=.05+(P.max-.05)*(1-Math.exp(-P.t/14));P.m.scale.set(k,k,1)});
 if(scr&&scrA>0){scrA=Math.max(0,scrA-s*.09);scr.style.opacity=scrA}}
function reset(){if(!grp)return;parts=[];drips=[];pools=[];spots=0;grp.traverse(o=>{if(o.isMesh&&o.geometry!==PG){o.geometry.dispose();o.material.dispose()}});SC.remove(grp);grp=new T.Group();SC.add(grp);if(scr){scrA=0;scr.style.opacity=0}}
window.RRG={init,flash,kill,screen,step,reset};
})();
