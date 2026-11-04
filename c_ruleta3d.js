// Ruleta Rusa 3D: el sótano (cuarto, mesa, sillas, foco que se mece), la cámara en primera persona sentado en tu silla y la interfaz.
// Reglas en g_ruleta.js; sangre en c_ruletagore.js (RRG); sonidos en c_ruletasonido.js (RRS). Reusa materiales, texturas y Miis de la casa (CASA3D de c_casa3d.js, C3D).
// Se engancha a game.js como GM.ruleta (lobby, body, after). Sin Three.js (o si el 3D falla) quedan los mismos botones sobre fondo oscuro.
(function(){
if(typeof GM==='undefined'){console.warn('Ruleta: falta game.js');return}
const rules=`<details><summary>Reglas</summary>Revólver de 6 recámaras con 1 bala. En tu turno decides si giras el tambor y luego a quién le disparas: a ti o a otro que siga vivo.
<br>Si le disparas a otro y no sale la bala, te tienes que disparar tú con la siguiente recámara. Si sale, esa persona muere: se mete otra bala, se gira y sigue el siguiente vivo.
<br>Si te disparas y sobrevives, el siguiente no puede girar el tambor. Gana el último que quede vivo; los muertos se quedan mirando.</details>`;
function lobby(host){const o=V.opts||{},row=(k,n,L,f)=>`<div class="top">${n}: <b>${f(o[k])}</b></div>`+(host?L.map(v=>`<button class="b g sm2${o[k]===v?' on':''}" onclick="send({t:'opts',o:{${k}:${v}}})">${f(v)}</button>`).join(''):'');
 return `<div class="box"><b>Reglas de esta sala</b><br>`+row('n','Lugares en la mesa',[2,3,4,5,6],v=>v)+row('vel','Velocidad de bots',[1,2,3],v=>['','Lenta','Normal','Rápida'][v])+`</div>`
  +(host?`<button class="b" ${V.players.length<1?'disabled':''} onclick="send({t:'start'})">Empezar partida</button><div class="top">Los bots llenan los lugares vacíos de la mesa (de 2 a 6).</div>`:'')}
const body0=()=>`<div class="box"><b>🔫 Ruleta Rusa</b><p>Esperando la partida…</p></div>`;
GM.ruleta={name:'Ruleta Rusa',emoji:'🔫',max:6,rules,lobby,body:body0,face:()=>({h:''})};
const K=window.C3D,OK3=typeof THREE!=='undefined'&&!!K;let CH=null;   // CH: CASA3D, lo pone c_casa3d.js (carga después de este archivo)
// cuarto ±W y techo HT; mesa de radio TBR a la altura TH (la de las mesas de la casa); 6 sillas a CR del centro
// el sótano sigue a la izquierda hasta XL: la cantina (c_sotano.js) y, pasando sus arcos, el casino y el billar (c_sotano_salon.js)
const XL=-32,RW=5.2-XL,CX=(5.2+XL)/2;
const W=5.2,HT=3.9,TH=1.5,TBR=1.7,CR=2.35,NS=6,POLE=OK3?[new THREE.Vector3(-1.2,-.4,-.7),new THREE.Vector3(1.2,-.4,-.7)]:null;
let R,SC,CA,root,cv,lay,fxv,dv,shR=false,hand=null,swT=-1e9,ready=false,failed=false,shown=false,raf=0,tPrev=0,Wd=0,Hd=0;
const v3=(x,y,z)=>new THREE.Vector3(x,y,z),rnd=(a,b)=>a+Math.random()*(b-a),cl=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
// ángulo de cada silla (la 0 queda hacia el frente del cuarto)
const ang=c=>c/NS*Math.PI*2+Math.PI/2,spos=(c,r)=>v3(Math.cos(ang(c))*(r||CR),0,Math.sin(ang(c))*(r||CR)),face=c=>{const p=spos(c);return Math.atan2(-p.x,-p.z)};
const css=document.createElement('style');css.textContent=`#rr3root{position:fixed;inset:0;z-index:1;display:none;background:#030202;touch-action:none;-webkit-user-select:none;user-select:none}
#rr3root canvas{display:block;width:100%;height:100%;touch-action:none;outline:none}
#rrvig{position:absolute;inset:0;pointer-events:none}#rrdead{position:absolute;inset:0;pointer-events:none;opacity:0;display:flex;align-items:center;justify-content:center;font:900 42px Georgia,serif;color:#e9d6c8;text-shadow:0 2px 12px #000}
#rrlay{position:absolute;inset:0;pointer-events:none;overflow:hidden}.rr-tag{position:absolute;left:0;top:0;padding:2px 9px;border-radius:999px;background:rgba(10,8,6,.72);color:#e9dcc8;font:700 13px/1.4 system-ui,sans-serif;white-space:nowrap;border:1px solid rgba(255,220,160,.18)}
.rr-tag.turn{background:rgba(120,24,16,.85);color:#fff;border-color:#ffb36b}.rr-tag.dead{opacity:.6;text-decoration:line-through}.rr-tag.left{display:none}`;document.head.appendChild(css);

// ---------- texturas del sótano (hechas con código, como las de la casa) ----------
const T={};
function textures(){const ct=CH.ctex;
 // ladrillo con pintura vieja que se descarapela, manchas de humedad que suben del piso y salitre
 T.wall=ct('rrwall',512,384,(g,w,h)=>{g.fillStyle='#3e352d';g.fillRect(0,0,w,h);
  for(let y=0,r=0;y<h;y+=24,r++)for(let x=-(r%2)*32;x<w;x+=64){const v=Math.random()*26-13;g.fillStyle=`rgb(${92+v|0},${60+v*.7|0},${46+v*.5|0})`;g.fillRect(x+2,y+2,60,20)}
  const p=document.createElement('canvas');p.width=w;p.height=h;const q=p.getContext('2d');q.fillStyle='#73806a';q.fillRect(0,0,w,h);
  for(let i=0;i<4000;i++){q.fillStyle=Math.random()<.5?'rgba(0,0,0,.05)':'rgba(255,255,230,.05)';q.fillRect(Math.random()*w,Math.random()*h,2,2)}
  q.globalCompositeOperation='destination-out';for(let i=0;i<34;i++){const cx=Math.random()*w,cy=h*(.25+Math.pow(Math.random(),.6)*.75),s=12+Math.random()*48;
   for(let k=0;k<7;k++){q.beginPath();q.arc(cx+rnd(-s,s),cy+rnd(-s*.6,s*.6),rnd(s*.3,s*.8),0,7);q.fill()}}
  const sh=document.createElement('canvas');sh.width=w;sh.height=h;const s2=sh.getContext('2d');s2.drawImage(p,0,0);s2.globalCompositeOperation='source-in';s2.fillStyle='rgba(15,10,6,.75)';s2.fillRect(0,0,w,h);
  g.drawImage(sh,2,3);g.drawImage(p,0,0);
  for(let i=0;i<7;i++){const x=Math.random()*w,gr=g.createRadialGradient(x,h,10,x,h,90+Math.random()*130);gr.addColorStop(0,'rgba(18,22,12,.6)');gr.addColorStop(1,'rgba(18,22,12,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)}
  for(let i=0;i<16;i++){const x=Math.random()*w,y0=Math.random()*h*.35,l=140+Math.random()*160,gr=g.createLinearGradient(0,y0,0,y0+l);gr.addColorStop(0,'rgba(28,24,14,.4)');gr.addColorStop(1,'rgba(28,24,14,0)');g.fillStyle=gr;g.fillRect(x,y0,3+Math.random()*9,l)}
  for(let i=0;i<1800;i++){const y=h-Math.pow(Math.random(),2)*h*.38;g.fillStyle=`rgba(226,222,205,${Math.random()*.3})`;g.fillRect(Math.random()*w,y,1+Math.random()*3,1+Math.random()*2)}},1);
 // cemento sucio con grietas y manchas de aceite
 T.floor=ct('rrfloor',512,512,(g,w,h)=>{g.fillStyle='#4d4a44';g.fillRect(0,0,w,h);
  for(let i=0;i<9000;i++){g.fillStyle=Math.random()<.5?'rgba(0,0,0,.09)':'rgba(255,250,235,.06)';g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2)}
  for(let i=0;i<10;i++){const x=Math.random()*w,y=Math.random()*h,gr=g.createRadialGradient(x,y,4,x,y,30+Math.random()*80);gr.addColorStop(0,'rgba(14,12,9,.5)');gr.addColorStop(1,'rgba(14,12,9,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)}
  for(let i=0;i<8;i++){const x=Math.random()*w,y=Math.random()*h,gr=g.createRadialGradient(x,y,4,x,y,60+Math.random()*90);gr.addColorStop(0,'rgba(120,104,78,.16)');gr.addColorStop(1,'rgba(120,104,78,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)}
  g.strokeStyle='rgba(12,10,8,.7)';for(let i=0;i<7;i++){let x=Math.random()*w,y=Math.random()*h,a=Math.random()*7;g.lineWidth=1+Math.random()*1.5;g.beginPath();g.moveTo(x,y);for(let k=0;k<14;k++){a+=rnd(-.7,.7);x+=Math.cos(a)*12;y+=Math.sin(a)*12;g.lineTo(x,y)}g.stroke()}},1);
 T.ceil=ct('rrceil',256,256,(g,w,h)=>{g.fillStyle='#24211d';g.fillRect(0,0,w,h);for(let i=0;i<3000;i++){g.fillStyle=Math.random()<.5?'rgba(0,0,0,.15)':'rgba(255,255,240,.04)';g.fillRect(Math.random()*w,Math.random()*h,2,2)}},1);
 // madera de la mesa: vetas, rayones, quemaduras de cigarro y marcas de vasos
 T.table=ct('rrtable',512,512,(g,w,h)=>{g.fillStyle='#5a3a20';g.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=3){g.strokeStyle=`rgba(${Math.random()<.5?'25,12,4':'140,95,55'},${.08+Math.random()*.18})`;g.lineWidth=1+Math.random()*2;g.beginPath();g.moveTo(0,y);for(let x=0;x<=w;x+=32)g.lineTo(x,y+Math.sin(x*.02+y*.13)*4);g.stroke()}
  for(let i=0;i<220;i++){const x=Math.random()*w,y=Math.random()*h,a=Math.random()*7,l=6+Math.random()*50;g.strokeStyle=`rgba(215,175,125,${.12+Math.random()*.25})`;g.lineWidth=.6+Math.random();g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}
  for(let i=0;i<5;i++){const x=w/2+rnd(-150,150),y=h/2+rnd(-150,150);g.strokeStyle='rgba(25,12,4,.35)';g.lineWidth=3+Math.random()*3;g.beginPath();g.arc(x,y,22+Math.random()*12,0,7);g.stroke()}
  for(let i=0;i<12;i++){const x=w/2+rnd(-200,200),y=h/2+rnd(-200,200),r=5+Math.random()*7,gr=g.createRadialGradient(x,y,1,x,y,r*2.4);gr.addColorStop(0,'#0d0603');gr.addColorStop(.4,'rgba(40,18,6,.9)');gr.addColorStop(1,'rgba(70,35,12,0)');g.fillStyle=gr;g.beginPath();g.ellipse(x,y,r*2.4,r*1.6,Math.random()*3,0,7);g.fill()}});
 T.crate=ct('rrcrate',256,256,(g,w,h)=>{for(let i=0;i<5;i++){const v=Math.random()*20-10;g.fillStyle=`rgb(${110+v|0},${82+v|0},${50+v|0})`;g.fillRect(0,i*51,w,49);g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,i*51+49,w,2);
  g.fillStyle='#2a2a2a';[12,w-14].forEach(x=>{g.beginPath();g.arc(x,i*51+25,3,0,7);g.fill()})}g.strokeStyle='rgba(30,18,8,.8)';g.lineWidth=14;g.strokeRect(7,7,w-14,h-14);g.beginPath();g.moveTo(10,10);g.lineTo(w-10,h-10);g.stroke()});
 T.rust=ct('rrrust',128,128,(g,w,h)=>{g.fillStyle='#43352a';g.fillRect(0,0,w,h);for(let i=0;i<900;i++){g.fillStyle=Math.random()<.5?`rgba(150,70,25,${Math.random()*.5})`:'rgba(0,0,0,.25)';g.fillRect(Math.random()*w,Math.random()*h,2,2)}},1);
 T.smoke=ct('rrsmoke',64,64,(g,w,h)=>{const gr=g.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,'rgba(200,200,200,.6)');gr.addColorStop(1,'rgba(200,200,200,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)});
 T.label=ct('rrlabel',256,96,(g,w,h)=>{g.fillStyle='#e8dcc0';g.fillRect(0,0,w,h);g.fillStyle='#5b1a12';g.fillRect(0,8,w,8);g.fillRect(0,h-16,w,8);g.font='bold 40px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText('WHISKY',w/2,h/2+2)})}
const rep=(t,x,y,o)=>{const c=t.clone();c.needsUpdate=true;c.repeat.set(x,y);if(o)c.offset.x=o;return c};

// ---------- el cuarto ----------
const std=(c,r,o)=>CH.std(c,r,o),box=(w,h,d,m,x,y,z,p)=>CH.box(w,h,d,m,x,y,z,p||SC),cyl=(a,b,h,m,x,y,z,p,n)=>CH.cyl(a,b,h,m,x,y,z,p||SC,n);
// tubo recto de a a b
function tube(a,b,r,m,p){const d=b.clone().sub(a),me=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),12),m);me.position.copy(a).addScaledVector(d,.5);me.quaternion.setFromUnitVectors(v3(0,1,0),d.normalize());me.castShadow=me.receiveShadow=true;(p||SC).add(me);return me}
function buildRoom(){
 const fx=RW/(W*2),fl=new THREE.Mesh(new THREE.PlaneGeometry(RW,W*2),std(0xffffff,.93,{map:rep(T.floor,3*fx,3),bumpMap:rep(T.floor,3*fx,3),bumpScale:.02}));fl.rotation.x=-Math.PI/2;fl.position.x=CX;fl.receiveShadow=true;SC.add(fl);
 [[CX,-W,0,RW],[CX,W,Math.PI,RW],[XL,0,Math.PI/2,W*2],[W,0,-Math.PI/2,W*2]].forEach(([x,z,ry,w],i)=>{const t=rep(T.wall,2*w/(W*2),1,i*.37),m=new THREE.Mesh(new THREE.PlaneGeometry(w,HT),std(0xffffff,.96,{map:t,bumpMap:t,bumpScale:.035}));
  m.position.set(x,HT/2,z);m.rotation.y=ry;m.receiveShadow=true;SC.add(m)});
 // techo: se esconde cuando caminas en la casa con la cámara de arriba (modo 'casa')
 const ce=new THREE.Mesh(new THREE.PlaneGeometry(RW,W*2),std(0xffffff,.95,{map:rep(T.ceil,4*fx,4)}));ce.rotation.x=Math.PI/2;ce.position.set(CX,HT,0);SC.add(ce);techo.push(ce);
 const jw=std(0x2c1e12,.9);for(let i=-2;i<=2;i++)techo.push(box(RW,.22,.28,jw,CX,HT-.11,i*2.1));
 // tuberías oxidadas: por la pared del fondo, bajando en la esquina (con su llave) y otra delgada cruzando el techo
 const ru=std(0xffffff,.75,{map:T.rust,metalness:.55}),ru2=std(0x6b6255,.5,{metalness:.7});
 const a=v3(XL,HT-.45,-W+.2),b=v3(W-.2,HT-.45,-W+.2),c=v3(W-.2,0,-W+.2);tube(a,b,.09,ru);tube(b,c,.09,ru);const el=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),ru);el.position.copy(b);SC.add(el);
 for(let x=XL+.8;x<W;x+=1.8)box(.06,.26,.12,ru2,x,HT-.45,-W+.08);const vw=new THREE.Mesh(new THREE.TorusGeometry(.16,.025,8,20),std(0x7a1d12,.6,{metalness:.4}));vw.position.set(W-.38,1.5,-W+.2);vw.rotation.y=Math.PI/2;SC.add(vw);
 techo.push(tube(v3(XL,HT-.2,1.3),v3(W,HT-.2,1.3),.05,ru));tube(v3(XL+.15,HT,3.2),v3(XL+.15,0,3.2),.06,ru);
 // puerta de la escalera, con una rayita de luz por abajo
 const dw=std(0x2a1a0f,.8);box(1.15,2.25,.08,dw,W-.05,1.12,-2.4).rotation.y=Math.PI/2;box(1.35,.12,.14,dw,W-.06,2.3,-2.4).rotation.y=Math.PI/2;
 const sl=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.03),new THREE.MeshBasicMaterial({color:0xffb46a}));sl.position.set(W-.1,.015,-2.4);sl.rotation.set(-Math.PI/2,0,Math.PI/2);SC.add(sl);
 cyl(.035,.035,.06,std(0x8a7a50,.4,{metalness:.8}),W-.12,1.1,-2.0).rotation.z=Math.PI/2;
 // esquinas: cajas, una silla rota tirada, una cubeta y cartón
 const cm=std(0xffffff,.85,{map:T.crate});box(.95,.95,.95,cm,-W+.6,.475,-W+.6).rotation.y=.15;box(.8,.8,.8,cm,-W+.65,1.35,-W+.62).rotation.y=-.2;box(.9,.9,.9,cm,-W+1.65,.45,-W+.55).rotation.y=.4;
 const bc=new THREE.Group();bc.position.set(W-1,0,W-1.1);bc.rotation.set(0,.7,Math.PI/2*.97);SC.add(bc);const bw=std(0x4a3020,.85);
 box(.9,.1,.9,bw,.45,.05,0,bc);box(.9,.1,.9,bw,-.05,0,0,bc).visible=false;box(.1,1.1,.9,bw,.9,-.55,0,bc);cyl(.04,.04,.85,bw,.05,-.45,.38,bc,6).rotation.z=Math.PI/2;cyl(.04,.04,.4,bw,.25,-.45,-.38,bc,6).rotation.z=Math.PI/2;
 box(.08,.7,.08,bw,W-1.9,.04,W-.6).rotation.set(Math.PI/2,0,.6);
 const bu=new THREE.Mesh(new THREE.CylinderGeometry(.28,.22,.5,16,1,true),std(0x5c6066,.5,{metalness:.6,side:THREE.DoubleSide}));bu.position.set(-W+.7,.25,W-.8);bu.castShadow=true;SC.add(bu);
 box(.7,.45,.55,std(0x7a6040,.95),-W+1.6,.22,W-.6).rotation.y=.5}

// ---------- la mesa: madera gastada, una pata chueca ----------
const chairs=[],techo=[];let tbl=null,bulb=null,ember=null,smoke=[],gunW=null,gunV=null;
function buildTable(){const tw=std(0xffffff,.78,{map:T.table,bumpMap:T.table,bumpScale:.012}),sd=std(0x3a2414,.85);
 const top=new THREE.Mesh(new THREE.CylinderGeometry(TBR,TBR,.09,56),[sd,tw,sd]);top.position.y=TH-.045;top.castShadow=top.receiveShadow=true;SC.add(top);tbl=top;
 const rim=new THREE.Mesh(new THREE.TorusGeometry(TBR,.05,8,56),sd);rim.rotation.x=Math.PI/2;rim.position.y=TH-.05;SC.add(rim);cyl(TBR-.18,TBR-.18,.16,sd,0,TH-.17,0);
 [0,1,2,3].forEach(i=>{const a=i/4*Math.PI*2+.4,l=box(.12,TH-.2,.12,sd,Math.cos(a)*1.05,(TH-.2)/2,Math.sin(a)*1.05);if(i==2){l.rotation.z=.07;l.rotation.x=-.04;l.position.x+=.04}})}
// seis sillas viejas que no combinan (en su grupo, +z mira a la mesa; el asiento a la altura de las de la casa)
function buildChair(c){const g=new THREE.Group(),p=spos(c);g.position.copy(p);g.rotation.order='YXZ';g.rotation.y=face(c);SC.add(g);const t=c%6;
 const wd=std([0x5a3a22,0,0,0x3f2a1a,0,0x6b4a2a][t]||0x5a3a22,.85),mt=std(0x707478,.45,{metalness:.7});
 if(t==0||t==3){box(1,.1,1,wd,0,.9,0,g);[[-.42,-.42],[.42,-.42],[-.42,.42],[.42,.42]].forEach(([x,z],i)=>cyl(.05,.05,i==1&&t==3?.84:.9,wd,x,i==1&&t==3?.48:.45,z,g,8));
  [-.42,.42].forEach(x=>box(.08,1.25,.08,wd,x,1.55,-.45,g));[1.25,1.6,1.95].forEach((y,i)=>{if(!(t==3&&i==1))box(.86,.12,.05,wd,0,y,-.45,g)});if(t==3)g.rotation.z=.03}
 else if(t==1){box(.95,.06,.9,mt,0,.92,0,g);box(.9,.42,.05,mt,0,1.55,-.46,g);[-.44,.44].forEach(x=>{box(.04,1.85,.04,mt,x,.95,-.46,g).rotation.x=-.08;box(.04,1,.04,mt,x,.48,.3,g).rotation.x=.2})}
 else if(t==2){const pl=std(0x8a3b32,.55);box(.95,.08,.95,pl,0,.9,0,g);const bk=box(.95,.8,.06,pl,0,1.4,-.5,g);bk.rotation.x=-.15;[[-.42,-.42],[.42,-.42],[-.42,.42],[.42,.42]].forEach(([x,z])=>cyl(.06,.04,.9,pl,x,.45,z,g,8))}
 else if(t==4){const vn=std(0x2f4a34,.5);box(.95,.14,.95,vn,0,.92,0,g);box(.9,.6,.12,vn,0,1.55,-.48,g);[[-.4,-.4],[.4,-.4],[-.4,.4],[.4,.4]].forEach(([x,z])=>cyl(.035,.035,.88,mt,x,.44,z,g,8));[-.4,.4].forEach(x=>cyl(.03,.03,.7,mt,x,1.2,-.48,g,8))}
 else{cyl(.5,.5,.1,wd,0,.9,0,g,20);[0,1,2].forEach(i=>{const a=i/3*Math.PI*2;cyl(.045,.045,.9,wd,Math.cos(a)*.36,.45,Math.sin(a)*.36,g,8)});[-.35,.35].forEach(x=>cyl(.035,.035,.45,wd,x,1.15,-.42,g,6));box(.8,.12,.06,wd,0,1.38,-.42,g)}
 chairs[c]=g}
// cenicero lleno de colillas con un cigarro prendido, y la botella de whisky a medio tomar con su vaso
function buildProps(){const y=TH;
 const ash=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.16,0],[.17,.035],[.15,.04],[.13,.012],[0,.012]].map(p=>new THREE.Vector2(p[0],p[1])),24),std(0x3a3f44,.3,{metalness:.6}));ash.position.set(.55,y,-.35);ash.castShadow=true;SC.add(ash);
 const pap=std(0xe8e2d4,.8),fil=std(0xc98a3a,.8),butt=(x,z,ry,rz)=>{const b=new THREE.Group();b.position.set(.55+x,y+.025,-.35+z);b.rotation.set(0,ry,rz);SC.add(b);cyl(.011,.011,.045,pap,0,0,.02,b,6).rotation.x=Math.PI/2;cyl(.0115,.0115,.03,fil,0,0,-.017,b,6).rotation.x=Math.PI/2};
 for(let i=0;i<11;i++){const a=Math.random()*7,d=Math.random()*.1;butt(Math.cos(a)*d,Math.sin(a)*d,Math.random()*7,rnd(-.3,.3))}
 const cg=new THREE.Group();cg.position.set(.55,y+.04,-.35);cg.rotation.y=.6;SC.add(cg);cyl(.012,.012,.16,pap,0,0,.12,cg,8).rotation.x=Math.PI/2;cyl(.0125,.0125,.03,fil,0,0,.21,cg,8).rotation.x=Math.PI/2;cyl(.0122,.0122,.025,std(0x777370,1),0,0,.03,cg,8).rotation.x=Math.PI/2;
 const em=new THREE.Mesh(new THREE.SphereGeometry(.013,8,6),new THREE.MeshBasicMaterial({color:0xff5a10}));em.position.z=.015;cg.add(em);const el=new THREE.PointLight(0xff6a20,.5,1.4,2);el.position.set(0,.03,0);cg.add(el);
 ember={m:em,l:el,p:new THREE.Vector3()};cg.updateMatrixWorld(true);em.getWorldPosition(ember.p);
 const sm=new THREE.SpriteMaterial({map:T.smoke,transparent:true,depthWrite:false,opacity:0});for(let i=0;i<16;i++){const s=new THREE.Sprite(sm.clone());SC.add(s);smoke.push({s,t:Math.random()*5,life:4+Math.random()*2})}
 const bot=new THREE.Group();bot.position.set(-.5,y,.2);SC.add(bot);
 const bp=[[0,0],[.09,0],[.095,.02],[.095,.3],[.08,.34],[.032,.4],[.028,.5],[.032,.51],[0,.51]].map(p=>new THREE.Vector2(p[0],p[1]));
 const gl=new THREE.Mesh(new THREE.LatheGeometry(bp,20),new THREE.MeshPhysicalMaterial({color:0x7a5a2a,roughness:.08,transparent:true,opacity:.42,depthWrite:false}));gl.castShadow=true;bot.add(gl);
 const lq=std(0xa25a14,.15,{emissive:0x2a1004,transparent:true,opacity:.85});cyl(.088,.088,.15,lq,0,.085,0,bot,20);
 const lb=new THREE.Mesh(new THREE.CylinderGeometry(.097,.097,.12,20,1,true),std(0xffffff,.7,{map:T.label}));lb.position.y=.2;bot.add(lb);cyl(.034,.034,.035,std(0x161616,.4),0,.52,0,bot,12);
 const tb=new THREE.Group();tb.position.set(-.18,y,.48);SC.add(tb);const tp=[[0,0],[.055,0],[.06,.1],[.056,.1],[.05,.008],[0,.008]].map(p=>new THREE.Vector2(p[0],p[1]));
 tb.add(new THREE.Mesh(new THREE.LatheGeometry(tp,20),new THREE.MeshPhysicalMaterial({color:0xdfe6e8,roughness:.05,transparent:true,opacity:.3,depthWrite:false})));cyl(.05,.05,.03,lq,0,.024,0,tb,16)}
