# blender/casona_az.py — Azotea detallada de la casona (CASONA.md paso 7) con luz horneada.
# Usa blender/casona_pb.py como biblioteca sobre NIV['n2'] de blender/casona.py; los nombres salen con prefijo az_.
# Enladrillado con pretil de cal y cornisa de cantera; pérgola alta de madera con bugambilia sobre el Rummy (piso de mosaico);
# Conecta 4 junto al pretil; cubo de la escalera con su tapa; tinacos sobre su base; tendedero con ropa; macetas; banca en el mirador;
# barandal de pilastras y herrería al vacío del patio y, abajo, copia ligera de la planta alta (arcos rebajados, barandal) y del patio
# (arcos, columnas, árbol). Las mesas las pone el código (CAJA). Exporta modelos/casona/az.glb y az_luz.webp. Sin tocar el archivo abierto:
#   blender -b --factory-startup --python blender/casona_az.py -- vista [carpeta]
#   blender -b --factory-startup --python blender/casona_az.py -- hornear [res] [muestras]
import bpy, bmesh, math, os, sys, types

def _raiz():
    for d in ([os.path.dirname(os.path.dirname(os.path.abspath(__file__)))] if '__file__' in globals() else []) + [os.getcwd()]:
        if os.path.isfile(os.path.join(d, 'blender', 'casona.py')): return d
    raise SystemExit('correr blender.exe desde la carpeta del repo')
DIR = _raiz()
src = open(os.path.join(DIR, 'blender', 'casona_pb.py'), encoding='utf-8').read()
src = src.replace("'pb_", "'az_").replace("'pb.glb'", "'az.glb'").replace("'casona_pb.blend'", "'casona_az.blend'")
P = types.ModuleType('casona_pb_lib'); P.__file__ = os.path.join(DIR, 'blender', 'casona_pb.py'); exec(src, P.__dict__)
C = P.C
N = dict(C.NIV['n2']); N['wins'] = []; N['barda'] = (0, 0, 0, 0)
N['per'] = (0, 10, 8, 7)          # el único cuarto es el cubo de la escalera; la orilla del lote lleva pretil (pretiles())
P.N = N
K = P.K; K.update(H=N['H'], LAM=.4, ROD=.06, RES=2048, SAMPLES=320)
H = K['H']
P.ARCOS = {}
P.NOM = 'az'
P.COLOR.update(ladrillo=(.62, .34, .22), zoclo=(.5, .47, .44), tinaco=(.12, .12, .13), cemento=(.55, .53, .5), flor=(.72, .16, .42),
               ropa_b=(.88, .87, .82), ropa_a=(.32, .46, .66), ropa_r=(.72, .38, .28), ropa_v=(.46, .56, .36), duela=(.48, .3, .18))
P.PRIO_MAT.update(ladrillo=1.2, corredor=1.2)
bmn, ex, vacio, caja, caja_l, prisma, quad, disco, tubo, T = P.bmn, P.ex, P.vacio, P.caja, P.caja_l, P.prisma, P.quad, P.disco, P.tubo, P.T
REMAP = dict(lambrin='zoclo', rod='zoclo')
PRET, PERG = C.K['pretil'], C.PERG
ABAJO1, ABAJO0 = C.NIV['n1']['elev'] - N['elev'], -N['elev']    # pisos de la planta alta (-4.5) y del patio (-10.3)
h = K['t'] / 2

def renombrar(viejo, nuevo, prio=.5):
    """Mueve las mallas ya armadas de un prefijo a otro, sin choques ni corte (lo de abajo no se toca)."""
    for k in [k for k in P.B if k.startswith(viejo)]:
        d = P.B.pop(k); n = nuevo + k[len(viejo):]
        for q in ('linea', 'obs', 'segs', 'r'): d['ex'].pop(q, None)
        P.B[n] = d; P.PRIO[n] = prio
        if k in P.SIN_LUZ: P.SIN_LUZ.discard(k); P.SIN_LUZ.add(n)

# ---------- abajo: la planta alta y el patio, vistos por el vacío ----------
def arco_rebajado(c0, c1, s, f, n=14):
    a = (c1 - c0) / 2; R = (a * a + f * f) / (2 * f); cy = s + f - R; t = math.asin(a / R); cx = (c0 + c1) / 2
    return [(cx - R * math.sin(t - 2 * t * i / n), cy + R * math.cos(t - 2 * t * i / n)) for i in range(1, n)]

