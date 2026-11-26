// c_plano2d.js — PLANO2D: el inicio 2D como la planta de la casona vista desde arriba (SOCIAL.md S5). Pestañas por nivel (Azotea, Planta alta,
// Planta baja, Sótano); cada nivel se dibuja como un plano de arquitecto con los datos de plano_casona.js (blender/plano.py): pisos de madera,
// loseta y jardín, muros con sus puertas y ventanas, escalera, árboles y muebles, la calle al frente; nombre de cada cuarto.
// Las mesas son mesas de verdad (fieltro del color del juego y sus sillas) con el ícono y el nombre del juego: con partida, los retratos de
// quien juega en las sillas; con sala esperando, un aro que late. Tocar una mesa abre el mismo panel que CMESA en 3D (Mirar, Unirme, Crear sala).
// La gente de la casa (3D y 2D) sale como retratos en su lugar, con su globito si dijo algo. Al tocar una mesa quedas parado junto a ella:
// GENTE.latido manda esa posición (PLANO2D.pos) y los de 3D te ven ahí.
// c_lobby_home.js lo pone en LOBBY.home si PLANO2D.ok(). Se carga después de c_gente.js y c_casa_mesa.js. Estilos: ui_lobby.css (sección pl-).
(function(){
const NIV=[['c2','Azotea'],['c1','Planta alta'],['c0','Planta baja'],['cm1','Sótano']];
const MK={poker:'pk',blackjack:'bj'};   // mesa del GLB -> clave del inicio (CAS de c_lobby.js)
// nombre de cada cuarto en el plano (los que no están, sin letrero: corredores, escalera, vacíos)
const LBL={calle:'Calle',salon:'Sala',zaguan:'Zaguán',comedor:'Comedor',patio:'Patio',traspatio:'Jardín',bano:'Baño',libre:'Estancia',cocina:'Cocina',
 despensa:'Despensa',servicio:'Servicio',cantina:'Cantina',casino:'Casino',billar:'Billar',cava:'Cava',oscuro:'Ruleta',biblioteca:'Biblioteca',
 antesala:'Antesala',tableros:'Tableros',tucuarto:'Tu cuarto',musica:'Música',pergola:'Pérgola',azotea:'Azotea',mirador:'Mirador',tendedero:'Tendedero'};
const NOMB={domino:'Dominó',loteria:'Lotería',cubilete:'Cubilete',backgammon:'Backgammon',conecta4:'Conecta 4',ruleta:'Ruleta'};   // mesas sin sala en 2D
const es=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let piso='',sel='',D=null,ult='',ROT=false;
const vis=()=>!!document.querySelector('.pl-box');   // el plano está en pantalla
const U=()=>window.LOBBY&&LOBBY.u;
const P=()=>window.PLANO_C;
function busca(g){const C=P();if(!C)return null;for(const f in C){const m=C[f].mesas.find(m=>m.g===g||MK[m.g]===g);if(m)return Object.assign({f},m)}return null}
// qué hace cada mesa: 'sala' (juego con salas: panel de CMESA), 'cas' (Póker/Blackjack 2D), 'bil' (Billar 2D) o '' (adorno)
function tipo(g){const u=U();if(!u)return '';const k=MK[g]||g;
 if(k==='billar')return u.b2d()?'bil':'';if(u.CAS[k])return u.c2d()?'cas':'';return u.lista().includes(k)?'sala':''}
const salas=()=>(D&&D.r)||[];
function ctx(g){const R=salas().filter(r=>r.g===g),G=GM[g]||{};
 return {g,G,name:U().nom(g),desc:'',pl:R.filter(r=>r.st=='play').reduce((a,r)=>a+r.n,0),op:R.filter(r=>r.st=='lobby'),pr:R.filter(r=>r.st=='play'&&r.w),
  code:typeof code=='string'?code:'',msg:typeof msg=='string'?msg:'',play:'PLANO2D.crea()',
  extra:G.rules?`<button class="ui-btn ghost full" onclick="CMESA.cerrar();LOBBY.pan('reg')">Cómo se juega</button>`:''}}
// ---------- dibujo: SVG en metros (viewBox = lo que abarca el nivel) y encima, en %, lo que se toca o tiene letra ----------
const f2=v=>Math.round(v*100)/100;
const sillas=(m,n)=>Array.from({length:n},(_,i)=>{const a=Math.PI/2+i*2*Math.PI/n,d=m.r+.55;return {x:m.x+Math.cos(a)*d,z:m.z+Math.sin(a)*d,a}});
const nSil=g=>{const G=GM[MK[g]||g];return Math.max(2,Math.min(6,G&&G.max||(g==='billar'?2:4)))};
function suelo(a){if(a.c==='calle')return 'calle';if(a.c==='cuarto')return 'madera';if(a.c==='void')return 'vacio';if(a.c==='earth')return 'tierra';
 return /patio|traspatio/.test(a.n)?'jardin':'loseta'}
function svg(L,rot){const [x0,z0,w,d]=L.caja,o=[];
 o.push(`<defs><pattern id="plRay" width=".7" height=".7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width=".7" height=".7" class="pl-vacio"/><line x1="0" y1="0" x2="0" y2=".7" class="pl-ray"/></pattern></defs>`);
 o.push(`<rect class="pl-lote" x="${x0}" y="${z0}" width="${w}" height="${d}"/>`);
 L.balc.forEach(b=>o.push(`<rect class="pl-loseta pl-orilla" x="${b.x}" y="${b.z}" width="${b.w}" height="${b.d}"/>`));
 L.areas.forEach(a=>{const s=suelo(a);o.push(`<rect class="pl-${s}" x="${a.x}" y="${a.z}" width="${a.w}" height="${a.d}"${s==='vacio'?' fill="url(#plRay)"':''}/>`)});
 if(L.barda){const b=L.barda;o.push(`<rect class="pl-barda" x="${b.x}" y="${b.z}" width="${b.w}" height="${b.d}"/>`)}
 // calle: banqueta y raya al centro
 L.areas.filter(a=>a.c==='calle').forEach(a=>o.push(`<line class="pl-raya" x1="${a.x}" y1="${f2(a.z+a.d*.62)}" x2="${a.x+a.w}" y2="${f2(a.z+a.d*.62)}"/><rect class="pl-banq" x="${a.x}" y="${a.z}" width="${a.w}" height=".7"/>`));
 L.esc.forEach(e=>e.l.forEach(s=>o.push(`<line class="pl-esc" x1="${s[0]}" y1="${s[1]}" x2="${s[2]}" y2="${s[3]}"/>`)));
 L.deco.forEach(q=>{
  if(q.k==='arbol')o.push(`<circle class="pl-copa" cx="${q.x}" cy="${q.z}" r="${q.r}"/><circle class="pl-copa2" cx="${f2(q.x-q.r*.25)}" cy="${f2(q.z-q.r*.25)}" r="${f2(q.r*.55)}"/>`);
  else if(q.k==='cil')o.push(`<circle class="pl-mueble" cx="${q.x}" cy="${q.z}" r="${q.r}"/>`);
  else if(q.k==='pergola'){o.push(`<rect class="pl-perg" x="${q.x+.3}" y="${q.z+.3}" width="${q.w-.6}" height="${q.d-.6}"/>`);for(let i=0;i<11;i++){const xa=f2(q.x+.5+i*1.5);o.push(`<line class="pl-viga" x1="${xa}" y1="${q.z+.4}" x2="${xa}" y2="${f2(q.z+q.d-.4)}"/>`)}}
  else o.push(`<rect class="pl-mueble" x="${q.x}" y="${q.z}" width="${q.w}" height="${q.d}" rx=".15"/>`)});
 // muros: cuartos y perímetro; las puertas se abren pintando encima el piso, las ventanas en azul claro
 L.areas.filter(a=>a.c==='cuarto').forEach(a=>o.push(`<rect class="pl-muro" x="${a.x}" y="${a.z}" width="${a.w}" height="${a.d}"/>`));
 {const [px,pz,pw,pd]=L.per;o.push(`<rect class="pl-muro ext" x="${px}" y="${pz}" width="${pw}" height="${pd}"/>`)}
 L.puertas.forEach(s=>o.push(`<line class="pl-puerta" x1="${s[0]}" y1="${s[1]}" x2="${s[2]}" y2="${s[3]}"/>`));
 L.ventanas.forEach(s=>o.push(`<line class="pl-vent" x1="${s[0]}" y1="${s[1]}" x2="${s[2]}" y2="${s[3]}"/>`));
 // mesas: sillas y tablero (el fieltro de color lo pone el botón encima)
 L.mesas.forEach(m=>{const t=tipo(m.g);sillas(m,nSil(m.g)).forEach(s=>o.push(`<rect class="pl-silla" x="${f2(s.x-.32)}" y="${f2(s.z-.32)}" width=".64" height=".64" rx=".18" transform="rotate(${Math.round(s.a*180/Math.PI)} ${f2(s.x)} ${f2(s.z)})"/>`));
  o.push(`<circle class="pl-tabla${t?'':' nada'}" cx="${m.x}" cy="${m.z}" r="${m.r+.25}"/>`)});
 // girado (pantalla acostada): x de pantalla = z, y de pantalla = -x; la calle queda a la derecha
 return rot?`<svg class="pl-svg" viewBox="${z0} ${-(x0+w)} ${d} ${w}" preserveAspectRatio="none" aria-hidden="true"><g transform="matrix(0,-1,1,0,0,0)">${o.join('')}</g></svg>`
  :`<svg class="pl-svg" viewBox="${x0} ${z0} ${w} ${d}" preserveAspectRatio="none" aria-hidden="true">${o.join('')}</svg>`}
const av=n=>window.CHUD&&CHUD.av?CHUD.av(n):`<i class="uh-av">${es((Array.from(String(n||'?'))[0]||'?').toUpperCase())}</i>`;
const nomM=k=>{const u=U();return GM[k]||u.CAS[k]?u.nom(k):NOMB[k]||u.nom(k)};
// letrero en la esquina de arriba a la izquierda de cada cuarto (la que quede arriba según el giro), solo si cabe a lo ancho (~8 px por metro)
function letreros(L,at){return L.areas.filter(a=>{const n=LBL[a.n];if(!n)return false;const ancho=ROT?a.d:a.w,alto=ROT?a.w:a.d;return ancho*8>=n.length*7+8&&alto>=2.5}).map(a=>{const c=a.c==='calle';
 const p=ROT?at(a.x+a.w-(c?a.w*.5:.5),a.z+(c?a.d*.5:.6)):at(a.x+.6,a.z+(c?a.d*.5:.5));return `<span class="pl-l${c?' calle':''}${c&&ROT?' v':''}" style="${p}">${LBL[a.n]}</span>`}).join('')}
// nombre de la mesa: abajo en pantalla (z+ derecho; -x girado)
const bajo=(m,off,at)=>ROT?at(m.x-off,m.z):at(m.x,m.z+off);
function mesa(m,L,at){const t=tipo(m.g),k=MK[m.g]||m.g,u=U(),R=salas().filter(r=>r.g===k),pr=R.filter(r=>r.st!=='lobby'),op=R.some(r=>r.st==='lobby');
 const nm=es(nomM(k));if(!t)return `<span class="pl-n nada" style="${bajo(m,m.r+1.1,at)}">${nm}</span>`;
 const ps=[].concat(...pr.map(r=>r.ps||[])),S=sillas(m,nSil(m.g));
 // los que juegan, en las sillas; brincan de vez en cuando (cada uno a su tiempo) para que se note que la partida va
 const al=ps.slice(0,S.length).map((n,i)=>`<span class="pl-j vivo" style="${at(S[i].x,S[i].z)};--dl:${(i*.9+(k.length%3)*.4).toFixed(1)}s">${av(n)}</span>`).join('');
 const est=ps.length?` · ${ps.length} jugando`:op?' · sala esperando':'';
 return `<button class="pl-m${pr.length?' juega':''}${op?' esp':''}${sel===m.g?' yo':''}" style="${at(m.x,m.z)};--f:${u.COL[k]||'var(--ui-accent)'}" onclick="PLANO2D.ir('${m.g}')" aria-label="${nm}${est}"><span class="pl-ic">${u.ico(k)}</span></button>${al}<span class="pl-n" style="${bajo(m,m.r+(ps.length?2.1:1.1),at)}">${nm}</span>`}
// gente en este nivel: los de 3D en su x,z; los de 2D junto a la mesa que eligieron. Tú: en una silla libre de tu mesa, caminando desde la entrada al llegar.
const CAMINA=900;let llegaT=0,zoomT=0,zoomAnt='none';
function entrada(L){const a=L.areas.find(a=>a.n==='zaguan')||L.areas.find(a=>a.n==='escalera');if(!a)return null;return a.n==='zaguan'?{x:a.x+a.w/2,z:a.z+a.d}:{x:a.x+a.w/2,z:a.z+a.d/2}}
const cam0=s=>s.replace('left:','--x0:').replace(';top:',';--y0:');
function gente(L,f,at){const Ps=(D&&D.p||[]).filter(p=>p.f===f&&isFinite(p.x)&&isFinite(p.z));let h='';
 const m=sel&&busca(sel);if(m&&m.f===f){const k=MK[m.g]||m.g,ocup=salas().filter(r=>r.g===k&&r.st!=='lobby').reduce((a,r)=>a+(r.ps||[]).length,0),S=sillas(m,nSil(m.g));
  const s=S[Math.min(ocup,S.length-1)]||{x:m.x,z:m.z+m.r+1.3},t=Date.now()-llegaT,e=entrada(L),n=typeof pname=='string'&&pname.trim()||'Tú',cam=e&&t<CAMINA;
  h=`<span class="pl-p yo${cam?' camina':''}" style="${at(s.x,s.z)}${cam?';'+cam0(at(e.x,e.z))+';--dl:-'+t+'ms':''}" title="${es(n)}">${av(n)}</span>`}
 return Ps.map(p=>`<span class="pl-p" style="${at(p.x,p.z)}" title="${es(p.name)}">${av(p.name)}${p.say?`<b class="pl-say">${es(String(p.say).slice(0,40))}</b>`:''}</span>`).join('')+h}
function tabs(){const C=P(),R=salas();
 return `<nav class="pl-tabs" role="tablist" aria-label="Nivel">${NIV.map(([f,n])=>{const L=C[f];const hay=L&&L.mesas.some(m=>R.some(r=>r.g===(MK[m.g]||m.g)))||(D&&D.p||[]).some(p=>p.f===f);
  return `<button class="pl-t${f===piso?' on':''}" role="tab" aria-selected="${f===piso}" onclick="PLANO2D.piso('${f}')">${n}${hay?'<i class="pl-dot" aria-label="hay gente"></i>':''}</button>`}).join('')}</nav>`}
// ---------- tarjetas de juegos: todas las mesas que se juegan en 2D, con lo que pasa ahí o, si nada, en qué piso están ----------
const PNOM={cm1:'Sótano',c0:'Planta baja',c1:'Planta alta',c2:'Azotea'};
function juegos(){const C=P(),u=U(),ord=u.lista().concat(['pk','bj','billar']),L=[];
 for(const f in C)C[f].mesas.forEach(m=>{if(tipo(m.g))L.push(Object.assign({f},m))});
 L.sort((a,b)=>ord.indexOf(MK[a.g]||a.g)-ord.indexOf(MK[b.g]||b.g));
 return L.map(m=>{const k=MK[m.g]||m.g,R=salas().filter(r=>r.g===k),op=R.find(r=>r.st==='lobby'),pl=R.filter(r=>r.st==='play').reduce((a,r)=>a+r.n,0);
  const st=op?`<small class="vivo">${es(op.host)} espera</small>`:pl?`<small class="vivo">${pl} jugando</small>`:`<small>${PNOM[m.f]}</small>`;
  return `<button class="pl-c${sel===m.g?' on':''}" style="--f:${u.COL[k]||'var(--ui-accent)'}" onclick="PLANO2D.ir('${m.g}')" aria-pressed="${sel===m.g}"><span class="pl-ci">${u.ico(k)}${op||pl?'<i class="pl-cv"></i>':''}</span><span class="pl-ct"><b>${es(nomM(k))}</b>${st}</span></button>`}).join('')}
// ---------- el botón grande: lo que tiene sentido hacer en la mesa elegida ----------
const I=n=>window.UI?UI.ico(n):'';
function accion(){if(!sel)return '';const t=tipo(sel),k=MK[sel]||sel,R=salas().filter(r=>r.g===k),op=R.find(r=>r.st==='lobby'),pr=R.find(r=>r.st==='play'&&r.w),G=GM[k]||{};
 let b;if(t==='bil'||t==='cas')b=`<button class="ui-btn pl-go" onclick="PLANO2D.mesa()">${I('jugar')}Ir a la mesa</button>`;
 else if(op)b=`<button class="ui-btn pl-go" onclick="PLANO2D.une('${es(op.c)}')">${I('jugar')}Unirme con ${es(op.host)}</button>`;
 else if(pr)b=`<button class="ui-btn pl-go" onclick="PLANO2D.mira('${es(pr.w)}')">${I('ojo')}Mirar</button><button class="ui-btn sec pl-go2" onclick="PLANO2D.crea()">Otra mesa</button>`;
 else b=`<button class="ui-btn pl-go" onclick="PLANO2D.crea()">${I('jugar')}Jugar ${es(nomM(k))}</button>`;
 const ex=t==='sala'?`${G.rules?`<button class="ui-rb" onclick="PLANO2D.reglas()" aria-label="Cómo se juega" title="Cómo se juega">${I('ayuda')}</button>`:''}<button class="ui-rb" onclick="PLANO2D.mas()" aria-label="Salas y código" title="Salas y código">${I('llave')}</button>`:'';
 return `<div class="pl-acc">${b}${ex}</div>`}
// ---------- acercamiento al cuarto de la mesa elegida (todo el plano escala junto; se anima al cambiar) ----------
let ZOOM=false;
function zoomT0(L){const m=ZOOM&&sel&&busca(sel);if(!m||!L||m.f!==piso)return 'none';const [x0,z0,w,d]=L.caja,bw=ROT?d:w,bh=ROT?w:d;
 const k=Math.min(2.4,Math.max(1.5,Math.min(bw,bh)/20)),fx=ROT?(m.z-z0)/d:(m.x-x0)/w,fy=ROT?(x0+w-m.x)/w:(m.z-z0)/d,cl=(v,a,b)=>Math.min(b,Math.max(a,v));
 const tx=cl(.5-fx*k,1-k,0),ty=cl(.5-fy*k,1-k,0);return `translate(${(tx*100).toFixed(2)}%,${(ty*100).toFixed(2)}%) scale(${k.toFixed(3)})`}
function html(){const C=P();if(!C)return '';
 if(ult&&!(typeof S!='undefined'&&S)){const m=busca(ult);if(m){piso=m.f;sel=m.g;ZOOM=true}ult=''}   // saliste de una partida: vuelves junto a esa mesa
 if(!C[piso])piso='c0';
 const L=C[piso],[x0,z0,w,d]=L.caja,rot=ROT=innerWidth>innerHeight*1.2&&d>w*1.05;   // nivel alto y angosto en pantalla acostada: se gira
 const bw=rot?d:w,bh=rot?w:d,r=(bw/bh).toFixed(4),at=rot?(x,z)=>`left:${((z-z0)/d*100).toFixed(2)}%;top:${((x0+w-x)/w*100).toFixed(2)}%`
  :(x,z)=>`left:${((x-x0)/w*100).toFixed(2)}%;top:${((z-z0)/d*100).toFixed(2)}%`;
 const tz=zoomT0(L),k=tz==='none'?1:+tz.match(/scale\(([\d.]+)/)[1],dz=Date.now()-zoomT,an=dz<600?`;--t0:${zoomAnt};--dl:-${dz}ms`:'';
 const mp=window.CMESA&&CMESA.abierta&&CMESA.abierta()&&sel&&tipo(sel)==='sala'?CMESA.panel2d(ctx(MK[sel]||sel)):'';
 return `<div class="pl${tz!=='none'?' cerca':''}">${tz==='none'?tabs():''}<div class="pl-area"><div class="pl-box" style="aspect-ratio:${bw}/${bh};width:min(100cqw,calc(100cqh*${r}))"><div class="pl-zoom${an?' anim':''}" style="transform:${tz};--k:${k}${an}">${svg(L,rot)}${letreros(L,at)}${L.mesas.map(m=>mesa(m,L,at)).join('')}${gente(L,piso,at)}</div>
  ${tz!=='none'?`<button class="ui-pill pl-toda" onclick="PLANO2D.lejos()">${I('casa')}Toda la casa</button>`:''}</div></div>
  <div class="pl-pie"><div class="pl-js ui-desl" role="group" aria-label="Juegos">${juegos()}</div>${accion()}</div></div>${mp}`}
// ---------- acciones ----------
function snd(){if(typeof sfx=='function')try{sfx('tick')}catch(e){}}
function cambiaZoom(z){const C=P();zoomAnt=zoomT0(C&&C[piso]);ZOOM=z;zoomT=Date.now()}
// elegir una mesa (tarjeta o en el plano): cambia de piso, se acerca y caminas a tu silla. Tocarla otra vez ya de cerca abre su panel
function ir(g){const m=busca(g);if(!m)return;snd();
 if(sel===g&&ZOOM&&piso===m.f){if(tipo(g)==='sala'){pgame=MK[g]||g;CMESA.abre2d(pgame);render()}else mesa2();return}
 if(piso!==m.f){piso=m.f;zoomAnt='none';ZOOM=true;zoomT=Date.now()}else cambiaZoom(true);
 if(sel!==g)llegaT=Date.now();sel=g;if(tipo(g)==='sala')pgame=MK[g]||g;
 if(window.GENTE&&GENTE.late)GENTE.late();   // los demás te ven junto a la mesa de una vez
 render();setTimeout(()=>{if(vis())render()},CAMINA+50)}   // al terminar de caminar se quita la animación
function lejos(){snd();cambiaZoom(false);render()}
function mesa2(){const t=tipo(sel),k=MK[sel]||sel;if(t==='bil')B2D.abre();else if(t==='cas')C2D.abre(k)}
function crea(){if(!sel)return;pgame=MK[sel]||sel;if(window.CMESA)CMESA.cerrar();mk('listo')}
function une(c){snd();code=c;joinR()}
function mira(w){snd();watchR(w)}
function reglas(){pgame=MK[sel]||sel;LOBBY.pan('reg')}
function mas(){if(!sel)return;pgame=MK[sel]||sel;CMESA.abre2d(pgame);render()}
// dónde estás para la casa: junto a la mesa que elegiste (de frente a ella), o '2d' si no has elegido ninguna
function pos(){const m=sel&&busca(sel);if(!m||!vis())return {f:'2d',x:0,z:0,yaw:0};const r=(m.r||1.5)+1.3;return {f:m.f,x:m.x,z:m.z+r,yaw:Math.PI}}
// la respuesta de /casa (la trae GENTE.latido): salas y gente; se vuelve a dibujar solo si cambió algo que se ve
let sig='';
function casa(d){if(!d)return;D=d;if(!ok()||!vis())return;const s=JSON.stringify([d.r,(d.p||[]).map(p=>[p.f,p.x,p.z,p.name,p.say])]);if(s===sig)return;sig=s;
 if(typeof render=='function'&&!(typeof S!='undefined'&&S)&&!document.querySelector('.uh-mesa input:focus'))render()}
function ok(){return !!(P()&&window.LOBBY&&LOBBY.u&&window.CMESA&&CMESA.panel2d)}
// al girar el teléfono se vuelve a dibujar (el plano puede girarse)
let gi=innerWidth>innerHeight;addEventListener('resize',()=>{const g=innerWidth>innerHeight;if(g!==gi){gi=g;if(vis()&&typeof render=='function')render()}});
setInterval(()=>{if(typeof S!='undefined'&&S&&typeof V!='undefined'&&V&&V.game)ult=V.game},1000);
window.PLANO2D={ok,html,toca:ir,ir,crea,une,mira,reglas,mas,lejos,mesa:mesa2,pos,casa,visible:vis,
 piso:f=>{piso=f;if(window.CMESA)CMESA.cerrar();snd();render()}};
})();
