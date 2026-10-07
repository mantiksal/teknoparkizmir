// MediaPipe tabanlı görüntü işleme: portre hazırlama + kafa takibi.
import {
  FilesetResolver, FaceLandmarker, PoseLandmarker, ImageSegmenter,
} from '../vendor/mediapipe/vision_bundle.mjs';

const WASM = new URL('../vendor/mediapipe/wasm', import.meta.url).href;
const MODEL = (f) => new URL('../models/' + f, import.meta.url).href;

let filesetPromise;
const fileset = () => (filesetPromise ??= FilesetResolver.forVisionTasks(WASM));

// ---------------------------------------------------------------- portre

let faceImagePromise, segmenterPromise;

const faceImage = () => (faceImagePromise ??= fileset().then((fs) =>
  FaceLandmarker.createFromOptions(fs, {
    baseOptions: { modelAssetPath: MODEL('face_landmarker.task'), delegate: 'CPU' },
    runningMode: 'IMAGE',
    numFaces: 1,
  })));

const segmenter = () => (segmenterPromise ??= fileset().then((fs) =>
  ImageSegmenter.createFromOptions(fs, {
    baseOptions: { modelAssetPath: MODEL('selfie_segmenter.tflite'), delegate: 'CPU' },
    runningMode: 'IMAGE',
    outputConfidenceMasks: true,
    outputCategoryMask: false,
  })));

function toCanvas(src, mirror) {
  const w = src.videoWidth || src.naturalWidth || src.width;
  const h = src.videoHeight || src.naturalHeight || src.height;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (mirror) { g.translate(w, 0); g.scale(-1, 1); }
  g.drawImage(src, 0, 0, w, h);
  return c;
}

/**
 * Fotoğraftan yüz merkezli portre kırpar ve kişi maskesi çıkarır.
 * Dönüş: { color: canvas, mask: canvas (gri tonlu), aspect, faceFound, segmented }
 */
// MediaPipe grafikleri aynı anda çağrılmasın: portre işlenirken yüz takibi bekler.
let visionBusy = false;
export const isVisionBusy = () => visionBusy;

export async function preparePortrait(src, opts = {}) {
  visionBusy = true;
  try { return await preparePortraitInner(src, opts); } finally { visionBusy = false; }
}

/**
 * MediaPipe kullanmadan yedek portre: ortadan 3:4 kırpma + elips maske.
 * Görüntü işleme takılırsa ya da hata verirse deneyim bununla devam eder.
 */
export function fallbackPortrait(src, { aspect = 0.78, outH = 720, mirror = false } = {}) {
  const full = toCanvas(src, mirror);
  const W = full.width || 640, H = full.height || 480;
  const ch = H * 0.95, cw = Math.min(W, ch * aspect);
  const outW = Math.round(outH * aspect);
  const color = document.createElement('canvas');
  color.width = outW; color.height = outH;
  const g = color.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, outW, outH);
  if (full.width) g.drawImage(full, (W - cw) / 2, H * 0.02, cw, cw / aspect, 0, 0, outW, outH);
  const mask = document.createElement('canvas');
  mask.width = outW; mask.height = outH;
  const mg = mask.getContext('2d');
  mg.fillStyle = '#000'; mg.fillRect(0, 0, outW, outH);
  mg.fillStyle = '#fff'; mg.beginPath();
  mg.ellipse(outW / 2, outH * 0.42, outW * 0.33, outH * 0.36, 0, 0, Math.PI * 2); mg.fill();
  mg.beginPath(); mg.ellipse(outW / 2, outH * 1.05, outW * 0.5, outH * 0.3, 0, 0, Math.PI * 2); mg.fill();
  return { color, mask, aspect, faceFound: false, segmented: false, regions: null };
}

