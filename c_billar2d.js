// c_billar2d.js — B2D: Bola 8 en 2D para el modo Ligero (sin casa 3D). El inicio (c_lobby.js) lo abre con B2D.abre().
// Habla con POST /casa como c_casino2d.js (piso '2d', b.bi; reglas en g_billar.js) y simula cada tiro con BFIS (billar_fis.js), igual que el
// servidor: el tiro propio se ve al soltar y los de los demás al llegar ult. La mesa va vista desde arriba en un lienzo (en celular parado, a lo largo).
// Apuntar: tocar la mesa (el taco apunta hacia el dedo) y arrastrar para afinar (gira 1/4 de lo que el dedo rodea a la blanca); también flechas o A/D. Fuerza: jalar hacia abajo la barra de la
// derecha y soltar (o mantener Espacio). Efecto: tocar la bola chica. Bola en mano: arrastrar la blanca. Hoyo de la 8: tocar la tronera.
// Envuelve home() mientras está abierto. Estilos aquí mismo (b2-…), con los tokens de ui.css.
(function(){
if(!window.BFIS)return;
const FM=BFIS.M,R=FM.R,FL=FM.L,AN=FM.A,CW=FM.CW,RW=.12,MET=BFIS.EST.METIDA,PI=Math.PI,TAU=PI*2;
const I=n=>window.UI?UI.ico(n):'',es=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),r4=v=>Math.round(v*1e4)/1e4;
const NIV=['Fácil','Normal','Difícil'],LISAS=[1,2,3,4,5,6,7],RAYADAS=[9,10,11,12,13,14,15];
const COL=['#F4F0E6','#F2BE22','#2152B5','#D02B25','#6A3A9E','#EE7620','#1E8048','#8C2330','#141414'];
const col=i=>COL[i>8?i-8:i];
const CHEV=d=>`<svg class="ui-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d<0?'M15 5l-7 7 7 7':'M9 5l7 7-7 7'}"/></svg>`;
let g=false,V=null,hv=null,gente=[],err='',errT=0,busy=false,tm=0,tc=0,cola=[],hk='',visto=null,leftAt=0,menu=false;
let root,cv,cx,hud,ctl,tst,W=0,H=0,dpr=1,raf=0,land=false;
let ang=0,pot=0,ex=0,ey=0,hoyo=-1,bx=null,bz=null,turnoK='',rep=null,pend=null,drag=null,carga=null,fino=0,esp=0,lento=0,tPrev=0,toastT=0;
let niv=1;try{const s=localStorage.getItem('bil_niv'),k=s==null?-1:+s;if(k>=0&&k<=2)niv=k}catch(e){}
const ori=[];for(let i=0;i<16;i++)ori.push({n:[0,1,0],s:[1,0,0],x:null,z:null});
const ok=()=>!!(window.CASA3D&&CASA3D.myId);
const tres=()=>window.CASA3D&&CASA3D.on&&CASA3D.on();
const rr=()=>{if(typeof render=='function')render()};
const son=k=>{if(typeof sfx=='function')sfx(k)};
const yoId=()=>CASA3D.myId();
const B=(t,on,cls,x)=>`<button class="ui-btn${cls?' '+cls:''}" onclick="${on}"${x||''}>${t}</button>`;

// ---------- servidor ----------
async function tick(){if(!g||busy)return;if(tres())return cierra();busy=true;
 const b={id:yoId(),name:(typeof pname=='string'&&pname.trim())||'Jugador',av:window.AV&&AV.mio?AV.mio():'',x:0,z:0,yaw:0,w:0,f:'2d'};
 const m=cola.shift();if(m)b.bi=m;
 try{const d=await api('casa',b);if(g){gente=(d.p||[]).filter(p=>p.id!==b.id);
   if(d.bierr){err=d.bierr;errT=Date.now();if(m&&m.op==='tiro'&&rep&&rep.mio){rep=null;pend=null;hv=null}}
   estado(d.bi)}}catch(e){}
 busy=false;if(g&&cola.length)setTimeout(tick,20)}
function act(op,x){if(cola.length<8)cola.push(Object.assign({op},x||{}));son('tick');tick()}
function estado(v){if(!v)return;const ant=hv||V;V=v;leftAt=performance.now()+(v.left||0);
 const u=v.ult;
 if(!u)visto=0;
 else if(u.n!==visto){const prim=visto===null;visto=u.n;
  if(!prim){if(u.tiro){if(pend&&u.por===yoId()&&Math.abs(pend.a-u.tiro.a)<1e-6&&Math.abs(pend.v-u.tiro.v)<1e-6){pend=null;if(rep&&rep.mio)rep.u=u;else aviso(u)}
    else juega(u.E0,u.tiro,ant,u,false)}
   else aviso(u)}}
 if(visto===null)visto=0;
 const k=v.fase+':'+v.turno+':'+(v.ti?v.ti.join(''):'')+':'+v.n;if(k!==turnoK){turnoK=k;bx=bz=null;hoyo=-1;if(v.saque&&v.n===0)ang=0}
 pinta()}
function aviso(u){if(!u)return;const p=u.por;let t=u.msg||(u.fal?(u.fal==='Se acabó el tiempo'?'Se acabó el tiempo':'Falta: '+u.fal):'');
 if(!t&&u.sigue)t=(p===yoId()?'Sigues tirando':nomId(u.por)+' sigue tirando');
 if(!t&&u.met&&u.met.length)t=u.met.length==1?'Entró la '+u.met[0]:'Entraron '+u.met.length+' bolas';
 if(t)toast(t)}
function toast(t){if(!tst)return;tst.textContent=t;tst.classList.add('on');toastT=performance.now()+2600}
const nomId=id=>{if(!V)return '';for(const t of V.eq)for(const p of t)if(p&&p.id===id)return p.n;return ''};

// ---------- reglas que necesita la vista ----------
const vista=()=>hv||V;
const miTurno=()=>{const v=V;return !!v&&!rep&&v.fase==='juego'&&!!v.yo&&v.turno===v.yo[0]&&v.ti[v.turno]===v.yo[1]};
const tirador=v=>v&&v.turno>=0&&v.eq[v.turno]?v.eq[v.turno][v.ti[v.turno]]:null;
const grupo=(v,e)=>v.gr?(v.gr[e]==='l'?LISAS:RAYADAS):null;
function E(){const v=V;if(!v||!v.E)return null;const e=v.E.map(b=>b&&b.slice());
 if(miTurno()&&v.mano){if(bx==null)sitio(e);e[0]=[bx,bz]}return e}
function sitio(e){const coc=V.mano==='cocina';if(e[0]&&BFIS.libre(e,e[0][0],e[0][1],coc)){bx=e[0][0];bz=e[0][1];return}
 const x0=-FL/4;for(let k=0;k<60;k++)for(let s=-1;s<=1;s+=2){const z=s*k*R;for(let d=0;d<8;d++){const x=x0-d*R;if(BFIS.libre(e,x,z,coc)){bx=r4(x);bz=r4(z);return}}}
 bx=x0;bz=0}

// ---------- tiro ----------
function juega(E0,t,ant,u,mio){const res=BFIS.simula(E0,t);rep={res,t0:performance.now(),ne:0,u,mio,dur:res.dur};hv=ant||V;pot=0}
function tira(){if(!miTurno()||pot<.03){pot=0;return}
 const v=V;if(v.canta&&hoyo<0){pot=0;toast('Toca el hoyo donde va a entrar la 8');return}
 const e=E();if(!e||!e[0]){pot=0;return}
 if(v.mano){e[0]=[r4(bx),r4(bz)]}
 const t=BFIS.norma({a:ang,v:Math.max(.05,pot*pot*BFIS.A.vmax),ex,ey}),m={op:'tiro',a:t.a,v:t.v,ex:t.ex,ey:t.ey};
 if(v.mano){m.x=e[0][0];m.z=e[0][1]}if(v.canta)m.h=hoyo;
 cola.length=0;cola.push(m);pend={a:t.a,v:t.v};juega(e,t,V,null,true);tick()}
function finRep(){const u=rep.u;rep=null;hv=null;if(u)aviso(u);pinta()}

// ---------- pantalla ----------
function init(){root=document.createElement('div');root.id='b2root';root.className='b2';root.innerHTML=
 `<canvas></canvas><div class="ui b2-hud"></div><div class="ui b2-ctl">
  <div class="b2-ef" role="slider" aria-label="Efecto en la blanca" tabindex="0"><span class="b2-efb"><i></i></span><small>Efecto</small></div>
  <div class="b2-pow" aria-label="Fuerza: jala hacia abajo y suelta"><div class="b2-pw"><b></b><i></i></div><small>Jala</small></div></div>
  <div class="ui b2-toast" role="status" aria-live="polite"></div>`;
 document.body.appendChild(root);cv=root.querySelector('canvas');cx=cv.getContext('2d');hud=root.querySelector('.b2-hud');ctl=root.querySelector('.b2-ctl');tst=root.querySelector('.b2-toast');
 css();
 cv.addEventListener('pointerdown',pd);cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();vzZoom(VZ.z*Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top)},{passive:false});
 cv.addEventListener('contextmenu',e=>e.preventDefault());cv.addEventListener('dblclick',()=>{VZ.z=1;VZ.x=VZ.y=0});cv.addEventListener('pointermove',pm);cv.addEventListener('pointerup',pu);cv.addEventListener('pointercancel',pu);
 const ef=root.querySelector('.b2-efb'),efp=e=>{const r=ef.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*2-1,y=-((e.clientY-r.top)/r.height*2-1),m=Math.hypot(x,y);
  if(m<.18){ex=ey=0}else{const k=m>1?1/m:1;ex=Math.round(x*k*20)/20;ey=Math.round(y*k*20)/20}pintaEf()};
 ef.addEventListener('pointerdown',e=>{ef.setPointerCapture(e.pointerId);ef._d=1;efp(e)});ef.addEventListener('pointermove',e=>{if(ef._d)efp(e)});
 ef.addEventListener('pointerup',()=>{ef._d=0});ef.addEventListener('dblclick',()=>{ex=ey=0;pintaEf()});
 root.querySelectorAll('.b2-fino button').forEach(b=>{const d=+b.dataset.d;
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);fino=d;ang+=d*.002});
  const st=()=>{fino=0};b.addEventListener('pointerup',st);b.addEventListener('pointercancel',st)});
 const pw=root.querySelector('.b2-pow');
 pw.addEventListener('pointerdown',e=>{if(!miTurno())return;e.preventDefault();pw.setPointerCapture(e.pointerId);carga={y0:e.clientY,h:pw.getBoundingClientRect().height}});
 pw.addEventListener('pointermove',e=>{if(!carga)return;pot=cl((e.clientY-carga.y0)/(carga.h*.8),0,1)});
 pw.addEventListener('pointerup',()=>{if(!carga)return;carga=null;tira()});pw.addEventListener('pointercancel',()=>{carga=null;pot=0});
 document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);
 window.addEventListener('resize',()=>{if(g)pinta(true)})}
