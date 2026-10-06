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
  { t0: 26.6, t1: 31.4, big: true, lines: [
    { text: 'Bir sonraki hikâye' },
    { text: 'belki de senin hikâyendir,', delay: 0.5 },
    { text: '{name}…', name: true, delay: 1.6 },
  ] },
];

// 3) Portrenin kurulması: objeler dağınık buluttan tek tek, giderek hızlanarak
// yerlerine uçar (t0'dan itibaren span saniye). Kamera bu sırada yavaşça
// sihirli noktaya yaklaşır ve ALIGN_AT'te tam oturur.
export const BUILD = { t0: 31.6, span: 8.5 };
export const ALIGN_AT = 41.8;
