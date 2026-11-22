# blender/casona_pb.py — Planta baja detallada de la casona (CASONA.md pasos 3a y 3b) con luz horneada.
# Toma la distribución de blender/casona.py (NIV['n0']) y la convención de marcadores que lee MARC (c_casa_marcas.js).
# 3a: salón, zaguán y comedor a 5.5: pasta con cenefa, muros de barro con lambrín, ventanas con persianas y reja, arcos de
#     cantera, tapetes, mecedoras, trinchador, banca, portón y arbotantes. 3b: corredores con arquería sobre columnas, patio sin
#     techo con laja, árbol en su arriate, macetones y hamaca (la gata la pone el juego en el empty gata_n0). Resto: cuartos lisos.
# Cada tramo conexo de muro es una malla por material con extras {linea} (el corte los esconde juntos) y el cuerpo lleva
# {segs:[ax,az,bx,bz,...], r} (coords de three); columnas y muebles {obs:[x,z,r,...]}. UV0 en metros, UV1 = luz horneada.
# Exporta modelos/casona/pb.glb y pb_luz.webp (c_casona_mat.js los arma). Sin tocar el archivo abierto:
#   blender -b --factory-startup --python blender/casona_pb.py -- vista [carpeta]      (renders de revisión, sin hornear)
#   blender -b --factory-startup --python blender/casona_pb.py -- hornear [res] [muestras]
import bpy, bmesh, math, os, sys, types
from mathutils import Vector, Matrix

def _raiz():   # carpeta del repo: junto a este archivo, o la carpeta actual (blender.exe se corre desde el repo)
    for d in ([os.path.dirname(os.path.dirname(os.path.abspath(__file__)))] if '__file__' in globals() else []) + [os.getcwd()]:
        if os.path.isfile(os.path.join(d, 'blender', 'casona.py')): return d
    raise SystemExit('correr blender.exe desde la carpeta del repo')
DIR = _raiz()
C = types.ModuleType('casona'); C.__file__ = os.path.join(DIR, 'blender', 'casona.py'); exec(open(os.path.join(DIR, 'blender', 'casona.py'), encoding='utf-8').read(), C.__dict__)
N = C.NIV['n0']
SAL = os.path.join(DIR, 'modelos', 'casona')
K = dict(H=N['H'], t=C.K['t'], LAM=1.3, ROD=.1, PUERTA=C.K['puerta'], SILL=.5, TOP=4.2, SPRING=3.1, COL=.52, RES=2048, SAMPLES=1000)
ARCOS = dict(zaguan=4.6, patio=4.6, salon=4.8, comedor=4.8)      # vanos con arco: altura de la clave
LLEGADA = (18.5, 3.5)                                             # llegas por el zaguán
GATA = (10.2, 23.8, math.pi / 2)                                  # junto a la hamaca, mirando al patio
ARBOL = (20.8, 25.6, 3.4)
COLOR = dict(muro=(.72, .45, .3), lambrin=(.12, .26, .19), rod=(.85, .8, .68), cantera=(.8, .7, .55), pasta=(.78, .72, .6),
             cenefa=(.55, .38, .3), mosaico=(.7, .62, .52), corredor=(.75, .6, .45), laja=(.64, .61, .55), pasto=(.3, .45, .22),
             cuarto=(.8, .77, .7), techo=(.8, .74, .62), madera=(.3, .18, .1), bejuco=(.75, .6, .38), porton=(.32, .2, .12),
             persiana=(.18, .36, .26), hierro=(.05, .05, .05), tapete=(.5, .2, .15), hamaca=(.7, .35, .3), tronco=(.35, .25, .18),
             copa=(.24, .4, .18), barro=(.6, .32, .2), escalon=(.62, .36, .24), calle=(.35, .35, .37), banqueta=(.62, .6, .56),
             barda=(.78, .7, .58), arbotante=(1, .8, .5), farol=(1, .78, .45), mesa=(.25, .15, .08))
EMITE = dict(arbotante=6, farol=8)
PRIO = {}            # escala de la isla en el mapa de luz (menos texeles para lo que casi no se ve)
# por material: muros y arcos con más texeles (se veían borrosos); techos con menos. Las caras exteriores del lote (hacia los
# vecinos) no se ven: casi sin texeles. El margen fijo del empaque dobla lo que se aprovecha del mapa (24% -> 51%).
PRIO_MAT = dict(muro=1.4, cantera=1.4, lambrin=1.4, techo=.5)
MUROS = ('muro', 'lambrin', 'cantera', 'cenefa', 'barda')   # piezas que se meten unas en otras (ver _dentro)
FUERA = .1

def V(x, y, z): return Vector((x - 18, z - 17, y))        # plano (x, alto, z) -> Blender
def VB(v): return Vector((v[0], v[2], v[1]))               # vector del plano -> Blender
def T(x, z): return [round(x - 18, 3), round(17 - z, 3)]  # plano -> three (x, z)

# ---------- mallas por nombre (un material cada una) ----------
B, SIN_LUZ, EMP = {}, set(), []
def bmn(n, m, recalc=True, uv=True, luz=True, prio=1.0):
    if n not in B:
        B[n] = dict(bm=bmesh.new(), mat=m, ex={}, recalc=recalc, uv=uv)
        if not luz: SIN_LUZ.add(n)
        if prio != 1: PRIO[n] = prio
    return B[n]['bm']
def ex(n, **kv):
    d = B[n]['ex']
    for k, v in kv.items():
        if k in ('segs', 'obs'): d.setdefault(k, []).extend(v)
        else: d[k] = v
def vacio(nombre, x, y, z, **kv): EMP.append((nombre, (x, y, z), kv))

CARAS = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
def caja(bm, x0, x1, y0, y1, z0, z1):
    vs = [bm.verts.new(V(x, y, z)) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]
    for f in CARAS: bm.faces.new([vs[i] for i in f])
def bloqueB(bm, c, a, b, d):
    vs = [bm.verts.new(c + i * a + j * b + k * d) for i in (-1, 1) for j in (-1, 1) for k in (-1, 1)]
    for f in CARAS: bm.faces.new([vs[q] for q in f])
def bloque(bm, c, a, b, d): bloqueB(bm, V(*c), VB(a), VB(b), VB(d))
def viga(bm, A, Bp, w, w2=None):
    a, b = V(*A), V(*Bp); d = (b - a) / 2
    n1 = d.cross(Vector((0, 0, 1)))
    if n1.length < 1e-6: n1 = d.cross(Vector((1, 0, 0)))
    n1.normalize(); n2 = d.cross(n1).normalized()
    bloqueB(bm, (a + b) / 2, d, n1 * w, n2 * (w2 or w))
def tubo(bm, A, Bp, r0, r1, n=12):
    a, b = V(*A), V(*Bp); d = (b - a).normalized()
    u = d.cross(Vector((0, 0, 1)))
    if u.length < 1e-6: u = Vector((1, 0, 0))
    u.normalize(); v = d.cross(u).normalized()
    ra = [bm.verts.new(a + r0 * (math.cos(2 * math.pi * i / n) * u + math.sin(2 * math.pi * i / n) * v)) for i in range(n)]
    rb = [bm.verts.new(b + r1 * (math.cos(2 * math.pi * i / n) * u + math.sin(2 * math.pi * i / n) * v)) for i in range(n)]
    for i in range(n):
        j = (i + 1) % n; bm.faces.new([ra[i], ra[j], rb[j], rb[i]])
    bm.faces.new(ra); bm.faces.new(rb[::-1])
def anillo(bm, cx, cz, r0, r1, y0, y1, n=32):
    R = [[bm.verts.new(V(cx + r * math.cos(2 * math.pi * i / n), y, cz + r * math.sin(2 * math.pi * i / n))) for i in range(n)]
         for r, y in ((r1, y0), (r1, y1), (r0, y1), (r0, y0))]
    for k in range(4):
        A, Bq = R[k], R[(k + 1) % 4]
        for i in range(n):
            j = (i + 1) % n; bm.faces.new([A[i], A[j], Bq[j], Bq[i]])
