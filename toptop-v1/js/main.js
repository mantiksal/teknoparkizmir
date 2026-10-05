import * as THREE from '../vendor/three/three.module.js';
import { builtinSprites, loadCustomSprites } from './objects.js';
import { AnamorphScene, analyzeTarget, textTarget, applyOffAxis } from './anamorph.js';
import { preparePortrait, HeadTracker, OneEuro } from './vision.js';
import { ARCHETYPES, ORDER } from './quiz.js';

// ------------------------------------------------------------------ ayarlar

const PRESETS = {
  laptop: {
    screenW: 30, sweetX: 0, sweetY: 6, sweetZ: 55, magnetR: 8, tracker: 'face',
    camX: 0, camYOff: 1, camPitch: 0, hfov: 60, roomDepth: 100, sMin: 0.55, sMax: 2.4,
  },
  tent: {
    screenW: 260, sweetX: 0, sweetY: 10, sweetZ: 170, magnetR: 35, tracker: 'pose',
    camX: 0, camYOff: 8, camPitch: 10, hfov: 70, roomDepth: 300, sMin: 0.5, sMax: 2.2,
  },
};
const DEFAULTS = {
  preset: 'laptop', mode: 'demo', showCam: false, mirrorPhoto: true, adaptHeight: true,
  magnet: 0.85, distScale: 1, smooth: 1, flipX: false,
  targetCount: 1100, decoy: 0.3, hero: 0.006, seed: 7, backs: true, wires: true,
  ...PRESETS.laptop,
};
const STORE = 'iyte-anamorfoz-v2';
let cfg;
try { cfg = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { cfg = { ...DEFAULTS }; }
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(cfg)); } catch {} };

// ------------------------------------------------------------------ three

const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera();
const ana = new AnamorphScene(scene);
ana.setOptions({ backs: cfg.backs, wires: cfg.wires });

let screenH = 1;
let sprites = [];
// Şu an gösterilen: { target, label, archetype, name, visitorId }
let current = null;
let analysis = null, analysisKey = '';

function rebuild() {
  if (!current || !sprites.length) return;
  const t = current.target;
  const count = Math.round(cfg.targetCount * (t.densityMul || 1));
  const key = `${current.label}|${count}`;
  if (key !== analysisKey) { analysis = analyzeTarget(t, count); analysisKey = key; }
  const arch = current.archetype ? ARCHETYPES[current.archetype] : null;
  ana.build(analysis, sprites, {
    screenW: cfg.screenW, screenH, sMin: cfg.sMin, sMax: cfg.sMax,
    decoyRatio: cfg.decoy, heroRatio: cfg.hero, seed: cfg.seed,
    archetype: current.archetype, archColor: arch?.color,
    // Arketip varsa altta başlık için yer bırak.
    portraitH: screenH * (arch ? 0.78 : 0.9), portraitY: arch ? screenH * 0.08 : 0,
  });
  ana.layout(sweetDyn);
  document.getElementById('hCount').textContent = ana.count;
}

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  screenH = cfg.screenW * innerHeight / innerWidth;
  rebuild();
}
let resizeT;
addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(resize, 150); });

// ------------------------------------------------------------------ hedef

function showThumbs(t) {
  const box = document.getElementById('thumbs');
  box.innerHTML = '';
  for (const c of [t.color, t.mask]) {
    const k = document.createElement('canvas');
    k.width = c.width; k.height = c.height;
    k.getContext('2d').drawImage(c, 0, 0);
    box.appendChild(k);
  }
}

let labelSeq = 0;
function show(next) {
  current = { ...next, label: next.label + '#' + (++labelSeq) };
  showThumbs(next.target);
  document.getElementById('archSel').value = current.archetype || '';
  setReveal();
  rebuild();
}

async function showPortraitFrom(src, extra = {}) {
  toast('Portre işleniyor…');
  const p = await preparePortrait(src, { mirror: extra.mirror ?? cfg.mirrorPhoto });
  document.getElementById('pInfo').textContent =
    `Yüz: ${p.faceFound ? 'bulundu' : 'bulunamadı (orta kırpma)'} · Arka plan: ${p.segmented ? 'silindi' : 'elips maske'}`;
  cfg.seed = (Math.random() * 1e9) | 0;
  show({
    target: p, label: 'portre', name: extra.name || '', visitorId: extra.visitorId,
    archetype: extra.archetype ?? (document.getElementById('archSel').value || null),
  });
  toast('Hazır! Sihirli noktaya geçin.', 2000);
}

