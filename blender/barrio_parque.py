# blender/barrio_parque.py — parque nuevo frente a la casona (CASONA.md "Barrio", P2): detrás de las casas de enfrente, con entrada
# desde la banqueta donde estaba la casa terracota (x 15..24, frente al zaguán). Kiosco (movido de la plaza, P1) con su plaza redonda
# de pasta, andadores en cruz con guarnición, pasto, árboles del kit, faroles, bancas de parque, carrito de marquesitas, juegos
# infantiles (columpio, resbaladilla, sube y baja) y las letras de MÉRIDA de colores sobre base gris. Las sillas confidentes se piden
# aparte: aquí solo queda su lugar libre junto al kiosco. Low-poly, color por vértice, sin texturas nuevas. Exporta barrio_parque.glb.
#   blender -b --factory-startup --python blender/barrio_parque.py -- vista|hornear|exportar   (ver blender/barrio_lib.py)
import os, math
D = next(d for d in [os.getcwd()] + ([os.path.dirname(os.path.dirname(os.path.abspath(__file__)))] if '__file__' in globals() else []) if os.path.isfile(os.path.join(d, 'blender', 'casona.py')))
exec(open(os.path.join(D, 'blender', 'barrio_lib.py'), encoding='utf-8').read())
B = cargar('parque')
X0, X1, Z0, Z1 = -12, 52, -27.6, -74     # parque (plano): de la espalda de las casas de enfrente hacia el fondo
EX = (17.5, 21.5)                         # andador de entrada (la casa terracota de ENF ya no está: casona_calle.py)
CX, CZ, RP = 19.5, -50, 9.5               # kiosco y su plaza redonda
YP = .06                                  # andadores sobre el pasto

def banca(x, z, ang=0.0):
    """Banca de parque sencilla: asiento a 0.95 y respaldo de tablas sobre patas de hierro. Sin girar: largo en x, mira a −z."""
    def arma():
        fa, hi = B.FA(), B.HI(); m = B.PAL['madera']
        for dx in (-1.0, 1.0):
            B.pieza(hi, None, B.caja_o, x + dx - .05, x + dx + .05, 0, .9, z - .3, z + .25)
            B.pieza(hi, None, B.caja_o, x + dx - .05, x + dx + .05, .9, 1.9, z + .2, z + .28)
        for i in range(3): B.pieza(fa, m, B.caja_o, x - 1.2, x + 1.2, .9, .97, z - .32 + i * .2, z - .16 + i * .2)
        for y in (1.3, 1.65): B.pieza(fa, m, B.caja_o, x - 1.2, x + 1.2, y, y + .18, z + .26, z + .32)
    B.girado(ang, x, z, arma)

def marquesitas(x, z, ang=0.0):
    """Carrito de marquesitas: caja blanca con franja azul, vitrina, plancha, dos ruedas, manubrio y sombrilla de rayas."""
    def arma():
        fa, hi = B.FA(), B.HI(); P = B.P
        B.pieza(fa, B.PAL['blanco'], B.caja_o, x - 1.0, x + 1.0, .45, 1.55, z - .5, z + .5)
        B.pieza(fa, B.PAL['azul'], B.caja_o, x - 1.01, x + 1.01, .9, 1.1, z - .51, z + .51)
        B.pieza(fa, B.osc(B.PAL['vidrio'], 1.2), B.caja_o, x - .9, x + .2, 1.55, 2.0, z - .4, z + .4)       # vitrina (queso, cajeta)
        B.pieza(fa, B.PAL['negro'], B.caja_o, x + .3, x + .95, 1.55, 1.62, z - .4, z + .4)                 # plancha
        for dz in (-.55, .55): B.pieza(fa, B.PAL['negro'], P.tubo, (x - .4, .45, z + dz), (x - .4, .45, z + dz * 1.15), .45, .45, 12)
        B.pieza(hi, None, B.caja_o, x + .8, x + .9, 0, .45, z - .05, z + .05)                              # pata
        B.pieza(hi, None, P.viga, (x + 1.0, 1.3, z - .4), (x + 1.5, 1.35, z - .4), .04)
        B.pieza(hi, None, P.viga, (x + 1.0, 1.3, z + .4), (x + 1.5, 1.35, z + .4), .04)
        B.pieza(hi, None, P.viga, (x + 1.5, 1.35, z - .42), (x + 1.5, 1.35, z + .42), .05)                 # manubrio
        B.pieza(hi, None, P.tubo, (x, 1.55, z), (x, 3.3, z), .04, .04, 6)                                  # palo de la sombrilla
        B.pieza(fa, B.PAL['lona'], P.tubo, (x, 3.05, z), (x, 3.55, z), 1.4, .05, 8)                        # sombrilla (cono)
    B.girado(ang, x, z, arma)
    B.ex_obs(B.NOMB + '_fachadas', x, z, 1.3)

