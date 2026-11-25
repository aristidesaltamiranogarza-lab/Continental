# blender/barrio_manzana.py — la manzana de la casona (lámina A-02) menos el tramo, la plaza y el baldío: casas de la Calle 59 de este lado
# (x −62..−25 y 36..98), banqueta de este lado, postes, las filas de las calles 62 y 60, la fila del fondo (de espaldas, sin Calle 57),
# patios interiores con bardas, cuartitos, tinacos y árboles (A-02), y las calles laterales hasta el fondo. Exporta barrio_manzana.glb.
#   blender -b --factory-startup --python blender/barrio_manzana.py -- vista|hornear|exportar   (ver blender/barrio_lib.py)
import os, math
D = next(d for d in [os.getcwd()] + ([os.path.dirname(os.path.dirname(os.path.abspath(__file__)))] if '__file__' in globals() else []) if os.path.isfile(os.path.join(d, 'blender', 'casona.py')))
exec(open(os.path.join(D, 'blender', 'barrio_lib.py'), encoding='utf-8').read())
B = cargar('manzana')
exec(open(os.path.join(D, 'blender', 'barrio_trasera.py'), encoding='utf-8').read(), B.__dict__)   # paso 3: jardín del barrio
exec(open(os.path.join(D, 'blender', 'barrio_jardin.py'), encoding='utf-8').read(), B.__dict__)    # paso 3b: llenarlo

def cancha(B):
    """P3: cancha de fútbol rápido entre los patios (x 61..85, z 45..59): pasto con franjas y rayas blancas, dos porterías,
    gradita de tres escalones del lado del fondo y barda baja alrededor con entradas en las esquinas. Ligera: cajas planas."""
    P, fa, Y = B.P, B.FA(), B.YS + .02; x0, x1, z0, z1 = 61, 85, 45, 59; bl = B.PAL['blanco']; cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
    B.pieza(fa, B.lin('#76a457'), B.caja_o, x0 - .5, x1 + .5, Y - .02, Y, z0 - .5, z1 + .5)   # pasto de cancha propio (el material pasto del juego lo tiñe a seco)
    for i in range(0, 12, 2): B.pieza(fa, B.lin('#5e8c45'), B.caja_o, x0 + i * 2, x0 + i * 2 + 2, Y, Y + .01, z0, z1)   # franjas
    r = .08
    for a, b, c, d in ((x0, x1, z0, z0 + r), (x0, x1, z1 - r, z1), (x0, x0 + r, z0, z1), (x1 - r, x1, z0, z1), (cx - r / 2, cx + r / 2, z0, z1),
                       (x0, x0 + 3.5, cz - 4, cz - 4 + r), (x0, x0 + 3.5, cz + 4 - r, cz + 4), (x0 + 3.5 - r, x0 + 3.5, cz - 4, cz + 4),
                       (x1 - 3.5, x1, cz - 4, cz - 4 + r), (x1 - 3.5, x1, cz + 4 - r, cz + 4), (x1 - 3.5, x1 - 3.5 + r, cz - 4, cz + 4)):
        B.pieza(fa, bl, B.caja_o, a, b, Y, Y + .02, c, d)
    pts = [(cx + math.cos(i * math.pi / 16) * 2.5, Y + .025, cz + math.sin(i * math.pi / 16) * 2.5) for i in range(33)]
    for a, b in zip(pts, pts[1:]): B.pieza(fa, bl, P.viga, a, b, .09, .09)   # círculo central (sección cuadrada: se ve igual desde cualquier lado)
    for x, s in ((x0, -1), (x1, 1)):   # porterías: postes y travesaño blancos, red al fondo (hierro delgado)
        for z in (cz - 1.8, cz + 1.8): B.pieza(fa, bl, B.caja_o, x - .06, x + .06, Y, Y + 2.4, z - .06, z + .06)
        B.pieza(fa, bl, B.caja_o, x - .06, x + .06, Y + 2.3, Y + 2.42, cz - 1.86, cz + 1.86)
        B.pieza(B.HI(), None, P.viga, (x + s * 1.0, Y, cz - 1.8), (x + s * 1.0, Y, cz + 1.8), .03)
        for z in (cz - 1.8, cz + 1.8): B.pieza(B.HI(), None, P.viga, (x, Y + 2.4, z), (x + s * 1.0, Y, z), .03)
    for i in range(3):   # gradita
        B.pieza(fa, B.PAL['gris'], B.caja_o, 66, 80, B.YS, Y + .45 * (i + 1), z1 + 1.0 + i * .7, z1 + 1.7 + i * .7)
    for xa, za, xb, zb in ((x0 - 1, z0 - 1, x1 - 2, z0 - 1), (x0 + 2, z1 + 3.4, x1 + 1, z1 + 3.4), (x0 - 1, z0 - 1, x0 - 1, z1 - 2), (x1 + 1, z0 + 2, x1 + 1, z1 + 3.4)):
        B.barda(xa, za, xb, zb, 1.0, e=.15)
    B.ex_obs(B.NOMB + '_fachadas', cx, z1 + 2.2, 1.2)

