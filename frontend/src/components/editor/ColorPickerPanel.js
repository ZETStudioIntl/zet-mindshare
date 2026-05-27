import React, { useContext, useState, useRef } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { DraggablePanel } from './DraggablePanel';
import { PRESET_COLORS } from '../../lib/editorConstants';
import { X, Highlighter, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { savePreference } from '../../lib/preferences';

const LS_KEY = 'zet_saved_gradients';

const multiRadialCss = (stops) => {
  if (!stops || stops.length === 0) return '#ffffff';
  if (stops.length === 1) return stops[0].color;
  const layers = stops.map(s =>
    `radial-gradient(circle at ${Math.round(s.x ?? 50)}% ${Math.round(s.y ?? 50)}%, ${s.color} 0%, transparent 100%)`
  );
  return [...layers, stops[stops.length - 1].color].join(', ');
};

const gradientToCss = (g) => multiRadialCss(g.stops);

const getElCategory = (el) => {
  if (el.type === 'text') return 'text';
  if (el.svgContent) return 'vector';
  return 'shape';
};

const ColorPickerPanel = () => {
  const { t } = useLanguage();
  const {
    isMobile, showColor, setShowColor,
    applyColor, currentColor, hexInput, setHexInput, customColor, setCustomColor,
    highlighterColor, setHighlighterColor,
    selectedElement, selectedElements, lastSelectedRef, setCanvasElements, handleSaveHistory,
  } = useContext(EditorStateContext);

  const [savedGradients, setSavedGradients] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
  });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingNameId, setEditingNameId] = useState(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [showEditor, setShowEditor] = useState(false);
  const [editStops, setEditStops] = useState([]);
  const [editCenter, setEditCenter] = useState({ x: 50, y: 50 });
  const [activeStopId, setActiveStopId] = useState(null);
  const [rightClickId, setRightClickId] = useState(null);
  const rectRef = useRef(null);
  const doubleTapRef = useRef({ time: 0, id: null });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [applyTargets, setApplyTargets] = useState(['text', 'shape', 'vector']);

  if (!showColor) return null;

  const toggleTarget = (type) => {
    setApplyTargets(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const getTargetIds = () => {
    const sel = (selectedElements || []).length > 0
      ? selectedElements
      : selectedElement ? [selectedElement]
      : lastSelectedRef?.current ? [lastSelectedRef.current]
      : null;
    return sel;
  };

  const applyColorToTargets = (color) => {
    const targets = getTargetIds();
    if (!targets) { applyColor(color); return; }
    setCanvasElements(prev => {
      const updated = prev.map(el => {
        if (!targets.includes(el.id)) return el;
        if (!applyTargets.includes(getElCategory(el))) return el;
        return { ...el, color, fill: color, gradientStops: null };
      });
      handleSaveHistory(updated);
      return updated;
    });
    setHexInput(color);
  };

  const applyGradientFromSaved = (g) => {
    const targets = getTargetIds();
    if (!targets) return;
    const rawStops = (g.stops || []);
    const stops = rawStops.map(s => ({
      id: s.id, color: s.color,
      stopX: Math.round(s.x ?? 50), stopY: Math.round(s.y ?? 50),
    }));
    const firstColor = stops[0]?.color || '#000000';
    setCanvasElements(prev => {
      const updated = prev.map(el => {
        if (!targets.includes(el.id)) return el;
        if (!applyTargets.includes(getElCategory(el))) return el;
        if (el.type === 'text') {
          return { ...el, color: firstColor, fill: firstColor, gradientStops: null };
        }
        return {
          ...el,
          gradientStops: stops, gradientType: 'radial-multi',
          gradientCenterX: undefined, gradientCenterY: undefined,
          gradientAngle: undefined, gradientStart: undefined, gradientEnd: undefined,
          color: null, fill: null,
        };
      });
      handleSaveHistory(updated);
      return updated;
    });
  };

  const handleRectClick = (e) => {
    if (!rectRef.current) return;
    const rect = rectRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    const id = `es_${Date.now()}`;
    setEditStops(prev => [...prev, { id, x, y, color: '#ffffff' }]);
    setActiveStopId(id);
    setRightClickId(null);
  };

  const startDrag = (e, stopId) => {
    e.preventDefault(); e.stopPropagation();
    setActiveStopId(stopId); setRightClickId(null);
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

  const handleStopRightClick = (e, stopId) => {
    e.preventDefault(); e.stopPropagation();
    setActiveStopId(stopId);
    setRightClickId(prev => prev === stopId ? null : stopId);
  };

  const setStopColor = (stopId, color) => setEditStops(prev => prev.map(s => s.id === stopId ? { ...s, color } : s));
  const deleteStop = (stopId) => { setEditStops(prev => prev.filter(s => s.id !== stopId)); setRightClickId(null); setActiveStopId(null); };

  const saveGradient = () => {
    if (editStops.length === 0) return;
    const name = `Gradient ${savedGradients.length + 1}`;
    const newG = { id: `grad_${Date.now()}`, name, stops: editStops, centerX: editCenter.x, centerY: editCenter.y };
    const updated = [...savedGradients, newG];
    savePreference(LS_KEY, JSON.stringify(updated));
    setSavedGradients(updated);
    setShowEditor(false);
    setEditStops([]); setEditCenter({ x: 50, y: 50 }); setRightClickId(null);
    applyGradientFromSaved(newG);
  };

  const startRename = (g) => { setEditingNameId(g.id); setEditingNameValue(g.name); setOpenMenuId(null); };
  const commitRename = (id) => {
    if (!editingNameValue.trim()) { setEditingNameId(null); return; }
    const updated = savedGradients.map(x => x.id === id ? { ...x, name: editingNameValue.trim() } : x);
    savePreference(LS_KEY, JSON.stringify(updated));
    setSavedGradients(updated); setEditingNameId(null);
  };

  const startDelete = (id) => { setConfirmDeleteId(id); setOpenMenuId(null); };
  const deleteGradient = (id) => {
    const updated = savedGradients.filter(x => x.id !== id);
    savePreference(LS_KEY, JSON.stringify(updated));
    setSavedGradients(updated); setConfirmDeleteId(null);
  };

  const editorCss = multiRadialCss(editStops);

  return (
    <DraggablePanel title={t('colorPicker')} onClose={() => setShowColor(false)} initialPosition={{ x: isMobile ? 20 : 320, y: 150 }}>
      <div className="space-y-3 w-72" onClick={() => { setOpenMenuId(null); setEditingNameId(null); }}>

        {/* Preset colors */}
        <div className="grid grid-cols-8 gap-1">
          {PRESET_COLORS.map(c => (
            <button key={c} onClick={() => applyColorToTargets(c)}
              className={`w-8 h-8 rounded-md border transition-transform ${currentColor === c ? 'ring-2 ring-white scale-110' : 'border-white/10'}`}
              style={{ background: c }} />
          ))}
        </div>

        {/* Hex + color picker */}
        <div className="flex gap-2 items-center">
          <input type="text" value={hexInput} onChange={e => setHexInput(e.target.value)} placeholder="#000000"
            className="zet-input flex-1 text-xs font-mono" maxLength={7} />
          <button onClick={() => { if (/^#[0-9A-Fa-f]{6}$/.test(hexInput)) applyColorToTargets(hexInput); }}
            className="zet-btn px-2 text-xs">OK</button>
          <input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); applyColorToTargets(e.target.value); }}
            className="h-8 w-10 rounded cursor-pointer" style={{ padding: 2, border: '1px solid var(--zet-border)' }} />
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

        {/* Gelişmiş Ayarlar */}
        <div className="border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="w-full flex items-center justify-between py-2 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--zet-text-muted)' }}>
            <span>Gelişmiş Ayarlar</span>
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showAdvanced && (
            <div className="space-y-3 pb-1">

              {/* Uygulama hedefleri */}
              <div className="flex gap-3">
                {[['text', 'Yazılar'], ['shape', 'Şekiller'], ['vector', 'Vektörler']].map(([type, label]) => (
                  <label key={type} className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={applyTargets.includes(type)}
                      onChange={() => toggleTarget(type)}
                      className="rounded"
                      style={{ accentColor: 'var(--zet-primary)' }}
                    />
                    <span className="text-xs" style={{ color: 'var(--zet-text)' }}>{label}</span>
                  </label>
                ))}
              </div>

              {/* Kayıtlı gradientler */}
              {savedGradients.length > 0 && (
                <div className="space-y-1.5">
                  {savedGradients.map(g => (
                    <div key={g.id}>
                      {confirmDeleteId === g.id ? (
                        <div className="flex items-center gap-2 px-1 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <span className="flex-1 text-xs" style={{ color: 'var(--zet-text-muted)' }}>"{g.name}" silinsin mi?</span>
                          <button onClick={() => deleteGradient(g.id)} className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: '#ef4444', color: '#fff' }}>Evet</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}>Hayır</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => applyGradientFromSaved(g)} title="Uygula"
                            style={{ width: 56, height: 22, borderRadius: 4, flexShrink: 0, background: gradientToCss(g), border: '1px solid var(--zet-border)' }} />
                          {editingNameId === g.id ? (
                            <input autoFocus type="text" value={editingNameValue}
                              onChange={e => setEditingNameValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') commitRename(g.id); if (e.key === 'Escape') setEditingNameId(null); }}
                              onBlur={() => commitRename(g.id)}
                              className="flex-1 text-xs zet-input"
                              onClick={e => e.stopPropagation()} />
                          ) : (
                            <span className="flex-1 text-xs truncate" style={{ color: 'var(--zet-text)' }}>{g.name}</span>
                          )}
                          <div className="relative" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setOpenMenuId(openMenuId === g.id ? null : g.id)}
                              className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10"
                              style={{ color: 'var(--zet-text)', background: 'var(--zet-bg)', border: '1px solid var(--zet-border)' }}>
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                            {openMenuId === g.id && (
                              <div className="absolute right-0 top-full mt-0.5 z-50 rounded-lg shadow-xl overflow-hidden"
                                style={{ background: 'var(--zet-bg-card, #1e1e2e)', border: '1px solid var(--zet-border)', minWidth: 128, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
                                <button onClick={() => { applyGradientFromSaved(g); setOpenMenuId(null); }}
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 font-medium" style={{ color: 'var(--zet-primary)' }}>
                                  Kullan
                                </button>
                                <button onClick={() => startRename(g)}
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/10" style={{ color: 'var(--zet-text)' }}>
                                  İsim Değiştir
                                </button>
                                <button onClick={() => startDelete(g.id)}
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/10" style={{ color: '#ef4444' }}>
                                  Sil
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Gradient editörü */}
              {showEditor ? (
                <div className="space-y-2">
                  <div ref={rectRef} onClick={handleRectClick}
                    style={{ position: 'relative', width: '100%', height: 140, borderRadius: 6, background: editorCss, border: '1px solid var(--zet-border)', cursor: 'crosshair', userSelect: 'none', overflow: 'hidden' }}>
                    {editStops.map(stop => {
                      const isActive = activeStopId === stop.id;
                      const isRightClicked = rightClickId === stop.id;
                      return (
                        <React.Fragment key={stop.id}>
                          <div
                            style={{ position: 'absolute', left: `${stop.x}%`, top: `${stop.y}%`, transform: 'translate(-50%, -50%)', width: 18, height: 18, borderRadius: '50%', background: stop.color, border: `2.5px solid ${isActive ? '#fff' : 'rgba(255,255,255,0.6)'}`, boxShadow: isActive ? '0 0 0 1.5px #000, 0 2px 6px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.5)', cursor: 'grab', zIndex: isActive ? 10 : 5 }}
                            onMouseDown={e => startDrag(e, stop.id)}
                            onContextMenu={e => handleStopRightClick(e, stop.id)}
                            onTouchEnd={e => {
                              e.preventDefault();
                              const now = Date.now();
                              const dt = doubleTapRef.current;
                              if (dt.id === stop.id && (now - dt.time) < 300) { doubleTapRef.current = { time: 0, id: null }; handleStopRightClick(e, stop.id); }
                              else { doubleTapRef.current = { time: now, id: stop.id }; }
                            }}
                            onClick={e => e.stopPropagation()} />
                          {isRightClicked && (
                            <div
                              style={{ position: 'absolute', left: stop.x > 65 ? 'auto' : `calc(${stop.x}% + 14px)`, right: stop.x > 65 ? `calc(${100 - stop.x}% + 14px)` : 'auto', top: stop.y > 60 ? 'auto' : `calc(${stop.y}% + 14px)`, bottom: stop.y > 60 ? `calc(${100 - stop.y}% + 14px)` : 'auto', background: 'var(--zet-bg-card, #1e1e2e)', border: '1px solid var(--zet-border)', borderRadius: 8, padding: '8px 8px 6px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.6)' }}
                              onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5">
                                <input type="color" value={stop.color} onChange={e => setStopColor(stop.id, e.target.value)}
                                  style={{ width: 30, height: 26, padding: 2, border: '1px solid var(--zet-border)', borderRadius: 4, cursor: 'pointer' }} />
                                <input type="text" value={stop.color}
                                  onChange={e => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) setStopColor(stop.id, e.target.value); }}
                                  className="zet-input text-xs font-mono" style={{ width: 68 }} maxLength={7} />
                              </div>
                              <button onClick={() => deleteStop(stop.id)} className="text-xs px-2 py-0.5 rounded text-left" style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>Sil</button>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>
                    {isMobile ? 'Dokun → renk ekle · Çift dokun → renk seç / sil' : 'Sol tık → renk ekle · Sağ tık → renk seç / sil'}
                  </p>
                  <div className="flex gap-1.5">
                    <button onClick={() => { setShowEditor(false); setEditStops([]); setEditCenter({ x: 50, y: 50 }); setRightClickId(null); }}
                      className="flex-1 text-xs py-1.5 rounded" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}>
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
                <button onClick={() => { setShowEditor(true); setEditStops([]); setEditCenter({ x: 50, y: 50 }); setRightClickId(null); }}
                  className="w-full text-xs py-2 rounded font-medium transition-colors hover:bg-white/5"
                  style={{ background: 'var(--zet-bg)', color: 'var(--zet-text)', border: '1px solid var(--zet-border)' }}>
                  + Gradient Renk Oluştur
                </button>
              )}

            </div>
          )}
        </div>

      </div>
    </DraggablePanel>
  );
};

export default ColorPickerPanel;
