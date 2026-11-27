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
P.COLOR.update(piedra=(.5, .45, .39), tabique=(.42, .2, .14), zoclo=(.26, .23, .2), lambrin_s=(.22, .12, .07), tapiz_vino=(.34, .07, .09), tapiz_verde=(.08, .22, .14),
               alfombra=(.34, .07, .09), ladrillo=(.55, .28, .18), losa_s=(.45, .42, .37), cemento=(.27, .26, .24), tierra=(.16, .13, .1),
               botellas=(.18, .22, .14), barrica=(.4, .24, .13), cuero=(.3, .09, .07), madera_osc=(.18, .1, .06), duela=(.48, .3, .18),
               techo=(.45, .41, .36), foco=(1, .82, .55))
P.EMITE['foco'] = 5; P.COLOR['led'] = (1, .74, .5); P.EMITE['led'] = .5     # tiras LED tenues (5b: 1.5 se veía neón y quemaba el techo)
P.PRIO_MAT.update(piedra=1.4, tabique=1.3, tapiz_vino=1.3, tapiz_verde=1.3, lambrin_s=1.2, techo=.7, tierra=.2)   # R4: techo .35 -> .7 y prio .3 -> .9 (salía a 2 tx/m; pb 12.4)
P.MUROS = P.MUROS + ('piedra', 'zoclo', 'lambrin_s', 'tapiz_vino', 'tapiz_verde', 'tabique')
bmn, ex, vacio, caja, caja_l, quad, disco, tubo, T = P.bmn, P.ex, P.vacio, P.caja, P.caja_l, P.quad, P.disco, P.tubo, P.T
REMAP = dict(muro='piedra', lambrin='zoclo', rod='zoclo')

def sala(x, z):
    for ax, az, w, d, k, tin, n in N['areas']:
        if ax < x < ax + w and az < z < az + d: return n

# ---------- forros: lambrín de madera y papel tapiz en casino y billar; lambrín solo en la cantina ----------
SALAS = dict(casino='tapiz_vino', billar='tapiz_verde', cantina=None, oscuro='tabique')   # oscuro: cuarto de la Ruleta (R6)
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
        if k is None:   # 2 cm dentro del muro, no en su eje (la tira dentro del muro se horneaba negra y se corría al techo)
            e = K['t'] / 2 - .02; (P.quad_hueco if n == 'escalera' else quad)('sm_techo', 'techo', x + e, z + e, x + w - e, z + d - e, H - .02, arriba=False, prio=.9)

def escalera(): P.escalera_u('sm', 'nm1', 'piedra')   # escalera en U (blender/casona_esc.py)

# ---------- muebles ----------
def banco(MA, CU, x, z, alto=.9):
    tubo(MA, (x, 0, z), (x, alto - .05, z), .05, .07, 8); P.anillo(MA, x, z, .16, .2, .3, .34, 12)
    tubo(CU, (x, alto - .06, z), (x, alto + .04, z), .22, .2, 14)

def barrica_acostada(BA, HI, x, y, z, eje='x', L=1.2, r=.55):
    a = L / 2; d = (1, 0, 0) if eje == 'x' else (0, 0, 1); p = lambda t: (x + d[0] * t, y, z + d[2] * t)
    tubo(BA, p(-a), p(0), r * .82, r, 16); tubo(BA, p(0), p(a), r, r * .82, 16)
    for t in (-a * .7, a * .7): tubo(HI, p(t - .03), p(t + .03), r * .93 + .01, r * .93 + .01, 16)

# ---------- casino (R8/R12): Póker y Blackjack contra el muro de la calle (crupier de espaldas al muro), ruleta automática al centro y
# tragamonedas en los muros del oriente y del pasillo: esas van en código (c_casona_casino.js, empties sot_* de SOT). Aquí lo quieto:
# alfombras por zona con filo de latón, caja con reja junto a la puerta, mueble de bebidas con espejo, cuadros y plantas ----------
P.COLOR.update(alf_verde=(.08, .2, .15), alf_azul=(.1, .13, .24), marmol=(.82, .8, .76), vidrio=(.32, .4, .4),
               ficha_r=(.6, .08, .08), ficha_a=(.1, .2, .5), ficha_v=(.1, .4, .2))
