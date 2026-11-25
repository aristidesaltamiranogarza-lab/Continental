# blender/barrio_jardin.py — paso 3b de ARREGLOS.md: llenar el jardín del barrio (detrás de la casona, no el traspatio).
# barrio_manzana.py lo ejecuta dentro de B después de barrio_trasera.py: usa pieza, caja_o, ico, FA, M, P, PAL, osc, lin, YS, girado...
# - red(): todos los caminitos en UNA sola forma (unión suave de cintas: campo de distancia + contorno), sin cintas encimadas.
# - mancha(): zonas de pasto con hojas de orilla irregular (con islitas sueltas alrededor) en lugar de rectángulos.
# - macizo(): vegetación en manchas (arbustos, agaves, flores); mesa_domino(), albarrada() de piedra seca y huerto().
# Low-poly y color por vértice en <nom>_fachadas: casi todo cae en mallas que ya existen (pocas llamadas de dibujo).
import math, random
import numpy as np

# ---------- caminitos unidos ----------
def _linea(pts, w, vaiven, seed, paso=10):
    """Línea central densa [(x, z, medio_ancho)]: el ancho respira con el largo recorrido (no con el número de punto)."""
    c, s, out = _cr(pts, paso), 0.0, []
    for i, (x, z) in enumerate(c):
        if i: s += math.hypot(x - c[i - 1][0], z - c[i - 1][1])
        out.append((x, z, w / 2 * (1 + vaiven * math.sin(s * .55 + seed * 2.1))))
    return out

def _dist(X, Z, ln):
    """Distancia con signo a una cinta de ancho variable (negativa dentro)."""
    d = np.full(X.shape, 1e9)
    for (ax, az, ha), (bx, bz, hb) in zip(ln, ln[1:]):
        ex, ez = bx - ax, bz - az; L2 = ex * ex + ez * ez or 1e-9
        t = np.clip(((X - ax) * ex + (Z - az) * ez) / L2, 0, 1)
        d = np.minimum(d, np.hypot(X - ax - t * ex, Z - az - t * ez) - (ha + (hb - ha) * t))
    return d

def _smin(a, b, k):
    h = np.clip(k - np.abs(a - b), 0, None) / k
    return np.minimum(a, b) - h * h * k / 4

def _contornos(f, xs, zs):
    """Marching squares: lazos cerrados [(x, z)] donde f = 0 (f < 0 dentro)."""
    b = f < 0; ny, nx = f.shape
    def pt(e):
        k, i, j = e; i2, j2 = (i + 1, j) if k == 'h' else (i, j + 1)
        a, c = f[j, i], f[j2, i2]; t = a / (a - c)
        return (xs[i] + (xs[i2] - xs[i]) * t, zs[j] + (zs[j2] - zs[j]) * t)
    ady = {}
    def une(e1, e2): ady.setdefault(e1, []).append(e2); ady.setdefault(e2, []).append(e1)
    idx = b[:-1, :-1] * 1 + b[:-1, 1:] * 2 + b[1:, 1:] * 4 + b[1:, :-1] * 8
    for j, i in zip(*np.nonzero((idx > 0) & (idx < 15))):
        e = [('h', i, j), ('v', i + 1, j), ('h', i, j + 1), ('v', i, j)]; c = idx[j, i]
        dentro = (f[j, i] + f[j, i + 1] + f[j + 1, i + 1] + f[j + 1, i]) < 0
        tab = {1: [(3, 0)], 2: [(0, 1)], 3: [(3, 1)], 4: [(1, 2)], 6: [(0, 2)], 7: [(3, 2)], 8: [(2, 3)], 9: [(0, 2)], 11: [(1, 2)],
               12: [(1, 3)], 13: [(0, 1)], 14: [(3, 0)],
               5: [(0, 1), (2, 3)] if dentro else [(3, 0), (1, 2)], 10: [(3, 0), (1, 2)] if dentro else [(0, 1), (2, 3)]}[c]
        for p, q in tab: une(e[p], e[q])
    lazos, vis = [], set()
    for e0 in ady:
        if e0 in vis: continue
        lz, prev, e = [], None, e0
        while e not in vis:
            vis.add(e); lz.append(pt(e)); sig = [n for n in ady[e] if n != prev]
            prev, e = e, (sig[0] if sig else e0)
        if len(lz) > 8: lazos.append(lz)
    return lazos

