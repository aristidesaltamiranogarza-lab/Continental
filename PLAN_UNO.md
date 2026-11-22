# Plan: Uno "sentado a la mesa"

Meta: que el Uno se sienta como estar sentado en una mesa de la casa, no como un juego de celular. 3D en primera persona desde tu silla (como la Ruleta Rusa, pero mirando más hacia abajo). 2D con la misma composición vista desde arriba y la mesa siempre redonda. Referencia visual: el Uno de Mattel para celular (cámara baja, centro grande, rivales con sus cartas, tu mano grande abajo).

## Cómo usar este plan (se hace /clear entre pasos)
- Cada sesión: leer solo "Contexto común" y la sección del paso que toca. No releer otros pasos.
- Al terminar un paso: marcarlo `[x]` en la tabla y anotar en su sección, bajo **Notas**, lo que se descubrió (líneas, nombres, sorpresas) para el siguiente paso. Commit y push (incluir PLAN_UNO.md).
- Si un paso resulta más grande de lo previsto, partirlo aquí mismo (3a, 3b…) en lugar de alargar la sesión.

## Resumen

| # | Paso | Esfuerzo | Riesgo | Archivos principales | Hecho |
|---|------|----------|--------|----------------------|-------|
| 1 | 2D: mesa redonda con el estilo de la 3D | medium | medio | ui_mesa2d.css, c_mesa2d.js, c_uno2d.js | [x] |
| 2 | 3D: cámara desde tu silla y tu mano sobre el borde | xhigh | alto | c_uno3d.js (layout, cam, clampV, fan), c_mesa_cam.js | [x] |
| 3 | 3D: centro grande y anillo de dirección nuevo | medium | bajo | c_uno3d.js (buildTable, pila, ringTex) | [x] |
| 4 | 3D: rivales de frente e interfaz ligera | high | medio | c_uno3d.js, c_mesa_pj.js, c_mesa3d.js, css | [x] |
| 5 | Mirada viva y transición del lobby a tu silla | xhigh | alto | c_uno3d.js (vivo), c_mesa_cam.js, c_sala.js, c_casa_mesa.js | [ ] |
| 6 | Paisaje, tablet y de 2 a 8 jugadores | medium | medio | c_uno3d.js, ui_mesa2d.css | [ ] |

Esfuerzo = nivel de razonamiento sugerido para la sesión (low / medium / high / xhigh / max). Riesgo = qué tan probable es romper algo fuera del paso (código compartido con otros juegos) o tener que rehacerlo. Orden: 1 → 6; el 1 es independiente y puede ir en cualquier momento. Continental va después, en un plan aparte (PLAN_CONTINENTAL.md), reusando lo hecho aquí.

Cada paso de abajo tiene partes (A, B…), que vienen del plan anterior. Si una sesión no alcanza, terminar en el límite de una parte y anotarlo en Notas.

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

## Paso 1: 2D, mesa redonda con el estilo de la 3D (medium)

### A. Mesa siempre redonda
**Objetivo:** la mesa 2D es un círculo perfecto en cualquier pantalla, centrado en el espacio libre entre la barra de arriba y tu mano.

1. ui_mesa2d.css:10: quitar los insets `left/right/top/bottom` y dejar `left:50%;top:<centro>;width:min(<ancho disponible>,<alto disponible>);aspect-ratio:1;transform:translate(-50%,-50%)`. Usar unidades del contenedor (`cqw/cqh`, ya se usan en :86 y :114) para que el tamaño salga del contenedor, no de la ventana.
2. c_mesa2d.js:37: los retratos se colocan en % del contenedor; ahora deben ir en % del círculo. Opción simple: meter los retratos dentro del elemento de la mesa (o de un envoltorio cuadrado del mismo tamaño) y usar el mismo radio en x y y (`50+R*cos`, `50-R*sin`, con R ≈ 50 + medio retrato para que queden sobre la madera).
3. ui_mesa2d.css:86: quitar `scaleY(.5)` del anillo de dirección (`u2-orbit`); que sea un círculo alrededor del centro.
4. Revisar el centro: el mazo y el descarte quedan dentro del círculo sin tocar el anillo.
5. Revisar Continental 2D y Monopoly Deal 2D con la misma captura mental: si su contenido central depende de la mesa ancha (Continental baja juegos al centro), puede hacer falta que la mesa redonda sea opcional por juego (clase en el contenedor, p. ej. `.m2d-redonda`, activada por c_uno2d.js). Decidirlo aquí y anotarlo.

