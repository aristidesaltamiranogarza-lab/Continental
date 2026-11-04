// Rummy 3D, vista aérea (RMV): zoom con rueda o pellizco, arrastrar para moverte, y tu atril pegado abajo de la pantalla para jugar desde arriba.
// Lo usa c_rummy3d.js: cen() ajusta la cámara, dock() pone o quita el atril de la cámara, down/move/up/wheel/pan reciben el mouse y los dedos.
(function(){
if(typeof THREE==='undefined')return;
const cl=(x,a,b)=>Math.max(a,Math.min(b,x)),V=new THREE.Vector3(),ZMAX=3.2,DEP=.32;   // DEP: a qué distancia de la cámara va el atril
let z=1,px=0,pz=0,dist=3,lim=1,pin=null;const P=new Map();
const fit=()=>{const m=lim*(1-1/z);px=cl(px,-m,m);pz=cl(pz,-m,m)},sep=()=>{const a=[...P.values()];return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1};
// punto de la pantalla (coordenadas -1..1) a la distancia d, en el espacio de la cámara
function camPt(nx,ny,CA,d){V.set(nx,ny,.5).unproject(CA);CA.worldToLocal(V);return V.multiplyScalar(-d/V.z)}
function shadows(o,on){o.traverse(m=>{if(m.isMesh)m.castShadow=on})}
window.RMV={
 get z(){return z},
 reset(){z=1;px=pz=0;pin=null;P.clear()},
 // cámara cenital con zoom: se acerca hacia el punto al que miras y se recorre con el arrastre
 cen(eye,at,r){lim=r;fit();eye.sub(at).divideScalar(z);at.x+=px;at.z+=pz;eye.add(at);dist=eye.distanceTo(at)},
 zoom(f){z=cl(z*f,1,ZMAX);fit()},
 wheel(e){this.zoom(Math.exp(-e.deltaY*.0015))},
 pan(dx,dy,CA,H){if(z<=1.01)return;const k=2*Math.tan(CA.fov*Math.PI/360)*dist/Math.max(1,H);px-=dx*k;pz-=dy*k;fit()},
 // dedos: con dos en la pantalla es pellizco (true = ya no es arrastre)
 down(e,cen){P.set(e.pointerId,{x:e.clientX,y:e.clientY});if(cen&&P.size===2){pin={d0:sep(),z0:z};return true}return !!pin},
 move(e){const p=P.get(e.pointerId);if(p){p.x=e.clientX;p.y=e.clientY}if(pin&&P.size>=2){z=cl(pin.z0*sep()/pin.d0,1,ZMAX);fit()}return !!pin},
 up(e){P.delete(e.pointerId);if(!P.size)pin=null},
 // tu atril: en la vista aérea va pegado a la cámara, abajo y de frente (sin sombra); si no, regresa a su lugar. Regresa true si cambió de lugar
 dock(rk,CA,SC,on,ins,H){if(!rk)return false;const att=rk.parent===CA;let ch=false;
  if(on&&!att){rk.userData.home={p:rk.position.clone(),r:rk.rotation.clone()};CA.add(rk);shadows(rk,false);ch=true}
  else if(!on&&att){const h=rk.userData.home;SC.add(rk);rk.position.copy(h.p);rk.rotation.copy(h.r);rk.scale.setScalar(1);shadows(rk,true);ch=true}
  if(on){const len=rk.userData.len+.12,half=camPt(1,0,CA,DEP).x,top=camPt(0,1,CA,DEP).y,bot=camPt(0,-1+2*cl(((ins&&ins.b)||0)+8,0,H*.45)/Math.max(1,H),CA,DEP).y;
   const s=Math.min(1.9*half/len,.27*(top-camPt(0,-1,CA,DEP).y)/.3);rk.scale.setScalar(s);rk.rotation.set(.5,0,0);rk.position.set(0,bot+.1*s,-DEP)}   // inclinado: lo ves desde arriba y se leen las dos filas
  rk.updateMatrixWorld(true);return ch}};
})();
