# Peinados 2-6 del chibi (escena "Chibi"). Mismo casco que pelo.py (contorno H(azimut), volumen O1, grosor
# Solidify) con extras: mechones en cono (TUFTS), cortina que cae vertical bajo E0 (melena) y piezas sueltas
# (coleta en tubo, chongo en esfera). Cada peinado n deja las mallas 'pelo_n' (casco) y 'pelo_n_extra', y una
# figura de muestra 'Peinado_n' (copia ligada de Frente con ese pelo) en la coleccion "Peinados".
# Uso: exec(open(r'C:/Users/aris1/code/Continental/blender/pelos.py').read(), {'PRM': {'SOLO': [3], 3: {'O1': 0.1}}})
import bpy, bmesh, math
from mathutils import Vector, Matrix

BASE = dict(R=24.0, W=[18, 21, 24, 21, 18], D=[10, 13, 15, 12, 9], SK=[-0.25, -0.12, 0.0, 0.12, 0.25],
            SIDE=[(51, 24), (80, 10), (180, -40)], ENV=[(0, 12), (51, 12), (66, -6), (95, 15), (140, -36), (180, -40)],
            EDGE=[(0, 0.03), (45, 0.035), (66, 0.042), (95, 0.045), (180, 0.05)],
            O1=0.09, OP=0.55, BULGE=0.03, BE=15.0, N=144, M=18, THICK=0.035,
            TUFTS=[], E0=None, FLARE=0.0, EXTRA=[])
EST = {
    2: dict(NOMBRE='rapado', R=32.0, W=[24, 26, 24], D=[2, 4, 2], SK=[0, 0, 0],
            SIDE=[(37, 32), (50, 29), (58, 22), (64, 12), (68, 5), (73, 8), (80, 14), (90, 16), (100, 14),
                  (108, 4), (125, -14), (150, -24), (180, -28)],
            ENV=[(0, 30), (50, 26), (70, 4), (95, 12), (140, -22), (180, -26)],
            EDGE=[(0, 0.012), (90, 0.016), (180, 0.02)], O1=0.035, BULGE=0.0, THICK=0.02, N=96, M=12),
    3: dict(NOMBRE='despeinado', R=28.0, W=[14, 17, 15, 19, 16, 14, 13], D=[16, 11, 19, 13, 17, 10, 14],
            SK=[-0.35, 0.2, -0.15, 0.1, 0.25, -0.1, 0.35],
            SIDE=[(54, 28), (59, 10), (63, 18), (67, 0), (72, 12), (79, 16), (86, 8), (96, 10), (104, 0),
                  (114, -12), (124, -26), (134, -36), (144, -26), (155, -42), (166, -30), (180, -40)],
            ENV=[(0, 14), (54, 12), (68, -4), (95, 6), (140, -30), (180, -36)],
            EDGE=[(0, 0.03), (66, 0.032), (180, 0.045)], O1=0.11, BULGE=0.012,
            TUFTS=[(0, 64, 0.11, 16), (36, 52, 0.10, 15), (-34, 56, 0.11, 15), (72, 54, 0.07, 14),
                   (-74, 56, 0.07, 14), (116, 50, 0.12, 16), (-120, 46, 0.12, 16), (180, 32, 0.11, 17),
                   (150, 70, 0.11, 16), (-148, 66, 0.10, 16), (94, 62, 0.10, 15), (-96, 64, 0.10, 15),
                   (60, 78, 0.09, 14), (-58, 80, 0.09, 14), (150, 12, 0.08, 14), (-152, 16, 0.08, 14)]),
    4: dict(NOMBRE='coleta', R=30.0, W=[100], D=[6], SK=[0.0],
            SIDE=[(50, 30), (56, 22), (61, 12), (66, 2), (71, -4), (76, 2), (82, 11), (90, 15), (104, 12),
                  (120, -6), (150, -26), (180, -30)],
            ENV=[(0, 26), (50, 22), (66, -8), (95, 10), (140, -22), (180, -26)],
            EDGE=[(0, 0.025), (66, 0.035), (180, 0.04)], O1=0.065, BULGE=0.02,
            EXTRA=[('tubo', [(0, 0.25, 0.35), (0, 0.47, 0.40), (0, 0.62, 0.42), (0, 0.80, 0.26), (0, 0.84, -0.02),
                             (0, 0.76, -0.28), (0, 0.64, -0.44)], [0.07, 0.065, 0.10, 0.13, 0.12, 0.08, 0.025])]),
    5: dict(NOMBRE='melena', R=14.0, W=[20, 20, 20, 20, 20], D=[3, 3, 3, 3, 3], SK=[0, 0, 0, 0, 0],
            SIDE=[(50, 14), (54, 4), (58, -20), (62, -42), (68, -50), (90, -52), (130, -55), (180, -60)],
            ENV=[(0, 8), (50, 8), (62, -20), (180, -30)],
            EDGE=[(0, 0.03), (60, 0.05), (180, 0.05)], O1=0.08, BULGE=0.03, E0=-6.0, FLARE=-0.1, N=128, M=22),
    6: dict(NOMBRE='chongo', R=30.0, W=[100], D=[-6], SK=[0.0],
            SIDE=[(50, 30), (56, 24), (62, 14), (67, 6), (72, 4), (78, 10), (86, 15), (95, 17), (110, 10),
                  (130, -8), (160, -26), (180, -30)],
            ENV=[(0, 28), (50, 26), (66, 0), (95, 12), (140, -18), (180, -24)],
            EDGE=[(0, 0.025), (66, 0.035), (180, 0.04)], O1=0.06, BULGE=0.015,
            EXTRA=[('esfera', (180, 70), 0.70, 0.21, (1.0, 0.9, 0.85))]),
    # largo: fleco abierto al centro (D negativo sube la raya), a los lados llega a los hombros (no choca con los
    # brazos) y atras cae hasta media espalda; FLARE lo cierra hacia la espalda. Pocas columnas: es para celular
    7: dict(NOMBRE='largo', R=12.0, W=[100], D=[-14], SK=[0.0],
            SIDE=[(50, 12), (54, 0), (58, -24), (62, -44), (70, -54), (90, -58), (115, -80), (140, -100),
                  (180, -108)],
            ENV=[(0, 8), (50, 8), (62, -20), (180, -30)],
            EDGE=[(0, 0.03), (60, 0.05), (180, 0.05)], O1=0.08, BULGE=0.03, E0=-6.0, FLARE=-0.2, N=104, M=24),
}
PRM = globals().get('PRM', {})
for n in EST:
    e = dict(BASE); e.update(EST[n]); e.update(PRM.get(n, {})); EST[n] = e