def juegos(x, z):
    """Juegos infantiles sobre arenero: columpio de dos asientos, resbaladilla y sube y baja (hierro y colores planos)."""
    fa, hi = B.FA(), B.HI(); P = B.P
    B.P.quad(B.NOMB + '_arenero', 'tierra_p', x - 7, z - 5, x + 7, z + 5, y=.04, prio=.4)
    # columpio: dos A de hierro y travesaño a 3.2; asientos a .6
    for dx in (-5.5, -1.5):
        for dz in (-1.0, 1.0): B.pieza(hi, None, P.viga, (x + dx, 0, z + dz), (x + dx, 3.2, z), .07)
    B.pieza(hi, None, P.viga, (x - 5.5, 3.2, z), (x - 1.5, 3.2, z), .08)
    for sx, c in ((-4.5, 'naranja'), (-2.5, 'azul')):
        for dx in (-.25, .25): B.pieza(hi, None, P.viga, (x + sx + dx, .65, z), (x + sx + dx, 3.2, z), .015)
        B.pieza(fa, B.PAL[c], B.caja_o, x + sx - .3, x + sx + .3, .58, .66, z - .18, z + .18)
    # resbaladilla: escalera, descanso a 2.1 y rampa hacia +z
    rx = x + 2.5
    for dx in (-.4, .4): B.pieza(hi, None, P.viga, (rx + dx, 0, z - 2.2), (rx + dx, 2.1, z - 1.2), .05)
    for i in range(1, 6):
        t = i / 6; B.pieza(hi, None, P.viga, (rx - .4, 2.1 * t, z - 2.2 + t), (rx + .4, 2.1 * t, z - 2.2 + t), .03)
    B.pieza(fa, B.PAL['amarillo'], B.caja_o, rx - .5, rx + .5, 2.0, 2.1, z - 1.2, z - .4)
    for dx in (-.5, .5): B.pieza(hi, None, B.caja_o, rx + dx - .04, rx + dx + .04, 0, 2.0, z - .45, z - .37)
    B.pieza(fa, B.PAL['rosa'], P.viga, (rx, 2.05, z - .4), (rx, .35, z + 2.6), .8, .06)
    for dx in (-.42, .42): B.pieza(fa, B.osc(B.PAL['rosa'], .8), P.viga, (rx + dx, 2.2, z - .4), (rx + dx, .5, z + 2.6), .05, .16)
    # sube y baja: soporte y tabla
    sx = x + 5.5
    B.pieza(hi, None, P.viga, (sx, 0, z - .2), (sx, .6, z), .08); B.pieza(hi, None, P.viga, (sx, 0, z + .2), (sx, .6, z), .08)
    B.pieza(fa, B.PAL['verde'], P.viga, (sx, .25, z - 2.0), (sx, .95, z + 2.0), .3, .07)
    for dz in (-1.7, 1.7): B.pieza(hi, None, P.viga, (sx - .2, .55 + dz * .175 + .25, z + dz), (sx + .2, .55 + dz * .175 + .25, z + dz), .03)
    B.ex_obs(B.NOMB + '_fachadas', x - 3.5, z, 2.2); B.ex_obs(B.NOMB + '_fachadas', rx, z, 1.6); B.ex_obs(B.NOMB + '_fachadas', sx, z, 1.2)

