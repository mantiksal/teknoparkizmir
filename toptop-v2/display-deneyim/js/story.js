// Gösterinin zaman çizelgesi (saniye, gösterinin başından itibaren).
// {name} katılımcının adıyla değiştirilir.

// 1) Bilgi bölümü: alttaki bantta, sırayla.
export const SCENES = [
  { t0: 0.2, t1: 3.2, kicker: 'İzmir\'in 21 kurumunun ortaklığıyla', title: 'Türkiye\'nin 4. teknoparkı' },
  { t0: 3.4, t1: 6.4, kicker: '375 aktif proje · 3.420 toplam proje', title: '254 firma\n2.162 çalışan' },
  { t0: 6.6, t1: 9.6, kicker: '14,5 milyar TL toplam ciro', title: '233,2 milyon $\nihracat' },
  { t0: 9.8, t1: 12.8, kicker: 'Oyun · Enerji · Nanoteknoloji · Tarım', title: 'Yapay zekâdan\nbiyoteknolojiye' },
  { t0: 13.0, t1: 16.0, kicker: 'Teknopark İzmir\'de doğdu', title: 'İzmir\'in ilk\nunicorn\'u: HubX' },
];

// 2) Bilgilendirme bittikten sonra ekranın ortasında, kelime kelime beliren cümleler.
export const STATEMENTS = [
  { t0: 16.5, t1: 19.8, lines: [{ text: 'İYTE yolculuğunda karşılaştığın' }, { text: 'her şey sana bir şey öğretecek.' }] },
  { t0: 20.1, t1: 24.1, big: true, lines: [
    { text: 'Bir sonraki hikâye' },
    { text: 'belki de senin hikâyendir,', delay: 0.4 },
    { text: '{name}…', name: true, delay: 1.2 },
  ] },
];

// 3) Cümleler bitince çekilen fotoğraf köşeye "yapışır" (STICK_AT).
// 4) Sonra portre kurulur: objeler dağınık buluttan tek tek, giderek hızlanarak
// yerlerine uçar (BUILD.t0'dan itibaren span saniye). Kamera akışına devam eder,
// CAMERA_BLEND'den itibaren yumuşakça sihirli noktaya karışır ve ALIGN_AT'te tam oturur.
export const STICK_AT = 24.3;
export const BUILD = { t0: 25.2, span: 6.5 };
export const CAMERA_BLEND = 22.5;
export const ALIGN_AT = 32.2;
