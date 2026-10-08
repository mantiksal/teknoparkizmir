// Gösterinin zaman çizelgesi (saniye, gösterinin başından itibaren).
// {name} katılımcının adıyla değiştirilir.

// 1) Bilgi bölümü: alttaki bantta, sırayla.
export const SCENES = [
  { t0: 0.2, t1: 2.5, kicker: 'İzmir\'in 21 kurumunun ortaklığıyla', title: 'Türkiye\'nin 4. teknoparkı' },
  { t0: 2.65, t1: 4.95, kicker: '375 aktif proje · 3.420 toplam proje', title: '254 firma\n2.162 çalışan' },
  { t0: 5.1, t1: 7.4, kicker: '14,5 milyar TL toplam ciro', title: '233,2 milyon $\nihracat' },
  { t0: 7.55, t1: 9.85, kicker: 'Oyun · Enerji · Nanoteknoloji · Tarım', title: 'Yapay zekâdan\nbiyoteknolojiye' },
  { t0: 10.0, t1: 12.3, kicker: 'Teknopark İzmir\'de doğdu', title: 'İzmir\'in ilk\nunicorn\'u: HubX' },
];

// 2) Bilgilendirme bittikten sonra ekranın ortasında, kelime kelime beliren cümleler.
export const STATEMENTS = [
  { t0: 12.7, t1: 15.6, lines: [{ text: 'İYTE yolculuğunda karşılaştığın' }, { text: 'her şey sana bir şey öğretecek.' }] },
  { t0: 15.9, t1: 19.6, big: true, lines: [
    { text: 'Bir sonraki hikâye' },
    { text: 'belki de senin hikâyendir,', delay: 0.4 },
    { text: '{name}…', name: true, delay: 1.1 },
  ] },
];

// 3) Çekilen fotoğraf gösterinin başında köşeye "yapışır" (STICK_AT) ve sonuna kadar kalır.
// 4) Sonra portre kurulur: objeler dağınık buluttan tek tek, giderek hızlanarak
// yerlerine uçar (BUILD.t0'dan itibaren span saniye). Kamera akışına devam eder,
// CAMERA_BLEND'den itibaren yumuşakça sihirli noktaya karışır ve ALIGN_AT'te tam oturur.
export const STICK_AT = 0;   // çekimden hemen sonra; gösteri boyunca ilgiyi üzerinde tutar
export const BUILD = { t0: 20.4, span: 6 };
export const CAMERA_BLEND = 18;
export const ALIGN_AT = 26.9;
