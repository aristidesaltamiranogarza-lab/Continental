// c_mdeal3d_kit.js — MD3K: caras de las cartas de Monopoly Deal 3D dibujadas en canvas (sin emojis), dorso y billetes del banco.
// Usa el mazo de c_monopolydeal.js (mdCAT, mdCC, mdCN, mdAN, mdRENT, mdNEED, mdLT). MD3K.cara(id) · MD3K.billete(v) · MD3K.dorso() → canvas;
// MD3K.url(id) → imagen para la interfaz; MD3K.ACOL[k] color de cada acción; MD3K.TW/TH tamaño de la textura.
(function(){
if(typeof mdCAT=='undefined')return;
const TW=256,TH=384,S=matchMedia('(pointer:coarse)').matches?2:3,C={},F='"Nunito","Segoe UI",Arial,sans-serif';
const ACOL={tratosucio:'#7a3fa0',dino:'#c0392b',ladron:'#2d6a8a',forzoso:'#c47a12',cobro:'#2e7d4f',cumple:'#d0507a',salida:'#1f8a8a',casa:'#3f8f3a',hotel:'#b8312f',doble:'#c9971a'};
const ADES={tratosucio:'Roba un set completo a un rival.',dino:'Anula una acción en tu contra.',ladron:'Roba una propiedad de un set sin completar.',forzoso:'Cambia una propiedad tuya por una de un rival.',
 cobro:'Un rival te paga $5M.',cumple:'Cada rival te paga $2M.',salida:'Roba 2 cartas.',casa:'Súmale $3M de renta a un set completo.',hotel:'Súmale $4M de renta a un set con casa.',doble:'Juégala con una renta: cobra el doble.'};
const BILL={1:['#efe6c8','#7a6526'],2:['#f4cdd6','#9c3550'],3:['#d3e8c3','#3c6e2c'],4:['#c3dcf0','#265d8a'],5:['#dccdee','#5b3a8a'],10:['#f7d6a0','#9a5a0c']};
function cnv(s){s=s||S;const c=document.createElement('canvas');c.width=TW*s;c.height=TH*s;c.getContext('2d').scale(s,s);return c}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
// texto que cabe en w (baja el tamaño)
function fit(g,t,x,y,w,px,wt,col,al){let s=px;g.font=`${wt||800} ${s}px ${F}`;while(s>10&&g.measureText(t).width>w){s--;g.font=`${wt||800} ${s}px ${F}`}g.fillStyle=col;g.textAlign=al||'center';g.textBaseline='middle';g.fillText(t,x,y)}
function wrap(g,t,w){const ws=t.split(' '),L=[];let l='';ws.forEach(p=>{const q=l?l+' '+p:p;if(g.measureText(q).width>w&&l){L.push(l);l=p}else l=q});if(l)L.push(l);return L}
function base(g,bg){g.fillStyle='#fffdf8';rr(g,0,0,TW,TH,22);g.fill();g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=2;rr(g,1,1,TW-2,TH-2,21);g.stroke();
 if(bg){g.fillStyle=bg;rr(g,12,12,TW-24,TH-24,14);g.fill()}}
// valor (como dinero) en la esquina de arriba
function val(g,v,ink){if(!v)return;g.beginPath();g.arc(40,40,25,0,7);g.fillStyle='#fffdf8';g.fill();g.lineWidth=4;g.strokeStyle=ink||'#3a2416';g.stroke();fit(g,v+'M',40,41,40,22,900,ink||'#3a2416')}
function rents(g,c,x0,x1,y0,y1,ink){const n=mdNEED[c],dy=(y1-y0)/n;
 for(let j=0;j<n;j++){const y=y0+dy*(j+.5),last=j==n-1;g.fillStyle=last?'rgba(0,0,0,.06)':'transparent';if(last){rr(g,x0-6,y-dy/2+3,x1-x0+12,dy-6,8);g.fill()}
  fit(g,(j+1)+(j?' cartas':' carta')+(last?' (set)':''),x0,y,(x1-x0)*.66,22,last?900:700,ink,'left');fit(g,'$'+mdRENT[c][j]+'M',x1,y,(x1-x0)*.3,24,900,ink,'right')}}
function prop(g,c){base(g);g.fillStyle=mdCC[c];rr(g,14,14,TW-28,104,14);g.fill();const tc=mdLT[c]?'#1b1b1b':'#ffffff';
 fit(g,'PROPIEDAD',TW/2,40,TW-110,15,800,tc);return tc}
function wild2(g,c){base(g);const [a,b]=c.cs;g.save();
 [[a,0],[b,1]].forEach(([col,rot])=>{g.save();if(rot){g.translate(TW,TH);g.rotate(Math.PI)}g.fillStyle=mdCC[col];rr(g,14,14,TW-28,124,14);g.fill();const tc=mdLT[col]?'#1b1b1b':'#fff';
  fit(g,mdCN[col].toUpperCase(),TW/2,42,TW-100,26,900,tc);fit(g,mdRENT[col].map(x=>'$'+x).join(' · '),TW/2,84,TW-50,22,800,tc);fit(g,'renta',TW/2,112,TW-60,15,700,tc);g.restore()});
 g.restore();fit(g,'COMODÍN',TW/2,TH/2,TW-50,32,900,'#3a2416')}
function rainbow(g,x,y,w,h){const n=10;g.save();rr(g,x,y,w,h,14);g.clip();for(let i=0;i<n;i++){g.fillStyle=mdCC[i];g.beginPath();const a=x-h+i*(w+h)/n,b=a+(w+h)/n+1;g.moveTo(a,y+h);g.lineTo(a+h,y);g.lineTo(b+h,y);g.lineTo(b,y+h);g.fill()}g.restore()}
function action(g,c,full){base(g);const cy=full?170:TH/2+24,r=full?86:100;const col=ACOL[c.k]||'#555';
 g.fillStyle=col;rr(g,14,14,TW-28,52,14);g.fill();fit(g,'ACCIÓN',TW/2+18,41,TW-110,20,900,'#fff');
 g.beginPath();g.arc(TW/2,cy,r,0,7);g.fillStyle=col;g.fill();g.lineWidth=7;g.strokeStyle='#fffdf8';g.stroke();g.beginPath();g.arc(TW/2,cy,r+10,0,7);g.lineWidth=3;g.strokeStyle=col;g.stroke();
 const t=mdAN[c.k].toUpperCase(),fs=full?30:36;g.font=`900 ${fs}px ${F}`;const L=wrap(g,t,r*1.65);L.forEach((l,i)=>fit(g,l,TW/2,cy+(i-(L.length-1)/2)*(fs+2),r*1.75,fs,900,'#fff'));
 if(!full)return;g.font=`700 19px ${F}`;wrap(g,ADES[c.k]||'',TW-56).slice(0,3).forEach((l,i)=>fit(g,l,TW/2,298+i*24,TW-50,19,700,'#5b4535'))}
function rent(g,c,full){base(g);g.fillStyle='#3a2416';rr(g,14,14,TW-28,52,14);g.fill();fit(g,'RENTA',TW/2+18,41,TW-110,22,900,'#fff');
 const cx=TW/2,cy=full?172:TH/2+24,r=full?84:100;
 if(c.cs=='any')for(let i=0;i<10;i++){g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,r,i/10*Math.PI*2-Math.PI/2,(i+1)/10*Math.PI*2-Math.PI/2);g.closePath();g.fillStyle=mdCC[i];g.fill()}
 else c.cs.forEach((x,i)=>{g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,r,Math.PI/2+i*Math.PI,Math.PI*1.5+i*Math.PI);g.closePath();g.fillStyle=mdCC[x];g.fill()});
 g.beginPath();g.arc(cx,cy,r,0,7);g.lineWidth=6;g.strokeStyle='#fffdf8';g.stroke();g.beginPath();g.arc(cx,cy,r*.52,0,7);g.fillStyle='#fffdf8';g.fill();fit(g,'$',cx,cy+2,r*.7,full?48:58,900,'#3a2416');if(!full)return;
 const d=c.cs=='any'?'Cobra renta de un color a un rival.':'Cobra renta de '+c.cs.map(x=>mdCN[x].toLowerCase()).join(' o ')+' a todos.';
 g.font=`700 19px ${F}`;wrap(g,d,TW-56).slice(0,3).forEach((l,i)=>fit(g,l,TW/2,298+i*24,TW-50,19,700,'#5b4535'))}
