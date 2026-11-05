# Roadmap: la Casa de juegos

Visión: el lobby deja de ser un cuarto lleno de mesas y se vuelve una **casona meridiana** que recorres con tu avatar. Los juegos se juegan **en su mesa, dentro de la casa**: sin cargar otro cuarto. La cocina y los muebles son decoración; lo importante son los juegos.

## Decisiones tomadas
- **Pisos**
  - Sótano: Ruleta Rusa, Cubilete (en la cantina, junto a la barra), Poker, Blackjack.
  - Planta baja (cartas y vida de la casa): zaguán, salón con Continental, Uno y Monopoly Deal; cocina; patio central con hamaca yucateca y gato negro.
  - Planta alta (tableros): estudio/biblioteca con Monopoly (a secas), YuCATÁN y Backgammon; corredor con arcos, balcón, reloj y radio.
- **Ir rápido entre pisos**: botón 🧭 "Ir a…" en el HUD + un plano enmarcado junto a cada escalera. Abre el corte de la casa (la vista "casa de muñecas") con pisos y mesas, y cuántos juegan en cada una; tocas un piso o una mesa y llegas con un fundido (CCAM.fade), junto a la mesa. Las escaleras siguen funcionando caminando.
  - Terraza: Rummy (mesa propia, atardecer de los abuelos) y quizá Conecta 4.
- **Estilo**: mosaicos de pasta, techos altos con vigas, ventiladores, arcos, hamaca yucateca (sí o sí) y un gato negro. Cocina y muebles solo de adorno.
- **Movimiento**: caminas con tu avatar en tercera persona, con opción de primera persona. En el celular: tocar el piso para caminar y joystick opcional.
- **Jugar en el lugar**: al unirte, te sientas, la cámara se acomoda en la "zona" de esa mesa (límites de giro y zoom) y el juego corre ahí con todo su detalle. Las demás mesas se ven, pero no se pueden usar, y no sales de tu zona hasta levantarte.
- **Salir a medio juego**
  - *Levantarse*: un bot toma tu lugar; si vuelves en unos 2 minutos, recuperas el asiento.
  - *Abandonar*: sales del juego y el bot se queda con el asiento. Sin aprobación del anfitrión.
- **Otras mesas**: una animación genérica en bucle (avatares repartiendo, pensando), no el estado real. Solo aparece si de verdad hay gente jugando ahí. El servidor manda solo "mesa activa + N jugadores". Se anima solo si la mesa está en pantalla y cerca; nunca en calidad Ligera.
- **Pantalla de bienvenida**: nombre obligatorio (con un nombre gracioso al azar por defecto) y calidad:
  - *Ligero*: el modo 2D actual.
  - *Medio*: 3D sin sombras, menos resolución y luces, sin animación de mesas.
  - *Completo*: todo (atardecer, cielo, ventanas).
  - Se guarda en el dispositivo y se puede cambiar desde el menú. Si los FPS salen bajos al inicio, se sugiere bajar la calidad.
- **Nombres en el lobby**: "Mérida en Venta" pasa a **Monopoly** (ojo: puede confundirse con Monopoly Deal) y "Haciendas de Yucatán" pasa a **YuCATÁN**.

## Fases
1. **Bienvenida y limpieza del lobby**
   - Pantalla de nombre + calidad.
   - Renombrar Monopoly y YuCATÁN.
   - Etiquetas: quitar "toca para jugar", mostrar solo icono + nombre (detalle al acercarse o pasar el cursor), desvanecer por distancia y arreglar los empalmes (Cubilete / Ruleta Rusa).
   - Dejar un solo botón "Cuadrar".
2. **Módulo de cámara compartido**: transiciones con easing, la animación de "sentarse" (volar a la mesa, bajar a altura de asiento, fundido), efecto al pasar el cursor (la mesa se eleva y brilla, sale una silla) y la toma de llegada por el zaguán.
3. **Piloto: el sótano**
   - Módulo casa: renderer, pisos, luces y avatar.
   - Avatar que camina, en tercera y primera persona.
   - Ruleta Rusa montada en su mesa con su zona de cámara.
   - Levantarse y abandonar con bot.
   - Respeta la calidad elegida y carga solo el piso actual.
