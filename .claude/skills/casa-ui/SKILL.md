---
name: casa-ui
description: Reglas del estilo "Cálida" (día y noche) de la interfaz de la Casa de juegos 3D. Úsala antes de crear o cambiar cualquier botón, panel, aviso, menú o pantalla de la casa o de un juego en la versión 3D (continental3d.html), para no regresar al estilo Windows 7 (clases w7…).
---

# Interfaz "Cálida" de la casa

El estilo Windows 7 / Aero (degradados grises, vidrio azul, clases `w7…`) ya no se usa. Todo lo nuevo va con los tokens y componentes de `ui.css`.

## Archivos
- `ui.css`: tokens (variables CSS) de día y noche, componentes base. Las clases `w7…` ya no existen (se borraron en nov 2026).
- `c_ui.js` (se carga en `<head>`): `UI.tema()` / `UI.setTema('auto'|'dia'|'noche')` (localStorage `casa_tema`), `UI.noche()`, `UI.on(fn)` e iconos `UI.ico(nombre)`. Pone `html[data-tema=dia|noche]` y mantiene en sintonía `cont_dark` y la clase `c3dark` de los juegos viejos.
- `ui_casa.css`: HUD de la casa y reestilo de avisos, letreros de mesas, nombres y globitos.
- `c_casa_hud.js` (CHUD): pastilla del piso, gente, ajustes, controles, chat y rueda de gestos.
- `c_casa_mesa.js` (CMESA): aviso "Jugar … · N jugando" (tecla E) y panel de la mesa.
- `c_juegos_hud.js` (GHUD) + `ui_juegos.css`: interfaz de dentro de los juegos 3D. `GHUD.top` (pastillas de estado y turno, cámara y ☰), `GHUD.hint`, `GHUD.toast`, `GHUD.bar` (botones `.ui-btn` abajo), `GHUD.cam`/`camTog`, `GHUD.view` (Cuadrar), `GHUD.sheet` (un solo panel con pestañas) y `GHUD.ajustes` (tema, música, sonidos + filas del juego). Nombres en la mesa: `.gj-seat`, `.gj-pl`; tarjetas: `.gj-win`; ventanas modales: `.ui-sheet.mid`.
- Archivo nuevo = registrarlo en el mapa `files` de `server.js` y en `continental3d.html`.

## Tokens (usar siempre `var(--ui-…)`, nunca colores sueltos)
| token | Día | Noche |
|---|---|---|
| `--ui-panel` (botones flotantes) | rgba(253,246,233,.93) | rgba(40,27,20,.90) |
| `--ui-sheet` (paneles) | #FDF6E9 | #2A1D16 |
| `--ui-line` (borde 1px) | rgba(94,52,24,.18) | rgba(255,226,196,.16) |
| `--ui-text` | #3A2416 | #F7EADB |
| `--ui-sub` | #6E4F3A | #C9B19C |
| `--ui-icon` | #B8481F | #F0A77E |
| `--ui-accent` | #C2512A | #E8834F |
| `--ui-on` (texto sobre accent) | #FFF8EE | #24140C |
| `--ui-chip` | rgba(194,81,42,.10) | rgba(255,226,196,.08) |
| `--ui-field` | #FFFFFF | rgba(255,255,255,.06) |
| `--ui-shadow` | 0 6px 18px rgba(58,36,22,.25) | 0 8px 24px rgba(0,0,0,.45) |
| `--ui-scrim` | rgba(40,22,10,.40) | rgba(0,0,0,.48) |

Radios: paneles `var(--ui-r)` (22px); botones y pastillas 999px. Letra: `var(--ui-font)` (Nunito 600/700/800, respaldo system-ui).

## Componentes de `ui.css`
- Contenedor: `.ui` (letra, color). Flotante fijo: `.ui-fx`.
- `.ui-pill` pastilla flotante; `.ui-rb` botón redondo (`.big` de color, `.on` activo) con `.ui-badge` para contadores.
- `.ui-btn` botón de texto de color (`.sec` suave, `.ghost` sin fondo, `.full` ancho completo).
- `.ui-card` tarjeta; `.ui-sheet` hoja de abajo en celular que en compu (≥768px) es tarjeta a la derecha (`.der`), panel abajo-izquierda (`.izq`) o al centro (`.mid`); `.ui-scrim` fondo (`.ligero` = transparente en compu). Cabecera `.ui-hd` + `.ui-h` + cerrar `.ui-x`; cuerpo con scroll `.ui-bd`.
- `.ui-seg` segmentado (botones con `.on`), `.ui-sw` interruptor (`<label class="ui-sw"><input type="checkbox"><i></i></label>`), `.ui-in` campo, `.ui-row` fila de ajustes, `.ui-lbl` etiqueta, `.ui-sub` texto secundario, `.ui-toast` aviso, `.ui-tag` etiqueta.
- Iconos: `UI.ico('menu'|'gente'|'chat'|'gesto'|'ojo'|'persona'|'x'|'abajo'|'casa'|'ajustes'|'musica'|'sonido'|'ayuda'|'salir'|'sol'|'luna'|'calidad'|'jugar'|'llave'|'enviar'|'teclado')`. Si falta uno, agrégalo a `c_ui.js` con el mismo trazo (24×24, stroke 2, sin relleno).

