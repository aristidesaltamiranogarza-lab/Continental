# casona.py — Maqueta de cajas de la casona (paso 1 de CASONA.md). Datos del anteproyecto:
# https://claude.ai/artifact/PX1g934RWSsWF4VdTB7Doa  (plano: x 0-36, z 0 en la fachada hacia atras).
# En three: X = x-18, Z = 17-z (la fachada mira a +Z, hacia la camara). Cada nivel se arma a su altura real y
# se exporta en su propio GLB con el piso en y=0: modelos/casona/{nm1,n0,n1,n2}.glb.
# Muros y barandales llevan extras {tipo, seg:[ax,az,bx,bz] en coords de three, r} para los choques; empties:
# mesa_<juego> (extras juego, fam c/t/k/f, libre, r), escalera_sube_<n>/escalera_baja_<n> (extras to = nivel destino,
# r, pie = [dx,dz] del punto al que caminas), llegada_<n>, llegada_escalera_<n>, plano_<lugar>_<n> (ry), puerta_<x>_<n>, maniqui. Escalones: extra escalera sube/baja.
# c_casa_marcas.js (MARC) lee todo eso; tests/casona_marcas.js lo revisa en los GLB.
# Uso (MCP): m=types.ModuleType('casona'); exec(open(RUTA).read(), m.__dict__); m.armar(); m.exportar()
import bpy, math, os

RAIZ = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else ''
if os.path.basename(RAIZ) != 'blender': RAIZ = os.path.join(os.getcwd(), 'blender')   # con --python-expr: la carpeta actual es el repo
SALIDA = os.path.join(os.path.dirname(RAIZ), 'modelos', 'casona')
K = dict(t=.3, puerta=3.6, losa=.3, barandal=2.0, barda=2.4, pretil=2.0, ante=1.4, vent=4.0, esc=.35)

# escalera de los 4 niveles: tramos de 2.8 (sube y baja) centrados con la puerta (z 13.5), 8 escalones de .45 desde x0 hacia -x
ESC = dict(n=8, paso=.45, x0=5.4, sube=(10.6, 13.4), baja=(13.6, 16.4), llegada=(7.2, 13.5))
ORDEN = ['nm1', 'n0', 'n1', 'n2']   # de abajo hacia arriba: la escalera sube al siguiente y baja al anterior
FAM = dict(continental='c', monopolydeal='c', uno='c', rummy='c', merida='t', haciendas='t', backgammon='t', conecta4='t')  # el resto: casino 'k'
COLS = [(12,14),(16,14),(20,14),(24,14),(12,18),(12,22),(12,26),(12,30),(24,18),(24,22),(24,26),(24,30),(16,30),(20,30)]

