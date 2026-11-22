# Plan: Uno "sentado a la mesa"

Meta: que el Uno se sienta como estar sentado en una mesa de la casa, no como un juego de celular. 3D en primera persona desde tu silla (como la Ruleta Rusa, pero mirando más hacia abajo). 2D con la misma composición vista desde arriba y la mesa siempre redonda. Referencia visual: el Uno de Mattel para celular (cámara baja, centro grande, rivales con sus cartas, tu mano grande abajo).

## Cómo usar este plan (se hace /clear entre pasos)
- Cada sesión: leer solo "Contexto común" y la sección del paso que toca. No releer otros pasos.
- Al terminar un paso: marcarlo `[x]` en la tabla y anotar en su sección, bajo **Notas**, lo que se descubrió (líneas, nombres, sorpresas) para el siguiente paso. Commit y push (incluir PLAN_UNO.md).
- Si un paso resulta más grande de lo previsto, partirlo aquí mismo (3a, 3b…) en lugar de alargar la sesión.

## Resumen

| # | Paso | Esfuerzo | Riesgo | Archivos principales | Hecho |
|---|------|----------|--------|----------------------|-------|
| 1 | 2D: mesa siempre redonda | medium | bajo | ui_mesa2d.css, c_mesa2d.js | [ ] |
| 2 | 2D: mismo estilo que la mesa 3D (fieltro, madera, centro, anillo) | medium | bajo | ui_mesa2d.css, c_uno2d.js | [ ] |
| 3 | 3D: cámara desde tu silla (núcleo) | xhigh | alto | c_uno3d.js (layout, cam, clampV), c_mesa_cam.js | [ ] |
| 4 | 3D: tu mano encima del borde de la mesa | high | medio | c_uno3d.js (fan, layout) | [ ] |
| 5 | 3D: centro grande (mazo y descarte) | medium | bajo | c_uno3d.js (buildTable, pila) | [ ] |
| 6 | 3D: anillo de dirección nuevo | medium | bajo | c_uno3d.js (ringTex, ringG) | [ ] |
| 7 | 3D: rivales de frente con sus cartas y etiqueta | high | medio | c_uno3d.js, c_mesa_pj.js, c_mesa3d.js | [ ] |
| 8 | Interfaz ligera (turno, pista, botones) | medium | bajo | c_uno3d.js, continental3d.html/ui css | [ ] |
| 9 | Mirada viva (voltear al que juega, mirar alrededor) | high | medio | c_uno3d.js (vivo), c_mesa_cam.js | [ ] |
| 10 | Transición del lobby a tu silla al empezar | xhigh | alto | c_uno3d.js, c_sala.js, c_casa_mesa.js | [ ] |
| 11 | Paisaje, tablet y de 2 a 6+ jugadores | medium | medio | c_uno3d.js, ui_mesa2d.css | [ ] |
| 12 | Llevarlo a Continental (plan aparte) | xhigh | alto | c_continental3d.js, c_cont2d.js | [ ] |

Esfuerzo = nivel de razonamiento sugerido para la sesión (low / medium / high / xhigh / max). Orden recomendado: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11. Los pasos 5, 6 y 8 son independientes entre sí y pueden ir en cualquier orden después del 4.

## Contexto común (leer siempre)

**Decisiones tomadas**
- 3D = primera persona desde tu asiento. La cámara mira hacia el centro con una inclinación de ~40–48° (la Ruleta Rusa mira casi horizontal; aquí hay que ver las cartas del centro).
- La mesa es un círculo; en 3D la perspectiva la hace verse ovalada y eso está bien. En 2D debe ser un círculo perfecto siempre.
- Tu mano sigue siendo hija de la cámara (ya es así, `D=3` en c_uno3d.js:12, capa 1 encima de todo). Eso la mantiene nítida y fácil de tocar. Lo que cambia es dónde se ve: encima del borde cercano de la mesa, nunca sobre el piso.
- Tu propio personaje no se dibuja en 3D (estás dentro de él).
- Fieltro: el mismo color en 2D y 3D, el que ya elige el jugador (`FELT[sbg]` en c_uno3d.js). Si en 2D no hay acceso a ese ajuste, usar el gris carbón de la mesa de Uno.
- La vista desde arriba no desaparece: queda como opción con el botón Arriba / doble toque (MCAM.arriba).
- Estilo de interfaz: skill `casa-ui`. Sin emojis. Sin scroll visible.