**Hecho cuando:** en 390×844, 844×390 y 1280×800 la mesa es un círculo, los retratos están sobre el borde y nada se encima con tu mano ni con la barra.

### B. Mismo estilo que la mesa 3D
**Objetivo:** que la 2D se lea como la misma mesa vista desde arriba.

1. Fieltro: cambiar el degradado verde (ui_mesa2d.css:11) por el color de la mesa 3D (`FELT[sbg]`); exponerlo como variable CSS `--m2d-fieltro` que c_uno2d.js pone. Madera: el borde actual (`border` transparente + degradado) pasa a tono madera como el aro de la mesa 3D, con una sombra interior suave.
2. Centro: descarte más grande que el mazo (≈1.25×), con 1–2 cartas anteriores asomando giradas; contador del mazo debajo, discreto.
3. Anillo de dirección: 4 arcos con punta de flecha (igual que el mockup y que el paso 3B en 3D), del color actual, girando despacio; al cambiar de sentido, la animación se invierte con un pequeño rebote.
4. Indicador de color actual: el anillo ya lo muestra. El chip "Rojo" de la barra de arriba se queda solo cuando el color lo eligió un comodín (por accesibilidad para daltónicos, con el nombre del color).
5. Tu turno: el borde de madera de tu lado brilla (arco en el color de acento) en lugar de solo la píldora.

**Hecho cuando:** una captura 2D y una 3D se ven como la misma mesa (colores, centro, anillo).

**Notas:**
- Redonda es opcional por juego: `M2D.mesa({redonda:1})` pone `.m2d-redonda` y envuelve fieltro + asientos en `.m2d-ronda` (cuadrado, `--d` en cq de `.m2d-zona`); `M2D.rivales(1)` los pone en el borde (R=50%). Continental y Monopoly Deal 2D no cambian.
- Acostado (max-height:460px) la mesa crece 40px y se mete detrás de la pista; los rivales bajan por los lados (`e=.6`) para no encimarse. Sigue chica en 844×390: revisar en el paso 6.
- Fieltro: `MESA_J.uno.col()` → `--m2d-fieltro/--m2d-fieltro2` (c_uno2d.js `fieltro()`). Anillo: SVG `ARC` en c_uno2d.js (4 arcos, r=46); rebote `.u2-orbit.gira` al cambiar `G.dir`. Chip de color solo si la carta de arriba es comodín (`U(id).c>=4`). Turno: `.u2.tu .m2d-ronda::after` (arco abajo).
- En /prueba hay 2 errores "THREE is not defined" sin red de CDN (no son de este paso).

## Paso 2: 3D, cámara desde tu silla y tu mano sobre el borde (xhigh)

### A. Cámara desde tu silla
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

**Riesgos:** la mano y los brillos se calculan con `L.ch`, `L.bar`, `L.top` del layout viejo; si algo se descuadra, anotarlo para la parte B en lugar de arreglarlo aquí.

### B. Tu mano encima del borde de la mesa
**Objetivo:** tu abanico se ve grande en primer plano, tapando el borde cercano de la mesa (la madera y el fieltro detrás), nunca el piso.

1. Con la cámara de la parte A, medir en pantalla dónde queda el borde cercano de la mesa (proyectar el punto `A.mano`/borde en +z). Colocar el abanico (`fan`, :214) para que su mitad superior se encime con ese borde.
2. Tamaño: alto de carta ≈ 22–26% del alto de pantalla en celular parado (hoy `L.ch=min(h*.19,w*.26,165)`); que las 7 cartas iniciales quepan sin salirse; con muchas cartas, más encimadas (no más pequeñas de cierto mínimo, ≥ 44 px de ancho visible para tocar).
3. Arco del abanico más marcado (como si las sostuvieras), las jugables se asoman un poco (ya existe) y la que robaste más.
4. Luz `pt` (:127): revisar que la mano no se vea quemada ni oscura con la cámara nueva.
5. El botón "Por color" (`#gjBar .gj-bb`) baja a una esquina o queda como chip pequeño bajo la mano, sin tapar cartas.
6. Arrastrar una carta hacia el descarte para jugarla (además del toque) si es barato con el código de gestos actual (:294–318); si no, anotarlo como mejora.

