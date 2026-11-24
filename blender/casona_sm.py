# blender/casona_sm.py — Sótano detallado de la casona (CASONA.md paso 6) con luz horneada.
# Usa blender/casona_pb.py como biblioteca sobre NIV['nm1'] de blender/casona.py; los nombres salen con prefijo sm_.
# Piedra en todo el sótano y, adentro, lo de hoy: cantina con barra, botellero, bancos, mesitas y barriles; casino con lambrín
# y papel tapiz vino sobre alfombra; billar con tapiz verde, duela y una banca; pasillo de piedra con arbotantes; cava con barricas
# acostadas y botellero; cuarto oscuro de cemento con cajas. Las mesas de juego, la rockola, los neones y el cuadro van en código
# (c_casona_sot.js con SAL, CAS3, BIL, CUB3). Exporta modelos/casona/sm.glb y sm_luz.webp. Sin tocar el archivo abierto:
#   blender -b --factory-startup --python blender/casona_sm.py -- vista [carpeta]
#   blender -b --factory-startup --python blender/casona_sm.py -- hornear [res] [muestras]
#   ... -- marcas   (solo mueve los empties del casona_sm.blend ya horneado y reexporta sm.glb)
import bpy, bmesh, math, os, sys, types

def _raiz():
    for d in ([os.path.dirname(os.path.dirname(os.path.abspath(__file__)))] if '__file__' in globals() else []) + [os.getcwd()]:
        if os.path.isfile(os.path.join(d, 'blender', 'casona.py')): return d
    raise SystemExit('correr blender.exe desde la carpeta del repo')
DIR = _raiz()
src = open(os.path.join(DIR, 'blender', 'casona_pb.py'), encoding='utf-8').read()
src = src.replace("'pb_", "'sm_").replace("'pb.glb'", "'sm.glb'").replace("'casona_pb.blend'", "'casona_sm.blend'")
P = types.ModuleType('casona_pb_lib'); P.__file__ = os.path.join(DIR, 'blender', 'casona_pb.py'); exec(src, P.__dict__)
C = P.C
N = dict(C.NIV['nm1']); N['wins'] = []; N['barda'] = (0, 0, 0, 0); P.N = N
K = P.K; K.update(H=N['H'], LAM=.22, ROD=.05, RES=2048, SAMPLES=320)
H = K['H']
P.ARCOS = dict(escalera=2.9, cantina=2.95, casino2=2.95, billar=2.95, cava=2.85, ruleta=2.75)
P.NOM = 'sm'
P.COLOR.update(piedra=(.5, .45, .39), zoclo=(.26, .23, .2), lambrin_s=(.22, .12, .07), tapiz_vino=(.34, .07, .09), tapiz_verde=(.08, .22, .14),
               alfombra=(.34, .07, .09), ladrillo=(.55, .28, .18), losa_s=(.45, .42, .37), cemento=(.27, .26, .24), tierra=(.16, .13, .1),
               botellas=(.18, .22, .14), barrica=(.4, .24, .13), cuero=(.3, .09, .07), madera_osc=(.18, .1, .06), duela=(.48, .3, .18),
               techo=(.45, .41, .36), foco=(1, .82, .55))
P.EMITE['foco'] = 8
P.PRIO_MAT.update(piedra=1.4, tapiz_vino=1.3, tapiz_verde=1.3, lambrin_s=1.2, techo=.35, tierra=.2)
P.MUROS = P.MUROS + ('piedra', 'zoclo', 'lambrin_s', 'tapiz_vino', 'tapiz_verde')
bmn, ex, vacio, caja, caja_l, quad, disco, tubo, T = P.bmn, P.ex, P.vacio, P.caja, P.caja_l, P.quad, P.disco, P.tubo, P.T
REMAP = dict(muro='piedra', lambrin='zoclo', rod='zoclo')

def sala(x, z):
    for ax, az, w, d, k, tin, n in N['areas']:
        if ax < x < ax + w and az < z < az + d: return n

