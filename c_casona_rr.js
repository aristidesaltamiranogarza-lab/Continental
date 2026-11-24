// c_casona_rr.js — RRC: la Ruleta Rusa en el cuarto oscuro del sótano de la casona (CASONA.md R9). SOTC.viste(t) lo llama sobre la mesa
// de la casa (c_casa3d.js buildTable): esconde la mesa genérica (y su luz, que quedaba arriba del techo) y pone la de la Ruleta de siempre:
// tablas viejas rayadas con cuatro patas (una chueca), el foco desnudo colgando de su cable que se mece y a veces parpadea (la única luz del
// cuarto), cenicero con colillas y cigarro que humea, whisky con su vaso y el revólver. En las esquinas del cuarto (muros de MARC) cajas
// y un barril. RRC.pon(t,H,F,D) → paso() para cada cuadro; RRC.A: ajustes.
(function(){
if(typeof THREE==='undefined')return;
const PI=Math.PI,rnd=(a,b)=>a+Math.random()*(b-a),V2=THREE.Vector2;
const A={TOP:1.55,HT:3.2,CABLE:.62,LUZ:30,DIST:11,HUMO:10};

function texturas(H){
 const tablas=H.ctex('rr-tablas',512,512,(g,w,h)=>{g.fillStyle='#3e2a1a';g.fillRect(0,0,w,h);const n=7,bw=w/n;
  for(let i=0;i<n;i++){const l=34+Math.random()*14;g.fillStyle=`hsl(26,38%,${l*.5}%)`;g.fillRect(i*bw+2,0,bw-4,h);
   g.strokeStyle='rgba(20,10,4,.35)';g.lineWidth=1.4;for(let k=0;k<14;k++){const x=i*bw+6+Math.random()*(bw-12);g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x+rnd(-6,6),h*.3,x+rnd(-6,6),h*.7,x+rnd(-4,4),h);g.stroke()}
   g.fillStyle='rgba(12,6,2,.9)';g.fillRect(i*bw,0,3,h)}
  g.strokeStyle='rgba(225,200,160,.18)';g.lineWidth=1;for(let k=0;k<60;k++){const x=Math.random()*w,y=Math.random()*h,a=Math.random()*PI,l=rnd(8,40);g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}
  g.lineWidth=5;[[150,330,34],[300,180,26],[380,360,30]].forEach(([x,y,r])=>{g.strokeStyle='rgba(15,8,3,.35)';g.beginPath();g.arc(x,y,r,0,7);g.stroke()});   // aros de vaso
  const q=g.createRadialGradient(330,250,2,330,250,26);q.addColorStop(0,'rgba(5,3,2,.85)');q.addColorStop(1,'rgba(5,3,2,0)');g.fillStyle=q;g.beginPath();g.arc(330,250,26,0,7);g.fill()});   // quemada de cigarro
 const humo=H.ctex('rr-humo',64,64,(g,w,h)=>{const q=g.createRadialGradient(32,32,1,32,32,31);q.addColorStop(0,'rgba(220,220,220,.9)');q.addColorStop(1,'rgba(220,220,220,0)');g.fillStyle=q;g.fillRect(0,0,w,h)});
 const etiqueta=H.ctex('rr-etiqueta',256,128,(g,w,h)=>{g.fillStyle='#e8dcc0';g.fillRect(0,0,w,h);g.fillStyle='#5a1a12';g.fillRect(0,18,w,14);g.fillRect(0,h-32,w,14);g.fillStyle='#2a1a10';
  g.beginPath();g.ellipse(w/2,h/2,30,20,0,0,7);g.fill()});
 const caja=H.ctex('rr-caja',256,256,(g,w,h)=>{g.fillStyle='#6b5034';g.fillRect(0,0,w,h);for(let i=0;i<4;i++){g.fillStyle=`hsl(30,30%,${30+Math.random()*8}%)`;g.fillRect(4,i*64+3,w-8,58)}
  g.fillStyle='#4a3420';g.fillRect(0,0,22,h);g.fillRect(w-22,0,22,h);g.strokeStyle='rgba(20,10,4,.4)';for(let k=0;k<30;k++){const y=Math.random()*h;g.beginPath();g.moveTo(22,y);g.lineTo(w-22,y+rnd(-3,3));g.stroke()}});
 return {tablas,humo,etiqueta,caja}}

// la mesa: cubierta de tablas, canto oscuro, faldón y cuatro patas (una chueca)
function mesa(G,H,T,r,hit,hits){const y=A.TOP,sd=H.std(0x2e1c10,.85),tw=H.std(0xffffff,.8,{map:T.tablas});
 const top=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.09,56),[sd,tw,sd]);top.position.y=y-.045;top.castShadow=top.receiveShadow=true;G.add(top);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(r,.05,8,56),sd);rim.rotation.x=PI/2;rim.position.y=y-.05;G.add(rim);
 H.cyl(r-.2,r-.2,.16,sd,0,y-.17,0,G,40);
 [0,1,2,3].forEach(i=>{const a=i/4*PI*2+.4,l=H.box(.14,y-.25,.14,sd,Math.cos(a)*r*.6,(y-.25)/2,Math.sin(a)*r*.6,G);if(i===2){l.rotation.z=.07;l.rotation.x=-.04;l.position.x+=.04}});
 [top,rim].forEach(o=>{o.userData.hit=hit;hits.push(o)})}

