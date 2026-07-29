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

// ─── Backend'e sayaç gönder ───────────────────────────────────────────────────
export const questService = {
  async fireCounter(field, amount = 1) {
    if (amount <= 0) return;
    try {
      await fetch(`${API}/quests/event`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: field, amount }),
      });
    } catch {}
  },
};
