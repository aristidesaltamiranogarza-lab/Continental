# Animación del personaje

Meta: animaciones como de juego bien hecho (quieto, caminar, sentarse, brincar, cartas, repartir, pistola a la sien, cargar al gato).

## Cómo se trabaja (acordado con el usuario, 25 nov 2026)
1. **Movimientos de cuerpo completo (quieto, caminar, correr, brincar, sentarse): nunca a mano.** Se toman del Universal Animation Library de Quaternius (CC0) y se pasan al Rig con `blender/anim_retarget.py`.
2. **Poses propias del juego (cartas, repartir, pistola, gato): por objetivos de la mano (IK) y empties**, no por ángulos a ojo. Accesorios pegados a la mano (Rig_Agarre, Sien_I/D ya existen).
3. **Revisar siempre con imágenes antes de enseñar**: `look` del MCP de Blender en modo `frames` (8 cuadros de lado, y 4 de frente y 3/4). Arreglar y volver a ver.
4. **Por etapas**: primero 3–5 poses clave para que el usuario las apruebe (barato cambiar), después tiempos y pulido.
5. Encima, por código en c_avatar.js: mezclas suaves, voltear la cabeza; nada de topes por juego.

## Escala (decidida)
- Chibi: 2.5 de alto en su .blend × AV.K 0.8 = **2.0** en el juego (hasta el pelo). Cadera 0.82, rodilla 0.45, tobillo 0.12 (unidades del .blend).
- Sillas de **mesa de juego: 0.95** (banco alto, pies en el aro). **Asientos de descanso (bancas, sillones, mecedoras, confidentes, sillas sueltas): 0.6**, pies colgando un poco. Pies planos solo con 0.27 (descartado: muebles de muñecas). Ya cambiados en los scripts de casona/barrio (falta hornear).

## Archivos
- Escena del personaje: **`C:\Users\aris1\OneDrive\Documentos\Untitled.blend`** (escena Chibi; objetos Rig, Frente, Ropa_n, Peinado_n, Rig_Pistola). Abrir con Blender 5.2. El MCP de Blender se conecta ahí (si dice addon viejo: `uvx mcp-for-blender install-addon`, reactivar el addon y Start MCP Server).
- Paquete: `blender/anim_src/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb` (sin root motion; `_RM` lo trae). No se sube (está en .gitignore); si falta, el usuario lo tiene en Descargas (`Universal Animation Library[Standard].zip`).
  Clips útiles: Idle_Loop, Walk_Loop, Walk_Formal_Loop, Jog_Fwd_Loop, Sprint_Loop, Jump_Start/Loop/Land, Sitting_Enter / Sitting_Idle_Loop / Sitting_Exit / Sitting_Talking_Loop, Idle_Talking_Loop, PickUp_Table, Interact, Pistol_*, Dance_Loop, Hit_*, Death01, Crouch_*.
- `blender/anim_retarget.py`: con la escena Chibi abierta, vía MCP:
  `exec(open(r'C:/Users/aris1/code/Continental/blender/anim_retarget.py', encoding='utf-8').read(), {'PRM': {'ABRE': 18.0}})`
  (para revisar sin exportar: `{'EXPORTA': False, 'VER': 'Camina', 'ABRE': 18.0}` y luego `look` frames con Rig_Pistola oculto; al final quitar la acción del Rig y volver a mostrar Rig_Pistola).
  - `K['CLIPS']`: nombre en el juego → clip del paquete. Agregar uno = una línea.
  - Método: cada hueso copia el giro en el mundo del suyo, medido desde el reposo; brazos/piernas se alinean antes a la dirección de reposo del maniquí (el chibi está en A abierta 24°). Cadera sube y baja a escala de la pierna.
  - Ajustes: `PESO` {'columna': .5, 'cabeza': .35} (cabeza grande: inclinarla parece mirar al piso), `ABRE` 18° (los brazos no cruzan la panza; el default del archivo es 10, usar 18).
  - Exporta `modelos/personaje/anim.glb` (~72 KB, solo huesos y las acciones nuevas vía pistas NLA). No toca chibi.glb ni la cadena rig.py → crupier.py → crupier_juntar.js.
- `c_avatar.js`: carga anim.glb junto con chibi.glb (`URL_ANIM ?v=1`, subir al reexportar; `CAPA=['Quieto','Camina']`). `capa()` arma interpolantes por hueso de HM (sin dedos), `capaPon()` mezcla encima del mixer al inicio de `mov()`: Quieto con peso idl·(1−w), Camina con peso w y tiempo = ph/2π ciclos (misma cadencia que antes). Saludo y baile por código van encima. Si anim.glb no carga, queda el paso/respiro a mano. HM ahora incluye manos y pies; la posición de la cadera se guarda/restaura (u.tocP).

## Hecho
- [x] Asientos de descanso a 0.6 (commit d3227b2).
- [x] Quieto y Camina en el juego (commit 64ddbdc). Revisado en Blender; en el juego solo por datos (sin probar en teléfono).
- [x] Sentarse, Sentado, Levantarse y Trota (anim.glb ?v=2). `AV.sentar(p,si,anim)`: anim=true (asientos de la casa, c_casa_sentar.js) toca Sentarse/Levantarse; la cadera solo se desliza al frente/atrás (el clip baja 0.30 a su silla; en asientos de 0.6 la cadera sentada queda a la altura de parado). Sentado es el primer cuadro, quieto (el loop solo mueve 2–3°; así no se anima cada cuadro). En la mesa (pose que no es Reposo) solo las piernas, las manos siguen con las cartas. Reemplaza el doblez por código (queda si no carga anim.glb).
- [x] Pies que patinaban: la casa va a 5.2/s (trote para un personaje de 2.0), así que ahí se usa Trota (`AV.mueve({tr:1})`, avanza 1.57 por ciclo) y `ph+=mv*4` (2π/4 = 1.57). Quitado el sube/baja por código cuando hay clips.

## Siguiente
- [ ] Revisar en teléfono: sentarse/levantarse en asientos de la casa y el trote al caminar (solo revisado en Blender y por datos).
- [ ] Levantarse: SENT.paso te pone 1.2 al frente de golpe y el clip solo avanza 0.18; si se nota el salto, deslizar el grupo durante el clip.
- [ ] Brincar.
- [ ] Poses del juego por IK: cartas en la mano, repartir, pistola a la sien (ya hay PistolaSien en rig.py), cargar al gato (falló antes por poner ángulos a ojo).
