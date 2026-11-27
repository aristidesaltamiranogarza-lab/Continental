// c_plano_corte.js — PCORTE: el corte vivo del plano 2D, la casa vista de lado con una franja por piso (azotea con pérgola, planta alta,
// planta baja, línea del suelo y sótano en la tierra). Tocar o deslizar el dedo encima cambia de piso (PCORTE.alElegir). En cada franja
// van las caras de quien anda ahí (a su x en la casa), un puntito del color de cada juego en curso (late si es una sala esperando) y, si
// alguien de otro piso dice algo, su globo sale junto al corte. Va siempre del lado del jardín (ui_lobby.css .pl-corte).
(function(){
const NIV=[['c2','Azotea','Azotea'],['c1','Planta alta','Alta'],['c0','Planta baja','Baja'],['cm1','Sótano','Sótano']];
const ESC='<svg class="pc-esc" viewBox="0 0 13 30" preserveAspectRatio="none" aria-hidden="true"><path vector-effect="non-scaling-stroke" d="M0 30H2.6V24H5.2V18H7.8V12H10.4V6H13V0"/></svg>';
let el=null,PIS=null,SEL=null,B=[],O={cur:'c0',gente:[],pips:[],x0:-18,w:36},CA={},PI={},arr=false;
function nodo(){if(el)return el;el=document.createElement('nav');el.className='pl-corte';el.setAttribute('aria-label','Pisos de la casa');
 el.innerHTML=`<svg class="pc-techo" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><rect x="36" y="1" width="60" height="1.8"/><rect x="40" y="1" width="1.6" height="11"/><rect x="58" y="1" width="1.6" height="11"/><rect x="76" y="1" width="1.6" height="11"/><rect x="93" y="1" width="1.6" height="11"/></svg>`+
  `<div class="pc-pisos"><div class="pc-tierra" aria-hidden="true"></div><i class="pc-sel"></i>${NIV.map(([f,l,c],i)=>`<button class="pc-niv" data-f="${f}" style="--k:${3-i}" aria-label="${l}">${f==='c2'?'':ESC}<span class="pc-nom"><span class="l">${l}</span><span class="c">${c}</span></span></button>`).join('')}</div>`;
 PIS=el.querySelector('.pc-pisos');SEL=el.querySelector('.pc-sel');B=[...el.querySelectorAll('.pc-niv')];
 // tocar o deslizar: el piso bajo el dedo; con teclado, Enter/Espacio en cada franja
 const elige=e=>{const r=PIS.getBoundingClientRect(),y=e.clientY-r.top;let f=null;
  if(y<0)f='c2';else if(y>=PIS.offsetHeight)f='cm1';else B.forEach(b=>{if(y>=b.offsetTop&&y<b.offsetTop+b.offsetHeight)f=b.dataset.f});
  if(f&&f!==O.cur&&PCORTE.alElegir)PCORTE.alElegir(f)};
 el.addEventListener('pointerdown',e=>{arr=true;try{el.setPointerCapture(e.pointerId)}catch(_){}elige(e)});
 el.addEventListener('pointermove',e=>{if(arr)elige(e)});
 ['pointerup','pointercancel'].forEach(t=>el.addEventListener(t,()=>{arr=false}));
 B.forEach(b=>b.addEventListener('click',e=>{if(e.detail===0&&PCORTE.alElegir)PCORTE.alElegir(b.dataset.f)}));
 return el}
// o = {cur, gente:[{k,f,x,av,yo}], pips:[{g,f,x,c,esp}], x0, w}
function pon(o){nodo();O=o;const vivos=new Set();
 o.gente.forEach((p,i)=>{vivos.add(p.k);let e=CA[p.k];if(!e){e=CA[p.k]=document.createElement('i');e.className='pc-cara'+(p.yo?' yo':'');e.innerHTML=p.av;e.style.setProperty('--i',i);e.style.opacity=0;e._n=1;PIS.appendChild(e)}});
 for(const k in CA)if(!vivos.has(k)){CA[k].remove();delete CA[k]}
 const pv=new Set();o.pips.forEach(p=>{pv.add(p.g);let e=PI[p.g];if(!e){e=PI[p.g]=document.createElement('i');e.className='pc-pip';e.style.opacity=0;e._n=1;PIS.appendChild(e)}e.style.setProperty('--f',p.c);e.classList.toggle('esp',!!p.esp)});
 for(const g in PI)if(!pv.has(g)){PI[g].remove();delete PI[g]}
 orden()}
// acomoda selección, caras y puntitos (necesita estar en pantalla para medir)
function orden(){if(!el||!el.isConnected||!PIS.offsetHeight)return;
 const cf=parseFloat(getComputedStyle(el).getPropertyValue('--cf'))||15,M={};
 B.forEach(b=>{M[b.dataset.f]={t:b.offsetTop,h:b.offsetHeight,l:b.offsetLeft,w:b.offsetWidth};b.setAttribute('aria-current',b.dataset.f===O.cur)});
 const s=M[O.cur]||M.c0;SEL.style.transform=`translateY(${s.t-3}px)`;SEL.style.height=(s.h+3)+'px';
 const X=(b,x)=>b.l+17+Math.min(1,Math.max(0,(x-O.x0)/O.w))*(b.w-17-cf-3);
 const por={};O.gente.forEach(p=>{if(M[p.f])(por[p.f]=por[p.f]||[]).push(p)});
 for(const f in por){const b=M[f],L=por[f].map(p=>({p,x:X(b,p.x)})).sort((u,v)=>u.x-v.x),x0=b.l+17,x1=b.l+b.w-cf-3,g=cf*.62;
  if((L.length-1)*g>x1-x0){const gg=(x1-x0)/Math.max(1,L.length-1);L.forEach((o,i)=>o.x=x0+i*gg)}
  else{for(let i=1;i<L.length;i++)L[i].x=Math.max(L[i].x,L[i-1].x+g);const ov=L[L.length-1].x-x1;if(ov>0)L.forEach(o=>o.x-=ov);L.forEach((o,i)=>o.x=Math.max(o.x,x0+i*g))}
  const y=b.t+b.h-3-cf;L.forEach((o,i)=>{const e=CA[o.p.k];if(!e)return;e.style.transform=`translate(${o.x.toFixed(1)}px,${y.toFixed(1)}px)`;e.style.zIndex=o.p.yo?30:3+i;e.style.opacity='';nuevo(e)})}
 O.pips.forEach(p=>{const b=M[p.f],e=PI[p.g];if(!b||!e)return;e.style.transform=`translate(${(X(b,p.x)+cf/2-4.5).toFixed(1)}px,${(b.t+b.h-8).toFixed(1)}px)`;e.style.opacity='';nuevo(e)})}
// lo recién puesto aparece en su lugar (sin volar desde la esquina); después ya se desliza
function nuevo(e){if(!e._n)return;e._n=0;e.style.transition='opacity .3s';requestAnimationFrame(()=>requestAnimationFrame(()=>{e.style.transition=''}))}
// alguien de otro piso dijo algo: globo junto al corte, a la altura de su piso
function dice(f,n,txt,k){const b=B.find(b=>b.dataset.f===f);if(!b||!el.isConnected)return;el.querySelectorAll('.pc-dice').forEach(d=>d.remove());
 const d=document.createElement('div');d.className='pc-dice';const nb=document.createElement('b');nb.textContent=n;d.append(nb,' '+String(txt).slice(0,60));
 d.style.top=(PIS.offsetTop+b.offsetTop+b.offsetHeight/2)+'px';el.appendChild(d);
 const c=CA[k];if(c){c.classList.remove('habla');void c.offsetWidth;c.classList.add('habla')}
 setTimeout(()=>d.classList.add('fuera'),2800);setTimeout(()=>d.remove(),3300)}
addEventListener('resize',()=>setTimeout(orden,60));
window.PCORTE={nodo,pon,orden,dice,alElegir:null};
})();
