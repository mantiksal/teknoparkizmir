// Stand ekranı (2. monitör).
// Akış: bekleme (tanıtım videosu + QR) → karşılama → 5 sn fotoğraf → Teknopark
// hikâyesi eşliğinde 3B objelerin uçuşu ve portrenin oluşması → unvan + davetiye (15 sn) → bekleme.
// Bekleme ekranı sürprizi bozmasın diye objelerden hiçbir şey göstermez.
import * as THREE from '../vendor/three/three.module.js';
import { RoomEnvironment } from '../vendor/three/addons/RoomEnvironment.js';
import { builtinSprites, loadCustomSprites } from './objects.js';
import { ObjectLibrary, setupLighting } from './objects3d.js';
import { AnamorphScene, analyzeTarget } from './anamorph.js';
import { preparePortrait, fallbackPortrait, HeadTracker } from './vision.js';
import { ARCHETYPES, ORDER } from '../../quiz/quiz-data.js';
import { decodeToken } from '../../quiz/token.js';
import { CONFIG } from '../config.js';
import { SCENES, STATEMENTS, STICK_AT, BUILD, CAMERA_BLEND, ALIGN_AT } from './story.js';
import { CameraPath } from './camera-path.js';
import { QRScanner } from './scanner.js';
import { composeCard, uploadCard } from './share.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('zaman aşımı')), ms))]);

// ------------------------------------------------------------------ sahne

const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x141619, 1e5, 2e5);
const camera = new THREE.PerspectiveCamera(40, 1, 1, 6000);
setupLighting(renderer, scene, RoomEnvironment);
const library = new ObjectLibrary();
const ana = new AnamorphScene(scene, library);
ana.setOptions({ backs: false, wires: false });

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
let resizeT;
addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(resize, 200); });

/** Ekran yönüne göre portrenin yeri: dikeyde ortada, yatayda solda. */
function portraitLayout() {
  return vertical ? { portraitH: H * 0.44, portraitY: H * 0.07, portraitX: 0 } : { portraitH: H * 0.86, portraitY: 0, portraitX: -W * 0.22 };
}

function setCamera({ pos, target, quat, fov, aligned }) {
  camera.position.copy(pos);
  if (quat) camera.quaternion.copy(quat);
  else if (aligned || !target) camera.quaternion.identity();
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
}

const recentTokens = new Map();   // token → zaman (aynı QR'ı tekrar tetikleme)
async function scanLoop() {
  while (true) {
    await sleep(200);
    if (state !== 'idle' || !stream) continue;
    const text = await scanner.scan();
    if (!text) continue;
    const data = decodeToken(text);
    if (!data || !ARCHETYPES[data.archetype]) continue;
    const last = recentTokens.get(text);
    if (last && performance.now() - last < CONFIG.sameTokenCooldown * 1000) continue;
    recentTokens.set(text, performance.now());
    start(data);
  }
}

