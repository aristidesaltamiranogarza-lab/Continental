// c_casa_ventanas.js — VENT: ventanas y balcones de la casa que se asoman al exterior de c_casa_cielo.js.
// Marco hondo (muro grueso de casona: el derrame sale hacia el cuarto), reja de forja y postigos de madera, en 3D en las dos calidades.
// El vidrio cambia según la calidad:
//   Completo: hueco real. Cada cuadro se dibuja el exterior con la misma cámara y el vidrio lo muestra en su lugar de la pantalla
//             (cielo, azoteas y luego la calle, de verdad). Si el sol (o la luna) le pega, entra un rayo de luz con sombras:
//             la reja y el marco dejan su sombra en el piso.
//   Medio:    "ventana con fondo". Al entrar al piso se hornea una vez una foto 360° (cubemap de 256) desde la ventana
//             y el vidrio la muestra según el ángulo de la cámara: se siente la profundidad sin dibujar el exterior cada cuadro.
// Uso (desde el armado del piso):
//   VENT.pon(escena,'alta',{x,y,z,ry,w,h,hondo,reja,postigos,abierta,sol})  ry: hacia dónde mira el vidrio (al cuarto)
// c_casa3d.js llama VENT.paso(piso,R,cámara) cada cuadro antes de dibujar.
(function(){
if(typeof THREE==='undefined')return;
const V=[];let rt=null;const tam=new THREE.Vector2(),fr=new THREE.Frustum(),pm=new THREE.Matrix4();
const VS='varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}';
// brillo del vidrio: un poco de reflejo según el ángulo (las puertas abiertas del balcón no llevan)
const BRILLO='float f=pow(1.-abs(dot(normalize(cameraPosition-vW),nrm)),3.);c=mix(c,vec3(.85,.9,1.),vid*(.06+.25*f));';
const FIN='gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}';
function matPortal(v){return new THREE.ShaderMaterial({uniforms:{rt:{value:null},res:{value:new THREE.Vector2(1,1)},vid:{value:v.abierta?0:1},nrm:{value:v.n}},vertexShader:VS,
 fragmentShader:'uniform sampler2D rt;uniform vec2 res;uniform float vid;uniform vec3 nrm;varying vec3 vW;void main(){vec3 c=texture2D(rt,gl_FragCoord.xy/res).rgb;'+BRILLO+FIN})}
function matCubo(v){return new THREE.ShaderMaterial({uniforms:{env:{value:v.crt.texture},vid:{value:v.abierta?0:1},nrm:{value:v.n}},vertexShader:VS,
 fragmentShader:'uniform samplerCube env;uniform float vid;uniform vec3 nrm;varying vec3 vW;void main(){vec3 c=textureCube(env,normalize(vW-cameraPosition)).rgb;'+BRILLO+FIN})}

// ---------- armado ----------
function pon(S,piso,o){const H=window.CASA3D,std=H.std,g=new THREE.Group();
 const w=o.w||2,h=o.h||3,hd=o.hondo==null?.45:o.hondo,t=.16,box=(a,b,c,m,x,y,z)=>H.box(a,b,c,m,x,y,z,g);
 g.position.set(o.x,o.y,o.z);g.rotation.y=o.ry||0;S.add(g);
 const cal=o.cal||std(0xe9e2d0,.6),mad=std(0x3a5a4a,.55),lis=std(0x2c4a3c,.6),fo=std(0x1c1c1e,.45,{metalness:.6});
 // derrame: jambas, dintel y alféizar salen del muro hacia el cuarto
 box(t,h+t*2,hd,cal,-w/2-t/2,0,hd/2);box(t,h+t*2,hd,cal,w/2+t/2,0,hd/2);box(w,t,hd,cal,0,h/2+t/2,hd/2);
 if(!o.abierta)box(w+t*2+.1,.1,hd+.14,cal,0,-h/2-.05,hd/2+.07);
 // reja de forja dentro del derrame
 if(o.reja!==false&&!o.abierta){const n=Math.max(3,Math.round(w/.22));for(let i=1;i<n;i++)box(.035,h,.035,fo,-w/2+i*w/n,0,hd*.35);
  [-.5,.5].forEach(k=>box(w,.04,.04,fo,0,k*h*.72,hd*.35));
  for(let i=1;i<n;i+=2){const c=new THREE.Mesh(new THREE.TorusGeometry(w/n/2,.012,5,14),fo);c.position.set(-w/2+i*w/n+w/n/2,h*.36+w/n/2,hd*.35);c.castShadow=true;g.add(c)}}
 // postigos de madera abiertos contra el muro, con tablillas
 if(o.postigos!==false&&!o.abierta)[-1,1].forEach(sg=>{const pw=w/2,x=sg*(w/2+t+pw/2+.02);box(pw,h,.06,mad,x,0,hd+.04);
  for(let y=-h/2+.3;y<h/2-.2;y+=.24)box(pw-.12,.045,.03,lis,x,y,hd+.08)});
 // vidrio en el plano del muro (un poco al frente para ganarle al lambrín)
 const v={piso,g,w,h,abierta:!!o.abierta,n:new THREE.Vector3(),c:new THREE.Vector3(),crt:null,ver:-1,spot:null,sol:o.sol!==false};
 const gl=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0x223344}));gl.position.z=.07;g.add(gl);v.gl=gl;
 g.updateMatrixWorld(true);gl.getWorldPosition(v.c);v.n.set(0,0,1).applyQuaternion(gl.getWorldQuaternion(new THREE.Quaternion()));
 gl.geometry.computeBoundingSphere();v.mP=matPortal(v);
 if(v.sol)luz(S,v);V.push(v);return g}