# ---------- forros: lambrín de madera y papel tapiz en casino y billar; lambrín solo en la cantina ----------
SALAS = dict(casino='tapiz_vino', billar='tapiz_verde', cantina=None)
LAMS = 1.25
def forros():
    h = K['t'] / 2
    for (e, l, i0, i1) in C.tramos(P.W):
        L = l / 10; base = 'sm_muro_%s%d_%d' % (e, l, i0); lid = '%s%d_%d' % (e, l, i0)
        for lado in (1, -1):
            gr = []
            for i in range(i0, i1):
                if (e, l, i) in P.G: s = '-'
                else:
                    u = (i + .5) / 10; s = sala(u, L + lado * .5) if e == 'h' else sala(L + lado * .5, u)
                if gr and gr[-1][0] == s and gr[-1][2] == i: gr[-1][2] = i + 1
                else: gr.append([s, i, i + 1])
            for j, (s, a, b) in enumerate(gr):
                if s not in SALAS: continue
                u0 = a / 10 + (0 if j > 0 and gr[j - 1][0] == '-' else h)
                u1 = b / 10 - (0 if j + 1 < len(gr) and gr[j + 1][0] == '-' else h)
                if u1 - u0 < .1: continue
                o = lambda a0, a1: (min(lado * a0, lado * a1), max(lado * a0, lado * a1))
                caja_l(bmn(base + '_lms', 'lambrin_s'), e, L, u0, u1, 0, LAMS, *o(h, h + .06))
                caja_l(bmn(base + '_lms', 'lambrin_s'), e, L, u0, u1, LAMS, LAMS + .07, *o(h, h + .09))
                ex(base + '_lms', linea=lid)
                tap = SALAS[s]
                if tap:
                    caja_l(bmn(base + '_' + tap, tap), e, L, u0, u1, LAMS + .07, H - .2, *o(h, h + .015))
                    caja_l(bmn(base + '_cor', 'lambrin_s'), e, L, u0, u1, H - .2, H - .04, *o(h, h + .07))
                    ex(base + '_' + tap, linea=lid); ex(base + '_cor', linea=lid)

def dinteles():
    """El paso ancho cantina | casino (5 m) no lleva arco: una trabe de cantera a 2.75."""
    base, lid = P.linea_de('v', 14, 5); n = base + '_can'; bm = bmn(n, 'cantera'); h = K['t'] / 2 + .04
    caja_l(bm, 'v', 14, 2.5, 7.5, 2.75, H - .01, -h, h); ex(n, linea=lid)

# ---------- pisos, techos y la tierra bajo el patio ----------
def pisos():
    for x, z, w, d, k, tin, n in N['areas']:
        x1, z1 = x + w, z + d
        if k == 'earth':
            quad('sm_tierra', 'tierra', x + .15, z + .15, x1 - .15, z1 - .15, H - .05, prio=.2); continue
        m = dict(cantina='ladrillo', casino='alfombra', billar='duela', oscuro='cemento').get(n, 'losa_s')
        quad('sm_piso_' + m, m, x, z, x1, z1)

def techos():
    for x, z, w, d, k, tin, n in N['areas']:
        if k is None: (P.quad_hueco if n == 'escalera' else quad)('sm_techo', 'techo', x, z, x + w, z + d, H - .02, arriba=False, prio=.3)

def escalera(): P.escalera_u('sm', 'nm1', 'piedra')   # escalera en U (blender/casona_esc.py)

# ---------- muebles ----------
def banco(MA, CU, x, z, alto=.9):
    tubo(MA, (x, 0, z), (x, alto - .05, z), .05, .07, 8); P.anillo(MA, x, z, .16, .2, .3, .34, 12)
    tubo(CU, (x, alto - .06, z), (x, alto + .04, z), .22, .2, 14)

def barrica_acostada(BA, HI, x, y, z, eje='x', L=1.2, r=.55):
    a = L / 2; d = (1, 0, 0) if eje == 'x' else (0, 0, 1); p = lambda t: (x + d[0] * t, y, z + d[2] * t)
    tubo(BA, p(-a), p(0), r * .82, r, 16); tubo(BA, p(0), p(a), r, r * .82, 16)
    for t in (-a * .7, a * .7): tubo(HI, p(t - .03), p(t + .03), r * .93 + .01, r * .93 + .01, 16)