def plano(bm, pts, y, arriba=True):
    f = bm.faces.new([bm.verts.new(V(x, y, z)) for x, z in pts]); f.normal_update()
    if (f.normal.z < 0) == arriba: f.normal_flip()
    return f
def quad(n, m, x0, z0, x1, z1, y=0, arriba=True, prio=1.0):
    if x1 - x0 > .01 and z1 - z0 > .01: plano(bmn(n, m, recalc=False, prio=prio), [(x0, z0), (x1, z0), (x1, z1), (x0, z1)], y, arriba)
def disco(n, m, cx, cz, r, y, seg=40, uvr=None):
    bm = bmn(n, m, recalc=False, uv=uvr is None)
    f = plano(bm, [(cx + r * math.cos(2 * math.pi * i / seg), cz + r * math.sin(2 * math.pi * i / seg)) for i in range(seg)], y)
    if uvr:
        uv = bm.loops.layers.uv.verify()
        for lp in f.loops:
            c = lp.vert.co; lp[uv].uv = ((c.x + 18 - cx) / (2 * r) + .5, (c.y + 17 - cz) / (2 * r) + .5)

# en una línea de muro: u a lo largo, o perpendicular (e 'h': línea z=L; 'v': línea x=L)
def LP(e, L, u, y, o): return V(u, y, L + o) if e == 'h' else V(L + o, y, u)
def LT(e, L, u): return T(u, L) if e == 'h' else T(L, u)
def LV(e, d): return (d[0], d[1], d[2]) if e == 'h' else (d[2], d[1], d[0])
def caja_l(bm, e, L, u0, u1, y0, y1, o0, o1):
    if e == 'h': caja(bm, u0, u1, y0, y1, L + o0, L + o1)
    else: caja(bm, L + o0, L + o1, y0, y1, u0, u1)
def bloque_l(bm, e, L, c, a, b, d):
    cc = (c[0], c[1], L + c[2]) if e == 'h' else (L + c[2], c[1], c[0])
    bloque(bm, cc, LV(e, a), LV(e, b), LV(e, d))
def prisma(bm, e, L, poli, o0, o1):
    A = [bm.verts.new(LP(e, L, u, y, o0)) for u, y in poli]
    Bv = [bm.verts.new(LP(e, L, u, y, o1)) for u, y in poli]
    bm.faces.new(A); bm.faces.new(Bv[::-1])
    for i in range(len(poli)):
        j = (i + 1) % len(poli); bm.faces.new([A[i], A[j], Bv[j], Bv[i]])
def arco(c, r, s, n=16, a0=math.pi, a1=0.0):
    return [(c + r * math.cos(a0 + (a1 - a0) * i / n), s + r * math.sin(a0 + (a1 - a0) * i / n)) for i in range(1, n)]
def limpio(p):
    out = []
    for q in p:
        if not out or abs(out[-1][0] - q[0]) > 1e-4 or abs(out[-1][1] - q[1]) > 1e-4: out.append(q)
    if abs(out[0][0] - out[-1][0]) < 1e-4 and abs(out[0][1] - out[-1][1]) < 1e-4: out.pop()
    return out

# ---------- muros, vanos y bardas ----------
W, G, Wn = set(), set(), set()
def dv(e): return .012 if e == 'v' else 0   # tapas de los muros 'v' 1 cm abajo: sin caras coplanares en los cruces
def linea_de(e, L, u):
    l = round(L * 10)
    for (ee, ll, i0, i1) in C.tramos(W):
        if ee == e and ll == l and i0 <= u * 10 <= i1: return 'pb_muro_%s%d_%d' % (e, l, i0), '%s%d_%d' % (e, l, i0)
    raise ValueError('sin muro en %s %s %s' % (e, L, u))

def muros():
    t, H = K['t'], K['H']; h = t / 2
    for x, z, w, d, k, tin, n in N['areas']:
        if k is None: W.update(C.rect(x, z, w, d))
    W.update(C.rect(*N['per']))
    for g in N['gaps']: G.update(C.piezas(*g[:4]))
    for g in N['wins']: Wn.update(C.piezas(*g))
    clase = lambda e, l, i: 'g' if (e, l, i) in G else 'w' if (e, l, i) in Wn else 'f'
    def vano(e, l, a, b):
        for x0, z0, x1, z1, nm in N['gaps']:
            if e == 'h' and z0 == z1 and round(z0 * 10) == l and min(x0, x1) * 10 <= a + .5 and max(x0, x1) * 10 >= b - .5: return nm
            if e == 'v' and x0 == x1 and round(x0 * 10) == l and min(z0, z1) * 10 <= a + .5 and max(z0, z1) * 10 >= b - .5: return nm
    for (e, l, i0, i1) in C.tramos(W):
        L = l / 10; base = 'pb_muro_%s%d_%d' % (e, l, i0); lid = '%s%d_%d' % (e, l, i0)
        M, LA, RO = bmn(base, 'muro'), bmn(base + '_lam', 'lambrin'), bmn(base + '_rod', 'rod')
        sub, i = [], i0
        while i < i1:
            c = clase(e, l, i); j = i
            while j < i1 and clase(e, l, j) == c: j += 1
            sub.append((c, i, j)); i = j
        segs = []
        for c, a, b in sub:
            u0, u1 = a / 10, b / 10; e0 = h if a == i0 else 0; e1 = h if b == i1 else 0
            if c == 'f':
                caja_l(M, e, L, u0 - e0, u1 + e1, 0, H - dv(e), -h, h); segs += LT(e, L, u0) + LT(e, L, u1)
                z0, z1 = (h + .05 if e0 else 0), (h + .05 if e1 else 0)
                caja_l(LA, e, L, u0 - z0, u1 + z1, 0, K['LAM'] - dv(e) / 2, -h - .03, h + .03)
                caja_l(RO, e, L, u0 - z0, u1 + z1, K['LAM'] - dv(e) / 2, K['LAM'] + K['ROD'] - dv(e) / 2, -h - .05, h + .05)
            elif c == 'w': ventana(base, e, L, u0, u1, segs)
            else: puerta(base, e, L, u0, u1, vano(e, l, a, b))
        ex(base, linea=lid, segs=segs, r=round(h + .15, 3))
        for s in ('_lam', '_rod', '_can', '_per', '_rej'):
            if base + s in B: ex(base + s, linea=lid)
    Bd = C.rect(*N['barda']) - W
    for (e, l, i0, i1) in C.tramos(Bd):
        L, u0, u1 = l / 10, i0 / 10, i1 / 10; base = 'pb_muro_b%s%d_%d' % (e, l, i0); lid = 'b%s%d_%d' % (e, l, i0)
        caja_l(bmn(base, 'barda'), e, L, u0 - h, u1 + h, 0, C.K['barda'] - dv(e), -h, h)
        caja_l(bmn(base + '_rod', 'rod'), e, L, u0 - h - .05, u1 + h + .05, C.K['barda'] - dv(e), C.K['barda'] + .1 - dv(e), -h - .05, h + .05)
        ex(base, linea=lid, segs=LT(e, L, u0) + LT(e, L, u1), r=round(h + .15, 3)); ex(base + '_rod', linea=lid)

