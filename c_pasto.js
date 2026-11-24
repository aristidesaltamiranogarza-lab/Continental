// c_pasto.js — PASTO: el pasto y el viento del paisaje de la casona (casona_landscape.md, pasto opción B).
// - PASTO.textura(g,w,h): pasto suave de briznas finas, sin manchas (CMAT la usa para el material 'pasto').
// - Suelo: ruido de color grande en espacio de mundo (dos escalas) que mezcla verde apagado, parches secos dorados y tierra: no se ve la repetición. Todas las calidades.
// - Matas: hojas sólidas (sin recorte ni transparencias) instanciadas sobre el pasto, una sola llamada de dibujo, con la luz horneada
//   del suelo en su raíz (uv1 por instancia) y meciéndose en el shader de vértices. Solo en Completo (en Medio se esconden).
// - PASTO.viento(mat,obj): mece copas de árboles (vértice, casi gratis; todas las calidades).
// CMAT.aplicar llama PASTO.pon(root,MAT); CMAT.copas llama PASTO.viento. Ajustes en PASTO.A. ?nomatas apaga las matas.
(function(){
if(typeof THREE==='undefined')return;
const A={dens:1.1,max:1800,alto:.5,viento:1,copa:.012};
const U={uT:{value:0},uV:{value:A.viento}},MATAS=[],SIN=/[?&]nomatas\b/.test(location.search);
const tic=()=>{U.uT.value=performance.now()/1000;U.uV.value=A.viento};
const medio=()=>window.CALIDAD==='medio';

// encadena un parche de shader sin perder el de CMAT (luz bicúbica)
function parche(m,key,fn){const prev=m.onBeforeCompile,pk=Object.prototype.hasOwnProperty.call(m,'customProgramCacheKey')?m.customProgramCacheKey:null;
 m.onBeforeCompile=function(s,r){if(prev)prev.call(this,s,r);fn(s)};m.customProgramCacheKey=()=>(pk?pk.call(m):'')+key;m.needsUpdate=true}

const RUIDO='float pH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n'+
 'float pN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(pH(i),pH(i+vec2(1,0)),f.x),mix(pH(i+vec2(0,1)),pH(i+vec2(1,1)),f.x),f.y);}\n';

// textura: base apagada y briznas cortas de bajo contraste, que se repite sin costura
function textura(g,w,h){let s=7;const r=()=>(s=(s*9301+49297)%233280)/233280;
 g.fillStyle='#a1aa6e';g.fillRect(0,0,w,h);
 const tonos=['rgba(84,108,58,.28)','rgba(120,140,72,.30)','rgba(196,192,120,.22)','rgba(150,150,86,.25)','rgba(70,92,52,.2)'];
 g.lineCap='round';
 for(let i=0;i<w*h/22;i++){const x=r()*w,y=r()*h,l=2+r()*4,a=-Math.PI/2+(r()-.5)*1.1;g.strokeStyle=tonos[i%tonos.length];g.lineWidth=.8+r()*.9;
  for(const dx of [-w,0,w])for(const dy of [-h,0,h]){const X=x+dx,Y=y+dy;if(X<-8||X>w+8||Y<-8||Y>h+8)continue;g.beginPath();g.moveTo(X,Y);g.lineTo(X+Math.cos(a)*l,Y+Math.sin(a)*l);g.stroke()}}}

// suelo: tinte de mundo en dos escalas
function suelo(m){if(m.userData.pasto)return;m.userData.pasto=1;
 parche(m,'|pasto',s=>{
  s.vertexShader='varying vec2 vPW;\n'+s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvPW=(modelMatrix*vec4(transformed,1.)).xz;');
  s.fragmentShader='varying vec2 vPW;\n'+RUIDO+s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n'+
   '{float n1=pN(vPW*.07),n2=pN(vPW*.29+17.),n3=pN(vPW*1.1+5.);float seco=smoothstep(.5,.85,n1*.65+n2*.35);vec3 c=diffuseColor.rgb;'+
   'c=mix(c,c*vec3(1.3,1.13,.74),seco*.8);c=mix(c,c*vec3(1.12,.98,.86),smoothstep(.78,.95,n2)*.6);'+
   'c=mix(c,c*vec3(.84,.93,.82),smoothstep(.55,.85,1.-n1)*.45*(1.-seco));c*=.95+.1*n3;diffuseColor.rgb=c;}')})}

// una mata: 5 hojas, cada una con 3 triángulos (base, doblez y punta); color de la raíz a la punta
function mataGeo(){const P=[],C=[],ba=new THREE.Color('#5d7a40'),pu=new THREE.Color('#b9bb72'),me=ba.clone().lerp(pu,.55);
 for(let i=0;i<5;i++){const a=i/5*Math.PI*2+(i%2)*.4,ca=Math.cos(a),sa=Math.sin(a),px=-sa,pz=ca,h=A.alto*(.75+.25*((i*37)%5)/4),w=.035,ab=.05+.04*(i%3);
  const p=(o,y,wd)=>[ca*o+px*wd,y,sa*o+pz*wd],
   b0=p(0,0,-w),b1=p(0,0,w),m0=p(ab,h*.55,-w*.7),m1=p(ab,h*.55,w*.7),t=p(ab*2.6,h,0);
  for(const [v,c] of [[b0,ba],[b1,ba],[m0,me],[b1,ba],[m1,me],[m0,me],[m0,me],[m1,me],[t,pu]]){P.push(...v);C.push(c.r,c.g,c.b)}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));return g}

