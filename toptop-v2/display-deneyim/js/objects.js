// Obje kütüphanesi.
//
// Yerleşik objeler "kanal kodlu" çizilir; böylece her obje portredeki rengine
// boyanırken kendi kimliğini (beyaz sayfa, siyah yazı, metal parça…) korur:
//   R kanalı: ana gövde   → örnek rengiyle boyanır
//   B kanalı: ikincil yüz → örnek renginin koyu tonuyla boyanır
//   G kanalı: sabit detay → gri tonu olduğu gibi kalır
// Her objenin etrafına koyu bir dış çizgi eklenir; objeler birbirinden ayrışır.
// Gerçek logolar / fotoğraflar (assets/objects/) doğal renkleriyle kullanılır.

const S = 256;
const TAU = Math.PI * 2;
const OUTLINE = 5;

const T = (s = 1) => `rgb(${Math.round(s * 255)},0,0)`;
const A = (s = 1) => `rgb(0,0,${Math.round(s * 255)})`;
const F = (v) => `rgb(0,${Math.round(v * 255)},0)`;

function canvas(size = S) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.lineCap = 'round';
  g.lineJoin = 'round';
  return [c, g];
}
const circle = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); };
const rrect = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
const fill = (g, c) => { g.fillStyle = c; g.fill(); };
const stroke = (g, c, w) => { g.strokeStyle = c; g.lineWidth = w; g.stroke(); };
const line = (g, pts, c, w) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); stroke(g, c, w); };
const cut = (g, fn) => { g.save(); g.globalCompositeOperation = 'destination-out'; fn(); g.fill(); g.restore(); };
const text = (g, s, x, y, size, c, font = 'system-ui, -apple-system, sans-serif', weight = 900) => {
  g.fillStyle = c; g.font = `${weight} ${size}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y);
};

// ------------------------------------------------------------ akademik

const DRAW = {
  book(g) {
    rrect(g, 58, 24, 146, 208, 10); fill(g, T());
    g.fillStyle = A(); g.fillRect(58, 24, 26, 208);
    g.fillStyle = F(0.95); g.fillRect(196, 32, 8, 192);
    g.fillStyle = F(0.92); g.fillRect(104, 62, 78, 14); g.fillRect(104, 86, 56, 9);
  },
  books(g) {
    [[30, 50, 42, 184, T()], [74, 28, 48, 206, A()], [124, 60, 38, 174, T(0.8)], [164, 38, 54, 196, A()]].forEach(([x, y, w, h, c]) => {
      rrect(g, x, y, w, h, 5); fill(g, c);
      g.fillStyle = F(0.9); g.fillRect(x + 6, y + 22, w - 12, 7); g.fillRect(x + 6, y + h - 32, w - 12, 7);
    });
  },
  openBook(g) {
    g.beginPath(); g.moveTo(128, 70); g.quadraticCurveTo(76, 44, 12, 60); g.lineTo(12, 214);
    g.quadraticCurveTo(76, 198, 128, 224); g.quadraticCurveTo(180, 198, 244, 214); g.lineTo(244, 60);
    g.quadraticCurveTo(180, 44, 128, 70); fill(g, T());
    g.beginPath(); g.moveTo(128, 80); g.quadraticCurveTo(80, 56, 24, 70); g.lineTo(24, 200);
    g.quadraticCurveTo(80, 186, 128, 210); g.quadraticCurveTo(176, 186, 232, 200); g.lineTo(232, 70);
    g.quadraticCurveTo(176, 56, 128, 80); fill(g, F(0.96));
    for (let i = 0; i < 5; i++) {
      const y = 100 + i * 20;
      line(g, [[42, y], [112, y + 6]], F(0.55), 5); line(g, [[214, y], [144, y + 6]], F(0.55), 5);
    }
    line(g, [[128, 80], [128, 210]], F(0.35), 5);
  },
  mortarboard(g) {
    g.beginPath(); g.moveTo(64, 118); g.lineTo(64, 180); g.quadraticCurveTo(128, 214, 192, 180); g.lineTo(192, 118); fill(g, A());
    poly(g, [[128, 44], [246, 104], [128, 164], [10, 104]]); fill(g, T());
    line(g, [[128, 104], [214, 124], [214, 188]], F(0.85), 7);
    rrect(g, 204, 184, 20, 40, 4); fill(g, F(0.85));
    circle(g, 128, 104, 10); fill(g, F(0.15));
  },
  flask(g) {
    const body = () => { g.beginPath(); g.moveTo(102, 26); g.lineTo(154, 26); g.lineTo(154, 96); g.lineTo(224, 214);
      g.quadraticCurveTo(230, 234, 208, 234); g.lineTo(48, 234); g.quadraticCurveTo(26, 234, 32, 214); g.lineTo(102, 96); g.closePath(); };
    body(); fill(g, F(0.9));
    g.save(); body(); g.clip(); g.fillStyle = T(); g.fillRect(0, 150, S, S);
    circle(g, 100, 194, 11); fill(g, F(0.97)); circle(g, 142, 178, 8); fill(g, F(0.97)); circle(g, 120, 210, 6); fill(g, F(0.97));
    g.restore();
    rrect(g, 94, 18, 68, 16, 4); fill(g, F(0.6));
    line(g, [[118, 46], [118, 88]], F(1), 6);
  },
  testTubes(g) {
    [[44, 46, T()], [106, 26, A()], [168, 54, T(0.8)]].forEach(([x, y, c]) => {
      rrect(g, x, y, 42, 210 - y, [4, 4, 21, 21]); fill(g, F(0.9));
      rrect(g, x + 6, 140, 30, 64 - (y - 26) * 0.1, [2, 2, 15, 15]); fill(g, c);
      g.fillStyle = F(0.55); g.fillRect(x - 4, y - 6, 50, 12);
    });
    rrect(g, 24, 118, 208, 14, 4); fill(g, F(0.35));
  },
  atom(g) {
    for (const a of [0, 60, 120]) {
      g.save(); g.translate(128, 128); g.rotate(a * Math.PI / 180);
      g.beginPath(); g.ellipse(0, 0, 112, 40, 0, 0, TAU); stroke(g, T(), 16);
      g.restore();
    }
    circle(g, 128, 128, 28); fill(g, A());
    circle(g, 120, 120, 9); fill(g, F(0.95));
    circle(g, 240, 128, 12); fill(g, F(0.95));
  },
  bulb(g) {
    circle(g, 128, 98, 82); fill(g, T());
    poly(g, [[78, 150], [96, 178], [160, 178], [178, 150]]); fill(g, T());
    g.beginPath(); g.arc(128, 98, 60, Math.PI * 1.1, Math.PI * 1.4); stroke(g, F(1), 10);
    rrect(g, 94, 176, 68, 52, 8); fill(g, F(0.6));
    line(g, [[94, 192], [162, 192]], F(0.3), 6); line(g, [[94, 208], [162, 208]], F(0.3), 6);
    line(g, [[110, 162], [110, 112], [120, 96], [136, 112], [146, 96], [146, 162]], F(0.95), 6);
  },
  gear(g) {
    g.beginPath();
    const n = 10;
    for (let i = 0; i < n * 2; i++) g.arc(128, 128, i % 2 ? 94 : 120, (i / (n * 2)) * TAU, ((i + 1) / (n * 2)) * TAU);
    g.closePath(); fill(g, T());
    circle(g, 128, 128, 68); fill(g, A());
    circle(g, 128, 128, 44); fill(g, F(0.75));
    cut(g, () => circle(g, 128, 128, 26));
  },
  dna(g) {
    const pts = (ph) => { const p = []; for (let x = 12; x <= 244; x += 4) p.push([x, 128 + Math.sin(x / 34 + ph) * 64]); return p; };
    const a = pts(0), b = pts(Math.PI);
    for (let i = 3; i < a.length; i += 6) line(g, [a[i], b[i]], F(0.92), 9);
    line(g, a, T(), 20);
    line(g, b, A(), 20);
  },
  magnifier(g) {
    line(g, [[160, 160], [230, 230]], A(), 36);
    circle(g, 104, 104, 76); fill(g, T(0.75));
    circle(g, 104, 104, 78); stroke(g, F(0.25), 22);
    g.beginPath(); g.arc(104, 104, 48, Math.PI * 1.08, Math.PI * 1.45); stroke(g, F(1), 11);
  },
  pencil(g) {
    g.fillStyle = T(); g.fillRect(40, 98, 160, 60);
    g.fillStyle = A(); g.fillRect(40, 98, 160, 18);
    poly(g, [[200, 98], [248, 128], [200, 158]]); fill(g, F(0.85));
    poly(g, [[232, 118], [248, 128], [232, 138]]); fill(g, F(0.1));
    g.fillStyle = F(0.7); g.fillRect(22, 98, 22, 60);
    rrect(g, 6, 98, 22, 60, [10, 0, 0, 10]); fill(g, A());
  },
  ruler(g) {
    rrect(g, 8, 92, 240, 72, 6); fill(g, T());
    for (let x = 20; x < 240; x += 11) line(g, [[x, 92], [x, (x - 20) % 55 ? 112 : 128]], F(0.08), 4);
    text(g, '0  5  10  15', 128, 146, 20, F(0.15), 'system-ui', 700);
  },
  setSquare(g) {
    poly(g, [[22, 236], [22, 20], [238, 236]]); fill(g, T());
    cut(g, () => poly(g, [[64, 196], [64, 118], [142, 196]]));
    for (let y = 34; y < 230; y += 14) line(g, [[22, y], [(y - 34) % 28 ? 36 : 46, y]], F(0.08), 4);
  },
  globe(g) {
    circle(g, 128, 112, 98); fill(g, T());
    g.beginPath(); g.ellipse(100, 90, 34, 44, -0.4, 0, TAU); fill(g, A());
    g.beginPath(); g.ellipse(160, 150, 30, 22, 0.3, 0, TAU); fill(g, A());
    for (const rx of [34, 70]) { g.beginPath(); g.ellipse(128, 112, rx, 98, 0, 0, TAU); stroke(g, F(0.85), 4); }
    g.beginPath(); g.arc(128, 112, 114, Math.PI * 0.15, Math.PI * 0.85); stroke(g, F(0.3), 12);
    g.fillStyle = F(0.3); g.fillRect(118, 226, 20, 12); rrect(g, 76, 234, 104, 16, 7); fill(g, F(0.3));
  },
  microscope(g) {
    rrect(g, 42, 214, 176, 28, 8); fill(g, F(0.2));
    g.beginPath(); g.arc(120, 140, 72, -Math.PI * 0.35, Math.PI * 0.5); stroke(g, A(), 32);
    g.fillStyle = F(0.25); g.fillRect(66, 150, 116, 14);
    g.save(); g.translate(106, 92); g.rotate(-0.5);
    rrect(g, -24, -86, 48, 134, 8); fill(g, T());
    g.fillStyle = F(0.3); g.fillRect(-30, -98, 60, 18); g.fillStyle = F(0.85); g.fillRect(-14, 48, 28, 24);
    g.restore();
    circle(g, 178, 140, 18); fill(g, F(0.8));
  },
  scroll(g) {
    g.save(); g.translate(128, 120); g.rotate(-0.45);
    rrect(g, -112, -38, 224, 76, 12); fill(g, F(0.95));
    g.beginPath(); g.ellipse(-112, 0, 17, 38, 0, 0, TAU); fill(g, F(0.75));
    g.beginPath(); g.ellipse(112, 0, 17, 38, 0, 0, TAU); fill(g, F(0.75));
    g.fillStyle = T(); g.fillRect(-12, -38, 24, 76);
    g.restore();
    poly(g, [[128, 140], [104, 216], [128, 200], [152, 216]]); fill(g, T());
    circle(g, 128, 132, 24); fill(g, A());
  },
  laptop(g) {
    rrect(g, 48, 44, 160, 118, 9); fill(g, T());
    g.fillStyle = F(0.12); g.fillRect(60, 56, 136, 92);
    g.fillStyle = F(0.7); g.fillRect(72, 72, 64, 8); g.fillRect(72, 90, 96, 8); g.fillRect(72, 108, 44, 8);
    poly(g, [[36, 168], [220, 168], [248, 208], [8, 208]]); fill(g, A());
    g.fillStyle = F(0.6); g.fillRect(104, 188, 48, 8);
  },
  turbine(g) {
    poly(g, [[120, 112], [136, 112], [146, 248], [110, 248]]); fill(g, F(0.92));
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + i * TAU / 3 + 0.3;
      line(g, [[128, 104], [128 + Math.cos(a) * 104, 104 + Math.sin(a) * 104]], T(), 24);
    }
    circle(g, 128, 104, 20); fill(g, A());
  },
  chip(g) {
    for (let i = 0; i < 5; i++) {
      const p = 72 + i * 28;
      line(g, [[p, 18], [p, 238]], F(0.8), 10); line(g, [[18, p], [238, p]], F(0.8), 10);
    }
    rrect(g, 46, 46, 164, 164, 14); fill(g, F(0.12));
    rrect(g, 80, 80, 96, 96, 8); fill(g, T());
    circle(g, 66, 66, 8); fill(g, F(0.7));
  },
  calculator(g) {
    rrect(g, 56, 16, 144, 224, 16); fill(g, T());
    rrect(g, 72, 32, 112, 46, 6); fill(g, F(0.85));
    text(g, '3.14', 140, 56, 28, F(0.1), 'ui-monospace, monospace', 700);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { rrect(g, 74 + c * 38, 94 + r * 35, 30, 26, 5); fill(g, (r + c) % 3 ? F(0.92) : A()); }
  },

  // ------------------------------------------------------------ 🔥 firestarter
  rocket(g) {
    g.save(); g.translate(128, 128); g.rotate(Math.PI / 4);
    poly(g, [[-44, 40], [-80, 92], [-30, 80]]); fill(g, T()); poly(g, [[44, 40], [80, 92], [30, 80]]); fill(g, T());
    g.beginPath(); g.moveTo(0, -116); g.bezierCurveTo(52, -70, 48, 40, 34, 82); g.lineTo(-34, 82); g.bezierCurveTo(-48, 40, -52, -70, 0, -116); fill(g, F(0.95));
    g.save(); g.clip(); g.fillStyle = T(); g.fillRect(-60, -130, 120, 52); g.restore();
    circle(g, 0, -14, 22); fill(g, F(0.3)); circle(g, 0, -14, 14); fill(g, A());
    poly(g, [[-22, 84], [0, 124], [22, 84]]); fill(g, A());
    g.restore();
  },
  lightning(g) {
    poly(g, [[150, 8], [56, 140], [118, 140], [92, 248], [204, 102], [138, 102], [176, 8]]); fill(g, T());
    line(g, [[150, 26], [84, 126]], F(1), 7);
  },
  flame(g) {
    rrect(g, 116, 150, 24, 100, 6); fill(g, F(0.8));
    g.beginPath(); g.moveTo(128, 8); g.bezierCurveTo(196, 70, 206, 120, 176, 158); g.bezierCurveTo(156, 184, 100, 184, 80, 158);
    g.bezierCurveTo(54, 122, 70, 84, 96, 60); g.bezierCurveTo(98, 92, 112, 100, 120, 96); g.bezierCurveTo(104, 60, 112, 34, 128, 8); fill(g, T());
    g.beginPath(); g.moveTo(130, 76); g.bezierCurveTo(166, 110, 166, 150, 128, 166); g.bezierCurveTo(98, 154, 98, 120, 130, 76); fill(g, F(0.97));
    g.beginPath(); g.ellipse(128, 160, 20, 14, 0, 0, TAU); fill(g, A());
  },
  stopwatch(g) {
    rrect(g, 110, 8, 36, 30, 6); fill(g, A());
    line(g, [[196, 52], [214, 34]], A(), 14);
    circle(g, 128, 142, 104); fill(g, T());
    circle(g, 128, 142, 80); fill(g, F(0.95));
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; line(g, [[128 + Math.cos(a) * 66, 142 + Math.sin(a) * 66], [128 + Math.cos(a) * 76, 142 + Math.sin(a) * 76]], F(0.2), 5); }
    line(g, [[128, 142], [128, 80]], F(0.1), 8); line(g, [[128, 142], [168, 160]], T(), 6);
    circle(g, 128, 142, 9); fill(g, F(0.1));
  },
  powerButton(g) {
    circle(g, 128, 128, 116); fill(g, T());
    circle(g, 128, 128, 96); stroke(g, A(), 10);
    g.beginPath(); g.arc(128, 136, 56, -Math.PI * 0.32, Math.PI * 1.32); stroke(g, F(0.97), 20);
    line(g, [[128, 58], [128, 128]], F(0.97), 20);
  },
  dice(g) {
    rrect(g, 30, 30, 196, 196, 34); fill(g, T());
    for (const [x, y] of [[78, 78], [178, 78], [128, 128], [78, 178], [178, 178]]) { circle(g, x, y, 18); fill(g, F(0.97)); }
  },

  // ------------------------------------------------------------ ⛰️ mountaineer
  mountain(g) {
    poly(g, [[4, 236], [94, 92], [148, 160], [182, 112], [252, 236]]); fill(g, A());
    poly(g, [[22, 236], [124, 40], [226, 236]]); fill(g, T());
    poly(g, [[124, 40], [96, 94], [112, 86], [126, 102], [140, 84], [154, 96]]); fill(g, F(0.97));
    line(g, [[124, 40], [124, 12]], F(0.25), 5); poly(g, [[126, 12], [160, 22], [126, 34]]); fill(g, F(0.25));
  },
  flag(g) {
    line(g, [[60, 18], [60, 244]], F(0.3), 14);
    g.beginPath(); g.moveTo(66, 26); g.bezierCurveTo(120, 4, 160, 56, 236, 30); g.lineTo(236, 128);
    g.bezierCurveTo(160, 154, 120, 102, 66, 124); g.closePath(); fill(g, T());
    poly(g, [[150, 52], [158, 74], [182, 74], [162, 88], [170, 110], [150, 96], [130, 110], [138, 88], [118, 74], [142, 74]]); fill(g, F(0.97));
    circle(g, 60, 16, 12); fill(g, F(0.7));
  },
  ladder(g) {
    line(g, [[70, 8], [92, 248]], T(), 22); line(g, [[186, 8], [164, 248]], T(), 22);
    for (let i = 0; i < 6; i++) { const y = 34 + i * 40; line(g, [[76 + y * 0.09, y], [180 - y * 0.09, y]], A(), 14); }
  },
  chartUp(g) {
    line(g, [[24, 20], [24, 232], [244, 232]], F(0.2), 10);
    [[44, 170, 40], [94, 130, 80], [144, 90, 120], [194, 40, 170]].forEach(([x, h], i) => { rrect(g, x, 220 - h, 40, h, 4); fill(g, i % 2 ? A() : T()); });
    line(g, [[50, 140], [110, 100], [150, 112], [220, 30]], F(0.97), 10);
    poly(g, [[230, 16], [228, 54], [196, 32]]); fill(g, F(0.97));
  },
  trophy(g) {
    g.beginPath(); g.arc(70, 76, 42, Math.PI * 0.5, Math.PI * 1.5); stroke(g, T(), 14);
    g.beginPath(); g.arc(186, 76, 42, -Math.PI * 0.5, Math.PI * 0.5); stroke(g, T(), 14);
    g.beginPath(); g.moveTo(62, 26); g.lineTo(194, 26); g.lineTo(186, 104); g.bezierCurveTo(176, 150, 80, 150, 70, 104); g.closePath(); fill(g, T());
    g.fillStyle = A(); g.fillRect(114, 142, 28, 46);
    rrect(g, 70, 186, 116, 46, 6); fill(g, A());
    rrect(g, 98, 198, 60, 20, 3); fill(g, F(0.88));
    line(g, [[96, 44], [92, 100]], F(1), 9);
  },

  // ------------------------------------------------------------ 🧭 trailblazer
  compass(g) {
    circle(g, 128, 128, 116); fill(g, T());
    circle(g, 128, 128, 92); fill(g, F(0.95));
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; line(g, [[128 + Math.cos(a) * 76, 128 + Math.sin(a) * 76], [128 + Math.cos(a) * 88, 128 + Math.sin(a) * 88]], F(0.2), 5); }
    poly(g, [[128, 44], [150, 128], [106, 128]]); fill(g, A());
    poly(g, [[128, 212], [150, 128], [106, 128]]); fill(g, F(0.35));
    circle(g, 128, 128, 10); fill(g, F(0.1));
  },
  puzzle(g) {
    rrect(g, 44, 60, 152, 152, 10); fill(g, T());
    circle(g, 120, 52, 30); fill(g, T()); circle(g, 204, 136, 30); fill(g, T());
    cut(g, () => circle(g, 48, 136, 28)); cut(g, () => circle(g, 120, 216, 28));
    g.beginPath(); g.arc(120, 136, 60, Math.PI * 1.1, Math.PI * 1.4); stroke(g, F(1), 10);
  },
  prism(g) {
    line(g, [[4, 150], [100, 124]], F(0.97), 10);
    poly(g, [[128, 24], [228, 214], [28, 214]]); fill(g, T(0.85));
    line(g, [[128, 24], [128, 214]], A(), 6);
    [[0.95, 0], [0.7, 18], [0.45, 36], [0.25, 54]].forEach(([v, d]) => line(g, [[150, 128 + d * 0.3], [250, 112 + d]], F(v), 9));
  },
  brush(g) {
    rrect(g, 6, 106, 140, 44, 22); fill(g, T());
    g.fillStyle = F(0.75); g.fillRect(140, 100, 36, 56);
    line(g, [[150, 100], [150, 156]], F(0.5), 4);
    g.beginPath(); g.moveTo(174, 98); g.bezierCurveTo(220, 100, 236, 120, 250, 128); g.bezierCurveTo(236, 136, 220, 156, 174, 158); g.closePath(); fill(g, A());
  },
  signpost(g) {
    rrect(g, 114, 20, 28, 228, 6); fill(g, F(0.35));
    poly(g, [[28, 44], [196, 44], [232, 74], [196, 104], [28, 104]]); fill(g, T());
    poly(g, [[228, 124], [60, 124], [24, 154], [60, 184], [228, 184]]); fill(g, A());
    g.fillStyle = F(0.95); g.fillRect(52, 68, 110, 12); g.fillRect(94, 148, 110, 12);
  },

  // ------------------------------------------------------------ 🗺️ cartographer
  map(g) {
    const xs = [16, 76, 136, 196, 244];
    for (let i = 0; i < 4; i++) {
      const y0 = i % 2 ? 32 : 18, y1 = i % 2 ? 218 : 232;
      poly(g, [[xs[i], i % 2 ? 18 : 32], [xs[i + 1], y0], [xs[i + 1], y1], [xs[i], i % 2 ? 232 : 218]]); fill(g, i % 2 ? A() : T());
    }
    g.setLineDash([12, 12]); line(g, [[36, 190], [90, 120], [150, 160], [200, 70]], F(0.97), 7); g.setLineDash([]);
    line(g, [[186, 56], [214, 84]], F(0.1), 9); line(g, [[214, 56], [186, 84]], F(0.1), 9);
  },
  binoculars(g) {
    rrect(g, 30, 52, 82, 168, 30); fill(g, T()); rrect(g, 144, 52, 82, 168, 30); fill(g, T());
    rrect(g, 100, 82, 56, 52, 8); fill(g, A());
    circle(g, 71, 186, 30); fill(g, F(0.12)); circle(g, 185, 186, 30); fill(g, F(0.12));
    circle(g, 62, 176, 9); fill(g, F(0.9)); circle(g, 176, 176, 9); fill(g, F(0.9));
    rrect(g, 40, 34, 62, 26, 6); fill(g, A()); rrect(g, 154, 34, 62, 26, 6); fill(g, A());
  },
  calendar(g) {
    rrect(g, 26, 36, 204, 200, 14); fill(g, F(0.95));
    g.save(); rrect(g, 26, 36, 204, 200, 14); g.clip(); g.fillStyle = T(); g.fillRect(26, 36, 204, 54); g.restore();
    for (const x of [70, 186]) { rrect(g, x - 8, 18, 16, 40, 6); fill(g, F(0.3)); }
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { rrect(g, 42 + c * 37, 104 + r * 31, 26, 22, 4); fill(g, (r * 5 + c) % 7 === 3 ? A() : F(0.78)); }
  },
  chessKnight(g) {
    g.beginPath(); g.moveTo(70, 200); g.bezierCurveTo(70, 150, 110, 140, 104, 112); g.lineTo(64, 128); g.bezierCurveTo(44, 120, 44, 100, 60, 88);
    g.bezierCurveTo(90, 60, 100, 40, 118, 20); g.lineTo(130, 40); g.bezierCurveTo(190, 50, 210, 120, 192, 200); g.closePath(); fill(g, T());
    rrect(g, 50, 196, 156, 26, 8); fill(g, A()); rrect(g, 36, 220, 184, 26, 8); fill(g, A());
    circle(g, 112, 68, 9); fill(g, F(0.95));
    g.beginPath(); g.moveTo(132, 44); g.bezierCurveTo(180, 64, 188, 120, 176, 186); stroke(g, F(1), 6);
  },
  clipboard(g) {
    rrect(g, 40, 22, 176, 226, 14); fill(g, A());
    rrect(g, 58, 50, 140, 182, 6); fill(g, F(0.96));
    rrect(g, 92, 10, 72, 36, 10); fill(g, F(0.5));
    for (let i = 0; i < 4; i++) {
      const y = 82 + i * 38;
      line(g, [[72, y], [84, y + 12], [104, y - 10]], T(), 9);
      g.fillStyle = F(0.6); g.fillRect(118, y - 2, 64, 8);
    }
  },

  // ------------------------------------------------------------ 🛠️ outsider
  wrench(g) {
    g.save(); g.translate(128, 128); g.rotate(-0.25);
    rrect(g, -96, -16, 170, 32, 16); fill(g, T());
    circle(g, 84, 0, 46); fill(g, T());
    cut(g, () => { g.beginPath(); g.roundRect(70, -18, 70, 36, 6); });
    circle(g, -82, 0, 10); fill(g, A());
    line(g, [[-60, -6], [40, -6]], F(1), 5);
    g.restore();
  },
  screwdriver(g) {
    rrect(g, 6, 92, 110, 72, 26); fill(g, T());
    for (const y of [108, 128, 148]) line(g, [[22, y], [100, y]], A(), 7);
    rrect(g, 114, 104, 18, 48, 4); fill(g, F(0.3));
    g.fillStyle = F(0.78); g.fillRect(130, 118, 96, 20);
    poly(g, [[226, 116], [250, 122], [250, 134], [226, 140]]); fill(g, F(0.6));
  },
  hammer(g) {
    g.save(); g.translate(128, 128); g.rotate(-0.6);
    rrect(g, -18, -50, 36, 170, 14); fill(g, T());
    rrect(g, -78, -96, 140, 50, 8); fill(g, F(0.42));
    poly(g, [[62, -96], [94, -110], [94, -32], [62, -46]]); fill(g, F(0.42));
    g.fillStyle = F(0.8); g.fillRect(-72, -90, 128, 8);
    g.fillStyle = A(); g.fillRect(-18, 60, 36, 60);
    g.restore();
  },
  medal(g) {
    poly(g, [[66, 8], [112, 8], [146, 110], [112, 126]]); fill(g, A());
    poly(g, [[190, 8], [144, 8], [110, 110], [144, 126]]); fill(g, A());
    circle(g, 128, 166, 80); fill(g, T());
    circle(g, 128, 166, 62); stroke(g, F(0.9), 6);
    poly(g, [[128, 120], [140, 154], [176, 154], [148, 174], [158, 208], [128, 188], [98, 208], [108, 174], [80, 154], [116, 154]]); fill(g, F(0.97));
  },
};

// ------------------------------------------------------------ 🚀 uzay
DRAW.spaceRocket = (g) => DRAW.rocket(g);
DRAW.planet = (g) => {
  // Halkanın arka yarısı, gezegen, halkanın ön yarısı
  g.save(); g.translate(128, 128); g.rotate(-0.35);
  g.beginPath(); g.ellipse(0, 0, 120, 34, 0, Math.PI, TAU); stroke(g, A(), 16);
  g.restore();
  circle(g, 128, 128, 72); fill(g, T());
  g.save(); circle(g, 128, 128, 72); g.clip();
  g.fillStyle = A(); g.fillRect(40, 108, 180, 16); g.fillRect(40, 150, 180, 10);
  g.restore();
  g.beginPath(); g.arc(128, 128, 52, Math.PI * 1.1, Math.PI * 1.45); stroke(g, F(1), 9);
  g.save(); g.translate(128, 128); g.rotate(-0.35);
  g.beginPath(); g.ellipse(0, 0, 120, 34, 0, 0, Math.PI); stroke(g, F(0.9), 16);
  g.restore();
};
DRAW.satellite = (g) => {
  g.save(); g.translate(128, 128); g.rotate(-0.5);
  for (const x of [-118, 38]) {
    rrect(g, x, -26, 80, 52, 4); fill(g, A());
    for (let k = 1; k < 4; k++) line(g, [[x + k * 20, -26], [x + k * 20, 26]], F(0.75), 3);
    line(g, [[x, 0], [x + 80, 0]], F(0.75), 3);
  }
  g.fillStyle = F(0.5); g.fillRect(-40, -5, 80, 10);
  rrect(g, -30, -40, 60, 80, 8); fill(g, T());
  g.beginPath(); g.arc(0, -40, 26, Math.PI, TAU); fill(g, F(0.92));
  line(g, [[0, -66], [0, -86]], F(0.4), 5); circle(g, 0, -88, 6); fill(g, F(0.4));
  g.restore();
};
DRAW.telescope = (g) => {
  line(g, [[118, 150], [70, 240]], F(0.35), 9); line(g, [[128, 150], [128, 244]], F(0.35), 9); line(g, [[138, 150], [186, 240]], F(0.35), 9);
  g.save(); g.translate(128, 120); g.rotate(-0.42);
  rrect(g, -110, -24, 180, 48, 10); fill(g, T());
  rrect(g, 64, -32, 46, 64, 8); fill(g, A());
  g.fillStyle = F(0.9); g.fillRect(-60, -24, 10, 48); g.fillRect(20, -24, 10, 48);
  rrect(g, -124, -14, 18, 28, 4); fill(g, F(0.3));
  g.restore();
};
DRAW.star = (g) => {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 50 : 118; pts.push([128 + Math.cos(a) * r, 136 + Math.sin(a) * r]); }
  poly(g, pts); fill(g, T());
  const inner = pts.map(([x, y]) => [128 + (x - 128) * 0.55, 136 + (y - 136) * 0.55]);
  poly(g, inner); fill(g, A());
  line(g, [[96, 92], [118, 70]], F(1), 8);
};

function formula(s, size) {
  return (g) => {
    rrect(g, 22, 22, 212, 212, 26); fill(g, T());
    rrect(g, 34, 34, 188, 188, 18); stroke(g, A(), 6);
    text(g, s, 128, 134, size, F(0.97), '"Times New Roman", Georgia, serif', 700);
  };
}
DRAW.pi = formula('π', 170);
DRAW.sigma = formula('Σ', 150);
DRAW.integral = formula('∫', 190);
DRAW.emc2 = formula('E=mc²', 64);
DRAW.sqrt = formula('√x', 120);

function badge(lines, sizes) {
  return (g) => {
    circle(g, 128, 128, 118); fill(g, T());
    circle(g, 128, 128, 100); stroke(g, F(0.95), 9);
    const total = sizes.reduce((a, b) => a + b, 0) * 1.05;
    let y = 128 - total / 2;
    lines.forEach((t, i) => { y += sizes[i] * 0.525; text(g, t, 128, y, sizes[i], F(0.97)); y += sizes[i] * 0.525; });
  };
}
DRAW.iyteLogo = badge(['İYTE'], [76]);
DRAW.teknoparkLogo = badge(['TEKNOPARK', 'İZMİR'], [34, 44]);

// [anahtar, ad, set, şekil, ağırlık]
// set: acad (herkes) veya arketip anahtarı. şekil: round | long | block | other
//   long objeler yatay çizilir; sahnede kenar yönüne döndürülür.
const CATALOG = [
  ['book', 'Kitap', 'acad', 'block', 3], ['books', 'Kitaplar', 'acad', 'block', 2], ['openBook', 'Açık kitap', 'acad', 'block', 2],
  ['mortarboard', 'Mezuniyet kepi', 'acad', 'other', 2], ['flask', 'Erlenmayer', 'acad', 'other', 2], ['testTubes', 'Deney tüpleri', 'acad', 'other', 1.2],
  ['atom', 'Atom', 'acad', 'round', 2], ['gear', 'Dişli', 'acad', 'round', 1.5],
  ['dna', 'DNA', 'acad', 'long', 1.5], ['magnifier', 'Büyüteç', 'acad', 'round', 1.5], ['pencil', 'Kalem', 'acad', 'long', 2],
  ['ruler', 'Cetvel', 'acad', 'long', 1.5], ['setSquare', 'Gönye', 'acad', 'other', 1], ['globe', 'Küre', 'acad', 'round', 1.5],
  ['microscope', 'Mikroskop', 'acad', 'other', 1.5], ['scroll', 'Diploma', 'acad', 'other', 1.2], ['laptop', 'Laptop', 'acad', 'block', 1.5],
  ['turbine', 'Rüzgar türbini', 'acad', 'other', 1.2], ['chip', 'Çip', 'acad', 'block', 1.2], ['calculator', 'Hesap makinesi', 'acad', 'block', 1],
  ['spaceRocket', 'Roket', 'acad', 'other', 2], ['planet', 'Gezegen', 'acad', 'round', 2], ['satellite', 'Uydu', 'acad', 'other', 1.5],
  ['telescope', 'Teleskop', 'acad', 'long', 1.2], ['star', 'Yıldız', 'acad', 'round', 1.5],
  ['pi', 'π', 'acad', 'block', 1], ['sigma', 'Σ', 'acad', 'block', 0.7], ['integral', '∫', 'acad', 'block', 0.7],
  ['emc2', 'E=mc²', 'acad', 'block', 1], ['sqrt', '√x', 'acad', 'block', 0.7],

  ['rocket', 'Roket', 'firestarter', 'other', 2], ['lightning', 'Şimşek', 'firestarter', 'long', 1.5],
  ['stopwatch', 'Kronometre', 'firestarter', 'round', 1.5], ['powerButton', 'Başlat düğmesi', 'firestarter', 'round', 1.2], ['dice', 'Zar', 'firestarter', 'block', 1.2],

  ['mountain', 'Dağ', 'mountaineer', 'other', 2], ['flag', 'Zirve bayrağı', 'mountaineer', 'other', 1.5], ['ladder', 'Merdiven', 'mountaineer', 'other', 1.2],
  ['chartUp', 'Büyüme grafiği', 'mountaineer', 'block', 1.5], ['trophy', 'Kupa', 'mountaineer', 'other', 1.5],

  ['compass', 'Pusula', 'trailblazer', 'round', 2], ['puzzle', 'Yapboz', 'trailblazer', 'block', 1.5], ['prism', 'Prizma', 'trailblazer', 'other', 1.2],
  ['brush', 'Fırça', 'trailblazer', 'long', 1.5], ['signpost', 'Yol tabelası', 'trailblazer', 'other', 1.5],

  ['map', 'Harita', 'cartographer', 'block', 2], ['binoculars', 'Dürbün', 'cartographer', 'other', 1.5], ['calendar', 'Takvim', 'cartographer', 'block', 1.5],
  ['chessKnight', 'Satranç atı', 'cartographer', 'other', 1.5], ['clipboard', 'Kontrol listesi', 'cartographer', 'block', 1.5],

  ['wrench', 'İngiliz anahtarı', 'outsider', 'long', 2], ['screwdriver', 'Tornavida', 'outsider', 'long', 1.5], ['hammer', 'Çekiç', 'outsider', 'other', 1.5],
  ['medal', 'Kalite madalyası', 'outsider', 'round', 1.5],
];
const PLACEHOLDERS = [['iyteLogo', 'İYTE logosu (yer tutucu)'], ['teknoparkLogo', 'Teknopark İzmir logosu (yer tutucu)']];

const lin = (v) => Math.pow(v / 255, 2.2);

/** Dış çizgi ekler: şeklin silüetini her yöne kaydırarak koyu bir kenar oluşturur. */
function withOutline(src) {
  const [sil, sg] = canvas();
  sg.drawImage(src, 0, 0);
  sg.globalCompositeOperation = 'source-in';
  sg.fillStyle = F(0.05); sg.fillRect(0, 0, S, S);
  const [out, o] = canvas();
  for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; o.drawImage(sil, Math.cos(a) * OUTLINE, Math.sin(a) * OUTLINE); }
  o.drawImage(src, 0, 0);
  return out;
}

/** Opak piksellerin doğrusal kanal ortalamaları ve kaplama oranı. */
function stats(c) {
  const g = c.getContext('2d', { willReadFrequently: true });
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let n = 0, r = 0, gg = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    n++; r += lin(d[i]); gg += lin(d[i + 1]); b += lin(d[i + 2]);
  }
  n = Math.max(1, n);
  return { r: r / n, g: gg / n, b: b / n, coverage: n / (c.width * c.height) };
}

export function builtinSprites() {
  const make = (key, name, set, shape, weight, hero = false, placeholder = false) => {
    const [c, g] = canvas();
    DRAW[key](g);
    const cv = withOutline(c);
    const st = stats(cv);
    return {
      key, name, set, shape, weight, hero, placeholder, natural: false, canvas: cv,
      coverage: st.coverage,
      tintMean: st.r + 0.45 * st.b,   // boyanan kısmın ortalama katkısı
      fixMean: st.g,                  // sabit gri kısmın ortalama katkısı
    };
  };
  const out = CATALOG.map(([key, name, set, shape, weight]) => make(key, name, set, shape, weight));
  for (const [key, name] of PLACEHOLDERS) out.push(make(key, name, 'hero', 'round', 1, true, true));
  return out;
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// assets/objects/manifest.json içindeki görselleri yükler. Dosyası olmayan
// girdiler atlanır; "replaces" verilmişse o yer tutucu kaldırılır.
export async function loadCustomSprites(sprites, base = 'assets/objects/') {
  let manifest;
  try {
    const r = await fetch(base + 'manifest.json', { cache: 'no-store' });
    if (!r.ok) return { sprites, loaded: [] };
    manifest = await r.json();
  } catch {
    return { sprites, loaded: [] };
  }
  const loaded = [];
  for (const item of manifest.objects || []) {
    let img;
    try { img = await loadImage(base + item.file); } catch { continue; }
    const size = 512;
    const [c, g] = canvas(size);
    const k = Math.min(size / img.width, size / img.height) * 0.94;
    const w = img.width * k, h = img.height * k;
    g.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    if (item.replaces) sprites = sprites.filter((s) => s.key !== item.replaces);
    const st = stats(c);
    sprites.push({
      key: 'custom:' + item.file, name: item.name || item.file, canvas: c,
      set: item.set || (item.hero ? 'hero' : 'acad'), shape: item.shape || 'other',
      weight: item.weight ?? 1, hero: !!item.hero, natural: true,
      tint: item.tint ?? (item.hero ? 0.4 : 0.7),
      coverage: st.coverage, mean: [st.r, st.g, st.b],
    });
    loaded.push(item.name || item.file);
  }
  return { sprites, loaded };
}
