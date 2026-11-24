# blender/barrio_baldio.py — el baldío junto al traspatio de la casona (lámina A-02: x 36..54, z 24..48): hierba seca con parches de
# tierra, bardas (una sin pintar), bugambilia sobre la barda, agaves, matas, piedras, una llanta y blocks apilados. El perro lo pone el
# juego (solo en Completo) en el empty baldio_perro. Exporta barrio_baldio.glb.
#   blender -b --factory-startup --python blender/barrio_baldio.py -- vista|hornear|exportar   (ver blender/barrio_lib.py)
import os, math, random
D = next(d for d in [os.getcwd()] + ([os.path.dirname(os.path.dirname(os.path.abspath(__file__)))] if '__file__' in globals() else []) if os.path.isfile(os.path.join(d, 'blender', 'casona.py')))
exec(open(os.path.join(D, 'blender', 'barrio_lib.py'), encoding='utf-8').read())
B = cargar('baldio')

def piezas(B):
    P, PAL, YS, fa = B.P, B.PAL, B.YS, B.FA()
    R = random.Random(48)
    P.quad('baldio_suelo', 'hierba', 36, 24, 54, 48, y=YS, prio=.6)
    for cx, cz, r in ((40, 34, 2.4), (47, 28, 1.8), (50, 44, 2.2), (43, 45.5, 1.4)):      # parches de tierra
        P.plano(B.M('tierra', 'tierra_p', prio=.6), [(cx + r * (1 + .25 * math.sin(i * 2.3)) * math.cos(i * math.pi / 5), cz + r * .7 * (1 + .2 * math.cos(i * 1.7)) * math.sin(i * math.pi / 5)) for i in range(10)], YS + .01)
    B.barda(36, 24, 54, 24, 2.5, PAL['crema']); B.barda(54, 24, 54, 48, 2.5, B.osc(PAL['ocre'], .95)); B.barda(36, 48, 54, 48, 2.4, PAL['gris'])
    B.bugambilia2(49.5, 53.8, 2.5, 23.6, 25.2, seed=52, n=26)
    for x, z, s in ((41, 30, 1.2), (49, 42, 1.0), (44, 44, .9), (38.6, 40, .8), (52, 33, 1.1), (46.5, 35.5, .7)): B.agave(x, z, s, YS)
    for i in range(8): B.mata(R.uniform(37.5, 52.5), R.uniform(25.5, 46.5), R.uniform(.7, 1.2), YS, B.osc(PAL['hoja'], R.uniform(.85, 1.2)))
    for i in range(6): B.mata(R.uniform(37.5, 52.5), R.uniform(25.5, 46.5), R.uniform(.5, .8), YS, P.COLOR['hierba'])
    for i in range(7): B.pieza(fa, B.osc(PAL['gris'], R.uniform(.8, 1.1)), B.ico, R.uniform(37, 53), YS + .1, R.uniform(25, 47), R.uniform(.2, .45), 1, .6)
    B.pieza(fa, PAL['negro'], P.tubo, (42.6, YS, 38.2), (42.6, YS + .32, 38.2), .55, .55, 10)          # llanta acostada
    B.pieza(fa, B.osc(PAL['tierra_p'] if 'tierra_p' in PAL else PAL['ocre'], .7), P.tubo, (42.6, YS + .32, 38.2), (42.6, YS + .33, 38.2), .3, .3, 10)
    for i, (dx, dy, dz) in enumerate(((0, 0, 0), (.42, 0, 0), (.21, .2, 0), (0, 0, .22), (.42, 0, .22))):  # blocks
        B.pieza(fa, PAL['gris'], B.caja_o, 51 + dx, 51.4 + dx, YS + dy, YS + dy + .2, 46.2 + dz, 46.4 + dz)
    P.vacio('baldio_perro', 45, 0, 37, rot=2.2)

VISTAS = [('baldio_arriba', (30, 12, 20), (45, 0, 38)), ('baldio_bajo', (38, 2.0, 26), (48, 1, 42))]

if __name__ == '__main__':
    correr(B, piezas, VISTAS, ctx=('manzana',), res=512, muestras=300, topes=(6, 12000))
