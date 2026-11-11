# Ropa 2 y 3 del chibi (paso 4), hecha a partir de la playera, mangas y pantalon de Frente:
#   2 = sudadera (torso y mangas infladas, resorte abajo, punos, capucha baja en la espalda, bolsa canguro,
#       cordones) + short
#   3 = blusa (cuello camisero, botones, faldon curvo) + falda (tablones, doble capa)
# Short y falda dejan ver las piernas: malla 'ropa_piernas' (piel), pieza aparte que se muestra solo con ellas.
# Version M sobre el cuerpo de mujer (playera_m / pantalon_m de cuerpo_m.py; mallas con sufijo _m).
# Figuras de muestra 'Ropa_n' (copias ligadas de Frente) y 'RopaM_n' (de Mujer) en la coleccion "Ropa".
# rig.py las toma como piezas Arriba_n / Abajo_n / Piernas y Arriba_n_M / Abajo_n_M / Piernas_M.
# Uso: exec(open(r'C:/Users/aris1/code/Continental/blender/ropa.py').read(), {'PRM': {...}})
import bpy, bmesh, math
from mathutils import Vector as V
from mathutils.bvhtree import BVHTree

K = dict(
    HOMBRO=(0.20, 0.0, 1.55),            # como brazos.py: de aqui a la muneca se mide el largo de la manga
    # sudadera: cuanto se infla (a lo largo de la normal) torso y mangas; resorte abajo y punos mas pegados
    SUD_TORSO=0.022, SUD_MANGA=0.016, SUD_PUNO=0.004, SUD_RESORTE=0.008, RESORTE_Z=(1.02, 0.96), PUNO_T=(0.84, 0.9),
    # capucha baja: bolsa sobre la espalda (z arriba (metida bajo la cabeza), z abajo, medio ancho arriba,
    # grosor arriba, grosor abajo); muestras (a lo ancho, a lo alto); los rayos bajan CAPUCHA_INCLINA grados
    CAPUCHA=(1.64, 1.31, 0.18, 0.045, 0.01), CAPUCHA_SEG=(8, 6), CAPUCHA_INCLINA=40,
    # bolsa canguro al frente: z arriba, z abajo, medio ancho arriba, medio ancho abajo, grosor
    BOLSA=(1.17, 0.99, 0.10, 0.165, 0.007), BOLSA_SEG=(8, 4),
    CORDON=(0.0055, 0.15, 34),           # radio, largo, grados desde el frente
    # blusa: ancho del cuello atras y en las puntas, grosor, abertura al frente (grados), giro de las puntas
    CUELLO=(0.032, 0.11, 0.009), CUELLO_ABRE=9, CUELLO_PUNTA=30, CUELLO_SEG=32,
    BOTONES=(1.50, 1.08, 4, 0.017),      # z arriba, z abajo, cuantos, radio
    FALDON=0.04,                         # cuanto bajan el frente y la espalda de la blusa respecto a los lados
    # short: corte, vuelo (escala del grosor de la pierna en el borde)
    SHORT_Z=0.60, SHORT_Z_M=0.55, SHORT_VUELO=1.12,   # en M mas largo: la prenda de arriba llega a 0.62
    # falda: (z, escala x, escala y) sobre la cadera del pantalon (rx 0.192, ry 0.125); tablones; doble capa
    FALDA=[(1.03, 0.97, 0.99), (0.96, 1.04, 1.08), (0.86, 1.2, 1.3), (0.74, 1.38, 1.52), (0.62, 1.52, 1.7),
           (0.52, 1.6, 1.8)],
    # M: queda dentro de la prenda de arriba de la mujer (que abre hasta z 0.62) y se abre abajo
    FALDA_M=[(1.03, 0.97, 0.99), (0.9, 1.0, 1.02), (0.75, 1.2, 1.15), (0.62, 1.42, 1.3), (0.46, 1.62, 1.62)],
    FALDA_SEG=40, FALDA_ANILLOS=8, TABLONES=(8, 0.03), FALDA_GROSOR=0.007,
    PIERNAS=(0.70, 0.80),                # z de arriba, grosor (escala alrededor del centro de cada pierna)
    X0=-9.0, X0_M=-11.9, DX=-1.45)       # x de la figura Ropa_n = X0 + DX*(n-2) (RopaM_n con X0_M)
