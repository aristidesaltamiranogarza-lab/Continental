# Revolver western de accion simple para la Ruleta Rusa (estilo chibi: robusto, bordes redondeados).
# Piezas (coleccion "Revolver", hijas del empty raiz "Revolver"):
#   Rev_Cuerpo (armazon, canon, armazon de la cacha y guardamonte de laton, alojamiento de la varilla, tornillos),
#   Rev_Cacha (madera), Rev_Tambor (gira en +Y de Rev_EjeTambor), Rev_Martillo / Rev_Gatillo (giran en +X de su eje),
#   Rev_Puerta (puerta de carga, gira en +Y de Rev_EjePuerta), Rev_Varilla (varilla eyectora, se desliza en -Y),
#   Rev_Bala y Rev_Casquillo (sueltas; origen en el culote, +Y hacia la punta).
# Empties: Rev_Agarre (centro de la palma; +Y hacia el canon, +Z a lo largo de la cacha hacia arriba), Rev_Boca,
#   Rev_EjeTambor, Rev_EjeMartillo, Rev_EjeGatillo, Rev_EjePuerta, Rev_Recamara (recamara frente a la puerta, en la
#   cara trasera del tambor; +Y hacia adelante), Rev_Espuela (punta del martillo, hija de Rev_Martillo).
# Extras en "Revolver": rev_martillo / rev_gatillo / rev_puerta (grados), rev_varilla (recorrido), rev_paso (60).
# Marco: +Y = canon, +Z = arriba, +X = derecha del tirador; anima en z = 0. En glTF (+Y arriba) el +Y de Blender es -Z.
# Uso: exec(open(r'C:/Users/aris1/code/Continental/blender/revolver.py').read(), {'PRM': {...}})
import bpy, bmesh, math
from mathutils import Vector as V, Matrix

K = dict(
    ESC=1.25, POS=(0.0, 3.0, 1.2), EXPORTAR=True,   # ESC: ~1.25x lo real respecto a la mano de miton
    GLB=r'C:/Users/aris1/code/Continental/blender/revolver.glb',
    # tambor: radio, y trasera/delantera, radio del circulo de recamaras, radio de recamara, estrias (hondo, medio ancho en grados)
    R_TAM=0.031, L_TAM=(-0.034, 0.024), RC=0.0185, R_REC=0.0075, ESTRIA=(0.0035, 15.0), N_TAM=48,
    # canon: y trasera, y boca, radio, radio del anima
    CANON=(0.035, 0.1748, 0.0145, 0.0060),
    PUERTA_PHI=60.0, R_ESCUDO=0.0325, Y_ESCUDO=(-0.054, -0.0355),
    ANG_BISEL=35.0, ANG_SUAVE=40.0,
    # perfiles laterales (y, z)
    CACHA=[(-0.046, -0.059), (-0.052, -0.085), (-0.060, -0.112), (-0.068, -0.135), (-0.073, -0.146), (-0.078, -0.152),
           (-0.088, -0.155), (-0.099, -0.153), (-0.105, -0.146), (-0.104, -0.125), (-0.097, -0.100), (-0.089, -0.075),
           (-0.081, -0.050), (-0.075, -0.036), (-0.068, -0.027), (-0.061, -0.022), (-0.054, -0.020)],
    MADERA_Z=-0.042, MADERA_IN=0.0035,
    MARTILLO=[(-0.058, -0.036), (-0.0558, -0.020), (-0.0556, 0.006), (-0.057, 0.0125), (-0.061, 0.0175), (-0.068, 0.021),
              (-0.077, 0.0245), (-0.086, 0.028), (-0.093, 0.0305), (-0.099, 0.030), (-0.1015, 0.0265), (-0.100, 0.022),
              (-0.094, 0.019), (-0.086, 0.0155), (-0.079, 0.010), (-0.075, 0.002), (-0.072, -0.008), (-0.071, -0.018), (-0.072, -0.028), (-0.069, -0.037),
              (-0.064, -0.040)],
    GUARDA=[(0.012, -0.057), (0.011, -0.066), (0.005, -0.077), (-0.005, -0.0845), (-0.018, -0.0885), (-0.031, -0.087),
            (-0.041, -0.080), (-0.047, -0.070), (-0.050, -0.061)],
    GATILLO=[(-0.006, -0.050), (-0.005, -0.060), (-0.0065, -0.070), (-0.011, -0.077), (-0.017, -0.0805)],
    P_MARTILLO=(-0.064, -0.031), P_GATILLO=(-0.006, -0.054),
    AGARRE=(-0.0745, -0.100), EJE_CACHA=(-0.0225, -0.08),
    ANG_MARTILLO=40.0, ANG_GATILLO=-15.0, ANG_PUERTA=100.0,
    MAT=dict(acero=((0.70, 0.71, 0.74), 0.55, 0.30), oscuro=((0.22, 0.23, 0.26), 0.60, 0.32),
             laton=((0.70, 0.42, 0.10), 0.70, 0.30), madera=((0.42, 0.17, 0.05), 0.0, 0.45),
             hueco=((0.02, 0.02, 0.022), 0.0, 0.70), plomo=((0.30, 0.30, 0.32), 0.40, 0.50),
             cobre=((0.75, 0.38, 0.20), 0.70, 0.35)),
)
K.update(globals().get('PRM', {}))

