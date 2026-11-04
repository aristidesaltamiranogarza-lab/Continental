// Primera persona en la casa (tecla V o el botón del ojo en la barra de cámara): la cámara va en los ojos de tu Mii y tu Mii no se ve.
// Arrastrar = mirar alrededor (girar y subir o bajar la vista); caminas igual: tocar el piso o W A S D (hacia donde miras).
// c_casa3d.js llama CAV.apply(cam, pos, V) en vez de su cámara de arriba y CAV.clamp(V) para los límites. V.a = giro, V.t = subir/bajar la vista.
(function(){
if(typeof THREE==='undefined')return;
const EYE=2.72,PMIN=-.7,PMAX=.55;let fp=false;
function apply(cam,pos,V){cam.position.set(pos.x,EYE,pos.z);cam.rotation.order='YXZ';cam.rotation.set(V.t,V.a,0);cam.updateMatrixWorld()}
function clamp(V){V.t=Math.max(PMIN,Math.min(PMAX,V.t));V.ox=V.oz=0}
window.CAV={on:()=>fp,set:v=>{fp=!!v},apply,clamp,EYE,fov:por=>por?78:66};
})();