// cenicero con colillas y el cigarro prendido (brasa sin luz propia) y su humo; whisky a medio tomar con su vaso
function cosas(G,H,T){const y=A.TOP,o={};
 const ash=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.16,0],[.17,.035],[.15,.04],[.13,.012],[0,.012]].map(p=>new V2(p[0],p[1])),24),H.std(0x3a3f44,.3,{metalness:.6}));
 ash.position.set(.55,y,-.35);G.add(ash);
 const pap=H.std(0xe8e2d4,.8),fil=H.std(0xc98a3a,.8);
 for(let i=0;i<9;i++){const a=Math.random()*7,d=Math.random()*.1,b=new THREE.Group();b.position.set(.55+Math.cos(a)*d,y+.025,-.35+Math.sin(a)*d);b.rotation.set(0,Math.random()*7,rnd(-.3,.3));G.add(b);
  H.cyl(.011,.011,.045,pap,0,0,.02,b,6).rotation.x=PI/2;H.cyl(.0115,.0115,.03,fil,0,0,-.017,b,6).rotation.x=PI/2}
 const cg=new THREE.Group();cg.position.set(.55,y+.04,-.35);cg.rotation.y=.6;G.add(cg);
 H.cyl(.012,.012,.16,pap,0,0,.12,cg,8).rotation.x=PI/2;H.cyl(.0125,.0125,.03,fil,0,0,.21,cg,8).rotation.x=PI/2;H.cyl(.0122,.0122,.025,H.std(0x777370,1),0,0,.03,cg,8).rotation.x=PI/2;
 const em=new THREE.Mesh(new THREE.SphereGeometry(.013,8,6),new THREE.MeshBasicMaterial({color:0xff5a10}));em.position.z=.015;cg.add(em);o.brasa=em;
 cg.updateMatrixWorld(true);o.bp=em.getWorldPosition(new THREE.Vector3());G.worldToLocal(o.bp);
 const sm=new THREE.SpriteMaterial({map:T.humo,transparent:true,depthWrite:false,opacity:0});o.humo=[];
 for(let i=0;i<A.HUMO;i++){const s=new THREE.Sprite(sm.clone());G.add(s);o.humo.push({s,t:Math.random()*5,life:4+Math.random()*2})}
 const bot=new THREE.Group();bot.position.set(-.5,y,.2);G.add(bot);
 const bp=[[0,0],[.09,0],[.095,.02],[.095,.3],[.08,.34],[.032,.4],[.028,.5],[.032,.51],[0,.51]].map(p=>new V2(p[0],p[1]));
 bot.add(new THREE.Mesh(new THREE.LatheGeometry(bp,20),new THREE.MeshPhysicalMaterial({color:0x7a5a2a,roughness:.08,transparent:true,opacity:.42,depthWrite:false})));
 const lq=H.std(0xa25a14,.15,{emissive:0x2a1004,transparent:true,opacity:.85});H.cyl(.088,.088,.15,lq,0,.085,0,bot,20);
 const lb=new THREE.Mesh(new THREE.CylinderGeometry(.097,.097,.12,20,1,true),H.std(0xffffff,.7,{map:T.etiqueta}));lb.position.y=.2;bot.add(lb);H.cyl(.034,.034,.035,H.std(0x161616,.4),0,.52,0,bot,12);
 const vs=new THREE.Group();vs.position.set(-.18,y,.48);G.add(vs);
 vs.add(new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.055,0],[.06,.1],[.056,.1],[.05,.008],[0,.008]].map(p=>new V2(p[0],p[1])),20),new THREE.MeshPhysicalMaterial({color:0xdfe6e8,roughness:.05,transparent:true,opacity:.3,depthWrite:false})));
 H.cyl(.05,.05,.03,lq,0,.024,0,vs,16);
 if(window.RRPJ)try{const gw=RRPJ.arma(new THREE.Group());gw.position.set(.4,y+.04,.3);gw.rotation.set(0,2.2,PI/2);G.add(gw);RRPJ.ver(gw,true)}catch(e){console.warn('[RRC] revólver',e)}
 return o}