# ---------- materiales y coleccion ----------
def material(nm, col, met, rug):
    m = bpy.data.materials.get(nm) or bpy.data.materials.new(nm)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Metallic'].default_value = met
    b.inputs['Roughness'].default_value = rug; m.diffuse_color = (*col, 1)
    return m
MAT = {k: material('rev_' + k, *v) for k, v in K['MAT'].items()}

col = bpy.data.collections.get('Revolver')
if col is None:
    col = bpy.data.collections.new('Revolver'); bpy.context.scene.collection.children.link(col)
for o in list(col.objects):
    me = o.data if o.type == 'MESH' else None
    bpy.data.objects.remove(o)
    if me and me.users == 0: bpy.data.meshes.remove(me)
raiz = bpy.data.objects.new('Revolver', None); col.objects.link(raiz)
raiz.empty_display_size = 0.05; raiz.location = K['POS']

# ---------- utilidades ----------
def aplicar(o):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg)); old = o.data
    o.modifiers.clear(); o.data = me; nm = old.name; bpy.data.meshes.remove(old); me.name = nm

def biselar(o, w, seg=2):
    b = o.modifiers.new('bisel', 'BEVEL'); b.width = w; b.segments = seg; b.limit_method = 'ANGLE'
    b.angle_limit = math.radians(K['ANG_BISEL']); b.use_clamp_overlap = True
    return b

def objeto(nm, bm, mats, bisel=0.0, seg=2, piv=(0, 0, 0)):
    piv = V(piv)
    for v in bm.verts: v.co -= piv
    me = bpy.data.meshes.new(nm); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(MAT[m])
    o = bpy.data.objects.new(nm, me); col.objects.link(o); o.parent = raiz; o.location = piv
    if bisel > 0: biselar(o, bisel, seg); aplicar(o)
    return o

def suavizar(o):
    me = o.data
    for p in me.polygons: p.use_smooth = True
    try: me.set_sharp_from_angle(angle=math.radians(K['ANG_SUAVE']))
    except Exception as ex: print('sharp:', ex)

def unir(nm, obs):
    mats, bm, tmp = [], bmesh.new(), bpy.data.meshes.new('tmp_union')
    for o in obs:
        n0 = len(bm.faces); me = o.data.copy(); me.transform(o.matrix_basis); bm.from_mesh(me)
        idx = []
        for m in me.materials:
            if m not in mats: mats.append(m)
            idx.append(mats.index(m))
        for f in list(bm.faces)[n0:]: f.material_index = idx[f.material_index] if idx else 0
        bpy.data.meshes.remove(me); old = o.data; bpy.data.objects.remove(o); bpy.data.meshes.remove(old)
    bpy.data.meshes.remove(tmp)
    me = bpy.data.meshes.new(nm); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    o = bpy.data.objects.new(nm, me); col.objects.link(o); o.parent = raiz
    return o

