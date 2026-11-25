# Cuerpo de mujer del chibi (mismo esqueleto), complexion petite: la playera de Frente termina en la cadera
# como la del hombre (nada de vestido forzado), con hombros mas angostos, cintura, cadera y busto
# ('playera_m'); piernas con cadera y muslo mas delgado ('pantalon_m'); brazos mas delgados ('brazos_m').
# Deja la figura de muestra 'Mujer' (copia ligada de Frente con esas piezas y el peinado MUJER_PELO).
# Uso: exec(open(r'C:/Users/aris1/code/Continental/blender/cuerpo_m.py').read(), {'PRM': {...}})
import bpy, bmesh, math

K = dict(
    # escala (z, x, y) de la playera: hombros angostos, pecho, cintura (1.12) y cadera abajo (el borde no se mueve)
    # (valores del usuario con el panel, 24 nov 2026: cuerpo_m_panel.py)
    PERFIL=[(1.66, 0.863, 0.92), (1.50, 0.863, 0.90), (1.36, 0.79, 0.88), (1.24, 0.735, 0.84),
            (1.12, 0.66, 0.82), (1.02, 0.80, 0.86), (0.92, 0.92, 0.90)],
    CORTES=[1.45, 1.41, 1.30, 1.25, 1.20, 1.06, 1.00],   # aros extra antes de subdividir
    # busto: dos volumenes suaves unidos por la tela (PUENTE = cuanto sale al centro respecto a los lados)
    BX=0.13, BW=0.055, BZ=1.415, SZ_A=0.12, SZ_B=0.075, A=0.06, PUENTE=0.72, RAD=0.35, LISO=2,
    # pantalon: cadera (escala x arriba), centro de cada pierna y grosor de la pierna (z, escala) alrededor de su centro
    CADERA=1.18, CADERA_Z=(0.62, 0.95), PIERNA_X=0.095,
    # grosor de la pierna en muslo (z 0.85), rodilla (0.47), pantorrilla (0.32) y tobillo (0.16); ABRE adelgaza solo
    # el lado de adentro (espacio entre las piernas, los pies no se mueven); GLUTEO y PANT_ATRAS salen hacia atras
    MUSLO=1.22, RODILLA=0.78, PANTORRILLA=0.71, TOBILLO=0.62, ABRE=0.10, GLUTEO=0.12, PANT_ATRAS=0.16, CADERA_METE=0.12, ENTREPIERNA=0.89, PIERNA_TOPE=0.97,
    PIE=0.8, PIE_X=0.85, # zapatos y suelas mas chicos (x, y; en z un poco menos) alrededor del tobillo
    CORTES_P=[0.7, 0.6, 0.5, 0.42, 0.34, 0.26, 0.18],
    # brazos: grosor (alrededor de su eje) y cuanto entra el hombro (el hombro de la playera es mas angosto)
    BRAZO=0.805, HOMBRO_DX=0.03, MANO=0.9,   # manos mas chicas alrededor de la muneca
    X=-2.9, MUJER_PELO='pelo_5', MUJER_EXTRA=None)
K.update(globals().get('PRM', {}))

def suave(t): t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)

def interp(z):
    P = K['PERFIL']
    if z >= P[0][0]: return P[0][1:]
    if z <= P[-1][0]: return P[-1][1:]
    for (z0, *a), (z1, *b) in zip(P, P[1:]):
        if z1 <= z <= z0:
            t = suave((z0 - z) / (z0 - z1))
            return [a[i] + (b[i] - a[i]) * t for i in range(2)]

def copia(src, nombre):
    me = bpy.data.meshes.get(nombre)
    if me: me.name = nombre + '_viejo'
    me = src.copy(); me.name = nombre; return me

# ---------- torso ----------
fp = bpy.data.meshes.get('playera_orig') or bpy.data.objects['Frente_Playera'].data   # sin la cintura de cintura.py
pm = copia(fp, 'playera_m_base')
bm = bmesh.new(); bm.from_mesh(pm)
for zc in K['CORTES']:
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, zc), plane_no=(0, 0, 1))
bm.to_mesh(pm); bm.free()
for v in pm.vertices:
    sx, sy = interp(v.co.z); v.co.x *= sx; v.co.y *= sy
