// Canlı obje aynası: kamera görüntüsü, gerçek zamanlı olarak 3B objelerden
// oluşan bir mozaiğe dönüşür. Bekleme ekranında öğrencileri standa çeker.
import * as THREE from '../vendor/three/three.module.js';

const lin = (v) => Math.pow(v, 2.2);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const _d = new THREE.Object3D();
const _c = new THREE.Color();

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class MirrorWall {
  constructor(scene, library) {
    this.lib = library;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.meshes = [];
    this.sample = document.createElement('canvas');
    this.lo = 0.1; this.hi = 0.9;
    this.burst = 0;
    this.zoom = 0.72;
  }

  /**
   * @param sprites obje listesi
   * @param rect { x, y, w, h } dünya koordinatında (z=0 düzlemi)
   * @param cols  sütun sayısı
   */
  build(sprites, rect, cols) {
    for (const m of this.meshes) { this.group.remove(m.mesh); m.mesh.dispose(); }
    this.meshes = [];
    const rnd = mulberry32(42);
    const cell = rect.w / cols;
    const rows = Math.max(1, Math.round(rect.h / cell));
    Object.assign(this, { cols, rows, rect, cell });
    this.sample.width = cols; this.sample.height = rows;
    const pool = sprites.filter((s) => !s.hero && !s.natural);
    const byType = new Map();
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const sp = pool[Math.floor(rnd() * pool.length)];
      if (!byType.has(sp)) byType.set(sp, []);
      byType.get(sp).push({
        i, j, sp,
        x: rect.x - rect.w / 2 + (i + 0.5) * cell + (rnd() - 0.5) * cell * 0.2,
        y: rect.y + rect.h / 2 - (j + 0.5) * cell + (rnd() - 0.5) * cell * 0.2,
        z: (rnd() - 0.5) * cell * 1.5,
        roll: (rnd() - 0.5) * 0.8, r1: rnd(), r2: rnd(), r3: rnd(),
        size: cell * (1.25 + rnd() * 0.25) / Math.sqrt(clamp(sp.coverage / 0.5, 0.6, 1.3)),
      });
    }
    for (const [sp, items] of byType) {
      const { geometry, materials } = this.lib.get(sp);
      const mesh = new THREE.InstancedMesh(geometry, materials, items.length);
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      items.forEach((_, k) => mesh.setColorAt(k, _c.setRGB(0.2, 0.2, 0.2)));
      this.group.add(mesh);
      this.meshes.push({ mesh, items, sp });
    }
  }

  set visible(v) { this.group.visible = v; }
  get visible() { return this.group.visible; }

  /** Kameradan renkleri al, objeleri hafifçe salındır. burst: 0–1 dağılma (geçiş). */
  update(video, t) {
    if (!this.meshes.length) return;
    let data = null;
    if (video && video.readyState >= 2 && video.videoWidth) {
      // Aynanın en-boy oranına göre ortadan kırp, ayna gibi çevir.
      const va = video.videoWidth / video.videoHeight, ra = this.cols / this.rows;
      let sw = video.videoWidth, sh = video.videoHeight;
      if (va > ra) sw = sh * ra; else sh = sw / ra;
      sw *= this.zoom; sh *= this.zoom;   // kişi kadreyi doldursun
      const g = this.sample.getContext('2d', { willReadFrequently: true });
      g.save(); g.translate(this.cols, 0); g.scale(-1, 1);
      g.drawImage(video, (video.videoWidth - sw) / 2, (video.videoHeight - sh) * 0.35, sw, sh, 0, 0, this.cols, this.rows);
      g.restore();
      data = g.getImageData(0, 0, this.cols, this.rows).data;
      // Otomatik seviye: gün ışığında da kontrastlı kalsın.
      let lo = 1, hi = 0;
      for (let k = 0; k < data.length; k += 16) { const l = (data[k] + data[k + 1] + data[k + 2]) / 765; lo = Math.min(lo, l); hi = Math.max(hi, l); }
      this.lo += (lo - this.lo) * 0.05; this.hi += (hi - this.hi) * 0.05;
    }
    const span = Math.max(0.15, this.hi - this.lo);
    const b = this.burst, be = b * b;
    for (const { mesh, items, sp } of this.meshes) {
      for (let k = 0; k < items.length; k++) {
        const it = items[k];
        if (data) {
          const p = (it.j * this.cols + it.i) * 4;
          let r = data[p] / 255, g = data[p + 1] / 255, bl = data[p + 2] / 255;
          r = clamp((r - this.lo) / span, 0, 1) * 0.92 + 0.06; g = clamp((g - this.lo) / span, 0, 1) * 0.92 + 0.06; bl = clamp((bl - this.lo) / span, 0, 1) * 0.92 + 0.06;
          const tc = [lin(r), lin(g), lin(bl)].map((v) => clamp((v - sp.fixMean) / Math.max(0.05, sp.tintMean), 0, 1.4));
          mesh.setColorAt(k, _c.setRGB(tc[0], tc[1], tc[2]));
        }
        _d.position.set(
          it.x + (it.x - this.rect.x) * be * 3 + (it.r1 - 0.5) * be * 120,
          it.y + (it.y - this.rect.y) * be * 3 + (it.r2 - 0.5) * be * 120,
          it.z + Math.sin(t * 1.3 + it.r1 * 9) * this.cell * 0.3 + be * (it.r3 * 200),
        );
        _d.rotation.set(Math.sin(t * 0.9 + it.r2 * 7) * 0.35 + be * it.r1 * 8, Math.cos(t * 0.8 + it.r3 * 7) * 0.45 + be * it.r2 * 8, it.roll);
        const s = it.size * (1 - be * 0.5);
        _d.scale.set(s, s, s);
        _d.updateMatrix();
        mesh.setMatrixAt(k, _d.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (data) mesh.instanceColor.needsUpdate = true;
    }
  }
}
