# Casa de juegos 3D

Servidor Node sin dependencias + cliente JS puro. Arranque: `npm start`.

## Archivos (no abrir completos)
Las líneas son muy largas, así que los archivos pesan mucho más de lo que parece.
- GRANDES: c_continental3d.js (~28k tokens), c_monopolydeal.js (~17k), c_uno3d.js (~14k), style.css (~13k), c_casa3d.js (~12k), continental3d.html (~10k).
- Reglas en servidor: g_continental.js, g_uno.js, g_monopolydeal.js.
- server.js (salas, polling, bots), server3d.js (sirve la versión 3D).

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