def ventana(base, e, L, u0, u1, segs):
    """Ventanal de fachada: antepecho bajo, parteluz, persianas abiertas hacia adentro y reja afuera."""
    assert e == 'h' and L == 0, 'solo hay ventanas en la fachada'
    t, H = K['t'], K['H']; h = t / 2; S, TP = K['SILL'], K['TOP']; f = .15; o = h + .04
    M, LA = bmn(base, 'muro'), bmn(base + '_lam', 'lambrin')
    CA, PE, RE = bmn(base + '_can', 'cantera'), bmn(base + '_per', 'persiana'), bmn(base + '_rej', 'hierro', luz=False)
    caja_l(M, e, L, u0, u1, 0, S, -h, h); caja_l(M, e, L, u0, u1, TP, H, -h, h); segs += LT(e, L, u0) + LT(e, L, u1)
    caja_l(LA, e, L, u0, u1, 0, S, -h - .03, h + .03)
    caja_l(CA, e, L, u0, u0 + f, S, TP, -o, o); caja_l(CA, e, L, u1 - f, u1, S, TP, -o, o); caja_l(CA, e, L, u0, u1, TP - f, TP, -o, o)
    caja_l(CA, e, L, u0 - .12, u1 + .12, S - .07, S + .03, -h - .14, h + .14)
    c = (u0 + u1) / 2; caja_l(CA, e, L, c - .13, c + .13, S, TP, -h, h)
    ang = math.radians(62)
    for a, b in ((u0 + f, c - .13), (c + .13, u1 - f)):
        lw = (b - a) / 2 - .02
        for hu, du in ((a, 1), (b, -1)):
            dx, do = du * math.cos(ang), math.sin(ang)
            bloque_l(PE, e, L, (hu + dx * lw / 2, (S + TP) / 2, h + .03 + do * lw / 2), (dx * lw / 2, 0, do * lw / 2),
                     (0, (TP - S) / 2 - .05, 0), (-do * .025, 0, dx * .025))
    ro = -(h + .1); nb = int((u1 - u0 - .2) / .17)
    for k in range(nb + 1):
        uu = u0 + .1 + k * (u1 - u0 - .2) / nb; caja_l(RE, e, L, uu - .015, uu + .015, S, TP, ro - .015, ro + .015)
    for yy in (S + .35, (S + TP) / 2, TP - .35): caja_l(RE, e, L, u0 + .04, u1 - .04, yy - .022, yy + .022, ro - .022, ro + .022)

def puerta(base, e, L, u0, u1, nm):
    t, H = K['t'], K['H'] - dv(e); h = t / 2; o = h + .04; f = .16
    M, CA = bmn(base, 'muro'), bmn(base + '_can', 'cantera')
    if nm in ARCOS:
        r = (u1 - u0) / 2; c = (u0 + u1) / 2; s = ARCOS[nm] - r
        prisma(M, e, L, limpio([(u0, H), (u0, s)] + arco(c, r, s, 18) + [(u1, s), (u1, H)]), -h, h)
        caja_l(CA, e, L, u0, u0 + f, 0, s, -o, o); caja_l(CA, e, L, u1 - f, u1, 0, s, -o, o)
        prisma(CA, e, L, limpio([(u0, s)] + arco(c, r, s, 18) + [(u1, s), (u1 - f, s)] + arco(c, r - f, s, 18, 0, math.pi) + [(u0 + f, s)]), -o, o)
        caja_l(CA, e, L, u0 - .06, u0 + f + .04, s - .14, s, -o - .03, o + .03); caja_l(CA, e, L, u1 - f - .04, u1 + .06, s - .14, s, -o - .03, o + .03)
    elif H > K['PUERTA']:
        P = K['PUERTA']; caja_l(M, e, L, u0, u1, P, H, -h, h)
        caja_l(CA, e, L, u0, u0 + f, 0, P, -o, o); caja_l(CA, e, L, u1 - f, u1, 0, P, -o, o); caja_l(CA, e, L, u0, u1, P - f, P, -o, o)

# ---------- patio: arquería, columnas, árbol ----------
def arqueria():
    s, cw, o = K['SPRING'], K['COL'] / 2, .25
    for e, L in (('h', 14), ('h', 30), ('v', 12), ('v', 24)):
        H = K['H'] - dv(e)
        cs = sorted({(cx if e == 'h' else cz) for cx, cz in C.COLS if (cz if e == 'h' else cx) == L})
        base = 'pb_dintel_%s%d' % (e, L * 10); lid = 'a%s%d' % (e, L * 10)
        p = [(cs[-1] + cw, H), (cs[0] - cw, H), (cs[0] - cw, s)]
        for c0, c1 in zip(cs, cs[1:]): p += [(c0 + cw, s)] + arco((c0 + c1) / 2, (c1 - c0) / 2 - cw, s, 18) + [(c1 - cw, s)]
        p += [(cs[-1] + cw, s)]
        prisma(bmn(base, 'muro'), e, L, limpio(p), -o, o)
        caja_l(bmn(base + '_cor', 'cantera'), e, L, cs[0] - cw - .12, cs[-1] + cw + .12, H - .24, K['H'] + .035 - dv(e), -o - .12, o + .12)
        ex(base, linea=lid); ex(base + '_cor', linea=lid)

def columnas():
    s = K['SPRING']; CO = bmn('pb_columnas', 'cantera'); obs = []
    for cx, cz in C.COLS:
        caja(CO, cx - .34, cx + .34, 0, .36, cz - .34, cz + .34)
        tubo(CO, (cx, .36, cz), (cx, s - .3, cz), .23, .2, 12)
        tubo(CO, (cx, s - .44, cz), (cx, s - .3, cz), .27, .27, 12)
        caja(CO, cx - .32, cx + .32, s - .3, s, cz - .32, cz + .32)
        obs += T(cx, cz) + [.45]
    ex('pb_columnas', obs=obs)

def arbol(nom, cx, cz, R, alto, n=5, prio=1.0):
    TR = bmn('pb_' + nom + '_tronco', 'tronco'); top = (cx + .15, alto, cz - .1)
    tubo(TR, (cx, 0, cz), top, .44, .3, 10)
    for k in range(n):
        a = k * 2 * math.pi / n + .4; rr = R * .55
        tubo(TR, top, (cx + math.cos(a) * rr, alto + 1.5 + .35 * (k % 2), cz + math.sin(a) * rr), .2, .08, 7)
    CP = bmn('pb_' + nom + '_copa', 'copa', prio=prio)
    blobs = [(0, 0, alto + 2.5, R * .56)] + [(math.cos(a) * R * .56, math.sin(a) * R * .56, alto + 1.9 + .4 * (k % 2), R * .47)
                                            for k, a in enumerate(i * 2 * math.pi / 7 + .2 for i in range(7))]
    for dx, dz, y, r in blobs:
        bmesh.ops.create_icosphere(CP, subdivisions=2, radius=r, matrix=Matrix.Translation(V(cx + dx, y, cz + dz)) @ Matrix.Diagonal((1, 1, .5, 1)))

def patio():
    x, z, R = ARBOL
    arbol('arbol', x, z, R, 3.0)
    anillo(bmn('pb_arriate', 'cantera'), x, z, 1.62, 1.92, 0, .48, 36)
    disco('pb_arriate_pasto', 'pasto', x, z, 1.64, .4, 36)
    ex('pb_arriate', obs=T(x, z) + [2.15])
    MA, HO = bmn('pb_macetas', 'barro'), bmn('pb_macetas_hojas', 'copa'); obs = []
    for mx, mz in ((13.3, 15.3), (22.7, 15.3), (13.3, 28.7)):
        tubo(MA, (mx, 0, mz), (mx, .85, mz), .38, .5, 14); anillo(MA, mx, mz, .42, .54, .85, .95, 14)
        for k in range(5):
            a = k * 2 * math.pi / 5; bmesh.ops.create_icosphere(HO, subdivisions=1, radius=.45,
                matrix=Matrix.Translation(V(mx + math.cos(a) * .32, 1.25 + .15 * (k % 2), mz + math.sin(a) * .32)) @ Matrix.Diagonal((1, 1, .8, 1)))
        obs += T(mx, mz) + [.7]
    ex('pb_macetas', obs=obs)

