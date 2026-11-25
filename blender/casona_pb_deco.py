# blender/casona_pb_deco.py — Decoración de la planta baja (CASONA.md paso 9, grupo 1: cocina y baño).
# Se ejecuta dentro de casona_pb.py (armar -> deco()) y usa sus ayudantes (bmn, caja, tubo, anillo, viga, quad, ex, T) y su COLOR.
# Traspatio (traspatio2). Cocina (x 28..36, z 10..22): fogón de azulejo con campana y ollas, barra con fregadero y trastero de loza, mesa con bancas,
# tinajero y cazos de cobre. Despensa (z 22..28): estantes con frascos, ollas y costales. Servicio (z 28..34): calentador, tanque
# de gas, escoba y cubeta. Baño (x 0..8, z 17..22): azulejo a 2.4 y en el piso, regadera con murete y cortina, excusado,
# lavabo de pedestal con espejo y toallero. Coordenadas del plano (x, alto, z); caras de los muros a .15 de su línea.
COLOR.update(azulejo=(.85, .85, .82), loza=(.9, .88, .84), cobre=(.62, .32, .16), espejo=(.55, .62, .66), costal=(.6, .5, .34),
             toalla=(.7, .36, .3), frasco=(.55, .62, .45), cemento=(.55, .53, .5), tanque=(.72, .7, .66), cubeta=(.2, .36, .6))
PRIO_MAT.update(loza=.7, frasco=.5, cobre=.6, costal=.6, toalla=.6)

def cocina():
    AZ, CA, MA, BA = bmn('pb_coc_azulejo', 'azulejo'), bmn('pb_coc_cantera', 'cantera'), bmn('pb_coc_madera', 'madera'), bmn('pb_coc_barro', 'barro')
    LO, CO, CE, CP = bmn('pb_coc_loza', 'loza'), bmn('pb_coc_cobre', 'cobre'), bmn('pb_coc_cemento', 'cemento'), bmn('pb_coc_campana', 'muro')
    HI = bmn('pb_coc_hierro', 'hierro', luz=False)
    # barra en el muro del oriente con su fregadero
    caja(AZ, 34.75, 35.85, 0, 1.2, 10.15, 20.6); caja(CA, 34.65, 35.85, 1.2, 1.3, 10.15, 20.7)
    caja(CE, 34.95, 35.62, 1.3, 1.36, 16.2, 17.8); caja(HI, 35.03, 35.54, 1.3, 1.361, 16.28, 17.72)
    tubo(HI, (35.7, 1.3, 17), (35.7, 1.78, 17), .04, .04, 8); tubo(HI, (35.7, 1.76, 17), (35.32, 1.68, 17), .035, .03, 8)
    # trastero de loza sobre la barra: dos repisas con platos recargados
    for y in (2.3, 3.0):
        caja(MA, 35.38, 35.85, y, y + .06, 10.9, 15.7); caja(MA, 35.38, 35.85, y + .06, y + .1, 15.62, 15.7)
        for i in range(8): z = 11.25 + i * .58; tubo(LO, (35.5, y + .3, z), (35.56, y + .3, z), .25, .25, 16)
    for z in (11.0, 15.6): caja(MA, 35.7, 35.85, 2.2, 3.1, z - .04, z + .04)
    # fogón de azulejo en el muro del norte, con sus bocas, hornillas y campana de cal
    caja(AZ, 30, 33.6, 0, 1.1, 10.15, 11.4); caja(CA, 29.9, 33.7, 1.1, 1.2, 10.15, 11.5)
    for x in (31, 32.6):
        anillo(HI, x, 10.8, .2, .28, 1.2, 1.23, 20); caja(HI, x - .4, x + .4, .25, .75, 11.4, 11.42)
    tubo(BA, (31, 1.23, 10.8), (31, 1.78, 10.8), .3, .36, 16); tubo(BA, (31, 1.78, 10.8), (31, 1.86, 10.8), .3, .22, 16)
    tubo(BA, (32.6, 1.23, 10.8), (32.6, 1.55, 10.8), .4, .34, 16)
    caja(CP, 29.8, 33.8, 3.5, 3.75, 10.15, 11.6); caja(CP, 30.4, 33.2, 3.75, 4.6, 10.15, 11.1); caja(CP, 30.9, 32.7, 4.6, K['H'], 10.15, 10.75)
    # cazos de cobre colgados junto a la campana
    caja(HI, 28.5, 29.7, 2.95, 3.0, 10.15, 10.22)
    for x, y, r in ((28.75, 2.55, .2), (29.2, 2.4, .26), (29.55, 2.62, .16)):
        tubo(CO, (x, y, 10.17), (x, y, 10.27), r, r, 16); caja(HI, x - .015, x + .015, y + r - .02, 2.96, 10.2, 10.23)
    # mesa de la cocina con dos bancas y una jarra
    caja(MA, 30.8, 33.2, 1.25, 1.33, 15.2, 18.8)
    for x in (30.95, 33.05):
        for z in (15.35, 18.65): caja(MA, x - .06, x + .06, 0, 1.25, z - .06, z + .06)
    for x0, x1 in ((30.0, 30.4), (33.6, 34.0)):
        caja(MA, x0, x1, .52, .6, 15.4, 18.6)
        for z in (15.55, 18.45): caja(MA, x0 + .04, x1 - .04, 0, .52, z - .05, z + .05)
    tubo(BA, (32, 1.33, 17.3), (32, 1.62, 17.3), .14, .17, 12); tubo(BA, (32, 1.62, 17.3), (32, 1.78, 17.3), .17, .1, 12)
    # tinajero en la esquina: banco de madera y tinaja
    caja(MA, 28.55, 29.65, 1.5, 1.58, 20.6, 21.7)
    for x in (28.62, 29.58):
        for z in (20.67, 21.63): caja(MA, x - .05, x + .05, 0, 1.5, z - .05, z + .05)
    caja(MA, 28.6, 29.6, .5, .55, 20.65, 21.65)
    tubo(BA, (29.1, 1.58, 21.15), (29.1, 2.2, 21.15), .28, .4, 16); tubo(BA, (29.1, 2.2, 21.15), (29.1, 2.42, 21.15), .4, .2, 16)
    tubo(BA, (29.1, .55, 21.15), (29.1, .95, 21.15), .22, .26, 12)
    ex('pb_coc_azulejo', segs=T(35.3, 10.4) + T(35.3, 20.5) + T(30.0, 10.8) + T(33.6, 10.8), r=.65)
    ex('pb_coc_madera', segs=T(32, 16.3) + T(32, 17.7), r=2.0)
    ex('pb_coc_barro', obs=T(29.1, 21.15) + [.65])