**Mapa de código ya ubicado (c_uno3d.js)**
- :12 `CW,CH,CT,D`: tamaño de carta y distancia de tu mano a la cámara.
- :76 `ringTex(d)`: anillo de 20 flechitas (chevrons) en canvas 1024; `ringG/ringM` se crean en buildTable (:148–150), opacidad .5, color = color actual.
- :106–112 brillos (mazo, descarte, turno, carta jugable).
- :127 luz `pt` pegada a la cámara para tu mano.
- :141 `MCAM.crea({vt:VT,home,snap,viewed,el,kTop})`.
- :143–150 `buildTable(por)`: `MESA.arma(tbl,{n,r:MESA.radio(np)-1.8,col:FELT[sbg],sep:3*ps})`; `ps` = 1.5 parado / 1.3 acostado; `L.ctr`, `L.deck`, `L.disc` (parado: uno arriba del otro; acostado: lado a lado).
- :160 `layout()`: `por=w/h<.95`; mide `#gjTop`/`#gjHint` y `#gjBar .gj-bb`; `L.ch` = alto de carta de la mano en px; `el = por?1.28:1.16` rad (≈73°/66°, casi cenital); `ext(d)` ajusta la distancia para que quepa la mesa (48 puntos en el borde).
- :178–179 `cam()`: órbita `VW{x,z,k,a,t}` alrededor de (VW.x,0,VW.z) con elevación `L.el+VW.t` y distancia `L.d/VW.k`; `hdNow` = giro de cabeza de MCAM.
- :181–185 `vivo()`: voltea hacia quien tiene el turno (`mesa.asiento(rel(t)).mano`).
- :189–193 `clampV()`: límites; altura mínima para que tu mano no se meta en la mesa.
- :214 `fan(ids,play,drawn)`: abanico de tu mano en píxeles → unidades a distancia D.
- :224–234 personajes (MPJ): `MPJ.sync`, `MPJ.paso`, `MPJ.estira/roba/festeja/cabeza`; :268 `MPJ.cartas(0,…)` = tu personaje lleva tus cartas.
- :241 `seatW(k)`: a dónde vuelan las cartas de cada asiento.
- :255–275 sincronía visual: mazo, descarte (`pile`), manos ajenas boca abajo, tu abanico.
- :294–318 gestos: arrastrar = mover, pellizcar = zoom, toque en carta = jugar.

**Otros archivos**
- c_mesa3d.js:72 `asiento(i)` → `{a,pos,ry,mira,mano,zona}`; asiento 0 = tu silla en +z; piso en y=-1.55; personaje sentado con cadera en y≈-.64.
- c_mesa_cam.js: `MCAM.crea` (toca, arriba, cortes, regreso solo tras ESPERA), `MCAM.boton` (botón Arriba). Lo usan también c_continental3d.js:132 y c_mdeal3d.js:76: no romperles nada.
- Cámara de referencia en primera persona: c_ruleta3d.js:193–206 `camStep` (ojo = `P[me].eye` un poco al frente, mira a `(0,TH+.2,0)`, entra deslizándose con `hand/swT`, mirada que se va hacia quien tiene el arma con `lerp`, `look.y/look.p` para mirar alrededor).
- 2D: ui_mesa2d.css:10 la mesa es `position:absolute;left:7%;right:7%;top:12%;bottom:2%;border-radius:50%` (por eso sale óvalo); c_mesa2d.js:37 los retratos van en `50+43*cos(a)`, `55-44*sin(a)` en % del contenedor (óvalo también); ui_mesa2d.css:86 el anillo de dirección usa `scaleY(.5)`; c_uno2d.js:19 `u2-orbit > u2-rot(.rev)`.
- M2D es compartido con c_cont2d.js y c_mdeal2d.js: cada cambio en c_mesa2d.js/ui_mesa2d.css se revisa también en Continental 2D y Monopoly Deal 2D.

**Probar**
- `node --check archivo.js` siempre. Navegador solo para lo visual: `npm start` y `/prueba?g=uno` (si no existe esa variante, agregarla en srv_prueba.js copiando la de `g=md`). Una sola captura por paso, en celular parado (390×844) salvo que el paso diga otra cosa.

---

