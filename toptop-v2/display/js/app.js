// Stand ekranı (2. monitör).
// Akış: bekleme (QR + kamera) → karşılama → 5 sn fotoğraf → Teknopark hikâyesi
// eşliğinde objelerin uçuşu ve portrenin oluşması → bitiş ekranı (15 sn) → bekleme.
import * as THREE from '../vendor/three/three.module.js';
import { builtinSprites, loadCustomSprites } from './objects.js';
import { AnamorphScene, analyzeTarget, textTarget } from './anamorph.js';
import { preparePortrait, HeadTracker } from './vision.js';
import { ARCHETYPES, ORDER } from '../../quiz/quiz-data.js';
import { decodeToken } from '../../quiz/token.js';
import { CONFIG, BRAND } from '../config.js';
import { SCENES, SOURCE_NOTE, ASSEMBLE, ALIGN_AT } from './story.js';
import { CameraPath } from './camera-path.js';
import { QRScanner } from './scanner.js';
import { composeCard, uploadCard } from './share.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ sahne

const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0f12);
scene.fog = new THREE.Fog(0x0d0f12, 1e5, 2e5);
const camera = new THREE.PerspectiveCamera(40, 1, 1, 6000);
const ana = new AnamorphScene(scene);
ana.setOptions({ backs: true, wires: false });

// Sanal perde: yükseklik H=100 birim; sihirli nokta perdenin tam karşısında.
const H = 100, EZ = 160;
const E = new THREE.Vector3(0, 0, EZ);
const FINAL_FOV = 2 * Math.atan(H / 2 / EZ) * 180 / Math.PI;
let W = H, vertical = true;

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  W = H * camera.aspect;
  vertical = camera.aspect < 1;
}
addEventListener('resize', () => { resize(); if (state === 'idle') idle.next = 0; });

/** Ekran yönüne göre portrenin yeri: dikeyde ortada, yatayda solda. */
function portraitLayout(kind) {
  if (vertical) return kind === 'idle' ? { portraitH: H * 0.3, portraitY: H * 0.12, portraitX: 0 } : { portraitH: H * 0.46, portraitY: H * 0.03, portraitX: 0 };
  return kind === 'idle' ? { portraitH: H * 0.55, portraitY: 0, portraitX: -W * 0.24 } : { portraitH: H * 0.86, portraitY: 0, portraitX: -W * 0.22 };
}

function buildCloud(analysis, archetype, kind, seed) {
  const a = ARCHETYPES[archetype];
  ana.build(analysis, sprites, {
    screenW: W, screenH: H, sMin: 0.5, sMax: 2.3, decoyRatio: kind === 'idle' ? 0.12 : 0.18, heroRatio: 0.006,
    seed, archetype, archColor: a?.color, ...portraitLayout(kind),
  });
  ana.setChoreography(archetype || 'swirl');
}

function setCamera({ pos, target, fov, aligned }) {
  camera.position.copy(pos);
  if (aligned || !target) camera.quaternion.identity();
  else camera.lookAt(target);
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
}

// ------------------------------------------------------------------ kamera / QR

const camSmall = $('camSmall'), camBig = $('camBig');
let stream = null;
const scanVideo = document.createElement('video');
scanVideo.muted = true; scanVideo.playsInline = true;
const scanner = new QRScanner(scanVideo);
const faceTracker = new HeadTracker();

async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' }, audio: false,
  });
  for (const v of [scanVideo, camSmall, camBig]) { v.srcObject = stream; v.play().catch(() => {}); }
  await scanner.init();
  $('camMsg').textContent = 'Sonuç QR\'ını bu kameraya göster';
}

const recentTokens = new Map();   // token → zaman (aynı QR'ı tekrar tetikleme)
async function scanLoop() {
  while (true) {
    await sleep(220);
    if (state !== 'idle' || !stream) continue;
    const text = await scanner.scan();
    if (!text) continue;
    const data = decodeToken(text);
    if (!data || !ARCHETYPES[data.archetype]) continue;
    const last = recentTokens.get(text);
    if (last && performance.now() - last < CONFIG.sameTokenCooldown * 1000) continue;
    recentTokens.set(text, performance.now());
    $('camBadge').classList.add('hit');
    start(data);
  }
}

