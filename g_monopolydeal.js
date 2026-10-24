// Monopoly Deal: reglas en el servidor (módulo cargado por server.js).
// Etapa 1: robar, jugar hasta 3 cartas, banco, propiedades, comodines, descartar a 7, ganar con N sets.
// Estado: G.hands, G.bank[k]=[ids], G.tb[k]={color:[ids]} (propiedades por color), G.hs[k]={color:{h,hh}} (casa/hotel), G.pa = acción pendiente (etapa 3)
const NEED=[2,3,3,3,3,3,3,2,4,2];        // tamaño del set por color
const RENT=[[1,2],[1,2,3],[1,2,4],[1,3,5],[2,3,6],[2,4,6],[2,4,7],[3,8],[1,2,3,4],[1,2]];
const CN=['café','celeste','rosa','naranja','rojo','amarillo','verde','azul','ferrocarril','servicio'];
// Mazo oficial de 106 cartas. t: m dinero, p propiedad, w comodín de propiedad, a acción, r renta
const CAT=[],add=(n,o)=>{for(let i=0;i<n;i++)CAT.push({...o})};
[[1,6],[2,5],[3,3],[4,3],[5,2],[10,1]].forEach(([v,n])=>add(n,{t:'m',v}));
[[0,1,['Mediterráneo','Báltica']],[1,1,['Oriental','Vermont','Connecticut']],[2,2,['St. Charles','Virginia','States']],[3,2,['St. James','Tennessee','Nueva York']],
 [4,3,['Kentucky','Indiana','Illinois']],[5,3,['Atlantic','Ventnor','Marvin']],[6,4,['Pacific','N. Carolina','Pennsylvania']],[7,4,['Park Place','Boardwalk']],
 [8,2,['Reading','Penn.','B&O','Short Line']],[9,2,['Eléctrica','Agua']]].forEach(([c,v,ns])=>ns.forEach(n=>add(1,{t:'p',c,v,n})));
[[[7,6],4,1],[[1,0],1,1],[[3,2],2,2],[[4,5],3,2],[[6,8],4,1],[[1,8],4,1],[[8,9],2,1]].forEach(([cs,v,n])=>add(n,{t:'w',cs,v}));add(2,{t:'w',cs:'any',v:0});
[['tratosucio',5,2],['dino',4,3],['ladron',3,3],['forzoso',3,3],['cobro',3,3],['cumple',2,3],['salida',1,10],['casa',3,3],['hotel',4,2],['doble',1,2]].forEach(([k,v,n])=>add(n,{t:'a',k,v}));
[[0,1],[2,3],[4,5],[6,7],[8,9]].forEach(cs=>add(2,{t:'r',cs,v:1}));add(3,{t:'r',cs:'any',v:3});
const AN={tratosucio:'Trato sucio',dino:'Di que no',ladron:'Ladrón',forzoso:'Trato forzoso',cobro:'Cobro',cumple:'Es mi cumpleaños',salida:'Pasa por la salida',casa:'Casa',hotel:'Hotel',doble:'Doble renta'};
const cs2=c=>c.cs=='any'?'multicolor':c.cs.map(x=>CN[x]).join('/');
const cname=id=>{const c=CAT[id];return c.t=='m'?'$'+c.v+'M':c.t=='p'?c.n:c.t=='w'?'comodín '+cs2(c):c.t=='r'?'renta '+cs2(c):AN[c.k]};
function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const lg=(G,k,t,c)=>{(G.log=G.log||[]).push({k,t,c,n:G.ln=(G.ln||0)+1});if(G.log.length>12)G.log.shift()};
function pull(G){if(!G.deck.length&&G.disc.length){G.deck=shuf(G.disc);G.disc=[]}return G.deck.pop()}
function drawN(G,k,n){let g=0;while(g<n){const x=pull(G);if(x===undefined)break;G.hands[k].push(x);g++}return g}
const sets=(G,k)=>Object.keys(G.tb[k]).filter(c=>G.tb[k][c].length>=NEED[c]).length;
const canColor=(c,col)=>Number.isInteger(col)&&col>=0&&col<=9&&(c.t=='p'?c.c==col:c.cs=='any'||c.cs.includes(col));
function checkWin(R,k){const G=R.G;if(G.phase=='play'&&sets(G,k)>=G.opts.sets){G.win=k;G.phase='final';G.pa=null}}
function startTurn(R){const G=R.G,k=G.turn;G.plays=0;G.step='play';G.pa=null;G.note='';const g=drawN(G,k,G.hands[k].length?2:5);lg(G,k,'robó '+g+' cartas')}
function nextTurn(R){const G=R.G,n=G.players.length;do{G.turn=(G.turn+1)%n}while(R.players[G.turn].out);G.tc++;startTurn(R)}
function deal(R){const G=R.G,n=R.players.length;G.deck=shuf([...Array(CAT.length).keys()]);G.disc=[];
 G.hands=R.players.map(p=>p.out?[]:G.deck.splice(0,5));G.bank=R.players.map(()=>[]);G.tb=R.players.map(()=>({}));G.hs=R.players.map(()=>({}));
 do{G.turn=Math.floor(Math.random()*n)}while(R.players[G.turn].out);
 G.tc++;G.win=-1;G.log=[];G.dn=(G.dn||0)+1;G.rlUntil=Date.now();G.cdUntil=Date.now()+3000;R.pb=null;R.cl={};startTurn(R)}
