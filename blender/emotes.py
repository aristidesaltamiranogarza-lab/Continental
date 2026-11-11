# Bailes de Mixamo (blender/emotes/*.fbx, bajados "Without Skin") pasados a acciones de la armadura "Rig" del chibi.
# Lo corre rig.py antes de exportar. Solo: exec(open(r'C:/Users/aris1/code/Continental/blender/emotes.py').read(), {'PRM': {...}})
# (después hay que volver a exportar con rig.py). Acción = última palabra del archivo sin "(1)": "Dancing Twerk (1).fbx" -> Twerk.
# Retarget por orientación en el mundo: cada hueso del Rig gira lo mismo que su hueso de Mixamo desde la pose T de Mixamo.
# Brazos, piernas y pies se llevan antes a la dirección de reposo del hueso de Mixamo (el Rig en pose T); cadera, columna y
# cabeza se toman derechas. La cadera se mueve escalada al largo de pierna, sin el recorrido (se le quita el promedio móvil).
# Se guarda el clip completo (K['MAX_S'] > 0 lo recorta) y se cierra en bucle: los últimos K['LAZO_S'] segundos se funden con el
# principio, así que al volver a empezar no brinca. Los FBX de Mixamo no se suben al repo.
import bpy, os, re, glob
from mathutils import Matrix, Quaternion, Vector

K = dict(DIR='C:/Users/aris1/code/Continental/blender/emotes', RIG='Rig', MAX_S=0, LAZO_S=0.75, VENTANA_S=1.5, CABEZA=0.6, CAB_R=0.56)   # CAB_R: radio de la cabeza; CABEZA: cuánto del giro del cuello pasa (la cabeza del chibi es enorme)
K.update(globals().get('PRM', {}))
MAPA = {'cadera': 'Hips', 'columna': 'Spine2', 'cabeza': 'Head'}
for suf, L in (('_I', 'Left'), ('_D', 'Right')):
    MAPA.update({'hombro' + suf: L + 'Shoulder', 'brazo' + suf: L + 'Arm', 'antebrazo' + suf: L + 'ForeArm',
                 'mano' + suf: L + 'Hand', 'muslo' + suf: L + 'UpLeg', 'pierna' + suf: L + 'Leg', 'pie' + suf: L + 'Foot'})
DERECHOS = ('cadera', 'columna', 'cabeza')
Y = Vector((0, 1, 0))

def q3(m): return m.to_3x3().normalized().to_quaternion()
def fcurvas(a): return [f for L in a.layers for s in L.strips for cb in s.channelbags for f in cb.fcurves]
def nombre(p): return re.sub(r'\s*\(\d+\)$', '', os.path.splitext(os.path.basename(p))[0]).split()[-1].capitalize()

arm = bpy.data.objects[K['RIG']]
FPS0 = (K.get('FPS', 24), 1.0) if 'FPS' in K else (bpy.context.scene.render.fps, bpy.context.scene.render.fps_base)
fps = FPS0[0] / FPS0[1]
RB = {b.name: b for b in arm.data.bones}
R0 = {n: q3(b.matrix_local) for n, b in RB.items()}   # reposo del Rig (la armadura no está girada: espacio de armadura = mundo)
ORDEN = []
def _rec(b): ORDEN.append(b.name); [_rec(c) for c in b.children]
for b in arm.data.bones:
    if not b.parent: _rec(b)
PIERNA = RB['muslo_I'].head_local.z - RB['pie_I'].head_local.z

