# Poses de la Ruleta Rusa (R3): rig.py la corre con sus globales justo antes de exportar
#   exec(open(.../poses_ruleta.py).read(), globals())
# Acciones de un cuadro (el juego las mezcla): TomaArma, GiraTambor, CargaBala, ApuntaI/ApuntaC/ApuntaD (60 grados a su
# izquierda, al frente, a su derecha), Alivio, Muerte, AvientaArma, ReposoNervioso. Ninguna toca la cabeza con la mano,
# asi que no llevan variante por peinado. Amartilla_D: solo el pulgar derecho (cuadro 1 = agarre, 10 = sobre el martillo).
# Medidas del juego: sentado, la mesa queda a z ~1.14 y su orilla a y ~-0.6 (frente = -y, +x = su izquierda).
NOMBRES_R3 = ('TomaArma', 'GiraTambor', 'CargaBala', 'ApuntaI', 'ApuntaC', 'ApuntaD', 'Alivio', 'Muerte', 'AvientaArma',
              'ReposoNervioso', 'Amartilla_D')
for a in [a for a in bpy.data.actions if a.name.split('.')[0] in NOMBRES_R3]: bpy.data.actions.remove(a)
R3 = dict(APUNTA=60, ALCANCE=0.52)
R3.update(K.get('R3', {}))
hcol = bones['columna'].head_local; hcab = bones['cabeza'].head_local
ALC = (K['L1'] + K['L2']) * 0.995

def gira_en(c, rx=0, ry=0, rz=0):
    """Giro en grados alrededor de c: rx al frente (agacha), ry ladea a su izquierda, rz voltea a su izquierda."""
    return (Matrix.Translation(c) @ Matrix.Rotation(math.radians(rz), 4, 'Z') @ Matrix.Rotation(math.radians(ry), 4, 'Y')
            @ Matrix.Rotation(math.radians(rx), 4, 'X') @ Matrix.Translation(-c))

def cuerpo(rx=0, ry=0, rz=0, cab=(0, 0, 0), alza=(0, 0)):
    """Tronco girado en la columna, cabeza encima y hombros alzados (grados, I y D). -> (HI, HD, metas extra)."""
    L = gira_en(hcol, rx, ry, rz)
    HI = L @ gira_en(bones['hombro_I'].head_local, ry=-alza[0]); HD = L @ gira_en(bones['hombro_D'].head_local, ry=alza[1])
    ex = {'columna': L @ bones['columna'].matrix_local, 'hombro_I': HI @ bones['hombro_I'].matrix_local,
          'hombro_D': HD @ bones['hombro_D'].matrix_local, 'cabeza': L @ gira_en(hcab, *cab) @ bones['cabeza'].matrix_local}
    return HI, HD, ex

def resto(M, suf):
    S_, E_, W_, f_, n_ = REST[suf]; R = M.to_3x3()
    return (M @ S_, M @ E_, M @ W_, R @ f_, R @ n_)

def brazo(S_, W, f, n, pole):
    if (W - S_).length > ALC: W = S_ + (W - S_).normalized() * ALC
    E_, W2 = ik(S_, W, pole); return (S_, E_, W2, f.normalized(), n)

POLE_D, POLE_I = V((-1, 0.3, -1)), V((1, 0.3, -1))
def con_arma(S_, W, f, up):
    """Mano derecha con el revolver: canon hacia f, la parte de arriba del arma hacia up."""
    f = f.normalized(); up = (up - f * up.dot(f)).normalized()
    return brazo(S_, W, f, f.cross(up), POLE_D)
def hombros(HI, HD): return HI @ V((hx, hy, hz)), HD @ V((-hx, hy, hz))

POSES = {}
# --- tomar el arma de la mesa (inclinado al frente) ---
HI, HD, ex = cuerpo(rx=18, cab=(14, 0, 0)); SI, SD = hombros(HI, HD)
POSES['TomaArma'] = pose_brazos({'_D': con_arma(SD, V((-0.12, -0.66, 1.16)), V((0.15, -0.97, -0.15)), V((0, 0, 1))),
                                 '_I': resto(HI, '_I')}, ex)[0]