def hamaca():
    x0, x1, zc, yk = 8.15, 11.73, 22.0, 2.4
    bm = bmn('pb_hamaca', 'hamaca', recalc=False, uv=False); uv = bm.loops.layers.uv.verify()
    nu, nv = 20, 8; a, b = x0 + .55, x1 - .55; L = b - a; g, cuv = [], {}
    for i in range(nu + 1):
        u = i / nu; yc = 1.05 + .7 * (2 * u - 1) ** 2; w = .12 + .8 * math.sin(math.pi * u) ** .8; row = []
        for j in range(nv + 1):
            v = j / nv; vt = bm.verts.new(V(a + L * u, yc - .17 * (1 - (2 * v - 1) ** 2) * math.sin(math.pi * u), zc + (v - .5) * w))
            cuv[vt] = (u * L, v); row.append(vt)
        g.append(row)
    for i in range(nu):
        for j in range(nv):
            f = bm.faces.new([g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j + 1]]); f.normal_update()
            if f.normal.z < 0: f.normal_flip()
            for lp in f.loops: lp[uv].uv = cuv[lp.vert]
    CO = bmn('pb_hamaca_cuerda', 'rod')
    for xk, xe in ((x0, a), (x1, b)):
        for v in (-.06, 0, .06): viga(CO, (xk, yk, zc), (xe, 1.75, zc + v), .012)
    ex('pb_hamaca', segs=T(8.6, zc) + T(11.3, zc), r=.45)

# ---------- muebles del frente (3a) ----------
def mecedora(cx, cz, ang, MA, BE):
    fw = (math.sin(ang), -math.cos(ang)); rt = (-fw[1], fw[0])
    P = lambda lx, y, lz: (cx + rt[0] * lx + fw[0] * lz, y, cz + rt[1] * lx + fw[1] * lz)
    ry = lambda lz: .06 + .35 * lz * lz
    for sx in (-.36, .36):
        zs = [-.62 + i * 1.22 / 8 for i in range(9)]
        for z0, z1 in zip(zs, zs[1:]): viga(MA, P(sx, ry(z0), z0), P(sx, ry(z1), z1), .03, .045)
        viga(MA, P(sx, ry(.3), .3), P(sx, .8, .3), .035)
        viga(MA, P(sx, ry(-.32), -.32), P(sx, 1.85, -.56), .035)
        viga(MA, P(sx * 1.1, 1.1, -.4), P(sx * 1.1, 1.06, .38), .04)
        viga(MA, P(sx, .8, .32), P(sx * 1.1, 1.06, .34), .025)
    viga(MA, P(-.4, 1.85, -.56), P(.4, 1.85, -.56), .045)
    bloque(BE, P(0, .8, .02), (rt[0] * .36, 0, rt[1] * .36), (0, .025, 0), (fw[0] * .34, 0, fw[1] * .34))
    viga(BE, P(0, .95, -.36), P(0, 1.75, -.53), .34, .02)

def frente():
    MA, BE = bmn('pb_muebles', 'madera'), bmn('pb_muebles_bejuco', 'bejuco')
    mecedora(12.25, 7.3, math.radians(30), MA, BE); mecedora(14.25, 7.3, math.radians(-30), MA, BE)
    tubo(MA, (13.25, 0, 6.5), (13.25, .62, 6.5), .08, .06, 8); tubo(MA, (13.25, .6, 6.5), (13.25, .66, 6.5), .36, .36, 18)
    tubo(bmn('pb_jarron', 'barro'), (13.25, .66, 6.5), (13.25, 1.05, 6.5), .1, .16, 10)
    obs = T(12.25, 7.3) + [.75] + T(14.25, 7.3) + [.75] + T(13.25, 6.5) + [.45]
    # banca del zaguán
    caja(MA, 16.2, 16.78, .62, .7, 1.0, 2.7); caja(MA, 16.17, 16.24, .86, 1.56, 1.05, 2.65)
    for zz in (1.08, 2.62):
        caja(MA, 16.62, 16.7, 0, .62, zz - .04, zz + .04); caja(MA, 16.2, 16.28, 0, 1.56, zz - .04, zz + .04)
    segs = T(16.5, 1.15) + T(16.5, 2.55)
    # trinchador del comedor
    caja(MA, 35.15, 35.85, 0, 1.2, 2.2, 7.8); caja(MA, 35.08, 35.85, 1.2, 1.28, 2.1, 7.9)
    caja(MA, 35.74, 35.85, 1.28, 3.0, 2.4, 7.6); caja(MA, 35.4, 35.85, 3.0, 3.14, 2.3, 7.7)
    for zz in (2.4, 5.0, 7.6): caja(MA, 35.42, 35.85, 1.28, 3.0, zz - .05, zz + .05)
    for yy in (1.95, 2.5): caja(MA, 35.45, 35.84, yy, yy + .05, 2.45, 7.55)
    caja(BE, 35.12, 35.16, .15, 1.1, 2.35, 7.65)
    for zz in (3.2, 4.4, 6.2): tubo(bmn('pb_jarron', 'barro'), (35.5, 1.28, zz), (35.5, 1.68, zz), .12, .16, 10)
    segs += T(35.5, 2.3) + T(35.5, 7.7)
    ex('pb_muebles', obs=obs, segs=segs, r=.45)
    # portón del zaguán, abierto hacia adentro
    PO = bmn('pb_porton', 'porton'); a = math.radians(74); ps = []
    for hx, sg in ((17.1, 1), (19.9, -1)):
        dx, dz = sg * math.cos(a), math.sin(a); lw = 1.4
        bloque(PO, (hx + dx * lw / 2, 1.5, .2 + dz * lw / 2), (dx * lw / 2, 0, dz * lw / 2), (0, 1.5, 0), (-dz * .05, 0, dx * .05))
        ps += T(hx, .2) + T(hx + dx * lw, .2 + dz * lw)
    ex('pb_porton', segs=ps, r=.2)
    # tapetes redondos bajo las mesas de la crujía del frente
    for g, mx, mz, r, libre in N['mesas']:
        if g in ('continental', 'monopolydeal'): disco('pb_tapete_' + g, 'tapete', mx, mz, 3.1, .012, 48, uvr=True)

def traspatio():
    arbol('mamey', 6, 41, 2.6, 3.4, 4, prio=.5)
    CA = bmn('pb_traspatio', 'cantera', prio=.5)
    caja(CA, 31, 34, 0, 1.0, 35.4, 36.8); caja(CA, 31.2, 33.8, 1.0, 1.2, 35.6, 36.6)
    anillo(CA, 14, 44.6, .62, .9, 0, .95, 24)
    MA = bmn('pb_traspatio_madera', 'madera', prio=.5)
    for xx in (13.05, 14.95): caja(MA, xx - .07, xx + .07, .95, 2.6, 44.53, 44.67)
    caja(MA, 12.95, 15.05, 2.5, 2.62, 44.52, 44.68)
    ex('pb_traspatio', segs=T(31.5, 36.1) + T(33.5, 36.1), r=.85, obs=T(14, 44.6) + [1.1] + T(6, 41) + [.7])

# ---------- pisos, techos, escalera, luces ----------
def pisos():
    cen = .8
    for x, z, w, d, k, tin, n in N['areas']:
        if k == 'void': continue
        x1, z1 = x + w, z + d
        if n in ('salon', 'comedor'):
            quad('pb_piso_pasta', 'pasta', x + cen, z + cen, x1 - cen, z1 - cen)
            for a, b, c, e in ((x, z, x1, z + cen), (x, z1 - cen, x1, z1), (x, z + cen, x + cen, z1 - cen), (x1 - cen, z + cen, x1, z1 - cen)):
                quad('pb_piso_cenefa', 'cenefa', a, b, c, e)
        elif n == 'zaguan': quad('pb_piso_mosaico', 'mosaico', x, z, x1, z1)
        elif n.startswith('corredor'): quad('pb_piso_corredor', 'corredor', x, z, x1, z1)
        elif n == 'patio': quad('pb_piso_laja', 'laja', x, z, x1, z1)
        elif n == 'traspatio': quad('pb_piso_pasto', 'pasto', x, z, x1, z1, prio=.35)
        elif n == 'calle':
            quad('pb_piso_banqueta', 'banqueta', x, -1.6, x1, 0, prio=.5); quad('pb_piso_calle', 'calle', x, z, x1, -1.6, prio=.35)
        elif n == 'escalera':
            hx, hz, hw, hd = 1, 14, 6, 1.8
            for a, b, c, e in ((x, z, x1, hz), (x, hz + hd, x1, z1), (x, hz, hx, hz + hd), (hx + hw, hz, x1, hz + hd)): quad('pb_piso_cuarto', 'cuarto', a, b, c, e)
        else: quad('pb_piso_cuarto', 'cuarto', x, z, x1, z1)

