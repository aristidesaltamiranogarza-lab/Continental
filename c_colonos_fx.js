// Colonos 2D (COFX): lo que pasa en la mesa se ve, no se lee. Lee las jugadas nuevas del registro (G.log) y las pasa en orden, una por una:
// dados que caen y su suma, terrenos que pagan, cartas que viajan del terreno a la pieza y a quien cobra, robo boca abajo, tratos, cartas que crecen
// al jugarse y un globito con ícono sobre quien jugó. Los turnos de los bots se ven como una serie de pasos cortos. Solo transform/opacity (WAAPI).
(function(){
const D=window.COLD;if(!D||!window.CO2)return;
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches,EZ='cubic-bezier(.3,1.4,.5,1)',EZF='cubic-bezier(.45,.05,.35,1)';
const CBG=['#D6E6C6','#F1CDB6','#EDF4DB','#F6E3AE','#DCE0E7'],CBD=['#4C7A40','#B0552F','#8DB35A','#C9962C','#6E7684'];
const DEVN={k:'Caballero',v:'Punto',c:'Caminos',a:'Abundancia',m:'Monopolio'},DEVC={k:'#8C3B2E',v:'#C9962C',c:'#2E6E73',a:'#3D7A47',m:'#5E4A8C'};
let lay,lastN=-1,cola=[],corre=false,free={k:-1,n:0},G=null,ME=-1;
const pc=k=>D.PCOL[k%D.PCOL.length],sfx_=k=>{if(typeof sfx=='function')try{sfx(k)}catch(e){}};
function capa(){if(!lay){lay=document.createElement('div');lay.id='cofx';lay.className='co-fxl';document.body.appendChild(lay)}return lay}
// dónde está cada quien en pantalla: tus montones, la etiqueta de un rival o el centro del tablero
const ctr=el=>{if(!el)return null;const r=el.getBoundingClientRect();return r.width?{x:r.left+r.width/2,y:r.top+r.height/2}:null};
const BD=()=>window.COB?COB():CO2;
const seat=(k,c)=>{const B=BD(),s=B.seat&&B.seat(k,c);return s||ctr(document.querySelector(`#app .co2d [data-seat="${k}"]`))||B.mid()};
const pile=r=>ctr(document.querySelector(`#app .co2d [data-pile="${r}"]`))||ctr(document.querySelector('#app .co2d .co-piles'))||BD().mid();
const quien=(k,r)=>k===ME&&r!=null?pile(r):k===ME?ctr(document.querySelector('#app .co2d .co-piles'))||BD().mid():seat(k);
const ricon=r=>window.COU&&COU.rico?COU.rico(r):'';
function cardEl(r){const e=document.createElement('div');e.className='co-fc';
 if(r==null||r<0)e.classList.add('bk');else{e.style.setProperty('--bg',CBG[r]);e.style.setProperty('--bd',CBD[r]);e.innerHTML=ricon(r)}return e}
// una carta que viaja de a (por b, si hay) a c
function vuela(r,a,b,c,dl,dur){if(!a||!c)return;const e=cardEl(r);capa().appendChild(e);dur=RM?10:dur||900;
 const T=(p,s)=>`translate(${p.x.toFixed(0)}px,${p.y.toFixed(0)}px) translate(-50%,-50%) scale(${s})`,K=b?[
  {transform:T(a,.3),opacity:0},{transform:T(a,1.15),opacity:1,offset:.12},{transform:T(b,1),opacity:1,offset:.45},{transform:T(b,1),opacity:1,offset:.55},{transform:T(c,.7),opacity:.9,offset:.92},{transform:T(c,.5),opacity:0}]:[
  {transform:T(a,.4),opacity:0},{transform:T(a,1.1),opacity:1,offset:.15},{transform:T(c,.75),opacity:.95,offset:.9},{transform:T(c,.5),opacity:0}];
 const an=e.animate(K,{duration:dur,delay:dl||0,easing:EZF,fill:'both'});an.onfinish=()=>e.remove();setTimeout(()=>e.remove(),(dl||0)+dur+400)}
// los dados ruedan al centro del tablero, la suma salta encima
function dados(a,b,s,k){const B=BD(),p3=B.dados?B.dados(a,b,k):null;if(p3){const e=document.createElement("div");e.className="co-dados co-d3";e.innerHTML=`<b class="${s==7?"s7":""}">${s}</b>`;e.style.left=p3.x+"px";e.style.top=p3.y+"px";sfx_("card");setTimeout(()=>{capa().appendChild(e);sfx_("tick")},560);setTimeout(()=>{e.classList.add("sale");setTimeout(()=>e.remove(),400)},1700);return}
 const c=B.mid(),e=document.createElement("div");e.className="co-dados";
 const die=v=>`<i class="co-die" data-v="${v}">${'<u></u>'.repeat(v)}</i>`;e.innerHTML=`${die(a)}${die(b)}<b class="${s==7?'s7':''}">${s}</b>`;capa().appendChild(e);
 e.style.left=c.x+'px';e.style.top=c.y+'px';if(!RM){[...e.querySelectorAll('.co-die')].forEach((d,i)=>d.animate([{transform:`translate(${140+i*30}px,${90-i*40}px) rotate(${-320+i*90}deg)`,opacity:0},{opacity:1,offset:.2},{transform:'none',opacity:1}],{duration:620+i*90,easing:EZ,fill:'both'}))}
 sfx_('card');setTimeout(()=>sfx_('tick'),500);setTimeout(()=>{e.classList.add('sale');setTimeout(()=>e.remove(),400)},1500)}
// globito con ícono sobre quien jugó
function globo(k,html){if(k===ME&&k>=0)return;const p=seat(k,1);if(!p)return;const e=document.createElement('div');e.className='co-bub';e.style.setProperty('--c',pc(k));e.innerHTML=html;
 capa().appendChild(e);e.style.left=p.x+'px';e.style.top=(p.y-26)+'px';setTimeout(()=>e.remove(),1500)}
function grande(c){const m=BD().mid(),e=document.createElement('div');e.className='co-big';e.style.setProperty('--dc',DEVC[c]);e.innerHTML=`<span>${DEVN[c]}</span>`;
 capa().appendChild(e);e.style.left=m.x+'px';e.style.top=m.y+'px';sfx_('go');setTimeout(()=>{e.classList.add('sale');setTimeout(()=>e.remove(),350)},1250)}
const pz=(w,k)=>window.COU&&COU.pzs?COU.pzs(w,k):'';
// ---------- cada jugada ----------
function paso(x,Gn,fast){const k=x.k,g=D.geo(Gn.hx),sp=fast?.55:1;
 if(x.t=='tira'){free={k:-1,n:0};dados(Gn.dice[0]&&x.n===lastTira(Gn)?Gn.dice[0]:Math.min(6,x.s-1),Gn.dice[0]&&x.n===lastTira(Gn)?Gn.dice[1]:1,x.s,k);
  setTimeout(()=>{BD().roll(x.s);if(x.s==7){if(window.M2D)Gn.players.forEach((p,j)=>{if(j!==ME)M2D.reac(j,'sorpresa')});return}
   if(x.n!==lastTira(Gn)||!Gn.got)return;let dl=0;
   Object.keys(Gn.got).forEach(kk=>{const j=+kk,got=Gn.got[kk];got.forEach((n,r)=>{if(!n)return;
    const src=[];Gn.hx.forEach((h,hi)=>{if(h.n===x.s&&h.t===r&&hi!==Gn.rob)g.H[hi].v.forEach(v=>{if(Gn.vo[v]===j)src.push([hi,v,Gn.vt[v]=='u'?2:1])})});
    let i=0;for(const[hi,v,m]of src)for(let q=0;q<m&&i<n;q++,i++){vuela(r,BD().pos('h',hi),BD().pos('v',v),quien(j,r),dl,1050);dl+=110}})});
   if(dl)setTimeout(()=>sfx_('card'),400)},700);return 1700*sp}
 if(x.t=='pone'){const at=x.w=='c'?BD().pos('e',x.at):BD().pos('v',x.at),pago=Gn.stats.dice.some(n=>n)&&!(free.k===k&&x.w=='c'&&free.n>0&&free.n--);
  if(pago){const c=D.COST[x.w];let dl=0;c.forEach((n,r)=>{for(let q=0;q<n;q++){vuela(k===ME?r:-1,quien(k,r),null,at,dl,620);dl+=70}})}
  globo(k,pz(x.w,k));sfx_('card');return 600*sp}
 if(x.t=='compra'){const m=BD().mid();let dl=0;D.COST.d.forEach((n,r)=>{if(n){vuela(k===ME?r:-1,quien(k,r),null,m,dl,560);dl+=70}});
  setTimeout(()=>vuela(-1,m,null,k===ME?ctr(document.querySelector('#app .co2d .co-devs'))||quien(k):seat(k),0,620),260);globo(k,pz('d',k));return 700*sp}
 if(x.t=='juega'){if(x.c=='c'){free={k,n:2}}grande(x.c);globo(k,`<i class="co-mj" style="--dc:${DEVC[x.c]}"></i>`);
  if(x.c=='m'&&Gn.mono&&Gn.mono.k===k){setTimeout(()=>Gn.players.forEach((p,j)=>{if(j!==k)vuela(Gn.mono.r,quien(j,Gn.mono.r),null,quien(k,Gn.mono.r),j*90,720)}),900)}
  return 1500*sp}
 if(x.t=='ladron'){globo(k,'<i class="co-mr"></i>');sfx_('tick');return 600*sp}
 if(x.t=='roba'){const sl=Gn.sl&&Gn.sl.n===x.n?Gn.sl:null,r=sl&&sl.r!=null?sl.r:null;
  vuela(r!=null&&(ME===k||ME===x.v)?r:-1,quien(x.v,ME===x.v?r:null),null,quien(k,ME===k?r:null),0,820);if(window.M2D){M2D.reac(x.v,'enojo');if(k!==ME)M2D.reac(k,'feliz')}
  sfx_('card');return 950*sp}
 if(x.t=='trato'){let dl=0;(x.give||[]).forEach((n,r)=>{for(let q=0;q<n;q++){vuela(r,quien(k,r),null,quien(x.v,r),dl,760);dl+=80}});
  (x.want||[]).forEach((n,r)=>{for(let q=0;q<n;q++){vuela(r,quien(x.v,r),null,quien(k,r),dl,760);dl+=80}});if(window.M2D){M2D.reac(k,'feliz');M2D.reac(x.v,'feliz')}
  sfx_('card');return (900+dl)*sp}
 if(x.t=='banco'){const m=BD().mid();let dl=0;for(let q=0;q<x.k;q++){vuela(x.give,quien(k,x.give),null,m,dl,560);dl+=60}vuela(x.get,m,null,quien(k,x.get),dl+200,640);
  globo(k,`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h13l-3-3M18 8l-3 3M19 16H6l3 3M6 16l3-3"/></svg>`);return (800+dl)*sp}
 if(x.t=='descarta'){const m=BD().mid();for(let q=0;q<x.n;q++)vuela(-1,quien(k),null,m,q*60,560);return 400*sp}
 if(x.t=='ruta'||x.t=='ejercito'){globo(k,`<i class="co-md big"></i>`);sfx_('go');if(window.M2D&&k!==ME)M2D.reac(k,'feliz');return 900*sp}
 if(x.t=='gana'){sfx_('win');if(window.M2D)M2D.reac(k,'feliz',5000);return 400}
 return 0}
const lastTira=Gn=>{const L=(Gn.log||[]).filter(x=>x.t=='tira');return L.length?L[L.length-1].n:-1};
function sigue(){if(!cola.length){corre=false;return}corre=true;const[x,Gn]=cola.shift(),fast=cola.length>3;let ms=0;try{ms=paso(x,Gn,fast)}catch(e){console.warn('Colonos FX:',e)}
 setTimeout(sigue,Math.max(60,ms))}
window.COFX={
 after(Gn,me){G=Gn;ME=me;const L=Gn.log||[],top=L.length?L[L.length-1].n:0;
  if(lastN<0){lastN=top;return}if(top<lastN){lastN=top;return}   // partida nueva
  const nw=L.filter(x=>x.n>lastN);lastN=top;if(!nw.length)return;
  if(cola.length>12)cola=cola.slice(-4);nw.forEach(x=>cola.push([x,Gn]));if(!corre)sigue()},
 reset(){lastN=-1;cola=[];if(lay)lay.innerHTML=''}};
})();