P.PRIO_MAT.update(alf_verde=.5, alf_azul=.5, ficha_r=.3, ficha_a=.3, ficha_v=.3)
def casino(obs, segs):
    P.tapete_r('sm_cas', 15.6, .4, 22.4, 5.25, 'alf_verde')       # póker
    P.tapete_r('sm_cas', 26.9, .4, 33.5, 4.9, 'alf_verde')        # blackjack
    P.tapete_r('sm_cas', 22.6, 4.75, 27.0, 8.3, 'alf_azul')       # ruleta
    P.tapete_r('sm_cas', 18.8, 5.5, 20.2, 9.84, 'alf_azul')       # de la puerta al centro
    MO, MA, MM = bmn('sm_cas_mueble', 'madera_osc'), bmn('sm_cas_madera', 'madera'), bmn('sm_cas_marmol', 'marmol')
    LA, BO, VI = bmn('sm_cas_laton', 'laton', prio=.5), bmn('sm_cas_botellas', 'botellas'), bmn('sm_cas_vidrio', 'vidrio')
    # caja de fichas en la esquina junto a la puerta: mostrador de mármol, reja de latón con ventanilla, techito de madera y fichas apiladas
    caja(MO, 14.3, 17.3, 0, 1.15, 8.78, 9.7); caja(MM, 14.25, 17.35, 1.15, 1.22, 8.68, 9.72); caja(LA, 14.3, 17.3, .1, .15, 8.73, 8.78)
    caja(MO, 17.25, 17.35, 0, 2.6, 8.78, 9.7); caja(MO, 14.25, 17.4, 2.42, 2.62, 8.62, 9.72); caja(LA, 14.3, 17.3, 2.35, 2.42, 8.72, 8.8)
    x = 14.42
    while x < 17.2:
        if not 15.45 < x < 16.35: caja(LA, x - .012, x + .012, 1.22, 2.35, 8.75, 8.77)
        else: caja(LA, x - .012, x + .012, 1.75, 2.35, 8.75, 8.77)
        x += .12
    caja(LA, 15.45, 16.35, 1.72, 1.76, 8.73, 8.79)
    for i, (fx, m) in enumerate(((15.6, 'ficha_r'), (15.82, 'ficha_a'), (16.04, 'ficha_v'), (16.2, 'ficha_r'))):
        tubo(bmn('sm_cas_' + m, m), (fx, 1.22, 9.0), (fx, 1.3 + .06 * (i % 3), 9.0), .07, .07, 12)
    segs += T(14.3, 8.7) + T(17.38, 8.7) + T(17.38, 8.7) + T(17.38, 9.75)
    # mueble de bebidas a la derecha de la puerta, con botellas, copas y espejo
    caja(MO, 22.8, 26.6, 0, 1.05, 9.32, 9.72); caja(MM, 22.75, 26.65, 1.05, 1.1, 9.28, 9.74)
    for hx in (23.75, 24.7, 25.65): caja(LA, hx - .1, hx + .1, .7, .74, 9.3, 9.32)
    for k, bx in enumerate((23.1, 23.35, 23.6, 25.9, 26.15, 26.4)):
        tubo(BO, (bx, 1.1, 9.52), (bx, 1.42 + .06 * (k % 2), 9.52), .055, .055, 10); tubo(BO, (bx, 1.42 + .06 * (k % 2), 9.52), (bx, 1.56 + .06 * (k % 2), 9.52), .02, .02, 6)
    for cx in (24.2, 24.45, 24.95, 25.2): tubo(VI, (cx, 1.1, 9.45), (cx, 1.24, 9.45), .045, .035, 10)
    caja(MA, 23.2, 26.2, 1.38, 2.52, 9.74, 9.79); caja(VI, 23.3, 26.1, 1.48, 2.42, 9.735, 9.745)
    segs += T(22.8, 9.3) + T(26.6, 9.3)
    # plantas y cuadros (el as de espadas va en código, sot_cuadro)
    for px, pz, s in ((14.8, .8, 1.0), (24.7, .75, 1.0), (35.2, 9.25, 1.0), (21.6, 9.3, .85)): P.maceton('sm_cas', px, pz, s, obs)
    P.cuadro('sm_cas', 16.0, 2.25, .165, 1.4, .9, 0, 1, 0); P.cuadro('sm_cas', 34.2, 2.25, .165, 1.0, 1.2, 0, 1, 1)
    P.cuadro('sm_cas', 14.165, 2.2, 1.3, 1.0, .8, 1, 0, 2)

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
    casino(obs, segs)   # casino: alfombras, caja, mueble de bebidas, cuadros y plantas (R12)
    # billar: banca para mirar contra el muro del patio (x=12)
    caja(MO, 11.3, 11.82, .48, .58, 21.0, 26.0); caja(CU, 11.32, 11.8, .58, .66, 21.05, 25.95); caja(CU, 11.72, 11.82, .66, 1.3, 21.05, 25.95)
    for zz in (21.1, 23.5, 25.9): caja(MO, 11.36, 11.46, 0, .48, zz - .05, zz + .05); caja(MO, 11.66, 11.76, 0, .48, zz - .05, zz + .05)
    segs += T(11.55, 21.3) + T(11.55, 25.7)
    # cava: barricas acostadas en dos estibas contra los muros de los lados (4 abajo, 3 encima en las canaletas); el centro queda libre
    # para pasar a la Ruleta (puerta x 30.5..32.5 en z 20)
    for xc in (28.85, 35.25):
        for o in (-.42, .3): caja(MO, xc + o, xc + o + .12, 0, .16, 14.3, 19.6)
        for zz in (15.0, 16.3, 17.6, 18.9): barrica_acostada(BA, HI, xc, .72, zz, 'x', 1.1, .58)
        for zz in (15.65, 16.95, 18.25): barrica_acostada(BA, HI, xc, 1.68, zz, 'x', 1.1, .58)
        segs += T(xc, 14.5) + T(xc, 19.4)
    caja(MO, 35.25, 35.85, 0, 2.6, 10.6, 13.6); caja(BO, 35.2, 35.25, .2, 2.4, 10.7, 13.5)
    segs += T(35.5, 10.9) + T(35.5, 13.3)
    # cuarto oscuro: cajas de madera apiladas en dos esquinas
    for x0, z0, n in ((28.25, 28.4, 2), (34.3, 20.25, 3)):
        for k in range(n): caja(MA, x0 + .05 * k, x0 + 1.3 - .05 * k, k * .7, k * .7 + .68, z0 + .04 * k, z0 + 1.3 - .04 * k)
        obs += T(x0 + .65, z0 + .65) + [1.0]
    ex('sm_muebles', obs=obs, segs=segs, r=.45)

