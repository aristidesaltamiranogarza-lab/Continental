// Sótano: el piso de abajo de la casa. Es el mismo cuarto de la Ruleta Rusa (c_ruleta3d.js), agrandado hacia la izquierda con una cantina:
// barra con botellas y bancos, el Cubilete en la punta de la barra, letrero de neón, dos mesitas, barriles, diana y reloj (modelos de Poly Haven); pasando el arco, el casino y el billar
// (c_sotano_salon.js: Póker, Blackjack y mesa de billar, "próximamente").
// c_casa3d.js lo usa como piso (SOT.piso): escena, mesas, obstáculos, cosas que se tocan, límites y la escalera para subir.
// Solo se arma la primera vez que bajas (o que juegas Ruleta). También el aviso "tu lugar te espera" cuando te levantas de una partida
// (casa_seat en localStorage, lo guarda c_ruleta3d.js).
(function(){
if(typeof THREE==='undefined')return;
let C=null,F=null,bad=false,walkL=null;const SOT_RELL=1.6;const lamps=[],obs=[],MOD=[];
// con el modelo puesto se esconde su mueble de código
const modTick=()=>MOD.forEach(([g,c])=>{const v=!g.children.length;c.forEach(o=>{if(o.visible!==v)o.visible=v})});

// ---------- la cantina (la arma c_ruleta3d.js al construir su cuarto) ----------
function cantina(S,d){const H=window.CASA3D;if(C||!H)return;C=1;const {XL,W,HT,TH}=d,std=H.std;
 const box=(w,h,dd,m,x,y,z,p)=>H.box(w,h,dd,m,x,y,z,p||S),cyl=(a,b,h,m,x,y,z,p,n)=>H.cyl(a,b,h,m,x,y,z,p||S,n);
 const wd=std(0x3b2414,.55),wd2=std(0x2a180c,.6),tp=std(0x6a3e1e,.28),brass=std(0xc9a24a,.3,{metalness:.85}),felt=std(0x1f6a3a,.95),wdS=std(0x5a3a22,.8);
 // la barra, contra la pared del fondo, con su tubo de latón para los pies
 const x0=-13.1,x1=-7.2,bc=(x0+x1)/2,bl=x1-x0,bz=-W+1.25;
 box(bl,1.08,.62,wd,bc,.54,bz);box(bl+.2,.07,.82,tp,bc,1.115,bz+.02);for(let x=x0+.4;x<x1;x+=1.2)box(.06,.9,.04,wd2,x,.5,bz+.32);
 const rail=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,bl,10),brass);rail.rotation.z=Math.PI/2;rail.position.set(bc,.24,bz+.45);S.add(rail);
 for(let x=x0+.3;x<=x1;x+=.9)obs.push({x,z:bz,r:.5});
 // atrás: espejo oscuro, repisas y botellas (una sola malla para todas)
 box(bl-.2,1.7,.04,std(0x1a1210,.22,{metalness:.5}),bc,2.05,-W+.04);[1.45,2.02,2.6].forEach(y=>box(bl-.4,.05,.3,wd,bc,y,-W+.17));
 const bp=[[0,0],[.045,0],[.047,.02],[.047,.2],[.03,.24],[.017,.27],[.017,.33],[0,.33]].map(p=>new THREE.Vector2(p[0],p[1]));
 const BC=[0x9a5a14,0x2f5a2a,0xcfd8d0,0x5a2a10,0x2a4a7a,0x7a1a1a,0xb08a3a],pos=[];
 [1.475,2.045,2.625].forEach(y=>{for(let x=x0+.5;x<x1-.5;x+=.15)if(Math.random()<.78)pos.push([x+Math.random()*.03,y,-W+.17+(Math.random()-.5)*.08])});
 const bt=new THREE.InstancedMesh(new THREE.LatheGeometry(bp,10),new THREE.MeshStandardMaterial({roughness:.12,metalness:.15}),pos.length),m4=new THREE.Matrix4(),cc=new THREE.Color();
 pos.forEach((p,i)=>{const s=.8+Math.random()*.45;m4.makeScale(s,s*(.85+Math.random()*.3),s).setPosition(p[0],p[1],p[2]);bt.setMatrixAt(i,m4);bt.setColorAt(i,cc.setHex(BC[i*7%BC.length]))});S.add(bt);
 // vasos y una botella en la barra
 const gl=new THREE.MeshPhysicalMaterial({color:0xdfe6e8,roughness:.05,transparent:true,opacity:.35,depthWrite:false});[[-12.2,.1],[-11.6,-.05],[-9.1,.08]].forEach(([x,z])=>cyl(.04,.035,.11,gl,x,1.21,bz+z,S,12));
 // letrero de neón (se ve igual con o sin luces) y su luz rosa; cuelga delante del tubo de la pared y de las botellas
 const nt=H.ctex('neon-cantina',512,192,(g,w,h)=>{g.textAlign='center';g.textBaseline='middle';g.shadowColor='#ff2a6a';g.shadowBlur=22;g.strokeStyle='#ff5c8a';g.lineWidth=7;H.rr(g,14,14,w-28,h-28,28);g.stroke();
  g.font='italic bold 78px Georgia,serif';g.fillStyle='#ffd3e0';g.fillText('Cantina',w/2,h/2-14);g.shadowColor='#ffb02a';g.font='bold 30px Georgia,serif';g.fillStyle='#ffe2a8';g.fillText('LA ÚLTIMA BALA',w/2,h/2+50)});
 const ne=new THREE.Mesh(new THREE.PlaneGeometry(3,1.12),new THREE.MeshBasicMaterial({map:nt,transparent:true,toneMapped:false,depthWrite:false}));ne.position.set(bc,3.3,-W+.34);S.add(ne);
 const nl=new THREE.PointLight(0xff4a78,7,8.5,1.5);nl.position.set(bc,2.6,-W+1.3);nl.userData.keep=true;S.add(nl);
 // modelos de Poly Haven (c_casa_glb.js): el mueble de código se ve mientras baja el modelo (o si no hay modelos)
 const mod=(n,o,cod)=>{if(!window.CGLB)return null;const g=CGLB.pon('sot',n,Object.assign({sombra:true},o));S.add(g);if(cod)MOD.push([g,[].concat(cod)]);return g};
 // los banquitos vienen pintados de claro: en la cantina se ven más gastados
 const tinto=o=>o.traverse(m=>{if(m.isMesh)[].concat(m.material).forEach(t=>{if(!t.userData.tinto){t.color.multiplyScalar(.55);t.userData.tinto=1}})});
 const grp=(x,z)=>{const g=new THREE.Group();g.position.set(x,0,z);S.add(g);return g};
 // bancos de la barra
 const red=std(0x6a1c16,.5),mt=std(0x707478,.4,{metalness:.75});
 for(let i=0;i<5;i++){const x=x0+.7+i*(bl-1.4)/4,z=bz+.95,g=grp(x,z);cyl(.22,.2,.08,red,0,.84,0,g,16);cyl(.035,.045,.8,mt,0,.42,0,g,8);cyl(.2,.22,.03,mt,0,.015,0,g,16);
  const fr=new THREE.Mesh(new THREE.TorusGeometry(.15,.014,6,18),mt);fr.rotation.x=Math.PI/2;fr.position.set(0,.32,0);g.add(fr);obs.push({x,z,r:.28});
  mod('banco_barra',{pos:[x,0,z],rot:i*1.7,esc:1.15},g)}
 // banco de madera (volteado = encima de una mesa cerrada)
 const tab=(x,z,flip,y0)=>{const g=new THREE.Group();g.position.set(x,flip?y0+.78:0,z);if(flip)g.rotation.set(Math.PI,Math.random()*3,0);S.add(g);
  cyl(.2,.19,.06,wdS,0,.75,0,g,16);for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.6;cyl(.022,.028,.75,wdS,Math.cos(a)*.14,.375,Math.sin(a)*.14,g,6)}if(!flip)obs.push({x,z,r:.25});return g};
 // lámpara colgante sobre cada mesa (en calidad Media se apaga la luz, el foco sigue); el modelo cuelga del techo
 const lamp=(x,z)=>{const y=2.75,c=cyl(.006,.006,HT-y,std(0x111111,.6),x,(HT+y)/2,z,S,6);
  const sh=new THREE.Mesh(new THREE.CylinderGeometry(.1,.4,.28,24,1,true),std(0x23402a,.5,{side:THREE.DoubleSide,metalness:.3}));sh.position.set(x,y,z);S.add(sh);
  const b=new THREE.Mesh(new THREE.SphereGeometry(.06,12,8),new THREE.MeshBasicMaterial({color:0xfff0c8}));b.position.set(x,y-.06,z);S.add(b);
  const L=new THREE.PointLight(0xffd9a0,9,6.5,1.6);L.position.set(x,y-.2,z);S.add(L);lamps.push(L);mod('lampara_industrial',{pos:[x,HT-.02,z],rot:x,esc:.95,sombra:false},[c,sh])};
 // dos mesitas de la cantina con sus bancos y su lámpara
 [[-11.2,2.5],[-7.9,2.9]].forEach(([x,z],k)=>{const g=grp(x,z);cyl(.55,.55,.05,tp,0,1.03,0,g,28);cyl(.06,.08,1,wd2,0,.5,0,g,10);cyl(.36,.4,.04,wd2,0,.02,0,g,20);mod('mesa_cantina',{pos:[x,0,z],rot:k,esc:1.4},g);
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4+k,sx=x+Math.cos(a)*.95,sz=z+Math.sin(a)*.95;mod('banquito',{pos:[sx,0,sz],rot:-a,esc:1.3,listo:tinto},tab(sx,sz,false))}
  [[.15,.1],[-.2,-.12]].forEach(([dx,dz])=>{const v=new THREE.Mesh(new THREE.CylinderGeometry(.045,.035,.13,12),gl);v.position.set(x+dx,1.12,z+dz);S.add(v)});obs.push({x,z,r:.6});lamp(x,z)});
 // barriles, una caja, la diana y el reloj (solo modelo)
 mod('barril',{pos:[-13.35,0,-2.35],rot:.4,esc:1.25});mod('barril',{pos:[-7,0,4.55],rot:2,esc:1.25});mod('caja_madera',{pos:[-5.95,0,4.75],rot:Math.PI/2+.12,esc:1.2});
 obs.push({x:-13.35,z:-2.35,r:.5},{x:-7,z:4.55,r:.5},{x:-5.95,z:4.75,r:.6});
 mod('diana',{pos:[-13.84,2.05,-2.1],rot:Math.PI/2,esc:1.4});mod('reloj',{pos:[-13.84,2.8,3.75],rot:Math.PI/2,esc:1.5});
 // luz suave para caminar con la cámara de arriba (en la partida se apaga: ahí manda el foco)
 walkL=new THREE.HemisphereLight(0xffe2c0,0x2a1a10,.95);walkL.visible=false;S.add(walkL)
 // relleno de calidad Media: ahí se apagan las lámparas (luces puntuales) y el sótano quedaba casi negro; three.js lee visible en cada cuadro
 const rell=new THREE.HemisphereLight(0xffe6c8,0x3a2418,SOT_RELL);Object.defineProperty(rell,'visible',{get:()=>window.CALIDAD==='medio',set(){}});S.add(rell)}
