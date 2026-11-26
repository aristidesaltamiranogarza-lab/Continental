// Bot del Backgammon de la casa: escoge entre las jugadas válidas (g.mv: [desde, dado, hasta]) la que deja mejor tablero.
// Jugador 0 avanza hacia la casilla 0 (fichas +), jugador 1 hacia la 23 (fichas -); 25 = barra, -1 = sacada.
function apply(g,p,from,to){const s=p?-1:1,c={pts:g.pts.slice(),bar:g.bar.slice(),off:g.off.slice()};
 if(from==25)c.bar[p]--;else c.pts[from]-=s;
 if(to==-1)c.off[p]++;else{if(c.pts[to]*s==-1){c.pts[to]=0;c.bar[1-p]++}c.pts[to]+=s}return c}
const pip=(c,p)=>c.bar[p]*25+c.pts.reduce((t,v,i)=>t+(p?(v<0?-v*(24-i):0):(v>0?v*(i+1):0)),0);
// ¿puede pegarle el rival a una ficha sola en i? (alguna ficha suya detrás, a 12 o menos, o en la barra)
function riesgo(c,p,i){const o=1-p,so=o?-1:1;if(c.bar[o])return 1;
 for(let j=0;j<24;j++)if(c.pts[j]*so>0){const d=o?i-j:j-i;if(d>0&&d<=12)return d<=6?1:.4}return 0}
function score(c,p){const s=p?-1:1,o=1-p;let v=-pip(c,p)+pip(c,o)*.5+c.off[p]*14+c.bar[o]*12-c.bar[p]*12;
 for(let i=0;i<24;i++){const n=c.pts[i]*s;if(n>=2)v+=(p?i>=18:i<=5)?5:2;else if(n==1)v-=9*riesgo(c,p,i)}return v}
function pick(g,p){let best=null,bv=-Infinity;
 for(const m of g.mv){const v=score(apply(g,p,m[0],m[2]),p)+Math.random()*.5;if(v>bv){bv=v;best=m}}return best}
module.exports={pick};
