# Casona de juegos: plan de la casa nueva

Anteproyecto (planos, corte y tabla): https://claude.ai/artifact/PX1g934RWSsWF4VdTB7Doa
Cómo se trabaja en Blender, errores y flujo: `CASA_BLENDER.md`.
Rama: `gamemash-casona` (commit y push solo ahí, nunca a main).
Este archivo es el plan. Al terminar un paso, marcarlo `[x]` con el commit.

## Idea
Casona yucateca con **patio central** y corredores de arcos. **Una sola escalera** (junto al zaguán, crujía izquierda) une los cuatro niveles; al salir de ella en cada piso está el plano para ir a una mesa. Cada nivel es su escena y la escalera es un portal, como hoy. Todo detrás de `?casa=glb` hasta que supere a la casa actual.

## Escala (no negociable)
Unidades de la casa, no metros. Personaje de pie ~2.1 (`MII.K`=0.8), cubierta de mesa a 1.55 del piso, radio de mesa 2.2, silla a la cadera del sentado. Nada se escala por cuarto ni por juego. En Blender siempre hay un maniquí de 2.1 con mesa y silla. Puerta 3.6, escalón 0.35, barandal 2.0.
Alturas libres: sótano 3.2, planta baja 5.5 (hoy 9), alta 4.2. Niveles: N−1 −3.50, N0 ±0, N+1 +5.80, N+2 +10.30.

## Distribución (lote 36 × 48; x de 0 a 36, z de 0 en la fachada hacia atrás)
Crujía del frente z 0–10, crujía izq x 0–8, corredores de 4 alrededor del patio (x 12–24, z 14–30), crujía der x 28–36.

| Nivel | Cuarto (x, z, ancho × fondo) | Juego |
|---|---|---|
| N−1 | Cantina 0,0 14×10 | Cubilete (barra), rockola |
| N−1 | Casino 14,0 22×10 | Póker, Blackjack |
| N−1 | Billar 0,17 12×13 | Billar |
| N−1 | Cava 28,10 8×10 → Cuarto oscuro 28,20 8×10 | Ruleta Rusa |
| N−1 | Bajo el patio | tierra, sin sótano |
| N0 | Zaguán 16,0 5×10 | llegada, plano |
| N0 | Salón 0,0 16×10 | Continental + estancia |
| N0 | Comedor 21,0 15×10 | Monopoly Deal |
| N0 | Patio central 12,14 12×16 (sin techo) | Uno, bajo el árbol; hamaca y gata en el corredor |
| N0 | Escalera 0,10 8×7; Baño 0,17 8×5; Cuarto libre 0,22 8×12 | (libre: dominó) |
| N0 | Cocina 28,10 8×12; Despensa; Servicio; Traspatio z 34–48 | decoración |
| N+1 | Biblioteca 0,0 16×10 con balcón | Mérida en Venta |
| N+1 | Sala de tableros 21,0 15×10 | YuCATÁN |
| N+1 | Corredor alto (vacío al patio) | Backgammon |
| N+1 | Tu cuarto 0,17 8×13 | espejo abre Mi personaje |
| N+1 | Sala de música 28,10 8×20 | la radio maneja la música |
| N+2 | Pérgola 0,0 16×10 | Rummy |
| N+2 | Azotea 16,0 20×10 | Conecta 4; tinacos, tendedero |
| N+2 | Mirador 0,17 | (libre: lotería) |

## Decidido (22 nov 2026, según el anteproyecto)
- Uno en el patio, bajo el árbol.
- Lote de 36.
- Tu cuarto y sala de música: sí.
- Dominó (cuarto libre PB) y lotería (mirador) como siguientes juegos.

## Pasos (una sesión cada uno; esfuerzo sugerido)
Al empezar una sesión: "Sigue CASONA.md, paso N". Leer este archivo, **siempre el anteproyecto** (enlace arriba, con Artifact read: coordenadas de mesas, vanos y decoración salen de ahí) y la sección de `CASA_BLENDER.md` que haga falta.

