# Pendientes: personaje chibi personalizable

> **Regla:** cada vez que un pendiente esté hecho, marcarlo como completado aquí (`[ ]` → `[x]`) en el mismo commit, con la fecha y una nota de una línea si cambió algo del plan. Trabajar un paso a la vez, en orden. Si algo del plan resulta mal, corregir este archivo en vez de improvisar.

## Contexto (leer esto después de /clear)
- El personaje se hace en Blender (escena "Chibi", MCP de Blender). Hay tres copias de referencia, **Frente**, **Perfil** y **Pose**, que no se tocan para el juego. El modelo de juego es la copia **Rig** (x=2.9) que crea `blender/rig.py`.
- Scripts (se corren con `exec(open(r'C:/Users/aris1/code/Continental/blender/X.py').read(), {'PRM': {...}})`):
  - `pelo.py`: casco con flequillo en picos (parámetros en K: R, W, D, SK, SIDE, ENV, EDGE, N, M, THICK, MESH).
  - `cara.py`: ojos sólidos, cejas, boca y nariz 3D.
  - `brazos.py`: hombros, mangas con codo y manos de mitón (AGARRE 0–1).
  - `pelos.py`: peinados 2–6 (`EST[n]`, mismos parámetros que pelo.py + `TUFTS` mechones en cono, `E0`/`FLARE` cortina vertical, `EXTRA` tubo/esfera). Deja mallas `pelo_n` y `pelo_n_extra` y figuras de muestra `Peinado_n` (copias ligadas de Frente) en la colección "Peinados", x = 4.6 + 2.2·(n−2). `PRM={'SOLO': [n], n: {...}}`.
  - `rig.py`: copia Frente → piezas hijas de la armadura `Rig` (28 huesos, sufijos `_I` izquierda / `_D` derecha; parte → pieza en `K['PIEZA']`, material → ranura `av_*` en `K['MAT']`), pesos, acciones, empties de sien, pistola de prueba, y exporta `blender/chibi_prueba.glb`. Imprime choques con el pelo y triángulos por pieza.
- Acciones actuales: `Reposo`, `AgarreFrente`, `ManoCabeza` (también pone la mano izquierda plana), `PistolaSien` (no tocan los dedos), `Agarre_I` y `Agarre_D` (solo dedos: cuadro 1 relajada, cuadro 10 agarra; en three.js el tiempo es la cantidad de agarre). Empties `Sien_I`/`Sien_D` son hijos del hueso `cabeza`, con +Z local hacia afuera (+Y en three.js).
- Estado al 10 nov 2026 (paso 1): 18 532 triángulos en 7 piezas (Base 5 248, Pelo_1 5 656, Arriba_1 5 040, Abajo_1 1 568, Nariz_1 720, Cejas_1 184, Boca_1 92), 647 KB sin comprimir, sin texturas, 8 materiales `av_*`, un solo skin. El pelo del juego se decima al 50 % (`K['DECIMA']`), y la subdivisión de juego está en `K['NIVEL']`.
- Estilo: ver la memoria avatar-estilo (ojos sólidos, pelo mate, proporción B1, sin esquinas filosas).
- **Decisiones (no volver a preguntar):** 6 peinados compartidos; hombre y mujer con el mismo esqueleto pero cuerpo distinto (10 nov 2026: la mujer tiene cintura marcada y la prenda de arriba abre hasta medio muslo, `cuerpo_m.py`; cada prenda necesita versión H y M); 3 prendas arriba y 3 abajo; 3 cejas, 3 bocas y 3 narices; ojos fijos; colores con paleta fija (pelo, piel con 6–8 tonos, prenda de arriba, prenda de abajo); un solo GLB con todas las piezas; editor en pantalla aparte "Mi personaje"; guardado en localStorage y se manda al servidor al entrar a la sala, sin cuentas; accesorios después; sin avatar 2D.
- **Presupuesto:** 15 000–20 000 triángulos visibles por personaje (se juega en celular). Revisar siempre con lo que imprime rig.py.

