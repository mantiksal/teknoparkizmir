// Bitiş ekranının Instagram hikâyesi formatında (1080×1920) kartı + yükleme.
import { CONFIG, BRAND } from '../config.js';

/**
 * @param shot  portrenin oturduğu kare (WebGL canvas'ından kopya)
 * @param info  { name, arch }  arch: ARCHETYPES[...] kaydı
 */
export function composeCard(shot, info) {
  const W = 1080, H = 1920;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d0f12'); bg.addColorStop(1, '#16191d');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);

  // Portre: kareden ortadaki dikey bölümü al.
  const sw = shot.width, sh = shot.height;
  const targetAspect = 1080 / 1300;
  let cw = sw, ch = cw / targetAspect;
  if (ch > sh) { ch = sh; cw = ch * targetAspect; }
  g.drawImage(shot, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 300, 1080, 1300);
  const fade = (y0, y1, from, to) => {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, from); gr.addColorStop(1, to);
    g.fillStyle = gr; g.fillRect(0, y0, W, y1 - y0);
  };
  fade(300, 420, '#0d0f12', 'rgba(13,15,18,0)');
  fade(1450, 1600, 'rgba(22,25,29,0)', '#16191d');

  g.textAlign = 'center';
  g.fillStyle = '#c9ccd2'; g.font = '500 44px Roboto, system-ui, sans-serif';
  g.fillText('Geleceğin', W / 2, 120);
  g.fillStyle = info.arch.color; g.font = '900 104px Roboto, system-ui, sans-serif';
  g.fillText(`${info.arch.emoji} ${info.arch.name}`, W / 2, 230, W - 80);
  g.fillStyle = '#fff'; g.font = '700 56px Roboto, system-ui, sans-serif';
  g.fillText(`girişimcisi ${info.name}`, W / 2, 300, W - 80);

  g.fillStyle = '#f2f2f5'; g.font = 'italic 400 42px Roboto, system-ui, sans-serif';
  g.fillText(`“${info.arch.motto}”`, W / 2, 1650, W - 100);
  g.fillStyle = BRAND.green; g.font = '700 40px Roboto, system-ui, sans-serif';
  g.fillText(`Teknopark İzmir · ${CONFIG.academy.title}`, W / 2, 1780, W - 80);
  g.fillStyle = '#9aa0a8'; g.font = '400 36px Roboto, system-ui, sans-serif';
  g.fillText(CONFIG.academy.instagram, W / 2, 1840);
  return c;
}

/** Kartı yükler; paylaşım sayfasının adresini döndürür (yükleme kapalıysa null). */
export async function uploadCard(card, info) {
  const s = CONFIG.share;
  if (s.provider !== 'supabase' || !s.supabaseUrl || !s.anonKey) return null;
  const blob = await new Promise((r) => card.toBlob(r, 'image/jpeg', 0.9));
  const name = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`;
  const r = await fetch(`${s.supabaseUrl}/storage/v1/object/${s.bucket}/${name}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${s.anonKey}`, apikey: s.anonKey, 'Content-Type': 'image/jpeg' },
    body: blob,
  });
  if (!r.ok) throw new Error('yükleme ' + r.status);
  const img = `${s.supabaseUrl}/storage/v1/object/public/${s.bucket}/${name}`;
  const q = new URLSearchParams({ img, n: info.name, a: info.key });
  return `${CONFIG.quizUrl}share.html?${q}`;
}
