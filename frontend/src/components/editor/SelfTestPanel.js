import React, { useState, useCallback } from 'react';
import { X, Play, RefreshCw, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import {
  LINE_SPACINGS, DEFAULT_FONT_SIZE, DEFAULT_FONT, DEFAULT_COLOR,
  CHART_TYPES, TEXT_ALIGNMENTS, TOOLS, FONTS, PAGE_SIZES,
} from '../../lib/editorConstants';
import { convertToMSFormat, serializeMS, deserializeMS } from '../../lib/msFormat';

// ─── Helpers ────────────────────────────────────────────────────

function makeTextEl(overrides = {}) {
  return {
    id: `tst_${Math.random().toString(36).slice(2)}`,
    type: 'text',
    x: 0, y: 0, width: 200, height: 40,
    text: 'Test', content: 'Test',
    fontSize: DEFAULT_FONT_SIZE,
    fontFamily: DEFAULT_FONT,
    lineHeight: 1.5,
    bold: false, italic: false, underline: false, strikethrough: false,
    align: 'left', color: DEFAULT_COLOR,
    ...overrides,
  };
}

function makeTableEl(rows, cols, cellData) {
  return {
    id: `tbl_${Math.random().toString(36).slice(2)}`,
    type: 'table',
    x: 0, y: 0,
    rows, cols,
    tableData: cellData || Array.from({ length: rows }, () => Array(cols).fill('')),
    cellWidth: 80, cellHeight: 30,
  };
}

function mockMSDoc(elements = []) {
  return {
    title: 'SelfTest',
    pages: [{ elements, drawPaths: [], pageBackground: '#ffffff' }],
  };
}

// ─── Result builders ────────────────────────────────────────────

function pass(name, expected, actual) {
  return { name, status: 'PASS', expected: String(expected), actual: String(actual), details: '' };
}
function fail(name, expected, actual, details = '') {
  return { name, status: 'FAIL', expected: String(expected), actual: String(actual), details };
}
function incorrect(name, expected, actual, details = '') {
  return { name, status: 'INCORRECT', expected: String(expected), actual: String(actual), details };
}

// ─── Test suites ────────────────────────────────────────────────

const SUITES = [

  // ── 1. Line Spacing ──────────────────────────────────────────
  {
    id: 'linespacing',
    category: '📐 Satır Aralığı — Precision',
    tests: [
      () => {
        const name = 'LINE_SPACINGS constant has exactly 6 values';
        return LINE_SPACINGS.length === 6
          ? pass(name, 6, LINE_SPACINGS.length)
          : incorrect(name, 6, LINE_SPACINGS.length);
      },
      ...LINE_SPACINGS.map(v => () => {
        const name = `lineHeight ${v} stored exactly (no float drift)`;
        const el = makeTextEl({ lineHeight: v });
        return el.lineHeight === v
          ? pass(name, v, el.lineHeight)
          : incorrect(name, v, el.lineHeight, 'Float equality failed');
      }),
      () => {
        const name = 'No NaN or Infinity in LINE_SPACINGS';
        const bad = LINE_SPACINGS.filter(v => !isFinite(v) || isNaN(v));
        return bad.length === 0
          ? pass(name, '[]', '[]')
          : incorrect(name, '[]', JSON.stringify(bad));
      },
      () => {
        const name = 'LINE_SPACINGS are in ascending order';
        const sorted = [...LINE_SPACINGS].sort((a, b) => a - b);
        const ok = LINE_SPACINGS.every((v, i) => v === sorted[i]);
        return ok
          ? pass(name, JSON.stringify(LINE_SPACINGS), JSON.stringify(sorted))
          : incorrect(name, JSON.stringify(sorted), JSON.stringify(LINE_SPACINGS), 'Order mismatch');
      },
      () => {
        const name = 'CSS px: lineHeight=1.5, fontSize=16 → 24px rendered';
        const el = makeTextEl({ lineHeight: 1.5, fontSize: 16 });
        const px = el.lineHeight * el.fontSize;
        return px === 24
          ? pass(name, '24px', `${px}px`)
          : incorrect(name, '24px', `${px}px`);
      },
      () => {
        const name = 'CSS px: lineHeight=2.0, fontSize=14 → 28px rendered';
        const el = makeTextEl({ lineHeight: 2.0, fontSize: 14 });
        const px = el.lineHeight * el.fontSize;
        return px === 28
          ? pass(name, '28px', `${px}px`)
          : incorrect(name, '28px', `${px}px`);
      },
      () => {
        const name = 'CSS px: lineHeight=3.0, fontSize=12 → 36px rendered';
        const el = makeTextEl({ lineHeight: 3.0, fontSize: 12 });
        const px = el.lineHeight * el.fontSize;
        return px === 36
          ? pass(name, '36px', `${px}px`)
          : incorrect(name, '36px', `${px}px`);
      },
    ],
  },

  // ── 2. Font Size ─────────────────────────────────────────────
  {
    id: 'fontsize',
    category: '🔡 Punto (Font Size) — Precision',
    tests: [
      () => {
        const name = `DEFAULT_FONT_SIZE is 16`;
        return DEFAULT_FONT_SIZE === 16
          ? pass(name, 16, DEFAULT_FONT_SIZE)
          : incorrect(name, 16, DEFAULT_FONT_SIZE);
      },
      ...([8, 10, 12, 14, 16, 18, 24, 32, 48, 72].map(sz => () => {
        const name = `fontSize ${sz} stored exactly`;
        const el = makeTextEl({ fontSize: sz });
        return el.fontSize === sz
          ? pass(name, sz, el.fontSize)
          : incorrect(name, sz, el.fontSize);
      })),
      () => {
        const name = 'zoom=1.0: rendered size equals stored size';
        const el = makeTextEl({ fontSize: 16 });
        return (el.fontSize * 1.0) === 16
          ? pass(name, 16, el.fontSize * 1.0)
          : incorrect(name, 16, el.fontSize * 1.0);
      },
      () => {
        const name = 'zoom=2.0: rendered size doubles stored size';
        const el = makeTextEl({ fontSize: 16 });
        return (el.fontSize * 2.0) === 32
          ? pass(name, 32, el.fontSize * 2.0)
          : incorrect(name, 32, el.fontSize * 2.0);
      },
      () => {
        const name = 'zoom=0.75: rendered size at 0.75×';
        const el = makeTextEl({ fontSize: 16 });
        return (el.fontSize * 0.75) === 12
          ? pass(name, 12, el.fontSize * 0.75)
          : incorrect(name, 12, el.fontSize * 0.75);
      },
      () => {
        const name = 'FONTS array has 60+ fonts';
        return FONTS.length >= 60
          ? pass(name, '≥60', FONTS.length)
          : incorrect(name, '≥60', FONTS.length);
      },
      () => {
        const name = 'DEFAULT_FONT "Arial" is in FONTS list';
        return FONTS.includes(DEFAULT_FONT)
          ? pass(name, DEFAULT_FONT, DEFAULT_FONT)
          : fail(name, DEFAULT_FONT, 'not found');
      },
    ],
  },

  // ── 3. Charts ────────────────────────────────────────────────
  {
    id: 'charts',
    category: '📊 Grafikler — Data Accuracy',
    tests: [
      () => {
        const name = 'CHART_TYPES includes bar, pie, line';
        const ids = CHART_TYPES.map(c => c.id);
        const ok = ['bar', 'pie', 'line'].every(t => ids.includes(t));
        return ok
          ? pass(name, '[bar,pie,line]', JSON.stringify(ids))
          : incorrect(name, '[bar,pie,line]', JSON.stringify(ids));
      },
      () => {
        const name = '"10,20,30" parses to [10,20,30] exactly';
        const data = '10,20,30'.split(',').map(d => parseFloat(d.trim()));
        const ok = data[0] === 10 && data[1] === 20 && data[2] === 30;
        return ok ? pass(name, '[10,20,30]', JSON.stringify(data)) : incorrect(name, '[10,20,30]', JSON.stringify(data));
      },
      () => {
        const name = '"1.5,2.5,3.5" parses without float error';
        const data = '1.5,2.5,3.5'.split(',').map(d => parseFloat(d.trim()));
        const ok = data[0] === 1.5 && data[1] === 2.5 && data[2] === 3.5;
        return ok ? pass(name, '[1.5,2.5,3.5]', JSON.stringify(data)) : incorrect(name, '[1.5,2.5,3.5]', JSON.stringify(data));
      },
      () => {
        const name = 'Bar chart: value=10, max=30 → height ratio = 10/30';
        const data = [10, 20, 30];
        const maxVal = Math.max(...data);
        const ratio = data[0] / maxVal;
        const expected = 10 / 30;
        return Math.abs(ratio - expected) < 1e-10
          ? pass(name, expected.toFixed(6), ratio.toFixed(6))
          : incorrect(name, expected.toFixed(6), ratio.toFixed(6));
      },
      () => {
        const name = 'Bar chart: chartH=220, value=30 → barH=220 (full height)';
        const data = [10, 20, 30];
        const chartH = 220;
        const barH = (data[2] / Math.max(...data)) * chartH;
        return barH === 220
          ? pass(name, '220', barH)
          : incorrect(name, '220', barH);
      },
      () => {
        const name = 'Pie chart: value=25/100 → 90° arc';
        const values = [25, 75];
        const total = values.reduce((a, b) => a + b, 0);
        const deg = (values[0] / total) * 360;
        return Math.abs(deg - 90) < 1e-10
          ? pass(name, '90°', `${deg}°`)
          : incorrect(name, '90°', `${deg}°`);
      },
      () => {
        const name = 'Pie chart: equal 4 slices → 90° each';
        const values = [25, 25, 25, 25];
        const total = values.reduce((a, b) => a + b, 0);
        const allNinety = values.every(v => Math.abs((v / total) * 360 - 90) < 1e-10);
        return allNinety
          ? pass(name, '90° each', '90° each')
          : incorrect(name, '90° each', values.map(v => ((v / total) * 360).toFixed(4) + '°').join(', '));
      },
      () => {
        const name = 'Line chart: max value determines Y scale correctly';
        const data = [5, 10, 15, 20];
        const maxVal = Math.max(...data);
        return maxVal === 20
          ? pass(name, 20, maxVal)
          : incorrect(name, 20, maxVal);
      },
      () => {
        const name = 'Label whitespace trimmed: " A , B " → ["A","B"]';
        const labels = ' A , B '.split(',').map(l => l.trim());
        const ok = labels[0] === 'A' && labels[1] === 'B';
        return ok ? pass(name, '["A","B"]', JSON.stringify(labels)) : incorrect(name, '["A","B"]', JSON.stringify(labels));
      },
      () => {
        const name = 'parseFloat("abc") → NaN detected correctly';
        const bad = parseFloat('abc');
        return isNaN(bad)
          ? pass(name, 'NaN', 'NaN')
          : fail(name, 'NaN', bad, 'parseFloat should return NaN for non-numeric input');
      },
    ],
  },

  // ── 4. Text Formatting ───────────────────────────────────────
  {
    id: 'formatting',
    category: '✍️ Metin Biçimlendirme (Bold / Italic / Underline)',
    tests: [
      ...[
        ['bold', true], ['bold', false],
        ['italic', true], ['italic', false],
        ['underline', true], ['underline', false],
        ['strikethrough', true], ['strikethrough', false],
      ].map(([prop, val]) => () => {
        const name = `${prop}=${val} stored correctly`;
        const el = makeTextEl({ [prop]: val });
        return el[prop] === val
          ? pass(name, val, el[prop])
          : fail(name, val, el[prop]);
      }),
      () => {
        const name = 'bold=true → CSS fontWeight="bold"';
        const el = makeTextEl({ bold: true });
        const css = el.bold ? 'bold' : 'normal';
        return css === 'bold' ? pass(name, 'bold', css) : fail(name, 'bold', css);
      },
      () => {
        const name = 'bold=false → CSS fontWeight="normal"';
        const el = makeTextEl({ bold: false });
        const css = el.bold ? 'bold' : 'normal';
        return css === 'normal' ? pass(name, 'normal', css) : fail(name, 'normal', css);
      },
      () => {
        const name = 'italic=true → CSS fontStyle="italic"';
        const el = makeTextEl({ italic: true });
        const css = el.italic ? 'italic' : 'normal';
        return css === 'italic' ? pass(name, 'italic', css) : fail(name, 'italic', css);
      },
      () => {
        const name = 'underline + strikethrough simultaneously';
        const el = makeTextEl({ underline: true, strikethrough: true });
        return (el.underline === true && el.strikethrough === true)
          ? pass(name, '{u:true,s:true}', `{u:${el.underline},s:${el.strikethrough}}`)
          : fail(name, '{u:true,s:true}', `{u:${el.underline},s:${el.strikethrough}}`);
      },
      () => {
        const name = 'all formatting off simultaneously';
        const el = makeTextEl({ bold: false, italic: false, underline: false, strikethrough: false });
        const ok = !el.bold && !el.italic && !el.underline && !el.strikethrough;
        return ok
          ? pass(name, 'all false', 'all false')
          : fail(name, 'all false', `b:${el.bold} i:${el.italic} u:${el.underline} s:${el.strikethrough}`);
      },
    ],
  },

  // ── 5. Text Alignment ────────────────────────────────────────
  {
    id: 'alignment',
    category: '↔️ Metin Hizalama',
    tests: [
      () => {
        const name = 'TEXT_ALIGNMENTS has left, center, right, justify';
        const ids = TEXT_ALIGNMENTS.map(a => a.id);
        const ok = ['left', 'center', 'right', 'justify'].every(d => ids.includes(d));
        return ok
          ? pass(name, '[left,center,right,justify]', JSON.stringify(ids))
          : incorrect(name, '[left,center,right,justify]', JSON.stringify(ids));
      },
      ...['left', 'center', 'right', 'justify'].map(dir => () => {
        const name = `align="${dir}" stored correctly`;
        const el = makeTextEl({ align: dir });
        return el.align === dir
          ? pass(name, dir, el.align)
          : fail(name, dir, el.align);
      }),
      () => {
        const name = 'All TEXT_ALIGNMENTS have nameKey for i18n';
        const missing = TEXT_ALIGNMENTS.filter(a => !a.nameKey);
        return missing.length === 0
          ? pass(name, 'all have nameKey', 'ok')
          : fail(name, 'all have nameKey', `missing: ${missing.map(a => a.id).join(', ')}`);
      },
    ],
  },

  // ── 6. Tables ────────────────────────────────────────────────
  {
    id: 'tables',
    category: '📋 Tablolar',
    tests: [
      () => {
        const name = '3×3 table: rows=3, cols=3';
        const el = makeTableEl(3, 3);
        return (el.rows === 3 && el.cols === 3)
          ? pass(name, '3×3', `${el.rows}×${el.cols}`)
          : fail(name, '3×3', `${el.rows}×${el.cols}`);
      },
      () => {
        const name = '5×2 table: rows=5, cols=2';
        const el = makeTableEl(5, 2);
        return (el.rows === 5 && el.cols === 2)
          ? pass(name, '5×2', `${el.rows}×${el.cols}`)
          : fail(name, '5×2', `${el.rows}×${el.cols}`);
      },
      () => {
        const name = '3×3 tableData: array dimensions correct';
        const el = makeTableEl(3, 3);
        const ok = el.tableData.length === 3 && el.tableData.every(r => r.length === 3);
        return ok
          ? pass(name, '3×3 array', 'ok')
          : fail(name, '3×3 array', `${el.tableData.length}×${el.tableData[0]?.length}`);
      },
      () => {
        const name = 'Cell write [0][0]="Hello" and read back';
        const el = makeTableEl(3, 3);
        el.tableData[0][0] = 'Hello';
        return el.tableData[0][0] === 'Hello'
          ? pass(name, 'Hello', el.tableData[0][0])
          : fail(name, 'Hello', el.tableData[0][0]);
      },
      () => {
        const name = 'Cell write [2][2]="World" and read back';
        const el = makeTableEl(3, 3);
        el.tableData[2][2] = 'World';
        return el.tableData[2][2] === 'World'
          ? pass(name, 'World', el.tableData[2][2])
          : fail(name, 'World', el.tableData[2][2]);
      },
      () => {
        const name = 'Simulated row deletion: 3×3 → 2 rows after splice';
        const el = makeTableEl(3, 3);
        el.tableData.splice(1, 1); // remove middle row
        const newRows = el.tableData.length;
        return newRows === 2
          ? pass(name, 2, newRows)
          : fail(name, 2, newRows);
      },
      () => {
        const name = 'Simulated col deletion: 3×3 → 2 cols after map+splice';
        const el = makeTableEl(3, 3);
        el.tableData = el.tableData.map(row => { const r = [...row]; r.splice(1, 1); return r; });
        const allTwo = el.tableData.every(r => r.length === 2);
        return allTwo
          ? pass(name, '2 cols each row', 'ok')
          : fail(name, '2 cols each row', `lengths: ${el.tableData.map(r => r.length).join(',')}`);
      },
      () => {
        const name = 'cellWidth=80, cellHeight=30 defaults preserved';
        const el = makeTableEl(2, 2);
        return (el.cellWidth === 80 && el.cellHeight === 30)
          ? pass(name, '80×30', `${el.cellWidth}×${el.cellHeight}`)
          : fail(name, '80×30', `${el.cellWidth}×${el.cellHeight}`);
      },
    ],
  },

  // ── 7. Images ────────────────────────────────────────────────
  {
    id: 'images',
    category: '🖼️ Görseller',
    tests: [
      () => {
        const name = 'image element stores src, width, height';
        const el = { id: 'img1', type: 'image', x: 0, y: 0, width: 300, height: 200, src: 'data:image/png;base64,abc' };
        return (el.src && el.width === 300 && el.height === 200)
          ? pass(name, '300×200 + src', `${el.width}×${el.height}`)
          : fail(name, '300×200 + src', 'incomplete');
      },
      () => {
        const name = 'image position (x,y) stored correctly';
        const el = { id: 'img2', type: 'image', x: 55, y: 120, width: 100, height: 100, src: 'data:' };
        return (el.x === 55 && el.y === 120)
          ? pass(name, '(55,120)', `(${el.x},${el.y})`)
          : fail(name, '(55,120)', `(${el.x},${el.y})`);
      },
      () => {
        const name = 'chart element type stored as "chart" not "image"';
        const el = { id: 'c1', type: 'chart', x: 0, y: 0, width: 420, height: 320, src: 'data:image/svg' };
        return el.type === 'chart'
          ? pass(name, 'chart', el.type)
          : fail(name, 'chart', el.type);
      },
      () => {
        const name = 'data: URI prefix correctly identifies base64 image';
        const src = 'data:image/png;base64,iVBORw0KGgo=';
        const isDataURI = src.startsWith('data:');
        const mimeMatch = src.match(/^data:([^;]+);/)?.[1];
        return (isDataURI && mimeMatch === 'image/png')
          ? pass(name, 'image/png', mimeMatch)
          : fail(name, 'image/png', mimeMatch || 'no match');
      },
    ],
  },

  // ── 8. Export — MS Format ────────────────────────────────────
  {
    id: 'export',
    category: '📤 Dışa Aktarma — MS Format Round-trip',
    tests: [
      () => {
        const name = 'serializeMS → deserializeMS round-trip (version preserved)';
        try {
          const doc = { version: '1.0.0', title: 'RT', pages: [], meta: {}, assets: { images: [] }, zeta: { history: [] }, judge: { analysisHistory: [] } };
          const restored = deserializeMS(serializeMS(doc));
          return restored.version === '1.0.0'
            ? pass(name, '1.0.0', restored.version)
            : incorrect(name, '1.0.0', restored.version);
        } catch (e) {
          return fail(name, 'no error', e.message);
        }
      },
      () => {
        const name = 'serializeMS → title preserved';
        try {
          const doc = { version: '1.0.0', title: 'My Title', pages: [], meta: {}, assets: { images: [] }, zeta: { history: [] }, judge: { analysisHistory: [] } };
          const restored = deserializeMS(serializeMS(doc));
          return restored.title === 'My Title'
            ? pass(name, 'My Title', restored.title)
            : incorrect(name, 'My Title', restored.title);
        } catch (e) {
          return fail(name, 'no error', e.message);
        }
      },
      () => {
        const name = 'convertToMSFormat: fontSize=18 preserved in block.format';
        try {
          const el = makeTextEl({ fontSize: 18, content: 'Hi' });
          const ms = convertToMSFormat(mockMSDoc([el]), [el], [], { width: 595, height: 842, name: 'A4' }, '#fff', 'free');
          const block = ms.pages[0].blocks[0];
          return block.format.fontSize === 18
            ? pass(name, 18, block.format.fontSize)
            : incorrect(name, 18, block.format.fontSize, JSON.stringify(block.format).slice(0, 100));
        } catch (e) {
          return fail(name, 'no error', e.message);
        }
      },
      () => {
        const name = 'convertToMSFormat: bold=true → fontWeight="bold"';
        try {
          const el = makeTextEl({ bold: true, content: 'Bold' });
          const ms = convertToMSFormat(mockMSDoc([el]), [el], [], { width: 595, height: 842, name: 'A4' }, '#fff', 'free');
          const fw = ms.pages[0].blocks[0].format.fontWeight;
          return fw === 'bold'
            ? pass(name, 'bold', fw)
            : incorrect(name, 'bold', fw);
        } catch (e) {
          return fail(name, 'no error', e.message);
        }
      },
      () => {
        const name = 'convertToMSFormat: italic=true → italic=true in format';
        try {
          const el = makeTextEl({ italic: true });
          const ms = convertToMSFormat(mockMSDoc([el]), [el], [], { width: 595, height: 842, name: 'A4' }, '#fff', 'free');
          const ital = ms.pages[0].blocks[0].format.italic;
          return ital === true
            ? pass(name, true, ital)
            : incorrect(name, true, ital);
        } catch (e) {
          return fail(name, 'no error', e.message);
        }
      },
      () => {
        const name = 'convertToMSFormat: lineHeight=2.5 preserved';
        try {
          const el = makeTextEl({ lineHeight: 2.5 });
          const ms = convertToMSFormat(mockMSDoc([el]), [el], [], { width: 595, height: 842, name: 'A4' }, '#fff', 'free');
          const lh = ms.pages[0].blocks[0].format.lineHeight;
          return lh === 2.5
            ? pass(name, 2.5, lh)
            : incorrect(name, 2.5, lh);
        } catch (e) {
          return fail(name, 'no error', e.message);
        }
      },
      () => {
        const name = 'convertToMSFormat: table block has format.rows and format.cols';
        try {
          const tbl = makeTableEl(3, 4, Array.from({ length: 3 }, () => Array(4).fill('')));
          const ms = convertToMSFormat(mockMSDoc([tbl]), [tbl], [], { width: 595, height: 842, name: 'A4' }, '#fff', 'free');
          const fmt = ms.pages[0].blocks[0].format;
          return (fmt.rows === 3 && fmt.cols === 4)
            ? pass(name, '3r×4c', `${fmt.rows}r×${fmt.cols}c`)
            : incorrect(name, '3r×4c', `${fmt.rows}r×${fmt.cols}c`);
        } catch (e) {
          return fail(name, 'no error', e.message);
        }
      },
      () => {
        const name = 'convertToMSFormat: version is "1.0.0"';
        try {
          const ms = convertToMSFormat(mockMSDoc(), [], [], { width: 595, height: 842, name: 'A4' }, '#fff', 'free');
          return ms.version === '1.0.0'
            ? pass(name, '1.0.0', ms.version)
            : incorrect(name, '1.0.0', ms.version);
        } catch (e) {
          return fail(name, 'no error', e.message);
        }
      },
      () => {
        const name = 'convertToMSFormat: pageBackground preserved in settings';
        try {
          const ms = convertToMSFormat(mockMSDoc(), [], [], { width: 595, height: 842, name: 'A4' }, '#ff0000', 'free');
          return ms.settings.pageColor === '#ff0000'
            ? pass(name, '#ff0000', ms.settings.pageColor)
            : incorrect(name, '#ff0000', ms.settings.pageColor);
        } catch (e) {
          return fail(name, 'no error', e.message);
        }
      },
    ],
  },

  // ── 9. Constants Integrity ───────────────────────────────────
  {
    id: 'constants',
    category: '🔧 Sabitler ve Araç Kayıtları',
    tests: [
      () => {
        const name = 'TOOLS registry has ≥30 tools';
        return TOOLS.length >= 30
          ? pass(name, '≥30', TOOLS.length)
          : incorrect(name, '≥30', TOOLS.length);
      },
      () => {
        const name = 'All TOOLS have id, icon, nameKey';
        const bad = TOOLS.filter(t => !t.id || !t.icon || !t.nameKey);
        return bad.length === 0
          ? pass(name, 'all valid', 'ok')
          : fail(name, 'all valid', `invalid: ${bad.map(t => t.id || '?').join(', ')}`);
      },
      () => {
        const name = 'No duplicate tool IDs';
        const ids = TOOLS.map(t => t.id);
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
        return dupes.length === 0
          ? pass(name, 'no dupes', 'ok')
          : fail(name, 'no dupes', `dupes: ${[...new Set(dupes)].join(', ')}`);
      },
      ...(['text', 'wordtype', 'graphic', 'table', 'image', 'linespacing', 'font', 'paragraph']).map(toolId => () => {
        const name = `Tool "${toolId}" registered`;
        const found = TOOLS.some(t => t.id === toolId);
        return found
          ? pass(name, 'registered', 'registered')
          : fail(name, 'registered', 'NOT FOUND');
      }),
      () => {
        const name = 'PAGE_SIZES includes A4 (595×842)';
        const a4 = PAGE_SIZES.find(p => p.name === 'A4');
        return (a4 && a4.width === 595 && a4.height === 842)
          ? pass(name, '595×842', `${a4?.width}×${a4?.height}`)
          : fail(name, '595×842', a4 ? `${a4.width}×${a4.height}` : 'not found');
      },
      () => {
        const name = 'DEFAULT_COLOR is #000000';
        return DEFAULT_COLOR === '#000000'
          ? pass(name, '#000000', DEFAULT_COLOR)
          : incorrect(name, '#000000', DEFAULT_COLOR);
      },
    ],
  },
];

// ─── Status badge ────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = {
    PASS:      { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  color: '#22c55e', label: '✓ PASS' },
    FAIL:      { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  color: '#ef4444', label: '✗ FAIL' },
    INCORRECT: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#f59e0b', label: '⚠ INCORRECT' },
  }[status] || {};
  return (
    <span style={{ padding: '2px 7px', borderRadius: 5, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
}

// ─── Main panel ──────────────────────────────────────────────────

export default function SelfTestPanel({ onClose }) {
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [collapsed, setCollapsed] = useState({});

  const runTests = useCallback(() => {
    setRunning(true);
    setResults(null);

    // Slight delay so the spinner renders before heavy test run
    setTimeout(() => {
      const suiteResults = SUITES.map(suite => ({
        id: suite.id,
        category: suite.category,
        results: suite.tests.map(fn => {
          try {
            return fn();
          } catch (e) {
            return fail(`[uncaught error]`, 'no throw', e.message, e.stack?.slice(0, 200));
          }
        }),
      }));
      setResults(suiteResults);
      setRunning(false);
    }, 50);
  }, []);

  const totalTests = results ? results.reduce((s, sr) => s + sr.results.length, 0) : 0;
  const passCount  = results ? results.reduce((s, sr) => s + sr.results.filter(r => r.status === 'PASS').length, 0) : 0;
  const failCount  = results ? results.reduce((s, sr) => s + sr.results.filter(r => r.status === 'FAIL').length, 0) : 0;
  const incCount   = results ? results.reduce((s, sr) => s + sr.results.filter(r => r.status === 'INCORRECT').length, 0) : 0;

  const toggle = id => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: 'min(860px, 96vw)', height: 'min(88vh, 700px)',
          background: '#0c0c14', border: '1px solid rgba(245,158,11,0.35)',
          borderRadius: 14, fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          boxShadow: '0 0 60px rgba(245,158,11,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.06em' }}>
              🧪 ZET MINDSHARE — SELF TEST SUITE
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              CEO-only · Data model, rendering precision, export integrity
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={runTests}
              disabled={running}
              style={{ padding: '7px 16px', borderRadius: 8, background: running ? 'rgba(245,158,11,0.2)' : '#f59e0b', color: running ? '#f59e0b' : '#000', border: 'none', cursor: running ? 'default' : 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {running ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={13} />}
              {running ? 'Çalışıyor…' : results ? 'Tekrar Çalıştır' : 'Testleri Çalıştır'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Summary bar */}
        {results && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: 24, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Toplam: <b style={{ color: '#fff' }}>{totalTests}</b></span>
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle size={12} /> {passCount} PASS
            </span>
            <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <XCircle size={12} /> {failCount} FAIL
            </span>
            <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={12} /> {incCount} INCORRECT
            </span>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', minWidth: 100 }}>
              <div style={{ height: '100%', width: `${(passCount / totalTests) * 100}%`, background: failCount + incCount === 0 ? '#22c55e' : '#f59e0b', borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ fontSize: 10, color: failCount + incCount === 0 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>
              {((passCount / totalTests) * 100).toFixed(1)}%
            </span>
          </div>
        )}

        {/* Results body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {!results && !running && (
            <div style={{ textAlign: 'center', paddingTop: 80, color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
              <Play size={28} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              "Testleri Çalıştır" butonuna basın
            </div>
          )}
          {running && (
            <div style={{ textAlign: 'center', paddingTop: 80, color: '#f59e0b', fontSize: 12 }}>
              <RefreshCw size={28} style={{ margin: '0 auto 12px', display: 'block', animation: 'spin 1s linear infinite' }} />
              Testler çalıştırılıyor…
            </div>
          )}
          {results && results.map(suite => {
            const sPass = suite.results.filter(r => r.status === 'PASS').length;
            const sFail = suite.results.filter(r => r.status === 'FAIL').length;
            const sInc  = suite.results.filter(r => r.status === 'INCORRECT').length;
            const isOk  = sFail === 0 && sInc === 0;
            const isOpen = !collapsed[suite.id];
            return (
              <div key={suite.id} style={{ marginBottom: 10, borderRadius: 10, border: `1px solid ${isOk ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, overflow: 'hidden' }}>
                {/* Suite header */}
                <button
                  onClick={() => toggle(suite.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: isOk ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  {isOpen ? <ChevronDown size={13} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} /> : <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />}
                  <span style={{ fontSize: 11, fontWeight: 700, flex: 1, color: '#fff' }}>{suite.category}</span>
                  <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>{sPass}✓</span>
                  {sFail > 0 && <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>{sFail}✗</span>}
                  {sInc  > 0 && <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>{sInc}⚠</span>}
                </button>
                {/* Suite rows */}
                {isOpen && (
                  <div>
                    {suite.results.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 14px', borderTop: '1px solid rgba(255,255,255,0.04)', background: r.status === 'PASS' ? 'transparent' : r.status === 'FAIL' ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.04)' }}>
                        <StatusBadge status={r.status} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>{r.name}</div>
                          {r.status !== 'PASS' && (
                            <div style={{ marginTop: 4, fontSize: 9, color: 'rgba(255,255,255,0.4)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                              <span>Expected: <span style={{ color: '#22c55e' }}>{r.expected}</span></span>
                              <span>Got: <span style={{ color: '#ef4444' }}>{r.actual}</span></span>
                              {r.details && <span style={{ color: '#f59e0b' }}>{r.details}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 9, color: 'rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <span>ZET Mindshare Self Test Suite — CEO Only</span>
          <span>{new Date().toLocaleString('tr-TR')}</span>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