// el foco desnudo colgando de su cable, sobre la mesa: se mece con cada disparo y parpadea de vez en cuando
function buildBulb(){const pv=new THREE.Group();pv.position.set(0,HT,0);SC.add(pv);const L=.95;
 cyl(.008,.008,L,std(0x111111,.6),0,-L/2,0,pv,6);cyl(.045,.04,.1,std(0x2b2724,.5,{metalness:.5}),0,-L-.03,0,pv,12);
 const gm=new THREE.MeshStandardMaterial({color:0xfff4d8,emissive:0xffd690,emissiveIntensity:2.2,roughness:.2});const gs=new THREE.Mesh(new THREE.SphereGeometry(.085,16,12),gm);gs.position.y=-L-.14;pv.add(gs);
 const lt=new THREE.PointLight(0xffc47e,34,13,1.55);lt.position.y=-L-.16;lt.castShadow=true;lt.shadow.mapSize.set(1024,1024);lt.shadow.bias=-.003;lt.shadow.camera.near=.1;pv.add(lt);
 bulb={pv,gm,lt,x:0,z:0,vx:0,vz:0,fl:0,next:performance.now()+4000}}
// el revólver: el cañón apunta hacia +z y el origen queda en la cacha (donde va la mano)
function mkGun(){const g=new THREE.Group(),G=new THREE.Group();G.position.set(0,.07,.08);g.add(G);const mt=std(0x26272b,.32,{metalness:.85}),wd=std(0x4a2a14,.55),dk=std(0x0c0c0e,.5,{metalness:.6});
 cyl(.026,.026,.26,mt,0,.035,.17,G,12).rotation.x=Math.PI/2;box(.03,.028,.2,mt,0,.005,.15,G);box(.07,.085,.17,mt,0,.0,-.02,G);box(.012,.022,.02,mt,0,.06,.29,G);
 const dr=new THREE.Group();dr.position.set(0,.012,.02);G.add(dr);cyl(.054,.054,.1,mt,0,0,0,dr,18).rotation.x=Math.PI/2;
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2;cyl(.012,.012,.102,dk,Math.cos(a)*.034,Math.sin(a)*.034,0,dr,8).rotation.x=Math.PI/2}
 const gp=box(.052,.15,.07,wd,0,-.1,-.11,G);gp.rotation.x=.38;const tg=new THREE.Mesh(new THREE.TorusGeometry(.034,.006,6,16),mt);tg.position.set(0,-.055,.0);tg.rotation.y=Math.PI/2;G.add(tg);
 box(.01,.03,.008,mt,0,-.045,.0,G);const hm=box(.018,.04,.03,mt,0,.055,-.1,G);const mz=new THREE.Object3D();mz.position.set(0,.035,.31);G.add(mz);
 g.traverse(o=>{if(o.isMesh)o.castShadow=true});g.userData={drum:dr,hammer:hm,mz,spin:-1e9};return g}