def despensa():
    MA, BA, FR, CS = bmn('pb_desp_madera', 'madera'), bmn('pb_desp_barro', 'barro'), bmn('pb_desp_frasco', 'frasco'), bmn('pb_desp_costal', 'costal')
    for x0, x1, xc in ((34.9, 35.85, 35.38), (28.15, 29.1, 28.62)):
        for y in (.3, 1.2, 2.1, 3.0, 3.9): caja(MA, x0, x1, y, y + .07, 22.5, 27.5)
        for z0 in (22.5, 27.42): caja(MA, x0, x1, 0, 3.97, z0, z0 + .08)
        for i in range(8): z = 22.85 + i * .6; tubo(FR, (xc, 1.27, z), (xc, 1.7, z), .15, .15, 10); tubo(FR, (xc, 1.7, z), (xc, 1.76, z), .09, .09, 8)
        for i in range(6): z = 22.9 + i * .78; tubo(FR, (xc, 2.17, z), (xc, 2.5 + (i % 2) * .15, z), .19, .19, 10)
        for z in (23.2, 24.4, 25.6, 26.8): tubo(BA, (xc, .37, z), (xc, .95, z), .26, .34, 12); tubo(BA, (xc, .95, z), (xc, 1.08, z), .34, .2, 12)
        for z in (23.0, 24.7, 26.2): caja(CS, xc - .35, xc + .35, 3.07, 3.6, z - .5, z + .5)
    caja(CS, 29.35, 30.15, 0, .85, 26.6, 27.5); caja(CS, 29.4, 30.1, .85, 1.0, 26.7, 27.4); caja(CS, 33.85, 34.65, 0, .75, 22.35, 23.25)
    ex('pb_desp_madera', segs=T(35.38, 22.6) + T(35.38, 27.4) + T(28.62, 22.6) + T(28.62, 27.4), r=.55)
    ex('pb_desp_costal', obs=T(29.75, 27.05) + [.6] + T(34.25, 22.8) + [.6])

