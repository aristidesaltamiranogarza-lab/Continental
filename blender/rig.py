# Rig del chibi para el juego (three.js). Copia la figura "Frente" (modificadores aplicados a nivel
# de juego) en piezas intercambiables (K['PIEZA']: Base, Pelo_n, Cejas_n, Boca_n, Nariz_n, Arriba_n,
# Abajo_n, Piernas; cejas, boca y nariz 2..3 salen de las figuras Cara_n de cara.py y la ropa 2..3 de Ropa_n
# de ropa.py; el cuerpo de mujer da Arriba_n_M, Abajo_n_M, Piernas_M: la 1 de la figura Mujer, 2..3 de RopaM_n), cada una hija de la armadura "Rig" con sus pesos y materiales por ranura (K['MAT']: av_*,
# el color se cambia en three.js). Pesos automaticos por partes, acciones de
# pose (Reposo, AgarreFrente, ManoCabeza, PistolaSien) y de dedos (Agarre_I / Agarre_D: cuadro 1 =
# relajada, cuadro 10 = agarra; en three.js se usa el tiempo como cantidad de agarre). Las acciones
# de pose no tocan los dedos (salvo ManoCabeza: mano izquierda plana); se combinan con Agarre_x. Empties Sien_I/Sien_D (hijos del hueso
# cabeza, en la superficie del pelo, +Z local = hacia afuera), el revolver de revolver.py en mano_D (Rig_Pistola, solo
# para las revisiones; no se exporta) y el empty Rig_Agarre (hijo de mano_D: ahi va Rev_Agarre de revolver.glb).
# K['REV']: PRM para revolver.py si hay que crearlo.
# Uso: exec(open(r'C:/Users/aris1/code/Continental/blender/rig.py').read(), {'PRM': {...}})
import bpy, bmesh, math, json, struct, os
from mathutils import Vector as V, Matrix, Quaternion
from mathutils.bvhtree import BVHTree

K = dict(
    FUENTE='Frente', X=2.9,
    # mismos valores que brazos.py (si se cambian alla, pasarlos aqui por PRM)
    HOMBRO=(0.20, 0.0, 1.55), L1=0.35, L2=0.33, ABRE=24.0, ESC=1.2,
    MUNECA=(0.058, 0.05, 0.03), PALMA=(0.105, 0.075, 0.06),
    DEDOS=[(0.102, 0.068, 0.035), (0.098, 0.064, 0.032), (0.09, 0.058, 0.026)],
    PULGAR=[(0.05, 0.048, 0.035), (0.046, 0.044, 0.03)],
    CURL0=(22, 24, 16), CURL1=(66, 60, 50), PULG0=(18, 38, 12, 12), PULG1=(-4, 62, 22, 16),
    # nivel de subdivision para el juego (las piezas que no salen aqui no tienen subsurf)
    NIVEL={'Pelo': 0, 'Nariz': 0, 'Manos': 1, 'Brazos': 1, 'Pantalon': 1, 'Playera': 1, 'Short': 1, 'Piernas': 1,
           'Brazos_M': 1, 'Pantalon_M': 1, 'Short_M': 1, 'Piernas_M': 1},   # Playera_M ya viene subdividida
    DECIMA={'Pelo': 0.5},          # reduccion (simetrica en X) antes del grosor, solo en la copia de juego
    DECIMA_FIN={'Brazos': 0.62},   # reduccion despues de la subdivision (mangas: lo mas caro de cada prenda)
    CADERA=0.82, RODILLA=0.45, TOBILLO=0.12, PIERNA_X=0.095, CUELLO=1.62,
    CENTRO=(0.0, 0.0, 2.15), SIEN=(1.0, -0.35, 0.1),
    # PistolaSien: el canon apunta a la sien (alto = grados hacia arriba); el alcance sale de ladear tronco y cabeza
    # PS_PUNTO: donde va la boca (como SIEN; abajo de la oreja), el canon apunta al centro de la cabeza (+- PS_ALTO/PS_FRENTE)
    PS_PUNTO=(1.0, -0.12, -0.45), PS_ALTO=range(-10, 16, 5), PS_FRENTE=range(-20, 21, 10),
    PS_TRONCO=(0,), PS_HOMBRO=(0, 15, 30), PS_CABEZA=(0, -10, -20, -30),
    # piezas del juego: parte de Frente -> objeto (las que no salen van a 'Base'); lo actual es la opcion 1
    ROPA=range(2, 4),                      # figuras Ropa_n de ropa.py: parte -> pieza (Piernas es una sola, sin numero)
    ROPA_PIEZA={'Playera': 'Arriba', 'Brazos': 'Mangas', 'Capucha': 'Arriba', 'Bolsa': 'Arriba', 'Cordones': 'Arriba',
                'Cuello': 'Arriba', 'Botones': 'Arriba', 'Pantalon': 'Abajo', 'Short': 'Abajo', 'Falda': 'Abajo',
                'Piernas': 'Piernas'},
    CARAS=range(2, 4),                     # opciones de cara.py (Cara_n_Cejas/_Boca/_Nariz) -> piezas Cejas_n, Boca_n, Nariz_n
    PEINADOS=range(2, 8), TOL_SIEN=0.01,   # sien mas lejos que esto de la del peinado 1 -> pose nueva          # peinados de pelos.py (Peinado_n_Pelo / _Extra) -> piezas Pelo_n
    PIEZA={'Pelo': 'Pelo_1', 'Cejas': 'Cejas_1', 'Boca': 'Boca_1', 'Nariz': 'Nariz_1',
           'Playera': 'Arriba_1', 'Brazos': 'Mangas_1', 'Pantalon': 'Abajo_1'},   # mangas: pieza propia (Mangas_n), sin version M
    # material de Frente -> material de ranura en el GLB (copias; av_pelo/piel/arriba/abajo cambian de color)
    MAT={'chibi_pelo': 'av_pelo', 'chibi_piel': 'av_piel', 'chibi_playera': 'av_arriba', 'chibi_pantalon': 'av_abajo',
         'chibi_ojo': 'av_ojo', 'chibi_boca': 'av_boca', 'chibi_suela': 'av_suela', 'chibi_zapato': 'av_zapato',
         'chibi_boton': 'av_boton'},
    GLB=r'C:/Users/aris1/code/Continental/blender/chibi_prueba.glb')
