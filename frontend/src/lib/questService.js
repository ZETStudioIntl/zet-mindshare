import { buildDailyQuests, QUEST_REQ } from './questData';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ─── Klavye satır haritası (TR-Q) ────────────────────────────────────────────
const _ROWS = [
  'qwertyuıopğü',
  'asdfghjklşi',
  'zxcvbnmöç',
];
const _ROW_IDX = {};
_ROWS.forEach((row, ri) => {
  for (let ci = 0; ci < row.length; ci++) _ROW_IDX[row[ci]] = ri;
});

// ─── Random metin skoru (0 = tamamen random, 1 = gerçek metin) ───────────────
// Kullanılan sinyal seti:
//   1. Ünlü oranı (Türkçe %30-55 arası)
//   2. Tek klavye satırından gelme oranı (>%75 → klavye sıralama)
//   3. Ardışık sesli harf eksikliği (>5 ünsüz üst üste → imkânsız)
//   4. Tekrarlayan iki-karakter örüntüsü (ababab → mekanik)
//   5. Ardışık klavye komşuları (qwerty/asdf sürükleme)
export function scoreWordBuffer(chars) {
  if (chars.length < 18) return 1; // analiz için yetersiz, geçir

  const text   = chars.join('').toLowerCase();
  const letters = text.replace(/[^a-zçğışöüı]/g, '');
  if (letters.length < 12) return 1;

  const n = letters.length;
  let score = 1.0;

  // 1. Ünlü oranı
  const vowels = (letters.match(/[aeıioöuüi]/g) || []).length;
  const vr = vowels / n;
  if (vr < 0.10) score -= 0.50;       // neredeyse sırf ünsüz
  else if (vr < 0.18) score -= 0.25;
  else if (vr > 0.72) score -= 0.30;  // neredeyse sırf ünlü

  // 2. Tek klavye satırı hâkimiyeti
  const rowCounts = [0, 0, 0];
  for (const c of letters) {
    const ri = _ROW_IDX[c];
    if (ri !== undefined) rowCounts[ri]++;
  }
  const maxRow = Math.max(...rowCounts) / n;
  if (maxRow > 0.80) score -= 0.40;
  else if (maxRow > 0.65) score -= 0.20;

  // 3. Ardışık ünsüz akımı (>5 üst üste → Türkçede yok)
  const consonantStreaks = letters.split(/[aeıioöuüi]+/);
  if (consonantStreaks.some(s => s.length > 5)) score -= 0.35;

  // 4. Tekrarlayan çift örüntüsü (ababab, xyzxyz)
  let altHits = 0;
  for (let i = 2; i < text.length; i++) {
    if (text[i] === text[i - 2]) altHits++;
  }
  if (altHits / text.length > 0.65) score -= 0.35;

  // 5. Ardışık klavye komşuları (örn. "asdfjkl" hepsi aynı satır komşu)
  let adjHits = 0;
  for (let i = 1; i < letters.length; i++) {
    const prev = _ROW_IDX[letters[i - 1]];
    const curr = _ROW_IDX[letters[i]];
    if (prev !== undefined && curr !== undefined && prev === curr) adjHits++;
  }
  if (adjHits / (letters.length - 1) > 0.75) score -= 0.25;

  return Math.max(0, Math.min(1, score));
}

// ─── Görev eşikleri ve isimleri ──────────────────────────────────────────────
const _THRESHOLDS = {
  words_typed:    [50, 150, 500, 1500],
  editor_minutes: [10, 25, 45, 90],
  notes_created:  [10, 25, 50, 100],
  solo_docs:      [1, 3, 7, 15],
  memories_added: [5, 15, 35, 75],
};

const _NAMES = {
  words_typed:    { 50: '50 Kelime Yaz', 150: '150 Kelime Yaz', 500: 'Günlük Yazar', 1500: 'Kalem Ustası' },
  editor_minutes: { 10: '10 Dk Editörde', 25: '25 Dk Editörde', 45: 'Editör Maratonu', 90: 'Uzun Mesai' },
  notes_created:  { 10: '10 Not Oluştur', 25: '25 Not Oluştur', 50: '50 Not Oluştur', 100: '100 Not Oluştur' },
  solo_docs:      { 1: 'Kendi Başına', 3: '3 Bağımsız Belge', 7: '7 Bağımsız Belge', 15: 'Saf Üretkenlik' },
  memories_added: { 5: '5 Bellek Ekle', 15: '15 Bellek Ekle', 35: '35 Bellek Ekle', 75: '75 Bellek Ekle' },
};

// Her görev tipi için geçerli sayfa bağlamı
const _FIELD_PAGE = {
  words_typed:    'editor',
  editor_minutes: 'editor',
  solo_docs:      'editor',
  notes_created:  'dashboard',
  memories_added: 'dashboard',
};

