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
import bpy, bmesh, math, os, random, sys, types
from mathutils import Vector, Matrix

def _raiz():   # carpeta del repo: junto a este archivo, o la carpeta actual (blender.exe se corre desde el repo)
    for d in ([os.path.dirname(os.path.dirname(os.path.abspath(__file__)))] if '__file__' in globals() else []) + [os.getcwd()]:
        if os.path.isfile(os.path.join(d, 'blender', 'casona.py')): return d
    raise SystemExit('correr blender.exe desde la carpeta del repo')
DIR = _raiz()
C = types.ModuleType('casona'); C.__file__ = os.path.join(DIR, 'blender', 'casona.py'); exec(open(os.path.join(DIR, 'blender', 'casona.py'), encoding='utf-8').read(), C.__dict__)
N = C.NIV['n0']
SAL = os.environ.get('CASONA_SAL') or os.path.join(DIR, 'modelos', 'casona')   # CASONA_SAL=modelos/casona/crudo: exportar sin hornear (?crudo)
K = dict(H=N['H'], t=C.K['t'], LAM=1.3, ROD=.1, PUERTA=C.K['puerta'], SILL=.5, TOP=4.2, SPRING=3.1, COL=.52, RES=2048, SAMPLES=1000)
ARCOS = dict(zaguan=4.6, patio=4.6, salon=4.8, comedor=4.8)      # vanos con arco: altura de la clave
LLEGADA = (18.5, 3.5)                                             # llegas por el zaguán
GATA = (10.2, 23.8, math.pi / 2)                                  # junto a la hamaca, mirando al patio
ARBOL = (20.8, 25.6, 3.4)
COLOR = dict(muro=(.72, .45, .3), lambrin=(.12, .26, .19), rod=(.85, .8, .68), cantera=(.8, .7, .55), pasta=(.78, .72, .6),
             cenefa=(.55, .38, .3), mosaico=(.7, .62, .52), corredor=(.75, .6, .45), laja=(.64, .61, .55), pasto=(.3, .45, .22),
             cuarto=(.8, .77, .7), techo=(.8, .74, .62), madera=(.3, .18, .1), bejuco=(.75, .6, .38), porton=(.32, .2, .12),
             persiana=(.18, .36, .26), hierro=(.05, .05, .05), tapete=(.5, .2, .15), hamaca=(.7, .35, .3), tronco=(.35, .25, .18),
             copa=(.24, .4, .18), barro=(.6, .32, .2), escalon=(.34, .1, .07), calle=(.35, .35, .37), banqueta=(.62, .6, .56),
             barda=(.78, .7, .58), agua=(.06, .14, .15), arbotante=(1, .8, .5), farol=(1, .78, .45), mesa=(.25, .15, .08), foco=(1, .86, .58))
EMITE = dict(arbotante=6, farol=8, foco=10)
PRIO = {}            # escala de la isla en el mapa de luz (menos texeles para lo que casi no se ve)
# por material: muros y arcos con más texeles (se veían borrosos); techos con menos. Las caras exteriores del lote (hacia los
# vecinos) no se ven: casi sin texeles. El margen fijo del empaque dobla lo que se aprovecha del mapa (24% -> 51%).
PRIO_MAT = dict(muro=1.4, cantera=1.4, lambrin=1.4, techo=float(os.environ.get('R4_TECHO', 1)))   # R4: techo .5 -> 1 (rincones techo-muro a 16 cm por texel)   # techo: ver techos() (antes .3 x .5 = 2 texeles por unidad)
MUROS = ('muro', 'lambrin', 'cantera', 'cenefa', 'barda')   # piezas que se meten unas en otras (ver _dentro)
FUERA = .1
ARQ = ('muro', 'techo', 'lambrin', 'cantera', 'escalon', 'pasto', 'corredor', 'cuarto', 'barda', 'rod', 'pasta', 'azulejo', 'laja', 'cenefa', 'porton', 'persiana', 'mosaico', 'banqueta', 'calle', 'tierra')   # R4: arquitectura (lo demás es decoración)

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
    Bd = C.rect(*N['barda']) - W; S = W | Bd
    def fin(e, l, i):   # punta de un tramo en i: 'T' si el muro de cruce sigue de los dos lados, 'L' si es esquina
        p = 'v' if e == 'h' else 'h'; a, b = (p, i, l - 1) in S, (p, i, l) in S
        return 'T' if a and b else 'L' if a or b else None
    # en una T el que llega termina 2 cm dentro del otro (antes llegaba a su cara de enfrente: la tapa quedaba en ese plano y horneaba una franja
    # oscura del ancho del muro del otro lado); en una esquina el 'h' cubre el cuadro y el 'v' llega hasta él. Igual que juntas() en c_casona_caja.js.
    corto = lambda k, e: k == 'T' or (k == 'L' and e == 'v')
    ext = lambda k, e, m, o: o if corto(k, e) else m
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
            u0, u1 = a / 10, b / 10; k0 = fin(e, l, i0) if a == i0 else 0; k1 = fin(e, l, i1) if b == i1 else 0
            mm = lambda k: -h if k == 'L' else -h + .02   # en L el 'v' llega a la cara del 'h' (si se mete, su cara de afuera queda en el plano de la tapa del 'h')
            e0 = ext(k0, e, h, mm(k0)) if a == i0 else 0; e1 = ext(k1, e, h, mm(k1)) if b == i1 else 0
            if c == 'f':
                caja_l(M, e, L, u0 - e0, u1 + e1, 0, H - dv(e), -h, h); segs += LT(e, L, u0) + LT(e, L, u1)
                # lambrín: en una esquina (L) los dos se tocan al ras (antes el 'h' salía 2 cm y el 'v' se metía 2 cm: franja oscura, R5); en una T el que llega se mete 2 cm
                lm = lambda k: -h - .03 if k == 'L' else -h - .01
                z0, z1 = (ext(k0, e, h + .03, lm(k0)) if a == i0 else 0), (ext(k1, e, h + .03, lm(k1)) if b == i1 else 0)
                r0, r1 = (ext(k0, e, h + .05, -h - .05) if a == i0 else 0), (ext(k1, e, h + .05, -h - .05) if b == i1 else 0)
                caja_l(LA, e, L, u0 - z0, u1 + z1, 0, K['LAM'] - dv(e) / 2, -h - .03, h + .03)
                caja_l(RO, e, L, u0 - r0, u1 + r1, K['LAM'] - dv(e) / 2, K['LAM'] + K['ROD'] - dv(e) / 2, -h - .05, h + .05)
            elif c == 'w': ventana(base, e, L, u0, u1, segs)
            else: puerta(base, e, L, u0, u1, vano(e, l, a, b))
        ex(base, linea=lid, segs=segs, r=round(h + .15, 3))
        for s in ('_lam', '_rod', '_can', '_per', '_rej'):
            if base + s in B: ex(base + s, linea=lid)
    for (e, l, i0, i1) in C.tramos(Bd):
        L, u0, u1 = l / 10, i0 / 10, i1 / 10; k0, k1 = fin(e, l, i0), fin(e, l, i1); m0, m1 = ext(k0, e, h, -h + .02), ext(k1, e, h, -h + .02); n0, n1 = ext(k0, e, h + .05, -h - .05), ext(k1, e, h + .05, -h - .05); base = 'pb_muro_b%s%d_%d' % (e, l, i0); lid = 'b%s%d_%d' % (e, l, i0)
        caja_l(bmn(base, 'barda'), e, L, u0 - m0, u1 + m1, 0, C.K['barda'] - dv(e), -h, h)
        caja_l(bmn(base + '_rod', 'rod'), e, L, u0 - n0, u1 + n1, C.K['barda'] - dv(e), C.K['barda'] + .1 - dv(e), -h - .05, h + .05)
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