# --- apuntar: tres poses (a su izquierda, al frente, a su derecha); el tronco gira 35 % y la cabeza otro 50 % ---
for nom, a in (('ApuntaI', R3['APUNTA']), ('ApuntaC', 0), ('ApuntaD', -R3['APUNTA'])):
    HI, HD, ex = cuerpo(rz=a * 0.35, cab=(0, 0, a * 0.5)); SI, SD = hombros(HI, HD)
    r = math.radians(a); f = V((math.sin(r), -math.cos(r), 0))
    W = V((0, 0, 1.6)) + f * R3['ALCANCE'] + V((-0.05, 0, 0))
    POSES[nom] = pose_brazos({'_D': con_arma(SD, W, f + V((0, 0, 0.02)), V((0, 0, 1))), '_I': resto(HI, '_I')}, ex)[0]
    print(nom, 'alcance', round((W - SD).length, 3), 'de', round(ALC, 3))

# piezas del revolver en la armadura con la mano puesta (pose['mano_D'] @ MG: mundo del revolver -> armadura)
def pieza(nm): return bpy.data.objects[nm].matrix_world.translation.copy()
drumW, recW = pieza('Rev_EjeTambor'), pieza('Rev_Recamara')
RT = max(abs(v.co.x) for v in bpy.data.objects['Rev_Tambor'].data.vertices)    # radio del tambor
def marco_arma(pose):
    G = pose['mano_D'] @ MG; R = G.to_3x3()
    return G, (R @ V((1, 0, 0))).normalized(), (R @ V((0, 1, 0))).normalized(), (R @ V((0, 0, 1))).normalized()
def mano_en(SI, pal, fC, nI):
    """Mano izquierda con el centro de la palma en pal, dedos hacia fC y el dorso hacia nI."""
    Wt = pal - fC * (K['MUNECA'][2] * 0.4 + K['PALMA'][2] * 0.5)
    return brazo(SI, Wt, fC, nI, V((1, 0.5, -0.3))), (Wt - SI).length

# --- girar el tambor: arma frente al pecho apuntando a su izquierda; la palma izquierda contra el tambor ---
HI, HD, ex = cuerpo(rx=6, cab=(16, 0, 10)); SI, SD = hombros(HI, HD)
aD = con_arma(SD, V((-0.1, -0.42, 1.3)), V((0.55, -0.7, 0.35)), V((0, 0, 1)))
_, pz = pose_brazos({'_D': aD, '_I': resto(HI, '_I')}, ex)
G, Xg, Yg, Zg = marco_arma(pz); Dc = G @ drumW
lado_t = -Xg if (-Xg).dot(SI - Dc) > Xg.dot(SI - Dc) else Xg
aI, dl = mano_en(SI, Dc + lado_t * (RT + K['PALMA'][1] / 2 + 0.004), Zg, lado_t)
POSES['GiraTambor'] = pose_brazos({'_D': aD, '_I': aI}, ex)[0]
print('GiraTambor: mano izq a', round(dl, 3), 'de', round(ALC, 3))

# --- cargar: el lado de la puerta (+X del arma, su derecha) mira arriba; la mano izquierda detras de la recamara ---
HI, HD, ex = cuerpo(rx=8, cab=(20, 0, 10)); SI, SD = hombros(HI, HD)
fC_ = V((0.7, -0.55, -0.2)).normalized(); up = V((0, 0.35, 1)).normalized().cross(fC_)
aD = con_arma(SD, V((-0.08, -0.4, 1.28)), fC_, up)
_, pz = pose_brazos({'_D': aD, '_I': resto(HI, '_I')}, ex)
G, Xg, Yg, Zg = marco_arma(pz); Rc = G @ recW
pinza = Rc + Xg * 0.03 - Yg * 0.05; fd = (Rc - pinza).normalized()
aI, dl = mano_en(SI, pinza - fd * 0.07, fd, Xg)
POSES['CargaBala'] = pose_brazos({'_D': aD, '_I': aI}, ex)[0]
print('CargaBala: mano izq a', round(dl, 3), 'de', round(ALC, 3))

# --- alivio: exhala, se encorva, hombros abajo, el arma baja a la mesa ---
HI, HD, ex = cuerpo(rx=14, cab=(18, 0, 0), alza=(-6, -6)); SI, SD = hombros(HI, HD)
POSES['Alivio'] = pose_brazos({'_D': con_arma(SD, V((-0.16, -0.62, 1.2)), V((0.25, -0.95, -0.15)), V((0, 0, 1))),
                               '_I': resto(HI, '_I')}, ex)[0]