# areas: (x, z, ancho, fondo, clase, tinte, nombre). clase: None = cuarto con muros; open; void; earth; street
NIV = {
 'nm1': dict(elev=-3.5, H=3.2, per=(0,0,36,30), sube=True, baja=False,
  areas=[(0,0,14,10,None,'tk','cantina'),(14,0,22,10,None,'tk','casino'),(0,10,8,7,None,'th','escalera'),
         (8,10,20,4,None,'th','pasillo'),(8,14,4,3,None,'th','pasillo2'),(0,17,12,13,None,'tk','billar'),
         (28,10,8,10,None,'th','cava'),(28,20,8,10,None,'tk','oscuro'),(12,14,16,16,'earth','tierra','tierra')],
  gaps=[(14,2.5,14,7.5,'casino'),(8,10.8,8,13.4,'escalera'),(9.5,10,12.5,10,'cantina'),(18,10,21,10,'casino2'),
        (8.6,14,11.4,14,None),(8.6,17,11.4,17,'billar'),(28,10.8,28,13.2,'cava'),(30.5,20,32.5,20,'ruleta')],
  mesas=[('cubilete',10.6,4.4,.8,0),('poker',20,5.2,2,0),('blackjack',30,3.4,2.3,0),('billar',6,23.4,1.6,0),('ruleta',32,25,1.3,0)],
  deco=[('caja','barra',5,1,8.4,.8,1.2),('caja','rockola',.4,7.6,1,1.5,1.8)]+[('cil','barrica%d%d'%(x,z),x,z,.75,1.4) for x in (30.2,32.2,34.2) for z in (15.4,17.6)]),
 'n0': dict(elev=0, H=5.5, per=(0,0,36,34), sube=True, baja=True,
  areas=[(0,-3,36,3,'street','calle','calle'),(0,0,16,10,None,'tc','salon'),(16,0,5,10,None,'th','zaguan'),(21,0,15,10,None,'tc','comedor'),
         (8,10,20,4,'open','tg','corredor'),(8,14,4,16,'open','tg','corredor_o'),(24,14,4,16,'open','tg','corredor_e'),(8,30,20,4,'open','tg','corredor_n'),
         (12,14,12,16,'open','tp','patio'),(0,34,36,14,'open','tp','traspatio'),(0,10,8,7,None,'th','escalera'),(0,17,8,5,None,'th','bano'),
         (0,22,8,12,None,'tf','libre'),(28,10,8,12,None,'th','cocina'),(28,22,8,6,None,'th','despensa'),(28,28,8,6,None,'th','servicio')],
  barda=(0,34,36,14),
  gaps=[(17,0,20,0,'zaguan'),(16,3,16,7,'salon'),(21,3,21,7,'comedor'),(11,10,13.5,10,None),(17,10,20,10,'patio'),(22.5,10,25,10,None),
        (8,11.5,8,15.5,'escalera'),(8,18.5,8,20.5,'bano'),(8,26,8,29,'libre'),(28,14,28,17,'cocina'),(30.5,22,32.5,22,None),(30.5,28,32.5,28,None),
        (30.5,34,33,34,None),(16,34,20,34,'traspatio')],
  wins=[(2,0,5.5,0),(9,0,12.5,0),(24.5,0,28,0),(31.5,0,35,0)], cols=True,
  mesas=[('continental',6.5,5.4,1.9,0),('monopolydeal',28.5,5.4,1.9,0),('uno',16.6,20,1.9,0),('domino',4,28.3,1.5,1)],
  deco=[('arbol','arbol',20.8,25.6,3.4),('arbol','mamey',6,41,3.2),('caja','mecedora',11.6,6.6,1.3,1.3,1.4),('caja','mecedora2',13.6,6.6,1.3,1.3,1.4),
        ('caja','lavadero',31,35.4,3,1.4,1.2),('cil','pozo_agua',14,44.6,.9,1.0),('caja','hamaca',8.2,21.7,3.6,.6,1.6)]),
 'n1': dict(elev=5.8, H=4.2, per=(0,0,36,30), sube=True, baja=True, abajo=-5.8,
  areas=[(0,0,16,10,None,'tt','biblioteca'),(16,0,5,10,None,'th','antesala'),(21,0,15,10,None,'tt','tableros'),
         (8,10,20,4,'open','tg','corredor'),(8,14,4,16,'open','tg','corredor_o'),(24,14,4,16,'open','tg','corredor_e'),
         (0,10,8,7,None,'th','escalera'),(0,17,8,13,None,'th','tucuarto'),(28,10,8,20,None,'th','musica'),(12,14,12,16,'void','',' vacio')],
  balc=[(3,-1.3,10,1.3),(16.8,-1.3,3.4,1.3),(24,-1.3,9,1.3)],
  gaps=[(16,3,16,7,None),(21,3,21,7,None),(11,10,13.5,10,'biblioteca'),(17,10,20,10,None),(22.5,10,25,10,'tableros'),(8,11.5,8,15.5,'escalera'),
        (8,22,8,25,'tucuarto'),(28,18,28,21,'musica'),(4.5,0,7,0,None),(9,0,11.5,0,None),(17.3,0,19.7,0,None),(25.5,0,28,0,None),(29.5,0,32,0,None)],
  rail=(12,14,12,16), cols=True,
  mesas=[('merida',8,5.2,2.1,0),('haciendas',28.5,5.2,1.9,0),('backgammon',32,24.5,.7,0)],
  deco=[('caja','ropero',.3,23.4,.8,3.4,3.0),('caja','cama',3.4,26.2,3.6,3.5,1.0),('caja','radio',34.4,14,1.2,1.6,1.6)]),
 'n2': dict(elev=10.3, H=4.2, per=(0,0,36,30), pretil=True, sube=False, baja=True, abajo=-10.3,
  areas=[(0,0,16,10,'open','ta','pergola'),(16,0,20,10,'open','ta','azotea'),(8,10,4,20,'open','ta','azotea_o'),(12,10,12,4,'open','ta','azotea_s'),
         (0,17,8,13,'open','ta','mirador'),(24,10,12,20,'open','ta','tendedero'),(0,10,8,7,None,'th','escalera'),(12,14,12,16,'void','','vacio')],
  gaps=[(8,11.5,8,15.5,'escalera')], rail=(12,14,12,16),
  mesas=[('rummy',8,5.2,1.9,0),('conecta4',24,5,.8,0),('loteria',4.6,23.8,1.6,1)],
  deco=[('pergola','pergola',0,0,16,10),('cil','tinaco',31,12.8,1.1,2.2),('cil','tinaco2',33.8,12.8,1.1,2.2)]+[('caja','tendedero%d'%i,26,z-.05,8.6,.1,2.6) for i,z in enumerate((19,20.6,22.2))]),
}

