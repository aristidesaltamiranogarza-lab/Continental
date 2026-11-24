// glb_cuantizar.js — achica un GLB exportado de Blender sin dependencias (KHR_mesh_quantization; three lo lee sin decodificador).
// Posición en uint16 normalizado (la escala y el desplazamiento van en el nodo), UV de luz (0..1) en uint16, color en uint8,
// normales fuera (CMAT usa MeshBasicMaterial) y vértices repetidos soldados. Uso:
//   node glb_cuantizar.js modelos/casona/calle.glb [salida.glb] [--normales] [--sin-uv0=fachada,hierro] [--sin-luz=hierro]
'use strict';
const fs = require('fs');
const arg = process.argv.slice(2), opt = {}, pos = [];
for (const a of arg) { const m = a.match(/^--([^=]+)(?:=(.*))?$/); if (m) opt[m[1]] = m[2] === undefined ? true : m[2]; else pos.push(a) }
if (!pos[0]) { console.log('uso: node glb_cuantizar.js entrada.glb [salida.glb] [--normales] [--sin-uv0=mat,..] [--sin-luz=mat,..]'); process.exit(1) }
const ent = pos[0], sal = pos[1] || ent, lista = k => new Set(String(opt[k] || '').split(',').filter(Boolean));
const SIN_UV0 = lista('sin-uv0'), SIN_LUZ = lista('sin-luz');

const glb = fs.readFileSync(ent);
if (glb.readUInt32LE(0) !== 0x46546c67) throw new Error('no es GLB');
let o = 12, J, BIN;
while (o < glb.length) { const n = glb.readUInt32LE(o), t = glb.readUInt32LE(o + 4), d = glb.subarray(o + 8, o + 8 + n); if (t === 0x4e4f534a) J = JSON.parse(d); else if (t === 0x004e4942) BIN = d; o += 8 + n }

const TIPO = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function leer(i) {   // accesor -> Float32Array (desnormalizado) con c componentes
  const a = J.accessors[i], v = J.bufferViews[a.bufferView], T = TIPO[a.componentType], c = NC[a.type], tb = T.BYTES_PER_ELEMENT;
  const st = v.byteStride || c * tb, base = (v.byteOffset || 0) + (a.byteOffset || 0), out = new Float32Array(a.count * c);
  const dv = new DataView(BIN.buffer, BIN.byteOffset + base);
  const get = { 5120: 'getInt8', 5121: 'getUint8', 5122: 'getInt16', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32' }[a.componentType];
  const mx = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }[a.componentType];
  for (let k = 0; k < a.count; k++) for (let j = 0; j < c; j++) {
    let x = dv[get](k * st + j * tb, true); if (a.normalized) x = Math.max(x / mx, -1); out[k * c + j] = x
  }
  return { d: out, c, n: a.count };
}

// ---- nuevo búfer ----
const partes = []; let largo = 0; const vistas = [];
function vista(buf, st, target) {
  const pad = (4 - largo % 4) % 4; if (pad) { partes.push(Buffer.alloc(pad)); largo += pad }
  const v = { buffer: 0, byteOffset: largo, byteLength: buf.length }; if (st) v.byteStride = st; if (target) v.target = target;
  partes.push(Buffer.from(buf.buffer, buf.byteOffset, buf.length)); largo += buf.length; vistas.push(v); return vistas.length - 1;
}
const accs = [];
function acc(bv, ct, type, count, norm, min, max) { const a = { bufferView: bv, componentType: ct, count, type }; if (norm) a.normalized = true; if (min) { a.min = min; a.max = max } accs.push(a); return accs.length - 1 }
// copia tal cual una vista vieja (imágenes, accesores que no son de malla)
const remapVista = new Map();
function copiaVista(i) {
  if (remapVista.has(i)) return remapVista.get(i);
  const v = J.bufferViews[i], d = BIN.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength);
  const n = vista(d, v.byteStride, v.target); remapVista.set(i, n); return n;
}

