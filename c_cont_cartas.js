// c_cont_cartas.js — CCART: caras de las cartas de Continental en canvas. Las usan la vista 3D (textura) y la 2D (imagen),
// así las dos se ven iguales (como UCART en Uno). CCART.cara(c,{st}) devuelve un canvas cacheado; c = {r:1..13, s:0..3, j}.
// Palos: 0 picas (negro), 1 corazones (rojo), 2 diamantes (naranja), 3 tréboles (azul oscuro), como en Balatro.
// Diseño (aprobado en vista previa): esquina grande, un solo palo al centro, J/Q/K con emblema chico, comodín con antifaz B.
(()=>{
const TW=256,TH=358,CS=2,SX=TW/100,SY=TH/140;   // se dibuja en unidades de 100 x 140
const PS={s:'M50 4C62 22 94 40 94 62C94 76 84 84 72 84C63 84 56 80 53 74C54 84 58 90 64 96H36C42 90 46 84 47 74C44 80 37 84 28 84C16 84 6 76 6 62C6 40 38 22 50 4Z',
 h:'M50 88C20 66 4 50 4 30C4 15 16 5 29 5C39 5 46 11 50 19C54 11 61 5 71 5C84 5 96 15 96 30C96 50 80 66 50 88Z',
 d:'M50 4L88 50L50 96L12 50Z',
 c:'M50 8A20 20 0 1 1 49.9 8ZM27 38A20 20 0 1 1 26.9 38ZM73 38A20 20 0 1 1 72.9 38ZM46 60C46 78 40 88 34 96H66C60 88 54 78 54 60Z'};
const CORONA={13:'M20 72V36L35 52L50 28L65 52L80 36V72Z',12:'M22 72L26 44L39 56L50 38L61 56L74 44L78 72Z',11:'M24 72C24 52 34 40 50 40C66 40 76 52 76 72Z'};
const MASK='M20 62C26 54 40 54 50 62C60 54 74 54 80 62C82 74 74 84 64 84C56 84 52 78 50 74C48 78 44 84 36 84C26 84 18 74 20 62Z',MASKD='M50 62C60 54 74 54 80 62C82 74 74 84 64 84C56 84 52 78 50 74Z';
const ORD=['s','h','d','c'],RNK=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const FNT='"Nunito","Arial Rounded MT Bold","Segoe UI",Arial,sans-serif',SER='Georgia,"Times New Roman",serif';
let P2=null;const pth=d=>(P2||(P2={}))[d]||(P2[d]=new Path2D(d));
function pal(st){const dk=st=='black';
 return {bg:dk?'#1b1b1b':st=='retro'?'#f1e6c8':st=='contrast'?'#ffffff':'#fbf7ee',ln:dk?'#3a3a3a':st=='retro'?'#c9b78c':'#d8d0bf',
  ink:dk?['#f2f2f2','#ff6060','#ff9a3c','#7da2ff']:st=='contrast'?['#000000','#d50000','#e65c00','#0040c0']:['#151515','#c62828','#e0701a','#1f3f8f'],
  f:st=='retro'?SER:FNT,big:st=='big'}}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function pip(g,k,x,y,sz){g.save();g.translate(x-sz/2,y-sz/2);g.scale(sz/100,sz/100);g.fill(pth(PS[k]));g.restore()}
const giro=(g,f)=>{f();g.save();g.translate(100,140);g.rotate(Math.PI);f();g.restore()};   // esquina de arriba y la de abajo de cabeza
function pinta(g,c,st){const p=pal(st);g.textBaseline='alphabetic';
 g.fillStyle=p.bg;rr(g,1,1,98,138,9);g.fill();g.lineWidth=1.5;g.strokeStyle=p.ln;g.stroke();
 if(c.j){const [k0,h,d,cl]=p.ink;
  giro(g,()=>{g.fillStyle=k0;g.textAlign='center';g.font=`800 14px ${p.f}`;'JOKER'.split('').forEach((ch,i)=>g.fillText(ch,15,22+i*14))});
  g.globalAlpha=.12;g.fillStyle=cl;rr(g,27,44,46,52,9);g.fill();g.globalAlpha=1;
  g.save();g.translate(50,72);g.scale(.8,.8);g.translate(-50,-72);
  g.fillStyle=h;g.fill(pth(MASK));g.fillStyle=cl;g.fill(pth(MASKD));g.fillStyle=p.bg;
  g.beginPath();g.ellipse(36,69,7,5,0,0,Math.PI*2);g.ellipse(64,69,7,5,0,0,Math.PI*2);g.fill();
  g.fillStyle=d;g.beginPath();g.moveTo(50,86);g.lineTo(54,92);g.lineTo(50,98);g.lineTo(46,92);g.closePath();g.fill();g.restore();return}
 const col=p.ink[c.s],r=RNK[c.r-1],k=ORD[c.s],b=p.big;g.fillStyle=col;
 giro(g,()=>{g.textAlign='left';g.font=`800 ${(r.length>1?21:24)*(b?1.25:1)}px ${p.f}`;g.fillText(r,b?7:8,b?33:27);pip(g,k,b?19:17,b?49:40,b?19:15)});
 if(c.r<11){pip(g,k,50,72,40);return}
 g.save();g.translate(50,70);g.scale(.58,.58);g.translate(-50,-56);g.fill(pth(CORONA[c.r]));
 if(c.r==13){g.beginPath();g.arc(50,24,4,0,Math.PI*2);g.fill()}
 if(c.r==12){g.beginPath();[[26,40],[50,34],[74,40]].forEach(([x,y])=>{g.moveTo(x+3.5,y);g.arc(x,y,3.5,0,Math.PI*2)});g.fill()}
 if(c.r==11)g.fill(pth('M60 42C70 26 84 22 90 24C82 30 74 36 66 46Z'));
 rr(g,20,74,60,7,3);g.fill();g.restore()}
const cache={},redib=new Map(),avisa=[];let fuente=!!(document.fonts&&document.fonts.check&&document.fonts.check('800 100px Nunito'));
const kde=(c,o)=>(c.j?'j':c.r+'_'+c.s)+((o&&o.st)||'classic');
function cara(c,o){const k=kde(c,o);if(cache[k])return cache[k];const cn=document.createElement('canvas');cn.width=TW*CS;cn.height=TH*CS;
 const f=g=>pinta(g,c,(o&&o.st)||'classic'),g=cn.getContext('2d');g.setTransform(CS*SX,0,0,CS*SY,0,0);f(g);if(!fuente)redib.set(cn,f);return cache[k]=cn}
// imagen para la vista 2D: url de un blob por carta; mientras se arma devuelve null y al tenerla avisa (para volver a pintar)
const urls={},pend={},avU=[];let avT=0;
function url(c,o){const k=kde(c,o);if(urls[k])return urls[k];
 if(!pend[k]){const cn=cara(c,o);if(!cn.toBlob)return urls[k]=cn.toDataURL('image/png');pend[k]=1;
  cn.toBlob(b=>{delete pend[k];if(!b)return;urls[k]=URL.createObjectURL(b);clearTimeout(avT);avT=setTimeout(()=>avU.forEach(f=>{try{f()}catch(e){}}),30)},'image/png')}
 return null}
// si Nunito llega después de dibujar: se redibujan los mismos canvas y se avisa (3D: needsUpdate; 2D: volver a pintar)
const listo=()=>fuente||!document.fonts||!document.fonts.load?Promise.resolve():document.fonts.load('800 100px Nunito').then(()=>{if(fuente)return;fuente=true;
 redib.forEach((f,cn)=>{const g=cn.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cn.width,cn.height);g.setTransform(CS*SX,0,0,CS*SY,0,0);f(g)});redib.clear();
 for(const k in urls){if(urls[k].startsWith('blob:'))URL.revokeObjectURL(urls[k]);delete urls[k]}avisa.concat(avU).forEach(f=>{try{f()}catch(e){}})}).catch(()=>{});
listo();
window.CCART={W:TW*CS,H:TH*CS,cara,url,listo,alListo:f=>avisa.push(f),alUrl:f=>avU.push(f)};
})();
