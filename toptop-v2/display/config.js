// Stand ekranı ayarları. Etkinlik öncesi buradan düzenleyin.
export const CONFIG = {
  // Telefon testinin adresi (GitHub Pages). Bekleme ekranındaki QR buraya gider.
  quizUrl: 'https://mantiksal.github.io/teknoparkizmir/',

  // Portre paylaşımı. provider: 'none' iken bitiş ekranındaki QR teste davet eder.
  // 'supabase' için: herkese açık bir storage bucket + anon anahtarla yükleme izni.
  share: { provider: 'none', supabaseUrl: '', anonKey: '', bucket: 'portraits' },

  academy: {
    title: 'Teknogirişim Akademisi',
    note: 'Güz dönemi 15–16 Ekim · Son başvuru 13 Ekim',
    url: 'teknoparkizmir.com.tr',
    instagram: '@teknoparkizmir',
  },

  // Süreler (saniye)
  greet: 4,
  countdown: 5,
  show: 34,       // Teknopark hikâyesi + portrenin oluşması
  end: 15,
  sameTokenCooldown: 120,  // aynı QR tekrar okutulursa yok sayılma süresi
};

// Kurumsal renkler (teknoparkizmir.com.tr stil dosyalarından)
export const BRAND = { green: '#80CD36', lightGreen: '#B5D56A', yellow: '#FFEF3B', dark: '#323232', gray: '#727272' };
