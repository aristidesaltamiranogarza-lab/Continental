# blender/casona_az_deco.py — Decoración de la azotea (paquete Blender, 24 nov). Se ejecuta dentro de casona_az.py (armar -> deco())
# con sus nombres (bmn, caja, tubo, ex, T, P, PERG). Coordenadas del plano (x, alto, z). Libres: mesas de Rummy (8, 5.2), Conecta 4 (24, 5)
# y lotería (4.6, 23.8) con sus sillas, la puerta de la escalera (x 8, z 11.5..15.5), el tendedero y el pasillo junto al vacío.
# Guirnalda de focos en la pérgola, macetas de sábila, cactus y helecho contra el pretil, calentador solar, tanques de gas, lavadero con
# cubeta y escoba, rejas de refresco y antena de TV en la esquina.
P.COLOR.update(foco=(1, .82, .55), sabila=(.42, .55, .4), nopal=(.27, .44, .24), tierra_m=(.25, .17, .12), solar=(.08, .12, .2),
               aluminio=(.72, .73, .74), tanque=(.72, .7, .66), cubeta=(.2, .36, .6), reja=(.62, .14, .12), botella=(.25, .16, .1),
               escoba=(.75, .62, .3))
P.EMITE['foco'] = 8
P.PRIO_MAT.update(foco=.4, botella=.5, escoba=.5)

def _sem(s):
    st = [s]
    def r():
        st[0] = (st[0] * 9301 + 49297) % 233280; return st[0] / 233280
    return r

def guirnalda():
    """Tres cables de foco de trabe a trabe bajo las vigas, con comba; un foco cada .8 colgando de su casquillo."""
    CB, FO = bmn('az_guirnalda', 'hierro', luz=False), bmn('az_guirnalda_focos', 'foco', luz=False)
    ya, z0, z1, comba = PERG - .02, .55, 9.45, 1.0
    for xc in (3.5, 8.0, 12.5):
        pts = []
        for k in range(17):
            t = k / 16; pts.append((xc, ya - comba * 4 * t * (1 - t), z0 + (z1 - z0) * t))
        for a, b in zip(pts, pts[1:]): tubo(CB, a, b, .014, .014, 5)
        nf = int((z1 - z0) / .8)
        for k in range(1, nf):
            t = k / nf; y = ya - comba * 4 * t * (1 - t); z = z0 + (z1 - z0) * t
            tubo(CB, (xc, y, z), (xc, y - .14, z), .03, .03, 6)
            bmesh.ops.create_icosphere(FO, subdivisions=1, radius=.085, matrix=P.Matrix.Translation(P.V(xc, y - .22, z)) @ P.Matrix.Diagonal((1, 1, 1.25, 1)))

def maceta_sola(MT, TI, mx, mz, s):
    tubo(MT, (mx, 0, mz), (mx, .75 * s, mz), .3 * s, .42 * s, 14); P.anillo(MT, mx, mz, .34 * s, .46 * s, .75 * s, .84 * s, 14)
    P.disco('az_deco_tierra', 'tierra_m', mx, mz, .36 * s, .8 * s, seg=12)
    return T(mx, mz) + [.6 * s]

def sabila(HO, mx, mz, s, y0, sem):
    for k in range(9):
        a = k * 2.4 + sem() * .5; L = (.45 + .25 * sem()) * s; sube = (.55 + .35 * sem()) * s
        tubo(HO, (mx, y0, mz), (mx + math.cos(a) * L, y0 + sube, mz + math.sin(a) * L), .075 * s, .006, 4)

def cactus(HO, mx, mz, s, y0):
    tubo(HO, (mx, y0, mz), (mx, y0 + 1.7 * s, mz), .17 * s, .15 * s, 10)
    bmesh.ops.create_icosphere(HO, subdivisions=1, radius=.15 * s, matrix=P.Matrix.Translation(P.V(mx, y0 + 1.7 * s, mz)))
    for dx, ya, yb in ((.42, .7, 1.25), (-.38, .95, 1.45)):
        xb = mx + dx * s
        tubo(HO, (mx, y0 + ya * s, mz), (xb, y0 + ya * s, mz), .1 * s, .1 * s, 8); tubo(HO, (xb, y0 + (ya - .1) * s, mz), (xb, y0 + yb * s, mz), .1 * s, .09 * s, 8)
        bmesh.ops.create_icosphere(HO, subdivisions=1, radius=.09 * s, matrix=P.Matrix.Translation(P.V(xb, y0 + yb * s, mz)))