function bill(g,v){const [bg,ink]=BILL[v]||BILL[1];base(g,bg);g.strokeStyle=ink;g.globalAlpha=.35;g.lineWidth=3;rr(g,26,26,TW-52,TH-52,12);g.stroke();g.globalAlpha=1;
 g.beginPath();g.ellipse(TW/2,TH/2,78,104,0,0,7);g.fillStyle='rgba(255,255,255,.55)';g.fill();g.lineWidth=4;g.strokeStyle=ink;g.stroke();
 fit(g,'$'+v+'M',TW/2,TH/2,140,v>9?62:74,900,ink);
 [[44,46,0],[TW-44,TH-46,1]].forEach(([x,y,r])=>{g.save();g.translate(x,y);if(r)g.rotate(Math.PI);fit(g,'$'+v+'M',0,0,64,28,900,ink);g.restore()});
 fit(g,'BANCO',TW/2,TH/2+128,120,18,800,ink)}
function cara(id,full){const k='c'+id+(full?'f':'');if(C[k])return C[k];const c=mdCAT[id],cn=cnv(full?4:0),g=cn.getContext('2d');
 if(c.t=='m')bill(g,c.v);
 else if(c.t=='p'){const tc=prop(g,c.c);fit(g,c.n.toUpperCase(),TW/2,82,TW-44,30,900,tc);fit(g,'RENTA',TW/2,140,TW-60,18,800,'#6e4f3a');rents(g,c.c,30,TW-30,158,TH-56,'#3a2416');
  fit(g,mdCN[c.c],TW/2,TH-34,TW-60,18,700,'#6e4f3a');val(g,c.v)}
 else if(c.t=='w'){if(c.cs=='any'){base(g);rainbow(g,14,14,TW-28,TH-28);g.fillStyle='rgba(255,253,248,.94)';rr(g,30,110,TW-60,164,16);g.fill();
   fit(g,'COMODÍN',TW/2,158,TW-80,34,900,'#3a2416');fit(g,'multicolor',TW/2,196,TW-80,24,800,'#6e4f3a');if(full){fit(g,'Sirve de cualquier color.',TW/2,232,TW-80,17,700,'#6e4f3a');fit(g,'No vale como dinero.',TW/2,254,TW-80,17,700,'#6e4f3a')}}
  else{wild2(g,c);val(g,c.v)}}
 else if(c.t=='a'){action(g,c,full);val(g,c.v)}
 else{rent(g,c,full);val(g,c.v)}
 if(c.t=='a')ilustra(cn,c.k,full);return C[k]=cn}
