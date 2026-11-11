# Cuerpo de mujer del chibi (mismo esqueleto): la playera de Frente con cintura marcada y la falda que se
# abre hasta medio muslo (malla 'playera_m'), y el pantalon un poco mas ancho de cadera ('pantalon_m').
# Deja la figura de muestra 'Mujer' (copia ligada de Frente con esas piezas y el peinado MUJER_PELO).
# Uso: exec(open(r'C:/Users/aris1/code/Continental/blender/cuerpo_m.py').read(), {'PRM': {...}})
import bpy, bmesh, math

K = dict(
    HOMBRO=1.35,                 # arriba de aqui la playera no se estira (solo se angosta)
    BAJO=0.62,                   # nuevo borde de abajo (medio muslo); antes 0.924
    # escala (x, y) segun la z nueva: hombros un poco mas angostos, cintura, cadera y vuelo abajo
    PERFIL=[(1.70, 0.93, 0.95), (1.50, 0.93, 0.95), (1.35, 0.90, 0.94), (1.08, 0.82, 0.88),
            (0.90, 1.00, 1.00), (0.62, 1.22, 1.12)],
    CADERA_PANT=(1.10, 1.06),    # pantalon arriba de la rodilla
    # busto: el pecho se empuja hacia afuera desde el eje (radial en xy) con peso cos(angulo desde el frente)**CP:
    # en la seccion es casi correr el pecho hacia adelante, asi queda un solo volumen redondo sin surco a los
    # lados. Centro en z = BZ; alto arriba SZ_A, abajo SZ_B (mas largo: la tela cae del busto); A = cuanto sale
    BZ=1.36, SZ_A=0.15, SZ_B=0.30, A=0.10, CP=1.3,
    CORTES=[1.46, 1.42, 1.38, 1.31],   # aros extra (antes de subdividir) para que el busto tenga forma
    X=-2.9, MUJER_PELO='pelo_5', MUJER_EXTRA=None)
K.update(globals().get('PRM', {}))

def interp(z):
    P = K['PERFIL']
    if z >= P[0][0]: return P[0][1:]
    if z <= P[-1][0]: return P[-1][1:]
    for (z0, *a), (z1, *b) in zip(P, P[1:]):
        if z1 <= z <= z0:
            t = (z0 - z) / (z0 - z1); t = t * t * (3 - 2 * t)
            return [a[i] + (b[i] - a[i]) * t for i in range(2)]

def copia(src, nombre):
    me = bpy.data.meshes.get(nombre)
    if me: bpy.data.meshes.remove(me)
    me = src.copy(); me.name = nombre; return me

fp = bpy.data.objects['Frente_Playera'].data
zb = min(v.co.z for v in fp.vertices); H = K['HOMBRO']
pm = copia(fp, 'playera_m')
for v in pm.vertices:
    z = v.co.z
    if z < H: z = H - (H - z) * (H - K['BAJO']) / (H - zb)
    sx, sy = interp(z); v.co.x *= sx; v.co.y *= sy; v.co.z = z
# aros extra + una subdivision (la malla queda ya suavizada: en el juego va con NIVEL 0) y busto
bm = bmesh.new(); bm.from_mesh(pm)
for zc in K['CORTES']:
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, zc), plane_no=(0, 0, 1))
bm.to_mesh(pm); bm.free()
tmp = bpy.data.objects.new('tmp_playera_m', pm); bpy.context.scene.collection.objects.link(tmp)
tmp.modifiers.new('s', 'SUBSURF').levels = 1
dg = bpy.context.evaluated_depsgraph_get(); sub = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
bpy.data.objects.remove(tmp, do_unlink=True); bpy.data.meshes.remove(pm); sub.name = 'playera_m'; pm = sub
for v in pm.vertices:
    r = math.hypot(v.co.x, v.co.y)
    if v.co.y >= 0 or r < 1e-6: continue
    dz = v.co.z - K['BZ']; sz = K['SZ_A'] if dz > 0 else K['SZ_B']
    d = K['A'] * math.exp(-(dz / sz) ** 2) * (-v.co.y / r) ** K['CP']
    v.co.x += d * v.co.x / r; v.co.y += d * v.co.y / r
nm_ = copia(bpy.data.objects['Frente_Pantalon'].data, 'pantalon_m')
for v in nm_.vertices:
    t = max(0.0, min(1.0, (v.co.z - 0.45) / 0.4))
    v.co.x *= 1 + (K['CADERA_PANT'][0] - 1) * t; v.co.y *= 1 + (K['CADERA_PANT'][1] - 1) * t

col = bpy.data.collections.get('Peinados') or bpy.context.scene.collection
E = bpy.data.objects.get('Mujer')
if not E: E = bpy.data.objects.new('Mujer', None); col.objects.link(E)
E.location = (K['X'], 0, 0)
cambia = {'Playera': pm, 'Pantalon': nm_, 'Pelo': bpy.data.meshes[K['MUJER_PELO']]}
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
print('cuerpo_m ok', len(pm.vertices), 'verts playera; borde', round(min(v.co.z for v in pm.vertices), 3))