def _simple(lz, tol=.025):
    """Quita puntos casi alineados (codicioso) en un lazo cerrado."""
    out, i, n = [lz[0]], 0, len(lz)
    while i < n - 1:
        j = i + 2
        while j <= n:
            (ax, az), (bx, bz) = lz[i], lz[j % n]; L = math.hypot(bx - ax, bz - az) or 1e-9
            if any(abs((bx - ax) * (lz[k][1] - az) - (bz - az) * (lz[k][0] - ax)) / L > tol for k in range(i + 1, j)): break
            j += 1
        i = j - 1
        if i < n: out.append(lz[i])
    return out

def red(lineas, discos=(), k=.9, cortes=(), y=None, paso=.12, n='sendero', m='laja'):
    """Une los caminitos [(pts, ancho, vaiven, seed)] y los discos [(x, z, r)] en una forma con uniones suaves (smooth-min k).
    cortes: [(nx, nz, c)] quita lo que cumpla nx·x + nz·z < c (remates rectos en la plaza y la puerta). Regresa las líneas centrales."""
    y = YS + .05 if y is None else y; lns = [_linea(*l) for l in lineas]
    xa = min(p[0] for l in lns for p in l) - 3; xb = max(p[0] for l in lns for p in l) + 3
    za = min(p[1] for l in lns for p in l) - 3; zb = max(p[1] for l in lns for p in l) + 3
    for x, z, r in discos: xa, xb, za, zb = min(xa, x - r - 2), max(xb, x + r + 2), min(za, z - r - 2), max(zb, z + r + 2)
    xs, zs = np.arange(xa, xb, paso), np.arange(za, zb, paso); X, Z = np.meshgrid(xs, zs)
    f = None
    for ln in lns: d = _dist(X, Z, ln); f = d if f is None else _smin(f, d, k)
    for x, z, r in discos: f = _smin(f, np.hypot(X - x, Z - z) - r, k)
    for nx, nz, c in cortes: f = np.maximum(f, c - (nx * X + nz * Z))
    f[0, :] = f[-1, :] = f[:, 0] = f[:, -1] = 1.0
    bm = M(n, m, prio=.5)
    for lz in _contornos(f, xs, zs):
        s = _simple(lz)
        if len(s) > 3: P.plano(bm, s, y)
    return [[(x, z) for x, z, _ in l] for l in lns]

# ---------- pasto con hojas ----------
def _crc(pts, n):
    """Curva Catmull-Rom cerrada."""
    q = [pts[-1]] + list(pts) + [pts[0], pts[1]]; out = []
    for i in range(1, len(q) - 2):
        p0, p1, p2, p3 = q[i - 1], q[i], q[i + 1], q[i + 2]
        for k in range(n):
            t = k / n; t2, t3 = t * t, t * t * t
            out.append(tuple(.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                                   + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in (0, 1)))
    return out

def _gota(cx, cz, rx, rz, ang, R, k=9, irr=.28, n=4):
    ca, sa = math.cos(ang), math.sin(ang); pts = []
    for i in range(k):
        a = i * 2 * math.pi / k + R.uniform(-.2, .2); f = 1 + R.uniform(-irr, irr)
        u, v = math.cos(a) * rx * f, math.sin(a) * rz * f; pts.append((cx + u * ca - v * sa, cz + u * sa + v * ca))
    return _crc(pts, n)