def extruir(pts, eje, a, b, mi=0):
    """Poligono 2D extruido. eje 'X': pts (y,z), x de a a b. eje 'Y': pts (x,z), y de a a b."""
    bm = bmesh.new()
    P = (lambda p, t: V((t, p[0], p[1]))) if eje == 'X' else (lambda p, t: V((p[0], t, p[1])))
    A = [bm.verts.new(P(p, a)) for p in pts]; B = [bm.verts.new(P(p, b)) for p in pts]
    bm.faces.new(A); bm.faces.new(B)
    for i in range(len(pts)):
        j = (i + 1) % len(pts); bm.faces.new((A[i], A[j], B[j], B[i]))
    for f in bm.faces: f.material_index = mi
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm

def torno(perfil, n, mis=None, centro=(0, 0, 0), eje='Y'):
    """Revoluciona (r, y) alrededor de +Y; el perfil empieza y termina en r = 0. eje 'X'/'-X' lo acuesta."""
    bm = bmesh.new(); an = []
    for r, y in perfil:
        if r < 1e-7: an.append([bm.verts.new((0, y, 0))])
        else: an.append([bm.verts.new((r * math.sin(2 * math.pi * k / n), y, r * math.cos(2 * math.pi * k / n))) for k in range(n)])
    for i in range(len(an) - 1):
        a, b = an[i], an[i + 1]
        if len(a) == 1 and len(b) == 1: continue
        for k in range(n):
            k2 = (k + 1) % n
            vs = (a[0], b[k2], b[k]) if len(a) == 1 else (a[k], a[k2], b[0]) if len(b) == 1 else (a[k], a[k2], b[k2], b[k])
            bm.faces.new(vs).material_index = mis[i] if mis else 0
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    if eje in ('X', '-X'):
        bmesh.ops.rotate(bm, verts=bm.verts[:], cent=(0, 0, 0), matrix=Matrix.Rotation((-1 if eje == 'X' else 1) * math.pi / 2, 3, 'Z'))
    bmesh.ops.translate(bm, verts=bm.verts[:], vec=V(centro))
    return bm

def suave(pts, k=3, cerrado=False):
    """Catmull-Rom por los puntos (2D o 3D)."""
    P = [V(p) for p in pts]; n = len(P); out = []
    rng = range(n) if cerrado else range(n - 1)
    for i in rng:
        g = (lambda j: P[j % n]) if cerrado else (lambda j: P[min(max(j, 0), n - 1)])
        p0, p1, p2, p3 = g(i - 1), g(i), g(i + 1), g(i + 2)
        for s in range(k):
            t = s / k
            out.append(0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t))
    if not cerrado: out.append(P[-1])
    return [tuple(p) for p in out]

def tubo(pts2, ra, rb, n=10, x=0.0, mi=0, punta=1.0, k=3):
    """Barre una elipse (ra en X, rb en el plano YZ) por una curva (y,z); punta = escala al final."""
    ps = [V((x, p[0], p[1])) for p in suave(pts2, k)]
    bm = bmesh.new(); an = []
    for i, p in enumerate(ps):
        t = (ps[min(i + 1, len(ps) - 1)] - ps[max(i - 1, 0)]).normalized(); nn = V((1, 0, 0)).cross(t).normalized()
        e = 1 + (punta - 1) * i / (len(ps) - 1)
        an.append([bm.verts.new(p + V((ra * e * math.cos(2 * math.pi * j / n), 0, 0)) + nn * rb * e * math.sin(2 * math.pi * j / n)) for j in range(n)])
    for i in range(len(an) - 1):
        for j in range(n):
            j2 = (j + 1) % n; bm.faces.new((an[i][j], an[i][j2], an[i + 1][j2], an[i + 1][j]))
    bm.faces.new(an[0]); bm.faces.new(an[-1])
    for f in bm.faces: f.material_index = mi
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm

