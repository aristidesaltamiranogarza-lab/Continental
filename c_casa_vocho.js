// VOCHO: el bochito de la calle. Carrocería paramétrica (perfil + superelipse) con salpicaderas de tubo sobre las llantas;
// ventanas, marcos cromados, costuras y rejilla del motor se pintan en el shader con distancias por vértice (bordes nítidos).
// Mira hacia -x, piso en y=0. VOCHO.hazlo(color) → THREE.Group
(function(){
const XS=[-3.45,-3,-2.4,-1.8,-1.4,-.8,-.2,.5,1.2,1.8,2.4,3,3.42],
 YT=[1,1.38,1.56,1.66,1.8,2.4,2.52,2.52,2.38,2.05,1.7,1.35,1.05],
 HW=[.7,.84,.9,.96,1,1.03,1.05,1.05,1.04,1,.95,.88,.75],YB=.62,XM=-.015,LH=3.435,WF=-2.1,WR=2,RW=.6;
function cr(X,Y,x){let i=0;while(i<X.length-2&&x>X[i+1])i++;const n=X.length-1,
 m=k=>k<=0?(Y[1]-Y[0])/(X[1]-X[0]):k>=n?(Y[n]-Y[n-1])/(X[n]-X[n-1]):(Y[k+1]-Y[k-1])/(X[k+1]-X[k-1]),
 h=X[i+1]-X[i],t=Math.min(1,Math.max(0,(x-X[i])/h)),t2=t*t,t3=t2*t;
 return (2*t3-3*t2+1)*Y[i]+(t3-2*t2+t)*h*m(i)+(3*t2-2*t3)*Y[i+1]+(t3-t2)*h*m(i+1)}
// punto de la carrocería en la estación x y ángulo al (0 arriba, +π/2 costado z+, ±π abajo)
function pt(x,al){const t=(x-XM)/LH,e=Math.pow(Math.max(0,1-Math.pow(Math.abs(t),4)),.25),yt=cr(XS,YT,x),hw=cr(XS,HW,x)*e,
 yc=(yt+YB)/2,hh=(yt-YB)/2*e,s=Math.sin(al),c=Math.cos(al),k=2/(c>0?2.4:4);
 return [x,yc+hh*Math.sign(c)*Math.pow(Math.abs(c),k),hw*Math.sign(s)*Math.pow(Math.abs(s),k)]}
const sdRR=(x,y,cx,cy,hx,hy,r)=>{const qx=Math.abs(x-cx)-hx+r,qy=Math.abs(y-cy)-hy+r;return Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0)-r},
 sdSeg=(x,y,ax,ay,bx,by)=>{const ex=bx-ax,ey=by-ay,h=Math.max(0,Math.min(1,((x-ax)*ex+(y-ay)*ey)/(ex*ex+ey*ey)));return Math.hypot(x-ax-ex*h,y-ay-ey*h)},
 sdPoly=(V,x,y)=>{let d=1e9,s=1;for(let i=0,j=V.length-1;i<V.length;j=i++){const [ax,ay]=V[j],[bx,by]=V[i],ex=bx-ax,ey=by-ay,wx=x-ax,wy=y-ay,
  h=Math.max(0,Math.min(1,(wx*ex+wy*ey)/(ex*ex+ey*ey)));d=Math.min(d,(wx-ex*h)**2+(wy-ey*h)**2);
  const c1=y>=ay,c2=y<by,c3=ex*wy>ey*wx;if((c1&&c2&&c3)||(!c1&&!c2&&!c3))s=-s}return s*Math.sqrt(d)};
// ventanas laterales en (x, altura): base horizontal y tope que sigue el techo
const PUE=[[-.95,1.88],[.45,1.88],[.45,2.3],[-.72,2.3]],CUA=[[.79,1.88],[1.42,1.88],[1.16,2.26],[.79,2.26]],
 lat=(V,r,x,a,y)=>Math.max(sdPoly(V,x,y)-r,y-cr(XS,YT,x)+.17,.55-a);
// [vidrio (<0 dentro; 0–.035 marco cromado), costura (<0), reflejo]
function mask(x,a,y){const g=Math.min(sdRR(x,a,-1.095,0,.23,.55,.1),sdRR(x,a,1.74,0,.25,.4,.17),lat(PUE,.07,x,a,y),lat(CUA,.12,x,a,y));
 let s=Math.min(sdSeg(x,a,-1.2,1.47,-1.2,2.75),sdSeg(x,a,.58,1.47,.58,2.75),Math.abs(sdRR(x,a,-2.35,0,.85,.78,.35)),Math.abs(sdRR(x,a,2.78,0,.5,.55,.25)))-.008;
 for(let k=0;k<5;k++)s=Math.min(s,sdRR(x,a,2.38+k*.055,0,.012,.28,.01));
 return [g,s,Math.min(1,Math.max(0,(y-1.6)/.9))]}
// malla en rejilla anexada a B; orienta las caras hacia afuera de ref
function grid(B,NI,NJ,f,ref,m){const o=B.P.length/3,W=NJ+1;
 for(let i=0;i<=NI;i++)for(let j=0;j<=NJ;j++){const p=f(i/NI,j/NJ);B.P.push(p[0],p[1],p[2]);B.M.push(...(m?m(p,i/NI,j/NJ):[1,1,0]))}
 const v=k=>new THREE.Vector3(B.P[3*(o+k)],B.P[3*(o+k)+1],B.P[3*(o+k)+2]),mi=NI>>1,mj=NJ>>1,a=v(mi*W+mj),
  out=v((mi+1)*W+mj).sub(a).cross(v(mi*W+mj+1).sub(a)).dot(a.clone().sub(ref))>0;
 for(let i=0;i<NI;i++)for(let j=0;j<NJ;j++){const a=o+i*W+j,b=a+W;out?B.I.push(a,b,a+1,b,b+1,a+1):B.I.push(a,a+1,b,b,a+1,b+1)}}
// salpicadera: medio tubo que abraza la llanta (wx) de b0 a b1 (grados), del lado s
const ZC=.97,FW=.33,FR=RW+.08,FH=.26,fen=(f,s)=>{const b=(-12+204*f)*Math.PI/180,e=Math.pow(Math.sin(Math.PI*f),.35);return {b,e,r:[Math.cos(b),Math.sin(b)]}};
function salp(B,wx,s){grid(B,40,24,(fi,fj)=>{const {e,r}=fen(fi),g=fj*Math.PI*2,sg=Math.sin(g),o=FR+(sg>0?FH:.05)*sg*e;
  return [wx+r[0]*o,RW+r[1]*o,s*(ZC+FW*e*Math.cos(g))]},new THREE.Vector3(wx,RW+FR,s*ZC))}
function cresta(wx,deg,s){const b=deg*Math.PI/180,f=(deg+12)/204,e=Math.pow(Math.sin(Math.PI*f),.35),o=FR+FH*e;return [wx+Math.cos(b)*o,RW+Math.sin(b)*o,s*ZC]}

function pintura(col){const m=new THREE.MeshStandardMaterial({color:col,roughness:.3,metalness:.05});m.customProgramCacheKey=()=>'vocho';
 m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 aM;\nvarying vec3 vM;').replace('#include <begin_vertex>','#include <begin_vertex>\nvM=aM;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vM;\nfloat mG,mC;')
   .replace('#include <color_fragment>',`#include <color_fragment>
    float fg=max(fwidth(vM.x),1e-4),fs=max(fwidth(vM.y),1e-4);mG=1.-smoothstep(-fg,fg,vM.x);mC=(1.-mG)*(1.-smoothstep(.025-fg,.025+fg,vM.x));
    float sm=(1.-smoothstep(-fs,fs,vM.y))*(1.-mG);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.86,.87,.89),mC);
    diffuseColor.rgb=mix(diffuseColor.rgb,mix(vec3(.03,.04,.06),vec3(.14,.18,.23),vM.z),mG);
    diffuseColor.rgb*=1.-.75*sm;`)
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.1,max(mG,mC));')
   .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,.45,mC);')};return m}