function defaultTarget() {
  const t = textTarget([{ text: 'İYTE', size: 300 }, { text: 'TEKNOPARK İZMİR', size: 70 }], 1.45);
  t.densityMul = 1.2;
  show({ target: t, label: 'İYTE yazısı', archetype: null, name: '' });
  document.getElementById('pInfo').textContent = 'Varsayılan sahne: yazı. Sıradan bir katılımcı seçin ya da portre çekin.';
}

// ------------------------------------------------------------------ arketip açılışı

const reveal = document.getElementById('reveal');
let alignedFor = 0;
function setReveal() {
  const a = current?.archetype && ARCHETYPES[current.archetype];
  reveal.classList.remove('show');
  if (!a) return;
  reveal.style.setProperty('--arch', a.color);
  document.getElementById('rHello').textContent = current.name ? `${current.name}, sen bir` : 'Sen bir';
  document.getElementById('rName').innerHTML = `${a.emoji} ${a.name}<small>${a.tr.toLocaleUpperCase('tr')}</small>`;
  document.getElementById('rMotto').textContent = `“${a.motto}”`;
}
function updateReveal(align, dt) {
  if (!current?.archetype) return;
  alignedFor = align > 0.8 ? alignedFor + dt : 0;
  if (alignedFor > 0.6) reveal.classList.add('show');
  else if (align < 0.5) reveal.classList.remove('show');
}

// ------------------------------------------------------------------ sıra (stand tableti)

const queueEl = document.getElementById('queue');
let queue = [], serverOk = false;
const prepared = new Map();   // visitorId → Promise<target>

function prepareVisitor(v) {
  if (!prepared.has(v.id)) {
    const p = new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error('fotoğraf yok'));
      img.src = `api/visitors/${v.id}/photo`;
    }).then((img) => preparePortrait(img, { mirror: false }));
    p.catch(() => prepared.delete(v.id));
    prepared.set(v.id, p);
  }
  return prepared.get(v.id);
}

