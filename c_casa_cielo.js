// c_casa_cielo.js — CIELO: el exterior compartido por todos los pisos (cielo, sol o luna, horizonte de azoteas de Mérida).
// Sigue el tema: de día con Día y de noche con Noche (Automático sigue al sistema, UI.noche()).
// Es una escena aparte (CIELO.ext) en coordenadas de la casa: CIELO.mundo se baja a la altura del piso donde estás (ALT),
// así desde la planta alta se ven las azoteas desde arriba. Las ventanas (c_casa_ventanas.js) la dibujan:
//   Completo: CIELO.dibuja(R, cámara, destino, piso) cada cuadro;  Medio: CIELO.hornea(R, punto, cubeRT, piso) una vez.
// D4 agrega aquí la calle, la fachada y los vecinos (CIELO.mundo.add(...)).
(function(){
if(typeof THREE==='undefined')return;
const ALT={sot:-4,pb:0,alta:9.6,ter:19.2};
const C=h=>new THREE.Color(h);
// dir = hacia dónde viaja la luz (del sol al suelo): tarde, el sol entra por el poniente (-X)
const TEMAS={
 dia:{cen:C(0x3d7ccc),hor:C(0xf2dcb4),suelo:C(0xb39a78),astro:C(0xfff0d0),luz:C(0xffdcb0),luzI:3.2,dir:new THREE.Vector3(1,-.6,.35).normalize(),hemC:C(0xdbe8ff),hemS:C(0xb39a78),hemI:1.4,niebla:C(0xe8d6ba),ven:C(0x3a4a5a),venI:0},
 noche:{cen:C(0x040818),hor:C(0x1f2c52),suelo:C(0x1a1a22),astro:C(0xc8d6ff),luz:C(0x9fb6ff),luzI:.55,dir:new THREE.Vector3(.7,-.6,-.4).normalize(),hemC:C(0x1c2850),hemS:C(0x0a0a10),hemI:.45,niebla:C(0x141e3a),ven:C(0xffc870),venI:1}};
let T=null,ver=0;const subs=[];
const esNoche=()=>!!(window.UI&&UI.noche&&UI.noche());

const ext=new THREE.Scene(),mundo=new THREE.Group();ext.add(mundo);ext.fog=new THREE.Fog(0xe8d6ba,40,170);
// ---------- domo: degradado, disco del sol o de la luna y estrellas (en el shader, sin texturas) ----------
const U={cen:{value:C(0)},hor:{value:C(0)},astro:{value:C(0)},hacia:{value:new THREE.Vector3(0,1,0)},noc:{value:0}};
const domo=new THREE.Mesh(new THREE.SphereGeometry(180,32,16),new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,fog:false,
 vertexShader:'varying vec3 vD;void main(){vec4 w=modelMatrix*vec4(position,1.);vD=w.xyz-cameraPosition;gl_Position=projectionMatrix*viewMatrix*w;}',
 fragmentShader:`uniform vec3 cen,hor,astro,hacia;uniform float noc;varying vec3 vD;
 void main(){vec3 d=normalize(vD);float h=max(d.y,0.);vec3 c=mix(hor,cen,pow(h,.5));
  float s=max(dot(d,hacia),0.);c+=astro*(smoothstep(.9994,.9997,s)*(noc>.5?1.6:5.)+pow(s,10.)*(noc>.5?.05:.22));
  if(noc>.5){vec3 q=floor(d*170.);float r=fract(sin(dot(q,vec3(12.9898,78.233,45.164)))*43758.5453);c+=vec3(.9)*step(.996,r)*smoothstep(.04,.25,h);}
  gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`}));
domo.renderOrder=-1;ext.add(domo);
const hemi=new THREE.HemisphereLight(0xffffff,0x888888,1),sol=new THREE.DirectionalLight(0xffffff,1);ext.add(hemi,sol,sol.target);