- [x] **1. Maqueta de cajas** (hecho: `blender/casona.py` → `modelos/casona/{nm1,n0,n1,n2}.glb`; `c_casona_caja.js` los arma como pisos `cm1/c0/c1/c2`; probar con `/?casa=caja`; escalera de maqueta: mitad sube, mitad baja) — — esfuerzo **high**. `blender/casona.py` con muros, losas, vanos y la escalera de los 4 niveles, sin texturas ni horneado. Empties: `mesa_<juego>`, `escalera`, `puerta_<x>`, `maniqui`. Exportar un GLB por nivel y verlo en el juego con `?casa=caja` (mesas reales puestas desde los empties). Probar 840×360 y 360×840.
- [x] **2. Lectura de marcadores y choques** (hecho: `c_casa_marcas.js` → `MARC.leer(root)` da mesas, escaleras con destino `to`, puertas, llegada, choques, líneas de corte y límites; CAJA ya no tiene coordenadas a mano; `tests/casona_marcas.js` revisa los GLB) — esfuerzo **high**. Módulo nuevo que lee los empties del GLB (mesas, escalera, puertas) y los choques (segmentos exportados desde Blender) en vez de coordenadas a mano.
- [x] **3a. Planta baja: salón, zaguán y comedor** (hecho: `blender/casona_pb.py` arma la planta baja detallada sobre los datos de `casona.py` y la hornea → `modelos/casona/pb.glb` + `pb_luz.jpg`; `c_casona_mat.js` (CMAT) pone texturas por luz horneada; CAJA la usa en `c0`, `?pb=caja` vuelve a la maqueta. Salón y comedor con pasta y cenefa, lambrín, ventanales con persianas y reja, tapetes; mecedoras, trinchador, banca, portón, arcos de cantera y arbotantes) — esfuerzo **xhigh**. Rehacer el salón de la prueba a 5.5, con luz horneada; mesas de Continental y Monopoly Deal en sus cuartos.
- [x] **3b. Planta baja: patio y corredores** (hecho en el mismo `pb.glb`: arquería sobre las 14 columnas, patio de laja sin techo, árbol en su arriate (la copa se desvanece si estás debajo), macetones, hamaca en el corredor y la gata en `gata_n0` con `GATA.nueva`) — esfuerzo **high**. Patio sin techo, arcos, árbol, hamaca y gata; mesa de Uno.
- [x] **4. Escalera única y plano "Ir a"** (hecho: escalera sube/baja en el mismo punto de los 4 niveles; al llegar desde otro nivel apareces en `llegada_escalera_<n>`; `plano_<lugar>_<n>` (junto a la escalera en cada nivel y en el zaguán) cuelga un plano enmarcado dibujado desde el GLB que abre "Ir a" (CIR, ya con los 4 niveles; tocar un nivel te lleva a su escalera); `goFloor` espera en negro a que cargue el GLB (`F.listo`)) — esfuerzo **medium**. Portales de los 4 niveles en el mismo punto; plano nuevo junto a la escalera y en el zaguán.
- [x] **5. Planta alta** (hecho 22 nov; revisada en 840×360 y 360×840) — esfuerzo **high**. Avance (22 nov): `blender/casona_pa.py` (usa `casona_pb.py` como biblioteca) ya arma y hornea la planta alta → `modelos/casona/pa.glb` + `pa_luz.jpg`; CAJA la usa en `c1` (`?pa=caja` vuelve a la maqueta). Biblioteca con libreros, sala de tableros con aparador y mecedoras, antesala, balcones con herrería, corredor con arcos rebajados y barandal 2.0 al vacío, copia ligera del patio abajo. Falta, en este orden:
  1. **Calidad de la luz horneada: resuelta en la prueba (22 nov, PC principal con RX 7600)**. El usuario la vio en el juego en zaguán y salón y dijo "mejor"; lo que aún veía mal (columnas, corredor, patio) no entra en la prueba. Causas reales y arreglos:
     - Muros metidos en otros muros (la punta entra ~.3 en el perpendicular) se horneaban negros, y el negro se corría a esquinas y uniones (quitarruido, bilineal, mipmaps). `_dentro` (horneado AO a .35, <.08, +1 texel) los marca y `_rellenar` los llena con la luz de su misma isla (`_islas`); el fondo del atlas se rellena con push-pull (`_pp`).
     - El JPG q84 metía cuadros y rayas de hasta 4.5% en muros lisos: ahora `guardar` escribe **WEBP sin pérdida** (`pb_luz.webp`, ~3 MB la planta completa).
     - CMAT: luz con B-spline bicúbica de cerca (`cubica`, solo si un texel de luz ocupa >1 pixel); cantera 512 con grano fino (la de 256 se veía pixeleada). Sol a 3° (orillas menos duras).
     - Antes: empaque al 51% (`pack_islands` margen .002), `FUERA`=.1, `PRIO_MAT`, 1000 muestras en 5 pasadas con avance en % (`_pasadas`), OIDN con normales.
     - **Sin commit a propósito**: `c_casona_caja.js` ya pide `pb_luz.webp` para `c0` (y `jpg` para `c1`); `modelos/casona/pb.glb`, `pb_luz.jpg` y `pb_luz.webp` locales son de la prueba (solo zaguán y salón): no subirlos.
  2. **Horneadas completas las dos plantas (22 nov)**: PB 27 min, PA 20 min, luz en WEBP (~1.4 MB cada una); `casona_pb.py` tiene `NOM` (`casona_pa.py` pone `pa`) para que la alta no pise `pb.glb`/`pb_luz.webp`. `c_casona_caja.js` pide `webp` en `c0` (v4) y `c1` (v2). **Falta el visto bueno del usuario** (columnas, corredor y patio en `/?casa=caja`); al aprobar: `git rm modelos/casona/pb_luz.jpg modelos/casona/pa_luz.jpg` y subir `pb.glb`, `pa.glb`, las dos `*_luz.webp`, los dos .py, `c_casona_caja.js` y este archivo.
  - Visto bueno y subido. Pendiente sin prisa: zonas aún algo pixeleadas en muros (el usuario lo pospuso).
  - Escalera nueva (`ESC` en `casona.py`, la usan los 3 scripts): tramos de 2.8 centrados con la puerta, escalón de .45 y descanso al pie; ya en la maqueta (`nm1`, `n2`). En `pb.glb`/`pa.glb` solo se movieron los marcadores (sin hornear); **los escalones nuevos entran en el próximo horneado de cada planta**. Backgammon pasó a la sala de música (32, 24.5): el corredor no cabe con radio 2.2.
  3. Revisar la planta alta en el juego (840×360 y 360×840), `node tests/casona_marcas.js`, y marcar el paso.
