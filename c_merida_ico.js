// MIC: íconos de trazo de Mérida en Venta (en lugar de emojis). Se suman a HZI.D, así sirven en HTML (MIC.h) y en canvas (HZI.draw).
(()=>{
Object.assign(HZI.D,{
 salida:'M20 12H6M11 6l-6 6 6 6',
 carcel:'M5 4h14v16H5zM9 4v16M12 4v16M15 4v16',
 playa:'M3 11a9 7 0 0 1 18 0zM12 11l-3 9M4 21h16',
 policia:'M4 10l8-4 8 4-8 3zM6 11v3c2 1.5 10 1.5 12 0v-3M5 18h14',
 suerte:'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18M9.5 9.5a2.5 2.5 0 1 1 3.8 2.1c-.8.5-1.3 1.1-1.3 2.1M12 16.8h.01',
 regalo:'M4 9h16v4H4zM5 13h14v8H5zM12 9v12M12 9C11 6 7 5 7 7.5S10 9 12 9c2 0 5-.5 5-1.5S13 6 12 9',
 recibo:'M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21zM9 8h6M9 12h6M9 16h4',
 bus:'M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12H5zM5 11h14M8 17v3M16 17v3M8 14h.01M16 14h.01M9 6h6',
 rayo:'M13 2L5 14h6l-1 8 8-12h-6z',
 hotel:'M5 21V5h14v16M3 21h18M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4',
 llave:'M5 15a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0M10.5 12.5L19 4M16 7l2.5 2.5',
 martillo:'M14 4l6 6-3 3-6-6zM12.5 8.5L4 17a1.4 1.4 0 0 0 3 3l8.5-8.5',
 billete:'M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5M6 10v4M18 10v4',
 puerta:'M6 21V4h9v17M3 21h18M12 12h.01M15 4l4 2v15',
 sombrero:'M3 16c0 2 18 2 18 0 0-1.3-4-2-4-2 0-5-2-8-5-8s-5 3-5 8c0 0-4 .7-4 2zM7 13c3 1 7 1 10 0',
 hamaca:'M3 5v15M21 5v15M3 8c3 9 15 9 18 0M3 8c3 5 15 5 18 0',
 tricitaxi:'M3.5 17a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0M15.5 17a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0M6 17l4-7h6l2 7M10 10V5h8l1 5M13 10v7',
 panucho:'M3 14a9 4 0 0 0 18 0zM5 13c1-2 3-2 4-1s3 0 4-1 3 0 4 1 2 1 2 1',
 huipil:'M8 3L3 7l2 3 3-1v12h8V9l3 1 2-3-5-4c-1 2-3 2-4 2S9 5 8 3zM8 13h8M8 16h8',
 guayabera:'M8 3L3 6l2 4 3-1v12h8V9l3 1 2-4-5-3-4 4zM10 12v8M14 12v8'});
const SQ={go:'salida',jail:'carcel',free:'playa',gtj:'policia',s:'suerte',c:'regalo',tax:'recibo',r:'bus'},UT={CFE:'rayo',JAPAY:'gota'};
const sq=s=>s.t=='u'?UT[s.n]||'idea':SQ[s.t]||'';
window.MIC={sq,h:(n,c)=>n?HZI.h(n,c):'',s:(s,c)=>{const n=sq(s);return n?HZI.h(n,c):''},draw:HZI.draw};
})();
