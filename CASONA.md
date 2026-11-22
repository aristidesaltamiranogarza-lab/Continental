# Casona de juegos: plan de la casa nueva

Anteproyecto (planos, corte y tabla): https://claude.ai/artifact/PX1g934RWSsWF4VdTB7Doa
Cómo se trabaja en Blender, errores y flujo: `CASA_BLENDER.md`.
Rama: `gamemash-casona` (commit y push solo ahí, nunca a main).
Este archivo es el plan. Al terminar un paso, marcarlo `[x]` con el commit.

## Idea
Casona yucateca con **patio central** y corredores de arcos. **Una sola escalera** (junto al zaguán, crujía izquierda) une los cuatro niveles; al salir de ella en cada piso está el plano para ir a una mesa. Cada nivel es su escena y la escalera es un portal, como hoy. Todo detrás de `?casa=glb` hasta que supere a la casa actual.

## Escala (no negociable)
Unidades de la casa, no metros. Personaje de pie ~2.1 (`MII.K`=0.8), cubierta de mesa a 1.55 del piso, radio de mesa 2.2, silla a la cadera del sentado. Nada se escala por cuarto ni por juego. En Blender siempre hay un maniquí de 2.1 con mesa y silla. Puerta 3.6, escalón 0.35, barandal 2.0.
Alturas libres: sótano 3.2, planta baja 5.5 (hoy 9), alta 4.2. Niveles: N−1 −3.50, N0 ±0, N+1 +5.80, N+2 +10.30.

## Distribución (lote 36 × 48; x de 0 a 36, z de 0 en la fachada hacia atrás)
Crujía del frente z 0–10, crujía izq x 0–8, corredores de 4 alrededor del patio (x 12–24, z 14–30), crujía der x 28–36.

| Nivel | Cuarto (x, z, ancho × fondo) | Juego |
|---|---|---|
| N−1 | Cantina 0,0 14×10 | Cubilete (barra), rockola |
| N−1 | Casino 14,0 22×10 | Póker, Blackjack |
| N−1 | Billar 0,17 12×13 | Billar |
| N−1 | Cava 28,10 8×10 → Cuarto oscuro 28,20 8×10 | Ruleta Rusa |
| N−1 | Bajo el patio | tierra, sin sótano |
| N0 | Zaguán 16,0 5×10 | llegada, plano |
| N0 | Salón 0,0 16×10 | Continental + estancia |
| N0 | Comedor 21,0 15×10 | Monopoly Deal |
| N0 | Patio central 12,14 12×16 (sin techo) | Uno, bajo el árbol; hamaca y gata en el corredor |
| N0 | Escalera 0,10 8×7; Baño 0,17 8×5; Cuarto libre 0,22 8×12 | (libre: dominó) |
| N0 | Cocina 28,10 8×12; Despensa; Servicio; Traspatio z 34–48 | decoración |
| N+1 | Biblioteca 0,0 16×10 con balcón | Mérida en Venta |
| N+1 | Sala de tableros 21,0 15×10 | YuCATÁN |
| N+1 | Corredor alto (vacío al patio) | Backgammon |
| N+1 | Tu cuarto 0,17 8×13 | espejo abre Mi personaje |
| N+1 | Sala de música 28,10 8×20 | la radio maneja la música |
| N+2 | Pérgola 0,0 16×10 | Rummy |
| N+2 | Azotea 16,0 20×10 | Conecta 4; tinacos, tendedero |
| N+2 | Mirador 0,17 | (libre: lotería) |

## Decidido (22 nov 2026, según el anteproyecto)
- Uno en el patio, bajo el árbol.
- Lote de 36.
- Tu cuarto y sala de música: sí.
- Dominó (cuarto libre PB) y lotería (mirador) como siguientes juegos.