# ---------- más vida en el sótano: cantina (diana, cuadros, perchero con sombreros, mesa de dominó), billar (mesa alta, cuadros, planta),
# pasillo (cuadros entre arbotantes, banca, plantas), cava (mesa de cata con vela) y muros del cuarto de la Ruleta (R9: repisa vieja,
# cartel y reloj parado) ----------
P.COLOR.update(diana=(.12, .1, .08), diana_r=(.55, .1, .08), diana_c=(.78, .72, .58), sombrero=(.72, .62, .4), domino=(.92, .9, .84), vela=(1, .85, .6),
               lata=(.45, .42, .38), carton=(.5, .38, .24))
P.EMITE['vela'] = 6
P.PRIO_MAT.update(diana=.4, diana_r=.4, diana_c=.4, sombrero=.4, domino=.3, lata=.3, carton=.4)
def sotano_vida():
    obs, segs = [], []
    MO, MA, CU, BO = bmn('sm_vida_osc', 'madera_osc'), bmn('sm_vida_mad', 'madera'), bmn('sm_cuero', 'cuero'), bmn('sm_vida_botellas', 'botellas')
    # cantina: diana en el muro del pasillo, cuadros, perchero con sombreros junto a la puerta, mesa de dominó con dos bancos
    for r, m in ((.42, 'diana'), (.34, 'diana_r'), (.24, 'diana_c'), (.14, 'diana_r'), (.05, 'diana')):
        tubo(bmn('sm_vida_' + m, m), (3.4, 2.0, 9.85), (3.4, 2.0, 9.85 - .04 - (.42 - r) * .05), r, r, 24)
    P.cuadro('sm_vida', 6.8, 2.1, 9.835, 1.2, .8, 0, -1, 0); P.cuadro('sm_vida', .165, 2.1, 1.9, .7, .9, 1, 0, 1)
    tubo(MO, (13.4, 0, 9.5), (13.4, 2.3, 9.5), .04, .04, 8); tubo(MO, (13.4, 0, 9.5), (13.4, .04, 9.5), .25, .25, 10)
    for k in range(4):
        a = k * math.pi / 2 + .4; hx, hz = 13.4 + math.cos(a) * .16, 9.5 + math.sin(a) * .16
        tubo(MO, (13.4, 2.15, 9.5), (hx, 2.25, hz), .015, .015, 4)
    SO = bmn('sm_vida_sombrero', 'sombrero')
    for hx, hy, hz in ((13.57, 2.2, 9.52), (13.3, 2.15, 9.35)):
        tubo(SO, (hx, hy, hz), (hx, hy + .03, hz), .32, .32, 16); tubo(SO, (hx, hy + .03, hz), (hx, hy + .2, hz), .14, .11, 12)
    obs += T(13.4, 9.5) + [.3]
    tubo(MO, (2.6, 0, 3.6), (2.6, 1.0, 3.6), .06, .07, 10); P.anillo(MO, 2.6, 3.6, 0, .28, 0, .04, 14); tubo(MA, (2.6, 1.0, 3.6), (2.6, 1.06, 3.6), .55, .55, 24)
    DO = bmn('sm_vida_domino', 'domino')
    for k, (dx, dz, ry) in enumerate(((-.2, -.1, 0), (-.06, -.1, 0), (.08, -.06, 1), (.18, .1, 0), (-.15, .15, 1), (.0, .22, 0))):
        a, b = (.06, .03) if ry == 0 else (.03, .06); caja(DO, 2.6 + dx - a, 2.6 + dx + a, 1.06, 1.08, 3.6 + dz - b, 3.6 + dz + b)
    for bx, bz in ((1.75, 3.6), (3.45, 3.6)): banco(MO, CU, bx, bz, .78); obs += T(bx, bz) + [.35]
    obs += T(2.6, 3.6) + [.7]
    # billar: mesa alta con bancos en la esquina, cuadros y planta
    tubo(MO, (10.6, 0, 28.9), (10.6, 1.35, 28.9), .06, .07, 10); P.anillo(MO, 10.6, 28.9, 0, .3, 0, .04, 14); tubo(MA, (10.6, 1.35, 28.9), (10.6, 1.41, 28.9), .45, .45, 20)
    for bx, bz in ((9.75, 28.9), (10.6, 28.05)): banco(MO, CU, bx, bz, 1.05); obs += T(bx, bz) + [.35]
    tubo(BO, (10.5, 1.41, 28.85), (10.5, 1.7, 28.85), .05, .05, 10); obs += T(10.6, 28.9) + [.6]
    P.cuadro('sm_vida', .165, 2.1, 27.75, 1.3, .85, 1, 0, 0); P.cuadro('sm_vida', 4.0, 2.1, 29.835, .8, 1.0, 0, -1, 1); P.cuadro('sm_vida', 8.0, 2.1, 29.835, .8, 1.0, 0, -1, 1)
    P.maceton('sm_vida', 1.0, 29.0, .9, obs)
    # pasillo: cuadros entre los arbotantes del muro del patio, banca y plantas
    for cx, t in ((14.0, 2), (20.0, 0), (26.0, 1)): P.cuadro('sm_vida', cx, 1.95, 13.835, 1.0, .75, 0, -1, t)
    caja(MA, 18.4, 20.0, .5, .58, 13.3, 13.82); caja(CU, 18.42, 19.98, .58, .64, 13.32, 13.8)
    for xx in (18.5, 19.9): caja(MA, xx - .04, xx + .04, 0, .5, 13.35, 13.77)
    segs += T(18.4, 13.55) + T(20.0, 13.55)
    P.maceton('sm_vida', 27.35, 13.45, .75, obs); P.maceton('sm_vida', 8.7, 10.6, .75, obs)
    # cava: mesa de cata con vela y botella
    tubo(MO, (33.8, 0, 11.0), (33.8, 1.0, 11.0), .06, .07, 10); P.anillo(MO, 33.8, 11.0, 0, .28, 0, .04, 14); tubo(MA, (33.8, 1.0, 11.0), (33.8, 1.06, 11.0), .5, .5, 20)
    tubo(BO, (33.65, 1.06, 10.9), (33.65, 1.4, 10.9), .05, .05, 10); tubo(bmn('sm_vida_vela', 'vela', luz=False), (33.95, 1.06, 11.1), (33.95, 1.22, 11.1), .03, .03, 8)
    P.LUCES.append(('POINT', (33.95, 1.4, 11.1), 8, .03)); obs += T(33.8, 11.0) + [.6]
    # cuarto de la Ruleta (R9): repisa vieja con latas y botellas en el muro del oriente, cartel y reloj parado en el del fondo
    caja(MO, 35.5, 35.85, 1.55, 1.6, 23.0, 27.0); caja(MO, 35.5, 35.85, .95, 1.0, 23.0, 27.0)
    for zz in (23.05, 26.95): caja(MO, 35.6, 35.85, .9, 1.6, zz - .03, zz + .03)
    LT_ = bmn('sm_vida_lata', 'lata')
    for k, zz in enumerate((23.4, 23.8, 24.3, 25.1, 25.6, 26.4)):
        if k % 2: tubo(BO, (35.68, 1.6, zz), (35.68, 1.92, zz), .05, .05, 8)
        else: tubo(LT_, (35.68, 1.6, zz), (35.68, 1.78, zz), .07, .07, 10)
        tubo(LT_ if k % 3 else BO, (35.68, 1.0, zz + .1), (35.68, 1.2, zz + .1), .06, .06, 8)
    P.cuadro('sm_vida', 31.0, 2.0, 29.835, .9, 1.2, 0, -1, 1)
    tubo(bmn('sm_vida_reloj', 'diana_c'), (33.8, 2.3, 29.85), (33.8, 2.3, 29.8), .26, .26, 20); tubo(MO, (33.8, 2.3, 29.86), (33.8, 2.3, 29.83), .3, .3, 20)
    caja(bmn('sm_vida_osc', 'madera_osc'), 33.79, 33.81, 2.3, 2.5, 29.78, 29.79); caja(MO, 33.8, 33.95, 2.29, 2.31, 29.78, 29.79)
    ex('sm_vida_osc', obs=obs, segs=segs, r=.45)

