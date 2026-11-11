// c_mipj.js — MIPJ: pantalla "Mi personaje" (estilo Cálida). Vista previa quieta (botón para girar, se arrastra) y pestañas
// Peinado, Cara, Ropa (cada pieza con su color). Hombre/Mujer solo cambia el cuerpo; todas las piezas sirven para los dos.
// MIPJ.abrir(); al cerrar guarda con AV.mio(código) y, si estás en una sala, avisa al servidor (act 'av').
(function(){
const TABS=[['pelo','pelo','Peinado'],['cara','cara','Cara'],['ropa','ropa','Ropa']];
const PAL=['pelo','piel','ropa','ropa'];
let el=null,o=null,tab='pelo',r3=null,raf=0,ang=.5,giro=false,arr=null,prev='';
const I=n=>window.UI&&UI.ico?UI.ico(n):'';
function css(){if(document.getElementById('mjCss'))return;const s=document.createElement('style');s.id='mjCss';s.textContent=`
.ui-sheet.mj{height:86%}
.mj-bd{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px}
.mj-vista{position:relative;flex:none;height:clamp(170px,34vh,320px);border-radius:var(--ui-r);background:var(--ui-chip);overflow:hidden;touch-action:none;cursor:grab}
.mj-vista:active{cursor:grabbing}.mj-vista canvas{width:100%;height:100%;display:block}
.mj-carga{position:absolute;inset:0;display:grid;place-items:center;color:var(--ui-sub)}
.mj-fl{position:absolute;display:flex;gap:6px}.mj-fl.iz{top:8px;left:8px}.mj-fl.de{top:8px;right:8px}.mj-fl.ab{bottom:8px;right:8px}
.mj-rb{width:44px;height:44px;border-radius:999px;border:1px solid var(--ui-line);background:var(--ui-panel);color:var(--ui-text);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
.mj-rb.on{background:var(--ui-accent);color:var(--ui-on);border-color:transparent}
.mj .ui-seg button{min-height:44px;display:inline-flex;align-items:center;justify-content:center}
.mj-c{flex:1;min-height:0;overflow:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;display:flex;flex-direction:column;gap:12px;padding:2px}
.mj-g{display:flex;flex-direction:column;gap:6px}
.mj-ops{display:flex;flex-wrap:wrap;gap:8px}
.mj-op{min-width:44px;height:44px;padding:0 14px;border-radius:999px;border:1px solid var(--ui-line);background:var(--ui-field);color:var(--ui-text);font:inherit;font-weight:700;cursor:pointer}
.mj-op.on{background:var(--ui-accent);color:var(--ui-on);border-color:transparent}
.mj-sw{width:44px;height:44px;border-radius:999px;border:2px solid var(--ui-line);cursor:pointer;padding:0;flex:none}
.mj-sw.on{box-shadow:0 0 0 3px var(--ui-sheet),0 0 0 5px var(--ui-accent)}
.mj-ft{display:flex;padding-top:10px;flex:none}.mj-ft .ui-btn{flex:1}
@media (min-width:768px){.ui-sheet.mj{height:min(700px,calc(100% - 32px));max-height:none}}
@media (orientation:landscape) and (min-width:600px){
 .ui-sheet.mj{height:92%}
 .mj-bd{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);gap:10px 14px}
 .mj-vista{grid-row:1/3;height:auto}
}
@media (orientation:landscape) and (min-width:768px){.ui-sheet.mj{width:min(860px,calc(100% - 32px));height:min(560px,calc(100% - 32px))}}`;document.head.appendChild(s)}

const cod=()=>AV.codificar(o);
const ops=(k,n)=>`<div class="mj-ops">${Array.from({length:n},(_,i)=>`<button type="button" class="mj-op ${o[k]===i+1?'on':''}" aria-pressed="${o[k]===i+1}" onclick="MIPJ.pon('${k}',${i+1})">${i+1}</button>`).join('')}</div>`;
const sw=(i,t)=>`<div class="mj-ops">${AV.PAL[PAL[i]].map((c,j)=>`<button type="button" class="mj-sw ${o.col[i]===j?'on':''}" style="background:${c}" aria-label="${t} ${j+1}" aria-pressed="${o.col[i]===j}" onclick="MIPJ.col(${i},${j})"></button>`).join('')}</div>`;
const grp=(t,h)=>`<div class="mj-g"><span class="ui-lbl">${t}</span>${h}</div>`;
function cuerpo(){
 if(tab==='pelo')return grp('Estilo',ops('p',7))+grp('Color',sw(0,'Color de pelo'));
 if(tab==='cara')return grp('Piel',sw(1,'Piel'))+grp('Cejas',ops('c',3))+grp('Boca',ops('b',3))+grp('Nariz',ops('n',3));
 return grp('Arriba',ops('a',3)+sw(2,'Color de arriba'))+grp('Abajo',ops('d',3)+sw(3,'Color de abajo'))}
const rb=(ic,on,fn,t)=>`<button type="button" class="mj-rb ${on?'on':''}" aria-pressed="${!!on}" aria-label="${t}" title="${t}" onclick="MIPJ.${fn}">${I(ic)}</button>`;
function pinta(){if(!el)return;
 el.querySelector('.mj-fl.iz').innerHTML=rb('hombre',o.s===1,"cuerpo(1)",'Hombre')+rb('mujer',o.s===2,"cuerpo(2)",'Mujer');
 el.querySelector('.mj-fl.de').innerHTML=rb('girar',giro,'gira()',giro?'Dejar de girar':'Girar');
 el.querySelector('.mj-t').innerHTML=`<div class="ui-seg full" role="tablist">${TABS.map(([v,ic,t])=>`<button type="button" role="tab" class="${v===tab?'on':''}" aria-selected="${v===tab}" aria-label="${t}" title="${t}" onclick="MIPJ.tab('${v}')">${I(ic)}</button>`).join('')}</div>`;
 el.querySelector('.mj-c').innerHTML=cuerpo()}
function cambia(){pinta();if(r3&&r3.p)AV.cambiar(r3.p,cod())}

// ---------- vista previa ----------
// caja de lo visible ya con huesos y pose (setFromObject mide la pose de enlace y piezas ocultas)
function medir(p){const T=THREE,b=new T.Box3(),v=new T.Vector3();p.updateMatrixWorld(true);
 p.traverse(m=>{if(!m.isMesh||!m.visible)return;let q=m;while(q){if(!q.visible)return;q=q.parent}const g=m.geometry.attributes.position;
  for(let i=0;i<g.count;i+=5){m.getVertexPosition(i,v);b.expandByPoint(v.applyMatrix4(m.matrixWorld))}});return b}
function vista(cv){const T=THREE,ren=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true});ren.setPixelRatio(Math.min(2,devicePixelRatio||1));
 if('outputColorSpace' in ren)ren.outputColorSpace=T.SRGBColorSpace;
 const esc=new T.Scene(),cam=new T.PerspectiveCamera(30,1,.05,50);
 esc.add(new T.HemisphereLight(0xfff4e6,0x6b4a35,1.6));const d=new T.DirectionalLight(0xffffff,1.8);d.position.set(2,3,4);esc.add(d);
 r3={ren,esc,cam,p:null,cv};
 AV.crear(cod()).then(p=>{if(!r3||r3.ren!==ren)return AV.quita(p);r3.p=p;esc.add(p);AV.pose(p,'Reposo',0);
  const b=medir(p),c=b.getCenter(new T.Vector3()),h=b.max.y-b.min.y;
  r3.c=c;r3.dist=h/2/Math.tan(cam.fov*Math.PI/360)*1.25;const cg=el&&el.querySelector('.mj-carga');if(cg)cg.remove()})
  .catch(e=>{console.warn('[MIPJ]',e);const cg=el&&el.querySelector('.mj-carga');if(cg)cg.textContent='No se pudo cargar el personaje.'});
 const cuadro=()=>{if(!r3)return;raf=requestAnimationFrame(cuadro);const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
  if(cv.width!==Math.round(w*ren.getPixelRatio())){ren.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
  if(r3.p){if(giro)ang+=.008;r3.p.rotation.y=ang;const c=r3.c;cam.position.set(c.x,c.y+r3.dist*.08,c.z+r3.dist);cam.lookAt(c)}
  ren.render(esc,cam)};cuadro();
 // arrastrar para girar
 cv.addEventListener('pointerdown',e=>{arr={x:e.clientX,a:ang};if(giro){giro=false;pinta()}cv.setPointerCapture(e.pointerId)});
 cv.addEventListener('pointermove',e=>{if(arr)ang=arr.a+(e.clientX-arr.x)*.012});
 const suelta=()=>{arr=null};cv.addEventListener('pointerup',suelta);cv.addEventListener('pointercancel',suelta)}
function apaga(){cancelAnimationFrame(raf);if(!r3)return;if(r3.p)AV.quita(r3.p);r3.ren.dispose();r3.ren.forceContextLoss&&r3.ren.forceContextLoss();r3=null}

function teclas(e){if(e.key==='Escape'){e.stopPropagation();MIPJ.cerrar()}}
window.MIPJ={
 abrir(){if(el||!window.AV)return;css();o=AV.leer(AV.mio());prev=cod();tab='pelo';giro=false;
  el=document.createElement('div');el.className='ui mj-raiz';
  el.innerHTML=`<div class="ui-scrim" onclick="MIPJ.cerrar()"></div><div class="ui ui-sheet mid mj" role="dialog" aria-label="Mi personaje">
<div class="ui-hd"><h2 class="ui-h">Mi personaje</h2><button class="ui-x" onclick="MIPJ.cerrar()" aria-label="Cerrar">${I('x')}</button></div>
<div class="mj-bd"><div class="mj-vista"><canvas aria-label="Vista previa del personaje (arrastra para girar)"></canvas><div class="mj-carga">Cargando…</div>
<div class="mj-fl iz"></div><div class="mj-fl de"></div><div class="mj-fl ab"><button type="button" class="mj-rb" aria-label="Al azar" title="Al azar" onclick="MIPJ.azar()">${I('dado')}</button></div></div>
<div class="mj-t"></div><div class="mj-c"></div></div>
<div class="mj-ft"><button class="ui-btn" onclick="MIPJ.cerrar()">Listo</button></div></div>`;
  document.body.appendChild(el);pinta();addEventListener('keydown',teclas,true);vista(el.querySelector('canvas'))},
 cerrar(){if(!el)return;const c=AV.mio(cod());try{localStorage.setItem('cont_av_hecho','1')}catch(e){}
  if(c!==prev&&typeof S!=='undefined'&&S&&S.c&&typeof api==='function')api('act',{c:S.c,t:S.t,m:{t:'av',av:c}}).catch(()=>{});
  removeEventListener('keydown',teclas,true);apaga();el.remove();el=null;if(MIPJ.onCambio&&c!==prev)MIPJ.onCambio(c)},
 abierto:()=>!!el,
 tab(t){tab=t;pinta();const c=el&&el.querySelector(".mj-c");if(c)c.scrollTop=0},
 cuerpo(s){o.s=+s;cambia()},
 gira(){giro=!giro;pinta()},
 pon(k,v){o[k]=v;cambia()},
 col(i,j){o.col[i]=j;cambia()},
 azar(){o=AV.leer(AV.azar(o.s));cambia()}
};
})();