async function pollQueue() {
  try {
    const r = await fetch('api/visitors', { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    queue = await r.json();
    serverOk = true;
  } catch {
    serverOk = false;
  }
  renderQueue();
  // Sıradaki birkaç kişinin portresini önceden hazırla.
  for (const v of queue.filter((v) => v.status === 'waiting').slice(0, 2)) prepareVisitor(v).catch(() => {});
  setTimeout(pollQueue, 2000);
}

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function renderQueue() {
  const info = document.getElementById('qInfo');
  if (!serverOk) {
    info.textContent = 'Sunucuya bağlı değil (./start.sh ile başlatın).';
    queueEl.innerHTML = '';
    return;
  }
  const waiting = queue.filter((v) => v.status === 'waiting').length;
  info.textContent = `${waiting} kişi bekliyor · toplam ${queue.length}`;
  queueEl.innerHTML = '';
  for (const v of queue.slice(-30).reverse()) {
    const a = ARCHETYPES[v.archetype];
    const isCur = v.id === current?.visitorId;
    const b = document.createElement('button');
    b.className = 'q' + (isCur ? ' cur' : '') + (v.status === 'done' ? ' done' : '');
    b.innerHTML = `<span class="n">#${v.number}</span><span>${escapeHtml(v.name || '—')} ${a ? a.emoji : ''}</span>`
      + `<span class="st">${isCur ? 'ekranda' : v.status === 'done' ? 'tamam' : 'bekliyor'}</span>`;
    b.addEventListener('click', () => showVisitor(v));
    queueEl.appendChild(b);
  }
}

async function setStatus(id, status) {
  try {
    await fetch(`api/visitors/${id}/status`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
  } catch {}
}

async function showVisitor(v) {
  toast(`#${v.number} hazırlanıyor…`);
  try {
    const p = await prepareVisitor(v);
    if (current?.visitorId && current.visitorId !== v.id) setStatus(current.visitorId, 'done');
    cfg.seed = (Math.random() * 1e9) | 0;
    document.getElementById('pInfo').textContent =
      `#${v.number} ${v.name || ''} · Yüz: ${p.faceFound ? 'bulundu' : 'bulunamadı'} · Arka plan: ${p.segmented ? 'silindi' : 'elips'}`;
    show({ target: p, label: 'v:' + v.id, archetype: v.archetype, name: v.name, visitorId: v.id });
    setStatus(v.id, 'shown');
    toast(`#${v.number} ekranda`, 1500);
    renderQueue();
  } catch (e) {
    console.error(e);
    toast('Fotoğraf yüklenemedi: ' + e.message, 3000);
  }
}

function nextVisitor() {
  const v = queue.find((v) => v.status === 'waiting' && v.id !== current?.visitorId);
  if (v) showVisitor(v); else toast('Bekleyen katılımcı yok', 1500);
}

const purgeBtn = document.getElementById('bPurge');
let purgeT;
purgeBtn.addEventListener('click', async () => {
  if (!purgeBtn.classList.contains('arm')) {
    purgeBtn.classList.add('arm'); purgeBtn.textContent = 'Emin misiniz? Tekrar basın';
    clearTimeout(purgeT);
    purgeT = setTimeout(() => { purgeBtn.classList.remove('arm'); purgeBtn.textContent = 'Tüm verileri sil'; }, 4000);
    return;
  }
  clearTimeout(purgeT);
  purgeBtn.classList.remove('arm'); purgeBtn.textContent = 'Tüm verileri sil';
  const r = await fetch('api/visitors', { method: 'DELETE' }).catch(() => null);
  prepared.clear();
  toast(r?.ok ? 'Tüm fotoğraf ve cevaplar silindi' : 'Silinemedi', 2500);
  if (current?.visitorId) defaultTarget();
});
document.getElementById('bNext').addEventListener('click', nextVisitor);

// ------------------------------------------------------------------ kamera

const video = document.getElementById('cam');
let streamPromise = null;
function ensureCamera() {
  return (streamPromise ??= navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' }, audio: false,
  }).then(async (s) => { video.srcObject = s; await video.play(); return s; })
    .catch((e) => { streamPromise = null; toast('Kamera açılamadı: ' + e.message, 4000); throw e; }));
}

const overlay = document.getElementById('overlay');
async function capture() {
  await ensureCamera();
  document.getElementById('camwrap').classList.add('show');
  for (const n of [3, 2, 1]) {
    overlay.textContent = n; overlay.classList.add('show');
    await new Promise((r) => setTimeout(r, 800));
  }
  overlay.classList.remove('show');
  const flash = document.getElementById('flash');
  flash.style.transition = 'none'; flash.style.opacity = 1;
  const snap = document.createElement('canvas');
  snap.width = video.videoWidth; snap.height = video.videoHeight;
  snap.getContext('2d').drawImage(video, 0, 0);
  requestAnimationFrame(() => { flash.style.transition = 'opacity .5s'; flash.style.opacity = 0; });
  if (!cfg.showCam) document.getElementById('camwrap').classList.remove('show');
  await showPortraitFrom(snap);
}

// ------------------------------------------------------------------ göz konumu

const tracker = new HeadTracker();
const filters = [new OneEuro(), new OneEuro(), new OneEuro()];
let trackerReady = false, trackerLoading = false;
let lastSeen = -1e9, trackFps = 0, trackFrames = 0, trackT0 = performance.now();

async function ensureTracker() {
  if (trackerLoading) return;
  trackerLoading = true; trackerReady = false;
  try {
    await ensureCamera();
    await tracker.setMode(cfg.tracker);
    trackerReady = true;
  } catch (e) {
    console.error(e);
    toast('Takip başlatılamadı: ' + e.message, 4000);
  } finally {
    trackerLoading = false;
  }
}

const sweet = () => new THREE.Vector3(cfg.sweetX, cfg.sweetY, cfg.sweetZ);
const sweetDyn = sweet();
const eye = new THREE.Vector3().copy(sweetDyn).add(new THREE.Vector3(-20, 0, 40));
const eyeTarget = eye.clone();
const mouse = { x: 0.5, y: 0.5, z: 1 };

function camToWorld(p) {
  const a = cfg.camPitch * Math.PI / 180;
  const x = p.x * cfg.distScale, y = p.y * cfg.distScale, z = p.z * cfg.distScale;
  return new THREE.Vector3(
    cfg.camX + (cfg.flipX ? x : -x),
    screenH / 2 + cfg.camYOff + y * Math.cos(a) - z * Math.sin(a),
    y * Math.sin(a) + z * Math.cos(a),
  );
}

const ease = (t) => t * t * (3 - 2 * t);
function demoEye(t) {
  const S = sweet(), z = cfg.sweetZ;
  const A = new THREE.Vector3(S.x - 0.45 * z, S.y + 0.04 * z, z * 1.65);
  const B = new THREE.Vector3(S.x + 0.3 * z, S.y + 0.02 * z, z * 1.3);
  const D = new THREE.Vector3(S.x + 0.35 * z, S.y - 0.03 * z, z * 0.85);
  const keys = [[0, A], [5, B], [8.5, S], [13, S], [16, D], [20, A]];
  const T = keys[keys.length - 1][0];
  const tt = t % T;
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, p0] = keys[i], [t1, p1] = keys[i + 1];
    if (tt <= t1) return p0.clone().lerp(p1, ease((tt - t0) / (t1 - t0)));
  }
  return A;
}