K.update(globals().get('PRM', {}))

def mat(nombre, col, rough=0.9):
    m = bpy.data.materials.get(nombre)
    if m: return m
    m = bpy.data.materials.new(nombre); m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough
    m.diffuse_color = (*col, 1)
    return m
M_ARRIBA, M_ABAJO, M_PIEL = (bpy.data.materials[n] for n in ('chibi_playera', 'chibi_pantalon', 'chibi_piel'))
M_BOTON = mat('chibi_boton', (0.86, 0.83, 0.76))

def bm_de(nombre): bm = bmesh.new(); bm.from_mesh(bpy.data.objects['Frente_' + nombre].data); return bm

def malla(nombre, bm, material, normales=True):
    if normales: bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.get(nombre) or bpy.data.meshes.new(nombre)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    me.materials.clear(); me.materials.append(material)
    return me

def bvh_sub(me, nivel=1):
    """BVH de la malla con subdivision (como se ve)."""
    tmp = bpy.data.objects.new('tmp_ropa', me); bpy.context.scene.collection.objects.link(tmp)
    tmp.modifiers.new('s', 'SUBSURF').levels = nivel
    dg = bpy.context.evaluated_depsgraph_get(); e = tmp.evaluated_get(dg); mm = e.to_mesh()
    b = BVHTree.FromPolygons([v.co.copy() for v in mm.vertices], [p.vertices[:] for p in mm.polygons])
    e.to_mesh_clear(); bpy.data.objects.remove(tmp, do_unlink=True)
    return b
hd = bpy.data.objects['Frente_Cabeza'].data
CABEZA = BVHTree.FromPolygons([v.co.copy() for v in hd.vertices], [p.vertices[:] for p in hd.polygons])

def suave(t): t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)

def inflar(bm, d):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.normal_update()
    nuevo = [(v, v.co + v.normal * d(v)) for v in bm.verts]
    for v, c in nuevo: v.co = c

def t_manga(bm):
    """largo relativo de la manga (0 hombro, 1 muneca) por vertice."""
    out = {}
    for s in (1, -1):
        S = V((s * K['HOMBRO'][0], K['HOMBRO'][1], K['HOMBRO'][2]))
        W = min((v.co for v in bm.verts if v.co.x * s > 0), key=lambda c: c.z); L = (W - S).length_squared
        for v in bm.verts:
            if v.co.x * s > 0: out[v] = (v.co - S).dot(W - S) / L
    return out

def dir_(th): return V((math.sin(th), -math.cos(th), 0))     # th = 0 al frente (-y), pi atras

def sobre_hombro(T, th, r, holg=0.004, a0=0.11, b0=0.09):
    """punto del torso T alrededor del cuello (angulo th) donde cabe un tubo de radio r sin tocar la cabeza."""
    d = dir_(th); k = 1.0; p = n = None
    for _ in range(80):
        hit = T.ray_cast(V((d.x * a0 * k, d.y * b0 * k, 2.0)), V((0, 0, -1)))
        if hit[0] is not None:
            p, n = hit[0], hit[1]
            if CABEZA.find_nearest(p + n * r)[3] >= r + holg: break
        k += 0.025
    return p, n

