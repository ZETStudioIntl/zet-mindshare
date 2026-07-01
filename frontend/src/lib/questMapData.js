// ─── Gerçek görev tanımları (backend ile eşleşmeli) ──────────────────────────
export const QUEST_DEFINITIONS = [
  { id: 'q1', name: 'Belge Oluştur',      desc: 'İlk belgenizi oluşturun.',          shape: 'circle', zp: 220, requires: [] },
  { id: 'q2', name: 'Zeta ile Konuş',     desc: 'Zeta AI ile bir konuşma başlatın.', shape: 'circle', zp: 220, requires: ['q1'] },
  { id: 'q3', name: 'AI ile Görsel Üret', desc: 'Zeta Colors ile görsel üretin.',    shape: 'circle', zp: 220, requires: ['q1', 'q2'] },
];

// ─── Harita üretici ───────────────────────────────────────────────────────────
// Büyük harita — güney-orta başlangıç, sol/sağ/yukarı yayılım
export function generateQuestMap() {
  // Deterministik xorshift32
  let _s = 0xCAFEBABE;
  const rng = () => {
    _s ^= _s << 13; _s ^= _s >>> 17; _s ^= _s << 5;
    return (_s >>> 0) / 0x100000000;
  };

  const COLS = 46;
  const ROWS = 26;
  const CW   = 74;
  const CH   = 68;
  const OX   = 140;
  const OY   = 110;

  // Başlangıç: alt-orta
  const START_COL = Math.floor(COLS / 2) - 1; // ~21
  const START_ROW = ROWS - 3;                  // ~23

  const grid  = new Map(); // 'col,row' → quest index
  const quests = [];
  const conns  = [];

  const addQ = (id, name, desc, shape, zp, requires, col, row, jx = 0, jy = 0) => {
    const idx = quests.length;
    quests.push({ id, name, desc, shape, zp, requires, x: OX + col * CW + jx, y: OY + row * CH + jy });
    grid.set(`${col},${row}`, idx);
    return idx;
  };

  // ── İlk 3 gerçek görev — alt orta ─────────────────────────────────────────
  addQ('q1', 'Belge Oluştur',      'İlk belgenizi oluşturun.',          'circle', 220, [],           START_COL,     START_ROW);
  addQ('q2', 'Zeta ile Konuş',     'Zeta AI ile bir konuşma başlatın.', 'circle', 220, ['q1'],       START_COL + 1, START_ROW);
  addQ('q3', 'AI ile Görsel Üret', 'Zeta Colors ile görsel üretin.',    'circle', 220, ['q1', 'q2'], START_COL + 2, START_ROW);

  // ── Star kavşak konumları ────────────────────────────────────────────────
  const STARS = new Set([
    '4,3', '12,1', '22,0', '33,2', '41,4',
    '7,10', '18,8', '28,11', '38,9',
    '3,17', '14,15', '23,18', '35,16', '43,13',
    '9,22', '30,21',
  ]);

  // ── Placeholder görevler ─────────────────────────────────────────────────
  const ZP = { circle: 20, square: 45, triangle: 100, star: 200 };

  // Sol kenar (col=0), sağ kenar (col=COLS-1), alt kenar (row=ROWS-1) her zaman dolu
  const isEdge = (col, row) =>
    col === 0 || col === COLS - 1 || row === ROWS - 1;

  // Başlangıç bölgesi (q1-q3 etrafı) çok sık olsun
  const nearStart = (col, row) =>
    Math.abs(col - (START_COL + 1)) < 4 && Math.abs(row - START_ROW) < 3;

  let pNum = 1;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const key = `${col},${row}`;
      if (grid.has(key)) continue;

      const edge    = isEdge(col, row);
      const near    = nearStart(col, row);
      const density = edge ? 1.0 : near ? 0.85 : 0.66;
      if (rng() > density) continue;

      let shape;
      if (STARS.has(key)) {
        shape = 'star';
      } else if (edge) {
        shape = 'circle';
      } else {
        // Uzaklaştıkça zorlaşıyor (merkezden yukarı + kenarlara)
        const distFromStart = Math.sqrt(
          Math.pow((col - (START_COL + 1)) / COLS, 2) +
          Math.pow((START_ROW - row) / ROWS, 2)
        );
        const rv = rng();
        if      (distFromStart > 0.55 && rv < 0.10) shape = 'star';
        else if (distFromStart > 0.38 && rv < 0.25) shape = 'triangle';
        else if (                        rv < 0.28) shape = 'square';
        else                                        shape = 'circle';
      }

      const jx = edge ? 0 : (rng() - 0.5) * 10;
      const jy = edge ? 0 : (rng() - 0.5) * 10;
      addQ(`p${pNum}`, `Görev ${pNum}`, 'Yakında açıklanacak.', shape, ZP[shape], [], col, row, jx, jy);
      pNum++;
    }
  }

  // ── Bağlantılar ──────────────────────────────────────────────────────────
  const tryConn = (a, b) => {
    if (a !== undefined && b !== undefined) conns.push({ from: a, to: b });
  };

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const me = grid.get(`${col},${row}`);
      if (me === undefined) continue;

      tryConn(me, grid.get(`${col + 1},${row}`));  // sağ
      tryConn(me, grid.get(`${col},${row + 1}`));  // aşağı

      // Labirent atlamaları
      const rv = rng();
      if (rv < 0.08) tryConn(me, grid.get(`${col + 2},${row}`));
      if (rv < 0.06) tryConn(me, grid.get(`${col},${row + 2}`));
      if (rv < 0.04) tryConn(me, grid.get(`${col + 1},${row + 1}`));
      if (rv < 0.03) tryConn(me, grid.get(`${col - 1},${row + 1}`));
    }
  }

  // ── Başlangıç noktasını alt-ortaya bağla ─────────────────────────────────
  // q1 altındaki hücreleri de doldur (görsel bağlantı)
  for (let r = START_ROW + 1; r < ROWS; r++) {
    ['q1', 'q2', 'q3'].forEach((_, i) => {
      const upIdx = grid.get(`${START_COL + i},${r - 1}`);
      const dnIdx = grid.get(`${START_COL + i},${r}`);
      if (upIdx !== undefined && dnIdx !== undefined) tryConn(upIdx, dnIdx);
    });
  }

  // ── Bounds ───────────────────────────────────────────────────────────────
  const xs = quests.map(q => q.x);
  const ys = quests.map(q => q.y);
  const mapMinX = Math.min(...xs) - 80;
  const mapMinY = Math.min(...ys) - 80;
  const mapMaxX = Math.max(...xs) + 80;
  const mapMaxY = Math.max(...ys) + 80;

  // Başlangıç node'larının ekran koordinatı (viewport init için)
  const startX = OX + START_COL * CW + CW;   // q2 merkezi
  const startY = OY + START_ROW * CH;

  return {
    quests,
    connections: conns,
    mapMinX, mapMinY, mapMaxX, mapMaxY,
    totalHeight: mapMaxY - mapMinY,
    centerX: (mapMinX + mapMaxX) / 2,
    centerY: (mapMinY + mapMaxY) / 2,
    startX,
    startY,
  };
}