tmp = bpy.data.objects.new('tmp_playera_m', pm); bpy.context.scene.collection.objects.link(tmp)
tmp.modifiers.new('s', 'SUBSURF').levels = 1
dg = bpy.context.evaluated_depsgraph_get(); sub = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
bpy.data.objects.remove(tmp, do_unlink=True); bpy.data.meshes.remove(pm)
if bpy.data.meshes.get('playera_m'): bpy.data.meshes['playera_m'].name = 'playera_m_viejo'
sub.name = 'playera_m'; pm = sub
for v in pm.vertices:
    x, y, z = v.co; r = math.hypot(x, y)
    if y >= 0 or r < 1e-6: continue
    dz = z - K['BZ']; sz = K['SZ_A'] if dz > 0 else K['SZ_B']
    ax = abs(x); fx = math.exp(-(max(0.0, ax - K['BX']) / K['BW']) ** 2)
    if ax < K['BX']: fx *= K['PUENTE'] + (1 - K['PUENTE']) * suave(ax / K['BX'])
    d = K['A'] * math.exp(-(dz / sz) ** 2) * fx * min(1.0, -y / r * 1.4)
    # sobre todo hacia adelante, algo radial para que no se forme un escalon a los lados
    v.co.x += d * K['RAD'] * x / r; v.co.y -= d * ((1 - K['RAD']) + K['RAD'] * -y / r)
bm = bmesh.new(); bm.from_mesh(pm)          # alisar el frente del pecho (sin crestas de los aros)
zona = [v for v in bm.verts if v.co.y < 0 and 1.15 < v.co.z < 1.52]
for _ in range(K['LISO']): bmesh.ops.smooth_vert(bm, verts=zona, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
bm.to_mesh(pm); bm.free()

# ---------- piernas ----------
nm_ = copia(bpy.data.objects['Frente_Pantalon'].data, 'pantalon_m')
bm = bmesh.new(); bm.from_mesh(nm_)
for zc in K['CORTES_P']:
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, zc), plane_no=(0, 0, 1))
bm.to_mesh(nm_); bm.free()
PIERNA = [(1.05, 1.0), (0.85, K['MUSLO']), (0.65, (K['MUSLO'] + K['RODILLA']) / 2 + 0.02), (0.47, K['RODILLA']),
          (0.32, K['PANTORRILLA']), (0.16, K['TOBILLO']), (0.0, K['TOBILLO'])]
def grosor(z):
    P = PIERNA
    if z >= P[0][0]: return P[0][1]
    for (z0, a), (z1, b) in zip(P, P[1:]):
        if z1 <= z <= z0: return a + (b - a) * suave((z0 - z) / (z0 - z1))
    return P[-1][1]
z0, z1 = K['CADERA_Z']; cx = K['PIERNA_X']
# el pantalon son 3 piezas sueltas: cadera (z 0.8-1.03) y dos piernas (suben hasta 0.88, dentro de la cadera)
par = list(range(len(nm_.vertices)))
def raiz(i):
    while par[i] != i: par[i] = par[par[i]]; i = par[i]
    return i
for e in nm_.edges: par[raiz(e.vertices[0])] = raiz(e.vertices[1])
alto = {}
for v in nm_.vertices: r = raiz(v.index); alto[r] = max(alto.get(r, -9), v.co.z)
r_cad = max(alto, key=alto.get)
for v in nm_.vertices:
    z = v.co.z; t = suave((z - z0) / (z1 - z0))
    if raiz(v.index) == r_cad:
        # cadera: solo se ensancha; abajo se mete dentro de los muslos (si no, se ve un escalon como panal)
        v.co.x *= (1 + (K['CADERA'] - 1) * t) * (1 - K['CADERA_METE'] * suave((0.9 - z) / 0.1))
        v.co.y *= 1 - K['CADERA_METE'] * 0.5 * suave((0.9 - z) / 0.1)
        if z < 0.95: v.co.z = 0.95 - (0.95 - z) * (0.95 - K['ENTREPIERNA']) / (0.95 - 0.796)   # sube bajo la playera
    else:
        s = grosor(z); ax = abs(v.co.x)
        if ax < cx: s *= 1 - K['ABRE'] * (1 - suave((z - 0.6) / 0.25))       # lado de adentro
        v.co.x = math.copysign(cx + (ax - cx) * s, v.co.x); v.co.y *= grosor(z)
        v.co.x *= 1 + (K['CADERA'] - 1) * t * 0.6
        if z > 0.7: v.co.z = 0.7 + (z - 0.7) * (K['PIERNA_TOPE'] - 0.7) / 0.18   # el borde de arriba entra bajo la playera
    if v.co.y > 0:
        v.co.y *= 1 + K['GLUTEO'] * math.exp(-((z - 0.9) / 0.1) ** 2) + K['PANT_ATRAS'] * math.exp(-((z - 0.3) / 0.08) ** 2)
