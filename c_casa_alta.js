// Planta alta de la casa: c_casa3d.js la usa como piso (ALTA.piso(), el mismo formato que SOT.piso de c_sotano.js).
// El estudio/biblioteca con las mesas de tablero (Monopoly, YuCATÁN y el Backgammon de c_juegos3d.js) y, tras los arcos, el corredor:
// balcón, reloj de péndulo, radio (tocarla cambia la música, como el 🎵) y las escaleras (baja a la planta baja, sube a la terraza).
// Se arma la primera vez que subes. Calidad Media: sin animación (péndulo y ventilador quietos) ni luces extra (applyQ apaga las PointLight).
(function(){
if(typeof THREE==='undefined')return;
const XW=15,ZB=-12,ZF=9,CEIL=8.5,AX=7,lo=()=>window.CALIDAD==='medio';
let F=null,bad=false;
const ok=()=>!bad&&!!(window.CASA3D&&CASA3D.mesa&&window.ESC&&window.VENT);
function piso(){if(F)return F;if(!ok()){bad=true;return null}
 const H=window.CASA3D,{std,ctex}=H,S=new THREE.Scene(),hits=[],OB=[],box=(w,h,d,m,x,y,z,p)=>H.box(w,h,d,m,x,y,z,p||S),cyl=(a,b,h,m,x,y,z,p,n)=>H.cyl(a,b,h,m,x,y,z,p||S,n);
 let rs=11;const rnd=()=>(rs=(rs*9301+49297)%233280)/233280,fn=f=>({t:'fn',f}),tap=(o,h)=>o.traverse(m=>{if(m.isMesh){m.userData.hit=h;hits.push(m)}});
 S.background=new THREE.Color(0x1a120c);
 const hl=new THREE.HemisphereLight(0xfff0dc,0x3a2a1e,1.5);S.add(hl);
 const Ld=new THREE.DirectionalLight(0xffe6c4,2);Ld.position.set(-8,22,10);Ld.shadow.mapSize.set(2048,2048);Ld.shadow.bias=-.0005;
 Object.assign(Ld.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:70});S.add(Ld);

 // ---------- escaleras: la que baja (hueco en el corredor, de frente) y la que sube a la terraza (contra la pared del fondo) ----------
 const dn=ESC.down({S,hits,OB,x:9.2,z:5.8,dir:[1,0],to:'pb',n:8});
 const up=ESC.up({S,hits,OB,x:11.2,z:-3.6,dir:[0,-1],to:'ter',key:'alta-ter',sign:['⬆ Terraza · Rummy','#3a2412','#e07a10','#ffe2b0',0xffb35a],n:10,land:2.2,rail:[-1,1]});
 ESC.plano({S,hits,OB,x:8.2,z:3,ry:.5,here:'alta'});ESC.plano({S,hits,OB,x:9,z:-2.6,ry:.25,here:'alta'});

 // ---------- piso de mosaico de pasta (flor de cuatro pétalos), con el hueco de la escalera ----------
 const mos=ctex('mosaico-alta',256,256,(g,w,h)=>{const c=['#b8452f','#ebdfc4','#2f5a4a','#d9a441'];g.fillStyle=c[1];g.fillRect(0,0,w,h);
  for(let i=0;i<2;i++)for(let j=0;j<2;j++){const x=i*128,y=j*128;g.save();g.translate(x+64,y+64);g.fillStyle=c[0];
   for(let k=0;k<4;k++){g.rotate(Math.PI/2);g.beginPath();g.ellipse(0,-30,13,27,0,0,7);g.fill()}g.fillStyle=c[3];g.beginPath();g.arc(0,0,11,0,7);g.fill();
   g.fillStyle=c[2];for(let k=0;k<4;k++){g.rotate(Math.PI/2);g.beginPath();g.moveTo(-64,-64);g.lineTo(-38,-64);g.lineTo(-64,-38);g.fill()}
   g.restore();g.strokeStyle='rgba(0,0,0,.2)';g.lineWidth=2;g.strokeRect(x+1,y+1,126,126)}},1);mos.repeat.set(.5,.5);
 ESC.floor(S,[-XW,XW,ZB,ZF],[dn.hole],std(0xffffff,.55,{map:mos}));
 // tapete del estudio
 const rug=ctex('rug-alta',512,512,(g,w,h)=>{g.fillStyle='#1f3a32';g.fillRect(0,0,w,h);g.strokeStyle='#c9a24a';g.lineWidth=14;g.strokeRect(22,22,w-44,h-44);g.lineWidth=4;g.strokeRect(46,46,w-92,h-92);
  g.fillStyle='rgba(201,162,74,.3)';g.beginPath();g.ellipse(w/2,h/2,120,90,0,0,7);g.fill();g.fillStyle='rgba(160,50,40,.35)';g.beginPath();g.ellipse(w/2,h/2,70,50,0,0,7);g.fill()});
 const rg=new THREE.Mesh(new THREE.PlaneGeometry(17,15),std(0xffffff,.95,{map:rug}));rg.rotation.x=-Math.PI/2;rg.position.set(-4.6,.012,-1.2);rg.receiveShadow=true;S.add(rg);

 // ---------- paredes con lambrín ----------
 const wp=ctex('wall-alta',256,256,(g,w,h)=>{g.fillStyle='#b48a56';g.fillRect(0,0,w,h);for(let i=0;i<46;i++){g.fillStyle=i%2?'rgba(255,240,210,.07)':'rgba(80,40,10,.05)';g.fillRect((i*67)%w,(i*41)%h,30+(i*13)%40,16)}},1);
 const wall=(w,x,z,ry)=>{const m=std(0xffffff,.9,{map:wp.clone()});m.map.needsUpdate=true;m.map.repeat.set(w/4,CEIL/4);
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(w,CEIL),m);pl.position.set(x,CEIL/2,z);pl.rotation.y=ry;pl.receiveShadow=true;S.add(pl);
  const wa=new THREE.Mesh(new THREE.PlaneGeometry(w,2.2),std(0x5a3418,.55));wa.position.set(x,1.1,z);wa.rotation.y=ry;wa.translateZ(.03);S.add(wa);
  const tr=new THREE.Mesh(new THREE.PlaneGeometry(w,.12),std(0x2e1f14,.5));tr.position.set(x,2.26,z);tr.rotation.y=ry;tr.translateZ(.05);S.add(tr)};
 // las cuatro paredes con el kit de muros de la planta baja (c_casa_pb.js): caras de una sola cara (desde afuera no tapan a la cámara),
 // lambrín, moldura, remate arriba y el corte de paredes; por fuera las pinta c_casa_casco.js
 const KM=window.CPB&&CPB.kit?CPB.kit({SC:S,hits,std,box:H.box,cyl:H.cyl,ctex},CEIL):null;
 if(KM){const wt=wp.clone();wt.needsUpdate=true;wt.repeat.set(.25,.25);const M={m:std(0xffffff,.9,{map:wt}),lam:std(0x5a3418,.55),lamH:2.2,rod:std(0x2e1f14,.5)};
  KM.ext('x',ZB,1,-XW,XW,M);KM.ext('z',-XW,1,ZB,ZF,M);KM.ext('z',XW,-1,ZB,ZF,M);KM.ext('x',ZF,-1,-XW,XW,M)}
 else{wall(XW*2,0,ZB,0);wall(ZF-ZB,-XW,(ZF+ZB)/2,Math.PI/2);wall(ZF-ZB,XW,(ZF+ZB)/2,-Math.PI/2);wall(XW*2,0,ZF,Math.PI)}
 // techo: el plano mira hacia abajo (desde arriba no se ve); vigas y ventilador solo con la cámara debajo del techo (step)
 const top=new THREE.Group();top.visible=false;S.add(top);
 const cl=new THREE.Mesh(new THREE.PlaneGeometry(XW*2,ZF-ZB),std(0xe9dcc4,.9));cl.rotation.x=Math.PI/2;cl.position.set(0,CEIL,(ZF+ZB)/2);S.add(cl);
 for(let x=-XW+1.5;x<XW;x+=2.5)box(.35,.45,ZF-ZB,std(0x4a2c18,.6),x,CEIL-.22,(ZF+ZB)/2,top);

 // ---------- los arcos entre el estudio y el corredor ----------
 const cal=std(0xefe6d2,.85),cant=std(0xd8ccb0,.8);
 [-6.5,-1,4.5].forEach(z=>{cyl(.34,.38,4.6,cal,AX,2.3,z,S,20);box(.9,.3,.9,cant,AX,4.75,z);box(.95,.25,.95,cant,AX,.12,z);OB.push({x:AX,z,r:.55})});
 box(.9,4.9,.45,cal,AX,2.45,ZB+.22);
 {const y0=4.9,y1=7.6,s=new THREE.Shape();s.moveTo(ZB,y1);s.lineTo(ZB,y0);
  [[ZB+.45,-6.95],[-6.05,-1.45],[-.55,4.05]].forEach(([a,b])=>{s.lineTo(a,y0);s.absarc((a+b)/2,y0,(b-a)/2,Math.PI,0,true)});s.lineTo(4.95,y0);s.lineTo(4.95,y1);s.closePath();
  const sp=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.5,bevelEnabled:false,curveSegments:18}),cal);sp.rotation.y=-Math.PI/2;sp.position.x=AX+.25;sp.castShadow=sp.receiveShadow=true;S.add(sp);
  box(.7,.18,4.95-ZB+.2,cant,AX,y1+.09,(ZB+4.95)/2)}

 // ---------- balcón y ventana al exterior compartido (c_casa_cielo.js + c_casa_ventanas.js: cielo según el tema, azoteas, sol que entra) ----------
 const fr=std(0xe9e2d0,.5),ir=std(0x1c1c1e,.45,{metalness:.6});
 // balcón en la pared derecha: puertas abiertas al exterior, contraventanas verdes y barandal de forja
 {const z0=.4;VENT.pon(S,'alta',{x:XW,y:2.7,z:z0,ry:-Math.PI/2,w:3.2,h:5.4,hondo:.35,abierta:true,cal:fr});
  const vd=std(0x3a5a4a,.55),vl=std(0x2c4a3c,.6);[-1,1].forEach(s=>{const zz=z0+s*2.65;box(.08,5.2,1.7,vd,XW-.06,2.7,zz);for(let y=.6;y<5;y+=.32)box(.04,.05,1.5,vl,XW-.11,y,zz)});
  box(.08,.08,3.2,ir,XW-.2,1.5,z0);box(.06,.06,3.2,ir,XW-.2,.15,z0);for(let z=z0-1.5;z<=z0+1.51;z+=.25)box(.03,1.35,.03,ir,XW-.2,.82,z);
  for(let z=z0-1.25;z<z0+1.4;z+=.5){const t=new THREE.Mesh(new THREE.TorusGeometry(.12,.015,6,16),ir);t.position.set(XW-.2,1.15,z);t.rotation.y=Math.PI/2;S.add(t)}
  const pot=std(0xb5643c,.7),lf=std(0x2e7d32,.8);[z0-2.4,z0+2.4].forEach(z=>{cyl(.4,.3,.8,pot,XW-.7,.4,z);for(let i=0;i<7;i++){const a=i/7*Math.PI*2,l=new THREE.Mesh(new THREE.ConeGeometry(.16,1.3,6),lf);l.position.set(XW-.7+Math.cos(a)*.2,1.35,z+Math.sin(a)*.2);l.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);S.add(l)}OB.push({x:XW-.7,z,r:.6})})}
 // ventanas: la lista vive en c_casa_casco.js, que las pinta también por fuera (el balcón se arma arriba). Las nuevas no meten rayo de sol.
 const VF=[];(window.CASCO?CASCO.VA:[{lado:'izq',u:-4.6,y:4.6,w:3,h:3.6}]).filter(v=>!v.puerta).forEach(v=>{const d=window.CASCO?CASCO.dentro(v):{x:-XW,z:v.u,ry:Math.PI/2};
  const g=VENT.pon(S,'alta',{x:d.x,y:v.y,z:d.z,ry:d.ry,w:v.w,h:v.h,cal:fr,postigos:!v.alta,reja:!v.alta,sol:!v.nueva,hondo:v.alta?.3:null});
  if(v.lado==='fr')VF.push(g)});

 // ---------- libreros en la pared del fondo (todos los libros en una sola malla) ----------
 const BC=[0x8b1e1e,0x1e4f8b,0x2e6b3a,0xc9a24a,0x5a2a6b,0x2b2b2b,0xa85a1e,0xe0d6c0],BK=[],sw=std(0x4a2c18,.6);
 [-11.8,-5.3,1.2].forEach(cx=>{const w=4.4,z=ZB+.45;box(w,.12,.9,sw,cx,6.2,z);box(.12,6.2,.9,sw,cx-w/2,3.1,z);box(.12,6.2,.9,sw,cx+w/2,3.1,z);
  for(let s=0;s<5;s++){const y=.1+s*1.25;box(w,.08,.9,sw,cx,y,z);if(s==4)break;let x=cx-w/2+.14;
   while(x<cx+w/2-.3){const t=.1+rnd()*.13,hh=.68+rnd()*.38;BK.push([x+t/2,y+.05+hh/2,z+.04,t,hh,BC[(rnd()*BC.length)|0]]);x+=t+.015+(rnd()<.06?.35:0)}}});
 {const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,.62),std(0xffffff,.7),BK.length),m4=new THREE.Matrix4(),c=new THREE.Color();
  BK.forEach(([x,y,z,t,hh,col],i)=>{m4.makeScale(t,hh,1).setPosition(x,y,z);im.setMatrixAt(i,m4);im.setColorAt(i,c.setHex(col))});im.castShadow=im.receiveShadow=true;S.add(im)}
 // planta alta junto al último librero
 const PL=new THREE.Group();S.add(PL);{const lf=std(0x2e7d32,.8);cyl(.55,.42,1.1,std(0xb5643c,.7),5.1,.55,ZB+1.2,PL);for(let i=0;i<10;i++){const a=i/10*Math.PI*2,l=new THREE.Mesh(new THREE.ConeGeometry(.22,2.2,6),lf);l.position.set(5.1+Math.cos(a)*.3,2.1,ZB+1.2+Math.sin(a)*.3);l.rotation.set(Math.sin(a)*.45,0,-Math.cos(a)*.45);l.castShadow=true;PL.add(l)}}

 // ---------- mesas del estudio: Monopoly y YuCATÁN (las arma c_casa3d.js) y el Backgammon (c_juegos3d.js) ----------
 const TB=[{g:'merida',x:-9,z:-5.4,felt:['#e9c97c','#9a6a26']},{g:'haciendas',x:-1.6,z:-5.4,felt:['#79a96a','#2f5a2a']}].filter(t=>typeof GM!='undefined'&&GM[t.g]);
 TB.forEach(t=>{t.r=2.2;H.mesa(t,S,hits,OB)});
 const BGP={x:-5.2,z:3.4};if(window.JG3)JG3.build({THREE,SC:S,hits,OB,std,cyl:H.cyl,box:H.box,only:'bg',at:BGP,fl:'alta'});
 // lámparas colgantes (sin luz propia: ya la trae cada mesa)
 const cord=std(0x161616,.6),brass=std(0xc9a24a,.32,{metalness:.8}),shd=std(0x7a2a1e,.45,{side:THREE.DoubleSide,metalness:.35}),bulb=new THREE.MeshBasicMaterial({color:0xfff0c8,toneMapped:false});
 TB.concat([BGP]).forEach(({x,z})=>{const y=5.6;cyl(.01,.01,CEIL-y,cord,x,(CEIL+y)/2,z,S,6);const sh=new THREE.Mesh(new THREE.CylinderGeometry(.14,.62,.42,32,1,true),shd);sh.position.set(x,y,z);S.add(sh);
  cyl(.15,.15,.06,brass,x,y+.22,z,S,24);const b=new THREE.Mesh(new THREE.SphereGeometry(.1,14,10),bulb);b.position.set(x,y-.14,z);S.add(b)});
 // ventilador de techo sobre el estudio (con el techo: solo en primera persona, desde arriba tapaba las mesas)
 const fan=new THREE.Group();{const y=8;fan.position.set(-5.2,y,-1);top.add(fan);cyl(.035,.035,CEIL-y,cord,-5.2,(CEIL+y)/2,-1,top,8);const wd2=std(0x5a3418,.6);
  cyl(.2,.24,.22,std(0x3a2212,.5),0,0,0,fan,20);for(let i=0;i<5;i++){const arm=new THREE.Group();arm.rotation.y=i/5*Math.PI*2;fan.add(arm);box(.32,.03,.06,brass,.3,-.02,0,arm);const bl=box(1.35,.025,.3,wd2,1.1,-.02,0,arm);bl.rotation.x=.12;bl.castShadow=false}}

 // ---------- rincón de lectura: sillón, lámpara de pie y globo terráqueo ----------
 const SIL=new THREE.Group();{const G=SIL;G.position.set(-12.4,0,5.2);G.rotation.y=Math.PI*.75;S.add(G);const tp=std(0x7a2a2a,.85),wd=std(0x3a2212,.5);
  box(2,.7,1.9,tp,0,.65,0,G);box(2,1.6,.45,tp,0,1.5,-.75,G);[-1,1].forEach(s=>box(.4,1.1,1.9,tp,s*.95,1,0,G));[[-.8,-.8],[.8,-.8],[-.8,.8],[.8,.8]].forEach(([a,b])=>cyl(.06,.05,.3,wd,a,.15,b,G,8));OB.push({x:-12.4,z:5.2,r:1.4})}
 {const x=-14,z=3.2;cyl(.3,.34,.06,brass,x,.03,z,S,20);cyl(.03,.03,4,brass,x,2,z,S,8);const sh=new THREE.Mesh(new THREE.CylinderGeometry(.3,.5,.55,24,1,true),std(0xe9d9b0,.8,{side:THREE.DoubleSide}));sh.position.set(x,4.1,z);S.add(sh);
  const L=new THREE.PointLight(0xffd9a0,5,7,1.6);L.position.set(x,3.8,z);S.add(L);OB.push({x,z,r:.5})}
 {const x=-10,z=7.3,gt=ctex('globo',256,128,(g,w,h)=>{g.fillStyle='#3a78b0';g.fillRect(0,0,w,h);g.fillStyle='#7aa860';[[40,40,26,30],[70,85,14,26],[140,38,32,20],[150,78,18,22],[205,40,26,18],[215,95,16,12]].forEach(([a,b,c,d])=>{g.beginPath();g.ellipse(a,b,c,d,0,0,7);g.fill()})});
  cyl(.3,.36,.08,std(0x3a2212,.5),x,.04,z,S,16);cyl(.04,.04,1.6,brass,x,.85,z,S,8);const gl=new THREE.Mesh(new THREE.SphereGeometry(.6,24,16),std(0xffffff,.5,{map:gt}));gl.position.set(x,2.2,z);gl.rotation.z=.4;S.add(gl);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.66,.025,6,32,Math.PI*1.2),brass);rim.position.set(x,2.2,z);rim.rotation.set(0,Math.PI/2,.4-1.9);S.add(rim);OB.push({x,z,r:.6})}

 // ---------- muebles con modelos (c_casa_glb.js, Poly Haven CC0, a 2.2 veces su tamaño como toda la casa) ----------
 // mientras bajan, o si no se pueden bajar, se ven los de código (MOD: [lugar, piezas de código]); en Ligero no hay casa 3D
 const MOD=[],mod=(n,o,cod,P)=>{if(!window.CGLB)return null;const g=CGLB.pon('alta',n,Object.assign({sombra:true},o));(P||S).add(g);if(cod)MOD.push([g,[].concat(cod)]);return g};
 mod('sillon',{pos:[-12.4,0,5.2],rot:Math.PI*.75,esc:2.3},SIL);
 mod('mesita',{pos:[-14.1,0,7.6],rot:Math.PI*.75,esc:2.2});mod('jarron',{pos:[-14.1,.548*2.2,7.6],rot:.4,esc:2.2});OB.push({x:-14.1,z:7.6,r:.8});
 mod('vitrina',{pos:[-14.35,0,-.2],rot:Math.PI/2,esc:2.2});OB.push({x:-14.1,z:-1.4,r:1.05},{x:-14.1,z:1,r:1.05});
 mod('planta',{pos:[5.1,0,ZB+1.3],rot:.6,esc:3},PL);
 mod('ventilador',{pos:[0,CEIL-8,0],esc:2.2,sombra:false},fan.children.slice(),fan);
 // ---------- reloj de péndulo en el fondo del corredor (marca la hora de verdad) ----------
 const ck={};{const x=13.75,z=ZB+.2,wd=std(0x4a2814,.45);box(1,2.6,.36,wd,x,4,z);box(1.15,.18,.42,wd,x,5.38,z);box(1.15,.14,.42,wd,x,2.66,z);
  const face=ctex('reloj-alta',256,256,(g,w,h)=>{g.fillStyle='#f3ead2';g.beginPath();g.arc(128,128,122,0,7);g.fill();g.strokeStyle='#4a2814';g.lineWidth=8;g.stroke();g.fillStyle='#2a1a10';
   g.font='bold 26px Georgia,serif';g.textAlign='center';g.textBaseline='middle';['XII','I','II','III','IIII','V','VI','VII','VIII','IX','X','XI'].forEach((t,i)=>{const a=i/12*Math.PI*2;g.fillText(t,128+Math.sin(a)*94,128-Math.cos(a)*94)})});
  const fc=new THREE.Mesh(new THREE.CircleGeometry(.4,32),std(0xffffff,.6,{map:face}));fc.position.set(x,4.75,z+.19);S.add(fc);
  const hand=(l,w)=>{const g=new THREE.Group();g.position.set(x,4.75,z+.21);S.add(g);const m=new THREE.Mesh(new THREE.BoxGeometry(w,l,.02),std(0x1a1a1a,.4));m.position.y=l/2-.04;g.add(m);return g};ck.h=hand(.22,.045);ck.m=hand(.33,.03);
  box(.62,1.32,.02,std(0x1a120a,.8),x,3.45,z+.1);const gl=new THREE.Mesh(new THREE.PlaneGeometry(.6,1.3),new THREE.MeshPhysicalMaterial({color:0xdfe6e8,roughness:.05,transparent:true,opacity:.22,depthWrite:false}));gl.position.set(x,3.45,z+.19);S.add(gl);
  const pe=new THREE.Group();pe.position.set(x,4.15,z+.14);S.add(pe);const rod=new THREE.Mesh(new THREE.BoxGeometry(.03,.85,.02),brass);rod.position.y=-.42;pe.add(rod);
  const bob=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.03,20),brass);bob.rotation.x=Math.PI/2;bob.position.y=-.9;pe.add(bob);ck.pe=pe}

 // ---------- la radio en su consola: tocarla cambia la música (igual que el 🎵) y el cuadrante se prende si suena ----------
 const dial=std(0x3a2a10,.4,{emissive:0x000000});{const x=8.7,z=ZB+.55,G=new THREE.Group();G.position.set(x,1.25,z);S.add(G);box(1.7,1.25,.8,std(0x5a3418,.5),x,.62,z);
  const wd=std(0x6a3e1e,.35),cs=box(1,.62,.42,wd,0,.31,0,G),arc=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.42,24,1,false,-Math.PI/2,Math.PI),wd);arc.rotation.x=-Math.PI/2;arc.position.y=.62;arc.castShadow=true;G.add(arc);
  const tela=ctex('radio-tela',64,64,(g,w,h)=>{g.fillStyle='#c9a77a';g.fillRect(0,0,w,h);g.strokeStyle='rgba(60,30,10,.35)';for(let i=0;i<w;i+=4){g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(w,i);g.stroke()}});
  const gr=new THREE.Mesh(new THREE.CircleGeometry(.36,24,0,Math.PI),std(0xffffff,.9,{map:tela}));gr.position.set(0,.5,.215);G.add(gr);box(.72,.24,.02,std(0xffffff,.9,{map:tela}),0,.38,.215,G);
  box(.5,.09,.02,dial,0,.14,.22,G);[-.38,.38].forEach(a=>{const k=cyl(.055,.055,.05,std(0x2a1a10,.4),a,.14,.23,G,14);k.rotation.x=Math.PI/2});
  tap(G,fn(()=>{if(typeof musCyc=='function')musCyc()}));OB.push({x,z:z+.2,r:1})}

 // ---------- el piso para c_casa3d.js ----------
 let q=null;const qual=()=>{const l=lo();if(l===q)return;q=l;hl.intensity=l?2.1:1.5;Ld.castShadow=!l};
 const step=now=>{qual();const cm=CASA3D.cam();top.visible=!!cm&&cm.position.y<CEIL-.25;
  // con la cámara del lado de la calle el muro de enfrente no se ve (una cara): sus ventanas tampoco
  MOD.forEach(([g,c])=>{const v=!g.children.length;c.forEach(o=>{if(o.visible!==v)o.visible=v})});
  if(cm){const iz=cm.position.z<ZF-.05;VF.forEach(g=>{if(g.visible!==iz)g.visible=iz});if(KM)CPB.corte(KM,cm.position,CASA3D.yo&&CASA3D.yo())}
 const d=new Date(),m=d.getMinutes()+d.getSeconds()/60;ck.m.rotation.z=-m/60*Math.PI*2;ck.h.rotation.z=-((d.getHours()%12)+m/60)/12*Math.PI*2;
  if(!lo()){ck.pe.rotation.z=Math.sin(now/1000*Math.PI)*.16;if(top.visible)fan.rotation.y+=.025}
  const on=typeof musName=='function'&&musName()!='apagada';dial.emissive.setHex(on?0xffb04a:0);dial.emissiveIntensity=on?.9:0};
 F={id:'alta',SC:S,TB,OB,hits,links:[dn.lk,up],bx:[-XW+1,XW-1,ZB+1.2,ZF-1],cb:[-XW,XW,ZB,ZF],k:1,ext:true,
  spawn:from=>from==='ter'?{x:11.2,z:-1.2,yaw:0}:{x:7.6,z:6.6,yaw:-Math.PI/2},enter:fp=>{top.visible=!!fp;q=null;qual()},step};
 return F}
window.ALTA={ok,piso};
})();