// el foco desnudo: cable desde el techo, socket y la bola que brilla; su luz es la del cuarto (se queda en calidad Media)
function foco(G,H){const pv=new THREE.Group();pv.position.set(0,A.HT,0);G.add(pv);const L=A.CABLE;
 H.cyl(.008,.008,L,H.std(0x111111,.6),0,-L/2,0,pv,6);H.cyl(.045,.04,.1,H.std(0x2b2724,.5,{metalness:.5}),0,-L-.03,0,pv,12);
 const gm=new THREE.MeshStandardMaterial({color:0xfff4d8,emissive:0xffd690,emissiveIntensity:2.2,roughness:.2});const gs=new THREE.Mesh(new THREE.SphereGeometry(.085,16,12),gm);gs.position.y=-L-.14;pv.add(gs);
 const lt=new THREE.PointLight(0xffc47e,A.LUZ,A.DIST,1.5);lt.position.y=-L-.16;lt.userData.keep=true;pv.add(lt);
 return {pv,gm,lt,x:0,z:0,vx:0,vz:0,fl:-1e9,next:performance.now()+3000}}

// cajas y un barril en las esquinas del cuarto: el cuarto se mide con los muros (MARC) desde el centro de la mesa
function cuarto(G,H,T,t,D,OB){const WL=(D&&D.WL)||[];
 const rayo=(dx,dz)=>{let best=6;for(const [x1,z1,x2,z2,e] of WL){const ex=x2-x1,ez=z2-z1,den=dx*ez-dz*ex;if(Math.abs(den)<1e-9)continue;
   const qx=x1-t.x,qz=z1-t.z,s=(qx*ez-qz*ex)/den,u=(qx*dz-qz*dx)/den;if(s>.5&&u>=0&&u<=1)best=Math.min(best,s-(e||.3)/2)}return best};
 const x0=-rayo(-1,0),x1=rayo(1,0),z0=-rayo(0,-1),z1=rayo(0,1);
 const cj=H.std(0xffffff,.85,{map:T.caja});
 const caja=(x,z,s,y,ry)=>{const b=H.box(s,s,s,cj,x,y+s/2,z,G);b.rotation.y=ry;b.castShadow=b.receiveShadow=true;return b};
 const cx=x0+.6,cz=z0+.6;caja(cx,cz,.8,0,.1);caja(cx+.05,cz,.62,.8,-.15);caja(cx+.95,cz-.05,.7,0,.5);OB.push({x:t.x+cx+.4,z:t.z+cz,r:.85});
 const bx=x1-.6,bz=z0+.6,pr=[[0,0],[.3,0],[.36,.25],[.38,.5],[.36,.75],[.3,1],[0,1]].map(p=>new V2(p[0],p[1]));
 const ba=new THREE.Mesh(new THREE.LatheGeometry(pr,18),H.std(0x4a3020,.8));ba.position.set(bx,0,bz);ba.castShadow=true;G.add(ba);
 const fe=H.std(0x2a2a2c,.5,{metalness:.6});[.12,.88].forEach(y=>{const h=new THREE.Mesh(new THREE.TorusGeometry(.345,.018,6,24),fe);h.rotation.x=PI/2;h.position.set(bx,y,bz);G.add(h)});
 OB.push({x:t.x+bx,z:t.z+bz,r:.55})}

