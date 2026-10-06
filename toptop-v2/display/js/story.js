// Gösterinin zaman çizelgesi (saniye, gösterinin başından itibaren).
// {name} katılımcının adıyla değiştirilir.

// 1) Bilgi bölümü: alttaki bantta, sırayla.
export const SCENES = [
  { t0: 0.3, t1: 4.3, kicker: 'İzmir\'in 21 kurumunun ortaklığıyla', title: 'Türkiye\'nin 4. teknoparkı' },
  { t0: 4.5, t1: 8.5, kicker: '375 aktif proje · 3.420 toplam proje', title: '237 firma\n1.930+ çalışan' },
  { t0: 8.7, t1: 12.7, kicker: '14,5 milyar TL toplam ciro', title: '469 milyon $\nihracat' },
  { t0: 12.9, t1: 16.9, kicker: 'Oyun · Enerji · Nanoteknoloji · Tarım', title: 'Yapay zekâdan\nbiyoteknolojiye' },
  { t0: 17.1, t1: 21.1, kicker: 'Teknopark İzmir\'de doğdu', title: 'İzmir\'in ilk\nunicorn\'u: HubX' },
];

// 2) Bilgilendirme bittikten sonra ekranın ortasında, kelime kelime beliren cümleler.
export const STATEMENTS = [
  { t0: 21.9, t1: 26.1, lines: [{ text: 'İYTE yolculuğunda karşılaştığın' }, { text: 'her şey sana bir şey öğretecek.' }] },
  { t0: 26.7, t1: 30.9, big: true, lines: [{ text: 'Bir sonraki hikâye…', grad: true }, { text: 'seninki, {name}.', delay: 1.3 }] },
];

// 3) Sonra yazısız obje şovu; kamera sihirli noktaya oturur ve portre belirir.
// Objelerin portreye toplanması bu aralıkta olur.
export const ASSEMBLE = { t0: 0.8, t1: 13 };
// Kameranın sihirli noktaya oturduğu an.
export const ALIGN_AT = 35.4;
