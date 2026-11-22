# blender/casona_pa.py — Planta alta detallada de la casona (CASONA.md paso 5) con luz horneada.
# Usa blender/casona_pb.py como biblioteca (muros con lambrín, puertas, pisos, techos, crear, horneado y exportación) sobre
# NIV['n1'] de blender/casona.py; los nombres salen con prefijo pa_. Biblioteca (Mérida en Venta) con libreros, sala de tableros
# (YuCATÁN) con aparador y mecedoras, antesala, balcones a la calle con herrería, corredor alto con arcos rebajados sobre las
# columnas y barandal de 2.0 al vacío; abajo, por el vacío, una copia ligera del patio (laja, árbol, arriate, macetas y arquería).
# Tu cuarto y sala de música quedan lisos (paso 9). Exporta modelos/casona/pa.glb y pa_luz.jpg (CMAT los arma). Sin tocar el archivo abierto:
#   blender -b --factory-startup --python blender/casona_pa.py -- vista [carpeta]
#   blender -b --factory-startup --python blender/casona_pa.py -- hornear [res] [muestras]
import bpy, bmesh, math, os, sys, types
from mathutils import Vector

def _raiz():   # carpeta del repo: junto a este archivo, o la carpeta actual (blender.exe se corre desde el repo)
    for d in ([os.path.dirname(os.path.dirname(os.path.abspath(__file__)))] if '__file__' in globals() else []) + [os.getcwd()]:
        if os.path.isfile(os.path.join(d, 'blender', 'casona.py')): return d
    raise SystemExit('correr blender.exe desde la carpeta del repo')
DIR = _raiz()
src = open(os.path.join(DIR, 'blender', 'casona_pb.py'), encoding='utf-8').read()
src = src.replace("'pb_", "'pa_").replace("'pb.glb'", "'pa.glb'").replace("'casona_pb.blend'", "'casona_pa.blend'")
P = types.ModuleType('casona_pb_lib'); P.__file__ = os.path.join(DIR, 'blender', 'casona_pb.py'); exec(src, P.__dict__)
C = P.C
N = dict(C.NIV['n1']); N['wins'] = []; N['barda'] = (0, 0, 0, 0); P.N = N
K = P.K; K.update(H=N['H'], SPRING=2.9, RES=2048, SAMPLES=320)
P.ARCOS = dict(biblioteca=3.9, tableros=3.9)
P.COLOR.update(duela=(.48, .3, .18), libros=(.5, .32, .26), cajas=(.55, .26, .2), losa=(.7, .66, .6))
ABAJO = -C.NIV['n1']['elev']          # el piso del patio visto desde arriba
ARBOL = P.ARBOL
bmn, ex, vacio, caja, caja_l, prisma, quad, disco, tubo, T = P.bmn, P.ex, P.vacio, P.caja, P.caja_l, P.prisma, P.quad, P.disco, P.tubo, P.T

def renombrar(viejo, nuevo, prio=.5):
    """Mueve las mallas ya armadas de un prefijo a otro, sin choques ni corte (lo de abajo no se toca)."""
    for k in [k for k in P.B if k.startswith(viejo)]:
        d = P.B.pop(k); n = nuevo + k[len(viejo):]
        for q in ('linea', 'obs', 'segs', 'r'): d['ex'].pop(q, None)
        P.B[n] = d; P.PRIO[n] = prio
        if k in P.SIN_LUZ: P.SIN_LUZ.discard(k); P.SIN_LUZ.add(n)