## Paso 1: 2D, mesa siempre redonda (medium)
**Objetivo:** la mesa 2D es un círculo perfecto en cualquier pantalla, centrado en el espacio libre entre la barra de arriba y tu mano.

1. ui_mesa2d.css:10: quitar los insets `left/right/top/bottom` y dejar `left:50%;top:<centro>;width:min(<ancho disponible>,<alto disponible>);aspect-ratio:1;transform:translate(-50%,-50%)`. Usar unidades del contenedor (`cqw/cqh`, ya se usan en :86 y :114) para que el tamaño salga del contenedor, no de la ventana.
2. c_mesa2d.js:37: los retratos se colocan en % del contenedor; ahora deben ir en % del círculo. Opción simple: meter los retratos dentro del elemento de la mesa (o de un envoltorio cuadrado del mismo tamaño) y usar el mismo radio en x y y (`50+R*cos`, `50-R*sin`, con R ≈ 50 + medio retrato para que queden sobre la madera).
3. ui_mesa2d.css:86: quitar `scaleY(.5)` del anillo de dirección (`u2-orbit`); que sea un círculo alrededor del centro.
4. Revisar el centro: el mazo y el descarte quedan dentro del círculo sin tocar el anillo.
5. Revisar Continental 2D y Monopoly Deal 2D con la misma captura mental: si su contenido central depende de la mesa ancha (Continental baja juegos al centro), puede hacer falta que la mesa redonda sea opcional por juego (clase en el contenedor, p. ej. `.m2d-redonda`, activada por c_uno2d.js). Decidirlo aquí y anotarlo.

**Hecho cuando:** en 390×844, 844×390 y 1280×800 la mesa es un círculo, los retratos están sobre el borde y nada se encima con tu mano ni con la barra.

**Notas:**

## Paso 2: 2D, mismo estilo que la mesa 3D (medium)
**Objetivo:** que la 2D se lea como la misma mesa vista desde arriba.

1. Fieltro: cambiar el degradado verde (ui_mesa2d.css:11) por el color de la mesa 3D (`FELT[sbg]`); exponerlo como variable CSS `--m2d-fieltro` que c_uno2d.js pone. Madera: el borde actual (`border` transparente + degradado) pasa a tono madera como el aro de la mesa 3D, con una sombra interior suave.
2. Centro: descarte más grande que el mazo (≈1.25×), con 1–2 cartas anteriores asomando giradas; contador del mazo debajo, discreto.
3. Anillo de dirección: 4 arcos con punta de flecha (igual que el mockup y que el paso 6 en 3D), del color actual, girando despacio; al cambiar de sentido, la animación se invierte con un pequeño rebote.
4. Indicador de color actual: el anillo ya lo muestra. El chip "Rojo" de la barra de arriba se queda solo cuando el color lo eligió un comodín (por accesibilidad para daltónicos, con el nombre del color).
5. Tu turno: el borde de madera de tu lado brilla (arco en el color de acento) en lugar de solo la píldora.

**Hecho cuando:** una captura 2D y una 3D se ven como la misma mesa (colores, centro, anillo).

**Notas:**

## Paso 3: 3D, cámara desde tu silla (xhigh) — el núcleo
**Objetivo:** la vista de juego normal es en primera persona desde tu asiento, mirando el centro a ~40–48°, con la mesa llenando el ancho de la pantalla.

1. Leer c_uno3d.js:160–193 (layout, cam, vivo, clampV) y c_ruleta3d.js:193–206 antes de tocar nada.
2. Definir el ojo: `A=mesa.asiento(0)`; ojo = `A.pos` + altura de ojos del personaje sentado (medir con el modelo: cadera y≈-.64; probar y≈+0.9 a +1.3 sobre la mesa) movido un poco hacia atrás de la cabeza (`-A.mira*0.3`) para dar aire. El punto al que mira = `L.ctr` desplazado hacia ti (`+A.mira*…`) para que el descarte quede a ~45% de la altura útil.
3. Reemplazar la órbita casi cenital por esta cámara "home". Mantener el sistema `VT/VW` para no romper MCAM: lo más seguro es interpretar `VW` como desplazamiento sobre la pose sentada (`t` = inclinación extra, `a` = giro de cabeza, `k` = acercarse) en lugar de rehacer MCAM. Documentar en un comentario corto qué significa cada campo ahora.
4. FOV: calcularlo para que el ancho de la mesa (borde a borde a la altura del centro) llene ~100–105% del ancho en celular parado. En acostado, un FOV más cerrado. Reusar la idea de `ext(d)` (proyectar puntos del borde) pero buscando FOV/inclinación en lugar de distancia.
5. Ocultar tu personaje (MPJ asiento 0): no dibujarlo ni su sombra; quitar `MPJ.cartas(0,…)` (:268) o hacerlo condicional a la vista desde arriba.
6. clampV (:189–193): la regla de altura mínima ya no aplica igual; límites nuevos: inclinación entre ~30° y ~70°, giro de cabeza ±35°, zoom pequeño.
7. Botón Arriba / doble toque: debe seguir dando la vista desde arriba de antes (guardar el cálculo viejo como `camArriba`).
8. Comprobar que el picking (raycast) de mazo, descarte y cartas sigue funcionando con la cámara nueva.

