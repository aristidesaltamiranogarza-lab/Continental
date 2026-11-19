// Mérida en Venta: ritmo de los saltos de la ficha (MRIT), igual en 3D y 2D. Cerca de una colonia ajena con casas u hotel los saltos
// se hacen más lentos; si cae justo ahí, sube alto y cae fuerte (land = 0..1: 1 casa = .2, hotel = 1) para sacudir las construcciones.
(function(){
const HOP=180;
// nivel de peligro de una casilla para el jugador k: casas (1-4) u hotel (5) de otro, sin hipoteca
const lvl=(G,k,i)=>{const B=MR.B,s=B&&B[i];return s&&s.t=='p'&&G.own[i]>=0&&G.own[i]!==k&&!G.mg[i]&&G.hs[i]>0?G.hs[i]:0};
// por cada salto del camino: d = ms, h = alto relativo (1 = normal), land = fuerza de la caída final
function hops(G,k,path,jail){const n=path.length;return path.map((q,j)=>{
 if(jail)return {d:HOP,h:1,land:0};let f=0;for(let m=0;m<3&&j+m<n;m++){const L=lvl(G,k,path[j+m]);if(L)f=Math.max(f,L/5*(1-m/3))}
 const last=j==n-1,L=last?lvl(G,k,q):0;if(L){const a=L/5;return {d:HOP*(2.4+1.6*a),h:2.2+4*a,land:a}}
 return {d:HOP*(1+2*f),h:1+.4*f,land:0}})}
// cuánto tarda en llegar caminando de a hasta b (para que dinero y cartas esperen); 0 si no camina
function total(G,k,a,b){const d=(b-a+40)%40;if(!(d>0&&d<=12))return 0;const p=[];for(let j=1;j<=d;j++)p.push((a+j)%40);return hops(G,k,p).reduce((s,x)=>s+x.d,0)}
// curva del salto: sube y baja; en la caída fuerte sube rápido, se detiene arriba y baja de golpe
const alto=(u,hp)=>{if(!hp.land)return Math.sin(u*Math.PI);if(u<.45){const v=u/.45;return 1-Math.pow(1-v,2.2)}if(u<.62)return 1;const v=(u-.62)/.38;return 1-v*v*v};
window.MRIT={HOP,lvl,hops,total,alto};
})();