- [x] **6. Sótano** (hecho 22 nov: `blender/casona_sm.py` (usa `casona_pb.py` como biblioteca) hornea `modelos/casona/sm.glb` + `sm_luz.webp`; CAJA lo usa en `cm1` (`?sm=caja` vuelve a la maqueta). Piedra en todo el sótano; casino con lambrín y tapiz vino sobre alfombra, billar con tapiz verde y duela, cantina de barro con barra, botellero, bancos, mesitas y barriles, pasillo con arbotantes, cava con barricas acostadas, cuarto oscuro de cemento con cajas. Los juegos son los de hoy: `SAL.mesas(e)` pone Póker, Blackjack, Billar y la rockola donde se le diga (el sótano viejo la usa con sus coordenadas), `c_casona_sot.js` (SOTC) la llama con los empties del GLB y pone el Cubilete en la barra (CUB3), neones y cuadro en `sot_<cosa>`; la Ruleta es mesa de la casa en el cuarto oscuro. BJ3, PK3, BIJ y el HUD de c_casa3d.js aceptan `sot` o `cm1`. Mover solo empties sin hornear: `casona_sm.py -- marcas`) — esfuerzo **high**. Mover cantina, casino, billar y Ruleta a la planta nueva sin romper `SAL`, `BIL`, `CAS3`, `BJ3`.
- [x] **7. Azotea** (hecho 22 nov: `blender/casona_az.py` (usa `casona_pb.py` como biblioteca) hornea `modelos/casona/az.glb` + `az_luz.webp`; CAJA lo usa en `c2` (`?az=caja` vuelve a la maqueta). Enladrillado con pretil de cal de 2.0 y cornisa de cantera (`az_muro_p…`, con corte y choque), cubo de la escalera con tapa que se esconde con su muro del frente, pérgola de madera con bugambilia sobre piso de mosaico, tinacos en su base, tendedero con ropa, macetas y banca en el mirador; barandal de pilastras y herrería al vacío y, abajo, copia ligera de la planta alta y del patio (sin choques ni corte). Rummy y Conecta 4 los pone CAJA en los empties. **Pérgola más alta:** postes de 4.4 (eran 3.4; `PERG` en `casona.py`, también en la maqueta `n2.glb`)) — esfuerzo **medium**.
- [x] **8. Fachada y calle** (hecho 22 nov: `CCALLE` arma el exterior a la medida de la casona con `?casa=caja` (`EE()`: fachada en 17, banqueta de 1.6 como la del GLB, arroyo en -.35, vecinos desde ±18 y más bajos, `S`=.68, sin laurel; poste en (11.8, 18.3)); CAJA esconde la tira de arroyo de `pb.glb`, limita la banqueta y esconde el patio viejo (CPAT); `CIELO.ALT` ya tiene `cm1/c0/c1/c2`. `c_casona_casco.js` (CCAS): con tu Mii en la banqueta, casco ligero encima de `pb.glb` (planta alta con puertas y balcones, corredor alto al vacío, azotea con pretil, cubo, pérgola y tinacos; ~7k triángulos, un LOTE); afuera no hay letreros de mesas. El `CASCO` viejo no se usa en la casona) — esfuerzo **medium**.
- [x] **9. Decoración** (hecho 22 nov, los tres grupos en una sesión) — esfuerzo **medium**.
  - [x] Cocina y baño (22 nov): `blender/casona_pb_deco.py` (lo corre `casona_pb.py` en `armar` con `deco()`, con sus mismos ayudantes): cocina con fogón de azulejo, campana, ollas, barra con fregadero, trastero de loza, mesa con bancas, tinajero y cazos de cobre; despensa con estantes, frascos y costales; servicio con calentador, tanque de gas, escoba y cubeta; baño con azulejo a 2.4 y en el piso, regadera con murete y cortina, excusado, lavabo con espejo y toallero. Choques en los extras. CMAT: `azulejo` (talavera), `loza`, `espejo`. Este horneado de `pb.glb` ya trae la escalera nueva (`ESC`).
  - Franjas oscuras en los muros (22 nov): en una T el muro que llega terminaba en la cara de enfrente del otro y horneaba una franja del ancho del muro; `muros()` (`fin`/`corto`) ahora lo termina 2 cm dentro, como `juntas()`. Ya en este horneado de la planta baja; la alta, el sótano y la azotea lo toman en su próximo horneado (usan `P.muros()`).
  - [x] Traspatio (`traspatio2` en el mismo archivo): macetas en la barda del fondo, tres plátanos, arriate de hortalizas con borde de cantera, sendero de laja al pozo, banca bajo el mamey, tendedero con ropa, tinaja junto al lavadero y agave en maceta.
  - [x] Tu cuarto y sala de música: `blender/casona_pa_deco.py` (lo corre `casona_pa.py` con `deco()`). Cuarto: cama con cabecera y colcha, buró con lámpara, baúl, ropero y espejo de cuerpo entero; sala de música: radio de consola, discoteca baja, tocadiscos de bocina, guitarra, sillón y tapete (el Backgammon sigue en 32, 24.5). Empties `accion_<cosa>_n1` (MARC → `acciones`): CAJA pone una esfera invisible que se toca; `mipj`/`mipj2` (espejo y ropero) abren Mi personaje y `radio` cambia el volumen (`musCyc`).
