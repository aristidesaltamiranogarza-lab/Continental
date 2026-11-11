// Icono de Conecta 4 / Backgammon: el SVG de la sala (SALA.ico) dentro de .gic
function JG3ico(k){return window.SALA&&SALA.ico?'<span class="gic">'+SALA.ico(k)+'</span>':''}
// Conecta 4 y Backgammon sueltos en la Casa 3D: los mismos modelos del cuarto del Continental (C3D.mkC4 / C3D.mkBG), sin salas.
// Reglas en g_casajuegos.js (viajan en /casa como b.jg). c_casa3d.js llama a JG3.build / out / sync / tap / hud / step / close.
(function(){
const TAU=Math.PI*2,K=window.C3D,C4P={x:-9.5,z:6},BGP={x:8.5,z:6.5};
const FLG={};let E=null,J=null,snap='',q=null,err='',open=null,C4=null,BG=null,sel=null,first=true;const disc=new Map(),signs={};
const v3=(x,y,z)=>new E.THREE.Vector3(x,y,z),nmk=k=>{const p=J&&J.pl.find(p=>p.k===k);return esc(p?p.n:'Alguien')};
const mine=t=>J&&J[t+'s'].find(x=>x.p.includes(J.me)&&x.st!='gone')||null;
const shown=t=>mine(t)||J&&J[t+'s'].find(x=>x.st=='play')||null;
const myTurn=t=>{const g=mine(t);return g&&g.st=='play'&&g.turn==g.p.indexOf(J.me)?g:null};
// e.only: arma solo 'c4' o 'bg' (cada uno vive en su piso, e.fl: el Conecta 4 en la terraza y el Backgammon en la planta alta); e.at: dónde
function build(e){if(!K||!K.mkC4)return;if(!E)E=e;const {SC,hits,OB,std}=e,cyl=(a,b,h,m,x,y,z,p,n)=>e.cyl(a,b,h,m,x,y,z,p||SC,n),box=(w,h,d,m,x,y,z,p)=>e.box(w,h,d,m,x,y,z,p||SC),o=e.only;
 if(e.at)Object.assign(o=='bg'?BGP:C4P,e.at);
 if(o!='bg'&&!C4){FLG.c4=e.fl||'pb';
 // Conecta 4 de juguete en una mesita de talavera con dos bancos de herrería (mkC4 abajo)
 const cols=[];C4=mkC4(e,cols);C4.cols=cols;hits.push(...cols)}
 if(o!='c4'&&!BG){FLG.bg=e.fl||'pb';
 // Backgammon: mesita baja con dos puf
 const ct=std(0x4a2c18,.5),{x:tx,z:tz}=BGP;box(4,.14,2.9,ct,tx,1.02,tz);[[-1.8,-1.25],[1.8,-1.25],[-1.8,1.25],[1.8,1.25]].forEach(([a,b])=>box(.14,.95,.14,ct,tx+a,.48,tz+b));
 [-1,1].forEach(s=>{cyl(.75,.8,.9,std(0x7a2a2a,.85),tx+s*2.9,.45,tz,null,24);OB.push({x:tx+s*2.9,z:tz,r:.9})});
 BG=K.mkBG(SC,v3(tx,1.09,tz));hits.push(...BG.hits);OB.push({x:tx-1,z:tz,r:1.7},{x:tx+1,z:tz,r:1.7})}
 if(!signs.c4)[['c4',JG3ico('c4'),'Conecta 4'],['bg',JG3ico('bg'),'Backgammon']].forEach(([t,ic,n])=>{const s=document.createElement('div');s.className='ui ui-fx ui-glass h3sign';s.dataset.g=t;s.innerHTML=`<b>${n}</b><small>sin partidas</small>`;s.onclick=()=>JG3.open(t);signs[t]=s});
 if(J){c4sync();bgSync()}}
// ---------- el Conecta 4 de la casa: tablero de juguete a escala (unidades del tablero: una casilla = 1; S lo encoge) ----------
function mkC4(e,cols){const THREE=e.THREE,{SC,OB,std}=e,S=.16,TY=1.3,P=new THREE.Group(),g=new THREE.Group();P.position.set(C4P.x,TY,C4P.z);SC.add(P);
 const blue=new THREE.MeshPhysicalMaterial({color:0x1d5ad0,roughness:.3,clearcoat:.8,clearcoatRoughness:.2}),dk=std(0x16449e,.4),M=(geo,m,x,y,z,p)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;(p||g).add(o);return o};
 // marco con 42 hoyos y esquinas de arriba redondeadas (se ve a través, como el de verdad)
 const sh=new THREE.Shape();sh.moveTo(-3.7,.2);sh.lineTo(3.7,.2);sh.lineTo(3.7,6.1);sh.quadraticCurveTo(3.7,6.5,3.3,6.5);sh.lineTo(-3.3,6.5);sh.quadraticCurveTo(-3.7,6.5,-3.7,6.1);sh.closePath();
 for(let c=0;c<7;c++)for(let r=0;r<6;r++){const hp=new THREE.Path();hp.absarc(c-3,.7+r,.38,0,TAU,true);sh.holes.push(hp)}
 M(new THREE.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:true,bevelThickness:.06,bevelSize:.06,bevelSegments:2,curveSegments:14}),blue,0,0,-.15);
 // postes a los lados, patas en arco y la palanca amarilla de abajo
 [-1,1].forEach(s=>{M(new THREE.BoxGeometry(.32,6.9,.5),dk,s*3.92,2.95,0);
  const ft=new THREE.Shape();ft.moveTo(-1.45,-.5);ft.quadraticCurveTo(-1.2,.15,0,.25);ft.quadraticCurveTo(1.2,.15,1.45,-.5);ft.lineTo(1.1,-.5);ft.quadraticCurveTo(0,-.05,-1.1,-.5);ft.closePath();
  const f=M(new THREE.ExtrudeGeometry(ft,{depth:.36,bevelEnabled:false,curveSegments:10}),dk,s*3.92-.18,0,0);f.rotation.y=Math.PI/2;f.position.x=s*3.92-.18;f.position.y=0});
 M(new THREE.BoxGeometry(7.2,.18,.42),std(0xf2b40c,.45),0,.04,0);
 for(let c=0;c<7;c++){const m=new THREE.Mesh(new THREE.PlaneGeometry(.98,7),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
  m.position.set(c-3,3.4,.26);m.userData.hit={t:'c4',c};g.add(m);cols.push(m)}
 g.scale.setScalar(S);g.position.y=.5*S+.01;P.add(g);
 // fichas con relieve (también las de la partida, C4.DG) y las de repuesto en dos pilas
 const DG=new THREE.LatheGeometry([[0,-.1],[.27,-.1],[.31,-.075],[.35,-.1],[.385,-.1],[.4,-.08],[.4,.08],[.385,.1],[.35,.1],[.31,.075],[.27,.1],[0,.1]].map(p=>new THREE.Vector2(p[0],p[1])),28);
 const SP=[];[[-.5,.34,0xe53935,9],[.5,.34,0xf9c623,8]].forEach(([x,z,c,n])=>{for(let i=0;i<n;i++)SP.push([x+Math.sin(i*2.1)*.004,(.1+.2*i)*S,z,c])});
 SP.push([-.28,.1*S,.5,0xe53935],[.3,.1*S,.55,0xf9c623],[.64,.1*S,.44,0xf9c623]);
 const im=new THREE.InstancedMesh(DG,std(0xffffff,.32),SP.length),o=new THREE.Object3D(),cl=new THREE.Color();
 SP.forEach(([x,y,z,c],i)=>{o.position.set(x,y,z);o.rotation.set(0,i,0);o.scale.setScalar(S);o.updateMatrix();im.setMatrixAt(i,o.matrix);im.setColorAt(i,cl.setHex(c))});im.castShadow=im.receiveShadow=true;P.add(im);
 // mesita: cubierta de talavera, aro y pie de herrería
 const tal=(()=>{const c=document.createElement('canvas');c.width=c.height=256;talavera(c.getContext('2d'),256,256);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t})(),iron=std(0x1e1c1c,.45,{metalness:.5}),R=.88;
 const top=M(new THREE.CylinderGeometry(R,R,.07,48),[iron,std(0xffffff,.35,tal?{map:tal}:{color:0xf2efe6}),iron],0,-.035,0,P);
 const rim=M(new THREE.TorusGeometry(R,.035,8,48),iron,0,-.02,0,P);rim.rotation.x=Math.PI/2;
 M(new THREE.CylinderGeometry(.05,.07,TY-.07,10),iron,0,-(TY+.07)/2,0,P);M(new THREE.CylinderGeometry(.45,.5,.05,24),iron,0,-TY+.025,0,P);
 const ring=M(new THREE.TorusGeometry(.32,.02,6,24),iron,0,-TY+.45,0,P);ring.rotation.x=Math.PI/2;
 // dos bancos de herrería con asiento de madera, uno por jugador
 const wd=std(0x9a6438,.5);[-1,1].forEach(s=>{const x=s*1.25,z=.55;M(new THREE.CylinderGeometry(.3,.3,.08,24),wd,x,.85-TY,z,P);
  for(let i=0;i<3;i++){const a=i/3*TAU+.5;M(new THREE.CylinderGeometry(.022,.022,.83,6),iron,x+Math.cos(a)*.2,.41-TY,z+Math.sin(a)*.2,P)}
  const fr=M(new THREE.TorusGeometry(.2,.015,6,20),iron,x,.32-TY,z,P);fr.rotation.x=Math.PI/2;OB.push({x:C4P.x+x,z:C4P.z+z,r:.45})});
 OB.push({x:C4P.x,z:C4P.z,r:1.05});P.updateMatrixWorld(true);return {P,g,DG}}
