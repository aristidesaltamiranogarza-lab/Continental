// Cámara compartida: tomas con easing para cualquier cámara de Three.js (hoy la casa; después cada mesa).
// - blendIn(cam, desde, ms): arranca en una pose fija y se funde con la cámara "viva" que acomoda el juego cada cuadro.
// - fly(cam, poses, ms): recorre poses fijas (volar a la mesa, bajar a la silla) y se queda en la última hasta release().
// - fade(a, ms): fundido a negro (1) o de regreso (0); devuelve una promesa.
// - at(pos, mira): pose de cámara en pos mirando hacia mira. pose(cam): la pose actual.
// Cada cuadro, DESPUÉS de acomodar su cámara normal, el juego llama CCAM.apply(cam, now).
// Con "reducir movimiento" del sistema no hay vuelos: solo cortes y fundidos cortos.
(function(){
if(typeof THREE==='undefined')return;
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease={lin:t=>t,in:t=>t*t*t,out:t=>1-Math.pow(1-t,3),inOut:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,sine:t=>-(Math.cos(Math.PI*t)-1)/2};
const E=e=>typeof e==='function'?e:ease[e]||ease.inOut;
const dc=new THREE.PerspectiveCamera(),tp=new THREE.Vector3(),tq=new THREE.Quaternion();
const pose=cam=>({p:cam.position.clone(),q:cam.quaternion.clone()});
function at(pos,look){dc.position.copy(pos);dc.up.set(0,1,0);dc.lookAt(look);return {p:dc.position.clone(),q:dc.quaternion.clone()}}

let shot=null;   // {k:'in'|'fly'|'hold', cam, ...}
function blendIn(cam,from,ms,e){if(RM||!from){if(shot&&shot.cam===cam)shot=null;return}shot={k:'in',cam,from,ms:ms||900,e:E(e||'inOut'),t0:0}}
function fly(cam,poses,ms,e){const pts=[pose(cam),...poses],last=pts[pts.length-1];
 if(RM){shot={k:'hold',cam,last};return Promise.resolve()}
 return new Promise(res=>{shot={k:'fly',cam,pts,last,curve:new THREE.CatmullRomCurve3(pts.map(x=>x.p),false,'centripetal'),ms:ms||1200,e:E(e||'inOut'),t0:0,res}})}
// suelta la pose fija: regresa a la cámara viva con easing (o de golpe si ms = 0)
function release(cam,ms){if(!shot||shot.cam!==cam)return;const L=shot.last||pose(cam);shot=null;if(ms)blendIn(cam,L,ms)}
// el usuario tocó algo: una toma de llegada se corta; un vuelo no
function cut(){if(shot&&shot.k==='in')shot=null}

function apply(cam,now){const s=shot;if(!s||s.cam!==cam)return false;
 if(s.k==='hold'){cam.position.copy(s.last.p);cam.quaternion.copy(s.last.q)}
 else{if(!s.t0)s.t0=now;const u=Math.min(1,(now-s.t0)/s.ms),e=s.e(u);
  if(s.k==='in'){tp.copy(cam.position);tq.copy(cam.quaternion);cam.position.lerpVectors(s.from.p,tp,e);cam.quaternion.slerpQuaternions(s.from.q,tq,e);if(u>=1)shot=null}
  else{const n=s.pts.length-1,x=e*n,i=Math.min(n-1,Math.floor(x));s.curve.getPoint(e,cam.position);cam.quaternion.slerpQuaternions(s.pts[i].q,s.pts[i+1].q,ease.sine(Math.min(1,x-i)));
   if(u>=1){shot={k:'hold',cam,last:s.last};s.res()}}}
 cam.updateMatrixWorld();return true}

let fd=null;
function fade(to,ms){ms=RM?Math.min(ms||0,150):(ms||400);
 if(!fd){fd=document.createElement('div');fd.id='ccamfade';fd.setAttribute('aria-hidden','true');
  fd.style.cssText='position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:900';document.body.appendChild(fd)}
 return new Promise(res=>{fd.style.transition=`opacity ${ms}ms ease`;fd.style.pointerEvents=to>0?'auto':'none';void fd.offsetWidth;fd.style.opacity=String(to);setTimeout(res,ms+20)})}

window.CCAM={ease,at,pose,blendIn,fly,release,cut,apply,fade,RM,busy:()=>!!shot&&shot.k!=='in'};
})();