# ---------- abajo: el patio de la planta baja, visto por el vacío ----------
def abajo():
    V0 = P.V; P.V = lambda x, y, z: V0(x, y + ABAJO, z)
    H0, S0 = K['H'], K['SPRING']; K['H'], K['SPRING'] = C.NIV['n0']['H'], 3.1
    try:
        P.arqueria(); renombrar('pa_dintel_', 'pa_abajo_arco_')
        P.columnas(); renombrar('pa_columnas', 'pa_abajo_columnas')
        P.patio(); renombrar('pa_arbol', 'pa_abajo_arbol'); renombrar('pa_arriate', 'pa_abajo_arriate'); renombrar('pa_macetas', 'pa_abajo_macetas')
        quad('pa_abajo_laja', 'laja', 12, 14, 24, 30, prio=.6)
        for x0, z0, x1, z1 in ((8, 10, 28, 14), (8, 14, 12, 30), (24, 14, 28, 30), (8, 30, 28, 34)): quad('pa_abajo_corredor', 'corredor', x0, z0, x1, z1, prio=.3)
        M = bmn('pa_abajo_pared', 'muro', prio=.3); h = K['H']   # fondo de los corredores de abajo: se ve entre los arcos
        caja(M, 8, 28, 0, h, 9.85, 10); caja(M, 7.85, 8, 0, h, 10, 34); caja(M, 28, 28.15, 0, h, 10, 34); caja(M, 8, 28, 0, h, 34, 34.15)
    finally:
        P.V = V0; K['H'], K['SPRING'] = H0, S0
    # canto de la losa alrededor del vacío
    LB = bmn('pa_losa_borde', 'cantera')
    caja(LB, 12, 24, -.35, 0, 13.9, 14); caja(LB, 11.9, 12, -.35, 0, 14, 30); caja(LB, 24, 24.1, -.35, 0, 14, 30)

# ---------- corredor alto: arcos rebajados sobre las columnas, barandal al vacío ----------
def arco_rebajado(c0, c1, s, f, n=14):
    a = (c1 - c0) / 2; R = (a * a + f * f) / (2 * f); cy = s + f - R; t = math.asin(a / R); cx = (c0 + c1) / 2
    return [(cx - R * math.sin(t - 2 * t * i / n), cy + R * math.cos(t - 2 * t * i / n)) for i in range(1, n)]

def arqueria():
    s, cw, o, f = K['SPRING'], K['COL'] / 2, .22, .75
    for e, L in (('h', 14), ('v', 12), ('v', 24)):
        H = K['H'] - P.dv(e)
        cs = sorted({(cx if e == 'h' else cz) for cx, cz in C.COLS if (cz if e == 'h' else cx) == L})
        base = 'pa_dintel_%s%d' % (e, L * 10); lid = 'a%s%d' % (e, L * 10)
        p = [(cs[-1] + cw, H), (cs[0] - cw, H), (cs[0] - cw, s)]
        for c0, c1 in zip(cs, cs[1:]): p += [(c0 + cw, s)] + arco_rebajado(c0 + cw, c1 - cw, s, f) + [(c1 - cw, s)]
        p += [(cs[-1] + cw, s)]
        prisma(bmn(base, 'muro'), e, L, P.limpio(p), -o, o)
        caja_l(bmn(base + '_cor', 'cantera'), e, L, cs[0] - cw - .1, cs[-1] + cw + .1, H - .2, K['H'] + .03 - P.dv(e), -o - .1, o + .1)
        ex(base, linea=lid); ex(base + '_cor', linea=lid)

def barandal():
    """Herrería de 2.0 entre columnas en los tres lados del vacío (el cuarto es el muro del fondo) y pasamanos de madera."""
    hb, cw = C.K['barandal'], K['COL'] / 2
    HI, PM = bmn('pa_barandal', 'hierro', luz=False), bmn('pa_barandal_pasamanos', 'madera'); segs = []
    for e, L, a, b in (('h', 14, 12, 24), ('v', 12, 14, 30), ('v', 24, 14, 30)):
        cs = sorted({(cx if e == 'h' else cz) for cx, cz in C.COLS if (cz if e == 'h' else cx) == L})
        for c0, c1 in zip(cs, cs[1:]):
            u0, u1 = c0 + cw, c1 - cw; nb = max(2, int((u1 - u0) / .18))
            for k in range(1, nb): uu = u0 + k * (u1 - u0) / nb; caja_l(HI, e, L, uu - .016, uu + .016, .1, hb - .08, -.016, .016)
            for yy in (.1, .9): caja_l(HI, e, L, u0, u1, yy - .025, yy + .025, -.025, .025)
            caja_l(PM, e, L, u0, u1, hb - .08, hb, -.07, .07)
        segs += P.LT(e, L, a) + P.LT(e, L, b)
    ex('pa_barandal_pasamanos', segs=segs, r=.3)

