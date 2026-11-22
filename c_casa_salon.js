// c_casa_salon.js — SALON: prueba del salón de la planta baja hecho en Blender (blender/salon.py) con luz horneada. Solo con ?casa=glb.
// El GLB trae muros, piso con cenefa, techo y vigas, arquería (atrás las mesas, adelante la estancia), tapete por mesa, ventanales con
// persianas (en vez de chimenea), arbotantes y el cubo de la escalera. La luz viene en un mapa (UV1); todo usa MeshBasicMaterial (barato).
// Los muros se cuelgan de las caras de c_casa_pb.js para que el corte tipo Sims siga igual; el piso viejo queda como receptor de sombras.
(function(){
if(typeof THREE==='undefined')return;
const ON=/[?&]casa=glb\b/.test(location.search),V='3',BASE='modelos/salon/';
const A={luz:1,sombra:.3};   // ajustes: intensidad de la luz horneada y opacidad de la sombra de los personajes
const LINK={x:13.4,z:9.4,r:1.1,ax:12.9,az:9.4,to:'alta'};
const COL=[-13.75,-8.25,-2.75,2.75,8.25,13.75],ZA=1.5;

function tex(ctex,k,w,h,f,rx,ry){const t=ctex('sal-'+k,w,h,f,1);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx||1,ry||1);t.needsUpdate=true;return t}
function texturas(ctex){
 const rnd=(s=>()=>(s=(s*9301+49297)%233280)/233280)(7);
 const manchas=(base,a,b)=>(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<80;i++){g.fillStyle=i%2?a:b;g.beginPath();g.ellipse(rnd()*w,rnd()*h,8+rnd()*36,6+rnd()*24,rnd()*3,0,7);g.fill()}};
 // pasta tranquila: misma roseta de la casa, colores suaves y poco contraste
 const pasta=(g,w,h)=>{const s=128,a='#e9dfca',b='#a9bba0',c='#cf9a7c';for(let j=0;j<2;j++)for(let i=0;i<2;i++){const x=i*s,y=j*s;g.save();g.beginPath();g.rect(x,y,s,s);g.clip();
  g.fillStyle=a;g.fillRect(x,y,s,s);[[0,0],[s,0],[0,s],[s,s]].forEach(([u,v])=>{g.fillStyle=b;g.beginPath();g.arc(x+u,y+v,s*.4,0,7);g.fill();g.fillStyle=c;g.beginPath();g.arc(x+u,y+v,s*.17,0,7);g.fill()});
  g.fillStyle=b;g.beginPath();g.moveTo(x+s/2,y+s*.34);g.lineTo(x+s*.66,y+s/2);g.lineTo(x+s/2,y+s*.66);g.lineTo(x+s*.34,y+s/2);g.closePath();g.fill();
  g.strokeStyle='rgba(60,40,20,.14)';g.lineWidth=2;g.strokeRect(x+1,y+1,s-2,s-2);g.restore()}};
 const cenefa=(g,w,h)=>{g.fillStyle='#9a5a3e';g.fillRect(0,0,w,h);g.fillStyle='#e8dcc4';g.beginPath();g.moveTo(w/2,8);g.lineTo(w-8,h/2);g.lineTo(w/2,h-8);g.lineTo(8,h/2);g.closePath();g.fill();
  g.fillStyle='#55735a';g.beginPath();g.moveTo(w/2,h*.3);g.lineTo(w*.7,h/2);g.lineTo(w/2,h*.7);g.lineTo(w*.3,h/2);g.closePath();g.fill();g.strokeStyle='rgba(40,20,10,.25)';g.lineWidth=2;g.strokeRect(1,1,w-2,h-2)};
 const tapete=(g,w,h)=>{const c=w/2,R=w/2;g.fillStyle='#e8dcc4';g.fillRect(0,0,w,h);const ring=(r,col)=>{g.fillStyle=col;g.beginPath();g.arc(c,c,r*R,0,7);g.fill()};
  ring(1,'#c9a24a');ring(.95,'#6e2a22');ring(.86,'#c9a24a');ring(.84,'#7c3328');
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2;g.fillStyle='#d9b878';g.beginPath();g.arc(c+Math.cos(a)*R*.72,c+Math.sin(a)*R*.72,R*.035,0,7);g.fill()}
  ring(.5,'#6e2a22');ring(.47,'#8a3d30');ring(.18,'#c9a24a');ring(.15,'#6e2a22')};
 const persiana=(g,w,h)=>{g.fillStyle='#2f5a42';g.fillRect(0,0,w,h);g.fillStyle='#1d3d2c';g.fillRect(0,h*.62,w,h*.38);g.fillStyle='#4a7a5c';g.fillRect(0,0,w,h*.12)};
 const cantera=(g,w,h)=>{g.fillStyle='#d2b994';g.fillRect(0,0,w,h);for(let i=0;i<500;i++){g.fillStyle=i%3?'rgba(120,90,60,.10)':'rgba(255,245,225,.18)';g.fillRect(rnd()*w,rnd()*h,2,2)}};
 return {
  piso:{map:tex(ctex,'pasta',256,256,pasta,1/1.2,1/1.2)},cenefa:{map:tex(ctex,'cenefa',128,128,cenefa)},
  muro:{map:tex(ctex,'muro',256,256,manchas('#c98a62','rgba(255,235,210,.06)','rgba(90,40,20,.06)'),1/4,1/4)},
  cantera:{map:tex(ctex,'cantera',256,256,cantera,1/2,1/2)},tapete:{map:tex(ctex,'tapete',512,512,tapete)},
  persiana:{map:tex(ctex,'persiana',16,16,persiana,1,10)},
  lambrin:{color:0x2f4f3e},rod:{color:0xe8dcc4},techo:{color:0xe9dcc4},viga:{color:0x4a2c18},escalon:{color:0xa85a3c}}}