K.update(globals().get('PRM', {}))
_e = K['ESC']
for _k in ('MUNECA', 'PALMA'): K[_k] = tuple(x * _e for x in K[_k])
for _k in ('DEDOS', 'PULGAR'): K[_k] = [tuple(x * _e for x in t) for t in K[_k]]
C = V(K['CENTRO'])
LADOS = ((1, '_I'), (-1, '_D'))          # +x = izquierda del personaje (mira hacia -y)

def rot(v, eje, ang): return Matrix.Rotation(math.radians(ang), 3, eje) @ v

def marco(h, t, z):
    y = (t - h).normalized(); z = (z - y * z.dot(y)).normalized(); x = y.cross(z)
    M = Matrix((x, y, z)).transposed().to_4x4(); M.translation = h; return M

# ---------- geometria de brazos.py (mismas cuentas) ----------
def ik(S, Wr, pole):
    L1, L2 = K['L1'], K['L2']; d = Wr - S; dl = min(d.length, (L1 + L2) * 0.999)
    u = d.normalized(); v = (pole - u * pole.dot(u)).normalized()
    a = math.acos(max(-1, min(1, (L1 * L1 + dl * dl - L2 * L2) / (2 * L1 * dl))))
    return S + (u * math.cos(a) + v * math.sin(a)) * L1, S + u * dl

hx, hy, hz = K['HOMBRO']
def reposo(lado):
    S = V((lado * hx, hy, hz)); a = math.radians(K['ABRE'])
    d1 = V((lado * math.sin(a), -0.03, -math.cos(a))).normalized(); E = S + d1 * K['L1']
    d2 = (d1 + V((0, -0.17, 0))).normalized(); Wr = E + d2 * K['L2']
    return S, E, Wr, d2, V((lado, 0, 0))

def cadena(out, nom, p, ff, nn, segs, curls, eje):
    for i, ((w, t, L), c) in enumerate(zip(segs, curls)):
        ff = rot(ff, eje, -c / 2); nn = rot(nn, eje, -c / 2)
        q = p + ff * L; out[nom + str(i + 1)] = (p.copy(), q.copy(), nn.copy()); p = q
        ff = rot(ff, eje, -c / 2); nn = rot(nn, eje, -c / 2)

def mano_frames(W, f, n, lado, g):
    f = f.normalized(); n = (n - f * n.dot(f)).normalized(); s = f.cross(n) * lado
    s_eje = -s if rot(f, s, -10).dot(n) > 0 else s
    mw, mt, ml = K['MUNECA']; pw, pt, pl = K['PALMA']
    o = W - f * ml * 0.6; o1 = o + f * ml; o2 = o1 + f * pl
    out = {'mano': (W.copy(), o2, n)}
    cadena(out, 'dedos', o2, f, n, K['DEDOS'], [a + (b - a) * g for a, b in zip(K['CURL0'], K['CURL1'])], s_eje)
    p0 = [a + (b - a) * g for a, b in zip(K['PULG0'], K['PULG1'])]
    base = o1 + f * 0.02 + s * (pw / 2 - 0.02) - n * 0.01
    d = (f * math.cos(math.radians(p0[0])) + s * math.sin(math.radians(p0[0]))).normalized()
    d = (d * math.cos(math.radians(p0[1])) - n * math.sin(math.radians(p0[1]))).normalized()
    nt = (n - d * n.dot(d)).normalized(); st = d.cross(nt)
    eje = st if rot(d, st, -10).dot(nt) < 0 else -st
    cadena(out, 'pulgar', base, d, nt, K['PULGAR'], p0[2:], eje)
    return out

def brazo_frames(S, E, Wr, z_prev=None):
    b = (E - S).cross(Wr - E)
    b = b.normalized() if b.length > 1e-5 else z_prev
    y1 = (E - S).normalized(); y2 = (Wr - E).normalized()
    return {'brazo': (S, E, b.cross(y1)), 'antebrazo': (E, Wr, b.cross(y2))}

def lado_frames(S, E, Wr, f, n, lado, g, suf):
    fr = brazo_frames(S, E, Wr); fr.update(mano_frames(Wr, f, n, lado, g))
    return {k + suf: v for k, v in fr.items()}

# ---------- limpiar corrida anterior ----------
_v = bpy.data.objects.get('Rig')
_q = ([_v] + list(_v.children_recursive)) if _v else []
_q += [bpy.data.objects.get(nm) for nm in ('Rig_Cuerpo', 'Rig_Pistola', 'Sien_I', 'Sien_D')]
for o in {o.name: o for o in _q if o}.values(): bpy.data.objects.remove(o, do_unlink=True)
for me in [m for m in bpy.data.meshes if m.users == 0 and m.name.startswith('Rig_')]: bpy.data.meshes.remove(me)
for a in [a for a in bpy.data.actions if a.name in ('Reposo', 'AgarreFrente', 'ManoCabeza', 'PistolaSien', 'Agarre_I', 'Agarre_D')
          or a.name.startswith(('PistolaSien_', 'ManoCabeza_'))]: bpy.data.actions.remove(a)
if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
col = bpy.context.scene.collection

