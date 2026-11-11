// c_sotano_salon.js — SAL: el sótano ampliado (D6). Pasando la cantina, un muro con arco da al salón de casino (Póker y Blackjack
// sobre alfombra, papel tapiz vino, apliques, un cuadro y plantas) y un arco ancho al cuarto del billar (duela, papel tapiz verde,
// taquera, marcador, banca y mesita alta). En la cantina, junto al arco, una rockola (tocarla cambia la música).
// Las mesas vienen de c_billar3d.js (BIL) y c_casino3d.js (CAS3); el Blackjack se juega (c_blackjack3d.js, BJ3); las otras: letrero "Próximamente" y aviso al tocarlas.
// Lo arma c_sotano.js en SOT.piso(): SAL.build({S,hits,HT,W,XL,TH}) → {OB,WL,step}. SAL.P = dónde está cada mesa; SAL.M = las mesas.
(function(){
if(typeof THREE==='undefined')return;
const PI=Math.PI,X1=-14,X2=-23,A1=.35;   // muro cantina | casino (arco en z=A1) y arco ancho casino | billar
const NOM={billar:'Billar',blackjack:'Blackjack',poker:'Póker'};
const P={},M={},signs=[];let KM=null,lastT=0;

// ---------- aviso y letreros ----------
let avT=0;
function aviso(t){let el=document.getElementById('salAviso');if(!el){el=document.createElement('div');el.id='salAviso';el.className='ui ui-toast';el.setAttribute('role','status');document.body.appendChild(el)}
 el.textContent=t;el.style.display='';clearTimeout(avT);avT=setTimeout(()=>{el.style.display='none'},2800);if(typeof sfx=='function')sfx('tick')}
const pronto=g=>g=='blackjack'&&window.BJ3?BJ3.tap():aviso(`${NOM[g]}: muy pronto se podrá jugar aquí`);
const css=document.createElement('style');css.textContent=`.h3sign.sal{position:absolute;left:0;top:0;background:var(--ui-panel);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow);color:var(--ui-text);
 -webkit-backdrop-filter:var(--ui-blur);backdrop-filter:var(--ui-blur);white-space:nowrap;cursor:pointer;pointer-events:auto}
.h3sign.sal small{color:var(--ui-accent)}.h3sign.sal.det small::after{content:''}`;document.head.appendChild(css);
function sign(g){const el=document.createElement('div');el.className='ui h3sign sal';el.dataset.g=g;el.innerHTML=`<b>${NOM[g]}</b><small>${g=='blackjack'?'Mín $10 · Máx $500':'Próximamente'}</small>`;el.onclick=()=>pronto(g);signs.push(el);return el}
const v=new THREE.Vector3();
function labels(){const H=window.CASA3D,cam=H&&H.cam(),cv=H&&H.R&&H.R()&&H.R().domElement;if(!cam||!cv)return;const W=cv.clientWidth,Hh=cv.clientHeight,app=document.getElementById('app');
 signs.forEach(el=>{const p=P[el.dataset.g];if(!el.isConnected&&app)app.appendChild(el);v.set(p.x,p.y,p.z).project(cam);const vis=!(el.dataset.g=='blackjack'&&window.BJ3&&BJ3.yo()>=0)&&v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1;
  el.style.display=vis?'':'none';if(vis)el.style.transform=`translate(${Math.max(70,Math.min(W-70,(v.x+1)/2*W))}px,${(1-v.y)/2*Hh}px) translate(-50%,-100%)`})}
// fuera del sótano (o con la Ruleta abierta) nadie llama step: se esconden solos
setInterval(()=>{if(performance.now()-lastT>400)signs.forEach(el=>{if(el.style.display!=='none')el.style.display='none'})},300);

// ---------- texturas ----------
function texturas(ctex){
 const dam=(k,a,b,c)=>{const t=ctex('damasco-'+k,256,256,(g,w,h)=>{g.fillStyle=a;g.fillRect(0,0,w,h);g.fillStyle=b;for(let x=0;x<w;x+=32)g.fillRect(x,0,2,h);
  const med=(cx,cy)=>{g.save();g.translate(cx,cy);g.fillStyle=c;g.beginPath();g.ellipse(0,0,26,40,0,0,7);g.fill();g.fillStyle=a;g.beginPath();g.ellipse(0,0,19,31,0,0,7);g.fill();
   g.fillStyle=c;for(let i=0;i<4;i++){g.rotate(PI/2);g.beginPath();g.ellipse(0,-13,5,10,0,0,7);g.fill()}g.beginPath();g.arc(0,0,5,0,7);g.fill();
   [-52,52].forEach(y=>{g.beginPath();g.moveTo(0,y-10);g.lineTo(7,y);g.lineTo(0,y+10);g.lineTo(-7,y);g.closePath();g.fill()});g.restore()};
  med(64,64);med(192,192)},1);t.repeat.set(1/1.1,1/1.1);return t};
 const alf=ctex('alfombra-casino',256,256,(g,w,h)=>{g.fillStyle='#4f1019';g.fillRect(0,0,w,h);
  for(let j=0;j<2;j++)for(let i=0;i<2;i++){const x=i*128+64,y=j*128+64;g.strokeStyle='#c99a3a';g.lineWidth=5;g.beginPath();g.arc(x,y,40,0,7);g.stroke();
   g.fillStyle='#1d3a5a';g.beginPath();g.moveTo(x,y-28);g.lineTo(x+28,y);g.lineTo(x,y+28);g.lineTo(x-28,y);g.closePath();g.fill();g.fillStyle='#e0b85a';g.beginPath();g.arc(x,y,8,0,7);g.fill()}
  for(let j=0;j<=2;j++)for(let i=0;i<=2;i++){const x=i*128,y=j*128;g.fillStyle='#d9832e';g.beginPath();for(let k=0;k<8;k++){const q=k*PI/4,r=k%2?6:17;g.lineTo(x+Math.cos(q)*r,y+Math.sin(q)*r)}g.closePath();g.fill()}
  for(let i=0;i<2600;i++){g.fillStyle=Math.random()<.5?'rgba(255,255,255,.04)':'rgba(0,0,0,.08)';g.fillRect(Math.random()*w,Math.random()*h,1.5,1.5)}},1);alf.repeat.set(1/1.6,1/1.6);
 const due=ctex('duela-billar',256,256,(g,w,h)=>{let s=7;const r=()=>(s=(s*9301+49297)%233280)/233280;
  for(let k=0;k<8;k++){const y=k*32,c=[92+r()*22,50+r()*12,26+r()*8].map(Math.round);g.fillStyle=`rgb(${c})`;g.fillRect(0,y,w,32);
   for(let i=0;i<7;i++){g.fillStyle=`rgba(${r()<.5?'30,14,6':'150,95,55'},${.12+r()*.12})`;g.fillRect(0,y+3+r()*26,w,1)}
   g.fillStyle='rgba(20,10,4,.65)';g.fillRect(0,y,w,1.5);const jx=Math.floor(r()*w);g.fillRect(jx,y,2,32)}},1);due.repeat.set(1/2.2,1/2.2);
 return {cas:dam('vino','#5a1620','rgba(255,210,150,.05)','rgba(214,170,90,.32)'),bil:dam('verde','#1c3a2a','rgba(255,240,200,.04)','rgba(214,190,120,.28)'),alf,due}}

// ---------- rockola (mira a +z) ----------
function rockola(S,std,ctex,x,z,ry){const G=new THREE.Group();G.position.set(x,0,z);G.rotation.y=ry;S.add(G);const w=.95,h=1.75,c=h-w/2;
 const sh=new THREE.Shape();sh.moveTo(-w/2,0);sh.lineTo(w/2,0);sh.lineTo(w/2,c);sh.absarc(0,c,w/2,0,PI,false);sh.lineTo(-w/2,0);
 const b=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.56,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:2,curveSegments:28}),
  new THREE.MeshPhysicalMaterial({color:0x6a3214,roughness:.35,clearcoat:.7,clearcoatRoughness:.2}));b.position.z=-.28;b.castShadow=b.receiveShadow=true;G.add(b);
 const gl=(col)=>new THREE.MeshBasicMaterial({color:col,toneMapped:false});
 const arc=ctex('rockola-arco',256,128,(g,W,H)=>{const gr=g.createLinearGradient(0,0,W,0);['#ff3b6b','#ffb347','#ffe66b','#5ef0c0','#5aa8ff','#c46bff'].forEach((k,i,a)=>gr.addColorStop(i/(a.length-1),k));
  g.fillStyle=gr;g.fillRect(0,0,W,H);g.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<W;i+=16)g.fillRect(i,0,6,H)});
 const ins=new THREE.Shape();ins.absarc(0,0,w/2-.13,0,PI,false);ins.lineTo(w/2-.13,0);const ig=new THREE.ShapeGeometry(ins,24),p=ig.attributes.position,u=ig.attributes.uv;
 for(let i=0;i<p.count;i++)u.setXY(i,(p.getX(i)+w/2)/w,p.getY(i)/(w/2));const im=new THREE.Mesh(ig,new THREE.MeshBasicMaterial({map:arc,toneMapped:false}));im.position.set(0,c,.305);G.add(im);
 const tor=new THREE.Mesh(new THREE.TorusGeometry(w/2-.07,.035,8,36,PI),gl(0xffb347));tor.position.set(0,c,.3);G.add(tor);
 [-1,1].forEach(s=>{const t=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,c-.5,12),gl(0xff6a3a));t.position.set(s*(w/2-.07),.5+(c-.5)/2,.3);G.add(t)});
 const dsp=ctex('rockola-discos',256,160,(g,W,H)=>{g.fillStyle='#14100c';g.fillRect(0,0,W,H);for(let j=0;j<5;j++)for(let i=0;i<3;i++){g.fillStyle=['#f3e6c8','#ffd27a','#f3c8c8'][(i+j)%3];g.fillRect(14+i*80,12+j*29,70,22);
   g.fillStyle='#5a2a14';g.fillRect(20+i*80,20+j*29,40,3);g.fillRect(20+i*80,27+j*29,28,2)}});
 const d=new THREE.Mesh(new THREE.PlaneGeometry(.62,.4),new THREE.MeshBasicMaterial({map:dsp,toneMapped:false}));d.position.set(0,1.02,.31);G.add(d);
 const gri=ctex('rockola-rejilla',128,96,(g,W,H)=>{g.fillStyle='#1a1410';g.fillRect(0,0,W,H);g.fillStyle='#c8ccd0';for(let x=6;x<W;x+=10)g.fillRect(x,4,3,H-8);g.fillStyle='#c9a24a';g.fillRect(0,H/2-3,W,6)});
 const r=new THREE.Mesh(new THREE.PlaneGeometry(.66,.44),std(0xffffff,.4,{map:gri,metalness:.5}));r.position.set(0,.46,.31);G.add(r);
 const ch=std(0xc8ccd0,.25,{metalness:.9});[[0,.73,.82,.06],[0,.04,1.0,.08]].forEach(([x,y,ww,hh])=>{const o=new THREE.Mesh(new THREE.BoxGeometry(ww,hh,.66),ch);o.position.set(x,y,0);o.castShadow=true;G.add(o)});
 return G}

