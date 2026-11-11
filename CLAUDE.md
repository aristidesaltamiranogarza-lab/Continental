# Casa de juegos 3D

Servidor Node sin dependencias + cliente JS puro. Arranque: `npm start`.

## Ahorro de tokens (prioridad)
- Las líneas son muy largas. Para buscar, recortar la salida: `grep -n -o '.\{0,80\}PATRON.\{0,80\}' archivo`. Leer con offset/limit, nunca un archivo entero.
- No explorar ni releer lo ya leído. Si hace falta un archivo que no esté en el mapa, preguntar.
- Verificar con `node --check` (y `npm test` cuando exista). Navegador solo si no hay otra forma; consola antes que captura, máximo una captura.
- Ediciones puntuales. Código nuevo grande va en módulos nuevos pequeños.
- Respuestas cortas, sin resumir lo hecho. Commits de 1–2 líneas.

## Flujo
- No pedir confirmación del plan: implementar, verificar y subir. Preguntar solo si algo es ambiguo.
- Al terminar: commit y push sin preguntar. Agregar solo los archivos tocados (nunca .claude/ ni prompt_*.md).
- `git status` corto; no mostrar diffs completos.
- Un archivo de cliente nuevo se registra en el mapa estático de server.js (~línea 14) y en la línea de scripts de continental3d.html (antes de c_casa3d.js).
- Sin emojis en el juego (textos, botones, nombres de bots, avisos, títulos, registros); la única excepción son los emotes del personaje. Si al tocar un archivo ves un emoji en lo que ve el jugador, quítalo (sin poner otro ícono en su lugar, salvo que haga falta; entonces UI.ico).
- Cambios visuales: usar la skill `casa-ui` (estilo Cálida, tokens de ui.css; nunca clases w7…).

## Mapa
- GRANDES (tocar con cuidado): c_continental3d.js, c_monopolydeal.js, c_uno3d.js, style.css, c_casa3d.js, continental3d.html.
- Servidor: server.js (salas, polling, bots), server3d.js (sirve 3D), srv_modelos.js (modelos por partes y caché). Reglas: g_continental.js, g_uno.js, g_monopolydeal.js, g_merida.js.
- Mérida en Venta: merida_data.js (datos), c_merida.js (lobby), c_meridaui.js (UI), c_merida3d.js / c_merida2d.js (tableros, misma API M3/M2).
- Casa: c_casa3d.js (pisos PB/FL/goFloor), c_casa_glb.js (CGLB.pon; catálogo modelos/modelos.json), preparar_modelos.js (hd/ y medio/ en KTX2), c_casa_medidor.js (F3 o ?medir), c_casa_cielo.js (CIELO), c_casa_ventanas.js (VENT), c_casa_pb.js (CPB: muros, CPB.kit/CPB.corte), c_casa_calle.js (CCALLE), c_casa_patio.js (CPAT), c_casa_lote.js (LOTE), c_casa_casco.js (CASCO), c_casa_res.js (RES), c_casa_luces.js (LUZ), c_casa_fondo.js (FONDO: la casa de fondo en Continental, Uno, Mérida y YuCATÁN), c_casa_ocupada.js (OCUP: mesas con partida en curso). Mesa nueva de juego: c_mesa3d.js (MESA: mesa redonda, sillas, lámpara; asiento(i), centro), c_mesa_pj.js (MPJ: personajes sentados, cartas en sus manos y reacciones; usa AV.gesto), c_mesa_cam.js (MCAM: cámara viva, Arriba/Recentrar), c_mesa_fx.js (MFX: polvo de fieltro y destellos; FX ya es el contenedor del confeti).
- Sótano: c_ruleta3d.js (cuarto), c_sotano.js (SOT), c_sotano_salon.js (SAL), c_billar3d.js (BIL), c_casino3d.js (CAS3).
- UI: ui.css, ui_casa.css, c_ui.js (UI), c_casa_hud.js (CHUD), c_casa_mesa.js (CMESA), c_sala.js + ui_sala.css (SALA: sala de espera sobre la casa, cámara en CASA3D.sala). Personaje: c_avatar.js (AV), c_mipj.js (MIPJ: pantalla "Mi personaje"). Música: musSlider()/musVol() en music.js.
- Personaje en Blender (escena "Chibi"): blender/pelo.py (peinado 1), blender/pelos.py (peinados 2–7), blender/cuerpo_m.py (cuerpo de mujer, figura Mujer), blender/cintura.py (cintura entallada de la playera), blender/ropa.py (sudadera, blusa, short, falda y piernas en H y M), blender/cara.py y blender/brazos.py (hombros, manga, manos de mitón con agarre), se corren con exec() vía MCP de Blender; parámetros en K, se cambian con PRM. blender/rig.py: copia "Rig" para el juego (esqueleto, pesos, acciones, empties de sien) y exporta blender/chibi_prueba.glb. Plan del personaje personalizable: PENDIENTES.md.
- Pendientes: PENDIENTES.md y ROADMAP_CASA.md (leer solo la sección necesaria).
