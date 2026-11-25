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
- [x] Leer la luz horneada con filtro bicúbico en c_casona_mat.js (CMAT); comparar antes/después en el teléfono (bajo–medio). Ya existía la bicúbica; ahora también en muros vistos de lado, con textureGrad (sin rayas de mip) y dithering (sin escalones en lo oscuro). Falta que el usuario lo vea en el teléfono; lo que siga pixeleado es del horneado (paso 6, R4).

## 3. Parte trasera del barrio (Blender; vista con ver.py antes de hornear)
- [x] Quitar las bardas sin sentido (alto, todo el paso)
- [x] Todo pasto, nada de café ni verde claro liso; hojas de pasto solo en algunas zonas (rendimiento)
- [x] Caminitos que unan casa, cancha de fútbol (hoy no se llega), iglesia y parque
- [x] Camino de la iglesia terminado y más ancho; postes de luz fuera del camino
- [x] Límites para caminar por todo eso en el juego (c_casona_caja.js, F.bx2)
- [x] Que se vea como la plaza (comparación del usuario): suelo café liso sin textura; bardas iguales en altura y color, sin remate, aplanado ni zoclo; nada de vida (macetas, tendederos, tinacos, sillas, caminos); luz horneada borrosa con sombras grandes sin contacto y rincones sin oclusión; cuartito de caja lisa con puerta plana sin marco; muros traseros de los vecinos lisos, sin ventanas, con una franja verde arriba; naranjo de bolas con naranjas cúbicas (alto)
- Hecho (planta aprobada con camino curvo): blender/barrio_trasera.py (jardín, sendero curvo de laja, pasto_c sin matas en CMAT, bardas de patio variadas, vida, ventanas atrás), puerta trasera del jardín (gap en casona.py, Bd − G en casona_pb.py), andador de 6, paso de cebra, bx2. GLB crudos exportados; falta hornear manzana, plaza, calle y pb (paso 6), donde se atiende la luz borrosa sin contacto.

## 3b. Llenar el jardín del barrio (el área vacía detrás de la casona, no el traspatio; esfuerzo alto, que quede muy bien)
En blender/barrio_trasera.py + jardin() de barrio_manzana.py; mostrar render cenital y a la altura de la gente antes de subir. Poco peso (celular débil).
- [x] Arreglar el camino: el tramo de la bifurcación junto a la puerta trasera se ve cortado (dos cintas encimadas con orillas en pico); unirlo en una sola forma con orillas suaves
- [x] La zona con hojas de pasto se ve como rectángulo amarillento de orilla recta: forma irregular y mismo tono que pasto_c
- [x] Vegetación en manchas en las orillas (matas, agaves, flores), sobre todo al pie de los muros traseros de los vecinos
- [x] Dos o tres árboles grandes más (laurel, ceiba) para dar sombra al centro, hoy lo más vacío
- [x] Rincón de juego bajo un árbol grande: una o dos mesitas de concreto con bancos (dominó), a un lado del camino
- [x] Albarradas: muretes bajos de piedra seca con curvas que acompañen al camino y separen zonas sin parecer bardas
- [x] Huerto cerca de la puerta trasera: camas de hortalizas, milpa, chiles y un par de plátanos
- [x] Lomas suaves en el pasto (relieve, no color; "ruido pero de altura, tipo minecraft pero a menor escala"): suelo_lomas() en barrio_jardin.py (rejilla de 2 m, ruido de 2 octavas, hasta 0.55, planas con transición de 2.5 m junto a muros, bardas, casona, traspatio, cancha, plaza, andador, huerto, caminitos y pasto con hojas); lo que va encima usa SUELO(x, z). La rejilla de alturas va en los extras 'alto' de manzana_pasto_c: CCALLE.alto → F.gy (c_casona_caja.js); el personaje ya conserva esa altura bajo el balanceo del paso (posePj) y la cámara la sigue en todos sus modos (applyCam). De paso ya funciona la bajada al arroyo de la calle.
- Hecho en blender/barrio_jardin.py: red() une todos los caminitos (campo de distancia + contorno: una sola forma, ramal y rincón de dominó bajo la ceiba); mancha() pasto con hojas de orilla irregular 1 cm sobre el liso (sin sombra ni oscurecer su orilla al hornear, barrio_lib.armar); matas del juego con el mismo tinte de mundo que el suelo (c_pasto.js TINTE); ceiba, laurel y flamboyán al centro; macizos con plátanos al pie de los muros; dos albarradas y el huerto cerrado por otra. Vistas jardin_* en barrio_manzana.py. Tope de la manzana 108000 (macetas de patio más ligeras para compensar). GLB crudo exportado (BV manzana 4); falta hornear (paso 6).

## 3c. Revisión del usuario del 3b (25 nov; hacer antes del horneado del paso 6)
- [x] Calidad: lo nuevo del 3b quedó más chafa que los árboles de antes (a esos se les dedicó mucho tiempo con referencias). Igualar esa calidad:
  - [x] Plátanos (macizos al pie de los muros y huerto): hojas de tablas planas; rehacerlos con la calidad de los árboles buenos
  - [x] Milpa: cañas de caja con hojas de tabla; rehacer
  - [x] Arbustos: icosaedros facetados oscuros; rehacer con la calidad de las copas (nubes fundidas, como arbol_ramas)
