// c_mesa3d.js — MESA: la mesa redonda de juego (madera, canto acolchado, fieltro con el logo apenas marcado, lámpara colgante) y sus sillas.
// Unidades del juego: la cubierta (fieltro) en y=0 con centro en (0,0); el piso del cuarto en y=-1.55. Tu silla (asiento 0) en +z; los demás siguen
// al revés del reloj visto desde arriba (el 1 a tu izquierda), igual que seatA de Continental. La usan Continental y después Uno.
// MESA.arma(par,{n,col:[centro,orilla],logo,sep}) → la mesa (también queda en MESA.m). m.asiento(i) → {a, pos (donde va sentado, a la altura
// de la cubierta), ry (giro para que vea al centro), mira, mano (sus cartas sobre el fieltro), zona {c,w,d,ry} (su lugar en el fieltro)}.
// m.centro → {mazo, descarte}. m.escala(k): tamaño de las personas (1 = Mii de las cartas; en la casa k = s·FONDO.MII) y sus sillas.
(function(){
if(typeof THREE==='undefined')return;
const v3=(x,y,z)=>new THREE.Vector3(x,y,z),ORL=.72,PISO=-1.55;   // ORL: de la orilla del fieltro a la orilla de la madera
const radio=n=>5+.35*Math.max(2,Math.min(5,n||4));                 // crece con los jugadores (4 → 6.4)
const std=(c,r,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:r==null?.6:r},o||{}));
const texC={};
// fieltro: degradado del color del juego, grano y el logo apenas marcado al centro
function fieltro(col,logo){const k=col.join()+'|'+(logo||'');if(texC[k])return texC[k];
 const S=1024,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),h=S/2;
 const gr=g.createRadialGradient(h,h,20,h,h,h);gr.addColorStop(0,col[0]);gr.addColorStop(1,col[1]);g.fillStyle=gr;g.fillRect(0,0,S,S);
 const im=g.getImageData(0,0,S,S),d=im.data;for(let i=0;i<d.length;i+=4){const n=(Math.random()-.5)*14;d[i]+=n;d[i+1]+=n;d[i+2]+=n}g.putImageData(im,0,0);
 if(logo){g.save();g.translate(h,h);g.strokeStyle='rgba(255,255,255,.07)';g.fillStyle='rgba(255,255,255,.06)';
  g.lineWidth=5;g.beginPath();g.arc(0,0,h*.36,0,7);g.stroke();g.lineWidth=2;g.beginPath();g.arc(0,0,h*.33,0,7);g.stroke();
  g.font='600 '+Math.round(S*.034)+'px Georgia,"Times New Roman",serif';g.textAlign='center';g.textBaseline='middle';
  const t=logo.toUpperCase().split('').join(' '),a0=-Math.PI/2-(t.length-1)*.029;   // arriba, en arco
  [...t].forEach((ch,i)=>{g.save();g.rotate(a0+i*.058+Math.PI/2);g.fillText(ch,0,-h*.43);g.restore()});
  g.font=Math.round(S*.1)+'px serif';g.fillText('♠',0,0);g.restore()}
 const T=new THREE.CanvasTexture(c);T.colorSpace=THREE.SRGBColorSpace;T.anisotropy=8;return texC[k]=T}
// silla en el marco de la persona sentada: origen a la altura de la cubierta (cadera), asiento en y=-.6, piso en y=-1.55, respaldo en -z
function silla(wood,tela){const g=new THREE.Group(),B=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o};
 B(1.1,.1,1,wood,0,-.74,-.05);const cj=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.85,4,10),tela);cj.rotation.z=Math.PI/2;cj.scale.set(1,1,5.2);cj.position.set(0,-.64,-.04);cj.castShadow=true;g.add(cj);
 [[-.48,-.5],[.48,-.5],[-.48,.38],[.48,.38]].forEach(([x,z])=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(.05,.04,.8,8),wood);l.position.set(x,-1.15,z);l.castShadow=true;g.add(l)});
 [-.48,.48].forEach(x=>B(.08,1.3,.08,wood,x,-.1,-.53));B(1.04,.5,.08,tela,0,.15,-.53);B(1.1,.1,.12,wood,0,.45,-.53);
 return g}
