# blender/casona_pa_deco.py — Decoración de la planta alta (CASONA.md paso 9, grupo 3: tu cuarto y sala de música).
# Se ejecuta dentro de casona_pa.py (armar -> deco()) y usa sus nombres (P, bmn, caja, tubo, disco, ex, vacio, T, librero).
# Tu cuarto (x 0..8, z 17..30; puerta al corredor en x 8, z 22..25): cama con cabecera, colcha y almohadas, buró con lámpara,
# baúl al pie, ropero y espejo de cuerpo entero (los dos llevan accion_mipj: abren "Mi personaje"), tapete. Sala de música
# (x 28..36, z 10..30; Backgammon en 32, 24.5): radio de consola (accion_radio: la música), discoteca baja, tocadiscos de
# bocina en su mesita, guitarra recargada, sillón y tapete. Coordenadas del plano (x, alto, z); caras de los muros a .15.
P.COLOR.update(guitarra=(.78, .5, .24), cuerda=(.85, .82, .72), colcha=(.62, .2, .18), tela=(.88, .85, .78), espejo=(.55, .62, .66), laton=(.7, .52, .22), rejilla=(.55, .45, .3),
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

def guitarra(bx, bz, MO, NE, LA):
    """Guitarra de 1.3 (a escala del personaje de 2.1): cuerpo con cinturas, boca, puente, mástil con diapasón, clavijero con
    clavijas y seis cuerdas. Apoyada en el piso en (bx, bz) y recargada con la cabeza en el muro x=28.15."""
    GU, CU = bmn('pa_guitarra', 'guitarra'), bmn('pa_guitarra_cuerdas', 'cuerda', luz=False)
    L = 1.3; top = (28.27, L * .985); dx, dy = top[0] - bx, top[1]
    ln = math.hypot(dx, dy); u = (dx / ln, dy / ln); n = (u[1], -u[0])          # u: a lo largo; n: frente de la tapa (hacia +x y un poco arriba)
    n = (-n[0], -n[1]) if n[0] < 0 else n
    def p(b, a, c): return P.V(bx + u[0] * b + n[0] * c, .02 + u[1] * b + n[1] * c, bz + a)
    def prisma(bm, perfil, c0, c1):                                             # perfil: [(b, a)] cerrado, extruido de c0 a c1 por el frente
        t = [bm.verts.new(p(b, a, c1)) for b, a in perfil]; d = [bm.verts.new(p(b, a, c0)) for b, a in perfil]
        bm.faces.new(t); bm.faces.new(d[::-1]); k = len(perfil)
        for i in range(k): j = (i + 1) % k; bm.faces.new([d[i], d[j], t[j], t[i]])
    # cuerpo: medio ancho por altura (lo de abajo, la cintura y lo de arriba)
    hw = [(0, .1), (.03, .19), (.09, .245), (.18, .26), (.27, .23), (.34, .175), (.39, .17), (.45, .2), (.52, .205), (.58, .17), (.62, .08)]
    perfil = [(b, -w) for b, w in hw] + [(b, w) for b, w in reversed(hw)]
    prisma(GU, perfil, 0, .1)
    prisma(MO, [(b, -w - .008) for b, w in hw] + [(b, w + .008) for b, w in reversed(hw)], -.004, .004)   # aro oscuro de la orilla
    prisma(NE, [(.42 + .055 * math.cos(k * math.pi / 8), .055 * math.sin(k * math.pi / 8)) for k in range(16)], .1, .104)   # boca
    prisma(MO, [(.12, -.09), (.12, .09), (.16, .09), (.16, -.09)], .1, .125)                     # puente
    # mástil y diapasón (de .6 a 1.12), clavijero inclinado (1.12 a 1.3) con tres clavijas por lado
    prisma(GU, [(.58, -.04), (1.12, -.032), (1.12, .032), (.58, .04)], .02, .08)
    prisma(MO, [(.5, -.042), (1.12, -.034), (1.12, .034), (.5, .042)], .08, .095)
    prisma(MO, [(1.12, -.045), (1.3, -.055), (1.3, .055), (1.12, .045)], .05, .085)
    for k in range(3):
        b = 1.16 + k * .045
        for sa in (-1, 1): tubo(LA, (bx + u[0] * b + n[0] * .07, .02 + u[1] * b + n[1] * .07, bz + sa * .05), (bx + u[0] * b + n[0] * .07, .02 + u[1] * b + n[1] * .07, bz + sa * .09), .012, .012, 6)
    for k in range(6):                                                                         # cuerdas del puente a la cejuela
        a0, a1 = -.05 + k * .02, -.025 + k * .01
        prisma(CU, [(.14, a0 - .002), (1.12, a1 - .002), (1.12, a1 + .002), (.14, a0 + .002)], .128, .132)
    ex('pa_guitarra', obs=T(bx - .2, bz) + [.35])

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
    guitarra(28.68, 12.4, MO, NE, LA)   # recargada en el muro del poniente (junto a la puerta)
    # sillón frente a la radio y tapete
    caja(SI, 31.3, 32.5, .5, .95, 14.1, 15.5); caja(SI, 31.15, 31.5, .5, 2.0, 14.0, 15.6)
    for zz in (13.95, 15.65): caja(SI, 31.15, 32.55, .5, 1.35, zz - .15, zz + .15)
    for x in (31.3, 32.4):
        for z in (13.9, 15.7): caja(MA, x - .06, x + .06, 0, .5, z - .06, z + .06)
    disco('pa_musica_tapete', 'tapete', 32.8, 14.8, 2.0, .012, 40, uvr=True)
    ex('pa_musica_consola', segs=T(35.1, 14.0) + T(35.1, 15.6) + T(34.9, 10.6) + T(34.9, 11.5), r=.75)
    ex('pa_musica_sillon', obs=T(31.85, 14.8) + [1.0] + T(28.4, 12.4) + [.5])

# ---------- más vida (pedido 24 nov: decorar todos los cuartos) ----------
# Biblioteca: sillón de lectura con lámpara de pie, globo terráqueo y escalera recargada en el librero. Antesala: tapete corredizo y cuadros.
# Sala de tableros: mapa y retrato, sillón con lámpara, macetones. Corredor alto: cuadros entre los arbotantes.
P.COLOR.update(globo=(.3, .48, .62))
P.PRIO_MAT.update(globo=.4)

def globo(x, z):
    MA, LA, GL = bmn('pa_globo_mad', 'madera'), bmn('pa_globo_laton', 'laton'), bmn('pa_globo', 'globo')
    for k in range(3):
        a = k * 2 * math.pi / 3; tubo(MA, (x + math.cos(a) * .3, 0, z + math.sin(a) * .3), (x, .75, z), .03, .03, 6)
    tubo(MA, (x, .75, z), (x, .9, z), .05, .05, 8)
    bmesh.ops.create_icosphere(GL, subdivisions=2, radius=.32, matrix=P.Matrix.Translation(P.V(x, 1.22, z)))
    P.anillo(LA, x, z, .34, .37, 1.2, 1.24, 24)

def escalera_lib(x, z0, z1, alto=3.0):
    MA = bmn('pa_libreros', 'madera')
    for zz in (z0, z1): P.viga(MA, (x + .55, 0, zz), (x, alto, zz), .035)
    for k in range(1, 8):
        t = k / 8; P.viga(MA, (x + .55 * (1 - t), alto * t, z0), (x + .55 * (1 - t), alto * t, z1), .025)

def biblioteca_vida():
    obs = []
    P.sillon('pa_bib', 2.0, 1.4, .8, 'tela_s', obs); P.lampara_pie('pa_bib', 1.1, .5, 50, 2.3)
    globo(14.4, 8.9); obs += T(14.4, 8.9) + [.4]
    escalera_lib(.75, 6.2, 6.8)
    ex('pa_globo_mad', obs=obs)

def antesala_vida():
    P.tapete_r('pa_ante', 17.6, .6, 19.4, 9.6, 'tapete')
    P.cuadro('pa_ante', 16.165, 2.3, 8.3, .8, 1.0, 1, 0, 1); P.cuadro('pa_ante', 20.835, 2.3, 1.6, .9, .7, -1, 0, 0)

def tableros_vida():
    obs = []
    P.cuadro('pa_tab', 30.25, 2.3, 9.835, 1.7, 1.0, 0, -1, 0); P.cuadro('pa_tab', 21.165, 2.3, 8.6, .8, 1.0, 1, 0, 1)
    P.sillon('pa_tab', 34.4, 1.1, -.8, 'tela_v', obs); P.lampara_pie('pa_tab', 35.35, .5, 50, 2.3)
    P.maceton('pa_tab', 21.8, .8, .9, obs); P.maceton('pa_tab', 35.2, 9.2, .9, obs)
    ex('pa_tab_macetas', obs=obs)

def corredor_vida():
    P.cuadro('pa_corr', 8.165, 2.3, 20.0, .9, 1.0, 1, 0, 1); P.cuadro('pa_corr', 27.835, 2.3, 23.0, 1.0, .8, -1, 0, 2)

def mas_vida():
    biblioteca_vida(); antesala_vida(); tableros_vida(); corredor_vida()
