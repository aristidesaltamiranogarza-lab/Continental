// c_casona_sot.js — SOTC: los juegos del sótano de la casona (CASONA.md paso 6). CAJA lo llama en cm1 con el GLB ya leído (modelos/casona/sm.glb,
// blender/casona_sm.py). Póker, Blackjack y Billar salen de SAL.mesas (mesas de CAS3 y BIL; las juegan PK3, BJ3 y BIJ como en el sótano de hoy),
// el Cubilete en la punta de la barra (CUB3) y la Ruleta queda como mesa de la casa (GM.ruleta, en el cuarto oscuro). Rockola, taquera, marcador,
// cuadro y neones van en los empties sot_<cosa> del GLB (ry = hacia dónde miran). SOTC.pon(F,R,D,H) → {hechas:{juego:1}, step} o null.
(function(){
if(typeof THREE==='undefined')return;
const PI=Math.PI,TH=1.5,HT=3.2;

function neon(H,S,k,txt,c1,c2,font,pw,ph,p){const t=H.ctex('neon-'+k,512,160,(g,w,h)=>{g.textAlign='center';g.textBaseline='middle';g.font=font;g.shadowColor=c2;g.shadowBlur=24;g.lineWidth=5;g.strokeStyle=c2;
  g.strokeText(txt,w/2,h/2);g.fillStyle=c1;g.fillText(txt,w/2,h/2);g.shadowBlur=10;g.fillText(txt,w/2,h/2)});
 const m=new THREE.Mesh(new THREE.PlaneGeometry(pw,ph),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false,depthWrite:false}));m.position.set(p.x,p.y,p.z);m.rotation.y=p.ry;S.add(m);return m}

// el cuadro del casino: as de espadas en marco de latón (la espada dibujada, sin glifos)
function cuadro(H,S,p){const as=H.ctex('cuadro-as-sm',256,360,(g,w,h)=>{g.fillStyle='#f4efe2';g.fillRect(0,0,w,h);g.strokeStyle='#c9a24a';g.lineWidth=6;g.strokeRect(14,14,w-28,h-28);g.fillStyle='#1a1a1a';
  g.font='bold 54px Georgia,serif';g.textAlign='center';g.fillText('A',44,70);g.save();g.translate(w-44,h-70);g.rotate(PI);g.fillText('A',0,0);g.restore();
  const cx=w/2,cy=h/2;g.beginPath();g.moveTo(cx,cy-80);g.bezierCurveTo(cx+30,cy-40,cx+78,cy-10,cx+62,cy+28);g.bezierCurveTo(cx+50,cy+58,cx+14,cy+52,cx+4,cy+30);
  g.lineTo(cx+16,cy+78);g.lineTo(cx-16,cy+78);g.lineTo(cx-4,cy+30);g.bezierCurveTo(cx-14,cy+52,cx-50,cy+58,cx-62,cy+28);g.bezierCurveTo(cx-78,cy-10,cx-30,cy-40,cx,cy-80);g.fill()});
 const G=new THREE.Group();G.position.set(p.x,p.y,p.z);G.rotation.y=p.ry;S.add(G);
 H.box(1.1,1.5,.06,H.std(0x8a6a2a,.35,{metalness:.6}),0,0,.03,G);const pic=new THREE.Mesh(new THREE.PlaneGeometry(.94,1.34),H.std(0xffffff,.7,{map:as}));pic.position.z=.065;G.add(pic)}

function pon(F,R,D,H){if(!window.SAL||!SAL.mesas)return null;
 const S=F.SC,hits=F.hits,v=new THREE.Vector3();
 const e=n=>{const o=R.getObjectByName('sot_'+n);if(!o)return null;o.getWorldPosition(v);return {x:v.x,y:v.y,z:v.z,ry:+(o.userData.ry||0)}};
 const m=g=>{const q=D.mesas.find(t=>t.g===g);return q&&{x:q.x,z:q.z}};
 // el blackjack da la espalda del crupier al muro de la calle (en three la calle queda hacia +z: ry=PI); el billar va a lo largo del cuarto (z)
 const pk=m('poker'),bj=m('blackjack'),bi=m('billar'),cu=m('cubilete');
 const ms=SAL.mesas({S,hits,TH,HT,poker:pk&&Object.assign(pk,{ry:0}),blackjack:bj&&Object.assign(bj,{ry:PI}),billar:bi&&Object.assign(bi,{ry:PI/2}),
  taquera:e('taquera'),marcador:e('marcador'),rockola:e('rockola')});
 F.OB.push(...ms.OB);
 const hechas={};['poker','blackjack','billar'].forEach(g=>{if(SAL.M[g])hechas[g]=1});
 if(cu&&window.CUB3){CUB3.build({THREE,SC:S,hits,OB:F.OB,std:H.std,cyl:H.cyl,ctex:H.ctex,TH,x:cu.x,z:cu.z});hechas.cubilete=1}
 const n=(k,txt,c1,c2,f,w,h)=>{const p=e('neon_'+k);if(p)neon(H,S,k+'-sm',txt,c1,c2,f,w,h,p)};
 n('casino','Casino','#ffe6a8','#ff9a2a','italic bold 96px Georgia,serif',1.5,.47);
 n('billar','Billar','#d8fff0','#18d6a0','italic bold 96px Georgia,serif',1.6,.5);
 n('cantina','El Gato Negro','#ffd6e8','#ff3b8a','italic bold 70px Georgia,serif',2.1,.66);
 const c=e('cuadro');if(c)cuadro(H,S,c);
 return {hechas,step:ms.step}}

window.SOTC={pon};
})();
