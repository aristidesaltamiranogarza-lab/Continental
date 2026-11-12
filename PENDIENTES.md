# Pendientes: personaje chibi personalizable

> **Regla:** cada vez que un pendiente esté hecho, marcarlo como completado aquí (`[ ]` → `[x]`) en el mismo commit, con la fecha y una nota de una línea si cambió algo del plan. Trabajar un paso a la vez, en orden. Si algo del plan resulta mal, corregir este archivo en vez de improvisar.

## Contexto (leer esto después de /clear)
- El personaje se hace en Blender (escena "Chibi", MCP de Blender). Hay tres copias de referencia, **Frente**, **Perfil** y **Pose**, que no se tocan para el juego. El modelo de juego es la copia **Rig** (x=2.9) que crea `blender/rig.py`.
- Scripts (se corren con `exec(open(r'C:/Users/aris1/code/Continental/blender/X.py').read(), {'PRM': {...}})`):
  - `pelo.py`: casco con flequillo en picos (parámetros en K: R, W, D, SK, SIDE, ENV, EDGE, N, M, THICK, MESH).
  - `cara.py`: ojos sólidos, cejas, boca y nariz 3D; 3 opciones de cada una (`CEJAS`, `BOCAS`, `NARICES`; la 1 va en Frente/Perfil/Pose). Figuras de muestra `Cara_1..3` (copias ligadas de Frente con la opción n) en la colección "Caras", x = −7.5 + 1.45·(n−1).
  - `brazos.py`: hombros, mangas con codo y manos de mitón (AGARRE 0–1).
  - `cintura.py`: cintura entallada de la playera de Frente (opción A, 10 nov 2026: abajo 0,215 de medio ancho, antes 0,29); guarda la original como `playera_orig`, de la que parte `cuerpo_m.py`. Correr antes de ropa.py y rig.py.
  - `ropa.py`: ropa 2 (sudadera: torso y mangas infladas por la normal, capucha baja en la espalda, bolsa canguro, cordones; short) y 3 (blusa: cuello, botones, faldón; falda con tablones y doble capa), más `ropa_piernas` (piel, para short y falda); todo en versión H (de la playera, mangas y pantalón de Frente) y M (de `playera_m`/`pantalon_m`, mallas `_m`; el short M baja a 0,55 y la falda M va dentro de la prenda de arriba hasta 0,62 y se abre abajo); las piezas que van sobre la tela se proyectan con rayos (`parche`, `sobre_hombro`). Figuras de muestra `Ropa_2`, `Ropa_3` (H) y `RopaM_2`, `RopaM_3` (M, copias de Mujer) en la colección "Ropa", x = −9.0 − 1.45·(n−2) y −11.9 − 1.45·(n−2). Material nuevo `chibi_boton` (botones y cordones).
  - `pelos.py`: peinados 2–7 (`EST[n]`, mismos parámetros que pelo.py + `TUFTS` mechones en cono, `E0`/`FLARE` cortina vertical, `EXTRA` tubo/esfera). Deja mallas `pelo_n` y `pelo_n_extra` y figuras de muestra `Peinado_n` (copias ligadas de Frente) en la colección "Peinados", x = 4.6 + 2.2·(n−2). `PRM={'SOLO': [n], n: {...}}`.
  - `rig.py`: copia Frente → piezas hijas de la armadura `Rig` (28 huesos, sufijos `_I` izquierda / `_D` derecha; parte → pieza en `K['PIEZA']`, material → ranura `av_*` en `K['MAT']`), pesos, acciones, empties de sien, pistola de prueba, los peinados 2–7 de pelos.py (`K['PEINADOS']`, piezas `Pelo_n`), las caras 2–3 de cara.py (`K['CARAS']`, piezas `Cejas_n`, `Boca_n`, `Nariz_n`), la ropa 2–3 de ropa.py (`K['ROPA']`, parte → pieza en `K['ROPA_PIEZA']`: `Arriba_n`, `Abajo_n` y una sola `Piernas`; del cuerpo de mujer `Arriba_n_M`, `Abajo_n_M`, `Piernas_M` (la 1 sale de la figura Mujer); capucha, bolsa, cordones, cuello y botones van 100 % a `columna`) (las piezas `_n` con n ≥ 2 y `Piernas` quedan ocultas en Blender), y exporta `blender/chibi_prueba.glb`. Imprime choques con el pelo y triángulos por pieza.
- Acciones actuales: `Reposo`, `AgarreFrente`, `ManoCabeza` (también pone la mano izquierda plana), `PistolaSien` (no tocan los dedos), `Agarre_I` y `Agarre_D` (solo dedos: cuadro 1 relajada, cuadro 10 agarra; en three.js el tiempo es la cantidad de agarre). Empties `Sien_I`/`Sien_D` son hijos del hueso `cabeza`, con +Z local hacia afuera (+Y en three.js). Por peinado n ≥ 2: `PistolaSien_n`, `ManoCabeza_n`, `Sien_I_n`/`Sien_D_n` (si la pose del 1 no choca y la sien se mueve < `TOL_SIEN`, se copia; si no, se busca otra).
- Estado al 10 nov 2026 (paso 5): `modelos/personaje/chibi.glb` = 673 KB (meshopt; sin comprimir 2 294 KB), 73 512 tris en total; visibles por personaje ≈ 18 770 con lo más pesado en H (Pelo_4 + Arriba_3 + Mangas + Abajo_2 + Piernas + Boca_3) y ≈ 19 540 en M. Base 5 248; Arriba_1/2/3 1 680 / 2 244 / 2 264 (M: 2 448 / 3 012 / 3 032); Mangas_1 2 080 (playera, blusa y todas las M), Mangas_2 2 080 (sudadera); Abajo_1/2/3 1 568 / 1 376 / 1 360 (M igual); Piernas y Piernas_M 704; Nariz_1..3 720 c/u, Cejas_1..3 184 c/u, Boca 92 / 92 / 288; Pelo_1 5 656, Pelo_2 2 536, Pelo_3 5 812, Pelo_4 5 908, Pelo_5 5 488, Pelo_6 5 608, Pelo_7 5 192. 18 acciones, 14 empties de sien. Tarda ~50 s; sin texturas, materiales `av_*` (+ `av_boton`). El pelo se decima al 50 % antes de subdividir (`K['DECIMA']`), las mangas al 62 % después (`K['DECIMA_FIN']`); subdivisión de juego en `K['NIVEL']`. Las mangas ya no van dentro de `Arriba_n`: pieza propia `Mangas_n` (playera → 1, sudadera → 2, blusa → 1). Comprimir: `npx @gltf-transform/cli@4 prune blender/chibi_prueba.glb tmp.glb --keep-leaves true` (sin `--keep-leaves` borra los empties de sien) y luego `npx @gltf-transform/cli@4 meshopt tmp.glb modelos/personaje/chibi.glb`. meshopt parte el skin en uno por malla (31), todos con los mismos 28 huesos.
- Estilo: ver la memoria avatar-estilo (ojos sólidos, pelo mate, proporción B1, sin esquinas filosas).
- **Decisiones (no volver a preguntar):** 7 peinados compartidos (10 nov 2026: se agregó el 7, largo); hombre y mujer con el mismo esqueleto pero cuerpo distinto (10 nov 2026: la mujer tiene busto, cintura marcada y la prenda de arriba abre hasta medio muslo, `cuerpo_m.py` (playera_m ya viene subdividida: NIVEL 0 en el juego); el busto distingue el cuerpo aunque use playera y pantalón; cada prenda necesita versión H y M); 3 prendas arriba y 3 abajo; 3 cejas, 3 bocas y 3 narices; ojos fijos; colores con paleta fija (pelo, piel con 6–8 tonos, prenda de arriba, prenda de abajo); un solo GLB con todas las piezas; editor en pantalla aparte "Mi personaje"; guardado en localStorage y se manda al servidor al entrar a la sala, sin cuentas; accesorios después; sin avatar 2D.
- **Presupuesto:** 15 000–20 000 triángulos visibles por personaje (se juega en celular). Revisar siempre con lo que imprime rig.py.

