# blender/silla_confidente.py — prepara la silla confidente (MeridaChairs.blend, descargado) para el barrio:
# la gira con los dos pies sobre x, centrada, asiento a 0.6 (medida fija de los asientos de descanso), la reduce y la guarda en props/silla_confidente.obj.
#   blender -b <ruta>/MeridaChairs.blend --python blender/silla_confidente.py -- [proporción=0.12] [png]
# barrio_kit.banca_conf la lee (solo v/f, sin texturas: color por vértice como todo el barrio).
import bpy, bmesh, math, sys, os
from mathutils import Vector, Matrix

ARG = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
RAT = float(ARG[0]) if ARG else .12
SALIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'props', 'silla_confidente.obj')
ASIENTO = .6

o = next(x for x in bpy.data.objects if x.type == 'MESH')
bm = bmesh.new(); bm.from_mesh(o.data)
lo = [v.co.copy() for v in bm.verts if v.co.z < .05]
a, b = lo[0], max(lo, key=lambda p: (p - lo[0]).length)
for _ in range(12):
    A = [p for p in lo if (p - a).length < (p - b).length]; Bq = [p for p in lo if (p - a).length >= (p - b).length]
    a = sum(A, Vector()) / len(A); b = sum(Bq, Vector()) / len(Bq)
c = (a + b) / 2; d = b - a
zs = sorted(f.calc_center_median().z for f in bm.faces if f.normal.z > .9 and f.calc_center_median().z < 4)
s = ASIENTO / zs[-1]                      # cara de arriba más alta del cojín = asiento
M = Matrix.Scale(s, 4) @ Matrix.Rotation(-math.atan2(d.y, d.x), 4, 'Z') @ Matrix.Translation(-Vector((c.x, c.y, 0)))
bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=.004)
me = bpy.data.meshes.new('silla'); bm.to_mesh(me); bm.free()
ob = bpy.data.objects.new('silla', me); bpy.context.scene.collection.objects.link(ob)
for x in list(bpy.data.objects):
    if x is not ob and x.type == 'MESH': bpy.data.objects.remove(x)
md = ob.modifiers.new('dec', 'DECIMATE'); md.ratio = RAT; md.use_collapse_triangulate = True
dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg); m2 = ev.to_mesh()
vs = [v.co for v in m2.vertices]
print('silla: %d triangulos, %.2f x %.2f x %.2f' % (len(m2.polygons), *(max(v[i] for v in vs) - min(v[i] for v in vs) for i in range(3))))
os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
with open(SALIDA, 'w') as f:
    f.write('# silla confidente, plano Blender: x largo, y fondo, z alto; asiento a %.2f\n' % ASIENTO)
    for v in vs: f.write('v %.4f %.4f %.4f\n' % tuple(v))
    for p in m2.polygons: f.write('f ' + ' '.join(str(i + 1) for i in p.vertices) + '\n')
if 'png' in ARG:
    ob.modifiers.clear(); me.clear_geometry(); me.from_pydata([tuple(v) for v in vs], [], [tuple(p.vertices) for p in m2.polygons])
    sc = bpy.context.scene; sc.render.engine = 'BLENDER_WORKBENCH'; sc.render.resolution_x, sc.render.resolution_y = 900, 600
    sc.display.shading.light = 'STUDIO'; [setattr(p, 'use_smooth', True) for p in me.polygons]
    cam = bpy.data.objects.get('Camera') or bpy.data.objects.new('Camera', bpy.data.cameras.new('c'))
    if cam.name not in sc.objects: sc.collection.objects.link(cam)
    cam.location = (2.6, -3.4, 1.9); cam.rotation_euler = (math.radians(70), 0, math.radians(37)); sc.camera = cam
    sc.render.filepath = os.path.join(os.path.dirname(SALIDA), 'silla_confidente.png'); bpy.ops.render.render(write_still=True)
