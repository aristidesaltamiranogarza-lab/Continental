// c_casona_mat.js — CMAT: materiales de los niveles horneados de la casona (blender/casona_pb.py → pb.glb + pb_luz.jpg, planta baja;
// blender/casona_pa.py → pa.glb + pa_luz.jpg, planta alta).
// Cada material del GLB se vuelve MeshBasicMaterial con una textura de canvas que se repite (UV0 en metros) por la luz horneada (UV1):
// nada de luces en tiempo real para el cascarón. Los colores base son los de Blender pasados a sRGB, para que se vea como el horneado.
// CMAT.aplicar(root,urlDeLaLuz) arma los materiales; CMAT.copas(root) junta las copas de los árboles y CMAT.paso(C,yo) las desvanece
// cuando el personaje queda debajo. Ajuste: CMAT.A.luz (intensidad de la luz horneada).
(function(){
if(typeof THREE==='undefined')return;
const A={luz:1,copa:.28};
let TX=null;

function texturas(ctex){if(TX)return TX;
 const rnd=(s=>()=>(s=(s*9301+49297)%233280)/233280)(11);
 const T=(k,w,h,f,rx,ry)=>{const t=ctex('cmat-'+k,w,h,f,1);t.repeat.set(rx||1,ry||rx||1);return t};
 const ruido=(base,a,b,n,r0,r1)=>(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<n;i++){g.fillStyle=i%2?a:b;g.beginPath();g.ellipse(rnd()*w,rnd()*h,r0+rnd()*r1,r0*.7+rnd()*r1*.7,rnd()*3,0,7);g.fill()}};
 // pasta: roseta de la casa, tranquila; en el corredor la misma idea en ocre
 const roseta=(a,b,c,d)=>(g,w,h)=>{const s=w/2;for(let j=0;j<2;j++)for(let i=0;i<2;i++){const x=i*s,y=j*s;g.save();g.beginPath();g.rect(x,y,s,s);g.clip();
  g.fillStyle=a;g.fillRect(x,y,s,s);[[0,0],[s,0],[0,s],[s,s]].forEach(([u,v])=>{g.fillStyle=b;g.beginPath();g.arc(x+u,y+v,s*.38,0,7);g.fill();g.fillStyle=c;g.beginPath();g.arc(x+u,y+v,s*.15,0,7);g.fill()});
  g.fillStyle=d;g.beginPath();g.moveTo(x+s/2,y+s*.33);g.lineTo(x+s*.67,y+s/2);g.lineTo(x+s/2,y+s*.67);g.lineTo(x+s*.33,y+s/2);g.closePath();g.fill();
  g.strokeStyle='rgba(60,40,20,.12)';g.lineWidth=2;g.strokeRect(x+1,y+1,s-2,s-2);g.restore()}};
 const cenefa=(g,w,h)=>{g.fillStyle='#b98c78';g.fillRect(0,0,w,h);g.fillStyle='#ece2cf';g.beginPath();g.moveTo(w/2,8);g.lineTo(w-8,h/2);g.lineTo(w/2,h-8);g.lineTo(8,h/2);g.closePath();g.fill();
  g.fillStyle='#7e9c84';g.beginPath();g.moveTo(w/2,h*.3);g.lineTo(w*.7,h/2);g.lineTo(w/2,h*.7);g.lineTo(w*.3,h/2);g.closePath();g.fill();g.strokeStyle='rgba(40,20,10,.2)';g.lineWidth=2;g.strokeRect(1,1,w-2,h-2)};
 const mosaico=(g,w,h)=>{const n=4,s=w/n;for(let j=0;j<n;j++)for(let i=0;i<n;i++){g.fillStyle=(i+j)%2?'#c9a28a':'#ece2d4';g.fillRect(i*s,j*s,s,s)}
  g.strokeStyle='rgba(60,40,20,.12)';g.lineWidth=1.5;for(let i=0;i<=n;i++){g.beginPath();g.moveTo(i*s,0);g.lineTo(i*s,h);g.moveTo(0,i*s);g.lineTo(w,i*s);g.stroke()}};
 const laja=(g,w,h)=>{g.fillStyle='#bdb7ab';g.fillRect(0,0,w,h);const c=['#d6d1c6','#cfc9bd','#dcd7cc','#c9c3b6','#d3cdc0'];
  for(let j=0;j<4;j++){let x=-rnd()*30;const y=j*h/4;while(x<w){const lw=40+rnd()*50;g.fillStyle=c[(rnd()*c.length)|0];g.beginPath();g.moveTo(x+3,y+3);g.lineTo(x+lw-3,y+3+rnd()*3);g.lineTo(x+lw-3,y+h/4-3);g.lineTo(x+3,y+h/4-3-rnd()*3);g.closePath();g.fill();x+=lw}}};
 const cuarto=(g,w,h)=>{g.fillStyle='#e7e3da';g.fillRect(0,0,w,h);g.strokeStyle='rgba(80,60,40,.14)';g.lineWidth=2;g.strokeRect(1,1,w/2-2,h/2-2);g.strokeRect(w/2+1,1,w/2-2,h/2-2);g.strokeRect(1,h/2+1,w/2-2,h/2-2);g.strokeRect(w/2+1,h/2+1,w/2-2,h/2-2)};
 const persiana=(g,w,h)=>{g.fillStyle='#4f7d66';g.fillRect(0,0,w,h);g.fillStyle='#3a614f';g.fillRect(0,h*.6,w,h*.4);g.fillStyle='#6f9c84';g.fillRect(0,0,w,h*.14)};
 const madera=(base,veta)=>(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);g.strokeStyle=veta;for(let i=0;i<26;i++){g.lineWidth=1+rnd()*2;g.beginPath();const x=rnd()*w;g.moveTo(x,0);g.bezierCurveTo(x+rnd()*8-4,h*.3,x+rnd()*8-4,h*.7,x+rnd()*6-3,h);g.stroke()}};
 const bejuco=(g,w,h)=>{g.fillStyle='#e1cba6';g.fillRect(0,0,w,h);g.strokeStyle='rgba(120,90,50,.35)';g.lineWidth=2;for(let i=-w;i<w*2;i+=8){g.beginPath();g.moveTo(i,0);g.lineTo(i+h,h);g.moveTo(i+h,0);g.lineTo(i,h);g.stroke()}};
 const porton=(g,w,h)=>{madera('#997c61','rgba(60,35,20,.25)')(g,w,h);g.fillStyle='rgba(50,30,15,.35)';for(let i=1;i<4;i++)g.fillRect(i*w/4-1,0,2,h)};
 const tapete=(g,w,h)=>{const c=w/2,R=w/2;g.fillStyle='#e8dcc4';g.fillRect(0,0,w,h);const ring=(r,col)=>{g.fillStyle=col;g.beginPath();g.arc(c,c,r*R,0,7);g.fill()};
  ring(1,'#d8b464');ring(.95,'#9a463a');ring(.86,'#d8b464');ring(.84,'#a8503f');
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2;g.fillStyle='#e6c88e';g.beginPath();g.arc(c+Math.cos(a)*R*.72,c+Math.sin(a)*R*.72,R*.035,0,7);g.fill()}
  ring(.5,'#9a463a');ring(.47,'#b05a47');ring(.18,'#d8b464');ring(.15,'#9a463a')};
 const hamaca=(g,w,h)=>{const c=['#d9534a','#f0b84a','#4f9d6e','#4a7fc0','#e8dcc4','#c04a7a'];const n=24;for(let i=0;i<n;i++){g.fillStyle=c[i%c.length];g.fillRect(i*w/n,0,w/n+1,h)}
  g.fillStyle='rgba(255,255,255,.12)';for(let y=0;y<h;y+=4)g.fillRect(0,y,w,1)};
 // duela: tablas de madera a lo largo, juntas desfasadas; libros: lomos de colores en filas de 0.4 (como los libreros de casona_pa.py)
 const duela=(g,w,h)=>{const n=6,s=h/n;for(let j=0;j<n;j++){g.fillStyle=['#a7805f','#9c7656','#b08a68','#a27b5a'][j%4];g.fillRect(0,j*s,w,s);g.strokeStyle='rgba(70,40,20,.18)';
  for(let i=0;i<5;i++){g.lineWidth=1;g.beginPath();const y=j*s+rnd()*s;g.moveTo(0,y);g.bezierCurveTo(w*.3,y+rnd()*4-2,w*.7,y+rnd()*4-2,w,y);g.stroke()}
  g.fillStyle='rgba(50,28,12,.35)';g.fillRect(0,j*s,w,1.5);g.fillRect(((j*.37)%1)*w,j*s,2,s)}};
 const libros=(g,w,h)=>{g.fillStyle='#3a2416';g.fillRect(0,0,w,h);const c=['#8a3b2e','#2f5d4a','#b88a3a','#3d4f7a','#6e2f3f','#c9b48a','#4f6b3a','#7a4a2a'];let x=0;
  while(x<w){const lw=6+rnd()*9,lh=h*(.62+rnd()*.3);g.fillStyle=c[(rnd()*c.length)|0];g.fillRect(x,h-lh,lw-1,lh);g.fillStyle='rgba(255,240,210,.25)';g.fillRect(x,h-lh+lh*.15,lw-1,2);x+=lw}};
 // cal: pintura de cal, grano fino y nubes claras/oscuras muy tenues que se repiten sin costura (azar propio: no mueve las demás)
 const cal=(g,w,h)=>{const r2=(s=>()=>(s=(s*9301+49297)%233280)/233280)(7);g.fillStyle='#ddb395';g.fillRect(0,0,w,h);
  for(let i=0;i<46;i++){const x=r2()*w,y=r2()*h,r=40+r2()*90,cl=i%2?'255,244,228':'150,95,60',a=i%2?.07:.045;
   for(const dx of [-w,0,w])for(const dy of [-h,0,h]){const X=x+dx,Y=y+dy;if(X+r<0||X-r>w||Y+r<0||Y-r>h)continue;
    const gr=g.createRadialGradient(X,Y,0,X,Y,r);gr.addColorStop(0,`rgba(${cl},${a})`);gr.addColorStop(1,`rgba(${cl},0)`);g.fillStyle=gr;g.fillRect(X-r,Y-r,2*r,2*r)}}
  for(let i=0;i<3600;i++){g.fillStyle=i%2?'rgba(255,240,220,.05)':'rgba(120,70,40,.04)';g.fillRect(r2()*w,r2()*h,1+r2()*1.5,1+r2()*1.5)}};
 const copa=ruido('#86aa76','rgba(60,95,50,.35)','rgba(190,220,160,.25)',140,4,10);
 TX={
  muro:{map:T('muro',512,512,cal,1/4)},   // cal: grano fino y nubes muy suaves
  barda:{map:T('barda',256,256,ruido('#e4dac8','rgba(255,250,240,.1)','rgba(120,100,70,.08)',80,8,34),1/4)},
  cantera:{map:T('cantera',512,512,ruido('#e7dac4','rgba(120,95,60,.07)','rgba(255,248,232,.12)',1600,2,4),1/2)},   // 512: de cerca, la de 256 se veía pixeleada en arcos y marcos
  pasta:{map:T('pasta',256,256,roseta('#ece5d4','#bccab2','#d9ad94','#bccab2'),1/1.2)},
  corredor:{map:T('corredor',256,256,roseta('#e6d2bb','#d4b48f','#c98f6c','#d4b48f'),1/1.2)},
  cenefa:{map:T('cenefa',128,128,cenefa,1/.8)},mosaico:{map:T('mosaico',256,256,mosaico,1/1.6)},
  laja:{map:T('laja',256,256,laja,1/3)},cuarto:{map:T('cuarto',128,128,cuarto,1)},
  pasto:{map:T('pasto',128,128,ruido('#95b381','rgba(70,110,50,.3)','rgba(200,225,160,.25)',120,3,8),1/2)},
  calle:{map:T('calle',128,128,ruido('#a0a0a4','rgba(60,60,64,.18)','rgba(220,220,225,.15)',200,1,3),1/2)},
  banqueta:{map:T('banqueta',128,128,cuarto,1/1.5)},
  persiana:{map:T('persiana',16,16,persiana,1,1/.11)},
  madera:{map:T('madera',128,128,madera('#957659','rgba(60,35,20,.3)'),1)},bejuco:{map:T('bejuco',64,64,bejuco,1/.35)},
  porton:{map:T('porton',128,128,porton,1/1.4)},tapete:{map:T('tapete',512,512,tapete,1)},hamaca:{map:T('hamaca',256,16,hamaca,1/1.4,1)},
  copa:{map:T('copa',128,128,copa,1/1.5)},tronco:{map:T('tronco',64,64,madera('#a08976','rgba(70,50,35,.35)'),1/.8)},
  duela:{map:T('duela',256,256,duela,1/1.2)},libros:{map:T('libros',256,64,libros,1/1.6,1/.4)},
  lambrin:{color:0x618c79},rod:{color:0xede7d7},techo:{color:0xe7dfce},barro:{color:0xcb997c},escalon:{color:0xcea286}};
 return TX}

