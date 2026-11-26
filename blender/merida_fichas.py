# blender/merida_fichas.py — fichas de metal de Mérida en Venta (cada jugador elige una). Solo la figura: la base del color
# del jugador la pone el juego (c_merida3d.js). Cada ficha es un objeto con su nombre, origen al centro de la base, de pie
# sobre z=0, frente hacia -Y, materiales M1 (metal) y M2 (metal oscuro). Se ajusta a ALTO y RADIO.
#   blender -b --factory-startup --python blender/merida_fichas.py -- vista [png] [nombres,...]   (hoja de revisión)
#   blender -b --factory-startup --python blender/merida_fichas.py -- exportar                    (modelos/merida/fichas.glb)
#   blender -b --factory-startup --python blender/merida_fichas.py -- iconos                      (modelos/merida/fichas_ico.webp, selector de la sala)
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix, Euler, Quaternion

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALTO, RADIO = 0.40, 0.22
ORDEN = ['sombrero', 'hamaca', 'perro', 'gato', 'flamenco', 'tricitaxi', 'panucho', 'confidente', 'henequen', 'tolok']
NOMBRE = {'sombrero': 'Sombrero', 'hamaca': 'Hamaca', 'perro': 'Perro', 'gato': 'Gato', 'flamenco': 'Flamenco', 'tricitaxi': 'Tricitaxi',
          'panucho': 'Panucho', 'guayabera': 'Guayabera', 'marquesita': 'Marquesita', 'confidente': 'Confidente', 'henequen': 'Henequén', 'tolok': 'Tolok'}
PI = math.pi

# ---------- materiales ----------
def mat(n, col, rough, metal=1.0):
    m = bpy.data.materials.get(n) or bpy.data.materials.new(n)
    m.use_nodes = True
    b = next(x for x in m.node_tree.nodes if x.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*col, 1)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    return m
M1 = M2 = None
def mats():
    global M1, M2
    M1 = mat('M1', (0.80, 0.79, 0.76), 0.30)
    M2 = mat('M2', (0.36, 0.33, 0.30), 0.42)

# ---------- piezas ----------
def _obj(me, n='p', m=None):
    o = bpy.data.objects.new(n, me)
    bpy.context.scene.collection.objects.link(o)
    me.materials.append(m or M1)
    return o
def _bm_obj(bm, m=None, smooth=True):
    me = bpy.data.meshes.new('p'); bm.to_mesh(me); bm.free()
    if smooth: me.shade_smooth()
    return _obj(me, 'p', m)
def cyl(r1, r2, h, loc=(0, 0, 0), rot=(0, 0, 0), m=None, n=24, smooth=True):
    """cilindro/cono con la base en loc (sube por su Z local)"""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=n, radius1=r1, radius2=r2, depth=h)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, h / 2))
    bmesh.ops.transform(bm, verts=bm.verts, matrix=Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4())
    o = _bm_obj(bm, m, smooth)
    if smooth: split(o, 40)
    return o
def esfera(r, loc=(0, 0, 0), esc=(1, 1, 1), rot=(0, 0, 0), m=None, seg=16):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(8, seg // 2), radius=r)
    bmesh.ops.transform(bm, verts=bm.verts, matrix=Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*esc, 1)))
    return _bm_obj(bm, m)
def caja(sx, sy, sz, loc=(0, 0, 0), rot=(0, 0, 0), m=None, bev=0.01):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.transform(bm, verts=bm.verts, matrix=Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((sx, sy, sz, 1)))
    o = _bm_obj(bm, m, False)
    if bev:
        b = o.modifiers.new('b', 'BEVEL'); b.width = bev; b.segments = 2; b.limit_method = 'NONE'
        o = hornea(o); o.data.shade_smooth(); split(o, 50)
    return o
def toro(R, r, loc=(0, 0, 0), rot=(0, 0, 0), m=None, a0=0, a1=2 * PI, nM=32, nm=10):
    """toro (o tramo de toro de a0 a a1) en el plano XY"""
    pts = [(R * math.cos(a0 + (a1 - a0) * i / nM), R * math.sin(a0 + (a1 - a0) * i / nM), 0) for i in range(nM + 1)]
    cerrado = abs(a1 - a0 - 2 * PI) < 1e-4
    if cerrado: pts = pts[:-1]
    o = tubo(pts, r, m=m, cerrado=cerrado, res=nm)
    o.matrix_world = Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4()
    return o
def tubo(pts, r, m=None, radios=None, cerrado=False, res=8, tapa=True):
    """tubo por una polilínea; radios = factor por punto (adelgaza)"""
    cu = bpy.data.curves.new('t', 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = r; cu.bevel_resolution = max(1, res // 4); cu.use_fill_caps = tapa
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1); sp.use_cyclic_u = cerrado
    for i, p in enumerate(pts):
        sp.points[i].co = (*p, 1)
        if radios: sp.points[i].radius = radios[i]
    o = bpy.data.objects.new('t', cu); bpy.context.scene.collection.objects.link(o)
    o = hornea(o); o.data.materials.clear(); o.data.materials.append(m or M1); o.data.shade_smooth()
    return o
def suave(pts, n=6):
    """Catmull-Rom: más puntos por una polilínea"""
    P = [Vector(p) for p in pts]; out = []
    for i in range(len(P) - 1):
        p0, p1, p2, p3 = P[max(i - 1, 0)], P[i], P[i + 1], P[min(i + 2, len(P) - 1)]
        for j in range(n):
            t = j / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-1]); return [tuple(v) for v in out]
