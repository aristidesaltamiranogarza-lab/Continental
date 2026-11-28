// Mesa 2D compartida (M2D): mesa de fieltro a pantalla completa con los rivales alrededor, el centro del juego, tu mano en abanico,
// botones que solo aparecen cuando sirven, globitos en los asientos y un menú. La usan las vistas 2D de los juegos de cartas (Uno: c_uno2d.js)
(function(){
const ico=n=>window.UI&&UI.ico?UI.ico(n):'';
// ---------- retratos: AV2D dibuja el busto una vez por personaje y se guarda como imagen ----------
// con reacción (feliz, sorpresa, enojo, triste: AV2D.CARAS) se guarda aparte como 'código|cara'; las que piden los juegos van primero, las demás se adelantan cuando el navegador está libre
const PT=new Map(),cola=[],luego=[],REAC={},CARAS=['feliz','sorpresa','enojo','triste'];let ocupado=false;
function cod(k){const p=(V.players||[])[k]||{},n=(V.G&&V.G.players[k]&&V.G.players[k].name)||p.name||'';return p.av||(window.MPJ&&MPJ.codigo?MPJ.codigo(n):'')}
function pide(c,v,ya){const q=v?c+'|'+v:c;if(!t0)t0=performance.now();if(!c||PT.has(q)||!window.AV2D||(v&&!AV2D.CARAS))return;PT.set(q,null);(ya||!v?cola:luego).push(q);sigue()}
// las caras de reacción esperan a que pase la entrada y el reparto (6 s desde el primer retrato) para no trabarlos
let t0=0;const libre=f=>setTimeout(()=>window.requestIdleCallback?requestIdleCallback(f,{timeout:3000}):f(),Math.max(400,t0+6000-performance.now()));
async function sigue(){if(ocupado)return;let q=cola.shift();if(!q){if(luego.length&&!sigue.e){sigue.e=1;libre(()=>{sigue.e=0;const x=luego.shift();if(x){cola.push(x);sigue()}})}return}
 ocupado=true;const [c,v]=q.split('|');
 try{const C=window.CIMG,vr=C?await C.ver(/c_av2d|c_avatar\.js|c_mesa2d/):'';let u=C?await C.saca('retrato',vr,q,'url'):null;   // ya dibujado en otra partida: CIMG
  if(!u){const cv=await AV2D.retrato(c,{tam:160,plano:v?'cara':'busto',giro:v?.2:.35,fondo:null,...(v?AV2D.CARAS[v]:{})});u=cv.toDataURL('image/png');if(C)C.pon('retrato',vr,q,cv,300)}PT.set(q,u);pon(c);if(!v)CARAS.forEach(x=>pide(c,x))}catch(e){PT.set(q,'')}
 ocupado=false;setTimeout(sigue,40)}
// la imagen que toca a un asiento: su reacción si está vigente y ya dibujada; f fuerza una cara (pantalla final)
function img(k,c,f){const r=REAC[k],v=f||(r&&r.hasta>Date.now()?r.t:'');return (v&&PT.get(c+'|'+v))||PT.get(c)||''}
function pon(c){document.querySelectorAll(`.m2d-pt[data-c="${c}"]`).forEach(e=>{const u=img(+e.dataset.k,c,e.dataset.f);if(u&&(!e.firstChild||e.firstChild.src!==u))e.innerHTML=`<img src="${u}" alt="">`})}
function retrato(k,cls,f){const c=cod(k),u=img(k,c,f);pide(c);if(f)pide(c,f,1);const n=((V.G&&V.G.players[k])||{}).name||'?';
 return `<span class="m2d-pt${cls?' '+cls:''}${!f&&REAC[k]&&REAC[k].hasta>Date.now()?' rq':''}" data-c="${c}" data-k="${k}"${f?` data-f="${f}"`:''} style="--c:${COL[k%10]}">${u?`<img src="${u}" alt="">`:`<b>${esc(n.charAt(0).toUpperCase())}</b>`}</span>`}
// reac(k,cara,ms): el retrato de k cambia de cara un rato y da un brinquito, tiembla o se encoge según la cara
function reac(k,t,ms){if(k==null||k<0||!CARAS.includes(t))return;ms=ms||2600;const r=REAC[k]={t,hasta:Date.now()+ms},c=cod(k);pide(c,t,1);pon(c);
 const sel=`#app .m2d .m2d-pt[data-k="${k}"]:not([data-f])`,cls=['rq',...CARAS.map(x=>'r-'+x)];
 document.querySelectorAll(sel).forEach(e=>{e.classList.remove(...cls);void e.offsetWidth;e.classList.add('r-'+t)});
 setTimeout(()=>{if(REAC[k]!==r)return;delete REAC[k];pon(c);document.querySelectorAll(sel).forEach(e=>e.classList.remove(...cls))},ms)}
// ---------- gestos (los mismos de la casa): salen del asiento y cambian la cara ----------
const EMV={'😭':'triste','🥺':'triste','🤣':'feliz','👻':'sorpresa','❤️':'feliz','🔥':'feliz','🤬':'enojo','🖕':'enojo'},EMS=Object.keys(EMV);
let emVisto={},emSala='',emAb=false,emPropio=0;
function emoji(k,em){const s=document.querySelector(`#app .m2d [data-seat="${k}"] .m2d-av`);if(!s)return;const r=s.getBoundingClientRect(),e=document.createElement('div');
 e.className='m2d-emo';e.textContent=em;e.style.left=r.left+r.width/2+'px';e.style.top=r.top+r.height*.3+'px';FX.appendChild(e);setTimeout(()=>e.remove(),2600)}
function emotes(){const P=V.players||[];if(emSala!==V.code){emSala=V.code;emVisto={}}
 P.forEach((p,k)=>{const n=p.emN||0;if(emVisto[k]===undefined){emVisto[k]=n;return}if(!n||n===emVisto[k])return;emVisto[k]=n;
  if(!p.em||(k===V.me&&Date.now()-emPropio<5000))return;setTimeout(()=>{emoji(k,p.em);reac(k,EMV[p.em],3000)},0)})}
function gesto(i){const em=EMS[i];if(!em||V.me<0)return;emAb=false;emPropio=Date.now();send({t:'emo',e:em});render();setTimeout(()=>{emoji(V.me,em);reac(V.me,EMV[em],3000)},0)}
// ---------- asientos: los rivales en arco por arriba de la mesa (con más de 5 jugadores, alrededor de toda la mesa); el siguiente en turno queda a tu izquierda ----------
function rivales(red,domo){const G=V.G,n=G.players.length,me=V.me,ks=[];
 if(me>=0)for(let j=1;j<n;j++)ks.push((me+j)%n);else for(let k=0;k<n;k++)ks.push(k);
 const m=ks.length,ac=red&&innerHeight<=460&&innerWidth>innerHeight*1.3,kx=ac?1.7:1,e=innerHeight>innerWidth*1.1?.32:ac?0:red&&innerWidth>innerHeight*1.3?.6:0;return ks.map((k,j)=>{const d=.3,a=n>5?ac?Math.PI+d-j/(m-1)*(Math.PI+2*d):1.5*Math.PI-(j+1)/(m+1)*2*Math.PI:Math.PI+e-(j+1)/(m+1)*(Math.PI+2*e);if(domo&&ac){const L=Math.ceil(m/2),R=m-L,iz=j<L,f=iz?L-1-j:j-L,rows=Math.max(L,R),y=6+(rows>1?f*13/(rows-1):0),t=1-y/50,w=50*Math.sqrt(Math.max(0,1-t*t));
   return [k,iz?50-w-7:50+w+7,y]}   // domo: mesa grande acostado (misma media que .m2d-domo en ui_mesa2d.css): sillas por fuera del borde de enfrente, el siguiente abajo a tu izquierda
  return red?[k,50+50*(n>5&&ac?2.4:kx)*Math.cos(a),50-50*Math.sin(a)]:[k,50+43*Math.cos(a),55-44*Math.sin(a)]})}   // red: mesa redonda (.m2d-ronda), sobre la madera; acostado bajan por los lados para no encimarse
// o: {x,y,turno,cuenta,fan,tag,alerta,extra}
function asiento(k,o){const p=(V.players||[])[k]||{};
 return `<div class="m2d-seat${o.turno?' on':''}${p.out?' out':''}" data-seat="${k}" style="--c:${COL[k%10]};left:${o.x}%;top:${o.y}%">
 <div class="m2d-av">${retrato(k)}${o.cuenta!=null?`<em class="m2d-n${o.alerta?' al':''}">${o.cuenta}</em>`:''}${p.on===false&&!p.out?'<i class="m2d-off" title="Sin conexión"></i>':''}</div>
 <div class="m2d-nm">${nm(k)}</div>${o.fan?`<div class="m2d-fan">${'<u></u>'.repeat(o.fan)}</div>`:''}${o.tag?`<span class="m2d-tag">${o.tag}</span>`:''}${o.extra||''}</div>`}
function yo(k,o){return `<div class="m2d-me${o.turno?' on':''}" data-seat="${k}" style="--c:${COL[k%10]}"><div class="m2d-av">${retrato(k)}</div><b>Tú</b></div>`}
// ---------- tu mano en abanico (el arrastre para reordenar sigue en game.js: #hand .c) ----------
function abanico(L){requestAnimationFrame(fila);const n=L.length,mid=(n-1)/2,st=n>1?Math.min(5,26/(n-1)):0,rm=mid*st;
 return `<div id="hand" class="m2d-mano" style="--n:${n};--n1:${Math.max(n-1,1)}">`+L.map((c,j)=>{const r=(j-mid)*st;
  return `<div class="m2d-ca ${c.cls||''}" style="--r:${r.toFixed(1)}deg;--y:${((r*r-rm*rm)*.16).toFixed(1)}px">${c.h}</div>`}).join('')+'</div>'}
// el solape se mide con el ancho real de la mano (no con 100vw: así se salían las de la derecha); siempre una sola fila
function fila(){const h=document.querySelector('#app .m2d #hand.m2d-mano');if(!h)return;const ks=h.querySelectorAll(':scope>.m2d-ca'),n=ks.length;if(n<2)return;
 const cw=ks[0].offsetWidth||60,w=h.clientWidth-(innerWidth>innerHeight?64:16);h.style.setProperty('--ov',Math.min(-6,(w-n*cw)/(n-1)).toFixed(1)+'px')}
addEventListener('resize',()=>requestAnimationFrame(fila));
// ---------- globitos que salen del asiento de quien hizo algo ----------
function bb(k,t,c){const s=document.querySelector(`#app .m2d [data-seat="${k}"]`);if(!s||RM)return;
 const r=s.getBoundingClientRect(),up=r.top+r.height/2>innerHeight*.55,e=document.createElement('div');
 e.className='m2d-bb'+(c?' '+c:'')+(up?' up':'');e.textContent=t;FX.appendChild(e);const w=e.offsetWidth;
 e.style.left=Math.max(8+w/2,Math.min(innerWidth-8-w/2,r.left+r.width/2))+'px';e.style.top=(up?r.top-8:r.bottom+4)+'px';setTimeout(()=>e.remove(),2400)}
// ---------- menú (una hoja con lo que no es la partida) ----------
let abierto=false;
function menuHtml(o){const G=V.G;return `<div class="ui-scrim ligero" onclick="M2D.menu(0)"></div><div class="ui-sheet der m2d-menu"><div class="ui-hd"><b class="ui-h">Partida</b><button class="ui-x" onclick="M2D.menu(0)" aria-label="Cerrar">${ico('x')}</button></div><div class="ui-bd">
 ${o.menu||''}${window.UI&&UI.temaSw?`<div class="ui-row"><span>Modo oscuro</span>${UI.temaSw()}</div>`:''}<div class="ui-row"><span>Sonidos</span><label class="ui-sw"><input type="checkbox" ${mute?'':'checked'} onchange="mute=!this.checked;render()"><i></i></label></div>
 ${typeof musUI=='function'?`<div class="ui-row m2d-mus">${musUI()}</div>`:''}
 ${G&&G.log&&G.log.length?`<details><summary>Historial</summary>${logv()}</details>`:''}<details><summary>Jugadores</summary>${plist()}</details>${o.rules||''}
 ${V.host?`<button class="ui-btn sec full" onclick="if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}">${ico('x')}Cerrar sala</button>`:''}</div></div>`}
// o: {cls,estilo,redonda,domo,top,der,seats,centro,capa,hint,mine,yo,acc,ord,mano,menu,rules}; redonda: mesa circular con los asientos en su borde (Uno, Continental, Monopoly Deal); domo: acostado en celular la mesa crece y su borde cercano queda detrás de tu mano, como en 3D (Continental, Monopoly Deal)
function mesa(o){emotes();const g=V.me>=0&&V.G&&V.G.phase!='final';if(!g)emAb=false;
 return `<div class="m2d ${o.cls||''}${o.redonda?' m2d-redonda':''}${o.domo?' m2d-domo':''}" style="${o.estilo||''}">
 <div class="m2d-top">${o.top||''}<span class="m2d-sp"></span>${g?`<button class="ui-rb m2d-gb${emAb?' on':''}" onclick="M2D.gestos()" aria-label="Gestos" aria-expanded="${emAb}">${ico('gesto')}</button>`:''}${g?`<button class="ui-rb m2d-cb" onclick="chatTog()" aria-label="Chat">${ico('chat')}<span class="m2d-cn">${(document.getElementById('cn')||{}).textContent||''}</span></button>`:''}${o.der||''}${window.GENTE?GENTE.boton():''}<button class="ui-rb" onclick="M2D.menu()" aria-label="Menú">${ico('menu')}</button>
 ${emAb?`<div class="m2d-gestos" role="menu">${EMS.map((e,i)=>`<button role="menuitem" onclick="M2D.gesto(${i})" aria-label="Gesto ${i+1}">${e}</button>`).join('')}</div>`:''}</div>
 <div class="m2d-zona">${o.redonda?'<div class="m2d-ronda">':''}<div class="m2d-felt">${o.centro||''}</div>${(o.seats||[]).join('')}${o.redonda?'</div>':''}${o.capa||''}</div>
 <div class="m2d-yo">${o.hint!=null?`<div class="m2d-bar">${o.yo||''}<div class="m2d-hint${o.mine?' mine':''}">${o.hint}</div>${o.acc||''}${o.ord||''}</div>`:''}${o.mano||''}</div>
 ${abierto?menuHtml(o):''}</div>`}
// el fieltro del color de la mesa 3D de ese juego (MESA_J: c_uno3d.js, c_continental3d.js, c_mdeal3d.js)
function fieltro(j){const m=window.MESA_J&&MESA_J[j],c=(m&&m.col())||['#5d656f','#1d2126'];return `--m2d-fieltro:${c[0]};--m2d-fieltro2:${c[1]}`}
const M2D=window.M2D={retrato,fieltro,reac,gesto,rivales,asiento,yo,abanico,fila,bb,mesa,suelta:null,teclas:null,
 gestos(){emAb=!emAb;if(typeof sfx=='function')sfx('tick');render()},
 menu(v){abierto=v==null?!abierto:!!v;render()}};
// ---------- soltar una carta de tu mano en el centro (.m2d-drop) para jugarla ----------
const enDrop=e=>{const t=document.elementFromPoint(e.clientX,e.clientY);return (t&&t.closest&&t.closest('.m2d .m2d-drop'))||null};   // puede haber varias zonas (descarte, bajadas)
addEventListener('pointermove',e=>{if(typeof dg=='undefined'||!dg||!dg.on||!M2D.suelta)return;const z=enDrop(e);document.querySelectorAll('.m2d .m2d-drop').forEach(x=>x.classList.toggle('over',x===z))},true);
addEventListener('pointerup',e=>{if(typeof dg=='undefined'||!dg||!dg.on||!M2D.suelta||!document.querySelector('#app .m2d'))return;
 const z=enDrop(e);if(!z)return;const id=dg.id,d0=dg;dg.g.remove();dg.el.style.opacity='';dg=null;noClick=0;M2D.suelta(id,z,e,d0);noClick=Date.now()},true);
// ---------- teclas (las define cada juego en M2D.teclas; Esc cierra el menú) ----------
addEventListener('keydown',e=>{if(!document.querySelector('#app .m2d'))return;const t=e.target;if(t&&(t.tagName=='INPUT'||t.tagName=='TEXTAREA'))return;
 if(e.key=='Escape'&&abierto){M2D.menu(0);return}if(e.key=='Escape'&&emAb){emAb=false;render();return}if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(M2D.teclas&&M2D.teclas(e.key.length==1?e.key.toLowerCase():e.key)){e.preventDefault();return}
 if(/^[1-8]$/.test(e.key)&&V.me>=0&&V.G&&V.G.phase!='final'){e.preventDefault();gesto(+e.key-1)}});   // 1–8: gestos, como en la casa
let rz=0;addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(()=>{if(document.querySelector("#app .m2d"))render()},150)});   // los asientos se acomodan al girar el celular
})();
