// Gösteri boyunca sanal kameranın yolu. Kamera obje bulutunun etrafında ve
// içinden geçer; ALIGN anında tam sihirli noktaya (E) oturur ve dağınık objeler
// portreye dönüşür. Her arketipin kendi yolu var.
import * as THREE from '../vendor/three/three.module.js';

// [zaman oranı (0–1, ALIGN'a göre), konum (C'ye göre, H birimi), hedef ('C' ya da C'ye göre nokta)]
const PATHS = {
  default: [
    [0.00, [-2.6, 1.2, 2.2]], [0.19, [1.9, 0.4, 2.3]], [0.38, [2.3, -0.6, -1.2]],
    [0.57, [-0.3, 0.3, -3.6]], [0.76, [-2.4, -0.2, -0.2]], [0.89, [-1.4, 0.35, 3.4]],
  ],
  firestarter: [
    [0.00, [0.2, 0.1, 1.2]], [0.15, [2.6, 0.8, 2.6]], [0.35, [2.4, -0.8, -1.4]],
    [0.55, [-0.4, 0.6, -3.4]], [0.75, [-2.6, -0.4, 0.2]], [0.89, [-1.2, 0.3, 3.4]],
  ],
  mountaineer: [
    [0.00, [-2.4, -2.4, 1.8]], [0.19, [1.8, -1.6, 2.2]], [0.38, [2.2, -0.4, -1.3]],
    [0.57, [-0.2, 0.9, -3.4]], [0.76, [-2.2, 1.7, 0.2]], [0.89, [-1.2, 1.2, 3.2]],
  ],
  trailblazer: [
    [0.00, [0, 0.1, 5.5]], [0.22, [0, 0.05, 2.0], [0, 0, -9]], [0.40, [0.05, 0.1, -0.6], [0, 0, -9]],
    [0.55, [0.2, 0.3, -3.0], [0, 0, -9]], [0.72, [2.4, 0.1, -0.6]], [0.89, [-1.2, 0.3, 3.2]],
  ],
  cartographer: [
    [0.00, [0, 3.4, 0.6], [0, -0.75, 0]], [0.20, [0.2, 2.6, 1.8], [0, -0.6, 0]], [0.40, [1.9, 1.2, 2.2]],
    [0.58, [2.2, 0.1, -1.0]], [0.76, [-1.9, 0.3, 0.4]], [0.89, [-1.2, 0.3, 3.2]],
  ],
  outsider: [
    [0.00, [-1.7, 0.25, 1.9]], [0.19, [1.6, 0.2, 1.9]], [0.38, [2.0, 0.1, -0.6]],
    [0.57, [0, 0.25, -2.3]], [0.76, [-2.0, 0.1, -0.4]], [0.89, [-1.2, 0.2, 2.8]],
  ],
};

export class CameraPath {
  /**
   * @param kind arketip anahtarı
   * @param E    sihirli nokta (kamera burada biter)
   * @param C    obje bulutunun merkezi
   * @param H    ölçek (perde yüksekliği)
   * @param alignAt  kameranın E'ye oturduğu saniye
   * @param finalFov E'den perdeyi tam kaplayan dikey görüş açısı (derece)
   */
  constructor(kind, E, C, H, alignAt, finalFov) {
    const keys = PATHS[kind] || PATHS.default;
    this.times = keys.map(([f]) => f * alignAt).concat([alignAt]);
    const k = H * 0.5;
    const pos = keys.map(([, p]) => new THREE.Vector3(...p).multiplyScalar(k).add(C)).concat([E.clone()]);
    const far = new THREE.Vector3(0, 0, -10000).add(E);
    const tgt = keys.map(([, , t]) => (t ? new THREE.Vector3(...t).multiplyScalar(k).add(C) : C.clone())).concat([far]);
    this.posCurve = new THREE.CatmullRomCurve3(pos, false, 'centripetal');
    this.tgtCurve = new THREE.CatmullRomCurve3(tgt, false, 'centripetal');
    Object.assign(this, { E, alignAt, finalFov, n: pos.length });
  }

  /** @returns {{ pos, target, fov, aligned }} */
  sample(t) {
    if (t >= this.alignAt) return { pos: this.E.clone(), target: null, fov: this.finalFov, aligned: true };
    const ts = this.times;
    let i = 0;
    while (i < ts.length - 2 && t > ts[i + 1]) i++;
    let f = Math.min(1, Math.max(0, (t - ts[i]) / (ts[i + 1] - ts[i])));
    const last = i === ts.length - 2;
    if (last) f = 1 - Math.pow(1 - f, 3);   // son yaklaşma: yavaşlayarak "tık" diye otur
    const u = (i + f) / (this.n - 1);
    const fovFlight = 50;
    const fov = last ? fovFlight + (this.finalFov - fovFlight) * f : fovFlight;
    return { pos: this.posCurve.getPoint(u), target: this.tgtCurve.getPoint(u), fov, aligned: false };
  }
}
