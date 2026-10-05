# İYTE Anamorfoz Portre — prototip

Standda çekilen öğrenci portresi, yüzlerce akademik/İYTE objesinden oluşan sanal bir
3B bulut olarak perdeye yansıtılır. Perdedeki kamera izleyicinin başını takip eder ve
görüntüyü onun bakış açısına göre çizer (head-tracked off-axis projection). Objeler
yalnızca yerdeki **sihirli noktadan** bakıldığında hizalanıp portreyi oluşturur.

## Çalıştırma

Çadır bilgisayarında bir terminal açıp şunu çalıştırın:

```sh
cd ~/projects/teknoparkizmir/toptop-v1 && ./start.sh
```

- Çadır ekranı tarayıcıda otomatik açılır: http://localhost:8000
- Terminal, stand tabletinin açacağı adresi de yazar (`http://<bilgisayar-ip>:8000/stand.html`).
  Bu adres ağa göre değişir; etkinlik günü çadırdaki Wi-Fi'ye bağlandıktan sonra terminalden okuyun.
- Tablet ve çadır bilgisayarı aynı Wi-Fi'de olmalı; internet gerekmez.
- İlk çalıştırmada macOS gelen bağlantılara izin isteyebilir, "İzin ver" deyin.
- Sunucu, terminal açık kaldığı sürece çalışır. Durdurmak için terminalde `Ctrl+C`'ye basın.
  Terminali kapatırsanız çadır ekranı ve tablet bağlantısı da kapanır.
- Kod değiştiyse çadır ekranını **Cmd+Shift+R** ile yenileyin (önbelleği atlar).

## Akış

1. **Stand (tablet):** KVKK onayı → isim (isteğe bağlı) → 8 soruluk "Nasıl bir girişimcisin?"
   testi → fotoğraf (tabletin kamera uygulaması) → sıra numarası. Sonuç standda gösterilmez.
2. **Çadır:** Görevli panelden kişiyi seçer ya da `N` ile sıradakini çağırır. Portre, kişinin
   arketipine ait objelerle kurulur. Sihirli noktada portre oturunca arketip başlığı belirir.
3. **Etkinlik sonu:** Paneldeki "Tüm verileri sil" (iki kez basılır) tüm fotoğraf ve cevapları siler.
   Veriler yalnızca bu bilgisayarda, `data/visitors/` altında tutulur.

## Kullanım

| Tuş | İşlev |
|---|---|
| `1` | Otomatik demo: sanal bir ziyaretçi kapıdan girip sihirli noktaya yürür |
| `2` | Fare: fareyle bakış noktasını gezdir, tekerlek = mesafe |
| `3` | Kamera takibi |
| `N` | Sıradaki katılımcıyı göster |
| `Space` | 3-2-1 sayımla portre çek (sırasız deneme) |
| `R` | Obje dağılımını yeniden karıştır |
| `H` | Arayüzü gizle (sunum modu) · `F` tam ekran |

**Laptopta deneme:** Ön ayar "Laptop ekranı", takip "Yüz". Portreyi çekin, `3`e basın,
ekrandan ~55 cm uzakta tam karşıya oturun. Başınızı sağa sola oynatınca objeler dağılır,
ortaya gelince portre oturur. Tek gözü kapatınca derinlik hissi belirgin şekilde artar.
"Perde genişliği"ni ekranınızın gerçek genişliğine (cm) göre ayarlayın.

## Çadır kurulumu (3×3 m)

- Ön ayar **Çadır**: perde 260 cm genişlik, sihirli nokta perdeden 170 cm uzakta.
  Kamera perdenin üst ortasında, ~10° aşağı bakıyor; takip **Vücut** (1–4 m çalışır).
- Sihirli noktayı yere bant/çıkartma ile işaretleyin.
- **Kalibrasyon:** Biri sihirli noktada dursun. HUD'daki göz koordinatı sihirli noktayla
  (x≈0, z≈170) örtüşene kadar *Mesafe ölçeği* ve *Kamera eğimi* ayarlarını değiştirin.
  Sağa adım atınca x artmıyorsa *X eksenini ters çevir* seçeneğini işaretleyin.
- **Boya göre uyarla** açıkken sihirli noktanın yüksekliği gelen kişinin göz hizasına uyar.
- **Mıknatıs**: Sihirli noktaya yaklaşan kişinin görüntüsü noktaya "yapışır". Takipteki
  titreme yüzünden portre bozulmaz.
- Sadece en yakındaki kişi takip edilir. İçeri aynı anda tek kişi alınması önerilir.

## Obje ekleme

`assets/objects/` klasörüne PNG koyun (şeffaf arka planlı logolar en iyisi) ve
`manifest.json`a ekleyin. Şu an hazır bekleyen girdiler şunlar:

- `iyte-logo.png` → İYTE yer tutucu rozetinin yerine geçer
- `teknopark-izmir-logo.png` → Teknopark yer tutucusunun yerine geçer
- `rektor-yusuf-baran.png` → Rektör fotoğrafı (kahraman obje)

Alanlar: `hero: true` olan objeler büyük ve seyrek kullanılır, bulutun arka tarafına yerleşir.
`tint` (0–1) objenin portre rengine ne kadar boyanacağını belirler. `weight` seçilme sıklığıdır.
`set` (`acad` ya da bir arketip anahtarı) ve `shape` (`round`, `long`, `block`, `other`) objenin
nerede kullanılacağını belirler.

## Objeler nasıl seçiliyor?

- **Boyut hiyerarşisi:** Portre renk farkına göre bölünür. Düz alanlara büyük, göz/dudak gibi
  detaylı yerlere küçük obje gelir. Obje sayısı panelden ayarlanır.
- **Yüz bölgeleri:** Gözlere yuvarlak objeler (pusula, büyüteç, küre), kaşlara uzun objeler
  (kalem, cetvel), dudaklara kitaplar, saça ve gövdeye karışık objeler.
- **Kenar yönü:** Uzun objeler yüzdeki çizgilerin yönüne döner.
- **Arketip:** Ortak akademik objelere kişinin arketip objeleri karışır
  (🔥 roket, şimşek, kronometre · ⛰️ dağ, bayrak, kupa · 🧭 pusula, yapboz, tabela ·
  🗺️ harita, dürbün, satranç atı · 🛠️ anahtar, tornavida, madalya). Arka plan arketip renginde.
- **Kimlik korunur:** Obje gövdesi portre rengine boyanır, ama beyaz sayfalar, siyah yazılar,
  metal parçalar ve dış çizgi sabit kalır.
- **Fiziksel his:** Objelerin kalınlığı ve bir kısmının askı teli var. Yandan bakınca hacim belli olur.

Yerleşik objeler `js/objects.js` içinde prosedürel olarak çiziliyor.

## Dosyalar

- `js/main.js`: arayüz, modlar, döngü, kalibrasyon
- `js/anamorph.js`: portre → obje bulutu yerleşimi, off-axis projeksiyon
- `js/vision.js`: MediaPipe portre kırpma/arka plan silme, kafa takibi, One Euro filtresi
- `js/objects.js`: obje kütüphanesi
- `js/quiz.js`: test soruları, arketipler, puanlama
- `stand.html`, `js/stand.js`: tablet akışı
- `server.py`: yerel sunucu + ziyaretçi sırası