def marcas():
    P.portales(N, 'nm1')
    for g in N['gaps']:
        if g[4]: vacio('puerta_%s_nm1' % g[4], (g[0] + g[2]) / 2, 0, (g[1] + g[3]) / 2)
    for g, mx, mz, r, libre in N['mesas']:
        vacio('mesa_' + g, mx, 1.55, mz, juego=g, fam='f' if libre else C.FAM.get(g, 'k'), libre=libre, r=r, aire=P.aire_libre(mx, mz))
    vacio('llegada_nm1', C.ESC['llegada'][0], 0, C.ESC['llegada'][1])
    vacio('llegada_escalera_nm1', C.ESC['llegada'][0], 0, C.ESC['llegada'][1])
    vacio('plano_escalera_nm1', 6.6, 2.0, 16.8, ry=0.0)
    # lo que pone el código (c_casona_sot.js): rockola, taquera, marcador, cuadro y neones; ry hacia donde miran
    for n, x, y, z, ry in SOT:
        vacio('sot_' + n, x, y, z, ry=round(ry, 4))
# (cosa, x, alto, z, ry de three: en three la z del plano va al revés, así que mirar hacia +z del plano es ry=pi): sobre la cara del muro (a 0.15 del eje); la trabe del casino sobresale 0.19
SOT = (('rockola', .75, 0, 8.4, math.pi / 2), ('taquera', .21, 0, 21.0, math.pi / 2), ('marcador', 4.5, 2.0, 17.21, math.pi),
       ('cuadro', 24.7, 2.25, .165, math.pi), ('ruleta_casino', 24.8, 0, 6.5, 0.0), ('neon_casino', 13.78, 2.97, 5.0, -math.pi / 2), ('neon_billar', 4.5, 2.85, 17.19, math.pi),
       ('neon_cantina', .19, 2.55, 4.5, math.pi / 2)) + tuple(('traga%d' % (i + 1), 35.4, 0, z, -math.pi / 2) for i, z in enumerate((5.0, 6.0, 7.0, 8.0))) \
    + tuple(('traga%d' % (i + 5), x, 0, 9.4, 0.0) for i, x in enumerate((28.3, 29.3, 30.3, 31.3, 32.3)))

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
    def colgante(x, z, yb, r, E):   # cable, pantalla de lámina y foco asomado; la luz bajo la pantalla (sin círculo en el techo)
        caja(HI, x - .012, x + .012, yb + r * .8, H, z - .012, z + .012)
        tubo(HI, (x, yb + r * .8, z), (x, yb, z), r * .28, r, 10)
        tubo(F, (x, yb + .05, z), (x, yb - r * .25, z), r * .5, r * .3, 8)
        L_.append(('POINT', (x, yb - r * .6, z), E * LUZ, r * .4))
    for fx in (6.6, 9.2, 11.8): colgante(fx, 1.4, 2.42, .17, 45)          # sobre la barra
    for x, z, E in ((4, 5.5, 70), (10, 6.5, 50), (4, 13.5, 45), (16, 12, 35), (24, 12, 35), (6, 20, 40), (6, 27.5, 40),
                    (32, 13, 35), (32, 18.5, 30), (18, 8.5, 60), (26, 8.5, 60), (34, 8, 40)):
        colgante(x, z, 2.62, .3, E)
    LED = bmn('sm_led', 'led', luz=False)    # tiras LED cálidas bajo el techo del pasillo y de la cava (emisivo horneado, sin costo)
    for zf in (10 + h + .03, 14 - h - .03): caja(LED, 8 + h, 28 - h, 3.06, 3.1, zf - .02, zf + .02)
    for xf in (28 + h + .03, 36 - h - .03): caja(LED, xf - .02, xf + .02, 3.06, 3.1, 10 + h, 20 - h)
    L_ += [('SPOT', (19.0, 3.1, 2.8), 420, 0), ('SPOT', (30.2, 3.1, 2.6), 380, 0), ('SPOT', (24.8, 3.1, 6.5), 300, 0), ('SPOT', (6, 3.1, 23.4), 420, 0), ('SPOT', (32, 3.1, 25), 300, 0)]

