// Kameradan QR okuma: varsa tarayıcının BarcodeDetector'ı, yoksa jsQR.
export class QRScanner {
  constructor(video) {
    this.video = video;
    this.detector = null;
    this.canvas = document.createElement('canvas');
    this.busy = false;
  }

  async init() {
    if ('BarcodeDetector' in window) {
      try {
        const formats = await window.BarcodeDetector.getSupportedFormats();
        if (formats.includes('qr_code')) this.detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      } catch {}
    }
    this.engine = this.detector ? 'BarcodeDetector' : 'jsQR';
  }

  /** Görüntüde QR varsa içeriğini döndürür, yoksa null. */
  async scan() {
    const v = this.video;
    if (this.busy || v.readyState < 2) return null;
    this.busy = true;
    try {
      if (this.detector) {
        const codes = await this.detector.detect(v);
        return codes[0]?.rawValue ?? null;
      }
      const w = 800, h = Math.round(w * v.videoHeight / v.videoWidth);
      this.canvas.width = w; this.canvas.height = h;
      const g = this.canvas.getContext('2d', { willReadFrequently: true });
      g.drawImage(v, 0, 0, w, h);
      const res = window.jsQR(g.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'attemptBoth' });
      return res?.data ?? null;
    } catch {
      return null;
    } finally {
      this.busy = false;
    }
  }
}