**Hecho cuando:** en 390×844 con 7 y con 15 cartas, la mano se ve encima de la mesa, se pueden tocar todas y el piso no aparece detrás de ella.

**Notas:**
- El ojo a la altura de la cabeza no sirve: desde la silla (≈6 del centro, ojo ≈1.3 sobre la mesa) el centro queda a ≈10° bajo el horizonte. La cámara va atrás y arriba de tu silla, en su eje (parado ≈(0,13,14)), inclinada .8 rad parado / .76 acostado.
- Dos lentes en `layout()`: `L.S = sentado(por)` (fov 58°/38° sobre el alto completo; distancia por bisección: ancho en el centro ≤1.1·W parado / 1·W acostado y alto de las cabezas de los demás a tu orilla ≤ espacio libre; la orilla cercana cae a media mano parado y a .2·ch del pie acostado) y `L.T` = la vista de arriba de antes (e 1.45, d=hi/.8, fov 40 sobre rh). `lente(e)` mezcla por inclinación; `cam()` pone fov + `setViewOffset(W,H,W/2-ax,H/2-ay)`. VW sigue siendo órbita alrededor de (x,z); `L.el=S.e`, `L.kTop=1`; c_mesa_cam.js no cambió.
- clampV: inclinación de .52 a 1.45 rad (inclinar hacia arriba llega a la vista de arriba), giro ±.61 salvo Arriba y cortes, altura mínima con `lente(e).d`.
- Parado: manda el ancho, así que la cabeza de enfrente queda ≈270 px y arriba se ve la casa; con 4–5 jugadores los de los lados quedan fuera de la pantalla (su nombre se pega a la orilla) → paso 4. Acostado (840×360) manda el alto: mesa de ≈280 px de ancho, chica como antes → paso 6.
- Tu personaje no se crea (filtro en `avSync`, solo si `V.me>=0`); se quitó `MPJ.cartas(0,…)`. `casaModo()` pone `W=0` para volver a encuadrar (las sillas cambian con `escala`).
- c_mesa_pj.js: `cabeza(i,out)` quedaba tapada por la reacción `cabeza(i,ms)` (mismo nombre): el del turno se quedaba con la mano en la cabeza y las cabezas no seguían el turno. Ahora `cabezaEn`. Afecta a todas las mesas (es lo que se quería).
- Mano: parado `ch=min(.24h,(w-204)/.967,230)` (7 cartas asoman ≥30 px); desde 8 cartas dos filas si asoman <30 px y luego hasta 80% del tamaño (15 cartas en 390: ch≈157, 31 px). Arco relativo al abanico, más marcado con más cartas.
- B5: "Por color" ya va bajo la mano sin tapar cartas; se dejó. B6: arrastrar al descarte ya existía (`pMove`/`pUp`, `d.tgt`). Luz `pt` sin cambios (se ve bien).
- En /prueba el Uno estaba en 2D (`uno_3d=0` del paso 1): `u3dToggle()`. Picking de mano, mazo y descarte comprobado con eventos de puntero; Arriba va y regresa igual.

## Paso 3: 3D, centro grande y anillo de dirección nuevo (medium)

### A. Centro grande
1. buildTable (:147): con la vista sentada ya cabe mazo a la izquierda y descarte a la derecha también en celular parado; quitar el caso "uno arriba del otro" si ya no hace falta.
2. Escala: el descarte se dibuja ~1.6–2× el tamaño real de carta (truco de Mattel); el mazo ~1.3×. Ajustar `ps` o una escala propia del centro.
3. Pila del descarte: que se vean 2–3 cartas anteriores giradas debajo (ya hay `pile`, :261); la de arriba un poco levantada y con su brillo.
4. Las cartas que vuelan al descarte (de rivales y tuyas) terminan alineadas con la nueva escala sin saltos.

