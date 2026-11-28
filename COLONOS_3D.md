# Colonos 3D — plan por fases

Leer al retomar. Cada fase termina con vista previa para el usuario; no pasar a la siguiente sin su visto bueno.
Esfuerzo: el usuario trabaja en medium; la columna dice con qué esfuerzo correr cada fase (avisar antes de empezar).

## Estado (28 nov 2026)
- Hecho (fase 3 base): c_colonos3d.js (CO3, misma API que CO2; COU y COFX eligen tablero con COB()) y c_colonos3d_kit.js (CO3K: terrenos, mar, puertos, piezas, dados y mesa rectangular, todo con geometría).
  Mesa rectangular en la casa (FONDO), rivales sentados en lados largos y cabecera (MPJ) con sus cartas reales, dados desde el lugar de quien tira, tirada que levanta/apaga terrenos,
  interruptor 2D/3D (co3Toggle, localStorage co_3d) y botón Arriba en la barra. Probar: /prueba?g=colonos&n=4&fase=main (840x360 y 360x840).
- Al usuario le gustó la interfaz y el acomodo. No le gusta: la isla 3D (plana, poco detalle) y, en 2D, los íconos de recursos, poblado y camino.
- Esta máquina (hostname PC) es la laptop: aquí se modela en Blender.

## Dirección de arte (propia; referencias = nivel de calidad, no copiar)
- Cada terreno es un bloque alto de tierra que sale del mar: acantilado de roca en capas, borde de pasto que sobresale. Altura propia por terreno (campo bajo, monte el más alto).
- Escena por terreno: bosque (pinos y árboles redondos, aserradero), cerro (terrazas de barro, horno de ladrillo), pasto (ovejas, cerca de piedra), campo (surcos, molino, pacas),
  monte (picos con nieve, entrada de mina con vía y carrito), desierto (dunas, rocas, cactus), oro (río, pepitas) para expansiones.
- Mar turquesa profundo que aclara en los bajos, espuma blanca en cada costa. Puertos: muelle de madera, barco, letrero con la tasa.
- Fichas de número: discos de madera clara legibles desde la vista de la mesa. Piezas gruesas y redondeadas del color del jugador. Nada brilla.

## Calidades
- Medio: la isla actual de código (Android débil). Alto: kit modelado en Blender con sombra horneada (AO) + sombras en vivo (laptop sin GPU dedicada, iPhone de los últimos años).
- Ultra: Alto + agua animada con espuma, trigo y árboles que se mecen, ovejas que caminan, humo, barcos que flotan, sombras más finas.
- Se elige sola con la calidad de la casa (CALIDAD / c_movil.js MAX); se puede cambiar en el menú del juego. Topes solo en c_movil.js y c_fps.js.

## Fases
| Fase | Qué | Esfuerzo | Termina cuando |
|---|---|---|---|
| A | Vista previa en Blender: 7 terrenos (uno de cada tipo), mar con espuma, un puerto, poblado, ciudad, camino y fichas. Script blender/colonos_kit.py (`-- vista`) con una función por terreno; render desde la cámara del juego y de cerca. | high | El usuario aprueba el look (o pide cambios) |
| B | Kit completo: todos los terrenos (1–2 variantes), piezas de costa, puertos, poblado/ciudad/camino/ladrón. AO horneado, mallas juntas, árboles y ovejas como instancias. Exportar modelos/colonos/kit.glb (KTX2/cuantizado). CO3 lo carga en Alto/Ultra; Medio sigue con CO3K. Menú de calidad. Medir FPS en celular. | high | Isla Alta en el juego a 30 FPS parejos en un Android medio y la laptop |
| C | Vida (Ultra): agua con espuma que se mueve y bajos, trigo y árboles con viento (vertex shader), ovejas, humo de ciudades, barcos. | high | Vista previa en video/capturas aprobada |
| D | Movimiento: la isla sale del mar al empezar (terreno por terreno), cartas de la cosecha que vuelan en 3D del terreno a la pieza y a las manos del personaje, cámara que voltea al bot en su turno y regresa, momento del ganador, entrada/salida al nivel de c_portada.js. | medium | Todas las jugadas de COFX se ven en 3D sin cortes |
| E | 2D: íconos nuevos de recursos, poblado, ciudad y camino (vista previa antes de tocar el juego). | medium | Aprobados y puestos en 2D y en la interfaz |
| F | Pendientes de la base 3D: tocar en celular (taps vs arrastre), 360x840, la cabecera queda fuera de cuadro en horizontal (decidir si se ve), reacciones de MPJ (roba, festeja). | medium | Revisado en 840x360 y 360x840 |

## Notas técnicas
- Unidades: un terreno = radio 1 (COLD.geo, x→x, y→z); CO3 escala la isla por HS=.62 y la centra en la mesa. Mesa: hx, hz (medio ancho/largo del fieltro) salen del contorno de la isla.
- FONDO.pinta(R,CA,'colonos',{r,rt:r/MESA.CASA_S}): personajes y sillas a escala de la casa (k = CASA_S·FONDO.MII); patas al piso en -1.55·k.
- Cuidado: no meter en el encuadre (BOX) puntos de los personajes; achica mucho la isla.
