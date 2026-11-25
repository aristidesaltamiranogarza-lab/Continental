# blender/casona_plantas.py — PLANTAS: matas, hojas, zacate, flores y manchas de tierra con la calidad de los árboles (arbol_ramas en
# casona_pb.py): matas de metabolas fundidas (suaves, con lóbulos), hojas con volumen que se arquean (plátano, agave, cebollín),
# briznas de zacate en macollo y flores sobre la superficie de las matas. Se ejecuta dentro de casona_pb.py (deco()) y usa sus
# ayudantes (V, nube_mb, bmn, tubo). Coordenadas del plano (x, alto, z).
COLOR.update(flor=(.7, .12, .38), zacate=(.4, .5, .2), hoja_seca=(.48, .38, .2), tallo=(.36, .44, .22), hoja_c=(.42, .6, .26))

def mata(bm, x, y, z, r, sy=.8, sem=0, lob=(4, 6), res=2.6, piso=None):
    """Mata redonda fundida: centro, lóbulos en la orilla y 1-2 bultos encima; abajo plana en 'piso' (si no, a .55 del centro).
    Regresa el índice del primer vértice (para ponerle flores encima)."""
    R = random.Random(sem); bl = [(x, y, z, r * .8)]; b0 = R.uniform(0, 6.28); nl = R.randint(*lob)
    for k in range(nl):
        b = b0 + k * 2 * math.pi / nl + R.uniform(-.3, .3); d = r * R.uniform(.45, .7)
        bl.append((x + math.cos(b) * d, y + r * sy * R.uniform(-.05, .3), z + math.sin(b) * d, r * R.uniform(.45, .6)))
    for _ in range(R.randint(1, 2)):
        b = R.uniform(0, 6.28); d = r * R.uniform(0, .35)
        bl.append((x + math.cos(b) * d, y + r * sy * R.uniform(.45, .7), z + math.sin(b) * d, r * R.uniform(.45, .55)))
    bm.verts.ensure_lookup_table(); n0 = len(bm.verts)
    nube_mb(bm, bl, sy, r / res, y - r * sy * .55 if piso is None else piso)
    return n0

def flores(bf, bm, n0, n, tam, R, sub=1):
    """n flores (icoesferas chicas) sobre la superficie de la mata bm[n0:], en los costados y arriba (no abajo)."""
    bm.verts.ensure_lookup_table(); bm.normal_update()
    vs = [v for v in bm.verts[n0:] if v.normal.z > -.05]
    for v in R.sample(vs, min(n, len(vs))):
        t = tam * R.uniform(.8, 1.2)
        bmesh.ops.create_icosphere(bf, subdivisions=sub, radius=t, matrix=Matrix.Translation(v.co + v.normal * t * .3))

def hoja(bm, base, rumbo, largo, ancho, alza, cae, n=4, grueso=.03, forma='lanza', lados=4):
    """Hoja con volumen que sale de base hacia rumbo (radianes en el piso): avanza 'largo', se arquea hasta ~alza y termina 'cae' abajo
    de esa altura. forma: 'lanza' (angosta en los extremos: plátano), 'punta' (ancha abajo y aguda: agave), 'brizna' (zacate, cebollín).
    Corte de rombo delgado (lados=4) o triángulo (lados=3, más ligero)."""
    dx, dz = math.cos(rumbo), math.sin(rumbo); P0 = Vector(base)
    C = Vector((base[0] + dx * largo * .45, base[1] + alza * 1.5, base[2] + dz * largo * .45))
    E = Vector((base[0] + dx * largo, base[1] + alza - cae, base[2] + dz * largo))
    L = Vector((-dz, 0, dx)); anillos = []
    for i in range(n):
        t = i / n; p = (1 - t) ** 2 * P0 + 2 * t * (1 - t) * C + t * t * E
        tg = (2 * (1 - t) * (C - P0) + 2 * t * (E - C)).normalized(); U = L.cross(tg).normalized()
        w = ancho * (max(.12, math.sin(math.pi * t) ** .6) if forma == 'lanza' else (1 - t) ** .7 if forma == 'punta' else (1 - t) * .9 + .1)
        g = grueso * (1 - .6 * t)
        q = [p - L * w / 2, p + U * g, p + L * w / 2] + ([p - U * g * .5] if lados == 4 else [])
        anillos.append([bm.verts.new(V(*c)) for c in q])
    punta = bm.verts.new(V(*E)); m = len(anillos[0])
    bm.faces.new(anillos[0][::-1])
    for a, b in zip(anillos, anillos[1:]):
        for k in range(m): j = (k + 1) % m; bm.faces.new([a[k], a[j], b[j], b[k]])
    for k in range(m): bm.faces.new([anillos[-1][k], anillos[-1][(k + 1) % m], punta])

