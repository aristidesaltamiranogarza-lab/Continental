# Casona: paisaje (decidido 23 nov 2026)

Respuestas del usuario mezcladas con la recomendación de Claude (el usuario prefirió la de Claude; sus respuestas son guía, no regla).

## Prioridad
- Rendimiento ante todo: que los celulares no se calienten ni gasten batería. Los juegos de mesa dentro de la casa son lo principal; el paisaje viene después.
- Niveles: Ligero (2D), Medio (casa y barrio en calidad baja), Completo 30, Completo 60 y Ultra (GPU dedicada, más adelante).
- Metas: Medio 30 FPS parejos en celular; Completo 60 a ~120 FPS en la 780M. Calidad por detección de aparato, que sube si sobra.
- Distancia de dibujo menor en Medio (con niebla). Descarga del paisaje en Medio 5–15 MB. Casa primero, paisaje después.
- En Medio se quita primero: pasto 3D, sombras en tiempo real, árboles lejanos a sprite, detalles chicos de calle, viento.
- Regla de Medio: nada de pasto 3D ni hojas con recorte (cards): en GPU de celular las capas transparentes encimadas (overdraw) son lo más caro.
- Presupuestos por nivel (prueba que falla si se pasan; cifras a medir en el Android de referencia): Medio ~150 draw calls, ~300 mil triángulos, ~150 MB de texturas en GPU; Completo ~400 draw calls. Juntar mallas (MRG/LOTE) y hornear para cumplirlos.
- Resolución dinámica: si bajan los FPS, baja un poco la resolución antes de que tartamudee (sin pasar el tope de densidad de c_movil.js).
- Celular de referencia: el Android más débil de los amigos, no solo el del usuario. Los muy débiles (2–3 GB, MediaTek barato, PowerVR viejo) van a Ligero por detección.
- iPhone 15 Pro Max: Completo 30 sin problema; Completo 60 posible pero baja a ~40–45 tras 5–10 min por calor. Safari cierra la pestaña si se pasa de memoria: texturas siempre en KTX2 y mapas de luz moderados.

## Estilo
- Estilizado pintado (formas suaves, texturas tipo gouache), nada semi-realista. Ver ejemplos antes de decidir del todo.
- Colores cálidos pastel como la casona horneada. Referencia: juegos acogedores tipo life-sim, formas de fotos reales de Mérida, color de las cartas 2D.
- Referencia principal (elegida por el usuario): Alba: A Wildlife Adventure. Tomar de ahí: luz de sol fuerte y cálida con sombras suaves, materiales lisos sin texturas ruidosas (casi solo color + luz horneada), árboles en grupos de copas oscuras que contrastan con suelo dorado, muchos objetos chicos que dan vida (macetas, bancas, botes) y paleta limitada. Es inspiración, no copia: nuestro estilo, nuestra Mérida y nuestro personaje (serio, ojos óvalos oscuros).
- Lugar: centro de Mérida. Idea a futuro: una hacienda.
- Hora por defecto: atardecer dorado (más adelante, hora real del jugador).

## Suelo
- Pasto verde menos saturado con parches secos y tierra (adiós al verde chillón). Mezcla de dos escalas + ruido para no ver repetición.
- Pasto 3D solo en Completo, cerca de la cámara, con viento.
- Caminitos gastados, hojas caídas, florecitas. Sin charcos (piden reflejos).
- Oscurecido junto a muros y árboles, horneado en Blender.
- Lote verde junto a la casona: por definir (propuesta: baldío con hierba, barda y un perro).

## Árboles y plantas
- Laurel de la India, flamboyán, palmeras, ceiba; naranjos en patios.
- Copas de grupos de hojas (no bolas lisas); cerca low-poly, lejos sprites (impostores). En Medio, grupos sólidos sin recorte; hojas con recorte (cards) solo en Completo.
- Viento sutil en árboles en todos los niveles (vértice, casi gratis).
- Plaza: menos árboles pero más grandes.
- Bugambilias, macetas de barro, enredaderas en fachadas, cactus y agaves; acentos de color fuerte (magenta sobre pastel).

## Calle y barrio
- Casas vecinas horneadas como la casona (lo más importante: hoy parecen otro juego).
- La manzana completa y luego skyline (varias cuadras solo como horizonte barato).
- Coches estacionados, topes y coladeras, botes y letreros, puestos de comida, bicis/triciclos.
- Banquetas de concreto con pasta de colores frente a algunas casas.
- Vida: pájaros, perro, gato. Gente y coches después.

## Plaza
- Se queda y se mejora: bancas confidente, faroles de noche, iglesia al fondo, fuente.
- Por ahora decorado; después todo el barrio recorrible.

## Horizonte, cielo y noche
- Skyline bajo con torres de iglesia y selva baja, como anillo de tarjetas barato.
- Niebla igual o algo menos, del color del cielo.
- Nubes pintadas lentas (3D sencillas solo si salen baratas).
- Noche: estrellas, luna, ventanas encendidas al azar, charcos de luz de faroles, luciérnagas en la plaza.
- Sin clima por ahora.

## Luz y color
- Todo horneado + sombra simple bajo los personajes.
- Un LUT por hora del día; tonemapping el que se vea mejor en prueba (probablemente AgX).
- Completo: viñeta ligera; bloom suave solo en cielo y faroles más adelante. Sin SSAO. Sin brillos en mesas.

## Visibilidad (ver también CASONA.md)
- Gestor único de visibilidad con ?vis primero.
- Pared que tapa: agujero tramado alrededor del personaje.
- Techos y pisos de arriba: fundido con muros cortados con tapa; con la cámara en tercera persona fija casi no hace falta.
- Casas vecinas y calle nunca se ocultan.
- Cuartos por portales marcados en Blender.