function start(R){R.G={phase:'play',players:R.players.map(p=>({id:p.id,name:p.name})),round:0,scores:[],tc:0,opts:{sets:R.opts.sets}};deal(R)}
function view(R,tok,me,now){const G=R.G,v={...G,hands:G.hands.map((h,i)=>i==me?h:h.length),deck:G.deck.length,disc:G.disc.slice(-1),dc:G.disc.length,cd:Math.max(0,G.cdUntil-now),rc:0};
 delete v.rlUntil;delete v.cdUntil;return {G:v,claim:false,pend:false}}
function kick(R,k){const G=R.G;G.disc.push(...G.hands[k],...G.bank[k],...Object.values(G.tb[k]).flat());G.hands[k]=[];G.bank[k]=[];G.tb[k]={};G.hs[k]={};
 const left=R.players.map((p,i)=>i).filter(i=>!R.players[i].out);
 if(left.length<2){G.phase='final';G.win=left[0]??-1;G.pa=null;return}
 if(G.turn==k)nextTurn(R)}
function act(R,tok,m){const G=R.G,i=R.players.findIndex(p=>p.tok==tok),t=m.t;
 if(G.phase!='play')return 'La partida terminó.';
 if(i<0||i!=G.turn)return 'No es tu turno.';
 if(Date.now()<G.cdUntil)return 'Espera a que termine la cuenta regresiva.';
 const h=G.hands[i],id=m.id;
 if(t=='discard'){if(G.step!='disc')return 'Solo descartas al terminar tu turno, si tienes más de 7 cartas.';if(!h.includes(id))return 'Jugada inválida.';
  G.hands[i]=h.filter(x=>x!=id);G.disc.push(id);lg(G,i,'descartó '+cname(id),id);if(G.hands[i].length<=7)nextTurn(R);return}
 if(G.step=='disc')return 'Tienes más de 7 cartas: descarta hasta quedarte con 7.';
 if(t=='end'){if(h.length>7){G.step='disc';return}nextTurn(R);return}
 if(t=='move'){const c=CAT[id],col=+m.col;let from=-1;for(const k in G.tb[i])if(G.tb[i][k].includes(id))from=+k;
  if(from<0||c.t!='w')return 'Solo puedes mover comodines que ya están en tu mesa.';if(!canColor(c,col))return 'Ese comodín no sirve para ese color.';if(col==from)return;
  G.tb[i][from]=G.tb[i][from].filter(x=>x!=id);if(!G.tb[i][from].length)delete G.tb[i][from];(G.tb[i][col]=G.tb[i][col]||[]).push(id);
  lg(G,i,'movió '+cname(id)+' a '+CN[col],id);checkWin(R,i);return}
 if(G.plays>=3)return 'Ya jugaste 3 cartas este turno: termina tu turno.';
 if(!h.includes(id))return 'Jugada inválida.';const c=CAT[id];
 if(t=='bank'){if(c.t=='p'||c.t=='w')return 'Las propiedades no se guardan en el banco.';
  G.hands[i]=h.filter(x=>x!=id);G.bank[i].push(id);G.plays++;lg(G,i,'guardó '+cname(id)+' en el banco',id);return}
 if(t=='prop'){if(c.t!='p'&&c.t!='w')return 'Esa carta no es una propiedad.';const col=c.t=='p'?c.c:+m.col;if(!canColor(c,col))return 'Elige un color válido para ese comodín.';
  G.hands[i]=h.filter(x=>x!=id);(G.tb[i][col]=G.tb[i][col]||[]).push(id);G.plays++;lg(G,i,'puso '+cname(id)+' ('+CN[col]+')',id);checkWin(R,i);return}
 if(t=='go'){if(c.k!='salida')return 'Esa carta no es «Pasa por la salida».';
  G.hands[i]=h.filter(x=>x!=id);G.disc.push(id);G.plays++;lg(G,i,'jugó Pasa por la salida',id);const g=drawN(G,i,2);lg(G,i,'robó '+g+' cartas');return}
 return 'Acción desconocida.'}
module.exports={id:'monopolydeal',name:'Monopoly Deal',min:2,max:5,opts:{sets:3},rng:{sets:[2,4]},start,view,act,kick,CAT,NEED,RENT};
