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

`start.sh`, video için Range desteği olan küçük bir yerel sunucu (`server.py`) başlatır.

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

## Görsel kimlik

- Logolar teknoparkizmir.com.tr'deki resmi dosyalardan (`.ai`/`.pdf`) üretildi: `display/assets/brand/`.
  Koyu zeminde okunsun diye Teknopark logosunun yazısı açık renge çevrildi (`teknopark-logo-light.png`).
- Renkler Teknopark logosundan: yeşil `#74BC20`, mavi `#5C8CC8`, turuncu `#EC7C00`, gri `#586470`.
- Objeler gerçek 3B: her çizimin silüeti kalınlık ve yuvarlatılmış kenarla kabartılır (`display/js/objects3d.js`).
  Işık ve yansımalar sahnede. İYTE mührü ve Teknopark sembolü de 3B "kahraman" obje olarak uçar.
- Sürpriz korunur: bekleme ekranı objelerden hiçbir şey göstermez; portre ilk kez deneyim sırasında görülür.

## Tanıtım videosu

`iyte-tanitim.mp4` yalnızca bekleme ekranında, ortadaki büyük çerçevede sessiz ve döngüde oynar.
Her açılışta rastgele bir saniyeden başlar. Deneyim başlayınca durur, bekleme ekranına dönünce devam eder.

- Ekran hafif kopyayı kullanır: `display/media/iyte-tanitim-540p.mp4`. Yoksa kök dizindeki orijinal dosya denenir.
- Videolar büyük olduğu için (318 MB) **repoya girmez** (`.gitignore`). Stand bilgisayarına elle kopyalayın.
- Hafif kopyayı yeniden üretmek için:
  `avconvert --source iyte-tanitim.mp4 --preset Preset960x540 --output display/media/iyte-tanitim-540p.mp4 --replace`
- Videoyu kapatmak için `display/config.js` içinde `promoVideo: null`.

## Akış ve süreler

Süreler `display/config.js` içinde ayarlanır:

1. **Bekleme:**
   - Dev başlık, ortada tanıtım videosu, testin QR'ı ve 3 adımlık talimat var ("…gerisi sürpriz!").
   - Video çerçevesinin köşesindeki gerçek kamera penceresi QR'ı hedeflemek için kullanılır.
   - Kamera sürekli sonuç QR'ı arar. Aynı QR 2 dakika içinde tekrar okutulursa yok sayılır.
2. **Karşılama (4 sn):** "Merhaba Yusuf! 👋"
3. **Fotoğraf (5 sn):**
   - Dairesel bir geri sayım ve yüz çerçevesi görünür. Yüz bulununca çerçeve yeşile döner.
   - Yüz bulunamazsa 3 saniye daha bekler.
   - Görüntü işleme 6 saniyede bitmezse, deneyim MediaPipe'sız yedek kırpmayla devam eder.
   - Herhangi bir hazırlık aşaması 25 saniyeyi aşarsa ekran kendiliğinden bekleme ekranına döner (bekçi).
4. **Gösteri (34 sn):**
   - Hikâye metinleri `display/js/story.js` içinde. Yazılar, objelerin önünde okunsun diye ortalanmış,
     bulanık arka planlı bir bantta görünür.
   - Objelerin toplanması ve kamera yolu arketipe göre değişir:
     - 🔥 patlayıp geri toplanma
     - ⛰️ aşağıdan tırmanma
     - 🧭 ortadan yol açılması
     - 🗺️ zemindeki haritadan katlanma
     - 🛠️ tek tek yerleşme
5. **Bitiş (15 sn):** "Geleceğin 🔥 FIRESTARTER girişimcisi Yusuf" unvanı ve ardından konfetiyle gelen
   **Teknogirişim Akademisi davetiyesi**: kişiye özel davetiye numarası, tarih, yer, son başvuru ve
   başvuru sayfasına giden QR. Davetiye bilgileri `display/config.js` → `academy`.

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