function css(){const s=document.createElement('style');s.textContent=`
html.b2don,html.b2don body{overflow:hidden;height:100%;overscroll-behavior:none}
.b2{position:fixed;inset:0;z-index:20;display:none;background:var(--ui-sheet);touch-action:none;-webkit-user-select:none;user-select:none}
html.b2don .b2{display:block}.b2 canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.b2-hud{position:absolute;inset:0;pointer-events:none}.b2-hud>*{pointer-events:auto}
.b2-top{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 8px);display:flex;flex-direction:column;align-items:center;gap:6px;padding:0 10px;pointer-events:none}
.b2-top>*{pointer-events:auto}.b2-r1{display:flex;gap:8px;align-items:center;justify-content:center;width:100%}.b2-r2{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.b2-r1 .ui-rb{position:absolute;left:10px}.b2-r1 .ui-rb.der{left:auto;right:10px}
html.b2land .b2-top{flex-direction:row;justify-content:center}html.b2land .b2-r1{width:auto}
.b2-turn{display:inline-flex;gap:8px;align-items:center;font-weight:800;min-height:40px}.b2-turn small{font-weight:700;color:var(--ui-sub)}.b2-turn.tu{background:var(--ui-accent);color:var(--ui-on)}.b2-turn.tu small{color:var(--ui-on);opacity:.85}
.b2-eq{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;background:var(--ui-panel);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow);font-size:13px;font-weight:800;color:var(--ui-text);max-width:min(46vw,300px)}
.b2-eq.on{border-color:var(--ui-accent);box-shadow:0 0 0 2px var(--ui-accent)}.b2-eq span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.b2-eq small{color:var(--ui-sub);font-weight:700}
.b2-bs{display:inline-flex;gap:2px}.b2-b{width:11px;height:11px;border-radius:50%;flex:none;box-shadow:inset 0 -1px 2px rgba(0,0,0,.35)}.b2-b.r{background:linear-gradient(#f4f0e6 26%,var(--c) 27% 73%,#f4f0e6 74%)!important}.b2-b.fu{opacity:.22}
.b2-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(420px,calc(100% - 28px));max-height:calc(100% - 28px);overflow:auto;padding:18px}
.b2-card h2{margin:0 0 4px;font-size:1.25em;display:flex;align-items:center;gap:8px}.b2-card .ui-lbl{display:block;margin:14px 0 6px}.b2-card .ui-seg{display:flex}.b2-card .ui-seg button{flex:1}
.b2-card .ui-btn{margin-top:8px}.b2-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--ui-line)}.b2-row b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.b2-row .ui-btn{margin:0;min-height:40px;padding:6px 14px}
.b2-big{font-size:1.5em;font-weight:800;margin:6px 0}.b2-acts{display:flex;gap:8px;flex-wrap:wrap}.b2-acts .ui-btn{flex:1}
.b2-card details{margin-top:12px;font-size:14px;color:var(--ui-sub)}.b2-card summary{cursor:pointer;font-weight:800;color:var(--ui-text);min-height:32px;display:flex;align-items:center}
.b2-teams{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.b2-team{border:1px solid var(--ui-line);border-radius:14px;padding:8px 10px;font-size:14px}.b2-team b{display:block;margin-bottom:4px}.b2-team div{color:var(--ui-sub)}
.b2-hint{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 98px);font-size:13px;font-weight:700;color:var(--ui-sub);text-align:center;width:calc(100% - 32px);pointer-events:none}
html.b2land .b2-hint{bottom:calc(env(safe-area-inset-bottom,0px) + 5px);width:auto;max-width:62%;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.b2-ctl{position:absolute;inset:0;pointer-events:none;display:none}.b2.tu .b2-ctl{display:block}.b2-ctl>*{pointer-events:auto;position:absolute}
.b2-ef{left:14px;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);display:flex;flex-direction:column;align-items:center;gap:2px;font-size:12px;font-weight:800;color:var(--ui-sub)}
.b2-efb{width:62px;height:62px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#e8e2d4 60%,#b9b2a2);box-shadow:var(--ui-shadow);position:relative;cursor:pointer;touch-action:none;border:1px solid var(--ui-line)}
.b2-efb:before,.b2-efb:after{content:'';position:absolute;background:rgba(0,0,0,.12)}.b2-efb:before{left:50%;top:8px;bottom:8px;width:1px}.b2-efb:after{top:50%;left:8px;right:8px;height:1px}
.b2-efb i{position:absolute;width:14px;height:14px;border-radius:50%;background:#C22B2B;left:50%;top:50%;margin:-7px 0 0 -7px;box-shadow:0 1px 2px rgba(0,0,0,.4)}
.b2-fino{left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 22px);display:flex;gap:14px}.b2-fino .ui-rb{width:52px;height:52px;touch-action:none}
.b2-pow{right:8px;top:calc(env(safe-area-inset-top,0px) + 108px);bottom:calc(env(safe-area-inset-bottom,0px) + 148px);width:48px;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px;font-weight:800;color:var(--ui-sub);touch-action:none;cursor:ns-resize}
.b2-pw{flex:1;width:22px;border-radius:999px;background:var(--ui-panel);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow);position:relative;overflow:hidden}
.b2-pw b{position:absolute;left:0;right:0;top:0;height:0;background:linear-gradient(#3F9E5A,#E0A530 60%,#D0402A)}.b2-pw i{position:absolute;left:3px;right:3px;top:0;height:28px;border-radius:999px;background:#C89A62;box-shadow:0 2px 4px rgba(0,0,0,.35)}
html.b2land .b2-ef{left:14px;top:calc(env(safe-area-inset-top,0px) + 70px);bottom:auto}html.b2land .b2-fino{left:12px;transform:none;top:calc(env(safe-area-inset-top,0px) + 168px);bottom:auto;flex-direction:column;gap:10px}
html.b2land .b2-pow{top:calc(env(safe-area-inset-top,0px) + 60px);bottom:calc(env(safe-area-inset-bottom,0px) + 12px)}
.b2-toast{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%) scale(.96);padding:10px 18px;border-radius:999px;background:var(--ui-panel);border:1px solid var(--ui-line);box-shadow:var(--ui-shadow);font-weight:800;font-size:16px;color:var(--ui-text);opacity:0;transition:opacity .2s,transform .2s;pointer-events:none;max-width:calc(100% - 40px);text-align:center}
.b2-toast.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
.b2-err{position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 110px);padding:8px 14px;border-radius:999px;background:var(--ui-text);color:var(--ui-sheet);font-weight:700;font-size:14px;max-width:calc(100% - 40px)}
.b2-menu{position:absolute;right:10px;top:calc(env(safe-area-inset-top,0px) + 58px);width:min(280px,calc(100% - 20px));padding:12px}.b2-menu .ui-btn{margin-top:6px}`;document.head.appendChild(s)}
function pintaEf(){const i=root&&root.querySelector('.b2-efb i');if(i)i.style.transform=`translate(${ex*22}px,${-ey*22}px)`}

