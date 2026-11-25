// c_casa_vuelo.js — VUELO: cámara libre para revisar la casona y el barrio (con ?vuelo; tecla F la prende y apaga).
// WASD/flechas avanzan donde miras, Espacio sube, Ctrl baja, Shift rápido; arrastrar sobre el lienzo gira. El personaje se queda quieto.
(function(){
if(typeof THREE==='undefined')return;
const Q=/[?&]vuelo\b/.test(location.search);   // antes también ?crudo: en el celular (sin tecla F) la cámara se quedaba fija
let on=Q,ini=false,yaw=0,pit=-.3,t0=0,arr=null;const P=new THREE.Vector3(),K=new Set(),F=new THREE.Vector3(),D=new THREE.Vector3();
const COD={KeyW:1,KeyA:1,KeyS:1,KeyD:1,ArrowUp:1,ArrowDown:1,ArrowLeft:1,ArrowRight:1,Space:1,ControlLeft:1,ControlRight:1,ShiftLeft:1,ShiftRight:1,KeyQ:1,KeyE:1};
const escribe=e=>{const t=e.target;return t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable)};
addEventListener('keydown',e=>{if(escribe(e))return;if(Q&&e.code==='KeyF'&&!e.repeat){on=!on;ini=false;K.clear();return}
 if(!on||!COD[e.code])return;K.add(e.code);e.preventDefault();e.stopImmediatePropagation()},true);
addEventListener('keyup',e=>{if(COD[e.code])K.delete(e.code)},true);   // sin cortar el evento: si se tragaba el keyup, la tecla de caminar quedaba apretada al volar
addEventListener('blur',()=>{K.clear();arr=null});document.addEventListener('visibilitychange',()=>{if(document.hidden){K.clear();arr=null}});
const lienzo=e=>e.target&&e.target.tagName==='CANVAS';
addEventListener('pointerdown',e=>{if(!on||!lienzo(e))return;arr={x:e.clientX,y:e.clientY,id:e.pointerId};e.stopImmediatePropagation()},true);
addEventListener('pointermove',e=>{if(!on||!arr||e.pointerId!==arr.id)return;yaw-=(e.clientX-arr.x)*.005;pit=Math.max(-1.5,Math.min(1.5,pit-(e.clientY-arr.y)*.005));arr.x=e.clientX;arr.y=e.clientY;e.stopImmediatePropagation()},true);
addEventListener('pointerup',e=>{if(arr&&e.pointerId===arr.id){arr=null;if(on)e.stopImmediatePropagation()}},true);
addEventListener('wheel',e=>{if(!on||!lienzo(e))return;const c=window.CASA3D&&CASA3D.cam&&CASA3D.cam();if(c){c.getWorldDirection(D);P.addScaledVector(D,-Math.sign(e.deltaY)*3)}e.stopImmediatePropagation()},{capture:true,passive:true});
// la cámara: la llama applyCam de c_casa3d.js cada cuadro
function apply(CA){const n=performance.now(),dt=Math.min(.1,(n-(t0||n))/1000);t0=n;
 if(!ini){if(CA.position.lengthSq()<.01)return false;ini=true;P.copy(CA.position);const d=new THREE.Vector3();CA.getWorldDirection(d);yaw=Math.atan2(-d.x,-d.z);pit=Math.asin(Math.max(-1,Math.min(1,d.y)));CA.far=Math.max(CA.far,900);CA.updateProjectionMatrix()}
 const v=(K.has('ShiftLeft')||K.has('ShiftRight')?40:12)*dt,a=(K.has('KeyW')||K.has('ArrowUp')?1:0)-(K.has('KeyS')||K.has('ArrowDown')?1:0),l=(K.has('KeyD')||K.has('ArrowRight')?1:0)-(K.has('KeyA')||K.has('ArrowLeft')?1:0),
  u=(K.has('Space')||K.has('KeyE')?1:0)-(K.has('ControlLeft')||K.has('ControlRight')||K.has('KeyQ')?1:0);
 F.set(-Math.sin(yaw)*Math.cos(pit),Math.sin(pit),-Math.cos(yaw)*Math.cos(pit));D.set(Math.cos(yaw),0,-Math.sin(yaw));
 P.addScaledVector(F,a*v).addScaledVector(D,l*v);P.y+=u*v;
 CA.position.copy(P);CA.lookAt(P.x+F.x,P.y+F.y,P.z+F.z);CA.updateMatrixWorld();return true}
// VUELO.pon(x, y, z, giro, inclinación): pone la cámara libre ahí (revisiones desde la consola; coordenadas del juego); VUELO.pon() la apaga
window.VUELO={on:()=>on,apply,pon:(x,y,z,a,p)=>{if(x==null){on=false;ini=false;K.clear();return}on=true;ini=true;P.set(x,y,z);yaw=a||0;pit=p||0;const c=window.CASA3D&&CASA3D.cam&&CASA3D.cam();if(c&&c.far<900){c.far=900;c.updateProjectionMatrix()}}};
})();