# ---------- armadura ----------
if bpy.data.armatures.get('Rig'): bpy.data.armatures.remove(bpy.data.armatures['Rig'])
ad = bpy.data.armatures.new('Rig')
arm = bpy.data.objects.new('Rig', ad); col.objects.link(arm)
arm.location = (K['X'], 0, 0); ad.display_type = 'STICK'; arm.show_in_front = True
huesos = [('raiz', V((0, 0, 0)), V((0, 0, 0.3)), V((0, -1, 0)), None, False),
          ('cadera', V((0, 0, K['CADERA'])), V((0, 0, 1.0)), V((0, -1, 0)), 'raiz', False),
          ('columna', V((0, 0, 1.0)), V((0, 0, 1.45)), V((0, -1, 0)), 'cadera', True),
          ('cabeza', V((0, 0, K['CUELLO'])), V((0, 0, 2.5)), V((0, -1, 0)), 'columna', False)]
REST = {}
for lado, suf in LADOS:
    S, E, Wr, f, n = reposo(lado)
    huesos.append(('hombro' + suf, V((lado * 0.05, 0, 1.5)), S, V((0, -1, 0)), 'columna', False))
    fr = lado_frames(S, E, Wr, f, n, lado, 0.0, suf); REST[suf] = (S, E, Wr, f, n)
    par = {'brazo': ('hombro', True), 'antebrazo': ('brazo', True), 'mano': ('antebrazo', True),
           'dedos1': ('mano', True), 'dedos2': ('dedos1', True), 'dedos3': ('dedos2', True),
           'pulgar1': ('mano', False), 'pulgar2': ('pulgar1', True)}
    for k, (p, c) in par.items():
        h, t, z = fr[k + suf]; huesos.append((k + suf, h, t, z, p + suf, c))
    x = lado * K['PIERNA_X']
    huesos += [('muslo' + suf, V((x, 0, K['CADERA'])), V((x, 0.01, K['RODILLA'])), V((0, -1, 0)), 'cadera', False),
               ('pierna' + suf, V((x, 0.01, K['RODILLA'])), V((x, 0, K['TOBILLO'])), V((0, -1, 0)), 'muslo' + suf, True),
               ('pie' + suf, V((x, 0, K['TOBILLO'])), V((x, -0.17, 0.05)), V((0, 0, 1)), 'pierna' + suf, True)]
bpy.context.view_layer.objects.active = arm
for o in bpy.context.selected_objects: o.select_set(False)
arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for nm, h, t, z, p, c in huesos:
    eb = ad.edit_bones.new(nm); eb.head = h; eb.tail = t; eb.align_roll(z)
for nm, h, t, z, p, c in huesos:
    if p: eb = ad.edit_bones[nm]; eb.parent = ad.edit_bones[p]; eb.use_connect = c
bpy.ops.object.mode_set(mode='OBJECT')
ad.bones['raiz'].use_deform = False
for pb in arm.pose.bones: pb.rotation_mode = 'QUATERNION'

# ---------- copia de la malla a nivel de juego ----------
fuente = bpy.data.objects[K['FUENTE']]; dg = bpy.context.evaluated_depsgraph_get()
AV = {}
for src, nm in K['MAT'].items():
    if bpy.data.materials.get(nm): bpy.data.materials.remove(bpy.data.materials[nm])
    AV[src] = bpy.data.materials[src].copy(); AV[src].name = nm
partes = {}
# (objeto, nombre de parte, clave para NIVEL/DECIMA): las partes de Frente y los peinados de pelos.py
# (objeto, nombre de parte, clave para NIVEL/DECIMA/pesos, pieza)
fuentes = [(o, o.name.split('_', 1)[1], o.name.split('_', 1)[1], K['PIEZA'].get(o.name.split('_', 1)[1], 'Base'))
           for o in fuente.children]
for n in K['PEINADOS']:
    fuentes.append((bpy.data.objects['Peinado_%d_Pelo' % n], 'Pelo_%d' % n, 'Pelo', 'Pelo_%d' % n))
    ox = bpy.data.objects.get('Peinado_%d_Extra' % n)
    if ox: fuentes.append((ox, 'Pelo_%d_extra' % n, 'Extra', 'Pelo_%d' % n))
for n in K['CARAS']:
    for t in ('Cejas', 'Boca', 'Nariz'): fuentes.append((bpy.data.objects['Cara_%d_%s' % (n, t)], '%s_%d' % (t, n), t, '%s_%d' % (t, n)))
for fig, m, ns in (('Ropa_%d', '', K['ROPA']), ('Mujer', '_M', [1]), ('RopaM_%d', '_M', K['ROPA'])):
    for n in ns:
        for o in sorted(bpy.data.objects[fig % n if '%' in fig else fig].children, key=lambda o: o.name):
            t = o.name.rsplit('_', 1)[1]; pz = K['ROPA_PIEZA'].get(t)
            if not pz: continue
            if pz == 'Mangas':     # una pieza por malla de mangas (blusa y cuerpo M usan las de la playera)
                if any(f[0].data == o.data for f in fuentes): continue
                pieza = 'Mangas_%d' % n; fuentes.append((o, 'Brazos_%d' % n, 'Brazos', pieza)); continue
            pieza = pz + m if pz == 'Piernas' else '%s_%d%s' % (pz, n, m)
            if pz == 'Piernas' and any(f[3] == pieza for f in fuentes): continue
            fuentes.append((o, '%s_%d%s' % (t, n, m), t + m, pieza))
