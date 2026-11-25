# blender/barrio_trasera.py — paso 3 de ARREGLOS.md: el corazón de la manzana detrás de la casona como jardín del barrio.
# barrio_manzana.py lo ejecuta dentro de B (igual que barrio_kit.py): usa pieza, caja_o, ico, cf, FA, HI, M, PAL, osc, P, YS...
# Todo pasto (hojas solo en ZONAS), caminito curvo de laja que une la puerta trasera de la casona con la plaza y la cancha,
# bardas de patio distintas entre sí, vida en los patios y muros traseros con ventanas.
import math, random

SUELO_P = 'pasto_c'      # fila(): suelo de los patios (pasto liso; 'pasto' lleva hojas en el juego)
P.COLOR['pasto_c'] = P.COLOR['pasto']   # mismo color al hornear; en el juego CMAT le da la textura del pasto sin matas
VIDA = True              # fila(): bardas variadas, tendederos, lavaderos, sillas y macetas en los patios; ventanas atrás

def _cr(pts, n):
    """Curva Catmull-Rom por los puntos [(x, z)], n tramos entre cada par."""
    q = [pts[0]] + list(pts) + [pts[-1]]; out = []
    for i in range(1, len(q) - 2):
        p0, p1, p2, p3 = q[i - 1], q[i], q[i + 1], q[i + 2]
        for k in range(n):
            t = k / n; t2, t3 = t * t, t * t * t
            out.append(tuple(.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                                   + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in (0, 1)))
    out.append(tuple(pts[-1])); return out

def sendero(pts, w=2.6, y=None, n='sendero', m='laja', paso=5, vaiven=.18, seed=1):
    """Caminito curvo: cinta de ancho w (que respira ±vaiven) sobre el pasto. Regresa la línea central."""
    y = YS + .04 if y is None else y; c = _cr(pts, paso); bm = M(n, m, prio=.5); L, R = [], []
    for i, (x, z) in enumerate(c):
        a, b = c[max(i - 1, 0)], c[min(i + 1, len(c) - 1)]; dx, dz = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dz) or 1
        h = w / 2 * (1 + vaiven * math.sin(i * .9 + seed * 2.1)); nx, nz = -dz / l, dx / l
        L.append((x + nx * h, z + nz * h)); R.append((x - nx * h, z - nz * h))
    for i in range(len(c) - 1): P.plano(bm, [L[i], R[i], R[i + 1], L[i + 1]], y)
    return c

def al_lado(c, t, d):
    """Punto a d del caminito c (d>0 a la izquierda de su avance) en la fracción t de su largo."""
    i = min(int(t * (len(c) - 1)), len(c) - 2); (x0, z0), (x1, z1) = c[i], c[i + 1]; l = math.hypot(x1 - x0, z1 - z0) or 1
    return x0 - (z1 - z0) / l * d, z0 + (x1 - x0) / l * d

def suelo_partido(x0, z0, x1, z1, huecos, zonas, y=None):
    """Pasto de (x0, z0) a (x1, z1) sin los huecos [(x0, z0, x1, z1)]: 'pasto' (con hojas en el juego) en las zonas, 'pasto_c' en lo demás.
    Cuadrícula por las orillas de todo; en cada renglón junta las celdas seguidas del mismo tipo."""
    y = YS if y is None else y
    xs = sorted({x0, x1} | {v for r in huecos + zonas for v in (r[0], r[2]) if x0 < v < x1})
    zs = sorted({z0, z1} | {v for r in huecos + zonas for v in (r[1], r[3]) if z0 < v < z1})
    den = lambda r, x, z: r[0] <= x <= r[2] and r[1] <= z <= r[3]
    for za, zb in zip(zs, zs[1:]):
        zm, run = (za + zb) / 2, None
        for xa, xb in list(zip(xs, xs[1:])) + [(x1, x1)]:
            xm = (xa + xb) / 2
            k = None if xa == xb or any(den(h, xm, zm) for h in huecos) else ('pasto' if any(den(r, xm, zm) for r in zonas) else 'pasto_c')
            if run and run[0] == k: run[2] = xb; continue
            if run and run[0]: quad(NOMB + '_' + run[0], run[0], run[1], za, run[2], zb, y=y, prio=.25)
            run = [k, xa, xb]

def barda_v(xa, za, xb, zb, R, h=None):
    """Barda de patio con alto y color propios; la mitad sin tapa de cal (aplanado liso), algunas con remate de ladrillo."""
    fa = FA(); col = osc(PAL[COLORES[R.randrange(len(COLORES))]], R.uniform(.86, 1.0)) if R.random() < .55 else osc(PAL['crema'], R.uniform(.85, .98))
    h = h or round(R.uniform(1.9, 2.8), 2); e = R.choice((.2, .24, .3))
    if abs(za - zb) < 1e-3: (x0, x1), z0, z1 = sorted((xa, xb)), za - e / 2, za + e / 2
    else: x0, x1, (z0, z1) = xa - e / 2, xa + e / 2, sorted((za, zb))
    pieza(fa, col, caja_o, x0, x1, YS, h, z0, z1, (2,))
    t = R.random()
    if t < .4: pieza(fa, PAL['cal'], caja_o, x0 - .04, x1 + .04, h, h + .1, z0 - .04, z1 + .04, (2,))
    elif t < .55: pieza(fa, PAL['barro'], caja_o, x0 - .02, x1 + .02, h, h + .16, z0 - .02, z1 + .02, (2,))
    if R.random() < .3: pieza(fa, osc(col, .72), caja_o, x0 - .02, x1 + .02, YS, YS + .45, z0 - .02, z1 + .02, (2,))   # zoclo

