# blender/barrio_horizonte.py — horizonte barato (casona_landscape.md): dos anillos de siluetas planas alrededor de la casona (radio 140
# y 156) con selva baja, cuadras de casas, tinacos, antenas y torres de iglesia; ya pintado con su tono del atardecer (color por vértice,
# más claro abajo, como bruma). Una sola malla sin luz horneada (1 draw call): el juego le quita la niebla y lo tiñe de noche.
# Caras hacia el centro. Exporta barrio_horizonte.glb (no hay que hornear: `-- exportar` basta).
#   blender -b --factory-startup --python blender/barrio_horizonte.py -- exportar|vista   (ver blender/barrio_lib.py)
import os, math, random
D = next(d for d in [os.getcwd()] + ([os.path.dirname(os.path.dirname(os.path.abspath(__file__)))] if '__file__' in globals() else []) if os.path.isfile(os.path.join(d, 'blender', 'casona.py')))
exec(open(os.path.join(D, 'blender', 'barrio_lib.py'), encoding='utf-8').read())
B = cargar('horizonte')
C = (18, 24)        # centro: juego (0, −7), el de la casona
BRUMA = B.lin('#e8d6ba')    # color de la niebla de CIELO (de día)
TORRES = (.35, 1.45, 2.6, 3.5, 4.4, 5.5)     # ángulos (rad) con iglesia; la de 1.45 es la parroquia de la plaza vista desde lejos

def perfil(R, capa):
    """Lista de (ángulo, alto, color) con escalones; capa 0 (cerca: cuadras y selva), 1 (lejos: selva y torres)."""
    L, n, a = [], 0, 0.0
    paso = 2 * math.pi / (260 if capa == 0 else 200)
    pal = [B.lin(h) for h in (('#d6b49f', '#cfa894', '#dcbca6', '#c9a08e') if capa == 0 else ('#d9bfae', '#d2b4a2'))]
    selva = B.lin('#b9a58e' if capa == 0 else '#c7b19c'); torre = B.lin('#c49c8a' if capa == 0 else '#cbab99')
    while a < 2 * math.pi - 1e-6:
        t = R.random()
        if any(abs(a - x) < .02 for x in TORRES) and capa == 1:
            w = .018; h = R.uniform(17, 22)
            for da, hh in ((0, 9), (w * .3, 9), (w * .3, h), (w * .65, h + 2.2), (w, h), (w, 9), (w * 2.2, 10.5), (w * 4.1, 9), (w * 4.1, h),
                           (w * 4.45, h + 2.2), (w * 4.8, h), (w * 4.8, 9)):
                L.append((a + da, hh, torre))
            a += w * 5.2; continue
        if capa == 0 and t < .45:      # cuadra: casas de techo plano, a veces tinaco o antena
            for k in range(R.randint(3, 7)):
                w = paso * R.uniform(1.2, 2.6); h = R.uniform(4.5, 8.5) if R.random() > .15 else R.uniform(10, 13)
                c = pal[R.randrange(len(pal))]; L += [(a, h, c), (a + w, h, c)]
                if R.random() < .2:
                    m = a + w * .5; L += [(m - paso * .2, h, c), (m - paso * .2, h + 1.2, c), (m + paso * .2, h + 1.2, c), (m + paso * .2, h, c)]
                if R.random() < .05:
                    m = a + w * .3; L += [(m, h, c), (m, h + 7, c), (m + paso * .04, h + 7, c), (m + paso * .04, h, c)]
                a += w
        else:                          # selva baja: copas onduladas
            for k in range(R.randint(4, 9)):
                h = (R.uniform(5, 8.5) if capa == 0 else R.uniform(7, 11)) + 1.5 * math.sin(a * 23)
                L.append((a, h, selva)); a += paso * R.uniform(.6, 1.1)
    L.append((2 * math.pi, L[0][1], L[0][2]))
    return L

def anillo(bm, R, capa):
    r = 140 if capa == 0 else 156; L = perfil(R, capa); cl = bm.loops.layers.float_color.get('Col') or bm.loops.layers.float_color.new('Col')
    cen = B.V(C[0], 0, C[1])
    def vt(a, y): return bm.verts.new(B.V(C[0] + r * math.cos(a), y, C[1] + r * math.sin(a)))
    for (a0, h0, c0), (a1, h1, c1) in zip(L, L[1:]):
        if a1 - a0 < 1e-5: continue
        f = bm.faces.new([vt(a0, -3), vt(a1, -3), vt(a1, h1 if c1 == c0 else h0), vt(a0, h0)]); f.normal_update()
        if f.normal.dot(cen - f.calc_center_median()) < 0: f.normal_flip()
        for lp in f.loops:
            k = max(0.0, min(1.0, (lp.vert.co.z + 3) / 9.0)); k = .45 + .55 * k          # abajo se pierde en la bruma
            lp[cl] = (*(BRUMA[i] + (c0[i] - BRUMA[i]) * k for i in range(3)), 1)

def piezas(B):
    R = random.Random(160)
    bm = B.M('anillo', 'horizonte', luz=False, uv=False)
    anillo(bm, R, 1); anillo(bm, R, 0)

VISTAS = [('horizonte_calle', (18, 2.2, -7), (18, 7, -120)), ('horizonte_azotea', (18, 16, 30), (140, 8, 60))]

if __name__ == '__main__':
    correr(B, piezas, VISTAS, ctx=(), topes=(1, 8000))