def servicio():
    LO, TQ, HI, MA, CB, CS = bmn('pb_serv_loza', 'loza'), bmn('pb_serv_tanque', 'tanque'), bmn('pb_serv_hierro', 'hierro', luz=False), \
        bmn('pb_serv_madera', 'madera'), bmn('pb_serv_cubeta', 'cubeta'), bmn('pb_serv_costal', 'costal')
    tubo(LO, (35.25, 1.0, 29.0), (35.25, 3.2, 29.0), .45, .45, 18); tubo(LO, (35.25, 3.2, 29.0), (35.25, 3.4, 29.0), .45, .2, 18)
    for dx, dz in ((-.3, -.3), (.3, -.3), (-.3, .3), (.3, .3)): caja(HI, 35.25 + dx - .03, 35.25 + dx + .03, 0, 1.0, 29 + dz - .03, 29 + dz + .03)
    tubo(HI, (35.25, 3.4, 29.0), (35.25, K['H'], 29.0), .07, .07, 8); tubo(HI, (35.7, 2.0, 29.0), (35.85, 2.0, 29.0), .04, .04, 8)
    tubo(TQ, (35.2, 0, 30.5), (35.2, 1.8, 30.5), .4, .4, 16); tubo(TQ, (35.2, 1.8, 30.5), (35.2, 2.05, 30.5), .4, .14, 16)
    tubo(HI, (35.2, 2.05, 30.5), (35.2, 2.2, 30.5), .06, .06, 8)
    # trapeador recargado: palo y fleco de tiras que se abren en el piso (antes un costal cuadrado en la base parecía su cabeza)
    viga(MA, (28.45, .32, 33.55), (28.32, 2.7, 33.2), .035)
    tubo(CS, (28.45, .26, 33.55), (28.45, .36, 33.55), .07, .06, 8)
    bmesh.ops.create_icosphere(CS, subdivisions=2, radius=.15, matrix=Matrix.Translation(V(28.45, .2, 33.55)) @ Matrix.Diagonal((1, 1, .8, 1)))
    for k in range(16):
        an = k * 2 * math.pi / 16; rr = .2 + .05 * (k % 3)
        viga(CS, (28.45 + math.cos(an) * .06, .26, 33.55 + math.sin(an) * .06), (28.45 + math.cos(an) * rr, .02, 33.55 + math.sin(an) * rr), .045, .015)
    tubo(CB, (29.4, 0, 33.3), (29.4, .55, 33.3), .25, .3, 14)
    ex('pb_serv_loza', obs=T(35.25, 29.0) + [.65] + T(35.2, 30.5) + [.55])
    ex('pb_serv_cubeta', obs=T(29.4, 33.3) + [.45])

def bano():
    AZ, CA, LO, HI, ES, MA, TO = bmn('pb_bano_azulejo', 'azulejo'), bmn('pb_bano_cantera', 'cantera'), bmn('pb_bano_loza', 'loza'), \
        bmn('pb_bano_hierro', 'hierro', luz=False), bmn('pb_bano_espejo', 'espejo'), bmn('pb_bano_madera', 'madera'), bmn('pb_bano_toalla', 'toalla')
    A = 2.4
    # azulejo a 2.4 en los cuatro muros (en el del oriente, a los lados de la puerta) con su remate de cantera
    for x0, x1, z0, z1, ax, bx, az, bz in ((.15, .22, 17.15, 21.85, 0, .03, 0, 0), (.22, 7.78, 17.15, 17.22, 0, 0, 0, .03),
                                           (.22, 7.78, 21.78, 21.85, 0, 0, -.03, 0), (7.78, 7.85, 17.22, 18.5, -.03, 0, 0, 0), (7.78, 7.85, 20.5, 21.78, -.03, 0, 0, 0)):
        caja(AZ, x0, x1, 0, A, z0, z1); caja(CA, x0 + ax, x1 + bx, A, A + .1, z0 + az, z1 + bz)
    quad('pb_bano_piso', 'azulejo', .15, 17.15, 7.85, 21.85, y=.012)
    # regadera: murete, cortina en su barra y la regadera
    caja(AZ, 2.5, 2.65, 0, .25, 17.22, 21.78); caja(HI, 2.555, 2.595, 3.6, 3.64, 17.22, 21.78)
    caja(TO, 2.52, 2.63, .9, 3.58, 20.5, 21.74)
    tubo(HI, (.22, 3.8, 19.5), (.75, 3.75, 19.5), .04, .04, 8); tubo(HI, (.75, 3.78, 19.5), (.8, 3.6, 19.5), .07, .16, 12)
    for z in (19.2, 19.8): tubo(HI, (.22, 2.0, z), (.32, 2.0, z), .06, .06, 8)
    anillo(HI, 1.3, 19.5, .05, .12, .012, .02, 12)
    # excusado contra el muro del norte
    caja(LO, 3.55, 4.45, 1.1, 1.9, 17.22, 17.6); caja(LO, 3.5, 4.5, 1.9, 1.96, 17.2, 17.64)
    caja(LO, 3.82, 4.18, 0, .9, 17.55, 17.9); tubo(LO, (4.0, .3, 18.1), (4.0, .95, 18.1), .26, .36, 16)
    anillo(LO, 4.0, 18.12, .2, .38, .95, 1.02, 20); caja(LO, 3.65, 4.35, .98, 1.5, 17.62, 17.7)
    # lavabo de pedestal y espejo en el muro del sur
    tubo(LO, (5.2, 0, 21.35), (5.2, 1.15, 21.35), .2, .13, 12); caja(LO, 4.75, 5.65, 1.15, 1.35, 20.95, 21.78)
    tubo(HI, (5.2, 1.35, 21.62), (5.2, 1.56, 21.62), .03, .03, 8); tubo(HI, (5.2, 1.55, 21.62), (5.2, 1.52, 21.42), .025, .025, 8)
    caja(MA, 4.6, 5.8, 2.0, 3.3, 21.72, 21.78); caja(ES, 4.72, 5.68, 2.12, 3.18, 21.7, 21.72)
    # toallero junto a la puerta
    tubo(HI, (7.76, 2.6, 20.8), (7.76, 2.6, 21.6), .03, .03, 8); caja(TO, 7.66, 7.74, 1.75, 2.62, 20.85, 21.55)
    # puerta entreabierta hacia adentro (vano z 18.5..20.5 en el muro x=8), bisagra en la jamba del norte
    a = math.radians(70); ux, uz = -math.sin(a), math.cos(a); hx, hz, R = 7.72, 18.7, 1.62
    hoja_puerta(bmn('pb_bano_puerta', 'porton'), hx, hz, ux, uz, R, K['PUERTA'] - .03, g=.07, ab=.02)
    tubo(HI, (hx + ux * (R - .15) - uz * .04, 1.5, hz + uz * (R - .15) + ux * .04), (hx + ux * (R - .15) - uz * .1, 1.5, hz + uz * (R - .15) + ux * .1), .03, .03, 8)
    ex('pb_bano_puerta', segs=T(hx, hz) + T(hx + ux * R, hz + uz * R), r=.1)
    ex('pb_bano_loza', obs=T(4.0, 17.9) + [.6] + T(5.2, 21.3) + [.55])
    ex('pb_bano_azulejo', segs=T(2.57, 17.3) + T(2.57, 21.7), r=.15)

