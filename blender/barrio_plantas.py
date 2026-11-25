# blender/barrio_plantas.py — 3c de ARREGLOS.md: plátanos, milpa y arbustos con la calidad de los árboles (arbol_ramas):
# hojas que se curvan con nervadura y grosor (no tablas), caras suaves, y arbustos de nube fundida con la textura de las copas.
# barrio_manzana.py lo ejecuta dentro de B después de barrio_jardin.py y reemplaza arbusto(), platano() y milpa().
import math, random

def _hoja(bm, x, y, z, a, L, W, sube, cae, col, nerv=None, seg=5, dobla=.22, ancho=None):
    """Hoja larga que sale de (x, y, z) hacia el ángulo a: sube y luego cae (arco), ancho W en medio, punta aguda.
    Sección en V abierta (orillas más bajas que la nervadura) y dos caras separadas 1.2 cm: se ve de arriba y de abajo."""
    cl = bm.loops.layers.float_color.get('Col') or bm.loops.layers.float_color.new('Col')
    ca, sa = math.cos(a), math.sin(a); px, pz = -sa, ca; nerv = nerv or col; fil = []
    for i in range(seg + 1):
        t = i / seg; d = L * t; h = y + sube * math.sin(math.pi * min(t / .55, 1) / 2) - cae * max(0, (t - .45) / .55) ** 1.6
        w = (ancho(t) if ancho else math.sin(math.pi * (.08 + .92 * t)) ** .7) * W / 2
        cx, cz = x + ca * d, z + sa * d; ho = h - dobla * w
        fil.append([(cx - px * w, ho, cz - pz * w), (cx, h, cz), (cx + px * w, ho, cz + pz * w)])
    for e, sg in ((.006, 1), (-.006, -1)):
        vs = [[bm.verts.new(V(p[0], p[1] + e, p[2])) for p in f] for f in fil]
        for i in range(seg):
            for j in range(2):
                q = (vs[i][j], vs[i + 1][j], vs[i + 1][j + 1], vs[i][j + 1])
                f = bm.faces.new(q if sg > 0 else q[::-1]); f.normal_update()
                if (f.normal.z < 0) == (sg > 0): f.normal_flip()
                f.smooth = True
                for lp in f.loops: lp[cl] = (*(nerv if lp.vert in (vs[i][1], vs[i + 1][1]) else col), 1)

def platano(x, z, R, h=2.7, hijo=True):
    """Mata de plátano: tallo (pseudotallo) que adelgaza, 6-7 hojas grandes arqueadas con nervadura clara que salen de la punta en
    abanico y cuelgan, una hoja seca colgando del tallo, a veces el racimo con su bellota morada y un hijuelo al pie."""
    fa = FA(); g = SUELO(x, z); verde = lin('#5f9444'); claro = lin('#b9c77e')
    pieza(fa, lin('#7f8f55'), P.tubo, (x, g - .05, z), (x, g + h * .55, z), .19, .15, 6, suave=True)
    pieza(fa, lin('#8fa05c'), P.tubo, (x, g + h * .55, z), (x, g + h, z), .15, .11, 6, suave=True)
    n = 6 if hijo else 3; b0 = R.uniform(0, 6.3)
    for k in range(n):
        a = b0 + k * 2 * math.pi / n + R.uniform(-.25, .25); c = osc(verde, R.uniform(.85, 1.1)); L = R.uniform(1.9, 2.3) * h / 2.7
        _hoja(fa, x, g + h - .05 + R.uniform(0, .3), z, a, L, R.uniform(.55, .7), R.uniform(.5, .9), R.uniform(.9, 1.5), c, claro, seg=4)
    a = b0 + R.uniform(0, 6.3); ca, sa = math.cos(a), math.sin(a)      # hoja seca colgando pegada al tallo
    _hoja(fa, x + ca * .12, g + h * .8, z + sa * .12, a, .9, .4, .05, 1.3, lin('#9b7d4e'), lin('#b39463'), seg=3, dobla=.1)
    if hijo and R.random() < .55:   # racimo: tallo que se dobla hacia abajo, manos de plátano verdes y la bellota
        a = R.uniform(0, 6.3); ca, sa = math.cos(a), math.sin(a); t0 = (x + ca * .1, g + h - .1, z + sa * .1); t1 = (x + ca * .45, g + h - .35, z + sa * .45)
        pieza(fa, lin('#7d8c4c'), P.tubo, t0, t1, .04, .035, 5, suave=True)
        pieza(fa, lin('#7d9a3a'), ico, t1[0], t1[1] - .32, t1[2], .2, 1, 1.7, suave=True)
        pieza(fa, lin('#6b2d3a'), ico, t1[0] + ca * .04, t1[1] - .78, t1[2] + sa * .04, .09, 0, 1.6, suave=True)
    if hijo and R.random() < .35:
        a = R.uniform(0, 6.3); platano(x + math.cos(a) * .55, z + math.sin(a) * .55, random.Random(R.random()), h * R.uniform(.35, .5), hijo=False)