def encoger(pts, d):
    P = [V(p) for p in pts]; n = len(P)
    s = 1 if sum(P[i].x * P[(i + 1) % n].y - P[(i + 1) % n].x * P[i].y for i in range(n)) > 0 else -1
    out = []
    for i in range(n):
        a, b, c = P[i - 1], P[i], P[(i + 1) % n]
        e1, e2 = (b - a).normalized(), (c - b).normalized()
        n1, n2 = V((-e1.y, e1.x)) * s, V((-e2.y, e2.x)) * s
        m = (n1 + n2).normalized(); out.append(tuple(b + m * d / max(0.35, m.dot(n1))))
    return out

def recortar(pts, zmax):
    out = []
    for i in range(len(pts)):
        a, b = pts[i], pts[(i + 1) % len(pts)]; ia, ib = a[1] <= zmax, b[1] <= zmax
        if ia: out.append(a)
        if ia != ib:
            t = (zmax - a[1]) / (b[1] - a[1]); out.append((a[0] + t * (b[0] - a[0]), zmax))
    return out

def tornillo(c, r, eje):
    s = r / 0.003
    return torno([(0, 0), (0.003 * s, 0), (0.003 * s, 0.0007 * s), (0.0022 * s, 0.0013 * s), (0, 0.0014 * s)], 12, centro=c, eje=eje)

def vacio(nm, pos, M3=None, padre=None):
    e = bpy.data.objects.new(nm, None); col.objects.link(e)
    e.empty_display_type = 'ARROWS'; e.empty_display_size = 0.015
    p = padre or raiz; e.parent = p
    mb = (M3 or Matrix.Identity(3)).to_4x4(); mb.translation = V(pos) - (p.location if padre else V())
    e.matrix_basis = mb
    return e

RC, R, Y0, Y1 = K['RC'], K['R_TAM'], K['L_TAM'][0], K['L_TAM'][1]
A = V((0, -RC))                                             # eje del tambor en la vista trasera (x, z)
PHI = math.radians(K['PUERTA_PHI'])
D = V((math.sin(PHI), math.cos(PHI)))                       # direccion de la recamara de carga (desde el eje)
M1 = V((D.y, -D.x)); M0 = -M1                               # lados de la ranura (M0 hacia arriba)
CREC = A + D * RC                                           # recamara frente a la puerta (x, z)

# ---------- cuerpo ----------
partes = []
YE0, YE1 = K['Y_ESCUDO']
# correa superior, frente del armazon y correa inferior
partes.append(objeto('tapa', extruir([(YE0, 0.0138), (0.040, 0.0138), (0.040, 0.0225), (YE0, 0.0225)], 'X', -0.012, 0.012), ['acero'], 0.0035))
partes.append(objeto('frente', extruir([(0.0255, 0.0225), (0.040, 0.0225), (0.040, -0.032), (0.038, -0.046), (0.034, -0.054),
                                        (0.029, -0.0595), (0.0255, -0.0595)], 'X', -0.014, 0.014), ['acero'], 0.0025))
