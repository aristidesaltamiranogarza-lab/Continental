# blender/casona_calle.py — Tramo de referencia de la Calle 59 (casona_landscape.md, paso 1 del paisaje) con luz de atardecer.
# Usa blender/casona_pb.py como biblioteca; los nombres salen con prefijo calle_. Exporta modelos/casona/calle.glb y calle_luz.webp.
# Plano como casona_pb (lote x 0..36, fachada en z=0); la calle va en z negativo: banqueta 0..-1.6, arroyo -1.6..-11.6,
# banqueta de enfrente -11.6..-15.6, casas de enfrente -15.6..-27.6. Tramo x -25..40 (juego -43..22). La fachada de la casona
# y su banqueta ya están en pb.glb: aquí no van (se importa pb.glb solo para sombras y vistas).
# Fachadas, marcos, puertas, macetas, poste y bugambilia van en UNA malla con color por vértice (material 'fachada', atributo Col):
# en el juego el material necesita vertexColors. Rejas y cables en 'hierro'; el laurel en tronco y *_copa (CMAT y PASTO.viento).
#   blender -b --factory-startup --python blender/casona_calle.py -- vista [carpeta]
#   blender -b --factory-startup --python blender/casona_calle.py -- hornear [res] [muestras]
#   después: node glb_cuantizar.js modelos/casona/calle.glb --sin-uv0=fachada,hierro --sin-luz=hierro   (1.5 MB -> ~300 KB)
#   en vivo: blender --factory-startup --python blender/ver.py -- calle
import bpy, bmesh, math, os, sys, types, random
from mathutils import Vector, Matrix

def _raiz():
    for d in ([os.path.dirname(os.path.dirname(os.path.abspath(__file__)))] if '__file__' in globals() else []) + [os.getcwd()]:
        if os.path.isfile(os.path.join(d, 'blender', 'casona.py')): return d
    raise SystemExit('correr blender.exe desde la carpeta del repo')
DIR = _raiz()
src = open(os.path.join(DIR, 'blender', 'casona_pb.py'), encoding='utf-8').read()
src = src.replace("'pb_", "'calle_").replace("'pb.glb'", "'calle.glb'").replace("'casona_pb.blend'", "'casona_calle.blend'")
P = types.ModuleType('casona_pb_lib'); P.__file__ = os.path.join(DIR, 'blender', 'casona_pb.py'); exec(src, P.__dict__)
K, V, bmn, quad = P.K, P.V, P.bmn, P.quad
K.update(RES=1024, SAMPLES=300)
P.NOM = 'calle'
def lin(h):
    return tuple(((v + .055) / 1.055) ** 2.4 if v > .04045 else v / 12.92 for v in (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)))
P.COLOR.update(fachada=(1, 1, 1), hierro=(.07, .06, .06), copa=lin('#3d5939'), tronco=lin('#6b4f3a'))
P.MUROS = P.MUROS + ('fachada',)
P.PRIO_MAT.update(fachada=1.3)
XA, XB = -25, 40
PAL = {k: lin(v) for k, v in dict(amarillo='#efc675', anil='#93b6cb', verde='#9cc5b0', cal='#f2e9d9', ocre='#d9a066', rosa='#e9b7a4',
       terra='#c98e7e', crema='#ede7d7', madera='#7a4a2e', vidrio='#4b4f5e', poste='#6a625d', barro='#c98f6f', hoja='#4f7a43',
       mag='#c2387a', agave='#6f9a7a').items()}
def osc(c, f): return tuple(v * f for v in c)

# ---------- piezas convexas con caras hacia afuera y color por vértice ----------
def pieza(bm, col, fn, *a, suave=False, **kv):
    n0 = len(bm.faces); fn(bm, *a, **kv); bm.faces.ensure_lookup_table()
    fs = bm.faces[n0:]; vs = {v for f in fs for v in f.verts}
    c = sum((v.co for v in vs), Vector()) / len(vs)
    cl = None
    if col:
        cl = bm.loops.layers.float_color.get('Col') or bm.loops.layers.float_color.new('Col')
    for f in fs:
        f.normal_update()
        if f.normal.dot(f.calc_center_median() - c) < 0: f.normal_flip()
        f.smooth = suave
        if cl:
            for lp in f.loops: lp[cl] = (*col, 1)