// materiales: con luz horneada (UV1) si la malla la trae; los que brillan y el hierro, sin ella
function aplicar(root,luzUrl){const H=window.CASA3D;if(!H||!H.ctex)return;const tx=texturas(H.ctex),MAT={};
 const LMT={value:new THREE.Vector2(2048,2048)},lm=new THREE.TextureLoader().load(luzUrl,t=>LMT.value.set(t.image.width,t.image.height));lm.flipY=false;lm.channel=1;lm.colorSpace=THREE.SRGBColorSpace;
 // de cerca (un texel de luz > 1 pixel) la luz va con B-spline bicúbica (4 lecturas bilineales): sin bloques ni escalones
 const cubica=r=>{r.extensions={derivatives:true};r.customProgramCacheKey=()=>'lmc';r.onBeforeCompile=s=>{s.uniforms.lmT=LMT;
  s.fragmentShader='uniform vec2 lmT;\nvec4 lmC(sampler2D t,vec2 uv){vec2 q=uv*lmT,d=max(abs(dFdx(q)),abs(dFdy(q)));if(max(d.x,d.y)>1.)return texture2D(t,uv);'+
   'q-=.5;vec2 i=floor(q),f=q-i,f2=f*f,f3=f2*f,w0=(1.-3.*f+3.*f2-f3)/6.,w1=(4.-6.*f2+3.*f3)/6.,w3=f3/6.,w2=1.-w0-w1-w3,g0=w0+w1,g1=w2+w3,'+
   'p0=(i+w1/g0-.5)/lmT,p1=(i+w3/g1+1.5)/lmT;return g0.y*(g0.x*texture2D(t,p0)+g1.x*texture2D(t,vec2(p1.x,p0.y)))+g1.y*(g0.x*texture2D(t,vec2(p0.x,p1.y))+g1.x*texture2D(t,p1));}\n'+
   s.fragmentShader.replace('texture2D( lightMap, vLightMapUv )','lmC( lightMap, vLightMapUv )')}};
 const material=(m,luz)=>{const n=(m&&m.name)||'x',k=n+(luz?'+':'');if(MAT[k])return MAT[k];let r;
  if(n==='arbotante')r=new THREE.MeshBasicMaterial({color:0xffe2b0,toneMapped:false});
  else if(n==='farol')r=new THREE.MeshBasicMaterial({color:0xffd08a,toneMapped:false});
  else if(n==='hierro')r=new THREE.MeshBasicMaterial({color:0x1d1814});
  else{const o=Object.assign({color:tx[n]?0xffffff:(m&&m.color?m.color.getHex():0xcccccc)},tx[n]||{});if(luz){o.lightMap=lm;o.lightMapIntensity=Math.PI*4*A.luz}r=new THREE.MeshBasicMaterial(o);if(luz)cubica(r)}
  if(n==='hamaca'||n==='persiana')r.side=THREE.DoubleSide;
  return MAT[k]=r};
 root.traverse(o=>{if(!o.isMesh)return;o.material=material(o.material,!!o.geometry.attributes.uv1);o.castShadow=o.receiveShadow=false;o.matrixAutoUpdate=false;o.updateMatrix()});
 return MAT}