// azulejo de talavera (azul cobalto y amarillo) para la cubierta de la mesita
function talavera(g,w,h){const n=4,t=w/n;g.fillStyle='#f4efe2';g.fillRect(0,0,w,h);
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){const x=i*t,y=j*t,cx=x+t/2,cy=y+t/2;g.fillStyle='#1f4a9e';
  for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4;g.beginPath();g.ellipse(cx+Math.cos(a)*t*.2,cy+Math.sin(a)*t*.2,t*.17,t*.08,a,0,TAU);g.fill()}
  g.fillStyle='#e8a91c';g.beginPath();g.arc(cx,cy,t*.1,0,TAU);g.fill();g.fillStyle='#1f4a9e';
  [[x,y],[x+t,y],[x,y+t],[x+t,y+t]].forEach(([a,b])=>{g.beginPath();g.arc(a,b,t*.14,0,TAU);g.fill()});
  g.strokeStyle='rgba(60,60,80,.25)';g.lineWidth=1.5;g.strokeRect(x,y,t,t)}
 g.strokeStyle='#1f4a9e';g.lineWidth=10;g.beginPath();g.arc(w/2,h/2,w/2-5,0,TAU);g.stroke()}
// ---------- estado ----------
function sync(j,e){if(e)err=e;if(!j)return false;const k=JSON.stringify(j);if(k===snap)return !!e;const o=J;J=j;snap=k;
 if(o){['c4','bg'].forEach(t=>{const a=mine(t),b=o[t+'s'].find(x=>a&&x.id===a.id);
  if(a&&!b&&a.st=='inv'&&a.p[1]===J.me){open=t;sfx('go')}else if(a&&b&&b.st=='inv'&&a.st=='play')sfx('go');
  else if(a&&b&&a.st=='end'&&b.st=='play')sfx(a.w===a.p.indexOf(J.me)?'win':'tick');else if(a&&b&&a.turn!==b.turn&&a.turn==a.p.indexOf(J.me))sfx('go')})}
 c4sync();bgSync();first=false;return true}