function billete(v){const k='b'+v;if(C[k])return C[k];const cn=cnv();bill(cn.getContext('2d'),v);return C[k]=cn}
function dorso(){if(C.d)return C.d;const cn=cnv(),g=cn.getContext('2d');base(g);g.save();rr(g,12,12,TW-24,TH-24,14);g.clip();
 const gr=g.createRadialGradient(TW/2,TH/2,20,TW/2,TH/2,TH*.7);gr.addColorStop(0,'#2f63a8');gr.addColorStop(1,'#122c55');g.fillStyle=gr;g.fillRect(0,0,TW,TH);
 g.strokeStyle='rgba(255,226,160,.55)';g.lineWidth=4;rr(g,28,28,TW-56,TH-56,12);g.stroke();
 g.translate(TW/2,TH/2);g.rotate(-.42);g.fillStyle='#d7263d';g.beginPath();g.ellipse(0,0,96,62,0,0,7);g.fill();g.lineWidth=6;g.strokeStyle='#fffdf8';g.stroke();
 g.font=`italic 900 52px ${F}`;g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=8;g.strokeStyle='#7d0f1d';g.strokeText('DEAL',0,3);g.fillStyle='#fff';g.fillText('DEAL',0,3);
 g.restore();return C.d=cn}
const U={};
// caras ilustradas (CARTA2D, mismo 2:3): se dibujan aparte una vez y reemplazan la cara de cada acción en su mismo lienzo; avisa con el evento md3k-arte
const ART={},TODAS=[];let artIni=false,artCod=null;
const ak=(k,full)=>k+(full?'f':'');
function pinta(cn,k,full){const a=ART[ak(k,full)];if(!a)return false;const g=cn.getContext('2d');g.save();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cn.width,cn.height);g.drawImage(a,0,0,cn.width,cn.height);g.restore();return true}
// dibuja todas las ilustradas con el personaje del jugador; al cambiarlo (evento av-mio) se vuelven a dibujar
// Dibujar una cuesta ~0.4 s (más en celular): se guardan con CIMG por versión (código de CARTA2D/AV2D/AV + tu personaje) y se dibujan
// una por tarea, primero las chicas (mano y mesa) y luego las grandes, para no trabar la entrada ni el reparto.
const respira=()=>new Promise(r=>setTimeout(r,0));
function avisa(){TODAS.forEach(([c,n,f])=>pinta(c,n,f));for(const u in U){const id=+String(u).replace('f','');if(mdCAT[id]&&mdCAT[id].t=='a')delete U[u]}dispatchEvent(new Event('md3k-arte'))}
async function arte(){const cod=(()=>{try{return localStorage.cont_av}catch(e){}})();if(artIni&&cod===artCod)return;artIni=true;artCod=cod;
 try{const C=window.CIMG,ver=C?(await C.ver(/c_carta2d|c_av2d|c_avatar\.js/))+'_'+(cod||''):'';let av=false;
  for(const full of [false,true]){for(const n in CARTA2D.CARTAS){if(cod!==artCod)return;const key=ak(n,full);let im=C?await C.saca('carta',ver,key,'bmp'):null;
    if(!im){if(!av){await AV.listo();av=true}await respira();im=await CARTA2D.dibuja(n,{full});if(C)C.pon('carta',ver,key,im)}
    ART[ak(n,full)]=im}
   if(cod!==artCod)return;avisa();await respira()}}catch(e){console.warn('[MD3K] cartas ilustradas',e)}}
function ilustra(cn,k,full){TODAS.push([cn,k,!!full]);if(pinta(cn,k,full))return;if(!artIni&&window.CARTA2D&&window.AV2D&&window.AV)arte()}
addEventListener('av-mio',()=>{if(artIni)arte()});
window.MD3K={TW,TH,ACOL,BILL,cara,billete,dorso,url:id=>U[id]||(U[id]=cara(id).toDataURL()),
 desc:id=>{const c=mdCAT[id];return c.t=='a'?ADES[c.k]||'':''},
 grande:id=>U['f'+id]||(U['f'+id]=cara(id,true).toDataURL())};   // grande: la cara completa (con descripción) para verla de cerca
})();
