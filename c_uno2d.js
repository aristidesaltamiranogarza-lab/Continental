// Uno 2D (U2D): la vista 2D de Uno sobre la mesa compartida (c_mesa2d.js). Se carga antes de c_uno3d.js para que la vista 3D la use como su vista 2D
(function(){
if(!window.M2D||!GM.uno)return;
const b0=GM.uno.body,ev0=GM.uno.ev;
// anillo de dirección: 4 arcos con punta (r=46 en 0–100), mismo diseño que el anillo 3D
const ARC=(()=>{let d='';const P=a=>[50+46*Math.sin(a),50-46*Math.cos(a)],f=v=>v.toFixed(1);
 for(let i=0;i<4;i++){const a0=(i*90+10)*Math.PI/180,a1=(i*90+66)*Math.PI/180,[x0,y0]=P(a0),[x1,y1]=P(a1),tx=Math.cos(a1),ty=Math.sin(a1),nx=Math.sin(a1),ny=-Math.cos(a1);
  d+=`<path d="M${f(x0)} ${f(y0)}A46 46 0 0 1 ${f(x1)} ${f(y1)}"/><polygon points="${f(x1+tx*7)},${f(y1+ty*7)} ${f(x1+nx*4.5)},${f(y1+ny*4.5)} ${f(x1-nx*4.5)},${f(y1-ny*4.5)}"/>`}
 return `<svg viewBox="0 0 100 100">${d}</svg>`})();
let dirV=0,dirT=0;   // al invertirse el sentido, el anillo da un rebote
const fieltro=()=>{const c=(window.MESA_J&&MESA_J.uno&&MESA_J.uno.col())||['#5d656f','#1d2126'];return `--m2d-fieltro:${c[0]};--m2d-fieltro2:${c[1]}`};
const giro=id=>({r:((id*47)%25)-12,x:((id*31)%9)-4,y:((id*17)%7)-3});   // cada carta cae siempre igual en el descarte
function cuerpo(){const G=V.G;if(!G||(G.phase!='play'&&G.phase!='final'))return b0();
 document.documentElement.dataset.ucol=G.color;
 if(G.phase=='final')return fin();
 const i=V.me,t=G.turn,mine=i>=0&&i==t,drawn=mine&&G.step=='drawn',pend=G.pend>0,h=i>=0?G.hands[i]:[];
 if(!mine)upick=null;
 const canD=mine&&G.step=='play'&&!G.ad;
 const vk=i>=0&&G.vuln&&G.vuln.k!=i&&hc(G.vuln.k)==1&&!G.uno[G.vuln.k]?G.vuln.k:-1,my1=i>=0&&h.length==1&&!G.uno[i],said=i>=0&&h.length==1&&!!G.uno[i];
 let st=G.ad>0?(mine?'Robando… ':nm(t)+' está robando… ')+'('+G.ad+')':i<0?mirTxt():!mine?'Turno de <b>'+nm(t)+'</b>':drawn?'Juega la carta que robaste o pasa':pend?`Acumula con ${G.pendT=='d'?'+2 o +4':'+4'} o roba ${G.pend}`:'Tu turno: juega una carta o toca el mazo';
 if(upick!=null)st="Elige el color";if(G.note)st='<b>'+esc(G.note)+'</b> · '+st;
 const seats=M2D.rivales(1).map(([k,x,y])=>{const n=hc(k);return M2D.asiento(k,{x,y,turno:k==t,cuenta:n,fan:Math.min(n,10),alerta:n==1,
  tag:G.uno[k]&&n==1?'UNO':'',extra:k==vk?'<button class="u2-cobrar" onclick="ucatch()">Cobrar UNO</button>':''})});
 const dl=G.disc.slice(-3),pila=dl.map((id,j)=>{const q=giro(id),last=j==dl.length-1,m=last?1:3;   // las de abajo asoman giradas
  return `<div class="u2-d" style="--r:${q.r*m/2+(last?0:q.r>0?8:-8)}deg;--x:${q.x*m}px;--y:${q.y*m}px">${ucard(U(id),last?{id:'disc',nw:id!==prevTop}:{})}</div>`}).join('');
 if(dirV&&dirV!=G.dir)dirT=Date.now();dirV=G.dir;
 const centro=`<div class="u2-orbit${Date.now()-dirT<700?' gira':''}"><div class="u2-rot${G.dir<0?' rev':''}">${ARC}</div></div>
 <div class="u2-piles"><div class="u2-pila u2-mazo"><div class="c bk${canD?' go':''}${G.deck?'':' empty'}${(u=>u?` ucv" style="--ui:url(${u})`:'')(uimgS(null))}" id="deck"${canD?' onclick="udraw()"':''}></div><small>${G.deck}</small></div>
 <div class="u2-pila u2-desc m2d-drop">${pila}${pend?`<b class="u2-pend">+${G.pend}</b>`:''}</div></div>`;
 let acc='';
 if(mine&&G.step=='play'&&pend&&!G.ad)acc+=`<button class="ui-btn" onclick="udraw()">Robar ${G.pend}</button>`;
 if(drawn)acc+='<button class="ui-btn" onclick="upass()">Pasar</button>';
 if(my1||said)acc+=`<button class="u2-uno${said?' ok':''}" ${said?'disabled':''} onclick="uuno()">¡UNO!</button>`;
 const mano=i>=0?M2D.abanico(udisp().map(c=>({h:ucard(c,{did:c.id,nw:prevHand.size&&!prevHand.has(c.id),on:`uplay(${c.id})`}),cls:mine?(uok(c.id)?'ok':'no'):''}))):'';
 const capa=upick!=null?`<div class="u2-pick"><div class="u2-rueda">${UCH.map((c,k)=>`<button style="background:${c}" data-l="${'RAVZ'[k]}" aria-label="${UCN[k]}" onclick="ucol(${k})"></button>`).join('')}<button class="u2-x" onclick="upick=null;render()">Cancelar</button></div></div>`:'';
 const v3=window.u3dToggle?UI.dim(0,'M2D.menu(0);u3dToggle()'):'';
 M2D.suelta=mine?(id=>uplay(id)):null;
 M2D.teclas=k=>{if(upick!=null&&'1234'.includes(k)){ucol(+k-1);return 1}if(k=='Escape'&&upick!=null){upick=null;render();return 1}
  if(k=='u'&&my1){uuno();return 1}if(k=='c'&&vk>=0){ucatch();return 1}
  if((k==' '||k=='r')&&canD){udraw();return 1}if((k=='p'||k=='Enter')&&drawn){upass();return 1}};
 const comod=G.disc.length&&U(G.disc[G.disc.length-1]).c>=4;   // el nombre del color solo si lo eligió un comodín
 return M2D.mesa({cls:'u2'+(mine?' tu':''),redonda:1,estilo:`--uc:${UCH[G.color]};${fieltro()}`,
  top:comod||pend?`<div class="ui-pill u2-st">${comod?`<i class="u2-dot"></i><b>${UCN[G.color]}</b>`:''}${pend?`<span class="u2-acu">+${G.pend}</span>`:''}</div>`:'',der:v3,
  seats,centro,capa,hint:st,mine,yo:i>=0?M2D.yo(i,{turno:mine}):'',acc,
  ord:i>=0?`<button class="ui-btn ghost m2d-ord" onclick="cyc()">${manual?'Mi orden':sortS?'Por número':'Por color'}</button>`:'',mano,
  menu:`<div class="ui-row"><span>Letra del color en las cartas</span><label class="ui-sw"><input type="checkbox" ${cbl?'checked':''} onchange="setCb(this.checked)"><i></i></label></div>`,rules:unoRules})}
function fin(){const G=V.G,w=G.win,P=V.players,ks=G.players.map((p,k)=>k).sort((a,b)=>(!!P[a].out-!!P[b].out)||hc(a)-hc(b));
 M2D.suelta=null;M2D.teclas=null;
 return M2D.mesa({cls:'u2',redonda:1,estilo:`--uc:${UCH[G.color]||'#c2512a'};${fieltro()}`,der:window.u3dToggle?UI.dim(0,'u3dToggle()'):'',
  capa:`<div class="m2d-fin">${w>=0?M2D.retrato(w,'big','feliz'):''}<h2>${w>=0?(w==V.me?'¡Ganaste!':nm(w)+' gana'):'Fin de la partida'}</h2>
  <div class="m2d-tab">${ks.map(k=>`<div class="${k==w?'w':''}">${M2D.retrato(k,'',w>=0?(k==w?'feliz':'triste'):'')}<b>${nm(k)}</b><span>${P[k].out?'expulsado':k==w?'sin cartas':hc(k)+(hc(k)==1?' carta':' cartas')}</span></div>`).join('')}</div>
  <div class="m2d-bts"><button class="ui-btn" onclick="send({t:'reset'})">Nueva partida</button><button class="ui-btn sec" onclick="leave()">Salir</button></div></div>`,rules:unoRules})}
GM.uno.body=cuerpo;
// globitos: lo que hizo cada quien sale de su asiento (los números jugados ya se ven volar al descarte)
// caras: castigo (+2/+4) sorprende o enoja, decir UNO alegra, que te cobren el UNO enoja
const quien=t=>{const P=V.G.players;let b=-1;P.forEach((p,k)=>{if(t.includes(p.name)&&(b<0||p.name.length>P[b].name.length))b=k});return b};
GM.uno.ev=e=>{if(ev0)ev0(e);if(!document.querySelector('#app .m2d')||e.k==null)return;const t=e.t;
 const n=+((t.match(/^robó (\d+) cartas \(castigo\)/)||[])[1]||0);if(n)M2D.reac(e.k,n>=4?'enojo':'sorpresa');else if(/^dijo/.test(t))M2D.reac(e.k,'feliz');
 else if(/^cobró UNO/.test(t)){M2D.reac(e.k,'feliz');M2D.reac(quien(t.slice(10)),'enojo',3200)}else if(/^jugó (comodín )?\+[24]/.test(t))M2D.reac(e.k,'feliz');if(/^jugó \d/.test(t))return;
 M2D.bb(e.k,t.charAt(0).toUpperCase()+t.slice(1),/castigo|cobr/.test(t)?'malo':/^dijo/.test(t)?'uno':'')};
})();