## Paso 1 · Rig por piezas
- [x] Definir la convención de nombres de piezas: `Pelo_1..7`, `Cejas_1..3`, `Boca_1..3`, `Nariz_1..3`, `Arriba_1..3`, `Abajo_1..3`, y piezas fijas `Base` (cabeza, ojos, orejas, manos, zapatos). — 10 nov 2026: `Arriba_n` incluye las mangas (`Brazos`); los nombres de nodo en el GLB son esos, las mallas se llaman `Rig_<pieza>`.
- [x] Cambiar `rig.py` para que **no una todo** en `Rig_Cuerpo`: cada pieza es su propio objeto con pesos, hijo de la armadura `Rig` (mismo esqueleto). Lo actual queda como la opción 1 de cada cosa. — 10 nov 2026
- [x] Las piezas de cabeza (pelo, cejas, boca, nariz) van 100 % al hueso `cabeza`; la ropa con pesos automáticos limitados a sus huesos (como ahora). — 10 nov 2026
- [x] Materiales con nombres fijos por ranura para cambiarles el color en three.js: `av_pelo`, `av_piel`, `av_arriba`, `av_abajo` (más los fijos: ojo, boca, suela, zapato). — 10 nov 2026: los fijos se llaman `av_ojo`, `av_boca`, `av_suela`, `av_zapato`; son copias, los `chibi_*` de las figuras no cambian. Las cejas usan `av_pelo` (mismo color que el pelo).
- [x] Exportar y comprobar: mismo número de triángulos que hoy, sin choques, y que las 6 acciones sigan. — 10 nov 2026: 18 532 tris, 0 verts dentro del pelo (PistolaSien y ManoCabeza), 6 acciones. El GLB arrastra un nodo suelto `Cube` (cubo oculto de la escena, fuera de la escena glTF): limpiar algún día.

## Paso 2 · Peinados 2 a 7
- [x] Diseñar 5 peinados nuevos (mezcla para hombre y mujer, p. ej. corto rapado, despeinado, coleta, melena a los hombros, chongo). Mostrar una captura chica de cada uno antes de seguir. — 10 nov 2026: primera versión hecha (2 rapado, 3 despeinado, 4 coleta, 5 melena, 6 chongo, 7 largo (hasta media espalda; a los lados solo a los hombros para no chocar con los brazos)) y capturas mostradas; aprobados tras ajustes (lados de coleta/chongo, pelo más bajo sobre la oreja, despeinado pegado a la cabeza).
- [x] Hacerlos con `pelo.py` (otros valores de PRM y `MESH` distinto) o con un script nuevo `blender/pelos.py` si la forma no cabe en los parámetros. — 10 nov 2026: `pelos.py` (coleta y chongo necesitan piezas sueltas y la melena una cortina).
- [x] Cada peinado ≤ ~6 000 triángulos en la copia de juego (decimado incluido). — 10 nov 2026: máximo 5 908 (coleta); a la melena se le bajó a N=120, M=21.
- [x] Por cada peinado: `rig.py` calcula sus empties `Sien_I_n`/`Sien_D_n` y su acción `PistolaSien_n` sin choques (el pelo largo puede tapar la sien: revisar). — 10 nov 2026: 0 choques en 4 y 6, 1–2 vértices en 2 y 3. En la melena (5) y el largo (7) el brazo pasa por debajo de la cortina de pelo (78 y 155 vértices del brazo dentro): se ve como la mano metida bajo el pelo; revisar en el juego si molesta.
- [x] Revisar que `ManoCabeza` no atraviese ningún peinado (o tener una variante por peinado). — 10 nov 2026: 0 vértices dentro en todos; 5 y 7 tienen su propia pose, los demás copian la del 1.

## Paso 3 · Cara
- [x] 3 cejas (rectas, arqueadas, gruesas), 3 bocas (sonrisa, neutra, abierta) y 3 narices (botón, redonda, pequeña) ajustando `cara.py`. Una captura chica comparando las 3 de cada tipo. — 10 nov 2026: orden final 1 recta / neutra / botón (las de antes), 2 arqueada / sonrisa / redonda, 3 gruesa / abierta (D acostada, sin lengua) / pequeña (respingada). Captura de `Cara_1..3` de frente mostrada; falta que la apruebe el usuario.
- [x] Que todas queden en la misma posición de la cara y no choquen con el flequillo. — 10 nov 2026: mismas posiciones (proyectadas sobre la cabeza de Frente); con los 7 peinados, holgura ceja–pelo ≥ 7 mm y a lo más 1–2 vértices tapados vistos desde 35° arriba (despeinado y melena).

## Paso 4 · Ropa
- [x] Arriba: playera (la actual), sudadera (más gruesa, con capucha baja o cuello alto) y blusa (más corta o con cuello distinto). Mangas con codo como `brazos.py`. — 10 nov 2026: `ropa.py`. Sudadera = playera y mangas infladas (2,2 / 1,6 cm, resorte y puños pegados) + capucha baja en punta sobre la espalda + bolsa canguro + cordones; la capucha en rollo alrededor del cuello no se veía (la tapa la cabeza). Blusa = playera con faldón curvo + cuello camisero + 4 botones; mangas iguales a la playera. Falta que el usuario las vea.
- [x] Abajo: pantalón (el actual), short y falda. Con el short y la falda hacen falta **piernas de piel** debajo: meterlas como pieza aparte que se muestra solo con esas prendas. — 10 nov 2026: short = pantalón cortado en z 0,60 con vuelo; falda = de z 1,03 a 0,52, tablones y doble capa (no se ve hueca desde abajo); pieza `Piernas` = piernas del pantalón más delgadas desde z 0,70.
- [x] Revisar que doblen bien en `AgarreFrente`, `ManoCabeza` y `PistolaSien` (comparar contra la copia Pose como hace rig.py). — 10 nov 2026: la manga de la sudadera queda a 12 mm de media de la de la playera en las 4 poses (p5 3,6 mm en el puño, máx 15–17 mm), o sea dobla igual; capturas de PistolaSien (sudadera) y ManoCabeza (blusa) bien. Ojo: los choques de PistolaSien con melena/largo subieron a 238/461 vértices porque ahora cuentan todas las mangas (la sudadera es más gruesa bajo la cortina).
- [x] Cada prenda dentro del presupuesto (arriba ≤ ~5 000 y abajo ≤ ~2 000 triángulos). — 10 nov 2026: arriba 5 604 / 5 624 (las mangas compartidas ya son 3 456; la playera estaba en 5 040), abajo 1 376 / 1 360 (+ 704 de piernas). Lo más pesado visible ≈ 20 050.
- [x] Versión M de cada prenda sobre el cuerpo de mujer (`cuerpo_m.py`, figura `Mujer`); en rig.py como piezas `Arriba_n_M`/`Abajo_n_M` o un GLB por cuerpo (decidir). — 10 nov 2026: piezas `_M` en el mismo GLB (sigue la decisión de un solo GLB). Las prendas M salen de la misma función de ropa.py sobre `playera_m`/`pantalon_m` (sudadera y blusa largas hasta medio muslo, sin faldón); mangas iguales a las H. Pesos de la prenda de arriba M: cadera y columna (la parte de falda no sigue a los muslos: revisar cuando haya animación de caminar). Falta que el usuario las vea.