// rayo de sol (o de luna) que entra por la ventana: SpotLight desde afuera con una máscara del hueco proyectado (cookie).
// Los muros no proyectan sombra, así que solo la reja, el marco y los muebles la cortan. Solo en Completo (necesita sombras).
function luz(S,v){const L=new THREE.SpotLight(0xffffff,1,0,.5,.12,0);L.castShadow=true;L.shadow.mapSize.set(1024,1024);L.shadow.bias=-.0004;L.shadow.camera.near=1;L.shadow.camera.far=40;
 L.userData.keep=true;L.visible=false;S.add(L,L.target);v.spot=L;
 const cv=document.createElement('canvas');cv.width=cv.height=256;L.map=new THREE.CanvasTexture(cv);v.cv=cv;apunta(v)}
function apunta(v){const L=v.spot,T=window.CIELO&&CIELO.estado();if(!L||!T)return;
 const d=T.dir,entra=d.dot(v.n);L.userData.entra=entra>.15;   // el astro le pega a esta ventana
 L.color.copy(T.luz);L.intensity=T.luzI*1.8;L.position.copy(v.c).addScaledVector(d,-14);L.target.position.copy(v.c).addScaledVector(d,2);
 L.updateMatrixWorld();L.target.updateMatrixWorld();
 const P=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>v.gl.localToWorld(new THREE.Vector3(a*v.w/2,b*v.h/2,0)));
 let an=0;const ax=v.c.clone().sub(L.position).normalize();P.forEach(p=>{an=Math.max(an,ax.angleTo(p.clone().sub(L.position)))});L.angle=Math.min(1.2,an*1.15);
 L.shadow.updateMatrices(L);const g=v.cv.getContext('2d'),W=v.cv.width;g.fillStyle='#000';g.fillRect(0,0,W,W);g.fillStyle='#fff';g.beginPath();
 P.forEach((p,i)=>{const q=new THREE.Vector4(p.x,p.y,p.z,1).applyMatrix4(L.shadow.matrix);const x=q.x/q.w*W,y=(1-q.y/q.w)*W;i?g.lineTo(x,y):g.moveTo(x,y)});g.fill();L.map.needsUpdate=true}
if(window.CIELO)CIELO.on(()=>V.forEach(apunta));

// ---------- cada cuadro ----------
function paso(piso,R,cam){if(!R||!cam||!window.CIELO)return;const q=window.CALIDAD,mine=V.filter(v=>v.piso===piso);if(!mine.length)return;
 CIELO.sync();const com=q==='completo';
 mine.forEach(v=>{if(v.spot){const on=com&&v.spot.userData.entra;if(v.spot.visible!==on)v.spot.visible=on}});
 if(com){cam.updateMatrixWorld();fr.setFromProjectionMatrix(pm.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse));
  const ve=mine.filter(v=>{const sp=v.gl.geometry.boundingSphere.clone().applyMatrix4(v.gl.matrixWorld);return fr.intersectsSphere(sp)});
  mine.forEach(v=>{if(v.gl.material!==v.mP)v.gl.material=v.mP});if(!ve.length)return;
  R.getDrawingBufferSize(tam);if(!rt)rt=new THREE.WebGLRenderTarget(tam.x,tam.y,{type:THREE.HalfFloatType,samples:4});else if(rt.width!==tam.x||rt.height!==tam.y)rt.setSize(tam.x,tam.y);
  CIELO.dibuja(R,cam,rt,piso);ve.forEach(v=>{v.mP.uniforms.rt.value=rt.texture;v.mP.uniforms.res.value.copy(tam)});return}
 // Medio: foto 360° por ventana; se vuelve a hornear si cambia el tema
 if(rt)suelta();mine.forEach(v=>{if(!v.crt){v.crt=new THREE.WebGLCubeRenderTarget(256,{type:THREE.HalfFloatType});v.mC=matCubo(v)}
  if(v.ver!==CIELO.ver()){v.ver=CIELO.ver();CIELO.hornea(R,v.c.clone().addScaledVector(v.n,-.3),v.crt,piso)}if(v.gl.material!==v.mC)v.gl.material=v.mC})}

// libera lo que solo usa Completo cuando se baja de calidad
function suelta(){if(rt){rt.dispose();rt=null}}
window.VENT={pon,paso,suelta,lista:()=>V};
})();
