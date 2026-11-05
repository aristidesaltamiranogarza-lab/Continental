// c_casa_fondo.js — FONDO: en una partida de Continental, Uno, Mérida o YuCATÁN se sigue viendo la casa alrededor (como en la Ruleta y el Rummy).
// El juego dibuja con el WebGL de la casa (FONDO.R()): primero el piso donde está su mesa (CASA3D.fondo), visto desde la cámara del juego
// pasada a la casa, y luego su escena encima, sin su cuarto y encogida s veces para que su mesa quede sobre el pie de la mesa de la casa.
// Las dos pasadas comparten el depth (la proyección de la casa va escalada por s): lo de la casa tapa bien al juego y al revés.
// Tu silla queda del lado de la pared y ves el resto del cuarto; la casa solo se ve, no se camina. MII: tamaño de los Miis de las cartas.
(function(){
if(typeof THREE==='undefined')return;
const HC=new THREE.PerspectiveCamera(),SM=new THREE.Matrix4(),QA=new THREE.Quaternion(),QC=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),P=new THREE.Vector3();
const casa=()=>window.CASA3D&&CASA3D.fondo&&CASA3D.R&&CASA3D.R()?CASA3D:null;
let wood=null,tA=0;
// pinta(R, cam, g, o) cada cuadro, antes de dibujar el juego. o: {r: medio ancho de la mesa del juego (sus unidades), y: altura de su cubierta,
// rt: medio ancho que tendrá en la casa, sillas: deja las sillas y los Miis sentados de la casa (juegos de tablero)}.
// Regresa s (la casa ya quedó dibujada: el juego dibuja encima sin borrar) o 0 (sin casa: el juego borra y pone su cuarto).
function pinta(R,cam,g,o){const H=casa();if(!H||R!==H.R())return 0;R.autoClear=false;
 const A=H.on()&&H.ancla(g);let s=0;if(!A&&H.on()&&performance.now()-tA>3000){tA=performance.now();H.arranca(g)}   // la mesa está en otro piso
 if(A){s=o.r/(o.rt||A.r);cam.updateMatrixWorld();QA.setFromAxisAngle(Y,A.a);
  P.setFromMatrixPosition(cam.matrixWorld);P.y-=o.y||0;P.multiplyScalar(1/s).applyQuaternion(QA);HC.position.set(A.x+P.x,A.y+P.y,A.z+P.z);
  HC.quaternion.copy(QA).multiply(cam.getWorldQuaternion(QC));
  Object.assign(HC,{fov:cam.fov,aspect:cam.aspect,near:cam.near/s,far:cam.far/s});
  HC.projectionMatrix.copy(cam.projectionMatrix).multiply(SM.makeScale(s,s,s));HC.projectionMatrixInverse.copy(HC.projectionMatrix).invert();
  HC.updateMatrixWorld();if(!H.fondo(HC,g,!!o.sillas))s=0}
 R.toneMapping=THREE.NoToneMapping;R.toneMappingExposure=1;return s}
// silla de la casa para un Mii de las cartas, en sus coordenadas (el Mii sentado tiene el origen a la altura de la mesa)
function silla(){wood=wood||new THREE.MeshStandardMaterial({color:0x4a2814,roughness:.45});const G=new THREE.Group(),y=-1.57;G.userData.silla=1;
 const b=(w,h,d,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wood);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;G.add(m)};
 b(1,.12,1,0,y+.9,0);b(1,1.3,.12,0,y+1.6,-.45);[[-.42,-.42],[.42,-.42],[-.42,.42],[.42,.42]].forEach(([x,z])=>b(.1,.9,.1,x,y+.45,z));return G}
// Mii de las cartas: con s (en la casa) tamaño de casa y su silla; el tuyo no se ve (la cámara son tus ojos: grande tapaba la mesa).
// Sin s como siempre. Regresa qué tan lejos de la orilla de la mesa va sentado
function mii(g,s,yo){const k=s?s*FONDO.MII:1;g.scale.setScalar(k);g.visible=!(s&&yo);let c=g.children.find(o=>o.userData.silla);if(s&&!c){c=silla();g.add(c)}if(c)c.visible=!!s;return s?.9*k:1.4}
// el raycast también pega en lo escondido: solo cuenta lo que se ve
function seen(o){for(;o;o=o.parent)if(!o.visible)return false;return true}
// R(g): el renderer de la casa para compartirlo (un solo WebGL); si recargaste a media partida, arma la casa primero. null sin casa
window.FONDO={MII:1,R:g=>{if(window.CASA3D&&CASA3D.arranca)CASA3D.arranca(g);const H=casa();return H?H.R():null},pinta,mii,seen};
})();