## Paso 5 · GLB completo
- [x] Exportar un GLB con todas las piezas (por ejemplo `modelos/personaje/chibi.glb`, siguiendo el flujo de modelos de preparar_modelos.js si aplica). — 10 nov 2026: rig.py exporta `blender/chibi_prueba.glb` y se comprime con gltf-transform (como preparar_modelos.js, meshopt) a `modelos/personaje/chibi.glb`. Antes, mangas como pieza propia y decimadas (3 456 → 2 080 tris; el codo sigue doblando bien en PistolaSien).
- [x] Comprimir (meshopt o Draco) y anotar aquí el peso final y los triángulos de la combinación más pesada. — 10 nov 2026: 673 KB; lo más pesado ≈ 18 770 (H) / 19 540 (M). Falta probar que cargue en three.js (paso 6).
- [x] Quitar del GLB el objeto suelto "Cube" que exporta Blender aunque no esté seleccionado. — 10 nov 2026: venía de otra escena del .blend ("Scene"); se exporta con `use_active_scene=True`.

## Paso 6 · Cliente: `c_avatar.js`
- [x] Módulo nuevo y chico `c_avatar.js` (objeto global `AV`): carga el GLB una vez, `AV.crear(codigo)` clona con SkeletonUtils, muestra solo las piezas elegidas y aplica los colores (material clonado por personaje). — 10 nov 2026: `AV.crear` es promesa (`AV.crearYa` si ya cargó); también `AV.cambiar(p,codigo)`, `AV.quita(p)`, `AV.sien(p,'D')`, `AV.pistola(p,true)`, `AV.azar(s)`. Probado en el navegador: s2p4… = 19 504 tris visibles, piezas y colores bien.
- [x] Código corto del personaje, por ejemplo `p3c1b2n1a2d3-<colores>`: `AV.codificar(obj)` y `AV.leer(codigo)`, con valores por defecto si viene mal. — 10 nov 2026: formato `s1p3c1b2n1a2d3-2051` (s cuerpo 1 H / 2 M; tras el guion índices base 36: pelo, piel, arriba, abajo).
- [x] Paletas fijas en el mismo módulo (pelo, piel, ropa) con colores del estilo Cálida. — 10 nov 2026: `AV.PAL` (8 pelo, 8 piel, 10 ropa compartida arriba/abajo).
- [x] Reproducir acciones: `AV.pose(p, 'PistolaSien')` y `AV.agarre(p, 'D', 0..1)`. — 10 nov 2026: Blender hornea todos los huesos en cada acción; al cargar, las poses pierden las pistas de dedos y `Agarre_I/D` se quedan solo con los dedos de su lado. Usa la variante `_n` del peinado. Mixer con su propio requestAnimationFrame (no corre con la pestaña oculta; cada cambio se aplica al instante).
- [x] Registrar el archivo en el mapa estático de server.js (~línea 14) y en la línea de scripts de continental3d.html (antes de c_casa3d.js).

## Paso 7 · Servidor
- [x] Guardar el código del personaje en localStorage y mandarlo al entrar a una sala; server.js lo guarda por jugador y lo regresa en el polling para que los demás lo vean. — 10 nov 2026: `AV.mio()` (localStorage `cont_av`, al azar la primera vez; `AV.mio(cod)` lo guarda); game.js lo manda en /new y /join como `av`; server.js lo valida (`avOk`, si viene mal pone uno al azar) y va en `players[i].av` de la vista.
- [x] Los bots también tienen personaje (código aleatorio con la paleta). — `avAzar()` en server.js al crear el bot.

## Paso 8 · Pantalla "Mi personaje"
- [x] Usar la skill `casa-ui` (estilo Cálida, tokens de ui.css; nunca clases w7…).
- [x] Vista previa del personaje girando y pestañas: Peinado, Cara, Ropa, Colores. Selector Hombre/Mujer que solo cambia la selección inicial.
- [x] Botón "Mi personaje" para entrar cuando sea; guardar al cerrar. — 10 nov 2026: `c_mipj.js` (MIPJ.abrir/cerrar): hoja `.ui-sheet.mid` con vista previa (arrastrar para girar), Hombre/Mujer solo cambia el cuerpo, "Al azar"; botón en Ajustes (CHUD); al cerrar guarda con `AV.mio` y manda `act {t:'av'}` si estás en una sala.
- [ ] Probar en celular vertical y horizontal, también en 21:9.

## Paso 9 · Personajes en la mesa y la sala
- [x] Poner a cada jugador con su personaje en su silla en la mesa y en la sala de espera (SALA). — 11 nov 2026: `seatSync` (c_casa3d.js) usa `AV.crearYa(av)` sentado (`AV.sentar`: muslos y rodillas a 90° por código, sin pose nueva en el GLB), pose `Reposo` en la sala y `AgarreFrente` jugando; Mii mientras carga el GLB. El código llega por `SALA.gente(k,nombres,avs)` y por `av` en el listado de salas (server.js `salas()`). Falta probar la aparición (pop) con una sala real y en celular.
- [ ] Medir FPS en celular con la mesa llena; si baja, usar una versión más ligera para los personajes lejanos.
- [ ] Usar `PistolaSien_n` y los empties de sien en la Ruleta Rusa. Pendiente junto con rehacer las animaciones de la Ruleta (hoy son Miis con IK: apuntar y la mano en primera persona).

- [x] (11 nov: Aris ya los ve sentados; la silla ya no se esconde con el personaje) Comprobar en una sala real (servidor reiniciado con `npm start`) que se ven sentados: Aris todavía no los ve en ningún lado fuera de "Mi personaje". Revisar `SALA.gente` → `seatSync` y que `players[].av` y `salas()[].av` lleguen.

## Paso 10 · Personajes caminando en la casa (antes de la mesa nueva)
- [x] Hoy tú y los demás que caminan siguen siendo Miis (`mkG`/`newAv` en c_casa3d.js, pose procedural en `pose()`). Cambiarlos por `AV.crearYa(av)` (el tuyo `AV.mio()`, los demás con su código en POST /casa). — 11 nov 2026: `mkPj`/`refresh` (Mii mientras carga el GLB o si no trae código; cambia solo si cambias tu personaje en Mi personaje); server.js guarda `av` en `casaAct` y lo regresa en `p[]`.
- [x] El GLB no trae caminar: hacerlo por código en c_avatar.js como `AV.sentar` (balanceo de muslos/rodillas y brazos con w y ph después del mixer), o una acción `Caminar` en Blender (blender/rig.py) si se ve mal. — 11 nov 2026: `AV.mueve(p,{w,ph,sal,dn,disco,bt,t})`; los huesos giran sobre los ejes del personaje vistos desde su padre; el cuerpo baja con el paso abierto. Arreglado: el mixer no reescribe huesos que no cambian, así que los giros se acumulaban (sentar salía bien por suerte); ahora se deshacen antes de cada vuelta y sentar gira al revés. Falta verlo caminar en celular.
- [x] Saludo/emotes y los dos bailes: por ahora pose `ManoCabeza` o balanceo simple; nombres y globitos a la altura del personaje (hoy usan `MII.K`). — 11 nov 2026: saludo con la mano derecha y los dos bailes por código (como los del Mii); nombre en `AV.alto` + 0,25.
- [x] Bailes de Mixamo: `blender/emotes.py` (lo llama rig.py antes de exportar) pasa los FBX de `blender/emotes/` (no se suben: licencia de Mixamo) a acciones `Twerk` (💃, 14,5 s) y `Capoeira` (🕺, 17 s), completas y cerradas en bucle sin brinco; si la cabeza o las manos quedan bajo el piso (paros de manos) sube el cuerpo. `AV.emote(p,nom)` / `AV.dur(nom)`; en la casa un baile dura lo que el clip más largo. — 11 nov 2026: chibi.glb 673 → 774 KB; URL con `?v=2` (caché de un año). Falta verlos en celular.

