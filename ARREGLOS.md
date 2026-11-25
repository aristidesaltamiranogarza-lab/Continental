# Arreglos de la casona y el barrio (noviembre 2026)

Lista viva para trabajar entre /clear. Marcar [x] al terminar cada punto y subir.
Esfuerzo: bajo / medio / alto. Juntar todo lo de Blender y hornear una sola vez al final (paso 6).

Para revisar: `?libre` = caminar sin límites ni choques (c_casa3d.js). Árboles quietos: PASTO.A.copas = 0 (c_pasto.js).

## 1. Código, sin hornear
- [x] Los otros pisos no desaparecen estando dentro de la casa (CFUE tomaba como fuera z 30–34 de la planta baja)
- [x] Paredes que se borran en primera persona (CUA ligaba el muro compartido a un solo cuarto; ya no se liga lo que se mete en otro): baño, pared interior de la escalera del sótano, "pared sólida" en la escalera. Es el culling (CUA, c_casa_cuartos.js); casi todo está bien, solo atinarle (medio)
- [x] El pozo se ve desde lejos y a través de las paredes (el tiro va con stencil a su boca)
- [x] Ruleta Rusa: cajas de código atravesadas que no reciben luz y resaltan; quitarlas (bajo)
- [x] Árbol que atraviesa la pared en la planta alta (copa negra): los árboles del barrio que entran en la huella de la casona se recortan al cargar (CCALLE recorta)
- Plantas con texturas viejas, árbol viejo junto a la casa y luces del sótano vienen de los GLB: pasaron a los pasos 4 y 5.

## 2. Horneado menos pixeleado sin rehornear
- [ ] Leer la luz horneada con filtro bicúbico en c_casona_mat.js (CMAT); comparar antes/después en el teléfono (bajo–medio)

## 3. Parte trasera del barrio (Blender; vista con ver.py antes de hornear)
- [ ] Quitar las bardas sin sentido (alto, todo el paso)
- [ ] Todo pasto, nada de café ni verde claro liso; hojas de pasto solo en algunas zonas (rendimiento)
- [ ] Caminitos que unan casa, cancha de fútbol (hoy no se llega), iglesia y parque
- [ ] Camino de la iglesia terminado y más ancho; postes de luz fuera del camino
- [ ] Límites para caminar por todo eso en el juego (c_casona_caja.js, F.bx2)
- [ ] Que se vea como la plaza (comparación del usuario): suelo café liso sin textura; bardas iguales en altura y color, sin remate, aplanado ni zoclo; nada de vida (macetas, tendederos, tinacos, sillas, caminos); luz horneada borrosa con sombras grandes sin contacto y rincones sin oclusión; cuartito de caja lisa con puerta plana sin marco; muros traseros de los vecinos lisos, sin ventanas, con una franja verde arriba; naranjo de bolas con naranjas cúbicas (alto)
- Necesita: aprobación de la vista/planta antes de seguir

## 4. Objetos del barrio (Blender)
- [ ] Rehacer las sillas confidentes blancas (medio; preview)
- [ ] Rehacer la fuente (medio; preview)
- [ ] Iglesia con más detalle; cruz y esquinas encimadas se atraviesan: unir en una sola malla (medio; preview)
- [ ] Árboles inclinados que se salen de su base blanca (bajo)
- [ ] Palmeras: la base se despega (bajo)
- El vocho se queda como está.

## 5. Sótano y planta baja (Blender)
- [ ] Sótano: círculos de luz en el techo sin lámpara (luces POINT a 2.85 de lamparas() en casona_sm.py sin pieza); cubo blanco flotando en la entrada (sm_focos de la barra); en el billar, lámpara encima de un cuadro (bajo–medio)
- [ ] Barra oscura y rara sobre los vanos del balcón en la fachada (franja horneada en el muro; revisar dintel/cerramiento) (bajo)
- [ ] Plantas que aún usan las texturas viejas (macetas de pb/pa/az): pasarlas a las del kit (barrio_kit.py) (bajo)
- [ ] Árbol de estilo viejo, sin acabar, junto a la casa (pb_tras_* o mamey de casona_pb.py, o del barrio): cambiarlo por uno del kit (bajo)
- [ ] Tiras LED cálidas y tenues en el sótano y zonas oscuras (emisivo horneado, sin costo) (medio)
- [ ] Barrotes del balcón de la planta alta que asoman en el techo de la planta baja (bajo)
- [ ] Escaleras: el horneado se ve pixeleado donde llega poca luz (más densidad ahí)

## 6. Horneado final
- [ ] Hornear solo lo que cambió (barrio, sm, pb), noche con menos muestras; avisar plan y tiempo antes (~10 min por nivel); subir cada nivel al terminar; revisar dinteles, cantos y rincones (R4)

## Notas
- Fortnite usa luz en tiempo real (Lumen), no sirve en Androids débiles. Lo útil para nosotros: densidad de luz pareja (más en rincones y escaleras), denoiser, filtro suave al leer (paso 2) y la oclusión de rincones aparte.
- Hecho: parque caminable (bx2), modo ?libre, árboles sin viento.