PZ = {f[1]: f[3] for f in fuentes}
CL = {f[1]: (f[2][:-2] if f[2].endswith('_M') else f[2]) for f in fuentes}   # clase para pesos (sin _M)
for o, suf, cl, _ in fuentes:
    viejo = {}
    for m in o.modifiers:
        if m.type == 'SUBSURF': viejo[m.name] = m.levels; m.levels = K['NIVEL'].get(cl, 0)
    dec = None
    if K['DECIMA'].get(cl, 1) < 1:
        dec = o.modifiers.new('tmp_decima', 'DECIMATE'); dec.ratio = K['DECIMA'][cl]
        dec.use_symmetry = True; dec.symmetry_axis = 'X'; o.modifiers.move(len(o.modifiers) - 1, 0)
    fin = None
    if K['DECIMA_FIN'].get(cl, 1) < 1:
        fin = o.modifiers.new('tmp_decima_fin', 'DECIMATE'); fin.ratio = K['DECIMA_FIN'][cl]
        fin.use_symmetry = True; fin.symmetry_axis = 'X'
    dg.update(); me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    if dec: o.modifiers.remove(dec)
    if fin: o.modifiers.remove(fin)
    for m in o.modifiers:
        if m.name in viejo: m.levels = viejo[m.name]
    for i, m in enumerate(me.materials):
        if m: me.materials[i] = AV.get(m.name, m)
    me.name = 'Rig_' + suf; ob = bpy.data.objects.new('Rig_' + suf, me); col.objects.link(ob)
    ob.matrix_world = arm.matrix_world.copy(); partes[suf] = ob
dg.update()

def bvh_de(*nombres):
    vs, ps = [], []
    for nm in nombres:
        me = partes[nm].data; b = len(vs)
        vs += [v.co.copy() for v in me.vertices]; ps += [[b + i for i in p.vertices] for p in me.polygons]
    return BVHTree.FromPolygons(vs, ps)
BVH = {1: bvh_de('Pelo', 'Cabeza')}
for n in K['PEINADOS']:
    BVH[n] = bvh_de(*[x for x in ('Pelo_%d' % n, 'Pelo_%d_extra' % n) if x in partes], 'Cabeza')
cabezaBVH = BVH[1]

# ---------- pesos ----------
cabeza_rigida = ('Cabeza', 'Boca', 'Cejas', 'Nariz', 'Ojos', 'Pelo', 'Extra', 'Piel')
columna_rigida = ('Capucha', 'Bolsa', 'Cordones', 'Cuello', 'Botones')
def lista(base): return [b + s for b in base for _, s in LADOS]
auto = {'Playera': ['cadera', 'columna'],
        'Pantalon': ['cadera'] + lista(('muslo', 'pierna')),
        'Brazos': lista(('hombro', 'brazo', 'antebrazo')),
        'Manos': lista(('mano', 'dedos1', 'dedos2', 'dedos3', 'pulgar1', 'pulgar2'))}
for _t in ('Short', 'Falda', 'Piernas'): auto[_t] = auto['Pantalon']
for suf, ob in partes.items():
    if CL[suf] in auto:
        for b in ad.bones: b.use_deform = b.name in auto[CL[suf]]
        for o in bpy.context.selected_objects: o.select_set(False)
        ob.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
        bpy.ops.object.parent_set(type='ARMATURE_AUTO')
        sin = [v for v in ob.data.vertices if sum(g.weight for g in v.groups) < 1e-3]
        if sin: print('sin peso', suf, len(sin))
    else:
        ob.parent = arm; ob.matrix_parent_inverse.identity(); ob.matrix_basis.identity()
        ob.modifiers.new('Armature', 'ARMATURE').object = arm
        if CL[suf] in cabeza_rigida or CL[suf] in columna_rigida:
            ob.vertex_groups.new(name='cabeza' if CL[suf] in cabeza_rigida else 'columna').add(range(len(ob.data.vertices)), 1.0, 'REPLACE')
        else:   # zapatos y suelas: cada pieza suelta al pie de su lado (por dentro cruzan x = 0: por vértice se estiraban al abrir las piernas)
            gI = ob.vertex_groups.new(name='pie_I'); gD = ob.vertex_groups.new(name='pie_D')
            _p = list(range(len(ob.data.vertices)))
            def _r(i):
                while _p[i] != i: _p[i] = _p[_p[i]]; i = _p[i]
                return i
            for e in ob.data.edges: _p[_r(e.vertices[0])] = _r(e.vertices[1])
            _isl = {}
            for v in ob.data.vertices: _isl.setdefault(_r(v.index), []).append(v)
            for vs in _isl.values(): (gI if sum(v.co.x for v in vs) > 0 else gD).add([v.index for v in vs], 1.0, 'REPLACE')
for b in ad.bones: b.use_deform = b.name != 'raiz'
grupos = {}
def pieza_de(suf): return PZ[suf]
for suf, ob in partes.items(): grupos.setdefault(pieza_de(suf), []).append(ob)
piezas = {}
for nm, obs in grupos.items():      # una pieza = un objeto (une las partes que le tocan)
    for o in bpy.context.selected_objects: o.select_set(False)
    for o in obs: o.select_set(True)
    ob = obs[0]; bpy.context.view_layer.objects.active = ob
    if len(obs) > 1: bpy.ops.object.join()
    ob.name = nm; ob.data.name = 'Rig_' + nm
    if ob.name != nm: print('OJO: nombre ocupado', nm, '->', ob.name)
    for m in [m for m in ob.modifiers if m.type == 'ARMATURE'][1:]: ob.modifiers.remove(m)
    ob.matrix_parent_inverse.identity(); ob.matrix_basis.identity()   # mismo marco que la armadura
    piezas[nm] = ob

# seleccion de vertices por peso en todas las piezas: [(objeto, [indices])]; defo() da sus posiciones deformadas
def sel_de(pref, suf):
    out = []
    for nm, ob in piezas.items():
        if nm.endswith('_M'): continue      # las mangas de las piezas M son las mismas que las H (no contar doble)
        gi = {g.index: g.name for g in ob.vertex_groups}
        idx = [v.index for v in ob.data.vertices
               if sum(g.weight for g in v.groups if gi[g.group].startswith(pref) and gi[g.group].endswith(suf)) > 0.5]
        if idx: out.append((ob, idx))
    return out