def balcones():
    hb = C.K['barandal']; HI, PM = bmn('pa_balcon_rej', 'hierro', luz=False), bmn('pa_balcon_pasamanos', 'madera'); segs = []
    for j, (bx, bz, bw, bd) in enumerate(N['balc']):
        caja(bmn('pa_balcon_%d' % j, 'cantera'), bx, bx + bw, -.3, 0, bz, bz + bd)
        caja(bmn('pa_balcon_mensulas', 'cantera'), bx + .3, bx + .6, -.75, -.3, bz + .1, 0); caja(bmn('pa_balcon_mensulas', 'cantera'), bx + bw - .6, bx + bw - .3, -.75, -.3, bz + .1, 0)
        x0, x1, z0 = bx + .06, bx + bw - .06, bz + .06
        for a, b, c, d in ((x0, z0, x1, z0), (x0, z0, x0, 0), (x1, z0, x1, 0)):
            ln = math.hypot(c - a, d - b); nb = max(2, int(ln / .17))
            for k in range(nb + 1):
                t = k / nb; x, z = a + (c - a) * t, b + (d - b) * t; caja(HI, x - .016, x + .016, 0, hb - .08, z - .016, z + .016)
            if b == d:
                caja(PM, a, c, hb - .08, hb, b - .07, b + .07)
                for yy in (.1, .9): caja(HI, a, c, yy - .025, yy + .025, b - .025, b + .025)
            else:
                caja(PM, a - .07, a + .07, hb - .08, hb, b, d)
                for yy in (.1, .9): caja(HI, a - .025, a + .025, yy - .025, yy + .025, b, d)
            segs += T(a, b) + T(c, d)
    ex('pa_balcon_pasamanos', segs=segs, r=.25)

# ---------- pisos ----------
def pisos():
    cen = .7
    for x, z, w, d, k, tin, n in N['areas']:
        if k == 'void': continue
        x1, z1 = x + w, z + d
        if n in ('biblioteca', 'tableros'):
            quad('pa_piso_duela', 'duela', x + cen, z + cen, x1 - cen, z1 - cen)
            for a, b, c, e in ((x, z, x1, z + cen), (x, z1 - cen, x1, z1), (x, z + cen, x + cen, z1 - cen), (x1 - cen, z + cen, x1, z1 - cen)):
                quad('pa_piso_cenefa', 'cenefa', a, b, c, e)
        elif n == 'antesala': quad('pa_piso_mosaico', 'mosaico', x, z, x1, z1)
        elif n.startswith('corredor'): quad('pa_piso_corredor', 'corredor', x, z, x1, z1)
        elif n == 'escalera':
            hx, hz, hw, hd = 1, 14, 6, 1.8
            for a, b, c, e in ((x, z, x1, hz), (x, hz + hd, x1, z1), (x, hz, hx, hz + hd), (hx + hw, hz, x1, hz + hd)): quad('pa_piso_cuarto', 'cuarto', a, b, c, e)
        else: quad('pa_piso_cuarto', 'cuarto', x, z, x1, z1)

def escalera():
    esc, ne = C.K['esc'], 8
    E = bmn('pa_escalera_sube', 'escalon')
    for s in range(ne): xa = 6.5 - .5 * (s + 1); caja(E, xa, xa + .5, 0, esc * (s + 1), 12.2, 14)
    ex('pa_escalera_sube', escalera='sube')
    vacio('escalera_sube_n1', 6.7, 0, 13.1, r=1.0, to='n2', pie=[.7, 0])
    E = bmn('pa_escalera_baja', 'escalon')
    for s in range(ne): xa = 6.5 - .5 * (s + 1); caja(E, xa, xa + .5, -3, -esc * (s + 1), 14, 15.8)
    caja(E, 1, 2.5, -3.1, -3, 14, 15.8)
    ex('pa_escalera_baja', escalera='baja')
    vacio('escalera_baja_n1', 6.7, 0, 14.9, r=1.0, to='n0', pie=[.7, 0])