def caja_o(bm, x0, x1, y0, y1, z0, z1, omit=()):
    vs = [bm.verts.new(V(x, y, z)) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]
    for i, f in enumerate(P.CARAS):
        if i not in omit: bm.faces.new([vs[j] for j in f])

def ico(bm, x, y, z, r, sub=1, sy=1.0):
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r, matrix=Matrix.Translation(V(x, y, z)) @ Matrix.Diagonal((1, 1, sy, 1)))

# fachada en z=ZF; DZ: hacia dónde queda la calle (-1 lado de la casona, +1 enfrente); d: salida desde el muro hacia la calle
ZF, DZ = 0.0, -1
def cf(bm, xa, xb, ya, yb, d0, d1, back=False):
    za, zb = ZF + DZ * d0, ZF + DZ * d1; z0, z1 = min(za, zb), max(za, zb)
    om = ([2] if ya <= .001 else []) + ([5 if DZ < 0 else 4] if back or d0 == 0 else [])   # sin la cara pegada al muro
    caja_o(bm, xa, xb, ya, yb, z0, z1, om)

def ex_obs(n, x, z, r): P.ex(n, obs=P.T(x, z) + [r])   # choque redondo (MARC lo lee como los de pb)
def FA(): return bmn('calle_fachadas', 'fachada', recalc=False)
def HI(): return bmn('calle_herreria', 'hierro', recalc=False, luz=False)   # CMAT pinta el hierro sin luz horneada

def casa(x0, x1, H, col, zf, dz, huecos, fondo=12):
    global ZF, DZ
    ZF, DZ = zf, dz; fa, hi, cal = FA(), HI(), PAL['cal']
    pieza(fa, col, cf, x0, x1, 0, H, -fondo, 0)          # cerrada atrás: se ve desde los patios de barrio_manzana.py
    pieza(fa, osc(col, .8), cf, x0, x1, H - .3, H, 0, .02)          # pretil, un tono abajo
    pieza(fa, cal, cf, x0, x1, H - .44, H - .3, 0, .12)              # cornisa
    pieza(fa, cal, cf, x0, x1, H - 1.0, H - .92, 0, .05)             # moldura
    x = x0
    for a, b in sorted((u - .91, u + .91) for k, u in huecos if k == 'p'):   # zoclo sin pasar por las puertas
        if a > x: pieza(fa, osc(col, .68), cf, x, a, 0, .55, 0, .04)
        x = b
    if x < x1: pieza(fa, osc(col, .68), cf, x, x1, 0, .55, 0, .04)
    for k, u in huecos:
        if k == 'v':
            w, y0, y1 = 1.3, 1.05, 3.25; a, b = u - w / 2, u + w / 2
            pieza(fa, PAL['vidrio'], cf, a, b, y0, y1, -.06, .01, back=True)
            for xa, xb in ((a - .14, a), (b, b + .14)): pieza(fa, cal, cf, xa, xb, y0, y1, 0, .06)
            pieza(fa, cal, cf, a - .2, b + .2, y1, y1 + .24, 0, .08)
            pieza(fa, cal, cf, a - .2, b + .2, y0 - .14, y0, 0, .12)
            for i in range(5):
                xx = a + .12 + i * (w - .24) / 4; pieza(hi, None, cf, xx - .018, xx + .018, y0, y1, .1, .13, back=True)
            for yy in (y0 + .2, y1 - .2): pieza(hi, None, cf, a, b, yy - .018, yy + .018, .1, .13, back=True)
        else:
            w, y1 = 1.5, 2.95; a, b = u - w / 2, u + w / 2
            pieza(fa, PAL['madera'], cf, a, b, 0, y1, -.08, .02, back=True)
            pieza(fa, osc(PAL['madera'], .55), cf, u - .02, u + .02, 0, y1, .02, .035)
            for xa, xb in ((a - .16, a), (b, b + .16)): pieza(fa, cal, cf, xa, xb, 0, y1, 0, .07)
            pieza(fa, cal, cf, a - .16, b + .16, y1, y1 + .28, 0, .09)

