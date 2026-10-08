// Stand ekranı ayarları. Etkinlik öncesi buradan düzenleyin.
export const CONFIG = {
  // Telefon testinin adresi (GitHub Pages). Bekleme ekranındaki QR buraya gider.
  quizUrl: 'https://mantiksal.github.io/teknoparkizmir/quiz-girisimci/',

  // Portre paylaşımı. provider: 'none' iken bitiş ekranındaki QR teste davet eder.
  // 'supabase' için: herkese açık bir storage bucket + anon anahtarla yükleme izni.
  share: { provider: 'none', supabaseUrl: '', anonKey: '', bucket: 'portraits' },

  // Bitiş ekranındaki davetiye. Etkinlik dönemine göre güncelleyin.
  academy: {
    title: 'Teknogirişim Akademisi',
    dates: '15–16 Ekim 2026',
    place: 'Teknopark İzmir',
    deadline: 'Son başvuru: 13 Ekim',
    // Davetiyedeki QR buraya gider (program sayfası; başvuru bağlantısı orada).
    applyUrl: 'https://teknoparkizmir.com.tr/tr/projeler/teknogirisim-akademisi/',
    instagram: '@teknoparkizmir',
  },

  // Tanıtım videosu: sessiz, döngüde, her açılışta rastgele bir saniyeden başlar.
  // İlk dosya yoksa ikincisi denenir. null yaparsanız video gösterilmez.
  promoVideo: ['media/iyte-tanitim-1080p.mp4', 'media/iyte-tanitim-540p.mp4', '../iyte-tanitim.mp4'],   // yalnızca bekleme ekranında

  // Portredeki obje sayısı: arttıkça ayrıntı artar, kare hızı düşer.
  // Stand bilgisayarında D tuşuyla fps'e bakın; 30'un altındaysa düşürün (ör. 1600).
  portraitObjects: 2200,

  // Süreler (saniye)
  greet: 1.25,
  countdown: 3,
  show: 28.5,       // Teknopark hikâyesi + cümleler + obje şovu + portrenin oluşması
  end: 30,        // unvan + davetiye (QR okutma süresi)
  sameTokenCooldown: 120,  // aynı QR tekrar okutulursa yok sayılma süresi
};

// Kurumsal renkler (teknoparkizmir.com.tr stil dosyalarından)
export const BRAND = { green: '#80CD36', lightGreen: '#B5D56A', yellow: '#FFEF3B', dark: '#323232', gray: '#727272' };
