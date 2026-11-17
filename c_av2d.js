// c_av2d.js — AV2D: el personaje de c_avatar.js dibujado en 2D (sombra plana en dos tonos, contorno y líneas entre piezas).
//   AV2D.retrato('s1p3c1b2n1a2d3-2051',{tam:256,plano:'busto',giro:.3,pose:'Reposo',fondo:'#d9a441'}).then(cv=>...)
//   plano: 'cara' | 'busto' | 'cuerpo'.  pose: una pose o un emote del GLB (emote en el segundo t).  AV2D.galeria() o ?av2d
(function(){
const S=4,TINTA='#3A2416';   // S: sobremuestreo (se dibuja grande y se reduce, eso da el suavizado)
let R=null;
function motor(){if(R)return R;const T=THREE,cv=document.createElement('canvas');
 const ren=new T.WebGLRenderer({canvas:cv,antialias:false,alpha:true,preserveDrawingBuffer:true});
 if('outputColorSpace' in ren)ren.outputColorSpace=T.SRGBColorSpace;ren.setClearColor(0,0);
 const esc=new T.Scene(),cam=new T.OrthographicCamera(-1,1,1,-1,.01,50);
 const luz=new T.DirectionalLight(0xffffff,1.5);luz.position.set(-1.2,2.2,4);esc.add(new T.AmbientLight(0xffffff,1.25),luz);
 const g=new T.DataTexture(new Uint8Array([196,196,196,255,232,232,232,255,255,255,255,255]),3,1,T.RGBAFormat);
 g.minFilter=g.magFilter=T.NearestFilter;g.needsUpdate=true;
 return R={ren,esc,cam,g}}

function ponPose(p,nom,t){const u=p.userData.av;if(!nom)return;
 AV.pose(p,nom,0);if(u.nomPose===nom)return;   // era pose
 if(AV.emote(p,nom,.02)){for(const n in u.acc){const a=u.acc[n];if(a.dedo)continue;if(a.getClip().name===nom){a.setEffectiveWeight(1);a.time=t||0}else a.stop()}}}
function materiales(p){const T=THREE,R=motor(),toon=new Map(),ids=new Map();let i=0;const lista=[];
 p.traverse(o=>{if(!o.isMesh||!o.visible)return;const ms=Array.isArray(o.material)?o.material:[o.material];
  for(const m of ms){if(toon.has(m))continue;i++;
   toon.set(m,new T.MeshToonMaterial({color:m.color?m.color.clone():0xffffff,map:m.map||null,gradientMap:R.g,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest,side:m.side}));
   const c=new T.Color();c.setRGB(((i*97)%251)/255,((i*53+40)%251)/255,((i*29+90)%251)/255,T.LinearSRGBColorSpace);
   ids.set(m,new T.MeshBasicMaterial({color:c,side:m.side,alphaTest:m.alphaTest}))}
  lista.push([o,o.material])});
 // rasgos de la cara (ojos, cejas, boca, nariz) cuentan como piel: sin líneas alrededor, que se vean limpios
 const piel=[...ids.keys()].find(m=>m.name==='av_piel'),rasgo=(o,x)=>piel&&(/^(Cejas|Nariz|Boca)/.test(o.name)||/^av_(ojo|boca)$/.test(x.name));
 const usa=(mp,cara)=>{for(const [o,m] of lista){const f=x=>mp.get(cara&&rasgo(o,x)?piel:x);o.material=Array.isArray(m)?m.map(f):f(m)}};
 return {toon:()=>usa(toon),id:()=>usa(ids,1),fin:()=>{for(const [o,m] of lista)o.material=m;for(const m of toon.values())m.dispose();for(const m of ids.values())m.dispose()}}}
const PLANO={cara:.43,busto:.6,cuerpo:1};
async function retrato(cod,o={}){const T=THREE;o={tam:256,plano:'busto',giro:.3,pose:'Reposo',t:0,fondo:null,borde:.022,linea:.006,...o};
 const p=await AV.crear(cod);const u=p.userData.av,R=motor();
 p.rotation.y=o.giro;ponPose(p,o.pose,o.t);u.mixer.update(0);p.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(p,true),alto=box.max.y-box.min.y,fr=PLANO[o.plano]||.6;
 const y1=box.max.y+alto*.02,y0=box.max.y-alto*fr-(fr>=1?alto*.02:0),lado=(y1-y0)*(1+o.borde*4),cx=(box.min.x+box.max.x)/2,cy=(y0+y1)/2;
 const c=R.cam;c.left=cx-lado/2;c.right=cx+lado/2;c.top=cy+lado/2;c.bottom=cy-lado/2;c.position.set(0,0,box.max.z+10);c.near=.01;c.far=box.max.z-box.min.z+20;c.updateProjectionMatrix();
 R.esc.add(p);const big=o.tam*S;R.ren.setSize(big,big,false);const mt=materiales(p);
 const lienzo=()=>{const k=document.createElement('canvas');k.width=k.height=big;return k};
 mt.toon();R.ren.render(R.esc,c);const col=lienzo();col.getContext('2d').drawImage(R.ren.domElement,0,0);
 mt.id();R.ren.render(R.esc,c);const idc=lienzo(),ix=idc.getContext('2d');ix.drawImage(R.ren.domElement,0,0);
 mt.fin();R.esc.remove(p);AV.quita&&AV.quita(p);
 // líneas: píxel con vecino de otra pieza (a una distancia de k)
 const d=ix.getImageData(0,0,big,big).data,k=Math.max(1,Math.round(o.linea*big)),lin=ix.createImageData(big,big),L=lin.data;
 const tr=parseInt(TINTA.slice(1),16),tc=[tr>>16,tr>>8&255,tr&255];
 for(let y=0;y<big;y++)for(let x=0;x<big;x++){const i=(y*big+x)*4;if(d[i+3]<128)continue;
  const v=d[i]<<16|d[i+1]<<8|d[i+2];let otro=false;
  for(const [dx,dy] of [[k,0],[-k,0],[0,k],[0,-k]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=big||Y>=big)continue;const j=(Y*big+X)*4;
   if(d[j+3]>=128&&(d[j]<<16|d[j+1]<<8|d[j+2])!==v){otro=true;break}}
  if(otro){L[i]=tc[0];L[i+1]=tc[1];L[i+2]=tc[2];L[i+3]=255}}
 // silueta para el contorno de afuera
 const sil=lienzo(),sx=sil.getContext('2d');sx.drawImage(col,0,0);sx.globalCompositeOperation='source-in';sx.fillStyle=TINTA;sx.fillRect(0,0,big,big);
 const fin=lienzo(),fx=fin.getContext('2d'),rb=o.borde*big;
 fx.filter=`blur(${S*.3}px)`;for(let a=0;a<36;a++){const g=a/36*Math.PI*2;fx.drawImage(sil,Math.cos(g)*rb,Math.sin(g)*rb)}
 fx.filter='none';fx.drawImage(col,0,0);fx.filter=`blur(${S*.25}px)`;const ln=lienzo();ln.getContext('2d').putImageData(lin,0,0);fx.drawImage(ln,0,0);fx.filter="none";
 const out=document.createElement('canvas');out.width=out.height=o.tam;const ox=out.getContext('2d');ox.imageSmoothingEnabled=true;ox.imageSmoothingQuality='high';
 if(o.fondo){ox.fillStyle=o.fondo;ox.beginPath();ox.arc(o.tam/2,o.tam/2,o.tam/2,0,Math.PI*2);ox.fill()}
 ox.drawImage(fin,0,0,o.tam,o.tam);return out}

// ---------- galería para ver y bajar los dibujos ----------
const CSS=`.av2d{position:fixed;inset:0;z-index:9999;background:var(--ui-scrim);display:flex;align-items:center;justify-content:center;padding:16px}
.av2d-in{background:var(--ui-sheet);color:var(--ui-text);border:1px solid var(--ui-line);border-radius:var(--ui-r);box-shadow:var(--ui-shadow);max-width:1100px;width:100%;max-height:100%;overflow:auto;padding:18px}
.av2d-hd{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}.av2d-hd b{font-size:18px;margin-right:auto}
.av2d h3{font-size:14px;color:var(--ui-sub);margin:14px 0 6px}.av2d-g{display:flex;flex-wrap:wrap;gap:10px}
.av2d-c{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px;color:var(--ui-sub);cursor:pointer;border-radius:16px;padding:6px;background:var(--ui-chip)}
.av2d-c canvas{width:132px;height:132px}.av2d select{font:inherit;color:var(--ui-text);background:var(--ui-field);border:1px solid var(--ui-line);border-radius:999px;padding:6px 10px}`;
const FONDOS=[null,'#d9a441','#8fae8b','#2f6f73','#d9a3a0','#efe3cf'];
async function galeria(){await AV.listo();if(!document.getElementById('av2d-css')){const s=document.createElement('style');s.id='av2d-css';s.textContent=CSS;document.head.appendChild(s)}
 document.querySelector('.av2d')?.remove();const el=document.createElement('div');el.className='av2d ui';
 let mio='';try{mio=localStorage.getItem('cont_av')||''}catch(e){}if(!mio)mio=AV.azar();
 const clips=Object.keys((await AV.listo()).clips||{}).filter(n=>!/^(Agarre|Amartilla)_|_\d$/.test(n));
 el.innerHTML=`<div class="av2d-in"><div class="av2d-hd"><b>Personajes en 2D</b>
 <select data-f>${FONDOS.map((f,i)=>`<option value="${i}">${f?'Fondo '+i:'Sin fondo'}</option>`).join('')}</select>
 <button class="ui-btn sec" data-az>Otros al azar</button><button class="ui-btn" data-x>Cerrar</button></div>
 <div style="font-size:12px;color:var(--ui-sub)">Toca un dibujo para bajarlo en PNG (512 px).</div><div data-c></div></div>`;
 document.body.appendChild(el);const caja=el.querySelector('[data-c]');let gen=0;
 const fondo=()=>FONDOS[+el.querySelector('[data-f]').value];
 const tarjeta=async(g,cod,o,txt,id)=>{const cv=await retrato(cod,{...o,tam:264,fondo:fondo()});if(id!==gen)return;const d=document.createElement('div');d.className='av2d-c';d.title=cod;
  d.append(cv,txt);d.onclick=async()=>{const big=await retrato(cod,{...o,tam:512,fondo:fondo()});const a=document.createElement('a');a.download=`personaje_${cod}_${o.plano}${o.pose&&o.pose!=='Reposo'?'_'+o.pose:''}.png`;a.href=big.toDataURL('image/png');a.click()};g.appendChild(d)};
 const pinta=async()=>{const id=++gen;caja.innerHTML='';const sec=t=>{const h=document.createElement('h3');h.textContent=t;const g=document.createElement('div');g.className='av2d-g';caja.append(h,g);return g};
  let g=sec('Tu personaje');for(const pl of ['cara','busto','cuerpo'])await tarjeta(g,mio,{plano:pl},pl,id);
  for(const gi of [0,.8])await tarjeta(g,mio,{plano:'busto',giro:gi},gi?'perfil 3/4':'de frente',id);
  g=sec('Poses y bailes');for(const c of clips)await tarjeta(g,mio,{plano:'cuerpo',pose:c,t:.6},c,id);
  g=sec('Otros personajes');for(let i=0;i<12;i++)await tarjeta(g,AV.azar(),{plano:'busto'},'',id)};
 el.querySelector('[data-x]').onclick=()=>{gen++;el.remove()};el.querySelector('[data-az]').onclick=pinta;el.querySelector('[data-f]').onchange=pinta;pinta()}
window.AV2D={retrato,galeria};
if(/[?&]av2d\b/.test(location.search))addEventListener('load',()=>setTimeout(galeria,500));
})();
