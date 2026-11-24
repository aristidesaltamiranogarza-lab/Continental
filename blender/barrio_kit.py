# blender/barrio_kit.py — ayudantes del barrio (lámina A-02). barrio_lib.cargar() lo ejecuta dentro del módulo de cada pieza, así que usa
# directo lo de casona_calle.py (pieza, caja_o, ico, cf, FA, HI, PAL, osc, lin, ex_obs, quad) y de casona_pb.py (P: tubo, viga, prisma, disco...).
# Coordenadas del plano (ver barrio_lib.py). Low-poly, color por vértice en <nom>_fachadas (material 'fachada'), sin texturas nuevas.
# Medidas fijas: personaje 2.1, puerta ~3, asiento de banca 0.95, vecinas 5.6–6.8 (más bajas que la casona), escalón 0.35.
import bpy, bmesh, math, random
from mathutils import Vector, Matrix

YA, YE, YS = -.35, .15, -.38     # arroyo, banqueta de enfrente (como el tramo), suelo de patios y lotes (el del juego está en −0.4)
P.COLOR.update(copa_n=lin('#4f7a43'), copa_c=lin('#6f8f4e'), flamboyan=lin('#c8573a'), palma=lin('#5f8a52'),
               tierra_p=lin('#c4a77c'), hierba=lin('#a59c5e'), agua=lin('#6f9aa3'), farolb=lin('#f2e3c0'), horizonte=(1, 1, 1),
               ventana=lin('#4b4f5e'))
LUCES_N = []        # (x, y, z) de faroles y postes: luces solo para el horneado de noche (luces_noche)
PAL.update({k: lin(v) for k, v in dict(teja='#b5473a', azotea='#d9d4c7', gris='#9a9890', cantera='#e2d3b5', tinaco='#2f3133',
            naranja='#e8902e', blanco='#f4efe4', lona='#d9573f', iglesia='#e8c27a', tronco_c='#8f907c', dorado='#c9a24a',
            coco='#7a5a34', azul='#3f6f9a', negro='#262628').items()})
COLORES = ['rosa', 'amarillo', 'anil', 'verde', 'cal', 'ocre', 'terra', 'crema']
AZO = ['azotea', 'teja', 'gris', 'azotea', 'teja']
def M(n, m, luz=True, prio=1.0, uv=True): return bmn(NOMB + '_' + n, m, recalc=False, luz=luz, prio=prio) if uv else _bmn_nouv(NOMB + '_' + n, m, luz)
def _bmn_nouv(n, m, luz):
    bm = bmn(n, m, recalc=False, luz=luz); P.B[n]['uv'] = False; return bm

def color_vertice_mat(nombre):
    m = bpy.data.materials.get(nombre)
    if not m or any(x.type == 'VERTEX_COLOR' for x in m.node_tree.nodes): return
    nt = m.node_tree; b = next(x for x in nt.nodes if x.type == 'BSDF_PRINCIPLED')
    vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'; nt.links.new(vc.outputs['Color'], b.inputs['Base Color'])

def ctx_glb(f):
    import os
    f = os.path.join(P.SAL, f)
    if not os.path.isfile(f): return
    antes = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=f)
    col = P.coleccion('ctx_' + os.path.splitext(os.path.basename(f))[0])
    for o in set(bpy.data.objects) - antes:
        for c in list(o.users_collection): c.objects.unlink(o)
        col.objects.link(o)

def luces_noche(sc, extra=()):
    """Para el horneado de noche: focos cálidos en faroles y postes, y las ventanas prendidas brillan un poco (solo en esta pasada)."""
    S = P.coleccion('noche')
    for i, (x, y, z) in enumerate(list(LUCES_N) + list(extra)):
        l = bpy.data.lights.new('n%d' % i, 'POINT'); l.energy = 140; l.color = (1, .78, .5); l.shadow_soft_size = .35
        o = bpy.data.objects.new('n%d' % i, l); o.location = V(x, y, z); S.objects.link(o)
    m = bpy.data.materials.get('ventana')
    if m:
        b = next(x for x in m.node_tree.nodes if x.type == 'BSDF_PRINCIPLED')
        b.inputs['Emission Color'].default_value = (1, .7, .4, 1); b.inputs['Emission Strength'].default_value = 3.0