# ---------- árboles de ramas con nubes de hojas (los usan el patio, el traspatio y blender/barrio_kit.py) ----------
# Ramas: un esqueleto continuo (tronco, ramas y ramitas) con el modificador Skin + Subdivisión: una sola malla lisa, sin juntas.
# Hojas: cada grupo es una metabola (un elipsoide por punta de ramita y bultos encima) que se funde en una nube suave,
# casi plana abajo y esponjada arriba; grupos separados para que se vea cielo y ramas entre ellos.
def _malla_de(o, bm):
    """Pega en bm la malla evaluada del objeto o (está en el origen: coordenadas del mundo) y borra o; regresa el índice del primer vértice."""
    ev = o.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
    bm.verts.ensure_lookup_table(); n0 = len(bm.verts); bm.from_mesh(me); ev.to_mesh_clear()
    dat = o.data; bpy.data.objects.remove(o, do_unlink=True)
    (bpy.data.meshes if isinstance(dat, bpy.types.Mesh) else bpy.data.metaballs).remove(dat)
    bm.verts.ensure_lookup_table(); return n0

def esqueleto(bm, nodos, aristas, radios, sub=1, dec=.42, col=None):
    """Ramas lisas: nodos en el plano (x, alto, z), aristas (i, j) en árbol con raíz 0, radio por nodo."""
    me = bpy.data.meshes.new('_esq'); me.from_pydata([tuple(V(*p)) for p in nodos], aristas, [])
    o = bpy.data.objects.new('_esq', me); bpy.context.scene.collection.objects.link(o)
    sk = o.modifiers.new('piel', 'SKIN'); sk.use_smooth_shade = True; sk.branch_smoothing = .5
    for v, r in zip(me.skin_vertices[0].data, radios): v.radius = (r, r)
    me.skin_vertices[0].data[0].use_root = True
    if sub: o.modifiers.new('sub', 'SUBSURF').levels = sub
    if dec < 1: o.modifiers.new('dec', 'DECIMATE').ratio = dec     # liso pero ligero
    n0 = _malla_de(o, bm)
    if col:      # color por vértice (malla de fachadas): tronco gris de la ceiba
        cl = bm.loops.layers.float_color.get('Col') or bm.loops.layers.float_color.new('Col')
        for f in {f for v in bm.verts[n0:] for f in v.link_faces}:
            for lp in f.loops: lp[cl] = (*col, 1)

NUBES = [0]
def nube_mb(bm, bolas, sy, res, piso):
    """Nube de hojas fundida: bolas [(x, y, z, r)] en el plano (r = radio visible aprox.), sy aplasta en alto; abajo se aplana hasta 'piso'."""
    NUBES[0] += 1; mb = bpy.data.metaballs.new('_nube'); mb.resolution = res; mb.render_resolution = res
    for x, y, z, r in bolas:
        e = mb.elements.new(); e.type = 'ELLIPSOID'; e.co = V(x, y, z); e.radius = r / .565; e.size_x = e.size_y = 1; e.size_z = sy
    o = bpy.data.objects.new('nube%d' % NUBES[0], mb); bpy.context.scene.collection.objects.link(o)    # nombre propio: no se funde con otras
    n0 = _malla_de(o, bm); pz = V(0, piso, 0).z
    for v in bm.verts[n0:]:
        if v.co.z < pz: v.co.z = pz + (v.co.z - pz) * .25
    for f in {f for v in bm.verts[n0:] for f in v.link_faces}: f.smooth = True

