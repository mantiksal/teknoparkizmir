// Stand tableti: KVKK onayı → isim → test → fotoğraf → sıra numarası.
import { QUESTIONS, ORDER, score } from './quiz.js';

const $ = (id) => document.getElementById(id);
const state = { name: '', answers: [], q: 0, photo: null, order: [] };

function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('on', s.id === id);
  if (id !== 'sPhoto') stopCamera();
  if (id === 'sPhoto') initPhoto();
  touch();
}
for (const b of document.querySelectorAll('[data-go]')) b.addEventListener('click', () => show(b.dataset.go));

// Hareketsiz kalınca başa dön (yarıda bırakılan katılım).
let idleT;
function touch() {
  clearTimeout(idleT);
  idleT = setTimeout(reset, 120000);
}
addEventListener('pointerdown', touch);

function reset() {
  Object.assign(state, { name: '', answers: [], q: 0, photo: null });
  $('consent').checked = false; $('consentNext').disabled = true; $('name').value = '';
  show('sWelcome');
}

// ------------------------------------------------------------ onay & isim
$('consent').addEventListener('change', (e) => { $('consentNext').disabled = !e.target.checked; });
$('consentNext').addEventListener('click', () => show('sName'));
$('nameNext').addEventListener('click', () => {
  state.name = $('name').value.trim();
  state.answers = []; state.q = 0;
  // Cevap sırası her soru için karıştırılır; A=hep aynı arketip örüntüsü fark edilmez.
  state.order = QUESTIONS.map(() => ORDER.map((_, i) => i).sort(() => Math.random() - 0.5));
  renderQ(); show('sQuiz');
});
$('name').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('nameNext').click(); });

// ------------------------------------------------------------ test
function renderQ() {
  const i = state.q, Q = QUESTIONS[i];
  $('prog').style.width = (i / QUESTIONS.length * 100) + '%';
  $('qnum').textContent = `Soru ${i + 1} / ${QUESTIONS.length}`;
  $('back').style.visibility = i ? 'visible' : 'hidden';
  $('qtext').textContent = Q.q;
  const box = $('answers');
  box.innerHTML = '';
  for (const k of state.order[i]) {
    const b = document.createElement('button');
    b.className = 'answer';
    b.textContent = Q.a[k];
    if (state.answers[i] === ORDER[k]) b.classList.add('picked');
    b.addEventListener('click', () => {
      b.classList.add('picked');
      state.answers[i] = ORDER[k];
      setTimeout(() => {
        if (state.q < QUESTIONS.length - 1) { state.q++; renderQ(); }
        else show('sPhoto');
      }, 220);
    });
    box.appendChild(b);
  }
}
$('back').addEventListener('click', () => { if (state.q > 0) { state.q--; renderQ(); } });

// ------------------------------------------------------------ fotoğraf
// Güvenli bağlamda (localhost/https) canlı kamera; tablette (yerel ağ, http)
// cihazın kendi kamera uygulaması (input capture) kullanılır.
let stream = null;
const live = window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;

function stopCamera() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
}

function buttons(list) {
  const row = $('photoBtns');
  row.innerHTML = '';
  for (const [label, fn, ghost] of list) {
    const b = document.createElement('button');
    b.className = 'btn' + (ghost ? ' ghost' : '');
    b.textContent = label;
    b.addEventListener('click', fn);
    row.appendChild(b);
  }
}

async function initPhoto() {
  state.photo = null;
  $('perr').textContent = '';
  const box = $('photoBox');
  if (live) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } } });
      box.innerHTML = '<video autoplay playsinline muted></video><div class="guide"></div>';
      box.querySelector('video').srcObject = stream;
      buttons([['Fotoğrafı çek', snap], ['Dosyadan seç', () => $('file').click(), true]]);
      return;
    } catch (e) {
      console.warn('Kamera açılamadı, dosya seçimine geçiliyor', e);
    }
  }
  box.innerHTML = '<span>Yüzün kadrede, omuzların görünür olsun</span>';
  buttons([['Kamerayı aç', () => $('file').click()]]);
}

async function snap() {
  const box = $('photoBox'), video = box.querySelector('video');
  const c = document.createElement('div');
  c.className = 'count'; box.appendChild(c);
  for (const n of [3, 2, 1]) { c.textContent = n; await new Promise((r) => setTimeout(r, 800)); }
  c.remove();
  const cv = document.createElement('canvas');
  cv.width = video.videoWidth; cv.height = video.videoHeight;
  const g = cv.getContext('2d');
  g.translate(cv.width, 0); g.scale(-1, 1);   // önizlemedeki gibi aynalı
  g.drawImage(video, 0, 0);
  stopCamera();
  setPhoto(cv);
}

$('file').addEventListener('change', async (e) => {
  const f = e.target.files?.[0];
  e.target.value = '';
  if (!f) return;
  const img = new Image();
  img.src = URL.createObjectURL(f);
  try { await img.decode(); } catch { $('perr').textContent = 'Fotoğraf okunamadı, tekrar dene.'; return; }
  stopCamera();
  setPhoto(img);
});

function setPhoto(src) {
  const w = src.naturalWidth || src.width, h = src.naturalHeight || src.height;
  const k = Math.min(1, 1600 / Math.max(w, h));
  const cv = document.createElement('canvas');
  cv.width = Math.round(w * k); cv.height = Math.round(h * k);
  cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
  state.photo = cv.toDataURL('image/jpeg', 0.9);
  $('photoBox').innerHTML = `<img src="${state.photo}" alt="">`;
  buttons([['Gönder', submit], ['Tekrar çek', initPhoto, true]]);
}

async function submit() {
  const btn = $('photoBtns').querySelector('.btn');
  btn.disabled = true; btn.textContent = 'Gönderiliyor…';
  const { result, scores } = score(state.answers);
  try {
    const r = await fetch('api/visitors', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consent: true, name: state.name, archetype: result, scores, answers: state.answers, photo: state.photo }),
    });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
    const v = await r.json();
    $('ticket').textContent = v.number;
    $('doneName').textContent = state.name ? ', ' + state.name : '';
    show('sDone');
    setTimeout(() => { if ($('sDone').classList.contains('on')) reset(); }, 20000);
  } catch (e) {
    $('perr').textContent = 'Gönderilemedi (' + e.message + '). Bağlantıyı kontrol edip tekrar dene.';
    btn.disabled = false; btn.textContent = 'Gönder';
  }
}

$('again').addEventListener('click', reset);
touch();