function idleEye(t) {
  const z = cfg.sweetZ;
  return new THREE.Vector3(cfg.sweetX + Math.sin(t * 0.25) * 0.45 * z, cfg.sweetY + Math.sin(t * 0.17) * 0.06 * z, z * 1.5);
}

canvas.addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth; mouse.y = e.clientY / innerHeight; });
canvas.addEventListener('wheel', (e) => { mouse.z = Math.min(3, Math.max(0.3, mouse.z * (1 + e.deltaY * 0.001))); });

function updateEye(t, dt) {
  let status = '–';
  if (cfg.mode === 'demo') {
    eyeTarget.copy(demoEye(t));
    status = 'yok (demo)';
  } else if (cfg.mode === 'mouse') {
    const z = cfg.sweetZ;
    eyeTarget.set(cfg.sweetX + (mouse.x - 0.5) * 1.2 * z, cfg.sweetY + (0.5 - mouse.y) * 0.5 * z, z * mouse.z);
    status = 'yok (fare · tekerlek = mesafe)';
  } else {
    if (!trackerReady) {
      ensureTracker();
      status = trackerLoading ? 'yükleniyor…' : 'hazır değil';
    } else {
      const p = tracker.detect(video, cfg.hfov);
      if (p) {
        const w = camToWorld(p);
        for (const f of filters) { f.minCutoff = cfg.smooth; f.beta = 0.02; }
        eyeTarget.set(filters[0].filter(w.x, t), filters[1].filter(w.y, t), filters[2].filter(w.z, t));
        lastSeen = t;
        trackFrames++;
      } else if (p === null && t - lastSeen > 0.2) {
        filters.forEach((f) => f.reset());
      }
      const now = performance.now();
      if (now - trackT0 > 1000) { trackFps = trackFrames * 1000 / (now - trackT0); trackFrames = 0; trackT0 = now; }
      const seen = t - lastSeen < 0.6;
      if (!seen) eyeTarget.lerp(idleEye(t), 1 - Math.exp(-dt * 1.5));
      status = seen ? `kişi var · ${trackFps.toFixed(0)} Hz` : 'kimse yok (bekleme)';
      updateCamDot();
    }
  }
  eye.lerp(eyeTarget, 1 - Math.exp(-dt * (cfg.mode === 'track' ? 14 : 30)));

  // Boy uyarlama: sihirli noktanın yüksekliği, takip edilen kişinin göz hizasına yavaşça uyar.
  const wantY = cfg.mode === 'track' && cfg.adaptHeight && t - lastSeen < 0.6 ? eye.y : cfg.sweetY;
  sweetDyn.set(cfg.sweetX, sweetDyn.y + (wantY - sweetDyn.y) * (1 - Math.exp(-dt / 1.2)), cfg.sweetZ);
  return status;
}

function updateCamDot() {
  const dot = document.getElementById('camdot');
  if (!tracker.debug) { dot.style.display = 'none'; return; }
  dot.style.display = 'block';
  dot.style.left = (1 - tracker.debug.u) * 100 + '%';
  dot.style.top = tracker.debug.v * 100 + '%';
}

// ------------------------------------------------------------------ minimap