// ---------- los jugadores: Miis de la casa sentados en su silla ----------
let P=[],sig='',me=-1,G0=null,stg=null,lastFx=-1,shk=0,nv=0,brStop=null,deadT=-1,look={y:0,p:0},drag=null,camE=null,camA=null,myHand=null;
const tv=OK3?new THREE.Vector3():null,tv2=OK3?new THREE.Vector3():null,ray=OK3?new THREE.Raycaster():null,P2=OK3?new THREE.Vector2():null;
function clearPlayers(){P.forEach(p=>{SC.remove(p.pv);p.pv.traverse(o=>{if(o.geometry)o.geometry.dispose()});p.tag.remove()});P=[];if(myHand){gunV.remove(myHand);myHand=null}
 chairs.forEach((c,i)=>{c.position.copy(spos(i));c.rotation.set(0,face(i),0)})}
function mkP(k,c,name){const [a,b]=CH.look(name),g=K.mkAvatar(a,b,{});g.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true});
 // pv: pivote en el piso; al morir se ladea hacia d (hacia atrás y a un lado, junto a su silla)
 const pv=new THREE.Group(),p=spos(c),out=p.clone().normalize(),sd=v3(-out.z,0,out.x).multiplyScalar(Math.random()<.5?1:-1),d=out.clone().multiplyScalar(.75).add(sd.multiplyScalar(.66)).normalize();
 pv.position.copy(p);pv.rotation.order='YXZ';pv.rotation.y=Math.atan2(d.x,d.z);SC.add(pv);g.position.y=1.55;g.rotation.y=face(c)-pv.rotation.y;pv.add(g);pv.updateMatrixWorld(true);
 const u=g.userData,bx=new THREE.Box3().setFromObject(u.head),hr=(bx.max.y-bx.min.y)*.45,eye=bx.getCenter(new THREE.Vector3()),F=u.arms[0].hand.parent,ws=F.getWorldScale(new THREE.Vector3()).x||1;
 const tag=document.createElement('div');tag.className='rr-tag';lay.appendChild(tag);
 return {k,c,pv,g,u,hr,hrL:hr/ws,eye,out,d,fw:out.clone().negate(),gs:hr*2.3/.42,dead:0,fall:null,seed:Math.random()*10,tag}}