def girado(ang, cx, cz, fn, *a, **k):
    """Corre fn y gira lo que agregó (en todas las mallas) ang radianes alrededor del eje vertical en (cx, cz). +pi/2: lo que miraba a −z mira a +x."""
    n0 = {n: len(d['bm'].verts) for n, d in P.B.items()}
    r = fn(*a, **k)
    R, c = Matrix.Rotation(ang, 3, 'Z'), V(cx, 0, cz)
    for n, d in P.B.items():
        bm = d['bm']; bm.verts.ensure_lookup_table(); vs = bm.verts[n0.get(n, 0):]
        if len(vs): bmesh.ops.rotate(bm, verts=list(vs), cent=c, matrix=R)
    return r

# ---------- casas ----------
def _tapa(bm, n0, col):
    bm.faces.ensure_lookup_table(); cl = bm.loops.layers.float_color.get('Col')
    for f in bm.faces[n0:]:
        if f.normal.z > .7:
            for lp in f.loops: lp[cl] = (*col, 1)

MEDIO = dict(p=.91, z=1.46, c=1.78)     # medio ancho de cada puerta con su marco (el zoclo no pasa por ahí)
def casa2(x0, x1, H, col, zf, dz, huecos, fondo=12.0, tapa='azotea', rejas=True, cuerpo=True, tinaco=None):
    """Como casa() del tramo pero cerrada atrás y con pretil alrededor (desde la azotea de la casona se ve), azotea de color tapa.
    huecos: ('v', x) ventana con reja, ('p', x) puerta, ('z', x) zaguán, ('c', x) tienda con cortina y letrero sin texto.
    rejas=False en las lejanas. cuerpo=False: solo molduras y huecos sobre un muro que ya existe (fachada lateral de una esquina)."""
    global ZF, DZ
    ZF, DZ = zf, dz; fa, hi, cal = FA(), HI(), PAL['cal']
    if cuerpo:
        n0 = len(fa.faces); pieza(fa, col, cf, x0, x1, 0, H - .3, -fondo, 0); _tapa(fa, n0, PAL[tapa])
        pieza(fa, osc(col, .8), cf, x0, x1, H - .3, H, -.25, .02)                          # pretil del frente, un tono abajo
        for a, b, d0, d1 in ((x0, x1, -fondo, -fondo + .25), (x0, x0 + .25, -fondo + .25, -.25), (x1 - .25, x1, -fondo + .25, -.25)):
            pieza(fa, osc(col, .86), cf, a, b, H - .3, H - .05, d0, d1)
        if tinaco:
            u, d = tinaco; pieza(fa, PAL['tinaco'], P.tubo, (u, H - .3, zf - dz * d), (u, H + .85, zf - dz * d), .5, .47, 10)
    pieza(fa, cal, cf, x0, x1, H - .44, H - .3, 0, .12)                                     # cornisa
    if H > 4.5: pieza(fa, cal, cf, x0, x1, H - 1.0, H - .92, 0, .05)                        # moldura
    x = x0
    for a, b in sorted((u - MEDIO[k], u + MEDIO[k]) for k, u in huecos if k in MEDIO):     # zoclo sin pasar por las puertas
        if a > x: pieza(fa, osc(col, .68), cf, x, a, 0, .55, 0, .04)
        x = max(x, b)
    if x < x1: pieza(fa, osc(col, .68), cf, x, x1, 0, .55, 0, .04)
    for k, u in huecos:
        if k == 'v':
            w, y0, y1 = 1.3, 1.05, 3.25; a, b = u - w / 2, u + w / 2
            if rejas and (int(abs(u) * 7.3 + abs(zf) * 3.1) * 2654435761 >> 9) % 3 == 0:     # una de cada ~3 se prende de noche (el juego)
                pieza(M('ventanas', 'ventana', luz=False, uv=False), None, cf, a, b, y0, y1, -.06, .01, back=True)
            else: pieza(fa, PAL['vidrio'], cf, a, b, y0, y1, -.06, .01, back=True)
            for xa, xb in ((a - .14, a), (b, b + .14)): pieza(fa, cal, cf, xa, xb, y0, y1, 0, .06)
            pieza(fa, cal, cf, a - .2, b + .2, y1, y1 + .24, 0, .08)
            pieza(fa, cal, cf, a - .2, b + .2, y0 - .14, y0, 0, .12)
            if rejas:
                for i in range(5):
                    xx = a + .12 + i * (w - .24) / 4; pieza(hi, None, cf, xx - .018, xx + .018, y0, y1, .1, .13, back=True)
                for yy in (y0 + .2, y1 - .2): pieza(hi, None, cf, a, b, yy - .018, yy + .018, .1, .13, back=True)
        elif k in ('p', 'z'):
            w, y1 = (1.5, 2.95) if k == 'p' else (2.6, 3.4); a, b = u - w / 2, u + w / 2
            pieza(fa, PAL['madera'], cf, a, b, 0, y1, -.08, .02, back=True)
            pieza(fa, osc(PAL['madera'], .55), cf, u - .02, u + .02, 0, y1, .02, .035)
            for xa, xb in ((a - .16, a), (b, b + .16)): pieza(fa, cal, cf, xa, xb, 0, y1, 0, .07)
            pieza(fa, cal, cf, a - .16, b + .16, y1, y1 + .28, 0, .09)
        elif k == 'c':
            w, y1 = 3.2, 2.9; a, b = u - w / 2, u + w / 2
            pieza(M('ventanas', 'ventana', luz=False, uv=False), None, cf, a, b, 0, y1, -.3, .01, back=True)   # adentro (de noche, prendido)
            pieza(fa, PAL['gris'], cf, a, b, y1 - .6, y1, -.04, .14)                        # cortina enrollada
            for xa, xb in ((a - .18, a), (b, b + .18)): pieza(fa, cal, cf, xa, xb, 0, y1, 0, .07)
            pieza(fa, PAL['lona'], cf, a - .7, b + .7, y1 + .3, y1 + 1.2, 0, .05)          # letrero pintado
            pieza(fa, PAL['blanco'], cf, a - .4, b + .4, y1 + .62, y1 + .88, .05, .07)