def zacate(bm, x, z, alto, R, nb=13, y=0.0):
    """Macollo de zacate tupido: nb briznas anchas que salen juntas; las de afuera se abren y caen, las de adentro van más paradas."""
    g0 = R.uniform(0, 6.28)
    for k in range(nb):
        a = g0 + k * 2.4 + R.uniform(-.3, .3); f = k / nb; h = alto * R.uniform(.75, 1.1) * (.8 + .4 * f); d = .03 + .09 * (1 - f)
        hoja(bm, (x + math.cos(a) * d, y, z + math.sin(a) * d), a, h * (.75 - .45 * f) * R.uniform(.8, 1.2), R.uniform(.09, .13), h, h * (.6 - .4 * f),
             n=2, grueso=.02, forma='brizna', lados=3)

def hoja_v(bm, x, y, z, a, L, W, sube, cae, seg=4, dobla=.22):
    """Hoja grande del estilo del barrio (barrio_plantas._hoja, sin color por vértice): sube y cae en arco, sección en V abierta,
    dos caras separadas 1.2 cm, caras suaves."""
    ca, sa = math.cos(a), math.sin(a); px, pz = -sa, ca; fil = []
    for i in range(seg + 1):
        t = i / seg; d = L * t; h = y + sube * math.sin(math.pi * min(t / .55, 1) / 2) - cae * max(0, (t - .45) / .55) ** 1.6
        w = math.sin(math.pi * (.08 + .92 * t)) ** .7 * W / 2; cx, cz = x + ca * d, z + sa * d; ho = h - dobla * w
        fil.append([(cx - px * w, ho, cz - pz * w), (cx, h, cz), (cx + px * w, ho, cz + pz * w)])
    for e, sg in ((.006, 1), (-.006, -1)):
        vs = [[bm.verts.new(V(p[0], p[1] + e, p[2])) for p in f] for f in fil]
        for i in range(seg):
            for j in range(2):
                q = (vs[i][j], vs[i + 1][j], vs[i + 1][j + 1], vs[i][j + 1])
                f = bm.faces.new(q if sg > 0 else q[::-1]); f.normal_update()
                if (f.normal.z < 0) == (sg > 0): f.normal_flip()
                f.smooth = True

def _suave(bm, n0):
    bm.faces.ensure_lookup_table()
    for f in bm.faces[n0:]: f.smooth = True

