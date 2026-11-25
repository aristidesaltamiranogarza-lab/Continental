// c_mipj.js — MIPJ: pantalla "Mi personaje" (estilo Cálida). Vista previa (se arrastra para girar; en Pelo gira sola) y pestañas
// Pelo, Cara, Ropa con cada opción dibujada (AV2D.retrato con tus colores, recortada a lo que cambia), sin números.
// La cámara sigue a la pestaña: cabeza en Pelo y Cara, cuerpo entero en Ropa. Hombre/Mujer cambia el cuerpo; falda y vestido
// solo para mujer (AV.OPC). MIPJ.abrir(); al cerrar guarda con AV.mio(código) y, si estás en una sala, avisa al servidor (act 'av').
(function(){
const TABS=[['pelo','pelo','Pelo'],['cara','cara','Cara'],['ropa','ropa','Ropa']];
const PAL=['pelo','piel','ropa','ropa'];
const NOM={a:{1:'Manga larga',2:'Sudadera',3:['Camisa','Blusa'],4:'Crupier',5:'Playera',6:'Chamarra',7:'Vestido'},
 d:{1:'Pantalón',2:'Short',3:'Falda',4:'Cargo'},p:'Peinado',c:'Cejas',b:'Boca',n:'Nariz'};
// recorte de cada miniatura: centro y medio alto (fracción del alto sin pelo), giro, y si se esconde el pelo
// (pz: se encuadra en esa pieza, pad = cuantas veces su tamano)
const REC={p:{plano:'cara',giro:.55},c:{pz:'Cejas',pad:1.25,giro:0,calvo:1},b:{pz:'Boca',pad:2.6,giro:0,calvo:1},n:{pz:'Nariz',medio:.17,giro:.6,calvo:1,tono:.86},
 a:{c:.5,w:.19,giro:.35,calvo:1},a7:{c:.4,w:.27,giro:.35,calvo:1},d:{c:.22,w:.23,giro:.35,calvo:1}};
let el=null,o=null,tab='pelo',r3=null,raf=0,ang=.5,giro=false,arr=null,prev='',gen=0;
const I=n=>window.UI&&UI.ico?UI.ico(n):'';
const cache=new Map();   // código + recorte -> dataURL de la miniatura
function css(){if(document.getElementById('mjCss'))return;const s=document.createElement('style');s.id='mjCss';s.textContent=`
.ui-sheet.mj{height:88%}
.mj-bd{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px}
.mj-vista{position:relative;flex:none;height:clamp(160px,30vh,300px);border-radius:var(--ui-r);background:var(--ui-chip);overflow:hidden;touch-action:none;cursor:grab}
.mj-vista:active{cursor:grabbing}.mj-vista canvas{width:100%;height:100%;display:block}
.mj-carga{position:absolute;inset:0;display:grid;place-items:center;color:var(--ui-sub)}
.mj-fl{position:absolute;display:flex;gap:6px}.mj-fl.iz{top:8px;left:8px}.mj-fl.de{top:8px;right:8px}.mj-fl.ab{bottom:8px;right:8px}
.mj-rb{width:44px;height:44px;border-radius:999px;border:1px solid var(--ui-line);background:var(--ui-panel);color:var(--ui-text);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
.mj-rb.on{background:var(--ui-accent);color:var(--ui-on);border-color:transparent}
.mj .ui-seg button{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-weight:800}
.mj .ui-seg button svg{width:20px;height:20px;flex:none}
.mj-c{flex:1;min-height:0;overflow:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;display:flex;flex-direction:column;gap:14px;padding:7px}
.mj-g{display:flex;flex-direction:column;gap:6px}
.mj-ops{display:flex;flex-wrap:wrap;gap:8px}
.mj-op{position:relative;width:64px;height:64px;border-radius:16px;border:1px solid var(--ui-line);background:var(--ui-field);cursor:pointer;padding:0;overflow:hidden;flex:none}
.mj-op img{width:100%;height:100%;display:block;object-fit:cover}
.mj-op:not(.ok)::after{content:'';position:absolute;inset:14px;border-radius:999px;background:var(--ui-chip)}
.mj-op.on{box-shadow:0 0 0 3px var(--ui-sheet),0 0 0 5px var(--ui-accent);border-color:transparent}
.mj-op.off{opacity:.4}
.mj-op.big{width:76px;height:76px}
.mj-sw{width:40px;height:40px;border-radius:999px;border:2px solid var(--ui-line);cursor:pointer;padding:0;flex:none}
.mj-sw.on{box-shadow:0 0 0 3px var(--ui-sheet),0 0 0 5px var(--ui-accent)}
.mj-ft{display:flex;padding-top:10px;flex:none}.mj-ft .ui-btn{flex:1}
@media (min-width:768px){.ui-sheet.mj{height:min(720px,calc(100% - 32px));max-height:none}}
@media (orientation:landscape) and (min-width:600px){
 .ui-sheet.mj{height:94%}
 .mj-bd{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);grid-template-rows:auto minmax(0,1fr);gap:10px 14px}
 .mj-vista{grid-row:1/3;height:auto}
}
@media (orientation:landscape) and (max-height:420px){.mj-op{width:56px;height:56px;border-radius:14px}.mj-op.big{width:64px;height:64px}.mj-sw{width:36px;height:36px}.mj-c{gap:10px}}
@media (orientation:landscape) and (min-width:768px){.ui-sheet.mj{width:min(900px,calc(100% - 32px));height:min(580px,calc(100% - 32px))}}`;document.head.appendChild(s)}

const cod=()=>AV.codificar(o);
const nom=(k,v)=>{const n=NOM[k];const t=typeof n==='string'?n+' '+v:n[v];return Array.isArray(t)?t[o.s-1]:t};
// miniaturas: botón con un <img> que se llena cuando AV2D termina de dibujarla
// lo que no se ve en el recorte se deja fijo (así la miniatura sirve aunque cambies otra cosa)
const vars=(k,v)=>{const x={...o,col:o.col.slice()};if('cbn'.includes(k)){x.p=1;x.a=1;x.d=1}if(k==='p'){x.a=1;x.d=1}
 if(k==='a'&&v!==7)x.d=1;if(k==='d')x.a=1;if(k!=='p'&&k!=='a'&&k!=='d'){x.c=k==='c'?x.c:1;x.b=k==='b'?x.b:1;x.n=k==='n'?x.n:1}
 x[k]=v;return AV.codificar(x)};
const llave=(c,r)=>c+'|'+r;
function op(k,v,big){const r=k==='a'&&v===7?'a7':k,c=vars(k,v),src=cache.get(llave(c,r)),on=o[k]===v,off=k==='d'&&o.a===7;
 return `<button type="button" class="mj-op ${big?'big':''} ${on?'on':''} ${off?'off':''} ${src?'ok':''}" data-c="${c}" data-r="${r}" aria-pressed="${on}" aria-label="${nom(k,v)}" title="${nom(k,v)}" onclick="MIPJ.pon('${k}',${v})">${src?`<img alt="" src="${src}">`:''}</button>`}
const ops=(k,lista,big)=>`<div class="mj-ops">${lista.map(v=>op(k,v,big)).join('')}</div>`;
const n=(k,m)=>Array.from({length:m},(_,i)=>i+1);
const sw=(i,t)=>`<div class="mj-ops">${AV.PAL[PAL[i]].map((c,j)=>`<button type="button" class="mj-sw ${o.col[i]===j?'on':''}" style="background:${c}" aria-label="${t} ${j+1}" aria-pressed="${o.col[i]===j}" onclick="MIPJ.col(${i},${j})"></button>`).join('')}</div>`;
const grp=(t,h)=>`<div class="mj-g"><span class="ui-lbl">${t}</span>${h}</div>`;
function cuerpo(){
 if(tab==='pelo')return grp('Peinado',ops('p',n('p',7)))+grp('Color',sw(0,'Color de pelo'));
 if(tab==='cara')return grp('Piel',sw(1,'Piel'))+grp('Cejas',ops('c',n('c',3)))+grp('Boca',ops('b',n('b',3)))+grp('Nariz',ops('n',n('n',3)));
 return grp('Arriba',ops('a',AV.OPC.a[o.s],1)+sw(2,'Color de arriba'))+grp('Abajo',ops('d',AV.OPC.d[o.s],1)+sw(3,'Color de abajo'))}
const rb=(ic,on,fn,t)=>`<button type="button" class="mj-rb ${on?'on':''}" aria-pressed="${!!on}" aria-label="${t}" title="${t}" onclick="MIPJ.${fn}">${I(ic)}</button>`;
function pinta(){if(!el)return;
 el.querySelector('.mj-fl.iz').innerHTML=rb('hombre',o.s===1,"cuerpo(1)",'Hombre')+rb('mujer',o.s===2,"cuerpo(2)",'Mujer');
 el.querySelector('.mj-fl.de').innerHTML=rb('girar',giro,'gira()',giro?'Dejar de girar':'Girar');
 el.querySelector('.mj-t').innerHTML=`<div class="ui-seg full" role="tablist">${TABS.map(([v,ic,t])=>`<button type="button" role="tab" class="${v===tab?'on':''}" aria-selected="${v===tab}" onclick="MIPJ.tab('${v}')">${I(ic)}<span>${t}</span></button>`).join('')}</div>`;
 const c=el.querySelector('.mj-c'),y=c.scrollTop;c.innerHTML=cuerpo();c.scrollTop=y;miniaturas()}
function cambia(){pinta();if(r3&&r3.p)AV.cambiar(r3.p,cod())}

// ---------- miniaturas (una a la vez; si cambia algo, la tanda vieja se abandona) ----------
const calvo=p=>p.traverse(x=>{if(/^Pelo_/.test(x.name))x.visible=false});
// la nariz es del mismo material que la cara: en su miniatura va un tono más oscura (así tiene contorno)
function entona(p,pz,k){const re=new RegExp('^'+pz+'_');p.traverse(m=>{if(m.isMesh&&(re.test(m.name)||re.test(m.parent&&m.parent.name||''))){
 const f=x=>{x=x.clone();x.name='';if(x.color)x.color.multiplyScalar(k);return x};m.material=Array.isArray(m.material)?m.material.map(f):f(m.material)}})}
// caja en el mundo de la pieza visible cuyo nombre empieza con pz (la pieza o su padre, si tiene varias mallas)
function caja(p,pz){const b=new THREE.Box3(),re=new RegExp('^'+pz+'_'),vis=x=>{for(;x;x=x.parent)if(!x.visible)return false;return true};
 p.updateMatrixWorld(true);p.traverse(m=>{if(m.isMesh&&vis(m)&&(re.test(m.name)||re.test(m.parent&&m.parent.name||'')))b.expandByObject(m,true)});return b}
async function miniaturas(){if(!window.AV2D)return;const g=++gen,tam=Math.round(72*Math.min(2,devicePixelRatio||1));
 for(const b of [...el.querySelectorAll('.mj-op:not(.ok)')]){if(g!==gen||!el)return;
  const c=b.dataset.c,r=b.dataset.r,k=llave(c,r);let src=cache.get(k);
  if(!src){const R=REC[r];
   const ops={tam,giro:R.giro,linea:.008,borde:.01,lineasCara:!!R.lineas,extra:R.calvo?calvo:null};
   if(R.plano)ops.plano=R.plano;
   else if(R.pz){let pb=null;ops.extra=p=>{calvo(p);if(R.tono)entona(p,R.pz,R.tono);pb=caja(p,R.pz)};
    ops.marco=()=>{const c=pb.getCenter(new THREE.Vector3()),z=pb.getSize(new THREE.Vector3()),s=R.medio||Math.max(z.x,z.y)*R.pad/2;return [c.y-s,c.y+s]};
    ops.cx=()=>pb.getCenter(new THREE.Vector3()).x}
   else ops.marco=box=>{const h=box.max.y-box.min.y;return [box.min.y+h*(R.c-R.w),box.min.y+h*(R.c+R.w)]};
   try{const cv=await AV2D.retrato(c,ops);src=cv.toDataURL('image/png');cache.set(k,src);if(cache.size>160)cache.delete(cache.keys().next().value)}catch(e){console.warn('[MIPJ] miniatura',e);return}}
  if(g!==gen||!el)return;
  for(const x of el.querySelectorAll(`.mj-op[data-r="${r}"]`))if(x.dataset.c===c&&!x.classList.contains('ok')){x.classList.add('ok');x.innerHTML=`<img alt="" src="${src}">`}
  await new Promise(f=>requestAnimationFrame(f))}}

// ---------- vista previa ----------
// caja de lo visible ya con huesos y pose (setFromObject mide la pose de enlace y piezas ocultas)
function medir(p){const T=THREE,b=new T.Box3(),v=new T.Vector3();p.updateMatrixWorld(true);
 p.traverse(m=>{if(!m.isMesh||!m.visible)return;let q=m;while(q){if(!q.visible)return;q=q.parent}const g=m.geometry.attributes.position;
  for(let i=0;i<g.count;i+=5){m.getVertexPosition(i,v);b.expandByPoint(v.applyMatrix4(m.matrixWorld))}});return b}
// encuadre por pestaña: [centro, distancia]; se acerca suave
function meta(){const c=r3.c.clone(),h=r3.h;if(tab==='ropa')return [c,r3.dist];
 c.y=r3.top-h*.21;return [c,r3.dist*.66]}
function vista(cv){const T=THREE,ren=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true});ren.setPixelRatio(Math.min(2,devicePixelRatio||1));
 if('outputColorSpace' in ren)ren.outputColorSpace=T.SRGBColorSpace;
 const esc=new T.Scene(),cam=new T.PerspectiveCamera(30,1,.05,50);
 esc.add(new T.HemisphereLight(0xfff4e6,0x6b4a35,1.6));const d=new T.DirectionalLight(0xffffff,1.8);d.position.set(2,3,4);esc.add(d);
 r3={ren,esc,cam,p:null,cv};
 AV.crear(cod()).then(p=>{if(!r3||r3.ren!==ren)return AV.quita(p);r3.p=p;esc.add(p);AV.pose(p,'Reposo',0);
  const b=medir(p),c=b.getCenter(new T.Vector3()),h=b.max.y-b.min.y;
  r3.c=c;r3.h=h;r3.top=b.max.y;r3.dist=h/2/Math.tan(cam.fov*Math.PI/360)*1.25;const [mc,md]=meta();r3.vc=mc.clone();r3.vd=md;
  const cg=el&&el.querySelector('.mj-carga');if(cg)cg.remove()})
  .catch(e=>{console.warn('[MIPJ]',e);const cg=el&&el.querySelector('.mj-carga');if(cg)cg.textContent='No se pudo cargar el personaje.'});
 const cuadro=()=>{if(!r3)return;raf=requestAnimationFrame(cuadro);const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
  if(cv.width!==Math.round(w*ren.getPixelRatio())){ren.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
  if(r3.p){if(giro&&!arr)ang+=.008;r3.p.rotation.y=ang;const [mc,md]=meta();r3.vc.lerp(mc,.12);r3.vd+=(md-r3.vd)*.12;
   const c=r3.vc;cam.position.set(c.x,c.y+r3.vd*.08,c.z+r3.vd);cam.lookAt(c)}
  ren.render(esc,cam)};cuadro();
 // arrastrar para girar
 cv.addEventListener('pointerdown',e=>{arr={x:e.clientX,a:ang};if(giro){giro=false;pinta()}cv.setPointerCapture(e.pointerId)});
 cv.addEventListener('pointermove',e=>{if(arr)ang=arr.a+(e.clientX-arr.x)*.012});
 const suelta=()=>{arr=null};cv.addEventListener('pointerup',suelta);cv.addEventListener('pointercancel',suelta)}
function apaga(){cancelAnimationFrame(raf);if(!r3)return;if(r3.p)AV.quita(r3.p);r3.ren.dispose();r3.ren.forceContextLoss&&r3.ren.forceContextLoss();r3=null}

function teclas(e){if(e.key==='Escape'){e.stopPropagation();MIPJ.cerrar()}}
window.MIPJ={
 abrir(){if(el||!window.AV)return;css();o=AV.leer(AV.mio());prev=cod();tab='pelo';giro=true;
  el=document.createElement('div');el.className='ui mj-raiz';
  el.innerHTML=`<div class="ui-scrim" onclick="MIPJ.cerrar()"></div><div class="ui ui-sheet mid mj" role="dialog" aria-label="Mi personaje">
<div class="ui-hd"><h2 class="ui-h">Mi personaje</h2><button class="ui-x" onclick="MIPJ.cerrar()" aria-label="Cerrar">${I('x')}</button></div>
<div class="mj-bd"><div class="mj-vista"><canvas aria-label="Vista previa del personaje (arrastra para girar)"></canvas><div class="mj-carga">Cargando…</div>
<div class="mj-fl iz"></div><div class="mj-fl de"></div><div class="mj-fl ab"><button type="button" class="mj-rb" aria-label="Al azar" title="Al azar" onclick="MIPJ.azar()">${I('dado')}</button></div></div>
<div class="mj-t"></div><div class="mj-c"></div></div>
<div class="mj-ft"><button class="ui-btn" onclick="MIPJ.cerrar()">Listo</button></div></div>`;
  document.body.appendChild(el);pinta();addEventListener('keydown',teclas,true);vista(el.querySelector('canvas'))},
 cerrar(){if(!el)return;gen++;const c=AV.mio(cod());try{localStorage.setItem('cont_av_hecho','1')}catch(e){}
  if(c!==prev&&typeof S!=='undefined'&&S&&S.c&&typeof api==='function')api('act',{c:S.c,t:S.t,m:{t:'av',av:c}}).catch(()=>{});
  removeEventListener('keydown',teclas,true);apaga();el.remove();el=null;if(MIPJ.onCambio&&c!==prev)MIPJ.onCambio(c)},
 abierto:()=>!!el,
 tab(t){tab=t;giro=t==='pelo';if(t!=='pelo')ang=.5;const c=el&&el.querySelector('.mj-c');if(c)c.scrollTop=0;pinta()},
 cuerpo(s){o.s=+s;o=AV.leer(cod());cambia()},
 gira(){giro=!giro;pinta()},
 pon(k,v){o[k]=v;if(k==='d'&&o.a===7)o.a=1;cambia()},
 col(i,j){o.col[i]=j;cambia()},
 azar(){o=AV.leer(AV.azar(o.s));cambia()}
};
})();