def arbol_ramas(R, TR, cps, cx, cz, s, y0, H, fork, ramas, alto, largo, rn, sub=2, sy=.5, lean=(0, 0), tope=True, tocon=True, rtr=.5,
                lado=.5, raices=0, tr_col=None, vaiven=1.0, ligero=False):
    """Tronco que sube a fork·s y sigue hasta H·s (remate) soltando 'ramas' ramas escalonadas; cada rama se abre en dos ramitas y en sus
    puntas va una nube. cps: [(malla, peso)] para escoger la malla de cada nube; alto/largo/rn: rangos (min, max) en unidades de s (alto =
    altura de las puntas sobre y0, largo = alcance horizontal, rn = radio de la nube); sub 3 = nubes más finas (cerca); lado: probabilidad
    de ramita lateral con nube más baja; raices: contrafuertes lisos al pie; ligero: árboles chicos o lejanos (menos triángulos); tr_col: color por vértice de las ramas (si TR es de fachadas). Regresa las bolas de las nubes [(x, y, z, r)] (para colgarles fruta)."""
    lx, lz = lean[0] * 1.6 * s, lean[1] * 1.6 * s; ns = []; N, A, RA = [], [], []; g = rtr / .55
    def nodo(p, r, padre=None):
        N.append(p); RA.append(max(r, .035))
        if padre is not None: A.append((padre, len(N) - 1))
        return len(N) - 1
    def curva(i0, p1, r0, r1, cv, n):      # rama curva (sube cv en medio) de N[i0] a p1 en n tramos; regresa el último nodo
        p0 = N[i0]; i = i0
        for k in range(1, n + 1):
            t = k / n; q = (p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t + cv * 4 * t * (1 - t), p0[2] + (p1[2] - p0[2]) * t)
            i = nodo(q, r0 + (r1 - r0) * t, i)
        return i
    # tronco: base ensanchada, sube con un leve vaivén hasta la horqueta y sigue hasta el remate soltando las ramas escalonadas
    pie = (1.8, 1.3) if raices else (1.35, 1.05)     # con contrafuertes, pie muy ensanchado
    i = nodo((cx, y0, cz), rtr * pie[0] * s); i = nodo((cx, y0 + .35 * g * s, cz), rtr * pie[1] * s, i)
    yt = y0 + (H - 1.2 * g) * s if tope else y0 + (fork + .6 * g) * s
    w = (R.uniform(-.3, .3) * g * s * vaiven, R.uniform(-.3, .3) * g * s * vaiven); tr = []
    for k in range(1, 4):
        t = k / 3; i = nodo((cx + lx * .6 * t + w[0] * math.sin(t * math.pi), y0 + fork * s * t, cz + lz * .6 * t + w[1] * math.sin(t * math.pi)),
                            rtr * s * (1.0 - .3 * t), i); tr.append(i)
    tronco = [i]; F = N[i]; m = ramas + (1 if tope else 0)
    for k in range(1, m):
        t = k / m; i = nodo((F[0] + lx * .4 * t, F[1] + (yt - F[1]) * t, F[2] + lz * .4 * t), rtr * s * (.7 - .3 * t), i); tronco.append(i)
    for k in range(raices):     # contrafuertes: raíces que bajan del tronco al suelo, fundidas con él
        a = k * 2 * math.pi / raices + R.uniform(-.25, .25) + .4; d = rtr * R.uniform(2.0, 2.5) * s; c, sn = math.cos(a), math.sin(a)
        h = nodo((cx + c * d * .6, y0 + .3 * s, cz + sn * d * .6), rtr * .36 * s, 1)     # nace del pie ensanchado
        nodo((cx + c * d, y0 + .06, cz + sn * d), rtr * .17 * s, h)
    if tocon:     # muñón seco a media altura, como rama cortada
        a = R.uniform(0, 6.28); b = tr[0]; P0 = N[b]
        curva(b, (P0[0] + math.cos(a) * 1.1 * g * s, P0[1] + .7 * g * s, P0[2] + math.sin(a) * 1.1 * g * s), rtr * .3 * s, rtr * .14 * s, .1 * s, 1)
    a0 = R.uniform(0, 6.28); pesos = sum(p for _, p in cps); ys = sorted(R.uniform(*alto) for _ in range(ramas))    # más arriba sale, más arriba llega
    def malla():
        t = R.uniform(0, pesos)
        for mm, p in cps:
            t -= p
            if t <= 0: return mm
        return cps[-1][0]
    fina = sub >= 3; dv = 4.0 if fina else (2.3 if ligero else 2.9)
    def nube(puntas, r):
        """Una nube sobre las puntas: un elipsoide por punta y 2-4 bultos encima, corridos al azar."""
        bl = [(x, y + r * sy * .25, z, r * R.uniform(.75, .85)) for x, y, z in puntas]
        cxm = sum(p[0] for p in puntas) / len(puntas); cym = sum(p[1] for p in puntas) / len(puntas); czm = sum(p[2] for p in puntas) / len(puntas)
        b0 = R.uniform(0, 6.28); nl = R.randint(3, 4) if ligero else R.randint(4, 6)
        for k in range(nl):     # lóbulos en la orilla: el contorno queda festoneado, no de disco
            b = b0 + k * 2 * math.pi / nl + R.uniform(-.3, .3); d = r * R.uniform(.62, .85)
            bl.append((cxm + math.cos(b) * d, cym + r * sy * R.uniform(.05, .35), czm + math.sin(b) * d, r * R.uniform(.42, .58)))
        for _ in range(R.randint(1, 2) if ligero else R.randint(2, 3)):     # bultos arriba
            b = R.uniform(0, 6.28); d = r * R.uniform(.15, .5)
            bl.append((cxm + math.cos(b) * d, cym + r * sy * R.uniform(.6, .95), czm + math.sin(b) * d, r * R.uniform(.45, .6)))
        nube_mb(malla(), bl, sy, r / dv, cym - r * sy * .35)
        ns.extend(bl)
    for k in range(ramas):
        a = a0 + k * 2 * math.pi / ramas + R.uniform(-.3, .3); L = R.uniform(*largo) * s; y = y0 + ys[k] * s
        r = R.uniform(*rn) * s; j0 = tronco[min(k, len(tronco) - 1)]
        T = (F[0] + lx * .5 + math.cos(a) * L * .78, y - r * sy * .55, F[2] + lz * .5 + math.sin(a) * L * .78)
        j = curva(j0, T, rtr * .55 * s, rtr * .26 * s, .5 * g * s, 3)     # 3 tramos: la curva se nota
        puntas = []
        for e in (-1, 1):   # la rama se abre en dos ramitas que entran a la nube
            b = a + e * R.uniform(.35, .6); l2 = r * R.uniform(.45, .6)
            q = (T[0] + math.cos(b) * l2, T[1] + r * sy * R.uniform(.15, .45), T[2] + math.sin(b) * l2)
            curva(j, q, rtr * .2 * s, rtr * .09 * s, .1 * s, 1); puntas.append(q)
        nube(puntas, r * .82)
        if R.random() < lado:     # ramita lateral con una nube más baja (pisos de hojas)
            jm = j - 3 + R.randint(1, 2); M0 = N[jm]
            b = a + R.choice((-1, 1)) * R.uniform(.8, 1.2); l2 = L * R.uniform(.35, .5); r2 = r * R.uniform(.5, .65)
            q = (M0[0] + math.cos(b) * l2, M0[1] + R.uniform(.1, .7) * g * s, M0[2] + math.sin(b) * l2)
            curva(jm, q, rtr * .22 * s, rtr * .08 * s, .25 * g * s, 1); nube([q], r2)
    if tope:      # remate arriba del tronco, corrido para que no quede simétrico
        b = R.uniform(0, 6.28); d = R.uniform(.5, 1.2) * g * s; r = R.uniform(*rn) * s * .85; P0 = N[tronco[-1]]
        q = (P0[0] + math.cos(b) * d, y0 + H * s - r * sy * .6, P0[2] + math.sin(b) * d)
        curva(tronco[-1], q, rtr * .3 * s, rtr * .12 * s, .1 * s, 2); nube([q], r)
    esqueleto(TR, N, A, RA, 1, dec=.42 if fina else (.24 if ligero else .32), col=tr_col)
    return ns