# lo que queda arriba del borde de la playera no debe salirse de ella (el gluteo se asomaba atras)
borde = min(v.co.z for v in pm.vertices); tabla = {}
for v in pm.vertices:
    k = (round(v.co.z / 0.02), round(math.degrees(math.atan2(v.co.y, v.co.x)) / 6) % 60)
    tabla[k] = max(tabla.get(k, 0), math.hypot(v.co.x, v.co.y))
for v in nm_.vertices:
    if v.co.z < borde - 0.01: continue
    r = math.hypot(v.co.x, v.co.y); a = math.degrees(math.atan2(v.co.y, v.co.x))
    zk = round(max(v.co.z, borde + 0.005) / 0.02); ak = round(a / 6) % 60
    lim = min([tabla[(z_, a_ % 60)] for z_ in (zk, zk + 1) for a_ in (ak - 1, ak, ak + 1) if (z_, a_ % 60) in tabla] or [9]) - 0.012
    if r > lim > 0: v.co.x *= lim / r; v.co.y *= lim / r

# ---------- zapatos ----------
pies = {}
for parte, nombre in (('Zapatos', 'zapatos_m'), ('Suelas', 'suelas_m')):
    me = copia(bpy.data.objects['Frente_' + parte].data, nombre); f = K['PIE']; fz = 1 - (1 - f) * 0.6
    # los zapatos base van unidos al centro: cada pie se rehace con su mitad de afuera reflejada en su centro
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(cx, 0, 0), plane_no=(1, 0, 0), clear_inner=True)
    for v in bm.verts: v.co.x -= cx
    bmesh.ops.mirror(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], axis='X', merge_dist=0.0005)
    for v in bm.verts:   # escalar el pie solo (antes de reflejarlo al otro lado, para que no se jale al centro)
        v.co.x = cx + v.co.x * f * K['PIE_X']; v.co.y *= f; v.co.z *= fz
    bmesh.ops.mirror(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], axis='X', merge_dist=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(me); bm.free()
    pies[parte] = me

# ---------- brazos ----------
fb = bpy.data.objects['Frente_Brazos'].data
bz = copia(fb, 'brazos_m')
P = [v.co.copy() for v in fb.vertices]
for i, v in enumerate(bz.vertices):
    p = P[i]
    vec = [q for q in P if (q - p).length < 0.085 and q.x * p.x > 0]
    c = sum(vec, p * 0) / len(vec)
    q = c + (p - c) * K['BRAZO']
    q.x -= math.copysign(K['HOMBRO_DX'] * suave((p.z - 1.15) / 0.4), p.x)
    v.co = q

# ---------- manos ----------
mn = copia(bpy.data.objects['Frente_Manos'].data, 'manos_m')
for lado in (1, -1):
    vs = [v for v in mn.vertices if v.co.x * lado > 0]
    if not vs: continue
    zt = max(v.co.z for v in vs); top = [v.co for v in vs if v.co.z > zt - 0.02]
    c = sum(top, top[0] * 0) / len(top)          # muneca: centro de lo de arriba
    for v in vs: v.co = c + (v.co - c) * K['MANO']
pies['Manos'] = mn

col = bpy.data.collections.get('Peinados') or bpy.context.scene.collection
E = bpy.data.objects.get('Mujer')
if not E: E = bpy.data.objects.new('Mujer', None); col.objects.link(E)
E.location = (K['X'], 0, 0)
cambia = {'Playera': pm, 'Pantalon': nm_, 'Brazos': bz, 'Pelo': bpy.data.meshes[K['MUJER_PELO']], **pies}
for o in bpy.data.objects['Frente'].children:
    suf = o.name.split('_', 1)[1]; nm = 'Mujer_' + suf
    c = bpy.data.objects.get(nm)
    if not c:
        c = o.copy(); c.name = nm; col.objects.link(c)
        c.parent = E; c.matrix_parent_inverse = o.matrix_parent_inverse.copy()
    c.data = cambia.get(suf, o.data)
    if suf == 'Playera':
        for m in c.modifiers:
            if m.type == 'SUBSURF': m.levels = 1; m.render_levels = 1   # la malla ya viene subdividida una vez
    if suf == 'Pelo':
        for m in list(c.modifiers): c.modifiers.remove(m)
        so = c.modifiers.new('Grosor', 'SOLIDIFY'); so.thickness = 0.035; so.offset = -1; so.use_even_offset = True
        ss = c.modifiers.new('Suave', 'SUBSURF'); ss.levels = 1; ss.render_levels = 2
for me in [m for m in bpy.data.meshes if m.name.endswith('_viejo') and m.users == 0]: bpy.data.meshes.remove(me)
print('cuerpo_m ok', len(pm.vertices), 'verts playera; borde', round(min(v.co.z for v in pm.vertices), 3))
