// c_carta2d.js — CARTA2D: cartas ilustradas en 2D, estilo minimalista (personaje de AV2D + pocos objetos, sin fondo).
//   CARTA2D.dibuja('cumple',{cod}).then(cv=>...)   CARTA2D.ver('cumple') la muestra y deja bajarla.  ?carta=cumple
(function(){
const TINTA='#3A2416',W=750,H=1050,LW=6;
const COL={papel:'#FDF5E8',panel:'#F7EAD5',filo:'#C4532D',sub:'#7A5A44',crema:'#F3E6D0',teal:'#2F7478',rosa:'#E3A3A0',vela:['#2F7478','#C4532D','#8DB596'],flama:'#E8A33A'};
const PAN={x:100,y:150,w:550,h:610,r:30};
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
function reverso(x,cx,cy,ang,s){const w=96*s,h=134*s;x.save();x.translate(cx,cy);x.rotate(ang);
 rr(x,-w/2,-h,w,h,12*s);trazo(x,'#8A2E3B');rr(x,-w/2+12*s,-h+12*s,w-24*s,h-24*s,7*s);x.strokeStyle=COL.crema;x.lineWidth=3*s;x.stroke();
 x.beginPath();x.ellipse(0,-h/2,20*s,30*s,0,0,Math.PI*2);x.fillStyle=COL.crema;x.fill();x.restore()}
async function pj(x,o,tam=540,Y=220,ro={},X=(W-tam)/2){const cv=await AV2D.retrato(o.cod,{tam,plano:'busto',giro:.25,fondo:null,...ro});x.drawImage(cv,X,Y);return {X,Y,tam,c:cima(cv),pie:suelo(cv)}}
function suelo(cv){const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;for(let y=cv.height-1;y>=0;y--)for(let i=0;i<cv.width;i++)if(d[(y*cv.width+i)*4+3]>128)return y;return cv.height}
// pose armada moviendo huesos: [eje, ángulo] que se suma
const POSES={camina:{muslo_D:['x',-.7],muslo_I:['x',.6],pierna_I:['x',-.45],pierna_D:['x',0],brazo_D:['y',.55],brazo_I:['y',.75],antebrazo_D:['y',.3],antebrazo_I:['y',-.15],cabeza:['y',-.3]}};
const pose=nom=>p=>{const b={};p.traverse(o=>{if(o.isBone)b[o.name]=o});for(const [k,[ax,a]] of Object.entries(POSES[nom]))if(b[k])b[k].rotation[ax]+=a};
function meta(x,cx,y,w,s){const n=12,m=2,cw=w/n,ch=16*s;x.save();x.beginPath();x.rect(cx-w/2,y-ch*m/2,w,ch*m);x.fillStyle='#FFFDF8';x.fill();x.clip();x.fillStyle=TINTA;
 for(let i=0;i<n;i++)for(let j=0;j<m;j++)if((i+j)%2)x.fillRect(cx-w/2+i*cw,y-ch*m/2+j*ch,cw+.5,ch+.5);x.restore();x.beginPath();x.rect(cx-w/2,y-ch*m/2,w,ch*m);trazo(x)}
function marco(x,o){x.fillStyle=TINTA;rr(x,0,0,W,H,46);x.fill();x.fillStyle=COL.papel;rr(x,7,7,W-14,H-14,40);x.fill();
 x.strokeStyle=COL.filo;x.lineWidth=2.5;rr(x,28,28,W-56,H-56,26);x.stroke();
 x.beginPath();x.arc(92,90,40,0,Math.PI*2);x.fillStyle=COL.filo;x.fill();x.lineWidth=5;x.strokeStyle=TINTA;x.stroke();
 x.fillStyle='#FFF';x.font=`800 30px ${FUENTE}`;x.textAlign='center';x.textBaseline='middle';x.fillText(o.valor,92,92);
 x.fillStyle=COL.sub;x.font=`800 26px ${FUENTE}`;x.fillText(o.tipo,W/2,90);
 x.fillStyle=TINTA;x.font=`800 54px ${FUENTE}`;x.fillText(o.titulo,W/2,838);
 x.fillStyle=COL.sub;x.font=`700 29px ${FUENTE}`;o.texto.forEach((t,i)=>x.fillText(t,W/2,912+i*40))}
const CARTAS={
 cumple:{valor:'2M',tipo:'Acción',titulo:'Es tu cumpleaños',texto:['Todos los jugadores','te dan 2M de regalo'],
  async arte(x,o){const {X,Y,tam,c}=await pj(x,o);gorro(x,X+c.x+22,Y+c.y+50,1.35);pastel(x,W/2,Y+tam-14,1.05)}},
 salida:{valor:'1M',tipo:'Acción',titulo:'Pasa por la salida',texto:['Roba 2 cartas','del mazo'],
  async arte(x,o){const tam=600,fy=712;
   const tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;const t=tmp.getContext('2d');
   const r=await pj(t,o,tam,0,{plano:'cuerpo',giro:1.25,extra:pose('camina')},W/2-tam/2-20);
   meta(x,W/2,fy,PAN.w+20,1);x.fillStyle='rgba(58,36,22,.12)';x.beginPath();x.ellipse(W/2-20,fy+4,120,14,0,0,Math.PI*2);x.fill();
   x.drawImage(tmp,0,fy-r.pie+6)}}};
function codPj(){try{return localStorage.cont_av}catch(e){}}
async function dibuja(nom,o={}){const k=CARTAS[nom];o={cod:codPj()||'s1p1c2b1n2a1d1-0368',...o};
 await document.fonts.load(`800 54px ${FUENTE}`);const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
 marco(x,k);rr(x,PAN.x,PAN.y,PAN.w,PAN.h,PAN.r);x.fillStyle=COL.panel;x.fill();x.save();rr(x,PAN.x,PAN.y,PAN.w,PAN.h,PAN.r);x.clip();await k.arte(x,o);x.restore();rr(x,PAN.x,PAN.y,PAN.w,PAN.h,PAN.r);x.strokeStyle=TINTA;x.lineWidth=5;x.stroke();return cv}
async function ver(nom='cumple',o){const cv=await dibuja(nom,o);let d=document.getElementById('carta2d');if(d)d.remove();
 d=document.createElement('div');d.id='carta2d';d.style.cssText='position:fixed;inset:0;z-index:9999;background:var(--ui-scrim,#0008);display:flex;align-items:center;justify-content:center';
 cv.style.cssText='max-height:92vh;max-width:92vw';d.appendChild(cv);d.onclick=()=>d.remove();document.body.appendChild(d);return cv}
window.CARTA2D={dibuja,ver,CARTAS};
const q=new URLSearchParams(location.search).get('carta');if(q)(async()=>{while(!window.AV||!window.AV2D)await new Promise(r=>setTimeout(r,200));await AV.listo();ver(q)})();
})();
