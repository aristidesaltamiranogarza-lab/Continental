// c_poker_hud.js — PKH: la interfaz del Póker del sótano (PK3, c_poker3d.js). Estilos en ui_juegos.css (.bj-… compartidas y .pk-…). Vista 2D: PK2D (c_poker2d.js).
// PKH.hud(v,s) sentado: pastillas (fichas, turno con cuenta regresiva, tu jugada con probabilidad y outs, Arriba, Recentrar, Levantarse) y la barra
// (Retirarse, Pasar/Igualar, Subir con deslizador y ½ bote / Bote / Todo; Mostrar al final). PKH.firma(v,s) cambia cuando hay que redibujar.
// PKH.paso(v,s,now) cada cuadro: nombre, fichas y última jugada sobre cada jugador, el resultado del ganador y la cantidad de cada bote.
(function(){
const I=n=>window.UI?UI.ico(n):'',es=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),$=id=>document.getElementById(id);
const mon=f=>'$'+Math.round(Math.abs(f||0)).toLocaleString('es-MX'),touchy=matchMedia('(pointer:coarse)').matches;
const CALLE=['Antes del flop','Flop','Turn','River'];
const L=new Map();let tP=0,sub=null,subK='',eqK='',eq=null;
const snd=n=>{if(typeof sfx=='function')sfx(n)};
const segs=v=>Math.max(0,Math.ceil(((v.left||0)-(performance.now()-(v.t0||0)))/1000));
const miTurno=(v,s)=>v.fase==='mano'&&v.turno===s;

// ---------- apuestas ----------
function cuentas(v,a){const bote=(v.botes||[]).reduce((t,b)=>t+b.v,0)+v.as.reduce((t,b)=>t+(b?b.ap:0),0),falta=Math.max(0,v.alta-a.ap),max=a.f+a.ap;
 const min=Math.min(max,v.alta?v.alta+v.minR:Math.max(v.minR,(v.ciegas||[5,10])[1])),pt=k=>Math.max(min,Math.min(max,Math.round(v.alta+(bote+falta)*k)));
 return {bote,falta,max,min,medio:pt(.5),entero:pt(1),puede:!a.lim&&max>v.alta}}
function valor(v,a,c){const k=v.mano+':'+v.calle+':'+v.alta+':'+v.minR;if(k!==subK||sub==null){subK=k;sub=c.min}return Math.max(c.min,Math.min(c.max,sub))}
function op(o,x){PK3.act(o,x);snd(o==='retirar'?'tick':'chip')}
function sube(n){const y=yo();if(!y)return;const c=cuentas(y.v,y.a);n=Math.max(c.min,Math.min(c.max,Math.round(n)));if(n>=c.max)return op('todo');op('subir',{v:n})}
function fija(n){const y=yo();if(!y)return;const c=cuentas(y.v,y.a);sub=Math.max(c.min,Math.min(c.max,Math.round(+n)));
 const r=$('pkRng'),b=$('pkSub');if(r&&+r.value!==sub)r.value=sub;if(b)b.textContent=(sub>=c.max?'Todo · ':(y.v.alta?'Subir a ':'Apostar '))+mon(sub)}
function yo(){const v=PK3.v,s=PK3.yo();return v&&s>=0&&v.as[s]?{v,a:v.as[s]}:null}

// ---------- tu jugada: nombre, probabilidad de ganar contra los que siguen y outs (se calcula solo cuando cambia algo) ----------
function jugada(v,a){if(!window.PEV||!a.jug||a.fold||!a.c||a.c.length<2||a.c[0]<0)return null;
 const riv=v.as.filter(b=>b&&b!==a&&b.jug&&!b.fold).length,k=a.c.join()+'|'+v.mesa.join()+'|'+riv;
 if(k!==eqK){eqK=k;const nom=PEV.nombre(PEV.puntos(a.c.concat(v.mesa)));
  eq={nom,p:riv?Math.round(PEV.equidad(a.c,v.mesa,riv,v.mesa.length>=5?250:400)*100):100,o:v.mesa.length>=3&&v.mesa.length<5?PEV.outs(a.c,v.mesa):0}}
 return eq}

// ---------- pastillas y barra ----------
function fase(v,s,a){if(v.fase==='espera')return {t:'Esperando'};
 if(!a.jug)return {t:'Siguiente mano'};
 if(v.fase==='fin')return {t:v.res&&v.res.some(r=>r.nom)?'Showdown':'Fin'};
 if(miTurno(v,s))return {t:'Tu turno',me:true,left:true};
 if(v.fase==='mano'&&v.turno>=0&&v.as[v.turno])return {t:'Turno de '+es(v.as[v.turno].n),left:true};
 return {t:CALLE[v.calle]||'Repartiendo'}}
const B=(t,on,cls,dis,id)=>`<button class="ui-btn${cls?' '+cls:''}"${id?` id="${id}"`:''} onclick="${on}"${dis?' disabled':''}>${t}</button>`;
const nota=t=>`<span class="gj-note">${t}</span>`;
function botones(v,s,a,sinT){
 if(v.fase==='fin'&&a.jug){const n=a.neta||0,mio=(v.res||[]).find(r=>r.g.includes(s));
  const t=n>0?`Ganaste <b>${mon(n)}</b>${mio&&mio.nom?' con '+es(mio.nom):''}`:n<0?`Perdiste ${mon(n)}`:'Quedaste igual';
  return nota(t)+(!a.mos&&a.c&&a.c.length?B('Mostrar',"PKH.op('mostrar')",'sec'):'')}
 if(!miTurno(v,s)||a.fold||a.allin)return '';
 const c=cuentas(v,a),x=sinT?c.min:valor(v,a,c),d=c.max-c.min;
 let h=B('Retirarse',"PKH.op('retirar')",'ghost')+(c.falta?B(c.falta>=a.f?`Todo · ${mon(a.f)}`:`Igualar ${mon(c.falta)}`,"PKH.op('igualar')",'sec'):B('Pasar',"PKH.op('pasar')",'sec'));
 if(!c.puede)return h;
 const rap=[['½ bote',c.medio],['Bote',c.entero],['Todo',c.max]].filter(([,n],i,A)=>i==2||n<c.max&&(i==0||n!==A[0][1]));
 return `<div class="pk-sube">${d>0?`<input id="pkRng" class="pk-rng" type="range" min="${c.min}" max="${c.max}" step="${v.minR>=10?5:1}" value="${x}" oninput="PKH.fija(this.value)" aria-label="Cuánto subir">`:''}
  <div class="pk-rap">${rap.map(([t,n])=>B(t,`PKH.fija(${n})`,'ghost')).join('')}</div></div>`
  +h+B((x>=c.max?'Todo · ':(v.alta?'Subir a ':'Apostar '))+mon(x),'PKH.sube(PKH.sub())','go',false,'pkSub')}
// vista previa de tus dos cartas (solo mientras las ves; en 2D ya van en tu fila)
const PALO=['♠','♥','♦','♣'],RANGO=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function previa(v,a){if(!PK3.veo()||!a.c||!a.c.length||a.c[0]<0||a.fold||window.PK2D&&PK2D.on())return '';
 return `<div class="ui pk-mias" onclick="PK3.verTus(false)" title="Tapar">${a.c.map(c=>{c%=52;const r=c%13,p=c/13|0;return `<i class="bj2c${p==1||p==2?' r':''}"><b>${RANGO[r]}</b><span>${PALO[p]}︎</span></i>`}).join('')}</div>`}
function hud(v,s,sinT){const a=v.as[s];if(!a)return '';const f=fase(v,s,a),b=botones(v,s,a,sinT),j=jugada(v,a);
 return `<div class="ui bj-top"><span class="ui-pill bj-f"><small>Fichas</small><b>${mon(a.f)}</b></span>
  <span class="ui-pill gj-turn${f.me?' me':''}"><span>${f.t}${f.left?` · <span id="pkLeft">${sinT?'':segs(v)}</span> s`:''}</span></span>
  ${`<button class="ui-rb c2k pk-ojo${PK3.tusVis()?' on':''}" onclick="PK3.verTus()" title="${PK3.tusVis()?'Tapar tus cartas':'Ver tus cartas'}" aria-label="Ver tus cartas" aria-pressed="${PK3.tusVis()}">${I('ojo')}</button>`}
  ${PK3.mirando()?`<button class="ui-rb" onclick="PK3.recentra()" title="Recentrar (doble toque)" aria-label="Recentrar">${I('cuadrar')}</button>`:''}
  ${window.PK2D?PK2D.boton():''}
  <button class="ui-rb c2k" onclick="PK3.levantarse()" title="Levantarse${touchy?'':' (Esc)'}" aria-label="Levantarse">${I('salir')}</button></div>
 ${window.PK2D?PK2D.html(v,s,sinT,j):''}
 ${previa(v,a)}
 ${j?`<div class="ui pk-jug"><span class="ui-pill"><b>${es(j.nom)}</b><small>${j.p} % de ganar${j.o?` · ${j.o} outs`:''}</small></span></div>`:''}
 ${b?`<div class="ui bj-bar" role="group" aria-label="Jugadas"><div class="bj-bb">${b}</div></div>`:''}`}

// ---------- nombres, última jugada, resultados y botes sobre la mesa ----------
const ACC={ciega:'Ciega',pasar:'Pasa',igualar:'Iguala',subir:'Sube a',apostar:'Apuesta',todo:'Todo',retirar:'Se retira'};
function etiqueta(k){let e=L.get(k);if(!e){e=document.createElement('div');L.set(k,e)}if(!e.isConnected)(document.getElementById('app')||document.body).appendChild(e);e.vivo=1;return e}
function pon(e,cls,h,p,cam,W,Hh){if(e.className!==cls)e.className=cls;if(e._h!==h){e._h=h;e.innerHTML=h}
 if(!p)return e.style.display='none';p.project(cam);const vis=p.z<1&&Math.abs(p.x)<1.05&&Math.abs(p.y)<1.05;e.style.display=vis?'':'none';
 if(vis)e.style.transform=`translate(${Math.round((p.x+1)/2*W)}px,${Math.round((1-p.y)/2*Hh)}px) translate(-50%,-100%)`}
function paso(v,s,now){tP=now;const H=window.CASA3D,cam=H&&H.cam(),cv=H&&H.R&&H.R()&&H.R().domElement;if(!v||!cam||!cv)return;
 const el=$('pkLeft');if(el){const t=String(segs(v));if(el.textContent!==t)el.textContent=t}
 L.forEach(e=>{e.vivo=0});
 if((s>=0||PK3.cerca())&&!(s>=0&&window.PK2D&&PK2D.on())){const W=cv.clientWidth,Hh=cv.clientHeight,fin=v.fase==='fin';
  v.as.forEach((a,i)=>{if(!a)return;const ac=a.acc&&!fin?`${ACC[a.acc.o]||''}${a.acc.v&&a.acc.o!=='todo'?' '+mon(a.acc.v):''}`:'';
   if(i!==s)pon(etiqueta('n'+i),'ui gj-seat bj-n'+(v.fase==='mano'&&v.turno===i?' on':''),`<b>${es(a.n)}</b><small>${mon(a.f)}${ac?' · '+ac:''}</small>`,PK3.arriba(i),cam,W,Hh);
   if(fin&&a.jug&&(a.neta>0||a.nom)){const r=(v.res||[]).find(r=>r.g.includes(i));
    pon(etiqueta('r'+i),'ui bj-tot'+(a.neta>0?' gana':''),`${a.neta>0?'+'+mon(a.neta):''}${a.neta>0&&(a.nom||r&&r.nom)?' ':''}${es(a.nom||(r&&r.nom)||'')}`,PK3.ptAsiento(i),cam,W,Hh)}});
  if(!fin)(v.botes||[]).forEach((b,k,A)=>pon(etiqueta('b'+k),'ui bj-tot',`${A.length>1?(k?'Bote '+(k+1):'Bote principal'):'Bote'} ${mon(b.v)}`,PK3.ptBote(k,A.length),cam,W,Hh))}
 L.forEach((e,k)=>{if(!e.vivo){e.remove();L.delete(k)}})}
setInterval(()=>{if(performance.now()-tP>400)L.forEach(e=>{if(e.style.display!=='none')e.style.display='none'})},300);

window.PKH={hud,paso,op,sube,fija,sub:()=>sub,firma:(v,s)=>v&&s>=0?hud(v,s,true):''};
})();