def alta_abajo():
    """Corredor alto (casona_pa.py): arcos rebajados sobre las columnas y barandal; detrás, sus muros y su piso."""
    s, cw, o, f, hb = 2.9, K['COL'] / 2, .22, .75, C.K['barandal']; HN = C.NIV['n1']['H']
    for e, L in (('h', 14), ('v', 12), ('v', 24)):
        cs = sorted({(cx if e == 'h' else cz) for cx, cz in C.COLS if (cz if e == 'h' else cx) == L})
        p = [(cs[-1] + cw, HN), (cs[0] - cw, HN), (cs[0] - cw, s)]
        for c0, c1 in zip(cs, cs[1:]): p += [(c0 + cw, s)] + arco_rebajado(c0 + cw, c1 - cw, s, f) + [(c1 - cw, s)]
        p += [(cs[-1] + cw, s)]
        prisma(bmn('az_abajo1_arco_%s%d' % (e, L * 10), 'muro', prio=.5), e, L, P.limpio(p), -o, o)
        caja_l(bmn('az_abajo1_arco_cor', 'cantera', prio=.4), e, L, cs[0] - cw - .1, cs[-1] + cw + .1, HN - .2, HN + .03, -o - .1, o + .1)
        HI, PM = bmn('az_abajo1_barandal', 'hierro', luz=False), bmn('az_abajo1_pasamanos', 'madera', prio=.3)
        for c0, c1 in zip(cs, cs[1:]):
            u0, u1 = c0 + cw, c1 - cw; nb = max(2, int((u1 - u0) / .3))
            for k in range(1, nb): uu = u0 + k * (u1 - u0) / nb; caja_l(HI, e, L, uu - .016, uu + .016, .1, hb - .08, -.016, .016)
            caja_l(PM, e, L, u0, u1, hb - .08, hb, -.07, .07)
    CO = bmn('az_abajo1_columnas', 'cantera', prio=.4)
    for cx, cz in C.COLS:
        if cz < 30:
            caja(CO, cx - .34, cx + .34, 0, .36, cz - .34, cz + .34); tubo(CO, (cx, .36, cz), (cx, s - .3, cz), .23, .2, 12)
            caja(CO, cx - .32, cx + .32, s - .3, s, cz - .32, cz + .32)
    for x0, z0, x1, z1 in ((8, 10, 28, 14), (8, 14, 12, 30), (24, 14, 28, 30)): quad('az_abajo1_corredor', 'corredor', x0, z0, x1, z1, prio=.25)
    M = bmn('az_abajo1_pared', 'muro', prio=.25)
    caja(M, 8, 28, 0, HN, 9.85, 10); caja(M, 7.85, 8, 0, HN, 10, 30); caja(M, 28, 28.15, 0, HN, 10, 30)
    caja(bmn('az_abajo1_fondo', 'muro', prio=.4), 12, 24, -.3, HN + .3, 30 - h, 30 + h)          # muro de atrás de la alta, sobre los arcos del patio
    LB = bmn('az_abajo1_losa', 'cantera', prio=.3)
    caja(LB, 12, 24, -.3, 0, 13.9, 14); caja(LB, 11.9, 12, -.3, 0, 14, 30); caja(LB, 24, 24.1, -.3, 0, 14, 30)

def patio_abajo():
    """Patio de la planta baja (casona_pb.py): arquería, columnas, árbol, arriate, macetas, laja y corredores."""
    P.arqueria(); renombrar('az_dintel_', 'az_abajo0_arco_')
    P.columnas(); renombrar('az_columnas', 'az_abajo0_columnas')
    P.patio(); renombrar('az_arbol', 'az_abajo0_arbol'); renombrar('az_arriate', 'az_abajo0_arriate'); renombrar('az_macetas', 'az_abajo0_macetas')
    quad('az_abajo0_laja', 'laja', 12, 14, 24, 30, prio=.6)
    for x0, z0, x1, z1 in ((8, 10, 28, 14), (8, 14, 12, 30), (24, 14, 28, 30), (8, 30, 28, 34)): quad('az_abajo0_corredor', 'corredor', x0, z0, x1, z1, prio=.25)
    M = bmn('az_abajo0_pared', 'muro', prio=.25); hh = K['H']
    caja(M, 8, 28, 0, hh, 9.85, 10); caja(M, 7.85, 8, 0, hh, 10, 34); caja(M, 28, 28.15, 0, hh, 10, 34); caja(M, 8, 28, 0, hh, 34, 34.15)

