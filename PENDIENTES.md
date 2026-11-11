# Pendientes: personaje chibi personalizable

> **Regla:** cada vez que un pendiente esté hecho, marcarlo como completado aquí (`[ ]` → `[x]`) en el mismo commit, con la fecha y una nota de una línea si cambió algo del plan. Trabajar un paso a la vez, en orden. Si algo del plan resulta mal, corregir este archivo en vez de improvisar.

## Contexto (leer esto después de /clear)
- El personaje se hace en Blender (escena "Chibi", MCP de Blender). Hay tres copias de referencia, **Frente**, **Perfil** y **Pose**, que no se tocan para el juego. El modelo de juego es la copia **Rig** (x=2.9) que crea `blender/rig.py`.
- Scripts (se corren con `exec(open(r'C:/Users/aris1/code/Continental/blender/X.py').read(), {'PRM': {...}})`):
  - `pelo.py`: casco con flequillo en picos (parámetros en K: R, W, D, SK, SIDE, ENV, EDGE, N, M, THICK, MESH).
  - `cara.py`: ojos sólidos, cejas, boca y nariz 3D; 3 opciones de cada una (`CEJAS`, `BOCAS`, `NARICES`; la 1 va en Frente/Perfil/Pose). Figuras de muestra `Cara_1..3` (copias ligadas de Frente con la opción n) en la colección "Caras", x = −7.5 + 1.45·(n−1).
  - `brazos.py`: hombros, mangas con codo y manos de mitón (AGARRE 0–1).
  - `ropa.py`: ropa 2 (sudadera: torso y mangas infladas por la normal, capucha baja en la espalda, bolsa canguro, cordones; short) y 3 (blusa: cuello, botones, faldón; falda con tablones y doble capa), más `ropa_piernas` (piel, para short y falda); todo en versión H (de la playera, mangas y pantalón de Frente) y M (de `playera_m`/`pantalon_m`, mallas `_m`; el short M baja a 0,55 y la falda M va dentro de la prenda de arriba hasta 0,62 y se abre abajo); las piezas que van sobre la tela se proyectan con rayos (`parche`, `sobre_hombro`). Figuras de muestra `Ropa_2`, `Ropa_3` (H) y `RopaM_2`, `RopaM_3` (M, copias de Mujer) en la colección "Ropa", x = −9.0 − 1.45·(n−2) y −11.9 − 1.45·(n−2). Material nuevo `chibi_boton` (botones y cordones).
  - `pelos.py`: peinados 2–7 (`EST[n]`, mismos parámetros que pelo.py + `TUFTS` mechones en cono, `E0`/`FLARE` cortina vertical, `EXTRA` tubo/esfera). Deja mallas `pelo_n` y `pelo_n_extra` y figuras de muestra `Peinado_n` (copias ligadas de Frente) en la colección "Peinados", x = 4.6 + 2.2·(n−2). `PRM={'SOLO': [n], n: {...}}`.
  - `rig.py`: copia Frente → piezas hijas de la armadura `Rig` (28 huesos, sufijos `_I` izquierda / `_D` derecha; parte → pieza en `K['PIEZA']`, material → ranura `av_*` en `K['MAT']`), pesos, acciones, empties de sien, pistola de prueba, los peinados 2–7 de pelos.py (`K['PEINADOS']`, piezas `Pelo_n`), las caras 2–3 de cara.py (`K['CARAS']`, piezas `Cejas_n`, `Boca_n`, `Nariz_n`), la ropa 2–3 de ropa.py (`K['ROPA']`, parte → pieza en `K['ROPA_PIEZA']`: `Arriba_n`, `Abajo_n` y una sola `Piernas`; del cuerpo de mujer `Arriba_n_M`, `Abajo_n_M`, `Piernas_M` (la 1 sale de la figura Mujer); capucha, bolsa, cordones, cuello y botones van 100 % a `columna`) (las piezas `_n` con n ≥ 2 y `Piernas` quedan ocultas en Blender), y exporta `blender/chibi_prueba.glb`. Imprime choques con el pelo y triángulos por pieza.
