# Social y 2D/3D: diagnóstico y plan

Notas del usuario (nov 2026): al juego le falta lo social en los dos modos. "Ligero" debe llamarse **2D**. En 2D no te sientes parte de la casa, no sabes si hay partidas sin abrir el menú de cada juego, no te pueden invitar, el código de sala ya casi no se usa. Hay mucha diferencia entre la interfaz 2D y la 3D, y cada juego tiene la suya: debe ser más universal. Quiere saber quién está conectado.

## Cómo está hoy (lo revisado en el código)

- **Presencia.** El servidor ya sabe quién anda en la casa: `POST /casa` (server.js `casaAct`) guarda nombre, personaje, piso, posición, emote y lo que dijo; caduca a los 8 s. Responde también `salas()`: cada sala con estado (esperando / jugando / fin), jugadores, host y mirones.
- **Quién lo consulta.** Solo la casa 3D (c_casa3d.js, `active()=on&&!S`) y las mesas 2D del sótano (c_casino2d.js, c_billar2d.js con piso `'2d'`). El inicio 2D (c_lobby_home.js), la sala 2D (c_sala2d.js) y los juegos de cartas **no**: en 2D eres invisible y no ves a nadie.
- **Dentro de una partida desapareces de la casa**: la casa deja de mandar `/casa` mientras hay sala (`!S`), y a los 8 s ya no estás en la lista "En la casa". Solo queda la mesa animada (OCUP) sin decir quién.
- **Los del sótano 2D en la casa 3D**: llegan con piso `'2d'`, que no está en `PISO` (c_casa_hud.js): salen sin piso en la lista, y su Mii se crea en (0,0) porque mandan x:0,z:0.
- **Lista de gente** (CHUD `gente`): nombre y piso, nada más. No se puede tocar a nadie (invitar, ir con él, mirar su partida).
- **Unirse**: código de 5 letras, o enlace `/#CODIGO` (c_lobby.js y c_sala.js ya lo comparten con `navigator.share`). No hay invitación dentro del juego.
- **Partidas en curso**: en 3D, al acercarte a una mesa (CMESA: "2 jugando", Mirar, salas esperando). En 2D, solo al elegir ese juego en el inicio.
- **Charla**: chat por sala (game.js) y gestos 1–8 (M2D en 2D, casa en 3D). Burbujas `say` solo en la casa 3D. No hay charla de casa en 2D.
- **Interfaces por juego**:
  - 3D con GHUD (c_juegos_hud.js): Continental, Uno, MD, Ruleta, Rummy.
  - 3D con interfaz propia: Mérida (c_meridaui.js, 63 KB), YuCATÁN (c_haciendasui.js), Póker, Blackjack, Billar (cada uno con su `_hud.js`).
  - 2D con M2D (c_mesa2d.js): Uno, Continental, MD.
  - 2D sueltos: Mérida (c_merida2d.js), YuCATÁN (c_haciendas2d.js), Rummy (c_rummy2d.js), Blackjack y Póker (c_casino2d.js), Billar (c_billar2d.js), Ruleta (c_rr2d.js), Conecta 4 (c_c4_2d.js).
  - O sea: hay 4 marcos distintos de menú, turno, salir y final.

## Recomendaciones (en orden)

### S1. Nombre: "Ligero" pasa a "2D" (esfuerzo: muy bajo)
- Calidad: **2D · 3D · 3D HD** (o 2D · Medio · Completo, con 2D como primera opción). c_bienvenida.js (`QN`, `CARD`), c_casa_hud.js (`QH`, `seg`). El valor interno `'ligero'` se queda igual para no romper `localStorage`.
- Textos "modo Ligero" en comentarios no importan; los que ve el jugador sí.

### S2. Un solo "quién está" para todos (esfuerzo: bajo-medio, servidor)
- El servidor junta en una lista a: los de la casa (`casa`), los que están en una sala (jugando, esperando o mirando, con `seen` reciente) y los de 2D. Cada uno con **dónde está**: "Planta baja", "Jugando Uno", "Esperando en Mérida", "Mirando Póker", "En 2D".
- Clave única: la del aparato (`me`), para que no salga dos veces quien está en la casa y en una sala.
- Se manda en `/casa` y, recortado (número y cambios), en cada `/poll`, para que también se vea dentro de una partida.
- Todos los clientes 2D mandan un latido ligero a `/casa` (cada 4–5 s, sin posición) con `f:'2d'`. Agregar `'2d'` a `PISO`.

### S3. La lista de gente que sirve para algo (esfuerzo: medio)
- Botón de gente (con número) en el **mismo lugar** en casa 3D, inicio 2D y dentro de los juegos.
- Cada persona: retrato (AV2D en 2D, el mismo de CHUD), nombre, dónde está (una línea). Al tocarla: **Invitar** (si estás en una sala), **Ir** (3D: caminar a su mesa; 2D: abrir su mesa), **Mirar** (si está jugando).
- Sin texto extra: ni hora de conexión ni historial.