def mancha(cx, cz, rx, rz, ang=0.0, seed=1, islas=6):
    """Pasto con hojas (material 'pasto': el juego siembra las matas) de orilla irregular, con islitas sueltas alrededor
    para que la orilla se deshaga. Va un poco encima del pasto liso (mismo color y textura en el juego)."""
    R, bm, y = random.Random(seed), M('pasto', 'pasto', prio=.25), YS + .012
    g = _gota(cx, cz, rx, rz, ang, R); P.plano(bm, g, y); ya = [g]
    ca, sa = math.cos(ang), math.sin(ang)
    for i in range(islas * 4):      # islitas que no se enciman con nada (dos caras en el mismo plano se manchan al hornear)
        if len(ya) > islas: break
        a = R.uniform(0, 2 * math.pi); f = R.uniform(1.15, 1.6); u, v = math.cos(a) * rx * f, math.sin(a) * rz * f
        r = R.uniform(.5, 1.1); h = _gota(cx + u * ca - v * sa, cz + u * sa + v * ca, r, r * R.uniform(.6, 1), R.uniform(0, 3), R, 6, .2, 2)
        if not any(_dentro(p, q) or _dentro(q[0], h) for q in ya for p in h): P.plano(bm, h, y); ya.append(h)

def _dentro(p, pol):
    x, z, d = p[0], p[1], False
    for (ax, az), (bx, bz) in zip(pol, pol[1:] + pol[:1]):
        if (az > z) != (bz > z) and x < ax + (z - az) * (bx - ax) / (bz - az): d = not d
    return d

# ---------- vegetación en manchas ----------
HOJAS = None
def _hojas():
    global HOJAS
    if HOJAS is None: HOJAS = [PAL['hoja'], lin('#5f8a46'), lin('#45703f'), lin('#6c8f4c')]
    return HOJAS
FLORES = ('mag', 'amarillo', 'blanco', 'rosa', 'lona', 'naranja')

def arbusto(x, z, s, R, col=None):
    """Arbusto redondo de una bola (80 triángulos); los grandes, un poco aplastados y anchos."""
    fa, c = FA(), col or osc(R.choice(_hojas()), R.uniform(.88, 1.06))
    pieza(fa, c, ico, x, SUELO(x, z) + .42 * s, z, .62 * s * (1.15 if s > .95 else 1), 1, .8 if s <= .95 else .7)

def flores(x, z, s, R, col=None):
    """Mata baja con flores de un solo color encima."""
    fa = FA(); col = col or PAL[R.choice(FLORES)]
    pieza(fa, osc(R.choice(_hojas()), R.uniform(.9, 1.05)), ico, x, SUELO(x, z) + .18 * s, z, .5 * s, 1, .55)
    for i in range(3):
        a = i * 2.1 + R.uniform(-.4, .4); r = R.uniform(.12, .3) * s
        pieza(fa, osc(col, R.uniform(.9, 1.05)), ico, x + math.cos(a) * r, SUELO(x, z) + .4 * s - r * .35, z + math.sin(a) * r, .13 * s, 0)

def macizo(x, z, ux, uz, largo, seed, e=1.0, muro=0.0):
    """Mancha de vegetación a lo largo de (ux, uz): arbustos, a veces agave y flores (e: escala). muro: a qué distancia queda
    un muro del lado (−uz, ux) — ahí, a veces, un plátano pegado que da altura."""
    R = random.Random(seed); px, pz = -uz, ux; n = max(2, int(largo / (1.1 * e)))
    for i in range(n):
        t = (i + .5) / n - .5; j = R.uniform(-.35, .35) * e; cx, cz = x + ux * t * largo + px * j, z + uz * t * largo + pz * j
        r = R.random()
        if r < .55: arbusto(cx, cz, R.uniform(.75, 1.25) * e, R)
        elif r < .78: agave(cx, cz, R.uniform(.7, 1.0) * e, y0=SUELO(cx, cz), col=osc(PAL['agave'], R.uniform(.9, 1.05)))
        else: flores(cx, cz, R.uniform(.8, 1.1) * e, R)
    if muro and R.random() < .45:
        t = R.uniform(-.3, .3); platano(x + ux * t * largo + px * (muro - .9), z + uz * t * largo + pz * (muro - .9), R, R.uniform(2.4, 3.0))