COLOR.update(tierra=(.3, .22, .15), hoja=(.3, .5, .22), agave=(.36, .5, .44))

def traspatio2():
    """Traspatio (z 34..48): macetas con matas y agaves en la barda del fondo, plátanos, arriate de hortalizas, sendero de laja al pozo,
    banca bajo el mamey (con su mancha de tierra), tendedero con ropa, tinaja junto al lavadero, agave junto a la puerta, matas al pie
    de las bardas, una bugambilia en la esquina del fondo y macollos de zacate (blender/casona_plantas.py)."""
    BA, MA, CP, TI = bmn('pb_tras_barro', 'barro', prio=.5), bmn('pb_tras_mueble', 'madera', prio=.5), bmn('pb_tras_planta', 'copa', prio=.5), bmn('pb_tras_tierra', 'tierra', prio=.4)
    HO, AG, CA, TL = bmn('pb_tras_hoja', 'hoja', prio=.5), bmn('pb_tras_agave', 'agave', prio=.5), bmn('pb_tras_cantera', 'cantera', prio=.5), bmn('pb_tras_tallo', 'tallo', prio=.5)
    SE, FL, ZA, HC = bmn('pb_tras_seca', 'hoja_seca', prio=.4), bmn('pb_tras_flor', 'flor', prio=.5), bmn('pb_tras_zacate', 'zacate', prio=.4), bmn('pb_tras_hortaliza', 'hoja_c', prio=.5)
    MT = bmn('pb_tras_mancha', 'tierra', recalc=False, prio=.4)
    HI, RO = bmn('pb_tras_hierro', 'hierro', luz=False), [bmn('pb_tras_ropa%d' % i, m, prio=.4) for i, m in enumerate(('toalla', 'hamaca', 'costal'))]
    obs = []; R = random.Random(48)
    for x in (21, 23, 25, 27, 29):              # macetas en la barda del fondo (x 16.5..19.5: puerta trasera, paso 3)
        tubo(BA, (x, 0, 47.1), (x, .75, 47.1), .34, .46, 14); tubo(TI, (x, .7, 47.1), (x, .72, 47.1), .42, .42, 14)
        if x % 4 == 1: agave(AG, x, .7, 47.1, .85, R)
        else:
            n0 = mata(CP, x, 1.05, 47.1, .5, .85, sem=x, piso=.72)
            if x == 23: flores(FL, CP, n0, 14, .06, R)
        obs += T(x, 47.1) + [.55]
    for x, z, al in ((2.4, 36.8, 2.8), (33.6, 45.6, 3.1), (34.9, 43.4, 2.5)):   # plátanos
        platano(TL, HO, SE, x, z, al, R); obs += T(x, z) + [.45]
    # arriate de hortalizas con su borde de cantera: lechugas (rosetas fundidas) y una hilera de cebollines
    x0, x1, z0, z1 = 22, 29, 39, 42.4
    for a, b, c, d in ((x0, x1, z0, z0 + .22), (x0, x1, z1 - .22, z1), (x0, x0 + .22, z0 + .22, z1 - .22), (x1 - .22, x1, z0 + .22, z1 - .22)): caja(CA, a, b, 0, .45, c, d)   # sin encimarse en las esquinas (parpadeaban)
    caja(TI, x0 + .23, x1 - .23, 0, .4, z0 + .23, z1 - .23)
    for i in range(7):
        for j in range(3):
            xx, zz = x0 + .85 + i * .88, z0 + .75 + j * .95
            if j == 1:
                for k in range(6):
                    a = i + k * 1.05; hoja(HO, (xx + math.cos(a) * .04, .4, zz + math.sin(a) * .04), a, .1, .05, .42, -.02, n=2, grueso=.02, forma='brizna', lados=3)
            else: mata(HC, xx, .55, zz, .27, .6, sem=i * 3 + j, lob=(5, 6), res=2.2, piso=.41)
    segs = T(x0 + .5, (z0 + z1) / 2) + T(x1 - .5, (z0 + z1) / 2)
    # sendero de lajas del corredor al pozo: piedras planas irregulares de .08 de grueso, en curva suave, con piedritas a los lados
    LA = bmn('pb_tras_laja', 'laja', prio=.5); sem = [3]
    def r3(): sem[0] = (sem[0] * 9301 + 49297) % 233280; return sem[0] / 233280
    def laja(cx, cz, rad, n=7, alto=.08):
        g0 = r3() * 6.28; pts = [(cx + math.cos(g0 + 6.283 * i / n) * rad * (.78 + .3 * r3()), cz + math.sin(g0 + 6.283 * i / n) * rad * (.7 + .3 * r3())) for i in range(n)]
        top = [LA.verts.new(V(x, alto, z)) for x, z in pts]; bot = [LA.verts.new(V(x, -.02, z)) for x, z in pts]
        LA.faces.new(top); LA.faces.new(bot[::-1])
        for i in range(n): j = (i + 1) % n; LA.faces.new([bot[i], bot[j], top[j], top[i]])
    camino = []
    for k in range(9):
        t = (k + .5) / 9; x = 18 + (14 - 18) * t + .7 * math.sin(t * 3.1); z = 34.8 + (43.3 - 34.8) * t; camino.append((x, z))
        laja(x + (r3() - .5) * .2, z, .5 + .08 * r3())
        if k % 2 == 0: laja(x + (.75 if k % 4 == 0 else -.75), z + (r3() - .5) * .4, .16 + .06 * r3(), 6, .05)
    # banca pegada a la barda del fondo, entre las matas, mirando a la casa; tierra pelona bajo el mamey
    caja(MA, 8.75, 11.35, .52, .6, 47.2, 47.78); caja(MA, 8.8, 11.3, .6, 1.3, 47.7, 47.78)
    for x in (8.95, 11.15): caja(MA, x - .05, x + .05, 0, .52, 47.25, 47.73)
    segs += T(8.95, 47.5) + T(11.15, 47.5); mancha(MT, 6.2, 41.1, 2.0, R)
    # tendedero: dos postes, el mecate y ropa colgada
    for x in (22, 30): caja(MA, x - .08, x + .08, 0, 3.3, 45.42, 45.58); caja(MA, x - .06, x + .06, 3.1, 3.2, 45.0, 46.0)
    caja(HI, 22, 30, 3.1, 3.13, 45.49, 45.51)
    for i, (xa, w, al) in enumerate(((23.0, 1.1, 1.3), (24.6, .9, 1.0), (26.0, 1.4, .8), (27.9, 1.0, 1.4))):
        caja(RO[i % 3], xa, xa + w, 3.1 - al, 3.1, 45.47, 45.53)
    obs += T(22, 45.5) + [.3] + T(30, 45.5) + [.3]
    # tinaja junto al lavadero y agave en su maceta junto a la puerta del corredor
    tubo(BA, (35.1, 0, 37.6), (35.1, .9, 37.6), .4, .5, 14); tubo(BA, (35.1, .9, 37.6), (35.1, 1.15, 37.6), .5, .32, 14); obs += T(35.1, 37.6) + [.6]
    tubo(BA, (21.6, 0, 35.3), (21.6, .9, 35.3), .5, .62, 14); tubo(TI, (21.6, .85, 35.3), (21.6, .87, 35.3), .56, .56, 14)
    agave(AG, 21.6, .85, 35.3, 1.25, R); obs += T(21.6, 35.3) + [.75]
    # matas al pie de las bardas (libran postes, pozo, plátanos y macetas) y la bugambilia de la esquina del fondo, trepada a la barda
    for x, z, r in ((5.2, 47.2, .8), (7.6, 47.3, .65), (12.6, 47.2, .75), (15.0, 47.25, .55), (31.6, 47.2, .7),
                    (.75, 39.3, .65), (.8, 44.2, .8), (35.2, 40.2, .6)):
        n0 = mata(CP, x, r * .48, z, r, .82, sem=int(x * 10 + z), piso=0)
        if R.random() < .5: flores(FL, CP, n0, 10, .055, R)
        obs += T(x, z) + [r * .8]
    bugambilia(CP, FL, bmn('pb_tras_tronco', 'tronco', prio=.4), .2, 47.85, R)
    obs += T(1.4, 47.2) + [.9] + T(3.0, 47.3) + [.8]
    # macollos de zacate al pie de las bardas, alrededor de la mancha del mamey y del pozo, y a los lados del sendero
    pts = [(x + R.uniform(-.3, .3), 47.55) for x in (3.0, 5.8, 8.4, 11.8, 14.5, 20.6, 30.4, 33.0, 34.6)]
    pts += [(.5, z + R.uniform(-.3, .3)) for z in (35.2, 38.0, 41.5, 42.8, 45.6)] + [(35.5, z) for z in (39.0, 41.4, 46.6)]
    pts += [(6.2 + math.cos(a) * 2.05, 41.1 + math.sin(a) * 2.05) for a in (.3, 1.4, 2.6, 3.5, 4.6, 5.5)]
    pts += [(14 + math.cos(a) * 1.15, 44.6 + math.sin(a) * 1.15) for a in (.8, 2.2, 3.9, 5.2)]
    pts += [(x + (1.1 if k % 2 else -1.1), z) for k, (x, z) in enumerate(camino) if k % 2]
    for x, z in pts:
        for k in range(R.randint(1, 2)): zacate(ZA, x + R.uniform(-.35, .35) * k, z + R.uniform(-.35, .35) * k, R.uniform(.32, .55), R, R.randint(10, 14))
    ex('pb_tras_barro', obs=obs); ex('pb_tras_cantera', segs=segs[:4], r=1.9); ex('pb_tras_mueble', segs=segs[4:], r=.45)