// matas sobre las mallas de pasto (coordenadas de root); raíz con la uv1 del suelo para tomar su luz horneada
function matas(root,ms,mPasto){let s=13;const r=()=>(s=(s*9301+49297)%233280)/233280;
 root.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(root.matrixWorld).invert(),M=new THREE.Matrix4(),T=[],acc=[];let area=0;
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 for(const o of ms){const g=o.geometry,pa=g.attributes.position,u1=g.attributes.uv1,ix=g.index;if(!pa)continue;M.multiplyMatrices(inv,o.matrixWorld);
  const n=ix?ix.count:pa.count,vi=k=>ix?ix.getX(k):k;
  for(let k=0;k+2<n;k+=3){const i0=vi(k),i1=vi(k+1),i2=vi(k+2);a.fromBufferAttribute(pa,i0).applyMatrix4(M);b.fromBufferAttribute(pa,i1).applyMatrix4(M);c.fromBufferAttribute(pa,i2).applyMatrix4(M);
   const ar=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a)).length()/2;if(ar<1e-4)continue;area+=ar;acc.push(area);
   T.push({a:a.clone(),b:b.clone(),c:c.clone(),u:u1?[u1.getX(i0),u1.getY(i0),u1.getX(i1),u1.getY(i1),u1.getX(i2),u1.getY(i2)]:null})}}
 const N=Math.min(A.max,Math.round(area*A.dens));if(!N||!T.length)return null;
 const geo=mataGeo(),UV=new Float32Array(N*2),m=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide});
 if(mPasto&&mPasto.lightMap){m.lightMap=mPasto.lightMap;m.lightMapIntensity=mPasto.lightMapIntensity}
 geo.setAttribute('uv1',new THREE.InstancedBufferAttribute(UV,2));
 const im=new THREE.InstancedMesh(geo,m,N),q=new THREE.Quaternion(),e=new THREE.Euler(),S=new THREE.Vector3(),P=new THREE.Vector3(),col=new THREE.Color(),seco=new THREE.Color('#e8cf86');
 for(let i=0;i<N;i++){const x=r()*area;let lo=0,hi=acc.length-1;while(lo<hi){const md=(lo+hi)>>1;if(acc[md]<x)lo=md+1;else hi=md}const t=T[lo];
  let u=r(),v=r();if(u+v>1){u=1-u;v=1-v}const w=1-u-v;P.set(0,0,0).addScaledVector(t.a,w).addScaledVector(t.b,u).addScaledVector(t.c,v);P.y+=.01;
  if(t.u){UV[i*2]=t.u[0]*w+t.u[2]*u+t.u[4]*v;UV[i*2+1]=t.u[1]*w+t.u[3]*u+t.u[5]*v}
  const k=.7+r()*.6;S.set(k,k*(.8+r()*.5),k);q.setFromEuler(e.set((r()-.5)*.15,r()*6.283,(r()-.5)*.15));im.setMatrixAt(i,new THREE.Matrix4().compose(P,q,S));
  col.setScalar(.85+r()*.25);if(r()<.18)col.multiply(seco);im.setColorAt(i,col)}
 parche(m,'|mata',s=>{s.uniforms.uT=U.uT;s.uniforms.uV=U.uV;
  s.vertexShader='uniform float uT,uV;\n'+s.vertexShader.replace('#include <project_vertex>',
   '{vec4 ip=modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.);float h=position.y/'+A.alto.toFixed(3)+',h2=h*h*uV;'+
   'transformed.x+=(sin(uT*2.1+ip.x*.6+ip.z*.4)*.06+sin(uT*5.3+ip.z*1.7)*.015)*h2;transformed.z+=sin(uT*1.7+ip.x*.3-ip.z*.5)*.045*h2;}\n#include <project_vertex>')});
 im.name='pasto_matas';im.frustumCulled=false;im.matrixAutoUpdate=false;im.onBeforeRender=tic;im.visible=!medio()&&!SIN;
 if(window.CMAT&&CMAT.noc)CMAT.noc(m,true);
 root.add(im);MATAS.push(im);return im}