- [x] **10. Casa de fondo en los juegos** (hecho 22 nov) — esfuerzo **medium**.
  - `FONDO`: con `?casa=caja` cada juego va a su nivel de la casona (`PISOC` en c_casa3d.js: Continental, Uno y Monopoly Deal en c0; Mérida y YuCATÁN en c1), también al recargar a media partida. Revisado en 840×360: Uno en el patio, Continental en el salón, Mérida en la biblioteca. La casa de fondo cuesta ~80–105 dibujos por cuadro.
  - `MRG`: ya junta las mallas del GLB (GLTFLoader les pone `userData.name`, que antes las descartaba) y, dentro del grupo del GLB, por cuarto. Ganancia chica: Blender ya junta por material.
  - `CUA`: `CUA.casona` arma los cuartos cerrados de c0, c1 y cm1 (del anteproyecto) y saca los vanos de los muros de choque del GLB (salen iguales al plano). Solo actúa con la cámara bajo el techo (primera persona): la cámara normal y la de los juegos van arriba de los muros (7–10) y desde ahí todos los cuartos se ven. En c0 casi no ahorra (Blender junta pisos y muebles de varios cuartos); en el sótano sí esconde las mesas de los otros cuartos.
  - Caminando en c0 son ~270 dibujos (132 mallas en pantalla, ~32 del exterior, más la sombra).
- [ ] **11. Quitar la bandera** — esfuerzo **medium**. Peso total, FPS en Android débil, corte en todos los cuartos; luego borrar la casa vieja.
  - [x] Peso: srv_modelos.js manda los .glb con brotli (o gzip), comprimidos una vez y guardados en memoria: pb.glb 1.7 MB → 258 KB. Por nivel ahora ~1.7 MB (c0), toda la casona ~5.6 MB; casi todo es la luz horneada (`*_luz.webp`, 2048 sin pérdida, ~1.4 MB cada una; el anteproyecto pedía ~0.5 MB). Bajarla (webp con pérdida o 1024) cambia cómo se ve: decidirlo con el usuario.
  - [ ] FPS en Android débil: probar en el teléfono (c0 caminando, Uno y Continental de fondo, sótano).
  - [x] Casona por defecto (22 nov, para probar en el teléfono); `?casa=vieja` vuelve a la casa vieja.
  - [ ] Corte en todos los cuartos; luego borrar la casa vieja.