function letrero(ctex){const t=ctex('sal-letrero',512,128,(g,w,h)=>{g.fillStyle='#2a1a10';g.fillRect(4,4,w-8,h-8);g.strokeStyle='#c9a24a';g.lineWidth=6;g.strokeRect(12,12,w-24,h-24);
  g.font='bold 50px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f4d58a';g.fillText('Planta alta',w/2,h/2+2)});
 const m=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.55),new THREE.MeshBasicMaterial({map:t}));m.position.set(12.46,5.05,9.4);m.rotation.y=-Math.PI/2;return m}

// cara de c_casa_pb.js por normal, plano y largo
function cara(K,nx,nz,eje,v,L){return K.CORTE.find(w=>Math.abs(w.n.x-nx)<.1&&Math.abs(w.n.z-nz)<.1&&Math.abs(w.p[eje]-v)<.06&&Math.abs(w.L-L)<.1)}

function build(e){const {SC,PB,hits,ctex}=e,K=window.CPB&&CPB.kp&&CPB.kp();if(!K||!window.CGLB)return;
 const lm=new THREE.TextureLoader().load(BASE+'salon_luz.jpg?v='+V);lm.flipY=false;lm.channel=1;lm.colorSpace=THREE.SRGBColorSpace;
 const TX=texturas(ctex),MAT={};
 const material=(n,conLuz)=>{const k=n+(conLuz?'+':'');if(MAT[k])return MAT[k];let m;
  if(n==='vidrio_luz')m=new THREE.MeshBasicMaterial({color:0xffc58a,toneMapped:false});
  else if(n==='arbotante')m=new THREE.MeshBasicMaterial({color:0xffe2b0,toneMapped:false});
  else if(n==='hierro')m=new THREE.MeshBasicMaterial({color:0x161310});
  else{const o=Object.assign({color:0xffffff},TX[n]||{});if(conLuz){o.lightMap=lm;o.lightMapIntensity=Math.PI*4*A.luz}m=new THREE.MeshBasicMaterial(o)}
  if(n==='persiana'||n==='rod'||n==='escalon')m.side=THREE.DoubleSide;
  return MAT[k]=m};
 // colisiones y escalera (síncronas: el GLB llega después)
 const WL=PB.WL||K.WL;COL.forEach(c=>WL.push([c-.42,ZA,c+.42,ZA,.4]));
 WL.push([12.5,5,12.5,8.2,.45],[12.5,10.6,12.5,11,.45],[12.5,5,17,5,.45],[14.2,5,14.2,11,.3]);
 const sg=letrero(ctex);SC.add(sg);sg.userData.hit={t:'link',l:LINK};hits.push(sg);
 CGLB.cargador().then(L=>L.loadAsync(BASE+'salon.glb?v='+V)).then(gl=>{
  const R=gl.scene;SC.add(R);R.updateMatrixWorld(true);SC.updateMatrixWorld(true);
  const ms=[];R.traverse(o=>{if(o.isMesh)ms.push(o)});
  ms.forEach(o=>{const n=(o.material&&o.material.name)||'',luz=!!o.geometry.attributes.uv1;o.material=material(n,luz);o.castShadow=false;o.receiveShadow=false});
  const por=n=>ms.find(o=>o.name===n);
  // muros del salón: cuelgan de su cara (el corte los esconde con ella) y se apaga la cara vieja
  [['N',0,1,'z',-15,34],['S',0,-1,'z',11,34],['E',-1,0,'x',17,26],['O',1,0,'x',-17,26]].forEach(([k,nx,nz,eje,v,L])=>{const w=cara(K,nx,nz,eje,v,L);if(!w)return;
   w.g.children.forEach(c=>c.visible=false);['muro_','lambrin_','rod_'].forEach(p=>{const m=por(p+k);if(m)w.g.attach(m)})});
  // arquería: dos caras para el corte (una por lado) y las columnas se esconden con cualquiera
  const V3=THREE.Vector3,cg=(n,p,d,nn)=>{const g=new THREE.Group();SC.add(g);const m=por(n);if(m)g.attach(m);const w={g,p,d,L:34,n:nn,hs:[],hid:false};K.CORTE.push(w);return K.CORTE.length-1};
  const a=cg('arq_S',new V3(-17,0,ZA+.2),new V3(1,0,0),new V3(0,0,1)),b=cg('arq_N',new V3(17,0,ZA-.2),new V3(-1,0,0),new V3(0,0,-1));
  const gc=new THREE.Group();SC.add(gc);const col=por('arq_col');if(col)gc.attach(col);K.RG.push({g:gc,a,b});
  // vigas: las del salón salen del grupo VIG (se ven solo con la cámara debajo del techo) y entran las nuevas
  K.VIG.children.forEach(c=>{if(c.position.z>-15&&c.position.z<11&&Math.abs(c.position.x)<17.2)c.visible=false});const vg=por('vigas');if(vg)K.VIG.attach(vg);
  if(K.salTecho)K.salTecho.visible=false;
  if(K.salPiso){K.salPiso.material=new THREE.ShadowMaterial({opacity:A.sombra});K.salPiso.position.y=.02;K.salPiso.renderOrder=1}
  const es=por('escalon');if(es){es.userData.hit={t:'link',l:LINK};hits.push(es)}
  ms.forEach(o=>o.updateMatrixWorld(true));SALON.listo=true;
 }).catch(err=>console.warn('SALON',err))}

window.SALON={on:ON,A,build,link:()=>LINK,listo:false};
})();