def huecos_auto(x0, x1, i):
    w, m = x1 - x0, (x0 + x1) / 2
    if w >= 11: return [('v', x0 + 1.8), ('v', x0 + 4.2), ('z' if i % 3 == 0 else 'p', m + 1.6), ('v', x1 - 1.8)]
    if w >= 8: return [('v', x0 + 1.7), ('p', m + (.4 if i % 2 else -.4)), ('v', x1 - 1.7)]
    a, b = x0 + w * .3, x0 + w * .72
    return [('p', a), ('v', b)] if i % 2 else [('v', a), ('p', b)]

def barda(xa, za, xb, zb, h=2.4, col=None, e=.24, y0=YS):
    """Barda recta (en x o en z) con tapa de cal."""
    fa = FA(); col = col or PAL['crema']
    if abs(za - zb) < 1e-3: (x0, x1), z0, z1 = sorted((xa, xb)), za - e / 2, za + e / 2
    else: x0, x1, (z0, z1) = xa - e / 2, xa + e / 2, sorted((za, zb))
    pieza(fa, osc(col, .93), caja_o, x0, x1, y0, h, z0, z1, (2,))
    pieza(fa, PAL['cal'], caja_o, x0 - .04, x1 + .04, h, h + .1, z0 - .04, z1 + .04, (2,))

def fila(xa, zf, dz, lotes, seed=1, rejas=True, patio=10.0, fondo=12.0, arboles=True, huecos=None):
    """Casas contiguas desde xa hacia +x, fachada en z=zf mirando a la calle (dz −1: la calle en −z; +1: en +z).
    lotes: [(ancho, color o None, alto o None)]. Patio atrás (suelo, bardas, naranjo o palma) si patio. Regresa la x final."""
    R = random.Random(seed); x = xa; zd = lambda d: zf - dz * d
    for i, (w, c, H) in enumerate(lotes):
        x0, x1 = x, x + w; c = c or COLORES[R.randrange(len(COLORES))]; H = H or round(R.uniform(5.6, 6.7), 2)
        ti = (R.uniform(x0 + 1.2, x1 - 1.2), fondo * R.uniform(.45, .8)) if R.random() < .45 else None
        hu = (huecos[i] if huecos and i < len(huecos) and huecos[i] else huecos_auto(x0, x1, i + seed))
        casa2(x0, x1, H, PAL[c], zf, dz, hu, fondo, tapa=AZO[R.randrange(len(AZO))], rejas=rejas, tinaco=ti)
        if patio:
            za, zb = sorted((zd(fondo), zd(fondo + patio)))
            quad(NOMB + '_suelo', 'tierra_p', x0, za, x1, zb, y=YS, prio=.25)
            barda(x0, zd(fondo), x0, zd(fondo + patio)); barda(x0, zd(fondo + patio), x1, zd(fondo + patio))
            if R.random() < .3:   # cuartito de atrás
                cw = min(4.0, w - 2); cx0 = x1 - cw - .3 if i % 2 else x0 + .3
                casa2(cx0, cx0 + cw, 3.8, PAL['crema'], zd(fondo + patio - 3.4), dz, [('p', cx0 + cw / 2)], 3.2, tapa='gris', rejas=False)
            elif arboles:
                t = R.random(); px, pz = R.uniform(x0 + 2.0, x1 - 2.0), zd(fondo + patio * R.uniform(.4, .6))
                if t < .5: naranjo(px, pz, R.uniform(.9, 1.15), y0=YS)
                elif t < .72: palmera(px, pz, R.uniform(8, 10), y0=YS, choque=False)
        x = x1
    if patio: barda(x, zd(fondo), x, zd(fondo + patio))
    return x

