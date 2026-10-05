// 30 saniyelik "Teknopark İzmir" hikâyesi. Rakamlar teknoparkizmir.com.tr ana
// sayfasından (Ekim 2026); "4. teknopark / 21 kurum" TGBD kaynaklı.
// {name} katılımcının adıyla değiştirilir.
export const SOURCE_NOTE = 'Kaynak: teknoparkizmir.com.tr · Ekim 2026';

export const SCENES = [
  { t0: 0.3, t1: 4.2, kicker: '2002\'den beri · İYTE Kampüsü, Urla', title: 'Teknopark İzmir' },
  { t0: 4.4, t1: 8.4, kicker: 'İzmir\'in 21 kurumunun ortaklığıyla', title: 'Türkiye\'nin 4. teknoparkı' },
  { t0: 8.6, t1: 12.6, kicker: '375 aktif proje · 3.420 toplam proje', title: '237 firma\n1.930+ çalışan', source: true },
  { t0: 12.8, t1: 16.8, kicker: '14,5 milyar TL toplam ciro', title: '469 milyon $\nihracat', source: true },
  { t0: 17, t1: 21, kicker: 'Oyun · Enerji · Nanoteknoloji · Tarım', title: 'Yapay zekâdan\nbiyoteknolojiye' },
  { t0: 21.2, t1: 25.2, kicker: 'Teknopark İzmir\'de doğdu', title: 'İzmir\'in ilk\nunicorn\'u: HubX' },
  { t0: 25.4, t1: 29.4, kicker: '{name}, bu parçalardan biri de sensin', title: 'Sıradaki hikâye\nseninki olabilir' },
];

// Objelerin portreye toplanması bu aralıkta olur (saniye).
export const ASSEMBLE = { t0: 0.8, t1: 15 };
// Kameranın sihirli noktaya oturduğu an.
export const ALIGN_AT = 31.5;