def techos():
    for x, z, w, d, k, tin, n in N['areas']:
        if k is None or (k == 'open' and n.startswith('corredor')): quad('pb_techo', 'techo', x, z, x + w, z + d, K['H'] - .02, arriba=False, prio=.3)

def escalera():
    esc, ne = C.K['esc'], 8
    E = bmn('pb_escalera_sube', 'escalon')
    for s in range(ne): xa = 6.5 - .5 * (s + 1); caja(E, xa, xa + .5, 0, esc * (s + 1), 12.2, 14)
    ex('pb_escalera_sube', escalera='sube')
    vacio('escalera_sube_n0', 6.7, 0, 13.1, r=1.0, to='n1', pie=[.7, 0])
    E = bmn('pb_escalera_baja', 'escalon')
    for s in range(ne): xa = 6.5 - .5 * (s + 1); caja(E, xa, xa + .5, -3, -esc * (s + 1), 14, 15.8)
    caja(E, 1, 2.5, -3.1, -3, 14, 15.8)
    ex('pb_escalera_baja', escalera='baja')
    vacio('escalera_baja_n0', 6.7, 0, 14.9, r=1.0, to='nm1', pie=[.7, 0])

def marcas():
    for g in N['gaps']:
        if g[4]: vacio('puerta_%s_n0' % g[4], (g[0] + g[2]) / 2, 0, (g[1] + g[3]) / 2)
    for g, mx, mz, r, libre in N['mesas']:
        vacio('mesa_' + g, mx, 1.55, mz, juego=g, fam='f' if libre else C.FAM.get(g, 'k'), libre=libre, r=r)
    vacio('llegada_n0', LLEGADA[0], 0, LLEGADA[1])
    vacio('llegada_escalera_n0', 4, 0, 11.1)                       # paso 4: llegada desde otro nivel y planos "Ir a"
    vacio('plano_escalera_n0', 6.6, 2.7, 16.8, ry=0.0)
    vacio('plano_zaguan_n0', 20.8, 2.7, 8.6, ry=round(-math.pi / 2, 4))
    vacio('gata_n0', GATA[0], 0, GATA[1], ry=round(GATA[2], 4))

# arbotantes: (x, z, normal hacia el cuarto); se cuelgan de su línea de muro para que el corte los esconda con ella
ARB = [(7.25, 0, (0, 1)), (14.25, 0, (0, 1)), (4, 10, (0, -1)), (8.5, 10, (0, -1)), (0, 3, (1, 0)), (0, 7, (1, 0)),
       (22.75, 0, (0, 1)), (29.75, 0, (0, 1)), (27.5, 10, (0, -1)), (32.5, 10, (0, -1)),
       (9.5, 10, (0, 1)), (15, 10, (0, 1)), (26.5, 10, (0, 1)), (8, 17, (1, 0)), (8, 24.5, (1, 0)), (8, 31.5, (1, 0)),
       (28, 19, (-1, 0)), (28, 25, (-1, 0)), (28, 31, (-1, 0)), (12, 34, (0, -1)), (24, 34, (0, -1))]
LUCES = []   # (tipo, (x, y, z), energía, extra)
def lamparas():
    h = K['t'] / 2
    for x, z, (nx, nz) in ARB:
        e = 'h' if nx == 0 else 'v'; L, u = (z, x) if e == 'h' else (x, z)
        base, lid = linea_de(e, L, u); n = base + '_arb'; bm = bmn(n, 'arbotante', luz=False); ex(n, linea=lid)
        o = (nz if e == 'h' else nx)
        caja_l(bm, e, L, u - .15, u + .15, 3.0, 3.4, o * h, o * (h + .14)) if o > 0 else caja_l(bm, e, L, u - .15, u + .15, 3.0, 3.4, o * (h + .14), o * h)
        LUCES.append(('POINT', (x + nx * .55, 3.25, z + nz * .55), 70, .12))
    F = bmn('pb_farol', 'farol', luz=False); caja(F, 18.32, 18.68, 3.95, 4.45, 4.82, 5.18)
    HI = bmn('pb_farol_hierro', 'hierro', luz=False); caja(HI, 18.28, 18.72, 4.45, 4.52, 4.78, 5.22); caja(HI, 18.48, 18.52, 4.52, K['H'], 4.98, 5.02)
    LUCES.append(('POINT', (18.5, 4.2, 5), 260, .2))
    for g, mx, mz, r, libre in N['mesas']:
        if g in ('continental', 'monopolydeal'): LUCES.append(('SPOT', (mx, 5.15, mz), 1100, 0))
    for x, z in ((4, 13.5), (4, 19.5), (4, 28), (32, 16), (32, 25), (32, 31)): LUCES.append(('POINT', (x, 4.6, z), 110, .3))

def mat(n):
    m = bpy.data.materials.get(n)
    if m: return m
    m = bpy.data.materials.new(n)
    try: m.use_nodes = True
    except Exception: pass
    b = next(x for x in m.node_tree.nodes if x.type == 'BSDF_PRINCIPLED'); c = COLOR.get(n, (.7, .7, .7))
    b.inputs['Base Color'].default_value = (*c, 1); b.inputs['Roughness'].default_value = .9; m.diffuse_color = (*c, 1)
    if n in EMITE: b.inputs['Emission Color'].default_value = (*c, 1); b.inputs['Emission Strength'].default_value = EMITE[n]
    return m

def uv_metros(bm, veta=False):
    """UV0 en metros por la cara dominante. veta: la v (dirección de la veta en CMAT) va a lo largo de cada cara."""
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        n = f.normal
        for lp in f.loops:
            c = lp.vert.co
            lp[uv].uv = (c.x, c.y) if abs(n.z) > .7 else (c.y, c.z) if abs(n.x) > .7 else (c.x, c.z)
        if veta:
            us = [lp[uv].uv[0] for lp in f.loops]; vs = [lp[uv].uv[1] for lp in f.loops]
            if max(us) - min(us) > max(vs) - min(vs):
                for lp in f.loops: lp[uv].uv = (lp[uv].uv[1], lp[uv].uv[0])

def coleccion(n):
    c = bpy.data.collections.get(n)
    if c:
        for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    else: c = bpy.data.collections.new(n); bpy.context.scene.collection.children.link(c)
    return c

def crear(col):
    obs = []
    for n, d in B.items():
        bm = d['bm']
        if not bm.faces: bm.free(); continue
        if d['recalc']: bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        bm.normal_update()
        if d['uv']: uv_metros(bm, d['mat'] == 'madera')
        me = bpy.data.meshes.new(n); bm.to_mesh(me); bm.free(); me.materials.append(mat(d['mat']))
        o = bpy.data.objects.new(n, me); col.objects.link(o)
        for k, v in d['ex'].items(): o[k] = [round(q, 3) for q in v] if isinstance(v, list) else v
        if n not in SIN_LUZ: obs.append(o)
    for nombre, (x, y, z), kv in EMP:
        e = bpy.data.objects.new(nombre, None); e.empty_display_type = 'PLAIN_AXES'; e.location = V(x, y, z); col.objects.link(e)
        for k, v in kv.items(): e[k] = v
    return obs

