import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';

const MagnifierPanel = () => {
  const {
    isMobile, showZoom, setShowZoom,
    zoomLevel, setZoomLevel, zoomRadius, setZoomRadius,
    useMagnifierGradient, setUseMagnifierGradient,
    magnifierBorderColor, setMagnifierBorderColor,
    magnifierGradientStart, setMagnifierGradientStart,
    magnifierGradientEnd, setMagnifierGradientEnd,
    setActiveTool,
  } = useContext(EditorStateContext);
  if (!showZoom) return null;
  return (
    <DraggablePanel title="🔍 Büyüteç Aracı" onClose={() => setShowZoom(false)} initialPosition={{ x: isMobile ? 20 : 320, y: 200 }}>
      <div className="space-y-3 w-64">
        {/* Zoom level */}
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Büyütme: <strong style={{ color: 'var(--zet-text)' }}>{zoomLevel}×</strong></label>
          <input type="range" min="1.5" max="8" step="0.5" value={zoomLevel} onChange={e => setZoomLevel(parseFloat(e.target.value))} className="w-full" />
          <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--zet-text-muted)' }}><span>1.5×</span><span>8×</span></div>
        </div>
        {/* Radius */}
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Lens Boyutu: <strong style={{ color: 'var(--zet-text)' }}>{zoomRadius}px</strong></label>
          <input type="range" min="40" max="200" step="10" value={zoomRadius} onChange={e => setZoomRadius(parseInt(e.target.value))} className="w-full" />
          <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--zet-text-muted)' }}><span>40px</span><span>200px</span></div>
        </div>
        {/* Border color / gradient */}
        <div className="border-t pt-3" style={{ borderColor: 'var(--zet-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium" style={{ color: 'var(--zet-text)' }}>Lens Rengi</label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={useMagnifierGradient} onChange={e => setUseMagnifierGradient(e.target.checked)} className="w-3 h-3 cursor-pointer" />
              <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Gradient</span>
            </label>
          </div>
          {!useMagnifierGradient ? (
            <div className="flex items-center gap-2">
              <input type="color" value={magnifierBorderColor} onChange={e => setMagnifierBorderColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" style={{ border: 'none', padding: 0 }} />
              <input type="text" value={magnifierBorderColor} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setMagnifierBorderColor(e.target.value); }} className="zet-input text-xs flex-1" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs w-14 flex-shrink-0" style={{ color: 'var(--zet-text-muted)' }}>Başlangıç</span>
                <input type="color" value={magnifierGradientStart} onChange={e => setMagnifierGradientStart(e.target.value)} className="w-7 h-7 rounded cursor-pointer" style={{ border: 'none', padding: 0 }} />
                <input type="text" value={magnifierGradientStart} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setMagnifierGradientStart(e.target.value); }} className="zet-input text-xs flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-14 flex-shrink-0" style={{ color: 'var(--zet-text-muted)' }}>Bitiş</span>
                <input type="color" value={magnifierGradientEnd} onChange={e => setMagnifierGradientEnd(e.target.value)} className="w-7 h-7 rounded cursor-pointer" style={{ border: 'none', padding: 0 }} />
                <input type="text" value={magnifierGradientEnd} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setMagnifierGradientEnd(e.target.value); }} className="zet-input text-xs flex-1" />
              </div>
              {/* Gradient presets */}
              <div className="flex gap-1.5 flex-wrap pt-1">
                {[
                  { name: 'Sunset', s: '#ff7e5f', e: '#feb47b' },
                  { name: 'Ocean', s: '#2193b0', e: '#6dd5ed' },
                  { name: 'Purple', s: '#7f00ff', e: '#e100ff' },
                  { name: 'Green', s: '#11998e', e: '#38ef7d' },
                  { name: 'Fire', s: '#f12711', e: '#f5af19' },
                  { name: 'Night', s: '#0f0c29', e: '#302b63' },
                  { name: 'Pink', s: '#f953c6', e: '#b91d73' },
                  { name: 'Aqua', s: '#13547a', e: '#80d0c7' },
                  { name: 'Gold', s: '#f7971e', e: '#ffd200' },
                  { name: 'Neon', s: '#00f260', e: '#0575e6' },
                ].map(p => (
                  <button key={p.name} onClick={() => { setMagnifierGradientStart(p.s); setMagnifierGradientEnd(p.e); }}
                    className="w-6 h-6 rounded-full" title={p.name}
                    style={{ background: `linear-gradient(135deg, ${p.s}, ${p.e})`, border: '2px solid rgba(255,255,255,0.2)' }} />
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Preview */}
        <div className="flex items-center justify-center py-1">
          <div className="rounded-full flex items-center justify-center" style={{
            width: Math.min(zoomRadius, 80) * 2, height: Math.min(zoomRadius, 80) * 2,
            maxWidth: 160, maxHeight: 160,
            background: useMagnifierGradient
              ? `linear-gradient(135deg, ${magnifierGradientStart}, ${magnifierGradientEnd})`
              : magnifierBorderColor,
            padding: '3px',
          }}>
            <div className="rounded-full flex items-center justify-center w-full h-full" style={{ background: 'var(--zet-bg-card)' }}>
              <span className="font-bold text-sm" style={{ color: useMagnifierGradient ? magnifierGradientStart : magnifierBorderColor }}>{zoomLevel}×</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-center" style={{ color: 'var(--zet-text-muted)' }}>Tuval üzerinde fareyi hareket ettir — lens o noktayı büyütür.</p>
        <button onClick={() => { setActiveTool('zoom'); setShowZoom(false); }} className="zet-btn w-full text-sm" style={{ background: 'var(--zet-primary)' }}>
          Lensi Etkinleştir
        </button>
      </div>
    </DraggablePanel>
  );
};

export default MagnifierPanel;
