// HZI: íconos de trazo de Haciendas (en lugar de emojis). Cada ícono es un solo "d" de 24x24,
// así sirve igual en HTML (HZI.h), dentro del SVG del tablero 2D (HZI.svg) y en canvas (HZI.draw).
(()=>{
const D={
 hoja:'M12 21V11M12 21c-1-4-4-7-8-8 2 3 3 6 3 8M12 21c1-4 4-7 8-8-2 3-3 6-3 8M12 11c-1.5-2-1.5-5 0-8 1.5 3 1.5 6 0 8',
 maiz:'M12 3c-2.5 0-4 3-4 7s1.5 7 4 7 4-3 4-7-1.5-7-4-7zM8.4 8h7.2M8 12h8M9 15.5h6M12 3v14M5 13c1 4 3.5 7 7 8 3.5-1 6-4 7-8',
 piedra:'M4 18L6.5 11 10 7l5 1 4 4 1 6zM10 7l1 5 4 1 4-1M11 12l-4.5-1',
 miel:'M8 4.5h8v3.5H8zM7.5 8C6 9.5 5 11 5 13c0 4 3 6 7 6s7-2 7-6c0-2-1-3.5-2.5-5M9 13c1.5 1.2 4.5 1.2 6 0',
 sal:'M8 10c0-3.5 1.6-6 4-6s4 2.5 4 6l1 9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1zM10.5 7h.01M13.5 7h.01M12 5.8h.01M8 13h8',
 gota:'M12 3.5c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z',
 huracan:'M9.5 12a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0M14.5 12c0-4-3-7-8-7.5M9.5 12c0 4 3 7 8 7.5',
 escudo:'M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z',
 rancho:'M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5',
 hacienda:'M3 20h18M4 20V10l8-5 8 5v10M8 20v-4a1.5 1.5 0 0 1 3 0v4M13 20v-4a1.5 1.5 0 0 1 3 0v4M10 10.5h4',
 sacbe:'M9 3L6 21M15 3l3 18M12 5v2.5M12 11v2.5M12 17v2.5',
 iglesia:'M12 2.5v4M10 4.5h4M8 21v-9l4-4 4 4v9M4 21v-6l4-3M20 21v-6l-4-3M3 21h18M11 21v-4h2v4',
 trofeo:'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5c0 3 1.5 4.5 3 4.5M16 6h3c0 3-1.5 4.5-3 4.5M12 13v4M10 17h4v3h-4zM8 20h8',
 espiga:'M12 21V7M12 7c-1.5-1-1.5-3 0-4 1.5 1 1.5 3 0 4M12 11c-2 0-3.5-1-4-3 2 0 3.5 1 4 3zM12 11c2 0 3.5-1 4-3-2 0-3.5 1-4 3zM12 15c-2 0-3.5-1-4-3 2 0 3.5 1 4 3zM12 15c2 0 3.5-1 4-3-2 0-3.5 1-4 3z',
 trato:'M4 9h14l-3.5-3.5M20 15H6l3.5 3.5',
 banco:'M3 9l9-5 9 5zM5 9v8M9.5 9v8M14.5 9v8M19 9v8M3 17h18M3 20h18',
 libro:'M4 5c3-1 5.5-1 8 1 2.5-2 5-2 8-1v14c-3-1-5.5-1-8 1-2.5-2-5-2-8-1zM12 6v14',
 carta:'M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM12 9l2 3-2 3-2-3z',
 cartas:'M4.5 7l8-2 3 13-8 2zM13.5 5.2l5 1.3-2.4 11.7',
 dado:'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 8.5h.01M15.5 15.5h.01M12 12h.01M15.5 8.5h.01M8.5 15.5h.01',
 idea:'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
 pico:'M3 9c5-4.5 13-4.5 18 0M12 6.5V21',
 canasta:'M3 10h18l-2 9H5zM7 10l3-6M17 10l-3-6M9 13v3M12 13v3M15 13v3',
 carrito:'M3 4h2.5l2 11h10l2-8H6.3M9 19.5h.01M17 19.5h.01',
 grafica:'M4 20h16M7 20v-6M12 20V8M17 20V10',
 mapa:'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
 sonido:'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10',
 mudo:'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM16 10l4 4M20 10l-4 4',
 aviso:'M12 4l9 16H3zM12 10v4M12 17h.01',
 reloj:'M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9'};
const ST='fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
// HTML: mismo marcado que UI.ico, tamaño 1.15em para ir junto al texto.
const h=(n,c)=>`<svg class="ui-ico hz-i${c?' '+c:''}" viewBox="0 0 24 24" aria-hidden="true"><path d="${D[n]||''}"/></svg>`;
// Dentro de otro SVG: centrado en (x,y), de lado s.
const svg=(n,x,y,s,c)=>`<g${c?` class="${c}"`:''}><path class="hz-g" ${ST} transform="translate(${(x-s/2).toFixed(1)} ${(y-s/2).toFixed(1)}) scale(${(s/24).toFixed(3)})" d="${D[n]||''}"/></g>`;
// Canvas: centrado en (x,y), de lado s, con el color de trazo dado.
const P2={};
function draw(g,n,x,y,s,col){if(!D[n])return;const p=P2[n]||(P2[n]=new Path2D(D[n]));g.save();g.translate(x-s/2,y-s/2);g.scale(s/24,s/24);
 g.strokeStyle=col||g.fillStyle;g.lineWidth=2.2;g.lineCap='round';g.lineJoin='round';g.stroke(p);g.restore()}
const css=document.createElement('style');css.textContent='.hz-i{width:1.15em;height:1.15em;vertical-align:-.2em}';document.head.appendChild(css);
window.HZI={D,h,svg,draw};
})();
