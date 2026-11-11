# Brazos (manga) y manos de miton del chibi. Hombro alto, codo suave, mano con pulgar y
# bloque de dedos en 3 segmentos que se doblan (AGARRE 0 = relajada, 1 = agarra la pistola).
# Uso en Blender: exec(open(r'C:/Users/aris1/code/Continental/blender/brazos.py').read(), {'PRM': {...}})
import bpy, bmesh, math
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

K = dict(
    HOMBRO=(0.20, 0.0, 1.55), L1=0.35, L2=0.33, R_HOMBRO=0.072, R_MUNECA=0.056, PUNO=0.062,
    ABRE=24.0,                       # brazos abiertos en reposo (grados)
    MUNECA=(0.058, 0.05, 0.03),      # ancho, grueso, largo
    PALMA=(0.105, 0.075, 0.06),
    DEDOS=[(0.102, 0.068, 0.035), (0.098, 0.064, 0.032), (0.09, 0.058, 0.026)],
    PULGAR=[(0.05, 0.048, 0.035), (0.046, 0.044, 0.03)],
    CURL0=(22, 24, 16), CURL1=(66, 60, 50),          # dedos relajados / agarrando (deja hueco para la culata)
    PULG0=(18, 38, 12, 12), PULG1=(-4, 62, 22, 16),  # abre, baja, doblez 1, doblez 2
    COPIAS=['Frente', 'Perfil', 'Pose'])
K.update(globals().get('PRM', {}))
_e = K.get('ESC', 1.2)                       # tamano de la mano (manos grandes se leen mejor en juego)
for _k in ('MUNECA', 'PALMA'): K[_k] = tuple(x * _e for x in K[_k])
for _k in ('DEDOS', 'PULGAR'): K[_k] = [tuple(x * _e for x in t) for t in K[_k]]
V = Vector

def rot(v, eje, ang):
    return Matrix.Rotation(math.radians(ang), 3, eje) @ v

def tubo(bm, frames, sizes, seg=10, tapa0=True, tapa1=True):
    """frames: [(origen, s, n)], sizes: [(ancho, grueso)]. Anillos elipticos unidos, tapas en domo."""
    def anillo(o, s, n, w, t):
        return [bm.verts.new(o + s * (w / 2) * math.cos(2 * math.pi * i / seg) + n * (t / 2) * math.sin(2 * math.pi * i / seg)) for i in range(seg)]
    rings = [anillo(o, s, n, *wt) for (o, s, n), wt in zip(frames, sizes)]
    def domo(k, k2):
        (o, s, n), (w, t) = frames[k], sizes[k]
        f = (o - frames[k2][0]).normalized(); r = min(w, t) / 2
        mid = anillo(o + f * r * 0.55, s, n, w * 0.78, t * 0.78)
        c = bm.verts.new(o + f * r * 0.85)
        a = rings[k]
        for i in range(seg):
            j = (i + 1) % seg
            bm.faces.new((a[i], a[j], mid[j], mid[i]) if k else (a[j], a[i], mid[i], mid[j]))
            bm.faces.new((mid[i], mid[j], c) if k else (mid[j], mid[i], c))
    for a, b in zip(rings, rings[1:]):
        for i in range(seg):
            j = (i + 1) % seg
            bm.faces.new((a[i], a[j], b[j], b[i]))
    if tapa0: domo(0, 1)
    if tapa1: domo(len(rings) - 1, len(rings) - 2)

def cadena(o, f, n, s, segs, curls, eje_curl=None):
    """Avanza un marco (f adelante, n dorso, s pulgar) por segmentos, doblando hacia la palma."""
    frames = [(o.copy(), s.copy(), n.copy())]; sizes = [segs[0][:2]]
    for (w, t, L), c in zip(segs, curls):
        ax = s if eje_curl is None else eje_curl
        f = rot(f, ax, -c / 2); n = rot(n, ax, -c / 2)   # la mitad del doblez antes y la mitad despues
        o = o + f * L
        f = rot(f, ax, -c / 2); n = rot(n, ax, -c / 2)
        frames.append((o.copy(), s.copy(), n.copy())); sizes.append((w, t))
    return frames, sizes, o, f, n

