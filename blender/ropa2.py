# Ropa nueva y detalles del chibi (sobre ropa.py, que se corre primero dentro de este script):
#   1 = detalles de la manga larga y del pantalon base (resorte del cuello, dobladillo, punos, bastillas, bolsas atras)
#   4 = pantalon cargo (abajo; mas holgado, bolsas a los lados, punos en el tobillo)
#   5 = playera (manga corta con brazo de piel, cuello redondo, dobladillo)
#   6 = chamarra (torso y mangas inflados, cuello alto, cierre, bolsas de ribete, pretina y punos)
#   7 = vestido (solo M: torso de playera_m hasta la cintura, falda con vuelo, cinta en la cintura)
# Tambien pone bastilla al short (figuras Ropa_2 / RopaM_2). Figuras Ropa_n / RopaM_n con solo las partes de la prenda
# (y la cabeza/manos/zapatos para verlas); rig.py las toma con K['ROPA'] y ROPA_PIEZA.
# Uso: exec(open(r'C:/Users/aris1/code/Continental/blender/ropa2.py').read(), {'PRM': {...}})
import bpy, bmesh, math
from mathutils import Vector as V
from mathutils.bvhtree import BVHTree

_prm = globals().get('PRM', {})
exec(open(r'C:/Users/aris1/code/Continental/blender/ropa.py').read(), globals())   # helpers y ropa 2-3

K2 = dict(
    RIB=(0.007, 1.6),            # resorte del cuello: radio, alto/grueso
    DOBLADILLO=(0.008, 2.2),     # dobladillo de la playera
    PUNO=(0.008, 2.0, 0.93),     # punos: radio, alto/grueso, donde (0 hombro, 1 muneca)
    BASTILLA=(0.007, 2.0, 0.165), # bastilla del pantalon: radio, alto/grueso, z
    BOLSA_ATRAS=(0.055, 0.75, 0.87, 0.045, 0.004),   # centro x, z abajo, z arriba, medio ancho, grosor
    CARGO=(0.012, 0.03),         # cargo: inflado arriba / abajo
    CARGO_BOLSA=(0.50, 0.66, 0.05, 0.008),           # bolsa lateral: z abajo, z arriba, medio ancho (en y), grosor
    CARGO_PUNO=(0.012, 2.0, 0.17),
    MANGA_CORTA=(0.40, 0.012, 0.012),               # corte (t), inflado, vuelo extra en la orilla
    PIEL_BRAZO=-0.003,
    CHAMARRA=(0.03, 0.022),      # inflado torso, mangas
    CUELLO_ALTO=(0.013, 2.6),
    PRETINA=(0.016, 2.4),
    CIERRE=(0.0065, 1.62, 0.94),  # radio, z arriba, z abajo
    VESTIDO=dict(cintura=1.04, abajo=0.50, rx=0.36, ry=0.31, anillos=10, seg=40, tablones=(10, 0.025), grosor=0.007),
    X0=-16.0, X0_M=-26.0, DX=-1.45)
K2.update(_prm)

def ev(o_or_me, nivel=1):
    """malla con subdivision (como se ve)."""
    me = o_or_me if isinstance(o_or_me, bpy.types.Mesh) else o_or_me.data
    tmp = bpy.data.objects.new('tmp_ev', me); bpy.context.scene.collection.objects.link(tmp)
    if nivel: tmp.modifiers.new('s', 'SUBSURF').levels = nivel
    dg = bpy.context.evaluated_depsgraph_get(); out = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp, do_unlink=True); return out

def bvh_me(me): return BVHTree.FromPolygons([v.co.copy() for v in me.vertices], [p.vertices[:] for p in me.polygons])