def torno(perfil, m=None, n=40, rot=(0, 0, 0), loc=(0, 0, 0)):
    """superficie de revolución de un perfil [(r,z)...] alrededor de Z"""
    bm = bmesh.new(); anillos = []
    for (r, z) in perfil:
        if r < 1e-5:
            anillos.append([bm.verts.new((0, 0, z))])
        else:
            anillos.append([bm.verts.new((r * math.cos(2 * PI * i / n), r * math.sin(2 * PI * i / n), z)) for i in range(n)])
    for a, b in zip(anillos, anillos[1:]):
        for i in range(n):
            if len(a) == 1 and len(b) == 1: continue
            if len(a) == 1: bm.faces.new((a[0], b[i], b[(i + 1) % n]))
            elif len(b) == 1: bm.faces.new((a[i], b[0], a[(i + 1) % n]))
            else: bm.faces.new((a[i], b[i], b[(i + 1) % n], a[(i + 1) % n]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.transform(bm, verts=bm.verts, matrix=Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4())
    o = _bm_obj(bm, m); split(o, 45); return o
def hoja(puntos, anchos, m=None, quilla=0.4, grosor=0.006):
    """tira con sección en V a lo largo de puntos; anchos por punto"""
    bm = bmesh.new(); filas = []
    P = [Vector(p) for p in puntos]
    for i, p in enumerate(P):
        d = (P[min(i + 1, len(P) - 1)] - P[max(i - 1, 0)]).normalized()
        lado = d.cross(Vector((0, 0, 1)))
        if lado.length < 1e-4: lado = Vector((1, 0, 0))
        lado.normalize(); arriba = lado.cross(d).normalized()
        w = anchos[i]
        filas.append([bm.verts.new(p - lado * w + arriba * w * quilla), bm.verts.new(p), bm.verts.new(p + lado * w + arriba * w * quilla)])
    for a, b in zip(filas, filas[1:]):
        for j in range(2): bm.faces.new((a[j], b[j], b[j + 1], a[j + 1]))
    me = bpy.data.meshes.new('h'); bm.to_mesh(me); bm.free(); me.shade_smooth()
    o = _obj(me, 'h', m)
    s = o.modifiers.new('s', 'SOLIDIFY'); s.thickness = grosor; s.offset = 0
    return hornea(o)
def bola(n, elems, res=0.008, m=None):
    """metabolas: elems = [(tipo, co, radio, tam(x,y,z), rot euler, negativo)]; une las formas suaves"""
    mb = bpy.data.metaballs.new(n); mb.resolution = res; mb.render_resolution = res; mb.threshold = 0.6
    for e in elems:
        t, co, r = e[0], e[1], e[2]; tam = e[3] if len(e) > 3 else (1, 1, 1); rot = e[4] if len(e) > 4 else (0, 0, 0)
        el = mb.elements.new(type=t); el.co = co; el.radius = r / .575
        el.size_x, el.size_y, el.size_z = tam
        el.rotation = Euler(rot).to_quaternion()
        if len(e) > 5 and e[5]: el.use_negative = True
    o = bpy.data.objects.new(n, mb); bpy.context.scene.collection.objects.link(o)
    o = hornea(o); n = len(o.data.polygons)
    if n > 1800:
        d = o.modifiers.new('d', 'DECIMATE'); d.ratio = 1800 / n; o = hornea(o)
    o.data.materials.clear(); o.data.materials.append(m or M1); o.data.shade_smooth()
    return o
def split(o, ang):
    e = o.modifiers.new('e', 'EDGE_SPLIT'); e.split_angle = math.radians(ang)
def hornea(o):
    """aplica modificadores / convierte curva, texto o metabola a malla; devuelve el objeto malla"""
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    n = bpy.data.objects.new(o.name, me); n.matrix_world = o.matrix_world.copy()
    bpy.context.scene.collection.objects.link(n); bpy.data.objects.remove(o)
    return n
def une_sin(partes):
    """junta las piezas en un objeto (coordenadas del mundo), sin acomodar"""
    partes = [hornea(p) if p.modifiers else p for p in partes]
    ctx = {'active_object': partes[0], 'selected_editable_objects': partes, 'selected_objects': partes}
    with bpy.context.temp_override(**ctx): bpy.ops.object.join()
    o = partes[0]; o.data.transform(o.matrix_world); o.matrix_world = Matrix()
    return o
def funde(partes, vox=.004, suav=3, caras=2500, m=None):
    """funde formas sueltas en una sola pieza lisa (remallado por vóxeles), y la aligera"""
    o = une_sin(partes)
    r = o.modifiers.new('r', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = vox; r.adaptivity = 0
    s = o.modifiers.new('s', 'SMOOTH'); s.factor = .6; s.iterations = suav
    o = hornea(o); n = len(o.data.polygons)
    if n > caras:
        d = o.modifiers.new('d', 'DECIMATE'); d.ratio = caras / n; o = hornea(o)
    o.data.materials.clear(); o.data.materials.append(m or M1); o.data.shade_smooth()
    return o
def une(partes, nombre):
    o = une_sin(partes); o.name = nombre; o.data.name = nombre
    # al piso, centrado, y a la medida
    vs = [v.co for v in o.data.vertices]
    x0, x1 = min(v.x for v in vs), max(v.x for v in vs); y0, y1 = min(v.y for v in vs), max(v.y for v in vs); z0 = min(v.z for v in vs); z1 = max(v.z for v in vs)
    o.data.transform(Matrix.Translation((-(x0 + x1) / 2, -(y0 + y1) / 2, -z0)))
    rad = max(math.hypot(v.co.x, v.co.y) for v in o.data.vertices)
    k = min(ALTO / (z1 - z0), RADIO / rad, ESC.get(nombre, 9))
    o.data.transform(Matrix.Scale(k, 4))
    # materiales: dejar solo M1/M2 (los repetidos se juntan)
    me = o.data; idx = [0 if (s and s.name.startswith('M1')) else 1 for s in me.materials]
    for p in me.polygons: p.material_index = idx[p.material_index]
    me.materials.clear(); me.materials.append(M1); me.materials.append(M2)
    # tope de triángulos por ficha (celulares débiles): se aligera lo que sobre
    me.calc_loop_triangles(); nt = len(me.loop_triangles)
    if nt > TRIS and not nombre.endswith('_'):
        d = o.modifiers.new('d', 'DECIMATE'); d.ratio = TRIS / nt; d.use_collapse_triangulate = True
        o = hornea(o); o.name = nombre; o.data.name = nombre
    return o
TRIS = 3500
ESC = {}   # tope de escala por ficha (para que las bajitas no se agranden de más)

# ---------- las fichas ----------
def f_sombrero():
    # sombrero de jipi: copa con hendidura al centro, ala ancha con la orilla un poco levantada, cinta oscura
    per = [(0, .300), (.04, .300), (.075, .292), (.100, .272), (.112, .230), (.118, .150), (.121, .085),
           (.135, .072), (.170, .062), (.205, .060), (.228, .068), (.240, .082), (.243, .076), (.236, .064), (.215, .050),
           (.170, .048), (.130, .054), (0, .054)]
    c = torno(per, n=48)
    for v in c.data.vertices:   # hendidura de la copa (de adelante hacia atrás)
        if v.co.z > .2:
            f = math.exp(-(v.co.x / .045) ** 2) * min(1, (v.co.z - .2) / .09)
            v.co.z -= .045 * f
            if abs(v.co.y) > .07: v.co.x *= 1 - .18 * min(1, (v.co.z - .2) / .09)   # pellizco al frente
    cinta = torno([(.1215, .082), (.1235, .085), (.1215, .118), (.119, .121)], m=M2, n=48)
    mono = esfera(.018, (.119, -.03, .1), (.45, 1, .8), m=M2)
    ESC['sombrero'] = 1.0
    return une([c, cinta, mono], 'sombrero')

def f_hamaca():
    # dos postes; la hamaca cuelga de UN punto en cada lado: los hilos salen de un solo nudo y se abren hasta la tela
    X, Z = .21, .26
    partes = [cyl(.024, .02, Z + .02, (-X, 0, 0), m=M2), cyl(.024, .02, Z + .02, (X, 0, 0), m=M2),
              esfera(.024, (-X, 0, Z + .03), m=M2), esfera(.024, (X, 0, Z + .03), m=M2)]
    nudo = [(-X + .02, 0, Z), (X - .02, 0, Z)]
    partes += [esfera(.013, nudo[0], m=M2), esfera(.013, nudo[1], m=M2)]
    # tela: de u=.28 a u=.72 de la luz entre nudos; cuelga y se ahueca a lo ancho
    def P(u, v):
        x = -X + .02 + (2 * X - .04) * u
        s = math.sin(PI * u)
        w = .072 * (0.55 + 0.45 * s)
        return Vector((x, w * v, Z - .15 * s ** 1.2 + .035 * v * v * s))
    U, Vn = 30, 9
    bm = bmesh.new(); fil = []
    for i in range(U + 1):
        u = .15 + .7 * i / U
        fil.append([bm.verts.new(P(u, -1 + 2 * j / (Vn - 1))) for j in range(Vn)])
    caras = []
    for i in range(U):
        for j in range(Vn - 1):
            caras.append((bm.faces.new((fil[i][j], fil[i + 1][j], fil[i + 1][j + 1], fil[i][j + 1])), i))
    me = bpy.data.meshes.new('h'); bm.to_mesh(me); bm.free(); me.shade_smooth()
    tela = _obj(me, 'tela', M1); tela.data.materials.append(M2)
    for p in tela.data.polygons:   # franjas oscuras
        i = p.index // (Vn - 1)
        if i in (4, 5, U - 6, U - 5): p.material_index = 1
    s = tela.modifiers.new('s', 'SOLIDIFY'); s.thickness = .01; s.offset = 0
    partes.append(tela)
    for v in (-1, 1):   # flecos
        for i in range(13):
            a = P(.2 + .6 * i / 12, v * 1.02); partes.append(tubo([tuple(a), tuple(a + Vector((0, v * .006, -.03)))], .004, res=4))
    # orillas de la tela (cordón) y los hilos de cada lado hasta el nudo
    for v in (-1, 1):
        partes.append(tubo([tuple(P(.15 + .7 * i / 40, v)) for i in range(41)], .006))
    for lado, u in ((0, .15), (1, .85)):
        for j in range(7):
            v = -1 + 2 * j / 6; a = P(u, v); b = Vector(nudo[lado])
            mid = (a + b) / 2 + Vector((0, 0, -.012))
            partes.append(tubo([tuple(b), tuple(mid), tuple(a)], .0035, res=4))
    return une(partes, 'hamaca')

def f_perro():
    # perro sentado: pecho alto, hocico, orejas caídas, collar, cola; las formas se funden en una sola pieza
    E = lambda c, r, rot=(0, 0, 0): esfera(1, c, r, rot, seg=24)
    cuerpo = funde([
        E((0, .02, .15), (.062, .072, .11), (.15, 0, 0)),
        E((-.05, .06, .065), (.045, .07, .06)), E((.05, .06, .065), (.045, .07, .06)),
        E((-.06, -.015, .016), (.026, .045, .016)), E((.06, -.015, .016), (.026, .045, .016)),
        tubo([(-.034, -.035, .17), (-.034, -.055, .02)], .02), tubo([(.034, -.035, .17), (.034, -.055, .02)], .02),
        E((-.034, -.072, .013), (.022, .03, .014)), E((.034, -.072, .013), (.022, .03, .014)),
        tubo([(0, -.01, .2), (0, -.035, .27)], .042),
        E((0, -.04, .3), (.05, .054, .048)),
        E((0, -.1, .283), (.028, .042, .025)),
        E((-.052, -.03, .285), (.012, .026, .042), (0, .25, 0)), E((.052, -.03, .285), (.012, .026, .042), (0, -.25, 0)),
        tubo(suave([(0, .1, .04), (0, .15, .05), (.015, .18, .09), (.025, .17, .13)]), .013),
    ])
    nariz = esfera(.014, (0, -.142, .29), (1.2, .8, .8), m=M2)
    ojos = [esfera(.01, (s * .026, -.087, .315), (.8, .5, 1.15), m=M2) for s in (-1, 1)]
    collar = toro(.046, .008, (0, -.022, .235), (-.45, 0, 0), m=M2)
    placa = esfera(.011, (0, -.07, .215), (1, .4, 1), m=M2)
    return une([cuerpo, nariz, collar, placa] + ojos, 'perro')

def f_gato():
    # gato sentado: cabeza ancha, orejas en punta, la cola le da la vuelta por enfrente
    E = lambda c, r, rot=(0, 0, 0): esfera(1, c, r, rot, seg=24)
    cuerpo = funde([
        E((0, .02, .13), (.052, .062, .1), (.1, 0, 0)),
        E((-.042, .045, .058), (.04, .06, .055)), E((.042, .045, .058), (.04, .06, .055)),
        tubo([(-.025, -.032, .15), (-.025, -.045, .016)], .016), tubo([(.025, -.032, .15), (.025, -.045, .016)], .016),
        E((-.025, -.058, .012), (.018, .024, .012)), E((.025, -.058, .012), (.018, .024, .012)),
        tubo([(0, .0, .19), (0, -.012, .245)], .036),
        E((0, -.02, .272), (.056, .048, .044)),
        E((-.016, -.06, .258), (.02, .016, .015)), E((.016, -.06, .258), (.02, .016, .015)),
        cyl(.022, .004, .05, (-.034, -.02, .29), (.1, -.38, 0), n=16), cyl(.022, .004, .05, (.034, -.02, .29), (.1, .38, 0), n=16),
        tubo(suave([(.04, .09, .03), (.09, .04, .018), (.085, -.04, .014), (.035, -.08, .014), (-.02, -.085, .016)]), .013),
    ], vox=.0035)
    ojos = [esfera(.011, (s * .026, -.062, .282), (.9, .45, 1.25), (0, 0, s * .25), m=M2) for s in (-1, 1)]
    nariz = esfera(.007, (0, -.075, .266), (1.3, .7, .8), m=M2)
    return une([cuerpo, nariz] + ojos, 'gato')

def f_flamenco():
    # flamenco en una pata: cuerpo con la cola alzada, cuello en S, pico doblado; la otra pata doblada
    E = lambda c, r, rot=(0, 0, 0): esfera(1, c, r, rot, seg=24)
    cuerpo = funde([
        E((0, .03, .21), (.07, .105, .065), (.3, 0, 0)),
        E((0, .135, .255), (.04, .05, .024), (.5, 0, 0)),
        E((0, .04, .23), (.078, .08, .042), (.25, 0, 0)),
        tubo(suave([(0, -.04, .23), (0, -.1, .28), (0, -.06, .33), (0, -.02, .37), (0, -.035, .405)]), .022),
        E((0, -.045, .41), (.03, .036, .028)),
    ], vox=.0035)
    pico = tubo(suave([(0, -.075, .41), (0, -.1, .4), (0, -.11, .372)], 4), .015, radios=[1, .95, .9, .8, .7, .6, .5, .4, .3])
    punta = tubo(suave([(0, -.109, .38), (0, -.11, .358)], 3), .01, radios=[1, .8, .6, .4], m=M2)
    ojos = [esfera(.007, (s * .027, -.058, .42), m=M2) for s in (-1, 1)]
    pata = tubo([(0, .03, .17), (0, .035, .09), (0, .03, .012)], .013, m=M2)
    rod = esfera(.017, (0, .035, .09), m=M2)
    pata2 = tubo([(.025, .05, .17), (.035, .11, .115), (.028, .05, .1), (.022, .01, .105)], .011, m=M2)
    pie = esfera(.034, (0, .0, .008), (.9, 1.3, .28), m=M2)
    return une([cuerpo, pico, punta, pata, rod, pata2, pie] + ojos, 'flamenco')

def f_tricitaxi():
    # tricitaxi: carrito con asiento y capota de fuelle adelante (dos ruedas chicas), bici atrás (rueda grande) con asiento y manubrio
    P = []
    def rueda(x, y, r):
        P.append(toro(r, .015, (x, y, r + .002), (0, PI / 2, 0), m=M2, nM=36))
        P.append(cyl(.02, .02, .034, (x - .017, y, r + .002), (0, PI / 2, 0), m=M1))
        for k in range(8):
            a = k * PI / 4
            P.append(tubo([(x, y, r + .002), (x, y + math.cos(a) * r, r + .002 + math.sin(a) * r)], .003, m=M1, res=4))
    rueda(-.14, -.11, .05); rueda(.14, -.11, .05); rueda(0, .15, .07)
    P.append(cyl(.008, .008, .28, (-.14, -.11, .052), (0, PI / 2, 0), m=M2))
    # carrito: caja con franja, cojín, respaldo
    P.append(caja(.24, .15, .08, (0, -.1, .14), bev=.014))
    P.append(caja(.245, .004, .025, (0, -.177, .14), bev=0, m=M2))
    P.append(caja(.21, .12, .03, (0, -.11, .195), bev=.013))
    P.append(caja(.21, .03, .1, (0, -.04, .245), (-.15, 0, 0), bev=.013))
    P.append(caja(.2, .06, .014, (0, -.2, .09), bev=.005, m=M2))   # estribo
    # capota de fuelle: medio cilindro con costados cerrados, del respaldo hacia el frente; costillas oscuras
    R, cy, cz = .135, -.075, .215
    A0, A1, NA, NX = math.radians(-8), math.radians(105), 16, 8
    def C(a, x): return Vector((x, cy + R * math.cos(a), cz + R * math.sin(a)))
    bm = bmesh.new()
    g = [[bm.verts.new(C(A0 + (A1 - A0) * i / NA, -.125 + .25 * j / NX)) for j in range(NX + 1)] for i in range(NA + 1)]
    for i in range(NA):
        for j in range(NX): bm.faces.new((g[i][j], g[i][j + 1], g[i + 1][j + 1], g[i + 1][j]))
    for j in (0, NX):   # costados: abanico desde el eje
        c = bm.verts.new(Vector((-.125 + .25 * j / NX, cy, cz)))
        for i in range(NA): bm.faces.new((c, g[i][j], g[i + 1][j]))
    me = bpy.data.meshes.new('c'); bm.to_mesh(me); bm.free(); me.shade_smooth()
    cap = _obj(me, 'cap', M1); s = cap.modifiers.new('s', 'SOLIDIFY'); s.thickness = .01; s.offset = 0; P.append(cap)
    for k in range(4):
        a = A0 + (A1 - A0) * (k + .5) / 4
        P.append(tubo([tuple(C(a, -.128)), tuple(C(a, -.128) + Vector((.256, 0, 0)))], .006, m=M2, res=4))
    for sx in (-.129, .129):
        P.append(tubo([tuple(C(A0 + (A1 - A0) * i / 12, sx)) for i in range(13)], .005, m=M2, res=4))
    # bici de atrás: cuadro, asiento alto, manubrio, pedales
    P.append(tubo([(0, -.02, .15), (0, .06, .12), (0, .15, .072)], .012, m=M2))
    P.append(tubo([(0, .06, .12), (0, .075, .25)], .01, m=M2))
    P.append(esfera(.034, (0, .08, .258), (.8, 1.35, .35), m=M2))
    P.append(tubo([(0, .03, .2), (0, .03, .3)], .009, m=M2))
    P.append(tubo([(-.075, .05, .3), (-.05, .03, .305), (.05, .03, .305), (.075, .05, .3)], .009, m=M2))
    P.append(toro(.026, .007, (0, .06, .11), (0, PI / 2, 0), m=M1))
    P.append(tubo([(-.03, .04, .095), (.03, .08, .125)], .006, m=M2, res=4))
    return une(P, 'tricitaxi')

def f_panucho():
    # panucho en su plato: tortilla inflada (gruesa, frita), montaña de lechuga y pavo, rebanada de tomate, aguacate y cebolla morada
    import random; random.seed(7)
    plato = torno([(0, .0), (.17, .0), (.205, .03), (.215, .045), (.205, .045), (.17, .02), (0, .02)], m=M2, n=48)
    tort = torno([(0, .02), (.13, .02), (.15, .032), (.155, .05), (.148, .068), (.13, .076), (0, .078)], n=40)
    for v in tort.data.vertices:   # orilla irregular
        a = math.atan2(v.co.y, v.co.x); r = math.hypot(v.co.x, v.co.y)
        k = 1 + .05 * math.sin(3 * a + 1) + .03 * math.sin(7 * a)
        v.co.x *= k; v.co.y *= k
    P = [plato, tort]
    # lechuga picada: tiras que se amontonan en un cerro
    for i in range(46):
        a = random.uniform(0, 2 * PI); r = .11 * math.sqrt(random.random())
        h = .085 + .07 * (1 - (r / .11) ** 2) * random.uniform(.7, 1)
        c = Vector((r * math.cos(a), r * math.sin(a), h))
        d = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-.4, .4))).normalized() * .03
        P.append(tubo([tuple(c - d), tuple(c + Vector((0, 0, .008))), tuple(c + d)], .0055, res=4))
    # pavo deshebrado (oscuro) debajo
    for i in range(12):
        a = random.uniform(0, 2 * PI); r = random.uniform(.04, .12)
        c = Vector((r * math.cos(a), r * math.sin(a), .085))
        d = Vector((math.cos(a + 1.4), math.sin(a + 1.4), 0)) * .03
        P.append(tubo([tuple(c - d), tuple(c + d)], .006, m=M2, res=4))
    # tomate arriba, inclinado; aguacate a un lado; cebolla en aros
    P.append(cyl(.05, .05, .014, (.01, -.02, .158), (.25, .15, 0), n=28))
    for k in range(3):
        a = k * 2 * PI / 3 + .4
        P.append(esfera(.013, (.01 + .025 * math.cos(a), -.02 + .025 * math.sin(a), .175), (1, 1, .35), (.25, .15, 0), m=M2))
    P.append(toro(.04, .012, (-.06, .06, .14), (.3, .2, 0), a0=0, a1=PI * .9, m=M1))
    P.append(toro(.04, .012, (.07, .055, .13), (-.2, .3, 1), a0=0, a1=PI * .9, m=M1))
    for (x, y, rot) in ((-.07, -.04, (.5, .2, 0)), (.08, -.06, (-.3, .5, 0)), (-.02, .08, (.2, -.6, 0))):
        P.append(toro(.026, .004, (x, y, .15), rot, a0=0, a1=PI * 1.3, m=M2))
    ESC['panucho'] = 1.0
    return une(P, 'panucho')