function modo(m){if(walkL)walkL.visible=m!=='juego';if(F)F.TB[0].ring.visible=m!=='juego'}   // en la partida no se ve el aro de "acércate"

// ---------- el piso para c_casa3d.js ----------
const ok=()=>!bad&&!!(window.RRU&&RRU.piso&&window.CASA3D&&window.RRG);
function piso(){if(F)return F;const r=ok()&&RRU.piso();if(!r){bad=true;return null}const S=r.SC,W=r.W;if(!C)cantina(S,r);
 // aro de luz alrededor de la mesa de la Ruleta (se prende al acercarte, como en las mesas de arriba)
 const ring=new THREE.Mesh(new THREE.RingGeometry(r.TBR+1.4,r.TBR+1.7,64),new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:0,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.03;S.add(ring);
 const hit={t:'table',g:'ruleta'},hits=[];[r.top,...r.chairs].forEach(o=>o&&o.traverse(m=>{if(m.isMesh){m.userData.hit=hit;hits.push(m)}}));
 // la escalera: la puerta de la pared derecha; tocarla (o caminar hasta ella) te sube a la casa
 const lk={x:W-.2,z:-2.4,r:1.5,ax:W-1.4,az:-2.4,to:'pb'},hb=new THREE.Mesh(new THREE.BoxGeometry(.3,3.3,1.7),new THREE.MeshBasicMaterial({visible:false}));
 hb.position.set(W-.1,1.65,-2.4);hb.userData.hit={t:'link',l:lk};S.add(hb);hits.push(hb);
 const H=window.CASA3D,up=H.ctex('sign-subir',512,128,(g,w,h)=>{g.fillStyle='#1a0c0a';H.rr(g,4,4,w-8,h-8,18);g.fill();g.strokeStyle='#c98a3a';g.lineWidth=6;H.rr(g,10,10,w-20,h-20,14);g.stroke();
  g.font='bold 46px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f3dcb0';g.fillText('⬆ Subir a la casa',w/2,h/2+3)});
 const sg=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.4),new THREE.MeshBasicMaterial({map:up,toneMapped:false}));sg.position.set(W-.07,3.64,-2.4);sg.rotation.y=-Math.PI/2;S.add(sg);
 // el salón de atrás (c_sotano_salon.js): casino, billar, rockola; trae sus muros (WL), obstáculos y su paso por cuadro
 let sal=null;if(window.SAL)try{sal=SAL.build({S,hits,HT:r.HT,W,XL:r.XL,TH:r.TH});if(sal)obs.push(...sal.OB)}catch(er){console.error('[SAL]',er);sal=null}
 // obstáculos: sillas de la Ruleta, cajas y cosas tiradas del cuarto, y lo de la cantina
 const OB=obs.concat(r.chairs.map((c,i)=>{const p=r.spos(i);return {x:p.x,z:p.z,r:.5}}),[{x:-W+.6,z:-W+.6,r:.75},{x:-W+1.65,z:-W+.55,r:.55},{x:-W+.7,z:W-.8,r:.35},{x:-W+1.6,z:W-.6,r:.45},{x:W-1,z:W-1.1,r:.7}]);
 // el plano de la casa junto a la puerta (c_casa_esc.js): tocarlo abre el 🧭
 if(window.ESC)ESC.plano({S,hits,OB,x:W-.9,z:-.4,ry:-Math.PI/2+.5,here:'sot',s:.8});
 // el Cubilete: su mesita en la punta de la barra (las reglas viajan en /casa, c_cubilete3d.js)
 if(window.CUB3)CUB3.build({THREE,SC:S,hits,OB,std:H.std,cyl:H.cyl,ctex:H.ctex,TH:r.TH,x:-5.6,z:-3.5});
 F={id:'sot',SC:S,TB:[{g:'ruleta',x:0,z:0,r:r.TBR,chairs:[],ring}],OB,hits,links:[lk],bx:[r.XL+.8,W-.8,-W+.8,W-.8],cb:[r.XL,W,-W,W],k:1,
  tm:THREE.ACESFilmicToneMapping,tx:1.1,spawn:()=>({x:W-1.6,z:-3.9,yaw:-Math.PI*.6}),enter:fp=>r.modo(fp?'1p':'casa'),WL:sal?sal.WL:[],step:(now,dt)=>{r.step(now,dt);if(sal)sal.step(now,dt);modTick()}};
 return F}