def decorar():
    cocina(); despensa(); servicio(); bano(); traspatio2()

# ---------- más vida (pedido 24 nov: decorar todos los cuartos) ----------
# Salón: vitrina con loza en el muro de la medianera, cuadros, reloj de pie, lámpara de pie y plantas. Zaguán: tapete corredizo, macetones,
# consola con espejo. Comedor: alacena con loza, bodegón sobre el trinchador, plantas. Corredores: sillas Acapulco con mesita, jaula de
# pájaro en su pie, banca de hierro y macetas. Cuarto libre (dominó): repisa con cajas de dominó, sillón con lámpara, cuadro, tapete y planta.
COLOR.update(cordel=(.12, .5, .52), cordel2=(.75, .32, .2), vidrio=(.4, .5, .5), pajaro=(.85, .7, .2))
PRIO_MAT.update(cordel=.6, cordel2=.6, pajaro=.3)

def vitrina(pre, x0, x1, z0, z1, alto=2.4):
    """Vitrina de madera contra el muro (x0..x1, z0..z1 = su planta): mueble cerrado abajo, repisas con platos parados arriba."""
    MA, LO = bmn(pre + '_vitrina', 'madera'), bmn(pre + '_vitrina_loza', 'loza')
    caja(MA, x0, x1, 0, .88, z0, z1); caja(MA, x0 - .03, x1 + .03, alto - .1, alto, z0 - .03, z1 + .03)
    a_z = x1 - x0 < z1 - z0   # el mueble va a lo largo de z
    for y in (.88, 1.4, 1.9):
        caja(MA, x0, x1, y, y + .04, z0, z1)
        L0, L1 = (z0, z1) if a_z else (x0, x1); n = max(1, int((L1 - L0) / .32))
        for i in range(n):
            c = L0 + (i + .5) * (L1 - L0) / n
            if a_z: caja(LO, (x0 + x1) / 2 - .02, (x0 + x1) / 2 + .02, y + .04, y + .34, c - .13, c + .13)
            else: caja(LO, c - .13, c + .13, y + .04, y + .34, (z0 + z1) / 2 - .02, (z0 + z1) / 2 + .02)
    for a, b in (((x0, x0 + .06), (z0, z0 + .06)), ((x1 - .06, x1), (z0, z0 + .06)), ((x0, x0 + .06), (z1 - .06, z1)), ((x1 - .06, x1), (z1 - .06, z1))):
        caja(MA, a[0], a[1], 0, alto, b[0], b[1])
    return MA