function c4sync(){if(!C4)return;const g=shown('c4'),win=new Set(g&&g.line||[]);if((g?g.id:0)!==C4.id){disc.forEach(m=>C4.g.remove(m));disc.clear();C4.id=g?g.id:0}
 for(let x=0;x<42;x++){const v=g?g.b[x]:0;let m=disc.get(x);if(!v){if(m){C4.g.remove(m);disc.delete(x)}continue}
  if(!m){m=new E.THREE.Mesh(C4.DG=C4.DG||new E.THREE.CylinderGeometry(.4,.4,.2,32),new E.THREE.MeshStandardMaterial({color:v==1?0xe53935:0xf9c623,roughness:.32}));
   m.rotation.x=Math.PI/2;m.castShadow=true;const y1=.7+Math.floor(x/7);m.position.set(x%7-3,y1,0);m.userData.y1=y1;if(x===g.last&&!first){m.userData.t0=performance.now();m.position.y=7.4;sfx('place')}C4.g.add(m);disc.set(x,m)}
  m.userData.win=win.has(x)}}
function bgSync(){if(!BG)return;const g=shown('bg'),{bgX,bgZ,bgDir,BGD,BGPW,diceFaces,pipTex}=K,put=(m,x,y,z)=>{m.userData.to=v3(x,y,z)};
 [0,1].forEach(p=>{let n=0;const ck=BG.ck[p],s=p?-1:1;
  if(g){for(let i=0;i<24;i++){const c=g.pts[i]*s;for(let k=0;k<c;k++){const ly=Math.floor(k/5),kk=k%5;put(ck[n++],bgX(i),.17+ly*.05,bgZ(i)+bgDir(i)*(BGPW*.45+kk*BGPW*.88+ly*BGPW*.44))}}
   for(let k=0;k<g.bar[p];k++)put(ck[n++],0,.22,(p?1:-1)*(.18+k*BGPW*.88));
   for(let k=0;k<g.off[p];k++)put(ck[n++],BG.tray,.19+k*.047,(p?-1:1)*BGD*.3)}
  while(n<15)put(ck[n++],BG.tray,.19+(n-1)*.047,(p?-1:1)*BGD*.3)});
 BG.dice.forEach((d,j)=>{d.visible=!!(g&&g.st=='play');if(!d.visible)return;const v=g.dice[j]||1,dbl=g.dice[0]==g.dice[1],used=dbl?(4-g.left.length)>=2*(j+1):!g.left.includes(v);
  diceFaces(v).forEach((f,n)=>{const m=d.material[n];m.map=pipTex(f);m.color.setScalar(used?.45:1);m.needsUpdate=true});d.userData.to=v3((g.turn?-1:1)*K.BGW/4+(j?.12:-.12),.23,j?.1:-.1)});
 if(g&&g.rn!==BG.rn){BG.rn=g.rn;BG.dice.forEach(d=>d.userData.t0=performance.now());if(!first)sfx('shuf')}
 bgMark()}