// tu mano con el revólver (primera persona): la mano y la manga de tu Mii
function buildMyHand(p){myHand=new THREE.Group();gunV.add(myHand);const am=p.u.arms.find(m=>m.s>0)||p.u.arms[0];
 const h=new THREE.Mesh(new THREE.SphereGeometry(.05,14,10),am.hand.material);h.position.set(0,-.03,-.03);h.scale.set(1,1.15,1.2);myHand.add(h);
 tube(v3(0,-.05,-.06),v3(.07,-.3,-.5),.045,am.fo.material,myHand)}
// alguien muere: sangre y se cae de la silla. quiet: ya estaba muerto al llegar (sin animación ni sonido)
function death(p,quiet){if(p.fall)return;p.dead=1;const now=performance.now();p.fall={t:quiet?-1e9:now,ch:chairs[p.c]};p.g.visible=true;
 const h=p.eye,o=p.out,tx=Math.abs(o.x)>1e-4?((o.x<0?XL:W)-h.x)/o.x:1e9,tz=Math.abs(o.z)>1e-4?(W*Math.sign(o.z)-h.z)/o.z:1e9,t=Math.min(tx,tz);
 const wall={p:h.clone().addScaledVector(o,t),n:tx<tz?v3(-Math.sign(o.x),0,0):v3(0,0,-Math.sign(o.z))};
 RRG.kill({head:h.clone(),out:o.clone(),wall,tableY:TH,tableR:TBR,center:v3(0,0,0),floor:p.pv.position.clone().addScaledVector(p.d,h.y*.9),quiet});
 if(quiet)return;setTimeout(()=>RRS.snd('caida'),480);
 if(p.k===me){deadT=now;RRG.screen(1.3)}else if(me>=0&&P[me]&&!P[me].dead){const dc=Math.abs(p.c-P[me].c);if(Math.min(dc,NS-dc)<=1)RRG.screen(.6)}}