def arbol(nom, cx, cz, R, alto, n=5, prio=1.0):
    """Árbol de patio: tronco que a 'alto' se abre en n ramas con nubes de hojas planas; la copa cabe en ~R (no toca los corredores)."""
    TR = bmn('pb_' + nom + '_tronco', 'tronco'); CP = bmn('pb_' + nom + '_copa', 'copa', prio=prio)
    arbol_ramas(random.Random(int(cx * 7 + cz * 3)), TR, [(CP, 1)], cx, cz, 1.0, 0, alto + 2.9, alto, n,
                (alto + 1.3, alto + 2.4), (R * .3, R * .45), (R * .35, R * .43), 2, .58, rtr=.44)

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
    porton()
    # tapetes redondos bajo las mesas de la crujía del frente
    for g, mx, mz, r, libre in N['mesas']:
        if g in ('continental', 'monopolydeal'): disco('pb_tapete_' + g, 'tapete', mx, mz, 3.1, .012, 48, uvr=True)

def hoja_puerta(bm, hx, hz, ux, uz, R, alto, s=None, g=.1, ab=0.0):
    """Hoja de puerta de madera con tableros en las dos caras. Bisagra en (hx, hz); (ux, uz): hacia dónde va la hoja (unitario);
    R: ancho; alto: altura del canto de la bisagra; s: si se da, el remate es un cuarto de arco que sube de s (bisagra) a alto
    (centro del arco), como el vano del zaguán. ab: altura desde el piso."""
    nx, nz = -uz, ux; n = 12 if s is not None else 1
    def y_top(w): return alto if s is None else s + math.sqrt(max(R * R - (R - w) ** 2, 0))
    ws = [R * k / n for k in range(n + 1)] if s is not None else [0, R]
    perfil = [(0, ab), (R, ab)] + [(w, y_top(w)) for w in reversed(ws)]
    for lado in (-1, 1):
        cara = [bm.verts.new(V(hx + ux * w + nx * g / 2 * lado, y, hz + uz * w + nz * g / 2 * lado)) for w, y in perfil]
        if lado < 0: A = cara
        else: Bq = cara
    m = len(perfil); bm.faces.new(A); bm.faces.new(Bq[::-1])
    for i in range(m): j = (i + 1) % m; bm.faces.new([A[i], A[j], Bq[j], Bq[i]])
    # tableros: dos por hoja (abajo, arriba), salen 3 cm de cada cara
    sup = (s if s is not None else alto) - .35
    for y0, y1 in ((ab + .35, ab + 1.35), (ab + 1.65, sup)):
        if y1 - y0 < .3: continue
        for lado in (-1, 1):
            c = (hx + ux * R / 2 + nx * (g / 2 + .015) * lado, (y0 + y1) / 2, hz + uz * R / 2 + nz * (g / 2 + .015) * lado)
            bloque(bm, c, (ux * (R / 2 - .18), 0, uz * (R / 2 - .18)), (0, (y1 - y0) / 2, 0), (nx * .015, 0, nz * .015))

def porton():
    """Portón del zaguán: dos hojas con el remate en arco hasta la clave (altura completa del vano), abiertas hacia adentro
    a 90°, recargadas junto a las jambas, con tableros y aldaba."""
    PO, HI = bmn('pb_porton', 'porton'), bmn('pb_porton_hierro', 'hierro', luz=False)
    u0, u1 = 17.1, 19.9; f = .16; c = (u0 + u1) / 2; R = (u1 - u0) / 2 - f; s = ARCOS['zaguan'] - (u1 - u0) / 2
    hz = K['t'] / 2 + .02; ps = []
    for hx, sg in ((u0 + f + .05, 1), (u1 - f - .05, -1)):
        hoja_puerta(PO, hx, hz, 0, 1, R, ARCOS['zaguan'] - .02, s=s, ab=.02)
        tubo(HI, (hx + sg * .05, 1.3, hz + R - .25), (hx + sg * .12, 1.3, hz + R - .25), .05, .05, 8)   # aldaba, cara hacia el zaguán
        ps += T(hx, hz) + T(hx, hz + R)
    ex('pb_porton', segs=ps, r=.15)

POZO = (14, 44.6)   # centro del pozo del traspatio (el pasto lleva su hoyo; c_casona_pozo.js lo imita mientras no se hornee)
def pozo(x, z):
    """Pozo que baja: brocal de cantera con zócalo, franja y remate que sobresale; tiro de 3 por dentro con el agua a 1.5;
    pretil de madera con garrucha, cuerda a la cubeta colgada sobre la boca y amarre al poste."""
    CA = bmn('pb_pozo', 'cantera', prio=.6)
    anillo(CA, x, z, .62, .9, 0, .95, 28); anillo(CA, x, z, .56, .97, .95, 1.04, 28); anillo(CA, x, z, .6, .99, 1.04, 1.07, 28)
    anillo(CA, x, z, .86, .99, 0, .14, 28); anillo(CA, x, z, .895, .915, .46, .49, 28)
    anillo(bmn('pb_pozo_tiro', 'cantera', prio=.3), x, z, .62, .68, -3, 0, 24)
    disco('pb_pozo_agua', 'agua', x, z, .64, -1.5, 28)
    MA, HI, CU = bmn('pb_traspatio_madera', 'madera', prio=.5), bmn('pb_pozo_hierro', 'hierro', luz=False), bmn('pb_pozo_cuerda', 'bejuco', prio=.3)
    for xx in (x - .95, x + .95): caja(MA, xx - .07, xx + .07, .95, 2.6, z - .07, z + .07)
    caja(MA, x - 1.05, x + 1.05, 2.5, 2.62, z - .08, z + .08)
    tubo(MA, (x, 2.2, z - .05), (x, 2.2, z + .05), .2, .2, 18); tubo(MA, (x + .19, 1.1, z), (x + .19, 1.4, z), .13, .17, 14)
    for dz in (-.08, .08): caja(HI, x - .03, x + .03, 2.2, 2.5, z + dz - .01, z + dz + .01)
    tubo(HI, (x, 2.2, z - .1), (x, 2.2, z + .1), .025, .025, 8)
    for y in (1.16, 1.34): r = .142 + (y - 1.1) * .13; anillo(HI, x + .19, z, r, r + .033, y, y + .03, 14)
    asa = [(x + .19 + .17 * math.cos(math.pi * i / 8), 1.4 + .17 * math.sin(math.pi * i / 8)) for i in range(9)]
    for (ax, ay), (bx, by) in zip(asa, asa[1:]): tubo(HI, (ax, ay, z), (bx, by, z), .012, .012, 6)
    tubo(CU, (x + .19, 2.2, z), (x + .19, 1.57, z), .016, .016, 6); tubo(CU, (x - .19, 2.2, z), (x - .86, 1.35, z), .016, .016, 6)
    tubo(CU, (x - .86, 1.35, z - .08), (x - .86, 1.35, z + .08), .03, .03, 8)

