# Pendientes de la casa

Lista corta de lo que falta. El plan completo está en ROADMAP_CASA.md.

## Problemas por revisar
- **FPS bajan cerca de las dos mesas altas del sótano** (cantina, `mesa_cantina`). Cada mesa es ligera (3,662 triángulos, un material), así que sospechar de lo que hay alrededor: vasos, rockola, luces de esa zona. Medir parado en ese lugar ocultando cada cosa.
- **Un cuadro de 244 ms al entrar al sótano** (CASA3D.ir('sot')). No son las texturas (initTexture ya es ≤3 ms con KTX2); probablemente armar el piso o compilar shaders.
- **Probar en iPhone**: abrir `http://<IP de la PC>:3000/?medir` en la misma Wi‑Fi. Si no carga, permitir Node en el firewall de Windows (redes privadas).

## Del roadmap
- **D7 medición en dispositivos**: celular y PC modesta, en Medio y Completo (FPS, memoria, si Safari recarga la página).
- **Paso 5 de la UI** (prompt_ui.md): se dejó en pausa hasta terminar el Bloque D.
- **4d Mesas ocupadas**: animación genérica de mesa con partida en curso.
- **Migrar los juegos a su mesa**: cada juego montado en un ancla de mesa en vez de su propia escena.
- **Fase 5: Póker y Blackjack jugables** en el sótano (hoy solo están las mesas).
- **Billar jugable** (BIL.D ya trae las medidas) y quitar los letreros "próximamente".
