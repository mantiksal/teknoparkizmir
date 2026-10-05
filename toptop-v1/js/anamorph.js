// Anamorfik sahne.
//
// 1) Portre, renk farkına göre bölünen bir quadtree ile hücrelere ayrılır:
//    düz alanlara (yanak, ceket) büyük, detaylı alanlara (göz, dudak) küçük obje.
// 2) Her hücreye, bulunduğu yüz bölgesine ve kişinin arketipine uygun bir obje seçilir.
// 3) Obje, sihirli noktadan (E) perdedeki hücre noktasına (P) giden ışın üzerine
//    rastgele bir derinlikte yerleştirilir:  Q = E + s·(P − E), boyutu s ile ölçeklenir.
//    E'den bakınca her obje P'nin tam üzerine düşer; başka her yerden bakınca dağılır.
import * as THREE from '../vendor/three/three.module.js';

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const lin = (v) => Math.pow(v, 2.2);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const REGION = { BG: 0, EYE: 1, BROW: 2, SKIN: 3, HAIR: 4, BODY: 5, LIPS: 6 };
const NREG = 7;

// ------------------------------------------------------------------ hedef analizi

function hull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

class Integral {
  constructor(w, h) { this.w = w; this.h = h; this.a = new Float64Array((w + 1) * (h + 1)); }
  static from(w, h, fn) {
    const I = new Integral(w, h), a = I.a, W = w + 1;
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) { row += fn(y * w + x); a[(y + 1) * W + x + 1] = a[y * W + x + 1] + row; }
    }
    return I;
  }
  sum(x, y, s) {
    const W = this.w + 1, x1 = Math.min(this.w, x + s), y1 = Math.min(this.h, y + s);
    return this.a[y1 * W + x1] - this.a[y * W + x1] - this.a[y1 * W + x] + this.a[y * W + x];
  }
}

/**
 * Portreyi analiz eder: renk (kontrastı açılmış), maske, yüz bölgesi etiketleri,
 * kenar yönü. Sonra quadtree ile yaklaşık `targetCount` hücreye böler.
 */
