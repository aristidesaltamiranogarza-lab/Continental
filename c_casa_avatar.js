// Primera persona en la casa (tecla V o el botón del ojo en la barra de cámara): la cámara va en los ojos de tu Mii y tu Mii no se ve.
// Con ratón: el primer clic atrapa el puntero y moverlo = mirar (Esc lo suelta). Con dedo: arrastrar = mirar; caminas igual: tocar el piso o W A S D (hacia donde miras).
// c_casa3d.js llama CAV.apply(cam, pos, V) en vez de su cámara de arriba y CAV.clamp(V) para los límites. V.a = giro, V.t = subir/bajar la vista.
(function(){
if(typeof THREE==='undefined')return;
const EYE=2.72,PMIN=-.7,PMAX=.55;let fp=false;
function apply(cam,pos,V){cam.position.set(pos.x,EYE,pos.z);cam.rotation.order='YXZ';cam.rotation.set(V.t,V.a,0);cam.updateMatrixWorld()}
function clamp(V){V.t=Math.max(PMIN,Math.min(PMAX,V.t));V.ox=V.oz=0}
// mira al centro cuando el ratón está atrapado (pointer lock): el clic actúa ahí
const st=document.createElement('style');st.textContent='#h3x{position:fixed;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px rgba(0,0,0,.45);z-index:5;pointer-events:none;display:none}html.h3lock #h3x{display:block}';document.head.appendChild(st);
const x=document.createElement('div');x.id='h3x';(document.body?document.body.appendChild(x):addEventListener('DOMContentLoaded',()=>document.body.appendChild(x)));
window.CAV={on:()=>fp,set:v=>{fp=!!v},apply,clamp,EYE,fov:por=>por?78:66};
})();
