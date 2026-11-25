# blender/letras_merida.py — letras monumentales de MÉRIDA (referencia: las del centro de la ciudad).
# Letras gruesas de palo seco, cada una de un color, con grecas (espirales cuadradas) un tono más oscuras en todas las caras,
# acento verde inclinado sobre la E y base baja gris clara. Una sola textura de grecas (gris) multiplicada por el color de cada letra.
#   blender -b --factory-startup --python blender/letras_merida.py            -> guarda blender/letras_merida.blend
#   blender -b --factory-startup --python blender/letras_merida.py -- vista   -> además deja una vista en blender/letras_merida.png
import bpy, bmesh, math, os, sys, random
from array import array
from mathutils import Matrix, Vector

AQUI = os.path.dirname(os.path.abspath(__file__))
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
K = dict(
    H=2.0,          # alto de las letras (escala de la casa: personaje 2.1)
    FONDO=.85,      # grueso de las letras
    BISEL=.025,     # canto redondeado
    SEP=dict(ME=.14, ER=.14, RI=.08, ID=.14, DA=.04),   # separación entre cada par de letras (se ve la base entre ellas)
    E_ANCHO=.83,    # la E más angosta que la de Arial Black (brazos más cortos), como en la foto
    M_ABRE=.08,     # las patas de la M se abren hacia abajo (8 % más ancha al pie)
    ACENTO=dict(x0=.45, sale=.12, grueso=.50, hueco=.10, ang=22),   # losa inclinada: de la mitad de la E a un poco fuera de su orilla
    TILE=1.8,       # metros que abarca la textura de grecas (8x8 celdas)
    BASE_H=.28, BASE_X=.4, BASE_Y=.4,
    FUENTE='C:/Windows/Fonts/ariblk.ttf')
COL = dict(M=(.04, .38, .85), E=(.13, .58, .10), R=(.95, .16, .42), I=(.80, .02, .05), D=(1.0, .68, .02), A=(1.0, .33, .03))
GRIS = (.78, .78, .76)

def limpiar():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o)
    for c in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.images, bpy.data.cameras, bpy.data.lights):
        for d in list(c): c.remove(d)

def greca():
    """Textura 512²: cuadrícula 8x8 con espirales cuadradas (líneas 0.62) sobre blanco; ~60 % de celdas llenas."""
    N, C = 512, 64; px = array('f', [1.0]) * (N * N * 4); rnd = random.Random(7)
    camino = [(0, 0), (6, 0), (6, 6), (0, 6), (0, 2), (4, 2), (4, 4), (2, 4)]
    def rect(x0, y0, x1, y1):
        for y in range(max(0, y0), min(N, y1)):
            b = (y * N) * 4
            for x in range(max(0, x0), min(N, x1)):
                i = b + x * 4; px[i] = px[i + 1] = px[i + 2] = .62
    for cy in range(8):
        for cx in range(8):
            if rnd.random() > .6: continue
            r = rnd.randrange(4)
            def p(i, j):
                for _ in range(r): i, j = 6 - j, i
                return cx * C + 8 + i * 8, cy * C + 8 + j * 8
            for a, b in zip(camino, camino[1:]):
                (x0, y0), (x1, y1) = p(*a), p(*b)
                rect(min(x0, x1) - 3, min(y0, y1) - 3, max(x0, x1) + 4, max(y0, y1) + 4)
    img = bpy.data.images.new('greca', N, N); img.pixels.foreach_set(px)
    img.filepath_raw = os.path.join(AQUI, 'greca.png'); img.file_format = 'PNG'; img.save(); img.pack()
    return img

def material(nom, col, img=None, rough=.45):
    m = bpy.data.materials.new(nom); m.use_nodes = True; nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'); bsdf.inputs['Roughness'].default_value = rough
    if img is None: bsdf.inputs['Base Color'].default_value = (*col, 1); return m
    tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = img
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs[0].default_value = 1
    a, b = [s for s in mx.inputs if s.type == 'RGBA'][:2]
    nt.links.new(tx.outputs['Color'], a); b.default_value = (*col, 1)
    nt.links.new([s for s in mx.outputs if s.type == 'RGBA'][0], bsdf.inputs['Base Color'])
    return m

def uv_caja(me):
    """Proyección de caja en coordenadas de mundo: las grecas quedan del mismo tamaño en todas las caras."""
    bm = bmesh.new(); bm.from_mesh(me); uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        n = f.normal; ax = max(range(3), key=lambda k: abs(n[k]))
        u, v = [(1, 2), (0, 2), (0, 1)][ax]
        for l in f.loops: l[uv].uv = (l.vert.co[u] / K['TILE'], l.vert.co[v] / K['TILE'])
    bm.to_mesh(me); bm.free()

def letra_malla(ch, fuente, tam):
    cu = bpy.data.curves.new('t_' + ch, 'FONT'); cu.body = ch; cu.font = fuente; cu.size = tam
    cu.extrude = K['FONDO'] / 2 - K['BISEL']; cu.bevel_depth = K['BISEL']; cu.bevel_resolution = K.get('BIS_RES', 2); cu.resolution_u = 6
    ob = bpy.data.objects.new('t_' + ch, cu); bpy.context.scene.collection.objects.link(ob)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg)); bpy.data.objects.remove(ob); bpy.data.curves.remove(cu)
    me.transform(Matrix.Rotation(math.radians(90), 4, 'X'))   # de pie, frente hacia −Y
    return me