### S4. Invitar (esfuerzo: medio)
- Desde la sala de espera: botón **Invitar** junto a "Compartir" que abre la lista de conectados; tocar a alguien le manda la invitación.
- Servidor: `inv[id] = {de, juego, code, ts}`, vive 60 s, se entrega en la siguiente respuesta de `/casa` o `/poll` del invitado.
- Al invitado le sale una tarjeta corta: retrato de quien invita, "Uno", botones **Ir** y **Ahora no**, y la barra de tiempo. Sonido suave. Funciona en casa 3D, inicio 2D y aunque esté en otra partida (tarjeta pequeña que no tapa).
- El código pasa a segundo plano (dentro de "Compartir" o un "Tengo un código" pequeño). El enlace se queda.
- Después: notificación del sistema con la PWA (sw.js y manifest ya existen) para invitar a quien tiene la app cerrada. Es más trabajo (push con llaves VAPID); dejarlo para el final.

### S5. Casa 2D: un plano en vez de un menú (esfuerzo: medio-alto, el que más cambia la sensación)
- El inicio 2D deja de ser "elige juego" y pasa a ser **la planta de la casona vista desde arriba** (como los planos del anteproyecto, en estilo Cálida): patio, cuartos y mesas. Pestañas por piso (Sótano, PB, PA, Azotea), las mismas de la casa 3D.
- Cada mesa es un botón con el ícono del juego. Si hay partida: los retratos de quien juega alrededor y una marca de "en curso"; si hay sala esperando: un asiento libre que late. Tocar una mesa abre el **mismo panel** que CMESA en 3D (Mirar, Unirme, Crear sala).
- Los de 3D se ven como puntitos/retratos en su cuarto (con x,z del `/casa`); los de 2D aparecen en la mesa o cuarto que tocaron.
- Al tocar una mesa en 2D se manda la posición de esa mesa: **los de 3D te ven parado junto a ella** (tu Mii en pose de espera, sin caminar). Así los de 2D sí "están" en la casa.
- Un solo lienzo, sin modelos: barato para los Android débiles. Datos de mesas y cuartos: los mismos empties del GLB que lee MARC (exportar un JSON pequeño al hornear para no cargar el GLB en 2D).

### S6. Que se note que hay vida (esfuerzo: bajo)
- Avisos cortos (toast, 2 s, sin registro): "Ana llegó", "Ana abrió Uno". Hoy existe "entró a la casa" solo en 3D; llevarlo a 2D y a dentro de los juegos (más discreto).
- En 3D, el letrero de cada mesa ocupada dice quién juega (retratos pequeños), no solo la animación de OCUP.
- Burbujas de lo que dicen (`say`) también en el plano 2D, sobre el retrato.
- Al terminar una partida: **Otra** con la misma gente (ya en sala) y, si sales, regresar a la casa junto a esa mesa (3D) o a esa mesa del plano (2D), no al menú.

### S7. Un marco de mesa igual para todos los juegos (esfuerzo: alto, por partes)
Regla: lo que rodea al juego es igual en todos; solo cambia lo del centro.
- **Arriba**: a la izquierda estado y turno (pastilla con retrato de quien juega y barra de tiempo); a la derecha gente, gestos y menú. Mismo orden, mismos íconos, en 2D y 3D.
- **Menú (☰)**: una sola hoja con las mismas pestañas en todos (Juego, Sonido, Vista 2D/3D con `UI.dim`, Reglas, Salir). Salir siempre en el mismo lugar y con la misma confirmación.
- **Gestos y chat**: los mismos 8 gestos y el mismo chat de sala, mismo botón, en todos.
- **Final**: una pantalla común (podio con retratos, Otra, Volver a la casa) con un hueco para el resumen de cada juego (como MFIN de Mérida).
- **Orden sugerido**: GHUD ya cubre 5 juegos 3D y M2D 3 juegos 2D. Hacer de GHUD + M2D un solo "marco" (`MARCO`) que dibuje arriba/menú/gestos/final en 2D y 3D, y mover uno por uno: Póker y Blackjack (HUD chico, fácil), Billar, Rummy 2D, YuCATÁN, y Mérida al final (la más grande).
- Cambiar de 2D a 3D dentro de la partida con el mismo botón en todos (hoy depende del juego).

### S8. Identidad y conocidos (esfuerzo: bajo, opcional)
- Guardar en el aparato con quién has jugado (nombre + clave). En la lista de gente, primero los conocidos.
- Evitar nombres repetidos en una misma sala (agregar un número pequeño), para que "Invitar" no se confunda.

## Qué haría primero
1. S1 (nombre 2D) + S2 (lista única con latido 2D y `'2d'` en PISO) + S3 sin invitar: ya se sabe quién está y dónde, en los dos modos.
2. S4 invitar.
3. S6 avisos y "volver a la mesa".
4. S5 plano 2D.
5. S7 marco común, un juego a la vez.