// copas de los árboles: material propio para desvanecerlas sin tocar las demás mallas del mismo material
function copas(root){const out=[],b=new THREE.Box3();root.traverse(o=>{if(!o.isMesh||!/_copa$/.test(o.name))return;
 b.setFromObject(o);const m=o.material.clone();m.transparent=true;m.depthWrite=true;o.material=m;
 out.push({o,m,x:(b.min.x+b.max.x)/2,z:(b.min.z+b.max.z)/2,r:Math.max(b.max.x-b.min.x,b.max.z-b.min.z)/2+.6,y:b.min.y,v:1})});return out}
function paso(cs,yo,cam){if(!cs||!yo)return;cs.forEach(c=>{let d=Math.hypot(yo.x-c.x,yo.z-c.z)<c.r;
 if(!d&&cam){const dx=cam.position.x-yo.x,dz=cam.position.z-yo.z,dy=cam.position.y-1,t=dy>0?Math.max(0,(c.y-1)/dy):0;d=Math.hypot(yo.x+dx*t-c.x,yo.z+dz*t-c.z)<c.r-.4}
 const v=d?A.copa:1;if(Math.abs(c.v-v)<.01)return;c.v+=(v-c.v)*.18;if(Math.abs(c.v-v)<.02)c.v=v;c.m.opacity=c.v;c.m.depthWrite=c.v>.99})}

window.CMAT={A,aplicar,copas,paso};
})();