async function preparePortraitInner(src, { aspect = 0.78, outH = 720, mirror = false } = {}) {
  const full = toCanvas(src, mirror);
  if (!full.width || !full.height) throw new Error('boş görüntü');
  const W = full.width, H = full.height;

  // 1) Yüzü bul ve baş + omuzları kapsayacak şekilde kırp.
  let crop = null, faceFound = false, lm = null;
  try {
    const res = (await faceImage()).detect(full);
    lm = res.faceLandmarks?.[0];
    if (lm) {
      let x0 = 1, x1 = 0, y0 = 1, y1 = 0;
      for (const p of lm) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
      const fh = (y1 - y0) * H;
      const ch = fh * 2.25;
      const cw = ch * aspect;
      const cx = ((x0 + x1) / 2) * W;
      crop = { x: cx - cw / 2, y: y0 * H - fh * 0.6, w: cw, h: ch };
      faceFound = true;
    }
  } catch (e) {
    console.warn('Yüz tespiti başarısız:', e);
  }
  if (!crop) {
    const ch = H, cw = Math.min(W, ch * aspect);
    crop = { x: (W - cw) / 2, y: 0, w: cw, h: cw / aspect };
  }
  // Kırpma fotoğraftan taşarsa (kameraya yakın çekim) siyah alan portreyi keser:
  // en-boy oranını koruyarak küçült ve fotoğrafın içine kaydır.
  const k = Math.min(1, W / crop.w, H / crop.h);
  if (k < 1) {
    const cx = crop.x + crop.w / 2;
    crop.w *= k; crop.h *= k;
    crop.x = cx - crop.w / 2;
  }
  crop.x = Math.min(Math.max(0, crop.x), W - crop.w);
  crop.y = Math.min(Math.max(0, crop.y), H - crop.h);

  const outW = Math.round(outH * aspect);
  const color = document.createElement('canvas');
  color.width = outW; color.height = outH;
  const cg = color.getContext('2d');
  cg.fillStyle = '#000'; cg.fillRect(0, 0, outW, outH);
  cg.drawImage(full, crop.x, crop.y, crop.w, crop.h, 0, 0, outW, outH);

  // 2) Kişi maskesi (arka planı at).
  const mask = document.createElement('canvas');
  mask.width = outW; mask.height = outH;
  const mg = mask.getContext('2d');
  let segmented = false;
  try {
    const res = (await segmenter()).segment(color);
    const m = res.confidenceMasks[0];
    const data = m.getAsFloat32Array();
    const mw = m.width, mh = m.height;
    const tmp = document.createElement('canvas');
    tmp.width = mw; tmp.height = mh;
    const img = tmp.getContext('2d').createImageData(mw, mh);
    for (let i = 0; i < data.length; i++) {
      const v = Math.round(Math.min(1, Math.max(0, data[i])) * 255);
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    tmp.getContext('2d').putImageData(img, 0, 0);
    mg.drawImage(tmp, 0, 0, outW, outH);
    res.close?.();
    segmented = true;
  } catch (e) {
    console.warn('Segmentasyon başarısız, elips maske kullanılıyor:', e);
    mg.fillStyle = '#000'; mg.fillRect(0, 0, outW, outH);
    mg.fillStyle = '#fff'; mg.beginPath();
    mg.ellipse(outW / 2, outH * 0.45, outW * 0.36, outH * 0.42, 0, 0, Math.PI * 2); mg.fill();
    mg.fillRect(outW * 0.08, outH * 0.8, outW * 0.84, outH * 0.2);
  }

  // 3) Yüz bölgeleri (kırpılmış portrede 0–1 koordinatlar).
  let regions = null;
  if (lm) {
    const toCrop = (i) => [(lm[i].x * W - crop.x) / crop.w, (lm[i].y * H - crop.y) / crop.h];
    const pts = (conns) => [...new Set(conns.flatMap((c) => [c.start, c.end]))].map(toCrop);
    regions = {
      faceOval: pts(FaceLandmarker.FACE_LANDMARKS_FACE_OVAL),
      eyes: [pts(FaceLandmarker.FACE_LANDMARKS_LEFT_EYE), pts(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE)],
      brows: [pts(FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW), pts(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW)],
      lips: pts(FaceLandmarker.FACE_LANDMARKS_LIPS),
      chinY: toCrop(152)[1],
    };
  }

  return { color, mask, aspect, faceFound, segmented, regions };
}

// ---------------------------------------------------------------- takip

class LowPass {
  constructor() { this.y = null; }
  run(x, a) { this.y = this.y == null ? x : a * x + (1 - a) * this.y; return this.y; }
}

// One Euro filtresi: durağanken titremeyi bastırır, hızlı harekette gecikmeyi azaltır.
export class OneEuro {
  constructor(minCutoff = 1.0, beta = 0.02, dCutoff = 1.0) {
    Object.assign(this, { minCutoff, beta, dCutoff });
    this.x = new LowPass(); this.dx = new LowPass(); this.t = null;
  }
  static alpha(cutoff, dt) { const tau = 1 / (2 * Math.PI * cutoff); return 1 / (1 + tau / dt); }
  reset() { this.x = new LowPass(); this.dx = new LowPass(); this.t = null; }
  filter(v, t) {
    const dt = this.t == null ? 1 / 30 : Math.max(1e-3, t - this.t);
    const prev = this.x.y;
    this.t = t;
    const d = prev == null ? 0 : (v - prev) / dt;
    const ed = this.dx.run(d, OneEuro.alpha(this.dCutoff, dt));
    const cutoff = this.minCutoff + this.beta * Math.abs(ed);
    return this.x.run(v, OneEuro.alpha(cutoff, dt));
  }
}

const IPD_CM = 6.3;        // ortalama göz bebekleri arası mesafe
const SHOULDER_CM = 38;    // ortalama omuz genişliği (landmark 11-12)

/**
 * Kamera görüntüsünden izleyicinin göz konumunu (kamera koordinatında, cm) çıkarır.
 * mode 'face': yakın mesafe (<~1.5 m, laptop demosu)
 * mode 'pose': çadır mesafesi (1–4 m), birden fazla kişide en yakını seçer
 */
export class HeadTracker {
  constructor() { this.mode = null; this.task = null; this.lastTs = -1; this.debug = null; }

  async setMode(mode) {
    if (mode === this.mode && this.task) return;
    this.mode = mode;
    const fs = await fileset();
    this.task?.close?.();
    this.task = null;
    if (mode === 'face') {
      this.task = await FaceLandmarker.createFromOptions(fs, {
        baseOptions: { modelAssetPath: MODEL('face_landmarker.task'), delegate: 'GPU' },
        runningMode: 'VIDEO', numFaces: 3,
      });
    } else {
      this.task = await PoseLandmarker.createFromOptions(fs, {
        baseOptions: { modelAssetPath: MODEL('pose_landmarker_lite.task'), delegate: 'GPU' },
        runningMode: 'VIDEO', numPoses: 3,
        minPoseDetectionConfidence: 0.4, minPosePresenceConfidence: 0.4, minTrackingConfidence: 0.4,
      });
    }
  }

  /** @returns {{x,y,z,u,v}|null} kamera koordinatı (cm): x sağ, y yukarı, z kameradan uzaklık */
  detect(video, hfovDeg) {
    if (!this.task || video.readyState < 2 || visionBusy) return undefined;
    const ts = performance.now();
    if (video.currentTime === this.lastVideoTime) return undefined;
    this.lastVideoTime = video.currentTime;

    const vw = video.videoWidth, vh = video.videoHeight;
    const f = (vw / 2) / Math.tan((hfovDeg * Math.PI / 180) / 2);
    let best = null;

    if (this.mode === 'face') {
      const res = this.task.detectForVideo(video, ts);
      for (const lm of res.faceLandmarks || []) {
        const a = lm[468], b = lm[473];
        const u = (a.x + b.x) / 2 * vw, v = (a.y + b.y) / 2 * vh;
        const px = Math.hypot((a.x - b.x) * vw, (a.y - b.y) * vh);
        if (!best || px > best.px) best = { u, v, px, real: IPD_CM };
      }
    } else {
      const res = this.task.detectForVideo(video, ts);
      for (const lm of res.landmarks || []) {
        const le = lm[2], re = lm[5], ls = lm[11], rs = lm[12];
        if ((le.visibility ?? 1) < 0.3 || (re.visibility ?? 1) < 0.3) continue;
        const u = (le.x + re.x) / 2 * vw, v = (le.y + re.y) / 2 * vh;
        const px = Math.hypot((ls.x - rs.x) * vw, (ls.y - rs.y) * vh);
        if (!best || px > best.px) best = { u, v, px, real: SHOULDER_CM };
      }
    }
    this.debug = best ? { u: best.u / vw, v: best.v / vh } : null;
    if (!best || best.px < 2) return null;

    const z = best.real * f / best.px;
    return {
      x: (best.u - vw / 2) * z / f,
      y: (vh / 2 - best.v) * z / f,
      z,
    };
  }
}
