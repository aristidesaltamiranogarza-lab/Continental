// c_casa_pb.js — CPB: la planta baja nueva (Bloque D, fase D3). c_casa3d.js la arma dentro de buildHouse().
// Del frente hacia atrás: zaguán (portón abierto, banca, perchero, farol y el plano 🧭) → salón con las mismas mesas, ahora con sus
// cuatro paredes y techo → comedor, cocina yucateca y baño de visitas (picar la cadena suena).
// Muros: planos de una cara con los arcos y puertas recortados (desde afuera no tapan a la cámara). Entre dos cuartos van dos caras,
// una por cuarto, y un marco que cubre el grueso del muro en cada vano. Si una cara queda entre la cámara y tu Mii, se esconde (corte tipo Sims).
// Techo plano en cada cuarto (desde arriba no se ve); las vigas solo cuando la cámara está debajo del techo.
// Choques: PB.WL = segmentos de muro [ax,az,bx,bz,r] que usan solve() (c_casa3d.js) y la ruta (c_casa_ruta.js).
(function(){
if(typeof THREE==='undefined')return;
const H=9,T=.3,V3=THREE.Vector3;
const CORTE=[],RG=[];let VIG=null,ESP=null,CAD=null,cadT=-1e9,AC=null;
const tv=new V3(),dv=new V3(),q=new V3();

function build(e){const {SC,OB,hits,std,box,cyl,ctex,PB}=e;
 const B=(w,h,d,m,x,y,z,p)=>box(w,h,d,m,x,y,z,p||SC),C=(a,b,h,m,x,y,z,p,n)=>cyl(a,b,h,m,x,y,z,p||SC,n);
 const grp=(x,z,ry,y)=>{const G=new THREE.Group();G.position.set(x,y||0,z);G.rotation.y=ry||0;SC.add(G);return G};
 const pm=(w,h)=>{const g=new THREE.PlaneGeometry(w,h),u=g.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,u.getX(i)*w,u.getY(i)*h);return g};   // UV en metros
 const tap=(o,f)=>o.traverse(m=>{if(m.isMesh){m.userData.hit={t:'fn',f};hits.push(m)}});
 const WL=[];VIG=new THREE.Group();SC.add(VIG);

 // ---------- texturas ----------
 const cal=(k,base,rep)=>{const t=ctex('cal-'+k,256,256,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);let s=k.charCodeAt(0)*97;const r=()=>(s=(s*9301+49297)%233280)/233280;
  for(let i=0;i<70;i++){g.fillStyle=i%2?'rgba(255,250,235,.07)':'rgba(70,40,20,.06)';g.beginPath();g.ellipse(r()*w,r()*h,8+r()*40,6+r()*26,r()*3,0,7);g.fill()}},1);t.repeat.set(1/(rep||4),1/(rep||4));return t};
 const tSal=ctex('wall-salon',256,256,(g,w,h)=>{g.fillStyle='#6d5a48';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=32){g.fillStyle='rgba(255,235,200,.06)';g.fillRect(x,0,14,h)}
  g.fillStyle='rgba(255,235,200,.08)';for(let y=16;y<h;y+=64)for(let x=16;x<w;x+=64){g.beginPath();g.arc(x+(y%128?32:0),y,5,0,7);g.fill()}},1);tSal.repeat.set(1/3,1/3);
 // mosaico de pasta: cuartos de roseta en las esquinas, cuatro mosaicos forman una flor
 const pasta=(k,a,b,c)=>{const t=ctex('pasta-'+k,256,256,(g,w,h)=>{const s=128;for(let j=0;j<2;j++)for(let i=0;i<2;i++){const x=i*s,y=j*s;g.save();g.beginPath();g.rect(x,y,s,s);g.clip();
   g.fillStyle=a;g.fillRect(x,y,s,s);[[0,0],[s,0],[0,s],[s,s]].forEach(([u,v])=>{g.fillStyle=b;g.beginPath();g.arc(x+u,y+v,s*.42,0,7);g.fill();g.fillStyle=c;g.beginPath();g.arc(x+u,y+v,s*.2,0,7);g.fill()});
   g.fillStyle=b;g.beginPath();g.moveTo(x+s/2,y+s*.3);g.lineTo(x+s*.7,y+s/2);g.lineTo(x+s/2,y+s*.7);g.lineTo(x+s*.3,y+s/2);g.closePath();g.fill();
   g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=2;g.strokeRect(x+1,y+1,s-2,s-2);g.restore()}},1);t.repeat.set(1/1.2,1/1.2);return t};
 const tal=ctex('talavera',128,128,(g,w,h)=>{const s=64;for(let j=0;j<2;j++)for(let i=0;i<2;i++){const x=i*s,y=j*s;g.fillStyle='#f4efe2';g.fillRect(x,y,s,s);g.fillStyle='#1f4f9a';
   for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4;g.beginPath();g.ellipse(x+s/2+Math.cos(a)*s*.3,y+s/2+Math.sin(a)*s*.3,s*.12,s*.06,a,0,7);g.fill()}
   g.beginPath();g.arc(x+s/2,y+s/2,s*.18,0,7);g.fill();g.fillStyle='#e0a030';g.beginPath();g.arc(x+s/2,y+s/2,s*.08,0,7);g.fill();
   g.strokeStyle='rgba(60,60,60,.3)';g.lineWidth=2;g.strokeRect(x+1,y+1,s-2,s-2)}},1);tal.repeat.set(1/.8,1/.8);
 const az=ctex('azulejo-ban',128,128,(g,w,h)=>{g.fillStyle='#c9d3d8';g.fillRect(0,0,w,h);g.fillStyle='#f7f7f2';for(let y=0;y<2;y++)for(let x=0;x<2;x++)g.fillRect(x*64+2,y*64+2,60,60)},1);az.repeat.set(1/.7,1/.7);
 const tab=ctex('tablero-ban',128,128,(g,w,h)=>{for(let y=0;y<4;y++)for(let x=0;x<4;x++){g.fillStyle=(x+y)%2?'#f2f0ea':'#2d5f8a';g.fillRect(x*32,y*32,32,32)}},1);tab.repeat.set(1/1.6,1/1.6);

 // ---------- materiales por cuarto: muro, lambrín (alto) y moldura ----------
 const MS={sal:{m:std(0xffffff,.9,{map:tSal}),lam:std(0x3e2a1c,.55),lamH:2.4,rod:std(0x2e1f14,.5)},
  zag:{m:std(0xffffff,.92,{map:cal('zag','#cf8a78')}),lam:std(0x8a8077,.9),lamH:1.6,rod:std(0x6e665e,.8)},
  com:{m:std(0xffffff,.92,{map:cal('com','#d8a85a')}),lam:std(0x5a3418,.55),lamH:2.2,rod:std(0x3a2212,.5)},
  coc:{m:std(0xffffff,.92,{map:cal('coc','#eee5d0')}),lam:std(0x2f6b5a,.6),lamH:1.8,rod:std(0x1f4a3e,.5)},
  ban:{m:std(0xffffff,.92,{map:cal('ban','#8fb6d6')}),lam:std(0xffffff,.35,{map:az}),lamH:2.6,rod:std(0x1f4f9a,.4)}};
 const MARCO=std(0xefe6d2,.85),CAP=std(0xd9ccb2,.9),TECHO=std(0xe9dcc4,.95),VIGA=std(0x4a2c18,.6);

 // cara de muro de a a b ([x,z]) que mira hacia n; huecos [{at,w,h,arco}] (at: coordenada del centro sobre el eje del muro)
 function cara(a,b,n,hu,M){let A=new V3(a[0],0,a[1]),Bv=new V3(b[0],0,b[1]);const d=Bv.clone().sub(A),L=d.length();d.normalize();
  if(-d.z*n[0]+d.x*n[1]<0){[A,Bv]=[Bv,A];d.negate()}
  const ax=Math.abs(d.x)>.5?'x':'z',hs=(hu||[]).map(h=>Object.assign({c:(h.at-A[ax])*d[ax]},h)).filter(h=>h.c-h.w/2>-.01&&h.c+h.w/2<L+.01).sort((p,r)=>p.c-r.c);
  const s=new THREE.Shape();s.moveTo(0,0);
  hs.forEach(h=>{const l=h.c-h.w/2,r=h.c+h.w/2,tp=h.arco?h.h-h.w/2:h.h;s.lineTo(l,0);s.lineTo(l,tp);if(h.arco)s.absarc(h.c,tp,h.w/2,Math.PI,0,true);else s.lineTo(r,tp);s.lineTo(r,0)});
  s.lineTo(L,0);s.lineTo(L,H);s.lineTo(0,H);s.closePath();
  const g=grp(A.x,A.z,Math.atan2(-d.z,d.x)),pl=new THREE.Mesh(new THREE.ShapeGeometry(s,20),M.m);pl.receiveShadow=true;g.add(pl);
  let u=0;const tramo=(u0,u1)=>{if(u1-u0<.05)return;const w=u1-u0,l=new THREE.Mesh(pm(w,M.lamH),M.lam);l.position.set((u0+u1)/2,M.lamH/2,.02);l.receiveShadow=true;g.add(l);
   const r=new THREE.Mesh(new THREE.PlaneGeometry(w,.12),M.rod);r.position.set((u0+u1)/2,M.lamH+.06,.035);g.add(r)};
  hs.forEach(h=>{tramo(u,h.c-h.w/2);u=h.c+h.w/2});tramo(u,L);
  const w={g,p:A.clone(),d:d.clone(),L,n:new V3(-d.z,0,d.x),hs,hid:false};CORTE.push(w);return w}
 // segmentos de choque sobre una línea (sin los vanos)
 function segs(eje,en,lo,hi,hu,r){let u=lo;const add=(u0,u1)=>{if(u1-u0<.01)return;WL.push(eje==='x'?[u0,en,u1,en,r]:[en,u0,en,u1,r])};
  (hu||[]).slice().sort((x,y)=>x.at-y.at).forEach(h=>{add(u,h.at-h.w/2);u=h.at+h.w/2});add(u,hi)}
 const cap=(eje,en,lo,hi)=>{const c=eje==='x'?B(hi-lo+T,.06,T,CAP,(lo+hi)/2,H+.03,en):B(T,.06,hi-lo+T,CAP,en,H+.03,(lo+hi)/2);c.castShadow=false};
 const pt=(eje,en,u)=>eje==='x'?[u,en]:[en,u],nv=(eje,s)=>eje==='x'?[0,s]:[s,0];
 // muro de afuera: una cara en la línea "en", mirando hacia el lado s (+1/-1)
 function ext(eje,en,s,lo,hi,M,hu){cara(pt(eje,en,lo),pt(eje,en,hi),nv(eje,s),hu,M);segs(eje,en,lo,hi,hu,.45);cap(eje,en-s*T/2,lo,hi)}
 // muro entre cuartos: caras A (lado s) y B (lado -s), cada una puede ir en tramos con su material; marco en cada vano
 function tabique(eje,en,s,A,Bs,hu){const fa=A.map(([lo,hi,M])=>cara(pt(eje,en+s*T/2,lo),pt(eje,en+s*T/2,hi),nv(eje,s),hu,M)),
   fb=Bs.map(([lo,hi,M])=>cara(pt(eje,en-s*T/2,lo),pt(eje,en-s*T/2,hi),nv(eje,-s),hu,M));
  const all=A.concat(Bs),lo=Math.min(...all.map(x=>x[0])),hi=Math.max(...all.map(x=>x[1]));segs(eje,en,lo,hi,hu,.45+T/2);cap(eje,en,lo,hi);
  (hu||[]).forEach(h=>{const ia=fa.find(f=>f.hs.some(x=>x.at===h.at)),ib=fb.find(f=>f.hs.some(x=>x.at===h.at));if(!ia)return;const hh=ia.hs.find(x=>x.at===h.at);
   const m=.1,l=hh.c-h.w/2,r=hh.c+h.w/2,tp=h.arco?h.h-h.w/2:h.h,sh=new THREE.Shape();
   sh.moveTo(l-m,0);sh.lineTo(l-m,tp);if(h.arco)sh.absarc(hh.c,tp,h.w/2+m,Math.PI,0,true);else{sh.lineTo(l-m,tp+m);sh.lineTo(r+m,tp+m)}sh.lineTo(r+m,0);sh.lineTo(r,0);sh.lineTo(r,tp);
   if(h.arco)sh.absarc(hh.c,tp,h.w/2,0,Math.PI,false);else sh.lineTo(l,tp);sh.lineTo(l,0);sh.closePath();
   const ge=new THREE.ExtrudeGeometry(sh,{depth:T+.1,bevelEnabled:false,curveSegments:20});ge.translate(0,0,-T-.05);   // sale más que el lambrín (.02) y su moldura (.035): sin parpadeo
   const G=grp(ia.p.x,ia.p.z,ia.g.rotation.y);G.add(new THREE.Mesh(ge,MARCO));RG.push({g:G,a:CORTE.indexOf(ia),b:CORTE.indexOf(ib)})});return {fa,fb}}
 function techo(x0,x1,z0,z1,vx){const c=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),TECHO);c.rotation.x=Math.PI/2;c.position.set((x0+x1)/2,H,(z0+z1)/2);SC.add(c);
  // vigas a lo largo de x (vx) o de z
  if(vx)for(let z=z0+1.2;z<z1-.6;z+=2.4)B(x1-x0,.42,.32,VIGA,(x0+x1)/2,H-.21,z,VIG).castShadow=false;
  else for(let x=x0+1.25;x<x1-.6;x+=2.5)B(.32,.42,z1-z0,VIGA,x,H-.21,(z0+z1)/2,VIG).castShadow=false}
 function suelo(x0,x1,z0,z1,map){const f=new THREE.Mesh(pm(x1-x0,z1-z0),std(0xffffff,.6,{map}));f.rotation.x=-Math.PI/2;f.position.set((x0+x1)/2,0,(z0+z1)/2);f.receiveShadow=true;SC.add(f)}

 // ---------- planta: salón x[-17,17] z[-15,11] · zaguán x[-4.5,4.5] z[11.3,19] · atrás z[-25,-15.3]: comedor x[-17,-1.15], cocina x[-.85,12] (+ rincón del refri), baño x[12.3,17] z[-25,-19.65] ----------
 const S=MS.sal,Z=MS.zag,CO=MS.com,K=MS.coc,BA=MS.ban;
 ext('z',-17,1,-15,11,S);ext('z',17,-1,-15,11,S);
 tabique('x',-15.15,1,[[-17,17,S]],[[-17,-1,CO],[-1,17,K]],[{at:-9.5,w:4,h:5.8,arco:1},{at:6,w:2.2,h:3.6}]);
 tabique('x',11.15,-1,[[-17,17,S]],[[-4.5,4.5,Z]],[{at:0,w:4.2,h:6.4,arco:1}]);
 ext('z',-4.5,1,11.3,19,Z);ext('z',4.5,-1,11.3,19,Z);if(!window.CCALLE)ext('x',19,-1,-4.5,4.5,Z);   // con la calle, el muro del frente (y su fachada) lo pone c_casa_calle.js
 ext('z',-17,1,-25,-15.3,CO);if(!window.CPAT){ext('x',-25,1,-17,-1.15,CO);ext('x',-25,1,-.85,12,K);ext('x',-25,1,12.3,17,BA)}ext('z',17,-1,-25,-19.65,BA);ext('z',17,-1,-19.35,-15.3,K);
 tabique('z',-1,-1,[[-25,-15.3,CO]],[[-25,-15.3,K]],[{at:-19.5,w:2.2,h:3.6}]);
 tabique('z',12.15,-1,[[-25,-19.5,K]],[[-25,-19.65,BA]]);
 tabique('x',-19.5,1,[[12,17,K]],[[12.3,17,BA]],[{at:14.6,w:2,h:3.6}]);
 techo(-17,17,-15,11);techo(-4.5,4.5,11.3,19,1);techo(-17,-1.15,-25,-15.3);techo(-.85,12,-25,-15.3);techo(12,17,-19.35,-15.3,1);techo(12.3,17,-25,-19.65,1);
 // (los pisos llegan hasta la mitad de cada muro: desde arriba no queda hueco entre las dos caras)
 suelo(-4.5,4.5,11,19,pasta('zag','#e8dcc4','#b5473a','#2f6b4a'));suelo(-17,-1,-25,-15,pasta('com','#efe3c8','#c48a2a','#1f4f6a'));
 const pk=pasta('coc','#e9e2d0','#2f6b5a','#b5473a');suelo(-17,17,-15,11,pk);   // salón con el mismo piso de pasta que la cocina
 suelo(-1,12.15,-25,-15,pk);suelo(12.15,17,-19.5,-15,pk);suelo(12.15,17,-25,-19.5,tab);
 // umbrales bajo cada vano entre cuartos (tapan la junta de los pisos)
 const um=std(0x8a8077,.85);[[-9.5,-15.15,4,T+.1],[6,-15.15,2.2,T+.1],[0,11.15,4.2,T+.1],[14.6,-19.5,2,T+.1]].forEach(([x,z,w,d])=>B(w,.02,d,um,x,.01,z).castShadow=false);B(T+.1,.02,2.2,um,-1,.01,-19.5).castShadow=false;

 // ---------- ventanas al exterior (c_casa_ventanas.js) y el portón ----------
 if(window.VENT){VENT.pon(SC,'pb',{x:-9,y:4.4,z:-25,ry:0,w:3,h:3.4,cal:MARCO});VENT.pon(SC,'pb',{x:4.6,y:4.7,z:-25,ry:0,w:2.8,h:2.2,cal:MARCO});
  VENT.pon(SC,'pb',{x:15.6,y:6.2,z:-25,ry:0,w:1.2,h:1.1,postigos:false,sol:false,cal:MARCO});
  if(!window.CCALLE)VENT.pon(SC,'pb',{x:0,y:2.7,z:19,ry:Math.PI,w:3.6,h:5.4,hondo:.3,abierta:true,sol:false,cal:std(0x8a8077,.85)})}
 const mad=std(0x5a3418,.55),madO=std(0x3a2212,.5),hie=std(0x1c1c1e,.45,{metalness:.6}),lat=std(0xc9a24a,.35,{metalness:.7}),loza=std(0xf7f7f2,.18);
 // hojas del portón, abiertas contra el muro del frente
 [-1,1].forEach(s=>{const G=grp(s*1.8,18.85,s>0?-Math.PI*.93:Math.PI*.93);B(1.78,5.3,.12,std(0x4a2814,.5),-s*.89,2.65,0,G);
  for(let y=.7;y<5;y+=1.15)B(1.4,.9,.04,std(0x3a2010,.55),-s*.89,y,.07,G);C(.06,.06,.08,lat,-s*1.55,2.4,.12,G,10)});

 // ---------- zaguán: banca, perchero con sombrero, farol y el plano ----------
 {const G=grp(-3.85,15.4,Math.PI/2);B(3,.12,.8,mad,0,.85,0,G);B(3,.9,.1,mad,0,1.45,-.38,G);[-1.35,1.35].forEach(x=>B(.1,.85,.7,madO,x,.42,0,G));OB.push({x:-3.85,z:14.4,r:.6},{x:-3.85,z:15.4,r:.6},{x:-3.85,z:16.4,r:.6})}
 {const G=grp(3.7,14.6,0);C(.06,.08,3.2,madO,0,1.6,0,G,8);C(.45,.5,.1,madO,0,.05,0,G,16);for(let i=0;i<4;i++){const a=i/4*Math.PI*2,k=B(.05,.05,.4,madO,Math.cos(a)*.16,2.95,Math.sin(a)*.16,G);k.rotation.y=-a;k.rotation.x=-.5}
  const paja=std(0xe8d7a8,.9);C(.24,.27,.24,paja,.22,2.95,.05,G,16);C(.5,.5,.03,paja,.22,2.84,.05,G,24);C(.25,.25,.05,std(0x2a2a2a,.6),.22,2.88,.05,G,16);OB.push({x:3.7,z:14.6,r:.5})}
 {const y=6.2;C(.02,.02,H-y-.4,hie,0,(H+y+.4)/2,15.2,SC,6);const G=grp(0,15.2,0,y);B(.55,.08,.55,hie,0,.4,0,G);B(.45,.06,.45,hie,0,-.4,0,G);
  const vid=new THREE.MeshBasicMaterial({color:0xffd08a,toneMapped:false});B(.4,.75,.4,vid,0,0,0,G).castShadow=false;[[-.22,-.22],[.22,-.22],[-.22,.22],[.22,.22]].forEach(([a,b])=>B(.04,.8,.04,hie,a,0,b,G));
  const L=new THREE.PointLight(0xffc98a,14,13,1.6);L.position.set(0,y-.3,15.2);SC.add(L)}
 if(window.ESC)ESC.plano({S:SC,hits,OB,x:3.2,z:12.4,ry:-.35,here:'pb'});
 const maceta=(x,z,k)=>{C(.42,.32,.85,std(0xb5643c,.7),x,.42,z);const lf=std(0x2e7d32,.8);for(let i=0;i<7;i++){const a=i/7*Math.PI*2,l=new THREE.Mesh(new THREE.ConeGeometry(.17,1.4*(k||1),6),lf);l.position.set(x+Math.cos(a)*.22,1.4,z+Math.sin(a)*.22);l.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);l.castShadow=true;SC.add(l)}OB.push({x,z,r:.7})};
 maceta(-3.7,12.2);maceta(3.75,17.2);

 // ---------- comedor: mesa larga con 8 sillas, trinchador, cuadro y candil ----------
 const silla=(P,x,z,m)=>{const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=Math.atan2(-x,-z);P.add(g);B(.9,.1,.9,m,0,.9,0,g);B(.9,1.3,.1,m,0,1.55,-.4,g);
  [[-.38,-.38],[.38,-.38],[-.38,.38],[.38,.38]].forEach(([a,b])=>C(.045,.045,.9,m,a,.45,b,g,6));return g};
 {const x=-9,z=-20.4,G=grp(x,z,0),mc=std(0x6b3a1c,.45);B(5.4,.14,2.1,mc,0,1.5,0,G);[[-2.4,-.8],[2.4,-.8],[-2.4,.8],[2.4,.8]].forEach(([a,b])=>C(.09,.07,1.43,mc,a,.72,b,G,8));
  B(5.6,.01,.7,std(0xb5473a,.85),0,1.578,0,G).castShadow=false;
  C(.45,.3,.18,std(0x9a5a2a,.6),0,1.67,0,G,16);[[-.15,0,0xffa726],[.12,.1,0x7cb342],[.05,-.14,0xffd54f],[-.05,.12,0xe53935]].forEach(([a,b,c])=>{const f=new THREE.Mesh(new THREE.SphereGeometry(.13,12,8),std(c,.5));f.position.set(a,1.82,b);G.add(f)});
  [[-1.7,1.55],[0,1.55],[1.7,1.55],[-1.7,-1.55],[0,-1.55],[1.7,-1.55],[-3.2,0],[3.2,0]].forEach(([a,b])=>silla(G,a,b,mc));
  OB.push({x:x-1.8,z,r:1.7},{x,z,r:1.7},{x:x+1.8,z,r:1.7})}
 {const G=grp(-16.45,-20.4,Math.PI/2),mc=std(0x5a2e16,.45);B(3.6,1.7,1,mc,0,.85,0,G);[-1.2,0,1.2].forEach(x=>{B(1.05,1.2,.04,std(0x4a2410,.5),x,.85,.52,G);C(.04,.04,.06,lat,x+.35,.95,.56,G,8).rotation.x=Math.PI/2});
  B(3.7,.08,1.08,std(0x3a1c0c,.4),0,1.74,0,G);[-1.3,-.6,.6,1.3].forEach(x=>C(.24,.24,.025,loza,x,1.8,0,G,20));C(.06,.12,.6,lat,0,2.08,0,G,10);[-.3,0,.3].forEach(a=>C(.025,.025,.3,std(0xfaf3e0,.6),a,2.5,0,G,6));
  OB.push({x:-16.3,z:-21.6,r:.7},{x:-16.3,z:-20.4,r:.7},{x:-16.3,z:-19.2,r:.7});
  const ct=ctex('cuadro-hacienda',256,180,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#f2a65a');gr.addColorStop(.6,'#f6d08a');gr.addColorStop(1,'#7a8a4a');g.fillStyle=gr;g.fillRect(0,0,w,h);
   g.fillStyle='#b5473a';g.fillRect(150,72,64,48);g.fillStyle='#7a2a20';g.fillRect(186,36,10,40);g.fillStyle='#3f6b3a';
   for(let i=0;i<9;i++){const x=12+i*28,y=170-(i%2)*6;for(let k=0;k<7;k++){g.beginPath();g.moveTo(x,y);g.lineTo(x-14+k*4.6,y-24-((k*3)%5)*3);g.lineTo(x-11+k*4.6,y-20);g.closePath();g.fill()}}});
  const P=grp(-16.96,-20.4,Math.PI/2,4.5),pic=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.8),std(0xffffff,.8,{map:ct}));pic.position.z=.06;P.add(pic);
  [[0,.96,2.84,.14],[0,-.96,2.84,.14],[-1.36,0,.14,2.06],[1.36,0,.14,2.06]].forEach(([x,y,a,b])=>B(a,b,.1,lat,x,y,.05,P))}
 {const x=-9,z=-20.4,y=6.4;C(.02,.02,H-y,hie,x,(H+y)/2,z,SC,6);const r=new THREE.Mesh(new THREE.TorusGeometry(.85,.04,8,40),lat);r.rotation.x=Math.PI/2;r.position.set(x,y,z);SC.add(r);
  const fl=new THREE.MeshBasicMaterial({color:0xffd27a,toneMapped:false});for(let i=0;i<6;i++){const a=i/6*Math.PI*2;C(.035,.035,.28,std(0xfaf3e0,.6),x+Math.cos(a)*.85,y+.16,z+Math.sin(a)*.85,SC,6);
   const f=new THREE.Mesh(new THREE.ConeGeometry(.03,.09,6),fl);f.position.set(x+Math.cos(a)*.85,y+.35,z+Math.sin(a)*.85);SC.add(f)}
  const L=new THREE.PointLight(0xffd59a,22,15,1.6);L.position.set(x,y-.2,z);SC.add(L)}
 maceta(-16.2,-24.2);

 // ---------- cocina yucateca: barra de azulejo con fregadero, estufa con ollas, alacena, licuadora, mesa con hule, refri viejo ----------
 const esm=std(0xf2efe6,.28);
 {const x0=2.1,x1=11.6,z=-24.35,w=x1-x0,cx=(x0+x1)/2;B(w,1.48,1.3,std(0xe9e2d0,.7),cx,.74,z);
  const top=new THREE.Mesh(pm(w,1.4),std(0xffffff,.3,{map:tal}));top.rotation.x=-Math.PI/2;top.position.set(cx,1.49,z);SC.add(top);
  const fr=new THREE.Mesh(pm(w,1.3),std(0xffffff,.3,{map:tal}));fr.position.set(cx,.75,z+.66);SC.add(fr);
  const bk=new THREE.Mesh(pm(w+1.8,1.7),std(0xffffff,.3,{map:tal}));bk.position.set(cx-.9,2.35,-24.96);SC.add(bk);
  B(1.6,.12,.9,std(0x9aa3a8,.25,{metalness:.8}),7.2,1.47,z).castShadow=false;C(.04,.04,.6,std(0xb8c0c4,.2,{metalness:.9}),7.2,1.8,z-.45,SC,8);B(.06,.06,.4,std(0xb8c0c4,.2,{metalness:.9}),7.2,2.08,z-.28);
  // licuadora y cosas en la barra
  C(.17,.21,.32,std(0xe8e2d4,.4),10.4,1.65,z,SC,16);const jar=new THREE.Mesh(new THREE.CylinderGeometry(.18,.13,.55,16),new THREE.MeshStandardMaterial({color:0xff9a4a,transparent:true,opacity:.55,roughness:.1}));jar.position.set(10.4,2.08,z);SC.add(jar);
  C(.19,.19,.06,std(0x333333,.5),10.4,2.38,z,SC,16);C(.3,.3,.03,std(0xa0522d,.6),3.6,1.52,z,SC,20);C(.22,.26,.4,std(0x8e4a22,.7),4.6,1.7,z+.1,SC,14);
  for(let i=0;i<w/1.3;i++)OB.push({x:x0+.6+i*1.3,z:z+.15,r:.75})}
 {const G=grp(1.15,-24.35,0);B(1.6,1.5,1.3,esm,0,.75,0,G);B(1.62,.06,1.32,std(0x1a1a1a,.5),0,1.53,0,G);B(1.2,.8,.04,std(0xdedad0,.3),0,.75,.67,G);C(.03,.03,.9,lat,0,1.2,.72,G,8).rotation.z=Math.PI/2;
  [[-.4,-.3],[.4,-.3],[-.4,.3],[.4,.3]].forEach(([a,b])=>{const t=new THREE.Mesh(new THREE.TorusGeometry(.17,.03,6,18),std(0x222222,.6));t.rotation.x=Math.PI/2;t.position.set(a,1.57,b);G.add(t)});
  [-.5,-.17,.17,.5].forEach(a=>C(.05,.05,.06,std(0x111111,.5),a,1.35,.68,G,10).rotation.x=Math.PI/2);
  C(.33,.27,.45,std(0x9a4a24,.75),-.4,1.8,-.3,G,16);C(.3,.3,.35,std(0x2a5aa0,.35),.4,1.75,.3,G,16);C(.32,.32,.03,std(0xf2efe6,.3),.4,1.94,.3,G,16);OB.push({x:1.15,z:-24.2,r:.95})}
 {const G=grp(-.4,-22.4,Math.PI/2),ver=std(0x3f6e5a,.55);B(2.4,1.9,.8,ver,0,.95,0,G);B(2.4,2.2,.5,ver,0,3.05,-.15,G);B(2.5,.1,.85,std(0x2c5242,.5),0,1.95,0,G);
  [-.6,.6].forEach(x=>{B(1.1,1.6,.04,std(0x35604e,.5),x,.95,.42,G);const v=new THREE.Mesh(new THREE.PlaneGeometry(1,1.9),new THREE.MeshStandardMaterial({color:0xcfe6ee,transparent:true,opacity:.25,roughness:.05}));v.position.set(x,3.05,.11);G.add(v)});
  [2.45,3.2].forEach(y=>{B(2.3,.05,.4,std(0x2c5242,.5),0,y-.08,-.15,G);for(let i=0;i<5;i++)C(.17,.17,.03,i%2?loza:std(0x2a5aa0,.4),-.9+i*.45,y+.1,-.25,G,16).rotation.x=Math.PI/2.4})
  ;OB.push({x:-.3,z:-23.4,r:.6},{x:-.3,z:-22.4,r:.6},{x:-.3,z:-21.4,r:.6})}
 {const x=5,z=-19.8,G=grp(x,z,0);const hu=ctex('hule',128,128,(g,w,h)=>{g.fillStyle='#fdf6e9';g.fillRect(0,0,w,h);g.fillStyle='rgba(200,40,40,.55)';for(let i=0;i<8;i++){g.fillRect(i*16,0,8,h);g.fillRect(0,i*16,w,8)}
   g.fillStyle='#2e7d32';for(let i=0;i<4;i++){g.beginPath();g.arc(16+i*32,16+((i*40)%96),6,0,7);g.fill()}});
  B(2.3,.1,2.3,std(0xffffff,.5,{map:hu}),0,1.5,0,G);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>C(.05,.05,1.45,std(0x9aa3a8,.3,{metalness:.7}),a,.72,b,G,6));
  [[0,1.6,0xc62828],[0,-1.6,0xf9a825],[1.6,0,0x1565c0],[-1.6,0,0x2e7d32]].forEach(([a,b,c])=>silla(G,a,b,std(c,.45)));OB.push({x,z,r:2.2})}
 {const G=grp(16.25,-16.8,-Math.PI/2),cr=std(0xe8e4d6,.22);B(1.5,3,1.2,cr,0,1.5,0,G);const tp=C(.75,.75,1.2,cr,0,3,0,G,24);tp.rotation.x=Math.PI/2;tp.scale.set(1,1,.35);
  B(.08,.9,.08,std(0xd0d4d6,.15,{metalness:.9}),.55,2.1,.62,G);B(1.52,.03,1.22,std(0xc9c4b4,.3),0,2.55,0,G);B(.5,.12,.02,std(0xc0392b,.4),0,2.85,.61,G);OB.push({x:16.2,z:-16.8,r:.95})}
 {const x=13.6,z=-16.1;C(.42,.42,.08,std(0x8a8077,.8),x,.9,z,SC,16);[[-.3,-.3],[.3,-.3],[-.3,.3],[.3,.3]].forEach(([a,b])=>C(.03,.03,.9,hie,x+a,.45,z+b,SC,6));
  const g=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,1,20),new THREE.MeshStandardMaterial({color:0x6ab0e8,transparent:true,opacity:.55,roughness:.08}));g.position.set(x,1.45,z);SC.add(g);OB.push({x,z,r:.55})}
 {const y=6.8,x=5.2,z=-19.8;C(.015,.015,H-y,std(0x222222,.5),x,(H+y)/2,z,SC,6);C(.22,.08,.18,std(0xf2efe6,.4),x,y,z,SC,16);
  const b=new THREE.Mesh(new THREE.SphereGeometry(.1,12,8),new THREE.MeshBasicMaterial({color:0xfff2d0,toneMapped:false}));b.position.set(x,y-.14,z);SC.add(b);
  const L=new THREE.PointLight(0xfff0d0,18,14,1.6);L.position.set(x,y-.3,z);SC.add(L)}

 // ---------- baño de visitas: inodoro de tanque alto con cadena (suena), lavabo, espejo (en Completo refleja de verdad), toalla ----------
 {const G=grp(16.3,-23.4,-Math.PI/2);C(.2,.26,.6,loza,0,.3,.12,G,16);const bw=C(.36,.28,.3,loza,0,.75,.12,G,20);bw.scale.z=1.25;
  const st=new THREE.Mesh(new THREE.TorusGeometry(.3,.05,8,24),std(0x6b3a1c,.4));st.rotation.x=Math.PI/2;st.scale.y=1.25;st.position.set(0,.92,.14);G.add(st);
  B(.9,.5,.36,loza,0,4.4,-.45,G);C(.04,.04,3.5,std(0xb8c0c4,.2,{metalness:.9}),0,2.6,-.45,G,8);
  const cad=new THREE.Group();cad.position.set(.38,4.12,-.3);G.add(cad);C(.012,.012,1.5,std(0xb8c0c4,.2,{metalness:.9}),0,-.75,0,cad,4);C(.05,.06,.22,loza,0,-1.6,0,cad,10);CAD=cad;
  tap(G,cadena);OB.push({x:16.2,z:-23.4,r:.6})}
 {const G=grp(13.6,-24.55,0);C(.16,.22,1.3,loza,0,.65,0,G,14);const bs=C(.52,.4,.26,loza,0,1.42,.08,G,20);bs.scale.z=.8;C(.03,.03,.25,std(0xb8c0c4,.2,{metalness:.9}),0,1.65,-.2,G,8);OB.push({x:13.6,z:-24.3,r:.55});
  // espejo: en Medio un vidrio claro; en Completo un Reflector de three que se carga con el puente de c_casa_glb.js
  const P=grp(13.6,-24.97,0,3.3);[[0,.82,1.34,.12],[0,-.82,1.34,.12],[-.67,0,.12,1.76],[.67,0,.12,1.76]].forEach(([x,y,a,b])=>B(a,b,.08,lat,x,y,.04,P));
  const et=ctex('espejo',64,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#dfe8ec');gr.addColorStop(.5,'#9fb0b8');gr.addColorStop(1,'#cfd9de');g.fillStyle=gr;g.fillRect(0,0,w,h);
   g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=4;for(let i=-2;i<4;i++){g.beginPath();g.moveTo(i*30,h);g.lineTo(i*30+60,0);g.stroke()}});
  const fk=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.6),new THREE.MeshBasicMaterial({map:et}));fk.position.z=.05;P.add(fk);ESP={P,fk,rf:null,carga:false}}
 {const G=grp(12.32,-22.2,Math.PI/2);C(.025,.025,1.1,lat,0,3.1,.1,G,8).rotation.z=Math.PI/2;
  const tt=ctex('toalla',64,128,(g,w,h)=>{['#e63946','#f4a261','#2a9d8f','#f4f1de'].forEach((c,i)=>{g.fillStyle=c;g.fillRect(0,i*32,w,32)})});
  const t=new THREE.Mesh(new THREE.PlaneGeometry(.9,1.4),std(0xffffff,.9,{map:tt,side:THREE.DoubleSide}));t.position.set(0,2.45,.12);G.add(t)}
 {const L=new THREE.PointLight(0xfff2dc,10,9,1.6);L.position.set(14.6,6.6,-22.3);SC.add(L)}
 maceta(12.9,-20.4,.7);

 // ---------- la planta para c_casa3d.js ----------
 PB.bx=[-16.4,16.4,-24.4,18.4];PB.cb=[-17,17,-25,19];PB.WL=WL;PB.step=step;
 // la calle con la fachada (c_casa_calle.js) y el patio de atrás (c_casa_patio.js) arman sus muros con estas piezas y agrandan PB.bx/PB.cb
 const kit={SC,OB,hits,std,box,cyl,ctex,PB,B,C,grp,pm,tap,cara,segs,cap,tabique,suelo,cal,pasta,MS,MARCO,CAP,WL,H,T,mad,hie,lat};
 if(window.CCALLE)try{CCALLE.build(kit)}catch(er){console.error('[CCALLE]',er)}
 if(window.CPAT)try{CPAT.build(kit)}catch(er){console.error('[CPAT]',er)}
