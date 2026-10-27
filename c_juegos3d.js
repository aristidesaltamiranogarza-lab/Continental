// Conecta 4 y Backgammon sueltos en la Casa 3D: los mismos modelos del cuarto del Continental (C3D.mkC4 / C3D.mkBG), sin salas.
// Reglas en g_casajuegos.js (viajan en /casa como b.jg). c_casa3d.js llama a JG3.build / out / sync / tap / hud / step / close.
(function(){
const K=window.C3D,C4P={x:-9.5,z:6},BGP={x:8.5,z:6.5};
let E=null,J=null,snap='',q=null,err='',open=null,C4=null,BG=null,sel=null,first=true;const disc=new Map(),signs={};
const v3=(x,y,z)=>new E.THREE.Vector3(x,y,z),nmk=k=>{const p=J&&J.pl.find(p=>p.k===k);return esc(p?p.n:'Alguien')};
const mine=t=>J&&J[t+'s'].find(x=>x.p.includes(J.me)&&x.st!='gone')||null;
const shown=t=>mine(t)||J&&J[t+'s'].find(x=>x.st=='play')||null;
const myTurn=t=>{const g=mine(t);return g&&g.st=='play'&&g.turn==g.p.indexOf(J.me)?g:null};
function build(e){E=e;if(!K||!K.mkC4)return;const {THREE,SC,hits,OB,std,cyl,box}=e;
 // Conecta 4: su mesita con dos banquitos, como en el cuarto
 const cols=[];C4=K.mkC4(SC,v3(C4P.x,1.55,C4P.z),cols);C4.P.rotation.y=0;C4.cols=cols;hits.push(...cols);
 const pole=std(0x2a2a2e,.4);[-1,1].forEach(s=>{cyl(.45,.45,.12,std(0x7a2a2a,.8),C4P.x+s*1.5,1.05,C4P.z+1.3);cyl(.06,.08,1,pole,C4P.x+s*1.5,.5,C4P.z+1.3)});
 OB.push({x:C4P.x,z:C4P.z,r:2.3});
 // Backgammon: mesita baja con dos puf
 const ct=std(0x4a2c18,.5),{x:tx,z:tz}=BGP;box(4,.14,2.9,ct,tx,1.02,tz);[[-1.8,-1.25],[1.8,-1.25],[-1.8,1.25],[1.8,1.25]].forEach(([a,b])=>box(.14,.95,.14,ct,tx+a,.48,tz+b));
 [-1,1].forEach(s=>{cyl(.75,.8,.9,std(0x7a2a2a,.85),tx+s*2.9,.45,tz,null,24);OB.push({x:tx+s*2.9,z:tz,r:.9})});
 BG=K.mkBG(SC,v3(tx,1.09,tz));hits.push(...BG.hits);OB.push({x:tx-1,z:tz,r:1.7},{x:tx+1,z:tz,r:1.7});
 [['c4','🔴','Conecta 4'],['bg','🎲','Backgammon']].forEach(([t,ic,n])=>{const s=document.createElement('div');s.className='w7 w7g h3sign';s.innerHTML=`${ic} <b>${n}</b><small>toca para jugar</small>`;s.onclick=()=>JG3.open(t);signs[t]=s})}
// ---------- estado ----------
function sync(j,e){if(e)err=e;if(!j)return false;const k=JSON.stringify(j);if(k===snap)return !!e;const o=J;J=j;snap=k;
 if(o){['c4','bg'].forEach(t=>{const a=mine(t),b=o[t+'s'].find(x=>a&&x.id===a.id);
  if(a&&!b&&a.st=='inv'&&a.p[1]===J.me){open=t;sfx('go')}else if(a&&b&&b.st=='inv'&&a.st=='play')sfx('go');
  else if(a&&b&&a.st=='end'&&b.st=='play')sfx(a.w===a.p.indexOf(J.me)?'win':'tick');else if(a&&b&&a.turn!==b.turn&&a.turn==a.p.indexOf(J.me))sfx('go')})}
 c4sync();bgSync();first=false;return true}
function c4sync(){if(!C4)return;const g=shown('c4'),win=new Set(g&&g.line||[]);if((g?g.id:0)!==C4.id){disc.forEach(m=>C4.g.remove(m));disc.clear();C4.id=g?g.id:0}
 for(let x=0;x<42;x++){const v=g?g.b[x]:0;let m=disc.get(x);if(!v){if(m){C4.g.remove(m);disc.delete(x)}continue}
  if(!m){m=new E.THREE.Mesh(C4.DG=C4.DG||new E.THREE.CylinderGeometry(.4,.4,.2,32),new E.THREE.MeshPhysicalMaterial({color:v==1?0xe53935:0xf9c623,roughness:.3,clearcoat:1,clearcoatRoughness:.1}));
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
   <div class="h3b">${ks.map(p=>`<button class="w7b" onclick="${a('inv',p.k)}"${bz(p.k)?' disabled':''}>${esc(p.n)}${bz(p.k)?' · jugando':''}</button>`).join('')||'<span class="h3n">No hay nadie más en la casa.</span>'}</div>`}
 else if(g.st=='inv')b=mi==0?`<div class="h3d">Esperando a que <b>${nmk(op)}</b> acepte…</div><div class="h3b"><button class="w7b" onclick="${a('end')}">Cancelar</button></div>`
  :`<div class="h3d"><b>${nmk(op)}</b> te reta a ${N}</div><div class="h3b"><button class="w7b dflt" onclick="${a('acc')}">Jugar</button><button class="w7b" onclick="${a('end')}">Ahora no</button></div>`;
 else{const my=g.st=='play'&&g.turn==mi;let st;
  if(g.st=='play'){if(t=='c4')st=my?`${chip(mi)} <b>¡Tu turno!</b> Toca una columna del tablero`:`Turno de ${nmk(op)}…`;
   else{const dc=g.dice[0]==g.dice[1]?`${g.dice[0]}·${g.dice[0]} (dobles)`:g.dice.join(' y ');st=my?(g.mv.length?`${chip(mi)} <b>¡Tu turno!</b> Dados: ${dc}. Toca una ficha y luego a dónde moverla`:`Dados: ${dc}. No tienes jugadas`):`Turno de ${nmk(op)}… (dados: ${dc})`}}
  else st=g.w==2?'Empate: se llenó el tablero':g.w==mi?(g.why?`🏆 ${nmk(op)} se rindió: ¡ganaste!`:'🏆 <b>¡Ganaste!</b>'):(g.why?'Te rendiste':`Ganó <b>${nmk(op)}</b>`);
  b=`<div class="h3d">${st}</div><div class="h3n">${chip(0)} ${nmk(g.p[0])}${t=='bg'?` (${g.off[0]}/15)`:''} vs ${chip(1)} ${nmk(g.p[1])}${t=='bg'?` (${g.off[1]}/15)`:''}</div>
   <div class="h3b">${t=='bg'&&my&&!g.mv.length?`<button class="w7b dflt" onclick="${a('pass')}">Pasar turno</button>`:''}${g.st=='play'?`<button class="w7b" onclick="if(confirm('¿Rendirte?'))${a('end')}">Rendirse</button>`:`<button class="w7b dflt" onclick="${a('inv',op)}">Revancha</button><button class="w7b" onclick="${a('end')}">Nueva partida</button>`}</div>`}
 return `<div id="h3win" class="w7 w7win" role="dialog" aria-labelledby="jgt"><div class="wt"><span id="jgt">${t=='c4'?'🔴':'🎲'} ${N}</span><button class="wx" onclick="JG3.close()" aria-label="Cerrar">✕</button></div>
  <div class="wb">${b}${err?`<div class="h3m">${esc(err)}</div>`:''}</div></div>`}
// ---------- animación y letreros ----------
function step(now,toPx,W){if(!C4)return;
 disc.forEach(m=>{const u=m.userData;if(u.t0){const k=Math.min(1,(now-u.t0)/650);m.position.y=u.y1+(7.4-u.y1)*(1-K.bounce(k));if(k>=1)u.t0=0}
  m.material.emissive.setHex(u.win?0xffffff:0);m.material.emissiveIntensity=u.win?.18+.18*Math.sin(now/140):0});
 const hv=myTurn('c4');C4.cols.forEach(m=>{m.material.opacity=hv?.06:0});
 [...BG.ck[0],...BG.ck[1]].forEach(m=>{const t=m.userData.to;if(t)m.position.lerp(t,.18)});
 BG.dice.forEach(d=>{const t=d.userData.to;if(!t)return;const k=d.userData.t0?Math.min(1,(now-d.userData.t0)/650):1;d.position.copy(t);d.position.y+=Math.sin(k*Math.PI)*.35;d.rotation.set((1-k)*9,(1-k)*7,(1-k)*5);if(k>=1)d.userData.t0=0});
 [['c4',C4P,4.6],['bg',BGP,2.6]].forEach(([t,p,y])=>{const s=signs[t];if(!s.isConnected){const app=document.getElementById('app');if(!app)return;app.appendChild(s)}
  const [x,yy,vis]=toPx(v3(p.x,y,p.z));s.style.display=vis?'':'none';s.style.transform=`translate(${Math.max(70,Math.min(W-70,x))}px,${yy}px) translate(-50%,-100%)`;
  const g=J&&shown(t),sub=g&&g.st=='play'?nmk(g.p[0])+' vs '+nmk(g.p[1]):'toca para jugar',sm=s.querySelector('small');if(sm.textContent!==sub)sm.textContent=sub})}
window.JG3={build,sync,tap,hud,step,out:()=>{const o=q;q=null;return o},
 a:(t,op,k)=>{const g=mine(t);send(t,op=='inv'?{op,k}:{op,id:g&&g.id});sfx('tick')},
 open:t=>{open=t;err='';if(window.CUB3&&CUB3.isOpen())CUB3.close();if(typeof casaClose=='function')casaClose();else render()},
 close:silent=>{if(!open)return;open=null;if(!silent){sfx('tick');render()}}};
})();