// la calidad cambia en vivo (c_casa3d.js applyQ → CGLB.calidad): se esconden o aparecen
let ENG=false;function engancha(){if(ENG||!window.CGLB||!CGLB.calidad)return;ENG=true;const f=CGLB.calidad;CGLB.calidad=function(){const r=f.apply(this,arguments);calidad();return r}}
function calidad(){for(let i=MATAS.length-1;i>=0;i--){const m=MATAS[i];if(!m.parent){MATAS.splice(i,1);continue}m.visible=!medio()&&!SIN}}

function pon(root,MAT){engancha();const ms=[];let mp=null;
 root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;const m=o.material;if(!m||!m.userData)return;
  const k=Object.keys(MAT).find(n=>MAT[n]===m);if(!k||!/^pasto\+?$/.test(k))return;suelo(m);ms.push(o);if(m.lightMap)mp=m});
 if(ms.length)matas(root,ms,mp)}

// viento en copas: desplaza por altura sobre el suelo, con fase por posición
function viento(m,o){if(!m||m.userData.viento)return;m.userData.viento=1;
 parche(m,'|viento',s=>{s.uniforms.uT=U.uT;s.uniforms.uV=U.uV;
  s.vertexShader='uniform float uT,uV;\n'+s.vertexShader.replace('#include <project_vertex>',
   '{vec4 wp=modelMatrix*vec4(position,1.);float h=max(wp.y-1.2,0.)*'+A.copa.toFixed(4)+'*uV;'+
   'transformed.x+=(sin(uT*1.1+wp.x*.25+wp.z*.15)*.6+sin(uT*2.7+wp.y*.8+wp.x)*.22)*h;transformed.z+=(sin(uT*.9+wp.z*.3)*.45+sin(uT*3.1+wp.x*.7)*.15)*h;}\n#include <project_vertex>')});
 if(o){const prev=o.onBeforeRender;o.onBeforeRender=function(){tic();if(prev)prev.apply(this,arguments)}}}

window.PASTO={A,U,textura,suelo,pon,viento,calidad,matas:()=>MATAS};
})();
