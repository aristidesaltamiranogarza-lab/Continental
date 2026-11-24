# blender/barrio_enfrente.py — la Calle 59 fuera del tramo y la acera de enfrente (lámina A-02): arroyo de x −72 a 108 (con los cruces de
# las calles 62 y 60), banqueta de enfrente con dos tramos de pasta, casas de enfrente (x −62..−25 y 40..98) con sus patios, esquinas
# que doblan a las calles laterales, laureles en la banqueta, árboles detrás, tope, coladeras, triciclo, puesto y botes; las calles
# laterales de este lado hasta z −83. Exporta barrio_enfrente.glb.
#   blender -b --factory-startup --python blender/barrio_enfrente.py -- vista|hornear|exportar   (ver blender/barrio_lib.py)
import os, math
D = next(d for d in [os.getcwd()] + ([os.path.dirname(os.path.dirname(os.path.abspath(__file__)))] if '__file__' in globals() else []) if os.path.isfile(os.path.join(d, 'blender', 'casona.py')))
exec(open(os.path.join(D, 'blender', 'barrio_lib.py'), encoding='utf-8').read())
B = cargar('enfrente')
ZE = -15.6          # fachadas de enfrente (miran a +z)

def piezas(B):
    P, PAL, YS, YA, YE = B.P, B.PAL, B.YS, B.YA, B.YE
    # arroyo de la Calle 59 (calle.glb trae x −25..40) y banqueta de enfrente (alta como la del tramo) con pasta en dos casas
    for a, b in ((-72, -25), (40, 108)): B.arroyo(a, -11.6, b, -1.6)
    segs = [(-64, -50, 'banqueta'), (-50, -42, 'pasta'), (-42, -25, 'banqueta'), (40, 64, 'banqueta'), (64, 72, 'pasta'), (72, 100, 'banqueta')]
    for a, b, m in segs:
        B.losa(m, m, a, b, ZE, -11.58, YE, YA, sin=(4,) + ((0,) if a != -64 else ()) + ((1,) if b != 100 else ()))   # solo las esquinas con canto
    # calles laterales de este lado: arroyo y banquetas hasta z −83 (de ahí sigue la de código)
    for a, b in ((-70, -64), (100, 106)): B.arroyo(a, -83, b, -11.6)
    for a, b, s, y in ((-64, -62, 1, YE), (98, 100, 0, YE), (-72, -70, 0, 0), (106, 108, 1, 0)):
        B.losa('banqueta', 'banqueta', a, b, -83, ZE, y, YA, sin=(s, 4, 5))
    # casas de enfrente (fachada en z=−15.6, la calle en +z); las de esquina sin patio: ahí empiezan las de la calle lateral
    B.casa2(-62, -52, 6.4, PAL['verde'], ZE, 1, [('v', -59.8), ('p', -57.2), ('v', -54.4)], tinaco=(-59, 6))
    B.fachada_lado(-62, -27.6, ZE, -1, 6.4, PAL['verde'], [('v', -24.6), ('v', -19.0)])
    B.fila(-52, ZE, 1, [(8, 'rosa', 5.8), (12, 'amarillo', 6.6), (7, 'anil', 5.9)], seed=21,
           huecos=[None, [('v', -42.2), ('v', -39.8), ('z', -36.0), ('v', -33.6)], None])
    B.fila(40, ZE, 1, [(10, 'terra', 6.2), (8, 'cal', 5.7), (12, 'verde', 6.8), (7, 'ocre', 5.9), (9, 'anil', 6.3)], seed=22)
    B.casa2(86, 98, 6.1, PAL['amarillo'], ZE, 1, [('v', 88.3), ('z', 92.0), ('v', 95.6)])
    B.fachada_lado(98, -27.6, ZE, 1, 6.1, PAL['amarillo'], [('v', -24.4), ('p', -19.2)])
    B.fila_lado(-62, -45, -27.6, -1, [(9, 'ocre', 6.0), (8.4, 'rosa', 5.7)], seed=23, patio=0, fondo=10)
    B.fila_lado(98, -45, -27.6, 1, [(8.4, 'crema', 5.8), (9, 'terra', 6.2)], seed=24, patio=0, fondo=10)
    # árboles: laureles en la banqueta cargados hacia la calle, y detrás de la fila (A-02) más sencillos
    B.laurel(-30, -13.6, 1.0, lean=(0, 1), y0=YE); B.laurel(54, -13.6, 1.0, lean=(0, 1), y0=YE)
    for x, z in ((-42, -46), (-2, -50), (43, -45), (80, -50)): B.laurel(x, z, .9, y0=YS, sub=2, choque=False)
    # en la calle: tope, coladeras, triciclo, puesto de la esquina, botes y macetas
    B.tope(60, -11.55, -1.65)
    for x, z in ((64, -10.9), (-42, -10.9), (-50, -2.3), (90, -2.3)): B.coladera(x, z)
    B.triciclo(84, -2.6, 0)
    B.puesto(-59.5, -13.3, math.pi, YE)
    B.bote(-55.6, -12.2, YE); B.bote(76.4, -12.2, YE, PAL['azul'])
    B.maceta(45.6, -15.22, YE, 'agave'); B.maceta(47.9, -15.22, YE); B.maceta(-47.2, -15.22, YE)
    B.bugambilia2(71.0, 74.5, 5.9, -16.6, -15.2, seed=31, n=22)

VISTAS = [('enfrente_este', (36, 2.4, -3.0), (62, 4, -16)), ('enfrente_oeste', (-20, 2.4, -3.0), (-48, 4, -16)),
          ('enfrente_esquina', (88, 2.6, -6), (104, 3, -40)), ('enfrente_todo', (18, 60, 25), (18, 0, -20))]

if __name__ == '__main__':
    correr(B, piezas, VISTAS, ctx=('manzana',), res=2048, muestras=300, topes=(16, 70000))