def oscuro(sc):
    """Sin sol ni cielo: el sótano solo tiene sus lámparas. Sombras de bulto para las mesas que no son redondas."""
    so = bpy.data.objects.get('sol')
    if so: bpy.data.objects.remove(so, do_unlink=True)
    w = sc.world; bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs[0].default_value = (.4, .32, .24, 1); bg.inputs[1].default_value = .08
    S = bpy.data.collections['horneado']; md = P.mat('mesa'); bm = bmesh.new()
    caja(bm, 4.35, 7.65, .85, 1.1, 20.6, 26.2); caja(bm, 4.6, 7.4, 0, .85, 21.0, 25.8)   # billar (largo en z)
    caja(bm, 28.0, 32.4, 1.35, 1.5, 1.8, 3.45); caja(bm, 17.1, 20.9, 1.35, 1.5, 1.85, 3.75)   # blackjack (media luna) y póker (óvalo), aprox.
    caja(bm, 23.1, 26.5, 0, 1.5, 5.75, 7.25)                                              # ruleta del casino (c_casona_casino.js)
    caja(bm, 35.03, 35.77, 0, 2.3, 4.53, 8.47); caja(bm, 27.83, 32.77, 0, 2.3, 9.03, 9.77)   # tragamonedas
    me = bpy.data.meshes.new('px_sm'); bm.to_mesh(me); bm.free(); me.materials.append(md); S.objects.link(bpy.data.objects.new('px_sm', me))
    for spot in [o for o in S.objects if o.type == 'LIGHT' and o.data.type == 'SPOT']: spot.data.spot_size = math.radians(80)

