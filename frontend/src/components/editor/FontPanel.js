import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { DraggablePanel } from './DraggablePanel';
import { Search } from 'lucide-react';

const FontPanel = () => {
  const { t } = useLanguage();
  const {
    isMobile, showFont, setShowFont,
    allFonts, fontSearch, setFontSearch,
    currentFont, setCurrentFont, loadGoogleFont, applyInlineStyle,
  } = useContext(EditorStateContext);
  const filteredFonts = allFonts.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase()));
  if (!showFont) return null;
  return (
    <DraggablePanel title={`${t('font')} (${allFonts.length}+)`} onClose={() => setShowFont(false)} initialPosition={{ x: isMobile ? 20 : 420, y: 100 }}>
      <div className="w-64">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'var(--zet-text-muted)' }} />
          <input placeholder={`Font ara... (${allFonts.length}+ font)`} value={fontSearch} onChange={e => setFontSearch(e.target.value)} className="zet-input pl-7 text-xs w-full" />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-0.5" onScroll={e => {
          const top = e.target.scrollTop;
          const startIdx = Math.max(0, Math.floor(top / 30) - 3);
          filteredFonts.slice(startIdx, startIdx + 20).forEach(f => loadGoogleFont(f));
        }}>
          {filteredFonts.slice(0, fontSearch ? 500 : 300).map(f => (
            <button key={f}
              onClick={() => { loadGoogleFont(f); setCurrentFont(f); applyInlineStyle('fontFamily', f); setShowFont(false); }}
              onMouseEnter={() => loadGoogleFont(f)}
              className={`w-full text-left px-2 py-1.5 rounded transition-colors ${currentFont === f ? 'glow-sm' : 'hover:bg-white/5'}`}
              style={{ background: currentFont === f ? 'var(--zet-primary)' : 'transparent', color: 'var(--zet-text)', fontFamily: f, fontSize: 13 }}
            >
              {f}
            </button>
          ))}
        </div>
        {filteredFonts.length > 100 && <p className="text-center text-xs mt-1" style={{ color: 'var(--zet-text-muted)' }}>Arama ile daralt ({filteredFonts.length} sonuç)</p>}
      </div>
    </DraggablePanel>
  );
};

export default FontPanel;
