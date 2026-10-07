// Telefon testi: ad + onay → 8 soru → arketip + stand ekranına gösterilecek QR.
import { QUESTIONS, ORDER, ARCHETYPES, score } from './quiz-data.js';
import { encodeToken } from './token.js';

const $ = (id) => document.getElementById(id);
const STORE = 'ttz-quiz-v1';
const state = { name: '', consent: false, answers: [], q: 0, order: [] };

function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('on', s.id === id);
  scrollTo(0, 0);
}

// ------------------------------------------------------------ başlangıç
const validate = () => { $('start').disabled = !($('name').value.trim() && $('consent').checked); };
$('name').addEventListener('input', validate);
$('consent').addEventListener('change', validate);
$('name').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !$('start').disabled) $('start').click(); });

$('start').addEventListener('click', () => {
  state.name = $('name').value.trim().replace(/\s+/g, ' ');
  state.consent = true;
  state.answers = []; state.q = 0;
  // Cevap sırası her soruda karışık: "hep C" örüntüsü fark edilmesin.
  state.order = QUESTIONS.map(() => shuffle(ORDER.map((_, i) => i)));
  renderQ(); show('sQuiz');
});

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ------------------------------------------------------------ sorular
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
      for (const o of box.children) o.classList.remove('picked');
      b.classList.add('picked');
      state.answers[i] = ORDER[k];
      setTimeout(() => {
        if (state.q < QUESTIONS.length - 1) { state.q++; renderQ(); scrollTo(0, 0); }
        else finish();
      }, 200);
    });
    box.appendChild(b);
  }
}
$('back').addEventListener('click', () => { if (state.q > 0) { state.q--; renderQ(); } });

// ------------------------------------------------------------ sonuç
function finish() {
  const { result, scores } = score(state.answers);
  const res = { name: state.name, archetype: result, scores, consent: state.consent };
  try { localStorage.setItem(STORE, JSON.stringify(res)); } catch {}
  renderResult(res);
}

function renderResult(res) {
  const a = ARCHETYPES[res.archetype];
  document.documentElement.style.setProperty('--arch', a.color);
  $('rEmoji').textContent = a.emoji;
  $('rName').textContent = a.name;
  $('rTr').textContent = a.tr;
  $('rMotto').textContent = `“${a.motto}”`;
  $('rText').textContent = `${res.name}, ${a.text.charAt(0).toLocaleLowerCase('tr')}${a.text.slice(1)}`;
  $('rStrength').textContent = a.strength;
  $('rCaution').textContent = a.caution;

  const max = Math.max(...Object.values(res.scores), 1);
  $('rBars').innerHTML = ORDER.map((k) =>
    `<div class="bar"><span>${ARCHETYPES[k].emoji}</span><div><i style="width:${res.scores[k] / max * 100}%"></i></div><span>${res.scores[k]}</span></div>`).join('');

  // QR: düzeltme seviyesi M, parlayan ekranlarda okunabilir ve yeterince küçük.
  const qr = window.qrcode(0, 'M');
  qr.addData(encodeToken(res), 'Byte');
  qr.make();
  const n = qr.getModuleCount(), cell = 10, quiet = 4;
  const c = document.createElement('canvas');
  c.width = c.height = (n + quiet * 2) * cell;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#000';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) g.fillRect((k + quiet) * cell, (r + quiet) * cell, cell, cell);
  $('qr').replaceChildren(c);
  show('sResult');
}

$('restart').addEventListener('click', () => {
  try { localStorage.removeItem(STORE); } catch {}
  $('name').value = state.name; $('consent').checked = false; validate();
  show('sStart');
});

// Sayfa yenilenirse sonuç kaybolmasın.
try {
  const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
  if (saved && ARCHETYPES[saved.archetype]) { state.name = saved.name; renderResult(saved); }
} catch {}