def muebles():
    MA, MO, CU = bmn('sm_muebles', 'madera'), bmn('sm_muebles_osc', 'madera_osc'), bmn('sm_cuero', 'cuero')
    HI, BO, BA = bmn('sm_hierro', 'hierro', luz=False), bmn('sm_botellas', 'botellas'), bmn('sm_barricas', 'barrica')
    obs, segs = [], []
    # cantina: barra (5,1)-(13.4,1.8) con cubierta y reposapiés; botellero en el muro de la calle; bancos; mesitas; barriles
    caja(MO, 5.05, 13.35, 0, 1.12, 1.05, 1.75); caja(MA, 4.95, 13.45, 1.12, 1.2, .95, 1.88)
    caja(HI, 5.1, 13.3, .22, .26, 1.86, 1.9)
    segs += T(5.4, 1.4) + T(13.0, 1.4)
    caja(MO, 5.4, 12.6, 0, .9, .15, .55); caja(MA, 5.35, 12.65, .9, .96, .12, .6)
    for y in (1.45, 1.95, 2.45):
        caja(MO, 5.4, 12.6, y - .04, y, .15, .42); caja(BO, 5.5, 12.5, y, y + .38, .2, .38)
    for xx in (5.4, 9.0, 12.55): caja(MO, xx, xx + .05, .96, 2.85, .15, .42)
    for bx in (6.4, 8.0, 9.6, 11.2):
        banco(MO, CU, bx, 2.45); obs += T(bx, 2.45) + [.4]
    for mx, mz, ns in ((3.4, 6.0, ((2.5, 5.4), (4.3, 6.6))), (6.2, 7.6, ((5.3, 8.3), (7.1, 8.3)))):
        tubo(MO, (mx, 0, mz), (mx, 1.05, mz), .06, .07, 10); P.anillo(MO, mx, mz, 0, .3, 0, .04, 14); tubo(MA, (mx, 1.05, mz), (mx, 1.11, mz), .6, .6, 24)
        obs += T(mx, mz) + [.75]
        for bx, bz in ns: banco(MO, CU, bx, bz, .78); obs += T(bx, bz) + [.35]
    for bx, bz in ((1.0, 1.0), (2.2, .8)):
        tubo(BA, (bx, 0, bz), (bx, .6, bz), .42, .5, 16); tubo(BA, (bx, .6, bz), (bx, 1.2, bz), .5, .42, 16)
        for y in (.25, .95): tubo(HI, (bx, y - .03, bz), (bx, y + .03, bz), .49, .49, 16)
        obs += T(bx, bz) + [.6]
    # casino: macetones en las esquinas libres
    MT, HO = bmn('sm_macetas', 'barro'), bmn('sm_macetas_hojas', 'copa')
    for mx, mz in ((14.9, 9.1), (35.1, 9.1), (24.6, .9)):
        tubo(MT, (mx, 0, mz), (mx, .7, mz), .3, .4, 14); P.anillo(MT, mx, mz, .32, .44, .7, .78, 14)
        for k in range(5):
            a = k * 2 * math.pi / 5
            bmesh.ops.create_icosphere(HO, subdivisions=1, radius=.34, matrix=P.Matrix.Translation(P.V(mx + math.cos(a) * .22, 1.02 + .12 * (k % 2), mz + math.sin(a) * .22)) @ P.Matrix.Diagonal((1, 1, .8, 1)))
        obs += T(mx, mz) + [.55]
    # billar: banca para mirar contra el muro del patio (x=12)
    caja(MO, 11.3, 11.82, .48, .58, 21.0, 26.0); caja(CU, 11.32, 11.8, .58, .66, 21.05, 25.95); caja(CU, 11.72, 11.82, .66, 1.3, 21.05, 25.95)
    for zz in (21.1, 23.5, 25.9): caja(MO, 11.36, 11.46, 0, .48, zz - .05, zz + .05); caja(MO, 11.66, 11.76, 0, .48, zz - .05, zz + .05)
    segs += T(11.55, 21.3) + T(11.55, 25.7)
    # cava: dos estantes de barricas acostadas (las de la maqueta) y un botellero en el muro de la medianera
    for zz in (15.4, 17.6):
        caja(MO, 29.3, 35.1, 0, .12, zz - .55, zz - .4); caja(MO, 29.3, 35.1, 0, .12, zz + .4, zz + .55)
        for xx in (30.2, 32.2, 34.2): barrica_acostada(BA, HI, xx, .72, zz, 'z', 1.1, .58)
        segs += T(29.7, zz) + T(34.7, zz)
    caja(MO, 35.25, 35.85, 0, 2.6, 10.6, 13.6); caja(BO, 35.2, 35.25, .2, 2.4, 10.7, 13.5)
    segs += T(35.5, 10.9) + T(35.5, 13.3)
    # cuarto oscuro: cajas de madera apiladas en dos esquinas
    for x0, z0, n in ((28.25, 28.4, 2), (34.3, 20.25, 3)):
        for k in range(n): caja(MA, x0 + .05 * k, x0 + 1.3 - .05 * k, k * .7, k * .7 + .68, z0 + .04 * k, z0 + 1.3 - .04 * k)
        obs += T(x0 + .65, z0 + .65) + [1.0]
    ex('sm_muebles', obs=obs, segs=segs, r=.45)