## Reglas
1. Nada de estilo Windows 7: ni degradados grises o azules, ni vidrio Aero, ni barras de título con ✕ roja. No escribir `w7…` en código nuevo; al tocar una pantalla vieja, pásala a los componentes `ui-…`.
2. Botones de al menos 44 px. Iconos SVG de trazo de `UI.ico`, un solo estilo; no emoji en botones (los gestos y los iconos de cada juego sí son emoji).
3. Los colores salen de los tokens, así día y noche funcionan solos. Probar siempre los dos temas (`UI.setTema('dia')` / `UI.setTema('noche')`).
4. Misma estructura en celular y compu: piso arriba-izquierda; gente y ajustes arriba-derecha; joystick (celular) o tarjeta de controles (compu) abajo-izquierda; ojo, gestos y chat abajo-derecha; aviso de la mesa al centro abajo. Los paneles son hojas de abajo en celular y tarjetas en compu.
5. Ajustes vive en un solo panel (CHUD): nombre, calidad, tema, música, sonidos, primera persona, "Cómo se juega", "Salir de la casa". No agregar más barras.
6. Teclas de la casa: W A S D caminar, V primera persona, Enter chat, G gestos, 1–8 gestos directos, E abrir la mesa, Esc cerrar. La lista de gestos (`EMO`) está en `c_casa3d.js` y en `server.js`: cambiar ambas.
7. Revisar en celular (375×812) y en compu antes de dar algo por terminado.
8. No tocar el modo 2D Ligero (`continental.html`, `style.css`, la pantalla 2D clásica). Excepción: el inicio y la sala de espera sin casa los dibuja `c_lobby.js` (LOBBY) con `ui_lobby.css` bajo `html.lbon`. Los estilos de `ui.css` no deben afectar fuera de `.ui…`, `.w7…` y los elementos de la casa.
9. Código nuevo en módulos pequeños (como `c_casa_hud.js`), no en los archivos grandes.

## Movimiento (nivel de la portada: obligatorio)
El usuario pidió mantener el nivel de calidad de la portada (`c_portada.js`): es la referencia para toda pantalla nueva o cambiada. Abrirla antes de animar algo.
- Toda pantalla tiene entrada y salida. Las piezas entran escalonadas (≈50–150 ms entre una y otra) con rebote: `cubic-bezier(.3,1.4,.5,1)`; las salidas son rápidas y hacia afuera (telón, irse volando).
- Botones y tarjetas reaccionan: se levantan al pasar el mouse (`@media (hover:hover)`), se hunden al tocar (`scale(.95)`), latido al elegir.
- Cargas: nunca negro ni texto suelto. Una escena dibujada con progreso real (la fachada con ventanas que se prenden) y salida con transición (entrar por la puerta).
- Detalles vivos y baratos: cosas que flotan, nubes, un personaje que respira.
- Solo `transform`/`opacity` (y `translate`/`scale`/`rotate` sueltos); nada de blur grande. Respetar `prefers-reduced-motion`.
- `render()` rehace el HTML: animar con un tiempo de inicio y `animation-delay` negativo (patrón `--edl` de PLANO2D) para que no se reinicie.
- Nada sale preseleccionado: sin `focus()` automático en botones ni bordes de "última vez"; el aro de foco solo con teclado (`html.teclado`, c_ui.js).
- Probar a 840×360 y 360×840.

## Pendiente
Todas las pantallas de los juegos 3D ya van en Cálida: Uno 3D, Continental 3D, Rummy y Ruleta con GHUD; Conecta 4, Backgammon, Cubilete e "Ir a…" con `GHUD.win`; Mérida y YuCATÁN mapean sus variables `--mu-…` a los tokens y siguen el tema de la casa (en c_meridaui.js hay un `UI` local: usar `window.UI`); bienvenida con tokens; sobras w7 de la casa con `.ui-glass`. Monopoly Deal: c_mdeal_hud.js envuelve su pantalla (☰ con GHUD.sheet) y ui_juegos.css la reestiliza bajo `html.mdui`, sin tocar c_monopolydeal.js ni style.css (los comparte el 2D Ligero).
