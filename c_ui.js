// Interfaz "Cálida": tema (Automático / Día / Noche) e iconos SVG de trazo. Se carga en <head> para que no parpadee.
(function(){
const K='casa_tema',mq=matchMedia('(prefers-color-scheme:dark)'),subs=[];
const get=()=>{try{const v=localStorage.getItem(K);return v=='dia'||v=='noche'?v:'auto'}catch(e){return 'auto'}};
let N=false;const calc=()=>{const t=get();return t=='noche'||(t=='auto'&&mq.matches)},noche=()=>N;
function aplica(){const n=N=calc();document.documentElement.dataset.tema=n?'noche':'dia';
 // los juegos viejos leen cont_dark y la clase c3dark: los dejamos en sintonía
 try{localStorage.setItem('cont_dark',n?'1':'0')}catch(e){}document.documentElement.classList.toggle('c3dark',n);subs.forEach(f=>{try{f(n)}catch(e){}})}
function setTema(t){try{t=='auto'?localStorage.removeItem(K):localStorage.setItem(K,t)}catch(e){}aplica()}
(mq.addEventListener?mq.addEventListener('change',aplica):mq.addListener(aplica));
// iconos: un solo estilo de trazo (24×24, stroke currentColor)
const P={
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 gente:'<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><path d="M15.5 5.2a3 3 0 0 1 0 5.6M17.5 14.3c1.6.7 2.6 2.3 3 4.7"/>',
 chat:'<path d="M5 18.5V7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v6a2.5 2.5 0 0 1-2.5 2.5H9z"/><path d="M9 10h6M9 13h3.5"/>',
 gesto:'<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.2c.9 1.3 2.1 2 3.5 2s2.6-.7 3.5-2"/><path d="M9.2 9.6h.01M14.8 9.6h.01"/>',
 ojo:'<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
 persona:'<circle cx="12" cy="7" r="3.2"/><path d="M6.5 20c.5-4 2.6-6.5 5.5-6.5s5 2.5 5.5 6.5"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>',
 abajo:'<path d="M6 9.5l6 6 6-6"/>',
 casa:'<path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.5V19h12V9.5"/><path d="M10 19v-5h4v5"/>',
 brujula:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2.2 4.8-4.8 2.2 2.2-4.8z"/>',
 ajustes:'<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
 musica:'<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
 sonido:'<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
 copiar:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
 compartir:'<circle cx="17.5" cy="5.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/><path d="m8.7 13.3 6.6 3.9M15.3 6.8l-6.6 3.9"/>',
 ayuda:'<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.5a2.4 2.4 0 0 1 4.6.9c0 1.6-2.3 2-2.3 3.6"/><path d="M12 16.8h.01"/>',
 salir:'<path d="M14 4.5h4.5v15H14"/><path d="M10 8l-4 4 4 4M6 12h9.5"/>',
 sol:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
 luna:'<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
 calidad:'<path d="M4 18l5-6 4 4 3-3 4 5"/><rect x="3" y="4" width="18" height="16" rx="3"/>',
 jugar:'<path d="M8 5.5v13l10.5-6.5z"/>',
 llave:'<circle cx="8" cy="15" r="3.5"/><path d="M10.5 12.5L19 4M16 7l2.5 2.5"/>',
 enviar:'<path d="M4 12l16-7-6 15-2.5-6z"/>',
 teclado:'<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7.5 14h9"/>',
 camara:'<path d="M3 8h3l2-3h8l2 3h3v11H3z"/><circle cx="12" cy="13" r="3.5"/>',
 ordenar:'<path d="M8 4v16M4.5 7.5L8 4l3.5 3.5M16 20V4M12.5 16.5L16 20l3.5-3.5"/>',
 nuevo:'<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>',
 cuadrar:'<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
 arriba:'<circle cx="12" cy="15.5" r="6"/><path d="M12 2v6.5M9 5.5l3 3 3-3"/>',
 ok:'<path d="M5 12.5l4.5 4.5L19 7"/>',
 pantalla:'<rect x="3" y="4.5" width="18" height="12" rx="2.5"/><path d="M8.5 20h7M12 16.5V20"/>'};
const ico=(n,c)=>'<svg class="ui-ico'+(c?' '+c:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+(P[n]||'')+'</svg>';
window.UI={tema:get,setTema,noche,ico,on:f=>subs.push(f)};
aplica();
})();