def luces(sc):
    S = coleccion('horneado'); md = mat('mesa')
    for g, mx, mz, r, libre in N['mesas']:      # mesas de bulto solo para la sombra suave
        bm = bmesh.new(); tubo(bm, (mx, 1.41, mz), (mx, 1.55, mz), 2.2, 2.2, 32); tubo(bm, (mx, 0, mz), (mx, 1.41, mz), .35, .5, 12)
        me = bpy.data.meshes.new('px_' + g); bm.to_mesh(me); bm.free(); me.materials.append(md)
        S.objects.link(bpy.data.objects.new('px_' + g, me))
    for i, (tp, (x, y, z), E, r) in enumerate(LUCES):
        l = bpy.data.lights.new('l%d' % i, tp); l.energy = E; l.color = (1, .76, .48)
        if tp == 'SPOT': l.spot_size = math.radians(100); l.spot_blend = .85; l.shadow_soft_size = .5
        else: l.shadow_soft_size = r
        o = bpy.data.objects.new('l%d' % i, l); o.location = V(x, y, z); S.objects.link(o)
    sol = bpy.data.lights.new('sol', 'SUN'); sol.energy = 2.0; sol.color = (1, .86, .66); sol.angle = math.radians(3)
    so = bpy.data.objects.new('sol', sol); S.objects.link(so)
    d = Vector((.5, -.62, -.6)).normalized()   # en three: del frente a la izquierda hacia el fondo, bajando
    so.rotation_euler = Vector((d.x, -d.z, d.y)).to_track_quat('-Z', 'Y').to_euler()
    w = sc.world or bpy.data.worlds.new('cielo'); sc.world = w
    try: w.use_nodes = True
    except Exception: pass
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs[0].default_value = (.6, .72, .9, 1); bg.inputs[1].default_value = .55

def motor(sc):
    try: sc.render.engine = 'CYCLES'
    except TypeError as e: print('motor', e)
    try:
        p = bpy.context.preferences.addons['cycles'].preferences; p.compute_device_type = 'HIP'; p.get_devices()
        for d in p.devices: d.use = d.type == 'HIP'
        print('GPU:', [d.name for d in p.devices if d.use] or 'ninguna')
        sc.cycles.device = 'GPU'
    except Exception as e: print('sin GPU', e)
    try: sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    except Exception as e: print('vista', e)

def armar():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    sc = bpy.context.scene; motor(sc)
    muros(); arqueria(); columnas(); patio(); hamaca(); frente(); traspatio(); pisos(); techos(); escalera(); marcas(); lamparas()
    col = coleccion('pb'); obs = crear(col); luces(sc)
    print('pb: %d mallas, %d con luz, %d empties' % (len([o for o in col.objects if o.type == 'MESH']), len(obs), len(EMP)))
    return sc, col, obs

# ---------- revisión, horneado y exportación ----------
def vista(sc, ruta, cam, mira, ocultar=(), res=(960, 540), muestras=48, den=True):
    cd = bpy.data.cameras.new('cam'); cd.sensor_fit = 'VERTICAL'; cd.angle_y = math.radians(46)
    co = bpy.data.objects.new('cam', cd); sc.collection.objects.link(co); co.location = V(*cam)
    co.rotation_euler = (V(*mira) - V(*cam)).to_track_quat('-Z', 'Y').to_euler(); sc.camera = co
    esc = [o for o in bpy.data.objects if any(o.name.startswith(p) for p in ocultar)]
    for o in esc: o.visible_camera = False
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.resolution_percentage = 100
    sc.cycles.samples = muestras; sc.cycles.use_denoising = den; sc.render.filepath = ruta
    bpy.ops.render.render(write_still=True)
    for o in esc: o.visible_camera = True
    bpy.data.objects.remove(co, do_unlink=True)

def vistas(sc, carpeta):
    vista(sc, os.path.join(carpeta, 'pb_salon.png'), (9, 11, -6), (9, 0, 5), ('pb_muro_h0_', 'pb_techo'))
    vista(sc, os.path.join(carpeta, 'pb_patio.png'), (18, 12, 9), (18, 0, 22), ('pb_muro_h0_', 'pb_muro_h100_', 'pb_dintel_h140', 'pb_techo'))
    vista(sc, os.path.join(carpeta, 'pb_todo.png'), (18, 34, -16), (18, 0, 17), ('pb_muro_h0_', 'pb_techo'))

def uv_luz(obs):
    for o in obs:
        me = o.data
        if 'luz' not in me.uv_layers: me.uv_layers.new(name='luz')
        me.uv_layers.active = me.uv_layers['luz']
    bpy.ops.object.select_all(action='DESELECT')
    for o in obs: o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0, area_weight=0, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    for o in obs:
        s = PRIO.get(o.name, 1) * PRIO_MAT.get(o.data.materials[0].name if o.data.materials else '', 1)
        ly = o.data.uv_layers['luz'].data
        for p in o.data.polygons:
            c = o.matrix_world @ p.center; n = p.normal; x, z = c.x + 18, c.y + 17
            f = FUERA if (x < .05 and n.x < -.7) or (x > 35.95 and n.x > .7) or (z > 47.95 and n.y > .7) else 1
            if s * f != 1:
                for i in p.loop_indices: ly[i].uv = ly[i].uv * (s * f)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.pack_islands(rotate=True, margin_method='FRACTION', margin=.002, shape_method='CONCAVE')
    bpy.ops.object.mode_set(mode='OBJECT')
    for o in obs: o.data.uv_layers.active = o.data.uv_layers[0]

def _img(o_img, nodo_img):
    for o in o_img:
        for m in o.data.materials:
            nt = m.node_tree; t = nt.nodes.get('bake') or nt.nodes.new('ShaderNodeTexImage'); t.name = 'bake'; t.image = nodo_img; nt.nodes.active = t

def _sel(obs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in obs: o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]

