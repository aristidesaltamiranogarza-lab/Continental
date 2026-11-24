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
        caja(MA, x0, x1, .72, .8, 15.4, 18.6)
        for z in (15.55, 18.45): caja(MA, x0 + .04, x1 - .04, 0, .72, z - .05, z + .05)
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

def hojas(bm, x, y, z, n, largo, ancho, alza, cae, giro=0.0):
    """Hojas planas que salen de (x, y, z) en n rumbos: suben 'alza' a medio largo y caen 'cae' en la punta (plátano, agave)."""
    for k in range(n):
        a = giro + 2 * math.pi * k / n; dx, dz = math.cos(a), math.sin(a)
        m = (x + dx * largo * .5, y + alza, z + dz * largo * .5); f = (x + dx * largo, y + alza - cae, z + dz * largo)
        viga(bm, (x, y, z), m, ancho, .02); viga(bm, m, f, ancho * .8, .02)

def traspatio2():
    """Traspatio (z 34..48): macetas en la barda del fondo, plátanos, arriate de hortalizas, sendero de laja al pozo,
    banca bajo el mamey, tendedero con ropa, tinaja junto al lavadero y un agave en su maceta junto a la puerta."""
    BA, MA, CP, TI = bmn('pb_tras_barro', 'barro', prio=.5), bmn('pb_tras_mueble', 'madera', prio=.5), bmn('pb_tras_planta', 'copa', prio=.5), bmn('pb_tras_tierra', 'tierra', prio=.4)
    HO, AG, CA, TR = bmn('pb_tras_hoja', 'hoja', prio=.5), bmn('pb_tras_agave', 'agave', prio=.5), bmn('pb_tras_cantera', 'cantera', prio=.5), bmn('pb_tras_tronco', 'tronco', prio=.5)
    HI, RO = bmn('pb_tras_hierro', 'hierro', luz=False), [bmn('pb_tras_ropa%d' % i, m, prio=.4) for i, m in enumerate(('toalla', 'hamaca', 'costal'))]
    obs = []
    for x in (19, 21, 23, 25, 27, 29):          # macetas en la barda del fondo
        tubo(BA, (x, 0, 47.1), (x, .75, 47.1), .34, .46, 12); tubo(TI, (x, .7, 47.1), (x, .72, 47.1), .42, .42, 12)
        if x % 4 == 1: hojas(AG, x, .7, 47.1, 8, .9, .15, .55, .05, giro=x)                 # agave
        else:                                                                                   # mata redonda
            for dx, dz, dy, r in ((0, 0, 1.15, .42), (.26, -.1, .95, .32), (-.25, .08, .97, .3)):
                bmesh.ops.create_icosphere(CP, subdivisions=2, radius=r, matrix=Matrix.Translation(V(x + dx, dy, 47.1 + dz)) @ Matrix.Diagonal((1, 1, .82, 1)))
        obs += T(x, 47.1) + [.55]
    for x, z, al in ((2.4, 36.8, 2.8), (33.6, 45.6, 3.1), (34.9, 43.4, 2.5)):   # plátanos
        tubo(TR, (x, 0, z), (x, al, z), .2, .14, 8); hojas(HO, x, al - .1, z, 6, 1.9, .34, .55, .9, giro=x); obs += T(x, z) + [.45]
    # arriate de hortalizas con su borde de cantera y matitas
    x0, x1, z0, z1 = 22, 29, 39, 42.4
    for a, b, c, d in ((x0, x1, z0, z0 + .22), (x0, x1, z1 - .22, z1), (x0, x0 + .22, z0 + .22, z1 - .22), (x1 - .22, x1, z0 + .22, z1 - .22)): caja(CA, a, b, 0, .45, c, d)   # sin encimarse en las esquinas (parpadeaban)
    caja(TI, x0 + .23, x1 - .23, 0, .4, z0 + .23, z1 - .23)
    for i in range(7):                       # hortalizas: lechugas (bolas bajas) y una hilera de cebollines (hojas que suben)
        for j in range(3):
            xx, zz = x0 + .85 + i * .88, z0 + .75 + j * .95
            if j == 1: hojas(HO, xx, .4, zz, 6, .32, .05, .38, -.06, giro=i)
            else: bmesh.ops.create_icosphere(HO, subdivisions=2, radius=.26, matrix=Matrix.Translation(V(xx, .52, zz)) @ Matrix.Diagonal((1, 1, .6, 1)))
    segs = T(x0 + .5, (z0 + z1) / 2) + T(x1 - .5, (z0 + z1) / 2)
    # sendero de laja del corredor al pozo
    for k in range(7):
        t = (k + .5) / 7; x, z = 18 + (14 - 18) * t, 34.8 + (43.3 - 34.8) * t; quad('pb_tras_laja', 'laja', x - .45, z - .42, x + .45, z + .42, y=.015, prio=.4)
    # banca bajo el mamey
    caja(MA, 8.3, 8.85, .72, .8, 39.8, 42.4); caja(MA, 8.78, 8.86, .8, 1.5, 39.85, 42.35)
    for z in (40.0, 42.2): caja(MA, 8.35, 8.8, 0, .72, z - .05, z + .05)
    segs += T(8.6, 40.0) + T(8.6, 42.2)
    # tendedero: dos postes, el mecate y ropa colgada
    for x in (22, 30): caja(MA, x - .08, x + .08, 0, 3.3, 45.42, 45.58); caja(MA, x - .06, x + .06, 3.1, 3.2, 45.0, 46.0)
    caja(HI, 22, 30, 3.1, 3.13, 45.49, 45.51)
    for i, (xa, w, al) in enumerate(((23.0, 1.1, 1.3), (24.6, .9, 1.0), (26.0, 1.4, .8), (27.9, 1.0, 1.4))):
        caja(RO[i % 3], xa, xa + w, 3.1 - al, 3.1, 45.47, 45.53)
    obs += T(22, 45.5) + [.3] + T(30, 45.5) + [.3]
    # tinaja junto al lavadero y agave en su maceta junto a la puerta del corredor
    tubo(BA, (35.1, 0, 37.6), (35.1, .9, 37.6), .4, .5, 14); tubo(BA, (35.1, .9, 37.6), (35.1, 1.15, 37.6), .5, .32, 14); obs += T(35.1, 37.6) + [.6]
    tubo(BA, (21.6, 0, 35.3), (21.6, .9, 35.3), .5, .62, 14); hojas(AG, 21.6, .85, 35.3, 9, 1.2, .2, .7, .1, giro=.3); hojas(AG, 21.6, .85, 35.3, 6, .8, .16, .8, -.1, giro=.7)
    obs += T(21.6, 35.3) + [.75]
    ex('pb_tras_barro', obs=obs); ex('pb_tras_cantera', segs=segs[:4], r=1.9); ex('pb_tras_mueble', segs=segs[4:], r=.45)

def decorar():
    cocina(); despensa(); servicio(); bano(); traspatio2()
