// Terraza de la casa: c_casa3d.js la usa como piso (TERR.piso(), el mismo formato que SOT.piso de c_sotano.js).
// La azotea al atardecer: la mesa del Rummy bajo un cordón de foquitos, el Conecta 4 (c_juegos3d.js), el tinaco, macetas con bugambilia,
// dos mecedoras viendo la puesta de sol y el cubo de la escalera (su puerta baja a la planta alta). Se arma la primera vez que subes.
// Calidad Completo: cielo del atardecer y foquitos que titilan. Media: cielo liso, sin animación y sin luces extra (applyQ apaga las PointLight).
(function(){
if(typeof THREE==='undefined')return;
const XW=13,ZB=-11,ZF=8,lo=()=>window.CALIDAD==='medio';
let F=null,bad=false;
const ok=()=>!bad&&!!(window.CASA3D&&CASA3D.mesa&&window.ESC);
function piso(){if(F)return F;if(!ok()){bad=true;return null}
 const H=window.CASA3D,{std,ctex}=H,S=new THREE.Scene(),hits=[],OB=[],box=(w,h,d,m,x,y,z,p)=>H.box(w,h,d,m,x,y,z,p||S),cyl=(a,b,h,m,x,y,z,p,n)=>H.cyl(a,b,h,m,x,y,z,p||S,n);
 let rs=5;const rnd=()=>(rs=(rs*9301+49297)%233280)/233280;
 // ---------- cielo: el atardecer detrás de la casa (Completo) o un color liso (Media) ----------
 const sky=ctex('cielo-terraza',512,512,(g,w,h)=>{const hz=h*.34,gr=g.createLinearGradient(0,0,0,hz);gr.addColorStop(0,'#2b2a5e');gr.addColorStop(.45,'#7a4a86');gr.addColorStop(.78,'#e8775a');gr.addColorStop(1,'#ffcf7a');
  g.fillStyle=gr;g.fillRect(0,0,w,hz);const sg=g.createRadialGradient(190,hz-14,6,190,hz-14,120);sg.addColorStop(0,'rgba(255,240,190,1)');sg.addColorStop(.2,'rgba(255,200,120,.7)');sg.addColorStop(1,'rgba(255,160,90,0)');
  g.fillStyle=sg;g.fillRect(0,0,w,hz);g.fillStyle='#fff3c8';g.beginPath();g.arc(190,hz-12,22,0,7);g.fill();
  g.fillStyle='rgba(255,210,170,.35)';[[60,60,90,10],[300,90,120,12],[380,40,80,8]].forEach(([x,y,a,b])=>{g.beginPath();g.ellipse(x,y,a,b,0,0,7);g.fill()});
  // la ciudad: azoteas, la catedral con sus dos torres y unas palmeras
  g.fillStyle='#3a2440';g.fillRect(0,hz,w,h-hz);g.fillStyle='#2a1a33';for(let x=0;x<w;x+=26){const hh=8+((x*13)%22);g.fillRect(x,hz-hh,24,hh+2)}
  [[318,0],[352,0]].forEach(([x])=>{g.fillRect(x,hz-58,16,60);g.beginPath();g.moveTo(x-2,hz-58);g.lineTo(x+8,hz-74);g.lineTo(x+18,hz-58);g.fill()});g.fillRect(316,hz-34,54,36);
  g.strokeStyle='#2a1a33';g.lineWidth=3;[[90,40],[430,50],[470,34]].forEach(([x,hh])=>{g.beginPath();g.moveTo(x,hz);g.quadraticCurveTo(x+4,hz-hh/2,x+2,hz-hh);g.stroke();
   for(let k=0;k<5;k++){const a=-Math.PI*.9+k*Math.PI*.2;g.beginPath();g.moveTo(x+2,hz-hh);g.quadraticCurveTo(x+2+Math.cos(a)*10,hz-hh-8,x+2+Math.cos(a)*18,hz-hh+Math.abs(Math.sin(a))*-4+8);g.stroke()}})});
 const flat=new THREE.Color(0x8a5a72);
 const hl=new THREE.HemisphereLight(0xffc89a,0x5a3a5a,1.5);S.add(hl);
 const Ld=new THREE.DirectionalLight(0xffa860,2.4);Ld.position.set(-6,9,-24);Ld.shadow.mapSize.set(2048,2048);Ld.shadow.bias=-.0006;
 Object.assign(Ld.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:70});S.add(Ld);

 // ---------- piso de pasta rojo, pretil encalado y la casa (y las vecinas) debajo ----------
 const fl=ctex('piso-terraza',256,256,(g,w,h)=>{for(let i=0;i<4;i++)for(let j=0;j<4;j++){const v=(i*7+j*3)%5;g.fillStyle=['#a5482e','#9a4029','#ad5233','#a04530','#b0573a'][v];g.fillRect(i*64,j*64,64,64);
  g.fillStyle='rgba(255,220,180,.06)';g.fillRect(i*64+6,j*64+6,30,20)}g.strokeStyle='rgba(60,20,10,.45)';g.lineWidth=3;for(let k=0;k<=w;k+=64){g.beginPath();g.moveTo(k,0);g.lineTo(k,h);g.stroke();g.beginPath();g.moveTo(0,k);g.lineTo(w,k);g.stroke()}},1);
 fl.repeat.set(.25,.25);ESC.floor(S,[-XW,XW,ZB,ZF],[],std(0xffffff,.8,{map:fl}));
 const cal=std(0xf1e9da,.9),cap=std(0xa5482e,.75),PT=1.2;
 box(XW*2+.7,PT,.35,cal,0,PT/2,ZB-.17);box(.35,PT,ZF-ZB,cal,-XW-.17,PT/2,(ZB+ZF)/2);box(.35,PT,ZF-ZB,cal,XW+.17,PT/2,(ZB+ZF)/2);box(XW*2+.7,PT*.8,.35,cal,0,PT*.4,ZF+.17);
 box(XW*2+.9,.1,.5,cap,0,PT+.05,ZB-.17);box(.5,.1,ZF-ZB+.3,cap,-XW-.17,PT+.05,(ZB+ZF)/2);box(.5,.1,ZF-ZB+.3,cap,XW+.17,PT+.05,(ZB+ZF)/2);box(XW*2+.9,.1,.5,cap,0,PT*.8+.05,ZF+.17);
 box(XW*2+.7,10,ZF-ZB+.7,std(0xd9b77a,.9),0,-5.02,(ZB+ZF)/2);
 [[-24,-20,8,-1.5,0xe3c7a0],[-6,-24,14,-2.6,0xd99aa0],[14,-21,10,-.8,0xa8c4d6],[27,-6,8,-2,0xe3c7a0],[25,12,9,-1.2,0xc9d6a8],[-26,6,9,-.6,0xe0a878],[-22,20,10,-2.4,0xd6c0e0],[0,22,12,-3,0xe3c7a0]].forEach(([x,z,s,y,c])=>{
  box(s,10,s*.8,std(c,.9),x,y-5,z);box(s+.3,.25,s*.8+.3,std(0xece4d4,.9),x,y,z)});
 const city=new THREE.Mesh(new THREE.PlaneGeometry(200,200),std(0x3a2a3a,1));city.rotation.x=-Math.PI/2;city.position.y=-6;S.add(city);

 // ---------- el cubo de la escalera: su puerta baja a la planta alta ----------
 const CX=9.6,CZ=-8.7;box(4.4,4.6,4.2,cal,CX,2.3,CZ);box(4.7,.2,4.5,cap,CX,4.7,CZ);
 const dn=ESC.exit({S,hits,x:CX,z:CZ+2.12,ry:0,to:'alta',key:'ter-alta',sign:['⬇ Planta alta','#2a1a10','#c9a24a','#f4d58a',0xffc070]});
 OB.push({x:CX,z:CZ,r:2},{x:CX-1.7,z:CZ+1.6,r:.6},{x:CX+1.7,z:CZ+1.6,r:.6});
 ESC.plano({S,hits,OB,x:CX-3.4,z:CZ+2.6,ry:.3,here:'ter'});

 // ---------- la mesa del Rummy (la arma c_casa3d.js) bajo su cordón de foquitos ----------
 const TB=[{g:'rummy',x:-3.6,z:-1.6,felt:['#c9955a','#7a4a22']}].filter(t=>typeof GM!='undefined'&&GM[t.g]);
 TB.forEach(t=>{t.r=2.2;H.mesa(t,S,hits,OB)});
 const RX=-3.6,RZ=-1.6,PH=4.6,pole=std(0x3a2212,.6),PS=[[RX-4.6,RZ-4.4],[RX+4.6,RZ-4.4],[RX+4.6,RZ+4.4],[RX-4.6,RZ+4.4]];
 PS.forEach(([x,z])=>{cyl(.07,.09,PH,pole,x,PH/2,z,S,8);cyl(.28,.32,.3,std(0x6a6a6a,.8),x,.15,z,S,12);OB.push({x,z,r:.4})});
 const BP=[],wire=new THREE.LineBasicMaterial({color:0x1a1a1a}),cords=[[0,1],[1,2],[2,3],[3,0],[0,2],[1,3]];
 cords.forEach(([a,b])=>{const A=PS[a],B=PS[b],L=Math.hypot(B[0]-A[0],B[1]-A[1]),n=Math.round(L/.7),pts=[];
  for(let i=0;i<=n;i++){const t=i/n,x=A[0]+(B[0]-A[0])*t,z=A[1]+(B[1]-A[1])*t,y=PH-.1-Math.sin(t*Math.PI)*(.4+L*.04);pts.push(new THREE.Vector3(x,y,z));if(i&&i<n)BP.push([x,y-.1,z])}
  S.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),wire))});
 const BCOL=[0xffd27a,0xff6a4a,0x7ad48a,0x6aa8ff,0xffe9b0],bulbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.08,10,8),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),BP.length),m4=new THREE.Matrix4(),col=new THREE.Color();
 BP.forEach((p,i)=>{bulbs.setMatrixAt(i,m4.makeTranslation(p[0],p[1],p[2]));bulbs.setColorAt(i,col.setHex(BCOL[i%BCOL.length]))});S.add(bulbs);
 [[RX-1.6,RZ-1],[RX+1.6,RZ+1]].forEach(([x,z])=>{const L=new THREE.PointLight(0xffc88a,7,10,1.6);L.position.set(x,PH-.6,z);S.add(L)});

 // ---------- el Conecta 4 (c_juegos3d.js) ----------
 if(window.JG3)JG3.build({THREE,SC:S,hits,OB,std,cyl:H.cyl,box:H.box,only:'c4',at:{x:5.4,z:-1.2},fl:'ter'});

 // ---------- tinaco negro sobre su base ----------
 {const x=-10.4,z=-8.4,mt=std(0x707478,.5,{metalness:.6}),bk=std(0x151515,.55);box(2.4,.12,2.4,mt,x,1.3,z);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>box(.1,1.3,.1,mt,x+a*1.05,.65,z+b*1.05));
  cyl(.95,1,2.2,bk,x,2.46,z,S,28);cyl(.6,.95,.35,bk,x,3.73,z,S,28);cyl(.32,.32,.12,bk,x,3.96,z,S,20);
  for(let k=0;k<3;k++){const r=new THREE.Mesh(new THREE.TorusGeometry(.98,.03,6,32),bk);r.rotation.x=Math.PI/2;r.position.set(x,1.8+k*.7,z);S.add(r)}OB.push({x,z,r:1.6})}
 // ---------- macetas con bugambilia ----------
 const pot=std(0xb5643c,.7),lf=std(0x2e7d32,.8),fl2=std(0xd6337a,.7);
 [[-11.6,6.4],[11.6,6.4],[-11.6,-3.2],[11.8,-3.4],[-1.2,-9.8]].forEach(([x,z])=>{cyl(.55,.4,1,pot,x,.5,z);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,l=new THREE.Mesh(new THREE.ConeGeometry(.22,1.5,6),lf);l.position.set(x+Math.cos(a)*.28,1.55,z+Math.sin(a)*.28);l.rotation.set(Math.sin(a)*.6,0,-Math.cos(a)*.6);S.add(l)}
  for(let i=0;i<9;i++){const a=rnd()*Math.PI*2,r=.3+rnd()*.45,f=new THREE.Mesh(new THREE.IcosahedronGeometry(.16+rnd()*.08,0),fl2);f.position.set(x+Math.cos(a)*r,1.5+rnd()*.9,z+Math.sin(a)*r);S.add(f)}OB.push({x,z,r:.9})});
 // ---------- dos mecedoras viendo el atardecer ----------
 const wd=std(0x5a3418,.5),pj=std(0xe9d2a0,.9);[[-9.4,4.4],[-6.8,5.2]].forEach(([x,z],k)=>{const G=new THREE.Group();G.position.set(x,0,z);G.rotation.y=Math.PI+(k?-.2:.15);S.add(G);
  box(1.2,.1,1.1,pj,0,.95,0,G);box(1.2,1.5,.1,pj,0,1.75,-.55,G);[-1,1].forEach(s=>{box(.08,.08,1.2,wd,s*.62,1.35,0,G);box(.08,.5,.08,wd,s*.62,1.1,.5,G);box(.08,1.7,.08,wd,s*.62,1.65,-.58,G);
   const rk=new THREE.Mesh(new THREE.TorusGeometry(2.2,.05,6,24,.62),wd);rk.rotation.set(0,Math.PI/2,Math.PI*1.5-.31);rk.position.set(s*.62,2.4,0);G.add(rk);box(.06,.9,.06,wd,s*.62,.55,.35,G);box(.06,.9,.06,wd,s*.62,.55,-.4,G)});OB.push({x,z,r:1})});

 // ---------- el piso para c_casa3d.js ----------
 let q=null,tw=0;const qual=()=>{const l=lo();if(l===q)return;q=l;S.background=l?flat:sky;hl.intensity=l?2:1.5;Ld.castShadow=!l;
  if(l){BP.forEach((p,i)=>bulbs.setColorAt(i,col.setHex(BCOL[i%BCOL.length])));bulbs.instanceColor.needsUpdate=true}};
 const step=now=>{qual();if(lo()||now-tw<260)return;tw=now;const i=(rnd()*BP.length)|0;bulbs.setColorAt(i,col.setHex(BCOL[i%BCOL.length]).multiplyScalar(.35+rnd()*.65));bulbs.instanceColor.needsUpdate=true};
 const to=(x,z)=>Math.atan2(RX-x,RZ-z);
 F={id:'ter',SC:S,TB,OB,hits,links:[dn],bx:[-XW+1,XW-1,ZB+1,ZF-1],cb:[-XW,XW,ZB,ZF],k:1,
  spawn:()=>({x:CX,z:CZ+4.4,yaw:to(CX,CZ+4.4)}),enter:()=>{q=null;qual()},step};
 return F}
window.TERR={ok,piso};
})();