# ---------- suelo: lo que no trae pb.glb (su banqueta y 1.4 de arroyo frente al lote) ----------
PASTA = ((-12, -4), (15, 24))   # banqueta de pasta frente a la casa ocre y la terracota de enfrente
def suelo():
    for a, b in ((XA, 0), (36, XB)):
        quad('calle_banqueta', 'banqueta', a, -1.6, b, 0, prio=.5); quad('calle_arroyo', 'calle', a, -11.6, b, -1.6, prio=.35)
    quad('calle_arroyo', 'calle', 0, -11.6, 36, -3, prio=.35)
    for i in range(10):                     # paso de cebra del zaguán a la entrada del parque (x 17.5..21.5; paso 3): franjas paralelas a la calle; a la altura del arroyo (el juego baja calle_arroyo .35, no las franjas)
        z = -2.1 - i * .93; pieza(FA(), lin('#ece6d8'), caja_o, 16.9, 22.1, -.35, -.338, z - .5, z, (2,))
    cortes = [XA]
    for a, b in PASTA: cortes += [a, b]
    cortes.append(XB)
    for i in range(len(cortes) - 1):        # banqueta de enfrente con guarnición (0.15)
        a, b = cortes[i], cortes[i + 1]; pas = i % 2 == 1
        bm = bmn('calle_pasta', 'pasta', recalc=False, prio=.5) if pas else bmn('calle_banqueta', 'banqueta', recalc=False, prio=.5)
        om = [2, 4] + ([0] if a != XA else []) + ([1] if b != XB else [])
        pieza(bm, None, caja_o, a, b, 0, .15, -15.6, -11.6, om)

def vecinas():   # lado de la casona, contiguas, más bajas que ella; de la casona hacia afuera: 8, 10 y 7 (A-02)
    casa(-8, 0, 5.8, PAL['amarillo'], 0, -1, [('v', -6.3), ('p', -3.6), ('v', -1.7)])
    casa(-18, -8, 6.2, PAL['anil'], 0, -1, [('v', -16.4), ('p', -14.2), ('v', -11.6), ('v', -9.4)])
    casa(-25, -18, 5.6, PAL['verde'], 0, -1, [('p', -22.9), ('v', -20.1)])

ENF = [(10, 'crema', 5.9), (8, 'ocre', 6.3), (12, 'anil', 6.8), (7, 'amarillo', 5.6), (9, 'terra', 6.1), (8, 'verde', 6.5), (8, 'rosa', 5.8)]
def enfrente():
    x = -22
    for i, (w, c, H) in enumerate(ENF):
        x0, x1, m = x, x + w, x + w / 2
        if c == 'terra': x = x1; continue   # P2: aquí entra el parque (barrio_parque.py), frente al zaguán
        if w >= 11: hu = [('v', x0 + 1.8), ('v', x0 + 4.2), ('p', m + 1.4), ('v', x1 - 1.8)]
        elif w >= 8: hu = [('v', x0 + 1.7), ('p', m + (.4 if i % 2 else -.4)), ('v', x1 - 1.7)]
        else: hu = [('p', x0 + 2.1), ('v', x1 - 2.1)]
        casa(x0, x1, H, PAL[c], -15.6, 1, hu); x = x1
    if XA < -22: casa(XA, -22, 6.0, PAL['rosa'], -15.6, 1, [('v', -23.5)])

