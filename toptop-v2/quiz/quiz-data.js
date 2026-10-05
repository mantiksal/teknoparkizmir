// "Nasıl bir girişimcisin?" testi — Teknopark İzmir ekibinin hazırladığı içerik.

export const ORDER = ['firestarter', 'mountaineer', 'trailblazer', 'cartographer', 'outsider'];

export const ARCHETYPES = {
  firestarter: {
    emoji: '🔥', name: 'FIRESTARTER', tr: 'Risk Alan', color: '#ff5a1f',
    motto: 'Fırsatı gördüğünde beklemiyorsun.',
    text: 'Cesur kararlar almaktan ve risk üstlenmekten çekinmiyorsun. Fırsatları hızlı fark ediyor ve harekete geçmeyi uzun uzun düşünmeye tercih ediyorsun.',
    strength: 'Cesaret ve hız',
    caution: 'Bazen harekete geçmeden önce biraz daha veri toplamak faydalı olabilir.',
  },
  mountaineer: {
    emoji: '⛰️', name: 'MOUNTAINEER', tr: 'Büyüme Odaklı', color: '#5ab4ff',
    motto: 'Senin için bir sonraki zirve her zaman var.',
    text: 'Büyük düşünmeyi seviyor ve bulunduğun noktayı yeterli görmek yerine sürekli ilerlemek istiyorsun. Hedefler ve büyüme seni motive ediyor.',
    strength: 'Hırs ve vizyon',
    caution: 'Sürekli bir sonraki hedefe koşarken mevcut kazanımlarını gözden kaçırma.',
  },
  trailblazer: {
    emoji: '🧭', name: 'TRAILBLAZER', tr: 'Kendi Yolunu Açan', color: '#a66bff',
    motto: 'Var olan yolu takip etmek yerine yenisini açarsın.',
    text: 'Yeni fikirler, farklı çözümler ve denenmemiş yollar seni heyecanlandırıyor. Problemlere başkalarının bakmadığı açılardan yaklaşmayı seviyorsun.',
    strength: 'Yaratıcılık ve yenilikçilik',
    caution: 'İyi bir fikrin yanında uygulanabilirliği ve rakamları da kontrol etmeyi unutma.',
  },
  cartographer: {
    emoji: '🗺️', name: 'CARTOGRAPHER', tr: 'Planlayıcı', color: '#e0a85a',
    motto: 'Haritan olmadan yola çıkmazsın.',
    text: 'Araştırmayı, planlamayı ve olası riskleri önceden görmeyi seviyorsun. Kararlarını mümkün olduğunca sağlam verilere dayandırıyorsun.',
    strength: 'Planlama ve analiz',
    caution: 'Kusursuz planı beklemek bazen fırsatı kaçırmana neden olabilir.',
  },
  outsider: {
    emoji: '🛠️', name: 'OUTSIDER', tr: 'İstikrarlı Uzman', color: '#9fb3c8',
    motto: 'Sessiz ama sağlam ilerlersin.',
    text: 'Trendlerin peşinden koşmak yerine kendi alanında gerçekten iyi olmayı önemsiyorsun. İstikrar, uzmanlık ve yaptığın işin kalitesi senin için büyümeden daha önemli olabilir.',
    strength: 'Tutarlılık ve uzmanlık',
    caution: 'Bazen konfor alanının dışındaki fırsatlara da şans vermek faydalı olabilir.',
  },
};

