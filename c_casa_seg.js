// c_casa_seg.js — CSEG: cámara de seguimiento en la casa (CASONA.md V4). Desde arriba a ~45°, sigue a tu Mii con un retraso suave.
// Misma forma que CAV: c_casa3d.js llama CSEG.apply(cam, pos, V, off) y CSEG.clamp(V) cuando no hay primera persona.
// V.a = giro (arrastrar), V.t = inclinación extra sobre A.inc, V.k = zoom (rueda/pellizco, rango corto). Sin paneo: V.ox/V.oz = 0.
// En vuelo (CCAM.fly/blendIn) CCAM pisa la cámara después; parte y vuelve a esta pose. ?libre: vista libre de antes (CSEG.set(false)).
(function(){
if(typeof THREE==='undefined')return;
const R=Math.PI/180;
const A={inc:45*R,min:35*R,max:60*R,d:13,dPor:17,kmin:.75,kmax:1.5,lag:250,alto:1.9,salto:6};
let on=!new URLSearchParams(location.search).has('libre'),t0=0;const F=new THREE.Vector3(),T=new THREE.Vector3();let hay=false;
const por=()=>innerHeight>innerWidth;
// punto seguido: se acerca a pos con constante de tiempo A.lag; si brincó lejos (escalera, teletransporte), salta
function sigue(pos,off){T.set(pos.x,0,pos.z);if(off)T.add(off);const n=performance.now(),dt=Math.min(100,n-(t0||n));t0=n;
 if(!hay||F.distanceTo(T)>A.salto){F.copy(T);hay=true;return}F.lerp(T,1-Math.exp(-dt/A.lag))}
function apply(cam,pos,V,off){sigue(pos,off);const el=Math.max(A.min,Math.min(A.max,A.inc+V.t)),d=(por()?A.dPor:A.d)/V.k,a=V.a;
 cam.position.set(F.x+Math.sin(a)*Math.cos(el)*d,A.alto+Math.sin(el)*d,F.z+Math.cos(a)*Math.cos(el)*d);cam.lookAt(F.x,A.alto,F.z);cam.updateMatrixWorld()}
function clamp(V){V.ox=V.oz=0;V.k=Math.max(A.kmin,Math.min(A.kmax,V.k));V.t=Math.max(A.min-A.inc,Math.min(A.max-A.inc,V.t))}
// sin retraso la próxima vez (al entrar, cambiar de piso o cuadrar)
function snap(pos,off){hay=false;if(pos)sigue(pos,off)}
window.CSEG={on:()=>on,set:v=>{on=!!v;hay=false},apply,clamp,snap,A};
})();