// ---------- el salón ----------
function build(e){const H=window.CASA3D,{S,hits,HT,W,XL}=e,TH=e.TH||1.5;if(!H||!window.CPB||!CPB.kit)return null;const {std,box,cyl,ctex}=H;
 KM=CPB.kit({SC:S,hits,std,box,cyl,ctex},HT);const T=texturas(ctex),OB=[];
 const Mcan={m:std(0xffffff,.95,{map:KM.cal('sotcan','#4c3a2c')}),lam:std(0x2c1c12,.6),lamH:1.25,rod:std(0x1c120c,.5)},
  Mcas={m:std(0xffffff,.88,{map:T.cas}),lam:std(0x3a1f12,.5),lamH:1.3,rod:std(0x8a6a2a,.4,{metalness:.6})},
  Mbil={m:std(0xffffff,.88,{map:T.bil}),lam:std(0x3a1f12,.5),lamH:1.3,rod:std(0x8a6a2a,.4,{metalness:.6})};
 // muros: cantina | casino con arco, casino | billar con arco ancho; papel tapiz sobre el ladrillo viejo
 KM.tabique('z',X1,1,[[-W,W,Mcan]],[[-W,W,Mcas]],[{at:A1,w:3.2,h:3.3,arco:true}]);
 KM.tabique('z',X2,1,[[-W,W,Mcas]],[[-W,W,Mbil]],[{at:0,w:4.6,h:3.55,arco:true}]);
 const q=.04;KM.ext('x',-W+q,1,X2,X1,Mcas);KM.ext('x',W-q,-1,X2,X1,Mcas);KM.ext('x',-W+q,1,XL,X2,Mbil);KM.ext('x',W-q,-1,XL,X2,Mbil);KM.ext('z',XL+q,1,-W,W,Mbil);
 // pisos: alfombra de casino y duela; umbral de latón bajo los arcos
 const piso=(x0,x1,map)=>{const f=new THREE.Mesh(KM.pm(x1-x0,2*W),std(0xffffff,.85,{map}));f.rotation.x=-PI/2;f.position.set((x0+x1)/2,.004,0);f.receiveShadow=true;S.add(f)};
 piso(X2,X1,T.alf);piso(XL,X2,T.due);
 const lat=std(0xc9a24a,.32,{metalness:.85});box(.34,.012,3.2,lat,X1,.008,A1,S).castShadow=false;box(.34,.012,4.6,lat,X2,.008,0,S).castShadow=false;
 // neones: "Casino" sobre el arco (lado de la cantina) y "Billar" sobre el marcador
 const neon=(k,txt,c1,c2,font,pw,ph,x,y,z,ry)=>{const t=ctex('neon-'+k,512,160,(g,w,h)=>{g.textAlign='center';g.textBaseline='middle';g.font=font;g.shadowColor=c2;g.shadowBlur=24;g.lineWidth=5;g.strokeStyle=c2;
   g.strokeText(txt,w/2,h/2);g.fillStyle=c1;g.fillText(txt,w/2,h/2);g.shadowBlur=10;g.fillText(txt,w/2,h/2)});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(pw,ph),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false,depthWrite:false}));m.position.set(x,y,z);m.rotation.y=ry;S.add(m);return m};
 neon('casino','♠ Casino ♥','#ffe6a8','#ff9a2a','italic bold 84px Georgia,serif',1.54,.48,X1+.17,3.65,A1,PI/2);
 neon('billar','Billar','#d8fff0','#18d6a0','italic bold 96px Georgia,serif',1.7,.53,-27.5,3.22,-W+.08,0);

 // ---------- casino ----------
 const C3=window.CAS3,hit=g=>({t:'fn',g,f:()=>pronto(g)});
 if(C3){const pk=C3.poker({S,hits,std,ctex,TH,x:-18.5,z:-2.9,ry:0,hit:hit('poker'),cuero:'#5a1a1a'});
  const bj=C3.blackjack({S,hits,std,ctex,TH,x:-18.5,z:3.3,ry:PI,hit:hit('blackjack'),cuero:'#5a1a1a'});
  M.poker=pk;M.blackjack=bj;if(window.BJC)BJC.pon(bj);OB.push(...pk.OB,...bj.OB);P.poker={x:-18.5,y:TH+2.1,z:-2.9};P.blackjack={x:-18.5,y:TH+2.1,z:2.75};
  // lámparas: dos campanas sobre el póker y una sobre el blackjack (una luz cada mesa; en calidad Media se apagan, los focos siguen)
  C3.campana(S,std,-19.3,2.85,-2.9,HT);C3.campana(S,std,-17.7,2.85,-2.9,HT);C3.luz(S,-18.5,2.6,-2.9,11,7);
  C3.campana(S,std,-18.5,2.85,2.9,HT,1.15);C3.luz(S,-18.5,2.6,2.9,10,6.5)}
 // apliques y el cuadro (as de espadas) en la pared del fondo del casino
 const ap=new THREE.MeshStandardMaterial({color:0xfff0d0,emissive:0xffcf8a,emissiveIntensity:1.1,roughness:.5});
 [-20.3,-16.7].forEach(x=>{cyl(.07,.07,.03,lat,x,2.45,-W+.06,S,16).rotation.x=PI/2;box(.03,.03,.22,lat,x,2.45,-W+.17,S);
  const t=new THREE.Mesh(new THREE.LatheGeometry([[.03,0],[.07,.04],[.1,.12],[.11,.18]].map(p=>new THREE.Vector2(p[0],p[1])),16),ap);t.position.set(x,2.42,-W+.28);S.add(t)});
 const as=ctex('cuadro-as',256,360,(g,w,h)=>{g.fillStyle='#f4efe2';g.fillRect(0,0,w,h);g.strokeStyle='#c9a24a';g.lineWidth=6;g.strokeRect(14,14,w-28,h-28);g.fillStyle='#1a1a1a';
  g.font='bold 54px Georgia,serif';g.textAlign='center';g.fillText('A',44,70);g.save();g.translate(w-44,h-70);g.rotate(PI);g.fillText('A',0,0);g.restore();g.font='190px Georgia,serif';g.textBaseline='middle';g.fillText('♠',w/2,h/2+10)});
 box(1.1,1.5,.06,std(0x8a6a2a,.35,{metalness:.6}),-18.5,2.45,-W+.08,S);const pic=new THREE.Mesh(new THREE.PlaneGeometry(.94,1.34),std(0xffffff,.7,{map:as}));pic.position.set(-18.5,2.45,-W+.115);S.add(pic);
 // plantas (modelo de Poly Haven, el mismo de la planta alta)
 if(window.CGLB)[[-22.35,-4.55],[-14.65,-4.55]].forEach(([x,z],i)=>{S.add(CGLB.pon('sot','planta',{pos:[x,0,z],rot:i*1.3,esc:3,sombra:true}));OB.push({x,z,r:.45})});

 // ---------- billar ----------
 if(window.BIL){const b=BIL.build({S,hits,std,ctex,x:-27.5,z:-.3,ry:0,top:HT,hit:hit('billar')});M.billar=b;OB.push(...b.OB);P.billar={x:-27.5,y:TH+1.7,z:-.3};
  BIL.taquera({S,std,x:XL+.06,z:1.8,ry:PI/2});BIL.marcador({S,std,x:-27.5,y:2.38,z:-W+.06,ry:0});OB.push({x:XL+.4,z:1.8,r:.5})}
 // banca para mirar (contra el fondo) y mesita alta con dos bancos
 if(window.LOTE){const LT=LOTE(),md='#3a1f10',cu='#2a4a36';
  LT.box(3.6,.08,.52,md,-27.5,.86,-W+.62);LT.box(3.5,.1,.46,cu,-27.5,.93,-W+.62);LT.box(3.6,.55,.08,md,-27.5,1.35,-W+.3,0,.1,0);LT.box(3.5,.42,.07,cu,-27.5,1.36,-W+.36,0,.1,0);
  [-29.2,-27.5,-25.8].forEach(x=>{LT.box(.08,.82,.08,md,x,.41,-W+.84);LT.box(.08,.82,.08,md,x,.41,-W+.4)});
  const mx=-30.7,mz=3.95;LT.cyl(.4,.4,.05,md,mx,1.18,mz,24);LT.cyl(.05,.05,1.15,'#151515',mx,.6,mz,10);LT.cyl(.3,.32,.04,'#151515',mx,.02,mz,20);
  [[-1,-.1],[1,.25]].forEach(([s,dz])=>{const x=mx+s*.7,z=mz+dz;LT.cyl(.22,.2,.08,'#6a1c16',x,.84,z,16);LT.cyl(.035,.045,.8,'#707478',x,.42,z,8);LT.cyl(.2,.22,.03,'#707478',x,.015,z,16);OB.push({x,z,r:.28})});
  const m=LT.mesh(std(0xffffff,.55));m.castShadow=m.receiveShadow=true;S.add(m);
  OB.push({x:-28.9,z:-W+.62,r:.45},{x:-27.5,z:-W+.62,r:.45},{x:-26.1,z:-W+.62,r:.45},{x:mx,z:mz,r:.45})}

 // ---------- cantina: la rockola junto al arco ----------
 const rk=rockola(S,std,ctex,X1+.5,3.75,PI/2);OB.push({x:X1+.55,z:3.75,r:.62});
 rk.traverse(o=>{if(o.isMesh){o.userData.hit={t:'fn',f:()=>{if(typeof musCyc=='function'){musCyc();aviso('Música: '+(typeof musName=='function'?musName():''))}}};hits.push(o)}});

 ['billar','blackjack','poker'].forEach(sign);
 const step=()=>{lastT=performance.now();if(window.BJC)BJC.paso();if(window.BJ3)BJ3.paso();const cm=H.cam();if(KM&&cm)CPB.corte(KM,cm.position,H.yo&&H.yo());labels()};
 return {OB,WL:KM.WL,step}}

window.SAL={build,P,M,aviso};
})();