SOLO = PRM.get('SOLO', sorted(EST)); X0, DX = PRM.get('X0', 4.6), PRM.get('DX', 2.2)

head = bpy.data.objects['Frente_Cabeza']; hm = head.data
P = [v.co.copy() for v in hm.vertices]
C = Vector([(min(p[i] for p in P) + max(p[i] for p in P)) / 2 for i in range(3)])
from mathutils.bvhtree import BVHTree
bvh = BVHTree.FromPolygons(P, [p.vertices[:] for p in hm.polygons])
RCAB = (max(p.z for p in P) - min(p.z for p in P)) / 2

def spline(keys, a):
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
            return ((2*t**3 - 3*t**2 + 1)*e0 + (t**3 - 2*t**2 + t)*h*tan(i) + (-2*t**3 + 3*t**2)*e1
                    + (t**3 - t**2)*h*tan(i + 1))

def dirv(phi, e):
    f, el = math.radians(phi), math.radians(e)
    return Vector((math.sin(f) * math.cos(el), -math.cos(f) * math.cos(el), math.sin(el)))

def casco(p, bm):
    W, D, R = p['W'], p['D'], p['R']; half = sum(W) / 2
    B = [-half]
    for w in W: B.append(B[-1] + w)
    TIPS = [(B[i] + B[i + 1]) / 2 + p['SK'][i] * W[i] for i in range(len(W))]
    TU = [(dirv(a, b), h, w) for a, b, h, w in p['TUFTS']]
    def H(phi):
        if abs(phi) < half:
            for i in range(len(W)):
                if B[i] <= phi <= B[i + 1]:
                    t = TIPS[i]
                    u = (phi - B[i]) / (t - B[i]) if phi < t else (B[i + 1] - phi) / (B[i + 1] - t)
                    return R - D[i] * u
        return spline(p['SIDE'], abs(phi))
    def off(e, phi):
        a = abs(phi); es = spline(p['ENV'], a)
        s = max(0.0, min(1.0, (e - es) / (90 - es)))
        sa = math.sin(math.radians(a))
        o = spline(p['EDGE'], a) + p['O1'] * s ** p['OP'] + p['BULGE'] * sa * sa * math.exp(-((e - p['BE']) / 30.0) ** 2)
        v = dirv(phi, e)
        for c, h, w in TU:
            d = math.degrees(v.angle(c))
            if d < w: o += h * (1 - d / w) ** 2
        return o
    def surf(phi, e):
        E0 = p['E0']
        if E0 is not None and e < E0:      # cortina: cae vertical desde E0, se abre un poco (FLARE)
            q = surf(phi, E0); k = (E0 - e) / 90
            d = Vector((q.x - C.x, q.y - C.y, 0)) * (1 + p['FLARE'] * k)
            return Vector((C.x + d.x, C.y + d.y, q.z - RCAB * math.radians(E0 - e)))
        v = dirv(phi, e); hit = bvh.ray_cast(C + v * 3.0, -v)
        r = (hit[0] - C).length if hit[0] else 0.5
        return C + v * (r + off(e, phi))
    N, M = p['N'], p['M']
    phis = set(round(-180 + 360 * i / N, 4) for i in range(N))
    for x in B + TIPS: phis.add(round(x, 4))
    phis = sorted(x for x in phis if -180 <= x < 180)
    top = bm.verts.new(surf(0, 90)); cols = []
    for phi in phis:
        h = H(phi); cols.append([bm.verts.new(surf(phi, 90 + (h - 90) * j / M)) for j in range(1, M + 1)])
    n = len(cols)
    for i in range(n):
        a, b = cols[i], cols[(i + 1) % n]
        bm.faces.new((top, b[0], a[0]))
        for j in range(M - 1): bm.faces.new((a[j], b[j], b[j + 1], a[j + 1]))