def marcas():
    for g in N['gaps']:
        if g[4]: vacio('puerta_%s_nm1' % g[4], (g[0] + g[2]) / 2, 0, (g[1] + g[3]) / 2)
    for g, mx, mz, r, libre in N['mesas']:
        vacio('mesa_' + g, mx, 1.55, mz, juego=g, fam='f' if libre else C.FAM.get(g, 'k'), libre=libre, r=r)
    vacio('llegada_nm1', C.ESC['llegada'][0], 0, C.ESC['llegada'][1])
    vacio('llegada_escalera_nm1', C.ESC['llegada'][0], 0, C.ESC['llegada'][1])
    vacio('plano_escalera_nm1', 6.6, 2.0, 16.8, ry=0.0)
    # lo que pone el código (c_casona_sot.js): rockola, taquera, marcador, cuadro y neones; ry hacia donde miran
    for n, x, y, z, ry in SOT:
        vacio('sot_' + n, x, y, z, ry=round(ry, 4))
# (cosa, x, alto, z, ry de three: en three la z del plano va al revés, así que mirar hacia +z del plano es ry=pi): sobre la cara del muro (a 0.15 del eje); la trabe del casino sobresale 0.19
SOT = (('rockola', .75, 0, 8.4, math.pi / 2), ('taquera', .21, 0, 21.0, math.pi / 2), ('marcador', 4.5, 2.0, 17.21, math.pi),
       ('cuadro', 22.0, 2.0, .15, math.pi), ('neon_casino', 13.78, 2.97, 5.0, -math.pi / 2), ('neon_billar', 4.5, 2.85, 17.19, math.pi),
       ('neon_cantina', .19, 2.55, 4.5, math.pi / 2))

def solo_marcas():
    """Mueve solo los empties del .blend ya horneado (casona_sm.blend) y vuelve a exportar sm.glb, sin hornear."""
    bpy.ops.wm.open_mainfile(filepath=os.path.join(DIR, 'blender', 'casona_sm.blend'))
    col = bpy.data.collections['sm']
    for o in [o for o in col.objects if o.type == 'EMPTY']: bpy.data.objects.remove(o, do_unlink=True)
    P.EMP.clear(); marcas()
    E0 = C.ESC; vacio('escalera_sube_nm1', E0['x0'] - .4, 0, sum(E0['sube']) / 2, r=1.0, to='n0', pie=[.7, 0])
    for nombre, (x, y, z), kv in P.EMP:
        e = bpy.data.objects.new(nombre, None); e.empty_display_type = 'PLAIN_AXES'; e.location = P.V(x, y, z); col.objects.link(e)
        for k, v in kv.items(): e[k] = v
    P.exportar(col); bpy.ops.wm.save_mainfile()

# arbotantes: (x, z, normal hacia el cuarto); colgados de su línea para el corte
LUZ = 1.8   # relleno: el sótano de cerca en el teléfono se veía muy oscuro
ARB = [(11, 14, (0, -1)), (17, 14, (0, -1)), (23, 14, (0, -1)), (14.5, 10, (0, 1)), (24.5, 10, (0, 1)), (0, 13.5, (1, 0)),
       (28, 16, (-1, 0)), (36, 16.5, (-1, 0)), (0, 3, (1, 0)), (14, 9, (-1, 0)), (14, 1, (-1, 0)), (0, 26, (1, 0))]