def abajo():
    V0 = P.V
    H0, S0 = K['H'], K['SPRING']
    try:
        P.V = lambda x, y, z: V0(x, y + ABAJO0, z); K['H'], K['SPRING'] = C.NIV['n0']['H'], 3.1
        patio_abajo()
        P.V = lambda x, y, z: V0(x, y + ABAJO1, z); K['H'] = C.NIV['n1']['H']
        alta_abajo()
    finally:
        P.V = V0; K['H'], K['SPRING'] = H0, S0
    LB = bmn('az_losa_borde', 'cantera')            # canto de la losa de la azotea alrededor del vacío
    caja(LB, 12, 24, -.3, 0, 13.9, 14); caja(LB, 11.9, 12, -.3, 0, 14, 30); caja(LB, 24, 24.1, -.3, 0, 14, 30)

# ---------- pretil de la orilla del lote y barandal al vacío ----------
def pretiles():
    """Pretil de cal de 2.0 con cornisa de cantera. Esquinas: el tramo 'h' las cubre y el 'v' llega a su cara; junto al cubo de la escalera, a la cara del muro."""
    Pt = C.rect(0, 0, 36, 30) - P.W
    for (e, l, i0, i1) in C.tramos(Pt):
        L, u0, u1 = l / 10, i0 / 10, i1 / 10
        a, b = (u0 - h, u1 + h) if e == 'h' else (u0 + h, u1 - h)
        ca, cb = (a - .06, b + .06) if e == 'h' else (a + (.06 if u0 in (0, 30) else 0), b - (.06 if u1 in (0, 30) else 0))
        base = 'az_muro_p%s%d_%d' % (e, l, i0); lid = 'p%s%d_%d' % (e, l, i0); d = P.dv(e)
        caja_l(bmn(base, 'muro'), e, L, a, b, 0, PRET - .12 - d, -h, h)
        caja_l(bmn(base + '_can', 'cantera'), e, L, ca, cb, PRET - .12 - d, PRET - d, -h - .06, h + .06)
        ex(base, linea=lid, segs=P.LT(e, L, u0) + P.LT(e, L, u1), r=round(h + .15, 3)); ex(base + '_can', linea=lid)

def barandal():
    """Al vacío del patio: pilastras de cal sobre las columnas de abajo, guarnición, herrería de 2.0 y pasamanos de cantera."""
    hb, cw = C.K['barandal'], .26
    MU, CA, HI = bmn('az_barandal_pil', 'muro'), bmn('az_barandal_can', 'cantera'), bmn('az_barandal_rej', 'hierro', luz=False); segs = []
    pil = sorted({c for c in C.COLS if c[1] < 30})
    for cx, cz in pil:
        caja(MU, cx - cw, cx + cw, 0, hb + .05, cz - cw, cz + cw); caja(CA, cx - cw - .05, cx + cw + .05, hb + .05, hb + .17, cz - cw - .05, cz + cw + .05)
    for e, L, a, b in (('h', 14, 12, 24), ('v', 12, 14, 30), ('v', 24, 14, 30)):
        cs = sorted({(cx if e == 'h' else cz) for cx, cz in pil if (cz if e == 'h' else cx) == L}) + ([] if e == 'h' else [30 - h + cw])
        for c0, c1 in zip(cs, cs[1:]):
            u0, u1 = c0 + cw, c1 - cw
            caja_l(MU, e, L, u0, u1, 0, .4, -h, h); caja_l(CA, e, L, u0, u1, .4, .48, -h - .03, h + .03)
            caja_l(CA, e, L, u0, u1, hb - .1, hb, -.12, .12)
            nb = max(2, int((u1 - u0) / .2))
            for k in range(1, nb): uu = u0 + k * (u1 - u0) / nb; caja_l(HI, e, L, uu - .016, uu + .016, .48, hb - .1, -.016, .016)
            caja_l(HI, e, L, u0, u1, 1.0, 1.04, -.02, .02)
        segs += P.LT(e, L, a) + P.LT(e, L, b)
    ex('az_barandal_pil', segs=segs, r=.32)