## Paso 11 · Mesa nueva de juego (Uno y Continental)
La mesa ovalada del juego viene de la versión 1 (una sola cámara fija). Se cambia por la mesa redonda de la casa: la misma en la sala de espera, al empezar y en la partida, sin cambio de mesa.
- [ ] Continental va primero: todo su plan está en la sección **"Mesa nueva · Continental"** (abajo).
- [x] Uno después: reusa `c_mesa3d.js`, `c_mesa_pj.js` y `c_mesa_cam.js` (mazo, descarte, manos; corte de cámara en +4, `ManoCabeza` al robar 4); quitar la mesa ovalada de c_uno3d.js. — 11 nov 2026: c_uno3d.js usa `MESA.arma` (sin logo: el anillo de flechas va al centro), MPJ (cartas en sus manos; jugar estira la mano al descarte, robar vuela la carta, ¡UNO! levanta los brazos, castigo `MPJ.cabeza` y con 4 o más `corte`), MCAM (giro de cabeza, doble toque/botón Arriba con `MCAM.boton(on,'u3dArriba()')`), lámpara y luz al turno; sin Miis ni mesa ovalada. La casa pone la misma mesa: cada juego se registra en `window.MESA_J[g]` {col,logo} y `mesaJ` la arma para cualquier mesa registrada. Prueba: `/prueba?g=uno&n=4` (contra bots). Sin la barra de cámara vieja. Falta: probar en celular.
- [ ] Rummy y Ruleta al final (hoy crean sus Miis con `mkAvatar` e IK).

## Mesa nueva · Continental
Plan del 11 nov 2026 (Aris lo arrancó el mismo día). Aris pidió una mesa dinámica, divertida e intuitiva. Cada fase se sube y se puede jugar sola. `c_continental3d.js` es GRANDE: solo cambia cómo se acomoda en la mesa y la cámara, no las reglas; lo nuevo va en módulos chicos que después reusa Uno (se registran en server.js ~línea 14 y en continental3d.html antes de c_casa3d.js).