def reloj_pie(pre, x, z, nx, nz):
    MA, CA = bmn(pre + '_reloj', 'madera'), bmn(pre + '_reloj_cara', 'loza')
    w, d = .55, .4
    if nz:
        caja(MA, x - w / 2, x + w / 2, 0, 2.6, z - d / 2, z + d / 2); caja(MA, x - .33, x + .33, 2.6, 2.85, z - .24, z + .24)
        caja(CA, x - .2, x + .2, 2.05, 2.45, z + nz * d / 2 - .01, z + nz * d / 2 + .01)
    else:
        caja(MA, x - d / 2, x + d / 2, 0, 2.6, z - w / 2, z + w / 2); caja(MA, x - .24, x + .24, 2.6, 2.85, z - .33, z + .33)
        caja(CA, x + nx * d / 2 - .01, x + nx * d / 2 + .01, 2.05, 2.45, z - .2, z + .2)

def acapulco(pre, x, z, ang, cordel='cordel'):
    """Silla Acapulco: aro de hierro del asiento y del respaldo con su tejido de cordel, patas en X. ang = hacia dónde mira (0 = +z)."""
    HI, CO = bmn(pre + '_acapulco', 'hierro', luz=False), bmn(pre + '_acapulco_' + cordel, cordel, recalc=False)   # tejido con cara de los dos lados
    f, r = (math.sin(ang), math.cos(ang)), (math.cos(ang), -math.sin(ang))
    W = lambda u, y, v: (x + r[0] * u + f[0] * v, y, z + r[1] * u + f[1] * v)
    def ovalo(c, a, b, t):   # centro local (u, y, v); semiejes a (de lado) y b sobre el plano inclinado t
        pts = [W(c[0] + a * math.cos(k * math.pi / 12), c[1] + b * math.sin(k * math.pi / 12) * math.sin(t), c[2] + b * math.sin(k * math.pi / 12) * math.cos(t)) for k in range(24)]
        for p, q in zip(pts, pts[1:] + pts[:1]): tubo(HI, p, q, .018, .018, 5)
        cv = CO.verts.new(V(*W(*c))); vs = [CO.verts.new(V(*p)) for p in pts]
        cb = CO.verts.new(V(*W(*c))); vb = [CO.verts.new(V(*p)) for p in pts]
        for i in range(24): CO.faces.new((cv, vs[i], vs[(i + 1) % 24])); CO.faces.new((cb, vb[(i + 1) % 24], vb[i]))
    ovalo((0, .62, .05), .42, .4, -.18)       # asiento
    ovalo((0, 1.25, -.45), .4, .55, 1.25)     # respaldo
    for u in (-.36, .36):
        tubo(HI, W(u, 0, .4), W(u, .6, -.1), .02, .02, 5); tubo(HI, W(u, 0, -.45), W(u, .66, .3), .02, .02, 5)