// efectos que manda el servidor (G.fx): giro, clic, disparo
function fxGo(f){const now=performance.now();
 if(f.t=='spin'){RRS.snd('giro');gunW.userData.spin=gunV.userData.spin=now}
 else if(f.t=='click'){RRS.snd('clic');shk=Math.max(shk,.15);gunW.userData.fire=gunV.userData.fire=now;bulb.vx+=rnd(-.05,.05)}
 else if(f.t=='bang'){RRS.snd('disparo');const g=gunV.visible?gunV:gunW;g.updateMatrixWorld(true);const mp=g.userData.mz.getWorldPosition(new THREE.Vector3()),dir=new THREE.Vector3(0,0,1).transformDirection(g.matrixWorld);
  RRG.flash(mp,dir);shk=1;bulb.vx+=rnd(-.9,.9);bulb.vz+=rnd(-.9,.9);gunW.userData.fire=gunV.userData.fire=now;if(P[f.to])death(P[f.to],false)}}
function onStage(prev,s){if(brStop&&!(s.st=='nerv'&&s.sh===me)){brStop();brStop=null}
 if(s.st=='nerv'&&s.sh===me&&!brStop)brStop=RRS.breath(Math.max(.5,(s.t1-performance.now())/1000+.2));
 if((s.st=='spin'||s.st=='aim')&&s.sh===me&&(!prev||prev.sh!==me)&&typeof banner=='function')banner('🔫 Te toca')}
function sync(G){const key=G.players.map(p=>p.id).join(',');
 if(key!==sig){sig=key;clearPlayers();RRG.reset();lastFx=-1;stg=null;deadT=-1;camE=null;const n=G.players.length;P=G.players.map((p,k)=>mkP(k,Math.floor(k*NS/n),p.name))}
 me=V.me;G0=G;if(me>=0&&P[me]&&!myHand)buildMyHand(P[me]);
 if(!stg||stg.tc!==G.tc){const now=performance.now(),prev=stg;stg={tc:G.tc,st:G.st,sh:G.sh,tg:G.tg,forced:G.forced,res:G.res,t0:now-G.el,t1:G.left?now+G.left:0};onStage(prev,stg)}
 const first=lastFx<0;G.fx.forEach(f=>{if(f.n>lastFx){lastFx=f.n;if(!first&&f.ago<5000)fxGo(f)}});if(first)lastFx=Math.max(0,lastFx);
 P.forEach((p,k)=>{if(G.dead[k]===2){p.pv.visible=false;p.tag.classList.add('left')}else if(G.dead[k]===1&&!p.fall)death(p,true)})}

// ---------- poses ----------
// mode: null (manos en la mesa) · 'hold' (el arma en la mano) · 'aim' (apunta a tgt) · 'head' (a la sien). f: cuánto lleva del movimiento; amp: temblor
function poseMii(p,now,mode,tgt,f,amp){const u=p.u;u.body.scale.y=1+.012*Math.sin(now/650+p.seed)+(amp?.02*Math.sin(now/90):0);
 u.head.rotation.x=mode=='head'?.05:.2;u.head.rotation.z=amp?(Math.random()-.5)*amp*3:0;
 u.arms.forEach(m=>{const pole=POLE[m.s>0?1:0].clone();m.h.set(m.s*.34,.36,.72);
  if(m.s>0&&mode){const F=m.hand.parent,hold=new THREE.Vector3(m.s*.24,.62,.62);let want=hold;
   if(mode=='aim'&&tgt){const tl=F.worldToLocal(tgt.clone());want=tl.sub(m.sh).normalize().multiplyScalar((u.l1+u.l2)*.93).add(m.sh)}
   else if(mode=='head'){u.head.updateMatrixWorld();const hc=F.worldToLocal(u.head.getWorldPosition(tv2));want=hc.add(new THREE.Vector3(m.s*(p.hrL+.07),.04,.03));pole.y+=1.4;pole.x*=1.4}
   m.h.copy(hold).lerp(want,f);if(amp)m.h.add(tv.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(amp))}
  K.ik(m.sh,m.h,u.l1,u.l2,pole,m.el);K.seg(m.up,m.sh,m.el);K.seg(m.fo,m.el,m.h);m.hand.position.copy(m.h)})}
// todos miran a quien tiene el arma (o a ti, si eres tú)
function lookAt(p,w){p.g.updateMatrixWorld();const l=p.g.worldToLocal(w.clone());p.u.head.rotation.y+=(cl(Math.atan2(l.x,l.z),-1,1)-p.u.head.rotation.y)*.08}
function stepPlayers(now){const G=G0,s=stg,sh=G.phase=='play'?G.sh:-1;let held=false;
 P.forEach((p,k)=>{if(!p.pv.visible)return;
  if(p.fall){const x=ease((now-p.fall.t)/750);p.pv.rotation.x=x*Math.PI/2*.94;p.pv.position.y=-.05*x;const ch=p.fall.ch;ch.rotation.x=-x*1.25;ch.position.copy(spos(p.c,CR+.45*x));p.u.head.rotation.z=.4*x;return}
  if(k===me){p.g.visible=false;return}
  const hp=P[sh];if(hp&&k!==sh)lookAt(p,sh===me?CA.position:hp.eye);
  if(k!==sh){poseMii(p,now,null);return}
  const el=now-s.t0,dur=Math.max(1,s.t1-s.t0),tg=P[s.tg],tgt0=tg?(s.tg===me?CA.position.clone():tg.eye):null;let mode='hold',f=1,amp=0,tgt=null;
  if(s.st=='fire'||(s.st=='res'&&s.res&&s.res.v!==sh)){mode='aim';tgt=tgt0;f=s.st=='fire'?ease(el/700):1}
  else if(s.st=='nerv'){mode='head';f=ease(el/1100);amp=.015+.07*cl(el/dur,0,1)}
  else if(s.st=='res'&&s.res&&s.res.v===sh){mode='head';f=1-ease((el-900)/600);amp=.01}
  poseMii(p,now,mode,tgt,f,amp);if(tgt)lookAt(p,tgt);p.g.updateMatrixWorld(true);
  const am=p.u.arms.find(m=>m.s>0)||p.u.arms[0];am.hand.getWorldPosition(gunW.position);gunW.scale.setScalar(p.gs);
  gunW.lookAt(mode=='aim'&&tgt?tgt:mode=='head'&&f>.5?p.u.head.getWorldPosition(tv2):gunW.position.clone().addScaledVector(p.fw,2).setY(gunW.position.y+1.3));held=true});
 // el revólver: en la mano de quien tiene el turno, en la tuya (primera persona) o sobre la mesa
 const mine=sh===me&&me>=0&&P[me]&&!P[me].dead;gunV.visible=mine;gunW.visible=!mine;
 if(!mine&&!held){const p=P[sh>=0?sh:G.win!=null?G.win:0],o=p?p.out:v3(0,0,1);gunW.scale.setScalar(p?p.gs:1);gunW.position.set(o.x*(TBR-.5),TH+.04,o.z*(TBR-.5));gunW.rotation.set(0,Math.atan2(o.x,o.z)+1.9,Math.PI/2)}
 if(mine){const el=now-s.t0,dur=Math.max(1,s.t1-s.t0),pos=tv.set(.24,-.27,-.62);let at=CA.localToWorld(tv2.set(-.06,.14,-6)),amp=.002;
  if(s.st=='fire'||(s.st=='res'&&s.res&&s.res.v!==me)){const tg=P[s.tg];if(tg){pos.lerp(v3(.12,-.17,-.6),ease(el/600));at=tg.eye.clone()}}
  else if(s.st=='nerv'||(s.st=='res'&&s.res&&s.res.v===me)){const f=s.st=='nerv'?ease(el/1200):1-ease((el-900)/700);pos.lerp(v3(.33,.01,-.12),f);at=CA.localToWorld(tv2.set(.33-f*1.4,0,-.12-(1-f)*5));amp=s.st=='nerv'?.002+.012*cl(el/dur,0,1):.002}
  gunV.position.copy(pos).add(new THREE.Vector3(Math.random()-.5,Math.random()-.5,0).multiplyScalar(amp));gunV.lookAt(at)}
 // tambor que gira, martillo que pega
 [gunW,gunV].forEach(g=>{const d=g.userData,st=now-d.spin;if(st<1200)d.drum.rotation.z+=(1-st/1200)*.6;const ft=now-(d.fire||-1e9);d.hammer.rotation.x=ft<120?0:s&&(s.st=='fire'||s.st=='nerv')?-.7:-.15})}

