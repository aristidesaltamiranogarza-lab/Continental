# blender/casona_pa_deco.py — Decoración de la planta alta (CASONA.md paso 9, grupo 3: tu cuarto y sala de música).
# Se ejecuta dentro de casona_pa.py (armar -> deco()) y usa sus nombres (P, bmn, caja, tubo, disco, ex, vacio, T, librero).
# Tu cuarto (x 0..8, z 17..30; puerta al corredor en x 8, z 22..25): cama con cabecera, colcha y almohadas, buró con lámpara,
# baúl al pie, ropero y espejo de cuerpo entero (los dos llevan accion_mipj: abren "Mi personaje"), tapete. Sala de música
# (x 28..36, z 10..30; Backgammon en 32, 24.5): radio de consola (accion_radio: la música), discoteca baja, tocadiscos de
# bocina en su mesita, guitarra recargada, sillón y tapete. Coordenadas del plano (x, alto, z); caras de los muros a .15.
P.COLOR.update(colcha=(.62, .2, .18), tela=(.88, .85, .78), espejo=(.55, .62, .66), laton=(.7, .52, .22), rejilla=(.55, .45, .3),
               madera_osc=(.22, .13, .08), sillon=(.42, .22, .16))
P.PRIO_MAT.update(tela=.6, laton=.5, rejilla=.7)
viga, anillo = P.viga, P.anillo

def tu_cuarto():
    MA, MO, CO, TE, ES = bmn('pa_cuarto_madera', 'madera'), bmn('pa_cuarto_ropero', 'madera_osc'), bmn('pa_cuarto_colcha', 'colcha'), \
        bmn('pa_cuarto_tela', 'tela'), bmn('pa_cuarto_espejo', 'espejo')
    LA, LU = bmn('pa_cuarto_laton', 'laton'), bmn('pa_cuarto_foco', 'farol', luz=False)
    # cama contra el muro del sur (cabecera en z 29.85): patas, bastidor, colchón, colcha que cae a los lados, almohadas
    x0, x1, z0, z1 = 3.4, 7.0, 26.2, 29.75
    for x in (x0 + .08, x1 - .08):
        for z in (z0 + .08, z1 - .08): caja(MA, x - .08, x + .08, 0, .5, z - .08, z + .08)
    caja(MA, x0, x1, .4, .58, z0, z1); caja(TE, x0 + .05, x1 - .05, .58, .92, z0 + .05, z1 - .05)
    caja(CO, x0 - .04, x1 + .04, .7, .96, z0 - .04, z1 - .9); caja(CO, x0 - .04, x0 + .01, .45, .96, z0 - .04, z1 - .9); caja(CO, x1 - .01, x1 + .04, .45, .96, z0 - .04, z1 - .9)
    caja(CO, x0 - .04, x1 + .04, .45, .96, z0 - .04, z0 + .01)
    for xa, xb in ((x0 + .25, 5.1), (5.3, x1 - .25)): caja(TE, xa, xb, .92, 1.18, z1 - .78, z1 - .2)
    caja(MA, x0 - .05, x1 + .05, 0, 2.3, z1, 29.85); caja(MA, x0 - .12, x1 + .12, 2.3, 2.42, z1 - .04, 29.85)
    for xx in (x0 + .05, x1 - .05): caja(MA, xx - .09, xx + .09, 0, 2.5, z1 - .08, 29.85)
    # buró con lámpara y baúl al pie de la cama
    caja(MA, 2.45, 3.25, 0, 1.1, 28.95, 29.75); caja(MA, 2.4, 3.3, 1.1, 1.16, 28.9, 29.8)
    tubo(LA, (2.85, 1.16, 29.35), (2.85, 1.7, 29.35), .05, .04, 8); tubo(LU, (2.85, 1.7, 29.35), (2.85, 2.05, 29.35), .3, .18, 12)
    caja(MO, 4.2, 6.2, 0, .85, 25.25, 26.0); caja(MO, 4.15, 6.25, .85, .95, 25.2, 26.05)
    for x in (4.45, 5.95): caja(LA, x - .05, x + .05, 0, .97, 25.22, 26.03)
    # ropero contra el muro del poniente: cuerpo, cornisa, dos puertas con sus tiradores
    caja(MO, .15, 1.15, 0, 3.0, 23.4, 26.8); caja(MO, .15, 1.25, 3.0, 3.16, 23.3, 26.9)
    caja(MO, 1.15, 1.18, .15, 2.85, 25.08, 25.12)
    for zz in (24.95, 25.25): caja(LA, 1.15, 1.22, 1.4, 1.75, zz - .03, zz + .03)
    for za, zb in ((23.55, 25.0), (25.2, 26.65)): caja(MO, 1.15, 1.19, .35, 2.7, za, za + .06); caja(MO, 1.15, 1.19, .35, 2.7, zb - .06, zb)
    # espejo de cuerpo entero en el muro del poniente
    caja(MA, .15, .27, .25, 3.35, 19.55, 21.65); caja(ES, .27, .29, .38, 3.22, 19.68, 21.52)
    disco('pa_cuarto_tapete', 'tapete', 4.4, 22.6, 2.1, .012, 40, uvr=True)
    vacio('accion_mipj_n1', .9, 1.8, 20.6, r=1.0); vacio('accion_mipj2_n1', 1.6, 1.8, 25.1, r=1.2)
    ex('pa_cuarto_madera', segs=T(5.2, 27.0) + T(5.2, 29.0), r=1.95)
    ex('pa_cuarto_ropero', segs=T(.65, 23.7) + T(.65, 26.5) + T(4.5, 25.6) + T(5.9, 25.6), r=.55)