const mm = document.getElementById('minimap');
const mg = mm.getContext('2d');
function drawMinimap(v) {
  const W = mm.width, H = mm.height, pad = 30;
  const depth = Math.max(cfg.roomDepth, cfg.sweetZ * 1.8);
  const span = Math.max(cfg.screenW * 1.15, depth);
  const k = (W - pad * 2) / span;
  const X = (x) => W / 2 + x * k, Z = (z) => pad + z * k;
  mg.clearRect(0, 0, W, H);
  mg.font = '20px system-ui'; mg.fillStyle = '#8b8b98';
  mg.fillText('üstten görünüm', 14, H - 12);
  if (cfg.preset === 'tent') {
    mg.strokeStyle = '#2c2c34'; mg.lineWidth = 2;
    mg.strokeRect(X(-150), Z(0), 300 * k, 300 * k);
    mg.fillStyle = '#8b8b98'; mg.fillText('kapı', X(0) - 20, Z(300) + 22);
  }
  mg.strokeStyle = 'rgba(255,106,61,0.25)'; mg.lineWidth = 2;
  mg.beginPath(); mg.moveTo(X(v.x), Z(v.z)); mg.lineTo(X(-cfg.screenW / 2), Z(0));
  mg.moveTo(X(v.x), Z(v.z)); mg.lineTo(X(cfg.screenW / 2), Z(0)); mg.stroke();
  mg.strokeStyle = '#ff6a3d'; mg.lineWidth = 6;
  mg.beginPath(); mg.moveTo(X(-cfg.screenW / 2), Z(0)); mg.lineTo(X(cfg.screenW / 2), Z(0)); mg.stroke();
  mg.strokeStyle = '#3ddc84'; mg.lineWidth = 2; mg.setLineDash([6, 6]);
  mg.beginPath(); mg.arc(X(cfg.sweetX), Z(cfg.sweetZ), cfg.magnetR * k, 0, Math.PI * 2); mg.stroke();
  mg.setLineDash([]);
  mg.fillStyle = '#3ddc84'; mg.beginPath(); mg.arc(X(cfg.sweetX), Z(cfg.sweetZ), 6, 0, Math.PI * 2); mg.fill();
  mg.fillStyle = '#fff'; mg.beginPath(); mg.arc(X(v.x), Z(v.z), 9, 0, Math.PI * 2); mg.fill();
}

// ------------------------------------------------------------------ döngü

const hud = {
  mode: document.getElementById('hMode'), eye: document.getElementById('hEye'),
  track: document.getElementById('hTrack'), fps: document.getElementById('hFps'),
  align: document.querySelector('#align > div'),
};
const MODE_NAMES = { demo: 'otomatik demo', mouse: 'fare', track: 'kamera takibi' };
let last = performance.now(), fpsAcc = 0, fpsN = 0, hudT = 0;
const virt = new THREE.Vector3();

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  const t = now / 1000;
  const status = updateEye(t, dt);

  ana.layout(sweetDyn);

  // Mıknatıs: sihirli noktaya yaklaşınca sanal göz tam noktaya çekilir,
  // böylece takip titremesine rağmen portre net ve sabit oturur.
  const d = eye.distanceTo(sweetDyn);
  const R = Math.max(1, cfg.magnetR);
  const x = Math.min(1, Math.max(0, (d - R * 0.35) / (R * 0.65)));
  const w = cfg.magnet * (1 - ease(x));
  virt.copy(eye).lerp(sweetDyn, w);

  applyOffAxis(camera, virt, cfg.screenW, screenH);
  renderer.render(scene, camera);

  const al = Math.max(0, 1 - virt.distanceTo(sweetDyn) / (R * 2.5));
  updateReveal(al, dt);

  fpsAcc += dt; fpsN++;
  if ((hudT += dt) > 0.2) {
    hudT = 0;
    let who = '';
    if (current?.visitorId) who = `#${queue.find((v) => v.id === current.visitorId)?.number ?? ''} ${current.name || ''}`;
    else if (current) who = current.label.split('#')[0];
    hud.mode.textContent = MODE_NAMES[cfg.mode] + ' · ' + who;
    hud.eye.textContent = `x ${virt.x.toFixed(0)}  y ${virt.y.toFixed(0)}  z ${virt.z.toFixed(0)} cm`;
    hud.track.textContent = status;
    hud.fps.textContent = (fpsN / fpsAcc).toFixed(0);
    fpsAcc = 0; fpsN = 0;
    hud.align.style.width = (al * 100).toFixed(0) + '%';
    drawMinimap(virt);
  }
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ arayüz

let toastT;
function toast(msg, ms = 0) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.style.display = 'block';
  clearTimeout(toastT);
  if (ms) toastT = setTimeout(() => (el.style.display = 'none'), ms);
}