def helecho(HO, mx, mz, s, y0, sem):
    for k in range(6):
        a = k * 1.05 + sem() * .4; rr = .22 * s
        bmesh.ops.create_icosphere(HO, subdivisions=1, radius=(.3 + .1 * sem()) * s,
                                   matrix=P.Matrix.Translation(P.V(mx + math.cos(a) * rr, y0 + (.25 + .12 * (k % 2)) * s, mz + math.sin(a) * rr)) @ P.Matrix.Diagonal((1, 1, .65, 1)))

def plantas():
    MT = bmn('az_deco_macetas', 'barro'); SA, NO, HO = bmn('az_deco_sabila', 'sabila'), bmn('az_deco_nopal', 'nopal'), bmn('az_deco_helecho', 'copa')
    sem = _sem(11); obs = []
    for mx, mz, s, k in ((2.4, .75, .9, 's'), (5.0, .75, .85, 'c'), (11.2, .75, .9, 's'), (13.8, .75, .8, 'h'), (.75, 3.2, .9, 'c'), (.75, 7.0, .85, 'h'),
                         (20.4, .75, .85, 's'), (27.6, .75, .9, 'h'), (30.0, .75, .85, 'c'), (32.6, .75, .8, 's'),
                         (.8, 21.0, .8, 's'), (.8, 26.6, .85, 'c'), (35.25, 24.6, .85, 'c'), (35.25, 8.6, .8, 'h')):
        obs += maceta_sola(MT, None, mx, mz, s); y0 = .8 * s
        if k == 's': sabila(SA, mx, mz, s, y0, sem)
        elif k == 'c': cactus(NO, mx, mz, s, y0)
        else: helecho(HO, mx, mz, s, y0, sem)
    ex('az_deco_macetas', obs=obs)

def calentador():
    """Calentador solar junto a los tinacos: tubos de vidrio oscuro inclinados sobre su bastidor y el termo de aluminio arriba."""
    SO, AL, HI = bmn('az_solar_tubos', 'solar'), bmn('az_solar_termo', 'aluminio'), bmn('az_solar_hierro', 'hierro', luz=False)
    x0, x1, zt, zb, yt, yb = 29.8, 34.0, 9.0, 6.3, 1.75, .35
    tubo(AL, (x0 - .1, yt + .3, zt), (x1 + .1, yt + .3, zt), .32, .32, 16)
    n = 13
    for k in range(n):
        xx = x0 + .1 + k * (x1 - x0 - .2) / (n - 1); tubo(SO, (xx, yt, zt - .2), (xx, yb, zb), .07, .07, 8)
    for xx in (x0, x1):
        tubo(HI, (xx, 0, zt), (xx, yt + .3, zt), .035, .035, 6); tubo(HI, (xx, 0, zb), (xx, yb, zb), .035, .035, 6)
        tubo(HI, (xx, yt - .05, zt - .1), (xx, yb - .05, zb), .03, .03, 6); tubo(HI, (xx, .05, zt), (xx, .05, zb), .03, .03, 6)
    tubo(HI, (x0, yb - .08, zb), (x1, yb - .08, zb), .03, .03, 6)
    tubo(HI, (32.4, yt + .3, zt + .3), (32.4, .3, 11.3), .04, .04, 8)                 # tubo al tinaco
    ex('az_solar_tubos', segs=T(x0, (zt + zb) / 2) + T(x1, (zt + zb) / 2), r=1.4)