def sala_musica():
    MO, MA, RE, LA, NE, SI = bmn('pa_musica_consola', 'madera_osc'), bmn('pa_musica_madera', 'madera'), bmn('pa_musica_rejilla', 'rejilla'), \
        bmn('pa_musica_laton', 'laton'), bmn('pa_musica_hierro', 'hierro', luz=False), bmn('pa_musica_sillon', 'sillon')
    LU = bmn('pa_musica_dial', 'farol', luz=False)
    # radio de consola contra el muro del oriente: mueble con patas, rejilla de la bocina, dial encendido y perillas
    for z in (14.1, 15.5):
        for x in (34.55, 35.7): caja(MO, x - .06, x + .06, 0, .35, z - .06, z + .06)
    caja(MO, 34.4, 35.85, .35, 2.0, 13.9, 15.7); caja(MO, 34.32, 35.85, 2.0, 2.1, 13.82, 15.78)
    caja(RE, 34.36, 34.4, .55, 1.45, 14.15, 15.45); caja(LU, 34.36, 34.4, 1.6, 1.82, 14.35, 15.25)
    for z in (14.4, 15.2): tubo(LA, (34.4, 1.71, z), (34.3, 1.71, z), .07, .07, 10)
    vacio('accion_radio_n1', 34.6, 1.4, 14.8, r=1.1)
    # discoteca baja en el muro del norte (la textura de libros pasa por lomos de discos)
    librero('h', 10, 29.0, 33.6, 1, alto=1.6, fondo=.5)
    # tocadiscos de bocina sobre su mesita
    caja(MA, 34.2, 35.6, 1.15, 1.22, 10.5, 11.6)
    for x in (34.3, 35.5):
        for z in (10.6, 11.5): caja(MA, x - .04, x + .04, 0, 1.15, z - .04, z + .04)
    caja(MO, 34.45, 35.35, 1.22, 1.42, 10.65, 11.45); tubo(NE, (34.9, 1.42, 11.05), (34.9, 1.44, 11.05), .32, .32, 16)
    tubo(LA, (35.2, 1.44, 10.8), (35.2, 1.75, 10.8), .03, .03, 6); tubo(LA, (35.2, 1.75, 10.8), (34.7, 2.25, 11.25), .05, .42, 14)
    # guitarra recargada en el muro del poniente (junto a la puerta)
    tubo(MA, (28.18, .5, 12.4), (28.34, .5, 12.4), .45, .45, 16); tubo(MA, (28.24, 1.12, 12.4), (28.4, 1.12, 12.4), .34, .34, 14)
    tubo(NE, (28.35, .78, 12.4), (28.36, .78, 12.4), .12, .12, 12)
    viga(MA, (28.33, 1.4, 12.4), (28.46, 2.65, 12.4), .1, .04); caja(MO, 28.4, 28.55, 2.62, 2.92, 12.32, 12.48)
    # sillón frente a la radio y tapete
    caja(SI, 31.3, 32.5, .5, .95, 14.1, 15.5); caja(SI, 31.15, 31.5, .5, 2.0, 14.0, 15.6)
    for zz in (13.95, 15.65): caja(SI, 31.15, 32.55, .5, 1.35, zz - .15, zz + .15)
    for x in (31.3, 32.4):
        for z in (13.9, 15.7): caja(MA, x - .06, x + .06, 0, .5, z - .06, z + .06)
    disco('pa_musica_tapete', 'tapete', 32.8, 14.8, 2.0, .012, 40, uvr=True)
    ex('pa_musica_consola', segs=T(35.1, 14.0) + T(35.1, 15.6) + T(34.9, 10.6) + T(34.9, 11.5), r=.75)
    ex('pa_musica_sillon', obs=T(31.85, 14.8) + [1.0] + T(28.4, 12.4) + [.5])