function drawQR(el, text, cellPx = 8) {
  const qr = window.qrcode(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();
  const n = qr.getModuleCount(), q = 1;
  const c = document.createElement('canvas');
  c.width = c.height = (n + q * 2) * cellPx;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#111';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) g.fillRect((k + q) * cellPx, (r + q) * cellPx, cellPx, cellPx);
  el.replaceChildren(c);
}

// ------------------------------------------------------------------ tanıtım videosu

const promoVideo = $('promoVideo');

async function startPromo() {
  const list = CONFIG.promoVideo || [];
  for (const src of list) {
    const ok = await new Promise((res) => {
      promoVideo.onloadedmetadata = () => res(true);
      promoVideo.onerror = () => res(false);
      promoVideo.src = src;
    });
    if (!ok) continue;
    // Her açılışta farklı bir yerden başla.
    promoVideo.currentTime = Math.random() * Math.max(0, promoVideo.duration - 5);
    if (state === 'idle') promoVideo.play().catch(() => {});
    return;
  }
}

// ------------------------------------------------------------------ durumlar

let state = 'boot', stateSince = 0;
function setState(s) { state = s; stateSince = performance.now() / 1000; }
let sprites = [];
const layers = ['idle', 'greet', 'capture', 'proc', 'brand', 'caption', 'say', 'end'];
function showLayer(...on) { for (const id of layers) $(id).classList.toggle('on', on.includes(id)); }

function enterIdle() {
  setState('idle');
  session = null;
  scene.fog.near = 1e5; scene.fog.far = 2e5;
  ana.group.visible = false;
  $('idle').classList.remove('hit');
  $('sticker').classList.remove('on');
  $('end').classList.remove('invite');
  showLayer('idle');
  if (promoVideo.src) promoVideo.play().catch(() => {});
}

function updateIdleLike() {
  setCamera({ pos: E, fov: FINAL_FOV, aligned: true });
}

// ------------------------------------------------------------------ deneyim

let session = null;

async function start(data) {
  if (state !== 'idle') return;
  const a = ARCHETYPES[data.archetype];
  const s = session = { ...data, arch: a, key: data.archetype };
  document.documentElement.style.setProperty('--arch', a.color);
  $('idle').classList.add('hit');
  promoVideo.pause();   // video yalnızca bekleme ekranında

  // 1) Karşılama
  setState('greet');
  $('gName').textContent = (data.name || 'Girişimci') + '!';
  showLayer('greet');
  await sleep(CONFIG.greet * 1000);
  if (session !== s) return;

  // 2) Fotoğraf
  setState('capture');
  showLayer('capture');
  const shot = await capturePhoto();
  if (session !== s) return;

  // 3) Portreyi hazırla. Takılırsa 6 sn sonra yedek kırpmayla devam et.
  setState('processing');
  showLayer('proc');
  let target;
  try {
    target = await withTimeout(preparePortrait(shot, { mirror: true }), 6000);
  } catch (e) {
    console.warn('Portre işleme başarısız, yedek kırpma kullanılıyor:', e.message);
    target = fallbackPortrait(shot, { mirror: true });
  }
  if (session !== s) return;
  // Bitiş ekranındaki polaroid için kırpılmış aslı sakla.
  try { s.photo = target.color.toDataURL('image/jpeg', 0.85); } catch { s.photo = ''; }
  let analysis;
  try { analysis = analyzeTarget(target, CONFIG.portraitObjects); } catch (e) {
    console.error(e); analysis = analyzeTarget(fallbackPortrait(shot, { mirror: true }), CONFIG.portraitObjects);
  }
  const buildOpts = {
    screenW: W, screenH: H, sMin: 0.5, sMax: 2.3, decoyRatio: 0.16, heroRatio: 0.006,
    seed: (Math.random() * 1e9) | 0, archetype: data.archetype, archColor: a.color, ...portraitLayout(),
  };
  try {
    ana.build(analysis, sprites, buildOpts);
  } catch (e) {
    console.error('Portre kurulamadı, yedek kırpma deneniyor:', e);
    try {
      ana.build(analyzeTarget(fallbackPortrait(shot, { mirror: true }), CONFIG.portraitObjects), sprites, buildOpts);
    } catch (e2) {
      console.error('Yedek de kurulamadı; bekleme ekranına dönülüyor:', e2);
      enterIdle();
      return;
    }
  }
  ana.setChoreography(data.archetype, BUILD.span);
  ana.group.visible = true;

  // 4) Gösteri
  const C = new THREE.Vector3(ana.portrait.x, ana.portrait.y, 0).sub(E).multiplyScalar(1.4).add(E);
  s.path = new CameraPath(data.archetype, E, C, H, CAMERA_BLEND, ALIGN_AT, FINAL_FOV);
  s.t0 = performance.now() / 1000;
  s.scene = -1; s.stmt = -1;
  $('sayBox').innerHTML = ''; $('say').classList.remove('out');
  $('capDots').innerHTML = SCENES.map(() => '<i></i>').join('');
  setState('show');
  showLayer('brand', 'caption', 'say');
}

async function capturePhoto() {
  const ring = $('cRing');
  const setRing = (f) => { ring.style.strokeDashoffset = String(289 * (1 - f)); };
  if (window.__testPhoto) {          // otomatik test için
    for (let n = CONFIG.countdown; n > 0; n--) { $('cCount').textContent = n; setRing(1 - (n - 1) / CONFIG.countdown); await sleep(150); }
    return window.__testPhoto;
  }
  let faceAt = -1;
  const check = setInterval(() => {
    const p = faceTracker.detect(scanVideo, 60);
    if (p) faceAt = performance.now();
    if (p !== undefined) $('capture').classList.toggle('face', performance.now() - faceAt < 400);
  }, 100);
  $('cMsg').textContent = 'Gülümse! 😄';
  const total = CONFIG.countdown * 1000, t0 = performance.now();
  while (performance.now() - t0 < total) {
    const left = total - (performance.now() - t0);
    $('cCount').textContent = Math.ceil(left / 1000);
    setRing(1 - left / total);
    await sleep(50);
  }
  // Yüz görünmüyorsa birkaç saniye daha bekle.
  const until = performance.now() + 3000;
  while (performance.now() - faceAt > 500 && performance.now() < until) {
    $('cCount').textContent = '🙂'; $('cMsg').textContent = 'Seni göremiyorum, çerçeveye gel';
    await sleep(120);
  }
  clearInterval(check);
  $('cCount').textContent = '';
  const v = scanVideo;
  const c = document.createElement('canvas');
  c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720;
  c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
  flash(1);
  return c;
}

function flash(strength = 1, dur = 0.8) {
  const f = $('flash');
  f.style.transition = 'none'; f.style.opacity = strength;
  requestAnimationFrame(() => requestAnimationFrame(() => { f.style.transition = `opacity ${dur}s`; f.style.opacity = 0; }));
}

/** Başlıktaki sayıları 0'dan sayarak yaz (ör. "254 firma"). */
function setTitle(el, text) {
  const parts = text.split(/(\d[\d.,]*)/);
  el.innerHTML = parts.map((p, i) => (i % 2 ? `<span class="num" data-v="${p}">0</span>` : p.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])))).join('');
  const nums = [...el.querySelectorAll('.num')];
  const t0 = performance.now();
  const tick = () => {
    const k = ease(clamp((performance.now() - t0) / 1100, 0, 1));
    for (const n of nums) {
      const raw = n.dataset.v;
      if (k >= 1) { n.textContent = raw; continue; }
      const [intPart] = raw.split(',');
      const v = Math.round(+intPart.replace(/\./g, '') * k);
      n.textContent = intPart.includes('.') ? v.toLocaleString('tr-TR') : String(v);
    }
    if (k < 1) requestAnimationFrame(tick);
  };
  tick();
}

