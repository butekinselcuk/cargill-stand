# Cargill Stand Gösterisi — v3 (Resolume 5184×1536, 4 LED yüzü)

v2'nin üzerine:

- **Ekran düzeni → Resolume kompozisyonu (varsayılan):** Kompozisyon **5184×1536**, içinde
  **4 LED yüzü** (her biri 768×1536, X=0'dan bitişik: 0–768, 768–1536, 1536–2304, 2304–3072).
  Yüzlerin sayısı, genişliği, ilk X'i ve aralarındaki boşluk ayarlardan değiştirilebilir.
  Kompozisyonun tamamı bilgisayar ekranına (1920×1080), Resolume'un sığdırmasının tersiyle
  çizilir; LED'de oranlar doğru çıkar.
  - Saat: **her yüze bir saat** (video oynamamış olsa da).
  - **768×1536** video **her yüzde**, **1536×1536** video iki yüze yayılıp tekrarlanır
    (1–2 ve 3–4). Kompozisyon oranındaki bir video (5184×1536) alanın tamamını kaplar.
- **Saat görseli:** "Clean Label" → **Label Friendly**; başlık bloğu yukarıda, iki başlık satırı
  doğal harf aralığıyla ortalı; Cargill logosu her yüzün **sağ alt köşesinde**.
- **Hizalama deseni** (D tuşu): kompozisyon kenarı + her yüz sarı çerçeve, numarası ve X aralığı.

## Resolume ayarı

Yakalama klibi (USB Capture HDMI+, 1920×1080) kompozisyonun **tamamını** kaplamalı:

- Clip **Width 5184**, **Height 1536**, **Position X 0**, **Position Y 0**, Scale %100
- Katman **Opacity %100**, Blend Mode **Alpha**
- Windows: 1920×1080, ölçek %100

## Netlik notu

1920 piksellik yakalama 5184'e yayıldığı için her yüze ~284 piksel düşer ve Resolume bunu 768'e
büyütür; görüntü v2'ye göre yumuşaktır. Yüzler yalnızca 0–3072 aralığındaysa kompozisyon
genişliğini **3072** yapıp Resolume klibini de 3072 genişlikte kurmak netliği artırır (yüz başına
~480 piksel). En net yol: tek yüz (v2 "LED yüzü yan yatık", 768×1536 birebir) gönderip
Resolume'da klibi 4 yüze kopyalamaktır.