// ---------- interfaz HTML ----------
function bolitas(v,e){const gs=grupo(v,e);if(!gs)return '';const E0=v.E||[],qu=gs.filter(i=>E0[i]).length;
 const ls=qu?gs:[8];return `<span class="b2-bs">${ls.map(i=>`<i class="b2-b${i>8?' r':''}${E0[i]?'':' fu'}" style="--c:${col(i)};background:${col(i)}"></i>`).join('')}</span>`}
function equipo(v,e){const t=v.eq[e]||[],yo=v.yo&&v.yo[0]===e,ns=t.map(p=>p?(p.id===yoId()?'Tú':es(p.n)):'libre').join(' y ');
 const gr=v.gr?(v.gr[e]==='l'?'Lisas':'Rayadas'):v.fase==='juego'&&!v.saque?'Mesa abierta':'';const on=v.fase==='juego'&&v.turno===e;
 return `<span class="b2-eq${on?' on':''}"><span>${ns}${yo&&t.length>1?'':''}</span>${gr?`<small>${gr}</small>`:''}${bolitas(v,e)}</span>`}
function firma(){const v=vista();if(!v)return 'x';return [v.fase,v.turno,v.ti&&v.ti.join(),v.gr&&v.gr.join(),v.n,v.mano,v.canta,v.inv,JSON.stringify(v.eq),v.E&&v.E.map(b=>b?1:0).join(''),
 v.yo&&v.yo.join(),miTurno(),!!rep,menu,niv,err,gente.map(p=>p.id+p.name).join(),hoyo<0,v.gana,v.saque].join('|')}
