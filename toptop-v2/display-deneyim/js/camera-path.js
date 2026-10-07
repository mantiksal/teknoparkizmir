// Gösteri boyunca sanal kameranın yolu.
// 1) Uçuş (0 → flightEnd): kamera dağınık obje bulutunun etrafında ve içinden geçer.
// 2) Yaklaşma (flightEnd → alignAt): kamera sihirli noktanın (E) hemen önünde,
//    objeler portreye tek tek yerleşirken yavaşça E'ye doğru süzülür.
// 3) alignAt: kamera tam E'de; portre netleşir.
import * as THREE from '../vendor/three/three.module.js';

// [zaman oranı (0–1, uçuş süresine göre), konum (C'ye göre, H birimi), hedef ('C' ya da C'ye göre nokta)]
const PATHS = {
  default: [
    [0.00, [-2.6, 1.2, 2.2]], [0.22, [1.9, 0.4, 2.3]], [0.43, [2.3, -0.6, -1.2]],
    [0.64, [-0.3, 0.3, -3.6]], [0.85, [-2.4, -0.2, -0.2]], [1.0, [-1.4, 0.35, 3.4]],
  ],
  firestarter: [
    [0.00, [0.2, 0.1, 1.2]], [0.17, [2.6, 0.8, 2.6]], [0.39, [2.4, -0.8, -1.4]],
    [0.62, [-0.4, 0.6, -3.4]], [0.84, [-2.6, -0.4, 0.2]], [1.0, [-1.2, 0.3, 3.4]],
  ],
  mountaineer: [
    [0.00, [-2.4, -2.4, 1.8]], [0.22, [1.8, -1.6, 2.2]], [0.43, [2.2, -0.4, -1.3]],
    [0.64, [-0.2, 0.9, -3.4]], [0.85, [-2.2, 1.7, 0.2]], [1.0, [-1.2, 1.2, 3.2]],
  ],
  trailblazer: [
    [0.00, [0, 0.1, 5.5]], [0.25, [0, 0.05, 2.0], [0, 0, -9]], [0.45, [0.05, 0.1, -0.6], [0, 0, -9]],
    [0.62, [0.2, 0.3, -3.0]], [0.81, [2.4, 0.1, -0.6]], [1.0, [-1.2, 0.3, 3.2]],
  ],
  cartographer: [
    [0.00, [0, 3.4, 0.6], [0, -0.75, 0]], [0.22, [0.2, 2.6, 1.8], [0, -0.6, 0]], [0.45, [1.9, 1.2, 2.2]],
    [0.65, [2.2, 0.1, -1.0]], [0.85, [-1.9, 0.3, 0.4]], [1.0, [-1.2, 0.3, 3.2]],
  ],
  outsider: [
    [0.00, [-1.7, 0.25, 1.9]], [0.22, [1.6, 0.2, 1.9]], [0.43, [2.0, 0.1, -0.6]],
    [0.64, [0, 0.25, -2.3]], [0.85, [-2.0, 0.1, -0.4]], [1.0, [-1.2, 0.2, 2.8]],
  ],
};

const FLIGHT_FOV = 50;
const smoother = (x) => x * x * x * (x * (x * 6 - 15) + 10);   // başı ve sonu ivmesiz
const _m = new THREE.Matrix4();
const _up = new THREE.Vector3(0, 1, 0);

export class CameraPath {
  /**
   * Kamera akışı tüm gösteri boyunca sürer; blendStart'tan alignAt'e kadar akış
   * ile sihirli nokta (E) arasında konum, yön ve zoom birlikte, ivmesiz karışır.
   * Böylece portre kurulurken hiçbir ani zoom, dönüş ya da sıçrama olmaz.
   * @param kind       arketip anahtarı
   * @param E          sihirli nokta (kamera burada biter)
   * @param C          obje bulutunun merkezi
   * @param H          ölçek (perde yüksekliği)
   * @param blendStart hedefe yumuşak geçişin başladığı saniye
   * @param alignAt    kameranın E'ye oturduğu saniye
   * @param finalFov   E'den perdeyi tam kaplayan dikey görüş açısı (derece)
   */
  constructor(kind, E, C, H, blendStart, alignAt, finalFov) {
    const keys = PATHS[kind] || PATHS.default;
    const k = H * 0.5;
    this.times = keys.map(([f]) => f * alignAt);
    const pos = keys.map(([, p]) => new THREE.Vector3(...p).multiplyScalar(k).add(C));
    const tgt = keys.map(([, , t]) => (t ? new THREE.Vector3(...t).multiplyScalar(k).add(C) : C.clone()));
    this.posCurve = new THREE.CatmullRomCurve3(pos, false, 'centripetal');
    this.tgtCurve = new THREE.CatmullRomCurve3(tgt, false, 'centripetal');
    Object.assign(this, { E, blendStart, alignAt, finalFov, n: pos.length });
  }

  /** @returns {{ pos, quat, fov, aligned }} */
  sample(t) {
    if (t >= this.alignAt) return { pos: this.E.clone(), quat: new THREE.Quaternion(), fov: this.finalFov, aligned: true };
    // Akış (sabit hızda, eğri boyunca)
    const ts = this.times;
    let i = 0;
    while (i < ts.length - 2 && t > ts[i + 1]) i++;
    const f = Math.min(1, Math.max(0, (t - ts[i]) / (ts[i + 1] - ts[i])));
    const u = (i + f) / (this.n - 1);
    const pos = this.posCurve.getPoint(u);
    const quat = new THREE.Quaternion().setFromRotationMatrix(_m.lookAt(pos, this.tgtCurve.getPoint(u), _up));
    let fov = FLIGHT_FOV;
    // Hedefe yumuşak karışım
    if (t > this.blendStart) {
      const w = smoother((t - this.blendStart) / (this.alignAt - this.blendStart));
      pos.lerp(this.E, w);
      quat.slerp(new THREE.Quaternion(), w);
      fov = FLIGHT_FOV + (this.finalFov - FLIGHT_FOV) * w;
    }
    return { pos, quat, fov, aligned: false };
  }
}