function updateShow(now) {
  const s = session;
  const t = now - s.t0;
  const cam = s.path.sample(t);
  setCamera(cam);
  // Objeler dağınık bulutta süzülür; BUILD.t0'dan itibaren tek tek portreye yerleşir.
  ana.layout(E, t - BUILD.t0, 0, t);

  // Uçuşta derinlik sisi; kurulma başlamadan kalkar ki portrenin renkleri doğru görünsün.
  const fogK = 1 - ease(clamp((t - CAMERA_BLEND) / (BUILD.t0 + 2 - CAMERA_BLEND), 0, 1));
  scene.fog.near = 200 + (1 - fogK) * 1e5;
  scene.fog.far = 700 + (1 - fogK) * 2e5;

  const idx = SCENES.findIndex((sc) => t >= sc.t0 && t < sc.t1);
  if (idx !== s.scene) {
    s.scene = idx;
    const cap = $('caption');
    cap.classList.remove('show');
    [...$('capDots').children].forEach((d, i) => d.classList.toggle('on', i === idx));
    // Bilgilendirme bitince ilerleme noktaları da kaybolur.
    $('capDots').classList.toggle('gone', t > SCENES[SCENES.length - 1].t1);
    if (idx >= 0) {
      const sc = SCENES[idx];
      const fill = (x) => x.replace('{name}', s.name || 'sen');
      setTimeout(() => {
        if (session !== s) return;
        $('capKicker').textContent = fill(sc.kicker);
        setTitle($('capTitle'), fill(sc.title));
        cap.classList.add('show');
      }, 280);
    }
  }
  // Ortadaki cümleler (bilgilendirme bittikten sonra)
  const si = STATEMENTS.findIndex((st) => t >= st.t0 && t < st.t1);
  if (si !== s.stmt) {
    s.stmt = si;
    const say = $('say'), box = $('sayBox');
    if (si < 0) { say.classList.add('out'); }
    else {
      const st = STATEMENTS[si];
      say.classList.remove('out');
      box.className = 'say' + (st.big ? ' big' : '');
      let k = 0;
      box.innerHTML = st.lines.map((ln) => {
        const base = ln.delay || 0;
        const words = ln.text.replace('{name}', s.name || 'sen').split(' ');
        return `<span class="ln${ln.name ? ' name' : ''}">` + words.map((w, i) =>
          `<span class="w" style="animation-delay:${(base + (k++, i) * 0.16).toFixed(2)}s">${escapeHtml(w)}</span>`).join(' ') + '</span>';
      }).join('');
    }
  }
  // Fotoğraf kurulmadan önce köşeye yapışır ve bitiş ekranında da kalır.
  if (t >= STICK_AT && !s.stuck) { s.stuck = true; $('ePhoto').src = s.photo || ''; $('sticker').classList.add('on'); }
  if (cam.aligned && !s.flashed) { s.flashed = true; flash(0.55, 1.4); }
  if (t >= CONFIG.show) enterEnd();
}

function confetti() {
  const box = $('confetti');
  box.innerHTML = '';
  const colors = ['#80CD36', '#5C8CC8', '#EC7C00', '#f3c969', '#ffffff'];
  for (let i = 0; i < 90; i++) {
    const c = document.createElement('i');
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = colors[i % colors.length];
    c.style.setProperty('--dx', (Math.random() - 0.5) * 30 + 'vw');
    c.style.setProperty('--rot', (Math.random() * 1440 - 720) + 'deg');
    c.style.animationDuration = 2.4 + Math.random() * 2 + 's';
    c.style.animationDelay = Math.random() * 0.6 + 's';
    box.appendChild(c);
  }
  setTimeout(() => { box.innerHTML = ''; }, 6000);
}