4. **Planta baja y terraza**: migrar los juegos uno por uno; cada juego se monta en un ancla de mesa en vez de tener su propia escena (como el tablero de Mérida dentro del cuarto de C3D). También la animación genérica de mesas ocupadas, la vista "casa de muñecas" entre pisos y los detalles de ambiente (lámparas sobre las mesas, chimenea, ventiladores, gato, reloj, radio ligado al 🎵).
   - Hecho: 4a (Cubilete al sótano, ambiente), 4b (planta alta, terraza, escaleras), 4c (casa de muñecas).
   - **Arreglos antes de seguir** (en este orden):
     - A. (Hecho, 417d041) Partida terminada que sigue "en curso"; quitar "Solo administrar"; el menú de mesa solo se abre al picar la mesa (no al pasar cerca); rojo vs naranja en el Rummy 3D (solo 3D, no tocar 2D ni otros juegos).
     - B. (Hecho) Rummy vista aérea: zoom (rueda/pellizco) y atril con tus fichas abajo para jugar desde arriba.
     - C. (Hecho) Cámara tipo Roblox: 3ª persona sigue al avatar y gira con el mouse, WASD relativo a la cámara; 1ª persona con pointer lock (sin arrastrar, dirección corregida); celular con joystick abajo-izquierda y arrastre a la derecha; caminar tocando el piso con búsqueda de ruta (rodea mesas, estilo Sims); aviso "Agregar a inicio" para pantalla completa en iPhone.
     - D. Rediseño de toda la casa: ver la sección **Bloque D** abajo.
   - Luego: 4d animación de mesas ocupadas; migrar juegos a su mesa.
5. **Poker y Blackjack** en el sótano.

## Bloque D: rediseño de toda la casa
Meta: una sola casona meridiana coherente, con el lenguaje de la planta alta y la terraza en los cuatro pisos (mosaico de pasta, vigas, arcos, muros de cal de color, herrería), muebles con modelos .glb ligeros CC0, ventanas que se sienten reales y un exterior que no se ve vacío. El UI del paso 5 (pantallas de los demás juegos) queda en pausa.

### Planta baja nueva (del frente hacia atrás)
1. **Calle y banqueta**: se puede salir hasta la banqueta (límite invisible antes del arroyo). Poste de luz, laurel, un vocho estacionado.
2. **Fachada**: muro alto de color, portón de madera doble, ventanas altas con rejas de herrería hasta el piso.
3. **Zaguán**: piso de pasta, banca de madera, perchero, plano 🧭. Es la toma de llegada.
4. **Salón principal** (techo alto, vigas, ventiladores): Continental, Uno y Monopoly Deal; arranque de la escalera.
5. **Comedor y cocina**: cocina yucateca (azulejo, alacena, estufa, refri viejo, ollas, licuadora, ventana al patio). La cocina es decoración, pero su mesa puede ser mesa de juego más adelante.
6. **Baño de visitas** (el chistoso): inodoro, lavabo, espejo; al picar la cadena suena. En Completo el espejo refleja de verdad.
7. **Patio trasero** (sí se camina): hamaca entre dos columnas, gato negro, árbol grande (flamboyán o mamey), macetas, lavadero, barda alta pintada que tapa lo de atrás; cielo arriba.

### Exterior y vecinos
- Decidido: **fachadas meridanas contiguas**. Los vecinos son cajas con frente de color (rosa, ocre, azul, verde), ventanas y puertas con relieve, sin interior. Una cuadra corta de cada lado y la calle se pierde en neblina.
- Detrás del patio, la barda con copas de árboles asomando.
- Se camina hasta la banqueta y todo el patio trasero; la calle no.
- El cielo sigue el tema: de día con Día y de noche con Noche (Automático sigue al sistema). De noche se prenden los postes, las ventanas vecinas y las lámparas.

### Ventanas por calidad
- **Ligero**: 2D, no aplica.
- **Medio**: "ventana con fondo". Al cargar el piso se hornea una vez una foto 360° del exterior (cubemap de 256 px) y el vidrio la muestra según el ángulo de la cámara, así se ve profundidad al moverte sin dibujar el exterior cada cuadro. Marco hondo, rejas y postigos en 3D.
- **Completo**: hueco real con vidrio; el cielo, la calle, el patio y los vecinos se dibujan de verdad, y entra luz de sol (la sombra de la reja cae en el piso).

### Modelos 3D
- Fuentes CC0: Kenney (Furniture Kit y kits de ciudad), Poly Haven (muebles PBR, texturas y cielo HDRI), Quaternius; Poly Pizza revisando la licencia de cada modelo.
- Van en modelo: muebles, lámparas, cocina, baño, plantas, árboles, ventiladores, reloj, radio, coche. Siguen en código: muros, pisos, mesas de juego, cartas, fichas y dados.
- **Dos juegos de modelos** (cada modelo del catálogo tiene las dos versiones):
  - *Completo* (laptop e iPhone): modelos detallados, texturas de 2k en lo que se ve de cerca y sombras reales. Unos 20–40 MB por piso, 100–150 MB la casa entera.
  - *Medio* (Android débil): versiones reducidas con texturas de 512, unos 25 MB la casa entera.
  - *Ligero*: sin modelos.
