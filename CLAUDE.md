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

### Lock Kuralı
- Kullanıcı bir satır, fonksiyon veya dosya için **"lock"** derse, o bölge kilitlenir.
- Kilitli bölgeye **hiçbir koşulda** dokunma — bug fix, refactor, temizlik dahil.
- Eğer bir görev kilitli bölgeye dokunmayı zorunlu kılıyorsa: göreve başlama, kullanıcıya şunu yaz: `🔒 [dosya:satır] kilitli — devam etmek için izin ver.` ve bekle.
- Kilit, kullanıcı açıkça **"unlock"** veya izin verene kadar geçerlidir.
- Kilitli bölgeler bu dosyada aşağıdaki "Kilitli Bölgeler" tablosunda tutulur.

### Kilitli Bölgeler

| Dosya | Bölge / Satır | Kilitlenme Sebebi |
|-------|--------------|-------------------|
| `frontend/src/App.js` | Satır 113 — `html { cursor: url('.../arrow.svg') 1 1, default !important; }` | `* !important` canvas inline stilini eziyordu; `html` ile düzeltildi — dokunma |
| `frontend/src/components/editor/CanvasArea.js` | Highlighter + Redact overlay sistemi (mouseup listener + savedRange mekanizması, ~760-920. satır arası) | Çalışan sansür sistemi — Zeta sansürlü metni okuyamıyor, export'ta da siyah kutu görünüyor | 
| `frontend/src/components/editor/CanvasArea.js` | `mirror` aracı — tüm mirror/flip mantığı | Kilitlendi, dokunma |
| `frontend/src/components/editor/CanvasArea.js` | `hand` aracı — sürükleme/kaydırma mantığı | Kilitlendi, dokunma |
| `frontend/src/components/editor/CanvasArea.js` | `select` / lasso / rect-select mantığı | Kilitlendi, dokunma |
| `frontend/src/components/editor/ColorPickerPanel.js` | Tüm dosya — renk paneli (checkbox'lar kaldırıldı, gradient dahil) | Kilitlendi, dokunma |
| `frontend/src/components/editor/CanvasArea.js` | `emoji` aracı | Kilitlendi, dokunma |
| `frontend/src/components/editor/CanvasArea.js` | `text` / metin aracı — EditableText ve metin oluşturma mantığı | Kilitlendi, dokunma |
| `frontend/src/components/editor/CanvasArea.js` | `pen` / kalem aracı — çizim mantığı | Kilitlendi, dokunma |
| `frontend/src/components/editor/CanvasArea.js` | `eraser` / silgi aracı — silgi mantığı | Kilitlendi, dokunma |
| `frontend/src/components/editor/CanvasArea.js` | `layers` / katmanlar paneli ve mantığı | Kilitlendi, dokunma |
| `frontend/src/components/editor/CanvasArea.js` | `image` / resim aracı — resim ekleme ve render mantığı | Kilitlendi, dokunma |
| `frontend/src/hooks/useVoice.js` | `startElevenLabsSTT` / `stopElevenLabsSTT` — ses girişi (voice input) mantığı | Kilitlendi, dokunma |
| `frontend/src/hooks/useVoice.js` | `generateTTS` / `fetchVoices` — ElevenLabs seslendirme (TTS) mantığı | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Şekiller paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Hesap makinası paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/RightPanel.js` | Sayfa ekle butonu ve mantığı | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Header/Footer paneli (tek mod: tüm sayfalara uygula, tek/çift kaldırıldı) | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Sayfa rengi paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/PageNumbersPanel.js` | Sayfa numaraları paneli (page/sayfa ön eki kaldırıldı, sadece sayı) | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Çeviri paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/QRCodePanel.js` | QR kod paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Kopyalama (copy) mantığı | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Noktalama işaretleri paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/WatermarkPanel.js` | Watermark paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Zoom paneli | Kilitlendi, dokunma |
| `frontend/src/pages/Editor.js` | Chart animasyonları — pie slice opacity, line stroke-dashoffset, circle r, label fade SMIL animasyonları | Kilitlendi, dokunma |
| `frontend/src/components/editor/PageSizePanel.js` | Tüm dosya — sayfa boyutu paneli (A4 794×1123, oranlar doğru) | Kilitlendi, dokunma |
| `frontend/src/components/editor/CanvasArea.js` | Ruler (cetvel) — SVG tabanlı cm cetveli (yatay + dikey, PX_PER_CM=37.8) | Kilitlendi, dokunma |
| `frontend/src/components/editor/CanvasArea.js` | `knife` aracı — `_extendKnifeLine` + `_splitByKnife`, sadece `type==='shape'` keser | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Kalın/İtalik/Altı çizili (wordtype) paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Font boyutu / punto (textsize) paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Satır aralığı (linespacing) paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Madde imi (bulletlist) paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Numaralı liste (numberedlist) paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Kalem ayarları (draw) paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Tablo (table) paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Izgara (grid) paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Şablonlar (templates) paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Bul & Değiştir (findreplace) paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | PDF içe aktar (importpdf) paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Grafik oluştur (graphic/chart) paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Paragraf stilleri (styles) paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/EditorPanels.js` | Bağlantı (link) paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/CanvasArea.js` | `cut` / kırpma aracı — crop mantığı | Kilitlendi, dokunma |
| `frontend/src/components/editor/CanvasArea.js` | `draw` / serbest çizim aracı — freehand drawing mantığı | Kilitlendi, dokunma |
| `frontend/src/components/editor/FontPanel.js` | Tüm dosya — font seçici paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/ParagraphPanel.js` | Tüm dosya — paragraf paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/IndentPanel.js` | Tüm dosya — girinti paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/MarginsPanel.js` | Tüm dosya — kenar boşlukları paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/ColumnsPanel.js` | Tüm dosya — sütunlar paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/AIImagePanel.js` | Tüm dosya — AI görsel oluşturma (Zeta Colors) paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/PhotoEditPanel.js` | Tüm dosya — AI fotoğraf düzenleme paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/SignaturePanel.js` | Tüm dosya — dijital imza paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/MagnifierPanel.js` | Tüm dosya — büyüteç paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/TOCPanel.js` | Tüm dosya — içindekiler tablosu paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/FootnotePanel.js` | Tüm dosya — dipnot paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/ChatSettingsPanel.js` | Tüm dosya — chat ayarları paneli | Kilitlendi, dokunma |
| `frontend/src/components/editor/SelfTestPanel.js` | Tüm dosya — self test paneli | Kilitlendi, dokunma |

### Asla yapma
- İstenmeden refactor veya "temizlik" yapma
- Düzeltilmesini istemediğin başka şeylere "fırsatçı" dokunma
- Yorum satırı ekleme (WHY açık değilse)
- Özellik eklerken mevcut davranışı değiştirme
- Birden fazla bağımsız değişikliği tek commit'e sıkıştırma

### Dosya büyüklüğü eşikleri
- **Page dosyası > 1500 satır**: Bağımsız modal/panelleri `components/` altına çıkar. Her adımda build al, commit at. State handler'larına dokunma.
- **Component dosyası > 600 satır**: Bölmeyi öner ama kullanıcı onayı olmadan yapma.
- **Bölme sırası**: Her zaman en az prop gerektiren (saf JSX, az state) modal'lardan başla. Core state/handler'lara en son dokun.
- Editor.js için bölme sırası (1→8 yapıldığında yeterli): QR → Watermark → Sayfa boyutu → İmza → AI görsel → Find&Replace → Şablon → Grafik editörü

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

## Dil Kararları

**Varsayılan dil: C++**

Zorunlu olmadıkça her yeni proje, modül veya bağımsız araç C++ ile yazılır. Web versiyonu için hangi teknoloji gerekiyorsa (React, JS, Python vb.) kullanılır — web katmanı bu kuralın dışındadır.

| Proje | Dil |
|-------|-----|
| Web frontend (Dashboard, Editor, vb.) | React / JavaScript |
| Backend API | Python / FastAPI |
| **Diğer her şey (yeni/bağımsız proje, araç, modül)** | **C++** |

> Web dışındaki her yeni proje varsayılan olarak C++ ile başlar. "Zorunlu" istisna: platforma özgü bir SDK sadece başka bir dilde mevcutsa veya kullanıcı açıkça farklı bir dil belirtirse.

---

## Bilinen Sorunlar / Geçmiş Kararlar
- `Dashboard.js` ~3800 satır — 11 modal `components/dashboard/` altına çıkarıldı (CaseOpenModal, OnboardingModal, BoostModal, AISettingsModal, CreditsModal, RanksModal, NotebookPasswordModal, MissionsModal, SubscriptionModal, ConfirmModal, DeleteConfirmModal). Settings (~1845 satır) hâlâ içinde, bölmeye gerek yok.
- `Editor.js` 5568 satır — henüz bölünmedi. Bölme planı CLAUDE.md "Dosya büyüklüğü eşikleri" bölümünde.
- `CanvasArea.js` `contentEditable` için `pendingContentRef` pattern'i kullanılıyor (race condition fix)
- Cloud Run deploy: `--update-env-vars` (değiştirildi, eski `--set-env-vars` env'i siliyordu)
bir simge eklemen gerektiğinde asla emıji kullanma bunun yerine svg kullan