function enterEnd() {
  setState('end');
  const s = session, a = s.arch, ac = CONFIG.academy;
  $('eArch').textContent = `${a.emoji} ${a.name}`;
  $('eWho').textContent = `girişimcisi ${s.name}`;
  $('tTitle').textContent = ac.title;
  $('tName').textContent = s.name;
  $('tDates').textContent = '📅 ' + ac.dates;
  $('tPlace').textContent = '📍 ' + ac.place;
  $('eDeadline').textContent = ac.deadline;
  $('eScan').textContent = 'Okut, yerini ayırt';
  $('eQr').textContent = '…';
  $('end').classList.remove('invite');
  showLayer('brand', 'end');
  // Önce unvan ve portre; 1,4 sn sonra davetiye konfetiyle gelir.
  setTimeout(() => { if (session === s) { $('end').classList.add('invite'); confetti(); } }, 1400);
  const bar = $('eBar');
  bar.style.transition = 'none'; bar.style.transform = 'scaleX(1)';
  requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = `transform ${CONFIG.end}s linear`; bar.style.transform = 'scaleX(0)'; }));
  s.endAt = performance.now() / 1000 + CONFIG.end;
  s.needShot = true;
}

async function prepareShare(shot) {
  const s = session;
  // Davetiyenin QR'ı başvuru sayfasına gider; portre paylaşımı açıksa paylaşım sayfasına
  // (orada başvuru bağlantısı da var).
  let url = CONFIG.academy.applyUrl;
  try {
    const card = composeCard(shot, { name: s.name, arch: s.arch });
    const shared = s.consent ? await withTimeout(uploadCard(card, { name: s.name, key: s.key }), 8000) : null;
    if (shared) { url = shared; $('eScan').textContent = 'Okut: davetiyen ve portren telefonunda'; }
  } catch (e) {
    console.warn('Paylaşım hazırlanamadı', e);
  }
  if (s !== session) return;
  drawQR($('eQr'), url, 6);
}

const escapeHtml = (x) => String(x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function updateEnd(now) {
  setCamera({ pos: E, fov: FINAL_FOV, aligned: true });
  // Bitişte portre çok hafif nefes alır gibi kıpırdar
  ana.layout(E, Infinity, 0.025 * (1 + Math.sin(now * 1.3)), now);
  if (now >= session.endAt) enterIdle();
}

// ------------------------------------------------------------------ döngü

let fps = 0, fpsN = 0, fpsT = 0;
function frame(ms) {
  const now = ms / 1000;
  try {
    if (state === 'show') updateShow(now);
    else if (state === 'end') updateEnd(now);
    else updateIdleLike();
    // Bekçi: herhangi bir hazırlık aşaması takılırsa bekleme ekranına dön.
    if (['greet', 'capture', 'processing'].includes(state) && now - stateSince > 25) {
      console.warn('Bekçi: takılan aşama sıfırlandı:', state);
      enterIdle();
    }
  } catch (e) {
    console.error('Kare hatası', e);
    if (state !== 'idle') enterIdle();
  }
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

// ------------------------------------------------------------------ kısayollar

addEventListener('keydown', (e) => {
  if (e.key === 'd' || e.key === 'D') document.body.classList.toggle('debug');
  else if (e.key === 'f' || e.key === 'F') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  else if ((e.key === 't' || e.key === 'T') && state === 'idle') {
    // Telefon olmadan deneme: rastgele arketiple başlat.
    const key = ORDER[Math.floor(Math.random() * ORDER.length)];
    start({ name: 'Deneme', archetype: key, consent: false });
  } else if (e.key === 'Escape' && state !== 'idle') enterIdle();
});
window.__start = start;   // otomatik test için
window.__dbg = { ana, camera, E, get state() { return state; }, showT0: () => session?.t0 ?? 0 };

// ------------------------------------------------------------------ başlat

(async function init() {
  const r = await loadCustomSprites(builtinSprites());
  sprites = r.sprites;
  resize();
  drawQR($('idleQr'), CONFIG.quizUrl, 8);
  enterIdle();
  requestAnimationFrame(frame);
  startPromo();
  try {
    await startCamera();
    await faceTracker.setMode('face');
  } catch (e) {
    console.error(e);
    document.querySelector('#idle .cam span').textContent = 'Kamera açılamadı';
  }
  scanLoop();
  // Modelleri ısıt: ilk katılımcıda bekleme olmasın.
  try { const c = document.createElement('canvas'); c.width = 640; c.height = 480; await withTimeout(preparePortrait(c), 15000); } catch {}
})();
