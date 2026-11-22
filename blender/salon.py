# blender/salon.py — prueba: el salón de la planta baja con luz horneada (escena "Salon", no toca "Chibi").
# Se corre con exec() vía MCP de Blender. Coordenadas como en three (x, y arriba, z); P() las pasa a Blender.
# Exporta blender/salon.glb (geometría, UV0 en metros, UV1 = lightmap) y blender/salon_luz.png (luz horneada).
# Mallas: piso, cenefa, techo, vigas, muro_N/S/E/O (+ lambrin_*, rod_*), cubo (escalera), escalon, persiana, reja, vidrio_luz, arbotante.
import bpy, bmesh, math, os
from mathutils import Vector

K = dict(X0=-17, X1=17, Z0=-15.0, Z1=11.0, H=9.0, LAM=2.4, RES=2048, SAMPLES=256,
         CUBO=(12.5, 17.0, 5.0, 11.0), TB=[(-8.5, -4), (0, -9), (8.5, -4)],
         VENT=[-10.5, -3.5, 8.5], ARQ=1.5, COL=[-13.75, -8.25, -2.75, 2.75, 8.25, 13.75])
DIR = os.path.join(os.path.dirname(bpy.data.filepath) if False else r"C:\Users\aris1\code\Continental", "blender")

def P(x, y, z): return Vector((x, -z, y))

def escena():
    sc = bpy.data.scenes.get("Salon") or bpy.data.scenes.new("Salon")
    for o in list(sc.collection.all_objects): bpy.data.objects.remove(o, do_unlink=True)
    for c in list(sc.collection.children): bpy.data.collections.remove(c)
    bpy.context.window.scene = sc
    sc.render.engine = 'CYCLES'
    return sc

