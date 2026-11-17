// c_rr2d.js — RR2D: Ruleta Rusa en 2D para el modo Ligero (sin escena 3D): la mesa vista desde arriba en un lienzo, la gente alrededor,
// el revólver que pasa de mano en mano, el tambor al centro, clic, disparo, sangre y la respiración cuando te toca la sien.
// Reglas en g_ruleta.js. Los botones, el menú y la barra de arriba siguen en c_ruleta3d.js (hud): su after() llama RR2D.pinta(V) cuando
// RR2D.usa() (o si el 3D falla) y RR2D.pinta(null) al salir. En tu turno, tocar a alguien (o a ti) le dispara. Sonidos: RRS (c_ruletasonido.js).
(function(){
let root=null,cv=null,cx=null,raf=0,V=null,G=null,me=-1,W=0,H=0,dpr=1,tPrev=0;
let tc=-1,t0=0,dur=0,fxN=-1,spinT=-1e9,flashT=-1e9,mzT=-1e9,clickT=-1e9,clickK=-1,shake=0,brStop=null,brTc=-1,hov=-1,llave='';
const gun={x:0,y:0,a:0,ok:false},sangre={},caida={},alivio={};
const PAL=['#C2512A','#2D5D8A','#3F7D4F','#8A3F7A','#B8862A','#2E7C83','#7A4A2A','#5A5FA8'];
const PIEL=['#F1C9A5','#E0AC80','#C68B5E','#9A6640'];
const hsh=n=>{let h=0;for(const c of String(n))h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)};
const cl=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=x=>x<0?0:x>1?1:x*x*(3-2*x),TAU=Math.PI*2;
const snd=k=>{try{if(window.RRS)RRS.snd(k)}catch(e){}};
const usa=()=>window.CALIDAD==='ligero';
const vivo=k=>G&&!G.dead[k];
const nom=k=>G.players[k]?G.players[k].name:'';

function init(){root=document.createElement('div');root.id='rr2root';
 root.style.cssText='position:fixed;inset:0;z-index:1;display:none;background:#0b0705;touch-action:manipulation;-webkit-user-select:none;user-select:none';
 cv=document.createElement('canvas');cv.style.cssText='display:block;width:100%;height:100%';root.appendChild(cv);document.body.appendChild(root);cx=cv.getContext('2d');
 const st=document.createElement('style');st.textContent='html.rr2dc .rr-list{display:none!important}';document.head.appendChild(st);
 cv.addEventListener('pointermove',e=>{hov=puedo()?toca(e):-1;cv.style.cursor=hov>=0?'pointer':''});
 cv.addEventListener('pointerleave',()=>{hov=-1});
 cv.addEventListener('pointerup',e=>{if(!puedo())return;const k=toca(e);if(k>=0&&window.RRU){hov=-1;RRU.shoot(k)}})}
const puedo=()=>!!G&&G.phase=='play'&&me>=0&&!G.dead[me]&&G.turn===me&&G.st=='aim'&&!V.watch;

// ---------- acomodo: tú abajo, los demás alrededor ----------
function lay(){const top=Math.min(118,H*.15),bot=Math.min(200,H*.27),ch=H-top-bot,cy=top+ch/2;
 const r=Math.max(70,Math.min(W*.5-58,ch*.5-30)),ar=cl(r*.16,15,32);return {cx:W/2,cy,r,ar,tr:r-ar*1.35}}
function ang(k){const n=G.players.length,b=me>=0?me:0;return Math.PI/2+(k-b)/n*TAU}
function pos(L,k){const a=ang(k);return [L.cx+Math.cos(a)*L.r,L.cy+Math.sin(a)*L.r]}
function toca(e){const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,L=lay();let b=-1,bd=1e9;
 G.players.forEach((_,k)=>{if(!vivo(k))return;const [px,py]=pos(L,k),d=Math.hypot(px-x,py-y);if(d<L.ar*1.9&&d<bd){bd=d;b=k}});return b}

// ---------- estado que llega del servidor ----------
function pinta(v){if(!v||!v.G||!v.G.players){apaga();return}
 if(!root)init();V=v;G=v.G;me=typeof v.me=='number'?v.me:-1;
 const key=G.players.map(p=>p.id).join(',');if(key!==llave){llave=key;for(const o of [sangre,caida,alivio])for(const k in o)delete o[k];fxN=-1}
 if(G.dead.every(d=>!d))for(const k in sangre){delete sangre[k];delete caida[k]}
 if(G.tc!==tc){tc=G.tc;t0=performance.now()-(G.el||0);dur=(G.el||0)+(G.left||0);if(brStop&&G.st!='nerv'){try{brStop()}catch(e){}brStop=null}}
 const fs=G.fx||[],mx=fs.reduce((m,f)=>Math.max(m,f.n),0);
 if(fxN<0||mx<fxN){const nuevo=fxN>=0;fxN=nuevo?0:mx;if(!nuevo)fs.forEach(f=>{if(f.t=='bang'){sangre[f.to]=gotas(f.to);caida[f.to]=-1e9}})}
 for(const f of fs)if(f.n>fxN){fxN=f.n;if((f.ago||0)<4000)efecto(f)}
 G.dead.forEach((d,k)=>{if(d==1&&!sangre[k]){sangre[k]=gotas(k);caida[k]=-1e9}});
 if(G.st=='nerv'&&G.sh===me&&me>=0&&brTc!==G.tc&&window.RRS){brTc=G.tc;try{brStop=RRS.breath(Math.max(.5,(G.left||3000)/1000+.2))}catch(e){}}
 if(root.style.display!=='block'){root.style.display='block';document.documentElement.classList.add('rr2dc');gun.ok=false}
 if(!raf){tPrev=0;raf=requestAnimationFrame(frame)}}
function apaga(){if(root)root.style.display='none';document.documentElement.classList.remove('rr2dc');if(raf)cancelAnimationFrame(raf);raf=0;
 if(brStop){try{brStop()}catch(e){}brStop=null}V=null;G=null;tc=-1;fxN=-1;llave=''}
function efecto(f){const now=performance.now();
 if(f.t=='spin'){spinT=now;snd('giro')}
 else if(f.t=='click'){clickT=now;clickK=f.to;alivio[f.to]=now;snd('clic');shake=Math.max(shake,.25)}
 else if(f.t=='bang'){flashT=mzT=now;snd('disparo');shake=1;sangre[f.to]=gotas(f.to);caida[f.to]=now;setTimeout(()=>snd('caida'),480);
  if(navigator.vibrate&&f.to===me)try{navigator.vibrate([90,40,160])}catch(e){}}}
// gotas de sangre alrededor de quien cayó (fijas para esa persona)
function gotas(k){let s=hsh(nom(k)+k)+7;const rn=()=>((s=(s*16807)%2147483647)/2147483647);const g=[];
 for(let i=0;i<22;i++){const a=rn()*TAU,d=Math.pow(rn(),.7)*1.9;g.push([Math.cos(a)*d,Math.sin(a)*d,.12+rn()*(i<5?.7:.28)])}return g}

// ---------- dibujo ----------
function talla(){const w=cv.clientWidth,h=cv.clientHeight,d=Math.min(2,window.devicePixelRatio||1);
 if(w!==W||h!==H||d!==dpr){W=w;H=h;dpr=d;cv.width=Math.round(w*d);cv.height=Math.round(h*d)}}
function frame(now){raf=0;if(!G)return;raf=requestAnimationFrame(frame);const dt=tPrev?Math.min(.05,(now-tPrev)/1000):0;tPrev=now;
 talla();if(!W||!H)return;const L=lay(),c=cx;
 c.setTransform(dpr,0,0,dpr,0,0);shake*=Math.pow(.02,dt);
 const sx=(Math.random()-.5)*shake*16,sy=(Math.random()-.5)*shake*16;c.translate(sx,sy);
 fondo(L,now);mesa(L,now);
 G.players.forEach((_,k)=>{if(G.dead[k]==1)persona(L,k,now)});
 G.players.forEach((_,k)=>{if(G.dead[k]!=1)persona(L,k,now)});
 revolver(L,now,dt);estado(L);
 c.setTransform(dpr,0,0,dpr,0,0);capas(now)}

function fondo(L,now){const c=cx;c.fillStyle='#0b0705';c.fillRect(-20,-20,W+40,H+40);
 // tablas del piso y la luz del foco que se mece un poco
 c.strokeStyle='rgba(255,210,160,.035)';c.lineWidth=1;for(let y=0;y<H;y+=46){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke()}
 const ox=Math.sin(now/1900)*L.r*.06,g=c.createRadialGradient(L.cx+ox,L.cy-L.r*.1,L.r*.1,L.cx+ox,L.cy,Math.max(W,H)*.75);
 g.addColorStop(0,'rgba(255,196,120,.20)');g.addColorStop(.45,'rgba(255,170,90,.06)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,W,H)}
function mesa(L,now){const c=cx,{cx:x,cy:y,tr}=L;
 c.save();c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=30;c.shadowOffsetY=10;c.fillStyle='#3b2213';c.beginPath();c.arc(x,y,tr,0,TAU);c.fill();c.restore();
 let g=c.createRadialGradient(x-tr*.3,y-tr*.3,tr*.2,x,y,tr);g.addColorStop(0,'#6a4027');g.addColorStop(1,'#2e190d');c.fillStyle=g;c.beginPath();c.arc(x,y,tr,0,TAU);c.fill();
 g=c.createRadialGradient(x,y-tr*.15,tr*.05,x,y,tr*.88);g.addColorStop(0,'#2f6a49');g.addColorStop(1,'#163625');c.fillStyle=g;c.beginPath();c.arc(x,y,tr*.88,0,TAU);c.fill();
 c.strokeStyle='rgba(255,230,180,.12)';c.lineWidth=2;c.beginPath();c.arc(x,y,tr*.88,0,TAU);c.stroke();
 tambor(x,y-tr*.12,tr*.3,now)}
// el tambor al centro: 6 recámaras; las apagadas ya hicieron clic desde que se giró
function tambor(x,y,r,now){const c=cx,e=(now-spinT)/1000,giro=e<1.6?(1-Math.pow(1-e/1.6,3))*TAU*3:0;
 c.save();c.translate(x,y);c.rotate(giro);
 const g=c.createRadialGradient(-r*.3,-r*.3,r*.1,0,0,r);g.addColorStop(0,'#9aa0a6');g.addColorStop(1,'#3d4146');
 c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=2;c.stroke();
 for(let i=0;i<6;i++){const a=i/6*TAU-Math.PI/2,px=Math.cos(a)*r*.58,py=Math.sin(a)*r*.58,usada=i<G.fired;
  c.fillStyle=usada?'#121314':'#b58a3c';c.beginPath();c.arc(px,py,r*.24,0,TAU);c.fill();
  if(!usada){c.fillStyle='#d9b064';c.beginPath();c.arc(px-r*.05,py-r*.05,r*.1,0,TAU);c.fill()}
  c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=1.5;c.beginPath();c.arc(px,py,r*.24,0,TAU);c.stroke()}
 c.fillStyle='#2a2d31';c.beginPath();c.arc(0,0,r*.16,0,TAU);c.fill();c.restore();
 if(G.phase=='play'&&!(G.st=='res'&&G.res&&G.res.r=='bang')){c.fillStyle='rgba(255,236,210,.85)';c.font=`800 ${Math.round(cl(r*.42,12,20))}px Nunito,system-ui,sans-serif`;c.textAlign='center';c.textBaseline='top';
  c.fillText(`1 en ${6-G.fired}`,x,y+r*1.18)}}

function persona(L,k,now){const c=cx,[px,py]=pos(L,k),ar=L.ar,p=G.players[k],d=G.dead[k],h=hsh(p.name);
 const juega=G.phase=='play',tu=juega&&G.turn===k&&!d,sh=juega&&!d&&G.sh===k,blanco=juega&&!d&&G.st=='fire'&&G.tg===k,nerv=sh&&G.st=='nerv';
 const gana=G.phase!='play'&&G.win===k;
 c.save();c.translate(px,py);
 if(d==2)c.globalAlpha=.32;
 // sangre bajo quien cayó
 if(d==1&&sangre[k]){const t=cl((now-caida[k])/900,0,1);c.fillStyle='#5e0a0a';
  for(const [gx,gy,gr] of sangre[k]){c.beginPath();c.arc(gx*ar*t,gy*ar*t,gr*ar*(.4+.6*t),0,TAU);c.fill()}
  c.fillStyle='#7a0f0f';c.beginPath();c.ellipse(0,ar*.2,ar*1.15*t,ar*.8*t,0,0,TAU);c.fill()}
 // anillo de turno con el tiempo de la etapa
 if(tu||gana){const pul=.5+.5*Math.sin(now/220);c.strokeStyle=gana?'#ffd27a':`rgba(232,131,79,${.55+.45*pul})`;c.lineWidth=3;c.beginPath();c.arc(0,0,ar*1.42,0,TAU);c.stroke();
  if(tu&&dur>0&&(G.st=='fire'||G.st=='nerv')){const f=cl((now-t0)/dur,0,1);c.strokeStyle='#ffb36b';c.lineWidth=5;c.beginPath();c.arc(0,0,ar*1.58,-Math.PI/2,-Math.PI/2+f*TAU);c.stroke()}}
 if(hov===k){c.strokeStyle='#fff';c.lineWidth=3;c.setLineDash([6,5]);c.beginPath();c.arc(0,0,ar*1.55,0,TAU);c.stroke();c.setLineDash([])}
 // temblor de nervios
 let tx=0,ty=0;if(nerv){const f=cl((now-t0)/Math.max(1,dur),0,1)*1.6+.4;tx=Math.sin(now*.09)*1.6*f;ty=Math.cos(now*.073)*1.2*f}
 c.translate(tx,ty);
 const ca=d==1?cl((now-caida[k])/500,0,1):0;if(d==1){c.rotate(ease(ca)*(h%2?.5:-.5));c.scale(1-ca*.08,1-ca*.08)}
 const gris=d==1;
 // hombros, cabeza y pelo
 c.fillStyle=gris?'#4a4440':PAL[h%PAL.length];c.beginPath();c.ellipse(0,ar*1.05,ar*1.25,ar*.72,0,Math.PI,TAU);c.fill();
 c.fillStyle=gris?'#8d857e':PIEL[(h>>3)%PIEL.length];c.beginPath();c.arc(0,0,ar,0,TAU);c.fill();
 c.fillStyle=gris?'#3a3532':['#2b1a10','#4a2a17','#151110','#7a4a22','#5a3a2a'][(h>>5)%5];
 c.beginPath();c.arc(0,0,ar*1.02,Math.PI*1.04,Math.PI*1.96);c.quadraticCurveTo(ar*.2,-ar*.55,-ar*.98,-ar*.18);c.fill();
 // cara
 const ojo=ar*.13,ex=ar*.36,ey=ar*.08;c.fillStyle='#24140c';c.strokeStyle='#24140c';c.lineWidth=Math.max(1.5,ar*.09);c.lineCap='round';
 if(d==1){for(const s of [-1,1]){c.beginPath();c.moveTo(s*ex-ojo,ey-ojo);c.lineTo(s*ex+ojo,ey+ojo);c.moveTo(s*ex+ojo,ey-ojo);c.lineTo(s*ex-ojo,ey+ojo);c.stroke()}
  c.beginPath();c.moveTo(-ar*.2,ar*.48);c.lineTo(ar*.2,ar*.48);c.stroke()}
 else{const susto=blanco||nerv,ok=alivio[k]&&now-alivio[k]<1800,o=susto?ojo*1.35:ojo;
  for(const s of [-1,1]){c.beginPath();c.ellipse(s*ex,ey,o*.85,o*(ok?.55:1.15),0,0,TAU);c.fill()}
  c.beginPath();if(susto){c.ellipse(0,ar*.5,ar*.12,ar*.16,0,0,TAU);c.fill()}
  else if(ok){c.arc(0,ar*.3,ar*.24,.15*Math.PI,.85*Math.PI);c.stroke()}
  else if(gana){c.arc(0,ar*.28,ar*.3,.1*Math.PI,.9*Math.PI);c.stroke()}
  else{c.moveTo(-ar*.16,ar*.47);c.quadraticCurveTo(0,ar*.53,ar*.16,ar*.47);c.stroke()}
  // sudor
  if(susto){const f=(now/700)%1;c.fillStyle='rgba(170,215,255,.9)';c.beginPath();c.ellipse(ar*.78,-ar*.2+f*ar*.6,ar*.09,ar*.14,0,0,TAU);c.fill()}}
 c.restore();
 // nombre
 const mi=k===me,t=mi?'Tú':p.name,kn=G.kills[k]?String(G.kills[k]):'',fs=Math.round(cl(ar*.5,11,15));
 c.font=`800 ${fs}px Nunito,system-ui,sans-serif`;const tw=c.measureText(t).width,kw=kn?fs*1.3+c.measureText(kn).width:0,w=tw+kw+18,hy=py+ar*1.9,x0=px-w/2+9;
 c.globalAlpha=d==2?.4:1;c.fillStyle=tu?'rgba(140,34,18,.92)':d?'rgba(30,24,20,.75)':'rgba(16,11,8,.78)';rr(px-w/2,hy-fs*.8,w,fs*1.6,fs*.8);c.fill();
 c.strokeStyle=tu?'#ffb36b':'rgba(255,220,160,.2)';c.lineWidth=1;c.stroke();
 const col=d==1?'#a89a8c':'#f3e6d3';c.fillStyle=col;c.textAlign='left';c.textBaseline='middle';c.fillText(t,x0,hy+1);
 if(d==1){c.strokeStyle=col;c.beginPath();c.moveTo(x0,hy+1);c.lineTo(x0+tw,hy+1);c.stroke()}
 if(kn){cruz(x0+tw+fs*.7,hy+1,fs*.28,d==1?col:'#ffb36b');c.fillStyle=d==1?col:'#ffb36b';c.fillText(kn,x0+tw+fs*1.2,hy+1)}
 c.textAlign='center';c.globalAlpha=1;
 // clic que flota
 if(k===clickK&&now-clickT<1300){const f=(now-clickT)/1300;c.globalAlpha=1-f;c.fillStyle='#fff';c.font=`900 ${Math.round(ar*.8)}px Nunito,system-ui,sans-serif`;c.fillText('clic',px,py-ar*1.6-f*ar);c.globalAlpha=1}}
function cruz(x,y,r,col){const c=cx;c.strokeStyle=col;c.lineWidth=1.6;c.beginPath();c.arc(x,y,r,0,TAU);c.moveTo(x-r*1.5,y);c.lineTo(x+r*1.5,y);c.moveTo(x,y-r*1.5);c.lineTo(x,y+r*1.5);c.stroke()}
function rr(x,y,w,h,r){const c=cx;c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}

// ---------- el revólver: en la mano de quien tira, apuntando ----------
function revolver(L,now,dt){const c=cx;let x,y,a;const ar=L.ar,s=G.sh;
 if(G.phase!='play'||s==null||G.dead[s]==2){x=L.cx+L.tr*.35;y=L.cy+L.tr*.35;a=-.6+Math.sin(now/3000)*.05}
 else{const [px,py]=pos(L,s),dx=L.cx-px,dy=L.cy-py,dl=Math.hypot(dx,dy)||1,ux=dx/dl,uy=dy/dl;
  const vic=G.st=='fire'?G.tg:G.st=='res'&&G.res?G.res.v:G.st=='nerv'?s:null;
  if(vic===s){const side=(hsh(nom(s))%2?1:-1);const dd=ar*.95+ar*2.7*.64;x=px-uy*side*dd+ux*ar*.15;y=py+ux*side*dd+uy*ar*.15;a=Math.atan2(py-y,px-x);
   if(G.st=='nerv'){const f=cl((now-t0)/Math.max(1,dur),0,1);a+=Math.sin(now*.05)*.05*(.3+f);x+=Math.sin(now*.11)*f*1.5}}
  else{x=px+ux*ar*1.45;y=py+uy*ar*1.45;
   const k=vic!=null?vic:hov>=0&&s===me?hov:null;
   if(k!=null&&k!==s){const [qx,qy]=pos(L,k);a=Math.atan2(qy-y,qx-x)}
   else if(k===s){a=Math.atan2(py-y,px-x)}
   else a=Math.atan2(uy,ux)+Math.sin(now/900)*.35}}
 if(!gun.ok){gun.x=x;gun.y=y;gun.a=a;gun.ok=true}
 const f=1-Math.exp(-dt*9);gun.x+=(x-gun.x)*f;gun.y+=(y-gun.y)*f;let da=a-gun.a;da-=TAU*Math.round(da/TAU);gun.a+=da*Math.min(1,f*1.4);
 const rec=now-mzT<160?(1-(now-mzT)/160)*ar*.5:0,ca=Math.cos(gun.a),sa=Math.sin(gun.a);
 c.save();c.translate(gun.x-ca*rec,gun.y-sa*rec);c.rotate(gun.a);const sc=ar*2.7;if(ca<0)c.scale(1,-1);c.scale(sc,sc);
 c.shadowColor='rgba(0,0,0,.55)';c.shadowBlur=8/sc;c.shadowOffsetY=3/sc;
 c.fillStyle='#5a3418';c.beginPath();c.moveTo(-.16,.02);c.lineTo(-.04,.04);c.lineTo(-.12,.36);c.quadraticCurveTo(-.2,.42,-.3,.36);c.lineTo(-.26,.08);c.closePath();c.fill();
 c.shadowColor='transparent';
 c.fillStyle='#2f3337';c.beginPath();c.moveTo(-.22,-.07);c.lineTo(.16,-.07);c.lineTo(.16,.07);c.lineTo(-.02,.07);c.lineTo(-.06,.1);c.lineTo(-.2,.06);c.closePath();c.fill();
 c.fillStyle='#4b5157';c.fillRect(.05,-.06,.6,.07);c.fillStyle='#22262a';c.fillRect(.6,-.085,.04,.03);
 c.fillStyle='#6b7178';rr2(-.11,-.1,.2,.17,.04);c.fill();c.strokeStyle='#2a2e32';c.lineWidth=.012;for(const gx of [-.05,0,.05]){c.beginPath();c.moveTo(gx,-.09);c.lineTo(gx,.06);c.stroke()}
 c.strokeStyle='#2f3337';c.lineWidth=.025;c.beginPath();c.arc(-.02,.12,.06,0,Math.PI);c.stroke();
 c.fillStyle='#2f3337';c.beginPath();c.moveTo(-.22,-.07);c.lineTo(-.28,-.12);c.lineTo(-.25,-.05);c.fill();
 if(now-mzT<130){const f=1-(now-mzT)/130;c.fillStyle=`rgba(255,220,120,${f})`;c.beginPath();for(let i=0;i<10;i++){const r=i%2?.07:.2,an=i/10*TAU;c.lineTo(.68+Math.cos(an)*r*1.4,-.025+Math.sin(an)*r)}c.fill();
  c.fillStyle=`rgba(255,255,230,${f})`;c.beginPath();c.arc(.7,-.025,.05,0,TAU);c.fill()}
 c.restore()}
function rr2(x,y,w,h,r){rr(x,y,w,h,r)}

// texto de lo que pasa, sobre el paño
function estado(L){const c=cx;let t='';const sh=G.sh,n=k=>k===me?'tú':nom(k),N=k=>k===me?'Tú':nom(k);
 if(G.phase!='play')t=G.win==null?'Nadie quedó vivo':G.win===me?'Sobreviviste':N(G.win)+' es el último en pie';
 else if(G.st=='spin')t=sh===me?'¿Giras el tambor?':N(sh)+' decide si gira el tambor';
 else if(G.st=='aim')t=sh===me?'Toca a quién le disparas':N(sh)+' elige a quién dispararle';
 else if(G.st=='fire')t=sh===me?'Le apuntas a '+n(G.tg):N(sh)+' le apunta a '+n(G.tg);
 else if(G.st=='nerv')t=(sh===me?'Te pones el revólver en la sien':N(sh)+' se pone el revólver en la sien')+(G.forced?' (obligado)':'');
 else if(G.st=='res'&&G.res)t=G.res.r=='click'?'Clic. '+(G.res.v===me?'Sigues vivo':nom(G.res.v)+' sigue vivo'):'BANG. '+(G.res.v===me?'Te moriste':nom(G.res.v)+' está muerto');
 if(!t)return;const fs=Math.round(cl(L.tr*.12,12,18));c.font=`800 ${fs}px Nunito,system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';
 const ls=parte(t,L.tr*1.45),y0=L.cy+L.tr*.42;ls.forEach((l,i)=>{const y=y0+i*fs*1.25;c.fillStyle='rgba(0,0,0,.55)';c.fillText(l,L.cx+1,y+2);c.fillStyle=G.st=='res'&&G.res&&G.res.r=='bang'?'#ffb0a0':'#f6ead8';c.fillText(l,L.cx,y)})}
function parte(t,w){const c=cx,ps=t.split(' '),ls=[];let l='';for(const p of ps){const z=l?l+' '+p:p;if(c.measureText(z).width>w&&l){ls.push(l);l=p}else l=z}if(l)ls.push(l);return ls.slice(0,3)}

// destello rojo del disparo y la viñeta que late cuando alguien se apunta a la sien
function capas(now){const c=cx;
 const v=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);
 let a=.55;if(G&&G.phase=='play'&&G.st=='nerv'){const b=(now/(G.sh===me?520:800))%1;a+=(b<.15?b/.15:b<.3?1-(b-.15)/.15:0)*.25}
 v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,`rgba(${G&&G.st=='nerv'?'40,0,0':'0,0,0'},${a})`);c.fillStyle=v;c.fillRect(0,0,W,H);
 const f=(now-flashT)/800;if(f<1){c.fillStyle=`rgba(200,10,10,${.55*(1-f)})`;c.fillRect(0,0,W,H);if(f<.08){c.fillStyle=`rgba(255,240,220,${.6*(1-f/.08)})`;c.fillRect(0,0,W,H)}}}

window.RR2D={usa,pinta};
})();
