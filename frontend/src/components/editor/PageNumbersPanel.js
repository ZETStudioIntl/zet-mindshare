import React from 'react';
import { DraggablePanel } from './DraggablePanel';

const PageNumbersPanel = ({ pageNumbersEnabled, togglePageNumbers, pageNumberPosition, setPageNumberPosition, pageNumberFormat, setPageNumberFormat, pageNumberStyle, setPageNumberStyle, pageNumberStart, setPageNumberStart, updatePageNumberSettings, isMobile, onClose }) => (
  <DraggablePanel title="Sayfa Numaraları" onClose={onClose} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
    <div className="w-60 space-y-3">
      <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--zet-text)' }}>
        <input type="checkbox" checked={pageNumbersEnabled} onChange={togglePageNumbers} className="rounded" />
        Sayfa Numaralarını Göster
      </label>
      <div>
        <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Konum</label>
        <select value={pageNumberPosition} onChange={e => { setPageNumberPosition(e.target.value); updatePageNumberSettings({ position: e.target.value }); }} className="zet-input text-xs w-full">
          <option value="bottom-center">Altta Orta</option>
          <option value="bottom-right">Altta Sağ</option>
          <option value="bottom-left">Altta Sol</option>
          <option value="top-center">Üstte Orta</option>
          <option value="top-right">Üstte Sağ</option>
          <option value="top-left">Üstte Sol</option>
        </select>
      </div>
      <div>
        <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Numara Biçimi</label>
        <select value={pageNumberFormat} onChange={e => { setPageNumberFormat(e.target.value); updatePageNumberSettings({ format: e.target.value }); }} className="zet-input text-xs w-full">
          <option value="numeric">1, 2, 3 (Sayısal)</option>
          <option value="roman">i, ii, iii (Roma - Küçük)</option>
          <option value="ROMAN">I, II, III (Roma - Büyük)</option>
          <option value="alpha">a, b, c (Alfabe)</option>
        </select>
      </div>
      <div>
        <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Görünüm Stili</label>
        <select value={pageNumberStyle} onChange={e => { setPageNumberStyle(e.target.value); updatePageNumberSettings({ style: e.target.value }); }} className="zet-input text-xs w-full">
          <option value="n">1</option>
          <option value="n/total">1 / 5</option>
          <option value="page-n">Sayfa 1</option>
          <option value="page-n-of-total">Sayfa 1 / 5</option>
        </select>
      </div>
      <div>
        <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Başlangıç Numarası</label>
        <input type="number" min="1" max="999" value={pageNumberStart} onChange={e => { const v = Math.max(1, parseInt(e.target.value) || 1); setPageNumberStart(v); updatePageNumberSettings({ start: v }); }} className="zet-input text-xs w-full" />
      </div>
    </div>
  </DraggablePanel>
);

export default PageNumbersPanel;
