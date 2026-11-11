# Cara del chibi en geometria (no textura): ojos solidos, cejas, boca y nariz 3D chica.
# Se ve en modo Solido, no se pixela de cerca y se puede animar (parpadeo, cejas).
# Hay 3 opciones de cejas, boca y nariz (CEJAS/BOCAS/NARICES, opcion n = indice n-1). La 1 va en las
# figuras de K['COPIAS'] (mallas cara_cejas, cara_boca, cara_nariz); las figuras de muestra Cara_1..3
# (coleccion "Caras", copias ligadas de Frente) llevan la opcion n (mallas cara_*_n). rig.py las toma
# como piezas Cejas_n, Boca_n, Nariz_n.
# Uso en Blender: exec(open(r'C:/Users/aris1/code/Continental/blender/cara.py').read(), {'PRM': {...}})
import bpy, bmesh, math
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

K = dict(
    OJO=(0.165, 2.065, 0.041, 0.057),             # x, z, radio x, radio z
    # ceja: interior, control, exterior, grosor/2 interior, grosor/2 exterior
    CEJAS=[((0.07, 2.19), (0.16, 2.212), (0.25, 2.215), 0.019, 0.015),       # 1 recta
           ((0.075, 2.185), (0.155, 2.238), (0.25, 2.203), 0.016, 0.011),    # 2 arqueada
           ((0.068, 2.188), (0.16, 2.203), (0.252, 2.204), 0.029, 0.022)],   # 3 gruesa
    # boca: ('linea', extremo, control, extremo, grosor/2, grosor/2)
    #       ('abierta', (x, z) centro, radio x, alto arriba, alto abajo, cuanto suben las comisuras)
    BOCAS=[('linea', (-0.07, 1.875), (0.0, 1.873), (0.07, 1.875), 0.008, 0.008),      # 1 neutra
           ('linea', (-0.078, 1.893), (0.0, 1.853), (0.078, 1.893), 0.0095, 0.0095),  # 2 sonrisa
           ('abierta', (0.0, 1.878), 0.058, 0.005, 0.045, 0.012)],                      # 3 abierta
    # nariz: z, radio x, y, z, cuanto se hunde, ensanche abajo x, angosta arriba x, igual en y, giro (grados)
    NARICES=[(1.975, 0.042, 0.045, 0.055, 0.012, 0.25, 0.3, 0.35, 0.2, -8),       # 1 boton
             (1.972, 0.056, 0.06, 0.054, 0.018, 0.08, 0.08, 0.1, 0.1, 0),          # 2 redonda
             (1.98, 0.031, 0.031, 0.036, 0.008, 0.3, 0.3, 0.4, 0.25, -16)],        # 3 pequena
    COPIAS=['Frente', 'Perfil', 'Pose'],
    MUESTRA_X=-7.5, MUESTRA_DX=1.45)             # x de la figura Cara_n = MUESTRA_X + MUESTRA_DX*(n-1)
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

def disco(bm, punto, off, rings=4, seg=28):
    # punto(f, a) -> (x, z) del contorno a la fraccion f (0 = centro) y angulo a
    c = bm.verts.new(proj(*punto(0, 0), off)); prev = None
    for k in range(1, rings + 1):
        ring = [bm.verts.new(proj(*punto(k / rings, 2 * math.pi * i / seg), off)) for i in range(seg)]
        for i in range(seg):
            j = (i + 1) % seg
            bm.faces.new((c, ring[i], ring[j]) if prev is None else (prev[i], ring[i], ring[j], prev[j]))
        prev = ring

def elipse(bm, cx, cz, rx, rz, off):
    disco(bm, lambda f, a: (cx + rx * f * math.cos(a), cz + rz * f * math.sin(a)), off)

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

def cejas(nombre, c):
    a, m, b, h0, h1 = c
    def hacer(bm):
        for s in (-1, 1): banda(bm, (s * a[0], a[1]), (s * m[0], m[1]), (s * b[0], b[1]), h0, h1, 0.004)
    return malla(nombre, hacer, bpy.data.materials['chibi_pelo'])

def boca(nombre, b):
    if b[0] == 'linea': hacer = lambda bm: banda(bm, *b[1:], 0.003)
    else:   # boca abierta: D acostada, arriba casi recta, abajo redonda; comisuras hacia arriba
        (cx, cz), rx, alto, bajo, sube = b[1:]
        def punto(f, a):
            u = f * math.cos(a); s = math.sin(a)
            return cx + rx * u, cz + f * s * (alto if s > 0 else bajo) + sube * u * u
        hacer = lambda bm: disco(bm, punto, 0.003, rings=5, seg=32)
    return malla(nombre, hacer, mat('chibi_boca', (0.13, 0.045, 0.04)))