function pon(t,H,F,D){const G=t.G;if(!G||!H)return null;
 const hit=(G.children.find(o=>o.userData&&o.userData.hit)||{userData:{}}).userData.hit||{t:'table',g:'ruleta'};
 // fuera la mesa genérica: cubierta, aro, pie, cartitas y su luz (a 5.9, arriba del techo del sótano)
 G.children.forEach(o=>{if(o.isPointLight||(o.isMesh&&/Cylinder|Torus/.test(o.geometry.type))||(t.deco||[]).includes(o))o.visible=false});
 const T=texturas(H);mesa(G,H,T,t.r,hit,F.hits);const o=cosas(G,H,T),b=foco(G,H);
 try{cuarto(G,H,T,t,D,F.OB)}catch(e){console.warn('[RRC] cuarto',e)}
 const RRS=window.RRS,pj=new THREE.Vector3();let tA=0;
 function paso(){const now=performance.now(),s=Math.min(.05,(now-(tA||now))/1000);tA=now;
  b.vx+=(-11*b.x-.25*b.vx)*s;b.vz+=(-11*b.z-.25*b.vz)*s;b.x+=b.vx*s;b.z+=b.vz*s;b.pv.rotation.set(b.x+.012*Math.sin(now/1700),0,b.z+.01*Math.sin(now/2300));
  if(now>b.next){b.fl=now;b.next=now+rnd(5000,14000);b.vx+=rnd(-.15,.15);
   const yo=H.yo&&H.yo();if(yo&&RRS&&RRS.snd){G.getWorldPosition(pj);if(Math.hypot(yo.x-pj.x,yo.z-pj.z)<7)try{RRS.snd('chispa')}catch(e){}}}
  const k=now-b.fl<420?(Math.random()<.45?.06:.8+Math.random()*.2):.96+.04*Math.sin(now/53)*Math.sin(now/131);b.lt.intensity=A.LUZ*k;b.gm.emissiveIntensity=2.2*k;
  o.brasa.material.color.setHSL(.05,1,.45+.1*Math.sin(now/180)+.05*Math.random());
  o.humo.forEach(q=>{q.t+=s;if(q.t>q.life){q.t=0;q.life=4+Math.random()*2.5;q.ox=rnd(-.02,.02)}const f=q.t/q.life;
   q.s.position.set(o.bp.x+(q.ox||0)+Math.sin(q.t*1.3+q.life)*.15*f,o.bp.y+f*1.1,o.bp.z+Math.cos(q.t*.9)*.12*f);q.s.scale.setScalar(.04+f*.45);q.s.material.opacity=.22*Math.sin(PI*Math.min(1,f*1.2))*(1-f*.3)})}
 return {paso}}

window.RRC={pon,A};
})();