def _pasadas(sc, img, muestras, sel, n=5):
    """Hornea en n pasadas con semilla distinta y las promedia (igual a una sola de 'muestras'); imprime el avance."""
    import numpy as np, time
    n = max(1, min(n, muestras)); acc = None; t0 = time.time()
    for k in range(n):
        sc.cycles.seed = k; sc.cycles.samples = muestras // n + (k < muestras % n)
        _sel(sel); bpy.ops.object.bake(type='DIFFUSE')
        a = np.empty(len(img.pixels), np.float32); img.pixels.foreach_get(a)
        acc = a if acc is None else acc + a
        t = time.time() - t0
        print('Horneado: %d%% (faltan ~%.1f min)' % (100 * (k + 1) // n, t / (k + 1) * (n - k - 1) / 60), flush=True)
    img.pixels.foreach_set(acc / n); img.update()

def _pix(i):
    import numpy as np
    w, h = i.size; a = np.empty(w * h * 4, dtype=np.float32); i.pixels.foreach_get(a); return a.reshape(h, w, 4)

def _pp(c, w):
    """Push-pull: cada texel sin peso toma el promedio de sus vecinos válidos más cercanos (pirámide 2x2)."""
    import numpy as np
    h, ww = w.shape
    if h <= 1 and ww <= 1: return c / max(float(w[0, 0]), 1e-8)
    if h % 2 or ww % 2:
        c = np.pad(c, ((0, h % 2), (0, ww % 2), (0, 0))); w = np.pad(w, ((0, h % 2), (0, ww % 2)))
    cs = c[0::2, 0::2] + c[1::2, 0::2] + c[0::2, 1::2] + c[1::2, 1::2]
    ws = w[0::2, 0::2] + w[1::2, 0::2] + w[0::2, 1::2] + w[1::2, 1::2]
    up = _pp(cs, ws).repeat(2, 0).repeat(2, 1)
    return np.where(w[..., None] > 0, c / np.maximum(w, 1e-8)[..., None], up)[:h, :ww]

def _islas(cara):
    """Etiqueta cada isla del atlas (texeles de cara conectados; entre islas hay ~4 px de fondo)."""
    import numpy as np
    h, w = cara.shape; lab = np.where(cara, np.arange(1, h * w + 1, dtype=np.int32).reshape(h, w), 0)
    for _ in range(4096):
        m = lab.copy()
        for ax in (0, 1):
            for d in (1, -1): m = np.maximum(m, np.roll(lab, d, ax))
        j = m.ravel(); m = np.where(cara, np.maximum(m, j[np.maximum(j - 1, 0)].reshape(h, w)), 0)   # salto: converge rápido
        if np.array_equal(m, lab): break
        lab = m
    return lab

def _rellenar(img, cara, den=None):
    """1) Texeles de muro metidos en otra pieza (den): la luz de sus vecinos de la MISMA isla (si toda la isla está tapada,
    se queda como salió). 2) Fondo del atlas: push-pull. Sin esto el negro se corre a las orillas con el quitarruido,
    el filtrado bilineal y los mipmaps (muros sucios en esquinas y uniones)."""
    import numpy as np
    a = _pix(img); c = a[:, :, :3]
    if den is not None and (den & cara).any():
        lab = _islas(cara); ok = cara & ~den
        for _ in range(64):
            falta = cara & ~ok
            if not falta.any(): break
            acc = np.zeros_like(c); n = np.zeros(ok.shape, np.float32)
            for ax in (0, 1):
                for d in (1, -1):
                    v = np.roll(ok, d, ax) & (np.roll(lab, d, ax) == lab)
                    acc += np.roll(c, d, ax) * v[..., None]; n += v
            nu = falta & (n > 0)
            if not nu.any(): break
            c[nu] = acc[nu] / n[nu][:, None]; ok |= nu
    a[:, :, :3] = _pp(c * cara[..., None], cara.astype(np.float32)); a[:, :, 3] = 1
    img.pixels.foreach_set(a.ravel()); img.update()

def _dentro(sc, obs, sel, res):
    """Máscara de texeles de muro metidos en otra pieza (la punta de un muro dentro del perpendicular): oclusión casi total."""
    import numpy as np
    mur = [o for o in sel if o.data.materials and o.data.materials[0] and o.data.materials[0].name in MUROS]
    if not mur: return None
    ao = bpy.data.images.new('pb_ao', res, res, float_buffer=True); ao.pixels.foreach_set(np.ones(res * res * 4, np.float32))
    _img(obs, ao); bk = sc.render.bake; ls = sc.world.light_settings; m0, d0 = bk.margin, ls.distance
    bk.margin = 0; bk.use_clear = False; ls.distance = .35; sc.cycles.samples = 64
    _sel(mur); bpy.ops.object.bake(type='AO')
    bk.margin = m0; bk.use_clear = True; ls.distance = d0
    m = _pix(ao)[:, :, 0] < .08
    m = m | np.roll(m, 1, 0) | np.roll(m, -1, 0) | np.roll(m, 1, 1) | np.roll(m, -1, 1)   # +1 texel: la orilla salía en dientes (ruido)
    print('dentro de otra pieza:', int(m.sum()), 'texeles', flush=True)
    return m

def hornear(sc, obs, res, muestras, solo=None, limpio=True):
    """Hornea la luz (directa + indirecta, sin color) en UV 'luz'. solo: hornear solo esas mallas (prueba rápida).
    limpio: quita el ruido con OpenImageDenoise guiado por normales (sin guía borraba el detalle de los muros)."""
    img = bpy.data.images.new('pb_luz', res, res, float_buffer=True)
    for o in obs: o.data.uv_layers.active = o.data.uv_layers['luz']
    _img(obs, img)
    sc.cycles.samples = muestras; sc.cycles.use_denoising = False
    bk = sc.render.bake; bk.use_pass_direct = True; bk.use_pass_indirect = True; bk.use_pass_color = False; bk.margin = 2; bk.target = 'IMAGE_TEXTURES'
    sc.cycles.sample_clamp_indirect = 2     # sin destellos del rebote (dejaban manchas al quitar el ruido)
    _pasadas(sc, img, muestras, solo or obs)
    den = _dentro(sc, obs, solo or obs, res)
    nrm = bpy.data.images.new('pb_nrm', res, res, float_buffer=True); _img(obs, nrm)
    bk.margin = 0; sc.cycles.samples = 1; _sel(solo or obs); bpy.ops.object.bake(type='NORMAL', normal_space='OBJECT'); bk.margin = 2
    cara = _pix(nrm)[:, :, :3].sum(2) > 1e-4        # texeles de alguna cara (sin el margen: lo pone _rellenar)
    _img(obs, img); _rellenar(img, cara, den)
    if limpio: img = oidn(sc, img, nrm); _rellenar(img, cara)
    for o in obs: o.data.uv_layers.active = o.data.uv_layers[0]
    img.filepath_raw = os.path.join(DIR, 'blender', 'pb_luz.exr'); img.file_format = 'OPEN_EXR'; img.save()
    return img

def oidn(sc, img, nrm):
    """OpenImageDenoise del compositor sobre el mapa de luz, con normales horneadas y albedo blanco (es luz sola)."""
    import numpy as np, tempfile
    w, h = img.size; tmp = tempfile.mkdtemp()
    def pix(i): a = np.empty(w * h * 4, dtype=np.float32); i.pixels.foreach_get(a); return a.reshape(h, w, 4)
    def exr(a, n):
        i = bpy.data.images.new(n, w, h, float_buffer=True); i.pixels.foreach_set(a.ravel())
        i.filepath_raw = os.path.join(tmp, n + '.exr'); i.file_format = 'OPEN_EXR'; i.save(); return i
    n = pix(nrm); vac = n[:, :, :3].sum(2) < 1e-4; n[:, :, :3] = n[:, :, :3] * 2 - 1; n[vac, :3] = (0, 0, 1)
    al = np.ones((h, w, 4), dtype=np.float32)
    i_c, i_n, i_a = exr(pix(img), 'c'), exr(n, 'n'), exr(al, 'a')
    t = bpy.data.node_groups.new('oidn', 'CompositorNodeTree'); sc.compositing_node_group = t
    t.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    out = t.nodes.new('NodeGroupOutput'); d = t.nodes.new('CompositorNodeDenoise')
    for k, im in (('Image', i_c), ('Normal', i_n), ('Albedo', i_a)):
        nd = t.nodes.new('CompositorNodeImage'); nd.image = im; t.links.new(nd.outputs['Image'], d.inputs[k])
    d.inputs['HDR'].default_value = True
    try: d.inputs['Quality'].default_value = 'High'
    except Exception as e: print('oidn calidad', e)
    t.links.new(d.outputs['Image'], out.inputs[0])
    r = sc.render; r.resolution_x, r.resolution_y, r.resolution_percentage = w, h, 100
    r.image_settings.file_format = 'OPEN_EXR'; r.image_settings.color_depth = '32'; r.filepath = os.path.join(tmp, 'den.exr')
    sc.cycles.samples = 1; vis = [o for o in sc.objects if not o.hide_render]
    for o in vis: o.hide_render = True             # el compositor solo usa imágenes: que no renderice la escena
    bpy.ops.render.render(write_still=True)
    for o in vis: o.hide_render = False
    sc.compositing_node_group = None; r.image_settings.file_format = 'PNG'; r.image_settings.color_depth = '8'
    den = bpy.data.images.load(r.filepath); a = pix(den); a[:, :, 3] = 1
    print('oidn: listo', w, h)
    out_i = bpy.data.images.new('pb_luz_den', w, h, float_buffer=True); out_i.pixels.foreach_set(a.ravel()); return out_i

NOM = 'pb'   # nombre de salida (casona_pa.py lo cambia a 'pa')
def guardar(img, escala=.25, ruta=None, grano=False):
    import numpy as np
    w, h = img.size; px = np.empty(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px); px = px.reshape(h, w, 4)
    c = px[:, :, :3]
    if grano: c = (c + np.roll(c, 1, 0) * .5 + np.roll(c, -1, 0) * .5 + np.roll(c, 1, 1) * .5 + np.roll(c, -1, 1) * .5) / 3   # quita el grano fino
    print('luz: media %.3f p50 %.3f p95 %.3f p99 %.3f' % (c.mean(), *np.percentile(c, [50, 95, 99])))
    px[:, :, :3] = np.clip(c * escala, 0, 1) ** (1 / 2.2); px[:, :, 3] = 1
    # WEBP sin pérdida: el JPG metía cuadros y rayas de hasta 4.5% de brillo en los muros lisos (el piso los tapa con su dibujo)
    out = bpy.data.images.new('pb_luz_webp', w, h); out.colorspace_settings.name = 'Non-Color'; out.pixels.foreach_set(px.ravel())
    sc = bpy.context.scene; s = sc.render.image_settings; prev = (s.file_format, s.color_mode, s.quality)
    s.file_format = 'WEBP'; s.color_mode = 'RGB'; s.quality = 100
    p = ruta or os.path.join(SAL, NOM + '_luz.webp'); out.save_render(p, scene=sc); print('luz:', p, os.path.getsize(p) // 1024, 'KB')
    s.file_format, s.color_mode, s.quality = prev

def exportar(col):
    for m in bpy.data.materials:
        if m.node_tree and m.node_tree.nodes.get('bake'): m.node_tree.nodes.remove(m.node_tree.nodes['bake'])
    bpy.ops.object.select_all(action='DESELECT')
    for o in col.objects: o.select_set(True)
    bpy.context.view_layer.objects.active = next(o for o in col.objects if o.type == 'MESH')
    f = os.path.join(SAL, NOM + '.glb')
    bpy.ops.export_scene.gltf(filepath=f, export_format='GLB', use_selection=True, export_extras=True, export_apply=True,
                              export_materials='EXPORT', export_texcoords=True, export_normals=True, export_yup=True)
    print(NOM + '.glb', os.path.getsize(f), 'bytes')

# ---------- prueba rápida de la luz: zaguán y salón, antes y después con las mismas cámaras ----------
CAM_PRUEBA = [((17, 9.5, -4), (10, 1.5, 6), ('pb_muro_h0_', 'pb_techo')), ((20.3, 4.2, 1.2), (16, 2.6, 6.5), ('pb_techo',))]

def region(obs, x0=0, x1=21, z0=0, z1=10):
    out = []
    for o in obs:
        if 'techo' in o.name or '_muro_h0_' in o.name: continue
        bb = [o.matrix_world @ Vector(c) for c in o.bound_box]; xs = [v.x + 18 for v in bb]; zs = [v.y + 17 for v in bb]
        if min(xs) < x1 and max(xs) > x0 and min(zs) < z1 and max(zs) > z0: out.append(o)
    return out

def previa(sc, solo, luz, carpeta, pre):
    """Render como en el juego: color base por la luz horneada (jpg, sRGB, x4) como emisión, en las mallas de 'solo'."""
    li = bpy.data.images.load(luz, check_existing=False); li.colorspace_settings.name = 'sRGB'; PM, orig = {}, {}
    for o in solo:
        m0 = o.data.materials[0]; n = m0.name
        if n not in PM:
            m = bpy.data.materials.new('prev_' + n); m.use_nodes = True; nt = m.node_tree
            for x in list(nt.nodes): nt.nodes.remove(x)
            uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'luz'; tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = li
            mu = nt.nodes.new('ShaderNodeVectorMath'); mu.operation = 'MULTIPLY'; mu.inputs[1].default_value = [4 * q for q in COLOR.get(n, (.7, .7, .7))]
            em = nt.nodes.new('ShaderNodeEmission'); ou = nt.nodes.new('ShaderNodeOutputMaterial')
            nt.links.new(uv.outputs[0], tx.inputs[0]); nt.links.new(tx.outputs[0], mu.inputs[0]); nt.links.new(mu.outputs[0], em.inputs[0]); nt.links.new(em.outputs[0], ou.inputs[0])
            PM[n] = m
        orig[o] = m0; o.data.materials[0] = PM[n]
    rs = []
    for i, (cam, mira, ocu) in enumerate(CAM_PRUEBA):
        r = os.path.join(carpeta, '%s_%d.png' % (pre, i)); vista(sc, r, cam, mira, tuple(ocu) + ('px_',), muestras=384, den=False); rs.append(r)
    for o, m in orig.items(): o.data.materials[0] = m
    return rs

def comparar(carpeta):
    """Une antes (izquierda) y después (derecha) de cada cámara en prueba_luz.png."""
    import numpy as np
    if not os.path.exists(os.path.join(carpeta, 'antes_0.png')): print('comparar: falta correr "antes" en', carpeta); return
    filas = []
    for i in range(len(CAM_PRUEBA)):
        par = []
        for pre in ('antes', 'despues'):
            im = bpy.data.images.load(os.path.join(carpeta, '%s_%d.png' % (pre, i))); w, h = im.size
            a = np.empty(w * h * 4, dtype=np.float32); im.pixels.foreach_get(a); par.append(a.reshape(h, w, 4))
        par.insert(1, np.ones((h, 6, 4), dtype=np.float32)); filas.append(np.concatenate(par, 1))
    filas = filas[::-1]; t = np.concatenate([x for f in filas for x in (f, np.ones((6, f.shape[1], 4), dtype=np.float32))][:-1], 0)
    H, W = t.shape[:2]; o = bpy.data.images.new('cmp', W, H); o.pixels.foreach_set(t.ravel())
    o.filepath_raw = os.path.join(carpeta, 'prueba_luz.png'); o.file_format = 'PNG'; o.save(); print('comparar:', o.filepath_raw)

if __name__ == '__main__':
    arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    acc = arg[0] if arg else 'vista'
    if acc == 'antes':        # con blender/casona_pb.blend abierto: la luz que hoy usa el juego
        sc = bpy.context.scene; motor(sc); car = arg[1]
        obs = [o for o in bpy.data.collections['pb'].objects if o.type == 'MESH' and 'luz' in o.data.uv_layers]
        previa(sc, region(obs), next(p for p in (os.path.join(SAL, 'pb_luz.' + e) for e in ('webp', 'jpg')) if os.path.exists(p)), car, 'antes'); sys.exit(0)
    sc, col, obs = armar()
    if acc == 'vista':
        vistas(sc, arg[1] if len(arg) > 1 else os.path.join(DIR, 'blender'))
    elif acc == 'hornear':
        res = int(arg[1]) if len(arg) > 1 else K['RES']; mu = int(arg[2]) if len(arg) > 2 else K['SAMPLES']
        uv_luz(obs); img = hornear(sc, obs, res, mu); guardar(img); exportar(col)
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(DIR, 'blender', 'casona_pb.blend'))
    elif acc == 'prueba':     # hornea solo zaguán y salón con los ajustes nuevos y los compara con 'antes'
        car = arg[1]; res = int(arg[2]) if len(arg) > 2 else K['RES']; mu = int(arg[3]) if len(arg) > 3 else K['SAMPLES']
        uv_luz(obs); solo = region(obs); print('prueba:', len(solo), 'mallas')
        img = hornear(sc, obs, res, mu, solo=solo); luz = os.path.join(car, 'luz_nueva.webp'); guardar(img, ruta=luz)
        previa(sc, solo, luz, car, 'despues'); comparar(car)
        if 'juego' in arg: guardar(img); exportar(col)   # para verla en el juego (resto de la planta sin hornear); no subir
    elif acc == 'exportar':
        exportar(col)