def fila_lado(px, za, zb, s, lotes, **kv):
    """Fila sobre una calle lateral: fachadas en x=px, de z=za a z=zb; s=+1 miran a +x (calle 60), s=−1 a −x (calle 62). La fila se arma
    derecha y se gira; los lotes van de za a zb."""
    if s > 0: return girado(math.pi / 2, px, 0, fila, px + za, 0, -1, lotes, **kv)
    return girado(-math.pi / 2, px, 0, fila, px - zb, 0, -1, lotes[::-1], **kv)

def fachada_lado(px, za, zb, s, H, col, huecos_z):
    """Molduras y huecos sobre el muro lateral de una casa de esquina (x=px, de za a zb). huecos_z: [(tipo, z)]."""
    if s > 0: girado(math.pi / 2, px, 0, casa2, px + za, px + zb, H, col, 0, -1, [(k, px + z) for k, z in huecos_z], cuerpo=False)
    else: girado(-math.pi / 2, px, 0, casa2, px - zb, px - za, H, col, 0, -1, [(k, px - z) for k, z in huecos_z], cuerpo=False)

# ---------- árboles (copas *_copa: CMAT las desvanece y PASTO.viento las mece) ----------
def _tr(): return M('tronco', 'tronco')
def _cp(sp, m): return M(sp + '_copa', m, prio=.6)

def _arbol(*a, **k): return P.arbol_ramas(*a, **k)     # árbol de ramas lisas con nubes de hojas fundidas (casona_pb.py)

def laurel(cx, cz, s=1.0, lean=(0, 0), y0=0.0, sub=3, choque=True):
    """Laurel de la India: tronco encalado abajo que se abre a ~4.5 en 4 ramas con nubes de hojas planas (alto ~12·s, ancho ~13·s), cargado hacia lean."""
    TR, CP, fa = _tr(), _cp('laurel', 'copa'), FA(); R = random.Random(int(cx * 7 + cz * 13 + 1))
    if choque: ex_obs(NOMB + '_tronco', cx, cz, .75 * s)
    pieza(fa, PAL['cal'], P.tubo, (cx, y0, cz), (cx, y0 + .36 * s, cz), .78 * s, .61 * s, 12)     # encalado: sigue el pie ensanchado
    pieza(fa, PAL['cal'], P.tubo, (cx, y0 + .34 * s, cz), (cx, y0 + 1.4 * s, cz), .61 * s, .565 * s, 12)
    _arbol(R, TR, [(CP, 1)], cx, cz, s, y0, 11.2, 5.2, 5, (6.4, 9.8), (4.0, 5.4), (2.3, 3.0), sub, .62, lean, rtr=.55)

def flamboyan(cx, cz, s=1.0, y0=0.0, choque=True):
    """Sombrilla: tronco corto que se abre bajo en 5 ramas casi horizontales; nubes muy planas, casi todas rojas (~16 de ancho, ~9 de alto)."""
    TR, FL, VE = _tr(), _cp('flamboyan', 'flamboyan'), _cp('laurel', 'copa'); R = random.Random(int(cx * 7 + cz * 13))
    if choque: ex_obs(NOMB + '_tronco', cx, cz, .6 * s)
    _arbol(R, TR, [(FL, 3), (VE, 1)], cx, cz, s, y0, 8.2, 3.0, 5, (6.0, 7.2), (3.8, 5.2), (2.5, 3.1), 2, .5, tocon=False, rtr=.48)

