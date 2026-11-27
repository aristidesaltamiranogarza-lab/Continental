// c_mesa_ext.js — MEXT: la mesa de MESA vestida para el aire libre (azotea del Rummy): mantel de tela con cenefa que cae en pliegues por la orilla,
// herrería negra (patas curvas, aros) y sillas de herrería con cojín; la luz que queda, ámbar de atardecer. Mismas medidas, asientos y zonas que la
// mesa de casino: solo cambia lo que se ve. MESA.arma(par,{...,ext:true}) la llama al final: MEXT.viste(m,{mad,can,fal,fm}).
(function(){
if(typeof THREE==='undefined')return;
const PISO=-1.55,C={tela:'#9a5640',orilla:'#7c4231',cen:'#efe2c8',coj:0xe6d6b6,fierro:0x1c1a19,luz:0xffc184};
const std=(c,r,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:r},o||{}));
const lienzo=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')]};
const tex=(c,rx)=>{const T=new THREE.CanvasTexture(c);T.colorSpace=THREE.SRGBColorSpace;T.anisotropy=8;if(rx){T.wrapS=THREE.RepeatWrapping;T.repeat.x=rx}return T};
// trama de tela: hilos finos cruzados y grano
function trama(g,w,h){g.globalAlpha=.06;g.fillStyle='#000';for(let y=0;y<h;y+=4)g.fillRect(0,y,w,1);g.fillStyle='#fff';for(let x=0;x<w;x+=4)g.fillRect(x,0,1,h);g.globalAlpha=1;
 const im=g.getImageData(0,0,w,h),d=im.data;for(let i=0;i<d.length;i+=4){const n=(Math.random()-.5)*10;d[i]+=n;d[i+1]+=n;d[i+2]+=n}g.putImageData(im,0,0)}
const rombo=(g,x,y,s)=>{g.beginPath();g.moveTo(x,y-s);g.lineTo(x+s*.7,y);g.lineTo(x,y+s);g.lineTo(x-s*.7,y);g.closePath();g.fill()};
let TM=null,TC=null,SM=null,SG=null;
// cubierta: la orilla del disco (UV .5) es la orilla de la mesa; las zonas de juego llegan a ~.85, la cenefa va afuera de ellas
function mantel(){if(TM)return TM;const S=1024,h=S/2,[c,g]=lienzo(S,S);
 const gr=g.createRadialGradient(h,h,30,h,h,h);gr.addColorStop(0,C.tela);gr.addColorStop(1,C.orilla);g.fillStyle=gr;g.fillRect(0,0,S,S);trama(g,S,S);
 g.strokeStyle=g.fillStyle=C.cen;g.globalAlpha=.85;[[.885,5],[.975,7]].forEach(([k,l])=>{g.lineWidth=l;g.beginPath();g.arc(h,h,h*k,0,7);g.stroke()});
 for(let i=0;i<84;i++){const a=i/84*Math.PI*2;g.save();g.translate(h+Math.cos(a)*h*.93,h+Math.sin(a)*h*.93);g.rotate(a);rombo(g,0,0,9);g.restore()}
 g.globalAlpha=1;return TM=tex(c)}
// caída: tela con la cenefa cerca del dobladillo (v=0 es abajo)
function caida(R){if(!TC){const [c,g]=lienzo(128,64);g.fillStyle=C.orilla;g.fillRect(0,0,128,64);trama(g,128,64);g.fillStyle=C.cen;g.globalAlpha=.85;
  g.fillRect(0,46,128,2);g.fillRect(0,58,128,3);for(let x=16;x<128;x+=32)rombo(g,x,53,4);g.globalAlpha=1;TC=tex(c,1)}
 const T=TC.clone();T.needsUpdate=true;T.repeat.x=Math.round(2*Math.PI*R/1.4);return T}
