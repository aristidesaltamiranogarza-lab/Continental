// Mesa 2D compartida (M2D): mesa de fieltro a pantalla completa con los rivales alrededor, el centro del juego, tu mano en abanico,
// botones que solo aparecen cuando sirven, globitos en los asientos y un menú. La usan las vistas 2D de los juegos de cartas (Uno: c_uno2d.js)
(function(){
const ico=n=>window.UI&&UI.ico?UI.ico(n):'';
// ---------- retratos: AV2D dibuja el busto una vez por personaje y se guarda como imagen ----------
const PT=new Map(),cola=[];let ocupado=false;
function cod(k){const p=(V.players||[])[k]||{},n=(V.G&&V.G.players[k]&&V.G.players[k].name)||p.name||'';return p.av||(window.MPJ&&MPJ.codigo?MPJ.codigo(n):'')}
function pide(c){if(!c||PT.has(c)||!window.AV2D)return;PT.set(c,null);cola.push(c);sigue()}
async function sigue(){if(ocupado||!cola.length)return;ocupado=true;const c=cola.shift();
 try{const cv=await AV2D.retrato(c,{tam:160,plano:'busto',giro:.35,fondo:null});const u=cv.toDataURL('image/png');PT.set(c,u);
  document.querySelectorAll(`.m2d-pt[data-c="${c}"]`).forEach(e=>{e.innerHTML=`<img src="${u}" alt="">`})}catch(e){PT.set(c,'')}
 ocupado=false;setTimeout(sigue,40)}
function retrato(k,cls){const c=cod(k),u=PT.get(c);pide(c);const n=((V.G&&V.G.players[k])||{}).name||'?';
 return `<span class="m2d-pt${cls?' '+cls:''}" data-c="${c}" style="--c:${COL[k%10]}">${u?`<img src="${u}" alt="">`:`<b>${esc(n.charAt(0).toUpperCase())}</b>`}</span>`}
// ---------- asientos: los rivales en arco por arriba de la mesa; el siguiente en turno queda a tu izquierda ----------
function rivales(){const G=V.G,n=G.players.length,me=V.me,ks=[];
 if(me>=0)for(let j=1;j<n;j++)ks.push((me+j)%n);else for(let k=0;k<n;k++)ks.push(k);
 const m=ks.length,e=innerHeight>innerWidth*1.1?.32:0;return ks.map((k,j)=>{const a=Math.PI+e-(j+1)/(m+1)*(Math.PI+2*e);return [k,50+43*Math.cos(a),55-44*Math.sin(a)]})}
// o: {x,y,turno,cuenta,fan,tag,alerta,extra}
function asiento(k,o){const p=(V.players||[])[k]||{};
 return `<div class="m2d-seat${o.turno?' on':''}${p.out?' out':''}" data-seat="${k}" style="--c:${COL[k%10]};left:${o.x}%;top:${o.y}%">
 <div class="m2d-av">${retrato(k)}${o.cuenta!=null?`<em class="m2d-n${o.alerta?' al':''}">${o.cuenta}</em>`:''}${p.on===false&&!p.out?'<i class="m2d-off" title="Sin conexión"></i>':''}</div>
 <div class="m2d-nm">${nm(k)}</div>${o.fan?`<div class="m2d-fan">${'<u></u>'.repeat(o.fan)}</div>`:''}${o.tag?`<span class="m2d-tag">${o.tag}</span>`:''}${o.extra||''}</div>`}
function yo(k,o){return `<div class="m2d-me${o.turno?' on':''}" data-seat="${k}" style="--c:${COL[k%10]}"><div class="m2d-av">${retrato(k)}</div><b>Tú</b></div>`}
// ---------- tu mano en abanico (el arrastre para reordenar sigue en game.js: #hand .c) ----------
function abanico(L){const n=L.length,mid=(n-1)/2,st=n>1?Math.min(5,26/(n-1)):0,rm=mid*st;
 return `<div id="hand" class="m2d-mano" style="--n:${n};--n1:${Math.max(n-1,1)}">`+L.map((c,j)=>{const r=(j-mid)*st;
  return `<div class="m2d-ca ${c.cls||''}" style="--r:${r.toFixed(1)}deg;--y:${((r*r-rm*rm)*.16).toFixed(1)}px">${c.h}</div>`}).join('')+'</div>'}
// ---------- globitos que salen del asiento de quien hizo algo ----------
function bb(k,t,c){const s=document.querySelector(`#app .m2d [data-seat="${k}"]`);if(!s||RM)return;
 const r=s.getBoundingClientRect(),up=r.top+r.height/2>innerHeight*.55,e=document.createElement('div');
 e.className='m2d-bb'+(c?' '+c:'')+(up?' up':'');e.textContent=t;FX.appendChild(e);const w=e.offsetWidth;
 e.style.left=Math.max(8+w/2,Math.min(innerWidth-8-w/2,r.left+r.width/2))+'px';e.style.top=(up?r.top-8:r.bottom+4)+'px';setTimeout(()=>e.remove(),2400)}
// ---------- menú (una hoja con lo que no es la partida) ----------
let abierto=false;
function menuHtml(o){const G=V.G;return `<div class="ui-scrim ligero" onclick="M2D.menu(0)"></div><div class="ui-sheet izq m2d-menu"><div class="ui-hd"><b class="ui-h">Partida</b><button class="ui-x" onclick="M2D.menu(0)" aria-label="Cerrar">${ico('x')}</button></div><div class="ui-bd">
 ${o.menu||''}<div class="ui-row"><span>Sonidos</span><label class="ui-sw"><input type="checkbox" ${mute?'':'checked'} onchange="mute=!this.checked;render()"><i></i></label></div>
 ${typeof musUI=='function'?`<div class="ui-row m2d-mus">${musUI()}</div>`:''}
 ${G&&G.log&&G.log.length?`<details><summary>Historial</summary>${logv()}</details>`:''}<details><summary>Jugadores</summary>${plist()}</details>${o.rules||''}
 ${V.host?`<button class="ui-btn sec full" onclick="if(confirm('¿Cerrar la sala?')){send({t:'close'});leave()}">${ico('x')}Cerrar sala</button>`:''}</div></div>`}
// o: {cls,estilo,top,der,seats,centro,capa,hint,mine,yo,acc,ord,mano,menu,rules}
function mesa(o){return `<div class="m2d ${o.cls||''}" style="${o.estilo||''}">
 <div class="m2d-top"><button class="ui-rb" onclick="M2D.menu()" aria-label="Menú">${ico('menu')}</button>${o.top||''}<span class="m2d-sp"></span>${o.der||''}</div>
 <div class="m2d-zona"><div class="m2d-felt">${o.centro||''}</div>${(o.seats||[]).join('')}${o.capa||''}</div>
 <div class="m2d-yo">${o.hint!=null?`<div class="m2d-bar">${o.yo||''}<div class="m2d-hint${o.mine?' mine':''}">${o.hint}</div>${o.acc||''}${o.ord||''}</div>`:''}${o.mano||''}</div>
 ${abierto?menuHtml(o):''}</div>`}
const M2D=window.M2D={retrato,rivales,asiento,yo,abanico,bb,mesa,suelta:null,teclas:null,
 menu(v){abierto=v==null?!abierto:!!v;render()}};
// ---------- soltar una carta de tu mano en el centro (.m2d-drop) para jugarla ----------
const enDrop=e=>{const t=document.elementFromPoint(e.clientX,e.clientY);return (t&&t.closest&&t.closest('.m2d .m2d-drop'))||null};   // puede haber varias zonas (descarte, bajadas)
addEventListener('pointermove',e=>{if(typeof dg=='undefined'||!dg||!dg.on||!M2D.suelta)return;const z=enDrop(e);document.querySelectorAll('.m2d .m2d-drop').forEach(x=>x.classList.toggle('over',x===z))},true);
addEventListener('pointerup',e=>{if(typeof dg=='undefined'||!dg||!dg.on||!M2D.suelta||!document.querySelector('#app .m2d'))return;
 const z=enDrop(e);if(!z)return;const id=dg.id;dg.g.remove();dg.el.style.opacity='';dg=null;noClick=0;M2D.suelta(id,z,e);noClick=Date.now()},true);
// ---------- teclas (las define cada juego en M2D.teclas; Esc cierra el menú) ----------
addEventListener('keydown',e=>{if(!document.querySelector('#app .m2d'))return;const t=e.target;if(t&&(t.tagName=='INPUT'||t.tagName=='TEXTAREA'))return;
 if(e.key=='Escape'&&abierto){M2D.menu(0);return}if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(M2D.teclas&&M2D.teclas(e.key.length==1?e.key.toLowerCase():e.key))e.preventDefault()});
let rz=0;addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(()=>{if(document.querySelector("#app .m2d"))render()},150)});   // los asientos se acomodan al girar el celular
})();
