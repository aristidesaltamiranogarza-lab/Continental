// c_casona_casco.js — CCAS: la casona por fuera vista desde la banqueta (CASONA.md paso 8). Solo con ?casa=caja.
// La planta baja (pb.glb) llega a 5.5 sin techo; con tu Mii en la banqueta CAJA prende este casco ligero encima (un LOTE, sin horneado):
// losa de la planta alta, fachada alta con sus 5 puertas a los balcones (herrería de 2.0), muros de los lados y de atrás, pilares,
// cerramientos y barandal del corredor alto al vacío del patio, azotea enladrillada con pretil de 2.0 y cornisa de cantera,
// barandal de pilastras al vacío, cubo de la escalera, pérgola de 4.4 con bugambilia y los tinacos. Medidas de blender/casona.py
// (plano x 0..36, z 0 en la fachada; en three X = x-18, Z = 17-z). De noche se oscurece con CCALLE.tinte.
(function(){
if(typeof THREE==='undefined')return;
const MU=0xe6b89c,CA=0xe7dac4,LA=0xc58e72,LO=0xd9cbb4,HI=0x1c1c1e,PU=0x2f5a46,PO=0x24463a,MA=0x734d2e,CE=0x8c8780,TI=0x1f1f21,
 BUG=[0xc2185b,0xd81b60,0xad1457],HO=[0x3f7a35,0x356b2e],h=.15,
 PIS=5.5,N1=5.8,TE=10,AZ=10.3,PR=12.3,PUE=3.6,
 DOOR=[[4.5,7],[9,11.5],[17.3,19.7],[25.5,28],[29.5,32]],BALC=[[3,13],[16.8,20.2],[24,33]],
 COLS=[[12,14],[16,14],[20,14],[24,14],[12,18],[12,22],[12,26],[12,30],[24,18],[24,22],[24,26],[24,30],[16,30],[20,30]];
const X=x=>x-18,Z=z=>17-z;
function pon(F){if(!window.LOTE)return null;const L=LOTE();
 // caja en coords del plano: x0..x1, z0..z1, y0..y1
 const b=(x0,x1,z0,z1,y0,y1,c)=>L.box(x1-x0,y1-y0,z1-z0,c,X((x0+x1)/2),(y0+y1)/2,Z((z0+z1)/2));
 const rejas=(a0,a1,fijo,eje,y0,y1,paso)=>{const n=Math.max(1,Math.round((a1-a0)/paso));   // barrotes a lo largo de x (eje 'x') o de z
  for(let i=1;i<n;i++){const a=a0+(a1-a0)*i/n;if(eje==='x')b(a-.025,a+.025,fijo-.025,fijo+.025,y0,y1,HI);else b(fijo-.025,fijo+.025,a-.025,a+.025,y0,y1,HI)}};
 // losa de la planta alta sobre la baja (sin el patio: x 12..24, z 14..30)
 b(-h,36+h,-h,14,PIS,N1,LO);b(-h,36+h,30,34+h,PIS,N1,LO);b(-h,12,14,30,PIS,N1,LO);b(24,36+h,14,30,PIS,N1,LO);
 // fachada alta (z=0) con las puertas a los balcones
 let x=-h;DOOR.forEach(([a,c])=>{b(x,a,-h,h,N1,PR,MU);b(a,c,-h,h,N1+PUE,PR,MU);x=c});b(x,36+h,-h,h,N1,PR,MU);
 DOOR.forEach(([a,c])=>{const m=(a+c)/2;b(a,c,.02,.08,N1,N1+PUE,PO);b(a+.06,m-.03,-.02,.04,N1+.06,N1+PUE-.06,PU);b(m+.03,c-.06,-.02,.04,N1+.06,N1+PUE-.06,PU);
  b(a-.28,a,-.27,-h,N1,N1+PUE+.1,CA);b(c,c+.28,-.27,-h,N1,N1+PUE+.1,CA);b(a-.4,c+.4,-.3,-h,N1+PUE+.1,N1+PUE+.42,CA)});
 // lados y atrás (la planta alta acaba en z=30; los vecinos tapan abajo)
 b(-h,h,h,30+h,N1,PR,MU);b(36-h,36+h,h,30+h,N1,PR,MU);b(h,36-h,30-h,30+h,N1,PR,MU);
 // cornisas de cantera: entrepiso, azotea y remate del pretil (en la fachada sobresalen)
 b(-.3,36.3,-.38,-h,PIS-.05,N1+.05,CA);b(-.3,36.3,-.33,-h,TE,TE+.26,CA);
 b(-.28,36.28,-.28,h+.1,PR,PR+.16,CA);b(-.28,-h+.4,h,30.28,PR,PR+.16,CA);b(36+h-.4,36.28,h,30.28,PR,PR+.16,CA);b(-.28,36.28,30-h-.1,30.28,PR,PR+.16,CA);
 // balcones: losa con moldura y herrería de 2.0
 BALC.forEach(([a,c])=>{const z0=-1.3,yb=N1+2;b(a,c,z0,-h,PIS,N1,LO);b(a-.06,c+.06,z0-.06,-h,PIS-.1,PIS+.02,CA);
  b(a,c,z0+.02,z0+.08,yb-.07,yb,HI);b(a,c,z0+.02,z0+.08,N1+.08,N1+.14,HI);[a+.04,c-.04].forEach(s=>{b(s-.03,s+.03,z0,-h,yb-.07,yb,HI);b(s-.03,s+.03,z0,z0+.08,N1,yb,HI);rejas(z0,-h,s,'z',N1,yb,.3)});
  rejas(a,c,z0+.05,'x',N1,yb,.3)});
 // corredor alto al vacío: muros de los cuartos, pilares, cerramientos y barandal
 b(8-h,8+h,10,30,N1,TE,MU);b(28-h,28+h,10,30,N1,TE,MU);b(8,28,10-h,10+h,N1,TE,MU);
 COLS.forEach(([cx,cz])=>b(cx-.26,cx+.26,cz-.26,cz+.26,N1,TE,MU));
 b(12-.2,24+.2,14-.2,14+.2,TE-.6,TE,MU);b(12-.2,12+.2,14,30,TE-.6,TE,MU);b(24-.2,24+.2,14,30,TE-.6,TE,MU);
 const yb=N1+2;b(12,24,13.97,14.03,yb-.08,yb,HI);b(11.97,12.03,14,30,yb-.08,yb,HI);b(23.97,24.03,14,30,yb-.08,yb,HI);
 rejas(12,24,14,'x',N1,yb,.4);rejas(14,30,12,'z',N1,yb,.4);rejas(14,30,24,'z',N1,yb,.4);
 // azotea: losa enladrillada (sin el vacío) y barandal de pilastras con herrería
 b(h,36-h,h,14,TE,AZ,LA);b(h,12,14,30-h,TE,AZ,LA);b(24,36-h,14,30-h,TE,AZ,LA);
 COLS.forEach(([cx,cz])=>{if(cz<30)b(cx-.2,cx+.2,cz-.2,cz+.2,AZ,AZ+2,MU)});
 b(12-.2,24+.2,14-.18,14+.18,AZ+1.86,AZ+2,CA);b(12-.18,12+.18,14,30,AZ+1.86,AZ+2,CA);b(24-.18,24+.18,14,30,AZ+1.86,AZ+2,CA);
 rejas(12,24,14,'x',AZ,AZ+1.86,.4);rejas(14,30,12,'z',AZ,AZ+1.86,.4);rejas(14,30,24,'z',AZ,AZ+1.86,.4);
 // cubo de la escalera (x 0..8, z 10..17) con su puerta al este
 b(-h,8+h,10-h,17+h,AZ,AZ+4.2,MU);b(-h,8+h,10-h,17+h,AZ+4.2,AZ+4.45,MU);b(-h-.12,8+h+.12,10-h-.12,17+h+.12,AZ+4.45,AZ+4.65,CA);
 b(8+h,8+h+.04,11.5,15.5,AZ,AZ+PUE,PO);b(8+h+.02,8+h+.06,11.56,13.47,AZ+.06,AZ+PUE-.06,PU);b(8+h+.02,8+h+.06,13.53,15.44,AZ+.06,AZ+PUE-.06,PU);
 // pérgola (x 0..16, z 0..10) con postes de 4.4 y bugambilia
 const PG=AZ+4.4;[[.4,.4],[15.6,.4],[.4,9.6],[15.6,9.6]].forEach(([px,pz])=>b(px-.22,px+.22,pz-.22,pz+.22,AZ,PG,MA));
 [.4,9.6].forEach(pz=>b(0,16,pz-.13,pz+.13,PG-.3,PG,MA));
 for(let i=0;i<11;i++){const px=.5+i*1.5;b(px-.07,px+.07,-.1,10.1,PG,PG+.16,MA)}
 let rs=7;const rnd=()=>(rs=(rs*9301+49297)%233280)/233280;
 [[.4,.4],[.4,9.6],[15.6,.4],[5,.6],[10.5,9.4],[13,.5]].forEach(([px,pz],i)=>{for(let j=0;j<3;j++)L.bola(.55+rnd()*.35,1.3,.7,1.3,j===1?HO[i%2]:BUG[(i+j)%3],X(px+(rnd()-.5)*1.6),PG+.15+rnd()*.3,Z(pz+(rnd()-.5)*1.2))});
 // tinacos sobre su base
 b(29.5,35.3,11.4,14.2,AZ,AZ+.55,CE);[31,33.8].forEach(cx=>{L.cyl(1.1,1.05,1.9,TI,X(cx),AZ+1.5,Z(12.8),16);L.cyl(.55,1.1,.3,TI,X(cx),AZ+2.6,Z(12.8),16)});
 const m=new THREE.MeshLambertMaterial(),M=L.mesh(window.CCALLE?CCALLE.tinte(m):m);M.name='casona-casco';M.visible=false;F.SC.add(M);
 return {M,paso:p=>{M.visible=!!p&&p.z>17.25}}}   // solo con tu Mii en la banqueta: adentro sería un techo encima
window.CCAS={pon};
})();