function drawQR(el, text, cellPx = 8) {
  const qr = window.qrcode(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();
  const n = qr.getModuleCount(), q = 2;
  const c = document.createElement('canvas');
  c.width = c.height = (n + q * 2) * cellPx;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#000';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) g.fillRect((k + q) * cellPx, (r + q) * cellPx, cellPx, cellPx);
  el.replaceChildren(c);
}

// ------------------------------------------------------------------ durumlar

let state = 'boot';
let sprites = [];
const layers = ['idle', 'greet', 'capture', 'caption', 'end'];
function showLayer(...on) { for (const id of layers) $(id).classList.toggle('on', on.includes(id)); }

// Bekleme: arketip isimleri sırayla kendi koreografileriyle objelerden oluşur.
const idle = { i: -1, t0: 0, next: 0, cache: new Map() };
const IDLE_CYCLE = 10;

function idleTarget(key) {
  if (!idle.cache.has(key)) {
    const a = ARCHETYPES[key];
    const t = textTarget([{ text: a.emoji, size: 230 }, { text: a.name, size: 96 }], 1.25, [a.color, '#ffffff', a.color]);
    idle.cache.set(key, analyzeTarget(t, 700));
  }
  return idle.cache.get(key);
}

function enterIdle() {
  state = 'idle';
  idle.next = 0;
  scene.fog.near = 1e5; scene.fog.far = 2e5;
  $('camBadge').classList.remove('hit');
  showLayer('idle');
}

function updateIdle(now) {
  if (now >= idle.next) {
    idle.i = (idle.i + 1) % ORDER.length;
    const key = ORDER[idle.i];
    buildCloud(idleTarget(key), key, 'idle', 1000 + idle.i);
    idle.t0 = now; idle.next = now + IDLE_CYCLE;
  }
  const t = now - idle.t0;
  const prog = clamp(t / 4.5, 0, 1);
  // Toplanırken hafif salınan kamera; sonra tam hizada durur.
  const sway = 1 - ease(clamp((t - 3) / 2, 0, 1));
  const pos = E.clone().add(new THREE.Vector3(Math.sin(t * 0.7) * 22 * sway, Math.sin(t * 0.5) * 8 * sway, 30 * sway));
  setCamera({ pos, target: new THREE.Vector3(pos.x * 0.6, pos.y * 0.6, -1000), fov: FINAL_FOV, aligned: sway < 0.01 });
  ana.layout(E, prog);
}

// ------------------------------------------------------------------ deneyim

let session = null;

async function start(data) {
  if (state !== 'idle') return;
  const a = ARCHETYPES[data.archetype];
  session = { ...data, arch: a, key: data.archetype };
  document.documentElement.style.setProperty('--arch', a.color);

  // 1) Karşılama
  state = 'greet';
  $('gName').textContent = data.name || 'girişimci';
  showLayer('greet');
  await sleep(CONFIG.greet * 1000);

  // 2) Fotoğraf
  state = 'capture';
  showLayer('capture');
  const shot = await capturePhoto();

  // 3) Portreyi hazırla (bu sırada kısa bir geçiş)
  state = 'processing';
  $('cMsg').textContent = 'Harika! ✨';
  $('cCount').textContent = '';
  let analysis;
  try {
    const p = await preparePortrait(shot, { mirror: true });
    analysis = analyzeTarget(p, 1300);
  } catch (e) {
    console.error('Portre hazırlanamadı', e);
    analysis = idleTarget(data.archetype);
  }
  buildCloud(analysis, data.archetype, 'show', (Math.random() * 1e9) | 0);

  // 4) Gösteri
  const C = new THREE.Vector3(ana.portrait.x, ana.portrait.y, 0).sub(E).multiplyScalar(1.4).add(E);
  session.path = new CameraPath(data.archetype, E, C, H, ALIGN_AT, FINAL_FOV);
  session.t0 = performance.now() / 1000;
  session.scene = -1;
  state = 'show';
  showLayer('caption');
}

async function capturePhoto() {
  if (window.__testPhoto) {          // otomatik test için
    for (let n = CONFIG.countdown; n > 0; n--) { $('cCount').textContent = n; await sleep(200); }
    return window.__testPhoto;
  }
  let faceAt = -1;
  const check = setInterval(() => {
    const p = faceTracker.detect(camBig, 60);
    if (p) faceAt = performance.now();
    if (p !== undefined) $('capture').classList.toggle('face', performance.now() - faceAt < 400);
  }, 100);
  $('cMsg').textContent = 'Yüzünü çerçeveye getir';
  for (let n = CONFIG.countdown; n > 0; n--) { $('cCount').textContent = n; await sleep(1000); }
  // Yüz yoksa birkaç saniye daha bekle.
  const until = performance.now() + 4000;
  while (performance.now() - faceAt > 500 && performance.now() < until) {
    $('cCount').textContent = ''; $('cMsg').textContent = 'Seni göremiyorum, çerçeveye yaklaş 🙂';
    await sleep(150);
  }
  clearInterval(check);
  $('cCount').textContent = '';
  const c = document.createElement('canvas');
  c.width = camBig.videoWidth; c.height = camBig.videoHeight;
  c.getContext('2d').drawImage(camBig, 0, 0);
  flash();
  return c;
}

function flash() {
  const f = $('flash');
  f.style.transition = 'none'; f.style.opacity = 1;
  requestAnimationFrame(() => requestAnimationFrame(() => { f.style.transition = 'opacity .8s'; f.style.opacity = 0; }));
}

function updateShow(now) {
  const t = now - session.t0;
  const prog = clamp((t - ASSEMBLE.t0) / (ASSEMBLE.t1 - ASSEMBLE.t0), 0, 1);
  const cam = session.path.sample(t);
  setCamera(cam);
  ana.layout(E, prog < 1 ? prog : 1);

  // Uçuşta derinlik sisi; hizalanırken kalkar ki portrenin renkleri doğru görünsün.
  const fogK = 1 - ease(clamp((t - (ALIGN_AT - 4)) / 3.5, 0, 1));
  scene.fog.near = 200 + (1 - fogK) * 1e5;
  scene.fog.far = 700 + (1 - fogK) * 2e5;

  // Hikâye yazıları
  const idx = SCENES.findIndex((s) => t >= s.t0 && t < s.t1);
  if (idx !== session.scene) {
    session.scene = idx;
    const cap = $('caption');
    cap.classList.remove('show');
    if (idx >= 0) {
      const s = SCENES[idx];
      const fill = (x) => x.replace('{name}', session.name || 'sen');
      setTimeout(() => {
        $('capKicker').textContent = fill(s.kicker);
        $('capTitle').textContent = fill(s.title);
        $('capSrc').textContent = s.source ? SOURCE_NOTE : '';
        cap.classList.add('show');
      }, 250);
    }
  }
  if (cam.aligned && !session.flashed) { session.flashed = true; flashSoft(); }
  if (t >= CONFIG.show) enterEnd();
}

function flashSoft() {
  const f = $('flash');
  f.style.transition = 'none'; f.style.opacity = 0.35;
  requestAnimationFrame(() => requestAnimationFrame(() => { f.style.transition = 'opacity 1.2s'; f.style.opacity = 0; }));
}

function enterEnd() {
  state = 'end';
  const s = session, a = s.arch;
  $('eArch').textContent = `${a.emoji} ${a.name}`;
  $('eWho').textContent = `girişimcisi ${s.name}`;
  $('eInvite').innerHTML = `Seni <span>${CONFIG.academy.title}</span>'ne bekliyoruz, ${escapeHtml(s.name)}!`;
  $('eNote').textContent = CONFIG.academy.note;
  $('eQr').textContent = '…';
  $('eShareT').textContent = 'Portreni Instagram\'da paylaş';
  $('eShareS').textContent = 'Paylaşım bağlantısı hazırlanıyor…';
  showLayer('end');
  const bar = $('eBar');
  bar.style.transition = 'none'; bar.style.transform = 'scaleX(1)';
  requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = `transform ${CONFIG.end}s linear`; bar.style.transform = 'scaleX(0)'; }));
  s.endAt = performance.now() / 1000 + CONFIG.end;
  s.needShot = true;
}