def f_guayabera():
    # guayabera de manga corta: cuatro bolsas, alforzas (pliegues), botones, cuello abierto
    tor = bola('guay', [
        ('CUBE', (0, 0, .16), .025, (.07, .02, .11)),
        ('CUBE', (0, 0, .27), .025, (.09, .02, .02)),
    ], res=.006)
    P = [tor]
    for s in (-1, 1):
        P.append(bola('manga%d' % s, [('CAPSULE', (s * .118, 0, .262), .029, (.026, 1, 1), (0, s * .95, 0))], res=.006))
        P.append(toro(.029, .005, (s * .14, 0, .24), (0, PI / 2 - s * .95, 0), m=M2))
        P.append(caja(.05, .014, .05, (s * .028, -.045, .3), (-.35, 0, s * .55), bev=.006))
        for z, h in ((.235, .04), (.095, .05)):
            P.append(caja(.05, .008, h, (s * .056, -.047, z), bev=.003, m=M2))
            P.append(esfera(.006, (s * .056, -.052, z + h / 2 - .006), m=M1))
        for dx in (.03, .082):
            P.append(tubo([(s * dx, -.047, .04), (s * dx, -.047, .29)], .0035, m=M1, res=4))
    for k in range(6):
        P.append(esfera(.0065, (0, -.049, .29 - k * .048), (1, .5, 1), m=M2))
    return une(P, 'guayabera')