def caja(nom, x0, x1, y0, y1, z0, z1):
    me = bpy.data.meshes.new(nom); bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co = Vector(((x0 + x1) / 2 + v.co.x * (x1 - x0), (y0 + y1) / 2 + v.co.y * (y1 - y0), (z0 + z1) / 2 + v.co.z * (z1 - z0)))
    bm.to_mesh(me); bm.free(); return me

def mallas():
    """Letras, acento y base como mallas sueltas (sin material ni UV): [(nombre, color, malla)], ancho de las letras.
    Origen: x 0 = orilla izquierda de la M, base de 0 a BASE_H en z, frente hacia −Y. barrio_parque.py las usa igual."""
    fuente = bpy.data.fonts.get('ariblk') or bpy.data.fonts.load(K['FUENTE'])
    prueba = letra_malla('M', fuente, 1.0); zs = [v.co.z for v in prueba.vertices]
    tam = K['H'] / (max(zs) - min(zs)); bpy.data.meshes.remove(prueba)
    x = 0.0; info = {}; pal = 'MERIDA'; res = []
    for k, ch in enumerate(pal):
        me = letra_malla(ch, fuente, tam); xs = [v.co.x for v in me.vertices]; zs = [v.co.z for v in me.vertices]
        z0, z1, cx = min(zs), max(zs), (min(xs) + max(xs)) / 2
        for v in me.vertices:
            zn = (v.co.z - z0) / (z1 - z0)
            if ch == 'M': v.co.x = cx + (v.co.x - cx) * (1 + K['M_ABRE'] * (1 - zn))
            if ch == 'E': v.co.x = min(xs) + (v.co.x - min(xs)) * K['E_ANCHO']
        me.update(); xs = [v.co.x for v in me.vertices]
        me.transform(Matrix.Translation((x - min(xs), 0, K['BASE_H'] - z0)))
        info[ch] = (x, x + max(xs) - min(xs)); x = info[ch][1]
        if k < len(pal) - 1: x += K['SEP'][ch + pal[k + 1]]
        res.append(('letra_' + ch, COL[ch], me))
    # acento de la É: losa gruesa en paralelogramo (cantos verticales) que sube hacia la derecha, flotando apenas sobre la E
    e0, e1 = info['E']; w = e1 - e0; A = K['ACENTO']; ax0, ax1 = e0 + A['x0'] * w, e1 + A['sale']
    zb = K['BASE_H'] + K['H'] + A['hueco']
    me = caja('acento', ax0, ax1, -K['FONDO'] / 2, K['FONDO'] / 2, zb, zb + A['grueso'])
    for v in me.vertices: v.co.z += (v.co.x - ax0) * math.tan(math.radians(A['ang']))
    res.append(('acento', COL['E'], me))
    res.append(('base', GRIS, caja('base', -K['BASE_X'], x + K['BASE_X'], -K['FONDO'] / 2 - K['BASE_Y'], K['FONDO'] / 2 + K['BASE_Y'], 0, K['BASE_H'])))
    return res, x

def armar():
    limpiar(); img = greca()
    col = bpy.data.collections.new('LetrasMerida'); bpy.context.scene.collection.children.link(col)
    res, x = mallas()
    for nom, c, me in res:
        if nom == 'base': me.materials.append(material('base', GRIS, rough=.8))
        else:
            uv_caja(me); mn = 'letra_' + nom[-1] if nom != 'acento' else 'letra_E'
            me.materials.append(bpy.data.materials.get(mn) or material(mn, c, img))
        col.objects.link(bpy.data.objects.new(nom, me))
    return x

def escena(ancho):
    sc = bpy.context.scene; c = (ancho / 2, 0, 1.1)
    sc.view_settings.view_transform = 'Standard'   # colores tal cual (AgX los deslava)
    sol = bpy.data.objects.new('sol', bpy.data.lights.new('sol', 'SUN')); sc.collection.objects.link(sol)
    sol.data.energy = 3.2; sol.rotation_euler = (math.radians(50), 0, math.radians(-35))
    w = sc.world or bpy.data.worlds.new('mundo'); sc.world = w; w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs[0].default_value = (.55, .72, 1, 1); bg.inputs[1].default_value = .5
    piso = caja('piso_vista', -20, 30, -20, 20, -.02, 0); piso.materials.append(material('piso_vista', (.6, .58, .55), rough=.9))
    sc.collection.objects.link(bpy.data.objects.new('piso_vista', piso))
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.lens = 35; cam.location = (c[0] - 3.5, -14.5, 2.4)
    d = Vector(c) - cam.location; cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    for s in bpy.data.screens:
        for a in s.areas:
            if a.type == 'VIEW_3D': a.spaces[0].shading.type = 'MATERIAL'

if __name__ == '__main__':   # barrio_parque.py la carga como biblioteca (solo mallas())
    ancho = armar(); escena(ancho)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(AQUI, 'letras_merida.blend'))
    if 'vista' in ARGS:
        sc = bpy.context.scene
        for e in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
            try: sc.render.engine = e; break
            except TypeError: pass
        sc.render.resolution_x, sc.render.resolution_y = 1280, 640
        sc.render.filepath = os.path.join(AQUI, 'letras_merida.png'); bpy.ops.render.render(write_still=True)
    print('LETRAS OK ancho %.2f' % ancho)