// ---------- cámara: en primera persona desde tu silla; muerto (o mirando) desde arriba, en gris ----------
function camStep(now,dt){const s=stg,alive=me>=0&&P[me]&&!P[me].dead;let eye,at;
 if(alive){const p=P[me];eye=p.eye.clone().addScaledVector(p.fw,.1);eye.y+=.04;at=v3(0,TH+.2,0);
  if(s&&s.sh===me&&(s.st=='fire'||s.st=='res')&&P[s.tg]&&s.tg!==me)at.lerp(P[s.tg].eye,.75*ease((now-s.t0)/600));   // apuntas: la mirada se va al blanco
  else if(s&&s.sh!==me&&P[s.sh]&&!P[s.sh].dead)at.lerp(P[s.sh].eye,s.tg===me&&s.st=='fire'?.85:.4)}                // miras a quien tiene el arma
 else{const c=me>=0&&P[me]?spos(P[me].c,CR+1.4):v3(3.3,0,3.3);eye=c.setY(3.3);at=v3(0,TH,0)}
 if(!camE){if(hand){camE=hand.p;camA=hand.a;swT=now}else{camE=eye.clone();camA=at.clone()}hand=null}
 const sw=now-swT<1500;camE.lerp(eye,1-Math.exp(-dt/(sw?330:alive?120:700)));camA.lerp(at,1-Math.exp(-dt/(sw?330:260)));
 CA.position.copy(camE);CA.lookAt(camA);CA.rotateY(look.y);CA.rotateX(look.p);
 // nervios cuando te apuntas tú: la cámara tiembla cada vez más, se nubla y se cierra la viñeta
 const mineN=alive&&s&&s.st=='nerv'&&s.sh===me,pr=mineN?cl((now-s.t0)/Math.max(1,s.t1-s.t0),0,1):0;nv=mineN?Math.max(nv,pr):nv*Math.exp(-dt/450);
 const a=shk*.07+.004*nv+nv*nv*.035,r=shk*.03+nv*nv*.03;
 if(a>1e-4){CA.position.add(tv.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(a));CA.rotateZ((Math.random()-.5)*r);CA.rotateX((Math.random()-.5)*r*.6)}
 shk*=Math.exp(-dt/380);if(shk<.003)shk=0;CA.updateMatrixWorld();
 const gray=me<0||(P[me]&&P[me].dead),bl=nv*3.6;cv.style.filter=(bl>.05?`blur(${bl.toFixed(2)}px) `:'')+(gray?'grayscale(.8) brightness(.85)':'');
 const vr=62-nv*50;fxv.style.background=`radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) ${vr}%,rgba(0,0,0,${(.8+nv*.18).toFixed(2)}) ${Math.min(100,vr+38)}%)`;
 // te mataron: destello, rojo, negro, y luego te quedas mirando
 if(deadT>0){const t=now-deadT;let bg='#000',op=1;if(t<90)bg='#fff';else if(t<1400)bg=`rgb(${Math.round(110*(1-(t-90)/1310))},0,0)`;else if(t>2800)op=Math.max(0,1-(t-2800)/1400);
  dv.style.background=bg;dv.style.opacity=op;dv.style.color=t>1400?'#e9d6c8':'transparent';if(op<=0)deadT=-1}else dv.style.opacity=0}
// el foco se mece (péndulo) y a veces parpadea; la brasa del cigarro y su humo
function stepRoom(now,dt){const s=dt/1000,b=bulb;
 b.vx+=(-11*b.x-.25*b.vx)*s;b.vz+=(-11*b.z-.25*b.vz)*s;b.x+=b.vx*s;b.z+=b.vz*s;b.pv.rotation.set(b.x+.012*Math.sin(now/1700),0,b.z+.01*Math.sin(now/2300));
 if(now>b.next){b.fl=now;b.next=now+rnd(5000,14000);RRS.snd('chispa');RRS.flick()}
 const k=now-b.fl<420?(Math.random()<.45?.06:.8+Math.random()*.2):.96+.04*Math.sin(now/53)*Math.sin(now/131);b.lt.intensity=34*k;b.gm.emissiveIntensity=2.2*k;
 ember.m.material.color.setHSL(.05,1,.45+.1*Math.sin(now/180)+.05*Math.random());ember.l.intensity=.4+.25*Math.sin(now/170)+.1*Math.random();
 smoke.forEach(q=>{q.t+=s;if(q.t>q.life){q.t=0;q.life=4+Math.random()*2.5;q.ox=rnd(-.02,.02)}const f=q.t/q.life;
  q.s.position.set(ember.p.x+(q.ox||0)+Math.sin(q.t*1.3+q.life)*.15*f,ember.p.y+f*1.1,ember.p.z+Math.cos(q.t*.9)*.12*f);q.s.scale.setScalar(.04+f*.45);q.s.material.opacity=.22*Math.sin(Math.PI*Math.min(1,f*1.2))*(1-f*.3)})}
// nombres sobre cada quien
function labels(){const G=G0;P.forEach((p,k)=>{const t=p.tag;if(!p.pv.visible)return;
 const w=p.fall?p.pv.position.clone().addScaledVector(p.d,1.2).setY(.9):tv.copy(p.eye).setY(p.eye.y+p.hr*1.7);w.project(CA);
 const vis=!(k===me&&!p.dead)&&w.z<1&&Math.abs(w.x)<1.1&&Math.abs(w.y)<1.1;t.style.display=vis?'':'none';if(!vis)return;
 const turn=G.phase=='play'&&G.sh===k&&!p.dead,txt=es(G.players[k].name)+(p.dead?' 💀':turn?' 🔫':'')+(k===me?' (tú)':'');if(t._t!==txt){t._t=txt;t.innerHTML=txt}
 t.classList.toggle('turn',turn);t.classList.toggle('dead',!!p.dead);t.style.transform=`translate(${((w.x+1)/2*Wd).toFixed(1)}px,${((1-w.y)/2*Hd).toFixed(1)}px) translate(-50%,-100%)`})}
let humT=0;
function loop(now){raf=0;if(!shown)return;raf=requestAnimationFrame(loop);const dt=Math.min(100,now-(tPrev||now));tPrev=now;
 const b=root.getBoundingClientRect();if(b.width!==Wd||b.height!==Hd){Wd=b.width;Hd=b.height;R.setSize(Wd,Hd,false);CA.aspect=Wd/Math.max(1,Hd);CA.fov=Wd<Hd?84:70;CA.updateProjectionMatrix()}
 try{if(G0&&stg){stepRoom(now,dt);camStep(now,dt);stepPlayers(now);RRG.step(dt);labels()}R.render(SC,CA)}catch(e){console.warn('Ruleta 3D:',e);failed=true;show(false);if(typeof render=='function')render()}
 if(now-humT>1000){humT=now;RRS.hum(shown)}}