def jardin(B):
    """Paso 3: el corazón de la manzana ya no son patios con bardas: pasto con hojas solo cerca de los caminos y un caminito curvo de laja
    que sale de la puerta trasera del jardín de la casona (x 16.5..19.5, z 48) hacia la plaza (oeste) y la entrada de la cancha (esquina NO)."""
    huecos = [(-51, 40, -23, 78), (-40, 22, -34, 40), (0, 22, 36, 48), (60.5, 44.5, 85.5, 59.5)]   # plaza e iglesia, andador, casona, cancha
    fa, c = B.FA(), B.osc(B.PAL['crema'], .9)   # rodapié: las bardas de la casona empiezan en 0 y el pasto está en YS
    for x0, x1, z0, z1 in ((-.15, .15, 22, 48.15), (35.85, 36.15, 22, 48.15), (-.15, 16.5, 47.85, 48.15), (19.5, 36.15, 47.85, 48.15)):
        B.pieza(fa, c, B.caja_o, x0, x1, B.YS, .02, z0, z1, (2,))
    B.pieza(fa, B.PAL['cantera'], B.caja_o, 16.5, 19.5, B.YS, 0, 47.85, 48.6, (2,))   # escalón de la puerta trasera
    # 3b: los caminitos son UNA forma (tronco desde la puerta, ramas a la plaza y a la cancha, ramal al rincón de dominó)
    ln = B.red([([(18, 47.6), (17.9, 49.6), (16.2, 52.0), (13, 53.3), (5, 54), (-3, 51.2), (-10, 50.4), (-17, 52.2), (-23.6, 52)], 2.6, .18, 1),
           ([(17.9, 49.6), (19.8, 52.0), (23, 53.3), (32, 54.6), (41, 52.6), (50, 51.4), (56.5, 54), (59.2, 58.2), (62.5, 60.4)], 2.6, .18, 2),
           ([(27.6, 54.0), (27.3, 56.4), (27.0, 58.4)], 1.7, .1, 3)],
          discos=[(25.4, 60.1, 2.5), (28.9, 61.1, 2.5)], cortes=[(0, 1, 47.9), (1, 0, -23.6)])
    gotas = ((8.5, 56.8, 6.5, 2.6, .12), (21.2, 58.8, 3.6, 2.2, -.2), (-18.5, 55.6, 4.2, 2.6, .3), (54.2, 60.6, 3.4, 4.2, .2), (45, 49.8, 4.2, 1.2, -.05))
    # 3b: lomas suaves; planas cerca de muros, bardas, casona, traspatio, cancha, plaza, andador, huerto, caminitos y pasto con hojas
    B.lomas_planas(rects=[(0, 22, 36, 48, 1.0), (35, 21, 57.5, 49.5, .5), (59.5, 43.5, 86.5, 63.2, .8), (-51, 40, -23, 78, 1.0),
                          (-40, 22, -34, 40, 1.0), (0, 47.5, 14.5, 52.6, .8)],
                   lineas=[(ln[0], 3.05), (ln[1], 3.05), (ln[2], 2.45)], discos=[(25.4, 60.1, 3.5), (28.9, 61.1, 3.5)], gotas=gotas)
    B.suelo_lomas(huecos)
    for i, m in enumerate(gotas): B.mancha(*m, seed=i + 1)                          # 3b: pasto con hojas en manchas de orilla irregular
    for x, z in ((-12.5, 53.6), (1.5, 55.4), (36.5, 51.1), (46, 50.3), (55.4, 57.4)): B.farol(x, z, B.SUELO(x, z))   # a un lado del camino
    B.banca_conf(-4.5, 54.2, -.34, B.SUELO(-4.5, 54.2)); B.banca_conf(43.5, 54.3, .13, B.SUELO(43.5, 54.3))
    B.mesa_domino(25.4, 60.1, .1, fichas=True); B.mesa_domino(28.9, 61.1, -.2)          # rincón de dominó bajo la ceiba
    B.huerto()                                                                           # junto a la puerta trasera, al poniente
    B.albarrada([(35.2, 58.4), (41.5, 56.5), (47.5, 55.7), (51.5, 56.6)], 31)           # albarradas que acompañan al camino
    B.albarrada([(-21.5, 49.2), (-15, 47.7), (-8.5, 47.9), (-3.6, 49.1)], 32)
    for i, (x, z, ux, uz, l) in enumerate((   # vegetación en manchas al pie de los muros traseros (el muro queda del lado (−uz, ux))
            (-19, 76.8, 1, 0, 6), (-7, 76.8, 1, 0, 4), (5, 76.8, 1, 0, 6.5), (22, 76.8, 1, 0, 5), (34, 76.8, 1, 0, 6), (45, 76.8, 1, 0, 4),
            (58, 76.8, 1, 0, 6.5), (69, 76.8, 1, 0, 4.5), (80, 76.8, 1, 0, 5.5), (84.8, 27, 0, -1, 5), (84.8, 37, 0, -1, 4), (84.8, 69, 0, -1, 4.5),
            (84.8, 75, 0, -1, 3), (62, 23.2, -1, 0, 4), (72, 23.2, -1, 0, 5), (81, 23.2, -1, 0, 4), (-49.8, 27, 0, 1, 4), (-49.8, 36.5, 0, 1, 3),
            (-1.2, 26.5, 0, -1, 4), (-1.2, 41, 0, -1, 5), (-20, 23.2, -1, 0, 4), (-11, 23.2, -1, 0, 4))):
        B.macizo(x, z, ux, uz, l, 100 + i, 1.2, 1.2)
    for i, (x, z, ux, uz, l) in enumerate(((22.6, 61.4, 0, 1, 2), (31.6, 59.0, .2, 1, 1.8), (44, 57.8, 1, -.15, 3), (-6.5, 56.2, 1, .3, 2.2))):
        B.macizo(x, z, ux, uz, l, 140 + i)                                              # orillas del rincón, la albarrada y la banca