def defo(sel):
    dg = bpy.context.evaluated_depsgraph_get(); out = []
    for ob, idx in sel:
        e = ob.evaluated_get(dg); ev = e.to_mesh(); out += [ev.vertices[i].co.copy() for i in idx]; e.to_mesh_clear()
    return out

# ---------- poses ----------
bones = ad.bones
def orden():
    out = []
    def rec(b): out.append(b); [rec(c) for c in b.children]
    [rec(b) for b in bones if not b.parent]; return out
ORDEN = orden()
def resolver(targets):
    """targets: {hueso: matriz en espacio de armadura} -> {hueso: cuaternion basis}."""
    pose, q = {}, {}
    for b in ORDEN:
        R = b.matrix_local
        if b.parent:
            Pp, Rp = pose[b.parent.name], b.parent.matrix_local
            if b.name in targets: B = R.inverted() @ Rp @ Pp.inverted() @ targets[b.name]
            else: B = Matrix.Identity(4)
            pose[b.name] = Pp @ Rp.inverted() @ R @ B
        else:
            B = R.inverted() @ targets[b.name] if b.name in targets else Matrix.Identity(4)
            pose[b.name] = R @ B
        q[b.name] = B.to_quaternion()
    return q, pose

def dedos_q(suf, g):
    lado = 1 if suf == '_I' else -1; S, E, Wr, f, n = REST[suf]
    fr = lado_frames(S, E, Wr, f, n, lado, g, suf)
    q, _ = resolver({k: marco(*v) for k, v in fr.items() if k.startswith(('dedos', 'pulgar'))})
    return {k: q[k] for k in fr if k.startswith(('dedos', 'pulgar'))}
AGARRE = {suf: dedos_q(suf, 1.0) for _, suf in LADOS}
PLANA_I = dedos_q('_I', K.get('PLANA', -0.35))     # mano extendida para apoyarla en el pelo
DEDOS = {suf: list(AGARRE[suf]) for _, suf in LADOS}
CUERPO = [b.name for b in bones if not b.name.startswith(('dedos', 'pulgar'))]

def aplicar(q, g=None):
    """q: cuaterniones de cuerpo; g: {suf: agarre 0-1} para dedos."""
    for pb in arm.pose.bones:
        pb.rotation_quaternion = q.get(pb.name, (1, 0, 0, 0))
        pb.location = (0, 0, 0)
    for suf, gg in (g or {}).items():
        for k, qq in AGARRE[suf].items():
            arm.pose.bones[k].rotation_quaternion = Quaternion().slerp(qq, gg)
    bpy.context.view_layer.update()

arm.animation_data_create()
def accion(nombre, cuadros):
    """cuadros: [(cuadro, {hueso: cuaternion})]."""
    a = bpy.data.actions.new(nombre); a.use_fake_user = True; arm.animation_data.action = a
    for fr, q in cuadros:
        for nm, qq in q.items():
            pb = arm.pose.bones[nm]; pb.rotation_quaternion = qq
            pb.keyframe_insert('rotation_quaternion', frame=fr, group=nm)
    arm.animation_data.action = None
    return a

def pose_brazos(por_lado, extra=None):
    t = dict(extra or {})
    for lado, suf in LADOS:
        S, E, Wr, f, n = por_lado.get(suf, REST[suf])
        for k, v in brazo_frames(S, E, Wr).items(): t[k + suf] = marco(*v)
        h, tt, z = mano_frames(Wr, f, n, lado, 0)['mano']; t['mano' + suf] = marco(h, tt, z)
    q, pose = resolver(t)
    return {k: q[k] for k in CUERPO}, pose

def hondo(p, inv=None):
    """Cuanto se mete p bajo la superficie exterior del pelo/cabeza vista desde el centro (0 = fuera).
    Se limita con la distancia a la superficie para no contar los valles entre picos."""
    if inv: p = inv @ p
    d = p - C; L = d.length; h = cabezaBVH.ray_cast(C + d / L * 3, -d / L)[0]
    if h is None or (h - C).length <= L: return 0.0
    return min((h - C).length - L, cabezaBVH.find_nearest(p)[3])
def inside(p, inv=None, margen=0.002): return hondo(p, inv) > margen

# AgarreFrente y ManoCabeza (mismas metas que la copia Pose de brazos.py)
S = V((-hx, hy, hz)); E, Wr = ik(S, V((-0.2, -0.5, 1.2)), V((-1, 0.3, -1)))
qAF, _ = pose_brazos({'_D': (S, E, Wr, V((0, -1, 0.05)), V((-1, 0, 0)))})
S2 = V((hx, hy, hz))
def mano_cabeza(az, el, off):
    """Palma sobre el pelo en la direccion (azimut, elevacion) desde el centro de la cabeza."""
    def toca(az, el):
        a_, e_ = math.radians(az), math.radians(el)
        d = V((math.sin(a_) * math.cos(e_), -math.cos(a_) * math.cos(e_), math.sin(e_)))
        return cabezaBVH.ray_cast(C + d * 3, -d)[0] or C + d * 0.56
    hit = toca(az, el); fC = (toca(az, el + 14) - hit).normalized()    # dedos siguiendo el pelo hacia arriba
    dr = (toca(az - 14, el) - hit).cross(fC).normalized()
    if dr.dot(hit - C) < 0: dr = -dr
    hit = hit + fC * 0.03
    pal = hit + dr * (K['PALMA'][1] / 2 + 0.006 + off)
    Wt = pal - fC * (K['MUNECA'][2] * 0.4 + K['PALMA'][2] * 0.5)
    E2, W2 = ik(S2, Wt, V((1, 0.5, -0.3)))
    return dict(pose_brazos({'_I': (S2, E2, W2, fC, dr)})[0], **PLANA_I), (Wt - S2).length < (K['L1'] + K['L2']) * 0.995