def jaula(pre, x, z):
    HI, PJ = bmn(pre + '_jaula', 'hierro', luz=False), bmn(pre + '_jaula_pajaro', 'pajaro')
    tubo(HI, (x, 0, z), (x, .03, z), .25, .25, 10); tubo(HI, (x, .03, z), (x, 1.5, z), .025, .025, 6)
    anillo(HI, x, z, .3, .34, 1.5, 1.55, 16); anillo(HI, x, z, .3, .34, 2.1, 2.13, 16)
    for k in range(14):
        a = k * 2 * math.pi / 14; px, pz = x + math.cos(a) * .32, z + math.sin(a) * .32
        tubo(HI, (px, 1.55, pz), (px, 2.1, pz), .008, .008, 4); tubo(HI, (px, 2.13, pz), (x, 2.4, z), .008, .008, 4)
    tubo(HI, (x, 2.4, z), (x, 2.5, z), .03, .01, 6); tubo(HI, (x - .2, 1.75, z), (x + .2, 1.75, z), .01, .01, 4)
    bmesh.ops.create_icosphere(PJ, subdivisions=1, radius=.07, matrix=Matrix.Translation(V(x, 1.84, z)) @ Matrix.Diagonal((1.4, 1, 1, 1)))
    bmesh.ops.create_icosphere(PJ, subdivisions=1, radius=.045, matrix=Matrix.Translation(V(x + .08, 1.92, z)))

def salon_vida():
    obs = []
    vitrina('pb_salon', .15, .7, 3.6, 6.4)
    cuadro('pb_salon', .165, 3.65, 5.0, 1.6, 1.0, 1, 0, 0); cuadro('pb_salon', 6.25, 3.3, 9.835, 1.1, 1.4, 0, -1, 1); cuadro('pb_salon', 1.9, 3.3, 9.835, .9, 1.1, 0, -1, 2)
    reloj_pie('pb_salon', 15.5, 9.45, 0, -1); lampara_pie('pb_salon', 11.0, 8.9)
    maceton('pb_salon', .85, .85, 1.0, obs); maceton('pb_salon', 15.15, .85, .9, obs)
    ex('pb_salon_vitrina', segs=T(.45, 3.7) + T(.45, 6.3), r=.45)
    ex('pb_salon_reloj', obs=T(15.5, 9.45) + [.4] + T(11.0, 8.9) + [.3] + obs)

def zaguan_vida():
    obs = []
    tapete_r('pb_zaguan', 17.6, .6, 19.4, 9.6, 'tapete')
    maceton('pb_zaguan', 20.4, .75, 1.0, obs); maceton('pb_zaguan', 20.4, 9.4, .8, obs)
    MA = bmn('pb_zaguan_consola', 'madera'); caja(MA, 16.15, 16.65, 1.0, 1.08, 7.4, 9.2)
    for zz in (7.45, 9.15): caja(MA, 16.17, 16.25, 0, 1.0, zz - .04, zz + .04); caja(MA, 16.52, 16.6, 0, 1.0, zz - .04, zz + .04)
    tubo(bmn('pb_zaguan_jarron', 'barro'), (16.4, 1.08, 8.3), (16.4, 1.5, 8.3), .1, .15, 10)
    cuadro('pb_zaguan', 16.165, 2.4, 8.3, .8, 1.0, 1, 0, 1)
    ex('pb_zaguan_consola', obs=obs, segs=T(16.4, 7.4) + T(16.4, 9.2), r=.4)

