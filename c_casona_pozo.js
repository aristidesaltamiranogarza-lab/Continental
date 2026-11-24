// c_casona_pozo.js — POZO: el pozo del traspatio baja de verdad (tiro de cantera que se oscurece, agua al fondo) y lleva
// remate, zócalo, garrucha, cuerda y cubeta. Mientras pb.glb no traiga 'pb_pozo' (casona_pb.py pozo(), sale al hornear),
// lo arma aquí sobre el brocal viejo y le hace su hoyo al pasto (PASTO.hoyo). CMAT.aplicar llama POZO.pon(root,MAT).
// Con el pozo horneado solo ordena el tiro y el agua (hondo).
(function(){
if(typeof THREE==='undefined')return;
const P={x:14-18,z:17-44.6,r:.62,fondo:3,agua:1.5};   // coordenadas de root (three): plano (14, 44.6)
const SOL=new THREE.Vector3(.45,.8,.35).normalize();

// color por vértice: luz falsa (sol + cielo) y, en el tiro, oscuridad que crece con la hondura
function sombrea(g,base,tiro){g.computeVertexNormals();const n=g.attributes.normal,p=g.attributes.position,C=[],c=new THREE.Color(base),v=new THREE.Vector3();
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(n,i);let k=.62+.38*Math.max(0,v.dot(SOL))+.08*v.y;
  if(tiro){const y=p.getY(i);k=(.46+.14*Math.max(0,-v.x))*(.03+.97*Math.pow(Math.max(0,(y+P.agua+.1)/(P.agua+1.05)),2))}
  C.push(c.r*k,c.g*k,c.b*k)}
 g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));return g}
function anillo(r0,r1,y0,y1,n){const s=new THREE.Shape();s.absarc(0,0,r1,0,Math.PI*2,false);const h=new THREE.Path();h.absarc(0,0,r0,0,Math.PI*2,true);s.holes.push(h);
 const g=new THREE.ExtrudeGeometry(s,{depth:y1-y0,bevelEnabled:false,curveSegments:n});g.rotateX(-Math.PI/2);g.translate(0,y0,0);return g}
function uvm(g,esc){const p=g.attributes.position,u=[];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);u.push((Math.atan2(z,x)*.9+x*.1)/esc,(y+z*.3)/esc)}
 g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));return g}
function tubo(a,b,r0,r1,n){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),g=new THREE.CylinderGeometry(r1,r0,d.length(),n||8);
 g.translate(0,d.length()/2,0);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));g.translate(A.x,A.y,A.z);return g}
function caja(x0,x1,y0,y1,z0,z1){const g=new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0);g.translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);return g}
function junta(gs){const M=THREE.BufferGeometryUtils||window.BufferGeometryUtils;if(M&&M.mergeGeometries)return M.mergeGeometries(gs.map(g=>g.index?g.toNonIndexed():g));
 let n=0;gs=gs.map(g=>g.index?g.toNonIndexed():g);gs.forEach(g=>n+=g.attributes.position.count);const out=new THREE.BufferGeometry();
 for(const k of ['position','normal','color','uv']){if(!gs.every(g=>g.attributes[k]))continue;const it=gs[0].attributes[k].itemSize,a=new Float32Array(n*it);let o=0;gs.forEach(g=>{a.set(g.attributes[k].array,o);o+=g.attributes[k].array.length});out.setAttribute(k,new THREE.BufferAttribute(a,it))}
 return out}

// el exterior (CIELO.fondo) se dibuja antes con su suelo en y=0: el tiro va primero y pasa siempre la profundidad (escribiéndola), el agua
// después; todo lo de la casa que esté delante (brocal, pasto con su hoyo) lo vuelve a tapar
function hondo(tiro,agua,propio){if(tiro){if(!propio){const m0=tiro.material,m=m0.clone();m.onBeforeCompile=m0.onBeforeCompile;m.customProgramCacheKey=m0.customProgramCacheKey;
  if(window.CMAT&&CMAT.noc)CMAT.noc(m,false);tiro.material=m}tiro.renderOrder=-10;tiro.material.depthFunc=THREE.AlwaysDepth}if(agua)agua.renderOrder=-9}