# ---------- pisos, cubo de la escalera ----------
def pisos():
    for x, z, w, d, k, tin, n in N['areas']:
        if k == 'void': continue
        x1, z1 = x + w, z + d
        if n == 'pergola':   # corredor con cenefa de cantera de .5 alrededor (borde con la azotea)
            c = .5; quad('az_piso_corredor', 'corredor', x + c, z + c, x1 - c, z1 - c)
            for a, b, cc, e in ((x, z, x1, z + c), (x, z1 - c, x1, z1), (x, z + c, x + c, z1 - c), (x1 - c, z + c, x1, z1 - c)): quad('az_piso_cenefa', 'cantera', a, b, cc, e)
        elif n == 'escalera':
            P.quad_hueco('az_piso_cuarto', 'cuarto', x, z, x1, z1)
        else: quad('az_piso_ladrillo', 'ladrillo', x, z, x1, z1)

def escalera(): P.escalera_u('az', 'n2', 'muro')   # escalera en U (blender/casona_esc.py)

def cubo():
    """Tapa del cubo de la escalera: cuelga del muro del frente (z=10) para que el corte la esconda con él al entrar."""
    base, lid = P.linea_de('h', 10, 4); o = .12
    caja(bmn('az_muro_tapa', 'muro'), -h, 8 + h, H, H + .25, 10 - h, 17 + h)
    CA = bmn('az_muro_tapa_can', 'cantera')
    for x0, x1, z0, z1 in ((-h - o, 8 + h + o, 10 - h - o, 10 + h), (-h - o, 8 + h + o, 17 - h, 17 + h + o), (-h - o, h, 10 + h, 17 - h), (8 - h, 8 + h + o, 10 + h, 17 - h)):
        caja(CA, x0, x1, H + .25, H + .45, z0, z1)
    techo = P.quad; techo('az_techo', 'techo', 0 + h, 10 + h, 8 - h, 17 - h, H - .02, arriba=False, prio=.3)
    for n in ('az_muro_tapa', 'az_muro_tapa_can', 'az_techo'): ex(n, linea=lid)

# ---------- muebles y decoración ----------
def maceta(MT, HO, mx, mz, s=1.0):
    tubo(MT, (mx, 0, mz), (mx, .75 * s, mz), .3 * s, .42 * s, 14); P.anillo(MT, mx, mz, .34 * s, .46 * s, .75 * s, .84 * s, 14)
    for k in range(5):
        a = k * 2 * math.pi / 5
        bmesh.ops.create_icosphere(HO, subdivisions=1, radius=.38 * s, matrix=P.Matrix.Translation(P.V(mx + math.cos(a) * .26 * s, (1.1 + .13 * (k % 2)) * s, mz + math.sin(a) * .26 * s)) @ P.Matrix.Diagonal((1, 1, .8, 1)))
    return T(mx, mz) + [.6 * s]

def pergola():
    """Postes de 4.4 en las esquinas, dos trabes a lo largo y 11 vigas encima; bugambilia en dos esquinas y sobre las vigas."""
    MA = bmn('az_pergola', 'madera'); x, z, w, d = 0, 0, 16, 10; obs = []
    for a, b in ((x + .4, z + .4), (x + w - .4, z + .4), (x + .4, z + d - .4), (x + w - .4, z + d - .4)):
        caja(bmn('az_pergola_base', 'cantera'), a - .3, a + .3, 0, .4, b - .3, b + .3)
        caja(MA, a - .17, a + .17, .4, PERG, b - .17, b + .17); obs += T(a, b) + [.45]
    for b in (z + .4, z + d - .4): caja(MA, x + .1, x + w - .1, PERG, PERG + .38, b - .14, b + .14)
    for j in range(11): xa = x + .5 + j * 1.5; caja(MA, xa - .08, xa + .08, PERG + .38, PERG + .58, z + .05, z + d - .05)
    ex('az_pergola', obs=obs)
    # sardinel de cantera (.14, con tapa volada) en los lados que dan a la azotea, con una entrada en cada uno
    SA = bmn('az_pergola_sardinel', 'cantera'); segs = []
    for e, L, tramos in (('v', x + w - .25, ((z + .7, z + 3.5), (z + 6.5, z + d))), ('h', z + d - .25, ((x + 8, x + 9), (x + 11.6, x + w - .7)))):
        for u0, u1 in tramos:
            caja_l(SA, e, L, u0, u1, 0, .11, -.2, .2); caja_l(SA, e, L, u0 - .03, u1 + .03, .11, .15, -.23, .23)
            segs += P.LT(e, L, u0) + P.LT(e, L, u1)
    ex('az_pergola_sardinel', segs=segs, r=.25)
    HO, FL = bmn('az_pergola_hojas', 'copa'), bmn('az_pergola_flores', 'flor'); sem = [7]
    def r3(): sem[0] = (sem[0] * 9301 + 49297) % 233280; return sem[0] / 233280
    def mata(cx, y, cz, r, n):
        for k in range(n):
            a = r3() * 6.283; rr = r * (.3 + .7 * r3()); p = P.V(cx + math.cos(a) * rr, y + (r3() - .5) * .5, cz + math.sin(a) * rr)
            bmesh.ops.create_icosphere(HO, subdivisions=1, radius=.24 + .12 * r3(), matrix=P.Matrix.Translation(p) @ P.Matrix.Diagonal((1, 1, .7, 1)))
            if k % 3 == 0: bmesh.ops.create_icosphere(FL, subdivisions=1, radius=.09 + .05 * r3(), matrix=P.Matrix.Translation(p + P.Vector((0, 0, .2))))
    for a, b in ((x + .4, z + d - .4), (x + w - .4, z + d - .4)):             # trepan por los postes del fondo
        for y in (1.2, 2.2, 3.2): mata(a, y, b, .25, 2)
        mata(a, PERG + .55, b, 1.2, 8)
    for xa, ln in ((1.4, 2.2), (14.6, 2.4), (4.4, 1.0), (11.0, 1.2)):         # sobre las vigas, más hacia el fondo
        for k in range(int(ln * 3)): mata(xa, PERG + .62, d - .6 - k * .45, .3, 1)

