// ─── Gerçek görev tanımları (backend ile eşleşmeli) ──────────────────────────
export const QUEST_DEFINITIONS = [
  { id: 'q1', name: 'Belge Oluştur',      desc: 'İlk belgenizi oluşturun.',          shape: 'circle', zp: 220, requires: [] },
  { id: 'q2', name: 'Zeta ile Konuş',     desc: 'Zeta AI ile bir konuşma başlatın.', shape: 'circle', zp: 220, requires: ['q1'] },
  { id: 'q3', name: 'AI ile Görsel Üret', desc: 'Zeta Colors ile görsel üretin.',    shape: 'circle', zp: 220, requires: ['q1', 'q2'] },
];

// ─── Harita üretici ───────────────────────────────────────────────────────────
export function generateQuestMap() {
  // Deterministik xorshift32 — her çalışmada aynı haritayı üretir
  let _s = 2463534242;
  const rng = () => {
    _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5;
    return (_s >>> 0) / 0x100000000;
  };

  const COLS   = 28;
  const ROWS   = 16;
  const CW     = 76;   // cell width
  const CH     = 72;   // cell height
  const OX     = 130;  // origin x
  const OY     = 110;  // origin y
  const DENSITY = 0.68;

  const grid   = new Map(); // 'col,row' → quest index
  const quests = [];
  const conns  = [];

  const addQuest = (id, name, desc, shape, zp, requires, col, row, jx = 0, jy = 0) => {
    const idx = quests.length;
    quests.push({ id, name, desc, shape, zp, requires, x: OX + col * CW + jx, y: OY + row * CH + jy });
    if (col >= 0 && row >= 0) grid.set(`${col},${row}`, idx);
    return idx;
  };

  // ── İlk 3 gerçek görev (sol üst köşede, belirgin başlangıç) ────────────────
  addQuest('q1', 'Belge Oluştur',      'İlk belgenizi oluşturun.',          'circle', 220, [],           0,  5);
  addQuest('q2', 'Zeta ile Konuş',     'Zeta AI ile bir konuşma başlatın.', 'circle', 220, ['q1'],       1,  5);
  addQuest('q3', 'AI ile Görsel Üret', 'Zeta Colors ile görsel üretin.',    'circle', 220, ['q1', 'q2'], 2,  5);

  // ── Star konumları (fotoğraftaki ~6 star, kavşak pozisyonlara) ─────────────
  const STAR_CELLS = new Set(['6,3', '11,7', '16,2', '20,10', '24,5', '27,13']);

  // ── Placeholder görevler ───────────────────────────────────────────────────
  const ZP_BY_SHAPE = { circle: 20, square: 45, triangle: 100, star: 200 };
  let pNum = 1;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const key = `${col},${row}`;
      if (grid.has(key)) continue;

      // Alt kenar ve sol kenar her zaman dolu circle
      const isBottomEdge = row === ROWS - 1;
      const isLeftEdge   = col === 0;
      const isEdge       = isBottomEdge || isLeftEdge;

      if (!isEdge && rng() > DENSITY) continue;

      let shape;
      if (STAR_CELLS.has(key)) {
        shape = 'star';
      } else if (isEdge) {
        shape = 'circle';
      } else {
        // Sol→sağ, üst→alt ilerledikçe zorlaşıyor
        const progress = (col / COLS) * 0.7 + ((ROWS - 1 - row) / ROWS) * 0.3;
        const rv = rng();
        if      (progress > 0.82 && rv < 0.12) shape = 'star';
        else if (progress > 0.58 && rv < 0.28) shape = 'triangle';
        else if (                   rv < 0.30) shape = 'square';
        else                                   shape = 'circle';
      }

      const jx = isEdge ? 0 : (rng() - 0.5) * 9;
      const jy = isEdge ? 0 : (rng() - 0.5) * 9;

      addQuest(`p${pNum}`, `Görev ${pNum}`, 'Yakında açıklanacak.', shape, ZP_BY_SHAPE[shape], [], col, row, jx, jy);
      pNum++;
    }
  }

  // ── Bağlantılar: sağ + aşağı komşular ────────────────────────────────────
  const addConn = (a, b) => { if (a !== undefined && b !== undefined) conns.push({ from: a, to: b }); };

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const me = grid.get(`${col},${row}`);
      if (me === undefined) continue;

      addConn(me, grid.get(`${col + 1},${row}`));  // sağ
      addConn(me, grid.get(`${col},${row + 1}`));  // aşağı

      // Labirent hissi için rastgele atlama bağlantıları (~%15 şans)
      const rv = rng();
      if (rv < 0.07) addConn(me, grid.get(`${col + 2},${row}`));      // 2 sağ
      if (rv < 0.06) addConn(me, grid.get(`${col},${row + 2}`));      // 2 aşağı
      if (rv < 0.04) addConn(me, grid.get(`${col + 1},${row + 1}`));  // çapraz
    }
  }

  // ── Harita sınırları ──────────────────────────────────────────────────────
  const xs = quests.map(q => q.x);
  const ys = quests.map(q => q.y);
  const mapMinX = Math.min(...xs) - 70;
  const mapMinY = Math.min(...ys) - 70;
  const mapMaxX = Math.max(...xs) + 70;
  const mapMaxY = Math.max(...ys) + 70;

  return {
    quests,
    connections: conns,
    mapMinX, mapMinY, mapMaxX, mapMaxY,
    totalHeight: mapMaxY - mapMinY,
    centerX: (mapMinX + mapMaxX) / 2,
    centerY: (mapMinY + mapMaxY) / 2,
  };
}