export function analyzeTarget(target, targetCount) {
  const N = 200;
  const w = N, h = Math.round(N / target.aspect);
  const read = (src) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingQuality = 'high';
    g.drawImage(src, 0, 0, w, h);
    return g.getImageData(0, 0, w, h).data;
  };
  const cd = read(target.color), md = read(target.mask);
  const n = w * h;
  const R = new Float32Array(n), G = new Float32Array(n), B = new Float32Array(n), M = new Float32Array(n), Lum = new Float32Array(n);
  const lums = [];
  for (let i = 0; i < n; i++) {
    R[i] = cd[i * 4] / 255; G[i] = cd[i * 4 + 1] / 255; B[i] = cd[i * 4 + 2] / 255; M[i] = md[i * 4] / 255;
    Lum[i] = 0.2126 * R[i] + 0.7152 * G[i] + 0.0722 * B[i];
    if (M[i] > 0.5) lums.push(Lum[i]);
  }
  // Kişi bölgesinde %2–%98 kontrast germe + hafif doygunluk.
  lums.sort((a, b) => a - b);
  const lo = lums[Math.floor(lums.length * 0.02)] ?? 0, hi = lums[Math.floor(lums.length * 0.98)] ?? 1;
  const span = Math.max(0.05, hi - lo);
  for (let i = 0; i < n; i++) {
    const tl = 0.13 + 0.87 * Math.pow(clamp((Lum[i] - lo) / span, 0, 1), 0.95);
    const k = Lum[i] > 1e-3 ? tl / Lum[i] : 0;
    let r = R[i] * k, g = G[i] * k, b = B[i] * k;
    const avg = (r + g + b) / 3;
    R[i] = clamp(avg + (r - avg) * 1.15, 0, 1); G[i] = clamp(avg + (g - avg) * 1.15, 0, 1); B[i] = clamp(avg + (b - avg) * 1.15, 0, 1);
    Lum[i] = tl;
  }

  // Bölge etiketleri.
  const L = new Uint8Array(n);
  const rg = target.regions;
  for (let i = 0; i < n; i++) {
    if (M[i] <= 0.5) continue;
    L[i] = rg ? ((Math.floor(i / w) / h) < rg.chinY ? REGION.HAIR : REGION.BODY) : REGION.SKIN;
  }
  if (rg) {
    const paint = (polys, code, grow) => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.fillStyle = g.strokeStyle = '#fff'; g.lineWidth = grow; g.lineJoin = 'round';
      for (const pts of polys) {
        const hp = hull(pts);
        g.beginPath(); hp.forEach(([x, y], k) => (k ? g.lineTo(x * w, y * h) : g.moveTo(x * w, y * h))); g.closePath();
        g.fill(); if (grow) g.stroke();
      }
      const d = g.getImageData(0, 0, w, h).data;
      for (let i = 0; i < n; i++) if (d[i * 4 + 3] > 128 && M[i] > 0.3) L[i] = code;
    };
    paint([rg.faceOval], REGION.SKIN, 0);
    paint(rg.brows, REGION.BROW, w * 0.02);
    paint(rg.eyes, REGION.EYE, w * 0.03);
    paint([rg.lips], REGION.LIPS, w * 0.015);
  }

  // Kenar yönü için yapı tensörü.
  const Jxx = new Float32Array(n), Jyy = new Float32Array(n), Jxy = new Float32Array(n);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    const gx = Lum[i + 1] - Lum[i - 1], gy = Lum[i + w] - Lum[i - w];
    Jxx[i] = gx * gx; Jyy[i] = gy * gy; Jxy[i] = gx * gy;
  }

  const I = {
    r: Integral.from(w, h, (i) => R[i]), g: Integral.from(w, h, (i) => G[i]), b: Integral.from(w, h, (i) => B[i]),
    sq: Integral.from(w, h, (i) => R[i] * R[i] + G[i] * G[i] + B[i] * B[i]),
    m: Integral.from(w, h, (i) => M[i]),
    jxx: Integral.from(w, h, (i) => Jxx[i]), jyy: Integral.from(w, h, (i) => Jyy[i]), jxy: Integral.from(w, h, (i) => Jxy[i]),
    lab: Array.from({ length: NREG }, (_, k) => Integral.from(w, h, (i) => (L[i] === k ? 1 : 0))),
  };

  const S0 = 40, SMIN = 3;
  const MAXS = { [REGION.EYE]: 5, [REGION.BROW]: 6, [REGION.LIPS]: 6, [REGION.SKIN]: 14, [REGION.HAIR]: 14, [REGION.BODY]: 20, [REGION.BG]: 20 };

  const quad = (thr, collect) => {
    const leaves = [];
    const visit = (x, y, s) => {
      if (x >= w || y >= h) return;
      const cnt = Math.min(s, w - x) * Math.min(s, h - y);
      const m = I.m.sum(x, y, s) / cnt;
      if (m < 0.12) return;
      let maj = 0, majN = -1;
      for (let k = 0; k < NREG; k++) { const c = I.lab[k].sum(x, y, s); if (c > majN) { majN = c; maj = k; } }
      const r = I.r.sum(x, y, s) / cnt, g = I.g.sum(x, y, s) / cnt, b = I.b.sum(x, y, s) / cnt;
      const v = I.sq.sum(x, y, s) / cnt - (r * r + g * g + b * b);
      const sd = Math.sqrt(Math.max(0, v));
      const mixed = (m > 0.12 && m < 0.85) || majN / cnt < 0.8;
      const split = s > SMIN && (sd > thr || mixed || s > MAXS[maj]);
      if (split) {
        const hs = Math.ceil(s / 2);
        visit(x, y, hs); visit(x + hs, y, hs); visit(x, y + hs, hs); visit(x + hs, y + hs, hs);
        return;
      }
      if (m < 0.5) return;
      if (!collect) { leaves.push(null); return; }
      const jxx = I.jxx.sum(x, y, s), jyy = I.jyy.sum(x, y, s), jxy = I.jxy.sum(x, y, s);
      const coh = Math.sqrt((jxx - jyy) ** 2 + 4 * jxy * jxy) / (jxx + jyy + 1e-6);
      leaves.push({
        cx: x + Math.min(s, w - x) / 2, cy: y + Math.min(s, h - y) / 2, s,
        r, g, b, label: maj,
        angle: 0.5 * Math.atan2(2 * jxy, jxx - jyy) + Math.PI / 2, coherence: coh,
      });
    };
    for (let y = 0; y < h; y += S0) for (let x = 0; x < w; x += S0) visit(x, y, S0);
    return leaves;
  };

  // Eşik değerini, hücre sayısı hedefe yaklaşacak şekilde ikili arama ile bul.
  let a = 0.005, bnd = 0.6;
  for (let it = 0; it < 14; it++) {
    const mid = Math.sqrt(a * bnd);
    if (quad(mid, false).length > targetCount) a = mid; else bnd = mid;
  }
  const leaves = quad(bnd, true);

  // Arka plan noktaları (dekor objeleri için).
  const bg = [];
  for (let y = 2; y < h; y += 6) for (let x = 2; x < w; x += 6) if (M[y * w + x] < 0.2) bg.push([x, y]);

  return { w, h, aspect: target.aspect, leaves, bg };
}