def catmull(pts, k=4):
    out = []
    for i in range(len(pts) - 1):
        p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, len(pts) - 1)]
        for s in range(k):
            t = s / k
            out.append(0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                              + (3 * p1 - p0 - 3 * p2 + p3) * t ** 3))
    return out + [pts[-1]]

def tubo(bm, ctrl, radios, seg=12):
    pts = catmull([C + Vector(c) for c in ctrl]); rr = catmull([Vector((r, 0, 0)) for r in radios])
    rings = []
    for i, c in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        u = t.cross(Vector((1, 0, 0))).normalized(); w = t.cross(u)
        rings.append([bm.verts.new(c + (u * math.cos(2 * math.pi * k / seg) + w * math.sin(2 * math.pi * k / seg)) * rr[i].x)
                      for k in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for k in range(seg): bm.faces.new((a[k], a[(k + 1) % seg], b[(k + 1) % seg], b[k]))
    c0 = bm.verts.new(pts[0]); c1 = bm.verts.new(pts[-1] + (pts[-1] - pts[-2]).normalized() * rr[-1].x)
    for k in range(seg):
        bm.faces.new((c0, rings[0][(k + 1) % seg], rings[0][k])); bm.faces.new((c1, rings[-1][k], rings[-1][(k + 1) % seg]))

def esfera(bm, d, dist, r, esc):
    m = Matrix.Translation(C + dirv(*d) * dist) @ Matrix.Diagonal((*esc, 1.0))
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r, matrix=m)

def a_malla(bm, nombre, recalc=True):
    if recalc: bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.get(nombre) or bpy.data.meshes.new(nombre)
    bm.to_mesh(me); bm.free()
    for q in me.polygons: q.use_smooth = True
    if not me.materials: me.materials.append(bpy.data.materials['chibi_pelo'])
    return me

def objeto(nombre, me, padre, col):
    o = bpy.data.objects.get(nombre)
    if not o: o = bpy.data.objects.new(nombre, me); col.objects.link(o)
    o.data = me; o.parent = padre; o.matrix_parent_inverse.identity(); o.matrix_basis.identity()
    return o

col = bpy.data.collections.get('Peinados')
if not col: col = bpy.data.collections.new('Peinados'); bpy.context.scene.collection.children.link(col)
fuente = bpy.data.objects['Frente']
for n in SOLO:
    p = EST[n]
    bm = bmesh.new(); casco(p, bm)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.faces.ensure_lookup_table(); f0 = bm.faces[len(bm.faces) // 3]
    if f0.normal.dot(f0.calc_center_median() - C) < 0: bmesh.ops.reverse_faces(bm, faces=bm.faces)
    me = a_malla(bm, 'pelo_%d' % n, False)
    bm = bmesh.new()
    for ex in p['EXTRA']:
        if ex[0] == 'tubo': tubo(bm, ex[1], ex[2])
        elif ex[0] == 'esfera': esfera(bm, *ex[1:])
    mx = a_malla(bm, 'pelo_%d_extra' % n) if p['EXTRA'] else None
    # figura de muestra: copia ligada de Frente sin su pelo
    E = bpy.data.objects.get('Peinado_%d' % n)
    if not E: E = bpy.data.objects.new('Peinado_%d' % n, None); col.objects.link(E)
    E.location = (X0 + DX * (n - 2), 0, 0)
    for o in fuente.children:
        suf = o.name.split('_', 1)[1]
        if suf == 'Pelo': continue
        nm = 'Peinado_%d_%s' % (n, suf)
        if not bpy.data.objects.get(nm):
            c = o.copy(); c.name = nm; col.objects.link(c)
            c.parent = E; c.matrix_parent_inverse = o.matrix_parent_inverse.copy()
    o = objeto('Peinado_%d_Pelo' % n, me, E, col)
    for m in list(o.modifiers): o.modifiers.remove(m)
    so = o.modifiers.new('Grosor', 'SOLIDIFY'); so.thickness = p['THICK']; so.offset = -1; so.use_even_offset = True
    ss = o.modifiers.new('Suave', 'SUBSURF'); ss.levels = 1; ss.render_levels = 2
    ox = bpy.data.objects.get('Peinado_%d_Extra' % n)
    if mx:
        ox = objeto('Peinado_%d_Extra' % n, mx, E, col)
        if not ox.modifiers: s2 = ox.modifiers.new('Suave', 'SUBSURF'); s2.levels = 1; s2.render_levels = 2
    elif ox: bpy.data.objects.remove(ox, do_unlink=True)
    print('peinado', n, p['NOMBRE'], len(me.polygons), 'caras casco', len(mx.polygons) if mx else 0, 'extra')
print('pelos ok')
