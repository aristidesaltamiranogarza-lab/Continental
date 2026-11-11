// c_mesa_cam.js — MCAM: la cámara viva de la mesa (Continental; después Uno). El juego guarda su vista (vt: x,z punto de la mesa al centro, k zoom,
// a giro, t inclinación) y MCAM decide lo automático: voltear un poco hacia quien tiene el turno (como girar la cabeza desde tu silla), cortes breves
// y cercanos (bajarse, comprar, cerrar), regresar sola a tu vista a los 4 s sin tocar y la vista desde arriba (doble toque o botón Arriba).
// MCAM.crea({vt, home, snap, viewed, el}) → c. c.toca() cada vez que el jugador mueve la cámara o toca la mesa; c.paso(now,{cam,turno,quieto}) →
// giro de cabeza en radianes (cam = {px,pz,lx,lz}: tu cámara y el punto que ve, sin el giro; turno = punto del mundo o null; quieto = no regresar sola).
// c.corte(vista,ms,forzar) corte a una vista que se deshace solo (o al tocar); c.arriba(si); c.dobleToque(x,y) → true si fue el segundo toque.
// Con reducir movimiento (RM) no hay cortes ni giro de cabeza. MCAM.boton(on,fn): el botón Arriba (fn: su onclick, Continental por omisión) (va junto a Recentrar).
(function(){
const RMo=()=>typeof RM!=='undefined'&&RM,ESPERA=4000,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function crea(o){const VT=o.vt;let toque=-1e9,cut=null,hd=0,tl=0,tap=null;
 const c={
  toca(){toque=performance.now();if(cut){cut=null;o.home()}},
  // corte: solo desde tu vista y si no acabas de tocar (forzar: cerrar la ronda)
  corte(v,ms,forzar){if(RMo()||cut||VT.top||(!forzar&&(performance.now()-toque<2000||o.viewed())))return false;
   cut={hasta:performance.now()+(ms||1600)};Object.assign(VT,{who:-1,c4:false,bg:false,top:false},v);o.snap();return true},
  get cortando(){return !!cut},
  arriba(si){toque=performance.now();cut=null;if(!si)return o.home();Object.assign(VT,{x:0,z:0,a:0,k:o.kTop?o.kTop():.8,t:1.45-o.el(),who:-1,top:true,c4:false,bg:false})},
  dobleToque(x,y){const t=performance.now(),d=!!tap&&t-tap.t<330&&Math.hypot(x-tap.x,y-tap.y)<40;tap=d?null:{t,x,y};if(d)c.arriba(!VT.top);return d},
  paso(now,s){const dt=Math.min(100,now-(tl||now));tl=now;
   if(cut&&now>cut.hasta){cut=null;o.home();o.snap()}
   if(!cut&&!VT.top&&!s.quieto&&o.viewed()&&now-toque>ESPERA)o.home();
   // voltear hacia el que tiene el turno: una fracción del ángulo, sin pasar de ~7°
   let g=0;const m=s.cam,p=s.turno;
   if(p&&m&&!cut&&!o.viewed()&&!RMo()){const th=wrap(Math.atan2(m.px-p.x,m.pz-p.z)-Math.atan2(m.px-m.lx,m.pz-m.lz));g=Math.max(-.12,Math.min(.12,.35*th))}
   hd+=(g-hd)*(1-Math.exp(-dt/700));if(Math.abs(hd)<1e-4&&!g)hd=0;return hd}};
 return c}
const boton=(on,fn)=>`<button class="ui-rb gj-arr${on?' on':''}" onclick="${fn||'c3dArriba()'}" title="Ver desde arriba (doble toque)" aria-label="Ver desde arriba" aria-pressed="${!!on}">${window.UI?UI.ico('arriba'):'⬇'}</button>`;
window.MCAM={crea,boton};
})();