// ---------- "tu lugar te espera": te levantaste de una partida y un bot juega por ti 2 minutos ----------
const SEAT_MS=120000,es=s=>typeof esc=='function'?esc(s):String(s);
function drop(){try{localStorage.removeItem('casa_seat')}catch(e){}}
function seat(){let s=null;try{s=JSON.parse(localStorage.getItem('casa_seat')||'null')}catch(e){}if(s&&!(Date.now()-s.ts<SEAT_MS)){drop();return null}return s}
const left=s=>{const t=Math.max(0,Math.ceil((SEAT_MS-(Date.now()-s.ts))/1000));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
function seatHud(){const s=seat();if(!s)return '';const G=typeof GM!='undefined'&&GM[s.g];
 return `<div id="h3seat" class="ui ui-fx ui-glass" role="status"><span>Tu lugar en ${G?(window.SALA&&SALA.ico?'<i class="h3s-ic">'+SALA.ico(s.g)+'</i>':G.emoji)+' '+es(G.name):'la mesa'} te espera <b id="h3seatT">${left(s)}</b></span><button class="ui-btn" onclick="casaVolver()">Volver a mi lugar</button><button class="ui-btn sec" onclick="casaSoltar()" title="El bot se queda con tu asiento">Dejarlo</button></div>`}
let sT=0;
function seatTick(now){if(now-sT<500)return;sT=now;const el=document.getElementById('h3seat');if(!el)return;const s=seat();
 if(s){const b=document.getElementById('h3seatT');if(b)b.textContent=left(s)}else if(typeof render=='function')render()}
window.casaVolver=()=>{const s=seat();drop();if(!s)return render();const go=()=>{enter({c:s.c,t:s.t});send({t:'sit'})};
 if(window.CCAM)CCAM.fade(1,300).then(()=>{go();setTimeout(()=>CCAM.fade(0,450),350)});else go()};
window.casaSoltar=()=>{const s=seat();drop();if(s)api('act',{c:s.c,t:s.t,m:{t:'leave'}}).catch(()=>{});if(typeof sfx=='function')sfx('tick');render()};
const css=document.createElement('style');css.textContent=`#h3seat{position:fixed;z-index:24;left:50%;top:calc(env(safe-area-inset-top,0px) + 62px);transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:6px 8px 6px 12px;max-width:calc(100% - 20px);white-space:nowrap;pointer-events:auto}
#h3seat b{font-variant-numeric:tabular-nums}@media (max-width:560px){#h3seat{top:calc(env(safe-area-inset-top,0px) + 56px);font-size:13px;white-space:normal;flex-wrap:wrap;justify-content:center}}`;document.head.appendChild(css);

window.SOT={ok,piso,cantina,modo,seatHud,seatTick};
})();
