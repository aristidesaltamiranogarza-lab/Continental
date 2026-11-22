# Casa en Blender: lo aprendido con la prueba del salón

Bitácora viva. La idea es ir pasando la casa a Blender poco a poco, con luz horneada, sin romper lo que ya funciona.
Primera prueba: el salón de la planta baja (22 nov 2026). Se ve con `?casa=glb`; sin la bandera la casa queda igual que antes.

---

## 1. Por qué Blender

- **Lo acogedor es la luz, no los muebles.** La casa en código tenía la misma luz en todos lados: las lámparas no iluminaban nada y los rincones lucían igual que el centro. Por eso se veía plana, como maqueta.
- **Luz horneada = luz bonita gratis en el teléfono.** Blender (Cycles) calcula la luz con rebotes, sombras suaves y charcos bajo las lámparas, y la guarda en una textura (lightmap). En el juego se usa `MeshBasicMaterial` + `lightMap`, que es más barato que cualquier material con luces reales. Cumple la regla de 60/30 FPS en Android débiles.
- **La arquitectura gana lógica.** En código cada cosa es una coordenada suelta. En Blender se modela el cuarto completo y se ve cómo queda antes de meterlo.

## 2. Qué se hizo (archivos)

| Archivo | Qué es |
|---|---|
| `blender/salon.py` | Script que arma el salón en Blender, hornea la luz y exporta. Se corre con `exec()` vía MCP. Medidas en `K`. |
| `blender/salon.blend` | Archivo de trabajo aparte (no se sube). **Nunca** trabajar en la escena "Chibi" del usuario. |
| `modelos/salon/salon.glb` | Geometría (~190 KB). UV0 en metros (texturas que se repiten), UV1 = lightmap. |
| `modelos/salon/salon_luz.jpg` | Lightmap 2048², ~1 MB. |
| `c_casa_salon.js` | `SALON`: carga el GLB, pone materiales, cuelga los muros del sistema de corte y agrega choques y escalera. Ajustes en `SALON.A` (`luz`, `sombra`). |
| Ganchos | `c_casa3d.js`: `SALG()` salta chimenea, tapete gigante y escalera vieja, y llama a `SALON.build`. `c_casa_pb.js`: guarda `KM.salPiso` / `KM.salTecho` y expone `CPB.kp()`. |

## 3. Cómo está hecha la casa en código (lo que hay que respetar)

- **Medidas del salón:** x de -17 a 17, z de -15 a 11, muros de **9 m** (`H=9` en `c_casa_pb.js`), mesas a altura 1.5.
  Mesas: Continental (-8.5, -4), Uno (0, -9), Monopoly Deal (8.5, -4), radio 2.2. Puerta de la Ruleta en el muro derecho (x=17, z=-8).
  Arcos: al comedor (x=-9.5, ancho 4, alto 5.8), puerta a la cocina (x=6, 2.2×3.6), al zaguán (x=0, ancho 4.2, alto 6.4).
- **Los pisos no están conectados físicamente.** Cada piso es su propia escena y las escaleras son *portales* (`links` `{x,z,r,ax,az,to}`): caminar cerca o tocarlas cambia de piso. Mover o rediseñar una escalera es barato; no hace falta que "llegue" a ningún lado.
- **Corte tipo Sims** (`corte()` en `c_casa_pb.js`): cada cara de muro es de una sola cara y tiene `{g,p,d,L,n}`. Se esconde (`g.visible=false`) cuando la cámara está del lado de la normal y tu personaje del otro. Por el otro lado ya es invisible por backface culling. Los marcos de vanos van en `K.RG` (`{g,a,b}`) y se esconden si cualquiera de sus dos caras se esconde.
  Para meter muros nuevos: colgar la malla del `w.g` de la cara (con `attach`) o crear entradas nuevas en `K.CORTE`.
- **Choques:** segmentos en `PB.WL` `[ax,az,bx,bz,radio]` y círculos en `OB`. Las mallas no chocan.
- **Vigas** en `K.VIG`, visibles solo con la cámara debajo del techo. El techo es de una cara: desde arriba no se ve.
- **La cámara del juego va alta (~10 m), por encima del techo.** Todo lo alto y cercano al centro estorba. El cubo de escalera hasta el techo tapaba un tercio de la pantalla; se bajó a 5.4 m con remate.
- **Otras cosas que dependen del salón:** lámparas y ventiladores (`c_casa_amb.js`), reloj, librero (muro izquierdo, z 2.3–5.7), hamaca, gata, bola disco, letrero "gamemash", planos "estás aquí" (`ESC.plano`), la casa de fondo en los juegos (`FONDO`), el recorte de cuartos (`CUA`) y el merge de mallas (`MRG`).

## 4. Flujo que funcionó

1. **Script, no clics.** Todo el modelo sale de `salon.py`: se puede regenerar, versionar y ajustar números. Coordenadas como en three; `P(x,y,z)` las pasa a Blender (`x, -z, y`).
2. **Archivo aparte.** Si el archivo del usuario no tiene cambios sin guardar (`bpy.data.is_dirty == False`), se puede abrir uno vacío (`read_homefile`) y guardar como `blender/salon.blend`. `read_homefile` deja `context.window` en `None` dentro de la misma llamada: seguir en la siguiente.
3. **El módulo no persiste entre llamadas MCP.** Cargarlo así cada vez:
   `m=types.ModuleType('salon'); exec(open(...).read(), m.__dict__); sys.modules['salon']=m`
