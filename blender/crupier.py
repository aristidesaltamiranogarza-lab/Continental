# Atuendo de crupier (R8): pieza Arriba_4 / Arriba_4_M del personaje = camisa blanca (blusa de ropa.py metida en el
# pantalon, cuello y botones), chaleco vino (cortado de la camisa con planos: escote en V, sisas, puntas abajo),
# botones dorados del chaleco y mono negro. Abajo va el pantalon 1 (en el juego, negro) y las mangas largas Mangas_1.
# Se arma sobre blender/chibi_prueba.glb (lo que exporta rig.py: mismas piezas, huesos y pesos), sin la escena Chibi.
# Los pesos se copian de la camisa (Data Transfer), asi el chaleco y el mono siguen al cuerpo en todas las poses.
# Uso: blender -b --factory-startup --python blender/crupier.py -- vista|exportar
#   vista    -> blender/crupier_vista.png (frente, 3/4, espalda, H y M)
#   exportar -> blender/crupier_piezas.glb (solo las piezas nuevas con la armadura); despues
#               node blender/crupier_juntar.js (las mete en chibi_prueba.glb y comprime a modelos/personaje/chibi.glb)
import bpy, bmesh, math, sys, os
from mathutils import Vector as V, Matrix
from mathutils.bvhtree import BVHTree

DIR = os.path.dirname(os.path.abspath(__file__))
K = dict(
    GLB=os.path.join(DIR, 'chibi_prueba.glb'),
    OUT=os.path.join(DIR, 'crupier_piezas.glb'),
    PNG=os.path.join(DIR, 'crupier_vista.png'),
    METIDA=0.96,            # la camisa se corta aqui (el chaleco tapa el corte)
    AJUSTA=(1.13, 1.02),    # entre estas z la camisa se va pegando al pantalon (metida)
    # chaleco: z del dobladillo a los lados, cuanto bajan las puntas del frente, z donde cierra la V,
    # medio ancho de la V arriba, separacion del cuerpo y grosor
    HEM=0.975, PUNTA=0.07, V_Z=1.2, V_ANCHO=0.105, SEPARA=0.011, GROSOR=0.007,
    # sisa: el plano corta |x| desde X0 arriba (z Z1) hasta X1 abajo (z Z0)
    SISA=(0.145, 1.62, 0.205, 1.25),
    ESPALDA_Z=1.56, TOPE=1.6,         # hasta donde sube el chaleco atras (abajo del cuello de la camisa)
    BOTONES=(1.15, 1.03, 3, 0.0125),   # z arriba, z abajo, cuantos, radio
    MONO=dict(z=1.585, ala=(0.06, 0.024, 0.036), nudo=(0.018, 0.015, 0.022), abre=0.012),
    COL=dict(av_arriba=(0.96, 0.95, 0.93), av_abajo=(0.07, 0.07, 0.075), av_chaleco=(0.24, 0.035, 0.065),
             av_mono=(0.03, 0.03, 0.035), av_dorado=(0.78, 0.6, 0.28), av_boton=(0.9, 0.9, 0.88)),
)
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['vista']


def material(nombre):
    m = bpy.data.materials.get(nombre) or bpy.data.materials.new(nombre)
    m.use_nodes = True
    c = K['COL'].get(nombre)
    if c:
        b = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if b:
            b.inputs['Base Color'].default_value = (*c, 1)
            b.inputs['Roughness'].default_value = 0.35 if nombre == 'av_dorado' else 0.75
            if nombre == 'av_dorado': b.inputs['Metallic'].default_value = 0.6
        m.diffuse_color = (*c, 1)
    return m


def limpia():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=K['GLB'])


def copia(o, nombre):
    n = o.copy(); n.data = o.data.copy(); n.name = nombre; n.data.name = 'Rig_' + nombre
    bpy.context.scene.collection.objects.link(n)
    if n.data.has_custom_normals:   # las normales del glTF ya no sirven al mover vertices
        with bpy.context.temp_override(object=n, active_object=n):
            bpy.ops.mesh.customdata_custom_splitnormals_clear()
    return n