def trasera(x0, x1, H, col, zb, db, R):
    """Huecos en el muro de atrás de una vecina (muro en z=zb; db: hacia dónde ve): ventanitas con marco de cal y a veces puerta."""
    global ZF, DZ
    ZF, DZ = zb, db; fa, cal, w = FA(), PAL['cal'], x1 - x0
    us = [x0 + w * .3, x0 + w * .72] if w >= 8 else [x0 + w * .5]
    for i, u in enumerate(us):
        if i == 0 and R.random() < .45 and w >= 7:      # puerta de servicio
            a, b = u - .65, u + .65; pieza(fa, PAL['madera'], cf, a, b, 0, 2.85, -.06, .02, back=True)
            pieza(fa, cal, cf, a - .12, b + .12, 2.85, 3.05, 0, .06)
        else:
            a, b, y0, y1 = u - .55, u + .55, 1.6, 2.7
            pieza(fa, PAL['vidrio'], cf, a, b, y0, y1, -.05, .01, back=True)
            pieza(fa, cal, cf, a - .12, b + .12, y0 - .12, y0, 0, .1); pieza(fa, cal, cf, a - .12, b + .12, y1, y1 + .16, 0, .06)
    if R.random() < .5:      # bajada de agua
        u = x0 + .4 if R.random() < .5 else x1 - .4; pieza(fa, PAL['gris'], cf, u - .07, u + .07, 0, H - .3, .02, .16)

def tendedero(xa, xb, z, R):
    fa, hi = FA(), HI()
    for x in (xa, xb): pieza(fa, PAL['gris'], caja_o, x - .06, x + .06, YS, YS + 2.3, z - .06, z + .06)
    for dz in (-.3, 0, .3): pieza(hi, None, P.viga, (xa, YS + 2.2, z + dz), (xb, YS + 2.2, z + dz), .012)
    x = xa + .4
    while x < xb - .8:
        a = R.uniform(.5, .9); c = PAL[R.choice(('blanco', 'azul', 'lona', 'amarillo', 'rosa', 'blanco'))]
        pieza(fa, c, caja_o, x, x + a, YS + 2.2 - R.uniform(.6, 1.0), YS + 2.2, z + R.choice((-.3, 0, .3)) - .015, z + .015)
        x += a + R.uniform(.2, .7)

def lavadero(x, z, ang=0.0):
    def arma():
        fa = FA(); c = PAL['gris']
        pieza(fa, c, caja_o, x - .7, x + .7, YS, YS + .85, z - .4, z + .4, (2,))
        pieza(fa, osc(c, .8), caja_o, x - .55, x + .1, YS + .85, YS + .9, z - .28, z + .28)
        pieza(fa, PAL['tinaco'], P.tubo, (x + .45, YS + .85, z), (x + .45, YS + 1.35, z), .22, .22, 8)
    girado(ang, x, z, arma)

def silla(x, z, ang=0.0, col=None):
    """Silla de plástico (asiento a 0.95, como la de la referencia)."""
    def arma():
        fa = FA(); c = col or PAL['blanco']
        pieza(fa, c, caja_o, x - .4, x + .4, YS + .85, YS + .95, z - .4, z + .4)
        pieza(fa, c, caja_o, x - .4, x + .4, YS + .95, YS + 1.75, z + .32, z + .42)
        for a in (-.34, .34):
            for b in (-.34, .34): pieza(fa, c, caja_o, x + a - .05, x + a + .05, YS, YS + .85, z + b - .05, z + b + .05, (2,))
    girado(ang, x, z, arma)

def vida_patio(x0, x1, za, zb, R, tend=True):
    """Algo de vida en un patio de atrás (x0..x1, za..zb; za pegado a la casa): una o dos cosas, nunca todo."""
    w, zm = x1 - x0, (za + zb) / 2; s = 1 if zb > za else -1
    if tend and w >= 7 and R.random() < .5: tendedero(x0 + 1.2, x1 - 1.2, za + s * R.uniform(3.2, 4.2), R)
    if R.random() < .45: lavadero(x0 + 1.1, za + s * 1.0, 0 if s > 0 else math.pi)
    if R.random() < .4:
        c = PAL[R.choice(('blanco', 'lona', 'azul'))]; xs = x1 - 1.6
        silla(xs, za + s * 1.6, R.uniform(-.5, .5) + (math.pi if s > 0 else 0), c); silla(xs - 1.1, za + s * 1.8, R.uniform(-.5, .5) + (math.pi if s > 0 else 0), c)
    for i in range(R.randint(1, 3)): maceta(R.uniform(x0 + .5, x1 - .5), zb - s * .5, YS, R.choice(('mata', 'agave', 'mata')))