- **Texturas KTX2** (comprimidas dentro de la tarjeta gráfica, de 4 a 8 veces menos memoria): así caben las de 2k en iPhone sin que Safari recargue la página. Hace falta el KTX2Loader de three y su decodificador (wasm, también desde jsDelivr).
- **Carga progresiva**: solo se baja el piso donde estás; primero aparece con la versión ligera y en segundo plano se cambia a la HD. Al cambiar de piso se libera la memoria del anterior. Todo queda en la caché del navegador.
- **Preparar modelos** (en tu computadora, no en el servidor): un script que toma cada .glb original y genera las dos versiones (reduce polígonos, convierte texturas a KTX2 de 2k y de 512) y llena el catálogo. El servidor sigue sin dependencias.
- Se mide en un iPhone real y en un Android débil (D7); si un iPhone viejo se queda sin memoria, se le baja a la versión Medio automáticamente.
- Se sirven desde **jsDelivr** (CDN gratis que lee del repo público en GitHub), con la versión fija por etiqueta (`modelos-v1`, `v2`…), así Render no gasta tráfico. En localhost se usan los archivos locales. Si jsDelivr falla, se cae a Render.
- Arreglo en server.js: caché larga para `modelos/` (hoy todo sale `no-store` salvo el audio) y enviar los archivos grandes por partes en vez de `readFileSync`, para no congelar el polling.
- Carpeta `modelos/` con un catálogo (`modelos.json`: archivo, fuente, licencia, tamaño). Cada descarga se pide antes (nombre, origen, tamaño).

### Fases (cada una se prueba y se sube)
- ✅ **D1 Base**: `c_casa_glb.js` (cargador GLB + KTX2 con puente al THREE global; elige versión HD o Medio según la calidad; carga progresiva del piso actual y libera al cambiar; elige jsDelivr o local), script para preparar modelos (dos versiones + catálogo), caché y envío por partes en server.js, medidor de FPS y memoria.
- ✅ **D2 Cielo y ventanas**: `c_casa_cielo.js` (cielo y sol compartidos) y `c_casa_ventanas.js` (las dos versiones). Se estrenan en la planta alta, que ya está bien.
- ✅ **D3 Planta baja**: `c_casa_pb.js` con la distribución nueva: zaguán, salón con las mismas mesas, escalera; luego cocina, comedor y baño con sus modelos.
- ✅ **D4 Exterior**: `c_casa_calle.js` (calle, fachada, vecinos) y `c_casa_patio.js` (patio trasero); `c_casa_lote.js` junta las piezas en pocas mallas. En la planta baja el exterior es el fondo de la casa (CIELO.fondo) y los bloques que tapan a tu Mii se esconden.
- ✅ **D5 Alta y terraza**: `c_casa_casco.js` (la casa por fuera: azotea, fachadas, planta alta remetida con sus ventanas y la terraza encima; desde la calle y el patio se ve de dos pisos). La terraza mide lo mismo que la alta (es su techo) y dibuja el exterior compartido con la luz del tema; la alta también. Muros de la alta con el kit de la planta baja (`CPB.kit`), ventanas nuevas con VENT y los primeros modelos (Poly Haven CC0: sillón, mesita, jarrón, vitrina, planta, ventilador y mecedoras).
- ✅ **D6 Sótano ampliado**: el cuarto llega hasta x=-32. Pasando la cantina (dos mesitas y rockola), un arco al casino (Póker y Blackjack detallados sobre alfombra, papel tapiz vino, apliques, cuadro y plantas) y un arco ancho al billar (mesa de pool de 9 pies con medidas reales para jugarla después, taquera, marcador, banca y neón). Mesas "próximamente". Módulos: `c_sotano_salon.js` (SAL), `c_billar3d.js` (BIL), `c_casino3d.js` (CAS3). Pendiente: modelos para la cantina (falta bajarlos).
- ✅ **D7 Pulido y medición** (código): en `c_casa_glb.js` sombras falsas bajo los modelos en Medio, copias del mismo modelo como instancias (`inst:false` para lo que se mueve) y HD → Medio solo si se acaba la memoria (cierre a la fuerza cargando HD, contexto WebGL perdido, HD que no cupo o JS al 90 %; dura 7 días, `CGLB.hd(true)` lo regresa). El medidor (F3 o `?medir`) ya da tiempo de página, primera imagen y modelos del piso. Pendiente: medir en iPhone, laptop y Android débil.

## Reglas técnicas
- Todo lo nuevo va en módulos pequeños (por ejemplo `c_casa_cam.js`, `c_casa_avatar.js`, `c_casa_pisos.js`); no se engordan los archivos grandes.
- Las escenas actuales siguen funcionando hasta que cada juego se migre.
- El modo 2D siempre queda como respaldo.