## Producción
- Blender para el barrio horneado + código para shaders (pasto, viento, sprites, LUT).
- Assets CC0 gratis adaptados al estilo, solo si no afectan rendimiento ni la consistencia (hubo problemas antes). IA solo para props sueltos, restilizados.
- Antes de construir: una esquina terminada como referencia (y tablero de referencias + paleta para aprobar).
- Visibilidad primero, luego paisaje.
- Comparar antes/después con marcadores de cámara.

## Pendiente
- Desde el 24 nov el barrio se modela en la laptop y se hornea en la PC: reglas en CASONA.md, "Trabajo en la laptop" punto 5.
- Hecho (24 nov) borrador: lámina A-02 + tablero de estilo y paleta en https://claude.ai/artifact/3gFhpi5TLmU1Kj51oteuWR . Decidido por rendimiento: andador a la plaza sí; plaza del tamaño de hoy (28×24) con la iglesia pegada al fondo; sin Calle 57 (solo barda, torres en el horizonte); baldío con hierba, agaves, barda y perro (perro solo en Completo). Original: lámina A-02 "Barrio" con el mismo estilo de plano que el anteproyecto (https://claude.ai/artifact/PX1g934RWSsWF4VdTB7Doa): manzana, plaza con kiosco, símbolos de árboles por especie, anillos de distancia de dibujo por nivel y corte calle–plaza. Parque actual en c_casa_campo.js (cx=-55, cz=-35).

## Siguiente: Blender en la otra PC — tramo de referencia (paso 1 del paisaje)
Antes de empezar: `git switch gamemash-casona && git pull`. Leer la lámina A-02 (https://claude.ai/artifact/3gFhpi5TLmU1Kj51oteuWR: planta, corte y tablero con paleta) y CASA_BLENDER.md §5 (errores ya pisados). Se corre igual que los otros niveles: `blender.exe -b --factory-startup --python blender/casona_calle.py -- vista|hornear`.

Qué es: un tramo de la Calle 59 terminado y horneado con el estilo de la casona, para medir costo y aprobar el estilo antes de hacer la manzana. Coordenadas del juego (?casa=caja): fachada de la casona en z=17, banqueta de la casona 17–18.6, arroyo 18.6–28.6, banqueta de enfrente 28.6–32.6; lote de la casona x ±18. Tramo: x de −40 a 22.
1. **Script nuevo blender/casona_calle.py** que reusa casona_pb.py como biblioteca (como casona_pa.py y casona_sm.py) y exporta `modelos/casona/calle.glb` + `calle_luz.webp`. La fachada de la casona ya está en pb.glb: no duplicarla.
2. **Vecinas del lado de la casona** (x −40 a −18, anchos 10, 7 y 8 según A-02): fachadas contiguas de un piso, alto 5.6–6.2 (son más bajas que la casona, S=.68), pretil, ventanas con reja, puerta de madera, zoclo. Colores de la paleta: amarillo #efc675, añil #93b6cb, verde agua #9cc5b0. Bugambilia magenta #c2387a sobre una barda.
3. **Enfrente** (x −40 a 22, desde z 32.6, fondo 12): 6–7 fachadas contiguas de colores, banqueta con guarnición y banqueta de pasta frente a una o dos casas (patrón roseta como 'pasta' de CMAT).
4. **Laurel de la India** en la banqueta de la casona (x −30, z 17.8): tronco encalado abajo, copa de 6–8 grupos de hojas (no bola lisa), alto ~12, copa ~11 de ancho. Nombrar la copa `*_copa` (CMAT la desvanece y PASTO.viento la mece).
5. **Poste con cables** (x −36 y −6, z 18.3) y macetas de barro (#c98f6f) junto a dos puertas. El vocho sigue en código (c_casa_vocho.js); que la luz horneada tenga su sombra suave si cabe.
6. **Luz**: atardecer dorado, sol bajo del poniente (−X, igual que CIELO.dia), sombras largas y suaves con tono violeta (#6e5f8c); materiales casi solo color (nada de texturas ruidosas). Mapa de luz 1024 (máx. 2048) en webp.
7. **Presupuesto** (prueba que tiene que pasar): el tramo ≤ 20 draw calls y ≤ 40 mil triángulos; calle.glb ≤ 300 KB y la luz ≤ 600 KB.
8. **Opcional en casona_pb.py**: cambiar los conos verdes de la jardinera del traspatio (se ven como pirámides) por matas bajas o agaves; la tierra de la jardinera está a 0.7 (PASTO ya no pone matas ahí).

Hecho (24 nov) pasos 1–7: blender/casona_calle.py (vecinas 8/10/7 desde la casona, 7 casas enfrente, laurel, 2 postes, macetas, bugambilia; `-- ver` abre una ventana que se rearma al guardar). 7 draw calls, 11.9 mil triángulos, calle.glb 292 KB (cuantizado con glb_cuantizar.js: posición uint16 en el nodo, sin normales), calle_luz.webp 361 KB, horneo 1.4 min. Para el código: fachadas, marcos, puertas, macetas y bugambilia van en la malla `calle_fachadas` (material `fachada`, sin UV0) con color por vértice: CMAT necesita `vertexColors:true` para ese material; `calle_herreria` va sin UV0 ni luz. Paso 8 pendiente.

Luego en código (cualquier PC): CCALLE (c_casa_calle.js) carga calle.glb con CMAT.aplicar y no dibuja sus vecinos de código dentro del tramo; comparar antes/después con `?cam=calle` y `?cam=calle_vecinas`, de día y de noche (de noche la fachada debe quedar del tono de la calle, solo ventanas y faroles resaltan). Mostrar preview al usuario antes de seguir con la manzana.