def corta(bm, co, no):
    """Corta con el plano (co, no) y borra lo que queda del lado +no."""
    geo = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geo, plane_co=co, plane_no=no, clear_outer=True, dist=1e-5)


def solo_material(bm, idx):
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index != idx], context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')


def bvh(o):
    bm = bmesh.new(); bm.from_mesh(o.data); t = BVHTree.FromBMesh(bm); bm.free(); return t


def camisa(src, nombre, pant):
    """Blusa (cuello camisero y botones) metida en el pantalon: abajo de AJUSTA se va pegando al pantalon."""
    o = copia(src, nombre)
    bv = bvh(pant); z1, z0 = K['AJUSTA']
    for v in o.data.vertices:
        if v.co.z >= z1: continue
        p, n, i, d = bv.find_nearest(V((v.co.x, v.co.y, min(v.co.z, 1.02))))
        if p is None: continue
        q = V((p.x, p.y, v.co.z)) + V((n.x, n.y, 0)).normalized() * 0.006
        w = min(1.0, (z1 - v.co.z) / (z1 - z0)); w = w * w * (3 - 2 * w)
        v.co = v.co.lerp(q, w)
    bm = bmesh.new(); bm.from_mesh(o.data)
    corta(bm, (0, 0, K['METIDA']), (0, 0, -1))
    bm.to_mesh(o.data); bm.free()
    return o


def chaleco(cam, nombre):
    """Chaleco: la camisa (sin botones ni cuello) cortada con planos (V, sisas, dobladillo); queda por fuera."""
    o = copia(cam, nombre)
    me = o.data
    ia = next(i for i, m in enumerate(me.materials) if m.name.startswith('av_arriba'))
    bm = bmesh.new(); bm.from_mesh(me)
    solo_material(bm, ia)
    corta(bm, (0, 0, K['HEM']), (0, 0, -1))
    corta(bm, (0, 0, K['TOPE']), (0, 0, 1))   # sin aletas sobre el hombro
    x0, z1, x1, z0 = K['SISA']
    for s in (1, -1):   # sisas: planos verticales inclinados, borran lo de afuera
        d = V((s * (x1 - x0), 0, z0 - z1)).normalized()
        n = V((-d.z, 0, d.x))
        if n.x * s < 0: n = -n
        corta(bm, (s * x0, 0, z1), n)
    # escote en V: primero se cortan las aristas con los dos planos (sin borrar) y luego se quitan las caras de adentro
    vz, va, zt = K['V_Z'], K['V_ANCHO'], 1.66
    for s in (1, -1):
        d = V((s * va, 0, zt - vz)).normalized(); n = V((d.z, 0, -d.x))
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, vz), plane_no=n, dist=1e-5)
    def en_v(c): return c.y < -0.02 and c.z > vz and abs(c.x) < va * (c.z - vz) / (zt - vz)
    mata = [f for f in bm.faces if en_v(f.calc_center_median())]
    # espalda hasta ESPALDA_Z; sobre los hombros, el cuello de la camisa queda libre
    mata += [f for f in bm.faces if f.calc_center_median().y > -0.02 and f.calc_center_median().z > K['ESPALDA_Z']
             and abs(f.calc_center_median().x) < va + 0.02]
    bmesh.ops.delete(bm, geom=list(set(mata)), context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bm.to_mesh(me); bm.free()
    me.materials.clear(); me.materials.append(material('av_chaleco'))
    return o


def puntas(o, pant):
    """Dobladillo: el borde de abajo se extruye hacia abajo; al frente baja en dos puntas (una a cada lado del
    centro, con muesca en medio) y por fuera del pantalon."""
    me = o.data; H, P = K['HEM'], K['PUNTA']
    bv = bvh(pant)
    bm = bmesh.new(); bm.from_mesh(me)
    ed = [e for e in bm.edges if e.is_boundary and all(v.co.z < H + 0.005 for v in e.verts)]
    r = bmesh.ops.extrude_edge_only(bm, edges=ed)
    for v in [g for g in r['geom'] if isinstance(g, bmesh.types.BMVert)]:
        fr = min(1.0, max(0.0, -v.co.y - 0.02) / 0.1) ** 1.2          # 0 atras y a los lados, 1 al frente
        ax = abs(v.co.x)
        perfil = 0.5 + 0.5 * ax / 0.03 if ax < 0.03 else max(0.0, 1 - (ax - 0.03) / 0.17) ** 1.3
        v.co.z -= 0.018 + P * fr * perfil
        p, n, i, d = bv.find_nearest(v.co)
        if p is not None:
            m = V((n.x, n.y, 0)).normalized()
            ext = (v.co - p).dot(m)
            if ext < K['SEPARA'] + 0.004: v.co += m * (K['SEPARA'] + 0.004 - ext)
    bm.to_mesh(me); bm.free()


def pega(o, ref, separa, suaviza=4):
    """Pone cada vertice a 'separa' de la superficie de ref (por fuera), siguiendo su normal; despues lo alisa
    (sin mover la orilla) y vuelve a empujar hacia afuera lo que quedo adentro."""
    bv = bvh(ref)
    for v in o.data.vertices:
        p, n, i, d = bv.find_nearest(v.co)
        if p is not None: v.co = p + n.normalized() * separa
    bm = bmesh.new(); bm.from_mesh(o.data)
    dentro = [v for v in bm.verts if not v.is_boundary]
    for _ in range(suaviza):
        bmesh.ops.smooth_vert(bm, verts=dentro, factor=0.6, use_axis_x=True, use_axis_y=True, use_axis_z=True)
        for v in dentro:
            p, n, i, d = bv.find_nearest(v.co)
            if p is None: continue
            ext = (v.co - p).dot(n.normalized())
            if ext < separa: v.co += n.normalized() * (separa - ext)
    bm.to_mesh(o.data); bm.free()


def grosor(o, g):
    m = o.modifiers.new('grosor', 'SOLIDIFY'); m.thickness = g; m.offset = 1; m.use_rim = True
    m.use_even_offset = True
    for mm in list(o.modifiers):
        if mm.type == 'ARMATURE': o.modifiers.remove(mm)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=m.name)