function htmlHud(){const v=vista();if(!v)return `<div class="ui-card b2-card"><p>Abriendo la mesa…</p></div>`;
 const e=err?`<div class="b2-err" role="alert">${es(err)}</div>`:'';
 if(v.fase==='juego'||(v.fase==='fin'&&rep)){const p=tirador(v),tu=miTurno(),bot=p&&p.bot;
  const t=tu?'Tu tiro':p?(es(p.n)+(bot?' piensa…':' tira')):'';
  const top=`<div class="b2-top"><div class="b2-r1"><button class="ui-rb" onclick="B2D.menu()" aria-label="Menú">${I('menu')}</button>
   <span class="ui-pill b2-turn${tu?' tu':''}">${rep?'Ruedan las bolas':t}${!rep&&!bot?` <small id="b2left"></small>`:''}</span></div>
   <div class="b2-r2">${equipo(v,0)}${equipo(v,1)}</div></div>`;
  let h='';if(tu){h=v.canta&&hoyo<0?'Toca el hoyo donde va a entrar la 8':v.mano?'Arrastra la blanca para acomodarla; toca la mesa para apuntar':v.saque?'Saque: apunta al triángulo y jala fuerte la barra':'Toca la mesa para apuntar, arrastra para afinar y jala la barra para tirar'}
  else if(!v.yo&&!rep)h='Estás mirando esta partida';
  const mn=menu?`<div class="ui ui-card b2-menu">${UI.temaSw?`<div class="ui-row"><span>Modo oscuro</span>${UI.temaSw("void 0")}</div>`:''}${v.yo?B(I('salir')+'Abandonar la partida','B2D.sale()','sec full'):B(I('salir')+'Volver al inicio','B2D.cierra()','sec full')}${window.BIEN?B(I('pantalla')+'Volver al 3D','BIEN.a3();B2D.cierra()','sec full'):''}${B('Seguir jugando','B2D.menu()','ghost full')}</div>`:'';
  return top+(h?`<div class="b2-hint">${h}</div>`:'')+e+mn}
 if(v.fase==='fin')return fin(v)+e;
 if(v.fase==='arma')return arma(v)+e;
 return libre()+e}
const regla=`<details><summary>${I('ayuda')}&nbsp;Cómo se juega</summary>Bola 8: un equipo mete las lisas (1 a 7) y el otro las rayadas (9 a 15); la primera bola que entra sin falta después del saque decide quién va con cuáles.
 Sigues tirando mientras metas una tuya. Al terminar las tuyas, canta el hoyo y mete la 8 ahí para ganar. Es falta meter la blanca, no tocar nada o tocar primero una que no es tuya: el rival pone la blanca detrás de la línea. Meter la 8 antes de tiempo, con falta o en otro hoyo: pierdes. Tienes 45 segundos por tiro.</details>`;
function libre(){const gs=gente.slice(0,8);
 return `<div class="ui ui-card b2-card"><h2>${I('jugar')}Billar · Bola 8</h2><p class="ui-sub">Mesa de 9 pies del sótano.</p>
 <span class="ui-lbl">Contra la computadora</span><div class="ui-seg" role="radiogroup" aria-label="Nivel">${NIV.map((n,i)=>`<button class="${i===niv?'on':''}" role="radio" aria-checked="${i===niv}" onclick="B2D.niv(${i})">${n}</button>`).join('')}</div>
 ${B(I('jugar')+'Jugar contra la computadora',`B2D.act('retar',{modo:1,bot:1,niv:${niv}})`,'full')}
 <span class="ui-lbl">Con alguien de la casa</span>${gs.length?gs.map(p=>`<div class="b2-row"><b>${es(p.name)}</b>${B('Retar',`B2D.act('retar',{modo:1,a:'${es(p.id)}',niv:${niv}})`,'sec')}</div>`).join(''):'<p class="ui-sub">No hay nadie más en la casa ahorita.</p>'}
 ${B(I('gente')+'Armar 2 contra 2',`B2D.act('retar',{modo:2,niv:${niv}})`,'sec full')}<p class="ui-sub">En 2 contra 2 los lugares que nadie tome los llenan bots.</p>
 ${B(I('salir')+'Volver','B2D.cierra()','ghost full')}${regla}</div>`}
function arma(v){const org=v.eq[0][0],secs=`<span id="b2left"></span>`;
 const teams=`<div class="b2-teams">${[0,1].map(e=>`<div class="b2-team"><b>Equipo ${e+1}</b>${v.eq[e].map(p=>`<div>${p?es(p.n)+(p.id===yoId()?' (tú)':''):'libre'}</div>`).join('')}${!v.yo&&!v.inv&&v.eq[e].includes(null)?B('Unirme',`B2D.act('unir',{e:${e}})`,'sec full'):''}</div>`).join('')}</div>`;
 if(v.yo){if(v.modo===1){const a=gente.find(p=>p.id===v.inv);return `<div class="ui ui-card b2-card"><h2>${I('jugar')}Reto enviado</h2><p>Esperando a <b>${es(a?a.name:'tu rival')}</b>… ${secs}</p><div class="b2-acts">${B('Cancelar',"B2D.act('salir')",'sec')}</div></div>`}
  return `<div class="ui ui-card b2-card"><h2>${I('gente')}2 contra 2</h2><p class="ui-sub">Esperando gente ${secs}</p>${teams}<div class="b2-acts">${v.org===yoId()?B(I('jugar')+'Empezar',"B2D.act('empezar')"):''}${B('Cancelar',"B2D.act('salir')",'sec')}</div></div>`}
 if(v.inv===yoId())return `<div class="ui ui-card b2-card"><h2>${I('jugar')}Te retan</h2><p><b>${es(org&&org.n)}</b> te reta a una partida de Bola 8. ${secs}</p><div class="b2-acts">${B(I('jugar')+'Jugar',"B2D.act('unir')")}${B('Ahora no',"B2D.act('rechazar')",'sec')}</div></div>`;
 if(!v.inv)return `<div class="ui ui-card b2-card"><h2>${I('gente')}2 contra 2</h2><p><b>${es(org&&org.n)}</b> arma una partida.</p>${teams}<div class="b2-acts">${B(I('salir')+'Volver','B2D.cierra()','ghost')}</div></div>`;
 return `<div class="ui ui-card b2-card"><h2>Billar</h2><p class="ui-sub">La mesa está apartada.</p>${B(I('salir')+'Volver','B2D.cierra()','ghost full')}</div>`}
