import React from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { DraggablePanel } from './DraggablePanel';

const FORMATS = [
  { id: 'pdf',  label: 'PDF Document',       sub: 'Best for printing & sharing',      color: '#e74c3c', short: 'PDF' },
  { id: 'png',  label: 'PNG Image',           sub: 'High quality, transparent background', color: '#3498db', short: 'PNG' },
  { id: 'jpeg', label: 'JPEG Image',          sub: 'Smaller file size, web optimized', color: '#27ae60', short: 'JPG' },
  { id: 'svg',  label: 'SVG Vector',          sub: 'Scalable, editable graphics',      color: '#9b59b6', short: 'SVG' },
];

const ExportPanel = ({ handleExport, exporting, exportQuality, setExportQuality, importFromMS, isMobile, onClose }) => (
  <DraggablePanel title="Export Document" onClose={onClose} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
    <div className="w-72 space-y-3">
      <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Choose export format:</p>
      <div className="space-y-2">
        {FORMATS.map(f => (
          <button key={f.id} onClick={() => handleExport(f.id)} disabled={exporting} className="w-full p-3 rounded text-left hover:bg-white/5 transition-colors flex items-center gap-3" style={{ background: 'var(--zet-bg)' }}>
            <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ background: f.color }}>
              <span className="text-white text-xs font-bold">{f.short}</span>
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>{f.label}</div>
              <div className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{f.sub}</div>
            </div>
          </button>
        ))}
        <button data-testid="export-ms-btn" onClick={() => handleExport('ms')} disabled={exporting} className="w-full p-3 rounded text-left hover:bg-white/5 transition-colors flex items-center gap-3" style={{ background: 'var(--zet-bg)' }}>
          <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1a1a2e, #4ca8ad)' }}>
            <span className="text-white text-xs font-bold">.ms</span>
          </div>
          <div>
            <div className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>Mindshare (.ms)</div>
            <div className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>ZET Mindshare native format</div>
          </div>
        </button>
      </div>
      <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
        <label className="text-xs block mb-2" style={{ color: 'var(--zet-text-muted)' }}>Image Quality</label>
        <div className="grid grid-cols-3 gap-1">
          {['low', 'medium', 'high'].map(q => (
            <button key={q} onClick={() => setExportQuality(q)} className={`p-1.5 rounded text-xs capitalize ${exportQuality === q ? 'glow-sm' : ''}`} style={{ background: exportQuality === q ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}>{q}</button>
          ))}
        </div>
      </div>
      <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
        <label className="text-xs block mb-2" style={{ color: 'var(--zet-text-muted)' }}>Import Project</label>
        <input data-testid="import-ms-input" type="file" accept=".ms" onChange={e => { if (e.target.files[0]) importFromMS(e.target.files[0]); }} className="hidden" id="import-ms" />
        <label htmlFor="import-ms" data-testid="import-ms-btn" className="zet-btn w-full flex items-center justify-center gap-2 py-2 cursor-pointer" style={{ background: 'linear-gradient(135deg, #1a1a2e, #4ca8ad)' }}>
          <Upload className="h-4 w-4" /> Open .ms File
        </label>
      </div>
      {exporting && <div className="text-center py-2"><Loader2 className="h-5 w-5 animate-spin mx-auto" style={{ color: 'var(--zet-primary-light)' }} /></div>}
    </div>
  </DraggablePanel>
);

export default ExportPanel;
