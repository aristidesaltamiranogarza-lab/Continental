// c_mdeal3d_drag.js — MD3A: soltar una carta de tu mano en la mesa del Monopoly Deal 3D.
// Zonas: 'bank' (tu banco), 'prop' (tus propiedades; col = la columna de color donde cayó) y 'centro' (acciones y descarte).
// puede(id): si esa carta se puede arrastrar ahora. suelta(id,zona,col): hace la jugada (o abre su tarjeta si hay que elegir). Regresa true si hizo algo.
// pips(): contador de jugadas (puntos) para el aviso de abajo.
(function(){
const G=()=>V.G;
function puede(id){const g=G();if(!g||V.me<0||g.turn!==V.me||g.phase!=='play'||g.pa)return false;return g.step==='disc'||(g.step==='play'&&g.plays<3)}
const menu=id=>{mdSel=id;mdFrom='h';mdFold=false;render();return true};
function suelta(id,z,col){const g=G(),c=mdCAT[id];if(!z||!puede(id))return false;
 if(g.step==='disc')return z==='centro'?(mdDo({t:'discard',id}),true):false;
 if(c.t==='m')return z==='centro'?false:(mdDo({t:'bank',id}),true);
 if(c.t==='p')return z==='centro'?false:(mdDo({t:'prop',id}),true);
 if(c.t==='w'){if(z==='centro')return false;const ok=mdCols(c).filter(x=>c.cs!=='any'||mdHasBase(g.tb[V.me][x]||[]));
  if(col!=null&&ok.includes(col))return mdDo({t:'prop',id,col}),true;if(ok.length===1)return mdDo({t:'prop',id,col:ok[0]}),true;
  if(!ok.length){bad('El multicolor necesita antes una propiedad de ese color.');return false}return menu(id)}
 // acciones y rentas: al banco como dinero, casa u hotel sobre su set, y en el centro se juegan
 if(z==='bank')return mdDo({t:'bank',id}),true;
 if(c.k==='casa'||c.k==='hotel'){const cs=mdHcols(V.me,c.k),t=c.k==='casa'?'house':'hotel';
  if(col!=null&&cs.includes(col))return mdDo({t,id,col}),true;if(z==='centro'&&cs.length===1)return mdDo({t,id,col:cs[0]}),true}
 if(z==='prop')return false;
 if(c.k==='salida')return mdDo({t:'go',id}),true;
 if(c.k==='cumple')return mdDo({t:'bday',id}),true;
 return menu(id)}
function pips(){const g=G(),left=3-g.plays;let o='<span class="md3pips" aria-label="'+left+' de 3">';
 for(let i=0;i<3;i++)o+='<i class="'+(i<left?'on':'')+'"></i>';return o+'<b>'+left+'/3</b></span>'}
window.MD3A={puede,suelta,pips};
})();