class Fuente:
    """Pose del esqueleto de Mixamo calculada desde sus curvas (sin frame_set de toda la escena)."""
    def __init__(s, o):
        s.mw = o.matrix_world.copy(); s.B = {b.name: b for b in o.data.bones}; s.fc = {}
        for f in fcurvas(o.animation_data.action):
            m = re.match(r'pose\.bones\["(.+)"\]\.(\w+)', f.data_path)
            if m: s.fc.setdefault(m[1], {}).setdefault(m[2], {})[f.array_index] = f
        s.rel = {n: b.parent.matrix_local.inverted() @ b.matrix_local if b.parent else b.matrix_local.copy() for n, b in s.B.items()}
    def basis(s, n, t):
        c = s.fc.get(n, {})
        g = lambda k, i, d: c[k][i].evaluate(t) if i in c.get(k, {}) else d
        return Matrix.LocRotScale(Vector([g('location', i, 0) for i in range(3)]),
                                  Quaternion([g('rotation_quaternion', i, float(i == 0)) for i in range(4)]).normalized(),
                                  Vector([g('scale', i, 1) for i in range(3)]))
    def pose(s, t):
        P = {}
        def pm(n):
            if n not in P:
                b = s.B[n]; P[n] = (pm(b.parent.name) if b.parent else Matrix()) @ s.rel[n] @ s.basis(n, t)
            return P[n]
        return lambda n: s.mw @ pm(n)