function fin(v){const g0=v.gana,nm=e=>v.eq[e].map(p=>p&&es(p.n)).join(' y ');
 const t=v.yo?(v.yo[0]===g0?'Ganaste':'Perdiste'):`Ganó ${nm(g0)}`;
 return `<div class="ui ui-card b2-card"><h2>${I('jugar')}Bola 8</h2><div class="b2-big">${t}</div><p class="ui-sub">${es(v.por||'')}</p>
 <div class="b2-acts">${v.yo?B(I('nuevo')+'Revancha',"B2D.act('revancha')"):''}${B(I('salir')+'Salir',v.yo?'B2D.sale()':'B2D.cierra()','sec')}</div></div>`}

function pinta(fz){if(!g||!root)return;const k=firma();if(k!==hk||fz){hk=k;hud.innerHTML=htmlHud();cuenta()}
 root.classList.toggle('tu',miTurno())}
function cuenta(){const el=document.getElementById('b2left');if(!el||!V)return;const s=Math.max(0,Math.ceil((leftAt-performance.now())/1000));
 const t=s+' s';if(el.textContent!==t)el.textContent=t}

// ---------- mesa en el lienzo ----------
let T={s:1,rot:false,cx:0,cy:0};
function talla(){const w=root.clientWidth,h=root.clientHeight,d=Math.min(2,window.devicePixelRatio||1);
 if(w!==W||h!==H||d!==dpr){W=w;H=h;dpr=d;cv.width=Math.round(w*d);cv.height=Math.round(h*d)}
 land=W>H*1.15;document.documentElement.classList.toggle('b2land',land);
 const j=V&&V.fase==='juego',x0=land?(j?92:12):10,x1=W-(j?64:10),y0=land?(j?60:12):(j?112:14),y1=H-(land?(j?30:12):(j?150:14));
 const aw=Math.max(50,x1-x0),ah=Math.max(50,y1-y0),hx=FL/2+CW+RW,hz=AN/2+CW+RW,rot=ah>aw*1.05;
 const s=rot?Math.min(aw/(2*hz),ah/(2*hx)):Math.min(aw/(2*hx),ah/(2*hz));VZ.bx=x0+aw/2;VZ.by=y0+ah/2;vzLim();T={s:s*VZ.z,rot,cx:VZ.bx+VZ.x,cy:VZ.by+VZ.y}}
// vista movible como en 3D: dos dedos acercan y mueven; rueda acerca; un dedo la mueve cuando no es tu tiro; doble toque la regresa
const VZ={z:1,x:0,y:0,bx:0,by:0},dd=new Map();let gs=null;
function vzLim(){const mx=W*(VZ.z-1)/2,my=H*(VZ.z-1)/2;VZ.x=cl(VZ.x,-mx,mx);VZ.y=cl(VZ.y,-my,my)}
function vzZoom(z,px,py){z=cl(z,1,3.2);const k=z/VZ.z,cx=VZ.bx+VZ.x,cy=VZ.by+VZ.y;VZ.x=px-(px-cx)*k-VZ.bx;VZ.y=py-(py-cy)*k-VZ.by;VZ.z=z;vzLim()}
function gsIni(){const p=[...dd.values()];if(!p.length){gs=null;return}const a=p[0],b=p[1]||a;gs={d:Math.hypot(a.x-b.x,a.y-b.y)||1,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,z:VZ.z,dos:p.length>1}}
function gsMueve(){const p=[...dd.values()];if(!gs||!p.length)return;const a=p[0],b=p[1]||a,cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,r=cv.getBoundingClientRect();
 VZ.x+=cx-gs.cx;VZ.y+=cy-gs.cy;gs.cx=cx;gs.cy=cy;if(gs.dos&&p.length>1)vzZoom(gs.z*Math.hypot(a.x-b.x,a.y-b.y)/gs.d,cx-r.left,cy-r.top);else vzLim()}
const aS=(x,z)=>T.rot?[T.cx+z*T.s,T.cy-x*T.s]:[T.cx+x*T.s,T.cy+z*T.s];
const dS=(x,z)=>T.rot?[z,-x]:[x,z];
const aW=(sx,sy)=>T.rot?[(T.cy-sy)/T.s,(sx-T.cx)/T.s]:[(sx-T.cx)/T.s,(sy-T.cy)/T.s];
function tokens(){const cs=getComputedStyle(document.documentElement);return {bg:cs.getPropertyValue('--ui-sheet').trim()||'#2A1D16'}}
let TK=null,tkT=0;
function frame(now){raf=0;if(!g)return;raf=requestAnimationFrame(frame);const dt=tPrev?Math.min(.05,(now-tPrev)/1000):0;tPrev=now;
 if(!TK||now-tkT>1500){TK=tokens();tkT=now}
 talla();const c=cx;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
 if(fino&&miTurno())ang+=fino*dt*(lento?.06:.25);
 if(esp===2&&miTurno()){pot=cl(pot+dt/1.3,0,1)}
 mesa();
 let t=0;const st=[];
 if(rep){t=(now-rep.t0)/1000;const ev=rep.res.ev;while(rep.ne<ev.length&&ev[rep.ne].t<=t){const e=ev[rep.ne++];if(window.BSON)try{BSON.ev(e)}catch(_){}else if(e.k==='tronera')son('card')}
  rep.o=rep.o||[];for(let i=0;i<16;i++)st.push(rep.o[i]=BFIS.en(rep.res,i,Math.min(t,rep.dur),rep.o[i]))}
 const e=rep?null:E();
 if(!rep&&miTurno()&&e&&e[0])guia(e);
 for(let i=15;i>=0;i--){let x,z,k=1;
  if(rep){const s=st[i];if(s.s===MET){const tm=t-s.t0;if(tm>.35||!(s.p>=0))continue;const P=FM.P[s.p],f=cl(tm/.35,0,1);x=s.x+(P.x-s.x)*f;z=s.z+(P.z-s.z)*f;k=1-f*.6}else{x=s.x;z=s.z}}
  else{if(!e||!e[i])continue;x=e[i][0];z=e[i][1]}
  rueda(i,x,z);bola(i,x,z,k)}
 if(!rep&&miTurno()&&e&&e[0])taco(e[0],now);
 if(rep&&t>rep.dur+.25)finRep();
 if(tst&&toastT&&now>toastT){toastT=0;tst.classList.remove('on')}
 if(err&&Date.now()-errT>4500){err='';pinta()}
 const pb=root.querySelector('.b2-pw');if(pb){const h=pb.clientHeight;pb.firstChild.style.height=(pot*100)+'%';pb.lastChild.style.top=(pot*(h-28))+'px'}
}