def traspatio():
    arbol('mamey', 6, 41, 3.3, 3.3, 5, prio=.5)      # sombra de la banca
    CA = bmn('pb_traspatio', 'cantera', prio=.5)
    caja(CA, 31, 34, 0, 1.0, 35.4, 36.8); caja(CA, 31.2, 33.8, 1.0, 1.2, 35.6, 36.6)
    pozo(*POZO)
    ex('pb_traspatio', segs=T(31.5, 36.1) + T(33.5, 36.1), r=.85, obs=T(14, 44.6) + [1.1] + T(6, 41) + [.7])

def entrepiso(pre, y0=-.32, y1=0.0):
    """R3: canto de la losa por fuera, del muro del nivel de abajo (termina .3 bajo este piso) a este nivel: franja de muro en el
    contorno del lote y cornisa de cantera al frente y a los lados. La usan casona_pa.py y casona_az.py (antes: c_casona_fuera.js)."""
    t = K['t'] / 2; M, CA = bmn(pre + '_entrepiso', 'muro', prio=.4), bmn(pre + '_entrepiso_cor', 'cantera', prio=.4)
    caja(M, -t, 36 + t, y0, y1, -t, t); caja(M, -t, 36 + t, y0, y1, 30 - t, 30 + t)
    caja(M, -t, t, y0, y1, t, 30 - t); caja(M, 36 - t, 36 + t, y0, y1, t, 30 - t)
    caja(CA, -.3, 36.3, y0 - .08, y1 + .1, -.38, -.1)
    for x0, x1 in ((-.3, -.1), (36.1, 36.3)): caja(CA, x0, x1, y0 - .08, y1 + .1, -.1, 30.2)

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
        elif n == 'traspatio':   # con el hoyo del pozo: cuadro de .66 (más que el tiro, sus esquinas bajo el zócalo)
            px, pz = POZO; h = .66
            for a, b, c, e in ((x, z, x1, pz - h), (x, pz + h, x1, z1), (x, pz - h, px - h, pz + h), (px + h, pz - h, x1, pz + h)):
                quad('pb_piso_pasto', 'pasto', a, b, c, e, prio=.35)
        elif n == 'calle':
            quad('pb_piso_banqueta', 'banqueta', x, -1.6, x1, 0, prio=.5); quad('pb_piso_calle', 'calle', x, z, x1, -1.6, prio=.35)
        elif n == 'escalera':
            quad_hueco('pb_piso_cuarto', 'cuarto', x, z, x1, z1)
        else: quad('pb_piso_cuarto', 'cuarto', x, z, x1, z1)

def techos():
    for x, z, w, d, k, tin, n in N['areas']:
        if k is None or (k == 'open' and n.startswith('corredor')):
            (quad_hueco if n == 'escalera' and N['sube'] else quad)('pb_techo', 'techo', x, z, x + w, z + d, K['H'] - .02, arriba=False, prio=.9)

def escalera(): escalera_u('pb', 'n0')   # escalera en U (blender/casona_esc.py)

def aire_libre(x, z):
    """1 si la mesa queda al aire libre (patio, azotea): MESA no le cuelga lámpara (extra aire del empty)."""
    for ax, az, w, d, k, tin, n in N['areas']:
        if ax < x < ax + w and az < z < az + d: return int(k == 'open' and not n.startswith('corredor'))
    return 0

def marcas():
    for g in N['gaps']:
        if g[4]: vacio('puerta_%s_n0' % g[4], (g[0] + g[2]) / 2, 0, (g[1] + g[3]) / 2)
    for g, mx, mz, r, libre in N['mesas']:
        vacio('mesa_' + g, mx, 1.55, mz, juego=g, fam='f' if libre else C.FAM.get(g, 'k'), libre=libre, r=r, aire=aire_libre(mx, mz))
    vacio('llegada_n0', LLEGADA[0], 0, LLEGADA[1])
    vacio('llegada_escalera_n0', C.ESC['llegada'][0], 0, C.ESC['llegada'][1])                       # paso 4: llegada desde otro nivel y planos "Ir a"
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
    traspatio_noche()

def arbotante(x, z, nx, nz, y0=3.0, E=70):
    """Arbotante en el muro (su línea lo esconde con el corte) y su luz puntual para el horneado."""
    h = K['t'] / 2; e = 'h' if nx == 0 else 'v'; L, u = (z, x) if e == 'h' else (x, z)
    base, lid = linea_de(e, L, u); n = base + '_arb'; bm = bmn(n, 'arbotante', luz=False); ex(n, linea=lid)
    o = (nz if e == 'h' else nx)
    caja_l(bm, e, L, u - .15, u + .15, y0, y0 + .4, o * h, o * (h + .14)) if o > 0 else caja_l(bm, e, L, u - .15, u + .15, y0, y0 + .4, o * (h + .14), o * h)
    LUCES.append(('POINT', (x + nx * .55, y0 + .25, z + nz * .55), E, .12))

def guirnalda(pre, A, Bp, caida=.45, paso=.7, cada=3, E=16):
    """Cable con focos de A a Bp (plano: x, alto, z) que cuelga 'caida' al centro; una luz puntual cada 'cada' focos (horneado de noche)."""
    CB, FO = bmn(pre + '_cable', 'hierro', luz=False), bmn(pre + '_focos', 'foco', luz=False)
    n = max(2, round(math.dist(A, Bp) / paso)); pts = []
    for i in range(n + 1):
        t = i / n; pts.append((A[0] + (Bp[0] - A[0]) * t, A[1] + (Bp[1] - A[1]) * t - caida * 4 * t * (1 - t), A[2] + (Bp[2] - A[2]) * t))
    for p, q in zip(pts, pts[1:]): tubo(CB, p, q, .01, .01, 4)
    for i, (x, y, z) in enumerate(pts[1:-1], 1):
        tubo(CB, (x, y, z), (x, y - .06, z), .014, .014, 6)
        bmesh.ops.create_icosphere(FO, subdivisions=1, radius=.05, matrix=Matrix.Translation(V(x, y - .11, z)) @ Matrix.Diagonal((1, 1, 1.3, 1)))
        if i % cada == 0: LUCES.append(('POINT', (x, y - .24, z), E, .05))   # abajo del foco (adentro lo tapaba)