def mano(bm, W, f, n, lado, g):
    f = f.normalized(); n = (n - f * n.dot(f)).normalized()
    s = f.cross(n) * lado
    # el doblez gira f hacia -n alrededor de s: comprobar el signo una vez
    if rot(f, s, -10).dot(n) > 0: s_eje = -s
    else: s_eje = s
    mw, mt, ml = K['MUNECA']; pw, pt, pl = K['PALMA']
    curls = [a + (b - a) * g for a, b in zip(K['CURL0'], K['CURL1'])]
    segs = [(mw, mt, 0.0), (pw, pt, ml), (pw, pt, pl)] + list(K['DEDOS'])
    o = W - f * ml * 0.6
    frames = [(o, s, n)]; sizes = [(mw, mt)]
    o1 = o + f * ml; frames.append((o1, s, n)); sizes.append((pw * 0.9, pt * 0.95))
    o2 = o1 + f * pl; frames.append((o2, s, n)); sizes.append((pw, pt))
    fr, sz, *_ = cadena(o2, f, n, s, K['DEDOS'], curls, s_eje)
    tubo(bm, frames + fr[1:], sizes + sz[1:])
    # pulgar
    p0 = [a + (b - a) * g for a, b in zip(K['PULG0'], K['PULG1'])]
    base = o1 + f * 0.02 + s * (pw / 2 - 0.02) - n * 0.01
    d = (f * math.cos(math.radians(p0[0])) + s * math.sin(math.radians(p0[0]))).normalized()
    d = (d * math.cos(math.radians(p0[1])) - n * math.sin(math.radians(p0[1]))).normalized()
    nt = (n - d * n.dot(d)).normalized(); st = d.cross(nt)
    eje = st if rot(d, st, -10).dot(nt) < 0 else -st   # doblar hacia la palma
    fr, sz, *_ = cadena(base, d, nt, st, K['PULGAR'], p0[2:], eje)
    tubo(bm, fr, sz)

def brazo(bm, S, E, Wr):
    C = 2 * E - (S + Wr) / 2
    pts = [(1 - t) ** 2 * S + 2 * (1 - t) * t * C + t * t * Wr for t in [i / 14 for i in range(15)]]
    f0 = (pts[1] - pts[0]).normalized()
    n = V((0, 1, 0)); n = (n - f0 * n.dot(f0)).normalized()
    frames, sizes = [], []
    for i, p in enumerate(pts):
        f = (pts[min(i + 1, 14)] - pts[max(i - 1, 0)]).normalized()
        n = (n - f * n.dot(f)).normalized(); s = f.cross(n)
        r = K['R_HOMBRO'] + (K['R_MUNECA'] - K['R_HOMBRO']) * (i / 14)
        frames.append((p, s, n)); sizes.append((2 * r, 2 * r))
    sizes[-1] = (2 * K['PUNO'], 2 * K['PUNO'])          # puno de la manga
    tubo(bm, frames, sizes, seg=12)

def ik(S, Wr, pole):
    L1, L2 = K['L1'], K['L2']; d = Wr - S; dl = min(d.length, (L1 + L2) * 0.999)
    u = d.normalized(); v = (pole - u * pole.dot(u)).normalized()
    a = math.acos(max(-1, min(1, (L1 * L1 + dl * dl - L2 * L2) / (2 * L1 * dl))))
    return S + (u * math.cos(a) + v * math.sin(a)) * L1, S + u * dl

hx, hy, hz = K['HOMBRO']
def reposo(lado):
    S = V((lado * hx, hy, hz)); a = math.radians(K['ABRE'])
    d1 = V((lado * math.sin(a), -0.03, -math.cos(a))).normalized()
    E = S + d1 * K['L1']
    d2 = (d1 + V((0, -0.17, 0))).normalized(); Wr = E + d2 * K['L2']
    return S, E, Wr, d2, V((lado, 0, 0)), 0.0