def f_marquesita():
    # marquesita: crepa crujiente enrollada (espiral a la vista) recargada en un queso de bola con la tapa cortada
    th = math.radians(58); R0 = .05
    pts = []
    for i in range(90):
        t = i / 89; a = t * 2.4 * 2 * PI; r = .014 + (R0 - .014) * t
        pts.append((r * math.cos(a), r * math.sin(a), 0))
    cu = bpy.data.curves.new('esp', 'CURVE'); cu.dimensions = '2D'; cu.extrude = .15; cu.fill_mode = 'NONE'
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts): sp.points[i].co = (*p, 1)
    rol = bpy.data.objects.new('rol', cu); bpy.context.scene.collection.objects.link(rol)
    rol = hornea(rol); rol.data.materials.clear(); rol.data.materials.append(M1)
    s = rol.modifiers.new('s', 'SOLIDIFY'); s.thickness = .007; rol = hornea(rol); rol.data.shade_smooth()
    rol.data.transform(Matrix.Translation((0, 0, .15)))
    rol = une_sin([rol, cyl(.014, .014, .3, (0, 0, 0), m=M2), toro(R0, .004, (0, 0, .004)), toro(R0, .004, (0, 0, .296))])
    # queso de bola: esfera con la tapa cortada (cara de queso clara, cera oscura)
    Rq, cz, corte = .075, .07, .115
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=36, v_segments=18, radius=Rq)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, cz))
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, corte), plane_no=(0, 0, 1), clear_outer=True)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, .004), plane_no=(0, 0, -1), clear_outer=True)
    nuevas = bmesh.ops.holes_fill(bm, edges=bm.edges[:], sides=0)['faces']
    me = bpy.data.meshes.new('q'); bm.to_mesh(me); bm.free()
    queso = _obj(me, 'queso', M2); queso.data.materials.append(M1)
    for p in queso.data.polygons:
        if p.normal.z > .99 and p.center.z > corte - .002: p.material_index = 1
    queso.data.shade_smooth(); split(queso, 40)
    # la marquesita apoyada: toca el piso con su orilla y descansa sobre el queso
    cx = .07; d = Vector((math.sin(th), 0, math.cos(th)))
    bz = R0 * math.sin(th); dx = (Rq + R0 + (cz - bz) * math.sin(th)) / math.cos(th)
    rol.matrix_world = Matrix.Translation((cx - dx, 0, bz)) @ Matrix.Rotation(th, 4, 'Y')
    o = une([rol, queso], 'marquesita')
    return o