function bgMark(){const g=myTurn('bg'),zs=BG.zs;Object.values(zs).forEach(z=>{z.material.opacity=0});if(!g)return sel=null;
 if(sel!=null&&!g.mv.some(m=>m[0]===sel))sel=null;
 if(sel==null)g.mv.forEach(m=>{const z=zs[m[0]];if(z){z.material.color.set(0x8fd0ff);z.material.opacity=.22}});
 else{zs[sel].material.color.set(0xffd54a);zs[sel].material.opacity=.35;g.mv.filter(m=>m[0]===sel).forEach(m=>{const z=zs[m[2]];z.material.color.set(0x6dff8a);z.material.opacity=.38})}}
// ---------- tocar los modelos ----------
const send=(t,m)=>{q=Object.assign({t},m);err=''};
function tap(h){if(!J)return;
 if(h.t=='c4'){const g=myTurn('c4');if(g){send('c4',{op:'drop',id:g.id,c:h.c});return}return JG3.open('c4')}
 const g=myTurn('bg');if(!g)return JG3.open('bg');const p=h.p;
 if(sel!=null){const m=g.mv.find(x=>x[0]===sel&&x[2]===p);if(m){send('bg',{op:'move',id:g.id,from:m[0],die:m[1]});sel=null;sfx('place');return}}
 if(g.mv.some(x=>x[0]===p)){sel=sel===p?null:p;sfx('card')}else if(g.bar[g.p.indexOf(J.me)]&&g.mv.length){sel=25;sfx('card')}else sel=null;bgMark()}
// ---------- ventana ----------
function hud(busy){if(!open||busy||!J)return '';const t=open,N=t=='c4'?'Conecta 4':'Backgammon',g=mine(t),mi=g?g.p.indexOf(J.me):-1,op=g?g.p[1-mi]:-1;
 const chip=k=>t=='c4'?`<i class="c4m ${k?'y':'r'}"></i>`:`<i class="c4m" style="background:${k?'radial-gradient(circle at 35% 30%,#666,#26262b 60%)':'radial-gradient(circle at 35% 30%,#fff,#e8dcc0 60%)'}"></i>`;
 const a=(op2,x)=>`JG3.a('${t}','${op2}'${x!=null?','+x:''})`;let b='';
 if(!g){const L=J[t+'s'],ks=J.pl.filter(p=>p.k!==J.me),bz=k=>L.some(x=>x.st!='end'&&x.p.includes(k));
  b=`<div class="h3d">${t=='c4'?'Junta 4 fichas de tu color en línea.':'Saca tus 15 fichas antes que tu rival. Los dados se tiran solos.'} ¿A quién retas?</div>
   <div class="h3b">${ks.map(p=>`<button class="ui-btn sec" onclick="${a('inv',p.k)}"${bz(p.k)?' disabled':''}>${esc(p.n)}${bz(p.k)?' · jugando':''}</button>`).join('')||'<span class="h3n">No hay nadie más en la casa.</span>'}</div>`}
 else if(g.st=='inv')b=mi==0?`<div class="h3d">Esperando a que <b>${nmk(op)}</b> acepte…</div><div class="h3b"><button class="ui-btn sec" onclick="${a('end')}">Cancelar</button></div>`
  :`<div class="h3d"><b>${nmk(op)}</b> te reta a ${N}</div><div class="h3b"><button class="ui-btn" onclick="${a('acc')}">Jugar</button><button class="ui-btn sec" onclick="${a('end')}">Ahora no</button></div>`;
 else{const my=g.st=='play'&&g.turn==mi;let st;
  if(g.st=='play'){if(t=='c4')st=my?`${chip(mi)} <b>¡Tu turno!</b> Toca una columna del tablero`:`Turno de ${nmk(op)}…`;
   else{const dc=g.dice[0]==g.dice[1]?`${g.dice[0]}·${g.dice[0]} (dobles)`:g.dice.join(' y ');st=my?(g.mv.length?`${chip(mi)} <b>¡Tu turno!</b> Dados: ${dc}. Toca una ficha y luego a dónde moverla`:`Dados: ${dc}. No tienes jugadas`):`Turno de ${nmk(op)}… (dados: ${dc})`}}
  else st=g.w==2?'Empate: se llenó el tablero':g.w==mi?(g.why?`🏆 ${nmk(op)} se rindió: ¡ganaste!`:'🏆 <b>¡Ganaste!</b>'):(g.why?'Te rendiste':`Ganó <b>${nmk(op)}</b>`);
  b=`<div class="h3d">${st}</div><div class="h3n">${chip(0)} ${nmk(g.p[0])}${t=='bg'?` (${g.off[0]}/15)`:''} vs ${chip(1)} ${nmk(g.p[1])}${t=='bg'?` (${g.off[1]}/15)`:''}</div>
   <div class="h3b">${t=='bg'&&my&&!g.mv.length?`<button class="ui-btn" onclick="${a('pass')}">Pasar turno</button>`:''}${g.st=='play'?`<button class="ui-btn sec" onclick="if(confirm('¿Rendirte?'))${a('end')}">Rendirse</button>`:`<button class="ui-btn" onclick="${a('inv',op)}">Revancha</button><button class="ui-btn sec" onclick="${a('end')}">Nueva partida</button>`}</div>`}
 return GHUD.win(`${JG3ico(t)} ${N}`,b+(err?`<div class="h3m">${esc(err)}</div>`:''),'JG3.close()')}