def platano(TL, HO, SE, x, z, al, R, hijo=True):
    """Mata de plátano (como la del barrio, barrio_plantas.platano): tallo suave que adelgaza, 6 hojas grandes arqueadas que cuelgan,
    una hoja seca pegada al tallo, a veces el racimo y un hijuelo al pie."""
    n0 = len(TL.faces); tubo(TL, (x, -.05, z), (x, al * .55, z), .19, .15, 8); tubo(TL, (x, al * .55, z), (x, al, z), .15, .11, 8); _suave(TL, n0)
    n = 6 if hijo else 3; b0 = R.uniform(0, 6.3)
    for k in range(n):
        a = b0 + k * 2 * math.pi / n + R.uniform(-.25, .25)
        hoja_v(HO, x, al - .05 + R.uniform(0, .3), z, a, R.uniform(1.9, 2.3) * al / 2.7, R.uniform(.55, .7), R.uniform(.5, .9), R.uniform(.9, 1.5))
    a = b0 + R.uniform(0, 6.3); hoja_v(SE, x + math.cos(a) * .12, al * .8, z + math.sin(a) * .12, a, .9, .4, .05, 1.3, seg=3, dobla=.1)
    if hijo and R.random() < .55:   # racimo verde colgando
        a = R.uniform(0, 6.3); ca, sa = math.cos(a), math.sin(a); t1 = (x + ca * .45, al - .35, z + sa * .45)
        n0 = len(TL.faces); tubo(TL, (x + ca * .1, al - .1, z + sa * .1), t1, .04, .035, 6)
        bmesh.ops.create_icosphere(TL, subdivisions=1, radius=.2, matrix=Matrix.Translation(V(t1[0], t1[1] - .32, t1[2])) @ Matrix.Diagonal((1, 1, 1.7, 1)))
        _suave(TL, n0)
    if hijo and R.random() < .35:
        a = R.uniform(0, 6.3); platano(TL, HO, SE, x + math.cos(a) * .55, z + math.sin(a) * .55, al * R.uniform(.35, .5), random.Random(R.random()), hijo=False)

def agave(bm, x, y, z, s, R):
    """Agave: tres coronas de pencas gruesas y agudas, más paradas hacia el centro."""
    g0 = R.uniform(0, 6.28)
    for nk, la, al, ca in ((7, .95, .28, .12), (6, .75, .55, .02), (5, .5, .7, -.08)):
        for k in range(nk):
            a = g0 + (k + nk * .37) * 2 * math.pi / nk + R.uniform(-.15, .15)
            hoja(bm, (x, y, z), a, la * s, .19 * s, al * s, ca * s, n=4, grueso=.07 * s, forma='punta')

def mancha(bm, cx, cz, r, R, n=16, y=.012):
    """Mancha de tierra irregular y delgada sobre el pasto (al pie de un árbol)."""
    pts = [(cx + math.cos(6.283 * i / n) * r * R.uniform(.78, 1.1), cz + math.sin(6.283 * i / n) * r * R.uniform(.78, 1.1)) for i in range(n)]
    top = [bm.verts.new(V(x, y, z)) for x, z in pts]; f = bm.faces.new(top); f.normal_update()
    if f.normal.z < 0: f.normal_flip()      # mirando abajo se veía negra en el juego

def bugambilia(CP, FL, TR, x, z, R):
    """Bugambilia trepada a la barda (z = cara del muro, crece hacia z menor): matas separadas en abanico hasta ~3.3, cada una con su
    racimo de flor encima, unidas por bejucos que salen de un tronco torcido al pie."""
    tubo(TR, (x + .3, 0, z - .2), (x + .5, 1.0, z - .28), .13, .1, 8); pie = (x + .5, 1.0, z - .28)
    for k, (dx, y, r) in enumerate(((.8, .75, .6), (1.6, 1.5, .7), (.6, 2.2, .62), (2.5, 2.35, .68), (1.5, 3.05, .62), (3.4, 3.0, .55), (3.9, 1.6, .5))):
        px = x + dx + R.uniform(-.15, .15); py = y + R.uniform(-.1, .1); pz = z - .45
        tubo(TR, pie, (px, py, pz + .1), .07, .035, 6)
        mata(CP, px, py, pz, r, .8, sem=k * 13 + 5, piso=py - r * .5)
        if k != 0: mata(FL, px + R.uniform(-.2, .2), py + r * .4, pz - r * .62, r * R.uniform(.62, .75), .75, sem=k * 7 + 1, lob=(3, 4), res=2.4)
