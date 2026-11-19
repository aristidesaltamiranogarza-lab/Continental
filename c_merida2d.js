// Mérida en Venta 2D: tablero plano (Menta u Oscuro) con zoom (pellizco, rueda, botones), arrastre, fichas que avanzan casilla por casilla
// y una flecha que rebota encima de cada ficha. Lo maneja c_meridaui.js como window.M2 (show, layout, theme, follow, sync, cam, look).
// Mismas coordenadas que el 3D: tablero de 12x12 unidades, esquinas de 1.5, la Salida abajo a la derecha. NO cambia reglas ni servidor.
(function(){
if(!window.MR){console.warn('Mérida 2D: falta c_merida.js');return}
const D=MR.D,B=MR.B,HOP=180,KMAX=4;
let root,wrap,brd,diceEl,potEl,ready=false,shown=false,S0=0,ins={t:0,r:0,b:0,l:0},fol=true,raf=0,dynKey='',selI=-2,rollN=-1,G0=null,back=null,touched=false,lastTap=0;
const vw={x:0,y:0,k:1},vt={x:0,y:0,k:1},cells=[],toks=[],shownPos=[],anim=[],ptr=new Map();
const icon=s=>MIC.s(s);
function cpos(i){if(i==0)return[5.25,5.25];if(i<10)return[5-i,5.25];if(i==10)return[-5.25,5.25];if(i<20)return[-5.25,5-(i-10)];
 if(i==20)return[-5.25,-5.25];if(i<30)return[-5+(i-20),-5.25];if(i==30)return[5.25,-5.25];return[5.25,-5+(i-30)]}
const side=i=>Math.floor(i/10)%4,pct=v=>(v+6)/12*100+'%';
const HOUSE='<svg viewBox="0 0 10 10"><path d="M1 5.2 5 1.5l4 3.7V9.3H1z" fill="#2e9e57" stroke="#0b3a1f" stroke-width=".9" stroke-linejoin="round"/><path d="M4.1 9.3V6.6h1.8v2.7" fill="#0b3a1f"/></svg>';
const HOTEL='<svg viewBox="0 0 16 10"><path d="M1 3.4h14v5.9H1z" fill="#d32f2f" stroke="#5a0f0f" stroke-width=".9"/><path d="M.6 3.6 2.8 1h10.4l2.2 2.6z" fill="#9f1c1c" stroke="#5a0f0f" stroke-width=".9" stroke-linejoin="round"/><path d="M3 9.3V7.2a1.1 1.1 0 0 1 2.2 0v2.1M6.9 9.3V7.2a1.1 1.1 0 0 1 2.2 0v2.1M10.8 9.3V7.2a1.1 1.1 0 0 1 2.2 0v2.1" fill="#fff3e0"/></svg>';
const ARROW='<svg viewBox="0 0 20 26"><path d="M6 1.5h8v10.5h4.6L10 24.5 1.4 12H6z" fill="var(--pc)" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>';
const PIPS={1:[[12,12]],2:[[7,7],[17,17]],3:[[6.5,6.5],[12,12],[17.5,17.5]],4:[[7,7],[17,7],[7,17],[17,17]],5:[[6.5,6.5],[17.5,6.5],[12,12],[6.5,17.5],[17.5,17.5]],6:[[7,6],[17,6],[7,12],[17,12],[7,18],[17,18]]};
const die=n=>`<svg viewBox="0 0 24 24"><rect x="1.2" y="1.2" width="21.6" height="21.6" rx="5" fill="#fff" stroke="#18201b" stroke-width="1.6"/>${(PIPS[n]||[]).map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${n==1?3:2.3}" fill="${n==1?'#d7261e':'#18201b'}"/>`).join('')}</svg>`;
// tamaño de letra de cada nombre: que la palabra más larga quepa a lo ancho de la casilla (en unidades del tablero)
const mc=document.createElement('canvas').getContext('2d');
function fit(i){const s=B[i],sd=side(i),cor=i%10==0,w=(cor?1.5:sd%2?1.5:1)-(s.t=='p'&&sd%2?.3:0)-.12,base=cor?.2:.19;
 mc.font='800 100px Archivo,system-ui,sans-serif';const ws=s.n.toUpperCase().split(' '),mx=Math.max(...ws.map(x=>mc.measureText(x).width))/100;
 let f=Math.min(base,w/(mx*1.04));const tot=mc.measureText(s.n.toUpperCase()).width/100*f;if(tot/w>(cor?2.2:3))f*=Math.sqrt(3/(tot/w));return Math.max(.08,f).toFixed(3)}
function cellHtml(i){const s=B[i],sd=side(i),cor=i%10==0,[x,z]=cpos(i),w=cor?1.5:sd%2?1.5:1,h=cor?1.5:sd%2?1:1.5;
 return `<div class="m2c s${sd}${cor?' cor':''}${s.t=='p'?' p':''}" data-i="${i}" style="left:${pct(x-w/2)};top:${pct(z-h/2)};width:${w/12*100}%;height:${h/12*100}%">
  ${s.t=='p'?`<div class="m2bar" style="background:${D.gcol[s.g]}"></div>`:''}<div class="m2tx">${s.t!='p'?`<span class="m2ic">${icon(s)}</span>`:''}
  <span class="m2nm" style="font-size:calc(var(--u) * ${fit(i)})">${esc(s.n)}</span>${s.s?`<span class="m2sb">${esc(s.s)}</span>`:''}${s.p||s.v?`<span class="m2pr">$${s.p||s.v}</span>`:''}<span class="m2oc"></span></div><div class="m2own"></div></div>`}
let mz=null;
function build(){if(ready)return;ready=true;
 root=document.createElement('div');root.id='m2root';root.dataset.t='menta';
 let h='';for(let i=0;i<40;i++)h+=cellHtml(i);
 root.innerHTML=`<div class="m2w"><div class="m2b">${h}<div class="m2ctr">
  <div class="m2logo"><b>Mérida en Venta</b><small>la Ciudad Blanca</small></div><div class="m2dice"></div><div class="m2pot"></div></div><div class="m2tl"></div></div></div>`;
 document.body.appendChild(root);wrap=root.firstChild;brd=wrap.firstChild;diceEl=root.querySelector('.m2dice');potEl=root.querySelector('.m2pot');mz=window.MZ?MZ.m2(root.querySelector('.m2ctr')):null;
 root.querySelectorAll('.m2c').forEach(e=>cells[+e.dataset.i]=e);
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>cells.forEach((e,i)=>{e.querySelector('.m2nm').style.fontSize=`calc(var(--u) * ${fit(i)})`}));
 root.addEventListener('pointermove',e=>{if(!window.MTIP)return;const c=e.pointerType=='mouse'&&!e.buttons&&e.target.closest&&e.target.closest('.m2c');MTIP.show(c?+c.dataset.i:-1,e.clientX,e.clientY)});root.addEventListener('pointerleave',()=>window.MTIP&&MTIP.hide());root.addEventListener('pointerdown',pDown);root.addEventListener('pointermove',pMove);root.addEventListener('pointerup',pUp);root.addEventListener('pointercancel',e=>{ptr.delete(e.pointerId)});
 root.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,vt.k*Math.exp(-e.deltaY*.0018))},{passive:false});
 root.addEventListener('dblclick',e=>{if(!e.target.closest('.m2c'))home()})}
// ---- cámara 2D: vw = dónde está, vt = adónde va (x,y en px de pantalla, k = zoom) ----
const visW=()=>Math.max(50,innerWidth-ins.l-ins.r),visH=()=>Math.max(50,innerHeight-ins.t-ins.b),cx=()=>ins.l+visW()/2,cy=()=>ins.t+visH()/2;
function clampV(){vt.k=Math.max(1,Math.min(KMAX,vt.k));const mx=Math.max(0,(S0*vt.k-visW())/2)+S0*.15,my=Math.max(0,(S0*vt.k-visH())/2)+S0*.15;
 vt.x=Math.max(-mx,Math.min(mx,vt.x));vt.y=Math.max(-my,Math.min(my,vt.y))}
function apply(){if(!wrap)return;wrap.style.transform=`translate(${cx()-S0*vw.k/2+vw.x}px,${cy()-S0*vw.k/2+vw.y}px) scale(${vw.k})`}
function zoomAt(px,py,k){k=Math.max(1,Math.min(KMAX,k));const X=cx()-S0*vt.k/2+vt.x,Y=cy()-S0*vt.k/2+vt.y,bx=(px-X)/vt.k,by=(py-Y)/vt.k;
 vt.k=k;vt.x=px-bx*k-cx()+S0*k/2;vt.y=py-by*k-cy()+S0*k/2;clampV();touched=true;kick()}
function home(){Object.assign(vt,{x:0,y:0,k:1});back=null;kick()}
// mirar un punto del tablero (unidades) con zoom k
function lookAt(u,v,k){vt.k=Math.max(1,Math.min(KMAX,k));vt.x=-(u/12)*S0*vt.k;vt.y=-(v/12)*S0*vt.k;clampV();kick()}
// ---- dedos y ratón: 1 dedo arrastra, 2 dedos pellizcan; tocar una casilla abre su tarjeta ----
function pDown(e){ptr.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,mv:false});try{root.setPointerCapture(e.pointerId)}catch(_){}
 if(ptr.size==2){const [a,b]=[...ptr.values()];root._pin={d:Math.hypot(a.x-b.x,a.y-b.y)||1,k:vt.k,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,x:vt.x,y:vt.y}}}
function pMove(e){const p=ptr.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
 if(Math.hypot(p.x-p.x0,p.y-p.y0)>6)p.mv=true;
 if(ptr.size>=2&&root._pin){const [a,b]=[...ptr.values()],P=root._pin,mx=(a.x+b.x)/2,my=(a.y+b.y)/2,k=Math.max(1,Math.min(KMAX,P.k*Math.hypot(a.x-b.x,a.y-b.y)/P.d));
  // el punto del tablero que estaba entre los dedos se queda entre los dedos
  const X=cx()-S0*P.k/2+P.x,Y=cy()-S0*P.k/2+P.y,bx=(P.mx-X)/P.k,by=(P.my-Y)/P.k;vt.k=k;vt.x=mx-bx*k-cx()+S0*k/2;vt.y=my-by*k-cy()+S0*k/2;
  clampV();Object.assign(vw,vt);touched=true;apply();return}
 if(p.mv&&ptr.size==1){vt.x+=dx;vt.y+=dy;clampV();Object.assign(vw,vt);touched=true;apply()}}
function pUp(e){const p=ptr.get(e.pointerId);ptr.delete(e.pointerId);if(ptr.size<2)root._pin=null;if(!p||p.mv||ptr.size)return;
 const t=document.elementFromPoint(e.clientX,e.clientY),c=t&&t.closest&&t.closest('.m2c');
 if(c){if(window.MRU)MRU.sel(+c.dataset.i);return}
 const now=performance.now();if(now-lastTap<320){home();lastTap=0}else lastTap=now}
// ---- fichas ----
function slot(k,G){const i=G.pos[k],[x,z]=cpos(i),sd=side(i);
 const same=G.players.map((_,j)=>j).filter(j=>!G.bk[j]&&G.pos[j]===i&&(i!==10||!!G.jail[j]===!!G.jail[k])),n=same.indexOf(k),c=same.length;
 if(i===10)return G.jail[k]?[x+.3+(n%2)*.38-.19,z-.3+Math.floor(n/2)*.34-.17]:[x-.5+(n%3)*.42,z+.48-Math.floor(n/3)*.4];
 const cols=c<2?1:2,rows=Math.ceil(c/cols),a=((n%cols)-(cols-1)/2)*.42,b=(Math.floor(n/cols)-(rows-1)/2)*.36;
 if(i%10==0)return [x+a,z+b];if(sd==0)return [x+a,z+b+.12];if(sd==2)return [x+a,z+b-.12];if(sd==1)return [x+b-.12,z+a];return [x+b+.12,z+a]}
function mkTok(k){const e=document.createElement('div');e.className='m2t';e.style.setProperty('--pc',MR.pc(k));
 e.innerHTML=`<div class="ar">${ARROW}</div><div class="tk">${MR.tk(k)}</div><em>TÚ</em>`;brd.querySelector('.m2tl').appendChild(e);return e}
const place=(e,x,z,hop)=>{e.style.left=pct(x);e.style.top=pct(z);e.style.setProperty('--hop',hop?(-hop*S0/12)+'px':'0px')};
function syncToks(G){G.players.forEach((_,k)=>{if(!toks[k]){toks[k]=mkTok(k);wasBk[k]=G.bk[k]?1:0;if(G.bk[k])toks[k].style.display='none';shownPos[k]=G.pos[k];const [x,z]=slot(k,G);place(toks[k],x,z,0)}
 const e=toks[k],t=G.pos[k];if(!G.bk[k]){if(wasBk[k]){const t=e.querySelector('.tk');if(t&&t.getAnimations)t.getAnimations().forEach(x=>x.cancel())}wasBk[k]=0;e.style.display=''}else if(!wasBk[k]){wasBk[k]=1;if(RM)e.style.display='none';else{react(k,'quiebra');setTimeout(()=>{if(G0&&G0.bk[k])e.style.display='none'},1400)}}e.classList.toggle('on',k===G.turn&&G.phase=='play');e.classList.toggle('me',k===V.me);e.classList.toggle('jl',!!G.jail[k]&&t===10);
 if(shownPos[k]!==t){const d=(t-shownPos[k]+40)%40,path=[];let jl=0;
  // a la cárcel: llega caminando a "Ve a la cárcel" o a la carta, suena la sirena y salta a la cárcel con un brinco largo
  if(t===10&&G.jail[k]){const s0=shownPos[k],n=(G.dice[0]||0)+(G.dice[1]||0),q=(s0+n)%40;jl=1;if(n>=2&&B[q]&&(q==30||B[q].t=='s'||B[q].t=='c')){for(let j=1;j<=n;j++)path.push((s0+j)%40);jl=q==30?700:2600}path.push(10)}
  else if(d>0&&d<=12&&!(t===10&&G.jail[k]))for(let j=1;j<=d;j++)path.push((shownPos[k]+j)%40);else path.push(t);
  shownPos[k]=t;const L=e.style;anim[k]={path,jl,hp:window.MRIT?MRIT.hops(G,k,path,!!jl):null,t0:performance.now()+(path.length==1&&jl?400:0),from:[parseFloat(L.left)/100*12-6,parseFloat(L.top)/100*12-6]};startFollow(k)}
 else if(!anim[k]){const [x,z]=slot(k,G);place(e,x,z,0)}})}
// personalidad de las fichas: apachurrón al caer, se agacha al pagar, brinca al cobrar, gira en la Salida, se cae al quebrar
const wasBk=[];
function react(k,kind,a){const e=toks[k],t=e&&e.querySelector('.tk');if(!t||!t.animate||(RM&&kind!='quiebra'))return;a=a==null?1:a;const w=.15+.2*a;
 const K={sq:[[{scale:'1 1'},{scale:(1+w*.6)+' '+(1-w)},{scale:'1 1'}],240],paga:[[{scale:'1 1',rotate:'0deg'},{scale:'1.3 .6',rotate:'-8deg',offset:.3},{scale:'1.25 .65',rotate:'8deg',offset:.5},{scale:'1 1',rotate:'0deg'}],700],
  cobra:[[{translate:'0 0',rotate:'0deg'},{translate:'0 -60%',rotate:'180deg'},{translate:'0 0',rotate:'360deg'}],650],go:[[{translate:'0 0',rotate:'0deg'},{translate:'0 -90%',rotate:'360deg'},{translate:'0 0',rotate:'720deg'}],700],
  quiebra:[[{rotate:'0deg',scale:'1',opacity:1},{rotate:'80deg',scale:'1',opacity:1,offset:.35},{rotate:'90deg',scale:'.3',opacity:0}],1400]}[kind];
 if(K)t.animate(K[0],{duration:K[1],easing:'ease-out',fill:kind=='quiebra'?'forwards':'none'})}
// la cámara sigue a la ficha que se mueve (si estás con zoom) y luego regresa a donde estabas
function startFollow(k){if(!fol||vt.k<1.15||ptr.size)return;if(!back)back={x:vt.x,y:vt.y,k:vt.k};touched=false;anim[k].fol=true}
function step(now){let busy=false;const G=G0;
 toks.forEach((e,k)=>{const a=anim[k];if(!a||!e)return;busy=true;const jh=a.jl&&a.path.length==1;if(jh&&!a.sn){a.sn=1;if(window.POLI)POLI.sirena(a.t0-now+HOP*5+300)}const hp=!jh&&a.hp&&a.hp[0];let t=(now-a.t0)/(jh?HOP*5:hp?hp.d:HOP);if(t<0)return;
  if(t>=1){a.path.shift();const to0=a.path0;if(a.hp)a.hp.shift();if(hp&&hp.land&&!a.path.length)sacude(G.pos[k],hp.land);react(k,to0===0?'go':'sq',hp&&hp.land?1:.4);const L=e.style;a.from=[parseFloat(L.left)/100*12-6,parseFloat(L.top)/100*12-6];a.t0=now;t=0;
   if(a.path.length==1&&a.jl)a.t0=now+(a.jl>1?a.jl:0);
   if(!a.path.length){anim[k]=null;const [x,z]=slot(k,G);place(e,x,z,0);if(a.jl&&window.POLI)POLI.reja();if(a.fol)setTimeout(()=>{if(back&&!touched&&!anim.some(Boolean)){Object.assign(vt,back);clampV()}back=null;kick()},900);return}}
  a.path0=a.path[0];const last=a.path.length==1,[x,z]=last?slot(k,G):cpos(a.path[0]),u=Math.min(1,t),px=a.from[0]+(x-a.from[0])*u,pz=a.from[1]+(z-a.from[1])*u;
  place(e,px,pz,jh?Math.sin(u*Math.PI)*1.2:hp?MRIT.alto(u,hp)*.32*hp.h:Math.sin(u*Math.PI)*.32);if(a.fol&&!touched){vt.x=-(px/12)*S0*vt.k;vt.y=-(pz/12)*S0*vt.k;clampV()}});
 return busy}
// la ficha cayó fuerte en una colonia con casas u hotel (MRIT): las casas brincan y la casilla tiembla; entre más casas, más fuerte
function sacude(i,a){const c=cells[i];if(!c||!c.animate)return;const b=c.querySelector('.m2bar'),q=n=>Array.from({length:7},(_,j)=>{const f=(1-j/6);return {transform:n(j%2?-1:1,f)}});
 if(b)b.animate(q((s,f)=>`translateY(${-(4+10*a)*f*(s>0?1:.3)}px) rotate(${s*(4+10*a)*f}deg)`).concat([{transform:'none'}]),{duration:600+500*a,easing:'ease-out'});
 c.animate(q((s,f)=>`translate(${s*(1+3*a)*f}px,0)`).concat([{transform:'none'}]),{duration:400+300*a});if(typeof sfx=='function')sfx('place');try{if(navigator.vibrate)navigator.vibrate(30+60*a)}catch(_){}}
// ---- casillas que cambian: dueño, casas, hipoteca ----
let FG0=null;
function syncCells(G,sel){const key=JSON.stringify([G.own,G.hs,G.mg]);
 if(key!==dynKey){dynKey=key;for(let i=0;i<40;i++){const e=cells[i],o=G.own[i],h=G.hs[i];e.classList.toggle('own',o>=0);e.classList.toggle('m2mg',!!G.mg[i]);
  if(o>=0){e.style.setProperty('--oc',MR.pc(o));e.querySelector('.m2oc').innerHTML=MR.tk(o)}
  const bar=e.querySelector('.m2bar');if(bar)bar.innerHTML=h==5?HOTEL:HOUSE.repeat(h)}
  // grupo completo: marco del color del dueño; si se acaba de completar, una luz recorre el grupo
  const FG=[];MR.GR.forEach((L,g)=>{const o=G.own[L[0]];const f=o>=0&&L.every(j=>G.own[j]===o);L.forEach(i=>cells[i].classList.toggle('full',f));if(f)FG.push(g+':'+o)});
  if(FG0&&!RM)FG.forEach(k=>{if(FG0.includes(k))return;const [g,o]=k.split(':').map(Number);MR.GR[g].forEach((i,j)=>cells[i].animate([{boxShadow:'inset 0 0 0 0 transparent'},{boxShadow:'inset 0 0 0 calc(var(--u)*.6) '+MR.pc(o)},{boxShadow:'inset 0 0 0 0 transparent'}],{duration:700,delay:j*160,easing:'ease-out'}));if(typeof sfx=='function')sfx('go')});
  FG0=FG}
 if(sel!==selI){if(selI>=0&&cells[selI])cells[selI].classList.remove('sel');selI=sel;if(sel>=0&&cells[sel])cells[sel].classList.add('sel')}}
function syncDice(G){if(G.rn===rollN)return;const first=rollN<0;rollN=G.rn;if(!G.dice[0]){diceEl.innerHTML='';return}
 diceEl.innerHTML=die(G.dice[0])+(G.dice[1]?die(G.dice[1]):'');if(!first&&!RM){const d=G.dice[0]===G.dice[1];diceEl.style.setProperty('--dc',MR.pc(G.turn));diceEl.classList.remove('roll','dbl');void diceEl.offsetWidth;diceEl.classList.add('roll');if(d)diceEl.classList.add('dbl');if(typeof sfx=='function')setTimeout(()=>sfx('tick'),380)}}
// ---- ciclo: solo corre mientras hay algo moviéndose ----
function kick(){if(!raf&&shown)raf=requestAnimationFrame(loop)}
function loop(now){raf=0;if(!shown||!G0)return;let busy=step(now);
 const f=ptr.size?1:.2;['x','y','k'].forEach(q=>{const d=vt[q]-vw[q];if(Math.abs(d)>(q=='k'?1e-4:.3)){vw[q]+=d*f;busy=true}else vw[q]=vt[q]});apply();if(busy)kick()}
window.M2={ok:()=>true,
 show(on){if(on)build();if(shown===on)return;shown=on;if(root)root.style.display=on?'block':'none';if(on)kick();else if(mz)mz.reset()},
 cardAt:(d,dl)=>mz&&shown?mz.at(d,dl):null,
 react:(k,kind,a)=>{if(ready&&shown)react(k,kind,a)},
 layout(i){ins=i;const s=Math.floor(Math.min(visW(),visH())*.98);if(s!==S0){const r=S0?s/S0:1;S0=s;wrap.style.width=wrap.style.height=s+'px';brd.style.setProperty('--u',(s/12)+'px');vt.x*=r;vt.y*=r;vw.x*=r;vw.y*=r}clampV();apply();kick()},
 theme(t){if(root&&root.dataset.t!==t)root.dataset.t=t},follow(on){fol=on},
 sync(G,sel){G0=G;if(mz)mz.sync(G);syncCells(G,sel);syncToks(G);syncDice(G);potEl.textContent=G.o.pot?'Bote: '+MR.$m(G.pot):'';kick()},
 cam(c){if(c=='home')home();else if(c=='zi')zoomAt(cx(),cy(),vt.k*1.4);else if(c=='zo')zoomAt(cx(),cy(),vt.k/1.4)},
 look(k){const G=G0;if(!G||G.bk[k])return;const [x,z]=slot(k,G);if(vt.k>1.5&&Math.abs(vt.x+(x/12)*S0*vt.k)<8&&Math.abs(vt.y+(z/12)*S0*vt.k)<8)home();else lookAt(x,z,Math.max(vt.k,2.4))}};
const css=document.createElement('style');css.textContent=`
#m2root{position:fixed;inset:0;z-index:1;display:none;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;background:var(--pg);font-family:"Archivo",system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-tap-highlight-color:transparent}
#m2root[data-t=menta]{--bd:#cde6d0;--ln:#18201b;--tx:#18201b;--sb:#3e4c43;--pg:radial-gradient(ellipse at 50% 40%,#f3f7f1 0%,#d6e3d4 65%,#b9cbb9 100%)}
#m2root[data-t=oscuro]{--bd:#1f2a25;--ln:#5a6d63;--tx:#e9f0eb;--sb:#a3b5aa;--pg:radial-gradient(ellipse at 50% 40%,#1b2521 0%,#0c110f 75%)}
.m2w{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}
.m2b{position:relative;width:100%;height:100%;box-sizing:border-box;background:var(--bd);color:var(--tx);border:calc(var(--u)*.09) solid var(--ln);border-radius:calc(var(--u)*.14);box-shadow:0 calc(var(--u)*.25) calc(var(--u)*.9) rgba(0,0,0,.35)}
.m2c{position:absolute;box-sizing:border-box;border:calc(var(--u)*.025) solid var(--ln);background:var(--bd);overflow:hidden;cursor:pointer}
.m2c.sel{z-index:3;box-shadow:inset 0 0 0 calc(var(--u)*.07) #ff8a00,0 0 calc(var(--u)*.5) #ff8a00;overflow:visible}
.m2c.full::after{content:'';position:absolute;inset:0;border:calc(var(--u)*.06) solid var(--oc);pointer-events:none;box-sizing:border-box}
.m2bar{position:absolute;display:flex;align-items:center;justify-content:center;gap:4%;border:0 solid var(--ln)}
.s0 .m2bar{left:0;right:0;top:0;height:20%;border-bottom-width:calc(var(--u)*.025)}.s2 .m2bar{left:0;right:0;bottom:0;height:20%;border-top-width:calc(var(--u)*.025)}
.s1 .m2bar{top:0;bottom:0;right:0;width:20%;flex-direction:column;border-left-width:calc(var(--u)*.025)}.s3 .m2bar{top:0;bottom:0;left:0;width:20%;flex-direction:column;border-right-width:calc(var(--u)*.025)}
.m2bar svg{width:calc(var(--u)*.22);height:calc(var(--u)*.22);flex:none;filter:drop-shadow(0 1px 0 rgba(0,0,0,.4))}.m2bar svg[viewBox$="16 10"]{width:calc(var(--u)*.36)}
.s1 .m2bar svg[viewBox$="16 10"],.s3 .m2bar svg[viewBox$="16 10"]{transform:rotate(90deg)}
.m2tx{position:absolute;inset:5% 5% 6%;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;gap:2%}
.p.s0 .m2tx{top:23%}.p.s2 .m2tx{bottom:23%}.p.s1 .m2tx{right:23%}.p.s3 .m2tx{left:23%}.p .m2tx{justify-content:space-around}
.m2nm{font-weight:800;text-transform:uppercase;line-height:1.04;letter-spacing:-.01em;overflow-wrap:normal;word-break:normal}
.m2pr{font-weight:700;font-size:calc(var(--u)*.14);color:var(--sb)}.m2sb{font-weight:600;font-size:calc(var(--u)*.12);color:var(--sb);line-height:1.1}
.m2ic{font-size:calc(var(--u)*.32);line-height:1}.cor .m2ic{font-size:calc(var(--u)*.56)}.cor .m2tx{justify-content:center;gap:4%}
.m2oc{display:none;place-items:center;width:calc(var(--u)*.26);height:calc(var(--u)*.26);border-radius:50%;background:var(--oc);border:calc(var(--u)*.025) solid #fff;font-size:calc(var(--u)*.15);line-height:1;box-shadow:0 0 0 calc(var(--u)*.02) var(--oc)}
.own .m2pr{display:none}.own .m2oc{display:grid}
.m2own{position:absolute;display:none;background:var(--oc)}.own .m2own{display:block}
.s0 .m2own{left:0;right:0;bottom:0;height:7%}.s2 .m2own{left:0;right:0;top:0;height:7%}.s1 .m2own{top:0;bottom:0;left:0;width:7%}.s3 .m2own{top:0;bottom:0;right:0;width:7%}
.m2c.m2mg::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(0,0,0,.2) 0 calc(var(--u)*.05),transparent calc(var(--u)*.05) calc(var(--u)*.13));pointer-events:none}
.m2ctr{position:absolute;left:12.5%;top:12.5%;width:75%;height:75%;pointer-events:none}
.m2logo{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-38deg);display:flex;flex-direction:column;align-items:center;gap:calc(var(--u)*.1)}
.m2logo b{display:block;white-space:nowrap;background:#d7261e;color:#fff;font-weight:900;font-size:calc(var(--u)*.62);line-height:1;text-transform:uppercase;letter-spacing:.02em;padding:calc(var(--u)*.16) calc(var(--u)*.34);border:calc(var(--u)*.06) solid #fff;outline:calc(var(--u)*.06) solid #18201b;box-shadow:0 calc(var(--u)*.12) 0 rgba(0,0,0,.3)}
.m2logo small{font:italic 600 calc(var(--u)*.26) Georgia,serif;color:var(--sb)}
.m2dice{position:absolute;left:61%;top:61%;display:flex;gap:calc(var(--u)*.14);transform:translate(-50%,-50%)}.m2dice svg{width:calc(var(--u)*.78);height:calc(var(--u)*.78);filter:drop-shadow(0 calc(var(--u)*.06) 0 rgba(0,0,0,.35))}
.m2dice.roll svg{animation:m2roll .9s linear}.m2dice::after{content:'';position:absolute;left:50%;top:50%;width:100%;aspect-ratio:1;border-radius:50%;border:calc(var(--u)*.08) solid var(--dc,#fff);translate:-50% -50%;opacity:0;pointer-events:none}.m2dice.dbl::after{animation:m2dbl .8s .38s ease-out}@keyframes m2dbl{from{opacity:.9;scale:.6}to{opacity:0;scale:2.4}}.m2dice.roll svg+svg{animation-delay:.05s}
@keyframes m2roll{0%{transform:translate(calc(var(--u)*2),calc(var(--u)*-2)) rotate(300deg) scale(.7)}40%{transform:translate(calc(var(--u)*.3),calc(var(--u)*-.3)) rotate(40deg) scale(1)}54%{transform:translate(calc(var(--u)*.15),calc(var(--u)*-.15)) rotate(15deg) scale(1.18)}68%{transform:translate(calc(var(--u)*.05),calc(var(--u)*-.05)) rotate(4deg) scale(1)}78%{transform:rotate(1deg) scale(1.06)}88%{transform:scale(1)}94%{transform:scale(1.02)}100%{transform:none}}
.m2pot{position:absolute;left:39%;top:39%;transform:translate(-50%,-50%) rotate(-45deg);font-weight:800;font-size:calc(var(--u)*.24);white-space:nowrap}
.m2tl{position:absolute;inset:0;pointer-events:none}
.m2t{position:absolute;width:0;height:0;z-index:5}.m2t.on{z-index:7}.m2t.me{z-index:6}.m2t.on.me{z-index:8}
.m2t .tk{position:absolute;left:0;top:0;display:grid;place-items:center;width:calc(var(--u)*.56);height:calc(var(--u)*.56);box-sizing:border-box;border-radius:50%;background:var(--pc);border:calc(var(--u)*.05) solid #fff;box-shadow:0 0 0 calc(var(--u)*.035) var(--pc),0 calc(var(--u)*.07) calc(var(--u)*.12) rgba(0,0,0,.5);font-size:calc(var(--u)*.33);line-height:1;transform:translate(-50%,-50%) translateY(var(--hop,0px));transition:width .2s,height .2s,font-size .2s}
.m2t.on .tk{width:calc(var(--u)*.7);height:calc(var(--u)*.7);font-size:calc(var(--u)*.42);box-shadow:0 0 0 calc(var(--u)*.04) var(--pc),0 0 0 calc(var(--u)*.14) rgba(255,255,255,.55),0 calc(var(--u)*.08) calc(var(--u)*.16) rgba(0,0,0,.5)}
.m2t.jl .tk::after{content:'';position:absolute;inset:-6%;border-radius:50%;background:repeating-linear-gradient(90deg,rgba(24,32,27,.85) 0 11%,transparent 11% 30%)}
.m2t .ar{position:absolute;left:0;top:0;width:calc(var(--u)*.42);height:calc(var(--u)*.55);transform:translate(-50%,calc(-100% - var(--u)*.3)) translateY(var(--hop,0px));animation:m2bob .9s ease-in-out infinite}
.m2t.on .ar{width:calc(var(--u)*.62);height:calc(var(--u)*.8);transform:translate(-50%,calc(-100% - var(--u)*.38)) translateY(var(--hop,0px));animation-duration:.65s}
.m2t .ar svg{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 calc(var(--u)*.04) calc(var(--u)*.03) rgba(0,0,0,.55))}
.m2t em{display:none;position:absolute;left:0;top:0;transform:translate(-50%,calc(-100% - var(--u)*.9)) translateY(var(--hop,0px));font:900 max(8px,calc(var(--u)*.2))/1 "Archivo",system-ui,sans-serif;font-style:normal;letter-spacing:.05em;color:#fff;background:var(--pc);border:max(1px,calc(var(--u)*.03)) solid #fff;border-radius:calc(var(--u)*.08);padding:calc(var(--u)*.05) calc(var(--u)*.08);white-space:nowrap;animation:m2bob .9s ease-in-out infinite}
.m2t.me em{display:block}.m2t.on.me em{transform:translate(-50%,calc(-100% - var(--u)*1.24)) translateY(var(--hop,0px));animation-duration:.65s}
@keyframes m2bob{0%,100%{translate:0 0}50%{translate:0 calc(var(--u)*-.2)}}
@media (prefers-reduced-motion:reduce){.m2t .ar,.m2t em{animation:none}}
`;document.head.appendChild(css);
})();