// ------------------------------------------------------------------ obje seçimi

const SHAPE_PREF = {
  [REGION.EYE]: { round: 6, other: 0.15, block: 0.15, long: 0.05 },
  [REGION.BROW]: { long: 8, round: 0.05, other: 0.1, block: 0.1 },
  [REGION.LIPS]: { block: 3, long: 2, round: 0.3, other: 0.5 },
  [REGION.SKIN]: { round: 1.2, block: 1, other: 1.3, long: 0.6 },
  [REGION.HAIR]: { long: 2.5, block: 1, other: 1, round: 0.7 },
  [REGION.BODY]: { block: 1.5, other: 1.2, round: 1, long: 0.8 },
  [REGION.BG]: { block: 1, other: 1, round: 1, long: 1 },
};
const ARCH_BOOST = {
  [REGION.EYE]: 1.5, [REGION.BROW]: 1, [REGION.LIPS]: 1, [REGION.SKIN]: 2.5,
  [REGION.HAIR]: 2, [REGION.BODY]: 3, [REGION.BG]: 3,
};

function spriteWeight(sp, region, archetype) {
  if (sp.hero) return 0;
  let w = sp.weight * (SHAPE_PREF[region][sp.shape] ?? 1);
  if (sp.set === 'acad') return w;
  if (!archetype) return w * 0.35;
  return sp.set === archetype ? w * ARCH_BOOST[region] : 0;
}

/** Objenin ulaşabileceği parlaklık aralığına göre hedef rengi ne kadar iyi verebildiği. */
function fitError(sp, tl) {
  if (sp.natural) {
    const m = 0.2126 * sp.mean[0] + 0.7152 * sp.mean[1] + 0.0722 * sp.mean[2];
    return Math.abs(m - tl) * 0.5;
  }
  return Math.max(0, sp.fixMean - tl) + Math.max(0, tl - (sp.fixMean + sp.tintMean));
}

/** Hedef sRGB rengini verecek doğrusal instance rengi. */
function instanceColor(sp, r, g, b, tint = 1) {
  const t = [lin(r), lin(g), lin(b)];
  if (sp.natural) {
    const k = sp.tint ?? tint;
    return t.map((v, i) => clamp(1 - k + k * v / Math.max(0.03, sp.mean[i]), 0, 2));
  }
  return t.map((v) => clamp((v - sp.fixMean) / Math.max(0.05, sp.tintMean), 0, 1.4));
}

// ------------------------------------------------------------------ malzeme