def farolito(pre, x, y, z, E=45):
    """Farol chico de hierro sobre un pretil o una barda (y = su tapa)."""
    HI, FA = bmn(pre + '_hierro', 'hierro', luz=False), bmn(pre, 'farol', luz=False)
    caja(HI, x - .1, x + .1, y, y + .04, z - .1, z + .1); caja(FA, x - .08, x + .08, y + .04, y + .32, z - .08, z + .08)
    for dx in (-.085, .085):
        for dz in (-.085, .085): caja(HI, x + dx - .012, x + dx + .012, y + .04, y + .32, z + dz - .012, z + dz + .012)
    caja(HI, x - .12, x + .12, y + .32, y + .36, z - .12, z + .12); tubo(HI, (x, y + .36, z), (x, y + .44, z), .04, .01, 6)
    LUCES.append(('POINT', (x, y + .52, z), E, .08))   # arriba del sombrerete (adentro la caja la tapaba)

# ---------- ayudantes de decoración (los usan casona_pb_deco.py, casona_pa_deco.py y casona_sm.py) ----------
COLOR.update(marco=(.62, .46, .2), lienzo=(.82, .76, .62), cielo=(.42, .56, .66), campo=(.36, .46, .26), fondo_c=(.16, .12, .1), figura=(.62, .4, .3),
             tela_s=(.42, .2, .16), tela_v=(.2, .32, .26), pantalla=(.9, .8, .6), laton=(.7, .52, .22), filo=(.6, .45, .2))
PRIO_MAT.update(marco=.5, lienzo=.5, cielo=.5, campo=.5, fondo_c=.5, figura=.5, laton=.5, filo=.5)
EMITE['pantalla'] = 4
def cuadro(pre, x, y, z, w, h, nx, nz, tipo=0):
    """Cuadro colgado: (x, y, z) = centro sobre la cara del muro; (nx, nz) = hacia el cuarto. tipo 0 paisaje, 1 retrato, 2 bodegón."""
    MA, LI = bmn(pre + '_marco', 'marco', prio=.5), bmn(pre + '_lienzo', 'lienzo' if tipo == 2 else ('cielo' if tipo == 0 else 'fondo_c'), prio=.5)
    def pz(a0, a1, d0, d1):   # caja de u (a lo largo del muro) por y y profundidad desde la cara
        if nz: caja_b = (x + a0, x + a1, min(z + nz * d0, z + nz * d1), max(z + nz * d0, z + nz * d1)); return caja_b
        return (min(x + nx * d0, x + nx * d1), max(x + nx * d0, x + nx * d1), z + a0, z + a1)
    def cj(bm, a0, a1, y0, y1, d0, d1):
        x0, x1, z0, z1 = pz(a0, a1, d0, d1); caja(bm, x0, x1, y0, y1, z0, z1)
    cj(MA, -w / 2, w / 2, y - h / 2, y + h / 2, 0, .05); cj(LI, -w / 2 + .08, w / 2 - .08, y - h / 2 + .08, y + h / 2 - .08, .05, .06)
    if tipo == 0:   # campo abajo y una loma
        cj(bmn(pre + '_campo', 'campo', prio=.5), -w / 2 + .08, w / 2 - .08, y - h / 2 + .08, y - h * .05, .06, .065)
        cj(bmn(pre + '_campo', 'campo', prio=.5), -w * .1, w / 2 - .08, y - h * .05, y + h * .1, .06, .065)
    elif tipo == 1:   # busto
        cj(bmn(pre + '_figura', 'figura', prio=.5), -w * .2, w * .2, y - h / 2 + .08, y - h * .1, .06, .065)
        cj(bmn(pre + '_figura', 'figura', prio=.5), -w * .1, w * .1, y - h * .1, y + h * .2, .06, .065)
    else:           # jarra y frutas
        cj(bmn(pre + '_figura', 'barro', prio=.5), -w * .25, -w * .05, y - h / 2 + .1, y + h * .1, .06, .065)
        cj(bmn(pre + '_campo', 'campo', prio=.5), .0, w * .25, y - h / 2 + .1, y - h * .2, .06, .065)

def maceton(pre, x, z, s=1.0, obs=None):
    """Macetón de barro con mata de hojas (s = escala)."""
    MT, HO = bmn(pre + '_macetas', 'barro'), bmn(pre + '_macetas_hojas', 'copa')
    tubo(MT, (x, 0, z), (x, .7 * s, z), .3 * s, .4 * s, 14); anillo(MT, x, z, .32 * s, .44 * s, .7 * s, .78 * s, 14)
    for k in range(6):
        a = k * 2 * math.pi / 6 + s
        bmesh.ops.create_icosphere(HO, subdivisions=1, radius=.34 * s, matrix=Matrix.Translation(V(x + math.cos(a) * .22 * s, (1.02 + .14 * (k % 2)) * s, z + math.sin(a) * .22 * s)) @ Matrix.Diagonal((1, 1, .8, 1)))
    bmesh.ops.create_icosphere(HO, subdivisions=1, radius=.3 * s, matrix=Matrix.Translation(V(x, 1.3 * s, z)))
    if obs is not None: obs += T(x, z) + [.5 * s]

def tapete_r(pre, x0, z0, x1, z1, mat='tapete', y=.012):
    """Tapete rectangular con filo de otro color."""
    quad(pre + '_tapete_filo', 'filo', x0, z0, x1, z1, y, prio=.4); quad(pre + '_tapete_' + mat, mat, x0 + .14, z0 + .14, x1 - .14, z1 - .14, y + .003, prio=.4)

def sillon(pre, x, z, ang, tela='tela_s', obs=None):
    """Sillón de una plaza; ang = hacia dónde mira (0 = +z del plano)."""
    MA, TE = bmn(pre + '_sillon_mad', 'madera'), bmn(pre + '_sillon_' + tela, tela)
    f, r = (math.sin(ang), math.cos(ang)), (math.cos(ang), -math.sin(ang))
    P_ = lambda lx, y, lz: (x + r[0] * lx + f[0] * lz, y, z + r[1] * lx + f[1] * lz)
    blq = lambda bm, c, a, b, d: bloque(bm, c, (r[0] * a, 0, r[1] * a), (0, b, 0), (f[0] * d, 0, f[1] * d))
    for sx in (-.38, .38):
        for sz in (-.32, .32): tubo(MA, P_(sx, 0, sz), P_(sx, .3, sz), .04, .04, 6)
    blq(TE, P_(0, .45, 0), .44, .15, .4)                  # asiento
    blq(TE, P_(0, 1.0, -.36), .44, .45, .08)              # respaldo
    for sx in (-.44, .44): blq(TE, P_(sx, .72, 0), .07, .14, .42)   # brazos
    if obs is not None: obs += T(x, z) + [.55]