COLOR = dict(muro=(.86,.78,.66), dintel=(.86,.78,.66), antepecho=(.86,.78,.66), columna=(.93,.9,.84), barandal=(.25,.2,.17), barda=(.8,.7,.58),
 pretil=(.9,.86,.8), losa=(.5,.45,.4), escalon=(.66,.36,.24), tierra=(.36,.28,.2), calle=(.42,.42,.44), piso_tc=(.74,.86,.77), piso_tt=(.74,.8,.9),
 piso_tk=(.88,.74,.76), piso_th=(.9,.88,.83), piso_tg=(.84,.82,.74), piso_tp=(.62,.76,.52), piso_ta=(.9,.8,.62), piso_tf=(.95,.94,.9),
 arbol=(.36,.56,.3), tronco=(.4,.28,.18), deco=(.6,.5,.4), pergola=(.45,.3,.18), maniqui=(.2,.5,.8), ref=(.9,.3,.3))

def P(x,y,z): return (x,-z,y)            # three -> Blender
def X(x): return x-18
def Z(z): return 17-z

def mat(n):
    m = bpy.data.materials.get(n)
    if m: return m
    m = bpy.data.materials.new(n); m.use_nodes = True
    b = next(nd for nd in m.node_tree.nodes if nd.type == 'BSDF_PRINCIPLED')
    c = COLOR.get(n, (.7,.7,.7)); b.inputs['Base Color'].default_value = (*c, 1); b.inputs['Roughness'].default_value = .9
    m.diffuse_color = (*c, 1); return m

def caja(col, nombre, x0, x1, y0, y1, z0, z1, m, **ex):
    """Caja en coords de three (min/max). Origen al centro."""
    cx, cy, cz = (x0+x1)/2, (y0+y1)/2, (z0+z1)/2; hx, hy, hz = (x1-x0)/2, (y1-y0)/2, (z1-z0)/2
    v = [P(sx*hx, sy*hy, sz*hz) for sx in (-1,1) for sy in (-1,1) for sz in (-1,1)]
    f = [(0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3)]
    me = bpy.data.meshes.new(nombre); me.from_pydata(v, [], f); me.update()
    # caras hacia afuera
    import bmesh; bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
    me.materials.append(mat(m))
    o = bpy.data.objects.new(nombre, me); o.location = P(cx, cy, cz); col.objects.link(o)
    for k, val in ex.items(): o[k] = val
    return o

def cil(col, nombre, x, z, r, y0, y1, m, n=16):
    bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r, depth=y1-y0, location=P(x,(y0+y1)/2,z))
    o = bpy.context.active_object; o.name = nombre; o.data.materials.append(mat(m))
    for c in o.users_collection: c.objects.unlink(o)
    col.objects.link(o); return o

def esfera(col, nombre, x, y, z, r, m):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=r, location=P(x,y,z))
    o = bpy.context.active_object; o.name = nombre; o.data.materials.append(mat(m)); o.scale = (1,1,.6)
    for c in o.users_collection: c.objects.unlink(o)
    col.objects.link(o); return o

def vacio(col, nombre, x, y, z, **ex):
    o = bpy.data.objects.new(nombre, None); o.empty_display_type = 'PLAIN_AXES'; o.empty_display_size = .8
    o.location = P(x, y, z); col.objects.link(o)
    for k, val in ex.items(): o[k] = val
    return o

# ---------- muros: lineas en piezas de 0.1, sin duplicados ----------
def piezas(x0, z0, x1, z1):
    a, b = round(x0*10), round(x1*10); c, d = round(z0*10), round(z1*10)
    if c == d: return {('h', c, i) for i in range(min(a,b), max(a,b))}
    return {('v', a, i) for i in range(min(c,d), max(c,d))}

