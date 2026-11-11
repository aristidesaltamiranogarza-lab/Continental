// c_avatar.js — AV: personaje chibi personalizable (modelos/personaje/chibi.glb, un solo GLB con todas las piezas).
// Usa el cargador de CGLB (GLTF + meshopt) y SkeletonUtils. Cada personaje es un clon con sus propios materiales de color.
//   AV.crear('s1p3c1b2n1a2d3-2051').then(p=>escena.add(p));   AV.pose(p,'PistolaSien');   AV.agarre(p,'D',1);   AV.quita(p);
// Código: s cuerpo (1 H, 2 M), p pelo 1–7, c cejas, b boca, n nariz, a arriba, d abajo (1–3); tras el guion, índices base 36
// en las paletas: pelo, piel, arriba, abajo. Lo que venga mal se cambia por el valor por defecto.
(function(){
const URL_GLB=new URL('modelos/personaje/chibi.glb',location.href).href;
const PAL={
 pelo:['#1f1a17','#3b2a20','#5a3b26','#86593a','#b8864f','#d9b06a','#9c4a2a','#8a8580'],
 piel:['#f6dcc6','#efc9a8','#e3b48c','#d19c72','#b97f56','#9a6442','#7a4c32','#5a3624'],
 ropa:['#c8643c','#d9a441','#7d8a4a','#8fae8b','#2f6f73','#2e3f5c','#7a2f3a','#efe3cf','#3a3634','#d9a3a0']
};
const LET='spcbnad',MAX={s:2,p:7,c:3,b:3,n:3,a:3,d:3};
const DEF={s:1,p:1,c:1,b:1,n:1,a:1,d:1,col:[1,1,0,5]};
const NCOL=[PAL.pelo.length,PAL.piel.length,PAL.ropa.length,PAL.ropa.length];
const RANURA=['av_pelo','av_piel','av_arriba','av_abajo'];
const DEDOS=/^(dedos\d|pulgar\d)_([ID])\./;

function leer(cod){const o={...DEF,col:DEF.col.slice()};const [a,b]=String(cod||'').split('-');
 for(const m of (a||'').matchAll(/([scpbnad])(\d)/g)){const v=+m[2];if(v>=1&&v<=MAX[m[1]])o[m[1]]=v}
 [...(b||'')].slice(0,4).forEach((ch,i)=>{const v=parseInt(ch,36);if(v>=0&&v<NCOL[i])o.col[i]=v});
 return o}
function codificar(o){o=leer(Object.keys(MAX).map(k=>k+(o&&o[k])).join('')+'-'+((o&&o.col)||[]).map(v=>(+v).toString(36)).join(''));
 return [...LET].map(k=>k+o[k]).join('')+'-'+o.col.map(v=>v.toString(36)).join('')}
function azar(s){const r=n=>1+(Math.random()*n|0),o={s:s||r(2),p:r(7),c:r(3),b:r(3),n:r(3),a:r(3),d:r(3),col:NCOL.map(n=>Math.random()*n|0)};return codificar(o)}

// ---------- carga única ----------
let baseP=null;
function listo(){return baseP||(baseP=Promise.all([CGLB.cargador(),CGLB.mod('utils/SkeletonUtils.js')]).then(([L,SU])=>new Promise((ok,mal)=>L.load(URL_GLB,g=>ok({g,SU}),null,mal))).then(({g,SU})=>{
 const clips={};
 for(const c of g.animations){let tr;
  if(/^Agarre_[ID]$/.test(c.name)){const l=c.name.slice(-1);tr=c.tracks.filter(t=>{const m=t.name.match(DEDOS);return m&&m[2]===l})}
  else tr=c.tracks.filter(t=>!DEDOS.test(t.name));   // las poses no mueven los dedos (eso es del agarre)
  clips[c.name]=new THREE.AnimationClip(c.name,c.duration,tr)}
 g.scene.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=true}});
 return {escena:g.scene,clips,SU}}).catch(e=>{baseP=null;console.warn('[AV] no cargó el personaje',e);throw e}))}

// ---------- piezas y colores ----------
function aplica(p,cod){const u=p.userData.av,o=leer(cod),M=o.s===2?'_M':'';u.o=o;u.cod=codificar(o);
 const ver={['Pelo_'+o.p]:1,['Cejas_'+o.c]:1,['Boca_'+o.b]:1,['Nariz_'+o.n]:1,['Arriba_'+o.a+M]:1,['Abajo_'+o.d+M]:1,
  ['Mangas_'+(o.a===2&&!M?2:1)]:1};
 if(o.d>=2)ver['Piernas'+M]=1;
 for(const [n,obj] of u.piezas)obj.visible=!!ver[n];
 RANURA.forEach((r,i)=>{const m=u.mat[r];if(m)m.color.set(i<2?PAL[i?'piel':'pelo'][o.col[i]]:PAL.ropa[o.col[i]])});
 return p}