// tocar a alguien en tu turno = dispararle; arrastrar = mirar alrededor; doble clic = mirar al frente
function tap(e){const G=G0;if(!G||G.phase!='play'||G.turn!==me||G.st!='aim')return;const r=cv.getBoundingClientRect();P2.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(P2,CA);
 let best=null;P.forEach((p,k)=>{if(k===me||p.dead||!p.pv.visible)return;const h=ray.intersectObject(p.g,true)[0];if(h&&(!best||h.distance<best.d))best={k,d:h.distance}});if(best)RRU.shoot(best.k)}
function init(){if(ready)return;CH=window.CASA3D;if(!CH||!RRG)throw new Error('falta c_casa3d.js o c_ruletagore.js');ready=true;
 // un solo WebGL: si la casa ya tiene renderer se usa el mismo y su lienzo pasa de un cuarto al otro (show); el estado lo pone rstate()
 shR=!!(CH.R&&CH.R());R=shR?CH.R():new THREE.WebGLRenderer({antialias:true});if(!shR)rstate();
 SC=new THREE.Scene();SC.background=new THREE.Color(0x030202);SC.fog=new THREE.FogExp2(0x050403,.075);CA=new THREE.PerspectiveCamera(70,1,.03,60);SC.add(CA);
 SC.add(new THREE.HemisphereLight(0x39404c,0x0b0806,.22));
 root=document.createElement('div');root.id='rr3root';cv=R.domElement;if(!shR)root.appendChild(cv);fxv=document.createElement('div');fxv.id='rrvig';lay=document.createElement('div');lay.id='rrlay';
 dv=document.createElement('div');dv.id='rrdead';dv.textContent='💀 Moriste';root.append(fxv,lay,dv);document.body.appendChild(root);
 textures();buildRoom();buildTable();for(let c=0;c<NS;c++)buildChair(c);buildProps();buildBulb();
 // las luces de la Ruleta se quedan prendidas en calidad Media (c_casa3d.js applyQ); luego la cantina (c_sotano.js)
 SC.traverse(o=>{if(o.isPointLight)o.userData.keep=true});if(window.SOT)SOT.cantina(SC,{XL,W,HT,TH});
 gunW=mkGun();SC.add(gunW);gunV=mkGun();gunV.scale.setScalar(.8);gunV.traverse(o=>{o.castShadow=false});CA.add(gunV);RRG.init(THREE,SC,W);
 cv.addEventListener('pointerdown',e=>{if(!shown)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,ly:look.y,lp:look.p,mv:false};try{cv.setPointerCapture(e.pointerId)}catch(_){}});
 cv.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>6)drag.mv=true;if(drag.mv){look.y=cl(drag.ly-dx*.004,-1.3,1.3);look.p=cl(drag.lp-dy*.003,-.55,.45)}});
 cv.addEventListener('pointerup',e=>{const d=drag;drag=null;if(d&&!d.mv)tap(e)});cv.addEventListener('pointercancel',()=>drag=null);cv.addEventListener('dblclick',()=>{if(shown){look.y=0;look.p=0}})}
