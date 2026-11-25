# Pasa animaciones del Universal Animation Library (Quaternius, CC0; blender/anim_src, no se sube) al Rig del chibi
# y exporta modelos/personaje/anim.glb: solo huesos y acciones (c_avatar.js toma de ahí las de K['CLIPS']).
# Cada hueso copia el giro del suyo en el mundo, medido desde su reposo; los de brazos y piernas primero se alinean a la
# dirección de reposo del original (el chibi está en A abierta 24°, el maniquí no). La cadera sube y baja a la escala de la pierna.
# Uso (escena Chibi abierta): exec(open(r'C:/Users/aris1/code/Continental/blender/anim_retarget.py').read(), {'PRM': {...}})
import bpy, os
import math
from mathutils import Matrix, Vector, Quaternion

K = dict(
    SRC=r'C:/Users/aris1/code/Continental/blender/anim_src/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb',
    CLIPS={'Quieto': 'Idle_Loop', 'Camina': 'Walk_Loop'},   # nombre en el juego -> acción del paquete
    RIG='Rig', GLB=r'C:/Users/aris1/code/Continental/modelos/personaje/anim.glb', EXPORTA=True,
    # cuánto del giro del original se queda (el chibi tiene la cabeza grande: inclinarla se ve como mirar al piso)
    PESO={'columna': .5, 'cabeza': .35},
    ABRE=10.0,   # grados que se abren los brazos (hacia afuera) para que las manos no crucen la panza
    VER=None)   # nombre de una acción nueva para dejarla puesta en el Rig (revisar con look); None = deja lo que había
K.update(globals().get('PRM', {}))

MAPA = {'cadera': 'pelvis', 'columna': 'spine_03', 'cabeza': 'Head'}
for t, s in (('I', 'l'), ('D', 'r')):
    MAPA.update({'hombro_' + t: 'clavicle_' + s, 'brazo_' + t: 'upperarm_' + s, 'antebrazo_' + t: 'lowerarm_' + s,
                 'mano_' + t: 'hand_' + s, 'muslo_' + t: 'thigh_' + s, 'pierna_' + t: 'calf_' + s, 'pie_' + t: 'foot_' + s})
ALINEA = ('hombro', 'brazo', 'antebrazo', 'mano', 'muslo', 'pierna', 'pie')

rig = bpy.data.objects[K['RIG']]
antes = (set(bpy.data.objects), set(bpy.data.actions), set(bpy.data.meshes), set(bpy.data.armatures), set(bpy.data.materials))
bpy.ops.import_scene.gltf(filepath=K['SRC'])
nuevos = [o for o in bpy.data.objects if o not in antes[0]]
src = next(o for o in nuevos if o.type == 'ARMATURE')
acts = {a.name: a for a in bpy.data.actions if a not in antes[1]}
SB, TB = src.data.bones, rig.data.bones

# el paquete puede mirar a otro lado: G lleva su mundo al del chibi (los dos de pie sobre Z)
def frente(arm, pie):
    b = arm.data.bones[pie]; d = arm.matrix_world.to_3x3() @ (b.tail_local - b.head_local); d.z = 0; return d.normalized()
fs, ft = frente(src, 'foot_l'), frente(rig, 'pie_I')
G = fs.rotation_difference(ft).to_matrix()
lado = (G @ (src.matrix_world @ SB['thigh_l'].head_local)).x - (G @ (src.matrix_world @ SB['thigh_r'].head_local)).x
if lado * ((rig.matrix_world @ TB['muslo_I'].head_local).x - (rig.matrix_world @ TB['muslo_D'].head_local).x) < 0:
    MAPA = {t: (s[:-1] + ('r' if s.endswith('l') else 'l') if s[-2:] in ('_l', '_r') else s) for t, s in MAPA.items()}
Gi = G.inverted()
escala = (rig.matrix_world @ TB['muslo_I'].head_local).z / (src.matrix_world @ SB['thigh_l'].head_local).z

def rest_w(arm, b): return arm.matrix_world @ b.matrix_local
orden = [b for b in TB]   # bones vienen padre antes que hijo
A = {}
for t, s in MAPA.items():
    if t.startswith(ALINEA):
        dt = (rig.matrix_world.to_3x3() @ (TB[t].tail_local - TB[t].head_local)).normalized()
        ds = (G @ src.matrix_world.to_3x3() @ (SB[s].tail_local - SB[s].head_local)).normalized()
        A[t] = dt.rotation_difference(ds).to_matrix()
    else: A[t] = Matrix.Identity(3)

