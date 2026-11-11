// c_blackjack_hud.js — BJH: la interfaz del Blackjack del sótano (BJ3, c_blackjack3d.js). Estilos en ui_juegos.css (.bj-…).
// BJH.hud(v,s) cuando estás sentado: pastillas debajo de la del piso (tus fichas, la fase con cuenta regresiva, Arriba/tus cartas, Recentrar, Levantarse) y la barra de abajo
// (fichas para apostar, Repartir, Seguro, Pedir/Plantarse/Doblar/Dividir/Rendirse, tu resultado). BJH.firma(v,s) cambia cuando hay que redibujar.
// BJH.paso(v,s,now) cada cuadro (cerca de la mesa): cuenta regresiva, nombre y fichas sobre cada jugador y un globito con el total o el resultado
// de cada mano y del crupier. Los avisos del servidor (v.msg) salen con SAL.aviso.
(function(){
const I=n=>window.UI?UI.ico(n):'',es=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),$=id=>document.getElementById(id);
const mon=f=>'$'+Math.round(Math.abs(f||0)).toLocaleString('es-MX'),touchy=matchMedia('(pointer:coarse)').matches;
const FICHAS=[[5,'roja'],[10,'azul'],[25,'verde'],[50,'naranja'],[100,'negra'],[500,'morada']],val=c=>{const r=c%13;return r==0?1:r>=9?10:r+1};
const RES={bj:'Blackjack',gana:'Gana',pierde:'Pierde',pasa:'Se pasa',empate:'Empate',rinde:'Se rinde'};
const L=new Map();let tP=0,msg='',pend=null;
const snd=n=>{if(typeof sfx=='function')sfx(n)};
const turnoDe=v=>v.fase=='turnos'&&v.turno?v.turno:null;
const segs=v=>Math.max(0,Math.ceil(((v.left||0)-(performance.now()-(v.t0||0)))/1000));
const total=h=>h.bj?'Blackjack':h.s&&h.t<=21?`${h.t-10} o ${h.t}`:String(h.t);

// ---------- apuesta: cada ficha suma (de 10 a 500, múltiplos de 5, sin pasar de tus fichas) ----------
function base(a){return pend&&performance.now()-pend.t<1500?pend.ap:a.ap}
function suma(v,a,d){const top=Math.min(v.max,a.f+a.ap);let n=Math.min(top,Math.max(v.min,base(a)+d));return n-n%5}
function yo(){const v=BJ3.v,s=BJ3.yo();return v&&s>=0&&v.as[s]?{v,a:v.as[s]}:null}
function apostar(n){const y=yo();if(!y)return;pend={ap:n,t:performance.now()};BJ3.act('apostar',{v:n});snd('place')}
function ficha(d){const y=yo();if(!y)return;const n=suma(y.v,y.a,d);if(n>base(y.a))apostar(n)}
function op(o){if(o==='borrar'){pend=null;BJ3.act('apostar',{v:0})}else BJ3.act(o);snd('tick')}

// ---------- pastillas y barra ----------
function fase(v,s,a){const t=turnoDe(v),h0=a.manos[0];
 if(v.fase=='apuestas')return {t:a.listo?'Listo':'Apuestas',left:v.left>0,me:!a.listo&&!!a.ap};
 if(v.fase=='reparto')return {t:'Repartiendo'};
 if(v.fase=='seguro')return h0&&!a.dec?{t:v.cr.c[0]%13==0?'¿Seguro?':'¿Sigues?',me:true,left:true}:{t:'El crupier revisa'};
 if(t&&t.s===s)return {t:'Tu turno'+(a.manos.length>1?` · mano ${t.m+1}`:''),me:true,left:true};
 if(t)return {t:'Turno de '+es(v.as[t.s]&&v.as[t.s].n)};
 if(v.fase=='crupier')return {t:'Juega el crupier'};
 return {t:'Pago'}}
const B=(t,on,cls,dis)=>`<button class="ui-btn${cls?' '+cls:''}" onclick="${on}"${dis?' disabled':''}>${t}</button>`;
const nota=t=>`<span class="gj-note">${t}</span>`;
function botones(v,s,a){const t=turnoDe(v),h0=a.manos[0];
 if(v.fase=='apuestas'){
  const fs=`<div class="bj-fichas">${FICHAS.map(([d,k])=>`<button class="bj-ficha ${k}" onclick="BJH.ficha(${d})"${suma(v,a,d)<=a.ap?' disabled':''} aria-label="Apostar ${d} más">${d}</button>`).join('')}</div>`;
  if(a.listo)return fs+nota(`Apostaste ${mon(a.ap)} · esperando a los demás`);
  if(a.ap)return fs+B('Borrar',"BJH.op('borrar')",'ghost')+B(`Repartir · ${mon(a.ap)}`,"BJH.op('listo')",'go');
  return fs+(a.ult&&a.ult<=a.f?B(`Repetir ${mon(a.ult)}`,`BJH.apostar(${a.ult})`,'sec'):nota('Toca una ficha para apostar'))}
 if(v.fase=='seguro'&&h0&&!a.dec){const as=v.cr.c[0]%13==0,c=Math.floor(h0.a/2);
  return (as?B(`Seguro · ${mon(c)}`,"BJH.op('seguro')",'sec',c>a.f)+B('Sin seguro',"BJH.op('noseguro')"):B('Seguir',"BJH.op('noseguro')"))+(h0.fin?'':B('Rendirse',"BJH.op('rendir')",'ghost'))}
 if(t&&t.s===s){const h=a.manos[t.m];if(!h)return '';const dos=h.c.length==2;
  return B('Pedir',"BJH.op('pedir')")+B('Plantarse',"BJH.op('plantar')",'sec')+(dos&&a.f>=h.a?B('Doblar',"BJH.op('doblar')",'sec'):'')
   +(dos&&val(h.c[0])==val(h.c[1])&&a.manos.length<4&&a.f>=h.a?B('Dividir',"BJH.op('dividir')",'sec'):'')+(a.manos.length==1&&dos&&!h.div?B('Rendirse',"BJH.op('rendir')",'ghost'):'')}
 if(v.fase=='pago'&&a.manos.length)return nota(a.neta>0?`Ganaste <b>${mon(a.neta)}</b>`:a.neta<0?`Perdiste ${mon(a.neta)}`:'Quedaste igual');
 return ''}
function hud(v,s,sinT){const a=v.as[s];if(!a)return '';const f=fase(v,s,a),b=botones(v,s,a);
 return `<div class="ui bj-top"><span class="ui-pill bj-f"><small>Fichas</small><b>${mon(a.f)}</b></span>
  <span class="ui-pill gj-turn${f.me?' me':''}"><span>${f.t}${f.left?` · <span id="bjLeft">${sinT?'':segs(v)}</span> s`:''}</span></span>
  <button class="ui-rb${BJ3.vista()=='arriba'?' on':''}" onclick="BJ3.ver()" title="${BJ3.vista()=='arriba'?'Ver tus cartas':'Ver toda la mesa'}" aria-label="Ver toda la mesa" aria-pressed="${BJ3.vista()=='arriba'}">${I('arriba')}</button>
  ${BJ3.mirando()?`<button class="ui-rb" onclick="BJ3.recentra()" title="Recentrar (doble toque)" aria-label="Recentrar">${I('cuadrar')}</button>`:''}
  ${window.BJ2D?BJ2D.boton():''}
  <button class="ui-rb" onclick="BJ3.levantarse()" title="Levantarse${touchy?'':' (Esc)'}" aria-label="Levantarse">${I('salir')}</button></div>
 ${window.BJ2D?BJ2D.html(v,s,sinT):''}
 ${b?`<div class="ui bj-bar" role="group" aria-label="Jugadas"><div class="bj-bb">${b}</div></div>`:''}`}

// ---------- nombres y globitos sobre la mesa ----------
function etiqueta(k){let e=L.get(k);if(!e){e=document.createElement('div');L.set(k,e)}if(!e.isConnected)(document.getElementById('app')||document.body).appendChild(e);e.vivo=1;return e}   // render() rehace #app: se vuelve a poner
function pon(e,cls,h,p,cam,W,Hh){if(e.className!==cls)e.className=cls;if(e._h!==h){e._h=h;e.innerHTML=h}
 if(!p)return e.style.display='none';p.project(cam);const vis=p.z<1&&Math.abs(p.x)<1.05&&Math.abs(p.y)<1.05;e.style.display=vis?'':'none';
 if(vis)e.style.transform=`translate(${Math.round((p.x+1)/2*W)}px,${Math.round((1-p.y)/2*Hh)}px) translate(-50%,-100%)`}
function paso(v,s,now){tP=now;const H=window.CASA3D,cam=H&&H.cam(),cv=H&&H.R&&H.R()&&H.R().domElement;if(!v||!cam||!cv)return;
 const el=$('bjLeft');if(el){const t=String(segs(v));if(el.textContent!==t)el.textContent=t}
 if(v.msg&&v.msg!==msg&&window.SAL&&(s>=0||BJ3.cerca()))SAL.aviso(v.msg);msg=v.msg||'';
 L.forEach(e=>{e.vivo=0});
 if((s>=0||BJ3.cerca())&&!(s>=0&&window.BJ2D&&BJ2D.on())){const W=cv.clientWidth,Hh=cv.clientHeight,t=turnoDe(v);
  v.as.forEach((a,i)=>{if(!a)return;
   if(i!==s)pon(etiqueta('n'+i),'ui gj-seat bj-n'+(t&&t.s===i?' on':''),`<b>${es(a.n)}</b><small>${mon(a.f)}</small>`,window.MPJ&&MPJ.arriba(i),cam,W,Hh);
   a.manos.forEach((h,m)=>{const r=h.res,cl=r?(h.neta>0?' gana':h.neta<0?' pierde':''):(t&&t.s===i&&t.m===m?' on':'');
    pon(etiqueta('t'+i+':'+m),'ui bj-tot'+cl,r?`${RES[r]||r}${h.neta?` ${h.neta>0?'+':'−'}${mon(h.neta)}`:''}`:total(h),BJ3.pt(i,m,a.manos.length),cam,W,Hh)})});
  if(v.cr.c.length)pon(etiqueta('cr'),'ui bj-tot cr'+(v.fase=='crupier'?' on':''),`Crupier ${v.cr.t}`,BJ3.pt(-1),cam,W,Hh)}
 L.forEach((e,k)=>{if(!e.vivo){e.remove();L.delete(k)}})}
// fuera del sótano nadie llama paso: se esconden solos
setInterval(()=>{if(performance.now()-tP>400)L.forEach(e=>{if(e.style.display!=='none')e.style.display='none'})},300);

window.BJH={hud,paso,ficha,op,apostar,firma:(v,s)=>v&&s>=0?hud(v,s,true):''};
})();