**Hecho cuando:** el número de la carta de arriba se lee sin acercar la cámara en celular parado.

### B. Anillo de dirección nuevo
1. ringTex (:76): cambiar las 20 flechitas por 4 arcos gruesos con punta, como en el mockup; mismo canvas, versión por sentido (`d`).
2. Color actual, brillo suave (aditivo o emisivo bajo), opacidad mayor que hoy (.5) pero sin tapar cartas.
3. Gira despacio en el sentido del juego; al invertir, un giro rápido con rebote y destello (MFX tiene destellos).
4. Que rodee el centro nuevo (paso 3A) sin pasar por debajo del mazo ni del descarte.
5. Mismo diseño que el anillo 2D (paso 1B).

**Notas:**
- Centro siempre lado a lado (`L.ctr` z=-.3); escalas propias `L.sk=1.3` (mazo) y `L.sd=1.7` (descarte) en lugar de `L.ps*1.1`; `L.ps` queda para `sep` y la carta que sale de una mano. Pila: solo las 4 últimas; la de arriba casi derecha y .03 más alta. Nombres de pilas abajo de cada una.
- Anillo: `ringTex(d)` = 4 arcos (r=440, grueso 58, halo con shadowBlur) con punta hacia `d`; plano `L.rs=7.2` (r≈3.1 mundo, la mesa más chica tiene r=3.9). Opacidad .8. Al invertir: giro rápido (`ringBoost²`), rebote de escala y `MFX.destello` en el centro.
- Había en el árbol un cambio sin subir: `ps` .95/.85, inclinación sentada .62/.6 y clampV .4. Con .62 el centro quedaba detrás de tu mano: se regresó la inclinación a .8/.76; ps y clampV se quedaron. Con eso en 390x844 a veces asoma piso bajo la mano (revisar en el paso 4/6).

## Paso 4: 3D, rivales de frente e interfaz ligera (high)

### A. Rivales de frente con sus cartas y etiqueta
1. Con la cámara sentada (paso 2), revisar cada número de jugadores (2, 3, 4, 6, 8): los de enfrente se ven de frente; los de los lados en tres cuartos, en la orilla de la pantalla, sin cortarse. Si se salen en celular parado, ajustar `MESA.radio`/`sep` o la inclinación solo en ese caso.
2. Sus cartas: abanico boca abajo en sus manos (MPJ ya lo hace); que el tamaño del abanico refleje cuántas tienen (tope visual, p. ej. 12).
3. Etiqueta: nombre y número de cartas sobre la cabeza, siempre legible (tamaño fijo en pantalla), con anillo/brillo cuando es su turno.
4. "UNO" de un rival: la etiqueta parpadea y el personaje festeja (ya existe `MPJ.festeja`).
5. Las cartas que roban vuelan del mazo a sus manos (`seatW`, :241) con la nueva escala.

### B. Interfaz ligera (usar skill casa-ui)
1. Quitar la píldora grande "¡Tu turno!" y la barra de instrucciones fija (`#gjTop`/`#gjHint`): el turno se indica con el brillo del borde de tu lado y un texto corto "Tu turno" sobre la mano.
2. La instrucción "Toca una carta para jugarla, o el mazo para robar" solo las primeras 2 partidas (guardar en localStorage con try/catch) o cuando el jugador tarda >8 s.
3. Botones de arriba: solo menú (y Arriba/Recentrar dentro del menú o pequeños); chat abajo a la derecha como está.
4. Ojo: `layout()` mide `#gjTop`, `#gjHint` y `#gjBar`; si se quitan, ajustar esas medidas.