def lampara_pie(pre, x, z, E=60, alto=2.4):
    """Lámpara de pie con pantalla que brilla (luz en el horneado de noche)."""
    HI, PA = bmn(pre + '_lampara_pie', 'hierro', luz=False), bmn(pre + '_pantalla', 'pantalla', luz=False)
    tubo(HI, (x, 0, z), (x, .04, z), .2, .2, 12); tubo(HI, (x, .04, z), (x, alto - .3, z), .025, .025, 6)
    tubo(PA, (x, alto - .35, z), (x, alto, z), .3, .18, 14)
    LUCES.append(('POINT', (x, alto - .5, z), E, .1))

# R2: de noche el traspatio quedaba a oscuras (los arbotantes del muro de atrás miran a la casa): arbotantes del lado del traspatio,
# dos postes de madera y guirnaldas de focos en zigzag del muro a los postes (libran el mamey y el pozo)
POSTES_T = [(10.5, 46.8), (25.5, 46.8)]
def traspatio_noche():
    for x in (4, 11, 25, 34): arbotante(x, 34, 0, 1)
    MA = bmn('pb_traspatio_postes', 'madera', prio=.5); obs = []
    for px, pz in POSTES_T:
        caja(MA, px - .09, px + .09, 0, 3.5, pz - .09, pz + .09); caja(MA, px - .3, px + .3, 3.38, 3.46, pz - .05, pz + .05); obs += T(px, pz) + [.3]
    ex('pb_traspatio_postes', obs=obs)
    (a, b), (c, d) = POSTES_T
    for A, Bp in (((9, 4.0, 34.25), (a, 3.4, b)), ((18, 4.0, 34.25), (a, 3.4, b)), ((18, 4.0, 34.25), (c, 3.4, d)), ((27, 4.0, 34.25), (c, 3.4, d)),
                  ((a, 3.4, b), (c, 3.4, d))):
        guirnalda('pb_guirnalda', A, Bp, .5)

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
    d = Vector(C.SOL).normalized()   # el mismo sol que CIELO.dia (casona.py SOL)
    so.rotation_euler = Vector((d.x, -d.z, d.y)).to_track_quat('-Z', 'Y').to_euler()
    w = sc.world or bpy.data.worlds.new('cielo'); sc.world = w
    try: w.use_nodes = True
    except Exception: pass
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs[0].default_value = (.6, .72, .9, 1); bg.inputs[1].default_value = .55

def noche(sc):
    """Pasa la escena a noche: la luna (C.LUNA) en lugar del sol, azul y suave, cielo oscuro; las lámparas siguen igual."""
    so = bpy.data.objects.get('sol')
    if so:
        so.data.energy = .22; so.data.color = (.62, .72, 1); so.data.angle = math.radians(10)
        d = Vector(C.LUNA).normalized(); so.rotation_euler = Vector((d.x, -d.z, d.y)).to_track_quat('-Z', 'Y').to_euler()
    w = sc.world
    if w and w.node_tree:
        bg = next((n for n in w.node_tree.nodes if n.type == 'BACKGROUND'), None)
        if bg: bg.inputs[0].default_value = (.05, .07, .14, 1); bg.inputs[1].default_value = .25

def hornear_noche(sc, obs, res, mu):
    """Segundo horneado con las mismas UV: NOM_luz_noche.webp (CMAT la usa cuando CIELO está de noche)."""
    noche(sc); img = hornear(sc, obs, res, mu); guardar(img, ruta=os.path.join(SAL, NOM + '_luz_noche.webp'))

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

def deco():   # paso 9: cocina, despensa, servicio y baño (blender/casona_pb_deco.py, con los ayudantes de este archivo)
    exec(open(os.path.join(DIR, 'blender', 'casona_plantas.py'), encoding='utf-8').read(), globals())     # matas, hojas y zacate
    exec(open(os.path.join(DIR, 'blender', 'casona_pb_deco.py'), encoding='utf-8').read(), globals()); decorar()

exec(open(os.path.join(DIR, 'blender', 'casona_esc.py'), encoding='utf-8').read(), globals())   # escalera_u, quad_hueco

def armar():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    sc = bpy.context.scene; motor(sc)
    muros(); arqueria(); columnas(); patio(); hamaca(); frente(); traspatio(); deco(); pisos(); techos(); escalera(); marcas(); lamparas()
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

VISTAS_MAS = True   # vistas de los cuartos decorados (comedor, cuarto libre, corredor del oriente)
def vistas(sc, carpeta):
    vista(sc, os.path.join(carpeta, 'pb_salon.png'), (9, 11, -6), (9, 0, 5), ('pb_muro_h0_', 'pb_techo'))
    vista(sc, os.path.join(carpeta, 'pb_patio.png'), (18, 12, 9), (18, 0, 22), ('pb_muro_h0_', 'pb_muro_h100_', 'pb_dintel_h140', 'pb_techo'))
    vista(sc, os.path.join(carpeta, 'pb_todo.png'), (18, 34, -16), (18, 0, 17), ('pb_muro_h0_', 'pb_techo'))
    if VISTAS_MAS:
        vista(sc, os.path.join(carpeta, 'pb_comedor.png'), (28, 11, -6), (28, 0, 5), ('pb_muro_h0_', 'pb_techo'))
        vista(sc, os.path.join(carpeta, 'pb_libre.png'), (14, 10, 28), (3, 0, 28), ('pb_muro_v80_', 'pb_muro_v120_', 'pb_techo', 'pb_corr'))
        vista(sc, os.path.join(carpeta, 'pb_corr_e.png'), (19, 7, 22), (27, 0, 22), ('pb_techo', 'arbol', 'pb_arbol'))

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
        mn = o.data.materials[0].name if o.data.materials else ''
        s = PRIO.get(o.name, 1) * PRIO_MAT.get(mn, 1) * (float(os.environ.get('R4_DECO', 1)) if mn not in ARQ else 1)
        ly = o.data.uv_layers['luz'].data
        for p in o.data.polygons:
            c = o.matrix_world @ p.center; n = p.normal; x, z = c.x + 18, c.y + 17
            f = FUERA if (x < .05 and n.x < -.7) or (x > 35.95 and n.x > .7) or (z > 47.95 and n.y > .7) else 1
            if s * f != 1:
                for i in p.loop_indices: ly[i].uv = ly[i].uv * (s * f)
    def empaca():
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.pack_islands(rotate=True, margin_method='FRACTION', margin=float(os.environ.get('R4_MARGEN', .001)), shape_method=os.environ.get('R4_FORMA', 'CONCAVE'))
        bpy.ops.object.mode_set(mode='OBJECT')
    empaca()
    mt = int(os.environ.get('R4_MIN_TX', MIN_TX))
    if mt: ancho_min(obs, K['RES'], mt); empaca()   # R4: las islas delgadas se estiran a lo ancho y se reempaca
    for o in obs: o.data.uv_layers.active = o.data.uv_layers[0]

