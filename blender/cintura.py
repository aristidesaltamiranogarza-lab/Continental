# Cintura entallada de la playera de Frente (opcion A): angosta la prenda de arriba hacia la cadera para que
# no se vea mucho mas ancha que el pantalon. La primera vez guarda la malla original como 'playera_orig'
# (fake user) y siempre parte de ella, asi se puede correr varias veces. cuerpo_m.py parte de 'playera_orig'.
# Despues correr ropa.py y rig.py.
# Uso: exec(open(r'C:/Users/aris1/code/Continental/blender/cintura.py').read(), {'PRM': {...}})
import bpy

K = dict(
    # (z, escala x, escala y): arriba de 1.5 no cambia; abajo queda ~0.215 de medio ancho (antes 0.29)
    PERFIL=[(1.50, 1.0, 1.0), (1.35, 0.945, 0.97), (1.15, 0.82, 0.92), (0.97, 0.74, 0.9)])
K.update(globals().get('PRM', {}))

ob = bpy.data.objects['Frente_Playera']
orig = bpy.data.meshes.get('playera_orig')
if not orig:
    orig = ob.data.copy(); orig.name = 'playera_orig'; orig.use_fake_user = True

def escala(z):
    P = K['PERFIL']
    if z >= P[0][0]: return P[0][1:]
    for (z0, *a), (z1, *b) in zip(P, P[1:]):
        if z1 <= z <= z0:
            t = (z0 - z) / (z0 - z1); t = t * t * (3 - 2 * t)
            return [a[i] + (b[i] - a[i]) * t for i in range(2)]
    return P[-1][1:]

me = ob.data
for v, vo in zip(me.vertices, orig.vertices):
    sx, sy = escala(vo.co.z); v.co = (vo.co.x * sx, vo.co.y * sy, vo.co.z)
me.update()
print('cintura ok; medio ancho abajo', round(max(abs(v.co.x) for v in me.vertices if v.co.z < 0.98), 3))
