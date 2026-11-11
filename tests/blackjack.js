// Pruebas de las reglas del Blackjack.  Uso: node tests/blackjack.js
const assert=require('assert'),BJ=require('../g_blackjack.js');
const R={A:0,2:1,3:2,4:3,5:4,6:5,7:6,8:7,9:8,10:9,J:10,Q:11,K:12};
let n=0;const ok=(t,f)=>{try{f();n++}catch(e){console.error('x '+t);throw e}};
// Mesa con zapato armado: un jugador en el asiento 0. Orden del reparto: jugador, crupier (arriba), jugador, crupier (tapada), luego lo que se pida.
function prueba(cartas,apuesta=100,extra=[]){let t=0;const z=cartas.map(r=>R[r]).concat(Array(300).fill(R[9]));
 const B=BJ.mesa({now:()=>t,barajar:()=>z.slice()});B.t=v=>{t=v};B.av=()=>{t=B.S.plazo;B.tick()};
 B.act('a','Ana',{op:'sentar',s:0});extra.forEach(([id,s])=>B.act(id,id,{op:'sentar',s}));
 B.act('a','Ana',{op:'apostar',v:apuesta});B.act('a','Ana',{op:'listo'});
 if(B.S.fase=='reparto')B.av();return B}
const yo=B=>B.view().as[0],mano=(B,i=0)=>yo(B).manos[i];
const a=(B,op)=>B.act('a','Ana',{op});

ok('total con As suave y duro',()=>{assert.deepStrictEqual(BJ.total([R.A,R[6]]),{t:17,s:true});assert.deepStrictEqual(BJ.total([R.A,R[6],R[10]]),{t:17,s:false});
 assert.strictEqual(BJ.total([R.A,R.A,R[9]]).t,21)});
ok('gana 20 contra 19',()=>{const B=prueba(['10',9,'K','J']);assert.strictEqual(B.S.fase,'turnos');
 a(B,'plantar');assert.strictEqual(B.S.fase,'crupier');B.av();assert.strictEqual(B.S.fase,'pago');assert.strictEqual(mano(B).res,'gana');assert.strictEqual(yo(B).f,1100)});
ok('blackjack paga 3 a 2 y el crupier no saca',()=>{const B=prueba(['A',9,'K',7]);assert.strictEqual(B.S.fase,'crupier');assert.strictEqual(B.S.cr.length,2);
 B.av();assert.strictEqual(mano(B).res,'bj');assert.strictEqual(yo(B).f,1150)});
ok('el crupier se planta en 17 suave',()=>{const B=prueba(['10',6,8,'A']);a(B,'plantar');assert.strictEqual(B.S.cr.length,2);B.av();
 assert.strictEqual(B.view().cr.t,17);assert.strictEqual(mano(B).res,'gana')});
ok('el crupier pide con 16 y se pasa',()=>{const B=prueba(['10',6,7,'Q','K']);a(B,'plantar');assert.strictEqual(B.S.cr.length,3);B.av();
 assert.strictEqual(mano(B).res,'gana');assert.strictEqual(yo(B).f,1100)});
ok('pedir y pasarse',()=>{const B=prueba(['10',7,6,'Q','K']);a(B,'pedir');assert.strictEqual(B.S.fase,'crupier');B.av();
 assert.strictEqual(mano(B).res,'pasa');assert.strictEqual(yo(B).f,900);assert.strictEqual(B.S.cr.length,2)});
ok('doblar',()=>{const B=prueba([5,7,6,'10','10']);a(B,'doblar');B.av();assert.strictEqual(mano(B).a,200);assert.strictEqual(mano(B).res,'gana');assert.strictEqual(yo(B).f,1200)});
ok('dividir Ases: una carta cada uno y no es blackjack',()=>{const B=prueba(['A',9,'A',7,'K',5,'10'],50);a(B,'dividir');
 assert.strictEqual(yo(B).manos.length,2);assert.strictEqual(B.S.fase,'crupier');assert.strictEqual(mano(B,0).bj,false);
 B.av();assert.strictEqual(mano(B,0).res,'gana');assert.strictEqual(mano(B,1).res,'gana');assert.strictEqual(yo(B).f,1100)});
ok('dividir hasta 4 manos',()=>{const B=prueba([8,7,8,10,8,8,8,8,8,8],10);a(B,'dividir');a(B,'dividir');a(B,'dividir');
 assert.strictEqual(yo(B).manos.length,4);assert.strictEqual(a(B,'dividir'),'Máximo 4 manos');assert.strictEqual(yo(B).f,960)});