def ceiba(cx, cz, s=1.0, y0=0.0, choque=True):
    """Tronco gris verdoso recto y limpio con contrafuertes lisos al pie; arriba se abre en 6 ramas largas con nubes en pisos (~16 de alto, ~18 de ancho)."""
    CP, fa = _cp('ceiba', 'copa_c'), FA(); R = random.Random(int(cx * 5 + cz * 11))
    if choque: ex_obs(NOMB + '_tronco', cx, cz, 1.3 * s)
    _arbol(R, fa, [(CP, 1)], cx, cz, s, y0, 15.0, 9.3, 6, (11.0, 13.6), (4.6, 6.6), (2.6, 3.2), 2, .52, tope=True, tocon=False, rtr=1.0,
           lado=.3, raices=5, tr_col=PAL['tronco_c'], vaiven=.15)

def palmera(cx, cz, alto=9.0, y0=0.0, inc=(.1, .06), choque=True):
    TR, CP, fa = _tr(), _cp('palma', 'palma'), FA(); R = random.Random(int(cx * 11 + cz * 5))
    if choque: ex_obs(NOMB + '_tronco', cx, cz, .4)
    n = 6; pts = [(cx + inc[0] * alto * (t / n) ** 2, y0 + (alto - y0) * t / n, cz + inc[1] * alto * (t / n) ** 2) for t in range(n + 1)]
    for i in range(n): pieza(fa, PAL['tronco_c'], P.tubo, pts[i], pts[i + 1], .3 - .025 * i, .28 - .025 * i, 7)
    top = pts[-1]
    for k in range(9):
        a = k * 2 * math.pi / 9 + R.uniform(-.15, .15); L = R.uniform(3.2, 3.9); prev = top
        for j, (t, dy) in enumerate(((.4, .5), (.75, .15), (1.0, -1.0))):
            q = (top[0] + math.cos(a) * L * t, top[1] + dy, top[2] + math.sin(a) * L * t)
            pieza(CP, None, P.viga, prev, q, .38 - .1 * j, .04); prev = q
    for k in range(3): pieza(fa, PAL['coco'], ico, top[0] + math.cos(k * 2.1) * .3, top[1] - .35, top[2] + math.sin(k * 2.1) * .3, .2, 1)

def naranjo(cx, cz, s=1.0, y0=0.0):
    """Naranjo de patio: tronco corto que se abre en 3 ramas con nubes redondas y tupidas, y naranjas sobre la superficie de las hojas (~4 de alto)."""
    TR, CP, fa = _tr(), _cp('naranjo', 'copa_n'), FA(); R = random.Random(int(cx * 3 + cz * 17))
    CP.verts.ensure_lookup_table(); n0 = len(CP.verts)
    _arbol(R, TR, [(CP, 1)], cx, cz, s, y0, 3.4, 1.4, 3, (2.3, 2.8), (.6, .85), (1.0, 1.2), 2, .8, tocon=False, rtr=.18, lado=0, ligero=True)
    CP.verts.ensure_lookup_table(); CP.normal_update(); o = V(0, 0, 0)
    vs = [v for v in CP.verts[n0:] if -.1 < v.normal.z < .75]      # costados de la copa: ni abajo ni encima
    for v in R.sample(vs, min(8, len(vs))):
        p = v.co + v.normal * .02 * s
        pieza(fa, PAL['naranja'], ico, p.x - o.x, p.z - o.z, p.y - o.y, .15 * s, 1)

# ---------- plantas chicas ----------
def agave(x, z, s=1.0, y0=0.0, col=None):
    fa = FA(); col = col or PAL['agave']
    for i in range(9):
        a = i * 2 * math.pi / 9 + (.3 if i % 2 else 0); l = (.9 + .25 * (i % 3)) * s; h = (.55 + .35 * (i % 2)) * s
        pieza(fa, col, P.viga, (x, y0 + .1, z), (x + math.cos(a) * l, y0 + h, z + math.sin(a) * l), .09 * s, .025 * s)

def mata(x, z, s=1.0, y0=0.0, col=None):
    fa = FA(); col = col or PAL['hoja']
    for dx, dz, dy, r in ((0, 0, .45, .55), (.4, -.2, .35, .42), (-.38, .22, .32, .4)): pieza(fa, col, ico, x + dx * s, y0 + dy * s, z + dz * s, r * s, 1, .8)

