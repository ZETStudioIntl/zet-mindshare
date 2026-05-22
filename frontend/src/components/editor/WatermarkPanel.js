import React from 'react';
import { DraggablePanel } from './DraggablePanel';

const WatermarkPanel = ({ watermarkText, setWatermarkText, watermarkOpacity, setWatermarkOpacity, watermarkColor, setWatermarkColor, applyWatermark, isMobile, onClose }) => (
  <DraggablePanel title="Watermark" onClose={onClose} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
    <div className="w-56 space-y-3">
      <input type="text" value={watermarkText} onChange={e => setWatermarkText(e.target.value)} placeholder="Watermark text" className="zet-input text-xs w-full" />
      <div>
        <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Opacity: {watermarkOpacity}%</label>
        <input type="range" min="5" max="50" value={watermarkOpacity} onChange={e => setWatermarkOpacity(Number(e.target.value))} className="w-full accent-blue-500" />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Renk</label>
        <input type="color" value={watermarkColor} onChange={e => setWatermarkColor(e.target.value)} className="w-8 h-7 rounded cursor-pointer border-0" />
        <div className="flex-1 h-5 rounded text-xs flex items-center px-2" style={{ background: watermarkColor, color: watermarkColor === '#ffffff' ? '#000' : '#fff', fontSize: 10 }}>örnek</div>
      </div>
      <button onClick={applyWatermark} className="zet-btn w-full">Apply Watermark</button>
    </div>
  </DraggablePanel>
);

export default WatermarkPanel;
