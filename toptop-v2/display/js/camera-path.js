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

export class CameraPath {
  /**
   * @param kind      arketip anahtarı
   * @param E         sihirli nokta (kamera burada biter)
   * @param C         obje bulutunun merkezi
   * @param H         ölçek (perde yüksekliği)
   * @param flightEnd uçuşun bittiği, yaklaşmanın başladığı saniye
   * @param alignAt   kameranın E'ye oturduğu saniye
   * @param finalFov  E'den perdeyi tam kaplayan dikey görüş açısı (derece)
   */
  constructor(kind, E, C, H, flightEnd, alignAt, finalFov) {
    const keys = PATHS[kind] || PATHS.default;
    const k = H * 0.5;
    const lastFlight = flightEnd - 3;
    // Yaklaşmanın başladığı nokta: E'nin hemen arkası, perdeye düz bakıyor.
    this.pre = E.clone().add(new THREE.Vector3(0, H * 0.03, H * 0.38));
    const far = new THREE.Vector3(0, 0, -10000).add(E);
    this.times = keys.map(([f]) => f * lastFlight).concat([flightEnd]);
    const pos = keys.map(([, p]) => new THREE.Vector3(...p).multiplyScalar(k).add(C)).concat([this.pre.clone()]);
    const tgt = keys.map(([, , t]) => (t ? new THREE.Vector3(...t).multiplyScalar(k).add(C) : C.clone())).concat([far]);
    this.posCurve = new THREE.CatmullRomCurve3(pos, false, 'centripetal');
    this.tgtCurve = new THREE.CatmullRomCurve3(tgt, false, 'centripetal');
    Object.assign(this, { E, far, flightEnd, alignAt, finalFov, n: pos.length });
  }

  /** @returns {{ pos, target, fov, aligned }} */
  sample(t) {
    if (t >= this.alignAt) return { pos: this.E.clone(), target: null, fov: this.finalFov, aligned: true };
    if (t >= this.flightEnd) {
      // Portre kurulurken yavaş, sakin yaklaşma; sona doğru iyice yavaşlar.
      const f = (t - this.flightEnd) / (this.alignAt - this.flightEnd);
      const e = 1 - Math.pow(1 - f, 2.4);
      return { pos: this.pre.clone().lerp(this.E, e), target: this.far, fov: this.finalFov, aligned: false };
    }
    const ts = this.times;
    let i = 0;
    while (i < ts.length - 2 && t > ts[i + 1]) i++;
    let f = Math.min(1, Math.max(0, (t - ts[i]) / (ts[i + 1] - ts[i])));
    const last = i === ts.length - 2;
    if (last) f = 1 - Math.pow(1 - f, 3);
    const u = (i + f) / (this.n - 1);
    const fov = last ? FLIGHT_FOV + (this.finalFov - FLIGHT_FOV) * f : FLIGHT_FOV;
    return { pos: this.posCurve.getPoint(u), target: this.tgtCurve.getPoint(u), fov, aligned: false };
  }
}