**Cómo se siente**
- Mesa redonda de la casa (madera, canto acolchado, fieltro `COL.continental` #1F6B4A con el logo apenas marcado, lámpara colgante). Crece con los jugadores (Continental: 2 a 5); igual en vertical y horizontal (la cámara se aleja para que quepa).
- Turno: la luz de la lámpara se va despacio a su silla y el fieltro frente a él brilla; los demás lo voltean a ver.
- Personajes chibi (AV) sentados con sus cartas boca abajo en las manos (su cantidad real). Robar: la carta vuela en arco del mazo a sus manos. Descartar: sale de sus manos y cae girando en el descarte.
- Reacciones: comprar → levanta la mano (y si gana la compra le vuelan la carta y la de castigo); bajarse → festeja y sus cartas caen en abanico frente a él; pegar en bajada ajena → la bajada destella y el dueño voltea; cerrar la ronda → el ganador baila 3 s (Twerk o Capoeira) y los demás `ManoCabeza`.
- Bajadas frente a su dueño, en su zona del fieltro, derechas para ti aunque estén enfrente. Tocar a alguien acerca la vista a sus bajadas.
- Tu mano: abanico 3D abajo, curvo e inclinado, la carta sube al pasar o tocar. Al seleccionar, se iluminan los lugares donde cabe (descarte, siluetas de tu contrato, bajadas); al soltar cerca se acomoda sola. Las siluetas del contrato van en tu zona.
- Cámara viva: desde tu silla, gira un poco hacia quien tiene el turno; cortes breves y cercanos solo al bajarse, comprar o cerrar. Arrastrar gira alrededor de la mesa, pellizco o rueda acercan, doble toque = vista desde arriba (y de regreso). Regresa sola a tu vista a los 4 s sin tocar o al empezar tu turno. La barra de cámara se cambia por dos botones: Arriba y Recentrar. Con reducir movimiento (`RM`) no hay cortes.
- Tu personaje no se ve (la cámara son tus ojos, como hoy).

**Fases**
- [x] 1. `c_mesa3d.js` (MESA): mesa, sillas y lámpara. `MESA.asiento(i)` → lugar, hacia dónde mira, su mano y su zona en el fieltro; `MESA.centro` → mazo y descarte. Continental lo usa en vez de la mesa ovalada (todavía con los Miis). Hecho: radio 5+.35·n (4 → 6.4); `m.escala(k)` pone las sillas al tamaño de las personas (en la casa k = s·FONDO.MII; la tuya se esconde); la lámpara cuelga justo arriba de la vista (`lampY` en layout). Combinaciones todavía juntas, arriba y abajo del renglón del mazo (`hole` en meldLay); siluetas del contrato abajo. En vertical se asoma arriba la lámpara de la casa (no la de MESA).
- [x] 2. `c_mesa_pj.js` (MPJ): personajes AV en las sillas, cartas en sus manos y reacciones según `G.log`. Hecho: `AV.gesto(p,{cy,cx,cartas,est,mano,arr})` con giros en `AV.GE` (calibrados midiendo las manos; los brazos del chibi son cortos: la mano levantada llega al lado de la cabeza). Silla de MESA a la medida del chibi sentado (asiento en su cadera, sin pasar de sus rodillas, aro para los pies). Abanico chico entre las dos manos con el dorso a la mesa. Robar: la carta vuela del mazo a sus manos; descartar y bajarse salen de sus manos. Comprar levanta la mano; pegar en bajada ajena: el dueño voltea y la combinación destella. Al cerrar la ronda la mesa se queda 3 s (`finT` en active()): el ganador baila de pie junto a su silla y los demás `ManoCabeza`. Mientras carga el GLB siguen los Miis. Falta verlo en una ronda real completa (los jugadores de prueba no juegan).
- [x] 3. Bajadas por jugador: zonas, cartas derechas para ti, pegar arrastrando, siluetas en tu zona. Hecho: `zonas()` en MESA busca para cada asiento el rectángulo derecho más grande en su rebanada de la mesa (sin el hueco del centro); `m.marcas(cols)` marca su orilla con el color del jugador. `zoneLay` acomoda las bajadas de cada quien en su zona (las de los lados pegadas a su dueño, las tuyas hacia el centro); tus siluetas van en tu zona. Su zona brilla en su turno y tocarla te acerca a sus bajadas. Al arrastrar, si no estás encima de nada, se engancha la bajada donde cabe más cercana (a menos de 1.3) y el destino brilla más (`nearMeld`, `dragHi`). Probado con bajadas falsas; falta en partida real.
- [x] 4. `c_mesa_cam.js` (MCAM): la cámara viva. Hecho: en tu vista voltea hasta ~7° hacia la zona de quien tiene el turno (giro de cabeza, `hdNow` en cam()); cortes de frente al jugador al bajarse o comprar (1.6 s, no en tu turno ni si acabas de tocar) y al cerrar la ronda (3 s, al ganador); regresa sola a tu vista a los 4 s sin tocar (no desde Arriba ni en Conecta 4/Backgammon) y al empezar tu turno. Un dedo o clic izquierdo arrastrando en la mesa gira alrededor; clic derecho mueve; rueda o pellizco acercan; doble toque = vista desde arriba (y de regreso). Botones: Arriba (icono `arriba` en c_ui.js) y Recentrar, uno a la vez. La luz de la lámpara se va despacio a la zona del turno (`m.luzHacia`); la pantalla se esconde viendo desde arriba (`m.pantalla`). En la casa se esconde la lámpara de la casa sobre esa mesa (`t.lampara`, c_casa_amb.js). `.gj-tr .gj-view{position:static}`: el botón de vista se encimaba sobre el de junto en todos los juegos. Con RM no hay cortes ni giro.
- [x] 5. Tu mano 3D y detalles (sonidos, destellos, polvo de fieltro). Hecho: tu abanico va recargado hacia atrás (0.3 rad) y más curvo; la carta que tocas o seleccionas se endereza, sube y crece un poco (sin arco en profundidad: rompía el orden en que se enciman). Al seleccionar se iluminan las siluetas donde caben (azul, `fit`), además del descarte y las bajadas; al arrastrar, el imán (`nearTgt`) también lleva al descarte y a las siluetas, y la silueta destino brilla (`hot`). `c_mesa_fx.js` (MFX): polvo de fieltro cuando una carta cae en el descarte o en una bajada (`puff` en target/step, con su golpecito 'place' sin amontonarse) y destellos al pegar (la bajada) y al bajarse (su zona con su color); los demás roban con sonido 'draw'. Con RM no hay polvo ni destellos.
- [x] 6. Limpieza: quitar de c_continental3d.js la mesa ovalada, la barra de cámara vieja y los Miis con IK. El cuarto viejo (sin casa) se queda con el Conecta 4 y el Backgammon escondidos. Hecho (−11 KB): sin barra de cámara ni sus íconos; sin Miis en Continental (si el GLB no carga, sillas vacías y sus cartas en el fieltro); sin la cara pintada ni el Mii viejo de respaldo ni avPick. Se quedan exportados en C3D `mkAvatar` (ahora solo MII.mk), `seg` e `ik`: los usan la casa, la Ruleta y los abuelos del Rummy. Uno y la casa conservan su barra de cámara y `FONDO.mii`.
- [x] Ajustes de Aris (11 nov): zonas giradas hacia su dueño (largas a lo largo de la orilla, fuera del círculo del logo; sus cartas miran a su dueño y las de enfrente se voltean para no quedarte de cabeza); tu mano se dibuja en orden (sin prueba de profundidad, `renderOrder`; inclinadas se atravesaban) y la que señalas va encima; tu personaje se ve sentado con tus cartas boca abajo (en tu vista normal queda detrás de tu mano; se ve al girar, desde arriba y en el corte si ganas). Probado con 5.
- [x] 7. La casa usa MESA para la mesa de Continental: sala de espera, inicio y partida en la misma mesa, sin cambio. Hecho: `MESA.casa(par,{n,yo,a,y})` arma la mesa del juego a escala de la casa (s = `MESA.CASA_S`, girada `faDe(t)` como en FONDO); en c_casa3d.js `mesaJ` la rearma con las sillas de la sala (o de la partida que se ve, o 4) y tu silla del lado de la pared; `reubica` pasa a los sentados sin volver a aparecer; las cartitas se esconden con gente; al bajar (`sala.baja`) la cámara gira hacia tu silla. `sala.gente(g,n,av,yo)`. Falta: probarlo con una sala real hasta empezar.
- [ ] Al final: medir FPS en celular con 5 personajes.

**Cómo quedó (para reusar en Uno)**
- c_mesa3d.js (MESA): `MESA.arma(par,{n,col,logo,sep,hueco})` → m: `asiento(i)` {a,pos,ry,mira,mano,zona}, `centro` {mazo,descarte}, `escala(k)` sillas a tamaño de persona, `lampara(y)`, `luzHacia(p,f)`, `pantalla(v)`, `marcas(cols)`, `fieltro(col)`, `pie` (se esconde en la casa), `R` (radio con la madera, para FONDO.pinta).
- c_mesa_pj.js (MPJ): `sync(mesa,[{i,k,cod}],{dorso,listo})`, `paso(now,turno)`, `cartas(i,n)`, `mano(i)`, `arriba(i)`, reacciones `roba/estira/compra/festeja/mira/fin`, `suelta()` antes de rearmar la mesa, `hits()`. Usa `AV.gesto` (c_avatar.js).
- c_mesa_cam.js (MCAM): `crea({vt,home,snap,viewed,el})` → `toca()`, `paso(now,{cam,turno,quieto})` (giro de cabeza), `corte(vista,ms,forzar)`, `arriba(si)`, `dobleToque(x,y)`; `MCAM.boton(on)` en top.right junto a `GHUD.view`.
- c_mesa_fx.js (MFX): `polvo(par,pos,k)`, `destello(par,pos,w,h,col)`, `paso(now)`.
- En c_continental3d.js: `buildTable` (arma MESA y el cuarto viejo), `zoneLay`/`meldLay` (bajadas por zona), `pjLog`/`fxLog` (reacciones y efectos desde `G.log`), `vivo` (cámara viva y luz), `corte`, `nearTgt`/`dragHi` (imán al arrastrar), `finT` en `active()` (3 s del baile al cerrar la ronda).

## Otros pendientes (de la lista anterior)
- [ ] FPS bajan cerca de las dos mesas altas del sótano (cantina, `mesa_cantina`): medir ocultando vasos, rockola y luces de esa zona.
- [ ] Un cuadro de 244 ms al entrar al sótano (`CASA3D.ir('sot')`): probablemente armar el piso o compilar shaders.
- [ ] Ruleta Rusa: ver la sección «Ruleta Rusa con los personajes nuevos» (abajo).
- [ ] D7 medición en dispositivos: celular y PC modesta, en Medio y Completo (FPS, memoria, si Safari recarga la página). Para el iPhone: `http://<IP de la PC>:3000/?medir` en la misma Wi‑Fi.
- [ ] Paso 5 de la UI (prompt_ui.md), en pausa.
- [x] 4d Mesas ocupadas: c_casa_ocupada.js (OCUP), mazo, pila, cartas que vuelan y aro de turno.
- [ ] Monopoly Deal en su mesa (hoy es pantalla 2D): ver «Juegos nuevos» (abajo).
- [ ] Fase 5: Blackjack, Póker y Billar jugables en el sótano: ver «Juegos nuevos» (abajo).

## Ruleta Rusa con los personajes nuevos (plan del 11 nov 2026)
Orden: revólver → personajes → animaciones → pulido. Cada paso depende del anterior (las poses salen de la forma de la cacha). Hoy `c_ruleta3d.js` (46 KB) arma Miis con `mkAvatar` + IK (`seg`/`ik`), el arma con `mkGun()` (~línea 136, cubos) en dos copias: `gunW` (mundo) y `gunV` (vista en primera persona, hijo de la cámara `CA`); `buildMyHand(p)` (~158) arma la mano en primera persona con brazos Mii; los modos de pose son `null`/'hold'/'aim'/'head' (~185–215); los eventos `spin`/`click`/`bang` (~170) disparan sonido, sacudida y `death()`.

Decidido (11 nov): western clásico de acción simple (martillo grande, tambor fijo, puerta de carga, varilla eyectora); niquelado claro + cacha de madera miel; tamaño ~1.15× real (que se note sin exagerar); primera persona en tu turno; carga animada de la bala al inicio y tras cada bang; giro del tambor con la mano izquierda; muerte al frente sobre la mesa con ragdoll híbrido; el arma se avienta y se desliza por la mesa al siguiente.

### R1 · Revólver en Blender (blender/revolver.py, nuevo)
- [x] Piezas extra para la carga: `Rev_Puerta` (puerta de carga, lado derecho, eje `Rev_EjePuerta`), `Rev_Varilla` (varilla eyectora, se desliza), `Rev_Bala` y `Rev_Casquillo` (sueltas); empty `Rev_Recamara` (recámara alineada con la puerta).
- [x] Script con parámetros en `K` (como los demás .py), se corre con exec() vía MCP. Estilo chibi: robusto y algo grande, bordes redondeados (bevel), sin esquinas filosas; 2–3 k tris.
- [x] Piezas separadas: `Rev_Cuerpo` (armazón + cañón), `Rev_Tambor` (6 recámaras, girará en código), `Rev_Martillo`, `Rev_Gatillo`, `Rev_Cacha` (madera).
- [x] Empties: `Rev_Agarre` (donde va la palma; +Y del empty = hacia el cañón), `Rev_Boca` (salida del fogonazo/humo), `Rev_EjeTambor` (pivote del tambor), `Rev_EjeMartillo`, `Rev_EjeGatillo`.
- [x] Materiales: acero claro con brillo visible (el arma actual se ve negra: subir base color y bajar metalness o dar roughness media), cacha de madera cálida, detalles (tornillos, mira) en latón o acero oscuro. Nombres de material `rev_*`.
- [x] Exportar `blender/revolver.glb` (y copiarlo a `modelos/` si va por jsDelivr, ver memoria modelos-3d: etiqueta `modelos-vN`).
- [x] Reemplazar la "pistola de prueba" de rig.py por el revólver (unirlo al hueso de la mano con `Rev_Agarre`) y rehacer `PistolaSien` y `PistolaSien_n` para los 7 peinados; revisar choques con melena/largo (antes 238/461 vértices) y los empties `Sien_I_n`/`Sien_D_n`.
- Hecho: blender/revolver.py → blender/revolver.glb (7.5k tris, ESC 1.25). rig.py: Rig_Pistola es la copia fija (no se exporta) y Rig_Agarre (hijo de mano_D) es donde va Rev_Agarre; PistolaSien: boca abajo de la oreja y cañón al centro de la cabeza (±15°, PS_* en K). Falta pasar chibi_prueba.glb a modelos/personaje/chibi.glb (R2).

### R2 · Personajes en la Ruleta
- [x] Quitar los Miis: sentar personajes con AV/MPJ alrededor de la mesa de la Ruleta (no es MESA; usar las posiciones de silla actuales de `c_ruleta3d.js`). Mismo código de personaje que en Continental/Uno (`AV.crear`/`AV.crearYa`, `AV.cambiar`).
- [x] Arma en la mano: `AV.pistola(p,true)` o colgar el GLB del revólver del hueso de la mano usando `Rev_Agarre`; dedos con `AV.agarre(p,'D',1)`.
- [x] Mano en primera persona (viewmodel): exportar desde Blender solo mano de mitón + manga (ropa y colores del jugador) o recortarla del GLB del avatar; sustituye `buildMyHand`. Sin sombras, hija de la cámara como `gunV`.
- [x] Muerte: el personaje se desploma (pose) en vez de lo que hace hoy `death()`; nametag atenuado.
- [x] Borrar `mkGun`, `buildMyHand` viejo y el uso de `mkAvatar`/`seg`/`ik` en la Ruleta (siguen exportados en C3D para Rummy y la casa; quitarlos de C3D solo cuando Rummy también migre).
- Hecho: c_rr_pj.js (RRPJ) sienta los AV en las sillas, cuelga modelos/personaje/revolver.glb (meshopt) de Rig_Agarre y arma la mano en primera persona recortando tu personaje por pesos (antebrazo y mano D). Apuntar = AgarreFrente + AV.gesto est/gy (gy y col nuevos); muerte = Reposo + col/cx (se desploma al frente). chibi.glb ?v=4 con Rig_Agarre. Falta ver la mano 1P sin el panel encima y el martillo (+40°).

### R3 · Animaciones
Reparto: poses clave horneadas en Blender (actuación) + mezcla, apuntado y mecánica del arma en three.js.
- [x] Secuencia (decidida): tomar el arma → [girar el tambor con la mano izquierda, solo si elige girar] → mirar a los demás (rápido, sin frenar el juego) → a la sien → amartillar con el pulgar → aguantar la tensión (acercamiento lento, latido, temblor) → clic o bang → reacción (alivio / muerte) → aventar el arma a la mesa, que se desliza girando hasta el siguiente (sirve en lados opuestos).
- [x] Carga (al inicio y justo después de un bang): abrir la puerta, varilla saca el casquillo (si hubo bang), meter la bala, cerrar y girar el tambor.
- [x] Acciones nuevas en rig.py (todas con `_n` por peinado si tocan la cabeza): `TomaArma`, `CargaBala`, `GiraTambor` (mano izquierda gira, derecha sostiene), `Amartilla` (pulgar), `ApuntaI`/`ApuntaC`/`ApuntaD` (tres poses de apuntar: izquierda, centro, derecha), `Alivio` (exhala, hombros caen), `Muerte` (solo el impulso del balazo, ~0.2 s), `AvientaArma`, `ReposoNervioso` (en la mesa, inquieto).
- [x] Ragdoll híbrido (c_ragdoll.js, sin librerías): tras `Muerte`, verlet con ~14 cuerpos (cadera, columna, cabeza, brazos, antebrazos, manos, muslos, piernas), límites de codo/cuello/rodilla, choque con mesa, silla y piso; cae al frente sobre la mesa. Solo visual, cada cliente lo simula. El revólver se suelta con física simple (la misma del deslizamiento).
- [x] En código: crossfade entre poses; apuntar a cualquier jugador = mezclar `ApuntaI/C/D` según el ángulo + giro pequeño de columna/cabeza encima; todos miran a quien tiene el arma (ya existe, adaptar).
- [x] Mecánica del arma en código: tambor gira con `spin` (hoy `userData.spin`), martillo se amartilla antes del disparo, gatillo se jala en `click`/`bang`, retroceso; fogonazo y humo en `Rev_Boca`.
- Hecho: blender/poses_ruleta.py (rig.py la corre antes de exportar) hornea TomaArma, GiraTambor, CargaBala, ApuntaI/C/D (±60°), Alivio, Muerte, AvientaArma, ReposoNervioso (un cuadro cada una, sin variante por peinado) y Amartilla_D (solo pulgar); chibi.glb ?v=6 (901 KB). AV: poses por pesos (`AV.mezcla`, `pose` y `emote` encima), `AV.amartilla`, gesto `ret` (retroceso) y `AV.post` (gancho por cuadro). c_rr_anim.js (RRA): coreografía del turno, arma en mano/mesa/volando, piezas (tambor avanza 1/6 al amartillar, gatillo, puerta, varilla, bala desde la mano izquierda, casquillo que salta), humo en Rev_Boca y la mano 1P (carga y giro). c_ragdoll.js (RAG): 10 puntos (piernas fijas en la silla), cadera con límites, choque con el tablero y su orilla; con la silla a 0.69 de la orilla la cabeza queda recargada en la orilla.
- Pulgar: la mano sube 35 mm en la cacha (`K['SUBE']` en rig.py) y Amartilla_D deja el pulgar a 13 mm de la espuela (antes 46); chibi.glb ?v=7.
- Falta: ver con calma en pantalla las mezclas de ApuntaI/C/D, la carga en primera persona y la caída (solo se revisó con números en consola); con bots rápidos la carga inicial (2.25 s) a veces se corta.


### R4 · Pulido y bugs
- [x] El registro de la izquierda repite el aviso grande: se quitó el registro (11 nov).
- [ ] Verificar el arma clara en la luz del foco (`bulb`) y en primera persona.
- [ ] Probar con 2–6 jugadores y bots, celular 21:9 y horizontal; `node --check c_ruleta3d.js`.

## Juegos nuevos (plan del 11 nov 2026)
Orden acordado (de chico a grande; cada uno reusa lo del anterior): Conecta 4 en 2D → Blackjack → Póker → Monopoly Deal 3D → Billar.
Trabajar uno a la vez en esta sesión (todos tocan las mismas líneas de registro y `c_sotano_salon.js`; en paralelo habría choques).

### Cómo retomar después de /clear
1. Leer solo esta sección. Buscar el primer juego con `[ ]`.
2. Si su lista «Preguntas» no tiene respuestas, **hacerlas todas antes de escribir código** con AskUserQuestion (máximo 4 preguntas por llamada, 2–4 opciones cada una, la recomendada primero con "(Recommended)"; hacer las rondas que hagan falta). El usuario escribe en inglés: preguntar en inglés, anotar aquí en español.
3. Anotar las respuestas aquí mismo (bajo «Decisiones», en lugar de «Preguntas») y hacer commit de PENDIENTES.md antes de empezar el código, por si hay otro /clear.
4. Implementar por pasos; marcar cada paso `[x]` al terminarlo y hacer commit + push por paso.
5. Reglas de siempre: módulos nuevos pequeños, registrar archivos nuevos en `server.js` (mapa ~línea 14) y en `continental3d.html` (antes de `c_casa3d.js`); interfaz con la skill `casa-ui` (GHUD, tokens `--ui-…`); sin emojis; `node --check` y una sola captura. Si cambia `server.js`, reiniciar el preview (preview_stop + preview_start "casa").

### Piezas comunes que ya existen
- Juegos "sueltos" sin salas, que se juegan en la casa y los atiende `server.js` desde `/casa`: `g_cubilete.js` (Cubilete con fichas, ante y bote; el mejor modelo para Blackjack y Póker) y `g_casajuegos.js` (Conecta 4 y Backgammon). Clientes de ejemplo: `c_cubilete3d.js`, `c_juegos3d.js` (ventanita `GHUD.win`).
- Mesas del sótano ya modeladas y vacías: `c_casino3d.js` (CAS3: Blackjack media luna con 7 casillas y 7 lugares, zapato, descartes, charola; Póker ovalado con 8 lugares, crupier al centro de atrás) y `c_billar3d.js` (BIL, `BIL.D` con medidas reales de 9 pies). Letreros "Próximamente" en `c_sotano_salon.js` (`pronto(g)`, `NOM`): quitar el del juego que quede jugable.
- Mesa nueva de cartas: `c_mesa_pj.js` (MPJ: personajes sentados, cartas en mano, `AV.gesto`), `c_mesa_cam.js` (MCAM: cámara viva, Arriba/Recentrar), `c_mesa_fx.js` (MFX). Panel de la mesa: `c_casa_mesa.js` (CMESA, tecla E).
- 2D plano dentro de un panel: `c_c4_2d.js` (ejemplo de cómo se hizo el Conecta 4).

### [x] Conecta 4 en 2D
Hecho: `c_c4_2d.js` (C42D) dibuja el tablero plano dentro de la ventanita del Conecta 4 de la casa; se juega tocando columnas (`JG3.tap`), ficha que cae y línea ganadora que late; botón Ocultar/Ver tablero 2D (localStorage `c4_2d`). Pendiente menor: probar una partida real de dos y en celular (375×812 y horizontal). No se hizo Conecta 4 en el modo 2D Ligero (si el usuario lo pide, es otra tarea).

### [x] Blackjack (sótano, salón de casino)
**Decisiones (respondidas el 11 nov 2026):**
- Fichas: se reinician por sesión (al sentarte tienes 1,000; no se guardan). Si llegas a 0, recarga inmediata a 1,000. Sin dinero real.
- Apuestas: mínimo 10, máximo 500 por casilla. Fichas de 5, 25, 100 y 500.
- Entrada: asiento libre al llegar (tecla E en la mesa, sin sala de espera); juegas desde la siguiente mano. Hasta 7 jugadores (7 casillas).
- Crupier: personaje chibi visible de pie detrás de la mesa que reparte. Sin bots en los asientos; se puede jugar solo contra el crupier.
- Reglas: zapato de 6 barajas, se rebaraja al pasar ~75 %; el crupier se planta en todo 17 (también 17 suave); blackjack paga 3 a 2.
- Opciones: Pedir, Plantarse, Doblar, Dividir, Seguro (cuando el crupier muestra As; paga 2 a 1) y Rendirse (rendición temprana: justo tras el reparto, recuperas la mitad).
- Dividir: hasta 4 manos (3 divisiones); los Ases se dividen una sola vez y reciben una carta cada uno.
- Tiempos: 15 s para apostar (si no, no juegas esa mano) y 20 s para actuar (si no, te plantas).
- Cámara: desde tu silla con MCAM (Arriba/Recentrar).
- Vista 2D: sí, botón "Vista 2D" que muestra manos y botones planos (como `c_c4_2d.js`).
- Se ve de los demás: sus cartas boca arriba, globito de resultado por asiento al final (+250, Se pasó, Blackjack) y fichas de cada quien sobre su asiento. Sin gestos automáticos.

**Pasos:**
- [x] B1 Reglas en el servidor: `g_blackjack.js` nuevo (sin salas, como `g_cubilete.js`): estado {zapato, crupier, asientos[7]: {id, nombre, fichas, manos:[{cartas, apuesta, doblada, dividida, rendida, seguro}]}, fase: 'apuestas'|'reparto'|'seguro'|'turnos'|'crupier'|'pago', turno, plazo}. Acciones: sentarse, pararse, apostar, pedir, plantarse, doblar, dividir, seguro, rendirse. Temporizadores por `tick`. Conectar en `server.js` junto a CUB/JG (`/casa`, b.bj). Pruebas en `tests/` (pagos, dividir Ases, seguro, 17 suave, rebarajar).
  Hecho: `BJ.mesa()` (fábrica para pruebas), `act(id,nombre,{op})` con op sentar/parar/apostar(v)/listo/pedir/plantar/doblar/dividir/seguro/noseguro/rendir (devuelve texto si no se pudo); `/casa` responde `bj` (vista: fase, left, cr {c, t; tapada = -1}, as[7] con manos {c,a,t,s,res,neta}, turno {s,m}) y `bjerr`. El reloj de apuestas (15 s) empieza con la primera apuesta; "listo" de todos reparte antes. Pruebas: `npm test`.
- [x] B2 Crupier: personaje chibi de pie detrás de la media luna (AV), animación de repartir y voltear su carta tapada.
  Hecho: `c_bj_crupier.js` (BJC). Está en una tarima (CAS3 `D.tarima` .38, `D.crupier`; sin ella el chibi no alcanza la mesa); el zapato y los descartes se acercaron a ±.76 (`D.zapato`) y el letrero pasó a la orilla. Gestos propios en `AV.GE` (apo, zap, rep, vol, gir) medidos para que las manos no atraviesen el paño. `BJC.estado(d.bj)` (desde c_casa3d.js) encola: reparto en su orden, pedir, dividir, voltear y las cartas del crupier; mira a quien tiene el turno. Para B3: `BJC.al(fn)` avisa al soltar cada carta (`fn("carta",i)`, `fn("voltea")`) y `BJC.mano()` da el punto de salida; `BJC.LUGAR` = dónde van sus cartas.
- [x] B3 Cliente 3D: `c_blackjack3d.js` (cartas sobre el paño en cada casilla, fichas apiladas, cartas que vuelan desde el zapato, descartes); sentarse con E (CMESA) en los lugares de `CAS3`; personajes sentados con MPJ; cámara MCAM.
  Hecho: `c_blackjack3d.js` (BJ3). Las cartas vuelan cuando el crupier las suelta (BJC.al), las manos divididas van lado a lado, los pagos salen de la charola o van a ella y al final de la ronda todo se barre a los descartes. Te sientas con E o tocando la mesa (el lugar libre más cerca) y te levantas con Esc o el botón. Cámara en primera persona (arrastrar o flechas/WASD para mirar, rueda o pellizco para acercar, doble toque recentra) y vista Arriba con toda la mesa. Mesa más grande con 5 lugares; fichas de 5, 10, 25, 50, 100 y 500. Tiempos, medidas y cámara en `BJ3.A` (se pueden cambiar en vivo desde la consola). Para B4: `BJ3.act(op,extra)`, `BJ3.v`, `BJ3.yo()`.
- [x] B4 Interfaz: `c_blackjack_hud.js` con GHUD (pastilla de fichas y turno, barra de botones Pedir/Plantarse/Doblar/Dividir/Seguro/Rendirse, selector de fichas para apostar, cuenta regresiva), globitos de resultado y fichas sobre cada asiento. Estilos en `ui_juegos.css`.
  Hecho: `c_blackjack_hud.js` (BJH). Pastillas debajo de la del piso (fichas, fase con cuenta regresiva, Levantarse); barra abajo al centro con fichas de 5/25/100/500 que suman a la apuesta, Borrar, Repetir y Repartir; Seguro/Sin seguro o Seguir y Rendirse; Pedir/Plantarse/Doblar/Dividir/Rendirse solo cuando se pueden; tu resultado al pagar. Sobre la mesa: nombre y fichas de cada jugador y un globito por mano con el total o el resultado (y el del crupier). Los avisos del servidor salen con SAL.aviso.
- [x] B5 Vista 2D: `c_blackjack2d.js`, botón Vista 2D.
  Hecho: `c_blackjack2d.js` (BJ2D). Botón "2D" en las pastillas (localStorage bj_2d): panel plano con las cartas del crupier y de cada asiento (tú primero), totales, apuestas y resultados; las cartas nuevas entran animadas. Los botones siguen en la barra de BJH y los globitos 3D se esconden. En horizontal bajo el panel va a la derecha.
- [x] B6 Sonidos (repartir, fichas, blackjack), quitar el "Próximamente" del Blackjack, probar en celular (375×812, 21:9 y horizontal) y en compu, día y noche.
  Hecho: sonidos nuevos en `cardSfx` (game.js): deal (cada carta que vuela), chip (apostar; apuestas de los demás), chips (pagos) y bj (tu blackjack). El letrero ya decía Mín/Máx. Vista 2D medida en 375×812 y 812×375 (en horizontal el panel deja libre la columna derecha y la barra se corre a la izquierda). Falta probar a mano una ronda completa en celular de verdad.

### [ ] Póker (sótano, mesa ovalada de 8)
**Decisiones (respondidas el 12 nov 2026; aún no empezar, Aris avisa):**
- Variante: Texas Hold'em sin límite.
- Fichas: como Blackjack: 1,000 por sesión, ciegas fijas 5/10 (mesa de efectivo), recarga a 1,000 al llegar a 0; no se guardan.
- Entrada: asiento libre al llegar (tecla E), juegas desde la siguiente mano. Sin sala ni torneo.
- Bots: llenan hasta 3 asientos para no jugar solo; se van cuando se sientan jugadores reales. Nivel normal (farolea a veces).
- Crupier: visible de pie al centro de atrás, reparte; el botón de dealer rota igual para las ciegas. Diseño propio y bien hecho (ajustar en Blender si hace falta): chaleco, moño y ligas en las mangas, otro peinado y colores. El crupier del Blackjack (BJC) también pasa a ese atuendo o uno parecido.
- Tiempo: 20 s por decisión; al acabarse pasa si puede, si no se retira.
- Mostrar: las manos del showdown se muestran solas; el que gana sin showdown y los que se retiraron pueden elegir enseñarlas.
- Ayudas: nombre de tu jugada ("Doble par"), probabilidad de ganar / outs, botones rápidos (½ bote, bote, todo).
- Botes paralelos: cada uno es su propia pila de fichas en el centro con su cantidad; se pagan uno por uno.
- Cámara: desde tu silla con MCAM (Arriba/Recentrar) y botón "Vista 2D" como Blackjack.
- Espectadores: sí; quien esté cerca de la mesa ve la mano (sin cartas ocultas) y puede sentarse cuando se libera un asiento.
12. Espectadores: ¿se puede mirar la mesa sin jugar?
**Pasos (ajustar tras las respuestas):** P1 `g_poker.js` (evaluador de manos de 7 cartas con pruebas, rondas de apuesta, botes paralelos, temporizadores) · P2 bots en `g_poker_bot.js` · P3 cliente 3D `c_poker3d.js` reusando cartas, fichas y crupier del Blackjack · P4 HUD con GHUD (subir con deslizador) · P5 vista 2D si se pidió · P6 sonidos, quitar "Próximamente", celular y compu.

### [ ] Monopoly Deal en 3D (salón de la planta baja)
Hoy: reglas en `g_monopolydeal.js` (completas, con salas y bots) y pantalla 2D `c_monopolydeal.js` (GRANDE, la comparte el 2D Ligero: no tocarla) envuelta por `c_mdeal_hud.js`. Es solo presentación nueva sobre la mesa nueva (MESA/MPJ/MCAM), en módulos chicos nuevos.
**Preguntas (hacerlas todas antes de empezar):**
1. Mesa: ¿la misma mesa redonda nueva (`c_mesa3d.js`) de Continental y Uno, o una propia?
2. Mano: ¿cartas en abanico frente a tu cámara (como Uno 3D) o mano plana abajo en la pantalla (HTML)?
3. Propiedades y banco de cada jugador: ¿sobre la mesa frente a su silla, agrupadas por color en columnas, con el banco apilado al lado?
4. Jugar una carta: ¿arrastrarla a tu zona, a tu banco o a un rival, o tocarla y elegir en un menú?
5. Acciones contra otros (Deal Breaker, Sly Deal, Forced Deal, cobros, Just Say No): ¿carta que vuela entre jugadores? ¿Ventana para elegir con qué pagar, con la mesa de fondo?
6. ¿Se queda la "Vista clásica 2D" como opción (botón) o el 3D la reemplaza dentro de la casa?
7. Cámara: desde tu silla + Arriba (como Uno/Continental) o de arriba fija para ver todas las propiedades.
8. Personajes: ¿gestos al completar un set, al recibir Just Say No, al ganar?
9. ¿Las mesas ocupadas (OCUP) deben mostrar Monopoly Deal jugándose?
**Pasos (ajustar tras las respuestas):** D1 vista 3D de la mesa con propiedades y banco por jugador · D2 mano y forma de jugar cartas · D3 acciones entre jugadores y pagos · D4 HUD GHUD (reusar `c_mdeal_hud.js`) · D5 animaciones, gestos, sonidos · D6 celular y compu.

### [ ] Billar (sótano, cuarto del billar)
El más grande: física propia sin librerías (choques bola-bola y con bandas, troneras, efecto, fricción). Para sincronizar: el que tira manda al servidor solo el tiro (ángulo, fuerza, efecto) y todos corren la misma simulación determinista (paso fijo, sin `Math.random`); el tirador manda las posiciones finales y el servidor las guarda como verdad para el siguiente tiro.
**Preguntas (hacerlas todas antes de empezar):**
1. Juego: Bola 8 (recomendado), Bola 9, o los dos a elegir.
2. Reglas: ¿completas (cantar tronera para la 8, bola en mano en cualquier lado tras falta) o simplificadas (falta = el rival pone la blanca detrás de la línea)?
3. Jugadores: 1 contra 1; ¿también contra bot? ¿Nivel del bot (fácil/normal/difícil o elegible)?
4. Entrada: tomar el taco al llegar y retar a alguien del cuarto (como el Conecta 4), o sala.
5. Apuntar en celular: ¿arrastrar hacia atrás para jalar el taco (fuerza) y girar con un dedo, o deslizador de fuerza + botón Tirar?
6. Ayudas: ¿línea guía? ¿Hasta dónde (primera bola, también el rebote, nada)? ¿Ajustable?
7. Efecto (spin) en la blanca: sí/no.
8. Cámara: ¿detrás del taco al apuntar y que siga la jugada, o que se vaya arriba al tirar? ¿Botón de vista desde arriba?
9. Personajes: ¿el personaje inclinado con el taco al tirar (animación) o solo el taco?
10. Tiempo por tiro (30/45/60 s o sin límite).
11. Vista 2D (mesa desde arriba) como opción: sí/no.
12. ¿Fichas o apuestas? (recomendado: no).
**Pasos (ajustar tras las respuestas):** L1 física `c_billar_fis.js` + pruebas deterministas en `tests/` · L2 reglas `g_billar.js` en el servidor · L3 apuntar y tirar (cliente) · L4 cámara · L5 bot · L6 HUD, sonidos, quitar "Próximamente", celular y compu.