# ---------- rincón de dominó ----------
def mesa_domino(x, z, ang=0.0, fichas=False):
    """Mesita cuadrada de concreto con cuatro bancos (mesa a 1.55 y asiento a 0.95, como las del juego)."""
    c = lin('#d3cdc0'); s = osc(c, .86); Y0 = SUELO(x, z)
    def arma():
        fa = FA()
        pieza(fa, s, caja_o, x - .28, x + .28, Y0, Y0 + 1.43, z - .28, z + .28, (2,))
        pieza(fa, c, caja_o, x - .75, x + .75, Y0 + 1.43, Y0 + 1.55, z - .75, z + .75)
        for dx, dz in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            bx, bz = x + dx * 1.45, z + dz * 1.45; lx, lz = (.21, .65) if dx else (.65, .21)
            pieza(fa, s, caja_o, bx - .14, bx + .14, Y0, Y0 + .85, bz - .14, bz + .14, (2,))
            pieza(fa, c, caja_o, bx - lx, bx + lx, Y0 + .85, Y0 + .95, bz - lz, bz + lz)
        if fichas:
            R = random.Random(int(x * 7 + z))
            for i in range(6):
                fx, fz = x + R.uniform(-.45, .45), z + R.uniform(-.45, .45); a, b = (.07, .14) if i % 2 else (.14, .07)
                pieza(fa, PAL['blanco'], caja_o, fx - a, fx + a, Y0 + 1.55, Y0 + 1.59, fz - b, fz + b, (2,))
    girado(ang, x, z, arma)
    ex_obs(NOMB + '_fachadas', x, z, 1.7)

