# Social y 2D/3D: diagnóstico y plan

## Reglas fijas (leer siempre antes de tocar menús o paneles)
- **Menús universales.** Hoy hay 3 tipos de interfaz (casa 3D, juegos 3D, 2D) y cada una abre su menú en un lugar distinto y con opciones distintas. Todo menú, panel o botón nuevo debe salir **en el mismo lugar, con las mismas opciones y el mismo orden** en 2D, 3D y en todos los juegos. Si al tocar algo ves una diferencia, se corrige hacia el marco común (S7), no se agrega una variante más.
- La lista de gente es una sola pieza (GENTE, c_gente.js) que usan la casa 3D, el inicio 2D y los juegos.

## Avance
- [x] S1 nombre 2D · [x] S2 lista única · [x] S3 lista de gente · [x] S4 invitar · [x] S5 plano 2D · [x] S6 avisos · [ ] S7 marco común · [ ] S8 conocidos

Notas del usuario (nov 2026): al juego le falta lo social en los dos modos. "Ligero" debe llamarse **2D**. En 2D no te sientes parte de la casa, no sabes si hay partidas sin abrir el menú de cada juego, no te pueden invitar, el código de sala ya casi no se usa. Hay mucha diferencia entre la interfaz 2D y la 3D, y cada juego tiene la suya: debe ser más universal. Quiere saber quién está conectado.

Hecho (nov 2026): servidor `gente()` manda `q` en `/casa` y en cada `/poll` (k = huella del aparato, nunca la clave; `yo` marca quién eres). c_gente.js (GENTE) con pastilla y panel únicos, latido cuando nadie trajo la lista en 3.5 s. Pastilla puesta en: casa 3D (CHUD), inicio 2D, sala de espera, juegos con GHUD y mesa 2D M2D (ahí el ☰ pasó a la derecha, como en 3D, y su menú abre a la derecha). La casa 3D ya no dibuja a los de '2d' en (0,0).
S3 hecho: en la lista, sin sala, Unirme (esperando) o Mirar (ya empezó) junto a quien está en una partida (GENTE.a). Mérida y YuCATÁN: "Conectados · N" en su menú de Opciones (en su columna de botones no cabe a 360 de alto). Otras pantallas en partida sin pastilla (Rummy 2D, Ruleta 2D): GENTE pone una flotante arriba a la derecha (#genFlota, sin probar en esas dos). Ir con alguien que anda en la casa: falta (el servidor no manda su posición en q).
S4 hecho: POST /inv (server.js invita/invDe, vive 60 s, se entrega en /casa y /poll como `inv`); en la lista, "Invitar" junto a quien no está en tu sala (solo si tú estás en una); tarjeta arriba al centro con Ir / Ahora no y barra de 20 s. Ir: si estabas en otra partida te levanta (queda un bot) y entra; si ya empezó, entra a mirar. Pestaña escondida: el título parpadea "Ana te invita · Uno", vibra, y la barra de 20 s corre al volver; el latido sigue con la pestaña escondida.
Web Push (navegador cerrado, sin instalar nada): srv_push.js (VAPID sin dependencias, push sin contenido; solo hosts de push conocidos), rutas /push_llave, /push, /push_inv; sw.js muestra el aviso y al tocarlo pasa la invitación a la pestaña o abre /?inv=CODIGO(&mira=1). Interruptor "Avisarme si me invitan" al final de la lista de gente (no sale si el navegador bloquea avisos). En Render: poner VAPID_PUB y VAPID_PRIV (salen en el log la primera vez que arranca sin ellas); si no, las llaves cambian en cada reinicio y hay que volver a activar. Render gratis duerme a los 15 min: sin nadie jugando no hay avisos. iPhone: solo con la página en la pantalla de inicio. Sin probar con un push real (el panel del navegador bloquea avisos).
S4: la tarjeta "Invita a tu gente" de la sala de espera lista a los conectados con Invitar (GENTE.invitables).
S6 hecho: avisos "Ana llegó" / "Ana abrió Uno" de GENTE en 3D, 2D y juegos (más chicos en partida; reemplazan los de c_casa3d.js); letrero de la mesa (CMESA) con retratos y quién juega; al salir de una partida quedas junto a esa mesa (c_casa3d.js volverMesa). "Otra" ya existía en cada juego. Falta, con S5: burbujas `say` y volver a la mesa en el plano 2D.

## Cómo estaba (lo revisado en el código)

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

S5 hecho (nov 2026): el inicio 2D es la planta de la casona (c_plano2d.js, PLANO2D; estilos .pl- en ui_lobby.css). Datos en plano_casona.js, GENERADO por `python blender/plano.py` (cuartos de NIV en casona.py, mesas de los empties mesa_* de cada GLB; volver a correrlo al mover mesas). Pestañas por nivel, mesas con ícono, retratos de quien juega y asiento que late si hay sala; tocar una mesa abre el panel de CMESA (CMESA.abre2d/panel2d; Póker, Blackjack y Billar abren su mesa 2D) y quedas parado junto a ella: GENTE.latido manda esa posición cada 2 s y los de 3D te ven ahí. Gente de la casa como retratos con su globito (`say`). Al salir de una partida vuelves junto a esa mesa del plano. El inicio viejo queda de respaldo donde no hay plano (continental.html). Falta: decir algo (`say`) desde el 2D.