def seccion(me, co, no, filtro=None):
    """aros donde el plano (co, no) corta la malla: lista de [puntos] ordenados alrededor de su centro."""
    bm = bmesh.new(); bm.from_mesh(me)
    r = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=co, plane_no=no)
    corte = [e for e in r['geom_cut'] if isinstance(e, bmesh.types.BMEdge)]
    par = {}
    def raiz(v):
        while par.get(v, v) is not v: v = par[v]
        return v
    for e in corte:
        a, b = raiz(e.verts[0]), raiz(e.verts[1])
        if a is not b: par[a] = b
    grupos = {}
    for e in corte:
        for v in e.verts: grupos.setdefault(raiz(v), set()).add(v)
    no = V(no).normalized(); a = no.orthogonal().normalized(); b = no.cross(a)
    out = []
    for g in grupos.values():
        pts = [v.co.copy() for v in g]
        if len(pts) < 6: continue
        c = sum(pts, V()) / len(pts)
        if filtro and not filtro(c): continue
        pts.sort(key=lambda p: math.atan2((p - c).dot(b), (p - c).dot(a)))
        lim = [pts[0]]
        for p in pts[1:]:
            if (p - lim[-1]).length > 0.004: lim.append(p)
        if len(lim) > 5: out.append(lim)
    bm.free(); return out

def aro(bm, pts, r, eje, aplana=1.0, lados=6, sale=0.4):
    """tubo cerrado por el aro pts (resorte, puno, bastilla); eje = direccion del 'alto' (aplana lo estira ahi)."""
    n = len(pts); c = sum(pts, V()) / n; eje = V(eje).normalized(); anillos = []
    for i in range(n):
        t = (pts[(i + 1) % n] - pts[i - 1]).normalized()
        A = (eje - t * eje.dot(t)).normalized(); B = t.cross(A)
        fuera = (pts[i] - c); fuera -= eje * fuera.dot(eje); fuera.normalize()
        if B.dot(fuera) < 0: B = -B
        p = pts[i] + fuera * r * sale
        anillos.append([bm.verts.new(p + r * (math.cos(2 * math.pi * j / lados) * A * aplana
                                              + math.sin(2 * math.pi * j / lados) * B)) for j in range(lados)])
    for i in range(n):
        a, b = anillos[i], anillos[(i + 1) % n]
        for j in range(lados): bm.faces.new((a[j], a[(j + 1) % lados], b[(j + 1) % lados], b[j]))