# ---------- albarradas ----------
def albarrada(pts, seed, ah=.7):
    """Murete bajo de piedra seca que sigue una curva: tramos de ~0.5 con su propio tono, corona dispareja y piedras sueltas
    encima, en las dos orillas. Choques redondos a lo largo."""
    R, fa = random.Random(seed), FA(); c = _cr(pts, 6); L = [0.0]
    for a, b in zip(c, c[1:]): L.append(L[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    n = max(2, int(L[-1] / .5)); base = lin('#b4ae9f')
    def en(s):
        i = max(0, min(len(L) - 2, next((k for k in range(len(L) - 1) if L[k + 1] >= s), len(L) - 2)))
        t = (s - L[i]) / ((L[i + 1] - L[i]) or 1); (x0, z0), (x1, z1) = c[i], c[i + 1]; l = math.hypot(x1 - x0, z1 - z0) or 1
        return x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, -(z1 - z0) / l, (x1 - x0) / l
    sec = []
    for i in range(n + 1):
        x, z, nx, nz = en(L[-1] * i / n); h = ah + R.uniform(-.13, .1); jb, jt = R.uniform(-.06, .06), R.uniform(-.07, .05)
        sec.append([(x + nx * (.36 + jb) * s, z + nz * (.36 + jb) * s) for s in (1, -1)] + [(x + nx * (.2 + jt) * s, z + nz * (.2 + jt) * s) for s in (1, -1)] + [h, SUELO(x, z)])
    def tramo(bm, a, b, om):
        q = []
        for e in (a, b):
            for k, yy in ((0, e[5] - .02), (2, e[5] + e[4])):
                for lado in (0, 1): q.append(V(e[k + lado][0], yy, e[k + lado][1]))
        vs = [bm.verts.new(p) for p in q]
        for k, f in enumerate(P.CARAS):
            if k not in om: bm.faces.new([vs[j] for j in f])
    for i in range(n):
        om = (2,) + ((0,) if i else ()) + ((1,) if i < n - 1 else ())
        pieza(fa, osc(base, R.uniform(.72, 1.06)), tramo, sec[i], sec[i + 1], om)
    for i in range(int(L[-1] * 1.2)):
        s = R.uniform(.2, L[-1] - .2); x, z, nx, nz = en(s); j = R.choice((-1, 1)) * R.uniform(.08, .2); h = sec[round(n * s / L[-1])][4]
        pieza(fa, osc(base, R.uniform(.7, 1.1)), ico, x + nx * j, SUELO(x, z) + h - .02, z + nz * j, R.uniform(.15, .25), 0, .65)
    for i in range(int(L[-1] / .9) + 1):
        x, z, _, _ = en(L[-1] * i / max(1, int(L[-1] / .9))); ex_obs(NOMB + '_fachadas', x, z, .42)

# ---------- huerto ----------
def milpa(x0, x1, z0, z1, R):
    """Matas de maíz en surcos: caña, dos hojas y la espiga."""
    fa, ca, ho = FA(), lin('#7f9a4e'), lin('#6f9446')
    for x in np.arange(x0, x1 + .01, .75):
        for z in np.arange(z0, z1 + .01, .7):
            x_, z_ = x + R.uniform(-.12, .12), z + R.uniform(-.12, .12); h = R.uniform(2.3, 2.9); g = SUELO(x_, z_)
            pieza(fa, ca, P.viga, (x_, g, z_), (x_, g + h, z_), .05)
            for k in range(2):      # hojas largas que suben y se doblan
                a = R.uniform(0, 6.3) + k * 3.1; y = g + h * (.35 + .25 * k); ca_, sa_ = math.cos(a), math.sin(a); c = osc(ho, R.uniform(.88, 1.08))
                m = (x_ + ca_ * .45, y + .45, z_ + sa_ * .45)
                pieza(fa, c, P.viga, (x_, y, z_), m, .13, .015); pieza(fa, c, P.viga, m, (x_ + ca_ * .95, y + .1, z_ + sa_ * .95), .1, .015)
            pieza(fa, PAL['dorado'], P.viga, (x_, g + h, z_), (x_ + .05, g + h + .3, z_), .03)

def platano(x, z, R, h=2.7):
    """Mata de plátano: tallo grueso y seis hojas grandes arqueadas, con un racimo."""
    fa, ho = FA(), lin('#73a04e'); g = SUELO(x, z)
    pieza(fa, lin('#8d9a62'), P.tubo, (x, g, z), (x, g + h, z), .2, .14, 6)
    for k in range(6):
        a = k * 1.05 + R.uniform(-.25, .25); ca, sa = math.cos(a), math.sin(a)
        m = (x + ca * .9, g + h + .55, z + sa * .9); p = (x + ca * 1.9, g + h + .05, z + sa * 1.9)
        c = osc(ho, R.uniform(.88, 1.06))
        pieza(fa, c, P.viga, (x, g + h - .1, z), m, .36, .02); pieza(fa, c, P.viga, m, p, .3, .02)
    pieza(fa, lin('#6f8a3c'), ico, x + .25, g + h - .5, z, .22, 0, 1.4)

def cama(x0, x1, z0, z1, R, tipo):
    """Cama de hortalizas: bordo de block y tierra; 'chile' (matitas con chiles rojos) o 'verdura' (rosetas)."""
    fa, g = FA(), SUELO((x0 + x1) / 2, (z0 + z1) / 2)
    pieza(fa, PAL['gris'], caja_o, x0, x1, g, g + .3, z0, z1, (2,))
    pieza(fa, lin('#5d4838'), caja_o, x0 + .1, x1 - .1, g + .3, g + .33, z0 + .1, z1 - .1, (2,))
    nx = max(1, int((x1 - x0 - .3) / .55)); nz = max(1, int((z1 - z0 - .3) / .55))
    for i in range(nx):
        for j in range(nz):
            x, z = x0 + .15 + (i + .5) * (x1 - x0 - .3) / nx, z0 + .15 + (j + .5) * (z1 - z0 - .3) / nz
            if tipo == 'chile':
                pieza(fa, osc(lin('#4f7a3a'), R.uniform(.9, 1.1)), ico, x, g + .55, z, .24, 0, .9)
                if R.random() < .6: pieza(fa, PAL['lona'], ico, x + R.uniform(-.15, .15), g + .5, z + R.uniform(-.15, .15), .06, 0, 1.8)
            else:
                pieza(fa, osc(lin('#7fa957'), R.uniform(.9, 1.08)), ico, x, g + .42, z, .2, 0, .55)

def huerto(seed=5):
    """Huerto junto a la puerta trasera (al poniente, entre la barda de la casona y el caminito): plátanos al fondo,
    milpa, una cama de chiles y otra de verduras; la albarrada lo cierra con una entrada hacia el camino."""
    R = random.Random(seed)
    platano(1.7, 49.1, R); platano(3.0, 50.4, R, 2.4)
    milpa(4.4, 6.6, 48.7, 50.8, R)
    cama(7.6, 12.6, 48.5, 49.4, R, 'chile'); cama(7.6, 12.6, 49.9, 50.8, R, 'verdura')
    albarrada([(13.7, 48.25), (13.6, 50.4), (11.4, 51.45)], seed + 1)
    albarrada([(9.6, 51.65), (5.2, 51.85), (1.6, 51.0), (.45, 48.3)], seed + 2)

# ---------- lomas (relieve suave del jardín; no color) ----------
# alto(x, z): ruido suave de 2 octavas (lomas cada ~15 m, hasta ~0.5), en 0 con transición de 2.5 m cerca de muros, bardas, casona,
# traspatio, cancha, plaza e iglesia, andador, huerto, caminitos y manchas de pasto con hojas (así nada queda enterrado ni flotando).
# Todo lo que va sobre el pasto usa SUELO(x, z). El juego recibe la rejilla de alturas en los extras de <nom>_pasto_c (CCALLE.alto).
LOM = dict(caja=(-51, 22, 86, 78), rects=[], lineas=[], discos=[], gotas=[], cache={})

def _hash(i, j, k): return (math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453) % 1.0

def _vn(x, z, s, k):
    gx, gz = x / s, z / s; i, j = math.floor(gx), math.floor(gz); fx, fz = gx - i, gz - j
    fx, fz = fx * fx * (3 - 2 * fx), fz * fz * (3 - 2 * fz)
    a, b, c, d = _hash(i, j, k), _hash(i + 1, j, k), _hash(i, j + 1, k), _hash(i + 1, j + 1, k)
    return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz

def _ss(a, b, t): t = min(1.0, max(0.0, (t - a) / (b - a))); return t * t * (3 - 2 * t)

def _dseg(x, z, ln):
    d = 1e9
    for (ax, az), (bx, bz) in zip(ln, ln[1:]):
        ex, ez = bx - ax, bz - az; L2 = ex * ex + ez * ez or 1e-9; t = min(1.0, max(0.0, ((x - ax) * ex + (z - az) * ez) / L2))
        d = min(d, math.hypot(x - ax - t * ex, z - az - t * ez))
    return d

def alto(x, z, T=2.5):
    k = (round(x, 2), round(z, 2))
    if k in LOM['cache']: return LOM['cache'][k]
    x0, z0, x1, z1 = LOM['caja']; d = min(x - x0, x1 - x, z - z0, z1 - z) - 1.0
    for a, b, c, e, m in LOM['rects']: d = min(d, math.hypot(max(a - x, 0, x - c), max(b - z, 0, z - e)) - m)
    for cx, cz, r in LOM['discos']: d = min(d, math.hypot(x - cx, z - cz) - r)
    for ln, hw, bb in LOM['lineas']:
        if bb[0] - hw - T < x < bb[2] + hw + T and bb[1] - hw - T < z < bb[3] + hw + T: d = min(d, _dseg(x, z, ln) - hw)
    for cx, cz, rx, rz, ang in LOM['gotas']:
        ca, sa = math.cos(ang), math.sin(ang); u, v = (x - cx) * ca + (z - cz) * sa, -(x - cx) * sa + (z - cz) * ca
        d = min(d, (math.hypot(u / rx, v / rz) - 1.7) * min(rx, rz))
    h = 0.0
    if d > 0:
        n = .65 * _vn(x + 300, z + 300, 15, 1) + .35 * _vn(x + 300, z + 300, 6.5, 2)
        h = round(.55 * _ss(.3, .82, n) * _ss(0, T, d), 3)
    LOM['cache'][k] = h; return h

def SUELO(x, z): return YS + alto(x, z)

def lomas_planas(rects=(), lineas=(), discos=(), gotas=()):
    """Zonas que se quedan planas: rects [(x0, z0, x1, z1, margen)], lineas [(puntos, medio ancho)], discos [(x, z, r)], gotas como mancha()."""
    LOM['rects'] += list(rects); LOM['discos'] += list(discos); LOM['gotas'] += list(gotas); LOM['cache'].clear()
    for ln, hw in lineas:
        LOM['lineas'].append((ln, hw, (min(p[0] for p in ln), min(p[1] for p in ln), max(p[0] for p in ln), max(p[1] for p in ln))))

def suelo_lomas(huecos, paso=2.0):
    """Pasto liso del jardín con lomas: rejilla de ~2 m (con las orillas de los huecos como líneas de la rejilla); las celdas planas
    seguidas se juntan en un solo cuadro. Exporta la rejilla de alturas (cm) en los extras de <nom>_pasto_c."""
    x0, z0, x1, z1 = LOM['caja']; bm = M('pasto_c', 'pasto_c', prio=.25)
    xs = sorted({round(v, 3) for v in list(np.arange(x0, x1, paso)) + [x1] + [r[k] for r in huecos for k in (0, 2) if x0 < r[k] < x1]})
    zs = sorted({round(v, 3) for v in list(np.arange(z0, z1, paso)) + [z1] + [r[k] for r in huecos for k in (1, 3) if z0 < r[k] < z1]})
    VS = {}
    def vt(x, z):
        if (x, z) not in VS: VS[(x, z)] = bm.verts.new(V(x, YS + alto(x, z), z))
        return VS[(x, z)]
    def cara(vs):
        f = bm.faces.new(vs); f.normal_update()
        if f.normal.z < 0: f.normal_flip()
    hueco = lambda x, z: any(r[0] <= x <= r[2] and r[1] <= z <= r[3] for r in huecos)
    for za, zb in zip(zs, zs[1:]):
        run = None
        for xa, xb in list(zip(xs, xs[1:])) + [(None, None)]:
            k = None
            if xa is not None and not hueco((xa + xb) / 2, (za + zb) / 2):
                k = 'plano' if not any(alto(x, z) for x in (xa, xb) for z in (za, zb)) else 'loma'
            if run and k == 'plano': run[1] = xb; continue
            if run: cara([vt(run[0], za), vt(run[1], za), vt(run[1], zb), vt(run[0], zb)]); run = None
            if k == 'plano': run = [xa, xb]
            elif k == 'loma':
                a, b, c, d = vt(xa, za), vt(xb, za), vt(xb, zb), vt(xa, zb)      # dos triángulos por la diagonal más corta en alto
                if abs(alto(xa, za) - alto(xb, zb)) <= abs(alto(xb, za) - alto(xa, zb)): cara([a, b, c]); cara([a, c, d])
                else: cara([a, b, d]); cara([b, c, d])
    nx, nz = int(math.ceil((x1 - x0) / paso)) + 1, int(math.ceil((z1 - z0) / paso)) + 1
    v = [int(round(alto(x0 + i * paso, z0 + j * paso) * 100)) for j in range(nz) for i in range(nx)]
    P.ex(NOMB + '_pasto_c', alto=dict(x0=x0, z0=z0, paso=paso, nx=nx, nz=nz, v=v))
