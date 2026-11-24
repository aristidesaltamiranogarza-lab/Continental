# blender/barrio_manzana.py — la manzana de la casona (lámina A-02) menos el tramo, la plaza y el baldío: casas de la Calle 59 de este lado
# (x −62..−25 y 36..98), banqueta de este lado, postes, las filas de las calles 62 y 60, la fila del fondo (de espaldas, sin Calle 57),
# patios interiores con bardas, cuartitos, tinacos y árboles (A-02), y las calles laterales hasta el fondo. Exporta barrio_manzana.glb.
#   blender -b --factory-startup --python blender/barrio_manzana.py -- vista|hornear|exportar   (ver blender/barrio_lib.py)
import os
D = next(d for d in [os.getcwd()] + ([os.path.dirname(os.path.dirname(os.path.abspath(__file__)))] if '__file__' in globals() else []) if os.path.isfile(os.path.join(d, 'blender', 'casona.py')))
exec(open(os.path.join(D, 'blender', 'barrio_lib.py'), encoding='utf-8').read())
B = cargar('manzana')

def piezas(B):
    P, PAL, YS, YA = B.P, B.PAL, B.YS, B.YA
    # Calle 59, este lado (fachada en z=0, la calle en −z). Lotes de esquina sin patio: ahí empiezan las filas laterales.
    B.casa2(-62, -51, 6.3, PAL['terra'], 0, -1, [('v', -59.6), ('z', -56.2), ('v', -53.2)], tinaco=(-54, 7))
    B.fachada_lado(-62, 0, 12, -1, 6.3, PAL['terra'], [('v', 3.0), ('v', 8.6)])
    B.fila(-51, 0, -1, [(6, 'amarillo', 5.7), (6, 'anil', 6.1)], seed=3)
    B.fila(-35, 0, -1, [(10, 'ocre', 6.2)], seed=4)
    B.fila(36, 0, -1, [(9, 'verde', 5.9), (7, 'rosa', 5.7), (10, 'crema', 6.4), (8, 'anil', 6.0), (10, 'amarillo', 6.6), (6, 'terra', 5.8)], seed=5)
    B.casa2(86, 98, 6.0, PAL['cal'], 0, -1, [('v', 88.4), ('c', 92.3), ('p', 96.3)], tapa='teja')     # la tienda de la esquina
    B.fachada_lado(98, 0, 12, 1, 6.0, PAL['cal'], [('v', 3.2), ('v', 8.8)])
    for x0, x1 in ((-25, -18), (-18, -8), (-8, 0)):                                                  # patios del tramo (sus casas están en calle.glb)
        P.quad('manzana_suelo', 'tierra_p', x0, 12, x1, 22, y=YS, prio=.25); B.barda(x0, 22, x1, 22)
        if x1 < 0: B.barda(x1, 12, x1, 22)
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
    # patios interiores: suelo, bardas entre lotes, cuartitos y árboles (A-02)
    for x0, z0, x1, z1 in ((-51, 22, -39, 40), (-35, 22, 0, 40), (-23, 40, 0, 78), (0, 48, 36, 78), (36, 48, 60, 78), (54, 22, 86, 44),
                           (36, 22, 54, 24), (60, 60, 86, 78), (-26, 64, -23, 78), (54, 44, 60, 48)):
        P.quad('manzana_suelo', 'tierra_p', x0, z0, x1, z1, y=YS, prio=.2)
    for xa, za, xb, zb in ((-12, 22, -12, 78), (-23, 40, 0, 40), (-23, 59, 0, 59), (12, 48, 12, 78), (24, 48, 24, 78), (0, 63, 60, 63),
                           (48, 48, 48, 78), (70, 22, 70, 44), (54, 33, 86, 33), (73, 60, 73, 78), (-26, 78, -23, 78)):
        B.barda(xa, za, xb, zb)
    for x0, x1, zf, dz, w in ((-20, -15, 26, 1, 4), (5, 11, 52, 1, 4), (40, 45, 74, -1, 4), (76, 82, 27, 1, 4.5), (62, 67, 74, -1, 4), (-9, -4, 74, -1, 4)):
        B.casa2(x0, x1, 3.8, PAL['crema'], zf, dz, [('p', (x0 + x1) / 2)], w, tapa='gris', rejas=False)   # cuartitos de atrás
    B.laurel(-6, 30, .95, y0=YS, sub=2, choque=False); B.laurel(6, 62, 1.0, y0=YS, sub=2, choque=False); B.palmera(28, 68, 10, y0=YS, choque=False)
    B.naranjo(46, 58, 1.1, y0=YS); B.laurel(80, 38, .95, y0=YS, sub=2, choque=False); B.laurel(80, 70, 1.0, y0=YS, sub=2, choque=False)
    B.naranjo(40, 72, y0=YS); B.naranjo(-30, 32, y0=YS); B.naranjo(18, 70, y0=YS); B.naranjo(66, 68, .9, y0=YS); B.naranjo(-8, 54, y0=YS)
    B.naranjo(-17, 70, y0=YS); B.palmera(-45, 30, 9, y0=YS, choque=False); B.naranjo(62, 28, y0=YS)
    B.flamboyan(57, 40, y0=YS, choque=False); B.flamboyan(82, 64, .95, y0=YS, choque=False)                 # los dos de la cancha
    B.bugambilia2(-48.6, -45.6, 2.5, 21.6, 22.4, seed=21, n=18)

VISTAS = [('barrio_calle', (-12, 2.2, -6.5), (60, 3.2, -7)), ('barrio_plaza_azotea', (6, 13.5, 22), (-37, 3, 56)),
          ('manzana_calle', (54, 2.4, -13), (70, 4, 2)), ('manzana_oeste', (-40, 2.4, -13), (-55, 4, 4)),
          ('manzana_azotea', (18, 16, 30), (30, 0, 60)), ('manzana_todo', (18, 70, -30), (18, 0, 40))]

if __name__ == '__main__':
    correr(B, piezas, VISTAS, ctx=('plaza', 'baldio', 'enfrente'), res=2048, muestras=300, topes=(18, 90000), ctx_vista=('horizonte',))