def retarget(path):
    nom = nombre(path); antes = set(bpy.data.objects); acts = set(bpy.data.actions); R = bpy.context.scene.render
    bpy.ops.import_scene.fbx(filepath=path, use_anim=True, automatic_bone_orientation=False, ignore_leaf_bones=True)
    fsrc = R.fps / R.fps_base; R.fps, R.fps_base = FPS0   # el importador pone la escena a los cuadros por segundo del FBX
    nuevos = [o for o in bpy.data.objects if o not in antes]; nacts = [a for a in bpy.data.actions if a not in acts]
    try:
        src = next(o for o in nuevos if o.type == 'ARMATURE'); F = Fuente(src)
        pref = next(n[:-4] for n in F.B if n.endswith('Hips'))
        sn = {d: pref + m for d, m in MAPA.items() if pref + m in F.B}
        S0 = {d: q3(F.mw @ F.B[m].matrix_local) for d, m in sn.items()}
        T0 = {d: R0[d] if d in DERECHOS else (R0[d] @ Y).rotation_difference(S0[d] @ Y) @ R0[d] for d in sn}
        w0 = lambda d: F.mw @ F.B[sn[d]].head_local
        esc = PIERNA / (w0('muslo_I').z - w0('pie_I').z); h0 = w0('cadera')
        f0, f1 = src.animation_data.action.frame_range
        n = int((f1 - f0) * fps / fsrc if not K['MAX_S'] else min((f1 - f0) * fps / fsrc, K['MAX_S'] * fps)) + 1
        G, D = [], []
        for i in range(n):
            pw = F.pose(f0 + i * fsrc / fps)
            g = {d: q3(pw(m)) @ S0[d].inverted() for d, m in sn.items()}   # giro en el mundo desde la pose T
            if K['CABEZA'] != 1: g['cabeza'] = g['columna'].slerp(g['cabeza'], K['CABEZA'])
            G.append(g); D.append((pw(sn['cadera']).translation - h0) * esc)
        r = max(1, int(K['VENTANA_S'] * fps / 2))   # sin recorrido: a lo horizontal se le quita su promedio móvil
        H = []
        for i in range(n):
            v = D[max(0, i - r):i + r + 1]; m = sum(v, Vector()) / len(v)
            H.append(Vector((D[i].x - m.x, D[i].y - m.y, D[i].z)))
        QQ, BAJO = [], []
        for i in range(n):
            Q, P = {}, {}
            for b in ORDEN:
                p = RB[b].parent; Qp = Q[p.name] if p else Quaternion(); Rp = R0[p.name] if p else Quaternion()
                Q[b] = G[i][b] @ T0[b] if b in sn else Qp @ Rp.inverted() @ R0[b]
                P[b] = (P[p.name] + Qp @ Rp.inverted() @ (RB[b].head_local - p.head_local)) if p else RB[b].head_local.copy()
                if b == 'cadera': P[b] += H[i]
            cola = lambda b, t=1.0: P[b] + Q[b] @ R0[b].inverted() @ ((RB[b].tail_local - RB[b].head_local) * t)
            pts = [cola('cabeza', K['CAB_R'] / RB['cabeza'].length).z - K['CAB_R']]   # la cabeza como esfera
            for s in ('_I', '_D'): pts += [cola('mano' + s).z, P['pie' + s].z - 0.1, cola('pie' + s).z - 0.05]
            QQ.append(Q); BAJO.append(max(0.0, -min(pts)))
        # si algo queda bajo el piso (la cabeza en los paros de manos), sube todo el cuerpo; suavizado para que no brinque
        r2 = max(1, int(0.25 * fps))
        M = [max(BAJO[max(0, i - r2):i + r2 + 1]) for i in range(n)]
        SUBE = [sum(M[max(0, i - r2):i + r2 + 1]) / len(M[max(0, i - r2):i + r2 + 1]) for i in range(n)]
        BAS, LOC = [], []
        for i in range(n):
            Q = QQ[i]; bs = {}
            for b in ORDEN:
                if b not in sn: continue
                p = RB[b].parent; Qp = Q[p.name] if p else Quaternion(); Rp = R0[p.name] if p else Quaternion()
                bs[b] = R0[b].inverted() @ Rp @ Qp.inverted() @ Q[b]
            BAS.append(bs); LOC.append(R0['cadera'].inverted() @ (H[i] + Vector((0, 0, SUBE[i]))))
        # bucle: el clip va del cuadro L al último, y sus últimos L cuadros se funden con los cuadros 1..L; el último queda igual
        # al cuadro L (el primero), así que al dar la vuelta sigue el movimiento sin brinco
        L = min(int(K['LAZO_S'] * fps), (n - 2) // 3)
        if L > 0:
            for k in range(L):
                i, t = n - L + k, k + 1; w = (k + 1) / L; w = w * w * (3 - 2 * w)
                for b, q in BAS[i].items():
                    q2 = BAS[t][b].copy()
                    if q.dot(q2) < 0: q2.negate()
                    BAS[i][b] = q.slerp(q2, w)
                LOC[i] = LOC[i].lerp(LOC[t], w)
            BAS, LOC = BAS[L:], LOC[L:]; n = len(BAS)
        cur, ult = {}, {}
        for i in range(n):
            for b, bas in BAS[i].items():
                if b in ult and bas.dot(ult[b]) < 0: bas.negate()   # sin saltos de signo entre cuadros
                ult[b] = bas
                for j in range(4): cur.setdefault(('pose.bones["%s"].rotation_quaternion' % b, j, b), []).append(bas[j])
            for j in range(3): cur.setdefault(('pose.bones["cadera"].location', j, 'cadera'), []).append(LOC[i][j])
        print('  sube hasta', round(max(SUBE), 2), 'm en', sum(1 for x in SUBE if x > 0.01), 'cuadros; bucle de', L, 'cuadros')
        a = bpy.data.actions.new(nom); a.use_fake_user = True; a['emote'] = os.path.basename(path)
        arm.animation_data_create(); prev = arm.animation_data.action; arm.animation_data.action = a
        for (dp, j, gr), vals in cur.items():
            fc = a.fcurve_ensure_for_datablock(arm, dp, index=j, group_name=gr)
            fc.keyframe_points.add(n); fc.keyframe_points.foreach_set('co', [x for i, v in enumerate(vals) for x in (1 + i, v)])
            for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
            fc.update()
        arm.animation_data.action = prev
        print('emote', nom, n, 'cuadros', round((n - 1) / fps, 2), 's, escala', round(esc, 3), 'huesos', len(sn))
        return a
    finally:
        datos = [o.data for o in nuevos if o.data]
        for o in nuevos: bpy.data.objects.remove(o, do_unlink=True)
        for d in datos:
            if d.users == 0 and isinstance(d, bpy.types.Armature): bpy.data.armatures.remove(d)
        for x in nacts: bpy.data.actions.remove(x)

for x in [x for x in bpy.data.actions if x.get('emote')]: bpy.data.actions.remove(x)
EMOTES = [retarget(p) for p in sorted(glob.glob(os.path.join(K['DIR'], '*.fbx')))]