partes.append(objeto('bajo', extruir([(YE0, -0.0505), (0.03, -0.0505), (0.03, -0.0595), (YE0, -0.0595)], 'X', -0.013, 0.013), ['acero'], 0.002))
# escudo trasero con la ranura de carga
RS = K['R_ESCUDO']; w = K['R_REC'] + 0.001; tE = math.sqrt(RS * RS - w * w); dphi = math.asin(w / RS)
def circ(a0, a1, n): return [A + V((math.sin(a), math.cos(a))) * RS for a in (a0 + (a1 - a0) * i / n for i in range(n + 1))]
esc = circ(math.radians(-135), PHI - dphi, 26)[:-1]
esc += [A + D * t + M0 * w for t in (tE, (tE + RC) / 2, RC)]
esc += [CREC + (M0 * math.cos(th) - D * math.sin(th)) * w for th in (math.pi * i / 8 for i in range(1, 8))]
esc += [A + D * t + M1 * w for t in (RC, (tE + RC) / 2, tE)]
esc += circ(PHI + dphi, math.radians(135), 10)[1:] + [V((0.013, -0.0595)), V((-0.013, -0.0595))]
partes.append(objeto('escudo', extruir([tuple(p) for p in esc], 'Y', YE0, YE1), ['acero'], 0.0025))
# armazon de la cacha (laton), canon, mira, alojamiento de la varilla, perno del tambor, guardamonte
CACHA = suave(K['CACHA'], 2, True)
partes.append(objeto('armazon', extruir(CACHA, 'X', -0.011, 0.011), ['laton'], 0.0025))
cy0, cy1, cr, ca = K['CANON']
partes.append(objeto('canon', torno([(0, cy0), (cr, cy0), (cr, cy1 - 0.0023), (cr - 0.0007, cy1 - 0.0006), (cr - 0.0017, cy1),
                                     (ca + 0.001, cy1), (ca, cy1 - 0.0006), (ca, cy1 - 0.0148), (0, cy1 - 0.0148)], 20,
                                    [0, 0, 0, 0, 0, 0, 1, 1]), ['acero', 'hueco']))
partes.append(objeto('mira', extruir([(cy1 - 0.0198, 0.011), (cy1 - 0.0068, 0.011), (cy1 - 0.0068, 0.0165), (cy1 - 0.0103, 0.0215),
                                      (cy1 - 0.0153, 0.0215), (cy1 - 0.0198, 0.017)], 'X', -0.0022, 0.0022), ['laton'], 0.0008))
XH, ZH, RH = CREC.x, CREC.y, 0.0058
partes.append(objeto('alojamiento', torno([(0, 0.039), (RH, 0.039), (RH, 0.122), (RH - 0.0006, 0.1263), (0.0036, 0.1283), (0, 0.129)], 14,
                                          centro=(XH, 0, ZH)), ['acero']))
partes.append(objeto('perno', torno([(0, 0.038), (0.0042, 0.038), (0.0042, 0.044), (0.0034, 0.0465), (0, 0.047)], 12, centro=(0, 0, -RC)), ['acero']))
partes.append(objeto('guarda', tubo(K['GUARDA'], 0.0045, 0.0032), ['laton']))
pm, pg = K['P_MARTILLO'], K['P_GATILLO']
for c, r, ej in (((0.0112, pm[0], pm[1]), 0.003, 'X'), ((-0.0112, pm[0], pm[1]), 0.003, '-X'),
                 ((0.013, pg[0], pg[1]), 0.0024, 'X'), ((-0.013, pg[0], pg[1]), 0.0024, '-X'),
                 ((-0.014, 0.0325, -RC), 0.0028, '-X')):
    partes.append(objeto('tornillo', tornillo(c, r, ej), ['oscuro']))
cuerpo = unir('Rev_Cuerpo', partes)

# ---------- cacha de madera ----------
MAD = recortar(encoger(CACHA, K['MADERA_IN']), K['MADERA_Z'])
cacha = unir('Rev_Cacha', [objeto('madera', extruir(MAD, 'X', -0.0148, 0.0148), ['madera'], 0.0035, 3),
                           objeto('tornillo', tornillo((0.0148, -0.078, -0.098), 0.0032, 'X'), ['oscuro']),
                           objeto('tornillo', tornillo((-0.0148, -0.078, -0.098), 0.0032, '-X'), ['oscuro'])])

# ---------- tambor (estrias + recamaras con boolean) ----------
N = K['N_TAM']; DE, WE = K['ESTRIA']
def r_tam(phi, prof):
    dd = (phi % 60.0) - 30.0
    return R - DE * prof * (math.cos(math.pi / 2 * dd / WE) ** 2 if abs(dd) < WE else 0)
est = [(Y0, -0.0018, 0), (Y0 + 0.0015, 0, 0), (Y0 + 0.013, 0, 0), (Y0 + 0.0155, 0, .55), (Y0 + 0.018, 0, 1),
       (Y1 - 0.014, 0, 1), (Y1 - 0.0115, 0, .55), (Y1 - 0.009, 0, 0), (Y1 - 0.0015, 0, 0), (Y1, -0.0018, 0)]