function arma(par,o={}){const n=Math.max(2,o.n||4),r=radio(n),R=r+ORL,sep=o.sep||1.7,g=new THREE.Group();g.name='mesa';par.add(g);
 const wood=new THREE.MeshPhysicalMaterial({color:0x6e3b1b,roughness:.38,clearcoat:.7,clearcoatRoughness:.25}),dark=std(0x3a1e0c,.55);
 // fieltro, madera y canto acolchado (cuero)
 const fm=std(0xffffff,.95,{map:fieltro(o.col||['#2a8a5e','#123f2b'],o.logo)}),felt=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.12,96),fm);felt.position.y=-.06;felt.rotation.y=Math.PI/2;felt.receiveShadow=true;g.add(felt);
 const mad=new THREE.Mesh(new THREE.CylinderGeometry(R,R-.12,.4,96),wood);mad.position.y=-.25;mad.castShadow=mad.receiveShadow=true;g.add(mad);
 const can=new THREE.Mesh(new THREE.TorusGeometry(r+.33,.3,16,128),std(0x2b1a12,.5,{metalness:.05}));can.rotation.x=Math.PI/2;can.scale.z=.55;can.position.y=.03;can.castShadow=can.receiveShadow=true;g.add(can);
 const fal=new THREE.Mesh(new THREE.CylinderGeometry(R-.15,R-.5,.35,64,1,true),dark);fal.position.y=-.62;g.add(fal);
 // pie (en la casa se esconde: queda el pie de la mesa de la casa)
 const pie=new THREE.Group();g.add(pie);const P=(rt,rb,h,y)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,32),dark);m.position.y=y;m.castShadow=m.receiveShadow=true;pie.add(m)};
 P(.7,.95,.98,-.94);P(2.2,2.4,.14,PISO+.07);P(1.1,1.6,.12,PISO+.19);
 // lámpara colgante: pantalla, foco, cable y la luz que cae sobre el fieltro
 const lam=new THREE.Group();g.add(lam);const sr=Math.min(1.5,r*.17),pf=[];for(let i=12;i>=0;i--){const t=i/12;pf.push(new THREE.Vector2(sr*(.22+.78*Math.sin(t*Math.PI/2)),.9*(1-t)))}
 const pan=new THREE.LatheGeometry(pf,40);lam.add(new THREE.Mesh(pan,std(0x1f4a35,.4,{metalness:.35})));
 const inn=new THREE.Mesh(pan,std(0xfff1d0,.8,{emissive:0xffd9a0,emissiveIntensity:.55,side:THREE.BackSide}));inn.scale.setScalar(.985);lam.add(inn);
 const lat=std(0xc9a24a,.3,{metalness:.8});const cap=new THREE.Mesh(new THREE.CylinderGeometry(sr*.2,sr*.24,.22,20),lat);cap.position.y=.98;lam.add(cap);
 const foco=new THREE.Mesh(new THREE.SphereGeometry(sr*.2,16,12),new THREE.MeshBasicMaterial({color:0xfff3d6}));foco.position.y=.12;lam.add(foco);
 const cab=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,40,6),std(0x111111,.6));cab.position.y=21;lam.add(cab);
 const sp=new THREE.SpotLight(0xffe2b5,1,0,.6,.55,2);sp.position.y=.1;lam.add(sp);const tg=new THREE.Object3D();g.add(tg);sp.target=tg;sp.layers.enableAll();
 // sillas: una por asiento, en su lugar según escala()
 const tela=std(0x7a2a2a,.85),sillas=[];for(let i=0;i<n;i++){const s=silla(dark,tela);g.add(s);sillas.push(s)}
 const m={g,n,r,R,sr,felt,pie,lam,luz:sp,sillas,k:1,centro:{mazo:v3(-sep/2,0,0),descarte:v3(sep/2,0,0)},
  asiento(i){const a=Math.PI/2+(((i%n)+n)%n)*2*Math.PI/n,c=Math.cos(a),s=Math.sin(a),d=R+.65*m.k,ry=Math.atan2(-c,-s),w=Math.min(2*r*Math.sin(Math.PI/n)*.8,r*.95);
   return {a,pos:v3(c*d,0,s*d),ry,mira:v3(-c,0,-s),mano:v3(c*r*.9,0,s*r*.9),zona:{c:v3(c*r*.56,0,s*r*.56),w,d:r*.3,ry}}},
  escala(k){m.k=k;sillas.forEach((s,i)=>{const A=m.asiento(i);s.position.copy(A.pos);s.rotation.y=A.ry;s.scale.setScalar(k)})},
  // altura de la lámpara (sobre la cubierta); la luz alumbra igual a cualquier altura
  lampara(y){lam.position.y=y;sp.intensity=1.1*y*y;sp.angle=Math.min(1.1,Math.atan(r*1.05/y))},
  fieltro(col,logo){const t=fieltro(col,logo==null?o.logo:logo);if(fm.map!==t){fm.map=t;fm.needsUpdate=true}},
  quita(){g.parent&&g.parent.remove(g);g.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material&&!x.material.map)x.material.dispose()});if(MESA.m===m)MESA.m=null}};
 m.escala(1);m.lampara(r*1.6);return MESA.m=m}
window.MESA={arma,radio,ORL,PISO,m:null,asiento:i=>MESA.m&&MESA.m.asiento(i),get centro(){return MESA.m&&MESA.m.centro}};
})();
