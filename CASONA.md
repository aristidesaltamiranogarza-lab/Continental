# Casona de juegos: plan de la casa nueva

Anteproyecto (planos, corte y tabla): https://claude.ai/artifact/PX1g934RWSsWF4VdTB7Doa
Cómo se trabaja en Blender, errores y flujo: `CASA_BLENDER.md`.
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

## Por decidir (antes del paso 1)
- Uno en el patio o en el salón.
- Lote de 36 (hoy 34).
- Tu cuarto y sala de música: sí o no.
- Dominó y lotería como siguientes juegos.

## Pasos (una sesión cada uno; esfuerzo sugerido)
Al empezar una sesión: "Sigue CASONA.md, paso N". Leer solo este archivo y la sección de `CASA_BLENDER.md` que haga falta.

- [ ] **1. Maqueta de cajas** — esfuerzo **high**. `blender/casona.py` con muros, losas, vanos y la escalera de los 4 niveles, sin texturas ni horneado. Empties: `mesa_<juego>`, `escalera`, `puerta_<x>`, `maniqui`. Exportar un GLB por nivel y verlo en el juego con `?casa=caja` (mesas reales puestas desde los empties). Probar 840×360 y 360×840.
- [ ] **2. Lectura de marcadores y choques** — esfuerzo **high**. Módulo nuevo que lee los empties del GLB (mesas, escalera, puertas) y los choques (segmentos exportados desde Blender) en vez de coordenadas a mano.
- [ ] **3a. Planta baja: salón, zaguán y comedor** — esfuerzo **xhigh**. Rehacer el salón de la prueba a 5.5, con luz horneada; mesas de Continental y Monopoly Deal en sus cuartos.
- [ ] **3b. Planta baja: patio y corredores** — esfuerzo **high**. Patio sin techo, arcos, árbol, hamaca y gata; mesa de Uno.
- [ ] **4. Escalera única y plano "Ir a"** — esfuerzo **medium**. Portales de los 4 niveles en el mismo punto; plano nuevo junto a la escalera y en el zaguán.
- [ ] **5. Planta alta** — esfuerzo **high**. Biblioteca, sala de tableros, corredor con barandal y el patio de abajo como copia ligera horneada.
- [ ] **6. Sótano** — esfuerzo **high**. Mover cantina, casino, billar y Ruleta a la planta nueva sin romper `SAL`, `BIL`, `CAS3`, `BJ3`.
- [ ] **7. Azotea** — esfuerzo **medium**. Pérgola, Rummy, Conecta 4, tinacos, tendedero.
- [ ] **8. Fachada y calle** — esfuerzo **medium**. Ajustar `CASCO`, `CCALLE` y vecinos al lote de 36 y a las alturas nuevas.
- [ ] **9. Decoración** — esfuerzo **medium**, una sesión por grupo: cocina y baño; traspatio; tu cuarto y sala de música.
- [ ] **10. Casa de fondo en los juegos** — esfuerzo **medium**. `FONDO`, `CUA` y `MRG` con la casa nueva.
- [ ] **11. Quitar la bandera** — esfuerzo **medium**. Peso total, FPS en Android débil, corte en todos los cuartos; luego borrar la casa vieja.