**Hecho cuando:** al entrar a una partida se ve el centro grande, el rival de frente arriba, nada se corta, Arriba sigue funcionando, y Continental/Monopoly Deal 3D no cambiaron (abrir cada uno una vez).

**Riesgos:** la mano y los brillos se calculan con `L.ch`, `L.bar`, `L.top` del layout viejo; si algo se descuadra, anotarlo para el paso 4 en lugar de arreglarlo aquí.

**Notas:**

## Paso 4: 3D, tu mano encima del borde de la mesa (high)
**Objetivo:** tu abanico se ve grande en primer plano, tapando el borde cercano de la mesa (la madera y el fieltro detrás), nunca el piso.

1. Con la cámara del paso 3, medir en pantalla dónde queda el borde cercano de la mesa (proyectar el punto `A.mano`/borde en +z). Colocar el abanico (`fan`, :214) para que su mitad superior se encime con ese borde.
2. Tamaño: alto de carta ≈ 22–26% del alto de pantalla en celular parado (hoy `L.ch=min(h*.19,w*.26,165)`); que las 7 cartas iniciales quepan sin salirse; con muchas cartas, más encimadas (no más pequeñas de cierto mínimo, ≥ 44 px de ancho visible para tocar).
3. Arco del abanico más marcado (como si las sostuvieras), las jugables se asoman un poco (ya existe) y la que robaste más.
4. Luz `pt` (:127): revisar que la mano no se vea quemada ni oscura con la cámara nueva.
5. El botón "Por color" (`#gjBar .gj-bb`) baja a una esquina o queda como chip pequeño bajo la mano, sin tapar cartas.
6. Arrastrar una carta hacia el descarte para jugarla (además del toque) si es barato con el código de gestos actual (:294–318); si no, anotarlo como mejora.

**Hecho cuando:** en 390×844 con 7 y con 15 cartas, la mano se ve encima de la mesa, se pueden tocar todas y el piso no aparece detrás de ella.

**Notas:**

## Paso 5: 3D, centro grande (medium)
1. buildTable (:147): con la vista sentada ya cabe mazo a la izquierda y descarte a la derecha también en celular parado; quitar el caso "uno arriba del otro" si ya no hace falta.
2. Escala: el descarte se dibuja ~1.6–2× el tamaño real de carta (truco de Mattel); el mazo ~1.3×. Ajustar `ps` o una escala propia del centro.
3. Pila del descarte: que se vean 2–3 cartas anteriores giradas debajo (ya hay `pile`, :261); la de arriba un poco levantada y con su brillo.
4. Las cartas que vuelan al descarte (de rivales y tuyas) terminan alineadas con la nueva escala sin saltos.

**Hecho cuando:** el número de la carta de arriba se lee sin acercar la cámara en celular parado.

**Notas:**

## Paso 6: 3D, anillo de dirección nuevo (medium)
1. ringTex (:76): cambiar las 20 flechitas por 4 arcos gruesos con punta, como en el mockup; mismo canvas, versión por sentido (`d`).
2. Color actual, brillo suave (aditivo o emisivo bajo), opacidad mayor que hoy (.5) pero sin tapar cartas.
3. Gira despacio en el sentido del juego; al invertir, un giro rápido con rebote y destello (MFX tiene destellos).
4. Que rodee el centro nuevo (paso 5) sin pasar por debajo del mazo ni del descarte.
5. Mismo diseño que el anillo 2D (paso 2).

