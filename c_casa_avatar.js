// Primera persona en la casa (tecla V o el botón del ojo en la barra de cámara): la cámara va en los ojos de tu Mii y tu Mii no se ve.
// Con ratón: el primer clic atrapa el puntero y moverlo = mirar (Esc lo suelta). Con dedo: arrastrar = mirar; caminas igual: tocar el piso o W A S D (hacia donde miras).
// c_casa3d.js llama CAV.apply(cam, pos, V) en vez de su cámara de arriba y CAV.clamp(V) para los límites. V.a = giro, V.t = subir/bajar la vista.
(function(){
if(typeof THREE==='undefined')return;
const EYE=2.72,PMIN=-.7,PMAX=.55;let fp=false;
function apply(cam,pos,V){const k=window.MII&&MII.K||1,f=.14*k;cam.position.set(pos.x-Math.sin(V.a)*f,EYE*k,pos.z-Math.cos(V.a)*f);cam.rotation.order='YXZ';cam.rotation.set(V.t,V.a,0);cam.updateMatrixWorld()}
function clamp(V){V.t=Math.max(PMIN,Math.min(PMAX,V.t));V.ox=V.oz=0}
// mira al centro cuando el ratón está atrapado (pointer lock): el clic actúa ahí
const st=document.createElement('style');st.textContent='#h3x{position:fixed;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px rgba(0,0,0,.45);z-index:5;pointer-events:none;display:none}html.h3lock #h3x{display:block}';document.head.appendChild(st);
const x=document.createElement('div');x.id='h3x';(document.body?document.body.appendChild(x):addEventListener('DOMContentLoaded',()=>document.body.appendChild(x)));
// en primera persona tu personaje sigue en la escena (sombra, otras cámaras): solo la cámara propia no lo ve.
// Sus mallas pasan a la capa 1 durante ese dibujo; las cámaras de sombra ven la capa 1 (se revisan cada ~1 s).
// Se ve tu cuerpo (brazos, piernas, bailes): solo la cabeza (con pelo y cara) se encoge a cero mientras se dibuja; las etiquetas no se ven.
let shT=0;function cuerpo(g,sc,on){if(!g)return;if(on){const t=performance.now();if(t-shT>1000){shT=t;sc.traverse(o=>{if(o.isLight&&o.shadow)o.shadow.camera.layers.enable(1)})}}
 const u=g.userData;if(u.cvH===undefined||(u.cvH&&!u.cvH.parent))u.cvH=g.getObjectByName('cabeza')||null;const h=u.cvH;
 if(!h){g.traverse(o=>on?o.layers.set(1):o.layers.set(0));return}
 if(on){u.cvS=h.scale.x;h.scale.setScalar(1e-3)}else h.scale.setScalar(u.cvS||1);g.updateMatrixWorld(true);
 g.traverse(o=>{if(o.isSprite||(o.isCSS2DObject))on?o.layers.set(1):o.layers.set(0)})}
window.CAV={on:()=>fp,set:v=>{fp=!!v},apply,clamp,EYE,cuerpo,fov:por=>por?78:66};
})();
