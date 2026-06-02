# Notpas

Not alma ve alışkanlık takibi için minimalist, mobil öncelikli uygulama. React + Vite ile geliştirilmiş, Capacitor aracılığıyla Android APK olarak da derlenebilir.

## Özellikler

**Notlar**
- Başlık, içerik ve renk etiketiyle not oluşturma
- Klasörlerle gruplama ve renk kodlama
- Nota tarih aralığı atama (takvim paneli)
- Tam metin arama
- Sola/sağa kaydırma ile hızlı klasör veya takvim erişimi

**Alışkanlıklar & Görevler**
- Bir kerelik, günlük, hafta içi, haftasonu veya günde X kez tekrar seçenekleri
- Tam ekran alarm + öncesinde yumuşak bildirim (kaç dakika önce istenirse)
- Tamamlanmamış görevler için otomatik ceza sistemi (2 saatlik esneme süresi)
- Haftalık takvim görünümü

**Puan & Seri Sistemi**
- Görev tamamlama ve kaçırma puanı etkiler
- Günlük seri ve maksimum seri takibi
- İstatistik ekranında görsel grafik

**Temalar**
Açık, Koyu, AMOLED, Sıcak, Orman, Okyanus, Gece Yarısı, Gül, Gri, Sepia — 10 tema

**Listeler**
Panelden bağımsız, serbest biçimli liste yönetimi

## Teknoloji

| Katman | Araç |
|---|---|
| UI | React 18, Framer Motion |
| Build | Vite 5, vite-plugin-pwa |
| Native | Capacitor 8 (Android) |
| Bildirimler | `@capacitor/local-notifications` + AlarmPlugin |
| Grafikler | Recharts |
| Jestürler | @use-gesture/react |

## Kurulum & Geliştirme

```bash
npm install
npm run dev       # http://localhost:5173
```

## Build

```bash
npm run build     # dist/ klasörü oluşturulur
```

## Android APK

```bash
npm run build
npx cap sync android
# Android Studio ile aç ve çalıştır
```

> Bildirim ve alarm özellikleri yalnızca Android native ortamında çalışır; web ortamında sessizce devre dışı kalır.

## Veri Depolama

Tüm veriler (notlar, klasörler, görevler, puan) tarayıcının `localStorage` alanında tutulur. Uygulama tamamen çevrimdışı çalışır; sunucu ya da hesap gerekmez.
