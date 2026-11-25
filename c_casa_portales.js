// c_casa_portales.js — PORT: grafo de cuartos y portales (CASONA.md V7) sin THREE, para CUA y para tests/casona_vis.js.
// cuartos [{id,...}] y portales [{a,b,...}] como los da MARC.leer; lo que no es un cuarto cerrado es 'abierto' (el último índice).
// recorrer(G, inicio, ve): cuartos visibles desde los de inicio, cruzando solo portales con ve(portal) (p. ej. en pantalla).
// hist(H, vis, t, ms): un cuarto aparece al momento y se esconde hasta ms después de dejar de verse (sin parpadeo en las orillas).
(function(){
function grafo(cuartos,portales){const idx={};cuartos.forEach((c,i)=>idx[c.id]=i);const ab=cuartos.length,V=[];
 portales.forEach(p=>{const a=p.a in idx?idx[p.a]:ab,b=p.b in idx?idx[p.b]:ab;if(a!==b)V.push({a,b,p})});
 return {n:ab+1,ab,idx,V}}
function recorrer(G,ini,ve){const vis=new Array(G.n).fill(false),cola=[];
 ini.forEach(i=>{if(i>=0&&i<G.n&&!vis[i]){vis[i]=true;cola.push(i)}});
 while(cola.length){const i=cola.shift();for(const v of G.V){const j=v.a===i?v.b:v.b===i?v.a:-1;if(j<0||vis[j])continue;if(ve(v)){vis[j]=true;cola.push(j)}}}
 return vis}
function hist(H,vis,t,ms){if(!H.t||H.t.length!==vis.length)H.t=vis.map(()=>-1e15);
 return vis.map((v,i)=>{if(v)H.t[i]=t;return t-H.t[i]<=ms})}
const PORT={grafo,recorrer,hist};
if(typeof module!=='undefined'&&module.exports)module.exports=PORT;
if(typeof window!=='undefined')window.PORT=PORT;
})();
