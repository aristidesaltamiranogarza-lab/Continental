# blender/ver.py — Ventana de Blender que arma un nivel de la casona y se rearma sola al guardar cualquier blender/casona*.py.
# Sirve para ver los cambios en vivo sin hornear (vista Material con las luces de la escena).
#   blender --factory-startup --python blender/ver.py -- pb      (pb, pa, sm, az o calle); agrega esc (escalera) o perg (pérgola) para verla de cerca
import bpy, os, sys, glob, math, time, traceback
from mathutils import Vector, Euler

DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) if '__file__' in globals() else os.getcwd()
arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
NIV = arg[0] if arg else 'pb'
VISTA = dict(calle=((-10, -27, 2), 60, 62), pb=((0, 3, 2), 45, 50))   # (centro en Blender, distancia, inclinación)
if 'esc' in arg[1:]: VISTA[NIV] = ((-14.5, -3.5, 0), 16, 58)   # -- pb esc: de cerca a la escalera
if 'perg' in arg[1:]: VISTA[NIV] = ((-10, -12, 0), 22, 55)    # -- az perg: de cerca a la pérgola
est = dict(t=None, primera=True)

def vista_3d():
    c, d, inc = VISTA.get(NIV, ((0, 0, 0), 50, 55))
    for w in bpy.context.window_manager.windows:
        for a in w.screen.areas:
            if a.type != 'VIEW_3D': continue
            s = a.spaces.active; s.shading.type = 'MATERIAL'; s.shading.use_scene_world = s.shading.use_scene_lights = True
            r = s.region_3d; r.view_location = Vector(c); r.view_distance = d
            r.view_rotation = Euler((math.radians(inc), 0, 0)).to_quaternion()

def revisar():
    t = max(os.path.getmtime(f) for f in glob.glob(os.path.join(DIR, 'blender', 'casona*.py')))
    if t != est['t']:
        est['t'] = t
        try:
            ruta = os.path.join(DIR, 'blender', 'casona_%s.py' % NIV)
            g = dict(__name__='recarga', __file__=ruta); exec(open(ruta, encoding='utf-8').read(), g); g['armar']()
            hz = bpy.data.collections.get('horneado')
            for o in (hz.objects if hz else []): o.hide_viewport = o.type == 'MESH'
            bpy.data.orphans_purge(do_recursive=True)
            if est['primera']: vista_3d(); est['primera'] = False
            print('rearmado', NIV, time.strftime('%H:%M:%S'), flush=True)
        except Exception: traceback.print_exc()
    return 1.0

bpy.app.timers.register(revisar, first_interval=.5, persistent=True)
