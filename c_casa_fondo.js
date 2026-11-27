// c_casa_fondo.js — FONDO: en una partida de Continental, Uno, Mérida o YuCATÁN se sigue viendo la casa alrededor (como en la Ruleta y el Rummy).
// El juego dibuja con el WebGL de la casa (FONDO.R()): primero el piso donde está su mesa (CASA3D.fondo), visto desde la cámara del juego
// pasada a la casa, y luego su escena encima, sin su cuarto y encogida s veces para que su mesa quede sobre el pie de la mesa de la casa.
// Las dos pasadas comparten el depth (la proyección de la casa va escalada por s): lo de la casa tapa bien al juego y al revés.
// Tu silla queda del lado de la pared y ves el resto del cuarto; la casa solo se ve, no se camina. MII: tamaño de los Miis de las cartas junto a los de la casa (el de todos es MII.K, c_mii.js).
(function(){
if(typeof THREE==='undefined')return;
const HC=new THREE.PerspectiveCamera(),SM=new THREE.Matrix4(),QA=new THREE.Quaternion(),QC=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0),P=new THREE.Vector3();
const PC=new THREE.Plane(),PH=new THREE.Plane(),F=new THREE.Vector3(),PCS=[PC],PCS2=[PC,PH],U={p:new THREE.Vector3(),a:new THREE.Vector3(),fov:50,t:0};
// lo que queda entre la cámara y la mesa (lámparas, ventiladores, el techo) no se dibuja: un plano corta todo lo que esté más cerca
// que el borde más cercano de la cubierta. Solo al ver desde arriba (de lado taparía el piso de enfrente). corte(cam,c,r,mg): c centro de la cubierta, r su radio
// techo (opcional): viendo desde arriba también se quita lo que cuelga más alto que techo sobre la cubierta (focos y guirnaldas de una pérgola)
// nunca más cerca que el piso que se ve: la esquina de abajo del cuadro (con margen por el corrimiento de la vista) pega en el piso a dF;
// el piso queda ~1.5 bajo la cubierta (todas las mesas a la misma altura). Sin esto, viendo inclinado se iba el piso cercano y se veía el de abajo.
function corte(cam,c,r,mg,techo){cam.getWorldDirection(F);const cy0=c.y;   // c puede ser P (se modifica abajo)
const k=Math.min(1,Math.max(0,(-F.y-.55)/.2));
 const sy=-F.y,cy=Math.sqrt(Math.max(0,1-sy*sy)),dF=(cam.position.y-cy0+1.5)/Math.max(.05,sy+Math.tan((cam.fov||50)*Math.PI/360)*1.6*cy)-.1;
 PC.normal.copy(F);PC.constant=k?-F.dot(cam.position)-Math.min(dF,F.dot(P.copy(c).sub(cam.position))-r*cy-mg):1e9;
 if(techo&&(k||cam.position.y>cy0+techo)){PH.normal.set(0,-1,0);PH.constant=cy0+techo;return PCS2}return PCS}   // con la cámara arriba de la pérgola nunca se dibuja (de lado tapaba la mesa con trabes y focos); sentado, abajo de ella, sí se ve
const casa=()=>window.CASA3D&&CASA3D.fondo&&CASA3D.R&&CASA3D.R()?CASA3D:null;
let tA=0;
// pinta(R, cam, g, o) cada cuadro, antes de dibujar el juego. o: {r: medio ancho de la mesa del juego (sus unidades), y: altura de su cubierta,
// rt: medio ancho que tendrá en la casa, techo: metros sobre la cubierta que se recortan viendo desde arriba, sillas: deja las sillas y los Miis sentados de la casa (juegos de tablero), viaje: al salir, la casa arranca en tus ojos (ult)}.
// Regresa s (la casa ya quedó dibujada: el juego dibuja encima sin borrar) o 0 (sin casa: el juego borra y pone su cuarto).
function pinta(R,cam,g,o){const H=casa();if(!H||R!==H.R())return 0;
 // en un juego las cartas mandan: densidad completa de la pantalla (hasta 2; 1.5 en celular) aunque la casa esté en Medio; RES no la baja mientras tanto
 const pr=Math.min(devicePixelRatio||1,window.MOVIL?1.5:2);   // celular: 1.5 (a 2 eran 2.6 veces los pixeles de la casa y calentaba)
 FONDO.t=performance.now();if(R.getPixelRatio()!==pr)(R.prJuego||R.setPixelRatio).call(R,pr);R.autoClear=false;
 const A=H.on()&&H.ancla(g);let s=0;if(!A&&H.on()&&performance.now()-tA>3000){tA=performance.now();H.arranca(g)}   // la mesa está en otro piso
 if(A){s=o.r/(o.rt||A.r);cam.updateMatrixWorld();QA.setFromAxisAngle(Y,A.a);
  P.setFromMatrixPosition(cam.matrixWorld);P.y-=o.y||0;P.multiplyScalar(1/s).applyQuaternion(QA);HC.position.set(A.x+P.x,A.y+P.y,A.z+P.z);
  HC.quaternion.copy(QA).multiply(cam.getWorldQuaternion(QC));
  Object.assign(HC,{fov:cam.fov,aspect:cam.aspect,near:cam.near/s,far:cam.far/s});
  HC.projectionMatrix.copy(cam.projectionMatrix).multiply(SM.makeScale(s,s,s));HC.projectionMatrixInverse.copy(HC.projectionMatrix).invert();
  HC.updateMatrixWorld();if(o.viaje){U.p.copy(HC.position);U.a.set(A.x,A.y,A.z);U.fov=cam.fov;U.t=FONDO.t}const rt=o.rt||A.r,cp=R.clippingPlanes;R.clippingPlanes=corte(HC,P.set(A.x,A.y,A.z),rt,rt*.35,o.techo);const ok=H.fondo(HC,g,!!o.sillas);R.clippingPlanes=cp;if(!ok)s=0}
 R.toneMapping=THREE.NoToneMapping;R.toneMappingExposure=1;return s}
// Mii de las cartas (trae su silla, c_mii.js): con s (en la casa) tamaño de casa; el tuyo no se ve (la cámara son tus ojos: grande tapaba la mesa).
// Sin s como siempre. Regresa qué tan lejos de la orilla de la mesa va sentado
function mii(g,s,yo){const k=s?s*FONDO.MII:1;g.scale.setScalar(k);g.visible=!(s&&yo);return s?.9*k:1.4}
// el raycast también pega en lo escondido: solo cuenta lo que se ve
function seen(o){for(;o;o=o.parent)if(!o.visible)return false;return true}
// R(g): el renderer de la casa para compartirlo (un solo WebGL); si recargaste a media partida, arma la casa primero. null sin casa
// ult(): tus ojos en la casa del último cuadro de un juego con viaje (si fue hace poco); se usa una vez al salir (c_casa3d.js deJuego)
window.FONDO={MII:1,ult:()=>{const ok=U.t&&performance.now()-U.t<1200;U.t=0;return ok?U:null},R:g=>{if(window.CASA3D&&CASA3D.arranca)CASA3D.arranca(g);const H=casa();return H?H.R():null},pinta,mii,seen,corte};
})();