def rect(x, z, w, d):
    return piezas(x,z,x+w,z) | piezas(x,z+d,x+w,z+d) | piezas(x,z,x,z+d) | piezas(x+w,z,x+w,z+d)

def tramos(ps):
    """Junta piezas contiguas de la misma linea: [(eje, linea, i0, i1)]."""
    out = []; por = {}
    for e, l, i in ps: por.setdefault((e, l), []).append(i)
    for (e, l), ii in por.items():
        ii.sort(); s = p = ii[0]
        for i in ii[1:] + [None]:
            if i is not None and i == p + 1: p = i; continue
            out.append((e, l, s, p + 1))
            if i is not None: s = p = i
    return sorted(out)

def tramo_caja(col, nombre, e, l, i0, i1, y0, y1, m, grueso, ext=0, choque=None):
    t = grueso/2; L = l/10; a = i0/10 - ext; b = i1/10 + ext
    if e == 'h': x0, x1, z0, z1 = X(a), X(b), Z(L)-t, Z(L)+t; seg = [X(i0/10), Z(L), X(i1/10), Z(L)]
    else: x0, x1, z0, z1 = X(L)-t, X(L)+t, Z(b), Z(a); seg = [X(L), Z(i0/10), X(L), Z(i1/10)]
    ex = dict(tipo=m)
    if choque is not None: ex.update(seg=[round(v,3) for v in seg], r=round(choque,3))
    return caja(col, nombre, x0, x1, y0, y1, min(z0,z1), max(z0,z1), m, **ex)

def coleccion(n):
    c = bpy.data.collections.get(n)
    if c:
        for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    else:
        c = bpy.data.collections.new(n); bpy.context.scene.collection.children.link(c)
    return c

