# blender/barrio_plaza.py — andador, plaza e iglesia (lámina A-02; plaza del tamaño de la de código, 28 × 24, juego cx −55, cz −35).
# Andador entre dos vecinas (x −39..−35, de la banqueta a la plaza) con sus bardas y faroles; plaza con kiosco al centro, plaza redonda de
# octágono y taco con 2 sillas confidentes, andadores en cruz, fuente a la entrada, faroles, dos laureles, un flamboyán y una ceiba; atrio con cruz
# y la iglesia al fondo mirando a la plaza (dos torres con cupulín, espadaña, almenas y cúpula). Exporta barrio_plaza.glb.
#   blender -b --factory-startup --python blender/barrio_plaza.py -- vista|hornear|exportar   (ver blender/barrio_lib.py)
import os, math
D = next(d for d in [os.getcwd()] + ([os.path.dirname(os.path.dirname(os.path.abspath(__file__)))] if '__file__' in globals() else []) if os.path.isfile(os.path.join(d, 'blender', 'casona.py')))
exec(open(os.path.join(D, 'blender', 'barrio_lib.py'), encoding='utf-8').read())
B = cargar('plaza')
CX, CZ, RP = -37, 52, 9.5        # kiosco y plaza redonda

def iglesia(B):
    P, PAL, pieza, cf, fa, hi = B.P, B.PAL, B.pieza, B.cf, B.FA(), B.HI()
    ig, cal, osc = PAL['iglesia'], PAL['cal'], B.osc
    B.ZF, B.DZ = 68, -1                                     # fachada en z=68, mira a la plaza (−z); d: hacia la plaza
    n0 = len(fa.faces); pieza(fa, ig, cf, -43, -31, 0, 9.6, -16, 0); B._tapa(fa, n0, PAL['azotea'])          # nave
    pieza(fa, ig, cf, -43, -31, 0, 9.6, 0, .3)                                                                # frente de la fachada
    pieza(fa, ig, P.prisma, 'h', 68, [(-43, 9.6), (-31, 9.6), (-31, 11), (-34, 12.5), (-37, 13.3), (-40, 12.5), (-43, 11)], -.3, .3)   # espadaña
    perfil = [(-43.2, 11), (-40, 12.5), (-37, 13.3), (-34, 12.5), (-30.8, 11)]
    for (xa, ya), (xb, yb) in zip(perfil, perfil[1:]): pieza(fa, cal, P.viga, (xa, ya + .08, 68), (xb, yb + .08, 68), .4, .1)   # remate de cal
    pieza(fa, cal, P.tubo, (-37, 13.35, 68), (-37, 14.4, 68), .12, .1, 6); pieza(fa, cal, B.caja_o, -37.4, -36.6, 14.0, 14.15, 67.95, 68.05)
    for u in (-38.2, -37, -35.8):                                                                              # tres huecos de campana
        pieza(fa, osc(PAL['vidrio'], .6), P.prisma, 'h', 68, [(u - .32, 10.7), (u + .32, 10.7), (u + .32, 11.5)] + P.arco(u, .32, 11.5, 6, 0, math.pi) + [(u - .32, 11.5)], -.33, -.2)
    pieza(fa, osc(ig, .7), cf, -43, -31, 0, .7, .3, .36)                                                     # zoclo
    for a, b in ((-43.1, -42.4), (-31.6, -30.9)): pieza(fa, cal, cf, a, b, 0, 9.6, .3, .42)                   # pilastras
    pieza(fa, cal, cf, -43.2, -30.8, 9.35, 9.8, .3, .45)                                                      # cornisa
    pieza(fa, cal, cf, -43.2, -30.8, 5.3, 5.5, .3, .38)                                                       # imposta
    def arcop(u, w, y0, y1):   # rectángulo con medio punto encima, en el plano de la fachada
        r = w / 2; return [(u - r, y0), (u + r, y0), (u + r, y1)] + P.arco(u, r, y1, 10, 0, math.pi) + [(u - r, y1)]
    pieza(fa, cal, P.prisma, 'h', 68, arcop(-37, 3.3, 0, 3.3), -.36, -.2)                                     # marco de la puerta
    pieza(fa, PAL['madera'], P.prisma, 'h', 68, arcop(-37, 2.6, 0, 3.3), -.39, -.2)
    pieza(fa, osc(PAL['madera'], .55), cf, -37.03, -36.97, 0, 4.4, .39, .41)
    pieza(fa, cal, P.prisma, 'h', 68, arcop(-37, 1.9, 6.0, 7.2), -.36, -.2)                                   # ventana del coro
    pieza(fa, PAL['vidrio'], P.prisma, 'h', 68, arcop(-37, 1.3, 6.2, 7.2), -.39, -.2)
    for x0 in (-46, -32):                                                                                      # torres
        x1, xm = x0 + 4, x0 + 2
        pieza(fa, ig, cf, x0, x1, 0, 11.8, -4, .5)
        pieza(fa, osc(ig, .7), cf, x0, x1, 0, .7, .5, .56)
        pieza(fa, cal, cf, x0 - .15, x1 + .15, 11.6, 12.0, -4.15, .65)
        pieza(fa, ig, cf, x0 + .3, x1 - .3, 12.0, 14.6, -3.7, .2)
        B.ZF, B.DZ = 68, -1
        for fn in ('f', 'b', 'l', 'r'):                                                                       # campanario: arcos oscuros
            if fn == 'f': pieza(fa, osc(PAL['vidrio'], .6), cf, xm - .55, xm + .55, 12.5, 14.1, .2, .23)
            elif fn == 'b': pieza(fa, osc(PAL['vidrio'], .6), cf, xm - .55, xm + .55, 12.5, 14.1, -3.73, -3.7)
            else:
                xx = x0 + .3 if fn == 'l' else x1 - .3; s = -1 if fn == 'l' else 1
                pieza(fa, osc(PAL['vidrio'], .6), B.caja_o, min(xx, xx + s * .03), max(xx, xx + s * .03), 12.5, 14.1, 68 + .9, 68 + 2.6)
        pieza(fa, cal, cf, x0 + .1, x1 - .1, 14.6, 14.9, -3.9, .4)
        zt = 69.75
        pieza(fa, cal, P.tubo, (xm, 14.9, zt), (xm, 16.7, zt), 1.55, .3, 8)                                    # cupulín
        pieza(fa, cal, P.tubo, (xm, 16.7, zt), (xm, 17.2, zt), .22, .2, 6)
        pieza(hi, None, P.viga, (xm, 17.2, zt), (xm, 18.4, zt), .05)
        pieza(hi, None, P.viga, (xm - .35, 17.95, zt), (xm + .35, 17.95, zt), .05)
    for z in [69.2 + 1.25 * i for i in range(12)]:                                                            # almenas
        for xa in (-43, -31.4): pieza(fa, ig, B.caja_o, xa, xa + .4, 9.6, 10.2, z, z + .5)
    for z in (72.5, 76.5, 80.5):                                                                              # ventanas altas
        for xa, xb in ((-43.05, -43.0), (-31.0, -30.95)):
            pieza(fa, cal, B.caja_o, xa - .04, xb + .04, 5.9, 8.1, z - .7, z + .7)
            pieza(fa, PAL['vidrio'], B.caja_o, xa - .07, xb + .07, 6.1, 7.9, z - .5, z + .5)
    pieza(fa, cal, P.tubo, (-37, 9.6, 80), (-37, 11.0, 80), 2.7, 2.6, 8)                                      # cúpula
    pieza(fa, cal, P.tubo, (-37, 11.0, 80), (-37, 13.2, 80), 2.7, .45, 8)
    pieza(fa, cal, P.tubo, (-37, 13.2, 80), (-37, 14.0, 80), .4, .3, 6)
    # atrio de cantera con escalón y cruz atrial
    B.losa('cantera', 'cantera', -50, -26, 64, 68, .3, sin=(5,))
    for z0, z1, y in ((62.5, 62.95, -.14), (62.95, 63.4, 0.0), (63.4, 64, .15)):   # escalones de la plaza (al ras del pasto) al atrio
        B.losa('cantera', 'cantera', -40, -34, z0, z1, y, sin=(5,) if z1 == 64 else ())
    can = PAL['cantera']
    pieza(fa, osc(can, .9), B.caja_o, -37.8, -36.2, .3, .6, 65.1, 66.7)
    pieza(fa, can, B.caja_o, -37.55, -36.45, .6, 1.5, 65.35, 66.45)
    pieza(fa, osc(can, .9), B.caja_o, -37.65, -36.35, 1.5, 1.62, 65.25, 66.55)
    pieza(fa, cal, B.caja_o, -37.11, -36.89, 1.62, 3.7, 65.79, 66.01)
    pieza(fa, cal, B.caja_o, -37.6, -36.4, 2.8, 3.02, 65.79, 66.01)
    # más detalle: portada con pilastras y entablamento, reloj y campanas en la espadaña, ventanas y pináculos en las torres,
    # contrafuertes en la nave, cornisa del tambor y cruz en la cúpula (todo se une en una malla: B.unido)
    for u in (-39.25, -34.75): pieza(fa, cal, cf, u - .22, u + .22, 0, 5.0, .36, .52)
    pieza(fa, cal, cf, -39.6, -34.4, 5.0, 5.3, .36, .56)
    pieza(fa, cal, P.tubo, (-37, 12.5, 67.72), (-37, 12.5, 67.58), .5, .5, 16)                               # reloj
    pieza(fa, PAL['blanco'], P.tubo, (-37, 12.5, 67.6), (-37, 12.5, 67.54), .41, .41, 16)
    pieza(fa, PAL['negro'], B.caja_o, -37.03, -36.97, 12.5, 12.85, 67.52, 67.55)
    pieza(fa, PAL['negro'], B.caja_o, -37.26, -37.0, 12.47, 12.53, 67.52, 67.55)
    for u in (-38.2, -37, -35.8): pieza(fa, osc(PAL['dorado'], .55), P.tubo, (u, 11.55, 67.6), (u, 11.0, 67.6), .09, .24, 8)   # campanas
    for x0 in (-46, -32):
        xm = x0 + 2
        pieza(fa, cal, P.prisma, 'h', 68, arcop(xm, .95, 6.2, 7.6), -.54, -.45)
        pieza(fa, osc(PAL['vidrio'], .6), P.prisma, 'h', 68, arcop(xm, .6, 6.35, 7.6), -.56, -.45)
        for x in (x0 + .3, x0 + 3.7):
            for z in (67.75, 71.75):
                pieza(fa, cal, P.tubo, (x, 14.9, z), (x, 15.55, z), .14, .05, 6); pieza(fa, cal, B.ico, x, 15.62, z, .09, 1)
    for z in (74.5, 78.5, 82.6):                                                                               # contrafuertes
        pieza(fa, ig, P.prisma, 'h', z, [(-44.0, 0), (-42.9, 0), (-42.9, 8.6), (-44.0, 6.0)], -.35, .35)
        pieza(fa, ig, P.prisma, 'h', z, [(-31.1, 0), (-30.0, 0), (-30.0, 6.0), (-31.1, 8.6)], -.35, .35)
    pieza(fa, cal, P.tubo, (-37, 10.9, 80), (-37, 11.12, 80), 2.85, 2.85, 8)
    pieza(hi, None, P.viga, (-37, 14.0, 80), (-37, 15.1, 80), .05)
    pieza(hi, None, P.viga, (-37.32, 14.75, 80), (-36.68, 14.75, 80), .05)