// ---------- animación y letreros ----------
// fl: el piso donde estás (solo se anima y se ve el letrero del juego de ese piso)
function step(now,toPx,W,fl){const here=t=>(t=='c4'?C4:BG)&&FLG[t]===(fl||'pb');
 if(here('c4')){disc.forEach(m=>{const u=m.userData;if(u.t0){const k=Math.min(1,(now-u.t0)/650);m.position.y=u.y1+(7.4-u.y1)*(1-K.bounce(k));if(k>=1)u.t0=0}
  m.material.emissive.setHex(u.win?0xffffff:0);m.material.emissiveIntensity=u.win?.18+.18*Math.sin(now/140):0});
 const hv=myTurn('c4');C4.cols.forEach(m=>{m.material.opacity=hv?.06:0})}
 if(here('bg')){[...BG.ck[0],...BG.ck[1]].forEach(m=>{const t=m.userData.to;if(t)m.position.lerp(t,.18)});
 BG.dice.forEach(d=>{const t=d.userData.to;if(!t)return;const k=d.userData.t0?Math.min(1,(now-d.userData.t0)/650):1;d.position.copy(t);d.position.y+=Math.sin(k*Math.PI)*.35;d.rotation.set((1-k)*9,(1-k)*7,(1-k)*5);if(k>=1)d.userData.t0=0})}
 [['c4',C4P,3.1],['bg',BGP,2.6]].forEach(([t,p,y])=>{const s=signs[t];if(!s)return;if(!here(t)){s.style.display='none';return}if(!s.isConnected){const app=document.getElementById('app');if(!app)return;app.appendChild(s)}
  const [x,yy,vis]=toPx(v3(p.x,y,p.z));s.style.display=vis?'':'none';s.style.transform=`translate(${Math.max(70,Math.min(W-70,x))}px,${yy}px) translate(-50%,-100%)`;
  const g=J&&shown(t),sub=g&&g.st=='play'?nmk(g.p[0])+' vs '+nmk(g.p[1]):'sin partidas',sm=s.querySelector('small');if(sm.textContent!==sub)sm.textContent=sub})}
window.JG3={P:{c4:C4P,bg:BGP},build,sync,tap,hud,step,out:()=>{const o=q;q=null;return o},
 a:(t,op,k)=>{const g=mine(t);send(t,op=='inv'?{op,k}:{op,id:g&&g.id});sfx('tick')},
 open:t=>{open=t;err='';if(window.CUB3&&CUB3.isOpen())CUB3.close();if(typeof casaClose=='function')casaClose();else render()},
 close:silent=>{if(!open)return;open=null;if(!silent){sfx('tick');render()}}};
})();