function makeMaterial(texture, natural, shade) {
  const mat = new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uShade = { value: shade };
    sh.fragmentShader = 'uniform float uShade;\n' + sh.fragmentShader;
    if (!natural) {
      // Kanal kodlu sprite: R gövde × renk, B ikincil × koyu renk, G sabit gri.
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <map_fragment>', 'vec4 _t = texture2D( map, vMapUv ); vec3 _l = pow( _t.rgb, vec3( 2.2 ) ); diffuseColor.a *= _t.a;')
        .replace('#include <color_fragment>', 'diffuseColor.rgb = ( vColor * ( _l.r + 0.45 * _l.b ) + vec3( _l.g ) ) * uShade;');
    } else {
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= uShade;');
    }
  };
  mat.customProgramCacheKey = () => `ana-${natural ? 'n' : 'c'}-${shade}`;
  return mat;
}

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const _v = new THREE.Vector3();

export class AnamorphScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.meshes = [];       // { front, back, items }
    this.textures = new Map();
    this.count = 0;
    this.wires = null;
    this.showBacks = true;
    this.showWires = true;
  }

  textureFor(sprite) {
    let t = this.textures.get(sprite.key);
    if (!t) {
      t = new THREE.CanvasTexture(sprite.canvas);
      t.colorSpace = sprite.natural ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = 4;
      this.textures.set(sprite.key, t);
    }
    return t;
  }

  clear() {
    for (const m of this.meshes) {
      for (const mesh of [m.front, m.back]) { this.group.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
    }
    this.meshes = [];
    if (this.wires) { this.group.remove(this.wires); this.wires.geometry.dispose(); this.wires.material.dispose(); this.wires = null; }
  }

  /**
   * @param an       analyzeTarget çıktısı
   * @param sprites  obje listesi
   * @param opts     { screenW, screenH, sMin, sMax, decoyRatio, heroRatio, seed, archetype, archColor, portraitH, portraitY }
   */
  build(an, sprites, opts) {
    this.clear();
    const rnd = mulberry32(opts.seed ?? 1);
    const heroes = sprites.filter((s) => s.hero);
    const sRand = () => opts.sMin + (opts.sMax - opts.sMin) * Math.pow(rnd(), 0.85);

    const poolCache = new Map();
    const pool = (region) => {
      if (!poolCache.has(region)) {
        const list = sprites.map((s) => [s, spriteWeight(s, region, opts.archetype)]).filter(([, w]) => w > 0);
        poolCache.set(region, { list, total: list.reduce((a, [, w]) => a + w, 0) });
      }
      return poolCache.get(region);
    };
    const sample = (region) => {
      const p = pool(region);
      let r = rnd() * p.total;
      for (const [s, w] of p.list) { r -= w; if (r <= 0) return s; }
      return p.list[p.list.length - 1][0];
    };
    // Ağırlığa göre birkaç aday çek, rengi en iyi verebileni seç.
    const choose = (region, tl) => {
      let best = null, bestE = Infinity;
      for (let k = 0; k < 4; k++) {
        const s = sample(region);
        const e = fitError(s, tl) + rnd() * 0.02;
        if (e < bestE) { bestE = e; best = s; }
      }
      return best;
    };

    // Portre alanı (perde koordinatı, cm).
    let ph = opts.portraitH, pw = ph * an.aspect;
    if (pw > opts.screenW * 0.92) { pw = opts.screenW * 0.92; ph = pw / an.aspect; }
    const px2w = pw / an.w;
    const toP = (x, y) => [-pw / 2 + x * px2w, opts.portraitY + ph / 2 - y * px2w];

    const items = [];
    const add = (sprite, px, py, s, size, roll, rgb) => {
      items.push({ sprite, px, py, s, size, roll, rgb });
    };

    for (const lf of an.leaves) {
      const tl = 0.2126 * lin(lf.r) + 0.7152 * lin(lf.g) + 0.0722 * lin(lf.b);
      const sp = choose(lf.label, tl);
      const jit = lf.s * 0.18;
      const [px, py] = toP(lf.cx + (rnd() - 0.5) * jit, lf.cy + (rnd() - 0.5) * jit);
      const cov = clamp(sp.coverage / 0.5, 0.6, 1.3);
      const size = lf.s * px2w * 1.42 / Math.sqrt(cov);
      let roll;
      if (sp.shape === 'long' && (lf.coherence > 0.3 || lf.label === REGION.BROW)) roll = -lf.angle + (rnd() - 0.5) * 0.15;
      else roll = (rnd() - 0.5) * (rnd() < 0.15 ? 1.6 : 0.6);
      add(sp, px, py, sRand(), size, roll, instanceColor(sp, lf.r, lf.g, lf.b));
    }

    // Kahraman objeler (logolar, rektör…): büyük, seyrek, bulutun arka tarafında.
    const body = an.leaves.filter((l) => l.label === REGION.BODY || l.label === REGION.HAIR);
    const src = body.length ? body : an.leaves;
    if (heroes.length && src.length) {
      const n = Math.max(heroes.length * 2, Math.round(an.leaves.length * opts.heroRatio));
      for (let k = 0; k < n; k++) {
        const lf = src[Math.floor(rnd() * src.length)];
        const sp = heroes[k % heroes.length];
        const [px, py] = toP(lf.cx, lf.cy);
        add(sp, px, py, opts.sMax * (0.88 + rnd() * 0.12), pw * (0.1 + rnd() * 0.06), (rnd() - 0.5) * 0.4,
          instanceColor(sp, lf.r, lf.g, lf.b, 0.5));
      }
    }

    // Dekor: portrenin dışına düşen loş objeler (arketip renginde).
    const ac = new THREE.Color(opts.archColor || '#6a7a9a');
    const meanLeaf = an.leaves.reduce((a, l) => a + l.s, 0) / Math.max(1, an.leaves.length);
    const nDecoy = Math.round(an.leaves.length * opts.decoyRatio);
    const decoy = (px, py) => {
      const v = 0.16 + rnd() * 0.2;
      const r = ac.r * v, g = ac.g * v, b = ac.b * v;
      const sp = choose(REGION.BG, 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b));
      add(sp, px, py, sRand(), meanLeaf * px2w * (1.6 + rnd() * 1.6), (rnd() - 0.5) * 1.2, instanceColor(sp, r, g, b));
    };
    for (let k = 0; k < nDecoy && an.bg.length; k++) {
      const [x, y] = an.bg[Math.floor(rnd() * an.bg.length)];
      decoy(...toP(x + (rnd() - 0.5) * 6, y + (rnd() - 0.5) * 6));
    }
    for (let k = 0; k < nDecoy * 0.7; k++) {
      const px = (rnd() - 0.5) * opts.screenW, py = (rnd() - 0.5) * opts.screenH;
      if (Math.abs(px) < pw / 2 && Math.abs(py - opts.portraitY) < ph / 2) continue;
      decoy(px, py);
    }

    // Obje tipine göre InstancedMesh: ön yüz + koyu arka plaka (kalınlık hissi).
    const byType = new Map();
    for (const it of items) {
      if (!byType.has(it.sprite)) byType.set(it.sprite, []);
      byType.get(it.sprite).push(it);
    }
    for (const [sprite, list] of byType) {
      const tex = this.textureFor(sprite);
      const front = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), makeMaterial(tex, sprite.natural, 1), list.length);
      const back = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), makeMaterial(tex, sprite.natural, 0.22), list.length);
      for (const m of [front, back]) {
        m.frustumCulled = false;
        list.forEach((it, k) => { _color.setRGB(it.rgb[0], it.rgb[1], it.rgb[2]); m.setColorAt(k, _color); });
        this.group.add(m);
      }
      back.visible = this.showBacks;
      this.meshes.push({ front, back, items: list });
    }

    // Askı telleri.
    const nW = items.length;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nW * 6), 3));
    this.wires = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x9a9aa8, transparent: true, opacity: 0.09 }));
    this.wires.frustumCulled = false;
    this.wires.visible = this.showWires;
    this.group.add(this.wires);
    this.ceiling = opts.screenH * 1.4;

    this.count = items.length;
    this.lastE = null;
  }

  setOptions({ backs, wires }) {
    this.showBacks = backs; this.showWires = wires;
    for (const m of this.meshes) m.back.visible = backs;
    if (this.wires) this.wires.visible = wires;
  }

  /** Objeleri E noktasına göre yerleştir (E değişince çağrılır). */
  layout(E) {
    if (this.lastE && this.lastE.distanceToSquared(E) < 1e-4) return;
    this.lastE = E.clone();
    const wp = this.wires?.geometry.attributes.position;
    let wi = 0, wn = 0;
    for (const { front, back, items } of this.meshes) {
      for (let k = 0; k < items.length; k++) {
        const it = items[k];
        const sz = it.size * it.s;
        _dummy.position.set(E.x + it.s * (it.px - E.x), E.y + it.s * (it.py - E.y), E.z - it.s * E.z);
        _dummy.lookAt(E);
        _dummy.rotateZ(it.roll);
        _dummy.scale.set(sz, sz, 1);
        _dummy.updateMatrix();
        front.setMatrixAt(k, _dummy.matrix);
        // Askı teli: her 4 objeden yalnızca birinde (hepsinde olunca perde gibi görünüyor).
        if (wp && (wn++ & 3) === 0) {
          const x = _dummy.position.x, y = _dummy.position.y + sz * 0.3, z = _dummy.position.z;
          wp.setXYZ(wi++, x, y, z); wp.setXYZ(wi++, x, this.ceiling, z);
        }
        // Arka plaka: göz doğrultusunda biraz geride → sihirli noktadan görünmez,
        // yandan bakınca objenin kalınlığı gibi görünür.
        _v.copy(_dummy.position).sub(E).normalize().multiplyScalar(sz * 0.08);
        _dummy.position.add(_v);
        _dummy.updateMatrix();
        back.setMatrixAt(k, _dummy.matrix);
      }
      front.instanceMatrix.needsUpdate = true;
      back.instanceMatrix.needsUpdate = true;
    }
    if (wp) { this.wires.geometry.setDrawRange(0, wi); wp.needsUpdate = true; }
  }
}