// Oturum başındaki counter durumu — yanlış tetiklenmeyi önler
let _prev        = {};
let _initialized = false;
let _toastTimer  = null;
let _todayFields = null; // null = henüz belirlenmedi, Set = belirlendi
let _currentPage = null; // 'editor' | 'dashboard' | null

function _loadTodayFields(rerollOffset) {
  try {
    const { slots } = buildDailyQuests(rerollOffset || 0);
    _todayFields = new Set(slots.map(s => QUEST_REQ[s.quest.id]?.field).filter(Boolean));
  } catch {
    _todayFields = null;
  }
}

function _authHeaders() {
  const token = localStorage.getItem('session_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function _ensureInit() {
  if (_initialized) return;
  _initialized = true;
  try {
    const r = await fetch(`${API}/quests/today`, {
      credentials: 'include',
      headers: _authHeaders(),
    });
    if (r.ok) {
      const data = await r.json();
      Object.assign(_prev, data);
      _loadTodayFields(data.reroll_offset);
    }
  } catch {}
}

function _showToast(name) {
  const existing = document.getElementById('__zet_quest_toast__');
  if (existing) existing.remove();
  if (_toastTimer) clearTimeout(_toastTimer);

  const el = document.createElement('div');
  el.id = '__zet_quest_toast__';
  el.style.cssText = [
    'position:fixed;top:20px;left:50%;z-index:99999',
    'transform:translateX(-50%) translateY(-90px)',
    'background:#0f172a;border:1px solid rgba(74,222,128,0.45)',
    'border-radius:14px;padding:12px 18px 12px 14px',
    'display:flex;align-items:center;gap:12px',
    'box-shadow:0 8px 32px rgba(0,0,0,0.6)',
    'transition:transform 0.38s cubic-bezier(.34,1.56,.64,1)',
    'font-family:system-ui,-apple-system,sans-serif',
    'cursor:pointer;min-width:200px',
  ].join(';');

  el.innerHTML = `
    <div style="flex-shrink:0;width:30px;height:30px;border-radius:50%;background:rgba(74,222,128,0.15);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 7l3.5 3.5L12 3" stroke="#4ade80" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:9px;color:#4ade80;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:3px;">Görev Tamamlandı</div>
      <div style="font-size:13px;color:#e2e8f0;font-weight:600;">${name}</div>
      <div style="font-size:10px;color:#64748b;margin-top:2px;">Ödülü almak için dokun</div>
    </div>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;opacity:0.4;">
      <path d="M5 3l4 4-4 4" stroke="#e2e8f0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  el.addEventListener('click', () => {
    el.remove();
    if (_toastTimer) clearTimeout(_toastTimer);
    window.location.href = '/quest-map';
  });

  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.transform = 'translateX(-50%) translateY(0)';
  }));

  _toastTimer = setTimeout(() => {
    el.style.transform = 'translateX(-50%) translateY(-90px)';
    setTimeout(() => el.remove(), 380);
  }, 3200);
}

// ─── Backend'e sayaç gönder ───────────────────────────────────────────────────
export const questService = {
  // Oturum başında mevcut DB sayaçlarını yükle (yanlış toast'ı önler)
  initCounters(data) {
    Object.assign(_prev, data);
    _initialized = true;
    if (_todayFields === null) _loadTodayFields(data.reroll_offset);
  },

  // Sayfa bağlamı — hangi sayfada olduğunu bildirir
  enterPage(page) {
    _currentPage = page;
  },
  leavePage(page) {
    if (_currentPage === page) _currentPage = null;
  },

  async fireCounter(field, amount = 1) {
    if (amount <= 0) return;
    await _ensureInit();

    // Sadece bugünün görev alanları için say
    if (_todayFields !== null && !_todayFields.has(field)) return;

    // Sayfa bağlamı uyuşmazsa say
    if (_currentPage !== null && _FIELD_PAGE[field] && _currentPage !== _FIELD_PAGE[field]) return;

    try {
      const res = await fetch(`${API}/quests/event`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ..._authHeaders() },
        body: JSON.stringify({ event_type: field, amount }),
      });
      if (!res.ok) return;
      const data = await res.json();

      // QuestMap'in real-time güncellemesi için
      window.dispatchEvent(new CustomEvent('quest-counter-update', { detail: data }));

      // Eşik geçildi mi?
      for (const threshold of (_THRESHOLDS[field] || [])) {
        const prev = _prev[field] || 0;
        const curr = data[field] || 0;
        if (prev < threshold && curr >= threshold) {
          _showToast(_NAMES[field]?.[threshold] || 'Görev');
        }
      }

      Object.assign(_prev, data);
    } catch {}
  },
};