const REBUILD_KEYS = new Set(['targetCount', 'sMin', 'sMax', 'decoy', 'hero']);
function syncInputs() {
  for (const el of document.querySelectorAll('[data-k]')) {
    const v = cfg[el.dataset.k];
    if (el.type === 'checkbox') el.checked = !!v; else el.value = v;
  }
  for (const el of document.querySelectorAll('[data-v]')) {
    const k = el.dataset.v;
    el.textContent = k === 'targetCount' ? cfg[k] : (+cfg[k]).toFixed(k === 'hero' ? 3 : 2);
  }
  for (const b of document.querySelectorAll('#modes button')) b.classList.toggle('on', b.dataset.mode === cfg.mode);
  document.getElementById('camwrap').classList.toggle('show', !!cfg.showCam);
}

function onSetting(k) {
  if (k === 'preset') {
    Object.assign(cfg, PRESETS[cfg.preset]);
    sweetDyn.copy(sweet());
    resize();
    if (trackerReady) ensureTracker();
  } else if (k === 'tracker') {
    if (cfg.mode === 'track') ensureTracker();
  } else if (k === 'showCam') {
    if (cfg.showCam) ensureCamera().catch(() => {});
  } else if (k === 'screenW') {
    resize();
  } else if (k === 'backs' || k === 'wires') {
    ana.setOptions({ backs: cfg.backs, wires: cfg.wires });
  } else if (REBUILD_KEYS.has(k)) {
    clearTimeout(onSetting.t); onSetting.t = setTimeout(rebuild, 150);
  } else if (['sweetX', 'sweetY', 'sweetZ'].includes(k)) {
    sweetDyn.copy(sweet());
  }
  save(); syncInputs();
}

for (const el of document.querySelectorAll('[data-k]')) {
  el.addEventListener('input', () => {
    const k = el.dataset.k;
    cfg[k] = el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' ? el.value : parseFloat(el.value);
    if (Number.isNaN(cfg[k])) return;
    onSetting(k);
  });
}

const archSel = document.getElementById('archSel');
for (const k of ORDER) {
  const o = document.createElement('option');
  o.value = k; o.textContent = `${ARCHETYPES[k].emoji} ${ARCHETYPES[k].name}`;
  archSel.appendChild(o);
}
archSel.addEventListener('change', () => {
  if (!current) return;
  current.archetype = archSel.value || null;
  setReveal();
  rebuild();
});

function setMode(m) {
  cfg.mode = m; save(); syncInputs();
  if (m === 'track') ensureTracker();
}
for (const b of document.querySelectorAll('#modes button')) b.addEventListener('click', () => setMode(b.dataset.mode));

document.getElementById('bCapture').addEventListener('click', () => capture().catch(console.error));
document.getElementById('bUpload').addEventListener('click', () => document.getElementById('file').click());
document.getElementById('bText').addEventListener('click', defaultTarget);
document.getElementById('file').addEventListener('change', async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const img = new Image();
  img.src = URL.createObjectURL(f);
  await img.decode();
  await showPortraitFrom(img, { mirror: false });
  e.target.value = '';
});

addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.key === 'h' || e.key === 'H') document.body.classList.toggle('clean');
  else if (e.key === 'f' || e.key === 'F') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  else if (e.key === '1') setMode('demo');
  else if (e.key === '2') setMode('mouse');
  else if (e.key === '3') setMode('track');
  else if (e.key === 'n' || e.key === 'N') nextVisitor();
  else if (e.key === 'r' || e.key === 'R') { cfg.seed = (Math.random() * 1e9) | 0; save(); rebuild(); }
  else if (e.code === 'Space') { e.preventDefault(); capture().catch(console.error); }
});

// ------------------------------------------------------------------ başlat

(async function init() {
  syncInputs();
  sweetDyn.copy(sweet());
  const r = await loadCustomSprites(builtinSprites());
  sprites = r.sprites;
  const custom = r.loaded.length ? ` · Eklenen: ${r.loaded.join(', ')}` : ' · Özel görsel yok (assets/objects/)';
  document.getElementById('objInfo').textContent = `${sprites.length} obje tipi${custom}`;
  renderer.setSize(innerWidth, innerHeight, false);
  screenH = cfg.screenW * innerHeight / innerWidth;
  defaultTarget();
  if (cfg.mode === 'track') ensureTracker();
  if (cfg.showCam) ensureCamera().catch(() => {});
  pollQueue();
  requestAnimationFrame(frame);
})();
