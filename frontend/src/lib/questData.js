export const SHAPES  = ['circle', 'square', 'triangle', 'star'];
export const WEIGHTS = [50, 40, 25, 10];
export const W_TOTAL = 125;

export const QUEST_POOL = [
  { id: 'q_words50',   name: '50 Kelime Yaz',      desc: 'Editörde 50 kelime yaz. Copy-paste ve spam tuş sayılmaz.',   tier: 0 },
  { id: 'q_editor10',  name: '10 Dk Editörde',     desc: 'Editörde aktif 10 dakika çalış.',                            tier: 0 },
  { id: 'q_notes10',   name: '10 Not Oluştur',     desc: 'Bugün 10 yeni belge oluştur.',                               tier: 0 },
  { id: 'q_solo1',     name: 'Kendi Başına',       desc: 'AI yardımı olmadan 1 belge oturumu tamamla.',                tier: 0 },
  { id: 'q_memory5',   name: '5 Bellek Ekle',      desc: 'Zeta hafızasına 5 yeni bilgi ekle.',                         tier: 0 },
  { id: 'q_words150',  name: '150 Kelime Yaz',     desc: 'Editörde 150 kelime yaz. Copy-paste ve spam tuş sayılmaz.',  tier: 1 },
  { id: 'q_editor25',  name: '25 Dk Editörde',     desc: 'Editörde aktif 25 dakika çalış.',                            tier: 1 },
  { id: 'q_notes25',   name: '25 Not Oluştur',     desc: 'Bugün 25 yeni belge oluştur.',                               tier: 1 },
  { id: 'q_solo3',     name: '3 Bağımsız Belge',  desc: 'AI yardımı olmadan 3 belge oturumu tamamla.',                tier: 1 },
  { id: 'q_memory15',  name: '15 Bellek Ekle',     desc: 'Zeta hafızasına 15 yeni bilgi ekle.',                        tier: 1 },
  { id: 'q_words500',  name: 'Günlük Yazar',       desc: 'Bugün 500 kelime yaz. Copy-paste ve spam tuş sayılmaz.',     tier: 2 },
  { id: 'q_editor45',  name: 'Editör Maratonu',    desc: 'Editörde aktif 45 dakika çalış.',                            tier: 2 },
  { id: 'q_notes50',   name: '50 Not Oluştur',     desc: 'Bugün 50 yeni belge oluştur.',                               tier: 2 },
  { id: 'q_solo7',     name: '7 Bağımsız Belge',  desc: 'AI yardımı olmadan 7 belge oturumu tamamla.',                tier: 2 },
  { id: 'q_memory35',  name: '35 Bellek Ekle',     desc: 'Zeta hafızasına 35 yeni bilgi ekle.',                        tier: 2 },
  { id: 'q_words1500', name: 'Kalem Ustası',       desc: 'Bugün 1500 kelime yaz. Copy-paste ve spam tuş sayılmaz.',    tier: 3 },
  { id: 'q_editor90',  name: 'Uzun Mesai',         desc: 'Editörde aktif 90 dakika çalış.',                            tier: 3 },
  { id: 'q_notes100',  name: '100 Not Oluştur',    desc: 'Bugün 100 yeni belge oluştur.',                              tier: 3 },
  { id: 'q_solo15',    name: 'Saf Üretkenlik',     desc: 'AI yardımı olmadan 15 belge oturumu tamamla.',               tier: 3 },
  { id: 'q_memory75',  name: '75 Bellek Ekle',     desc: 'Zeta hafızasına 75 yeni bilgi ekle.',                        tier: 3 },
];

export const QUEST_REQ = {
  q_words50:   { field: 'words_typed',    threshold: 50,   unit: 'kelime' },
  q_words150:  { field: 'words_typed',    threshold: 150,  unit: 'kelime' },
  q_words500:  { field: 'words_typed',    threshold: 500,  unit: 'kelime' },
  q_words1500: { field: 'words_typed',    threshold: 1500, unit: 'kelime' },
  q_editor10:  { field: 'editor_minutes', threshold: 10,   unit: 'dk'     },
  q_editor25:  { field: 'editor_minutes', threshold: 25,   unit: 'dk'     },
  q_editor45:  { field: 'editor_minutes', threshold: 45,   unit: 'dk'     },
  q_editor90:  { field: 'editor_minutes', threshold: 90,   unit: 'dk'     },
  q_notes10:   { field: 'notes_created',  threshold: 10,   unit: 'not'    },
  q_notes25:   { field: 'notes_created',  threshold: 25,   unit: 'not'    },
  q_notes50:   { field: 'notes_created',  threshold: 50,   unit: 'not'    },
  q_notes100:  { field: 'notes_created',  threshold: 100,  unit: 'not'    },
  q_solo1:     { field: 'solo_docs',      threshold: 1,    unit: 'belge'  },
  q_solo3:     { field: 'solo_docs',      threshold: 3,    unit: 'belge'  },
  q_solo7:     { field: 'solo_docs',      threshold: 7,    unit: 'belge'  },
  q_solo15:    { field: 'solo_docs',      threshold: 15,   unit: 'belge'  },
  q_memory5:   { field: 'memories_added', threshold: 5,    unit: 'bellek' },
  q_memory15:  { field: 'memories_added', threshold: 15,   unit: 'bellek' },
  q_memory35:  { field: 'memories_added', threshold: 35,   unit: 'bellek' },
  q_memory75:  { field: 'memories_added', threshold: 75,   unit: 'bellek' },
};

// ─── PRNG ─────────────────────────────────────────────────────────────────────
export function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

export function dateSeed() {
  const ist = new Date(Date.now() + 3 * 60 * 60 * 1000); // UTC+3 (Istanbul)
  return (ist.getUTCFullYear() * 10000 + (ist.getUTCMonth() + 1) * 100 + ist.getUTCDate()) >>> 0;
}

export function rollShape(rng) {
  const roll = rng() * W_TOTAL;
  let acc = 0;
  for (let i = 0; i < WEIGHTS.length; i++) {
    acc += WEIGHTS[i];
    if (roll < acc) return SHAPES[i];
  }
  return 'circle';
}

export function buildDailyQuests(rerollOffset = 0, forceFriday = false) {
  const rng       = seededRng(dateSeed() + rerollOffset * 7919);
  const isFriday  = forceFriday || new Date(Date.now() + 3 * 60 * 60 * 1000).getUTCDay() === 5;
  const slotCount = isFriday ? 5 : 3;
  const used      = new Set();
  const slots     = [];
  for (let i = 0; i < slotCount; i++) {
    const shape         = (isFriday && i === 0) ? 'star' : rollShape(rng);
    const specialChance = isFriday ? 0.025 : 0.009;
    const isSpecial     = rng() < specialChance;
    const specialType   = rng() < 0.5 ? 'case' : 'wheel';
    const tier          = SHAPES.indexOf(shape);
    const pool          = QUEST_POOL.filter(q => q.tier === tier && !used.has(q.id));
    const picked        = pool[Math.floor(rng() * (pool.length || 1))] || QUEST_POOL.find(q => !used.has(q.id)) || QUEST_POOL[0];
    used.add(picked.id);
    slots.push({ id: `slot_${i}_${rerollOffset}`, quest: picked, shape, isSpecial, specialType });
  }
  return { slots, isFriday };
}
