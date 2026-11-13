// Evaluador de manos de póker (de 2 a 7 cartas) y probabilidad de ganar por Monte Carlo.
// Lo usan g_poker.js y g_poker_bot.js (servidor) y el cliente (window.PEV).
// Cartas: 0..51; rango c%13 (0=A, 1..9 = 2..10, 10..12 = J Q K), palo c/13|0.
(function(){
const V=c=>{const r=c%13;return r==0?12:r-1};   // valor: 0 = 2 … 12 = A
const B5=13**5;
function recta(m){for(let h=12;h>=4;h--)if(((m>>(h-4))&31)==31)return h;return (m&0x100F)==0x100F?3:-1}   // 3 = A2345
// Puntos de la mejor mano: categoría*13^5 + desempates. Más alto gana.
function puntos(cs){const n=new Array(13).fill(0),sm=[0,0,0,0],sc=[0,0,0,0];let m=0;
 for(const c of cs){const v=V(c),s=c/13|0;n[v]++;sm[s]|=1<<v;sc[s]++;m|=1<<v}
 const P=(cat,k)=>{let x=cat;for(let i=0;i<5;i++)x=x*13+(k[i]||0);return x};
 let fl=-1;for(let s=0;s<4;s++)if(sc[s]>=5)fl=s;
 if(fl>=0){const h=recta(sm[fl]);if(h>=0)return P(8,[h])}
 let q=-1;const t=[],p=[],u=[];for(let v=12;v>=0;v--){if(n[v]==4)q=v;else if(n[v]==3)t.push(v);else if(n[v]==2)p.push(v);else if(n[v]==1)u.push(v)}
 const resto=(...x)=>{const r=[];for(let v=12;v>=0;v--)if(n[v]&&!x.includes(v))r.push(v);return r};
 if(q>=0)return P(7,[q,resto(q)[0]]);
 if(t.length>=2)return P(6,[t[0],t[1]]);
 if(t.length&&p.length)return P(6,[t[0],p[0]]);
 if(fl>=0){const k=[];for(let v=12;v>=0&&k.length<5;v--)if(sm[fl]>>v&1)k.push(v);return P(5,k)}
 const h=recta(m);if(h>=0)return P(4,[h]);
 if(t.length)return P(3,[t[0],...resto(t[0]).slice(0,2)]);
 if(p.length>=2)return P(2,[p[0],p[1],resto(p[0],p[1])[0]]);
 if(p.length)return P(1,[p[0],...resto(p[0]).slice(0,3)]);
 return P(0,u.slice(0,5))}
const NOM=['Carta alta','Par','Doble par','Tercia','Escalera','Color','Full','Póker','Escalera de color'];
const cat=x=>Math.floor(x/B5);
function nombre(x){const c=cat(x);return c==8&&Math.floor(x/13**4)%13==12?'Escalera real':NOM[c]}
// Las 5 cartas que forman la mejor mano (para resaltarlas).
function mejores(cs){if(cs.length<=5)return cs.slice();let mj=null,mx=-1;
 const va=(i,r)=>{if(r.length==5){const x=puntos(r);if(x>mx){mx=x;mj=r}return}for(let j=i;j<cs.length;j++)va(j+1,r.concat([cs[j]]))};
 va(0,[]);return mj}
// Probabilidad de ganar contra 'riv' manos al azar (empates cuentan en partes iguales).
function equidad(mias,mesa,riv,it=300,fuera=[]){const usadas=new Set([...mias,...mesa,...fuera]),baraja=[];for(let c=0;c<52;c++)if(!usadas.has(c))baraja.push(c);
 const faltan=5-mesa.length,need=faltan+2*riv;if(need>baraja.length)return 0;let g=0;
 for(let i=0;i<it;i++){for(let j=0;j<need;j++){const k=j+(Math.random()*(baraja.length-j)|0);[baraja[j],baraja[k]]=[baraja[k],baraja[j]]}
  const tab=mesa.concat(baraja.slice(0,faltan)),yo=puntos(mias.concat(tab));let mejor=1,emp=1;
  for(let r=0;r<riv;r++){const x=puntos([baraja[faltan+2*r],baraja[faltan+2*r+1]].concat(tab));if(x>yo){mejor=0;break}if(x==yo)emp++}
  if(mejor)g+=1/emp}
 return g/it}
// Cartas que te suben de categoría en la siguiente calle (sin contar las que mejoran igual a la mesa).
function outs(mias,mesa){if(mesa.length<3||mesa.length>4)return 0;const usadas=new Set([...mias,...mesa]),ya=cat(puntos(mias.concat(mesa)));let n=0;
 for(let c=0;c<52;c++){if(usadas.has(c))continue;const x=cat(puntos(mias.concat(mesa,[c])));if(x>ya&&x>cat(puntos(mesa.concat([c]))))n++}
 return n}
const PEV={V,puntos,nombre,cat,mejores,equidad,outs};
if(typeof module!='undefined'&&module.exports)module.exports=PEV;else window.PEV=PEV;
})();