ok('seguro paga 2 a 1 si el crupier tiene blackjack',()=>{const B=prueba(['10','A',9,'K']);a(B,'seguro');assert.strictEqual(B.S.fase,'pago');
 assert.strictEqual(yo(B).seg,50);assert.strictEqual(mano(B).res,'pierde');assert.strictEqual(yo(B).f,1000);assert.strictEqual(yo(B).neta,0)});
ok('seguro se pierde si no hay blackjack',()=>{const B=prueba(['10','A',9,7]);a(B,'seguro');assert.strictEqual(B.S.fase,'turnos');a(B,'plantar');B.av();
 assert.strictEqual(mano(B).res,'gana');assert.strictEqual(yo(B).f,1050)});
ok('rendición temprana contra blackjack del crupier',()=>{const B=prueba(['10','A',6,'K']);a(B,'rendir');assert.strictEqual(B.S.fase,'pago');
 assert.strictEqual(mano(B).res,'rinde');assert.strictEqual(yo(B).f,950)});
ok('rendirse en su turno solo con la primera mano',()=>{const B=prueba(['10',7,6,'Q']);a(B,'pedir');assert.strictEqual(a(B,'rendir'),undefined);assert.strictEqual(mano(B).ren,0);
 const C=prueba(['10',7,6,'Q']);a(C,'rendir');C.av();assert.strictEqual(yo(C).f,950)});
ok('blackjack contra blackjack es empate',()=>{const B=prueba(['A','A','K','Q']);a(B,'noseguro');assert.strictEqual(mano(B).res,'empate');assert.strictEqual(yo(B).f,1000)});
ok('tiempos: apuesta a los 15 s y se planta a los 20 s',()=>{let t=0;const B=BJ.mesa({now:()=>t});B.act('a','Ana',{op:'sentar',s:2});B.act('b','Beto',{op:'sentar',s:4});
 B.act('a','Ana',{op:'apostar',v:25});t=14999;B.tick();assert.strictEqual(B.S.fase,'apuestas');t=15000;B.tick();assert.strictEqual(B.S.fase,'reparto');
 assert.strictEqual(B.S.as[4].manos.length,0);t=B.S.plazo;B.tick();if(B.S.fase=='seguro'){t=B.S.plazo;B.tick()}
 if(B.S.fase=='turnos'){t=B.S.plazo;B.tick();assert.notStrictEqual(B.S.fase,'turnos')}
 t=B.S.plazo;B.tick();assert.strictEqual(B.S.fase,'pago');t=B.S.plazo;B.tick();assert.strictEqual(B.S.fase,'apuestas');assert.strictEqual(B.view().as[2].ult,25)});
ok('apuesta fuera de límites y lugar ocupado',()=>{const B=BJ.mesa();B.act('a','Ana',{op:'sentar',s:0});assert.ok(B.act('b','Beto',{op:'sentar',s:0}));
 assert.ok(B.act('a','Ana',{op:'apostar',v:5}));assert.ok(B.act('a','Ana',{op:'apostar',v:505}));assert.ok(B.act('a','Ana',{op:'listo'}))});
ok('se rebaraja al pasar el 75 %',()=>{const B=prueba(['10',7,9,'Q']);a(B,'plantar');B.av();B.av();assert.strictEqual(B.S.rebaraja,0);
 B.S.pos=240;a(B,'apostar');B.act('a','Ana',{op:'apostar',v:10});a(B,'listo');assert.strictEqual(B.S.rebaraja,1);assert.ok(B.S.pos<10)});
ok('recarga a 1,000 al quedarse sin fichas',()=>{const B=prueba(['10',7,6,'Q','K'],500);B.S.as[0].f=0;a(B,'pedir');B.av();B.av();assert.strictEqual(yo(B).f,1000)});
ok('si se va el del turno, sigue el siguiente',()=>{const B=prueba([2,3,5,2,3,7],100,[['b',3]]);
 assert.strictEqual(B.S.fase,'apuestas');B.act('b','b',{op:'apostar',v:10});B.act('b','b',{op:'listo'});B.av();
 assert.deepStrictEqual(B.S.turno,{s:0,m:0});B.tick(id=>id!='a');assert.strictEqual(B.S.as[0],null);assert.deepStrictEqual(B.S.turno,{s:3,m:0});
 B.act('b','b',{op:'plantar'});assert.strictEqual(B.S.fase,'crupier')});
ok('se va el único jugador: la mesa se limpia',()=>{const B=prueba(['10',7,6,'Q']);B.tick(()=>false);assert.strictEqual(B.S.fase,'apuestas');assert.strictEqual(B.S.cr.length,0)});
console.log('ok '+n+' pruebas de Blackjack');