# letras de MÉRIDA: cajas en una cuadrícula de letra (u a lo ancho en el sentido de lectura, v alto); s = trazo
_s, _W, _H = .34, 1.3, 2.0
LETRAS = {
    'M': [(0, _s, 0, _H), (_W - _s, _W, 0, _H), (_s, _s + .22, 1.4, _H), (_s + .16, _s + .38, 1.0, 1.6), (_W / 2 - .13, _W / 2 + .13, .75, 1.25),
          (_W - _s - .38, _W - _s - .16, 1.0, 1.6), (_W - _s - .22, _W - _s, 1.4, _H)],
    'E': [(0, _s, 0, _H), (0, _W, _H - _s, _H), (0, _W * .85, _H / 2 - _s / 2, _H / 2 + _s / 2), (0, _W, 0, _s)],
    'R': [(0, _s, 0, _H), (0, _W - .2, _H - _s, _H), (_W - _s, _W, _H / 2 + .05, _H - .12), (0, _W - .2, _H / 2 - _s / 2, _H / 2 + _s / 2),
          (_W / 2 - .05, _W / 2 + .3, .55, _H / 2 - .1), (_W - _s - .05, _W, 0, .6)],
    'I': [(.13, .13 + _s, 0, _H)],
    'D': [(0, _s, 0, _H), (0, _W - .35, _H - _s, _H), (0, _W - .35, 0, _s), (_W - _s, _W, .35, _H - .35),
          (_W - .55, _W - .15, _H - _s - .2, _H - .12), (_W - .55, _W - .15, .12, _s + .2)],
    'A': [(0, _s, 0, _H - .35), (_W - _s, _W, 0, _H - .35), (.18, _W - .18, _H - _s, _H), (0, _W, _H / 2 - _s / 2 - .1, _H / 2 + _s / 2 - .1),
          (.06, _s + .1, _H - .5, _H - .2), (_W - _s - .1, _W - .06, _H - .5, _H - .2)]}
ANCHO = dict(I=.6)

def letras_merida(xd, z):
    """MÉRIDA monumental: cada letra de un color con franja de grecas blanca, sobre base gris. Se lee mirando hacia −z del plano
    (llegando por el andador de la entrada); en el plano la lectura va de x alta a x baja (xd = orilla derecha de la base)."""
    fa = B.FA(); cols = ['rosa', 'amarillo', 'anil', 'verde', 'naranja', 'lona']
    pal = [('M', 0), ('E', 1), ('R', 2), ('I', 3), ('D', 4), ('A', 5)]
    tot = sum(ANCHO.get(l, _W) for l, _ in pal) + .3 * (len(pal) - 1)
    B.pieza(fa, B.PAL['gris'], B.caja_o, xd - tot - .4, xd + .4, 0, .5, z - .6, z + .6)
    B.pieza(fa, B.PAL['blanco'], B.caja_o, xd - tot - .41, xd + .41, .2, .3, z - .61, z + .61)
    u0 = 0.0
    for l, ci in pal:
        c = B.PAL[cols[ci]]; bl = B.osc(c, 1.35)
        for a, b, v0, v1 in LETRAS[l]:
            B.pieza(fa, c, B.caja_o, xd - u0 - b, xd - u0 - a, .5 + v0, .5 + v1, z - .25, z + .25)
            for g0 in (.35, 1.45):   # grecas: dos franjas claras sobre cada trazo que las cruza
                if v0 < g0 and v1 > g0 + .12: B.pieza(fa, bl, B.caja_o, xd - u0 - b - .01, xd - u0 - a + .01, .5 + g0, .5 + g0 + .12, z - .26, z + .26)
        if l == 'E': B.pieza(fa, c, B.caja_o, xd - u0 - _W * .75, xd - u0 - _W * .45, .5 + _H + .15, .5 + _H + .45, z - .25, z + .25)   # acento de la É
        u0 += ANCHO.get(l, _W) + .3
    B.ex_obs(B.NOMB + '_fachadas', xd - tot / 2, z, tot / 2 + .4)