window.CPB.dbg={SC,PB}}

// la cadena del baño: ruido filtrado que sube y baja (el agua) y la cadena que baja y sube
function cadena(){cadT=performance.now();if(typeof mute!='undefined'&&mute)return;
 try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const t=AC.currentTime+.05,sr=AC.sampleRate,n=sr*3|0,b=AC.createBuffer(1,n,sr),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
  const s=AC.createBufferSource();s.buffer=b;const f=AC.createBiquadFilter();f.type='bandpass';f.Q.value=.9;f.frequency.setValueAtTime(380,t);f.frequency.exponentialRampToValueAtTime(1300,t+.7);f.frequency.exponentialRampToValueAtTime(260,t+2.9);
  const o=AC.createOscillator(),og=AC.createGain();o.frequency.value=7;og.gain.value=180;o.connect(og).connect(f.frequency);
  const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.45,t+.18);g.gain.setValueAtTime(.45,t+1.1);g.gain.exponentialRampToValueAtTime(.001,t+2.95);
  const k=AC.createOscillator(),kg=AC.createGain();k.type='square';k.frequency.value=1800;kg.gain.setValueAtTime(.06,t-.04);kg.gain.exponentialRampToValueAtTime(.001,t+.02);k.connect(kg).connect(AC.destination);
  s.connect(f).connect(g).connect(AC.destination);s.start(t);o.start(t);k.start(t-.04);s.stop(t+3);o.stop(t+3);k.stop(t+.05)}catch(e){}}