def mat(n, rgb, emit=0):
    m = bpy.data.materials.get(n) or bpy.data.materials.new(n); m.use_nodes = True
    b = next(x for x in m.node_tree.nodes if x.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = .9
    if emit:
        b.inputs['Emission Color'].default_value = (*rgb, 1); b.inputs['Emission Strength'].default_value = emit
    return m

def obj(n, bm, m, col, lm=True):
    me = bpy.data.meshes.new(n); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(n, me); col.objects.link(o)
    for mm in (m if isinstance(m, list) else [m]): me.materials.append(mm)
    o['lm'] = 1 if lm else 0
    return o

# cara de muro con huecos que salen del piso: a,b en [x,z]; n = normal hacia el cuarto; UV0 en metros
def cara(bm, a, b, huecos, H, y0=0.0, y1=None, n=None):
    y1 = H if y1 is None else y1
    A, B = Vector((a[0], a[1])), Vector((b[0], b[1])); d = (B - A); L = d.length; d.normalize()
    hs = sorted(huecos)
    if hs and y1 <= min((h - w / 2 if ar else h) for (c, w, h, ar) in hs) + 1e-4:   # franja debajo de los huecos: tramos sueltos
        u = 0; segs = []
        for (c, w, h, ar) in hs: segs.append((u, c - w / 2)); u = c + w / 2
        segs.append((u, L)); uv = bm.loops.layers.uv.verify()
        for (u0, u1) in segs:
            if u1 - u0 < .01: continue
            q = [(u0, y0), (u1, y0), (u1, y1), (u0, y1)]
            f = bm.faces.new([bm.verts.new(P(A.x + d.x * u, y, A.y + d.y * u)) for (u, y) in q]); f.normal_update()
            if n is not None and f.normal.dot(P(n[0], 0, n[1])) < 0: f.normal_flip()
            for lp in f.loops:
                c3 = lp.vert.co; lp[uv].uv = ((Vector((c3.x, -c3.y)) - A).dot(d), c3.z)
        return None
    pts = [(0, y0)]
    for (c, w, h, arco) in sorted(huecos):
        l, r = c - w / 2, c + w / 2; tp = h - w / 2 if arco else h
        if y1 <= y0: break
        pts += [(l, y0)]
        if tp >= y1: pts += [(l, y1)]; continue
        pts += [(l, max(tp, y0))]
        if arco:
            for i in range(1, 16):
                t = math.pi - math.pi * i / 16; py = tp + math.sin(t) * w / 2
                pts.append((c + math.cos(t) * w / 2, min(max(py, y0), y1)))
        pts += [(r, max(tp, y0)), (r, y0)]
    pts += [(L, y0), (L, y1), (0, y1)]
    # quitar puntos repetidos
    lim = []
    for p in pts:
        if not lim or (abs(lim[-1][0] - p[0]) > 1e-4 or abs(lim[-1][1] - p[1]) > 1e-4): lim.append(p)
    vs = [bm.verts.new(P(A.x + d.x * u, y, A.y + d.y * u)) for (u, y) in lim]
    f = bm.faces.new(vs); f.normal_update()
    if n is not None and f.normal.dot(P(n[0], 0, n[1])) < 0: f.normal_flip()
    uv = bm.loops.layers.uv.verify()
    for lp in f.loops:
        c3 = lp.vert.co; lp[uv].uv = ((Vector((c3.x, -c3.y)) - A).dot(d), c3.z)
    return f

# marco de un vano: túnel del grueso del muro (prof hacia -n) y moldura al frente (m de ancho)
def marco(bm, a, b, n, c, w, h, arco, prof=.3, m=.14):
    A = Vector((a[0], a[1])); d = (Vector((b[0], b[1])) - A).normalized(); N = Vector((n[0], n[1]))
    l, r = c - w / 2, c + w / 2; tp = h - w / 2 if arco else h
    def cont(e):
        p = [(l - e, 0), (l - e, tp)]
        if arco: p += [(c + math.cos(math.pi - math.pi * i / 16) * (w / 2 + e), tp + math.sin(math.pi - math.pi * i / 16) * (w / 2 + e)) for i in range(1, 16)]
        else: p += [(l - e, h + e), (r + e, h + e)]
        return p + [(r + e, tp), (r + e, 0)]
    W = lambda u, y, t: P(A.x + d.x * u + N.x * t, y, A.y + d.y * u + N.y * t)
    i0, o0 = cont(0), cont(m)
    def tira(p, q, tp_, tq):
        for k in range(len(p) - 1):
            bm.faces.new([bm.verts.new(W(*p[k], tp_)), bm.verts.new(W(*p[k + 1], tp_)), bm.verts.new(W(*q[k + 1], tq)), bm.verts.new(W(*q[k], tq))])
    tira(i0, i0, .03, -prof)
    if m > 0: tira(i0, o0, .03, .03)

def caja(bm, x0, x1, y0, y1, z0, z1):
    r = bmesh.ops.create_cube(bm, size=1)['verts']
    for v in r:
        v.co = P(x0 if v.co.x < 0 else x1, y0 if v.co.z < 0 else y1, z0 if v.co.y > 0 else z1)
    return r

def uv_metros(bm, capa=None):
    bm.normal_update()
    uv = bm.loops.layers.uv[capa] if capa else bm.loops.layers.uv.verify()
    for f in bm.faces:
        n = f.normal
        for lp in f.loops:
            c = lp.vert.co
            if abs(n.z) > .7: lp[uv].uv = (c.x, c.y)
            elif abs(n.x) > .7: lp[uv].uv = (c.y, c.z)
            else: lp[uv].uv = (c.x, c.z)

def construir(sc):
    G = bpy.data.collections.new("salon"); sc.collection.children.link(G)
    S = bpy.data.collections.new("solo_horneado"); sc.collection.children.link(S)
    X0, X1, Z0, Z1, H, LAM = K['X0'], K['X1'], K['Z0'], K['Z1'], K['H'], K['LAM']
    cx0, cx1, cz0, cz1 = K['CUBO']
    M = dict(muro=mat('muro', (.62, .36, .22)), lam=mat('lambrin', (.06, .14, .1)), rod=mat('rod', (.75, .68, .55)),
             piso=mat('piso', (.62, .55, .42)), cen=mat('cenefa', (.45, .3, .22)), techo=mat('techo', (.7, .62, .5)),
             viga=mat('viga', (.12, .06, .03)), esc=mat('escalon', (.55, .3, .2)), per=mat('persiana', (.12, .3, .2)),
             hie=mat('hierro', (.03, .03, .03)), luz=mat('vidrio_luz', (1, .62, .32), emit=6),
             arb=mat('arbotante', (1, .8, .5), emit=3), can=mat('cantera', (.78, .66, .5)), tap=mat('tapete', (.4, .12, .1)))
    # piso y cenefa (1 m de ancho en el perímetro)
    bm = bmesh.new(); cen = 1.0
    f = [bm.verts.new(P(x, 0, z)) for x, z in [(X0 + cen, Z1 - cen), (X1 - cen, Z1 - cen), (X1 - cen, Z0 + cen), (X0 + cen, Z0 + cen)]]
    bm.faces.new(f); uv_metros(bm); obj('piso', bm, M['piso'], G)
    bm = bmesh.new()
    for (a, b, c, d) in [(X0, X1, Z0, Z0 + cen), (X0, X1, Z1 - cen, Z1), (X0, X0 + cen, Z0 + cen, Z1 - cen), (X1 - cen, X1, Z0 + cen, Z1 - cen)]:
        bm.faces.new([bm.verts.new(P(x, 0, z)) for x, z in [(a, d), (b, d), (b, c), (a, c)]])
    uv_metros(bm); obj('cenefa', bm, M['cen'], G)
    # techo
    bm = bmesh.new(); bm.faces.new([bm.verts.new(P(x, H, z)) for x, z in [(X0, Z0), (X1, Z0), (X1, Z1), (X0, Z1)]])
    uv_metros(bm); obj('techo', bm, M['techo'], G)
    bm = bmesh.new(); x = X0 + 1.25
    while x < X1 - .6:
        caja(bm, x - .16, x + .16, H - .42, H, Z0, Z1); x += 2.5
    uv_metros(bm); obj('vigas', bm, M['viga'], G)
    # muros: (nombre, a, b, huecos [centro sobre el muro desde a, ancho, alto, arco])
    V = K['VENT']
    muros = [('N', (X0, Z0), (X1, Z0), [(-9.5 - X0, 4, 5.8, 1), (6 - X0, 2.2, 3.6, 0)], (0, 1)),
             ('S', (X1, Z1), (X0, Z1), [(X1 - 0, 4.2, 6.4, 1)], (0, -1)),
             ('E', (X1, Z0), (X1, Z1), [], (-1, 0)),
             ('O', (X0, Z1), (X0, Z0), [(Z1 - z, 1.7, 4.6, 1) for z in V], (1, 0))]
    for nm, a, b, hu, nv in muros:
        bm = bmesh.new(); cara(bm, a, b, hu, H, LAM + .12, H, nv); obj('muro_' + nm, bm, M['muro'], G)
        bm = bmesh.new(); cara(bm, a, b, hu, H, 0, LAM, nv); obj('lambrin_' + nm, bm, M['lam'], G)
        bm = bmesh.new(); cara(bm, a, b, hu, H, LAM, LAM + .12, nv); obj('rod_' + nm, bm, M['rod'], G)
    # cubo de la escalera en la esquina del frente a la derecha: muro oeste con arco y muro norte; adentro escalones que suben y dan vuelta
    bm = bmesh.new()
    HC = 5.4   # bajo: la cámara del juego va a ~10 m y un cubo hasta el techo tapaba media pantalla
    cara(bm, (cx0, cz1), (cx0, cz0), [(cz1 - 9.4, 2.4, 4.6, 1)], HC, n=(-1, 0))      # cara oeste (mira a -x)
    cara(bm, (cx0, cz0), (cx1, cz0), [], HC, n=(0, -1))                              # cara norte (mira a -z)
    # interior: caras que miran hacia adentro (oeste por dentro, norte por dentro) y techo del cubo
    cara(bm, (cx0 + .3, cz0 + .3), (cx0 + .3, cz1), [(9.4 - cz0 - .3, 2.4, 4.6, 1)], HC, n=(1, 0))
    cara(bm, (cx1, cz0 + .3), (cx0 + .3, cz0 + .3), [], HC, n=(0, 1))
    obj('cubo', bm, M['muro'], G)
    bm = bmesh.new(); caja(bm, cx0 - .12, cx1, HC, HC + .22, cz0 - .12, cz1)   # remate de cantera arriba del cubo
    uv_metros(bm); obj('cubo_top', bm, M['can'], G)
    for nm, y0, y1 in (('cubo_lam', 0, LAM), ('cubo_rod', LAM, LAM + .12)):
        bm = bmesh.new()
        cara(bm, (cx0 - .02, cz1), (cx0 - .02, cz0), [(cz1 - 9.4, 2.4, 4.6, 1)], H, y0, y1, n=(-1, 0))
        cara(bm, (cx0, cz0 - .02), (cx1, cz0 - .02), [], H, y0, y1, n=(0, -1))
        obj(nm, bm, M['lam' if nm == 'cubo_lam' else 'rod'], G)
    bm = bmesh.new()
    marco(bm, (cx0, cz1), (cx0, cz0), (-1, 0), cz1 - 9.4, 2.4, 4.6, 1)
    for z in V: marco(bm, (X0, Z1), (X0, Z0), (1, 0), Z1 - z, 1.7, 4.6, 1)
    uv_metros(bm); obj('marco', bm, M['rod'], G)
    bm = bmesh.new(); zc = 9.4; w = 1.9; rise = .2; run = .32
    for i in range(7):   # primer tramo hacia +x
        caja(bm, cx0 + .6 + i * run, cx1 - .02, 0, rise * (i + 1), zc - w / 2, zc + w / 2)
    lx = cx0 + .6 + 7 * run
    caja(bm, lx, cx1 - .02, 0, rise * 7, cz0 + .32, zc + w / 2)   # descanso
    for i in range(8):   # segundo tramo hacia -z, contra el muro del fondo del cubo
        z1 = zc - w / 2 - i * run
        caja(bm, lx, cx1 - .02, 0, rise * (8 + i), max(cz0 + .32, z1 - run), z1)
    uv_metros(bm); obj('escalon', bm, M['esc'], G)
    # arquería que parte el salón: atrás las mesas, adelante la estancia (dos caras para el corte y columnas)
    za, CO = K['ARQ'], K['COL']; cw = .6; bays = []; u = X0
    for c in CO: bays.append((u, c - cw / 2)); u = c + cw / 2
    bays.append((u, X1)); SP = 4.4
    hu = lambda x0: [((b0 + b1) / 2 - x0, b1 - b0, SP + (b1 - b0) / 2, 1) for (b0, b1) in bays]
    bm = bmesh.new(); cara(bm, (X0, za + .2), (X1, za + .2), hu(X0), H, n=(0, 1)); uv_metros(bm); obj('arq_S', bm, M['can'], G)
    bm = bmesh.new(); cara(bm, (X0, za - .2), (X1, za - .2), hu(X0), H, n=(0, -1)); uv_metros(bm); obj('arq_N', bm, M['can'], G)
    bm = bmesh.new()
    for (c, w, h, ar) in hu(X0): marco(bm, (X0, za + .2), (X1, za + .2), (0, 1), c, w, h, ar, prof=.4, m=0)
    for c in CO:
        caja(bm, c - .42, c + .42, 0, .5, za - .32, za + .32)
        caja(bm, c - .4, c + .4, SP - .25, SP, za - .3, za + .3)
    uv_metros(bm); obj('arq_col', bm, M['can'], G)
    # tapete redondo debajo de cada mesa (cada juego con su rincón)
    bm = bmesh.new(); uv = bm.loops.layers.uv.verify(); R = 3.4
    for (x, z) in K['TB']:
        vs = [bm.verts.new(P(x + math.cos(a) * R, .012, z + math.sin(a) * R)) for a in [i * math.pi * 2 / 48 for i in range(48)]]
        f = bm.faces.new(vs); f.normal_update()
        if f.normal.z < 0: f.normal_flip()
        for lp in f.loops:
            c3 = lp.vert.co; lp[uv].uv = ((c3.x - x) / (2 * R) + .5, (-c3.y - z) / (2 * R) + .5)
    obj('tapete', bm, M['tap'], G)
    # ventanales: persianas medio abiertas, reja y vidrio que brilla (luz de la tarde)
    bmP, bmR, bmL = bmesh.new(), bmesh.new(), bmesh.new()
    for z in V:
        for s in (-1, 1):   # dos hojas abiertas hacia adentro
            hz = z + s * .85
            a = math.radians(55); hx = X0 + .04
            ux, uz = math.sin(a), -s * math.cos(a)        # hacia donde se extiende la hoja
            px, pz = -uz * .02, ux * .02                   # medio grosor
            vs = []
            for t in (0, .85):
                for e in (-1, 1):
                    for y in (.2, 4.0):
                        vs.append(bmP.verts.new(P(hx + ux * t + px * e, y, hz + uz * t + pz * e)))
            bmesh.ops.convex_hull(bmP, input=vs)
        for i in range(7):
            zz = z - .7 + i * 1.4 / 6
            caja(bmR, X0 - .12, X0 - .08, 0, 4.0, zz - .02, zz + .02)
        for yy in (1.0, 2.6):
            caja(bmR, X0 - .12, X0 - .08, yy, yy + .04, z - .85, z + .85)
        bmL.faces.new([bmL.verts.new(P(X0 - .35, y, zz)) for y, zz in [(0, z - 1), (0, z + 1), (4.8, z + 1), (4.8, z - 1)]])
    uv_metros(bmP); obj('persiana', bmP, M['per'], G)
    uv_metros(bmR); obj('reja', bmR, M['hie'], G, lm=False)
    uv_metros(bmL); o = obj('vidrio_luz', bmL, M['luz'], G, lm=False); o.visible_shadow = False
    # arbotantes (lámparas de pared)
    bm = bmesh.new(); ARB = [(-13.5, Z0 + .12, 'z'), (1.5, Z0 + .12, 'z'), (11.5, Z0 + .12, 'z'), (X1 - .12, -1.5, 'x'), (-6, Z1 - .12, 'z'), (6, Z1 - .12, 'z'), (X0 + .12, 1.6, 'x'), (X0 + .12, 6.6, 'x')]
    for x, z, e in ARB:
        s = .18
        if e == 'z': caja(bm, x - s, x + s, 3.0, 3.45, z - .1 if z > 0 else z, z + .1 if z < 0 else z)
        else: caja(bm, x - .1 if x > 0 else x, x + .1 if x < 0 else x, 3.0, 3.45, z - s, z + s)
    uv_metros(bm); obj('arbotante', bm, M['arb'], G, lm=False)
    # solo para hornear: mesas (sombra suave debajo) y lamparas
    for (x, z) in K['TB']:
        bpy.ops.mesh.primitive_cylinder_add(radius=2.2, depth=.14, location=P(x, 1.5, z)); o = bpy.context.object
        for c in o.users_collection: c.objects.unlink(o)
        S.objects.link(o); o.data.materials.append(mat('mesa', (.1, .3, .15)))
        bpy.ops.mesh.primitive_cylinder_add(radius=.35, depth=1.5, location=P(x, .75, z)); o = bpy.context.object
        for c in o.users_collection: c.objects.unlink(o)
        S.objects.link(o); o.data.materials.append(mat('mesa', (.1, .3, .15)))
        l = bpy.data.lights.new('foco', 'SPOT'); l.energy = 2600; l.spot_size = math.radians(95); l.spot_blend = .8
        l.color = (1, .78, .5); l.shadow_soft_size = .5
        lo = bpy.data.objects.new('foco', l); lo.location = P(x, 5.4, z); S.objects.link(lo)
        l2 = bpy.data.lights.new('foco_up', 'POINT'); l2.energy = 300; l2.color = (1, .75, .45); l2.shadow_soft_size = .6
        lo2 = bpy.data.objects.new('foco_up', l2); lo2.location = P(x, 5.9, z); S.objects.link(lo2)
    for x, z, e in ARB:
        l = bpy.data.lights.new('arb', 'POINT'); l.energy = 160; l.color = (1, .72, .42); l.shadow_soft_size = .25
        off = (.45 if x < 0 else -.45) if e == 'x' else 0
        offz = (.45 if z < 0 else -.45) if e == 'z' else 0
        lo = bpy.data.objects.new('arb', l); lo.location = P(x + off, 3.5, z + offz); S.objects.link(lo)
    sol = bpy.data.lights.new('sol', 'SUN'); sol.energy = 4.5; sol.color = (1, .7, .42); sol.angle = math.radians(2)
    so = bpy.data.objects.new('sol', sol); S.objects.link(so)
    d = Vector((1, -.55, .3)).normalized()   # luz que entra desde el oeste (x<0), baja y un poco hacia el fondo
    dirB = Vector((d.x, -d.z, d.y)); so.rotation_euler = dirB.to_track_quat('-Z', 'Y').to_euler()
    # luz del cubo de la escalera (viene de arriba)
    l = bpy.data.lights.new('cubo', 'AREA'); l.energy = 300; l.size = 3; l.color = (1, .85, .65)
    lo = bpy.data.objects.new('cubo', l); lo.location = P((cx0 + cx1) / 2, 5.0, (cz0 + cz1) / 2); S.objects.link(lo)
    w = sc.world or bpy.data.worlds.new('Salon'); sc.world = w; w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs[0].default_value = (.35, .3, .28, 1); bg.inputs[1].default_value = .08
    return G

def uv_luz(G):
    obs = [o for o in G.objects if o.type == 'MESH' and o.get('lm')]
    for o in obs:
        if 'luz' not in o.data.uv_layers: o.data.uv_layers.new(name='luz')
        o.data.uv_layers.active = o.data.uv_layers['luz']
    bpy.ops.object.select_all(action='DESELECT')
    for o in obs: o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=.004, area_weight=1, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(margin=.004, rotate=True)
    bpy.ops.object.mode_set(mode='OBJECT')
    for o in obs: o.data.uv_layers.active = o.data.uv_layers[0]
    return obs

def hornear(sc, obs, res=None, samples=None):
    res = res or K['RES']; samples = samples or K['SAMPLES']
    img = bpy.data.images.get('salon_luz')
    if img: bpy.data.images.remove(img)
    img = bpy.data.images.new('salon_luz', res, res, float_buffer=True)
    for o in obs:
        o.data.uv_layers.active = o.data.uv_layers['luz']
        for m in o.data.materials:
            nt = m.node_tree; t = next((n for n in nt.nodes if n.type == 'TEX_IMAGE' and n.name == 'bake'), None)
            if not t: t = nt.nodes.new('ShaderNodeTexImage'); t.name = 'bake'
            t.image = img; nt.nodes.active = t
    sc.cycles.samples = samples; sc.cycles.use_denoising = False
    try: sc.cycles.device = 'GPU'
    except Exception: pass
    sc.render.bake.use_pass_direct = True; sc.render.bake.use_pass_indirect = True; sc.render.bake.use_pass_color = False
    sc.render.bake.margin = 8; sc.render.bake.target = 'IMAGE_TEXTURES'
    bpy.ops.object.select_all(action='DESELECT')
    for o in obs: o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    bpy.ops.object.bake(type='DIFFUSE')
    for o in obs: o.data.uv_layers.active = o.data.uv_layers[0]
    return img

def guardar(img, escala=.25):
    import numpy as np
    px = np.array(img.pixels[:], dtype=np.float32).reshape(-1, 4)
    px[:, :3] = np.clip(px[:, :3] * escala, 0, 1) ** (1 / 2.2); px[:, 3] = 1
    out = bpy.data.images.get('salon_luz_png') or bpy.data.images.new('salon_luz_png', img.size[0], img.size[1])
    out.scale(img.size[0], img.size[1]); out.colorspace_settings.name = 'Non-Color'
    out.pixels.foreach_set(px.ravel()); out.filepath_raw = os.path.join(DIR, 'salon_luz.png'); out.file_format = 'PNG'; out.save()

def exportar(G):
    bpy.ops.object.select_all(action='DESELECT')
    for o in G.objects:
        o.select_set(True)
        for m in o.data.materials:
            t = m.node_tree.nodes.get('bake')
            if t: m.node_tree.nodes.remove(t)
    bpy.ops.export_scene.gltf(filepath=os.path.join(DIR, 'salon.glb'), use_selection=True, export_format='GLB',
                              export_materials='EXPORT', export_extras=True, export_yup=True, export_texcoords=True,
                              export_normals=True, export_apply=True)

def todo(res=None, samples=None):
    sc = escena(); G = construir(sc); obs = uv_luz(G); img = hornear(sc, obs, res, samples); guardar(img); exportar(G)
    return G