## Paso 1 · Rig por piezas
- [x] Definir la convención de nombres de piezas: `Pelo_1..6`, `Cejas_1..3`, `Boca_1..3`, `Nariz_1..3`, `Arriba_1..3`, `Abajo_1..3`, y piezas fijas `Base` (cabeza, ojos, orejas, manos, zapatos). — 10 nov 2026: `Arriba_n` incluye las mangas (`Brazos`); los nombres de nodo en el GLB son esos, las mallas se llaman `Rig_<pieza>`.
- [x] Cambiar `rig.py` para que **no una todo** en `Rig_Cuerpo`: cada pieza es su propio objeto con pesos, hijo de la armadura `Rig` (mismo esqueleto). Lo actual queda como la opción 1 de cada cosa. — 10 nov 2026
- [x] Las piezas de cabeza (pelo, cejas, boca, nariz) van 100 % al hueso `cabeza`; la ropa con pesos automáticos limitados a sus huesos (como ahora). — 10 nov 2026
- [x] Materiales con nombres fijos por ranura para cambiarles el color en three.js: `av_pelo`, `av_piel`, `av_arriba`, `av_abajo` (más los fijos: ojo, boca, suela, zapato). — 10 nov 2026: los fijos se llaman `av_ojo`, `av_boca`, `av_suela`, `av_zapato`; son copias, los `chibi_*` de las figuras no cambian. Las cejas usan `av_pelo` (mismo color que el pelo).
- [x] Exportar y comprobar: mismo número de triángulos que hoy, sin choques, y que las 6 acciones sigan. — 10 nov 2026: 18 532 tris, 0 verts dentro del pelo (PistolaSien y ManoCabeza), 6 acciones. El GLB arrastra un nodo suelto `Cube` (cubo oculto de la escena, fuera de la escena glTF): limpiar algún día.

## Paso 2 · Peinados 2 a 6
- [ ] Diseñar 5 peinados nuevos (mezcla para hombre y mujer, p. ej. corto rapado, despeinado, coleta, melena a los hombros, chongo). Mostrar una captura chica de cada uno antes de seguir. — 10 nov 2026: primera versión hecha (2 rapado, 3 despeinado, 4 coleta, 5 melena, 6 chongo) y capturas mostradas; falta el visto bueno.
- [x] Hacerlos con `pelo.py` (otros valores de PRM y `MESH` distinto) o con un script nuevo `blender/pelos.py` si la forma no cabe en los parámetros. — 10 nov 2026: `pelos.py` (coleta y chongo necesitan piezas sueltas y la melena una cortina).
- [ ] Cada peinado ≤ ~6 000 triángulos en la copia de juego (decimado incluido).
- [ ] Por cada peinado: `rig.py` calcula sus empties `Sien_I_n`/`Sien_D_n` y su acción `PistolaSien_n` sin choques (el pelo largo puede tapar la sien: revisar).
- [ ] Revisar que `ManoCabeza` no atraviese ningún peinado (o tener una variante por peinado).

## Paso 3 · Cara
- [ ] 3 cejas (rectas, arqueadas, gruesas), 3 bocas (sonrisa, neutra, abierta) y 3 narices (botón, redonda, pequeña) ajustando `cara.py`. Una captura chica comparando las 3 de cada tipo.
- [ ] Que todas queden en la misma posición de la cara y no choquen con el flequillo.

## Paso 4 · Ropa
- [ ] Arriba: playera (la actual), sudadera (más gruesa, con capucha baja o cuello alto) y blusa (más corta o con cuello distinto). Mangas con codo como `brazos.py`.
- [ ] Abajo: pantalón (el actual), short y falda. Con el short y la falda hacen falta **piernas de piel** debajo: meterlas como pieza aparte que se muestra solo con esas prendas.
- [ ] Revisar que doblen bien en `AgarreFrente`, `ManoCabeza` y `PistolaSien` (comparar contra la copia Pose como hace rig.py).
- [ ] Cada prenda dentro del presupuesto (arriba ≤ ~5 000 y abajo ≤ ~2 000 triángulos).
- [ ] Versión M de cada prenda sobre el cuerpo de mujer (`cuerpo_m.py`, figura `Mujer`); en rig.py como piezas `Arriba_n_M`/`Abajo_n_M` o un GLB por cuerpo (decidir).

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
