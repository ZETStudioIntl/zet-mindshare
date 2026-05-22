import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { DraggablePanel } from './DraggablePanel';
import { PRESET_COLORS } from '../../lib/editorConstants';
import { X, Highlighter } from 'lucide-react';

const ColorPickerPanel = () => {
  const { t } = useLanguage();
  const {
    isMobile, showColor, setShowColor, colorTarget, setColorTarget,
    applyColor, currentColor, hexInput, setHexInput, customColor, setCustomColor,
    gradientAngle, setGradientAngle, gradientBarRef, gradientStops, setGradientStops,
    activeStopId, setActiveStopId, applyGradient,
    highlighterColor, setHighlighterColor,
    selectedElement, lastSelectedRef, setCanvasElements, handleSaveHistory,
  } = useContext(EditorStateContext);
  if (!showColor) return null;
  return (
    <DraggablePanel title={t('colorPicker')} onClose={() => setShowColor(false)} initialPosition={{ x: isMobile ? 20 : 320, y: 150 }}>
      <div className="space-y-3 w-72">
        {/* Material selector */}
        <div className="flex gap-1">
          {[['Yazı', 'text'], ['Şekil', 'shape'], ['Vektör', 'vector']].map(([label, type]) => (
            <button key={type} onMouseDown={e => e.preventDefault()} onClick={() => setColorTarget(type)}
              className="flex-1 text-xs py-1.5 rounded transition-colors font-medium"
              style={{ background: colorTarget === type ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)', border: '1px solid var(--zet-border)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Preset colors */}
        <div className="grid grid-cols-8 gap-1">
          {PRESET_COLORS.map(c => (
            <button key={c} onClick={() => { applyColor(c); setHexInput(c); }}
              className={`w-8 h-8 rounded-md border transition-transform ${currentColor === c ? 'ring-2 ring-white scale-110' : 'border-white/10'}`}
              style={{ background: c }} />
          ))}
        </div>

        {/* Hex + color picker */}
        <div className="flex gap-2 items-center">
          <input type="text" value={hexInput} onChange={e => setHexInput(e.target.value)} placeholder="#000000"
            className="zet-input flex-1 text-xs font-mono" maxLength={7} />
          <button onClick={() => { if (/^#[0-9A-Fa-f]{6}$/.test(hexInput)) applyColor(hexInput); }}
            className="zet-btn px-2 text-xs">OK</button>
          <input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); applyColor(e.target.value); setHexInput(e.target.value); }}
            className="h-8 w-10 rounded cursor-pointer" style={{ padding: 2, border: '1px solid var(--zet-border)' }} />
        </div>

        {/* Gradient — Adobe Illustrator style */}
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--zet-text)' }}>Gradient</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Açı</span>
              <input type="number" min="0" max="360" value={gradientAngle}
                onChange={e => setGradientAngle(Number(e.target.value))}
                className="zet-input text-xs w-14 text-center" />
              <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>°</span>
            </div>
          </div>

          {/* Gradient bar + stop handles */}
          <div style={{ position: 'relative', height: 44, userSelect: 'none' }}>
            {/* Bar */}
            <div
              ref={gradientBarRef}
              style={{
                position: 'absolute', left: 10, right: 10, top: 0, height: 20, borderRadius: 6,
                background: (() => {
                  const s = [...gradientStops].sort((a, b) => a.pos - b.pos);
                  return `linear-gradient(90deg, ${s.map(x => `${x.color} ${x.pos}%`).join(', ')})`;
                })(),
                cursor: 'crosshair', border: '1px solid rgba(255,255,255,0.15)',
              }}
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = Math.min(100, Math.max(0, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                const newId = `stop_${Date.now()}`;
                setGradientStops(prev => [...prev, { id: newId, pos, color: currentColor }]);
                setActiveStopId(newId);
              }}
            />
            {/* Stop handles */}
            {gradientStops.map(stop => (
              <div key={stop.id}
                style={{
                  position: 'absolute',
                  left: `calc(10px + ${stop.pos}% * (100% - 20px) / 100)`,
                  top: 18,
                  transform: 'translateX(-50%)',
                  cursor: 'grab',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  zIndex: activeStopId === stop.id ? 2 : 1,
                }}
                onClick={e => { e.stopPropagation(); setActiveStopId(stop.id); }}
                onMouseDown={e => {
                  e.stopPropagation();
                  setActiveStopId(stop.id);
                  const barEl = gradientBarRef.current;
                  if (!barEl) return;
                  const barRect = barEl.getBoundingClientRect();
                  const sid = stop.id;
                  const onMove = me => {
                    const p = Math.min(100, Math.max(0, Math.round(((me.clientX - barRect.left) / barRect.width) * 100)));
                    setGradientStops(prev => prev.map(s => s.id === sid ? { ...s, pos: p } : s));
                  };
                  const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
                  document.addEventListener('mousemove', onMove);
                  document.addEventListener('mouseup', onUp);
                }}
              >
                {/* Arrow */}
                <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: `7px solid ${activeStopId === stop.id ? 'white' : '#666'}` }} />
                {/* Color circle */}
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: stop.color, border: `2px solid ${activeStopId === stop.id ? 'white' : '#444'}`, flexShrink: 0 }} />
              </div>
            ))}
          </div>

          {/* Active stop controls */}
          {(() => {
            const s = gradientStops.find(x => x.id === activeStopId);
            if (!s) return null;
            return (
              <div className="flex items-center gap-2">
                <input type="color" value={s.color}
                  onChange={e => setGradientStops(prev => prev.map(x => x.id === activeStopId ? { ...x, color: e.target.value } : x))}
                  className="h-8 w-10 rounded cursor-pointer" style={{ padding: 2, border: '1px solid var(--zet-border)' }} />
                <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{s.pos}%</span>
                <div style={{ flex: 1 }} />
                {gradientStops.length > 2 && (
                  <button onClick={() => setGradientStops(prev => {
                    const r = prev.filter(x => x.id !== activeStopId);
                    setActiveStopId(r[0].id);
                    return r;
                  })} className="flex items-center justify-center w-6 h-6 rounded"
                    style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)', color: 'var(--zet-text-muted)' }}>
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })()}

          <button onMouseDown={e => e.preventDefault()} onClick={() => applyGradient()}
            className="zet-btn w-full text-xs font-medium"
            style={{ background: (() => { const s = [...gradientStops].sort((a, b) => a.pos - b.pos); return `linear-gradient(${gradientAngle}deg, ${s.map(x => `${x.color} ${x.pos}%`).join(', ')})`; })() }}>
            Gradient Uygula
          </button>
        </div>

        {/* Highlighter */}
        <div className="space-y-1 pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--zet-text)' }}><Highlighter className="h-3.5 w-3.5" /> Highlighter Rengi</span>
          <div className="flex items-center gap-1">
            {['#FFFF00', '#00FF00', '#00FFFF', '#FF69B4', '#FFA500', '#FF0000'].map(c => (
              <button key={c} onClick={() => setHighlighterColor(c)} className={`w-6 h-6 rounded transition-all ${highlighterColor === c ? 'ring-2 ring-white scale-110' : ''}`} style={{ background: c }} data-testid={`highlight-color-${c}`} />
            ))}
            <button onClick={() => {
              const target = selectedElement || lastSelectedRef.current;
              if (!target) return;
              setCanvasElements(prev => {
                const updated = prev.map(el => {
                  if (el.id !== target) return el;
                  const cleaned = { ...el, highlightColor: undefined };
                  if (el.htmlContent) cleaned.htmlContent = el.htmlContent.replace(/<span[^>]*data-highlight="true"[^>]*>(.*?)<\/span>/gi, '$1');
                  return cleaned;
                });
                handleSaveHistory(updated);
                return updated;
              });
            }} className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }} data-testid="highlight-remove" title="Kaldır">
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Metin seçin, araç çubuğundan Highlighter'a tıklayın</p>
        </div>
      </div>
    </DraggablePanel>
  );
};

export default ColorPickerPanel;