def tinacos():
    CE, TI = bmn('az_tinacos_base', 'cemento'), bmn('az_tinacos', 'tinaco')
    caja(CE, 29.5, 35.3, 0, .55, 11.4, 14.2)
    obs = []
    for cx in (31.0, 33.8):
        cz = 12.8; tubo(TI, (cx, .55, cz), (cx, 2.45, cz), 1.02, 1.1, 24)
        for y in (.95, 1.5, 2.05): P.anillo(TI, cx, cz, 1.0, 1.12, y - .04, y + .04, 24)
        tubo(TI, (cx, 2.45, cz), (cx, 2.75, cz), 1.1, .55, 24); tubo(TI, (cx, 2.75, cz), (cx, 2.85, cz), .5, .5, 20)
        obs += T(cx, cz) + [1.35]
    HI = bmn('az_tinacos_tubo', 'hierro', luz=False)
    tubo(HI, (32.4, .7, 13.9), (32.4, .7, 14.6), .05, .05, 8); tubo(HI, (32.4, .7, 14.6), (32.4, 0, 14.6), .05, .05, 8)
    ex('az_tinacos', obs=obs)

ROPA = [(19, 26.6, 1.7, 1.25, 'ropa_b'), (19, 28.7, .8, .75, 'ropa_a'), (19, 30.0, .9, .9, 'ropa_r'), (19, 32.4, 1.8, 1.2, 'ropa_b'),
        (20.6, 27.0, .9, .9, 'ropa_v'), (20.6, 28.4, .8, .7, 'ropa_r'), (20.6, 30.6, 1.6, 1.3, 'ropa_a'), (20.6, 33.4, .8, .8, 'ropa_b'),
        (22.2, 26.8, .7, .6, 'ropa_r'), (22.2, 28.6, 1.7, 1.2, 'ropa_v'), (22.2, 31.4, .9, .8, 'ropa_b'), (22.2, 33.2, .8, .9, 'ropa_a')]
def tendedero():
    """Dos postes en T a los lados, tres alambres a 2.6 y ropa colgada."""
    HI = bmn('az_tendedero', 'hierro', luz=False); y = 2.6
    for px in (25.8, 34.8):
        tubo(HI, (px, 0, 20.6), (px, y + .1, 20.6), .05, .05, 8); caja(HI, px - .04, px + .04, y, y + .08, 18.8, 22.4)
    for zz in (19, 20.6, 22.2): caja(HI, 25.8, 34.8, y - .012, y + .012, zz - .012, zz + .012)
    for zz, cx, w, alto, m in ROPA: caja(bmn('az_' + m, m), cx - w / 2, cx + w / 2, y - alto, y - .01, zz - .015, zz + .015)
    ex('az_tendedero', segs=sum((T(26.0, zz) + T(34.6, zz) for zz in (19, 20.6, 22.2)), []), r=.3)