# sin llamar (26 nov): árbol viejo inclinado con base blanca, quitado a pedido del usuario
def laurel(cx=-12, cz=-1.3):
    """Laurel de la India: tronco encalado abajo, copa de grupos de hojas cargada hacia la calle (alto ~12, ancho ~12).
    Ramas y copa baja lejos de la fachada (z<0); la copa alta pasa por encima del pretil."""
    TR, CP, fa = bmn('calle_laurel_tronco', 'tronco', recalc=False), bmn('calle_laurel_copa', 'copa', recalc=False, prio=.6), FA()
    ox, oz = cx, cz - 3.0; top = (cx + .1, 5.4, cz - .8)
    ex_obs('calle_laurel_tronco', cx, cz, .75)
    pieza(TR, None, P.tubo, (cx, 0, cz), top, .55, .42, 10)
    pieza(fa, PAL['cal'], P.tubo, (cx, 0, cz), (cx + .02, 1.4, cz - .02), .585, .565, 10)
    blobs = [(0, 0, 10.3, 3.0)] + [(math.cos(a) * 3.4, math.sin(a) * 3.4, 8.7 + .4 * (k % 2), 2.6)
                                   for k, a in enumerate(i * 2 * math.pi / 7 + .3 for i in range(7))]
    blobs += [(math.cos(a) * 1.9, math.sin(a) * 1.9, 11.1, 2.0) for a in (i * 2 * math.pi / 4 + .9 for i in range(4))]
    for dx, dz, y, r in blobs:
        if y < 10: pieza(TR, None, P.tubo, top, (ox + dx * .7, y - .9, oz + dz * .7), .16, .07, 6)
        pieza(CP, None, ico, ox + dx, y, oz + dz, r, 3, .62, suave=True)

def postes():
    fa, hi = FA(), HI(); PX, Y = (-18, 12), 7.9
    for px in PX:
        ex_obs('calle_fachadas', px, -1.3, .35)
        pieza(fa, PAL['poste'], P.tubo, (px, 0, -1.3), (px, 8.4, -1.3), .17, .12, 8)
        pieza(hi, None, caja_o, px - .06, px + .06, Y - .15, Y, -2.2, -.4)
        pieza(fa, PAL['poste'], caja_o, px - .04, px + .04, 6.9, 6.98, -2.9, -1.3)    # brazo del farol hacia la calle
        pieza(fa, PAL['cal'], caja_o, px - .16, px + .16, 6.75, 6.9, -3.2, -2.7)
    xs = [XA] + list(PX) + [XB]
    for zc in (-2.0, -.6):
        for a, b in zip(xs, xs[1:]):
            n, sag = 8, .012 * (b - a)
            pts = [(a + (b - a) * t / n, Y - sag * 4 * (t / n) * (1 - t / n), zc) for t in range(n + 1)]
            for p, q in zip(pts, pts[1:]): pieza(hi, None, P.viga, p, q, .02)

def maceta(x, z, y0=0.0, tipo='mata'):
    fa = FA(); pieza(fa, PAL['barro'], P.tubo, (x, y0, z), (x, y0 + .5, z), .2, .3, 10)
    if tipo == 'mata':
        for dx, dz, dy, r in ((0, 0, .95, .34), (.18, -.08, .78, .28), (-.17, .06, .8, .27)): pieza(fa, PAL['hoja'], ico, x + dx, y0 + dy, z + dz, r, 1, .85)
    else:
        for i in range(7):
            a = i * 2 * math.pi / 7; l = .75 + .15 * (i % 2)
            pieza(fa, PAL['agave'], P.viga, (x, y0 + .45, z), (x + math.cos(a) * .45, y0 + .45 + l, z + math.sin(a) * .45), .06, .02)

def macetas():
    maceta(-4.75, -.38); maceta(-2.45, -.38, tipo='agave')       # puerta de la vecina amarilla
    maceta(8.95, -15.22, .15, 'agave'); maceta(11.25, -15.22, .15)  # puerta de la amarilla de enfrente

def bugambilia():
    """Sobre el pretil de la vecina amarilla, junto a la casona: hojas y mucho magenta que cuelga hacia la banqueta."""
    fa, R = FA(), random.Random(59)
    for i in range(9): pieza(fa, PAL['hoja'], ico, R.uniform(-2.3, -.4), R.uniform(5.5, 6.2), R.uniform(-.4, 1.2), R.uniform(.28, .4), 2, .8)
    for i in range(30):
        y = 6.35 - (R.random() ** 1.8) * 2.4
        pieza(fa, PAL['mag'], ico, R.uniform(-2.4, -.35), y, R.uniform(-.45, -.15) if y < 5.7 else R.uniform(-.5, 1.0), R.uniform(.14, .27), 2, .85)

