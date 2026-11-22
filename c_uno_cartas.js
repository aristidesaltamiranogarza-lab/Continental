// c_uno_cartas.js — UCART: caras y dorso de las cartas de Uno en canvas. Lo usan la vista 3D (textura) y la 2D (imagen),
// así las dos se ven iguales. UCART.cara(c,{cbl}) y UCART.dorso() devuelven un canvas de UCART.W x UCART.H (cacheado);
// c = {c:0..4, t:'n'|'s'|'r'|'d'|'w'|'f', n}. UCART.listo() espera la fuente (Nunito 800).
(()=>{
const TW=256,TH=384,CS=2,R=26;
const COL=['#E3352E','#F5B70C','#2BA34E','#1E6FD5'],OSC=['#9E1A1A','#B87800','#14703A','#0D4A9E'],CLA=['#FF7466','#FFD957','#64D184','#5DA5F7'];
const INK='#1C1616',PAP='#FFFCF5',FNT='"Nunito","Arial Rounded MT Bold","Segoe UI",Arial,sans-serif';
const cache={},redib=new Map(),avisa=[];let fuente=!!(document.fonts&&document.fonts.check&&document.fonts.check('800 100px Nunito'));
function cnv(){const c=document.createElement('canvas');c.width=TW*CS;c.height=TH*CS;const g=c.getContext('2d');g.scale(CS,CS);return[c,g]}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
// papel con borde, campo de color (degradado) y filete interior; deja el clip del campo puesto
function base(g,cen,mid,ori){g.fillStyle=PAP;rr(g,0,0,TW,TH,R);g.fill();g.lineWidth=2;g.strokeStyle='rgba(40,20,10,.3)';rr(g,1,1,TW-2,TH-2,R-1);g.stroke();
 g.save();rr(g,12,12,TW-24,TH-24,R-8);g.clip();
 const gr=g.createRadialGradient(TW*.42,TH*.4,20,TW/2,TH/2,TH*.62);gr.addColorStop(0,cen);gr.addColorStop(.55,mid);gr.addColorStop(1,ori);g.fillStyle=gr;g.fillRect(0,0,TW,TH);
  g.lineWidth=2;g.strokeStyle='rgba(255,255,255,.32)';rr(g,21,21,TW-42,TH-42,R-14);g.stroke()}
// óvalo inclinado del centro: sombra, papel y aro fino del color
function ovalo(g,col,osc){g.save();g.translate(TW/2,TH/2);g.rotate(.42);
 g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(5,7,93,150,0,0,7);g.fill();
 g.fillStyle=PAP;g.beginPath();g.ellipse(0,0,93,150,0,0,7);g.fill();
 g.lineWidth=3;g.strokeStyle=col;g.globalAlpha=.35;g.beginPath();g.ellipse(0,0,84,141,0,0,7);g.stroke();g.restore()}
// óvalo de cuatro colores (comodines)
function ovalo4(g,x,y,rx,ry,a,borde){g.save();g.translate(x,y);g.rotate(a);
 if(borde){g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(rx*.05,ry*.05,rx,ry,0,0,7);g.fill()}
 [0,3,1,2].forEach((k,q)=>{g.beginPath();g.moveTo(0,0);g.ellipse(0,0,rx,ry,0,(q-1)*Math.PI/2,q*Math.PI/2);g.closePath();
  const gr=g.createLinearGradient(-rx,-ry,rx,ry);gr.addColorStop(0,CLA[k]);gr.addColorStop(1,COL[k]);g.fillStyle=gr;g.fill()});
 g.lineWidth=Math.max(2,rx*.08);g.strokeStyle=PAP;g.beginPath();g.ellipse(0,0,rx,ry,0,0,7);g.stroke();
 g.lineWidth=Math.max(1,rx*.025);g.strokeStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(0,0,rx*1.04,ry*1.04,0,0,7);g.stroke();g.restore()}
// trazo con contorno y relieve: primero la sombra corrida (dep), luego el contorno oscuro y encima el color
function tinta(g,s,path,w,fill,dep){g.lineJoin='round';g.lineCap='round';
 if(dep){g.save();g.translate(s*.035,s*.05);path();g.lineWidth=w+s*.1;g.strokeStyle=dep;g.stroke();g.restore()}
 path();g.lineWidth=w+s*.1;g.strokeStyle=INK;g.stroke();path();g.lineWidth=w;g.strokeStyle=fill;g.stroke()}
function texto(g,t,s,fill,dep){g.font=`800 ${Math.round(s)}px ${FNT}`;g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
 g.save();g.transform(1,0,-.16,1,0,0);const y=s*.06;
 if(dep){g.lineWidth=s*.16;g.strokeStyle=dep;g.strokeText(t,s*.035,y+s*.05);g.fillStyle=dep;g.fillText(t,s*.035,y+s*.05)}
 g.lineWidth=s*.14;g.strokeStyle=INK;g.strokeText(t,0,y);g.fillStyle=fill;g.fillText(t,0,y);g.restore()}
// minicarta para +2 y +4 (rellena del color, filete blanco y contorno)
function mini(g,x,y,w,h,a,col,osc){g.save();g.translate(x,y);g.rotate(a);
 g.fillStyle='rgba(0,0,0,.25)';rr(g,-w/2+w*.06,-h/2+w*.08,w,h,w*.16);g.fill();
 g.fillStyle=INK;rr(g,-w/2-w*.07,-h/2-w*.07,w*1.14,h+w*.14,w*.2);g.fill();
 g.fillStyle=PAP;rr(g,-w/2,-h/2,w,h,w*.15);g.fill();
 const gr=g.createLinearGradient(0,-h/2,0,h/2);gr.addColorStop(0,col);gr.addColorStop(1,osc);g.fillStyle=gr;rr(g,-w/2+w*.1,-h/2+w*.1,w*.8,h-w*.2,w*.09);g.fill();
 g.save();g.rotate(.42);g.fillStyle='rgba(255,252,245,.9)';g.beginPath();g.ellipse(0,0,w*.24,h*.27,0,0,7);g.fill();g.restore();g.restore()}
// símbolo de la carta en (x,y) con tamaño s
function sym(g,c,x,y,s,fill,dep,chico){g.save();g.translate(x,y);
 if(c.t=='n'){texto(g,String(c.n),s,fill,dep);if(c.n==6||c.n==9)tinta(g,s,()=>{g.beginPath();g.moveTo(-s*.2,s*.5);g.lineTo(s*.16,s*.5)},s*.08,fill,dep)}
 else if(c.t=='s'){const r=s*.3;g.rotate(.28);tinta(g,s,()=>{g.beginPath();g.arc(0,0,r,0,7);g.moveTo(-r*.7,r*.7);g.lineTo(r*.7,-r*.7)},s*.12,fill,dep)}
 else if(c.t=='r'){const o=s*.16,t=s*.06,hw=s*.15,x0=-s*.34,xh=s*.1,x1=s*.36;   // reversa: dos flechas paralelas en sentidos opuestos
  const L=s*.36,b=s*.07,P=(x,y0,n)=>{const df=2*b*x/(L*L),k=Math.hypot(1,df);return[x-n*df/k,y0-b*(1-(x/L)**2)+n/k]};   // flechas un poco curvas (B es A girada media vuelta) e inclinadas
  const pt=()=>{g.rotate(-.95);g.beginPath();[0,1].forEach(m=>{if(m)g.rotate(Math.PI);const d=1,y=-o,ln=(x,n)=>g.lineTo(...P(x,y,n));g.moveTo(...P(x0*d,y,-t));
   for(let q=1;q<=8;q++)ln((x0+(xh-x0)*q/8)*d,-t);ln(xh*d,-hw);ln(x1*d,0);ln(xh*d,hw);for(let q=8;q>=0;q--)ln((x0+(xh-x0)*q/8)*d,t);g.closePath()})};
  g.lineJoin='round';if(dep){g.save();g.translate(s*.035,s*.05);pt();g.lineWidth=s*.1;g.strokeStyle=dep;g.stroke();g.fillStyle=dep;g.fill();g.restore()}
  pt();g.lineWidth=s*.1;g.strokeStyle=INK;g.stroke();g.fillStyle=fill;g.fill()}
 else if(c.t=='d'){if(chico)texto(g,'+2',s*.72,fill,dep);else{const w=s*.4,h=s*.6;mini(g,-s*.13,s*.08,w,h,-.18,COL[c.c],OSC[c.c]);mini(g,s*.13,-s*.08,w,h,.12,COL[c.c],OSC[c.c])}}
 else if(c.t=='f'){if(chico)texto(g,'+4',s*.72,fill,dep);else{const w=s*.34,h=s*.5;[3,2,1,0].forEach((k,i)=>mini(g,(i-1.5)*s*.15,(1.5-i)*s*.04-s*.02,w,h,(i-1.5)*.16,COL[k],OSC[k]))}}
 g.restore()}
function cara(c,o){o=o||{};const k=c.c+':'+c.t+':'+c.n+(o.cbl?'c':'');if(cache[k])return cache[k];
 const[cn,g]=cnv();dibCara(g,c,o);redib.set(cn,g=>dibCara(g,c,o));return cache[k]=cn}
function dibCara(g,c,o){const wild=c.c==4;
 if(wild)base(g,'#3A3434','#1E1A1A','#070606');else base(g,CLA[c.c],COL[c.c],OSC[c.c]);
 if(c.t=='w')ovalo4(g,TW/2,TH/2,93,150,.42,true);else if(!wild)ovalo(g,COL[c.c],OSC[c.c]);
 g.restore();
 if(c.t=='f'){g.save();g.translate(TW/2,TH/2);g.rotate(.42);[0,3,1,2].forEach((k,q)=>{g.beginPath();g.ellipse(0,0,88,145,0,(q-1)*Math.PI/2+.05,q*Math.PI/2-.05);g.lineWidth=9;g.lineCap='round';g.strokeStyle=COL[k];g.stroke()});g.restore();sym(g,c,TW/2,TH/2+4,200)}   // +4: aro de cuatro colores y cuatro minicartas
 else if(!wild)sym(g,c,TW/2,TH/2,c.t=='n'?170:c.t=='d'?190:150,COL[c.c],OSC[c.c]);
 // esquinas (la de abajo, de cabeza): grandes, blancas, con contorno
 const esq=rot=>{g.save();if(rot){g.translate(TW,TH);g.rotate(Math.PI)}
  if(c.t=='w')ovalo4(g,46,62,19,30,.42,false);else sym(g,c,c.t=='n'?46:50,62,c.t=='n'?80:c.t=='d'||c.t=='f'?74:66,PAP,wild?'#000':OSC[c.c],true);g.restore()};esq(0);esq(1);
 if(o.cbl&&!wild){g.font=`800 30px ${FNT}`;g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=7;g.strokeStyle=INK;
  [[TW-42,46,0],[42,TH-46,1]].forEach(([x,y,r])=>{g.save();g.translate(x,y);if(r)g.rotate(Math.PI);g.strokeText('RAVZ'[c.c],0,0);g.fillStyle=PAP;g.fillText('RAVZ'[c.c],0,0);g.restore()})}
 }
function dorso(){if(cache.b)return cache.b;const[cn,g]=cnv();dibDorso(g);redib.set(cn,dibDorso);return cache.b=cn}
function dibDorso(g){base(g,'#3A3434','#1E1A1A','#070606');
 g.save();g.translate(TW/2,TH/2);g.rotate(.42);g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(5,7,93,150,0,0,7);g.fill();
 const rg=g.createLinearGradient(-93,-150,93,150);rg.addColorStop(0,'#FF6A57');rg.addColorStop(.5,'#E3352E');rg.addColorStop(1,'#9E1A1A');g.fillStyle=rg;g.beginPath();g.ellipse(0,0,93,150,0,0,7);g.fill();
 g.lineWidth=4;g.strokeStyle='#F5B70C';g.beginPath();g.ellipse(0,0,82,139,0,0,7);g.stroke();g.restore();g.restore();
 g.save();g.translate(TW/2,TH/2);g.rotate(-.36);texto(g,'UNO',86,'#FFD24A','#7A1010');g.restore();}
// imagen para la vista 2D: url de un blob por carta; mientras se arma devuelve null (la vista usa la carta de CSS) y al tenerla avisa
const urls={},pend={},avU=[];let avT=0;
const kde=(c,o)=>c?c.c+':'+c.t+':'+c.n+(o&&o.cbl?'c':''):'b';
function url(c,o){const k=kde(c,o);if(urls[k])return urls[k];
 if(!pend[k]){const cn=c?cara(c,o):dorso();if(!cn.toBlob)return urls[k]=cn.toDataURL('image/png');pend[k]=1;
  cn.toBlob(b=>{delete pend[k];if(!b)return;urls[k]=URL.createObjectURL(b);clearTimeout(avT);avT=setTimeout(()=>avU.forEach(f=>{try{f()}catch(e){}}),30)},'image/png')}
 return null}
// si la fuente llega después de dibujar, se redibujan los mismos canvas y se avisa (3D: needsUpdate; 2D: volver a pintar)
const listo=()=>fuente||!document.fonts||!document.fonts.load?Promise.resolve():document.fonts.load('800 100px Nunito').then(()=>{if(fuente)return;fuente=true;
 redib.forEach((f,cn)=>{const g=cn.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cn.width,cn.height);g.setTransform(CS,0,0,CS,0,0);f(g)});for(const k in urls){if(urls[k].startsWith('blob:'))URL.revokeObjectURL(urls[k]);delete urls[k]}avisa.concat(avU).forEach(f=>{try{f()}catch(e){}})}).catch(()=>{});
listo();
window.UCART={W:TW*CS,H:TH*CS,TW,TH,COL,OSC,CLA,INK,PAP,sym,ovalo4,cara,dorso,url,listo,alListo:f=>avisa.push(f),alUrl:f=>avU.push(f)};
})();
