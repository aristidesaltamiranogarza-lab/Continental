# R4: diagnóstico del mapa de luz (se ejecuta dentro de casona_pb.py con exec): texeles por metro por material,
# islas giradas (orillas en diagonal a la rejilla = escalones) y caras con un lado de menos de 2 texeles.
import bmesh, math

def densidad(obs, res):
    por, gir, rec, fill, del2, del4, nca = {}, 0., 0., 0., 0, 0, 0
    for o in obs:
        mat = o.data.materials[0].name if o.data.materials and o.data.materials[0] else '?'
        bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world); uv = bm.loops.layers.uv['luz']
        for f in bm.faces:
            A = f.calc_area()
            if A < 1e-6: continue
            p = [l[uv].uv for l in f.loops]
            a = abs(sum(p[i].x * p[i - 1].y - p[i - 1].x * p[i].y for i in range(len(p)))) / 2
            fill += a; tx = math.sqrt(a * res * res / A); por.setdefault(mat, []).append((tx, A))
            for l in f.loops:   # orillas del modelo paralelas a un eje: en el atlas deberían ir paralelas a la rejilla
                d3 = l.link_loop_next.vert.co - l.vert.co
                if d3.length < 1e-4 or max(abs(d3.x), abs(d3.y), abs(d3.z)) / d3.length < .9998: continue
                d = (l.link_loop_next[uv].uv - l[uv].uv) * res; n = d.length
                if n < .5: continue
                ang = math.degrees(math.atan2(abs(d.y), abs(d.x))) % 90; rec += n
                if 1 < ang < 89: gir += n
            xs = [q.x for q in p]; ys = [q.y for q in p]; nca += 1
            w = min(max(xs) - min(xs), max(ys) - min(ys)) * res
            if w < 2: del2 += 1
            if w < 4: del4 += 1
        bm.free()
    print('R4 diag: atlas usado %.0f%%, orillas giradas %.1f%% (por longitud), caras con lado <2 tx %.1f%%, <4 tx %.1f%%'
          % (100 * fill, 100 * gir / max(rec, 1e-6), 100 * del2 / max(nca, 1), 100 * del4 / max(nca, 1)), flush=True)
    for mat, v in sorted(por.items(), key=lambda kv: -sum(a for _, a in kv[1])):
        v.sort(); tot = sum(a for _, a in v); acc, q = 0, {}
        for tx, a in v:
            acc += a
            for k in (.1, .5, .9):
                if k not in q and acc >= k * tot: q[k] = tx
        print('  %-10s %7.0f m2  tx/m p10 %5.1f p50 %5.1f p90 %5.1f' % (mat, tot, q[.1], q[.5], q[.9]), flush=True)
