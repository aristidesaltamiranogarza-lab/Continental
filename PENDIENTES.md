# Pendientes de la casa

Lista corta de lo que falta. El plan completo está en ROADMAP_CASA.md.

## Lista del 6 nov 2026 (de las fotos del celular), en orden
Probar todo en celular **vertical y horizontal, también en 21:9** (360×840 y 840×360).

**Tanda 1 · hecha (6 nov)**: piso del sótano sin cuadrícula, brillo de UNO bajo las cartas, nombres que esquivan Cuadrar, pastillas del mazo, aviso doble, letreros encimados, mano de Uno en vertical y aviso ¡UNO! en Cálida. La "barra negra" de la izquierda era la isla dinámica del iPhone (no es del juego). Falta confirmarlo en el celular.

**Tanda 2 · hecha (6 nov)**: tomatazos a ti chicos, en la franja de en medio, transparentes y máximo 4 (la "pantalla roja" de las fotos eran tomates, no la cámara en el puff). En Rummy y Ruleta ya llegan al nombre del jugador. En los 3D el botón 🍅 va a media altura a la derecha.

**Tanda 3 · hecha (6 nov)**: la "Vista clásica 2D" de Continental y UNO dentro de la casa va en Cálida (c_juegos2d.js pone html.g2dui; estilos en ui_juegos.css, sin tocar el 2D Ligero). Monopoly Deal ya lo estaba (c_mdeal_hud.js). Falta verlo en el celular.

**Tanda 4 · Miis, última mejora** (los definitivos). Antes de la Ruleta. Falta que Aris diga qué cambiar.

**Tanda 5 · Ruleta Rusa: rehacer las animaciones**. Aris va a detallar. De paso: el registro de la izquierda repite el aviso grande y la pistola se ve muy oscura.

## Problemas por revisar
- **FPS bajan cerca de las dos mesas altas del sótano** (cantina, `mesa_cantina`). Cada mesa es ligera (3,662 triángulos, un material), así que sospechar de lo que hay alrededor: vasos, rockola, luces de esa zona. Medir parado en ese lugar ocultando cada cosa.
- **Un cuadro de 244 ms al entrar al sótano** (CASA3D.ir('sot')). No son las texturas (initTexture ya es ≤3 ms con KTX2); probablemente armar el piso o compilar shaders.
- **Probar en iPhone**: abrir `http://<IP de la PC>:3000/?medir` en la misma Wi‑Fi. Si no carga, permitir Node en el firewall de Windows (redes privadas).

## Del roadmap
- **D7 medición en dispositivos**: celular y PC modesta, en Medio y Completo (FPS, memoria, si Safari recarga la página).
- **Paso 5 de la UI** (prompt_ui.md): se dejó en pausa hasta terminar el Bloque D.
- **4d Mesas ocupadas**: animación genérica de mesa con partida en curso.
- **Migrar los juegos a su mesa**: hecho para Continental, Uno, Mérida y YuCATÁN (c_casa_fondo.js: la casa de fondo con el mismo WebGL). Falta Monopoly Deal (pantalla 2D). Miis al 80 % (MII.K en c_mii.js).
- **Fase 5: Póker y Blackjack jugables** en el sótano (hoy solo están las mesas).
- **Billar jugable** (BIL.D ya trae las medidas) y quitar los letreros "próximamente".
