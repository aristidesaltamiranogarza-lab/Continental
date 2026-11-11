# Pelo del chibi (escena "Chibi"): casco con flequillo en picos y patillas largas.
# Uso en Blender: exec(open(r'C:/Users/aris1/code/Continental/blender/pelo.py').read(), {'PRM': {...}})
import bpy, bmesh, math
from mathutils import Vector
from mathutils.bvhtree import BVHTree

K = dict(
    R=24.0,                                  # raiz del flequillo (grados de elevacion)
    W=[18, 21, 24, 21, 18],                  # ancho de cada pico (grados de azimut)
    D=[10, 13, 15, 12, 9],                   # largo de cada pico
    SK=[-0.25, -0.12, 0.0, 0.12, 0.25],      # inclinacion de la punta hacia afuera
    # contorno lateral (azimut, elevacion): patilla delante de la oreja, arco sobre la oreja, nuca
    SIDE=[(51, 24), (54, 14), (57, 4), (60, -3), (65, -6), (71, -5), (76, 0), (80, 10),
          (86, 15), (100, 15), (106, 10), (114, -8), (130, -30), (150, -38), (180, -40)],
    ENV=[(0, 12), (51, 12), (66, -6), (95, 15), (140, -36), (180, -40)],
    EDGE=[(0, 0.03), (45, 0.035), (66, 0.042), (95, 0.045), (180, 0.05)],  # grosor en el borde
    O1=0.09, OP=0.55, BULGE=0.03, BE=15.0, N=144, M=18, THICK=0.035,
    COPIAS=['Frente', 'Perfil', 'Pose'], MESH='pelo_v2')
K.update(globals().get('PRM', {}))

def spline(keys, a):
    """Catmull-Rom con tangentes por diferencias (sin escalones entre claves)."""
    if a <= keys[0][0]: return keys[0][1]
    if a >= keys[-1][0]: return keys[-1][1]
    n = len(keys)
    def tan(i):
        i0, i1 = max(i - 1, 0), min(i + 1, n - 1)
        return (keys[i1][1] - keys[i0][1]) / (keys[i1][0] - keys[i0][0])
    for i in range(n - 1):
        (a0, e0), (a1, e1) = keys[i], keys[i + 1]
        if a0 <= a <= a1:
            h = a1 - a0; t = (a - a0) / h
            h00 = 2*t**3 - 3*t**2 + 1; h10 = t**3 - 2*t**2 + t
            h01 = -2*t**3 + 3*t**2; h11 = t**3 - t**2
            return h00*e0 + h10*h*tan(i) + h01*e1 + h11*h*tan(i + 1)

head = bpy.data.objects[K['COPIAS'][0] + '_Cabeza']; hm = head.data
P = [v.co.copy() for v in hm.vertices]
C = Vector([(min(p[i] for p in P) + max(p[i] for p in P)) / 2 for i in range(3)])
bvh = BVHTree.FromPolygons(P, [p.vertices[:] for p in hm.polygons])

W, D, R = K['W'], K['D'], K['R']; half = sum(W) / 2
B = [-half]
for w in W: B.append(B[-1] + w)
TIPS = [(B[i] + B[i + 1]) / 2 + K['SK'][i] * W[i] for i in range(len(W))]

def H(phi):
    if abs(phi) < half:
        for i in range(len(W)):
            if B[i] <= phi <= B[i + 1]:
                p = TIPS[i]
                u = (phi - B[i]) / (p - B[i]) if phi < p else (B[i + 1] - phi) / (B[i + 1] - p)
                return R - D[i] * u
    return spline(K['SIDE'], abs(phi))

def off(e, phi):
    a = abs(phi); es = spline(K['ENV'], a)
    s = max(0.0, min(1.0, (e - es) / (90 - es)))
    sa = math.sin(math.radians(a))
    bul = K['BULGE'] * sa * sa * math.exp(-((e - K['BE']) / 30.0) ** 2)
    return spline(K['EDGE'], a) + K['O1'] * s ** K['OP'] + bul

def surf(phi, e):
    f, el = math.radians(phi), math.radians(e)
    v = Vector((math.sin(f) * math.cos(el), -math.cos(f) * math.cos(el), math.sin(el)))
    hit = bvh.ray_cast(C + v * 3.0, -v)
    r = (hit[0] - C).length if hit[0] else 0.5
    return C + v * (r + off(e, phi))

N, M = K['N'], K['M']
phis = set(round(-180 + 360 * i / N, 4) for i in range(N))
for x in B + TIPS: phis.add(round(x, 4))
phis = sorted(p for p in phis if -180 <= p < 180)
bm = bmesh.new(); top = bm.verts.new(surf(0, 90)); cols = []
for phi in phis:
    h = H(phi)
    cols.append([bm.verts.new(surf(phi, 90 + (h - 90) * j / M)) for j in range(1, M + 1)])
n = len(cols)
for i in range(n):
    a, b = cols[i], cols[(i + 1) % n]
    bm.faces.new((top, b[0], a[0]))
    for j in range(M - 1): bm.faces.new((a[j], b[j], b[j + 1], a[j + 1]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
f0 = bm.faces[len(bm.faces) // 3]
if f0.normal.dot(f0.calc_center_median() - C) < 0: bmesh.ops.reverse_faces(bm, faces=bm.faces)
me = bpy.data.meshes.get(K['MESH']) or bpy.data.meshes.new(K['MESH'])
bm.to_mesh(me); bm.free()
for p in me.polygons: p.use_smooth = True
if not me.materials: me.materials.append(bpy.data.materials['chibi_pelo'])

for nm in K['COPIAS']:
    o = bpy.data.objects[nm + '_Pelo']
    if o.data != me:
        o.data.use_fake_user = True   # el pelo anterior queda guardado
        o.data = me
    for m in list(o.modifiers): o.modifiers.remove(m)
    so = o.modifiers.new('Grosor', 'SOLIDIFY'); so.thickness = K['THICK']; so.offset = -1; so.use_even_offset = True
    ss = o.modifiers.new('Suave', 'SUBSURF'); ss.levels = 1; ss.render_levels = 2
print('pelo ok', len(me.polygons), 'caras')