def piezas(B):
    P, PAL, YS = B.P, B.PAL, B.YS
    # andador de 6: de la banqueta (z 0) a la plaza (z 40) y de ahí al atrio (paso 3); faroles sobre el pasto, fuera del camino
    # entre las casas va a nivel de banqueta (0); donde acaban los lotes (z 22) baja dos escalones al nivel del jardín y de la plaza.
    # Con sus lados (antes solo la tapa: al recalcular normales quedaba boca abajo y en el juego no se veía).
    YP = YS + .06                                  # plaza y andadores al ras del pasto del jardín (antes 35 cm arriba: flotaban)
    B.losa('banqueta', 'banqueta', -40, -34, 0, 22, 0, sin=(4,))
    for z0, z1, y in ((22, 22.4, -.1), (22.4, 22.8, -.2)): B.losa('escalon', 'banqueta', -40, -34, z0, z1, y)
    B.losa('banqueta', 'banqueta', -40, -34, 22.8, 62.5, YP)
    B.farol(-41.3, 26, YS); B.farol(-32.7, 35, YS)
    B.maceta(-39.5, 6.0); B.maceta(-34.5, 9.5, tipo='agave')
    # plaza: pasto en cuatro cuadrantes, andadores en cruz y plaza redonda de pasta
    for x0, x1 in ((-51, -40), (-34, -23)):
        for z0, z1 in ((40, 50), (54, 64)): B.cuadrante('pasto', 'pasto', x0, x1, z0, z1, CX, CZ, RP, YS)
    for a, b in ((-51, -40), (-34, -23)): B.losa('banqueta', 'banqueta', a, b, 50, 54, YP)
    # remate de cantera al final del brazo del este: ahí empieza el caminito de laja de la manzana (antes se encimaban 60 cm)
    B.losa('cantera', 'cantera', -23, -22.6, 49.8, 54.2, YP + .03)
    # piso de octágono y taco (CMAT 'plaza'; la roseta de pasta es de la casa) y guarnición de cantera en la orilla
    B.pieza(B.M('plaza', 'plaza', prio=.7), None, P.tubo, (CX, YS - .02, CZ), (CX, YS + .1, CZ), RP, RP, 48)
    B.pieza(B.M('cantera', 'cantera'), None, P.anillo, CX, CZ, RP - .3, RP + .06, YS - .02, YS + .115, 64)
    B.fuente(CX, CZ, YS + .1)   # P1: el kiosco se fue al parque nuevo (barrio_parque.py); la fuente queda al centro de la plaza
    for i in (0, 4):   # solo 2 confidentes, frente a frente (eran 8, chiquitas)
        a = i * math.pi / 4 + math.pi / 8; B.banca_conf(CX + math.cos(a) * 8.2, CZ + math.sin(a) * 8.2, a + math.pi / 2, YS + .1)
    for x, z in ((-41.2, 41.0), (-32.8, 62.9), (-50.4, 49.3), (-23.6, 54.7)): B.farol(x, z, YS)   # junto a los andadores, no en ellos
    B.laurel(-46, 44.5, 1.0, y0=YS); B.laurel(-28, 44.5, 1.0, y0=YS); B.flamboyan(-28, 59.5, 1.0, y0=YS); B.ceiba(-46, 59.5, .95, y0=YS)
    for x, z in ((-42.6, 41.2), (-31.4, 41.2)): B.agave(x, z, .9, YS)
    B.unido(iglesia, B)
    B.palmera(-48, 78, 10, y0=YS); B.palmera(-28.5, 79, 9.5, y0=YS)
    P.quad('plaza_pasto_c', 'pasto_c', -51, 64, -23, 89.8, y=YS, prio=.25)      # alrededor de la iglesia: pasto liso (paso 3)

VISTAS = [('plaza_andador', (-37, 2.4, -6), (-37, 4, 40)), ('plaza_kiosco', (-30, 2.6, 41.5), (-40, 4, 58)),
          ('plaza_iglesia', (-29, 2.4, 58), (-38, 7, 68)), ('plaza_iglesia_lado', (-14, 11, 71), (-37, 7, 76)), ('plaza_arriba', (-12, 22, 30), (-37, 0, 58))]

if __name__ == '__main__':
    correr(B, piezas, VISTAS, ctx=('manzana',), res=2048, muestras=300, topes=(16, 60000))