# ---------- muebles ----------
def librero(e, L, u0, u1, lado, alto=3.2, fondo=.6):
    """Librero contra el muro (eje e, línea L) de u0 a u1; lado +1/-1 = hacia dónde mira. Filas de 0.4 (la textura de libros repite igual)."""
    h = K['t'] / 2; o0 = lado * h; o1 = lado * (h + fondo)
    oo = (min(o0, o1), max(o0, o1)); MA, LI = bmn('pa_libreros', 'madera'), bmn('pa_libros', 'libros')
    caja_l(MA, e, L, u0, u1, 0, .36, *oo); caja_l(MA, e, L, u0, u1, alto - .08, alto, oo[0] - .03, oo[1] + .03)
    for uu in (u0, u1 - .05): caja_l(MA, e, L, uu, uu + .05, 0, alto, *oo)
    nb = max(1, round((u1 - u0) / 1.2)); w = (u1 - u0) / nb
    for k in range(1, nb): caja_l(MA, e, L, u0 + k * w - .025, u0 + k * w + .025, 0, alto, *oo)
    for r in range(1, int((alto - .1) / .4)):
        y = r * .4; caja_l(MA, e, L, u0, u1, y - .03, y, *oo)
        bi = (lado * (h + .12), lado * (h + fondo - .04)); bi = (min(bi), max(bi))
        for k in range(nb): caja_l(LI, e, L, u0 + k * w + .05, u0 + (k + 1) * w - .05, y, y + .34, *bi)
    a, b = P.LT(e, L, u0 + .3), P.LT(e, L, u1 - .3); c = lado * (h + fondo / 2)
    if e == 'h': a[1] -= c; b[1] -= c
    else: a[0] += c; b[0] += c
    ex('pa_libreros', segs=a + b, r=round(fondo / 2 + .15, 2))

def muebles():
    # biblioteca: libreros en el muro de la medianera, el del fondo y junto al paso a la antesala; tapete bajo Mérida
    librero('v', 0, .8, 9.2, 1); librero('h', 10, .8, 4.4, -1); librero('v', 16, .6, 2.6, -1); librero('v', 16, 7.4, 9.4, -1)
    for g, mx, mz, r, libre in N['mesas']:
        if g in ('merida', 'haciendas'): disco('pa_tapete_' + g, 'tapete', mx, mz, 3.3 if g == 'merida' else 3.1, .012, 48, uvr=True)
    # sala de tableros: aparador con cajas de juegos y dos mecedoras
    MA, BE, CJ = bmn('pa_muebles', 'madera'), bmn('pa_muebles_bejuco', 'bejuco'), bmn('pa_cajas', 'cajas')
    caja(MA, 35.15, 35.85, 0, 1.2, 2.2, 7.8); caja(MA, 35.08, 35.85, 1.2, 1.28, 2.1, 7.9)
    caja(MA, 35.74, 35.85, 1.28, 3.0, 2.4, 7.6); caja(MA, 35.4, 35.85, 3.0, 3.14, 2.3, 7.7)
    for yy in (1.95, 2.5): caja(MA, 35.45, 35.84, yy, yy + .05, 2.45, 7.55)
    for z0, z1, y0, n in ((2.6, 3.6, 1.28, 3), (4.4, 5.6, 1.28, 2), (6.2, 7.2, 1.28, 4)):
        for k in range(n): caja(CJ, 35.48 - .03 * k, 35.82, y0 + k * .11, y0 + k * .11 + .09, z0 + .04 * k, z1 - .04 * k)
    P.mecedora(32.2, 8.7, math.radians(-47), MA, BE); P.mecedora(34.2, 8.7, math.radians(-58), MA, BE)
    obs = T(32.2, 8.7) + [.75] + T(34.2, 8.7) + [.75]
    segs = T(35.5, 2.3) + T(35.5, 7.7)
    # macetones en la antesala y el corredor
    MT, HO = bmn('pa_macetas', 'barro'), bmn('pa_macetas_hojas', 'copa')
    for mx, mz in ((16.6, 9.35), (20.4, 9.35), (26.9, 10.9), (9.1, 29.2), (26.9, 29.2)):
        tubo(MT, (mx, 0, mz), (mx, .75, mz), .3, .42, 14); P.anillo(MT, mx, mz, .34, .46, .75, .84, 14)
        for k in range(5):
            a = k * 2 * math.pi / 5
            bmesh.ops.create_icosphere(HO, subdivisions=1, radius=.38, matrix=P.Matrix.Translation(P.V(mx + math.cos(a) * .26, 1.1 + .13 * (k % 2), mz + math.sin(a) * .26)) @ P.Matrix.Diagonal((1, 1, .8, 1)))
        obs += T(mx, mz) + [.6]
    ex('pa_muebles', obs=obs, segs=segs, r=.45)