def nivel(nid, N):
    col = coleccion(nid); E = N['elev']; H = N['H']; t = K['t']; pre = nid + '_'
    def C(o): o.location.z += E; return o       # a su altura real en Blender (se resta al exportar)
    W, G, Wn, R, B, Pt = set(), set(), set(), set(), set(), set()
    for x, z, w, d, k, tin, n in N['areas']:
        if k is None: W |= rect(x, z, w, d)
    px, pz, pw, pd = N['per']
    if N.get('pretil'): Pt |= rect(px, pz, pw, pd)
    else: W |= rect(px, pz, pw, pd)
    for g in N.get('gaps', []): G |= piezas(*g[:4])
    for g in N.get('wins', []): Wn |= piezas(*g)
    if N.get('rail'): R |= rect(*N['rail'])
    if N.get('barda'): B |= rect(*N['barda'])
    for b in N.get('balc', []):
        bx, bz, bw, bd = b; R |= piezas(bx, bz, bx+bw, bz) | piezas(bx, bz, bx, bz+bd) | piezas(bx+bw, bz, bx+bw, bz+bd)
    R -= W; B -= W; Pt -= W
    lleno = {p for p in W if p not in G and p not in Wn}; puerta = {p for p in W if p in G}; vent = {p for p in W if p in Wn and p not in G}
    i = 0
    for tr in tramos(lleno): i += 1; C(tramo_caja(col, pre+'muro_%d' % i, *tr, 0, H, 'muro', t, ext=t/2, choque=t/2+.15))
    for tr in tramos(vent):
        i += 1; C(tramo_caja(col, pre+'antepecho_%d' % i, *tr, 0, K['ante'], 'antepecho', t, choque=t/2+.15))
        C(tramo_caja(col, pre+'dintel_%d' % i, *tr, K['vent'], H, 'dintel', t))
    if H > K['puerta']:
        for tr in tramos(puerta): i += 1; C(tramo_caja(col, pre+'dintel_%d' % i, *tr, K['puerta'], H, 'dintel', t))
    for tr in tramos(R): i += 1; C(tramo_caja(col, pre+'barandal_%d' % i, *tr, 0, K['barandal'], 'barandal', .12, choque=.3))
    for tr in tramos(B): i += 1; C(tramo_caja(col, pre+'barda_%d' % i, *tr, 0, K['barda'], 'barda', t, ext=t/2, choque=t/2+.15))
    for tr in tramos(Pt): i += 1; C(tramo_caja(col, pre+'pretil_%d' % i, *tr, 0, K['pretil'], 'pretil', t, ext=t/2, choque=t/2+.15))
    # puertas con nombre: empties al centro del vano
    for g in N.get('gaps', []):
        if g[4]: C(vacio(col, 'puerta_%s_%s' % (g[4], nid), X((g[0]+g[2])/2), 0, Z((g[1]+g[3])/2)))
    # pisos (el cuarto de la escalera deja el hueco de la bajada)
    hueco = (1, ESC['baja'][0], ESC['x0'] - 1, ESC['baja'][1] - ESC['baja'][0]) if N['baja'] else None
    for x, z, w, d, k, tin, n in N['areas']:
        if k == 'void': continue
        if k == 'earth': C(caja(col, pre+'tierra', X(x), X(x+w), -K['losa'], .02, Z(z+d), Z(z), 'tierra')); continue
        m = 'calle' if k == 'street' else 'piso_' + tin
        rs = [(x, z, w, d)]
        if n == 'escalera' and hueco:
            hx, hz, hw, hd = hueco; rs = [(x, z, w, hz-z), (x, hz+hd, w, z+d-hz-hd), (x, hz, hx-x, hd), (hx+hw, hz, x+w-hx-hw, hd)]
        for j, (a, b, c, e) in enumerate(rs):
            if c > 0 and e > 0: C(caja(col, pre+'piso_%s_%d' % (n.strip(), j), X(a), X(a+c), -K['losa'], 0, Z(b+e), Z(b), m))
    if N.get('balc'):
        for j, (bx, bz, bw, bd) in enumerate(N['balc']): C(caja(col, pre+'balcon_%d' % j, X(bx), X(bx+bw), -K['losa'], 0, Z(bz+bd), Z(bz), 'losa'))
    if N.get('abajo') is not None:   # el patio de abajo, visto por el vacio
        C(caja(col, pre+'patio_abajo', X(12), X(24), N['abajo']-.1, N['abajo'], Z(30), Z(14), 'piso_tp'))
    # columnas y viga del patio
    if N.get('cols'):
        for j, (cx, cz) in enumerate(COLS): C(caja(col, pre+'columna_%d' % j, X(cx)-.26, X(cx)+.26, 0, H, Z(cz)-.26, Z(cz)+.26, 'columna', tipo='columna', r=.45))
        for e, l, i0, i1 in tramos(rect(12, 14, 12, 16) - W): i += 1; C(tramo_caja(col, pre+'dintel_%d' % i, e, l, i0, i1, H-.6, H, 'dintel', .5))
    # escalera: sube (hacia -x, el primer escalon junto a la puerta) y baja (hueco)
    n_esc, pa, x0 = ESC['n'], ESC['paso'], ESC['x0']; (s0, s1), (b0, b1) = ESC['sube'], ESC['baja']; io = ORDEN.index(nid)
    if N['sube']:
        for s in range(n_esc):
            xa = x0 - pa*(s+1); C(caja(col, pre+'escalon_s%d' % s, X(xa), X(xa+pa), 0, K['esc']*(s+1), Z(s1), Z(s0), 'escalon', escalera='sube'))
        C(vacio(col, 'escalera_sube_' + nid, X(x0-.4), 0, Z((s0+s1)/2), r=1.0, to=ORDEN[io+1], pie=[.7, 0]))
    if N['baja']:
        for s in range(n_esc):
            xa = x0 - pa*(s+1); C(caja(col, pre+'escalon_b%d' % s, X(xa), X(xa+pa), -3, -K['esc']*(s+1), Z(b1), Z(b0), 'escalon', escalera='baja'))
        C(caja(col, pre+'pozo', X(1), X(x0-pa*n_esc), -3.1, -3, Z(b1), Z(b0), 'losa'))
        C(vacio(col, 'escalera_baja_' + nid, X(x0-.4), 0, Z((b0+b1)/2), r=1.0, to=ORDEN[io-1], pie=[.7, 0]))
    C(vacio(col, 'llegada_' + nid, X(ESC['llegada'][0]), 0, Z(ESC['llegada'][1])))
    # paso 4: al llegar por la escalera apareces aqui (el mismo punto en los 4 niveles); plano enmarcado en el muro del fondo
    C(vacio(col, 'llegada_escalera_' + nid, X(ESC['llegada'][0]), 0, Z(ESC['llegada'][1])))
    C(vacio(col, 'plano_escalera_' + nid, X(6.6), 2.7, Z(16.8), ry=0.0))
    if nid == 'n0': C(vacio(col, 'plano_zaguan_n0', X(20.8), 2.7, Z(8.6), ry=round(-math.pi/2, 4)))
    # mesas (marcadores; el juego pone la mesa real)
    for g, mx, mz, r, libre in N['mesas']:
        C(vacio(col, 'mesa_' + g, X(mx), 1.55, Z(mz), juego=g, fam='f' if libre else FAM.get(g, 'k'), libre=libre, r=r))
    # decoracion de bulto
    for d in N.get('deco', []):
        k, n = d[0], d[1]
        if k == 'caja':
            _, _, x, z, w, dd, h = d; o = C(caja(col, pre+n, X(x), X(x+w), 0, h, Z(z+dd), Z(z), 'deco'))
            if w >= dd: o['tipo'] = 'deco'; o['seg'] = [X(x+dd/2), Z(z+dd/2), X(x+w-dd/2), Z(z+dd/2)]; o['r'] = round(dd/2+.15, 2)
            else: o['tipo'] = 'deco'; o['seg'] = [X(x+w/2), Z(z+w/2), X(x+w/2), Z(z+dd-w/2)]; o['r'] = round(w/2+.15, 2)
        elif k == 'cil': _, _, x, z, r, h = d; o = C(cil(col, pre+n, X(x), Z(z), r, 0, h, 'deco')); o['tipo'] = 'obst'; o['r'] = r + .2
        elif k == 'arbol':
            _, _, x, z, r = d; o = C(cil(col, pre+n+'_tronco', X(x), Z(z), .35, 0, 5.2, 'tronco', 10)); o['tipo'] = 'obst'; o['r'] = .6
            C(esfera(col, pre+n+'_copa', X(x), 6.4, Z(z), r, 'arbol'))
        elif k == 'pergola':
            _, _, x, z, w, dd = d
            for j, (a, b) in enumerate([(x+.4, z+.4), (x+w-.4, z+.4), (x+.4, z+dd-.4), (x+w-.4, z+dd-.4)]):
                o = C(caja(col, pre+'poste_%d' % j, X(a)-.22, X(a)+.22, 0, 3.4, Z(b)-.22, Z(b)+.22, 'pergola')); o['tipo'] = 'obst'; o['r'] = .4
            for j in range(11): xa = x+.5+j*1.5; C(caja(col, pre+'viga_%d' % j, X(xa)-.08, X(xa)+.08, 3.4, 3.6, Z(z+dd-.4), Z(z+.4), 'pergola'))
    return col

