import React, { useContext, useState, useRef } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { DraggablePanel } from './DraggablePanel';
import { PRESET_COLORS } from '../../lib/editorConstants';
import { X, Highlighter, MoreHorizontal } from 'lucide-react';

const LS_KEY = 'zet_saved_gradients';

const radialCss = (stops, cx, cy) => {
  if (!stops || stops.length === 0) return '#ffffff';
  if (stops.length === 1) return stops[0].color;
  const withDist = stops.map(s => {
    const dx = s.x - cx;
    const dy = s.y - cy;
    return { ...s, dist: Math.sqrt(dx * dx + dy * dy) };
  });
  const maxDist = Math.max(...withDist.map(s => s.dist)) || 1;
  const sorted = [...withDist].sort((a, b) => a.dist - b.dist);
  return `radial-gradient(circle at ${Math.round(cx)}% ${Math.round(cy)}%, ${sorted.map(s => `${s.color} ${Math.round((s.dist / maxDist) * 100)}%`).join(', ')})`;
};

const gradientToCss = (g) => radialCss(g.stops, g.centerX ?? 50, g.centerY ?? 50);

const ColorPickerPanel = () => {
  const { t } = useLanguage();
  const {
    isMobile, showColor, setShowColor, colorTarget, setColorTarget,
    applyColor, currentColor, hexInput, setHexInput, customColor, setCustomColor,
    highlighterColor, setHighlighterColor,
    selectedElement, lastSelectedRef, setCanvasElements, handleSaveHistory,
  } = useContext(EditorStateContext);

  const [savedGradients, setSavedGradients] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
  });
  const [openMenuId, setOpenMenuId] = useState(null);

  const [showEditor, setShowEditor] = useState(false);
  const [editStops, setEditStops] = useState([]);
  const [editCenter, setEditCenter] = useState({ x: 50, y: 50 });
  const [activeStopId, setActiveStopId] = useState(null);
  const [rightClickId, setRightClickId] = useState(null);
  const rectRef = useRef(null);

  if (!showColor) return null;

  /* ── Apply saved gradient to selected element ── */
  const applyGradientFromSaved = (g) => {
    const target = selectedElement || lastSelectedRef?.current;
    if (!target) return;
    const cx = g.centerX ?? 50;
    const cy = g.centerY ?? 50;
    const withDist = (g.stops || []).map(s => {
      const dx = s.x - cx;
      const dy = s.y - cy;
      return { ...s, dist: Math.sqrt(dx * dx + dy * dy) };
    });
    const maxDist = Math.max(...withDist.map(s => s.dist)) || 1;
    const stops = withDist
      .sort((a, b) => a.dist - b.dist)
      .map(s => ({ id: s.id, pos: Math.round((s.dist / maxDist) * 100), color: s.color }));
    setCanvasElements(prev => {
      const updated = prev.map(el => {
        if (el.id !== target) return el;
        return {
          ...el,
          gradientStops: stops,
          gradientType: 'radial',
          gradientCenterX: Math.round(cx),
          gradientCenterY: Math.round(cy),
          gradientAngle: undefined,
          gradientStart: undefined,
          gradientEnd: undefined,
        };
      });
      handleSaveHistory(updated);
      return updated;
    });
  };

  /* ── Editor: add stop on background click ── */
  const handleRectClick = (e) => {
    if (!rectRef.current) return;
    const rect = rectRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    const id = `es_${Date.now()}`;
    setEditStops(prev => [...prev, { id, x, y, color: '#000000' }]);
    setActiveStopId(id);
    setRightClickId(null);
  };

  /* ── Editor: drag color stop ── */
  const startDrag = (e, stopId) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveStopId(stopId);
    setRightClickId(null);
    if (!rectRef.current) return;
    const rect = rectRef.current.getBoundingClientRect();
    const onMove = (me) => {
      const x = Math.min(100, Math.max(0, ((me.clientX - rect.left) / rect.width) * 100));
      const y = Math.min(100, Math.max(0, ((me.clientY - rect.top) / rect.height) * 100));
      setEditStops(prev => prev.map(s => s.id === stopId ? { ...s, x, y } : s));
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  /* ── Editor: drag center point ── */
  const startCenterDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!rectRef.current) return;
    const rect = rectRef.current.getBoundingClientRect();
    const onMove = (me) => {
      const x = Math.min(100, Math.max(0, ((me.clientX - rect.left) / rect.width) * 100));
      const y = Math.min(100, Math.max(0, ((me.clientY - rect.top) / rect.height) * 100));
      setEditCenter({ x, y });
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  /* ── Editor: right-click stop → color picker ── */
  const handleStopRightClick = (e, stopId) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveStopId(stopId);
    setRightClickId(prev => prev === stopId ? null : stopId);
  };

  const setStopColor = (stopId, color) => setEditStops(prev => prev.map(s => s.id === stopId ? { ...s, color } : s));
  const deleteStop = (stopId) => { setEditStops(prev => prev.filter(s => s.id !== stopId)); setRightClickId(null); setActiveStopId(null); };

  /* ── Save gradient ── */
  const saveGradient = () => {
    if (editStops.length === 0) return;
    const name = `Gradient ${savedGradients.length + 1}`;
    const newG = { id: `grad_${Date.now()}`, name, stops: editStops, centerX: editCenter.x, centerY: editCenter.y };
    const updated = [...savedGradients, newG];
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setSavedGradients(updated);
    setShowEditor(false);
    setEditStops([]);
    setEditCenter({ x: 50, y: 50 });
    setRightClickId(null);
    applyGradientFromSaved(newG);
  };

  /* ── Rename / Delete saved gradient ── */
  const renameGradient = (id) => {
    const g = savedGradients.find(x => x.id === id);
    if (!g) return;
    const name = window.prompt('Yeni isim:', g.name);
    if (!name || !name.trim()) return;
    const updated = savedGradients.map(x => x.id === id ? { ...x, name: name.trim() } : x);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setSavedGradients(updated);
    setOpenMenuId(null);
  };

  const deleteGradient = (id) => {
    if (!window.confirm('Bu gradient silinsin mi?')) return;
    const updated = savedGradients.filter(x => x.id !== id);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setSavedGradients(updated);
    setOpenMenuId(null);
  };

  const editorCss = radialCss(editStops, editCenter.x, editCenter.y);

  return (
    <DraggablePanel title={t('colorPicker')} onClose={() => setShowColor(false)} initialPosition={{ x: isMobile ? 20 : 320, y: 150 }}>
      <div className="space-y-3 w-72" onClick={() => setOpenMenuId(null)}>

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

        {/* ── Gradient bölümü ── */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>

          {/* Kayıtlı gradient listesi */}
          {savedGradients.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {savedGradients.map(g => (
                <div key={g.id} className="flex items-center gap-2">
                  <button onClick={() => applyGradientFromSaved(g)} title="Uygula"
                    style={{ width: 56, height: 22, borderRadius: 4, flexShrink: 0, background: gradientToCss(g), border: '1px solid var(--zet-border)' }} />
                  <span className="flex-1 text-xs truncate" style={{ color: 'var(--zet-text)' }}>{g.name}</span>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setOpenMenuId(openMenuId === g.id ? null : g.id)}
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10"
                      style={{ color: 'var(--zet-text-muted)' }}>
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                    {openMenuId === g.id && (
                      <div className="absolute right-0 top-full mt-0.5 z-50 rounded-lg shadow-xl overflow-hidden"
                        style={{ background: 'var(--zet-card)', border: '1px solid var(--zet-border)', minWidth: 128 }}>
                        <button onClick={() => renameGradient(g.id)}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/10" style={{ color: 'var(--zet-text)' }}>
                          İsim Değiştir
                        </button>
                        <button onClick={() => deleteGradient(g.id)}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/10" style={{ color: '#ef4444' }}>
                          Sil
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Gradient editörü */}
          {showEditor ? (
            <div className="space-y-2">
              {/* 2D dikdörtgen */}
              <div
                ref={rectRef}
                onClick={handleRectClick}
                style={{
                  position: 'relative', width: '100%', height: 140, borderRadius: 6,
                  background: editorCss, border: '1px solid var(--zet-border)',
                  cursor: 'crosshair', userSelect: 'none', overflow: 'hidden',
                }}
              >
                {/* Merkez noktası */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${editCenter.x}%`, top: `${editCenter.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.9)',
                    border: '2px solid #333',
                    cursor: 'move', zIndex: 9,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 1px 5px rgba(0,0,0,0.5)',
                  }}
                  onMouseDown={startCenterDrag}
                  onClick={e => e.stopPropagation()}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <line x1="5" y1="0" x2="5" y2="10" stroke="#333" strokeWidth="1.5" />
                    <line x1="0" y1="5" x2="10" y2="5" stroke="#333" strokeWidth="1.5" />
                    <circle cx="5" cy="5" r="1.5" fill="#333" />
                  </svg>
                </div>

                {editStops.map(stop => {
                  const isActive = activeStopId === stop.id;
                  const isRightClicked = rightClickId === stop.id;
                  return (
                    <React.Fragment key={stop.id}>
                      {/* Stop circle */}
                      <div
                        style={{
                          position: 'absolute',
                          left: `${stop.x}%`, top: `${stop.y}%`,
                          transform: 'translate(-50%, -50%)',
                          width: 18, height: 18, borderRadius: '50%',
                          background: stop.color,
                          border: `2.5px solid ${isActive ? '#fff' : 'rgba(255,255,255,0.6)'}`,
                          boxShadow: isActive ? '0 0 0 1.5px #000, 0 2px 6px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.5)',
                          cursor: 'grab', zIndex: isActive ? 10 : 5,
                        }}
                        onMouseDown={e => startDrag(e, stop.id)}
                        onContextMenu={e => handleStopRightClick(e, stop.id)}
                        onClick={e => e.stopPropagation()}
                      />
                      {/* Sağ tık renk seçici */}
                      {isRightClicked && (
                        <div
                          style={{
                            position: 'absolute',
                            left: stop.x > 65 ? 'auto' : `calc(${stop.x}% + 14px)`,
                            right: stop.x > 65 ? `calc(${100 - stop.x}% + 14px)` : 'auto',
                            top: stop.y > 60 ? 'auto' : `calc(${stop.y}% + 14px)`,
                            bottom: stop.y > 60 ? `calc(${100 - stop.y}% + 14px)` : 'auto',
                            background: 'var(--zet-card)', border: '1px solid var(--zet-border)',
                            borderRadius: 8, padding: '8px 8px 6px',
                            zIndex: 20, display: 'flex', flexDirection: 'column', gap: 6,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                          }}
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1.5">
                            <input type="color" value={stop.color}
                              onChange={e => setStopColor(stop.id, e.target.value)}
                              style={{ width: 30, height: 26, padding: 2, border: '1px solid var(--zet-border)', borderRadius: 4, cursor: 'pointer' }} />
                            <input type="text" value={stop.color}
                              onChange={e => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) setStopColor(stop.id, e.target.value); }}
                              className="zet-input text-xs font-mono" style={{ width: 68 }} maxLength={7} />
                          </div>
                          <button onClick={() => deleteStop(stop.id)}
                            className="text-xs px-2 py-0.5 rounded text-left"
                            style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                            Sil
                          </button>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>
                Sol tık → renk ekle &nbsp;·&nbsp; Sağ tık → renk seç / sil &nbsp;·&nbsp; ⊕ merkezi sürükle
              </p>

              <div className="flex gap-1.5">
                <button onClick={() => { setShowEditor(false); setEditStops([]); setEditCenter({ x: 50, y: 50 }); setRightClickId(null); }}
                  className="flex-1 text-xs py-1.5 rounded"
                  style={{ background: 'var(--zet-bg)', color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}>
                  İptal
                </button>
                <button onClick={saveGradient} disabled={editStops.length === 0}
                  className="flex-1 text-xs py-1.5 rounded font-medium"
                  style={{ background: 'var(--zet-primary)', color: '#fff', opacity: editStops.length === 0 ? 0.45 : 1, cursor: editStops.length === 0 ? 'not-allowed' : 'pointer' }}>
                  Kaydet
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setShowEditor(true); setEditStops([]); setEditCenter({ x: 50, y: 50 }); setRightClickId(null); }}
              className="w-full text-xs py-2 rounded font-medium transition-colors hover:bg-white/5"
              style={{ background: 'var(--zet-bg)', color: 'var(--zet-text)', border: '1px solid var(--zet-border)' }}>
              + Gradient Renk Oluştur
            </button>
          )}
        </div>

        {/* Highlighter */}
        <div className="space-y-1 pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--zet-text)' }}>
            <Highlighter className="h-3.5 w-3.5" /> Highlighter Rengi
          </span>
          <div className="flex items-center gap-1">
            {['#FFFF00', '#00FF00', '#00FFFF', '#FF69B4', '#FFA500', '#FF0000'].map(c => (
              <button key={c} onClick={() => setHighlighterColor(c)}
                className={`w-6 h-6 rounded transition-all ${highlighterColor === c ? 'ring-2 ring-white scale-110' : ''}`}
                style={{ background: c }} data-testid={`highlight-color-${c}`} />
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
            }} className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: 'var(--zet-bg)', color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}
              data-testid="highlight-remove" title="Kaldır">
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