def lamparas():
    h = K['t'] / 2; L_ = P.LUCES
    for x, z, (nx, nz) in ARB:
        e = 'h' if nx == 0 else 'v'; L, u = (z, x) if e == 'h' else (x, z)
        base, lid = P.linea_de(e, L, u); n = base + '_arb'; bm = bmn(n, 'arbotante', luz=False); ex(n, linea=lid)
        o = (nz if e == 'h' else nx)
        caja_l(bm, e, L, u - .13, u + .13, 2.25, 2.6, o * h, o * (h + .13)) if o > 0 else caja_l(bm, e, L, u - .13, u + .13, 2.25, 2.6, o * (h + .13), o * h)
        L_.append(('POINT', (x + nx * .5, 2.45, z + nz * .5), 30 * LUZ, .1))
    # focos colgados sobre la barra
    F, HI = bmn('sm_focos', 'foco', luz=False), bmn('sm_focos_hierro', 'hierro', luz=False)
    for fx in (6.6, 9.2, 11.8):
        caja(F, fx - .1, fx + .1, 2.3, 2.5, 1.3, 1.5); caja(HI, fx - .01, fx + .01, 2.5, H, 1.39, 1.41)
        L_.append(('POINT', (fx, 2.35, 1.4), 45 * LUZ, .1))
    for x, z, E in ((4, 5.5, 70), (10, 6.5, 50), (4, 13.5, 45), (16, 12, 35), (24, 12, 35), (6, 20, 40), (6, 27.5, 40),
                    (32, 13, 35), (32, 18.5, 30), (18, 8.5, 60), (26, 8.5, 60), (34, 8, 40)):
        L_.append(('POINT', (x, 2.85, z), E * LUZ, .4))
    L_ += [('SPOT', (20, 3.1, 5.2), 420, 0), ('SPOT', (30, 3.1, 3.8), 380, 0), ('SPOT', (6, 3.1, 23.4), 420, 0), ('SPOT', (32, 3.1, 25), 300, 0)]

def oscuro(sc):
    """Sin sol ni cielo: el sótano solo tiene sus lámparas. Sombras de bulto para las mesas que no son redondas."""
    so = bpy.data.objects.get('sol')
    if so: bpy.data.objects.remove(so, do_unlink=True)
    w = sc.world; bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs[0].default_value = (.4, .32, .24, 1); bg.inputs[1].default_value = .08
    S = bpy.data.collections['horneado']; md = P.mat('mesa'); bm = bmesh.new()
    caja(bm, 4.35, 7.65, .85, 1.1, 20.6, 26.2); caja(bm, 4.6, 7.4, 0, .85, 21.0, 25.8)   # billar (largo en z)
    caja(bm, 27.8, 32.2, 1.35, 1.5, 1.4, 3.6)                                             # blackjack (media luna, aprox.)
    me = bpy.data.meshes.new('px_sm'); bm.to_mesh(me); bm.free(); me.materials.append(md); S.objects.link(bpy.data.objects.new('px_sm', me))
    for spot in [o for o in S.objects if o.type == 'LIGHT' and o.data.type == 'SPOT']: spot.data.spot_size = math.radians(80)

def armar():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    sc = bpy.context.scene; P.motor(sc)
    P.muros()
    for d in P.B.values(): d['mat'] = REMAP.get(d['mat'], d['mat'])
    forros(); dinteles(); pisos(); techos(); escalera(); muebles(); marcas(); lamparas()
    col = P.coleccion('sm'); obs = P.crear(col)
    ms = N['mesas']; N['mesas'] = [m for m in ms if m[0] in ('poker', 'ruleta')]   # sombras redondas solo para las mesas redondas
    try: P.luces(sc)
    finally: N['mesas'] = ms
    oscuro(sc)
    print('sm: %d mallas, %d con luz, %d empties' % (len([o for o in col.objects if o.type == 'MESH']), len(obs), len(P.EMP)))
    return sc, col, obs

def vistas(sc, carpeta):
    P.vista(sc, os.path.join(carpeta, 'sm_cantina_casino.png'), (18, 13, -7), (18, 0, 5), ('sm_muro_h0_', 'sm_techo'))
    P.vista(sc, os.path.join(carpeta, 'sm_billar_cava.png'), (18, 16, 40), (18, 0, 20), ('sm_muro_h300_', 'sm_techo'))
    P.vista(sc, os.path.join(carpeta, 'sm_todo.png'), (18, 30, -12), (18, 0, 15), ('sm_muro_h0_', 'sm_techo'))

if __name__ == '__main__':
    arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    acc = arg[0] if arg else 'vista'
    if acc == 'marcas': solo_marcas(); raise SystemExit
    sc, col, obs = armar()
    if acc == 'vista':
        vistas(sc, arg[1] if len(arg) > 1 else os.path.join(DIR, 'blender'))
    elif acc == 'hornear':
        res = int(arg[1]) if len(arg) > 1 else K['RES']; mu = int(arg[2]) if len(arg) > 2 else K['SAMPLES']
        P.uv_luz(obs); img = P.hornear(sc, obs, res, mu); P.guardar(img); P.exportar(col)
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(DIR, 'blender', 'casona_sm.blend'))
    elif acc == 'exportar':
        P.exportar(col)