def pesos(o, src):
    """Copia los pesos de src (vertex groups) por el poligono mas cercano."""
    for g in list(o.vertex_groups): o.vertex_groups.remove(g)
    for g in src.vertex_groups: o.vertex_groups.new(name=g.name)
    m = o.modifiers.new('pesos', 'DATA_TRANSFER'); m.object = src
    m.use_vert_data = True; m.data_types_verts = {'VGROUP_WEIGHTS'}; m.vert_mapping = 'POLYINTERP_NEAREST'
    m.layers_vgroup_select_src = 'ALL'; m.layers_vgroup_select_dst = 'NAME'
    bpy.context.view_layer.objects.active = o
    # el armature tiene que ir despues
    while o.modifiers[0].name != 'pesos': bpy.ops.object.modifier_move_up(modifier='pesos')
    bpy.ops.object.modifier_apply(modifier='pesos')


def esfera(bm, c, r, seg=12, anillos=8):
    g = bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=anillos, radius=1)
    vs = g['verts']
    for v in vs: v.co = V((v.co.x * r[0], v.co.y * r[1], v.co.z * r[2])) + V(c)
    return vs


def superficie(o, x, z, desde=-1.0):
    """Punto de la superficie de o al frente (rayo de -y hacia +y)."""
    bm = bmesh.new(); bm.from_mesh(o.data); bv = BVHTree.FromBMesh(bm); bm.free()
    p, n, i, d = bv.ray_cast(V((x, desde, z)), V((0, 1, 0)))
    return p, n


