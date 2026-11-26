# plano.py — exporta la planta de la casona para el plano 2D (SOCIAL.md S5) a plano_casona.js, sin Blender:
# cuartos (areas de NIV en casona.py) y mesas (empties mesa_<juego> de cada GLB horneado; si falta el GLB, las de NIV).
# Correr con python normal después de hornear o mover marcas:  python blender/plano.py
import ast, json, os, struct
RAIZ = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.dirname(RAIZ)
src = open(os.path.join(RAIZ, 'casona.py'), encoding='utf-8').read()
mod = ast.parse(src); keep = [n for n in mod.body if isinstance(n, ast.Assign) and any(getattr(t, 'id', '') in ('NIV', 'FAM') for t in n.targets)]
ns = {}; exec(compile(ast.Module(body=keep, type_ignores=[]), 'casona.py', 'exec'), ns)
NIV = ns['NIV']
GLB = dict(nm1='sm', n0='pb', n1='pa', n2='az'); ID = dict(nm1='cm1', n0='c0', n1='c1', n2='c2')

def mesas_glb(nombre):
    p = os.path.join(REPO, 'modelos', 'casona', nombre + '.glb')
    if not os.path.exists(p): return None
    b = open(p, 'rb').read(); n = struct.unpack_from('<I', b, 12)[0]; J = json.loads(b[20:20 + n])
    out = []
    for nd in J.get('nodes', []):   # los empties mesa_* van sueltos en la raíz de la escena (casona.py)
        nm = nd.get('name', '')
        if not nm.startswith('mesa_'): continue
        t = nd.get('translation', [0, 0, 0]); ex = nd.get('extras', {}) or {}
        out.append(dict(g=ex.get('juego') or nm[5:], x=round(t[0], 2), z=round(t[2], 2), r=round(float(ex.get('r', 1.5)), 2)))
    return out or None

R = {}
for k, d in NIV.items():
    # casona.py usa x,z de la planta; el juego (three) usa x-OX y OZ-z (z al revés). OX,OZ se sacan de una mesa que esté en los dos
    gl = mesas_glb(GLB[k]); OX, OZ = 18, 17
    if gl:
        for m in d['mesas']:
            e = next((q for q in gl if q['g'] == m[0]), None)
            if e: OX, OZ = round(m[1] - e['x'], 2), round(e['z'] + m[2], 2); break
    T = lambda x0, z0, w, dd: dict(x=round(x0 - OX, 2), z=round(OZ - z0 - dd, 2), w=w, d=dd)
    areas = [dict(T(a[0], a[1], a[2], a[3]), c=a[4] or 'cuarto', n=a[6].strip()) for a in d['areas'] if a[4] != 'street']
    ms = gl or [dict(g=m[0], x=round(m[1] - OX, 2), z=round(OZ - m[2], 2), r=m[3]) for m in d['mesas']]
    pe = d['per']; R[ID[k]] = dict(per=list(T(*pe).values()), areas=areas, mesas=ms)
txt = ('// plano_casona.js — GENERADO por blender/plano.py (no editar a mano): planta de cada nivel de la casona para el plano 2D (c_plano2d.js).\n'
       '// per = [x,z,ancho,fondo] (esquina de menor x,z, en coordenadas del juego); areas: c = cuarto | open | void | earth; mesas: g = juego, x,z en metros (mismas coordenadas que la casa 3D).\n'
       'window.PLANO_C=' + json.dumps(R, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(REPO, 'plano_casona.js'), 'w', encoding='utf-8').write(txt)
print('plano_casona.js', len(txt), 'bytes;', {k: len(v['mesas']) for k, v in R.items()})
