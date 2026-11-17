// c_carta2d.js — CARTA2D: cartas ilustradas en 2D, estilo minimalista (personaje de AV2D + pocos objetos, sin fondo).
//   CARTA2D.dibuja('cumple',{cod}).then(cv=>...)   CARTA2D.ver('cumple') la muestra; ?carta=cumple o ?carta=todas (galería)
(function(){
const TINTA='#3A2416',W=750,H=1125,LW=6;
const COL={papel:'#FDF5E8',panel:'#F7EAD5',filo:'#C4532D',sub:'#7A5A44',crema:'#F3E6D0',teal:'#2F7478',rosa:'#E3A3A0',vela:['#2F7478','#C4532D','#8DB596'],flama:'#E8A33A'};
const PAN={x:100,y:150,w:550,h:650,r:30};
const FUENTE="'Nunito',system-ui,sans-serif";
function rr(x,X,Y,w,h,r){x.beginPath();x.roundRect(X,Y,w,h,r)}
function trazo(x,relleno){if(relleno){x.fillStyle=relleno;x.fill()}x.strokeStyle=TINTA;x.lineWidth=LW;x.lineJoin=x.lineCap='round';x.stroke()}
// punto más alto de la silueta (para el gorro)
function cima(cv){const x=cv.getContext('2d'),d=x.getImageData(0,0,cv.width,cv.height).data;
 for(let y=0;y<cv.height;y++){let a=-1,b=-1;for(let i=0;i<cv.width;i++)if(d[(y*cv.width+i)*4+3]>128){if(a<0)a=i;b=i}if(a>=0)return {x:(a+b)/2,y}}return {x:cv.width/2,y:0}}
function gorro(x,cx,cy,s){x.save();x.translate(cx,cy);x.rotate(.18);const w=78*s,h=118*s;
 x.beginPath();x.moveTo(-w/2,0);x.lineTo(0,-h);x.lineTo(w/2,0);x.quadraticCurveTo(0,10*s,-w/2,0);x.closePath();
 x.save();x.clip();x.fillStyle=COL.teal;x.fillRect(-w,-h-10,w*2,h+30);x.fillStyle=COL.crema;
 for(const t of [.3,.62]){x.save();x.translate(0,-h*t);x.rotate(-.35);x.fillRect(-w,-9*s,w*2,18*s);x.restore()}x.restore();trazo(x);
 x.beginPath();x.arc(0,-h,13*s,0,Math.PI*2);trazo(x,COL.crema);x.restore()}
function pastel(x,cx,cy,s){const w=190*s,h=78*s;
 for(let i=0;i<3;i++){const vx=cx+(i-1)*48*s;rr(x,vx-8*s,cy-h-50*s,16*s,52*s,5*s);trazo(x,COL.vela[i]);
  x.beginPath();x.ellipse(vx,cy-h-66*s,9*s,14*s,0,0,Math.PI*2);trazo(x,COL.flama)}
 rr(x,cx-w/2,cy-h,w,h,14*s);trazo(x,COL.rosa);
 x.beginPath();x.moveTo(cx-w/2+6*s,cy-h+4*s);const n=5;for(let i=0;i<n;i++){const a=cx-w/2+6*s+i*(w-12*s)/n,b=a+(w-12*s)/n;x.lineTo(a,cy-h+14*s);x.quadraticCurveTo((a+b)/2,cy-h+(i%2?30:38)*s,b,cy-h+14*s)}
 x.lineTo(cx+w/2-6*s,cy-h+4*s);x.quadraticCurveTo(cx,cy-h-6*s,cx-w/2+6*s,cy-h+4*s);x.closePath();trazo(x,'#FFFDF8');
 rr(x,cx-w/2-26*s,cy-2*s,w+52*s,14*s,7*s);trazo(x,'#FFFDF8')}
function suelo(cv){const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;for(let y=cv.height-1;y>=0;y--)for(let i=0;i<cv.width;i++)if(d[(y*cv.width+i)*4+3]>128)return y;return cv.height}
// pose armada moviendo huesos: [eje, ángulo] que se suma
const POSES={camina:{muslo_D:['x',-.7],muslo_I:['x',.6],pierna_I:['x',-.45],pierna_D:['x',0],brazo_D:['y',.55],brazo_I:['y',.75],antebrazo_D:['y',.3],antebrazo_I:['y',-.15],cabeza:['y',-.3]},
 alto:{brazo_I:['y',-1.4]},arriba:{brazo_D:['z',-2.6],antebrazo_D:['z',-.35]},sigilo:{columna:['x',.28],cabeza:['y',.7]},firme:{cabeza:['x',-.08]},
 pastel:{brazo_I:[['z',-.5],['x',-.5]],antebrazo_I:['z',-.8]}};
const pose=nom=>p=>{const b={};p.traverse(o=>{if(o.isBone)b[o.name]=o});for(const [k,v] of Object.entries(POSES[nom]))if(b[k])for(const [ax,a] of Array.isArray(v[0])?v:[v])b[k].rotation[ax]+=a};
// sonrisa leve: dobla la boca visible (geometría en [-1,1] de ancho) subiendo las comisuras k
const sonrisa=(k=.16)=>p=>p.traverse(o=>{if(!o.visible||!/^Boca_/.test(o.name))return;const g=o.geometry.clone(),a=g.attributes.position;
 for(let i=0;i<a.count;i++){const x=a.getX(i);a.setY(i,a.getY(i)+k*(x*x-.35))}a.needsUpdate=true;o.geometry=g});
const junta=(...fs)=>(p,T)=>fs.forEach(f=>f&&f(p,T));
// piso común: banda más oscura bajo los pies y sombra
function piso(x,fy,col){x.fillStyle=col;x.fillRect(PAN.x,fy,PAN.w,PAN.y+PAN.h-fy);x.beginPath();x.moveTo(PAN.x,fy);x.lineTo(PAN.x+PAN.w,fy);x.strokeStyle=TINTA;x.lineWidth=4;x.stroke();
}
function meta(x,cx,y,w,s){const n=16,m=2,cw=w/n,ch=10*s;x.save();x.beginPath();x.rect(cx-w/2,y-ch*m/2,w,ch*m);x.fillStyle='#FFFDF8';x.fill();x.clip();x.fillStyle=TINTA;
 for(let i=0;i<n;i++)for(let j=0;j<m;j++)if((i+j)%2)x.fillRect(cx-w/2+i*cw,y-ch*m/2+j*ch,cw+.5,ch+.5);x.restore();x.beginPath();x.rect(cx-w/2,y-ch*m/2,w,ch*m);trazo(x)}
function marco(x,o,fa){x.fillStyle=TINTA;rr(x,0,0,W,H,46);x.fill();x.fillStyle=COL.papel;rr(x,7,7,W-14,H-14,40);x.fill();
 x.strokeStyle=COL.filo;x.lineWidth=2.5;rr(x,28,28,W-56,H-56,26);x.stroke();
 x.beginPath();x.arc(96,94,50,0,Math.PI*2);x.fillStyle=COL.filo;x.fill();x.lineWidth=5;x.strokeStyle=TINTA;x.stroke();
 x.fillStyle='#FFF';x.font=`900 38px ${FUENTE}`;x.textAlign='center';x.textBaseline='middle';x.fillText(o.valor,96,96);
 x.fillStyle=COL.filo;x.font=`900 46px ${FUENTE}`;x.fillText(o.tipo.toUpperCase(),W/2+30,96)}
// parte un texto en renglones que quepan en w con la letra de tamaño t
function renglones(x,txt,t,w){x.font=`900 ${t}px ${FUENTE}`;const r=[];let l='';for(const p of txt.split(' ')){const n=l?l+' '+p:p;if(l&&x.measureText(n).width>w){r.push(l);l=p}else l=n}r.push(l);return r}
// título grande enmarcado abajo (como el de la renta multicolor); con full también la descripción (solo al verla en grande)
const CAJA={x:64,y:760,w:622,h:300};
function titulo(x,o,fa,full){rr(x,CAJA.x,CAJA.y,CAJA.w,CAJA.h,26);x.fillStyle='#FFFDF8';x.fill();x.strokeStyle=TINTA;x.lineWidth=6;x.stroke();
 rr(x,CAJA.x+12,CAJA.y+12,CAJA.w-24,CAJA.h-24,18);x.strokeStyle=fa.piso;x.lineWidth=5;x.stroke();
 const mw=CAJA.w-70;let t=full?76:112,r;for(;t>40;t-=4){r=renglones(x,o.titulo,t,mw);if(r.length<=2&&r.every(l=>x.measureText(l).width<=mw))break}
 const lh=t*1.02,dl=full?o.texto.length:0,dh=42,hh=r.length*lh+(dl?18+dl*dh:0);let y=CAJA.y+CAJA.h/2-hh/2+lh/2;
 x.fillStyle=TINTA;x.textAlign='center';x.textBaseline='middle';x.font=`900 ${t}px ${FUENTE}`;r.forEach(l=>{x.fillText(l,W/2,y);y+=lh});
 if(dl){y+=18-lh/2+dh/2;x.fillStyle=COL.sub;x.font=`800 36px ${FUENTE}`;o.texto.forEach(l=>{x.fillText(l,W/2,y);y+=dh})}}
// familias: color del panel y del piso (cobro ámbar, robar/mover verde, defensa azul)
const FAM={cobro:{panel:'#F6E3BC',piso:'#EBCD96'},mueve:{panel:'#E1ECD4',piso:'#C6DBB1'},defensa:{panel:'#DCE7EF',piso:'#BCD1E1'}};
// personaje de cuerpo entero, misma escala en todas (marco fijo en metros) y pies en FY; P(hueso) da su punto en la carta
const MARCO=[-.05,3],LADO=(MARCO[1]-MARCO[0])*1.088,CY=(MARCO[0]+MARCO[1])/2,TAM=590,FY=735;
const HUESOS=['mano_D','mano_I','dedos2_D','dedos2_I','cabeza','pie_D','pie_I'];
async function figura(x,o,{pose:ps='Reposo',giro=.25,extra,dx=0}={}){const pts={},tam=TAM;
 const cap=(p,T)=>{p.updateMatrixWorld(true);const v=new T.Vector3();p.traverse(b=>{if(b.isBone&&HUESOS.includes(b.name)){b.getWorldPosition(v);pts[b.name]=[v.x/LADO*tam+tam/2,tam/2-(v.y-CY)/LADO*tam]}})};
 const cv=await AV2D.retrato(o.cod,{tam,plano:'cuerpo',giro,pose:ps,fondo:null,marco:MARCO,extra:junta(extra,cap)});
 const X=W/2-tam/2+dx,Y=FY-suelo(cv)+6,P=n=>({x:X+pts[n][0],y:Y+pts[n][1]}),c=cima(cv),k=tam/540;
 x.fillStyle='rgba(58,36,22,.14)';x.beginPath();x.ellipse((P('pie_D').x+P('pie_I').x)/2,FY+2,105*k,13,0,0,Math.PI*2);x.fill();   // sombra igual en todas
 x.drawImage(cv,X,Y);return {X,Y,k,P,cima:{x:X+c.x,y:Y+c.y},manos:()=>{const a=P('mano_D'),b=P('mano_I');return {x:(a.x+b.x)/2,y:(a.y+b.y)/2}}}}
function texto(x,t,cx,cy,px,col){x.font=`900 ${px}px ${FUENTE}`;x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';x.lineWidth=LW;x.strokeStyle=TINTA;x.strokeText(t,cx,cy);x.fillStyle=col;x.fillText(t,cx,cy)}
function carta(x,cx,cy,ang,s,col){const w=74*s,h=104*s;x.save();x.translate(cx,cy);x.rotate(ang);rr(x,-w/2,-h/2,w,h,9*s);x.fillStyle='#FFFDF8';x.fill();
 x.save();x.clip();x.fillStyle=col;x.fillRect(-w/2,-h/2,w,30*s);x.globalAlpha=.22;x.fillStyle=TINTA;for(let i=0;i<3;i++)x.fillRect(-w/2+12*s,-h/2+44*s+i*16*s,w-24*s-(i==2?18*s:0),5*s);x.restore();
 x.beginPath();x.moveTo(-w/2,-h/2+30*s);x.lineTo(w/2,-h/2+30*s);x.strokeStyle=TINTA;x.lineWidth=3;x.stroke();rr(x,-w/2,-h/2,w,h,9*s);trazo(x);x.restore()}
function billete(x,cx,cy,ang,s){const w=130*s,h=66*s;x.save();x.translate(cx,cy);x.rotate(ang);rr(x,-w/2,-h/2,w,h,8*s);trazo(x,'#9CC58A');
 rr(x,-w/2+9*s,-h/2+9*s,w-18*s,h-18*s,5*s);x.strokeStyle=TINTA;x.lineWidth=2.5;x.stroke();x.beginPath();x.arc(0,0,17*s,0,Math.PI*2);trazo(x,'#EAF3DF');
 x.fillStyle=TINTA;x.font=`900 ${19*s}px ${FUENTE}`;x.textAlign='center';x.textBaseline='middle';x.fillText('M',0,s);x.restore()}
function maletin(x,cx,ty,s){const w=150*s,h=104*s,y=ty+30*s;
 x.beginPath();x.moveTo(cx-28*s,y+4*s);x.lineTo(cx-28*s,ty+12*s);x.quadraticCurveTo(cx-28*s,ty,cx-14*s,ty);x.lineTo(cx+14*s,ty);x.quadraticCurveTo(cx+28*s,ty,cx+28*s,ty+12*s);x.lineTo(cx+28*s,y+4*s);
 x.strokeStyle=TINTA;x.lineWidth=16*s;x.stroke();x.strokeStyle='#6B3F22';x.lineWidth=7*s;x.stroke();
 billete(x,cx+34*s,y+6*s,-.3,.8*s);rr(x,cx-w/2,y,w,h,12*s);trazo(x,'#8A5532');
 x.beginPath();x.moveTo(cx-w/2,y+34*s);x.lineTo(cx+w/2,y+34*s);x.strokeStyle=TINTA;x.lineWidth=4;x.stroke();rr(x,cx-13*s,y+24*s,26*s,22*s,5*s);trazo(x,'#E8A33A')}
// edificios en perspectiva: o=origen en pantalla, s=escala; frente = cara z=d (abajo a la derecha), lado = cara x=w (abajo a la izquierda)
const C30=Math.cos(Math.PI/6),KV=.3;   // KV: cuánto se ve desde arriba (más chico = ángulo más bajo)
const iso=(o,s)=>(X,Y,Z)=>[o.x+(X-Z)*C30*s,o.y-Y*s+(X+Z)*KV*s];
function cara4(x,pts,col,lw){x.beginPath();pts.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.closePath();x.fillStyle=col;x.fill();x.strokeStyle=TINTA;x.lineWidth=lw||LW;x.lineJoin='round';x.stroke()}
// rectángulo sobre la cara de frente (z fijo) o de lado (x fijo): u a lo largo, v hacia arriba
const enFrente=(P,z)=>(u0,v0,u1,v1)=>[P(u0,v0,z),P(u1,v0,z),P(u1,v1,z),P(u0,v1,z)];
const enLado=(P,X)=>(u0,v0,u1,v1)=>[P(X,v0,u0),P(X,v0,u1),P(X,v1,u1),P(X,v1,u0)];
function sombraIso(x,P,w,d,m){x.beginPath();[P(-m,0,-m),P(w+m,0,-m),P(w+m,0,d+m),P(-m,0,d+m)].forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.closePath();x.fillStyle='rgba(58,36,22,.14)';x.fill()}
function lugar(w,d,s,yb){return {x:W/2-(w-d)/2*C30*s,y:yb-(w+d)*KV*s}}   // base centrada, punto más bajo en yb
function casaIso(x){const w=1,d=1.25,h=.78,rh=.62,ov=.1,s=228,P=iso(lugar(w,d,s,765),s),F=enFrente(P,d),Ld=enLado(P,w),cr='#F3E6D0';
 sombraIso(x,P,w,d,.12);
 cara4(x,[P(w,0,0),P(w,0,d),P(w,h,d),P(w,h,0)],'#4E9A54');                                   // lado
 const eh=h-.08,t=.09;
 cara4(x,[P(-ov,eh,-ov),P(-ov,eh,d+ov),P(w/2,h+rh,d+ov),P(w/2,h+rh,-ov)],'#24552E');               // agua de atrás (asoma a la izquierda)
 cara4(x,[P(0,0,d),P(w,0,d),P(w,h,d),P(w/2,h+rh,d),P(0,h,d)],'#6DB46F');                     // frente con su triángulo
 cara4(x,[P(w/2,h+rh,-ov),P(w/2,h+rh,d+ov),P(w+ov,eh,d+ov),P(w+ov,eh,-ov)],'#2F6B3A');           // agua de enfrente
 cara4(x,[P(-ov,eh,d+ov),P(w/2,h+rh,d+ov),P(w+ov,eh,d+ov),P(w+ov,eh-t,d+ov),P(w/2,h+rh-t*1.5,d+ov),P(-ov,eh-t,d+ov)],'#24552E');   // alero del frente
 cara4(x,F(.38,0,.62,.46),cr);cara4(x,F(.1,.42,.28,.62),cr,4);cara4(x,F(.72,.42,.9,.62),cr,4);
 cara4(x,Ld(.18,.4,.48,.62),cr,4);cara4(x,Ld(.78,.4,1.08,.62),cr,4)}
function hotelIso(x){const w=1.55,d=1,h=1.45,s=200,P=iso(lugar(w,d,s,765),s),F=enFrente(P,d),Ld=enLado(P,w),cr='#F3E6D0';
 sombraIso(x,P,w,d,.12);
 cara4(x,[P(w,0,0),P(w,0,d),P(w,h,d),P(w,h,0)],'#B23F36');
 cara4(x,[P(0,0,d),P(w,0,d),P(w,h,d),P(0,h,d)],'#D0574C');
 cara4(x,[P(0,h,0),P(w,h,0),P(w,h,d),P(0,h,d)],'#8A2E3B');
 cara4(x,[P(.12,h,.12),P(w-.12,h,.12),P(w-.12,h,d-.12),P(.12,h,d-.12)],'#6E2430',4);          // azotea
 for(let j=0;j<3;j++){const v=.42+j*.33;for(let i=0;i<4;i++){const u=.12+i*.36;cara4(x,F(u,v,u+.2,v+.2),cr,4)}for(let i=0;i<3;i++){const u=.1+i*.3;cara4(x,Ld(u,v,u+.17,v+.2),cr,4)}}
 cara4(x,F(.6,0,.95,.3),cr)}
// prohibido: aro rojo con la barra cruzada
function prohibido(x,cx,cy,r){x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.fillStyle='#FFFDF8';x.fill();
 const ring=(lw,col)=>{x.beginPath();x.arc(cx,cy,r-lw/2,0,Math.PI*2);x.strokeStyle=col;x.lineWidth=lw;x.stroke()},a=Math.PI/4,q=r*.78;
 x.save();x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.clip();x.beginPath();x.moveTo(cx-q*Math.cos(a),cy-q*Math.sin(a));x.lineTo(cx+q*Math.cos(a),cy+q*Math.sin(a));x.strokeStyle='#D0473B';x.lineWidth=r*.26;x.lineCap='butt';x.stroke();x.restore();
 ring(r*.24,'#D0473B');x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.strokeStyle=TINTA;x.lineWidth=LW;x.stroke();x.beginPath();x.arc(cx,cy,r*.76,0,Math.PI*2);x.lineWidth=4;x.stroke()}
// flecha curva de (x0,y0) a (x1,y1), panza b (perpendicular)
function flechaC(x,x0,y0,x1,y1,b,s){const mx=(x0+x1)/2,my=(y0+y1)/2,l=Math.hypot(x1-x0,y1-y0),nx=-(y1-y0)/l,ny=(x1-x0)/l,qx=mx+nx*b,qy=my+ny*b;
 x.beginPath();x.moveTo(x0,y0);x.quadraticCurveTo(qx,qy,x1,y1);x.lineCap='round';x.strokeStyle=TINTA;x.lineWidth=17*s;x.stroke();x.strokeStyle=COL.teal;x.lineWidth=7*s;x.stroke();
 const t=Math.atan2(y1-qy,x1-qx);x.save();x.translate(x1,y1);x.rotate(t-Math.PI/2);x.beginPath();x.moveTo(-19*s,-6*s);x.lineTo(19*s,-6*s);x.lineTo(0,18*s);x.closePath();trazo(x,COL.teal);x.restore()}
// flecha en arco de circulo (cx,cy,r) de a0 a a1 (sentido horario)
function flechaA(x,cx,cy,r,a0,a1,s){x.beginPath();x.arc(cx,cy,r,a0,a1);x.lineCap='round';x.strokeStyle=TINTA;x.lineWidth=17*s;x.stroke();x.strokeStyle=COL.teal;x.lineWidth=7*s;x.stroke();
 x.save();x.translate(cx+r*Math.cos(a1),cy+r*Math.sin(a1));x.rotate(a1);x.beginPath();x.moveTo(-19*s,-6*s);x.lineTo(19*s,-6*s);x.lineTo(0,18*s);x.closePath();trazo(x,COL.teal);x.restore()}
// contrato: hoja con renglones, firma y sello
function contrato(x,cx,cy,ang,s){const w=150*s,h=190*s;x.save();x.translate(cx,cy);x.rotate(ang);rr(x,-w/2,-h/2,w,h,10*s);trazo(x,'#FFFDF8');
 x.fillStyle=TINTA;x.fillRect(-w/2+22*s,-h/2+22*s,w-44*s,8*s);x.globalAlpha=.22;for(let i=0;i<4;i++)x.fillRect(-w/2+20*s,-h/2+48*s+i*18*s,w-40*s-(i==3?30*s:0),5*s);x.globalAlpha=1;
 x.beginPath();x.moveTo(-w/2+20*s,h/2-34*s);x.bezierCurveTo(-w/2+34*s,h/2-58*s,-w/2+40*s,h/2-14*s,-w/2+54*s,h/2-36*s);x.bezierCurveTo(-w/2+62*s,h/2-48*s,-w/2+66*s,h/2-26*s,-w/2+80*s,h/2-34*s);x.strokeStyle=TINTA;x.lineWidth=3.5*s;x.lineCap='round';x.stroke();
 x.beginPath();x.arc(w/2-34*s,h/2-36*s,19*s,0,Math.PI*2);trazo(x,'#D0473B');x.restore()}
// mano de miton dibujada encima de un objeto (color tomado del retrato antes de taparla)
function piel(x,p){const d=x.getImageData(Math.round(p.x),Math.round(p.y),1,1).data;return `rgb(${d[0]},${d[1]},${d[2]})`}
function miton(x,p,r,col,ang=0){x.save();x.translate(p.x,p.y);x.rotate(ang);x.beginPath();x.ellipse(0,0,r*1.12,r*.88,0,0,Math.PI*2);trazo(x,col);x.restore()}
function insignia(x,cx,cy,txt,s){x.beginPath();x.arc(cx,cy,56*s,0,Math.PI*2);trazo(x,'#E8A33A');texto(x,txt,cx,cy+3*s,56*s,'#FFFDF8')}
const CARTAS={
 cumple:{fam:'cobro',valor:'2M',tipo:'Acción',titulo:'Es mi cumpleaños',texto:['Cada jugador','te da 2M de regalo'],
  async arte(x,o){const f=await figura(x,o,{pose:'AgarreFrente',extra:junta(pose('pastel'),sonrisa())}),k=f.k,m=f.manos();
   gorro(x,f.cima.x+16*k,f.cima.y+44*k,1.05*k);pastel(x,m.x,m.y+16*k,.6*k)}},
 salida:{fam:'mueve',valor:'1M',tipo:'Acción',titulo:'Pasa por la salida',texto:['Roba 2 cartas','del mazo'],
  async arte(x,o){meta(x,W/2,FY,PAN.w,1);await figura(x,o,{giro:1.25,extra:junta(pose('camina'),sonrisa(.2)),dx:-40})}},
 dino:{fam:'defensa',valor:'4M',tipo:'Acción',titulo:'Di que no',texto:['Anula una acción','en tu contra'],
  async arte(x,o){const f=await figura(x,o,{giro:.9,extra:pose('alto'),dx:-80}),k=f.k;prohibido(x,f.cima.x+200*k,f.cima.y+75*k,72*k)}},
 ladron:{fam:'mueve',valor:'3M',tipo:'Acción',titulo:'Ladrón',texto:['Roba una propiedad','de un set sin completar'],
  async arte(x,o){const f=await figura(x,o,{giro:1.1,extra:junta(pose('camina'),pose('sigilo'),sonrisa(.1))}),k=f.k,m=f.P('mano_D');
   carta(x,m.x,m.y+10*k,.35,1.1*k,'#2F7478')}},
 doble:{fam:'cobro',valor:'1M',tipo:'Acción',titulo:'Doble renta',texto:['Juégala con una renta','y cobra el doble'],
  async arte(x,o){const f=await figura(x,o,{pose:'AgarreFrente',extra:junta(pose('pastel'),sonrisa()),dx:-40}),k=f.k,m=f.manos();
   const a=f.P('mano_D'),col=piel(x,a);contrato(x,m.x,m.y+62*k,-.06,.8*k);miton(x,{x:a.x,y:a.y+2*k},17*k,col,-.3);insignia(x,f.cima.x+200*k,f.cima.y+60*k,'x2',k)}},
 forzoso:{fam:'mueve',valor:'3M',tipo:'Acción',titulo:'Trato forzoso',texto:['Cambia una propiedad tuya','por una de un rival'],
  async arte(x,o){const f=await figura(x,o,{giro:.45,extra:sonrisa(.1),dx:-160}),k=f.k,cx=PAN.x+PAN.w-165,cy=f.cima.y+190*k,r=95*k,g=.75;
   carta(x,cx-r,cy,-.08,1.05*k,'#2F7478');carta(x,cx+r,cy,.08,1.05*k,COL.filo);flechaA(x,cx,cy,r,Math.PI+g,2*Math.PI-g,k);flechaA(x,cx,cy,r,g,Math.PI-g,k)}},
 cobro:{fam:'cobro',valor:'3M',tipo:'Acción',titulo:'Cobro',texto:['Un rival','te paga 5M'],
  async arte(x,o){const f=await figura(x,o,{giro:.35,extra:junta(pose('firme'),sonrisa(.1))}),k=f.k,m=f.P('mano_D');maletin(x,m.x,m.y-6*k,1.05*k)}},
 tratosucio:{fam:'mueve',valor:'5M',tipo:'Acción',titulo:'Trato sucio',texto:['Roba un set completo','a un rival'],
  async arte(x,o){const f=await figura(x,o,{giro:.9,extra:junta(pose('camina'),pose('arriba'),sonrisa(.2))}),k=f.k,m=f.P('dedos2_D');
   const col=piel(x,m);[-.4,0,.4].forEach((a,i)=>carta(x,m.x+(i-1)*30*k,m.y-60*k+Math.abs(i-1)*10*k,a,1.05*k,'#6A3D8F'));miton(x,m,17*k,col,.4)}},
 casa:{fam:'cobro',solo:true,valor:'3M',tipo:'Acción',titulo:'Casa',texto:['Súmale 3M de renta','a un set completo'],arte:casaIso},
 hotel:{fam:'cobro',solo:true,valor:'4M',tipo:'Acción',titulo:'Hotel',texto:['Súmale 4M de renta','a un set con casa'],arte:hotelIso}};
function codPj(){try{return localStorage.cont_av}catch(e){}}
async function dibuja(nom,o={}){const k=CARTAS[nom],fa=FAM[k.fam];o={cod:codPj()||'s1p1c2b1n2a1d1-0368',...o};
 await document.fonts.load(`800 54px ${FUENTE}`);const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
 marco(x,k,fa);titulo(x,k,fa,o.full);
 // el panel con el dibujo va 15% más chico, arriba, para dejarle lugar al título
 const ES=.85,TOP=150;x.save();x.translate(W/2,TOP);x.scale(ES,ES);x.translate(-W/2,-PAN.y);
 if(k.solo){await k.arte(x,o);x.restore();return cv}
 rr(x,PAN.x,PAN.y,PAN.w,PAN.h,PAN.r);x.fillStyle=fa.panel;x.fill();x.save();rr(x,PAN.x,PAN.y,PAN.w,PAN.h,PAN.r);x.clip();piso(x,FY,fa.piso);await k.arte(x,o);x.restore();
 rr(x,PAN.x,PAN.y,PAN.w,PAN.h,PAN.r);x.strokeStyle=TINTA;x.lineWidth=5;x.stroke();x.restore();return cv}
function capa(){let d=document.getElementById('carta2d');if(d)d.remove();d=document.createElement('div');d.id='carta2d';
 d.style.cssText='position:fixed;inset:0;z-index:9999;background:var(--ui-scrim,#0008);display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center;overflow:auto;padding:12px';
 d.onclick=()=>d.remove();document.body.appendChild(d);return d}
async function ver(nom='cumple',o){if(nom==='todas')return galeria(o);const cv=await dibuja(nom,o),d=capa();cv.style.cssText='max-height:92vh;max-width:92vw';d.appendChild(cv);return cv}
async function galeria(o){const d=capa();for(const n in CARTAS)for(const full of [false,true]){const cv=await dibuja(n,{...o,full});cv.title=n;cv.style.cssText='height:44vh';d.appendChild(cv)}}
window.CARTA2D={dibuja,ver,galeria,CARTAS,POSES,FAM};
const q=new URLSearchParams(location.search).get('carta');if(q)(async()=>{while(!window.AV||!window.AV2D)await new Promise(r=>setTimeout(r,200));await AV.listo();ver(q)})();
})();