def muebles():
    MT, HO = bmn('az_macetas', 'barro'), bmn('az_macetas_hojas', 'copa'); obs = []
    for mx, mz, s in ((17.2, 9.2, 1), (19, 9.2, 1), (35, 1.2, 1), (35, 3, 1), (16.9, .8, .85), (1.2, 18.0, .9), (7.0, 29.0, .9)):
        obs += maceta(MT, HO, mx, mz, s)
    ex('az_macetas', obs=obs)
    # mirador: banca de cantera contra el pretil del fondo
    CA = bmn('az_banca', 'cantera')
    caja(CA, 1.2, 6.2, .55, .7, 29.0, 29.8)
    for xx in (1.4, 3.7, 6.0): caja(CA, xx - .15, xx + .15, 0, .55, 29.1, 29.7)
    ex('az_banca', segs=T(1.5, 29.4) + T(5.9, 29.4), r=.45)

def deco():   # guirnalda, plantas, calentador solar, gas, lavadero, rejas y antena (blender/casona_az_deco.py)
    exec(open(os.path.join(DIR, 'blender', 'casona_az_deco.py'), encoding='utf-8').read(), globals()); decorar()

def marcas():
    for g in N['gaps']:
        if g[4]: vacio('puerta_%s_n2' % g[4], (g[0] + g[2]) / 2, 0, (g[1] + g[3]) / 2)
    for g, mx, mz, r, libre in N['mesas']:
        vacio('mesa_' + g, mx, 1.55, mz, juego=g, fam='f' if libre else C.FAM.get(g, 'k'), libre=libre, r=r)
    vacio('llegada_n2', C.ESC['llegada'][0], 0, C.ESC['llegada'][1])
    vacio('llegada_escalera_n2', C.ESC['llegada'][0], 0, C.ESC['llegada'][1])
    vacio('plano_escalera_n2', 6.6, 2.7, 16.8, ry=0.0)

def lamparas():
    L_ = P.LUCES
    for x, z, (nx, nz) in ((3, 17, (0, -1)), (0, 12, (1, 0))):        # adentro del cubo de la escalera
        e = 'h' if nx == 0 else 'v'; L, u = (z, x) if e == 'h' else (x, z)
        base, lid = P.linea_de(e, L, u); n = base + '_arb'; bm = bmn(n, 'arbotante', luz=False); ex(n, linea=lid)
        o = (nz if e == 'h' else nx)
        caja_l(bm, e, L, u - .15, u + .15, 2.7, 3.1, o * h, o * (h + .14)) if o > 0 else caja_l(bm, e, L, u - .15, u + .15, 2.7, 3.1, o * (h + .14), o * h)
        L_.append(('POINT', (x + nx * .55, 2.95, z + nz * .55), 55, .12))
    L_.append(('POINT', (4, 3.6, 13.5), 70, .3))

def armar():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    sc = bpy.context.scene; P.motor(sc)
    abajo()                           # primero: usa los nombres de arquería, columnas y patio antes que lo de arriba
    P.muros()
    for d in P.B.values(): d['mat'] = REMAP.get(d['mat'], d['mat'])
    pretiles(); barandal(); pisos(); escalera(); cubo(); pergola(); tinacos(); tendedero(); muebles(); deco(); marcas(); lamparas()
    col = P.coleccion('az'); obs = P.crear(col); P.luces(sc)
    print('az: %d mallas, %d con luz, %d empties' % (len([o for o in col.objects if o.type == 'MESH']), len(obs), len(P.EMP)))
    return sc, col, obs

def vistas(sc, carpeta):
    P.vista(sc, os.path.join(carpeta, 'az_pergola.png'), (8, 12, -7), (8, 1.5, 5))
    P.vista(sc, os.path.join(carpeta, 'az_patio.png'), (18, 14, 4), (18, -6, 22))
    P.vista(sc, os.path.join(carpeta, 'az_todo.png'), (18, 30, -14), (18, 0, 15))

if __name__ == '__main__':
    arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    acc = arg[0] if arg else 'vista'
    sc, col, obs = armar()
    if acc == 'vista':
        vistas(sc, arg[1] if len(arg) > 1 else os.path.join(DIR, 'blender'))
    elif acc == 'hornear':
        res = int(arg[1]) if len(arg) > 1 else K['RES']; mu = int(arg[2]) if len(arg) > 2 else K['SAMPLES']
        P.uv_luz(obs); img = P.hornear(sc, obs, res, mu); P.guardar(img); P.exportar(col)
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(DIR, 'blender', 'casona_az.blend'))
    elif acc == 'exportar':
        P.exportar(col)
