// Backgammon como juego de la sala: tablero en HTML (las reglas están en g_bg.js). Se registra en GM.bg
// Arriba los puntos 12→23, abajo 11→0. El jugador 0 (fichas claras) avanza hacia el 0 (abajo a la derecha); el 1 (oscuras) hacia el 23.
// Tocas una ficha que se pueda mover y luego a dónde (se iluminan). 25 = la barra, -1 = sacar.
(function(){
let bsel=null;
const rules='Saca tus 15 fichas antes que tu rival. Los dados se tiran solos al empezar cada turno; cada dado es un movimiento (dobles = 4). No puedes caer donde el otro tiene 2 o más fichas; si cae sobre una sola, se la comes y va a la barra. Con fichas en la barra, primero las metes. Cuando todas tus fichas están en tu casa, empiezas a sacarlas.';
const chk=(n,k)=>{let h='';for(let j=0;j<Math.min(n,5);j++)h+=`<i class="bgk k${k}"></i>`;return h+(n>5?`<em>${n}</em>`:'')};
function pt(i){const G=V.G,v=G.pts[i],k=v>0?0:1,mine=G.phase=='play'&&G.turn==V.me,from=mine&&bsel==null&&G.mv.some(m=>m[0]===i),dst=mine&&bsel!=null&&G.mv.some(m=>m[0]===bsel&&m[2]===i);
 const lst=G.last&&(G.last[0]===i||G.last[1]===i);return `<div class="bgp ${i>=12?'up':'dn'} ${i%2?'pa':'pb'}${from?' can':''}${dst?' dst':''}${bsel===i?' sel':''}${lst?' lst':''}" onclick="bgx(${i})">${v?chk(Math.abs(v),k):''}</div>`}
function side(p,row){const G=V.G,mine=G.phase=='play'&&G.turn==V.me,me=G.turn,
 bar=`<div class="bgbar${mine&&me==p&&bsel==null&&G.mv.some(m=>m[0]===25)?' can':''}${bsel===25&&me==p?' sel':''}" onclick="bgx(25)">${chk(G.bar[p],p)}</div>`,
 off=`<div class="bgoff${mine&&me==p&&bsel!=null&&G.mv.some(m=>m[0]===bsel&&m[2]===-1)?' dst':''}" onclick="bgx(-1)" title="Fichas que ya sacó">${G.off[p]?`<b>${G.off[p]}</b>`:''}</div>`;
 const L=row=='up'?[12,13,14,15,16,17]:[11,10,9,8,7,6],Rr=row=='up'?[18,19,20,21,22,23]:[5,4,3,2,1,0];return `<div class="bgrow ${row}">${L.map(pt).join('')}${bar}${Rr.map(pt).join('')}${off}</div>`}
const die=(v,used)=>`<i class="bgdie${used?' u':''}">${'⚀⚁⚂⚃⚄⚅'[v-1]||''}</i>`;
function dice(){const G=V.G;if(!G.dice[0])return '';const dbl=G.dice[0]==G.dice[1],left=G.left.slice();
 const ds=dbl?[0,1,2,3].map(j=>die(G.dice[0],j>=left.length)):G.dice.map(v=>{const k=left.indexOf(v),u=k<0;if(!u)left.splice(k,1);return die(v,u)});return `<div class="bgdice">${ds.join('')}</div>`}
const who=k=>{const G=V.G;return `<div class="seat c4pl${G.phase=='play'&&G.turn==k?' on':''}" data-seat="${k}"><i class="bgk k${k}"></i><b>${esc(G.players[k].name)}${k==V.me?' (tú)':''}</b><span class="c4sc">${G.sc[k]}</span><small>${G.off[k]}/15</small></div>`};
function body(){const G=V.G,me=V.me,mine=G.phase=='play'&&G.turn==me;if(!mine)bsel=null;
 const st=G.phase=='final'?(G.win==me?'🏆 ¡Ganaste!':'🏆 Ganó '+nm(G.win)):mine?(G.mv.length?(bsel==null?'<b>¡Tu turno!</b> Toca una ficha que brille':'Ahora toca a dónde moverla'):'No tienes jugadas con estos dados'):me<0?mirTxt():'Turno de '+nm(G.turn)+'…';
 let h=`${H1('🎲 Backgammon')}<div class="c4top">${who(0)}<span class="vs">vs</span>${who(1)}</div><div class="top${mine?' myturn':''}">${st}</div>${dice()}<div class="bgb${mine?' go':''}">${side(1,'up')}${side(0,'dn')}</div>`;
 if(mine&&!G.mv.length)h+=`<button class="b" onclick="bgsend({t:'pass'})">Pasar</button>`;if(mine&&bsel!=null)h+=`<button class="b g sm2" onclick="bgx(null)">Cancelar</button>`;
 if(G.phase=='final')h+=`<button class="b" onclick="send({t:'reset'})">🔄 Otra partida</button><button class="b g" onclick="leave()">Salir</button>`;
 return h+logv()+`<div class="msg">${msg}</div>`+plist()+`<details><summary>Reglas</summary>${rules}</details>`}
const bgsend=m=>{bsel=null;send(m)};window.bgsend=bgsend;
window.bgx=p=>{const G=V.G;if(G.phase!='play'||G.turn!=V.me||p===null){bsel=null;return render()}
 if(bsel!=null){const m=G.mv.find(m=>m[0]===bsel&&m[2]===p);if(m){sfx('place');return bgsend({t:'move',from:m[0],die:m[1]})}}
 bsel=G.mv.some(m=>m[0]===p)&&bsel!==p?p:null;if(bsel!=null)sfx('card');render()};
GM.bg={name:'Backgammon',emoji:'🎲',max:2,rules:`<details><summary>Reglas</summary>${rules}</details>`,
 lobby:host=>host?`<div class="box"><b>Bots</b><br><button class="b g sm2" ${V.players.length>=2?'disabled':''} onclick="send({t:'addbot'})">🤖 Jugar contra un bot</button></div><button class="b" ${V.players.length!=2?'disabled':''} onclick="send({t:'start'})">Empezar partida</button>`:'',
 body,face:()=>({h:''}),
 win:(n,fin)=>{if(!fin||n.win<0)return;const me=n.win==V.me;sfx('win');banner(me?'🏆 ¡Ganaste!':'🏆 '+n.players[n.win].name+' ganó');confetti(me?80:30)}};
})();