def f_confidente():
    # silla confidente (tú y yo): respaldo en S visto desde arriba, dos asientos que se miran al revés, base metida
    R, t, z0, z1 = .1, .026, .14, .34
    s = []
    for i in range(25):
        a = PI - PI * i / 24; s.append(Vector((-R + R * math.cos(a), R * math.sin(a), 0)))
    for i in range(1, 25):
        a = PI + PI * i / 24; s.append(Vector((R + R * math.cos(a), R * math.sin(a), 0)))
    nor = []
    for i, p in enumerate(s):
        d = (s[min(i + 1, len(s) - 1)] - s[max(i - 1, 0)]).normalized(); nor.append(Vector((-d.y, d.x, 0)))
    bm = bmesh.new(); N = len(s)
    def anillo(z): return [bm.verts.new(p + n * t / 2 + Vector((0, 0, z))) for p, n in zip(s, nor)] + [bm.verts.new(p - n * t / 2 + Vector((0, 0, z))) for p, n in zip(s, nor)]
    lo, hi = anillo(z0 - .01), anillo(z1)
    def q(a, b, c, d): bm.faces.new((a, b, c, d))
    for i in range(N - 1):
        q(lo[i], lo[i + 1], hi[i + 1], hi[i]); q(lo[N + i + 1], lo[N + i], hi[N + i], hi[N + i + 1])
        q(hi[i], hi[i + 1], hi[N + i + 1], hi[N + i]); q(lo[i + 1], lo[i], lo[N + i], lo[N + i + 1])
    q(lo[0], hi[0], hi[N], lo[N]); q(hi[N - 1], lo[N - 1], lo[2 * N - 1], hi[2 * N - 1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('r'); bm.to_mesh(me); bm.free()
    muro = _obj(me, 'muro', M1); b = muro.modifiers.new('b', 'BEVEL'); b.width = .006; b.segments = 2; b.limit_method = 'ANGLE'
    muro = hornea(muro); muro.data.shade_smooth(); split(muro, 50)
    P = [muro, tubo([tuple(p + Vector((0, 0, z1))) for p in s], .019, m=M1)]
    for p in (s[0], s[-1]):   # brazos: rollo en cada punta de la S, con su pata
        P.append(esfera(.03, tuple(p + Vector((0, 0, z1 + .004))), (1, 1, .85)))
        P.append(cyl(.016, .02, z0, tuple(p), m=M2, n=16))
    def medio(cx, lado, rr, za, zb, m, bev):
        bm = bmesh.new(); n = 28
        def an(z): return [bm.verts.new((cx + rr * math.cos(PI * i / n), lado * rr * math.sin(PI * i / n), z)) for i in range(n + 1)]
        a, b = an(za), an(zb)
        bm.faces.new(a); bm.faces.new(b)
        for i in range(n): bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
        bm.faces.new((a[n], a[0], b[0], b[n]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        me = bpy.data.meshes.new('as'); bm.to_mesh(me); bm.free()
        o = _obj(me, 'as', m); bv = o.modifiers.new('b', 'BEVEL'); bv.width = bev; bv.segments = 3; bv.limit_method = 'ANGLE'
        o = hornea(o); o.data.shade_smooth(); split(o, 50); return o
    # asiento (cojín grueso que sobresale) y base oscura metida; el asiento queda del lado abierto de cada curva
    for cx, lado in ((-R, -1), (R, 1)):
        P.append(medio(cx, -lado, R + .012, z0 - .035, z0, M1, .012))
        P.append(medio(cx, -lado, R - .03, 0, z0 - .03, M2, .006))
    return une(P, 'confidente')

def f_henequen():
    # henequén: roseta de pencas en V con espina en la punta y su quiote (vara de flor) alto con ramitas
    P = [cyl(.05, .042, .045, (0, 0, 0), m=M2, n=20)]
    capas = [(8, 30, .2, .036, .0), (7, 50, .22, .032, .35), (5, 68, .21, .027, .1), (3, 80, .17, .02, .7)]
    for (n, el, L, w, giro) in capas:
        for i in range(n):
            az = 2 * PI * i / n + giro; e = math.radians(el)
            pts, an = [], []
            for k in range(13):
                t = k / 12
                rh = L * t * math.cos(e) + (.035 * t * t if el < 60 else 0)
                z = .035 + L * t * math.sin(e) - (.04 * t * t if el < 45 else .008 * t * t)
                pts.append((math.cos(az) * (.018 + rh), math.sin(az) * (.018 + rh), z))
                an.append(w * (1 - t) ** .7 * min(1, .5 + t * 4) + .002)
            P.append(hoja(pts, an, quilla=.55, grosor=.01))
            a, b = Vector(pts[-2]), Vector(pts[-1]); d = (b - a).normalized()
            P.append(tubo([tuple(b), tuple(b + d * .016)], .0035, radios=[1, .3], m=M2, res=4))
    q = suave([(0, 0, .1), (.004, 0, .25), (.012, .004, .4), (.02, .01, .52)], 5)
    P.append(tubo(q, .015, radios=[1 - .5 * i / len(q) for i in range(len(q))], m=M1))
    for k, (z, az) in enumerate(((.4, 0), (.44, 2.1), (.48, 4.2), (.51, 1))):
        c = Vector((.012 + .008 * k / 3, .004 + .006 * k / 3, z)); d = Vector((math.cos(az), math.sin(az), .55)).normalized()
        P.append(tubo([tuple(c), tuple(c + d * .04)], .007, m=M1, res=4))
        P.append(esfera(.016, tuple(c + d * .046), (1, 1, .8), m=M1))
    ESC['henequen'] = 9
    return une(P, 'henequen')

def f_tolok():
    # tolok (iguana) asoleándose sobre una piedra: cresta de picos, papada, patas abiertas, cola larga que baja por la piedra
    pie = bpy.data.meshes.new('pi'); bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1)
    for v in bm.verts:
        n = v.co.normalized(); v.co = Vector((n.x * .11, n.y * .13, max(n.z, -.2) * .075)) * (1 + .07 * math.sin(5 * n.x + 2 * n.y) + .04 * math.sin(9 * n.y))
    bmesh.ops.translate(bm, verts=bm.verts, vec=(0, .0, .015)); bm.to_mesh(pie); bm.free(); pie.shade_smooth()
    P = [_obj(pie, 'piedra', M2)]
    E = lambda c, r, rot=(0, 0, 0): esfera(1, c, r, rot, seg=24)
    cola = suave([(0, .06, .1), (0, .12, .09), (.045, .16, .06), (.11, .15, .03), (.15, .07, .014), (.14, -.03, .01), (.1, -.1, .01)], 5)
    patas = []
    for s in (-1, 1):
        patas += [tubo([(s * .025, -.045, .1), (s * .065, -.06, .1), (s * .085, -.08, .072)], .011),
                  tubo([(s * .025, .045, .095), (s * .065, .06, .095), (s * .09, .075, .066)], .012),
                  E((s * .09, -.085, .066), (.018, .022, .008)), E((s * .095, .08, .06), (.018, .022, .008))]
    cuerpo = funde([
        E((0, .0, .1), (.042, .08, .03)),
        E((0, -.1, .13), (.03, .045, .026), (-.3, 0, 0)),
        E((0, -.085, .108), (.009, .028, .022)),
        tubo(cola, .026, radios=[max(.2, 1 - i / len(cola)) for i in range(len(cola))]),
    ] + patas, vox=.0035)
    P.append(cuerpo)
    for i in range(12):   # cresta: de la nuca a la cola
        y = -.105 + i * .017; z = .155 - .005 * i if i < 4 else .135 - .002 * i
        h = .03 - .0016 * i
        P.append(cyl(.008, .0015, h, (0, y, z - .012), (.3, 0, 0), m=M1, n=8))
    P += [esfera(.008, (s * .025, -.115, .14), m=M2) for s in (-1, 1)]
    return une(P, 'tolok')

FICHAS = {k: globals()['f_' + k] for k in ORDEN}

# ---------- escena ----------
def limpia():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o)
    mats()
def arma(nombres):
    return [FICHAS[n]() for n in nombres]

def vista(png, nombres):
    limpia(); obs = arma(nombres)
    import colorsys
    cols = min(4, len(obs)); dx, dy = .75, 1.0
    base_m = []
    for i, o in enumerate(obs):
        c, r = i % cols, i // cols
        x, y = (c - (cols - 1) / 2) * dx, -r * dy
        o.location = (x, y, .11); o.rotation_euler = (0, 0, -.55)
        col = colorsys.hsv_to_rgb((i * .13) % 1, .7, .75)
        m = mat('base%d' % i, col, .4, 0)
        b = cyl(.27, .3, .08, (x, y, .03), m=m, n=48, smooth=False)
        t = bpy.data.curves.new('tx', 'FONT'); t.body = NOMBRE[o.name]; t.size = .09; t.align_x = 'CENTER'
        to = bpy.data.objects.new('tx', t); to.location = (x, y - .36, 0.001); bpy.context.scene.collection.objects.link(to)
        t.materials.append(mat('txt', (.1, .08, .06), .8, 0))
    piso = bpy.data.meshes.new('piso'); bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=8); bm.to_mesh(piso); bm.free()
    _obj(piso, 'piso', mat('fieltro', (.16, .26, .2), .9, 0))
    sc = bpy.context.scene
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; nt = w.node_tree
    bg = next(n for n in nt.nodes if n.type == 'BACKGROUND')
    tc = nt.nodes.new('ShaderNodeTexCoord'); sx = nt.nodes.new('ShaderNodeSeparateXYZ'); cr = nt.nodes.new('ShaderNodeValToRGB')
    nt.links.new(tc.outputs['Generated'], sx.inputs[0]); nt.links.new(sx.outputs['Z'], cr.inputs[0]); nt.links.new(cr.outputs[0], bg.inputs['Color'])
    cr.color_ramp.elements[0].position = .45; cr.color_ramp.elements[0].color = (.12, .09, .07, 1)
    cr.color_ramp.elements[1].position = .62; cr.color_ramp.elements[1].color = (1, .95, .88, 1)
    bg.inputs['Strength'].default_value = 1.2
    for loc, en in (((3, -4, 6), 900), ((-4, -2, 4), 300), ((0, 5, 5), 250)):
        ld = bpy.data.lights.new('l', 'AREA'); ld.energy = en; ld.size = 3
        lo = bpy.data.objects.new('l', ld); lo.location = loc; sc.collection.objects.link(lo)
        lo.rotation_euler = (Vector((0, -1, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    rows = (len(obs) + cols - 1) // cols
    cy = -(rows - 1) * dy / 2 - .1
    cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = cols * dx + .15
    cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
    el = math.radians(32); dist = 8
    cam.location = (0, cy - dist * math.cos(el), dist * math.sin(el) + .2)
    cam.rotation_euler = (Vector((0, cy, .2)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.resolution_x, sc.render.resolution_y = (1600, int(1600 * (rows * dy * .6 + .5) / (cols * dx + .15)))
    try: sc.render.engine = 'CYCLES'
    except TypeError: pass
    sc.cycles.samples = 24; sc.cycles.use_denoising = True
    sc.render.filepath = png
    bpy.ops.render.render(write_still=True)
    for o in obs: print(o.name, len(o.data.polygons), 'caras')

def exportar():
    limpia(); obs = arma(ORDEN)
    for o in obs:
        me = o.data; me.calc_loop_triangles(); print(o.name, len(me.loop_triangles), 'triángulos')
    out = os.path.join(RAIZ, 'modelos', 'merida', 'fichas.glb'); os.makedirs(os.path.dirname(out), exist_ok=True)
    for o in bpy.data.objects: o.select_set(o in obs)
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_texcoords=False, export_normals=True, export_materials='EXPORT', export_extras=False)
    print('->', out, os.path.getsize(out) // 1024, 'KB')

def iconos(out=None):
    # tira de íconos para el selector de la sala: 10 celdas cuadradas, fondo transparente (modelos/merida/fichas_ico.webp)
    limpia(); obs = arma(ORDEN); dx, px = .62, 160
    for i, o in enumerate(obs):
        o.location = ((i - (len(obs) - 1) / 2) * dx, 0, 0); o.rotation_euler = (0, 0, -.5)
    sc = bpy.context.scene
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; nt = w.node_tree
    bg = next(n for n in nt.nodes if n.type == 'BACKGROUND')
    tc = nt.nodes.new('ShaderNodeTexCoord'); sx = nt.nodes.new('ShaderNodeSeparateXYZ'); cr = nt.nodes.new('ShaderNodeValToRGB')
    nt.links.new(tc.outputs['Generated'], sx.inputs[0]); nt.links.new(sx.outputs['Z'], cr.inputs[0]); nt.links.new(cr.outputs[0], bg.inputs['Color'])
    cr.color_ramp.elements[0].position = .45; cr.color_ramp.elements[0].color = (.10, .14, .11, 1)
    cr.color_ramp.elements[1].position = .62; cr.color_ramp.elements[1].color = (1, .95, .88, 1)
    bg.inputs['Strength'].default_value = 1.3
    for loc, en in (((3, -4, 6), 900), ((-4, -2, 4), 300), ((0, 5, 5), 250)):
        ld = bpy.data.lights.new('l', 'AREA'); ld.energy = en; ld.size = 3
        lo = bpy.data.objects.new('l', ld); lo.location = loc; sc.collection.objects.link(lo)
        lo.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    cd = bpy.data.cameras.new('c'); cd.type = 'ORTHO'; cd.ortho_scale = len(obs) * dx
    cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
    el = math.radians(22); dist = 8; cz = ALTO * .5
    cam.location = (0, -dist * math.cos(el), dist * math.sin(el) + cz)
    cam.rotation_euler = (Vector((0, 0, cz)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.resolution_x, sc.render.resolution_y = len(obs) * px, px
    try: sc.render.engine = 'CYCLES'
    except TypeError: pass
    sc.cycles.samples = 48; sc.cycles.use_denoising = True; sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.color_mode = 'RGBA'; sc.render.image_settings.quality = 88
    sc.render.filepath = out or os.path.join(RAIZ, 'modelos', 'merida', 'fichas_ico.webp')
    bpy.ops.render.render(write_still=True); print('->', sc.render.filepath)

if __name__ == '__main__':
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    if a and a[0] == 'exportar': exportar()
    elif a and a[0] == 'iconos': iconos(a[1] if len(a) > 1 else None)
    else:
        png = a[1] if len(a) > 1 else os.path.join(RAIZ, 'blender', 'fichas_vista.png')
        vista(png, a[2].split(',') if len(a) > 2 else ORDEN)
