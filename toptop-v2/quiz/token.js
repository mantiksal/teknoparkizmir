// Telefon (test sonucu) → stand ekranı (kamera) arasında taşınan QR içeriği.
// Sunucu gerekmez: ad ve arketip QR'ın içinde, kısa bir sağlama toplamıyla.
//   TTZ1.<base64url(JSON)>.<fnv1a-hex>

const PREFIX = 'TTZ1';

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** @param data { name, archetype, scores: {key: n}, consent } */
export function encodeToken(data) {
  const body = b64urlEncode(JSON.stringify({
    v: 1, n: data.name, a: data.archetype, s: data.scores, c: data.consent ? 1 : 0, t: Math.floor(Date.now() / 1000),
  }));
  return `${PREFIX}.${body}.${fnv1a(body)}`;
}

/** Geçersizse null döner. */
export function decodeToken(text) {
  const parts = (text || '').trim().split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX || fnv1a(parts[1]) !== parts[2]) return null;
  try {
    const d = JSON.parse(b64urlDecode(parts[1]));
    if (d.v !== 1 || typeof d.n !== 'string' || typeof d.a !== 'string') return null;
    return { name: d.n.slice(0, 24), archetype: d.a, scores: d.s, consent: !!d.c, time: d.t };
  } catch {
    return null;
  }
}
