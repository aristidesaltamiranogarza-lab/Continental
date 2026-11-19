// Mérida: menú de animaciones para probarlas sin jugar (solo en localhost). Trabaja sobre una copia del estado (DS) que se pasa
// al tablero (M3 o M2) con sync; "Volver a la partida" regresa al estado real. Las cartas salen con MRU.carta.
(function(){
if(!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname))return;
let DS=null,el=null,sh=null;const B=()=>MR.B,me=()=>Math.max(0,V.me|0);
const st=()=>window.MRU&&MRU.stage&&MRU.stage(),ok=()=>V&&V.game=='merida'&&V.G&&V.G.phase=='play'&&st();
const base=()=>DS||(DS=structuredClone(V.G)),go=()=>{try{st().sync(DS,MRU.selected)}catch(e){console.warn('demo:',e)}};
const props=()=>B().map((s,i)=>s.t=='p'?i:-1).filter(i=>i>=0);
function casa(){const G=base(),L=props(),i=L.find(i=>G.own[i]===me()&&G.hs[i]<4)??L.find(i=>G.hs[i]<4);if(i==null)return;if(G.own[i]<0)G.own[i]=me();G.hs[i]++;go()}
function hotel(){const G=base(),L=props();let i=L.find(i=>G.hs[i]==4);if(i!=null){G.hs[i]=5;go();return}
 i=L.find(i=>G.hs[i]<4);if(i==null)return;if(G.own[i]<0)G.own[i]=me();G.hs[i]=4;go();setTimeout(()=>{if(DS===G){G.hs[i]=5;go()}},1700)}
function vende(){const G=base(),i=props().find(i=>G.hs[i]>0);if(i==null)return;G.hs[i]--;go()}
function tira(G,a,b){G.dice=[a,b];G.rn=(G.rn|0)+1}
function mueve(){const G=base(),k=me(),a=1+Math.random()*6|0,b=1+Math.random()*6|0;G.jail[k]=0;tira(G,a,b);G.pos[k]=(G.pos[k]+a+b)%40;go()}
// a la cárcel: desde la casilla anterior para que llegue caminando; con carta, cae en Suerte (27) y sale la carta de la cárcel
function carcel(carta){const G=base(),k=me();G.jail[k]=0;G.pos[k]=carta?20:23;go();
 setTimeout(()=>{if(DS!==G)return;tira(G,3,4);G.pos[k]=10;G.jail[k]=1;go();if(carta)MRU.carta({d:'s',id:9,k,n:Date.now()},7*180+200)},700)}
function carta(d){const n=MR.D.cards[d].length;MRU.carta({d,id:Math.random()*n|0,k:me(),n:Date.now()},0)}
// caer en una colonia ajena con n casas (5 = hotel): saltos lentos al acercarse y caída que sacude (MRIT)
function caer(n){const G=base(),k=me(),N=G.players.length,o=(k+1)%N,q=[...Array(9)].map((_,j)=>(G.pos[k]+4+j)%40).find(i=>B()[i].t=='p');if(q==null)return;
 G.jail[k]=0;G.own[q]=o;G.mg[q]=0;G.hs[q]=n;go();setTimeout(()=>{if(DS!==G)return;const d=(q-G.pos[k]+40)%40,a=Math.max(1,Math.min(6,d-1));tira(G,a,d-a);G.pos[k]=q;go()},n?1500:300)}
function real(){DS=null;try{st().sync(V.G,MRU.selected)}catch(_){}}
const A=[['Poner casa',casa],['Poner hotel',hotel],['Vender casa',vende],['Tirar y mover',mueve],['Caer en 2 casas',()=>caer(2)],['Caer en hotel',()=>caer(5)],['Cárcel: casilla',()=>carcel(0)],['Cárcel: carta',()=>carcel(1)],['Carta de Suerte',()=>carta('s')],['Carta de Comunidad',()=>carta('c')]];
function abre(){if(sh){cierra();return}if(!ok())return;sh=document.createElement('div');sh.className='ui mdm-sh';
 sh.innerHTML=`<div class="mdm-hd"><b>Animaciones</b><button class="mdm-x" aria-label="Cerrar">${UI.ico('x')}</button></div><div class="mdm-gr">${A.map((a,j)=>`<button class="ui-btn sec" data-j="${j}">${a[0]}</button>`).join('')}</div><button class="ui-btn mdm-rl">Volver a la partida</button>`;
 sh.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.classList.contains('mdm-x'))return cierra();if(b.classList.contains("mdm-rl")){cierra();return real()}const a=A[+b.dataset.j];cierra();if(a&&ok())a[1]()};
 document.body.appendChild(sh)}
function cierra(){if(sh)sh.remove();sh=null}
function boton(){el=document.createElement('button');el.className='ui ui-rb mdm-rb';el.title='Animaciones';el.setAttribute('aria-label','Animaciones');el.innerHTML=UI.ico('jugar');el.onclick=abre;document.body.appendChild(el);
 setInterval(()=>{const on=!!ok();el.hidden=!on;if(!on){cierra();DS=null}},700)}
const css=document.createElement('style');css.textContent=`
.mdm-rb{position:fixed;right:12px;top:42%;z-index:70}.mdm-rb[hidden]{display:none}
.mdm-sh{position:fixed;right:68px;top:50%;translate:0 -50%;z-index:70;width:min(300px,calc(100vw - 92px));background:var(--ui-sheet);color:var(--ui-text);border:1px solid var(--ui-line);border-radius:var(--ui-r);box-shadow:var(--ui-shadow);padding:12px;display:flex;flex-direction:column;gap:10px;font-family:var(--ui-font)}
.mdm-hd{display:flex;align-items:center;justify-content:space-between;padding-left:6px}.mdm-hd b{font-weight:800;font-size:17px}
.mdm-x{width:44px;height:44px;border-radius:999px;border:0;background:var(--ui-chip);color:var(--ui-icon);display:flex;align-items:center;justify-content:center;cursor:pointer}.mdm-x svg{width:20px;height:20px}
.mdm-gr{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mdm-gr .ui-btn{min-height:44px;padding:6px 10px;font-size:14px;line-height:1.15}`;
document.head.appendChild(css);
if(document.body)boton();else addEventListener('DOMContentLoaded',boton);
})();