def bugambilia2(x0, x1, y, z0, z1, seed=7, n=24):
    """Hojas y mucho magenta sobre una barda o pretil (de x0 a x1, alto y), que cuelga hacia abajo."""
    fa, R = FA(), random.Random(seed)
    for i in range(max(3, n // 3)): pieza(fa, PAL['hoja'], ico, R.uniform(x0, x1), R.uniform(y - .1, y + .5), R.uniform(z0, z1), R.uniform(.28, .42), 1, .8)
    for i in range(n):
        yy = y + .5 - (R.random() ** 1.8) * 2.2
        pieza(fa, PAL['mag'], ico, R.uniform(x0, x1), yy, R.uniform(z0, z1), R.uniform(.15, .27), 1, .85)

# ---------- calle ----------
def losa(n, m, x0, x1, z0, z1, y1, y0=YS, prio=.5, sin=()):
    """Losa (banqueta, andador, plaza) de y0 a y1 con sus cantos; sin: caras que no se ven (0 −x, 1 +x, 4 −z, 5 +z)."""
    pieza(M(n, m, prio=prio), None, caja_o, x0, x1, y0, y1, z0, z1, (2,) + tuple(sin))

def arroyo(x0, z0, x1, z1): quad(NOMB + '_arroyo', 'calle', x0, z0, x1, z1, y=YA, prio=.3)

def postes(xs, z=-1.3, ext=(), Y=7.9, brazo=-1):
    """Postes como los del tramo, con farol hacia la calle (brazo −1: hacia −z) y dos cables entre ellos (ext: puntas sueltas)."""
    fa, hi = FA(), HI()
    for px in xs:
        ex_obs(NOMB + '_fachadas', px, z, .35); LUCES_N.append((px, 6.55, z + brazo * 1.9))
        pieza(fa, PAL['poste'], P.tubo, (px, 0, z), (px, 8.4, z), .17, .12, 8)
        pieza(hi, None, caja_o, px - .06, px + .06, Y - .15, Y, z - .9, z + .9)
        za, zb = sorted((z, z + brazo * 1.6)); pieza(fa, PAL['poste'], caja_o, px - .04, px + .04, 6.9, 6.98, za, zb)
        pieza(fa, PAL['cal'], caja_o, px - .16, px + .16, 6.75, 6.9, z + brazo * 1.9 - .25, z + brazo * 1.9 + .25)
    pts = sorted(list(xs) + list(ext))
    for zc in (z - .7, z + .7):
        for a, b in zip(pts, pts[1:]):
            n, sag = 8, .012 * (b - a)
            q = [(a + (b - a) * t / n, Y - sag * 4 * (t / n) * (1 - t / n), zc) for t in range(n + 1)]
            for p0, p1 in zip(q, q[1:]): pieza(hi, None, P.viga, p0, p1, .02)

def coladera(x, z, ang=0.0):
    fa = FA(); w, d = (.8, .45) if not ang else (.45, .8)
    pieza(fa, PAL['negro'], caja_o, x - w / 2, x + w / 2, YA, YA + .02, z - d / 2, z + d / 2, (2,))

def tope(x, z0, z1):
    """Tope pintado de amarillo de lado a lado del arroyo (en x, de z0 a z1)."""
    pieza(FA(), osc(PAL['amarillo'], .92), P.prisma, 'h', 0, [(x - .5, YA), (x + .5, YA), (x + .22, YA + .12), (x - .22, YA + .12)], z0, z1)

def bote(x, z, y0=0.0, col=None):
    fa = FA(); pieza(fa, col or PAL['verde'], P.tubo, (x, y0, z), (x, y0 + .95, z), .3, .33, 9)
    pieza(fa, PAL['negro'], P.tubo, (x, y0 + .95, z), (x, y0 + 1.0, z), .35, .35, 9)

def triciclo(x, z, ang=0.0, col=None):
    """Triciclo de carga: cajón al frente sobre dos ruedas y una atrás; mira a +x antes de girar."""
    def arma():
        fa, hi = FA(), HI(); c = col or PAL['azul']; y = YA
        for dz in (-.45, .45): pieza(hi, None, P.tubo, (x + .5, y + .32, z + dz - .06), (x + .5, y + .32, z + dz + .06), .32, .32, 10)
        pieza(hi, None, P.tubo, (x - .9, y + .32, z - .05), (x - .9, y + .32, z + .05), .32, .32, 10)
        pieza(fa, c, caja_o, x + .05, x + .95, y + .55, y + 1.15, z - .5, z + .5)
        pieza(fa, osc(c, .7), caja_o, x + .08, x + .92, y + 1.1, y + 1.16, z - .47, z + .47)
        pieza(hi, None, P.viga, (x + .1, y + .7, z), (x - .9, y + .35, z), .04)
        pieza(hi, None, P.viga, (x - .6, y + .4, z), (x - .55, y + 1.05, z), .035)
        pieza(fa, PAL['negro'], caja_o, x - .72, x - .38, y + 1.05, y + 1.12, z - .14, z + .14)
        pieza(hi, None, P.viga, (x + .1, y + 1.15, z - .35), (x + .1, y + 1.15, z + .35), .025)
    girado(ang, x, z, arma)

def puesto(x, z, ang=0.0, y0=YE):
    """Puesto de antojitos: mesa con lona encima, banquito y hielera; el frente mira a −z antes de girar."""
    def arma():
        fa, hi = FA(), HI()
        pieza(fa, PAL['blanco'], caja_o, x - .9, x + .9, y0 + .9, y0 + .98, z - .45, z + .45)
        pieza(fa, PAL['crema'], caja_o, x - .85, x + .85, y0, y0 + .9, z - .1, z + .4)
        for dx in (-.85, .85):
            for dz in (-.45, .45): pieza(hi, None, P.viga, (x + dx, y0, z + dz), (x + dx, y0 + 2.35 + (.25 if dz > 0 else 0), z + dz), .025)
        for i in range(6):
            xa = x - 1.05 + i * .35
            pieza(fa, PAL['lona'] if i % 2 else PAL['blanco'], P.prisma, 'h', 0, [(xa, y0 + 2.3), (xa + .35, y0 + 2.3), (xa + .35, y0 + 2.36), (xa, y0 + 2.36)], z - .75, z + .55)
        pieza(fa, PAL['azul'], caja_o, x + 1.15, x + 1.75, y0, y0 + .5, z - .3, z + .1)
        pieza(fa, PAL['madera'], P.tubo, (x - .2, y0, z - 1.0), (x - .2, y0 + .62, z - 1.0), .18, .2, 8)
    girado(ang, x, z, arma)

def maceta2(x, z, y0=0.0, tipo='mata'): maceta(x, z, y0, tipo)

# ---------- plaza ----------
def farol(x, z, y0=0.0):
    """Farol de plaza: poste de hierro y linterna (farolb: de noche la prende el juego)."""
    hi, lu = HI(), M('farol', 'farolb', luz=False, uv=False); LUCES_N.append((x, y0 + 3.9, z))
    pieza(hi, None, P.tubo, (x, y0, z), (x, y0 + .5, z), .2, .16, 8)
    pieza(hi, None, P.tubo, (x, y0 + .5, z), (x, y0 + 3.6, z), .08, .07, 8)
    pieza(lu, None, P.tubo, (x, y0 + 3.6, z), (x, y0 + 4.25, z), .2, .26, 4)
    pieza(hi, None, P.tubo, (x, y0 + 4.25, z), (x, y0 + 4.6, z), .32, .05, 4)

def banca_conf(x, z, ang=0.0, y0=0.0):
    """Banca confidente de concreto blanco: dos asientos que se miran de frente, con el respaldo en S entre los dos.
    Asiento a 0.95 (la silla de la referencia), respaldo hasta 1.85; mide 2.4 x 1.0. Sin girar: largo en x."""
    def arma():
        fa = FA(); c = PAL['blanco']; s = osc(c, .9)
        pieza(fa, c, caja_o, x - 1.2, x, y0 + .82, y0 + .95, z - .5, z + .02)
        pieza(fa, c, caja_o, x, x + 1.2, y0 + .82, y0 + .95, z - .02, z + .5)
        pieza(fa, c, caja_o, x - 1.2, x - .08, y0 + .95, y0 + 1.85, z + .02, z + .16)
        pieza(fa, c, caja_o, x + .08, x + 1.2, y0 + .95, y0 + 1.85, z - .16, z - .02)
        pieza(fa, c, caja_o, x - .1, x + .1, y0 + .82, y0 + 1.85, z - .16, z + .16)
        for xa, xb, za, zb in ((x - 1.2, x - 1.05, z - .45, z + .1), (x + 1.05, x + 1.2, z - .1, z + .45)):
            pieza(fa, s, caja_o, xa, xb, y0, y0 + .82, za, zb)
        pieza(fa, s, caja_o, x - .14, x + .14, y0, y0 + .82, z - .3, z + .3)
    girado(ang, x, z, arma)

def kiosco(cx, cz, y0=0.0):
    """Kiosco de ocho lados: base de cantera con escalones hacia la calle (−z), columnas, barandal y techo de lámina roja."""
    fa, hi = FA(), HI(); cal, can = PAL['cal'], PAL['cantera']
    ex_obs(NOMB + '_fachadas', cx, cz, 4.7)
    pieza(fa, osc(can, .92), P.tubo, (cx, y0, cz), (cx, y0 + .35, cz), 4.8, 4.8, 8)
    pieza(fa, can, P.tubo, (cx, y0 + .35, cz), (cx, y0 + .9, cz), 4.35, 4.3, 8)
    for i in range(2): pieza(fa, can, caja_o, cx - .9, cx + .9, y0 + .35 + i * .28, y0 + .63 + i * .28, cz - 5.3 + i * .35, cz - 4.0)
    for i in range(8):
        a = i * math.pi / 4 + math.pi / 8; x, z = cx + math.cos(a) * 3.85, cz + math.sin(a) * 3.85
        pieza(fa, cal, P.tubo, (x, y0 + .9, z), (x, y0 + 4.5, z), .15, .13, 8)
        b = a + math.pi / 4; x2, z2 = cx + math.cos(b) * 3.85, cz + math.sin(b) * 3.85
        if abs(math.sin((a + b) / 2) + 1) > .05:      # sin barandal en la entrada (el lado de −z)
            pieza(hi, None, P.viga, (x, y0 + 1.95, z), (x2, y0 + 1.95, z2), .04)
            pieza(hi, None, P.viga, (x, y0 + 1.15, z), (x2, y0 + 1.15, z2), .025)
    pieza(fa, cal, P.tubo, (cx, y0 + 4.5, cz), (cx, y0 + 4.9, cz), 4.6, 4.5, 8)
    pieza(fa, PAL['teja'], P.tubo, (cx, y0 + 4.9, cz), (cx, y0 + 7.0, cz), 5.0, .35, 8)
    pieza(fa, cal, P.tubo, (cx, y0 + 7.0, cz), (cx, y0 + 7.7, cz), .3, .18, 8)
    pieza(fa, PAL['dorado'], ico, cx, y0 + 7.95, cz, .28, 1)

def fuente(cx, cz, y0=0.0):
    fa = FA(); can = PAL['cantera']
    ex_obs(NOMB + '_fachadas', cx, cz, 1.8)
    pieza(fa, can, P.tubo, (cx, y0, cz), (cx, y0 + .6, cz), 1.75, 1.7, 16)
    P.disco(NOMB + '_agua', 'agua', cx, cz, 1.45, y0 + .61, seg=16)
    pieza(fa, can, P.tubo, (cx, y0 + .6, cz), (cx, y0 + 1.5, cz), .26, .2, 8)
    pieza(fa, can, P.tubo, (cx, y0 + 1.4, cz), (cx, y0 + 1.65, cz), .3, .85, 12)
    P.disco(NOMB + '_agua', 'agua', cx, cz, .78, y0 + 1.66, seg=12)
    pieza(fa, can, ico, cx, y0 + 1.9, cz, .18, 1)

def cuadrante(n, m, x0, x1, z0, z1, cx, cz, r, y, prio=.6, seg=10):
    """Rectángulo de pasto sin la esquina que cae dentro del círculo (cx, cz, r) de la plaza redonda."""
    esq = [(x0, z0), (x1, z0), (x1, z1), (x0, z1)]
    k = min(range(4), key=lambda i: (esq[i][0] - cx) ** 2 + (esq[i][1] - cz) ** 2); nx, nz = esq[k]
    pa = esq[(k - 1) % 4]; pb = esq[(k + 1) % 4]
    def corte(p):   # punto donde el lado de p a la esquina cruza el círculo
        if abs(p[0] - nx) < 1e-6: d = math.sqrt(max(0, r * r - (nx - cx) ** 2)); return (nx, cz - d if p[1] < cz else cz + d)
        d = math.sqrt(max(0, r * r - (nz - cz) ** 2)); return (cx - d if p[0] < cx else cx + d, nz)
    A, Bp = corte(pa), corte(pb)
    a0, a1 = math.atan2(A[1] - cz, A[0] - cx), math.atan2(Bp[1] - cz, Bp[0] - cx)
    if a1 - a0 > math.pi: a1 -= 2 * math.pi
    if a0 - a1 > math.pi: a1 += 2 * math.pi
    arc = [(cx + r * math.cos(a0 + (a1 - a0) * i / seg), cz + r * math.sin(a0 + (a1 - a0) * i / seg)) for i in range(seg + 1)]
    orden = [esq[(k + 1) % 4], esq[(k + 2) % 4], esq[(k + 3) % 4]]   # pb, opuesta, pa
    P.plano(M(n, m, prio=prio), orden + arc, y)
