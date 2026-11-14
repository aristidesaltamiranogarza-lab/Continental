// c_billar_hud.js — BIH: entrada al Billar (antes de la partida). Junto a la mesa: aviso "Jugar Billar" (E) que abre un panel
// para jugar contra bot (fácil / normal / difícil), retar a alguien del sótano o armar 2 contra 2 (huecos con bots).
// Con el reto abierto: esperando / equipos, Empezar o Cancelar; al retado: Jugar o Ahora no. BIJ.hud() llama BIH.hud().
// Manda por BIJ.act (g_billar.js: retar / unir / rechazar / empezar / salir). Gente del piso: CASA3D.otros().
(function(){
const NIV=['Fácil','Normal','Difícil'],I=n=>window.UI?UI.ico(n):'',rr=()=>{if(typeof render=='function')render()};
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
let open=false,niv=1;try{const s=localStorage.getItem('bil_niv'),g=s==null?-1:+s;if(g>=0&&g<=2)niv=g}catch(e){}
const act=(op,x)=>window.BIJ&&BIJ.act(op,x);
const gente=()=>{const C=window.CASA3D;return C&&C.otros?C.otros():[]};
const win=(b,close)=>window.GHUD?GHUD.win(`${I('jugar')} Billar`,b,close||'BIH.cierra()'):'';
const aviso=(t,s,kbd)=>`<button class="ui uh-aviso" onclick="BIH.abre()" aria-label="${esc(t)}"><span class="uh-ai" aria-hidden="true">${I('jugar')}</span>
 <span class="uh-at"><b>${t}</b><small>${s}</small></span>${kbd?'<kbd>E</kbd>':''}</button>`;
const nom=p=>p?esc(p.n)+(p.bot?' (bot)':''):'<span class="h3n">libre</span>';
function equipos(V){return V.eq.map((t,e)=>`<div class="h3n"><b>Equipo ${e+1}:</b> ${t.map(nom).join(' y ')}</div>`).join('')}
function panelLibre(){const ks=gente();
 return win(`<div class="h3d">Bola 8: mete tus bolas (lisas o rayadas) y al final la 8.</div>
  <div class="ui-lbl">Nivel del bot</div><div class="ui-seg" role="group" aria-label="Nivel del bot">${NIV.map((n,i)=>`<button class="${i===niv?'on':''}" onclick="BIH.niv(${i})">${n}</button>`).join('')}</div>
  <div class="h3b"><button class="ui-btn" onclick="BIH.bot()">Jugar contra bot</button><button class="ui-btn sec" onclick="BIH.dos()">2 contra 2</button></div>
  <div class="ui-lbl">Retar a alguien</div><div class="h3b">${ks.map(p=>`<button class="ui-btn sec" onclick="BIH.reta('${esc(p.id)}')">${esc(p.n)}</button>`).join('')||'<span class="h3n">No hay nadie más en el sótano.</span>'}</div>`)}
function panelArma(V,me){const org=V.org===me,o=V.eq[0][0],seg=Math.ceil((V.left||0)/1000);
 if(V.modo===1){if(org)return win(`<div class="h3d">Esperando a que <b>${esc(V.eq[1][0]?V.eq[1][0].n:'tu rival')}</b> acepte…</div><div class="h3n">${seg} s</div>
  <div class="h3b"><button class="ui-btn sec" onclick="BIJ.act('salir')">Cancelar</button></div>`,"BIJ.act('salir')");
  return win(`<div class="h3d"><b>${esc(o&&o.n)}</b> te reta al Billar</div><div class="h3b"><button class="ui-btn" onclick="BIJ.act('unir')">Jugar</button>
  <button class="ui-btn sec" onclick="BIH.no()">Ahora no</button></div>`,'BIH.no()')}
 const dentro=!!V.yo,hueco=e=>V.eq[e].includes(null);
 const bs=dentro?(org?`<button class="ui-btn" onclick="BIJ.act('empezar')">Empezar</button><button class="ui-btn sec" onclick="BIJ.act('salir')">Cancelar</button>`
  :`<button class="ui-btn sec" onclick="BIJ.act('salir')">Salir</button>`)
  :[0,1].filter(hueco).map(e=>`<button class="ui-btn${e?' sec':''}" onclick="BIJ.act('unir',{e:${e}})">Entrar al equipo ${e+1}</button>`).join('');
 return win(`<div class="h3d">2 contra 2 · ${dentro?(org?'Al empezar, los huecos se llenan con bots.':'Esperando a que empiece.'):'Elige equipo.'}</div>${equipos(V)}<div class="h3n">${seg} s</div><div class="h3b">${bs}</div>`,
  dentro?"BIJ.act('salir')":'BIH.cierra()')}
// lo que va en la pantalla fuera de la partida (o '')
function hud(V,me,cerca,touchy){
 if(V.fase==='arma'){if(V.yo)return panelArma(V,me);
  if(V.inv===me)return open?panelArma(V,me):aviso(`${esc(V.eq[0][0]&&V.eq[0][0].n)} te reta al Billar`,'Toca para responder');
  if(V.modo===2&&!V.inv&&cerca&&V.eq.some(t=>t.includes(null)))return open?panelArma(V,me):aviso('Billar 2 contra 2','Toca para entrar a un equipo',!touchy);
  open=false;return ''}
 if(V.fase!=='libre'||!cerca){open=false;return ''}
 return open?panelLibre():aviso('Jugar Billar','Bola 8 · contra bot o retando'+(touchy?' · toca para empezar':''),!touchy)}
const BIH=window.BIH={hud,abre:()=>{open=true;rr()},cierra:()=>{const o=open;open=false;rr();return o},
 niv:i=>{niv=i;try{localStorage.setItem('bil_niv',i)}catch(e){}rr()},
 bot:()=>{open=false;act('retar',{modo:1,bot:1,niv})},dos:()=>{open=false;act('retar',{modo:2,niv})},
 reta:id=>{open=false;act('retar',{modo:1,a:id,niv})},no:()=>{open=false;act('rechazar')}};
})();