def comedor_vida():
    obs = []
    vitrina('pb_comedor', 29.0, 31.8, 9.38, 9.85, 2.6)
    cuadro('pb_comedor', 35.835, 4.0, 5.0, 1.8, 1.0, -1, 0, 2); cuadro('pb_comedor', 21.165, 3.0, 8.6, .9, 1.1, 1, 0, 0)
    maceton('pb_comedor', 21.85, .85, 1.0, obs); maceton('pb_comedor', 35.15, 9.15, 1.0, obs)
    ex('pb_comedor_vitrina', obs=obs, segs=T(29.0, 9.6) + T(31.8, 9.6), r=.4)

def corredores_vida():
    obs = []
    acapulco('pb_corr', 26.7, 21.2, -math.pi / 2 - .35); acapulco('pb_corr', 26.7, 23.4, -math.pi / 2 + .35, 'cordel2')
    MA = bmn('pb_corr_mesita', 'madera'); tubo(MA, (26.9, 0, 22.3), (26.9, .55, 22.3), .05, .05, 8); tubo(MA, (26.9, .55, 22.3), (26.9, .6, 22.3), .32, .32, 16)
    tubo(bmn('pb_corr_jarra', 'barro'), (26.9, .6, 22.3), (26.9, .85, 22.3), .07, .1, 10)
    obs += T(26.7, 21.2) + [.5] + T(26.7, 23.4) + [.5] + T(26.9, 22.3) + [.35]
    jaula('pb_corr', 8.6, 17.3); obs += T(8.6, 17.3) + [.35]
    HI = bmn('pb_corr_banca', 'hierro', luz=False); MB = bmn('pb_corr_banca_mad', 'madera')
    caja(MB, 21.4, 23.6, .5, .56, 33.3, 33.8); caja(MB, 21.4, 23.6, .7, 1.2, 33.74, 33.8)
    for xx in (21.5, 23.5):
        caja(HI, xx - .03, xx + .03, 0, 1.2, 33.74, 33.8); caja(HI, xx - .03, xx + .03, 0, .5, 33.3, 33.36); caja(HI, xx - .03, xx + .03, .48, .5, 33.3, 33.8)
    for mx, mz in ((8.6, 29.5), (27.4, 33.4), (8.6, 33.4), (27.4, 10.6)): maceton('pb_corr', mx, mz, .8, obs)
    ex('pb_corr_mesita', obs=obs, segs=T(21.4, 33.55) + T(23.6, 33.55), r=.4)

def libre_vida():
    obs = []
    tapete_r('pb_libre', 1.4, 25.6, 6.6, 31.0, 'tapete')
    MA = bmn('pb_libre_repisa', 'madera'); caja(MA, .15, .6, 0, 1.0, 23.0, 25.0); caja(MA, .12, .64, 1.0, 1.05, 22.95, 25.05)
    for k, zz in enumerate((23.3, 23.75, 24.2, 24.65)):   # cajas de dominó
        caja(bmn('pb_libre_caja%d' % (k % 3), ('tapete', 'cordel', 'pajaro')[k % 3]), .22, .52, 1.05, 1.13 + .03 * (k % 2), zz - .16, zz + .16)
    sillon('pb_libre', 6.9, 32.9, math.pi + .6, 'tela_v', obs); lampara_pie('pb_libre', 7.4, 33.5)
    cuadro('pb_libre', 3.5, 3.0, 33.835, 1.5, 1.0, 0, -1, 0); maceton('pb_libre', .9, 33.1, .9, obs)
    ex('pb_libre_repisa', obs=obs, segs=T(.4, 23.0) + T(.4, 25.0), r=.4)

_decorar0 = decorar
def decorar():
    _decorar0(); salon_vida(); zaguan_vida(); comedor_vida(); corredores_vida(); libre_vida()

def patio_luces():
    """El Uno se juega al aire libre (sin lámpara colgante, MESA o.aire): dos guirnaldas de focos en X entre las columnas del patio
    pasan sobre la mesa y libran el árbol; dan la luz de noche al horneado."""
    for A, Bp in (((12.2, 4.4, 14.2), (23.8, 4.4, 21.9)), ((12.2, 4.4, 25.8), (23.8, 4.4, 14.2))):
        guirnalda('pb_patio_guirnalda', A, Bp, .8, E=20)

_decorar1 = decorar
def decorar():
    _decorar1(); patio_luces()