def milpa(x0, x1, z0, z1, R):
    """Milpa en surcos: caña verde que adelgaza, 4-5 hojas largas angostas alternadas que se arquean y cuelgan, espiga
    de tres brazos dorados arriba y, en algunas, un elote envuelto en su hoja con barbas."""
    fa, ca, ho, cl = FA(), lin('#86a453'), lin('#6c9a45'), lin('#a8bf6a')
    for x in np.arange(x0, x1 + .01, .75):
        for z in np.arange(z0, z1 + .01, .7):
            x_, z_ = x + R.uniform(-.12, .12), z + R.uniform(-.12, .12); h = R.uniform(2.3, 2.9); g = SUELO(x_, z_)
            pieza(fa, ca, P.tubo, (x_, g, z_), (x_, g + h, z_), .045, .02, 5, suave=True)
            n = R.randint(4, 5); b = R.uniform(0, 6.3)
            for k in range(n):
                y = g + h * (.25 + .55 * k / n); a = b + k * math.pi + R.uniform(-.5, .5)
                _hoja(fa, x_, y, z_, a, R.uniform(.85, 1.15) * (1 - .25 * k / n), .11, R.uniform(.25, .4), R.uniform(.55, .8),
                      osc(ho, R.uniform(.88, 1.08)), cl, seg=3, dobla=.15, ancho=lambda t: min(1, t * 6) * (1 - t) ** .5)
            for k in range(3):   # espiga
                a = R.uniform(0, 6.3); pieza(fa, PAL['dorado'], P.tubo, (x_, g + h - .05, z_), (x_ + math.cos(a) * .14, g + h + .32, z_ + math.sin(a) * .14), .012, .006, 3)
            if R.random() < .45:   # elote
                a = R.uniform(0, 6.3); ex, ez = x_ + math.cos(a) * .09, z_ + math.sin(a) * .09
                pieza(fa, lin('#9fb466'), ico, ex, g + h * .5, ez, .07, 0, 2.6, suave=True)
                pieza(fa, lin('#b08a4a'), P.tubo, (ex, g + h * .5 + .17, ez), (ex + math.cos(a) * .05, g + h * .5 + .27, ez + math.sin(a) * .05), .025, .01, 3)

_CPA = []
def arbusto(x, z, s, R, col=None):
    """Arbusto de nube fundida (como las copas de arbol_ramas, con su textura de hojas): un cuerpo y 3-4 lóbulos al azar,
    aplanado abajo al ras del suelo; alterna copa oscura y clara (mallas de copa que ya existen: sin llamadas de dibujo nuevas)."""
    if not _CPA: _CPA.extend([_cp('laurel', 'copa'), _cp('ceiba', 'copa_c')])
    g = SUELO(x, z); r = .62 * s * (1.15 if s > .95 else 1); sy = .8 if s <= .95 else .7
    bl = [(x, g + r * sy * .55, z, r * .8)]; b0 = R.uniform(0, 6.3); nl = R.randint(3, 4)
    for k in range(nl):
        b = b0 + k * 2 * math.pi / nl + R.uniform(-.4, .4); d = r * R.uniform(.45, .65)
        bl.append((x + math.cos(b) * d, g + r * sy * R.uniform(.35, .75), z + math.sin(b) * d, r * R.uniform(.5, .65)))
    P.nube_mb(_CPA[0] if R.random() < .6 else _CPA[1], bl, sy, max(.32, r / 2.0), g + .02)
