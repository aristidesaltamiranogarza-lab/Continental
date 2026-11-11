# Cara del chibi en geometria (no textura): ojos solidos, cejas, boca de linea y nariz 3D chica.
# Se ve en modo Solido, no se pixela de cerca y se puede animar (parpadeo, cejas).
# Uso en Blender: exec(open(r'C:/Users/aris1/code/Continental/blender/cara.py').read(), {'PRM': {...}})
import bpy, bmesh, math
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

K = dict(
    OJO=(0.165, 2.065, 0.041, 0.057),             # x, z, radio x, radio z
    CEJA=((0.07, 2.19), (0.16, 2.212), (0.25, 2.215), 0.019, 0.015),  # interior, control, exterior, grosor/2
    BOCA=((-0.07, 1.875), (0.0, 1.873), (0.07, 1.875), 0.008, 0.008),
    NARIZ=(1.975, 0.042, 0.045, 0.055, 0.012),   # z, radio x, y, z, cuanto se hunde
    COPIAS=['Frente', 'Perfil', 'Pose'])
K.update(globals().get('PRM', {}))

head = bpy.data.objects[K['COPIAS'][0] + '_Cabeza']; hm = head.data
bvh = BVHTree.FromPolygons([v.co.copy() for v in hm.vertices], [p.vertices[:] for p in hm.polygons])

def proj(x, z, off):
    hit = bvh.ray_cast(Vector((x, -3.0, z)), Vector((0, 1, 0)))
    return hit[0] + hit[1] * off

def mat(nombre, col, rough=0.9):
    m = bpy.data.materials.get(nombre) or bpy.data.materials.new(nombre)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough
    for k in ('Specular IOR Level', 'Specular'):
        if k in b.inputs: b.inputs[k].default_value = 0.1
    m.diffuse_color = (*col, 1)
    return m

def elipse(bm, cx, cz, rx, rz, off, rings=4, seg=28):
    c = bm.verts.new(proj(cx, cz, off)); prev = None
    for k in range(1, rings + 1):
        f = k / rings
        ring = [bm.verts.new(proj(cx + rx * f * math.cos(2 * math.pi * i / seg),
                                  cz + rz * f * math.sin(2 * math.pi * i / seg), off)) for i in range(seg)]
        for i in range(seg):
            j = (i + 1) % seg
            bm.faces.new((c, ring[i], ring[j]) if prev is None else (prev[i], ring[i], ring[j], prev[j]))
        prev = ring

def banda(bm, p0, p1, p2, hw0, hw1, off, n=24):
    p0, p1, p2 = Vector(p0), Vector(p1), Vector(p2)
    pt = lambda s: (1 - s) ** 2 * p0 + 2 * (1 - s) * s * p1 + s * s * p2
    L = sum((pt((i + 1) / 64) - pt(i / 64)).length for i in range(64))
    cols = []
    for i in range(n + 1):
        s = (1 - math.cos(math.pi * i / n)) / 2
        t = (pt(min(s + 1e-3, 1)) - pt(max(s - 1e-3, 0))).normalized(); nn = Vector((-t.y, t.x))
        hw = hw0 + (hw1 - hw0) * s; d = min(s, 1 - s) * L
        hw *= math.sqrt(max(0.0, 1 - (1 - min(d / hw, 1)) ** 2))
        c = pt(s)
        cols.append([bm.verts.new(proj(*(c + nn * hw * w), off)) for w in (-1, 0, 1)])
    for i in range(n):
        a, b = cols[i], cols[i + 1]
        for j in range(2): bm.faces.new((a[j], b[j], b[j + 1], a[j + 1]))

def malla(nombre, construir, material):
    bm = bmesh.new(); construir(bm)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    for f in bm.faces:
        if f.normal.y > 0: f.normal_flip()
    me = bpy.data.meshes.get(nombre) or bpy.data.meshes.new(nombre)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    me.materials.clear(); me.materials.append(material)
    return me

ox, oz, rx, rz = K['OJO']
ojos = malla('cara_ojos', lambda bm: [elipse(bm, s * ox, oz, rx, rz, 0.004) for s in (-1, 1)],
             mat('chibi_ojo', (0.012, 0.010, 0.010)))
def cejas(bm):
    a, c, b, h0, h1 = K['CEJA']
    for s in (-1, 1):
        banda(bm, (s * a[0], a[1]), (s * c[0], c[1]), (s * b[0], b[1]), h0, h1, 0.004)
cej = malla('cara_cejas', cejas, bpy.data.materials['chibi_pelo'])
bo = K['BOCA']
boca = malla('cara_boca', lambda bm: banda(bm, *bo, 0.003), mat('chibi_boca', (0.13, 0.045, 0.04)))

# nariz: gota redondeada, mas llena abajo, hundida en la cara para que no flote
nz, nrx, nry, nrz, hund = K['NARIZ']
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=1.0)
for v in bm.verts:
    z = v.co.z
    wx = 1 + 0.25 * max(0, -z) - 0.3 * max(0, z); wy = 1 + 0.35 * max(0, -z) - 0.2 * max(0, z)
    v.co = Vector((v.co.x * nrx * wx, v.co.y * nry * wy, z * nrz))
p = proj(0, nz, 0) + Vector((0, hund, 0))
bmesh.ops.rotate(bm, verts=bm.verts, matrix=Matrix.Rotation(math.radians(-8), 3, 'X'))
bmesh.ops.translate(bm, verts=bm.verts, vec=p)
nar = bpy.data.meshes.get('cara_nariz') or bpy.data.meshes.new('cara_nariz')
bm.to_mesh(nar); bm.free()
for q in nar.polygons: q.use_smooth = True
nar.materials.clear(); nar.materials.append(bpy.data.materials['chibi_piel'])

for nm in K['COPIAS']:
    grupo = bpy.data.objects[nm]; cab = bpy.data.objects[nm + '_Cabeza']
    if cab.data.materials and cab.data.materials[0].name == 'chibi_cara':
        bpy.data.materials['chibi_cara'].use_fake_user = True   # la textura vieja queda guardada
        cab.data.materials[0] = bpy.data.materials['chibi_piel']
    for suf, me in (('Ojos', ojos), ('Cejas', cej), ('Boca', boca), ('Nariz', nar)):
        o = bpy.data.objects.get(nm + '_' + suf)
        if not o:
            o = bpy.data.objects.new(nm + '_' + suf, me)
            for col in cab.users_collection: col.objects.link(o)
        o.data = me; o.parent = grupo; o.matrix_parent_inverse = cab.matrix_parent_inverse.copy()
        o.matrix_basis = cab.matrix_basis.copy()
        if suf == 'Nariz' and 'Suave' not in o.modifiers:
            m = o.modifiers.new('Suave', 'SUBSURF'); m.levels = 1; m.render_levels = 2
print('cara ok')