bm = bmesh.new(); an = []
for y, dr, prof in est:
    an.append([bm.verts.new(((r_tam(360 * k / N, prof) + dr) * math.sin(2 * math.pi * k / N), y,
                              -RC + (r_tam(360 * k / N, prof) + dr) * math.cos(2 * math.pi * k / N))) for k in range(N)])
for i in range(len(an) - 1):
    for k in range(N):
        k2 = (k + 1) % N; bm.faces.new((an[i][k], an[i][k2], an[i + 1][k2], an[i + 1][k]))
bm.faces.new(an[0]); bm.faces.new(an[-1]); bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
YM = (Y0 + Y1) / 2
tambor = objeto('Rev_Tambor', bm, ['acero'], piv=(0, YM, -RC))
cort = []
for i in range(6):
    a = math.radians(60 * i); cx, cz = RC * math.sin(a), -RC + RC * math.cos(a)
    cort.append(objeto('c', torno([(0, Y0 - 0.005), (K['R_REC'], Y0 - 0.005), (K['R_REC'], Y1 + 0.005), (0, Y1 + 0.005)], 14,
                                  centro=(cx, 0, cz)), ['hueco']))
cort.append(objeto('c', torno([(0, Y0 - 0.005), (0.0042, Y0 - 0.005), (0.0042, Y1 + 0.005), (0, Y1 + 0.005)], 12, centro=(0, 0, -RC)), ['hueco']))
cortador = unir('cortador', cort); cortador.hide_set(True)
tambor.data.materials.append(MAT['hueco'])
bo = tambor.modifiers.new('recamaras', 'BOOLEAN'); bo.operation = 'DIFFERENCE'; bo.object = cortador
try: bo.solver = 'EXACT'
except TypeError: pass
try: bo.material_mode = 'TRANSFER'
except Exception: pass
biselar(tambor, 0.0008, 1); aplicar(tambor)
me = cortador.data; bpy.data.objects.remove(cortador); bpy.data.meshes.remove(me)

# ---------- martillo y gatillo ----------
martillo = objeto('Rev_Martillo', extruir(suave(K['MARTILLO'], 2, True), 'X', -0.0055, 0.0055), ['oscuro'], 0.0018, piv=(0, *pm))
gatillo = objeto('Rev_Gatillo', tubo(K['GATILLO'], 0.0028, 0.0019, n=10, punta=0.75), ['oscuro'], piv=(0, *pg))

# ---------- puerta de carga ----------
wg = w - 0.0004; RSg = RS - 0.0002; tg = math.sqrt(RSg * RSg - wg * wg); dg_ = math.asin(wg / RSg)
pu = [A + D * t + M0 * wg for t in (tg, (tg + RC) / 2, RC)]
pu += [CREC + (M0 * math.cos(th) - D * math.sin(th)) * wg for th in (math.pi * i / 8 for i in range(1, 8))]
pu += [A + D * t + M1 * wg for t in (RC, (tg + RC) / 2, tg)]
pu += [A + V((math.sin(a), math.cos(a))) * RSg for a in (PHI + dg_ * (1 - 2 * i / 3) for i in range(1, 3))]
H = A + D * (tE - 0.0015) + M1 * (wg - 0.0015)
G = sum(pu, V((0, 0))) / len(pu)
def rot_y(p, c, ang):
    q = p - c; s, co = math.sin(ang), math.cos(ang)
    return c + V((q.x * co + q.y * s, -q.x * s + q.y * co))
sig = 1 if (rot_y(G, H, math.radians(K['ANG_PUERTA'])) - A).length > (rot_y(G, H, -math.radians(K['ANG_PUERTA'])) - A).length else -1
puerta = objeto('Rev_Puerta', extruir([tuple(p) for p in pu], 'Y', YE0 + 0.0015, YE1 - 0.0005), ['acero'], 0.001,
                piv=(H.x, (YE0 + YE1) / 2, H.y))