def piezas(B):
    P, YS = B.P, B.YS
    # suelo: pasto del parque y la entrada desde la banqueta de enfrente
    B.losa('pasto', 'pasto', X0, X1, Z1, Z0, 0, prio=.35)
    B.losa('pasto', 'pasto', 15, 24, Z0, -15.6, 0, prio=.35)
    B.losa('banqueta', 'banqueta', EX[0], EX[1], Z0 - .01, -15.6, B.YE, prio=.5, sin=(4, 5))
    for x in (15.12, 23.88): B.barda(x, -15.6, x, Z0, 2.4)          # bardas de las vecinas a los lados de la entrada
    # andadores en cruz (de la entrada al kiosco, y de lado a lado) con guarnición de cantera
    for a, b, c, d in ((EX[0], EX[1], CZ + RP - .5, Z0), (EX[0], EX[1], Z1, CZ - RP + .5), (X0, CX - RP + .5, CZ - 2, CZ + 2), (CX + RP - .5, X1, CZ - 2, CZ + 2)):
        B.losa('andador', 'banqueta', a, b, min(c, d), max(c, d), YP, prio=.5)
    B.pieza(B.M('pasta', 'pasta', prio=.7), None, P.tubo, (CX, YS, CZ), (CX, .1, CZ), RP, RP, 32)
    B.kiosco(CX, CZ, .1)
    # faroles: en la entrada, en el andador y en la plaza del kiosco
    for x, z in ((EX[0] - .4, -20), (EX[1] + .4, -26), (EX[0] - .4, -33), (EX[1] + .4, -38)): B.farol(x, z, YP)
    for a in (45, 135, 225, 315):
        r = math.radians(a); B.farol(CX + math.cos(r) * (RP - .6), CZ + math.sin(r) * (RP - .6), .1)
    # bancas de parque a los lados de los andadores (el anillo junto al kiosco queda libre para las confidentes)
    for x in (4, 10, 30, 36): banca(x, CZ - 3.0, 0.0); banca(x, CZ + 3.0, math.pi)
    banca(EX[0] - 1.8, -42, -math.pi / 2); banca(EX[1] + 1.8, -42, math.pi / 2)
    # árboles (el laurel de barrio_enfrente en (−2, −50) y el de (43, −45) ya están: se dejan libres)
    B.laurel(6, -34, 1.0); B.laurel(34, -64, .95)
    B.flamboyan(8, -64, 1.0); B.flamboyan(32, -35, .95)
    B.ceiba(-6, -66, .9); B.ceiba(46, -34, .9)
    B.palmera(14.5, -31, 9.5); B.palmera(24.5, -31.5, 10)
    B.naranjo(28, -58); B.naranjo(11, -58)
    for x, z in ((15, -44), (24, -44), (-8, -40), (48, -60), (2, -71), (38, -71)): B.agave(x, z, .9, 0)
    for x, z in ((-10, -30), (50, -30), (-10, -56), (50, -48), (20, -72)): B.mata(x, z, 1.1, 0)
    marquesitas(EX[1] + 3.2, CZ + RP + 1.6, math.pi / 2)
    juegos(40, -58)
    letras_merida(13.6, -37.5)
    # barda baja del parque en el fondo y los lados (al frente cierran las espaldas de las casas de enfrente)
    B.barda(X0, Z1, X1, Z1, 1.4); B.barda(X0, Z1, X0, Z0, 1.4); B.barda(X1, Z1, X1, Z0, 1.4)

VISTAS = [('parque_entrada', (19.5, 2.4, -12), (19.5, 3, -40)), ('parque_kiosco', (30, 3.5, -38), (19.5, 3, -52)),
          ('parque_juegos', (30, 3, -48), (40, 1, -60)), ('parque_arriba', (20, 40, 5), (20, 0, -50))]

if __name__ == '__main__':
    correr(B, piezas, VISTAS, ctx=('enfrente',), res=2048, muestras=300, topes=(20, 60000))
