# Cargill Stand Gösterisi — v3 (Resolume, 4 LED yüzü)

Stant: **4 LED yüzü, her biri 768×1536**, Resolume kompozisyonu 5184×1536 (yüzler soldaki
0–3072 bölgesinde). Görüntü bilgisayardan USB Capture HDMI+ ile **1920×1080** olarak gelir.

## Saat görseli (v2'ye göre)

- "Clean Label" → **Label Friendly**
- Başlık bloğu yukarıda; iki başlık satırı doğal harf aralığıyla, ortalı
- Cargill logosu her yüzün **sağ alt köşesinde**

## Yol A — varsayılan: "Resolume kompozisyonu" (Resolume'da yalnız 2 sayı değişir)

Uygulama 4 yüzün kapladığı **3072×1536** bölgeyi ekranın tamamına, Resolume'un sığdırmasının
tersiyle çizer; her yüze bir saat, 768×1536 video her yüzde oynar.

Resolume, yakalama klibi (kurulum ekranı bu değerleri kendisi de gösterir):

- **Width 3072**, **Height 1536**, **Position X −1056**, **Position Y 0**, Scale %100
- Katman **Opacity %100**, Blend Mode **Alpha**

Netlik: yüz başına **480×1080** yakalama pikseli (5184 ayarında 284'tü).

## Yol B — en net: "LED yüzü yan yatık" (tek yüz birebir, Resolume 4 yüze çoğaltır)

4 saat birebir aynı olduğu için tek bir yüz (768×1536) hiç ölçeklenmeden, 90° çevrilmiş olarak
ekranın sol üstüne **1536×768** çizilir. Netlik birebir (768×1536).

Resolume:

1. Yakalama klibini kompozisyona **doğal boyutunda** koyun: Width 1920, Height 1080, ölçek %100.
2. **Advanced Output**'ta 4 slice: her birinin *Input Selection*'ı klibin sol üst
   **1536×768** bölgesi, çıkışta **90°** döndürülmüş, her biri bir LED yüzüne (768×1536).
3. Uygulamada **Hizalama deseni**ni (D) açın; "▲ ÜST" her yüzde yukarı bakana kadar döndürmeyi
   ayarlayın, sonra deseni kapatın.

Windows: 1920×1080, ölçek **%100**.