def tubo(bm, pts, radios, lados, tapas=True, aplana=1.0):
    """tubo por los puntos con marcos de transporte paralelo; aplana < 1 achata en la direccion 'arriba'."""
    N = len(pts); T = [(pts[min(i + 1, N - 1)] - pts[max(i - 1, 0)]).normalized() for i in range(N)]
    up = V((0, 0, 1)); A = (up - T[0] * up.dot(T[0])).normalized()
    if A.length < 0.5: A = V((1, 0, 0))
    anillos = []
    for i in range(N):
        if i: A = (A - T[i] * A.dot(T[i])).normalized()
        B = T[i].cross(A)
        anillos.append([bm.verts.new(pts[i] + radios[i] * (math.cos(2 * math.pi * j / lados) * A * aplana
                                                            + math.sin(2 * math.pi * j / lados) * B)) for j in range(lados)])
    for a, b in zip(anillos, anillos[1:]):
        for j in range(lados): bm.faces.new((a[j], a[(j + 1) % lados], b[(j + 1) % lados], b[j]))
    if tapas:
        for anillo, i, sg in ((anillos[0], 0, -1), (anillos[-1], N - 1, 1)):
            c = bm.verts.new(pts[i] + T[i] * sg * radios[i] * 0.6)
            for j in range(lados): bm.faces.new((anillo[j], anillo[(j + 1) % lados], c))

def parche(bm, T, forma, grosor, lado, nu, nv, base=0.003, inclina=0.0):
    """placa sobre la superficie T: forma(u, v) -> (x, z) con u en [-1, 1] y v en [0, 1]; se proyecta con rayos
    en y (lado 1 = desde el frente, -1 = desde atras), bajando 'inclina' grados; grosor(u, v) sobre la superficie;
    cerrada por los bordes."""
    d = V((0, lado * math.cos(math.radians(inclina)), -math.sin(math.radians(inclina))))
    arr, aba = [], []
    for j in range(nv + 1):
        fa, fb = [], []
        for i in range(nu + 1):
            u = -1 + 2 * i / nu; v = j / nv; x, z = forma(u, v)
            hit = T.ray_cast(V((x, 0, z)) - d, d)
            p, n = (hit[0], hit[1]) if hit[0] is not None else (V((x, 0, z)), V((0, -lado, 0)))
            fa.append(bm.verts.new(p + n * (base + grosor(u, v)))); fb.append(bm.verts.new(p + n * base))
        arr.append(fa); aba.append(fb)
    for j in range(nv):
        for i in range(nu):
            bm.faces.new((arr[j][i], arr[j][i + 1], arr[j + 1][i + 1], arr[j + 1][i]))
            bm.faces.new((aba[j][i], aba[j + 1][i], aba[j + 1][i + 1], aba[j][i + 1]))
    for j in range(nv):
        for i in (0, nu): bm.faces.new((arr[j][i], arr[j + 1][i], aba[j + 1][i], aba[j][i]))
    for j in (0, nv):
        for i in range(nu): bm.faces.new((arr[j][i], aba[j][i], aba[j][i + 1], arr[j][i + 1]))

# ---------- abajo: utilidades ----------
def componentes(bm):
    resto, comp = set(bm.verts), []
    while resto:
        v0 = resto.pop(); c = {v0}; pila = [v0]
        while pila:
            v = pila.pop()
            for e in v.link_edges:
                w = e.other_vert(v)
                if w in resto: resto.discard(w); c.add(w); pila.append(w)
        comp.append(c)
    return comp
def cortar(bm, z, quitar_abajo=True):
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, z), plane_no=(0, 0, 1))
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if (v.co.z < z - 1e-5 if quitar_abajo else v.co.z > z + 1e-5)], context='VERTS')
PX = 0.096          # centro de cada pierna en x

def bm_me(me): bm = bmesh.new(); bm.from_mesh(me); return bm

# mangas de la sudadera (las mismas para H y M: la mujer usa las mangas de Frente)
bm = bm_de('Brazos'); tm = t_manga(bm); p0, p1 = K['PUNO_T']
inflar(bm, lambda v: K['SUD_MANGA'] + (K['SUD_PUNO'] - K['SUD_MANGA']) * suave((tm[v] - p0) / (p1 - p0)))
sud_mangas = malla('ropa_sudadera_mangas', bm, M_ARRIBA)