def hornea(nombre, accion):
    src.animation_data.action = accion
    f0, f1 = (int(round(x)) for x in accion.frame_range)
    act = bpy.data.actions.new(nombre); act.use_fake_user = True
    rig.animation_data_create(); rig.animation_data.action = act
    if hasattr(act, 'slots') and rig.animation_data.action_slot is None and len(act.slots): rig.animation_data.action_slot = act.slots[0]
    Mi = rig.matrix_world.inverted(); sc = bpy.context.scene; pie = []
    for f in range(f0, f1 + 1):
        sc.frame_set(f); M = {}
        for b in orden:
            pb = rig.pose.bones[b.name]; R = b.matrix_local
            Mp = M[b.parent.name] if b.parent else Matrix.Identity(4)
            Rp = b.parent.matrix_local if b.parent else Matrix.Identity(4)
            hereda = Mp @ Rp.inverted() @ R          # pose sin giro propio (sigue al padre)
            s = MAPA.get(b.name)
            if s is None: M[b.name] = hereda; continue
            Sr, Sp = rest_w(src, SB[s]), src.matrix_world @ src.pose.bones[s].matrix
            D = G @ (Sp.to_3x3() @ Sr.to_3x3().inverted()) @ Gi
            if b.name in K['PESO']: D = Quaternion().slerp(D.to_quaternion(), K['PESO'][b.name]).to_matrix()
            if b.name.startswith('brazo_'):
                lx = 1 if b.name.endswith('_I') else -1   # +x = izquierda del chibi
                D = Matrix.Rotation(math.radians(K['ABRE']) * lx, 3, (rig.matrix_world.to_3x3() @ Vector((0, -1, 0))).normalized()) @ D
            rot = (Mi.to_3x3() @ D @ A[b.name] @ (rig.matrix_world @ R).to_3x3()).normalized()
            loc = hereda.translation
            if b.name == 'cadera':
                loc = R.translation + Mi.to_3x3() @ (G @ (Sp.translation - Sr.translation)) * escala
            M[b.name] = Matrix.LocRotScale(loc, rot.to_quaternion(), Vector((1, 1, 1)))
            basis = (Mp @ Rp.inverted() @ R).inverted() @ M[b.name]
            pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = basis.to_quaternion()
            pb.keyframe_insert('rotation_quaternion', frame=f - f0 + 1)
            if b.name == 'cadera': pb.location = basis.translation; pb.keyframe_insert('location', frame=f - f0 + 1)
        pie.append((rig.matrix_world @ M['pie_I']).translation.y)
    for pb in rig.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
    paso = 2 * (max(pie) - min(pie))   # el pie apoyado recorre su paso hacia atrás una vez por ciclo
    print('%s <- %s: %d cuadros, %.2f s, avance por ciclo %.2f (chibi) / %.2f (juego)' % (
        nombre, accion.name, f1 - f0 + 1, (f1 - f0) / bpy.context.scene.render.fps, paso, paso * .8))
    return act

previa = rig.animation_data.action if rig.animation_data else None
hechas = {}
for n, s in K['CLIPS'].items():
    if n in bpy.data.actions: bpy.data.actions.remove(bpy.data.actions[n])
    hechas[n] = hornea(n, acts[s])

# quitar lo importado
for o in nuevos: bpy.data.objects.remove(o, do_unlink=True)
for col, viejo in ((bpy.data.actions, antes[1]), (bpy.data.meshes, antes[2]), (bpy.data.armatures, antes[3]), (bpy.data.materials, antes[4])):
    for x in [x for x in col if x not in viejo and x not in hechas.values()]: col.remove(x)

if K['EXPORTA']:
    sel = [o for o in bpy.context.selected_objects]; act0 = bpy.context.view_layer.objects.active
    for o in sel: o.select_set(False)
    rig.select_set(True); bpy.context.view_layer.objects.active = rig
    rig.animation_data.action = None
    pistas = []   # solo las acciones nuevas: cada una en su pista NLA (el modo ACTIONS exportaria todas las poses)
    for n, a in hechas.items():
        tr = rig.animation_data.nla_tracks.new(); tr.name = n; st = tr.strips.new(n, 1, a); pistas.append(tr)
    kw = dict(filepath=K['GLB'], export_format='GLB', use_selection=True, export_animations=True,
              export_animation_mode='NLA_TRACKS', export_force_sampling=True, export_optimize_animation_size=True,
              export_def_bones=False, export_skins=True, export_morph=False, export_materials='NONE',
              export_extras=False, export_cameras=False, export_lights=False)
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    bpy.ops.export_scene.gltf(**{k: v for k, v in kw.items() if k in props})
    for tr in pistas: rig.animation_data.nla_tracks.remove(tr)
    rig.select_set(False)
    for o in sel: o.select_set(True)
    bpy.context.view_layer.objects.active = act0
    print('exportado', K['GLB'], '%.0f KB' % (os.path.getsize(K['GLB']) / 1024))

rig.animation_data.action = hechas.get(K['VER']) or previa
if K['VER'] and hechas.get(K['VER']):
    a = hechas[K['VER']]; bpy.context.scene.frame_start, bpy.context.scene.frame_end = 1, int(a.frame_range[1])