**Notas:**

## Paso 7: 3D, rivales de frente con sus cartas y etiqueta (high)
1. Con la cámara sentada, revisar cada número de jugadores (2, 3, 4, 6, 8): los de enfrente se ven de frente; los de los lados en tres cuartos, en la orilla de la pantalla, sin cortarse. Si se salen en celular parado, ajustar `MESA.radio`/`sep` o la inclinación solo en ese caso.
2. Sus cartas: abanico boca abajo en sus manos (MPJ ya lo hace); que el tamaño del abanico refleje cuántas tienen (tope visual, p. ej. 12).
3. Etiqueta: nombre y número de cartas sobre la cabeza, siempre legible (tamaño fijo en pantalla), con anillo/brillo cuando es su turno.
4. "UNO" de un rival: la etiqueta parpadea y el personaje festeja (ya existe `MPJ.festeja`).
5. Las cartas que roban vuelan del mazo a sus manos (`seatW`, :241) con la nueva escala.

**Notas:**

## Paso 8: Interfaz ligera (medium) — usar skill casa-ui
1. Quitar la píldora grande "¡Tu turno!" y la barra de instrucciones fija (`#gjTop`/`#gjHint`): el turno se indica con el brillo del borde de tu lado y un texto corto "Tu turno" sobre la mano.
2. La instrucción "Toca una carta para jugarla, o el mazo para robar" solo las primeras 2 partidas (guardar en localStorage con try/catch) o cuando el jugador tarda >8 s.
3. Botones de arriba: solo menú (y Arriba/Recentrar dentro del menú o pequeños); chat abajo a la derecha como está.
4. Ojo: `layout()` mide `#gjTop`, `#gjHint` y `#gjBar`; si se quitan, ajustar esas medidas.

**Notas:**

## Paso 9: Mirada viva (high)
1. Como la Ruleta Rusa (c_ruleta3d.js:196–197): cuando un rival juega o roba, la mirada se va un poco hacia él (`lerp` del punto de mira ~25–35%) y regresa al centro cuando termina. Cuando te toca, la mirada vuelve al centro.
2. Arrastrar con el dedo fuera de tu mano = mirar alrededor (giro de cabeza limitado, ±35° y ±15° de inclinación); regresa sola tras unos segundos (MCAM ya tiene `ESPERA` y `home`).
3. Castigo de +4: el corte de cámara que hoy existe (`corte`, :234) se adapta a primera persona (volteas a ver al que roba, no un corte de plano).
4. Respetar "reducir movimiento" del sistema: sin vaivenes si está activo.

**Notas:**

## Paso 10: Transición del lobby a tu silla (xhigh)
1. Averiguar (preguntar si no está claro) cómo se pasa hoy de la sala de espera (c_sala.js, cámara en CASA3D.sala) a la partida 3D de Uno: si es la misma escena o se cambia de lienzo.
2. Al presionar Empezar: la cámara viaja del plano del lobby al ojo de tu asiento en ~1.2–1.5 s con curva suave (patrón `hand/swT` de la Ruleta Rusa), mientras se reparten las cartas.
3. Al salir de la partida: el viaje inverso.
4. Si son lienzos distintos, hacer la transición falsa: congelar la última vista del lobby y empezar la cámara del juego desde una pose equivalente.

**Notas:**

## Paso 11: Paisaje, tablet y de 2 a 6+ jugadores (medium)
1. Acostado (844×390): misma vista sentada con FOV más ancho; la mano baja más y es más pequeña; el centro sigue grande.
2. Tablet y escritorio (1280×800, 1920×1080): no se ve demasiado vacío; la mesa no queda pequeña.
3. 2D en los mismos tamaños (paso 1).
4. Una captura por tamaño crítico solo si la consola/medidas no bastan.

**Notas:**

## Paso 12: Llevarlo a Continental (xhigh, plan aparte)
Cuando el Uno esté bien: escribir PLAN_CONTINENTAL.md con los mismos pasos adaptados (Continental baja juegos a la mesa, así que el centro y la mano cambian). Reusar lo que se haya movido a c_mesa_cam.js o a un módulo nuevo (p. ej. c_mesa_silla.js con la cámara sentada) si en el paso 3 se separó.

**Notas:**