def botones(o, ch):
    """Botones dorados del chaleco: sobre la abertura del frente, abajo de la V."""
    za, zb, n, r = K['BOTONES']
    bm = bmesh.new()
    for k in range(n):
        z = za + (zb - za) * k / max(1, n - 1)
        p, nn = superficie(ch, 0.0, z)
        if p is None: continue
        vs = esfera(bm, p + V((0, -r * 0.35, 0)), (r, r * 0.45, r), 10, 6)
    me = o.data; bm.to_mesh(me); bm.free()
    me.materials.append(material('av_dorado'))


def mono(o, cam):
    """Mono negro al frente del cuello de la camisa: dos alas que se angostan hacia el nudo y el nudo."""
    M = K['MONO']; z = M['z']
    p, n = superficie(cam, 0.0, z)
    if p is None: p = V((0, -0.14, z))
    c = p + V((0, -M['abre'] - M['ala'][1] * 0.6, 0))
    bm = bmesh.new()
    ax, ay, az = M['ala']
    for s in (1, -1):
        vs = esfera(bm, (0, 0, 0), (ax, ay, az), 14, 10)
        for v in vs:
            # mitad hacia el nudo se angosta (moño), la punta exterior abre un poco en V
            t = (v.co.x / ax + 1) / 2          # 0 lado interior .. 1 exterior (antes de reflejar)
            k = 0.32 + 0.68 * (t ** 0.8)
            v.co.z *= k; v.co.y *= 0.55 + 0.45 * k
            v.co.x = v.co.x + ax * 0.92
            # muesca en la punta exterior (ligera V hacia adentro)
            if t > 0.85: v.co.x -= (t - 0.85) * 0.12 * (1 - abs(v.co.z) / (az * k + 1e-6))
            v.co.x *= s
            v.co += c
            v.co.z += 0.004 * (1 if s > 0 else 1) * (v.co.x * s / (2 * ax))
    esfera(bm, c + V((0, -0.004, 0)), M['nudo'], 12, 8)
    # mas cerca del cuello: las alas se curvan siguiendo la camisa
    for v in bm.verts:
        v.co.y += 0.25 * (v.co.x ** 2) / 0.05
    me = bpy.data.meshes.new('Rig_mono'); bm.to_mesh(me); bm.free()
    me.materials.append(material('av_mono'))
    for pol in me.polygons: pol.use_smooth = True
    m = bpy.data.objects.new('mono', me); bpy.context.scene.collection.objects.link(m)
    return m


def junta(dst, otros):
    for x in bpy.context.view_layer.objects: x.select_set(False)
    for x in otros + [dst]: x.select_set(True)
    bpy.context.view_layer.objects.active = dst
    bpy.ops.object.join()
    return dst


def arma(sufijo):
    src = bpy.data.objects['Arriba_3' + sufijo]; pant = bpy.data.objects['Abajo_1' + sufijo]
    nombre = 'Arriba_4' + sufijo
    cam = camisa(src, nombre, pant)
    ch = chaleco(cam, 'chaleco' + sufijo)
    pega(ch, cam, K['SEPARA'])
    puntas(ch, pant)
    for p in ch.data.polygons: p.use_smooth = True
    grosor(ch, K['GROSOR'])
    bt = bpy.data.objects.new('botones' + sufijo, bpy.data.meshes.new('Rig_bt' + sufijo))
    bpy.context.scene.collection.objects.link(bt)
    botones(bt, ch)
    for p in bt.data.polygons: p.use_smooth = True
    mn = mono(None, cam); mn.name = 'mono' + sufijo
    for x in (ch, bt, mn):
        x.parent = cam.parent; x.matrix_parent_inverse = cam.matrix_parent_inverse.copy()
        a = x.modifiers.new('Armature', 'ARMATURE'); a.object = bpy.data.objects['Rig']
    for x in (ch, bt, mn): pesos(x, cam)
    junta(cam, [ch, bt, mn])   # la camisa sigue en av_arriba (el juego le pone el color)
    return cam


def colores():
    for m in bpy.data.materials:
        nm = m.name.split('.')[0]
        if nm in K['COL']: material(nm)
    for nm in ('av_piel', 'av_pelo'):
        m = bpy.data.materials.get(nm)
        if m: m.diffuse_color = (0.93, 0.78, 0.66, 1) if nm == 'av_piel' else (0.15, 0.1, 0.08, 1)