- [x] Bases blancas de los árboles (laurel y otros con pie encalado): quitar la pieza de base; pintar de blanco (cal) la parte baja del tronco con color por vértice. Solo en los árboles que hoy tienen base blanca
- [x] Cancha de fútbol: el círculo central y las rayas están levantados (vigas); bajarlos al nivel del pasto
- [x] Muros traseros de las casas que se ven desde el jardín: demasiado planos, se ven feos; darles detalle (volúmenes, aplanado, remates, tinacos, etc.)
- [x] Duda del usuario: el camino de la calle a la iglesia (andador x −40..−34) se marcó hecho en el paso 3, pero en el juego se ve solo verde. Revisar que exista y se vea — existe en barrio_plaza.py; la plaza del juego se horneó (06:20) antes de agregarlo (10:26): aparece al hornear la plaza
- [x] Banca del traspatio: moverla pegada a la pared (hoy mira directo al árbol)
- [x] Bancas cafés (de madera): cambiarles un poco la posición
- [x] Patio de juegos del parque: más detalle
- [ ] Letras de MÉRIDA: rehacerlas; lo ideal es una tipografía convertida a 3D (después)
- Hecho 3c: barrio_plantas.py (plátanos con hojas curvas, hoja seca, racimo e hijuelo; milpa con hojas que cuelgan, espiga y elote; arbustos de nube con textura de copa), laurel pintado de cal, cancha al ras, muros traseros con zoclo, castillos, cornisa, cuarto de azotea, tinaco y varillas (barrio_trasera.py), banca del traspatio en la barda del fondo (casona_pb_deco.py), bancas cafés alternadas, juegos con guarnición, techito, carrusel, bote y banca. Tope de la manzana: 118k (antes 108k). Falta hornear manzana, parque, plaza y pb (paso 6).

## 4. Objetos del barrio (Blender)
- [x] Rehacer las sillas confidentes blancas (medio; preview) — modelo descargado en props/silla_confidente.obj (blender/silla_confidente.py lo prepara: 1144 triángulos); manzana, plaza y 4 en el kiosco del parque
- [x] Rehacer la fuente (medio; preview) — pila de ocho lados con pretil, balaustre, dos tazas y piña (barrio_kit.fuente)
- [x] Iglesia con más detalle; cruz y esquinas encimadas se atraviesan: unir en una sola malla (medio; preview) — B.unido (boolean exacta); portada, reloj, campanas, pináculos, contrafuertes
- [x] Árboles inclinados que se salen de su base blanca (bajo) — ya no hay base: la cal va pintada en el tronco (3c)
- [x] Palmeras: la base se despega (bajo) — pie ensanchado y enterrado
- El vocho se queda como está.

## 5. Sótano y planta baja (Blender)
- [x] Sótano: círculos de luz en el techo sin lámpara (luces POINT a 2.85 de lamparas() en casona_sm.py sin pieza); cubo blanco flotando en la entrada (sm_focos de la barra); en el billar, lámpara encima de un cuadro (bajo–medio)
- [x] Barra oscura y rara sobre los vanos del balcón en la fachada (bajo) — losa y ménsulas del balcón terminan 2 cm dentro del muro (casona_pa.py); revisar al hornear
- [x] Plantas que aún usan las texturas viejas (macetas de pb/pa/az): pasarlas a las del kit (barrio_kit.py) (bajo) — macetón con nube fundida; mamey y árbol del patio con sub 3
- [x] Árbol de estilo viejo, sin acabar, junto a la casa (pb_tras_* o mamey de casona_pb.py, o del barrio): cambiarlo por uno del kit (bajo) — era el plátano del traspatio: ahora como el del barrio (casona_plantas.platano)
- [x] Tiras LED cálidas y tenues en el sótano y zonas oscuras (emisivo horneado, sin costo) (medio) — pasillo y cava (sm_led)
- [x] Barrotes del balcón de la planta alta que asoman en el techo de la planta baja (bajo) — eran franjas horneadas: el techo llegaba al eje del muro; ahora termina 2 cm dentro (techos() de pb y sm); revisar al hornear
- [ ] Escaleras: el horneado se ve pixeleado donde llega poca luz (más densidad ahí)

## 6. Horneado final
- [ ] Hornear solo lo que cambió (barrio, sm, pb), noche con menos muestras; avisar plan y tiempo antes (~10 min por nivel); subir cada nivel al terminar; revisar dinteles, cantos y rincones (R4)

## Notas
- Fortnite usa luz en tiempo real (Lumen), no sirve en Androids débiles. Lo útil para nosotros: densidad de luz pareja (más en rincones y escaleras), denoiser, filtro suave al leer (paso 2) y la oclusión de rincones aparte.
- Hecho: parque caminable (bx2), modo ?libre, árboles sin viento.