def piezas(B):
    P, PAL, YS, YA = B.P, B.PAL, B.YS, B.YA
    # Calle 59, este lado (fachada en z=0, la calle en −z). Lotes de esquina sin patio: ahí empiezan las filas laterales.
    B.casa2(-62, -51, 6.3, PAL['terra'], 0, -1, [('v', -59.6), ('z', -56.2), ('v', -53.2)], tinaco=(-54, 7))
    B.fachada_lado(-62, 0, 12, -1, 6.3, PAL['terra'], [('v', 3.0), ('v', 8.6)])
    B.fila(-51, 0, -1, [(6, 'amarillo', 5.7), (5, 'anil', 6.1)], seed=3)          # el andador de la iglesia mide 6 (x −40..−34)
    B.fila(-34, 0, -1, [(9, 'ocre', 6.2)], seed=4)
    B.fila(36, 0, -1, [(9, 'verde', 5.9), (7, 'rosa', 5.7), (10, 'crema', 6.4), (8, 'anil', 6.0), (10, 'amarillo', 6.6), (6, 'terra', 5.8)], seed=5)
    B.casa2(86, 98, 6.0, PAL['cal'], 0, -1, [('v', 88.4), ('c', 92.3), ('p', 96.3)], tapa='teja')     # la tienda de la esquina
    B.fachada_lado(98, 0, 12, 1, 6.0, PAL['cal'], [('v', 3.2), ('v', 8.8)])
    for x0, x1 in ((-25, -18), (-18, -8), (-8, 0)):                                                  # patios del tramo (sus casas están en calle.glb)
        P.quad('manzana_pasto_c', 'pasto_c', x0, 12, x1, 22, y=YS, prio=.25); Rb = B.random.Random(int(x0 * 13)); B.barda_v(x0, 22, x1, 22, Rb)
        if x1 < 0: B.barda_v(x1, 12, x1, 22, Rb)
        B.vida_patio(x0, x1, 12, 22, Rb, tend=x0 != -25)
    B.naranjo(-21.5, 17.5); B.palmera(-12, 18, 9.5, y0=YS, choque=False); B.naranjo(-4, 16.5, 1.1)
    # banqueta de este lado (pb.glb trae la de la casona; calle.glb x −25..0 y 36..40) y las de las calles laterales hasta el fondo
    B.losa('banqueta', 'banqueta', -64, -25, -1.62, 0, 0, YA, sin=(1, 5))
    B.losa('banqueta', 'banqueta', 40, 100, -1.62, 0, 0, YA, sin=(0, 5))
    for a, b, s in ((-64, -62, 1), (98, 100, 0), (-72, -70, 0), (106, 108, 1)):        # s: el canto pegado a las casas (no se ve)
        B.losa('banqueta', 'banqueta', a, b, 0, 92, 0, YA, sin=(s, 4, 5))
    for a, b in ((-70, -64), (100, 106)): B.arroyo(a, -1.6, b, 92)
    B.postes([-50, 42, 70, 96], ext=(-25, 40))
    B.maceta(-44.3, -.4); B.maceta(-41.7, -.4, tipo='agave'); B.maceta(90.4, -.4, tipo='agave'); B.bote(84.6, -.9)
    # calle 62 (oeste, miran a −x) y calle 60 (este, miran a +x): de z 12 al fondo (90), sin patio (detrás están la plaza y la cancha)
    B.fila_lado(-62, 12, 90, -1, [(9, None, None), (8, None, None), (10, None, None), (7, None, None), (9, None, None), (11, None, None),
                                  (8, None, None), (9, None, None), (7, None, None)], seed=11, patio=0, fondo=11)
    B.fila_lado(98, 12, 90, 1, [(8, None, None), (10, None, None), (7, None, None), (9, None, None), (11, None, None), (8, None, None),
                                (9, None, None), (8, None, None), (8, None, None)], seed=12, patio=0)
    # fila del fondo de espaldas (miran a la Calle 57, que no se hace): sin rejas, sin patio
    B.fila(-26, 90, 1, [(10, None, None), (9, None, None), (12, None, None), (8, None, None), (11, None, None), (9, None, None),
                        (10, None, None), (12, None, None), (9, None, None), (10, None, None), (12, None, None)], seed=13, patio=0, rejas=False)
    B.barda(-51, 89.8, -26, 89.8, 2.6)                                                               # detrás de la iglesia
    jardin(B)
    B.laurel(-6, 30, .95, y0=B.SUELO(-6, 30), sub=2, choque=False); B.laurel(6, 62, 1.0, y0=B.SUELO(6, 62), sub=2, choque=False); B.palmera(14.5, 75.5, 10, y0=B.SUELO(14.5, 75.5), choque=False)
    B.ceiba(31, 66.5, 1.0, y0=B.SUELO(31, 66.5)); B.laurel(52.5, 68.5, 1.0, y0=B.SUELO(52.5, 68.5), sub=2); B.flamboyan(-11, 66, .9, y0=B.SUELO(-11, 66))   # 3b: sombra al centro
    B.naranjo(46, 58, 1.1, y0=B.SUELO(46, 58)); B.laurel(80, 38, .95, y0=B.SUELO(80, 38), sub=2, choque=False); B.laurel(80, 70, 1.0, y0=B.SUELO(80, 70), sub=2, choque=False)
    B.naranjo(-30, 32, y0=B.SUELO(-30, 32)); B.naranjo(18, 70, y0=B.SUELO(18, 70)); B.naranjo(66, 68, .9, y0=B.SUELO(66, 68)); B.naranjo(-8, 54, y0=B.SUELO(-8, 54))
    B.naranjo(-17, 70, y0=B.SUELO(-17, 70)); B.palmera(-45, 30, 9, y0=B.SUELO(-45, 30), choque=False); B.naranjo(62, 28, y0=B.SUELO(62, 28))
    B.flamboyan(57, 40, y0=B.SUELO(57, 40), choque=False); B.flamboyan(82, 64, .95, y0=B.SUELO(82, 64), choque=False)                 # los dos de la cancha
    cancha(B)
    B.bugambilia2(-48.6, -45.6, 2.5, 21.6, 22.4, seed=21, n=18)