// nodos por malla: la escala de la posición va en el nodo (solo si la malla tiene un nodo sin rotación ni matriz)
const nodos = {}; (J.nodes || []).forEach((n, i) => { if (n.mesh !== undefined) (nodos[n.mesh] = nodos[n.mesh] || []).push(i) });
const matNom = i => i === undefined ? '' : (J.materials[i].name || '');
let vAntes = 0, vDespues = 0;
J.meshes.forEach((m, mi) => {
  const ns = nodos[mi] || [], nodo = ns.length === 1 ? J.nodes[ns[0]] : null;
  const qPos = nodo && !nodo.matrix && !(nodo.rotation && (Math.abs(nodo.rotation[3]) < .999999));
  // caja de la malla entera (todas sus primitivas comparten escala)
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], P = m.primitives.map(p => leer(p.attributes.POSITION));
  for (const { d } of P) for (let k = 0; k < d.length; k++) { lo[k % 3] = Math.min(lo[k % 3], d[k]); hi[k % 3] = Math.max(hi[k % 3], d[k]) }
  const S = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2], 1e-6);
  m.primitives.forEach((p, pi) => {
    const mn = matNom(p.material), cols = [];   // cols: {nombre, bytes por vértice, escribir(k, dv, off)}
    const pos = P[pi], n = pos.n; vAntes += n;
    if (qPos) cols.push({ a: 'POSITION', b: 8, ct: 5123, t: 'VEC3', norm: true, f: (k, dv, of) => { for (let j = 0; j < 3; j++) dv.setUint16(of + j * 2, Math.round((pos.d[k * 3 + j] - lo[j]) / S * 65535), true) } });
    else cols.push({ a: 'POSITION', b: 12, ct: 5126, t: 'VEC3', f: (k, dv, of) => { for (let j = 0; j < 3; j++) dv.setFloat32(of + j * 4, pos.d[k * 3 + j], true) } });
    for (const nom of Object.keys(p.attributes)) {
      if (nom === 'POSITION') continue;
      if (nom === 'NORMAL' && !opt.normales) continue;
      if (nom === 'TEXCOORD_0' && SIN_UV0.has(mn)) continue;
      if (nom === 'TEXCOORD_1' && SIN_LUZ.has(mn)) continue;
      const A = leer(p.attributes[nom]); let mn0 = Infinity, mx0 = -Infinity; for (const x of A.d) { mn0 = Math.min(mn0, x); mx0 = Math.max(mx0, x) }
      if (nom === 'NORMAL') cols.push({ a: nom, b: 4, ct: 5120, t: 'VEC3', norm: true, f: (k, dv, of) => { for (let j = 0; j < 3; j++) dv.setInt8(of + j, Math.round(A.d[k * 3 + j] * 127)) } });
      else if (nom.startsWith('COLOR_')) cols.push({ a: nom, b: 4, ct: 5121, t: A.c === 3 ? 'VEC3' : 'VEC4', norm: true, f: (k, dv, of) => { for (let j = 0; j < A.c; j++) dv.setUint8(of + j, Math.round(Math.min(Math.max(A.d[k * A.c + j], 0), 1) * 255)) } });
      else if (nom.startsWith('TEXCOORD_') && mn0 >= 0 && mx0 <= 1) cols.push({ a: nom, b: 4, ct: 5123, t: 'VEC2', norm: true, f: (k, dv, of) => { for (let j = 0; j < 2; j++) dv.setUint16(of + j * 2, Math.round(A.d[k * 2 + j] * 65535), true) } });
      else cols.push({ a: nom, b: A.c * 4, ct: 5126, t: ['', 'SCALAR', 'VEC2', 'VEC3', 'VEC4'][A.c], f: (k, dv, of) => { for (let j = 0; j < A.c; j++) dv.setFloat32(of + j * 4, A.d[k * A.c + j], true) } });
    }
    // vértice cuantizado completo -> clave para soldar
    const vb = cols.reduce((s, c) => s + c.b, 0), tmp = Buffer.alloc(n * vb), dt = new DataView(tmp.buffer, tmp.byteOffset);
    for (let k = 0; k < n; k++) { let of = k * vb; for (const c of cols) { c.f(k, dt, of); of += c.b } }
    const id = new Map(), nuevo = new Uint32Array(n), uni = [];
    for (let k = 0; k < n; k++) { const key = tmp.toString('latin1', k * vb, k * vb + vb); let u = id.get(key); if (u === undefined) { u = uni.length; id.set(key, u); uni.push(k) } nuevo[k] = u }
    const nu = uni.length; vDespues += nu;
    const idx = p.indices !== undefined ? leer(p.indices).d : Float32Array.from({ length: n }, (_, k) => k);
    const I = nu < 65536 ? new Uint16Array(idx.length) : new Uint32Array(idx.length);
    for (let k = 0; k < idx.length; k++) I[k] = nuevo[idx[k]];
    const at = {};
    let of = 0;
    for (const c of cols) {
      const buf = Buffer.alloc(nu * c.b);
      for (let u = 0; u < nu; u++) tmp.copy(buf, u * c.b, uni[u] * vb + of, uni[u] * vb + of + c.b);
      let mi_ = null, ma_ = null;
      if (c.a === 'POSITION') {
        const dvb = new DataView(buf.buffer, buf.byteOffset), get = c.ct === 5123 ? (k, j) => dvb.getUint16(k * c.b + j * 2, true) : (k, j) => dvb.getFloat32(k * c.b + j * 4, true);
        mi_ = [Infinity, Infinity, Infinity]; ma_ = [-Infinity, -Infinity, -Infinity];
        for (let u = 0; u < nu; u++) for (let j = 0; j < 3; j++) { const x = get(u, j); mi_[j] = Math.min(mi_[j], x); ma_[j] = Math.max(ma_[j], x) }
      }
      at[c.a] = acc(vista(buf, c.b, 34962), c.ct, c.t, nu, c.norm, mi_, ma_); of += c.b;
    }
    p.attributes = at;
    p.indices = acc(vista(Buffer.from(I.buffer), 0, 34963), I instanceof Uint16Array ? 5123 : 5125, 'SCALAR', I.length);
  });
  if (qPos) {   // q/65535*S + lo, dentro de la transformación del nodo
    const t = nodo.translation || [0, 0, 0], s = nodo.scale || [1, 1, 1];
    nodo.translation = [0, 1, 2].map(j => t[j] + s[j] * lo[j]); nodo.scale = s.map(x => x * S);
  }
});
// accesores que no son de malla (animaciones, pieles) e imágenes: se copian
for (const k of ['animations', 'skins']) if (J[k] && J[k].length) throw new Error('GLB con ' + k + ': no soportado');
(J.images || []).forEach(im => { if (im.bufferView !== undefined) im.bufferView = copiaVista(im.bufferView) });
J.accessors = accs; J.bufferViews = vistas;
const bin = Buffer.concat(partes); J.buffers = [{ byteLength: bin.length }];
J.extensionsUsed = [...new Set([...(J.extensionsUsed || []), 'KHR_mesh_quantization'])];
J.extensionsRequired = [...new Set([...(J.extensionsRequired || []), 'KHR_mesh_quantization'])];

const js = Buffer.from(JSON.stringify(J)), jp = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]), bp = Buffer.concat([bin, Buffer.alloc((4 - bin.length % 4) % 4)]);
const h = Buffer.alloc(12); h.writeUInt32LE(0x46546c67, 0); h.writeUInt32LE(2, 4); h.writeUInt32LE(12 + 8 + jp.length + 8 + bp.length, 8);
const ch = (t, d) => { const c = Buffer.alloc(8); c.writeUInt32LE(d.length, 0); c.writeUInt32LE(t, 4); return Buffer.concat([c, d]) };
const outB = Buffer.concat([h, ch(0x4e4f534a, jp), ch(0x004e4942, bp)]);
fs.writeFileSync(sal, outB);
console.log(`${ent}: ${glb.length} -> ${outB.length} bytes; vértices ${vAntes} -> ${vDespues}`);