# R4 (horneado en bloques): la mitad de las caras (cantos de muro, molduras, jambas, bajo los dinteles) quedaba con un lado de
# 1-2 texeles: su luz salía de un solo texel mezclado con el relleno del atlas (bloques en dinteles, cantos y rincones).
# ancho_min estira cada isla a lo ancho (eje menor) hasta MIN_TX texeles; a lo largo no cambia, así cuesta poco atlas.
MIN_TX = 4
def ancho_min(obs, res, minimo):
    n_is = n_est = 0
    for o in obs:
        bm = bmesh.new(); bm.from_mesh(o.data); uv = bm.loops.layers.uv['luz']; bm.faces.ensure_lookup_table()
        padre = list(range(len(bm.faces)))
        def raiz(i):
            while padre[i] != i: padre[i] = padre[padre[i]]; i = padre[i]
            return i
        for e in bm.edges:
            if len(e.link_faces) != 2: continue
            f1, f2 = e.link_faces; ok = True
            for v in e.verts:
                a = next(l[uv].uv for l in f1.loops if l.vert == v); b = next(l[uv].uv for l in f2.loops if l.vert == v)
                if (a - b).length > 1e-6: ok = False; break
            if ok: padre[raiz(f1.index)] = raiz(f2.index)
        islas = {}
        for f in bm.faces: islas.setdefault(raiz(f.index), []).append(f)
        for caras in islas.values():
            ls = [l for f in caras for l in f.loops]; pts = [l[uv].uv.copy() for l in ls]
            cx = sum(p.x for p in pts) / len(pts); cy = sum(p.y for p in pts) / len(pts)
            sxx = sum((p.x - cx) ** 2 for p in pts); syy = sum((p.y - cy) ** 2 for p in pts); sxy = sum((p.x - cx) * (p.y - cy) for p in pts)
            ang = .5 * math.atan2(2 * sxy, sxx - syy); ux, uy = math.cos(ang), math.sin(ang); vx, vy = -uy, ux   # u: eje mayor
            pu = [(p.x - cx) * ux + (p.y - cy) * uy for p in pts]; pv = [(p.x - cx) * vx + (p.y - cy) * vy for p in pts]
            wu, wv = (max(pu) - min(pu)) * res, (max(pv) - min(pv)) * res; n_is += 1
            k = [1, 1]
            if wv < minimo and wv > 1e-4: k[1] = min(minimo / wv, 8)
            if wu < minimo and wu > 1e-4: k[0] = min(minimo / wu, 8)
            if k == [1, 1]: continue
            n_est += 1
            for l, a, b in zip(ls, pu, pv):
                a *= k[0]; b *= k[1]; l[uv].uv = (cx + a * ux + b * vx, cy + a * uy + b * vy)
        bm.to_mesh(o.data); bm.free()
    print('ancho_min: %d de %d islas estiradas a %d texeles' % (n_est, n_is, minimo), flush=True)

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

def _dilatar(c, ok, n=6):
    """R4: cada texel del hueco toma el promedio de sus vecinos ya llenos, anillo por anillo (la isla más cercana). El push-pull
    solo, con bloques de 2x2, 4x4..., mezclaba en la orilla de una isla la luz de la isla vecina del atlas (otra pieza): la
    lectura bicúbica tomaba esos texeles en cantos, dinteles y rincones. Sin vuelta de orilla (np.roll recortado)."""
    import numpy as np
    c = c * ok[..., None]; ok = ok.copy()
    def sh(a, d, ax):
        b = np.roll(a, d, ax); i = [slice(None)] * a.ndim; i[ax] = slice(0, 1) if d > 0 else slice(-1, None); b[tuple(i)] = 0; return b
    for _ in range(n):
        acc = np.zeros_like(c); m = np.zeros(ok.shape, np.float32)
        for ax in (0, 1):
            for d in (1, -1): v = sh(ok, d, ax); acc += sh(c, d, ax) * v[..., None]; m += v
        nu = ~ok & (m > 0)
        if not nu.any(): break
        c[nu] = acc[nu] / m[nu][:, None]; ok |= nu
    return c, ok

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
    c, ok = _dilatar(c, cara); a[:, :, :3] = _pp(c * ok[..., None], ok.astype(np.float32)); a[:, :, 3] = 1   # R4: anillos y luego push-pull lejos
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
    n = pix(nrm); vac = n[:, :, :3].sum(2) < 1e-4; n[:, :, :3] = n[:, :, :3] * 2 - 1; d3, ok3 = _dilatar(n[:, :, :3], ~vac); n[:, :, :3] = d3; n[~ok3, :3] = (0, 0, 1)
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
CAM_PRUEBA = [((17, 9.5, -4), (10, 1.5, 6), ('pb_muro_h0_', 'pb_techo')), ((20.3, 4.2, 1.2), (16, 2.6, 6.5), ('pb_techo',)),
              ((18.5, 1.6, 2.2), (18.5, 3.2, 9.5), ('pb_techo',)), ((12, 1.6, 7.6), (4, 2, 1.5), ('pb_techo',)), ((19.6, 1.6, 6.5), (15.5, 2.6, 4.5), ('pb_techo',))]   # R4: de cerca, a la altura de los ojos

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
            uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'luz'; tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = li; tx.interpolation = 'Cubic'
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
        if 'sin_noche' not in arg: hornear_noche(sc, obs, res, mu)
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(DIR, 'blender', 'casona_pb.blend'))
    elif acc == 'prueba':     # hornea solo zaguán y salón con los ajustes nuevos y los compara con 'antes'
        car = arg[1]; res = int(arg[2]) if len(arg) > 2 else K['RES']; mu = int(arg[3]) if len(arg) > 3 else K['SAMPLES']
        uv_luz(obs); solo = region(obs); print('prueba:', len(solo), 'mallas')
        img = hornear(sc, obs, res, mu, solo=solo); luz = os.path.join(car, 'luz_nueva.webp'); guardar(img, ruta=luz)
        previa(sc, solo, luz, car, 'despues'); comparar(car)
        if 'juego' in arg: guardar(img); exportar(col)   # para verla en el juego (resto de la planta sin hornear); no subir
    elif acc == 'uvs':        # R4: solo desenvuelve y diagnostica (sin hornear)
        exec(open(os.path.join(DIR, 'blender', 'luz_diag.py'), encoding='utf-8').read(), globals()); uv_luz(obs); densidad(obs, K['RES'])
    elif acc == 'exportar':
        exportar(col)