# ---------- revolver (revolver.py) en el marco del hueso mano_D ----------
lado = -1; S, E, Wr, f, n = REST['_D']
Rm = bones['mano_D'].matrix_local; Ri = Rm.inverted()
fr1 = mano_frames(Wr, f, n, lado, 1.0)
pts = [Ri @ fr1[k][0] for k in ('dedos1', 'dedos2', 'dedos3')] + [Ri @ fr1['dedos3'][1]]
pts.append(Ri @ (fr1['dedos1'][0] - fr1['mano'][2] * K['PALMA'][1] / 2))
cg = sum(pts, V()) / len(pts); cg.x = 0                     # centro de la culata
u = V((lado, 0, 0))                                          # lado del pulgar (arriba con la pistola)
if not bpy.data.objects.get('Rev_Agarre'):
    exec(open(os.path.join(os.path.dirname(K['GLB']), 'revolver.py'), encoding='utf-8').read(),
         {'PRM': dict(K.get('REV', {}), EXPORTAR=False)})
bpy.context.view_layer.update()
REV = [bpy.data.objects[nm] for nm in ('Rev_Cuerpo', 'Rev_Cacha', 'Rev_Tambor', 'Rev_Martillo', 'Rev_Gatillo', 'Rev_Puerta', 'Rev_Varilla')]
AgW = bpy.data.objects['Rev_Agarre'].matrix_world.copy()
Gm = Matrix((V((0, 0, -lado)), V((0, 1, 0)), u)).transposed().to_4x4()   # Rev_Agarre (X, Y = canon, Z = arriba) en la mano
def en_mano(dc):                                             # mundo del revolver -> marco de mano_D
    M = Gm.copy(); M.translation = cg + dc; return M @ AgW.inverted()

# palma contra la cacha: el desplazamiento que menos mete la mano cerrada en la cacha, el armazon y el gatillo
aplicar({}, {'_D': 1.0})
iMano = sel_de(('mano', 'dedos', 'pulgar'), '_D'); iBrazo = sel_de(('hombro', 'brazo', 'antebrazo'), '_D')
Pm = arm.pose.bones['mano_D'].matrix.inverted()
MANO_L = [Pm @ p for p in defo(iMano)]
def bvh_de(o):
    W = o.matrix_world
    return BVHTree.FromPolygons([W @ v.co for v in o.data.vertices], [list(p.vertices) for p in o.data.polygons])
CHOQ = [bvh_de(o) for o in (REV[0], REV[1], REV[4])]
def dentro_arma(p):
    for b in CHOQ:
        h = b.find_nearest(p)
        if h[0] is not None and (p - h[0]).dot(h[1]) < -0.0005: return True
    return False
def choques(dc):
    Mi = en_mano(dc).inverted(); return sum(1 for p in MANO_L[::2] if dentro_arma(Mi @ p))
def rejilla(c, paso, n):
    return min((choques(V((du * lado, dy, dz)) / 1000), abs(du) + abs(dy) + abs(dz), (du, dy, dz))
               for du in [c[0] + paso * i for i in range(-n, n + 1)] for dy in [c[1] + paso * i for i in range(-n, n + 1)]
               for dz in [c[2] + paso * i for i in range(-n, n + 1)])
mejor = rejilla((0, 0, 0), 6, 4); mejor = rejilla(mejor[2], 2, 2)
choque_culata = mejor[0]; DC = V((mejor[2][0] * lado, mejor[2][1], mejor[2][2])) / 1000
MG = en_mano(DC)
print('revolver en la mano: desplazamiento mm', mejor[2], 'verts de mano dentro', choque_culata, 'de', len(MANO_L[::2]))

# Rig_Pistola: copia fija del revolver (para las revisiones de choque); el juego cuelga revolver.glb de Rig_Agarre
bm = bmesh.new(); mats = []
for o in REV:
    me = o.data.copy(); me.transform(MG @ o.matrix_world); n0 = len(bm.faces); bm.from_mesh(me)
    idx = []
    for m in me.materials:
        if m not in mats: mats.append(m)
        idx.append(mats.index(m))
    for fc in list(bm.faces)[n0:]: fc.material_index = idx[fc.material_index] if idx else 0
    bpy.data.meshes.remove(me)