def reduce(pts, k):
    pts = pts[::max(1, len(pts) // k)]; out = [pts[0]]
    for p in pts[1:]:
        if (p - out[-1]).length > 0.004: out.append(p)
    if len(out) > 3 and (out[-1] - out[0]).length < 0.004: out.pop()
    return out

def parche_dir(bm, T, punto, d, ancho, alto, grosor, nu=6, nv=4, base=0.003):
    """placa sobre T: punto(u, v) -> punto 3D en un plano (u en [-1, 1], v en [0, 1]); rayos en direccion d."""
    d = V(d).normalized(); arr, aba = [], []
    for j in range(nv + 1):
        fa, fb = [], []
        for i in range(nu + 1):
            u = -1 + 2 * i / nu; v = j / nv; q = punto(u, v)
            hit = T.ray_cast(q - d * 0.5, d)
            p, n = (hit[0], hit[1]) if hit[0] is not None else (q, -d)
            g = grosor * (0.6 + 0.4 * math.sqrt(max(0.0, 1 - u * u)))
            fa.append(bm.verts.new(p + n * (base + g))); fb.append(bm.verts.new(p + n * base))
        arr.append(fa); aba.append(fb)
    for j in range(nv):
        for i in range(nu):
            bm.faces.new((arr[j][i], arr[j][i + 1], arr[j + 1][i + 1], arr[j + 1][i]))
            bm.faces.new((aba[j][i], aba[j + 1][i], aba[j + 1][i + 1], aba[j][i + 1]))
    for j in range(nv):
        for i in (0, nu): bm.faces.new((arr[j][i], arr[j + 1][i], aba[j + 1][i], aba[j][i]))
    for j in (0, nv):
        for i in range(nu): bm.faces.new((arr[j][i], aba[j][i], aba[j][i + 1], arr[j][i + 1]))

def eje_brazo(me, s):
    S = V((s * K['HOMBRO'][0], K['HOMBRO'][1], K['HOMBRO'][2]))
    W = min((v.co for v in me.vertices if v.co.x * s > 0), key=lambda c: c.z)
    return S, W

def punos(bm, me_brazos, t, r, aplana, inflado=0.0):
    for s in (1, -1):
        S, W = eje_brazo(me_brazos, s); a = (W - S).normalized(); co = S + (W - S) * t
        for pts in seccion(me_brazos, co, a, lambda c: c.x * s > 0)[:1]:
            aro(bm, reduce(pts, 16), r + inflado, a, aplana, lados=5)

def cuello_aro(me_torso, r, aplana, bm, alto=0.0):
    """aro sobre la orilla del cuello (borde abierto de arriba del torso)."""
    b2 = bmesh.new(); b2.from_mesh(me_torso)
    borde = [v for v in b2.verts if v.is_boundary]
    if not borde: b2.free(); return
    zt = max(v.co.z for v in borde); pts = [v.co.copy() for v in borde if v.co.z > zt - 0.08]
    c = sum(pts, V()) / len(pts); pts.sort(key=lambda p: math.atan2(p.y - c.y, p.x - c.x))
    b2.free()
    pts = [p + V((0, 0, alto)) for p in reduce(pts, 24)]
    aro(bm, pts, r, (0, 0, 1), aplana, sale=0.2)

def dobladillo(me_torso, z, r, aplana, bm):
    for pts in seccion(me_torso, (0, 0, z), (0, 0, 1))[:1]: aro(bm, reduce(pts, 28), r, (0, 0, 1), aplana)

def bastillas(me_pant, z, r, aplana, bm):
    for pts in seccion(me_pant, (0, 0, z), (0, 0, 1)):
        if abs(sum(p.x for p in pts) / len(pts)) > 0.03: aro(bm, reduce(pts, 18), r, (0, 0, 1), aplana, lados=5)

def bolsas_atras(T, bm):
    cx, z0, z1, w, g = K2['BOLSA_ATRAS']
    for s in (1, -1):
        parche_dir(bm, T, lambda u, v: V((s * cx + u * w * (1 - 0.45 * suave((v - 0.6) / 0.4)), 0.4, z1 + (z0 - z1) * v)),
                   (0, -1, 0), w, 0, g)

def piernas_sin_cadera(me):
    bm = bm_me(me); cad = max(componentes(bm), key=lambda cc: max(v.co.z for v in cc))
    return bm, cad

# ---------- pantalon del hombre sin escalon de panal (como cuerpo_m.py): la cadera se mete y sube bajo la playera ----------
def sin_panal(src, nombre):
    me = bpy.data.meshes.get(nombre) or bpy.data.meshes.new(nombre)
    bm = bmesh.new(); bm.from_mesh(src); cad = max(componentes(bm), key=lambda cc: max(v.co.z for v in cc))
    for v in bm.verts:
        z = v.co.z
        if v in cad:
            k = suave((0.9 - z) / 0.1); v.co.x *= 1 - 0.1 * k; v.co.y *= 1 - 0.05 * k
            if z < 0.95: v.co.z = 0.95 - (0.95 - z) * (0.95 - 0.895) / (0.95 - 0.796)
        elif z > 0.7: v.co.z = 0.7 + (z - 0.7) * (0.96 - 0.7) / 0.18
    bm.to_mesh(me); bm.free(); me.materials.clear(); me.materials.append(src.materials[0]); return me
_fp = bpy.data.objects['Frente_Pantalon']
if _fp.data.name != 'pantalon_h':
    _fp.data = sin_panal(bpy.data.meshes['chibi_Frente_Pantalon'], 'pantalon_h')
    CUERPOS[0]['pantalon'] = _fp.data
    exec(open(r'C:/Users/aris1/code/Continental/blender/ropa.py').read(), globals())   # short y piernas con el pantalon nuevo

# ---------- prendas por cuerpo ----------
def prendas(c):
    sf = c['sf']; out = {}
    tor = ev(c['playera'], c['nivel']); T_tor = bvh_me(tor)
    brz = ev(c['brazos'], 1); pan = ev(c['pantalon'], 1); T_pan = bvh_me(pan)
    hem = min(v.co.z for v in tor.vertices)

    # 1: detalles de la manga larga y el pantalon base
    bm = bmesh.new(); cuello_aro(tor, *K2['RIB'], bm); dobladillo(tor, hem + 0.012, *K2['DOBLADILLO'], bm)
    rib1 = malla('ropa_ribete_1' + sf, bm, M_ARRIBA)
    bm = bmesh.new(); r, ap, t = K2['PUNO']; punos(bm, brz, t, r, ap); puno1 = malla('ropa_puno_1' + sf, bm, M_ARRIBA)
    bm = bmesh.new(); r, ap, z = K2['BASTILLA']; bastillas(pan, z, r, ap, bm); bast1 = malla('ropa_bastilla_1' + sf, bm, M_ABAJO)
    bm = bmesh.new(); bolsas_atras(T_pan, bm); bol1 = malla('ropa_bolsillo_1' + sf, bm, M_ABAJO)
    out[1] = {'Ribete': rib1, 'Puno': puno1, 'Bastilla': bast1, 'Bolsillo': bol1}

    # 2: bastilla del short
    sh = bpy.data.meshes['ropa_short' + sf]; bm = bmesh.new()
    zs = min(v.co.z for v in sh.vertices)
    bastillas(ev(sh, 1), zs + 0.012, 0.008, 2.2, bm)
    out[2] = {'Bastilla': malla('ropa_bastilla_2' + sf, bm, M_ABAJO)}

    # 4: cargo
    bm = bm_me(c['pantalon']); a0, a1 = K2['CARGO']
    inflar(bm, lambda v: a0 + (a1 - a0) * suave((0.75 - v.co.z) / 0.6))
    for v in bm.verts:     # el tobillo se cierra (jogger)
        if v.co.z < 0.2:
            cx = math.copysign(PX, v.co.x); f = 1 - 0.25 * suave((0.2 - v.co.z) / 0.1)
            v.co.x = cx + (v.co.x - cx) * f; v.co.y *= f
    cargo = malla('ropa_cargo' + sf, bm, M_ABAJO); cev = ev(cargo, 1); T_c = bvh_me(cev)
    bm = bmesh.new(); r, ap, z = K2['CARGO_PUNO']; bastillas(cev, z, r, ap, bm)
    z0, z1, w, g = K2['CARGO_BOLSA']
    for s in (1, -1):
        parche_dir(bm, T_c, lambda u, v: V((s * 0.5, u * w, z1 + (z0 - z1) * v)), (-s, 0, 0), w, 0, g)
        parche_dir(bm, T_c, lambda u, v: V((s * 0.5, u * w * 1.1, z1 + 0.012 - 0.03 * v)), (-s, 0, 0), w, 0, g * 0.7, nv=1)  # solapa
    bolsas_atras(T_c, bm)
    out[4] = {'Pantalon': cargo, 'Bastilla': malla('ropa_cargo_det' + sf, bm, M_ABAJO)}

    # 5: playera manga corta
    bm = bm_me(c['playera']); inflar(bm, lambda v: 0.005); play = malla('ropa_playera' + sf, bm, M_ARRIBA)
    pev = ev(play, c['nivel'])
    bm = bmesh.new(); cuello_aro(pev, 0.008, 1.8, bm); dobladillo(pev, hem + 0.012, 0.008, 2.2, bm)
    rib5 = malla('ropa_ribete_5' + sf, bm, M_ARRIBA)
    tc, inf, vu = K2['MANGA_CORTA']; bm = bm_me(c['brazos'])
    for s in (1, -1):
        S, W = eje_brazo(c['brazos'], s); a = (W - S).normalized(); co = S + (W - S) * tc
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=co, plane_no=a)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.x * s > 0 and (v.co - co).dot(a) > 1e-5], context='VERTS')
    tm = t_manga(bm)
    inflar(bm, lambda v: inf + vu * suave((tm.get(v, 0) - 0.7) / 0.3))
    manga5 = malla('ropa_manga_corta' + sf, bm, M_ARRIBA)
    bm = bmesh.new(); mev = ev(manga5, 1); punos(bm, mev, 0.9, 0.007, 2.0)   # t de la manga cortada: 1 en la orilla
    puno5 = malla('ropa_puno_5' + sf, bm, M_ARRIBA)
    bm = bm_me(c['brazos']); inflar(bm, lambda v: K2['PIEL_BRAZO']); piel = malla('ropa_brazo_piel' + sf, bm, M_PIEL)
    out[5] = {'Playera': play, 'Ribete': rib5, 'Brazos': manga5, 'Puno': puno5, 'BrazoPiel': piel}

    # 6: chamarra
    it, im = K2['CHAMARRA']
    bm = bm_me(c['playera']); inflar(bm, lambda v: it); cham = malla('ropa_chamarra' + sf, bm, M_ARRIBA)
    cev = ev(cham, c['nivel']); T_ch = bvh_me(cev); hem6 = min(v.co.z for v in cev.vertices)
    bm = bmesh.new(); cuello_aro(cev, *K2['CUELLO_ALTO'], bm, alto=0.012); dobladillo(cev, hem6 + 0.014, *K2['PRETINA'], bm)
    for s in (1, -1):   # bolsas de ribete (diagonales)
        pts = []
        for k in range(5):
            x = s * (0.10 + 0.03 * k / 4); z = 1.02 + 0.07 * k / 4
            hit = T_ch.ray_cast(V((x, -1, z)), V((0, 1, 0)))
            if hit[0] is not None: pts.append(hit[0] + hit[1] * 0.002)
        if len(pts) > 2: tubo(bm, pts, [0.0055] * len(pts), 6, aplana=0.5)
    rib6 = malla('ropa_ribete_6' + sf, bm, M_ARRIBA)
    bm = bmesh.new(); r, ztop, zbot = K2['CIERRE']; pts = []
    for k in range(16):
        z = ztop + (zbot - ztop) * k / 15; hit = T_ch.ray_cast(V((0, -1, z)), V((0, 1, 0)))
        if hit[0] is not None: pts.append(hit[0] + hit[1] * r * 0.6)
    tubo(bm, pts, [r] * len(pts), 6, aplana=0.6)
    if pts:   # jaladera
        g = bmesh.ops.create_cube(bm, size=1)['verts']
        for v in g: v.co = pts[1] + V((v.co.x * 0.012, v.co.y * 0.006, v.co.z * 0.028 - 0.016))
    cierre = malla('ropa_cierre' + sf, bm, M_BOTON)
    bm = bm_me(c['brazos']); tm = t_manga(bm); p0, p1 = K['PUNO_T']
    inflar(bm, lambda v: im + (0.006 - im) * suave((tm[v] - p0) / (p1 - p0)))
    manga6 = malla('ropa_manga_chamarra' + sf, bm, M_ARRIBA)
    bm = bmesh.new(); punos(bm, ev(manga6, 1), 0.92, 0.011, 2.4); puno6 = malla('ropa_puno_6' + sf, bm, M_ARRIBA)
    out[6] = {'Playera': cham, 'Ribete': rib6, 'Cierre': cierre, 'Brazos': manga6, 'Puno': puno6}

    # 7: vestido (solo M)
    if c['vestido']:
        P = K2['VESTIDO']; zc = P['cintura']
        bm = bm_me(c['playera']); inflar(bm, lambda v: 0.004)
        cortar(bm, zc - 0.02)
        top = malla('ropa_vestido_torso' + sf, bm, M_ARRIBA); T_v = bvh_me(top)
        bm = bmesh.new(); nf, na = P['seg'], P['anillos']; nt, at = P['tablones']
        arriba = []
        for j in range(nf):
            a = 2 * math.pi * j / nf; d = V((math.cos(a), math.sin(a), 0))
            hit = T_v.ray_cast(V((0, 0, zc)) + d * 0.6, -d)
            arriba.append((hit[0] if hit[0] is not None else V((0, 0, zc)) + d * 0.2) + d * 0.002)
        capas = []
        for g in (0.0, -P['grosor']):
            anillos = []
            for k in range(na + 1):
                t = k / na; z = zc + (P['abajo'] - zc) * t; e = suave(t) ** 0.8; anillo = []
                for j in range(nf):
                    a = 2 * math.pi * j / nf; pl = 1 + at * t * math.cos(nt * a)
                    q0 = arriba[j]; q1 = V((P['rx'] * math.cos(a), P['ry'] * math.sin(a), 0))
                    x = (q0.x + (q1.x - q0.x) * e) * pl; y = (q0.y + (q1.y - q0.y) * e) * pl
                    n = V((x, y, 0)).normalized()
                    anillo.append(bm.verts.new(V((x, y, z)) + n * g))
                anillos.append(anillo)
            capas.append(anillos)
        for anillos, sg in ((capas[0], 1), (capas[1], -1)):
            for a, b in zip(anillos, anillos[1:]):
                for j in range(nf):
                    q = (a[j], b[j], b[(j + 1) % nf], a[(j + 1) % nf]); bm.faces.new(q if sg > 0 else q[::-1])
        fa, fi = capas[0][-1], capas[1][-1]
        for j in range(nf): bm.faces.new((fa[j], fi[j], fi[(j + 1) % nf], fa[(j + 1) % nf]))
        falda = malla('ropa_vestido_falda' + sf, bm, M_ARRIBA, normales=False)
        bm = bmesh.new(); aro(bm, arriba[::2], 0.011, (0, 0, 1), 2.0, sale=0.6); cuello_aro(top, 0.008, 1.8, bm)
        cinta = malla('ropa_vestido_cinta' + sf, bm, M_ARRIBA)
        out[7] = {'Playera': top, 'Vestido': falda, 'Ribete': cinta}
    for m in (tor, brz, pan): bpy.data.meshes.remove(m)
    return out