def armar():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    sc = bpy.context.scene; P.motor(sc)
    P.muros()
    for d in P.B.values(): d['mat'] = REMAP.get(d['mat'], d['mat'])
    forros(); dinteles(); pisos(); techos(); escalera(); muebles(); sotano_vida(); marcas(); lamparas()
    col = P.coleccion('sm'); obs = P.crear(col)
    for o in col.objects:   # las pantallas no echan sombra: sin mancha oscura en el techo sobre cada colgante
        if o.name.startswith('sm_focos'): o.visible_shadow = False
    ms = N['mesas']; N['mesas'] = [m for m in ms if m[0] == 'ruleta']   # sombra redonda solo para la mesa redonda (el póker es óvalo: px_sm)
    try: P.luces(sc)
    finally: N['mesas'] = ms
    oscuro(sc)
    print('sm: %d mallas, %d con luz, %d empties' % (len([o for o in col.objects if o.type == 'MESH']), len(obs), len(P.EMP)))
    return sc, col, obs

def vistas(sc, carpeta):
    P.vista(sc, os.path.join(carpeta, 'sm_cantina_casino.png'), (18, 13, -7), (18, 0, 5), ('sm_muro_h0_', 'sm_techo'))
    P.vista(sc, os.path.join(carpeta, 'sm_casino.png'), (25, 9, -3.5), (25, 0, 5), ('sm_muro_h0_', 'sm_techo'))
    P.vista(sc, os.path.join(carpeta, 'sm_billar_cava.png'), (18, 16, 40), (18, 0, 20), ('sm_muro_h300_', 'sm_techo'))
    P.vista(sc, os.path.join(carpeta, 'sm_todo.png'), (18, 30, -12), (18, 0, 15), ('sm_muro_h0_', 'sm_techo'))

if __name__ == '__main__':
    arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    acc = arg[0] if arg else 'vista'
    if acc == 'marcas': solo_marcas(); raise SystemExit
    sc, col, obs = armar()
    if acc == 'vista':
        vistas(sc, arg[1] if len(arg) > 1 else os.path.join(DIR, 'blender'))
    elif acc == 'uvs':        # R4: solo desenvuelve y diagnostica (sin hornear)
        exec(open(os.path.join(DIR, 'blender', 'luz_diag.py'), encoding='utf-8').read(), P.__dict__); P.uv_luz(obs); P.densidad(obs, P.K['RES'])
    elif acc == 'hornear':
        res = int(arg[1]) if len(arg) > 1 else K['RES']; mu = int(arg[2]) if len(arg) > 2 else K['SAMPLES']
        P.uv_luz(obs); img = P.hornear(sc, obs, res, mu); P.guardar(img); P.exportar(col)
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(DIR, 'blender', 'casona_sm.blend'))
    elif acc == 'exportar':
        P.exportar(col)