def ropa(c):
    """c: sf (sufijo de mallas), playera, pantalon (mallas del cuerpo), nivel (subdivision del torso para
    proyectar), faldon, short_z, falda (perfil). Devuelve {n: {parte: malla}}."""
    sf = c['sf']
    # ---------- 2: sudadera ----------
    bm = bm_me(c['playera']); z1, z0 = K['RESORTE_Z']
    inflar(bm, lambda v: K['SUD_RESORTE'] + (K['SUD_TORSO'] - K['SUD_RESORTE']) * suave((v.co.z - z0) / (z1 - z0)))
    sud_torso = malla('ropa_sudadera' + sf, bm, M_ARRIBA)
    T2 = bvh_sub(sud_torso, c['nivel'])
    zt, zb, w0, g0, g1 = K['CAPUCHA']
    def cap_forma(u, v):   # punta abajo
        w = w0 * max(0.06, (1 - v) ** 0.75) * math.sqrt(max(0.0, 1 - (v * 0.9) ** 6)); return u * w, zt + (zb - zt) * v
    def cap_grosor(u, v): return g1 + (g0 - g1) * (1 - v) ** 1.5 * math.sqrt(max(0.0, 1 - u * u))
    bm = bmesh.new(); parche(bm, T2, cap_forma, cap_grosor, -1, *K['CAPUCHA_SEG'], inclina=K['CAPUCHA_INCLINA'])
    capucha = malla('ropa_capucha' + sf, bm, M_ARRIBA)
    bt, bb, bw0, bw1, bg = K['BOLSA']
    bm = bmesh.new()
    parche(bm, T2, lambda u, v: (u * (bw0 + (bw1 - bw0) * v), bt + (bb - bt) * v),
           lambda u, v: bg * (0.6 + 0.4 * math.sqrt(max(0.0, 1 - u * u))), 1, *K['BOLSA_SEG'])
    bolsa = malla('ropa_bolsa' + sf, bm, M_ARRIBA)
    bm = bmesh.new(); rc, lc, gc = K['CORDON']
    for s in (1, -1):
        th = s * math.radians(gc); p, n = sobre_hombro(T2, th, 0.02)
        cp = []
        for k in range(7):
            z = p.z - 0.01 - lc * k / 6; x = p.x * (1 - 0.15 * k / 6)
            hit = T2.ray_cast(V((x, -1.0, z)), V((0, 1, 0)))
            if hit[0] is not None: cp.append(hit[0] + hit[1] * rc * 1.2)
        tubo(bm, cp, [rc] * (len(cp) - 1) + [rc * 1.5], 5)
    cordones = malla('ropa_cordones' + sf, bm, M_BOTON)

    # ---------- 3: blusa ----------
    bm = bm_me(c['playera'])
    if c['faldon']:
        for v in bm.verts:
            if v.co.z < 1.0:
                s = suave((1.0 - v.co.z) / (1.0 - 0.924)); a = math.atan2(v.co.x, -v.co.y)
                v.co.z -= c['faldon'] * s * math.cos(a) ** 2
    blusa = malla('ropa_blusa' + sf, bm, M_ARRIBA)
    T3 = bvh_sub(blusa, c['nivel'])
    bm = bmesh.new(); wb, wf, gr = K['CUELLO']; ab = math.radians(K['CUELLO_ABRE']); nc = K['CUELLO_SEG']
    filas = []          # por muestra: [(punto, normal)] de adentro hacia afuera
    for i in range(nc + 1):
        u = i / nc; th = ab + (2 * math.pi - 2 * ab) * u
        p, n = sobre_hombro(T3, th, 0.012)
        e = max(0.0, 1 - min(u, 1 - u) / 0.18) ** 2          # 1 en las puntas
        w = wb + (wf - wb) * (1 - math.sin(math.pi * u)) ** 1.5
        tho = th - (1 if u < 0.5 else -1) * math.radians(K['CUELLO_PUNTA']) * e   # las puntas giran hacia el centro
        fila = []
        for f in (0.0, 0.5, 1.0):
            d = dir_(th) * (1 - f) + dir_(tho) * f
            q = V((p.x, p.y, 0)) + d * w * f
            hit = T3.ray_cast(V((q.x, q.y, 2.0)), V((0, 0, -1)))
            fila.append((hit[0], hit[1]) if (hit[0] is not None and f) else (p, n))
        filas.append(fila)
    arr = [[bm.verts.new(p + n * (0.004 + gr)) for p, n in f] for f in filas]
    aba = [[bm.verts.new(p + n * 0.004) for p, n in f] for f in filas]
    for i in range(nc):
        for j in range(2):
            bm.faces.new((arr[i][j], arr[i + 1][j], arr[i + 1][j + 1], arr[i][j + 1]))
            bm.faces.new((aba[i][j + 1], aba[i + 1][j + 1], aba[i + 1][j], aba[i][j]))
        for j in (0, 2):
            bm.faces.new((arr[i][j], aba[i][j], aba[i + 1][j], arr[i + 1][j]))
    for i in (0, nc):
        for j in range(2): bm.faces.new((arr[i][j], arr[i][j + 1], aba[i][j + 1], aba[i][j]))
    cuello = malla('ropa_cuello' + sf, bm, M_ARRIBA)
    bm = bmesh.new(); zt, zb, nb, rbt = K['BOTONES']
    for k in range(nb):
        z = zt + (zb - zt) * k / max(1, nb - 1)
        hit = T3.ray_cast(V((0, -1.0, z)), V((0, 1, 0)))
        g = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=4, radius=rbt)['verts']
        for v in g: v.co = hit[0] + V((v.co.x, v.co.y * 0.4, v.co.z)) + hit[1] * rbt * 0.15
    botones = malla('ropa_botones' + sf, bm, M_BOTON)

    # ---------- abajo: short, piernas y falda ----------
    bm = bm_me(c['pantalon']); zs = c['short_z']
    cortar(bm, zs)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, zs + 0.03), plane_no=(0, 0, 1))
    for v in bm.verts:
        if v.co.z < 0.88:
            f = 1 + (K['SHORT_VUELO'] - 1) * suave((0.88 - v.co.z) / (0.88 - zs)); cx = math.copysign(PX, v.co.x)
            v.co.x = cx + (v.co.x - cx) * f; v.co.y *= f
    short = malla('ropa_short' + sf, bm, M_ABAJO)
    bm = bm_me(c['pantalon'])
    cadera = max(componentes(bm), key=lambda cc: max(v.co.z for v in cc))
    bmesh.ops.delete(bm, geom=list(cadera), context='VERTS')
    cortar(bm, K['PIERNAS'][0], quitar_abajo=False)
    for v in bm.verts:
        cx = math.copysign(PX, v.co.x); s = K['PIERNAS'][1]
        v.co.x = cx + (v.co.x - cx) * s; v.co.y *= s
    piernas = malla('ropa_piernas' + sf, bm, M_PIEL)

    bm = bmesh.new(); nf, na = K['FALDA_SEG'], K['FALDA_ANILLOS']; P = c['falda']; nt, at = K['TABLONES']
    def perfil(z):
        if z >= P[0][0]: return P[0][1:]
        for (za, *a), (zb_, *b) in zip(P, P[1:]):
            if zb_ <= z <= za:
                t = suave((za - z) / (za - zb_)); return [a[i] + (b[i] - a[i]) * t for i in range(2)]
        return P[-1][1:]
    capas = []
    for g in (0.0, -K['FALDA_GROSOR']):
        anillos = []
        for k in range(na + 1):
            z = P[0][0] + (P[-1][0] - P[0][0]) * k / na; sx, sy = perfil(z); t = k / na
            anillo = []
            for j in range(nf):
                a = 2 * math.pi * j / nf; pl = 1 + at * t * math.cos(nt * a)
                rx, ry = 0.192 * sx * pl, 0.125 * sy * pl
                n = V((math.cos(a) * ry, math.sin(a) * rx, 0)).normalized()
                anillo.append(bm.verts.new(V((rx * math.cos(a), ry * math.sin(a), z)) + n * g))
            anillos.append(anillo)
        capas.append(anillos)
    for anillos, sg in ((capas[0], 1), (capas[1], -1)):
        for a, b in zip(anillos, anillos[1:]):
            for j in range(nf):
                q = (a[j], b[j], b[(j + 1) % nf], a[(j + 1) % nf])
                bm.faces.new(q if sg > 0 else q[::-1])
    fa, fi = capas[0][-1], capas[1][-1]
    for j in range(nf): bm.faces.new((fa[j], fi[j], fi[(j + 1) % nf], fa[(j + 1) % nf]))
    falda = malla('ropa_falda' + sf, bm, M_ABAJO, normales=False)
    return {2: {'Playera': sud_torso, 'Brazos': sud_mangas, 'Capucha': capucha, 'Bolsa': bolsa, 'Cordones': cordones,
                'Short': short, 'Piernas': piernas},
            3: {'Playera': blusa, 'Cuello': cuello, 'Botones': botones, 'Falda': falda, 'Piernas': piernas}}