# ---------- varilla eyectora ----------
var = unir('Rev_Varilla', [objeto('v', torno([(0, 0.03), (0.002, 0.03), (0.002, 0.121), (0, 0.121)], 8, centro=(XH, 0, ZH)), ['acero']),
                           objeto('v', torno([(0, 0), (0.0042, 0), (0.0042, 0.0015), (0.0032, 0.003), (0, 0.0032)], 14,
                                             centro=(XH + RH - 0.0005, 0.117, ZH), eje='X'), ['oscuro'])])
PV = V((XH, 0.03, ZH)); var.data.transform(Matrix.Translation(-PV)); var.location = PV

# ---------- bala y casquillo ----------
CUL = [(0, 0.0003), (0.0024, 0.0003), (0.0027, 0), (0.0068, 0), (0.0082, 0.0003), (0.0083, 0.0012), (0.0071, 0.0017), (0.0071, 0.032)]
bala = objeto('Rev_Bala', torno(CUL + [(0.0067, 0.0322), (0.0067, 0.0355), (0.0058, 0.0395), (0.0038, 0.0423), (0, 0.0433)], 16,
                                [1, 1, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2], centro=(0.06, -0.02, -0.11)), ['laton', 'cobre', 'plomo'], piv=(0.06, -0.02, -0.11))
casq = objeto('Rev_Casquillo', torno(CUL + [(0.0063, 0.032), (0.0063, 0.027), (0, 0.027)], 16,
                                     [1, 1, 0, 0, 0, 0, 0, 0, 2, 2], centro=(0.085, -0.02, -0.11)), ['laton', 'cobre', 'hueco'], piv=(0.085, -0.02, -0.11))

for o in (cuerpo, cacha, tambor, martillo, gatillo, puerta, var, bala, casq): suavizar(o)

# ---------- empties ----------
ez = V((0, -K['EJE_CACHA'][0], -K['EJE_CACHA'][1])).normalized(); ey = V((0, ez.z, -ez.y))
vacio('Rev_Agarre', (0, *K['AGARRE']), Matrix((V((1, 0, 0)), ey, ez)).transposed())
vacio('Rev_Boca', (0, cy1, 0))
vacio('Rev_EjeTambor', (0, YM, -RC))
vacio('Rev_EjeMartillo', (0, *pm))
vacio('Rev_EjeGatillo', (0, *pg))
vacio('Rev_EjePuerta', (H.x, (YE0 + YE1) / 2, H.y))
vacio('Rev_Recamara', (CREC.x, Y0, CREC.y))
vacio('Rev_Espuela', (0, -0.097, 0.0285), padre=martillo)
raiz['rev_martillo'] = K['ANG_MARTILLO']; raiz['rev_gatillo'] = K['ANG_GATILLO']
raiz['rev_puerta'] = sig * K['ANG_PUERTA']; raiz['rev_varilla'] = 0.064 * K['ESC']; raiz['rev_paso'] = 60.0

# ---------- escala ----------
if K['ESC'] != 1.0:
    S = Matrix.Scale(K['ESC'], 4)
    for o in col.objects:
        if o.type == 'MESH': o.data.transform(S)
        if o.parent: o.location = o.location * K['ESC']

tris = {o.name: sum(len(p.vertices) - 2 for p in o.data.polygons) for o in col.objects if o.type == 'MESH'}
print('tris', tris, 'total', sum(tris.values()), '| puerta', raiz['rev_puerta'])

# ---------- exportar ----------
if K['EXPORTAR']:
    sel = [o for o in bpy.context.view_layer.objects if o.select_get()]; act = bpy.context.view_layer.objects.active
    pos = raiz.location.copy(); raiz.location = (0, 0, 0)
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in col.objects: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=K['GLB'], export_format='GLB', use_selection=True, use_active_scene=True, export_extras=True,
                              export_yup=True, export_apply=False, export_animations=False)
    raiz.location = pos
    for o in col.objects: o.select_set(False)
    for o in sel: o.select_set(True)
    bpy.context.view_layer.objects.active = act
    print('GLB', K['GLB'])