# poses por copia: lado +1 = x positiva (mano izquierda del personaje)
def poses(nm):
    if nm != 'Pose':
        return [reposo(-1), reposo(1)]
    # derecha: antebrazo al frente agarrando (pistola); izquierda: mano en la nuca/lado de la cabeza
    S = V((-hx, hy, hz))
    E, Wr = ik(S, V((-0.2, -0.5, 1.2)), V((-1, 0.3, -1)))
    agarra = (S, E, Wr, V((0, -1, 0.05)), V((-1, 0, 0)), 1.0)
    # palma apoyada sobre el pelo detras de la oreja (se mide el pelo real para no atravesarlo)
    S2 = V((hx, hy, hz)); a, e = math.radians(125), math.radians(-5)
    dr = V((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
    pelo = bpy.data.objects[nm + '_Pelo']; dg = bpy.context.evaluated_depsgraph_get()
    hit = BVHTree.FromObject(pelo, dg).ray_cast(V((0, 0, 2.15)) + dr * 3, -dr)[0] or V((0, 0, 2.15)) + dr * 0.56
    pal = hit + dr * (K['PALMA'][1] / 2 + 0.006)
    f = V((0, 0.35, 1)); f = (f - dr * f.dot(dr)).normalized()
    E2, W2 = ik(S2, pal - f * (K['MUNECA'][2] * 0.4 + K['PALMA'][2] * 0.5), V((1, 0.5, -0.3)))
    rasca = (S2, E2, W2, f, dr, 0.2)
    return [agarra, rasca]

def islas(bm):
    bm.verts.ensure_lookup_table(); seen = set(); out = []
    for v in bm.verts:
        if v in seen: continue
        st = [v]; seen.add(v); g = []
        while st:
            x = st.pop(); g.append(x)
            for e in x.link_edges:
                y = e.other_vert(x)
                if y not in seen: seen.add(y); st.append(y)
        out.append(g)
    return out

def limpiar(o, quedarse):
    me = o.data; bak = bpy.data.meshes.get('bak_' + me.name)
    if not bak: bak = me.copy(); bak.name = 'bak_' + me.name; bak.use_fake_user = True
    bm = bmesh.new(); bm.from_mesh(bak)
    for g in islas(bm):
        if not quedarse(g): bmesh.ops.delete(bm, geom=g, context='VERTS')
    bm.to_mesh(me); bm.free()

def objeto(nm, suf, me, mat, nivel):
    o = bpy.data.objects.get(nm + '_' + suf); cab = bpy.data.objects[nm + '_Cabeza']
    if not o:
        o = bpy.data.objects.new(nm + '_' + suf, me)
        for col in cab.users_collection: col.objects.link(o)
    o.data = me; o.parent = bpy.data.objects[nm]
    o.matrix_parent_inverse = cab.matrix_parent_inverse.copy(); o.matrix_basis = cab.matrix_basis.copy()
    me.materials.clear(); me.materials.append(mat)
    if 'Suave' not in o.modifiers:
        m = o.modifiers.new('Suave', 'SUBSURF'); m.levels = nivel; m.render_levels = 2
    for p in me.polygons: p.use_smooth = True

for nm in K['COPIAS']:
    tor = bpy.data.objects[nm + '_Playera']; piel = bpy.data.objects[nm + '_Piel']
    limpiar(tor, lambda g: len(g) > 200)                       # solo el torso
    limpiar(piel, lambda g: abs(sum(v.co.x for v in g) / len(g)) > 0.46 and abs(sum(v.co.y for v in g) / len(g)) < 0.06)  # solo orejas
    bmA = bmesh.new(); bmM = bmesh.new()
    for S, E, Wr, f, n, g in poses(nm):
        lado = 1 if S.x > 0 else -1
        brazo(bmA, S, E, Wr)
        mano(bmM, Wr, f, n, lado, g)
    for bm, suf, mat, niv in ((bmA, 'Brazos', 'chibi_playera', 1), (bmM, 'Manos', 'chibi_piel', 2)):
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        me = bpy.data.meshes.get(nm + '_' + suf) or bpy.data.meshes.new(nm + '_' + suf)
        bm.to_mesh(me); bm.free()
        objeto(nm, suf, me, bpy.data.materials[mat], niv)
print('brazos ok')
