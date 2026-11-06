# Pendientes de la casa

Lista corta de lo que falta. El plan completo está en ROADMAP_CASA.md.

## Lista del 6 nov 2026 (de las fotos del celular), en orden
Probar todo en celular **vertical y horizontal, también en 21:9** (360×840 y 840×360).

**Tanda 1 · bugs rápidos que se ven feo**
- Piso del sótano con cuadriculado raro.
- Cartas de UNO demasiado iluminadas, peor cuando están juntas (el brillo se suma).
- "Cuadrar" se pone encima del nombre del rival (Continental y Uno); en Uno vertical tapa el nombre ("papiari / 7 carta") y asoma un "¡UNO!" detrás.
- Continental: las pastillas "Mazo · 91" y "Descarte" tapan las cartas; el aviso para robar sale dos veces (arriba y abajo de la mano).
- Continental: la cámara puede quedar metida dentro del puff rojo (pantalla roja completa).
- Sótano: barra negra vacía a la izquierda bajo el botón de sonido; "Billar" encimado con "Blackjack"; la mesa de Ruleta Rusa se ve sin su foco.
- Uno vertical: el aviso "¡UNO! Ana" cubre casi toda la pantalla; la mano se sale por la izquierda; el botón "¡UNO!" se ve deslavado.

**Tanda 2 · tomates**: se quedan (dan risa), pero que nunca tapen la mano, los botones ni bloqueen jugar.

**Tanda 3 · UI 2D en estilo Cálida**: UNO y Monopoly Deal (y la 2D de Continental, que sigue con botones dorados, "COMPRAR (+1 DE CASTIGO)", "CERRAR SALA").

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