function hazlo(col){const G=new THREE.Group(),B={P:[],M:[],I:[]};
 grid(B,150,128,(u,v)=>pt(XM+LH*Math.sin((u*2-1)*Math.PI/2),-Math.PI+v*Math.PI*2),new THREE.Vector3(0,1.3,0),(p,u,v)=>mask(p[0],Math.abs(-Math.PI+v*Math.PI*2),p[1]));
 [1,-1].forEach(s=>{salp(B,WF,s);salp(B,WR,s)});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(B.P,3));g.setAttribute('aM',new THREE.Float32BufferAttribute(B.M,3));
 g.setIndex(B.I);g.computeVertexNormals();const cuerpo=new THREE.Mesh(g,pintura(col==null?0xf5c518:col));cuerpo.castShadow=true;G.add(cuerpo);
 const CH=LOTE(),NG=LOTE(),LZ=LOTE(),RJ=LOTE(),cro=0xd8dce0;
 [WF,WR].forEach(wx=>[1,-1].forEach(s=>{NG.geo(new THREE.TorusGeometry(.43,.17,12,30),0x151515,wx,RW,s*1);
  CH.geo(new THREE.CylinderGeometry(.33,.33,.3,24),0x9a9da2,wx,RW,s*1,0,Math.PI/2,0);
  CH.geo(new THREE.SphereGeometry(1,20,8,0,Math.PI*2,0,Math.PI/2).rotateX(s*Math.PI/2).scale(.25,.25,.1),cro,wx,RW,s*1.15)}));
 [1,-1].forEach(s=>{NG.box(2.8,.07,.34,0x1a1a1a,-.05,.5,s*1.12);
  // faros en las salpicaderas delanteras y calaveras en las traseras
  const h=cresta(WF,130,s);CH.geo(new THREE.CylinderGeometry(.2,.2,.18,22),cro,h[0]-.04,h[1]+.006,h[2],0,0,1.42);
  LZ.geo(new THREE.SphereGeometry(1,18,10).scale(.07,.17,.17),0xfff6dc,h[0]-.13,h[1]+.02,h[2]);
  const t=cresta(WR,50,s);RJ.geo(new THREE.SphereGeometry(1,14,10).scale(.1,.18,.1),0xc0141a,t[0]+.04,t[1]+.03,t[2]);
  // defensas con sus colmillos
  [[-3.3,1],[3.28,-1]].forEach(([x,d])=>{CH.box(.09,.16,2,cro,x,.74,0);CH.box(.09,.16,.32,cro,x+d*.07,.74,s*1.14,s*d*.46);
   CH.box(.08,.4,.08,cro,x-d*.04,.82,s*.42);NG.box(.2,.06,.08,0x222222,x+d*.12,.72,s*.55)});
  CH.geo(new THREE.CylinderGeometry(.05,.05,.25,12),cro,3.3,.5,s*.45,0,0,Math.PI/2);
  const m=pt(.3,1.5);CH.box(.17,.035,.045,cro,m[0],m[1],s*(m[2]+.02))});   // manijas
 [1,-1].forEach(s=>{const b=pt(-.9,1.45);CH.box(.04,.04,.26,cro,b[0],b[1]+.06,s*(b[2]+.11),0,-.45*s);CH.geo(new THREE.CylinderGeometry(.12,.12,.05,22).scale(1,1,.8),cro,b[0],b[1]+.15,s*(b[2]+.25),0,0,Math.PI/2)});   // retrovisores
 {const e=pt(-3.05,0);CH.geo(new THREE.SphereGeometry(1,14,8).scale(.06,.03,.06),cro,e[0],e[1],0)}
 NG.box(5.2,.3,1.8,0x1a1a1a,-.05,.55,0);
 G.add(CH.mesh(new THREE.MeshStandardMaterial({roughness:.18,metalness:.5})),NG.mesh(new THREE.MeshStandardMaterial({roughness:.9})),
  LZ.mesh(new THREE.MeshStandardMaterial({roughness:.2,emissive:0x4a4430})),RJ.mesh(new THREE.MeshStandardMaterial({roughness:.25,emissive:0x3a0000})));
 return G}
window.VOCHO={hazlo,pt};
})();
