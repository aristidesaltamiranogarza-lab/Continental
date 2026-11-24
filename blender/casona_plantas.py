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

def platano(TL, HO, SE, x, z, al, R):
    """Mata de plátano: tallo verde que adelgaza, 7 hojas grandes arqueadas, una enrollada al centro y 1-2 secas colgando."""
    tubo(TL, (x, 0, z), (x, al, z), .2, .13, 10); g0 = R.uniform(0, 6.28)
    for k in range(7):
        a = g0 + k * 2 * math.pi / 7 + R.uniform(-.25, .25); y = al - R.uniform(.05, .35)
        hoja(HO, (x + math.cos(a) * .08, y, z + math.sin(a) * .08), a, R.uniform(1.5, 2.0), R.uniform(.62, .78), R.uniform(.35, .65), R.uniform(.9, 1.5),
             n=6, grueso=.03)
    hoja(HO, (x, al - .1, z), g0, .15, .12, 1.0, -.05, n=3, grueso=.05, forma='punta')
    for k in range(R.randint(1, 2)):
        a = g0 + R.uniform(0, 6.28)
        hoja(SE, (x + math.cos(a) * .12, al - .4, z + math.sin(a) * .12), a, R.uniform(.25, .4), .26, .05, R.uniform(1.1, 1.5), n=4, grueso=.02)

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
    top = [bm.verts.new(V(x, y, z)) for x, z in pts]; bm.faces.new(top)

def bugambilia(CP, FL, TR, x, z, R):
    """Bugambilia trepada a la barda (z = cara del muro, crece hacia z menor): matas separadas en abanico hasta ~3.3, cada una con su
    racimo de flor encima, unidas por bejucos que salen de un tronco torcido al pie."""
    tubo(TR, (x + .3, 0, z - .2), (x + .5, 1.0, z - .28), .13, .1, 8); pie = (x + .5, 1.0, z - .28)
    for k, (dx, y, r) in enumerate(((.8, .75, .6), (1.6, 1.5, .7), (.6, 2.2, .62), (2.5, 2.35, .68), (1.5, 3.05, .62), (3.4, 3.0, .55), (3.9, 1.6, .5))):
        px = x + dx + R.uniform(-.15, .15); py = y + R.uniform(-.1, .1); pz = z - .45
        tubo(TR, pie, (px, py, pz + .1), .07, .035, 6)
        mata(CP, px, py, pz, r, .8, sem=k * 13 + 5, piso=py - r * .5)
        if k != 0: mata(FL, px + R.uniform(-.2, .2), py + r * .4, pz - r * .62, r * R.uniform(.62, .75), .75, sem=k * 7 + 1, lob=(3, 4), res=2.4)