def ver(sufijo):
    vis = {'Base', 'Pelo_2', 'Cejas_1', 'Boca_1', 'Nariz_1', 'Mangas_1', 'Arriba_4' + sufijo, 'Abajo_1' + sufijo}
    return vis


def caja(o):
    vs = [o.matrix_world @ v.co for v in o.data.vertices]
    return [round(min(v[i] for v in vs), 3) for i in range(3)], [round(max(v[i] for v in vs), 3) for i in range(3)]


limpia()
for x in [o for o in bpy.data.objects if o.name in ('Cube', 'Icosphere')]: bpy.data.objects.remove(x)
H = arma('')
M = arma('_M')
for o in (H, M):
    print(o.name, len(o.data.polygons), 'caras', caja(o), [m.name for m in o.data.materials])
print('alto personaje', caja(bpy.data.objects['Base'])[1][2], '-> juego', round(caja(bpy.data.objects['Base'])[1][2] * 0.8, 2))
colores()

if 'vista' in ARGS:
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sh = sc.display.shading; sh.light = 'STUDIO'; sh.color_type = 'MATERIAL'; sh.show_cavity = True
    sh.show_shadows = False
    sc.render.resolution_x, sc.render.resolution_y = 1500, 1000
    sc.render.film_transparent = False
    sc.world = bpy.data.worlds.new('w'); sc.world.color = (0.82, 0.8, 0.77)
    arm = bpy.data.objects['Rig']
    # dos figuras: H a la izquierda, M a la derecha; frente, 3/4 y espalda
    vistas = []
    tiles = []
    import tempfile
    tmp = tempfile.mkdtemp()
    for i, (suf, ang) in enumerate([('', 0), ('', 35), ('', 180), ('_M', 0), ('_M', 35), ('_M', 180)]):
        vis = ver(suf)
        for o in bpy.data.objects:
            if o.type == 'MESH': o.hide_render = o.name not in vis
        cam_d = bpy.data.cameras.new('c'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = 2.1 if 'cerca' in ARGS else 3.0
        cam = bpy.data.objects.new('c', cam_d); sc.collection.objects.link(cam)
        a = math.radians(ang); r = 8
        zc = 1.3 if 'cerca' in ARGS else 1.4
        cam.location = (r * math.sin(a), -r * math.cos(a), zc)
        cam.rotation_euler = (math.radians(90), 0, a)
        sc.camera = cam
        sc.render.resolution_x, sc.render.resolution_y = 500, 700
        f = os.path.join(tmp, f'{i}.png'); sc.render.filepath = f
        bpy.ops.render.render(write_still=True); tiles.append(f)
    # mosaico 3x2
    imgs = [bpy.data.images.load(f) for f in tiles]
    W, Hh = 500, 700
    out = bpy.data.images.new('mosaico', W * 3, Hh * 2)
    px = [0.0] * (W * 3 * Hh * 2 * 4)
    for k, im in enumerate(imgs):
        src = list(im.pixels); cx, cy = (k % 3) * W, (1 - k // 3) * Hh
        for y in range(Hh):
            o0 = ((cy + y) * W * 3 + cx) * 4; s0 = y * W * 4
            px[o0:o0 + W * 4] = src[s0:s0 + W * 4]
    out.pixels = px; out.filepath_raw = K['PNG']; out.file_format = 'PNG'; out.save()
    print('vista', K['PNG'])

if 'exportar' in ARGS:
    arm = bpy.data.objects['Rig']
    for o in bpy.context.view_layer.objects: o.select_set(False)
    arm.select_set(True)
    for o in (H, M): o.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=K['OUT'], export_format='GLB', use_selection=True, export_animations=False,
                              export_yup=True, export_apply=False, export_skins=True)
    print('exportado', K['OUT'], round(os.path.getsize(K['OUT']) / 1024), 'KB')