function pon(root,MAT){if(!root||!root.getObjectByName('pb_traspatio')&&!root.getObjectByName('pb_pozo'))return;
 if(root.getObjectByName('pb_pozo')){hondo(root.getObjectByName('pb_pozo_tiro'),root.getObjectByName('pb_pozo_agua'));return}
 const ca=MAT&&(MAT['cantera+']||MAT.cantera),ma=MAT&&(MAT['madera+']||MAT.madera),mapa=ca&&ca.map,G=new THREE.Group();G.name='pozo_codigo';G.position.set(P.x,0,P.z);
 const mat=(o)=>{const m=new THREE.MeshBasicMaterial(Object.assign({vertexColors:true},o));if(window.CMAT&&CMAT.noc)CMAT.noc(m,true);return m};
 // tiro: por dentro (BackSide), forra también el brocal viejo (horneado claro) desde el remate, y se oscurece al bajar
 const ti=uvm(new THREE.CylinderGeometry(P.r-.005,P.r-.005,P.fondo+.95,28,16,true),1.2);ti.translate(0,.95-(P.fondo+.95)/2,0);sombrea(ti,0xffffff,1);
 const mt=mat({map:mapa||null,color:mapa?0xd9ccb4:0x9d8c72,side:THREE.BackSide});const tm=new THREE.Mesh(ti,mt);G.add(tm);
 // agua: oscura, con un brillo que se mece
 const U={uT:{value:0}},ag=new THREE.MeshBasicMaterial({color:0x1c3536});
 ag.onBeforeCompile=s=>{s.uniforms.uT=U.uT;s.vertexShader='varying vec2 vQ;\n'+s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvQ=position.xz;');
  s.fragmentShader='uniform float uT;varying vec2 vQ;\n'+s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n'+
   '{float d=length(vQ),w=sin(d*22.-uT*1.6)*.5+.5;diffuseColor.rgb+=vec3(.05,.09,.09)*w*(1.-d/'+P.r.toFixed(2)+')+vec3(.1,.14,.13)*smoothstep(.12,.0,length(vQ-vec2(.16,-.12)));}')};
 ag.customProgramCacheKey=()=>'pozo-agua';if(window.CMAT&&CMAT.noc)CMAT.noc(ag,true);
 const aw=new THREE.CircleGeometry(P.r+.01,28);aw.rotateX(-Math.PI/2);aw.translate(0,-P.agua,0);const am=new THREE.Mesh(aw,ag);
 hondo(tm,am,1);am.onBeforeRender=()=>{U.uT.value=performance.now()/1000;root.updateMatrixWorld();const w=new THREE.Vector3(P.x,0,P.z).applyMatrix4(root.matrixWorld);if(window.PASTO&&PASTO.hoyo)PASTO.hoyo(P.x,P.z,P.r+.06,w.x,w.z)};G.add(am);
 // remate que sobresale, zócalo y una franja de juntas: cantera
 const pie=[sombrea(uvm(anillo(.56,.97,.95,1.04,32),1.2),0xf4ecdc),sombrea(uvm(anillo(.6,.99,1.04,1.07,32),1.2),0xffffff),
  sombrea(uvm(anillo(.86,.99,0,.14,32),1.2),0xd8ccb8),sombrea(uvm(anillo(.895,.915,.46,.49,32),1.2),0xb9ab94)];
 G.add(new THREE.Mesh(junta(pie),mat({map:mapa||null,color:mapa?0xffffff:0xcdbb9c})));
 // garrucha bajo el travesaño (x 13.05..14.95, y 2.5): rueda de madera con herraje, cuerda a la cubeta y amarre al poste
 const zc=0,md=[],hi=[],cu=[];
 md.push(tubo([0,2.2,zc-.05],[0,2.2,zc+.05],.2,.2,18),tubo([0,2.2,zc-.07],[0,2.2,zc+.07],.08,.08,10));
 hi.push(caja(-.03,.03,2.2,2.5,zc-.09,zc-.07),caja(-.03,.03,2.2,2.5,zc+.07,zc+.09),tubo([0,2.2,zc-.1],[0,2.2,zc+.1],.025,.025,8));
 cu.push(tubo([.19,2.2,zc],[.19,1.57,zc],.016,.016,6),tubo([-.19,2.2,zc],[-.86,1.35,zc],.016,.016,6),
  tubo([-.86,1.35,zc-.08],[-.86,1.35,zc+.08],.03,.03,8));
 // cubeta colgada sobre la boca: madera con dos aros de hierro y asa
 const cb=tubo([.19,.98+.12,zc],[.19,1.4,zc],.13,.17,14);md.push(cb);
 hi.push(...[1.16,1.34].map(y=>sombrea(anillo(.142+(y-1.1)*.13,.175+(y-1.1)*.13,y,y+.03,14),0x2a2420)).map(g=>{g.translate(.19,0,zc);return g}));
 const asa=new THREE.TorusGeometry(.17,.012,6,14,Math.PI);asa.translate(.19,1.4,zc);hi.push(asa);
 G.add(new THREE.Mesh(junta(md.map(g=>sombrea(uvm(g,.8),0xffffff))),mat({map:ma&&ma.map||null,color:ma&&ma.map?0xffffff:0x6b4a32})));
 G.add(new THREE.Mesh(junta(hi.map(g=>g.attributes.color?g:sombrea(g,0x2a2420))),mat({})));
 G.add(new THREE.Mesh(junta(cu.map(g=>sombrea(g,0xb39364))),mat({})));
 G.traverse(o=>{if(o.isMesh){o.matrixAutoUpdate=false;o.updateMatrix()}});G.updateMatrix();G.matrixAutoUpdate=false;
 root.add(G);root.updateMatrixWorld(true);const w=new THREE.Vector3(P.x,0,P.z).applyMatrix4(root.matrixWorld);if(window.PASTO&&PASTO.hoyo)PASTO.hoyo(P.x,P.z,P.r+.06,w.x,w.z)}

window.POZO={P,pon};
})();