function rstate(){const mob=matchMedia('(pointer:coarse)').matches;R.setPixelRatio(Math.min(devicePixelRatio||1,mob?1.5:2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
 R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.1}
// modos del sótano: 'juego' (la partida: techo y niebla espesa), 'casa' (caminando con la cámara de arriba: sin techo) y '1p' (caminando en primera persona)
function modo(m){if(!ready)return;techo.forEach(o=>o.visible=m!=='casa');SC.fog.density=m=='juego'?.075:m=='1p'?.045:.02;CA.visible=m=='juego';if(window.SOT)SOT.modo(m);
 if(m!=='juego'&&!G0){gunW.visible=true;gunW.scale.setScalar(1);gunW.position.set(.4,TH+.04,.3);gunW.rotation.set(0,2.2,Math.PI/2)}}
function show(on){if(on&&!ready)init();if(!ready||shown===on)return;shown=on;root.style.display=on?'block':'none';
 if(on){if(shR){root.prepend(cv);rstate();Wd=0}modo('juego');
  // venías caminando en el sótano: la cámara arranca donde estaba la de la casa y vuela a tu silla
  hand=null;if(CH.piso&&CH.piso()==='sot'){const c=CH.cam();hand={p:c.position.clone(),a:c.position.clone().add(c.getWorldDirection(v3(0,0,0)).multiplyScalar(3))}}
  tPrev=0;if(!raf)raf=requestAnimationFrame(loop)}else{RRS.hum(false);if(brStop){brStop();brStop=null}}}
const RRG=window.RRG,RRS=window.RRS||{snd(){},breath:()=>()=>{},hum(){},flick(){}},es=typeof esc=='function'?esc:x=>String(x).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');

// ---------- interfaz (HTML encima del 3D; sin 3D se ve la lista de jugadores) ----------
let on=false,menu=false;
const active=()=>typeof S!=='undefined'&&!!S&&typeof V!=='undefined'&&!!V&&V.game==='ruleta'&&!!V.G&&!!V.G.players;
function stTxt(G,m){const n=k=>es(G.players[k].name),sh=G.sh,r=G.res;
 if(G.st=='spin')return n(sh)+' decide si gira el tambor…';if(G.st=='aim')return n(sh)+' elige a quién dispararle…';
 if(G.st=='fire')return sh===m?'Le apuntas a '+n(G.tg)+'…':n(sh)+' le apunta a '+(G.tg===m?'<b>ti</b>':n(G.tg))+'…';
 if(G.st=='nerv')return sh===m?'Te pones el revólver en la sien'+(G.forced?' (no salió: ahora te toca a ti)':'')+'…':n(sh)+' se pone el revólver en la sien'+(G.forced?' (obligado)':'')+'…';
 if(G.st=='res'&&r)return r.r=='click'?'Clic. '+(r.v===m?'Sigues vivo.':n(r.v)+' sigue vivo.'):'💥 ¡BANG! '+(r.v===m?'Te moriste.':n(r.v)+' está muerto.');return ''}
function hud(){const G=V.G,m=V.me,fin=G.phase!='play',dead=m>=0&&!!G.dead[m],my=m>=0&&!fin&&!dead&&G.turn===m,seatd=m>=0&&!fin&&!dead&&!V.watch,casa=!!(window.CASA3D&&CASA3D.on()),al=G.players.map((_,k)=>k).filter(k=>!G.dead[k]),nm=k=>es(G.players[k].name),left=6-G.fired;
 const ch=Array.from({length:6},(_,i)=>`<i class="${i<G.fired?'e':''}"></i>`).join('');let card='';
 if(fin)card=`<div class="rr-big">${G.win==null?'Nadie quedó vivo':G.win===m?'🏆 ¡Sobreviviste! Ganaste':'🏆 '+nm(G.win)+' es el último en pie'}</div><div class="rr-acts">${V.host?`<button class="rr-b pri" onclick="send({t:'reset'})">Otra partida</button>`:''}<button class="rr-b" onclick="leave()">🚪 Salir</button></div>`;
 else if(my&&G.st=='spin')card=`<div class="rr-q">¿Giras el tambor?</div><div class="rr-acts"><button class="rr-b pri" onclick="RRU.spin(1)">🔄 Girar</button><button class="rr-b" onclick="RRU.spin(0)">➡️ No girar</button></div>
  <div class="rr-s">${G.fired?`Ya ${G.fired==1?'salió 1 clic':'salieron '+G.fired+' clics'}: sin girar, el riesgo es de 1 en ${left}. Si giras, vuelve a 1 en 6.`:'El riesgo es de 1 en 6.'}</div>`;
 else if(my&&G.st=='aim')card=`<div class="rr-q">¿A quién le disparas?</div>${G.can?'':'<div class="rr-s">No puedes girar: el anterior sobrevivió a su propio tiro.</div>'}<div class="rr-acts"><button class="rr-b dan" onclick="RRU.shoot(${m})">🫵 A mí</button>${al.filter(k=>k!==m).map(k=>`<button class="rr-b" onclick="RRU.shoot(${k})">🎯 ${nm(k)}</button>`).join('')}</div>
  <div class="rr-s">Riesgo: 1 en ${left}. Si le disparas a otro y no sale, te disparas tú con la siguiente recámara.${OK3&&!failed?' También puedes tocar a alguien en la mesa.':''}</div>`;
 else card=`<div class="rr-q">${stTxt(G,m)}</div>${dead?'<div class="rr-s">💀 Estás muerto: te quedas mirando hasta que acabe.</div>':V.watch?'<div class="rr-s">👁 Estás mirando.</div>':''}`;
 if(my&&G.el>25000)card+=`<div class="rr-s rr-w">⏳ Si no decides pronto, un bot juega por ti.</div>`;
 const list=G.players.map((p,k)=>`<div class="${G.dead[k]?'d':''}">${G.dead[k]===1?'💀':G.dead[k]===2?'🚪':!fin&&G.sh===k?'🔫':'🙂'} ${nm(k)}${k===m?' (tú)':''}${G.kills[k]?' · '+G.kills[k]+' 🎯':''}</div>`).join('');
 return `<div class="rr-hud"><div class="rr-top">🔫 <b>Ruleta Rusa</b><span>👥 ${al.length}/${G.players.length}</span><span class="rr-cyl" title="Recámaras: las apagadas ya hicieron clic">${ch}</span><span title="Si no se gira el tambor">💀 1 en ${left}</span><button class="rr-mb" onclick="RRU.menu()" aria-label="Menú">☰</button></div>
 ${menu?`<div class="rr-menu">${rules}${seatd?`<div class="rr-s">${casa?'Si te levantas, un bot juega por ti y tienes 2 minutos para volver a tu lugar. ':''}Si abandonas, un bot se queda con tu asiento.</div>`:''}<div class="rr-acts">${seatd&&casa?`<button class="rr-b" onclick="RRU.stand()">🧍 Levantarme</button>`:`<button class="rr-b" onclick="leave()">🚪 ${V.watch?'Dejar de mirar':'Salir de la sala'}</button>`}${seatd?`<button class="rr-b dan" onclick="RRU.quit()">🏳️ Abandonar</button>`:''}<button class="rr-b" onclick="RRU.menu()">Cerrar</button></div></div>`:''}
 <div class="rr-log">${G.log.slice(-4).map(l=>`<div>${es(l.t)}</div>`).join('')}</div><div class="rr-list">${list}</div><div class="rr-card">${card}</div></div>`}
const tick=()=>{if(typeof sfx=='function')sfx('tick')};
const seatLS=v=>{try{v?localStorage.setItem('casa_seat',JSON.stringify(v)):localStorage.removeItem('casa_seat')}catch(e){}};
window.RRU={spin:s=>{tick();send({t:'spin',s:!!s})},shoot:k=>{tick();send({t:'shoot',to:k})},menu:()=>{menu=!menu;tick();render()},
 // levantarse: un bot juega por ti y guardas el lugar 2 min (c_sotano.js enseña "Volver a mi lugar"); abandonar: el bot se queda con el asiento
 stand:async()=>{tick();const s=S&&{g:'ruleta',c:S.c,t:S.t,ts:Date.now()};if(s&&await send({t:'stand'})){seatLS(s);menu=false;leave()}},
 quit:async()=>{tick();if(await send({t:'leave'})){seatLS(null);menu=false;leave()}},
 // el sótano como piso de la casa (c_sotano.js): la misma escena, el mismo foco y la misma mesa
 piso(){if(!OK3||!RRG||failed)return null;try{if(!ready)init()}catch(e){console.warn('Ruleta 3D:',e);failed=true;return null}
  return {SC,XL,W,HT,TH,TBR,CR,NS,spos,top:tbl,chairs,modo,step:(now,dt)=>{if(!shown)stepRoom(now,dt)}}}};
// ---- enganche con game.js ----
GM.ruleta.body=function(){if(!active())return body0();try{return hud()}catch(e){console.warn('Ruleta:',e);return body0()}};
GM.ruleta.after=function(){if(!active()){off();return}on=true;const r=document.documentElement;r.classList.add('rrui');
 if(OK3&&RRG&&!failed){try{show(true);sync(V.G)}catch(e){console.warn('Ruleta 3D:',e);failed=true;show(false)}}r.classList.toggle('rr2d',!OK3||!RRG||failed)};
function off(){if(!on)return;on=false;menu=false;document.documentElement.classList.remove('rrui','rr2d');if(ready){show(false);clearPlayers();RRG.reset();sig='';G0=null;stg=null}}
setInterval(()=>{if(on&&!active())off()},400);
const css2=document.createElement('style');css2.textContent=`html.rrui,html.rrui body{overflow:hidden;height:100%;overscroll-behavior:none}html.rrui body{background:#030202}
html.rrui #app{pointer-events:none;max-width:none;margin:0;padding:0}html.rrui #app>:not(.rr-hud){display:none!important}
.rr-hud{position:fixed;inset:0;z-index:2;pointer-events:none;color:#eadfcd;font:15px/1.35 system-ui,sans-serif}
.rr-top{position:absolute;top:10px;left:50%;transform:translateX(-50%);display:flex;gap:10px;align-items:center;padding:6px 12px;border-radius:14px;background:rgba(8,6,5,.75);border:1px solid rgba(255,210,150,.15);pointer-events:auto;white-space:nowrap;max-width:calc(100% - 20px);overflow-x:auto}
.rr-cyl{display:inline-flex;gap:3px}.rr-cyl i{width:11px;height:11px;border-radius:50%;background:#b08a4a;box-shadow:inset 0 0 0 2px #3a2a14}.rr-cyl i.e{background:#2a2420;box-shadow:inset 0 0 0 2px #151210}
.rr-mb{background:none;border:0;color:inherit;font-size:20px;cursor:pointer;padding:0 2px}
.rr-menu{position:absolute;top:58px;left:50%;transform:translateX(-50%);width:min(440px,calc(100% - 24px));padding:12px;border-radius:14px;background:rgba(12,9,7,.94);border:1px solid rgba(255,210,150,.2);pointer-events:auto;font-size:14px}.rr-menu details{margin-bottom:10px}
.rr-card{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);width:min(560px,calc(100% - 24px));box-sizing:border-box;padding:12px 14px;border-radius:16px;background:rgba(10,7,5,.8);border:1px solid rgba(255,200,140,.18);pointer-events:auto;text-align:center}
.rr-q{font:800 19px Georgia,serif;margin-bottom:8px}.rr-q:empty{display:none}.rr-big{font:900 24px Georgia,serif;margin:4px 0 10px}.rr-s{font-size:13px;opacity:.75;margin-top:6px}.rr-w{color:#ffb36b;opacity:1}
.rr-acts{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}.rr-b{min-height:40px;padding:0 16px;border-radius:12px;border:1px solid rgba(255,220,170,.25);background:#2a1f18;color:#f3e6d2;font:700 15px system-ui,sans-serif;cursor:pointer}
.rr-b.pri{background:#8a2a1a;border-color:#d2643c}.rr-b.dan{background:#4a0f0c;border-color:#a3302a}.rr-b:active{transform:translateY(1px)}
.rr-log{position:absolute;left:12px;top:60px;max-width:min(340px,55%);font-size:13px}.rr-log div{padding:3px 8px;margin-bottom:4px;border-radius:8px;background:rgba(8,6,5,.6)}
.rr-list{display:none}html.rr2d .rr-list{display:block;position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);font-size:17px;line-height:1.8;text-align:center}html.rr2d .rr-list .d{opacity:.5;text-decoration:line-through}
@media (max-width:560px){.rr-log{top:56px;font-size:12px;max-width:calc(100% - 24px)}.rr-top{gap:7px;font-size:14px}}`;document.head.appendChild(css2);
})();
