# Bitki Tanıma Uygulaması

Telefonda rahat kullanılan bir web uygulaması: fotoğraf çek veya yükle, Gemini bitkiyi tanısın, bakım bilgilerini göstersin.

## Ekranlar
1. **Ana sayfa** – Büyük "Fotoğraf Çek" (telefon kamerasını açar) ve "Galeriden Yükle" butonları, kısa açıklama.
2. **Sonuç sayfası**
   - Yüklenen fotoğraf büyük şekilde
   - Bitkinin yaygın adı, bilimsel adı, familyası, güven oranı
   - Bakım kartları: sulama sıklığı, ışık ihtiyacı, sıcaklık, nem, toprak, gübreleme, budama, çoğaltma
   - Zehirlilik (evcil hayvan / çocuk), sık görülen hastalıklar ve zararlılar, kısa bilgi
   - "Yeni Bitki Tara" butonu
3. **Geçmiş** – Daha önce taranan bitkiler telefonda saklanır (hesap gerekmez), tıklayınca sonuç tekrar açılır.

## Tasarım
Doğal, yeşil tonlarda sıcak bir görünüm; mobil öncelikli, alt menülü, büyük dokunma alanları. Tüm metinler Türkçe.

## Gemini anahtarı
- Gemini anahtarınızı güvenli şekilde saklanacak alana girmeniz istenecek; anahtar asla tarayıcıya gönderilmez, analiz sunucu tarafında yapılır.
- Not: Aynı Gemini modelleri Lovable içinde zaten hazır; ayrı anahtar gerekmeden, kullanım kaydı ve limitlerle çalışma alanı kredilerinden ücretlendirilir. İsterseniz sonradan kolayca geçiş yapılabilir. Siz söylemedikçe kendi anahtarınızla kuracağım.

## Teknik detaylar
- Sunucu fonksiyonu: görseli base64 alır, Google Gemini API'ye (`GEMINI_API_KEY`) görsel + JSON şema ile istek atar, yapılandırılmış sonuç döner.
- Görsel istemcide küçültülür (~1024px) ve doğrulanır.
- Geçmiş localStorage'da (küçük önizleme ile) tutulur.
- Hata durumları (bitki bulunamadı, kota, geçersiz anahtar) Türkçe mesajla gösterilir.
- Her sayfa için başlık/açıklama meta bilgileri.