def nariz(nombre, n):
    # gota redondeada (mas llena abajo segun los ensanches), hundida en la cara para que no flote
    nz, rx, ry, rz, hund, ax, bx, ay, by, giro = n
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=1.0)
    for v in bm.verts:
        z = v.co.z
        wx = 1 + ax * max(0, -z) - bx * max(0, z); wy = 1 + ay * max(0, -z) - by * max(0, z)
        v.co = Vector((v.co.x * rx * wx, v.co.y * ry * wy, z * rz))
    bmesh.ops.rotate(bm, verts=bm.verts, matrix=Matrix.Rotation(math.radians(giro), 3, 'X'))
    bmesh.ops.translate(bm, verts=bm.verts, vec=proj(0, nz, 0) + Vector((0, hund, 0)))
    me = bpy.data.meshes.get(nombre) or bpy.data.meshes.new(nombre)
    bm.to_mesh(me); bm.free()
    for q in me.polygons: q.use_smooth = True
    me.materials.clear(); me.materials.append(bpy.data.materials['chibi_piel'])
    return me

ox, oz, rx, rz = K['OJO']
ojos = malla('cara_ojos', lambda bm: [elipse(bm, s * ox, oz, rx, rz, 0.004) for s in (-1, 1)],
             mat('chibi_ojo', (0.012, 0.010, 0.010)))
OPC = {}      # n -> {'Cejas': malla, 'Boca': malla, 'Nariz': malla}
for n in range(1, len(K['CEJAS']) + 1):
    sf = '' if n == 1 else '_%d' % n
    OPC[n] = {'Cejas': cejas('cara_cejas' + sf, K['CEJAS'][n - 1]), 'Boca': boca('cara_boca' + sf, K['BOCAS'][n - 1]),
              'Nariz': nariz('cara_nariz' + sf, K['NARICES'][n - 1])}

def suave(o):
    if 'Suave' not in o.modifiers:
        m = o.modifiers.new('Suave', 'SUBSURF'); m.levels = 1; m.render_levels = 2

for nm in K['COPIAS']:
    grupo = bpy.data.objects[nm]; cab = bpy.data.objects[nm + '_Cabeza']
    if cab.data.materials and cab.data.materials[0].name == 'chibi_cara':
        bpy.data.materials['chibi_cara'].use_fake_user = True   # la textura vieja queda guardada
        cab.data.materials[0] = bpy.data.materials['chibi_piel']
    for suf, me in [('Ojos', ojos)] + list(OPC[1].items()):
        o = bpy.data.objects.get(nm + '_' + suf)
        if not o:
            o = bpy.data.objects.new(nm + '_' + suf, me)
            for col in cab.users_collection: col.objects.link(o)
        o.data = me; o.parent = grupo; o.matrix_parent_inverse = cab.matrix_parent_inverse.copy()
        o.matrix_basis = cab.matrix_basis.copy()
        if suf == 'Nariz': suave(o)

# figuras de muestra Cara_n: copia ligada de Frente con la opcion n de cejas, boca y nariz
col = bpy.data.collections.get('Caras')
if not col: col = bpy.data.collections.new('Caras'); bpy.context.scene.collection.children.link(col)
fuente = bpy.data.objects[K['COPIAS'][0]]
for n, piezas in OPC.items():
    E = bpy.data.objects.get('Cara_%d' % n)
    if not E: E = bpy.data.objects.new('Cara_%d' % n, None); col.objects.link(E)
    E.location = (K['MUESTRA_X'] + K['MUESTRA_DX'] * (n - 1), 0, 0)
    for o in fuente.children:
        suf = o.name.split('_', 1)[1]; c = bpy.data.objects.get('Cara_%d_%s' % (n, suf))
        if not c:
            c = o.copy(); c.name = 'Cara_%d_%s' % (n, suf); col.objects.link(c)
            c.parent = E; c.matrix_parent_inverse = o.matrix_parent_inverse.copy()
        if suf in piezas: c.data = piezas[suf]
    print('cara', n, {k: len(m.polygons) for k, m in piezas.items()}, 'caras')
print('cara ok')