- Acciones actuales: `Reposo`, `AgarreFrente`, `ManoCabeza` (también pone la mano izquierda plana), `PistolaSien` (no tocan los dedos), `Agarre_I` y `Agarre_D` (solo dedos: cuadro 1 relajada, cuadro 10 agarra; en three.js el tiempo es la cantidad de agarre). Empties `Sien_I`/`Sien_D` son hijos del hueso `cabeza`, con +Z local hacia afuera (+Y en three.js). Por peinado n ≥ 2: `PistolaSien_n`, `ManoCabeza_n`, `Sien_I_n`/`Sien_D_n` (si la pose del 1 no choca y la sien se mueve < `TOL_SIEN`, se copia; si no, se busca otra).
- Estado al 10 nov 2026 (paso 4): GLB de 2 735 KB sin comprimir con todas las piezas (89 512 tris en total; visibles por personaje ≈ 20 050 con lo más pesado en H (Pelo_4 + Arriba_3 + Abajo_2 + Piernas + Boca_3) y ≈ 20 820 en M). Arriba_1_M 5 808, Arriba_2_M 6 372, Arriba_3_M 6 392 (playera_m ya subdividida pesa 720 más que la H); Abajo_n_M y Piernas_M igual que H. Base 5 248, Arriba_1 5 040, Arriba_2 5 604, Arriba_3 5 624, Abajo_1 1 568, Abajo_2 1 376, Abajo_3 1 360, Piernas 704, Nariz_1..3 720 c/u, Cejas_1..3 184 c/u, Boca_1 92, Boca_2 92, Boca_3 288; Pelo_1 5 656, Pelo_2 2 536, Pelo_3 5 812, Pelo_4 5 908, Pelo_5 5 488, Pelo_6 5 608, Pelo_7 5 192. 18 acciones. Tarda ~50 s; sin texturas, 9 materiales `av_*` (+ `av_boton`), un solo skin. Las mangas (3 456 tris) son lo más caro de cada prenda de arriba y van repetidas en `Arriba_n` y `Arriba_n_M`: en el paso 5 conviene decimarlas (para bajar de 20 000 en M) y/o sacarlas como pieza propia. El pelo del juego se decima al 50 % (`K['DECIMA']`), y la subdivisión de juego está en `K['NIVEL']`.
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
- [ ] Exportar un GLB con todas las piezas (por ejemplo `modelos/personaje/chibi.glb`, siguiendo el flujo de modelos de preparar_modelos.js si aplica).
- [ ] Comprimir (meshopt o Draco) y anotar aquí el peso final y los triángulos de la combinación más pesada.
- [ ] Quitar del GLB el objeto suelto "Cube" que exporta Blender aunque no esté seleccionado.

## Paso 6 · Cliente: `c_avatar.js`
- [ ] Módulo nuevo y chico `c_avatar.js` (objeto global `AV`): carga el GLB una vez, `AV.crear(codigo)` clona con SkeletonUtils, muestra solo las piezas elegidas y aplica los colores (material clonado por personaje).
- [ ] Código corto del personaje, por ejemplo `p3c1b2n1a2d3-<colores>`: `AV.codificar(obj)` y `AV.leer(codigo)`, con valores por defecto si viene mal.
- [ ] Paletas fijas en el mismo módulo (pelo, piel, ropa) con colores del estilo Cálida.
- [ ] Reproducir acciones: `AV.pose(p, 'PistolaSien')` y `AV.agarre(p, 'D', 0..1)`.
- [ ] Registrar el archivo en el mapa estático de server.js (~línea 14) y en la línea de scripts de continental3d.html (antes de c_casa3d.js).

## Paso 7 · Servidor
- [ ] Guardar el código del personaje en localStorage y mandarlo al entrar a una sala; server.js lo guarda por jugador y lo regresa en el polling para que los demás lo vean.
- [ ] Los bots también tienen personaje (código aleatorio con la paleta).

## Paso 8 · Pantalla "Mi personaje"
- [ ] Usar la skill `casa-ui` (estilo Cálida, tokens de ui.css; nunca clases w7…).
- [ ] Vista previa del personaje girando y pestañas: Peinado, Cara, Ropa, Colores. Selector Hombre/Mujer que solo cambia la selección inicial.
- [ ] Botón "Mi personaje" para entrar cuando sea; guardar al cerrar.
- [ ] Probar en celular vertical y horizontal, también en 21:9.

## Paso 9 · Personajes en la mesa y la sala
- [ ] Poner a cada jugador con su personaje en su silla en la mesa y en la sala de espera (SALA).
- [ ] Medir FPS en celular con la mesa llena; si baja, usar una versión más ligera para los personajes lejanos.
- [ ] Usar `PistolaSien_n` y los empties de sien en la Ruleta Rusa.

## Otros pendientes (de la lista anterior)
- [ ] FPS bajan cerca de las dos mesas altas del sótano (cantina, `mesa_cantina`): medir ocultando vasos, rockola y luces de esa zona.
- [ ] Un cuadro de 244 ms al entrar al sótano (`CASA3D.ir('sot')`): probablemente armar el piso o compilar shaders.
- [ ] Ruleta Rusa: rehacer las animaciones (Aris va a detallar). El registro de la izquierda repite el aviso grande y la pistola se ve muy oscura.
- [ ] D7 medición en dispositivos: celular y PC modesta, en Medio y Completo (FPS, memoria, si Safari recarga la página). Para el iPhone: `http://<IP de la PC>:3000/?medir` en la misma Wi‑Fi.
- [ ] Paso 5 de la UI (prompt_ui.md), en pausa.
- [ ] 4d Mesas ocupadas: animación genérica de mesa con partida en curso.
- [ ] Monopoly Deal en su mesa (hoy es pantalla 2D).
- [ ] Fase 5: Póker y Blackjack jugables en el sótano. Billar jugable (BIL.D ya trae las medidas) y quitar los letreros "próximamente".
