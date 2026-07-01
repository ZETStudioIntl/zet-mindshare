// Quest tanımları — backend QUEST_DEFINITIONS ile eşleşmeli
export const QUEST_DEFINITIONS = [
  {
    id: 'q1',
    name: 'Belge Oluştur',
    desc: 'İlk belgenizi oluşturun.',
    shape: 'circle',
    zp: 220,
    requires: [],
  },
  {
    id: 'q2',
    name: 'Zeta ile Konuş',
    desc: 'Zeta AI ile bir konuşma başlatın.',
    shape: 'circle',
    zp: 220,
    requires: ['q1'],
  },
  {
    id: 'q3',
    name: 'AI ile Görsel Üret',
    desc: 'Zeta Colors ile bir görsel oluşturun.',
    shape: 'circle',
    zp: 220,
    requires: ['q1', 'q2'],
  },
];

export function generateQuestMap() {
  const quests = [
    { ...QUEST_DEFINITIONS[0], x: 220, y: 400 },
    { ...QUEST_DEFINITIONS[1], x: 520, y: 400 },
    { ...QUEST_DEFINITIONS[2], x: 820, y: 400 },
  ];
  const connections = [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
  ];
  return {
    quests,
    connections,
    mapMinX: 80,
    mapMinY: 280,
    mapMaxX: 960,
    mapMaxY: 520,
    totalHeight: 240,
    centerX: 520,
    centerY: 400,
  };
}