# ---------- figuras de muestra: Ropa_n (cuerpo H, copia de Frente) y RopaM_n (cuerpo M, copia de Mujer) ----------
col = bpy.data.collections.get('Ropa')
if not col: col = bpy.data.collections.new('Ropa'); bpy.context.scene.collection.children.link(col)
CUERPOS = [dict(sf='', playera=bpy.data.objects['Frente_Playera'].data, pantalon=bpy.data.objects['Frente_Pantalon'].data,
                nivel=1, faldon=K['FALDON'], short_z=K['SHORT_Z'], falda=K['FALDA'], fig='Ropa', fuente='Frente', x0=K['X0']),
           dict(sf='_m', playera=bpy.data.meshes['playera_m'], pantalon=bpy.data.meshes['pantalon_m'],
                nivel=0, faldon=0, short_z=K['SHORT_Z_M'], falda=K['FALDA_M'], fig='RopaM', fuente='Mujer', x0=K['X0_M'])]
SUAVE = ('Playera', 'Brazos', 'Short', 'Piernas')     # llevan subdivision como las de Frente
for c in CUERPOS:
    fuente = bpy.data.objects[c['fuente']]
    for n, partes in ropa(c).items():
        nmE = '%s_%d' % (c['fig'], n); E = bpy.data.objects.get(nmE)
        if not E: E = bpy.data.objects.new(nmE, None); col.objects.link(E)
        E.location = (c['x0'] + K['DX'] * (n - 2), 0, 0)
        for o in fuente.children:
            suf = o.name.split('_', 1)[1]
            if suf == 'Pantalon': continue
            nm = '%s_%s' % (nmE, suf); cp = bpy.data.objects.get(nm)
            if not cp:
                cp = o.copy(); cp.name = nm; col.objects.link(cp)
                cp.parent = E; cp.matrix_parent_inverse = o.matrix_parent_inverse.copy()
        for suf, me in partes.items():
            nm = '%s_%s' % (nmE, suf); o = bpy.data.objects.get(nm)
            if not o: o = bpy.data.objects.new(nm, me); col.objects.link(o)
            o.data = me; o.parent = E; o.matrix_parent_inverse.identity(); o.matrix_basis.identity()
            if suf in SUAVE and not any(m.type == 'SUBSURF' for m in o.modifiers):
                m = o.modifiers.new('Suave', 'SUBSURF'); m.levels = 1; m.render_levels = 2
        print(nmE, {k: len(m.polygons) for k, m in partes.items()}, 'caras')
print('ropa ok')
