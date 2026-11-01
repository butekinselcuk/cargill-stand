# Cargill Stand Gösterisi — v2 (Resolume için birebir piksel)

v1 ile aynı gösteri (video → saat döngüsü), farkları:

- **Ekran düzeni → Resolume 1536×1536 (varsayılan, önerilen):** Stanttaki Resolume, bilgisayar
  ekranının **tamamını** (1920×1080) iki LED yüzüne (1536×1536) sığdırıyor (Clip: Width 1536,
  Height 1536). Bu modda iki yüzlük alan ekrana o sığdırmanın tersiyle çizilir; LED'de oranlar
  doğru çıkar, **basıklık ve boşluk olmaz**. Resolume'da ayar değiştirmek gerekmez.
  - Saat: **her yüze bir saat** (768×1536 + 768×1536), video oynamamış olsa da.
  - **768×1536** (tek yüz) video **iki yüzde birden** oynar; **1536×1536** video iki yüze yayılır.
  - **Saat büyütme** (%100–115, varsayılan %112): yandaki yeşil boşluk azalır, yazı/logo kesilmez.
  - Bilgisayar ekranında görüntü yatay basık görünür; bu bilerek böyle (Resolume düzeltir).
  - Resolume'da o katmanın **Opacity'si %100**, Blend Mode **Alpha** olmalı (%50 + Add soluk gösterir).
- **Ekran düzeni → LED yüzü yan yatık:** Bir LED yüzü (768×1536) bilgisayar ekranının
  sol üstüne 90° döndürülmüş olarak **1536×768** çizilir. Video ve saat **hiç ölçeklenmez**;
  1920×1080 çıkışa ve yakalama kartına sığar. Resolume bu bölgeyi alıp 90° geri döndürerek LED
  yüzlerine eşler. İki yüzde aynı saat istendiği için aynı bölge iki yüze de verilir.
- **Hizalama deseni:** Ayarlardan ya da gösteri sırasında **D** tuşuyla açılır. Yüzün kenarları,
  köşegenler, 128 px ızgara ve **ÜST / ALT / SOL / SAĞ** yazıları görünür; Resolume'da kesim ve
  döndürme bununla ayarlanır, sonra desen kapatılır.
- **Saat ekranı = videonun alanı:** Saat ekranı, videonun ekranda kapladığı alanın **aynısını**
  kaplar (Resolume o alanı LED'e eşlediği için saat de videoyla aynı yere ve orana oturur).
  **Saat sayısı → Otomatik (varsayılan):** iki ekranlık video (**1536×1536**) → alan ikiye bölünür,
  her yüze bir saat (768×1536 + 768×1536); tek ekranlık video (**768×1536**) → tek saat.
- **Saat zemini:** Cargill Deep Green (#03441F) ile pürüzsüz yeniden üretildi (lekesiz).
- Ayarlar v1'den ayrı saklanır (aynı bilgisayarda ikisi karışmaz). BASLAT.bat portu **8788**.

## Stant ayarı (kısa)

1. Windows: çözünürlük **1920×1080**, ölçek **%100**.
2. BASLAT.bat → videoyu seç → Ekran düzeni: **LED yüzü yan yatık**, yüz 768×1536, X=0, Y=0,
   döndürme: saat yönünde → **Hizalama deseni** açık → GÖSTERİYİ BAŞLAT.
3. Resolume: yakalama kaynağı **1920×1080**. Kaynakta sol üst **1536×768** bölgeyi kesip
   **90° saat yönünün tersine** döndürün (desendeki "▲ ÜST" yukarı baksın), her LED yüzüne
   768×1536 olarak, ölçek **%100** ile yerleştirin.
4. Hizalama tamamsa **D** ile deseni kapatın.

Video ve saat bu yolda LED'e birebir gider; kalite, videonun doğrudan Resolume'da oynatılmasına
çok yakındır (yalnızca yakalama kartının renk sıkıştırması kalır).