// ---------- horizonte: casas de uno y dos pisos de colores, árboles asomando y el suelo (luego D4 pone la calle) ----------
let rs=7;const rnd=()=>(rs=(rs*9301+49297)%233280)/233280;
mundo.add(Object.assign(new THREE.Mesh(new THREE.PlaneGeometry(500,500).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:0xb39a78})),{name:'suelo'}));
const PAL=[0xe8a0a8,0xe2b452,0x7fa8d0,0x8cbf88,0xf0e4cc,0xd9785a,0xc9d6a0,0xf2c49b];
const N=78,casas=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1).translate(0,.5,0),new THREE.MeshLambertMaterial(),N);
const NV=N*2,vent=new THREE.InstancedMesh(new THREE.PlaneGeometry(1.1,1.5),new THREE.MeshBasicMaterial({color:0xffffff,fog:true}),NV);
const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),p=new THREE.Vector3(),s=new THREE.Vector3(),cc=new THREE.Color();
let ni=0,nv=0;
for(let i=0;ni<N&&i<400;i++){const a=rnd()*Math.PI*2,r=26+rnd()*70,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<21&&Math.abs(z)<18)continue;
 const w=6+rnd()*7,d=6+rnd()*7,h=rnd()<.3?7+rnd()*2.5:3.6+rnd()*1.6,ry=Math.round(a/(Math.PI/2))*Math.PI/2+(rnd()-.5)*.2;
 e.set(0,ry,0);q.setFromEuler(e);casas.setMatrixAt(ni,m4.compose(p.set(x,0,z),q,s.set(w,h,d)));casas.setColorAt(ni,cc.setHex(PAL[(rnd()*PAL.length)|0]));ni++;
 // una o dos ventanas en la cara que ve a la casa (de noche se prenden)
 const fx=-Math.cos(a),fz=-Math.sin(a),ang=Math.atan2(fx,fz);for(let k=0;k<2&&nv<NV;k++){if(k&&rnd()<.4)continue;
  const off=(k?1:-1)*w*.22,yy=h>6?(rnd()<.5?2:5.2):2,px=x+fx*(d/2+.05)+Math.cos(ang)*off,pz=z+fz*(d/2+.05)-Math.sin(ang)*off;
  e.set(0,ang,0);q.setFromEuler(e);vent.setMatrixAt(nv++,m4.compose(p.set(px,yy,pz),q,s.set(1,1,1)))}}
casas.count=ni;vent.count=nv;mundo.add(casas,vent);
const NA=30,arb=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshLambertMaterial({color:0x4a7a3a}),NA);let na=0;
for(let i=0;na<NA&&i<300;i++){const a=rnd()*Math.PI*2,r=34+rnd()*55,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<30&&Math.abs(z)<26)continue;   // lejos: de cerca taparían la vista
 const k=2.2+rnd()*2.2;arb.setMatrixAt(na,m4.compose(p.set(x,3.5+k*.6,z),q.identity(),s.set(k*1.2,k,k*1.2)));arb.setColorAt(na,cc.setHex([0x4a7a3a,0x3d6b35,0x5a8a40,0xc0442a][(rnd()*4)|0]));na++}
arb.count=na;mundo.add(arb);

// ---------- tema ----------
function aplica(){const n=esNoche(),t=n?TEMAS.noche:TEMAS.dia;if(t===T)return false;T=t;ver++;
 U.cen.value.copy(t.cen);U.hor.value.copy(t.hor);U.astro.value.copy(t.astro);U.hacia.value.copy(t.dir).negate();U.noc.value=n?1:0;
 ext.fog.color.copy(t.niebla);hemi.color.copy(t.hemC);hemi.groundColor.copy(t.hemS);hemi.intensity=t.hemI;
 sol.color.copy(t.luz);sol.intensity=t.luzI*.9;sol.position.copy(t.dir).multiplyScalar(-50);
 mundo.getObjectByName('suelo').material.color.copy(t.suelo);vent.material.color.copy(t.ven);
 subs.forEach(f=>{try{f(t,n)}catch(er){console.error(er)}});return true}
const sync=()=>aplica();
if(window.UI&&UI.on)UI.on(()=>aplica());
aplica();

const wp=new THREE.Vector3();
function coloca(p,pos){mundo.position.y=-(ALT[p]||0);domo.position.copy(pos);ext.updateMatrixWorld()}
// dibuja el exterior visto por la cámara de la casa en un destino (render target) del tamaño de la pantalla
function dibuja(R,cam,rt,p){sync();coloca(p,cam.getWorldPosition(wp));const prev=R.getRenderTarget();R.setRenderTarget(rt);R.clear();R.render(ext,cam);R.setRenderTarget(prev)}
// foto 360° del exterior desde un punto (Medio): cubeRT de WebGLCubeRenderTarget
const cubos=new WeakMap();
function hornea(R,pos,crt,p){sync();let cc=cubos.get(crt);if(!cc){cc=new THREE.CubeCamera(.5,400,crt);cubos.set(crt,cc)}cc.position.copy(pos);coloca(p,pos);cc.update(R,ext)}

window.CIELO={ext,mundo,ALT,sync,dibuja,hornea,noche:esNoche,estado:()=>T,ver:()=>ver,on:f=>subs.push(f)};
})();