def marcas():
    for g in N['gaps']:
        if g[4]: vacio('puerta_%s_n1' % g[4], (g[0] + g[2]) / 2, 0, (g[1] + g[3]) / 2)
    for g, mx, mz, r, libre in N['mesas']:
        vacio('mesa_' + g, mx, 1.55, mz, juego=g, fam='f' if libre else C.FAM.get(g, 'k'), libre=libre, r=r)
    vacio('llegada_n1', 4, 0, 11.1)
    vacio('llegada_escalera_n1', 4, 0, 11.1)
    vacio('plano_escalera_n1', 6.6, 2.7, 16.8, ry=0.0)

# arbotantes en el corredor y los cuartos: (x, z, normal hacia el cuarto)
ARB = [(10, 10, (0, 1)), (15.25, 10, (0, 1)), (20.75, 10, (0, 1)), (26.5, 10, (0, 1)), (8, 18, (1, 0)), (8, 27, (1, 0)),
       (28, 15, (-1, 0)), (28, 25, (-1, 0)), (5, 10, (0, -1)), (11, 0, (0, 1)), (27.5, 10, (0, -1)), (33, 10, (0, -1))]
def lamparas():
    h = K['t'] / 2; L_ = P.LUCES
    for x, z, (nx, nz) in ARB:
        e = 'h' if nx == 0 else 'v'; L, u = (z, x) if e == 'h' else (x, z)
        base, lid = P.linea_de(e, L, u); n = base + '_arb'; bm = bmn(n, 'arbotante', luz=False); ex(n, linea=lid)
        o = (nz if e == 'h' else nx)
        caja_l(bm, e, L, u - .15, u + .15, 2.7, 3.1, o * h, o * (h + .14)) if o > 0 else caja_l(bm, e, L, u - .15, u + .15, 2.7, 3.1, o * (h + .14), o * h)
        L_.append(('POINT', (x + nx * .55, 2.95, z + nz * .55), 55, .12))
    for g, mx, mz, r, libre in N['mesas']:
        if g in ('merida', 'haciendas'): L_.append(('SPOT', (mx, K['H'] - .3, mz), 800, 0))
    for x, z in ((4, 13.5), (4, 23.5), (32, 15), (32, 25)): L_.append(('POINT', (x, 3.6, z), 90, .3))

def armar():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    sc = bpy.context.scene; P.motor(sc)
    abajo()                           # primero: usa los nombres de la arquería y las columnas antes que el corredor alto
    COLS = C.COLS; C.COLS = [c for c in COLS if c[1] < 30 or c[0] in (12, 24)]   # arriba no hay corredor al fondo: solo las esquinas
    try: P.muros(); arqueria(); P.columnas(); barandal()
    finally: C.COLS = COLS
    balcones(); pisos(); P.techos(); escalera(); muebles(); marcas(); lamparas()
    col = P.coleccion('pa'); obs = P.crear(col)
    ms = N['mesas']; N['mesas'] = [m for m in ms if m[3] > 1.2]   # sombras de bulto solo para las mesas grandes
    try: P.luces(sc)
    finally: N['mesas'] = ms
    print('pa: %d mallas, %d con luz, %d empties' % (len([o for o in col.objects if o.type == 'MESH']), len(obs), len(P.EMP)))
    return sc, col, obs

def vistas(sc, carpeta):
    P.vista(sc, os.path.join(carpeta, 'pa_biblioteca.png'), (9, 10, -6), (9, 0, 5), ('pa_muro_h0_', 'pa_techo'))
    P.vista(sc, os.path.join(carpeta, 'pa_corredor.png'), (18, 11, 6), (18, -3, 22), ('pa_muro_h0_', 'pa_muro_h100_', 'pa_dintel_h140', 'pa_techo'))
    P.vista(sc, os.path.join(carpeta, 'pa_todo.png'), (18, 30, -14), (18, 0, 15), ('pa_muro_h0_', 'pa_techo'))

if __name__ == '__main__':
    arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    acc = arg[0] if arg else 'vista'
    sc, col, obs = armar()
    if acc == 'vista':
        vistas(sc, arg[1] if len(arg) > 1 else os.path.join(DIR, 'blender'))
    elif acc == 'hornear':
        res = int(arg[1]) if len(arg) > 1 else K['RES']; mu = int(arg[2]) if len(arg) > 2 else K['SAMPLES']
        P.uv_luz(obs); img = P.hornear(sc, obs, res, mu); P.guardar(img); P.exportar(col)
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(DIR, 'blender', 'casona_pa.blend'))
    elif acc == 'exportar':
        P.exportar(col)