async function prepareShare(shot) {
  const s = session;
  try {
    const card = composeCard(shot, { name: s.name, arch: s.arch });
    const url = s.consent ? await uploadCard(card, { name: s.name, key: s.key }) : null;
    if (s !== session) return;
    if (url) {
      drawQR($('eQr'), url, 6);
      $('eShareS').textContent = 'QR\'ı okut, portreni indir ya da hikâyende paylaş · ' + CONFIG.academy.instagram;
      return;
    }
  } catch (e) {
    console.warn('Paylaşım hazırlanamadı', e);
  }
  if (s !== session) return;
  drawQR($('eQr'), CONFIG.quizUrl, 6);
  $('eShareT').textContent = 'Arkadaşlarını da teste davet et';
  $('eShareS').textContent = `Bizi takip et: ${CONFIG.academy.instagram}`;
}

const escapeHtml = (x) => String(x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function updateEnd(now) {
  setCamera({ pos: E, fov: FINAL_FOV, aligned: true });
  ana.layout(E, 1);
  if (now >= session.endAt) { session = null; enterIdle(); }
}

// ------------------------------------------------------------------ döngü

let fps = 0, fpsN = 0, fpsT = 0;
function frame(ms) {
  const now = ms / 1000;
  if (state === 'idle') updateIdle(now);
  else if (state === 'show') updateShow(now);
  else if (state === 'end') updateEnd(now);
  renderer.render(scene, camera);
  if (session?.needShot) {
    // Çizimden hemen sonra kopyala (WebGL tamponu bir sonraki karede temizlenir).
    session.needShot = false;
    const shot = document.createElement('canvas');
    shot.width = canvas.width; shot.height = canvas.height;
    shot.getContext('2d').drawImage(canvas, 0, 0);
    prepareShare(shot);
  }
  fpsN++;
  if (now - fpsT > 0.5) {
    fps = fpsN / (now - fpsT); fpsN = 0; fpsT = now;
    $('debug').textContent = `durum: ${state}\nfps: ${fps.toFixed(0)}\nobje: ${ana.count}\nQR: ${scanner.engine || '-'}`;
  }
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ test kısayolları

addEventListener('keydown', (e) => {
  if (e.key === 'd' || e.key === 'D') document.body.classList.toggle('debug');
  else if (e.key === 'f' || e.key === 'F') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  else if ((e.key === 't' || e.key === 'T') && state === 'idle') {
    // Telefon olmadan deneme: rastgele arketiple başlat.
    const key = ORDER[Math.floor(Math.random() * ORDER.length)];
    start({ name: 'Deneme', archetype: key, consent: false });
  } else if (e.key === 'Escape' && state !== 'idle') { session = null; enterIdle(); }
});
window.__start = start;   // otomatik test için
window.__dbg = { ana, camera, E, get state() { return state; } };

// ------------------------------------------------------------------ başlat

(async function init() {
  resize();
  drawQR($('idleQr'), CONFIG.quizUrl, 8);
  const r = await loadCustomSprites(builtinSprites());
  sprites = r.sprites;
  enterIdle();
  requestAnimationFrame(frame);
  try {
    await startCamera();
    await faceTracker.setMode('face');
  } catch (e) {
    console.error(e);
    $('camMsg').textContent = 'Kamera açılamadı: ' + e.message;
  }
  scanLoop();
  // Modelleri ısıt: ilk katılımcıda bekleme olmasın.
  try { const c = document.createElement('canvas'); c.width = c.height = 64; await preparePortrait(c); } catch {}
})();