- [x] Casona entera desde fuera (22 nov): `c_casona_fuera.js` (CFUE) pone copias de pb/pa/az a su altura con la cámara fuera (arriba solo con tu Mii fuera), franjas de losa con cornisa entre niveles y sin letreros de mesas con tu Mii fuera.

## Pendientes (pedidos por el usuario, 22 nov)
- [ ] Escalera: se ve vacía y no lleva a ningún lado (tramos sueltos en un cubo pelón, en PB y en el sótano). Rehacerla con barandal, descanso y hueco que suba de verdad; va a tomar tiempo.
- [ ] Casino del sótano: la posición de las mesas de Póker y Blackjack se ve rara (sillas encimadas, mesas apretadas); reacomodar en los empties de `casona_sm.py`.
- [ ] Barricas de la cava: se ven bien pero estorban el paso a la Ruleta Rusa; moverlas a los lados.

## Pendientes de la prueba en línea (23 nov 2026)
- Hecho (23 nov) carga: CCARGA (c_casona_carga.js) muestra logo y barra mientras goFloor espera el GLB y la luz del piso (F.prog), se quita sola; GLB y luz se reintentan sin recargar (CAJA bajaGLB, CMAT.aplicar); el fundido a negro ya no se queda pegado si falla el armado del piso.
- Calle: dejar cruzar la calle (al menos hasta la banqueta de enfrente) para ver la fachada completa. Ahora solo se llega a la puerta.
- Saltar (tecla Espacio y botón en el celular).
- Pasto: se ve feo (manchas). Opciones baratas: textura nueva sin manchas en tonos suaves más un ruido de color grande en el shader (casi sin costo); o matas de pasto en tarjetas cruzadas instanciadas solo en las orillas y alrededor de los objetos (costo bajo, se apaga en Ligero/Medio). Decidir con el usuario.
- Jardinera de los conos: las esquinas del marco parpadean donde se cruzan las piezas (z-fighting, como pasó antes con los muros). Separar o ingletear las piezas.
- Camino de piedras de la casa al pozo: ahora solo se ven sombras sueltas; hacer piedras de verdad (lajas planas en Blender, horneadas).
- Decoración: en el salón del Catan las sillas pegadas a la mesa son las viejas gigantes (usar las de escala fija); las mecedoras se ven fuera de lugar ahí, reubicarlas. El mueble de repisas con "barras" (libros/chocolates) se ve raro: cambiarlo o quitarlo. Repasar la decoración de toda la casa.
- Azotea de noche: el mapa de luz está horneado de día y se ven sombras de sol de noche. Hornear con una luz que sirva para ambos (cielo/luna difusa, sombras suaves) o un segundo horneado de noche, y que el sol/luna del juego coincida con el ángulo horneado.
- Pérgola de la azotea: mejor transición entre el piso de la azotea y el de la pérgola: un escalón bajo y un borde/barandal ligero.
- Luces: más fuentes de luz falsas horneadas (lámparas que brillan y luz en el mapa); calidad "Ultra" opcional con luces en tiempo real, sombra propia y reflejos. El objetivo sigue siendo el celular.
- Patio: la casa debe verse siempre (al menos los pisos de arriba, aunque sea en versión simple). Ahora desde el patio central solo en cierta posición se ve el piso de arriba y la azotea; al moverse desaparece (ocultamiento por piso/cuartos demasiado agresivo).
- Balcón: en la fachada trasera que da al jardín, sobre la planta baja, hay espacio para un balcón con barandal mirando al jardín.
- Menú "Ir a…": íconos enormes en la casona (arreglado el tamaño el 23 nov). Si sigue fallando, volver al corte de la casa (DH) adaptado a los 4 niveles.
- Decidido (23 nov): pasto opción B. Textura nueva suave en todas las calidades; Medio sin matas o muy pocas (debe correr en cualquier teléfono); Completo con matas de hojas visibles instanciadas y meciéndose con el viento en el shader de vértices (barato: sin física, solo seno por posición).
- Decidido (23 nov): luz de la azotea por calidad. Medio: mapa de luz sin sombras de sol, o con sombras muy suaves (sirve de día y de noche). Completo: horneado completo de día y de noche (se carga solo el que toca) y sombras en tiempo real solo de los personajes.
- App en PC/Android: ya es instalable (manifest.webmanifest). Falta un service worker (sw.js, servido en server.js) que guarde en caché GLB, texturas y mapas de luz por versión (modelos-vN) para no volver a descargarlos; borrar cachés viejos al cambiar de versión. Nada de caché para server.js/polling.
