# Casa de juegos 3D

Servidor Node sin dependencias + cliente JS puro. Arranque: `npm start`.

## Archivos (no abrir completos)
Las líneas son muy largas, así que los archivos pesan mucho más de lo que parece.
- GRANDES: c_continental3d.js (~28k tokens), c_monopolydeal.js (~17k), c_uno3d.js (~14k), style.css (~13k), c_casa3d.js (~12k), continental3d.html (~10k).
- Reglas en servidor: g_continental.js, g_uno.js, g_monopolydeal.js.
- server.js (salas, polling, bots), server3d.js (sirve la versión 3D).
- Mérida en Venta: g_merida.js (reglas), merida_data.js (tablero y cartas), c_merida.js (lobby y ayudantes MR), c_meridaui.js (interfaz: barra, acciones, pestañas, temas), c_merida3d.js (tablero 3D en el cuarto de C3D) y c_merida2d.js (tablero 2D). Los dos tableros exponen la misma API (M3/M2).

- Modelos 3D: c_casa_glb.js (CGLB.pon(piso, nombre, {pos,rot,esc}) carga .glb del catálogo modelos/modelos.json), srv_modelos.js (envío por partes y caché de modelos/), preparar_modelos.js (genera hd/ y medio/ desde modelos/originales/), c_casa_medidor.js (F3 o ?medir: FPS y memoria). Exterior: c_casa_cielo.js (CIELO: cielo, sol/luna y horizonte según el tema) y c_casa_ventanas.js (VENT.pon: ventana con portal en Completo y cubemap en Medio).

## Interfaz
- Todo cambio visual (botones, paneles, avisos, pantallas 3D) sigue la skill `casa-ui` (.claude/skills/casa-ui): estilo Cálida con los tokens de ui.css; nunca regresar al estilo Windows 7 (clases w7…).

## Cómo leer y editar
- Nunca abrir un archivo completo: usar grep para ubicar la función y leer solo ese tramo.
- No explorar el repo. Leer solo lo que se indique; si hace falta otro archivo, preguntar antes.
- No releer un archivo que ya se leyó en la sesión.
- Ediciones puntuales; nunca reescribir archivos completos.
- Código nuevo grande va en módulos nuevos pequeños, no en los archivos grandes.

## Cómo responder
- Respuestas cortas, sin resúmenes de lo que se acaba de hacer.
- Plan de máximo 5 líneas antes de escribir código; esperar confirmación.
- Si algo es ambiguo, preguntar en vez de probar varias opciones.

## Navegador
- No usar Browser MCP salvo que se pida.
- Si se usa: leer la consola antes que tomar capturas, máximo una captura por verificación.

## Git
- No hacer commit ni push salvo que se pida.
- No mostrar diffs completos; usar `git status` corto.