// (solo cuando tu Mii está en el baño: el Reflector vuelve a dibujar todo el piso desde el espejo)
function espejo(av){const q=window.CALIDAD==='completo'&&!!av&&av.x>12.3&&av.z<-19.65;if(!ESP)return;
 if(q&&!ESP.rf&&!ESP.carga&&window.CGLB){ESP.carga=true;CGLB.mod('objects/Reflector.js').then(M=>{const rf=new M.Reflector(new THREE.PlaneGeometry(1.2,1.6),{textureWidth:384,textureHeight:512,clipBias:.003,color:0xb4bec4});
  rf.position.z=.055;ESP.P.add(rf);ESP.rf=rf}).catch(e=>console.warn('[CPB] espejo',e))}
 const r=q&&!!ESP.rf;if(ESP.rf&&ESP.rf.visible!==r)ESP.rf.visible=r;if(ESP.fk.visible!==!r)ESP.fk.visible=!r}

// cada cuadro en la planta baja: vigas, corte de paredes, espejo y cadena
function step(now){const H3=window.CASA3D,cam=H3&&H3.cam();if(!cam)return;const cp=cam.position,av=H3.yo&&H3.yo();
 VIG.visible=cp.y<H-.25;espejo(av);
 if(CAD){const k=(performance.now()-cadT)/450;CAD.position.y=4.12-(k>=0&&k<1?Math.sin(k*Math.PI)*.18:0)}
 if(!av)return;tv.set(av.x,1,av.z);
 for(const w of CORTE){let hid=false;const sc=dv.copy(cp).sub(w.p).dot(w.n),sa=q.copy(tv).sub(w.p).dot(w.n);
  if(sc>.02&&sa<-.02){q.copy(cp).lerp(tv,sc/(sc-sa));const u=dv.copy(q).sub(w.p).dot(w.d);hid=q.y<H+.3&&u>-1&&u<w.L+1}
  if(hid!==w.hid){w.hid=hid;w.g.visible=!hid}}
 for(const r of RG){const v=!((CORTE[r.a]||{}).hid||(CORTE[r.b]||{}).hid);if(r.g.visible!==v)r.g.visible=v}}

window.CPB={build,cadena};
})();
