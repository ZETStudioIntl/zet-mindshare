# Zet Mindshare — Claude Çalışma Kuralları

## Proje Nedir
React (frontend) + FastAPI (backend) + MongoDB + Google Cloud Run.  
Belge/not editörü, canvas araçları, AI asistanlar (Zeta, Judge), rank/sezon/envanter sistemi, abonelik (Lemon Squeezy).

## Mimari Özet
```
frontend/src/
  pages/
    Dashboard.js        ← ana shell, ayarlar, rank, envanter, zeta analizi
    Editor.js           ← döküman editörü
    JudgeDashboard.js   ← Judge AI chat
    QuestMap.js         ← görev haritası
  components/
    editor/
      CanvasArea.js     ← canvas araçları (çizim, metin, şekil, tablo, grafik...)
      RightPanel.js     ← sağ panel (özellikler)
      Toolbox.js        ← araç çubuğu
  lib/
    editorConstants.js  ← TOOLS tanımları ve DEFAULT_SHORTCUTS
backend/
  server.py             ← TÜM endpoint'ler tek dosyada
.github/workflows/
  deploy-backend.yml    ← Cloud Run deploy
  deploy-frontend.yml   ← Firebase Hosting deploy
```

---

## Düzenleme Kuralları

### Her task öncesi zorunlu
1. Hangi dosyaya dokunacağını söyle
2. O dosyanın ilgili bölümünü oku (Read tool)
3. Başka dosyaya dokunma

### Dosya bazlı kısıtlamalar

| Dosya | Ne zaman dokunulur |
|-------|--------------------|
| `CanvasArea.js` | Sadece canvas/araç bug'ı veya canvas özelliği |
| `server.py` | Sadece backend endpoint değişikliği istendiğinde |
| `deploy-backend.yml` | Sadece deploy/CI değişikliği istendiğinde |
| `deploy-frontend.yml` | Sadece deploy/CI değişikliği istendiğinde |
| `Dashboard.js` | Sadece dashboard özelliği istendiğinde, minimum bölge |
| `lib/editorConstants.js` | Sadece tool tanımı/kısayol değişikliği |

### Asla yapma
- İstenmeden refactor veya "temizlik" yapma
- Düzeltilmesini istemediğin başka şeylere "fırsatçı" dokunma
- Yorum satırı ekleme (WHY açık değilse)
- Özellik eklerken mevcut davranışı değiştirme
- Birden fazla bağımsız değişikliği tek commit'e sıkıştırma

---

## Canvas Araçları (TOOLS)
`lib/editorConstants.js` içinde tanımlı. Araç ekleme/değiştirme bu dosyadan yapılır.  
CanvasArea.js içindeki render/davranış mantığı ayrıdır — ikisine aynı anda dokunmak gerekiyorsa önce söyle.

## Backend Endpoint Kuralları
- Yeni endpoint eklenince `deploy-backend.yml`'daki ENV_VARS listesi kontrol edilmeli
- `--update-env-vars` kullan, `--set-env-vars` ASLA (Cloud Run env'i siler)
- Lemon Squeezy API key: `.strip()` uygulanmış olmalı

## Commit Kuralları
- Türkçe commit mesajı
- Konu: `feat:` / `fix:` / `refactor:` / `chore:`
- Her commit tek bir iş yapmalı

---

## Bilinen Sorunlar / Geçmiş Kararlar
- `Dashboard.js` 2500+ satır monolith — aşamalı olarak component'lere bölünecek
- `CanvasArea.js` `contentEditable` için `pendingContentRef` pattern'i kullanılıyor (race condition fix)
- Cloud Run deploy: `--update-env-vars` (değiştirildi, eski `--set-env-vars` env'i siliyordu)
