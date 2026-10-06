// Gösterinin zaman çizelgesi (saniye, gösterinin başından itibaren).
// {name} katılımcının adıyla değiştirilir.

// 1) Bilgi bölümü: alttaki bantta, sırayla.
export const SCENES = [
  { t0: 0.3, t1: 4.2, kicker: '2002\'de kuruldu · İYTE Kampüsü, Urla', title: 'Teknopark İzmir' },
  { t0: 4.4, t1: 8.4, kicker: 'İzmir\'in 21 kurumunun ortaklığıyla', title: 'Türkiye\'nin 4. teknoparkı' },
  { t0: 8.6, t1: 12.6, kicker: '375 aktif proje · 3.420 toplam proje', title: '237 firma\n1.930+ çalışan' },
  { t0: 12.8, t1: 16.8, kicker: '14,5 milyar TL toplam ciro', title: '469 milyon $\nihracat' },
  { t0: 17, t1: 21, kicker: 'Oyun · Enerji · Nanoteknoloji · Tarım', title: 'Yapay zekâdan\nbiyoteknolojiye' },
  { t0: 21.2, t1: 25.2, kicker: 'Teknopark İzmir\'de doğdu', title: 'İzmir\'in ilk\nunicorn\'u: HubX' },
];

// 2) Bilgilendirme bittikten sonra ekranın ortasında, kelime kelime beliren cümleler.
export const STATEMENTS = [
  { t0: 26, t1: 30.2, lines: [{ text: 'İYTE yolculuğunda karşılaştığın' }, { text: 'her şey sana bir şey öğretecek.' }] },
  { t0: 30.8, t1: 35, big: true, lines: [{ text: 'Bir sonraki hikâye…', grad: true }, { text: 'seninki, {name}.', delay: 1.3 }] },
];

// 3) Sonra yazısız obje şovu; kamera sihirli noktaya oturur ve portre belirir.
// Objelerin portreye toplanması bu aralıkta olur.
export const ASSEMBLE = { t0: 0.8, t1: 15 };
// Kameranın sihirli noktaya oturduğu an.
export const ALIGN_AT = 39.5;
