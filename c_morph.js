// MORPH: redibujar sin reiniciar. En vez de tirar y rehacer el HTML (lo que reinicia scroll, menús abiertos,
// animaciones, foco y lo que se escribe), compara el HTML nuevo con lo que hay y cambia solo lo distinto.
// MORPH.auto(el): desde ahí, el.innerHTML=... hace morph solo (se usa en #app, donde game.js dibuja todo cada vez).
// MORPH.set(el,html): morph de una vez. Para forzar un nodo nuevo, ponle otro id o data-k.
(function(){
const pInner=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
const sinDelay=s=>String(s||'').replace(/animation-delay:[^;]*;?/g,'').trim();
const llave=n=>n.nodeType===1?(n.id||n.getAttribute('data-k')||''):'';
const mismo=(a,b)=>a.nodeType===b.nodeType&&a.nodeName===b.nodeName&&llave(a)===llave(b);
function attrs(o,n){
 for(const a of Array.from(o.attributes)){if(n.hasAttribute(a.name))continue;
  if(a.name==='open'&&o.nodeName==='DETAILS')continue;   // abierto o cerrado como lo dejó el jugador
  o.removeAttribute(a.name)}
 for(const a of Array.from(n.attributes)){const v=o.getAttribute(a.name);if(v===a.value)continue;
  if(a.name==='open'&&o.nodeName==='DETAILS')continue;
  // el retraso negativo de animación (para no reiniciarla al redibujar) ya no hace falta: la animación sigue viva
  if(a.name==='style'&&v!=null&&sinDelay(v)===sinDelay(a.value))continue;
  o.setAttribute(a.name,a.value)}
 if(o.nodeName==='INPUT'||o.nodeName==='TEXTAREA'){
  if(document.activeElement!==o){const v=n.getAttribute('value')||(o.nodeName==='TEXTAREA'?n.textContent:'');
   if(o.type==='checkbox'||o.type==='radio')o.checked=n.hasAttribute('checked');else if(o.value!==v&&(n.hasAttribute('value')||o.nodeName==='TEXTAREA'))o.value=v}}
}
function nodo(o,n){
 if(o.nodeType!==1){if(o.nodeValue!==n.nodeValue)o.nodeValue=n.nodeValue;return}
 if(o.isEqualNode(n))return;
 attrs(o,n);
 if(o.nodeName!=='TEXTAREA')hijos(o,n);
 if(o.nodeName==='SELECT'&&document.activeElement!==o){const i=Array.from(n.options).findIndex(x=>x.hasAttribute('selected'));if(i>=0&&o.selectedIndex!==i)o.selectedIndex=i}
}
function hijos(o,n){
 const nn=Array.from(n.childNodes);let i=0;
 for(;i<nn.length;i++){const b=nn[i];let a=o.childNodes[i];
  if(a&&!mismo(a,b)){   // ¿está más adelante (por id/data-k)? se mueve en vez de rehacerse
   const k=llave(b);let m=null;if(k)for(let j=i+1;j<o.childNodes.length;j++){const c=o.childNodes[j];if(llave(c)===k&&mismo(c,b)){m=c;break}}
   if(m){o.insertBefore(m,a);a=m}else{o.insertBefore(document.importNode(b,true),a);continue}}
  if(!a){o.appendChild(document.importNode(b,true));continue}
  nodo(a,b)}
 while(o.childNodes.length>nn.length)o.removeChild(o.lastChild);
}
function set(el,html){html=String(html==null?'':html);
 const t=document.createElement('template');pInner.set.call(t,html);hijos(el,t.content)}
function auto(el){if(!el||el._morph)return el;el._morph=1;
 Object.defineProperty(el,'innerHTML',{configurable:true,get(){return pInner.get.call(this)},set(h){try{set(this,h)}catch(e){pInner.set.call(this,h)}}});
 return el}
window.MORPH={set,auto};
auto(document.getElementById('app'));
})();
