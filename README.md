# Cargill Stand Gösterisi

Standdaki ekranda **video → saat → video → saat** şeklinde sonsuz döngü çalıştırır.
Saat ekranı Cargill posterinin birebir aynısıdır; akrep, yelkovan ve saniye ibresi
bilgisayarın saatini canlı gösterir ve **tasarımdaki ışık huzmesi ibrelerle birlikte
döner**. Ekranda tarayıcı arayüzü görünmez — her şey video gibi tam ekran akar.

---

## Hızlı başlangıç

1. **BASLAT.bat** dosyasına çift tıklayın.
   (Node.js kurulu olmalı: <https://nodejs.org> → LTS)
2. Açılan ekranda videoları sürükleyip bırakın **veya** `media/` klasörüne kopyalayıp
   *"media/ klasörünü tara"* düğmesine basın.
3. **Saat ekranda kalma süresi**ni saniye cinsinden yazın (örn. 15).
4. **GÖSTERİYİ BAŞLAT** → tam ekran döngü başlar.

Kapatmak: `ALT+F4` · Ayar ekranına dönmek: `ESC`

---

## Ekranlar ve ayarlar

| Ayar | Açıklama |
|---|---|
| **Saat ekranda kalma süresi** | Her videodan sonra saatin kaç saniye görüneceği |
| **Geçiş yumuşatma** | Video↔saat geçişindeki çapraz geçiş süresi (ms). `0` = sert kesme |
| **Video ekrana oturma** | `Ekranı doldur` (kenarlardan kırpar) veya `Tamamı görünsün` |
| **Saat görseli oturma** | Poster dikey (7:10) olduğu için yatay ekranda `Tamamı görünsün` önerilir; kenarlar posterin kendi koyu yeşiliyle (#032A15) dolar, kesme yeri belli olmaz |
| **Sıra** | Videolar sırayla veya karışık oynatılır |
| **Video sesi açık** | Kapalıysa videolar sessiz oynar |
| **Saniye ibresi** | Tasarımdaki açık yeşil ince ibre. Kapatılırsa hem ibre hem de ona bağlı ışık huzmesi kalkar |
| **Işık huzmesi ibreleri takip etsin** | **Varsayılan: kapalı.** Açılırsa kadrandaki aydınlık dilim yelkovan ve saniye ibresinin arkasından süzülür (orijinal tasarımdaki efektin canlısı) |
| **Akıcı ibre hareketi** | Açık: ibreler kaymadan akar. Kapalı: saniyede bir tık atar |

Ayarlar ve video listesi bilgisayarda saklanır — program kapanıp açılsa da korunur.

---

## Kurulumda dikkat edilecekler (stand)

- **Ekran uykusu:** Gösteri sırasında uygulama ekranın uyumasını engeller (Wake Lock).
  Yine de Windows'ta *Ayarlar → Sistem → Güç* altında ekranı kapatma süresini **Asla**
  yapın ve ekran koruyucuyu kapatın.
- **Otomatik başlatma:** `BASLAT.bat` kısayolunu `shell:startup` klasörüne koyarsanız
  bilgisayar açıldığında gösteri kendiliğinden hazır gelir. Videolar `media/` klasöründe
  duruyorsa liste otomatik yüklenir; tek yapılacak **GÖSTERİYİ BAŞLAT**'a basmaktır.
- **Video formatı:** En stabil sonuç için **MP4 (H.264 + AAC)**. 4K yerine ekran
  çözünürlüğünde (örn. 1920×1080) verilmiş dosyalar takılma riskini sıfırlar.
- **Ses:** Videoda ses varsa ve "Video sesi açık" işaretliyse ilk oynatma
  **GÖSTERİYİ BAŞLAT** tıklamasıyla yetkilenir; sonraki döngülerde sorun çıkmaz.
- Video takılır ya da bozuksa uygulama kendini toparlar: 8 saniye ilerlemeyen video
  atlanır, açılamayan dosya için saate geçilip sıradakine geçilir. Döngü asla durmaz.

---

## Dosyalar

```
show/
  index.html        arayüz + saat SVG'si (ibre geometrisi burada)
  app.js            döngü motoru, saat, kalıcı ayarlar
  style.css         görünüm
  server.js         yerel sunucu (bağımlılık yok)
  BASLAT.bat        sunucu + tam ekran tarayıcı başlatıcı
  assets/poster.jpg      saat görseli — ibresiz, ışığı düzlenmiş kadran (1728×2468)
  assets/beam-mask.png   ışık huzmesinin nereye ne kadar vuracağını taşıyan maske
  assets/logo.png        Cargill logosu (ibrelerin üstünde kalması için)
  media/            (isteğe bağlı) videoları buraya da koyabilirsiniz
```

### Saat görseli ve ışık efekti nasıl üretildi
Kaynak: **`saatsiz.jpeg`** (1728×2468) — ibreleri temizlenmiş poster.

1. **Kadran merkezi ve yarıçapı ölçüldü.** Disk kenarı 720 açıda alt piksel
   hassasiyetiyle bulunup daire uyduruldu: merkez **(861.35, 1427.66)**, disk
   yarıçapı **426.3 px** (artık sapma 0.9 px).
2. **Zemindeki sabit ışık düzlendi.** Editörün kadrana bıraktığı yumuşak üst
   aydınlatma, kaseler ve logo korunarak (5. derece polinom ışık alanı) çıkarıldı;
   kadran orijinaldeki gibi "ışıksız" hale getirildi.
3. **Işık huzmesi çalışma anında üretiliyor.** Orijinal `saat.jpeg` ölçülerek
   huzmenin matematiği çıkarıldı: ışık rengi **#FFE8A1**, tepe yoğunluk **0.36**,
   açısal profil ~**115°** boyunca sönümleniyor, merkeze doğru zayıflıyor. Bu profil
   bir konik gradyan olarak yelkovan ve saniye ibresinin açısına kilitlendi; maske
   hem diski kırpıyor, hem yarıçap profilini uyguluyor, hem de kaselerin üzerinde
   ışığı %22'ye indiriyor. Ekran kartında çalıştığı için maliyeti yok (144 FPS).
4. **İbreler SVG.** Kalınlık **10.2 px**, akrep **124.4 px**, yelkovan **174.9 px**
   (orijinalden ölçülüp 1.92857 ölçekle taşındı). Vektör oldukları için 4K ekranda
   da kesin net çıkarlar.
5. **Cargill logosu ibrelerin üstünde** ayrı bir katman; hiçbir saatte ibre altında
   kalmaz.

> **Daha keskin görüntü:** Elinizde posterin yüksek çözünürlüklü orijinali (PDF/PNG/AI)
> varsa `assets/poster.jpg` onunla değiştirilebilir. Yeni dosya **aynı çerçeveleme ve
> en-boy oranında** olmalı; farklıysa merkez/yarıçap ölçüsü bir kez yeniden alınır
> (index.html içindeki `viewBox` ve ibre koordinatları ile `app.js` içindeki
> `CX/CY` değerleri).
