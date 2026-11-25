# blender/barrio_lib.py — cargador y corredor comunes del barrio (casona_landscape.md; lámina A-02 https://claude.ai/artifact/3gFhpi5TLmU1Kj51oteuWR).
# Cada blender/barrio_<nom>.py hace exec de este archivo, B = cargar('<nom>'), define piezas(B) y VISTAS y llama correr(B, piezas, VISTAS, ...).
# cargar() reusa casona_calle.py (que reusa casona_pb.py) con las mallas renombradas a <nom>_* y la salida en modelos/casona/barrio_<nom>.glb
# + barrio_<nom>_luz.webp; encima carga los ayudantes de blender/barrio_kit.py (casas, árboles, plaza, calle).
# Plano como casona_pb: x 0..36 el lote de la casona (juego x = plano x − 18 = x de A-02), z = y de A-02 (fachada en 0, calle en z<0,
# dentro de la manzana z>0; juego z = 17 − z). Alto: banqueta de la casona en 0, arroyo en −0.35 ya a su altura (el juego no lo mueve).
#   blender -b --factory-startup --python blender/barrio_<nom>.py -- vista [carpeta]      (capturas sin hornear)
#   blender -b --factory-startup --python blender/barrio_<nom>.py -- hornear [res] [muestras] [dia]   (dia: sin la pasada de noche)
#   blender -b --factory-startup --python blender/barrio_<nom>.py -- exportar             (sin luz; para probar medidas en el juego)
#   blender --factory-startup --python blender/barrio_<nom>.py -- ver                     (abre la escena armada, en vivo)
#   después de hornear: node glb_cuantizar.js modelos/casona/barrio_<nom>.glb --sin-uv0=fachada,hierro --sin-luz=hierro
import bpy, math, os, sys, types

def _raiz():
    for d in [os.getcwd()] + ([os.path.dirname(os.path.dirname(os.path.abspath(__file__)))] if '__file__' in globals() else []):
        if os.path.isfile(os.path.join(d, 'blender', 'casona.py')): return d
    raise SystemExit('correr blender.exe desde la carpeta del repo')
DIR = _raiz()

def cargar(nom):
    src = open(os.path.join(DIR, 'blender', 'casona_calle.py'), encoding='utf-8').read()
    src = src.replace("'calle_", "'%s_" % nom).replace("'calle.glb'", "'barrio_%s.glb'" % nom).replace("'casona_calle.blend'", "'barrio_%s.blend'" % nom)
    B = types.ModuleType('barrio_' + nom); B.__file__ = os.path.join(DIR, 'blender', 'casona_calle.py')
    exec(src, B.__dict__)
    B.NOMB = nom; B.P.NOM = 'barrio_' + nom
    exec(open(os.path.join(DIR, 'blender', 'barrio_kit.py'), encoding='utf-8').read(), B.__dict__)
    return B

def otro(nom):
    """Arma otra pieza del barrio solo como contexto (sombras y capturas): ni se hornea ni se exporta."""
    f = os.path.join(DIR, 'blender', 'barrio_%s.py' % nom)
    if not os.path.isfile(f): return
    g = {'__name__': 'ctx', '__file__': f}; exec(open(f, encoding='utf-8').read(), g)
    Bo = g['B']; g['piezas'](Bo); Bo.P.crear(Bo.P.coleccion('ctx_' + nom))
    return Bo

def presupuesto(col, dc, tri):
    ms = [o for o in col.objects if o.type == 'MESH']
    t = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in ms}; n = sum(t.values())
    ok = len(ms) <= dc and n <= tri
    print('presupuesto %s: %d mallas (tope %d), %d triangulos (tope %d) -> %s' % (col.name, len(ms), dc, n, tri, 'PASA' if ok else 'SE PASA'))
    for k in sorted(t, key=t.get, reverse=True): print('  %-28s %6d' % (k, t[k]))
    return ok

def armar(B, piezas, ctx=()):
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    sc = bpy.context.scene; B.P.motor(sc)
    piezas(B)
    col = B.P.coleccion(B.P.NOM); obs = B.P.crear(col); B.color_vertice(); B.color_vertice_mat('horizonte'); B.color_vertice_mat('greca')
    for o in col.objects:      # el pasto con hojas va 1 cm sobre el liso: que no le eche sombra ni oscurezca su orilla
        if o.name.endswith('_pasto'): o.visible_shadow = o.visible_diffuse = o.visible_glossy = False
    B.atardecer(sc); B.contexto(); B.ctx_glb('calle.glb'); B.LUCES_X = []
    for n in ctx:
        Bo = otro(n)
        if Bo: B.LUCES_X += Bo.LUCES_N
    return sc, col, obs

def correr(B, piezas, vistas, ctx=(), res=2048, muestras=300, topes=(20, 60000), ctx_vista=()):
    arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    acc = arg[0] if arg else 'vista'
    sc, col, obs = armar(B, piezas, (tuple(ctx) + (tuple(ctx_vista) if acc in ("vista", "ver") else ())) if acc in ("vista", "hornear", "ver") else ())
    presupuesto(col, *topes)
    if acc == 'vista':
        car = arg[1] if len(arg) > 1 else os.path.join(DIR, 'blender'); os.makedirs(car, exist_ok=True)
        solo = arg[2].split(',') if len(arg) > 2 else None
        for o in bpy.data.objects:
            if o.name.startswith('px_'): o.hide_render = True     # el bulto de la casona alta solo da sombra al hornear
        for n, cam, mira in vistas:
            if not solo or n in solo: B.P.vista(sc, os.path.join(car, n + '.png'), cam, mira)
    elif acc == 'hornear':
        r = int(arg[1]) if len(arg) > 1 else res; mu = int(arg[2]) if len(arg) > 2 else muestras
        if obs:
            B.P.uv_luz(obs); img = B.P.hornear(sc, obs, r, mu); B.P.guardar(img)
            if 'dia' not in arg[3:]:      # noche con la mitad de muestras: <nom>_luz_noche.webp (CMAT la pide de noche)
                B.luces_noche(sc, B.LUCES_X); B.P.hornear_noche(sc, obs, r, max(64, mu // 2))
        B.P.exportar(col); bpy.ops.wm.save_as_mainfile(filepath=os.path.join(DIR, 'blender', B.P.NOM + '.blend'))
    elif acc == 'exportar':
        B.P.exportar(col)