// silla de herrería en el marco de la persona sentada (mismas medidas que la de MESA: asiento a la cadera, aro para los pies, respaldo en -z)
function silla(){if(!SG){SM=[std(C.fierro,.5,{metalness:.55}),std(C.coj,.9)];const F=SM[0],T=SM[1],P=[],M=(geo,m,x,y,z,f)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);if(f)f(o);P.push(o)};
  M(new THREE.CylinderGeometry(.37,.35,.045,28),F,0,-.735,-.21,o=>o.scale.z=.8);
  M(new THREE.CylinderGeometry(.33,.33,.07,24),T,0,-.68,-.2,o=>o.scale.z=.78);
  M(new THREE.TorusGeometry(.33,.035,8,28),T,0,-.68,-.2,o=>{o.rotation.x=Math.PI/2;o.scale.y=.78});
  const pata=new THREE.CylinderGeometry(.022,.02,.82,8);[[-.29,-.44,1],[.29,-.44,-1],[-.29,.01,1],[.29,.01,-1]].forEach(([x,z,s])=>M(pata,F,x,-1.16,z,o=>o.rotation.z=s*.06));
  M(new THREE.TorusGeometry(.36,.018,6,40),F,0,-.95,-.215,o=>o.rotation.x=Math.PI/2);
  const pos=new THREE.CylinderGeometry(.022,.022,.78,8);[-.3,.3].forEach(x=>M(pos,F,x,-.36,-.47));
  M(new THREE.TorusGeometry(.3,.024,6,24,Math.PI),F,0,.02,-.47,o=>o.scale.y=.42);
  const trav=new THREE.CylinderGeometry(.018,.018,.6,8);[-.42,.02].forEach(y=>M(trav,F,0,y,-.47,o=>o.rotation.z=Math.PI/2));
  const bar=new THREE.CylinderGeometry(.016,.016,.44,8);[-.17,.17].forEach(x=>M(bar,F,x,-.2,-.47));
  M(new THREE.TorusGeometry(.1,.016,6,24),F,0,-.2,-.47);
  P.forEach(o=>{o.castShadow=o.receiveShadow=true});SG=P}
 return SG.map(o=>o.clone())}
function viste(m,p){const g=m.g,r=m.r,R=m.R,F=std(C.fierro,.5,{metalness:.55});
 // fuera lo de casino: madera, canto de cuero, faldón, pedestal
 [p.mad,p.can,p.fal].forEach(o=>o&&(o.visible=false));m.pie.children.forEach(o=>o.visible=false);
 // cubierta: el disco llega hasta la orilla de la mesa con el mantel
 p.fm.map=mantel();p.fm.color.set(0xffffff);p.fm.roughness=.95;p.fm.needsUpdate=true;m.felt.scale.set(R/r,1,R/r);m.fieltro=()=>{};
 // caída en pliegues que se abren hacia el dobladillo, y la orilla redondeada
 const H=.6,cg=new THREE.CylinderGeometry(R+.015,R+.1,H,192,6,true),pa=cg.attributes.position;
 for(let i=0;i<pa.count;i++){const x=pa.getX(i),y=pa.getY(i),z=pa.getZ(i),d=(H/2-y)/H,a=Math.atan2(z,x),k=1+(.075*d*d*Math.sin(a*30)+.02*d*Math.sin(a*11))/R;pa.setXYZ(i,x*k,y-.025*d*d*(1+Math.sin(a*30)),z*k)}
 cg.computeVertexNormals();const cm=new THREE.Mesh(cg,std(0xffffff,.95,{map:caida(R),side:THREE.DoubleSide}));cm.position.y=-H/2;cm.castShadow=cm.receiveShadow=true;g.add(cm);
 const lab=new THREE.Mesh(new THREE.TorusGeometry(R,.035,8,160),std(C.orilla,.95));lab.rotation.x=Math.PI/2;lab.position.y=-.01;g.add(lab);
 // herrería: aro bajo el mantel, crucero, cuatro patas curvas que se abren y rematan en voluta, y aro bajo para amarrarlas
 const r0=R*.5,I=(geo,x,y,z,f)=>{const o=new THREE.Mesh(geo,F);o.position.set(x,y,z);if(f)f(o);o.castShadow=o.receiveShadow=true;m.pie.add(o);return o};
 I(new THREE.TorusGeometry(r0,.07,8,64),0,-.52,0,o=>o.rotation.x=Math.PI/2);
 [0,1].forEach(j=>I(new THREE.BoxGeometry(r0*2,.08,.1),0,-.52,0,o=>o.rotation.y=Math.PI/4+j*Math.PI/2));
 const cur=new THREE.CatmullRomCurve3([[0,-.5],[.02,-.85],[.1,-1.2],[.26,-1.44],[.42,-1.5],[.5,-1.42],[.44,-1.36]].map(([d,y])=>new THREE.Vector3(r0*(1+d),y,0))),pg=new THREE.TubeGeometry(cur,40,.1,8);
 for(let k=0;k<4;k++)I(pg,0,0,0,o=>o.rotation.y=Math.PI/4+k*Math.PI/2);
 I(new THREE.TorusGeometry(r0*1.13,.05,8,64),0,-1.2,0,o=>o.rotation.x=Math.PI/2);
 // sillas de herrería (escala() ya las acomoda)
 m.sillas.forEach(s=>{s.children.slice().forEach(c=>s.remove(c));silla().forEach(c=>s.add(c))});
 m.luz.color.set(C.luz)}
window.MEXT={viste,C};
})();
