// 2B obje çizimlerinden gerçek 3B objeler.
// Her çizimin silüeti çıkarılır, kalınlık ve yuvarlatılmış kenar verilerek
// (ExtrudeGeometry) ışıkla gölgelenen, yansımalı bir nesneye dönüştürülür.
// Ön ve arka yüzde çizim dokusu, yanlarda objenin boyanmış gövde rengi var.
import * as THREE from '../vendor/three/three.module.js';

const GRID = 72;            // silüet çıkarma çözünürlüğü
const DEPTH = 0.13;         // obje kalınlığı (boyuna göre)

/** Kanaldaki opak pikseller → ikili ızgara (+ küçük boşlukları kapatan genişletme). */
function alphaGrid(canvas) {
  const c = document.createElement('canvas');
  c.width = c.height = GRID;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(canvas, 0, 0, GRID, GRID);
  const d = g.getImageData(0, 0, GRID, GRID).data;
  const N = GRID + 2;
  let m = new Uint8Array(N * N);
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) m[(y + 1) * N + x + 1] = d[(y * GRID + x) * 4 + 3] > 110 ? 1 : 0;
  // Ayrık parçaları birleştirmek için 1 piksel genişlet.
  const out = new Uint8Array(N * N);
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
    let v = 0;
    for (let dy = -1; dy <= 1 && !v; dy++) for (let dx = -1; dx <= 1; dx++) if (m[(y + dy) * N + x + dx]) { v = 1; break; }
    out[y * N + x] = v;
  }
  return { m: out, N };
}

/** Moore komşuluk izleme ile en büyük parçanın dış sınırı. */
function traceOuter({ m, N }) {
  // En büyük bağlı bileşeni bul.
  const lab = new Int32Array(N * N);
  let best = 0, bestN = 0, cur = 0;
  for (let i = 0; i < N * N; i++) {
    if (!m[i] || lab[i]) continue;
    cur++;
    let n = 0;
    const st = [i]; lab[i] = cur;
    while (st.length) {
      const k = st.pop(); n++;
      for (const o of [1, -1, N, -N]) { const j = k + o; if (m[j] && !lab[j]) { lab[j] = cur; st.push(j); } }
    }
    if (n > bestN) { bestN = n; best = cur; }
  }
  if (!best) return null;
  const on = (x, y) => x >= 0 && y >= 0 && x < N && y < N && lab[y * N + x] === best;
  let sx = -1, sy = -1;
  outer: for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (on(x, y)) { sx = x; sy = y; break outer; }
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const pts = [[sx, sy]];
  let cx = sx, cy = sy, back = 4;   // batıdan girildi
  for (let guard = 0; guard < N * N * 4; guard++) {
    let found = false;
    for (let k = 1; k <= 8; k++) {
      const d = (back + k) % 8;
      const nx = cx + dirs[d][0], ny = cy + dirs[d][1];
      if (on(nx, ny)) { cx = nx; cy = ny; back = (d + 4) % 8; found = true; break; }
    }
    if (!found || (cx === sx && cy === sy)) break;
    pts.push([cx, cy]);
  }
  return pts;
}

function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  let idx = 0, dmax = 0;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const L = Math.hypot(bx - ax, by - ay) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L;
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax <= eps) return [pts[0], pts[pts.length - 1]];
  return rdp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(pts.slice(idx), eps));
}

function shapeFor(canvas) {
  const pts = traceOuter(alphaGrid(canvas));
  if (!pts || pts.length < 8) {
    const s = new THREE.Shape();
    s.moveTo(-0.5, -0.5); s.lineTo(0.5, -0.5); s.lineTo(0.5, 0.5); s.lineTo(-0.5, 0.5);
    return s;
  }
  // Kapalı eğri: başı ve ortası sabitlenerek iki parça halinde sadeleştir.
  const mid = Math.floor(pts.length / 2);
  const simple = rdp(pts.slice(0, mid + 1), 0.75).slice(0, -1).concat(rdp(pts.slice(mid).concat([pts[0]]), 0.75).slice(0, -1));
  const N = GRID + 2;
  let v = simple.map(([x, y]) => new THREE.Vector2((x - 1) / GRID - 0.5, 0.5 - (y - 1) / GRID));
  if (THREE.ShapeUtils.isClockWise(v)) v = v.reverse();
  return new THREE.Shape(v);
}

// Kapaklarda doku koordinatı = şekil koordinatı; yanlarda içeri doğru örnekle (gövde rengi).
const UV = {
  generateTopUV(geo, verts, a, b, c) {
    return [a, b, c].map((i) => new THREE.Vector2(verts[i * 3] + 0.5, verts[i * 3 + 1] + 0.5));
  },
  generateSideWallUV(geo, verts, a, b, c, d) {
    return [a, b, c, d].map((i) => new THREE.Vector2(verts[i * 3] * 0.8 + 0.5, verts[i * 3 + 1] * 0.8 + 0.5));
  },
};

/** Kanal kodlu doku (R gövde, B ikincil, G sabit gri) için ışıklı malzeme. */
function channelMaterial(texture, side) {
  const mat = new THREE.MeshStandardMaterial({
    map: texture, alphaTest: side ? 0 : 0.5, roughness: 0.42, metalness: 0.08, envMapIntensity: 0.9,
  });
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <map_fragment>', side
        ? 'vec4 _t = texture2D( map, vMapUv ); vec3 _l = pow( _t.rgb, vec3( 2.2 ) );'
        : 'vec4 _t = texture2D( map, vMapUv ); vec3 _l = pow( _t.rgb, vec3( 2.2 ) ); diffuseColor.a *= _t.a;')
      .replace('#include <color_fragment>', side
        ? 'diffuseColor.rgb = vColor * 0.62;'
        : 'diffuseColor.rgb = vColor * ( _l.r + 0.45 * _l.b ) + vec3( _l.g );');
  };
  mat.customProgramCacheKey = () => 'ch-' + (side ? 's' : 'f');
  return mat;
}

function naturalMaterial(texture, side) {
  const mat = new THREE.MeshStandardMaterial({
    map: side ? null : texture, color: side ? 0x9a9a9a : 0xffffff, alphaTest: side ? 0 : 0.5,
    roughness: 0.38, metalness: 0.1, envMapIntensity: 0.9,
  });
  return mat;
}

export class ObjectLibrary {
  constructor() { this.cache = new Map(); }

  /** @returns {{ geometry, materials: [cap, side] }} */
  get(sprite) {
    let e = this.cache.get(sprite.key);
    if (!e) {
      const tex = new THREE.CanvasTexture(sprite.canvas);
      tex.colorSpace = sprite.natural ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      tex.anisotropy = 4;
      const geometry = new THREE.ExtrudeGeometry(shapeFor(sprite.canvas), {
        depth: DEPTH, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.018, bevelSegments: 2,
        curveSegments: 1, UVGenerator: UV,
      });
      geometry.translate(0, 0, -DEPTH / 2);
      geometry.computeVertexNormals();
      const materials = sprite.natural
        ? [naturalMaterial(tex, false), naturalMaterial(tex, true)]
        : [channelMaterial(tex, false), channelMaterial(tex, true)];
      e = { geometry, materials };
      this.cache.set(sprite.key, e);
    }
    return e;
  }
}

/** Sahne ışıkları + yansıma ortamı. */
export function setupLighting(renderer, scene, RoomEnvironment) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x404858, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-0.6, 0.9, 1.2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fc4ff, 0.8);
  rim.position.set(0.8, 0.3, -1);
  scene.add(rim);
}