def referencia():
    """Maniqui de 2.1 con mesa y silla (solo para medir en Blender; no se exporta) y discos de mesa de radio 2.2."""
    ref = coleccion('Ref')
    x, z = X(18.5), Z(6)
    cil(ref, 'maniqui_cuerpo', x, z, .45, 0, 1.25, 'maniqui'); esfera(ref, 'maniqui_cabeza', x, 1.6, z, .55, 'maniqui').scale = (1,1,1)
    vacio(bpy.data.collections['n0'], 'maniqui', x, 0, z)
    for nid, N in NIV.items():
        for g, mx, mz, r, libre in N['mesas']:
            o = cil(ref, 'ref_mesa_' + g, X(mx), Z(mz), 2.2, 1.45, 1.55, 'ref', 24); o.location.z += N['elev']
            o2 = caja(ref, 'ref_silla_' + g, X(mx)-.45, X(mx)+.45, 0, .95, Z(mz)+2.6, Z(mz)+3.5, 'ref'); o2.location.z += N['elev']

def armar():
    for nid, N in NIV.items(): nivel(nid, N)
    referencia()
    print('casona: %d objetos' % sum(len(bpy.data.collections[n].objects) for n in NIV))

def exportar():
    os.makedirs(SALIDA, exist_ok=True)
    for nid, N in NIV.items():
        col = bpy.data.collections[nid]; E = N['elev']
        bpy.ops.object.select_all(action='DESELECT')
        for o in col.objects: o.location.z -= E; o.select_set(True)
        bpy.context.view_layer.objects.active = col.objects[0]
        f = os.path.join(SALIDA, nid + '.glb')
        try:
            bpy.ops.export_scene.gltf(filepath=f, export_format='GLB', use_selection=True, export_extras=True, export_apply=True,
                                      export_materials='EXPORT', export_texcoords=False, export_normals=True, export_yup=True)
        finally:
            for o in col.objects: o.location.z += E
        print(nid, os.path.getsize(f), 'bytes')