function mesa(){const c=cx,s=T.s,hx=FL/2+CW+RW,hz=AN/2+CW+RW;
 // madera
 const [ax,ay]=aS(-hx,-hz),[bx2,by2]=aS(hx,hz),x=Math.min(ax,bx2),y=Math.min(ay,by2),w=Math.abs(bx2-ax),h=Math.abs(by2-ay);
 c.save();c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=24;c.shadowOffsetY=10;c.fillStyle='#5b3219';rrect(x,y,w,h,RW*s*.6);c.fill();c.restore();
 let gr=c.createLinearGradient(x,y,x+w,y+h);gr.addColorStop(0,'#7a4626');gr.addColorStop(.5,'#5e3419');gr.addColorStop(1,'#4a2812');c.fillStyle=gr;rrect(x,y,w,h,RW*s*.6);c.fill();
 c.strokeStyle='rgba(255,220,170,.18)';c.lineWidth=1.5;rrect(x+3,y+3,w-6,h-6,RW*s*.5);c.stroke();
 // paño (hasta el fondo de las bandas)
 const [px,py]=aS(-(FL/2+CW),-(AN/2+CW)),[qx,qy]=aS(FL/2+CW,AN/2+CW);gr=c.createRadialGradient((px+qx)/2,(py+qy)/2,10,(px+qx)/2,(py+qy)/2,Math.max(w,h)*.6);
 gr.addColorStop(0,'#2f8a55');gr.addColorStop(1,'#1d6139');c.fillStyle=gr;c.fillRect(Math.min(px,qx),Math.min(py,qy),Math.abs(qx-px),Math.abs(qy-py));
 // bandas
 c.fillStyle='#17532f';for(const b of FM.BANDAS){c.beginPath();b.forEach(([bx3,bz3],k)=>{const [sx,sy]=aS(bx3,bz3);k?c.lineTo(sx,sy):c.moveTo(sx,sy)});c.closePath();c.fill()}
 c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1;for(const b of FM.BANDAS){const [a1,a2]=aS(b[0][0],b[0][1]),[b1,b2]=aS(b[1][0],b[1][1]);c.beginPath();c.moveTo(a1,a2);c.lineTo(b1,b2);c.stroke()}
 // diamantes
 c.fillStyle='#efe2c4';for(let k=-3;k<=3;k++){if(k%4===0)continue;for(const sz of [-1,1]){const [dx,dy]=aS(k*FL/8,sz*(AN/2+CW+RW*.5));dia(dx,dy,s*.012)}}
 for(const k of [-1,1])for(const sx of [-1,1]){const [dx,dy]=aS(sx*(FL/2+CW+RW*.5),k*AN/4);dia(dx,dy,s*.012)}
 for(const sx of [-1,1]){const [dx,dy]=aS(sx*(FL/2+CW+RW*.5),0);dia(dx,dy,s*.012)}
 // línea de cabeza, punto de pie y la cocina si hay bola en mano
 const v=V;if(v&&miTurno()&&v.mano==='cocina'){const [k1,k2]=aS(-FL/2,-AN/2),[k3,k4]=aS(-FL/4,AN/2);c.fillStyle='rgba(255,255,255,.07)';c.fillRect(Math.min(k1,k3),Math.min(k2,k4),Math.abs(k3-k1),Math.abs(k4-k2))}
 const [h1,h2]=aS(-FL/4,-AN/2),[h3,h4]=aS(-FL/4,AN/2);c.strokeStyle='rgba(255,255,255,.16)';c.lineWidth=1;c.beginPath();c.moveTo(h1,h2);c.lineTo(h3,h4);c.stroke();
 for(const p of [FM.pie,FM.cabeza]){const [fx,fy]=aS(p[0],p[1]);c.fillStyle='rgba(255,255,255,.28)';c.beginPath();c.arc(fx,fy,Math.max(1.5,s*.006),0,TAU);c.fill()}
 // troneras
 const canta=v&&miTurno()&&v.canta,now=performance.now();
 FM.P.forEach((p,i)=>{const [sx,sy]=aS(p.x,p.z),r=p.r*s;c.fillStyle='#0c0907';c.beginPath();c.arc(sx,sy,r,0,TAU);c.fill();
  c.strokeStyle='#2a1a10';c.lineWidth=Math.max(2,r*.22);c.beginPath();c.arc(sx,sy,r*1.08,0,TAU);c.stroke();
  if(canta){const on=i===hoyo,pul=.5+.5*Math.sin(now/200);c.strokeStyle=on?'#ffd27a':`rgba(255,255,255,${.35+.4*pul})`;c.lineWidth=on?4:2.5;c.beginPath();c.arc(sx,sy,r*1.5,0,TAU);c.stroke();
   if(on){c.fillStyle='#ffd27a';c.font=`900 ${Math.round(r*1.1)}px Nunito,system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';const [ox,oy]=dS(p.ox||0,p.oz||0);c.fillText('8',sx-ox*r*2.4,sy-oy*r*2.4)}}})}
function dia(x,y,r){const c=cx;r=Math.max(2,r);c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r*.7,y);c.lineTo(x,y+r);c.lineTo(x-r*.7,y);c.closePath();c.fill()}
function rrect(x,y,w,h,r){const c=cx;r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}

// giro de cada bola al rodar (para que el número y la raya se muevan)
function rot(v,k,a){const c=Math.cos(a),s=Math.sin(a),d=k[0]*v[0]+k[1]*v[1]+k[2]*v[2],x=k[1]*v[2]-k[2]*v[1],y=k[2]*v[0]-k[0]*v[2],z=k[0]*v[1]-k[1]*v[0];
 return [v[0]*c+x*s+k[0]*d*(1-c),v[1]*c+y*s+k[1]*d*(1-c),v[2]*c+z*s+k[2]*d*(1-c)]}
function rueda(i,x,z){const o=ori[i];if(o.x==null){o.x=x;o.z=z;return}const dx=x-o.x,dz=z-o.z,d=Math.hypot(dx,dz);o.x=x;o.z=z;if(d<1e-7||d>4*R)return;
 const k=[dz/d,0,-dx/d],a=d/R;o.n=rot(o.n,k,a);o.s=rot(o.s,k,a)}
function bola(i,x,z,k){const c=cx,[sx,sy]=aS(x,z),r=R*T.s*k,o=ori[i];
 c.fillStyle='rgba(0,0,0,.32)';c.beginPath();c.ellipse(sx+r*.22,sy+r*.3,r,r*.9,0,0,TAU);c.fill();
 c.save();c.beginPath();c.arc(sx,sy,r,0,TAU);c.clip();
 c.fillStyle=i>8?'#F4F0E6':col(i);c.fillRect(sx-r,sy-r,2*r,2*r);
 if(i>8){// la raya: el círculo máximo perpendicular al eje s, visto desde arriba es una elipse
  const [ux,uy]=dS(o.s[0],o.s[2]),py=o.s[1];c.save();c.translate(sx,sy);c.rotate(Math.atan2(uy,ux));
  c.strokeStyle=col(i);c.lineWidth=r*1.05;c.beginPath();c.ellipse(0,0,Math.max(.01,r*Math.abs(py)),r,0,0,TAU);c.stroke();c.restore()}
 // número (o el punto rojo de la blanca)
 const [nx,ny]=dS(o.n[0],o.n[2]),up=o.n[1];
 if(up>-.15){const f=Math.max(0,up),rd=r*(i?.42:.16),cxn=sx+nx*r*.82,cyn=sy+ny*r*.82;c.save();c.translate(cxn,cyn);c.rotate(Math.atan2(ny,nx));c.scale(.25+.75*f,1);
  c.fillStyle=i?'#F8F5EC':'#C22B2B';c.beginPath();c.arc(0,0,rd,0,TAU);c.fill();c.restore();
  if(i&&f>.45&&r>5){c.fillStyle='#1a1a1a';c.font=`900 ${Math.round(r*.62)}px Nunito,system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.globalAlpha=cl((f-.45)/.3,0,1);c.fillText(String(i),cxn,cyn+r*.04);c.globalAlpha=1}}
 const gl=c.createRadialGradient(sx-r*.35,sy-r*.4,r*.05,sx,sy,r*1.05);gl.addColorStop(0,'rgba(255,255,255,.55)');gl.addColorStop(.35,'rgba(255,255,255,0)');gl.addColorStop(1,'rgba(0,0,0,.38)');
 c.fillStyle=gl;c.fillRect(sx-r,sy-r,2*r,2*r);c.restore()}

// guía: hasta la primera bola (bola fantasma), hacia dónde sale esa bola y hacia dónde se desvía la blanca
function guia(e){const c=cx,b0=e[0],dx=Math.cos(ang),dz=Math.sin(ang),hx=FL/2-R,hz=AN/2-R;let t=1e9,bi=-1;
 for(let i=1;i<16;i++){const b=e[i];if(!b)continue;const px=b[0]-b0[0],pz=b[1]-b0[1],pr=px*dx+pz*dz;if(pr<=0)continue;const d2=px*px+pz*pz-pr*pr;if(d2>=4*R*R)continue;const ti=pr-Math.sqrt(4*R*R-d2);if(ti<t){t=ti;bi=i}}
 let tb=1e9,nx=0,nz=0;if(dx>1e-9){const q=(hx-b0[0])/dx;if(q<tb){tb=q;nx=1}}if(dx<-1e-9){const q=(-hx-b0[0])/dx;if(q<tb){tb=q;nx=1;nz=0}}
 if(dz>1e-9){const q=(hz-b0[1])/dz;if(q<tb){tb=q;nx=0;nz=1}}if(dz<-1e-9){const q=(-hz-b0[1])/dz;if(q<tb){tb=q;nx=0;nz=1}}
 const lin=(ax,az,bx3,bz3,al,dash)=>{const [p1,p2]=aS(ax,az),[q1,q2]=aS(bx3,bz3);c.strokeStyle=`rgba(255,255,255,${al})`;c.lineWidth=1.6;c.setLineDash(dash||[]);c.beginPath();c.moveTo(p1,p2);c.lineTo(q1,q2);c.stroke();c.setLineDash([])};
 const malo=bi>=0&&t<tb&&!legal(bi);
 if(bi>=0&&t<tb){const gx=b0[0]+dx*t,gz=b0[1]+dz*t,b=e[bi];lin(b0[0],b0[1],gx,gz,.75);
  const [g1,g2]=aS(gx,gz);c.strokeStyle=malo?'rgba(255,120,100,.9)':'rgba(255,255,255,.8)';c.lineWidth=1.5;c.beginPath();c.arc(g1,g2,R*T.s,0,TAU);c.stroke();
  if(malo){c.beginPath();c.moveTo(g1-R*T.s*.6,g2-R*T.s*.6);c.lineTo(g1+R*T.s*.6,g2+R*T.s*.6);c.stroke()}
  let ox=b[0]-gx,oz=b[1]-gz;const on=Math.hypot(ox,oz)||1;ox/=on;oz/=on;const pr=dx*ox+dz*oz;
  lin(b[0],b[1],b[0]+ox*(.12+.5*pr),b[1]+oz*(.12+.5*pr),.7);
  const tx=dx-pr*ox,tz=dz-pr*oz,tl=Math.hypot(tx,tz);if(tl>.02)lin(gx,gz,gx+tx/tl*.32*tl,gz+tz/tl*.32*tl,.4,[4,4])}
 else{const gx=b0[0]+dx*tb,gz=b0[1]+dz*tb;lin(b0[0],b0[1],gx,gz,.6);const rx=nx?-dx:dx,rz=nz?-dz:dz;lin(gx,gz,gx+rx*.3,gz+rz*.3,.35,[4,4])}}
function legal(i){const v=V;if(!v||v.saque)return true;const gs=grupo(v,v.turno);if(!gs)return i!==8;const qu=gs.filter(k=>v.E[k]).length;return qu?gs.includes(i):i===8}
function taco(b0,now){const c=cx,dx=Math.cos(ang),dz=Math.sin(ang),atras=R*1.6+pot*.32,lg=1.2;
 const j=pot>.85?(pot-.85)/.15:0,jt=j*R*.15*Math.sin(now*.09);
 const ax=b0[0]-dx*atras-dz*jt,az=b0[1]-dz*atras+dx*jt,bx3=ax-dx*lg,bz3=az-dz*lg;const [p1,p2]=aS(ax,az),[q1,q2]=aS(bx3,bz3);
 const s=T.s;c.lineCap='round';c.strokeStyle='rgba(0,0,0,.28)';c.lineWidth=Math.max(4,s*.024);c.beginPath();c.moveTo(p1+3,p2+4);c.lineTo(q1+3,q2+4);c.stroke();
 const gr=c.createLinearGradient(p1,p2,q1,q2);gr.addColorStop(0,'#eef0f2');gr.addColorStop(.02,'#eef0f2');gr.addColorStop(.025,'#d8b07a');gr.addColorStop(.62,'#c08a52');gr.addColorStop(.64,'#2a1a10');gr.addColorStop(1,'#1a0f08');
 c.strokeStyle=gr;c.lineWidth=Math.max(3,s*.02);c.beginPath();c.moveTo(p1,p2);c.lineTo(q1,q2);c.stroke();c.lineCap='butt'}

// ---------- toques sobre la mesa ----------
function mundo(e){const r=cv.getBoundingClientRect();return aW(e.clientX-r.left,e.clientY-r.top)}
function pd(e){menu&&(menu=false,pinta());dd.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(dd.size>1||!miTurno()||e.button===1||e.button===2){if(drag&&drag.a0!=null)ang=drag.a0;drag=null;try{cv.setPointerCapture(e.pointerId)}catch(_){}gsIni();return}const [x,z]=mundo(e),v=V,es0=E();if(!es0)return;
 if(v.canta){let b=-1,bd=1e9;FM.P.forEach((p,i)=>{const d=Math.hypot(p.x-x,p.z-z);if(d<Math.max(p.r*2.2,30/T.s)&&d<bd){bd=d;b=i}});if(b>=0){hoyo=b;son('tick');pinta();return}}
 cv.setPointerCapture(e.pointerId);
 if(v.mano&&es0[0]&&Math.hypot(es0[0][0]-x,es0[0][1]-z)<Math.max(R*2.5,26/T.s)){drag={t:'bola'};return}
 const a0=ang;apunta(x,z,es0);drag={a0,t:'apunta',sx:e.clientX,sy:e.clientY,fa:rodea(x,z,es0),fino:false}}
function pm(e){const q=dd.get(e.pointerId);if(q){q.x=e.clientX;q.y=e.clientY}if(gs){gsMueve();return}if(!drag||!miTurno())return;const [x,z]=mundo(e);
 if(drag.t==='bola'){const es0=V.E.map(b=>b&&b.slice());const coc=V.mano==='cocina';const xx=cl(x,-FL/2+R,coc?-FL/4:FL/2-R),zz=cl(z,-AN/2+R,AN/2-R);if(BFIS.libre(es0,xx,zz,coc)){bx=xx;bz=zz}return}
 // tocar apunta hacia el dedo; si después arrastra, afina: el taco gira a 1/4 de lo que el dedo rodea a la blanca (como en 3D)
 const es0=E();if(!drag.fino&&Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>8)drag.fino=true;if(!drag.fino)return;
 const fa=rodea(x,z,es0);if(fa==null||drag.fa==null){drag.fa=fa;return}let d=fa-drag.fa;d=Math.atan2(Math.sin(d),Math.cos(d));drag.fa=fa;ang+=d*.25}
function rodea(x,z,es0){const b=es0&&es0[0];if(!b||Math.hypot(x-b[0],z-b[1])<R*1.5)return null;return Math.atan2(z-b[1],x-b[0])}
function pu(e){drag=null;if(e&&dd.delete(e.pointerId)&&gs)gsIni()}
function apunta(x,z,es0){const b=es0&&es0[0];if(!b)return;const dx=x-b[0],dz=z-b[1];if(Math.hypot(dx,dz)<R*1.2)return;ang=Math.atan2(dz,dx)}
function kd(e){if(!g||/input|textarea|select/i.test((e.target&&e.target.tagName)||''))return;if(!miTurno())return;
 const k=e.key;if(k==='ArrowLeft'||k==='a'||k==='A'){fino=-1;lento=e.shiftKey;e.preventDefault()}else if(k==='ArrowRight'||k==='d'||k==='D'){fino=1;lento=e.shiftKey;e.preventDefault()}
 else if(k===' '){e.preventDefault();if(!e.repeat){pot=0;esp=2}}}
function ku(e){const k=e.key;if(['ArrowLeft','ArrowRight','a','A','d','D'].includes(k))fino=0;if(k===' '&&esp===2){esp=0;tira()}}

// ---------- abrir y cerrar ----------
function abre(){if(!ok())return;if(!root)init();g=true;hk='';err='';visto=null;V=null;hv=null;rep=null;pend=null;menu=false;cola=[];
 document.documentElement.classList.add('b2don');clearInterval(tm);clearInterval(tc);tm=setInterval(tick,700);tc=setInterval(cuenta,250);pintaEf();tick();pinta(true);if(!raf){tPrev=0;raf=requestAnimationFrame(frame)}rr()}
async function sale(){menu=false;cola=[{op:'salir'}];son('tick');busy=false;await tick()}
async function cierra(){if(!g)return;if(V&&V.yo&&!tres()){cola=[{op:'salir'}];busy=false;await tick()}
 g=false;clearInterval(tm);clearInterval(tc);if(raf)cancelAnimationFrame(raf);raf=0;rep=null;document.documentElement.classList.remove('b2don','b2land');hk='';rr()}

window.B2D={abre,cierra,sale,act,ok:()=>ok()&&!tres(),on:()=>g,v:()=>V,
 niv:i=>{niv=i;try{localStorage.setItem('bil_niv',String(i))}catch(e){}son('tick');pinta()},
 menu:()=>{menu=!menu;son('tick');pinta()}};
const h0=window.home;window.home=function(){return g?'<div class="lb"></div>':h0.apply(this,arguments)};
})();