/** Yazıdan hedef üretir (fotoğraf yokken varsayılan sahne). */
export function textTarget(lines, aspect = 1.5) {
  const h = 600, w = Math.round(h * aspect);
  const color = document.createElement('canvas');
  color.width = w; color.height = h;
  const g = color.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#ffb547'); grad.addColorStop(0.5, '#ff5e62'); grad.addColorStop(1, '#7b6cff');
  g.fillStyle = grad; g.textAlign = 'center'; g.textBaseline = 'middle';
  let y = (h - lines.reduce((a, l) => a + l.size * 1.1, 0)) / 2;
  for (const l of lines) {
    g.font = `900 ${l.size}px system-ui, -apple-system, sans-serif`;
    y += l.size * 0.55; g.fillText(l.text, w / 2, y); y += l.size * 0.55;
  }
  const mask = document.createElement('canvas');
  mask.width = w; mask.height = h;
  const mg = mask.getContext('2d');
  mg.filter = 'grayscale(1) brightness(8)';
  mg.drawImage(color, 0, 0);
  return { color, mask, aspect, regions: null };
}

/**
 * Asimetrik (off-axis) perspektif: perde z=0 düzleminde, merkezi orijinde,
 * göz (eye) z>0 tarafında. Perde gerçek bir pencere gibi davranır.
 */
export function applyOffAxis(camera, eye, screenW, screenH, near = 1, far = 20000) {
  camera.position.copy(eye);
  camera.quaternion.identity();
  camera.updateMatrixWorld(true);
  const ez = Math.max(eye.z, 5);
  const k = near / ez;
  const l = (-screenW / 2 - eye.x) * k, r = (screenW / 2 - eye.x) * k;
  const b = (-screenH / 2 - eye.y) * k, t = (screenH / 2 - eye.y) * k;
  camera.projectionMatrix.makePerspective(l, r, t, b, near, far);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}