mp = bpy.data.meshes.new('Rig_Pistola'); bm.to_mesh(mp); bm.free()
for m in mats: mp.materials.append(m)
pis = bpy.data.objects.new('Rig_Pistola', mp); col.objects.link(pis)
aplicar({}); pis.parent = arm; pis.parent_type = 'BONE'; pis.parent_bone = 'mano_D'
bpy.context.view_layer.update(); pis.matrix_world = arm.matrix_world @ Rm
agr = bpy.data.objects.new('Rig_Agarre', None); col.objects.link(agr)
agr.empty_display_type = 'ARROWS'; agr.empty_display_size = 0.05
agr.parent = arm; agr.parent_type = 'BONE'; agr.parent_bone = 'mano_D'
bpy.context.view_layer.update(); agr.matrix_world = arm.matrix_world @ Rm @ MG @ AgW
BOCA = MG @ bpy.data.objects['Rev_Boca'].matrix_world.translation
PIS_L = [v.co.copy() for v in list(mp.vertices)[::max(1, len(mp.vertices) // 200)]]

# ---------- pistola en la sien ----------
def sien(sx):
    d = V((sx * K['SIEN'][0], K['SIEN'][1], K['SIEN'][2])).normalized()
    return cabezaBVH.ray_cast(C + d * 3, -d)[0], d
def punto_ps():
    d = V((-K['PS_PUNTO'][0], K['PS_PUNTO'][1], K['PS_PUNTO'][2])).normalized()
    return cabezaBVH.ray_cast(C + d * 3, -d)[0], d
def buscar_pistola():
    Sd, nd = sien(-1); Si, ni = sien(1); Pd, npd = punto_ps()
    hc = bones['cabeza'].head_local
    mejor = None; ST = dict(n=0, ok=0); hD = bones['hombro_D']; hcol = bones['columna'].head_local
    for lean, sh, tau in [(l, s_, t_) for l in K['PS_TRONCO'] for s_ in K['PS_HOMBRO'] for t_ in K['PS_CABEZA']]:
        L = Matrix.Translation(hcol) @ Matrix.Rotation(math.radians(-lean), 4, 'Y') @ Matrix.Translation(-hcol)   # tronco ladeado
        H = L @ Matrix.Translation(hD.head_local) @ Matrix.Rotation(math.radians(sh), 4, 'Y') @ Matrix.Translation(-hD.head_local)
        S = H @ V((-hx, hy, hz))                               # hombro encogido (sube el hombro)
        if True:                                               # cabeza ladeada hacia la pistola
            T = L @ Matrix.Translation(hc) @ Matrix.Rotation(math.radians(tau), 4, 'Y') @ Matrix.Translation(-hc); Ti = T.inverted()
            Sw = T @ Pd; nw = (T.to_3x3() @ npd).normalized(); d0 = -nw
            up0 = (V((0, 0, 1)) - d0 * d0.z).normalized(); hz_ = d0.cross(up0)
            for al in K['PS_ALTO']:                            # canon hacia la sien: poco inclinado
                for be in K['PS_FRENTE']:
                    d = rot(rot(d0, hz_, al), up0, be)
                    for fi in range(-60, 61, 15):
                        s = rot((up0 - d * up0.dot(d)).normalized(), d, fi)
                        x = s * lado; R = Matrix((x, d, x.cross(d))).transposed()
                        W = Sw + nw * 0.008 - R @ BOCA
                        ST['n'] += 1
                        if (W - S).length > (K['L1'] + K['L2']) * 0.995: continue
                        for pole in (V((-1, 0, -0.5)), V((-1, -0.6, -0.3)), V((-0.7, 0.5, -0.5))):
                            E, W2 = ik(S, W, pole)
                            if E.x > -0.25: continue
                            dob = math.degrees((W - E).angle(d))
                            pena = dob + abs(tau) * 0.4 + sh * 0.3 + lean * 0.4 + max(0, abs(al) - 10) * 1.5 + abs(be) * 0.2; ST['ok'] += 1
                            if mejor and (mejor[0], mejor[1]) <= (0, pena): continue
                            M = R.to_4x4(); M.translation = W
                            prueba = [M @ p for p in MANO_L[::3] + PIS_L]
                            for a, b in ((S, E), (E, W)):
                                for i in range(1, 9):
                                    p = a.lerp(b, i / 8); prueba.append(p + (C - p).normalized() * 0.065)
                            nin = 0; tope = mejor[0] if mejor else 10 ** 9
                            for p in prueba:
                                nin += inside(p, Ti)
                                if nin > tope: break
                            if mejor and (nin, pena) >= (mejor[0], mejor[1]): continue
                            mejor = (nin, pena, dict(muneca=round(dob), tronco=lean, cabeza=tau, hombro=sh, alto=al, frente=be, giro=fi), S, E, W, d, x.cross(d), T, H, L)
    nin, pena, info, S, E, W, d, nz, T, H, L = mejor
    print('pistola sien:', ST, 'puntos dentro', nin, info)
    cab = T @ bones['cabeza'].matrix_local
    qPS, _ = pose_brazos({'_D': (S, E, W, d, nz)}, {'cabeza': cab, 'hombro_D': H @ hD.matrix_local,
                                                   'columna': L @ bones['columna'].matrix_local})
    return qPS, Sd, nd, Si, ni, T
qPS, Sd, nd, Si, ni, T = buscar_pistola()

# ---------- acciones ----------
ident = {k: Quaternion() for k in CUERPO}
accion('Reposo', [(1, ident)])
accion('AgarreFrente', [(1, qAF)])
accion('PistolaSien', [(1, qPS)])
for _, suf in LADOS:
    accion('Agarre' + suf, [(1, {k: Quaternion() for k in DEDOS[suf]}), (10, AGARRE[suf])])

# ---------- empties de la sien ----------
SIENES = []
def empties(suf_n, Si, ni, Sd, nd):
    for nm, P, nn in (('Sien_I' + suf_n, Si, ni), ('Sien_D' + suf_n, Sd, nd)):
        em = bpy.data.objects.new(nm, None); col.objects.link(em); SIENES.append(em)
        em.empty_display_type = 'SINGLE_ARROW'; em.empty_display_size = 0.08
        aplicar({}); em.parent = arm; em.parent_type = 'BONE'; em.parent_bone = 'cabeza'
        bpy.context.view_layer.update(); em.matrix_world = arm.matrix_world @ marco(P, P + V((0, 0, 1)), nn) @ Matrix.Rotation(-math.pi / 2, 4, 'X')
empties('', Si, ni, Sd, nd)

# ---------- revision con la malla deformada ----------
def penetra(q, g, idx, inv=None):
    aplicar(q, g); return sum(1 for p in defo(idx) if inside(p, inv))
Ti = T.inverted()
print('PistolaSien: verts de mano/brazo dentro del pelo', penetra(qPS, {'_D': 1.0}, iMano + iBrazo, Ti),
      '| pistola', sum(1 for p in [arm.matrix_world.inverted() @ (pis.matrix_world @ v.co) for v in pis.data.vertices] if inside(p, Ti)),
      '| verts de mano dentro de la culata', choque_culata)
iManoI = sel_de(('mano', 'dedos', 'pulgar'), '_I')
def prof(q, g, idx):
    aplicar(q, g); return max(hondo(p) for p in defo(idx))
def buscar_mano():
    MC = None
    for az in (125, 115, 105, 95, 85):          # de atras de la oreja hacia el lado
        for el in (-5, 5, -15, 15):
            lo, hi = 0.0, 0.08                        # biseccion: lo mas pegado al pelo sin meterse
            qMC, llega = mano_cabeza(az, el, hi)
            if not llega or prof(qMC, {}, iManoI) > 0.0015: continue
            for _ in range(6):
                mid = (lo + hi) / 2; q, llega = mano_cabeza(az, el, mid)
                if llega and prof(q, {}, iManoI) < 0.0015: hi = mid
                else: lo = mid
            off = hi; qMC = mano_cabeza(az, el, off)[0]; MC = (az, el, off, qMC)
            if MC: break
        if MC: break
    az, el, off, qMC = MC
    return az, el, off, qMC
az, el, off, qMC = buscar_mano()
accion('ManoCabeza', [(1, qMC)])
print('ManoCabeza: azimut', az, 'elev', el, 'separada', round(off * 1000), 'mm; verts dentro', penetra(qMC, {}, iManoI))

# ---------- peinados 2..n: empties Sien_x_n, PistolaSien_n y ManoCabeza_n con su pelo ----------
def choque_pistola(q, T):
    Ti = T.inverted(); a = penetra(q, {'_D': 1.0}, iMano + iBrazo, Ti)
    return a + sum(1 for p in [arm.matrix_world.inverted() @ (pis.matrix_world @ v.co) for v in pis.data.vertices] if inside(p, Ti))
base = (qPS, Sd, nd, Si, ni, T)
for n in K['PEINADOS']:
    cabezaBVH = BVH[n]
    Sdn, ndn = sien(-1); Sin, nin_ = sien(1)
    if (Sdn - Sd).length < K['TOL_SIEN'] and choque_pistola(qPS, T) == 0: qn, Tn, como = qPS, T, 'la del 1'
    else: qn, Sdn, ndn, Sin, nin_, Tn = buscar_pistola(); como = 'nueva'
    accion('PistolaSien_%d' % n, [(1, qn)]); empties('_%d' % n, Sin, nin_, Sdn, ndn)
    if prof(qMC, {}, iManoI) < 0.0015: mc, como_m = qMC, 'la del 1'
    else: mc, como_m = buscar_mano()[3], 'nueva'
    accion('ManoCabeza_%d' % n, [(1, mc)])
    print('peinado', n, '| PistolaSien', como, 'choques', choque_pistola(qn, Tn), 'sien movida',
          round((Sdn - Sd).length * 1000), 'mm | ManoCabeza', como_m, 'verts dentro', penetra(mc, {}, iManoI))
cabezaBVH = BVH[1]

# comparar contra la copia Pose (geometria hecha a mano): distancia media de la mano/brazo deformados
def compara(q, g, idx, nombre):
    aplicar(q, g); P = defo(idx); dg = bpy.context.evaluated_depsgraph_get()
    ref = bpy.data.objects['Pose_' + nombre]; rm = ref.evaluated_get(dg).to_mesh()
    bv = BVHTree.FromPolygons([v.co.copy() for v in rm.vertices], [list(p.vertices) for p in rm.polygons])
    ds = [bv.find_nearest(p)[3] for p in P]
    ref.evaluated_get(dg).to_mesh_clear()
    return round(sum(ds) / len(ds) * 1000, 1), round(max(ds) * 1000, 1)
print('vs copia Pose (mm medio, max): mano_D', compara(qAF, {'_D': 1.0}, iMano, 'Manos'),
      'brazo_D', compara(qAF, {'_D': 1.0}, iBrazo, 'Brazos'),
      'mano_I', compara(qMC, {}, iManoI, 'Manos'))

# ---------- bailes de Mixamo (emotes.py, con los FBX de blender/emotes; acciones Capoeira, Twerk...) ----------
_em = os.path.join(os.path.dirname(K['GLB']), 'emotes.py')
if os.path.exists(_em): exec(open(_em, encoding='utf-8').read(), {'PRM': {'RIG': arm.name}})

# ---------- exportar GLB ----------
aplicar({})
for o in bpy.context.view_layer.objects: o.select_set(False)
for o in [arm, agr] + SIENES + list(piezas.values()): o.hide_set(False); o.select_set(True)
bpy.context.view_layer.objects.active = arm
loc = arm.location.copy(); arm.location = (0, 0, 0); bpy.context.view_layer.update()
props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
kw = dict(filepath=K['GLB'], export_format='GLB', use_selection=True, use_visible=True, export_animations=True,
          export_animation_mode='ACTIONS', export_yup=True, export_apply=False, export_skins=True,
          use_active_scene=True)   # sin esto se colaba el 'Cube' de otra escena del .blend
bpy.ops.export_scene.gltf(**{k: v for k, v in kw.items() if k in props})
arm.location = loc
with open(K['GLB'], 'rb') as fh:
    fh.read(12); ln, _ = struct.unpack('<II', fh.read(8)); js = json.loads(fh.read(ln))
usados, pila = set(), list(js['scenes'][0]['nodes'])
while pila:
    nd = js['nodes'][pila.pop()]; pila += nd.get('children', [])
    if 'mesh' in nd: usados.add(nd['mesh'])
def tri_m(i): return sum(js['accessors'][p['indices']]['count'] // 3 for p in js['meshes'][i]['primitives'])
tris = sum(tri_m(i) for i in usados)
print('piezas', {n['name']: tri_m(n['mesh']) for n in js['nodes'] if 'mesh' in n},
      'skins', len(js['skins']), 'mats', [m['name'] for m in js['materials']])
print('GLB', K['GLB'], round(os.path.getsize(K['GLB']) / 1024), 'KB', tris, 'tris',
      'huesos', len(js['skins'][0]['joints']), 'anim', [a['name'] for a in js.get('animations', [])])
for nm, o in piezas.items(): o.hide_set(('_' in nm and not nm.endswith('_1')) or nm == 'Piernas')
aplicar(qPS, {'_D': 1.0})
print('rig ok')
