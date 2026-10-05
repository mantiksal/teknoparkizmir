# Nasıl Bir Girişimcisin? — stand deneyimi (v2)

İYTE etkinliği (8–9 Ekim) için Teknopark İzmir standı. Çadır yok, gün ışığında iki monitör:

- **1. monitör:** QR bağlantıları ve arketip dağılımı (sonra yapılacak).
- **2. monitör (bu uygulama):** Öğrenci telefonda testi çözer, sonuç QR'ını ekranın kamerasına
  gösterir. Ekran onu adıyla karşılar, 5 saniyede fotoğrafını çeker ve 30 saniyelik bir
  Teknopark İzmir hikâyesi oynatır. Bu sırada kamera, öğrencinin arketipini anlatan objelerin
  arasından uçar; sonunda objeler bir anda öğrencinin portresine dönüşür. Bitiş ekranında
  "Geleceğin 🔥 FIRESTARTER girişimcisi Yusuf" yazar, Teknogirişim Akademisi daveti ve paylaşım
  QR'ı gösterilir. 15 saniye sonra bekleme ekranına dönülür.

Perspektif takibi yok. Anamorfoz etkisini sanal kamera üretiyor, böylece standın önündeki
herkes aynı anı birlikte görüyor.

## Çalıştırma (stand bilgisayarı)

```sh
cd ~/projects/teknoparkizmir/toptop-v2 && ./start.sh
```

- Stand ekranı açılır: http://localhost:8001/display/ . Tarayıcıda `F` ile tam ekran yapın.
  Kamera izni isterse verin.
- Monitör dikey (9:16) kullanılacak şekilde tasarlandı; yatay ekranda da çalışır.
- Telefon testi GitHub Pages'te yayınlanır. Adresi `display/config.js` içindeki `quizUrl`.
  Yerelde denemek için: http://localhost:8001/quiz/
- Sunucu, terminal açık kaldığı sürece çalışır. `Ctrl+C` ile durur.

| Tuş | İşlev |
|---|---|
| `F` | Tam ekran |
| `T` | Telefonsuz deneme: rastgele arketiple deneyimi başlatır |
| `Esc` | Bekleme ekranına dön |
| `D` | Hata ayıklama bilgisi (fps, durum, QR motoru) |

## Akış ve süreler

Süreler `display/config.js` içinde ayarlanır:

1. **Bekleme:**
   - Ekranda testin QR'ı ve 3 adımlık talimat var.
   - Arka planda beş arketip sırayla kendi koreografileriyle objelerden oluşur.
   - Kamera sürekli sonuç QR'ı arar. Aynı QR 2 dakika içinde tekrar okutulursa yok sayılır.
2. **Karşılama (4 sn):** "Merhaba Yusuf! 👋"
3. **Fotoğraf (5 sn):**
   - Sayım sırasında ekranda yüz çerçevesi görünür.
   - Yüz bulunamazsa 4 saniye daha bekler.
4. **Gösteri (34 sn):**
   - Hikâye metinleri `display/js/story.js` içinde.
   - Objelerin toplanması ve kamera yolu arketipe göre değişir:
     - 🔥 patlayıp geri toplanma
     - ⛰️ aşağıdan tırmanma
     - 🧭 ortadan yol açılması
     - 🗺️ zemindeki haritadan katlanma
     - 🛠️ tek tek yerleşme
5. **Bitiş (15 sn):** arketip başlığı, Akademi daveti ve paylaşım QR'ı.

## Telefon testi (`quiz/`)

Sunucusuz, statik bir sayfa:

- Ad ve KVKK onayı → 8 soru → arketip kartı ve QR.
- QR'ın içinde ad, arketip, puanlar ve onay bilgisi bulunur (`TTZ1.<base64>.<sağlama>`, bkz. `quiz/token.js`).
- Stand ekranı QR'ı okuyup doğrudan çözer; telefon ile stand arasında bir sunucu yok.
- Puanlama ekibin kurallarına göre. Eşitlik durumunda 8. sorunun arketipi kazanır; o eşitler arasında
  değilse 7., 6. … soruya bakılır.

## Instagram paylaşımı

Portrenin telefona ulaşması için internete yüklenmesi gerekiyor. `display/config.js`:

```js
share: { provider: 'supabase', supabaseUrl: 'https://xxx.supabase.co', anonKey: '...', bucket: 'portraits' }
```

- Kurulum: herkese açık bir bucket ve anon rol için yalnızca yükleme (insert) izni verin.
  Dosyaların 7 gün sonra silinmesi için zamanlanmış bir temizlik görevi de kurulmalı.
- Paylaşım ayarı yapılmamışsa (`provider: 'none'`) bitiş ekranındaki QR, arkadaşları teste davet eder.
- Paylaşım açıksa QR `quiz/share.html` sayfasını açar. Öğrenci oradan portresini indirebilir
  ya da telefonun paylaşım menüsüyle doğrudan Instagram'a gönderebilir.
- Yükleme yalnızca testte onay veren katılımcılar için yapılır.

## Dosyalar

- `quiz/`: telefon testi (GitHub Pages'e bu klasör yayınlanır).
  - `quiz-data.js`: sorular, arketipler, puanlama
  - `token.js`: QR içeriği
  - `share.html`: paylaşım sayfası
- `display/`: stand ekranı.
  - `js/app.js`: akış
  - `js/anamorph.js`: obje bulutu ve koreografiler
  - `js/camera-path.js`: kamera yolları
  - `js/story.js`: hikâye metinleri
  - `js/scanner.js`: QR okuma
  - `js/share.js`: paylaşım kartı (1080×1920) ve yükleme
  - `js/vision.js`: yüz bulma ve kırpma, arka plan silme
  - `config.js`: tüm ayarlar
- Kütüphaneler ve modeller `display/vendor/` ve `display/models/` altında; stand internetsiz çalışır.

Hikâye rakamları teknoparkizmir.com.tr ana sayfasından alındı (Ekim 2026). "4. teknopark / 21 kurum"
bilgisi TGBD kaynaklı. Teknogirişim Akademisi güz dönemi: 15–16 Ekim, son başvuru 13 Ekim.