# ---------- figuras ----------
col = bpy.data.collections['Ropa']
SUAVE2 = ('Playera', 'Brazos', 'BrazoPiel', 'Pantalon')
VER = ('Cabeza', 'Ojos', 'Piel', 'Boca', 'Cejas', 'Nariz', 'Pelo', 'Manos', 'Zapatos', 'Suelas')   # para verlas en Blender
CUERPOS2 = [dict(CUERPOS[0], vestido=False, x0=K2['X0']), dict(CUERPOS[1], vestido=True, x0=K2['X0_M'])]
for c in CUERPOS2:
    fuente = bpy.data.objects[c['fuente']]
    for n, partes in prendas(c).items():
        nmE = '%s_%d' % (c['fig'], n); E = bpy.data.objects.get(nmE)
        if not E:
            E = bpy.data.objects.new(nmE, None); col.objects.link(E)
            E.location = (c['x0'] + K2['DX'] * n, 0, 0)
        if n != 2:
            for o in fuente.children:
                suf = o.name.split('_', 1)[1]
                if suf not in VER: continue
                nm = '%s_%s' % (nmE, suf); cp = bpy.data.objects.get(nm)
                if not cp:
                    cp = o.copy(); cp.name = nm; col.objects.link(cp)
                    cp.parent = E; cp.matrix_parent_inverse = o.matrix_parent_inverse.copy()
                cp.data = o.data
            # lo que falta para verla completa (Ver*: rig.py no las toma)
            ver = {}
            if 'Playera' not in partes: ver['VerPlayera'] = (fuente.name + '_Playera', None)
            if 'Brazos' not in partes: ver['VerBrazos'] = (fuente.name + '_Brazos', None)
            if n == 7: ver['VerPiernas'] = (None, bpy.data.meshes['ropa_piernas' + c['sf']])
            elif 'Pantalon' not in partes: ver['VerPantalon'] = (fuente.name + '_Pantalon', None)
            for suf, (on, me) in ver.items():
                src = bpy.data.objects[on] if on else None
                nm = '%s_%s' % (nmE, suf); cp = bpy.data.objects.get(nm)
                if not cp:
                    cp = src.copy() if src else bpy.data.objects.new(nm, me); cp.name = nm; col.objects.link(cp)
                    cp.parent = E; cp.matrix_parent_inverse = src.matrix_parent_inverse.copy() if src else cp.matrix_parent_inverse
                cp.data = src.data if src else me
        for suf, me in partes.items():
            nm = '%s_%s' % (nmE, suf); o = bpy.data.objects.get(nm)
            if not o: o = bpy.data.objects.new(nm, me); col.objects.link(o)
            o.data = me; o.parent = E; o.matrix_parent_inverse.identity(); o.matrix_basis.identity()
            if suf in SUAVE2 and not any(m.type == 'SUBSURF' for m in o.modifiers):
                m = o.modifiers.new('Suave', 'SUBSURF'); m.levels = 1; m.render_levels = 2
        print(nmE, {k: len(m.polygons) for k, m in partes.items()})
print('ropa2 ok')