# ---------- luz, contexto y presupuesto ----------
def atardecer(sc):
    S = P.coleccion('horneado')
    bm = bmesh.new(); P.caja(bm, 0, 36, 5.5, 11.4, 0, 30)    # casona alta de bulto (pb.glb trae solo la planta baja): su sombra
    me = bpy.data.meshes.new('px_casona'); bm.to_mesh(me); bm.free(); me.materials.append(P.mat('mesa'))
    o = bpy.data.objects.new('px_casona', me); o.visible_camera = False; S.objects.link(o)
    sol = bpy.data.lights.new('sol', 'SUN'); sol.energy = 2.6; sol.color = (1, .8, .56); sol.angle = math.radians(5)
    so = bpy.data.objects.new('sol', sol); S.objects.link(so)
    d = Vector(P.C.SOL).normalized()            # CIELO.dia en three: del poniente (-X), bajo (casona.py SOL)
    so.rotation_euler = Vector((d.x, -d.z, d.y)).to_track_quat('-Z', 'Y').to_euler()
    w = sc.world or bpy.data.worlds.new('cielo'); sc.world = w
    try: w.use_nodes = True
    except Exception: pass
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs[0].default_value = (.42, .36, .62, 1); bg.inputs[1].default_value = .45

def color_vertice():
    m = bpy.data.materials.get('fachada')
    if not m: return
    nt = m.node_tree; b = next(x for x in nt.nodes if x.type == 'BSDF_PRINCIPLED')
    vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'; nt.links.new(vc.outputs['Color'], b.inputs['Base Color'])

def contexto():
    f = os.path.join(P.SAL, 'pb.glb')
    if not os.path.isfile(f): print('sin pb.glb: vistas y sombras sin la planta baja'); return
    antes = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=f)
    col = P.coleccion('ctx')
    for o in set(bpy.data.objects) - antes:
        for c in list(o.users_collection): c.objects.unlink(o)
        col.objects.link(o)

def presupuesto(col):
    ms = [o for o in col.objects if o.type == 'MESH']
    tri = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in ms)
    print('presupuesto: %d mallas (draw calls, tope 20), %d triangulos (tope 40000)' % (len(ms), tri))
    for o in ms: print('  %-24s %6d' % (o.name, sum(len(p.vertices) - 2 for p in o.data.polygons)))

def armar():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    sc = bpy.context.scene; P.motor(sc)
    suelo(); vecinas(); enfrente(); postes(); macetas(); bugambilia()
    col = P.coleccion('calle'); obs = P.crear(col); color_vertice()
    atardecer(sc); contexto(); presupuesto(col)
    return sc, col, obs

def vistas(sc, carpeta):
    P.vista(sc, os.path.join(carpeta, 'calle_vecinas.png'), (-1, 2.4, -14.5), (-9, 4.2, 0))
    P.vista(sc, os.path.join(carpeta, 'calle_enfrente.png'), (16, 2.4, -1.2), (8, 3.6, -16))
    P.vista(sc, os.path.join(carpeta, 'calle_todo.png'), (9, 20, 4), (9, 0, -14))

if __name__ == '__main__':
    arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    acc = arg[0] if arg else 'vista'
    sc, col, obs = armar()
    if acc == 'vista':
        vistas(sc, arg[1] if len(arg) > 1 else os.path.join(DIR, 'blender'))
    elif acc == 'uvs':        # R4: solo desenvuelve y diagnostica (sin hornear)
        exec(open(os.path.join(DIR, 'blender', 'luz_diag.py'), encoding='utf-8').read(), P.__dict__); P.uv_luz(obs); P.densidad(obs, P.K['RES'])
    elif acc == 'hornear':
        res = int(arg[1]) if len(arg) > 1 else K['RES']; mu = int(arg[2]) if len(arg) > 2 else K['SAMPLES']
        P.uv_luz(obs); img = P.hornear(sc, obs, res, mu); P.guardar(img); P.exportar(col)
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(DIR, 'blender', 'casona_calle.blend'))
    elif acc == 'exportar':
        P.exportar(col)
