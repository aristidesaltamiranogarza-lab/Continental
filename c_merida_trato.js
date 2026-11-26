// Mérida en Venta: armar un trato (MTRA). Dos columnas, "Tú das" y "Tú pides", con las propiedades de cada quien a la mano
// (un toque la mete o la saca), dinero con botones rápidos, un atajo para pedir lo que te falta de un grupo y un medidor de
// cómo lo ve el otro (la misma cuenta que usa el bot, g_merida_bot.js). c_meridaui.js llama MTRA.init(H) y MTRA.ui(ot).
(function(){
let H=null;
const STEP=[50,100,500];
const full=(G,g,o)=>H.GR[g].every(j=>G.own[j]===o);
// lo que vale la casilla q para k (igual que worth() del bot)
function worth(G,k,q,sinQ,ext){const B=H.B,s=B[q],has=j=>G.own[j]===k||(ext&&ext.includes(j));let v=s.p;
 if(s.t=='p'){const g=H.GR[s.g],tiene=g.filter(j=>j!==q&&has(j)).length,otros=g.filter(j=>j!==q&&G.own[j]>=0&&G.own[j]!==k);
  if(tiene==g.length-1)v*=sinQ?2.5:1.8;else if(tiene==g.length-2&&tiene)v*=1.5;else if(tiene)v*=1.25;
  if(otros.length==g.length-1&&otros.every(j=>G.own[j]===G.own[otros[0]]))v*=1.3}
 else if(s.t=='r'||s.t=='u'){const L=B.filter((x,j)=>x.t==s.t&&j!==q&&G.own[j]===k).length;v*=1+.2*L}
 return v*(1+Math.max(0,G.cash[k]-1500)/2000)}
function tval(G,k,T){const B=H.B,yo=T.b===k,da=yo?T.bp:T.ap,rec=yo?T.ap:T.bp,cd=yo?T.bc:T.ac,cr=yo?T.ac:T.bc,jd=yo?T.bj:T.aj,jr=yo?T.aj:T.bj,otro=yo?T.a:T.b;
 let v=cr-cd+50*(jr-jd);rec.forEach(q=>v+=worth(G,k,q,0,rec));
 da.forEach(q=>{v-=worth(G,k,q,1);const s=B[q];if(s.t=='p'&&H.GR[s.g].every(j=>j===q||G.own[j]===otro||rec.includes(j)))v-=s.p});return v}
const locked=(G,q)=>{const s=H.B[q];return s.t=='p'&&H.GR[s.g].some(j=>G.hs[j])};
// propiedades de k en orden del tablero, primero por grupo
const props=(G,k)=>G.own.map((o,i)=>o===k?i:-1).filter(i=>i>=0).sort((a,b)=>{const A=H.B[a],B=H.B[b];return (A.t=='p'?A.g:99)-(B.t=='p'?B.g:99)||a-b});
const col=i=>{const s=H.B[i];return s.t=='p'?H.D.gcol[s.g]:'#9aa59f'};
function pcard(G,i,key){const s=H.B[i],on=H.TR[key].includes(i),lk=locked(G,i),h=G.hs[i];
 return `<button class="mtr-p${on?' on':''}${G.mg[i]?' mg':''}" style="--gc:${col(i)}" ${lk?'disabled title="Primero vende las casas del grupo"':`onclick="MRU.tg('${key}',${i})"`}>
  <i></i><span>${H.esc(s.n)}</span><small>${lk?H.MIC.h('rancho'):G.mg[i]?'Hipotecada':H.$m(s.p)}</small>${on?'<em>'+CHK+'</em>':''}</button>`}
const CHK='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function money(G,key,k){const v=H.TR[key]||0,max=G.cash[k];
 return `<div class="mtr-m"><label class="mtr-in"><span>$</span><input id="mut_${key}" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" value="${v||''}" placeholder="0" aria-label="Dinero" oninput="MTRA.n('${key}',this)" onfocus="this.select()"></label>
  <div>${v?`<button onclick="MTRA.cash('${key}',-50)">−50</button>`:''}${STEP.map(d=>`<button onclick="MTRA.cash('${key}',${d})"${v+d>max?' disabled':''}>+${d}</button>`).join('')}</div><small>Tiene ${H.$m(max)}</small></div>`}
function jcard(G,key,k){const n=G.jf[k]||0;if(!n)return '';const v=H.TR[key]||0;return `<button class="mtr-j${v?' on':''}" onclick="MTRA.jc('${key}',${n})">${H.MIC.h('llave')} Tarjeta de la cárcel${n>1?` (${v}/${n})`:''}</button>`}
function side(G,lb,k,key,ck,jk){const L=props(G,k);
 return `<div class="mtr-s"><div class="mtr-sh">${H.tok(k,'xs')}<b>${lb}</b></div><div class="mtr-ps">${L.map(i=>pcard(G,i,key)).join('')||'<span class="mu-s">Sin propiedades</span>'}</div>${money(G,ck,k)}${jcard(G,jk,k)}</div>`}
// atajo: el grupo que te completa el otro (sin casas), el que menos piezas te falten
function sugerir(G,m,to){let best=null;H.GR.forEach((L,g)=>{const mine=L.filter(j=>G.own[j]===m),f=L.filter(j=>G.own[j]!==m);
 if(!mine.length||!f.length||!f.every(j=>G.own[j]===to)||L.some(j=>G.hs[j]))return;if(!best||f.length<best.f.length)best={g,f}});return best}
function medidor(G,m,T){if(!T.ap.length&&!T.bp.length&&!T.ac&&!T.bc&&!T.aj&&!T.bj)return '';const v=tval(G,T.b,T),yo=tval(G,m,T);
 const [c,t]=v>20?['ok','Probablemente acepte']:v>-80?['mid','Lo va a pensar']:['bad','Le parece poco'];const p=Math.max(4,Math.min(96,50+v/8));
 return `<div class="mtr-v ${c}"><div class="mtr-bar"><i style="left:${p}%"></i></div><span>${t}</span>${yo<-150?'<small>Ojo: tú das mucho más de lo que recibes.</small>':''}</div>`}
function limpia(G,m,TR){const ok=(L,k)=>L.filter(i=>G.own[i]===k&&!locked(G,i));TR.ap=ok(TR.ap,m);TR.bp=ok(TR.bp,TR.to);
 TR.ac=Math.min(TR.ac||0,G.cash[m]);TR.bc=Math.min(TR.bc||0,G.cash[TR.to]);TR.aj=Math.min(TR.aj||0,G.jf[m]||0);TR.bj=Math.min(TR.bj||0,G.jf[TR.to]||0)}
function pie(){const G=H.G,m=H.me(),TR=H.TR,T={a:m,b:TR.to,ap:TR.ap,bp:TR.bp,ac:TR.ac||0,bc:TR.bc||0,aj:TR.aj||0,bj:TR.bj||0};
 const nd=TR.ap.length+(T.ac?1:0)+(T.aj?1:0),np=TR.bp.length+(T.bc?1:0)+(T.bj?1:0);
 return `${medidor(G,m,T)}<button class="mu-b pri big" onclick="MRU.offer()"${nd+np?'':' disabled'}>${H.MIC.h('trato')} ${nd+np?'Ofrecer trato':'Elige qué dar o pedir'}</button>`}
function ui(ot){const G=H.G,m=H.me(),TR=H.TR,to=TR.to;limpia(G,m,TR);
 const sg=sugerir(G,m,to),pide=sg&&!sg.f.every(j=>TR.bp.includes(j)),hay=TR.ap.length+TR.bp.length+(TR.ac||0)+(TR.bc||0)+(TR.aj||0)+(TR.bj||0);
 return `<div class="mtr"><div class="mtr-top"><div class="mu-who">${ot.map(k=>`<button class="mu-chip pl${k===to?' on':''}" style="--pc:${H.pc(k)}" onclick="MRU.to(${k})">${H.tok(k,'xs')} ${H.nm(k)}</button>`).join('')}</div>${hay?'<button class="mtr-cl" onclick="MTRA.borra()">Empezar de nuevo</button>':''}</div>
  ${pide?`<button class="mtr-sg" onclick="MTRA.pide([${sg.f}])" style="--gc:${H.D.gcol[sg.g]}"><i></i>Pedir lo que te falta del grupo (${sg.f.length})</button>`:''}
  <div class="mtr-ss">${side(G,'Tú das',m,'ap','ac','aj')}${side(G,'Tú pides',to,'bp','bc','bj')}</div>
  <div class="mtr-ft" id="mtrft">${pie()}</div></div>`}
const css=document.createElement('style');css.textContent=`
.mtr{display:flex;flex-direction:column;gap:12px}
.mtr-ss{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media (max-width:420px){.mtr-ss{grid-template-columns:1fr}}
.mtr-s{display:flex;flex-direction:column;gap:8px;background:var(--mu-card);border-radius:16px;padding:10px;box-shadow:0 1px 0 rgba(0,0,0,.06),0 4px 14px rgba(0,0,0,.08)}
.mtr-sh{display:flex;align-items:center;gap:8px}.mtr-sh b{font:900 15px var(--mu-f)}
.mtr-ps{display:flex;flex-direction:column;gap:6px;max-height:260px;overflow:auto}
.mtr-p{all:unset;box-sizing:border-box;position:relative;display:flex;align-items:center;gap:8px;min-height:40px;padding:6px 34px 6px 6px;border-radius:12px;background:var(--mu-bg2,rgba(0,0,0,.04));cursor:pointer;font:700 13px/1.15 var(--mu-f);color:var(--mu-ink);transition:transform .12s,background .12s}
.mtr-p i{flex:none;width:10px;align-self:stretch;border-radius:6px;background:var(--gc)}.mtr-p span{flex:1;min-width:0}.mtr-p small{font:700 12px var(--mu-f);color:var(--mu-sub)}
.mtr-p.on{background:color-mix(in srgb,var(--gc) 22%,var(--mu-card));box-shadow:inset 0 0 0 2px var(--gc);transform:translateY(-1px)}
.mtr-p em{position:absolute;right:8px;top:50%;translate:0 -50%;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:var(--gc);color:#fff}
.mtr-p:disabled{opacity:.45;cursor:not-allowed}.mtr-p.mg span{text-decoration:line-through;text-decoration-thickness:1px}
.mtr-m{display:flex;flex-direction:column;gap:6px}.mtr-in{display:flex;align-items:center;gap:4px;min-height:46px;padding:0 12px;border-radius:12px;background:var(--mu-bg2,rgba(0,0,0,.05));box-shadow:inset 0 0 0 2px var(--mu-line,rgba(0,0,0,.12));font:900 20px var(--mu-f);color:var(--mu-ink)}.mtr-in:focus-within{box-shadow:inset 0 0 0 2px var(--mu-ink)}.mtr-in input{all:unset;flex:1;min-width:0;font:900 20px var(--mu-f);color:var(--mu-ink)}.mtr-in input::placeholder{color:var(--mu-sub)}
.mtr-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.mtr-top .mu-who{flex:1}.mtr-cl{all:unset;cursor:pointer;font:700 13px var(--mu-f);color:var(--mu-sub);text-decoration:underline;padding:6px 2px}.mtr-ft{display:flex;flex-direction:column;gap:12px}.mtr-m small{font:600 12px var(--mu-f);color:var(--mu-sub)}
.mtr-m div{display:flex;gap:6px}.mtr-m button{all:unset;box-sizing:border-box;flex:1;display:grid;place-items:center;min-height:38px;border-radius:10px;background:var(--mu-bg2,rgba(0,0,0,.05));font:800 14px var(--mu-f);color:var(--mu-ink);cursor:pointer}
.mtr-m button:disabled{opacity:.35;cursor:default}
.mtr-j{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:6px;min-height:38px;padding:0 10px;border-radius:10px;background:var(--mu-bg2,rgba(0,0,0,.05));font:700 13px var(--mu-f);cursor:pointer}.mtr-j.on{box-shadow:inset 0 0 0 2px var(--mu-ink)}
.mtr-sg{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:10px;min-height:44px;padding:0 14px;border-radius:14px;background:color-mix(in srgb,var(--gc) 18%,var(--mu-card));box-shadow:inset 0 0 0 2px var(--gc);font:800 14px var(--mu-f);color:var(--mu-ink);cursor:pointer}
.mtr-sg i{width:14px;height:14px;border-radius:4px;background:var(--gc)}
.mtr-v{display:flex;flex-direction:column;gap:4px;font:800 14px var(--mu-f)}.mtr-v small{font:600 12px var(--mu-f);color:#b3261e}
.mtr-bar{position:relative;height:8px;border-radius:99px;background:linear-gradient(90deg,#d7261e,#f2c230 45%,#2e9e57 70%)}.mtr-bar i{position:absolute;top:50%;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 0 0 3px var(--mu-ink);translate:-50% -50%;transition:left .25s}
@media (max-height:500px){.mu-hud.land.t-trato .mu-dk>.mu-row,.mu-hud.land.t-mias .mu-dk>.mu-row,.mu-hud.land.t-hist .mu-dk>.mu-row,.mu-hud.land .mu-sheet>header{display:none}.mtr-ps{max-height:none}.mtr{gap:8px}.mtr-s{padding:8px}}
.mtr-v.ok span{color:#1e8a4a}.mtr-v.mid span{color:#a86b00}.mtr-v.bad span{color:#b3261e}`;
document.head.appendChild(css);
window.MTRA={init:h=>{H=h},ui,tval,
 cash:(key,d)=>{const G=H.G,TR=H.TR,k=key=='ac'?H.me():TR.to;TR[key]=Math.max(0,Math.min(G.cash[k],(TR[key]||0)+d));H.render()},
 // monto exacto: se teclea; sin rehacer todo el panel (no se pierde el teclado), solo el medidor y el botón
 n:(key,el)=>{const G=H.G,TR=H.TR,k=key=='ac'?H.me():TR.to,raw=el.value.replace(/\D/g,''),v=Math.min(G.cash[k],+raw||0);TR[key]=v;
  const t=raw?String(v):'';if(el.value!==t)el.value=t;const f=document.getElementById('mtrft');if(f)f.innerHTML=pie()},
 borra:()=>{const TR=H.TR;TR.ap=[];TR.bp=[];TR.ac=TR.bc=TR.aj=TR.bj=0;H.render()},
 jc:(key,n)=>{const TR=H.TR;TR[key]=((TR[key]||0)+1)%(n+1);H.render()},
 pide:L=>{const TR=H.TR;L.forEach(i=>{if(!TR.bp.includes(i))TR.bp.push(i)});H.render()}};
})();
