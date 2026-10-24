// Continental 3D: capa visual opcional. NO cambia reglas ni servidor.
// Se carga DESPUES de c_continental.js y envuelve GM.continental.body para poner una mesa 3D arriba.
// Tu mano, el armado, los botones y todo el resto siguen siendo el HTML de siempre (fácil de tocar en celular).
(function(){
if(typeof THREE==='undefined'||!GM||!GM.continental){console.warn('Continental 3D: falta Three.js o GM.continental');return}
const orig=GM.continental.body;
let on=true;try{on=localStorage.getItem('cont_3d')!=='0'}catch(e){}
let R,SC,CA,wrap,cv,W=0,Hh=0,ready=false,raf=0;
const cardsById=new Map(),backTex={},faceTex={};
const CW=.9,CH=1.26,CT=.02;            // tamaño de carta en unidades del mundo
const DECK=new THREE.Vector3(-1.6,0,0),DISC=new THREE.Vector3(-.4,0,0);

// ---------- texturas ----------
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function tex(c){const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function backTexture(){const k=(typeof sback!=='undefined'?sback:'red');if(backTex[k])return backTex[k];
 const c=mkCanvas(128,180),g=c.getContext('2d'),col={red:['#8e1b1b','#6d1313'],blue:['#1e4fa3','#16367a'],gold:['#c9a227','#9c7c14'],neon:['#00b8d4','#7a00cc']}[k]||['#8e1b1b','#6d1313'];
 g.fillStyle='#fffdf4';rr(g,0,0,128,180,12);g.fill();g.save();rr(g,8,8,112,164,8);g.clip();
 for(let i=-200;i<300;i+=12){g.fillStyle=(i/12)%2?col[0]:col[1];g.save();g.translate(i,0);g.rotate(Math.PI/4);g.fillRect(0,-50,6,400);g.restore()}
 g.restore();return backTex[k]=tex(c)}
function faceTexture(id){if(faceTex[id])return faceTex[id];const c0=C(id),c=mkCanvas(128,180),g=c.getContext('2d');
 const grad=g.createLinearGradient(0,0,128,180);grad.addColorStop(0,'#fffdf4');grad.addColorStop(1,'#e9e3cf');
 g.fillStyle=grad;rr(g,0,0,128,180,12);g.fill();g.strokeStyle='#0002';g.lineWidth=2;rr(g,1,1,126,178,12);g.stroke();
 const red=!c0.j&&(c0.s==1||c0.s==2);g.fillStyle=red?'#c62828':'#1b1b1b';g.textAlign='center';g.textBaseline='middle';
 if(c0.j){g.font='72px serif';g.fillText('🃏',64,90);g.font='700 14px system-ui';g.fillText('COMODÍN',64,160)}
 else{const r=RN[c0.r-1],s=SU[c0.s];g.font='700 '+(r.length>1?40:48)+'px system-ui';g.fillText(r,64,62);g.font='56px system-ui';g.fillText(s,64,122);
  g.font='700 20px system-ui';g.textAlign='left';g.fillText(r,10,24);g.font='18px system-ui';g.fillText(s,10,44)}
 return faceTex[id]=tex(c)}

// ---------- cartas 3D ----------
function mkCard(id){const geo=new THREE.BoxGeometry(CW,CT,CH);
 const edge=new THREE.MeshStandardMaterial({color:0xf3eedd,roughness:.7});
 const top=new THREE.MeshStandardMaterial({map:id==null?backTexture():faceTexture(id),roughness:.55});
 const bot=new THREE.MeshStandardMaterial({map:backTexture(),roughness:.55});
 const m=new THREE.Mesh(geo,[edge,edge,top,bot,edge,edge]);m.castShadow=true;m.receiveShadow=true;m.userData={id,tw:null};return m}
function setFace(m,id){m.userData.id=id;m.material[2].map=id==null?backTexture():faceTexture(id);m.material[2].needsUpdate=true}
// movimiento suave hacia un destino
function goTo(m,p,ry,rz,ms,delay){m.userData.tw={from:m.position.clone(),to:p.clone(),fr:m.rotation.y,tr:ry,fz:m.rotation.z,tz:rz,t0:performance.now()+(delay||0),ms:RM?1:(ms||450)}}
function stepTw(now){cardsById.forEach(m=>{const t=m.userData.tw;if(!t)return;let k=(now-t.t0)/t.ms;if(k<0)return;if(k>=1){k=1;m.userData.tw=null}
 const e=1-Math.pow(1-k,3);m.position.lerpVectors(t.from,t.to,e);m.position.y+=Math.sin(Math.PI*k)*.9;m.rotation.y=t.fr+(t.tr-t.fr)*e;m.rotation.z=t.fz+(t.tz-t.fz)*e})}

// ---------- escena ----------
function bgCol(){return ({green:0x1b7a4f,red:0x8a2a30,blue:0x2a6db0,orange:0xb8681a})[typeof sbg!=='undefined'?sbg:'green']||0x1b7a4f}
function init(){if(ready)return;ready=true;
 R=new THREE.WebGLRenderer({antialias:true,alpha:true});R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
 SC=new THREE.Scene();CA=new THREE.PerspectiveCamera(38,1,.1,60);
 SC.add(new THREE.HemisphereLight(0xffffff,0x1a3a2a,.85));
 const L=new THREE.DirectionalLight(0xfff4d6,1.1);L.position.set(-3,9,5);L.castShadow=true;L.shadow.mapSize.set(1024,1024);
 Object.assign(L.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:1,far:25});SC.add(L);
 // mesa: tapete + borde de madera
 const felt=new THREE.Mesh(new THREE.CylinderGeometry(6.2,6.2,.2,64),new THREE.MeshStandardMaterial({color:bgCol(),roughness:.95}));felt.position.y=-.12;felt.scale.set(1.35,1,.82);felt.receiveShadow=true;felt.name='felt';SC.add(felt);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(6.2,.28,16,80),new THREE.MeshStandardMaterial({color:0x6b4423,roughness:.6}));rim.rotation.x=Math.PI/2;rim.position.y=-.02;rim.scale.set(1.35,.82,1);SC.add(rim);
 CA.position.set(0,9.2,6.6);CA.lookAt(0,0,.3);
 cv=R.domElement;cv.style.cssText='width:100%;height:100%;display:block;touch-action:manipulation';
 raf=requestAnimationFrame(loop3)}
function loop3(now){raf=requestAnimationFrame(loop3);if(!wrap||!wrap.isConnected)return;stepTw(now);R.render(SC,CA)}
function fit(){if(!wrap||!R)return;const w=wrap.clientWidth,h=wrap.clientHeight;if(w===W&&h===Hh)return;W=w;Hh=h;R.setSize(w,h,false);CA.aspect=w/h;
 // en pantallas estrechas (celular vertical) alejo un poco la cámara para que quepa toda la mesa
 const z=w/h<1?Math.min(14,6.6+(1-w/h)*9):6.6;CA.position.set(0,9.2+(z-6.6)*.9,z);CA.lookAt(0,0,.3);CA.updateProjectionMatrix()}
addEventListener('resize',()=>{W=0;fit()});

// ---------- sincronizar escena con el estado del servidor ----------
function posSeat(k,n,me){ // asientos alrededor de la mesa; yo abajo
 const i=((k-(me<0?0:me))+n)%n,a=Math.PI/2+i*(2*Math.PI/n);return new THREE.Vector3(Math.cos(a)*5.6,0,Math.sin(a)*3.3)}
function ensure(key,id){let m=cardsById.get(key);if(!m){m=mkCard(id);m.position.copy(DECK);m.position.y=.5;SC.add(m);cardsById.set(key,m)}return m}
function sync(){const G=V.G,n=G.players.length,me=V.me,live=new Set();
 // mazo: pila visual de hasta 6 cartas
 const dn=Math.min(6,G.deck);for(let i=0;i<dn;i++){const key='dk'+i,m=ensure(key,null);live.add(key);setFace(m,null);
  const to=new THREE.Vector3(DECK.x+i*.01,.02+i*CT*1.4,DECK.z);if(!m.userData.tw&&m.position.distanceTo(to)>.01)goTo(m,to,0,Math.PI,350);m.rotation.z=Math.PI}
 // descarte: la carta de arriba + una de abajo para dar grosor
 const dsc=G.disc;if(dsc.length){const top=dsc[dsc.length-1],key='ds'+top;live.add(key);const m=ensure(key,top);setFace(m,top);
  const to=new THREE.Vector3(DISC.x,.04,DISC.z);if(!m.userData.tw&&m.position.distanceTo(to)>.01)goTo(m,to,(top%7-3)*.04,0,420)}
 // mesa de combinaciones (melds): filas por combinación
 G.melds.forEach((mm,r)=>mm.cards.forEach((id,j)=>{const key='ml'+id;live.add(key);const m=ensure(key,id);setFace(m,id);
  const to=new THREE.Vector3(.9+j*.42-(mm.cards.length*.21),.05+j*.002,-2.7+r*.95);if(!m.userData.tw&&m.position.distanceTo(to)>.01)goTo(m,to,0,0,500);m.scale.setScalar(.62)}))
 // manos de los demás: abanico de cartas boca abajo cerca de su asiento
 for(let k=0;k<n;k++){if(k===me)continue;const cnt=hc(k),p=posSeat(k,n,me);
  for(let j=0;j<Math.min(cnt,10);j++){const key='h'+k+'_'+j;live.add(key);const m=ensure(key,null);setFace(m,null);
   const sp=(j-(Math.min(cnt,10)-1)/2),to=new THREE.Vector3(p.x+sp*.28,.05+j*.003,p.z*.78);
   if(!m.userData.tw&&m.position.distanceTo(to)>.01)goTo(m,to,0,Math.PI,420,j*40);m.rotation.z=Math.PI;m.scale.setScalar(.55)}}
 // quitar cartas que ya no existen
 cardsById.forEach((m,key)=>{if(!live.has(key)){SC.remove(m);m.geometry.dispose();cardsById.delete(key)}});
 // resalto de turno: brillo suave en el tapete
 const felt=SC.getObjectByName('felt');if(felt)felt.material.color.setHex(bgCol())}

// ---------- DOM ----------
function ui(){return `<div id="c3d" style="position:relative;width:100%;height:min(46vh,420px);min-height:230px;border-radius:18px;overflow:hidden;border:6px solid #6b4423;box-shadow:inset 0 0 25px #000a,0 4px 10px #0007;margin:8px 0;background:radial-gradient(ellipse at center,#1b7a4f,#0c3d28)"></div>`}
function toggle(){on=!on;try{localStorage.setItem('cont_3d',on?'1':'0')}catch(e){}render()}
GM.continental.body=function(){const h=orig();
 const sw=`<button class="b g sm2" onclick="c3dToggle()">${on?'🖼 Vista clásica 2D':'🎲 Vista 3D'}</button>`;
 // Solo durante la partida en curso. En lobby, fin de ronda y final se ve igual que siempre.
 if(!on||!V||!V.G||V.G.phase!='play')return sw+h;
 // La mesa 3D va ARRIBA; debajo queda todo el HTML de siempre (mazo, descarte, mesa plana, tu mano, botones).
 return sw+ui()+h};
window.c3dToggle=toggle;

// después de cada render(), engancho el canvas al contenedor y sincronizo
const oldAfter=GM.continental.after;
GM.continental.after=function(){if(oldAfter)oldAfter();
 if(!on||!V||!V.G||V.G.phase!='play'){return}
 const slot=document.getElementById('c3d');if(!slot)return;
 try{init();if(wrap!==slot){wrap=slot;slot.appendChild(cv);W=0}fit();sync()}catch(e){console.warn('Continental 3D:',e);on=false;render()}};
})();