// Her sorunun cevapları ORDER sırasıyla verilmiştir (A=firestarter … E=outsider).
export const QUESTIONS = [
  {
    q: 'Aklına çok iyi olduğunu düşündüğün bir girişim fikri geldi. İlk ne yaparsın?',
    a: [
      'Çok düşünmeden küçük bir versiyonunu çıkarıp insanlara göstermeye başlarım.',
      'Bunun ileride ne kadar büyük bir işe dönüşebileceğini düşünürüm.',
      'İnsanların bu problemi daha önce çözmediği farklı bir yol bulmaya çalışırım.',
      'Önce pazarı, rakipleri ve potansiyel müşterileri araştırırım.',
      'Fikrin benim gerçekten iyi olduğum bir alana uyup uymadığına bakarım.',
    ],
  },
  {
    q: 'Bir projede işler beklediğin gibi gitmiyor. Ne yaparsın?',
    a: [
      'Hızlıca başka bir yöntem denerim. Beklemenin anlamı yok.',
      'Hedefi değiştirmem; gerekirse daha fazla çalışıp oraya ulaşmaya devam ederim.',
      'Soruna tamamen farklı bir açıdan bakıp yeni bir çözüm üretmeye çalışırım.',
      'Neden başarısız olduğunu analiz edip yeni bir plan oluştururum.',
      'Bildiğim ve iyi yaptığım kısımlara odaklanıp sistemi adım adım düzeltirim.',
    ],
  },
  {
    q: 'Bir girişimin başarılı olduğunu sana en çok ne hissettirir?',
    a: [
      'Büyük bir fırsatı herkesten önce yakalamak.',
      'Küçük başlayan bir fikri büyük bir şirkete dönüştürmek.',
      'Daha önce kimsenin denemediği bir şeyi ortaya çıkarmak.',
      'Kurduğum sistemin planladığım şekilde çalışması.',
      'İnsanların yaptığım işi kalitesi nedeniyle tercih etmesi.',
    ],
  },
  {
    q: 'Önünde iki seçenek var: Güvenli fakat küçük bir fırsat ve riskli fakat çok büyük bir fırsat. Ne yaparsın?',
    a: [
      'Büyük fırsatı seçerim. Risk almadan büyük sonuç gelmez.',
      'Büyük fırsatı seçerim; çünkü uzun vadede ulaşabileceğim noktayı düşünürüm.',
      'İki seçenekten birini seçmek yerine üçüncü bir yol bulmaya çalışırım.',
      'Rakamları ve riskleri incelemeden karar vermem.',
      'Kontrol edebildiğim ve istikrarlı şekilde ilerleyebileceğim seçeneği tercih ederim.',
    ],
  },
  {
    q: 'Yeni kurduğun girişime 500.000 TL yatırım geldi. İlk önceliğin ne olur?',
    a: [
      'Hemen pazara girip fırsatı mümkün olduğunca hızlı değerlendirmek.',
      'Ekibi büyütüp daha fazla müşteriye ulaşmak.',
      'Ürünü rakiplerden tamamen farklılaştıracak yeni fikirler denemek.',
      'Paranın nasıl kullanılacağını ayrıntılı şekilde planlamak.',
      'Ürünün kalitesini ve mevcut operasyonu sağlamlaştırmak.',
    ],
  },
  {
    q: 'Bir ekipte doğal olarak hangi rolü üstlenirsin?',
    a: [
      '“Hadi yapalım.” diyerek insanları harekete geçiren kişi.',
      'Ekibin hedefini sürekli daha yukarı taşıyan kişi.',
      'Herkes tıkandığında farklı fikirle gelen kişi.',
      'İşleri organize edip neyin ne zaman yapılacağını belirleyen kişi.',
      'Kendi sorumluluğunu sessizce ve sağlam şekilde tamamlayan kişi.',
    ],
  },
  {
    q: 'Rakibin senden önce çok benzer bir ürün çıkardı. Tepkin ne olur?',
    a: [
      'Hızlı davranıp ürünü piyasaya çıkarır ve rekabete girerim.',
      'Daha büyük düşünür, rakibin ulaşmadığı pazarlara yönelirim.',
      'Ürünü insanların karşılaştırmayacağı kadar farklılaştırmaya çalışırım.',
      'Rakibin güçlü ve zayıf yönlerini analiz edip stratejimi yeniden oluştururum.',
      'Rakibi çok takip etmek yerine kendi ürünümü daha iyi hale getirmeye devam ederim.',
    ],
  },
  {
    q: 'Aşağıdaki cümlelerden hangisi seni en iyi anlatıyor?',
    a: [
      '“Bazen önce atlamak, sonra nasıl ineceğini düşünmek gerekir.”',
      '“Bir hedefe ulaştığımda aklımdaki ilk şey bir sonraki hedeftir.”',
      '“Herkes aynı yolu kullanıyorsa başka bir yol olmalı.”',
      '“İyi hazırlanırsam sürprizlerin çoğunu ortadan kaldırabilirim.”',
      '“Hızlı olmaktansa yaptığım işi gerçekten iyi yapmayı tercih ederim.”',
    ],
  },
];

/**
 * @param answers her soru için seçilen arketip anahtarı (8 eleman)
 * İlk 7 soru +1, 8. soru +2. Eşitlikte 8. sorunun arketipi; o eşitler arasında
 * değilse sırasıyla 7., 6., … sorunun cevabı belirleyici olur.
 */
export function score(answers) {
  const scores = Object.fromEntries(ORDER.map((k) => [k, 0]));
  answers.forEach((k, i) => { scores[k] += i === QUESTIONS.length - 1 ? 2 : 1; });
  const max = Math.max(...Object.values(scores));
  const tied = ORDER.filter((k) => scores[k] === max);
  let result = tied[0];
  if (tied.length > 1) {
    for (let i = answers.length - 1; i >= 0; i--) {
      if (tied.includes(answers[i])) { result = answers[i]; break; }
    }
  }
  return { result, scores };
}