**Notas:**
- Los rivales se quedan alrededor de la mesa (el usuario no quiere que se junten enfrente). En parado con 4–5 los de los lados quedan fuera: no se ven y su nombre tampoco (para verlos, mover la cámara).
- Nombres como en Minecraft: `labels()` los pone pegados arriba de la cabeza (`MPJ.arriba`, `translate(-50%,-100%)`), sin pegarse a la orilla ni esquivarse; `visibility:hidden` si salen de la pantalla o quedan bajo la barra de arriba. `.on` (turno) y `.u3b` (UNO, parpadea) ya existían.
- Arriba solo Arriba/Cuadrar/menú (`GHUD.top` sin st/turn); se quitó `GHUD.hint` (ni turno ajeno ni última jugada). Tu turno: letrero `.u3tt` sobre la mano (bottom = `--t3fan`) con "Tu turno" o la acción pendiente; la ayuda `#u3gu` solo las 2 primeras partidas (localStorage `uno_guia`, cuenta finales) o tras 8 s (`turnoUi`). La orilla de tu lado: franja `L.myE` color `--ui-accent`, sin brillo aditivo (el usuario no quiere glow en mesas). Chip del color solo si la carta de arriba es comodín.
- Cámara cambiada a la de la Ruleta Rusa (el usuario la prefiere): `sentado()` pone el ojo en el de tu personaje (silla 0, `2.02*AV.K-.67`, o sea un poco arriba de los ojos) mirando al centro; fov 80° parado / 66° acostado; el centro al 40% entre la barra y tu mano. Los de los lados se ven grandes en la orilla (acostado); parado solo se ve el de enfrente. Se borró la cámara de atrás de la silla del paso 2. clampV deja inclinar desde `L.el`.
- Nombres: si la cabeza está en pantalla (o cortada arriba) se ven, recorridos para no salirse ni tapar los botones de arriba a la derecha.
- Arrastrar (un dedo fuera de la mano, botón derecho/medio, dos dedos en vertical) = mirar alrededor sin moverte: `VT/VW.ly` (giro) y `.lp` (cabeceo) en VK, aplicados en `cam()` después del lookAt; límites en clampV (±.9 / -.45….35), vuelven a 0 con `home()` (MCAM tras ESPERA). El pellizco solo acerca. Ojo subido (`2.02*K-.3`); centro más chico: `sk 1.05`, `sd 1.35`, `gp .45`, anillo `L.rs 6.2`.
- El ajuste "Ayuda arriba" (`mini`) ya casi no hace nada: revisar en el paso 5/6 si se quita. Tope de cartas en la mano de los rivales: 14 (MPJ.cartas, compartido), se dejó.

## Paso 5: Mirada viva y transición del lobby a tu silla (xhigh)

### A. Mirada viva
1. Como la Ruleta Rusa (c_ruleta3d.js:196–197): cuando un rival juega o roba, la mirada se va un poco hacia él (`lerp` del punto de mira ~25–35%) y regresa al centro cuando termina. Cuando te toca, la mirada vuelve al centro.
2. Arrastrar con el dedo fuera de tu mano = mirar alrededor (giro de cabeza limitado, ±35° y ±15° de inclinación); regresa sola tras unos segundos (MCAM ya tiene `ESPERA` y `home`).
3. Castigo de +4: el corte de cámara que hoy existe (`corte`, :234) se adapta a primera persona (volteas a ver al que roba, no un corte de plano).
4. Respetar "reducir movimiento" del sistema: sin vaivenes si está activo.

### B. Transición del lobby a tu silla
1. Averiguar (preguntar si no está claro) cómo se pasa hoy de la sala de espera (c_sala.js, cámara en CASA3D.sala) a la partida 3D de Uno: si es la misma escena o se cambia de lienzo.
2. Al presionar Empezar: la cámara viaja del plano del lobby al ojo de tu asiento en ~1.2–1.5 s con curva suave (patrón `hand/swT` de la Ruleta Rusa), mientras se reparten las cartas.
3. Al salir de la partida: el viaje inverso.
4. Si son lienzos distintos, hacer la transición falsa: congelar la última vista del lobby y empezar la cámara del juego desde una pose equivalente.

**Notas:**

## Paso 6: Paisaje, tablet y de 2 a 8 jugadores (medium)
1. Acostado (844×390): misma vista sentada con FOV más ancho; la mano baja más y es más pequeña; el centro sigue grande.
2. Tablet y escritorio (1280×800, 1920×1080): no se ve demasiado vacío; la mesa no queda pequeña.
3. 2D en los mismos tamaños (paso 1A).
4. Una captura por tamaño crítico solo si la consola/medidas no bastan.

**Notas:**