function crearYa(cod){if(!base)return null;const {escena,clips,SU}=base;
 const p=SU.clone(escena);p.name='Personaje';
 const u=p.userData.av={piezas:new Map(),mat:{},acc:{},actual:null,hasta:0};
 p.traverse(o=>{if(/^(Pelo|Cejas|Boca|Nariz|Arriba|Abajo|Mangas|Piernas)/.test(o.name)&&o.parent&&o.parent.name==='Rig')u.piezas.set(o.name,o);
  if(o.isMesh){const cl=m=>{if(!RANURA.includes(m.name))return m;return u.mat[m.name]||(u.mat[m.name]=m.clone())};
   o.material=Array.isArray(o.material)?o.material.map(cl):cl(o.material)}});
 const pis=p.getObjectByName('Rig_Pistola');if(pis)pis.visible=false;u.pistola=pis;
 u.mixer=new THREE.AnimationMixer(p);
 for(const l of 'ID'){const a=u.mixer.clipAction(clips['Agarre_'+l]);a.play();a.paused=true;a.time=0;u.acc['Agarre_'+l]=a}
 aplica(p,cod);pose(p,'Reposo',0);return p}
let base=null;
function crear(cod){return listo().then(b=>{base=b;return crearYa(cod)})}

// ---------- animación ----------
const vivos=new Set();let raf=0,t0=0;
function despierta(p,ms){const u=p.userData.av;u.mixer.update(0);u.hasta=Math.max(u.hasta,performance.now()+ms);vivos.add(p);if(!raf){t0=performance.now();raf=requestAnimationFrame(paso)}}
function paso(t){const dt=Math.min(.1,(t-t0)/1000);t0=t;
 for(const p of vivos){const u=p.userData.av;u.mixer.update(dt);if(t>u.hasta)vivos.delete(p)}
 raf=vivos.size?requestAnimationFrame(paso):0}
// pose: 'Reposo', 'AgarreFrente', 'ManoCabeza', 'PistolaSien' (usa la variante del peinado si existe)
function pose(p,nom,fade=.25){const u=p.userData.av;if(!u||!base)return;const c=base.clips[nom+'_'+u.o.p]||base.clips[nom];if(!c)return console.warn('[AV] sin pose',nom);
 let a=u.acc[c.name];if(!a){a=u.acc[c.name]=u.mixer.clipAction(c);a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true}
 if(u.actual===a)return;a.reset().play();
 if(u.actual&&fade>0)u.actual.crossFadeTo(a,fade,false);else if(u.actual)u.actual.stop();
 u.actual=a;u.nomPose=nom;despierta(p,(c.duration+fade)*1000+50)}
// agarre de la mano lado 'I' o 'D', t de 0 (relajada) a 1 (cerrada)
function agarre(p,lado,t){const u=p.userData.av;if(!u)return;const a=u.acc['Agarre_'+(lado==='I'?'I':'D')];
 a.time=Math.max(0,Math.min(1,+t||0))*a.getClip().duration*.999;despierta(p,40)}
function sien(p,lado){const u=p.userData.av;if(!u)return null;const n='Sien_'+(lado==='I'?'I':'D');return p.getObjectByName(n+'_'+u.o.p)||p.getObjectByName(n)}
function pistola(p,si){const u=p.userData.av;if(u&&u.pistola)u.pistola.visible=!!si}
function cambiar(p,cod){const u=p.userData.av;if(!u)return p;const pelo=u.o.p;aplica(p,cod);
 if(u.o.p!==pelo&&u.nomPose){const n=u.nomPose;u.actual=null;for(const k in u.acc)if(!/^Agarre/.test(k))u.acc[k].stop();pose(p,n,0)}   // la pose depende del peinado
 return p}
function quita(p){const u=p&&p.userData.av;if(!u)return;vivos.delete(p);u.mixer.stopAllAction();u.mixer.uncacheRoot(p);
 for(const k in u.mat)u.mat[k].dispose();if(p.parent)p.parent.remove(p);p.userData.av=null}

window.AV={PAL,leer,codificar,azar,listo:()=>listo().then(b=>{base=b;return b}),crear,crearYa,cambiar,pose,agarre,sien,pistola,quita,
 get codigoDef(){return codificar(DEF)},
 // código propio guardado en localStorage (cont_av); si no hay, uno al azar que se queda
 mio(nuevo){let c=null;try{if(nuevo)localStorage.setItem('cont_av',codificar(leer(nuevo)));c=localStorage.getItem('cont_av')}catch(e){}
  if(!c){c=azar();try{localStorage.setItem('cont_av',c)}catch(e){}}return codificar(leer(c))}};
})();
