# blender/casona_esc.py — Escalera en U de la casona. casona_pb.py la carga con exec en sus globales (bmn, caja, ex, tubo, quad, T, C)
# y casona_pa/sm/az la usan como P.escalera_u(pre, nid, muro).
# Tramo 1 (z ESC['sube']) sube de x0 hacia -x hasta el descanso pegado al muro x=0; tramo 2 (z ESC['baja'], hasta el muro del fondo)
# regresa hacia +x sobre el hueco y llega al piso de arriba en x0. Contrahuella = alto entre niveles / (2 n).
# Cada nivel dibuja lo que sube (tramos, descanso, barandales, borde del hueco del techo) y lo que baja (tramo 2 y descanso del nivel
# de abajo dentro de un cubo cerrado bajo el hueco, con su barandal) para que el hueco nunca muestre el vacío.

def esc_hueco():
    """Hueco del piso (y del techo del nivel de abajo): x0, z0, x1, z1 (de cara a cara de muro)."""
    w = C.K['t'] / 2; return (w, C.ESC['baja'][0], C.ESC['x0'], 17 - w)

def quad_hueco(n, m, x, z, x1, z1, y=0, arriba=True, prio=1.0):
    hx0, hz0, hx1, hz1 = esc_hueco()
    for a, b, c, e in ((x, z, x1, hz0), (x, hz1, x1, z1), (x, hz0, hx0, hz1), (hx1, hz0, x1, hz1)):
        quad(n, m, a, b, c, e, y, arriba, prio)

def _alto(nid, d):
    o = C.ORDEN; i = o.index(nid); a, b = (nid, o[i + 1]) if d > 0 else (o[i - 1], nid)
    return C.NIV[b]['elev'] - C.NIV[a]['elev']

def _barandal(HI, PM, a, b, z, hb):
    """Herrería inclinada de a=(x, y) a b=(x, y) (y = nariz de los escalones), barrotes cada ~.2, barra baja y pasamanos de madera."""
    (xa, ya), (xb, yb) = a, b; nb = max(2, round(abs(xb - xa) / .2))
    for k in range(nb + 1):
        t = k / nb; x, y = xa + (xb - xa) * t, ya + (yb - ya) * t
        caja(HI, x - .016, x + .016, y, y + hb - .05, z - .016, z + .016)
    tubo(HI, (xa, ya + .14, z), (xb, yb + .14, z), .022, .022, 6)
    tubo(PM, (xa, ya + hb, z), (xb, yb + hb, z), .06, .06, 10)

def _poste(PM, x, y, z, hb):
    caja(PM, x - .07, x + .07, y, y + hb + .1, z - .07, z + .07)

def escalera_u(pre, nid, muro='muro'):
    E0 = C.ESC; ne, pa, x0 = E0['n'], E0['paso'], E0['x0']; xl = x0 - pa * ne        # xl: orilla del descanso
    w = C.K['t'] / 2; za, s1, b0, zb = 10 + w, E0['sube'][1], E0['baja'][0], 17 - w
    hb = C.K['barandal'] * .8; zr1, zr2 = s1 - .08, b0 + .08                          # barandales del lado de adentro de cada tramo
    nv = C.NIV[nid]
    PM = bmn(pre + '_escalera_pasamanos', 'madera'); HI = bmn(pre + '_escalera_hierro', 'hierro', luz=False)
    if nv['sube']:
        r = _alto(nid, 1); h = r / (2 * ne); m = ne * h; S = bmn(pre + '_escalera_sube', 'escalon')
        for s in range(ne):                                                           # tramo 1: macizo sobre el piso
            xa = x0 - pa * (s + 1); caja(S, xa, xa + pa, 0, h * (s + 1), za, s1)
        caja(S, w, xl, 0, m, za, s1); caja(S, w, xl, m - .3, m, s1, zb)              # descanso: macizo y losa sobre el hueco
        for s in range(ne):                                                           # tramo 2: losa escalonada sobre el hueco
            xa = xl + pa * s; caja(S, xa, xa + pa, m + h * s - .3, m + h * (s + 1), b0, zb)
        ex(pre + '_escalera_sube', escalera='sube')
        _barandal(HI, PM, (x0, h), (xl + pa, m), zr1, hb); _poste(PM, x0 + .05, 0, zr1, h + hb); _poste(PM, xl - .07, m, zr1, hb)
        _barandal(HI, PM, (xl, m + h), (x0 - pa, r), zr2, hb); _poste(PM, xl - .07, m, zr2, hb + h)
        M = bmn(pre + '_escalera_borde', muro); y0 = nv['H'] - .02                    # borde de la losa alrededor del hueco del techo
        for c in ((w, x0, b0 - .05, b0), (w, x0, zb, zb + .05), (w - .05, w, b0, zb), (x0, x0 + .05, b0, zb)):
            caja(M, c[0], c[1], y0, r, c[2], c[3])
        vacio('escalera_sube_' + nid, x0 - .4, 0, (E0['sube'][0] + s1) / 2, r=1.0, to=C.ORDEN[C.ORDEN.index(nid) + 1], pie=[.7, 0])
    if nv['baja']:
        r = _alto(nid, -1); h = r / (2 * ne); m = -ne * h; B = bmn(pre + '_escalera_baja', 'escalon')
        for s in range(ne):                                                           # tramo 2 del nivel de abajo (el de arriba queda a ras)
            xa = xl + pa * s; caja(B, xa, xa + pa, m + h * s - .3, m + h * (s + 1), b0, zb)
        caja(B, w, xl, m - .3, m, b0, zb)
        ex(pre + '_escalera_baja', escalera='baja')
        M = bmn(pre + '_escalera_cubo', muro)                                         # cubo cerrado bajo el hueco
        for c in ((w, x0, s1, b0), (w, x0 + .05, zb, zb + .05), (w - .05, w, b0, zb), (x0, x0 + .05, b0, zb)):
            caja(M, c[0], c[1], -r, 0, c[2], c[3])
        _barandal(HI, PM, (xl, m + h), (x0 - pa, 0), zr2, hb); _poste(PM, x0 - pa, 0, zr2, hb)
        if not nv['sube']:                                                            # sin tramo que suba: barandal recto a ras del piso
            _barandal(HI, PM, (w + .1, 0), (x0, 0), zr1 + .1, hb); _poste(PM, x0, 0, zr1 + .1, hb)
        ex(pre + '_escalera_pasamanos', segs=T(w, s1 + .1) + T(x0, s1 + .1), r=.2)     # no caminar al hueco por el costado
        vacio('escalera_baja_' + nid, x0 - .4, 0, (b0 + E0['baja'][1]) / 2, r=1.0, to=C.ORDEN[C.ORDEN.index(nid) - 1], pie=[.7, 0])