# --- muerte: el golpe del balazo en la sien derecha (cabeza atras y a su izquierda, brazo derecho se abre) ---
HI, HD, ex = cuerpo(rx=-6, ry=14, cab=(-20, 28, 10)); SI, SD = hombros(HI, HD)
POSES['Muerte'] = pose_brazos({'_D': con_arma(SD, SD + V((-0.35, 0.05, 0.3)), V((-0.6, 0, 0.8)), V((0, -1, 0))),
                               '_I': resto(HI, '_I')}, ex)[0]

# --- aventar el arma: brazo estirado al frente y abajo, hacia el centro de la mesa ---
HI, HD, ex = cuerpo(rx=14, rz=5, cab=(10, 0, 0)); SI, SD = hombros(HI, HD)
POSES['AvientaArma'] = pose_brazos({'_D': con_arma(SD, V((-0.05, -0.64, 1.26)), V((0.15, -0.95, -0.25)), V((0, 0, 1))),
                                    '_I': resto(HI, '_I')}, ex)[0]

# --- en la mesa, inquieto: manos planas en la mesa, hombros encogidos ---
HI, HD, ex = cuerpo(rx=16, cab=(4, 0, 0), alza=(10, 10)); SI, SD = hombros(HI, HD)
POSES['ReposoNervioso'] = pose_brazos({
    '_D': brazo(SD, V((-0.14, -0.68, 1.19)), V((0.25, -1, -0.1)), V((0, 0, 1)), POLE_D),
    '_I': brazo(SI, V((0.14, -0.68, 1.19)), V((-0.25, -1, -0.1)), V((0, 0, 1)), POLE_I)}, ex)[0]

for nom, q in POSES.items(): accion(nom, [(1, q)])

# --- Amartilla_D: el pulgar derecho busca la espuela del martillo (mano en reposo, revolver en la mano) ---
mart = bpy.data.objects['Rev_Martillo']; Mw = mart.matrix_world
Ps = Rm @ MG @ max((Mw @ v.co for v in mart.data.vertices), key=lambda p: p.z - p.y)   # punta: lo mas atras y arriba
S0, E0, W0, f0, n0 = REST['_D']
def pulgar(p0, W=W0, f=f0, n=n0, lado=-1):
    f = f.normalized(); n = (n - f * n.dot(f)).normalized(); s = f.cross(n) * lado
    pw = K['PALMA'][0]; ml = K['MUNECA'][2]; o1 = W - f * ml * 0.6 + f * ml
    base = o1 + f * 0.02 + s * (pw / 2 - 0.02) - n * 0.01
    d = (f * math.cos(math.radians(p0[0])) + s * math.sin(math.radians(p0[0]))).normalized()
    d = (d * math.cos(math.radians(p0[1])) - n * math.sin(math.radians(p0[1]))).normalized()
    nt = (n - d * n.dot(d)).normalized(); st = d.cross(nt)
    eje = st if rot(d, st, -10).dot(nt) < 0 else -st
    out = {}; cadena(out, 'pulgar', base, d, nt, K['PULGAR'], p0[2:], eje); return out
mejor = None
for a0 in range(-40, 181, 15):
    for a1 in range(-90, 91, 15):
        for c1 in range(-30, 61, 15):
            for c2 in range(-30, 61, 15):
                p0 = (a0, a1, c1, c2); dd = (pulgar(p0)['pulgar2'][1] - Ps).length + 0.0002 * (abs(c1) + abs(c2))
                if not mejor or dd < mejor[0]: mejor = (dd, p0)
out = pulgar(mejor[1])
qp, _ = resolver({k + '_D': marco(*v) for k, v in out.items()})
QP = {k + '_D': qp[k + '_D'] for k in out}
accion('Amartilla_D', [(1, {k: AGARRE['_D'][k] for k in QP}), (10, QP)])
print('Amartilla_D: pulgar', mejor[1], 'punta a', round((out['pulgar2'][1] - Ps).length * 1000), 'mm del martillo; base a',
      round((out['pulgar1'][0] - Ps).length * 1000), 'mm')