VISTAS = [('manzana_cancha', (73, 14, 34), (73, 0, 52)), ('barrio_calle', (-12, 2.2, -6.5), (60, 3.2, -7)), ('barrio_plaza_azotea', (6, 13.5, 22), (-37, 3, 56)),
          ('manzana_calle', (54, 2.4, -13), (70, 4, 2)), ('manzana_oeste', (-40, 2.4, -13), (-55, 4, 4)),
          ('manzana_azotea', (18, 16, 30), (30, 0, 60)), ('manzana_todo', (18, 70, -30), (18, 0, 40)),
          ('jardin_cenital', (17.5, 92, 49.5), (17.5, 0, 50)), ('jardin_puerta', (17.5, 1.6, 49), (30, 1.2, 76)),
          ('jardin_centro', (34, 1.6, 52), (10, 1.4, 77)), ('jardin_este', (40, 1.6, 50), (78, 1.2, 74)),
          ('jardin_huerto', (16, 2.4, 56.5), (6, .4, 49.5)), ('jardin_lomas', (62, 1.4, 71), (5, .2, 63))]

if __name__ == '__main__':
    correr(B, piezas, VISTAS, ctx=('plaza', 'baldio', 'enfrente'), res=2048, muestras=300, topes=(18, 108000), ctx_vista=('horizonte',))