def gas():
    TA, HI = bmn('az_gas', 'tanque'), bmn('az_gas_hierro', 'hierro', luz=False); obs = []
    for cz in (16.0, 16.9):
        cx = 35.35; tubo(TA, (cx, .05, cz), (cx, 1.15, cz), .34, .34, 16); tubo(TA, (cx, 1.15, cz), (cx, 1.35, cz), .34, .16, 16)
        P.anillo(TA, cx, cz, .3, .36, 0, .08, 16); tubo(HI, (cx, 1.35, cz), (cx, 1.5, cz), .05, .05, 6)
        tubo(HI, (cx, 1.48, cz), (cx - .5, 1.48, cz), .025, .025, 6); obs += T(cx, cz) + [.45]
    tubo(HI, (34.85, 1.48, 16.0), (34.85, 1.48, 16.9), .025, .025, 6)
    ex('az_gas', obs=obs)

def lavadero():
    """Lavadero de cemento contra el pretil del fondo, con su tallador, cubeta y una escoba recargada."""
    CE, CU, ES = bmn('az_lavadero', 'cemento'), bmn('az_cubeta', 'cubeta'), bmn('az_escoba', 'escoba')
    x0, x1, z0, z1 = 34.2, 35.85, 25.6, 27.9
    for zz in (z0 + .15, z1 - .15): caja(CE, x0 + .1, x1, 0, .95, zz - .12, zz + .12)
    caja(CE, x0, x1, .95, 1.05, z0, z1)
    for a, b, c, d in ((x0, x0 + .12, z0 + .12, z1 - .12), (x1 - .12, x1, z0 + .12, z1 - .12), (x0, x1, z0, z0 + .12)): caja(CE, a, b, 1.05, 1.35, c, d)   # el lado de z1 es el respaldo
    for k in range(6): yy = 1.08 + k * .04; caja(CE, x0 + .14, x1 - .14, yy, yy + .02, z0 + .14 + k * .14, z0 + .2 + k * .14)   # tallador
    caja(CE, x0, x1, 1.05, 1.6, z1 - .12, z1)
    tubo(CU, (33.5, 0, 28.3), (33.5, .55, 28.3), .22, .27, 14); P.anillo(CU, 33.5, 28.3, .25, .29, .52, .56, 14)
    tubo(ES, (35.6, .05, 29.3), (35.75, 2.0, 29.55), .025, .025, 6); tubo(ES, (35.55, 0, 29.25), (35.6, .4, 29.3), .12, .05, 8)
    ex('az_lavadero', segs=T(x0, z0) + T(x0, z1), r=.3)
    ex('az_cubeta', obs=T(33.5, 28.3) + [.4])

def rejas():
    """Rejas de refresco con envases al fondo del pasillo junto al vacío."""
    RE, BO = bmn('az_rejas', 'reja'), bmn('az_rejas_botellas', 'botella'); obs = []
    for cx, cz, pisos in ((8.75, 28.9, 3), (9.55, 29.1, 2), (9.0, 27.9, 1)):
        for k in range(pisos):
            y = k * .34
            for a, b, c, d in ((-.32, .32, -.24, -.2), (-.32, .32, .2, .24), (-.32, -.28, -.24, .24), (.28, .32, -.24, .24)): caja(RE, cx + a, cx + b, y, y + .3, cz + c, cz + d)
            caja(RE, cx - .32, cx + .32, y, y + .03, cz - .24, cz + .24)
            if k == pisos - 1:
                for i in range(4):
                    for j in range(3): tubo(BO, (cx - .22 + i * .147, y + .03, cz - .14 + j * .14), (cx - .22 + i * .147, y + .4, cz - .14 + j * .14), .045, .02, 6)
        obs += T(cx, cz) + [.45]
    ex('az_rejas', obs=obs)

def antena():
    HI = bmn('az_antena', 'hierro', luz=False); cx, cz = 35.55, .45
    tubo(HI, (cx, 1.2, cz), (cx, 6.4, cz), .04, .03, 6)
    for y, L in ((5.4, 1.4), (5.8, 1.1), (6.2, .8)): tubo(HI, (cx - L / 2, y, cz), (cx + L / 2, y, cz), .015, .015, 4)
    tubo(HI, (cx, 6.0, cz - .5), (cx, 6.0, cz + .5), .015, .015, 4)
    for y in (1.4, 2.1): caja(HI, cx - .08, cx + .12, y - .04, y + .04, cz - .08, cz + .08)   # abrazaderas al pretil

def decorar():
    guirnalda(); plantas(); calentador(); gas(); lavadero(); rejas(); antena()