4. **Revisar con `look` (cámara, render) antes de hornear.** Un render rápido de Cycles tarda ~4 s y muestra problemas de geometría.
5. **Hornear:** `DIFFUSE` con directa + indirecta y **sin color** (solo luz), 2048² a 128 muestras ≈ 4–5 min en CPU (AMD 780M sin GPU configurada). 1024² a 32 muestras = 18 s, sirve para pruebas.
   **Pasa del límite de 180 s del MCP:** lanzarlo, que guarde un `.exr` al final y esperar el archivo en segundo plano. La primera vez, en el archivo del usuario, Blender se cerró. En el archivo aparte salió bien.
6. **Guardar el lightmap:** valores ×0.25 y gamma 1/2.2 a PNG/JPG (`foreach_set`, no listas). En three: `colorSpace=SRGB`, `flipY=false`, `channel=1`, `lightMapIntensity = π·4·A.luz`. Para JPG sin PIL: imagen de Blender con `file_format='JPEG'` y `save(quality=88)`. **No usar `save_render`**: aplica la transformación de vista (AgX) y cambia los valores.
7. **Exportar GLB** con `export_texcoords` (exporta las dos UV), materiales por nombre (`EXPORT`) y sin los nodos de horneado.
8. **Caché:** `/modelos/` se sirve con caché larga. Subir `V` en `c_casa_salon.js` en cada exportación.
9. **Para cambios que no tocan geometría** (solo UV0 o materiales), no hace falta volver a hornear: se arregla en el `.blend` y se reexporta.

## 5. Errores que ya pisamos

- **Polígono con muescas para franjas bajas.** El lambrín (0–2.4 m) queda debajo de la parte alta de los vanos y la franja se parte en pedazos sueltos. Con un solo polígono salían triángulos oscuros. Solución: tramos rectangulares entre vanos.
- **UV calculadas antes que las normales.** En bmesh las caras nuevas no tienen normal hasta `bm.normal_update()`. Sin eso, el piso salió en rayas.
- **Voltear la cara después de poner UV por lazo** desordena las UV. Hay que calcularlas desde la posición del vértice.
- **Dirección del sol** al convertir de three a Blender: `(x, -z, y)`. Un signo mal y el sol apunta al cielo.
- **`matrixAutoUpdate=false` + `attach`** rompe la posición. No usarlos juntos.
- **Finales de línea:** `c_casa3d.js` tiene CRLF. Los reemplazos de texto con `\n` fallan; buscar sin el salto.

## 6. Decisiones de diseño (gustos del usuario)

- **Mérida:** sin chimenea. En su lugar: ventanales altos con persianas verdes medio abiertas y reja, arquería de cantera, pasta con cenefa, vigas oscuras, muros color barro con lambrín verde y arbotantes.
- **Dividir en áreas, no achicar.** La arquería parte el salón: atrás la zona de juego, adelante la estancia (zaguán, escalera, ventanal, librero). Un tapete redondo por mesa le da a cada juego su rincón.
- **Piso tranquilo:** misma roseta de la casa con poco contraste (crema, salvia y terracota suave) y cenefa de 1 m alrededor.
- **Sin brillos en mesas:** las mesas siguen en código con su luz. Solo el cascarón lleva luz horneada.
- **Sombras de personajes:** el piso viejo quedó como `ShadowMaterial` (receptor de sombra transparente) debajo del nuevo.

## 7. Pendientes de la prueba

- [ ] Probar en el teléfono real (21:9 horizontal) y ajustar `SALON.A.luz`.
- [ ] Amueblar la estancia: mecedoras, macetones con palmas, mover ahí la hamaca. Si van en el GLB, entran al horneado y proyectan sombras suaves.
- [ ] Revisar la parte de arriba de la arquería vista desde la cámara alta (asoma una franja; tal vez un remate).
- [ ] La columna central puede tapar una mesa en vertical: revisar ángulos.
- [ ] La luz de las mesas en código (realtime) y la horneada todavía no están emparejadas del todo: comparar el tono.
- [ ] Reducir el lightmap (1 MB): 1024² o KTX2 con `preparar_modelos.js`, y publicarlo en una etiqueta `modelos-vN` como los demás modelos.
- [ ] El plano "estás aquí" que estaba junto a la escalera vieja se quitó: decidir dónde va.
- [ ] Llegada desde la planta alta: confirmar en qué punto apareces al bajar (`ax/az` del link).

## 8. Si queremos cambiar la casa (plan)

1. **Un piso a la vez, siempre detrás de `?casa=glb`.** La casa actual sigue funcionando hasta que la nueva sea mejor.
2. **Blender pone lo que se ve; el código, lo que se toca.** Muros, pisos, techos, escaleras, ventanas y luz en el GLB. Mesas, personajes, cartas, puertas interactivas y portales en código.
3. **Marcadores en el modelo** (empties con nombre: `mesa_uno`, `escalera_alta`, `puerta_ruleta`) para que el código lea de ahí dónde va cada cosa. Así se acaban las coordenadas sueltas y cambiar la distribución es mover un empty.
4. **Choques desde Blender:** exportar una malla simple de colisión o los segmentos como empties, en vez de escribirlos a mano en `c_casa_salon.js`.
5. **Altura de los muros:** 9 m es demasiado (tanto el aire vacío como una escalera creíble lo piden más bajo, 5–6 m como las casonas de Mérida). Cambiarlo afecta la fachada (`CASCO`), los remates y los cuartos vecinos, así que conviene hacerlo cuando toda la planta baja esté en Blender.
6. **Orden sugerido:** salón → zaguán y fachada → comedor y cocina → baño → planta alta → azotea → sótano. Calle y patio al final.
7. **Antes de quitar la bandera:** peso total de descarga, FPS en Android débil, que el corte funcione en todos los cuartos y que la casa de fondo de los juegos (`FONDO`) se vea bien.