## Pasos (una sesión cada uno; esfuerzo sugerido)
Al empezar una sesión: "Sigue CASONA.md, paso N". Leer este archivo, **siempre el anteproyecto** (enlace arriba, con Artifact read: coordenadas de mesas, vanos y decoración salen de ahí) y la sección de `CASA_BLENDER.md` que haga falta.

- [x] **1. Maqueta de cajas** (hecho: `blender/casona.py` → `modelos/casona/{nm1,n0,n1,n2}.glb`; `c_casona_caja.js` los arma como pisos `cm1/c0/c1/c2`; probar con `/?casa=caja`; escalera de maqueta: mitad sube, mitad baja) — — esfuerzo **high**. `blender/casona.py` con muros, losas, vanos y la escalera de los 4 niveles, sin texturas ni horneado. Empties: `mesa_<juego>`, `escalera`, `puerta_<x>`, `maniqui`. Exportar un GLB por nivel y verlo en el juego con `?casa=caja` (mesas reales puestas desde los empties). Probar 840×360 y 360×840.
- [x] **2. Lectura de marcadores y choques** (hecho: `c_casa_marcas.js` → `MARC.leer(root)` da mesas, escaleras con destino `to`, puertas, llegada, choques, líneas de corte y límites; CAJA ya no tiene coordenadas a mano; `tests/casona_marcas.js` revisa los GLB) — esfuerzo **high**. Módulo nuevo que lee los empties del GLB (mesas, escalera, puertas) y los choques (segmentos exportados desde Blender) en vez de coordenadas a mano.
- [x] **3a. Planta baja: salón, zaguán y comedor** (hecho: `blender/casona_pb.py` arma la planta baja detallada sobre los datos de `casona.py` y la hornea → `modelos/casona/pb.glb` + `pb_luz.jpg`; `c_casona_mat.js` (CMAT) pone texturas por luz horneada; CAJA la usa en `c0`, `?pb=caja` vuelve a la maqueta. Salón y comedor con pasta y cenefa, lambrín, ventanales con persianas y reja, tapetes; mecedoras, trinchador, banca, portón, arcos de cantera y arbotantes) — esfuerzo **xhigh**. Rehacer el salón de la prueba a 5.5, con luz horneada; mesas de Continental y Monopoly Deal en sus cuartos.
- [x] **3b. Planta baja: patio y corredores** (hecho en el mismo `pb.glb`: arquería sobre las 14 columnas, patio de laja sin techo, árbol en su arriate (la copa se desvanece si estás debajo), macetones, hamaca en el corredor y la gata en `gata_n0` con `GATA.nueva`) — esfuerzo **high**. Patio sin techo, arcos, árbol, hamaca y gata; mesa de Uno.
- [x] **4. Escalera única y plano "Ir a"** (hecho: escalera sube/baja en el mismo punto de los 4 niveles; al llegar desde otro nivel apareces en `llegada_escalera_<n>`; `plano_<lugar>_<n>` (junto a la escalera en cada nivel y en el zaguán) cuelga un plano enmarcado dibujado desde el GLB que abre "Ir a" (CIR, ya con los 4 niveles; tocar un nivel te lleva a su escalera); `goFloor` espera en negro a que cargue el GLB (`F.listo`)) — esfuerzo **medium**. Portales de los 4 niveles en el mismo punto; plano nuevo junto a la escalera y en el zaguán.
- [ ] **5. Planta alta** — esfuerzo **high**. Avance (22 nov): `blender/casona_pa.py` (usa `casona_pb.py` como biblioteca) ya arma y hornea la planta alta → `modelos/casona/pa.glb` + `pa_luz.jpg`; CAJA la usa en `c1` (`?pa=caja` vuelve a la maqueta). Biblioteca con libreros, sala de tableros con aparador y mecedoras, antesala, balcones con herrería, corredor con arcos rebajados y barandal 2.0 al vacío, copia ligera del patio abajo. Falta, en este orden:
  1. **Calidad de la luz horneada: resuelta en la prueba (22 nov, PC principal con RX 7600)**. El usuario la vio en el juego en zaguán y salón y dijo "mejor"; lo que aún veía mal (columnas, corredor, patio) no entra en la prueba. Causas reales y arreglos:
     - Muros metidos en otros muros (la punta entra ~.3 en el perpendicular) se horneaban negros, y el negro se corría a esquinas y uniones (quitarruido, bilineal, mipmaps). `_dentro` (horneado AO a .35, <.08, +1 texel) los marca y `_rellenar` los llena con la luz de su misma isla (`_islas`); el fondo del atlas se rellena con push-pull (`_pp`).
     - El JPG q84 metía cuadros y rayas de hasta 4.5% en muros lisos: ahora `guardar` escribe **WEBP sin pérdida** (`pb_luz.webp`, ~3 MB la planta completa).
     - CMAT: luz con B-spline bicúbica de cerca (`cubica`, solo si un texel de luz ocupa >1 pixel); cantera 512 con grano fino (la de 256 se veía pixeleada). Sol a 3° (orillas menos duras).
     - Antes: empaque al 51% (`pack_islands` margen .002), `FUERA`=.1, `PRIO_MAT`, 1000 muestras en 5 pasadas con avance en % (`_pasadas`), OIDN con normales.
     - **Sin commit a propósito**: `c_casona_caja.js` ya pide `pb_luz.webp` para `c0` (y `jpg` para `c1`); `modelos/casona/pb.glb`, `pb_luz.jpg` y `pb_luz.webp` locales son de la prueba (solo zaguán y salón): no subirlos.
  2. **Horneadas completas las dos plantas (22 nov)**: PB 27 min, PA 20 min, luz en WEBP (~1.4 MB cada una); `casona_pb.py` tiene `NOM` (`casona_pa.py` pone `pa`) para que la alta no pise `pb.glb`/`pb_luz.webp`. `c_casona_caja.js` pide `webp` en `c0` (v4) y `c1` (v2). **Falta el visto bueno del usuario** (columnas, corredor y patio en `/?casa=caja`); al aprobar: `git rm modelos/casona/pb_luz.jpg modelos/casona/pa_luz.jpg` y subir `pb.glb`, `pa.glb`, las dos `*_luz.webp`, los dos .py, `c_casona_caja.js` y este archivo.
  - Visto bueno y subido. Pendiente sin prisa: zonas aún algo pixeleadas en muros (el usuario lo pospuso).
  - Escalera nueva (`ESC` en `casona.py`, la usan los 3 scripts): tramos de 2.8 centrados con la puerta, escalón de .45 y descanso al pie; ya en la maqueta (`nm1`, `n2`). En `pb.glb`/`pa.glb` solo se movieron los marcadores (sin hornear); **los escalones nuevos entran en el próximo horneado de cada planta**. Backgammon pasó a la sala de música (32, 24.5): el corredor no cabe con radio 2.2.
  3. Revisar la planta alta en el juego (840×360 y 360×840), `node tests/casona_marcas.js`, y marcar el paso.
- [ ] **6. Sótano** — esfuerzo **high**. Mover cantina, casino, billar y Ruleta a la planta nueva sin romper `SAL`, `BIL`, `CAS3`, `BJ3`.
- [ ] **7. Azotea** — esfuerzo **medium**. Pérgola, Rummy, Conecta 4, tinacos, tendedero.
- [ ] **8. Fachada y calle** — esfuerzo **medium**. Ajustar `CASCO`, `CCALLE` y vecinos al lote de 36 y a las alturas nuevas.
- [ ] **9. Decoración** — esfuerzo **medium**, una sesión por grupo: cocina y baño; traspatio; tu cuarto y sala de música.
- [ ] **10. Casa de fondo en los juegos** — esfuerzo **medium**. `FONDO`, `CUA` y `MRG` con la casa nueva.
- [ ] **11. Quitar la bandera** — esfuerzo **medium**. Peso total, FPS en Android débil, corte en todos los cuartos; luego borrar la casa vieja.
