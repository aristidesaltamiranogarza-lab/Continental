// c_billar_cam.js — BCAM: cámara del Billar (L4). Al apuntar baja detrás de la blanca (se ve grande, con el triángulo detrás) y
// muestra en ella el punto negro del efecto, que se arrastra; al tirar sube un poco y sigue a las bolas que se mueven; "mesa" es la
// vista de arriba. Todo en coordenadas de la mesa (M.G); BIJ lo pasa al mundo y lo suaviza. Ajustes en BCAM.A.
// BCAM.pose({m,modo:'taco'|'sigue'|'mesa',c,ang,asp,fov0,dt}) → {P,L,f}; BCAM.tiro(a) al empezar un tiro; BCAM.punto(m,c,ang,ex,ey,ver);
// BCAM.efecto(ev,C,cv,m,c,ang,libre) → [ex,ey] si el dedo está sobre la blanca (libre: siempre, ya arrastrando).
(function(){
if(typeof THREE==='undefined'||!window.BFIS)return;
const A={jalon:.35,atras:.3,alto:.1,mira:1.2,sAtras:1.3,sAlto:1.35,sigueT:2.2,centro:.25,margen:.5,inc:1.12,techo:3.5,punto:.14};
const PI=Math.PI,v3=(x,y,z)=>new THREE.Vector3(x,y,z),P=v3(0,0,0),L=v3(0,0,0),T=v3(0,0,0),prev=[],q=new THREE.Quaternion();
let sd=[1,0],sigue=false,dot=null;
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),pl=new THREE.Plane(),hit=v3(0,0,0),esf=new THREE.Sphere();

function tiro(a){sd=[Math.cos(a),Math.sin(a)];sigue=false;prev.length=0}
function pose(o){const m=o.m,D=m.D,K=D.K,Rw=D.R;let f=o.fov0;
 if(o.modo==='taco'){const dx=Math.cos(o.ang),dz=Math.sin(o.ang),cx=o.c[0]*K,cz=o.c[1]*K;
  const at=A.atras+(o.pot||0)*A.jalon;P.set(cx-dx*at,D.Y+Rw+A.alto+(o.pot||0)*.05,cz-dz*at);L.set(cx+dx*A.mira,D.Y,cz+dz*A.mira);return {P,L,f}}
 if(o.modo==='sigue'){const dt=Math.max(o.dt,1e-3);let sx=0,sz=0,sw=0;
  m.bolas.forEach((b,i)=>{const p=prev[i];if(p&&b.visible){const v=b.position.distanceTo(p)/dt;if(v>.03){const w=v+.05;sx+=b.position.x*w;sz+=b.position.z*w;sw+=w}}
   if(p)p.copy(b.position);else prev[i]=b.position.clone()});
  if(!sigue){const c=m.bolas[0].position;T.set(c.x,D.Y,c.z);sigue=true}
  if(sw>0){const s=1-Math.exp(-dt*A.sigueT);T.x+=(sx/sw-T.x)*s;T.z+=(sz/sw-T.z)*s}
  L.set(T.x*(1-A.centro),D.Y,T.z*(1-A.centro));const hx=D.L/2+A.margen,hz=D.A/2+A.margen;
  P.set(Math.max(-hx,Math.min(hx,L.x-sd[0]*A.sAtras)),Math.min(A.techo-.1,D.Y+A.sAlto),Math.max(-hz,Math.min(hz,L.z-sd[1]*A.sAtras)));return {P,L,f}}
 sigue=false;
 const asp=o.asp||1,vx=asp<1,hl=D.L/2+.35,ha=D.A/2+.35,tv=Math.tan(f*PI/360),w=vx?ha:hl,hgt=(vx?hl:ha)*Math.sin(A.inc),
  d0=Math.max(w/(tv*asp),hgt/tv)*1.05,dm=(A.techo-D.Y)/Math.sin(A.inc);let d=d0;
 if(d>dm){f=Math.min(100,2*Math.atan(tv*d0/dm)*180/PI);d=dm}const ci=Math.cos(A.inc)*d,si=Math.sin(A.inc)*d;
 L.set(0,D.Y,0);if(vx)P.set(-ci,D.Y+si,0);else P.set(0,D.Y+si,ci);return {P,L,f}}

// punto negro sobre la blanca: donde pega el taco (ex a la derecha, ey arriba, ×efmax del radio)
function punto(m,c,ang,ex,ey,ver){if(!dot||dot.parent!==m.G){if(dot&&dot.parent)dot.parent.remove(dot);
  dot=new THREE.Mesh(new THREE.CircleGeometry(m.D.R*A.punto,20),new THREE.MeshBasicMaterial({color:0x111111,polygonOffset:true,polygonOffsetFactor:-2}));m.G.add(dot)}
 dot.visible=!!(ver&&c);if(!dot.visible)return;const D=m.D,dx=Math.cos(ang),dz=Math.sin(ang),k=BFIS.A.efmax,u=ex*k,v=ey*k,b=Math.sqrt(Math.max(0,1-u*u-v*v));
 const n=v3(-dx*b-dz*u,v,-dz*b+dx*u).normalize();dot.position.set(c[0]*D.K+n.x*D.R*1.004,D.Y+D.R+n.y*D.R*1.004,c[1]*D.K+n.z*D.R*1.004);
 dot.quaternion.setFromUnitVectors(v3(0,0,1),n)}

function efecto(e,C,cv,m,c,ang,libre){if(!c)return null;const r=cv.getBoundingClientRect(),D=m.D;
 ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,C);m.G.getWorldQuaternion(q);
 const dx=Math.cos(ang),dz=Math.sin(ang),o=m.G.localToWorld(v3(c[0]*D.K,D.Y+D.R,c[1]*D.K)),n=v3(-dx,0,-dz).applyQuaternion(q),
  s=v3(-dz,0,dx).applyQuaternion(q),up=v3(0,1,0).applyQuaternion(q),sc=m.G.getWorldScale(v3(0,0,0)).x||1;
 esf.set(o,D.R*sc);const en=ray.ray.intersectSphere(esf,hit);   // sobre la bola: el punto queda bajo el dedo
 if(!en){pl.setFromNormalAndCoplanarPoint(n,o);if(!ray.ray.intersectPlane(pl,hit))return null}hit.sub(o);
 const a=hit.dot(s)/sc,b=hit.dot(up)/sc;if(!libre&&Math.hypot(a,b)>D.R*1.25)return null;
 const rr=D.R*BFIS.A.efmax;let x=a/rr,y=b/rr;const h=Math.hypot(x,y);if(h>1){x/=h;y/=h}
 return [Math.abs(x)<.06?0:x,Math.abs(y)<.06?0:y]}

window.BCAM={A,pose,tiro,punto,efecto};
})();
